# VISION_SPEC.md — Spesifikasi Computer Vision & Heuristik Kinematika

> **PENANGGUNG JAWAB:** Ibra (`@flyingdutchman`)  
> **PRINSIP UTAMA:** *Zero Image Dataset Training* & *100% On-Device Privacy* (WebGL/WASM). Tidak ada gambar atau video webcam yang diunggah ke server.

---

## 1. Indeks Landmark MediaPipe Wajib

Saat kamera laptop aktif pada 20–30 FPS, `PoseLandmarker` menghasilkan 33 titik `{x, y, z, visibility}` ternormalisasi `[0.0, 1.0]` dan `FaceLandmarker` menghasilkan 478 titik wajah:

| Indeks Landmark | Nama Anatomi | Fungsi pada CampusFlow |
|---|---|---|
| `Pose [0]` | `NOSE` | Acuan tinggi kepala & syarat pergelangan tangan saat *Overhead Arm Stretch* |
| `Pose [7]` & `[8]` | `LEFT_EAR` & `RIGHT_EAR` | Titik ujung atas vektor leher untuk sudut kepala-leher |
| `Pose [11]` & `[12]` | `LEFT_SHOULDER` & `RIGHT_SHOULDER` | Lebar bahu (estimasi jarak ke layar), kemiringan bahu, tinggi duduk |
| `Pose [13]` & `[14]` | `LEFT_ELBOW` & `RIGHT_ELBOW` | Validasi sudut pelurusan siku ($> 140^\circ\text{–}145^\circ$) saat Active Break |
| `Pose [15]` & `[16]` | `LEFT_WRIST` & `RIGHT_WRIST` | Validasi posisi tangan di atas hidung |
| `Pose [23]` & `[24]` | `LEFT_HIP` & `RIGHT_HIP` | Vektor torso & validasi berdiri dari kursi |
| `FaceMesh [33, 160, 158, 133, 153, 144]` | `LEFT_EYE_CONTOUR` | Perhitungan *Eye Aspect Ratio* (EAR) untuk kelelahan mata |

---

## 2. Protokol Kalibrasi Baseline 5 Detik (100 Frame)

Sebelum sesi belajar dimulai, pengguna duduk tegak menghadap layar selama **5 detik** (100 sampel frame) untuk menyimpan objek `PostureBaseline`:
1. $W_{base} = \sqrt{(x_{11} - x_{12})^2 + (y_{11} - y_{12})^2}$ (*Baseline Shoulder Width*)
2. $Y_{sh\_base} = (y_{11} + y_{12}) / 2$ (*Baseline Shoulder Y-Level*)
3. $D_{neck\_base} = \max(0.05,\; Y_{sh\_base} - (y_7 + y_8) / 2)$ (*Baseline Ear-Shoulder Vertical Distance*)
4. $\theta_{base}$ = sudut antara vektor Pinggul→Bahu dan vektor Bahu→Telinga.

---

## 3. Rumus & Ambang Batas Real-Time (Evaluasi 2 Hz / 500 ms, EMA $\alpha = 0.25$)

| Kondisi Terdeteksi | Rumus Matematis | Ambang Batas & Aksi |
|---|---|---|
| **1. Membungkuk (*Forward Head / Slouching*)** | $R_{neck} = \frac{Y_{sh\_curr} - Y_{ear\_curr}}{D_{neck\_base}}$<br>$\Delta\theta = |\theta_{curr} - \theta_{base}|$ | `neckRatio < 0.78` atau `currShoulderY - baseline.shoulderY > 0.08` atau $\Delta\theta > 15^\circ$ selama $\ge 180$ detik → `slouchCount++`, border kuning lembut & toast peringatan. |
| **2. Terlalu Dekat Layar (*Eye-Strain*)** | $R_{depth} = W_{curr} / W_{base}$ | `depthRatio >= 1.28` selama $\ge 60$ detik → peringatan *"Jaga Jarak Mata dari Layar"*. |
| **3. Bahu Miring (*Asymmetric Leaning*)** | $\theta_{roll} = \arctan2(|y_{11}-y_{12}|, |x_{11}-x_{12}|) \cdot \frac{180}{\pi}$ | `shoulderTiltDeg > 12.0` selama $\ge 120$ detik → peringatan postur asimetris. |
| **4. Duduk Statis Terlalu Lama** | $\text{Var}(X_{sh}, Y_{sh}) < 0.015$ dan `visibility(11,12) > 0.65` | Durasi $\ge 50$ menit (atau 15 detik pada `DEMO_MODE`) tanpa jeda $\ge 3$ menit → kunci layar & buka **ActiveBreakModal**. |
| **5. Active Break: Overhead Arm Stretch** | `y15 < y0 && y16 < y0` dan sudut siku kiri & kanan $> 140^\circ$ (target ideal $> 145^\circ$) | Tahan kontinu **5 detik × 3 repetisi** → skeleton berubah hijau `#10B981`. |
| **6. Active Break: Stand-Up & Step-Away** | `Y_sh_curr < Y_sh_base - 0.20` ATAU `visibility(0,11,12) < 0.25` | Berdiri/meninggalkan kursi sesuai durasi jeda aktif → membuka kunci sesi & mencatat 1 jeda selesai. |

