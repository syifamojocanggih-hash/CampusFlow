# PRD — CampusFlow (Versi 3.0)
## AI-Driven Active Wellbeing & Stress Management Progressive Web Application (PWA)

| Parameter Dokumen | Spesifikasi Teknis & Akademik |
|---|---|
| **Nama Produk / Proyek** | **CampusFlow** — Active Wellbeing & Stress Management PWA |
| **Topik Riset / Tugas Dosen** | Kelola Stres Melalui *Physical Activity* Berbasis Aplikasi PWA pada Mahasiswa |
| **Landasan Literatur Utama** | Martín-Rodríguez, A., & González-Prieto, N. (2026). *Influence of physical activity on perceived stress and mental health in university students: a systematic review*. Frontiers in Sports and Active Living, 7:1710832. (PROSPERO: CRD420251179614) |
| **Target Kompetisi** | Techcomfest 2027 Politeknik Negeri Semarang — Sub-Tema 3: *Smart Lifestyle & Digital Wellbeing* (SDG 3) |
| **Arsitektur Repositori** | Monorepo (`frontend/` React + Vite PWA & `backend/` Node.js + Express + Prisma ORM + `shared/`) sesuai Bab G.7 Rulebook |
| **Mesin AI & Sensor** | 1) MediaPipe Tasks Vision (33 Pose Landmarks + 478 Face Landmarks via WebGL/WASM)<br>2) HTML5 `DeviceMotionEvent` (3-Axis Accelerometer Peak Detection)<br>3) Google Gemini API (`gemini-2.5-flash` Structured JSON Coaching) |
| **Versi Dokumen** | Versi 3.0 — *Engineering Blueprint & Complete Application Building Guide* |

---

## Bagian 01 — Ringkasan Eksekutif & Arsitektur Konseptual

CampusFlow adalah Progressive Web Application (PWA) lintas perangkat (laptop dan smartphone) yang dirancang untuk menurunkan stres akademik (*perceived stress*) dan kelelahan kuliah (*school burnout*) pada mahasiswa melalui intervensi perilaku gerak aktif dan pengurangan waktu duduk statis (*sedentary behavior*).

| Dimensi Sistem | Aplikasi Pengingat / Alarm Biasa | Arsitektur CampusFlow PWA (Versi 3.0) |
|---|---|---|
| **Deteksi Waktu Duduk** | Timer hitung mundur pasif (pengguna tetap bisa duduk membungkuk saat timer habis). | Deteksi kehadiran dan kemiringan postur tubuh real-time via webcam laptop menggunakan MediaPipe Pose Landmarker (33 titik sendi). |
| **Validasi Jeda Aktif** | Tombol *Snooze* atau *Dismiss* yang mudah dimatikan tanpa beranjak dari kursi. | **Pose-Verified Anti-Cheat Break:** Layar terkunci hingga kamera memverifikasi 3 gerakan peregangan fisik & berdiri melalui koordinat $(x, y, z)$ tubuh. |
| **Pencatatan Aktivitas Fisik** | Input teks manual yang subjektif dan rawan lupa. | Kuantifikasi otomatis via Web Sensor API (Accelerometer 3-sumbu) yang mengonversi frekuensi langkah (*cadence*) menjadi satuan klinis MET-menit/minggu (IPAQ-SF). |
| **Pendekatan Penurunan Stres** | Hanya menyuruh olahraga tanpa memedulikan jam tidur atau durasi layar. | Pendekatan Sinergis **24-Hour Movement Guidelines**: Menggabungkan MVPA + Kualitas Tidur (PSQI) + Pembatasan *Sedentary Time* ($\text{OR} = 3.4\times$ proteksi depresi). |
| **Umpan Balik Kesehatan** | Notifikasi teks statis yang repetitif. | Analisis multivariat oleh Agentic AI Coach (`gemini-2.5-flash`) yang memetakan korelasi skor PSS-4/PSS-10 terhadap defisit tidur dan defisit gerak. |

---

## Bagian 02 — Pemetaan Bukti Klinis Jurnal Menjadi Konstanta Algoritma

