const fs = require("node:fs");
const path = require("node:path");
const { FEW_SHOT_EXAMPLES, OUT_OF_SCOPE_TEMPLATE, CITATION_BANK } = require("./few_shot_examples.cjs");

const DEFAULT_INPUT = path.join(__dirname, "balanced_dataset.jsonl");
const DEFAULT_OUTPUT = path.join(__dirname, "balanced_dataset_narratives.jsonl");
const MEDIATORS = Object.keys(CITATION_BANK).filter((key) => key !== "OUT_OF_SCOPE");
const OUTPUT_SCHEMA = {
  type: "object",
  properties: {
    dominantMediator: { type: "string", enum: MEDIATORS },
    diagnosisSummary: { type: "string" },
    isotemporalActionPlan: { type: "string" },
    recommendedMetsToday: { type: "integer" },
    scientificCitationNote: { type: "string" },
  },
  required: [
    "dominantMediator",
    "diagnosisSummary",
    "isotemporalActionPlan",
    "recommendedMetsToday",
    "scientificCitationNote",
  ],
};

const TRAINING_SYSTEM_PROMPT =
  "Kamu adalah CampusFlow AI Coach: asisten kesehatan mental-fisik mahasiswa Indonesia berbasis Martín-Rodríguez & González-Prieto (2026). Tugasmu HANYA menyusun narasi empatik non-diagnostik dan rencana aksi dari data input, bukan mengambil keputusan klinis. Salin dominantMediator persis dari clinicalRuleEvaluation, jaga recommendedMetsToday dan durasi menit di dalam allowedRanges, patuhi activeDirectives (eskalasi menyebut konselor kampus dengan aksi ringan; missingDailyCheckIn mengajak check-in harian tanpa menebak tidur/stres; skipAdaptation menurunkan target secara wajar), pilih sitasi tervalidasi tanpa mengarang angka baru, dan tolak input non-wellbeing dengan template out-of-scope baku.";

const NARRATIVE_GEN_SYSTEM =
  "Kamu menyusun narasi CampusFlow Coach dalam Bahasa Indonesia yang hangat, empatik, dan tidak menghakimi. Rule engine sudah memutuskan dominantMediator dan allowedRanges: dilarang mengubah dominantMediator, dilarang mendiagnosis gangguan psikiatris, dan dilarang menulis frasa penolakan 'di luar cakupan'. Keluarkan tepat 5 field JSON sesuai skema. recommendedMetsToday harus integer dalam metsRange; durasi aksi di isotemporalActionPlan harus menyebut angka '... menit' dalam durationMinutesRange serta waktu ('sekarang', 'sore ini', atau 'sebelum tidur'). Patuhi activeDirectives: bila escalationFlag true sarankan hanya relaksasi/gerak ringan dan ajak halus bicara ke 'konselor kampus'; bila missingDailyCheckIn true jangan menebak kondisi tidur atau stres dan ajak mengisi 'check-in harian'. Pilih scientificCitationNote persis dari salah satu opsi untuk mediator terkait.";

const OUT_OF_SCOPE_LEAK_RE = /di luar cakupan|bukan cakupan/i;
const TIMING_RE = /\b(sekarang|sore ini|sebelum tidur)\b/i;
const HEAVY_EXERCISE_RE = /\b(hiit|sprint|lari kencang|angkat beban berat|intensitas tinggi)\b/i;

