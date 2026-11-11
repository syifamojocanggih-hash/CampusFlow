# DESIGN.md — Master Design, Architecture & Multi-User Governance (CampusFlow)

> **STATUS:** Dokumen Rancangan Induk & Tata Kelola Repositori  
> **VERSI:** 3.0 (Engineering Blueprint & 3-Branch Collaboration Guide)  
> **PENYUSUN AWAL (`main`):** Ibra (`@flyingdutchman` — Project Leader & Vision AI) bersama arsitektur AI  

---

## 1. Tujuan Dokumen Ini

`DESIGN.md` adalah ringkasan desain sistem sekaligus peta kendali kolaborasi **CampusFlow** (*AI-Driven Active Wellbeing & Stress Management PWA*). Dokumen ini menjawab dua kebutuhan sekaligus:
1. **Rancangan Teknis & Desain Produk** berdasarkan PRD Versi 3.0 (Vision AI MediaPipe, Pedometer 3-Sumbu IPAQ-SF, Rubrik Klinis PSS-4/PSS-10/PSQI, Prisma MySQL, Gemini 2.5 Flash AI Coach, serta UI/UX *Calm & Supportif*).
2. **Tata Kelola 3 Branch (`main`, `backend`, `frontend`) & Changelog Per-User** agar tiga pengembang (**Ibra**, **Tiara**, dan **Syifa**) dapat bekerja paralel dengan cepat, fleksibel bila diperlukan perubahan lintas file, dan **bebas konflik saat merge ke `main`**.

---

## 2. Arsitektur 3 Branch & Distribusi File Anti-Konflik

```
                         ┌─────────────────────────────────────┐
                         │                main                 │
                         │  Project Leader & Vision AI: Ibra   │
                         │         (@flyingdutchman)           │
                         │                                     │
                         │  • Fondasi Master (README, DESIGN)  │
                         │  • Kontrak Universal & PRD          │
                         │  • Modul & Spec AI Vision           │
                         │  • Guard Script, Hooks, CI          │
                         └──────────────┬───────────┬──────────┘
                      diturunkan ke     │           │    diturunkan ke
                     (git merge main)   ▼           ▼   (git merge main)
                   ┌────────────────────────┐   ┌────────────────────────┐
                   │        backend         │   │        frontend        │
                   │  Backend & LLM: Syifa  │   │  Frontend: Tiara       │
                   │ (@syifamojocanggih-hash│   │ (@mutiaradewanda)      │
                   │                        │   │  + kolaborasi Ibra     │
                   │ • backend/*            │   │ • frontend/*           │
                   │ • docs/backend/*       │   │ • docs/frontend/*      │
                   │ • CHANGELOG_SYIFA.md   │   │ • CHANGELOG_TIARA.md   │
                   └────────────┬───────────┘   │ • CHANGELOG_IBRA.md    │
                                │               └───────────┬────────────┘
                                │         Pull Request      │
                                └──────────────►◄───────────┘
                                         Integrasi ke main
                                       (Zero-Conflict Merge)
```

### 2.1 Klasifikasi File: Apa yang Dibuat di `main` vs Khusus Branch

| Kategori | Lokasi File / Direktori | Dibuat & Dikelola Di | Tujuan Desain Anti-Konflik |
|---|---|---|---|
| **Tier 1: Fondasi Master & Kontrak** *(Diturunkan ke Branch)* | `README.md`, `DESIGN.md`, `package.json`, `.gitignore`, `.gitattributes`, `.github/`, `.githooks/`, `scripts/`, `shared/`, `docs/README.md`, `docs/universal/*`, `docs/vision/*` | **`main`** (oleh **Ibra** `@flyingdutchman`) | Dibuat satu kali di `main` sebagai *Single Source of Truth*, lalu diturunkan ke `backend` dan `frontend`. Branch peran tidak membuat versi ganda dari file kontrak ini. |
| **Tier 2A: Domain Backend & LLM** *(Eksklusif saat Merge)* | `backend/` *(termasuk `backend/package-lock.json`)*, `docs/backend/*` | **`backend`** (oleh **Syifa** `@syifamojocanggih-hash`) | Seluruh kode server Express, Prisma, Scoring, dan Gemini AI terisolasi di folder `backend/`. Tidak pernah bersentuhan dengan folder `frontend/`. |
| **Tier 2B: Domain Frontend & PWA** *(Eksklusif saat Merge)* | `frontend/` *(termasuk `frontend/package-lock.json`)*, `docs/frontend/*` | **`frontend`** (oleh **Tiara** `@mutiaradewanda`, serta kolaborasi **Ibra** `@flyingdutchman`) | Seluruh komponen React, Tailwind, PWA, Pedometer, dan integrasi UI Vision terisolasi di folder `frontend/`. Tiara dan Ibra bebas berbagi kode di dalam `frontend/`. |
| **Tier 3: Changelog Terpisah Per-User** *(Anti-Tabrakan Histori)* | `docs/changelogs/CHANGELOG_IBRA.md`<br>`docs/changelogs/CHANGELOG_TIARA.md`<br>`docs/changelogs/CHANGELOG_SYIFA.md` | Masing-masing pemilik di branch aktifnya | Setiap user hanya menulis di file Changelog miliknya sendiri. Saat `backend` dan `frontend` di-merge ke `main`, file changelog **tidak pernah bentrok**. |

