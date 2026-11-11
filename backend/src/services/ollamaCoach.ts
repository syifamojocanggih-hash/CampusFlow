import { z } from "zod";
import type { DominantMediator } from "../../../shared/contracts/index.ts";
import { env } from "../config/env.ts";

export interface Telemetry7DaysInput {
  today: {
    totalSedentaryHours: number;
    totalMvpaMinutes: number;
    mvpaPerSedentaryRatio: number;
    sleepHours: number;
    sleepQualityScore: number;
    pss4TotalScore: number;
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
}

export interface GeneratedInsight {
  dominantMediator: DominantMediator;
  diagnosisSummary: string;
  isotemporalActionPlan: string;
  recommendedMetsToday: number;
  scientificCitationNote: string;
}

const VALID_MEDIATORS = [
  "SEDENTARY_OVERLOAD",
  "SLEEP_MEDIATION_DEFICIT",
  "LOW_MVPA_VOLUME",
  "EXAM_ACUTE_STRESS",
  "OPTIMAL_BALANCE",
] as const;

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

const SYSTEM_INSTRUCTION = `Anda adalah Clinical Academic Wellbeing AI Coach di dalam aplikasi CampusFlow PWA.
Evaluasi kondisi mahasiswa HARI INI (today) berdasarkan urutan prioritas ketat berikut (berhenti pada syarat PERTAMA yang terpenuhi, dan jika objek clinicalRuleEvaluation disertakan ikuti priorityMediator-nya) dari Martín-Rodríguez & González-Prieto (2026); history7Days hanya konteks tren naratif:
1. SLEEP_MEDIATION_DEFICIT (PRIORITAS #1 MUTLAK): Jika (sleepHours < 7.0 ATAU sleepQualityScore <= 2) DAN pss4TotalScore >= 8 -> LANGSUNG pilih ini walau totalSedentaryHours >= 9.0 atau MVPA < 30! Mediasi tidur ~41% (Mu et al., 2024; Wang et al., 2025). Sarankan jalan cepat/aerobik sore pukul 16.00-17.30 selama 20-30 menit.
2. SEDENTARY_OVERLOAD: Jika totalSedentaryHours >= 9.0 ATAU (totalSedentaryHours > 6.0 DAN mvpaPerSedentaryRatio < 25) -> Barbosa et al. (2024) OR=1.74; Su et al. (2022). Resepkan substitusi isotemporal 15 menit gerak aktif sekarang + jeda tiap 50 menit duduk. (Jika totalSedentaryHours <= 6.0, JANGAN PERNAH pilih ini meski mvpaPerSedentaryRatio < 25).
3. LOW_MVPA_VOLUME: Jika totalMvpaMinutes < 30 ATAU triadPillarsMet == 0 -> Zhang et al. (2024) OR=3.4; Ai et al. (2021). Sarankan 15-20 menit MVPA + latihan penguatan otot ringan. (Jika totalMvpaMinutes >= 30 DAN triadPillarsMet >= 1, JANGAN pilih ini).
4. EXAM_ACUTE_STRESS: Jika pss4TotalScore >= 8 saat sleepHours >= 7.0, totalSedentaryHours < 9.0, dan totalMvpaMinutes >= 30 -> Wu & Zhou (2024). Arahkan fitur Exam Panic Button 15 menit (110-125 BPM).
5. OPTIMAL_BALANCE: Jika semua pilar seimbang -> apresiasi & jaga 24-Hour Movement Guidelines.
Gunakan bahasa Indonesia yang empatik, suportif, dan jawab HANYA dengan JSON valid sesuai skema.`;

interface ClinicalRuleFlags {
  sleepDeficit: boolean;
  sedentaryOverload: boolean;
  lowMvpaVolume: boolean;
  examAcuteStress: boolean;
  priorityMediator: DominantMediator;
}

/** Mengevaluasi bendera batas klinis secara deterministik sesuai prioritas Martín-Rodríguez & González-Prieto (2026). */
export function evaluateClinicalRuleFlags(today: Telemetry7DaysInput["today"]): ClinicalRuleFlags {
  const sleepDeficit =
    (today.sleepHours < 7.0 || today.sleepQualityScore <= 2) && today.pss4TotalScore >= 8;
  const sedentaryOverload =
    today.totalSedentaryHours >= 9.0 ||
    (today.totalSedentaryHours > 6 && today.mvpaPerSedentaryRatio < 25);
  const lowMvpaVolume = today.totalMvpaMinutes < 30 || today.triadPillarsMet === 0;
  const examAcuteStress = today.pss4TotalScore >= 8;

  let priorityMediator: DominantMediator = "OPTIMAL_BALANCE";
  if (sleepDeficit) {
    priorityMediator = "SLEEP_MEDIATION_DEFICIT";
  } else if (sedentaryOverload) {
    priorityMediator = "SEDENTARY_OVERLOAD";
  } else if (lowMvpaVolume) {
    priorityMediator = "LOW_MVPA_VOLUME";
  } else if (examAcuteStress) {
    priorityMediator = "EXAM_ACUTE_STRESS";
  }

  return {
    sleepDeficit,
    sedentaryOverload,
    lowMvpaVolume,
    examAcuteStress,
    priorityMediator,
  };
}

/** Fallback klinis deterministik bila server Ollama lokal belum menyala atau gagal merespons. */
export function buildDeterministicFallbackInsight(input: Telemetry7DaysInput): GeneratedInsight {
  const { today } = input;
  const { priorityMediator } = evaluateClinicalRuleFlags(today);

  if (priorityMediator === "SLEEP_MEDIATION_DEFICIT") {
    return {
      dominantMediator: "SLEEP_MEDIATION_DEFICIT",
      diagnosisSummary: `Skor stres harian PSS-4 Anda (${today.pss4TotalScore}/16) meningkat bersamaan dengan durasi tidur ${today.sleepHours} jam (kualitas ${today.sleepQualityScore}/5). Defisit tidur melemahkan pemulihan stres akademik harian Anda.`,
      isotemporalActionPlan:
        "Lakukan jalan cepat atau aerobik intensitas sedang selama 20–25 menit pada sore hari (pukul 16.00–17.30) di area kampus atau sekitar kos untuk membantu menurunkan latensi tidur malam ini.",
      recommendedMetsToday: 240,
      scientificCitationNote:
        "Berdasarkan efek mediasi kualitas tidur ~41% oleh Mu et al. (2024) & Wang et al. (2025).",
    };
  }

  if (priorityMediator === "SEDENTARY_OVERLOAD") {
    return {
      dominantMediator: "SEDENTARY_OVERLOAD",
      diagnosisSummary: `Waktu duduk statis tercatat ${today.totalSedentaryHours.toFixed(1)} jam dengan rasio gerak ${today.mvpaPerSedentaryRatio} menit per jam duduk. Beban duduk panjang tanpa jeda memicu ketegangan otot dan kelelahan mental.`,
      isotemporalActionPlan:
        "Terapkan substitusi isotemporal segera: berdiri dari kursi dan lakukan jalan kaki cepat keliling gedung atau naik-turun tangga selama 15 menit, lalu lanjutkan jeda peregangan tiap 50 menit belajar.",
      recommendedMetsToday: 220,
      scientificCitationNote:
        "Berdasarkan risiko sedentari Barbosa et al. (2024) dan protokol substitusi isotemporal Su et al. (2022).",
    };
  }

  if (priorityMediator === "LOW_MVPA_VOLUME") {
    return {
      dominantMediator: "LOW_MVPA_VOLUME",
      diagnosisSummary: `Volume aktivitas fisik sedang-berat hari ini baru mencapai ${today.totalMvpaMinutes} menit dengan ${today.triadPillarsMet}/3 pilar 24-Hour Movement terpenuhi. Volume gerak yang masih di bawah 30 menit mengurangi proteksi alami terhadap stres kuliah.`,
      isotemporalActionPlan:
        "Tambahkan minimal 15–20 menit aktivitas fisik sedang (jalan cepat 100–125 langkah/menit) ditambah 1 sesi latihan penguatan otot ringan seperti push-up/squat di kamar.",
      recommendedMetsToday: 200,
      scientificCitationNote:
        "Berdasarkan pedoman 24-Hour Movement Zhang et al. (2024) dan manfaat MSE Ai et al. (2021).",
    };
  }

  if (priorityMediator === "EXAM_ACUTE_STRESS") {
    return {
      dominantMediator: "EXAM_ACUTE_STRESS",
      diagnosisSummary: `Aktivitas fisik dan tidur Anda relatif terjaga, namun skor PSS-4 (${today.pss4TotalScore}/16) menunjukkan lonjakan stres akademik akut (seperti tekanan tugas atau ujian).`,
      isotemporalActionPlan:
        "Gunakan fitur Exam Panic Button selama 15 menit (gerakan aerobik ringan-sedang di tempat dengan ritme 110–125 BPM) untuk meredakan kecemasan akut sebelum kembali belajar.",
      recommendedMetsToday: 180,
      scientificCitationNote:
        "Berdasarkan uji klinis latihan aerobik akut 15 menit oleh Wu & Zhou (2024).",
    };
  }

  return {
    dominantMediator: "OPTIMAL_BALANCE",
    diagnosisSummary: `Keseimbangan gerak (${today.totalMvpaMinutes} menit MVPA), waktu duduk (${today.totalSedentaryHours.toFixed(1)} jam), dan tidur (${today.sleepHours} jam) Anda hari ini berada dalam zona protektif terhadap stres.`,
    isotemporalActionPlan:
      "Pertahankan ritme jeda aktif 5–10 menit setiap 50 menit belajar di depan laptop dan pastikan minimal 2 hari latihan penguatan otot dalam minggu ini.",
    recommendedMetsToday: 250,
    scientificCitationNote:
      "Sesuai kerangka sinergis 24-Hour Movement Guidelines dalam Martín-Rodríguez & González-Prieto (2026).",
  };
}

/** Menghasilkan insight klinis dari server Ollama lokal (`/api/chat` JSON Schema) dengan fallback aman. */
export async function generateClinicalWellbeingInsight(
  userTelemetry7Days: Telemetry7DaysInput,
  fetchFn: typeof fetch = fetch
): Promise<{
  insight: GeneratedInsight;
  source: "OLLAMA_LOCAL" | "CLINICAL_FALLBACK";
  model: string;
}> {
  const endpoint = `${env.OLLAMA_BASE_URL.replace(/\/+$/, "")}/api/chat`;
  const clinicalRuleEvaluation = evaluateClinicalRuleFlags(userTelemetry7Days.today);
  const promptPayload = {
    ...userTelemetry7Days,
    clinicalRuleEvaluation,
  };
  const usesBakedModelfile = env.OLLAMA_MODEL.startsWith("campusflow-coach");
  const messages = usesBakedModelfile
    ? [{ role: "user", content: JSON.stringify(promptPayload) }]
    : [
        { role: "system", content: SYSTEM_INSTRUCTION },
        {
          role: "user",
          content: `Analisis data telemetri mahasiswa 7 hari berikut dan berikan rekomendasi JSON terstruktur:\n${JSON.stringify(
            promptPayload
          )}`,
        },
      ];

  try {
    const response = await fetchFn(endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      signal: AbortSignal.timeout(env.OLLAMA_TIMEOUT_MS),
      body: JSON.stringify({
        model: env.OLLAMA_MODEL,
        stream: false,
        format: OLLAMA_RESPONSE_FORMAT,
        options: { temperature: 0.15 },
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
    const parsed = insightOutputSchema.parse(JSON.parse(rawJsonText));

    return {
      insight: parsed,
      source: "OLLAMA_LOCAL",
      model: env.OLLAMA_MODEL,
    };
  } catch (err) {
    console.warn("[Ollama Coach Fallback]", err instanceof Error ? err.message : err);
    return {
      insight: buildDeterministicFallbackInsight(userTelemetry7Days),
      source: "CLINICAL_FALLBACK",
      model: env.OLLAMA_MODEL,
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
  fetchFn: typeof fetch = fetch
): Promise<OllamaStatusResult> {
  const baseUrl = env.OLLAMA_BASE_URL.replace(/\/+$/, "");
  try {
    const response = await fetchFn(`${baseUrl}/api/tags`, {
      method: "GET",
      signal: AbortSignal.timeout(2500),
    });
    if (!response.ok) {
      throw new Error(`Ollama status HTTP ${response.status}`);
    }
    const json = (await response.json()) as { models?: Array<{ name?: string }> };
    const availableModels = (json.models ?? [])
      .map((item) => item.name ?? "")
      .filter(Boolean);
    const modelInstalled = availableModels.some(
      (name) => name === env.OLLAMA_MODEL || name.startsWith(`${env.OLLAMA_MODEL}:`)
    );
    return {
      reachable: true,
      baseUrl,
      configuredModel: env.OLLAMA_MODEL,
      modelInstalled,
      availableModels,
    };
  } catch {
    return {
      reachable: false,
      baseUrl,
      configuredModel: env.OLLAMA_MODEL,
      modelInstalled: false,
      availableModels: [],
    };
  }
}

