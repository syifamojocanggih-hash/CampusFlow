import "dotenv/config";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import type { DominantMediator } from "../../shared/contracts/index.ts";
import { env } from "../src/config/env.ts";
import {
  callOllamaChatJson,
  checkOllamaStatus,
  computeCoachConstraints,
  evaluateClinicalRuleFlags,
  generateClinicalWellbeingInsight,
  type GeneratedInsight,
  type OllamaChatMessage,
  type OllamaPromptMode,
  type Telemetry7DaysInput,
} from "../src/services/ollamaCoach.ts";
import {
  computeAggregateSummary,
  evaluateInsightResponse,
  formatComparisonReport,
  type EvalAggregateSummary,
  type EvalExpectation,
  type EvalItemRecord,
} from "./eval-checks.ts";

interface EvalCase {
  id: string;
  name: string;
  expectedMediator: DominantMediator;
  outOfScope?: boolean;
  telemetry: Telemetry7DaysInput;
}

interface CliOptions {
  suite: "clinical" | "val" | "all";
  model: string;
  promptMode: OllamaPromptMode;
  limit: number;
  strict: boolean;
  valFile: string;
  savePath: string | null;
  comparePath: string | null;
}

interface ValMessageRow {
  messages: [OllamaChatMessage, OllamaChatMessage, OllamaChatMessage];
}

const SCRIPT_DIR = path.dirname(fileURLToPath(import.meta.url));
const DEFAULT_VAL_FILE = path.join(SCRIPT_DIR, "balanced_dataset_narratives_val_messages.jsonl");

