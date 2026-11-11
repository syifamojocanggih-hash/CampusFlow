# INTERFACES.md — Sumber Kebenaran Tunggal Kontrak Data CampusFlow

> **STATUS:** SINGLE SOURCE OF TRUTH (Dikelola di `main` → Diturunkan ke `backend` & `frontend`)  
> Semua tipe data, DTO, endpoint REST API, dan skema Structured Output LLM yang melintasi batas Vision, Frontend, dan Backend didefinisikan di sini.

---

## 0. Konvensi Umum & Amplop Respons REST

- **Base URL (Dev Backend):** `http://localhost:4000/api/v1` (atau `VITE_API_BASE_URL`)
- **Format:** JSON (`Content-Type: application/json; charset=utf-8`)
- **Autentikasi:** `Authorization: Bearer <jwt_token>` (kecuali `/auth/login`, `/auth/register`, `/health`)
- **Format Waktu:** ISO 8601 UTC string (`YYYY-MM-DDTHH:mm:ss.sssZ`), atau `YYYY-MM-DD` untuk tanggal log harian.

### 0.1 Amplop Respons Standar
**Sukses (`200`, `201`):**
```json
{
  "data": {},
  "meta": {
    "timestamp": "2026-11-11T13:20:00.000Z",
    "version": "v1.0"
  }
}
```

**Gagal (`4xx`, `5xx`):**
```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Penjelasan kesalahan yang ramah pengguna",
    "details": {}
  }
}
```

### 0.2 Kode Error Standar
| Kode Error | HTTP Status | Keterangan |
|---|---|---|
| `VALIDATION_ERROR` | 400 | Input tidak sesuai skema atau di luar rentang klinis |
| `UNAUTHORIZED` | 401 | Token JWT tidak ada, tidak valid, atau kedaluwarsa |
| `NOT_FOUND` | 404 | Resource pengguna / sesi tidak ditemukan |
| `AI_COACH_FALLBACK` | 200 / 502 | Server Ollama lokal offline/timeout; backend memberi fallback deterministik atau error terstruktur |
| `INTERNAL_ERROR` | 500 | Kesalahan server internal |

---

## 1. Kontrak 1: AI Vision Engine (`main` / `shared/vision` ↔ `frontend`)

```ts
export interface NormalizedLandmark {
  x: number; // [0.0, 1.0]
  y: number; // [0.0, 1.0]
  z: number;
  visibility?: number;
}

export interface PostureBaseline {
  shoulderWidth: number;
  shoulderY: number;
  neckVerticalDist: number;
  torsoNeckAngle: number;
  timestamp: number;
}

export interface PostureEvaluationResult {
  isPresent: boolean;
  isSlouching: boolean;
  isTooClose: boolean;
  isLeaningAsymmetric: boolean;
  isOverheadStretchValid: boolean;
  isStandingUp: boolean;
  metrics: {
    neckRatio: number;
    depthRatio: number;
    shoulderTiltDeg: number;
  };
}
```

---

## 2. Kontrak 2: Pedometer Sensor & IPAQ-SF (`frontend` ↔ `backend`)

```ts
export type ActivityIntensity =
  | "WALKING"
  | "MODERATE"
  | "VIGOROUS"
  | "MUSCLE_STRENGTHENING"
  | "ACUTE_AEROBIC_RELIEF";

export type DataSource = "WEB_SENSOR_API" | "POSE_CAMERA_AI" | "MANUAL_LOG";

export interface PedometerSampleResult {
  totalSteps: number;
  cadenceSpm: number;
  intensityType: "IDLE" | "WALKING" | "MODERATE" | "VIGOROUS";
  metMultiplier: number; // 1.0 | 3.3 | 4.0 | 8.0
}
```

---

## 3. Kontrak 3: REST API Endpoints (`backend` ↔ `frontend`)

### 3.1 Auth & Profil
- `POST /api/v1/auth/register` — Body: `{ name, nim, email, password, department? }` → Returns `{ token, user }`
- `POST /api/v1/auth/login` — Body: `{ email, password }` → Returns `{ token, user }`
- `POST /api/v1/auth/demo` — Login instan akun juri (`demo@campusflow.id`) → Returns `{ token, user }`
- `GET /api/v1/users/me` — Profil pengguna, `postureBaselineJson`, `weeklyMetsTarget`, `currentStreakDays`, `xpPoints`
- `PATCH /api/v1/users/me/settings` — Update `weeklyMetsTarget` atau preferensi izin

