import "dotenv/config";
import type { DominantMediator } from "../../shared/contracts/index.ts";
import { env } from "../src/config/env.ts";
import {
  checkOllamaStatus,
  generateClinicalWellbeingInsight,
  type Telemetry7DaysInput,
} from "../src/services/ollamaCoach.ts";

interface EvalCase {
  name: string;
  expectedMediator: DominantMediator;
  telemetry: Telemetry7DaysInput;
}

const EVAL_CASES: EvalCase[] = [
  {
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
];

async function main() {
  const status = await checkOllamaStatus();
  console.log("=== Evaluasi Klinis Model Ollama CampusFlow ===");
  console.log(
    `URL: ${status.baseUrl} | Model: ${env.OLLAMA_MODEL} | Reachable: ${status.reachable} | Installed: ${status.modelInstalled}`
  );

  if (!status.reachable || !status.modelInstalled) {
    console.error(
      `Model '${env.OLLAMA_MODEL}' belum siap. Jalankan: ollama create ${env.OLLAMA_MODEL} -f ollama/Modelfile`
    );
    process.exit(1);
  }

  let passed = 0;
  for (const testCase of EVAL_CASES) {
    const t0 = Date.now();
    const res = await generateClinicalWellbeingInsight(testCase.telemetry);
    const ms = Date.now() - t0;
    const isOllama = res.source === "OLLAMA_LOCAL";
    const exactMatch = res.insight.dominantMediator === testCase.expectedMediator;
    const ok = isOllama && exactMatch;
    if (ok) passed += 1;

    console.log(
      `[${ok ? "PASS" : "FAIL"}] ${testCase.name} (${ms} ms) | source=${res.source} | expected=${testCase.expectedMediator} | actual=${res.insight.dominantMediator}`
    );
    console.log(`       plan: ${res.insight.isotemporalActionPlan}`);
    console.log(`       cite: ${res.insight.scientificCitationNote}`);
  }

  console.log(`\nSkor Evaluasi: ${passed}/${EVAL_CASES.length} skenario klinis lolos.`);
  if (passed < EVAL_CASES.length) process.exit(1);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
