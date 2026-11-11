import bcrypt from "bcryptjs";
import { Router } from "express";
import { z } from "zod";
import { prisma } from "../lib/prisma.ts";
import { AppError, sendSuccess } from "../lib/response.ts";
import { signAuthToken } from "../middleware/auth.ts";

export const authRouter = Router();

const registerSchema = z.object({
  name: z.string().min(2).max(100),
  nim: z.string().min(4).max(30),
  email: z.string().email().max(120),
  password: z.string().min(6).max(100),
  department: z.string().min(2).max(100).optional(),
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

function sanitizeUser(user: {
  id: string;
  name: string;
  nim: string;
  email: string;
  department: string;
  weeklyMetsTarget: number;
  currentStreakDays: number;
  xpPoints: number;
  postureBaselineJson: unknown;
}) {
  return {
    id: user.id,
    name: user.name,
    nim: user.nim,
    email: user.email,
    department: user.department,
    weeklyMetsTarget: user.weeklyMetsTarget,
    currentStreakDays: user.currentStreakDays,
    xpPoints: user.xpPoints,
    postureBaselineJson: user.postureBaselineJson,
  };
}

authRouter.post("/register", async (req, res) => {
  const body = registerSchema.parse(req.body);
  const passwordHash = await bcrypt.hash(body.password, 10);

  const user = await prisma.user.create({
    data: {
      name: body.name,
      nim: body.nim,
      email: body.email.toLowerCase(),
      passwordHash,
      department: body.department ?? "Teknik Informatika",
    },
  });

  const token = signAuthToken({ sub: user.id, email: user.email });
  sendSuccess(res, { token, user: sanitizeUser(user) }, 201);
});

authRouter.post("/login", async (req, res) => {
  const body = loginSchema.parse(req.body);
  const user = await prisma.user.findUnique({
    where: { email: body.email.toLowerCase() },
  });

  if (!user || !(await bcrypt.compare(body.password, user.passwordHash))) {
    throw new AppError(401, "UNAUTHORIZED", "Email atau kata sandi salah.");
  }

  const token = signAuthToken({ sub: user.id, email: user.email });
  sendSuccess(res, { token, user: sanitizeUser(user) });
});

authRouter.post("/demo", async (_req, res) => {
  const demoUser = await prisma.user.findUnique({
    where: { email: "demo@campusflow.id" },
  });
  if (!demoUser) {
    throw new AppError(
      404,
      "NOT_FOUND",
      "Akun demo belum tersedia. Jalankan `npm run prisma:seed` terlebih dahulu."
    );
  }

  const token = signAuthToken({ sub: demoUser.id, email: demoUser.email });
  sendSuccess(res, { token, user: sanitizeUser(demoUser) });
});