const EVAL_CASES: EvalCase[] = [
  {
    id: "clinical_01",
    name: "1. Defisit Tidur + Stres Tinggi",
    expectedMediator: "SLEEP_MEDIATION_DEFICIT",
    telemetry: {
      today: {
        totalSedentaryHours: 5.5,
        totalMvpaMinutes: 30,
        mvpaPerSedentaryRatio: 5.45,
        sleepHours: 5.5,
        sleepQualityScore: 2,
        pss4TotalScore: 11,
        triadPillarsMet: 1,
      },
      history7Days: [],
      latestPss10Score: 22,
    },
  },
  {
    id: "clinical_02",
    name: "2. Duduk Statis >= 9 Jam (Sedentary Overload)",
    expectedMediator: "SEDENTARY_OVERLOAD",
    telemetry: {
      today: {
        totalSedentaryHours: 9.5,
        totalMvpaMinutes: 15,
        mvpaPerSedentaryRatio: 1.58,
        sleepHours: 7.5,
        sleepQualityScore: 4,
        pss4TotalScore: 6,
        triadPillarsMet: 1,
      },
      history7Days: [],
      latestPss10Score: 18,
    },
  },
  {
    id: "clinical_03",
    name: "3. Volume Gerak Rendah (< 30 mnt MVPA)",
    expectedMediator: "LOW_MVPA_VOLUME",
    telemetry: {
      today: {
        totalSedentaryHours: 4.5,
        totalMvpaMinutes: 10,
        mvpaPerSedentaryRatio: 2.22,
        sleepHours: 7.5,
        sleepQualityScore: 4,
        pss4TotalScore: 5,
        triadPillarsMet: 2,
      },
      history7Days: [],
      latestPss10Score: 14,
    },
  },
  {
    id: "clinical_04",
    name: "4. Stres Ujian Akut (Pilar Lain Baik)",
    expectedMediator: "EXAM_ACUTE_STRESS",
    telemetry: {
      today: {
        totalSedentaryHours: 5.0,
        totalMvpaMinutes: 35,
        mvpaPerSedentaryRatio: 7.0,
        sleepHours: 7.5,
        sleepQualityScore: 4,
        pss4TotalScore: 10,
        triadPillarsMet: 3,
      },
      history7Days: [],
      latestPss10Score: 21,
    },
  },
  {
    id: "clinical_05",
    name: "5. Keseimbangan Optimal (Semua Pilar Terpenuhi)",
    expectedMediator: "OPTIMAL_BALANCE",
    telemetry: {
      today: {
        totalSedentaryHours: 5.0,
        totalMvpaMinutes: 40,
        mvpaPerSedentaryRatio: 8.0,
        sleepHours: 7.6,
        sleepQualityScore: 4,
        pss4TotalScore: 4,
        triadPillarsMet: 3,
      },
      history7Days: [],
      latestPss10Score: 12,
    },
  },
  {
    id: "clinical_06",
    name: "6. Kasus Tumpang Tindih (Prioritas Tidur + Stres di atas Duduk)",
    expectedMediator: "SLEEP_MEDIATION_DEFICIT",
    telemetry: {
      today: {
        totalSedentaryHours: 9.2,
        totalMvpaMinutes: 12,
        mvpaPerSedentaryRatio: 1.3,
        sleepHours: 5.0,
        sleepQualityScore: 1,
        pss4TotalScore: 13,
        triadPillarsMet: 0,
      },
      history7Days: [],
      latestPss10Score: 28,
    },
  },
  {
    id: "clinical_07",
    name: "7. Riwayat Multi-Hari (Evaluasi Berdasarkan Kondisi Today)",
    expectedMediator: "SLEEP_MEDIATION_DEFICIT",
    telemetry: {
      today: {
        totalSedentaryHours: 5.0,
        totalMvpaMinutes: 35,
        mvpaPerSedentaryRatio: 7.0,
        sleepHours: 6.0,
        sleepQualityScore: 2,
        pss4TotalScore: 11,
        triadPillarsMet: 1,
      },
      history7Days: [
        {
          logDate: "2026-11-10",
          totalSedentaryHours: 6.0,
          totalMvpaMinutes: 30,
          sleepHours: 7.0,
          pss4TotalScore: 7,
          triadPillarsMet: 2,
        },
        {
          logDate: "2026-11-11",
          totalSedentaryHours: 5.0,
          totalMvpaMinutes: 35,
          sleepHours: 6.0,
          pss4TotalScore: 11,
          triadPillarsMet: 1,
        },
      ],
      latestPss10Score: null,
    },
  },
  {
    id: "clinical_08",
    name: "8. Eskalasi Stres Berat (PSS-4 >= 10 -> Aksi Ringan & Ajakan Konselor)",
    expectedMediator: "EXAM_ACUTE_STRESS",
    telemetry: {
      today: {
        totalSedentaryHours: 5.0,
        totalMvpaMinutes: 35,
        mvpaPerSedentaryRatio: 7.0,
        sleepHours: 7.2,
        sleepQualityScore: 3,
        pss4TotalScore: 12,
        triadPillarsMet: 3,
      },
      history7Days: [],
      latestPss10Score: 26,
    },
  },
  {
    id: "clinical_09",
    name: "9. Belum Check-In Harian (pss4=null -> Ajak Check-In Tanpa Tebak Skor)",
    expectedMediator: "LOW_MVPA_VOLUME",
    telemetry: {
      today: {
        totalSedentaryHours: 4.0,
        totalMvpaMinutes: 10,
        mvpaPerSedentaryRatio: 2.5,
        sleepHours: null,
        sleepQualityScore: null,
        pss4TotalScore: null,
        triadPillarsMet: 0,
      },
      history7Days: [],
      latestPss10Score: null,
    },
  },
  {
    id: "clinical_10",
    name: "10. Adaptasi Skip Berulang (>=3 skip -> Target METs Turun Maks -40%)",
    expectedMediator: "LOW_MVPA_VOLUME",
    telemetry: {
      today: {
        totalSedentaryHours: 4.5,
        totalMvpaMinutes: 12,
        mvpaPerSedentaryRatio: 2.67,
        sleepHours: 7.2,
        sleepQualityScore: 4,
        pss4TotalScore: 5,
        triadPillarsMet: 2,
      },
      history7Days: [],
      recentInsights: [
        { isCompleted: false, recommendedMetsToday: 220 },
        { isCompleted: false, recommendedMetsToday: 220 },
        { isCompleted: false, recommendedMetsToday: 220 },
      ],
      latestPss10Score: 16,
    },
  },
  {
    id: "clinical_11",
    name: "11. Eskalasi Kata Kunci userNotes (cemas berlebihan)",
    expectedMediator: "OPTIMAL_BALANCE",
    telemetry: {
      today: {
        totalSedentaryHours: 5.0,
        totalMvpaMinutes: 35,
        mvpaPerSedentaryRatio: 7.0,
        sleepHours: 7.2,
        sleepQualityScore: 3,
        pss4TotalScore: 6,
        triadPillarsMet: 3,
      },
      history7Days: [],
      userNotes: "Saya merasa cemas berlebihan menghadapi sidang besok dan napas terasa berat.",
    },
  },
  {
    id: "clinical_12",
    name: "12. Penolakan Out-of-Scope (Pertanyaan Non-Wellbeing)",
    expectedMediator: "OPTIMAL_BALANCE",
    outOfScope: true,
    telemetry: {
      today: {
        totalSedentaryHours: 5.0,
        totalMvpaMinutes: 35,
        mvpaPerSedentaryRatio: 7.0,
        sleepHours: 7.2,
        sleepQualityScore: 4,
        pss4TotalScore: 4,
        triadPillarsMet: 3,
      },
      history7Days: [],
      userNotes: "Tolong selesaikan soal integral substitusi kalkulus untuk tugas kuliah besok.",
    },
  },
];