function parseArgs(argv) {
  const options = {
    input: DEFAULT_INPUT,
    output: DEFAULT_OUTPUT,
    model: process.env.CAMPUSFLOW_NARRATIVE_MODEL || "qwen2.5:3b",
    baseUrl: process.env.OLLAMA_BASE_URL || "http://localhost:11434",
    limit: Infinity,
    start: 0,
    validateOnly: false,
    resume: false,
    exportTraining: false,
  };
  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    if (arg === "--validate-only") options.validateOnly = true;
    else if (arg === "--resume") options.resume = true;
    else if (arg === "--export-training") options.exportTraining = true;
    else if (["--input", "--output", "--model", "--base-url", "--limit", "--start"].includes(arg)) {
      const value = argv[++i];
      if (!value) throw new Error(`Nilai untuk ${arg} belum diberikan.`);
      const key = {
        "--input": "input",
        "--output": "output",
        "--model": "model",
        "--base-url": "baseUrl",
        "--limit": "limit",
        "--start": "start",
      }[arg];
      options[key] = ["limit", "start"].includes(key) ? Number(value) : value;
    } else throw new Error(`Argumen tidak dikenal: ${arg}`);
  }
  if (!Number.isInteger(options.start) || options.start < 0 || !(options.limit > 0)) {
    throw new Error("--start harus >= 0 dan --limit harus > 0.");
  }
  return options;
}

function readJsonl(filePath) {
  return fs
    .readFileSync(filePath, "utf8")
    .split(/\r?\n/)
    .filter(Boolean)
    .map((line, index) => {
      try {
        return JSON.parse(line);
      } catch (error) {
        throw new Error(`${filePath}:${index + 1} bukan JSON yang valid: ${error.message}`);
      }
    });
}

function validateInput(row, index) {
  if (row.scenarioType === "out_of_scope") {
    if (typeof row.userNotes !== "string" || row.userNotes.trim().length < 5) {
      throw new Error(`Baris ${index + 1}: out_of_scope wajib memiliki userNotes.`);
    }
    return;
  }
  const mediator = row.clinicalRuleEvaluation?.dominantMediator;
  if (!MEDIATORS.includes(mediator)) {
    throw new Error(`Baris ${index + 1}: mediator tidak valid (${mediator}).`);
  }
  const { durationMinutesRange, metsRange } = row.allowedRanges || {};
  if (
    !Array.isArray(durationMinutesRange) ||
    durationMinutesRange.length !== 2 ||
    !Array.isArray(metsRange) ||
    metsRange.length !== 2
  ) {
    throw new Error(`Baris ${index + 1}: allowedRanges tidak lengkap.`);
  }
  if (!row.telemetry || !row.skipAdaptation || !row.clinicalRuleEvaluation) {
    throw new Error(`Baris ${index + 1}: kolom input rule engine tidak lengkap.`);
  }
}

function validateOutput(result, row, index) {
  if (row.scenarioType === "out_of_scope") {
    if (result.diagnosisSummary !== OUT_OF_SCOPE_TEMPLATE.diagnosisSummary) {
      throw new Error(`Baris ${index + 1}: out_of_scope wajib memakai diagnosisSummary baku.`);
    }
    return result;
  }

  const mediator = row.clinicalRuleEvaluation.dominantMediator;
  if (!result || result.dominantMediator !== mediator) {
    throw new Error(`Baris ${index + 1}: dominantMediator menyimpang dari rule engine.`);
  }
  for (const key of ["diagnosisSummary", "isotemporalActionPlan", "scientificCitationNote"]) {
    if (typeof result[key] !== "string" || result[key].trim().length < 10) {
      throw new Error(`Baris ${index + 1}: ${key} kosong/tidak valid.`);
    }
  }
  if (OUT_OF_SCOPE_LEAK_RE.test(`${result.diagnosisSummary} ${result.isotemporalActionPlan}`)) {
    throw new Error(`Baris ${index + 1}: kalimat penolakan 'di luar cakupan' bocor ke data valid.`);
  }
  const [metsMin, metsMax] = row.allowedRanges.metsRange;
  if (
    !Number.isInteger(result.recommendedMetsToday) ||
    result.recommendedMetsToday < metsMin ||
    result.recommendedMetsToday > metsMax
  ) {
    throw new Error(`Baris ${index + 1}: recommendedMetsToday keluar dari rentang ${metsMin}-${metsMax}.`);
  }
  const duration = result.isotemporalActionPlan.match(/\b(\d+)\s*menit\b/i);
  const [durationMin, durationMax] = row.allowedRanges.durationMinutesRange;
  if (!duration || Number(duration[1]) < durationMin || Number(duration[1]) > durationMax) {
    throw new Error(`Baris ${index + 1}: durasi harus berada dalam rentang ${durationMin}-${durationMax} menit.`);
  }
  if (!TIMING_RE.test(result.isotemporalActionPlan)) {
    throw new Error(`Baris ${index + 1}: isotemporalActionPlan wajib memuat waktu (sekarang/sore ini/sebelum tidur).`);
  }
  if (row.clinicalRuleEvaluation.escalationFlag && !/konselor kampus/i.test(result.diagnosisSummary)) {
    throw new Error(`Baris ${index + 1}: narasi eskalasi wajib menyebut konselor kampus.`);
  }
  if (row.clinicalRuleEvaluation.escalationFlag && HEAVY_EXERCISE_RE.test(result.isotemporalActionPlan)) {
    throw new Error(`Baris ${index + 1}: aksi eskalasi terlalu berat.`);
  }
  if (row.clinicalRuleEvaluation.missingDailyCheckIn) {
    if (!/check-in harian/i.test(result.diagnosisSummary)) {
      throw new Error(`Baris ${index + 1}: ajakan check-in harian tidak ada.`);
    }
    if (
      row.telemetry.sleepHours === null &&
      /\btidur|\bsemalam\b/i.test(result.diagnosisSummary)
    ) {
      throw new Error(`Baris ${index + 1}: narasi menyebut tidur saat sleepHours null.`);
    }
  } else if (/check-in harian/i.test(result.diagnosisSummary)) {
    throw new Error(`Baris ${index + 1}: ajakan check-in harian bocor saat missingDailyCheckIn false.`);
  }
  if (!CITATION_BANK[mediator].includes(result.scientificCitationNote)) {
    throw new Error(`Baris ${index + 1}: sitasi bukan anggota bank tetap mediator ${mediator}.`);
  }
  return result;
}

