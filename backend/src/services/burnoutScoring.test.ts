import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  calculateAcademicLoadScore,
  calculateScreenTimeFatigue,
  calculateRecoveryScore,
  calculateBurnoutRiskIndex,
  calculateExamProximityPenalty,
  getExamEscalationBand,
  getDaysUntilExam,
} from "./burnoutScoring.ts";

describe("Burnout Scoring Service (PRD v4.0)", () => {
  it("menghitung Academic Load Score dengan bobot teori, praktikum, dan penalti ujian fallback (tanpa examDate)", () => {
    // 2 SKS teori (2*1 = 2) + 3 SKS praktikum (3*1.5 = 4.5) + ujian fallback (+3) = 9.5
    const schedules = [
      { creditHours: 2, isPracticum: false, isExamWeek: false },
      { creditHours: 3, isPracticum: true, isExamWeek: true },
    ];
    const score = calculateAcademicLoadScore(schedules);
    assert.equal(score, 9.5);
  });

  it("calculateExamProximityPenalty: menghitung setiap interval kurva eskalasi dan batas interval secara presisi", () => {
    const examDate = new Date("2026-12-15T00:00:00.000Z");

    // Di luar H-14 (H-15 -> 0)
    assert.equal(calculateExamProximityPenalty(examDate, new Date("2026-11-30T00:00:00.000Z")), 0);

    // Interval H-14 s/d H-8 (+0.5)
    assert.equal(calculateExamProximityPenalty(examDate, new Date("2026-12-01T00:00:00.000Z")), 0.5); // H-14
    assert.equal(calculateExamProximityPenalty(examDate, new Date("2026-12-07T00:00:00.000Z")), 0.5); // H-8 (batas bawah)

    // Batas transisi H-8 -> H-7 (+0.5 -> +1.5)
    assert.equal(calculateExamProximityPenalty(examDate, new Date("2026-12-08T00:00:00.000Z")), 1.5); // H-7 (batas atas)
    assert.equal(calculateExamProximityPenalty(examDate, new Date("2026-12-11T00:00:00.000Z")), 1.5); // H-4 (batas bawah)

    // Batas transisi H-4 -> H-3 (+1.5 -> +3.0)
    assert.equal(calculateExamProximityPenalty(examDate, new Date("2026-12-12T00:00:00.000Z")), 3.0); // H-3 (batas atas)
    assert.equal(calculateExamProximityPenalty(examDate, new Date("2026-12-14T00:00:00.000Z")), 3.0); // H-1 (batas bawah)

    // Hari ujian H-0 (+4.0)
    assert.equal(calculateExamProximityPenalty(examDate, new Date("2026-12-15T00:00:00.000Z")), 4.0); // H-0
    assert.equal(getExamEscalationBand(examDate, new Date("2026-12-15T00:00:00.000Z"))?.tier, "H_0");
  });

  it("calculateExamProximityPenalty: menangani edge case ujian sudah lewat, examDate null, dan perbedaan jam dalam hari", () => {
    const examDate = new Date("2026-12-15T00:00:00.000Z");

    // Sudah lewat (H+1 dan H+5 -> 0)
    assert.equal(getDaysUntilExam(examDate, new Date("2026-12-16T00:00:00.000Z")), -1);
    assert.equal(calculateExamProximityPenalty(examDate, new Date("2026-12-16T00:00:00.000Z")), 0);
    assert.equal(calculateExamProximityPenalty(examDate, new Date("2026-12-20T00:00:00.000Z")), 0);

    // examDate null / undefined -> 0
    assert.equal(calculateExamProximityPenalty(null, new Date("2026-12-10T00:00:00.000Z")), 0);
    assert.equal(calculateExamProximityPenalty(undefined, new Date("2026-12-10T00:00:00.000Z")), 0);

    // Perbedaan jam (23:59:59 sehari sebelum ujian) harus tetap dihitung H-1 (+3.0), bukan H-0
    assert.equal(calculateExamProximityPenalty("2026-12-15", new Date("2026-12-14T23:59:59.000Z")), 3.0);
  });

  it("calculateAcademicLoadScore: mengintegrasikan kurva eskalasi dinamis dan fallback data lama tanpa examDate", () => {
    const today = new Date("2026-12-10T00:00:00.000Z");
    const schedules = [
      // 3 SKS teori + H-10 (2026-12-20) -> 3.0 + 0.5 = 3.5
      { creditHours: 3, isPracticum: false, isExamWeek: true, examDate: "2026-12-20" },
      // 2 SKS teori + H-0 (2026-12-10) -> 2.0 + 4.0 = 6.0
      { creditHours: 2, isPracticum: false, isExamWeek: true, examDate: "2026-12-10" },
      // 2 SKS teori + isExamWeek true tapi examDate null (data lama) -> 2.0 + 3.0 fallback = 5.0
      { creditHours: 2, isPracticum: false, isExamWeek: true, examDate: null },
      // 2 SKS teori + ujian sudah lewat (2026-12-05) -> 2.0 + 0 = 2.0
      { creditHours: 2, isPracticum: false, isExamWeek: true, examDate: "2026-12-05" },
    ];
    // Total = 3.5 + 6.0 + 5.0 + 2.0 = 16.5
    assert.equal(calculateAcademicLoadScore(schedules, today), 16.5);
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
    const resModerate = calculateBurnoutRiskIndex(
      [{ creditHours: 40, isPracticum: false }],
      14.0,
      2.0,
      0
    );
    assert.equal(resModerate.burnoutIndex, 45);
    assert.equal(resModerate.status, "MODERATE");

    // Kasus 3: Mahasiswa overload ekstrem di hari ujian H-0 (Load 79 + Fatigue 25) - Recovery 20 = 84 (HIGH)
    const examToday = new Date("2026-12-15T00:00:00.000Z");
    const resHigh = calculateBurnoutRiskIndex(
      [{ creditHours: 50, isPracticum: true, isExamWeek: true, examDate: examToday }], // 50*1.5 + 4.0 = 79
      18.0, // (18-8)*2.5 = 25
      4.0, // (4/8)*40 = 20
      0,
      examToday
    );
    assert.equal(resHigh.academicLoadScore, 79);
    assert.equal(resHigh.burnoutIndex, 84);
    assert.equal(resHigh.status, "HIGH");
  });
});
