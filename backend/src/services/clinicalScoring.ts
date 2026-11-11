import {
  CLINICAL_CONSTANTS,
  MET_COEFFICIENTS,
  PSS10_REVERSE_INDICES,
  PSS4_REVERSE_INDICES,
  type ActivityIntensity,
  type StressSeverity,
} from "../../../shared/contracts/index.ts";

function sumLikertWithReverse(answers: number[], reverseIndices: readonly number[]): number {
  const reverseSet = new Set<number>(reverseIndices);
  return answers.reduce((total, value, idx) => {
    const score = reverseSet.has(idx) ? 4 - value : value;
    return total + score;
  }, 0);
}

/** Menghitung skor total PSS-4 (0-16) dengan reverse score pada Q2 & Q3. */
export function calculatePss4Score(answers: readonly [number, number, number, number]): number {
  return sumLikertWithReverse([...answers], PSS4_REVERSE_INDICES);
}

/** Mengklasifikasikan tingkat stres dari skor PSS-4 (cutoff >= 8 adalah HIGH sesuai Moriarty et al., 2021). */
export function classifyPss4Severity(totalScore: number): StressSeverity {
  if (totalScore >= 13) return "SEVERE";
  if (totalScore >= 8) return "HIGH";
  if (totalScore >= 6) return "MODERATE";
  return "LOW";
}

/** Menghitung skor total PSS-10 (0-40) dengan reverse score pada item 4, 5, 7, dan 8. */
export function calculatePss10Score(answers: readonly number[]): number {
  if (answers.length !== 10) {
    throw new Error("PSS-10 wajib memiliki tepat 10 butir jawaban.");
  }
  return sumLikertWithReverse([...answers], PSS10_REVERSE_INDICES);
}

/** Mengklasifikasikan tingkat stres dari skor PSS-10. */
export function classifyPss10Severity(totalScore: number): StressSeverity {
  if (totalScore >= 27) return "SEVERE";
  if (totalScore >= 20) return "HIGH";
  if (totalScore >= 14) return "MODERATE";
  return "LOW";
}

/** Mengonversi durasi aktivitas dan intensitas IPAQ-SF ke satuan MET-menit. */
export function calculateActivityMets(
  intensityType: ActivityIntensity,
  durationMinutes: number
): number {
  const coeff = MET_COEFFICIENTS[intensityType];
  return Number((coeff * durationMinutes).toFixed(1));
}

/** Mengecek pemenuhan guideline tidur harian (7-9 jam dan kesegaran pagi >= 3). */
export function isSleepGuidelineMet(sleepHours: number, sleepQualityScore: number): boolean {
  return (
    sleepHours >= CLINICAL_CONSTANTS.TRIAD_PILLAR_2_SLEEP_MIN_HOURS &&
    sleepHours <= CLINICAL_CONSTANTS.TRIAD_PILLAR_2_SLEEP_MAX_HOURS &&
    sleepQualityScore >= CLINICAL_CONSTANTS.TRIAD_PILLAR_2_MIN_QUALITY_SCORE
  );
}

export interface TriadEvaluationInput {
  totalMvpaMinutes: number;
  sleepHours: number;
  sleepQualityScore: number;
  totalSedentaryHours: number;
  nonAcademicScreenHours: number;
}

export interface TriadEvaluationOutput {
  triadPillarsMet: number;
  mvpaPerSedentaryRatio: number;
  sedentaryRiskStatus: "OPTIMAL" | "WASPADA" | "HIGH_SEDENTARY_RISK";
}

/** Mengevaluasi kepatuhan 24-Hour Movement Guidelines (0-3 pilar) & risiko duduk statis (Barbosa et al., 2024). */
export function evaluate24HourTriad(input: TriadEvaluationInput): TriadEvaluationOutput {
  const pillar1Mvpa = input.totalMvpaMinutes >= CLINICAL_CONSTANTS.TRIAD_PILLAR_1_MVPA_MINS;
  const pillar2Sleep = isSleepGuidelineMet(input.sleepHours, input.sleepQualityScore);
  const pillar3Sedentary =
    input.totalSedentaryHours < CLINICAL_CONSTANTS.MAX_SAFE_SEDENTARY_HOURS &&
    input.nonAcademicScreenHours <= CLINICAL_CONSTANTS.TRIAD_PILLAR_3_MAX_SCREENTIME;

  const triadPillarsMet = Number(pillar1Mvpa) + Number(pillar2Sleep) + Number(pillar3Sedentary);

  const mvpaPerSedentaryRatio =
    input.totalSedentaryHours > 0
      ? Number((input.totalMvpaMinutes / input.totalSedentaryHours).toFixed(2))
      : input.totalMvpaMinutes;

  let sedentaryRiskStatus: TriadEvaluationOutput["sedentaryRiskStatus"] = "OPTIMAL";
  if (
    input.totalSedentaryHours >= CLINICAL_CONSTANTS.MAX_SAFE_SEDENTARY_HOURS ||
    (input.totalSedentaryHours > 6 &&
      mvpaPerSedentaryRatio < CLINICAL_CONSTANTS.TARGET_MVPA_PER_SEDENTARY_HOUR)
  ) {
    sedentaryRiskStatus = "HIGH_SEDENTARY_RISK";
  } else if (input.totalSedentaryHours >= 6 || !pillar1Mvpa) {
    sedentaryRiskStatus = "WASPADA";
  }

  return {
    triadPillarsMet,
    mvpaPerSedentaryRatio,
    sedentaryRiskStatus,
  };
}
