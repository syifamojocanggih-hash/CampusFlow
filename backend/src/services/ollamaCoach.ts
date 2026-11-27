import { z } from "zod";
import type { DominantMediator } from "../../../shared/contracts/index.ts";
export type { DominantMediator };
import { env } from "../config/env.ts";
import {
  CRISIS_RESPONSE_TEXT,
  deduplicateResponse,
  detectDistressKeywords as sharedDetectDistressKeywords,
  stripNullFields,
} from "./coachShared.ts";

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

const CITATION_BANK: Record<DominantMediator, string[]> = {
  SLEEP_MEDIATION_DEFICIT: [
    "Mu et al. (2024) dan Wang et al. (2025) menunjukkan kualitas tidur memediasi sebagian besar manfaat aktivitas fisik terhadap pemulihan stres mahasiswa.",
    "Wang et al. (2025) dan Mu et al. (2024) menemukan bahwa gerak ringan menjelang malam membantu memperbaiki kualitas tidur yang terganggu oleh beban akademik.",
  ],
  SEDENTARY_OVERLOAD: [
    "Barbosa et al. (2024) dan Su et al. (2022) menunjukkan bahwa memecah waktu duduk panjang dengan gerak singkat membantu memperbaiki suasana hati.",
    "Su et al. (2022) dan Barbosa et al. (2024) menunjukkan jeda berdiri atau berjalan tiap beberapa jam duduk terbukti menurunkan ketegangan fisik maupun mental.",
  ],
  LOW_MVPA_VOLUME: [
    "Zhang et al. (2024) dan Ai et al. (2021) menunjukkan aktivitas fisik rutin, bahkan intensitas ringan, membantu menjaga ketahanan mental mahasiswa.",
    "Ai et al. (2021) dan Zhang et al. (2024) menunjukkan volume gerak harian yang konsisten berkorelasi dengan suasana hati yang lebih stabil.",
  ],
  EXAM_ACUTE_STRESS: [
    "Wu & Zhou (2024) menunjukkan sesi aktivitas ringan-sedang singkat membantu menurunkan ketegangan akademik akut secara efektif.",
  ],
  OPTIMAL_BALANCE: [
    "Keseimbangan gerak dan tidur yang terjaga mendukung ketahanan stres mahasiswa sesuai kerangka Martín-Rodríguez & González-Prieto (2026).",
  ],
};

export function pickCitation(mediator: DominantMediator): string {
  const options = CITATION_BANK[mediator];
  return options[Math.floor(Math.random() * options.length)];
}

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
  recommendedMetsToday: z.coerce.number().int().min(0).max(2000),
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

  // KEPUTUSAN KLINIS DATA KOSONG (MVPA_ASUMSI_NOL & Barbosa et al. 2024):
  // Bila input/telemetri tidak mencatat durasi MVPA, mesin klinis secara konservatif
  // mengasumsikan totalMvpaMinutes = 0 sehingga mvpaPerSedentaryRatio = 0.
  // Untuk duduk > 6 jam (misal 8 jam nugas), rasio 0 < 25 memicu SEDENTARY_OVERLOAD
  // demi melindungi mahasiswa dari risiko klinis depresi (OR 1.74) tanpa mengubah ambang batas.
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
    detectDistressKeywords(options?.userNotes) ||
    sharedDetectDistressKeywords(options?.userNotes);

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

export const CHECK_IN_CLOSING_SENTENCE =
  "Jangan lupa lengkapi check-in harian di aplikasi ya supaya rekomendasinya makin pas.";

export function removeCheckInSentences(text: string): string {
  const sentences = text
    .split(/(?<=[.!?])\s+/)
    .map((s) => s.trim())
    .filter(Boolean);
  const filtered = sentences.filter(
    (s) => !/check-?in|kuesioner\s+harian/i.test(s)
  );
  return filtered.join(" ");
}

