# LLM_AI_COACH.md — Orkestrasi Agentic AI Coach (Ollama Lokal)

> **FILE TARGET:** `backend/src/services/ollamaCoach.ts`  
> **PENANGGUNG JAWAB:** Syifa (`@syifamojocanggih-hash` — branch `backend`)  
> **ENGINE LLM:** Ollama Lokal (`http://localhost:11434/api/chat`) dengan *Structured JSON Output* (`format` JSON Schema) tanpa API key eksternal

---

## 1. Alasan Menggunakan Ollama Lokal

- **Tanpa API Key Berbayar / Kuota Cloud:** Seluruh inferensi AI Coach berjalan lokal di mesin pengembang/server menggunakan Ollama dengan model kustom **`campusflow-coach`** (dibangun dari base `qwen2.5:3b` via [`backend/ollama/Modelfile`](../../backend/ollama/Modelfile)).
- **Kepatuhan Batasan Klinis (Rule-Lock + Guardrails + Safety):**
  - `evaluateClinicalRuleFlags` di [`ollamaCoach.ts`](../../backend/src/services/ollamaCoach.ts) bertindak sebagai pengambil keputusan deterministik (`dominantMediator` disalin 1:1, `flags` kosong → `OPTIMAL_BALANCE`, membedakan belum check-in harian `pss4TotalScore: null`). LLM bertugas menyusun narasi empatik, rencana aksi spesifik (`durasi` + `waktu`), target METs dalam `allowedRanges`, dan sitasi tervalidasi tanpa mengarang angka baru.
  - **Eskalasi Keamanan (`PSS-4 >= 10` / kata kunci darurat di `notes`):** menandai `escalationFlag: true`, membatasi rekomendasi ke aksi ringan/stabilisasi (`80–160` METs), dan menyertakan ajakan halus berbicara dengan konselor kampus.
  - **Konsistensi Antar-Sesi (`-40%` maks):** `computeCoachConstraints` mengecek riwayat insight `isCompleted = false` beruntun (`>= 2`) dan menurunkan rentang target secara bertahap (maksimal `-40%`).
- **Privasi Data Mahasiswa Lebih Ketat:** Data skor stres (PSS-4/10), jam tidur, dan aktivitas fisik tidak perlu keluar ke API pihak ketiga.
- **Structured JSON Output:** Endpoint `/api/chat` Ollama dipanggil dengan parameter `format` JSON Schema + validasi `zod` agar struktur respons (`dominantMediator`, `diagnosisSummary`, `isotemporalActionPlan`, `recommendedMetsToday`, `scientificCitationNote`) 100% terjamin sesuai [`INTERFACES.md`](../universal/INTERFACES.md).
- **Deterministic Clinical Fallback:** Bila server Ollama lokal belum menyala atau timeout (`OLLAMA_TIMEOUT_MS`), sistem otomatis beralih ke [`buildDeterministicFallbackInsight`](../../backend/src/services/ollamaCoach.ts) (`generationSource: "CLINICAL_FALLBACK"`).

---

## 2. Konfigurasi di `backend/.env`

```env
OLLAMA_BASE_URL="http://localhost:11434"
OLLAMA_MODEL="campusflow-coach"
OLLAMA_TIMEOUT_MS=60000
```

Menyiapkan, membangun ulang model kustom, dan mengevaluasi akurasi klinis Ollama lokal:
```bash
ollama serve
ollama pull qwen2.5:3b
npm --prefix backend run ollama:create   # membuat/memperbarui model campusflow-coach dari Modelfile
npm --prefix backend run ollama:eval     # menguji 10 skenario klinis live (termasuk eskalasi, pss4=null, & adaptasi skip)
```
