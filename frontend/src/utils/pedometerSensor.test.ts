import assert from "node:assert/strict";
import test from "node:test";
import {
  PedometerEngine,
  classifyCadence,
} from "./pedometerSensor.ts";

test("classifyCadence maps steps-per-minute to IPAQ-SF MET categories correctly", () => {
  assert.deepEqual(classifyCadence(0), { intensityType: "IDLE", metMultiplier: 1.0 });
  assert.deepEqual(classifyCadence(45), { intensityType: "IDLE", metMultiplier: 1.0 });
  assert.deepEqual(classifyCadence(50), { intensityType: "WALKING", metMultiplier: 3.3 });
  assert.deepEqual(classifyCadence(85), { intensityType: "WALKING", metMultiplier: 3.3 });
  assert.deepEqual(classifyCadence(100), { intensityType: "MODERATE", metMultiplier: 4.0 });
  assert.deepEqual(classifyCadence(125), { intensityType: "MODERATE", metMultiplier: 4.0 });
  assert.deepEqual(classifyCadence(130), { intensityType: "VIGOROUS", metMultiplier: 8.0 });
  assert.deepEqual(classifyCadence(160), { intensityType: "VIGOROUS", metMultiplier: 8.0 });
});

test("PedometerEngine detects steps only when aNet > 1.35 and respects min interval 250ms", () => {
  const engine = new PedometerEngine();

  // Baseline calibration fill (gravity ~ 9.8 m/s^2 on z axis)
  for (let i = 0; i < 25; i++) {
    engine.processSample(0, 0, 9.8, 1000 + i * 20);
  }

  // Sample with little acceleration (< 1.35 m/s^2 above mean) -> no step
  const subThreshold = engine.processSample(0.5, 0.5, 10.0, 1500);
  assert.equal(subThreshold.stepDetected, false);

  // Big acceleration (> 1.35) -> valid step!
  const step1 = engine.processSample(0, 0, 13.0, 2000);
  assert.equal(step1.stepDetected, true);
  assert.equal(engine.getSnapshot().totalSteps, 1);

  // Fast shake within 100ms (< 250ms min interval) -> rejected by anti-shake filter
  const fastShake = engine.processSample(0, 0, 14.0, 2080);
  assert.equal(fastShake.stepDetected, false);
  assert.equal(engine.getSnapshot().totalSteps, 1);

  // Next valid step at 600ms later (100 SPM)
  const step2 = engine.processSample(0, 0, 13.5, 2600);
  assert.equal(step2.stepDetected, true);
  assert.equal(engine.getSnapshot().totalSteps, 2);
});

test("simulateStep increases step count and accumulates MET-minutes", () => {
  const engine = new PedometerEngine();
  const snap1 = engine.simulateStep();
  assert.equal(snap1.totalSteps, 1);

  for (let i = 0; i < 9; i++) {
    engine.simulateStep();
  }
  const snap10 = engine.getSnapshot();
  assert.equal(snap10.totalSteps, 10);
  assert.ok(snap10.metMinutes > 0);
});

