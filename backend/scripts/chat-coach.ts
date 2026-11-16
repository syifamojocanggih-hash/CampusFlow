import path from "node:path";
import readline from "node:readline";
import {
  callOllamaChatJson,
  pickCitation,
  type AllowedRanges,
  type DominantMediator,
  type GeneratedInsight,
} from "../src/services/ollamaCoach.ts";
import {
  ALL_OFFICIAL_MOVEMENT_OPTIONS,
  appendCoachRawLog,
  auditResponse,
  checkMovementMatch,
  CLARIFICATION_PROMPT_TEXT,
  CLARIFICATION_WITH_OPTIONS_TEXT,
  CRISIS_RESPONSE_TEXT,
  deduplicateResponse,
  deduplicateSentences,
  detectClarificationChoice,
  detectDistressKeywords,
  detectMovementChoice,
  detectRecentlyExercised,
  extractActivity,
  extractSedentaryHours,
  extractSleepHours,
  filterDirectiveLeakage,
  formatMovementOptionsPrompt,
  getAlternativeMovementOptions,
  getCoachRawLogPath,
  getJakartaDateString,
  getMovementGuidance,
  getMovementOptionsForMediator,
  getNextMovementOption,
  getNextNeutralCauseFallback,
  getSystemJakartaTime,
  hasLeadingConjunction,
  IN_SCOPE_WELLBEING_PATTERN,
  isBareGeneralComplaint,
  isSameMovementOption,
  LATE_NIGHT_MOVEMENT_OPTIONS,
  MOVEMENT_GUIDANCE_CLOSING,
  MOVEMENT_GUIDANCE_TEMPLATES,
  MOVEMENT_OPTIONS_BY_MEDIATOR,
  NEUTRAL_CAUSE_FALLBACK_TEXT,
  NEUTRAL_CAUSE_FALLBACK_VARIANTS,
  PROACTIVE_CLARIFICATION_OPTIONS,
  PROACTIVE_CLARIFICATION_QUESTION,
  PROACTIVE_CLARIFICATION_TEXT,
  resetNeutralCauseFallbackIndex,
  sanitizeDurationMinutes,
  sanitizeSleepInterpretation,
  sanitizeTimeWords,
  stripLeadingConjunctions,
  stripNullFields,
  type AuditReport,
  type CoachRawLogEntry,
} from "../src/services/coachShared.ts";

export {
  ALL_OFFICIAL_MOVEMENT_OPTIONS,
  appendCoachRawLog,
  auditResponse,
  checkMovementMatch,
  CLARIFICATION_PROMPT_TEXT,
  CLARIFICATION_WITH_OPTIONS_TEXT,
  CRISIS_RESPONSE_TEXT,
  deduplicateResponse,
  deduplicateSentences,
  detectClarificationChoice,
  detectDistressKeywords,
  detectMovementChoice,
  detectRecentlyExercised,
  extractActivity,
  extractSedentaryHours,
  extractSleepHours,
  filterDirectiveLeakage,
  formatMovementOptionsPrompt,
  getAlternativeMovementOptions,
  getCoachRawLogPath,
  getJakartaDateString,
  getMovementGuidance,
  getMovementOptionsForMediator,
  getNextMovementOption,
  getNextNeutralCauseFallback,
  getSystemJakartaTime,
  hasLeadingConjunction,
  IN_SCOPE_WELLBEING_PATTERN,
  isBareGeneralComplaint,
  isSameMovementOption,
  LATE_NIGHT_MOVEMENT_OPTIONS,
  MOVEMENT_GUIDANCE_CLOSING,
  MOVEMENT_GUIDANCE_TEMPLATES,
  MOVEMENT_OPTIONS_BY_MEDIATOR,
  NEUTRAL_CAUSE_FALLBACK_TEXT,
  NEUTRAL_CAUSE_FALLBACK_VARIANTS,
  PROACTIVE_CLARIFICATION_OPTIONS,
  PROACTIVE_CLARIFICATION_QUESTION,
  PROACTIVE_CLARIFICATION_TEXT,
  resetNeutralCauseFallbackIndex,
  sanitizeDurationMinutes,
  sanitizeSleepInterpretation,
  sanitizeTimeWords,
  stripLeadingConjunctions,
  stripNullFields,
  type AuditReport,
  type CoachRawLogEntry,
};

const isDebug =
  process.argv.includes("--debug") ||
  process.env.COACH_DEBUG === "1" ||
  process.env.COACH_DEBUG === "true";

const isShowJson =
  isDebug || process.argv.includes("--show-json") || process.env.COACH_SHOW_JSON === "1";

const isShowRaw =
  isDebug || process.argv.includes("--raw") || process.env.COACH_SHOW_RAW === "1";

