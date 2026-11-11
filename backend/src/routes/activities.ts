import { Router } from "express";
import { z } from "zod";
import { CLINICAL_CONSTANTS } from "../../../shared/contracts/index.ts";
import { prisma } from "../lib/prisma.ts";
import { sendSuccess } from "../lib/response.ts";
import { requireAuth, type AuthenticatedRequest } from "../middleware/auth.ts";
import { calculateActivityMets } from "../services/clinicalScoring.ts";
import { syncDailyWellbeingAggregates, toUtcDateOnly } from "../services/dailyAggregation.ts";

export const activitiesRouter = Router();

const createActivitySchema = z.object({
  activityDate: z.string().min(10),
  intensityType: z.enum([
    "WALKING",
    "MODERATE",
    "VIGOROUS",
    "MUSCLE_STRENGTHENING",
    "ACUTE_AEROBIC_RELIEF",
  ]),
  durationMinutes: z.number().int().min(1).max(600),
  stepsCount: z.number().int().min(0).default(0),
  avgCadenceSpm: z.number().int().min(0).max(300).default(0),
  source: z.enum(["WEB_SENSOR_API", "POSE_CAMERA_AI", "MANUAL_LOG"]).default("WEB_SENSOR_API"),
  notes: z.string().max(255).optional(),
});

activitiesRouter.post("/", requireAuth, async (req: AuthenticatedRequest, res) => {
  const body = createActivitySchema.parse(req.body);
  const userId = req.user!.sub;
  const activityDate = toUtcDateOnly(body.activityDate);
  const calculatedMets = calculateActivityMets(body.intensityType, body.durationMinutes);

  const activity = await prisma.physicalActivity.create({
    data: {
      userId,
      activityDate,
      intensityType: body.intensityType,
      durationMinutes: body.durationMinutes,
      stepsCount: body.stepsCount,
      avgCadenceSpm: body.avgCadenceSpm,
      calculatedMets,
      source: body.source,
      notes: body.notes,
    },
  });

  await prisma.user.update({
    where: { id: userId },
    data: { xpPoints: { increment: 20 } },
  });

  await syncDailyWellbeingAggregates(userId, activityDate);
  sendSuccess(res, activity, 201);
});

activitiesRouter.get("/", requireAuth, async (req: AuthenticatedRequest, res) => {
  const days = Math.min(30, Math.max(1, Number(req.query.days ?? 7)));
  const since = new Date();
  since.setUTCHours(0, 0, 0, 0);
  since.setUTCDate(since.getUTCDate() - (days - 1));

  const activities = await prisma.physicalActivity.findMany({
    where: { userId: req.user!.sub, activityDate: { gte: since } },
    orderBy: [{ activityDate: "desc" }, { createdAt: "desc" }],
  });

  const totalMets = Number(
    activities.reduce((sum, item) => sum + item.calculatedMets, 0).toFixed(1)
  );
  const mseDaysSet = new Set(
    activities
      .filter((item) => item.intensityType === "MUSCLE_STRENGTHENING")
      .map((item) => item.activityDate.toISOString().slice(0, 10))
  );

  sendSuccess(res, {
    items: activities,
    summary: {
      totalMets,
      weeklyMetsTarget: CLINICAL_CONSTANTS.WEEKLY_TOTAL_METS_TARGET,
      mseDaysCount: mseDaysSet.size,
      weeklyMseTarget: CLINICAL_CONSTANTS.WEEKLY_MSE_TARGET_DAYS,
    },
  });
});