### 3.2 Vision Baseline & Sedentary Sessions
- `PATCH /api/v1/vision/baseline` — Body: `PostureBaseline` → Menyimpan kalibrasi 5 detik ke `User.postureBaselineJson`
- `POST /api/v1/sedentary/sessions` — Body:
  ```json
  {
    "startTime": "2026-11-11T08:00:00.000Z",
    "endTime": "2026-11-11T08:55:00.000Z",
    "durationMinutes": 50,
    "slouchCount": 2,
    "tooCloseCount": 1,
    "avgNeckRatio": 0.84,
    "breakCompleted": true,
    "breakDurationMins": 5,
    "verificationSource": "POSE_CAMERA_AI"
  }
  ```

### 3.3 Aktivitas Fisik & Pedometer
- `POST /api/v1/activities` — Body:
  ```json
  {
    "activityDate": "2026-11-11",
    "intensityType": "MODERATE",
    "durationMinutes": 25,
    "stepsCount": 2850,
    "avgCadenceSpm": 114,
    "source": "WEB_SENSOR_API",
    "notes": "Jalan cepat antar gedung kuliah"
  }
  ```
  *(Backend menghitung `calculatedMets = koefisien * durationMinutes` secara otoritatif).*
- `GET /api/v1/activities?days=7` — Daftar riwayat aktivitas & ringkasan MET mingguan + jumlah hari MSE (`WEEKLY_MSE_TARGET_DAYS = 2`).

### 3.4 Wellbeing Harian (PSS-4 + Tidur + Layar) & PSS-10 Mingguan
- `POST /api/v1/wellbeing/daily` — Body:
  ```json
  {
    "logDate": "2026-11-11",
    "sleepHours": 6.5,
    "sleepQualityScore": 3,
    "nonAcademicScreenHours": 4.0,
    "pss4Answers": [2, 2, 1, 3]
  }
  ```
  *(Backend menghitung `pss4TotalScore` dengan reverse score Q2 & Q3, `mvpaPerSedentaryRatio`, `triadPillarsMet` [0–3], dan `stressRiskLevel` [`LOW`|`MODERATE`|`HIGH`|`SEVERE`]).*
- `POST /api/v1/assessments/pss10` — Body: `{ rawAnswers: number[10], notes?: string }` → Reverse score item 4, 5, 7, 8 (indeks 3, 4, 6, 7).

### 3.5 Triad Dashboard & Riwayat
- `GET /api/v1/dashboard/triad?days=14` — Mengembalikan ringkasan hari ini (`totalSedentaryHours`, `totalMvpaMinutes`, `mvpaPerSedentaryRatio`, `sleepHours`, `pss4TotalScore`, `triadPillarsMet`, `stressRiskLevel`, `weeklyMetsTotal`, `weeklyMseDays`, `sedentaryRiskStatus`) + array deret waktu 7/14 hari untuk `Recharts`.

### 3.6 Web Push Notifications
- `POST /api/v1/notifications/subscribe` — Menyimpan objek VAPID `PushSubscription` ke `User.pushSubscription`.
- `POST /api/v1/notifications/test` — Memicu push notification intervensi duduk uji coba.

---

## 4. Kontrak 4: Agentic AI Coach (`backend` ↔ Ollama Lokal ↔ `frontend`)

- `POST /api/v1/ai-coach/generate` — Menganalisis `userTelemetry7Days` (log 7 hari terakhir + sesi duduk + aktivitas fisik + PSS-10 terbaru).
- `GET /api/v1/ai-coach/latest` — Mengambil insight terbaru.
- `PATCH /api/v1/ai-coach/:id/complete` — Menandai `isCompleted = true` dan menambah `xpPoints` pengguna.

**Skema JSON Output Terikat (`AiCoachingInsightDTO`):**
```json
{
  "id": "uuid",
  "createdAt": "2026-11-11T13:25:00.000Z",
  "dominantMediator": "SLEEP_MEDIATION_DEFICIT",
  "diagnosisSummary": "Ringkasan 2-3 kalimat korelasi duduk, langkah, dan tidur terhadap stres.",
  "isotemporalActionPlan": "Instruksi aksi fisik 10-20 menit spesifik lingkungan kampus/kos.",
  "recommendedMetsToday": 250,
  "scientificCitationNote": "Berdasarkan protokol mediasi tidur Mu et al. (2024) & Wang et al. (2025).",
  "isCompleted": false
}
```
Nilai valid `dominantMediator`:
`SEDENTARY_OVERLOAD` | `SLEEP_MEDIATION_DEFICIT` | `LOW_MVPA_VOLUME` | `EXAM_ACUTE_STRESS` | `OPTIMAL_BALANCE`.
