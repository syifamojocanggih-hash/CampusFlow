import { z } from "zod";
import type { DominantMediator } from "../../../shared/contracts/index.ts";
import { env } from "../config/env.ts";

export interface Telemetry7DaysInput {
  today: {
    totalSedentaryHours: number;
    totalMvpaMinutes: number;
    mvpaPerSedentaryRatio: number;
    sleepHours: number | null;
    sleepQualityScore: number | null;
    pss4TotalScore: number | null;
    triadPillarsMet: number;
  };
  history7Days: Array<{
    logDate: string;
    totalSedentaryHours: number;
    totalMvpaMinutes: number;
    sleepHours: number;
    pss4TotalScore: number;
    triadPillarsMet: number;
  }>;
  latestPss10Score?: number | null;
  userNotes?: string | null;
  recentInsights?: Array<{
    isCompleted: boolean;
    recommendedMetsToday?: number;
    createdAt?: string;
  }>;
}

export interface GeneratedInsight {
  dominantMediator: DominantMediator;
  diagnosisSummary: string;
  isotemporalActionPlan: string;
  recommendedMetsToday: number;
  scientificCitationNote: string;
}

export interface AllowedRanges {
  durationMinutesRange: [number, number];
  metsRange: [number, number];
}

export interface SkipAdaptationSummary {
  applied: boolean;
  consecutiveSkips: number;
  previousRecommendedMets: number | null;
}

export interface ClinicalRuleFlags {
  sleepDeficit: boolean;
  sedentaryOverload: boolean;
  lowMvpaVolume: boolean;
  examAcuteStress: boolean;
  flags: DominantMediator[];
  dominantMediator: DominantMediator;
  priorityMediator: DominantMediator;
  escalationFlag: boolean;
  missingDailyCheckIn: boolean;
}

const VALID_MEDIATORS = [
  "SEDENTARY_OVERLOAD",
  "SLEEP_MEDIATION_DEFICIT",
  "LOW_MVPA_VOLUME",
  "EXAM_ACUTE_STRESS",
  "OPTIMAL_BALANCE",
] as const;

const MEDIATOR_BASE_RANGES: Record<DominantMediator, AllowedRanges> = {
  SLEEP_MEDIATION_DEFICIT: { durationMinutesRange: [15, 30], metsRange: [180, 260] },
  SEDENTARY_OVERLOAD: { durationMinutesRange: [10, 20], metsRange: [170, 240] },
  LOW_MVPA_VOLUME: { durationMinutesRange: [15, 25], metsRange: [160, 220] },
  EXAM_ACUTE_STRESS: { durationMinutesRange: [10, 20], metsRange: [150, 200] },
  OPTIMAL_BALANCE: { durationMinutesRange: [10, 20], metsRange: [200, 260] },
};

const EMERGENCY_DISTRESS_KEYWORDS = [
  "cemas berlebihan",
  "putus asa",
  "tidak sanggup",
  "ga sanggup",
  "gak sanggup",
  "panik berat",
  "menyerah",
  "bunuh diri",
  "menyakiti diri",
];

const HEAVY_EXERCISE_PATTERN = /\b(lari kencang|sprint|hiit|angkat beban berat|intensitas tinggi)\b/i;

const insightOutputSchema = z.object({
  dominantMediator: z.enum(VALID_MEDIATORS),
  diagnosisSummary: z.string().min(10),
  isotemporalActionPlan: z.string().min(10),
  recommendedMetsToday: z.coerce.number().int().min(50).max(2000),
  scientificCitationNote: z.string().min(5),
});

const OLLAMA_RESPONSE_FORMAT = {
  type: "object",
  properties: {
    dominantMediator: {
      type: "string",
      enum: [...VALID_MEDIATORS],
    },
    diagnosisSummary: { type: "string" },
    isotemporalActionPlan: { type: "string" },
    recommendedMetsToday: { type: "integer" },
    scientificCitationNote: { type: "string" },
  },
  required: [
    "dominantMediator",
    "diagnosisSummary",
    "isotemporalActionPlan",
    "recommendedMetsToday",
    "scientificCitationNote",
  ],
} as const;

