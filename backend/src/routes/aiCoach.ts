import { Router } from "express";
import { z } from "zod";
import { prisma } from "../lib/prisma.ts";
import { AppError, sendSuccess } from "../lib/response.ts";
import { requireAuth, type AuthenticatedRequest } from "../middleware/auth.ts";
import { createRateLimiter } from "../middleware/rateLimit.ts";
import {
  getDailyActivityAndSedentaryTotals,
  toUtcDateOnly,
} from "../services/dailyAggregation.ts";
import {
  checkOllamaStatus,
  generateClinicalWellbeingInsight,
  pickCitation,
} from "../services/ollamaCoach.ts";
import {
  ALL_OFFICIAL_MOVEMENT_OPTIONS,
  detectClarificationChoice,
  detectDistressKeywords,
  detectMovementChoice,
  getAlternativeMovementOptions,
  getJakartaDateString,
  getMovementGuidance,
  getMovementOptionsForMediator,
  getSystemJakartaTime,
  isBareGeneralComplaint,
  MOVEMENT_OPTIONS_BY_MEDIATOR,
  PROACTIVE_CLARIFICATION_OPTIONS,
  PROACTIVE_CLARIFICATION_QUESTION,
} from "../services/coachShared.ts";

export const aiCoachRouter = Router();

export const userRecentMovementOptionsCache = new Map<
  string,
  {
    insightId: string;
    createdAt: Date;
    options: string[];
  }
>();

const generateCoachBodySchema = z.object({
  notes: z.string().trim().max(500).optional(),
  clarificationChoice: z.string().trim().max(100).optional(),
  movementChoice: z.string().trim().max(100).optional(),
});

export const aiGenerateLimiter = createRateLimiter({
  windowMs: 60_000,
  maxRequests: 10,
  keyPrefix: "ai-coach-generate",
  keyGenerator: (req) =>
    (req as AuthenticatedRequest).user?.sub || req.ip || req.socket.remoteAddress || "unknown",
  message: "Terlalu banyak permintaan analisis AI Coach. Tunggu sebentar sebelum mencoba lagi.",
});

aiCoachRouter.get("/status", requireAuth, async (_req, res) => {
  const status = await checkOllamaStatus();
  sendSuccess(res, status);
});

aiCoachRouter.get("/history", requireAuth, async (req: AuthenticatedRequest, res) => {
  const limit = Math.min(50, Math.max(1, Number(req.query.limit ?? 20)));
  const history = await prisma.aiCoachingInsight.findMany({
    where: { userId: req.user!.sub },
    orderBy: { createdAt: "desc" },
    take: limit,
  });
  sendSuccess(res, history);
});

