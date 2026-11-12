/**
 * Kinematic Posture & Pose Heuristics Engine (100% On-Device MediaPipe)
 * CampusFlow PWA — Branch feat/vision-guard
 */

import type { PostureBaseline } from "@/types";

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
  rawMetrics?: {
    torsoNeckAngleDiff: number;
    shoulderDeltaY: number;
  };
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

export const VISION_THRESHOLDS = {
  MIN_CALIBRATION_VISIBILITY: 0.35,
  MIN_PRESENT_VISIBILITY: 0.3,
  SLOUCH_NECK_RATIO: 0.78,
  SLOUCH_TORSO_ANGLE_DIFF_DEG: 15.0,
  SLOUCH_SHOULDER_DROP_Y: 0.08,
  TOO_CLOSE_DEPTH_RATIO: 1.28,
  ASYMMETRIC_TILT_DEG: 12.0,
  OVERHEAD_ELBOW_MIN_DEG: 120,
  STAND_UP_SHOULDER_DELTA_Y: 0.2,
  ABSENT_VISIBILITY_THRESHOLD: 0.25,
  EMA_ALPHA: 0.25,
  CALIBRATION_TARGET_FRAMES: 60,
} as const;

export const POSTURE_BASELINE_STORAGE_KEY = "campusflow_posture_baseline";
const FALLBACK_BASELINE_KEY = "cf_posture_baseline";

/**
 * Menghitung jarak Euclidean 2D antara dua landmark.
 */
export function calcDistance2D(a: NormalizedLandmark, b: NormalizedLandmark): number {
  return Math.hypot(a.x - b.x, a.y - b.y);
}

/**
 * Menghitung sudut derajat pada titik tengah B yang dibentuk oleh segmen A-B dan C-B.
 */
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

/**
 * Mengambil satu frame data untuk baseline kalibrasi jika visibility bahu > 0.6.
 */
export function extractFrameBaseline(landmarks: NormalizedLandmark[]): {
  shoulderWidth: number;
  shoulderY: number;
  neckVerticalDist: number;
  torsoNeckAngle: number;
} | null {
  const nose = landmarks[POSE_LANDMARK_INDICES.NOSE];
  const leftEar = landmarks[POSE_LANDMARK_INDICES.LEFT_EAR];
  const rightEar = landmarks[POSE_LANDMARK_INDICES.RIGHT_EAR];
  const leftSh = landmarks[POSE_LANDMARK_INDICES.LEFT_SHOULDER];
  const rightSh = landmarks[POSE_LANDMARK_INDICES.RIGHT_SHOULDER];
  const leftHip = landmarks[POSE_LANDMARK_INDICES.LEFT_HIP];
  const rightHip = landmarks[POSE_LANDMARK_INDICES.RIGHT_HIP];

  if (!leftSh || !rightSh) {
    return null;
  }

  const leftVis = leftSh.visibility ?? 1;
  const rightVis = rightSh.visibility ?? 1;
  if (
    leftVis < VISION_THRESHOLDS.MIN_CALIBRATION_VISIBILITY ||
    rightVis < VISION_THRESHOLDS.MIN_CALIBRATION_VISIBILITY
  ) {
    return null;
  }

  const shoulderWidth = calcDistance2D(leftSh, rightSh);
  const shoulderY = (leftSh.y + rightSh.y) / 2;

  // Gunakan telinga jika terlihat, fallback ke hidung jika tertutup rambut/headset/bayangan
  const hasEars =
    leftEar &&
    rightEar &&
    (leftEar.visibility ?? 1) > 0.35 &&
    (rightEar.visibility ?? 1) > 0.35;

  const earY = hasEars ? (leftEar.y + rightEar.y) / 2 : (nose?.y ?? shoulderY - 0.15);
  const earX = hasEars ? (leftEar.x + rightEar.x) / 2 : (nose?.x ?? (leftSh.x + rightSh.x) / 2);
  const neckVerticalDist = Math.max(0.05, shoulderY - earY);

  const midEar: NormalizedLandmark = { x: earX, y: earY, z: 0 };
  const midSh: NormalizedLandmark = { x: (leftSh.x + rightSh.x) / 2, y: shoulderY, z: 0 };

  let torsoNeckAngle = 180;
  if (leftHip && rightHip && (leftHip.visibility ?? 0) > 0.25 && (rightHip.visibility ?? 0) > 0.25) {
    const midHip: NormalizedLandmark = {
      x: (leftHip.x + rightHip.x) / 2,
      y: (leftHip.y + rightHip.y) / 2,
      z: 0,
    };
    torsoNeckAngle = calcAngleDegrees(midEar, midSh, midHip);
  }

  return {
    shoulderWidth,
    shoulderY,
    neckVerticalDist,
    torsoNeckAngle,
  };
}

/**
 * Akumulator kalibrasi 5 detik (target 100 frame valid).
 */
export class BaselineCalibrator {
  private samples: Array<{
    shoulderWidth: number;
    shoulderY: number;
    neckVerticalDist: number;
    torsoNeckAngle: number;
  }> = [];

