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
  Globe,
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

  // Guarantee inference loop starts whenever BOTH camera stream and MediaPipe landmarker are ready
  useEffect(() => {
    if (isCameraActive && !isInitializing && landmarkerRef.current && videoRef.current?.srcObject) {
      startInferenceLoop();
    }
  }, [isCameraActive, isInitializing]);

  // Thresholds based on mode
  const sittingLimitSeconds = demoMode ? 15 : CLINICAL_CONSTANTS.ISOTEMPORAL_WORK_BOUT_MINS * 60;
  const slouchWarningTriggerSeconds = demoMode ? 4 : 180;
  const targetReps = 3;
  const targetHoldSeconds = demoMode ? 3 : 5;
  const targetStandAwaySeconds = demoMode ? 10 : 300; // 5 mins in normal mode

  // Helper to verify local public asset actually exists (not Vite SPA index.html fallback)
  const isValidLocalAsset = async (url: string): Promise<boolean> => {
    if (!url.startsWith("/")) return true;
    try {
      const res = await fetch(url, { method: "HEAD" });
      if (!res.ok) return false;
      const ct = (res.headers.get("content-type") || "").toLowerCase();
      return !ct.includes("text/html");
    } catch {
      return false;
    }
  };

  // Initialize MediaPipe PoseLandmarker
  useEffect(() => {
    let isMounted = true;

    async function initVision() {
      try {
        setIsInitializing(true);
        setCameraPermissionError(null);

        // 1. Build valid WASM candidates (Local first only if verified non-HTML, then CDN fallback)
        const wasmCandidates: string[] = [];
        if (await isValidLocalAsset("/wasm/vision_wasm_internal.js")) {
          wasmCandidates.push("/wasm");
        }
        wasmCandidates.push(
          "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.18/wasm"
        );

        // 2. Build valid Model candidates (Local first only if verified non-HTML, then Google CDN)
        const modelCandidates: string[] = [];
        if (await isValidLocalAsset("/models/pose_landmarker_lite.task")) {
          modelCandidates.push("/models/pose_landmarker_lite.task");
        }
        modelCandidates.push(
          "https://storage.googleapis.com/mediapipe-models/pose_landmarker/pose_landmarker_lite/float16/1/pose_landmarker_lite.task",
          "https://storage.googleapis.com/mediapipe-models/pose_landmarker/pose_landmarker_lite/float16/latest/pose_landmarker_lite.task"
        );

        let landmarker: PoseLandmarker | null = null;
        for (const wasmBase of wasmCandidates) {
          if (!isMounted || landmarker) break;
          let vision;
          try {
            vision = await FilesetResolver.forVisionTasks(wasmBase);
          } catch (wasmErr) {
            console.warn(`[VisionGuard] Failed resolving WASM from ${wasmBase}:`, wasmErr);
            continue;
          }

          for (const modelAssetPath of modelCandidates) {
            if (!isMounted || landmarker) break;
            for (const delegate of ["GPU", "CPU"] as const) {
              try {
                const candidate = await PoseLandmarker.createFromOptions(vision, {
                  baseOptions: {
                    modelAssetPath,
                    delegate,
                  },
                  runningMode: "VIDEO",
                  numPoses: 3, // Mendeteksi multi-pose agar dapat mengisolasi pengguna utama dari orang di latar belakang
                  minPoseDetectionConfidence: 0.45,
                  minPosePresenceConfidence: 0.45,
                  minTrackingConfidence: 0.45,
                });
                if (!isMounted) {
                  candidate.close();
                  return;
                }
                landmarker = candidate;
                break;
              } catch (modelErr) {
                console.warn(
                  `[VisionGuard] PoseLandmarker failed (${wasmBase} | ${modelAssetPath} | ${delegate}):`,
                  modelErr
                );
              }
            }
          }
        }

        if (!landmarker) {
          throw new Error("Gagal menginisialisasi PoseLandmarker dari semua path WASM & model.");
        }

        if (isMounted) {
          landmarkerRef.current = landmarker;
          setIsInitializing(false);
          if (autoStartCamera || isBreakLockedRef.current || baselineRef.current) {
            await startCamera();
          } else if (streamRef.current && videoRef.current) {
            startInferenceLoop();
          }
        } else {
          landmarker.close();
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

    void initVision();

    return () => {
      isMounted = false;
      stopCamera();
      if (landmarkerRef.current) {
        landmarkerRef.current.close();
        landmarkerRef.current = null;
      }
    };
  }, []);

  // Camera Management
  const isStartingCameraRef = useRef<boolean>(false);

  const startCamera = async () => {
    if (isStartingCameraRef.current) return;
    if (streamRef.current && streamRef.current.getVideoTracks().some((t) => t.readyState === "live")) {
      if (videoRef.current && videoRef.current.srcObject !== streamRef.current) {
        videoRef.current.srcObject = streamRef.current;
        await videoRef.current.play().catch(() => {});
      }
      setIsCameraActive(true);
      startInferenceLoop();
      return;
    }

    isStartingCameraRef.current = true;
    try {
      setCameraPermissionError(null);
      let stream: MediaStream;
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          video: {
            width: { ideal: 640 },
            height: { ideal: 480 },
            frameRate: { ideal: 30 },
            facingMode: "user",
          },
          audio: false,
        });
      } catch {
        // Fallback tanpa constraint khusus agar kamera laptop/webcam apa pun tetap bisa terbuka
        stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
      }

      streamRef.current = stream;
      setIsCameraActive(true);
      if (videoRef.current) {
        const video = videoRef.current;
        video.srcObject = stream;

        const onReady = () => {
          video.onloadedmetadata = null;
          video.onloadeddata = null;
          video
            .play()
            .then(() => startInferenceLoop())
            .catch((err) => {
              console.warn("[VisionGuard] video.play() notice:", err);
              startInferenceLoop();
            });
        };

        if (video.readyState >= 2) {
          onReady();
        } else {
          video.onloadedmetadata = onReady;
          video.onloadeddata = onReady;
        }
      }
    } catch (err: unknown) {
      console.warn("[VisionGuard] Kamera tidak dapat diakses:", err);
      setCameraPermissionError(
        "Izin akses kamera ditolak atau kamera tidak ditemukan. Pastikan izin kamera aktif."
      );
    } finally {
      isStartingCameraRef.current = false;
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
    let lastTimestampMs = 0;

    const processFrame = () => {
      try {
        const now = performance.now();
        // Cek kesiapan frame: pastikan dimensi video valid (>0) & ada frame baru
        const isFrameReady =
          video.readyState >= 2 &&
          video.videoWidth > 0 &&
          video.videoHeight > 0 &&
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

          // MediaPipe detectForVideo mewajibkan timestamp integer yang selalu meningkat secara monoton
          const timestampMs = Math.max(lastTimestampMs + 1, Math.floor(now));
          lastTimestampMs = timestampMs;
          const results = landmarker.detectForVideo(video, timestampMs);

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

  const formatBrowserName = (raw: string | null): string => {
    if (!raw) return "OS Focus Guard Aktif";
    const lower = raw.toLowerCase();
    if (lower.includes("msedge") || lower.includes("edge")) return "Enforcer: Microsoft Edge";
    if (lower.includes("chrome")) return "Enforcer: Google Chrome";
    if (lower.includes("brave")) return "Enforcer: Brave Browser";
    if (lower.includes("firefox")) return "Enforcer: Firefox";
    return `Enforcer: ${raw}`;
  };

  const holdRadius = 32;
  const holdCircumference = 2 * Math.PI * holdRadius;
  const holdProgressRatio = Math.min(1, currentRepHoldSeconds / Math.max(0.1, targetHoldSeconds));
  const holdDashOffset = holdCircumference * (1 - holdProgressRatio);

  return (
    <div
      className={
        isBreakLocked
          ? "fixed inset-0 z-[9999] bg-gradient-to-br from-[#F3F5EE] via-[#ECF1E6] to-[#E2EBDC] overflow-y-auto p-4 sm:p-6 flex flex-col justify-center"
          : `space-y-4 ${className}`
      }
    >
      {/* Decorative Soft Sage Waves (Full-Screen Lock Background) */}
      {isBreakLocked && (
        <svg
          aria-hidden="true"
          viewBox="0 0 1440 260"
          preserveAspectRatio="none"
          className="pointer-events-none select-none fixed inset-x-0 bottom-0 w-full h-44 sm:h-56 z-0"
        >
          <path
            d="M0,120 C320,45 640,185 1020,110 C1220,70 1350,95 1440,115 L1440,260 L0,260 Z"
            fill="#D6E1CE"
            fillOpacity="0.65"
          />
          <path
            d="M0,180 C380,125 760,220 1160,155 C1300,132 1380,145 1440,158 L1440,260 L0,260 Z"
            fill="#C3D3BA"
            fillOpacity="0.55"
          />
        </svg>
      )}

      {/* OS-Level Lock Top Status Banner when Break is Locked */}
      {isBreakLocked && (
        <div className="relative z-10 max-w-6xl w-full mx-auto mb-5 bg-[#F5E9D6] border border-[#E5D5BC] rounded-[1.5rem] px-5 py-3.5 text-[#1D3127] flex flex-wrap items-center justify-between gap-3 shadow-[0_6px_22px_-6px_rgba(47,58,46,0.08)]">
          <div className="flex items-center gap-3.5">
            <div className="w-10 h-10 rounded-xl bg-[#243B2E] text-white flex items-center justify-center shrink-0 shadow-xs">
              <Lock className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2.5 flex-wrap">
                <span className="font-heading text-xs font-extrabold uppercase tracking-[0.06em] text-[#1D3127]">
                  Kunci Layar Level OS Aktif
                </span>
                <span className="inline-flex items-center gap-1.5 text-[11px] font-bold px-3 py-0.5 rounded-full bg-[#FCFBF8] border border-[#E6DAC8] text-[#2F3A2E]">
                  <Globe className="w-3 h-3 text-[#4C5C4E]" />
                  {formatBrowserName(osLockState.activeBrowser)}
                </span>
              </div>
              <p className="text-xs text-[#5A5043] mt-0.5">
                {lockReason || osLockState.reason} &bull; Navigasi tab dan aplikasi lain dikunci sampai prosedur peregangan selesai.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={toggleMute}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-[#E5DAC8] bg-[#FCFBF8] hover:bg-white text-xs font-bold text-[#1D3127] shadow-2xs transition-colors cursor-pointer"
            >
              {isMuted ? <VolumeX className="w-3.5 h-3.5 text-[#636B60]" /> : <Volume2 className="w-3.5 h-3.5 text-[#1D3127]" />}
              <span>{isMuted ? "Suara Off" : "Suara On"}</span>
            </button>
          </div>
        </div>
      )}

      {/* Vision Guard Header & Controls (Hidden during full-screen OS Lock) */}
      <div
        className={`learnova-card p-5 sm:p-6 border-[#E8DDCF] flex flex-wrap items-center justify-between gap-4 ${
          isBreakLocked ? "hidden" : ""
        }`}
      >
        <div className="flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-2xl bg-[#E8DDCF] text-[#2F3A2E] flex items-center justify-center shrink-0 shadow-xs">
            <Shield className="w-6 h-6" />
          </div>
          <div>
            <h3 className="font-heading font-extrabold text-base text-[#2F3A2E]">
              Vision Guard &amp; Istirahat Aktif (OS Enforcer)
            </h3>
            <p className="text-xs text-[#636B60]">
              Pemindai Postur Pintar &bull; 100% Privat di Perangkat &bull; Mengunci Layar Otomatis Saat Batas Screen Time Tercapai
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5 sm:gap-3 flex-wrap">
          <button
            onClick={toggleMute}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-semibold transition-all ${
              isMuted
                ? "bg-[#FAF6F0] text-[#636B60] border-[#E8DDCF] hover:bg-[#CFD8C4]"
                : "bg-[#E8DDCF] text-[#2F3A2E] border-[#E8DDCF] shadow-xs"
            }`}
            title={isMuted ? "Aktifkan Audio Synthesizer" : "Bisukan Audio Feedback"}
          >
            {isMuted ? <VolumeX className="w-3.5 h-3.5 text-[#636B60]" /> : <Volume2 className="w-3.5 h-3.5 text-[#2F3A2E]" />}
            <span className="hidden sm:inline">{isMuted ? "Muted" : "Audio"}</span>
          </button>

          <div className="flex items-center gap-2 bg-[#FAF6F0] px-3 py-1.5 rounded-xl border border-[#E8DDCF]">
            <Sliders className="w-4 h-4 text-[#2F3A2E]" />
            <span className="text-xs font-semibold text-[#2F3A2E]">MODE COBA</span>
            <button
              onClick={() => {
                setDemoMode(!demoMode);
                setSittingSeconds(0);
                setPoorPostureDurationSecs(0);
              }}
              className={`w-11 h-6 rounded-full transition-colors relative flex items-center px-0.5 ${
                demoMode ? "bg-[#CFD8C4]" : "bg-[#E8DDCF]"
              }`}
              title={demoMode ? "Mode Coba Cepat (15 Detik)" : "Mode Sehat Normal (50 Menit)"}
            >
              <div
                className={`w-5 h-5 rounded-full bg-white shadow-md transform transition-transform ${
                  demoMode ? "translate-x-5" : "translate-x-0"
                }`}
              />
            </button>
            <span className="text-[11px] font-mono font-bold text-[#2F3A2E]">
              {demoMode ? "15s" : "50m"}
            </span>
          </div>

          {baseline && (
            <button
              onClick={handleRecalibrate}
              className="text-xs text-[#2F3A2E] hover:bg-[#CFD8C4] px-3 py-1.5 rounded-lg border border-[#E8DDCF] bg-[#FAF6F0] flex items-center gap-1.5 transition-colors"
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
            ? "relative z-10 max-w-6xl w-full mx-auto grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch"
            : "space-y-4"
        }
      >
        {/* Main Video & Skeleton Canvas Container */}
        <div
          className={
            isBreakLocked
              ? "lg:col-span-7 bg-[#FCFBF8] p-3 sm:p-3.5 rounded-[2rem] border border-white/95 shadow-[0_14px_38px_-12px_rgba(47,58,46,0.14)] flex flex-col"
              : ""
          }
        >
          <div
            className={`relative bg-[#1E3328] overflow-hidden transition-all duration-300 flex items-center justify-center ${
              isBreakLocked
                ? "flex-1 min-h-[360px] sm:min-h-[450px] rounded-[1.5rem]"
                : isWarningActive
                ? "aspect-video rounded-2xl border-4 border-amber-500 ring-4 ring-amber-500/30 shadow-lg shadow-amber-500/20"
                : "aspect-video rounded-2xl border-4 border-slate-800"
            }`}
          >
            {/* Subtle Viewfinder Corner Brackets (Break Lock Mode) */}
            {isBreakLocked && (
              <>
                <span className="pointer-events-none absolute top-5 left-5 w-7 h-7 border-t-2 border-l-2 border-white/75 rounded-tl-xl z-20" />
                <span className="pointer-events-none absolute top-5 right-5 w-7 h-7 border-t-2 border-r-2 border-white/75 rounded-tr-xl z-20" />
                <span className="pointer-events-none absolute bottom-14 left-5 w-7 h-7 border-b-2 border-l-2 border-white/75 rounded-bl-xl z-20" />
                <span className="pointer-events-none absolute bottom-14 right-5 w-7 h-7 border-b-2 border-r-2 border-white/75 rounded-br-xl z-20" />
              </>
            )}

            {/* Anti-Cheat Break Live Overlay inside Video */}
            {isBreakLocked && (
              <div className="absolute inset-x-0 top-4 z-30 flex flex-col items-center text-center px-4 pointer-events-none">
                <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[#FCFBF8]/95 backdrop-blur-md border border-white text-xs shadow-lg">
                  <Sparkles className="w-3.5 h-3.5 text-[#243B2E] shrink-0" />
                  <span className="font-bold text-[#1D3127]">Verifikasi Kamera AI:</span>
                  <span className={isHoldingStretch ? "text-[#367A44] font-extrabold" : "text-[#A36918] font-bold"}>
                    {isHoldingStretch ? "✓ Pose Peregangan Valid (Tahan)!" : "Angkat kedua tangan lurus di atas kepala"}
                  </span>
                </div>
              </div>
            )}

            {/* Loading Spinner */}
            {isInitializing && (
              <div className="absolute inset-0 flex flex-col items-center justify-center text-white space-y-3 z-20 bg-[#1B2D23]/85 backdrop-blur-xs">
                <RefreshCw className="w-8 h-8 animate-spin text-[#CFD8C4]" />
                <p className="text-xs font-medium text-[#E8EFE4]">Memuat MediaPipe Wasm &amp; Model Lokal...</p>
              </div>
            )}

            {/* Camera Permission Error Overlay */}
            {cameraPermissionError && !isInitializing && (
              <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center text-white bg-[#1B2D23]/92 z-20 space-y-3">
                <CameraOff className="w-12 h-12 text-rose-300 mx-auto" />
                <h4 className="font-bold text-sm">Akses Kamera Terkendala</h4>
                <p className="text-xs text-[#D4DFD0] max-w-md">{cameraPermissionError}</p>
                <button
                  onClick={startCamera}
                  className="mt-2 bg-[#CFD8C4] hover:bg-[#BCC8AE] text-[#1D3127] text-xs font-bold px-4 py-2 rounded-full transition-colors cursor-pointer"
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
              <div
                className={
                  isBreakLocked
                    ? "absolute bottom-4 left-4 z-20 bg-[#17251D]/85 backdrop-blur-md text-white rounded-full px-3.5 py-2 text-xs border border-white/15 shadow-lg"
                    : "absolute bottom-3 left-3 z-10 bg-black/65 backdrop-blur-md text-white rounded-xl px-3.5 py-2.5 text-[11px] font-mono space-y-1.5 border border-white/10 shadow-lg"
                }
              >
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <span
                      className={`w-2 h-2 rounded-full shrink-0 ${
                        postureState?.isPresent
                          ? "bg-emerald-400 animate-ping"
                          : isBreakLocked
                          ? "bg-[#F2B129]"
                          : "bg-rose-400"
                      }`}
                    />
                    <span className="font-sans font-semibold text-xs">
                      {postureState?.isPresent ? "Terdeteksi Aktif" : "Menunggu Wajah & Bahu di Kamera..."}
                    </span>
                    {currentFps > 0 && (
                      <span className="text-[9px] font-mono px-1.5 py-0.5 bg-white/10 rounded-full text-slate-200">
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

            {/* Bottom-Right Skeleton Status Pill (Break Lock Mode) */}
            {isBreakLocked && !isCalibrating && (
              <div className="absolute bottom-4 right-4 z-20 inline-flex items-center gap-1.5 px-3.5 py-2 rounded-full bg-[#3E5145]/85 backdrop-blur-md border border-white/15 text-[11px] font-semibold text-[#EAF2E8] shadow-lg">
                <span
                  className={`w-2 h-2 rounded-full shrink-0 ${
                    isHoldingStretch
                      ? "bg-emerald-400"
                      : postureState?.isPresent
                      ? "bg-[#CFD8C4]"
                      : "bg-[#9AA99E]"
                  }`}
                />
                <span>
                  {isHoldingStretch
                    ? "Kerangka: peregangan valid"
                    : postureState?.isPresent
                    ? "Kerangka: terdeteksi"
                    : "Kerangka: belum terdeteksi"}
                </span>
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
        </div>

        {/* ========================================================= */}
        {/* ANTI-CHEAT ACTIVE BREAK PANEL (SIDE-BY-SIDE WHEN LOCKED) */}
        {/* ========================================================= */}
        {isBreakLocked && (
          <div className="lg:col-span-5 relative overflow-hidden bg-[#FCFBF8] border border-[#EBE4D8] rounded-[2rem] p-6 sm:p-7 shadow-[0_14px_38px_-12px_rgba(47,58,46,0.12)] text-[#1D3127] text-left flex flex-col justify-between space-y-5">
            {/* Decorative Concentric Rings Watermark (Top-Right) */}
            <svg
              aria-hidden="true"
              viewBox="0 0 110 110"
              className="pointer-events-none select-none absolute -top-2 -right-2 w-28 h-28 text-[#EFEAE1] z-0"
            >
              <circle cx="84" cy="26" r="44" fill="none" stroke="currentColor" strokeWidth="11" />
              <circle cx="84" cy="26" r="19" fill="none" stroke="currentColor" strokeWidth="11" />
            </svg>

            <div className="relative z-10 space-y-4">
              <div className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-[#F5EBD8] border border-[#EADBC2] text-[#7D5524] text-[11px] font-bold">
                <Flame className="w-3.5 h-3.5 text-[#A86D24]" />
                <span>Wajib Peregangan Sebelum Melanjutkan ({demoMode ? "Mode 15 Detik" : "Mode 50 Menit"})</span>
              </div>

              <div className="space-y-2">
                <h2 className="text-2xl sm:text-[1.65rem] font-extrabold font-heading text-[#1D3127] leading-tight tracking-tight">
                  Istirahat Aktif: Buka Kunci Layar!
                </h2>
                <p className="text-xs sm:text-[13px] text-[#526053] leading-relaxed">
                  Angkat <strong className="text-[#1D3127]">kedua tangan lurus di atas kepala</strong> di depan kamera hingga garis kerangka tubuh berubah{" "}
                  <span className="inline-block px-2 py-0.5 rounded-md bg-[#D6E8D1] text-[#2B6638] font-extrabold text-[11px]">
                    HIJAU
                  </span>{" "}
                  selama {targetReps} repetisi.
                </p>
              </div>

              {/* Box 1: Prosedur Overhead Arm Stretch */}
              <div className="bg-[#F3F6EF] rounded-[1.4rem] p-4 sm:p-5 border border-[#DDE6D6] space-y-4">
                <div className="flex items-center justify-between gap-2 text-xs">
                  <span className="flex items-center gap-2 font-extrabold text-[#1D3127]">
                    <span className="w-4 h-4 rounded-full border-2 border-[#243B2E] flex items-center justify-center shrink-0">
                      <span className="w-1.5 h-1.5 rounded-full bg-[#243B2E]" />
                    </span>
                    <span>Prosedur: Overhead Arm Stretch</span>
                  </span>
                  <span className="text-[#46594A] font-bold font-mono">
                    {breakRepsCompleted} / {targetReps} Selesai
                  </span>
                </div>

                <div className="flex items-center gap-4">
                  {/* Circular Hold Progress Ring */}
                  <div className="relative w-20 h-20 shrink-0 flex items-center justify-center">
                    <svg className="w-full h-full -rotate-90" viewBox="0 0 80 80">
                      <circle
                        cx="40"
                        cy="40"
                        r={holdRadius}
                        fill="none"
                        stroke="#E3DCD0"
                        strokeWidth="6"
                      />
                      <circle
                        cx="40"
                        cy="40"
                        r={holdRadius}
                        fill="none"
                        stroke={isHoldingStretch ? "#4E8B57" : "#C99846"}
                        strokeWidth="6"
                        strokeLinecap="round"
                        strokeDasharray={holdCircumference}
                        strokeDashoffset={holdDashOffset}
                        className="transition-all duration-100"
                      />
                    </svg>
                    <div className="absolute inset-0 flex flex-col items-center justify-center text-center leading-tight">
                      <span className={`font-mono font-extrabold text-sm ${isHoldingStretch ? "text-[#2B6638]" : "text-[#8A5A1E]"}`}>
                        {currentRepHoldSeconds.toFixed(1)}s
                      </span>
                      <span className="font-mono text-[10px] text-[#7A7E74]">
                        / {targetHoldSeconds}s
                      </span>
                    </div>
                  </div>

                  {/* Rep Circles & Status Prompt */}
                  <div className="flex-1 min-w-0 space-y-2.5">
                    <div className="flex items-center gap-2.5">
                      {Array.from({ length: targetReps }).map((_, idx) => (
                        <div
                          key={idx}
                          className={`w-11 h-11 rounded-full flex items-center justify-center font-bold text-sm transition-all ${
                            idx < breakRepsCompleted
                              ? "bg-[#4E8B57] border-2 border-[#4E8B57] text-white shadow-sm scale-105"
                              : idx === breakRepsCompleted
                              ? isHoldingStretch
                                ? "bg-[#E2EFE0] border-2 border-[#4E8B57] text-[#2B6638] ring-4 ring-[#4E8B57]/20 animate-pulse"
                                : "bg-white border-2 border-[#243B2E] text-[#1D3127] shadow-2xs"
                              : "bg-white/80 border-2 border-dashed border-[#B7C3B4] text-[#4C5C4E]"
                          }`}
                        >
                          {idx < breakRepsCompleted ? <Check className="w-5 h-5 stroke-[3]" /> : idx + 1}
                        </div>
                      ))}
                    </div>
                    <p className={`text-[11px] leading-snug ${isHoldingStretch ? "text-[#2B6638] font-bold" : "text-[#526053] font-medium"}`}>
                      {isHoldingStretch
                        ? "✓ Bagus! Tahan posisi tangan di atas..."
                        : postureState?.isPresent
                        ? "Angkat kedua tangan lurus ke atas kepala"
                        : "Posisikan wajah & bahu Anda di depan kamera"}
                    </p>
                  </div>
                </div>
              </div>

              {/* Box 2: Opsi 2 (Stand Away) */}
              <div className="bg-white rounded-2xl px-4 py-3 border border-[#EAE3D8] flex items-center justify-between gap-2 text-xs">
                <span className="flex items-center gap-2.5 font-bold text-[#2F3A2E]">
                  <span className="w-4 h-4 rounded-full border border-[#BFC8BA] shrink-0" />
                  <span>Opsi 2: Berdiri tegak di depan kamera</span>
                </span>
                <span className="font-mono text-[#526053] font-bold shrink-0">
                  {standAwayDurationSecs.toFixed(0)}s / {targetStandAwaySeconds}s
                </span>
              </div>
            </div>

            {/* Box 3: OS Lock Info Footer */}
            <div className="relative z-10 space-y-2.5">
              <div className="bg-[#E8F0E3] rounded-2xl p-4 border border-[#D4E1CC] flex items-start gap-3">
                <div className="w-9 h-9 rounded-xl bg-[#243B2E] text-white flex items-center justify-center shrink-0">
                  <Shield className="w-4 h-4" />
                </div>
                <p className="text-[11px] text-[#3C4E3F] leading-relaxed">
                  <strong className="text-[#1D3127]">
                    {isStrictOsLock ? "Proteksi Mutlak Level OS Aktif:" : "Proteksi OS Aktif:"}
                  </strong>{" "}
                  Jika Anda berpindah ke tab lain atau aplikasi lain, sistem operasi akan otomatis mengembalikan layar ke halaman ini sampai prosedur peregangan selesai.
                </p>
              </div>

              {/* Emergency Fallback ONLY if camera hardware fails */}
              {cameraPermissionError && (
                <div className="pt-1 flex justify-center">
                  <button
                    onClick={() => completeActiveBreak("MANUAL_LOG")}
                    className="text-xs text-rose-600 hover:text-rose-700 font-semibold transition-colors underline cursor-pointer"
                  >
                    Darurat: Buka Kunci Karena Kamera Tidak Terdeteksi
                  </button>
                </div>
              )}
            </div>
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
              ? "text-[#2F3A2E] bg-[#CFD8C4] border-[#CFD8C4]"
              : health.grade === "BAIK"
              ? "text-[#2F3A2E] bg-[#CFD8C4] border-[#BCC8AE]"
              : "text-[#2F3A2E] bg-[#E8DDCF] border-[#E8DDCF]";
          const gradeText =
            health.grade === "SANGAT_BAIK"
              ? "Sangat Baik"
              : health.grade === "BAIK"
              ? "Baik"
              : "Perlu Latihan";

          return (
            <div className="bg-white p-3.5 rounded-2xl border border-[#E8DDCF] flex flex-col justify-between shadow-xs">
              <div className="flex items-center justify-between">
                <span className="text-[#636B60] font-semibold">Skor Postur</span>
                <Award className="w-4 h-4 text-[#2F3A2E]" />
              </div>
              <div className="my-1.5 flex items-baseline justify-between">
                <span className="text-xl font-extrabold text-[#2F3A2E] font-mono">
                  {health.score}%
                </span>
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${gradeColor}`}>
                  {gradeText}
                </span>
              </div>
              <div className="w-full bg-[#FAF6F0] h-2 rounded-full overflow-hidden p-0.5 border border-[#E8DDCF]">
                <div
                  className="bg-[#E8DDCF] h-full rounded-full transition-all duration-300"
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
            <div className="bg-white p-3.5 rounded-2xl border border-[#E8DDCF] flex flex-col justify-between shadow-xs">
              <div className="flex items-center justify-between">
                <span className="text-[#636B60] font-semibold">Jarak Monitor</span>
                <Ruler className="w-4 h-4 text-[#636B60]" />
              </div>
              <div className="my-1.5">
                <div className={`text-xl font-extrabold font-mono ${isWarn ? "text-[#F2D3D1]" : isFar ? "text-[#F2D3D1]" : "text-[#2F3A2E]"}`}>
                  ~{dist.distanceCm} cm
                </div>
                <div className="text-[10px] text-[#636B60] mt-0.5 font-medium">
                  {isWarn ? "Terlalu Dekat (<50cm)" : isFar ? "Jauh (>75cm)" : "Ideal (50-70cm)"}
                </div>
              </div>
            </div>
          );
        })()}

        {/* Card 3: Slouch Incident */}
        <div className="bg-white p-3.5 rounded-2xl border border-[#E8DDCF] flex flex-col justify-between shadow-xs">
          <div className="text-[#636B60] font-semibold">Peringatan Bungkuk</div>
          <div className="my-1.5">
            <div className="text-xl font-extrabold text-[#2F3A2E] font-mono">{slouchCount} kali</div>
            <div className="text-[10px] text-[#636B60] mt-0.5 font-medium">Bahu turun / leher maju</div>
          </div>
        </div>

        {/* Card 4: Proximity Incident */}
        <div className="bg-white p-3.5 rounded-2xl border border-[#E8DDCF] flex flex-col justify-between shadow-xs">
          <div className="text-[#636B60] font-semibold">Mata Terlalu Dekat</div>
          <div className="my-1.5">
            <div className="text-xl font-extrabold text-[#2F3A2E] font-mono">{tooCloseCount} kali</div>
            <div className="text-[10px] text-[#636B60] mt-0.5 font-medium">Risiko mata cepat lelah</div>
          </div>
        </div>

        {/* Card 5: Work Bout & Session Status */}
        <div className="bg-white p-3.5 rounded-2xl border border-[#E8DDCF] flex flex-col justify-between col-span-2 sm:col-span-1 shadow-xs">
          <div className="text-[#636B60] font-semibold">Batas Screen Time</div>
          <div className="my-1.5">
            <div className="text-base font-bold text-[#2F3A2E]">
              {demoMode ? "15 Detik (Coba)" : "50 Menit (Ideal)"}
            </div>
            <div className="text-[10px] text-[#2F3A2E] font-bold flex items-center gap-1 mt-0.5">
              <span className={`w-1.5 h-1.5 rounded-full ${sessionActive ? "bg-emerald-500 animate-ping" : "bg-[#CFD8C4]"}`} />
              {sessionActive ? `Countdown OS Lock (${formatTime(sittingSeconds)})` : "Menunggu"}
            </div>
          </div>
        </div>
      </div>

      {/* Manual Simulation Controls for Reviewers / Desktop Lab */}
      <div
        className={`bg-[#FAF6F0] rounded-2xl p-3.5 border border-[#E8DDCF] text-xs flex flex-wrap items-center justify-between gap-2.5 ${
          isBreakLocked ? "hidden" : ""
        }`}
      >
        <div>
          <span className="text-[#2F3A2E] font-extrabold block">
            Kontrol Uji Coba Kunci Layar Level OS:
          </span>
          <span className="text-[11px] text-[#636B60]">
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
            className="px-3.5 py-2 bg-[#E8DDCF] hover:bg-[#CFD8C4] active:bg-[#CFD8C4] text-[#2F3A2E] rounded-xl font-extrabold transition-colors border border-[#CFD8C4] flex items-center gap-1.5"
            title="Mulai hitung mundur dan coba pindah ke tab/aplikasi lain"
          >
            <Play className="w-3.5 h-3.5 fill-[#2F3A2E]" />
            Mulai Timer Lock OS ({demoMode ? "15s" : "50m"})
          </button>

          <button
            onClick={() => triggerBreakLockNow("Kunci Layar Istirahat Aktif (Level OS)")}
            className="px-3.5 py-2 bg-[#E8DDCF] hover:bg-[#CFD8C4] active:bg-[#CFD8C4] text-[#2F3A2E] rounded-xl font-extrabold transition-colors border border-[#CFD8C4] flex items-center gap-1.5"
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
                ? "bg-[#CFD8C4] text-[#2F3A2E]"
                : "bg-[#E8DDCF] text-[#2F3A2E] border border-[#E8DDCF] shadow-softPill"
            }`}
          >
            {sessionActive ? (
              <>
                <Square className="w-3.5 h-3.5 fill-[#2F3A2E]" /> Jeda Timer
              </>
            ) : (
              <>
                <Play className="w-3.5 h-3.5 fill-[#2F3A2E]" /> Lanjutkan Sesi
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