const SYSTEM_INSTRUCTION = `Kamu adalah CampusFlow AI Coach: asisten kesehatan mental-fisik mahasiswa Indonesia berbasis Martín-Rodríguez & González-Prieto (2026). Tugasmu HANYA menyusun narasi empatik dan rencana aksi dari data input; kamu BUKAN pengambil keputusan klinis atau dokter.
1. ATURAN MUTLAK: Salin field dominantMediator PERSIS dari clinicalRuleEvaluation.dominantMediator (jika flags kosong gunakan OPTIMAL_BALANCE). Angka recommendedMetsToday dan durasi menit pada isotemporalActionPlan HARUS berada dalam allowedRanges.
2. GAYA BAHASA: Bahasa Indonesia yang hangat, empatik, suportif (hindari nada dingin "Anda terdeteksi mengalami..." dan DILARANG mendiagnosis gangguan psikiatris). Maksimal 2 kalimat pembuka di diagnosisSummary; sertakan aksi spesifik + durasi + timing ("sekarang" | "sore ini" | "sebelum tidur") di isotemporalActionPlan.
3. ANTI-HALUSINASI: Hanya rujuk temuan tervalidasi (Martín-Rodríguez & González-Prieto 2026; Mu et al. 2024; Wang et al. 2025; Barbosa et al. 2024; Su et al. 2022; Zhang et al. 2024; Ai et al. 2021; Wu & Zhou 2024) tanpa mengarang angka statistik baru.
4. ESKALASI & EDGE CASE: Bila escalationFlag true, hanya sarankan aksi fisik ringan/relaksasi napas (dilarang olahraga berat) dan WAJIB sertakan frasa "konselor kampus" secara halus di diagnosisSummary tanpa menakut-nakuti. Bila missingDailyCheckIn true (pss4TotalScore null), jangan asumsikan skor stres/tidur dan WAJIB sertakan ajakan mengisi "check-in harian" di diagnosisSummary. Bila skipAdaptation.applied true, turunkan target dalam allowedRanges maksimal -40%.
5. PENOLAKAN: Jika input di luar scope wellbeing kampus, kembalikan JSON valid dengan diagnosisSummary "Pertanyaan ini di luar cakupan CampusFlow Coach.".`;

/** Mendeteksi kata kunci stres darurat dari catatan bebas pengguna. */
export function detectDistressKeywords(userNotes?: string | null): boolean {
  if (!userNotes) return false;
  const normalized = userNotes.toLowerCase();
  return EMERGENCY_DISTRESS_KEYWORDS.some((keyword) => normalized.includes(keyword));
}

/** Mengevaluasi bendera batas klinis secara deterministik sesuai prioritas Martín-Rodríguez & González-Prieto (2026). */
export function evaluateClinicalRuleFlags(
  today: Telemetry7DaysInput["today"],
  options?: { userNotes?: string | null }
): ClinicalRuleFlags {
  const missingDailyCheckIn = today.pss4TotalScore === null;

  const sleepDeficit =
    !missingDailyCheckIn &&
    today.pss4TotalScore !== null &&
    ((today.sleepHours !== null && today.sleepHours < 7.0) ||
      (today.sleepQualityScore !== null && today.sleepQualityScore <= 2)) &&
    today.pss4TotalScore >= 8;

  const sedentaryOverload =
    today.totalSedentaryHours >= 9.0 ||
    (today.totalSedentaryHours > 6 && today.mvpaPerSedentaryRatio < 25);

  const lowMvpaVolume = missingDailyCheckIn
    ? today.totalMvpaMinutes < 30
    : today.totalMvpaMinutes < 30 || today.triadPillarsMet === 0;

  const examAcuteStress =
    !missingDailyCheckIn && today.pss4TotalScore !== null && today.pss4TotalScore >= 8;

  const flags: DominantMediator[] = [];
  if (sleepDeficit) flags.push("SLEEP_MEDIATION_DEFICIT");
  if (sedentaryOverload) flags.push("SEDENTARY_OVERLOAD");
  if (lowMvpaVolume) flags.push("LOW_MVPA_VOLUME");
  if (examAcuteStress && !sleepDeficit && !sedentaryOverload && !lowMvpaVolume) {
    flags.push("EXAM_ACUTE_STRESS");
  }

  let dominantMediator: DominantMediator = "OPTIMAL_BALANCE";
  if (sleepDeficit) {
    dominantMediator = "SLEEP_MEDIATION_DEFICIT";
  } else if (sedentaryOverload) {
    dominantMediator = "SEDENTARY_OVERLOAD";
  } else if (lowMvpaVolume) {
    dominantMediator = "LOW_MVPA_VOLUME";
  } else if (examAcuteStress) {
    dominantMediator = "EXAM_ACUTE_STRESS";
  }

  const escalationFlag =
    (today.pss4TotalScore !== null && today.pss4TotalScore >= 10) ||
    detectDistressKeywords(options?.userNotes);

  return {
    sleepDeficit,
    sedentaryOverload,
    lowMvpaVolume,
    examAcuteStress,
    flags,
    dominantMediator,
    priorityMediator: dominantMediator,
    escalationFlag,
    missingDailyCheckIn,
  };
}

