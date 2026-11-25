import React, { useEffect, useRef, useState } from "react";
import {
  Footprints,
  Play,
  Square,
  RotateCcw,
  Smartphone,
  CheckCircle2,
  AlertTriangle,
  Sparkles,
  TrendingUp,
  Home,
  BookOpen,
  Waves,
  Flag,
  Bike,
  Globe,
  Plus,
} from "lucide-react";
import {
  PedometerEngine,
  type StepEventDetail,
  type CadenceIntensity,
} from "@/utils/pedometerSensor";
import { api } from "@/lib/api";

interface PedometerCardProps {
  onStepsChange?: (steps: number, metMinutes: number) => void;
  className?: string;
  afterMainCard?: React.ReactNode;
}

interface RoutePoint {
  x: number;
  y: number;
}

interface RouteSegment {
  minSteps: number;
  maxSteps: number;
  p0: RoutePoint;
  c1: RoutePoint;
  c2: RoutePoint;
  p3: RoutePoint;
}

const ROUTE_SEGMENTS: RouteSegment[] = [
  {
    minSteps: 0,
    maxSteps: 500,
    p0: { x: 78, y: 134 },
    c1: { x: 108, y: 134 },
    c2: { x: 132, y: 108 },
    p3: { x: 170, y: 108 },
  },
  {
    minSteps: 500,
    maxSteps: 1500,
    p0: { x: 170, y: 108 },
    c1: { x: 222, y: 108 },
    c2: { x: 268, y: 132 },
    p3: { x: 325, y: 132 },
  },
  {
    minSteps: 1500,
    maxSteps: 3000,
    p0: { x: 325, y: 132 },
    c1: { x: 400, y: 132 },
    c2: { x: 448, y: 98 },
    p3: { x: 515, y: 98 },
  },
  {
    minSteps: 3000,
    maxSteps: 6000,
    p0: { x: 515, y: 98 },
    c1: { x: 625, y: 74 },
    c2: { x: 725, y: 118 },
    p3: { x: 832, y: 102 },
  },
];

const ROUTE_SVG_PATH =
  "M 78 134 C 108 134, 132 108, 170 108 C 222 108, 268 132, 325 132 C 400 132, 448 98, 515 98 C 625 74, 725 118, 832 102";

function evalCubicBezier(seg: RouteSegment, u: number): RoutePoint {
  const t = Math.max(0, Math.min(1, u));
  const mt = 1 - t;
  const x =
    mt * mt * mt * seg.p0.x +
    3 * mt * mt * t * seg.c1.x +
    3 * mt * t * t * seg.c2.x +
    t * t * t * seg.p3.x;
  const y =
    mt * mt * mt * seg.p0.y +
    3 * mt * mt * t * seg.c1.y +
    3 * mt * t * t * seg.c2.y +
    t * t * t * seg.p3.y;
  return { x, y };
}

function getMarkerPositionForSteps(steps: number): RoutePoint {
  const clamped = Math.max(0, Math.min(6000, steps));
  for (const seg of ROUTE_SEGMENTS) {
    if (clamped <= seg.maxSteps) {
      const u = (clamped - seg.minSteps) / Math.max(1, seg.maxSteps - seg.minSteps);
      return evalCubicBezier(seg, u);
    }
  }
  return ROUTE_SEGMENTS[ROUTE_SEGMENTS.length - 1].p3;
}

const CAMPUS_MILESTONES = [
  { steps: 500, title: "20 kkal", calories: 20, icon: "home" as const, x: 170, y: 108 },
  { steps: 1500, title: "60 kkal", calories: 60, icon: "book" as const, x: 325, y: 132 },
  { steps: 3000, title: "120 kkal", calories: 120, icon: "waves" as const, x: 515, y: 98 },
  { steps: 6000, title: "240 kkal", calories: 240, icon: "flag" as const, x: 832, y: 102 },
];

