import React, { useState, useEffect } from "react";
import {
  CheckCircle2,
  X,
  Play,
} from "lucide-react";
import { VisionGuard } from "@/components/vision/VisionGuard";
import { screenTimeTracker } from "@/utils/screenTimeTracker";

export const FocusView: React.FC = () => {
  // Focus Timer States (Default: 25 mins Pomodoro, starting at 18:42 for session 6)
  const [sessionDurationMins, setSessionDurationMins] = useState<number>(25);
  const [secondsRemaining, setSecondsRemaining] = useState<number>(18 * 60 + 42); // 18:42
  const [isTimerRunning, setIsTimerRunning] = useState<boolean>(true);
  const [completedBouts, setCompletedBouts] = useState<number>(5);

  // Passive Screen Time State
  const [screenMinutes, setScreenMinutes] = useState<number>(() =>
    Math.max(600, screenTimeTracker.getTodayScreenTimeMinutes())
  );

  // Active Break Incidental Modal State
  const [isActiveBreakOpen, setIsActiveBreakOpen] = useState<boolean>(false);
  const [activeBreakSuccess, setActiveBreakSuccess] = useState<boolean>(false);

  // Update passive screen time every 10 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      setScreenMinutes(Math.max(600, screenTimeTracker.getTodayScreenTimeMinutes()));
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

  // Circular SVG progress calculation
  const totalSessionSeconds = sessionDurationMins * 60;
  const progressPct = Math.min(
    100,
    Math.max(
      0,
      Math.round(((totalSessionSeconds - secondsRemaining) / totalSessionSeconds) * 100)
    )
  );

  // Format completed focus duration
  const totalCompletedMinutes = completedBouts * sessionDurationMins;
  const formattedFocusHours = `${Math.floor(totalCompletedMinutes / 60)} j ${
    (totalCompletedMinutes % 60).toString().padStart(2, "0")
  } m`;

  const radius = 105;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference * (1 - progressPct / 100);

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-12 font-sans">
      {/* ========================================================
          1. TOP PAGE HEADER
          ======================================================== */}
      <div>
        <h1 className="font-heading font-extrabold text-3xl sm:text-4xl text-[#1A1A1A] tracking-tight">
          Satu hal dalam satu waktu.
        </h1>
        <p className="text-sm text-[#737373] mt-2">
          Beri ruang untuk fokus. Jangan lupa beri waktu untuk pulih.
        </p>
      </div>

      {/* ========================================================
          2. MAIN FOCUS WORKSTATION CARD
          ======================================================== */}
      <div className="bg-white rounded-[1.75rem] p-6 sm:p-8 shadow-xs border border-[#F0F0F0] space-y-6 sm:space-y-7">
        {/* Top Header Row of Card */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <span className="text-xs font-extrabold tracking-wider text-[#525252] uppercase shrink-0">
            SESI FOKUS
          </span>

          {/* Preset Duration Switcher */}
          <div className="bg-[#F0F0F0] p-1 rounded-2xl flex items-center gap-1 shadow-2xs">
            <button
              onClick={() => handleSelectPreset(25)}
              className={`px-4 py-1.5 rounded-xl text-xs font-bold transition-all ${
                sessionDurationMins === 25
                  ? "bg-[#FFF29A] text-[#1A1A1A] shadow-2xs"
                  : "text-[#525252] hover:text-[#1A1A1A]"
              }`}
            >
              25 menit
            </button>
            <button
              onClick={() => handleSelectPreset(50)}
              className={`px-4 py-1.5 rounded-xl text-xs font-bold transition-all ${
                sessionDurationMins === 50
                  ? "bg-[#FFF29A] text-[#1A1A1A] shadow-2xs"
                  : "text-[#525252] hover:text-[#1A1A1A]"
              }`}
            >
              50 menit
            </button>
          </div>

          {/* Privacy Camera Status Badge */}
          <button
            onClick={() => setIsActiveBreakOpen(true)}
            className="px-4 py-1.5 rounded-full bg-[#BDE6F0] hover:bg-[#A8DFEC] text-xs font-semibold text-[#1A1A1A] transition-colors shrink-0"
            title="Klik jika ingin melakukan jeda peregangan 2 menit dengan validasi AI"
          >
            Kamera mati
          </button>
        </div>

        {/* Circular Countdown Progress Timer (Centered) */}
        <div className="flex flex-col items-center justify-center my-6 sm:my-8">
          <div className="relative w-64 h-64 sm:w-72 sm:h-72 flex items-center justify-center">
            {/* SVG Circle */}
            <svg
              className="w-full h-full -rotate-90 select-none pointer-events-none"
              viewBox="0 0 250 250"
            >
              {/* Background Track */}
              <circle
                cx="125"
                cy="125"
                r={radius}
                fill="none"
                stroke="#EDF6E8"
                strokeWidth="11"
              />
              {/* Active Progress Arc */}
              <circle
                cx="125"
                cy="125"
                r={radius}
                fill="none"
                stroke="#CDE8B5"
                strokeWidth="11"
                strokeLinecap="round"
                strokeDasharray={circumference}
                strokeDashoffset={strokeDashoffset}
                className="transition-all duration-500 ease-linear"
              />
            </svg>

            {/* Inner Center Display (Centered vertically & horizontally) */}
            <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-4 select-none">
              <span className="font-heading font-extrabold text-5xl sm:text-6xl text-[#1A1A1A] tracking-tight tabular-nums leading-none">
                {formatTimer(secondsRemaining)}
              </span>
              <span className="text-xs sm:text-[13px] text-[#737373] mt-3 font-medium">
                Tetap di sini, satu langkah lagi.
              </span>
            </div>
          </div>
        </div>

        {/* Action Control Buttons */}
        <div className="flex items-center justify-center gap-3 pt-1">
          <button
            onClick={() => setIsTimerRunning(!isTimerRunning)}
            className="py-3 px-8 rounded-2xl bg-[#1A1A1A] hover:bg-black text-white font-extrabold text-xs transition-colors shadow-xs active:scale-95"
          >
            {isTimerRunning ? "Jeda sesi" : "Lanjutkan sesi"}
          </button>
          <button
            onClick={handleResetTimer}
            className="py-3 px-8 rounded-2xl bg-[#F0F0F0] hover:bg-[#E8E8E8] text-[#1A1A1A] font-bold text-xs transition-colors active:scale-95"
          >
            Reset
          </button>
        </div>
      </div>

      {/* ========================================================
          3. BOTTOM METRIC CARDS: RITME FOKUS HARI INI (Fitness Report Style)
          ======================================================== */}
      <div className="space-y-4 pt-2">
        <h3 className="font-heading font-extrabold text-base sm:text-lg text-[#1A1A1A]">
          Ritme fokus hari ini
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6">
          {/* Card 1: Total Durasi Fokus */}
          <div className="bg-white rounded-3xl p-5 sm:p-6 border border-[#E8E8E8] shadow-xs text-center flex flex-col justify-between">
            {/* Title & Subtitle */}
            <div className="space-y-1">
              <h4 className="font-heading font-extrabold text-base text-[#1A1A1A]">
                Total Sesi Selesai
              </h4>
              <p className="text-[11px] text-[#9A9A9A] font-medium">
                {sessionDurationMins} mnt / sesi
              </p>
            </div>

            {/* Big Metric Value */}
            <div className="my-2">
              <div className="font-heading font-extrabold text-3xl sm:text-4xl text-[#1A1A1A] sensor-num tracking-tight">
                {formattedFocusHours}
              </div>
            </div>
          </div>

          {/* Card 2: Pomodoro Selesai */}
          <div className="bg-white rounded-3xl p-5 sm:p-6 border border-[#E8E8E8] shadow-xs text-center flex flex-col justify-between">
            <div className="space-y-1">
              <h4 className="font-heading font-extrabold text-base text-[#1A1A1A]">
                Pomodoro Selesai
              </h4>
              <p className="text-[11px] text-[#9A9A9A] font-medium">
                Target harian 6 sesi
              </p>
            </div>

            <div className="my-2">
              <div className="font-heading font-extrabold text-3xl sm:text-4xl text-[#1A1A1A] sensor-num tracking-tight">
                {completedBouts} sesi
              </div>
            </div>
          </div>

          {/* Card 3: Waktu Layar Pasif */}
          <div className="bg-white rounded-3xl p-5 sm:p-6 border border-[#E8E8E8] shadow-xs text-center flex flex-col justify-between">
            <div className="space-y-1">
              <h4 className="font-heading font-extrabold text-base text-[#1A1A1A]">
                Waktu Layar Pasif
              </h4>
              <p className="text-[11px] text-[#9A9A9A] font-medium">
                Batas aman &le; 8 jam
              </p>
            </div>

            <div className="my-2">
              <div className="font-heading font-extrabold text-3xl sm:text-4xl text-[#1A1A1A] sensor-num tracking-tight">
                {Math.floor(screenMinutes / 60)} jam
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ========================================================
          4. ACTIVE BREAK 2-MINUTE ON-DEMAND MODAL
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
                  <h3 className="font-heading font-extrabold text-base text-[#1A1A1A]">
                    On-Demand Active Break (2 Menit)
                  </h3>
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
