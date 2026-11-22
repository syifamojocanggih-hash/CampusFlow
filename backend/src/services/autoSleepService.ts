import type {
  AutoSleepRecordDTO,
  SleepClinicalStatus,
  SleepDetectionSource,
} from "../../../shared/contracts/index.ts";
import { prisma } from "../lib/prisma.ts";
import { recalculateTodayBurnoutLog, toUtcDateOnly } from "./burnoutSync.ts";
import {
  calculatePss4Score,
  classifyPss4Severity,
  computeConsecutiveStreakDays,
  evaluate24HourTriad,
} from "./clinicalScoring.ts";
import { getDailyActivityAndSedentaryTotals } from "./dailyAggregation.ts";

export interface ComputeAutoSleepInput {
  logDate?: string;
  lastActiveTimestamp?: number;
  firstWakeTimestamp?: number;
  bedTime?: string; // HH:mm
  wakeTime?: string; // HH:mm
  sleepHours?: number;
  sleepLatencyMins?: number;
  source?: SleepDetectionSource;
  isConfirmed?: boolean;
}

export function formatTimeHHMM(timestampMs: number): string {
  const d = new Date(timestampMs);
  const hh = String(d.getHours()).padStart(2, "0");
  const mm = String(d.getMinutes()).padStart(2, "0");
  return `${hh}:${mm}`;
}

export function parseHHMMToTimestamps(
  bedTime: string,
  wakeTime: string,
  referenceDateStr?: string
): { lastActiveTimestamp: number; firstWakeTimestamp: number } {
  const baseDate = referenceDateStr
    ? new Date(`${referenceDateStr.slice(0, 10)}T00:00:00`)
    : new Date();

  const [bedH = 23, bedM = 30] = bedTime.split(":").map((n) => Number(n) || 0);
  const [wakeH = 6, wakeM = 30] = wakeTime.split(":").map((n) => Number(n) || 0);

  const wakeDate = new Date(baseDate);
  wakeDate.setHours(wakeH, wakeM, 0, 0);

  const bedDate = new Date(baseDate);
  bedDate.setHours(bedH, bedM, 0, 0);

  // Jika jam tidur >= jam bangun (misal tidur 23:15, bangun 06:45), berarti jam tidur adalah malam sebelumnya
  if (bedDate.getTime() >= wakeDate.getTime()) {
    bedDate.setDate(bedDate.getDate() - 1);
  }

  return {
    lastActiveTimestamp: bedDate.getTime(),
    firstWakeTimestamp: wakeDate.getTime(),
  };
}

export function inferSleepQualityScore(sleepHours: number, bedTimeHHMM: string): number {
  const [bedHour = 23] = bedTimeHHMM.split(":").map((n) => Number(n) || 0);
  const isHealthyCircadianBedtime = bedHour >= 20 || bedHour === 0;

  if (sleepHours >= 7.0 && sleepHours <= 9.0) {
    return isHealthyCircadianBedtime ? 5 : 4;
  }
  if ((sleepHours >= 6.0 && sleepHours < 7.0) || (sleepHours > 9.0 && sleepHours <= 10.5)) {
    return 3;
  }
  if ((sleepHours >= 5.0 && sleepHours < 6.0) || sleepHours > 10.5) {
    return 2;
  }
  return 1;
}

export function classifySleepClinicalStatus(sleepHours: number): SleepClinicalStatus {
  if (sleepHours < 5.5) return "CRITICAL_DEFICIT";
  if (sleepHours < 7.0) return "DEFICIT_WARNING";
  if (sleepHours <= 9.5) return "OPTIMAL";
  return "OVERSLEEP";
}

export function calculateSleepRecoveryPoints(sleepHours: number): number {
  const clamped = Math.max(0, Math.min(sleepHours, 8.0));
  return Math.min(40, Math.round((clamped / 8.0) * 40));
}

