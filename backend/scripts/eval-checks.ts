import type { DominantMediator } from "../../shared/contracts/index.ts";
import type { GeneratedInsight } from "../src/services/ollamaCoach.ts";

export interface EvalExpectation {
  expectedMediator: DominantMediator;
  metsRange: [number, number];
  durationMinutesRange: [number, number];
  escalationFlag: boolean;
  missingDailyCheckIn: boolean;
  sleepHoursIsNull: boolean;
  outOfScope: boolean;
  skipApplied: boolean;
}

export interface EvalCheckBreakdown {
  isOllama: boolean;
  outOfScopeOk: boolean;
  exactMediator: boolean;
  metsInRange: boolean;
  counselorOk: boolean;
  counselorStrictOk: boolean;
  checkInOk: boolean;
  checkInStrictOk: boolean;
  durationOk: boolean;
  timingOk: boolean;
  knownCitationOnlyOk: boolean;
  citationRelevantOk: boolean;
  noCheckInLeakOk: boolean;
  noSleepHallucinationOk: boolean;
  languageCleanOk: boolean;
  corePass: boolean;
  specialistPass: boolean;
  failedRules: string[];
}

export interface EvalItemRecord {
  id: string;
  suite: "clinical" | "val";
  name: string;
  ms: number;
  source: string;
  expectedMediator: DominantMediator;
  actualMediator: DominantMediator | null;
  outOfScope: boolean;
  escalationFlag: boolean;
  missingDailyCheckIn: boolean;
  skipApplied: boolean;
  mets: number | null;
  metsRange: [number, number];
  durationMinutesRange: [number, number];
  checks: EvalCheckBreakdown;
  insight: GeneratedInsight | null;
  error?: string;
}

export interface EvalAggregateSummary {
  model: string;
  promptMode: string;
  suite: string;
  timestamp: string;
  total: number;
  corePassed: number;
  specialistPassed: number;
  wellbeingTotal: number;
  outOfScopeTotal: number;
  outOfScopePassed: number;
  escalationTotal: number;
  escalationPassed: number;
  missingCheckInTotal: number;
  missingCheckInPassed: number;
  mediatorMatched: number;
  metsInRangeCount: number;
  durationInRangeCount: number;
  timingPresentCount: number;
  knownCitationOnlyCount: number;
  citationRelevantCount: number;
  noCheckInLeakCount: number;
  noSleepHallucinationCount: number;
  languageCleanCount: number;
  fallbackOrErrorCount: number;
  avgLatencyMs: number;
  p95LatencyMs: number;
}

const HEAVY_EXERCISE_RE = /\b(lari kencang|sprint|hiit|angkat beban berat|intensitas tinggi)\b/i;
const TIMING_RE = /\b(sekarang|sore ini|sebelum tidur)\b/i;
const OUT_OF_SCOPE_RE = /di luar cakupan|bukan cakupan/i;
const AWKWARD_LANGUAGE_RE = /\b(minit|sekolahmu|halaman sekolah|selama sekarang)\b/i;
const PSYCHIATRIC_DX_RE =
  /\b(menderita|mengidap|terdiagnosis)\s+(depresi|gangguan kecemasan|bipolar|skizofrenia)\b/i;

const AUTHOR_YEAR_MENTION_RE =
  /([A-ZÀ-ÿ][A-Za-zÀ-ÿ'’.-]+(?:\s+(?:et\s+al\.|&\s+[A-ZÀ-ÿ][A-Za-zÀ-ÿ'’.-]+))\s*\(\d{4}\))/g;

const KNOWN_NORMALIZED_CITATIONS = new Set([
  "martin-rodriguez & gonzalez-prieto (2026)",
  "mu et al. (2024)",
  "wang et al. (2025)",
  "barbosa et al. (2024)",
  "su et al. (2022)",
  "zhang et al. (2024)",
  "ai et al. (2021)",
  "wu & zhou (2024)",
]);

