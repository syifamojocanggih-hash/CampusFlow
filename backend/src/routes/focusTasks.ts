import { Router } from "express";
import { z } from "zod";
import { prisma } from "../lib/prisma.ts";
import { AppError, sendSuccess } from "../lib/response.ts";
import { requireAuth, type AuthenticatedRequest } from "../middleware/auth.ts";

export const focusTasksRouter = Router();

focusTasksRouter.use(requireAuth);

const createTaskSchema = z.object({
  text: z.string().trim().min(1, "Nama tugas wajib diisi.").max(255),
  tag: z.string().trim().min(1).max(40).default("Tugas"),
});

const updateTaskSchema = z.object({
  text: z.string().trim().min(1).max(255).optional(),
  tag: z.string().trim().min(1).max(40).optional(),
  isCompleted: z.boolean().optional(),
});

/**
 * GET /api/v1/focus-tasks
 * Mengambil seluruh daftar target tugas sesi fokus milik user dari MySQL.
 */
focusTasksRouter.get("/", async (req: AuthenticatedRequest, res) => {
  const userId = req.user!.sub;
  const items = await prisma.focusTask.findMany({
    where: { userId },
    orderBy: { createdAt: "asc" },
  });
  sendSuccess(res, items);
});

/**
 * POST /api/v1/focus-tasks
 * Menambahkan target tugas fokus baru ke database MySQL.
 */
focusTasksRouter.post("/", async (req: AuthenticatedRequest, res) => {
  const userId = req.user!.sub;
  const body = createTaskSchema.parse(req.body);

  const created = await prisma.focusTask.create({
    data: {
      userId,
      text: body.text,
      tag: body.tag,
      isCompleted: false,
    },
  });

  sendSuccess(res, created, 201);
});

/**
 * PATCH /api/v1/focus-tasks/:id
 * Memperbarui status selesai, judul, atau tag tugas fokus.
 */
focusTasksRouter.patch("/:id", async (req: AuthenticatedRequest, res) => {
  const userId = req.user!.sub;
  const id = String(req.params.id);
  const body = updateTaskSchema.parse(req.body);

  const existing = await prisma.focusTask.findFirst({
    where: { id, userId },
  });
  if (!existing) {
    throw new AppError(404, "NOT_FOUND", "Target tugas tidak ditemukan.");
  }

  const updated = await prisma.focusTask.update({
    where: { id: existing.id },
    data: {
      ...(body.text !== undefined ? { text: body.text } : {}),
      ...(body.tag !== undefined ? { tag: body.tag } : {}),
      ...(body.isCompleted !== undefined ? { isCompleted: body.isCompleted } : {}),
    },
  });

  sendSuccess(res, updated);
});

/**
 * DELETE /api/v1/focus-tasks/:id
 * Menghapus target tugas fokus milik user dari database MySQL.
 */
focusTasksRouter.delete("/:id", async (req: AuthenticatedRequest, res) => {
  const userId = req.user!.sub;
  const id = String(req.params.id);

  const deleted = await prisma.focusTask.deleteMany({
    where: { id, userId },
  });
  sendSuccess(res, { deleted: deleted.count > 0 });
});
