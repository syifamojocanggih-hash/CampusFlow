import { prisma } from "../lib/prisma.ts";
import { evaluate24HourTriad } from "./clinicalScoring.ts";

/** Mengonversi tanggal/ISO string menjadi Date UTC midnight untuk kolom MySQL @db.Date. */
export function toUtcDateOnly(input: string | Date): Date {
  const isoDay =
    typeof input === "string" ? input.slice(0, 10) : input.toISOString().slice(0, 10);
  return new Date(`${isoDay}T00:00:00.000Z`);
}

/** Mengambil total durasi duduk (jam) dan MVPA (menit) untuk tanggal UTC tertentu. */
export async function getDailyActivityAndSedentaryTotals(
  userId: string,
  dateInput: string | Date
): Promise<{ dayStart: Date; totalSedentaryHours: number; totalMvpaMinutes: number }> {
  const dayStart = toUtcDateOnly(dateInput);
  const dayEnd = new Date(dayStart.getTime() + 24 * 60 * 60 * 1000);

  const [sedentaryAgg, activityAgg] = await Promise.all([
    prisma.sedentarySession.aggregate({
      where: { userId, startTime: { gte: dayStart, lt: dayEnd } },
      _sum: { durationMinutes: true },
    }),
    prisma.physicalActivity.aggregate({
      where: { userId, activityDate: dayStart },
      _sum: { durationMinutes: true },
    }),
  ]);

  return {
    dayStart,
    totalSedentaryHours: Number(((sedentaryAgg._sum.durationMinutes ?? 0) / 60).toFixed(2)),
    totalMvpaMinutes: activityAgg._sum.durationMinutes ?? 0,
  };
}

/** Mengagregasi ulang total sedentary, MVPA, rasio, dan skor Triad pada log harian terkait. */
export async function syncDailyWellbeingAggregates(userId: string, dateInput: string | Date) {
  const { dayStart, totalSedentaryHours, totalMvpaMinutes } =
    await getDailyActivityAndSedentaryTotals(userId, dateInput);

  const existingLog = await prisma.dailyWellbeingLog.findUnique({
    where: { userId_logDate: { userId, logDate: dayStart } },
  });

  if (!existingLog) {
    return null;
  }

  const triad = evaluate24HourTriad({
    totalMvpaMinutes,
    sleepHours: existingLog.sleepHours,
    sleepQualityScore: existingLog.sleepQualityScore,
    totalSedentaryHours,
    nonAcademicScreenHours: existingLog.nonAcademicScreenHours,
  });

  return prisma.dailyWellbeingLog.update({
    where: { id: existingLog.id },
    data: {
      totalSedentaryHours,
      totalMvpaMinutes,
      mvpaPerSedentaryRatio: triad.mvpaPerSedentaryRatio,
      triadPillarsMet: triad.triadPillarsMet,
    },
  });
}
