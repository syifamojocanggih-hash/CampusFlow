import {
  BURNOUT_CONSTANTS,
  type BurnoutRiskStatus,
  type BurnoutCalculationResult,
} from "../../../shared/contracts/index.ts";

export interface ScheduleItemInput {
  creditHours: number;
  isPracticum?: boolean;
  isExamWeek?: boolean;
  classType?: "teori" | "praktikum" | string;
  class_type?: "teori" | "praktikum" | string;
}

/**
 * Menghitung Academic Load Score (AL) berdasarkan PRD v4.0.
 * AL = sum(SKS * Bobot) + Penalti Ujian
 * - Teori: 1.0 poin / SKS
 * - Praktikum: 1.5 poin / SKS
 * - Mendekati Ujian (H-7): +3.0 poin ekstra
 * 
 * Justifikasi Literatur:
 * - Olson et al. (2023, Frontiers in Public Health, DOI 10.3389/fpubh.2023.1118244)
 * - Andrade et al. (2023, Scientific Reports, DOI 10.1038/s41598-023-31852-w)
 */
export function calculateAcademicLoadScore(schedules: ScheduleItemInput[]): number {
  let total = 0;
  for (const s of schedules) {
    const isPracticum =
      s.isPracticum ??
      (s.classType === "praktikum" || s.class_type === "praktikum");
    const weight = isPracticum
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
 * ST = max(0, Total Jam Layar - 8) * 2.5
 * 
 * Justifikasi Literatur:
 * - Alshahrani et al. (2025, Frontiers in Psychiatry, DOI 10.3389/fpsyt.2025.1485601)
 * - Xu et al. (2025, Frontiers in Psychiatry, DOI 10.3389/fpsyt.2025.1528659)
 * Catatan: Isi penuh klaim ambang 8 jam pada kedua paper ini belum diverifikasi dari PDF lengkap.
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
 * RS = (Jam Tidur / 8) * 40 + (Jumlah Active Break * 10)
 * 
 * Justifikasi Literatur:
 * - Tidur: Allen et al. (2021, Int. J. Behav. Med., DOI 10.1007/s12529-020-09942-3) & Mu et al. (2024, Front. Psychol., DOI 10.3389/fpsyg.2024.1376993)
 * - Active Break: Albulescu et al. (2022, PLOS ONE, DOI 10.1371/journal.pone.0272460).
 *   Meta-analisis 22 sampel studi (N=2.335): efek acak signifikan tapi KECIL pada vigor (d=.36) & fatigue (d=.35).
 *   Bobot +10 poin per Active Break di sistem ini adalah insentif perilaku produk, bukan klaim efek klinis besar.
 */
export function calculateRecoveryScore(
  sleepHours: number,
  verifiedBreakCount: number
): number {
  const safeSleep = Math.max(0, sleepHours);
  const sleepScore = (safeSleep / 8.0) * BURNOUT_CONSTANTS.SLEEP_RECOVERY_MAX_SCORE;
  const breakScore =
    Math.max(0, verifiedBreakCount) * BURNOUT_CONSTANTS.ACTIVE_BREAK_SCORE_PER_SESSION;
  return Number((sleepScore + breakScore).toFixed(2));
}

/**
 * Menghitung Burnout Risk Index (0 - 100) dan klasifikasi status risiko.
 * Burnout Risk Index = (Academic Load + Screen Fatigue) - Recovery Score
 * 
 * Landasan Teori:
 * - Akar Teori: Effort-Recovery Model (Meijman & Mulder, 1998)
 * - Rujukan Modern: Sonnentag, Venz, & Casper (2021, Ann. Rev. Organ. Psychol. Organ. Behav., DOI 10.1146/annurev-orgpsych-012420-091355)
 *   (Catatan: Sonnentag et al. menjustifikasi logika struktur Beban - Pemulihan, bukan sumber rumus matematis)
 * - Quantified Self / Academic Strava: Gauthier et al. (2022, Comput. Hum. Behav., DOI 10.1016/j.chb.2022.107314)
 * 
 * Kategori:
 * - Hijau (Aman / LOW): < 40
 * - Kuning (Waspada / MODERATE): 40 - 75
 * - Merah (Burnout / HIGH): > 75
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
