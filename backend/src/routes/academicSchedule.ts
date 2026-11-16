import { Router, type Response, type NextFunction } from "express";
import { z } from "zod";
import { prisma } from "../lib/prisma.ts";
import { AppError, sendSuccess } from "../lib/response.ts";
import { requireAuth, type AuthenticatedRequest } from "../middleware/auth.ts";
import { uploadKrs } from "../middleware/upload.ts";
import {
  computeKrsStressBreakdown,
  INDONESIAN_DAY_NAMES,
  parseKrsDocument,
  type ParsedCourseItem,
} from "../services/krsParserService.ts";

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
 * GET /api/v1/schedule/stress-analysis
 * Mengambil analisis dampak beban akademik tersimpan terhadap potensi stres dan burnout (PRD v4.0).
 */
scheduleRouter.get(
  "/stress-analysis",
  async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const userId = req.user!.sub;
      const schedules = await prisma.academicSchedule.findMany({
        where: { userId },
        orderBy: [{ dayOfWeek: "asc" }, { subjectName: "asc" }],
      });

      const parsedItems: ParsedCourseItem[] = schedules.map((s) => ({
        dayOfWeek: s.dayOfWeek,
        dayName: INDONESIAN_DAY_NAMES[s.dayOfWeek] || `Hari ${s.dayOfWeek}`,
        subjectName: s.subjectName,
        creditHours: s.creditHours,
        isPracticum: s.isPracticum,
        isExamWeek: s.isExamWeek,
      }));

      const { summary, dailyBreakdown } = computeKrsStressBreakdown(parsedItems);

      sendSuccess(res, {
        totalCourses: schedules.length,
        summary,
        dailyBreakdown,
        items: schedules,
      });
    } catch (error) {
      next(error);
    }
  }
);

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
 * Menyimpan daftar jadwal sekaligus.
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
 * Helper untuk mengekstrak dan memproses dokumen KRS dari request.
 */
async function handleKrsProcessing(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction,
  forcePreview = false
) {
  try {
    const userId = req.user!.sub;

    let buffer: Buffer | undefined;
    let mimeType: string | undefined;
    let filename: string | undefined;
    let text: string | undefined = req.body?.text || req.body?.content;

    if (req.file) {
      buffer = req.file.buffer;
      mimeType = req.file.mimetype;
      filename = req.file.originalname;
    } else if (req.body?.fileBase64) {
      try {
        buffer = Buffer.from(req.body.fileBase64, "base64");
      } catch {
        throw new AppError(400, "VALIDATION_ERROR", "Data fileBase64 tidak valid.");
      }
      filename = req.body.fileName || req.body.filename || "krs.pdf";
      mimeType = req.body.mimeType || "application/pdf";
    }

    if (!buffer && (!text || !text.trim())) {
      throw new AppError(
        400,
        "VALIDATION_ERROR",
        "Unggah file dokumen KRS (.pdf/.txt) atau sertakan teks jadwal perkuliahan pada payload."
      );
    }

    const geminiApiKey =
      (req.headers["x-gemini-api-key"] as string | undefined) ||
      req.body?.geminiApiKey;

    const preferGemini =
      req.body?.preferGemini === true ||
      req.body?.preferGemini === "true" ||
      req.query?.preferGemini === "true";

    const result = await parseKrsDocument({
      buffer,
      text,
      mimeType,
      filename,
      geminiApiKey,
      preferGemini,
    });

    if (!result.success || result.items.length === 0) {
      throw new AppError(
        422,
        "VALIDATION_ERROR",
        "Tidak ada jadwal kuliah yang berhasil diekstraksi dari dokumen. Pastikan file memuat mata kuliah, hari, dan SKS."
      );
    }

    const shouldSave =
      !forcePreview &&
      req.body?.saveToDatabase !== false &&
      req.body?.saveToDatabase !== "false" &&
      req.query?.preview !== "true";

    const replaceExisting =
      req.body?.replaceExisting !== false &&
      req.body?.replaceExisting !== "false";

    let savedCount = 0;
    if (shouldSave) {
      await prisma.$transaction(async (tx) => {
        if (replaceExisting) {
          await tx.academicSchedule.deleteMany({ where: { userId } });
        }
        const created = await tx.academicSchedule.createMany({
          data: result.items.map((item) => ({
            userId,
            dayOfWeek: item.dayOfWeek,
            subjectName: item.subjectName,
            creditHours: item.creditHours,
            isPracticum: item.isPracticum,
            isExamWeek: item.isExamWeek,
          })),
        });
        savedCount = created.count;
      });
    }

    sendSuccess(
      res,
      {
        extractedCount: result.items.length,
        saved: shouldSave,
        savedCount,
        replacedPrevious: shouldSave && replaceExisting,
        source: result.source,
        extractedTextPreview: result.extractedTextPreview,
        summary: result.summary,
        dailyBreakdown: result.dailyBreakdown,
        items: result.items,
      },
      shouldSave ? 201 : 200
    );
  } catch (error) {
    next(error);
  }
}

/**
 * POST /api/v1/schedule/parse-krs
 * Menerima file dokumen KRS (PDF/teks/CSV) atau teks jadwal, mengekstrak matkul dan SKS,
 * menghitung bobot stres akademik, serta menyimpannya ke database.
 */
scheduleRouter.post(
  "/parse-krs",
  uploadKrs.single("file"),
  async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    await handleKrsProcessing(req, res, next, false);
  }
);

/**
 * POST /api/v1/schedule/parse-krs/preview
 * Mengekstrak jadwal kuliah dan menghitung beban stres tanpa menyimpannya ke database.
 */
scheduleRouter.post(
  "/parse-krs/preview",
  uploadKrs.single("file"),
  async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    await handleKrsProcessing(req, res, next, true);
  }
);

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
