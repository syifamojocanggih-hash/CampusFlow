# Changelog — Syifa / Ahmad Syifa'ul Falakhul Khayyi (`@syifamojocanggih-hash`)

> **Peran:** Backend & LLM Engineer  
> **Branch Kerja:** `backend` (`backend/`, `docs/backend/`)  
> **Aturan:** Hanya Syifa yang mengisi file ini. Setiap push/PR di branch `backend` wajib menambahkan entri di sini. Jika mengubah file di luar zona default `backend/` atau `docs/backend/`, WAJIB menyertakan tag `[CROSS-SCOPE]`, path lengkap file, dan alasannya.

---

## Format Contoh Entri *(Salin saat menambah perubahan baru di atas bagian ini)*

```markdown
## [YYYY-MM-DD] — Judul Fitur / Perbaikan (Branch: `backend`)
- **ID Tugas / Referensi:** `BE-1.1`
- **Ringkasan:** Inisialisasi Express TypeScript, Prisma MySQL schema, dan endpoint auth JWT.
- **Daftar File Diubah:**
  - `backend/prisma/schema.prisma`
  - `backend/src/index.ts`
- **Catatan Cross-Scope:** *(Hapus baris ini jika tidak ada, atau tulis `[CROSS-SCOPE] path/file — alasan`)*
- **Verifikasi:** `npx prisma migrate dev` dan `npm --prefix backend run build` berhasil.
```

---

## [2026-11-12] — Pipeline Fine-Tuning Dataset, Evaluator Spesialis LLM, & Guardrail Sitasi Deterministik (Branch: `backend`)
- **ID Tugas / Referensi:** `BE-4.1`, `BE-5.2`
- **Ringkasan:** Menambahkan pipeline pembuatan & balancing dataset fine-tuning (`generate_combos.py`, `label_combos.cjs`, `balance_dataset.cjs`, `generate_narratives.cjs`, `generate_out_of_scope.cjs`, `merge_out_of_scope.cjs`), memperluas evaluator `eval-ollama.ts` dan `eval-checks.ts` untuk skenario klinis + 43 baris validasi `val_messages.jsonl` + perbandingan before/after, menambahkan guardrail sitasi deterministik (`CITATION_BANK` & `pickCitation`) pada `ollamaCoach.ts` + skrip uji `test_guardrail.ts`, menyelaraskan `Modelfile` model `campusflow-coach-ft`, dan memperbarui `eval-checks.test.ts` agar menerima penambahan 5 baris validasi `out_of_scope` (43 baris).
- **Daftar File Diubah:**
  - `.gitignore`
  - `backend/ollama/Modelfile`, `backend/ollama/Modelfile.backup`
  - `backend/package.json`, `backend/src/services/ollamaCoach.ts`
  - `backend/scripts/eval-checks.ts`, `backend/scripts/eval-checks.test.ts`, `backend/scripts/eval-ollama.ts`
  - `backend/scripts/generate_combos.py`, `backend/scripts/label_combos.cjs`, `backend/scripts/balance_dataset.cjs`, `backend/scripts/few_shot_examples.cjs`, `backend/scripts/generate_narratives.cjs`, `backend/scripts/generate_out_of_scope.cjs`, `backend/scripts/merge_out_of_scope.cjs`, `backend/scripts/test_guardrail.ts`
  - `backend/scripts/*.jsonl` (dataset kombinasi, narasi, train/val splits, `out_of_scope_extra.jsonl`, dan backup `.bak`)
- **Catatan Cross-Scope:** `[CROSS-SCOPE] .gitignore` — menambahkan aturan `backend/ollama/*.gguf` agar binary model LLM lokal berukuran besar tidak ter-commit ke Git.
- **Verifikasi:** `npm --prefix backend run typecheck`, `npm --prefix backend run build`, `npm --prefix backend test` (26/26 lolos), dan `npm run guard` (`pre-push`) hijau.

