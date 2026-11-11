# `shared/` — Kontrak Data & Modul Inti Vision (Dikelola di `main`)

Direktori ini berisi artefak bersama yang **dibuat dan dipelihara di branch `main`** oleh **Ibra (`@flyingdutchman`)** sebagai Project Leader & Vision AI Engineer, lalu **diturunkan (`git merge origin/main`)** ke branch `backend` dan `frontend`.

## Isi yang Direncanakan
- `shared/contracts/` — Definisi tipe TypeScript bersama (DTO request/response, enum `ActivityIntensity`, `StressSeverity`, `DataSource`, konstanta klinis jurnal).
- `shared/vision/` — Modul inti heuristik MediaPipe (`poseHeuristics.ts`, konstanta ambang batas postur, dan tipe `PostureBaseline` / `PostureEvaluationResult`).

## Aturan Anti-Konflik
- Branch `backend` dan `frontend` mengonsumsi/mengimpor modul dari sini tanpa memodifikasi langsung kecuali dalam kondisi mendesak (wajib tag `[CROSS-SCOPE]` di changelog pribadi).
- Pembaruan resmi dilakukan di `main`, lalu ditarik oleh branch peran melalui `git merge origin/main`.
