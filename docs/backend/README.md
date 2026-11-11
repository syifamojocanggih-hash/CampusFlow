# DOMAIN BACKEND & LLM — `docs/backend/`

> **PENANGGUNG JAWAB:** **Syifa** (`@syifamojocanggih-hash`) — *Backend & LLM Engineer*  
> **BRANCH KERJA:** `backend`  
> **ZONA DEFAULT (R/W):** `backend/`, `docs/backend/`  
> **CHANGELOG WAJIB:** [`docs/changelogs/CHANGELOG_SYIFA.md`](../changelogs/CHANGELOG_SYIFA.md)

---

## 1. Mandat & Ruang Lingkup Kerja Syifa

Syifa bertanggung jawab membangun seluruh layanan server, database relasional klinis, mesin skoring, notifikasi Web Push, dan orkestrasi **Agentic AI Coach (Ollama Lokal)**:
- **Express + TypeScript Server (`backend/src/`):** Routing `/api/v1/*`, middleware autentikasi JWT + `bcryptjs`, validasi input, dan amplop respons standar `{ data, meta }`.
- **Database MySQL + Prisma ORM (`backend/prisma/`):** Mengelola 6 tabel (`User`, `SedentarySession`, `PhysicalActivity`, `DailyWellbeingLog`, `ClinicalAssessment`, `AiCoachingInsight`) dan `seed.ts` berisi data demo 14 hari (`demo@campusflow.id`).
- **Clinical Scoring Service (`clinicalScoring.ts`):** Menerapkan konstanta literatur Martín-Rodríguez & González-Prieto (2026), *reverse scoring* PSS-4 & PSS-10, kualitas tidur PSQI, kalkulasi MET-menit IPAQ-SF, streak harian, dan skor kepatuhan *24-Hour Movement Triad*.
- **Agentic Wellbeing AI Coach (`ollamaCoach.ts`):** Mengintegrasikan **Ollama lokal** (`/api/chat` dengan `format` JSON Schema terstruktur, tanpa API key eksternal) serta fallback deterministik bila Ollama belum menyala.
- **Web Push Notification (`pushNotifier.ts`):** Pengiriman notifikasi intervensi duduk melalui `web-push` (VAPID keys).

---

## 2. Aturan Anti-Konflik & Fleksibilitas

1. Seluruh kode server dan `package.json` / `package-lock.json` berada di dalam `backend/` (terpisah total dari `frontend/`).
2. Setiap commit/push di branch `backend` **WAJIB** menambah entri baru di [`CHANGELOG_SYIFA.md`](../changelogs/CHANGELOG_SYIFA.md).
3. Apabila mendesak harus menyentuh file di luar `backend/` atau `docs/backend/` (misalnya mengubah kontrak `shared/` atau helper di `frontend/`), **diperbolehkan** asalkan mencatat tag **`[CROSS-SCOPE]`**, path lengkap file, dan alasannya di `CHANGELOG_SYIFA.md`.
4. `DATABASE_URL`, `JWT_SECRET`, `OLLAMA_BASE_URL`, dan `VAPID_PRIVATE_KEY` disimpan di `backend/.env` (dilarang keras diekspos ke client atau di-commit ke Git).

---

## 3. Indeks Dokumen Backend

1. [`TASK_GUIDE.md`](TASK_GUIDE.md): Peta tugas terurut `BE-1.1` s.d. `BE-5.2`.
2. [`DATABASE_SCHEMA.md`](DATABASE_SCHEMA.md): Kode skema Prisma MySQL lengkap dan skenario seed 14 hari.
3. [`API_SPECIFICATION.md`](API_SPECIFICATION.md): Rincian payload setiap endpoint `/api/v1/*`.
4. [`CLINICAL_SCORING.md`](CLINICAL_SCORING.md): Butir kuesioner PSS-4/10, rumus reverse score, METs, dan konstanta klinis.
5. [`LLM_AI_COACH.md`](LLM_AI_COACH.md): Implementasi Ollama Lokal Structured JSON & prompt sistem.
6. [`SETUP.md`](SETUP.md): Panduan instalasi lokal MySQL, migrasi Prisma, & generate VAPID keys.
