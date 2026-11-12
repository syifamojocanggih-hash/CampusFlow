/**
 * merge_out_of_scope.cjs
 * Menggabungkan out_of_scope_extra.jsonl ke file train/val messages yang sudah ada,
 * dengan split 90% train / 10% val (acak tapi reproducible).
 *
 * Cara jalankan (dari folder backend/scripts/):
 *   node merge_out_of_scope.cjs
 *
 * Akan MENIMPA:
 *   balanced_dataset_narratives_train_messages.jsonl
 *   balanced_dataset_narratives_val_messages.jsonl
 * (backup otomatis dibuat dulu dengan akhiran .bak)
 */

const fs = require("fs");

const TRAIN_FILE = "balanced_dataset_narratives_train_messages.jsonl";
const VAL_FILE = "balanced_dataset_narratives_val_messages.jsonl";
const EXTRA_FILE = "out_of_scope_extra.jsonl";

function readLines(path) {
  if (!fs.existsSync(path)) return [];
  return fs.readFileSync(path, "utf-8").split("\n").filter((l) => l.trim());
}

function seededShuffle(array, seed) {
  const arr = [...array];
  let s = seed;
  for (let i = arr.length - 1; i > 0; i--) {
    s = (s * 9301 + 49297) % 233280;
    const j = Math.floor((s / 233280) * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

function main() {
  if (!fs.existsSync(EXTRA_FILE)) {
    console.error(`File '${EXTRA_FILE}' tidak ditemukan. Jalankan generate_out_of_scope.cjs dulu.`);
    process.exit(1);
  }

  // Backup dulu sebelum menimpa
  if (fs.existsSync(TRAIN_FILE)) fs.copyFileSync(TRAIN_FILE, TRAIN_FILE + ".bak");
  if (fs.existsSync(VAL_FILE)) fs.copyFileSync(VAL_FILE, VAL_FILE + ".bak");
  console.log("Backup dibuat: *.bak");

  const existingTrain = readLines(TRAIN_FILE);
  const existingVal = readLines(VAL_FILE);
  const extraLines = readLines(EXTRA_FILE);

  const shuffledExtra = seededShuffle(extraLines, 42);
  const valCount = Math.round(shuffledExtra.length * 0.1) || 1;
  const newValLines = shuffledExtra.slice(0, valCount);
  const newTrainLines = shuffledExtra.slice(valCount);

  const finalTrain = [...existingTrain, ...newTrainLines];
  const finalVal = [...existingVal, ...newValLines];

  fs.writeFileSync(TRAIN_FILE, finalTrain.join("\n") + "\n", "utf-8");
  fs.writeFileSync(VAL_FILE, finalVal.join("\n") + "\n", "utf-8");

  console.log(`\nTrain: ${existingTrain.length} + ${newTrainLines.length} baru = ${finalTrain.length} baris total`);
  console.log(`Val  : ${existingVal.length} + ${newValLines.length} baru = ${finalVal.length} baris total`);
  console.log(`\nSelesai. File '${TRAIN_FILE}' dan '${VAL_FILE}' sudah diperbarui.`);
  console.log("Siap upload ulang ke Google Drive untuk retrain.");
}

main();
