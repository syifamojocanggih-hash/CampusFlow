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

## [2026-11-23] — Perbaikan Penuh Upload & Ekstraksi Dokumen KRS Tanpa Mode Demo (Branch: `backend`)
- **ID Tugas / Referensi:** `BE-KRS-UPLOAD-4.0`, `FE-KRS-UPLOAD-4.0`
- **Ringkasan:** Menghapus tombol dan template demo KRS (`KRS_Semester_Ganjil_Tiara.pdf` & `handleSimulatePdfParse`) pada `TriadDashboard.tsx` dan menghubungkan dropzone upload file langsung ke `<input type="file" />` serta drag-and-drop yang memanggil endpoint asli `POST /api/v1/schedule/upload` (Preview & Edit) dan `POST /api/v1/schedule/confirm` (Commit ke MySQL & Auto-Recalculate Burnout Index); memperluas `scheduleParser.ts` agar mendukung ekstraksi tabel SIAKAD (baik dengan jam, tanpa kolom hari/jam, maupun sel tabel multi-baris `pdf-parse`) serta dokumen PDF, PNG, JPG, dan TXT hingga 10 MB; serta menambahkan filter hari (`Hari Ini`, `Semua`, `Sen`–`Sab`) pada kartu Jadwal Kuliah di dashboard.
- **Daftar File Diubah:**
  - `backend/src/services/scheduleParser.ts`
  - `backend/src/services/scheduleParser.test.ts`
  - `backend/src/middleware/upload.ts`
  - `backend/src/routes/academicSchedule.ts`
  - `frontend/src/components/TriadDashboard.tsx`
  - `frontend/src/lib/krsPdfClient.ts`
  - `frontend/src/lib/api.ts`
  - `frontend/.env`
- **Catatan Cross-Scope:**
  - `[CROSS-SCOPE] frontend/src/components/TriadDashboard.tsx` — menghapus tombol demo KRS dan menggantinya dengan uploader file nyata, tabel preview/edit hasil ekstraksi, dan filter hari jadwal kuliah.
  - `[CROSS-SCOPE] frontend/src/lib/krsPdfClient.ts` & `api.ts` — memastikan upload dan konfirmasi KRS selalu memanggil endpoint backend asli dengan token JWT valid.
  - `[CROSS-SCOPE] frontend/.env` — mengaktifkan koneksi REST API backend (`VITE_USE_MOCK="false"`).
- **Verifikasi:** `npm --prefix backend test` (131/131 lulus), `npm --prefix frontend test` (23/23 lulus), `npm --prefix backend run build`, dan `npm --prefix frontend run build` berhasil tanpa error.

## [2026-11-22] — Deteksi & Sinkronisasi Jam Tidur Otomatis (Passive Overnight Inactivity & OS PowerMonitor) (Branch: `backend`)
- **ID Tugas / Referensi:** `BE-AUTO-SLEEP-4.0`, `FE-AUTO-SLEEP-4.0`
- **Ringkasan:** Mengimplementasikan sistem deteksi jam tidur otomatis (`autoSleepService.ts`, `autoSleepCalculator.ts`, `autoSleepTracker.ts`, dan `/api/v1/wellbeing/auto-sleep`) berbasis jendela inaktivitas layar malam hari (*Last Evening Activity* s/d *First Morning Wakeup*) dan integrasi native `powerMonitor` Electron (`suspend`, `resume`, `lock-screen`, `unlock-screen`), lengkap dengan pengurangan *sleep onset latency*, inferensi skor kualitas tidur (1–5), kalkulasi otomatis *Recovery Score* (maks 40 poin) & *Burnout Risk Index*, serta panel inspeksi & simulasi 1-klik di `TriadDashboard.tsx` dan `CheckinView.tsx`.
- **Daftar File Diubah:**
  - `shared/contracts/index.ts`
  - `backend/src/services/autoSleepService.ts`
  - `backend/src/services/autoSleepService.test.ts`
  - `backend/src/services/burnoutSync.ts`
  - `backend/src/routes/wellbeing.ts`
  - `backend/src/routes/burnout.ts`
  - `backend/package.json`
  - `frontend/src/utils/autoSleepCalculator.ts`
  - `frontend/src/utils/autoSleepCalculator.test.ts`
  - `frontend/src/utils/autoSleepTracker.ts`
  - `frontend/src/lib/api.ts`
  - `frontend/src/App.tsx`
  - `frontend/src/components/TriadDashboard.tsx`
  - `frontend/src/components/pages/CheckinView.tsx`
  - `frontend/src/components/pages/HistoryView.tsx`
  - `electron/main.cjs`
  - `electron/preload.cjs`
