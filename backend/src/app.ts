import cors from "cors";
import express from "express";
import helmet from "helmet";
import { allowedCorsOrigins } from "./config/env.ts";
import { AppError } from "./lib/response.ts";
import { errorHandler } from "./middleware/errorHandler.ts";
import { createRateLimiter } from "./middleware/rateLimit.ts";
import { activitiesRouter } from "./routes/activities.ts";
import { aiCoachRouter } from "./routes/aiCoach.ts";
import { authRouter } from "./routes/auth.ts";
import { dashboardRouter } from "./routes/dashboard.ts";
import { healthRouter } from "./routes/health.ts";
import { notificationsRouter } from "./routes/notifications.ts";
import { focusTasksRouter } from "./routes/focusTasks.ts";
import { sedentaryRouter } from "./routes/sedentary.ts";
import { usersRouter, visionRouter } from "./routes/users.ts";
import { assessmentsRouter, wellbeingRouter } from "./routes/wellbeing.ts";
import { scheduleRouter } from "./routes/academicSchedule.ts";
import { burnoutRouter } from "./routes/burnout.ts";
import { activeBreakRouter } from "./routes/activeBreak.ts";
import { osLockRouter } from "./routes/osLock.ts";

export function createApp() {
  const app = express();

  // Konfigurasi trust proxy untuk deployment reverse proxy (Nginx/Cloudflare/Docker/PaaS)
  // Memastikan req.ip membaca client IP yang sebenarnya dari header X-Forwarded-For
  app.set(
    "trust proxy",
    process.env.TRUST_PROXY
      ? process.env.TRUST_PROXY === "true"
        ? true
        : Number(process.env.TRUST_PROXY) || 1
      : 1
  );

  app.use(
    helmet({
      // Izinkan akses API lintas-origin dari LAN HP, Cloudflare Tunnel, Safari, dan Firefox
      crossOriginResourcePolicy: { policy: "cross-origin" },
      crossOriginOpenerPolicy: false,
    })
  );

  const isAllowedOrigin = (origin: string): boolean => {
    if (allowedCorsOrigins.includes(origin)) return true;
    try {
      const parsed = new URL(origin);
      const host = parsed.hostname.toLowerCase();
      // Localhost IPv4, IPv6 ([::1]), dan domain .local (mDNS macOS/Linux/Windows)
      if (
        host === "localhost" ||
        host === "127.0.0.1" ||
        host === "::1" ||
        host === "[::1]" ||
        host.endsWith(".local")
      ) {
        return true;
      }
      // IP Private LAN (Wi-Fi lokal untuk akses dari HP Android/iOS & PC lain)
      if (
        /^10\.\d{1,3}\.\d{1,3}\.\d{1,3}$/.test(host) ||
        /^192\.168\.\d{1,3}\.\d{1,3}$/.test(host) ||
        /^172\.(1[6-9]|2\d|3[0-1])\.\d{1,3}\.\d{1,3}$/.test(host)
      ) {
        return true;
      }
      // Domain HTTPS tunnel & platform hosting gratis (Cloudflare, Vercel, Netlify, HF Spaces)
      if (
        host.endsWith(".trycloudflare.com") ||
        host.endsWith(".ngrok-free.app") ||
        host.endsWith(".ngrok.io") ||
        host.endsWith(".vercel.app") ||
        host.endsWith(".pages.dev") ||
        host.endsWith(".netlify.app") ||
        host.endsWith(".hf.space")
      ) {
        return true;
      }
    } catch {
      return false;
    }
    return false;
  };

  app.use(
    cors({
      origin: (origin, callback) => {
        if (!origin || isAllowedOrigin(origin)) {
          callback(null, true);
          return;
        }
        callback(null, false);
      },
      credentials: true,
      methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
      allowedHeaders: [
        "Content-Type",
        "Authorization",
        "x-gemini-api-key",
        "X-Requested-With",
      ],
      optionsSuccessStatus: 204,
    })
  );
  app.use(express.json({ limit: "1mb" }));

  const authLimiter = createRateLimiter({
    windowMs: 60_000,
    maxRequests: 30,
    keyPrefix: "auth",
    message: "Terlalu banyak percobaan autentikasi. Coba lagi dalam 1 menit.",
  });

  // Root health probe (wajib HTTP 200 untuk Hugging Face Spaces / Render / Koyeb)
  app.get("/", (_req, res) => {
    res.status(200).json({
      status: "ok",
      service: "campusflow-backend",
      health: "/api/v1/health",
    });
  });

  app.use("/api/v1/health", healthRouter);
  app.use("/api/v1/auth", authLimiter, authRouter);
  app.use("/api/v1/users", usersRouter);
  app.use("/api/v1/vision", visionRouter);
  app.use("/api/v1/posture", visionRouter);
  app.use("/api/v1/sedentary", sedentaryRouter);
  app.use("/api/v1/activities", activitiesRouter);
  app.use("/api/v1/wellbeing", wellbeingRouter);
  app.use("/api/v1/assessments", assessmentsRouter);
  app.use("/api/v1/dashboard", dashboardRouter);
  app.use("/api/v1/ai-coach", aiCoachRouter);
  app.use("/api/v1/notifications", notificationsRouter);
  app.use("/api/v1/focus-tasks", focusTasksRouter);
  app.use("/api/v1/schedule", scheduleRouter);
  app.use("/api/academic-schedule", scheduleRouter);
  app.use("/api/v1/academic-schedule", scheduleRouter);
  app.use("/api/v1/burnout", burnoutRouter);
  app.use("/api/v1/active-break", activeBreakRouter);
  app.use("/api/v1/os-lock", osLockRouter);

  app.use((req, _res, next) => {
    next(new AppError(404, "NOT_FOUND", `Endpoint '${req.method} ${req.originalUrl}' tidak ditemukan.`));
  });

  app.use(errorHandler);
  return app;
}