aiCoachRouter.post(
  "/generate",
  requireAuth,
  aiGenerateLimiter,
  async (req: AuthenticatedRequest, res) => {
  const userId = req.user!.sub;
  let userNotes: string | null = null;
  let clarificationChoice: string | null = null;
  let movementChoice: string | null = null;
  if (req.body && typeof req.body === "object" && Object.keys(req.body).length > 0) {
    const parsedBody = generateCoachBodySchema.safeParse(req.body);
    if (!parsedBody.success) {
      throw new AppError(400, "VALIDATION_ERROR", "Format input catatan AI Coach tidak valid.", {
        issues: parsedBody.error.flatten(),
      });
    }
    userNotes = parsedBody.data.notes ?? null;
    clarificationChoice = parsedBody.data.clarificationChoice ?? null;
    movementChoice = parsedBody.data.movementChoice ?? null;
  }

  // 1. Jalur krisis tetap dicek paling awal
  const isCrisis = detectDistressKeywords(userNotes);

  // 2. Klarifikasi proaktif: jika input hanya keluhan umum tanpa penanda konteks, JANGAN panggil model
  if (!isCrisis && userNotes && !clarificationChoice && isBareGeneralComplaint(userNotes)) {
    sendSuccess(
      res,
      {
        clarification: {
          question: PROACTIVE_CLARIFICATION_QUESTION,
          options: PROACTIVE_CLARIFICATION_OPTIONS,
        },
      },
      200
    );
    return;
  }

  if (clarificationChoice) {
    const detected = detectClarificationChoice(clarificationChoice);
    if (detected.isChoice && detected.choice && detected.choice !== "SKIP") {
      const optionMap: Record<string, string> = {
        "1": "keluhan badan pegal dan kaku",
        "2": "keluhan ngantuk dan kurang tidur",
        "3": "keluhan baru selesai olahraga atau aktivitas fisik berat",
        "4": "keluhan pikiran penat atau stres akademik",
        A: "keluhan badan pegal dan kaku",
        B: "keluhan ngantuk dan kurang tidur",
        C: "keluhan baru selesai olahraga atau aktivitas fisik berat",
        D: "keluhan pikiran penat atau stres akademik",
      };
      const label = optionMap[detected.choice] || clarificationChoice;
      userNotes = userNotes ? `${userNotes}. ${label}` : label;
    }
  }

  const todayStart = toUtcDateOnly(new Date());
  const todayIso = todayStart.toISOString().slice(0, 10);
  const since7Days = new Date(todayStart);
  since7Days.setUTCDate(since7Days.getUTCDate() - 6);

  const [logs, latestAssessment, recentInsights, todayTotals] = await Promise.all([
    prisma.dailyWellbeingLog.findMany({
      where: { userId, logDate: { gte: since7Days } },
      orderBy: { logDate: "asc" },
    }),
    prisma.clinicalAssessment.findFirst({
      where: { userId },
      orderBy: { assessmentDate: "desc" },
    }),
    prisma.aiCoachingInsight.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      take: 5,
    }),
    getDailyActivityAndSedentaryTotals(userId, todayStart),
  ]);

  const todayLog = logs.find((log) => log.logDate.toISOString().slice(0, 10) === todayIso);
  const totalSedentaryHours = Math.max(
    todayTotals.totalSedentaryHours,
    todayLog?.totalSedentaryHours ?? 0
  );
  const totalMvpaMinutes = Math.max(
    todayTotals.totalMvpaMinutes,
    todayLog?.totalMvpaMinutes ?? 0
  );
  const mvpaPerSedentaryRatio =
    todayLog?.mvpaPerSedentaryRatio ??
    (totalSedentaryHours > 0
      ? Number((totalMvpaMinutes / totalSedentaryHours).toFixed(2))
      : totalMvpaMinutes);

  const telemetryInput = {
    today: {
      totalSedentaryHours,
      totalMvpaMinutes,
      mvpaPerSedentaryRatio,
      sleepHours: todayLog ? todayLog.sleepHours : null,
      sleepQualityScore: todayLog ? todayLog.sleepQualityScore : null,
      pss4TotalScore: todayLog ? todayLog.pss4TotalScore : null,
      triadPillarsMet: todayLog ? todayLog.triadPillarsMet : 0,
    },
    history7Days: logs.map((log) => ({
      logDate: log.logDate.toISOString().slice(0, 10),
      totalSedentaryHours: log.totalSedentaryHours,
      totalMvpaMinutes: log.totalMvpaMinutes,
      sleepHours: log.sleepHours,
      pss4TotalScore: log.pss4TotalScore,
      triadPillarsMet: log.triadPillarsMet,
    })),
    latestPss10Score: latestAssessment?.totalScore ?? null,
    userNotes,
    recentInsights: recentInsights.map((item) => ({
      isCompleted: Boolean(item.isCompleted),
      recommendedMetsToday:
        typeof item.recommendedMetsToday === "number" ? item.recommendedMetsToday : undefined,
      createdAt: item.createdAt ? new Date(item.createdAt).toISOString() : undefined,
    })),
  };

  let forcedJenisGerak: string | undefined;
  if (movementChoice) {
    // 3. Validasi movementChoice: terima hanya ID opsi (A/B/C) atau nilai dari daftar resmi, tolak string lain dengan 400.
    const moveDetect = detectMovementChoice(movementChoice);
    const trimmedChoice = movementChoice.trim();
    const matchedOfficial = ALL_OFFICIAL_MOVEMENT_OPTIONS.find(
      (opt) => opt.toLowerCase() === trimmedChoice.toLowerCase()
    );

    if (!moveDetect.isChoice && !matchedOfficial) {
      throw new AppError(
        400,
        "VALIDATION_ERROR",
        "Pilihan gerakan tidak valid. Gunakan ID opsi (A/B/C) atau teks dari daftar resmi."
      );
    }

    // 4. Konteks giliran sebelumnya: pastikan recentInsights yang dipakai hanya milik user yang sedang login,
    // dari hari yang sama (zona waktu Asia/Jakarta) dan maksimal 30 menit terakhir.
    const latestInsight = recentInsights[0];
    const now = process.env.COACH_MOCK_TIME ? new Date(process.env.COACH_MOCK_TIME) : new Date();
    const isSameUser =
      latestInsight && (!latestInsight.userId || latestInsight.userId === userId);
    const isSameJakartaDay =
      latestInsight &&
      latestInsight.createdAt &&
      getJakartaDateString(new Date(latestInsight.createdAt)) === getJakartaDateString(now);
    const createdAtMs =
      latestInsight && latestInsight.createdAt
        ? new Date(latestInsight.createdAt).getTime()
        : 0;
    const ageMinutes = (now.getTime() - createdAtMs) / (60 * 1000);
    const isWithin30Minutes = latestInsight && ageMinutes >= 0 && ageMinutes <= 30;

    if (!latestInsight || !isSameUser || !isSameJakartaDay || !isWithin30Minutes) {
      throw new AppError(
        400,
        "VALIDATION_ERROR",
        "Konteks giliran sebelumnya tidak ditemukan atau sudah kedaluwarsa (maksimal 30 menit pada hari yang sama). Silakan tuliskan kembali keluhanmu."
      );
    }

    // Teks directive DIBANGUN DI SERVER DARI DAFTAR RESMI yang benar-benar ditampilkan (movementOptionsShown),
    // bukan dari string klien dan bukan menghitung ulang dari jam sekarang.
    const cached = userRecentMovementOptionsCache.get(userId);
    let availableOptions: string[];

    if (cached && cached.insightId === latestInsight.id && cached.options.length > 0) {
      availableOptions = cached.options;
    } else if (
      (latestInsight as any).movementOptionsShown &&
      Array.isArray((latestInsight as any).movementOptionsShown)
    ) {
      availableOptions = (latestInsight as any).movementOptionsShown;
    } else {
      // Reconstruct dari waktu pembuatan insight, BUKAN waktu sekarang
      const { isLateNight: wasLateNight } = getSystemJakartaTime(new Date(latestInsight.createdAt));
      const lastMediator = latestInsight.dominantMediator || "LOW_MVPA_VOLUME";
      availableOptions = getMovementOptionsForMediator(lastMediator, wasLateNight).slice(0, 3);
    }

    if (moveDetect.isChoice && moveDetect.index !== null) {
      if (moveDetect.index >= availableOptions.length) {
        throw new AppError(
          400,
          "VALIDATION_ERROR",
          `Opsi ${moveDetect.letter} tidak tersedia pada rekomendasi sebelumnya.`
        );
      }
      forcedJenisGerak = availableOptions[moveDetect.index];
    } else if (matchedOfficial) {
      forcedJenisGerak = matchedOfficial;
    }

    // POIN 3: Respons pilihan gerak dibuat dari template di coachShared.ts TANPA MEMANGGIL MODEL
    const chosenOption = forcedJenisGerak || availableOptions[0] || "peregangan meja";
    const guidance = getMovementGuidance(chosenOption);
    const chosenMediator = latestInsight.dominantMediator || "SEDENTARY_OVERLOAD";

    const savedChoice = await prisma.aiCoachingInsight.create({
      data: {
        userId,
        dominantMediator: chosenMediator,
        diagnosisSummary: guidance.confirmation,
        isotemporalActionPlan: guidance.fullPlanText,
        recommendedMetsToday: latestInsight.recommendedMetsToday || 180,
        scientificCitationNote:
          latestInsight.scientificCitationNote || pickCitation(chosenMediator as any),
      },
    });

    userRecentMovementOptionsCache.delete(userId);

    // POIN 1: Jangan sertakan movementOptions pada respons balasan pilihan (hanya kirim guidance)
    sendSuccess(
      res,
      {
        ...savedChoice,
        generationSource: "TEMPLATE_GUIDANCE",
        model: "campusflow-template",
        escalationFlag: false,
        guidance: guidance.steps,
      },
      201
    );
    return;
  }

  const { insight, source, model, escalationFlag } =
    await generateClinicalWellbeingInsight(telemetryInput, { forcedJenisGerak });

  const saved = await prisma.aiCoachingInsight.create({
    data: {
      userId,
      dominantMediator: insight.dominantMediator,
      diagnosisSummary: insight.diagnosisSummary,
      isotemporalActionPlan: insight.isotemporalActionPlan,
      recommendedMetsToday: insight.recommendedMetsToday,
      scientificCitationNote: insight.scientificCitationNote,
    },
  });

  if (source === "CRISIS_SAFETY_BYPASS") {
    const { recommendedMetsToday: _omit, ...rest } = saved;
    sendSuccess(res, { ...rest, generationSource: source, model, escalationFlag }, 201);
    return;
  }

  const { isLateNight } = getSystemJakartaTime(saved.createdAt);
  const mediatorKey = escalationFlag
    ? "ESCALATION"
    : (insight.dominantMediator as string);

  // POIN 2: Jangan tampilkan opsi yang sama dengan rekomendasi. Tampilkan hanya alternatif.
  // Jika alternatif kurang dari 2, jangan tampilkan daftar sama sekali.
  const alternatives = getAlternativeMovementOptions(
    insight.isotemporalActionPlan,
    mediatorKey,
    isLateNight
  );
  const movementOptionsShown = alternatives.length >= 2 ? alternatives : [];

  if (movementOptionsShown.length > 0) {
    userRecentMovementOptionsCache.set(userId, {
      insightId: saved.id,
      createdAt: saved.createdAt,
      options: movementOptionsShown,
    });
  } else {
    userRecentMovementOptionsCache.delete(userId);
  }

  sendSuccess(
    res,
    {
      ...saved,
      generationSource: source,
      model,
      escalationFlag,
      movementOptions: movementOptionsShown.length > 0 ? movementOptionsShown : undefined,
      movementOptionsShown,
    },
    201
  );
});

aiCoachRouter.get("/latest", requireAuth, async (req: AuthenticatedRequest, res) => {
  const latest = await prisma.aiCoachingInsight.findFirst({
    where: { userId: req.user!.sub },
    orderBy: { createdAt: "desc" },
  });

  if (!latest) {
    throw new AppError(404, "NOT_FOUND", "Belum ada insight AI Coach yang dibuat.");
  }
  sendSuccess(res, latest);
});

aiCoachRouter.patch("/:id/complete", requireAuth, async (req: AuthenticatedRequest, res) => {
  const userId = req.user!.sub;
  const insightId = String(req.params.id);

  const existing = await prisma.aiCoachingInsight.findFirst({
    where: { id: insightId, userId },
  });
  if (!existing) {
    throw new AppError(404, "NOT_FOUND", "Insight AI Coach tidak ditemukan.");
  }

  const updated = await prisma.aiCoachingInsight.update({
    where: { id: existing.id },
    data: { isCompleted: true },
  });

  if (!existing.isCompleted) {
    await prisma.user.update({
      where: { id: userId },
      data: { xpPoints: { increment: 50 } },
    });
  }

  sendSuccess(res, updated);
});