/** Menyusun payload JSON yang dikirim ke model */
export function buildChatCoachPayload(
  userInput: string,
  options?: {
    forcedJenisGerak?: string;
    pendingPrompt?: "clarification" | "movement" | null;
  }
) {
  const sedentaryHours = extractSedentaryHours(userInput);
  const sleepHours = extractSleepHours(userInput);
  const activity = extractActivity(userInput);
  const { timeStr, period, isLateNight } = getSystemJakartaTime();

  const isDistress = detectDistressKeywords(userInput);
  const isRecentlyExercised = detectRecentlyExercised(userInput);

  // Balasan hanya ditafsirkan sebagai klarifikasi bila pendingPrompt === 'clarification'
  const isClarificationState = options?.pendingPrompt === "clarification";
  const clarChoice = isClarificationState
    ? detectClarificationChoice(userInput)
    : { isChoice: false, choice: null };

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
    if (clarChoice.choice === "1") {
      dominantMediator = "SEDENTARY_OVERLOAD";
    } else if (clarChoice.choice === "2") {
      dominantMediator = "SLEEP_MEDIATION_DEFICIT";
    } else if (clarChoice.choice === "3") {
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
    isRecentlyExercised || (clarChoice.isChoice && clarChoice.choice === "3");

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

  // Pilih variasi jenis gerak (dengan aturan jam malam bila berlaku)
  let jenisGerak = options?.forcedJenisGerak || "";
  if (!jenisGerak) {
    if (isRecoveryMode) {
      jenisGerak = getNextMovementOption("RECENTLY_EXERCISED", isLateNight);
    } else if (clarChoice.isChoice && clarChoice.choice === "1") {
      jenisGerak = getNextMovementOption("SEDENTARY_OVERLOAD", isLateNight);
    } else if (clarChoice.isChoice && clarChoice.choice === "2") {
      jenisGerak = getNextMovementOption("SLEEP_MEDIATION_DEFICIT", isLateNight);
    } else if (clarChoice.isChoice && clarChoice.choice === "4") {
      jenisGerak = getNextMovementOption("EXAM_ACUTE_STRESS", isLateNight);
    } else {
      const mediatorKey = escalationFlag ? "ESCALATION" : dominantMediator;
      jenisGerak = getNextMovementOption(mediatorKey, isLateNight);
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

  // POIN 5 (User Request): Aturan jam malam
  if (
    isLateNight &&
    (dominantMediator === "LOW_MVPA_VOLUME" || dominantMediator === "SEDENTARY_OVERLOAD")
  ) {
    activeDirectives.push(
      "JAM_MALAM_RINGAN: waktu saat ini sudah larut malam (>= 21.30 WIB). DILARANG menyarankan jalan cepat di luar ruangan atau olahraga intensif. Fokus HANYA pada gerakan relaksasi, peregangan lembut, atau jalan pelan santai di dalam ruangan."
    );
  }

  // POIN 3 (User Request): Konteks pilihan klarifikasi dikirim sebagai directive terpisah (userNotes tetap teks asli user)
  if (clarChoice.isChoice && clarChoice.choice !== "SKIP") {
    const choiceLabels: Record<string, string> = {
      "1": "Badan pegal atau otot kaku",
      "2": "Ngantuk atau kurang tidur",
      "3": "Habis olahraga atau aktivitas berat",
      "4": "Pikiran penat atau stres kuliah",
    };
    const label = choiceLabels[clarChoice.choice];
    if (label) {
      activeDirectives.push(`KONTEKS_PILIHAN: user memilih ${label}`);
    }
  } else if (clarChoice.isChoice && clarChoice.choice === "SKIP") {
    // Untuk "lewati", jangan tambahkan kata seperti relaksasi, tidur, atau saran!
    activeDirectives.push("KONTEKS_PILIHAN: user memilih lewati untuk rekomendasi umum");
  }

  activeDirectives.push(`JENIS_GERAK: ${jenisGerak}`);

  // userNotes ke model harus SELALU teks asli user (Requirement 3)
  const effectiveUserNotes = userInput;

  const promptPayload = {
    activeDirectives,
    clinicalRuleEvaluation: {
      dominantMediator,
      priorityMediator: dominantMediator,
      flags: [dominantMediator],
      escalationFlag,
      missingDailyCheckIn: false,
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
    isLateNight,
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

function selectOpeningSentence(
  input: string,
  context?: {
    clarChoice?: string | null;
    isMovementSelection?: boolean;
    isRecoveryMode?: boolean;
  }
): string {
  const trimmed = input.trim();
  const lower = trimmed.toLowerCase();

  // POIN 4: Jangan pakai pembuka "Makasih sudah meluangkan waktu untuk cerita"
  // bila input user hanya satu angka/huruf pilihan. Pilih pembuka yang sesuai konteks pilihan:
  if (context?.isMovementSelection || /^[a-c]$/i.test(trimmed)) {
    return "Pilihan jeda gerak yang sangat baik untuk menyegarkan kembali tubuhmu.";
  }
  if (context?.clarChoice === "3" || lower === "3" || context?.isRecoveryMode) {
    return "Keren sudah menyempatkan olahraga hari ini! Tubuhmu berhak mendapatkan pemulihan dan pendinginan yang baik.";
  }
  if (context?.clarChoice === "1" || lower === "1") {
    return "Pasti nggak nyaman ya kalau otot mulai kaku dan pegal setelah duduk lama.";
  }
  if (context?.clarChoice === "2" || lower === "2") {
    return "Pasti tubuh dan matamu terasa berat kalau jam tidurmu kurang atau sempat begadang.";
  }
  if (context?.clarChoice === "4" || lower === "4") {
    return "Wajar banget kalau pikiran terasa penuh dan jenuh setelah menghadapi tugas kuliah.";
  }
  if (lower === "lewati" || lower === "skip") {
    return "Tidak apa-apa, mari kita fokus pada gerakan ringan yang bisa menyegarkan tubuhmu hari ini.";
  }

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

  // Jika input pendek (misal karakter tunggal), hindari ucapan terima kasih panjang yang tidak wajar
  if (trimmed.length <= 3) {
    return "Bagus kamu menyempatkan jeda sebentar untuk mendengarkan tubuhmu.";
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

export interface ProcessChatCoachOptions {
  callModelFn?: typeof callOllamaChatJson;
  hasClarified?: boolean;
  forcedJenisGerak?: string;
  pendingPrompt?: "clarification" | "movement" | null;
  previousPayload?: ReturnType<typeof buildChatCoachPayload>["promptPayload"];
  previousMeta?: {
    dominantMediator: DominantMediator;
    escalationFlag: boolean;
    sleepHours: number | null;
    sedentaryHours: number | null;
    detectedActivity: string | null;
    allowedRanges: AllowedRanges;
    movementOptions: string[];
    movementOptionsShown?: string[];
  };
  showRaw?: boolean;
  logFilePath?: string;
}

export interface ProcessChatCoachResult {
  promptPayload: ReturnType<typeof buildChatCoachPayload>["promptPayload"];
  dominantMediator: DominantMediator;
  escalationFlag: boolean;
  sleepHours: number | null;
  sedentaryHours: number | null;
  jenisGerak: string;
  insight: GeneratedInsight;
  rawInsight?: GeneratedInsight;
  flags?: {
    retryApplied: boolean;
    retryReasons?: string[];
    sentenceRemoved: boolean;
    durationAdjusted: boolean;
    openingReplaced: boolean;
    conjunctionStripped: boolean;
  };
  source: string;
  movementMatchNote: string;
  auditReport: AuditReport;
  formattedOutput: string;
  needsClarification: boolean;
  movementOptions: string[];
  movementOptionsShown: string[];
  pendingPrompt: "clarification" | "movement" | null;
}

export async function processChatCoachInput(
  trimmed: string,
  options: ProcessChatCoachOptions = {}
): Promise<ProcessChatCoachResult> {
  const caller = options.callModelFn ?? callOllamaChatJson;
  const isDistress = detectDistressKeywords(trimmed);
  const width = getTerminalWidth();
  const indent = "        ";
  const { timeStr, period: sysPeriod, isLateNight } = getSystemJakartaTime();

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
      currentTime: `${timeStr} (${sysPeriod})`,
      timeOfDay: sysPeriod,
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
      movementOptionsShown: [],
      pendingPrompt: null,
    };
  }

  // POIN 1: KLARIFIKASI PROAKTIF
  // Jika input hanya keluhan umum tanpa penanda konteks dan belum dalam state klarifikasi, JANGAN panggil model!
  const isClarificationState =
    options.pendingPrompt === "clarification" || Boolean(options.hasClarified);

  if (isBareGeneralComplaint(trimmed) && !isClarificationState) {
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
      movementOptionsShown: [],
      pendingPrompt: "clarification",
    };
  }

  const moveChoice = detectMovementChoice(trimmed);
  const isMovementSelection =
    options.pendingPrompt === "movement" &&
    (moveChoice.isChoice || Boolean(options.forcedJenisGerak)) &&
    Boolean(options.previousPayload);

  const clarChoice = isMovementSelection
    ? { isChoice: false, choice: null }
    : detectClarificationChoice(trimmed);

  let promptPayload: ReturnType<typeof buildChatCoachPayload>["promptPayload"];
  let period: "pagi" | "siang" | "sore" | "malam" = sysPeriod;
  let activity: string | null = null;
  let dominantMediator: DominantMediator;
  let escalationFlag: boolean;
  let sleepHours: number | null = null;
  let sedentaryHours: number | null = null;
  let detectedActivity: string | null = null;
  let jenisGerak: string;
  let allowedRanges: AllowedRanges;

  if (isMovementSelection) {
    const prevPayload = options.previousPayload!;
    const prevMeta = options.previousMeta;

    const optionsShown = prevMeta?.movementOptionsShown || prevMeta?.movementOptions;
    const chosenOption =
      (moveChoice.index !== null && optionsShown?.[moveChoice.index])
        ? optionsShown[moveChoice.index]
        : (options.forcedJenisGerak ||
          prevPayload.activeDirectives.find((d: string) => d.startsWith("JENIS_GERAK:"))?.replace("JENIS_GERAK:", "").trim() ||
          "peregangan meja");

    dominantMediator = prevMeta?.dominantMediator ?? prevPayload.clinicalRuleEvaluation.dominantMediator;
    escalationFlag = prevMeta?.escalationFlag ?? prevPayload.clinicalRuleEvaluation.escalationFlag;
    sleepHours = prevMeta?.sleepHours ?? (prevPayload.today.sleepHours as number | null) ?? null;
    sedentaryHours = prevMeta?.sedentaryHours ?? (prevPayload.today.totalSedentaryHours as number | null) ?? null;
    detectedActivity = prevMeta?.detectedActivity ?? prevPayload.detectedActivity ?? null;
    activity = detectedActivity;
    allowedRanges = prevMeta?.allowedRanges ?? prevPayload.allowedRanges;
    jenisGerak = chosenOption;

    // POIN 3: Respons setelah user memilih opsi dibuat dari template di coachShared.ts TANPA MEMANGGIL MODEL
    const guidance = getMovementGuidance(chosenOption);
    const diagnosisSummary = guidance.confirmation;
    const stepsFormatted = guidance.steps.map((s, i) => `${i + 1}. ${s}`).join("\n");
    const isotemporalActionPlan = guidance.fullPlanText;

    const formattedOutput = wrapParagraph(
      "Coach > ",
      `${diagnosisSummary}\n\nPanduan langkah:\n${stepsFormatted}\n\n${guidance.closing}`,
      width,
      indent
    );

    const templateInsight: GeneratedInsight = {
      dominantMediator,
      diagnosisSummary,
      isotemporalActionPlan,
      recommendedMetsToday: 180,
      scientificCitationNote: pickCitation(dominantMediator),
    };

    // Catat ke coach-raw.jsonl bila ada path log
    if (options.logFilePath) {
      appendCoachRawLog(
        {
          timestamp: new Date().toISOString(),
          userInput: trimmed,
          dominantMediator,
          rawModelResponse: templateInsight,
          finalResponse: templateInsight,
          flags: {
            retryApplied: false,
            sentenceRemoved: false,
            conjunctionStripped: false,
            durationAdjusted: false,
            openingReplaced: false,
          },
        },
        options.logFilePath
      );
    }

    // POIN 1: Jangan tampilkan daftar opsi lagi setelah user memilih (pendingPrompt = null)
    return {
      promptPayload: prevPayload,
      dominantMediator,
      escalationFlag,
      sleepHours,
      sedentaryHours,
      jenisGerak: chosenOption,
      insight: templateInsight,
      source: "TEMPLATE_GUIDANCE",
      movementMatchNote: "SESUAI (Template panduan gerakan)",
      auditReport: {
        unverifiedNumbers: [],
        unverifiedActivityClaims: [],
        unverifiedCauseClaims: [],
        unverifiedEmotionClaims: [],
        hasRepeatedSentences: false,
        repeatedSentences: [],
      },
      formattedOutput,
      needsClarification: false,
      movementOptions: [],
      movementOptionsShown: [],
      pendingPrompt: null,
      guidance: guidance.steps,
    };
  } else {
    const built = buildChatCoachPayload(trimmed, {
      forcedJenisGerak: options.forcedJenisGerak,
      pendingPrompt: options.pendingPrompt ?? (options.hasClarified ? "clarification" : null),
    });
    promptPayload = built.promptPayload;
    period = built.period;
    activity = built.activity;
    dominantMediator = built.dominantMediator;
    escalationFlag = built.escalationFlag;
    sleepHours = built.sleepHours;
    sedentaryHours = built.sedentaryHours;
    jenisGerak = built.jenisGerak;
    allowedRanges = built.allowedRanges;
  }

  const t0 = Date.now();
  let insight: GeneratedInsight;
  let rawInsight: GeneratedInsight | null = null;
  let rawAttempt1: GeneratedInsight | null = null;
  let rawAttempt2: GeneratedInsight | null = null;
  let source = "OLLAMA_LOCAL";
  let hasRetried = false;
  let retryApplied = false;
  const retryReasons: string[] = [];
  let sentenceRemoved = false;
  let durationAdjusted = false;
  let openingReplaced = false;
  let conjunctionStripped = false;

  try {
    const res = await caller(
      [{ role: "user", content: JSON.stringify(promptPayload) }],
      { timeoutMs: 120000 }
    );
    insight = res.insight;
    rawAttempt1 = { ...insight };
    rawInsight = { ...insight };

    // POIN 1: Input pendek ditolak salah -> jika out-of-scope tapi kata kunci in-scope ada, retry SEKALI
    const isOutOfScopeInitial =
      /di luar cakupan/i.test(insight.diagnosisSummary) ||
      /di luar cakupan/i.test(insight.isotemporalActionPlan);

    if (isOutOfScopeInitial && IN_SCOPE_WELLBEING_PATTERN.test(trimmed)) {
      hasRetried = true;
      retryApplied = true;
      retryReasons.push("OUT_OF_SCOPE_IN_SCOPE_RETRY");
      promptPayload.activeDirectives.push(
        "INPUT_DALAM_CAKUPAN: keluhan ini terkait kelelahan fisik/energi, berikan rekomendasi sesuai JENIS_GERAK"
      );
      try {
        const retryRes = await caller(
          [{ role: "user", content: JSON.stringify(promptPayload) }],
          { timeoutMs: 120000 }
        );
        rawAttempt2 = { ...retryRes.insight };
        insight = retryRes.insight;
      } catch {
        // Biarkan memakai hasil initial
      }
    }

    // POIN 1 (Perluas Audit): Cek klaim emosi & penyebab karangan pada hasil awal dan coba ulang sekali
    const preAudit = auditResponse(
      insight.diagnosisSummary,
      insight.isotemporalActionPlan,
      trimmed,
      allowedRanges,
      jenisGerak,
      sedentaryHours !== null,
      false,
      sleepHours !== null,
      activity,
      {
        dominantMediator,
        escalationFlag,
        contextChoice: clarChoice.isChoice ? clarChoice.choice : null,
      }
    );

    if (
      !hasRetried &&
      (preAudit.unverifiedEmotionClaims.length > 0 ||
        preAudit.unverifiedCauseClaims.length > 0 ||
        preAudit.unverifiedActivityClaims.length > 0)
    ) {
      hasRetried = true;
      retryApplied = true;
      retryReasons.push("UNVERIFIED_CAUSE_EMOTION_RETRY");
      promptPayload.activeDirectives.push(
        "KLAIM_TIDAK_TERVERIFIKASI: Jangan menyebut kata/klaim kuliah, tugas, kurang aktif, cukup aktif, stres, cemas, tidur, atau kesibukan yang tidak ada di input user atau data telemetri. Fokus HANYA pada kondisi fisik riil dan JENIS_GERAK."
      );
      try {
        const retryRes = await caller(
          [{ role: "user", content: JSON.stringify(promptPayload) }],
          { timeoutMs: 120000 }
        );
        rawAttempt2 = { ...retryRes.insight };
        insight = retryRes.insight;
      } catch {
        // Biarkan memakai hasil sebelumnya
      }
    }

    // POIN 4: Cek "Gerak Match" & Retry bila tidak sesuai target
    let initialMatch = checkMovementMatch(insight.isotemporalActionPlan, jenisGerak);
    if (!initialMatch.matches) {
      if (!hasRetried) {
        hasRetried = true;
        retryApplied = true;
        retryReasons.push("MOVEMENT_MISMATCH_RETRY");
        promptPayload.activeDirectives.push(
          `PENYESUAIAN_GERAK: Rekomendasi sebelumnya (${insight.isotemporalActionPlan.slice(0, 50)}) TIDAK SESUAI target. WAJIB fokus dan susun rekomendasi aksi spesifik untuk: ${jenisGerak}.`
        );
        try {
          const retryRes = await caller(
            [{ role: "user", content: JSON.stringify(promptPayload) }],
            { timeoutMs: 120000 }
          );
          rawAttempt2 = { ...retryRes.insight };
          const retryMatch = checkMovementMatch(retryRes.insight.isotemporalActionPlan, jenisGerak);
          if (retryMatch.matches) {
            insight = retryRes.insight;
          } else {
            // Bila masih beda setelah retry, ganti paragraf rekomendasi dengan template dari JENIS_GERAK
            const duration = allowedRanges.durationMinutesRange[0];
            insight = {
              ...retryRes.insight,
              isotemporalActionPlan: `Coba luangkan waktu untuk ${jenisGerak} selama ${duration} menit sekarang agar tubuh terasa lebih bugar.`,
            };
          }
        } catch {
          const duration = allowedRanges.durationMinutesRange[0];
          insight = {
            ...insight,
            isotemporalActionPlan: `Coba luangkan waktu untuk ${jenisGerak} selama ${duration} menit sekarang agar tubuh terasa lebih bugar.`,
          };
        }
      } else {
        const duration = allowedRanges.durationMinutesRange[0];
        insight = {
          ...insight,
          isotemporalActionPlan: `Coba luangkan waktu untuk ${jenisGerak} selama ${duration} menit sekarang agar tubuh terasa lebih bugar.`,
        };
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

  // POIN 2: Filter kebocoran directive & data state
  const prevSumLeak = sanitizedSummary;
  const sentenceRegexLeak = /[^.!?\n]+(?:[.!?]+|\n+|$)/g;
  const leakSentences = sanitizedSummary.match(sentenceRegexLeak) || [sanitizedSummary];
  sanitizedSummary = filterDirectiveLeakage(sanitizedSummary);
  if (sanitizedSummary !== prevSumLeak) {
    sentenceRemoved = true;
    // Cek apakah kalimat setelah kalimat yang dihapus diawali kata sambung kontras/sebab
    if (leakSentences.length > 1 && hasLeadingConjunction(leakSentences[1])) {
      conjunctionStripped = true;
    }
  }

  const prevActLeak = sanitizedAction;
  sanitizedAction = filterDirectiveLeakage(sanitizedAction);
  if (sanitizedAction !== prevActLeak) {
    sentenceRemoved = true;
  }

  // POIN 3: Cek durasi menit di action plan vs JENIS_GERAK dan allowedRanges
  const durCheck = sanitizeDurationMinutes(sanitizedAction, jenisGerak, allowedRanges);
  if (durCheck.replaced) {
    durationAdjusted = true;
    sanitizedAction = durCheck.sanitized;
  }

  // POIN 4: Hapus otomatis kalimat yang persis berulang dalam satu jawaban
  const deduped = deduplicateResponse(sanitizedSummary, sanitizedAction);
  sanitizedSummary = deduped.summary;
  sanitizedAction = deduped.plan;

  // Evaluasi kecocokan jenis gerak
  const movementMatch = checkMovementMatch(sanitizedAction, jenisGerak);

  // POIN 1: Audit pasca-jawaban (angka tidak terverifikasi, klaim aktivitas tanpa data, klaim penyebab/emosi tidak berdasar)
  let auditReport = auditResponse(
    sanitizedSummary,
    sanitizedAction,
    trimmed,
    allowedRanges,
    jenisGerak,
    sedentaryHours !== null,
    false, // tidak ada telemetry MVPA
    sleepHours !== null,
    activity,
    {
      dominantMediator,
      escalationFlag,
      contextChoice: clarChoice.isChoice ? clarChoice.choice : null,
      activeDirectives: promptPayload.activeDirectives,
    }
  );

  // POIN 1 & 3: Jika audit masih menemukan klaim penyebab atau emosi karangan setelah percobaan,
  // saring kalimat yang mengklaim stres/penyebab palsu atau ganti dengan template netral.
  let wasModularFallbackApplied = false;
  if (auditReport.unverifiedCauseClaims.length > 0 || auditReport.unverifiedEmotionClaims.length > 0) {
    wasModularFallbackApplied = true;

    const userLower = trimmed.toLowerCase();
    const userMentionsSleep = /\b(tidur|begadang|ngantuk|kantuk|insomnia|lelap|merem)\b/i.test(userLower);
    const userMentionsSitting = /\b(duduk|nugas|laprak|skripsi|lab|kuliah|kursi|meja|layar|komputer|laptop|tv)\b/i.test(userLower);
    const userMentionsActivity = /\b(aktivitas|kegiatan|olahraga|kuliah|kelas|dosen|lab|laprak|skripsi|nugas|jadwal|padat|sibuk)\b/i.test(userLower);
    const userMentionsCollege =
      /\b(kuliah|kampus|kelas|matkul|dosen)\b/i.test(userLower) ||
      activity === "KULIAH";
    const userMentionsTasks =
      /\b(tugas|nugas|laprak|skripsi|pr|makalah)\b/i.test(userLower) ||
      activity === "TUGAS";

    const isStressContext =
      /\b(stres|stress|cemas|kecemasan|tertekan|tekanan|panik|khawatir|kepikiran|beban\s+pikiran|penat|mumet|pusing)\b/i.test(
        userLower
      ) ||
      clarChoice.choice === "4" ||
      dominantMediator === "EXAM_ACUTE_STRESS" ||
      escalationFlag;

    const sentenceRegex = /[^.!?\n]+(?:[.!?]+|\n+|$)/g;
    const sentences = sanitizedSummary.match(sentenceRegex) || [sanitizedSummary];
    const filteredSentences = sentences.filter((s) => {
      const lowerS = s.toLowerCase();
      const isSleepClaim =
        sleepHours === null &&
        !userMentionsSleep &&
        clarChoice.choice !== "2" &&
        /\b(?:masalah\s+(?:dengan\s+)?tidur|kurang\s+tidur|pola\s+tidur|kualitas\s+tidur|jam\s+tidur|tidurmu|begadang|istirahat\s+malam)\b/i.test(lowerS);
      const isSittingClaim =
        sedentaryHours === null &&
        !userMentionsSitting &&
        clarChoice.choice !== "1" &&
        /\b(?:duduk\s+(?:cukup\s+)?lama|terlalu\s+lama\s+duduk|sudah\s+cukup\s+lama\s+duduk|banyak\s+duduk|posisi\s+duduk|lama\s+di\s+depan\s+layar|di\s+depan\s+(?:komputer|laptop|layar|tv)|berjam-jam\s+di\s+depan|menonton\s+tv)\b/i.test(lowerS);
      const isActivityClaim =
        !activity &&
        !userMentionsActivity &&
        clarChoice.choice !== "3" &&
        /\b(?:aktivitas\s+padat|padatnya\s+aktivitas|jadwal\s+padat|setelah\s+berolahraga|banyak\s+aktivitas|kuliah\s+seharian|kegiatan\s+padat)\b/i.test(lowerS);
      const isEmotionClaim =
        !isStressContext &&
        /\b(?:mengalami\s+stres|meredakan\s+stres|tingkat\s+stres|stres\s+(?:yang\s+)?cukup\s+tinggi|stresmu|banyak\s+stres|meredakan\s+kecemasan|rasa\s+cemas|tertekan|stres)\b/i.test(lowerS);
      const isCollegeClaim =
        !userMentionsCollege &&
        /\b(?:setelah\s+kuliah|kegiatan\s+kuliah|jadwal\s+kuliah|di\s+kampus|kuliah)\b/i.test(lowerS);
      const isTaskClaim =
        !userMentionsTasks &&
        /\b(?:mengerjakan\s+tugas(?:\s+kuliah)?|setelah\s+(?:mengerjakan\s+)?tugas|nugas|banyak\s+tugas)\b/i.test(lowerS);
      const isActivityTelemetryClaim =
        /\b(?:sudah\s+cukup\s+aktif|cukup\s+aktif|kurang\s+aktif|terlihat\s+kurang\s+aktif|ritme\s+gerak(?:mu)?|aktivitas\s+intensif)\b/i.test(lowerS);

      return (
        !isSleepClaim &&
        !isSittingClaim &&
        !isActivityClaim &&
        !isEmotionClaim &&
        !isCollegeClaim &&
        !isTaskClaim &&
        !isActivityTelemetryClaim
      );
    });

    if (filteredSentences.length < sentences.length) {
      sentenceRemoved = true;
    }

    const cleanedSummary = filteredSentences.join(" ").trim();
    if (cleanedSummary.length >= 10) {
      sanitizedSummary = cleanedSummary;
    } else {
      sanitizedSummary = getNextNeutralCauseFallback();
    }

    if (!isStressContext) {
      sanitizedAction = sanitizedAction
        .replace(/\b(?:meredakan|mengurangi|menghilangkan)\s+stres\b/gi, "memulihkan kesegaran tubuh")
        .replace(/\b(?:dan\s+)?stres\b/gi, "ketegangan otot")
        .replace(/\bmeredakan\s+kecemasan\b/gi, "menenangkan tubuh");
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
      activity,
      {
        dominantMediator,
        escalationFlag,
        contextChoice: clarChoice.isChoice ? clarChoice.choice : null,
        activeDirectives: promptPayload.activeDirectives,
      }
    );
  }

  if (clarChoice.isChoice && clarChoice.choice === "SKIP") {
    sanitizedSummary = getNextNeutralCauseFallback();
    wasModularFallbackApplied = true;
    const reDeduped = deduplicateResponse(sanitizedSummary, sanitizedAction);
    sanitizedSummary = reDeduped.summary;
    sanitizedAction = reDeduped.plan;
  }

  // POIN 2: Perbaiki kata janggal
  sanitizedSummary = sanitizedSummary.replace(/\bperjalanan singkat\b/gi, "jalan singkat");
  sanitizedAction = sanitizedAction.replace(/\bperjalanan singkat\b/gi, "jalan singkat");

  // POIN 1: Pastikan kalimat yang tersisa tidak diawali kata sambung penghubung kontras/sebab
  const preConjSummary = sanitizedSummary;
  sanitizedSummary = stripLeadingConjunctions(sanitizedSummary);
  if (sanitizedSummary !== preConjSummary) {
    conjunctionStripped = true;
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
    openingReplaced = true;
    const opening = selectOpeningSentence(trimmed, {
      clarChoice: clarChoice.isChoice ? clarChoice.choice : null,
      isMovementSelection,
      isRecoveryMode:
        detectRecentlyExercised(trimmed) || (clarChoice.isChoice && clarChoice.choice === "3"),
    });
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
    detectRecentlyExercised(trimmed) || (clarChoice.isChoice && clarChoice.choice === "3");
  const mediatorKey = isRecoveryMode
    ? "RECENTLY_EXERCISED"
    : escalationFlag
      ? "ESCALATION"
      : dominantMediator;

  // POIN 2: Jangan tampilkan opsi yang sama dengan rekomendasi. Tampilkan hanya alternatif.
  // Jika alternatif kurang dari 2, jangan tampilkan daftar sama sekali.
  const movementOptions = getAlternativeMovementOptions(jenisGerak, mediatorKey, isLateNight);

  if (!isStillOutOfScope && !isDistress && movementOptions.length >= 2) {
    const movementPrompt = formatMovementOptionsPrompt(movementOptions);
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
    formattedOutput += `\n- MVPA Flag         : MVPA_ASUMSI_NOL (telemetri MVPA kosong diasumsikan 0 menit)`;
    formattedOutput += `\n- Target Directive  : ${jenisGerak}`;
    formattedOutput += `\n- Jenis Gerak Match : ${movementMatch.note}`;
    if (auditReport.unverifiedNumbers.length > 0) {
      formattedOutput += `\n- [AUDIT] Angka Tdk Terverifikasi : ${auditReport.unverifiedNumbers.join(", ")}`;
    }
    if (auditReport.unverifiedActivityClaims.length > 0) {
      formattedOutput += `\n- [AUDIT] Klaim Aktivitas Tdk Sah : ${auditReport.unverifiedActivityClaims.join(", ")}`;
    }
    if (auditReport.unverifiedEmotionClaims && auditReport.unverifiedEmotionClaims.length > 0) {
      formattedOutput += `\n- [AUDIT] Klaim Emosi Tdk Sah     : ${auditReport.unverifiedEmotionClaims.join(", ")}`;
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

  if (rawAttempt1 && !isDistress && source !== "CRISIS_SAFETY_BYPASS") {
    const finalResponseObj = {
      dominantMediator,
      diagnosisSummary: sanitizedSummary,
      isotemporalActionPlan: sanitizedAction,
      recommendedMetsToday: insight.recommendedMetsToday,
      scientificCitationNote: insight.scientificCitationNote,
    };

    appendCoachRawLog(
      {
        timestamp: new Date().toISOString(),
        userInput: trimmed,
        dominantMediator,
        rawModelResponse: {
          dominantMediator: rawAttempt1.dominantMediator,
          diagnosisSummary: rawAttempt1.diagnosisSummary,
          isotemporalActionPlan: rawAttempt1.isotemporalActionPlan,
          recommendedMetsToday: rawAttempt1.recommendedMetsToday,
          scientificCitationNote: rawAttempt1.scientificCitationNote,
        },
        finalResponse: finalResponseObj,
        rawAttempt1: {
          dominantMediator: rawAttempt1.dominantMediator,
          diagnosisSummary: rawAttempt1.diagnosisSummary,
          isotemporalActionPlan: rawAttempt1.isotemporalActionPlan,
          recommendedMetsToday: rawAttempt1.recommendedMetsToday,
          scientificCitationNote: rawAttempt1.scientificCitationNote,
        },
        ...(rawAttempt2
          ? {
              rawAttempt2: {
                dominantMediator: rawAttempt2.dominantMediator,
                diagnosisSummary: rawAttempt2.diagnosisSummary,
                isotemporalActionPlan: rawAttempt2.isotemporalActionPlan,
                recommendedMetsToday: rawAttempt2.recommendedMetsToday,
                scientificCitationNote: rawAttempt2.scientificCitationNote,
              },
            }
          : {}),
        rawInsight: rawAttempt1,
        finalInsight: finalResponseObj,
        flags: {
          retryApplied,
          retryReasons: retryReasons.length > 0 ? retryReasons : undefined,
          sentenceRemoved,
          durationAdjusted,
          openingReplaced,
          conjunctionStripped,
        },
      },
      options.logFilePath
    );
  }

  if (isShowRaw || options.showRaw) {
    formattedOutput += `\n\n--- [JAWABAN MENTAH MODEL (RAW)] ---`;
    formattedOutput += `\n` + JSON.stringify(rawInsight ?? insight, null, 2);
    formattedOutput += `\nFlags Perbaikan: ` + JSON.stringify({
      retryApplied,
      retryReasons: retryReasons.length > 0 ? retryReasons : undefined,
      sentenceRemoved,
      durationAdjusted,
      openingReplaced,
      conjunctionStripped,
    }, null, 2);
    formattedOutput += `\n------------------------------------\n`;
  }

  const nextPendingPrompt: "clarification" | "movement" | null =
    movementOptions.length >= 2 && !isStillOutOfScope && !isDistress ? "movement" : null;

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
    rawInsight: rawInsight ?? insight,
    flags: {
      retryApplied,
      retryReasons: retryReasons.length > 0 ? retryReasons : undefined,
      sentenceRemoved,
      durationAdjusted,
      openingReplaced,
      conjunctionStripped,
    },
    source,
    movementMatchNote: movementMatch.note,
    auditReport,
    formattedOutput,
    needsClarification: false,
    movementOptions,
    movementOptionsShown: movementOptions,
    pendingPrompt: nextPendingPrompt,
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

  const argMockTimeIndex = process.argv.findIndex((a) => a === "--mock-time");
  if (argMockTimeIndex !== -1 && process.argv[argMockTimeIndex + 1]) {
    process.env.COACH_MOCK_TIME = process.argv[argMockTimeIndex + 1];
  }

  const argPendingPromptIndex = process.argv.findIndex((a) => a === "--pending-prompt");
  const cliPendingPrompt =
    argPendingPromptIndex !== -1 && process.argv[argPendingPromptIndex + 1]
      ? (process.argv[argPendingPromptIndex + 1] as "clarification" | "movement")
      : null;

  const argPriorMediatorIndex = process.argv.findIndex((a) => a === "--prior-mediator");
  const cliPriorMediator =
    argPriorMediatorIndex !== -1 && process.argv[argPriorMediatorIndex + 1]
      ? process.argv[argPriorMediatorIndex + 1]
      : null;

  const argPriorSedentaryIndex = process.argv.findIndex((a) => a === "--prior-sedentary");
  const cliPriorSedentary =
    argPriorSedentaryIndex !== -1 && process.argv[argPriorSedentaryIndex + 1]
      ? process.argv[argPriorSedentaryIndex + 1]
      : null;

  const argPriorActivityIndex = process.argv.findIndex((a) => a === "--prior-activity");
  const cliPriorActivity =
    argPriorActivityIndex !== -1 && process.argv[argPriorActivityIndex + 1]
      ? process.argv[argPriorActivityIndex + 1]
      : null;

  if (cliInput) {
    const runOptions: ProcessChatCoachOptions = {};

    if (cliPendingPrompt) {
      runOptions.pendingPrompt = cliPendingPrompt;
      if (cliPendingPrompt === "clarification") {
        runOptions.hasClarified = true;
      }
    } else if (cliClarify || /^[1-4]$/.test(cliInput.trim())) {
      runOptions.pendingPrompt = "clarification";
      runOptions.hasClarified = true;
    }

    if (cliMovement) {
      runOptions.forcedJenisGerak = cliMovement;
    }

    const { timeStr, period, isLateNight } = getSystemJakartaTime();

    if (cliPendingPrompt === "movement" || (!cliPendingPrompt && /^[a-c]$/i.test(cliInput.trim()))) {
      runOptions.pendingPrompt = "movement";
      const priorMed = (cliPriorMediator as DominantMediator) || "SEDENTARY_OVERLOAD";
      const priorSed = cliPriorSedentary !== null ? parseFloat(cliPriorSedentary) : 8;
      const priorAct = cliPriorActivity || "nugas";
      const priorMovOptions = getMovementOptionsForMediator(priorMed, isLateNight);

      runOptions.previousMeta = {
        dominantMediator: priorMed,
        escalationFlag: false,
        sleepHours: null,
        sedentaryHours: priorSed,
        detectedActivity: priorAct,
        allowedRanges: { durationMinutesRange: [10, 20], metsRange: [170, 240] },
        movementOptions: priorMovOptions,
      };

      runOptions.previousPayload = {
        activeDirectives: [
          "DATA_TIDAK_LENGKAP: jangan menyebut angka, durasi, atau tingkat aktivitas yang tidak ada di input user",
          `JENIS_GERAK: ${priorMovOptions[0]}`,
        ],
        clinicalRuleEvaluation: {
          dominantMediator: priorMed,
          priorityMediator: priorMed,
          flags: [priorMed],
          escalationFlag: false,
          missingDailyCheckIn: true,
        },
        allowedRanges: { durationMinutesRange: [10, 20], metsRange: [170, 240] },
        skipAdaptation: { applied: false, consecutiveSkips: 0, previousRecommendedMets: null },
        currentTime: `${timeStr} (${period})`,
        timeOfDay: period,
        detectedActivity: priorAct,
        today: { totalSedentaryHours: priorSed },
        history7Days: [],
        latestPss10Score: null,
        userNotes: "prior prompt",
      };
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
          console.log(`- MVPA Flag        : MVPA_ASUMSI_NOL (telemetri MVPA kosong diasumsikan 0 menit)`);
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
          if (auditReport.unverifiedEmotionClaims && auditReport.unverifiedEmotionClaims.length > 0) {
            console.log(
              `- [AUDIT] Klaim Emosi Tdk Sah    : ${auditReport.unverifiedEmotionClaims.join(", ")}`
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

    let sessionState: {
      pendingPrompt: "clarification" | "movement" | null;
      previousPayload?: any;
      previousMeta?: any;
    } = {
      pendingPrompt: null,
    };

    console.log("\n==================================================================");
    console.log("  🌿 CampusFlow AI Coach — Sesi Percakapan Aktif");
    console.log("==================================================================");
    console.log("Ceritakan apa yang sedang kamu rasakan seputar tubuh, tidur, atau beban kuliah.");
    console.log("Ketik 'exit' untuk selesai.\n");

    function askPrompt(): void {
      if (isClosed) return;
      rl.question("Kamu > ", async (input) => {
        const trimmed = input.trim();
        if (!trimmed && sessionState.pendingPrompt !== "clarification") {
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
          const callOptions: ProcessChatCoachOptions = {
            pendingPrompt: sessionState.pendingPrompt,
            previousPayload: sessionState.previousPayload,
            previousMeta: sessionState.previousMeta,
          };

          const result = await processChatCoachInput(trimmed, callOptions);

          if (process.stdout.isTTY) {
            readline.clearLine(process.stdout, 0);
            readline.cursorTo(process.stdout, 0);
          } else {
            process.stdout.write("\n");
          }

          if (isShowJson) {
            console.log("\n--- [JSON DIKIRIM KE MODEL] ---");
            console.log(JSON.stringify(result.promptPayload, null, 2));
            console.log("-------------------------------\n");
          }

          if (isDebug) {
            console.log(`[DEBUG METADATA]`);
            console.log(`- dominantMediator : ${result.dominantMediator}`);
            console.log(`- escalationFlag   : ${result.escalationFlag}`);
            console.log(`- sleepHours       : ${result.sleepHours !== null ? result.sleepHours : "null"}`);
            console.log(`- sedentaryHours   : ${result.sedentaryHours !== null ? result.sedentaryHours : "null"}`);
            console.log(`- MVPA Flag        : MVPA_ASUMSI_NOL (telemetri MVPA kosong diasumsikan 0 menit)`);
            console.log(`- JENIS_GERAK      : ${result.jenisGerak}`);
            console.log(`- Gerak Match      : ${result.movementMatchNote}`);
            if (result.auditReport.unverifiedNumbers.length > 0) {
              console.log(
                `- [AUDIT] Angka Tdk Terverifikasi: ${result.auditReport.unverifiedNumbers.join(", ")}`
              );
            }
            if (result.auditReport.unverifiedActivityClaims.length > 0) {
              console.log(
                `- [AUDIT] Klaim Aktivitas Tdk Sah: ${result.auditReport.unverifiedActivityClaims.join(", ")}`
              );
            }
            if (result.auditReport.unverifiedEmotionClaims && result.auditReport.unverifiedEmotionClaims.length > 0) {
              console.log(
                `- [AUDIT] Klaim Emosi Tdk Sah    : ${result.auditReport.unverifiedEmotionClaims.join(", ")}`
              );
            }
            if (result.auditReport.unverifiedCauseClaims.length > 0) {
              console.log(
                `- [AUDIT] Klaim Penyebab Tdk Sah : ${result.auditReport.unverifiedCauseClaims.join(", ")}`
              );
            }
            if (result.auditReport.hasRepeatedSentences) {
              console.log(
                `- [AUDIT] Kalimat Berulang       : ${result.auditReport.repeatedSentences.join(" | ")}`
              );
            }
            console.log();
          }

          console.log(result.formattedOutput);
          console.log();

          if (result.needsClarification) {
            sessionState = {
              pendingPrompt: "clarification",
            };
          } else if (result.movementOptions && result.movementOptions.length > 0) {
            sessionState = {
              pendingPrompt: "movement",
              previousPayload: result.promptPayload,
              previousMeta: {
                dominantMediator: result.dominantMediator,
                escalationFlag: result.escalationFlag,
                sleepHours: result.sleepHours,
                sedentaryHours: result.sedentaryHours,
                detectedActivity: result.promptPayload.detectedActivity,
                allowedRanges: result.promptPayload.allowedRanges,
                movementOptions: result.movementOptions,
                movementOptionsShown: result.movementOptionsShown,
              },
            };
          } else {
            sessionState = {
              pendingPrompt: null,
            };
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
