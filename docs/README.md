# Dokumentasi Teknis CampusFlow (Techcomfest 2027)

Indeks dokumentasi resmi, arsitektur sistem, kontrak data, panduan domain, dan tata kelola 3-branch bebas konflik untuk **CampusFlow — AI-Driven Active Wellbeing & Stress Management PWA**.

---

## 1. Peta Indeks Dokumentasi

```
docs/
├── README.md                              <- Dokumen indeks utama & matriks wewenang ini
│
├── universal/                             <- [MAIN -> DITURUNKAN] Sumber Kebenaran Tunggal
│   ├── PRD.md                             <- Master PRD & Build Guide Versi 3.0 (Bagian 01–18)
│   ├── ARCHITECTURE.md                    <- Arsitektur 4 lapis & pemrosesan on-device vs server
│   ├── BOUNDARIES_AND_CONTRACTS.md        <- Aturan batas, hak akses fleksibel & protokol [CROSS-SCOPE]
│   ├── INTERFACES.md                      <- Kontrak pasti DTO Vision, Sensor, REST API, & Ollama LLM
│   ├── GIT_WORKFLOW.md                    <- Alur 3 branch (main, backend, frontend) & anti-konflik
│   ├── INTEGRATION_RUNBOOK.md             <- Prosedur sinkronisasi, verifikasi E2E demo juri, & rilis
│   ├── DECISIONS.md                       <- Architecture Decision Records (ADR-001 s.d. ADR-007)
│   └── ROADMAP.md                         <- Peta jalan pengembangan Tahap 1 s.d. Tahap 5
│
├── vision/                                <- [MAIN -> DITURUNKAN] Domain AI Vision (PIC: Ibra)
│   ├── README.md                          <- Mandat Project Leader & Vision AI Engineer
│   ├── VISION_SPEC.md                     <- MediaPipe 33 Pose + 478 Face, kalibrasi 5s, & poseHeuristics
│   └── TASK_GUIDE.md                      <- Checklist tugas LEAD-1.x & VIS-1.x
│
├── backend/                               <- [BRANCH: backend] Backend & LLM (PIC: Syifa)
│   ├── README.md                          <- Mandat & lingkup Backend + Ollama AI Coach
│   ├── TASK_GUIDE.md                      <- Daftar tugas BE-1.x s.d. BE-5.x
│   ├── DATABASE_SCHEMA.md                 <- Skema Prisma MySQL (6 tabel, enum, & seed 14 hari)
│   ├── API_SPECIFICATION.md               <- Spesifikasi lengkap endpoint REST /api/v1/*
│   ├── CLINICAL_SCORING.md                <- Rumus PSS-4/10 reverse-score, PSQI, IPAQ METs, & Triad
│   ├── LLM_AI_COACH.md                    <- Integrasi Ollama Lokal (/api/chat JSON Schema) & Fallback
│   └── SETUP.md                           <- Panduan setup MySQL, Prisma migrate, Ollama, & server lokal
│
├── frontend/                              <- [BRANCH: frontend] Frontend & PWA (PIC: Tiara + Ibra)
│   ├── README.md                          <- Mandat Frontend & kolaborasi bebas antar-UI
│   ├── TASK_GUIDE.md                      <- Daftar tugas FE-1.x s.d. FE-5.x
│   ├── DESIGN_SYSTEM.md                   <- Palet warna Calm & Supportif, Poppins/Inter, & komponen
│   ├── PAGES_AND_FLOWS.md                 <- Sitemap 10 layar, user flow, & graceful fallback
│   ├── UI_COMPONENTS.md                   <- Katalog komponen React & state antarmuka
│   ├── PEDOMETER_SENSOR.md                <- DSP DeviceMotionEvent 3-sumbu & HTTPS lokal
│   ├── MOCK_DATA.md                       <- Fixture JSON offline untuk dev independen
│   └── SETUP.md                           <- Panduan Vite + PWA + model MediaPipe lokal
│
└── changelogs/                            <- [TERPISAH PER USER] Anti-Konflik saat Merge
    ├── README.md                          <- Template & aturan wajib pengisian changelog
    ├── CHANGELOG_IBRA.md                  <- Riwayat perubahan Ibra (@flyingdutchman)
    ├── CHANGELOG_TIARA.md                 <- Riwayat perubahan Tiara (@mutiaradewanda)
    └── CHANGELOG_SYIFA.md                 <- Riwayat perubahan Syifa (@syifamojocanggih-hash)
```

---

## 2. Matriks Wewenang & Kepemilikan Branch

