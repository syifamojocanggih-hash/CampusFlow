import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";
import {
  computeAggregateSummary,
  evaluateInsightResponse,
  formatComparisonReport,
  type EvalExpectation,
  type EvalItemRecord,
} from "./eval-checks.ts";

const SCRIPT_DIR = path.dirname(fileURLToPath(import.meta.url));

const BASE_EXPECTATION: EvalExpectation = {
  expectedMediator: "LOW_MVPA_VOLUME",
  metsRange: [160, 220],
  durationMinutesRange: [15, 25],
  escalationFlag: false,
  missingDailyCheckIn: false,
  sleepHoursIsNull: false,
  outOfScope: false,
  skipApplied: false,
};

test("evaluateInsightResponse meloloskan jawaban spesialis yang lengkap dan valid", () => {
  const res = evaluateInsightResponse(
    {
      dominantMediator: "LOW_MVPA_VOLUME",
      diagnosisSummary: "Gerak aktifmu baru sekitar 10 menit hari ini. Yuk tambah perlahan.",
      isotemporalActionPlan: "Jalan santai selama 20 menit sore ini di sekitar kos.",
      recommendedMetsToday: 190,
      scientificCitationNote:
        "Zhang et al. (2024) dan Ai et al. (2021) mengaitkan aktivitas fisik yang konsisten dengan dukungan kesehatan mental mahasiswa.",
    },
    true,
    BASE_EXPECTATION
  );

  assert.equal(res.corePass, true);
  assert.equal(res.specialistPass, true);
  assert.deepEqual(res.failedRules, []);
});

test("evaluateInsightResponse mendeteksi sitasi karangan, sitasi salah mediator, dan durasi hilang", () => {
  const wrongCitation = evaluateInsightResponse(
    {
      dominantMediator: "LOW_MVPA_VOLUME",
      diagnosisSummary: "Gerak aktifmu hari ini masih rendah.",
      isotemporalActionPlan: "Lakukan peregangan sebentar sekarang di kamar.",
      recommendedMetsToday: 180,
      scientificCitationNote:
        "Penelitian Chen et al. (2023) menunjukkan tidur sangat membantu stres mahasiswa.",
    },
    true,
    BASE_EXPECTATION
  );

  assert.equal(wrongCitation.corePass, true);
  assert.equal(wrongCitation.specialistPass, false);
  assert.equal(wrongCitation.knownCitationOnlyOk, false);
  assert.equal(wrongCitation.durationOk, false);
  assert.ok(wrongCitation.failedRules.includes("knownCitationOnly"));
  assert.ok(wrongCitation.failedRules.includes("durationRange"));
});

test("evaluateInsightResponse mendeteksi check-in leak saat missingDailyCheckIn false", () => {
  const leaked = evaluateInsightResponse(
    {
      dominantMediator: "LOW_MVPA_VOLUME",
      diagnosisSummary:
        "Gerak aktifmu hari ini baru 10 menit. Jangan lupa lengkapi check-in harian di aplikasi ya.",
      isotemporalActionPlan: "Jalan santai selama 15 menit sekarang di koridor kos.",
      recommendedMetsToday: 175,
      scientificCitationNote:
        "Ai et al. (2021) dan Zhang et al. (2024) menyoroti peran kebiasaan bergerak bagi kesejahteraan mahasiswa.",
    },
    true,
    BASE_EXPECTATION
  );

  assert.equal(leaked.noCheckInLeakOk, false);
  assert.equal(leaked.specialistPass, false);
});

test("evaluateInsightResponse mendeteksi kegagalan penolakan out_of_scope", () => {
  const failedRefusal = evaluateInsightResponse(
    {
      dominantMediator: "OPTIMAL_BALANCE",
      diagnosisSummary: "Ritme gerak dan tidurmu terjaga baik hari ini.",
      isotemporalActionPlan: "Peregangan ringan selama 10 menit sebelum tidur.",
      recommendedMetsToday: 230,
      scientificCitationNote:
        "Keseimbangan gerak dan tidur mendukung ketahanan stres sesuai Martín-Rodríguez & González-Prieto (2026).",
    },
    true,
    { ...BASE_EXPECTATION, expectedMediator: "OPTIMAL_BALANCE", outOfScope: true }
  );

  assert.equal(failedRefusal.corePass, false);
  assert.equal(failedRefusal.specialistPass, false);
  assert.ok(failedRefusal.failedRules.includes("outOfScopeRefusal"));
});

test("seluruh 38 baris target di balanced_dataset_narratives_val_messages.jsonl lolos validasi spesialis 100%", () => {
  const valPath = path.join(SCRIPT_DIR, "balanced_dataset_narratives_val_messages.jsonl");
  const rows = fs
    .readFileSync(valPath, "utf8")
    .split(/\r?\n/)
    .filter(Boolean)
    .map((line) => JSON.parse(line));

  assert.equal(rows.length, 38);

  const records: EvalItemRecord[] = [];
  for (let i = 0; i < rows.length; i += 1) {
    const user = JSON.parse(rows[i].messages[1].content);
    const asst = JSON.parse(rows[i].messages[2].content);
    const outOfScope = /di luar cakupan|bukan cakupan/i.test(asst.diagnosisSummary);
    const expectation: EvalExpectation = {
      expectedMediator: user.clinicalRuleEvaluation.dominantMediator,
      metsRange: user.allowedRanges.metsRange,
      durationMinutesRange: user.allowedRanges.durationMinutesRange,
      escalationFlag: Boolean(user.clinicalRuleEvaluation.escalationFlag),
      missingDailyCheckIn: Boolean(user.clinicalRuleEvaluation.missingDailyCheckIn),
      sleepHoursIsNull: user.today.sleepHours === null,
      outOfScope,
      skipApplied: Boolean(user.skipAdaptation?.applied),
    };
    const checks = evaluateInsightResponse(asst, true, expectation);
    assert.equal(
      checks.specialistPass,
      true,
      `Baris val #${i + 1} gagal rules: ${checks.failedRules.join(", ")}`
    );
    records.push({
      id: `val_${i + 1}`,
      suite: "val",
      name: `val_${i + 1}`,
      ms: 100,
      source: "TARGET",
      expectedMediator: expectation.expectedMediator,
      actualMediator: asst.dominantMediator,
      outOfScope,
      escalationFlag: expectation.escalationFlag,
      missingDailyCheckIn: expectation.missingDailyCheckIn,
      skipApplied: expectation.skipApplied,
      mets: asst.recommendedMetsToday,
      metsRange: expectation.metsRange,
      durationMinutesRange: expectation.durationMinutesRange,
      checks,
      insight: asst,
    });
  }

  const summary = computeAggregateSummary(records, {
    model: "target-ground-truth",
    promptMode: "chatml",
    suite: "val",
  });
  const report = formatComparisonReport(summary, summary);
  assert.match(report, /Specialist Full\s*\|\s*38\/38 \(100%\)/);
});

