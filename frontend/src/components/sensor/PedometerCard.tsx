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
      setMetMinutes(detail.metMinutes);
      setLastNetAcc(detail.lastNetAcc);
      if (onStepsChange) {
        onStepsChange(detail.totalSteps, detail.metMinutes);
      }
    });

    if (typeof window !== "undefined" && !window.DeviceMotionEvent) {
      setSensorSupported(false);
    }

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
      setLastNetAcc(0);
      if (onStepsChange) {
        onStepsChange(0, 0);
      }
    }
  };

  const handleSimulateStep = (count = 1) => {
    const engine = engineRef.current;
    if (engine) {
      let lastDetail: StepEventDetail | undefined;
      for (let i = 0; i < count; i++) {
        lastDetail = engine.simulateStep();
      }
      if (lastDetail) {
        setTotalSteps(lastDetail.totalSteps);
        setCadenceSpm(lastDetail.cadenceSpm);
        setIntensityType(lastDetail.intensityType);
        setMetMinutes(lastDetail.metMinutes);
        setLastNetAcc(lastDetail.lastNetAcc);
        if (onStepsChange) {
          onStepsChange(lastDetail.totalSteps, lastDetail.metMinutes);
        }
      }
    }
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

  return (
    <div className={`learnova-card p-6 border-[#E8E8E8] ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-2xl bg-[#BDE6F0] text-[#1A1A1A] flex items-center justify-center shrink-0 shadow-xs">
            <Footprints className="w-6 h-6" />
          </div>
          <div>
            <h3 className="font-heading font-extrabold text-base text-[#1A1A1A]">
              Penghitung Langkah Otomatis (Sensor HP)
            </h3>
            <p className="text-xs text-[#9A9A9A]">
              Deteksi Gerak Langkah HP &bull; Akurat Tanpa Smartwatch &bull; Nol Latensi
            </p>
          </div>
        </div>
      </div>

      {/* Main Metric Ring / Big Counter Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        {/* Step Count Big Display (Sky Blue Card) */}
        <div className="bg-[#BDE6F0] rounded-2xl p-5 flex flex-col items-center justify-center text-center relative overflow-hidden text-[#1A1A1A] shadow-xs">
          <div className="text-xs text-[#1A1A1A]/80 font-bold mb-1 flex items-center gap-1.5">
            <Footprints className="w-4 h-4 text-[#1A1A1A]" /> Total Langkah
          </div>
          <div className="text-3xl sm:text-4xl font-heading font-extrabold text-[#1A1A1A] tracking-tight my-1 sensor-num">
            {totalSteps.toLocaleString()}
          </div>
          <div className="text-[11px] text-[#1A1A1A]/70 font-medium">
            {isTracking ? "Sensor aktif membaca ayunan..." : "Pelacak tidak aktif"}
          </div>

          {lastNetAcc > 0 && isTracking && (
            <div className="absolute top-2 right-2 text-[10px] bg-white text-[#1A1A1A] px-2 py-0.5 rounded-full font-mono font-bold shadow-xs">
              +{lastNetAcc.toFixed(1)} m/s²
            </div>
          )}
        </div>

        {/* Cadence Display (Mint Green Card) */}
        <div className="bg-[#CDE8B5] rounded-2xl p-5 flex flex-col items-center justify-center text-center text-[#1A1A1A] shadow-xs">
          <div className="text-xs text-[#1A1A1A]/80 font-bold mb-1 flex items-center gap-1.5">
            <Activity className="w-4 h-4 text-[#1A1A1A]" /> Kecepatan Langkah
          </div>
          <div className="text-3xl sm:text-4xl font-heading font-extrabold text-[#1A1A1A] tracking-tight my-1 sensor-num">
            {cadenceSpm}
          </div>
          <div className="text-[11px] text-[#1A1A1A]/70 font-medium">
            Langkah per Menit
          </div>
        </div>

        {/* MET-Minutes (Butter Yellow Card) */}
        <div className="bg-[#FFF29A] rounded-2xl p-5 flex flex-col items-center justify-center text-center text-[#1A1A1A] shadow-xs">
          <div className="text-xs text-[#1A1A1A]/80 font-bold mb-1 flex items-center gap-1.5">
            <Flame className="w-4 h-4 text-[#1A1A1A] fill-[#1A1A1A]" /> Poin Energi Gerak
          </div>
          <div className="text-3xl sm:text-4xl font-heading font-extrabold text-[#1A1A1A] tracking-tight my-1 sensor-num">
            {metMinutes.toFixed(1)}
          </div>
          <div className="text-[11px] text-[#1A1A1A]/70 font-medium">
            Poin Kebugaran Tubuh
          </div>
        </div>
      </div>

      {/* Cadence Range Scale Guide */}
      <div className="mb-6 bg-[#F6F6F6] p-3.5 rounded-2xl border border-[#E8E8E8] text-xs">
        <div className="flex justify-between items-center text-[11px] font-semibold text-[#1A1A1A] mb-1.5">
          <span>Tingkat Kecepatan Langkah:</span>
          <span className="font-bold">{cadenceSpm} Langkah/Menit Saat Ini</span>
        </div>
        <div className="grid grid-cols-4 gap-1.5 text-center text-[10px] font-medium">
          <div
            className={`p-1.5 rounded-xl border transition-all ${
              intensityType === "IDLE" ? "bg-[#FFF29A] text-[#1A1A1A] border-[#FFE966] font-extrabold" : "bg-white border-[#E8E8E8] text-[#9A9A9A]"
            }`}
          >
            &lt;50 SPM<br /><span className="text-[9px]">Diam / Santai</span>
          </div>
          <div
            className={`p-1.5 rounded-xl border transition-all ${
              intensityType === "WALKING" ? "bg-[#CDE8B5] text-[#1A1A1A] border-[#B6DF97] font-extrabold" : "bg-white border-[#E8E8E8] text-[#9A9A9A]"
            }`}
          >
            50-99 SPM<br /><span className="text-[9px]">Jalan Santai</span>
          </div>
          <div
            className={`p-1.5 rounded-xl border transition-all ${
              intensityType === "MODERATE" ? "bg-[#BDE6F0] text-[#1A1A1A] border-[#8ECAD7] font-extrabold" : "bg-white border-[#E8E8E8] text-[#9A9A9A]"
            }`}
          >
            100-129 SPM<br /><span className="text-[9px]">Jalan Cepat</span>
          </div>
          <div
            className={`p-1.5 rounded-xl border transition-all ${
              intensityType === "VIGOROUS" ? "bg-[#F9B99A] text-[#1A1A1A] border-[#F6966C] font-extrabold" : "bg-white border-[#E8E8E8] text-[#9A9A9A]"
            }`}
          >
            &ge;130 SPM<br /><span className="text-[9px]">Lari / Olahraga</span>
          </div>
        </div>
      </div>

      {/* Permission Warning if Denied */}
      {permissionState === "denied" && (
        <div className="mb-4 p-3 bg-[#F7A8B0]/20 text-[#1A1A1A] text-xs rounded-2xl flex items-center gap-2 border border-[#F7A8B0]">
          <AlertTriangle className="w-4 h-4 shrink-0 text-[#1A1A1A]" />
          <span>
            Izin sensor gerak ditolak oleh peramban. Di iOS Safari, silakan izinkan akses sensor gerak di pengaturan situs atau gunakan tombol simulasi di bawah.
          </span>
        </div>
      )}

      {!sensorSupported && (
        <div className="mb-4 p-3 bg-[#FFF29A]/50 text-[#1A1A1A] text-xs rounded-2xl flex items-center gap-2 border border-[#FFF29A]">
          <Smartphone className="w-4 h-4 shrink-0" />
          <span>
            Perangkat desktop tidak memiliki sensor accelerometer fisik. Gunakan tombol simulasi langkah di bawah untuk pengujian lab.
          </span>
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-[#E8E8E8]">
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={handleToggleTracking}
            className={`px-4 py-2.5 rounded-2xl text-xs font-extrabold flex items-center gap-2 transition-colors shadow-xs ${
              isTracking
                ? "bg-[#F7A8B0] text-[#1A1A1A] hover:bg-[#F27885]"
                : "bg-[#FFF29A] hover:bg-[#FFE966] text-[#1A1A1A] border border-[#FFE966] shadow-softPill"
            }`}
          >
            {isTracking ? (
              <>
                <Square className="w-4 h-4 fill-[#1A1A1A]" /> Hentikan Sensor Gerak
              </>
            ) : (
              <>
                <Play className="w-4 h-4 fill-[#1A1A1A]" /> Aktifkan Sensor HP
              </>
            )}
          </button>

          <button
            onClick={handleReset}
            className="px-3.5 py-2.5 rounded-2xl text-xs font-semibold border border-[#E8E8E8] hover:bg-[#F6F6F6] text-[#1A1A1A] flex items-center gap-1.5 transition-colors"
          >
            <RotateCcw className="w-3.5 h-3.5" /> Reset
          </button>
        </div>

        {/* Desktop Simulation Fallbacks */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => handleSimulateStep(1)}
            className="px-3 py-2 rounded-xl text-xs font-semibold bg-[#F6F6F6] hover:bg-[#E8E8E8] text-[#1A1A1A] flex items-center gap-1 transition-colors border border-[#E8E8E8]"
            title="Simulasi 1 langkah (Desktop Testing)"
          >
            <Plus className="w-3.5 h-3.5" /> 1 Langkah
          </button>

          <button
            onClick={() => handleSimulateStep(10)}
            className="px-3 py-2 rounded-xl text-xs font-semibold bg-[#F6F6F6] hover:bg-[#E8E8E8] text-[#1A1A1A] flex items-center gap-1 transition-colors border border-[#E8E8E8]"
            title="Simulasi 10 langkah (Desktop Testing)"
          >
            <Zap className="w-3.5 h-3.5 text-[#1A1A1A]" /> +10 Langkah
          </button>

          {totalSteps > 0 && (
            <button
              onClick={handleSaveToActivity}
              className={`px-3.5 py-2 rounded-xl text-xs font-extrabold flex items-center gap-1.5 transition-colors ${
                savedSuccess
                  ? "bg-[#CDE8B5] text-[#1A1A1A] border border-[#B6DF97]"
                  : "bg-[#FFF29A] hover:bg-[#FFE966] text-[#1A1A1A] border border-[#FFE966] shadow-softPill"
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