  private targetFrames: number;

  constructor(targetFrames: number = VISION_THRESHOLDS.CALIBRATION_TARGET_FRAMES) {
    this.targetFrames = targetFrames;
  }

  public addFrame(landmarks: NormalizedLandmark[]): {
    valid: boolean;
    collected: number;
    target: number;
    progress: number;
  } {
    const sample = extractFrameBaseline(landmarks);
    if (sample) {
      this.samples.push(sample);
    }
    return {
      valid: sample !== null,
      collected: this.samples.length,
      target: this.targetFrames,
      progress: Math.min(1, this.samples.length / this.targetFrames),
    };
  }

  public isComplete(): boolean {
    return this.samples.length >= this.targetFrames;
  }

  public getProgress(): number {
    return Math.min(1, this.samples.length / this.targetFrames);
  }

  public getCount(): number {
    return this.samples.length;
  }

  public finalize(): PostureBaseline | null {
    if (this.samples.length === 0) return null;

    const count = this.samples.length;
    const totals = this.samples.reduce(
      (acc, s) => ({
        shoulderWidth: acc.shoulderWidth + s.shoulderWidth,
        shoulderY: acc.shoulderY + s.shoulderY,
        neckVerticalDist: acc.neckVerticalDist + s.neckVerticalDist,
        torsoNeckAngle: acc.torsoNeckAngle + s.torsoNeckAngle,
      }),
      { shoulderWidth: 0, shoulderY: 0, neckVerticalDist: 0, torsoNeckAngle: 0 }
    );

    const baseline: PostureBaseline = {
      shoulderWidth: Number((totals.shoulderWidth / count).toFixed(4)),
      shoulderY: Number((totals.shoulderY / count).toFixed(4)),
      neckVerticalDist: Number((totals.neckVerticalDist / count).toFixed(4)),
      torsoNeckAngle: Number((totals.torsoNeckAngle / count).toFixed(2)),
      timestamp: Date.now(),
    };

    saveBaselineToStorage(baseline);
    return baseline;
  }

  public reset(): void {
    this.samples = [];
  }
}

/**
 * Simpan baseline kalibrasi ke LocalStorage.
 */
export function saveBaselineToStorage(baseline: PostureBaseline): void {
  if (typeof localStorage === "undefined") return;
  const json = JSON.stringify(baseline);
  try {
    localStorage.setItem(POSTURE_BASELINE_STORAGE_KEY, json);
    localStorage.setItem(FALLBACK_BASELINE_KEY, json);
  } catch (err) {
    console.warn("Gagal menyimpan baseline ke localStorage:", err);
  }
}

/**
 * Muat baseline kalibrasi dari LocalStorage.
 */
