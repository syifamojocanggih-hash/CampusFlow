# DOMAIN VISION AI & PROJECT LEADERSHIP — `docs/vision/` (PRD v4.0)

> **PENANGGUNG JAWAB:** **Ibra** (`@flyingdutchman`) — *Project Leader & Vision AI Engineer*  
> **BRANCH UTAMA:** `main` *(diturunkan ke `frontend` dan `backend` melalui `git merge origin/main`)*  
> **AREA KERJA DEFAULT:** `shared/vision/`, `docs/vision/`, `docs/universal/`, file root  
> **CHANGELOG WAJIB:** [`docs/changelogs/CHANGELOG_IBRA.md`](../changelogs/CHANGELOG_IBRA.md)

---

## 1. Mandat & Ruang Lingkup Kerja Ibra (PRD v4.0)

Sebagai **Project Leader & Vision AI Engineer**, Ibra memegang dua peran strategis:

### 1.1 Arsitektur & Tata Kelola `main`
- Menjaga *Single Source of Truth* arsitektur monorepo ([`README.md`](../../README.md), [`DESIGN.md`](../../DESIGN.md), [`docs/universal/`](../universal/)).
- Mengawal keselarasan spesifikasi teknis terhadap **PRD Versi 4.0** (*Zero Continuous Camera, Academic Strava, & Predictive Burnout Management*).
- Meninjau *Pull Request* dari branch `backend` dan `frontend` serta memastikan kepatuhan Changelog per-user.

### 1.2 On-Demand ActiveBreakValidator (MediaPipe 2 Menit)
Sesuai paradigma privasi PRD v4.0, **kamera webcam laptop tidak lagi menyala terus-menerus (*zero continuous camera*)**. Modul Vision dipusatkan pada **ActiveBreakValidator**:
- **Kamera On-Demand Maksimal 2 Menit:** Kamera HANYA menyala saat pengguna menekan tombol *"Mulai Active Break"* untuk jeda peregangan fisik.
- **Deteksi Pose Peregangan:** Menggunakan Google MediaPipe Pose Landmarker WASM (33 titik sendi) yang dievaluasi langsung di browser secara 100% lokal (*zero image upload*).
- **Validasi Gerakan Peregangan:**
  - *Overhead Arm Stretch:* Pergelangan tangan di atas hidung ($y_{wrist} < y_{nose}$) dan sudut kedua siku lurus ($> 140^\circ$).
  - Begitu gerakan tervalidasi selama repetisi target, poin pemulihan ($+10\text{ poin}$) dicatat dan kamera **langsung mati otomatis**.
- **Inovasi Masa Depan (Smart Campus CCTV Recovery Zone):**
  - Menyiapkan materi pitching juri Techcomfest 2027: Integrasi area publik kampus (perpus/lab) dengan CCTV berteknologi Edge AI MediaPipe untuk validasi peregangan via pemindaian QR code tanpa kamera pribadi.

---

## 2. Alur Penurunan Modul Vision (`main` → `frontend`)

1. Ibra merancang spesifikasi dan memelihara algoritma inti Vision di `main` (`shared/vision/` dan `docs/vision/`).
2. Setelah di-commit ke `main`, branch `frontend` menarik perubahan via `git merge origin/main`.
3. Kolaborasi integrasi antarmuka Vision ke `frontend/` dilakukan bersama Tiara di branch `frontend` dengan pencatatan rapi di Changelog pribadi.

---

## 3. Indeks Dokumen Vision

- [`VISION_SPEC.md`](VISION_SPEC.md): Rumus geometri trigonometri sendi, ambang batas pose, dan implementasi kode `poseHeuristics.ts`.
- [`TASK_GUIDE.md`](TASK_GUIDE.md): Daftar tugas Project Leader (`LEAD-1.x`) dan Vision AI (`VIS-1.x`).