> **Kunci Teknis Anti-Konflik Lockfile:**  
> `backend/` dan `frontend/` sengaja memakai `package.json` dan `package-lock.json` **terpisah** (bukan satu `package-lock.json` tunggal di root). Menginstal library di `backend` tidak akan memicu konflik dengan instalasi library di `frontend`.

---

## 3. Aturan Wewenang Fleksibel & Syarat Wajib Changelog

Proyek ini menganut model **Fleksibel dengan Akuntabilitas Changelog**:

1. **Zona Default Masing-Masing User:**
   - **Ibra (`@flyingdutchman`):** Memimpin `main`, bertanggung jawab atas **AI Vision** (`docs/vision/`, `shared/vision/`), kontrak universal (`docs/universal/`, `shared/contracts/`), dan meninjau integrasi PR. Juga berhak berkolaborasi langsung di `frontend` saat menyambungkan modul Vision ke UI.
   - **Tiara (`@mutiaradewanda`):** Bertanggung jawab penuh atas `frontend/` dan `docs/frontend/` di branch `frontend` (UI/UX, Dashboard, Pedometer, Kuesioner, AI Coach UI, PWA). Bebas berbagi modul di dalam `frontend/` bersama Ibra.
   - **Syifa (`@syifamojocanggih-hash`):** Bertanggung jawab penuh atas `backend/` dan `docs/backend/` di branch `backend` (Express API, Prisma MySQL, Clinical Scoring, Gemini 2.5 Flash AI Coach, Web Push VAPID).

2. **Boleh Mengubah File di Luar Zona Default (Aturan Fleksibel):**
   - Setiap anggota **diperbolehkan** mengubah file di luar zona default-nya jika memang mendesak atau dibutuhkan untuk menyelesaikan integrasi/bug.
   - **SYARAT MUTLAK:** Perubahan tersebut **WAJIB** dicatat di **Changelog milik user sendiri** (`docs/changelogs/CHANGELOG_<NAMA>.md`) dengan menyertakan:
     - Tag **`[CROSS-SCOPE]`**
     - **Path lengkap file** lintas zona yang diubah
     - **Alasan teknis** perubahan tersebut
     - Pemberitahuan pada deskripsi **Pull Request** menuju `main` agar tidak menimbulkan konflik tersembunyi.

3. **Penegakan Otomatis (`scripts/guard-check.mjs`):**
   - Berjalan otomatis sebelum `git push` (via `.githooks/pre-push`), secara manual (`npm run guard`), dan di GitHub Actions PR (`.github/workflows/guard-check.yml`).
   - Memblokir push/PR jika perubahan kode/dokumen **tidak disertai pembaruan pada Changelog pribadi**.
   - Memblokir push/PR jika terdapat perubahan lintas zona yang **belum dicatat dengan tag `[CROSS-SCOPE]`** di Changelog pribadi.

---

## 4. Ringkasan Desain Arsitektur Sistem

### 4.1 Empat Lapisan Sistem CampusFlow

```
┌────────────────────────────────────────────────────────────────────────────┐
│ LAPIS 1 — EDGE SENSING (100% On-Device di Browser Pengguna)                │
│  • Laptop Webcam: MediaPipe PoseLandmarker (33 titik) + FaceMesh (6 mata)  │
│    - Kalibrasi 5 detik (100 frame) + EMA Smoothing (alpha = 0.25)          │
│    - Output: postureMetrics, slouchCount, activeBreakVerified              │
│  • Smartphone HP: HTML5 DeviceMotionEvent (Accelerometer 3-Axis DSP)       │
│    - High-Pass Moving Average (25 sampel) + Anti-Shake (250–1200 ms)       │
│    - Output: stepsCount, cadenceSpm, IPAQ-SF intensity & MET-minutes       │
├────────────────────────────────────────────────────────────────────────────┤
│ LAPIS 2 — PWA CLIENT LAYER (React 18 + Vite + Tailwind CSS + Workbox)      │
│  • 10 Layar Utama (Triad Dashboard, VisionGuard, ActiveBreakModal, dll.)   │
│  • Offline Cache: pose_landmarker_lite.task lokal + LocalStorage/IndexedDB │
│  • Graceful Degradation: UI adaptif jika tanpa webcam / tanpa sensor gerak │
├────────────────────────────────────────────────────────────────────────────┤
│ LAPIS 3 — BACKEND SERVICE & CLINICAL ENGINE (Express TS + Prisma + MySQL)  │
│  • Clinical Scoring Service: PSS-4 (reverse Q2,Q3), PSS-10 (4,5,7,8), PSQI │
│  • 24-Hour Movement Triad Calculator (MVPA + Tidur + Sedentary Ratio)     │
│  • Web Push Notifier (VAPID) + JWT Auth (bcryptjs) + 14-Day Demo Seeder   │
├────────────────────────────────────────────────────────────────────────────┤
│ LAPIS 4 — AGENTIC WELLBEING AI COACH (Google Gemini 2.5 Flash)             │
│  • @google/genai Structured JSON Outputs (responseSchema ketat)            │
│  • System Prompt terkunci pada temuan Martín-Rodríguez & González-Prieto   │
└────────────────────────────────────────────────────────────────────────────┘
```

