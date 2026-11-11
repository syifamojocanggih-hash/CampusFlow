# DOMAIN FRONTEND & PWA — `docs/frontend/`

> **PENANGGUNG JAWAB UTAMA:** **Tiara / Mutiara Dewanda Prisvilla** (`@mutiaradewanda`) — *Frontend & PWA Engineer*  
> **KOLABORATOR VISION UI:** **Ibra** (`@flyingdutchman`) — *Project Leader & Vision AI Engineer*  
> **BRANCH KERJA:** `frontend`  
> **ZONA DEFAULT (R/W):** `frontend/`, `docs/frontend/`  
> **CHANGELOG WAJIB:** [`docs/changelogs/CHANGELOG_TIARA.md`](../changelogs/CHANGELOG_TIARA.md) *(atau [`CHANGELOG_IBRA.md`](../changelogs/CHANGELOG_IBRA.md) saat Ibra ikut mengedit)*

---

## 1. Mandat & Kolaborasi Bebas di Branch `frontend`

Di dalam branch `frontend`:
- **Tiara (`@mutiaradewanda`) dan Ibra (`@flyingdutchman`) bebas berbagi modul kode di folder `frontend/`** tanpa pemisahan direktori kaku di antara keduanya, agar integrasi UI + AI Vision + Pedometer berjalan luwes dan cepat.
- **Satu-satunya syarat pemisahan:** Setiap orang **WAJIB mencatat perubahannya pada file Changelog miliknya sendiri** (`CHANGELOG_TIARA.md` untuk Tiara, `CHANGELOG_IBRA.md` untuk Ibra).

### Tanggung Jawab Utama Frontend
- Membangun aplikasi React 18 + TypeScript + Vite + Tailwind CSS + `vite-plugin-pwa`.
- Menerapkan sistem desain **Calm & Supportif** ([`DESIGN_SYSTEM.md`](DESIGN_SYSTEM.md)).
- Mengimplementasikan 10 layar pengguna ([`PAGES_AND_FLOWS.md`](PAGES_AND_FLOWS.md)): Onboarding/Login, Kalibrasi 5 Detik, Triad Dashboard, VisionGuard, ActiveBreakModal Anti-Cheat, Pedometer 3-Sumbu (`pedometerSensor.ts`), Kuesioner PSS-4/PSS-10/PSQI, AI Coach UI, Exam Panic Button 15 menit, Riwayat, dan Pengaturan.
- Menyediakan **Mock Data** ([`MOCK_DATA.md`](MOCK_DATA.md)) agar UI dapat diuji utuh meski backend sedang tidak menyala.

---

## 2. Aturan Anti-Konflik & Fleksibilitas

1. Seluruh dependensi frontend dipasang di dalam `frontend/` (`cd frontend && npm install`) agar `frontend/package-lock.json` terpisah dari `backend/package-lock.json`.
2. Tarik pembaruan dari `main` (`git merge origin/main`) sebelum memulai sesi agar modul Vision (`shared/vision/`) dan kontrak `INTERFACES.md` selalu mutakhir.
3. Bila mendesak harus mengubah file di luar `frontend/` atau `docs/frontend/`, **diperbolehkan** dengan syarat mencantumkan tag **`[CROSS-SCOPE]`**, path file, dan alasannya di Changelog pribadi.
4. Dilarang menaruh `DATABASE_URL`, `JWT_SECRET`, atau `VAPID_PRIVATE_KEY` di kode frontend (`VITE_*`).

---

## 3. Indeks Dokumen Frontend

1. [`TASK_GUIDE.md`](TASK_GUIDE.md): Peta tugas `FE-1.1` s.d. `FE-5.3`.
2. [`DESIGN_SYSTEM.md`](DESIGN_SYSTEM.md): Palet warna, tipografi, komponen Status Pill, Progress Ring, Toast Halus, & breakpoint.
3. [`PAGES_AND_FLOWS.md`](PAGES_AND_FLOWS.md): Sitemap 10 layar utama, user flow, dan mode fallback.
4. [`UI_COMPONENTS.md`](UI_COMPONENTS.md): Spesifikasi komponen `VisionGuard`, `ActiveBreakModal`, `PedometerCard`, `TriadDashboard`, `PanicReliefMode`, dsb.
5. [`PEDOMETER_SENSOR.md`](PEDOMETER_SENSOR.md): DSP akselerometer 3-sumbu (`DeviceMotionEvent`), iOS permission, HTTPS lokal, & kode `pedometerSensor.ts`.
6. [`MOCK_DATA.md`](MOCK_DATA.md): Fixture JSON offline untuk pengembangan independen.
7. [`SETUP.md`](SETUP.md): Setup Vite, SSL lokal, aset model MediaPipe lokal, dan build PWA.
