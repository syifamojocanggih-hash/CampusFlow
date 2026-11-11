# BOUNDARIES_AND_CONTRACTS.md — Batas Kerja, Hak Akses & Protokol Fleksibel

> **STATUS:** Acuan resmi untuk seluruh anggota tim (Ibra, Tiara, Syifa) maupun AI coding assistant di setiap branch.  
> **PEMILIK DOKUMEN:** Branch `main` (Ibra `@flyingdutchman` — Project Leader).

---

## 1. Pembagian Peran & Kepemilikan Tim (3 Orang, 3 Branch)

| Anggota Tim | GitHub | Peran Utama | Branch Kerja | Zona Default (R/W) | File Changelog Pribadi |
|---|---|---|---|---|---|
| **Ibra** | `@flyingdutchman` | **Project Leader & Vision AI Engineer** | `main` *(+ kolaborasi `frontend`)* | Root (`README.md`, `DESIGN.md`, `package.json`), `shared/`, `docs/universal/`, `docs/vision/`, `scripts/`, `.github/` *(+ boleh bantu di `frontend/`)* | [`docs/changelogs/CHANGELOG_IBRA.md`](../changelogs/CHANGELOG_IBRA.md) |
| **Tiara** *(Mutiara Dewanda Prisvilla)* | `@mutiaradewanda` | **Frontend & PWA Experience Engineer** | `frontend` | `frontend/`, `docs/frontend/` *(bebas berbagi kode di dalam `frontend/` dengan Ibra)* | [`docs/changelogs/CHANGELOG_TIARA.md`](../changelogs/CHANGELOG_TIARA.md) |
| **Syifa** *(Ahmad Syifa'ul Falakhul Khayyi)* | `@syifamojocanggih-hash` | **Backend & LLM Engineer** | `backend` | `backend/`, `docs/backend/` | [`docs/changelogs/CHANGELOG_SYIFA.md`](../changelogs/CHANGELOG_SYIFA.md) |

---

## 2. Pemisahan File: Diturunkan dari `main` vs Eksklusif Branch

Untuk menjamin **zero merge conflict** saat penggabungan cabang:

### A. File Dibuat di `main` dan Diturunkan ke Branch (`git merge origin/main`)
1. Root konfigurasi: `README.md`, `DESIGN.md`, `package.json`, `.gitignore`, `.gitattributes`
2. Tata kelola & otomasi: `.github/*`, `.githooks/*`, `scripts/guard-check.mjs`, `scripts/guard-check.sh`
3. Sumber kebenaran bersama: `docs/README.md`, `docs/universal/*`, `docs/vision/*`, `shared/*`
4. Kerangka awal dokumen domain & file kosong changelog (`docs/changelogs/CHANGELOG_*.md`).

### B. File Eksklusif Branch (Bebas Konflik saat Merge ke `main`)
- **Eksklusif `backend`:** seluruh `backend/**` (termasuk `backend/package.json` & `backend/package-lock.json`), `docs/backend/**`, dan `docs/changelogs/CHANGELOG_SYIFA.md`.
- **Eksklusif `frontend`:** seluruh `frontend/**` (termasuk `frontend/package.json` & `frontend/package-lock.json`), `docs/frontend/**`, dan `docs/changelogs/CHANGELOG_TIARA.md` (serta `CHANGELOG_IBRA.md` bila Ibra berkontribusi setelah menarik `main`).

> **Aturan Penting Lockfile:** DILARANG menjalankan `npm install` di folder root `CampusFlow/`. Jalankan selalu di dalam `backend/` (`cd backend && npm install`) atau `frontend/` (`cd frontend && npm install`) agar `package-lock.json` masing-masing tidak pernah bertabrakan!

---

## 3. Aturan Fleksibel & Protokol `[CROSS-SCOPE]`

Berbeda dari sistem kaku yang melarang total perubahan lintas folder, CampusFlow mengizinkan fleksibilitas tim **dengan syarat akuntabilitas penuh**:

1. **Syarat Wajib Changelog Pribadi (Berlaku untuk Semua Perubahan):**
   - Setiap push ke `backend` atau `frontend` yang mengubah file apa pun **WAJIB** menambahkan entri baru pada file Changelog milik user yang bekerja (`CHANGELOG_SYIFA.md` untuk `backend`, `CHANGELOG_TIARA.md` atau `CHANGELOG_IBRA.md` untuk `frontend`).
2. **Syarat Perubahan Lintas Zona (`[CROSS-SCOPE]`):**
   - Jika Syifa di `backend` terpaksa mengubah file di `shared/` atau `frontend/` (atau Tiara di `frontend` terpaksa mengubah file di `shared/` atau `backend/`):
     - **BOLEH dilakukan** jika bersifat mendesak/integrasi.
     - **WAJIB** mencantumkan tag **`[CROSS-SCOPE]`**, **path lengkap file** yang diubah, dan **alasan teknis** pada Changelog pribadi.
     - **WAJIB** menyebutkannya pada deskripsi Pull Request menuju `main` untuk ditinjau bersama pemilik zona terkait dan Ibra (`@flyingdutchman`).
3. **Penegakan Otomatis:**
   - Script `scripts/guard-check.mjs` (berjalan di `.githooks/pre-push`, `npm run guard`, dan GitHub Actions) akan **MENOLAK** push/PR apabila:
     - Tidak ada pembaruan pada Changelog user terkait, **ATAU**
     - Ada file lintas zona yang diubah tetapi belum dicatat dengan tag `[CROSS-SCOPE]` di Changelog user terkait.

---

## 4. Kontrak Batas Teknis Antar-Domain

| Batas Integrasi | Aturan Teknis |
|---|---|
| **Vision AI (`main`/`shared`) ↔ Frontend (`frontend`)** | Vision Engine hanya mengeluarkan objek numerik `PostureBaseline` & `PostureEvaluationResult` (lihat [`INTERFACES.md`](INTERFACES.md) §1). Dilarang mengirim blob gambar/video webcam ke API backend. |
| **Frontend (`frontend`) ↔ Backend (`backend`)** | Komunikasi hanya melalui endpoint REST `/api/v1/*` dengan amplop JSON standar `{"data": ..., "meta": ...}` atau `{"error": ...}`. Frontend dilarang mengimpor `@prisma/client` atau menyentuh MySQL langsung. |
| **Backend (`backend`) ↔ Gemini LLM** | `GEMINI_API_KEY` dan `VAPID_PRIVATE_KEY` **HARUS** berada di `backend/.env` (server-side only). Dilarang keras menaruh API key di `frontend/` (`VITE_*`). |
| **Skoring Klinis** | Perhitungan *reverse score* PSS-4/PSS-10, METs IPAQ-SF, dan 24-Hour Triad dilakukan secara otoritatif di backend (`clinicalScoring.ts`); frontend hanya menampilkan hasil atau perkiraan lokal sementara saat offline. |

---

## 5. Matriks Ketahanan Kegagalan (*Blast Radius Containment*)

| Titik Kegagalan | Penanganan Otomatis | Dampak ke Pengguna |
|---|---|---|
| **Izin webcam ditolak / laptop tanpa kamera** | `VisionGuard` nonaktif secara anggun; mode Pedometer & Kuesioner tetap berjalan normal. | Aplikasi tetap bisa dipakai penuh untuk pelacakan aktivitas & AI Coach. |
| **Browser desktop tanpa `DeviceMotionEvent`** | `PedometerCard` menampilkan form input aktivitas manual + tipe MSE. | Aktivitas fisik dan MET-menit tetap tercatat. |
| **Gemini API timeout / limit kuota** | Backend mengembalikan insight fallback deterministik berbasis konstanta klinis + mencatat log error. | Halaman AI Coach tidak crash (zero blank screen). |
| **Koneksi internet terputus** | Frontend menyimpan sementara log di LocalStorage/IndexedDB dan menyinkronkan ulang saat online; file `.task` MediaPipe tersaji dari Cache Storage PWA. | Pemantauan postur dan pencatatan sesi tetap berjalan. |