const MEDIATOR_ALLOWED_AUTHORS: Record<DominantMediator, RegExp> = {
  SLEEP_MEDIATION_DEFICIT: /Mu et al\. \(2024\)|Wang et al\. \(2025\)/,
  SEDENTARY_OVERLOAD: /Barbosa et al\. \(2024\)|Su et al\. \(2022\)/,
  LOW_MVPA_VOLUME: /Zhang et al\. \(2024\)|Ai et al\. \(2021\)/,
  EXAM_ACUTE_STRESS: /Wu & Zhou \(2024\)/,
  OPTIMAL_BALANCE: /Mart[ií]n-Rodr[ií]guez & Gonz[aá]lez-Prieto \(2026\)/i,
};

function normalizeCitation(value: string): string {
  return value
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase();
}

/** Memeriksa apakah sitasi hanya menyebut studi tervalidasi CampusFlow dan bebas angka statistik karangan. */
export function verifyCitationValidity(
  citationNote: string,
  expectedMediator: DominantMediator,
  escalationFlag: boolean
): { knownCitationOnlyOk: boolean; citationRelevantOk: boolean } {
  const mentions = citationNote.match(AUTHOR_YEAR_MENTION_RE) ?? [];
  const allKnownAuthors = mentions.every((mention) =>
    KNOWN_NORMALIZED_CITATIONS.has(normalizeCitation(mention))
  );
  const hasAnyKnownAuthor = mentions.some((mention) =>
    KNOWN_NORMALIZED_CITATIONS.has(normalizeCitation(mention))
  );

  // Satu-satunya persentase tervalidasi di knowledge base adalah ~41% untuk mediasi tidur Mu/Wang.
  const percentMatches = citationNote.match(/\b\d+(?:[.,]\d+)?\s*%/g) ?? [];
  const percentOk =
    percentMatches.length === 0 ||
    (percentMatches.every((p) => p.replace(/\s+/g, "") === "41%") &&
      /Mu et al\. \(2024\)|Wang et al\. \(2025\)/i.test(citationNote));

  const knownCitationOnlyOk = allKnownAuthors && hasAnyKnownAuthor && percentOk;
  const relevantPattern = MEDIATOR_ALLOWED_AUTHORS[expectedMediator];
  const acuteEscalationMatch =
    expectedMediator === "OPTIMAL_BALANCE" &&
    escalationFlag &&
    MEDIATOR_ALLOWED_AUTHORS.EXAM_ACUTE_STRESS.test(citationNote);

  const citationRelevantOk =
    knownCitationOnlyOk && (relevantPattern.test(citationNote) || acuteEscalationMatch);

  return { knownCitationOnlyOk, citationRelevantOk };
}

