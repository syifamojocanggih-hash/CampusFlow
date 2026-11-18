# CampusFlow

> **Academic Strava & Predictive Burnout Management**  
> Progressive Web Application (PWA) lintas perangkat berbasis Fusi Prediktif Beban Akademik & Waktu Layar, *Zero Continuous Camera* (Kamera Insidental 2 Menit), Parser Jadwal KRS PDF (Google Gemini API), dan *Wellbeing AI Coach* Lokal.  
> Topik Riset: **Kelola Stres & Keseimbangan Hidup Mahasiswa Berbasis Fusi Parameter dan Jeda Aktif Terverifikasi** · **Techcomfest 2027** · Sub-Tema 3: *Smart Lifestyle & Digital Wellbeing* (SDG 3).

[![Architecture: 3-Branch Monorepo](https://img.shields.io/badge/Architecture-3--Branch%20Monorepo-2563EB.svg)](#8-struktur-monorepo--pembagian-kerja)
[![Privacy: Zero Continuous Camera](https://img.shields.io/badge/Privacy-Zero%20Continuous%20Camera-0EA5A4.svg)](#4-arsitektur-privasi--keamanan-data)
[![Burnout Metric: Unified Fussion Index](https://img.shields.io/badge/Burnout%20Metric-Unified%20Index%200--100-F59E0B.svg)](#2-arsitektur-fusi-parameter--algoritma-burnout-index)
[![AI Coach: Ollama Qwen2.5 Local](https://img.shields.io/badge/AI%20Coach-Ollama%20Qwen2.5%20Local-22C55E.svg)](#35-wellbeing-ai-coach--konsultasi-stres-proaktif)
[![Tests: 143 Passing](https://img.shields.io/badge/Tests-125%20BE%20%7C%2018%20FE%20Passing-10B981.svg)](#7-pengujian--skrip-verifikasi-live)

---

## Daftar Isi
1. [Latar Belakang & Pivot Paradigma MVP (Versi 4.0)](#1-latar-belakang--pivot-paradigma-mvp-versi-40)
2. [Arsitektur Fusi Parameter: Algoritma Burnout Index](#2-arsitektur-fusi-parameter--algoritma-burnout-index)
   - [Formulasi Matematika Parameter](#21-formulasi-matematika-parameter)
   - [Dynamic Pre-Exam Escalation Curve](#22-dynamic-pre-exam-escalation-curve)
3. [Fitur Utama](#3-fitur-utama)
   - [Smart Academic Planner (PDF KRS Parser via Gemini API)](#31-smart-academic-planner-pdf-krs-parser-via-gemini-api)
   - [Cross-Device Screen Time Tracking](#32-cross-device-screen-time-tracking)
   - [On-Demand Active Break Validator (MediaPipe 2 Menit)](#33-on-demand-active-break-validator-mediapipe-2-menit)
   - [Dashboard Strava Akademik (Burnout Risk Index 0–100)](#34-dashboard-strava-akademik-burnout-risk-index-0100)
   - [Wellbeing AI Coach & Konsultasi Stres Proaktif](#35-wellbeing-ai-coach--konsultasi-stres-proaktif)
   - [Materi Pitching Juri: Smart Campus CCTV Recovery Zone](#36-materi-pitching-juri-smart-campus-cctv-recovery-zone)
4. [Arsitektur Privasi & Keamanan Data](#4-arsitektur-privasi--keamanan-data)
5. [Skema Database Produksi & Peta REST API](#5-skema-database-produksi--peta-rest-api)
6. [Cara Menjalankan di Komputer Lokal](#6-cara-menjalankan-di-komputer-lokal)
7. [Pengujian & Skrip Verifikasi Live](#7-pengujian--skrip-verifikasi-live)
8. [Struktur Monorepo & Pembagian Kerja](#8-struktur-monorepo--pembagian-kerja)
9. [Landasan Literatur Ilmiah (3 Lapis Epistemologis)](#9-landasan-literatur-ilmiah-3-lapis-epistemologis)
10. [Teknologi yang Digunakan](#10-teknologi-yang-digunakan)
11. [Tim Pengembang & Dokumentasi Terkait](#11-tim-pengembang--dokumentasi-terkait)

---

## 1. Latar Belakang & Pivot Paradigma MVP (Versi 4.0)

Mahasiswa rentan mengalami kelelahan belajar (*academic burnout*) dan penurunan kesehatan mental bukan semata karena kurang berolahraga, melainkan akibat **ketidakseimbangan sistemik** antara **Beban Akademik (*Academic Load*)**, **Waktu Layar (*Screen Time*)**, dan **Waktu Pemulihan (Tidur & Jeda Aktif)**.

CampusFlow mengadopsi **Pivot Desain Strategis (PRD Versi 4.0)** dengan tiga pilar utama:

```
┌────────────────────────────────────────────────────────────────────────┐
│                   TIGA PILAR PIVOT PARADIGMA (v4.0)                    │
├────────────────────────────────┬───────────────────────────────────────┤
│ 1. ZERO CONTINUOUS CAMERA      │ Kamera laptop default OFF.            │
│    (Privasi Terjaga Penuh)     │ Kamera HANYA menyala MAKSIMAL 2 MENIT │
│                                │ saat tombol 'Active Break' ditekan    │
│                                │ untuk validasi pose peregangan.       │
├────────────────────────────────┼───────────────────────────────────────┤
│ 2. KONSEP 'STRAVA AKADEMIK'    │ Stres dihitung dari penggabungan fusi │
│    & FUSI PARAMETER TUNGGAL    │ 4 variabel harian: Jam Tidur, Layar,  │
│                                │ Jeda Aktif, & Academic Load (KRS).    │
│                                │ Output: Satu skor 'Burnout Index'.    │
├────────────────────────────────┼───────────────────────────────────────┤
│ 3. PROACTIVE AI COACHING       │ AI Coach lokal mendampingi mahasiswa  │
│    & SAFETY GUARDRAILS         │ secara empatik: klarifikasi proaktif, │
│                                │ mitigasi krisis darurat (119), dan    │
│                                │ rencana pemulihan terukur.            │
└────────────────────────────────┴───────────────────────────────────────┘
```

---

## 2. Arsitektur Fusi Parameter: Algoritma Burnout Index

CampusFlow menghitung metrik kesimpulan harian tunggal **Burnout Risk Index (0–100)** yang mengadopsi struktur konseptual *Effort-Recovery Model* (Meijman & Mulder, 1998; Sonnentag et al., 2021):

$$\text{Burnout Risk Index} = \text{clamp}_{[0,\,100]}\!\Big((\text{Academic Load Score} + \text{Screen Time Fatigue}) - \text{Recovery Score}\Big)$$

```
   [ FAKTOR BEBAN / PENINGKAT STRES ]                 [ FAKTOR PEMULIHAN / PENURUN STRES ]
   • Academic Load (Bobot SKS + Kurva Ujian H-14..0) • Durasi Tidur ((Jam / 8) * 40)
   • Screen Time Fatigue (max(0, Layar - 8) * 2.5)   • Active Break Terverifikasi (Jumlah * 10)
                                 ╲                  ╱
                                  ▼                ▼
                           ┌────────────────────────────────┐
                           │   BURNOUT RISK INDEX (0–100)   │
                           ├────────────────────────────────┤
                           │  Hijau (< 40)   : Aman/Optimal │
                           │  Kuning (40–75) : Waspada      │
                           │  Merah (> 75)   : Risiko Tinggi│
                           └────────────────────────────────┘
```

### 2.1. Formulasi Matematika Parameter
1. **Academic Load Score (AL):**
   $$\text{AL} = \sum \big(\text{SKS} \times \text{Bobot Kelas}\big) + \text{Penalti Eskalasi Ujian}$$
   - Mata kuliah Teori (`classType = "teori"`) = $1.0\text{ poin/SKS}$
   - Mata kuliah Praktikum (`classType = "praktikum"`) = $1.5\text{ poin/SKS}$
   - Penalti Ujian dihitung secara dinamis menggunakan **Kurva Eskalasi Pra-Ujian** berdasarkan kolom `examDate` (fallback ke $+3.0$ untuk data jadwal lama yang belum mengisi `examDate`).
2. **Screen Time Fatigue (ST):**
   $$\text{ST} = \max(0, \text{Total Jam Layar} - 8.0) \times 2.5$$
   - Setiap kelebihan $1\text{ jam}$ layar di atas batas operasional $8.0\text{ jam/hari}$ menambah $2.5\text{ poin penalti}$.
3. **Recovery Score (RS):**
   $$\text{RS} = \left(\frac{\text{Jam Tidur}}{8.0} \times 40\right) + (\text{Active Break Terverifikasi} \times 10)$$
   - Setiap sesi *Active Break 2 Menit* terverifikasi MediaPipe menambah $+10\text{ poin pemulihan}$ (insentif perilaku produk) dan otomatis menyinkronkan ulang `DailyFussionLog` hari tersebut.

### 2.2. Dynamic Pre-Exam Escalation Curve
Alih-alih penalti biner flat yang baru muncul mendadak di satu titik waktu, `calculateExamProximityPenalty()` pada [`backend/src/services/burnoutScoring.ts`](backend/src/services/burnoutScoring.ts) menerapkan kurva bertingkat berbasis *lookup table* (`EXAM_ESCALATION_CURVE`) terhadap jarak hari menuju `examDate`:

| Tier Eskalasi | Jarak ke Hari Ujian | Penalti Tambahan | Keterangan |
| :--- | :---: | :---: | :--- |
| `H_14_TO_8` | H-14 s/d H-8 | **+0.5** | Peringatan dini pra-ujian |
| `H_7_TO_4` | H-7 s/d H-4 | **+1.5** | Fase persiapan intensif |
| `H_3_TO_1` | H-3 s/d H-1 | **+3.0** | Fase kritis menjelang ujian |
| `H_0` | H-0 (Hari Ujian) | **+4.0** | Puncak tekanan hari ujian |
| `NONE` | Di luar H-14 (`> 14`) atau sudah lewat (`< 0`) | **0** | Di luar jendela eskalasi |

> [!NOTE]
> Pola peningkatan bertahap sejak berminggu-minggu sebelum ujian merujuk pada temuan **Larios & Lerner (2024)** (*Journal of Sleep Research*, `DOI: 10.1111/jsr.14298`). Nilai angka penalti spesifik (`+0.5` s/d `+4.0`) merupakan keputusan desain heuristik produk agar mudah dikalibrasi.

---

## 3. Fitur Utama

### 3.1. Smart Academic Planner (PDF KRS Parser via Gemini API)
- **Alur 2 Tahap Anti-Salah Baca (Preview → Koreksi → Confirm):**
  1. **`POST /api/v1/schedule/upload`** *(alias `/api/academic-schedule/upload`)*: Menerima file PDF KRS (`multipart/form-data`, maks **5 MB**, rate limit terpisah **20 upload/hari/user**). File diproses langsung dari memori RAM (`multer.memoryStorage()`) sehingga **tidak pernah disimpan permanen di disk**.
  2. Ekstraksi menggunakan **Google Gemini API** (`gemini-1.5-flash`) dengan *JSON schema strict validation* (`day_of_week`, `subject_name`, `credit_hours` 1–6, `class_type`, `start_time`, `end_time`, `is_exam_week`), dilengkapi sanitasi *markdown fences*, *retry parsing*, dan **Local PDF Parser Fallback (`pdf-parse`)** saat offline/tanpa API Key.
  3. **`POST /api/v1/schedule/confirm`** *(alias `/api/academic-schedule/confirm`)*: Menyimpan jadwal yang sudah diperiksa/diedit mahasiswa ke tabel `AcademicSchedule`, lalu otomatis memicu `recalculateTodayBurnoutLog()` agar Burnout Risk Index hari ini langsung ter-update.
- **Mentahan Integrasi Siap Pakai:** Tersedia klien frontend [`frontend/src/lib/krsPdfClient.ts`](frontend/src/lib/krsPdfClient.ts), script uji CLI [`backend/scripts/krs-pdf-api-starter.mjs`](backend/scripts/krs-pdf-api-starter.mjs), dan panduan [`docs/backend/KRS_PDF_API_STARTER.md`](docs/backend/KRS_PDF_API_STARTER.md).

### 3.2. Cross-Device Screen Time Tracking
- **Desktop/Laptop:** Melacak durasi fokus layar secara pasif menggunakan **Page Visibility API (`document.hidden`) & Focus Events** di browser tanpa menyalakan webcam.
- **Smartphone:** Pengguna dapat menyinkronkan durasi layar harian dari *Digital Wellbeing* ponsel ke akun yang sama.

### 3.3. On-Demand Active Break Validator (MediaPipe 2 Menit)
- **Kamera Default OFF:** Privasi mahasiswa terlindungi 100%; kamera hanya hidup maksimal 2 menit saat tombol *"Mulai Active Break"* ditekan.
- **Auto-Sync Burnout & XP:** Begitu pose peregangan tervalidasi (`POST /api/v1/active-break/verify`), sistem mencatat `ActiveBreakSession`, memberikan **+15 XP**, dan langsung memperbarui `verifiedBreakCount`, `recoveryScore` (+10 poin), serta `burnoutIndex` pada `DailyFussionLog` hari ini.

### 3.4. Dashboard Strava Akademik (Burnout Risk Index 0–100)
- Menampilkan ritme mingguan **Beban Akademik + Layar vs. Pemulihan**, kartu hero Burnout Risk Index, tren 14 hari (`GET /api/v1/burnout/history?days=14`), kepatuhan *24-Hour Movement Triad*, dan metrik sensor gerak (`PedometerCard`).

### 3.5. Wellbeing AI Coach & Konsultasi Stres Proaktif
- **Mesin Inferensi Lokal (Ollama — Qwen2.5-7B):** Saat ini berjalan pada model terkondisi **`campusflow-coach:latest`** berbasis **`Qwen2.5-7B-Instruct.Q4_K_M`** via Ollama lokal (`http://localhost:11434`), menghasilkan kontrak JSON 5 field tanpa kebocoran data ke cloud. Arsitektur dirancang *model-agnostic* sehingga pergantian atau perbandingan ke **Gemma** cukup dilakukan dengan mengubah `OLLAMA_MODEL` di `backend/.env` tanpa ubah kode TypeScript.
- **Lapisan Keamanan (Multi-Layer Safety Guardrails):**
  1. **Crisis Gateway Bypass (~15 ms):** Mendeteksi ungkapan distres berat / *self-harm*, langsung memutus pemanggilan LLM, dan mengembalikan rujukan darurat **Hotline 119 (ekstensi 8)**, **healing119.id**, dan **112**.
  2. **Klarifikasi Proaktif (~6 ms):** Keluhan singkat ambigu (misal *"capek banget"*) tidak langsung ditebak AI, melainkan menampilkan 4 opsi klarifikasi terstruktur.
  3. **Audit Anti-Halusinasi & Aturan Jam Malam ($\ge 21.30\text{ WIB}$):** Memvalidasi rentang durasi/METs aman (`allowedRanges`), memblokir klaim tanpa data, dan mengalihkan saran gerak larut malam ke relaksasi/pernapasan.

### 3.6. Materi Pitching Juri: Smart Campus CCTV Recovery Zone
- Inovasi jangka panjang (*Future Work*) untuk Techcomfest 2027: integrasi area publik kampus (perpustakaan/lab) dengan CCTV Edge AI MediaPipe. Mahasiswa cukup melakukan peregangan di *Campus Recovery Zone* dan memindai QR untuk menerima poin pemulihan tanpa perlu menyalakan kamera pribadi.

---

## 4. Arsitektur Privasi & Keamanan Data

```
[ BROWSER DESKTOP ]  ──► Page Visibility API (Screen Time) ───┐
[ WEBCAM INSIDENTAL ] ──► MediaPipe WASM (HANYA 2 MENIT) ─────┼──► [ EXPRESS REST API ] ──► [ MYSQL (PRISMA) ]
[ PDF KRS (RAM ONLY) ] ──► Gemini API / Local Fallback ───────┤            │
[ INPUT TIDUR / PSS4 ] ──► Payload JWT Terenkripsi ───────────┘            ▼
                                                                  [ OLLAMA LOKAL ENGINE ]
```

1. **Zero Continuous Surveillance:** Tidak ada kamera menyala terus-menerus selama jam belajar.
2. **Zero Image & PDF Persistence:** Landmark pose diolah 100% di browser (WebGL/WASM); dokumen PDF KRS diolah di memori RAM tanpa ditulis ke disk server.
3. **Privasi AI Lokal & Hak Hapus Data Penuh:** Konsultasi AI Coach diproses lokal di Ollama; endpoint `DELETE /api/v1/users/me/data` menghapus tuntas seluruh riwayat pengguna termasuk tabel PRD v4.0 (`AcademicSchedule`, `DailyFussionLog`, `ActiveBreakSession`).
4. **Rate Limiting Terpisah Per Akun:** AI Coach (10 req/menit/user), Auth (30 req/menit), dan Upload PDF KRS (20 req/hari/user) berbasis User ID sehingga pengguna di Wi-Fi kampus yang sama tidak saling memblokir.

---

## 5. Skema Database Produksi & Peta REST API

### 5.1. Pemisahan Tanggung Jawab Tabel Harian (*Separation of Concerns*)
Skema Prisma ([`backend/prisma/schema.prisma`](backend/prisma/schema.prisma)) sengaja memisahkan dua tabel log harian yang saling melengkapi:

| Tabel | Peran & Sumber Data | Konsumen Utama |
| :--- | :--- | :--- |
| **`DailyFussionLog`** *(PRD v4.0)* | Metrik **objektif/kuantitatif** fusi harian: `totalScreenTimeMins`, `sleepHours`, `academicLoadScore`, `screenFatigueScore`, `recoveryScore`, `verifiedBreakCount`, `burnoutIndex` (0–100), `status`. Sinkronisasi tanggal dinormalisasi ke **UTC date-only** ([`burnoutSync.ts`](backend/src/services/burnoutSync.ts)). | Dashboard Burnout Index, `/burnout/*`, auto-sync dari `/schedule/confirm` & `/active-break/verify`. |
| **`DailyWellbeingLog`** *(Psikometri)* | Data **subjektif & gaya hidup** check-in harian: `pss4RawAnswersJson`, `pss4TotalScore`, `sleepQualityScore`, `nonAcademicScreenHours`, `totalSedentaryHours`, `totalMvpaMinutes`, `triadPillarsMet`, `stressRiskLevel`. | Modul Check-in `/wellbeing/*`, Triad Dashboard, dan diagnosis mediator AI Coach (`ollamaCoach.ts`). |

**Tabel Pendukung Lainnya:**
- **`User`:** Profil mahasiswa, NIM, email, `weeklyMetsTarget`, `targetRecoveryScore`, `currentStreakDays`, `xpPoints`, `postureBaselineJson`, `pushSubscription`.
- **`AcademicSchedule`:** Jadwal perkuliahan mingguan (`dayOfWeek`, `subjectName`, `creditHours`, `classType`, `startTime`, `endTime`, `isPracticum`, `isExamWeek`, `examDate`).
- **`ActiveBreakSession`:** Log sesi jeda aktif 2 menit terverifikasi MediaPipe (`durationMins`, `poseVerified`, `poseType`, `startTime`).
- **`ClinicalAssessment`:** Asesmen berkala skala penuh PSS-10 (`rawAnswersJson`, `totalScore`, `severityLevel`).
- **`AiCoachingInsight`:** Riwayat diagnosis, rencana aksi isotemporal, dan status penyelesaian (+50 XP).
- **`SedentarySession` & `PhysicalActivity`:** Telemetri sesi duduk statis dan catatan aktivitas fisik/METs.

### 5.2. Ringkasan Endpoint Utama (`/api/v1`)
- **Auth & Profil:** `POST /auth/register`, `POST /auth/login`, `POST /auth/demo`, `GET /users/me`, `PATCH /users/me`, `DELETE /users/me/data`, `PATCH /vision/baseline` *(alias `POST /posture/baseline`)*.
- **Smart Academic Planner & PDF KRS:** `POST /schedule/upload` *(preview)*, `POST /schedule/confirm` *(commit + recalc)*, `POST /schedule/parse-krs`, `POST /schedule/parse-krs/preview`, `GET /schedule/stress-analysis`, `GET /schedule`, `POST /schedule`, `POST /schedule/bulk`, `PATCH /schedule/:id`, `DELETE /schedule/:id`.
- **Burnout & Active Break (PRD v4.0):** `GET /burnout/today`, `POST /burnout/calculate` *(alias `/calculate-today`)*, `GET /burnout/history?days=14`, `POST /active-break/verify`, `GET /active-break/today`, `GET /active-break/history?days=14`.
- **Wellbeing, Triad & Sensor:** `POST /wellbeing/daily` *(alias `/checkin`)*, `GET /wellbeing/today`, `GET /wellbeing/history?days=14`, `GET /assessments`, `POST /assessments/pss10`, `GET /dashboard/triad?days=14`, `POST /activities`, `GET /activities`, `POST /sedentary/sessions`, `GET /sedentary/sessions`.
- **AI Coach & Web Push:** `GET /ai-coach/status`, `POST /ai-coach/generate`, `GET /ai-coach/latest`, `GET /ai-coach/history`, `PATCH /ai-coach/:id/complete`, `GET /notifications/vapid-public-key`, `POST /notifications/subscribe`, `DELETE /notifications/subscribe`, `POST /notifications/test`.

---

## 6. Cara Menjalankan di Komputer Lokal

### Prasyarat Sistem
- **Node.js:** Versi `20.x` atau lebih baru
- **Database:** MySQL 8.x
- **LLM Lokal (Opsional untuk AI Coach):** Ollama dengan `campusflow-coach` (`Qwen2.5-7B`) atau model kompatibel lain (`gemma3:4b`, `qwen2.5:3b`)
- **Port Default:** Backend (`4000`), Frontend PWA (`5174`)

### Langkah Instalasi & Jalankan

1. **Kloning Repositori & Pasang Dependensi:**
   ```bash
   git clone https://github.com/syifamojocanggih-hash/CampusFlow.git
   cd CampusFlow
   npm --prefix backend install
   npm --prefix frontend install
   ```

2. **Setup Environment:**
   ```bash
   cp backend/.env.example backend/.env
   cp frontend/.env.example frontend/.env
   ```
   - Di `backend/.env`: pastikan `DATABASE_URL`, `JWT_SECRET`, `OLLAMA_MODEL="campusflow-coach"`, opsional `GEMINI_API_KEY` (untuk parsing PDF KRS multimodal via Gemini), serta `CORS_ORIGIN` mencakup `http://localhost:5174`.
   - Di `frontend/.env`: set `VITE_USE_MOCK="false"` untuk terhubung live ke backend (`VITE_API_BASE_URL="http://localhost:4000/api/v1"`), atau `"true"` untuk mode preview offline.

3. **Sinkronisasi Database, Generate Prisma, & Seed Data Demo:**
   ```bash
   npx --prefix backend prisma db push --schema=backend/prisma/schema.prisma
   npm --prefix backend run prisma:seed
   ```
   *Akun demo otomatis tersedia:* `demo@campusflow.id` / `campusflow2027` (dilengkapi 14 hari data Wellbeing, 14 hari Burnout & Active Break, 6 jadwal kuliah, dan riwayat AI Coach).

4. **Jalankan Backend & Frontend:**
   ```bash
   # Terminal 1 — Backend API (http://localhost:4000/api/v1)
   npm run dev:backend

   # Terminal 2 — Frontend PWA (http://localhost:5174)
   npm run dev:frontend
   ```

---

## 7. Pengujian & Skrip Verifikasi Live

Seluruh modul dilengkapi pengujian otomatis dan skrip uji live:

```bash
# 1. Typecheck & Unit/Integration Tests Backend (125/125 lulus)
npm --prefix backend run typecheck
npm --prefix backend test

# 2. Unit Tests & Production Build Frontend (18/18 lulus)
npm --prefix frontend test
npm --prefix frontend run build

# 3. Smoke Test Live 12 Modul API + CORS (pastikan backend aktif di port 4000)
node backend/scripts/verify-live-backend.mjs

# 4. Uji Live Koneksi API Membaca PDF KRS (Preview & Confirm)
node backend/scripts/krs-pdf-api-starter.mjs
node backend/scripts/krs-pdf-api-starter.mjs ./KRS_Semester.pdf --confirm

# 5. Benchmark Live AI Coach (Qwen2.5 / perbandingan ke Gemma nanti)
node backend/scripts/test-ai-coach-live.mjs
```

---

## 8. Struktur Monorepo & Pembagian Kerja

```
CampusFlow/
├── README.md                                  # Dokumentasi resmi arsitektur & literatur proyek
├── package.json                               # Skrip orkestrasi root monorepo
├── shared/
│   └── contracts/index.ts                     # Kontrak data DTO & konstanta klinis bersama
├── backend/                                   # Express TS, Prisma MySQL, Gemini KRS Parser & Ollama AI Coach
│   ├── prisma/
│   │   ├── schema.prisma                      # Skema MySQL (termasuk examDate, classType, DailyFussionLog)
│   │   ├── migrations/                        # Riwayat migrasi SQL Prisma
│   │   └── seed.ts                            # Seeder demo lengkap 14 hari (v3 + PRD v4.0)
│   ├── ollama/Modelfile                       # Definisi model lokal campusflow-coach (Qwen2.5-7B)
│   ├── scripts/
│   │   ├── verify-live-backend.mjs            # Smoke test live 12 modul API & CORS
│   │   ├── krs-pdf-api-starter.mjs            # Mentahan CLI uji upload & confirm PDF KRS
│   │   └── test-ai-coach-live.mjs             # Benchmark live 4 skenario AI Coach (Qwen/Gemma)
│   └── src/
│       ├── routes/                            # academicSchedule, burnout, activeBreak, wellbeing, aiCoach, dll.
│       ├── services/                          # burnoutScoring, burnoutSync, scheduleParser, krsParserService, clinicalScoring, ollamaCoach
│       └── middleware/                        # auth, rateLimit (per-akun & harian PDF), upload (RAM-only), errorHandler
├── frontend/                                  # Client React 18 + Vite + Tailwind PWA (Port 5174)
│   └── src/
│       ├── lib/
│       │   ├── api.ts                         # API Client terintegrasi penuh (toggle live/mock)
│       │   └── krsPdfClient.ts                # Mentahan klien khusus upload & konfirmasi PDF KRS
│       ├── components/                        # TriadDashboard, VisionGuard, AuthModal, CoachView, dll.
│       └── utils/                             # burnoutCalculator, screenTimeTracker, poseHeuristics, pedometerEngine
├── docs/
│   ├── backend/                               # API_SPECIFICATION, CLINICAL_SCORING, KRS_PDF_API_STARTER, DATABASE_SCHEMA
│   ├── universal/                             # PRD, PRD_V4_PIVOT_EXPLANATION, ARCHITECTURE, INTERFACES, GIT_WORKFLOW
│   └── changelogs/                            # Catatan perubahan per anggota (Ibra, Tiara, Syifa)
└── scripts/
    └── guard-check.mjs                        # Guard linter integritas commit & scope kerja
```

---

## 9. Landasan Literatur Ilmiah (3 Lapis Epistemologis)

Arsitektur metrik kesejahteraan dan mitigasi kelelahan belajar CampusFlow memisahkan rujukan ilmiah ke dalam **tiga lapis epistemologis yang tegas** agar tidak terjadi pencampuran antara fondasi teori, koefisien numerik, dan instrumen validasi eksternal.

### 9.1. Lapis Teori (Fondasi Konsep)

Lapis ini menjustifikasi **logika struktural model** bahwa kelelahan belajar bekerja melalui dinamika antagonistik antara akumulasi beban kerja (*load*) dan episode pemulihan (*recovery*).

* **Meijman & Mulder (1998)** — *The Psychological Aspects of Workload*  
  *Justifikasi Penggunaan:* Akar teori klasik (*Effort-Recovery Model*) yang menjelaskan bahwa beban kognitif hanya berubah menjadi *strain* patologis bila tidak diimbangi pemulihan memadai sebelum tuntutan berikutnya.
* **Sonnentag, Venz, & Casper (2021)**, *Annual Review of Organizational Psychology and Organizational Behavior*, Vol. 9, hlm. 33–60, [DOI: 10.1146/annurev-orgpsych-012420-091355](https://doi.org/10.1146/annurev-orgpsych-012420-091355)  
  *Justifikasi Penggunaan:* Rujukan teori modern pendukung *Effort-Recovery* mengenai pemulihan sumber daya pengaturan diri melalui tidur dan jeda berkala.

> [!NOTE]
> **Batasan Konseptual Lapis Teori:** Publikasi Sonnentag, Venz, & Casper (2021) **HANYA** menjustifikasi logika struktur pengurangan $\text{Beban} - \text{Pemulihan}$. Paper ini secara eksplisit **TIDAK** memuat rumus matematis atau persamaan numerik tertentu.

---

### 9.2. Lapis Kuantifikasi (Sumber Parameter & Arah Kurva)

Lapis ini menjustifikasi komponen variabel dan arah kurva dalam formula Burnout Risk Index.

#### A. Academic Load Score (Beban SKS & Kurva Eskalasi Pra-Ujian)
* **Olson et al. (2023)**, *Frontiers in Public Health*, [DOI: 10.3389/fpubh.2023.1118244](https://doi.org/10.3389/fpubh.2023.1118244)  
  *Justifikasi Penggunaan:* Membuktikan kepadatan volume SKS dan kurikulum merupakan prediktor independen utama kelelahan emosional mahasiswa.
* **Andrade et al. (2023)**, *Scientific Reports*, [DOI: 10.1038/s41598-023-31852-w](https://doi.org/10.1038/s41598-023-31852-w)  
  *Justifikasi Penggunaan:* Menjustifikasi hubungan linier antara kelebihan beban belajar (*study overload*) dan sindrom burnout akademik.
* **Larios, E., & Lerner, I. (2024)**, *Journal of Sleep Research*, 34(1), e14298, [DOI: 10.1111/jsr.14298](https://doi.org/10.1111/jsr.14298)  
  *Justifikasi Penggunaan:* Menemukan bahwa *test anxiety* meningkat secara gradual berminggu-minggu sebelum ujian. Paper ini **HANYA** menjustifikasi pola kurva eskalasi bertahap (`H-14` → `H-0`), **BUKAN** sumber angka penalti spesifik (`+0.5`, `+1.5`, `+3.0`, `+4.0`) yang merupakan keputusan desain produk.

#### B. Screen Time Fatigue (Kelelahan Waktu Layar Digital)
* **Alshahrani et al. (2025)**, *Frontiers in Psychiatry*, [DOI: 10.3389/fpsyt.2025.1485601](https://doi.org/10.3389/fpsyt.2025.1485601)  
  *Justifikasi Penggunaan:* Mengidentifikasi korelasi antara durasi paparan layar digital berkepanjangan dengan kelelahan mental serta gangguan tidur mahasiswa.
* **Xu et al. (2025)**, *Frontiers in Psychiatry*, [DOI: 10.3389/fpsyt.2025.1528659](https://doi.org/10.3389/fpsyt.2025.1528659)  
  *Justifikasi Penggunaan:* Menjustifikasi kontribusi penggunaan layar tanpa regulasi terhadap percepatan *learning burnout*.

> [!CAUTION]
> **Catatan Verifikasi Ambang 8 Jam:** Isi penuh klaim mengenai ambang batas definitif *8 jam* pada kedua paper di atas belum diverifikasi dari PDF lengkap — perlu dicek manual sebelum presentasi final. Di CampusFlow saat ini, 8 jam difungsikan sebagai batas operasional heuristik produk.

#### C. Tidur sebagai Pemulihan (Sleep Recovery)
* **Allen et al. (2021)**, *International Journal of Behavioral Medicine*, [DOI: 10.1007/s12529-020-09942-3](https://doi.org/10.1007/s12529-020-09942-3)  
  *Justifikasi Penggunaan:* Menjustifikasi peran restoratif tidur adekuat (7–9 jam/malam) dalam menahan eskalasi burnout mahasiswa.
* **Mu et al. (2024)**, *Frontiers in Psychology*, [DOI: 10.3389/fpsyg.2024.1376993](https://doi.org/10.3389/fpsyg.2024.1376993)  
  *Justifikasi Penggunaan:* Mengonfirmasi kualitas tidur sebagai mediator protektif dominan dalam memulihkan kondisi afektif harian.

#### D. Active Break / Micro-break Terverifikasi
* **Albulescu et al. (2022)**, *PLOS ONE*, [DOI: 10.1371/journal.pone.0272460](https://doi.org/10.1371/journal.pone.0272460)  
  *Justifikasi Penggunaan:* Meta-analisis 22 sampel studi independen ($N = 2.335$) menunjukkan jeda mikro fisik memberikan efek acak signifikan namun **KECIL** pada *vigor* ($d = 0.36$) dan *fatigue* ($d = 0.35$); efek pada performa kerja tidak signifikan.

> [!IMPORTANT]
> **Klarifikasi Bobot Active Break:** Bobot $+10\text{ poin}$ per *Active Break Verified* di sistem ini adalah **insentif perilaku produk** (gamifikasi kebiasaan sehat), bukan klaim efek klinis besar.

#### E. Quantified Self & "Academic Strava"
* **Gauthier et al. (2022)**, *Computers in Human Behavior*, [DOI: 10.1016/j.chb.2022.107314](https://doi.org/10.1016/j.chb.2022.107314)  
  *Justifikasi Penggunaan:* Menjustifikasi efektivitas paradigma *Quantified Self* dalam memperkuat regulasi diri mahasiswa terhadap ritme belajar dan pemulihan.

---

### 9.3. Lapis Validasi Eksternal (Instrumen Pembanding Psikometri & Fisiometri)

Lapis ini digunakan untuk *cross-check* validitas skor kesejahteraan mahasiswa, **BUKAN** bagian numerik langsung dari formula Burnout Risk Index.

* **PSS-4:** **Schmalbach, Ernst, Brähler, & Petrowski (2025)**, *Frontiers in Psychology*, [DOI: 10.3389/fpsyg.2024.1479701](https://doi.org/10.3389/fpsyg.2024.1479701)  
  *Justifikasi Penggunaan:* Instrumen psikometri harian ringkas (4 butir) untuk memantau fluktuasi stres subjektif mahasiswa. Paper ini **TIDAK** menyebutkan cutoff skor $\ge 8$.

> [!NOTE]
> **Catatan Ambang Batas PSS-4:** PSS-4 secara resmi tidak memiliki *cutoff* klinis tervalidasi secara universal. Ambang $\ge 8$ di CampusFlow dinyatakan eksplisit sebagai **ambang heuristik internal produk** untuk memicu rekomendasi AI Coach, bukan standar diagnosis klinis baku.

* **PSS-10:** **Denovan & Dagnall (2025)**, *Current Psychology*, [DOI: 10.1007/s12144-025-08061-x](https://doi.org/10.1007/s12144-025-08061-x)  
  *Justifikasi Penggunaan:* Menjustifikasi validitas struktur dan pola *reverse-scoring* baku pada item positif (item 4, 5, 7, 8) untuk evaluasi mingguan.
* **IPAQ-SF:** **Validasi Versi Yunani (2025)**, *Central European Journal of Public Health*, [DOI: 10.21101/cejph.a8446](https://doi.org/10.21101/cejph.a8446)  
  *Justifikasi Penggunaan:* Digunakan **HANYA** untuk 3 nilai MET resmi standar IPAQ-SF: jalan santai ($3.3\text{ MET}$), aktivitas sedang ($4.0\text{ MET}$), dan aktivitas berat ($8.0\text{ MET}$).

> [!WARNING]
> **Pemisahan Sumber Nilai MET 5.0:** Nilai $5.0\text{ MET}$ (latihan beban / aerobik akut) **BUKAN** bagian resmi IPAQ-SF; nilai tersebut merujuk pada *Compendium of Physical Activities* (Ainsworth et al.) dan dipisahkan secara eksplisit dari rumpun sitasi resmi IPAQ-SF.

### 9.4. Alur Logis Tiga Lapis
Secara ringkas, **Lapis Teori** menjustifikasi mengapa model fusi dirumuskan sebagai pengurangan beban terhadap pemulihan ($\text{Beban} - \text{Pemulihan}$); **Lapis Kuantifikasi** menjustifikasi asal empiris dan batas transparansi tiap parameter serta kurva eskalasi harian; sedangkan **Lapis Validasi Eksternal** menjustifikasi bagaimana skor akhir hasil fusi dapat diuji silang dan dipertanggungjawabkan secara psikometri menggunakan instrumen baku internasional.

---

## 10. Teknologi yang Digunakan

| Kategori | Teknologi / Pustaka | Penggunaan Utama |
| :--- | :--- | :--- |
| **Frontend & PWA** | React 18, TypeScript, Vite, Tailwind CSS, `vite-plugin-pwa` | Antarmuka PWA responsif, Service Worker Workbox, port `5174` |
| **Computer Vision (On-Demand)** | `@mediapipe/tasks-vision` (Pose Landmarker WebGL/WASM) | Validasi gerakan peregangan 2 menit saat *Active Break* |
| **Screen Time Monitoring** | Browser Page Visibility API (`document.hidden`) | Pelacakan durasi aktif layar laptop tanpa webcam |
| **Backend & Database** | Node.js, Express 5, TypeScript, Prisma ORM, MySQL 8 | API REST `/api/v1/*`, Burnout Engine & UTC Date Sync, port `4000` |
| **Document Parsing AI** | Google Gemini API (`gemini-1.5-flash`), `multer` (RAM), `pdf-parse` | Ekstraksi jadwal KRS PDF 2-tahap (Preview → Confirm) + fallback lokal |
| **Local LLM Engine** | Ollama Lokal (`campusflow-coach` berbasis Qwen2.5-7B; siap swap Gemma) | AI Coach terstruktur JSON, Klarifikasi Proaktif & Crisis Gateway 119 |
| **Keamanan & Notifikasi** | JWT, `bcryptjs`, Rate Limiting per-akun, Helmet, Web Push VAPID | Autentikasi, proteksi endpoint, & *push nudge* latar belakang |

---

## 11. Tim Pengembang & Dokumentasi Terkait

Proyek **CampusFlow** dikembangkan untuk **Techcomfest 2027** oleh:
* **Ibra** (`@flyingdutchman`) — *Project Leader & Vision AI Engineer* (Branch `main`)
* **Mutiara Dewanda Prisvilla (Tiara)** (`@mutiaradewanda`) — *Frontend & PWA Experience Engineer* (Branch `frontend`)
* **Ahmad Syifa'ul Falakhul Khayyi (Syifa)** (`@syifamojocanggih-hash`) — *Backend & LLM Engineer* (Branch `backend`)

Dokumentasi teknis terkait:
* 📄 [**Dokumentasi Pivot PRD v4.0**](docs/universal/PRD_V4_PIVOT_EXPLANATION.md)
* 🔌 [**Spesifikasi Endpoint REST API**](docs/backend/API_SPECIFICATION.md)
* 📑 [**Mentahan Integrasi API Pembaca PDF KRS**](docs/backend/KRS_PDF_API_STARTER.md)
* 🧮 [**Algoritma Skoring Klinis & Burnout**](docs/backend/CLINICAL_SCORING.md)
* 🛡️ [**Changelog Per-User (CHANGELOG_SYIFA.md)**](docs/changelogs/CHANGELOG_SYIFA.md)
* 📦 [**Kontrak Bersama (`shared/contracts/index.ts`)**](shared/contracts/index.ts)

---

<p align="center">
  <strong>CampusFlow — Academic Strava & Predictive Burnout Management</strong><br>
  <em>Smart Lifestyle & Digital Wellbeing (SDG 3) · Techcomfest 2027 Politeknik Negeri Semarang</em>
</p>