## [2026-11-12] — Penguatan Safety Guardrail AI Coach: Rule-Lock, Eskalasi PSS-4 >= 10, `pss4=null`, & Adaptasi Skip -40% (Branch: `backend`)
- **ID Tugas / Referensi:** `BE-4.1`, `BE-5.2`
- **Ringkasan:** Mengadopsi aturan keselamatan, nada bahasa Indonesia empatik non-diagnosis, anti-halusinasi sitasi, dan batas target `allowedRanges` ke `backend/ollama/Modelfile` serta `ollamaCoach.ts` sambil menjaga kompatibilitas penuh skema `AiCoachingInsightDTO` (`INTERFACES.md`); menambahkan eskalasi `PSS-4 >= 10` / kata kunci darurat (`escalationFlag`), pembedaan belum check-in harian (`pss4TotalScore = null`) + agregasi live `getDailyActivityAndSedentaryTotals` di route `POST /api/v1/ai-coach/generate`, penurunan target bertahap maks `-40%` saat skip berulang (`computeCoachConstraints`), serta memperluas suite uji `ollamaCoach.test.ts`, `app.test.ts`, dan 10 skenario live `scripts/eval-ollama.ts`.
- **Daftar File Diubah:**
  - `backend/ollama/Modelfile`, `backend/scripts/eval-ollama.ts`
  - `backend/src/services/ollamaCoach.ts`, `backend/src/services/ollamaCoach.test.ts`
  - `backend/src/routes/aiCoach.ts`, `backend/src/app.test.ts`
  - `docs/backend/LLM_AI_COACH.md`, `docs/backend/API_SPECIFICATION.md`
- **Verifikasi:** `npm --prefix backend run ollama:create` sukses, `npm --prefix backend run ollama:eval` lolos 10/10 skenario klinis live (`OLLAMA_LOCAL`), `smoke-api.ps1` lolos 10/10 endpoint live terhadap MySQL + `campusflow-coach`, `npm --prefix backend run typecheck`, `build`, `test` (21/21 lolos), dan `npm run guard` hijau.

## [2026-11-12] — Custom Model `campusflow-coach` (`Modelfile`), Guard Prioritas Klinis, & Evaluasi Live Ollama (Branch: `backend`)
- **ID Tugas / Referensi:** `BE-4.1`, `BE-5.2`
- **Ringkasan:** Menautkan backend ke model Ollama lokal `campusflow-coach` (`FROM qwen2.5:3b`) dengan parameter konservatif (`temperature 0.15`, `top_p 0.85`, `repeat_penalty 1.1`, `num_ctx 4096`), aturan prioritas klinis 5 tingkat Martín-Rodríguez & González-Prieto (2026), dan contoh *few-shot* terstruktur di `backend/ollama/Modelfile`; mengekstrak `evaluateClinicalRuleFlags` di `ollamaCoach.ts` untuk mengirimkan sinyal batas klinis deterministik bersamaan dengan telemetri 7 hari; memperbarui `env.ts`, `.env.example`, serta menambahkan skrip `ollama:create` dan `ollama:eval` (`scripts/eval-ollama.ts`), isolasi mock `:11434` di `app.test.ts`, dan pembaruan dokumentasi backend.
- **Daftar File Diubah:**
  - `backend/ollama/Modelfile`, `backend/scripts/eval-ollama.ts`
  - `backend/src/services/ollamaCoach.ts`, `backend/src/services/ollamaCoach.test.ts`
  - `backend/src/config/env.ts`, `backend/.env.example`, `backend/package.json`, `backend/src/app.test.ts`
  - `docs/backend/LLM_AI_COACH.md`, `docs/backend/SETUP.md`, `docs/backend/TASK_GUIDE.md`
- **Verifikasi:** `npm --prefix backend run ollama:create` berhasil, `npm --prefix backend run ollama:eval` lolos 7/7 skenario klinis live (`OLLAMA_LOCAL`), `smoke-api.ps1` lolos 10/10 endpoint live terhadap MySQL + `campusflow-coach`, `npm --prefix backend run typecheck`, `build`, `test` (18/18 lolos), dan `npm run guard` hijau.

## [2026-11-11] — Rate Limiter, History AI Coach, Hapus Data Privasi, & Graceful Shutdown (Branch: `backend`)
- **ID Tugas / Referensi:** `BE-4.1`, `BE-5.2`
- **Ringkasan:** Menambahkan `createRateLimiter` pada `/api/v1/auth` dan `POST /api/v1/ai-coach/generate` (`429 RATE_LIMITED`), endpoint `GET /api/v1/ai-coach/history`, endpoint privasi `DELETE /api/v1/users/me/data`, graceful shutdown (`SIGINT`/`SIGTERM` + `prisma.$disconnect()`) di `index.ts`, skrip `start:prod`, serta menyelaraskan deskripsi Ollama di `docs/backend/README.md`.
- **Daftar File Diubah:**
  - `backend/src/middleware/rateLimit.ts`, `backend/src/middleware/rateLimit.test.ts`
  - `backend/src/routes/aiCoach.ts`, `backend/src/routes/users.ts`, `backend/src/app.ts`, `backend/src/index.ts`, `backend/src/app.test.ts`, `backend/package.json`
  - `docs/backend/README.md`, `docs/backend/API_SPECIFICATION.md`