export function loadBaselineFromStorage(): PostureBaseline | null {
  if (typeof localStorage === "undefined") return null;
  try {
    const raw =
      localStorage.getItem(POSTURE_BASELINE_STORAGE_KEY) ||
      localStorage.getItem(FALLBACK_BASELINE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as PostureBaseline;
    if (
      typeof parsed?.shoulderWidth === "number" &&
      typeof parsed?.shoulderY === "number" &&
      typeof parsed?.neckVerticalDist === "number"
    ) {
      return parsed;
    }
    return null;
  } catch {
    return null;
  }
}

/**
 * Hapus baseline dari LocalStorage.
 */
export function clearBaselineFromStorage(): void {
  if (typeof localStorage === "undefined") return;
  try {
    localStorage.removeItem(POSTURE_BASELINE_STORAGE_KEY);
    localStorage.removeItem(FALLBACK_BASELINE_KEY);
  } catch {
    // ignore
  }
}

/**
 * Exponential Moving Average (EMA, alpha = 0.25) untuk memperhalus noise frame kamera.
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

  public getState(): PostureMetrics | null {
    return this.state;
  }

  public reset(): void {
    this.state = null;
  }
}

/**
 * Mengevaluasi satu frame postur real-time terhadap baseline kalibrasi pengguna.
 */
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
  const leftHip = landmarks[POSE_LANDMARK_INDICES.LEFT_HIP];
  const rightHip = landmarks[POSE_LANDMARK_INDICES.RIGHT_HIP];

  const noseVis = nose?.visibility ?? 0;
  const leftShVis = leftSh?.visibility ?? 0;
  const rightShVis = rightSh?.visibility ?? 0;

  // Kehadiran user di depan kamera
  const isPresent =
    noseVis > VISION_THRESHOLDS.MIN_PRESENT_VISIBILITY &&
    leftShVis > VISION_THRESHOLDS.MIN_PRESENT_VISIBILITY &&
    rightShVis > VISION_THRESHOLDS.MIN_PRESENT_VISIBILITY &&
    Boolean(rightSh && leftEar && rightEar);

  // Deteksi berdiri atau meninggalkan meja
  const isStandingUpByVisibility =
    noseVis < VISION_THRESHOLDS.ABSENT_VISIBILITY_THRESHOLD &&
    leftShVis < VISION_THRESHOLDS.ABSENT_VISIBILITY_THRESHOLD;

  if (!isPresent) {
    return {
      isPresent: false,
      isSlouching: false,
      isTooClose: false,
      isLeaningAsymmetric: false,
      isOverheadStretchValid: false,
      isStandingUp: true || isStandingUpByVisibility,
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

  // Cek sudut torso-leher jika hips terdeteksi
  let torsoAngleDiff = 0;
  if (leftHip && rightHip && (leftHip.visibility ?? 0) > 0.3) {
    const midEar: NormalizedLandmark = { x: (leftEar.x + rightEar.x) / 2, y: currEarY, z: 0 };
    const midSh: NormalizedLandmark = { x: (leftSh.x + rightSh.x) / 2, y: currShoulderY, z: 0 };
    const midHip: NormalizedLandmark = {
      x: (leftHip.x + rightHip.x) / 2,
      y: (leftHip.y + rightHip.y) / 2,
      z: 0,
    };
    const currTorsoAngle = calcAngleDegrees(midEar, midSh, midHip);
    torsoAngleDiff = Math.abs(currTorsoAngle - baseline.torsoNeckAngle);
  }

  const shoulderDeltaY = currShoulderY - baseline.shoulderY;

  // Evaluasi Heuristik Postur
  const isSlouching =
    neckRatio < VISION_THRESHOLDS.SLOUCH_NECK_RATIO ||
    torsoAngleDiff > VISION_THRESHOLDS.SLOUCH_TORSO_ANGLE_DIFF_DEG ||
    shoulderDeltaY > VISION_THRESHOLDS.SLOUCH_SHOULDER_DROP_Y;

  const isTooClose = depthRatio >= VISION_THRESHOLDS.TOO_CLOSE_DEPTH_RATIO;
  const isLeaningAsymmetric = shoulderTiltDeg > VISION_THRESHOLDS.ASYMMETRIC_TILT_DEG;

  // Active Break Pose 1: Overhead Stretch Valid
  const hasArms = Boolean(leftElb && rightElb && leftWrist && rightWrist);
  const leftElbowAngle = hasArms ? calcAngleDegrees(leftSh, leftElb, leftWrist) : 0;
  const rightElbowAngle = hasArms ? calcAngleDegrees(rightSh, rightElb, rightWrist) : 0;

  const isOverheadStretchValid =
    hasArms &&
    (leftWrist.y < nose.y || leftWrist.y < 0.3) &&
    (rightWrist.y < nose.y || rightWrist.y < 0.3) &&
    leftWrist.y < leftSh.y &&
    rightWrist.y < rightSh.y &&
    leftElbowAngle > VISION_THRESHOLDS.OVERHEAD_ELBOW_MIN_DEG &&
    rightElbowAngle > VISION_THRESHOLDS.OVERHEAD_ELBOW_MIN_DEG;

  // Active Break Pose 2: Standing Up
  const isStandingUp =
    currShoulderY < baseline.shoulderY - VISION_THRESHOLDS.STAND_UP_SHOULDER_DELTA_Y ||
    isStandingUpByVisibility;

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
    rawMetrics: {
      torsoNeckAngleDiff: Number(torsoAngleDiff.toFixed(1)),
      shoulderDeltaY: Number(shoulderDeltaY.toFixed(3)),
    },
  };
}

/**
 * Estimasi jarak fisik mata ke layar monitor dalam Centimeter (cm)
 * berdasarkan rasio lebar bahu aktual terhadap baseline (standar ergonomis OSHA 50-70 cm).
 */
export function estimateMonitorDistanceCm(
  depthRatio: number,
  baseDistanceCm: number = 60
): { distanceCm: number; status: "TERLALU_DEKAT" | "IDEAL" | "JAUH" } {
  const safeDepth = Math.max(0.5, Math.min(2.5, depthRatio));
  const estimatedCm = Math.round(baseDistanceCm / safeDepth);

  if (depthRatio >= VISION_THRESHOLDS.TOO_CLOSE_DEPTH_RATIO || estimatedCm < 48) {
    return { distanceCm: estimatedCm, status: "TERLALU_DEKAT" };
  }
  if (depthRatio <= 0.85 || estimatedCm > 75) {
    return { distanceCm: estimatedCm, status: "JAUH" };
  }
  return { distanceCm: estimatedCm, status: "IDEAL" };
}

/**
 * Menghitung Skor Kesehatan Postur Dinamis (0 - 100%)
 */
export function calculatePostureHealthScore(
  goodSeconds: number,
  totalSeconds: number
): { score: number; grade: "SANGAT_BAIK" | "BAIK" | "PERLU_PERBAIKAN" } {
  if (totalSeconds <= 0) {
    return { score: 100, grade: "SANGAT_BAIK" };
  }
  const ratio = Math.max(0, Math.min(1, goodSeconds / totalSeconds));
  const score = Math.round(ratio * 100);

  if (score >= 85) return { score, grade: "SANGAT_BAIK" };
  if (score >= 65) return { score, grade: "BAIK" };
  return { score, grade: "PERLU_PERBAIKAN" };
}

