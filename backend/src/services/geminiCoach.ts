import { GoogleGenAI, Type } from "@google/genai";
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

const SYSTEM_INSTRUCTION = `Anda adalah Clinical Academic Wellbeing AI Coach di dalam aplikasi CampusFlow PWA.
Seluruh analisis dan rekomendasi Anda WAJIB didasarkan pada bukti ilmiah dari kajian sistematis
Martín-Rodríguez & González-Prieto (2026):
1. Jika totalSedentaryHours >= 9 jam atau mvpaPerSedentaryRatio < 25 menit/jam, identifikasi risiko
'SEDENTARY_OVERLOAD' (Barbosa et al., 2024: OR depresi = 1.74) dan resepkan substitusi isotemporal
15 menit gerak aktif (Su et al., 2022).
2. Jika sleepHours < 7.0 jam atau sleepQualityScore <= 2 sementara pss4TotalScore >= 8, identifikasi
mediator 'SLEEP_MEDIATION_DEFICIT' (Mu et al., 2024; Wang et al., 2025: tidur memediasi 41%
hubungan aktivitas fisik & stres). Sarankan jalan cepat/aerobik ringan 20-30 menit pada sore hari
(pukul 16.00-17.30) untuk menurunkan latensi tidur malam.
3. Jika pengguna gagal memenuhi ketiga pilar 24-Hour Movement Guidelines (triadPillarsMet == 0),
peringatkan lonjakan risiko stres/depresi (Zhang et al., 2024: OR = 3.4) dan berikan target bertahap.
Gunakan bahasa Indonesia yang empatik, suportif bagi mahasiswa, namun tegas secara ilmiah.`;

/** Fallback klinis deterministik bila GEMINI_API_KEY belum diisi atau API gagal dihubungi. */
export function buildDeterministicFallbackInsight(input: Telemetry7DaysInput): GeneratedInsight {
  const { today } = input;

  if (
    (today.sleepHours < 7.0 || today.sleepQualityScore <= 2) &&
    today.pss4TotalScore >= 8
  ) {
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

  if (today.totalSedentaryHours >= 9.0 || (today.totalSedentaryHours > 6 && today.mvpaPerSedentaryRatio < 25)) {
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

  if (today.totalMvpaMinutes < 30 || today.triadPillarsMet === 0) {
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

  if (today.pss4TotalScore >= 8) {
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

/** Menghasilkan rekomendasi personal menggunakan Gemini 2.5 Flash Structured Output dengan fallback aman. */
export async function generateClinicalWellbeingInsight(
  userTelemetry7Days: Telemetry7DaysInput
): Promise<{ insight: GeneratedInsight; source: "GEMINI_2_5_FLASH" | "CLINICAL_FALLBACK" }> {
  if (!env.GEMINI_API_KEY) {
    return {
      insight: buildDeterministicFallbackInsight(userTelemetry7Days),
      source: "CLINICAL_FALLBACK",
    };
  }

  try {
    const ai = new GoogleGenAI({ apiKey: env.GEMINI_API_KEY });
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: JSON.stringify(userTelemetry7Days),
      config: {
        systemInstruction: SYSTEM_INSTRUCTION,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            dominantMediator: {
              type: Type.STRING,
              description:
                "Kode pemicu utama: SEDENTARY_OVERLOAD | SLEEP_MEDIATION_DEFICIT | LOW_MVPA_VOLUME | EXAM_ACUTE_STRESS | OPTIMAL_BALANCE",
            },
            diagnosisSummary: {
              type: Type.STRING,
              description:
                "Analisis 2-3 kalimat yang menjelaskan kaitan data duduk, langkah, dan tidur pengguna terhadap skor stresnya.",
            },
            isotemporalActionPlan: {
              type: Type.STRING,
              description:
                "Instruksi aksi fisik spesifik berdurasi 10-20 menit yang dapat dilakukan hari ini di lingkungan kampus/kos.",
            },
            recommendedMetsToday: {
              type: Type.INTEGER,
              description: "Target angka MET-menit harian yang disarankan (misal: 250).",
            },
            scientificCitationNote: {
              type: Type.STRING,
              description:
                "Kutipan singkat studi pendukung dari jurnal (contoh: 'Berdasarkan protokol substitusi isotemporal Su et al., 2022').",
            },
          },
          required: [
            "dominantMediator",
            "diagnosisSummary",
            "isotemporalActionPlan",
            "recommendedMetsToday",
            "scientificCitationNote",
          ],
        },
      },
    });

    const parsed = JSON.parse(response.text || "{}") as GeneratedInsight;
    if (!parsed.dominantMediator || !parsed.diagnosisSummary || !parsed.isotemporalActionPlan) {
      throw new Error("Struktur JSON Gemini tidak lengkap.");
    }
    return { insight: parsed, source: "GEMINI_2_5_FLASH" };
  } catch (err) {
    console.warn("[Gemini Coach Fallback]", err);
    return {
      insight: buildDeterministicFallbackInsight(userTelemetry7Days),
      source: "CLINICAL_FALLBACK",
    };
  }
}

