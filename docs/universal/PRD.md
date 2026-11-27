# PRD — CampusFlow (Versi 4.0)
## Academic Strava & Predictive Burnout Management Progressive Web Application (PWA)

| Parameter Dokumen | Spesifikasi Teknis & Akademik |
|---|---|
| **Nama Produk / Proyek** | **CampusFlow** — Academic Strava & Predictive Burnout Management PWA |
| **Topik Riset / Tugas Dosen** | Kelola Stres & Keseimbangan Hidup Mahasiswa Berbasis Fusi Parameter dan Jeda Aktif Terverifikasi |
| **Landasan Literatur Utama** | 1) Martín-Rodríguez, A., & González-Prieto, N. (2026). *Influence of physical activity on perceived stress and mental health in university students: a systematic review*. Frontiers in Sports and Active Living, 7:1710832.<br>2) Meijman & Mulder. *Effort-Recovery Model*.<br>3) Albulescu et al. (2022). *Micro-breaks & energy recovery*. PLOS ONE. |
| **Target Kompetisi** | Techcomfest 2027 Politeknik Negeri Semarang — Sub-Tema 3: *Smart Lifestyle & Digital Wellbeing* (SDG 3) |
| **Arsitektur Repositori** | Monorepo (`frontend/` React 18 + Vite PWA, `backend/` Node.js + Express + Prisma ORM, `shared/`) |
| **Mesin AI & Sensor** | 1) MediaPipe Pose Landmarker WASM (*On-Demand*, HANYA 2 menit saat *Active Break*)<br>2) Browser Page Visibility API (`document.hidden`) untuk pelacakan *Screen Time* tanpa kamera<br>3) LLM Wellbeing Coach (`campusflow-coach` berbasis **Gemma 3 4B Fine-Tuned** GGUF via Ollama lokal atau Hugging Face ZeroGPU Space + Fallback Klinis) |
| **Versi Dokumen** | Versi 4.0 — *Engineering Blueprint & Strategic Pivot Release* |

---

## Bagian 01 — Ringkasan Eksekutif & Pivot Paradigma

Mahasiswa rentan mengalami kejenuhan belajar (*academic burnout*) akibat ketidakseimbangan sistemik antara **Beban Perkuliahan (Academic Load)**, **Waktu Layar (Screen Time)**, dan **Waktu Pemulihan (Tidur & Jeda Aktif)**.

CampusFlow beralih dari aplikasi pengingat pasif menjadi **Academic Strava**: platform yang menyatukan seluruh beban belajar dan pemulihan harian ke dalam satu metrik tunggal, **Burnout Risk Index (0–100)**, dengan tetap menjamin privasi pengguna 100% (*Zero Continuous Camera*).

### Tiga Pilar Paradigma Pivot (v4.0)
1. **Zero Continuous Camera (Privasi Terjaga Penuh):**  
   Kamera laptop default OFF. Kamera hanya menyala maksimal 2 menit saat tombol *Active Break* ditekan untuk memverifikasi pose peregangan, lalu langsung mati otomatis.
2. **Konsep 'Strava Akademik' & Burnout Risk Index (0–100):**  
   Fusi 4 parameter terpadu: Durasi Tidur, Waktu Layar (*Page Visibility API*), Jeda Pemulihan, dan Beban Akademik (KRS).
3. **Predictive & Proactive AI Coach:**  
   Beralih dari chatbot reaktif menjadi pendamping proaktif yang memprediksi beban kuliah esok hari dan mengawal keselamatan dengan rujukan krisis (Hotline 119).

---

## Bagian 02 — Formulasi Matematika: Algoritma Burnout Risk Index

Metrik kesimpulan harian tunggal dihitung dengan model *Effort-Recovery*:

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

### 2.1 Parameter Beban (Load Factors)
1. **Academic Load Score (AL):**
   $$\text{AL} = \sum (\text{SKS} \times \text{Bobot}) + \text{Penalti Ujian}$$
   - Mata kuliah teori = $1.0\text{ poin / SKS}$
   - Mata kuliah praktikum/lab = $1.5\text{ poin / SKS}$
   - Pekan menjelang ujian ($\le H-7$) = $+3.0\text{ poin ekstra}$
2. **Screen Time Fatigue (ST):**
   $$\text{ST} = \max(0, \text{Total Jam Layar} - 8.0) \times 2.5$$
   - Batas aman menatap layar: $8\text{ jam/hari}$ (Alshahrani et al., 2025). Setiap kelebihan 1 jam menambah $2.5\text{ poin penalti}$.

