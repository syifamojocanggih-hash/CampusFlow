# ROADMAP.md — Peta Jalan Pembangunan CampusFlow

---

## Tahap 1 — Fondasi Monorepo, Kontrak, & Database (Hari 1)
- [x] Inisialisasi repositori 3 branch (`main`, `backend`, `frontend`) + guard changelog per user (`Ibra`).
- [ ] Setup `backend/` Express + TypeScript + Prisma schema 6 tabel MySQL + seeder 14 hari akun demo (`Syifa`).
- [ ] Setup `frontend/` React 18 + Vite + Tailwind CSS + `vite-plugin-pwa` dasar (`Tiara`).

## Tahap 2 — Mesin AI Vision (`main`) & Clinical Scoring + LLM (`backend`) (Hari 2–3)
- [ ] Implementasi `poseHeuristics.ts`, kalibrasi baseline 5 detik, dan pengunduhan `pose_landmarker_lite.task` lokal (`Ibra` di `main`, diturunkan ke `frontend`).
- [ ] Implementasi endpoint Auth JWT, `clinicalScoring.ts` (PSS-4/10, PSQI, IPAQ METs, Triad), dan `geminiCoach.ts` (`Syifa` di `backend`).

## Tahap 3 — Antarmuka PWA, Sensor Pedometer, & Integrasi (Hari 4–5)
- [ ] Bangun `VisionGuard.tsx`, `ActiveBreakModal.tsx`, `TriadDashboard.tsx`, `PedometerCard.tsx` (`pedometerSensor.ts`), `PanicReliefMode.tsx`, dan form kuesioner (`Tiara` + `Ibra` di `frontend`).
- [ ] Aktifkan HTTPS lokal (`@vitejs/plugin-basic-ssl` / tunnel) untuk uji sensor akselerometer pada smartphone asli.
- [ ] Konfigurasi Web Push Notification VAPID & offline storage fallback.

## Tahap 4 — Integrasi Penuh ke `main` & Uji Juri (Hari 6)
- [ ] PR `backend` → `main` dan `frontend` → `main` dengan `npm run guard` hijau.
- [ ] Verifikasi `DEMO_MODE = true` (15 detik active break trigger), audit Lighthouse PWA, dan deploy Vercel + Railway/Render.

## Tahap 5 — Video Demo & Finalisasi Submission Techcomfest 2027 (Hari 7)
- [ ] Rekam video demo 3–4 menit (laptop webcam + smartphone asli) sesuai Bagian 18 PRD.
- [ ] Finalisasi `README.md`, pengecekan kepatuhan Bab G Rulebook, dan rilis tag `v1.0.0` di `main`.
