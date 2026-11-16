import { Router, type Response, type NextFunction } from "express";
import { z } from "zod";
import { prisma } from "../lib/prisma.ts";
import { sendSuccess } from "../lib/response.ts";
import { requireAuth, type AuthenticatedRequest } from "../middleware/auth.ts";

export const scheduleRouter = Router();

scheduleRouter.use(requireAuth);

const scheduleItemSchema = z.object({
  dayOfWeek: z.coerce.number().int().min(1).max(7),
  subjectName: z.string().min(1).max(120),
  creditHours: z.coerce.number().positive(),
  isPracticum: z.boolean().optional().default(false),
  isExamWeek: z.boolean().optional().default(false),
});

const bulkScheduleSchema = z.object({
  schedules: z.array(scheduleItemSchema).min(1),
});

/**
 * GET /api/v1/schedule
 * Mengambil daftar jadwal akademik milik user.
 */
scheduleRouter.get("/", async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const userId = req.user!.sub;
    const items = await prisma.academicSchedule.findMany({
      where: { userId },
      orderBy: [{ dayOfWeek: "asc" }, { subjectName: "asc" }],
    });
    sendSuccess(res, items);
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/v1/schedule
 * Menyimpan satu jadwal kuliah baru.
 */
scheduleRouter.post("/", async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const userId = req.user!.sub;
    const parsed = scheduleItemSchema.parse(req.body);
    const created = await prisma.academicSchedule.create({
      data: {
        userId,
        dayOfWeek: parsed.dayOfWeek,
        subjectName: parsed.subjectName,
        creditHours: parsed.creditHours,
        isPracticum: parsed.isPracticum,
        isExamWeek: parsed.isExamWeek,
      },
    });
    sendSuccess(res, created, 201);
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/v1/schedule/bulk
 * Menyimpan daftar jadwal sekaligus (hasil parsing KRS/PDF).
 */
scheduleRouter.post("/bulk", async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const userId = req.user!.sub;
    const parsed = bulkScheduleSchema.parse(req.body);
    const createdCount = await prisma.academicSchedule.createMany({
      data: parsed.schedules.map((s) => ({
        userId,
        dayOfWeek: s.dayOfWeek,
        subjectName: s.subjectName,
        creditHours: s.creditHours,
        isPracticum: s.isPracticum,
        isExamWeek: s.isExamWeek,
      })),
    });
    sendSuccess(res, { count: createdCount.count }, 201);
  } catch (error) {
    next(error);
  }
});

/**
 * DELETE /api/v1/schedule/:id
 * Menghapus satu item jadwal.
 */
scheduleRouter.delete("/:id", async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const userId = req.user!.sub;
    const id = String(req.params.id);
    await prisma.academicSchedule.deleteMany({
      where: { id, userId },
    });
    sendSuccess(res, { deleted: true });
  } catch (error) {
    next(error);
  }
});
