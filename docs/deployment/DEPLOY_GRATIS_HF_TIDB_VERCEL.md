# Panduan Deploy Gratis 100% CampusFlow + Gemma 3 4B Online (Rp0, Tanpa Kartu Kredit)

Arsitektur gratis ini menggabungkan:
1. **Hugging Face Model Hub** — tempat menyimpan file model `gemma-3-4b-it.Q4_K_M.gguf` (`2.49 GB`).
2. **TiDB Cloud Starter** — database MySQL 8 kompatibel Prisma (Gratis `5 GiB`, tanpa kartu kredit).
3. **Hugging Face Spaces (Docker, CPU Basic Free)** — menjalankan **Backend Express + Ollama + Gemma 3 4B** dalam 1 container (`16 GB RAM`, port `7860`, tanpa kartu kredit).
4. **Vercel** — hosting Frontend React PWA (Gratis, HTTPS otomatis).

---

## Langkah 1 — Upload File `.gguf` ke Hugging Face Model Hub
1. Daftar / login di [huggingface.co](https://huggingface.co).
2. Klik **New Model** → beri nama (misalnya `campusflow-gemma3-4b-gguf`) → pilih **Public** (atau Private) → **Create model**.
3. Masuk tab **Files and versions** → **+ Contribute → Upload files** → unggah `backend/ollama/gemma-3-4b-it.Q4_K_M.gguf` (`2.49 GB`).
4. Salin URL download langsungnya (klik kanan tombol download → Copy Link Address), formatnya seperti ini:
   ```text
   https://huggingface.co/<USERNAME_HF>/campusflow-gemma3-4b-gguf/resolve/main/gemma-3-4b-it.Q4_K_M.gguf
   ```

---

## Langkah 2 — Buat Database MySQL Gratis di TiDB Cloud
1. Daftar / login di [tidbcloud.com](https://tidbcloud.com) (bisa login pakai GitHub/Google, tanpa kartu kredit).
2. Buat cluster **TiDB Cloud Starter** (Serverless Free) → pilih region terdekat (misal Singapore).
3. Klik **Connect** → pilih format **Prisma** / **MySQL** → generate password → salin `DATABASE_URL`-nya, formatnya:
   ```text
   mysql://<USER>:<PASSWORD>@gateway01.ap-southeast-1.prod.aws.tidbcloud.com:4000/test?sslaccept=strict
   ```
   *(Disarankan membuat database baru `campusflow` atau langsung pakai `/test` / `/campusflow` sesuai nama DB yang dibuat di TiDB.)*

---

## Langkah 3 — Deploy Backend + Ollama + Gemma ke Hugging Face Space
1. Di [huggingface.co/spaces](https://huggingface.co/spaces), klik **New Space**.
2. Isi konfigurasi:
   - **Space name:** `campusflow-api`
   - **Select the Space SDK:** **Docker** → **Blank**
   - **Space hardware:** **CPU basic · 2 vCPU · 16 GB** *(FREE)*
   - **Visibility:** Public
3. Clone Space barumu atau push file dari repo CampusFlow ke Space tersebut (`Dockerfile`, `.dockerignore`, `deploy/`, `shared/`, `backend/`), dan pastikan **`README.md` di Space Hugging Face** memakai header YAML berikut di baris paling atas:
   ```yaml
   ---
   title: CampusFlow Backend & AI Coach
   emoji: 🌿
   colorFrom: green
   colorTo: gray
   sdk: docker
   app_port: 7860
   ---
   ```
   > Cara paling mudah mendorong repo ini ke HF Space tanpa mengubah `README.md` GitHub:
   > Di dashboard Space → **Files → Upload files** atau clone repo Space terpisah, lalu salin isi repo CampusFlow ke sana dan edit `README.md`-nya saja untuk diisi header YAML di atas.
4. Masuk ke **Space → Settings → Variables and secrets**:
   - **New Secret:**
     - `DATABASE_URL` = URL MySQL dari TiDB Cloud (Langkah 2)
     - `JWT_SECRET` = string acak minimal 32 karakter
     - `GEMINI_API_KEY` = API key Gemini (opsional, untuk parser KRS PDF)
     - `HF_TOKEN` = *(isi hanya jika repo model HF di Langkah 1 diset Private)*
   - **New Variable:**
     - `MODEL_GGUF_URL` = URL file `.gguf` dari Langkah 1
     - `OLLAMA_TIMEOUT_MS` = `180000`
     - `CORS_ORIGIN` = `https://<NAMA-PROJECT-VERCEL-KAMU>.vercel.app`
5. Tunggu Space selesai build dan statusnya berubah menjadi **Running**.
   - Catat URL langsung Space kamu (klik titik tiga `⋮` di kanan atas Space → **Embed this Space** → **Direct URL**), formatnya:
     ```text
     https://<USERNAME_HF>-campusflow-api.hf.space
     ```
   - Uji di browser: buka `https://<USERNAME_HF>-campusflow-api.hf.space/api/v1/health` → harus muncul `"status":"healthy"` dan `"database":"connected"`.

---

## Langkah 4 — Deploy Frontend ke Vercel
1. Login ke [vercel.com](https://vercel.com) → **Add New Project** → pilih repo GitHub `CampusFlow`.
2. Atur konfigurasi build:
   - **Root Directory:** `frontend`
   - **Framework Preset:** `Vite`
   - **Build Command:** `npm run build`
   - **Output Directory:** `dist`
3. Di **Environment Variables**, isi:
   - `VITE_USE_MOCK` = `false`
   - `VITE_API_BASE_URL` = `https://<USERNAME_HF>-campusflow-api.hf.space/api/v1`
4. Klik **Deploy**. Setelah selesai, update variable `CORS_ORIGIN` di HF Space agar persis sama dengan URL Vercel yang baru terbit.

---

## Catatan Penting Penggunaan Gratis
- **Startup pertama HF Space** akan mengunduh `2.49 GB` `.gguf` dari HF Hub ke Ollama (~1–3 menit di jaringan datacenter Hugging Face).
- **Kecepatan inferensi CPU Basic (2 vCPU):** 1 respons AI Coach membutuhkan ~30–60 detik (`OLLAMA_TIMEOUT_MS=180000`). Selama waktu tersebut, UI tetap normal dan jika lewat batas waktu akan otomatis memakai fallback klinis tanpa error.
- **Cold Start:** Jika Space tidak dibuka selama 48 jam, HF akan mem-pause container dan otomatis menyalakannya kembali (~30–60 detik) saat link diakses lagi.