- **Verifikasi:** `npm --prefix backend run typecheck`, `npm --prefix backend run build`, `npm --prefix backend test` (17/17 test lolos), dan `npm run guard`.

## [2026-11-11] — Setup Database MySQL `campusflow`, Migrasi Awal Prisma, Seed 14 Hari, & Live Smoke Test (Branch: `backend`)
- **ID Tugas / Referensi:** `BE-1.2`, `BE-5.2`
- **Ringkasan:** Membuat database MySQL `campusflow`, menghasilkan migrasi awal Prisma (`20261111151343_init`), menjalankan seed 14 hari akun demo (`demo@campusflow.id`), serta memverifikasi 11 langkah live API melalui `scripts/smoke-api.ps1` terhadap server Express dan MySQL nyata.
- **Daftar File Diubah:**
  - `backend/prisma/migrations/20261111151343_init/migration.sql`, `backend/prisma/migrations/migration_lock.toml`
  - `docs/backend/TASK_GUIDE.md`
- **Verifikasi:** `npx prisma migrate dev`, `npx prisma db seed`, `npm --prefix backend test` (16/16 lolos), `smoke-api.ps1` (11/11 langkah HTTP live lolos), dan `npm run guard`.

## [2026-11-11] — Endpoint Diagnostik Status Ollama Lokal (`GET /api/v1/ai-coach/status`) (Branch: `backend`)
- **ID Tugas / Referensi:** `BE-4.1`
- **Ringkasan:** Menambahkan `checkOllamaStatus` di `ollamaCoach.ts` dan endpoint `GET /api/v1/ai-coach/status` untuk memeriksa koneksi Ollama lokal & ketersediaan model sebelum memanggil `/ai-coach/generate`, serta memperbarui `smoke-api.ps1` & `API_SPECIFICATION.md`.
- **Daftar File Diubah:**
  - `backend/src/services/ollamaCoach.ts`, `backend/src/services/ollamaCoach.test.ts`
  - `backend/src/routes/aiCoach.ts`, `backend/scripts/smoke-api.ps1`
  - `docs/backend/API_SPECIFICATION.md`
- **Verifikasi:** `npm --prefix backend run typecheck`, `npm --prefix backend run build`, `npm --prefix backend test` (16/16 test lolos), dan `npm run guard`.

## [2026-11-11] — Migrasi AI Coach ke Ollama Lokal (Tanpa API Key) & Auto-Increment Streak Harian (Branch: `backend`)
- **ID Tugas / Referensi:** `BE-3.1`, `BE-3.2`, `BE-4.1`
- **Ringkasan:** Mengganti provider AI Coach dari Google Gemini Cloud API ke **Ollama Lokal** (`OLLAMA_BASE_URL` + `OLLAMA_MODEL` via `/api/chat` JSON Schema terstruktur + fallback klinis deterministik di `ollamaCoach.ts`, menghapus `@google/genai`), serta menambahkan perhitungan otomatis `currentStreakDays` yang idempoten saat check-in `POST /api/v1/wellbeing/daily`.
- **Daftar File Diubah:**
  - `backend/src/services/ollamaCoach.ts`, `backend/src/services/ollamaCoach.test.ts` *(menggantikan `geminiCoach.ts` & `geminiCoach.test.ts`)*
  - `backend/src/config/env.ts`, `backend/.env.example`, `backend/package.json`, `backend/package-lock.json`
  - `backend/src/services/clinicalScoring.ts`, `backend/src/services/clinicalScoring.test.ts`
  - `backend/src/routes/wellbeing.ts`, `backend/src/routes/aiCoach.ts`, `backend/src/app.test.ts`, `backend/prisma/seed.ts`
  - `docs/backend/README.md`, `docs/backend/TASK_GUIDE.md`, `docs/backend/LLM_AI_COACH.md`, `docs/backend/SETUP.md`
