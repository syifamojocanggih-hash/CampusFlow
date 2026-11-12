/**
 * label_combos.js
 * Langkah B — Jalankan tiap baris combos.jsonl lewat logika rule engine ASLI
 * CampusFlow (disalin persis dari evaluateClinicalRuleFlags & computeCoachConstraints
 * di backend/src/services/ollamaCoach.ts) supaya dominantMediator, allowedRanges,
 * dan rule flags akurat 100% sama dengan sistem produksi.
 *
 * Cara jalankan (dari folder backend/scripts/):
 *   node label_combos.js
 *
 * Input:  combos.jsonl        (hasil Langkah A)
 * Output: labeled_combos.jsonl
 */

const fs = require("fs");
const readline = require("readline");

// ======================================================
// DISALIN PERSIS dari ollamaCoach.ts — JANGAN ubah logikanya.
// Kalau file ollamaCoach.ts berubah, update juga bagian ini.
// ======================================================

const MEDIATOR_BASE_RANGES = {
  SLEEP_MEDIATION_DEFICIT: { durationMinutesRange: [15, 30], metsRange: [180, 260] },
  SEDENTARY_OVERLOAD: { durationMinutesRange: [10, 20], metsRange: [170, 240] },
  LOW_MVPA_VOLUME: { durationMinutesRange: [15, 25], metsRange: [160, 220] },
  EXAM_ACUTE_STRESS: { durationMinutesRange: [10, 20], metsRange: [150, 200] },
  OPTIMAL_BALANCE: { durationMinutesRange: [10, 20], metsRange: [200, 260] },
};

const EMERGENCY_DISTRESS_KEYWORDS = [
  "cemas berlebihan",
  "putus asa",
  "tidak sanggup",
  "ga sanggup",
  "gak sanggup",
  "panik berat",
  "menyerah",
  "bunuh diri",
  "menyakiti diri",
];

function detectDistressKeywords(userNotes) {
  if (!userNotes) return false;
  const normalized = userNotes.toLowerCase();
  return EMERGENCY_DISTRESS_KEYWORDS.some((keyword) => normalized.includes(keyword));
}

function evaluateClinicalRuleFlags(today, options) {
  options = options || {};
  const missingDailyCheckIn = today.pss4TotalScore === null;

  const sleepDeficit =
    !missingDailyCheckIn &&
    today.pss4TotalScore !== null &&
    ((today.sleepHours !== null && today.sleepHours < 7.0) ||
      (today.sleepQualityScore !== null && today.sleepQualityScore <= 2)) &&
    today.pss4TotalScore >= 8;

  const sedentaryOverload =
    today.totalSedentaryHours >= 9.0 ||
    (today.totalSedentaryHours > 6 && today.mvpaPerSedentaryRatio < 25);

  const lowMvpaVolume = missingDailyCheckIn
    ? today.totalMvpaMinutes < 30
    : today.totalMvpaMinutes < 30 || today.triadPillarsMet === 0;

  const examAcuteStress =
    !missingDailyCheckIn && today.pss4TotalScore !== null && today.pss4TotalScore >= 8;

  const flags = [];
  if (sleepDeficit) flags.push("SLEEP_MEDIATION_DEFICIT");
  if (sedentaryOverload) flags.push("SEDENTARY_OVERLOAD");
  if (lowMvpaVolume) flags.push("LOW_MVPA_VOLUME");
  if (examAcuteStress && !sleepDeficit && !sedentaryOverload && !lowMvpaVolume) {
    flags.push("EXAM_ACUTE_STRESS");
  }

  let dominantMediator = "OPTIMAL_BALANCE";
  if (sleepDeficit) {
    dominantMediator = "SLEEP_MEDIATION_DEFICIT";
  } else if (sedentaryOverload) {
    dominantMediator = "SEDENTARY_OVERLOAD";
  } else if (lowMvpaVolume) {
    dominantMediator = "LOW_MVPA_VOLUME";
  } else if (examAcuteStress) {
    dominantMediator = "EXAM_ACUTE_STRESS";
  }

  const escalationFlag =
    (today.pss4TotalScore !== null && today.pss4TotalScore >= 10) ||
    detectDistressKeywords(options.userNotes);

  return {
    sleepDeficit,
    sedentaryOverload,
    lowMvpaVolume,
    examAcuteStress,
    flags,
    dominantMediator,
    priorityMediator: dominantMediator,
    escalationFlag,
    missingDailyCheckIn,
  };
}

