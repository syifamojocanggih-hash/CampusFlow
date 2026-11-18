import {
  BURNOUT_CONSTANTS,
  type BurnoutRiskStatus,
  type BurnoutCalculationResult,
} from "../../../shared/contracts/index.ts";

export interface ScheduleItemInput {
  creditHours: number;
  isPracticum?: boolean;
  isExamWeek?: boolean;
  examDate?: Date | string | null;
  exam_date?: Date | string | null;
  classType?: "teori" | "praktikum" | string;
  class_type?: "teori" | "praktikum" | string;
}

export type ExamEscalationTier = "NONE" | "H_14_TO_8" | "H_7_TO_4" | "H_3_TO_1" | "H_0";

export interface ExamEscalationBand {
  readonly tier: Exclude<ExamEscalationTier, "NONE">;
  readonly minDays: number;
  readonly maxDays: number;
  readonly penalty: number;
  readonly label: string;
}

/**
 * Kurva Eskalasi Pra-Ujian Dinamis (Dynamic Pre-Exam Escalation Curve).
 *
 * Landasan Referensi Pola Kurva:
 * - Larios, E., & Lerner, I. (2024). "Habitual rapid eye movement sleep predicts changes
 *   in test-anxiety levels weeks in advance." Journal of Sleep Research, 34(1), e14298.
 *   DOI: 10.1111/jsr.14298.
 *
 * Catatan Metodologis:
 * Studi Larios & Lerner (2024) menemukan bahwa kecemasan ujian (test anxiety) meningkat
 * secara gradual sejak beberapa minggu sebelum hari ujian, bukan muncul mendadak di satu titik.
 * Jurnal ini HANYA menjustifikasi arah/pola kurva yang naik bertahap (gradual escalation),
 * BUKAN sumber angka poin penalti spesifik (+0.5, +1.5, +3.0, +4.0) — angka poin di bawah
 * ini merupakan keputusan desain heuristik produk CampusFlow agar mudah dikalibrasi.
 */
export const EXAM_ESCALATION_CURVE: readonly ExamEscalationBand[] = [
  { tier: "H_0", minDays: 0, maxDays: 0, penalty: 4.0, label: "Hari Ujian (H-0)" },
  { tier: "H_3_TO_1", minDays: 1, maxDays: 3, penalty: 3.0, label: "Kritis Pra-Ujian (H-3 s/d H-1)" },
  { tier: "H_7_TO_4", minDays: 4, maxDays: 7, penalty: 1.5, label: "Persiapan Intensif (H-7 s/d H-4)" },
  { tier: "H_14_TO_8", minDays: 8, maxDays: 14, penalty: 0.5, label: "Peringatan Dini (H-14 s/d H-8)" },
] as const;

const MS_PER_DAY = 24 * 60 * 60 * 1000;

/**
 * Menormalisasi input Date atau string tanggal YYYY-MM-DD ke timestamp UTC 00:00:00
 * sehingga perhitungan selisih hari kalender bebas dari anomali jam/menit atau timezone.
 */
function toUtcMidnightMs(input: Date | string): number | null {
  if (typeof input === "string") {
    const match = input.trim().match(/^(\d{4})-(\d{2})-(\d{2})/);
    if (match) {
      return Date.UTC(Number(match[1]), Number(match[2]) - 1, Number(match[3]));
    }
    const parsed = new Date(input);
    if (Number.isNaN(parsed.getTime())) return null;
    return Date.UTC(parsed.getUTCFullYear(), parsed.getUTCMonth(), parsed.getUTCDate());
  }

  if (Number.isNaN(input.getTime())) return null;
  return Date.UTC(input.getUTCFullYear(), input.getUTCMonth(), input.getUTCDate());
}

/**
 * Menghitung selisih hari kalender dari currentDate menuju examDate.
 * Positif = hari menuju ujian (misal 7 = H-7), 0 = hari ujian (H-0), negatif = sudah lewat.
 */
export function getDaysUntilExam(
  examDate: Date | string | null | undefined,
  currentDate: Date | string = new Date()
): number | null {
  if (examDate == null) return null;
  const examMs = toUtcMidnightMs(examDate);
  const currentMs = toUtcMidnightMs(currentDate);
  if (examMs === null || currentMs === null) return null;
  return Math.round((examMs - currentMs) / MS_PER_DAY);
}

/**
 * Menentukan tier eskalasi pra-ujian berdasarkan jarak hari ke tanggal ujian.
 * Berguna untuk kalkulasi penalti maupun pemicu pesan proaktif bertingkat (predictiveNudge).
 */
export function getExamEscalationBand(
  examDate: Date | string | null | undefined,
  currentDate: Date | string = new Date()
): ExamEscalationBand | null {
  const daysUntil = getDaysUntilExam(examDate, currentDate);
  if (daysUntil === null) return null;
  return (
    EXAM_ESCALATION_CURVE.find(
      (band) => daysUntil >= band.minDays && daysUntil <= band.maxDays
    ) ?? null
  );
}

/**
 * Menghitung penalti beban ujian berdasarkan jarak hari menuju tanggal ujian
 * menggunakan lookup table interval EXAM_ESCALATION_CURVE.
 *
 * - H-14 s/d H-8 : +0.5
 * - H-7 s/d H-4  : +1.5
 * - H-3 s/d H-1  : +3.0
 * - H-0          : +4.0
 * - Di luar H-14 (> 14 hari), sudah lewat (< 0), atau null : 0
 */
export function calculateExamProximityPenalty(
  examDate: Date | string | null | undefined,
  currentDate: Date | string = new Date()
): number {
  const band = getExamEscalationBand(examDate, currentDate);
  return band ? band.penalty : 0;
}

/**
 * Menghitung Academic Load Score (AL) berdasarkan PRD v4.0.
 * AL = sum(SKS * Bobot) + Penalti Ujian Dinamis
 * - Teori: 1.0 poin / SKS
 * - Praktikum: 1.5 poin / SKS
 * - Penalti Ujian:
 *   - Jika isExamWeek = true DAN examDate terisi -> gunakan kurva eskalasi dinamis
 *     (calculateExamProximityPenalty).
 *   - Jika isExamWeek = true DAN examDate kosong/null -> fallback penalti flat lama (+3.0)
 *     sebagai backward compatibility data jadwal sebelum migrasi examDate.
 *
 * Justifikasi Literatur:
 * - Beban SKS: Olson et al. (2023, Frontiers in Public Health, DOI 10.3389/fpubh.2023.1118244)
 *   & Andrade et al. (2023, Scientific Reports, DOI 10.1038/s41598-023-31852-w)
 * - Pola Eskalasi Ujian: Larios & Lerner (2024, Journal of Sleep Research, DOI 10.1111/jsr.14298)
 */
export function calculateAcademicLoadScore(
  schedules: ScheduleItemInput[],
  currentDate: Date | string = new Date()
): number {
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
      const resolvedExamDate = s.examDate ?? s.exam_date;
      if (resolvedExamDate != null && resolvedExamDate !== "") {
        total += calculateExamProximityPenalty(resolvedExamDate, currentDate);
      } else {
        // Fallback kompatibilitas mundur untuk data lama yang belum memiliki examDate
        total += BURNOUT_CONSTANTS.EXAM_PROXIMITY_PENALTY;
      }
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
  verifiedBreakCount: number,
  currentDate: Date | string = new Date()
): BurnoutCalculationResult {
  const academicLoadScore = calculateAcademicLoadScore(schedules, currentDate);
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
