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
  type NormalizedLandmark,
  type PostureEvaluationResult,
} from "@/utils/poseHeuristics";
import { CLINICAL_CONSTANTS, type PostureBaseline, type SedentarySessionPayload } from "@/types";

interface VisionGuardProps {
  onSessionComplete?: (payload: SedentarySessionPayload) => void;
  className?: string;
}

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
}) => {
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

  // Configuration & Modes
  const [demoMode, setDemoMode] = useState<boolean>(true);
  const [isInitializing, setIsInitializing] = useState<boolean>(true);
  const [cameraPermissionError, setCameraPermissionError] = useState<string | null>(null);
  const [hardwareDelegate, setHardwareDelegate] = useState<"GPU" | "CPU">("GPU");

  // Calibration State
  const [baseline, setBaseline] = useState<PostureBaseline | null>(() => loadBaselineFromStorage());
  const [isCalibrating, setIsCalibrating] = useState<boolean>(false);
  const [calibrationProgress, setCalibrationProgress] = useState<number>(0);
  const [calibrationCount, setCalibrationCount] = useState<number>(0);

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
  const [isBreakLocked, setIsBreakLocked] = useState<boolean>(false);
  const [breakRepsCompleted, setBreakRepsCompleted] = useState<number>(0);
  const [currentRepHoldSeconds, setCurrentRepHoldSeconds] = useState<number>(0);
  const [standAwayDurationSecs, setStandAwayDurationSecs] = useState<number>(0);
  const [isHoldingStretch, setIsHoldingStretch] = useState<boolean>(false);
  const [breakSuccessToast, setBreakSuccessToast] = useState<boolean>(false);

  useEffect(() => {
    isBreakLockedRef.current = isBreakLocked;
  }, [isBreakLocked]);

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
        const vision = await FilesetResolver.forVisionTasks("/wasm");
        if (!isMounted) return;

        let landmarker: PoseLandmarker;
        try {
          landmarker = await PoseLandmarker.createFromOptions(vision, {
            baseOptions: {
              modelAssetPath: "/models/pose_landmarker_lite.task",
              delegate: "GPU",
            },
            runningMode: "VIDEO",
            numPoses: 1,
            minPoseDetectionConfidence: 0.5,
            minPosePresenceConfidence: 0.5,
            minTrackingConfidence: 0.5,
          });
          setHardwareDelegate("GPU");
        } catch (gpuErr) {
          console.warn("[VisionGuard] GPU delegate failed, falling back to CPU:", gpuErr);
          landmarker = await PoseLandmarker.createFromOptions(vision, {
            baseOptions: {
              modelAssetPath: "/models/pose_landmarker_lite.task",
              delegate: "CPU",
            },
            runningMode: "VIDEO",
            numPoses: 1,
            minPoseDetectionConfidence: 0.5,
            minPosePresenceConfidence: 0.5,
            minTrackingConfidence: 0.5,
          });
          setHardwareDelegate("CPU");
        }

        if (isMounted) {
          landmarkerRef.current = landmarker;
          setIsInitializing(false);
          startCamera();
        }
      } catch (err: unknown) {
        console.error("[VisionGuard] Gagal menginisialisasi MediaPipe:", err);
        if (isMounted) {
          setCameraPermissionError("Gagal memuat model MediaPipe Vision. Mode graceful degradation diaktifkan.");
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
          facingMode: "user",
        },
        audio: false,
      });

      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.onloadedmetadata = () => {
          videoRef.current?.play();
          startInferenceLoop();
        };
      }
    } catch (err: unknown) {
      console.warn("[VisionGuard] Kamera tidak dapat diakses:", err);
      setCameraPermissionError(
        "Izin akses kamera ditolak atau kamera tidak ditemukan. Anda tetap dapat menggunakan simulasi postur manual."
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
  };

  // Synchronized Canvas Rendering
  const drawSkeleton = useCallback(
    (
      ctx: CanvasRenderingContext2D,
      landmarks: MpNormalizedLandmark[],
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

    const video = videoRef.current;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    const landmarker = landmarkerRef.current;

    let lastVideoTime = -1;

    const processFrame = () => {
      if (video.readyState >= 2 && video.currentTime !== lastVideoTime) {
        lastVideoTime = video.currentTime;

        // Resize canvas to match video
        if (canvas.width !== video.videoWidth || canvas.height !== video.videoHeight) {
          canvas.width = video.videoWidth || 640;
          canvas.height = video.videoHeight || 480;
        }

        const now = performance.now();
        const results = landmarker.detectForVideo(video, now);

        if (results.landmarks && results.landmarks.length > 0) {
          const rawLandmarks = results.landmarks[0] as NormalizedLandmark[];

          // 1. Calibration branch
          if (isCalibratingRef.current) {
            const calRes = calibratorRef.current.addFrame(rawLandmarks);
            setCalibrationCount(calRes.collected);
            setCalibrationProgress(calRes.progress);

            if (ctx) {
              drawSkeleton(ctx, results.landmarks[0], canvas.width, canvas.height, "#3B82F6");
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
          // 2. Monitoring or Break Mode branch
          else if (baselineRef.current) {
            const currentBaseline = baselineRef.current;
            const evalResult = evaluatePostureFrame(rawLandmarks, currentBaseline);
            const smoothedMetrics = smootherRef.current.smooth(evalResult.metrics);
            const finalEval: PostureEvaluationResult = {
              ...evalResult,
              metrics: smoothedMetrics,
            };

            setPostureState(finalEval);
            postureStateRef.current = finalEval;
            if (finalEval.isPresent) {
              neckRatioSamplesRef.current.push(smoothedMetrics.neckRatio);
            }

            // Determine overlay color
            let skeletonColor = "#2563EB"; // Upright Blue
            if (isBreakLockedRef.current && finalEval.isOverheadStretchValid) {
              skeletonColor = "#22C55E"; // Active Break Green
            } else if (
              finalEval.isSlouching ||
              finalEval.isTooClose ||
              finalEval.isLeaningAsymmetric
            ) {
              skeletonColor = "#F59E0B"; // Warning Amber
            }

            if (ctx) {
              drawSkeleton(ctx, results.landmarks[0], canvas.width, canvas.height, skeletonColor);
            }
          } else {
            // No baseline yet, draw default blue skeleton
            if (ctx) {
              drawSkeleton(ctx, results.landmarks[0], canvas.width, canvas.height, "#3B82F6");
            }
          }
        } else {
          // No person visible
          if (ctx) ctx.clearRect(0, 0, canvas.width, canvas.height);
          if (baselineRef.current) {
            const absentEval: PostureEvaluationResult = {
              isPresent: false,
              isSlouching: false,
              isTooClose: false,
              isLeaningAsymmetric: false,
              isOverheadStretchValid: false,
              isStandingUp: true,
              metrics: { neckRatio: 1, depthRatio: 1, shoulderTiltDeg: 0 },
            };
            setPostureState(absentEval);
            postureStateRef.current = absentEval;
          }
        }
      }

      animationFrameIdRef.current = requestAnimationFrame(processFrame);
    };

    animationFrameIdRef.current = requestAnimationFrame(processFrame);
  };

  // Calibration Trigger
  const handleStartCalibration = () => {
    calibratorRef.current.reset();
    setCalibrationCount(0);
    setCalibrationProgress(0);
    isCalibratingRef.current = true;
    setIsCalibrating(true);
  };

  const handleRecalibrate = () => {
    clearBaselineFromStorage();
    baselineRef.current = null;
    setBaseline(null);
    setSessionActive(false);
    setSittingSeconds(0);
    setGoodPostureSeconds(0);
    handleStartCalibration();
  };

  // Active Session Timers (Sitting accumulation, Slouch warning, Break trigger)
  useEffect(() => {
    if (!sessionActive || isCalibrating || !baseline || isBreakLocked) return;

    const timer = setInterval(() => {
      const ps = postureStateRef.current;
      if (!ps) return;

      // Slouch & Warning evaluation
      const hasPoorPosture =
        ps.isPresent &&
        (ps.isSlouching ||
          ps.isTooClose ||
          ps.isLeaningAsymmetric);

      // Sitting timer increments when user is present
      if (ps.isPresent && !ps.isStandingUp) {
        setSittingSeconds((prev) => {
          const next = prev + 1;
          // Check sitting limit reached
          if (next >= sittingLimitSeconds) {
            setIsBreakLocked(true);
            isBreakLockedRef.current = true;
            setBreakRepsCompleted(0);
            setCurrentRepHoldSeconds(0);
            setStandAwayDurationSecs(0);
          }
          return next;
        });

        if (!hasPoorPosture) {
          setGoodPostureSeconds((prev) => prev + 1);
        }
      }

      if (hasPoorPosture) {
        setPoorPostureDurationSecs((prev) => {
          const next = prev + 1;
          if (next >= slouchWarningTriggerSeconds) {
            setShowWarningToast(true);
            if (next === slouchWarningTriggerSeconds || next % 8 === 0) {
              sound.playSlouchWarning();
            }
            if (ps.isTooClose) {
              setWarningMessage("Peringatan: Jarak mata terlalu dekat dengan monitor (<50 cm).");
              setTooCloseCount((c) => c + 1);
            } else if (ps.isSlouching) {
              setWarningMessage("Peringatan: Postur membungkuk terdeteksi. Tegakkan bahu Anda!");
              setSlouchCount((c) => c + 1);
            } else if (ps.isLeaningAsymmetric) {
              setWarningMessage("Peringatan: Bahu miring asimetris. Seimbangkan beban duduk.");
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
  ]);

  // Anti-Cheat Active Break Lock Verification Loop (runs every 100ms for smooth, responsive counting)
  useEffect(() => {
    if (!isBreakLocked) return;

    const breakTimer = setInterval(() => {
      const ps = postureStateRef.current;
      if (!ps) return;

      // 1. Option A: Overhead Arm Stretch hold
      if (ps.isOverheadStretchValid) {
        setIsHoldingStretch(true);
        setCurrentRepHoldSeconds((hold) => {
          const nextHold = Number((hold + 0.1).toFixed(1));
          if (nextHold >= targetHoldSeconds) {
            // Completed 1 rep!
            sound.playRepComplete();
            setBreakRepsCompleted((reps) => {
              const nextReps = reps + 1;
              if (nextReps >= targetReps) {
                // All reps completed! Unlock!
                completeActiveBreak("POSE_CAMERA_AI");
              }
              return nextReps;
            });
            return 0; // reset hold for next rep
          }
          return nextHold;
        });
      } else {
        setIsHoldingStretch(false);
      }

      // 2. Option B: Standing up / leaving desk
      if (ps.isStandingUp || !ps.isPresent) {
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
    <div className={`space-y-4 ${isBreakLocked ? "relative z-50" : ""} ${className}`}>
      {/* Fullscreen Backdrop locking background when Break is active */}
      {isBreakLocked && (
        <div className="fixed inset-0 z-40 bg-slate-950/85 backdrop-blur-md pointer-events-auto" />
      )}

      {/* Vision Guard Header & Controls */}
      <div className={`bg-white rounded-2xl p-5 border border-slate-200 shadow-xs flex flex-wrap items-center justify-between gap-4 ${isBreakLocked ? "relative z-50" : ""}`}>
        <div className="flex items-center gap-3">
          <div className="p-3 bg-blue-50 text-primary rounded-xl">
            <Shield className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-heading font-bold text-base text-textMain">
                Vision Guard &amp; Anti-Cheat Break
              </h3>
              <span className="text-[10px] bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full font-mono font-semibold">
                {hardwareDelegate} Acceleration
              </span>
            </div>
            <p className="text-xs text-slate-500">
              MediaPipe Pose Landmarker Lite &bull; 100% On-Device (Privasi Aman, Zero Upload)
            </p>
          </div>
        </div>

        {/* DEMO MODE TOGGLE SWITCH, AUDIO & RECALIBRATE */}
        <div className="flex items-center gap-2.5 sm:gap-3 flex-wrap">
          {/* Audio Feedback Toggle */}
          <button
            onClick={toggleMute}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-semibold transition-all ${
              isMuted
                ? "bg-slate-100 text-slate-400 border-slate-200 hover:bg-slate-200"
                : "bg-blue-50 text-primary border-blue-200 hover:bg-blue-100 shadow-xs"
            }`}
            title={isMuted ? "Aktifkan Audio Synthesizer" : "Bisukan Audio Feedback"}
          >
            {isMuted ? <VolumeX className="w-3.5 h-3.5 text-slate-400" /> : <Volume2 className="w-3.5 h-3.5 text-primary" />}
            <span className="hidden sm:inline">{isMuted ? "Muted" : "Audio"}</span>
          </button>

          {/* Demo Mode Switch */}
          <div className="flex items-center gap-2 bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-200">
            <Sliders className="w-4 h-4 text-slate-500" />
            <span className="text-xs font-semibold text-slate-700">DEMO MODE</span>
            <button
              onClick={() => {
                setDemoMode(!demoMode);
                setSittingSeconds(0);
                setPoorPostureDurationSecs(0);
              }}
              className={`w-11 h-6 rounded-full transition-colors relative flex items-center px-0.5 ${
                demoMode ? "bg-primary" : "bg-slate-300"
              }`}
              title={demoMode ? "Demo Mode (15 Detik Limit)" : "Mode Produksi (50 Menit Limit)"}
            >
              <div
                className={`w-5 h-5 rounded-full bg-white shadow-md transform transition-transform ${
                  demoMode ? "translate-x-5" : "translate-x-0"
                }`}
              />
            </button>
            <span className="text-[11px] font-mono font-bold text-primary">
              {demoMode ? "15s" : "50m"}
            </span>
          </div>

          {baseline && (
            <button
              onClick={handleRecalibrate}
              className="text-xs text-slate-600 hover:text-primary px-3 py-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 flex items-center gap-1.5 transition-colors"
            >
              <RefreshCw className="w-3.5 h-3.5" /> Kalibrasi Ulang
            </button>
          )}
        </div>
      </div>

      {/* Main Video & Skeleton Canvas Container */}
      <div
        className={`relative aspect-video bg-slate-900 rounded-2xl overflow-hidden border-4 transition-all duration-300 flex items-center justify-center ${
          isBreakLocked
            ? "z-50 relative border-emerald-500 ring-8 ring-emerald-500/40 shadow-2xl"
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
              <span className="font-bold text-white">Sesi Istirahat Aktif Terkunci:</span>
              <span className={isHoldingStretch ? "text-emerald-400 font-bold" : "text-amber-300 font-semibold"}>
                {isHoldingStretch ? "✓ Pose Valid (Tahan)!" : "Angkat kedua tangan ke atas kepala"}
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
            <h4 className="font-heading font-bold text-base">Kalibrasi Baseline Duduk Tegak</h4>
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
              <span className="text-xs font-mono text-blue-300 font-semibold">
                {calibrationCount} / 60 Frame ({Math.round(calibrationProgress * 100)}%)
              </span>
              <span className="text-[11px] text-slate-300">
                {calibrationCount > 0
                  ? "Bahu terdeteksi! Tahan posisi tegak..."
                  : "Pastikan kedua bahu terlihat di layar..."}
              </span>
            </div>
          </div>
        )}

        {/* Need Initial Calibration Banner */}
        {!baseline && !isCalibrating && !isInitializing && (
          <div className="absolute inset-0 bg-slate-900/80 z-10 flex flex-col items-center justify-center text-white p-6 text-center space-y-3">
            <Camera className="w-12 h-12 text-blue-400 mx-auto" />
            <h4 className="font-heading font-bold text-base">Baseline Postur Belum Terkalibrasi</h4>
            <p className="text-xs text-slate-300 max-w-md">
              Vision Guard memerlukan kalibrasi 5 detik untuk menghitung rasio leher (D_neck), lebar bahu, dan sudut torso unik Anda.
            </p>
            <button
              onClick={handleStartCalibration}
              className="bg-primary hover:bg-blue-700 text-white text-xs font-semibold px-5 py-2.5 rounded-xl shadow-lg flex items-center gap-2 transition-all"
            >
              <Check className="w-4 h-4" /> Mulai Kalibrasi 5 Detik
            </button>
          </div>
        )}

        {/* Corner HUD Metrics Badge */}
        {baseline && !isCalibrating && (
          <div className="absolute top-3 left-3 z-10 bg-black/65 backdrop-blur-md text-white rounded-xl px-3.5 py-2.5 text-[11px] font-mono space-y-1.5 border border-white/10 shadow-lg">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-1.5">
                <span
                  className={`w-2 h-2 rounded-full ${
                    postureState?.isPresent ? "bg-emerald-400 animate-ping" : "bg-rose-400"
                  }`}
                />
                <span className="font-sans font-semibold text-xs">
                  {postureState?.isPresent ? "Terdeteksi Aktif" : "Tidak Terdeteksi"}
                </span>
              </div>
              {postureState?.isPresent && (
                <span className="text-[10px] font-sans px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-300 border border-blue-400/30 font-bold">
                  Skor: {calculatePostureHealthScore(goodPostureSeconds, sittingSeconds).score}%
                </span>
              )}
            </div>
            {postureState?.isPresent && (
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
                  <span>Rasio Leher:</span>
                  <span className="text-blue-300 font-bold">{postureState.metrics.neckRatio}x (Min 0.78)</span>
                </div>
                <div className="text-slate-300 flex items-center justify-between gap-3">
                  <span>Kemiringan:</span>
                  <span className="text-blue-300 font-bold">{postureState.metrics.shoulderTiltDeg}&deg; (Max 12&deg;)</span>
                </div>
              </>
            )}
          </div>
        )}

        {/* Top-Right Session Timer HUD */}
        {baseline && !isCalibrating && (
          <div className="absolute top-3 right-3 z-10 bg-black/60 backdrop-blur-md text-white rounded-xl px-3.5 py-2 text-right border border-white/10">
            <div className="text-[10px] text-slate-400 uppercase font-semibold">Waktu Duduk</div>
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
        {showWarningToast && (
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
              Sesi Istirahat Aktif Terverifikasi AI! Anda mendapatkan +75 XP. Waktu duduk di-reset.
            </div>
          </div>
        )}
      </div>

      {/* Stats Summary Bar & Live Ergonomic Metrics */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 text-xs">
        {/* Card 1: Ergonomic Health Score */}
        {(() => {
          const health = calculatePostureHealthScore(goodPostureSeconds, sittingSeconds);
          const gradeColor =
            health.grade === "SANGAT_BAIK"
              ? "text-emerald-600 bg-emerald-50 border-emerald-200"
              : health.grade === "BAIK"
              ? "text-blue-600 bg-blue-50 border-blue-200"
              : "text-amber-600 bg-amber-50 border-amber-200";
          const gradeText =
            health.grade === "SANGAT_BAIK"
              ? "Sangat Baik"
              : health.grade === "BAIK"
              ? "Baik"
              : "Perlu Latihan";

          return (
            <div className="bg-white p-3.5 rounded-xl border border-slate-200 flex flex-col justify-between">
              <div className="flex items-center justify-between">
                <span className="text-slate-500 font-medium">Skor Postur</span>
                <Award className="w-4 h-4 text-primary" />
              </div>
              <div className="my-1.5 flex items-baseline justify-between">
                <span className="text-xl font-extrabold text-slate-800 font-mono">
                  {health.score}%
                </span>
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${gradeColor}`}>
                  {gradeText}
                </span>
              </div>
              <div className="w-full bg-slate-100 h-1 rounded-full overflow-hidden">
                <div
                  className="bg-primary h-full transition-all duration-300"
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
            <div className="bg-white p-3.5 rounded-xl border border-slate-200 flex flex-col justify-between">
              <div className="flex items-center justify-between">
                <span className="text-slate-500 font-medium">Jarak Monitor</span>
                <Ruler className="w-4 h-4 text-slate-400" />
              </div>
              <div className="my-1.5">
                <div className={`text-xl font-extrabold font-mono ${isWarn ? "text-rose-600" : isFar ? "text-amber-600" : "text-emerald-600"}`}>
                  ~{dist.distanceCm} cm
                </div>
                <div className="text-[10px] text-slate-400 mt-0.5">
                  {isWarn ? "Terlalu Dekat (<50cm)" : isFar ? "Jauh (>75cm)" : "Ideal (50-70cm)"}
                </div>
              </div>
            </div>
          );
        })()}

        {/* Card 3: Slouch Incident */}
        <div className="bg-white p-3.5 rounded-xl border border-slate-200 flex flex-col justify-between">
          <div className="text-slate-500 font-medium">Insiden Slouch</div>
          <div className="my-1.5">
            <div className="text-xl font-extrabold text-amber-600 font-mono">{slouchCount} kali</div>
            <div className="text-[10px] text-slate-400 mt-0.5">Bahu turun / leher maju</div>
          </div>
        </div>

        {/* Card 4: Proximity Incident */}
        <div className="bg-white p-3.5 rounded-xl border border-slate-200 flex flex-col justify-between">
          <div className="text-slate-500 font-medium">Mata Terlalu Dekat</div>
          <div className="my-1.5">
            <div className="text-xl font-extrabold text-amber-600 font-mono">{tooCloseCount} kali</div>
            <div className="text-[10px] text-slate-400 mt-0.5">Eye-strain proximity</div>
          </div>
        </div>

        {/* Card 5: Work Bout & Session Status */}
        <div className="bg-white p-3.5 rounded-xl border border-slate-200 flex flex-col justify-between col-span-2 sm:col-span-1">
          <div className="text-slate-500 font-medium">Batas &amp; Status</div>
          <div className="my-1.5">
            <div className="text-base font-bold text-slate-800">
              {demoMode ? "15s (Demo)" : "50m (ISO)"}
            </div>
            <div className="text-[10px] text-emerald-600 font-semibold flex items-center gap-1 mt-0.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
              {sessionActive ? `Aktif (${formatTime(sittingSeconds)})` : "Menunggu"}
            </div>
          </div>
        </div>
      </div>

      {/* Manual Simulation Controls for Reviewers / Desktop Lab */}
      <div className="bg-slate-50 rounded-xl p-3 border border-slate-200 text-xs flex flex-wrap items-center justify-between gap-2">
        <span className="text-slate-600 font-medium">
          Lab Tools (Penguji Demo):
        </span>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setSittingSeconds(sittingLimitSeconds)}
            className="px-2.5 py-1.5 bg-amber-100 hover:bg-amber-200 text-amber-800 rounded-lg font-semibold transition-colors"
            title="Kunci layar sekarang untuk tes Active Break"
          >
            Trigger Lock Break Sekarang
          </button>
          <button
            onClick={() => {
              setSessionActive(!sessionActive);
              if (!sessionActive) sessionStartTimeRef.current = new Date();
            }}
            className={`px-3 py-1.5 rounded-lg font-semibold flex items-center gap-1 text-white ${
              sessionActive ? "bg-slate-700 hover:bg-slate-800" : "bg-primary hover:bg-blue-700"
            }`}
          >
            {sessionActive ? (
              <>
                <Square className="w-3.5 h-3.5 fill-white" /> Jeda Sesi
              </>
            ) : (
              <>
                <Play className="w-3.5 h-3.5 fill-white" /> Lanjutkan Sesi
              </>
            )}
          </button>
        </div>
      </div>

      {/* ========================================================= */}
      {/* ANTI-CHEAT ACTIVE BREAK PANEL (NO SNOOZE / SKIP BUTTON) */}
      {/* ========================================================= */}
      {isBreakLocked && (
        <div className="relative z-50 max-w-xl mx-auto bg-slate-900 border-2 border-emerald-500 rounded-3xl p-6 sm:p-7 shadow-2xl text-white text-center space-y-5 animate-fadeIn">
          {/* Header Badge */}
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-rose-500/20 border border-rose-500/40 text-rose-300 text-xs font-semibold">
            <Flame className="w-4 h-4 text-rose-400" />
            Waktu Duduk Maksimum Tercapai ({demoMode ? "15 Detik" : "50 Menit"})
          </div>

          <div className="space-y-1">
            <h2 className="text-xl sm:text-2xl font-extrabold font-heading text-white">
              Anti-Cheat Active Break
            </h2>
            <p className="text-xs text-slate-300 leading-relaxed max-w-md mx-auto">
              Layar dikunci hingga kamera AI memverifikasi peregangan aktif Anda (tidak ada tombol skip/snooze). Skeleton di atas akan berubah <b className="text-emerald-400">HIJAU</b> saat tangan Anda diangkat.
            </p>
          </div>

          {/* Rep Counter & Progress */}
          <div className="bg-slate-800/90 rounded-2xl p-5 border border-slate-700 space-y-4">
            <div className="flex items-center justify-between text-xs font-semibold text-slate-300">
              <span className="flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-emerald-400" /> Pose 1: Overhead Arm Stretch
              </span>
              <span className="text-emerald-400 font-bold font-mono">
                {breakRepsCompleted} / {targetReps} Repetisi
              </span>
            </div>

            {/* Rep Circles */}
            <div className="flex justify-center gap-4">
              {Array.from({ length: targetReps }).map((_, idx) => (
                <div
                  key={idx}
                  className={`w-11 h-11 rounded-full flex items-center justify-center font-bold text-sm border-2 transition-all ${
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
                  {isHoldingStretch ? "✓ Tahan pose overhead stretch..." : "Angkat kedua tangan lurus ke atas kepala"}
                </span>
                <span className="text-amber-400 font-bold">
                  {currentRepHoldSeconds.toFixed(1)}s / {targetHoldSeconds}s
                </span>
              </div>
              <div className="w-full bg-slate-700/80 h-3 rounded-full overflow-hidden p-0.5 border border-slate-600">
                <div
                  className="bg-emerald-400 h-full rounded-full transition-all duration-100 shadow-xs"
                  style={{
                    width: `${Math.min(100, (currentRepHoldSeconds / targetHoldSeconds) * 100)}%`,
                  }}
                />
              </div>
            </div>
          </div>

          {/* Stand Away Alternative */}
          <div className="text-xs text-slate-400 flex items-center justify-between bg-slate-800/40 px-4 py-2.5 rounded-xl border border-slate-700/50">
            <span>Opsi 2: Berdiri menjauh dari meja kerja</span>
            <span className="font-mono text-slate-300 font-bold">
              {standAwayDurationSecs.toFixed(0)}s / {targetStandAwaySeconds}s
            </span>
          </div>

          {/* Emergency Fallback Bypass for Testers */}
          <div className="pt-1 flex justify-center">
            <button
              onClick={() => completeActiveBreak("MANUAL_LOG")}
              className="text-xs text-slate-500 hover:text-slate-300 transition-colors underline"
            >
              Simulasi Manual Bypass (Khusus Penguji Tanpa Webcam)
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