Sistem menggunakan **3 branch resmi** (`main`, `backend`, `frontend`) dengan kepemilikan default dan aturan fleksibel berbasis Changelog pribadi:

| Branch | Penanggung Jawab | Zona Default (R/W) | Aturan Perubahan Lintas Zona | Changelog Pribadi Wajib |
|---|---|---|---|---|
| `main` | **Ibra** (`@flyingdutchman`) — *Project Leader & Vision AI* | Root (`README.md`, `DESIGN.md`, `package.json`), `docs/universal/`, `docs/vision/`, `shared/`, `scripts/`, `.github/` | Pemelihara fondasi utama & modul inti Vision yang diturunkan ke branch lain | [`CHANGELOG_IBRA.md`](changelogs/CHANGELOG_IBRA.md) |
| `backend` | **Syifa** (`@syifamojocanggih-hash`) — *Backend & LLM Engineer* | `backend/`, `docs/backend/` | Boleh mengubah file lain bila mendesak **dengan syarat** mencatat `[CROSS-SCOPE]` + path file + alasan di changelog pribadi | [`CHANGELOG_SYIFA.md`](changelogs/CHANGELOG_SYIFA.md) |
| `frontend` | **Tiara** (`@mutiaradewanda`) — *Frontend Engineer* *(+ kolaborasi Ibra `@flyingdutchman`)* | `frontend/`, `docs/frontend/` | Tiara & Ibra bebas berbagi kode di `frontend/`. Perubahan lintas zona boleh dilakukan bila mendesak **dengan syarat** tag `[CROSS-SCOPE]` di changelog masing-masing | [`CHANGELOG_TIARA.md`](changelogs/CHANGELOG_TIARA.md)<br>[`CHANGELOG_IBRA.md`](changelogs/CHANGELOG_IBRA.md) |

---

## 3. Empat Prinsip Utama Arsitektur & Kolaborasi

1. **Main sebagai Sumber Turunan (`main` → `backend` & `frontend`):** Spesifikasi produk, kontrak data (`INTERFACES.md`), dan modul inti Vision AI dibangun di `main` terlebih dahulu, lalu ditarik oleh `backend` dan `frontend` melalui `git merge origin/main`.
2. **Isolasi Merge Anti-Konflik:** `backend/` dan `frontend/` memiliki `package-lock.json` terpisah serta folder dokumen terpisah. Setiap user memiliki file Changelog sendiri di `docs/changelogs/` sehingga merge ke `main` tidak saling menimpa.
3. **Fleksibel Namun Terlacak (`[CROSS-SCOPE]`):** Jika ada kebutuhan mendesak mengubah file milik domain lain atau file bersama di `main`, user tetap diperbolehkan melakukannya selama menuliskan tag `[CROSS-SCOPE]`, nama file, dan alasannya pada Changelog pribadi (`scripts/guard-check.sh` memverifikasi aturan ini secara otomatis).
4. **Privasi Citra On-Device & Validitas Klinis:** Webcam MediaPipe berjalan 100% lokal di browser (tidak ada unggahan gambar/video ke server), sementara seluruh ambang batas dan skoring mengacu ketat pada kajian sistematis Martín-Rodríguez & González-Prieto (2026).

---

## 4. Navigasi Cepat Berdasarkan Peran

- **Jika Anda Ibra (`@flyingdutchman` — Leader & Vision AI di `main`):** Baca [`DESIGN.md`](../DESIGN.md), [`docs/vision/VISION_SPEC.md`](vision/VISION_SPEC.md), [`docs/vision/TASK_GUIDE.md`](vision/TASK_GUIDE.md), dan [`docs/universal/INTEGRATION_RUNBOOK.md`](universal/INTEGRATION_RUNBOOK.md).
- **Jika Anda Syifa (`@syifamojocanggih-hash` — Backend & LLM di `backend`):** Baca [`docs/backend/README.md`](backend/README.md), [`docs/backend/TASK_GUIDE.md`](backend/TASK_GUIDE.md), [`docs/backend/DATABASE_SCHEMA.md`](backend/DATABASE_SCHEMA.md), dan [`docs/universal/INTERFACES.md`](universal/INTERFACES.md).
- **Jika Anda Tiara (`@mutiaradewanda` — Frontend & PWA di `frontend`):** Baca [`docs/frontend/README.md`](frontend/README.md), [`docs/frontend/TASK_GUIDE.md`](frontend/TASK_GUIDE.md), [`docs/frontend/DESIGN_SYSTEM.md`](frontend/DESIGN_SYSTEM.md), dan [`docs/frontend/MOCK_DATA.md`](frontend/MOCK_DATA.md).