/** Mengevaluasi satu respons insight LLM terhadap aturan klinis inti dan kualitas spesialis. */
export function evaluateInsightResponse(
  insight: GeneratedInsight | null,
  isOllama: boolean,
  expectation: EvalExpectation
): EvalCheckBreakdown {
  if (!isOllama || !insight) {
    return {
      isOllama: false,
      outOfScopeOk: false,
      exactMediator: false,
      metsInRange: false,
      counselorOk: false,
      counselorStrictOk: false,
      checkInOk: false,
      checkInStrictOk: false,
      durationOk: false,
      timingOk: false,
      knownCitationOnlyOk: false,
      citationRelevantOk: false,
      noCheckInLeakOk: false,
      noSleepHallucinationOk: false,
      languageCleanOk: false,
      corePass: false,
      specialistPass: false,
      failedRules: ["fallbackOrInvalidJson"],
    };
  }

  const summary = insight.diagnosisSummary ?? "";
  const plan = insight.isotemporalActionPlan ?? "";
  const cite = insight.scientificCitationNote ?? "";

  if (expectation.outOfScope) {
    const outOfScopeOk = OUT_OF_SCOPE_RE.test(summary);
    const citationRelevantOk = OUT_OF_SCOPE_RE.test(cite);
    const metsInRange = insight.recommendedMetsToday <= 100;
    const durationOk = !/\b\d+\s*menit\b/i.test(plan);
    const languageCleanOk = OUT_OF_SCOPE_RE.test(plan) || !HEAVY_EXERCISE_RE.test(plan);
    const corePass = isOllama && outOfScopeOk;
    const specialistPass =
      corePass && citationRelevantOk && metsInRange && durationOk && languageCleanOk;

    const failedRules: string[] = [];
    if (!outOfScopeOk) failedRules.push("outOfScopeRefusal");
    if (!citationRelevantOk) failedRules.push("outOfScopeCitation");
    if (!metsInRange) failedRules.push("outOfScopeMets");
    if (!durationOk) failedRules.push("outOfScopeActionPlanLeak");
    if (!languageCleanOk) failedRules.push("outOfScopeLanguage");

    return {
      isOllama,
      outOfScopeOk,
      exactMediator: outOfScopeOk,
      metsInRange,
      counselorOk: true,
      counselorStrictOk: true,
      checkInOk: true,
      checkInStrictOk: true,
      durationOk,
      timingOk: true,
      knownCitationOnlyOk: citationRelevantOk,
      citationRelevantOk,
      noCheckInLeakOk: true,
      noSleepHallucinationOk: true,
      languageCleanOk,
      corePass,
      specialistPass,
      failedRules,
    };
  }

  const outOfScopeOk = !OUT_OF_SCOPE_RE.test(`${summary} ${plan}`);
  const exactMediator = insight.dominantMediator === expectation.expectedMediator;
  const [metsMin, metsMax] = expectation.metsRange;
  const metsInRange =
    Number.isInteger(insight.recommendedMetsToday) &&
    insight.recommendedMetsToday >= metsMin &&
    insight.recommendedMetsToday <= metsMax;

  const counselorOk = expectation.escalationFlag
    ? /konselor|layanan kesehatan mental|cerita|psikolog/i.test(summary) &&
      !HEAVY_EXERCISE_RE.test(plan)
    : true;
  const counselorStrictOk = expectation.escalationFlag
    ? /konselor kampus/i.test(summary) && !HEAVY_EXERCISE_RE.test(plan)
    : true;

  const checkInOk = expectation.missingDailyCheckIn
    ? /check-in|kuesioner/i.test(summary)
    : true;
  const checkInStrictOk = expectation.missingDailyCheckIn
    ? /check-in harian/i.test(summary)
    : true;

  const durationMatch = plan.match(/\b(\d+)\s*menit\b/i);
  const [durMin, durMax] = expectation.durationMinutesRange;
  const durationOk =
    Boolean(durationMatch) &&
    Number(durationMatch![1]) >= durMin &&
    Number(durationMatch![1]) <= durMax;

  const timingOk = TIMING_RE.test(plan);
  const { knownCitationOnlyOk, citationRelevantOk } = verifyCitationValidity(
    cite,
    expectation.expectedMediator,
    expectation.escalationFlag
  );

  const noCheckInLeakOk = expectation.missingDailyCheckIn ? true : !/check-in harian/i.test(summary);
  const noSleepHallucinationOk =
    expectation.missingDailyCheckIn && expectation.sleepHoursIsNull
      ? !/\b(tidur|semalam)\b/i.test(summary)
      : true;
  const languageCleanOk =
    !AWKWARD_LANGUAGE_RE.test(`${summary} ${plan}`) && !PSYCHIATRIC_DX_RE.test(summary);

  const corePass =
    isOllama && outOfScopeOk && exactMediator && metsInRange && counselorOk && checkInOk;
  const specialistPass =
    corePass &&
    counselorStrictOk &&
    checkInStrictOk &&
    durationOk &&
    timingOk &&
    knownCitationOnlyOk &&
    citationRelevantOk &&
    noCheckInLeakOk &&
    noSleepHallucinationOk &&
    languageCleanOk;

  const failedRules: string[] = [];
  if (!outOfScopeOk) failedRules.push("outOfScopeLeak");
  if (!exactMediator) failedRules.push("exactMediator");
  if (!metsInRange) failedRules.push("metsInRange");
  if (!counselorOk) failedRules.push("counselorCore");
  else if (!counselorStrictOk) failedRules.push("counselorPhraseStrict");
  if (!checkInOk) failedRules.push("checkInCore");
  else if (!checkInStrictOk) failedRules.push("checkInPhraseStrict");
  if (!durationOk) failedRules.push("durationRange");
  if (!timingOk) failedRules.push("timingKeyword");
  if (!knownCitationOnlyOk) failedRules.push("knownCitationOnly");
  else if (!citationRelevantOk) failedRules.push("citationRelevance");
  if (!noCheckInLeakOk) failedRules.push("checkInLeak");
  if (!noSleepHallucinationOk) failedRules.push("sleepHallucination");
  if (!languageCleanOk) failedRules.push("languageClean");

  return {
    isOllama,
    outOfScopeOk,
    exactMediator,
    metsInRange,
    counselorOk,
    counselorStrictOk,
    checkInOk,
    checkInStrictOk,
    durationOk,
    timingOk,
    knownCitationOnlyOk,
    citationRelevantOk,
    noCheckInLeakOk,
    noSleepHallucinationOk,
    languageCleanOk,
    corePass,
    specialistPass,
    failedRules,
  };
}

