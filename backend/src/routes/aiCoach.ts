import { Router } from "express";
import { prisma } from "../lib/prisma.ts";
import { AppError, sendSuccess } from "../lib/response.ts";
import { requireAuth, type AuthenticatedRequest } from "../middleware/auth.ts";
import { generateClinicalWellbeingInsight } from "../services/ollamaCoach.ts";

export const aiCoachRouter = Router();

aiCoachRouter.post("/generate", requireAuth, async (req: AuthenticatedRequest, res) => {
  const userId = req.user!.sub;
  const since7Days = new Date();
  since7Days.setUTCHours(0, 0, 0, 0);
  since7Days.setUTCDate(since7Days.getUTCDate() - 6);

  const [logs, latestAssessment] = await Promise.all([
    prisma.dailyWellbeingLog.findMany({
      where: { userId, logDate: { gte: since7Days } },
      orderBy: { logDate: "asc" },
    }),
    prisma.clinicalAssessment.findFirst({
      where: { userId },
      orderBy: { assessmentDate: "desc" },
    }),
  ]);

  const latest = logs.at(-1);
  const telemetryInput = {
    today: {
      totalSedentaryHours: latest?.totalSedentaryHours ?? 0,
      totalMvpaMinutes: latest?.totalMvpaMinutes ?? 0,
      mvpaPerSedentaryRatio: latest?.mvpaPerSedentaryRatio ?? 0,
      sleepHours: latest?.sleepHours ?? 7,
      sleepQualityScore: latest?.sleepQualityScore ?? 3,
      pss4TotalScore: latest?.pss4TotalScore ?? 4,
      triadPillarsMet: latest?.triadPillarsMet ?? 0,
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
  };

  const { insight, source, model } = await generateClinicalWellbeingInsight(telemetryInput);

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

  sendSuccess(res, { ...saved, generationSource: source, model }, 201);
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