/** Menghitung rentang durasi & MET yang aman (termasuk pembatasan eskalasi & adaptasi riwayat skip maks -40%). */
export function computeCoachConstraints(
  mediator: DominantMediator,
  escalationFlag: boolean,
  recentInsights?: Telemetry7DaysInput["recentInsights"]
): { allowedRanges: AllowedRanges; skipAdaptation: SkipAdaptationSummary } {
  let allowedRanges: AllowedRanges = escalationFlag
    ? { durationMinutesRange: [5, 15], metsRange: [80, 160] }
    : {
        durationMinutesRange: [...MEDIATOR_BASE_RANGES[mediator].durationMinutesRange] as [
          number,
          number,
        ],
        metsRange: [...MEDIATOR_BASE_RANGES[mediator].metsRange] as [number, number],
      };

  let consecutiveSkips = 0;
  for (const item of recentInsights ?? []) {
    if (item.isCompleted) break;
    consecutiveSkips += 1;
  }

  const latestPrevMets = recentInsights?.[0]?.recommendedMetsToday;
  const previousRecommendedMets =
    typeof latestPrevMets === "number" && Number.isFinite(latestPrevMets) ? latestPrevMets : null;

  if (consecutiveSkips < 2) {
    return {
      allowedRanges,
      skipAdaptation: { applied: false, consecutiveSkips, previousRecommendedMets },
    };
  }

  const baseMidMets = Math.round((allowedRanges.metsRange[0] + allowedRanges.metsRange[1]) / 2);
  const referenceMets = previousRecommendedMets ?? baseMidMets;
  const dropRatio = Math.min(0.4, 0.15 + (consecutiveSkips - 2) * 0.1);
  const minMetsFloor = Math.max(60, Math.round(referenceMets * 0.6)); // tidak turun melebihi -40%
  const targetCeiling = Math.max(minMetsFloor + 20, Math.round(referenceMets * (1 - dropRatio)));

  const minDur = Math.max(5, Math.round(allowedRanges.durationMinutesRange[0] * 0.6));
  const maxDur = Math.max(minDur + 4, Math.round(allowedRanges.durationMinutesRange[1] * 0.75));

  allowedRanges = {
    durationMinutesRange: [minDur, maxDur],
    metsRange: [
      Math.min(allowedRanges.metsRange[0], minMetsFloor),
      Math.max(minMetsFloor + 15, Math.min(allowedRanges.metsRange[1], targetCeiling)),
    ],
  };

  return {
    allowedRanges,
    skipAdaptation: {
      applied: true,
      consecutiveSkips,
      previousRecommendedMets: referenceMets,
    },
  };
}

function clampMets(value: number, [minMets, maxMets]: [number, number]): number {
  return Math.max(minMets, Math.min(maxMets, Math.round(value)));
}

