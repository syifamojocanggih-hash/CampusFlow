import type { Response } from "express";
import type { ApiErrorEnvelope, ApiSuccessEnvelope } from "../../../shared/contracts/index.ts";

export type ErrorCode = ApiErrorEnvelope["error"]["code"];

/** Error aplikasi terstruktur agar diterjemahkan rapi oleh middleware errorHandler. */
export class AppError extends Error {
  public readonly statusCode: number;
  public readonly code: ErrorCode;
  public readonly details?: Record<string, unknown>;

  constructor(
    statusCode: number,
    code: ErrorCode,
    message: string,
    details?: Record<string, unknown>
  ) {
    super(message);
    this.statusCode = statusCode;
    this.code = code;
    this.details = details;
  }
}

export function sendSuccess<T>(res: Response, data: T, statusCode = 200): Response {
  const payload: ApiSuccessEnvelope<T> = {
    data,
    meta: {
      timestamp: new Date().toISOString(),
      version: "v1.0",
    },
  };
  return res.status(statusCode).json(payload);
}

export function sendError(
  res: Response,
  statusCode: number,
  code: ErrorCode,
  message: string,
  details?: Record<string, unknown>
): Response {
  const payload: ApiErrorEnvelope = {
    error: {
      code,
      message,
      ...(details ? { details } : {}),
    },
  };
  return res.status(statusCode).json(payload);
}

