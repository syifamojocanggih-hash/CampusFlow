# TASK_GUIDE.md — Project Leader & Vision AI (Ibra `@flyingdutchman`)

> **PENANGGUNG JAWAB:** Ibra (`@flyingdutchman`)  
> **BRANCH UTAMA:** `main` *(serta kolaborasi `frontend` bila diperlukan)*  
> **CHANGELOG WAJIB:** [`docs/changelogs/CHANGELOG_IBRA.md`](../changelogs/CHANGELOG_IBRA.md)

---

## 📋 Tugas Kepemimpinan & Arsitektur (`main`)

### 🟢 LEAD-1.1: Sinkronisasi Kontrak Bersama (`shared/contracts/`)
- **Target:** Mendefinisikan tipe TypeScript bersama (`PostureBaseline`, `PostureEvaluationResult`, `ActivityIntensity`, `StressSeverity`, `AiCoachingInsightDTO`) dari [`INTERFACES.md`](../universal/INTERFACES.md) di `shared/contracts/` agar langsung diturunkan ke `backend` dan `frontend`.
- **Checklist:**
  - [x] Kontrak tipe siap dipakai oleh `backend` dan `frontend` tanpa duplikasi definisi (`shared/contracts/index.ts`).

### 🟢 LEAD-1.2: Review PR & Audit `[CROSS-SCOPE]`
- **Checklist:**
  - [ ] Memastikan setiap PR dari `backend` dan `frontend` lolos `guard-check` (`npm run guard`).
  - [ ] Meninjau setiap perubahan `[CROSS-SCOPE]` sebelum merge ke `main`.
  - [ ] Mengumumkan ke Syifa & Tiara setelah `main` diperbarui agar menjalankan `git merge origin/main`.

---

## 📋 Tugas Engineering AI Vision (`main` → diturunkan ke `frontend`)

### 🟢 VIS-1.1: Implementasi Modul Heuristik Kinematika (`poseHeuristics.ts`)
- **Target:** `shared/vision/poseHeuristics.ts` (dan uji unit untuk sudut siku, kalibrasi baseline, slouching, proximity, asymmetric tilt, overhead stretch, dan stand-up).
- **Checklist:**
  - [x] `computePostureBaseline` mengembalikan `null` jika `visibility < 0.6`.
  - [x] `evaluatePostureFrame` akurat membedakan duduk tegak vs membungkuk (`neckRatio < 0.78`).

### 🟢 VIS-1.2: Filter Smoothing EMA ($\alpha = 0.25$) & EAR Kedipan Mata
- **Target:** Menambahkan *Exponential Moving Average* ($\alpha = 0.25$) pada evaluasi 2 Hz (500 ms) agar metrik tidak melonjak akibat noise webcam, serta perhitungan *Eye Aspect Ratio* (EAR) dari `FaceMesh [33, 160, 158, 133, 153, 144]`.
- **Checklist:**
  - [x] Metrik stabil tanpa *flicker* pada toast peringatan postur (`PostureEmaSmoother` & `calcEyeAspectRatio`).

### 🟢 VIS-1.3: Hosting Lokal Bobot Model MediaPipe (`pose_landmarker_lite.task`)
- **Target:** Menyediakan model resmi `pose_landmarker_lite.task` (~5.5 MB) secara lokal di `frontend/public/models/` (atau panduan skrip unduh) agar pemuatan instan tanpa CORS/ketergantungan internet saat demo.
- **Checklist:**
  - [ ] Model berhasil termuat offline melalui Cache Storage Workbox PWA.

### 🟢 VIS-1.4: Integrasi Vision Engine ke `VisionGuard.tsx` & `ActiveBreakModal.tsx`
- **Target:** Kolaborasi bersama Tiara di branch `frontend` (setelah `git merge origin/main`) untuk merender kanvas skeleton pada $\ge 24$ FPS, kalibrasi 5 detik (100 frame), dan `DEMO_MODE` (15 detik pemicu jeda aktif).
- **Checklist:**
  - [ ] Skeleton overlay berubah hijau (`#10B981`) saat *Overhead Arm Stretch* terverifikasi $3\times 5$ detik.
  - [ ] Tidak ada citra/frame webcam yang dikirim ke jaringan.
