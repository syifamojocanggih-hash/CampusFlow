# TASK_GUIDE.md — Frontend & PWA Engineer (Tiara `@mutiaradewanda` + kolaborasi Ibra `@flyingdutchman`)

> **PENANGGUNG JAWAB:** Tiara (`@mutiaradewanda`) *(dibantu Ibra `@flyingdutchman` untuk integrasi Vision)*  
> **BRANCH KERJA:** `frontend`  
> **CHANGELOG WAJIB:** [`CHANGELOG_TIARA.md`](../changelogs/CHANGELOG_TIARA.md) / [`CHANGELOG_IBRA.md`](../changelogs/CHANGELOG_IBRA.md)

---

## 📋 Daftar Tugas Implementasi

### TAHAP 1: Fondasi React + Vite + Tailwind + PWA

#### 🟢 FE-1.1: Inisialisasi Proyek & Konfigurasi Design Tokens
- **Target:** `frontend/package.json`, `frontend/vite.config.ts`, `frontend/tailwind.config.js`, `frontend/public/manifest.webmanifest`.
- **Paket Wajib:** `react`, `react-dom`, `react-router-dom`, `@mediapipe/tasks-vision`, `lucide-react`, `recharts`, `vite-plugin-pwa`, `@vitejs/plugin-basic-ssl` *(dev untuk HTTPS test HP)*.
- **Checklist:**
  - [ ] `Poppins` (heading) & `Inter` (body) termuat rapi.
  - [ ] Workbox `vite-plugin-pwa` aktif dengan `registerType: 'autoUpdate'` dan caching untuk `pose_landmarker_lite.task`.

#### 🟢 FE-1.2: Layer API Client & Mode Mock Independen
- **Target:** `frontend/src/lib/api.ts`, `frontend/src/mocks/campusflowMock.ts` (mengacu [`MOCK_DATA.md`](MOCK_DATA.md)).
- **Checklist:**
  - [ ] Toggle `VITE_USE_MOCK=true/false` memungkinkan seluruh 10 layar dijalankan saat backend mati.

---

### TAHAP 2: Layar Inti Mahasiswa & Onboarding

#### 🟢 FE-2.1: Onboarding, Login & Akun Demo Juri
- **Checklist:**
  - [ ] Form registrasi (NIM, Nama, Email, Jurusan), login standar, plus tombol **Masuk Akun Demo (`demo@campusflow.id`)**.
  - [ ] Modal persetujuan eksplisit (*consent*) sebelum mengaktifkan kamera atau sensor gerak.

#### 🟢 FE-2.2: Triad Dashboard & Riwayat Statistik
- **Target:** `frontend/src/components/TriadDashboard.tsx`, halaman Riwayat & Pengaturan.
- **Checklist:**
  - [ ] Menampilkan 3 kartu pilar (Menit Duduk, Langkah/MET, Skor Stres PSS-4) dengan *Status Pill* (`Optimal`/`Waspada`/`Tinggi`).
  - [ ] Grafik tren Recharts 7/14 hari (lazy-loaded).
  - [ ] Toggle tersembunyi / Pengaturan `DEMO_MODE` (mempercepat batas duduk 50 menit → 15 detik).

---

### TAHAP 3: Integrasi Sensor HP & Kuesioner Klinis

#### 🟢 FE-3.1: `pedometerSensor.ts` & `PedometerCard.tsx`
- **Target:** `frontend/src/utils/pedometerSensor.ts`, `frontend/src/components/PedometerCard.tsx`.
- **Checklist:**
  - [ ] Mendukung `DeviceMotionEvent.requestPermission()` pada iOS Safari di dalam klik tombol *"Aktifkan Pelacak Langkah"*.
  - [ ] Progress Ring menampilkan target MET harian & laju langkah (SPM) real-time.
  - [ ] Menyediakan fallback form input aktivitas manual (termasuk pilihan *Muscle-Strengthening Exercise*) bila dibuka di laptop/desktop tanpa akselerometer.

#### 🟢 FE-3.2: Kuesioner Harian (PSS-4 + PSQI) & Mingguan (PSS-10)
- **Checklist:**
  - [ ] Form PSS-4 selesai < 30 detik + input jam tidur, latensi tidur, dan skor kesegaran (1–5).
  - [ ] Form PSS-10 mingguan 10 butir.

---

### TAHAP 4: Integrasi Vision Guard (Kolaborasi Tiara + Ibra) & AI Coach UI

#### 🟢 FE-4.1: `VisionGuard.tsx` & `ActiveBreakModal.tsx`
- **Checklist:**
  - [ ] Kalibrasi 5 detik (100 frame) berjalan lancar sebelum sesi belajar.
  - [ ] Peringatan postur muncul sebagai *border* lembut + *toast* kecil (tidak memblokir fokus).
  - [ ] **ActiveBreakModal** mengunci layar saat duduk melampaui batas hingga 3 repetisi *Overhead Arm Stretch* + berdiri terverifikasi kamera.
  - [ ] Di layar mobile `< 640px` atau saat izin kamera ditolak, `VisionGuard` disembunyikan secara anggun tanpa error.

#### 🟢 FE-4.2: AI Coach UI & `PanicReliefMode.tsx`
- **Checklist:**
  - [ ] Panel AI Coach menampilkan `dominantMediator`, `diagnosisSummary`, `isotemporalActionPlan`, target MET, dan `scientificCitationNote` + tombol *"Tandai Selesai (+XP)"*.
  - [ ] **Exam Panic Button** meluncurkan `PanicReliefMode.tsx` berdurasi 15 menit (panduan ritme langkah 110–125 BPM).

---

### TAHAP 5: Ketahanan Offline, Push Subscription, & Audit Akhir

#### 🟢 FE-5.1: Offline Sync Queue & Web Push Subscription
- **Checklist:**
  - [ ] Data sesi saat offline tersimpan di LocalStorage/IndexedDB dan terkirim saat online kembali.
  - [ ] Audit Google Lighthouse PWA lolos (*Install App* muncul) dan FCP < 2.5 detik.
  - [ ] Seluruh perubahan tercatat di `CHANGELOG_TIARA.md` / `CHANGELOG_IBRA.md` dan lolos `npm run guard`.