export function computeAutoSleepRecord(input: ComputeAutoSleepInput): AutoSleepRecordDTO {
  const now = new Date();
  const logDate =
    input.logDate && /^\d{4}-\d{2}-\d{2}/.test(input.logDate)
      ? input.logDate.slice(0, 10)
      : `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(
          now.getDate()
        ).padStart(2, "0")}`;

  const source: SleepDetectionSource = input.source ?? "OVERNIGHT_INACTIVITY";

  const defaultLatency =
    source === "MANUAL_OVERRIDE" || source === "WEARABLE_SYNC" || source === "AI_NLP_CHAT"
      ? 0
      : source === "OS_POWER_MONITOR"
      ? 5
      : 15;

  const sleepLatencyMins =
    typeof input.sleepLatencyMins === "number" && input.sleepLatencyMins >= 0
      ? input.sleepLatencyMins
      : defaultLatency;

  let lastActiveTimestamp: number;
  let firstWakeTimestamp: number;

  if (
    typeof input.lastActiveTimestamp === "number" &&
    typeof input.firstWakeTimestamp === "number" &&
    input.firstWakeTimestamp > input.lastActiveTimestamp
  ) {
    lastActiveTimestamp = input.lastActiveTimestamp;
    firstWakeTimestamp = input.firstWakeTimestamp;
  } else if (input.bedTime && input.wakeTime) {
    const parsed = parseHHMMToTimestamps(input.bedTime, input.wakeTime, logDate);
    lastActiveTimestamp = parsed.lastActiveTimestamp;
    firstWakeTimestamp = parsed.firstWakeTimestamp;
  } else if (typeof input.sleepHours === "number" && input.sleepHours > 0) {
    // Jika hanya sleepHours yang diberikan, proyeksikan mundur dari jam 06:30 pagi
    const wakeAnchor = new Date(`${logDate}T06:30:00`);
    firstWakeTimestamp = wakeAnchor.getTime();
    const totalGapMs = (input.sleepHours + sleepLatencyMins / 60) * 3_600_000;
    lastActiveTimestamp = firstWakeTimestamp - totalGapMs;
  } else {
    // Baseline default cerdas: 23:15 -> 06:45 (7.5 jam raw, -15m latency = 7.3 jam)
    const parsed = parseHHMMToTimestamps("23:15", "06:45", logDate);
    lastActiveTimestamp = parsed.lastActiveTimestamp;
    firstWakeTimestamp = parsed.firstWakeTimestamp;
  }

  const rawInactiveHours = Number(
    Math.max(0, (firstWakeTimestamp - lastActiveTimestamp) / 3_600_000).toFixed(2)
  );

  const computedNetSleep =
    typeof input.sleepHours === "number" &&
    (source === "MANUAL_OVERRIDE" || source === "AI_NLP_CHAT" || source === "WEARABLE_SYNC")
      ? input.sleepHours
      : Math.max(0.5, rawInactiveHours - sleepLatencyMins / 60);

  const sleepHours = Number(Math.min(16.0, Math.max(0.5, computedNetSleep)).toFixed(1));
  const bedTime = input.bedTime || formatTimeHHMM(lastActiveTimestamp);
  const wakeTime = input.wakeTime || formatTimeHHMM(firstWakeTimestamp);
  const sleepQualityScore = inferSleepQualityScore(sleepHours, bedTime);
  const recoveryPoints = calculateSleepRecoveryPoints(sleepHours);
  const clinicalStatus = classifySleepClinicalStatus(sleepHours);

  const confidence: "HIGH" | "MEDIUM" | "MANUAL" =
    source === "MANUAL_OVERRIDE"
      ? "MANUAL"
      : source === "OS_POWER_MONITOR" || source === "WEARABLE_SYNC"
      ? "HIGH"
      : "MEDIUM";

  return {
    logDate,
    sleepHours,
    sleepQualityScore,
    bedTime,
    wakeTime,
    lastActiveTimestamp,
    firstWakeTimestamp,
    rawInactiveHours,
    sleepLatencyMins,
    source,
    confidence,
    isConfirmed: Boolean(input.isConfirmed ?? source === "MANUAL_OVERRIDE"),
    recoveryPoints,
    clinicalStatus,
  };
}

/**
 * Menyimpan hasil deteksi jam tidur otomatis ke DailyWellbeingLog & DailyFussionLog,
 * serta menghitung ulang 24-Hour Movement Triad dan Burnout Risk Index hari tersebut.
 */
