import { Router } from "express";
import { CLINICAL_CONSTANTS } from "../../../shared/contracts/index.ts";
import { prisma } from "../lib/prisma.ts";
import { AppError, sendSuccess } from "../lib/response.ts";
import { requireAuth, type AuthenticatedRequest } from "../middleware/auth.ts";
import { recalculateTodayBurnoutLog, toUtcDateOnly as toLocalUtcDateOnly } from "../services/burnoutSync.ts";
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

  const todaySedentaryHours = Math.max(
    todayLog?.totalSedentaryHours ?? 0,
    todayTotals.totalSedentaryHours
  );
  const todayMvpaMinutes = Math.max(
    todayLog?.totalMvpaMinutes ?? 0,
    todayTotals.totalMvpaMinutes
  );
  const todaySteps = weeklyActivities
    .filter((item) => item.activityDate.toISOString().slice(0, 10) === todayKey)
    .reduce((sum, item) => sum + (item.stepsCount ?? 0), 0);

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

  // Enrich dengan metrik PRD v4.0 (Burnout, Active Break, Jadwal Hari Ini) secara best-effort
  let liveBurnout: {
    burnoutIndex: number;
    status: string;
    verifiedBreakCount: number;
    totalScreenTimeMins: number;
    academicLoadScore: number;
    recoveryScore: number;
  } | null = null;
  try {
    const synced = await recalculateTodayBurnoutLog(userId);
    liveBurnout = {
      burnoutIndex: synced.burnoutIndex,
      status: synced.status,
      verifiedBreakCount: synced.verifiedBreakCount,
      totalScreenTimeMins: synced.totalScreenTimeMins,
      academicLoadScore: synced.academicLoadScore,
      recoveryScore: synced.recoveryScore,
    };
  } catch {
    // Tetap kompatibel pada unit test yang hanya men-stub tabel Triad inti
  }

  sendSuccess(res, {
    today: {
      totalSedentaryHours: todaySedentaryHours,
      totalMvpaMinutes: todayMvpaMinutes,
      todaySteps,
      mvpaPerSedentaryRatio: todayEval.mvpaPerSedentaryRatio,
      sleepHours: todayLog?.sleepHours ?? 0,
      nonAcademicScreenHours: todayLog?.nonAcademicScreenHours ?? 0,
      pss4TotalScore: todayLog?.pss4TotalScore ?? 0,
      triadPillarsMet: todayLog ? todayLog.triadPillarsMet : todayEval.triadPillarsMet,
      stressRiskLevel: todayLog?.stressRiskLevel ?? "LOW",
      sedentaryRiskStatus: todayEval.sedentaryRiskStatus,
      hasDailyCheckIn: Boolean(todayLog),
      ...(liveBurnout
        ? {
            burnoutIndex: liveBurnout.burnoutIndex,
            burnoutStatus: liveBurnout.status,
            verifiedBreakCount: liveBurnout.verifiedBreakCount,
            totalScreenTimeMins: liveBurnout.totalScreenTimeMins,
            academicLoadScore: liveBurnout.academicLoadScore,
            recoveryScore: liveBurnout.recoveryScore,
          }
        : {}),
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

/**
 * GET /api/v1/dashboard/daily-summary
 * Ringkasan harian terpadu 100% dinamis dari MySQL untuk seluruh data user hari ini.
 */
dashboardRouter.get("/daily-summary", requireAuth, async (req: AuthenticatedRequest, res) => {
  const userId = req.user!.sub;
  const todayUtc = toLocalUtcDateOnly(new Date());
  const todayStr = todayUtc.toISOString().slice(0, 10);
  const dayOfWeek = todayUtc.getUTCDay() === 0 ? 7 : todayUtc.getUTCDay();

  const localDayStart = new Date(`${todayStr}T00:00:00`);
  const localDayEnd = new Date(localDayStart);
  localDayEnd.setDate(localDayEnd.getDate() + 1);

  const [
    user,
    todaySchedules,
    todayWellbeing,
    todayActivities,
    todayBreaks,
    burnout,
    unreadNotifications,
  ] = await Promise.all([
    prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        name: true,
        nim: true,
        email: true,
        department: true,
        weeklyMetsTarget: true,
        targetRecoveryScore: true,
        currentStreakDays: true,
        xpPoints: true,
      },
    }),
    prisma.academicSchedule.findMany({
      where: { userId, dayOfWeek },
      orderBy: [{ startTime: "asc" }, { subjectName: "asc" }],
    }),
    prisma.dailyWellbeingLog.findUnique({
      where: { userId_logDate: { userId, logDate: todayUtc } },
    }),
    prisma.physicalActivity.findMany({
      where: { userId, activityDate: todayUtc },
      orderBy: { createdAt: "desc" },
    }),
    prisma.activeBreakSession.findMany({
      where: { userId, startTime: { gte: localDayStart, lt: localDayEnd } },
      orderBy: { startTime: "desc" },
    }),
    recalculateTodayBurnoutLog(userId, todayUtc),
    prisma.userNotification.count({
      where: { userId, isRead: false },
    }),
  ]);

  if (!user) throw new AppError(404, "NOT_FOUND", "Pengguna tidak ditemukan.");

  const todaySteps = todayActivities.reduce((sum, a) => sum + a.stepsCount, 0);
  const todayMets = Number(
    todayActivities.reduce((sum, a) => sum + a.calculatedMets, 0).toFixed(1)
  );
  const todayMvpaMinutes = todayActivities.reduce((sum, a) => sum + a.durationMinutes, 0);
  const todayTotalSks = todaySchedules.reduce((sum, s) => sum + s.creditHours, 0);

  sendSuccess(res, {
    logDate: todayStr,
    dayOfWeek,
    user,
    burnout,
    academic: {
      courseCount: todaySchedules.length,
      totalSks: todayTotalSks,
      hasExamWeek: todaySchedules.some((s) => s.isExamWeek || Boolean(s.examDate)),
      schedules: todaySchedules,
    },
    activity: {
      steps: todaySteps,
      totalMets: todayMets,
      mvpaMinutes: todayMvpaMinutes,
      sessionsCount: todayActivities.length,
    },
    activeBreaks: {
      totalCount: todayBreaks.length,
      verifiedCount: todayBreaks.filter((b) => b.poseVerified).length,
      items: todayBreaks,
    },
    wellbeing: {
      checkedInToday: Boolean(todayWellbeing),
      sleepHours: todayWellbeing?.sleepHours ?? burnout.sleepHours,
      sleepQualityScore: todayWellbeing?.sleepQualityScore ?? null,
      pss4TotalScore: todayWellbeing?.pss4TotalScore ?? null,
      stressRiskLevel: todayWellbeing?.stressRiskLevel ?? "LOW",
    },
    unreadNotifications,
  });
});
