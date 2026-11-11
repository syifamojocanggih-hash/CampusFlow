import "dotenv/config";
import bcrypt from "bcryptjs";
import { PrismaClient, type ActivityIntensity, type StressSeverity } from "@prisma/client";
import {
  calculateActivityMets,
  calculatePss10Score,
  calculatePss4Score,
  classifyPss10Severity,
  classifyPss4Severity,
  evaluate24HourTriad,
} from "../src/services/clinicalScoring.ts";

const prisma = new PrismaClient();

function dayOffsetDate(daysAgo: number): Date {
  const d = new Date();
  d.setUTCHours(0, 0, 0, 0);
  d.setUTCDate(d.getUTCDate() - daysAgo);
  return d;
}

async function main() {
  const passwordHash = await bcrypt.hash("campusflow2027", 10);

  const demoUser = await prisma.user.upsert({
    where: { email: "demo@campusflow.id" },
    update: {
      name: "Mahasiswa Demo CampusFlow",
      nim: "4.33.24.0.01",
      department: "Teknik Informatika",
      currentStreakDays: 14,
      xpPoints: 420,
    },
    create: {
      name: "Mahasiswa Demo CampusFlow",
      nim: "4.33.24.0.01",
      email: "demo@campusflow.id",
      passwordHash,
      department: "Teknik Informatika",
      weeklyMetsTarget: 1500,
      currentStreakDays: 14,
      xpPoints: 420,
    },
  });

  // Bersihkan data lama demo agar seed idempotent
  await Promise.all([
    prisma.sedentarySession.deleteMany({ where: { userId: demoUser.id } }),
    prisma.physicalActivity.deleteMany({ where: { userId: demoUser.id } }),
    prisma.dailyWellbeingLog.deleteMany({ where: { userId: demoUser.id } }),
    prisma.clinicalAssessment.deleteMany({ where: { userId: demoUser.id } }),
    prisma.aiCoachingInsight.deleteMany({ where: { userId: demoUser.id } }),
  ]);

  // Pola 14 hari: Minggu 1 (tinggi stres & duduk) -> Minggu 2 (membaik)
  for (let i = 13; i >= 0; i--) {
    const dayDate = dayOffsetDate(i);
    const isWeekTwo = i < 7;

    const sedentaryMins = isWeekTwo ? 330 + (i % 3) * 20 : 540 + (i % 3) * 30;
    const mvpaMins = isWeekTwo ? 35 + (6 - i) * 2 : 12 + (i % 2) * 5;
    const sleepHours = isWeekTwo ? 7.2 + (i % 3) * 0.2 : 5.5 + (i % 2) * 0.4;
    const sleepQuality = isWeekTwo ? 4 : 2;
    const screenHours = isWeekTwo ? 4.0 : 8.5;
    const pss4Answers: [number, number, number, number] = isWeekTwo
      ? [1, 3, 3, 1] // skor = 4 (LOW)
      : [3, 1, 1, 3]; // skor = 12 (HIGH)

    const sessionStart = new Date(dayDate.getTime() + 8 * 60 * 60 * 1000);
    const sessionEnd = new Date(sessionStart.getTime() + sedentaryMins * 60 * 1000);

    await prisma.sedentarySession.create({
      data: {
        userId: demoUser.id,
        startTime: sessionStart,
        endTime: sessionEnd,
        durationMinutes: sedentaryMins,
        slouchCount: isWeekTwo ? 1 : 5,
        tooCloseCount: isWeekTwo ? 0 : 2,
        avgNeckRatio: isWeekTwo ? 0.91 : 0.74,
        breakCompleted: isWeekTwo,
        breakDurationMins: isWeekTwo ? 10 : 0,
        verificationSource: "POSE_CAMERA_AI",
      },
    });

    const intensity: ActivityIntensity = isWeekTwo
      ? i % 3 === 0
        ? "MUSCLE_STRENGTHENING"
        : "MODERATE"
      : "WALKING";

    await prisma.physicalActivity.create({
      data: {
        userId: demoUser.id,
        activityDate: dayDate,
        intensityType: intensity,
        durationMinutes: mvpaMins,
        stepsCount: mvpaMins * 110,
        avgCadenceSpm: isWeekTwo ? 114 : 78,
        calculatedMets: calculateActivityMets(intensity, mvpaMins),
        source: "WEB_SENSOR_API",
        notes: isWeekTwo
          ? "Jalan cepat kampus & jeda aktif terverifikasi"
          : "Jalan kaki singkat ke ruang kelas",
      },
    });

    const pss4Score = calculatePss4Score(pss4Answers);
    const stressLevel: StressSeverity = classifyPss4Severity(pss4Score);
    const triad = evaluate24HourTriad({
      totalMvpaMinutes: mvpaMins,
      sleepHours,
      sleepQualityScore: sleepQuality,
      totalSedentaryHours: Number((sedentaryMins / 60).toFixed(2)),
      nonAcademicScreenHours: screenHours,
    });

    await prisma.dailyWellbeingLog.create({
      data: {
        userId: demoUser.id,
        logDate: dayDate,
        sleepHours,
        sleepQualityScore: sleepQuality,
        nonAcademicScreenHours: screenHours,
        pss4RawAnswersJson: pss4Answers,
        pss4TotalScore: pss4Score,
        totalSedentaryHours: Number((sedentaryMins / 60).toFixed(2)),
        totalMvpaMinutes: mvpaMins,
        mvpaPerSedentaryRatio: triad.mvpaPerSedentaryRatio,
        triadPillarsMet: triad.triadPillarsMet,
        stressRiskLevel: stressLevel,
      },
    });
  }

  // Dua asesmen mingguan PSS-10 menunjukkan penurunan 28 -> 16
  const week1Pss10 = [3, 3, 3, 1, 1, 3, 1, 1, 3, 3]; // 18 + (3+3+3+3) = 30? Wait: index 3,4,6,7 = 1 -> 4-1=3 each -> 6*3 + 4*3 = 30. Gunakan 28:
  const week1Adjusted = [3, 3, 2, 1, 1, 3, 2, 1, 3, 3]; // 3+3+2+3+3+3+2+3+3+3 = 28
  const week2Adjusted = [2, 2, 1, 3, 2, 2, 2, 3, 1, 2]; // 2+2+1+1+2+2+2+1+1+2 = 16

  await prisma.clinicalAssessment.createMany({
    data: [
      {
        userId: demoUser.id,
        assessmentDate: dayOffsetDate(13),
        instrumentType: "PSS_10",
        rawAnswersJson: week1Adjusted,
        totalScore: calculatePss10Score(week1Adjusted),
        severityLevel: classifyPss10Severity(calculatePss10Score(week1Adjusted)),
        notes: "Baseline minggu pertama sebelum intervensi CampusFlow",
      },
      {
        userId: demoUser.id,
        assessmentDate: dayOffsetDate(0),
        instrumentType: "PSS_10",
        rawAnswersJson: week2Adjusted,
        totalScore: calculatePss10Score(week2Adjusted),
        severityLevel: classifyPss10Severity(calculatePss10Score(week2Adjusted)),
        notes: "Evaluasi minggu kedua setelah rutin jeda aktif & peningkatan METs",
      },
    ],
  });

  await prisma.aiCoachingInsight.createMany({
    data: [
      {
        userId: demoUser.id,
        createdAt: dayOffsetDate(10),
        dominantMediator: "SEDENTARY_OVERLOAD",
        diagnosisSummary:
          "Rata-rata waktu duduk Anda melebihi 9 jam/hari dengan rasio gerak rendah sehingga meningkatkan risiko kelelahan mental.",
        isotemporalActionPlan:
          "Substitusi 15 menit duduk sore dengan jalan cepat keliling gedung kuliah serta aktifkan jeda peregangan setiap 50 menit.",
        recommendedMetsToday: 220,
        scientificCitationNote:
          "Berdasarkan studi Barbosa et al. (2024) & substitusi isotemporal Su et al. (2022).",
        isCompleted: true,
      },
      {
        userId: demoUser.id,
        createdAt: dayOffsetDate(0),
        dominantMediator: "OPTIMAL_BALANCE",
        diagnosisSummary:
          "Konsistensi jeda aktif dan peningkatan gerak aktif mingguan berhasil menurunkan skor stres PSS-10 Anda dari 28 menjadi 16.",
        isotemporalActionPlan:
          "Pertahankan minimal 30 menit MVPA harian, 2 sesi latihan kekuatan otot per minggu, serta durasi tidur 7–8 jam malam ini.",
        recommendedMetsToday: 250,
        scientificCitationNote:
          "Sesuai kerangka 24-Hour Movement Guidelines Martín-Rodríguez & González-Prieto (2026).",
        isCompleted: false,
      },
    ],
  });

  console.log("Seed CampusFlow selesai untuk akun demo: demo@campusflow.id (password: campusflow2027)");
}

main()
  .catch((err) => {
    console.error("Seed gagal:", err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

