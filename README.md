# CampusFlow

> **Academic Strava & Predictive Burnout Management**  
> Progressive Web Application (PWA) lintas perangkat berbasis Fusi Prediktif Beban Akademik & Waktu Layar, *Zero Continuous Camera* (Kamera Insidental 2 Menit), dan *AI Coach* Proaktif.  
> Topik Riset: **Kelola Stres & Keseimbangan Hidup Mahasiswa Berbasis Fusi Parameter dan Jeda Aktif Terverifikasi** · **Techcomfest 2027** · Sub-Tema 3: *Smart Lifestyle & Digital Wellbeing* (SDG 3).

[![Architecture: 3-Branch Monorepo](https://img.shields.io/badge/Architecture-3--Branch%20Monorepo-2563EB.svg)](#7-struktur-monorepo--pembagian-kerja)
[![Privacy: Zero Continuous Camera](https://img.shields.io/badge/Privacy-Zero%20Continuous%20Camera-0EA5A4.svg)](#4-arsitektur-privasi--keamanan-data)
[![Burnout Metric: Unified Fussion Index](https://img.shields.io/badge/Burnout%20Metric-Unified%20Index%200--100-F59E0B.svg)](#2-arsitektur-fusi-parameter--algoritma-burnout-index)
[![AI Coach: Ollama Local JSON](https://img.shields.io/badge/AI%20Coach-Ollama%20Local%20JSON-22C55E.svg)](#35-wellbeing-ai-coach--konsultasi-stres-proaktif)

---

## Daftar Isi
1. [Latar Belakang & Pivot Paradigma MVP (Versi 4.0)](#1-latar-belakang--pivot-paradigma-mvp-versi-40)
2. [Arsitektur Fusi Parameter: Algoritma Burnout Index](#2-arsitektur-fusi-parameter--algoritma-burnout-index)
3. [Fitur Utama](#3-fitur-utama)
   - [Smart Academic Planner (PDF KRS Parser)](#31-smart-academic-planner-pdf-krs-parser)
   - [Cross-Device Screen Time Tracking](#32-cross-device-screen-time-tracking)
   - [On-Demand Active Break Validator (MediaPipe 2 Menit)](#33-on-demand-active-break-validator-mediapipe-2-menit)
   - [Dashboard Strava Akademik (Burnout Risk Index 0–100)](#34-dashboard-strava-akademik-burnout-risk-index-0100)
   - [Wellbeing AI Coach & Konsultasi Stres Proaktif](#35-wellbeing-ai-coach--konsultasi-stres-proaktif)
   - [Materi Pitching Juri: Smart Campus CCTV Recovery Zone](#36-materi-pitching-juri-smart-campus-cctv-recovery-zone)
4. [Arsitektur Privasi & Keamanan Data](#4-arsitektur-privasi--keamanan-data)
5. [Skema Database Produksi (Prisma ORM / MySQL)](#5-skema-database-produksi-prisma-orm--mysql)
6. [Cara Menjalankan di Komputer Lokal](#6-cara-menjalankan-di-komputer-lokal)
7. [Struktur Monorepo & Pembagian Kerja](#7-struktur-monorepo--pembagian-kerja)
8. [Landasan Literatur Ilmiah (5 Tahun Terakhir)](#8-landasan-literatur-ilmiah-5-tahun-terakhir)
9. [Teknologi yang Digunakan](#9-teknologi-yang-digunakan)
10. [Tim Pengembang & Dokumentasi Terkait](#10-tim-pengembang--dokumentasi-terkait)

---

## 1. Latar Belakang & Pivot Paradigma MVP (Versi 4.0)

Mahasiswa rentan mengalami kelelahan belajar (*academic burnout*) dan penurunan kesehatan mental bukan hanya karena kurang berolahraga, melainkan akibat **ketidakseimbangan sistemik** antara **Beban Akademik (Academic Load)**, **Waktu Layar (Screen Time)**, dan **Waktu Pemulihan (Tidur & Jeda Aktif)**.

Berdasarkan evaluasi terhadap versi sebelumnya, CampusFlow melakukan **Pivot Desain Strategis (PRD Versi 4.0)** dengan 3 prinsip utama:

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
│ 3. PROACTIVE AI COACHING       │ AI Coach mendampingi mahasiswa secara │
│    (Analisis Beban Belajar)    │ terstruktur: menganalisis keluhan     │
│                                │ fisik, mitigasi krisis darurat (119), │
│                                │ dan rekomendasi preventif esok hari.  │
└────────────────────────────────┴───────────────────────────────────────┘
```

---

## 2. Arsitektur Fusi Parameter: Algoritma Burnout Index

CampusFlow menghitung metrik kesimpulan harian tunggal yang disebut **Burnout Risk Index (0–100)** yang menggabungkan faktor beban dan faktor pemulihan (*Effort-Recovery Model*, Meijman & Mulder):

$$\text{Burnout Risk Index} = (\text{Academic Load Score} + \text{Screen Time Fatigue}) - \text{Recovery Score}$$

```
   [ FAKTOR BEBAN / PENINGKAT STRES ]                [ FAKTOR PEMULIHAN / PENURUN STRES ]
   • Academic Load Score (Bobot SKS + H-7 Ujian)   • Kualitas & Durasi Tidur ((Jam / 8) * 40)
   • Screen Time Fatigue ((Jam Layar - 8) * 2.5)    • Active Break Terverifikasi (Jumlah * 10)
                                ╲                  ╱
                                 ▼                ▼
                          ┌───────────────────────────────┐
                          │   BURNOUT RISK INDEX (0–100)  │
                          ├───────────────────────────────┤
                          │  Hijau (< 40)   : Aman/Optimal│
                          │  Kuning (40–75) : Waspada     │
                          │  Merah (> 75)   : Risiko Tinggi│
                          └───────────────────────────────┘
```

### 2.1. Formulasi Matematika Parameter
1. **Academic Load Score (AL):**
   $$\text{AL} = \sum (\text{SKS} \times \text{Bobot}) + \text{Penalti Ujian}$$
   - Matakuliah Teori = $1.0\text{ poin/SKS}$
   - Matakuliah Praktikum = $1.5\text{ poin/SKS}$
   - Pekan Menjelang Ujian ($\le H-7$) = $+3.0\text{ poin ekstra}$
2. **Screen Time Fatigue (ST):**
   $$\text{ST} = \max(0, \text{Total Jam Layar} - 8.0) \times 2.5$$
   - Batas aman menatap layar adalah $8\text{ jam/hari}$ (Alshahrani et al., 2025). Setiap kelebihan 1 jam menambah $2.5\text{ poin penalti}$.
3. **Recovery Score (RS):**
   $$\text{RS} = \min\left(40, \left(\frac{\text{Jam Tidur}}{8.0}\right) \times 40\right) + (\text{Active Break Terverifikasi} \times 10)$$
   - Tidur ideal (7–9 jam) berkontribusi hingga 40 poin pemulihan (Allen et al., 2021).
   - Setiap sesi *Active Break 2 Menit* yang lolos verifikasi MediaPipe menambah $10\text{ poin pemulihan}$ (Albulescu et al., 2022).

---

## 3. Fitur Utama

### 3.1. Smart Academic Planner (PDF KRS Parser)
- Mahasiswa mengunggah file PDF atau screenshot KRS/jadwal kuliah pada awal semester.
- Sistem mengekstrak hari, jam, nama matakuliah, bobot SKS, dan jenis kelas (teori/praktikum) ke dalam database MySQL untuk menghitung beban kognitif otomatis setiap harinya.

### 3.2. Cross-Device Screen Time Tracking
- **Desktop/Laptop:** Melacak durasi fokus layar secara pasif menggunakan **Page Visibility API (`document.hidden`) & Focus Events** di browser saat tab CampusFlow aktif, tanpa perlu menyalakan webcam.
- **Smartphone:** Pengguna dapat memasukkan atau menyinkronkan data durasi layar harian dari fitur *Digital Wellbeing* ponsel ke akun cloud yang sama.

### 3.3. On-Demand Active Break Validator (MediaPipe 2 Menit)
- **Kamera Default OFF:** Privasi mahasiswa terlindungi 100%. Kamera tidak menyala selama jam belajar.
- **Notifikasi Jeda (> 90 Menit):** Saat waktu kerja kontinu melampaui batas aman, muncul pengingat istirahat.
- **Validator Pose 2 Menit:** Pengguna menekan *"Mulai Active Break"*, kamera menyala selama 2 menit. Model **MediaPipe Pose** membaca skeleton tubuh (misal: *overhead reach*, peregangan bahu dan leher). Begitu gerakan tervalidasi, poin pemulihan bertambah $+10$ dan kamera otomatis langsung mati.

### 3.4. Dashboard Strava Akademik (Burnout Risk Index 0–100)
- Menampilkan visualisasi ritme mingguan layaknya metrik latihan atlet di Strava: **Beban Mingguan vs Tingkat Pemulihan**.
- Dilengkapi indikator status warna: **Hijau (< 40)**, **Kuning (40–75)**, dan **Merah (> 75)** beserta riwayat tren 14 hari.

### 3.5. Wellbeing AI Coach & Konsultasi Stres Proaktif
- **Mesin Inferensi Lokal (Ollama):** Didukung model AI lokal (`campusflow-coach` berbasis Qwen2.5/Llama) yang berjalan lokal tanpa biaya API eksternal dan menjaga kerahasiaan data mahasiswa.
- **Deteksi Krisis & Safety Guardrail:** Dilengkapi *Crisis Gateway* yang otomatis mengarahkan ke nomor darurat kesehatan mental (Hotline 119 / healing119.id) jika mendeteksi indikasi distres berat atau keputusasaan.
- **Rekomendasi Gerak Deterministik:** Memberikan panduan gerakan peregangan bertahap yang aman dari beban fisiologis dan disesuaikan dengan aturan jam malam ($\ge 21.30\text{ WIB}$).

### 3.6. Materi Pitching Juri: Smart Campus CCTV Recovery Zone
- Inovasi masa depan (*Future Work*) untuk kompetisi Techcomfest 2027: integrasi dengan fasilitas publik kampus (perpustakaan/lab).
- Mahasiswa cukup mendatangi *Campus Recovery Zone* dan melakukan peregangan di depan CCTV kampus yang terpasang Edge AI (MediaPipe). Poin pemulihan masuk ke akun PWA via pemindaian QR code tanpa perlu menyalakan kamera pribadi sama sekali.

---

## 4. Arsitektur Privasi & Keamanan Data

```
[ BROWSER DESKTOP ] ──► Page Visibility API (Screen Time) ────┐
                                                              │
[ WEBCAM INSIDENTAL ] ──► MediaPipe WASM (HANYA 2 MENIT) ─────┼──► [ EXPRESS REST API ] ──► [ MYSQL (PRISMA) ]
                                                              │            │
[ INPUT TIDUR / KRS ] ──► Form Terenkripsi JWT ───────────────┘            ▼
                                                                  [ OLLAMA LOKAL ENGINE ]
```

1. **Zero Continuous Surveillance:** Tidak ada kamera yang menyala berjam-jam saat belajar. Kamera hanya hidup saat verifikasi 2 menit.
2. **Zero Image Upload:** Pemrosesan landmark pose dilakukan 100% di browser pengguna via WebGL/WASM. Citra kamera tidak pernah diunggah ke server.
3. **Privasi AI Lokal:** Percakapan dan keluhan mahasiswa diproses oleh mesin Ollama lokal, tidak bocor ke server AI pihak ketiga.

---

## 5. Skema Database Produksi (Prisma ORM / MySQL)

Tabel inti pada arsitektur CampusFlow v4.0:
- **`User`:** Profil mahasiswa, NIM, email, target recovery score, streak, dan poin XP.
- **`AcademicSchedule`:** Jadwal perkuliahan mingguan hasil parsing KRS (`day_of_week`, `subject_name`, `credit_hours`, `is_practicum`, `is_exam_week`).
- **`DailyFussionLog`:** Catatan fusi parameter harian (`log_date`, `total_screen_time_mins`, `sleep_hours`, `academic_load_score`, `screen_fatigue_score`, `recovery_score`, `verified_break_count`, `burnout_index`, `status`).
- **`ActiveBreakSession`:** Log sesi peregangan kamera 2 menit (`duration_mins`, `pose_verified`, `pose_type`, `start_time`).
- **`AiCoachingInsight`:** Riwayat konsultasi, dominant mediator, dan rencana aksi pemulihan.

---

## 6. Cara Menjalankan di Komputer Lokal

### Prasyarat Sistem
- **Node.js:** Versi `20.x` atau lebih baru
- **Database:** MySQL 8.x
- **Port Tersedia:** Backend (`4000`), Frontend (`5174`)

### Langkah Instalasi

1. **Kloning Repositori:**
   ```bash
   git clone https://github.com/syifamojocanggih-hash/CampusFlow.git
   cd CampusFlow
   ```

2. **Setup Konfigurasi Environment:**
   ```bash
   # Salin template env backend
   cp backend/.env.example backend/.env
   # Salin template env frontend
   cp frontend/.env.example frontend/.env
   ```
   *Pengaturan port default:*
   - Backend: `PORT=4000`
   - Frontend: `port: 5174` (dapat diakses di [http://localhost:5174/](http://localhost:5174/))
   - Backend CORS: Mengizinkan origin `http://localhost:5174`.

3. **Jalankan Database & Migrasi Prisma:**
   ```bash
   npx --prefix backend prisma migrate dev --name init
   npx --prefix backend prisma generate
   ```

4. **Jalankan Aplikasi:**
   ```bash
   # Menjalankan Backend (Port 4000)
   npm run dev:backend

   # Menjalankan Frontend PWA (Port 5174)
   npm run dev:frontend
   ```

5. **Uji Pengujian Otomatis (Unit Tests):**
   ```bash
   npm --prefix backend test    # 82 unit test backend lolos
   npm --prefix frontend test   # 9 unit test frontend lolos
   ```

---

## 7. Struktur Monorepo & Pembagian Kerja

CampusFlow menggunakan monorepo terpadu dengan aturan boundary dan changelog per-user:

```
CampusFlow/
├── README.md                          # Dokumentasi resmi arsitektur produk
├── package.json                       # Skrip helper root monorepo
├── shared/
│   └── contracts/index.ts             # Kontrak data DTO & konstanta klinis bersama
├── backend/                           # Service Express TS, Prisma MySQL, & Ollama AI Coach
│   ├── src/
│   │   ├── routes/                    # schedule, burnout, activeBreak, aiCoach, auth, dll.
│   │   ├── services/                  # burnoutScoring, clinicalScoring, coachShared, dll.
│   │   └── app.ts                     # Express app setup & rate limiting
│   └── prisma/schema.prisma           # Skema MySQL Prisma ORM
├── frontend/                          # Client React 18 + Vite + Tailwind PWA
│   ├── src/
│   │   ├── components/                # TriadDashboard, VisionGuard (ActiveBreak), Navbar, dll.
│   │   └── utils/                     # screenTimeTracker, poseHeuristics, audioFeedback
│   └── vite.config.ts                 # Konfigurasi Vite & PWA Service Worker (Port 5174)
├── docs/
│   ├── universal/                     # PRD v4 Pivot Explanation, Architecture, Git Workflow
│   └── changelogs/                    # Catatan perubahan per anggota (Ibra, Tiara, Syifa)
└── scripts/
    └── guard-check.mjs                # Guard linter integritas commit & scope kerja
```

---

## 8. Landasan Literatur Ilmiah (5 Tahun Terakhir)

Arsitektur CampusFlow v4.0 didasarkan pada studi peer-reviewed terbaru (2021–2026):

1. **Effort-Recovery Model (Dasar Rumus Fusi Beban vs Pemulihan):**
   * *Meijman & Mulder (1998)* / *Sonnentag et al. (2021)* — Pemulihan energi psikologis melalui tidur dan jeda mikro memulihkan sumber daya kognitif dari tuntutan kerja.
2. **Beban Akademik & Burnout Mahasiswa:**
   * *Olson et al. (2023)*, *Frontiers in Public Health* [DOI: 10.3389/fpubh.2023.1118244](https://doi.org/10.3389/fpubh.2023.1118244) — Beban SKS padat dan kurikulum adalah prediktor utama kelelahan emosional mahasiswa.
   * *Andrade et al. (2023)*, *Scientific Reports* [DOI: 10.1038/s41598-023-31852-w](https://doi.org/10.1038/s41598-023-31852-w) — Hubungan linier antara *study overload* dengan sindrom burnout akademik.
3. **Waktu Layar & Kelelahan Digital:**
   * *Alshahrani et al. (2025)*, *Frontiers in Psychiatry* [DOI: 10.3389/fpsyt.2025.1485601](https://doi.org/10.3389/fpsyt.2025.1485601) — Layar $> 8\text{ jam/hari}$ mempercepat kelelahan mental dan mengganggu tidur.
   * *Xu et al. (2025)*, *Frontiers in Psychiatry* [DOI: 10.3389/fpsyt.2025.1528659](https://doi.org/10.3389/fpsyt.2025.1528659) — Ketergantungan layar ponsel memicu *learning burnout* pada mahasiswa.
4. **Jeda Mikro 2–5 Menit (*Active Breaks*):**
   * *Albulescu et al. (2022)*, *PLOS ONE* [DOI: 10.1371/journal.pone.0272460](https://doi.org/10.1371/journal.pone.0272460) — Meta-analisis ($N = 2.335$) membuktikan jeda mikro fisik meningkatkan *vigor* dan menurunkan kelelahan secara instan.
   * *Loh et al. (2023)*, *Work* [DOI: 10.3233/WOR-220528](https://doi.org/10.3233/WOR-220528) — Jeda peregangan singkat efektif mereduksi kelelahan otot saat bekerja di depan laptop.
5. **Tidur Sebagai Restorasi Energi Utama:**
   * *Mu et al. (2024)*, *Frontiers in Psychology* [DOI: 10.3389/fpsyg.2024.1376993](https://doi.org/10.3389/fpsyg.2024.1376993) — Kualitas tidur memediasi pemulihan psikologis dari stres harian.
   * *Allen et al. (2021)*, *Int. J. Behavioral Medicine* [DOI: 10.1007/s12529-020-09942-3](https://doi.org/10.1007/s12529-020-09942-3) — Durasi tidur cukup (7–9 jam) memitigasi eskalasi burnout mahasiswa.
6. **Quantified Self & "Academic Strava":**
   * *Gauthier et al. (2022)*, *Computers in Human Behavior* [DOI: 10.1016/j.chb.2022.107314](https://doi.org/10.1016/j.chb.2022.107314) — Pemantauan diri ritme belajar dan aktivitas fisik meningkatkan regulasi diri mahasiswa.

---

## 9. Teknologi yang Digunakan

| Kategori | Teknologi / Pustaka | Penggunaan Utama |
|---|---|---|
| **Frontend & PWA** | React 18, TypeScript, Vite, Tailwind CSS, `vite-plugin-pwa` | Antarmuka PWA responsif, Service Worker Workbox, port `5174` |
| **Computer Vision (On-Demand)** | `@mediapipe/tasks-vision` (Pose Landmarker WebGL/WASM) | Validasi gerakan peregangan 2 menit saat *Active Break* |
| **Screen Time Monitoring** | Browser Page Visibility API (`document.hidden`) | Pelacakan durasi aktif layar laptop tanpa webcam |
| **Backend & Database** | Node.js, Express, TypeScript, Prisma ORM, MySQL | API REST `/api/v1/*`, scoring Burnout Index, port `4000` |
| **Local LLM Engine** | Ollama Lokal (`campusflow-coach` via Structured JSON) | AI Coach konsultasi keluhan tubuh/stres & mitigasi krisis 119 |
| **Keamanan & Autentikasi** | JWT, `bcryptjs`, Rate Limiting per-akun, Helmet | Keamanan autentikasi dan isolasi akses per mahasiswa |

---

## 10. Tim Pengembang & Dokumentasi Terkait

Proyek **CampusFlow** dikembangkan untuk **Techcomfest 2027** oleh:
* **Ibra** (`@flyingdutchman`) — *Project Leader & Vision AI Engineer* (Branch `main`)
* **Mutiara Dewanda Prisvilla (Tiara)** (`@mutiaradewanda`) — *Frontend & PWA Experience Engineer* (Branch `frontend`)
* **Ahmad Syifa'ul Falakhul Khayyi (Syifa)** (`@syifamojocanggih-hash`) — *Backend & LLM Engineer* (Branch `backend`)

Dokumentasi transisi dan analisis arsitektur lengkap:
* 📄 [**Dokumentasi Pivot PRD v4.0 Lintas Branch (PRD_V4_PIVOT_EXPLANATION.md)**](docs/universal/PRD_V4_PIVOT_EXPLANATION.md)
* 🛡️ [**Changelog Per-User (CHANGELOG_SYIFA.md)**](docs/changelogs/CHANGELOG_SYIFA.md)
* 🔌 [**Kontrak Bersama (shared/contracts/index.ts)**](shared/contracts/index.ts)

---

<p align="center">
  <strong>CampusFlow — Academic Strava & Predictive Burnout Management</strong><br>
  <em>Smart Lifestyle & Digital Wellbeing (SDG 3) · Techcomfest 2027 Politeknik Negeri Semarang</em>
</p>
