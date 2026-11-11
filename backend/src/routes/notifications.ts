import { Prisma } from "@prisma/client";
import { Router } from "express";
import type webpush from "web-push";
import { z } from "zod";
import { env } from "../config/env.ts";
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
  sendSuccess(res, result);
});
