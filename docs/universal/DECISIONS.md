# DECISIONS.md — Architecture Decision Records (ADR) CampusFlow

> **STATUS:** LOG KEPUTUSAN ARSITEKTURAL RESMI (Dikelola di `main`)

---

## ADR-001: MediaPipe Pre-Trained On-Device (WebGL/WASM) Dibanding Training Model Gambar Custom
- **Keputusan:** Menggunakan `@mediapipe/tasks-vision` (33 Pose Landmarks + 478 Face Landmarks) secara on-device di browser tanpa melatih dataset foto mahasiswa.
- **Rasional:**
  1. Privasi mutlak: citra webcam tidak pernah dikirim ke server (kepatuhan privasi mahasiswa).
  2. Latensi rendah ($\ge 24$ FPS di browser) dan tidak butuh GPU server mahal.
  3. Mengatasi variasi tinggi badan & posisi laptop lewat protokol **Kalibrasi Baseline 5 Detik (100 frame)** + **EMA $\alpha = 0.25$**.

## ADR-002: Hosting Lokal Bobot Model `pose_landmarker_lite.task`
- **Keputusan:** Menyimpan file `.task` (~5.5 MB) di `frontend/public/models/` dan meng-cache lewat Workbox `vite-plugin-pwa`.
- **Rasional:** Menghindari kegagalan CORS, latensi CDN eksternal, dan ketergantungan jaringan saat demo presentasi di depan juri/dosen.

## ADR-003: Node.js + Express + Prisma ORM + MySQL untuk Backend
- **Keputusan:** Menggunakan stack TypeScript full-stack (`Express` + `Prisma` + `MySQL`) ketimbang BaaS/NoSQL.
- **Rasional:** Skema relasional 6 tabel (`User`, `SedentarySession`, `PhysicalActivity`, `DailyWellbeingLog`, `ClinicalAssessment`, `AiCoachingInsight`) menjamin integritas data klinis, mendukung *seeding* 14 hari yang deterministik, dan memudahkan eksekusi aturan reverse-scoring di server.

## ADR-004: Google Gemini 2.5 Flash dengan `responseSchema` Ketat
- **Keputusan:** Menggunakan SDK `@google/genai` model `gemini-2.5-flash` dengan `responseMimeType: "application/json"` dan `responseSchema` eksplisit.
- **Rasional:** Mengunci struktur output (`dominantMediator`, `diagnosisSummary`, `isotemporalActionPlan`, `recommendedMetsToday`, `scientificCitationNote`) agar UI Frontend tidak pernah rusak akibat format teks bebas LLM, sekaligus mengaitkan setiap rekomendasi ke literatur Martín-Rodríguez & González-Prieto (2026).

## ADR-005: Pemisahan `package-lock.json` & Changelog Per-User untuk 3-Branch Zero-Conflict
- **Keputusan:** Memisahkan `backend/package-lock.json` dan `frontend/package-lock.json` (tanpa satu lockfile tunggal di root), serta memisahkan `CHANGELOG_IBRA.md`, `CHANGELOG_TIARA.md`, dan `CHANGELOG_SYIFA.md`.
- **Rasional:** Mengeliminasi sumber merge conflict paling sering saat 3 developer bekerja paralel di 3 branch (`main`, `backend`, `frontend`), sambil tetap memberi kebebasan edit lintas file jika tercatat via `[CROSS-SCOPE]`.

## ADR-006: Pedometer 3-Axis DSP Independen Orientasi + Konversi IPAQ-SF METs
- **Keputusan:** Menggunakan magnitudo vektor $\sqrt{a_x^2+a_y^2+a_z^2}$, high-pass moving average 25 sampel, dan filter jeda 250–1200 ms (min 6 langkah berturut-turut).
- **Rasional:** Smartphone mahasiswa di dalam saku/tas berada dalam orientasi acak; magnitudo 3D tahan terhadap rotasi saku dan filter frekuensi membuang guncangan tangan non-berjalan.

## ADR-007: Desain Visual *Calm & Supportif* dan Graceful Degradation
- **Keputusan:** Menghindari warna merah blok penuh untuk notifikasi harian non-darurat, serta menyembunyikan `VisionGuard` di layar `< 640px` atau saat webcam ditolak.
- **Rasional:** Aplikasi ditujukan untuk menurunkan stres akademik (*perceived stress*); antarmuka yang menenangkan dan tidak rusak saat izin ditolak sangat krusial untuk kepatuhan UX dan penilaian juri.
