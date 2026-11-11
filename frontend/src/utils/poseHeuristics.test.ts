import assert from "node:assert/strict";
import test from "node:test";
import {
  POSE_LANDMARK_INDICES,
  BaselineCalibrator,
  PostureEmaSmoother,
  calcAngleDegrees,
  calcDistance2D,
  evaluatePostureFrame,
  type NormalizedLandmark,
} from "./poseHeuristics.ts";

function createMockLandmarks(overrides: Record<number, Partial<NormalizedLandmark>> = {}) {
  const landmarks: NormalizedLandmark[] = Array.from({ length: 33 }, () => ({
    x: 0.5,
    y: 0.5,
    z: 0,
    visibility: 0.95,
  }));

  const baseValues: Record<number, NormalizedLandmark> = {
    [POSE_LANDMARK_INDICES.NOSE]: { x: 0.5, y: 0.35, z: 0, visibility: 0.95 },
    [POSE_LANDMARK_INDICES.LEFT_EAR]: { x: 0.45, y: 0.34, z: 0, visibility: 0.95 },
    [POSE_LANDMARK_INDICES.RIGHT_EAR]: { x: 0.55, y: 0.34, z: 0, visibility: 0.95 },
    [POSE_LANDMARK_INDICES.LEFT_SHOULDER]: { x: 0.38, y: 0.52, z: 0, visibility: 0.95 },
    [POSE_LANDMARK_INDICES.RIGHT_SHOULDER]: { x: 0.62, y: 0.52, z: 0, visibility: 0.95 },
    [POSE_LANDMARK_INDICES.LEFT_ELBOW]: { x: 0.34, y: 0.68, z: 0, visibility: 0.95 },
    [POSE_LANDMARK_INDICES.RIGHT_ELBOW]: { x: 0.66, y: 0.68, z: 0, visibility: 0.95 },
    [POSE_LANDMARK_INDICES.LEFT_WRIST]: { x: 0.36, y: 0.78, z: 0, visibility: 0.95 },
    [POSE_LANDMARK_INDICES.RIGHT_WRIST]: { x: 0.64, y: 0.78, z: 0, visibility: 0.95 },
    [POSE_LANDMARK_INDICES.LEFT_HIP]: { x: 0.42, y: 0.85, z: 0, visibility: 0.95 },
    [POSE_LANDMARK_INDICES.RIGHT_HIP]: { x: 0.58, y: 0.85, z: 0, visibility: 0.95 },
  };

  for (const [idx, val] of Object.entries(baseValues)) {
    landmarks[Number(idx)] = val;
  }
  for (const [idx, val] of Object.entries(overrides)) {
    landmarks[Number(idx)] = { ...landmarks[Number(idx)], ...val };
  }
  return landmarks;
}

test("Geometry helpers: calcDistance2D & calcAngleDegrees", () => {
  const d = calcDistance2D({ x: 0, y: 0, z: 0 }, { x: 3, y: 4, z: 0 });
  assert.equal(d, 5);

  const angle = calcAngleDegrees(
    { x: 0, y: 1, z: 0 },
    { x: 0, y: 0, z: 0 },
    { x: 1, y: 0, z: 0 }
  );
  assert.equal(Math.round(angle), 90);
});

test("BaselineCalibrator collects frames and averages values", () => {
  const calibrator = new BaselineCalibrator(5);
  const frame = createMockLandmarks();

  for (let i = 0; i < 5; i++) {
    const res = calibrator.addFrame(frame);
    assert.equal(res.valid, true);
  }

  assert.equal(calibrator.isComplete(), true);
  const baseline = calibrator.finalize();
  assert.ok(baseline);
  assert.ok(baseline.shoulderWidth > 0);
  assert.ok(baseline.neckVerticalDist > 0);
});

test("evaluatePostureFrame detects slouching, proximity, tilt, and overhead stretch", () => {
  const upright = createMockLandmarks();
  const calibrator = new BaselineCalibrator(1);
  calibrator.addFrame(upright);
  const baseline = calibrator.finalize()!;

  // 1. Upright frame
  const uprightEval = evaluatePostureFrame(upright, baseline);
  assert.equal(uprightEval.isPresent, true);
  assert.equal(uprightEval.isSlouching, false);
  assert.equal(uprightEval.isTooClose, false);
  assert.equal(uprightEval.isLeaningAsymmetric, false);
  assert.equal(uprightEval.isOverheadStretchValid, false);

  // 2. Slouching (neck ratio drops < 0.78)
  const slouched = createMockLandmarks({
    [POSE_LANDMARK_INDICES.LEFT_EAR]: { y: 0.44 },
    [POSE_LANDMARK_INDICES.RIGHT_EAR]: { y: 0.44 },
  });
  const slouchEval = evaluatePostureFrame(slouched, baseline);
  assert.equal(slouchEval.isSlouching, true);

  // 3. Eye-strain proximity (shoulder width >= 1.28x baseline)
  const tooClose = createMockLandmarks({
    [POSE_LANDMARK_INDICES.LEFT_SHOULDER]: { x: 0.25, y: 0.52 },
    [POSE_LANDMARK_INDICES.RIGHT_SHOULDER]: { x: 0.75, y: 0.52 },
  });
  const closeEval = evaluatePostureFrame(tooClose, baseline);
  assert.equal(closeEval.isTooClose, true);

  // 4. Asymmetric shoulder lean (> 12 deg)
  const tilted = createMockLandmarks({
    [POSE_LANDMARK_INDICES.LEFT_SHOULDER]: { x: 0.38, y: 0.44 },
    [POSE_LANDMARK_INDICES.RIGHT_SHOULDER]: { x: 0.62, y: 0.58 },
  });
  const tiltEval = evaluatePostureFrame(tilted, baseline);
  assert.equal(tiltEval.isLeaningAsymmetric, true);

  // 5. Overhead stretch (wrists above nose, elbow angles > 140 deg)
  const stretch = createMockLandmarks({
    [POSE_LANDMARK_INDICES.LEFT_ELBOW]: { x: 0.38, y: 0.28 },
    [POSE_LANDMARK_INDICES.RIGHT_ELBOW]: { x: 0.62, y: 0.28 },
    [POSE_LANDMARK_INDICES.LEFT_WRIST]: { x: 0.39, y: 0.12 },
    [POSE_LANDMARK_INDICES.RIGHT_WRIST]: { x: 0.61, y: 0.12 },
  });
  const stretchEval = evaluatePostureFrame(stretch, baseline);
  assert.equal(stretchEval.isOverheadStretchValid, true);
});

test("PostureEmaSmoother blends frames with alpha 0.25", () => {
  const smoother = new PostureEmaSmoother(0.25);
  const first = smoother.smooth({ neckRatio: 1.0, depthRatio: 1.0, shoulderTiltDeg: 0 });
  assert.deepEqual(first, { neckRatio: 1.0, depthRatio: 1.0, shoulderTiltDeg: 0 });

  const second = smoother.smooth({ neckRatio: 0.6, depthRatio: 1.4, shoulderTiltDeg: 16 });
  assert.equal(second.neckRatio, 0.9);
  assert.equal(second.depthRatio, 1.1);
  assert.equal(second.shoulderTiltDeg, 4);
});

