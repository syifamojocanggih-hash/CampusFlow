import React, { useEffect, useRef, useState } from "react";
import {
  Footprints,
  Activity,
  Flame,
  Play,
  Square,
  RotateCcw,
  Smartphone,
  CheckCircle2,
  AlertTriangle,
  Sparkles,
  TrendingUp,
  Compass,
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

const CAMPUS_MILESTONES = [
  { steps: 500, label: "Halte Kampus ke Gedung Kuliah", landmark: "Rute Gerbang Utama" },
  { steps: 1500, label: "Perpustakaan Pusat ke Lab Riset", landmark: "Koridor Akademik" },
  { steps: 3000, label: "Keliling Danau & Area Rektorat", landmark: "Lingkar Luar Kampus" },
  { steps: 6000, label: "Target Sehat Harian (WHO/IPAQ-SF)", landmark: "Optimal Mahasiswa Aktif" },
];

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
  const [quickActivityFeedback, setQuickActivityFeedback] = useState<string | null>(null);

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
      setLastNetAcc(0);
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

  return (
    <div className={`space-y-6 ${className}`}>
      {/* 1. Main Pedometer Sensor Card */}
      <div className="learnova-card p-6 border-[#E8DDCF] space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#E8DDCF] pb-4">
          <div className="flex items-center gap-3.5">
            <div className="w-11 h-11 rounded-2xl bg-[#E8DDCF] text-[#2F3A2E] flex items-center justify-center shrink-0 shadow-xs">
              <Footprints className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-heading font-extrabold text-base text-[#2F3A2E]">
                Penghitung Langkah Otomatis (Sensor HP)
              </h3>
              <p className="text-xs text-[#636B60]">
                Mendeteksi ayunan kaki mahasiswa secara real-time via accelerometer perangkat.
              </p>
            </div>
          </div>

          {/* Quick Stats Pill */}
          <div className="flex items-center gap-3 text-xs bg-[#FAF6F0] px-3.5 py-1.5 rounded-2xl border border-[#E8DDCF] self-start sm:self-auto">
            <div>
              <span className="text-[#636B60] font-semibold">Jarak: </span>
              <strong className="text-[#2F3A2E] font-extrabold">{distanceKm} km</strong>
            </div>
            <span className="text-[#CBB6A2]">|</span>
            <div>
              <span className="text-[#636B60] font-semibold">Kalori: </span>
              <strong className="text-[#2F3A2E] font-extrabold">{caloriesBurned} kkal</strong>
            </div>
          </div>
        </div>

        {/* Main 3 Metric Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Step Count Big Display (Sky Blue Card) */}
          <div className="bg-[#E8DDCF] rounded-2xl p-5 flex flex-col items-center justify-center text-center relative overflow-hidden text-[#2F3A2E] shadow-xs">
            <div className="text-xs text-[#2F3A2E]/80 font-bold mb-1 flex items-center gap-1.5">
              <Footprints className="w-4 h-4 text-[#2F3A2E]" /> Total Langkah
            </div>
            <div className="text-3xl sm:text-4xl font-heading font-extrabold text-[#2F3A2E] tracking-tight my-1 sensor-num">
              {totalSteps.toLocaleString()}
            </div>
            <div className="text-[11px] text-[#2F3A2E]/70 font-medium">
              {isTracking ? "Sensor aktif membaca ayunan..." : "Pelacak tidak aktif"}
            </div>

            {lastNetAcc > 0 && isTracking && (
              <div className="absolute top-2 right-2 text-[10px] bg-white text-[#2F3A2E] px-2 py-0.5 rounded-full font-mono font-bold shadow-xs">
                +{lastNetAcc.toFixed(1)} m/s²
              </div>
            )}
          </div>

          {/* Cadence Display (Mint Green Card) */}
          <div className="bg-[#E8DDCF] rounded-2xl p-5 flex flex-col items-center justify-center text-center text-[#2F3A2E] shadow-xs">
            <div className="text-xs text-[#2F3A2E]/80 font-bold mb-1 flex items-center gap-1.5">
              <Activity className="w-4 h-4 text-[#2F3A2E]" /> Kecepatan Langkah
            </div>
            <div className="text-3xl sm:text-4xl font-heading font-extrabold text-[#2F3A2E] tracking-tight my-1 sensor-num">
              {cadenceSpm}
            </div>
            <div className="text-[11px] text-[#2F3A2E]/70 font-medium">
              Langkah per Menit (SPM)
            </div>
          </div>

          {/* MET-Minutes (Butter Yellow Card) */}
          <div className="bg-[#E8DDCF] rounded-2xl p-5 flex flex-col items-center justify-center text-center text-[#2F3A2E] shadow-xs">
            <div className="text-xs text-[#2F3A2E]/80 font-bold mb-1 flex items-center gap-1.5">
              <Flame className="w-4 h-4 text-[#2F3A2E] fill-[#2F3A2E]" /> Poin Energi Gerak
            </div>
            <div className="text-3xl sm:text-4xl font-heading font-extrabold text-[#2F3A2E] tracking-tight my-1 sensor-num">
              {metMinutes.toFixed(1)}
            </div>
            <div className="text-[11px] text-[#2F3A2E]/70 font-medium">
              MET-menit (+Poin Pemulihan)
            </div>
          </div>
        </div>

        {/* Feedback Alert if quick activity logged */}
        {quickActivityFeedback && (
          <div className="p-3 bg-[#E8DDCF] text-[#2F3A2E] text-xs font-bold rounded-2xl flex items-center gap-2 animate-in zoom-in-95 border border-[#CFD8C4]">
            <Sparkles className="w-4 h-4 shrink-0" />
            <span>{quickActivityFeedback}</span>
          </div>
        )}

        {/* Permission Warning if Denied */}
        {permissionState === "denied" && (
          <div className="p-3 bg-[#E8DDCF] text-[#2F3A2E] text-xs rounded-2xl flex items-center gap-2 border border-[#CFD8C4]">
            <AlertTriangle className="w-4 h-4 shrink-0 text-[#2F3A2E]" />
            <span>
              Izin sensor gerak ditolak oleh peramban. Di iOS Safari, silakan izinkan akses sensor gerak di pengaturan situs.
            </span>
          </div>
        )}

        {!sensorSupported && (
          <div className="p-3 bg-[#E8DDCF]/50 text-[#2F3A2E] text-xs rounded-2xl flex items-center gap-2 border border-[#E8DDCF]">
            <Smartphone className="w-4 h-4 shrink-0" />
            <span>
              Perangkat desktop tidak memiliki sensor accelerometer fisik. Anda dapat menggunakan tombol <strong>Catat Aktivitas Cepat</strong> di bawah untuk memasukkan aktivitas kampus secara manual.
            </span>
          </div>
        )}

        {/* Sensor Control Buttons */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-[#E8DDCF]">
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={handleToggleTracking}
              className={`px-4 py-2.5 rounded-2xl text-xs font-extrabold flex items-center gap-2 transition-colors shadow-xs ${
                isTracking
                  ? "bg-[#CFD8C4] text-[#636B60] hover:bg-[#CFD8C4]"
                  : "bg-[#E8DDCF] hover:bg-[#CFD8C4] active:bg-[#CFD8C4] text-[#2F3A2E] border border-[#E8DDCF] shadow-softPill"
              }`}
            >
              {isTracking ? (
                <>
                  <Square className="w-4 h-4 fill-[#2F3A2E]" /> Hentikan Sensor Gerak
                </>
              ) : (
                <>
                  <Play className="w-4 h-4 fill-[#2F3A2E]" /> Aktifkan Sensor HP
                </>
              )}
            </button>

            <button
              type="button"
              onClick={handleReset}
              className="px-3.5 py-2.5 rounded-2xl text-xs font-semibold border border-[#E8DDCF] hover:bg-[#FAF6F0] text-[#2F3A2E] flex items-center gap-1.5 transition-colors"
            >
              <RotateCcw className="w-3.5 h-3.5" /> Reset
            </button>
          </div>

          {totalSteps > 0 && (
            <button
              type="button"
              onClick={handleSaveToActivity}
              className={`px-4 py-2.5 rounded-2xl text-xs font-extrabold flex items-center gap-1.5 transition-colors ${
                savedSuccess
                  ? "bg-[#CFD8C4] text-[#2F3A2E] border border-[#CFD8C4]"
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

      {/* 2. SUPPORTING FEATURE 1: MILESTONE RUTE KAMPUS */}
      <div className="learnova-card p-6 border-[#E8DDCF] space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[#E8DDCF] pb-3">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-[#E8DDCF] text-[#2F3A2E] flex items-center justify-center font-bold">
              <Compass className="w-4 h-4" />
            </div>
            <div>
              <h4 className="font-heading font-extrabold text-base text-[#2F3A2E]">
                Milestone Rute Kampus
              </h4>
              <p className="text-[11px] text-[#636B60]">
                Progres ekuivalen langkah Anda jika berjalan mengelilingi rute kampus hari ini.
              </p>
            </div>
          </div>
          <span className="text-xs font-extrabold px-3 py-1 rounded-full bg-[#E8DDCF] text-[#2F3A2E] border border-[#E8DDCF] self-start sm:self-auto">
            {dailyTargetProgress}% Target Harian (6.000 Langkah)
          </span>
        </div>

        {/* Landmark Progress Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
          {CAMPUS_MILESTONES.map((milestone) => {
            const isReached = totalSteps >= milestone.steps;
            const stepProgress = Math.min(100, Math.round((totalSteps / milestone.steps) * 100));
            return (
              <div
                key={milestone.steps}
                className={`p-3.5 rounded-2xl border transition-all ${
                  isReached
                    ? "bg-[#CFD8C4]/25 border-[#CFD8C4]"
                    : "bg-[#FAF6F0] border-[#E8DDCF]"
                }`}
              >
                <div className="flex items-center justify-between gap-1 mb-2">
                  <span className="text-[10px] font-bold text-[#636B60]">
                    {milestone.landmark}
                  </span>
                  {isReached && (
                    <span className="w-5 h-5 rounded-full bg-[#E8DDCF] text-[#2F3A2E] flex items-center justify-center text-[10px] font-extrabold">
                      ✓
                    </span>
                  )}
                </div>

                <div className="font-heading font-extrabold text-sm text-[#2F3A2E]">
                  {milestone.steps.toLocaleString()} Langkah
                </div>
                <p className="text-[11px] text-[#636B60] mt-0.5 truncate">
                  {milestone.label}
                </p>

                {/* Progress Mini-Bar */}
                <div className="mt-3 w-full bg-[#E8DDCF] h-1.5 rounded-full overflow-hidden">
                  <div
                    className={`h-full transition-all duration-500 ${
                      isReached ? "bg-[#4A3B2C]" : "bg-[#CFD8C4]"
                    }`}
                    style={{ width: `${stepProgress}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 3. SUPPORTING FEATURE 2: PENCATAT OLAHRAGA CEPAT KAMPUS */}
      <div className="learnova-card p-6 border-[#E8DDCF] space-y-4">
        <div className="flex items-center gap-2.5 border-b border-[#E8DDCF] pb-3">
          <div className="w-8 h-8 rounded-xl bg-[#E8DDCF] text-[#2F3A2E] flex items-center justify-center font-bold">
            <TrendingUp className="w-4 h-4" />
          </div>
          <div>
            <h4 className="font-heading font-extrabold text-base text-[#2F3A2E]">
              Pencatat Cepat Aktivitas Fisik Kampus
            </h4>
            <p className="text-[11px] text-[#636B60]">
              Tidak membawa HP di saku saat bergerak? Tambahkan aktivitas non-jalan dengan satu klik.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {/* Action 1: Naik Tangga */}
          <button
            type="button"
            onClick={() => handleLogQuickActivity(450, 40, "Naik Tangga Kampus")}
            className="p-4 rounded-2xl bg-[#FAF6F0] hover:bg-white border border-[#E8DDCF] hover:border-[#4A3B2C] transition-all text-left space-y-1.5 shadow-2xs group cursor-pointer"
          >
            <div className="flex items-center justify-between">
              <span className="text-xl">🪜</span>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-[#E8DDCF] text-[#2F3A2E]">
                +40 MET-m
              </span>
            </div>
            <div className="font-heading font-extrabold text-xs text-[#2F3A2E] group-hover:text-black">
              Naik Tangga Gedung Kuliah
            </div>
            <p className="text-[11px] text-[#636B60]">
              5 menit • Setara ~450 langkah
            </p>
          </button>

          {/* Action 2: Bersepeda */}
          <button
            type="button"
            onClick={() => handleLogQuickActivity(1200, 90, "Bersepeda ke Kampus")}
            className="p-4 rounded-2xl bg-[#FAF6F0] hover:bg-white border border-[#E8DDCF] hover:border-[#4A3B2C] transition-all text-left space-y-1.5 shadow-2xs group cursor-pointer"
          >
            <div className="flex items-center justify-between">
              <span className="text-xl">🚲</span>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-[#E8DDCF] text-[#2F3A2E]">
                +90 MET-m
              </span>
            </div>
            <div className="font-heading font-extrabold text-xs text-[#2F3A2E] group-hover:text-black">
              Bersepeda ke Kampus
            </div>
            <p className="text-[11px] text-[#636B60]">
              15 menit • Setara ~1.200 langkah
            </p>
          </button>

          {/* Action 3: Olahraga Sore / Futsal / Badminton */}
          <button
            type="button"
            onClick={() => handleLogQuickActivity(2500, 180, "Olahraga Sore")}
            className="p-4 rounded-2xl bg-[#FAF6F0] hover:bg-white border border-[#E8DDCF] hover:border-[#4A3B2C] transition-all text-left space-y-1.5 shadow-2xs group cursor-pointer"
          >
            <div className="flex items-center justify-between">
              <span className="text-xl">🏸</span>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-[#E8DDCF] text-[#2F3A2E]">
                +180 MET-m
              </span>
            </div>
            <div className="font-heading font-extrabold text-xs text-[#2F3A2E] group-hover:text-black">
              Futsal / Badminton / Jogging
            </div>
            <p className="text-[11px] text-[#636B60]">
              30 menit • Setara ~2.500 langkah
            </p>
          </button>
        </div>
      </div>
    </div>
  );
};
