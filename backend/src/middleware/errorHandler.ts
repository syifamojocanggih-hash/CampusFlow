import type { NextFunction, Request, Response } from "express";
import { ZodError } from "zod";
import { AppError, sendError } from "../lib/response.ts";

export function errorHandler(
  err: unknown,
  _req: Request,
  res: Response,
  _next: NextFunction
): void {
  if (err instanceof AppError) {
    sendError(res, err.statusCode, err.code, err.message, err.details);
    return;
  }

  if (err instanceof ZodError) {
    sendError(res, 400, "VALIDATION_ERROR", "Data input tidak memenuhi format yang diharapkan.", {
      issues: err.issues.map((issue) => ({
        path: issue.path.join("."),
        message: issue.message,
      })),
    });
    return;
  }

  // Prisma unique constraint violation (P2002)
  if (
    typeof err === "object" &&
    err !== null &&
    "code" in err &&
    (err as { code?: string }).code === "P2002"
  ) {
    sendError(res, 400, "VALIDATION_ERROR", "Data unik (email atau NIM) sudah terdaftar.");
    return;
  }

  console.error("[CampusFlow API Error]", err);
  sendError(res, 500, "INTERNAL_ERROR", "Terjadi kesalahan pada server internal.");
}
