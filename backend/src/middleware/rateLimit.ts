import type { NextFunction, Request, Response } from "express";

export interface RateLimiterOptions {
  windowMs: number;
  maxRequests: number;
  keyPrefix: string;
  message?: string;
}

interface BucketEntry {
  count: number;
  resetAt: number;
}

/**
 * Middleware rate limiter in-memory sederhana tanpa dependensi eksternal.
 * Mengembalikan HTTP 429 dengan amplop error JSON standar saat batas terlampaui.
 */
export function createRateLimiter(options: RateLimiterOptions) {
  const buckets = new Map<string, BucketEntry>();

  return function rateLimitMiddleware(req: Request, res: Response, next: NextFunction): void {
    const now = Date.now();
    const clientIp = req.ip || req.socket.remoteAddress || "unknown";
    const key = `${options.keyPrefix}:${clientIp}`;

    const existing = buckets.get(key);
    if (!existing || existing.resetAt <= now) {
      buckets.set(key, { count: 1, resetAt: now + options.windowMs });
      // Bersihkan entri kedaluwarsa secara berkala agar memori tetap ringan
      if (buckets.size > 500) {
        for (const [k, entry] of buckets.entries()) {
          if (entry.resetAt <= now) buckets.delete(k);
        }
      }
      next();
      return;
    }

    if (existing.count >= options.maxRequests) {
      const retryAfterSec = Math.max(1, Math.ceil((existing.resetAt - now) / 1000));
      res.setHeader("Retry-After", String(retryAfterSec));
      res.status(429).json({
        error: {
          code: "RATE_LIMITED",
          message:
            options.message ??
            "Terlalu banyak permintaan dalam waktu singkat. Coba lagi beberapa saat.",
          details: { retryAfterSec },
        },
      });
      return;
    }

    existing.count += 1;
    next();
  };
}
