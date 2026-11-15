import path from "node:path";
import readline from "node:readline";
import {
  callOllamaChatJson,
  type AllowedRanges,
  type DominantMediator,
  type GeneratedInsight,
} from "../src/services/ollamaCoach.ts";
import {
  auditResponse,
  checkMovementMatch,
  CLARIFICATION_PROMPT_TEXT,
  CLARIFICATION_WITH_OPTIONS_TEXT,
  CRISIS_RESPONSE_TEXT,
  deduplicateResponse,
  deduplicateSentences,
  detectClarificationChoice,
  detectDistressKeywords,
  detectRecentlyExercised,
  extractActivity,
  extractSedentaryHours,
  extractSleepHours,
  formatMovementOptionsPrompt,
  getNextMovementOption,
  getNextNeutralCauseFallback,
  IN_SCOPE_WELLBEING_PATTERN,
  isBareGeneralComplaint,
  MOVEMENT_OPTIONS_BY_MEDIATOR,
  NEUTRAL_CAUSE_FALLBACK_TEXT,
  NEUTRAL_CAUSE_FALLBACK_VARIANTS,
  PROACTIVE_CLARIFICATION_OPTIONS,
  PROACTIVE_CLARIFICATION_QUESTION,
  PROACTIVE_CLARIFICATION_TEXT,
  resetNeutralCauseFallbackIndex,
  sanitizeSleepInterpretation,
  sanitizeTimeWords,
  stripNullFields,
  type AuditReport,
} from "../src/services/coachShared.ts";

export {
  auditResponse,
  checkMovementMatch,
  CLARIFICATION_PROMPT_TEXT,
  CLARIFICATION_WITH_OPTIONS_TEXT,
  CRISIS_RESPONSE_TEXT,
  deduplicateResponse,
  deduplicateSentences,
  detectClarificationChoice,
  detectDistressKeywords,
  detectRecentlyExercised,
  extractActivity,
  extractSedentaryHours,
  extractSleepHours,
  formatMovementOptionsPrompt,
  getNextMovementOption,
  getNextNeutralCauseFallback,
  IN_SCOPE_WELLBEING_PATTERN,
  isBareGeneralComplaint,
  MOVEMENT_OPTIONS_BY_MEDIATOR,
  NEUTRAL_CAUSE_FALLBACK_TEXT,
  NEUTRAL_CAUSE_FALLBACK_VARIANTS,
  PROACTIVE_CLARIFICATION_OPTIONS,
  PROACTIVE_CLARIFICATION_QUESTION,
  PROACTIVE_CLARIFICATION_TEXT,
  resetNeutralCauseFallbackIndex,
  sanitizeSleepInterpretation,
  sanitizeTimeWords,
  stripNullFields,
};

const isDebug =
  process.argv.includes("--debug") ||
  process.env.COACH_DEBUG === "1" ||
  process.env.COACH_DEBUG === "true";

const isShowJson =
  isDebug || process.argv.includes("--show-json") || process.env.COACH_SHOW_JSON === "1";

