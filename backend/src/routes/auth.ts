import bcrypt from "bcryptjs";
import { Router } from "express";
import { z } from "zod";
import { prisma } from "../lib/prisma.ts";
import { AppError, sendSuccess } from "../lib/response.ts";
import { signAuthToken } from "../middleware/auth.ts";

export const authRouter = Router();

const registerSchema = z.object({
  name: z.string().min(2).max(100),
  nim: z.string().min(2).max(40),
  email: z.string().email().max(120),
  password: z.string().min(4).max(100),
  department: z.string().min(2).max(100).optional(),
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
  name: z.string().optional(),
  nim: z.string().optional(),
  department: z.string().optional(),
});

function sanitizeUser(user: {
  id: string;
  name: string;
  nim: string;
  email: string;
  department: string;
  weeklyMetsTarget: number;
  targetRecoveryScore?: number | null;
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
    targetRecoveryScore: user.targetRecoveryScore ?? 40,
    currentStreakDays: user.currentStreakDays,
    xpPoints: user.xpPoints,
    postureBaselineJson: user.postureBaselineJson,
  };
}

authRouter.post("/register", async (req, res) => {
  const body = registerSchema.parse(req.body);
  const normalizedEmail = body.email.trim().toLowerCase();
  const passwordHash = await bcrypt.hash(body.password, 10);

  // Tolak registrasi jika email sudah terdaftar agar akun existing tidak dapat ditimpa
  const existingByEmail = await prisma.user.findUnique({
    where: { email: normalizedEmail },
  });

  if (existingByEmail) {
    throw new AppError(
      409,
      "VALIDATION_ERROR",
      "Email sudah terdaftar. Silakan masuk menggunakan kata sandi Anda."
    );
  }

  // Pastikan NIM tidak bentrok dengan akun lain
  let safeNim = body.nim.trim();
  const existingByNim = await prisma.user.findUnique({
    where: { nim: safeNim },
  });
  if (existingByNim) {
    safeNim = `${safeNim}-${Math.floor(100 + Math.random() * 900)}`;
  }

  const user = await prisma.user.create({
    data: {
      name: body.name,
      nim: safeNim,
      email: normalizedEmail,
      passwordHash,
      department: body.department ?? "Teknik Informatika",
    },
  });

  const token = signAuthToken({ sub: user.id, email: user.email });
  sendSuccess(res, { token, user: sanitizeUser(user) }, 201);
});

authRouter.post("/login", async (req, res) => {
  const body = loginSchema.parse(req.body);
  const normalizedEmail = body.email.trim().toLowerCase();
  const user = await prisma.user.findUnique({
    where: { email: normalizedEmail },
  });

  if (!user) {
    throw new AppError(401, "UNAUTHORIZED", "Email atau kata sandi salah.");
  }

  const isPasswordValid = await bcrypt.compare(body.password, user.passwordHash);
  if (!isPasswordValid) {
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

