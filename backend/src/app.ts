import cors from "cors";
import express from "express";
import helmet from "helmet";
import { allowedCorsOrigins } from "./config/env.ts";
import { AppError } from "./lib/response.ts";
import { errorHandler } from "./middleware/errorHandler.ts";
import { activitiesRouter } from "./routes/activities.ts";
import { aiCoachRouter } from "./routes/aiCoach.ts";
import { authRouter } from "./routes/auth.ts";
import { dashboardRouter } from "./routes/dashboard.ts";
import { healthRouter } from "./routes/health.ts";
import { notificationsRouter } from "./routes/notifications.ts";
import { sedentaryRouter } from "./routes/sedentary.ts";
import { usersRouter, visionRouter } from "./routes/users.ts";
import { assessmentsRouter, wellbeingRouter } from "./routes/wellbeing.ts";

export function createApp() {
  const app = express();

  app.use(helmet());
  app.use(
    cors({
      origin: (origin, callback) => {
        if (!origin || allowedCorsOrigins.includes(origin)) {
          callback(null, true);
          return;
        }
        callback(null, false);
      },
      credentials: true,
    })
  );
  app.use(express.json({ limit: "1mb" }));

  app.use("/api/v1/health", healthRouter);
  app.use("/api/v1/auth", authRouter);
  app.use("/api/v1/users", usersRouter);
  app.use("/api/v1/vision", visionRouter);
  app.use("/api/v1/sedentary", sedentaryRouter);
  app.use("/api/v1/activities", activitiesRouter);
  app.use("/api/v1/wellbeing", wellbeingRouter);
  app.use("/api/v1/assessments", assessmentsRouter);
  app.use("/api/v1/dashboard", dashboardRouter);
  app.use("/api/v1/ai-coach", aiCoachRouter);
  app.use("/api/v1/notifications", notificationsRouter);

  app.use((req, _res, next) => {
    next(new AppError(404, "NOT_FOUND", `Endpoint '${req.method} ${req.originalUrl}' tidak ditemukan.`));
  });

  app.use(errorHandler);
  return app;
}

