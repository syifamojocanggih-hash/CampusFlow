import test from "node:test";
import assert from "node:assert/strict";
import {
  calculateAcademicLoadScore,
  calculateScreenTimeFatigue,
  calculateRecoveryScore,
  calculateBurnoutRiskIndex,
} from "./burnoutCalculator.ts";

test("calculateAcademicLoadScore calculates theory and practicum SKS and exam penalty", () => {
  const schedules = [
    { creditHours: 3, isPracticum: false }, // 3 * 1.0 = 3
    { creditHours: 2, isPracticum: true },  // 2 * 1.5 = 3
    { creditHours: 2, isPracticum: false, isExamWeek: true }, // 2 * 1.0 + 3.0 = 5.0
  ];
  const score = calculateAcademicLoadScore(schedules);
  assert.equal(score, 11.0);
});

test("calculateScreenTimeFatigue applies 2.5 penalty for hours > 8.0", () => {
  assert.equal(calculateScreenTimeFatigue(7.5), 0);
  assert.equal(calculateScreenTimeFatigue(8.0), 0);
  // 10.0 hours -> 2.0 excess * 2.5 = 5.0
  assert.equal(calculateScreenTimeFatigue(10.0), 5.0);
});

test("calculateRecoveryScore combines sleep duration (max 40) and verified active breaks (+10 each)", () => {
  // 8.0 hours sleep -> 40 pts + 2 breaks * 10 = 60 pts
  assert.equal(calculateRecoveryScore(8.0, 2), 60.0);
  // 6.0 hours sleep -> (6/8)*40 = 30 + 1 break * 10 = 40 pts
  assert.equal(calculateRecoveryScore(6.0, 1), 40.0);
});

test("calculateBurnoutRiskIndex produces bounded 0-100 index and correct risk status", () => {
  // Heavy load with low recovery -> High burnout
  const heavy = calculateBurnoutRiskIndex(
    [
      { creditHours: 4, isPracticum: true, isExamWeek: true }, // 4*1.5 + 3 = 9
      { creditHours: 4, isPracticum: true, isExamWeek: true }, // 9
      { creditHours: 4, isPracticum: true, isExamWeek: true }, // 9
      { creditHours: 4, isPracticum: true, isExamWeek: true }, // 9
      { creditHours: 4, isPracticum: true, isExamWeek: true }, // 9
      { creditHours: 4, isPracticum: true, isExamWeek: true }, // 9
      { creditHours: 4, isPracticum: true, isExamWeek: true }, // 9 -> AL = 63
    ],
    16.0, // ST = (16-8)*2.5 = 20 -> Total load = 83
    4.0,  // RS = (4/8)*40 = 20 -> Burnout = 83 - 20 = 63 (MODERATE)
    0
  );
  assert.equal(heavy.academicLoadScore, 63);
  assert.equal(heavy.screenFatigueScore, 20);
  assert.equal(heavy.recoveryScore, 20);
  assert.equal(heavy.burnoutIndex, 63);
  assert.equal(heavy.status, "MODERATE");

  // Extreme load -> HIGH
  const extreme = calculateBurnoutRiskIndex(
    [
      { creditHours: 6, isPracticum: true, isExamWeek: true }, // 12
      { creditHours: 6, isPracticum: true, isExamWeek: true }, // 12
      { creditHours: 6, isPracticum: true, isExamWeek: true }, // 12
      { creditHours: 6, isPracticum: true, isExamWeek: true }, // 12
      { creditHours: 6, isPracticum: true, isExamWeek: true }, // 12
      { creditHours: 6, isPracticum: true, isExamWeek: true }, // 12
      { creditHours: 6, isPracticum: true, isExamWeek: true }, // 12 -> 84
    ],
    14.0, // (14-8)*2.5 = 15 -> Total load = 99
    4.0,  // RS = 20 -> Burnout = 79 (> 75)
    0
  );
  assert.equal(extreme.status, "HIGH");

  // Well rested student -> LOW
  const light = calculateBurnoutRiskIndex(
    [{ creditHours: 3, isPracticum: false }], // 3.0
    6.0, // 0.0 fatigue
    8.0, // 40 recovery
    2    // +20 break = 60 recovery -> 3 - 60 = -57 clamped to 0
  );
  assert.equal(light.burnoutIndex, 0);
  assert.equal(light.status, "LOW");
});