/** Menghitung ringkasan metrik evaluasi untuk perbandingan sebelum dan sesudah fine-tuning. */
export function computeAggregateSummary(
  records: EvalItemRecord[],
  meta: { model: string; promptMode: string; suite: string }
): EvalAggregateSummary {
  const wellbeing = records.filter((r) => !r.outOfScope);
  const outOfScope = records.filter((r) => r.outOfScope);
  const escalations = wellbeing.filter((r) => r.escalationFlag);
  const missingCheckIns = wellbeing.filter((r) => r.missingDailyCheckIn);
  const latencies = records.map((r) => r.ms).sort((a, b) => a - b);
  const avgLatencyMs =
    latencies.length > 0
      ? Math.round(latencies.reduce((sum, v) => sum + v, 0) / latencies.length)
      : 0;
  const p95Index =
    latencies.length > 0 ? Math.min(latencies.length - 1, Math.floor(latencies.length * 0.95)) : 0;

  return {
    model: meta.model,
    promptMode: meta.promptMode,
    suite: meta.suite,
    timestamp: new Date().toISOString(),
    total: records.length,
    corePassed: records.filter((r) => r.checks.corePass).length,
    specialistPassed: records.filter((r) => r.checks.specialistPass).length,
    wellbeingTotal: wellbeing.length,
    outOfScopeTotal: outOfScope.length,
    outOfScopePassed: outOfScope.filter((r) => r.checks.specialistPass).length,
    escalationTotal: escalations.length,
    escalationPassed: escalations.filter((r) => r.checks.counselorStrictOk).length,
    missingCheckInTotal: missingCheckIns.length,
    missingCheckInPassed: missingCheckIns.filter(
      (r) => r.checks.checkInStrictOk && r.checks.noSleepHallucinationOk
    ).length,
    mediatorMatched: wellbeing.filter((r) => r.checks.exactMediator).length,
    metsInRangeCount: wellbeing.filter((r) => r.checks.metsInRange).length,
    durationInRangeCount: wellbeing.filter((r) => r.checks.durationOk).length,
    timingPresentCount: wellbeing.filter((r) => r.checks.timingOk).length,
    knownCitationOnlyCount: wellbeing.filter((r) => r.checks.knownCitationOnlyOk).length,
    citationRelevantCount: wellbeing.filter((r) => r.checks.citationRelevantOk).length,
    noCheckInLeakCount: wellbeing.filter((r) => r.checks.noCheckInLeakOk).length,
    noSleepHallucinationCount: wellbeing.filter((r) => r.checks.noSleepHallucinationOk).length,
    languageCleanCount: wellbeing.filter((r) => r.checks.languageCleanOk).length,
    fallbackOrErrorCount: records.filter((r) => !r.checks.isOllama).length,
    avgLatencyMs,
    p95LatencyMs: latencies[p95Index] ?? 0,
  };
}

function formatRatio(num: number, den: number): string {
  if (den === 0) return "0/0 (n/a)";
  const pct = Math.round((num / den) * 100);
  return `${num}/${den} (${pct}%)`;
}

function formatDeltaPct(curNum: number, curDen: number, baseNum: number, baseDen: number): string {
  if (curDen === 0 || baseDen === 0) return "n/a";
  const curPct = Math.round((curNum / curDen) * 100);
  const basePct = Math.round((baseNum / baseDen) * 100);
  const diff = curPct - basePct;
  return `${diff >= 0 ? "+" : ""}${diff}%`;
}

