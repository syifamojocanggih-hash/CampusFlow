import "dotenv/config";
import type { DominantMediator } from "../../shared/contracts/index.ts";
import { env } from "../src/config/env.ts";
import {
  checkOllamaStatus,
  computeCoachConstraints,
  evaluateClinicalRuleFlags,
  generateClinicalWellbeingInsight,
  type Telemetry7DaysInput,
} from "../src/services/ollamaCoach.ts";

interface EvalCase {
  name: string;
  expectedMediator: DominantMediator;
  expectCounselorNote?: boolean;
  expectCheckInNote?: boolean;
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
  {
    name: "8. Eskalasi Stres Berat (PSS-4 >= 10 -> Aksi Ringan & Ajakan Konselor)",
    expectedMediator: "EXAM_ACUTE_STRESS",
    expectCounselorNote: true,
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
    name: "9. Belum Check-In Harian (pss4=null -> Ajak Check-In Tanpa Tebak Skor)",
    expectedMediator: "LOW_MVPA_VOLUME",
    expectCheckInNote: true,
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
    // Uji model mentah tanpa guardrail post-processing agar kualitas prompt & Modelfile terukur jujur
    const res = await generateClinicalWellbeingInsight(testCase.telemetry, {
      enforceGuardrails: false,
    });
    const ms = Date.now() - t0;

    const evalFlags = evaluateClinicalRuleFlags(testCase.telemetry.today, {
      userNotes: testCase.telemetry.userNotes,
    });
    const { allowedRanges } = computeCoachConstraints(
      evalFlags.dominantMediator,
      evalFlags.escalationFlag,
      testCase.telemetry.recentInsights
    );

    const isOllama = res.source === "OLLAMA_LOCAL";
    const exactMatch = res.insight.dominantMediator === testCase.expectedMediator;
    const metsInRange =
      res.insight.recommendedMetsToday >= allowedRanges.metsRange[0] &&
      res.insight.recommendedMetsToday <= allowedRanges.metsRange[1];
    const counselorOk = testCase.expectCounselorNote
      ? /konselor|layanan kesehatan mental|cerita|psikolog/i.test(res.insight.diagnosisSummary) &&
        !/lari kencang|sprint|hiit|intensitas tinggi/i.test(res.insight.isotemporalActionPlan)
      : true;
    const checkInOk = testCase.expectCheckInNote
      ? /check-in|kuesioner/i.test(res.insight.diagnosisSummary)
      : true;

    const ok = isOllama && exactMatch && metsInRange && counselorOk && checkInOk;
    if (ok) passed += 1;

    console.log(
      `[${ok ? "PASS" : "FAIL"}] ${testCase.name} (${ms} ms) | source=${res.source} | expected=${testCase.expectedMediator} | actual=${res.insight.dominantMediator} | mets=${res.insight.recommendedMetsToday} (${allowedRanges.metsRange.join("..")})`
    );
    if (!ok) {
      console.log(
        `       detail: exactMatch=${exactMatch}, metsInRange=${metsInRange}, counselorOk=${counselorOk}, checkInOk=${checkInOk}`
      );
      console.log(`       summary: ${res.insight.diagnosisSummary}`);
    }
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
