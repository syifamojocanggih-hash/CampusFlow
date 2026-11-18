import { Router, type Response, type NextFunction } from "express";
import { z } from "zod";
import { BURNOUT_CONSTANTS } from "../../../shared/contracts/index.ts";
import { prisma } from "../lib/prisma.ts";
import { sendSuccess } from "../lib/response.ts";
import { requireAuth, type AuthenticatedRequest } from "../middleware/auth.ts";
import { recalculateTodayBurnoutLog } from "../services/burnoutSync.ts";

export const activeBreakRouter = Router();

activeBreakRouter.use(requireAuth);

const activeBreakPayloadSchema = z.object({
  durationMins: z.coerce.number().positive().default(2.0),
  poseVerified: z.boolean().default(true),
  poseType: z.string().min(1).max(50).default("OVERHEAD_STRETCH"),
  startTime: z.string().datetime().optional(),
});

/**
 * POST /api/v1/active-break/verify
 * Menyimpan sesi Active Break yang berhasil divalidasi oleh MediaPipe (2 menit),
 * memberi bonus +15 XP, dan otomatis menyinkronkan Recovery Score & Burnout Index hari ini.
 */
activeBreakRouter.post(
  "/verify",
  async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const userId = req.user!.sub;
      const parsed = activeBreakPayloadSchema.parse(req.body);
      const startDateTime = parsed.startTime ? new Date(parsed.startTime) : new Date();

      const session = await prisma.activeBreakSession.create({
        data: {
          userId,
          durationMins: parsed.durationMins,
          poseVerified: parsed.poseVerified,
          poseType: parsed.poseType,
          startTime: startDateTime,
        },
      });

      // Beri bonus XP (15 XP) untuk pengguna yang berhasil menyelesaikan Active Break terverifikasi
      if (parsed.poseVerified) {
        await prisma.user.update({
          where: { id: userId },
          data: {
            xpPoints: { increment: 15 },
          },
        });
      }

      // Sinkronkan DailyFussionLog hari terkait agar Recovery Score (+10 poin) langsung tercermin
      const updatedBurnout = await recalculateTodayBurnoutLog(userId, startDateTime);

      sendSuccess(
        res,
        {
          ...session,
          xpAwarded: parsed.poseVerified ? 15 : 0,
          recoveryPointsAdded: parsed.poseVerified
            ? BURNOUT_CONSTANTS.ACTIVE_BREAK_SCORE_PER_SESSION
            : 0,
          updatedBurnout,
        },
        201
      );
    } catch (error) {
      next(error);
    }
  }
);

/**
 * GET /api/v1/active-break/today
 * Mengambil seluruh sesi Active Break hari ini beserta akumulasi poin pemulihan.
 */
activeBreakRouter.get(
  "/today",
  async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const userId = req.user!.sub;
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);

      const sessions = await prisma.activeBreakSession.findMany({
        where: {
          userId,
          startTime: { gte: today, lt: tomorrow },
        },
        orderBy: { startTime: "desc" },
      });

      const verifiedCount = sessions.filter((s) => s.poseVerified).length;
      const totalDurationMins = Number(
        sessions.reduce((sum, s) => sum + s.durationMins, 0).toFixed(2)
      );

      sendSuccess(res, {
        logDate: today.toISOString().split("T")[0],
        totalSessions: sessions.length,
        verifiedCount,
        totalDurationMins,
        totalRecoveryPoints: verifiedCount * BURNOUT_CONSTANTS.ACTIVE_BREAK_SCORE_PER_SESSION,
        items: sessions,
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * GET /api/v1/active-break/history?days=14
 * Mengambil riwayat sesi Active Break mahasiswa selama N hari terakhir.
 */
activeBreakRouter.get(
  "/history",
  async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const userId = req.user!.sub;
      const rawDays = Number(req.query.days ?? 14);
      const days = Number.isFinite(rawDays) ? Math.min(90, Math.max(1, Math.floor(rawDays))) : 14;

      const startDate = new Date();
      startDate.setHours(0, 0, 0, 0);
      startDate.setDate(startDate.getDate() - (days - 1));

      const sessions = await prisma.activeBreakSession.findMany({
        where: {
          userId,
          startTime: { gte: startDate },
        },
        orderBy: { startTime: "desc" },
      });

      const verifiedCount = sessions.filter((s) => s.poseVerified).length;

      sendSuccess(res, {
        days,
        totalSessions: sessions.length,
        verifiedCount,
        totalRecoveryPoints: verifiedCount * BURNOUT_CONSTANTS.ACTIVE_BREAK_SCORE_PER_SESSION,
        items: sessions,
      });
    } catch (error) {
      next(error);
    }
  }
);
