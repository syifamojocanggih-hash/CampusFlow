/**
 * Modul Heuristik Kinematika & Vision AI CampusFlow (100% On-Device).
 * Dikelola di branch `main` (Ibra @flyingdutchman) dan diturunkan ke `frontend`.
 * Referensi spesifikasi: docs/vision/VISION_SPEC.md
 */
import type { PostureBaseline } from "../contracts/index.ts";

export interface NormalizedLandmark {
  x: number;
  y: number;
  z: number;
  visibility?: number;
}

export interface PostureMetrics {
  neckRatio: number;
  depthRatio: number;
  shoulderTiltDeg: number;
}

export interface PostureEvaluationResult {
  isPresent: boolean;
  isSlouching: boolean;
  isTooClose: boolean;
  isLeaningAsymmetric: boolean;
  isOverheadStretchValid: boolean;
  isStandingUp: boolean;
  metrics: PostureMetrics;
}

export const POSE_LANDMARK_INDICES = {
  NOSE: 0,
  LEFT_EAR: 7,
  RIGHT_EAR: 8,
  LEFT_SHOULDER: 11,
  RIGHT_SHOULDER: 12,
  LEFT_ELBOW: 13,
  RIGHT_ELBOW: 14,
  LEFT_WRIST: 15,
  RIGHT_WRIST: 16,
  LEFT_HIP: 23,
  RIGHT_HIP: 24,
} as const;

export const FACE_EYE_CONTOUR_INDICES = [33, 160, 158, 133, 153, 144] as const;

export const VISION_THRESHOLDS = {
  MIN_CALIBRATION_VISIBILITY: 0.6,
  MIN_PRESENT_VISIBILITY: 0.55,
  SLOUCH_NECK_RATIO: 0.78,
  SLOUCH_SHOULDER_DROP_Y: 0.08,
  TOO_CLOSE_DEPTH_RATIO: 1.28,
  ASYMMETRIC_TILT_DEG: 12.0,
  OVERHEAD_ELBOW_MIN_DEG: 140,
  STAND_UP_SHOULDER_DELTA_Y: 0.2,
  EMA_ALPHA: 0.25,
  EAR_BLINK_THRESHOLD: 0.21,
} as const;

/** Menghitung jarak Euclidean 2D antara dua titik landmark ternormalisasi. */
export function calcDistance2D(a: NormalizedLandmark, b: NormalizedLandmark): number {
  return Math.hypot(a.x - b.x, a.y - b.y);
}

/** Menghitung sudut (derajat) pada titik tengah B yang dibentuk segmen A-B dan C-B. */
export function calcAngleDegrees(
  a: NormalizedLandmark,
  b: NormalizedLandmark,
  c: NormalizedLandmark
): number {
  const v1 = { x: a.x - b.x, y: a.y - b.y };
  const v2 = { x: c.x - b.x, y: c.y - b.y };
  const dot = v1.x * v2.x + v1.y * v2.y;
  const mag1 = Math.hypot(v1.x, v1.y);
  const mag2 = Math.hypot(v2.x, v2.y);
  if (mag1 === 0 || mag2 === 0) return 180;
  const cosTheta = Math.max(-1, Math.min(1, dot / (mag1 * mag2)));
  return (Math.acos(cosTheta) * 180) / Math.PI;
}