function enforceRules(result, row, index = 0) {
  if (row.scenarioType === "out_of_scope") {
    return { ...OUT_OF_SCOPE_TEMPLATE };
  }

  const mediator = row.clinicalRuleEvaluation.dominantMediator;
  const output = { ...result, dominantMediator: mediator };
  const [durationMin, durationMax] = row.allowedRanges.durationMinutesRange;
  const suggestedDuration = Math.round((durationMin + durationMax) / 2);

  if (OUT_OF_SCOPE_LEAK_RE.test(output.diagnosisSummary || "")) {
    output.diagnosisSummary = "";
  }

  const duration = output.isotemporalActionPlan?.match(/\b(\d+)\s*menit\b/i);
  if (
    !duration ||
    Number(duration[1]) < durationMin ||
    Number(duration[1]) > durationMax ||
    OUT_OF_SCOPE_LEAK_RE.test(output.isotemporalActionPlan || "")
  ) {
    output.isotemporalActionPlan = `Lakukan peregangan santai selama ${suggestedDuration} menit sekarang, dengan tempo yang terasa nyaman.`;
  } else if (!TIMING_RE.test(output.isotemporalActionPlan)) {
    output.isotemporalActionPlan = `${output.isotemporalActionPlan.replace(/\.$/, "")} sekarang.`;
  }

  if (row.clinicalRuleEvaluation.escalationFlag) {
    if (!output.diagnosisSummary) {
      output.diagnosisSummary = "Sepertinya beban yang kamu rasakan cukup berat hari ini.";
    }
    if (!/konselor kampus/i.test(output.diagnosisSummary)) {
      output.diagnosisSummary = `${output.diagnosisSummary} Kalau terasa terus menumpuk, nggak apa-apa cerita ke konselor kampus.`;
    }
    if (HEAVY_EXERCISE_RE.test(output.isotemporalActionPlan)) {
      output.isotemporalActionPlan = `Duduk dengan nyaman dan lakukan napas perlahan selama ${durationMin} menit sekarang untuk memberi tubuh jeda.`;
    }
  }

  if (row.clinicalRuleEvaluation.missingDailyCheckIn) {
    if (
      !output.diagnosisSummary ||
      (row.telemetry.sleepHours === null && /\btidur|\bsemalam\b/i.test(output.diagnosisSummary))
    ) {
      output.diagnosisSummary =
        row.telemetry.totalMvpaMinutes < 30
          ? `Gerak aktifmu yang tercatat hari ini baru ${row.telemetry.totalMvpaMinutes} menit.`
          : "Pola duduk dan gerakmu hari ini sudah tercatat.";
    }
    if (!/check-in harian/i.test(output.diagnosisSummary)) {
      output.diagnosisSummary = `${output.diagnosisSummary} Jangan lupa lengkapi check-in harian di aplikasi ya supaya rekomendasinya makin pas.`;
    }
  } else if (output.diagnosisSummary && /check-in harian/i.test(output.diagnosisSummary)) {
    output.diagnosisSummary = output.diagnosisSummary
      .replace(/[^.!?]*check-in harian[^.!?]*[.!?]?/gi, "")
      .replace(/\s+/g, " ")
      .trim();
  }

  if (!output.diagnosisSummary || output.diagnosisSummary.trim().length < 10) {
    output.diagnosisSummary = "Tubuhmu perlu perhatian kecil hari ini untuk menjaga ritme kuliah tetap nyaman.";
  }

  const [metsMin, metsMax] = row.allowedRanges.metsRange;
  const rawMets = Number(output.recommendedMetsToday);
  if (Number.isInteger(rawMets) && rawMets >= metsMin && rawMets <= metsMax) {
    output.recommendedMetsToday = rawMets;
  } else {
    // Variasikan target di dalam rentang supaya dataset tidak monoton
    const span = Math.max(1, metsMax - metsMin);
    const step = (index * 13) % span;
    output.recommendedMetsToday = metsMin + step;
  }

  const variants = CITATION_BANK[mediator];
  if (!variants.includes(output.scientificCitationNote)) {
    output.scientificCitationNote = variants[index % variants.length];
  }
  return output;
}