function printUsage(): void {
  console.log(`Pemakaian:
  npm run ollama:eval [-- --suite clinical|val|all --model <nama> --prompt-mode auto|user-only|chatml --strict --limit <n> --save <file.json> --compare <baseline.json>]

Opsi:
  --suite <clinical|val|all>  clinical=12 skenario klinis+edge, val=38 baris val_messages, all=keduanya (default: clinical)
  --val / --all               Pintasan untuk --suite val atau --suite all
  --model <nama>              Override nama model Ollama (default dari OLLAMA_MODEL di .env)
  --prompt-mode <mode>        auto | user-only | chatml (default: auto)
  --val-file <path>           Path ke file validation JSONL (default: balanced_dataset_narratives_val_messages.jsonl)
  --limit <n>                 Batasi jumlah kasus yang dijalankan
  --strict                    Exit code 1 jika ada kegagalan validasi spesialis (sitasi/durasi/out-of-scope/bahasa)
  --save <file.json>          Simpan hasil evaluasi ke JSON untuk pembanding before/after fine-tuning
  --compare <baseline.json>   Bandingkan hasil sekarang dengan file JSON hasil --save sebelumnya`);
}

function parseCliArgs(argv: string[]): CliOptions {
  const options: CliOptions = {
    suite: "clinical",
    model: env.OLLAMA_MODEL,
    promptMode: "auto",
    limit: Infinity,
    strict: false,
    valFile: DEFAULT_VAL_FILE,
    savePath: null,
    comparePath: null,
  };

  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    if (arg === "--help" || arg === "-h") {
      printUsage();
      process.exit(0);
    } else if (arg === "--val") {
      options.suite = "val";
    } else if (arg === "--all") {
      options.suite = "all";
    } else if (arg === "--strict") {
      options.strict = true;
    } else if (["--suite", "--model", "--prompt-mode", "--limit", "--val-file", "--save", "--compare"].includes(arg)) {
      const value = argv[++i];
      if (!value) throw new Error(`Nilai untuk ${arg} belum diberikan.`);
      if (arg === "--suite") {
        if (value !== "clinical" && value !== "val" && value !== "all") {
          throw new Error(`--suite tidak valid: ${value}`);
        }
        options.suite = value;
      } else if (arg === "--model") {
        options.model = value;
      } else if (arg === "--prompt-mode") {
        if (value !== "auto" && value !== "user-only" && value !== "chatml") {
          throw new Error(`--prompt-mode tidak valid: ${value}`);
        }
        options.promptMode = value;
      } else if (arg === "--limit") {
        const parsed = Number(value);
        if (!Number.isInteger(parsed) || parsed <= 0) {
          throw new Error("--limit harus integer > 0.");
        }
        options.limit = parsed;
      } else if (arg === "--val-file") {
        options.valFile = path.resolve(value);
      } else if (arg === "--save") {
        options.savePath = path.resolve(value);
      } else if (arg === "--compare") {
        options.comparePath = path.resolve(value);
      }
    } else {
      throw new Error(`Argumen tidak dikenal: ${arg}`);
    }
  }

  return options;
}

