# Changelog — Ibra (`@flyingdutchman`)

> **Peran:** Project Leader & Vision AI Engineer  
> **Branch Kerja:** `main` (arsitektur utama, kontrak universal, modul AI Vision) & kolaborasi `frontend`  
> **Aturan:** Hanya Ibra yang mengisi file ini. Jika mengubah file di luar zona default (`shared/`, `docs/universal/`, `docs/vision/`, atau `frontend/`), sertakan tag `[CROSS-SCOPE]` dan path file.

---

## [2026-11-11] — Inisialisasi Fondasi Repositori, Design System, & Dokumentasi Multi-User (Branch: `main`)
- **ID Tugas / Referensi:** `LEAD-0.1`, `VIS-0.1`
- **Ringkasan:** Menyiapkan struktur dokumentasi lengkap (`README.md`, `DESIGN.md`, `docs/universal/`, `docs/vision/`, `docs/backend/`, `docs/frontend/`, `docs/changelogs/`), konfigurasi 3-branch (`main`, `backend`, `frontend`), serta mekanisme guard changelog terpisah per user (`scripts/guard-check.mjs`, `scripts/guard-check.sh`, `.githooks/pre-push`, `.github/workflows/guard-check.yml`).
- **Daftar File Diubah:**
  - `README.md`, `DESIGN.md`, `package.json`, `.gitignore`, `.gitattributes`
  - `scripts/guard-check.mjs`, `scripts/guard-check.sh`, `.githooks/pre-push`, `.github/*`
  - `docs/*` dan `shared/README.md`
- **Verifikasi:** Struktur branch `main`, `backend`, dan `frontend` terbentuk dari basis `main` yang bersih.

---

<!-- Tambahkan entri baru Ibra di bawah garis ini (urutan terbaru di atas) -->

## [2026-11-25] — Rangkuman Fitur Backend, Sinkronisasi Penuh MySQL, & Kompatibilitas Lintas OS/Browser (Branch: `backend`)
- **ID Tugas / Referensi:** `BE-DB-SYNC-4.1`, `BE-CROSS-OS-100`
- **Ringkasan (Bahasa Sederhana):**
  Seluruh fitur backend CampusFlow kini berjalan penuh, dinamis, terhubung langsung ke database MySQL, dan siap dipakai di semua OS (Windows, Linux, macOS, Android, iOS) serta semua browser:
  1. **Login, Register, & Profil User:** Daftar akun (tolak email duplikat), login JWT aman (tidak bikin akun baru saat salah ketik email), edit profil, ganti password, simpan kalibrasi postur kamera, dan hapus data pribadi.
  2. **Upload & Baca KRS Otomatis:** Upload jadwal kuliah (PDF, gambar, atau teks), dibaca otomatis oleh Gemini AI (dengan cadangan pembaca lokal jika offline), bisa di-preview dulu sebelum disimpan ke MySQL, dan langsung menghitung ulang skor stres harian.
  3. **Hitung Burnout Otomatis (0–100):** Menghitung tingkat kelelahan dari beban SKS + jadwal ujian + waktu layar dikurangi pemulihan tidur & jeda istirahat, lalu otomatis tersimpan di database setiap hari.
  4. **Dashboard & Ringkasan Harian:** Menggabungkan seluruh data harian user (jadwal kuliah hari ini, tidur, langkah, waktu layar, active break, burnout, streak, XP, dan notifikasi) dalam satu endpoint dinamis dari MySQL.
  5. **Deteksi Tidur & Check-in Stres:** Menghitung jam tidur otomatis dari waktu istirahat perangkat (bisa dikoreksi manual), plus form check-in stres harian (PSS-4 & PSS-10) yang langsung memperbarui streak user.
  6. **Aktivitas Fisik, Duduk, & Istirahat Aktif:** Mencatat langkah/kalori (METs), durasi duduk, serta verifikasi peregangan kamera (+15 XP & +10 Recovery Score) yang otomatis membuka kunci layar.
  7. **Sensor Waktu Layar & Kunci Layar Lintas OS:** Menghitung waktu layar dari kernel OS (macOS, Windows, Linux) dan menyimpannya ke MySQL per user. Saat dibuka dari HP (Android/iOS), kunci layar tetap berjalan di HP tanpa mengganggu layar laptop.
  8. **Wellbeing AI Coach:** Chatbot pendamping dengan Ollama lokal, jalur darurat krisis (`healing119.id`), klarifikasi cepat, dan fallback otomatis jika AI offline.
  9. **Notifikasi Harian & Web Push:** Pengingat harian dibuat otomatis dari kondisi nyata user di MySQL (jadwal kuliah/ujian, kurang tidur, belum check-in, target istirahat, streak) lengkap dengan dukungan Web Push VAPID.
  10. **Akses Lintas OS & Browser:** Backend bind ke `0.0.0.0`, CORS & Helmet ramah semua browser (Chrome, Safari, Firefox, Edge, Brave, Opera, Samsung Internet) serta LAN/Cloudflare Tunnel, plus cek koneksi MySQL nyata di `/api/v1/health`.
- **Daftar File Diubah:**
  - `backend/prisma/schema.prisma`, `backend/prisma/migrations/20261124153000_add_user_notifications/migration.sql`
  - `backend/src/app.ts`, `backend/src/index.ts`, `backend/src/config/env.ts`, `backend/src/middleware/auth.ts`
  - `backend/src/routes/*` (`auth`, `users`, `academicSchedule`, `burnout`, `dashboard`, `wellbeing`, `activities`, `sedentary`, `activeBreak`, `osLock`, `notifications`, `health`)
  - `backend/src/services/*` (`burnoutSync`, `osLockService`, `pushNotifier`, `scheduleParser`)
  - `[CROSS-SCOPE] frontend/vite.config.ts` — proxy `/api` & `allowedHosts: true` untuk akses HP dan tunnel.
  - `[CROSS-SCOPE] scripts/dev.mjs` — perbaikan `Ctrl+C` bersih di Windows, macOS, dan Linux.