function cleanIndonesianCoachTypos(text: string): string {
  return text
    .replace(/\bperlahragaan\b/gi, "aktivitas olahraga")
    .replace(/\bperolahragaan\b/gi, "aktivitas olahraga")
    .replace(/\bbelakaipun\b/gi, "belakangan")
    .replace(/\bberolah\s+raga\b/gi, "berolahraga")
    .replace(/\bminit\b/gi, "menit")
    .replace(/\bselama\s+sekarang\b/gi, "sekarang")
    .replace(/\s{2,}/g, " ")
    .trim();
}

function clampPlanDurationMinutes(
  plan: string,
  [minDur, maxDur]: [number, number]
): string {
  return plan.replace(/\b(\d+)\s*menit\b/gi, (_match, rawNum) => {
    const num = Number(rawNum);
    if (!Number.isFinite(num)) return _match;
    const clamped = Math.max(minDur, Math.min(maxDur, num));
    return `${clamped} menit`;
  });
}

/** Menjamin hasil LLM memenuhi batas aturan klinis 1.1, rentang allowedRanges, & eskalasi keamanan.
 *  CATATAN: scientificCitationNote TIDAK lagi dipercayakan ke LLM -- dipilih deterministik dari
 *  CITATION_BANK berdasarkan dominantMediator (hasil rule engine), supaya selalu relevan & akurat
 *  tanpa bergantung pada kemampuan model menghafal pemetaan sitasi yang benar. */
function enforceClinicalGuardrails(
  insight: GeneratedInsight,
  evaluation: ClinicalRuleFlags,
  allowedRanges: AllowedRanges
): GeneratedInsight {
  let summary = cleanIndonesianCoachTypos(insight.diagnosisSummary.trim());
  let plan = clampPlanDurationMinutes(
    cleanIndonesianCoachTypos(insight.isotemporalActionPlan.trim()),
    allowedRanges.durationMinutesRange
  );

  // Hapus kalimat check-in buatan model bila ada agar tidak dobel
  summary = removeCheckInSentences(summary);

  if (evaluation.escalationFlag) {
    const mentionsCounselor = /konselor|layanan kesehatan mental|psikolog|cerita/i.test(summary);
    if (!mentionsCounselor) {
      summary = `${summary} Kalau rasanya terus menumpuk, nggak apa-apa cerita ke konselor kampus atau layanan kesehatan mental mahasiswa.`;
    }
    if (HEAVY_EXERCISE_PATTERN.test(plan)) {
      plan = `Lakukan latihan napas pelan 4-7-8 atau jalan santai ringan di kamar selama ${allowedRanges.durationMinutesRange[0]} menit sekarang untuk menenangkan tubuh.`;
    }
  }

  // Kalimat penutup ditambahkan oleh kode secara tetap (append deterministik) bukan diminta dari model
  if (evaluation.missingDailyCheckIn) {
    summary = summary ? `${summary} ${CHECK_IN_CLOSING_SENTENCE}` : CHECK_IN_CLOSING_SENTENCE;
  }

  const isOutOfScope = /di luar cakupan/i.test(summary);

  return {
    dominantMediator: evaluation.dominantMediator,
    diagnosisSummary: summary,
    isotemporalActionPlan: plan,
    recommendedMetsToday: clampMets(insight.recommendedMetsToday, allowedRanges.metsRange),
    scientificCitationNote: isOutOfScope
      ? "Di luar cakupan layanan CampusFlow Coach."
      : pickCitation(evaluation.dominantMediator),
  };
}

