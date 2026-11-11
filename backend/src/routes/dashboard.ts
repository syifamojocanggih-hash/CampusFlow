import { Router } from "express";
import { CLINICAL_CONSTANTS } from "../../../shared/contracts/index.ts";
import { prisma } from "../lib/prisma.ts";
import { AppError, sendSuccess } from "../lib/response.ts";
import { requireAuth, type AuthenticatedRequest } from "../middleware/auth.ts";
import { evaluate24HourTriad } from "../services/clinicalScoring.ts";

export const dashboardRouter = Router();

dashboardRouter.get("/triad", requireAuth, async (req: AuthenticatedRequest, res) => {
  const userId = req.user!.sub;
  const days = Math.min(30, Math.max(1, Number(req.query.days ?? 14)));

  const sinceHistory = new Date();
  sinceHistory.setUTCHours(0, 0, 0, 0);
  sinceHistory.setUTCDate(sinceHistory.getUTCDate() - (days - 1));

  const since7Days = new Date();
  since7Days.setUTCHours(0, 0, 0, 0);
  since7Days.setUTCDate(since7Days.getUTCDate() - 6);

  const [user, logs, weeklyActivities] = await Promise.all([
    prisma.user.findUnique({ where: { id: userId } }),
    prisma.dailyWellbeingLog.findMany({
      where: { userId, logDate: { gte: sinceHistory } },
      orderBy: { logDate: "asc" },
    }),
    prisma.physicalActivity.findMany({
      where: { userId, activityDate: { gte: since7Days } },
    }),
  ]);

  if (!user) throw new AppError(404, "NOT_FOUND", "Pengguna tidak ditemukan.");

  const latestLog = logs.at(-1);
  const todayEval = evaluate24HourTriad({
    totalMvpaMinutes: latestLog?.totalMvpaMinutes ?? 0,
    sleepHours: latestLog?.sleepHours ?? 0,
    sleepQualityScore: latestLog?.sleepQualityScore ?? 3,
    totalSedentaryHours: latestLog?.totalSedentaryHours ?? 0,
    nonAcademicScreenHours: latestLog?.nonAcademicScreenHours ?? 0,
  });

  const weeklyMetsTotal = Number(
    weeklyActivities.reduce((sum, item) => sum + item.calculatedMets, 0).toFixed(1)
  );
  const weeklyMseDays = new Set(
    weeklyActivities
      .filter((item) => item.intensityType === "MUSCLE_STRENGTHENING")
      .map((item) => item.activityDate.toISOString().slice(0, 10))
  ).size;

  sendSuccess(res, {
    today: {
      totalSedentaryHours: latestLog?.totalSedentaryHours ?? 0,
      totalMvpaMinutes: latestLog?.totalMvpaMinutes ?? 0,
      mvpaPerSedentaryRatio: todayEval.mvpaPerSedentaryRatio,
      sleepHours: latestLog?.sleepHours ?? 0,
      nonAcademicScreenHours: latestLog?.nonAcademicScreenHours ?? 0,
      pss4TotalScore: latestLog?.pss4TotalScore ?? 0,
      triadPillarsMet: latestLog?.triadPillarsMet ?? 0,
      stressRiskLevel: latestLog?.stressRiskLevel ?? "LOW",
      sedentaryRiskStatus: todayEval.sedentaryRiskStatus,
    },
    weeklySummary: {
      weeklyMetsTotal,
      weeklyMetsTarget: user.weeklyMetsTarget,
      weeklyMseDays,
      weeklyMseTarget: CLINICAL_CONSTANTS.WEEKLY_MSE_TARGET_DAYS,
      currentStreakDays: user.currentStreakDays,
      xpPoints: user.xpPoints,
    },
    history: logs.map((log) => ({
      logDate: log.logDate.toISOString().slice(0, 10),
      totalSedentaryHours: log.totalSedentaryHours,
      totalMvpaMinutes: log.totalMvpaMinutes,
      sleepHours: log.sleepHours,
      pss4TotalScore: log.pss4TotalScore,
      triadPillarsMet: log.triadPillarsMet,
    })),
  });
});
