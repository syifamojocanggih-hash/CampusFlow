import React, { useEffect, useRef, useState, useCallback } from "react";
import {
  FilesetResolver,
  PoseLandmarker,
  type NormalizedLandmark as MpNormalizedLandmark,
} from "@mediapipe/tasks-vision";
import {
  Camera,
  CameraOff,
  Shield,
  AlertTriangle,
  CheckCircle2,
  Sparkles,
  RefreshCw,
  Sliders,
  Play,
  Square,
  Activity,
  Check,
  Flame,
  UserCheck,
  Volume2,
  VolumeX,
  Ruler,
  Award,
  Users,
} from "lucide-react";
import { sound } from "@/utils/audioFeedback";
import {
  BaselineCalibrator,
  PostureEmaSmoother,
  evaluatePostureFrame,
  loadBaselineFromStorage,
  clearBaselineFromStorage,
  estimateMonitorDistanceCm,
  calculatePostureHealthScore,
  selectPrimaryUserPose,
  type TrackedPersonAnchor,
  type NormalizedLandmark,
  type PostureEvaluationResult,
} from "@/utils/poseHeuristics";
import { CLINICAL_CONSTANTS, type PostureBaseline, type SedentarySessionPayload } from "@/types";
import { api } from "@/lib/api";
import { osScreenLock, useOsScreenLock } from "@/utils/osScreenLock";
import { Lock } from "lucide-react";

interface VisionGuardProps {
  onSessionComplete?: (payload: SedentarySessionPayload) => void;
  className?: string;
  autoStartCamera?: boolean;
  onActiveBreakCompleted?: () => void;
  forceBreakLock?: boolean;
  lockReason?: string;
  isStrictOsLock?: boolean;
}

const DEFAULT_BREAK_BASELINE: PostureBaseline = {
  shoulderWidth: 0.28,
  shoulderY: 0.65,
  neckVerticalDist: 0.16,
  torsoNeckAngle: 175,
  timestamp: Date.now(),
};

// Landmark connectivity for skeleton drawing
const SKELETON_CONNECTIONS: [number, number][] = [
  [0, 7], // Nose - Left Ear
  [0, 8], // Nose - Right Ear
  [7, 11], // Left Ear - Left Shoulder
  [8, 12], // Right Ear - Right Shoulder
  [11, 12], // Left Shoulder - Right Shoulder
  [11, 13], // Left Shoulder - Left Elbow
  [13, 15], // Left Elbow - Left Wrist
  [12, 14], // Right Shoulder - Right Elbow
  [14, 16], // Right Elbow - Right Wrist
  [11, 23], // Left Shoulder - Left Hip
  [12, 24], // Right Shoulder - Right Hip
  [23, 24], // Left Hip - Right Hip
];