/** Menjamin hasil LLM memenuhi batas aturan klinis 1.1, rentang allowedRanges, & eskalasi keamanan. */
function enforceClinicalGuardrails(
  insight: GeneratedInsight,
  evaluation: ClinicalRuleFlags,
  allowedRanges: AllowedRanges
): GeneratedInsight {
  let summary = insight.diagnosisSummary.trim();
  let plan = insight.isotemporalActionPlan.trim();

  if (evaluation.escalationFlag) {
    const mentionsCounselor = /konselor|layanan kesehatan mental|psikolog|cerita/i.test(summary);
    if (!mentionsCounselor) {
      summary = `${summary} Kalau rasanya terus menumpuk, nggak apa-apa cerita ke konselor kampus atau layanan kesehatan mental mahasiswa.`;
    }
    if (HEAVY_EXERCISE_PATTERN.test(plan)) {
      plan = `Lakukan latihan napas pelan 4-7-8 atau jalan santai ringan di kamar selama ${allowedRanges.durationMinutesRange[0]} menit sekarang untuk menenangkan tubuh.`;
    }
  }

  if (evaluation.missingDailyCheckIn && !/check-in|kuesioner/i.test(summary)) {
    summary = `${summary} Kalau sempat nanti, lengkapi check-in harianmu ya supaya dukungannya makin pas.`;
  }

  return {
    dominantMediator: evaluation.dominantMediator,
    diagnosisSummary: summary,
    isotemporalActionPlan: plan,
    recommendedMetsToday: clampMets(insight.recommendedMetsToday, allowedRanges.metsRange),
    scientificCitationNote: insight.scientificCitationNote.trim(),
  };
}