export async function syncAutoSleepToDatabase(userId: string, record: AutoSleepRecordDTO) {
  const utcLogDate = toUtcDateOnly(record.logDate);

  const [{ totalSedentaryHours, totalMvpaMinutes }, existingWellbeing, existingFussion] =
    await Promise.all([
      getDailyActivityAndSedentaryTotals(userId, record.logDate),
      prisma.dailyWellbeingLog.findUnique({
        where: { userId_logDate: { userId, logDate: utcLogDate } },
      }),
      prisma.dailyFussionLog.findUnique({
        where: { userId_logDate: { userId, logDate: utcLogDate } },
      }),
    ]);

  // Pertahankan jawaban PSS-4 jika user sudah mengisi kuesioner hari ini, atau gunakan baseline netral
  const defaultPss4: [number, number, number, number] = [1, 2, 2, 1];
  const existingAnswers = Array.isArray(existingWellbeing?.pss4RawAnswersJson)
    ? (existingWellbeing.pss4RawAnswersJson as [number, number, number, number])
    : defaultPss4;

  const pss4TotalScore = existingWellbeing?.pss4TotalScore ?? calculatePss4Score(existingAnswers);
  const stressRiskLevel =
    existingWellbeing?.stressRiskLevel ?? classifyPss4Severity(pss4TotalScore);
  const nonAcademicScreenHours = existingWellbeing?.nonAcademicScreenHours ?? 0;

  const triad = evaluate24HourTriad({
    totalMvpaMinutes,
    sleepHours: record.sleepHours,
    sleepQualityScore: record.sleepQualityScore,
    totalSedentaryHours,
    nonAcademicScreenHours,
  });

  const wellbeingLog = await prisma.dailyWellbeingLog.upsert({
    where: { userId_logDate: { userId, logDate: utcLogDate } },
    update: {
      sleepHours: record.sleepHours,
      sleepQualityScore: record.sleepQualityScore,
      totalSedentaryHours,
      totalMvpaMinutes,
      mvpaPerSedentaryRatio: triad.mvpaPerSedentaryRatio,
      triadPillarsMet: triad.triadPillarsMet,
    },
    create: {
      userId,
      logDate: utcLogDate,
      sleepHours: record.sleepHours,
      sleepQualityScore: record.sleepQualityScore,
      nonAcademicScreenHours,
      pss4RawAnswersJson: existingAnswers,
      pss4TotalScore,
      totalSedentaryHours,
      totalMvpaMinutes,
      mvpaPerSedentaryRatio: triad.mvpaPerSedentaryRatio,
      triadPillarsMet: triad.triadPillarsMet,
      stressRiskLevel,
    },
  });

  // Update sleepHours di DailyFussionLog sebelum recalculateTodayBurnoutLog
  await prisma.dailyFussionLog.upsert({
    where: { userId_logDate: { userId, logDate: utcLogDate } },
    update: {
      sleepHours: record.sleepHours,
    },
    create: {
      userId,
      logDate: utcLogDate,
      totalScreenTimeMins: existingFussion?.totalScreenTimeMins ?? 0,
      sleepHours: record.sleepHours,
      academicLoadScore: 0,
      screenFatigueScore: 0,
      recoveryScore: record.recoveryPoints,
      verifiedBreakCount: 0,
      burnoutIndex: 0,
      status: "LOW",
    },
  });

  const burnoutSummary = await recalculateTodayBurnoutLog(userId, record.logDate);

  // Perbarui streak harian user
  const allRecentLogs = await prisma.dailyWellbeingLog.findMany({
    where: { userId },
    select: { logDate: true },
    orderBy: { logDate: "desc" },
    take: 60,
  });
  const anchorDate = allRecentLogs[0]?.logDate ?? utcLogDate;
  const currentStreakDays = computeConsecutiveStreakDays(
    allRecentLogs.map((item) => item.logDate),
    anchorDate
  );

  await prisma.user.update({
    where: { id: userId },
    data: { currentStreakDays },
  });

  return {
    autoSleep: record,
    wellbeingLog,
    burnoutSummary,
    currentStreakDays,
  };
}

