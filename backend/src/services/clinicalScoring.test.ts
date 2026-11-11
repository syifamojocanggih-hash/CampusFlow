import assert from "node:assert/strict";
import test from "node:test";
import {
  calculateActivityMets,
  calculatePss10Score,
  calculatePss4Score,
  classifyPss10Severity,
  classifyPss4Severity,
  evaluate24HourTriad,
  isSleepGuidelineMet,
} from "./clinicalScoring.ts";

test("calculatePss4Score menerapkan reverse score Q2 & Q3 dan cutoff >= 8", () => {
  // Jawaban [4, 0, 0, 4] -> Q1=4, Q2=4-0=4, Q3=4-0=4, Q4=4 => total 16
  assert.equal(calculatePss4Score([4, 0, 0, 4]), 16);
  // Jawaban [0, 4, 4, 0] -> total 0
  assert.equal(calculatePss4Score([0, 4, 4, 0]), 0);
  // Jawaban [2, 2, 1, 3] -> 2 + (4-2) + (4-1) + 3 = 10 -> HIGH
  const score = calculatePss4Score([2, 2, 1, 3]);
  assert.equal(score, 10);
  assert.equal(classifyPss4Severity(score), "HIGH");
  assert.equal(classifyPss4Severity(5), "LOW");
  assert.equal(classifyPss4Severity(7), "MODERATE");
});

test("calculatePss10Score menerapkan reverse score item 4, 5, 7, 8", () => {
  // Semua 0 pada item negatif dan semua 4 pada item positif (index 3,4,6,7) -> skor 0
  const optimal = [0, 0, 0, 4, 4, 0, 4, 4, 0, 0];
  assert.equal(calculatePss10Score(optimal), 0);
  assert.equal(classifyPss10Severity(0), "LOW");

  // Semua 4 pada item negatif dan 0 pada item positif -> skor 40 (SEVERE)
  const severe = [4, 4, 4, 0, 0, 4, 0, 0, 4, 4];
  assert.equal(calculatePss10Score(severe), 40);
  assert.equal(classifyPss10Severity(40), "SEVERE");
});

test("calculateActivityMets menghitung koefisien IPAQ-SF dengan presisi", () => {
  assert.equal(calculateActivityMets("WALKING", 30), 99);
  assert.equal(calculateActivityMets("MODERATE", 20), 80);
  assert.equal(calculateActivityMets("VIGOROUS", 15), 120);
  assert.equal(calculateActivityMets("MUSCLE_STRENGTHENING", 20), 100);
});

test("evaluate24HourTriad menilai 3 pilar dan risiko duduk statis tinggi", () => {
  assert.equal(isSleepGuidelineMet(7.5, 4), true);
  assert.equal(isSleepGuidelineMet(5.5, 4), false);
  assert.equal(isSleepGuidelineMet(7.5, 2), false);

  const optimal = evaluate24HourTriad({
    totalMvpaMinutes: 40,
    sleepHours: 7.5,
    sleepQualityScore: 4,
    totalSedentaryHours: 5.0,
    nonAcademicScreenHours: 4.0,
  });
  assert.equal(optimal.triadPillarsMet, 3);
  assert.equal(optimal.sedentaryRiskStatus, "OPTIMAL");

  const highRisk = evaluate24HourTriad({
    totalMvpaMinutes: 15,
    sleepHours: 5.5,
    sleepQualityScore: 2,
    totalSedentaryHours: 9.5,
    nonAcademicScreenHours: 9.0,
  });
  assert.equal(highRisk.triadPillarsMet, 0);
  assert.equal(highRisk.sedentaryRiskStatus, "HIGH_SEDENTARY_RISK");
});

