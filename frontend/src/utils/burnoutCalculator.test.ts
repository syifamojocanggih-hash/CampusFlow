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
  // Sibuk + kurang tidur -> MODERATE
  const moderate = calculateBurnoutRiskIndex(
    [
      { creditHours: 4, isPracticum: false }, // 4
      { creditHours: 2, isPracticum: true },  // 3
      { creditHours: 1, isPracticum: false }, // 1 -> AL = 8
    ],
    10.0, // ST = 5 -> ScreenStrain = 16 + 7.5 = 23.5
    5.0,  // SleepDeficit = 18 -> Burnout = 24 + 23.5 + 18 = 65.5 (MODERATE)
    0
  );
  assert.equal(moderate.academicLoadScore, 8);
  assert.equal(moderate.screenFatigueScore, 5);
  assert.equal(moderate.recoveryScore, 25);
  assert.equal(moderate.burnoutIndex, 65.5);
  assert.equal(moderate.status, "MODERATE");

  // Extreme load -> HIGH
  const extreme = calculateBurnoutRiskIndex(
    [
      { creditHours: 4, isPracticum: true, isExamWeek: true }, // 9
      { creditHours: 3, isPracticum: false }, // 3 -> AL = 12
    ],
    12.0, // ST = 10 -> ScreenStrain = 31
    3.5,  // SleepDeficit = 27 -> Burnout = 36 + 31 + 27 = 94 (> 75)
    0
  );
  assert.equal(extreme.burnoutIndex, 94);
  assert.equal(extreme.status, "HIGH");

  // Well rested student -> LOW
  const light = calculateBurnoutRiskIndex(
    [{ creditHours: 3, isPracticum: false }], // AL = 3 -> AcademicStrain = 9
    4.0, // ScreenStrain = 8
    8.0, // SleepDeficit = 0, OptimalBonus = -5
    2    // BreakRelief = -16 -> 9 + 8 - 21 = -4 clamped to 0
  );
  assert.equal(light.burnoutIndex, 0);
  assert.equal(light.status, "LOW");
});