export const VisionGuard: React.FC<VisionGuardProps> = ({
  onSessionComplete,
  className = "",
  autoStartCamera = false,
  onActiveBreakCompleted,
  forceBreakLock = false,
  lockReason,
  isStrictOsLock = false,
}) => {
  const osLockState = useOsScreenLock();
  // DOM References
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const animationFrameIdRef = useRef<number | null>(null);
  const landmarkerRef = useRef<PoseLandmarker | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  // Calibration & Smoother
  const calibratorRef = useRef<BaselineCalibrator>(new BaselineCalibrator());
  const smootherRef = useRef<PostureEmaSmoother>(new PostureEmaSmoother(0.25));
  const postureStateRef = useRef<PostureEvaluationResult | null>(null);
  const lastTrackedAnchorRef = useRef<TrackedPersonAnchor | null>(null);

  // Configuration & Modes
  const [demoMode, setDemoMode] = useState<boolean>(true);
  const [isInitializing, setIsInitializing] = useState<boolean>(true);
  const [cameraPermissionError, setCameraPermissionError] = useState<string | null>(null);
  const [bystanderCount, setBystanderCount] = useState<number>(0);

  // Calibration State
  const [baseline, setBaseline] = useState<PostureBaseline | null>(() => loadBaselineFromStorage());
  const [isCalibrating, setIsCalibrating] = useState<boolean>(false);
  const [calibrationProgress, setCalibrationProgress] = useState<number>(0);
  const [calibrationCount, setCalibrationCount] = useState<number>(0);

  // FPS Monitoring
  const [currentFps, setCurrentFps] = useState<number>(0);
  const fpsFramesRef = useRef<number>(0);
  const fpsLastTimeRef = useRef<number>(performance.now());

  // Synchronized refs for the requestAnimationFrame inference loop (prevents stale closure bugs)
  const isCalibratingRef = useRef<boolean>(false);
  const baselineRef = useRef<PostureBaseline | null>(baseline);
  const isBreakLockedRef = useRef<boolean>(false);

  useEffect(() => {
    isCalibratingRef.current = isCalibrating;
  }, [isCalibrating]);

  useEffect(() => {
    baselineRef.current = baseline;
  }, [baseline]);

  // Active Session State
  const [sessionActive, setSessionActive] = useState<boolean>(false);
  const [sittingSeconds, setSittingSeconds] = useState<number>(0);
  const [goodPostureSeconds, setGoodPostureSeconds] = useState<number>(0);
  const [isMuted, setIsMuted] = useState<boolean>(sound.getMuted());
  const [postureState, setPostureState] = useState<PostureEvaluationResult | null>(null);
  const [poorPostureDurationSecs, setPoorPostureDurationSecs] = useState<number>(0);
  const [showWarningToast, setShowWarningToast] = useState<boolean>(false);
  const [warningMessage, setWarningMessage] = useState<string>("");

  const toggleMute = () => {
    const next = !isMuted;
    setIsMuted(next);
    sound.setMuted(next);
  };

  // Statistics
  const [slouchCount, setSlouchCount] = useState<number>(0);
  const [tooCloseCount, setTooCloseCount] = useState<number>(0);
  const neckRatioSamplesRef = useRef<number[]>([]);
  const sessionStartTimeRef = useRef<Date | null>(null);

  // Anti-Cheat Active Break Modal
  const [isBreakLocked, setIsBreakLocked] = useState<boolean>(
    () => Boolean(forceBreakLock || osScreenLock.getState().isLocked)
  );
  const [breakRepsCompleted, setBreakRepsCompleted] = useState<number>(0);
  const [currentRepHoldSeconds, setCurrentRepHoldSeconds] = useState<number>(0);
  const [standAwayDurationSecs, setStandAwayDurationSecs] = useState<number>(0);
  const [isHoldingStretch, setIsHoldingStretch] = useState<boolean>(false);
  const [breakSuccessToast, setBreakSuccessToast] = useState<boolean>(false);
  const [isCameraActive, setIsCameraActive] = useState<boolean>(false);

  useEffect(() => {
    isBreakLockedRef.current = isBreakLocked;
  }, [isBreakLocked]);

  // Synchronize with external forceBreakLock or global OS Screen Time Lock
  useEffect(() => {
    if ((forceBreakLock || osLockState.isLocked) && !isBreakLocked) {
      setIsBreakLocked(true);
      isBreakLockedRef.current = true;
      setBreakRepsCompleted(0);
      setCurrentRepHoldSeconds(0);
      setStandAwayDurationSecs(0);
    }
  }, [forceBreakLock, osLockState.isLocked, isBreakLocked]);

  // Ensure camera and MediaPipe inference loop run immediately whenever break lock is active
  useEffect(() => {
    if (isBreakLocked && !isInitializing) {
      if (!streamRef.current || !videoRef.current?.srcObject) {
        void startCamera();
      } else {
        startInferenceLoop();
      }
    }
  }, [isBreakLocked, isInitializing]);

  // Thresholds based on mode
  const sittingLimitSeconds = demoMode ? 15 : CLINICAL_CONSTANTS.ISOTEMPORAL_WORK_BOUT_MINS * 60;
  const slouchWarningTriggerSeconds = demoMode ? 4 : 180;
  const targetReps = 3;
  const targetHoldSeconds = demoMode ? 3 : 5;
  const targetStandAwaySeconds = demoMode ? 10 : 300; // 5 mins in normal mode

  // Initialize MediaPipe PoseLandmarker
  useEffect(() => {
    let isMounted = true;

    async function initVision() {
      try {
        setIsInitializing(true);

        // 1. Resolve WASM files (Local first, fallback to CDN)
        let vision;
        try {
          vision = await FilesetResolver.forVisionTasks("/wasm");
        } catch (wasmErr) {
          console.warn("[VisionGuard] Local /wasm failed, using CDN fallback:", wasmErr);
          vision = await FilesetResolver.forVisionTasks(
            "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.18/wasm"
          );
        }
        if (!isMounted) return;

        // 2. Load Model Asset (Local first, fallback to Google Storage CDN)
        const modelCandidates = [
          "/models/pose_landmarker_lite.task",
          "https://storage.googleapis.com/mediapipe-models/pose_landmarker/pose_landmarker_lite/float16/latest/pose_landmarker_lite.task",
        ];

        let landmarker: PoseLandmarker | null = null;
        for (const modelAssetPath of modelCandidates) {
          try {
            // Prefer GPU delegate for smooth 24+ FPS, fallback to CPU
            try {
              landmarker = await PoseLandmarker.createFromOptions(vision, {
                baseOptions: {
                  modelAssetPath,
                  delegate: "GPU",
                },
                runningMode: "VIDEO",
                numPoses: 3, // Mendeteksi multi-pose agar dapat mengisolasi pengguna utama dari orang di latar belakang
                minPoseDetectionConfidence: 0.45,
                minPosePresenceConfidence: 0.45,
                minTrackingConfidence: 0.45,
              });
            } catch (gpuErr) {
              console.warn("[VisionGuard] GPU delegate failed, trying CPU delegate:", gpuErr);
              landmarker = await PoseLandmarker.createFromOptions(vision, {
                baseOptions: {
                  modelAssetPath,
                  delegate: "CPU",
                },
                runningMode: "VIDEO",
                numPoses: 3, // Mendeteksi multi-pose agar dapat mengisolasi pengguna utama dari orang di latar belakang
                minPoseDetectionConfidence: 0.45,
                minPosePresenceConfidence: 0.45,
                minTrackingConfidence: 0.45,
              });
            }
            if (landmarker) {
              break;
            }
          } catch (modelErr) {
            console.warn(`[VisionGuard] Failed to load model from ${modelAssetPath}:`, modelErr);
          }
        }

        if (!landmarker) {
          throw new Error("Gagal menginisialisasi PoseLandmarker dari semua path model.");
        }

        if (isMounted) {
          landmarkerRef.current = landmarker;
          setIsInitializing(false);
          if (autoStartCamera || isBreakLockedRef.current || baselineRef.current) {
            await startCamera();
          } else if (streamRef.current && videoRef.current) {
            startInferenceLoop();
          }
        }
      } catch (err: unknown) {
        console.error("[VisionGuard] Gagal menginisialisasi MediaPipe:", err);
        if (isMounted) {
          setCameraPermissionError(
            "Gagal memuat model MediaPipe Vision. Periksa koneksi atau izin kamera."
          );
          setIsInitializing(false);
        }
      }
    }

    initVision();

    return () => {
      isMounted = false;
      stopCamera();
      if (landmarkerRef.current) {
        landmarkerRef.current.close();
      }
    };
  }, []);

  // Camera Management
  const startCamera = async () => {
    try {
      setCameraPermissionError(null);
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: 640 },
          height: { ideal: 480 },
          frameRate: { ideal: 60, min: 24 },
          facingMode: "user",
        },
        audio: false,
      });

      streamRef.current = stream;
      setIsCameraActive(true);
      if (videoRef.current) {
        const video = videoRef.current;
        video.srcObject = stream;

        const onReady = () => {
          video.play().catch((err) => console.warn("[VisionGuard] video.play() notice:", err));
          startInferenceLoop();
        };

        if (video.readyState >= 2) {
          onReady();
        } else {
          video.onloadedmetadata = onReady;
          video.onloadeddata = onReady;
          video.addEventListener("loadeddata", onReady, { once: true });
        }
      }
    } catch (err: unknown) {
      console.warn("[VisionGuard] Kamera tidak dapat diakses:", err);
      setCameraPermissionError(
        "Izin akses kamera ditolak atau kamera tidak ditemukan. Pastikan izin kamera aktif."
      );
    }
  };

  const stopCamera = () => {
    if (animationFrameIdRef.current) {
      cancelAnimationFrame(animationFrameIdRef.current);
      animationFrameIdRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setIsCameraActive(false);
  };

  // Synchronized Canvas Rendering
  const drawSkeleton = useCallback(
    (
      ctx: CanvasRenderingContext2D,
      landmarks: (MpNormalizedLandmark | NormalizedLandmark)[],
      width: number,
      height: number,
      color: string
    ) => {
      ctx.clearRect(0, 0, width, height);

      // Draw bone connections
      ctx.lineWidth = 3;
      ctx.strokeStyle = color;
      ctx.lineCap = "round";

      for (const [startIdx, endIdx] of SKELETON_CONNECTIONS) {
        const start = landmarks[startIdx];
        const end = landmarks[endIdx];
        if (
          start &&
          end &&
          (start.visibility ?? 1) > 0.4 &&
          (end.visibility ?? 1) > 0.4
        ) {
          ctx.beginPath();
          ctx.moveTo(start.x * width, start.y * height);
          ctx.lineTo(end.x * width, end.y * height);
          ctx.stroke();
        }
      }

      // Draw joint dots
      const trackedKeypoints = [0, 7, 8, 11, 12, 13, 14, 15, 16, 23, 24];
      for (const idx of trackedKeypoints) {
        const pt = landmarks[idx];
        if (pt && (pt.visibility ?? 1) > 0.4) {
          ctx.beginPath();
          ctx.arc(pt.x * width, pt.y * height, 5, 0, 2 * Math.PI);
          ctx.fillStyle = color;
          ctx.fill();
          ctx.lineWidth = 1.5;
          ctx.strokeStyle = "#FFFFFF";
          ctx.stroke();
        }
      }
    },
    []
  );

  // Main Inference Loop
  const startInferenceLoop = () => {
    if (!videoRef.current || !canvasRef.current || !landmarkerRef.current) return;

    if (animationFrameIdRef.current) {
      cancelAnimationFrame(animationFrameIdRef.current);
      animationFrameIdRef.current = null;
    }

    const video = videoRef.current;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    const landmarker = landmarkerRef.current;

    let lastVideoTime = -1;
    let lastInferenceTime = 0;

    const processFrame = () => {
      try {
        const now = performance.now();
        // Cek kesiapan frame: jika video aktif & ada frame baru (atau interval >= 15ms untuk kelancaran hingga 60 FPS)
        const isFrameReady =
          video.readyState >= 2 &&
          !video.paused &&
          !video.ended &&
          (video.currentTime !== lastVideoTime || now - lastInferenceTime >= 15);

        if (isFrameReady) {
          lastVideoTime = video.currentTime;
          lastInferenceTime = now;

          // Hitung real-time FPS
          fpsFramesRef.current++;
          if (now - fpsLastTimeRef.current >= 1000) {
            const calculatedFps = Math.round(
              (fpsFramesRef.current * 1000) / (now - fpsLastTimeRef.current)
            );
            setCurrentFps(calculatedFps);
            fpsFramesRef.current = 0;
            fpsLastTimeRef.current = now;
          }

          // Resize canvas to match video
          if (canvas.width !== video.videoWidth || canvas.height !== video.videoHeight) {
            canvas.width = video.videoWidth || 640;
            canvas.height = video.videoHeight || 480;
          }

          const results = landmarker.detectForVideo(video, now);

          if (results.landmarks && results.landmarks.length > 0) {
            const allPoses = results.landmarks as unknown as NormalizedLandmark[][];
            // Filter cerdas: Kunci pengguna utama (Primary User Lock-in) dan abaikan distraksi orang lain di latar belakang
            const primarySelection = selectPrimaryUserPose(
              allPoses,
              lastTrackedAnchorRef.current,
              baselineRef.current
            );

            if (primarySelection) {
              lastTrackedAnchorRef.current = primarySelection.newAnchor;
              const rawLandmarks = primarySelection.primaryPose;
              const secondaryCount = allPoses.length - 1;
              setBystanderCount(secondaryCount);

              // 1. Calibration branch
              if (isCalibratingRef.current) {
                const calRes = calibratorRef.current.addFrame(rawLandmarks);
                setCalibrationCount(calRes.collected);
                setCalibrationProgress(calRes.progress);

                if (ctx) {
                  drawSkeleton(ctx, rawLandmarks, canvas.width, canvas.height, "#3B82F6");
                }

                if (calibratorRef.current.isComplete()) {
                  const newBaseline = calibratorRef.current.finalize();
                  baselineRef.current = newBaseline;
                  setBaseline(newBaseline);
                  isCalibratingRef.current = false;
                  setIsCalibrating(false);
                  setSessionActive(true);
                  sessionStartTimeRef.current = new Date();
                  sound.playCalibrationSuccess();
                }
              }
              // 2. Monitoring or Break Mode branch (uses DEFAULT_BREAK_BASELINE fallback if locked before calibration)
              else if (baselineRef.current || isBreakLockedRef.current) {
                const currentBaseline = baselineRef.current ?? DEFAULT_BREAK_BASELINE;
                const evalResult = evaluatePostureFrame(rawLandmarks, currentBaseline);
                const smoothedMetrics = smootherRef.current.smooth(evalResult.metrics);
                const finalEval: PostureEvaluationResult = {
                  ...evalResult,
                  metrics: smoothedMetrics,
                };

                setPostureState(finalEval);
                postureStateRef.current = finalEval;
                if (finalEval.isPresent && baselineRef.current) {
                  neckRatioSamplesRef.current.push(smoothedMetrics.neckRatio);
                }

                // Determine overlay color
                let skeletonColor = "#2563EB"; // Upright Blue
                if (isBreakLockedRef.current && finalEval.isOverheadStretchValid) {
                  skeletonColor = "#22C55E"; // Active Break Green
                } else if (
                  baselineRef.current &&
                  (finalEval.isSlouching ||
                    finalEval.isTooClose ||
                    finalEval.isLeaningAsymmetric)
                ) {
                  skeletonColor = "#F59E0B"; // Warning Amber
                }

                if (ctx) {
                  drawSkeleton(ctx, rawLandmarks, canvas.width, canvas.height, skeletonColor);
                }
              } else {
                // No baseline yet, draw default blue skeleton
                if (ctx) {
                  drawSkeleton(ctx, rawLandmarks, canvas.width, canvas.height, "#3B82F6");
                }
              }
            }
          } else {
            setBystanderCount(0);
            // No person visible
            if (ctx) ctx.clearRect(0, 0, canvas.width, canvas.height);
            if (baselineRef.current || isBreakLockedRef.current) {
              const absentEval: PostureEvaluationResult = {
                isPresent: false,
                isSlouching: false,
                isTooClose: false,
                isLeaningAsymmetric: false,
                isOverheadStretchValid: false,
                isStandingUp: false,
                metrics: { neckRatio: 1, depthRatio: 1, shoulderTiltDeg: 0 },
              };
              setPostureState(absentEval);
              postureStateRef.current = absentEval;
            }
          }
        }
      } catch (loopErr) {
        console.warn("[VisionGuard] Error in processFrame:", loopErr);
      } finally {
        animationFrameIdRef.current = requestAnimationFrame(processFrame);
      }
    };

    animationFrameIdRef.current = requestAnimationFrame(processFrame);
  };

  const triggerBreakLockNow = useCallback(
    (customReason?: string) => {
      setSittingSeconds(sittingLimitSeconds);
      setIsBreakLocked(true);
      isBreakLockedRef.current = true;
      setBreakRepsCompleted(0);
      setCurrentRepHoldSeconds(0);
      setStandAwayDurationSecs(0);
      void osScreenLock.triggerLock(
        customReason ||
          lockReason ||
          `Waktu Duduk & Screen Time Tercapai (${
            demoMode ? "15 Detik" : "50 Menit"
          }) — Wajib Peregangan Aktif`
      );
    },
    [sittingLimitSeconds, lockReason, demoMode]
  );

  const handleStartCalibration = async () => {
    if (!streamRef.current || !videoRef.current?.srcObject) {
      await startCamera();
    }
    calibratorRef.current.reset();
    setCalibrationCount(0);
    setCalibrationProgress(0);
    isCalibratingRef.current = true;
    setIsCalibrating(true);
    startInferenceLoop();
  };

  const handleRecalibrate = async () => {
    clearBaselineFromStorage();
    baselineRef.current = null;
    lastTrackedAnchorRef.current = null;
    setBaseline(null);
    setBystanderCount(0);
    setSessionActive(false);
    void osScreenLock.disarmTimer();
    setSittingSeconds(0);
    setGoodPostureSeconds(0);
    await handleStartCalibration();
  };

  // Sync active session countdown with Backend OS Lock Watchdog (immune to background tab throttling)
  useEffect(() => {
    if (isBreakLocked || isCalibrating) return;
    if (sessionActive) {
      const remaining = Math.max(1, sittingLimitSeconds - sittingSeconds);
      void osScreenLock.armTimer(
        remaining,
        `Waktu Duduk & Screen Time Tercapai (${
          demoMode ? "15 Detik" : "50 Menit"
        }) — Wajib Peregangan Aktif`
      );
    } else {
      void osScreenLock.disarmTimer();
    }
  }, [sessionActive, demoMode, sittingLimitSeconds, isBreakLocked, isCalibrating]);

  // Active Session Timers (Sitting accumulation, Slouch warning, Break trigger)
  useEffect(() => {
    if (!sessionActive || isCalibrating || isBreakLocked) return;

    const timer = setInterval(() => {
      const ps = postureStateRef.current;
      const isTabInBackground = typeof document !== "undefined" && document.hidden;

      const hasPoorPosture =
        Boolean(ps?.isPresent) &&
        Boolean(ps?.isSlouching || ps?.isTooClose || ps?.isLeaningAsymmetric);

      // Increment sitting/screen time when user is sitting in front of camera OR working in another tab/app
      if (isTabInBackground || !ps || (ps.isPresent && !ps.isStandingUp)) {
        setSittingSeconds((prev) => {
          const next = prev + 1;
          if (next >= sittingLimitSeconds) {
            triggerBreakLockNow();
          }
          return next;
        });

        if (!hasPoorPosture && ps?.isPresent) {
          setGoodPostureSeconds((prev) => prev + 1);
        }
      }

      if (hasPoorPosture && ps) {
        setPoorPostureDurationSecs((prev) => {
          const next = prev + 1;
          if (next >= slouchWarningTriggerSeconds) {
            setShowWarningToast(true);
            if (next === slouchWarningTriggerSeconds || next % 8 === 0) {
              sound.playSlouchWarning();
            }
            if (ps.isTooClose) {
              setWarningMessage(
                "Jarak mata terlalu dekat! Mundur sedikit agar mata tidak cepat lelah (<50 cm)."
              );
              setTooCloseCount((c) => c + 1);
            } else if (ps.isSlouching) {
              setWarningMessage("Posisi duduk membungkuk! Yuk tegakkan punggung dan bahu Anda.");
              setSlouchCount((c) => c + 1);
            } else if (ps.isLeaningAsymmetric) {
              setWarningMessage("Posisi duduk miring! Seimbangkan kembali posisi bahu Anda.");
              setSlouchCount((c) => c + 1);
            }
          }
          return next;
        });
      } else {
        setPoorPostureDurationSecs(0);
        setShowWarningToast(false);
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [
    sessionActive,
    isCalibrating,
    baseline,
    isBreakLocked,
    sittingLimitSeconds,
    slouchWarningTriggerSeconds,
    triggerBreakLockNow,
  ]);

  // Anti-Cheat Active Break Lock Verification Loop (runs every 100ms for smooth, responsive counting)
  useEffect(() => {
    if (!isBreakLocked) return;

    const breakTimer = setInterval(() => {
      const ps = postureStateRef.current;
      if (!ps) return;

      // Option A: Overhead Arm Stretch hold (primary verification procedure)
      if (ps.isOverheadStretchValid) {
        setIsHoldingStretch(true);
        setCurrentRepHoldSeconds((hold) => {
          const nextHold = Number((hold + 0.1).toFixed(1));
          if (nextHold >= targetHoldSeconds) {
            sound.playRepComplete();
            setBreakRepsCompleted((reps) => {
              const nextReps = reps + 1;
              if (nextReps >= targetReps) {
                completeActiveBreak("POSE_CAMERA_AI");
              }
              return nextReps;
            });
            return 0;
          }
          return nextHold;
        });
      } else {
        setIsHoldingStretch(false);
      }

      // Option B: Standing up while visibly detected by camera (never unlocks if person is absent)
      if (ps.isPresent && ps.isStandingUp) {
        setStandAwayDurationSecs((secs) => {
          const nextSecs = Number((secs + 0.1).toFixed(1));
          if (nextSecs >= targetStandAwaySeconds) {
            completeActiveBreak("POSE_CAMERA_AI");
          }
          return nextSecs;
        });
      }
    }, 100);

    return () => clearInterval(breakTimer);
  }, [
    isBreakLocked,
    targetHoldSeconds,
    targetReps,
    targetStandAwaySeconds,
  ]);

  // Complete Active Break & Emit Session Payload
  const completeActiveBreak = (verificationType: "POSE_CAMERA_AI" | "MANUAL_LOG") => {
    sound.playBreakUnlocked();
    setIsBreakLocked(false);
    isBreakLockedRef.current = false;
    void osScreenLock.unlock(verificationType);
    if (demoMode) {
      setSessionActive(false);
    }
    setBreakSuccessToast(true);
    setSittingSeconds(0);
    setGoodPostureSeconds(0);
    setBreakRepsCompleted(0);
    setCurrentRepHoldSeconds(0);
    setStandAwayDurationSecs(0);

    const samples = neckRatioSamplesRef.current;
    const avgNeckRatio =
      samples.length > 0
        ? Number((samples.reduce((a, b) => a + b, 0) / samples.length).toFixed(2))
        : 1.0;

    const payload: SedentarySessionPayload = {
      startTime: sessionStartTimeRef.current?.toISOString() || new Date().toISOString(),
      endTime: new Date().toISOString(),
      durationMinutes: Math.max(1, Math.round(sittingSeconds / 60)),
      slouchCount,
      tooCloseCount,
      avgNeckRatio,
      breakCompleted: true,
      breakDurationMins: demoMode ? 1 : CLINICAL_CONSTANTS.ISOTEMPORAL_BREAK_MINS,
      verificationSource: verificationType,
    };

    if (onSessionComplete) {
      onSessionComplete(payload);
    }

    // PRD v4.0 Active Break verification API (+10 Recovery Points)
    api.verifyActiveBreak({
      durationMins: demoMode ? 1 : 2,
      poseVerified: true,
      poseType: "OVERHEAD_STRETCH",
    }).catch((err) => console.warn("[VisionGuard] Error verifying active break:", err));

    if (onActiveBreakCompleted) {
      onActiveBreakCompleted();
    }

    setTimeout(() => {
      setBreakSuccessToast(false);
    }, 4000);
  };

  // Helper formatting mm:ss
  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  };

  const isWarningActive =
    showWarningToast ||
    Boolean(
      postureState?.isPresent &&
        (postureState.isSlouching ||
          postureState.isTooClose ||
          postureState.isLeaningAsymmetric)
    );

  return (
    <div
      className={
        isBreakLocked
          ? "fixed inset-0 z-[9999] bg-slate-950/95 backdrop-blur-md overflow-y-auto p-4 sm:p-6 flex flex-col justify-center"
          : `space-y-4 ${className}`
      }
    >
      {/* OS-Level Lock Top Status Banner when Break is Locked */}
      {isBreakLocked && (
        <div className="max-w-6xl w-full mx-auto mb-4 bg-rose-950/90 border-2 border-rose-500/80 rounded-2xl px-4 py-3 text-white flex flex-wrap items-center justify-between gap-3 shadow-2xl">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-rose-500 text-white flex items-center justify-center shrink-0 animate-pulse">
              <Lock className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-xs font-extrabold uppercase tracking-wider text-rose-300">
                  Kunci Layar Level OS Aktif
                </span>
                <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-rose-500/30 border border-rose-400/40 text-rose-200">
                  {osLockState.activeBrowser
                    ? `Enforcer: ${osLockState.activeBrowser}`
                    : "OS Focus Guard Aktif"}
                </span>
              </div>
              <p className="text-xs text-slate-200 mt-0.5">
                {lockReason || osLockState.reason} &bull; Navigasi tab dan aplikasi lain dikunci sampai prosedur peregangan selesai.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={toggleMute}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-700 bg-slate-900 text-xs font-semibold text-slate-200 hover:bg-slate-800 transition-colors"
            >
              {isMuted ? <VolumeX className="w-3.5 h-3.5" /> : <Volume2 className="w-3.5 h-3.5" />}
              <span>{isMuted ? "Suara Off" : "Suara On"}</span>
            </button>
          </div>
        </div>
      )}

      {/* Vision Guard Header & Controls (Hidden during full-screen OS Lock) */}
      <div
        className={`learnova-card p-5 sm:p-6 border-[#E8E8E8] flex flex-wrap items-center justify-between gap-4 ${
          isBreakLocked ? "hidden" : ""
        }`}
      >
        <div className="flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-2xl bg-[#BDE6F0] text-[#1A1A1A] flex items-center justify-center shrink-0 shadow-xs">
            <Shield className="w-6 h-6" />
          </div>
          <div>
            <h3 className="font-heading font-extrabold text-base text-[#1A1A1A]">
              Vision Guard &amp; Istirahat Aktif (OS Enforcer)
            </h3>
            <p className="text-xs text-[#9A9A9A]">
              Pemindai Postur Pintar &bull; 100% Privat di Perangkat &bull; Mengunci Layar Otomatis Saat Batas Screen Time Tercapai
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5 sm:gap-3 flex-wrap">
          <button
            onClick={toggleMute}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-semibold transition-all ${
              isMuted
                ? "bg-[#F6F6F6] text-[#9A9A9A] border-[#E8E8E8] hover:bg-[#E8E8E8]"
                : "bg-[#FFF29A] text-[#1A1A1A] border-[#FFE966] shadow-xs"
            }`}
            title={isMuted ? "Aktifkan Audio Synthesizer" : "Bisukan Audio Feedback"}
          >
            {isMuted ? <VolumeX className="w-3.5 h-3.5 text-[#9A9A9A]" /> : <Volume2 className="w-3.5 h-3.5 text-[#1A1A1A]" />}
            <span className="hidden sm:inline">{isMuted ? "Muted" : "Audio"}</span>
          </button>

          <div className="flex items-center gap-2 bg-[#F6F6F6] px-3 py-1.5 rounded-xl border border-[#E8E8E8]">
            <Sliders className="w-4 h-4 text-[#1A1A1A]" />
            <span className="text-xs font-semibold text-[#1A1A1A]">MODE COBA</span>
            <button
              onClick={() => {
                setDemoMode(!demoMode);
                setSittingSeconds(0);
                setPoorPostureDurationSecs(0);
              }}
              className={`w-11 h-6 rounded-full transition-colors relative flex items-center px-0.5 ${
                demoMode ? "bg-[#1A1A1A]" : "bg-[#E8E8E8]"
              }`}
              title={demoMode ? "Mode Coba Cepat (15 Detik)" : "Mode Sehat Normal (50 Menit)"}
            >
              <div
                className={`w-5 h-5 rounded-full bg-white shadow-md transform transition-transform ${
                  demoMode ? "translate-x-5" : "translate-x-0"
                }`}
              />
            </button>
            <span className="text-[11px] font-mono font-bold text-[#1A1A1A]">
              {demoMode ? "15s" : "50m"}
            </span>
          </div>

          {baseline && (
            <button
              onClick={handleRecalibrate}
              className="text-xs text-[#1A1A1A] hover:bg-[#E8E8E8] px-3 py-1.5 rounded-lg border border-[#E8E8E8] bg-[#F6F6F6] flex items-center gap-1.5 transition-colors"
            >
              <RefreshCw className="w-3.5 h-3.5" /> Atur Posisi Ulang
            </button>
          )}
        </div>
      </div>

      {/* Main Content Grid: keeps <video> at a constant DOM path so MediaStream never resets */}
      <div
        className={
          isBreakLocked
            ? "max-w-6xl w-full mx-auto grid grid-cols-1 lg:grid-cols-12 gap-5 items-center"
            : "space-y-4"
        }
      >
        {/* Main Video & Skeleton Canvas Container */}
        <div
          className={`relative aspect-video bg-slate-900 rounded-2xl overflow-hidden border-4 transition-all duration-300 flex items-center justify-center ${
            isBreakLocked
              ? "lg:col-span-7 border-emerald-500 ring-8 ring-emerald-500/30 shadow-2xl"
              : isWarningActive
              ? "border-amber-500 ring-4 ring-amber-500/30 shadow-lg shadow-amber-500/20"
              : "border-slate-800"
          }`}
        >
          {/* Anti-Cheat Break Live Overlay inside Video */}
          {isBreakLocked && (
            <div className="absolute inset-x-0 top-3 z-30 flex flex-col items-center text-center px-4 pointer-events-none">
              <div className="flex items-center gap-2 px-4 py-1.5 rounded-full bg-slate-950/90 border border-emerald-400 text-xs shadow-xl">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping" />
                <span className="font-bold text-white">Verifikasi Kamera AI:</span>
                <span className={isHoldingStretch ? "text-emerald-400 font-bold" : "text-amber-300 font-semibold"}>
                  {isHoldingStretch ? "✓ Pose Peregangan Valid (Tahan)!" : "Angkat kedua tangan lurus di atas kepala"}
                </span>
              </div>
            </div>
          )}

          {/* Loading Spinner */}
          {isInitializing && (
            <div className="absolute inset-0 flex flex-col items-center justify-center text-white space-y-3 z-20 bg-slate-900/80 backdrop-blur-xs">
              <RefreshCw className="w-8 h-8 animate-spin text-blue-400" />
              <p className="text-xs font-medium">Memuat MediaPipe Wasm &amp; Model Lokal...</p>
            </div>
          )}

          {/* Camera Permission Error Overlay */}
          {cameraPermissionError && !isInitializing && (
            <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center text-white bg-slate-900/90 z-20 space-y-3">
              <CameraOff className="w-12 h-12 text-rose-400 mx-auto" />
              <h4 className="font-bold text-sm">Akses Kamera Terkendala</h4>
              <p className="text-xs text-slate-300 max-w-md">{cameraPermissionError}</p>
              <button
                onClick={startCamera}
                className="mt-2 bg-primary hover:bg-blue-700 text-white text-xs font-medium px-4 py-2 rounded-lg transition-colors"
              >
                Coba Sambungkan Lagi
              </button>
            </div>
          )}

          {/* Mirrored Video & Canvas Overlay */}
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            className="w-full h-full object-cover -scale-x-100"
          />
          <canvas
            ref={canvasRef}
            className="absolute inset-0 w-full h-full object-cover -scale-x-100 pointer-events-none"
          />

          {/* Calibration Overlay */}
          {isCalibrating && (
            <div className="absolute inset-0 bg-slate-900/75 backdrop-blur-xs z-10 flex flex-col items-center justify-center text-white p-6 text-center">
              <div className="w-16 h-16 rounded-full bg-blue-600/30 border border-blue-400 flex items-center justify-center mb-4">
                <UserCheck className="w-8 h-8 text-blue-400 animate-pulse" />
              </div>
              <h4 className="font-heading font-bold text-base">Atur Posisi Duduk Tegak</h4>
              <p className="text-xs text-slate-300 max-w-sm mt-1 mb-4">
                Duduk tegak, rileks, dan tatap lurus ke depan (hanya butuh kepala &amp; bahu).
              </p>
              <div className="w-64 bg-slate-700 h-2.5 rounded-full overflow-hidden mb-2">
                <div
                  className="bg-blue-500 h-full transition-all duration-100"
                  style={{ width: `${calibrationProgress * 100}%` }}
                />
              </div>
              <div className="flex flex-col items-center gap-1">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-mono text-blue-300 font-semibold">
                    {calibrationCount} / 60 Sampel ({Math.round(calibrationProgress * 100)}%)
                  </span>
                  {currentFps > 0 && (
                    <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-300 border border-blue-400/30">
                      {currentFps} FPS
                    </span>
                  )}
                </div>
                <span className="text-[11px] text-slate-300">
                  {calibrationCount > 0
                    ? "Bahu terdeteksi! Tahan posisi tegak sejenak..."
                    : "Pastikan kepala dan bahu Anda terlihat di kamera..."}
                </span>
              </div>
            </div>
          )}

          {/* Need Initial Calibration Banner (only when not in break lock) */}
          {!baseline && !isCalibrating && !isInitializing && !isBreakLocked && (
            <div className="absolute inset-0 bg-slate-900/80 z-10 flex flex-col items-center justify-center text-white p-6 text-center space-y-3">
              <Camera className="w-12 h-12 text-blue-400 mx-auto" />
              <h4 className="font-heading font-bold text-base">Posisi Duduk Belum Diatur</h4>
              <p className="text-xs text-slate-300 max-w-md">
                Kamera memerlukan waktu 5 detik untuk mengenali posisi duduk tegak alami Anda sebelum mulai mendeteksi postur.
              </p>
              <button
                onClick={handleStartCalibration}
                className="bg-primary hover:bg-blue-700 text-white text-xs font-semibold px-5 py-2.5 rounded-xl shadow-lg flex items-center gap-2 transition-all"
              >
                <Check className="w-4 h-4" /> Mulai Atur Posisi (5 Detik)
              </button>
            </div>
          )}

          {/* Camera Off Prompt when Baseline exists */}
          {baseline && !isCameraActive && !isCalibrating && !isInitializing && !isBreakLocked && !cameraPermissionError && (
            <div className="absolute inset-0 bg-slate-900/80 z-10 flex flex-col items-center justify-center text-white p-6 text-center space-y-3">
              <Camera className="w-12 h-12 text-emerald-400 mx-auto" />
              <h4 className="font-heading font-bold text-base">Kamera Siap Memantau</h4>
              <p className="text-xs text-slate-300 max-w-md">
                Baseline postur Anda sudah tersimpan. Nyalakan kamera untuk mulai memantau postur dan screen time.
              </p>
              <button
                onClick={async () => {
                  await startCamera();
                  setSessionActive(true);
                  sessionStartTimeRef.current = new Date();
                }}
                className="bg-emerald-500 hover:bg-emerald-600 text-slate-950 text-xs font-extrabold px-5 py-2.5 rounded-xl shadow-lg flex items-center gap-2 transition-all"
              >
                <Play className="w-4 h-4 fill-slate-950" /> Aktifkan Kamera &amp; Mulai Sesi
              </button>
            </div>
          )}

          {/* Corner HUD Metrics Badge */}
          {(baseline || isBreakLocked) && !isCalibrating && (
            <div className="absolute bottom-3 left-3 z-10 bg-black/65 backdrop-blur-md text-white rounded-xl px-3.5 py-2.5 text-[11px] font-mono space-y-1.5 border border-white/10 shadow-lg">
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-1.5">
                  <span
                    className={`w-2 h-2 rounded-full ${
                      postureState?.isPresent ? "bg-emerald-400 animate-ping" : "bg-rose-400"
                    }`}
                  />
                  <span className="font-sans font-semibold text-xs">
                    {postureState?.isPresent ? "Terdeteksi Aktif" : "Menunggu Wajah & Bahu di Kamera..."}
                  </span>
                  {currentFps > 0 && (
                    <span className="text-[9px] font-mono px-1.5 py-0.5 bg-white/10 rounded text-slate-300">
                      {currentFps} FPS
                    </span>
                  )}
                </div>
                {postureState?.isPresent && !isBreakLocked && (
                  <div className="flex items-center gap-1.5">
                    {bystanderCount > 0 && (
                      <span
                        className="text-[9px] font-sans px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-400/40 font-bold flex items-center gap-1"
                        title="Sistem mengunci Anda sebagai pengguna utama dan mengabaikan orang lain yang lewat di latar"
                      >
                        <Users className="w-2.5 h-2.5" />
                        +{bystanderCount} Orang Lain Diabaikan
                      </span>
                    )}
                    <span className="text-[10px] font-sans px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-300 border border-blue-400/30 font-bold">
                      Skor: {calculatePostureHealthScore(goodPostureSeconds, sittingSeconds).score}%
                    </span>
                  </div>
                )}
              </div>
              {postureState?.isPresent && !isBreakLocked && (
                <>
                  <div className="text-slate-300 flex items-center justify-between gap-3">
                    <span>Jarak Monitor:</span>
                    {(() => {
                      const dist = estimateMonitorDistanceCm(postureState.metrics.depthRatio);
                      return (
                        <span
                          className={`font-bold ${
                            dist.status === "TERLALU_DEKAT"
                              ? "text-rose-400"
                              : dist.status === "JAUH"
                              ? "text-amber-300"
                              : "text-emerald-300"
                          }`}
                        >
                          ~{dist.distanceCm} cm ({dist.status === "TERLALU_DEKAT" ? "Dekat" : dist.status === "JAUH" ? "Jauh" : "Ideal"})
                        </span>
                      );
                    })()}
                  </div>
                  <div className="text-slate-300 flex items-center justify-between gap-3">
                    <span>Posisi Leher:</span>
                    <span className={`font-bold ${postureState.isSlouching ? "text-amber-400" : "text-emerald-400"}`}>
                      {postureState.isSlouching ? "Membungkuk" : "Tegak Alami"}
                    </span>
                  </div>
                  <div className="text-slate-300 flex items-center justify-between gap-3">
                    <span>Posisi Bahu:</span>
                    <span className={`font-bold ${postureState.isLeaningAsymmetric ? "text-amber-400" : "text-emerald-400"}`}>
                      {postureState.isLeaningAsymmetric ? "Miring" : "Seimbang"}
                    </span>
                  </div>
                </>
              )}
            </div>
          )}

          {/* Top-Right Session Timer HUD */}
          {baseline && !isCalibrating && !isBreakLocked && (
            <div className="absolute top-3 right-3 z-10 bg-black/60 backdrop-blur-md text-white rounded-xl px-3.5 py-2 text-right border border-white/10">
              <div className="text-[10px] text-slate-400 uppercase font-semibold">
                {sessionActive ? "Countdown Lock OS Aktif" : "Waktu Duduk"}
              </div>
              <div className="text-lg font-mono font-bold text-white flex items-center justify-end gap-1.5">
                <Activity className="w-4 h-4 text-emerald-400" />
                {formatTime(sittingSeconds)} / {formatTime(sittingLimitSeconds)}
              </div>
              <div className="w-24 bg-slate-700 h-1 rounded-full overflow-hidden mt-1 ml-auto">
                <div
                  className={`h-full transition-all ${
                    sittingSeconds / sittingLimitSeconds > 0.8 ? "bg-amber-400" : "bg-emerald-400"
                  }`}
                  style={{ width: `${Math.min(100, (sittingSeconds / sittingLimitSeconds) * 100)}%` }}
                />
              </div>
            </div>
          )}

          {/* Warning Toast (Corner Alert) */}
          {showWarningToast && !isBreakLocked && (
            <div className="absolute bottom-4 left-4 right-4 sm:right-auto sm:max-w-md z-20 bg-amber-500 text-slate-900 rounded-xl p-3.5 shadow-2xl flex items-center gap-3 animate-bounce">
              <AlertTriangle className="w-5 h-5 shrink-0 text-slate-900" />
              <div className="text-xs font-semibold leading-snug">
                {warningMessage}{" "}
                <span className="font-mono text-[11px] opacity-80">
                  ({poorPostureDurationSecs}s)
                </span>
              </div>
            </div>
          )}

          {/* Break Success Toast */}
          {breakSuccessToast && (
            <div className="absolute bottom-4 left-4 right-4 sm:right-auto sm:max-w-md z-20 bg-emerald-600 text-white rounded-xl p-3.5 shadow-2xl flex items-center gap-3">
              <CheckCircle2 className="w-5 h-5 shrink-0 text-white" />
              <div className="text-xs font-semibold leading-snug">
                Sesi Istirahat Aktif Terverifikasi AI! Kunci layar OS dibuka (+10 Recovery Score &amp; +75 XP).
              </div>
            </div>
          )}
        </div>

        {/* ========================================================= */}
        {/* ANTI-CHEAT ACTIVE BREAK PANEL (SIDE-BY-SIDE WHEN LOCKED) */}
        {/* ========================================================= */}
        {isBreakLocked && (
          <div className="lg:col-span-5 bg-slate-900 border-2 border-emerald-500 rounded-3xl p-6 shadow-2xl text-white text-center space-y-5">
            <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-rose-500/20 border border-rose-500/40 text-rose-300 text-xs font-semibold">
              <Flame className="w-4 h-4 text-rose-400" />
              Wajib Peregangan Sebelum Melanjutkan ({demoMode ? "Mode 15 Detik" : "Mode 50 Menit"})
            </div>

            <div className="space-y-1.5">
              <h2 className="text-xl sm:text-2xl font-extrabold font-heading text-white">
                Istirahat Aktif: Buka Kunci Layar!
              </h2>
              <p className="text-xs text-slate-300 leading-relaxed">
                Angkat <b className="text-emerald-400">kedua tangan lurus di atas kepala</b> di depan kamera hingga garis kerangka tubuh berubah <b className="text-emerald-400">HIJAU</b> selama 3 repetisi.
              </p>
            </div>

            {/* Rep Counter & Progress */}
            <div className="bg-slate-800/90 rounded-2xl p-5 border border-slate-700 space-y-4">
              <div className="flex items-center justify-between text-xs font-semibold text-slate-300">
                <span className="flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4 text-emerald-400" /> Prosedur: Overhead Arm Stretch
                </span>
                <span className="text-emerald-400 font-bold font-mono">
                  {breakRepsCompleted} / {targetReps} Selesai
                </span>
              </div>

              {/* Rep Circles */}
              <div className="flex justify-center gap-4">
                {Array.from({ length: targetReps }).map((_, idx) => (
                  <div
                    key={idx}
                    className={`w-12 h-12 rounded-full flex items-center justify-center font-bold text-sm border-2 transition-all ${
                      idx < breakRepsCompleted
                        ? "bg-emerald-500 border-emerald-400 text-white shadow-lg shadow-emerald-500/40 scale-105"
                        : idx === breakRepsCompleted && isHoldingStretch
                        ? "bg-emerald-500/20 border-emerald-400 text-emerald-300 animate-pulse ring-4 ring-emerald-500/30"
                        : "bg-slate-700/80 border-slate-600 text-slate-400"
                    }`}
                  >
                    {idx < breakRepsCompleted ? <Check className="w-6 h-6 stroke-[3]" /> : idx + 1}
                  </div>
                ))}
              </div>

              {/* Hold Progress Bar for Current Rep */}
              <div className="space-y-1.5">
                <div className="flex justify-between text-xs font-mono">
                  <span className={isHoldingStretch ? "text-emerald-400 font-bold flex items-center gap-1" : "text-slate-400"}>
                    {isHoldingStretch
                      ? "✓ Bagus! Tahan posisi tangan di atas..."
                      : postureState?.isPresent
                      ? "Angkat kedua tangan lurus ke atas kepala"
                      : "Posisikan wajah & bahu Anda di depan kamera"}
                  </span>
                  <span className="text-amber-400 font-bold">
                    {currentRepHoldSeconds.toFixed(1)}s / {targetHoldSeconds}s
                  </span>
                </div>
                <div className="w-full bg-slate-700/80 h-3.5 rounded-full overflow-hidden p-0.5 border border-slate-600">
                  <div
                    className="bg-emerald-400 h-full rounded-full transition-all duration-100 shadow-xs"
                    style={{
                      width: `${Math.min(100, (currentRepHoldSeconds / targetHoldSeconds) * 100)}%`,
                    }}
                  />
                </div>
              </div>
            </div>

            <div className="text-xs text-slate-400 flex items-center justify-between bg-slate-800/40 px-4 py-2.5 rounded-xl border border-slate-700/50">
              <span>Opsi 2: Berdiri tegak di depan kamera</span>
              <span className="font-mono text-slate-300 font-bold">
                {standAwayDurationSecs.toFixed(0)}s / {targetStandAwaySeconds}s
              </span>
            </div>

            <div className="bg-slate-950/70 rounded-xl p-3 border border-slate-800 text-[11px] text-slate-400 leading-relaxed">
              <strong className="text-emerald-400">
                {isStrictOsLock ? "Proteksi Mutlak Level OS Aktif:" : "Proteksi OS Aktif:"}
              </strong>{" "}
              Jika Anda berpindah ke tab lain atau aplikasi lain, sistem operasi akan otomatis mengembalikan layar ke halaman ini sampai prosedur peregangan selesai.
            </div>

            {/* Emergency Fallback ONLY if camera hardware fails */}
            {cameraPermissionError && (
              <div className="pt-1 flex justify-center">
                <button
                  onClick={() => completeActiveBreak("MANUAL_LOG")}
                  className="text-xs text-rose-400 hover:text-rose-300 transition-colors underline"
                >
                  Darurat: Buka Kunci Karena Kamera Tidak Terdeteksi
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Stats Summary Bar & Live Ergonomic Metrics (Hidden during full-screen OS Lock) */}
      <div className={`grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 text-xs ${isBreakLocked ? "hidden" : ""}`}>
        {/* Card 1: Ergonomic Health Score */}
        {(() => {
          const health = calculatePostureHealthScore(goodPostureSeconds, sittingSeconds);
          const gradeColor =
            health.grade === "SANGAT_BAIK"
              ? "text-[#1A1A1A] bg-[#CDE8B5] border-[#B6DF97]"
              : health.grade === "BAIK"
              ? "text-[#1A1A1A] bg-[#FFF29A] border-[#FFE966]"
              : "text-[#1A1A1A] bg-[#F7A8B0] border-[#DF7E89]";
          const gradeText =
            health.grade === "SANGAT_BAIK"
              ? "Sangat Baik"
              : health.grade === "BAIK"
              ? "Baik"
              : "Perlu Latihan";

          return (
            <div className="bg-white p-3.5 rounded-2xl border border-[#E8E8E8] flex flex-col justify-between shadow-xs">
              <div className="flex items-center justify-between">
                <span className="text-[#9A9A9A] font-semibold">Skor Postur</span>
                <Award className="w-4 h-4 text-[#1A1A1A]" />
              </div>
              <div className="my-1.5 flex items-baseline justify-between">
                <span className="text-xl font-extrabold text-[#1A1A1A] font-mono">
                  {health.score}%
                </span>
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${gradeColor}`}>
                  {gradeText}
                </span>
              </div>
              <div className="w-full bg-[#F6F6F6] h-2 rounded-full overflow-hidden p-0.5 border border-[#E8E8E8]">
                <div
                  className="bg-[#CDE8B5] h-full rounded-full transition-all duration-300"
                  style={{ width: `${health.score}%` }}
                />
              </div>
            </div>
          );
        })()}

        {/* Card 2: Distance Estimator in cm */}
        {(() => {
          const dist = estimateMonitorDistanceCm(postureState?.metrics.depthRatio ?? 1);
          const isWarn = dist.status === "TERLALU_DEKAT";
          const isFar = dist.status === "JAUH";

          return (
            <div className="bg-white p-3.5 rounded-2xl border border-[#E8E8E8] flex flex-col justify-between shadow-xs">
              <div className="flex items-center justify-between">
                <span className="text-[#9A9A9A] font-semibold">Jarak Monitor</span>
                <Ruler className="w-4 h-4 text-[#9A9A9A]" />
              </div>
              <div className="my-1.5">
                <div className={`text-xl font-extrabold font-mono ${isWarn ? "text-[#F7A8B0]" : isFar ? "text-[#F9B99A]" : "text-[#1A1A1A]"}`}>
                  ~{dist.distanceCm} cm
                </div>
                <div className="text-[10px] text-[#9A9A9A] mt-0.5 font-medium">
                  {isWarn ? "Terlalu Dekat (<50cm)" : isFar ? "Jauh (>75cm)" : "Ideal (50-70cm)"}
                </div>
              </div>
            </div>
          );
        })()}

        {/* Card 3: Slouch Incident */}
        <div className="bg-white p-3.5 rounded-2xl border border-[#E8E8E8] flex flex-col justify-between shadow-xs">
          <div className="text-[#9A9A9A] font-semibold">Peringatan Bungkuk</div>
          <div className="my-1.5">
            <div className="text-xl font-extrabold text-[#1A1A1A] font-mono">{slouchCount} kali</div>
            <div className="text-[10px] text-[#9A9A9A] mt-0.5 font-medium">Bahu turun / leher maju</div>
          </div>
        </div>

        {/* Card 4: Proximity Incident */}
        <div className="bg-white p-3.5 rounded-2xl border border-[#E8E8E8] flex flex-col justify-between shadow-xs">
          <div className="text-[#9A9A9A] font-semibold">Mata Terlalu Dekat</div>
          <div className="my-1.5">
            <div className="text-xl font-extrabold text-[#1A1A1A] font-mono">{tooCloseCount} kali</div>
            <div className="text-[10px] text-[#9A9A9A] mt-0.5 font-medium">Risiko mata cepat lelah</div>
          </div>
        </div>

        {/* Card 5: Work Bout & Session Status */}
        <div className="bg-white p-3.5 rounded-2xl border border-[#E8E8E8] flex flex-col justify-between col-span-2 sm:col-span-1 shadow-xs">
          <div className="text-[#9A9A9A] font-semibold">Batas Screen Time</div>
          <div className="my-1.5">
            <div className="text-base font-bold text-[#1A1A1A]">
              {demoMode ? "15 Detik (Coba)" : "50 Menit (Ideal)"}
            </div>
            <div className="text-[10px] text-[#1A1A1A] font-bold flex items-center gap-1 mt-0.5">
              <span className={`w-1.5 h-1.5 rounded-full ${sessionActive ? "bg-emerald-500 animate-ping" : "bg-[#1A1A1A]"}`} />
              {sessionActive ? `Countdown OS Lock (${formatTime(sittingSeconds)})` : "Menunggu"}
            </div>
          </div>
        </div>
      </div>

      {/* Manual Simulation Controls for Reviewers / Desktop Lab */}
      <div
        className={`bg-[#F6F6F6] rounded-2xl p-3.5 border border-[#E8E8E8] text-xs flex flex-wrap items-center justify-between gap-2.5 ${
          isBreakLocked ? "hidden" : ""
        }`}
      >
        <div>
          <span className="text-[#1A1A1A] font-extrabold block">
            Kontrol Uji Coba Kunci Layar Level OS:
          </span>
          <span className="text-[11px] text-[#737373]">
            Klik &ldquo;Mulai Timer Lock OS&rdquo;, lalu pindah ke tab lain atau aplikasi lain. Saat waktu habis, layar otomatis ditarik kembali ke tab ini.
          </span>
        </div>
        <div className="flex items-center flex-wrap gap-2">
          <button
            onClick={async () => {
              if (!streamRef.current || !videoRef.current?.srcObject) {
                await startCamera();
              }
              setSittingSeconds(0);
              sessionStartTimeRef.current = new Date();
              setSessionActive(true);
              void osScreenLock.armTimer(
                sittingLimitSeconds,
                `Batas Screen Time (${demoMode ? "15 Detik" : "50 Menit"}) Tercapai — Wajib Peregangan Aktif`
              );
            }}
            className="px-3.5 py-2 bg-[#BDE6F0] hover:bg-[#A5DCE8] text-[#1A1A1A] rounded-xl font-extrabold transition-colors border border-[#A5DCE8] flex items-center gap-1.5"
            title="Mulai hitung mundur dan coba pindah ke tab/aplikasi lain"
          >
            <Play className="w-3.5 h-3.5 fill-[#1A1A1A]" />
            Mulai Timer Lock OS ({demoMode ? "15s" : "50m"})
          </button>

          <button
            onClick={() => triggerBreakLockNow("Kunci Layar Istirahat Aktif (Level OS)")}
            className="px-3.5 py-2 bg-[#CDE8B5] hover:bg-[#B6DF97] text-[#1A1A1A] rounded-xl font-extrabold transition-colors border border-[#B6DF97] flex items-center gap-1.5"
            title="Kunci layar level OS sekarang untuk tes Active Break"
          >
            <Lock className="w-3.5 h-3.5" />
            Trigger Lock Break Sekarang
          </button>

          <button
            onClick={() => {
              const next = !sessionActive;
              setSessionActive(next);
              if (next) {
                sessionStartTimeRef.current = new Date();
              } else {
                void osScreenLock.disarmTimer();
              }
            }}
            className={`px-3.5 py-2 rounded-xl font-extrabold flex items-center gap-1 ${
              sessionActive
                ? "bg-[#1A1A1A] text-white"
                : "bg-[#FFF29A] text-[#1A1A1A] border border-[#FFE966] shadow-softPill"
            }`}
          >
            {sessionActive ? (
              <>
                <Square className="w-3.5 h-3.5 fill-white" /> Jeda Timer
              </>
            ) : (
              <>
                <Play className="w-3.5 h-3.5 fill-[#1A1A1A]" /> Lanjutkan Sesi
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