/** Fallback klinis empatik deterministik bila server Ollama lokal belum menyala atau gagal merespons. */
export function buildDeterministicFallbackInsight(input: Telemetry7DaysInput): GeneratedInsight {
  const { today } = input;
  const evaluation = evaluateClinicalRuleFlags(today, { userNotes: input.userNotes });
  const { allowedRanges, skipAdaptation } = computeCoachConstraints(
    evaluation.dominantMediator,
    evaluation.escalationFlag,
    input.recentInsights
  );

  const midMets = Math.round((allowedRanges.metsRange[0] + allowedRanges.metsRange[1]) / 2);
  const lowMets = allowedRanges.metsRange[0] + 15;
  const gentleDuration = allowedRanges.durationMinutesRange[0];
  const stdDuration = Math.round(
    (allowedRanges.durationMinutesRange[0] + allowedRanges.durationMinutesRange[1]) / 2
  );

  const checkInSuffix = evaluation.missingDailyCheckIn
    ? " Kalau ada waktu sebentar nanti, sekalian lengkapi check-in harianmu ya supaya gambarannya makin pas."
    : "";
  const counselorSuffix = evaluation.escalationFlag
    ? " Kalau rasanya terus menumpuk, nggak apa-apa banget cerita ke konselor kampus atau layanan kesehatan mental mahasiswa."
    : "";
  const skipPrefix = skipAdaptation.applied
    ? "Nggak masalah kalau target beberapa hari terakhir sempat terlewat, kita mulai pelan dari langkah yang lebih ringan hari ini. "
    : "";

  if (evaluation.escalationFlag && evaluation.dominantMediator === "EXAM_ACUTE_STRESS") {
    return {
      dominantMediator: "EXAM_ACUTE_STRESS",
      diagnosisSummary: `${skipPrefix}Beban harianmu sepertinya cukup terasa berat hari ini. Yuk ambil jeda pelan sebentar dulu untuk menenangkan napas.${counselorSuffix}`,
      isotemporalActionPlan: `Duduk nyaman dan lakukan latihan napas 4-7-8 atau peregangan bahu lembut selama ${gentleDuration} menit sekarang.`,
      recommendedMetsToday: clampMets(lowMets, allowedRanges.metsRange),
      scientificCitationNote:
        "Menurut Wu & Zhou (2024), aktivitas ringan dan relaksasi terstruktur membantu menurunkan respons ketegangan akut.",
    };
  }

  const baseByMediator: Record<DominantMediator, GeneratedInsight> = {
    SLEEP_MEDIATION_DEFICIT: {
      dominantMediator: "SLEEP_MEDIATION_DEFICIT",
      diagnosisSummary: `${skipPrefix}Tidurmu terasa kurang pulih saat aktivitas sedang padat, jadi wajar kalau energi dan ketahanan stresmu menurun hari ini.${counselorSuffix}`,
      isotemporalActionPlan: evaluation.escalationFlag
        ? `Lakukan jalan santai ringan atau peregangan rileks selama ${gentleDuration} menit sore ini untuk bantu menenangkan tubuh.`
        : `Coba luangkan ${stdDuration} menit sore ini untuk jalan santai di area kampus atau kos supaya tubuh lebih rileks sebelum tidur malam.`,
      recommendedMetsToday: clampMets(
        evaluation.escalationFlag ? lowMets : midMets,
        allowedRanges.metsRange
      ),
      scientificCitationNote:
        "Penelitian Mu et al. (2024) dan Wang et al. (2025) menunjukkan kualitas tidur memediasi sekitar 41% manfaat gerak terhadap pemulihan stres.",
    },
    SEDENTARY_OVERLOAD: {
      dominantMediator: "SEDENTARY_OVERLOAD",
      diagnosisSummary: `${skipPrefix}Kamu sudah duduk cukup lama hari ini sekitar ${today.totalSedentaryHours.toFixed(1)} jam, wajar kalau tubuh mulai terasa kaku.${counselorSuffix}${checkInSuffix}`,
      isotemporalActionPlan: `Yuk berdiri sebentar dan jalan santai di sekitar meja atau koridor selama ${stdDuration} menit sekarang.${skipAdaptation.applied ? "" : " Usahakan jeda singkat tiap 50 menit belajar."}`,
      recommendedMetsToday: clampMets(
        skipAdaptation.applied || evaluation.escalationFlag ? lowMets : midMets,
        allowedRanges.metsRange
      ),
      scientificCitationNote:
        "Menurut Barbosa et al. (2024) dan Su et al. (2022), mengganti waktu duduk panjang dengan gerak ringan membantu suasana hati.",
    },
    LOW_MVPA_VOLUME: {
      dominantMediator: "LOW_MVPA_VOLUME",
      diagnosisSummary: `${skipPrefix}Hari ini total gerak aktifmu masih ${today.totalMvpaMinutes} menit, tubuhmu akan terbantu jika mendapat sedikit ruang bergerak.${counselorSuffix}${checkInSuffix}`,
      isotemporalActionPlan: `Mulai pelan saja dengan berjalan santai menuju kantin atau sekitar halaman kos selama ${stdDuration} menit sekarang.`,
      recommendedMetsToday: clampMets(
        skipAdaptation.applied || evaluation.escalationFlag ? lowMets : midMets,
        allowedRanges.metsRange
      ),
      scientificCitationNote:
        "Zhang et al. (2024) dan Ai et al. (2021) menunjukkan aktivitas fisik rutin dan latihan kekuatan ringan membantu menjaga ketahanan mental.",
    },
    EXAM_ACUTE_STRESS: {
      dominantMediator: "EXAM_ACUTE_STRESS",
      diagnosisSummary: `${skipPrefix}Gerak dan tidurmu sudah cukup terjaga, namun beban tekanan kuliah hari ini terasa meningkat.${counselorSuffix}`,
      isotemporalActionPlan: `Coba aktifkan Exam Panic Button atau jalan ringan selama ${stdDuration} menit sekarang sebelum melanjutkan belajar.`,
      recommendedMetsToday: clampMets(midMets, allowedRanges.metsRange),
      scientificCitationNote:
        "Wu & Zhou (2024) menunjukkan sesi aerobik ringan-sedang singkat membantu menurunkan ketegangan akademik akut.",
    },
    OPTIMAL_BALANCE: {
      dominantMediator: "OPTIMAL_BALANCE",
      diagnosisSummary: `${skipPrefix}Ritme duduk dan gerakmu hari ini terjaga dengan baik.${checkInSuffix || " Kerja bagus sudah memberi tubuh ruang bernapas di tengah kuliah."}`,
      isotemporalActionPlan: `Pertahankan kebiasaan baik ini dengan peregangan santai ${stdDuration} menit sebelum tidur agar pemulihan tetap optimal.`,
      recommendedMetsToday: clampMets(midMets, allowedRanges.metsRange),
      scientificCitationNote:
        "Keseimbangan gerak dan tidur mendukung ketahanan stres mahasiswa sesuai kerangka Martín-Rodríguez & González-Prieto (2026).",
    },
  };

  return baseByMediator[evaluation.dominantMediator];
}