- **Verifikasi:** `npm --prefix backend run typecheck`, `npm --prefix backend run build`, `npm --prefix backend test` (15/15 test lolos), dan `npm run guard`.

## [2026-11-11] — Perbaikan Agregasi Triad Hari Ini, Endpoint Helper, Route Tests (`app.test.ts`), & Smoke Script (Branch: `backend`)
- **ID Tugas / Referensi:** `BE-3.2`, `BE-5.1`, `BE-5.2`
- **Ringkasan:** Memperbaiki `dashboard.ts` & `dailyAggregation.ts` agar progres duduk & MVPA hari ini langsung tampil meski user belum mengisi check-in PSS-4 harian; menambahkan JSON 404 handler di `app.ts`, `GET /api/v1/assessments`, `GET /api/v1/notifications/vapid-public-key`, dan `DELETE /api/v1/notifications/subscribe`; serta menambahkan tes integrasi HTTP otomatis (`src/app.test.ts`) dan skrip smoke test PowerShell (`scripts/smoke-api.ps1`).
- **Daftar File Diubah:**
  - `backend/src/services/dailyAggregation.ts`, `backend/src/routes/dashboard.ts`, `backend/src/routes/wellbeing.ts`, `backend/src/routes/notifications.ts`, `backend/src/app.ts`
  - `backend/src/app.test.ts`, `backend/scripts/smoke-api.ps1`, `backend/package.json`
  - `docs/backend/API_SPECIFICATION.md`
- **Verifikasi:** `npm --prefix backend run typecheck`, `npm --prefix backend run build`, `npm --prefix backend test` (12/12 test lolos), dan `npm run guard`.

## [2026-11-11] — Setup Fondasi Backend Express, Prisma MySQL, Clinical Scoring, & Gemini AI Coach (Branch: `backend`)
- **ID Tugas / Referensi:** `BE-1.1`, `BE-1.2`, `BE-2.1`, `BE-3.1`, `BE-3.2`, `BE-4.1`, `BE-5.1`, `BE-5.2`
- **Ringkasan:** Membangun fondasi lengkap server `backend/` (Express 5 + TypeScript), skema database Prisma MySQL (6 tabel, 3 enum) + seeder 14 hari akun demo `demo@campusflow.id`, autentikasi JWT (`bcryptjs`), layanan `clinicalScoring.ts` (PSS-4/10 reverse scoring, PSQI tidur, IPAQ-SF METs, 24-Hour Movement Triad), orkestrasi `geminiCoach.ts` (`gemini-2.5-flash` Structured Output + fallback klinis deterministik), Web Push VAPID (`pushNotifier.ts`), dan seluruh route `/api/v1/*`.
- **Daftar File Diubah:**
  - `backend/package.json`, `backend/package-lock.json`, `backend/tsconfig.json`
  - `backend/prisma/schema.prisma`, `backend/prisma/seed.ts`
  - `backend/src/config/env.ts`, `backend/src/lib/prisma.ts`, `backend/src/lib/response.ts`
  - `backend/src/middleware/auth.ts`, `backend/src/middleware/errorHandler.ts`
  - `backend/src/services/clinicalScoring.ts`, `backend/src/services/clinicalScoring.test.ts`
  - `backend/src/services/geminiCoach.ts`, `backend/src/services/geminiCoach.test.ts`
  - `backend/src/services/pushNotifier.ts`, `backend/src/services/dailyAggregation.ts`
  - `backend/src/routes/*.ts`, `backend/src/app.ts`, `backend/src/index.ts`
  - `docs/backend/TASK_GUIDE.md`
- **Verifikasi:** `npm --prefix backend run typecheck`, `npm --prefix backend run build`, `npm --prefix backend test`, dan `npm run guard`.

## [2026-11-11] — Baseline Awal Branch Backend dari `main` (Branch: `backend`)
- **ID Tugas / Referensi:** `BE-0.0`
- **Ringkasan:** Menerima turunan fondasi arsitektur, skema Prisma referensi, kontrak API `INTERFACES.md`, dan dokumen tugas dari `main`. Siap untuk inisialisasi Express + Prisma + Gemini AI Coach di direktori `backend/`.
- **Verifikasi:** Sinkron dengan commit dasar `main`.
