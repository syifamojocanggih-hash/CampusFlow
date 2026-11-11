# Changelog — Syifa / Ahmad Syifa'ul Falakhul Khayyi (`@syifamojocanggih-hash`)

> **Peran:** Backend & LLM Engineer  
> **Branch Kerja:** `backend` (`backend/`, `docs/backend/`)  
> **Aturan:** Hanya Syifa yang mengisi file ini. Setiap push/PR di branch `backend` wajib menambahkan entri di sini. Jika mengubah file di luar zona default `backend/` atau `docs/backend/`, WAJIB menyertakan tag `[CROSS-SCOPE]`, path lengkap file, dan alasannya.

---

## Format Contoh Entri *(Salin saat menambah perubahan baru di atas bagian ini)*

```markdown
## [YYYY-MM-DD] — Judul Fitur / Perbaikan (Branch: `backend`)
- **ID Tugas / Referensi:** `BE-1.1`
- **Ringkasan:** Inisialisasi Express TypeScript, Prisma MySQL schema, dan endpoint auth JWT.
- **Daftar File Diubah:**
  - `backend/prisma/schema.prisma`
  - `backend/src/index.ts`
- **Catatan Cross-Scope:** *(Hapus baris ini jika tidak ada, atau tulis `[CROSS-SCOPE] path/file — alasan`)*
- **Verifikasi:** `npx prisma migrate dev` dan `npm --prefix backend run build` berhasil.
```

---

## [2026-11-11] — Baseline Awal Branch Backend dari `main` (Branch: `backend`)
- **ID Tugas / Referensi:** `BE-0.0`
- **Ringkasan:** Menerima turunan fondasi arsitektur, skema Prisma referensi, kontrak API `INTERFACES.md`, dan dokumen tugas dari `main`. Siap untuk inisialisasi Express + Prisma + Gemini AI Coach di direktori `backend/`.
- **Verifikasi:** Sinkron dengan commit dasar `main`.
