import { Router, type Request, type Response, type NextFunction } from "express";
import { z } from "zod";
import { sendSuccess } from "../lib/response.ts";
import { osLockService } from "../services/osLockService.ts";

export const osLockRouter = Router();

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

