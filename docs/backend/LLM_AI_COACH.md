# LLM_AI_COACH.md — Orkestrasi Agentic AI Coach (Ollama Lokal)

> **FILE TARGET:** `backend/src/services/ollamaCoach.ts`  
> **PENANGGUNG JAWAB:** Syifa (`@syifamojocanggih-hash` — branch `backend`)  
> **ENGINE LLM:** Ollama Lokal (`http://localhost:11434/api/chat`) dengan *Structured JSON Output* (`format` JSON Schema) tanpa API key eksternal

---

## 1. Alasan Menggunakan Ollama Lokal

- **Tanpa API Key Berbayar / Kuota Cloud:** Seluruh inferensi AI Coach berjalan lokal di mesin pengembang/server menggunakan Ollama (`llama3.2`, `qwen2.5:7b`, atau model lokal lainnya).
- **Privasi Data Mahasiswa Lebih Ketat:** Data skor stres (PSS-4/10), jam tidur, dan aktivitas fisik tidak perlu keluar ke API pihak ketiga.
- **Structured JSON Output:** Endpoint `/api/chat` Ollama dipanggil dengan parameter `format` JSON Schema + validasi `zod` agar struktur respons (`dominantMediator`, `diagnosisSummary`, `isotemporalActionPlan`, `recommendedMetsToday`, `scientificCitationNote`) 100% terjamin.
- **Deterministic Clinical Fallback:** Bila server Ollama lokal belum menyala atau timeout (`OLLAMA_TIMEOUT_MS`), sistem otomatis beralih ke [`buildDeterministicFallbackInsight`](../../backend/src/services/ollamaCoach.ts) berbasis konstanta klinis Martín-Rodríguez & González-Prieto (2026) (`generationSource: "CLINICAL_FALLBACK"`).

---

## 2. Konfigurasi di `backend/.env`

```env
OLLAMA_BASE_URL="http://localhost:11434"
OLLAMA_MODEL="llama3.2"
OLLAMA_TIMEOUT_MS=30000
```

Menyiapkan model Ollama lokal:
```bash
ollama serve
ollama pull llama3.2
```
