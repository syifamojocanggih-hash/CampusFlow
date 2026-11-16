# PRD_V4_PIVOT_EXPLANATION.md — Analisis Pivot PRD v4.0 & Panduan Dampak Lintas Branch

> **STATUS:** DOKUMEN PANDUAN STRATEGIS & KONTRAK TRANSISI  
> **REFERENSI:** `c:\Users\ASUS\Downloads\PRD_CampusFlow_FINAL_v4_Revisi.docx` (Versi 4.0) vs `docs/universal/PRD.md` (Versi 3.0)  
> **LINGKUP:** Berlaku untuk semua branch (`main`, `backend`, `frontend`)

---

## 1. Latar Belakang & Rasional Pivot (Mengapa PRD Diubah?)

Berdasarkan evaluasi tim, dosen pembimbing, dan simulasi pengujian lapangan terhadap CampusFlow Versi 3.0, teridentifikasi dua tantangan utama:
1. **Isu Privasi & Hambatan Pemantauan Kamera Kontinu (*Continuous Vision*):**
   Pada Versi 3.0, fitur *VisionGuard* mengandalkan kamera webcam laptop yang menyala terus-menerus selama mahasiswa belajar untuk mendeteksi *slouching* dan jarak mata. Hal ini dinilai invasif terhadap privasi, menguras daya baterai laptop, dan membuat pengguna merasa "diawasi".
2. **Kebutuhan Relevansi Akademik & Fusi Parameter Tunggal:**
   Stres mahasiswa tidak semata-mata dipicu oleh kurangnya gerak fisik, melainkan ketidakseimbangan antara **Beban Akademik (Academic Load)**, **Waktu Layar (Screen Time)**, dan **Waktu Pemulihan (Tidur & Jeda Aktif)**. Diperlukan satu metrik tunggal harian yang intuitif yang mengadopsi prinsip *"Strava Akademik"*.

---

## 2. Tiga Revisi Paradigma Utama (Pivot MVP Versi 4.0)

```
┌────────────────────────────────────────────────────────────────────────┐
│                      TIGA REVISI PARADIGMA UTAMA                       │
├────────────────────────────────┬───────────────────────────────────────┤
│ 1. ZERO CONTINUOUS CAMERA      │ Kamera laptop default OFF.            │
│    (Privasi Terjaga Penuh)     │ Hanya menyala MAKSIMAL 2 MENIT saat   │
│                                │ tombol 'Active Break' ditekan untuk   │
│                                │ validasi pose, lalu mati otomatis.    │
├────────────────────────────────┼───────────────────────────────────────┤
│ 2. KONSEP 'STRAVA AKADEMIK'    │ Stres & kelelahan dihitung dari fusi  │
│    & FUSI PARAMETER TUNGGAL    │ 4 variabel: Jam Tidur, Screen Time,   │
│                                │ Jeda Pemulihan, & Academic Load (KRS).│
│                                │ Output: Single Metric 'Burnout Index'.│
├────────────────────────────────┼───────────────────────────────────────┤
│ 3. PREDICTIVE AI COACH         │ Beralih dari respons reaktif menjadi  │
│    (Bukan Sekadar Reaktif)     │ rekomendasi proaktif berbasis jadwal  │
│                                │ kuliah esok hari (misal: Senin malam  │
│                                │ menyarankan tidur lebih awal karena   │
│                                │ jadwal praktikum Selasa padat).       │
└────────────────────────────────┴───────────────────────────────────────┘
```

---

## 3. Tabel Perbandingan Menyeluruh: PRD v3.0 vs PRD v4.0