function toCoachInput(row) {
  return {
    activeDirectives: row.activeDirectives || [],
    clinicalRuleEvaluation: row.clinicalRuleEvaluation,
    allowedRanges: row.allowedRanges,
    skipAdaptation: row.skipAdaptation,
    today: row.telemetry,
    userNotes: row.userNotes ?? null,
  };
}

function toTrainingRecord(row) {
  const { dominantMediator, diagnosisSummary, isotemporalActionPlan, recommendedMetsToday, scientificCitationNote } =
    row;
  return {
    messages: [
      { role: "system", content: TRAINING_SYSTEM_PROMPT },
      { role: "user", content: JSON.stringify(toCoachInput(row)) },
      {
        role: "assistant",
        content: JSON.stringify({
          dominantMediator,
          diagnosisSummary,
          isotemporalActionPlan,
          recommendedMetsToday,
          scientificCitationNote,
        }),
      },
    ],
  };
}

function exportTrainingSplits(sourceJsonlPath) {
  const rows = readJsonl(sourceJsonlPath);
  const byGroup = {};
  for (const row of rows) {
    const key = row.scenarioType === "out_of_scope" ? "OUT_OF_SCOPE" : row.clinicalRuleEvaluation.dominantMediator;
    if (!byGroup[key]) byGroup[key] = [];
    byGroup[key].push(row);
  }

  const trainRows = [];
  const valRows = [];
  for (const groupRows of Object.values(byGroup)) {
    groupRows.forEach((row, idx) => {
      if (groupRows.length >= 5 && idx % 10 === 9) {
        valRows.push(toTrainingRecord(row));
      } else {
        trainRows.push(toTrainingRecord(row));
      }
    });
  }

  const base = sourceJsonlPath.replace(/\.jsonl$/i, "");
  const trainPath = `${base}_train_messages.jsonl`;
  const valPath = `${base}_val_messages.jsonl`;
  fs.writeFileSync(trainPath, trainRows.map((r) => JSON.stringify(r)).join("\n") + "\n", "utf8");
  fs.writeFileSync(valPath, valRows.map((r) => JSON.stringify(r)).join("\n") + "\n", "utf8");
  return { trainPath, valPath, trainCount: trainRows.length, valCount: valRows.length };
}

