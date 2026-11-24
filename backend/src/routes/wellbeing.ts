import { Router, type Response } from "express";
import { z } from "zod";
import { prisma } from "../lib/prisma.ts";
import { sendSuccess } from "../lib/response.ts";
import { requireAuth, type AuthenticatedRequest } from "../middleware/auth.ts";
import {
  calculatePss10Score,
  calculatePss4Score,
  classifyPss10Severity,
  classifyPss4Severity,
  computeConsecutiveStreakDays,
  evaluate24HourTriad,
} from "../services/clinicalScoring.ts";
import { getDailyActivityAndSedentaryTotals } from "../services/dailyAggregation.ts";
import {
  computeAutoSleepRecord,
  syncAutoSleepToDatabase,
} from "../services/autoSleepService.ts";
import { recalculateTodayBurnoutLog, toUtcDateOnly } from "../services/burnoutSync.ts";

export const wellbeingRouter = Router();
export const assessmentsRouter = Router();

const autoSleepPayloadSchema = z.object({
  logDate: z.string().min(10).optional(),
  lastActiveTimestamp: z.number().positive().optional(),
  firstWakeTimestamp: z.number().positive().optional(),
  bedTime: z.string().regex(/^\d{1,2}:\d{2}$/).optional(),
  wakeTime: z.string().regex(/^\d{1,2}:\d{2}$/).optional(),
  sleepHours: z.number().min(0.5).max(24).optional(),
  sleepLatencyMins: z.number().min(0).max(180).optional(),
  source: z
    .enum([
      "OS_POWER_MONITOR",
      "OVERNIGHT_INACTIVITY",
      "WEARABLE_SYNC",
      "AI_NLP_CHAT",
      "MANUAL_OVERRIDE",
      "SMART_BASELINE",
    ])
    .optional(),
  isConfirmed: z.boolean().optional(),
});

const dailyWellbeingSchema = z.object({
  logDate: z.string().min(10),
  sleepHours: z.number().min(0).max(24),
  sleepQualityScore: z.number().int().min(1).max(5),
  nonAcademicScreenHours: z.number().min(0).max(24).default(0),
  pss4Answers: z.tuple([
    z.number().int().min(0).max(4),
    z.number().int().min(0).max(4),
    z.number().int().min(0).max(4),
    z.number().int().min(0).max(4),
  ]),
});

const pss10Schema = z.object({
  rawAnswers: z.array(z.number().int().min(0).max(4)).length(10),
  notes: z.string().max(1000).optional(),
});

async function handleSubmitDailyWellbeing(req: AuthenticatedRequest, res: Response) {
  const body = dailyWellbeingSchema.parse(req.body);
  const userId = req.user!.sub;

  const { dayStart: logDate, totalSedentaryHours, totalMvpaMinutes } =
    await getDailyActivityAndSedentaryTotals(userId, body.logDate);

  const pss4TotalScore = calculatePss4Score(body.pss4Answers);
  const stressRiskLevel = classifyPss4Severity(pss4TotalScore);
  const triad = evaluate24HourTriad({
    totalMvpaMinutes,
    sleepHours: body.sleepHours,
    sleepQualityScore: body.sleepQualityScore,
    totalSedentaryHours,
    nonAcademicScreenHours: body.nonAcademicScreenHours,
  });

  const saved = await prisma.dailyWellbeingLog.upsert({
    where: { userId_logDate: { userId, logDate } },
    update: {
      sleepHours: body.sleepHours,
      sleepQualityScore: body.sleepQualityScore,
      nonAcademicScreenHours: body.nonAcademicScreenHours,
      pss4RawAnswersJson: body.pss4Answers,
      pss4TotalScore,
      totalSedentaryHours,
      totalMvpaMinutes,
      mvpaPerSedentaryRatio: triad.mvpaPerSedentaryRatio,
      triadPillarsMet: triad.triadPillarsMet,
      stressRiskLevel,
    },
    create: {
      userId,
      logDate,
      sleepHours: body.sleepHours,
      sleepQualityScore: body.sleepQualityScore,
      nonAcademicScreenHours: body.nonAcademicScreenHours,
      pss4RawAnswersJson: body.pss4Answers,
      pss4TotalScore,
      totalSedentaryHours,
      totalMvpaMinutes,
      mvpaPerSedentaryRatio: triad.mvpaPerSedentaryRatio,
      triadPillarsMet: triad.triadPillarsMet,
      stressRiskLevel,
    },
  });

  const allRecentLogs = await prisma.dailyWellbeingLog.findMany({
    where: { userId },
    select: { logDate: true },
    orderBy: { logDate: "desc" },
    take: 60,
  });
  const anchorDate = allRecentLogs[0]?.logDate ?? logDate;
  const currentStreakDays = computeConsecutiveStreakDays(
    allRecentLogs.map((item) => item.logDate),
    anchorDate
  );

  await prisma.user.update({
    where: { id: userId },
    data: { currentStreakDays },
  });

  // Sinkronkan juga sleepHours ke DailyFussionLog & Burnout Risk Index (best-effort)
  try {
    await prisma.dailyFussionLog.upsert({
      where: { userId_logDate: { userId, logDate } },
      update: { sleepHours: body.sleepHours },
      create: {
        userId,
        logDate,
        totalScreenTimeMins: Math.round(totalSedentaryHours * 60),
        sleepHours: body.sleepHours,
        academicLoadScore: 0,
        screenFatigueScore: 0,
        recoveryScore: 0,
        verifiedBreakCount: 0,
        burnoutIndex: 0,
        status: "LOW",
      },
    });
    await recalculateTodayBurnoutLog(userId, body.logDate);
  } catch {
    // Non-fatal jika dipanggil pada lingkungan mock test yang hanya men-stub DailyWellbeingLog
  }

  sendSuccess(
    res,
    { ...saved, sedentaryRiskStatus: triad.sedentaryRiskStatus, currentStreakDays },
    201
  );
}