| Dimensi Sistem | Versi 3.0 (Eksis di Git Saat Ini) | Versi 4.0 (PRD Baru Revisi) |
|---|---|---|
| **Positioning Produk** | *Active Wellbeing & Stress Management PWA* | *Academic Strava & Predictive Burnout Management* |
| **Penggunaan Kamera** | *Continuous stream* memantau postur duduk selama belajar (MediaPipe 33 landmark) | *Zero continuous camera*; kamera *on-demand* maksimal 2 menit saat *Active Break* |
| **Deteksi Screen Time** | Kehadiran tubuh/wajah di depan webcam | Page Visibility API (`document.hidden`) di PC + input Digital Wellbeing di HP |
| **Sensor Pedometer** | Akselerometer smartphone 3-sumbu (IPAQ-SF MET-menit) | Dieliminasi dari MVP inti; smartphone untuk lapor tidur & screen time |
| **Instrumen Stres** | Kuesioner psikometrik PSS-4 harian & PSS-10 mingguan | Ditiadakan; diganti kalkulasi otomatis **Burnout Risk Index (0–100)** |
| **Input Jadwal Kuliah** | Tidak ada | **PDF Schedule Parser via Gemini API** (ekstrak KRS otomatis ke JSON) |
| **Peran Model AI (LLM)** | Ollama Lokal (Chatbot reaktif konsultasi keluhan multi-turn) | Google Gemini API (Parser PDF KRS + AI Coach Prediktif esok hari) |
| **Metrik Utama** | 3 Pilar *24-Hour Movement Guidelines* (MVPA, Tidur, Sedentary) | Satu Indikator Tunggal: **Burnout Risk Index (0–100)** |

---

## 4. Arsitektur Fusi Parameter: Algoritma Burnout Risk Index

CampusFlow v4.0 menyatukan parameter menjadi satu indeks tunggal terpadu:

$$\text{Burnout Risk Index} = (\text{Academic Load Score} + \text{Screen Time Fatigue}) - \text{Recovery Score}$$

### 4.1 Variabel Beban (Load Factors — Peningkat Stres)
1. **Academic Load Score (AL):**
   $$\text{AL} = \sum (\text{SKS} \times \text{Bobot}) + \text{Penalti Ujian}$$
   - Matakuliah Teori = $1.0\text{ poin/SKS}$
   - Matakuliah Praktikum = $1.5\text{ poin/SKS}$
   - Mendekati Ujian ($\le H-7$) = $+3.0\text{ poin ekstra}$
2. **Screen Time Fatigue (ST):**
   $$\text{ST} = \max(0, \text{Total Jam Layar} - 8) \times 2.5$$
   - Batas aman: $8\text{ jam/hari}$
   - Setiap kelebihan 1 jam menambah $2.5\text{ poin penalti kelelahan}$
3. **Sedentary Gap:**
   Waktu layar tanpa diselingi sesi *Active Break* yang terverifikasi kamera.

### 4.2 Variabel Pemulihan (Recovery Factors — Penurun Stres)
1. **Kualitas & Durasi Tidur (SQ):**
   $$\text{Skor Tidur} = \left(\frac{\text{Jam Tidur}}{8}\right) \times 40$$
   - Tidur ideal 7–9 jam memberikan kontribusi hingga 40 poin pemulihan.
2. **Active Break Verified (ABV):**
   $$\text{Skor Active Break} = \text{Jumlah Active Break Terverifikasi} \times 10$$
   - Peregangan 2 menit yang divalidasi oleh MediaPipe Pose secara instan menambah 10 poin pemulihan.

### 4.3 Kategori Burnout Risk Index
- **Hijau ($< 40$):** Aman / Seimbang (*Optimal Balance*)
- **Kuning ($40 - 75$):** Waspada (*Moderate Burnout Risk*)
- **Merah ($> 75$):** Burnout / Kelelahan Tinggi (*High Risk*)

---

## 5. Dampak dan Rencana Penyesuaian per Branch Git

### 5.1 Branch `main` (Leader — Ibra / Universal Foundation)
* **Spesifikasi Kontrak (`docs/universal/`, `shared/contracts/`):**
  - Perbarui tipe data `BurnoutIndexCalculationDTO`, `AcademicScheduleDTO`, dan `ActiveBreakSessionDTO`.
  - Hapus kontrak stream telemetri postur real-time yang tidak lagi diperlukan.
* **Peran MediaPipe (`docs/vision/`):**
  - Sederhanakan *Vision Spec*: Hapus deteksi kemiringan postur continuous (*slouching, eye proximity*).
  - Pusatkan hanya pada modul `ActiveBreakValidator`: validasi 2–3 gerakan peregangan sederhana (contoh: *overhead reach*, putar bahu, tangan terangkat) dengan durasi 2 menit.