export type OllamaPromptMode = "auto" | "user-only" | "chatml";

export interface GenerateInsightOptions {
  fetchFn?: typeof fetch;
  enforceGuardrails?: boolean;
  model?: string;
  promptMode?: OllamaPromptMode;
}

export interface OllamaChatMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

/** Mengirim permintaan chat terstruktur ke `/api/chat` Ollama dan memvalidasi JSON output 5 field resmi. */
export async function callOllamaChatJson(
  messages: OllamaChatMessage[],
  options: {
    fetchFn?: typeof fetch;
    model?: string;
    timeoutMs?: number;
  } = {}
): Promise<{ insight: GeneratedInsight; model: string }> {
  const fetchFn = options.fetchFn ?? fetch;
  const targetModel = options.model ?? env.OLLAMA_MODEL;
  const endpoint = `${env.OLLAMA_BASE_URL.replace(/\/+$/, "")}/api/chat`;

  const response = await fetchFn(endpoint, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    signal: AbortSignal.timeout(options.timeoutMs ?? env.OLLAMA_TIMEOUT_MS),
    body: JSON.stringify({
      model: targetModel,
      stream: false,
      format: OLLAMA_RESPONSE_FORMAT,
      options: { temperature: 0 },
      messages,
    }),
  });

  if (!response.ok) {
    throw new Error(`Ollama HTTP ${response.status}`);
  }

  const rawBody = (await response.json()) as {
    message?: { content?: string };
    response?: string;
  };
  const rawJsonText = rawBody.message?.content ?? rawBody.response ?? "";
  const insight = insightOutputSchema.parse(JSON.parse(rawJsonText));
  return { insight, model: targetModel };
}

function buildActiveDirectives(
  evaluation: ClinicalRuleFlags,
  skipAdaptation: SkipAdaptationSummary
): string[] {
  const directives: string[] = [];
  if (evaluation.escalationFlag) {
    directives.push(
      "ESKALASI_AKTIF: WAJIB tulis kalimat penutup ini di diagnosisSummary: 'Kalau rasanya terus menumpuk, nggak apa-apa cerita ke konselor kampus.' dan isi isotemporalActionPlan hanya dengan relaksasi ringan."
    );
  }
  if (evaluation.missingDailyCheckIn) {
    directives.push(
      "BELUM_CHECKIN_HARIAN: WAJIB tutup diagnosisSummary dengan kalimat: 'Jangan lupa lengkapi check-in harian di aplikasi ya supaya rekomendasinya makin pas.'"
    );
  }
  if (skipAdaptation.applied) {
    directives.push(
      "ADAPTASI_SKIP: turunkan target ke rentang ringan dalam allowedRanges (penurunan wajar maks -40%)."
    );
  }
  return directives;
}

