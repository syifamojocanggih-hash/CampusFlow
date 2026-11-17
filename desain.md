# Dokumen Desain Sistem & Arsitektur UI/UX — CampusFlow (`desain.md`)

> **STATUS:** DOKUMEN DESAIN UTAMA (MASTER DESIGN SPECIFICATION)  
> **VERSI:** 4.0 (Final Engineering Blueprint & Fresh Pastel Health Design System)  
> **PRODUK:** CampusFlow — *Academic Strava & Predictive Burnout Management*  
> **KOMPETISI & SUB-TEMA:** Techcomfest 2027 · Sub-Tema 3: *Smart Lifestyle & Digital Wellbeing* (SDG 3)  
> **PENANGGUNG JAWAB UTAMA:** Tiara (`@mutiaradewanda` — Frontend & PWA) bersama Ibra (`@flyingdutchman` — Lead & Vision AI) & Syifa (`@syifamojocanggih-hash` — Backend & AI)

---

## Daftar Isi
1. [Ringkasan Eksekutif & Visi Produk](#1-ringkasan-eksekutif--visi-produk)
2. [Filosofi Desain & Fresh Pastel Health Design System](#2-filosofi-desain--fresh-pastel-health-design-system)
3. [Arsitektur Fusi Parameter: Algoritma Burnout Risk Index (0–100)](#3-arsitektur-fusi-parameter-algoritma-burnout-risk-index-0100)
4. [Arsitektur Privasi Data: Prinsip Zero Continuous Camera](#4-arsitektur-privasi-data-prinsip-zero-continuous-camera)
5. [Spesifikasi Halaman & Alur Pengguna (User Journey)](#5-spesifikasi-halaman--alur-pengguna-user-journey)
   - [5.1 Landing Page Terintegrasi (Single-Page Seamless)](#51-landing-page-terintegrasi-single-page-seamless)
   - [5.2 Dashboard Strava Akademik (`TriadDashboard`)](#52-dashboard-strava-akademik-triaddashboard)
   - [5.3 Workstation Belajar & Validator Active Break (`FocusView`)](#53-workstation-belajar--validator-active-break-focusview)
   - [5.4 Wellbeing AI Coach & Crisis Gateway 119 (`CoachView`)](#54-wellbeing-ai-coach--crisis-gateway-119-coachview)
   - [5.5 Atur Profil & Personalisasi Mahasiswa (`ProfileView`)](#55-atur-profil--personalisasi-mahasiswa-profileview)
   - [5.6 Riwayat & Lencana Prestasi (`HistoryView`)](#56-riwayat--lencana-prestasi-historyview)
6. [Maskot Interaktif & Gamifikasi: "Mimi" (Pet Streak & Evolusi)](#6-maskot-interaktif--gamifikasi-mimi-pet-streak--evolusi)
7. [Arsitektur Teknis Frontend, State Management & PWA](#7-arsitektur-teknis-frontend-state-management--pwa)
8. [Standar Kualitas Visual, Aksesibilitas (WCAG AA) & Anti-Slop](#8-standar-kualitas-visual-aksesibilitas-wcag-aa--anti-slop)
9. [Tata Kelola 3-Branch Monorepo & Mekanisme Guard Anti-Konflik](#9-tata-kelola-3-branch-monorepo--mekanisme-guard-anti-konflik)

---

## 1. Ringkasan Eksekutif & Visi Produk

### 1.1 Latar Belakang Masalah
Kelelahan belajar dan penurunan kesehatan mental mahasiswa (*academic burnout*) di perguruan tinggi merupakan fenomena sistemik. Riset membuktikan bahwa burnout tidak semata-mata dipicu oleh kurangnya olahraga, melainkan **ketidakseimbangan kronis** antara:
1. **Beban Akademik Tinggi (*Academic Load*):** SKS perkuliahan, praktikum laboratorium, dan tenggat tugas/ujian.
2. **Paparan Layar Berlebih (*Screen Time Fatigue*):** Rata-rata mahasiswa menatap laptop/HP $> 8\text{ jam/hari}$ yang memicu kelelahan visual dan ketegangan leher/punggung (*forward head posture*).
3. **Defisit Pemulihan Restoratif (*Recovery Deficit*):** Durasi tidur yang minim ($< 6\text{ jam}$) serta jarangnya jeda istirahat aktif selama sesi belajar intensif.

### 1.2 Solusi CampusFlow: Paradigma "Academic Strava"
CampusFlow mengadopsi analogi aplikasi kebugaran terkemuka (*Strava*), namun diterapkan khusus untuk ritme hidup dan produktivitas mahasiswa:
- Memadukan faktor pemicu stres (SKS + Screen Time) dengan faktor pemulihan (Jam Tidur + Jeda Aktif Terverifikasi) menjadi **satu metrik kesimpulan harian tunggal: Burnout Risk Index (skala 0–100)**.
- Menerapkan **Zero Continuous Camera**: kamera laptop default mati 100% dan hanya menyala insidental maksimal 2 menit saat mahasiswa memilih melakukan jeda peregangan (*Active Break*).
- Didampingi oleh **Wellbeing AI Coach** proaktif dengan pengaman krisis darurat (*Crisis Gateway 119*) serta maskot gamifikasi interaktif **Mimi** yang berevolusi sesuai konsistensi kebiasaan sehat pengguna.

---

## 2. Filosofi Desain & Fresh Pastel Health Design System

Desain visual CampusFlow berpegang teguh pada prinsip **Calm, High Trust, & Low Cognitive Load**. Antarmuka menghindari warna merah pekat yang agresif (*alarmist UI*) dan menggantikannya dengan palet pastel lembut yang menenangkan sistem saraf pengguna, namun tetap memiliki kontras tinggi yang memenuhi standar aksesibilitas WCAG AA.

```
┌────────────────────────────────────────────────────────────────────────┐
│               PALET WARNA RESMI: FRESH PASTEL HEALTH                   │
├─────────────────┬──────────┬───────────────────────────────────────────┤
│ Mint Green      │ #CDE8B5  │ Pilar Pemulihan Optimal, Sukses, Verifikasi│
│ Butter Yellow   │ #FFF29A  │ Fokus Belajar, Misi Harian, Status Waspada│
│ Soft Pink/Coral │ #F7A8B0  │ Beban Berat, Warning Halus, Burnout Tinggi │
│ Sky Blue        │ #BDE6F0  │ Ketenangan, Privasi 100% On-Device, Tidur │
│ Dark Slate Text │ #1A1A1A  │ Tipografi Utama Kontras Tinggi (Anti-Gores)│
│ Card Base Clean │ #FAFAFA  │ Latar Kartu Bersih & Lembut (Anti-Glare)   │
│ Border Divider  │ #E8E8E8  │ Garis Batas Halus & Struktur Kartu Bersih │
└─────────────────┴──────────┴───────────────────────────────────────────┘
```

### 2.1 Token Warna & Peran UI

| Nama Token | Nilai Hex | Peran Semantik & Penggunaan |
|---|---|---|
| `color-mint` | `#CDE8B5` | Menandakan skor pemulihan tinggi, status **Aman / Optimal ($< 40$)**, validasi gerakan sukses, serta pilar kebugaran aktif. |
| `color-butter` | `#FFF29A` | Menandakan kartu aksi interaktif cepat (Active Break, Panic Relief), status **Waspada ($40 - 75$)**, dan highlight navigasi aktif. |
| `color-pink` | `#F7A8B0` | Digunakan secara terkendali sebagai indikator beban akademik padat, kurva risiko tinggi ($> 75$), dan tombol tindakan kritis. |
| `color-sky` | `#BDE6F0` | Menandakan parameter jam tidur restoratif, kartu jaminan privasi data, dan header asisten AI Coach. |
| `color-dark` | `#1A1A1A` | Warna teks utama di seluruh aplikasi. Memberikan rasio kontras $\ge 4.5:1$ pada latar belakang pastel putih/terang. |
| `color-muted` | `#9A9A9A` | Sub-label, keterangan unit sensor, dan teks sekunder non-esensial. |

### 2.2 Tipografi & Hierarki Visual
- **Font Heading:** `Poppins` (Font-Weight: `700` Bold / `800` ExtraBold)  
  Memberikan kesan hangat, modern, dan penuh energi positif untuk mahasiswa.
- **Font Body & Sensor:** `Inter` (Font-Weight: `400` Regular / `600` SemiBold / `800` ExtraBold)  
  Menggunakan fitur `font-variant-numeric: tabular-nums` agar angka sensor (timer, skor indeks, SKS, menit) tidak melompat (*layout shift*) saat nilai diperbarui.

---

## 3. Arsitektur Fusi Parameter: Algoritma Burnout Risk Index (0–100)

CampusFlow menerapkan formulasi matematis berbasis **Effort-Recovery Model** (*Meijman & Mulder, 1998; Sonnentag et al., 2021*) yang membandingkan beban usaha kognitif dengan waktu restorasi tubuh:

$$\text{Burnout Risk Index} = (\text{Academic Load Score} + \text{Screen Time Fatigue}) - \text{Recovery Score}$$

```
                [ FAKTOR BEBAN (LOAD) ]                      [ FAKTOR PEMULIHAN (RECOVERY) ]
         ┌──────────────────────────────────┐             ┌──────────────────────────────────┐
         │ • Academic Load (SKS + H-7 Ujian)│             │ • Durasi & Kualitas Tidur (0–40) │
         │ • Screen Time Fatigue (> 8 Jam)  │             │ • Active Break Terverifikasi     │
         └────────────────┬─────────────────┘             └────────────────┬─────────────────┘
                          │                                                │
                          ▼ (+)                                            ▼ (-)
         ┌───────────────────────────────────────────────────────────────────────────────────┐
         │                            BURNOUT RISK INDEX (0–100)                             │
         ├─────────────────────────────────┬─────────────────────────────────────────────────┤
         │ Hijau / Mint (< 40)             │ Optimal / Aman (Keseimbangan Hidup Terjaga)     │
         │ Kuning / Butter (40 – 75)       │ Waspada (Kelelahan Sedang, Butuh Jeda Aktif)   │
         │ Merah / Pink (> 75)             │ Risiko Tinggi (Kelelahan Ekstrem, Wajib Relaks) │
         └─────────────────────────────────┴─────────────────────────────────────────────────┘
```

### 3.1 Rincian Variabel Perhitungan

1. **Academic Load Score (AL):**
   $$\text{AL} = \sum (\text{SKS} \times \text{Bobot}) + \text{Penalti Ujian}$$
   - Mata Kuliah Teori = $1.0\text{ poin per SKS}$.
   - Mata Kuliah Praktikum Lab = $1.5\text{ poin per SKS}$ (beban kognitif + psikomotorik lebih tinggi).
   - Pekan Menjelang Ujian ($\le H-7$) = penalti $+3.0\text{ poin ekstra}$.

2. **Screen Time Fatigue (ST):**
   $$\text{ST} = \max(0, \text{Total Jam Layar Pasif} - 8.0) \times 2.5$$
   - Batas ambang aman paparan layar harian menurut literatur ergonomi adalah $8.0\text{ jam}$ (*Alshahrani et al., 2025*).
   - Setiap kelebihan 1 jam menambah $2.5\text{ poin kelelahan}$ ke dalam indeks.

3. **Recovery Score (RS):**
   $$\text{RS} = \min\left(40, \left(\frac{\text{Jam Tidur}}{8.0}\right) \times 40\right) + (\text{Active Break Terverifikasi} \times 10)$$
   - Jam tidur ideal (7–9 jam) menyumbang hingga $40\text{ poin pemulihan}$ (*Allen et al., 2021*).
   - Setiap 1 sesi *Active Break 2 Menit* yang terverifikasi via MediaPipe Pose menambah $+10\text{ poin pemulihan}$ (*Albulescu et al., 2022*).

Nilai akhir dibatasi (*bounded*) pada rentang $0 \le \text{Index} \le 100$.

---

## 4. Arsitektur Privasi Data: Prinsip Zero Continuous Camera

```
┌────────────────────────────────────────────────────────────────────────────────────────┐
│                     PRINSIP PRIVASI: ZERO CONTINUOUS CAMERA                            │
├────────────────────────────────┬───────────────────────────────────────────────────────┤
│ Saat Belajar & Mengerjakan Tugas│ KAMERA LAPTOP 100% MATI (DEFAULT OFF)                 │
│ (Reading, Coding, Browsing)    │ Durasi layar dilacak pasif via Browser API            │
│                                │ (document.hidden & Focus Events). Bebas rasa diawasi! │
├────────────────────────────────┼───────────────────────────────────────────────────────┤
│ Saat Mengambil Jeda Aktif      │ KAMERA HANYA MENYALA MAKSIMAL 2 MENIT                 │
│ (On-Demand Active Break)       │ Menguji 3 repetisi pose Overhead Arm Stretch via     │
│                                │ MediaPipe Pose WASM lokal. Stream kamera langsung     │
│                                │ dimatikan seketika setelah gerakan tervalidasi.       │
├────────────────────────────────┼───────────────────────────────────────────────────────┤
│ Jaminan Kerahasiaan Data       │ 100% ON-DEVICE PROCESSING (ZERO VIDEO UPLOAD)         │
│ (Privacy Guarantee)            │ Tidak ada satu frame gambar/video pun yang dikirim    │
│                                │ atau disimpan di server/cloud.                        │
└────────────────────────────────┴───────────────────────────────────────────────────────┘
```

---

## 5. Spesifikasi Halaman & Alur Pengguna (User Journey)

Aplikasi terdiri dari struktur halaman modular yang dapat diakses melalui bilah navigasi utama (Desktop Sidebar & Top Header, serta Mobile Navigation Drawer):

### 5.1 Landing Page Terintegrasi (Single-Page Seamless)
- **Struktur Halaman Tunggal:** Mengintegrasikan 4 seksi berurutan (`#home`, `#courses`, `#about`, `#contact`) dalam satu guliran mulus (*smooth scrolling*).
- **Sticky Navbar dengan ScrollSpy:** Navbar atas tetap menempel (*fixed top-0*) dengan efek kaca transparan (`backdrop-blur-md`). Indikator pill kuning aktif otomatis berpindah mengikuti posisi seksi yang sedang dilihat melalui `IntersectionObserver`.
- **Hero Carousel:** Slider 3 judul headline PRD v4.0 (*Academic Strava*, *Zero Continuous Camera*, *Burnout Risk Index*) berganti otomatis setiap 4 detik.
- **Katalog Modul Akademik:** 4 kurikulum kesehatan (*Smart Academic Planner*, *Screen Time Tracking*, *Active Break*, *Wellbeing AI Coach*) dengan filter kategori interaktif.
- **Formulir Kontak & Akordion FAQ:** Pertanyaan seputar privasi webcam, sensor, dan integrasi kampus dijawab tuntas.

### 5.2 Dashboard Strava Akademik (`TriadDashboard`)
Merupakan beranda utama (*Home Hub*) bagi mahasiswa setelah masuk ke dalam aplikasi:
1. **Hero Card Burnout Risk Index (0–100):** Menampilkan indeks risiko kelelahan gabungan real-time dengan kartu visual pastel dan indikator status (Aman/Waspada/Tinggi).
2. **4 Kartu Parameter Fusi Klinis:**
   - *Beban Kuliah (KRS):* Total SKS aktif dan penanda pekan ujian.
   - *Waktu Layar Pasif:* Durasi jam belajar di depan layar laptop hari ini.
   - *Jam Tidur Restoratif:* Input/log durasi tidur semalam.
   - *Active Break Terverifikasi:* Jumlah sesi jeda 2 menit yang telah diselesaikan (+10 poin pemulihan per sesi).
3. **Kartu Pemicu Cepat Jeda Sehat:**
   - *Mulai Active Break 2 Menit:* Membuka validator gerakan peregangan kamera insidental.
   - *Panic Relief 15 Menit:* Mengaktifkan mode latihan napas terpandu dan relaksasi darurat saat cemas menghadapi tugas/ujian.
4. **Smart Academic Planner (Modal Interaktif):**
   - *Tab Dropzone PDF KRS:* Memungkinkan mahasiswa mengunggah berkas PDF KRS resmi dari portal kampus untuk mengekstrak daftar mata kuliah, bobot SKS, dan kategori praktikum secara otomatis.
   - *Tab Input Manual:* Formulir cepat untuk menambahkan mata kuliah mandiri.
5. **Grafik Tren 14 Hari Recharts:** Visualisasi area bertumpuk halus (*stacked area chart*) yang memperbandingkan kurva Burnout Index vs Skor Pemulihan selama 2 pekan terakhir.

### 5.3 Workstation Belajar & Validator Active Break (`FocusView`)
Ruang kerja mahasiswa untuk mempertahankan fokus produktif tanpa distraksi:
1. **Timer Sesi Fokus (Pomodoro 25/50 Menit):** Dilengkapi tombol Mulai, Jeda, dan Reset.
2. **Pelacak Layar Pasif (Page Visibility API):** Menghitung menit fokus hanya saat tab aplikasi terbuka aktif.
3. **Modal Validator Active Break (2 Menit On-Demand):**
   - Menjalankan model MediaPipe PoseLandmarker via WebAssembly di browser pengguna.
   - Menguji pose **Overhead Arm Stretch**: mendeteksi saat posisi kedua pergelangan tangan terangkat di atas bahu dan siku membentuk sudut peregangan ideal ($\ge 140^\circ$).
   - Menyediakan target 3 repetisi dengan umpan balik visual lingkaran progres hijau dan suara chime lembut.
   - Begitu repetisi terpenuhi, skor pemulihan bertambah $+10$ poin dan webcam langsung dimatikan secara instan.

### 5.4 Wellbeing AI Coach & Crisis Gateway 119 (`CoachView`)
Pendamping kesehatan mental dan ergonomi cerdas mahasiswa:
1. **Ringkasan Diagnostik Triad:** Analisis komprehensif terhadap pola tidur semalam, rasio layar, dan beban kuliah hari ini.
2. **Rencana Aksi Sehat & Jeda Aktif Hari Ini:** Saran substitusi isotemporal terukur (misal: jalan santai 20 menit atau 2x jeda aktif untuk mengimbangi 5 jam duduk kuliah).
3. **Crisis Gateway 119:** Deteksi proaktif terhadap kata kunci distres berat (misal: *"putus asa"*, *"tidak sanggup lagi"*, *"ingin menyerah"*). Saat terpicu, sistem langsung menampilkan banner bantuan darurat resmi **Hotline Krisis 119 Extension 8** (*healing119.id*) secara jelas dan empatik.
4. **Konsultasi Cepat AI Coach:** Obrolan berbasis LLM lokal teroptimasi dengan aturan jam malam ($\ge 21.30\text{ WIB}$) yang menyarankan mahasiswa mematikan perangkat dan memprioritaskan tidur.

### 5.5 Atur Profil & Personalisasi Mahasiswa (`ProfileView`)
1. **Identitas Akademik:** Pengaturan Nama Lengkap, NIM, Email, Program Studi, dan Semester aktif.
2. **Kustomisasi Avatar Pastel:** Pilihan palet warna latar profil pastel (Soft Pink `#F7A8B0`, Sky Blue `#BDE6F0`, Mint Green `#CDE8B5`, Butter Yellow `#FFF29A`, Lavender `#C9B3E6`).
3. **Target Gaya Hidup:** Slider interaktif untuk target durasi tidur ideal, jeda fokus layar, dan target kebugaran harian.

### 5.6 Riwayat & Lencana Prestasi (`HistoryView`)
1. **Akumulasi XP & Streak Konsistensi:** Menampilkan total poin dan hari beruntun mahasiswa menjaga keseimbangan hidup sehat.
2. **Lencana Pencapaian (Badges):** Koleksi lencana gamifikasi atas ketuntasan misi peregangan, target tidur tercapai, dan manajemen pekan ujian yang sehat.
3. **Log Riwayat Aktivitas Harian:** Rekapitulasi tabel data 7–14 hari ke belakang.

---

## 6. Maskot Interaktif & Gamifikasi: "Mimi" (Pet Streak & Evolusi)

Sebagai daya tarik retensi dan pemecah kejenuhan belajar mahasiswa, CampusFlow menyematkan maskot virtual interaktif bernama **Mimi**:

```
┌────────────────────────────────────────────────────────────────────────┐
│                   TAHAP EVOLUSI MASKOT "MIMI"                          │
├────────────────────┬──────────────┬────────────────────────────────────┤
│ 1. Telur Sehat     │ Streak 0–2   │ Telur bertotol hijau mint dengan   │
│    (Egg Stage)     │ Hari         │ animasi bergoyang lembut.          │
├────────────────────┼──────────────┼────────────────────────────────────┤
│ 2. Mimi Bayi       │ Streak 3–6   │ Anak kucing/makhluk mungil bertelinga│
│    (Baby Stage)    │ Hari         │ pita kuning, ekspresi riang.       │
├────────────────────┼──────────────┼────────────────────────────────────┤
│ 3. Mimi Remaja     │ Streak 7–13  │ Tumbuh dengan ransel kuliah dan    │
│    (Teen Stage)    │ Hari         │ headphone relaksasi.               │
├────────────────────┼──────────────┼────────────────────────────────────┤
│ 4. Mimi Juara      │ Streak 14+   │ Memakai jubah prestasi & mahkota   │
│    (Master Champion│ Hari         │ daun emas simbol juara seimbang.   │
└────────────────────┴──────────────┴────────────────────────────────────┘
```

### 6.1 Fitur Kunci Komponen Mimi (`MimiPetWidget.tsx`)
1. **Widget Mengambang Bebas (*Draggable & Floating*):**
   - Posisi default di sudut kanan bawah layar, mengambang di atas konten (`z-index: 40`).
   - Dapat digeser (*drag-and-drop*) ke titik mana pun di layar baik di desktop (mouse) maupun mobile (touch) dengan penahan batas layar (*screen boundary clamping*) agar tidak hilang keluar layar.
2. **Kustomisasi Nama Maskot:**
   - Mahasiswa dapat menamai maskot mereka sendiri secara personal melalui tombol pensil edit.
   - Nama tersimpan secara persisten di `localStorage` peramban.
3. **Umpan Balik Audio Synthesizer (Web Audio API):**
   - Interaksi klik pada Mimi memicu suara lembut sintetis (*happy chime / purr sound*) tanpa memerlukan file audio MP3 eksternal yang berat.
4. **Lembar Koleksi Evolusi Mimi (*Evolution Showcase Sheet*):**
   - Kartu modal interaktif yang memperlihatkan keempat wujud transformasi Mimi beserta status terbuka/terkunci sesuai jumlah hari streak belajar aktif mahasiswa.

---

## 7. Arsitektur Teknis Frontend, State Management & PWA

### 7.1 Tech Stack Frontend
- **Framework Utama:** React 18 (TypeScript) + Vite 5.
- **Styling & Desain Token:** Tailwind CSS v3.4 dengan plugin animasi halus `tailwindcss-animate`.
- **Ikonografi:** `lucide-react` (100% vektor SVG open-source, ringan, dan seragam).
- **Visualisasi Data:** `recharts` (Responsive SVG Area Charts untuk tren 14 hari).
- **Vision Engine On-Device:** `@mediapipe/tasks-vision` v0.10.14 (PoseLandmarker WebAssembly).
- **PWA Runtime:** `vite-plugin-pwa` v0.20.5 didukung `workbox` Service Worker untuk caching offline dan instalasi ke layar utama (*Add to Home Screen*).

### 7.2 Diagram Arsitektur Komponen Frontend

```
                                  ┌───────────────────────────┐
                                  │          App.tsx          │
                                  │ (Router & Global State)   │
                                  └─────────────┬─────────────┘
                                                │
         ┌───────────────────┬──────────────────┼───────────────────┬───────────────────┐
         ▼                   ▼                  ▼                   ▼                   ▼
┌─────────────────┐ ┌─────────────────┐ ┌───────────────┐ ┌─────────────────┐ ┌─────────────────┐
│   Navbar.tsx    │ │ TriadDashboard  │ │   FocusView   │ │    CoachView    │ │  MimiPetWidget  │
│(Header & Sidebar│ │(Burnout Hero &  │ │(Timer Pomodoro│ │(Diagnosa & 119  │ │ (Draggable Pet  │
│ Navigation)     │ │ Academic Strava)│ │ Active Break) │ │ AI Assistant)   │ │  Evolution)     │
└─────────────────┘ └────────┬────────┘ └───────┬───────┘ └─────────────────┘ └─────────────────┘
                             │                  │
                             ▼                  ▼
                    ┌─────────────────┐┌─────────────────┐
                    │  KrsParserModal ││ ActiveBreakModal│
                    │(PDF Dropzone &  ││ (MediaPipe Pose │
                    │ SKS Form Input) ││ 2-Min Validator)│
                    └─────────────────┘└─────────────────┘
```

---

## 8. Standar Kualitas Visual, Aksesibilitas (WCAG AA) & Anti-Slop

Mengikuti pedoman kualitas ketat repositori, pengembangan UI menerapkan standar:

1. **Anti-Slop Interaction Rules:**
   - **Dilarang keras menggunakan upward hover jump animations** seperti `hover:-translate-y-1` atau `hover:scale-105` pada kartu metrik atau tombol karena menimbulkan efek getar visual dan memicu kelelahan mata.
   - Interaksi hover dibatasi pada transisi latar belakang lembut (`transition-colors duration-200`) atau penebalan border tipis (`hover:border-[#9A9A9A]`).
2. **Keterbacaan & Kontras (WCAG 2.1 Level AA):**
   - Teks gelap `#1A1A1A` memiliki rasio kontras $\ge 8.2:1$ pada kartu putih dan $\ge 5.4:1$ pada kartu Butter Yellow `#FFF29A` dan Mint Green `#CDE8B5`.
3. **Penyajian Data Berbasis Kebutuhan (No Unnecessary Badges):**
   - Menghilangkan badge pill teknis yang tidak esensial bagi pengguna awam (seperti badge nama model AI, badge API teknis, dll.) untuk menjaga kesederhanaan informasi.

---

## 9. Tata Kelola 3-Branch Monorepo & Mekanisme Guard Anti-Konflik

Untuk memastikan kolaborasi multi-pengembang berjalan mulus tanpa tabrakan *merge conflict*, repositori CampusFlow dikelola dengan sistem partisi kerja terisolasi:

```
                         ┌─────────────────────────────────────┐
                         │                main                 │
                         │  Project Leader & Vision AI: Ibra   │
                         │         (@flyingdutchman)           │
                         │                                     │
                         │  • Fondasi Master (README, desain)  │
                         │  • Kontrak Universal & PRD          │
                         │  • Script Guard & CI/CD GitHub      │
                         └──────────────┬───────────┬──────────┘
                      diturunkan ke     │           │    diturunkan ke
                     (git merge main)   ▼           ▼   (git merge main)
                   ┌────────────────────────┐   ┌────────────────────────┐
                   │        backend         │   │        frontend        │
                   │  Backend & LLM: Syifa  │   │  Frontend & PWA: Tiara │
                   │ (@syifamojocanggih-hash│   │ (@mutiaradewanda)      │
                   │                        │   │                        │
                   │ • backend/*            │   │ • frontend/*           │
                   │ • docs/backend/*       │   │ • docs/frontend/*      │
                   │ • CHANGELOG_SYIFA.md   │   │ • CHANGELOG_TIARA.md   │
                   └────────────┬───────────┘   └───────────┬────────────┘
                                │         Pull Request      │
                                └──────────────►◄───────────┘
                                         Integrasi ke main
                                       (Zero-Conflict Merge)
```

### 9.1 Mekanisme Pemeriksaan Otomatis (`scripts/guard-check.mjs`)
- Dijalankan secara otomatis sebelum push (`git pre-push hook`) dan pada pull request GitHub Actions.
- **Aturan Changelog Pribadi:** Setiap commit wajib mencatat ringkasan perubahan di file changelog pribadi (`docs/changelogs/CHANGELOG_TIARA.md` untuk branch `frontend`).
- **Aturan Cross-Scope:** Jika terdapat pengubahan file di luar direktori default branch, sistem wajib menyertakan tag `[CROSS-SCOPE]` beserta alasan teknisnya di dalam changelog pribadi untuk memverifikasi akuntabilitas kolaborasi tim.

---

*Dokumen `desain.md` ini disahkan sebagai cetak biru resmi rancangan arsitektur dan sistem desain CampusFlow untuk implementasi monorepo, tinjauan juri Techcomfest 2027, dan keberlanjutan pengembangan platform.*
