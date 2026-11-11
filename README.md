# CampusFlow

> **Duduk Sehat. Gerak Terukur. Stres Terkendali.**  
> Progressive Web Application (PWA) lintas perangkat berbasis AI Vision & Sensor Gerak untuk pemantauan postur, intervensi jeda aktif anti-cheat, kuantifikasi aktivitas fisik IPAQ-SF, dan *Clinical Wellbeing AI Coach* mahasiswa.  
> Topik Riset: **Kelola Stres Melalui Physical Activity Berbasis Aplikasi PWA pada Mahasiswa** · **Techcomfest 2027** · Sub-Tema 3: *Smart Lifestyle & Digital Wellbeing* (SDG 3).

[![Architecture: 3-Branch Monorepo](https://img.shields.io/badge/Architecture-3--Branch%20Monorepo-2563EB.svg)](#7-struktur-monorepo--pembagian-kerja)
[![Vision: On-Device MediaPipe](https://img.shields.io/badge/AI%20Vision-On--Device%20WebGL%2FWASM-0EA5A4.svg)](#4-arsitektur-privasi--keamanan-data)
[![AI Coach: Gemini 2.5 Flash](https://img.shields.io/badge/AI%20Coach-Gemini%202.5%20Flash%20JSON-22C55E.svg)](#35-agentic-wellbeing-ai-coach--exam-panic-button)
[![Zero-Conflict Changelogs](https://img.shields.io/badge/Workflow-Per--User%20Changelog%20Guard-F59E0B.svg)](#7-struktur-monorepo--pembagian-kerja)

---

## Daftar Isi
1. [Latar Belakang & Masalah](#1-latar-belakang--masalah)
2. [Landasan Ilmiah & Kerangka 24-Hour Movement](#2-landasan-ilmiah--kerangka-24-hour-movement)
3. [Fitur Utama](#3-fitur-utama)
   - [Vision Guard & Kalibrasi Baseline 5 Detik](#31-vision-guard--kalibrasi-baseline-5-detik)
   - [Pose-Verified Anti-Cheat Active Break](#32-pose-verified-anti-cheat-active-break)
   - [Pedometer 3-Sumbu & Konversi METs (IPAQ-SF)](#33-pedometer-3-sumbu--konversi-mets-ipaq-sf)
   - [Kuesioner Klinis PSS-4, PSS-10, & PSQI Tidur](#34-kuesioner-klinis-pss-4-pss-10--psqi-tidur)
   - [Agentic Wellbeing AI Coach & Exam Panic Button](#35-agentic-wellbeing-ai-coach--exam-panic-button)
   - [Akun Demo & Mode Presentasi Juri](#36-akun-demo--mode-presentasi-juri)
   - [Transparansi & Keterbatasan Sistem](#37-transparansi--keterbatasan-sistem)
4. [Arsitektur Privasi & Keamanan Data](#4-arsitektur-privasi--keamanan-data)
5. [Petunjuk Penggunaan (Alur Evaluasi / Walk-Through)](#5-petunjuk-penggunaan-alur-evaluasi--walk-through)
6. [Cara Menjalankan di Komputer Lokal](#6-cara-menjalankan-di-komputer-lokal)
7. [Struktur Monorepo & Pembagian Kerja](#7-struktur-monorepo--pembagian-kerja)
8. [Teknologi yang Digunakan](#8-teknologi-yang-digunakan)
9. [Tim Pengembang](#9-tim-pengembang)
10. [Dokumentasi Teknis Terkait](#10-dokumentasi-teknis-terkait)

---

## 1. Latar Belakang & Masalah

Mahasiswa menghabiskan rata-rata **8–10 jam per hari** dalam posisi duduk statis (*sedentary behavior*) saat menghadiri kuliah, mengerjakan tugas, dan belajar mandiri di depan layar laptop. Berdasarkan tinjauan sistematis **Martín-Rodríguez & González-Prieto (2026)** (*Frontiers in Sports and Active Living*, PROSPERO: CRD420251179614), perilaku duduk berkepanjangan ($\ge 9$ jam/hari) tanpa aktivitas fisik sedang-berat (*MVPA*) yang memadai secara signifikan meningkatkan risiko kecemasan (OR = 1.37) dan gejala depresi/kelelahan akademik (OR = 1.61–1.74).

Aplikasi pengingat biasa gagal mengatasi masalah ini karena bersifat pasif: tombol *snooze* dapat ditekan tanpa mahasiswa beranjak dari kursi, pencatatan aktivitas masih manual dan subjektif, serta intervensi olahraga sering mengabaikan kualitas tidur dan durasi layar.

**CampusFlow** hadir sebagai solusi PWA lintas perangkat (laptop + smartphone) yang memantau dan mengintervensi tiga pilar kesehatan harian mahasiswa secara terukur: **Postur & Waktu Duduk (Vision Guard)**, **Aktivitas Fisik Otomatis (Pedometer METs)**, serta **Stres & Tidur (PSS + Gemini AI Coach)**.

---

## 2. Landasan Ilmiah & Kerangka 24-Hour Movement

Setiap ambang batas dan aturan bisnis di CampusFlow diturunkan langsung dari bukti kuantitatif literatur utama:

| Pilar / Dimensi | Rujukan Bukti Ilmiah | Implementasi Konstanta & Aturan di CampusFlow |
|---|---|---|
| **1. Pembatasan Duduk Statis** *(Substitusi Isotemporal)* | Barbosa et al. (2024); Su et al. (2022) | `MAX_SAFE_SEDENTARY_HOURS = 9.0`, `ISOTEMPORAL_WORK_BOUT_MINS = 50`, `ISOTEMPORAL_BREAK_MINS = 10` (mengganti 5–15 menit duduk dengan gerak aktif). |
| **2. Volume Gerak Aktif (MVPA & MSE)** | Zhang et al. (2024); Ai et al. (2021) | `TRIAD_PILLAR_1_MVPA_MINS = 30`, `TARGET_MVPA_PER_SEDENTARY_HOUR = 25`, `WEEKLY_TOTAL_METS_TARGET = 1500`, `WEEKLY_MSE_TARGET_DAYS = 2`. |
| **3. Sinergi Tidur & Stres** *(Mediasi 41%)* | Mu et al. (2024); Wang et al. (2025); Moriarty et al. (2021) | `SLEEP_MEDIATION_WEIGHT = 0.41`, `TRIAD_PILLAR_2_SLEEP_HOURS = [7.0, 9.0]`, skor `PSS-4 >= 8` memicu intervensi AI Coach prioritas sore hari. |

> Kegagalan memenuhi ketiga pilar *24-Hour Movement Guidelines* sekaligus meningkatkan risiko depresi hingga **3.4× lipat** (Zhang et al., 2024; Lin et al., 2024).

---

## 3. Fitur Utama

```
                                  CAMPUSFLOW PWA
  ┌──────────────────┬──────────────────┬──────────────────┬──────────────────┐
     VISION GUARD       ACTIVE BREAK        PEDOMETER HP       CLINICAL AI COACH
   (33 Pose + EAR)    (Anti-Cheat Lock)   (3-Axis DSP METs)   (PSS + Gemini 2.5)
          │                  │                   │                    │
          ▼ [ ON-DEVICE WASM ]                   ▼ [ WEB SENSOR ]     ▼ [ PRISMA + LLM ]
              [ PRIVACY-FIRST: CITRA KAMERA TIDAK PERNAH DIUNGGAH KE SERVER ]
```

### 3.1. Vision Guard & Kalibrasi Baseline 5 Detik
- **MediaPipe Tasks Vision (WebGL/WASM):** Ekstraksi **33 Pose Landmarks** dan **478 Face Landmarks** secara real-time ($\ge 24$ FPS) langsung di browser laptop tanpa melatih dataset gambar dari nol.
- **Kalibrasi Baseline 5 Detik (100 Frame):** Mengukur `shoulderWidth`, `shoulderY`, `neckVerticalDist`, dan `torsoNeckAngle` unik per pengguna agar deteksi tahan terhadap perbedaan tinggi badan dan sudut kamera.
- **Deteksi 4 Kondisi Real-Time (EMA $\alpha = 0.25$):**
  1. *Forward Head / Slouching* ($R_{neck} < 0.78$ atau $\Delta\theta > 15^\circ$ selama $\ge 180$ detik).
  2. *Eye-Strain Proximity* ($R_{depth} \ge 1.28$ selama $\ge 60$ detik) + Eye Aspect Ratio (EAR) kedipan mata.
  3. *Asymmetric Leaning* ($\theta_{roll} > 12.0^\circ$ selama $\ge 120$ detik).
  4. *Prolonged Sedentary Bout* ($\text{Var}(X_{sh}, Y_{sh}) < 0.015$ selama $\ge 50$ menit).

### 3.2. Pose-Verified Anti-Cheat Active Break
- Saat waktu duduk melampaui batas (50 menit pada mode normal, atau 15 detik pada `DEMO_MODE`), layar sesi belajar terkunci dan memunculkan **Active Break Modal**.
- Tidak ada tombol *Snooze*: pengguna wajib menyelesaikan **Overhead Arm Stretch** ($y_{wrist} < y_{nose}$ dan sudut siku $> 140^\circ$ selama 5 detik $\times 3$ repetisi) serta verifikasi **Stand-Up / Step-Away** ($Y_{sh\_curr} < Y_{sh\_base} - 0.20$ atau subjek meninggalkan kursi).

### 3.3. Pedometer 3-Sumbu & Konversi METs (IPAQ-SF)
- Menggunakan **HTML5 `DeviceMotionEvent`** pada PWA smartphone dengan pemrosesan sinyal digital *Orientation-Independent* (magnitudo vektor 3D + *High-Pass Moving Average* 25 sampel).
- **Anti-Shake Filter:** Langkah hanya sah jika puncak akselerasi bersih $> 1.35\text{ m/s}^2$, jeda antarlangkah $250\text{–}1200\text{ ms}$ ($50\text{–}240\text{ SPM}$), dan minimal 6 langkah beruntun.
- **Konversi Otomatis MET-Menit:** *Walking* ($3.3\text{ METs}$ pada $60\text{–}99\text{ SPM}$), *Moderate* ($4.0\text{ METs}$ pada $100\text{–}129\text{ SPM}$), *Vigorous* ($8.0\text{ METs}$ pada $\ge 130\text{ SPM}$), serta log *Muscle-Strengthening Exercise* ($5.0\text{ METs}$).

### 3.4. Kuesioner Klinis PSS-4, PSS-10, & PSQI Tidur
- **PSS-4 Harian (30 detik):** Skala Likert 0–4 dengan *reverse scoring* otomatis pada item positif **Q2 & Q3** ($4 - x$). Cutoff $\ge 8$ memicu peringatan stres tinggi.
- **PSS-10 Mingguan:** 10 item baku dengan *reverse scoring* otomatis pada **Item 4, 5, 7, 8**.
- **Indeks Kualitas Tidur (Adaptasi PSQI):** Menghitung durasi tidur malam, latensi tidur, dan skor kesegaran bangun pagi (target optimal $7.0\text{–}9.0$ jam dan skor $\ge 3$).

### 3.5. Agentic Wellbeing AI Coach & Exam Panic Button
- **Google Gemini 2.5 Flash (`@google/genai`) Structured JSON Output:** Menganalisis telemetri 7 hari terakhir pengguna untuk menghasilkan `dominantMediator`, `diagnosisSummary`, `isotemporalActionPlan`, `recommendedMetsToday`, dan `scientificCitationNote` yang dikunci pada literatur klinis.
- **Exam Panic Button (15 Menit):** Mode darurat kecemasan ujian berbasis studi Wu & Zhou (2024) yang memandu latihan aerobik akut $110\text{–}125\text{ BPM}$ selama 15 menit.

### 3.6. Akun Demo & Mode Presentasi Juri
Tersedia **Akun Demo Bawaan** (dengan riwayat data 14 hari ter-seed di MySQL) untuk pengujian evaluator/juri:

| Informasi Akun | Nilai Kredensial |
|---|---|
| **Email Demo** | `demo@campusflow.id` |
| **Toggle Presentasi Cepat** | Aktifkan `DEMO_MODE = true` di UI Pengaturan untuk mempercepat ambang duduk dari 50 menit menjadi **15 detik** saat demo live. |

### 3.7. Transparansi & Keterbatasan Sistem
- CampusFlow adalah sistem pemantauan preventif dan intervensi perilaku mahasiswa berbasis literatur ilmiah, **bukan alat diagnosis medis/psikiatris pengganti psikolog atau dokter**.
- Fitur deteksi postur membutuhkan pencahayaan ruangan yang cukup dan otomatis dinonaktifkan secara anggun (*graceful degradation*) bila perangkat tidak memiliki webcam atau berada pada layar mobile sempit (`< 640px`).

---

## 4. Arsitektur Privasi & Keamanan Data

CampusFlow menerapkan prinsip **On-Device Edge Privacy**:

```
[ WEBCAM LAPTOP ] ──► [ MEDIAPIPE WASM/WEBGL DI BROWSER ] ──► [ HANYA ANGKA BASELINE/METRIK ]
                                                                          │
[ SENSOR HP 3-AXIS ] ──► [ DSP PEDOMETER DI BROWSER ] ────────────────────┼──► [ EXPRESS REST API ] ──► [ MYSQL (PRISMA) ]
                                                                          │
[ KUESIONER PSS/PSQI ] ──► [ HTTPS / TLS + JWT + BCRYPT ] ────────────────┘          └─► [ GEMINI 2.5 FLASH API ]
```

1. **Zero Video/Image Upload:** Frame video webcam diproses 100% lokal di browser (WebGL/WASM). Tidak ada gambar atau rekaman video yang pernah dikirim ke server — hanya koordinat ringkas kalibrasi dan metrik durasi duduk/slouch.
2. **Aset Model Lokal:** Bobot model `pose_landmarker_lite.task` disajikan dari `frontend/public/models/` dan di-cache via PWA Workbox agar tetap berjalan cepat dan privat.
3. **Keamanan Kredensial & API Key:** Kata sandi di-hash dengan `bcryptjs`, sesi dilindungi JWT, dan kunci rahasia (`GEMINI_API_KEY`, `VAPID_KEYS`, `DATABASE_URL`) hanya disimpan di `.env` sisi server.

---

## 5. Petunjuk Penggunaan (Alur Evaluasi / Walk-Through)

1. **Skenario A — Onboarding & Kalibrasi 5 Detik:** Login menggunakan `demo@campusflow.id`, berikan izin kamera, duduk tegak selama 5 detik hingga baseline tersimpan.
2. **Skenario B — Vision Guard & Anti-Cheat Active Break:** Aktifkan `DEMO_MODE = true`, duduk membungkuk di depan laptop selama 15 detik hingga peringatan postur dan **Active Break Modal** mengunci layar, lalu angkat kedua tangan di atas kepala ($3 \times 5$ detik) dan berdiri hingga kunci terbuka.
3. **Skenario C — Pelacak Langkah Mobile (HTTPS):** Buka URL PWA di smartphone melalui HTTPS lokal, masukkan HP ke saku, berjalan 20 langkah untuk memantau kenaikan langkah, cadence (SPM), dan MET-menit secara live.
4. **Skenario D — Kuesioner PSS-4 & Agentic AI Coach:** Isi kuesioner harian PSS-4 (30 detik) dan jam tidur, buka **Triad Dashboard**, lalu panggil **AI Coach** untuk melihat rekomendasi spesifik beserta rujukan studi pendukungnya.

---

## 6. Cara Menjalankan di Komputer Lokal

### Prasyarat Sistem
- **Node.js:** Versi `20.x` atau lebih baru
- **npm:** Versi `10.x` atau lebih baru
- **Database:** MySQL 8.x (lokal, Docker, atau TiDB Cloud)
- **Git:** Minimal versi `2.30` (disarankan menggunakan *Git Bash* di Windows untuk menjalankan hook & script `.sh`)

### Langkah Instalasi & Menjalankan

1. **Kloning Repositori & Pilih Branch Kerja:**
   ```bash
   git clone https://github.com/syifamojocanggih-hash/CampusFlow.git
   cd CampusFlow
   git config core.hooksPath .githooks
   ```
   - Gunakan `main` untuk arsitektur inti, kontrak, & AI Vision (**Ibra**).
   - Gunakan `backend` untuk layanan server & LLM (**Syifa**).
   - Gunakan `frontend` untuk aplikasi web PWA & UI (**Tiara** / kolaborasi **Ibra**).

2. **Setup & Jalankan Backend (Branch `backend` / folder `backend/`):**
   ```bash
   cd backend
   npm install
   cp .env.example .env          # Isi DATABASE_URL, JWT_SECRET, GEMINI_API_KEY, VAPID_KEYS
   npx prisma migrate dev --name init
   npx prisma db seed            # Mengisi akun demo & riwayat 14 hari
   npm run dev
   ```

3. **Setup & Jalankan Frontend PWA (Branch `frontend` / folder `frontend/`):**
   ```bash
   cd frontend
   npm install
   npm run dev                   # Gunakan HTTPS lokal (@vitejs/plugin-basic-ssl / ngrok) untuk uji sensor HP
   ```

4. **Verifikasi Guard Changelog & Batas Scope Sebelum Push:**
   ```bash
   npm run guard
   ```

---

## 7. Struktur Monorepo & Pembagian Kerja

CampusFlow menggunakan arsitektur **3-Branch Zero-Conflict Monorepo** (`main`, `backend`, `frontend`) dengan aturan pemisahan file yang tegas antara file turunan dari `main` dan file khusus masing-masing branch, serta **Changelog terpisah per user**:

```
CampusFlow/
├── README.md                          # [main] Dokumentasi utama proyek
├── DESIGN.md                          # [main] Master Design, PRD Summary & Aturan Batas User
├── package.json                       # [main] Skrip helper root (tanpa shared package-lock.json)
├── shared/                            # [main -> diturunkan] Kontrak TypeScript & modul inti Vision
├── backend/                           # [branch: backend] Express + Prisma MySQL + Gemini AI Coach
│   └── (package.json & package-lock.json mandiri)
├── frontend/                          # [branch: frontend] React 18 + Vite + Tailwind + PWA + MediaPipe UI
│   └── (package.json & package-lock.json mandiri)
├── docs/
│   ├── README.md                      # [main] Indeks dokumentasi & matriks wewenang
│   ├── universal/                     # [main -> diturunkan] PRD, Arsitektur, Kontrak, Git Workflow, ADR
│   ├── vision/                        # [main -> diturunkan] Spesifikasi & tugas AI Vision (Ibra)
│   ├── backend/                       # [branch: backend] Spesifikasi DB, API, Scoring, Gemini LLM (Syifa)
│   ├── frontend/                      # [branch: frontend] Design System, Alur Layar, Pedometer, Mock (Tiara)
│   └── changelogs/                    # [TERPISAH PER USER — Anti-Konflik saat Merge!]
│       ├── CHANGELOG_IBRA.md          # Catatan perubahan Ibra (@flyingdutchman)
│       ├── CHANGELOG_TIARA.md         # Catatan perubahan Tiara (@mutiaradewanda)
│       └── CHANGELOG_SYIFA.md         # Catatan perubahan Syifa (@syifamojocanggih-hash)
├── scripts/
│   ├── guard-check.mjs                # [main] Penjaga wajib changelog pribadi & audit [CROSS-SCOPE]
│   └── guard-check.sh                 # [main] Wrapper Bash untuk guard-check.mjs
├── .githooks/
│   └── pre-push                       # [main] Menjalankan guard-check otomatis sebelum git push
└── .github/
    ├── CODEOWNERS                     # [main] Peninjau otomatis per domain
    ├── pull_request_template.md       # [main] Template PR dengan checklist changelog & cross-scope
    └── workflows/guard-check.yml      # [main] CI verifikasi PR menuju main
```

> **Mengapa Merge Tidak Konflik?**
> 1. `backend/package-lock.json` dan `frontend/package-lock.json` dipisah (tidak ada single root lockfile yang diperebutkan).
> 2. Changelog setiap user dipisah (`CHANGELOG_IBRA.md`, `CHANGELOG_TIARA.md`, `CHANGELOG_SYIFA.md`).
> 3. File bersama (`DESIGN.md`, `docs/universal/`, `docs/vision/`, `shared/`) dibuat di `main` dan diturunkan ke branch lewat `git merge origin/main`.
> 4. Perubahan lintas zona (`[CROSS-SCOPE]`) tetap diperbolehkan bila mendesak dengan syarat **wajib tercatat** di Changelog pribadi dan dikoordinasikan saat PR.

---

## 8. Teknologi yang Digunakan

| Kategori | Teknologi / Pustaka | Penggunaan |
|---|---|---|
| **Frontend & PWA** | React 18, TypeScript, Vite, Tailwind CSS, `vite-plugin-pwa` | Antarmuka responsif, Service Worker Workbox cache, instalasi offline PWA |
| **Computer Vision (On-Device)** | `@mediapipe/tasks-vision` (PoseLandmarker + FaceLandmarker) | Deteksi postur 33 titik sendi, jarak layar, kedipan EAR, & verifikasi peregangan |
| **Mobile Motion Sensor** | HTML5 `DeviceMotionEvent` (3-Axis Accelerometer) | Pedometer independen orientasi & kalkulasi otomatis MET-menit IPAQ-SF |
| **Visualisasi & Ikon** | Recharts & Lucide React | Grafik tren 24-Hour Triad, Progress Ring, & ikonografi bebas lisensi |
| **Backend & Database** | Node.js, Express, TypeScript, Prisma ORM, MySQL | REST API `/api/v1/*`, kalkulator klinis PSS/PSQI/METs, Web Push VAPID |
| **Agentic AI Coach** | Google Gemini API (`@google/genai`, `gemini-2.5-flash`) | Analisis multivariat 7 hari dengan Structured JSON Output |
| **Keamanan & Autentikasi** | JWT (`jsonwebtoken`), `bcryptjs`, HTTPS/TLS | Autentikasi mahasiswa, enkripsi password, & izin sensor/kamera |

---

## 9. Tim Pengembang

Proyek **CampusFlow** dikembangkan untuk **Techcomfest 2027** oleh:

| Nama | GitHub | Peran | Branch Utama | Tanggung Jawab Utama |
|---|---|---|---|---|
| **Ibra** | `@flyingdutchman` | **Project Leader & Vision AI Engineer** | `main` *(+ kolaborasi `frontend`)* | Kepemimpinan proyek, arsitektur & kontrak `main`, AI Vision MediaPipe (33 Pose + 478 Face Landmarks, kalibrasi 5 detik, heuristik postur & anti-cheat), integrasi PR |
| **Mutiara Dewanda Prisvilla (Tiara)** | `@mutiaradewanda` | **Frontend & PWA Experience Engineer** | `frontend` | Antarmuka React 18 + Tailwind PWA, Triad Dashboard, Active Break UI, Pedometer 3-sumbu, Kuesioner PSS/PSQI, AI Coach UI, Panic Relief Mode |
| **Ahmad Syifa'ul Falakhul Khayyi (Syifa)** | `@syifamojocanggih-hash` | **Backend & LLM Engineer** | `backend` | Server Express TS, Skema Prisma MySQL & 14-day seed, Clinical Scoring (PSS-4/10, PSQI, IPAQ METs), Agentic AI Coach Gemini 2.5 Flash, Web Push VAPID |

---

## 10. Dokumentasi Teknis Terkait

Untuk memahami rincian spesifikasi, kontrak data, batasan wewenang, dan riwayat kerja per anggota tim, baca dokumen berikut:

- 📘 [**Master Design & Aturan Batasan (DESIGN.md)**](DESIGN.md)
- 📑 [**Indeks Dokumentasi Repositori (docs/README.md)**](docs/README.md)
- 📋 [**Product Requirements Document v3.0 (PRD.md)**](docs/universal/PRD.md)
- 🛡️ [**Batas Kerja, Hak Akses & Protokol Fleksibel (BOUNDARIES_AND_CONTRACTS.md)**](docs/universal/BOUNDARIES_AND_CONTRACTS.md)
- 🔌 [**Kontrak Data & API Tunggal (INTERFACES.md)**](docs/universal/INTERFACES.md)
- 🌿 [**Alur 3 Branch & Anti-Konflik (GIT_WORKFLOW.md)**](docs/universal/GIT_WORKFLOW.md)
- 👁️ [**Spesifikasi Vision AI (docs/vision/VISION_SPEC.md)**](docs/vision/VISION_SPEC.md)
- ⚙️ [**Panduan Backend & LLM (docs/backend/README.md)**](docs/backend/README.md)
- 🎨 [**Panduan Frontend & Design System (docs/frontend/DESIGN_SYSTEM.md)**](docs/frontend/DESIGN_SYSTEM.md)
- 📝 **Changelog Per-User:** [Ibra](docs/changelogs/CHANGELOG_IBRA.md) · [Tiara](docs/changelogs/CHANGELOG_TIARA.md) · [Syifa](docs/changelogs/CHANGELOG_SYIFA.md)

---

<p align="center">
  <strong>CampusFlow — Duduk Sehat. Gerak Terukur. Stres Terkendali.</strong><br>
  <em>Smart Lifestyle & Digital Wellbeing (SDG 3) · Techcomfest 2027 Politeknik Negeri Semarang</em>
</p>
