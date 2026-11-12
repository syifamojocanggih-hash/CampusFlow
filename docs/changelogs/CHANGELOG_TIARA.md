# Changelog — Tiara / Mutiara Dewanda Prisvilla (`@mutiaradewanda`)

> **Peran:** Frontend & PWA Experience Engineer  
> **Branch Kerja:** `frontend` (`frontend/`, `docs/frontend/`)  
> **Aturan:** Hanya Tiara yang mengisi file ini. Setiap push/PR di branch `frontend` wajib menambahkan entri di sini. Jika mengubah file di luar zona default `frontend/` atau `docs/frontend/`, WAJIB menyertakan tag `[CROSS-SCOPE]`, path lengkap file, dan alasannya.

---

## Format Contoh Entri *(Salin saat menambah perubahan baru di atas bagian ini)*

```markdown
## [YYYY-MM-DD] — Judul Fitur / Perbaikan (Branch: `frontend`)
- **ID Tugas / Referensi:** `FE-1.1`
- **Ringkasan:** Membangun komponen TriadDashboard dan integrasi status pill 24-Hour Movement.
- **Daftar File Diubah:**
  - `frontend/src/components/TriadDashboard.tsx`
  - `docs/frontend/UI_COMPONENTS.md`
- **Catatan Cross-Scope:** *(Hapus baris ini jika tidak ada, atau tulis `[CROSS-SCOPE] path/file — alasan`)*
- **Verifikasi:** `npm --prefix frontend run build` berhasil tanpa error TypeScript.
```

---

## [2026-11-12] — Penghapusan Tombol Logout Top Header & Halaman Atur Profil Pengguna (Branch: `frontend`)
- **ID Tugas / Referensi:** `FE-1.16`
- **Ringkasan:** 
  1. **Hapus Tombol Logout Top Header (Gambar 1):** Menghapus tombol logout pill yang berada di header atas desktop (`DesktopTopHeader`) sesuai tangkapan layar `media_1794488419546_2f780a2d.png`. Tombol keluar akun tetap tersedia secara terorganisir di bagian bawah desktop sidebar dan dropdown avatar mobile.
  2. **Halaman Atur Profil Pengguna (`ProfileView.tsx`):**
     - Membangun halaman baru `ProfileView.tsx` untuk mengelola data identitas mahasiswa (Nama Lengkap, NIM, Email, Program Studi, Semester).
     - Menghadirkan kustomisasi warna latar avatar pastel (Soft Pink `#F7A8B0`, Sky Blue `#BDE6F0`, Mint Green `#CDE8B5`, Butter Yellow `#FFF29A`, Lavender `#C9B3E6`).
     - Menyediakan panel target METs mingguan (dengan slider interaktif dan preset IPAQ-SF 600 - 2000 METs), durasi fokus duduk sebelum jeda (45/50/60 mnt), serta target tidur harian.
     - Menampilkan kartu ringkasan gamifikasi (Streak aktif, Level 4 Habit Champion, XP terkumpul) dan status kalibrasi postur AI (*Vision Baseline*) dengan shortcut langsung menuju Vision Focus.
     - Menyediakan tombol simpan profil yang langsung memperbarui state global dan tersimpan secara persisten di `localStorage`/API.
  3. **Akses Navigasi Profil:**
     - Tombol profil/avatar di `DesktopTopHeader` dan snippet profil di bawah `DesktopSidebar` kini dapat diklik untuk membuka halaman Atur Profil.
     - Ditambahkan item "Atur Profil" pada dropdown profil di `MobileHeader`.
     - Ditambahkan shortcut navigasi dari `SettingsView.tsx` menuju `ProfileView.tsx`.
- **Daftar File Diubah:**
  - `frontend/src/types/index.ts`
  - `frontend/src/lib/api.ts`
  - `frontend/src/components/pages/ProfileView.tsx` (baru)
  - `frontend/src/components/Navbar.tsx`
  - `frontend/src/components/pages/SettingsView.tsx`
  - `frontend/src/App.tsx`
  - `docs/changelogs/CHANGELOG_TIARA.md`
- **Verifikasi:** 
  - `npm --prefix frontend run build` lolos (0 TypeScript errors).
  - `npm run test:frontend` (9/9 lulus).
  - `npm run test:shared` (5/5 lulus).
  - `npm run guard` lolos validasi monorepo.

---

