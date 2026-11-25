import bcrypt from "bcryptjs";
import { Prisma } from "@prisma/client";
import { Router, type Response } from "express";
import { z } from "zod";
import { prisma } from "../lib/prisma.ts";
import { AppError, sendSuccess } from "../lib/response.ts";
import { requireAuth, type AuthenticatedRequest } from "../middleware/auth.ts";

export const usersRouter = Router();
export const visionRouter = Router();

const userSelectFields = {
  id: true,
  name: true,
  nim: true,
  email: true,
  department: true,
  weeklyMetsTarget: true,
  targetRecoveryScore: true,
  currentStreakDays: true,
  xpPoints: true,
  postureBaselineJson: true,
} as const;

const settingsSchema = z.object({
  name: z.string().min(2).max(100).optional(),
  weeklyMetsTarget: z.number().int().min(300).max(10000).optional(),
  targetRecoveryScore: z.number().int().min(10).max(100).optional(),
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
    select: userSelectFields,
  });

  if (!user) throw new AppError(404, "NOT_FOUND", "Pengguna tidak ditemukan.");
  sendSuccess(res, user);
});

async function handleUpdateProfile(req: AuthenticatedRequest, res: Response) {
  const body = settingsSchema.parse(req.body);
  const updated = await prisma.user.update({
    where: { id: req.user!.sub },
    data: body,
    select: userSelectFields,
  });
  sendSuccess(res, updated);
}

const changePasswordSchema = z.object({
  currentPassword: z.string().min(1),
  newPassword: z.string().min(4).max(100),
});

usersRouter.patch("/me", requireAuth, handleUpdateProfile);
usersRouter.patch("/me/settings", requireAuth, handleUpdateProfile);

usersRouter.patch("/me/password", requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  const body = changePasswordSchema.parse(req.body);
  const userId = req.user!.sub;

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, passwordHash: true },
  });
  if (!user) throw new AppError(404, "NOT_FOUND", "Pengguna tidak ditemukan.");

  const valid = await bcrypt.compare(body.currentPassword, user.passwordHash);
  if (!valid) {
    throw new AppError(401, "UNAUTHORIZED", "Kata sandi saat ini tidak sesuai.");
  }

  const newHash = await bcrypt.hash(body.newPassword, 10);
  await prisma.user.update({
    where: { id: userId },
    data: { passwordHash: newHash },
  });

  sendSuccess(res, { updated: true });
});

usersRouter.delete("/me/data", requireAuth, async (req: AuthenticatedRequest, res) => {
  const userId = req.user!.sub;
  await prisma.$transaction([
    prisma.sedentarySession.deleteMany({ where: { userId } }),
    prisma.physicalActivity.deleteMany({ where: { userId } }),
    prisma.dailyWellbeingLog.deleteMany({ where: { userId } }),
    prisma.clinicalAssessment.deleteMany({ where: { userId } }),
    prisma.aiCoachingInsight.deleteMany({ where: { userId } }),
    prisma.academicSchedule.deleteMany({ where: { userId } }),
    prisma.dailyFussionLog.deleteMany({ where: { userId } }),
    prisma.activeBreakSession.deleteMany({ where: { userId } }),
    prisma.userNotification.deleteMany({ where: { userId } }),
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

async function handleSaveBaseline(req: AuthenticatedRequest, res: Response) {
  const baseline = baselineSchema.parse(req.body);
  const updated = await prisma.user.update({
    where: { id: req.user!.sub },
    data: { postureBaselineJson: baseline },
    select: { id: true, postureBaselineJson: true },
  });
  sendSuccess(res, updated);
}

visionRouter.patch("/baseline", requireAuth, handleSaveBaseline);
visionRouter.post("/baseline", requireAuth, handleSaveBaseline);