/** Menghasilkan insight klinis dari server Ollama lokal (`/api/chat` JSON Schema) dengan fallback aman. */
export async function generateClinicalWellbeingInsight(
  userTelemetry7Days: Telemetry7DaysInput,
  fetchOrOptions: typeof fetch | GenerateInsightOptions = fetch
): Promise<{
  insight: GeneratedInsight;
  source: "OLLAMA_LOCAL" | "CLINICAL_FALLBACK";
  model: string;
  escalationFlag: boolean;
}> {
  const fetchFn =
    typeof fetchOrOptions === "function" ? fetchOrOptions : (fetchOrOptions.fetchFn ?? fetch);
  const enforceGuardrails =
    typeof fetchOrOptions === "function" ? true : (fetchOrOptions.enforceGuardrails ?? true);
  const targetModel =
    typeof fetchOrOptions === "function"
      ? env.OLLAMA_MODEL
      : (fetchOrOptions.model ?? env.OLLAMA_MODEL);
  const promptMode: OllamaPromptMode =
    typeof fetchOrOptions === "function" ? "auto" : (fetchOrOptions.promptMode ?? "auto");

  const evaluation = evaluateClinicalRuleFlags(userTelemetry7Days.today, {
    userNotes: userTelemetry7Days.userNotes,
  });
  const { allowedRanges, skipAdaptation } = computeCoachConstraints(
    evaluation.dominantMediator,
    evaluation.escalationFlag,
    userTelemetry7Days.recentInsights
  );
  const activeDirectives = buildActiveDirectives(evaluation, skipAdaptation);

  const promptPayload = {
    activeDirectives,
    clinicalRuleEvaluation: {
      dominantMediator: evaluation.dominantMediator,
      priorityMediator: evaluation.priorityMediator,
      flags: evaluation.flags,
      escalationFlag: evaluation.escalationFlag,
      missingDailyCheckIn: evaluation.missingDailyCheckIn,
    },
    allowedRanges,
    skipAdaptation,
    today: userTelemetry7Days.today,
    history7Days: userTelemetry7Days.history7Days,
    latestPss10Score: userTelemetry7Days.latestPss10Score ?? null,
    userNotes: userTelemetry7Days.userNotes ?? null,
  };

  const usesBakedModelfile =
    promptMode === "user-only" ||
    (promptMode === "auto" && targetModel.startsWith("campusflow-coach"));
  const messages: OllamaChatMessage[] = usesBakedModelfile
    ? [{ role: "user", content: JSON.stringify(promptPayload) }]
    : [
        { role: "system", content: SYSTEM_INSTRUCTION },
        {
          role: "user",
          content: `Analisis data telemetri mahasiswa 7 hari berikut dan berikan JSON terstruktur sesuai kontrak:\n${JSON.stringify(
            promptPayload
          )}`,
        },
      ];

  try {
    const { insight: parsed } = await callOllamaChatJson(messages, {
      fetchFn,
      model: targetModel,
    });
    const finalInsight = enforceGuardrails
      ? enforceClinicalGuardrails(parsed, evaluation, allowedRanges)
      : parsed;

    return {
      insight: finalInsight,
      source: "OLLAMA_LOCAL",
      model: targetModel,
      escalationFlag: evaluation.escalationFlag,
    };
  } catch (err) {
    console.warn("[Ollama Coach Fallback]", err instanceof Error ? err.message : err);
    return {
      insight: buildDeterministicFallbackInsight(userTelemetry7Days),
      source: "CLINICAL_FALLBACK",
      model: targetModel,
      escalationFlag: evaluation.escalationFlag,
    };
  }
}

export interface OllamaStatusResult {
  reachable: boolean;
  baseUrl: string;
  configuredModel: string;
  modelInstalled: boolean;
  availableModels: string[];
}

/** Mengecek apakah server Ollama lokal aktif dan model yang dikonfigurasi sudah ter-pull. */
export async function checkOllamaStatus(
  fetchFn: typeof fetch = fetch,
  modelName: string = env.OLLAMA_MODEL
): Promise<OllamaStatusResult> {
  const baseUrl = env.OLLAMA_BASE_URL.replace(/\/+$/, "");
  try {
    const response = await fetchFn(`${baseUrl}/api/tags`, {
      method: "GET",
      signal: AbortSignal.timeout(5000),
    });

    if (!response.ok) {
      return {
        reachable: false,
        baseUrl,
        configuredModel: modelName,
        modelInstalled: false,
        availableModels: [],
      };
    }

    const body = (await response.json()) as { models?: Array<{ name?: string }> };
    const availableModels = (body.models ?? [])
      .map((item) => item.name ?? "")
      .filter(Boolean);
    const modelInstalled = availableModels.some(
      (name) => name === modelName || name.startsWith(`${modelName}:`)
    );

    return {
      reachable: true,
      baseUrl,
      configuredModel: modelName,
      modelInstalled,
      availableModels,
    };
  } catch {
    return {
      reachable: false,
      baseUrl,
      configuredModel: modelName,
      modelInstalled: false,
      availableModels: [],
    };
  }
}
