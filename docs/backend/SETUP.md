# SETUP.md — Panduan Setup Backend, MySQL, & Ollama Lokal

> **PENANGGUNG JAWAB:** Syifa (`@syifamojocanggih-hash` — branch `backend`)

---

## 1. Prasyarat
- Node.js `>= 20.x` & npm `>= 10.x`
- MySQL `8.x` lokal (via MySQL Installer, XAMPP, Laragon, DBngin, atau Docker) / TiDB Cloud
- **Ollama Lokal** ([ollama.com](https://ollama.com)) dengan base model `qwen2.5:3b` dan model kustom `campusflow-coach` dari `backend/ollama/Modelfile` *(tanpa API key berbayar)*

---

## 2. Konfigurasi `.env` (`backend/.env`)

Salin dari `backend/.env.example`:
```env
PORT=4000
DATABASE_URL="mysql://root:password@localhost:3306/campusflow"
JWT_SECRET="ganti_dengan_secret_acak_minimal_32_karakter"
OLLAMA_BASE_URL="http://localhost:11434"
OLLAMA_MODEL="campusflow-coach"
OLLAMA_TIMEOUT_MS=60000
VAPID_PUBLIC_KEY=""
VAPID_PRIVATE_KEY=""
VAPID_SUBJECT="mailto:admin@campusflow.id"
CORS_ORIGIN="http://localhost:5173,https://localhost:5173"
```

*(Opsional)* Generate pasangan kunci VAPID untuk Web Push dengan perintah:
```bash
npx web-push generate-vapid-keys
```

---

## 3. Langkah Instalasi, Ollama, & Migrasi Database

> **Penting:** Selalu jalankan `npm install` di dalam folder `backend/` (bukan di root) agar `backend/package-lock.json` tetap terisolasi dari frontend.

```bash
git checkout backend
git merge origin/main          # pastikan sinkron dengan kontrak main terbaru

# 1. Jalankan Ollama lokal & bangun model kustom CampusFlow (sekali pull)
ollama pull qwen2.5:3b
ollama serve
npm --prefix backend run ollama:create

# 2. Setup backend & MySQL
cd backend
npm install
npx prisma migrate dev --name init
npx prisma db seed
npm run dev
```

---

## 4. Verifikasi Sebelum Commit & Push

```bash
cd ..
npm --prefix backend run typecheck
npm --prefix backend run build
npm --prefix backend test
npm --prefix backend run ollama:eval    # uji 7 skenario klinis langsung ke campusflow-coach
# Uji live endpoint saat server menyala: .\backend\scripts\smoke-api.ps1
# Perbarui docs/changelogs/CHANGELOG_SYIFA.md
npm run guard
```
