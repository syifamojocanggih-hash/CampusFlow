import { prisma } from "../lib/prisma.ts";
import { calculateBurnoutRiskIndex } from "./burnoutScoring.ts";

export interface RecalculatedBurnoutSummary {
  fussionLogId: string;
  logDate: string;
  dayOfWeek: number;
  totalScreenTimeMins: number;
  sleepHours: number;
  academicLoadScore: number;
  screenFatigueScore: number;
  recoveryScore: number;
  verifiedBreakCount: number;
  burnoutIndex: number;
  status: "LOW" | "MODERATE" | "HIGH";
}

/**
 * Mengonversi tanggal lokal atau string YYYY-MM-DD ke UTC midnight (00:00:00.000Z)
 * agar selalu konsisten dengan tipe kolom MySQL @db.Date di Prisma (bebas bug timezone).
 */
export function toUtcDateOnly(input?: Date | string): Date {
  if (typeof input === "string" && /^\d{4}-\d{2}-\d{2}/.test(input)) {
    return new Date(`${input.slice(0, 10)}T00:00:00.000Z`);
  }
  const d = input instanceof Date ? input : new Date();
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return new Date(`${yyyy}-${mm}-${dd}T00:00:00.000Z`);
}

/**
 * Menghitung ulang dan menyinkronkan DailyFussionLog hari ini secara otomatis.
 * Dipanggil ketika jadwal kuliah (AcademicSchedule) berubah atau sesi Active Break baru terverifikasi.
 */
export async function recalculateTodayBurnoutLog(
  userId: string,
  referenceDate: Date | string = new Date()
): Promise<RecalculatedBurnoutSummary> {
  const targetDate = toUtcDateOnly(referenceDate);
  const dateStr = targetDate.toISOString().slice(0, 10);

  // Rentang waktu sesi Active Break dalam hari kalender lokal
  const localDayStart = new Date(`${dateStr}T00:00:00`);
  const localDayEnd = new Date(localDayStart);
  localDayEnd.setDate(localDayEnd.getDate() + 1);

  const dayOfWeek = targetDate.getUTCDay() === 0 ? 7 : targetDate.getUTCDay();

  const [todaySchedules, verifiedBreakCount, existingLog, wellbeingLog] = await Promise.all([
    prisma.academicSchedule.findMany({
      where: { userId, dayOfWeek },
    }),
    prisma.activeBreakSession.count({
      where: {
        userId,
        startTime: { gte: localDayStart, lt: localDayEnd },
        poseVerified: true,
      },
    }),
    prisma.dailyFussionLog.findUnique({
      where: {
        userId_logDate: {
          userId,
          logDate: targetDate,
        },
      },
    }),
    prisma.dailyWellbeingLog.findUnique({
      where: {
        userId_logDate: {
          userId,
          logDate: targetDate,
        },
      },
    }),
  ]);

  const totalScreenTimeMins = existingLog?.totalScreenTimeMins ?? 0;
  const totalScreenHours = totalScreenTimeMins / 60.0;
  const sleepHours = wellbeingLog?.sleepHours ?? existingLog?.sleepHours ?? 7.0;

  const calc = calculateBurnoutRiskIndex(
    todaySchedules.map((s) => ({
      creditHours: s.creditHours,
      isPracticum: s.isPracticum,
      classType: s.classType,
      isExamWeek: s.isExamWeek,
      examDate: s.examDate,
    })),
    totalScreenHours,
    sleepHours,
    verifiedBreakCount,
    targetDate
  );

  const updatedLog = await prisma.dailyFussionLog.upsert({
    where: {
      userId_logDate: {
        userId,
        logDate: targetDate,
      },
    },
    update: {
      sleepHours,
      academicLoadScore: calc.academicLoadScore,
      screenFatigueScore: calc.screenFatigueScore,
      recoveryScore: calc.recoveryScore,
      verifiedBreakCount,
      burnoutIndex: calc.burnoutIndex,
      status: calc.status,
    },
    create: {
      userId,
      logDate: targetDate,
      totalScreenTimeMins,
      sleepHours,
      academicLoadScore: calc.academicLoadScore,
      screenFatigueScore: calc.screenFatigueScore,
      recoveryScore: calc.recoveryScore,
      verifiedBreakCount,
      burnoutIndex: calc.burnoutIndex,
      status: calc.status,
    },
  });

  return {
    fussionLogId: updatedLog.id,
    logDate: dateStr,
    dayOfWeek,
    totalScreenTimeMins,
    sleepHours,
    academicLoadScore: calc.academicLoadScore,
    screenFatigueScore: calc.screenFatigueScore,
    recoveryScore: calc.recoveryScore,
    verifiedBreakCount,
    burnoutIndex: calc.burnoutIndex,
    status: calc.status,
  };
}
