import { Router } from "express";
import type webpush from "web-push";
import { z } from "zod";
import { prisma } from "../lib/prisma.ts";
import { AppError, sendSuccess } from "../lib/response.ts";
import { requireAuth, type AuthenticatedRequest } from "../middleware/auth.ts";
import { sendInterventionPush } from "../services/pushNotifier.ts";

export const notificationsRouter = Router();

const subscriptionSchema = z.object({
  endpoint: z.string().url(),
  keys: z.object({
    p256dh: z.string().min(1),
    auth: z.string().min(1),
  }),
});

notificationsRouter.post("/subscribe", requireAuth, async (req: AuthenticatedRequest, res) => {
  const subscription = subscriptionSchema.parse(req.body);
  await prisma.user.update({
    where: { id: req.user!.sub },
    data: { pushSubscription: subscription },
  });
  sendSuccess(res, { subscribed: true }, 201);
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
  sendSuccess(res, result);
});

