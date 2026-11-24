import { Router, type Request, type Response, type NextFunction } from "express";
import { z } from "zod";
import { prisma } from "../lib/prisma.ts";
import { sendSuccess } from "../lib/response.ts";
import { optionalAuth, type AuthenticatedRequest } from "../middleware/auth.ts";
import { recalculateTodayBurnoutLog, toUtcDateOnly } from "../services/burnoutSync.ts";
import { osLockService } from "../services/osLockService.ts";

export const osLockRouter = Router();

// Throttle persistensi screen time ke MySQL per user (maksimal 1x per 30 detik kecuali berubah signifikan)
const lastDbScreenSyncByUser = new Map<string, { atMs: number; mins: number }>();

async function syncUserScreenTimeWithDb(
  userId: string,
  osActiveSeconds: number
): Promise<{ syncedMinutes: number; mergedSeconds: number }> {
  const today = toUtcDateOnly(new Date());
  const osMins = Math.floor(osActiveSeconds / 60);

  const existing = await prisma.dailyFussionLog.findUnique({
    where: { userId_logDate: { userId, logDate: today } },
    select: { totalScreenTimeMins: true },
  });

  const dbMins = existing?.totalScreenTimeMins ?? 0;
  const mergedMins = Math.max(dbMins, osMins);
  const mergedSeconds = Math.max(osActiveSeconds, mergedMins * 60);

  const now = Date.now();
  const prevSync = lastDbScreenSyncByUser.get(userId);
  const shouldPersist =
    !existing ||
    mergedMins > dbMins && (!prevSync || now - prevSync.atMs >= 30_000 || mergedMins - prevSync.mins >= 2);

  if (shouldPersist) {
    lastDbScreenSyncByUser.set(userId, { atMs: now, mins: mergedMins });
    await prisma.dailyFussionLog.upsert({
      where: { userId_logDate: { userId, logDate: today } },
      update: { totalScreenTimeMins: mergedMins },
      create: {
        userId,
        logDate: today,
        totalScreenTimeMins: mergedMins,
        sleepHours: 7.0,
        academicLoadScore: 0,
        screenFatigueScore: 0,
        recoveryScore: 0,
        verifiedBreakCount: 0,
        burnoutIndex: 0,
        status: "LOW",
      },
    });
    await recalculateTodayBurnoutLog(userId, today);
  }

  return { syncedMinutes: mergedMins, mergedSeconds };
}

const armPayloadSchema = z.object({
  durationSeconds: z.coerce.number().int().min(1).max(86400).default(15),
  reason: z.string().min(1).max(200).optional(),
  targetUrl: z.string().max(300).optional(),
  preferredBrowser: z.string().max(100).optional(),
});

const lockPayloadSchema = z.object({
  reason: z.string().min(1).max(200).optional(),
  targetUrl: z.string().max(300).optional(),
  preferredBrowser: z.string().max(100).optional(),
});

const unlockPayloadSchema = z.object({
  verificationSource: z.string().min(1).max(100).default("POSE_CAMERA_AI"),
});

function inferBrowserFromRequest(req: Request, explicit?: string): string | undefined {
  if (explicit) return explicit;
  const ua = req.headers["user-agent"] || "";
  if (ua.includes("Edg/")) return "Microsoft Edge";
  if (ua.includes("Safari/") && !ua.includes("Chrome/") && !ua.includes("Chromium/")) {
    return "Safari";
  }
  return undefined;
}

osLockRouter.get("/status", (_req: Request, res: Response) => {
  sendSuccess(res, osLockService.getStatus());
});

osLockRouter.get("/screentime", optionalAuth, async (req: AuthenticatedRequest, res: Response) => {
  const clientSeconds =
    req.query.clientSeconds !== undefined ? Number(req.query.clientSeconds) : undefined;
  const state = osLockService.getScreenTimeState(clientSeconds);

  if (req.user?.sub) {
    try {
      const { syncedMinutes, mergedSeconds } = await syncUserScreenTimeWithDb(
        req.user.sub,
        state.osActiveSeconds
      );
      return sendSuccess(res, {
        ...state,
        osActiveSeconds: mergedSeconds,
        osActiveMinutes: syncedMinutes,
        osActiveHours: Number((mergedSeconds / 3600).toFixed(2)),
        persistedToDb: true,
      });
    } catch {
      // Fallback ke state sensor lokal jika DB sedang tidak tersedia
    }
  }

  sendSuccess(res, state);
});

osLockRouter.post("/screentime/sync", optionalAuth, async (req: AuthenticatedRequest, res: Response) => {
  const clientSeconds =
    req.body && typeof req.body.clientSeconds === "number"
      ? req.body.clientSeconds
      : undefined;
  const state = osLockService.getScreenTimeState(clientSeconds);

  if (req.user?.sub) {
    try {
      const { syncedMinutes, mergedSeconds } = await syncUserScreenTimeWithDb(
        req.user.sub,
        state.osActiveSeconds
      );
      return sendSuccess(res, {
        ...state,
        osActiveSeconds: mergedSeconds,
        osActiveMinutes: syncedMinutes,
        osActiveHours: Number((mergedSeconds / 3600).toFixed(2)),
        persistedToDb: true,
      });
    } catch {
      // Fallback ke state sensor lokal
    }
  }

  sendSuccess(res, state);
});

osLockRouter.post("/arm", (req: Request, res: Response, next: NextFunction) => {
  try {
    const parsed = armPayloadSchema.parse(req.body ?? {});
    const state = osLockService.armTimer({
      durationSeconds: parsed.durationSeconds,
      reason: parsed.reason,
      targetUrl: parsed.targetUrl || req.headers.origin,
      preferredBrowser: inferBrowserFromRequest(req, parsed.preferredBrowser),
    });
    sendSuccess(res, state);
  } catch (err) {
    next(err);
  }
});

osLockRouter.post("/disarm", (_req: Request, res: Response) => {
  sendSuccess(res, osLockService.disarmTimer());
});

osLockRouter.post("/lock", (req: Request, res: Response, next: NextFunction) => {
  try {
    const parsed = lockPayloadSchema.parse(req.body ?? {});
    const state = osLockService.lockScreen({
      reason: parsed.reason,
      targetUrl: parsed.targetUrl || req.headers.origin,
      preferredBrowser: inferBrowserFromRequest(req, parsed.preferredBrowser),
    });
    sendSuccess(res, state);
  } catch (err) {
    next(err);
  }
});

osLockRouter.post("/unlock", (req: Request, res: Response, next: NextFunction) => {
  try {
    const parsed = unlockPayloadSchema.parse(req.body ?? {});
    const state = osLockService.unlockScreen(parsed.verificationSource);
    sendSuccess(res, state);
  } catch (err) {
    next(err);
  }
});