## [2026-11-12] — Tombol Logout Sidebar & Animasi Bouncing Navbar Bottom Mobile (Branch: `frontend`)
- **ID Tugas / Referensi:** `FE-1.15`
- **Ringkasan:** 
  1. **Tombol Logout (Gambar 1):** Mengubah tombol navigasi di bagian bawah sidebar desktop (`DesktopSidebar`) yang sebelumnya bertuliskan "Landing Page" menjadi tombol **"Log out" / "Keluar"** berikon `LogOut` dengan hover state warna merah lembut (`hover:bg-rose-50/70 hover:text-rose-600`), serta menyelaraskan tombol keluar pada header atas desktop dan dropdown avatar pengguna di mobile.
  2. **Animasi Bouncing Pill Navbar Bawah Mobile (Gambar 2):** Mengubah perpindahan indikator aktif kuning (`#FFF29A`) pada `MobileBottomNav` menjadi sliding pill dinamis dengan transisi fisika pegas *overshoot* `cubic-bezier(0.34, 1.56, 0.64, 1)` dan efek memantul kenyal (*squash & stretch bounce*) melalui keyframe `@keyframes navPillBounce` (`.animate-nav-bounce`) setiap kali berpindah tab menu, disertai animasi ikon terangkat halus (`scale-110 -translate-y-0.5`).
- **Daftar File Diubah:**
  - `frontend/src/components/Navbar.tsx`
  - `frontend/src/index.css`
  - `docs/changelogs/CHANGELOG_TIARA.md`
- **Verifikasi:** 
  - `npm --prefix frontend run build` lolos tanpa error TypeScript.
  - `npm run test:frontend` (9/9 lulus).
  - `npm run test:shared` (5/5 lulus).
  - `npm run guard` lolos validasi monorepo.

---

## [2026-11-12] — Transformasi Palet Warna Calorie Counter Pastel (Sky Blue, Mint Green, Butter Yellow, Peach, Soft Pink, Cloud Gray, & Ink Black) (Branch: `frontend`)
- **ID Tugas / Referensi:** `FE-1.6`
- **Ringkasan:** 
  1. Menerapkan palet warna pastel segar dan ramah berbasis desain Calorie Counter Mobile App dengan proporsi 60-30-10:
     - **Warna Utama:** Sky Blue `#BDE6F0` (Kartu "Your Progress", Water, Taco), Mint Green `#CDE8B5` (Kartu Breakfast, bar nutrisi/kebugaran), Butter Yellow `#FFF29A` (Tombol aksi "Calorie count", item navigasi aktif).
     - **Warna Pendukung:** Peach Orange `#F9B99A` (Ring progres 72%, ikon streak), Soft Pink `#F7A8B0` (Badge notifikasi, latar avatar), Lavender `#C9B3E6` (Indikator tag kecil).
     - **Warna Netral:** Pure White `#FFFFFF` (Latar kartu & lingkaran angka), Cloud Gray `#F6F6F6` (Latar layar, kartu netral, track bar), Light Gray `#E8E8E8` (Border halus kartu), Ink Black `#1A1A1A` (Teks utama & angka besar), Muted Gray `#9A9A9A` (Teks sekunder).
  2. Memperbarui `tailwind.config.js` dengan token warna `sky`, `mint`, `butter`, `peach`, `softPink`, `lavender`, `cloud`, `ink`, `muted`.
  3. Menyelaraskan seluruh komponen antarmuka (`App.tsx`, `Navbar.tsx`, `TriadDashboard.tsx`, `PanicReliefMode.tsx`, `StatusPill.tsx`, `ActivityView.tsx`, `CheckinView.tsx`, `CoachView.tsx`, `HistoryView.tsx`, `SettingsView.tsx`, `FocusView.tsx`, `VisionLabView.tsx`, `PedometerCard.tsx`, `VisionGuard.tsx`).
- **Daftar File Diubah:**
  - `frontend/tailwind.config.js`
  - `frontend/src/index.css`
  - `frontend/src/App.tsx`
  - `frontend/src/components/Navbar.tsx`
  - `frontend/src/components/TriadDashboard.tsx`
  - `frontend/src/components/PanicReliefMode.tsx`
  - `frontend/src/components/common/StatusPill.tsx`
  - `frontend/src/components/pages/ActivityView.tsx`
  - `frontend/src/components/pages/CheckinView.tsx`
  - `frontend/src/components/pages/CoachView.tsx`
  - `frontend/src/components/pages/HistoryView.tsx`
  - `frontend/src/components/pages/SettingsView.tsx`
  - `frontend/src/components/pages/FocusView.tsx`
  - `frontend/src/components/pages/VisionLabView.tsx`
  - `frontend/src/components/sensor/PedometerCard.tsx`
  - `frontend/src/components/vision/VisionGuard.tsx`