/** Menghitung baseline duduk tegak dari 33 landmark Pose MediaPipe. */
export function computePostureBaseline(landmarks: NormalizedLandmark[]): PostureBaseline | null {
  const leftEar = landmarks[POSE_LANDMARK_INDICES.LEFT_EAR];
  const rightEar = landmarks[POSE_LANDMARK_INDICES.RIGHT_EAR];
  const leftSh = landmarks[POSE_LANDMARK_INDICES.LEFT_SHOULDER];
  const rightSh = landmarks[POSE_LANDMARK_INDICES.RIGHT_SHOULDER];
  const leftHip = landmarks[POSE_LANDMARK_INDICES.LEFT_HIP];
  const rightHip = landmarks[POSE_LANDMARK_INDICES.RIGHT_HIP];

  if (!leftEar || !rightEar || !leftSh || !rightSh || !leftHip || !rightHip) {
    return null;
  }
  if (
    (leftSh.visibility ?? 0) < VISION_THRESHOLDS.MIN_CALIBRATION_VISIBILITY ||
    (rightSh.visibility ?? 0) < VISION_THRESHOLDS.MIN_CALIBRATION_VISIBILITY
  ) {
    return null;
  }

  const shoulderWidth = calcDistance2D(leftSh, rightSh);
  const shoulderY = (leftSh.y + rightSh.y) / 2;
  const earY = (leftEar.y + rightEar.y) / 2;
  const neckVerticalDist = Math.max(0.05, shoulderY - earY);

  const midEar: NormalizedLandmark = { x: (leftEar.x + rightEar.x) / 2, y: earY, z: 0 };
  const midSh: NormalizedLandmark = { x: (leftSh.x + rightSh.x) / 2, y: shoulderY, z: 0 };
  const midHip: NormalizedLandmark = {
    x: (leftHip.x + rightHip.x) / 2,
    y: (leftHip.y + rightHip.y) / 2,
    z: 0,
  };
  const torsoNeckAngle = calcAngleDegrees(midEar, midSh, midHip);

  return {
    shoulderWidth,
    shoulderY,
    neckVerticalDist,
    torsoNeckAngle,
    timestamp: Date.now(),
  };
}

/** Mengevaluasi satu frame postur real-time terhadap baseline kalibrasi pengguna. */
export function evaluatePostureFrame(
  landmarks: NormalizedLandmark[],
  baseline: PostureBaseline
): PostureEvaluationResult {
  const nose = landmarks[POSE_LANDMARK_INDICES.NOSE];
  const leftEar = landmarks[POSE_LANDMARK_INDICES.LEFT_EAR];
  const rightEar = landmarks[POSE_LANDMARK_INDICES.RIGHT_EAR];
  const leftSh = landmarks[POSE_LANDMARK_INDICES.LEFT_SHOULDER];
  const rightSh = landmarks[POSE_LANDMARK_INDICES.RIGHT_SHOULDER];
  const leftElb = landmarks[POSE_LANDMARK_INDICES.LEFT_ELBOW];
  const rightElb = landmarks[POSE_LANDMARK_INDICES.RIGHT_ELBOW];
  const leftWrist = landmarks[POSE_LANDMARK_INDICES.LEFT_WRIST];
  const rightWrist = landmarks[POSE_LANDMARK_INDICES.RIGHT_WRIST];

  const isPresent =
    (nose?.visibility ?? 0) > VISION_THRESHOLDS.MIN_PRESENT_VISIBILITY &&
    (leftSh?.visibility ?? 0) > VISION_THRESHOLDS.MIN_PRESENT_VISIBILITY &&
    Boolean(rightSh && leftEar && rightEar);

  if (!isPresent) {
    return {
      isPresent: false,
      isSlouching: false,
      isTooClose: false,
      isLeaningAsymmetric: false,
      isOverheadStretchValid: false,
      isStandingUp: true,
      metrics: { neckRatio: 1, depthRatio: 1, shoulderTiltDeg: 0 },
    };
  }

  const currShoulderWidth = calcDistance2D(leftSh, rightSh);
  const currShoulderY = (leftSh.y + rightSh.y) / 2;
  const currEarY = (leftEar.y + rightEar.y) / 2;
  const currNeckDist = currShoulderY - currEarY;

  const neckRatio = currNeckDist / baseline.neckVerticalDist;
  const depthRatio = currShoulderWidth / Math.max(0.01, baseline.shoulderWidth);
  const shoulderTiltDeg =
    (Math.atan2(Math.abs(leftSh.y - rightSh.y), Math.abs(leftSh.x - rightSh.x)) * 180) / Math.PI;

  const isSlouching =
    neckRatio < VISION_THRESHOLDS.SLOUCH_NECK_RATIO ||
    currShoulderY - baseline.shoulderY > VISION_THRESHOLDS.SLOUCH_SHOULDER_DROP_Y;
  const isTooClose = depthRatio >= VISION_THRESHOLDS.TOO_CLOSE_DEPTH_RATIO;
  const isLeaningAsymmetric = shoulderTiltDeg > VISION_THRESHOLDS.ASYMMETRIC_TILT_DEG;

  const hasArms = Boolean(leftElb && rightElb && leftWrist && rightWrist);
  const leftElbowAngle = hasArms ? calcAngleDegrees(leftSh, leftElb, leftWrist) : 0;
  const rightElbowAngle = hasArms ? calcAngleDegrees(rightSh, rightElb, rightWrist) : 0;
  const isOverheadStretchValid =
    hasArms &&
    leftWrist.y < nose.y &&
    rightWrist.y < nose.y &&
    leftElbowAngle > VISION_THRESHOLDS.OVERHEAD_ELBOW_MIN_DEG &&
    rightElbowAngle > VISION_THRESHOLDS.OVERHEAD_ELBOW_MIN_DEG;

  const isStandingUp =
    currShoulderY < baseline.shoulderY - VISION_THRESHOLDS.STAND_UP_SHOULDER_DELTA_Y;

  return {
    isPresent,
    isSlouching,
    isTooClose,
    isLeaningAsymmetric,
    isOverheadStretchValid,
    isStandingUp,
    metrics: {
      neckRatio: Number(neckRatio.toFixed(2)),
      depthRatio: Number(depthRatio.toFixed(2)),
      shoulderTiltDeg: Number(shoulderTiltDeg.toFixed(1)),
    },
  };
}

