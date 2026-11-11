# DATABASE_SCHEMA.md — Skema Prisma ORM & MySQL

> **FILE TARGET:** `backend/prisma/schema.prisma`  
> **PENANGGUNG JAWAB:** Syifa (`@syifamojocanggih-hash` — branch `backend`)

---

## 1. Skema Lengkap Prisma (`schema.prisma`)

```prisma
// File: backend/prisma/schema.prisma

generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "mysql"
  url      = env("DATABASE_URL")
}

enum ActivityIntensity {
  WALKING
  MODERATE
  VIGOROUS
  MUSCLE_STRENGTHENING
  ACUTE_AEROBIC_RELIEF
}

enum DataSource {
  WEB_SENSOR_API
  POSE_CAMERA_AI
  MANUAL_LOG
}

enum StressSeverity {
  LOW
  MODERATE
  HIGH
  SEVERE
}

model User {
  id                  String   @id @default(uuid())
  name                String   @db.VarChar(100)
  nim                 String   @unique @db.VarChar(30)
  email               String   @unique @db.VarChar(120)
  passwordHash        String   @db.VarChar(255)
  department          String   @default("Teknik Informatika") @db.VarChar(100)
  weeklyMetsTarget    Int      @default(1500)
  postureBaselineJson Json?    // Hasil kalibrasi 5 detik webcam
  pushSubscription    Json?    // Endpoint & keys Web Push VAPID
  currentStreakDays   Int      @default(0)
  xpPoints            Int      @default(0)
  createdAt           DateTime @default(now())

  sedentarySessions   SedentarySession[]
  physicalActivities  PhysicalActivity[]
  dailyWellbeingLogs  DailyWellbeingLog[]
  clinicalAssessments ClinicalAssessment[]
  aiCoachingInsights  AiCoachingInsight[]
}

model SedentarySession {
  id                 String     @id @default(uuid())
  userId             String
  startTime          DateTime
  endTime            DateTime
  durationMinutes    Int        // Durasi duduk aktual (menit)
  slouchCount        Int        @default(0) // Frekuensi membungkuk > 3 menit
  tooCloseCount      Int        @default(0) // Frekuensi jarak mata terlalu dekat
  avgNeckRatio       Float      @default(1.0)
  breakCompleted     Boolean    @default(false)
  breakDurationMins  Int        @default(0)
  verificationSource DataSource @default(POSE_CAMERA_AI)
  createdAt          DateTime   @default(now())

  user User @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@index([userId, startTime])
}

model PhysicalActivity {
  id              String            @id @default(uuid())
  userId          String
  activityDate    DateTime          @db.Date
  intensityType   ActivityIntensity
  durationMinutes Int
  stepsCount      Int               @default(0)
  avgCadenceSpm   Int               @default(0)
  calculatedMets  Float             // durasi x koefisien MET (3.3 / 4.0 / 8.0 / 5.0)
  source          DataSource        @default(WEB_SENSOR_API)
  notes           String?           @db.VarChar(255)
  createdAt       DateTime          @default(now())

  user User @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@index([userId, activityDate])
}

model DailyWellbeingLog {
  id                     String         @id @default(uuid())
  userId                 String
  logDate                DateTime       @db.Date
  sleepHours             Float          // Durasi tidur malam sebelumnya
  sleepQualityScore      Int            // Skala 1 (Sangat Buruk) s/d 5 (Sangat Segar)
  nonAcademicScreenHours Float          @default(0.0)
  pss4RawAnswersJson     Json           // Array [q1, q2, q3, q4]
  pss4TotalScore         Int            // Skor 0 - 16 (reverse scoring Q2 & Q3)
  totalSedentaryHours    Float          @default(0.0)
  totalMvpaMinutes       Int            @default(0)
  mvpaPerSedentaryRatio  Float          @default(0.0) // Target >= 25 menit/jam duduk
  triadPillarsMet        Int            @default(0)   // 0, 1, 2, atau 3 pilar terpenuhi
  stressRiskLevel        StressSeverity @default(LOW)
  createdAt              DateTime       @default(now())

  user User @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@unique([userId, logDate])
}

model ClinicalAssessment {
  id             String         @id @default(uuid())
  userId         String
  assessmentDate DateTime       @default(now())
  instrumentType String         @default("PSS_10") // PSS_10 atau DASS_21
  rawAnswersJson Json           // Jawaban 10 butir kuesioner
  totalScore     Int            // Rentang 0 - 40 untuk PSS-10
  severityLevel  StressSeverity
  notes          String?        @db.Text

  user User @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@index([userId, assessmentDate])
}

model AiCoachingInsight {
  id                     String   @id @default(uuid())
  userId                 String
  createdAt              DateTime @default(now())
  dominantMediator       String   @db.VarChar(80)
  diagnosisSummary       String   @db.Text
  isotemporalActionPlan  String   @db.Text
  recommendedMetsToday   Int
  scientificCitationNote String   @db.VarChar(255)
  isCompleted            Boolean  @default(false)

  user User @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@index([userId, createdAt])
}
```

---

## 2. Ketentuan Seeder Demo (`backend/prisma/seed.ts`)

1. Membuat user demo:
   - `email`: `demo@campusflow.id`
   - `name`: `Mahasiswa Demo CampusFlow`
   - `nim`: `4.33.24.0.01`
   - `department`: `Teknik Informatika`
2. Mengisi 14 hari `DailyWellbeingLog`, `PhysicalActivity`, dan `SedentarySession` secara progresif:
   - **Minggu 1 (Hari -14 s/d -8):** Duduk tinggi (`9.0–10.5` jam/hari), MVPA rendah (`10–15` menit/hari), tidur pendek (`5.5` jam), skor PSS-4 tinggi (`10–12`), `ClinicalAssessment` PSS-10 awal = **28 (`SEVERE`)**.
   - **Minggu 2 (Hari -7 s/d -1):** Intervensi Active Break rutin, jalan kampus meningkat (`35–45` menit/hari, `>= 2` hari MSE/minggu), tidur membaik (`7.5` jam), skor PSS-4 turun (`4–5`), `ClinicalAssessment` PSS-10 akhir = **16 (`MODERATE` menuju `LOW`)**.
3. Menambahkan 2–3 entri `AiCoachingInsight` historis agar halaman AI Coach dan Riwayat tampak penuh saat presentasi ke juri/dosen.