function computeCoachConstraints(mediator, escalationFlag, recentInsights) {
  recentInsights = recentInsights || [];

  let allowedRanges = escalationFlag
    ? { durationMinutesRange: [5, 15], metsRange: [80, 160] }
    : {
        durationMinutesRange: [...MEDIATOR_BASE_RANGES[mediator].durationMinutesRange],
        metsRange: [...MEDIATOR_BASE_RANGES[mediator].metsRange],
      };

  let consecutiveSkips = 0;
  for (const item of recentInsights) {
    if (item.isCompleted) break;
    consecutiveSkips += 1;
  }

  const latestPrevMets = recentInsights[0] && recentInsights[0].recommendedMetsToday;
  const previousRecommendedMets =
    typeof latestPrevMets === "number" && Number.isFinite(latestPrevMets) ? latestPrevMets : null;

  if (consecutiveSkips < 2) {
    return {
      allowedRanges,
      skipAdaptation: { applied: false, consecutiveSkips, previousRecommendedMets },
    };
  }

  const baseMidMets = Math.round((allowedRanges.metsRange[0] + allowedRanges.metsRange[1]) / 2);
  const referenceMets = previousRecommendedMets !== null ? previousRecommendedMets : baseMidMets;
  const dropRatio = Math.min(0.4, 0.15 + (consecutiveSkips - 2) * 0.1);
  const minMetsFloor = Math.max(60, Math.round(referenceMets * 0.6));
  const targetCeiling = Math.max(minMetsFloor + 20, Math.round(referenceMets * (1 - dropRatio)));

  const minDur = Math.max(5, Math.round(allowedRanges.durationMinutesRange[0] * 0.6));
  const maxDur = Math.max(minDur + 4, Math.round(allowedRanges.durationMinutesRange[1] * 0.75));

  allowedRanges = {
    durationMinutesRange: [minDur, maxDur],
    metsRange: [
      Math.min(allowedRanges.metsRange[0], minMetsFloor),
      Math.max(minMetsFloor + 15, Math.min(allowedRanges.metsRange[1], targetCeiling)),
    ],
  };

  return {
    allowedRanges,
    skipAdaptation: {
      applied: true,
      consecutiveSkips,
      previousRecommendedMets: referenceMets,
    },
  };
}

// ======================================================
// Proses utama: baca combos.jsonl baris per baris, label, tulis output
// ======================================================

async function main() {
  const inputPath = "combos.jsonl";
  const outputPath = "labeled_combos.jsonl";

  if (!fs.existsSync(inputPath)) {
    console.error(`File '${inputPath}' tidak ditemukan. Jalankan generate_combos.py dulu.`);
    process.exit(1);
  }

  const rl = readline.createInterface({
    input: fs.createReadStream(inputPath),
    crlfDelay: Infinity,
  });

  const outStream = fs.createWriteStream(outputPath, { encoding: "utf-8" });
  const mediatorCount = {};
  let total = 0;
  let escalationCount = 0;
  let missingCheckInCount = 0;

  for await (const line of rl) {
    if (!line.trim()) continue;
    const combo = JSON.parse(line);
    const today = combo.telemetry;

    const evaluation = evaluateClinicalRuleFlags(today, { userNotes: null });
    const { allowedRanges, skipAdaptation } = computeCoachConstraints(
      evaluation.dominantMediator,
      evaluation.escalationFlag,
      []
    );

    const labeled = {
      id: combo.id,
      telemetry: today,
      clinicalRuleEvaluation: {
        dominantMediator: evaluation.dominantMediator,
        priorityMediator: evaluation.priorityMediator,
        flags: evaluation.flags,
        escalationFlag: evaluation.escalationFlag,
        missingDailyCheckIn: evaluation.missingDailyCheckIn,
      },
      allowedRanges,
      skipAdaptation,
    };

    outStream.write(JSON.stringify(labeled) + "\n");

    total += 1;
    mediatorCount[evaluation.dominantMediator] = (mediatorCount[evaluation.dominantMediator] || 0) + 1;
    if (evaluation.escalationFlag) escalationCount += 1;
    if (evaluation.missingDailyCheckIn) missingCheckInCount += 1;
  }

  outStream.end();

  console.log(`Selesai. ${total} baris diberi label, ditulis ke '${outputPath}'`);
  console.log("\nDistribusi dominantMediator:");
  for (const [mediator, count] of Object.entries(mediatorCount)) {
    console.log(`  ${mediator}: ${count}`);
  }
  console.log(`\nKasus escalationFlag=true: ${escalationCount}`);
  console.log(`Kasus missingDailyCheckIn=true: ${missingCheckInCount}`);
}

main();