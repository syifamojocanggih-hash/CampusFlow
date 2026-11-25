import { Prisma } from "@prisma/client";
import { Router } from "express";
import type webpush from "web-push";
import { z } from "zod";
import { env } from "../config/env.ts";
import { prisma } from "../lib/prisma.ts";
import { AppError, sendSuccess } from "../lib/response.ts";
import { requireAuth, type AuthenticatedRequest } from "../middleware/auth.ts";
import { toUtcDateOnly } from "../services/burnoutSync.ts";
import { sendInterventionPush } from "../services/pushNotifier.ts";

export const notificationsRouter = Router();

const subscriptionSchema = z.object({
  endpoint: z.string().url(),
  keys: z.object({
    p256dh: z.string().min(1),
    auth: z.string().min(1),
  }),
});

/**
 * GET /api/v1/notifications
 * Mengambil notifikasi harian user dari database MySQL.
 * Jika hari ini belum ada notifikasi, secara dinamis menghasilkan pengingat kontekstual
 * berdasarkan data nyata user hari ini (jadwal kuliah, tidur, active break, check-in).
 */
notificationsRouter.get("/", requireAuth, async (req: AuthenticatedRequest, res) => {
  const userId = req.user!.sub;
  const todayUtc = toUtcDateOnly(new Date());
  const dayOfWeek = todayUtc.getUTCDay() === 0 ? 7 : todayUtc.getUTCDay();

  const existingTodayCount = await prisma.userNotification.count({
    where: { userId, logDate: todayUtc },
  });

  if (existingTodayCount === 0) {
    const [todaySchedules, todayWellbeing, todayFussion, user] = await Promise.all([
      prisma.academicSchedule.findMany({ where: { userId, dayOfWeek } }),
      prisma.dailyWellbeingLog.findUnique({
        where: { userId_logDate: { userId, logDate: todayUtc } },
      }),
      prisma.dailyFussionLog.findUnique({
        where: { userId_logDate: { userId, logDate: todayUtc } },
      }),
      prisma.user.findUnique({
        where: { id: userId },
        select: { currentStreakDays: true },
      }),
    ]);

    const toCreate: Array<{
      userId: string;
      category: string;
      title: string;
      message: string;
      actionTab: string | null;
      actionLabel: string | null;
      logDate: Date;
    }> = [];

    if (todaySchedules.length > 0) {
      const totalSks = todaySchedules.reduce((sum, s) => sum + s.creditHours, 0);
      const hasExam = todaySchedules.some((s) => s.isExamWeek || Boolean(s.examDate));
      toCreate.push({
        userId,
        category: "academic",
        title: hasExam ? "Pekan Ujian & Jadwal Kuliah Hari Ini" : "Jadwal Kuliah Hari Ini",
        message: `Kamu memiliki ${todaySchedules.length} mata kuliah (${totalSks} SKS) hari ini. Selipkan jeda aktif 2 menit di sela belajar agar fokus tetap optimal.`,
        actionTab: "dashboard",
        actionLabel: "Lihat Jadwal",
        logDate: todayUtc,
      });
    }

    if (!todayWellbeing) {
      toCreate.push({
        userId,
        category: "coach",
        title: "Check-in Harian Belum Diisi",
        message:
          "Luangkan 30 detik untuk mengisi check-in stres PSS-4 dan tidur agar AI Coach dapat memberi rekomendasi akurat.",
        actionTab: "activity",
        actionLabel: "Isi Check-in",
        logDate: todayUtc,
      });
    } else if (todayWellbeing.sleepHours < 6) {
      toCreate.push({
        userId,
        category: "coach",
        title: "Durasi Tidur di Bawah Target",
        message: `Tidur terdeteksimu ${todayWellbeing.sleepHours} jam. Kurangi paparan layar malam ini dan jadwalkan jeda peregangan lebih rutin.`,
        actionTab: "coach",
        actionLabel: "Tanya AI Coach",
        logDate: todayUtc,
      });
    }

    if ((todayFussion?.verifiedBreakCount ?? 0) === 0) {
      toCreate.push({
        userId,
        category: "break",
        title: "Waktunya Jeda Aktif Pertama!",
        message:
          "Lakukan 1 sesi peregangan Overhead Stretch 2 menit via Vision Guard untuk menambah +10 Recovery Score & +15 XP.",
        actionTab: "focus",
        actionLabel: "Mulai Jeda Aktif",
        logDate: todayUtc,
      });
    }

    if ((user?.currentStreakDays ?? 0) >= 3) {
      toCreate.push({
        userId,
        category: "streak",
        title: `Streak ${user!.currentStreakDays} Hari Terjaga!`,
        message:
          "Konsistensimu luar biasa! Pertahankan ritme belajar sehat dan gerak aktif hari ini agar maskot Mimi terus berkembang.",
        actionTab: "history",
        actionLabel: "Lihat Riwayat",
        logDate: todayUtc,
      });
    }

    if (toCreate.length > 0) {
      await prisma.userNotification.createMany({ data: toCreate });
    }
  }

  const items = await prisma.userNotification.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    take: 30,
  });

  const unreadCount = items.filter((item) => !item.isRead).length;
  sendSuccess(res, { unreadCount, items });
});