wellbeingRouter.post("/daily", requireAuth, handleSubmitDailyWellbeing);
wellbeingRouter.post("/checkin", requireAuth, handleSubmitDailyWellbeing);

/**
 * POST /api/v1/wellbeing/auto-sleep
 * Menerima event deteksi jam tidur otomatis (dari inaktivitas layar malam, OS power monitor,
 * wearable sync, atau simulasi bangun tidur), menghitung durasi tidur bersih & skor kualitas,
 * lalu langsung menyinkronkan ke DailyWellbeingLog & DailyFussionLog.
 */
wellbeingRouter.post("/auto-sleep", requireAuth, async (req: AuthenticatedRequest, res) => {
  const body = autoSleepPayloadSchema.parse(req.body);
  const userId = req.user!.sub;

  const record = computeAutoSleepRecord(body);
  const synced = await syncAutoSleepToDatabase(userId, record);

  sendSuccess(res, synced, 200);
});

/**
 * GET /api/v1/wellbeing/auto-sleep
 * Mengambil status deteksi jam tidur otomatis hari ini. Jika belum ada log di DB hari ini,
 * mengkalkulasi & menyinkronkan baseline deteksi otomatis agar dashboard selalu terisi.
 */
wellbeingRouter.get("/auto-sleep", requireAuth, async (req: AuthenticatedRequest, res) => {
  const userId = req.user!.sub;
  const logDate = toUtcDateOnly(new Date());
  const todayStr = logDate.toISOString().slice(0, 10);

  const existing = await prisma.dailyWellbeingLog.findUnique({
    where: { userId_logDate: { userId, logDate } },
  });

  if (existing) {
    const record = computeAutoSleepRecord({
      logDate: todayStr,
      sleepHours: existing.sleepHours,
      source: "OVERNIGHT_INACTIVITY",
      isConfirmed: true,
    });
    return sendSuccess(res, {
      autoSleep: {
        ...record,
        sleepQualityScore: existing.sleepQualityScore,
      },
      checkedInToday: true,
    });
  }

  const record = computeAutoSleepRecord({
    logDate: todayStr,
    source: "OVERNIGHT_INACTIVITY",
  });
  const synced = await syncAutoSleepToDatabase(userId, record);

  sendSuccess(res, {
    autoSleep: synced.autoSleep,
    burnoutSummary: synced.burnoutSummary,
    checkedInToday: true,
  });
});

/**
 * GET /api/v1/wellbeing/today
 * Mengambil status check-in wellbeing harian (PSS-4 & tidur) milik user hari ini.
 */
wellbeingRouter.get("/today", requireAuth, async (req: AuthenticatedRequest, res) => {
  const userId = req.user!.sub;
  const logDate = toUtcDateOnly(new Date());
  const todayStr = logDate.toISOString().slice(0, 10);

  const log = await prisma.dailyWellbeingLog.findUnique({
    where: { userId_logDate: { userId, logDate } },
  });

  sendSuccess(res, {
    logDate: todayStr,
    checkedInToday: Boolean(log),
    log,
  });
});

/**
 * GET /api/v1/wellbeing/history?days=14
 * Mengambil riwayat check-in wellbeing harian (PSS-4, tidur, triad) N hari terakhir.
 */
wellbeingRouter.get("/history", requireAuth, async (req: AuthenticatedRequest, res) => {
  const userId = req.user!.sub;
  const rawDays = Number(req.query.days ?? 14);
  const days = Number.isFinite(rawDays) ? Math.min(90, Math.max(1, Math.floor(rawDays))) : 14;

  const startDate = new Date();
  startDate.setUTCHours(0, 0, 0, 0);
  startDate.setUTCDate(startDate.getUTCDate() - (days - 1));

  const logs = await prisma.dailyWellbeingLog.findMany({
    where: {
      userId,
      logDate: { gte: startDate },
    },
    orderBy: { logDate: "asc" },
  });

  sendSuccess(res, {
    days,
    count: logs.length,
    items: logs.map((item) => ({
      ...item,
      logDate: item.logDate.toISOString().slice(0, 10),
    })),
  });
});

assessmentsRouter.get("/", requireAuth, async (req: AuthenticatedRequest, res) => {
  const assessments = await prisma.clinicalAssessment.findMany({
    where: { userId: req.user!.sub },
    orderBy: { assessmentDate: "desc" },
    take: 20,
  });
  sendSuccess(res, assessments);
});

assessmentsRouter.post("/pss10", requireAuth, async (req: AuthenticatedRequest, res) => {
  const body = pss10Schema.parse(req.body);
  const totalScore = calculatePss10Score(body.rawAnswers);
  const severityLevel = classifyPss10Severity(totalScore);

  const assessment = await prisma.clinicalAssessment.create({
    data: {
      userId: req.user!.sub,
      instrumentType: "PSS_10",
      rawAnswersJson: body.rawAnswers,
      totalScore,
      severityLevel,
      notes: body.notes,
    },
  });

  sendSuccess(res, assessment, 201);
});