| Referensi Studi pada Jurnal | Temuan Klinis & Nilai Statistik | Konstanta Kode & Aturan Logika di CampusFlow |
|---|---|---|
| **Barbosa et al. (2024)** *(n = 8.650)* | Duduk $\ge 9$ jam/hari meningkatkan risiko kecemasan ($\text{OR} = 1.37$) dan depresi ($\text{OR} = 1.61$). Melakukan $< 25$ menit MVPA per jam duduk meningkatkan risiko depresi ($\text{OR} = 1.74$). | • `MAX_SAFE_SEDENTARY_HOURS = 9.0`<br>• `TARGET_MVPA_PER_SEDENTARY_HOUR = 25`<br>• Jika duduk harian $> 6$ jam dan rasio MVPA/jam duduk $< 25$, status risiko = `HIGH_SEDENTARY_RISK`. |
| **Su et al. (2022)** *(n = 1.475)* | Analisis substitusi isotemporal (CoDA): Mengganti 5–15 menit waktu duduk dengan MVPA menurunkan skor depresi sebesar $-0.13$ poin PHQ-9 per 15 menit. | • `ISOTEMPORAL_WORK_BOUT_MINS = 50`<br>• `ISOTEMPORAL_BREAK_MINS = 10` (rentang 5–15 menit)<br>• Setiap 50 menit duduk kontinu wajib disubstitusi 5–15 menit gerakan terverifikasi kamera. |
| **Zhang et al. (2024) & Lin et al. (2024)** *(n = 3.535)* | Gagal memenuhi ketiga pilar *24-Hour Movement Guidelines* meningkatkan risiko depresi $3.4\times$ lipat ($\text{OR} = 3.4, p < 0.001$). | • `TRIAD_PILLAR_1_MVPA_MINS = 30`<br>• `TRIAD_PILLAR_2_SLEEP_HOURS = [7.0, 9.0]`<br>• `TRIAD_PILLAR_3_MAX_SCREENTIME = 8.0`<br>• Skor kepatuhan harian: 0, 1, 2, atau 3 pilar. |
| **Ai et al. (2021) & Elliott et al. (2022)** *(n = 3.531)* | Latihan penguatan otot (*Muscle-Strengthening Exercise / MSE*) $\ge 2$ hari/minggu dan Vigorous PA menurunkan gejala depresi ($\beta = -0.17, p = 0.015$). | • `WEEKLY_MSE_TARGET_DAYS = 2`<br>• `WEEKLY_TOTAL_METS_TARGET = 1500` (MET-menit/minggu)<br>• Pelacak khusus latihan beban/kalistenik mingguan minimal 2 sesi. |
| **Wu & Zhou (2024)** *(RCT)* | Satu sesi latihan aerobik akut intensitas sedang selama 15–30 menit secara instan menurunkan kecemasan ujian (*test anxiety*) dan meningkatkan Frontal Alpha Asymmetry (FAA). | • `ACUTE_RELIEF_AEROBIC_MINS = 15`<br>• Fitur **Exam Panic Button** memandu latihan kardio/aerobik di tempat selama 15 menit pada target laju langkah 110–125 BPM. |
| **Mu et al. (2024) & Wang et al. (2025)** *(n = 30.817)* | Kualitas tidur (PSQI) memediasi ~41% efek aktivitas fisik terhadap penurunan depresi. Resiliensi psikologis (Li et al., 2021) memediasi ~50% penurunan emosi negatif. | • `SLEEP_MEDIATION_WEIGHT = 0.41`<br>• Jika skor stres tinggi DAN kualitas tidur buruk ($< 6$ jam), AI Coach memprioritaskan aerobik sore hari (3–4 jam sebelum tidur). |

---

## Bagian 03 — Panduan Teknis Computer Vision & Heuristik Matematis

> **Prinsip Utama Vision Engine:** *Zero Image Dataset Training*. Menggunakan model pre-trained Google MediaPipe (`@mediapipe/tasks-vision`) langsung di browser (WebGL/WASM) tanpa mengunggah citra ke server.

### 3.1 Indeks Landmark Wajib
- `Pose [0]` (`NOSE`): acuan tinggi kepala & verifikasi *Overhead Reach*.
- `Pose [7, 8]` (`LEFT_EAR`, `RIGHT_EAR`): vektor leher (*Neck-Torso Angle*).
- `Pose [11, 12]` (`LEFT_SHOULDER`, `RIGHT_SHOULDER`): lebar bahu (estimasi jarak ke layar), kemiringan bahu, tinggi duduk.
- `Pose [13, 14]` (`LEFT_ELBOW`, `RIGHT_ELBOW`): verifikasi pelurusan lengan saat peregangan.
- `Pose [15, 16]` (`LEFT_WRIST`, `RIGHT_WRIST`): verifikasi angkat tangan dan peregangan samping.
- `Pose [23, 24]` (`LEFT_HIP`, `RIGHT_HIP`): vektor batang tubuh (*torso*) & verifikasi berdiri dari kursi.
- `FaceMesh [33, 160, 158, 133, 153, 144]` (`LEFT_EYE_CONTOUR`): rumus *Eye Aspect Ratio* (EAR) untuk kelelahan mata.

