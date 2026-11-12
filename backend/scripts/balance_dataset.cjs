/**
 * balance_dataset.cjs
 * Menyeimbangkan jumlah kombinasi per dominantMediator supaya tidak timpang,
 * sebelum masuk ke Langkah C (pengisian teks naratif via LLM).
 *
 * Cara jalankan:
 *   node balance_dataset.cjs
 *
 * Input:  labeled_combos.jsonl   (hasil Langkah B)
 * Output: balanced_dataset.jsonl
 */

const fs = require("fs");
const readline = require("readline");

// Target jumlah maksimum per mediator. EXAM_ACUTE_STRESS dibiarkan
// "ambil semua yang ada" karena secara alami paling langka.
const TARGET_PER_MEDIATOR = {
  SLEEP_MEDIATION_DEFICIT: 90,
  SEDENTARY_OVERLOAD: 90,
  LOW_MVPA_VOLUME: 90,
  OPTIMAL_BALANCE: 70,
  EXAM_ACUTE_STRESS: Infinity, // ambil semua yang berhasil ditemukan
};

async function main() {
  const inputPath = "labeled_combos.jsonl";
  const outputPath = "balanced_dataset.jsonl";

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

  for await (const line of rl) {
    if (!line.trim()) continue;
    const record = JSON.parse(line);
    const mediator = record.clinicalRuleEvaluation.dominantMediator;
    if (buckets[mediator]) {
      buckets[mediator].push(record);
    }
  }

  const outStream = fs.createWriteStream(outputPath, { encoding: "utf-8" });
  let totalWritten = 0;

  console.log("Hasil setelah balancing:\n");
  for (const [mediator, target] of Object.entries(TARGET_PER_MEDIATOR)) {
    const available = buckets[mediator];
    const takeCount = Math.min(available.length, target);
    const selected = available.slice(0, takeCount);

    for (const record of selected) {
      outStream.write(JSON.stringify(record) + "\n");
    }

    totalWritten += selected.length;
    const warning = available.length < 30 ? "  <-- PERLU TAMBAH SAMPLE (kurang dari 30)" : "";
    console.log(
      `  ${mediator}: ${selected.length} dipakai (tersedia ${available.length})${warning}`
    );
  }

  outStream.end();
  console.log(`\nTotal baris final: ${totalWritten}`);
  console.log(`Ditulis ke '${outputPath}'`);
}

main();
