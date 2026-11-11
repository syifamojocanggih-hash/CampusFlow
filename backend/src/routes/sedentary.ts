import { Router } from "express";
import { z } from "zod";
import { prisma } from "../lib/prisma.ts";
import { sendSuccess } from "../lib/response.ts";
import { requireAuth, type AuthenticatedRequest } from "../middleware/auth.ts";
import { syncDailyWellbeingAggregates } from "../services/dailyAggregation.ts";

export const sedentaryRouter = Router();

const createSessionSchema = z.object({
  startTime: z.string().datetime(),
  endTime: z.string().datetime(),
  durationMinutes: z.number().int().min(1).max(1440),
  slouchCount: z.number().int().min(0).default(0),
  tooCloseCount: z.number().int().min(0).default(0),
  avgNeckRatio: z.number().min(0.1).max(3).default(1.0),
  breakCompleted: z.boolean().default(false),
  breakDurationMins: z.number().int().min(0).max(180).default(0),
  verificationSource: z.enum(["WEB_SENSOR_API", "POSE_CAMERA_AI", "MANUAL_LOG"]).default("POSE_CAMERA_AI"),
});

sedentaryRouter.post("/sessions", requireAuth, async (req: AuthenticatedRequest, res) => {
  const body = createSessionSchema.parse(req.body);
  const userId = req.user!.sub;

  const session = await prisma.sedentarySession.create({
    data: {
      userId,
      startTime: new Date(body.startTime),
      endTime: new Date(body.endTime),
      durationMinutes: body.durationMinutes,
      slouchCount: body.slouchCount,
      tooCloseCount: body.tooCloseCount,
      avgNeckRatio: body.avgNeckRatio,
      breakCompleted: body.breakCompleted,
      breakDurationMins: body.breakDurationMins,
      verificationSource: body.verificationSource,
    },
  });

  if (body.breakCompleted) {
    await prisma.user.update({
      where: { id: userId },
      data: { xpPoints: { increment: 25 } },
    });
  }

  await syncDailyWellbeingAggregates(userId, session.startTime);
  sendSuccess(res, session, 201);
});

sedentaryRouter.get("/sessions", requireAuth, async (req: AuthenticatedRequest, res) => {
  const days = Math.min(30, Math.max(1, Number(req.query.days ?? 7)));
  const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

  const sessions = await prisma.sedentarySession.findMany({
    where: { userId: req.user!.sub, startTime: { gte: since } },
    orderBy: { startTime: "desc" },
  });

  sendSuccess(res, sessions);
});

