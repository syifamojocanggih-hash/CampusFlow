# SETUP.md — Panduan Setup Frontend React + Vite PWA & Model Lokal

> **PENANGGUNG JAWAB:** Tiara (`@mutiaradewanda` — branch `frontend`)

---

## 1. Langkah Instalasi Frontend

> **Penting:** Selalu jalankan `npm install` di dalam folder `frontend/` (bukan di root) agar `frontend/package-lock.json` tidak bentrok dengan `backend/package-lock.json`.

```bash
git checkout frontend
git merge origin/main          # tarik modul shared/vision & kontrak terbaru dari main

cd frontend
npm install
cp .env.example .env.local     # atur VITE_API_BASE_URL & VITE_USE_MOCK
npm run dev
```

---

## 2. Mengunduh Bobot Model MediaPipe Lokal (`pose_landmarker_lite.task`)

Agar pemuatan model Vision instan, offline-ready, dan bebas error CORS saat demo:
1. Unduh model resmi `pose_landmarker_lite.task` (~5.5 MB) dari Google MediaPipe Storage.
2. Simpan langsung ke `frontend/public/models/pose_landmarker_lite.task`.
3. Konfigurasikan `vite-plugin-pwa` pada `vite.config.ts` dengan `registerType: 'autoUpdate'` serta aturan `runtimeCaching` Workbox untuk menyimpan file `.task` dan Google Fonts (`Poppins`, `Inter`) ke Cache Storage.

---

## 3. Pengujian Sensor HP via HTTPS Lokal

Browser smartphone **memblokir** `DeviceMotionEvent` dan `getUserMedia` melalui HTTP biasa. Gunakan salah satu opsi HTTPS berikut saat menguji di HP melalui WiFi:
- **Opsi 1:** Aktifkan `@vitejs/plugin-basic-ssl` pada `vite.config.ts` lalu buka `https://<IP-LAPTOP>:5173` di HP.
- **Opsi 2:** Jalankan tunnel `cloudflared tunnel --url http://localhost:5173` atau `ngrok http 5173`.

---

## 4. Verifikasi Sebelum Commit & Push

```bash
cd ..
npm --prefix frontend run build
# Perbarui docs/changelogs/CHANGELOG_TIARA.md (atau CHANGELOG_IBRA.md)
npm run guard
```
