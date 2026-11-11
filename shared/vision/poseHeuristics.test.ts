import assert from "node:assert/strict";
import test from "node:test";
import {
  POSE_LANDMARK_INDICES,
  PostureEmaSmoother,
  calcAngleDegrees,
  calcEyeAspectRatio,
  computePostureBaseline,
  evaluatePostureFrame,
  type NormalizedLandmark,
} from "./poseHeuristics.ts";

function makePoseLandmarks(overrides: Record<number, Partial<NormalizedLandmark>> = {}) {
  const arr: NormalizedLandmark[] = Array.from({ length: 33 }, () => ({
    x: 0.5,
    y: 0.5,
    z: 0,
    visibility: 0.95,
  }));

  const defaults: Record<number, NormalizedLandmark> = {
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

  for (const [idx, val] of Object.entries(defaults)) {
    arr[Number(idx)] = val;
  }
  for (const [idx, val] of Object.entries(overrides)) {
    arr[Number(idx)] = { ...arr[Number(idx)], ...val };
  }
  return arr;
}

test("calcAngleDegrees menghitung siku 90 dan 180 derajat secara akurat", () => {
  const rightAngle = calcAngleDegrees(
    { x: 0, y: 1, z: 0 },
    { x: 0, y: 0, z: 0 },
    { x: 1, y: 0, z: 0 }
  );
  assert.equal(Math.round(rightAngle), 90);

  const straightAngle = calcAngleDegrees(
    { x: 0, y: 0, z: 0 },
    { x: 0.5, y: 0, z: 0 },
    { x: 1, y: 0, z: 0 }
  );
  assert.equal(Math.round(straightAngle), 180);
});

test("computePostureBaseline menolak frame saat visibility bahu rendah", () => {
  const lowVis = makePoseLandmarks({
    [POSE_LANDMARK_INDICES.LEFT_SHOULDER]: { visibility: 0.3 },
  });
  assert.equal(computePostureBaseline(lowVis), null);
});

test("evaluatePostureFrame mendeteksi tegak, membungkuk, terlalu dekat, miring, stretch, dan berdiri", () => {
  const upright = makePoseLandmarks();
  const baseline = computePostureBaseline(upright);
  assert.ok(baseline);

  const uprightEval = evaluatePostureFrame(upright, baseline);
  assert.equal(uprightEval.isPresent, true);
  assert.equal(uprightEval.isSlouching, false);
  assert.equal(uprightEval.isTooClose, false);
  assert.equal(uprightEval.isLeaningAsymmetric, false);
  assert.equal(uprightEval.isOverheadStretchValid, false);
  assert.equal(uprightEval.isStandingUp, false);

  // Slouching: telinga turun mendekati bahu (neckRatio < 0.78)
  const slouched = makePoseLandmarks({
    [POSE_LANDMARK_INDICES.LEFT_EAR]: { y: 0.43 },
    [POSE_LANDMARK_INDICES.RIGHT_EAR]: { y: 0.43 },
  });
  assert.equal(evaluatePostureFrame(slouched, baseline).isSlouching, true);

  // Terlalu dekat: lebar bahu membesar >= 1.28x
  const tooClose = makePoseLandmarks({
    [POSE_LANDMARK_INDICES.LEFT_SHOULDER]: { x: 0.25, y: 0.52 },
    [POSE_LANDMARK_INDICES.RIGHT_SHOULDER]: { x: 0.75, y: 0.52 },
  });
  assert.equal(evaluatePostureFrame(tooClose, baseline).isTooClose, true);

  // Bahu miring > 12 derajat
  const tilted = makePoseLandmarks({
    [POSE_LANDMARK_INDICES.LEFT_SHOULDER]: { x: 0.38, y: 0.44 },
    [POSE_LANDMARK_INDICES.RIGHT_SHOULDER]: { x: 0.62, y: 0.58 },
  });
  assert.equal(evaluatePostureFrame(tilted, baseline).isLeaningAsymmetric, true);

  // Overhead Arm Stretch valid (tangan di atas hidung & siku > 140 deg)
  const stretch = makePoseLandmarks({
    [POSE_LANDMARK_INDICES.LEFT_ELBOW]: { x: 0.38, y: 0.32 },
    [POSE_LANDMARK_INDICES.RIGHT_ELBOW]: { x: 0.62, y: 0.32 },
    [POSE_LANDMARK_INDICES.LEFT_WRIST]: { x: 0.39, y: 0.14 },
    [POSE_LANDMARK_INDICES.RIGHT_WRIST]: { x: 0.61, y: 0.14 },
  });
  assert.equal(evaluatePostureFrame(stretch, baseline).isOverheadStretchValid, true);

  // Berdiri dari kursi (bahu naik > 0.20)
  const standing = makePoseLandmarks({
    [POSE_LANDMARK_INDICES.LEFT_SHOULDER]: { y: 0.25 },
    [POSE_LANDMARK_INDICES.RIGHT_SHOULDER]: { y: 0.25 },
  });
  assert.equal(evaluatePostureFrame(standing, baseline).isStandingUp, true);
});

test("PostureEmaSmoother meredam lonjakan frame dengan alpha 0.25", () => {
  const smoother = new PostureEmaSmoother(0.25);
  const first = smoother.smooth({ neckRatio: 1.0, depthRatio: 1.0, shoulderTiltDeg: 0 });
  assert.deepEqual(first, { neckRatio: 1.0, depthRatio: 1.0, shoulderTiltDeg: 0 });

  const second = smoother.smooth({ neckRatio: 0.6, depthRatio: 1.4, shoulderTiltDeg: 16 });
  assert.equal(second.neckRatio, 0.9);
  assert.equal(second.depthRatio, 1.1);
  assert.equal(second.shoulderTiltDeg, 4);
});

test("calcEyeAspectRatio menghitung rasio bukaan mata", () => {
  const face: NormalizedLandmark[] = Array.from({ length: 200 }, () => ({
    x: 0,
    y: 0,
    z: 0,
  }));
  face[33] = { x: 0.3, y: 0.5, z: 0 };
  face[133] = { x: 0.5, y: 0.5, z: 0 };
  face[160] = { x: 0.36, y: 0.47, z: 0 };
  face[158] = { x: 0.44, y: 0.47, z: 0 };
  face[153] = { x: 0.44, y: 0.53, z: 0 };
  face[144] = { x: 0.36, y: 0.53, z: 0 };

  const ear = calcEyeAspectRatio(face);
  assert.equal(ear, 0.3);
});