### 5.2 Branch `backend` (Syifa — Backend, API, & AI Services)
* **Skema Database Prisma (`backend/prisma/schema.prisma`):**
  - Tambahkan model `AcademicSchedule`:
    ```prisma
    model AcademicSchedule {
      id           String   @id @default(uuid())
      userId       String   @map("user_id")
      dayOfWeek    Int      @map("day_of_week") // 1 = Senin, dst.
      subjectName  String   @map("subject_name")
      creditHours  Float    @map("credit_hours")
      isPracticum  Boolean  @default(false) @map("is_practicum")
      isExamWeek   Boolean  @default(false) @map("is_exam_week")
      createdAt    DateTime @default(now()) @map("created_at")
      user         User     @relation(fields: [userId], references: [id], onDelete: Cascade)
    }
    ```
  - Tambahkan model `DailyFussionLog`:
    ```prisma
    model DailyFussionLog {
      id                  String   @id @default(uuid())
      userId              String   @map("user_id")
      logDate             DateTime @map("log_date")
      totalScreenTimeMins Int      @default(0) @map("total_screen_time_mins")
      sleepHours          Float    @map("sleep_hours")
      academicLoadScore   Float    @map("academic_load_score")
      verifiedBreakCount  Int      @default(0) @map("verified_break_count")
      burnoutIndex        Float    @map("burnout_index")
      status              String   // LOW, MODERATE, HIGH
      user                User     @relation(fields: [userId], references: [id], onDelete: Cascade)
    }
    ```
  - Tambahkan model `ActiveBreakSession`:
    ```prisma
    model ActiveBreakSession {
      id           String   @id @default(uuid())
      userId       String   @map("user_id")
      startTime    DateTime @map("start_time")
      durationMins Float    @map("duration_mins")
      poseVerified Boolean  @default(false) @map("pose_verified")
      poseType     String   @map("pose_type")
      user         User     @relation(fields: [userId], references: [id], onDelete: Cascade)
    }
    ```
* **Endpoint Baru:**
  - `POST /schedule/parse-krs`: Menerima file upload PDF/gambar KRS $\rightarrow$ memanggil Google Gemini API dengan prompt terstruktur $\rightarrow$ menyimpan array matakuliah ke database.
  - `POST /burnout/calculate-today`: Menghitung fusi harian dan menyimpan ke `DailyFussionLog`.
  - `POST /active-break/verify`: Mencatat sesi peregangan tervalidasi.
  - `GET /ai-coach/predictive-forecast`: Mengambil jadwal kuliah esok hari dan memberikan rekomendasi preventif malam ini.

### 5.3 Branch `frontend` (Tiara & Ibra — UI/UX PWA & Sensor)
* **Peralihan Desain ("Academic Strava"):**
  - Desain dashboard bertema metrik beban vs pemulihan (mirip Strava: *Weekly Training Load vs Recovery*).
  - Tampilkan grafik *Burnout Risk Index* dengan status warna (Hijau, Kuning, Merah).
* **Alur KRS Upload:**
  - Halaman Onboarding / Pengaturan dengan *drag-and-drop* file PDF KRS atau silabus jadwal kuliah.
* **Penggantian VisionGuard Continuous dengan Modal Active Break:**
  - Tidak ada lagi video preview kecil webcam di pojok layar saat belajar.
  - Saat tab berjalan $> 90$ menit tanpa henti, muncul notifikasi/alarm jeda.
  - Mahasiswa mengklik "Mulai Active Break 2 Menit" $\rightarrow$ modal popup kamera terbuka dengan overlay skeleton MediaPipe $\rightarrow$ hitung mundur 2 menit $\rightarrow$ skeleton hijau $\rightarrow$ modal tertutup dan kamera otomatis mati.
* **Pelacakan Layar Tanpa Kamera:**
  - Implementasi Page Visibility API (`document.addEventListener("visibilitychange", ...)`) untuk mengakumulasi waktu aktif tab CampusFlow.

---

## 6. Materi Pitching Juri: Smart Campus CCTV Recovery Zone (Roadmap Masa Depan)

Untuk kompetisi Techcomfest 2027, Bagian 06 PRD v4.0 menyajikan konsep inovasi jangka panjang (*Future Work*):
* **Integrasi CCTV Pintar Kampus:** Mahasiswa yang berada di area publik kampus (perpustakaan, lab komputer, gedung bersama) dapat mendatangi *Campus Recovery Zone*.
* **Seamless Validation:** CCTV yang dilengkapi Edge AI MediaPipe mendeteksi gerakan peregangan mahasiswa (diotentikasi via QR Code scan di PWA). Poin pemulihan langsung masuk ke akun PWA tanpa mahasiswa perlu menyalakan kamera pribadi di laptop atau HP.