/** Fallback klinis empatik deterministik bila server Ollama lokal belum menyala atau gagal merespons. */
export function buildDeterministicFallbackInsight(
  input: Telemetry7DaysInput,
  options?: { forcedJenisGerak?: string }
): GeneratedInsight {
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

  const pickVariant = <T,>(items: T[]): T => items[Math.floor(Math.random() * items.length)];

  const checkInSuffix = evaluation.missingDailyCheckIn
    ? ` ${CHECK_IN_CLOSING_SENTENCE}`
    : "";
  const counselorSuffix = evaluation.escalationFlag
    ? " Kalau rasanya terus menumpuk, nggak apa-apa banget cerita ke konselor kampus atau layanan kesehatan mental mahasiswa."
    : "";
  const skipPrefix = skipAdaptation.applied
    ? pickVariant([
        "Nggak masalah kalau target beberapa hari terakhir sempat terlewat, kita mulai pelan dari langkah yang lebih ringan hari ini. ",
        "Pelan-pelan saja nggak apa-apa, kita sesuaikan target hari ini biar lebih mudah dijalani dulu. ",
        "Hari yang berat wajar bikin target tertunda—yuk mulai lagi dari porsi paling ringan hari ini. ",
      ])
    : "";

  if (evaluation.escalationFlag && evaluation.dominantMediator === "EXAM_ACUTE_STRESS") {
    return {
      dominantMediator: "EXAM_ACUTE_STRESS",
      diagnosisSummary: `${skipPrefix}${pickVariant([
        "Beban harianmu sepertinya cukup terasa berat hari ini. Yuk ambil jeda pelan sebentar dulu untuk menenangkan napas.",
        "Tekanan kuliah hari ini kelihatan lumayan padat. Ambil jeda sebentar buat tarik napas pelan dulu, ya.",
      ])}${counselorSuffix}`,
      isotemporalActionPlan: `Duduk nyaman dan lakukan latihan napas 4-7-8 atau peregangan bahu lembut selama ${gentleDuration} menit sekarang.`,
      recommendedMetsToday: clampMets(lowMets, allowedRanges.metsRange),
      scientificCitationNote: pickCitation("EXAM_ACUTE_STRESS"),
    };
  }

  const baseByMediator: Record<DominantMediator, GeneratedInsight> = {
    SLEEP_MEDIATION_DEFICIT: {
      dominantMediator: "SLEEP_MEDIATION_DEFICIT",
      diagnosisSummary: `${skipPrefix}${pickVariant([
        "Tidurmu terasa kurang pulih saat aktivitas sedang padat, jadi wajar kalau energi dan ketahanan stresmu menurun hari ini.",
        "Waktu istirahatmu belum cukup mengganti lelahnya aktivitas, jadi tubuh memang butuh ritme yang lebih lembut hari ini.",
        "Kurangnya pemulihan tidur bikin energi lebih cepat habis saat dihadapkan dengan tugas hari ini.",
      ])}${counselorSuffix}`,
      isotemporalActionPlan: evaluation.escalationFlag
        ? `Lakukan jalan santai ringan atau peregangan rileks selama ${gentleDuration} menit sore ini untuk bantu menenangkan tubuh.`
        : pickVariant([
            `Coba luangkan ${stdDuration} menit sore ini untuk jalan santai di area kampus atau kos supaya tubuh lebih rileks sebelum tidur malam.`,
            `Ambil ${stdDuration} menit untuk peregangan ringan atau jalan santai sore nanti agar ketegangan berkurang dan tidur malam lebih nyenyak.`,
          ]),
      recommendedMetsToday: clampMets(
        evaluation.escalationFlag ? lowMets : midMets,
        allowedRanges.metsRange
      ),
      scientificCitationNote: pickCitation("SLEEP_MEDIATION_DEFICIT"),
    },
    SEDENTARY_OVERLOAD: {
      dominantMediator: "SEDENTARY_OVERLOAD",
      diagnosisSummary: `${skipPrefix}${pickVariant([
        `Kamu sudah duduk cukup lama hari ini sekitar ${today.totalSedentaryHours.toFixed(1)} jam, wajar kalau tubuh mulai terasa kaku.`,
        `Durasi dudukmu hari ini sudah mencapai sekitar ${today.totalSedentaryHours.toFixed(1)} jam, otot leher dan punggung memang rentan tegang.`,
        `Setelah duduk sekitar ${today.totalSedentaryHours.toFixed(1)} jam, tubuh perlu jeda gerak singkat supaya nggak makin pegal.`,
      ])}${counselorSuffix}${checkInSuffix}`,
      isotemporalActionPlan: pickVariant([
        `Yuk berdiri sebentar dan jalan santai di sekitar meja atau koridor selama ${stdDuration} menit sekarang.${skipAdaptation.applied ? "" : " Usahakan jeda singkat tiap 50 menit belajar."}`,
        `Coba regangkan bahu, leher, lalu jalan kaki santai selama ${stdDuration} menit dulu untuk mengendurkan otot yang kaku.`,
        `Berdiri sebentar dari kursi dan lakukan gerak ringan atau jalan keliling ruangan selama ${stdDuration} menit sekarang.`,
      ]),
      recommendedMetsToday: clampMets(
        skipAdaptation.applied || evaluation.escalationFlag ? lowMets : midMets,
        allowedRanges.metsRange
      ),
      scientificCitationNote: pickCitation("SEDENTARY_OVERLOAD"),
    },
    LOW_MVPA_VOLUME: {
      dominantMediator: "LOW_MVPA_VOLUME",
      diagnosisSummary: `${skipPrefix}${pickVariant([
        `Hari ini total gerak aktifmu masih ${today.totalMvpaMinutes} menit, tubuhmu akan terbantu jika mendapat sedikit ruang bergerak.`,
        `Gerak aktifmu baru tercatat ${today.totalMvpaMinutes} menit hari ini—sedikit aktivitas ringan bisa bantu menyegarkan badan dan pikiran.`,
        `Dengan gerak aktif ${today.totalMvpaMinutes} menit sejauh ini, tubuhmu butuh dorongan kecil agar energi nggak terasa mandek.`,
      ])}${counselorSuffix}${checkInSuffix}`,
      isotemporalActionPlan: pickVariant([
        `Mulai pelan saja dengan berjalan santai menuju kantin atau sekitar halaman kos selama ${stdDuration} menit sekarang.`,
        `Coba keluar sebentar dan jalan kaki santai selama ${stdDuration} menit di sekitar kos atau koridor kampus.`,
        `Lakukan peregangan dinamis ringan atau jalan santai selama ${stdDuration} menit agar aliran energi kembali terasa.`,
      ]),
      recommendedMetsToday: clampMets(
        skipAdaptation.applied || evaluation.escalationFlag ? lowMets : midMets,
        allowedRanges.metsRange
      ),
      scientificCitationNote: pickCitation("LOW_MVPA_VOLUME"),
    },
    EXAM_ACUTE_STRESS: {
      dominantMediator: "EXAM_ACUTE_STRESS",
      diagnosisSummary: `${skipPrefix}${pickVariant([
        "Gerak dan tidurmu sudah cukup terjaga, namun beban tekanan kuliah hari ini terasa meningkat.",
        "Fisikmu sebenarnya cukup terjaga, tapi tekanan pikiran dari tugas atau ujian hari ini sedang cukup terasa.",
      ])}${counselorSuffix}`,
      isotemporalActionPlan: pickVariant([
        `Coba aktifkan Exam Panic Button atau jalan ringan selama ${stdDuration} menit sekarang sebelum melanjutkan belajar.`,
        `Luangkan ${stdDuration} menit untuk jalan pelan atau latihan pernapasan sebelum lanjut ke materi berikutnya.`,
      ]),
      recommendedMetsToday: clampMets(midMets, allowedRanges.metsRange),
      scientificCitationNote: pickCitation("EXAM_ACUTE_STRESS"),
    },
    OPTIMAL_BALANCE: {
      dominantMediator: "OPTIMAL_BALANCE",
      diagnosisSummary: `${skipPrefix}${pickVariant([
        "Ritme duduk dan gerakmu hari ini terjaga dengan baik.",
        "Keseimbangan aktivitas dan istirahatmu hari ini sudah cukup solid.",
      ])}${checkInSuffix || " Kerja bagus sudah memberi tubuh ruang bernapas di tengah kuliah."}`,
      isotemporalActionPlan: pickVariant([
        `Pertahankan kebiasaan baik ini dengan peregangan santai ${stdDuration} menit sebelum tidur agar pemulihan tetap optimal.`,
        `Jaga ritme positif ini dengan jeda peregangan ringan ${stdDuration} menit di sela atau akhir aktivitas hari ini.`,
      ]),
      recommendedMetsToday: clampMets(midMets, allowedRanges.metsRange),
      scientificCitationNote: pickCitation("OPTIMAL_BALANCE"),
    },
  };

  const base = { ...baseByMediator[evaluation.dominantMediator] };
  if (options?.forcedJenisGerak) {
    base.isotemporalActionPlan = `Coba ${options.forcedJenisGerak} selama ${gentleDuration} menit sekarang agar tubuh lebih rileks.`;
  }
  return base;
}

