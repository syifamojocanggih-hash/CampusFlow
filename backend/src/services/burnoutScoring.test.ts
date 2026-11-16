import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  calculateAcademicLoadScore,
  calculateScreenTimeFatigue,
  calculateRecoveryScore,
  calculateBurnoutRiskIndex,
} from "./burnoutScoring.ts";

describe("Burnout Scoring Service (PRD v4.0)", () => {
  it("menghitung Academic Load Score dengan bobot teori, praktikum, dan penalti ujian", () => {
    // 2 SKS teori (2*1 = 2) + 3 SKS praktikum (3*1.5 = 4.5) + ujian (+3) = 9.5
    const schedules = [
      { creditHours: 2, isPracticum: false, isExamWeek: false },
      { creditHours: 3, isPracticum: true, isExamWeek: true },
    ];
    const score = calculateAcademicLoadScore(schedules);
    assert.equal(score, 9.5);
  });

  it("menghitung Screen Time Fatigue hanya jika melewati 8 jam", () => {
    assert.equal(calculateScreenTimeFatigue(7.5), 0);
    assert.equal(calculateScreenTimeFatigue(8.0), 0);
    // 10 jam layar: kelebihan 2 jam * 2.5 = 5.0
    assert.equal(calculateScreenTimeFatigue(10.0), 5.0);
  });

  it("menghitung Recovery Score dari jam tidur dan jumlah active break terverifikasi", () => {
    // 8 jam tidur = (8/8)*40 = 40. 2 active break = 2*10 = 20. Total = 60
    assert.equal(calculateRecoveryScore(8.0, 2), 60.0);
    // 6 jam tidur = (6/8)*40 = 30. 0 active break = 0. Total = 30
    assert.equal(calculateRecoveryScore(6.0, 0), 30.0);
  });

  it("menghitung Burnout Risk Index secara terpadu dan mengklasifikasikan status LOW/MODERATE/HIGH", () => {
    // Kasus 1: Mahasiswa seimbang (Load 10 + Fatigue 0) - Recovery 60 = -50 -> Index 0 (LOW)
    const resBalanced = calculateBurnoutRiskIndex(
      [{ creditHours: 10, isPracticum: false }],
      6.0,
      8.0,
      2
    );
    assert.equal(resBalanced.burnoutIndex, 0);
    assert.equal(resBalanced.status, "LOW");

    // Kasus 2: Mahasiswa beban tinggi (Load 40 + Fatigue 15) - Recovery 10 = 45 (MODERATE)
    // 40 SKS equivalent, 14 jam layar ((14-8)*2.5 = 15), tidur 2 jam ((2/8)*40=10), 0 break
    const resModerate = calculateBurnoutRiskIndex(
      [{ creditHours: 40, isPracticum: false }],
      14.0,
      2.0,
      0
    );
    assert.equal(resModerate.burnoutIndex, 45);
    assert.equal(resModerate.status, "MODERATE");

    // Kasus 3: Mahasiswa overload ekstrem menjelang ujian (Load 80 + Fatigue 25) - Recovery 20 = 85 (HIGH)
    const resHigh = calculateBurnoutRiskIndex(
      [{ creditHours: 50, isPracticum: true, isExamWeek: true }], // 50*1.5 + 3 = 78
      18.0, // (18-8)*2.5 = 25
      4.0, // (4/8)*40 = 20
      0
    );
    assert.ok(resHigh.burnoutIndex > 75);
    assert.equal(resHigh.status, "HIGH");
  });
});
