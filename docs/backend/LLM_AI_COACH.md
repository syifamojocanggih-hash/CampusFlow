# LLM_AI_COACH.md — Orkestrasi Agentic AI Coach (Google Gemini API)

> **FILE TARGET:** `backend/src/services/geminiCoach.ts`  
> **PENANGGUNG JAWAB:** Syifa (`@syifamojocanggih-hash` — branch `backend`)  
> **MODEL:** `gemini-2.5-flash` via SDK `@google/genai` dengan *Structured Outputs*

---

## 1. Implementasi Produksi (`geminiCoach.ts`)

```ts
// File: backend/src/services/geminiCoach.ts
import { GoogleGenAI, Type } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

export async function generateClinicalWellbeingInsight(userTelemetry7Days: object) {
  const systemInstruction = `Anda adalah Clinical Academic Wellbeing AI Coach di dalam aplikasi CampusFlow PWA.
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

  const response = await ai.models.generateContent({
    model: "gemini-2.5-flash",
    contents: JSON.stringify(userTelemetry7Days),
    config: {
      systemInstruction,
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

  return JSON.parse(response.text || "{}");
}
```

---

## 2. Protokol Keamanan & Fallback

1. **API Key Isolation:** `GEMINI_API_KEY` dibaca eksklusif dari `process.env.GEMINI_API_KEY` di backend.
2. **Deterministic Clinical Fallback:** Jika panggilan ke Gemini gagal (timeout jaringan, kuota habis, atau key belum diatur saat testing lokal), service wajib menghasilkan objek JSON yang strukturnya identik menggunakan aturan deterministik dari `clinicalScoring.ts` (mis. memeriksa `sleepHours < 7.0 && pss4TotalScore >= 8` → `SLEEP_MEDIATION_DEFICIT`) agar frontend tidak pernah error.
