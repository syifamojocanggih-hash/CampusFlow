# DOMAIN FRONTEND & PWA — `docs/frontend/` (PRD v4.0)

> **PENANGGUNG JAWAB UTAMA:** **Tiara / Mutiara Dewanda Prisvilla** (`@mutiaradewanda`) — *Frontend & PWA Engineer*  
> **KOLABORATOR VISION UI:** **Ibra** (`@flyingdutchman`) — *Project Leader & Vision AI Engineer*  
> **BRANCH KERJA:** `frontend`  
> **ZONA DEFAULT (R/W):** `frontend/`, `docs/frontend/`  
> **CHANGELOG WAJIB:** [`docs/changelogs/CHANGELOG_TIARA.md`](../changelogs/CHANGELOG_TIARA.md) *(atau [`CHANGELOG_IBRA.md`](../changelogs/CHANGELOG_IBRA.md) saat Ibra ikut mengedit)*

---

## 1. Mandat & Ruang Lingkup Frontend (PRD v4.0)

Tiara bersama Ibra bertanggung jawab membangun antarmuka pengguna **Academic Strava PWA** yang responsif, privat, dan bernilai guna tinggi bagi mahasiswa:

- **Aplikasi React 18 + TypeScript + Vite + Tailwind CSS + PWA:**
  - Desain antarmuka bertema **Calm & Supportif** dengan palet warna pastel yang ramah pengguna.
- **Fitur Utama Antarmuka PRD v4.0:**
  1. **Dashboard Strava Akademik:**
     - Grafik perbandingan Beban Belajar Mingguan vs Tingkat Pemulihan (*Weekly Load vs Recovery*).
     - Indikator tunggal **Burnout Risk Index (0–100)** dengan kode warna Hijau (<40), Kuning (40–75), dan Merah (>75).
  2. **Modal Active Break 2 Menit (Zero Continuous Camera):**
     - Tidak ada kamera webcam yang menyala selama belajar.
     - Setelah belajar >90 menit, muncul notifikasi jeda. Pengguna menekan *"Mulai Active Break"* $\rightarrow$ modal popup kamera terbuka dengan overlay skeleton MediaPipe selama 2 menit $\rightarrow$ jika lolos, poin pemulihan $+10$ bertambah dan kamera **langsung mati otomatis**.
  3. **Screen Time Tracker Pasif (`screenTimeTracker.ts`):**
     - Melacak durasi aktif tab CampusFlow menggunakan browser **Page Visibility API (`document.hidden`)** tanpa memerlukan webcam.
  4. **Smart Academic Planner (Upload KRS):**
     - Antarmuka drag-and-drop file PDF/gambar KRS untuk ekstraksi jadwal dan bobot SKS.
  5. **Wellbeing AI Coach UI:**
     - Tampilan diagnosis kebugaran, rencana aksi jeda aktif, konsultasi interaktif tanya coach, dan tombol klaim misi harian (+50 XP).
  6. **Panic Relief Mode 60 Detik:**
     - Latihan pernapasan rileks 4-7-8 untuk meredakan ketegangan mendadak.
- **Mode Mock Offline (`VITE_USE_MOCK=true`):**
  - Menyediakan fallback data lokal lengkap ([`MOCK_DATA.md`](MOCK_DATA.md)) sehingga seluruh fitur antarmuka dapat didemokan secara utuh tanpa ketergantungan pada koneksi backend.

---

## 2. Aturan Anti-Konflik & Fleksibilitas

1. Seluruh dependensi frontend dipasang di dalam `frontend/` (`cd frontend && npm install`) agar `frontend/package-lock.json` terpisah dari `backend/package-lock.json`.
2. Tarik pembaruan dari `main` (`git merge origin/main`) sebelum memulai sesi agar modul Vision (`shared/vision/`) dan kontrak data selalu mutakhir.
3. Bila mendesak harus mengubah file di luar `frontend/` atau `docs/frontend/`, **diperbolehkan** dengan syarat mencantumkan tag **`[CROSS-SCOPE]`**, path file, dan alasannya di Changelog pribadi.
4. Dilarang menaruh `DATABASE_URL`, `JWT_SECRET`, atau secret server di kode frontend (`VITE_*`).

---

## 3. Indeks Dokumen Frontend

1. [`TASK_GUIDE.md`](TASK_GUIDE.md): Peta tugas `FE-1.1` s.d. `FE-5.3`.
2. [`DESIGN_SYSTEM.md`](DESIGN_SYSTEM.md): Palet warna pastel, tipografi, komponen Status Pill, dan Progress Ring.
3. [`PAGES_AND_FLOWS.md`](PAGES_AND_FLOWS.md): Sitemap layar utama (Dashboard Strava, Active Break Modal, Smart Planner KRS, AI Coach).
4. [`UI_COMPONENTS.md`](UI_COMPONENTS.md): Spesifikasi komponen React dan state antarmuka.
5. [`PEDOMETER_SENSOR.md`](PEDOMETER_SENSOR.md): Integrasi sensor gerak HP dan pencatatan jam tidur.
6. [`MOCK_DATA.md`](MOCK_DATA.md): Fixture JSON offline untuk pengembangan independen.
7. [`SETUP.md`](SETUP.md): Panduan setup Vite, SSL lokal, aset MediaPipe lokal, dan build PWA.