async function ollamaChat(baseUrl, model, messages) {
  const response = await fetch(`${baseUrl.replace(/\/$/, "")}/api/chat`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      model,
      messages,
      stream: false,
      format: OUTPUT_SCHEMA,
      options: {
        temperature: 0.15,
        top_p: 0.9,
        repeat_penalty: 1.15,
        num_predict: Number(process.env.CAMPUSFLOW_NARRATIVE_MAX_TOKENS) || 320,
        num_ctx: Number(process.env.CAMPUSFLOW_NARRATIVE_NUM_CTX) || 4096,
      },
    }),
    signal: AbortSignal.timeout(Number(process.env.CAMPUSFLOW_NARRATIVE_TIMEOUT_MS) || 120000),
  });
  if (!response.ok) throw new Error(`Ollama HTTP ${response.status}: ${await response.text()}`);
  const payload = await response.json();
  try {
    return JSON.parse(payload.message.content);
  } catch (error) {
    throw new Error(`Respons Ollama bukan JSON valid: ${error.message}`);
  }
}

function selectRelevantFewShots(row) {
  const byName = new Map(FEW_SHOT_EXAMPLES.map((ex) => [ex.name, ex]));
  const picked = [];
  const add = (name) => {
    const found = byName.get(name);
    if (found && !picked.includes(found)) picked.push(found);
  };

  add(row.clinicalRuleEvaluation.dominantMediator.toLowerCase());
  if (row.clinicalRuleEvaluation.escalationFlag) add("escalation");
  if (row.clinicalRuleEvaluation.missingDailyCheckIn) add("missing_daily_check_in");
  if (row.skipAdaptation && row.skipAdaptation.applied) add("skip_adaptation");
  return picked.slice(0, 3);
}

async function assertModelAvailable(baseUrl, model) {
  let response;
  try {
    response = await fetch(`${baseUrl.replace(/\/$/, "")}/api/tags`);
  } catch {
    throw new Error(`Ollama tidak dapat dijangkau di ${baseUrl}. Jalankan Ollama, lalu pastikan model ${model} tersedia.`);
  }
  if (!response.ok) throw new Error(`Ollama /api/tags mengembalikan HTTP ${response.status}.`);
  const { models = [] } = await response.json();
  if (!models.some((entry) => entry.name === model || entry.name.startsWith(`${model}:`))) {
    throw new Error(`Model ${model} belum tersedia di Ollama. Jalankan: ollama pull ${model}`);
  }
}

async function generateOne(row, index, options) {
  if (row.scenarioType === "out_of_scope") {
    return validateOutput({ ...OUT_OF_SCOPE_TEMPLATE }, row, index);
  }

  const input = toCoachInput(row);
  const fewShot = selectRelevantFewShots(row)
    .map(({ input: exampleInput, output }) => JSON.stringify({ input: exampleInput, output }))
    .join("\n");

  const maxAttempts = 3;
  let lastError;
  for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
    try {
      const draft = await ollamaChat(options.baseUrl, options.model, [
        { role: "system", content: NARRATIVE_GEN_SYSTEM },
        {
          role: "user",
          content: `Contoh input dan output:\n${fewShot}\n\nBuat narasi alami dan bervariasi untuk data berikut. Keluarkan JSON saja.\n${JSON.stringify(
            input
          )}`,
        },
      ]);

      const citationOptions = CITATION_BANK[row.clinicalRuleEvaluation.dominantMediator];
      const preferredCitation = citationOptions[index % citationOptions.length];
      const reviewed = await ollamaChat(options.baseUrl, options.model, [
        {
          role: "system",
          content: `${NARRATIVE_GEN_SYSTEM} Lakukan self-critique: periksa kesetiaan mediator, angka dalam allowedRanges, aturan activeDirectives, dilarang mengarang tidur jika sleepHours null, dan gunakan sitasi persis ini: "${preferredCitation}". Keluarkan hanya objek JSON akhir.`,
        },
        { role: "user", content: JSON.stringify({ input, draft }) },
      ]);

      return validateOutput(enforceRules(reviewed, row, index), row, index);
    } catch (err) {
      lastError = err;
      if (attempt < maxAttempts) {
        process.stdout.write(`(retry ${attempt}) `);
      }
    }
  }
  throw lastError;
}

