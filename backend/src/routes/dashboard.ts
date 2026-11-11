import { Router } from "express";
import { CLINICAL_CONSTANTS } from "../../../shared/contracts/index.ts";
import { prisma } from "../lib/prisma.ts";
import { AppError, sendSuccess } from "../lib/response.ts";
import { requireAuth, type AuthenticatedRequest } from "../middleware/auth.ts";
import { evaluate24HourTriad } from "../services/clinicalScoring.ts";
import {
  getDailyActivityAndSedentaryTotals,
  toUtcDateOnly,
} from "../services/dailyAggregation.ts";

export const dashboardRouter = Router();

dashboardRouter.get("/triad", requireAuth, async (req: AuthenticatedRequest, res) => {
  const userId = req.user!.sub;
  const days = Math.min(30, Math.max(1, Number(req.query.days ?? 14)));

  const todayDate = toUtcDateOnly(new Date());
  const sinceHistory = new Date(todayDate);
  sinceHistory.setUTCDate(sinceHistory.getUTCDate() - (days - 1));

  const since7Days = new Date(todayDate);
  since7Days.setUTCDate(since7Days.getUTCDate() - 6);

  const [user, logs, weeklyActivities, todayTotals] = await Promise.all([
    prisma.user.findUnique({ where: { id: userId } }),
    prisma.dailyWellbeingLog.findMany({
      where: { userId, logDate: { gte: sinceHistory } },
      orderBy: { logDate: "asc" },
    }),
    prisma.physicalActivity.findMany({
      where: { userId, activityDate: { gte: since7Days } },
    }),
    getDailyActivityAndSedentaryTotals(userId, todayDate),
  ]);

  if (!user) throw new AppError(404, "NOT_FOUND", "Pengguna tidak ditemukan.");

  const todayKey = todayDate.toISOString().slice(0, 10);
  const todayLog = logs.find((log) => log.logDate.toISOString().slice(0, 10) === todayKey);

  const todaySedentaryHours = todayLog?.totalSedentaryHours ?? todayTotals.totalSedentaryHours;
  const todayMvpaMinutes = todayLog?.totalMvpaMinutes ?? todayTotals.totalMvpaMinutes;
  const todayEval = evaluate24HourTriad({
    totalMvpaMinutes: todayMvpaMinutes,
    sleepHours: todayLog?.sleepHours ?? 0,
    sleepQualityScore: todayLog?.sleepQualityScore ?? 1,
    totalSedentaryHours: todaySedentaryHours,
    nonAcademicScreenHours: todayLog?.nonAcademicScreenHours ?? 0,
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
      totalSedentaryHours: todaySedentaryHours,
      totalMvpaMinutes: todayMvpaMinutes,
      mvpaPerSedentaryRatio: todayEval.mvpaPerSedentaryRatio,
      sleepHours: todayLog?.sleepHours ?? 0,
      nonAcademicScreenHours: todayLog?.nonAcademicScreenHours ?? 0,
      pss4TotalScore: todayLog?.pss4TotalScore ?? 0,
      triadPillarsMet: todayLog ? todayLog.triadPillarsMet : todayEval.triadPillarsMet,
      stressRiskLevel: todayLog?.stressRiskLevel ?? "LOW",
      sedentaryRiskStatus: todayEval.sedentaryRiskStatus,
      hasDailyCheckIn: Boolean(todayLog),
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
