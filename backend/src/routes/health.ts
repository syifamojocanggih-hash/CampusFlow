import { Router } from "express";
import { prisma } from "../lib/prisma.ts";
import { sendSuccess } from "../lib/response.ts";

export const healthRouter = Router();

healthRouter.get("/", async (_req, res) => {
  let database: "connected" | "disconnected" = "connected";
  try {
    await prisma.$queryRaw`SELECT 1`;
  } catch {
    database = "disconnected";
  }

  sendSuccess(res, {
    status: database === "connected" ? "healthy" : "degraded",
    service: "campusflow-backend",
    database,
    uptimeSec: Math.round(process.uptime()),
  });
});

