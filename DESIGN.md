# DESIGN.md — Master Design, Architecture & Multi-User Governance (CampusFlow)

> **STATUS:** Dokumen Rancangan Induk & Tata Kelola Repositori  
> **VERSI:** 4.0 (*Academic Strava, Zero Continuous Camera, & Predictive Burnout Management Blueprint*)  
> **PENYUSUN AWAL (`main`):** Ibra (`@flyingdutchman` — Project Leader & Vision AI) bersama arsitektur AI  

---

## 1. Tujuan Dokumen Ini

`DESIGN.md` adalah ringkasan desain sistem sekaligus peta kendali kolaborasi **CampusFlow** (*Academic Strava & Predictive Burnout Management PWA*). Dokumen ini menjawab dua kebutuhan sekaligus:
1. **Rancangan Teknis & Desain Produk** berdasarkan **PRD Versi 4.0**:
   - **Zero Continuous Camera:** Kamera laptop default MATI, hanya menyala maksimal 2 menit saat mahasiswa menekan tombol *Active Break* untuk validasi peregangan.
   - **Academic Strava & Burnout Risk Index (0–100):** Fusi parameter terpadu antara Beban Akademik (KRS), Waktu Layar (*Page Visibility API*), dan Pemulihan (Tidur & Jeda Aktif).
   - **Proactive & Predictive AI Coach:** Didukung Ollama lokal (`campusflow-coach`) dengan mitigasi krisis darurat (Hotline 119) dan analisis beban preventif esok hari.
2. **Tata Kelola 3 Branch (`main`, `backend`, `frontend`) & Changelog Per-User** agar tiga pengembang (**Ibra**, **Tiara**, dan **Syifa**) dapat bekerja paralel dengan cepat, fleksibel bila diperlukan perubahan lintas file, dan **bebas konflik saat merge ke `main`**.

---

## 2. Tiga Pilar Pivot Paradigma (PRD v4.0)

```
┌────────────────────────────────────────────────────────────────────────┐
│                   TIGA PILAR PIVOT PARADIGMA (v4.0)                    │
├────────────────────────────────┬───────────────────────────────────────┤
│ 1. ZERO CONTINUOUS CAMERA      │ Kamera laptop default OFF.            │
│    (Privasi 100% Terjaga)      │ Kamera HANYA menyala MAKSIMAL 2 MENIT │
│                                │ saat tombol 'Active Break' ditekan    │
│                                │ untuk validasi pose peregangan.       │
├────────────────────────────────┼───────────────────────────────────────┤
│ 2. KONSEP 'STRAVA AKADEMIK'    │ Stres dihitung dari penggabungan fusi │
│    & FUSI PARAMETER TUNGGAL    │ 4 variabel harian: Jam Tidur, Layar,  │
│    BURNOUT RISK INDEX (0–100)  │ Jeda Aktif, & Academic Load (KRS).    │
├────────────────────────────────┼───────────────────────────────────────┤
│ 3. PROACTIVE AI COACHING       │ AI Coach mendampingi mahasiswa secara │
│    (Analisis Beban Belajar)    │ terstruktur: menganalisis keluhan     │
│                                │ fisik, mitigasi krisis darurat (119), │
│                                │ dan rekomendasi preventif esok hari.  │
└────────────────────────────────┴───────────────────────────────────────┘
```

---

## 3. Arsitektur 3 Branch & Distribusi File Anti-Konflik