- **Verifikasi:** 
  - `npm --prefix frontend run build` lolos (0 TypeScript errors).
  - `npm run test:frontend` (8/8 tests pass).
  - `npm run test:shared` (5/5 tests pass).
  - `npm run guard` lolos validasi monorepo.

---

## [2026-11-12] — Penerapan Palet Warna Kustom: F2EFE7 (Background), 3368A0 (Font), 66A3BF & C8DFDB (Komponen Pendukung & Cards) (Branch: `frontend`)
- **ID Tugas / Referensi:** `FE-1.5`
- **Ringkasan:** 
  1. Mengganti seluruh palet warna aplikasi CampusFlow sesuai instruksi spesifik pengguna dan referensi 4 warna:
     - `#F2EFE7`: Warna dasar primary untuk background aplikasi (`surface`, `body`, scrollbar track).
     - `#3368A0`: Warna font utama (teks, headings, brand logos, primary button, icon containers, active menu pill).
     - `#66A3BF`: Komponen pendukung (aksen sekunder, tombol interaktif, chart lines, icon accents, streak gradient).
     - `#C8DFDB`: Komponen pendukung & cards (card borders, soft badge fills, pill containers, circular progress tracks).
  2. Memperbarui `tailwind.config.js` dengan token `primary`, `ocean` (`#3368A0`), `cerulean` (`#66A3BF`), `seafoam` (`#C8DFDB`), `cream` (`#F2EFE7`), dan bayangan bertema ocean tint.
  3. Mengadaptasi seluruh view dan komponen (`App.tsx`, `Navbar.tsx`, `TriadDashboard.tsx`, `PanicReliefMode.tsx`, `StatusPill.tsx`, `ActivityView.tsx`, `CheckinView.tsx`, `CoachView.tsx`, `HistoryView.tsx`, `SettingsView.tsx`, `FocusView.tsx`, `VisionLabView.tsx`, `PedometerCard.tsx`, `VisionGuard.tsx`).
- **Daftar File Diubah:**
  - `frontend/tailwind.config.js`
  - `frontend/src/index.css`
  - `frontend/src/App.tsx`
  - `frontend/src/components/Navbar.tsx`
  - `frontend/src/components/TriadDashboard.tsx`
  - `frontend/src/components/PanicReliefMode.tsx`
  - `frontend/src/components/common/StatusPill.tsx`
  - `frontend/src/components/pages/ActivityView.tsx`
  - `frontend/src/components/pages/CheckinView.tsx`
  - `frontend/src/components/pages/CoachView.tsx`
  - `frontend/src/components/pages/HistoryView.tsx`
  - `frontend/src/components/pages/SettingsView.tsx`
  - `frontend/src/components/pages/FocusView.tsx`
  - `frontend/src/components/pages/VisionLabView.tsx`
  - `frontend/src/components/sensor/PedometerCard.tsx`
  - `frontend/src/components/vision/VisionGuard.tsx`
- **Verifikasi:** 
  - `npm --prefix frontend run build` lolos (0 TypeScript errors).
  - `npm run test:frontend` (8/8 tests pass).
  - `npm run test:shared` (5/5 tests pass).
  - `npm run guard` lolos validasi monorepo.

---

## [2026-11-12] — Redesain Komprehensif Antarmuka Web (Desktop & Mobile) Bergaya Learnova LMS & Perbaikan Vision Lab (Branch: `frontend`)
- **ID Tugas / Referensi:** `FE-1.3`, `FE-1.4`, `FE-2.1`
- **Ringkasan:** 
  1. Merombak visual style dan palet warna seluruh aplikasi CampusFlow mengadopsi referensi Learnova LMS: background `#F8F9FE`, card putih bersih rounded-2xl/3xl dengan soft shadow, aksen utama royal indigo `#5046E5`, aksen pastel (mint, amber, soft rose), dan dark purple celebratory cards.
  2. Implementasi layout Desktop: Fixed sidebar kiri dengan navigasi menu berlatar lavender untuk status aktif, header sapaan personal "Good Morning, [Name] 👋" disertai search bar rounded pill & notification counter, grid metrik 4 kartu, 24-Hour Movement donut progress (72%), purple streak card, dan area chart Recharts.
  3. Implementasi layout Mobile: Header ringkas "Hi, [Name] 👋", hero purple banner dengan play button, horizontal date strip selector, card list rapi, dan bottom navigation bar 5 tab tetap.
  4. Redesain seluruh view halaman (`TriadDashboard`, `ActivityView`, `CheckinView`, `CoachView`, `HistoryView`, `SettingsView`, `FocusView`, `VisionLabView`, `PanicReliefMode`, `PedometerCard`, `StatusPill`).
  5. Perbaikan Vision Lab: Penyediaan model offline MediaPipe `pose_landmarker_lite.task` dan wasm binary di `public/`, toleransi visibility kalibrasi (`MIN_CALIBRATION_VISIBILITY = 0.35`), serta proteksi `try...finally` pada frame loop requestAnimationFrame.
