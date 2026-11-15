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
  CRISIS_RESPONSE_TEXT,
  detectDistressKeywords,
  extractActivity,
  extractSedentaryHours,
  extractSleepHours,
  getNextMovementOption,
  IN_SCOPE_WELLBEING_PATTERN,
  sanitizeTimeWords,
  stripNullFields,
  type AuditReport,
} from "../src/services/coachShared.ts";

export {
  auditResponse,
  checkMovementMatch,
  CLARIFICATION_PROMPT_TEXT,
  CRISIS_RESPONSE_TEXT,
  detectDistressKeywords,
  extractActivity,
  extractSedentaryHours,
  extractSleepHours,
  getNextMovementOption,
  IN_SCOPE_WELLBEING_PATTERN,
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
export function buildChatCoachPayload(userInput: string) {
  const sedentaryHours = extractSedentaryHours(userInput);
  const sleepHours = extractSleepHours(userInput);
  const activity = extractActivity(userInput);
  const { timeStr, period } = getSystemJakartaTime();

  const isDistress = detectDistressKeywords(userInput);

  let dominantMediator: DominantMediator = "LOW_MVPA_VOLUME";
  let escalationFlag = false;

  if (isDistress) {
    dominantMediator = "EXAM_ACUTE_STRESS";
    escalationFlag = true;
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

  const allowedRanges: AllowedRanges = escalationFlag
    ? { durationMinutesRange: [5, 10], metsRange: [80, 160] }
    : dominantMediator === "SEDENTARY_OVERLOAD"
      ? { durationMinutesRange: [10, 20], metsRange: [170, 240] }
      : dominantMediator === "EXAM_ACUTE_STRESS"
        ? { durationMinutesRange: [10, 20], metsRange: [150, 200] }
        : dominantMediator === "SLEEP_MEDIATION_DEFICIT"
          ? { durationMinutesRange: [15, 30], metsRange: [180, 260] }
          : { durationMinutesRange: [15, 25], metsRange: [160, 220] };

  // Pilih variasi jenis gerak
  const mediatorKey = escalationFlag ? "ESCALATION" : dominantMediator;
  const jenisGerak = getNextMovementOption(mediatorKey);

  const activeDirectives: string[] = [
    "DATA_TIDAK_LENGKAP: jangan menyebut angka, durasi, atau tingkat aktivitas yang tidak ada di input user",
  ];

  if (escalationFlag) {
    activeDirectives.push(
      "ESKALASI_AKTIF: WAJIB tulis kalimat penutup ini di diagnosisSummary: 'Kalau rasanya terus menumpuk, nggak apa-apa cerita ke konselor kampus.' dan isi isotemporalActionPlan hanya dengan relaksasi ringan/napas tanpa olahraga berat."
    );
  }

  activeDirectives.push(`JENIS_GERAK: ${jenisGerak}`);

  // POIN 1: Hilangkan field today yang bernilai null dari JSON yang dikirim (jangan kirim null)
  const rawToday: Record<string, number | null> = {
    totalSedentaryHours: sedentaryHours,
    sleepHours: sleepHours,
  };
  const cleanToday = stripNullFields(rawToday);

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
    userNotes: userInput,
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
  const words = text.trim().split(/\s+/);
  const lines: string[] = [];
  let currentLine = firstLinePrefix;

  for (const word of words) {
    if (!word) continue;
    if (currentLine === firstLinePrefix) {
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
    return "Wajar banget kalau kamu merasa capek setelah aktivitas padat hari ini.";
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
        hasRepeatedSentences: false,
        repeatedSentences: [],
      },
      formattedOutput,
    };
  }

  const {
    promptPayload,
    period,
    dominantMediator,
    escalationFlag,
    sleepHours,
    sedentaryHours,
    jenisGerak,
    allowedRanges,
  } = buildChatCoachPayload(trimmed);
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

  // Sanitasi kata waktu
  const sanitizedSummary = sanitizeTimeWords(insight.diagnosisSummary, trimmed, period);
  const sanitizedAction = sanitizeTimeWords(insight.isotemporalActionPlan, trimmed, period);

  // Evaluasi kecocokan jenis gerak
  const movementMatch = checkMovementMatch(sanitizedAction, jenisGerak);

  // Poin 2: Audit pasca-jawaban (angka tidak terverifikasi, klaim aktivitas tanpa data, kalimat berulang)
  const auditReport = auditResponse(
    sanitizedSummary,
    sanitizedAction,
    trimmed,
    allowedRanges,
    jenisGerak,
    sedentaryHours !== null,
    false // tidak ada telemetry MVPA
  );

  const isStillOutOfScope =
    /di luar cakupan/i.test(sanitizedSummary) ||
    /di luar cakupan/i.test(sanitizedAction);

  let formattedOutput = "";

  if (isStillOutOfScope) {
    if (IN_SCOPE_WELLBEING_PATTERN.test(trimmed)) {
      formattedOutput = wrapParagraph("Coach > ", CLARIFICATION_PROMPT_TEXT, width, indent);
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

  if (cliInput) {
    processChatCoachInput(cliInput)
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
            console.log(`- [AUDIT] Angka Tdk Terverifikasi: ${auditReport.unverifiedNumbers.join(", ")}`);
          }
          if (auditReport.unverifiedActivityClaims.length > 0) {
            console.log(`- [AUDIT] Klaim Aktivitas Tdk Sah: ${auditReport.unverifiedActivityClaims.join(", ")}`);
          }
          if (auditReport.hasRepeatedSentences) {
            console.log(`- [AUDIT] Kalimat Berulang       : ${auditReport.repeatedSentences.join(" | ")}`);
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

    console.log("\n==================================================================");
    console.log("  🌿 CampusFlow AI Coach — Sesi Percakapan Aktif");
    console.log("==================================================================");
    console.log("Ceritakan apa yang sedang kamu rasakan seputar tubuh, tidur, atau beban kuliah.");
    console.log("Ketik 'exit' untuk selesai.\n");

    function askPrompt(): void {
      if (isClosed) return;
      rl.question("Kamu > ", async (input) => {
        const trimmed = input.trim();
        if (!trimmed) {
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
          } = await processChatCoachInput(trimmed);

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
              console.log(`- [AUDIT] Angka Tdk Terverifikasi: ${auditReport.unverifiedNumbers.join(", ")}`);
            }
            if (auditReport.unverifiedActivityClaims.length > 0) {
              console.log(`- [AUDIT] Klaim Aktivitas Tdk Sah: ${auditReport.unverifiedActivityClaims.join(", ")}`);
            }
            if (auditReport.hasRepeatedSentences) {
              console.log(`- [AUDIT] Kalimat Berulang       : ${auditReport.repeatedSentences.join(" | ")}`);
            }
            console.log();
          }

          console.log(formattedOutput);
          console.log();
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