- **Verifikasi:** `npm run build:backend` (0 error) dan `npm run test:backend` (133/133 test lulus).

## [2026-11-16] — Penyelarasan Menyeluruh Dokumen Arsitektur & README Sub-Direktori ke PRD v4.0 (Branch: `main`)
- **ID Tugas / Referensi:** `LEAD-4.0` (Penyelarasan PRD v4.0 Monorepo)
- **Ringkasan:** Menyelaraskan seluruh dokumen arsitektur, master design, dan README per direktori domain ke paradigma PRD Versi 4.0 (*Academic Strava, Zero Continuous Camera, Burnout Risk Index 0–100, & Proactive AI Coach*).
- **Daftar File Diubah:**
  - `DESIGN.md` (Pembaruan Versi 4.0, 3 pilar pivot, diagram 4-lapis, dan rumus Burnout Risk Index).
  - `docs/universal/ARCHITECTURE.md` (Topologi 4-lapis & aliran data end-to-end PRD v4.0).
  - `docs/universal/PRD.md` (Penyelarasan isi cetak biru menjadi PRD Versi 4.0).
  - `docs/universal/INTERFACES.md` (Penambahan Kontrak 5: DTO Academic Schedule, Burnout Calculation, dan Active Break Session).
  - `docs/README.md` (Pembaruan peta indeks dokumentasi monorepo ke PRD v4.0).
  - `docs/backend/README.md`, `docs/backend/DATABASE_SCHEMA.md`, `docs/backend/API_SPECIFICATION.md`, `docs/backend/CLINICAL_SCORING.md` (Dokumentasi model dan endpoint v4.0).
  - `docs/frontend/README.md`, `docs/frontend/PAGES_AND_FLOWS.md` (Pembaruan sitemap & alur Strava Akademik, Modal Active Break 2 menit, & Screen Time Tracker).
  - `docs/vision/README.md` (Penyederhanaan fokus Vision menjadi On-Demand ActiveBreakValidator 2 menit).
- **Verifikasi:** Seluruh dokumen konsisten dengan skema Prisma, endpoints Express, dan implementasi kode PRD v4.0. Semua unit test (`npm run test:shared`, `npm run test:frontend`, `npm run test:backend`) lulus 100%.


## [2026-11-11] — Penyelarasan Dokumentasi Global & Kontrak ke Ollama Lokal (Branch: `main`)
- **ID Tugas / Referensi:** `LEAD-1.3`
- **Ringkasan:** Menyelaraskan seluruh dokumentasi global (`README.md`, `DESIGN.md`, `docs/README.md`, `docs/universal/*`, `docs/frontend/*`, `backend/.env.example`, `frontend/.env.example`) dari Google Gemini API menjadi **Ollama Lokal** (`/api/chat` JSON Schema + fallback klinis deterministik) sesuai implementasi backend tanpa API key eksternal.
- **Daftar File Diubah:**
  - `README.md`, `DESIGN.md`, `backend/.env.example`, `frontend/.env.example`, `docs/README.md`
  - `docs/universal/*`, `docs/frontend/PAGES_AND_FLOWS.md`, `docs/frontend/README.md`, `docs/frontend/SETUP.md`
- **Verifikasi:** Nol referensi Gemini tersisa pada kontrak aktif, validasi tautan Markdown lolos, dan diturunkan ke `frontend` & `backend` tanpa konflik.

## [2026-11-11] — Penambahan Template `.env.example` & Panduan Onboarding AI di README (Branch: `main`)
- **ID Tugas / Referensi:** `LEAD-1.2`
- **Ringkasan:** Menambahkan `backend/.env.example` dan `frontend/.env.example` sebagai template environment siap pakai, serta memperbarui `README.md` dan `docs/frontend/SETUP.md` dengan rincian tabel `.env` dan prompt onboarding cepat untuk AI assistant setiap anggota.
- **Daftar File Diubah:**
  - `backend/.env.example`, `frontend/.env.example`
  - `README.md`, `docs/frontend/SETUP.md`
- **Verifikasi:** Lolos validasi tautan Markdown dan diturunkan ke branch `backend` & `frontend`.

## [2026-11-11] — Implementasi Kontrak Bersama & Modul Inti Vision AI (Branch: `main`)
- **ID Tugas / Referensi:** `LEAD-1.1`, `VIS-1.1`, `VIS-1.2`
- **Ringkasan:** Membangun modul kontrak TypeScript & konstanta klinis di `shared/contracts/index.ts`, serta implementasi inti heuristik MediaPipe (`poseHeuristics.ts`: baseline 5 detik, evaluasi slouch/proximity/tilt/stretch/standup, `PostureEmaSmoother`, `calcEyeAspectRatio`) lengkap dengan unit test Node native.
- **Daftar File Diubah:**
  - `shared/contracts/index.ts`, `shared/vision/poseHeuristics.ts`, `shared/vision/poseHeuristics.test.ts`, `shared/package.json`, `shared/README.md`
  - `package.json`, `README.md`, `docs/vision/TASK_GUIDE.md`
- **Verifikasi:** `npm run test:shared` (5/5 unit test lolos) dan diturunkan ke branch `backend` & `frontend`.
