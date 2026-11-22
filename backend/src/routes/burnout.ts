import { Router, type Response, type NextFunction } from "express";
import { z } from "zod";
import { prisma } from "../lib/prisma.ts";
import { sendSuccess } from "../lib/response.ts";
import { requireAuth, type AuthenticatedRequest } from "../middleware/auth.ts";
import { calculateBurnoutRiskIndex } from "../services/burnoutScoring.ts";
import { toUtcDateOnly } from "../services/burnoutSync.ts";

export const burnoutRouter = Router();

burnoutRouter.use(requireAuth);

const calculateBurnoutPayloadSchema = z.object({
  logDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  totalScreenTimeMins: z.coerce.number().min(0).default(0),
  sleepHours: z.coerce.number().min(0).default(7.0),
});

/**
 * GET /api/v1/burnout/today
 * Mengambil ringkasan Burnout Risk Index hari ini berdasarkan jadwal dan log fusi.
 */
burnoutRouter.get("/today", async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const userId = req.user!.sub;
    const today = toUtcDateOnly();
    const todayStr = today.toISOString().slice(0, 10);
    const localDayStart = new Date(`${todayStr}T00:00:00`);
    const localDayEnd = new Date(localDayStart);
    localDayEnd.setDate(localDayEnd.getDate() + 1);

    const existingLog = await prisma.dailyFussionLog.findUnique({
      where: {
        userId_logDate: {
          userId,
          logDate: today,
        },
      },
    });

    if (existingLog) {
      return sendSuccess(res, existingLog);
    }

    // Jika belum ada log tersimpan, hitung estimasi berdasarkan jadwal kuliah hari ini & log tidur terbaru
    const dayOfWeek = today.getUTCDay() === 0 ? 7 : today.getUTCDay(); // 1 = Senin, ... 7 = Minggu
    const [schedules, activeBreaksCount, todayWellbeing] = await Promise.all([
      prisma.academicSchedule.findMany({
        where: { userId, dayOfWeek },
      }),
      prisma.activeBreakSession.count({
        where: {
          userId,
          startTime: { gte: localDayStart, lt: localDayEnd },
          poseVerified: true,
        },
      }),
      prisma.dailyWellbeingLog.findUnique({
        where: {
          userId_logDate: {
            userId,
            logDate: today,
          },
        },
      }),
    ]);

    const detectedSleepHours = todayWellbeing?.sleepHours ?? 7.0;

    // Estimasi awal hari menggunakan jam tidur otomatis / terbaru
    const calc = calculateBurnoutRiskIndex(
      schedules.map((s) => ({
        creditHours: s.creditHours,
        isPracticum: s.isPracticum,
        classType: s.classType,
        isExamWeek: s.isExamWeek,
        examDate: s.examDate,
      })),
      0, // screen time hours awal
      detectedSleepHours,
      activeBreaksCount,
      today
    );

    return sendSuccess(res, {
      logDate: today.toISOString().split("T")[0],
      totalScreenTimeMins: 0,
      sleepHours: detectedSleepHours,
      academicLoadScore: calc.academicLoadScore,
      screenFatigueScore: calc.screenFatigueScore,
      recoveryScore: calc.recoveryScore,
      verifiedBreakCount: activeBreaksCount,
      burnoutIndex: calc.burnoutIndex,
      status: calc.status,
      isEstimated: !todayWellbeing,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * Handler bersama untuk menghitung dan menyimpan fusi harian (DailyFussionLog).
 */
async function handleCalculateBurnout(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) {
  try {
    const userId = req.user!.sub;
    const parsed = calculateBurnoutPayloadSchema.parse(req.body);

    const targetDate = toUtcDateOnly(parsed.logDate);
    const dateStr = targetDate.toISOString().slice(0, 10);

    const dayOfWeek = targetDate.getUTCDay() === 0 ? 7 : targetDate.getUTCDay();
    const schedules = await prisma.academicSchedule.findMany({
      where: { userId, dayOfWeek },
    });

    const localDayStart = new Date(`${dateStr}T00:00:00`);
    const localDayEnd = new Date(localDayStart);
    localDayEnd.setDate(localDayEnd.getDate() + 1);

    const verifiedBreakCount = await prisma.activeBreakSession.count({
      where: {
        userId,
        startTime: { gte: localDayStart, lt: localDayEnd },
        poseVerified: true,
      },
    });

    const totalScreenHours = parsed.totalScreenTimeMins / 60.0;
    const calc = calculateBurnoutRiskIndex(
      schedules.map((s) => ({
        creditHours: s.creditHours,
        isPracticum: s.isPracticum,
        classType: s.classType,
        isExamWeek: s.isExamWeek,
        examDate: s.examDate,
      })),
      totalScreenHours,
      parsed.sleepHours,
      verifiedBreakCount,
      targetDate
    );

    const log = await prisma.dailyFussionLog.upsert({
      where: {
        userId_logDate: {
          userId,
          logDate: targetDate,
        },
      },
      update: {
        totalScreenTimeMins: parsed.totalScreenTimeMins,
        sleepHours: parsed.sleepHours,
        academicLoadScore: calc.academicLoadScore,
        screenFatigueScore: calc.screenFatigueScore,
        recoveryScore: calc.recoveryScore,
        verifiedBreakCount,
        burnoutIndex: calc.burnoutIndex,
        status: calc.status,
      },
      create: {
        userId,
        logDate: targetDate,
        totalScreenTimeMins: parsed.totalScreenTimeMins,
        sleepHours: parsed.sleepHours,
        academicLoadScore: calc.academicLoadScore,
        screenFatigueScore: calc.screenFatigueScore,
        recoveryScore: calc.recoveryScore,
        verifiedBreakCount,
        burnoutIndex: calc.burnoutIndex,
        status: calc.status,
      },
    });

    sendSuccess(res, log);
  } catch (error) {
    next(error);
  }
}

/**
 * POST /api/v1/burnout/calculate
 * Menghitung dan menyimpan fusi harian (DailyFussionLog).
 */
burnoutRouter.post("/calculate", handleCalculateBurnout);

/**
 * POST /api/v1/burnout/calculate-today
 * Alias kompatibel untuk menghitung dan menyimpan fusi harian.
 */
burnoutRouter.post("/calculate-today", handleCalculateBurnout);

/**
 * GET /api/v1/burnout/history?days=14
 * Mengambil riwayat tren Burnout Risk Index (DailyFussionLog) dalam rentang hari terakhir.
 */
burnoutRouter.get("/history", async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const userId = req.user!.sub;
    const rawDays = Number(req.query.days ?? 14);
    const days = Number.isFinite(rawDays) ? Math.min(90, Math.max(1, Math.floor(rawDays))) : 14;

    const startDate = toUtcDateOnly();
    startDate.setUTCDate(startDate.getUTCDate() - (days - 1));

    const logs = await prisma.dailyFussionLog.findMany({
      where: {
        userId,
        logDate: { gte: startDate },
      },
      orderBy: { logDate: "asc" },
    });

    const items = logs.map((log) => ({
      id: log.id,
      logDate: log.logDate.toISOString().split("T")[0],
      totalScreenTimeMins: log.totalScreenTimeMins,
      sleepHours: log.sleepHours,
      academicLoadScore: log.academicLoadScore,
      screenFatigueScore: log.screenFatigueScore,
      recoveryScore: log.recoveryScore,
      verifiedBreakCount: log.verifiedBreakCount,
      burnoutIndex: log.burnoutIndex,
      status: log.status,
    }));

    const averageBurnoutIndex =
      items.length > 0
        ? Number(
            (items.reduce((sum, item) => sum + item.burnoutIndex, 0) / items.length).toFixed(2)
          )
        : 0;

    const peakBurnoutDay =
      items.length > 0
        ? items.reduce((max, item) => (item.burnoutIndex > max.burnoutIndex ? item : max), items[0])
        : null;

    const highRiskDaysCount = items.filter((item) => item.status === "HIGH").length;
    const totalVerifiedBreaks = items.reduce((sum, item) => sum + item.verifiedBreakCount, 0);

    sendSuccess(res, {
      days,
      count: items.length,
      summary: {
        averageBurnoutIndex,
        peakBurnoutDay: peakBurnoutDay
          ? {
              logDate: peakBurnoutDay.logDate,
              burnoutIndex: peakBurnoutDay.burnoutIndex,
              status: peakBurnoutDay.status,
            }
          : null,
        highRiskDaysCount,
        totalVerifiedBreaks,
      },
      items,
    });
  } catch (error) {
    next(error);
  }
});
