import React, { useState, useEffect } from "react";
import { Play, Pause, RotateCcw, Heart, ArrowLeft, CheckCircle, Award } from "lucide-react";

interface PanicReliefModeProps {
  onClose: () => void;
  onComplete: () => void;
}

export const PanicReliefMode: React.FC<PanicReliefModeProps> = ({ onClose, onComplete }) => {
  const totalSeconds = 15 * 60; // 15 menit
  const [remainingSec, setRemainingSec] = useState(totalSeconds);
  const [isRunning, setIsRunning] = useState(false);
  const [pulse, setPulse] = useState(false);

  // Timer countdown
  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (isRunning && remainingSec > 0) {
      timer = setInterval(() => {
        setRemainingSec((prev) => prev - 1);
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [isRunning, remainingSec]);

  // Metronome visual pulse ~ 116 BPM (~517ms per beat)
  useEffect(() => {
    let metronome: NodeJS.Timeout;
    if (isRunning) {
      metronome = setInterval(() => {
        setPulse((prev) => !prev);
      }, 517);
    } else {
      setPulse(false);
    }
    return () => clearInterval(metronome);
  }, [isRunning]);

  const minutes = Math.floor(remainingSec / 60);
  const seconds = remainingSec % 60;
  const progressPercent = ((totalSeconds - remainingSec) / totalSeconds) * 100;

  return (
    <div className="bg-white rounded-3xl p-6 sm:p-8 text-[#1A1A1A] shadow-card max-w-lg mx-auto space-y-6 relative overflow-hidden border border-[#E8E8E8]">
      {/* Decorative ambient lights */}
      <div className="absolute top-0 right-0 w-48 h-48 bg-[#BDE6F0]/25 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-48 h-48 bg-[#FFF29A]/25 rounded-full blur-3xl pointer-events-none" />

      {/* Header controls */}
      <div className="flex items-center justify-between relative z-10">
        <button
          onClick={onClose}
          className="flex items-center gap-1.5 text-xs text-[#1A1A1A] hover:bg-[#E8E8E8] font-bold transition-colors bg-[#F6F6F6] px-3 py-1.5 rounded-xl border border-[#E8E8E8]"
        >
          <ArrowLeft className="w-4 h-4" /> Kembali
        </button>
        <span className="bg-[#FFF29A] text-[#1A1A1A] border border-[#FFE966] text-[11px] px-3 py-1 rounded-full font-extrabold flex items-center gap-1 shadow-xs">
          <Award className="w-3.5 h-3.5" /> Wu &amp; Zhou (2024)
        </span>
      </div>

      {/* Main Title & Description */}
      <div className="text-center space-y-2 relative z-10">
        <h2 className="text-2xl sm:text-3xl font-heading font-extrabold text-[#1A1A1A] tracking-tight">
          Exam Panic Relief Protocol
        </h2>
        <p className="text-xs text-[#9A9A9A] max-w-sm mx-auto leading-relaxed">
          Latihan aerobik akut di tempat selama 15 menit dengan ritme 110–125 BPM untuk menurunkan hormon kortisol secara instan.
        </p>
      </div>

      {/* Metronome Pulse & Timer Circle */}
      <div className="flex flex-col items-center justify-center py-6 relative z-10">
        <div
          className={`w-44 h-44 rounded-full flex flex-col items-center justify-center transition-all duration-300 shadow-md ${
            pulse
              ? "scale-105 ring-8 ring-[#BDE6F0]/60 bg-[#BDE6F0] shadow-softSky"
              : "scale-100 ring-4 ring-[#E8E8E8] bg-[#F6F6F6]"
          }`}
        >
          <Heart className={`w-8 h-8 mb-1.5 ${pulse ? "fill-[#F9B99A] text-[#F9B99A]" : "text-[#9A9A9A]"}`} />
          <span className="text-3xl font-heading font-extrabold sensor-num text-[#1A1A1A] tracking-tight">
            {String(minutes).padStart(2, "0")}:{String(seconds).padStart(2, "0")}
          </span>
          <span className="text-[10px] uppercase tracking-wider text-[#9A9A9A] font-bold mt-1">
            {isRunning ? "Ritme ~116 BPM" : "Siap Dimulai"}
          </span>
        </div>

        {/* Progress Bar */}
        <div className="w-full bg-[#F6F6F6] rounded-full h-3 mt-6 overflow-hidden border border-[#E8E8E8] p-0.5">
          <div
            className="bg-[#CDE8B5] h-full rounded-full transition-all duration-500 shadow-xs"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
      </div>

      {/* Action Controls */}
      <div className="flex items-center justify-center gap-3 relative z-10">
        <button
          onClick={() => setIsRunning(!isRunning)}
          className={`flex items-center gap-2 px-6 py-3 rounded-2xl text-xs font-extrabold transition-all shadow-sm ${
            isRunning
              ? "bg-[#CDE8B5] text-[#1A1A1A] hover:bg-[#B6DF97]"
              : "bg-[#FFF29A] hover:bg-[#FFE966] text-[#1A1A1A] border border-[#FFE966] shadow-softPill"
          }`}
        >
          {isRunning ? (
            <>
              <Pause className="w-4 h-4" /> Jeda Sesi
            </>
          ) : (
            <>
              <Play className="w-4 h-4 fill-[#1A1A1A]" /> {remainingSec < totalSeconds ? "Lanjutkan" : "Mulai Protokol (15 Mnt)"}
            </>
          )}
        </button>

        <button
          onClick={() => {
            setIsRunning(false);
            setRemainingSec(totalSeconds);
          }}
          className="p-3 rounded-2xl bg-[#F6F6F6] hover:bg-[#E8E8E8] text-[#1A1A1A] transition-colors border border-[#E8E8E8]"
          title="Reset Waktu"
        >
          <RotateCcw className="w-4 h-4" />
        </button>

        {remainingSec === 0 && (
          <button
            onClick={onComplete}
            className="flex items-center gap-1.5 px-5 py-3 rounded-2xl bg-[#CDE8B5] text-[#1A1A1A] text-xs font-extrabold hover:bg-[#B6DF97] shadow-softMint"
          >
            <CheckCircle className="w-4 h-4" /> Selesaikan &amp; Klaim +50 XP
          </button>
        )}
      </div>
    </div>
  );
};
