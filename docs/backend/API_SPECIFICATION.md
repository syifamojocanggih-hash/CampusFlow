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

### `DELETE /api/v1/users/me/data` *(JWT Required)*
Menghapus seluruh log sesi duduk, aktivitas fisik, wellbeing harian, asesmen PSS-10, dan insight AI milik akun terkait serta mereset `streak`, `xpPoints`, baseline, & push subscription (kontrol privasi di Pengaturan).

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

- `GET /api/v1/ai-coach/status` — Mengecek apakah server Ollama lokal aktif dan `OLLAMA_MODEL` sudah ter-pull (`/api/tags`).
- `GET /api/v1/ai-coach/history?limit=20` — Mengambil daftar riwayat insight AI Coach terbaru (maksimal 50).
- `POST /api/v1/ai-coach/generate` — Mengumpulkan telemetri 7 hari terakhir (+ status belum check-in `pss4TotalScore = null`, riwayat skip `AiCoachingInsight`, serta opsional body `{ notes?: string }`), memanggil `ollamaCoach.ts` dengan *rule guard* + `allowedRanges`, menyimpan ke `AiCoachingInsight`, dan mengembalikan 5 field kontrak beserta metadata `generationSource`, `model`, dan `escalationFlag` *(rate limit: 10 req/menit)*.
- `GET /api/v1/ai-coach/latest` — Mengembalikan insight terbaru pengguna.
- `PATCH /api/v1/ai-coach/:id/complete` — Menandai aksi AI Coach selesai + menambah `+50 XP`.
- `GET /api/v1/notifications/vapid-public-key` — Mengambil `publicKey` VAPID & status konfigurasi Web Push server.
- `POST /api/v1/notifications/subscribe` — Menyimpan subscription VAPID Web Push.
- `DELETE /api/v1/notifications/subscribe` — Menghapus subscription Web Push pengguna.
- `POST /api/v1/notifications/test` — Mengirim notifikasi uji Web Push.

---

## 5. Endpoints Jadwal Akademik, KRS Parser AI, Fusi Burnout, & Active Break (PRD v4.0)

### 5.1 Smart Academic Planner & AI KRS Parser (`/api/v1/schedule`) *(JWT Required)*
- `GET /api/v1/schedule` — Mengambil daftar jadwal perkuliahan mingguan pengguna.
- `POST /api/v1/schedule` — Menambah satu matakuliah baru:
  ```json
  {
    "dayOfWeek": 1,
    "subjectName": "Sistem Terdistribusi",
    "creditHours": 3.0,
    "isPracticum": true,
    "isExamWeek": false
  }
  ```
- `POST /api/v1/schedule/bulk` — Menyimpan daftar jadwal sekaligus (`{ schedules: [...] }`).
- `POST /api/v1/schedule/parse-krs` — Mengekstrak jadwal perkuliahan dari file dokumen KRS (PDF, TXT, CSV) atau teks langsung, menghitung bobot beban akademik terhadap stres, dan menyimpannya ke database.
  - **Engine**: Parser SIAKAD berkecepatan tinggi dengan **Google Gemini API Fallback** (`gemini-1.5-flash`) untuk menangani dokumen non-standar, layout kompleks, atau scanned PDF multimodal.
  - **Headers**:
    - `Authorization: Bearer <token>`
    - `x-gemini-api-key` *(Opsional)*: Menyediakan API key Gemini kustom per-request (default membaca `GEMINI_API_KEY` dari server `.env`).
  - **Content-Type**: `multipart/form-data` (field `file`) atau `application/json` (`{ fileBase64, text, replaceExisting, saveToDatabase, geminiApiKey, preferGemini }`).
  - **Response `201 Created`**:
    ```json
    {
      "data": {
        "extractedCount": 5,
        "saved": true,
        "savedCount": 5,
        "replacedPrevious": true,
        "source": "PDF",
        "summary": {
          "totalCourses": 5,
          "totalSks": 14,
          "theorySks": 12,
          "practicumSks": 2,
          "peakLoadDay": {
            "dayOfWeek": 2,
            "dayName": "Selasa",
            "academicLoadScore": 5.5,
            "stressLevel": "HIGH"
          },
          "burnoutRiskWarning": "Peringatan Beban Kognitif Tinggi: Hari Selasa memiliki beban stres akademik 5.5 poin (HIGH)..."
        },
        "dailyBreakdown": [
          {
            "dayOfWeek": 1,
            "dayName": "Senin",
            "courses": [],
            "academicLoadScore": 3.0,
            "stressLevel": "MODERATE"
          }
        ],
        "items": []
      },
      "meta": { "timestamp": "2026-11-17T21:00:00.000Z", "version": "v1.0" }
    }
    ```
- `POST /api/v1/schedule/parse-krs/preview` — Sama seperti `parse-krs`, tetapi hanya mengembalikan preview ekstraksi dan analisis beban stres tanpa mengubah data di database.
- `GET /api/v1/schedule/stress-analysis` — Mengambil ringkasan analisis dampak beban akademik aktif terhadap risiko burnout pengguna (breakdown harian, peak load day, dan rekomendasi klinis).
- `DELETE /api/v1/schedule/:id` — Menghapus jadwal kuliah berdasarkan ID.

### 5.2 Burnout Scoring Engine (`/api/v1/burnout`) *(JWT Required)*
- `GET /api/v1/burnout/today` — Mengambil fusi Burnout Risk Index (0–100) hari ini yang secara otomatis mengintegrasikan beban kuliah hari ini dari `AcademicSchedule` ($SKS \times bobot + ujian$), Screen Time Fatigue, skor pemulihan, dan PSS-10.
- `POST /api/v1/burnout/calculate` — Menghitung dan menyimpan fusi harian (`DailyFussionLog`):
  ```json
  {
    "logDate": "2026-11-16",
    "totalScreenTimeMins": 540,
    "sleepHours": 6.5
  }
  ```
  **Respons:**
  ```json
  {
    "data": {
      "academicLoadScore": 4.5,
      "screenFatigueScore": 2.5,
      "recoveryScore": 42.5,
      "burnoutIndex": 0.0,
      "status": "LOW"
    },
    "meta": { "timestamp": "2026-11-16T13:00:00.000Z", "version": "v1.0" }
  }
  ```
- `GET /api/v1/burnout/history?days=14` — Mengambil riwayat tren Burnout Index selama 14 hari.

### 5.3 On-Demand Active Break (`/api/v1/active-break`) *(JWT Required)*
- `POST /api/v1/active-break/verify` — Mencatat sesi jeda aktif 2 menit yang tervalidasi kamera MediaPipe:
  ```json
  {
    "durationMins": 2.0,
    "poseVerified": true,
    "poseType": "OVERHEAD_ARM_STRETCH"
  }
  ```
  *(Menambah +15 XP pengguna dan +10 poin pemulihan pada Recovery Score hari ini).*

