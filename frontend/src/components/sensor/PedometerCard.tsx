import React, { useEffect, useRef, useState } from "react";
import {
  Footprints,
  Activity,
  Flame,
  Play,
  Square,
  RotateCcw,
  Smartphone,
  Zap,
  Plus,
  CheckCircle2,
  AlertTriangle,
} from "lucide-react";
import {
  PedometerEngine,
  type StepEventDetail,
  type CadenceIntensity,
  classifyCadence,
} from "@/utils/pedometerSensor";
import { api } from "@/lib/api";

interface PedometerCardProps {
  onStepsChange?: (steps: number, metMinutes: number) => void;
  className?: string;
}

export const PedometerCard: React.FC<PedometerCardProps> = ({
  onStepsChange,
  className = "",
}) => {
  const engineRef = useRef<PedometerEngine | null>(null);

  const [isTracking, setIsTracking] = useState(false);
  const [totalSteps, setTotalSteps] = useState(0);
  const [cadenceSpm, setCadenceSpm] = useState(0);
  const [intensityType, setIntensityType] = useState<CadenceIntensity>("IDLE");
  const [metMultiplier, setMetMultiplier] = useState(1.0);
  const [metMinutes, setMetMinutes] = useState(0);
  const [lastNetAcc, setLastNetAcc] = useState(0);
  const [permissionState, setPermissionState] = useState<"unknown" | "granted" | "denied">("unknown");
  const [sensorSupported, setSensorSupported] = useState(true);
  const [savedSuccess, setSavedSuccess] = useState(false);

  useEffect(() => {
    const engine = new PedometerEngine();
    engineRef.current = engine;

    engine.setStepCallback((detail: StepEventDetail) => {
      setTotalSteps(detail.totalSteps);
      setCadenceSpm(detail.cadenceSpm);
      setIntensityType(detail.intensityType);
      setMetMultiplier(detail.metMultiplier);
      setMetMinutes(detail.metMinutes);
      setLastNetAcc(detail.lastNetAcc);
      if (onStepsChange) {
        onStepsChange(detail.totalSteps, detail.metMinutes);
      }
    });

    return () => {
      engine.stop();
    };
  }, [onStepsChange]);

  const handleToggleTracking = async () => {
    if (!engineRef.current) return;

    if (isTracking) {
      engineRef.current.stop();
      setIsTracking(false);
    } else {
      const res = await engineRef.current.start();
      setSensorSupported(res.supported);
      if (!res.permissionGranted) {
        setPermissionState("denied");
        setIsTracking(false);
      } else {
        setPermissionState("granted");
        setIsTracking(true);
      }
    }
  };

  const handleSimulateStep = (count = 1) => {
    if (!engineRef.current) return;
    for (let i = 0; i < count; i++) {
      engineRef.current.simulateStep();
    }
    const snap = engineRef.current.getSnapshot();
    setTotalSteps(snap.totalSteps);
    setCadenceSpm(snap.cadenceSpm || (count > 1 ? 85 : 60));
    const classified = classifyCadence(snap.cadenceSpm || (count > 1 ? 85 : 60));
    setIntensityType(classified.intensityType);
    setMetMultiplier(classified.metMultiplier);
    setMetMinutes(snap.metMinutes);
    if (onStepsChange) {
      onStepsChange(snap.totalSteps, snap.metMinutes);
    }
  };

  const handleReset = () => {
    if (!engineRef.current) return;
    engineRef.current.reset();
    setTotalSteps(0);
    setCadenceSpm(0);
    setIntensityType("IDLE");
    setMetMultiplier(1.0);
    setMetMinutes(0);
    setLastNetAcc(0);
    setSavedSuccess(false);
  };

  const handleSaveToActivity = async () => {
    try {
      const intensity =
        intensityType === "VIGOROUS"
          ? "VIGOROUS"
          : intensityType === "MODERATE"
          ? "MODERATE"
          : "WALKING";

      await api.submitPhysicalActivity({
        activityDate: new Date().toISOString().split("T")[0],
        intensityType: intensity,
        durationMinutes: Math.max(1, Math.round(metMinutes / Math.max(1, metMultiplier))),
        stepsCount: totalSteps,
        avgCadenceSpm: cadenceSpm || 70,
        source: "WEB_SENSOR_API",
        notes: `Terekam otomatis via 3-Axis DSP DeviceMotion (${metMinutes.toFixed(1)} MET-menit)`,
      });

      setSavedSuccess(true);
      setTimeout(() => setSavedSuccess(false), 3000);
    } catch (err) {
      console.error("Gagal menyimpan aktivitas:", err);
    }
  };

  // Badge styling
  const getBadgeStyle = () => {
    switch (intensityType) {
      case "VIGOROUS":
        return "bg-rose-100 text-rose-700 border-rose-300";
      case "MODERATE":
        return "bg-amber-100 text-amber-800 border-amber-300";
      case "WALKING":
        return "bg-emerald-100 text-emerald-800 border-emerald-300";
      default:
        return "bg-slate-100 text-slate-600 border-slate-200";
    }
  };

  return (
    <div className={`bg-white rounded-2xl p-6 border border-slate-200 shadow-xs ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl">
            <Footprints className="w-6 h-6" />
          </div>
          <div>
            <h3 className="font-heading font-bold text-base text-textMain">
              3-Axis Pedometer &amp; IPAQ-SF Sensor
            </h3>
            <p className="text-xs text-slate-500">
              HTML5 DeviceMotionEvent &bull; 25-Sample High-Pass Filter &bull; Zero Server Latency
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span
            className={`px-2.5 py-1 text-xs font-semibold rounded-full border transition-colors ${getBadgeStyle()}`}
          >
            {intensityType} ({metMultiplier}x MET)
          </span>
        </div>
      </div>

      {/* Main Metric Ring / Big Counter */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        {/* Step Count Big Display */}
        <div className="bg-slate-50 rounded-xl p-5 border border-slate-100 flex flex-col items-center justify-center text-center relative overflow-hidden">
          <div className="text-xs text-slate-500 font-medium mb-1 flex items-center gap-1.5">
            <Footprints className="w-4 h-4 text-emerald-600" /> Total Langkah
          </div>
          <div className="text-4xl font-extrabold text-textMain tracking-tight my-1">
            {totalSteps.toLocaleString()}
          </div>
          <div className="text-[11px] text-slate-400">
            {isTracking ? "Sensor aktif membaca ayunan..." : "Pelacak tidak aktif"}
          </div>

          {lastNetAcc > 0 && isTracking && (
            <div className="absolute top-2 right-2 text-[10px] bg-emerald-100 text-emerald-700 px-1.5 py-0.5 rounded font-mono">
              +{lastNetAcc.toFixed(1)} m/s²
            </div>
          )}
        </div>

        {/* Cadence Display */}
        <div className="bg-slate-50 rounded-xl p-5 border border-slate-100 flex flex-col items-center justify-center text-center">
          <div className="text-xs text-slate-500 font-medium mb-1 flex items-center gap-1.5">
            <Activity className="w-4 h-4 text-blue-600" /> Cadence (Irama)
          </div>
          <div className="text-4xl font-extrabold text-blue-600 tracking-tight my-1">
            {cadenceSpm}
          </div>
          <div className="text-[11px] text-slate-400">
            Langkah per Menit (SPM)
          </div>
        </div>

        {/* MET-Minutes */}
        <div className="bg-slate-50 rounded-xl p-5 border border-slate-100 flex flex-col items-center justify-center text-center">
          <div className="text-xs text-slate-500 font-medium mb-1 flex items-center gap-1.5">
            <Flame className="w-4 h-4 text-amber-500" /> Volume MET-Menit
          </div>
          <div className="text-4xl font-extrabold text-amber-600 tracking-tight my-1">
            {metMinutes.toFixed(1)}
          </div>
          <div className="text-[11px] text-slate-400">
            Akumulasi Beban Metabolik
          </div>
        </div>
      </div>

      {/* Cadence Range Scale Guide */}
      <div className="mb-6 bg-slate-50 p-3.5 rounded-xl border border-slate-100 text-xs">
        <div className="flex justify-between items-center text-[11px] font-semibold text-slate-500 mb-1.5">
          <span>Klasifikasi Irama IPAQ-SF:</span>
          <span>{cadenceSpm} SPM Saat Ini</span>
        </div>
        <div className="grid grid-cols-4 gap-1 text-center text-[10px] font-medium">
          <div
            className={`p-1.5 rounded ${
              intensityType === "IDLE" ? "bg-slate-200 text-slate-800 font-bold" : "bg-white text-slate-500"
            }`}
          >
            &lt;50 SPM<br /><span className="text-[9px]">IDLE (1.0x)</span>
          </div>
          <div
            className={`p-1.5 rounded ${
              intensityType === "WALKING" ? "bg-emerald-200 text-emerald-900 font-bold" : "bg-white text-slate-500"
            }`}
          >
            50-99 SPM<br /><span className="text-[9px]">WALK (3.3x)</span>
          </div>
          <div
            className={`p-1.5 rounded ${
              intensityType === "MODERATE" ? "bg-teal-200 text-teal-900 font-bold" : "bg-white text-slate-500"
            }`}
          >
            100-129 SPM<br /><span className="text-[9px]">MOD (4.0x)</span>
          </div>
          <div
            className={`p-1.5 rounded ${
              intensityType === "VIGOROUS" ? "bg-rose-200 text-rose-900 font-bold" : "bg-white text-slate-500"
            }`}
          >
            &ge;130 SPM<br /><span className="text-[9px]">VIG (8.0x)</span>
          </div>
        </div>
      </div>

      {/* Permission Warning if Denied */}
      {permissionState === "denied" && (
        <div className="mb-4 p-3 bg-red-50 text-red-700 text-xs rounded-xl flex items-center gap-2 border border-red-200">
          <AlertTriangle className="w-4 h-4 shrink-0" />
          <span>
            Izin sensor gerak ditolak oleh peramban. Di iOS Safari, silakan izinkan akses sensor gerak di pengaturan situs atau gunakan tombol simulasi di bawah.
          </span>
        </div>
      )}

      {!sensorSupported && (
        <div className="mb-4 p-3 bg-amber-50 text-amber-700 text-xs rounded-xl flex items-center gap-2 border border-amber-200">
          <Smartphone className="w-4 h-4 shrink-0" />
          <span>
            Perangkat desktop tidak memiliki sensor accelerometer fisik. Gunakan tombol simulasi langkah di bawah untuk pengujian lab.
          </span>
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-slate-100">
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={handleToggleTracking}
            className={`px-4 py-2.5 rounded-xl text-xs font-semibold flex items-center gap-2 transition-colors shadow-xs ${
              isTracking
                ? "bg-red-600 hover:bg-red-700 text-white"
                : "bg-emerald-600 hover:bg-emerald-700 text-white"
            }`}
          >
            {isTracking ? (
              <>
                <Square className="w-4 h-4 fill-white" /> Hentikan Sensor Gerak
              </>
            ) : (
              <>
                <Play className="w-4 h-4 fill-white" /> Aktifkan Sensor HP
              </>
            )}
          </button>

          <button
            onClick={handleReset}
            className="px-3 py-2.5 rounded-xl text-xs font-medium border border-slate-200 hover:bg-slate-50 text-slate-600 flex items-center gap-1.5 transition-colors"
          >
            <RotateCcw className="w-3.5 h-3.5" /> Reset
          </button>
        </div>

        {/* Desktop Simulation Fallbacks */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => handleSimulateStep(1)}
            className="px-3 py-2 rounded-lg text-xs font-medium bg-slate-100 hover:bg-slate-200 text-slate-700 flex items-center gap-1 transition-colors"
            title="Simulasi 1 langkah (Desktop Testing)"
          >
            <Plus className="w-3.5 h-3.5" /> 1 Langkah
          </button>

          <button
            onClick={() => handleSimulateStep(10)}
            className="px-3 py-2 rounded-lg text-xs font-medium bg-slate-100 hover:bg-slate-200 text-slate-700 flex items-center gap-1 transition-colors"
            title="Simulasi 10 langkah (Desktop Testing)"
          >
            <Zap className="w-3.5 h-3.5 text-amber-500" /> +10 Langkah
          </button>

          {totalSteps > 0 && (
            <button
              onClick={handleSaveToActivity}
              className={`px-3 py-2 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors ${
                savedSuccess
                  ? "bg-emerald-100 text-emerald-800 border border-emerald-300"
                  : "bg-primary hover:bg-blue-700 text-white"
              }`}
            >
              {savedSuccess ? (
                <>
                  <CheckCircle2 className="w-3.5 h-3.5" /> Tersimpan!
                </>
              ) : (
                <>Simpan ke Log</>
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

