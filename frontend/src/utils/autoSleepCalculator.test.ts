import test from "node:test";
import assert from "node:assert/strict";
import {
  calculateSleepRecoveryPoints,
  classifySleepClinicalStatus,
  computeAutoSleepFromWindow,
  inferSleepQualityScore,
  parseHHMMToTimestamps,
} from "./autoSleepCalculator.ts";

test("parseHHMMToTimestamps crosses midnight properly when bedTime is in the evening", () => {
  const { lastActiveTimestamp, firstWakeTimestamp } = parseHHMMToTimestamps(
    "23:00",
    "06:30",
    "2026-11-22"
  );
  assert.ok(firstWakeTimestamp > lastActiveTimestamp);
  const gapHours = (firstWakeTimestamp - lastActiveTimestamp) / 3_600_000;
  assert.equal(gapHours, 7.5);
});

test("computeAutoSleepFromWindow deducts sleepLatencyMins from overnight inactivity window", () => {
  // 23:00 -> 06:45 = 7.75h raw, minus 15m (0.25h) latency = 7.5h net sleep
  const rec = computeAutoSleepFromWindow({
    logDate: "2026-11-22",
    bedTime: "23:00",
    wakeTime: "06:45",
    sleepLatencyMins: 15,
    source: "OVERNIGHT_INACTIVITY",
  });

  assert.equal(rec.rawInactiveHours, 7.75);
  assert.equal(rec.sleepHours, 7.5);
  assert.equal(rec.sleepQualityScore, 5);
  assert.equal(rec.clinicalStatus, "OPTIMAL");
  assert.equal(rec.recoveryPoints, 38); // round((7.5 / 8.0) * 40) = 38
});

test("computeAutoSleepFromWindow detects critical sleep deficit when sleeping late (02:15 -> 06:30)", () => {
  const rec = computeAutoSleepFromWindow({
    logDate: "2026-11-22",
    bedTime: "02:15",
    wakeTime: "06:30",
    sleepLatencyMins: 15,
    source: "OVERNIGHT_INACTIVITY",
  });

  assert.equal(rec.rawInactiveHours, 4.25);
  assert.equal(rec.sleepHours, 4.0);
  assert.equal(rec.sleepQualityScore, 1);
  assert.equal(rec.clinicalStatus, "CRITICAL_DEFICIT");
  assert.equal(rec.recoveryPoints, 20);
});

test("calculateSleepRecoveryPoints caps at 40 points for >= 8.0 hours", () => {
  assert.equal(calculateSleepRecoveryPoints(8.0), 40);
  assert.equal(calculateSleepRecoveryPoints(9.5), 40);
  assert.equal(calculateSleepRecoveryPoints(6.0), 30);
  assert.equal(calculateSleepRecoveryPoints(4.0), 20);
});

test("inferSleepQualityScore and classifySleepClinicalStatus handle all clinical ranges", () => {
  assert.equal(inferSleepQualityScore(7.5, "22:30"), 5);
  assert.equal(inferSleepQualityScore(7.5, "01:30"), 4);
  assert.equal(inferSleepQualityScore(6.2, "00:30"), 3);
  assert.equal(inferSleepQualityScore(5.2, "01:00"), 2);
  assert.equal(inferSleepQualityScore(4.2, "02:00"), 1);

  assert.equal(classifySleepClinicalStatus(4.5), "CRITICAL_DEFICIT");
  assert.equal(classifySleepClinicalStatus(6.2), "DEFICIT_WARNING");
  assert.equal(classifySleepClinicalStatus(7.8), "OPTIMAL");
  assert.equal(classifySleepClinicalStatus(10.2), "OVERSLEEP");
});

