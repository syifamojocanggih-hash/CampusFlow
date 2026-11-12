/**
 * test_guardrail.ts
 * Memanggil LANGSUNG fungsi generateClinicalWellbeingInsight dari ollamaCoach.ts asli
 * (bukan via HTTP eval terpisah) untuk memvalidasi bahwa guardrail sitasi baru
 * benar-benar bekerja persis seperti di produksi.
 *
 * Cara jalankan (dari folder backend/):
 *   npx tsx scripts/test_guardrail.ts
 */

import { generateClinicalWellbeingInsight } from "../src/services/ollamaCoach.ts";
import type { Telemetry7DaysInput } from "../src/services/ollamaCoach.ts";

// 5 skenario, satu per mediator, dengan data telemetri yang jelas memicu tiap mediator.
const testCases: Array<{ label: string; today: Telemetry7DaysInput["today"] }> = [
  {
    label: "SLEEP_MEDIATION_DEFICIT",
    today: {
      totalSedentaryHours: 6,
      totalMvpaMinutes: 35,
      mvpaPerSedentaryRatio: 35,
      sleepHours: 5,
      sleepQualityScore: 1,
      pss4TotalScore: 9,
      triadPillarsMet: 2,
    },
  },
  {
    label: "SEDENTARY_OVERLOAD",
    today: {
      totalSedentaryHours: 10,
      totalMvpaMinutes: 40,
      mvpaPerSedentaryRatio: 15,
      sleepHours: 7,
      sleepQualityScore: 4,
      pss4TotalScore: 5,
      triadPillarsMet: 2,
    },
  },
  {
    label: "LOW_MVPA_VOLUME",
    today: {
      totalSedentaryHours: 5,
      totalMvpaMinutes: 10,
      mvpaPerSedentaryRatio: 35,
      sleepHours: 7.5,
      sleepQualityScore: 4,
      pss4TotalScore: 4,
      triadPillarsMet: 1,
    },
  },
  {
    label: "EXAM_ACUTE_STRESS",
    today: {
      totalSedentaryHours: 5,
      totalMvpaMinutes: 35,
      mvpaPerSedentaryRatio: 35,
      sleepHours: 7.2,
      sleepQualityScore: 3,
      pss4TotalScore: 8,
      triadPillarsMet: 3,
    },
  },
  {
    label: "OPTIMAL_BALANCE",
    today: {
      totalSedentaryHours: 5,
      totalMvpaMinutes: 45,
      mvpaPerSedentaryRatio: 50,
      sleepHours: 7.6,
      sleepQualityScore: 4,
      pss4TotalScore: 3,
      triadPillarsMet: 3,
    },
  },
];

const EXPECTED_KEYWORDS: Record<string, string[]> = {
  SLEEP_MEDIATION_DEFICIT: ["Mu et al", "Wang et al"],
  SEDENTARY_OVERLOAD: ["Barbosa et al", "Su et al"],
  LOW_MVPA_VOLUME: ["Zhang et al", "Ai et al"],
  EXAM_ACUTE_STRESS: ["Wu & Zhou"],
  OPTIMAL_BALANCE: ["Martín-Rodríguez", "González-Prieto"],
};

async function main() {
  const modelName = process.env.CAMPUSFLOW_TEST_MODEL ?? "campusflow-coach-ft";
  console.log(`Menguji dengan model: ${modelName}\n`);
  console.log("=".repeat(70));

  let passCount = 0;

  for (const testCase of testCases) {
    const input: Telemetry7DaysInput = {
      today: testCase.today,
      history7Days: [],
      latestPss10Score: null,
      userNotes: null,
      recentInsights: [],
    };

    const result = await generateClinicalWellbeingInsight(input, {
      model: modelName,
      promptMode: "auto",
    });

    const expectedKeywords = EXPECTED_KEYWORDS[testCase.label] ?? [];
    const citationMatches = expectedKeywords.some((kw) =>
      result.insight.scientificCitationNote.includes(kw)
    );

    const status = citationMatches ? "PASS" : "FAIL";
    if (citationMatches) passCount += 1;

    console.log(`\n[${status}] ${testCase.label}`);
    console.log(`  dominantMediator : ${result.insight.dominantMediator}`);
    console.log(`  source           : ${result.source}`);
    console.log(`  citation         : ${result.insight.scientificCitationNote}`);
    console.log(`  recommendedMets  : ${result.insight.recommendedMetsToday}`);
  }

  console.log("\n" + "=".repeat(70));
  console.log(`\nHasil: ${passCount}/${testCases.length} sitasi relevan dengan mediator.`);
  if (passCount === testCases.length) {
    console.log("Guardrail sitasi BEKERJA SEMPURNA -- semua sitasi dipaksa benar dari kode.");
  } else {
    console.log("Ada yang tidak sesuai -- cek apakah perubahan ollamaCoach.ts sudah tersimpan dengan benar.");
  }
}

main().catch((err) => {
  console.error("Error menjalankan test:", err);
  process.exit(1);
});
