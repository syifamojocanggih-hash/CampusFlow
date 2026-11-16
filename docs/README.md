# Dokumentasi Teknis CampusFlow (Techcomfest 2027)

Indeks dokumentasi resmi, arsitektur sistem, kontrak data, panduan domain, dan tata kelola 3-branch bebas konflik untuk **CampusFlow — Academic Strava & Predictive Burnout Management PWA (PRD v4.0)**.

---

## 1. Peta Indeks Dokumentasi

```
docs/
├── README.md                              <- Dokumen indeks utama & matriks wewenang ini
│
├── universal/                             <- [MAIN -> DITURUNKAN] Sumber Kebenaran Tunggal
│   ├── PRD.md                             <- Master PRD & Cetak Biru Versi 4.0
│   ├── PRD_V4_PIVOT_EXPLANATION.md        <- Analisis Pivot v4.0, formulasi Burnout Index, & panduan lintas branch
│   ├── ARCHITECTURE.md                    <- Arsitektur 4 lapis (Zero Continuous Camera, Strava PWA, Burnout Engine, Ollama)
│   ├── BOUNDARIES_AND_CONTRACTS.md        <- Aturan batas, hak akses fleksibel & protokol [CROSS-SCOPE]
│   ├── INTERFACES.md                      <- Kontrak DTO Burnout Index, Academic Schedule, Active Break, & REST API
│   ├── GIT_WORKFLOW.md                    <- Alur 3 branch (main, backend, frontend) & anti-konflik
│   ├── INTEGRATION_RUNBOOK.md             <- Prosedur sinkronisasi, verifikasi E2E demo juri, & rilis
│   ├── DECISIONS.md                       <- Architecture Decision Records (ADR-001 s.d. ADR-007)
│   └── ROADMAP.md                         <- Peta jalan pengembangan Tahap 1 s.d. Tahap 5
│
├── vision/                                <- [MAIN -> DITURUNKAN] Domain AI Vision (PIC: Ibra)
│   ├── README.md                          <- Mandat Project Leader & Vision AI Engineer (PRD v4.0)
│   ├── VISION_SPEC.md                     <- ActiveBreakValidator (MediaPipe 33 Pose WASM, on-demand 2 menit)
│   └── TASK_GUIDE.md                      <- Checklist tugas LEAD-1.x & VIS-1.x
│
├── backend/                               <- [BRANCH: backend] Backend & LLM (PIC: Syifa)
│   ├── README.md                          <- Mandat & lingkup Backend, Burnout Engine, + Ollama AI Coach
│   ├── TASK_GUIDE.md                      <- Daftar tugas BE-1.x s.d. BE-5.x
│   ├── DATABASE_SCHEMA.md                 <- Skema Prisma MySQL (AcademicSchedule, DailyFussionLog, ActiveBreakSession)
│   ├── API_SPECIFICATION.md               <- Spesifikasi lengkap endpoint REST /api/v1/* (termasuk /burnout & /academic-schedule)
│   ├── CLINICAL_SCORING.md                <- Rumus Burnout Risk Index, Academic Load Score, dan Recovery Score
│   ├── LLM_AI_COACH.md                    <- Integrasi Ollama Lokal (/api/chat JSON Schema), Crisis Gateway, & Fallback
│   └── SETUP.md                           <- Panduan setup MySQL, Prisma migrate, Ollama, & server lokal
│
├── frontend/                              <- [BRANCH: frontend] Frontend & PWA (PIC: Tiara + Ibra)
│   ├── README.md                          <- Mandat Frontend PWA & visualisasi Strava Akademik
│   ├── TASK_GUIDE.md                      <- Daftar tugas FE-1.x s.d. FE-5.x
│   ├── DESIGN_SYSTEM.md                   <- Palet warna pastel Calm & Supportif, tipografi, & komponen kartu
│   ├── PAGES_AND_FLOWS.md                 <- Sitemap layar utama: Strava Dashboard, Modal Active Break, Smart Planner KRS
│   ├── UI_COMPONENTS.md                   <- Katalog komponen React, Burnout Gauge, Progress Ring, ActiveBreakModal
│   ├── PEDOMETER_SENSOR.md                <- Pelacakan aktivitas fisik & integrasi data tidur/layar HP
│   ├── MOCK_DATA.md                       <- Fixture JSON offline untuk dev independen tanpa server
│   └── SETUP.md                           <- Panduan Vite + PWA + setup model MediaPipe lokal
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

## 3. Tiga Prinsip Inti Arsitektur PRD v4.0

1. **Zero Continuous Camera (Privasi Terjaga Penuh):** Kamera laptop default MATI selama belajar. Kamera hanya hidup maksimal 2 menit saat tombol *Active Break* ditekan untuk memvalidasi gerakan fisik secara lokal di browser, lalu langsung mati otomatis.
2. **Konsep 'Academic Strava' & Burnout Risk Index (0–100):** Menyatukan 4 variabel (Beban Kuliah/KRS, Screen Time via `document.hidden`, Jam Tidur, dan Active Break) menjadi satu skor kesimpulan harian.
3. **Proactive AI Coaching & Crisis Gateway:** Model AI lokal (Ollama / `campusflow-coach`) mendampingi mahasiswa, merujuk ke Hotline 119 saat krisis, dan memberikan rekomendasi preventif malam hari berbasis jadwal kuliah esok.