### 2.2 Parameter Pemulihan (Recovery Factors)
1. **Durasi Tidur (Sleep Score):**
   $$\text{Skor Tidur} = \min\left(40, \left(\frac{\text{Jam Tidur}}{8.0}\right) \times 40\right)$$
   - Tidur ideal (7–9 jam) memberikan kontribusi hingga 40 poin pemulihan (Allen et al., 2021).
2. **Active Break Terverifikasi (ABV):**
   $$\text{Skor Active Break} = \text{Jumlah Active Break Terverifikasi} \times 10$$
   - Setiap sesi peregangan 2 menit yang divalidasi MediaPipe memberi $+10\text{ poin pemulihan}$ (Albulescu et al., 2022).

---

## Bagian 03 — Fitur Utama CampusFlow v4.0

### 3.1 Smart Academic Planner (PDF KRS Parser)
- Mahasiswa mengunggah file PDF atau screenshot jadwal kuliah/KRS di awal semester.
- Sistem mengekstrak nama mata kuliah, hari, jam, bobot SKS, dan jenis kelas (teori/praktikum) secara otomatis ke dalam database.

### 3.2 Cross-Device Screen Time Tracking
- **Desktop/Laptop:** Melacak durasi fokus layar secara pasif menggunakan **Page Visibility API (`document.hidden`)** saat tab CampusFlow aktif, tanpa webcam.
- **Smartphone:** Sinkronisasi input waktu layar harian dari Digital Wellbeing ponsel.

### 3.3 On-Demand Active Break Validator (MediaPipe 2 Menit)
- **Kamera Default OFF:** Privasi mahasiswa terjaga 100%.
- **Notifikasi Jeda (> 90 Menit):** Mengingatkan mahasiswa untuk istirahat setelah 90 menit belajar terus-menerus.
- **Validasi Pose 2 Menit:** Modal kamera terbuka selama 2 menit. Model MediaPipe Pose mendeteksi gerakan peregangan (*overhead arm reach*, sudut siku $> 140^\circ$). Setelah tervalidasi, $+10\text{ poin}$ ditambahkan dan kamera **langsung mati otomatis**.

### 3.4 Dashboard Strava Akademik (Burnout Risk Index 0–100)
- Menampilkan grafik ritme mingguan beban kuliah vs pemulihan serta riwayat tren 14 hari skor Burnout Risk Index.

### 3.5 Wellbeing AI Coach & Konsultasi Stres Proaktif
- **Mesin Inferensi Fleksibel (Gemma 3 4B Fine-Tuned):** Menggunakan model terkondisi `campusflow-coach` berbasis **Gemma 3 4B Fine-Tuned** (format JSON terstruktur + *clinical guardrails*), yang dapat dijalankan secara lokal via Ollama maupun *cloud* gratis via **Hugging Face ZeroGPU Space** (`KinkSipak/campusflow-api`), dilengkapi **sidebar riwayat obrolan** dan fallback klinis bervariasi.
- **Crisis Gateway:** Otomatis mendeteksi distres berat dan memberikan rujukan nomor darurat (Hotline 119 / healing119.id).
- **Rekomendasi Preventif:** Membaca beban kuliah esok hari untuk menyarankan jam tidur dan waktu jeda malam ini.

### 3.6 Materi Pitching Juri: Smart Campus CCTV Recovery Zone (Roadmap Masa Depan)
- Inovasi jangka panjang Techcomfest 2027: Integrasi area publik kampus (perpus/lab) dengan CCTV berteknologi Edge AI MediaPipe.
- Mahasiswa cukup melakukan peregangan di depan kamera CCTV kampus, dan poin pemulihan masuk ke akun PWA via pemindaian QR code tanpa perlu menyalakan kamera pribadi di laptop.

---

## Bagian 04 — Struktur Database & Endpoint Inti

- **`AcademicSchedule`:** Menyimpan jadwal kuliah dan bobot SKS (`POST /api/academic-schedule/upload`, `POST /api/academic-schedule/confirm`).
- **`DailyFussionLog`:** Catatan fusi parameter kuantitatif harian dan status Burnout Index 0–100 (`POST /api/v1/burnout/calculate`, `GET /api/v1/burnout/today`).
- **`DailyWellbeingLog`:** Log check-in harian telemetri psikometri PSS-4 & kepatuhan 24-Hour Movement Triad (`POST /api/v1/wellbeing/checkin`, `GET /api/v1/wellbeing/today`).
- **`ActiveBreakSession`:** Log sesi peregangan tervalidasi 2 menit MediaPipe (`POST /api/v1/active-break/verify`).
- **`AiCoachingInsight`:** Riwayat konsultasi & rekomendasi AI Coach berbasis Ollama lokal (`POST /api/v1/ai-coach/generate`).
