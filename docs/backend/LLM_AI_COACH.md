# LLM_AI_COACH.md — Orkestrasi Agentic AI Coach (Ollama Lokal)

> **FILE TARGET:** `backend/src/services/ollamaCoach.ts`  
> **PENANGGUNG JAWAB:** Syifa (`@syifamojocanggih-hash` — branch `backend`)  
> **ENGINE LLM:** Ollama Lokal (`http://localhost:11434/api/chat`) dengan *Structured JSON Output* (`format` JSON Schema) tanpa API key eksternal

---

## 1. Alasan Menggunakan Ollama Lokal

- **Tanpa API Key Berbayar / Kuota Cloud:** Seluruh inferensi AI Coach berjalan lokal di mesin pengembang/server menggunakan Ollama dengan model kustom **`campusflow-coach`** (dibangun dari base `qwen2.5:3b` via [`backend/ollama/Modelfile`](../../backend/ollama/Modelfile)).
- **Kepatuhan Batasan Klinis (System Rules + Few-Shot + Rule Flags):** [`backend/ollama/Modelfile`](../../backend/ollama/Modelfile) menyuntikkan parameter rendah halusinasi (`temperature 0.15`, `top_p 0.85`, `repeat_penalty 1.1`, `num_ctx 4096`), 5 urutan prioritas aturan Martín-Rodríguez & González-Prieto (2026), serta contoh *few-shot* berbahasa Indonesia; lalu `evaluateClinicalRuleFlags` di [`ollamaCoach.ts`](../../backend/src/services/ollamaCoach.ts) memastikan batas kondisi klinis tidak melenceng.
- **Privasi Data Mahasiswa Lebih Ketat:** Data skor stres (PSS-4/10), jam tidur, dan aktivitas fisik tidak perlu keluar ke API pihak ketiga.
- **Structured JSON Output:** Endpoint `/api/chat` Ollama dipanggil dengan parameter `format` JSON Schema + validasi `zod` agar struktur respons (`dominantMediator`, `diagnosisSummary`, `isotemporalActionPlan`, `recommendedMetsToday`, `scientificCitationNote`) 100% terjamin.
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
npm --prefix backend run ollama:eval     # menguji 7 skenario klinis live terhadap Ollama lokal
```
