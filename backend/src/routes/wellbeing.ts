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

export const wellbeingRouter = Router();
export const assessmentsRouter = Router();

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

  sendSuccess(
    res,
    { ...saved, sedentaryRiskStatus: triad.sedentaryRiskStatus, currentStreakDays },
    201
  );
}

wellbeingRouter.post("/daily", requireAuth, handleSubmitDailyWellbeing);
wellbeingRouter.post("/checkin", requireAuth, handleSubmitDailyWellbeing);

/**
 * GET /api/v1/wellbeing/today
 * Mengambil status check-in wellbeing harian (PSS-4 & tidur) milik user hari ini.
 */
wellbeingRouter.get("/today", requireAuth, async (req: AuthenticatedRequest, res) => {
  const userId = req.user!.sub;
  const todayStr = new Date().toISOString().slice(0, 10);
  const logDate = new Date(`${todayStr}T00:00:00.000Z`);

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
