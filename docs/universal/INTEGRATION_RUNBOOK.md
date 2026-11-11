# INTEGRATION_RUNBOOK.md — Prosedur Integrasi ke `main` & Uji Demo Juri

> **KOORDINATOR INTEGRASI:** Ibra (`@flyingdutchman` — Project Leader)  
> **PESERTA:** Syifa (`@syifamojocanggih-hash` — Backend/LLM) & Tiara (`@mutiaradewanda` — Frontend/PWA)

---

## 1. Urutan Integrasi ke `main`

```
[Tahap 1] main (Ibra)     ──► Pastikan kontrak INTERFACES.md, Vision spec, & shared/ siap
                                 │
          ┌──────────────────────┴──────────────────────┐
          ▼                                             ▼
[Tahap 2] backend (Syifa)                    [Tahap 3] frontend (Tiara + Ibra)
 • Prisma MySQL + Seed 14 hari                • Mode mock awal (MOCK_DATA.md)
 • Scoring + Gemini AI Coach                  • Sambung REST API + VisionGuard + Pedometer
          │                                             │
          └──────────────► PR ke main ◄─────────────────┘
                                 │
                                 ▼
[Tahap 4] Uji End-to-End Skenario Juri & Rilis Techcomfest 2027 (Tag v1.0.0)
```

---

## 2. Checklist Pra-PR Per Branch

### 2.1 Branch `backend` (`@syifamojocanggih-hash`)
- [ ] `npx prisma migrate dev` dan `npx prisma db seed` sukses mengisi akun `demo@campusflow.id` (14 hari data).
- [ ] Uji unit/endpoint memastikan reverse-score PSS-4 (`Q2, Q3`) dan PSS-10 (`Item 4, 5, 7, 8`) akurat.
- [ ] Endpoint `POST /api/v1/ai-coach/generate` mengembalikan 5 field wajib JSON dari `gemini-2.5-flash` (plus fallback aman jika kuota API habis).
- [ ] Tidak ada API key (`GEMINI_API_KEY`, `VAPID_PRIVATE_KEY`) yang ter-commit ke repositori.
- [ ] `docs/changelogs/CHANGELOG_SYIFA.md` sudah diperbarui (`npm run guard` lolos).

### 2.2 Branch `frontend` (`@mutiaradewanda` / `@flyingdutchman`)
- [ ] `npm --prefix frontend run build` lolos tanpa error TypeScript maupun Vite bundle.
- [ ] File `frontend/public/models/pose_landmarker_lite.task` tersedia lokal dan ter-cache oleh Workbox PWA.
- [ ] Layout rapi di mobile (`< 640px`, Pedometer + Kuesioner) dan desktop (`> 1024px`, 3 kolom).
- [ ] Graceful degradation terverifikasi: menolak izin kamera atau membuka di desktop tanpa akselerometer tidak menyebabkan layar blank/crash.
- [ ] `docs/changelogs/CHANGELOG_TIARA.md` (atau `CHANGELOG_IBRA.md`) sudah diperbarui (`npm run guard` lolos).

### 2.3 Verifikasi `main` oleh Project Leader (`@flyingdutchman`)
- [ ] Periksa apakah ada catatan `[CROSS-SCOPE]` di PR dan pastikan tidak menimpa fitur rekan lain.
- [ ] Sinkronkan `backend` & `frontend` setelah merge melalui `git merge origin/main`.

---

## 3. Protokol Uji End-to-End Sebelum Presentasi / Video Demo

1. **Uji Laptop (Vision Guard & Anti-Cheat Active Break):**
   - Login sebagai `demo@campusflow.id`.
   - Jalankan kalibrasi duduk tegak 5 detik (pastikan baseline tersimpan).
   - Aktifkan `DEMO_MODE = true` di Pengaturan, lalu bungkuk selama 15 detik.
   - Verifikasi peringatan toast muncul → **ActiveBreakModal** mengunci layar → lakukan 3 repetisi *Overhead Arm Stretch* + berdiri hingga skeleton hijau dan kunci terbuka.
2. **Uji Smartphone Asli (HTTPS Pedometer):**
   - Akses URL frontend via HTTPS (`vercel.app` / `cloudflared` / `@vitejs/plugin-basic-ssl`).
   - Pada iOS/Android, ketuk **"Aktifkan Pelacak Langkah"**, masukkan HP ke saku, berjalan 20 langkah.
   - Verifikasi jumlah langkah, `cadenceSpm`, dan nilai MET-menit bertambah dan tersinkron ke backend.
3. **Uji Kuesioner & Gemini AI Coach:**
   - Isi PSS-4 (skor tinggi mis. `>= 8`) + tidur `< 6 jam`.
   - Klik **Generate AI Coach Insight**, verifikasi muncul mediator `SLEEP_MEDIATION_DEFICIT` dan saran aerobik sore hari beserta sitasi Mu et al. (2024) / Wang et al. (2025).
4. **Uji Installability PWA:**
   - Jalankan audit Lighthouse PWA pada Chrome Desktop & Android (pastikan opsi *Install App* muncul).