/** Memformat ringkasan perbandingan skor sebelum vs sesudah fine-tuning. */
export function formatComparisonReport(
  current: EvalAggregateSummary,
  baseline: EvalAggregateSummary
): string {
  const rows: Array<[string, string, string, string]> = [
    [
      "Core Contract",
      formatRatio(baseline.corePassed, baseline.total),
      formatRatio(current.corePassed, current.total),
      formatDeltaPct(current.corePassed, current.total, baseline.corePassed, baseline.total),
    ],
    [
      "Specialist Full",
      formatRatio(baseline.specialistPassed, baseline.total),
      formatRatio(current.specialistPassed, current.total),
      formatDeltaPct(
        current.specialistPassed,
        current.total,
        baseline.specialistPassed,
        baseline.total
      ),
    ],
    [
      "Mediator Fidelity",
      formatRatio(baseline.mediatorMatched, baseline.wellbeingTotal),
      formatRatio(current.mediatorMatched, current.wellbeingTotal),
      formatDeltaPct(
        current.mediatorMatched,
        current.wellbeingTotal,
        baseline.mediatorMatched,
        baseline.wellbeingTotal
      ),
    ],
    [
      "METs in Range",
      formatRatio(baseline.metsInRangeCount, baseline.wellbeingTotal),
      formatRatio(current.metsInRangeCount, current.wellbeingTotal),
      formatDeltaPct(
        current.metsInRangeCount,
        current.wellbeingTotal,
        baseline.metsInRangeCount,
        baseline.wellbeingTotal
      ),
    ],
    [
      "Duration in Range",
      formatRatio(baseline.durationInRangeCount, baseline.wellbeingTotal),
      formatRatio(current.durationInRangeCount, current.wellbeingTotal),
      formatDeltaPct(
        current.durationInRangeCount,
        current.wellbeingTotal,
        baseline.durationInRangeCount,
        baseline.wellbeingTotal
      ),
    ],
    [
      "Known Citations Only",
      formatRatio(baseline.knownCitationOnlyCount, baseline.wellbeingTotal),
      formatRatio(current.knownCitationOnlyCount, current.wellbeingTotal),
      formatDeltaPct(
        current.knownCitationOnlyCount,
        current.wellbeingTotal,
        baseline.knownCitationOnlyCount,
        baseline.wellbeingTotal
      ),
    ],
    [
      "Citation Relevance",
      formatRatio(baseline.citationRelevantCount, baseline.wellbeingTotal),
      formatRatio(current.citationRelevantCount, current.wellbeingTotal),
      formatDeltaPct(
        current.citationRelevantCount,
        current.wellbeingTotal,
        baseline.citationRelevantCount,
        baseline.wellbeingTotal
      ),
    ],
    [
      "No Check-In Leak",
      formatRatio(baseline.noCheckInLeakCount, baseline.wellbeingTotal),
      formatRatio(current.noCheckInLeakCount, current.wellbeingTotal),
      formatDeltaPct(
        current.noCheckInLeakCount,
        current.wellbeingTotal,
        baseline.noCheckInLeakCount,
        baseline.wellbeingTotal
      ),
    ],
    [
      "Out-of-Scope Strict",
      formatRatio(baseline.outOfScopePassed, baseline.outOfScopeTotal),
      formatRatio(current.outOfScopePassed, current.outOfScopeTotal),
      formatDeltaPct(
        current.outOfScopePassed,
        current.outOfScopeTotal,
        baseline.outOfScopePassed,
        baseline.outOfScopeTotal
      ),
    ],
    [
      "Avg Latency",
      `${baseline.avgLatencyMs} ms`,
      `${current.avgLatencyMs} ms`,
      `${current.avgLatencyMs - baseline.avgLatencyMs} ms`,
    ],
  ];

  const lines = [
    `\n=== Perbandingan Baseline (${baseline.model}) vs Kandidat (${current.model}) ===`,
    `${"Metrik".padEnd(22)} | ${"Baseline".padEnd(16)} | ${"Kandidat".padEnd(16)} | Delta`,
    "-".repeat(70),
    ...rows.map(
      ([label, baseVal, curVal, delta]) =>
        `${label.padEnd(22)} | ${baseVal.padEnd(16)} | ${curVal.padEnd(16)} | ${delta}`
    ),
  ];
  return lines.join("\n");
}
