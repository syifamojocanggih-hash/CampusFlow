# `docs/changelogs/` — Sistem Changelog Terpisah Per-User (Zero-Conflict)

Setiap anggota tim CampusFlow memiliki **file Changelog pribadi yang terpisah**. Pemisahan ini dirancang agar:
1. Saat branch `backend` dan `frontend` di-merge ke `main`, **tidak terjadi merge conflict** pada file riwayat perubahan.
2. Kontribusi, penanggung jawab, dan riwayat modifikasi setiap anggota terdokumentasi secara transparan dan mudah diaudit (termasuk untuk verifikasi Bab G.6 Rulebook Techcomfest 2027).

---

## 1. Daftar File Changelog Resmi

| File | Pemilik | GitHub | Branch Utama Kerja |
|---|---|---|---|
| [`CHANGELOG_IBRA.md`](CHANGELOG_IBRA.md) | **Ibra** *(Project Leader & Vision AI)* | `@flyingdutchman` | `main` (serta kolaborasi `frontend`) |
| [`CHANGELOG_TIARA.md`](CHANGELOG_TIARA.md) | **Tiara / Mutiara Dewanda Prisvilla** *(Frontend Engineer)* | `@mutiaradewanda` | `frontend` |
| [`CHANGELOG_SYIFA.md`](CHANGELOG_SYIFA.md) | **Syifa / Ahmad Syifa'ul Falakhul Khayyi** *(Backend & LLM Engineer)* | `@syifamojocanggih-hash` | `backend` |

---

## 2. Aturan Wajib Pengisian (Diperiksa Otomatis oleh `guard-check.mjs`)

1. **Setiap commit/PR dari branch `backend` atau `frontend` yang mengubah kode/dokumen WAJIB disertai pembaruan pada file Changelog milik user terkait.**
2. **Jangan pernah mengedit file Changelog milik anggota lain.**
3. **Jika melakukan perubahan lintas zona (`[CROSS-SCOPE]`):**
   - Setiap user **diperbolehkan** mengubah file di luar zona default apabila mendesak.
   - **Syarat mutlak:** Tambahkan tag `[CROSS-SCOPE]`, tulis **path lengkap file** yang diubah di luar zona, tuliskan **alasan teknisnya**, dan informasikan pada deskripsi Pull Request ke `main`.

---

## 3. Format Entri Standar

```markdown
## [YYYY-MM-DD] — Judul Singkat Perubahan (Branch: <main|backend|frontend>)
- **ID Tugas / Referensi:** `VIS-1.2` / `BE-2.1` / `FE-3.1`
- **Ringkasan:** Penjelasan singkat apa yang ditambahkan atau diperbaiki.
- **Daftar File Diubah:**
  - `path/ke/file1`
  - `path/ke/file2`
- **Catatan Cross-Scope (opsional):** `[CROSS-SCOPE]` Mengubah `path/file/lintas` karena <alasan>.
- **Verifikasi:** Hasil test/build/check yang sudah dijalankan.
```