### 3.2 Kalibrasi Baseline 5 Detik (100 Frame)
Mengumpulkan rata-rata duduk tegak unik setiap pengguna:
- $W_{base} = \sqrt{(x_{11} - x_{12})^2 + (y_{11} - y_{12})^2}$
- $Y_{sh\_base} = (y_{11} + y_{12}) / 2$
- $D_{neck\_base} = \max(0.05,\; Y_{sh\_base} - (y_7 + y_8)/2)$
- $\theta_{base}$ = sudut antara vektor Pinggul→Bahu dan Bahu→Telinga.

### 3.3 Ambang Batas Real-Time (Evaluasi 2 Hz, EMA $\alpha = 0.25$)
1. **Slouching:** $R_{neck} = (Y_{sh\_curr} - Y_{ear\_curr}) / D_{neck\_base} < 0.78$ atau $\Delta\theta > 15^\circ$ (atau turunnya bahu $> 0.08$) bertahan $\ge 180$ detik.
2. **Eye-Strain Proximity:** $R_{depth} = W_{curr} / W_{base} \ge 1.28$ bertahan $\ge 60$ detik.
3. **Asymmetric Leaning:** $\theta_{roll} = \arctan2(|y_{11}-y_{12}|, |x_{11}-x_{12}|) \cdot 180/\pi > 12.0^\circ$ bertahan $\ge 120$ detik.
4. **Prolonged Sedentary Bout:** $\text{Var}(X_{sh}, Y_{sh}) < 0.015$ dengan `visibility(11, 12) > 0.65` selama $\ge 50$ menit tanpa jeda $\ge 3$ menit.
5. **Overhead Arm Stretch:** $y_{15} < y_0$ dan $y_{16} < y_0$ dan sudut siku $> 140^\circ\text{–}145^\circ$ selama 5 detik $\times 3$ repetisi.
6. **Stand-Up & Step-Away:** $Y_{sh\_curr} < Y_{sh\_base} - 0.20$ ATAU `visibility(0, 11, 12) < 0.25` selama minimal 5 menit (15 detik pada `DEMO_MODE`).

*(Implementasi rujukan lengkap berada di [`docs/vision/VISION_SPEC.md`](../vision/VISION_SPEC.md)).*

---

## Bagian 04 — Pemrosesan Sinyal Sensor Smartphone & Kalkulasi METs (IPAQ-SF)

1. **Magnitudo Vektor 3D:** $a_{mag}(t) = \sqrt{a_x^2 + a_y^2 + a_z^2}$.
2. **High-Pass Filter (25 sampel):** $a_{net}(t) = a_{mag}(t) - \text{mean}(a_{mag}[t-25 : t])$.
3. **Anti-Shake Filter:** Puncak $a_{net}(t) > 1.35\text{ m/s}^2$, jeda antarlangkah $250\text{–}1200\text{ ms}$ ($50\text{–}240\text{ SPM}$), minimal 6 langkah berturut-turut.
4. **Konversi METs IPAQ-SF:**
   - *Walking* ($60\text{–}99\text{ SPM}$): $3.3 \times \text{durasi\_menit}$
   - *Moderate PA* ($100\text{–}129\text{ SPM}$): $4.0 \times \text{durasi\_menit}$
   - *Vigorous PA* ($\ge 130\text{ SPM}$): $8.0 \times \text{durasi\_menit}$
   - *Muscle-Strengthening Exercise (MSE)*: $5.0\text{ METs}$ + target $\ge 2$ hari/minggu.

*(Implementasi rujukan lengkap berada di [`docs/frontend/PEDOMETER_SENSOR.md`](../frontend/PEDOMETER_SENSOR.md)).*

---

## Bagian 05 — Instrumen Kuesioner Klinis & Rubrik Skoring (PSS-4, PSS-10, PSQI)

- **PSS-4 Harian (0–16):** Skala Likert 0–4. Item **Q1 & Q4** dijumlahkan langsung; item **Q2 & Q3** wajib di-*reverse score* ($4 - x$). Cutoff $\ge 8$ = Stres Tinggi (Moriarty et al., 2021).
- **PSS-10 Mingguan (0–40):** Item negatif **1, 2, 3, 6, 9, 10** skor langsung; item positif **4, 5, 7, 8** *reverse score* ($4 - x$). Kategori: 0–13 Rendah, 14–26 Sedang, 27–40 Berat.
- **Kualitas Tidur (Adaptasi PSQI):** Memenuhi Guideline jika $7.0 \le \text{sleep\_hours} \le 9.0$ dan skor kesegaran pagi $\ge 3$ (skala 1–5).

