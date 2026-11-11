import { Prisma } from "@prisma/client";
import { Router } from "express";
import { z } from "zod";
import { prisma } from "../lib/prisma.ts";
import { AppError, sendSuccess } from "../lib/response.ts";
import { requireAuth, type AuthenticatedRequest } from "../middleware/auth.ts";

export const usersRouter = Router();
export const visionRouter = Router();

const settingsSchema = z.object({
  weeklyMetsTarget: z.number().int().min(300).max(10000).optional(),
  department: z.string().min(2).max(100).optional(),
});

const baselineSchema = z.object({
  shoulderWidth: z.number().positive(),
  shoulderY: z.number().min(0).max(1),
  neckVerticalDist: z.number().positive(),
  torsoNeckAngle: z.number().min(0).max(180),
  timestamp: z.number().int().positive(),
});

usersRouter.get("/me", requireAuth, async (req: AuthenticatedRequest, res) => {
  const user = await prisma.user.findUnique({
    where: { id: req.user!.sub },
    select: {
      id: true,
      name: true,
      nim: true,
      email: true,
      department: true,
      weeklyMetsTarget: true,
      currentStreakDays: true,
      xpPoints: true,
      postureBaselineJson: true,
    },
  });

  if (!user) throw new AppError(404, "NOT_FOUND", "Pengguna tidak ditemukan.");
  sendSuccess(res, user);
});

usersRouter.patch("/me/settings", requireAuth, async (req: AuthenticatedRequest, res) => {
  const body = settingsSchema.parse(req.body);
  const updated = await prisma.user.update({
    where: { id: req.user!.sub },
    data: body,
    select: {
      id: true,
      name: true,
      nim: true,
      email: true,
      department: true,
      weeklyMetsTarget: true,
      currentStreakDays: true,
      xpPoints: true,
      postureBaselineJson: true,
    },
  });
  sendSuccess(res, updated);
});

usersRouter.delete("/me/data", requireAuth, async (req: AuthenticatedRequest, res) => {
  const userId = req.user!.sub;
  await prisma.$transaction([
    prisma.sedentarySession.deleteMany({ where: { userId } }),
    prisma.physicalActivity.deleteMany({ where: { userId } }),
    prisma.dailyWellbeingLog.deleteMany({ where: { userId } }),
    prisma.clinicalAssessment.deleteMany({ where: { userId } }),
    prisma.aiCoachingInsight.deleteMany({ where: { userId } }),
    prisma.user.update({
      where: { id: userId },
      data: {
        postureBaselineJson: Prisma.DbNull,
        pushSubscription: Prisma.DbNull,
        currentStreakDays: 0,
        xpPoints: 0,
      },
    }),
  ]);

  sendSuccess(res, { cleared: true });
});

visionRouter.patch("/baseline", requireAuth, async (req: AuthenticatedRequest, res) => {
  const baseline = baselineSchema.parse(req.body);
  const updated = await prisma.user.update({
    where: { id: req.user!.sub },
    data: { postureBaselineJson: baseline },
    select: { id: true, postureBaselineJson: true },
  });
  sendSuccess(res, updated);
});

