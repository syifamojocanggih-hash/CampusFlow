/**
 * balance_dataset.cjs
 * Menyeimbangkan jumlah kombinasi per dominantMediator sekaligus menjamin cakupan
 * skenario edge case (escalationFlag, missingDailyCheckIn, skipAdaptation, out_of_scope).
 *
 * Cara jalankan:
 *   node backend/scripts/balance_dataset.cjs
 *
 * Input:  backend/scripts/labeled_combos.jsonl
 * Output: backend/scripts/balanced_dataset.jsonl
 */

const fs = require("fs");
const path = require("path");
const readline = require("readline");

const TARGET_PER_MEDIATOR = {
  SLEEP_MEDIATION_DEFICIT: 85,
  SEDENTARY_OVERLOAD: 85,
  LOW_MVPA_VOLUME: 85,
  EXAM_ACUTE_STRESS: 70,
  OPTIMAL_BALANCE: 60,
};

function selectStratified(rows, targetCount) {
  if (rows.length <= targetCount) return rows;

  const picked = [];
  const used = new Set();

  const takeMatching = (predicate, cap) => {
    let taken = 0;
    for (const r of rows) {
      if (used.has(r.id) || taken >= cap || picked.length >= targetCount) continue;
      if (predicate(r)) {
        used.add(r.id);
        picked.push(r);
        taken += 1;
      }
    }
  };

  // Prioritaskan cakupan edge case penting di setiap mediator
  takeMatching((r) => Boolean(r.skipAdaptation && r.skipAdaptation.applied), Math.ceil(targetCount * 0.2));
  takeMatching((r) => Boolean(r.userNotes), Math.ceil(targetCount * 0.15));
  takeMatching((r) => Boolean(r.clinicalRuleEvaluation.missingDailyCheckIn), Math.ceil(targetCount * 0.18));
  takeMatching((r) => Boolean(r.clinicalRuleEvaluation.escalationFlag), Math.ceil(targetCount * 0.25));

  for (const r of rows) {
    if (picked.length >= targetCount) break;
    if (!used.has(r.id)) {
      used.add(r.id);
      picked.push(r);
    }
  }

  return picked;
}

async function main() {
  const inputPath = path.join(__dirname, "labeled_combos.jsonl");
  const outputPath = path.join(__dirname, "balanced_dataset.jsonl");

  if (!fs.existsSync(inputPath)) {
    console.error(`File '${inputPath}' tidak ditemukan. Jalankan label_combos.cjs dulu.`);
    process.exit(1);
  }

  const rl = readline.createInterface({
    input: fs.createReadStream(inputPath),
    crlfDelay: Infinity,
  });

  const buckets = {};
  for (const mediator of Object.keys(TARGET_PER_MEDIATOR)) {
    buckets[mediator] = [];
  }
  const outOfScopeRows = [];

  for await (const line of rl) {
    if (!line.trim()) continue;
    const record = JSON.parse(line);
    if (record.scenarioType === "out_of_scope") {
      outOfScopeRows.push(record);
      continue;
    }
    const mediator = record.clinicalRuleEvaluation.dominantMediator;
    if (buckets[mediator]) {
      buckets[mediator].push(record);
    }
  }

  const outStream = fs.createWriteStream(outputPath, { encoding: "utf-8" });
  let totalWritten = 0;

  console.log("Hasil setelah stratified balancing:\n");
  for (const [mediator, target] of Object.entries(TARGET_PER_MEDIATOR)) {
    const available = buckets[mediator];
    const selected = selectStratified(available, target);

    for (const record of selected) {
      outStream.write(JSON.stringify(record) + "\n");
    }

    totalWritten += selected.length;
    const warning = selected.length < 30 ? "  <-- PERLU TAMBAH SAMPLE (kurang dari 30)" : "";
    console.log(
      `  ${mediator}: ${selected.length} dipakai (tersedia ${available.length})${warning}`
    );
  }

  for (const row of outOfScopeRows) {
    outStream.write(JSON.stringify(row) + "\n");
    totalWritten += 1;
  }
  console.log(`  OUT_OF_SCOPE: ${outOfScopeRows.length} dipakai`);

  await new Promise((resolve) => outStream.end(resolve));
  console.log(`\nTotal baris final: ${totalWritten}`);
  console.log(`Ditulis ke '${outputPath}'`);
}

main();
