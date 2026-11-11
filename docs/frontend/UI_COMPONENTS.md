# UI_COMPONENTS.md — Katalog Komponen Antarmuka CampusFlow

> **PENANGGUNG JAWAB:** Tiara (`@mutiaradewanda` + kolaborasi Ibra `@flyingdutchman`) — branch `frontend`

---

## 1. `VisionGuard.tsx`
- **Lokasi:** `frontend/src/components/VisionGuard.tsx`
- **Fungsi:** Menjalankan webcam (`getUserMedia`) + model lokal MediaPipe `pose_landmarker_lite.task`, menggambar overlay skeleton di `<canvas>`, menjalankan mode **Kalibrasi 5 Detik (100 frame)**, serta memantau postur pada 2 Hz dengan `poseHeuristics.ts`.
- **State Kunci:** `isCalibrating`, `baseline`, `slouchDurationSec`, `sedentaryElapsedSec`, `demoMode` (15 detik vs 50 menit).
- **UI Feedback:** Border kuning lembut + toast kecil saat `isSlouching`, `isTooClose`, atau `isLeaningAsymmetric`.

## 2. `ActiveBreakModal.tsx`
- **Lokasi:** `frontend/src/components/ActiveBreakModal.tsx`
- **Fungsi:** Overlay layar penuh tanpa tombol *Dismiss/Snooze* yang aktif saat `sedentaryElapsedSec` melampaui ambang.
- **Tahap Verifikasi Anti-Cheat:**
  1. **Gerakan 1 (*Overhead Arm Stretch*):** Menahan `isOverheadStretchValid` selama 5 detik × 3 repetisi (skeleton berubah hijau `#10B981`).
  2. **Gerakan 2 (*Stand-Up & Step-Away*):** Memverifikasi `isStandingUp` atau subjek meninggalkan kursi.
- **Output:** Memanggil `POST /api/v1/sedentary/sessions` (`breakCompleted: true`) dan mereset timer sesi.

## 3. `PedometerCard.tsx`
- **Lokasi:** `frontend/src/components/PedometerCard.tsx`
- **Fungsi:** Menampilkan *Progress Ring* pencapaian MET mingguan/harian, tombol *"Aktifkan Pelacak Langkah"* (memicu `DeviceMotionEvent.requestPermission()` di iOS), penghitung langkah, *cadence* (`SPM`), serta form *Manual / MSE Log* saat sensor tidak tersedia.

## 4. `TriadDashboard.tsx`
- **Lokasi:** `frontend/src/components/TriadDashboard.tsx`
- **Fungsi:** Menampilkan 3 kartu pilar *24-Hour Movement* (Duduk Statis, Gerak Aktif/MVPA + MSE, Tidur & Stres PSS-4), *Status Pill* (`Optimal`/`Waspada`/`Tinggi`), grafik tren Recharts 14 hari (lazy-loaded), serta akses cepat ke **Exam Panic Button**.

## 5. `PanicReliefMode.tsx`
- **Lokasi:** `frontend/src/components/PanicReliefMode.tsx`
- **Fungsi:** Panduan latihan aerobik akut di tempat selama **15 menit** (`ACUTE_RELIEF_AEROBIC_MINS = 15`) dengan indikator ritme **110–125 BPM** (berbasis RCT Wu & Zhou, 2024) untuk menurunkan kecemasan ujian secara instan.
- **Output:** Menyimpan aktivitas bertipe `ACUTE_AEROBIC_RELIEF` (`5.0 METs`).

## 6. `QuestionnaireForm.tsx` & `AiCoachPanel.tsx`
- **`QuestionnaireForm.tsx`:** Switch tab antara **Check-in Harian** (PSS-4 + jam tidur, latensi, kesegaran, durasi layar non-akademik) dan **Asesmen Mingguan** (PSS-10).
- **`AiCoachPanel.tsx`:** Menampilkan kartu diagnosis dari `POST /api/v1/ai-coach/generate` dengan badge `dominantMediator`, kotak `isotemporalActionPlan`, target `recommendedMetsToday`, catatan sitasi ilmiah `scientificCitationNote`, dan tombol *"Selesaikan Misi (+50 XP)"*.