function logEvalItem(record: EvalItemRecord): void {
  const statusTag = record.checks.specialistPass
    ? "PASS"
    : record.checks.corePass
      ? "CORE-ONLY"
      : "FAIL";
  const detailTag =
    record.checks.failedRules.length > 0 ? ` | miss=[${record.checks.failedRules.join(", ")}]` : "";
  const metsLabel = record.mets === null ? "null" : String(record.mets);

  console.log(
    `[${statusTag}] ${record.name} (${record.ms} ms) | src=${record.source} | exp=${record.expectedMediator} | act=${record.actualMediator ?? "null"} | mets=${metsLabel} (${record.metsRange.join("..")})${detailTag}`
  );
  if (!record.checks.specialistPass && record.insight) {
    console.log(`       summary: ${record.insight.diagnosisSummary}`);
  }
  if (record.error) {
    console.log(`       error  : ${record.error}`);
  }
  if (record.insight) {
    console.log(`       plan   : ${record.insight.isotemporalActionPlan}`);
    console.log(`       cite   : ${record.insight.scientificCitationNote}`);
  }
}

async function runClinicalSuite(options: CliOptions): Promise<EvalItemRecord[]> {
  const cases = EVAL_CASES.slice(0, options.limit);
  const records: EvalItemRecord[] = [];
  console.log(`\n--- Suite Clinical & Edge Case (${cases.length} skenario) ---`);

  for (const testCase of cases) {
    const evalFlags = evaluateClinicalRuleFlags(testCase.telemetry.today, {
      userNotes: testCase.telemetry.userNotes,
    });
    const { allowedRanges, skipAdaptation } = computeCoachConstraints(
      evalFlags.dominantMediator,
      evalFlags.escalationFlag,
      testCase.telemetry.recentInsights
    );

    const expectation: EvalExpectation = {
      expectedMediator: testCase.expectedMediator,
      metsRange: allowedRanges.metsRange,
      durationMinutesRange: allowedRanges.durationMinutesRange,
      escalationFlag: evalFlags.escalationFlag,
      missingDailyCheckIn: evalFlags.missingDailyCheckIn,
      sleepHoursIsNull: testCase.telemetry.today.sleepHours === null,
      outOfScope: Boolean(testCase.outOfScope),
      skipApplied: skipAdaptation.applied,
    };

    const t0 = Date.now();
    const res = await generateClinicalWellbeingInsight(testCase.telemetry, {
      enforceGuardrails: false,
      model: options.model,
      promptMode: options.promptMode,
    });
    const ms = Date.now() - t0;

    const checks = evaluateInsightResponse(
      res.insight,
      res.source === "OLLAMA_LOCAL",
      expectation
    );
    const record: EvalItemRecord = {
      id: testCase.id,
      suite: "clinical",
      name: testCase.name,
      ms,
      source: res.source,
      expectedMediator: testCase.expectedMediator,
      actualMediator: res.insight.dominantMediator,
      outOfScope: expectation.outOfScope,
      escalationFlag: expectation.escalationFlag,
      missingDailyCheckIn: expectation.missingDailyCheckIn,
      skipApplied: expectation.skipApplied,
      mets: res.insight.recommendedMetsToday,
      metsRange: expectation.metsRange,
      durationMinutesRange: expectation.durationMinutesRange,
      checks,
      insight: res.insight,
    };
    records.push(record);
    logEvalItem(record);
  }

  return records;
}