async function main() {
  const options = parseArgs(process.argv.slice(2));
  if (options.exportTraining && fs.existsSync(options.output) && options.validateOnly) {
    const splitInfo = exportTrainingSplits(options.output);
    console.log(JSON.stringify(splitInfo, null, 2));
    return;
  }

  const rows = readJsonl(options.input);
  rows.forEach(validateInput);
  const selected = rows.slice(options.start, options.start + options.limit);
  if (!selected.length) throw new Error("Tidak ada baris pada rentang yang diminta.");

  if (options.validateOnly) {
    const counts = Object.fromEntries([...MEDIATORS, "OUT_OF_SCOPE"].map((m) => [m, 0]));
    let skipCount = 0;
    let escCount = 0;
    let missingCount = 0;
    for (const row of rows) {
      if (row.scenarioType === "out_of_scope") {
        counts.OUT_OF_SCOPE += 1;
        continue;
      }
      counts[row.clinicalRuleEvaluation.dominantMediator] += 1;
      if (row.skipAdaptation?.applied) skipCount += 1;
      if (row.clinicalRuleEvaluation.escalationFlag) escCount += 1;
      if (row.clinicalRuleEvaluation.missingDailyCheckIn) missingCount += 1;
    }
    console.log(
      JSON.stringify(
        {
          validInputRows: rows.length,
          selectedRows: selected.length,
          fewShotExamples: FEW_SHOT_EXAMPLES.length,
          mediatorCounts: counts,
          edgeCoverage: { skipCount, escCount, missingCount },
          output: options.output,
        },
        null,
        2
      )
    );
    return;
  }

  await assertModelAvailable(options.baseUrl, options.model);
  const completed = new Set();
  if (fs.existsSync(options.output)) {
    if (!options.resume) {
      throw new Error(`File output sudah ada: ${options.output}. Gunakan --resume atau hapus file lama.`);
    }
    for (const old of readJsonl(options.output)) {
      const sourceIndex = rows.findIndex((row) => row.id === old.id);
      if (sourceIndex < 0) throw new Error(`Resume ditolak: ${old.id} tidak ada pada dataset input.`);
      validateOutput(old, rows[sourceIndex], sourceIndex);
      completed.add(old.id);
    }
  }

  const pending = selected.filter((row) => !completed.has(row.id));
  if (!fs.existsSync(options.output)) {
    fs.writeFileSync(options.output, "", "utf8");
  }
  for (let i = 0; i < pending.length; i += 1) {
    const row = pending[i];
    const globalIndex = rows.findIndex((candidate) => candidate.id === row.id);
    const label = row.scenarioType === "out_of_scope" ? "OUT_OF_SCOPE" : row.clinicalRuleEvaluation.dominantMediator;
    process.stdout.write(`[${i + 1}/${pending.length}] ${row.id} ${label} ... `);
    const generated = await generateOne(row, globalIndex, options);
    fs.appendFileSync(options.output, `${JSON.stringify({ ...row, ...generated })}\n`, "utf8");
    process.stdout.write("OK\n");
  }

  console.log(`Selesai: ${selected.length} baris -> ${options.output}`);
  if (options.exportTraining) {
    const splitInfo = exportTrainingSplits(options.output);
    console.log(
      `Export training siap Colab: ${splitInfo.trainCount} train (${splitInfo.trainPath}), ${splitInfo.valCount} val (${splitInfo.valPath})`
    );
  }
}

if (require.main === module) {
  main().catch((error) => {
    console.error(error.message);
    process.exitCode = 1;
  });
}

module.exports = {
  parseArgs,
  readJsonl,
  validateInput,
  validateOutput,
  enforceRules,
  toCoachInput,
  toTrainingRecord,
  exportTrainingSplits,
  generateOne,
};
