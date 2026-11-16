import { Router, type Response, type NextFunction } from "express";
import { z } from "zod";
import { prisma } from "../lib/prisma.ts";
import { sendSuccess } from "../lib/response.ts";
import { requireAuth, type AuthenticatedRequest } from "../middleware/auth.ts";

export const activeBreakRouter = Router();

activeBreakRouter.use(requireAuth);

const activeBreakPayloadSchema = z.object({
  durationMins: z.coerce.number().positive().default(2.0),
  poseVerified: z.boolean().default(true),
  poseType: z.string().min(1).default("OVERHEAD_STRETCH"),
  startTime: z.string().datetime().optional(),
});

/**
 * POST /api/v1/active-break/verify
 * Menyimpan sesi Active Break yang berhasil divalidasi oleh MediaPipe (2 menit).
 */
activeBreakRouter.post("/verify", async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const userId = req.user!.sub;
    const parsed = activeBreakPayloadSchema.parse(req.body);
    const session = await prisma.activeBreakSession.create({
      data: {
        userId,
        durationMins: parsed.durationMins,
        poseVerified: parsed.poseVerified,
        poseType: parsed.poseType,
        startTime: parsed.startTime ? new Date(parsed.startTime) : new Date(),
      },
    });

    // Beri bonus XP (15 XP) untuk pengguna yang berhasil menyelesaikan Active Break
    await prisma.user.update({
      where: { id: userId },
      data: {
        xpPoints: { increment: 15 },
      },
    });

    sendSuccess(res, session, 201);
  } catch (error) {
    next(error);
  }
});
