# ARCHITECTURE.md — Arsitektur Sistem CampusFlow (PRD v4.0)

> **STATUS:** SUMBER KEBENARAN ARSITEKTURAL (Dikelola di `main` → Diturunkan ke `backend` & `frontend`)  
> **VERSI:** 4.0 (*Academic Strava, Zero Continuous Camera, & Predictive Burnout Management*)  
> **KONTRIBUTOR ARSITEKTUR:** Ibra (`@flyingdutchman` — Project Leader & Vision AI)

---

## 1. Topologi Sistem 4 Lapis (PRD v4.0)

CampusFlow membagi pemrosesan sistem menjadi empat lapis terpisah untuk menjamin **privasi pengguna 100%**, efisiensi daya komputasi, dan fusi parameter tunggal yang holistik:

```
┌──────────────────────────────────────────────────────────────────────────────┐
│ LAPIS 1 — PRIVACY-PRESERVING EDGE SENSING (100% On-Device Browser)           │
│  [Webcam On-Demand] ─► ActiveBreakValidator (MediaPipe Pose WASM)            │
│    • Kamera default OFF; HANYA menyala MAKSIMAL 2 MENIT saat Active Break    │
│    • Verifikasi peregangan (overhead reach, bahu) -> +10 Poin Pemulihan      │
│  [Screen Time Sensor] ─► Page Visibility API (document.hidden & Focus)       │
│    • Melacak waktu layar fokus secara pasif di tab tanpa menyalakan webcam   │
│  [Input Pemulihan]   ─► Log jam tidur harian & sinkronisasi Digital Wellbeing│
└───────────────────────────────────────┬──────────────────────────────────────┘
                                        │ Metrik Harian Ringkas (HTTPS)
┌───────────────────────────────────────▼──────────────────────────────────────┐
│ LAPIS 2 — ACADEMIC STRAVA PWA LAYER (React 18 + Vite + Tailwind + Workbox)   │
│  • Visualisasi 'Academic Strava': Beban Belajar Mingguan vs Pemulihan        │
│  • Metrik Tunggal: Burnout Risk Index (0–100) dengan status Hijau/Kuning/Merah│
│  • Modal Active Break 2 Menit (Timer & Skeleton overlay otomatis mati)       │
│  • Smart Academic Planner: Upload & preview jadwal kuliah / KRS              │
│  • Offline Resilience: LocalStorage / IndexedDB queue + Mock Mode Fallback   │
└───────────────────────────────────────┬──────────────────────────────────────┘
                                        │ REST API /api/v1/* (JWT Bearer)
┌───────────────────────────────────────▼──────────────────────────────────────┐
│ LAPIS 3 — BACKEND SERVICE & BURNOUT SCORING ENGINE (Express TS + Prisma)     │
│  • Burnout Scoring Service:                                                  │
│      Burnout Index = (Academic Load Score + Screen Fatigue) - Recovery Score │
│  • Academic Schedule Manager: Ekstraksi jadwal kuliah, SKS teori vs praktikum │
│  • Database MySQL (Prisma ORM): User, AcademicSchedule, DailyFussionLog,     │
│    ActiveBreakSession, AiCoachingInsight                                     │
│  • Web Push Notifier (VAPID): Pengingat jeda cerdas saat waktu layar tinggi  │
└───────────────────────────────────────┬──────────────────────────────────────┘
                                        │ Konteks 7 Hari + Jadwal Kuliah Esok
┌───────────────────────────────────────▼──────────────────────────────────────┐
│ LAPIS 4 — WELLBEING AI COACH & PROACTIVE FORECAST (Ollama Lokal /api/chat)   │
│  • Model lokal (campusflow-coach via Qwen2.5) dengan format JSON terstruktur │
│  • Proactive Forecast: Rekomendasi istirahat malam berbasis beban kuliah esok│
│  • Crisis Gateway: Deteksi darurat distres berat -> Rujukan Hotline 119      │
│  • Guardrail Deterministik: Rekomendasi gerak aman dari beban malam hari     │
└──────────────────────────────────────────────────────────────────────────────┘
```

---

## 2. Aliran Data End-to-End

```
[ PDF KRS ] ──────────────► [ /api/v1/academic-schedule ] ──┐
                                                            │
[ SCREEN TIME (document.hidden) ] ──► [ Local Tracker ] ────┼──► [ BURNOUT SCORING ENGINE ]
                                                            │         │
[ KAMERA BREAK 2 MENIT ] ──► [ /api/v1/active-break ] ──────┤         ▼
                                                            │   Burnout Risk Index (0–100)
[ LOG TIDUR & HARIAN ] ────► [ /api/v1/wellbeing ] ─────────┘         │
                                                                      ▼
                                                            [ DASHBOARD STRAVA ]
                                                            [ OLLAMA PROACTIVE COACH ]
```

1. **Input Jadwal Kuliah & Beban Akademik:**
   - Mahasiswa mengunggah file PDF atau screenshot jadwal kuliah di awal semester.
   - Sistem menyimpan daftar mata kuliah ke database (`POST /api/v1/academic-schedule`).
   - Setiap hari, bobot SKS dihitung otomatis: SKS Teori ($1.0$), Praktikum ($1.5$), dan pekan ujian ($+3.0$).
2. **Pelacakan Waktu Layar Pasif (Screen Time):**
   - Menggunakan Page Visibility API (`document.hidden`) dan event `focus`/`blur` di browser.
   - Durasi layar di atas $8\text{ jam/hari}$ otomatis dikonversi menjadi poin penalti *Screen Time Fatigue* ($(\text{Jam} - 8) \times 2.5$).
3. **Jeda Aktif Terverifikasi Kamera 2 Menit (Active Break):**
   - Setelah waktu layar kontinu $> 90$ menit, muncul notifikasi jeda.
   - Mahasiswa menekan *"Mulai Active Break"* $\rightarrow$ kamera menyala selama 2 menit.
   - MediaPipe Pose memvalidasi gerakan peregangan (*overhead arm reach*) $\rightarrow$ jika lolos, poin pemulihan bertambah $+10$ dan kamera **otomatis mati**.
4. **Perhitungan Burnout Risk Index Harian:**
   - Backend memadukan faktor beban dan pemulihan:
     $$\text{Burnout Index} = (\text{Academic Load} + \text{Screen Fatigue}) - \text{Recovery Score}$$
   - Status dikategorikan: Hijau ($< 40$), Kuning ($40 - 75$), Merah ($> 75$).
5. **Proactive AI Coaching:**
   - AI Coach membaca pola 7 hari dan jadwal kuliah esok hari.
   - Memberikan rekomendasi preventif malam hari (misal menyarankan tidur lebih awal jika esok jadwal praktikum padat) dan mengawal keselamatan dengan rujukan krisis 119.

---

## 3. Arsitektur Isolasi Pengembangan 3 Branch

Untuk menjaga kelancaran kolaborasi monorepo:
- **Branch `main` (Ibra — Leader & Vision AI):** Sumber kebenaran tunggal (`shared/contracts`, `shared/vision`, `docs/universal`, `docs/vision`, `scripts/`, `.github/`) yang diturunkan ke `backend` dan `frontend`.
- **Branch `backend` (Syifa — Backend & AI):** Mengembangkan API Express, Prisma ORM, Burnout Scoring, dan integrasi Ollama secara terisolasi di folder `backend/`.
- **Branch `frontend` (Tiara & Ibra — UI & PWA):** Mengembangkan antarmuka React 18, Tailwind, PWA, dan modul visualisasi di folder `frontend/` dengan dukungan penuh mode offline mock data.
