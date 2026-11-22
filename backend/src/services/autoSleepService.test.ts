import test from "node:test";
import assert from "node:assert/strict";
import {
  calculateSleepRecoveryPoints,
  classifySleepClinicalStatus,
  computeAutoSleepRecord,
  inferSleepQualityScore,
  parseHHMMToTimestamps,
} from "./autoSleepService.ts";

test("autoSleepService: parseHHMMToTimestamps handles cross-midnight sleep window", () => {
  const { lastActiveTimestamp, firstWakeTimestamp } = parseHHMMToTimestamps(
    "23:15",
    "06:45",
    "2026-11-22"
  );
  const diffHours = (firstWakeTimestamp - lastActiveTimestamp) / 3_600_000;
  assert.equal(diffHours, 7.5);
});

test("autoSleepService: computeAutoSleepRecord calculates net sleep, quality, and recovery points", () => {
  const optimal = computeAutoSleepRecord({
    logDate: "2026-11-22",
    bedTime: "23:00",
    wakeTime: "06:45",
    sleepLatencyMins: 15,
    source: "OVERNIGHT_INACTIVITY",
  });

  assert.equal(optimal.rawInactiveHours, 7.75);
  assert.equal(optimal.sleepHours, 7.5);
  assert.equal(optimal.sleepQualityScore, 5);
  assert.equal(optimal.recoveryPoints, 38);
  assert.equal(optimal.clinicalStatus, "OPTIMAL");
  assert.equal(optimal.confidence, "MEDIUM");

  const osPower = computeAutoSleepRecord({
    logDate: "2026-11-22",
    bedTime: "23:00",
    wakeTime: "07:05",
    source: "OS_POWER_MONITOR",
  });
  // OS_POWER_MONITOR default latency is 5 mins -> 8.083 - 0.083 = 8.0h
  assert.equal(osPower.sleepLatencyMins, 5);
  assert.equal(osPower.sleepHours, 8.0);
  assert.equal(osPower.recoveryPoints, 40);
  assert.equal(osPower.confidence, "HIGH");
});

test("autoSleepService: computeAutoSleepRecord handles manual override and critical deficit", () => {
  const deficit = computeAutoSleepRecord({
    logDate: "2026-11-22",
    bedTime: "02:15",
    wakeTime: "06:30",
    sleepLatencyMins: 15,
    source: "OVERNIGHT_INACTIVITY",
  });

  assert.equal(deficit.sleepHours, 4.0);
  assert.equal(deficit.clinicalStatus, "CRITICAL_DEFICIT");
  assert.equal(deficit.recoveryPoints, 20);
  assert.equal(deficit.sleepQualityScore, 1);

  const manual = computeAutoSleepRecord({
    logDate: "2026-11-22",
    sleepHours: 6.5,
    source: "MANUAL_OVERRIDE",
  });
  assert.equal(manual.sleepHours, 6.5);
  assert.equal(manual.sleepLatencyMins, 0);
  assert.equal(manual.isConfirmed, true);
  assert.equal(manual.confidence, "MANUAL");
  assert.equal(manual.clinicalStatus, "DEFICIT_WARNING");
});

test("autoSleepService: helper clinical classifiers return accurate scores", () => {
  assert.equal(calculateSleepRecoveryPoints(8.0), 40);
  assert.equal(calculateSleepRecoveryPoints(4.0), 20);
  assert.equal(classifySleepClinicalStatus(5.0), "CRITICAL_DEFICIT");
  assert.equal(classifySleepClinicalStatus(6.5), "DEFICIT_WARNING");
  assert.equal(classifySleepClinicalStatus(8.0), "OPTIMAL");
  assert.equal(classifySleepClinicalStatus(10.5), "OVERSLEEP");
  assert.equal(inferSleepQualityScore(8.0, "22:45"), 5);
});