*(Rincian butir pertanyaan dan fungsi backend ada di [`docs/backend/CLINICAL_SCORING.md`](../backend/CLINICAL_SCORING.md)).*

---

## Bagian 06 — Struktur Monorepo & Konfigurasi PWA

Struktur direktori mengikuti aturan Bab G.7 Rulebook Techcomfest 2027 dalam satu repositori GitHub terpadu (`shared/`, `backend/`, `frontend/`, `docs/`, `scripts/`). Lihat [`ARCHITECTURE.md`](ARCHITECTURE.md) dan [`GIT_WORKFLOW.md`](GIT_WORKFLOW.md).

---

## Bagian 07 — Skema Database Produksi (Prisma ORM / MySQL)

Enam model inti: `User`, `SedentarySession`, `PhysicalActivity`, `DailyWellbeingLog`, `ClinicalAssessment`, dan `AiCoachingInsight` dengan enum `ActivityIntensity`, `DataSource`, dan `StressSeverity`. Spesifikasi Prisma utuh tersedia di [`docs/backend/DATABASE_SCHEMA.md`](../backend/DATABASE_SCHEMA.md).

---

## Bagian 08 — Orkestrasi Agentic Wellbeing AI Coach (Google Gemini API)

Backend menggunakan `@google/genai` model `gemini-2.5-flash` dengan `responseMimeType: "application/json"` dan `responseSchema` ketat yang mengembalikan `dominantMediator`, `diagnosisSummary`, `isotemporalActionPlan`, `recommendedMetsToday`, dan `scientificCitationNote`. Spesifikasi lengkap tersedia di [`docs/backend/LLM_AI_COACH.md`](../backend/LLM_AI_COACH.md).

---

## Bagian 09 — Panduan Pembangunan 5 Tahap (Build Guide)

1. **Tahap 1:** Inisialisasi Monorepo, Prisma MySQL, dan seeder 14 hari akun demo.
2. **Tahap 2:** Integrasi MediaPipe Vision di Browser + `pose_landmarker_lite.task` lokal ($\ge 24$ FPS).
3. **Tahap 3:** Implementasi Pedometer 3-Sumbu + HTTPS lokal (`@vitejs/plugin-basic-ssl` / `cloudflared`) + `DeviceMotionEvent.requestPermission()` iOS.
4. **Tahap 4:** Service Worker `vite-plugin-pwa` (`autoUpdate`, cache `.task`) + Web Push VAPID.
5. **Tahap 5:** Skenario Demo Juri (`demo@campusflow.id`, data 14 hari, toggle `DEMO_MODE = true` mempercepat 50 menit menjadi 15 detik).

---

## Bagian 10–18 — Narasi Dampak, Sitemap 10 Layar, UI/UX, Deployment, Fallback, Kepatuhan Bab G, Privasi, & Video Demo

- **10 Layar Sitemap & Responsivitas:** Dijabarkan lengkap di [`docs/frontend/PAGES_AND_FLOWS.md`](../frontend/PAGES_AND_FLOWS.md) dan [`docs/frontend/DESIGN_SYSTEM.md`](../frontend/DESIGN_SYSTEM.md).
- **Rencana Hosting:** Frontend di Vercel/Netlify (HTTPS wajib untuk kamera & sensor), Backend di Railway/Render, Database di Railway MySQL / PlanetScale.
- **Fallback Non-Fungsional:** Penolakan izin kamera, perangkat desktop tanpa akselerometer, offline cache LocalStorage/IndexedDB, dan serving lokal file `.task` MediaPipe.
- **Kepatuhan Bab G Rulebook:** Orisinalitas karya, aset ikon `lucide-react` & Google Fonts `Poppins`/`Inter` bebas lisensi, transparansi pemanfaatan AI dalam coding (Bab G.6), dan privasi citra webcam 100% *on-device*.
- **Skrip Video Demo (3–4 menit):** 0:00–0:30 Masalah → 0:30–1:15 Onboarding & Kalibrasi → 1:15–2:15 Vision Guard & Active Break → 2:15–2:50 Pedometer HP Nyata & PSS-4 → 2:50–3:30 Triad Dashboard & AI Coach → 3:30–4:00 Penutup.