- **Catatan Cross-Scope:**
  - `[CROSS-SCOPE] shared/contracts/index.ts` — menambahkan kontrak `AutoSleepRecordDTO`, `SleepDetectionSource`, dan `SleepClinicalStatus`.
  - `[CROSS-SCOPE] frontend/src/utils/autoSleepCalculator.ts` & `autoSleepTracker.ts` — engine pelacak pasif jendela tidur malam dan hook reaktif `useAutoSleep()`.
  - `[CROSS-SCOPE] frontend/src/components/TriadDashboard.tsx` & `CheckinView.tsx` & `HistoryView.tsx` — integrasi tampilan jam tidur otomatis, badge telemetri, dan simulator bangun pagi.
  - `[CROSS-SCOPE] electron/main.cjs` & `electron/preload.cjs` — hook `powerMonitor` OS untuk mendeteksi waktu laptop sleep/wake secara presisi.
- **Verifikasi:** `npm --prefix backend test` (130/130 lulus), `npm --prefix frontend test` (23/23 lulus), `npm --prefix backend run build`, dan `npm --prefix frontend run build` berhasil tanpa error.

## [2026-11-22] — Integrasi OS-Level Screen Time Lock & VisionGuard Active Break Enforcer (Branch: `backend`)
- **ID Tugas / Referensi:** `BE-OS-LOCK-4.0`, `FE-VISION-OS-LOCK`
- **Ringkasan:** Menambahkan arsitektur penguncian layar dan tab level sistem operasi (`osLockService.ts` & `/api/v1/os-lock/*`) yang menarik kembali fokus jendela dan tab browser (Brave/Chrome/Safari/Edge/Electron) secara paksa ke CampusFlow saat batas screen time / sesi fokus / waktu duduk tercapai, mengunci navigasi dan pergantian aplikasi sampai prosedur peregangan kamera (3 repetisi *Overhead Arm Stretch*) diverifikasi oleh MediaPipe PoseLandmarker, serta menyediakan wrapper Electron Kiosk (`electron/main.cjs` & `electron/preload.cjs`).
- **Daftar File Diubah:**
  - `backend/src/services/osLockService.ts`
  - `backend/src/routes/osLock.ts`
  - `backend/src/routes/activeBreak.ts`
  - `backend/src/app.ts`
  - `backend/src/routes/endpointsCompletion.test.ts`
  - `frontend/src/utils/osScreenLock.ts`
  - `frontend/src/components/vision/VisionGuard.tsx`
  - `frontend/src/components/pages/FocusView.tsx`
  - `frontend/src/App.tsx`
  - `electron/main.cjs`
  - `electron/preload.cjs`
- **Catatan Cross-Scope:**
  - `[CROSS-SCOPE] frontend/src/utils/osScreenLock.ts` — controller frontend sinkronisasi status kunci layar level OS, Fullscreen API, Keyboard Lock API, dan anti-blur/tab-switch guard.
  - `[CROSS-SCOPE] frontend/src/components/vision/VisionGuard.tsx` — integrasi tampilan kunci penuh level OS dan verifikasi peregangan 3 repetisi untuk membuka kunci OS.
  - `[CROSS-SCOPE] frontend/src/components/pages/FocusView.tsx` — sinkronisasi timer fokus dengan watchdog OS Lock.
  - `[CROSS-SCOPE] frontend/src/App.tsx` — bar kontrol global Proteksi Screen Time Level OS dan overlay VisionGuard terkunci di seluruh halaman.
  - `[CROSS-SCOPE] electron/main.cjs` — wrapper desktop kiosk Electron level OS.
  - `[CROSS-SCOPE] electron/preload.cjs` — IPC bridge Electron untuk lock/unlock layar.
- **Verifikasi:** `npm --prefix frontend run build`, `npm --prefix frontend test`, dan `npm --prefix backend test` lulus 100%.

## [2026-11-16] — Dokumentasi Pivot Strategis PRD v4.0 & Panduan Dampak Lintas Branch (Branch: `backend`)
- **ID Tugas / Referensi:** `BE-DOC-4.0`
- **Ringkasan:** Menyusun dokumen panduan komprehensif mengenai pivot PRD v4.0 ("Academic Strava & Predictive Burnout Management") dibandingkan PRD v3.0, mencakup analisis privasi Zero Continuous Camera, formulasi algoritma Burnout Risk Index, rancangan skema database fusi (AcademicSchedule, DailyFussionLog, ActiveBreakSession), serta panduan dampak teknis untuk branch main, backend, dan frontend.
- **Daftar File Diubah:**
  - `docs/universal/PRD_V4_PIVOT_EXPLANATION.md`
- **Catatan Cross-Scope:**
  - `[CROSS-SCOPE] docs/universal/PRD_V4_PIVOT_EXPLANATION.md` — dokumen universal penjabaran perbandingan PRD v3.0 vs v4.0 dan dampaknya untuk semua branch.
- **Verifikasi:** `npm run guard` lolos hijau.