/** Menghitung Eye Aspect Ratio (EAR) dari 478 FaceMesh landmarks untuk deteksi kelelahan mata. */
export function calcEyeAspectRatio(faceLandmarks: NormalizedLandmark[]): number | null {
  const [p1Idx, p2Idx, p3Idx, p4Idx, p5Idx, p6Idx] = FACE_EYE_CONTOUR_INDICES;
  const p1 = faceLandmarks[p1Idx];
  const p2 = faceLandmarks[p2Idx];
  const p3 = faceLandmarks[p3Idx];
  const p4 = faceLandmarks[p4Idx];
  const p5 = faceLandmarks[p5Idx];
  const p6 = faceLandmarks[p6Idx];

  if (!p1 || !p2 || !p3 || !p4 || !p5 || !p6) return null;

  const verticalA = calcDistance2D(p2, p6);
  const verticalB = calcDistance2D(p3, p5);
  const horizontal = calcDistance2D(p1, p4);
  if (horizontal === 0) return null;

  return Number(((verticalA + verticalB) / (2 * horizontal)).toFixed(3));
}

/**
 * Exponential Moving Average (EMA) untuk menstabilkan metrik 2 Hz agar tahan noise kamera.
 */
export class PostureEmaSmoother {
  private readonly alpha: number;
  private state: PostureMetrics | null = null;

  constructor(alpha: number = VISION_THRESHOLDS.EMA_ALPHA) {
    this.alpha = alpha;
  }

  public smooth(sample: PostureMetrics): PostureMetrics {
    if (!this.state) {
      this.state = { ...sample };
      return this.state;
    }

    const blend = (prev: number, curr: number) =>
      this.alpha * curr + (1 - this.alpha) * prev;

    this.state = {
      neckRatio: Number(blend(this.state.neckRatio, sample.neckRatio).toFixed(2)),
      depthRatio: Number(blend(this.state.depthRatio, sample.depthRatio).toFixed(2)),
      shoulderTiltDeg: Number(blend(this.state.shoulderTiltDeg, sample.shoulderTiltDeg).toFixed(1)),
    };
    return this.state;
  }

  public reset(): void {
    this.state = null;
  }
}