- **Daftar File Diubah:**
  - `frontend/tailwind.config.js`
  - `frontend/src/index.css`
  - `frontend/src/App.tsx`
  - `frontend/src/components/Navbar.tsx`
  - `frontend/src/components/TriadDashboard.tsx`
  - `frontend/src/components/PanicReliefMode.tsx`
  - `frontend/src/components/common/StatusPill.tsx`
  - `frontend/src/components/pages/ActivityView.tsx`
  - `frontend/src/components/pages/CheckinView.tsx`
  - `frontend/src/components/pages/CoachView.tsx`
  - `frontend/src/components/pages/HistoryView.tsx`
  - `frontend/src/components/pages/SettingsView.tsx`
  - `frontend/src/components/pages/FocusView.tsx`
  - `frontend/src/components/pages/VisionLabView.tsx`
  - `frontend/src/components/sensor/PedometerCard.tsx`
  - `frontend/src/components/vision/VisionGuard.tsx`
  - `frontend/src/utils/poseHeuristics.ts`
  - `frontend/public/models/pose_landmarker_lite.task`
  - `frontend/public/wasm/*`
- **Verifikasi:** 
  - `npm --prefix frontend run build` lolos (0 TypeScript errors, PWA service worker generated).
  - `npm run test:frontend` (8/8 tests pass).
  - `npm run test:shared` (5/5 tests pass).
  - `npm run guard` lolos validasi monorepo.

---

## [2026-11-11] — Inisialisasi Proyek React 18, Vite, Tailwind CSS, & Layer Mock (Branch: `frontend`)
- **ID Tugas / Referensi:** `FE-1.1`, `FE-1.2`
- **Ringkasan:** Menginisialisasi fondasi frontend React 18 + Vite + TypeScript + Tailwind CSS + PWA (Workbox autoUpdate), konfigurasi token desain (Poppins, Inter, palet resmi), navigasi responsif, komponen TriadDashboard, Exam Panic Relief Mode, serta layer API Mock (`VITE_USE_MOCK=true`) berbasis `MOCK_DATA.md`.
- **Daftar File Diubah:**
  - `frontend/package.json`
  - `frontend/package-lock.json`
  - `frontend/vite.config.ts`
  - `frontend/tailwind.config.js`
  - `frontend/postcss.config.js`
  - `frontend/tsconfig.json`
  - `frontend/tsconfig.node.json`
  - `frontend/index.html`
  - `frontend/public/manifest.webmanifest`
  - `frontend/public/favicon.svg`
  - `frontend/src/index.css`
  - `frontend/src/main.tsx`
  - `frontend/src/App.tsx`
  - `frontend/src/vite-env.d.ts`
  - `frontend/src/types/index.ts`
  - `frontend/src/lib/api.ts`
  - `frontend/src/mocks/campusflowMock.ts`
  - `frontend/src/components/Navbar.tsx`
  - `frontend/src/components/TriadDashboard.tsx`
  - `frontend/src/components/PanicReliefMode.tsx`
  - `frontend/src/components/common/StatusPill.tsx`
  - `frontend/src/components/pages/FocusView.tsx`
  - `frontend/src/components/pages/ActivityView.tsx`
  - `frontend/src/components/pages/CheckinView.tsx`
  - `frontend/src/components/pages/CoachView.tsx`
  - `frontend/src/components/pages/HistoryView.tsx`
  - `frontend/src/components/pages/SettingsView.tsx`
  - `docs/changelogs/CHANGELOG_TIARA.md`
- **Verifikasi:** `npm --prefix frontend run build` berhasil tanpa error TypeScript (PWA precache generated).

## [2026-11-11] — Baseline Awal Branch Frontend dari `main` (Branch: `frontend`)
- **ID Tugas / Referensi:** `FE-0.0`
- **Ringkasan:** Menerima turunan fondasi arsitektur, design system, kontrak API, dan dokumen tugas dari `main`. Siap untuk inisialisasi aplikasi React 18 + Vite + Tailwind + PWA di direktori `frontend/`.
- **Verifikasi:** Sinkron dengan commit dasar `main`.
