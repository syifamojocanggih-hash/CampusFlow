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
