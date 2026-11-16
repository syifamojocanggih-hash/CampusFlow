import { Router, type Response, type NextFunction } from "express";
import { z } from "zod";
import { prisma } from "../lib/prisma.ts";
import { sendSuccess } from "../lib/response.ts";
import { requireAuth, type AuthenticatedRequest } from "../middleware/auth.ts";
import { calculateBurnoutRiskIndex } from "../services/burnoutScoring.ts";

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
    const today = new Date();
    today.setHours(0, 0, 0, 0);

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

    // Jika belum ada log tersimpan, hitung estimasi berdasarkan jadwal kuliah hari ini
    const dayOfWeek = today.getDay() === 0 ? 7 : today.getDay(); // 1 = Senin, ... 7 = Minggu
    const schedules = await prisma.academicSchedule.findMany({
      where: { userId, dayOfWeek },
    });

    const activeBreaksCount = await prisma.activeBreakSession.count({
      where: {
        userId,
        startTime: { gte: today },
        poseVerified: true,
      },
    });

    // Default estimasi awal hari: tidur 7 jam, screen time 0
    const calc = calculateBurnoutRiskIndex(
      schedules.map((s) => ({
        creditHours: s.creditHours,
        isPracticum: s.isPracticum,
        isExamWeek: s.isExamWeek,
      })),
      0, // screen time hours awal
      7.0, // default sleep
      activeBreaksCount
    );

    return sendSuccess(res, {
      logDate: today.toISOString().split("T")[0],
      totalScreenTimeMins: 0,
      sleepHours: 7.0,
      academicLoadScore: calc.academicLoadScore,
      screenFatigueScore: calc.screenFatigueScore,
      recoveryScore: calc.recoveryScore,
      verifiedBreakCount: activeBreaksCount,
      burnoutIndex: calc.burnoutIndex,
      status: calc.status,
      isEstimated: true,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/v1/burnout/calculate
 * Menghitung dan menyimpan fusi harian (DailyFussionLog).
 */
burnoutRouter.post("/calculate", async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const userId = req.user!.sub;
    const parsed = calculateBurnoutPayloadSchema.parse(req.body);

    const targetDate = parsed.logDate ? new Date(parsed.logDate) : new Date();
    targetDate.setHours(0, 0, 0, 0);

    const dayOfWeek = targetDate.getDay() === 0 ? 7 : targetDate.getDay();
    const schedules = await prisma.academicSchedule.findMany({
      where: { userId, dayOfWeek },
    });

    const nextDay = new Date(targetDate);
    nextDay.setDate(nextDay.getDate() + 1);

    const verifiedBreakCount = await prisma.activeBreakSession.count({
      where: {
        userId,
        startTime: { gte: targetDate, lt: nextDay },
        poseVerified: true,
      },
    });

    const totalScreenHours = parsed.totalScreenTimeMins / 60.0;
    const calc = calculateBurnoutRiskIndex(
      schedules.map((s) => ({
        creditHours: s.creditHours,
        isPracticum: s.isPracticum,
        isExamWeek: s.isExamWeek,
      })),
      totalScreenHours,
      parsed.sleepHours,
      verifiedBreakCount
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
});