## [2026-11-16] — Panduan Gerakan Deterministik Bebas Model, Filter Alternatif Gerak, & Audit Halusinasi Aktivitas (Branch: `backend`)
- **ID Tugas / Referensi:** `BE-4.1`, `BE-5.2`
- **Ringkasan:** Mengganti alur respons pemilihan opsi gerak (`movementChoice` / balasan pilihan terminal) menjadi template instruksi 3-4 langkah deterministik dari `coachShared.ts` tanpa memanggil model Ollama; menyaring opsi alternatif agar rekomendasi utama tidak berulang dengan header "Mau alternatif lain?" (disembunyikan bila < 2); menghilangkan movementOptions pada respons pemilihan gerak di API serta menambahkan field `guidance: string[]`; memperluas `auditResponse` untuk mendeteksi dan memotong klaim karangan kuliah, tugas, dan evaluasi telemetri tanpa data; menyediakan template 3-4 langkah untuk seluruh 19 opsi gerakan PRD yang lolos uji kata dobel berurutan; serta menambahkan automated tests integrasi terminal dan API (73/73 test lolos).
- **Daftar File Diubah:**
  - `backend/scripts/chat-coach.ts`
  - `backend/scripts/chat-coach.test.ts`
  - `backend/src/app.test.ts`
  - `backend/src/routes/aiCoach.ts`
  - `backend/src/services/coachShared.ts`
  - `backend/src/services/ollamaCoach.ts`
  - `docs/handoff/ai-coach-response-variants.md`
  - `shared/contracts/index.ts`
- **Catatan Cross-Scope:**
  - `[CROSS-SCOPE] docs/handoff/ai-coach-response-variants.md` — pembaruan dokumentasi kontrak skenario pemilihan gerak, ketiadaan movementOptions pada respons pilihan, dan penambahan field `guidance: string[]`.
  - `[CROSS-SCOPE] shared/contracts/index.ts` — penambahan properti opsional `guidance?: string[]` pada `AiCoachingInsightDTO`.
- **Verifikasi:** `npm --prefix backend run typecheck` (0 error), `npm --prefix backend test` (73/73 lolos), dan `node scripts/guard-check.mjs backend` lolos hijau.

## [2026-11-16] — Penguatan Multi-Turn AI Coach, Guardrail Klinis Jam Malam, Append Check-in Deterministik, & Rate Limiting Per Akun (Branch: `backend`)
- **ID Tugas / Referensi:** `BE-4.1`, `BE-5.2`
- **Ringkasan:** Menyempurnakan alur interaksi terminal dan API AI Coach: menambahkan state machine `pendingPrompt` (`clarification` vs `movement`) agar balasan opsi tidak tertukar, payload reuse saat pemilihan gerak, pengiriman konteks pilihan sebagai directive terpisah, pemetaan `movementChoice` ke `movementOptionsShown` tersimpan di database, aturan jam malam ringan (>= 21.30 WIB), audit emosi/penyebab palsu, sanitasi durasi menit & kata sambung di awal, append deterministik penutup check-in di jalur API, mode chat tanpa check-in di terminal, logging evaluasi `coach-raw.jsonl` dan skrip analitik `coach-stats.ts`, isolasi rate limiter per user token (10 req/menit), serta penyusunan dokumen handoff varian respons.
- **Daftar File Diubah:**
  - `backend/scripts/chat-coach.ts`
  - `backend/scripts/chat-coach.test.ts`
  - `backend/scripts/coach-stats.ts`
  - `backend/src/app.ts`
  - `backend/src/app.test.ts`
  - `backend/src/middleware/rateLimit.ts`
  - `backend/src/middleware/rateLimit.test.ts`
  - `backend/src/routes/aiCoach.ts`
  - `backend/src/services/coachShared.ts`
  - `backend/src/services/ollamaCoach.ts`
  - `docs/backend/CLINICAL_SCORING.md`
  - `docs/handoff/ai-coach-response-variants.md`
  - `.gitignore`
  - `shared/contracts/index.ts`
- **Catatan Cross-Scope:**
  - `[CROSS-SCOPE] docs/handoff/ai-coach-response-variants.md` — dokumentasi handoff varian respons AI Coach, alur request/response `POST /ai-coach/generate`, validasi `movementChoice`, dan penanganan error 400 konteks kedaluwarsa untuk tim frontend.
  - `[CROSS-SCOPE] shared/contracts/index.ts` — penyesuaian tipe enum dan DTO AI Coach agar sinkron antara frontend dan backend.
  - `[CROSS-SCOPE] .gitignore` — menambahkan entri pengabaian untuk direktori `scratch/` dan `backend/logs/`.
- **Verifikasi:** `npm --prefix backend run typecheck`, `npm --prefix backend test` (68/68 lolos), dan `node scripts/guard-check.mjs backend` lolos hijau.

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