/** Membaca jam lokal sistem sebenarnya dalam zona waktu Asia/Jakarta */
export function getSystemJakartaTime(): {
  timeStr: string;
  hour: number;
  period: "pagi" | "siang" | "sore" | "malam";
} {
  const now = new Date();
  const timeFormatter = new Intl.DateTimeFormat("id-ID", {
    timeZone: "Asia/Jakarta",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
  const hourFormatter = new Intl.DateTimeFormat("id-ID", {
    timeZone: "Asia/Jakarta",
    hour: "numeric",
    hour12: false,
  });

  const timeStr = `${timeFormatter.format(now)} WIB`;
  const hour = parseInt(hourFormatter.format(now), 10);

  let period: "pagi" | "siang" | "sore" | "malam" = "malam";
  if (hour >= 4 && hour < 11) {
    period = "pagi";
  } else if (hour >= 11 && hour < 15) {
    period = "siang";
  } else if (hour >= 15 && hour < 18) {
    period = "sore";
  } else {
    period = "malam";
  }

  return { timeStr, hour, period };
}

/** Menyusun payload JSON yang dikirim ke model */
export function buildChatCoachPayload(
  userInput: string,
  options?: {
    forcedJenisGerak?: string;
  }
) {
  const sedentaryHours = extractSedentaryHours(userInput);
  const sleepHours = extractSleepHours(userInput);
  const activity = extractActivity(userInput);
  const { timeStr, period } = getSystemJakartaTime();

  const isDistress = detectDistressKeywords(userInput);
  const isRecentlyExercised = detectRecentlyExercised(userInput);
  const clarChoice = detectClarificationChoice(userInput);

  let dominantMediator: DominantMediator = "LOW_MVPA_VOLUME";
  let escalationFlag = false;

  if (isDistress) {
    dominantMediator = "EXAM_ACUTE_STRESS";
    escalationFlag = true;
  } else if (isRecentlyExercised) {
    // Sesuai CLINICAL_SCORING.md & clinicalRuleEvaluation:
    // Waktu duduk < 6 jam (misal 2 jam) TIDAK memenuhi threshold SEDENTARY_OVERLOAD.
    // Karena sudah olahraga, pilar MVPA tercapai, gunakan mediator netral OPTIMAL_BALANCE.
    dominantMediator =
      sedentaryHours !== null && sedentaryHours >= 6.0
        ? "SEDENTARY_OVERLOAD"
        : "OPTIMAL_BALANCE";
  } else if (clarChoice.isChoice && clarChoice.choice !== "SKIP") {
    if (clarChoice.choice === "A") {
      dominantMediator = "SEDENTARY_OVERLOAD";
    } else if (clarChoice.choice === "B") {
      dominantMediator = "SLEEP_MEDIATION_DEFICIT";
    } else if (clarChoice.choice === "C") {
      dominantMediator = "OPTIMAL_BALANCE";
    } else {
      dominantMediator = "EXAM_ACUTE_STRESS";
    }
  } else if (
    (sleepHours !== null && sleepHours < 7) ||
    /\b(begadang|tidur|kurang tidur|insomnia|ngantuk|kantuk|susah tidur|mata perih)\b/i.test(
      userInput
    )
  ) {
    dominantMediator = "SLEEP_MEDIATION_DEFICIT";
  } else if (
    (sedentaryHours !== null && sedentaryHours >= 6) ||
    /\b(pegal|pegel|kaku|duduk|punggung|leher|nugas|skripsi|laprak|lab)\b/i.test(userInput)
  ) {
    dominantMediator = "SEDENTARY_OVERLOAD";
  } else if (
    /\b(uts|uas|ujian|tes|kuis|deg-degan|panik|presentasi|sidang|deadline|tertekan)\b/i.test(
      userInput
    )
  ) {
    dominantMediator = "EXAM_ACUTE_STRESS";
  } else {
    dominantMediator = "LOW_MVPA_VOLUME";
  }

  const isRecoveryMode =
    isRecentlyExercised || (clarChoice.isChoice && clarChoice.choice === "C");

  const allowedRanges: AllowedRanges = isRecoveryMode
    ? { durationMinutesRange: [5, 15], metsRange: [80, 140] }
    : escalationFlag
      ? { durationMinutesRange: [5, 10], metsRange: [80, 160] }
      : dominantMediator === "SEDENTARY_OVERLOAD"
        ? { durationMinutesRange: [10, 20], metsRange: [170, 240] }
        : dominantMediator === "EXAM_ACUTE_STRESS"
          ? { durationMinutesRange: [10, 20], metsRange: [150, 200] }
          : dominantMediator === "SLEEP_MEDIATION_DEFICIT"
            ? { durationMinutesRange: [15, 30], metsRange: [180, 260] }
            : { durationMinutesRange: [15, 25], metsRange: [160, 220] };

  // Pilih variasi jenis gerak
  let jenisGerak = options?.forcedJenisGerak || "";
  if (!jenisGerak) {
    if (isRecoveryMode) {
      jenisGerak = getNextMovementOption("RECENTLY_EXERCISED");
    } else if (clarChoice.isChoice && clarChoice.choice === "A") {
      jenisGerak = getNextMovementOption("SEDENTARY_OVERLOAD");
    } else if (clarChoice.isChoice && clarChoice.choice === "B") {
      jenisGerak = getNextMovementOption("SLEEP_MEDIATION_DEFICIT");
    } else if (clarChoice.isChoice && clarChoice.choice === "D") {
      jenisGerak = getNextMovementOption("EXAM_ACUTE_STRESS");
    } else {
      const mediatorKey = escalationFlag ? "ESCALATION" : dominantMediator;
      jenisGerak = getNextMovementOption(mediatorKey);
    }
  }

  const activeDirectives: string[] = [
    "DATA_TIDAK_LENGKAP: jangan menyebut angka, durasi, atau tingkat aktivitas yang tidak ada di input user",
  ];

  if (isRecoveryMode) {
    activeDirectives.push(
      "SUDAH_OLAHRAGA: user sudah berolahraga sebelumnya hari ini. JANGAN merekomendasikan olahraga tambahan atau jalan cepat/MVPA. Berikan panduan pemulihan aktif, peregangan pendinginan otot lembut, hidrasi, atau relaksasi santai."
    );
  }

  if (escalationFlag) {
    activeDirectives.push(
      "ESKALASI_AKTIF: WAJIB tulis kalimat penutup ini di diagnosisSummary: 'Kalau rasanya terus menumpuk, nggak apa-apa cerita ke konselor kampus.' dan isi isotemporalActionPlan hanya dengan relaksasi ringan/napas tanpa olahraga berat."
    );
  }

  // POIN 1: Hilangkan field today yang bernilai null dari JSON yang dikirim (jangan kirim null)
  const rawToday: Record<string, number | null> = {
    totalSedentaryHours: sedentaryHours,
    sleepHours: sleepHours,
  };
  const cleanToday = stripNullFields(rawToday);

  // POIN 2: Directive PENYEBAB_TIDAK_DIKETAHUI ketika today kosong dan detectedActivity null
  if (Object.keys(cleanToday).length === 0 && !activity) {
    activeDirectives.push(
      "PENYEBAB_TIDAK_DIKETAHUI: jangan menyebut penyebab (tidur, duduk, aktivitas, kuliah) yang tidak disebut user"
    );
  }

  // POIN 5: Perbaiki tafsir "tidur cuma N jam"
  if (sleepHours !== null) {
    activeDirectives.push(
      "TAFSIR_TIDUR: sleepHours adalah lama tidur semalam, bukan kejadian barusan. Jangan memakai kata 'baru saja' untuk durasi tidur."
    );
  }

  activeDirectives.push(`JENIS_GERAK: ${jenisGerak}`);

  let effectiveUserNotes = userInput;
  if (clarChoice.isChoice && clarChoice.choice !== "SKIP") {
    const choiceLabels: Record<string, string> = {
      A: "Badan pegal atau otot kaku setelah duduk atau beraktivitas",
      B: "Ngantuk atau kurang tidur semalam",
      C: "Habis olahraga atau aktivitas fisik berat hari ini",
      D: "Pikiran penat atau stres tugas kuliah",
    };
    const label = choiceLabels[clarChoice.choice] || userInput;
    if (userInput.length <= 5 || /^(?:opsi\s+|pilihan\s+)?[a-d1-4]$/i.test(userInput.trim())) {
      effectiveUserNotes = label;
    } else {
      effectiveUserNotes = `${userInput} (${label})`;
    }
  } else if (clarChoice.isChoice && clarChoice.choice === "SKIP") {
    effectiveUserNotes = "Merasa capek atau lemas dan butuh saran relaksasi atau gerak ringan umum";
  } else if (options?.forcedJenisGerak && userInput.length <= 5) {
    effectiveUserNotes = `Ingin melakukan panduan gerak: ${options.forcedJenisGerak}`;
  }

  const promptPayload = {
    activeDirectives,
    clinicalRuleEvaluation: {
      dominantMediator,
      priorityMediator: dominantMediator,
      flags: [dominantMediator],
      escalationFlag,
      missingDailyCheckIn: true,
    },
    allowedRanges,
    skipAdaptation: {
      applied: false,
      consecutiveSkips: 0,
      previousRecommendedMets: null,
    },
    currentTime: `${timeStr} (${period})`,
    timeOfDay: period,
    detectedActivity: activity,
    today: cleanToday,
    history7Days: [],
    latestPss10Score: null,
    userNotes: effectiveUserNotes,
  };

  return {
    promptPayload,
    period,
    activity,
    sedentaryHours,
    sleepHours,
    dominantMediator,
    escalationFlag,
    jenisGerak,
    allowedRanges,
  };
}

function getTerminalWidth(): number {
  const cols = process.stdout.columns || 80;
  return Math.max(50, Math.min(cols, 100));
}

function wrapParagraph(
  firstLinePrefix: string,
  text: string,
  width: number,
  subsequentIndent: string = ""
): string {
  const paragraphs = text.split("\n");
  return paragraphs
    .map((p, idx) => {
      const prefix = idx === 0 ? firstLinePrefix : subsequentIndent;
      if (!p.trim()) return "";
      const words = p.trim().split(/\s+/);
      const lines: string[] = [];
      let currentLine = prefix;

      for (const word of words) {
        if (!word) continue;
        if (currentLine === prefix) {
          currentLine += word;
        } else if ((currentLine + " " + word).length <= width) {
          currentLine += " " + word;
        } else {
          lines.push(currentLine);
          currentLine = subsequentIndent + word;
        }
      }
      if (currentLine.length > 0) {
        lines.push(currentLine);
      }
      return lines.join("\n");
    })
    .join("\n");
}

function selectOpeningSentence(input: string): string {
  const lower = input.toLowerCase();

  if (/\b(nggak sanggup|tidak sanggup|putus asa|menyerah|capek sama semuanya)\b/.test(lower)) {
    return "Makasih banyak ya sudah mau cerita saat keadaan rasanya begitu berat.";
  }
  if (/\b(uts|uas|ujian|deg-degan|panik|cemas)\b/.test(lower)) {
    return "Wajar banget merasa deg-degan dan tegang menjelang momen penting seperti ujian.";
  }
  if (/\b(begadang|tidur|kurang tidur|insomnia|ngantuk|mata perih)\b/.test(lower)) {
    return "Pasti tubuh dan pikiranmu terasa lelah sekali kalau jam tidurmu kurang.";
  }
  if (/\b(capek|lelah|letih|penat|habis tenaga|lelah banget)\b/.test(lower)) {
    return "Wajar banget kalau kamu merasa capek dan butuh jeda sebentar hari ini.";
  }
  if (/\b(pegal|pegel|kaku|nyeri|linu|encok|sakit badan)\b/.test(lower)) {
    return "Pasti nggak nyaman ya kalau tubuh mulai terasa pegal dan kaku.";
  }
  if (/\b(stres|stress|pusing|mumet|beban|tertekan|overwhelm|berat)\b/.test(lower)) {
    return "Kedengarannya hari ini cukup berat dan bikin pikiran terasa penuh ya.";
  }
  if (/\b(lemas|lemes|mager|males|males gerak|kurang energi|loyo)\b/.test(lower)) {
    return "Nggak apa-apa banget kok kalau energimu lagi turun dan mager hari ini.";
  }

  const fallbacks = [
    "Makasih ya sudah meluangkan waktu untuk cerita kondisi kamu.",
    "Aku mengerti apa yang kamu rasakan, yuk kita urai pelan-pelan.",
    "Bagus kamu menyempatkan jeda sebentar untuk mendengarkan tubuhmu.",
  ];
  return fallbacks[Math.floor(Math.random() * fallbacks.length)];
}

function formatActionPlanText(plan: string): string {
  const trimmed = plan.trim();
  if (
    /^(coba|yuk|sekarang|mulai|lakukan|duduk|berdiri|cobalah|cobakan|ambil|luangkan)\b/i.test(
      trimmed
    )
  ) {
    return trimmed;
  }
  return `Coba ${trimmed.charAt(0).toLowerCase() + trimmed.slice(1)}`;
}

export async function processChatCoachInput(
  trimmed: string,
  options: {
    callModelFn?: typeof callOllamaChatJson;
    hasClarified?: boolean;
    forcedJenisGerak?: string;
  } = {}
): Promise<{
  promptPayload: ReturnType<typeof buildChatCoachPayload>["promptPayload"];
  dominantMediator: DominantMediator;
  escalationFlag: boolean;
  sleepHours: number | null;
  sedentaryHours: number | null;
  jenisGerak: string;
  insight: GeneratedInsight;
  source: string;
  movementMatchNote: string;
  auditReport: AuditReport;
  formattedOutput: string;
  needsClarification: boolean;
  movementOptions: string[];
}> {
  const caller = options.callModelFn ?? callOllamaChatJson;
  const isDistress = detectDistressKeywords(trimmed);
  const width = getTerminalWidth();
  const indent = "        ";

  // JALUR KRISIS (Poin 4 & 5): Jika terdeteksi, JANGAN panggil model sama sekali.
  if (isDistress) {
    const promptPayload = {
      activeDirectives: ["JALUR_KRISIS: Bantuan darurat dan konselor kampus tanpa olahraga"],
      clinicalRuleEvaluation: {
        dominantMediator: "EXAM_ACUTE_STRESS" as DominantMediator,
        priorityMediator: "EXAM_ACUTE_STRESS" as DominantMediator,
        flags: ["EXAM_ACUTE_STRESS" as DominantMediator],
        escalationFlag: true,
        missingDailyCheckIn: false,
      },
      allowedRanges: {
        durationMinutesRange: [5, 10] as [number, number],
        metsRange: [80, 160] as [number, number],
      },
      skipAdaptation: { applied: false, consecutiveSkips: 0, previousRecommendedMets: null },
      currentTime: `${getSystemJakartaTime().timeStr} (${getSystemJakartaTime().period})`,
      timeOfDay: getSystemJakartaTime().period,
      detectedActivity: null,
      today: {},
      history7Days: [],
      latestPss10Score: null,
      userNotes: trimmed,
    };

    const crisisInsight: GeneratedInsight = {
      dominantMediator: "EXAM_ACUTE_STRESS",
      diagnosisSummary: "Terdeteksi indikasi krisis emosional / distres berat.",
      isotemporalActionPlan: "Tidak ada rencana aktivitas fisik. Diberikan protokol rujukan krisis.",
      recommendedMetsToday: 80,
      scientificCitationNote: "Protokol keselamatan kesehatan mental terpadu.",
    };

    const formattedOutput = wrapParagraph("Coach > ", CRISIS_RESPONSE_TEXT, width, indent);

    return {
      promptPayload,
      dominantMediator: "EXAM_ACUTE_STRESS",
      escalationFlag: true,
      sleepHours: null,
      sedentaryHours: null,
      jenisGerak: "JALUR_KRISIS: Tidak ada olahraga; pendampingan empatik dan rujukan darurat",
      insight: crisisInsight,
      source: "CRISIS_SAFETY_BYPASS",
      movementMatchNote: "SESUAI (Jalur krisis deterministik tanpa olahraga)",
      auditReport: {
        unverifiedNumbers: [],
        unverifiedActivityClaims: [],
        unverifiedCauseClaims: [],
        hasRepeatedSentences: false,
        repeatedSentences: [],
      },
      formattedOutput,
      needsClarification: false,
      movementOptions: [],
    };
  }

  // POIN 1: KLARIFIKASI PROAKTIF
  // Jika input hanya keluhan umum tanpa penanda konteks dan belum diklarifikasi, JANGAN panggil model!
  if (isBareGeneralComplaint(trimmed) && !options.hasClarified) {
    const formattedOutput = wrapParagraph("Coach > ", PROACTIVE_CLARIFICATION_TEXT, width, indent);
    return {
      promptPayload: {} as any,
      dominantMediator: "OPTIMAL_BALANCE",
      escalationFlag: false,
      sleepHours: null,
      sedentaryHours: null,
      jenisGerak: "KLARIFIKASI_PROAKTIF",
      insight: {
        dominantMediator: "OPTIMAL_BALANCE",
        diagnosisSummary: "Memerlukan klarifikasi keluhan umum tanpa konteks.",
        isotemporalActionPlan: "Menanyakan opsi klarifikasi ke pengguna.",
        recommendedMetsToday: 0,
        scientificCitationNote: "Protokol klarifikasi kelelahan bertahap.",
      },
      source: "PROACTIVE_CLARIFICATION",
      movementMatchNote: "KLARIFIKASI_PROAKTIF",
      auditReport: {
        unverifiedNumbers: [],
        unverifiedActivityClaims: [],
        unverifiedCauseClaims: [],
        hasRepeatedSentences: false,
        repeatedSentences: [],
      },
      formattedOutput,
      needsClarification: true,
      movementOptions: [],
    };
  }

  const {
    promptPayload,
    period,
    activity,
    dominantMediator,
    escalationFlag,
    sleepHours,
    sedentaryHours,
    jenisGerak,
    allowedRanges,
  } = buildChatCoachPayload(trimmed, { forcedJenisGerak: options.forcedJenisGerak });
  const t0 = Date.now();

  let insight: GeneratedInsight;
  let source = "OLLAMA_LOCAL";

  try {
    const res = await caller(
      [{ role: "user", content: JSON.stringify(promptPayload) }],
      { timeoutMs: 120000 }
    );
    insight = res.insight;

    // POIN 1: Input pendek ditolak salah -> jika out-of-scope tapi kata kunci in-scope ada, retry SEKALI
    const isOutOfScopeInitial =
      /di luar cakupan/i.test(insight.diagnosisSummary) ||
      /di luar cakupan/i.test(insight.isotemporalActionPlan);

    if (isOutOfScopeInitial && IN_SCOPE_WELLBEING_PATTERN.test(trimmed)) {
      promptPayload.activeDirectives.push(
        "INPUT_DALAM_CAKUPAN: keluhan ini terkait kelelahan fisik/energi, berikan rekomendasi sesuai JENIS_GERAK"
      );
      try {
        const retryRes = await caller(
          [{ role: "user", content: JSON.stringify(promptPayload) }],
          { timeoutMs: 120000 }
        );
        insight = retryRes.insight;
      } catch {
        // Biarkan memakai hasil initial
      }
    }
  } catch (err) {
    source = "FALLBACK_LOCAL";
    const activityStr = promptPayload.detectedActivity
      ? ` pada ${promptPayload.detectedActivity}`
      : "";
    const hoursStr =
    sedentaryHours !== null ? ` sekitar ${sedentaryHours} jam` : "";
    const sleepStr =
    sleepHours !== null ? ` dengan waktu tidur sekitar ${sleepHours} jam` : "";

    insight = {
      dominantMediator,
      diagnosisSummary: `Kamu sudah cukup lama beraktivitas${hoursStr}${activityStr}${sleepStr} hari ini, wajar kalau tubuh mulai terasa lelah.`,
      isotemporalActionPlan: `Coba ${jenisGerak} selama ${allowedRanges.durationMinutesRange[0]} menit sekarang agar tubuh lebih rileks.`,
      recommendedMetsToday: allowedRanges.metsRange[0] + 20,
      scientificCitationNote: "Sesuai kerangka keseimbangan gerak dan pemulihan tubuh.",
    };
  }

  const elapsed = ((Date.now() - t0) / 1000).toFixed(1);

  // Sanitasi kata waktu & interpretasi tidur
  let sanitizedSummary = sanitizeTimeWords(insight.diagnosisSummary, trimmed, period);
  sanitizedSummary = sanitizeSleepInterpretation(sanitizedSummary);

  let sanitizedAction = sanitizeTimeWords(insight.isotemporalActionPlan, trimmed, period);
  sanitizedAction = sanitizeSleepInterpretation(sanitizedAction);

  // POIN 4: Hapus otomatis kalimat yang persis berulang dalam satu jawaban
  const deduped = deduplicateResponse(sanitizedSummary, sanitizedAction);
  sanitizedSummary = deduped.summary;
  sanitizedAction = deduped.plan;

  // Evaluasi kecocokan jenis gerak
  const movementMatch = checkMovementMatch(sanitizedAction, jenisGerak);

  // POIN 1: Audit pasca-jawaban (angka tidak terverifikasi, klaim aktivitas tanpa data, klaim penyebab tidak berdasar)
  let auditReport = auditResponse(
    sanitizedSummary,
    sanitizedAction,
    trimmed,
    allowedRanges,
    jenisGerak,
    sedentaryHours !== null,
    false, // tidak ada telemetry MVPA
    sleepHours !== null,
    activity
  );

  // POIN 3: Jika audit masih menemukan klaim penyebab karangan setelah satu kali percobaan,
  // bangun jawaban dari bagian-bagian: pembuka dari model/template, kalimat penjelasan diganti template netral
  // (atau menyaring kalimat karangan jika masih ada fakta yang sah), dan paragraf rekomendasi diambil dari model.
  let wasModularFallbackApplied = false;
  if (auditReport.unverifiedCauseClaims.length > 0) {
    wasModularFallbackApplied = true;

    const userLower = trimmed.toLowerCase();
    const userMentionsSleep = /\b(tidur|begadang|ngantuk|kantuk|insomnia|lelap|merem)\b/i.test(userLower);
    const userMentionsSitting = /\b(duduk|nugas|laprak|skripsi|lab|kuliah|kursi|meja|layar|komputer|laptop|tv)\b/i.test(userLower);
    const userMentionsActivity = /\b(aktivitas|kegiatan|olahraga|kuliah|kelas|dosen|lab|laprak|skripsi|nugas|jadwal|padat|sibuk)\b/i.test(userLower);

    const sentenceRegex = /[^.!?\n]+(?:[.!?]+|\n+|$)/g;
    const sentences = sanitizedSummary.match(sentenceRegex) || [sanitizedSummary];
    const filteredSentences = sentences.filter((s) => {
      const lowerS = s.toLowerCase();
      const isSleepClaim =
        sleepHours === null &&
        !userMentionsSleep &&
        /\b(?:masalah\s+(?:dengan\s+)?tidur|kurang\s+tidur|pola\s+tidur|kualitas\s+tidur|jam\s+tidur|tidurmu|begadang|istirahat\s+malam)\b/i.test(lowerS);
      const isSittingClaim =
        sedentaryHours === null &&
        !userMentionsSitting &&
        /\b(?:duduk\s+(?:cukup\s+)?lama|terlalu\s+lama\s+duduk|sudah\s+cukup\s+lama\s+duduk|banyak\s+duduk|posisi\s+duduk|lama\s+di\s+depan\s+layar|di\s+depan\s+(?:komputer|laptop|layar|tv)|berjam-jam\s+di\s+depan|menonton\s+tv)\b/i.test(lowerS);
      const isActivityClaim =
        !activity &&
        !userMentionsActivity &&
        /\b(?:aktivitas\s+padat|padatnya\s+aktivitas|jadwal\s+padat|setelah\s+berolahraga|banyak\s+aktivitas|kuliah\s+seharian|kegiatan\s+padat)\b/i.test(lowerS);
      return !isSleepClaim && !isSittingClaim && !isActivityClaim;
    });

    const cleanedSummary = filteredSentences.join(" ").trim();
    if (cleanedSummary.length >= 10) {
      sanitizedSummary = cleanedSummary;
    } else {
      sanitizedSummary = getNextNeutralCauseFallback();
    }

    const reDeduped = deduplicateResponse(sanitizedSummary, sanitizedAction);
    sanitizedSummary = reDeduped.summary;
    sanitizedAction = reDeduped.plan;
    auditReport = auditResponse(
      sanitizedSummary,
      sanitizedAction,
      trimmed,
      allowedRanges,
      jenisGerak,
      sedentaryHours !== null,
      false,
      sleepHours !== null,
      activity
    );
  }

  const clarChoice = detectClarificationChoice(trimmed);
  if (clarChoice.isChoice && clarChoice.choice === "SKIP") {
    sanitizedSummary = getNextNeutralCauseFallback();
    wasModularFallbackApplied = true;
    const reDeduped = deduplicateResponse(sanitizedSummary, sanitizedAction);
    sanitizedSummary = reDeduped.summary;
    sanitizedAction = reDeduped.plan;
  }

  const isStillOutOfScope =
    /di luar cakupan/i.test(sanitizedSummary) ||
    /di luar cakupan/i.test(sanitizedAction);

  let formattedOutput = "";

  if (isStillOutOfScope) {
    if (IN_SCOPE_WELLBEING_PATTERN.test(trimmed)) {
      formattedOutput = wrapParagraph("Coach > ", CLARIFICATION_WITH_OPTIONS_TEXT, width, indent);
    } else {
      const outOfScopeFriendly =
        "Maaf ya, untuk hal itu aku belum bisa bantu. Sebagai CampusFlow Coach, fokus utamaku adalah mendampingi kesehatan fisik, pola duduk aktif, kualitas tidur, dan pengelolaan stres kuliahmu. Kalau ada yang kamu rasakan seputar tubuh, energi, atau kelelahan belajar, cerita saja ke aku ya!";
      formattedOutput = wrapParagraph("Coach > ", outOfScopeFriendly, width, indent);
    }
  } else {
    const opening = selectOpeningSentence(trimmed);
    const condition = sanitizedSummary.trim();
    const action = formatActionPlanText(sanitizedAction);

    formattedOutput = [
      wrapParagraph("Coach > ", opening, width, indent),
      "",
      wrapParagraph(indent, condition, width, indent),
      "",
      wrapParagraph(indent, action, width, indent),
    ].join("\n");
  }

  const isRecoveryMode =
    detectRecentlyExercised(trimmed) || (clarChoice.isChoice && clarChoice.choice === "C");
  const mediatorKey = isRecoveryMode
    ? "RECENTLY_EXERCISED"
    : escalationFlag
      ? "ESCALATION"
      : dominantMediator;
  const movementOptions = (
    MOVEMENT_OPTIONS_BY_MEDIATOR[mediatorKey] ||
    MOVEMENT_OPTIONS_BY_MEDIATOR.OPTIMAL_BALANCE
  ).slice(0, 3);

  if (!isStillOutOfScope) {
    const movementPrompt = formatMovementOptionsPrompt(mediatorKey);
    formattedOutput = `${formattedOutput}\n\n${movementPrompt.trim()}`;
  }

  if (isDebug) {
    formattedOutput += `\n\n--- [DEBUG INFO] ---`;
    formattedOutput += `\n- Latency           : ${elapsed}s`;
    formattedOutput += `\n- Source            : ${source}`;
    formattedOutput += `\n- Dominant Mediator : ${dominantMediator}`;
    formattedOutput += `\n- Escalation Flag   : ${escalationFlag}`;
    formattedOutput += `\n- Sleep Hours       : ${sleepHours ?? "null"}`;
    formattedOutput += `\n- Sedentary Hours   : ${sedentaryHours ?? "null"}`;
    formattedOutput += `\n- Target Directive  : ${jenisGerak}`;
    formattedOutput += `\n- Jenis Gerak Match : ${movementMatch.note}`;
    if (auditReport.unverifiedNumbers.length > 0) {
      formattedOutput += `\n- [AUDIT] Angka Tdk Terverifikasi : ${auditReport.unverifiedNumbers.join(", ")}`;
    }
    if (auditReport.unverifiedActivityClaims.length > 0) {
      formattedOutput += `\n- [AUDIT] Klaim Aktivitas Tdk Sah : ${auditReport.unverifiedActivityClaims.join(", ")}`;
    }
    if (auditReport.unverifiedCauseClaims.length > 0) {
      formattedOutput += `\n- [AUDIT] Klaim Penyebab Tdk Sah  : ${auditReport.unverifiedCauseClaims.join(", ")}`;
    }
    if (wasModularFallbackApplied) {
      formattedOutput += `\n- [MODULAR FALLBACK] Kalimat penjelasan diganti varian netral`;
    }
    if (auditReport.hasRepeatedSentences) {
      formattedOutput += `\n- [AUDIT] Kalimat Berulang         : ${auditReport.repeatedSentences.join(" | ")}`;
    }
    formattedOutput += `\n- Recommended METs  : ${insight.recommendedMetsToday}`;
    formattedOutput += `\n- System Time Period: ${period}`;
    formattedOutput += `\n--------------------`;
  }

  return {
    promptPayload,
    dominantMediator,
    escalationFlag,
    sleepHours,
    sedentaryHours,
    jenisGerak,
    insight: {
      ...insight,
      diagnosisSummary: sanitizedSummary,
      isotemporalActionPlan: sanitizedAction,
    },
    source,
    movementMatchNote: movementMatch.note,
    auditReport,
    formattedOutput,
    needsClarification: false,
    movementOptions,
  };
}

// Cek apakah skrip dijalankan langsung dari CLI atau di-import oleh runner test
const isDirectRun =
  Boolean(process.argv[1]) &&
  path.resolve(process.argv[1]).replace(/\\/g, "/").endsWith("scripts/chat-coach.ts");

if (isDirectRun) {
  const argPromptIndex = process.argv.findIndex((a) => a === "--prompt" || a === "--input");
  const cliInput =
    argPromptIndex !== -1 && process.argv[argPromptIndex + 1]
      ? process.argv[argPromptIndex + 1]
      : null;

  const argClarifyIndex = process.argv.findIndex(
    (a) => a === "--clarify" || a === "--clarification"
  );
  const cliClarify =
    argClarifyIndex !== -1 && process.argv[argClarifyIndex + 1]
      ? process.argv[argClarifyIndex + 1]
      : null;

  const argMovementIndex = process.argv.findIndex(
    (a) => a === "--movement" || a === "--movement-option"
  );
  const cliMovement =
    argMovementIndex !== -1 && process.argv[argMovementIndex + 1]
      ? process.argv[argMovementIndex + 1]
      : null;

  if (cliInput) {
    const runOptions: {
      hasClarified?: boolean;
      forcedJenisGerak?: string;
    } = {};

    if (cliClarify) {
      runOptions.hasClarified = true;
    }
    if (cliMovement) {
      runOptions.forcedJenisGerak = cliMovement;
    }

    processChatCoachInput(cliInput, runOptions)
      .then(
        ({
          promptPayload,
          dominantMediator,
          escalationFlag,
          sleepHours,
          sedentaryHours,
          jenisGerak,
          movementMatchNote,
          auditReport,
          formattedOutput,
        }) => {
          if (isShowJson) {
            console.log("\n--- [JSON DIKIRIM KE MODEL] ---");
            console.log(JSON.stringify(promptPayload, null, 2));
            console.log("-------------------------------\n");
          }
          console.log(`[METADATA]`);
          console.log(`- dominantMediator : ${dominantMediator}`);
          console.log(`- escalationFlag   : ${escalationFlag}`);
          console.log(`- sleepHours       : ${sleepHours !== null ? sleepHours : "null"}`);
          console.log(`- sedentaryHours   : ${sedentaryHours !== null ? sedentaryHours : "null"}`);
          console.log(`- JENIS_GERAK      : ${jenisGerak}`);
          console.log(`- Gerak Match      : ${movementMatchNote}`);
          if (auditReport.unverifiedNumbers.length > 0) {
            console.log(
              `- [AUDIT] Angka Tdk Terverifikasi: ${auditReport.unverifiedNumbers.join(", ")}`
            );
          }
          if (auditReport.unverifiedActivityClaims.length > 0) {
            console.log(
              `- [AUDIT] Klaim Aktivitas Tdk Sah: ${auditReport.unverifiedActivityClaims.join(", ")}`
            );
          }
          if (auditReport.unverifiedCauseClaims.length > 0) {
            console.log(
              `- [AUDIT] Klaim Penyebab Tdk Sah : ${auditReport.unverifiedCauseClaims.join(", ")}`
            );
          }
          if (auditReport.hasRepeatedSentences) {
            console.log(
              `- [AUDIT] Kalimat Berulang       : ${auditReport.repeatedSentences.join(" | ")}`
            );
          }
          console.log();
          console.log(`Kamu > ${cliInput}\n`);
          console.log(formattedOutput);
          console.log();
          process.exit(0);
        }
      )
      .catch((err) => {
        console.error(err);
        process.exit(1);
      });
  } else {
    // Mode Interaktif
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
    });

    let isClosed = false;
    rl.on("close", () => {
      isClosed = true;
    });

    let isAwaitingClarification = false;
    let pendingMovementOptions: string[] = [];

    console.log("\n==================================================================");
    console.log("  🌿 CampusFlow AI Coach — Sesi Percakapan Aktif");
    console.log("==================================================================");
    console.log("Ceritakan apa yang sedang kamu rasakan seputar tubuh, tidur, atau beban kuliah.");
    console.log("Ketik 'exit' untuk selesai.\n");

    function askPrompt(): void {
      if (isClosed) return;
      rl.question("Kamu > ", async (input) => {
        const trimmed = input.trim();
        if (!trimmed && !isAwaitingClarification) {
          if (!isClosed) askPrompt();
          return;
        }
        if (trimmed.toLowerCase() === "exit" || trimmed.toLowerCase() === "quit") {
          console.log(
            "\nCoach > Sampai jumpa! Istirahat yang cukup dan tetap jaga ritme tubuhmu ya. 👋\n"
          );
          rl.close();
          return;
        }

        process.stdout.write("Coach > Sedang memikirkan rekomendasi untukmu...");

        try {
          const callOptions: {
            hasClarified?: boolean;
            forcedJenisGerak?: string;
          } = {};

          if (isAwaitingClarification) {
            isAwaitingClarification = false;
            callOptions.hasClarified = true;
          } else if (pendingMovementOptions.length > 0) {
            const upper = trimmed.toUpperCase();
            let selectedMovement: string | null = null;
            if (upper === "A" || trimmed === "1") {
              selectedMovement = pendingMovementOptions[0];
            } else if (upper === "B" || trimmed === "2") {
              selectedMovement = pendingMovementOptions[1];
            } else if (upper === "C" || trimmed === "3") {
              selectedMovement = pendingMovementOptions[2];
            }

            pendingMovementOptions = [];
            if (selectedMovement) {
              callOptions.forcedJenisGerak = selectedMovement;
            }
          }

          const {
            promptPayload,
            dominantMediator,
            escalationFlag,
            sleepHours,
            sedentaryHours,
            jenisGerak,
            movementMatchNote,
            auditReport,
            formattedOutput,
            needsClarification,
            movementOptions,
          } = await processChatCoachInput(trimmed, callOptions);

          if (process.stdout.isTTY) {
            readline.clearLine(process.stdout, 0);
            readline.cursorTo(process.stdout, 0);
          } else {
            process.stdout.write("\n");
          }

          if (isShowJson) {
            console.log("\n--- [JSON DIKIRIM KE MODEL] ---");
            console.log(JSON.stringify(promptPayload, null, 2));
            console.log("-------------------------------\n");
          }

          if (isDebug) {
            console.log(`[DEBUG METADATA]`);
            console.log(`- dominantMediator : ${dominantMediator}`);
            console.log(`- escalationFlag   : ${escalationFlag}`);
            console.log(`- sleepHours       : ${sleepHours !== null ? sleepHours : "null"}`);
            console.log(`- sedentaryHours   : ${sedentaryHours !== null ? sedentaryHours : "null"}`);
            console.log(`- JENIS_GERAK      : ${jenisGerak}`);
            console.log(`- Gerak Match      : ${movementMatchNote}`);
            if (auditReport.unverifiedNumbers.length > 0) {
              console.log(
                `- [AUDIT] Angka Tdk Terverifikasi: ${auditReport.unverifiedNumbers.join(", ")}`
              );
            }
            if (auditReport.unverifiedActivityClaims.length > 0) {
              console.log(
                `- [AUDIT] Klaim Aktivitas Tdk Sah: ${auditReport.unverifiedActivityClaims.join(", ")}`
              );
            }
            if (auditReport.unverifiedCauseClaims.length > 0) {
              console.log(
                `- [AUDIT] Klaim Penyebab Tdk Sah : ${auditReport.unverifiedCauseClaims.join(", ")}`
              );
            }
            if (auditReport.hasRepeatedSentences) {
              console.log(
                `- [AUDIT] Kalimat Berulang       : ${auditReport.repeatedSentences.join(" | ")}`
              );
            }
            console.log();
          }

          console.log(formattedOutput);
          console.log();

          if (needsClarification) {
            isAwaitingClarification = true;
          } else if (movementOptions && movementOptions.length > 0) {
            pendingMovementOptions = movementOptions;
          }
        } catch (err) {
          if (process.stdout.isTTY) {
            readline.clearLine(process.stdout, 0);
            readline.cursorTo(process.stdout, 0);
          } else {
            process.stdout.write("\n");
          }
          console.error("Coach > Terjadi kendala saat menyusun jawaban. Coba tanyakan lagi ya.\n");
          if (isDebug) {
            console.error(err);
          }
        }

        if (!isClosed) {
          askPrompt();
        }
      });
    }

    askPrompt();
  }
}
