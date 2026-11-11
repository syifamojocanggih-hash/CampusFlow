import { Router } from "express";
import { z } from "zod";
import { prisma } from "../lib/prisma.ts";
import { sendSuccess } from "../lib/response.ts";
import { requireAuth, type AuthenticatedRequest } from "../middleware/auth.ts";
import {
  calculatePss10Score,
  calculatePss4Score,
  classifyPss10Severity,
  classifyPss4Severity,
  evaluate24HourTriad,
} from "../services/clinicalScoring.ts";
import { toUtcDateOnly } from "../services/dailyAggregation.ts";

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

wellbeingRouter.post("/daily", requireAuth, async (req: AuthenticatedRequest, res) => {
  const body = dailyWellbeingSchema.parse(req.body);
  const userId = req.user!.sub;
  const logDate = toUtcDateOnly(body.logDate);
  const dayEnd = new Date(logDate.getTime() + 24 * 60 * 60 * 1000);

  const [sedentaryAgg, activityAgg] = await Promise.all([
    prisma.sedentarySession.aggregate({
      where: { userId, startTime: { gte: logDate, lt: dayEnd } },
      _sum: { durationMinutes: true },
    }),
    prisma.physicalActivity.aggregate({
      where: { userId, activityDate: logDate },
      _sum: { durationMinutes: true },
    }),
  ]);

  const totalSedentaryHours = Number(((sedentaryAgg._sum.durationMinutes ?? 0) / 60).toFixed(2));
  const totalMvpaMinutes = activityAgg._sum.durationMinutes ?? 0;

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

  sendSuccess(res, { ...saved, sedentaryRiskStatus: triad.sedentaryRiskStatus }, 201);
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
