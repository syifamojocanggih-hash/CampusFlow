import React, { useState, useEffect } from "react";
import {
  Monitor,
  Play,
  Pause,
  RotateCcw,
  CheckCircle2,
  X,
} from "lucide-react";
import { VisionGuard } from "@/components/vision/VisionGuard";
import { screenTimeTracker } from "@/utils/screenTimeTracker";

export const FocusView: React.FC = () => {
  // Focus Timer States (Default 25 mins Pomodoro)
  const [sessionDurationMins, setSessionDurationMins] = useState<number>(25);
  const [secondsRemaining, setSecondsRemaining] = useState<number>(25 * 60);
  const [isTimerRunning, setIsTimerRunning] = useState<boolean>(false);
  const [completedBouts, setCompletedBouts] = useState<number>(0);

  // Screen Time Passive State
  const [screenMinutes, setScreenMinutes] = useState<number>(() =>
    screenTimeTracker.getTodayScreenTimeMinutes()
  );

  // Active Break On-Demand Modal State
  const [isActiveBreakOpen, setIsActiveBreakOpen] = useState<boolean>(false);
  const [activeBreakSuccess, setActiveBreakSuccess] = useState<boolean>(false);

  // Update passive screen time every 10 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      setScreenMinutes(screenTimeTracker.getTodayScreenTimeMinutes());
    }, 10000);
    return () => clearInterval(interval);
  }, []);

  // Timer Tick Loop
  useEffect(() => {
    if (!isTimerRunning) return;

    const timer = setInterval(() => {
      setSecondsRemaining((prev) => {
        if (prev <= 1) {
          setIsTimerRunning(false);
          setCompletedBouts((c) => c + 1);
          setIsActiveBreakOpen(true); // Auto-suggest Active Break when focus time ends
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [isTimerRunning]);

  const handleSelectPreset = (mins: number) => {
    setIsTimerRunning(false);
    setSessionDurationMins(mins);
    setSecondsRemaining(mins * 60);
  };

  const handleResetTimer = () => {
    setIsTimerRunning(false);
    setSecondsRemaining(sessionDurationMins * 60);
  };

  const formatTimer = (totalSeconds: number) => {
    const m = Math.floor(totalSeconds / 60);
    const s = totalSeconds % 60;
    return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  };

  const progressPct = Math.round(
    ((sessionDurationMins * 60 - secondsRemaining) / (sessionDurationMins * 60 || 1)) * 100
  );

  return (
    <div className="space-y-6 max-w-4xl mx-auto pb-12">
      {/* ========================================================
          1. HEADER BANNER WITH ZERO CONTINUOUS CAMERA BADGE
          ======================================================== */}
      <div className="learnova-card p-6 border-[#E8E8E8] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-[#BDE6F0] text-[#1A1A1A] flex items-center justify-center shrink-0 shadow-xs">
            <Monitor className="w-6 h-6" />
          </div>
          <div>
            <h2 className="font-heading font-extrabold text-xl text-[#1A1A1A]">
              Workstation Belajar &amp; Active Break
            </h2>
            <p className="text-xs text-[#9A9A9A] mt-0.5">
              Fokus belajar produktif dengan pelacakan layar pasif. Kamera HANYA menyala insidental 2 menit saat jeda.
            </p>
          </div>
        </div>

        <button
          onClick={() => setIsActiveBreakOpen(true)}
          className="w-full sm:w-auto px-4 py-2.5 rounded-2xl bg-[#CDE8B5] hover:bg-[#B6DF97] text-[#1A1A1A] text-xs font-extrabold transition-colors shadow-xs flex items-center justify-center gap-2"
        >
          <Play className="w-4 h-4 fill-[#1A1A1A]" />
          Mulai Active Break (2 Menit)
        </button>
      </div>

      {/* ========================================================
          2. FOCUS STUDY WORKSTATION (Camera OFF by Default)
          ======================================================== */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-stretch">
        {/* Left Card: Focus Timer (7 cols) */}
        <div className="md:col-span-7 learnova-card p-6 flex flex-col justify-between space-y-6">
          <div className="flex items-center justify-between pb-3 border-b border-[#F0F0F0]">
            <div>
              <h3 className="font-heading font-extrabold text-base text-[#1A1A1A]">
                Timer Sesi Belajar Mandiri
              </h3>
              <p className="text-xs text-[#9A9A9A]">Pilih target durasi fokus sebelum jeda aktif</p>
            </div>
            <span className="text-xs font-bold text-[#1A1A1A] bg-[#FAFAFA] border border-[#E8E8E8] px-2.5 py-1 rounded-xl">
              {completedBouts} Sesi Selesai
            </span>
          </div>

          {/* Preset Buttons */}
          <div className="flex items-center gap-2">
            {[
              { label: "Pomodoro (25m)", val: 25 },
              { label: "Deep Work (50m)", val: 50 },
              { label: "Sprint (15m)", val: 15 },
            ].map((p) => (
              <button
                key={p.val}
                onClick={() => handleSelectPreset(p.val)}
                className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold transition-all ${
                  sessionDurationMins === p.val && !isTimerRunning
                    ? "bg-[#FFF29A] text-[#1A1A1A] border border-[#FFE966] shadow-xs"
                    : "bg-[#FAFAFA] hover:bg-[#F0F0F0] text-[#9A9A9A] border border-[#EEEEEE]"
                }`}
              >
                {p.label}
              </button>
            ))}
          </div>

          {/* Timer Display */}
          <div className="text-center py-4 space-y-2">
            <div className="text-6xl sm:text-7xl font-mono font-extrabold text-[#1A1A1A] tracking-tight">
              {formatTimer(secondsRemaining)}
            </div>
            <div className="w-full max-w-xs mx-auto bg-[#F6F6F6] h-2.5 rounded-full overflow-hidden border border-[#E8E8E8]">
              <div
                className="bg-[#CDE8B5] h-full transition-all duration-500 rounded-full"
                style={{ width: `${progressPct}%` }}
              />
            </div>
            <p className="text-[11px] text-[#9A9A9A] font-medium pt-1">
              {isTimerRunning
                ? "Sesi belajar sedang berlangsung. Kamera laptop tetap MATI."
                : "Tekan tombol Mulai untuk memulai sesi belajar mandiri."}
            </p>
          </div>

          {/* Control Buttons */}
          <div className="flex items-center justify-center gap-3 pt-2">
            {!isTimerRunning ? (
              <button
                onClick={() => setIsTimerRunning(true)}
                className="px-6 py-3 rounded-2xl bg-[#1A1A1A] hover:bg-black text-white text-xs font-extrabold transition-all shadow-xs flex items-center gap-2"
              >
                <Play className="w-4 h-4 fill-white" />
                Mulai Sesi Belajar
              </button>
            ) : (
              <button
                onClick={() => setIsTimerRunning(false)}
                className="px-6 py-3 rounded-2xl bg-[#FFF29A] hover:bg-[#FFE966] text-[#1A1A1A] text-xs font-extrabold transition-all border border-[#FFE966] shadow-xs flex items-center gap-2"
              >
                <Pause className="w-4 h-4" />
                Jeda Sesi
              </button>
            )}
            <button
              onClick={handleResetTimer}
              className="p-3 rounded-2xl bg-[#FAFAFA] hover:bg-[#F0F0F0] text-[#9A9A9A] hover:text-[#1A1A1A] border border-[#EEEEEE] transition-all"
              title="Reset Timer"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Right Card: Passive Screen Time & Privacy Notice (5 cols) */}
        <div className="md:col-span-5 space-y-4 flex flex-col justify-between">
          {/* Screen Time Metric */}
          <div className="learnova-card p-5 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-[#9A9A9A]">Waktu Layar Pasif Hari Ini</span>
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-4xl font-heading font-extrabold text-[#1A1A1A] sensor-num">
                {Math.floor(screenMinutes / 60)}
                <span className="text-sm font-semibold text-[#9A9A9A] ml-1">Jam</span>
              </span>
              <span className="text-2xl font-heading font-extrabold text-[#1A1A1A] sensor-num">
                {screenMinutes % 60}
                <span className="text-sm font-semibold text-[#9A9A9A] ml-1">Mnt</span>
              </span>
            </div>
            <p className="text-[11px] text-[#9A9A9A] leading-relaxed">
              Dilacak secara otomatis oleh browser saat tab CampusFlow aktif, tanpa perlu menyalakan webcam.
            </p>
          </div>

          {/* Active Break Quick Trigger Card */}
          <div className="bg-[#FFF29A] rounded-3xl p-5 text-[#1A1A1A] border border-[#FFE966] shadow-softPill space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-extrabold">
                Kamera Insidental 2 Menit
              </span>
              <span className="text-[10px] font-extrabold bg-white px-2 py-0.5 rounded-full shadow-xs">
                +10 Poin
              </span>
            </div>
            <p className="text-xs text-[#1A1A1A]/80 font-medium">
              Cegah leher kaku dan mata lelah dengan validasi pose peregangan overhead reach.
            </p>
            <button
              onClick={() => setIsActiveBreakOpen(true)}
              className="w-full mt-2 py-2 px-3 rounded-xl bg-white hover:bg-[#FAFAFA] text-[#1A1A1A] text-xs font-bold transition-all shadow-xs flex items-center justify-center gap-1.5"
            >
              <Play className="w-3.5 h-3.5 fill-[#1A1A1A]" />
              Buka Validator Active Break
            </button>
          </div>
        </div>
      </div>

      {/* ========================================================
          3. ACTIVE BREAK 2-MINUTE ON-DEMAND MODAL
          ======================================================== */}
      {isActiveBreakOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl max-w-2xl w-full p-6 shadow-2xl border border-[#E8E8E8] space-y-4 max-h-[92vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-3 border-b border-[#F0F0F0]">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-[#CDE8B5] text-[#166534] flex items-center justify-center shrink-0">
                  <Play className="w-5 h-5 fill-[#166534] ml-0.5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-heading font-extrabold text-base text-[#1A1A1A]">
                      On-Demand Active Break (2 Menit)
                    </h3>
                    <span className="text-[10px] font-extrabold bg-[#CDE8B5] text-[#166534] px-2.5 py-0.5 rounded-full">
                      Kamera Aktif
                    </span>
                  </div>
                  <p className="text-[11px] text-[#9A9A9A]">
                    Rentangkan tangan di atas kepala (Overhead Reach) atau beranjak berdiri selama 3 repetisi.
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsActiveBreakOpen(false)}
                className="w-8 h-8 rounded-full bg-[#F6F6F6] hover:bg-[#E8E8E8] text-[#1A1A1A] flex items-center justify-center transition-colors"
                title="Tutup & Matikan Kamera"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Success Banner if Completed */}
            {activeBreakSuccess && (
              <div className="p-4 rounded-2xl bg-[#CDE8B5] text-[#166534] flex items-center gap-3 animate-in zoom-in-95">
                <CheckCircle2 className="w-5 h-5 shrink-0" />
                <div className="text-xs font-bold">
                  Selamat! Sesi Active Break Berhasil Terverifikasi (+10 Poin Pemulihan Ditambahkan). Kamera telah dinonaktifkan.
                </div>
              </div>
            )}

            {/* MediaPipe Active Break Pose Component */}
            <div className="space-y-3">
              <VisionGuard
                autoStartCamera={true}
                onActiveBreakCompleted={() => {
                  setActiveBreakSuccess(true);
                  setTimeout(() => {
                    setIsActiveBreakOpen(false);
                    setActiveBreakSuccess(false);
                  }, 2500);
                }}
              />
            </div>

            {/* Modal Footer Reassurance */}
            <div className="pt-2 flex items-center justify-between text-xs text-[#9A9A9A]">
              <span>Kamera otomatis dimatikan setelah pose peregangan selesai.</span>
              <button
                onClick={() => setIsActiveBreakOpen(false)}
                className="px-4 py-2 rounded-xl bg-[#FAFAFA] hover:bg-[#F0F0F0] text-[#1A1A1A] font-bold text-xs transition-colors"
              >
                Selesai / Tutup
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