notificationsRouter.patch("/read-all", requireAuth, async (req: AuthenticatedRequest, res) => {
  const result = await prisma.userNotification.updateMany({
    where: { userId: req.user!.sub, isRead: false },
    data: { isRead: true },
  });
  sendSuccess(res, { updatedCount: result.count });
});

notificationsRouter.patch("/:id/read", requireAuth, async (req: AuthenticatedRequest, res) => {
  const id = String(req.params.id);
  const existing = await prisma.userNotification.findFirst({
    where: { id, userId: req.user!.sub },
  });
  if (!existing) {
    throw new AppError(404, "NOT_FOUND", "Notifikasi tidak ditemukan.");
  }
  const updated = await prisma.userNotification.update({
    where: { id: existing.id },
    data: { isRead: true },
  });
  sendSuccess(res, updated);
});

notificationsRouter.delete("/:id", requireAuth, async (req: AuthenticatedRequest, res) => {
  const id = String(req.params.id);
  const deleted = await prisma.userNotification.deleteMany({
    where: { id, userId: req.user!.sub },
  });
  sendSuccess(res, { deleted: deleted.count > 0 });
});

notificationsRouter.get("/vapid-public-key", (_req, res) => {
  sendSuccess(res, {
    publicKey: env.VAPID_PUBLIC_KEY || null,
    configured: Boolean(env.VAPID_PUBLIC_KEY && env.VAPID_PRIVATE_KEY),
  });
});

notificationsRouter.post("/subscribe", requireAuth, async (req: AuthenticatedRequest, res) => {
  const subscription = subscriptionSchema.parse(req.body);
  await prisma.user.update({
    where: { id: req.user!.sub },
    data: { pushSubscription: subscription },
  });
  sendSuccess(res, { subscribed: true }, 201);
});

notificationsRouter.delete("/subscribe", requireAuth, async (req: AuthenticatedRequest, res) => {
  await prisma.user.update({
    where: { id: req.user!.sub },
    data: { pushSubscription: Prisma.DbNull },
  });
  sendSuccess(res, { subscribed: false });
});

notificationsRouter.post("/test", requireAuth, async (req: AuthenticatedRequest, res) => {
  const user = await prisma.user.findUnique({
    where: { id: req.user!.sub },
    select: { pushSubscription: true },
  });
  if (!user?.pushSubscription) {
    throw new AppError(404, "NOT_FOUND", "Langganan Web Push pengguna belum terdaftar.");
  }

  const result = await sendInterventionPush(
    user.pushSubscription as unknown as webpush.PushSubscription,
    {
      title: "CampusFlow — Waktunya Jeda Aktif!",
      body: "Anda sudah duduk cukup lama. Lakukan peregangan 5 menit untuk menjaga fokus dan menekan stres.",
    }
  );
  if (result.expired) {
    await prisma.user.update({
      where: { id: req.user!.sub },
      data: { pushSubscription: Prisma.DbNull },
    });
  }
  sendSuccess(res, result);
});
