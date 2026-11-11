import { Router } from "express";
import { z } from "zod";
import { prisma } from "../lib/prisma.ts";
import { AppError, sendSuccess } from "../lib/response.ts";
import { requireAuth, type AuthenticatedRequest } from "../middleware/auth.ts";
import { createRateLimiter } from "../middleware/rateLimit.ts";
import {
  getDailyActivityAndSedentaryTotals,
  toUtcDateOnly,
} from "../services/dailyAggregation.ts";
import {
  checkOllamaStatus,
  generateClinicalWellbeingInsight,
} from "../services/ollamaCoach.ts";

export const aiCoachRouter = Router();

const generateCoachBodySchema = z.object({
  notes: z.string().trim().max(500).optional(),
});

const aiGenerateLimiter = createRateLimiter({
  windowMs: 60_000,
  maxRequests: 10,
  keyPrefix: "ai-coach-generate",
  message: "Terlalu banyak permintaan analisis AI Coach. Tunggu sebentar sebelum mencoba lagi.",
});

aiCoachRouter.get("/status", requireAuth, async (_req, res) => {
  const status = await checkOllamaStatus();
  sendSuccess(res, status);
});

aiCoachRouter.get("/history", requireAuth, async (req: AuthenticatedRequest, res) => {
  const limit = Math.min(50, Math.max(1, Number(req.query.limit ?? 20)));
  const history = await prisma.aiCoachingInsight.findMany({
    where: { userId: req.user!.sub },
    orderBy: { createdAt: "desc" },
    take: limit,
  });
  sendSuccess(res, history);
});

aiCoachRouter.post(
  "/generate",
  requireAuth,
  aiGenerateLimiter,
  async (req: AuthenticatedRequest, res) => {
  const userId = req.user!.sub;
  let userNotes: string | null = null;
  if (req.body && typeof req.body === "object" && Object.keys(req.body).length > 0) {
    const parsedBody = generateCoachBodySchema.safeParse(req.body);
    if (!parsedBody.success) {
      throw new AppError(400, "VALIDATION_ERROR", "Format input catatan AI Coach tidak valid.", {
        issues: parsedBody.error.flatten(),
      });
    }
    userNotes = parsedBody.data.notes ?? null;
  }

  const todayStart = toUtcDateOnly(new Date());
  const todayIso = todayStart.toISOString().slice(0, 10);
  const since7Days = new Date(todayStart);
  since7Days.setUTCDate(since7Days.getUTCDate() - 6);

  const [logs, latestAssessment, recentInsights, todayTotals] = await Promise.all([
    prisma.dailyWellbeingLog.findMany({
      where: { userId, logDate: { gte: since7Days } },
      orderBy: { logDate: "asc" },
    }),
    prisma.clinicalAssessment.findFirst({
      where: { userId },
      orderBy: { assessmentDate: "desc" },
    }),
    prisma.aiCoachingInsight.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      take: 5,
    }),
    getDailyActivityAndSedentaryTotals(userId, todayStart),
  ]);

  const todayLog = logs.find((log) => log.logDate.toISOString().slice(0, 10) === todayIso);
  const totalSedentaryHours = Math.max(
    todayTotals.totalSedentaryHours,
    todayLog?.totalSedentaryHours ?? 0
  );
  const totalMvpaMinutes = Math.max(
    todayTotals.totalMvpaMinutes,
    todayLog?.totalMvpaMinutes ?? 0
  );
  const mvpaPerSedentaryRatio =
    todayLog?.mvpaPerSedentaryRatio ??
    (totalSedentaryHours > 0
      ? Number((totalMvpaMinutes / totalSedentaryHours).toFixed(2))
      : totalMvpaMinutes);

  const telemetryInput = {
    today: {
      totalSedentaryHours,
      totalMvpaMinutes,
      mvpaPerSedentaryRatio,
      sleepHours: todayLog ? todayLog.sleepHours : null,
      sleepQualityScore: todayLog ? todayLog.sleepQualityScore : null,
      pss4TotalScore: todayLog ? todayLog.pss4TotalScore : null,
      triadPillarsMet: todayLog ? todayLog.triadPillarsMet : 0,
    },
    history7Days: logs.map((log) => ({
      logDate: log.logDate.toISOString().slice(0, 10),
      totalSedentaryHours: log.totalSedentaryHours,
      totalMvpaMinutes: log.totalMvpaMinutes,
      sleepHours: log.sleepHours,
      pss4TotalScore: log.pss4TotalScore,
      triadPillarsMet: log.triadPillarsMet,
    })),
    latestPss10Score: latestAssessment?.totalScore ?? null,
    userNotes,
    recentInsights: recentInsights.map((item) => ({
      isCompleted: Boolean(item.isCompleted),
      recommendedMetsToday:
        typeof item.recommendedMetsToday === "number" ? item.recommendedMetsToday : undefined,
      createdAt: item.createdAt ? new Date(item.createdAt).toISOString() : undefined,
    })),
  };

  const { insight, source, model, escalationFlag } =
    await generateClinicalWellbeingInsight(telemetryInput);

  const saved = await prisma.aiCoachingInsight.create({
    data: {
      userId,
      dominantMediator: insight.dominantMediator,
      diagnosisSummary: insight.diagnosisSummary,
      isotemporalActionPlan: insight.isotemporalActionPlan,
      recommendedMetsToday: insight.recommendedMetsToday,
      scientificCitationNote: insight.scientificCitationNote,
    },
  });

  sendSuccess(res, { ...saved, generationSource: source, model, escalationFlag }, 201);
});

aiCoachRouter.get("/latest", requireAuth, async (req: AuthenticatedRequest, res) => {
  const latest = await prisma.aiCoachingInsight.findFirst({
    where: { userId: req.user!.sub },
    orderBy: { createdAt: "desc" },
  });

  if (!latest) {
    throw new AppError(404, "NOT_FOUND", "Belum ada insight AI Coach yang dibuat.");
  }
  sendSuccess(res, latest);
});

aiCoachRouter.patch("/:id/complete", requireAuth, async (req: AuthenticatedRequest, res) => {
  const userId = req.user!.sub;
  const insightId = String(req.params.id);

  const existing = await prisma.aiCoachingInsight.findFirst({
    where: { id: insightId, userId },
  });
  if (!existing) {
    throw new AppError(404, "NOT_FOUND", "Insight AI Coach tidak ditemukan.");
  }

  const updated = await prisma.aiCoachingInsight.update({
    where: { id: existing.id },
    data: { isCompleted: true },
  });

  if (!existing.isCompleted) {
    await prisma.user.update({
      where: { id: userId },
      data: { xpPoints: { increment: 50 } },
    });
  }

  sendSuccess(res, updated);
});

