# SETUP.md — Panduan Setup Backend & Database Lokal

> **PENANGGUNG JAWAB:** Syifa (`@syifamojocanggih-hash` — branch `backend`)

---

## 1. Prasyarat
- Node.js `>= 20.x` & npm `>= 10.x`
- MySQL `8.x` lokal (via MySQL Installer, XAMPP, DBngin, Docker) atau TiDB Cloud
- Kunci Google Gemini API (`GEMINI_API_KEY`) dari Google AI Studio

---

## 2. Konfigurasi `.env` (`backend/.env`)

Buat salinan dari `backend/.env.example`:
```env
PORT=4000
DATABASE_URL="mysql://root:password@localhost:3306/campusflow"
JWT_SECRET="ganti_dengan_secret_acak_minimal_32_karakter"
GEMINI_API_KEY="AIza..."
VAPID_PUBLIC_KEY="..."
VAPID_PRIVATE_KEY="..."
VAPID_SUBJECT="mailto:admin@campusflow.id"
CORS_ORIGIN="http://localhost:5173,https://localhost:5173"
```

Generate pasangan kunci VAPID untuk Web Push dengan perintah:
```bash
npx web-push generate-vapid-keys
```

---

## 3. Langkah Instalasi & Migrasi Database

> **Penting:** Selalu jalankan `npm install` di dalam folder `backend/` (bukan di root) agar `backend/package-lock.json` tetap terisolasi dari frontend.

```bash
git checkout backend
git merge origin/main          # pastikan sinkron dengan kontrak main terbaru

cd backend
npm install
npx prisma migrate dev --name init
npx prisma db seed
npm run dev
```

---

## 4. Verifikasi Sebelum Commit & Push

```bash
# Kembali ke root repositori
cd ..
npm --prefix backend run build
npm --prefix backend test      # jika unit test tersedia
# Perbarui docs/changelogs/CHANGELOG_SYIFA.md
npm run guard
```
