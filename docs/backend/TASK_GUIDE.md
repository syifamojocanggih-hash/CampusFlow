# TASK_GUIDE.md — Backend & LLM Engineer (Syifa `@syifamojocanggih-hash`)

> **PENANGGUNG JAWAB:** Syifa (`@syifamojocanggih-hash`)  
> **BRANCH KERJA:** `backend`  
> **KONTRAK REFERENSI:** [`docs/universal/INTERFACES.md`](../universal/INTERFACES.md)  
> **CHANGELOG WAJIB:** [`docs/changelogs/CHANGELOG_SYIFA.md`](../changelogs/CHANGELOG_SYIFA.md)

---

## 📋 Daftar Tugas Implementasi Berurutan

### TAHAP 1: Inisialisasi Server & Database MySQL

#### 🟢 BE-1.1: Setup Express + TypeScript + Env Config
- **Target:** `backend/package.json`, `backend/tsconfig.json`, `backend/.env.example`, `backend/src/index.ts`.
- **Paket Wajib:** `express`, `cors`, `helmet`, `prisma`, `@prisma/client`, `web-push`, `jsonwebtoken`, `bcryptjs`, `zod`, `dotenv` *(LLM memakai Ollama lokal via native `fetch`, tanpa SDK API berbayar)*.
- **Checklist:**
  - [x] Server dikonfigurasi di port `4000` dengan `GET /api/v1/health` mengembalikan status sehat.
  - [x] CORS dikonfigurasi agar mendukung origin frontend Vite (lokal & produksi).

#### 🟢 BE-1.2: Skema Prisma MySQL & Seeder 14 Hari Juri
- **Target:** `backend/prisma/schema.prisma`, `backend/prisma/seed.ts`.
- **Spesifikasi:**
  - Salin 6 model + 3 enum sesuai [`DATABASE_SCHEMA.md`](DATABASE_SCHEMA.md).
  - Buat akun demo `demo@campusflow.id` dengan riwayat 14 hari menunjukkan tren penurunan skor PSS-10 (28 → 16) seiring peningkatan MET-menit & kepatuhan Active Break.
- **Checklist:**
  - [x] `npx prisma migrate dev --name init` dijalankan ke MySQL lokal (`campusflow` + `backend/prisma/migrations/`).
  - [x] `backend/prisma/schema.prisma` & `backend/prisma/seed.ts` 14 hari sudah ter-seed ke MySQL.

---

### TAHAP 2: Autentikasi & Profil Vision

#### 🟢 BE-2.1: Registrasi, Login, Demo Login & Middleware JWT
- **Target:** `backend/src/routes/auth.ts`, `backend/src/middleware/auth.ts`.
- **Checklist:**
  - [x] Password di-hash menggunakan `bcryptjs` sebelum disimpan.
  - [x] Endpoint `POST /api/v1/auth/demo` mengembalikan JWT valid untuk `demo@campusflow.id`.
  - [x] Endpoint `PATCH /api/v1/vision/baseline` menyimpan `PostureBaseline` JSON ke `User.postureBaselineJson`.

---

### TAHAP 3: Mesin Skoring Klinis & Endpoints Telemetri

#### 🟢 BE-3.1: Layanan `clinicalScoring.ts`
- **Target:** `backend/src/services/clinicalScoring.ts`.
- **Aturan Wajib:**
  - Konstanta: `MAX_SAFE_SEDENTARY_HOURS = 9.0`, `TARGET_MVPA_PER_SEDENTARY_HOUR = 25`, `TRIAD_PILLAR_1_MVPA_MINS = 30`, `TRIAD_PILLAR_2_SLEEP_HOURS = [7.0, 9.0]`, `TRIAD_PILLAR_3_MAX_SCREENTIME = 8.0`, `WEEKLY_MSE_TARGET_DAYS = 2`, `WEEKLY_TOTAL_METS_TARGET = 1500`.
  - Reverse score PSS-4 (`Q2, Q3` → `4 - x`) & PSS-10 (`Item 4, 5, 7, 8` → `4 - x`).
  - Kalkulasi `calculatedMets` IPAQ-SF (`WALKING`: 3.3, `MODERATE`: 4.0, `VIGOROUS`: 8.0, `MUSCLE_STRENGTHENING`: 5.0, `ACUTE_AEROBIC_RELIEF`: 5.0).
- **Checklist:**
  - [x] Unit test memverifikasi reverse scoring, cutoff PSS-4 `>= 8` (`HIGH`), dan perhitungan `triadPillarsMet` (0–3).

#### 🟢 BE-3.2: Endpoints Sedentary, Activities, Wellbeing, & Triad Dashboard
- **Target:** `backend/src/routes/sedentary.ts`, `activities.ts`, `wellbeing.ts`, `dashboard.ts`.
- **Checklist:**
  - [x] Setiap input `POST /api/v1/sedentary/sessions` dan `POST /api/v1/activities` otomatis memperbarui agregasi `DailyWellbeingLog` pada hari terkait.
  - [x] `GET /api/v1/dashboard/triad?days=14` mengembalikan ringkasan pilar hari ini + seri data grafik 14 hari.

---

### TAHAP 4: Agentic AI Coach (Ollama Lokal)

#### 🟢 BE-4.1: Implementasi `ollamaCoach.ts` & Endpoint Insight
- **Target:** `backend/src/services/ollamaCoach.ts`, `backend/src/routes/aiCoach.ts`.
- **Spesifikasi:**
  - Panggil endpoint lokal `OLLAMA_BASE_URL/api/chat` dengan parameter `format` JSON Schema terstruktur (lihat [`LLM_AI_COACH.md`](LLM_AI_COACH.md)).
  - Simpan hasil ke tabel `AiCoachingInsight`.
  - Sediakan fallback deterministik berbasis konstanta klinis bila server Ollama lokal belum menyala atau timeout.
- **Checklist:**
  - [x] `POST /api/v1/ai-coach/generate` mengembalikan 5 field wajib dalam JSON valid (+ fallback teruji).
  - [x] `PATCH /api/v1/ai-coach/:id/complete` menandai selesai & menambah `User.xpPoints`.

---

### TAHAP 5: Web Push Notification & Uji Akhir

#### 🟢 BE-5.1: Layanan Web Push VAPID (`pushNotifier.ts`)
- **Target:** `backend/src/services/pushNotifier.ts`, `backend/src/routes/notifications.ts`.
- **Checklist:**
  - [x] `POST /api/v1/notifications/subscribe` menyimpan `pushSubscription` JSON.
  - [x] `POST /api/v1/notifications/test` siap mengirim notifikasi uji ke browser saat VAPID keys diatur.

#### 🟢 BE-5.2: Verifikasi Integrasi & Changelog
- **Checklist:**
  - [x] `npm --prefix backend run build` & unit test hijau.
  - [x] Semua perubahan tercatat rapi di `docs/changelogs/CHANGELOG_SYIFA.md` dan lolos `npm run guard`.
