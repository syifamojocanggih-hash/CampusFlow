# ARCHITECTURE.md — Arsitektur Sistem CampusFlow

> **STATUS:** SUMBER KEBENARAN ARSITEKTURAL (Dikelola di `main` → Diturunkan ke `backend` & `frontend`)  
> **KONTRIBUTOR ARSITEKTUR:** Ibra (`@flyingdutchman` — Project Leader & Vision AI)

---

## 1. Topologi Sistem 4 Lapis

CampusFlow membagi pemrosesan menjadi empat lapis terpisah agar pemrosesan citra kamera dan sensor gerak tetap privat, cepat, serta hemat bandwidth:

```
┌──────────────────────────────────────────────────────────────────────────────┐
│ LAPIS 1 — EDGE SENSING & TELEMETRY EXTRACTION (100% On-Device Browser)       │
│  [Laptop Webcam] ─► MediaPipe PoseLandmarker (33) + FaceMesh (6 mata)        │
│    • Kalibrasi 5 detik (100 frame) · EMA alpha = 0.25 · 24+ FPS              │
│    • Mengeluarkan metrik angka (bukan video/gambar!) via Vision heuristics   │
│  [Smartphone]    ─► HTML5 DeviceMotionEvent (Accelerometer ax, ay, az)       │
│    • Moving-average High-Pass 25 sampel + Anti-Shake (250–1200 ms, >=6 step) │
│    • Mengeluarkan langkah, cadence (SPM), dan kategori intensitas IPAQ-SF    │
└───────────────────────────────────────┬──────────────────────────────────────┘
                                        │ JSON Metrik Ringkas (HTTPS)
┌───────────────────────────────────────▼──────────────────────────────────────┐
│ LAPIS 2 — PROGRESSIVE WEB APP LAYER (React 18 + Vite + Tailwind + Workbox)   │
│  • 10 Layar UI responsif (Mobile <640px fokus Pedometer; Desktop >1024px 3-col)│
│  • ActiveBreakModal Anti-Cheat · TriadDashboard · PanicReliefMode 15 menit   │
│  • Offline Resilience: LocalStorage/IndexedDB queue + lokal .task cache      │
└───────────────────────────────────────┬──────────────────────────────────────┘
                                        │ REST API /api/v1/* (JWT Bearer)
┌───────────────────────────────────────▼──────────────────────────────────────┐
│ LAPIS 3 — BACKEND SERVICE & CLINICAL SCORING ENGINE (Express TS + Prisma)    │
│  • ClinicalScoring: PSS-4 (reverse Q2,Q3), PSS-10 (4,5,7,8), PSQI, IPAQ METs │
│  • 24-Hour Movement Evaluator (MVPA + Tidur + Sedentary Ratio)               │
│  • Persistence: MySQL via Prisma ORM (6 tabel relasional + 14-day seed)      │
│  • Push Notifier: Web Push Notification (VAPID Keys) untuk jeda aktif        │
└───────────────────────────────────────┬──────────────────────────────────────┘
                                        │ Telemetry 7 Hari + Prompt Klinis
┌───────────────────────────────────────▼──────────────────────────────────────┐
│ LAPIS 4 — AGENTIC WELLBEING AI COACH (Ollama Lokal /api/chat + Fallback)     │
│  • format JSON Schema ketat (tanpa API key berbayar / data keluar cloud)     │
│  • Mengidentifikasi mediator dominan (SLEEP_MEDIATION_DEFICIT, dll.)         │
│  • Menghasilkan resep substitusi isotemporal 10–20 menit + sitasi ilmiah     │
└──────────────────────────────────────────────────────────────────────────────┘
```

---

## 2. Aliran Data End-to-End

1. **Sesi Belajar Laptop (Vision Guard):**
   - Mahasiswa menjalankan **Kalibrasi 5 Detik** → objek `PostureBaseline` disimpan di state/LocalStorage & dikirim ke `PATCH /api/v1/vision/baseline`.
   - Saat belajar, `poseHeuristics.ts` mengevaluasi postur setiap 500 ms (2 Hz).
   - Bila duduk kontinu mencapai ambang (50 menit normal / 15 detik `DEMO_MODE`), **ActiveBreakModal** mengunci UI hingga pengguna menyelesaikan 3 repetisi *Overhead Arm Stretch* dan berdiri/menjauh.
   - Ringkasan sesi (`durationMinutes`, `slouchCount`, `tooCloseCount`, `avgNeckRatio`, `breakCompleted`) dikirim ke `POST /api/v1/sedentary/sessions`.

2. **Mobilitas Kampus (Mobile Pedometer):**
   - Mahasiswa mengaktifkan sensor gerak di HP (HTTPS).
   - `PedometerProcessor` menghitung langkah, SPM, dan intensitas (`WALKING` 3.3 / `MODERATE` 4.0 / `VIGOROUS` 8.0 METs), lalu menyinkronkan ke `POST /api/v1/activities`.

3. **Check-in Stres & AI Coach:**
   - Mahasiswa mengisi **PSS-4 Harian** + kualitas tidur (`POST /api/v1/wellbeing/daily`).
   - Backend menghitung skor terbalik (*reverse scoring*), rasio `mvpaPerSedentaryRatio`, dan jumlah pilar *24-Hour Movement* (0–3).
   - Ketika mahasiswa membuka **AI Coach** (`POST /api/v1/ai-coach/generate`), backend merangkum data 7 hari ke server Ollama lokal (`OLLAMA_BASE_URL/api/chat`) dengan fallback klinis otomatis dan menyimpan hasilnya di tabel `AiCoachingInsight`.

---

## 3. Arsitektur Isolasi Pengembangan 3 Branch

Agar pengembangan paralel tidak saling merusak:
- **Branch `main` (Ibra):** Menyimpan fondasi bersama (`shared/contracts`, `shared/vision`, `docs/universal`, `docs/vision`, `scripts/`, `.github/`) yang diturunkan ke `backend` dan `frontend`.
- **Branch `backend` (Syifa):** Mengembangkan `backend/` secara terisolasi (termasuk `backend/package.json` & `backend/package-lock.json` tersendiri).
- **Branch `frontend` (Tiara + kolaborasi Ibra):** Mengembangkan `frontend/` secara terisolasi (termasuk `frontend/package.json` & `frontend/package-lock.json` tersendiri) dan dapat berjalan mandiri menggunakan `docs/frontend/MOCK_DATA.md`.
