# `shared/` — Kontrak Data & Modul Inti Vision (Dikelola di `main`)

Direktori ini berisi modul bersama yang **dibuat dan dipelihara di branch `main`** oleh **Ibra (`@flyingdutchman`)** sebagai Project Leader & Vision AI Engineer, lalu **diturunkan (`git merge origin/main`)** ke branch `backend` dan `frontend`.

## Isi Direktori
- [`contracts/index.ts`](contracts/index.ts) — Konstanta klinis jurnal Martín-Rodríguez & González-Prieto (2026), enum/union type, koefisien METs, indeks reverse-scoring PSS-4/10, serta seluruh tipe DTO request/response API.
- [`vision/poseHeuristics.ts`](vision/poseHeuristics.ts) — Implementasi 100% on-device heuristik MediaPipe (`computePostureBaseline`, `evaluatePostureFrame`, `calcEyeAspectRatio`, `PostureEmaSmoother`, `POSE_LANDMARK_INDICES`, `VISION_THRESHOLDS`).
- [`vision/poseHeuristics.test.ts`](vision/poseHeuristics.test.ts) — Unit test Node native (`node --test shared/vision/poseHeuristics.test.ts`).

## Aturan Anti-Konflik
- Branch `backend` dan `frontend` mengimpor modul dari sini tanpa memodifikasi langsung kecuali dalam kondisi mendesak (wajib tag `[CROSS-SCOPE]` di changelog pribadi).
- Pembaruan resmi dilakukan di `main`, lalu ditarik oleh branch peran melalui `git merge origin/main`.
