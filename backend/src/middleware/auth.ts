import type { NextFunction, Request, Response } from "express";
import jwt from "jsonwebtoken";
import { env } from "../config/env.ts";
import { AppError } from "../lib/response.ts";

export interface AuthJwtPayload {
  sub: string;
  email: string;
}

export interface AuthenticatedRequest extends Request {
  user?: AuthJwtPayload;
}

export function signAuthToken(payload: AuthJwtPayload): string {
  return jwt.sign(payload, env.JWT_SECRET, { expiresIn: "7d" });
}

export function requireAuth(req: AuthenticatedRequest, _res: Response, next: NextFunction): void {
  const header = req.headers.authorization;
  if (!header?.startsWith("Bearer ")) {
    throw new AppError(401, "UNAUTHORIZED", "Token autentikasi Bearer diperlukan.");
  }

  const token = header.slice(7).trim();
  try {
    const decoded = jwt.verify(token, env.JWT_SECRET) as AuthJwtPayload;
    if (!decoded?.sub) {
      throw new AppError(401, "UNAUTHORIZED", "Payload token tidak valid.");
    }
    req.user = decoded;
    next();
  } catch (err) {
    if (err instanceof AppError) throw err;
    throw new AppError(401, "UNAUTHORIZED", "Token tidak valid atau sudah kedaluwarsa.");
  }
}
