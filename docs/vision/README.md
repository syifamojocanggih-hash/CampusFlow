# DOMAIN VISION AI & PROJECT LEADERSHIP — `docs/vision/`

> **PENANGGUNG JAWAB:** **Ibra** (`@flyingdutchman`) — *Project Leader & Vision AI Engineer*  
> **BRANCH UTAMA:** `main` *(diturunkan ke `frontend` dan `backend` melalui `git merge origin/main`)*  
> **AREA KERJA DEFAULT:** `shared/vision/`, `docs/vision/`, `docs/universal/`, file root  
> **CHANGELOG WAJIB:** [`docs/changelogs/CHANGELOG_IBRA.md`](../changelogs/CHANGELOG_IBRA.md)

---

## 1. Mandat & Ruang Lingkup Kerja Ibra

Sebagai **Project Leader & Vision AI Engineer**, Ibra memegang dua peran strategis:
1. **Arsitektur & Pemeliharaan `main`:** Menjaga *Single Source of Truth* (`README.md`, `DESIGN.md`, `INTERFACES.md`), meninjau Pull Request dari `backend` dan `frontend`, serta mengawasi catatan `[CROSS-SCOPE]`.
2. **Pengembangan Modul AI Vision (On-Device MediaPipe):**
   - Menyiapkan dan mengoptimalkan modul kinematika postur (`poseHeuristics.ts`) berbasis `@mediapipe/tasks-vision` (33 Pose Landmarks + 478 Face Landmarks).
   - Mengimplementasikan protokol **Kalibrasi Baseline 5 Detik (100 Frame)** serta **EMA smoothing ($\alpha = 0.25$)** agar deteksi postur akurat pada beragam tinggi badan & sudut webcam laptop.
   - Menyediakan logika verifikasi anti-cheat **Active Break** (*Overhead Arm Stretch* $3\times 5$ detik + *Stand-Up / Step-Away*).
   - Mengintegrasikan modul Vision ke komponen `VisionGuard.tsx` dan `ActiveBreakModal.tsx` bersama Tiara di branch `frontend` bila diperlukan.

---

## 2. Alur Penurunan Modul Vision (`main` → `frontend`)

1. Ibra merancang dan memperbarui spesifikasi/kode inti Vision di `main` (`shared/vision/` dan `docs/vision/`).
2. Setelah di-commit ke `main`, branch `frontend` menarik perubahan via `git merge origin/main` tanpa konflik.
3. Bila Ibra langsung menyunting UI `frontend/` di branch `frontend`, Ibra mencatat perubahan di `docs/changelogs/CHANGELOG_IBRA.md` (dan memastikan sudah sinkron dengan `main` terlebih dahulu agar tidak terjadi bentrok pada `CHANGELOG_IBRA.md`).

---

## 3. Indeks Dokumen Vision

- [`VISION_SPEC.md`](VISION_SPEC.md): Spesifikasi lengkap indeks landmark, rumus geometri trigonometri, ambang batas 2 Hz, Eye Aspect Ratio (EAR), dan kode produksi `poseHeuristics.ts`.
- [`TASK_GUIDE.md`](TASK_GUIDE.md): Daftar tugas bertahap Project Leader (`LEAD-1.x`) dan Vision AI (`VIS-1.x`).
