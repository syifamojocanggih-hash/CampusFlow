import { Router } from "express";
import { sendSuccess } from "../lib/response.ts";

export const healthRouter = Router();

healthRouter.get("/", (_req, res) => {
  sendSuccess(res, {
    status: "healthy",
    service: "campusflow-backend",
    uptimeSec: Math.round(process.uptime()),
  });
});