### 4.2 Prinsip Desain UI/UX (*Calm & Supportif*)

| Elemen Desain | Ketetapan Visual |
|---|---|
| **Filosofi** | *Calm & Supportif* (hindari blok merah agresif), *Low Cognitive Load* (1 layar = 1 aksi utama), *Mobile-first, Desktop-enhanced*. |
| **Palet Warna** | Primary `#2563EB`, Secondary/Calm `#0EA5A4`, Success `#22C55E`, Warning `#F59E0B`, Danger (halus/aksen kecil) `#EF4444`, Background `#F8FAFC`, Text `#1E293B`. |
| **Tipografi** | Heading: `Poppins SemiBold`; Body & Angka Sensor: `Inter Regular/Medium`; Skala Tailwind standar `text-xs` (12px) s.d. `text-2xl` (28px). |
| **Komponen Khas** | *Status Pill* (Optimal/Waspada/Tinggi), *Progress Ring* MET harian, *Toast Halus* + border tipis peringatan postur (bukan pop-up mengganggu, kecuali *Active Break*). |
| **Responsivitas** | `< 640px (sm)`: 1 kolom (fokus Pedometer + Kuesioner); `640–1024px (md)`: 2 kolom; `> 1024px (lg)`: 3 kolom (*VisionGuard + TriadDashboard + AI Coach*). |

---

## 5. Peta Dokumen Lengkap (`docs/`)

Seluruh detail rekayasa berada di folder [`docs/`](docs/README.md):
- **Kontrak & Spesifikasi Global (`main`):** [`docs/universal/PRD.md`](docs/universal/PRD.md), [`ARCHITECTURE.md`](docs/universal/ARCHITECTURE.md), [`BOUNDARIES_AND_CONTRACTS.md`](docs/universal/BOUNDARIES_AND_CONTRACTS.md), [`INTERFACES.md`](docs/universal/INTERFACES.md), [`GIT_WORKFLOW.md`](docs/universal/GIT_WORKFLOW.md), [`INTEGRATION_RUNBOOK.md`](docs/universal/INTEGRATION_RUNBOOK.md), [`DECISIONS.md`](docs/universal/DECISIONS.md), [`ROADMAP.md`](docs/universal/ROADMAP.md).
- **Domain Vision AI (`main` — Ibra):** [`docs/vision/README.md`](docs/vision/README.md), [`VISION_SPEC.md`](docs/vision/VISION_SPEC.md), [`TASK_GUIDE.md`](docs/vision/TASK_GUIDE.md).
- **Domain Backend & LLM (`backend` — Syifa):** [`docs/backend/README.md`](docs/backend/README.md), [`TASK_GUIDE.md`](docs/backend/TASK_GUIDE.md), [`DATABASE_SCHEMA.md`](docs/backend/DATABASE_SCHEMA.md), [`API_SPECIFICATION.md`](docs/backend/API_SPECIFICATION.md), [`CLINICAL_SCORING.md`](docs/backend/CLINICAL_SCORING.md), [`LLM_AI_COACH.md`](docs/backend/LLM_AI_COACH.md), [`SETUP.md`](docs/backend/SETUP.md).
- **Domain Frontend & PWA (`frontend` — Tiara & Ibra):** [`docs/frontend/README.md`](docs/frontend/README.md), [`TASK_GUIDE.md`](docs/frontend/TASK_GUIDE.md), [`DESIGN_SYSTEM.md`](docs/frontend/DESIGN_SYSTEM.md), [`PAGES_AND_FLOWS.md`](docs/frontend/PAGES_AND_FLOWS.md), [`UI_COMPONENTS.md`](docs/frontend/UI_COMPONENTS.md), [`PEDOMETER_SENSOR.md`](docs/frontend/PEDOMETER_SENSOR.md), [`MOCK_DATA.md`](docs/frontend/MOCK_DATA.md), [`SETUP.md`](docs/frontend/SETUP.md).
- **Changelog Terpisah Per-User:** [`CHANGELOG_IBRA.md`](docs/changelogs/CHANGELOG_IBRA.md), [`CHANGELOG_TIARA.md`](docs/changelogs/CHANGELOG_TIARA.md), [`CHANGELOG_SYIFA.md`](docs/changelogs/CHANGELOG_SYIFA.md).