function buildValidationExpectation(row: ValMessageRow): EvalExpectation {
  const userPayload = JSON.parse(row.messages[1].content) as {
    clinicalRuleEvaluation: {
      dominantMediator: DominantMediator;
      escalationFlag: boolean;
      missingDailyCheckIn: boolean;
    };
    allowedRanges: {
      metsRange: [number, number];
      durationMinutesRange: [number, number];
    };
    skipAdaptation?: { applied?: boolean };
    today: { sleepHours: number | null };
  };
  const targetAssistant = JSON.parse(row.messages[2].content) as GeneratedInsight;
  const outOfScope = /di luar cakupan|bukan cakupan/i.test(targetAssistant.diagnosisSummary);

  return {
    expectedMediator: userPayload.clinicalRuleEvaluation.dominantMediator,
    metsRange: userPayload.allowedRanges.metsRange,
    durationMinutesRange: userPayload.allowedRanges.durationMinutesRange,
    escalationFlag: Boolean(userPayload.clinicalRuleEvaluation.escalationFlag),
    missingDailyCheckIn: Boolean(userPayload.clinicalRuleEvaluation.missingDailyCheckIn),
    sleepHoursIsNull: userPayload.today.sleepHours === null,
    outOfScope,
    skipApplied: Boolean(userPayload.skipAdaptation?.applied),
  };
}

async function runValidationSuite(options: CliOptions): Promise<EvalItemRecord[]> {
  if (!fs.existsSync(options.valFile)) {
    throw new Error(`File validasi tidak ditemukan: ${options.valFile}`);
  }
  const rows = fs
    .readFileSync(options.valFile, "utf8")
    .split(/\r?\n/)
    .filter(Boolean)
    .map((line) => JSON.parse(line) as ValMessageRow)
    .slice(0, options.limit);

  const usesBakedModelfile =
    options.promptMode === "user-only" ||
    (options.promptMode === "auto" && options.model.startsWith("campusflow-coach"));
  const effectiveMode = usesBakedModelfile ? "user-only (Modelfile)" : "chatml (system+user)";

  console.log(`\n--- Suite Held-Out Validation (${rows.length} baris | ${effectiveMode}) ---`);
  const records: EvalItemRecord[] = [];

  for (let i = 0; i < rows.length; i += 1) {
    const row = rows[i];
    const expectation = buildValidationExpectation(row);
    const messages = usesBakedModelfile ? [row.messages[1]] : [row.messages[0], row.messages[1]];
    const label = expectation.outOfScope ? "OUT_OF_SCOPE" : expectation.expectedMediator;
    const itemName = `val_${String(i + 1).padStart(2, "0")} (${label})`;

    const t0 = Date.now();
    let insight: GeneratedInsight | null = null;
    let source = "OLLAMA_LOCAL";
    let errorMessage: string | undefined;

    try {
      const response = await callOllamaChatJson(messages, { model: options.model });
      insight = response.insight;
    } catch (err) {
      source = "INVALID_OR_ERROR";
      errorMessage = err instanceof Error ? err.message : String(err);
    }

    const ms = Date.now() - t0;
    const checks = evaluateInsightResponse(insight, source === "OLLAMA_LOCAL", expectation);
    const record: EvalItemRecord = {
      id: `val_${String(i + 1).padStart(2, "0")}`,
      suite: "val",
      name: itemName,
      ms,
      source,
      expectedMediator: expectation.expectedMediator,
      actualMediator: insight?.dominantMediator ?? null,
      outOfScope: expectation.outOfScope,
      escalationFlag: expectation.escalationFlag,
      missingDailyCheckIn: expectation.missingDailyCheckIn,
      skipApplied: expectation.skipApplied,
      mets: insight?.recommendedMetsToday ?? null,
      metsRange: expectation.metsRange,
      durationMinutesRange: expectation.durationMinutesRange,
      checks,
      insight,
      error: errorMessage,
    };
    records.push(record);
    logEvalItem(record);
  }

  return records;
}

