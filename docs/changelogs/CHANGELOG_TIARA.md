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