---

## 4. Referensi Kode Produksi (`poseHeuristics.ts`)

Kode berikut diletakkan pada `shared/vision/poseHeuristics.ts` (atau `frontend/src/utils/poseHeuristics.ts`) untuk dikonsumsi `VisionGuard.tsx` dan `ActiveBreakModal.tsx`:

```ts
export interface NormalizedLandmark {
  x: number;
  y: number;
  z: number;
  visibility?: number;
}

export interface PostureBaseline {
  shoulderWidth: number;
  shoulderY: number;
  neckVerticalDist: number;
  torsoNeckAngle: number;
  timestamp: number;
}

export interface PostureEvaluationResult {
  isPresent: boolean;
  isSlouching: boolean;
  isTooClose: boolean;
  isLeaningAsymmetric: boolean;
  isOverheadStretchValid: boolean;
  isStandingUp: boolean;
  metrics: {
    neckRatio: number;
    depthRatio: number;
    shoulderTiltDeg: number;
  };
}

export function calcDistance2D(a: NormalizedLandmark, b: NormalizedLandmark): number {
  return Math.hypot(a.x - b.x, a.y - b.y);
}

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

export function computePostureBaseline(landmarks: NormalizedLandmark[]): PostureBaseline | null {
  const leftEar = landmarks[7], rightEar = landmarks[8];
  const leftSh = landmarks[11], rightSh = landmarks[12];
  const leftHip = landmarks[23], rightHip = landmarks[24];

  if ((leftSh.visibility ?? 0) < 0.6 || (rightSh.visibility ?? 0) < 0.6) return null;

  const shoulderWidth = calcDistance2D(leftSh, rightSh);
  const shoulderY = (leftSh.y + rightSh.y) / 2;
  const earY = (leftEar.y + rightEar.y) / 2;
  const neckVerticalDist = Math.max(0.05, shoulderY - earY);

  const midEar = { x: (leftEar.x + rightEar.x) / 2, y: earY, z: 0 };
  const midSh = { x: (leftSh.x + rightSh.x) / 2, y: shoulderY, z: 0 };
  const midHip = { x: (leftHip.x + rightHip.x) / 2, y: (leftHip.y + rightHip.y) / 2, z: 0 };
  const torsoNeckAngle = calcAngleDegrees(midEar, midSh, midHip);

  return { shoulderWidth, shoulderY, neckVerticalDist, torsoNeckAngle, timestamp: Date.now() };
}

export function evaluatePostureFrame(
  landmarks: NormalizedLandmark[],
  baseline: PostureBaseline
): PostureEvaluationResult {
  const nose = landmarks[0];
  const leftEar = landmarks[7], rightEar = landmarks[8];
  const leftSh = landmarks[11], rightSh = landmarks[12];
  const leftElb = landmarks[13], rightElb = landmarks[14];
  const leftWrist = landmarks[15], rightWrist = landmarks[16];

  const isPresent = (nose?.visibility ?? 0) > 0.55 && (leftSh?.visibility ?? 0) > 0.55;
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
  const depthRatio = currShoulderWidth / baseline.shoulderWidth;
  const shoulderTiltDeg =
    (Math.atan2(Math.abs(leftSh.y - rightSh.y), Math.abs(leftSh.x - rightSh.x)) * 180) / Math.PI;

  const isSlouching = neckRatio < 0.78 || currShoulderY - baseline.shoulderY > 0.08;
  const isTooClose = depthRatio >= 1.28;
  const isLeaningAsymmetric = shoulderTiltDeg > 12.0;

  const leftElbowAngle = calcAngleDegrees(leftSh, leftElb, leftWrist);
  const rightElbowAngle = calcAngleDegrees(rightSh, rightElb, rightWrist);
  const isOverheadStretchValid =
    leftWrist.y < nose.y &&
    rightWrist.y < nose.y &&
    leftElbowAngle > 140 &&
    rightElbowAngle > 140;

  const isStandingUp = currShoulderY < baseline.shoulderY - 0.20;

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
```