export type OllamaPromptMode = "auto" | "user-only" | "chatml";

export interface GenerateInsightOptions {
  fetchFn?: typeof fetch;
  enforceGuardrails?: boolean;
  model?: string;
  promptMode?: OllamaPromptMode;
  forcedJenisGerak?: string;
}

export interface OllamaChatMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

let customOllamaCaller: typeof callOllamaChatJson | null = null;

export function setOllamaCallerForTest(fn: typeof callOllamaChatJson | null): void {
  customOllamaCaller = fn;
}

interface OllamaChatRawResponse {
  message?: { content?: string };
  response?: string;
}

/**
 * Memanggil endpoint chat LLM: menggunakan Gradio ZeroGPU API (`/gradio_api/call/chat_api`)
 * saat diarahkan ke Hugging Face Space (`.hf.space`), atau `/api/chat` untuk Ollama standar.
 */
async function postOllamaChat(
  baseUrl: string,
  payload: Record<string, unknown>,
  timeoutMs: number,
  fetchFn: typeof fetch
): Promise<OllamaChatRawResponse> {
  const cleanBase = baseUrl.replace(/\/+$/, "");

  if (cleanBase.includes(".hf.space")) {
    const signal = AbortSignal.timeout(timeoutMs);
    const headers: Record<string, string> = { "Content-Type": "application/json" };
    if (env.HF_TOKEN) {
      headers.Authorization = `Bearer ${env.HF_TOKEN}`;
    }
    const submitRes = await fetchFn(`${cleanBase}/gradio_api/call/chat_api`, {
      method: "POST",
      headers,
      signal,
      body: JSON.stringify({ data: [JSON.stringify(payload)] }),
    });
    if (!submitRes.ok) {
      throw new Error(`HF Gradio submit HTTP ${submitRes.status}`);
    }
    const { event_id: eventId } = (await submitRes.json()) as { event_id?: string };
    if (!eventId) {
      throw new Error("HF Gradio missing event_id");
    }

    const sseRes = await fetchFn(`${cleanBase}/gradio_api/call/chat_api/${eventId}`, {
      method: "GET",
      headers: env.HF_TOKEN ? { Authorization: `Bearer ${env.HF_TOKEN}` } : undefined,
      signal,
    });
    if (!sseRes.ok) {
      throw new Error(`HF Gradio result HTTP ${sseRes.status}`);
    }

    const sseText = await sseRes.text();
    const lines = sseText.split(/\r?\n/);
    let currentEvent = "";
    for (const line of lines) {
      if (line.startsWith("event:")) {
        currentEvent = line.slice(6).trim();
      } else if (line.startsWith("data:") && currentEvent === "complete") {
        const parsedArr = JSON.parse(line.slice(5).trim()) as unknown[];
        const first = parsedArr[0];
        if (typeof first === "string") {
          return JSON.parse(first) as OllamaChatRawResponse;
        }
      } else if (line.startsWith("data:") && currentEvent === "error") {
        throw new Error(`HF Gradio error: ${line.slice(5).trim()}`);
      }
    }
    throw new Error("HF Gradio SSE ended without complete event");
  }

  const response = await fetchFn(`${cleanBase}/api/chat`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    signal: AbortSignal.timeout(timeoutMs),
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    throw new Error(`Ollama HTTP ${response.status}`);
  }

  return (await response.json()) as OllamaChatRawResponse;
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

  const rawBody = await postOllamaChat(
    env.OLLAMA_BASE_URL,
    {
      model: targetModel,
      stream: false,
      format: OLLAMA_RESPONSE_FORMAT,
      options: { temperature: 0.25, top_p: 0.9, num_predict: 512 },
      messages,
    },
    options.timeoutMs ?? env.OLLAMA_TIMEOUT_MS,
    fetchFn
  );
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
  // Tidak lagi menyisipkan directive BELUM_CHECKIN_HARIAN ke model;
  // kalimat penutup check-in ditambahkan secara deterministik oleh kode di enforceClinicalGuardrails.
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
  source: "OLLAMA_LOCAL" | "CLINICAL_FALLBACK" | "CRISIS_SAFETY_BYPASS";
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
  const forcedJenisGerak =
    typeof fetchOrOptions === "object" ? fetchOrOptions.forcedJenisGerak : undefined;

  // JALUR KRISIS BERSAMA: Bila catatan user mengindikasikan krisis berat, JANGAN panggil model.
  if (sharedDetectDistressKeywords(userTelemetry7Days.userNotes)) {
    const crisisInsight: GeneratedInsight = {
      dominantMediator: "EXAM_ACUTE_STRESS",
      diagnosisSummary: CRISIS_RESPONSE_TEXT,
      isotemporalActionPlan: "Tidak ada rencana aktivitas fisik. Diberikan protokol rujukan krisis.",
      recommendedMetsToday: 0,
      scientificCitationNote: "Protokol keselamatan kesehatan mental terpadu.",
    };
    return {
      insight: crisisInsight,
      source: "CRISIS_SAFETY_BYPASS",
      model: targetModel,
      escalationFlag: true,
    };
  }

  const evaluation = evaluateClinicalRuleFlags(userTelemetry7Days.today, {
    userNotes: userTelemetry7Days.userNotes,
  });
  const { allowedRanges, skipAdaptation } = computeCoachConstraints(
    evaluation.dominantMediator,
    evaluation.escalationFlag,
    userTelemetry7Days.recentInsights
  );
  const cleanToday = stripNullFields(userTelemetry7Days.today);
  const activeDirectives = buildActiveDirectives(evaluation, skipAdaptation);
  activeDirectives.push(
    "DATA_TIDAK_LENGKAP: jangan menyebut angka, durasi, atau tingkat aktivitas yang tidak ada di input user"
  );
  if (forcedJenisGerak) {
    activeDirectives.push(`JENIS_GERAK: ${forcedJenisGerak}`);
    activeDirectives.push(`PILIHAN_GERAK_USER: user memilih opsi gerak '${forcedJenisGerak}'`);
  }
  if (
    userTelemetry7Days.today.sleepHours !== null &&
    userTelemetry7Days.today.sleepHours !== undefined
  ) {
    activeDirectives.push(
      "TAFSIR_TIDUR: sleepHours adalah lama tidur semalam, bukan kejadian barusan. Jangan memakai kata 'baru saja' untuk durasi tidur."
    );
  }

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
    today: cleanToday,
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
    const caller = customOllamaCaller ?? callOllamaChatJson;
    const { insight: parsed } = await caller(messages, {
      fetchFn,
      model: targetModel,
    });
    const finalInsight = enforceGuardrails
      ? enforceClinicalGuardrails(parsed, evaluation, allowedRanges)
      : parsed;

    const deduped = deduplicateResponse(
      finalInsight.diagnosisSummary,
      finalInsight.isotemporalActionPlan
    );
    finalInsight.diagnosisSummary = deduped.summary;
    finalInsight.isotemporalActionPlan = deduped.plan;

    return {
      insight: finalInsight,
      source: "OLLAMA_LOCAL",
      model: targetModel,
      escalationFlag: evaluation.escalationFlag,
    };
  } catch (err) {
    console.warn("[Ollama Coach Fallback]", err instanceof Error ? err.message : err);
    return {
      insight: buildDeterministicFallbackInsight(userTelemetry7Days, { forcedJenisGerak }),
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

export interface ConversationalAcademicInput {
  userNotes: string;
  chatHistory?: Array<{ role: "user" | "assistant"; text: string }>;
  todayTotals: {
    totalSedentaryHours: number;
    totalMvpaMinutes: number;
    sleepHours: number | null;
    pss4TotalScore: number | null;
  };
  schedules?: Array<{
    dayOfWeek: number;
    subjectName: string;
    creditHours: number;
    isPracticum?: boolean;
    isExamWeek?: boolean;
    startTime?: string | null;
    endTime?: string | null;
  }>;
  userName?: string;
}

const DAY_LABELS_ID = ["Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu", "Minggu"];

/**
 * Fallback deterministik hangat & terstruktur untuk pertanyaan strategi belajar, jadwal KRS,
 * atau obrolan lanjutan saat Ollama lokal tidak aktif.
 */
export function buildAcademicConversationalFallback(
  input: ConversationalAcademicInput
): string {
  const schedules = input.schedules ?? [];
  const totalSks = schedules.reduce((s, c) => s + (Number(c.creditHours) || 0), 0);
  const nowDay = new Date().getDay() === 0 ? 7 : new Date().getDay();
  const todayClasses = schedules.filter((s) => s.dayOfWeek === nowDay);
  const hasExam = schedules.some((s) => s.isExamWeek);
  const lower = input.userNotes.toLowerCase();

  const krsLine =
    schedules.length > 0
      ? todayClasses.length > 0
        ? `Hari ini (${DAY_LABELS_ID[nowDay - 1]}) kamu punya ${todayClasses.length} mata kuliah (${todayClasses
            .map((c) => `${c.subjectName}${c.startTime ? ` (${c.startTime})` : ""}`)
            .join(", ")}) dari total ${totalSks} SKS.`
        : `Total beban KRS aktifmu saat ini ${totalSks} SKS (${schedules.length} mata kuliah), dan hari ini jadwal kuliahmu relatif lebih longgar.`
      : "Kamu belum mengisi jadwal KRS di dashboard, jadi aku belum melihat jam kuliah spesifikmu.";

  if (/\b(skripsi|tesis|menunda|prokrastinasi)\b/i.test(lower)) {
    return `${krsLine}\n\nUntuk memutus rasa berat saat mengerjakan tugas besar/skripsi:\n1. Pecah jadi target mikro 15 menit (cukup buka dokumen dan tulis 1 sub-bagian atau 3 poin kerangka dulu).\n2. Pakai pola 25 menit fokus + 5 menit berdiri/jeda mata tanpa buka media sosial.\n3. Setelah 2 sesi, ambil jeda aktif 2 menit supaya pikiran tetap jernih${
      hasExam ? " apalagi menjelang pekan ujian" : ""
    }.`;
  }

  if (/\b(jadwal|atur waktu|belajar dan istirahat|pomodoro|kapan)\b/i.test(lower)) {
    return `${krsLine}\n\nPola ritme belajar-istirahat yang seimbang untuk kondisi dudukmu saat ini (${input.todayTotals.totalSedentaryHours.toFixed(
      1
    )} jam duduk, ${input.todayTotals.totalMvpaMinutes} menit gerak aktif):\n1. Belajar dalam blok 45–50 menit fokus, lalu wajib berdiri atau jalan santai 5–10 menit.\n2. Gunakan aturan 20-20-20 untuk mata (tiap 20 menit, tatap jarak jauh 20 detik).\n3. Sisipkan 1 sesi gerak ringan 15–20 menit sore hari agar malamnya tidur lebih mudah pulas.`;
  }

  return `${krsLine}\n\nAgar tugas dan beban kuliah tetap terkendali tanpa memicu burnout:\n1. Urutkan 1–2 tugas prioritas utama hari ini lewat daftar Target Tugas di menu Fokus.\n2. Jalankan sesi belajar terukur 25–50 menit diikuti jeda peregangan singkat di antara pergantian tugas.\n3. Kalau mau dibuatkan pembagian jam belajar spesifik hari ini, sebutkan saja tugas paling mendesak yang sedang kamu kejar sekarang!`;
}

/**
 * Menjawab pertanyaan strategi belajar, jadwal kuliah/KRS, dan tindak lanjut multi-turn
 * dengan Ollama Gemma secara natural (mengingat riwayat obrolan & jadwal kuliah asli mahasiswa).
 */
export async function generateFreeformAcademicCoachReply(
  input: ConversationalAcademicInput,
  fetchFn: typeof fetch = fetch
): Promise<{ text: string; source: "OLLAMA_CONVERSATIONAL" | "ACADEMIC_FALLBACK"; model: string }> {
  const targetModel = env.OLLAMA_MODEL;
  const schedules = input.schedules ?? [];
  const totalSks = schedules.reduce((s, c) => s + (Number(c.creditHours) || 0), 0);
  const nowDay = new Date().getDay() === 0 ? 7 : new Date().getDay();
  const todayClasses = schedules
    .filter((s) => s.dayOfWeek === nowDay)
    .map((s) => `${s.subjectName} (${s.creditHours} SKS${s.startTime ? `, ${s.startTime}-${s.endTime || ""}` : ""})`);

  const systemGuide = `Kamu adalah CampusFlow AI Coach: pendamping belajar dan kesehatan mahasiswa Indonesia yang hangat, praktis, terstruktur, dan empatik.
Jawablah dalam Bahasa Indonesia yang luwes dan mendalam (boleh 2-3 paragraf singkat atau poin bernomor yang jelas).
Gunakan konteks nyata mahasiswa berikut jika relevan:
- Nama: ${input.userName || "Mahasiswa"}
- Hari ini: ${DAY_LABELS_ID[nowDay - 1]} | Total KRS: ${schedules.length} matkul (${totalSks} SKS)
- Jadwal hari ini: ${todayClasses.length > 0 ? todayClasses.join("; ") : "Tidak ada kelas terjadwal / belum diisi"}
- Telemetri hari ini: duduk ${input.todayTotals.totalSedentaryHours.toFixed(1)} jam, gerak aktif ${input.todayTotals.totalMvpaMinutes} menit, tidur ${
    input.todayTotals.sleepHours !== null ? `${input.todayTotals.sleepHours} jam` : "belum diisi"
  }.
Aturan penting:
1. Jawab langsung kebutuhan mahasiswa (atur jadwal belajar, strategi tugas/skripsi, manajemen stres/fokus, atau penjelasan lanjutan). Jangan selalu memaksa resep olahraga jika mahasiswa bertanya strategi belajar/skripsi.
2. Tetap selipkan pengingat jeda aktif/ergonomi secara alami bila relevan.
3. Jangan mengarang diagnosis medis atau angka riset fiktif.
4. Jika pertanyaan benar-benar di luar dunia kuliah/kesejahteraan mahasiswa (misal coding aplikasi, resep masakan, skor bola), tolak dengan sopan.`;

  const historyMessages: OllamaChatMessage[] = (input.chatHistory ?? [])
    .slice(-6)
    .filter((m) => m.text && m.text.trim())
    .map((m) => ({
      role: m.role === "assistant" ? "assistant" : "user",
      content: m.text.trim().slice(0, 600),
    }));

  const messages: OllamaChatMessage[] = [
    { role: "system", content: systemGuide },
    ...historyMessages,
    { role: "user", content: input.userNotes.trim() },
  ];

  try {
    const rawBody = await postOllamaChat(
      env.OLLAMA_BASE_URL,
      {
        model: targetModel,
        stream: false,
        options: { temperature: 0.35, top_p: 0.9, num_predict: 512 },
        messages,
      },
      env.OLLAMA_TIMEOUT_MS,
      fetchFn
    );
    const rawText = (rawBody.message?.content ?? rawBody.response ?? "").trim();
    if (!rawText) {
      throw new Error("Empty Ollama conversational response");
    }

    return {
      text: cleanIndonesianCoachTypos(rawText),
      source: "OLLAMA_CONVERSATIONAL",
      model: targetModel,
    };
  } catch (err) {
    console.warn("[Ollama Conversational Fallback]", err instanceof Error ? err.message : err);
    return {
      text: buildAcademicConversationalFallback(input),
      source: "ACADEMIC_FALLBACK",
      model: targetModel,
    };
  }
}