export const PedometerCard: React.FC<PedometerCardProps> = ({
  onStepsChange,
  className = "",
  afterMainCard,
}) => {
  const engineRef = useRef<PedometerEngine | null>(null);

  const [isTracking, setIsTracking] = useState(false);
  const [totalSteps, setTotalSteps] = useState(0);
  const [cadenceSpm, setCadenceSpm] = useState(0);
  const [intensityType, setIntensityType] = useState<CadenceIntensity>("IDLE");
  const [metMinutes, setMetMinutes] = useState(0);
  const [permissionState, setPermissionState] = useState<"unknown" | "granted" | "denied">("unknown");
  const [sensorSupported, setSensorSupported] = useState(true);
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [quickActivityFeedback, setQuickActivityFeedback] = useState<string | null>(null);

  useEffect(() => {
    const engine = new PedometerEngine();
    engineRef.current = engine;

    engine.setStepCallback((detail: StepEventDetail) => {
      setTotalSteps(detail.totalSteps);
      setCadenceSpm(detail.cadenceSpm);
      setIntensityType(detail.intensityType);
      setMetMinutes(detail.metMinutes);
      if (onStepsChange) {
        onStepsChange(detail.totalSteps, detail.metMinutes);
      }
    });

    if (typeof window !== "undefined" && !window.DeviceMotionEvent) {
      setSensorSupported(false);
    }

    // Muat akumulasi langkah & METs hari ini dari database MySQL
    const todayIso = new Date().toISOString().slice(0, 10);
    api
      .getPhysicalActivities(7)
      .then((res) => {
        const items = Array.isArray(res.data?.items)
          ? (res.data.items as Array<{
              activityDate?: string;
              stepsCount?: number | null;
              calculatedMets?: number;
            }>)
          : [];
        const todayItems = items.filter((it) =>
          String(it.activityDate || "").startsWith(todayIso)
        );
        if (todayItems.length > 0) {
          const sumSteps = todayItems.reduce(
            (acc, it) => acc + (Number(it.stepsCount) || 0),
            0
          );
          const sumMets = todayItems.reduce(
            (acc, it) => acc + (Number(it.calculatedMets) || 0),
            0
          );
          if (sumSteps > 0 || sumMets > 0) {
            setTotalSteps(sumSteps);
            setMetMinutes(sumMets);
          }
        }
      })
      .catch(() => {});

    return () => {
      engine.stop();
    };
  }, [onStepsChange]);

  const handleToggleTracking = async () => {
    const engine = engineRef.current;
    if (!engine) return;

    if (isTracking) {
      engine.stop();
      setIsTracking(false);
    } else {
      const res = await engine.start();
      if (!res.supported) {
        setSensorSupported(false);
        return;
      }
      if (!res.permissionGranted) {
        setPermissionState("denied");
        return;
      }
      setPermissionState("granted");
      setIsTracking(true);
    }
  };

  const handleReset = () => {
    const engine = engineRef.current;
    if (engine) {
      engine.reset();
      setTotalSteps(0);
      setCadenceSpm(0);
      setIntensityType("IDLE");
      setMetMinutes(0);
      if (onStepsChange) {
        onStepsChange(0, 0);
      }
    }
  };

  // Quick Campus Activity Logger (Auto-Sync to MySQL Database)
  const handleLogQuickActivity = (addSteps: number, addMet: number, name: string) => {
    const newSteps = totalSteps + addSteps;
    const newMet = metMinutes + addMet;
    setTotalSteps(newSteps);
    setMetMinutes(newMet);
    setIntensityType("MODERATE");
    if (onStepsChange) {
      onStepsChange(newSteps, newMet);
    }
    setQuickActivityFeedback(`+${addSteps.toLocaleString()} langkah dari ${name} (Tersimpan ke DB)!`);
    setTimeout(() => setQuickActivityFeedback(null), 3000);

    void api
      .submitPhysicalActivity({
        activityDate: new Date().toISOString().slice(0, 10),
        intensityType: "MODERATE",
        durationMinutes: Math.max(1, Math.round(addSteps / 100)),
        stepsCount: addSteps,
        avgCadenceSpm: 105,
        source: "WEB_SENSOR_API",
        notes: `${name}: +${addSteps} langkah (${addMet} MET-menit)`,
      })
      .catch((err) => console.warn("Gagal menyimpan aktivitas cepat ke DB:", err));
  };

  const handleSaveToActivity = async () => {
    if (totalSteps === 0) return;
    try {
      await api.submitPhysicalActivity({
        activityDate: new Date().toISOString().slice(0, 10),
        intensityType: intensityType === "VIGOROUS" ? "VIGOROUS" : intensityType === "WALKING" ? "WALKING" : "MODERATE",
        durationMinutes: Math.max(1, Math.round(totalSteps / 100)),
        stepsCount: totalSteps,
        avgCadenceSpm: cadenceSpm,
        source: "WEB_SENSOR_API",
        notes: `Pedometer: ${metMinutes.toFixed(1)} MET-menit`,
      });
      setSavedSuccess(true);
      setTimeout(() => setSavedSuccess(false), 3000);
    } catch (err) {
      console.error("Gagal menyimpan log aktivitas:", err);
    }
  };

  // Calculations
  const distanceKm = (totalSteps * 0.00075).toFixed(2);
  const caloriesBurned = Math.round(totalSteps * 0.04);
  const dailyTargetProgress = Math.min(100, Math.round((totalSteps / 6000) * 100));
  const markerPos = getMarkerPositionForSteps(totalSteps);
  const markerLeftPct = (markerPos.x / 920) * 100;
  const markerTopPct = (markerPos.y / 230) * 100;

  return (
    <div className={`space-y-6 ${className}`}>
      {/* 1. Main Pedometer Route & Metrics Card */}
      <div className="learnova-card p-6 border-[#E8DDCF] bg-white space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3.5">
            <div className="w-11 h-11 rounded-2xl bg-[#CFD8C4] border border-[#BCC8AE] text-[#2F3A2E] flex items-center justify-center shrink-0 shadow-xs">
              <Footprints className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-heading font-extrabold text-base sm:text-lg text-[#2F3A2E] leading-tight">
                Penghitung Langkah Otomatis
              </h3>
              <p className="text-xs text-[#636B60] mt-0.5">
                Berjalan di kampus, pantau langkah dan kalori yang terbakar hari ini.
              </p>
            </div>
          </div>
        </div>

        {/* Interactive Campus Walking Route Map */}
        <div className="relative rounded-[1.5rem] bg-gradient-to-b from-[#F1F5EC] via-[#F4F6EE] to-[#E6EEE0] border border-[#E2D9CB] overflow-hidden">
          <div className="relative w-full h-[230px] sm:h-[250px] select-none">
            <svg
              viewBox="0 0 920 230"
              preserveAspectRatio="none"
              className="w-full h-full block"
              aria-hidden="true"
            >
              {/* Soft Fluffy Sky Clouds */}
              <g fill="#FCFBF7" opacity="0.95">
                <path d="M136,52 C136,44 144,39 154,40 C159,32 173,30 183,36 C191,35 199,40 199,47 C199,54 191,58 182,58 L146,58 C140,58 136,55 136,52 Z" />
                <path d="M478,42 C478,34 487,28 498,30 C505,21 522,19 534,26 C544,24 554,30 554,38 C554,46 544,50 533,50 L490,50 C483,50 478,47 478,42 Z" />
              </g>

              {/* Warm Sun & Soft Halo (Top-Right Sky) */}
              <g>
                <circle cx="776" cy="54" r="38" fill="#E8DDCF" fillOpacity="0.88" />
                <circle cx="776" cy="54" r="22" fill="#E3A845" />
              </g>

              {/* 3 Layered Rolling Sage Campus Hills */}
              <path
                d="M0,148 C155,112 295,156 465,126 C620,98 765,126 920,144 L920,230 L0,230 Z"
                fill="#D7E2D0"
              />
              <path
                d="M0,176 C195,150 390,188 615,162 C740,148 838,158 920,168 L920,230 L0,230 Z"
                fill="#C4D3BC"
              />
              <path
                d="M0,202 C250,186 520,214 780,196 C842,192 886,195 920,199 L920,230 L0,230 Z"
                fill="#B3C4AA"
              />

              {/* Minimal Round Campus Trees */}
              <g>
                {/* Left Tree */}
                <rect x="82.5" y="164" width="3" height="16" rx="1.5" fill="#5D7057" />
                <circle cx="84" cy="158" r="10.5" fill="#7D9473" />
                {/* Right-Center Pair */}
                <rect x="606.5" y="160" width="3" height="15" rx="1.5" fill="#5D7057" />
                <circle cx="608" cy="154" r="10" fill="#7B9271" />
                <rect x="630.5" y="166" width="2.6" height="11" rx="1.3" fill="#677A61" />
                <circle cx="631.8" cy="161" r="7" fill="#8EA484" />
                {/* Far-Right Tree */}
                <rect x="824.5" y="160" width="3" height="15" rx="1.5" fill="#5D7057" />
                <circle cx="826" cy="154" r="10" fill="#7D9473" />
              </g>

              {/* Winding Campus Route: Crisp Creamy White Track */}
              <path
                d={ROUTE_SVG_PATH}
                fill="none"
                stroke="#FCFBF7"
                strokeWidth="12"
                strokeLinecap="round"
              />
              {/* Completed Progress Overlay */}
              {dailyTargetProgress > 0 && (
                <path
                  d={ROUTE_SVG_PATH}
                  fill="none"
                  stroke="#E8DDCF"
                  strokeWidth="12"
                  strokeLinecap="round"
                  pathLength={100}
                  strokeDasharray={100}
                  strokeDashoffset={100 - dailyTargetProgress}
                  className="transition-all duration-500"
                />
              )}
              {/* Center Dotted Trail Stones */}
              <path
                d={ROUTE_SVG_PATH}
                fill="none"
                stroke="#C5B9A8"
                strokeWidth="2.4"
                strokeDasharray="1 11"
                strokeLinecap="round"
              />
            </svg>

            {/* Milestone Nodes & Labels */}
            {CAMPUS_MILESTONES.map((milestone) => {
              const isReached = totalSteps >= milestone.steps;
              const leftPct = (milestone.x / 920) * 100;
              const topPct = (milestone.y / 230) * 100;
              return (
                <div
                  key={milestone.steps}
                  style={{ left: `${leftPct}%`, top: `${topPct}%` }}
                  className="absolute -translate-x-1/2 -translate-y-1/2 flex flex-col items-center z-10"
                >
                  <div
                    className={`w-10 h-10 rounded-full border-[2.5px] flex items-center justify-center transition-all shadow-xs ${
                      isReached
                        ? "bg-[#CFD8C4] border-[#2F3A2E] text-[#2F3A2E]"
                        : "bg-[#FCFBF7] border-[#E0D5C5] text-[#4C5C4E]"
                    }`}
                  >
                    {milestone.icon === "home" && <Home className="w-4 h-4" />}
                    {milestone.icon === "book" && <BookOpen className="w-4 h-4" />}
                    {milestone.icon === "waves" && <Waves className="w-4 h-4" />}
                    {milestone.icon === "flag" && <Flag className="w-4 h-4" />}
                  </div>
                  <div
                    className={`mt-1.5 px-3 py-1.5 rounded-2xl border text-center leading-tight shadow-xs whitespace-nowrap transition-colors ${
                      isReached
                        ? "bg-[#E8F0E3] border-[#BCC8AE]"
                        : "bg-[#FCFBF7]/95 border-[#E5DACB]"
                    }`}
                    title={`Target ${milestone.steps.toLocaleString("id-ID")} langkah • Estimasi ${milestone.title} terbakar`}
                  >
                    <div className="text-[11px] font-heading font-extrabold text-[#2F3A2E] sensor-num">
                      {milestone.steps.toLocaleString("id-ID")}
                    </div>
                    <div className="text-[10px] font-semibold text-[#5E675C]">
                      {milestone.title}
                    </div>
                  </div>
                </div>
              );
            })}

            {/* Live Moving Footprints Marker with Speech Tooltip */}
            <div
              style={{ left: `${markerLeftPct}%`, top: `${markerTopPct}%` }}
              className="absolute -translate-x-1/2 -translate-y-[74%] z-20 transition-all duration-500 flex flex-col items-center"
            >
              <div className="relative mb-2 px-3.5 py-1 rounded-full bg-[#243B2E] text-white text-[11px] font-bold shadow-md whitespace-nowrap">
                <span>
                  {totalSteps === 0
                    ? "Mulai di sini"
                    : `${totalSteps.toLocaleString("id-ID")} langkah`}
                </span>
                <span className="absolute left-1/2 -bottom-1 -translate-x-1/2 w-2.5 h-2.5 rotate-45 bg-[#243B2E]" />
              </div>
              <div className="w-10 h-10 rounded-full bg-[#E3A845] border-[3px] border-[#FCFBF7] text-[#243B2E] flex items-center justify-center shadow-md">
                <Footprints className="w-4 h-4" />
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Summary Metrics Row */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-5">
          {/* Total Langkah Big Display */}
          <div className="shrink-0 min-w-[165px]">
            <p className="text-xs font-bold text-[#636B60]">Total langkah</p>
            <div className="text-4xl sm:text-[2.75rem] font-heading font-extrabold text-[#2F3A2E] tracking-tight leading-none my-1.5 sensor-num">
              {totalSteps.toLocaleString("id-ID")}
            </div>
            <p className="text-xs font-medium text-[#636B60]">
              {dailyTargetProgress}% dari 6.000 langkah
            </p>
          </div>

          {/* 4 Metric Mini-Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 flex-1">
            <div className="bg-[#FAF6F0] border border-[#E8DDCF] rounded-2xl p-4 flex flex-col justify-between">
              <div className="text-lg sm:text-xl font-heading font-extrabold text-[#2F3A2E] sensor-num">
                {cadenceSpm}
              </div>
              <div className="text-xs font-medium text-[#636B60] mt-1">Langkah/menit</div>
            </div>

            <div className="bg-[#FAF6F0] border border-[#E8DDCF] rounded-2xl p-4 flex flex-col justify-between">
              <div className="text-lg sm:text-xl font-heading font-extrabold text-[#2F3A2E] sensor-num">
                {metMinutes.toFixed(1).replace(".", ",")}
              </div>
              <div className="text-xs font-medium text-[#636B60] mt-1">MET-menit</div>
            </div>

            <div className="bg-[#FAF6F0] border border-[#E8DDCF] rounded-2xl p-4 flex flex-col justify-between">
              <div className="text-lg sm:text-xl font-heading font-extrabold text-[#2F3A2E] sensor-num">
                {distanceKm.replace(".", ",")} km
              </div>
              <div className="text-xs font-medium text-[#636B60] mt-1">Jarak</div>
            </div>

            <div className="bg-[#FAF6F0] border border-[#E8DDCF] rounded-2xl p-4 flex flex-col justify-between">
              <div className="text-lg sm:text-xl font-heading font-extrabold text-[#2F3A2E] sensor-num">
                {caloriesBurned} kkal
              </div>
              <div className="text-xs font-medium text-[#636B60] mt-1">Kalori</div>
            </div>
          </div>
        </div>

        {/* Feedback Alert if quick activity logged */}
        {quickActivityFeedback && (
          <div className="p-3 bg-[#CFD8C4] text-[#2F3A2E] text-xs font-bold rounded-2xl flex items-center gap-2 animate-in zoom-in-95 border border-[#BCC8AE]">
            <Sparkles className="w-4 h-4 shrink-0" />
            <span>{quickActivityFeedback}</span>
          </div>
        )}

        {/* Permission Warning if Denied */}
        {permissionState === "denied" && (
          <div className="p-3 bg-[#CFD8C4] text-[#2F3A2E] text-xs rounded-2xl flex items-center gap-2 border border-[#BCC8AE]">
            <AlertTriangle className="w-4 h-4 shrink-0 text-[#2F3A2E]" />
            <span>
              Izin sensor gerak ditolak oleh peramban. Di iOS Safari, silakan izinkan akses sensor gerak di pengaturan situs.
            </span>
          </div>
        )}

        {!sensorSupported && (
          <div className="p-3 bg-[#FAF6F0] text-[#2F3A2E] text-xs rounded-2xl flex items-center gap-2 border border-[#E8DDCF]">
            <Smartphone className="w-4 h-4 shrink-0 text-[#636B60]" />
            <span>
              Perangkat desktop tidak memiliki sensor accelerometer fisik. Gunakan tombol <strong>Pencatat Cepat Aktivitas Fisik Kampus</strong> di bawah untuk melihat progres rute langkah.
            </span>
          </div>
        )}

        {/* Sensor Control Buttons */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
          <div className="flex flex-wrap items-center gap-2.5">
            <button
              type="button"
              onClick={handleToggleTracking}
              className={`px-5 py-2.5 rounded-full text-xs font-extrabold flex items-center gap-2 transition-colors shadow-xs cursor-pointer ${
                isTracking
                  ? "bg-[#BCC8AE] text-[#2F3A2E] border border-[#ADC09E]"
                  : "bg-[#CFD8C4] hover:bg-[#BCC8AE] text-[#2F3A2E] border border-[#BCC8AE]"
              }`}
            >
              {isTracking ? (
                <>
                  <Square className="w-3.5 h-3.5 fill-[#2F3A2E]" /> Hentikan sensor HP
                </>
              ) : (
                <>
                  <Play className="w-3.5 h-3.5 fill-[#2F3A2E]" /> Aktifkan sensor HP
                </>
              )}
            </button>

            <button
              type="button"
              onClick={handleReset}
              className="px-4 py-2.5 rounded-full text-xs font-bold border border-[#E8DDCF] bg-[#FAF6F0] hover:bg-white text-[#2F3A2E] flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" /> Reset
            </button>

            <span className="text-xs text-[#636B60] pl-1">
              {isTracking
                ? "Sensor aktif membaca ayunan langkah."
                : "Pratinjau memakai langkah simulasi atau sensor HP."}
            </span>
          </div>

          {totalSteps > 0 && (
            <button
              type="button"
              onClick={handleSaveToActivity}
              className={`px-4 py-2.5 rounded-full text-xs font-extrabold flex items-center gap-1.5 transition-colors cursor-pointer ${
                savedSuccess
                  ? "bg-[#CFD8C4] text-[#2F3A2E] border border-[#BCC8AE]"
                  : "bg-[#CFD8C4] hover:bg-[#BCC8AE] text-[#2F3A2E] border border-[#BCC8AE] shadow-softPill"
              }`}
            >
              {savedSuccess ? (
                <>
                  <CheckCircle2 className="w-3.5 h-3.5" /> Berhasil Disimpan!
                </>
              ) : (
                <>Simpan ke Log Harian</>
              )}
            </button>
          )}
        </div>
      </div>

      {afterMainCard}

      {/* 2. SUPPORTING FEATURE: PENCATAT OLAHRAGA CEPAT KAMPUS */}
      <div className="learnova-card p-6 border-[#E8DDCF] bg-white space-y-5">
        <div className="flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-2xl bg-[#CFD8C4] border border-[#BCC8AE] text-[#2F3A2E] flex items-center justify-center shrink-0 shadow-xs">
            <TrendingUp className="w-5 h-5" />
          </div>
          <div>
            <h4 className="font-heading font-extrabold text-base sm:text-lg text-[#1D3127] leading-tight">
              Pencatat Cepat Aktivitas Fisik
            </h4>
            <p className="text-xs text-[#636B60] mt-0.5">
              HP tidak di saku? Catat aktivitas non-jalan dengan satu ketukan.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {/* Action 1: Naik Tangga */}
          <div className="p-5 rounded-[1.5rem] bg-[#FAF6F0] border border-[#EBE3D6] flex flex-col justify-between space-y-4">
            <div className="space-y-4">
              <div className="flex items-center justify-between gap-2">
                <div className="w-11 h-11 rounded-2xl bg-[#CFD8C4] border border-[#BCC8AE] text-[#2F3A2E] flex items-center justify-center shrink-0">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
                    <path d="M4 18h4v-4h4v-4h4V6h4" />
                  </svg>
                </div>
              </div>

              <div>
                <div className="font-heading font-extrabold text-sm text-[#1D3127]">
                  Naik tangga gedung kuliah
                </div>
                <p className="text-xs text-[#636B60] mt-0.5">
                  5 menit &middot; setara &plusmn;450 langkah
                </p>
              </div>

              <div className="space-y-2 pt-0.5">
                <div className="text-[11px] font-medium text-[#636B60]">Intensitas ringan</div>
                <div className="w-full h-1.5 rounded-full bg-[#EAE2D6] overflow-hidden">
                  <div className="h-full w-1/4 rounded-full bg-[#243B2E]" />
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={() => handleLogQuickActivity(450, 40, "Naik Tangga Kampus")}
              className="w-full py-2.5 px-4 rounded-full bg-[#CFD8C4] hover:bg-[#BCC8AE] active:bg-[#BCC8AE] text-[#2F3A2E] border border-[#BCC8AE] font-extrabold text-xs transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Catat</span>
            </button>
          </div>

          {/* Action 2: Bersepeda */}
          <div className="p-5 rounded-[1.5rem] bg-[#FAF6F0] border border-[#EBE3D6] flex flex-col justify-between space-y-4">
            <div className="space-y-4">
              <div className="flex items-center justify-between gap-2">
                <div className="w-11 h-11 rounded-2xl bg-[#CFD8C4] border border-[#BCC8AE] text-[#2F3A2E] flex items-center justify-center shrink-0">
                  <Bike className="w-5 h-5" />
                </div>
              </div>

              <div>
                <div className="font-heading font-extrabold text-sm text-[#1D3127]">
                  Bersepeda ke kampus
                </div>
                <p className="text-xs text-[#636B60] mt-0.5">
                  15 menit &middot; setara &plusmn;1.200 langkah
                </p>
              </div>

              <div className="space-y-2 pt-0.5">
                <div className="text-[11px] font-medium text-[#636B60]">Intensitas sedang</div>
                <div className="w-full h-1.5 rounded-full bg-[#EAE2D6] overflow-hidden">
                  <div className="h-full w-1/2 rounded-full bg-[#243B2E]" />
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={() => handleLogQuickActivity(1200, 90, "Bersepeda ke Kampus")}
              className="w-full py-2.5 px-4 rounded-full bg-[#CFD8C4] hover:bg-[#BCC8AE] active:bg-[#BCC8AE] text-[#2F3A2E] border border-[#BCC8AE] font-extrabold text-xs transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Catat</span>
            </button>
          </div>

          {/* Action 3: Futsal, badminton, jogging */}
          <div className="p-5 rounded-[1.5rem] bg-[#FAF6F0] border border-[#EBE3D6] flex flex-col justify-between space-y-4">
            <div className="space-y-4">
              <div className="flex items-center justify-between gap-2">
                <div className="w-11 h-11 rounded-2xl bg-[#CFD8C4] border border-[#BCC8AE] text-[#2F3A2E] flex items-center justify-center shrink-0">
                  <Globe className="w-5 h-5" />
                </div>
              </div>

              <div>
                <div className="font-heading font-extrabold text-sm text-[#1D3127]">
                  Futsal, badminton, jogging
                </div>
                <p className="text-xs text-[#636B60] mt-0.5">
                  30 menit &middot; setara &plusmn;2.500 langkah
                </p>
              </div>

              <div className="space-y-2 pt-0.5">
                <div className="text-[11px] font-medium text-[#636B60]">Intensitas berat</div>
                <div className="w-full h-1.5 rounded-full bg-[#EAE2D6] overflow-hidden">
                  <div className="h-full w-full rounded-full bg-[#243B2E]" />
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={() => handleLogQuickActivity(2500, 180, "Olahraga Sore")}
              className="w-full py-2.5 px-4 rounded-full bg-[#CFD8C4] hover:bg-[#BCC8AE] active:bg-[#BCC8AE] text-[#2F3A2E] border border-[#BCC8AE] font-extrabold text-xs transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Catat</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
