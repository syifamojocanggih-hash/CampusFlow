# API_SPECIFICATION.md — Spesifikasi REST API Express (`/api/v1`)

> **PENANGGUNG JAWAB:** Syifa (`@syifamojocanggih-hash`)  
> **KONTRAK GLOBAL:** Semua response wajib mengikuti amplop di [`docs/universal/INTERFACES.md`](../universal/INTERFACES.md).

---

## 1. Endpoints Autentikasi & Profil

### `POST /api/v1/auth/register`
Mendaftarkan mahasiswa baru.
- **Request:** `{ name, nim, email, password, department? }`
- **Response `201`:** `{ data: { token, user: { id, name, nim, email, department, weeklyMetsTarget } }, meta }`

### `POST /api/v1/auth/login` & `POST /api/v1/auth/demo`
Login standar atau masuk instan sebagai akun demo `demo@campusflow.id`.
- **Response `200`:** `{ data: { token, user }, meta }`

### `PATCH /api/v1/vision/baseline` *(JWT Required)*
Menyimpan hasil kalibrasi postur 5 detik (`PostureBaseline`) ke `User.postureBaselineJson`.
- **Request:** `{ shoulderWidth, shoulderY, neckVerticalDist, torsoNeckAngle, timestamp }`

---

## 2. Endpoints Telemetri Duduk & Aktivitas Fisik

### `POST /api/v1/sedentary/sessions` *(JWT Required)*
Merekam sesi duduk & hasil verifikasi jeda aktif dari `VisionGuard`.
- **Efek Samping Otoritatif:** Menjumlahkan `durationMinutes` ke `DailyWellbeingLog.totalSedentaryHours` untuk tanggal sesi terkait dan menghitung ulang `mvpaPerSedentaryRatio`.

### `POST /api/v1/activities` *(JWT Required)*
Merekam aktivitas dari `PedometerProcessor` (`WEB_SENSOR_API`) atau input manual (`MANUAL_LOG`) atau aerobik akut (`ACUTE_AEROBIC_RELIEF`).
- **Efek Samping Otoritatif:** Menghitung `calculatedMets` dari tabel koefisien IPAQ-SF, lalu memperbarui `DailyWellbeingLog.totalMvpaMinutes`, `mvpaPerSedentaryRatio`, dan `triadPillarsMet`.

### `GET /api/v1/activities?days=7` *(JWT Required)*
Mengembalikan riwayat aktivitas `days` hari terakhir plus agregasi:
- `weeklyMetsTotal` (target default `1500`)
- `weeklyMseDays` (jumlah hari unik `MUSCLE_STRENGTHENING` dalam 7 hari terakhir, target `>= 2`)

---

## 3. Endpoints Kuesioner & Dashboard

### `POST /api/v1/wellbeing/daily` *(JWT Required)*
Menyimpan log harian tidur + durasi layar non-akademik + jawaban PSS-4 `[q1, q2, q3, q4]`.
- **Response `201`:** Mengembalikan record `DailyWellbeingLog` lengkap beserta `pss4TotalScore`, `triadPillarsMet` (0–3), dan `stressRiskLevel`.

### `GET /api/v1/assessments` *(JWT Required)*
Mengambil riwayat 20 asesmen klinis mingguan (`PSS_10`) terbaru milik pengguna.

### `POST /api/v1/assessments/pss10` *(JWT Required)*
Menyimpan asesmen mingguan PSS-10 (`rawAnswers` array 10 elemen `0..4`).
- **Response `201`:** `{ data: { id, totalScore, severityLevel, assessmentDate }, meta }`

### `GET /api/v1/dashboard/triad?days=14` *(JWT Required)*
Endpoint utama `TriadDashboard.tsx` & halaman Riwayat:
```json
{
  "data": {
    "today": {
      "totalSedentaryHours": 5.5,
      "totalMvpaMinutes": 38,
      "mvpaPerSedentaryRatio": 6.9,
      "sleepHours": 7.5,
      "nonAcademicScreenHours": 3.5,
      "pss4TotalScore": 5,
      "triadPillarsMet": 3,
      "stressRiskLevel": "LOW",
      "sedentaryRiskStatus": "OPTIMAL"
    },
    "weeklySummary": {
      "weeklyMetsTotal": 1620,
      "weeklyMetsTarget": 1500,
      "weeklyMseDays": 2,
      "weeklyMseTarget": 2,
      "currentStreakDays": 7,
      "xpPoints": 420
    },
    "history": [
      {
        "logDate": "2026-11-11",
        "totalSedentaryHours": 5.5,
        "totalMvpaMinutes": 38,
        "sleepHours": 7.5,
        "pss4TotalScore": 5,
        "triadPillarsMet": 3
      }
    ]
  },
  "meta": { "timestamp": "2026-11-11T13:20:00.000Z", "version": "v1.0" }
}
```

---

## 4. Endpoints AI Coach & Web Push

- `POST /api/v1/ai-coach/generate` — Mengumpulkan telemetri 7 hari terakhir, memanggil `geminiCoach.ts`, menyimpan ke `AiCoachingInsight`, dan mengembalikan insight.
- `GET /api/v1/ai-coach/latest` — Mengembalikan insight terbaru pengguna.
- `PATCH /api/v1/ai-coach/:id/complete` — Menandai aksi AI Coach selesai + menambah `+50 XP`.
- `GET /api/v1/notifications/vapid-public-key` — Mengambil `publicKey` VAPID & status konfigurasi Web Push server.
- `POST /api/v1/notifications/subscribe` — Menyimpan subscription VAPID Web Push.
- `DELETE /api/v1/notifications/subscribe` — Menghapus subscription Web Push pengguna.
- `POST /api/v1/notifications/test` — Mengirim notifikasi uji Web Push.