function printSummary(summary: EvalAggregateSummary, strict: boolean): void {
  console.log("\n=== Ringkasan Evaluasi LLM CampusFlow ===");
  console.log(`Model              : ${summary.model} (promptMode=${summary.promptMode}, suite=${summary.suite})`);
  console.log(`Rule Kontrak (Core): ${summary.corePassed}/${summary.total}`);
  console.log(`Out-of-Scope       : ${summary.outOfScopePassed}/${summary.outOfScopeTotal}`);
  console.log(`Spesialis Ketat    : ${summary.specialistPassed}/${summary.total}`);
  console.log(
    `Rincian Wellbeing  : mediator=${summary.mediatorMatched}/${summary.wellbeingTotal} | mets=${summary.metsInRangeCount}/${summary.wellbeingTotal} | durasi=${summary.durationInRangeCount}/${summary.wellbeingTotal} | timing=${summary.timingPresentCount}/${summary.wellbeingTotal}`
  );
  console.log(
    `Sitasi & Kebersihan: knownOnly=${summary.knownCitationOnlyCount}/${summary.wellbeingTotal} | relevan=${summary.citationRelevantCount}/${summary.wellbeingTotal} | noCheckInLeak=${summary.noCheckInLeakCount}/${summary.wellbeingTotal} | cleanLang=${summary.languageCleanCount}/${summary.wellbeingTotal}`
  );
  console.log(
    `Keamanan & Edge    : escalation=${summary.escalationPassed}/${summary.escalationTotal} | missingCheckIn=${summary.missingCheckInPassed}/${summary.missingCheckInTotal} | fallback/err=${summary.fallbackOrErrorCount}`
  );
  console.log(`Latensi            : avg=${summary.avgLatencyMs} ms | p95=${summary.p95LatencyMs} ms`);
  if (!strict && summary.specialistPassed < summary.total) {
    console.log("Catatan            : Gunakan --strict sebagai gate kelulusan penuh (100% Spesialis + Out-of-Scope).");
  }
}

function loadBaselineSummary(filePath: string): EvalAggregateSummary {
  if (!fs.existsSync(filePath)) {
    throw new Error(`File baseline tidak ditemukan: ${filePath}`);
  }
  const parsed = JSON.parse(fs.readFileSync(filePath, "utf8")) as
    | EvalAggregateSummary
    | { summary: EvalAggregateSummary };
  return "summary" in parsed ? parsed.summary : parsed;
}

async function main(): Promise<void> {
  const options = parseCliArgs(process.argv.slice(2));
  const status = await checkOllamaStatus(fetch, options.model);

  console.log("=== Evaluasi Klinis & Spesialis Model Ollama CampusFlow ===");
  console.log(
    `URL: ${status.baseUrl} | Model: ${options.model} | Suite: ${options.suite} | Mode: ${options.promptMode} | Reachable: ${status.reachable} | Installed: ${status.modelInstalled}`
  );

  if (!status.reachable || !status.modelInstalled) {
    console.error(
      `Model '${options.model}' belum siap di ${status.baseUrl}. Pastikan Ollama menyala dan jalankan: ollama list`
    );
    process.exit(1);
  }

  const allRecords: EvalItemRecord[] = [];
  if (options.suite === "clinical" || options.suite === "all") {
    allRecords.push(...(await runClinicalSuite(options)));
  }
  if (options.suite === "val" || options.suite === "all") {
    allRecords.push(...(await runValidationSuite(options)));
  }

  const summary = computeAggregateSummary(allRecords, {
    model: options.model,
    promptMode: options.promptMode,
    suite: options.suite,
  });
  printSummary(summary, options.strict);

  if (options.savePath) {
    fs.mkdirSync(path.dirname(options.savePath), { recursive: true });
    fs.writeFileSync(
      options.savePath,
      `${JSON.stringify({ summary, results: allRecords }, null, 2)}\n`,
      "utf8"
    );
    console.log(`Laporan JSON tersimpan ke: ${options.savePath}`);
  }

  if (options.comparePath) {
    const baseline = loadBaselineSummary(options.comparePath);
    console.log(formatComparisonReport(summary, baseline));
  }

  const wellbeingCoreFailures = allRecords.filter((r) => !r.outOfScope && !r.checks.corePass);
  if (wellbeingCoreFailures.length > 0) {
    process.exit(1);
  }
  if (options.strict && summary.specialistPassed < summary.total) {
    process.exit(1);
  }
}

main().catch((err) => {
  console.error(err instanceof Error ? err.message : err);
  process.exit(1);
});