```
                         ┌─────────────────────────────────────┐
                         │                main                 │
                         │  Project Leader & Vision AI: Ibra   │
                         │         (@flyingdutchman)           │
                         │                                     │
                         │  • Fondasi Master (README, DESIGN)  │
                         │  • Kontrak Universal & PRD v4.0     │
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

### 3.1 Klasifikasi File: Apa yang Dibuat di `main` vs Khusus Branch

| Kategori | Lokasi File / Direktori | Dibuat & Dikelola Di | Tujuan Desain Anti-Konflik |
|---|---|---|---|
| **Tier 1: Fondasi Master & Kontrak** *(Diturunkan ke Branch)* | `README.md`, `DESIGN.md`, `package.json`, `.gitignore`, `.gitattributes`, `.github/`, `.githooks/`, `scripts/`, `shared/`, `docs/README.md`, `docs/universal/*`, `docs/vision/*` | **`main`** (oleh **Ibra** `@flyingdutchman`) | Dibuat satu kali di `main` sebagai *Single Source of Truth*, lalu diturunkan ke `backend` dan `frontend`. Branch peran tidak membuat versi ganda dari file kontrak ini. |
| **Tier 2A: Domain Backend & LLM** *(Eksklusif saat Merge)* | `backend/` *(termasuk `backend/package-lock.json`)*, `docs/backend/*` | **`backend`** (oleh **Syifa** `@syifamojocanggih-hash`) | Seluruh kode server Express, Prisma, Burnout Scoring, dan Ollama AI terisolasi di folder `backend/`. Tidak pernah bersentuhan dengan folder `frontend/`. |
| **Tier 2B: Domain Frontend & PWA** *(Eksklusif saat Merge)* | `frontend/` *(termasuk `frontend/package-lock.json`)*, `docs/frontend/*` | **`frontend`** (oleh **Tiara** `@mutiaradewanda`, serta kolaborasi **Ibra** `@flyingdutchman`) | Seluruh komponen React, Tailwind, PWA, Screen Time Tracker, dan integrasi UI Active Break terisolasi di folder `frontend/`. |
| **Tier 3: Changelog Terpisah Per-User** *(Anti-Tabrakan Histori)* | `docs/changelogs/CHANGELOG_IBRA.md`<br>`docs/changelogs/CHANGELOG_TIARA.md`<br>`docs/changelogs/CHANGELOG_SYIFA.md` | Masing-masing pemilik di branch aktifnya | Setiap user hanya menulis di file Changelog miliknya sendiri. Saat `backend` dan `frontend` di-merge ke `main`, file changelog **tidak pernah bentrok**. |

---

## 4. Ringkasan Desain Arsitektur Sistem (PRD v4.0)

### 4.1 Empat Lapisan Sistem CampusFlow

```
┌────────────────────────────────────────────────────────────────────────────┐
│ LAPIS 1 — PRIVACY-PRESERVING SENSING & TELEMETRY (100% On-Device)           │
│  • On-Demand Webcam (ActiveBreakValidator): MediaPipe Pose WASM             │
│    - Kamera default OFF; HANYA hidup maksimal 2 menit saat jeda aktif       │
│    - Verifikasi peregangan (overhead reach, bahu) -> +10 poin pemulihan     │
│  • Screen Time Tracking: Browser Page Visibility API (document.hidden)      │
│    - Melacak waktu fokus aktif di tab CampusFlow tanpa kamera               │
│  • Input Akademik & Pemulihan: PDF KRS Parser + Log Durasi Tidur           │
├────────────────────────────────────────────────────────────────────────────┤
│ LAPIS 2 — ACADEMIC STRAVA PWA CLIENT (React 18 + Vite + Tailwind + PWA)    │
│  • Dashboard Strava Akademik (Burnout Risk Index 0–100, Beban vs Recovery) │
│  • Modal Active Break 2 Menit (Timer & Skeleton Tracker otomatis mati)     │
│  • Smart Academic Planner (Upload & visualisasi jadwal kuliah mingguan)    │
│  • Mode Offline Resilience: LocalStorage / IndexedDB queue                 │
├────────────────────────────────────────────────────────────────────────────┤
│ LAPIS 3 — BACKEND SERVICE & BURNOUT SCORING ENGINE (Express TS + Prisma)   │
│  • Burnout Scoring Service: Fusi Academic Load + Screen Fatigue - Recovery │
│  • REST API /api/v1/*: /academic-schedule, /burnout, /active-break         │
│  • Database MySQL (Prisma ORM): User, AcademicSchedule, DailyFussionLog,   │
│    ActiveBreakSession, AiCoachingInsight                                   │
│  • Web Push Notifier (VAPID): Notifikasi jeda cerdas saat screen time tinggi│
├────────────────────────────────────────────────────────────────────────────┤
│ LAPIS 4 — WELLBEING AI COACH & PROACTIVE FORECAST (Ollama Lokal /api/chat) │
│  • Model lokal (campusflow-coach via Qwen2.5) dengan format JSON Schema    │
│  • Crisis Gateway terpadu (Hotline 119 / healing119.id untuk kondisi darurat)│
│  • Panduan gerak terverifikasi & analisis beban preventif jadwal esok hari │
└────────────────────────────────────────────────────────────────────────────┘
```

### 4.2 Formulasi Inti: Burnout Risk Index (0–100)

$$\text{Burnout Risk Index} = (\text{Academic Load Score} + \text{Screen Time Fatigue}) - \text{Recovery Score}$$

- **Academic Load (AL):** $\sum (\text{SKS} \times \text{Bobot}) + \text{Penalti Ujian}$ (Teori 1.0, Praktikum 1.5, H-7 Ujian +3.0)
- **Screen Time Fatigue (ST):** $\max(0, \text{Total Jam Layar} - 8.0) \times 2.5$
- **Recovery Score (RS):** $\min(40, (\text{Jam Tidur} / 8.0) \times 40) + (\text{Active Break Terverifikasi} \times 10)$
- **Status Risiko:** Hijau ($< 40$, Aman/Optimal), Kuning ($40 - 75$, Waspada), Merah ($> 75$, Risiko Tinggi).

---

## 5. Peta Dokumen Lengkap (`docs/`)

Seluruh detail rekayasa berada di folder [`docs/`](docs/README.md):
- **Kontrak & Spesifikasi Global (`main`):** [`docs/universal/PRD.md`](docs/universal/PRD.md), [`PRD_V4_PIVOT_EXPLANATION.md`](docs/universal/PRD_V4_PIVOT_EXPLANATION.md), [`ARCHITECTURE.md`](docs/universal/ARCHITECTURE.md), [`BOUNDARIES_AND_CONTRACTS.md`](docs/universal/BOUNDARIES_AND_CONTRACTS.md), [`INTERFACES.md`](docs/universal/INTERFACES.md), [`GIT_WORKFLOW.md`](docs/universal/GIT_WORKFLOW.md), [`INTEGRATION_RUNBOOK.md`](docs/universal/INTEGRATION_RUNBOOK.md), [`DECISIONS.md`](docs/universal/DECISIONS.md), [`ROADMAP.md`](docs/universal/ROADMAP.md).
- **Domain Vision AI (`main` — Ibra):** [`docs/vision/README.md`](docs/vision/README.md), [`VISION_SPEC.md`](docs/vision/VISION_SPEC.md), [`TASK_GUIDE.md`](docs/vision/TASK_GUIDE.md).
- **Domain Backend & LLM (`backend` — Syifa):** [`docs/backend/README.md`](docs/backend/README.md), [`TASK_GUIDE.md`](docs/backend/TASK_GUIDE.md), [`DATABASE_SCHEMA.md`](docs/backend/DATABASE_SCHEMA.md), [`API_SPECIFICATION.md`](docs/backend/API_SPECIFICATION.md), [`CLINICAL_SCORING.md`](docs/backend/CLINICAL_SCORING.md), [`LLM_AI_COACH.md`](docs/backend/LLM_AI_COACH.md), [`SETUP.md`](docs/backend/SETUP.md).
- **Domain Frontend & PWA (`frontend` — Tiara & Ibra):** [`docs/frontend/README.md`](docs/frontend/README.md), [`TASK_GUIDE.md`](docs/frontend/TASK_GUIDE.md), [`DESIGN_SYSTEM.md`](docs/frontend/DESIGN_SYSTEM.md), [`PAGES_AND_FLOWS.md`](docs/frontend/PAGES_AND_FLOWS.md), [`UI_COMPONENTS.md`](docs/frontend/UI_COMPONENTS.md), [`PEDOMETER_SENSOR.md`](docs/frontend/PEDOMETER_SENSOR.md), [`MOCK_DATA.md`](docs/frontend/MOCK_DATA.md), [`SETUP.md`](docs/frontend/SETUP.md).
- **Changelog Terpisah Per-User:** [`CHANGELOG_IBRA.md`](docs/changelogs/CHANGELOG_IBRA.md), [`CHANGELOG_TIARA.md`](docs/changelogs/CHANGELOG_TIARA.md), [`CHANGELOG_SYIFA.md`](docs/changelogs/CHANGELOG_SYIFA.md).
