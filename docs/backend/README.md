# DOMAIN BACKEND & LLM — `docs/backend/` (PRD v4.0)

> **PENANGGUNG JAWAB:** **Syifa** (`@syifamojocanggih-hash`) — *Backend & LLM Engineer*  
> **BRANCH KERJA:** `backend`  
> **ZONA DEFAULT (R/W):** `backend/`, `docs/backend/`  
> **CHANGELOG WAJIB:** [`docs/changelogs/CHANGELOG_SYIFA.md`](../changelogs/CHANGELOG_SYIFA.md)

---

## 1. Mandat & Ruang Lingkup Kerja Syifa (PRD v4.0)

Syifa bertanggung jawab membangun seluruh layanan server, database relasional, mesin evaluasi kejenuhan belajar (*Burnout Scoring Engine*), notifikasi Web Push, dan orkestrasi **Wellbeing AI Coach (Ollama Lokal)**:

- **Express + TypeScript Server (`backend/src/`):**
  - Routing `/api/v1/*` dengan struktur modular: `/auth`, `/users`, `/academic-schedule`, `/burnout`, `/active-break`, `/wellbeing`, `/ai-coach`.
  - Middleware autentikasi JWT + `bcryptjs`, rate limiting bertahap, dan amplop respons standar `{ data, meta }`.
- **Database MySQL + Prisma ORM (`backend/prisma/`):**
  - Mengelola model relasional PRD v4.0: `User`, `AcademicSchedule`, `DailyFussionLog`, `ActiveBreakSession`, `AiCoachingInsight`, `SedentarySession`, `PhysicalActivity`, dan `DailyWellbeingLog`.
  - Migrasi skema otomatis dan `seed.ts` berisi data demo realistis.
- **Burnout Scoring Service (`burnoutScoring.ts`):**
  - Menerapkan formulasi *Effort-Recovery*:
    $$\text{Burnout Risk Index} = (\text{Academic Load Score} + \text{Screen Time Fatigue}) - \text{Recovery Score}$$
  - Menghitung bobot SKS (teori $1.0$, praktikum $1.5$, pekan ujian $+3.0$), penalti kelebihan layar di atas 8 jam ($2.5\text{ poin/jam}$), durasi tidur, dan validasi sesi break.
- **Wellbeing AI Coach (`ollamaCoach.ts`):**
  - Mengintegrasikan **Ollama lokal** (`/api/chat` dengan model `campusflow-coach` via Qwen2.5/Llama, tanpa API key berbayar / zero cloud data leak).
  - Dilengkapi *Crisis Gateway* (deteksi distres berat $\rightarrow$ rujukan Hotline 119) serta *Deterministic Clinical Fallback* saat Ollama offline.
- **Web Push Notification (`pushNotifier.ts`):**
  - Pengiriman notifikasi pengingat jeda aktif saat akumulasi waktu layar melebihi batas aman.

---

## 2. Aturan Anti-Konflik & Fleksibilitas

1. Seluruh kode server dan `package.json` / `package-lock.json` berada di dalam `backend/` (terpisah total dari `frontend/`).
2. Setiap commit/push di branch `backend` **WAJIB** menambah entri baru di [`CHANGELOG_SYIFA.md`](../changelogs/CHANGELOG_SYIFA.md).
3. Apabila mendesak harus menyentuh file di luar `backend/` atau `docs/backend/` (misalnya mengubah kontrak `shared/` atau helper di `frontend/`), **diperbolehkan** asalkan mencatat tag **`[CROSS-SCOPE]`**, path lengkap file, dan alasannya di `CHANGELOG_SYIFA.md`.
4. `DATABASE_URL`, `JWT_SECRET`, `OLLAMA_BASE_URL`, dan `VAPID_PRIVATE_KEY` disimpan di `backend/.env` (dilarang keras diekspos ke client atau di-commit ke Git).

---

## 3. Indeks Dokumen Backend

1. [`TASK_GUIDE.md`](TASK_GUIDE.md): Peta tugas terurut `BE-1.1` s.d. `BE-5.2`.
2. [`DATABASE_SCHEMA.md`](DATABASE_SCHEMA.md): Kode skema Prisma MySQL lengkap (termasuk model PRD v4.0) dan skenario seed.
3. [`API_SPECIFICATION.md`](API_SPECIFICATION.md): Rincian payload setiap endpoint REST `/api/v1/*`.
4. [`CLINICAL_SCORING.md`](CLINICAL_SCORING.md): Formulasi Burnout Risk Index, Academic Load Score, dan Recovery Score.
5. [`LLM_AI_COACH.md`](LLM_AI_COACH.md): Implementasi Ollama Lokal Structured JSON, Crisis Gateway 119, & Prompt System.
6. [`SETUP.md`](SETUP.md): Panduan instalasi lokal MySQL, migrasi Prisma, & setup server.
