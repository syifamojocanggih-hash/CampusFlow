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
