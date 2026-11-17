export const BURNOUT_CONSTANTS = {
  MAX_SAFE_SCREEN_HOURS: 8.0,
  SCREEN_FATIGUE_COEFFICIENT: 2.5,
  THEORY_SKS_WEIGHT: 1.0,
  PRACTICUM_SKS_WEIGHT: 1.5,
  EXAM_PROXIMITY_PENALTY: 3.0,
  SLEEP_RECOVERY_MAX_SCORE: 40.0,
  ACTIVE_BREAK_SCORE_PER_SESSION: 10.0,
  BURNOUT_THRESHOLD_LOW: 40.0,
  BURNOUT_THRESHOLD_HIGH: 75.0,
} as const;

export type BurnoutRiskStatus = "LOW" | "MODERATE" | "HIGH";

export interface BurnoutCalculationResult {
  academicLoadScore: number;
  screenFatigueScore: number;
  recoveryScore: number;
  burnoutIndex: number;
  status: BurnoutRiskStatus;
}

export interface ScheduleItemInput {
  creditHours: number;
  isPracticum?: boolean;
  isExamWeek?: boolean;
}

/**
 * Menghitung Academic Load Score (AL) berdasarkan PRD v4.0.
 * AL = sum(SKS * Bobot) + Penalti Ujian
 * - Teori: 1.0 poin / SKS
 * - Praktikum: 1.5 poin / SKS
 * - Pekan Ujian (H-7): +3.0 poin ekstra
 */
export function calculateAcademicLoadScore(schedules: ScheduleItemInput[]): number {
  let total = 0;
  for (const s of schedules) {
    const weight = s.isPracticum
      ? BURNOUT_CONSTANTS.PRACTICUM_SKS_WEIGHT
      : BURNOUT_CONSTANTS.THEORY_SKS_WEIGHT;
    total += s.creditHours * weight;
    if (s.isExamWeek) {
      total += BURNOUT_CONSTANTS.EXAM_PROXIMITY_PENALTY;
    }
  }
  return Number(total.toFixed(2));
}

/**
 * Menghitung Screen Time Fatigue (ST) berdasarkan PRD v4.0.
 * ST = max(0, Total Jam Layar - 8.0) * 2.5
 */
export function calculateScreenTimeFatigue(totalScreenTimeHours: number): number {
  if (totalScreenTimeHours <= BURNOUT_CONSTANTS.MAX_SAFE_SCREEN_HOURS) {
    return 0;
  }
  const excess = totalScreenTimeHours - BURNOUT_CONSTANTS.MAX_SAFE_SCREEN_HOURS;
  return Number((excess * BURNOUT_CONSTANTS.SCREEN_FATIGUE_COEFFICIENT).toFixed(2));
}

/**
 * Menghitung Recovery Score (RS) berdasarkan PRD v4.0.
 * RS = min(40, (Jam Tidur / 8.0) * 40) + (Jumlah Active Break Terverifikasi * 10)
 */
export function calculateRecoveryScore(
  sleepHours: number,
  verifiedBreakCount: number
): number {
  const safeSleep = Math.max(0, sleepHours);
  const sleepScore = Math.min(
    BURNOUT_CONSTANTS.SLEEP_RECOVERY_MAX_SCORE,
    (safeSleep / 8.0) * BURNOUT_CONSTANTS.SLEEP_RECOVERY_MAX_SCORE
  );
  const breakScore =
    Math.max(0, verifiedBreakCount) * BURNOUT_CONSTANTS.ACTIVE_BREAK_SCORE_PER_SESSION;
  return Number((sleepScore + breakScore).toFixed(2));
}

/**
 * Menghitung Burnout Risk Index (0 - 100) dan klasifikasi status risiko.
 * Burnout Risk Index = (Academic Load + Screen Fatigue) - Recovery Score
 * Kategori:
 * - Hijau (Optimal / LOW): < 40
 * - Kuning (Waspada / MODERATE): 40 - 75
 * - Merah (Risiko Tinggi / HIGH): > 75
 */
export function calculateBurnoutRiskIndex(
  schedules: ScheduleItemInput[],
  totalScreenTimeHours: number,
  sleepHours: number,
  verifiedBreakCount: number
): BurnoutCalculationResult {
  const academicLoadScore = calculateAcademicLoadScore(schedules);
  const screenFatigueScore = calculateScreenTimeFatigue(totalScreenTimeHours);
  const recoveryScore = calculateRecoveryScore(sleepHours, verifiedBreakCount);

  const raw = academicLoadScore + screenFatigueScore - recoveryScore;
  const burnoutIndex = Number(Math.max(0, Math.min(100, raw)).toFixed(2));

  let status: BurnoutRiskStatus = "LOW";
  if (burnoutIndex > BURNOUT_CONSTANTS.BURNOUT_THRESHOLD_HIGH) {
    status = "HIGH";
  } else if (burnoutIndex >= BURNOUT_CONSTANTS.BURNOUT_THRESHOLD_LOW) {
    status = "MODERATE";
  }

  return {
    academicLoadScore,
    screenFatigueScore,
    recoveryScore,
    burnoutIndex,
    status,
  };
}
