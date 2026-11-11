# GIT_WORKFLOW.md — Alur 3 Branch & Strategi Anti-Konflik (CampusFlow)

> **STATUS:** STANDAR TATA KELOLA GIT RESMI  
> **KONFIGURASI BRANCH:** `main` · `backend` · `frontend`

---

## 1. Model 3 Branch & Kepemilikan

CampusFlow menggunakan tepat **3 branch permanen**:

```
main            <- Branch utama: Fondasi arsitektur, kontrak, AI Vision (Ibra @flyingdutchman)
 │                 + Tempat integrasi rilis stabil dari backend & frontend
 ├──► backend   <- Diturunkan dari main: Backend & Gemini LLM (Syifa @syifamojocanggih-hash)
 └──► frontend  <- Diturunkan dari main: Frontend PWA & Sensor (Tiara @mutiaradewanda + Ibra)
```

| Branch | Pemilik Utama | Apa yang Dikerjakan di Branch Ini |
|---|---|---|
| `main` | **Ibra** (`@flyingdutchman`) | Setup awal, kontrak `docs/universal/`, spesifikasi & core **AI Vision** (`docs/vision/`, `shared/`), guard scripts, serta menerima PR dari `backend` & `frontend`. |
| `backend` | **Syifa** (`@syifamojocanggih-hash`) | Server Express + Prisma MySQL, Clinical Scoring, Gemini 2.5 Flash AI Coach, Web Push VAPID (`backend/`, `docs/backend/`, `CHANGELOG_SYIFA.md`). |
| `frontend` | **Tiara** (`@mutiaradewanda`) *(dibantu Ibra bila perlu)* | Aplikasi React 18 + Vite + Tailwind PWA, UI VisionGuard, ActiveBreakModal, Pedometer, Kuesioner, Dashboard (`frontend/`, `docs/frontend/`, `CHANGELOG_TIARA.md` / `CHANGELOG_IBRA.md`). |

---

## 2. Alur "Diturunkan dari `main`" vs "Eksklusif saat Merge"

### 2.1 Penurunan dari `main` ke Branch Peran
Setiap kali Ibra memperbarui fondasi di `main` (misalnya pembaruan kontrak `INTERFACES.md`, spesifikasi Vision AI, atau `shared/`), Syifa dan Tiara menariknya ke branch masing-masing:

```bash
# Untuk Syifa di branch backend:
git checkout backend
git fetch origin
git merge origin/main

# Untuk Tiara / Ibra di branch frontend:
git checkout frontend
git fetch origin
git merge origin/main
```

> **Gunakan `git merge`, jangan `git rebase`**, agar riwayat branch peran tetap aman dan tidak membutuhkan `git push --force`.

### 2.2 Mengapa Saat Merge ke `main` Tidak Terjadi Konflik?
1. **Folder Kerja Terpisah Total:** `backend` hanya menyentuh `backend/` + `docs/backend/`; `frontend` hanya menyentuh `frontend/` + `docs/frontend/`.
2. **`package-lock.json` Dipisah:** `backend/package-lock.json` dan `frontend/package-lock.json` berdiri sendiri (tidak ada `package-lock.json` di root yang diperebutkan).
3. **Changelog Berbeda Per-User:**
   - Syifa menulis **hanya** di `docs/changelogs/CHANGELOG_SYIFA.md`.
   - Tiara menulis **hanya** di `docs/changelogs/CHANGELOG_TIARA.md`.
   - Ibra menulis **hanya** di `docs/changelogs/CHANGELOG_IBRA.md` *(Catatan: jika Ibra memperbarui `CHANGELOG_IBRA.md` di `main`, pastikan sudah `git merge origin/main` di `frontend` sebelum menulis di `frontend`)*.

---

## 3. Rutinitas Kerja Harian

### 3.1 Rutinitas Syifa (`backend`)
```bash
git checkout backend
git fetch origin && git merge origin/main
# ... kerjakan kode di backend/ dan docs/backend/ ...
# ... WAJIB tambah catatan di docs/changelogs/CHANGELOG_SYIFA.md ...
npm run guard
git add backend docs/backend docs/changelogs/CHANGELOG_SYIFA.md
git commit -m "feat(backend): implement pss4 reverse scoring and daily wellbeing endpoint"
git push origin backend
```

### 3.2 Rutinitas Tiara (`frontend`)
```bash
git checkout frontend
git fetch origin && git merge origin/main
# ... kerjakan kode di frontend/ dan docs/frontend/ ...
# ... WAJIB tambah catatan di docs/changelogs/CHANGELOG_TIARA.md ...
npm run guard
git add frontend docs/frontend docs/changelogs/CHANGELOG_TIARA.md
git commit -m "feat(frontend): build TriadDashboard and PedometerCard"
git push origin frontend
```

### 3.3 Rutinitas Ibra (`main` — Vision AI & Leader)
```bash
git checkout main
git pull origin main
# ... kerjakan arsitektur/Vision AI di shared/, docs/vision/, docs/universal/ ...
# ... catat di docs/changelogs/CHANGELOG_IBRA.md ...
git add shared docs/vision docs/universal docs/changelogs/CHANGELOG_IBRA.md
git commit -m "feat(vision): add 5s posture baseline calibration spec and heuristics"
git push origin main
```

---

## 4. Protokol Perubahan Fleksibel (`[CROSS-SCOPE]`)

Jika Anda berada di branch `backend` atau `frontend` dan **terpaksa** mengubah file milik branch lain atau file `main`:
1. Lakukan perubahan secukupnya sesuai kebutuhan teknis.
2. Buka Changelog pribadi Anda (`CHANGELOG_SYIFA.md` / `CHANGELOG_TIARA.md` / `CHANGELOG_IBRA.md`), lalu tambahkan entri dengan tag **`[CROSS-SCOPE]`**, path lengkap file yang diubah, dan alasannya.
3. Jalankan `npm run guard` untuk memastikan tag tercatat valid.
4. Jelaskan perubahan lintas zona tersebut pada Pull Request ke `main` agar tidak bentrok dengan pekerjaan rekan lain.

---

## 5. Format Pesan Commit (Conventional Commits)

```
<tipe>(<lingkup>): <deskripsi imperatif singkat>

tipe    : feat | fix | docs | refactor | test | chore
lingkup : vision | backend | llm | frontend | contracts | docs | ci
```

Contoh:
- `feat(vision): implement calcAngleDegrees and overhead stretch validation`
- `feat(llm): integrate gemini-2.5-flash structured output coach`
- `feat(frontend): add pose_landmarker_lite.task offline PWA caching`
- `docs(changelogs): log cross-scope interface field addition`
