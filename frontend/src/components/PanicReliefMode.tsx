import React, { useEffect, useState } from "react";
import { ArrowLeft, Heart, Play, Pause, RotateCcw, CheckCircle } from "lucide-react";
import { CLINICAL_CONSTANTS } from "@/types";

interface PanicReliefModeProps {
  onClose: () => void;
  onComplete: () => void;
}

export const PanicReliefMode: React.FC<PanicReliefModeProps> = ({
  onClose,
  onComplete,
}) => {
  const totalSeconds = CLINICAL_CONSTANTS.ACUTE_RELIEF_AEROBIC_MINS * 60; // 900 detik (15 menit)
  const [remainingSec, setRemainingSec] = useState(totalSeconds);
  const [isRunning, setIsRunning] = useState(false);
  const [pulse, setPulse] = useState(false);

  // BPM Metronome rhythm (110–125 BPM ~ 116 BPM = ~517 ms per beat)
  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;
    if (isRunning && remainingSec > 0) {
      interval = setInterval(() => {
        setRemainingSec((prev) => {
          if (prev <= 1) {
            setIsRunning(false);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isRunning, remainingSec]);

  // Metronome visual pulse
  useEffect(() => {
    if (!isRunning) return;
    const pulseInterval = setInterval(() => {
      setPulse((p) => !p);
    }, 517); // ~116 BPM
    return () => clearInterval(pulseInterval);
  }, [isRunning]);

  const minutes = Math.floor(remainingSec / 60);
  const seconds = remainingSec % 60;
  const progressPercent = ((totalSeconds - remainingSec) / totalSeconds) * 100;

  return (
    <div className="bg-gradient-to-b from-teal-50 to-white rounded-2xl p-6 border border-teal-200 shadow-sm max-w-xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <button
          onClick={onClose}
          className="flex items-center gap-1.5 text-xs text-slate-600 hover:text-slate-900 font-medium"
        >
          <ArrowLeft className="w-4 h-4" /> Kembali
        </button>
        <span className="bg-teal-100 text-teal-800 text-xs px-2.5 py-0.5 rounded-full font-semibold">
          RCT Wu &amp; Zhou (2024)
        </span>
      </div>

      <div className="text-center space-y-2">
        <h2 className="text-2xl font-bold font-heading text-textMain">
          Exam Panic Relief Protocol
        </h2>
        <p className="text-xs text-slate-600 max-w-md mx-auto">
          Latihan aerobik akut di tempat (jalan di tempat berirama) selama 15 menit dengan detak ritme target 110–125 BPM untuk meredakan kecemasan akademik secara instan.
        </p>
      </div>

      {/* Visual Metronome Rhythm */}
      <div className="flex flex-col items-center justify-center py-6">
        <div
          className={`w-36 h-36 rounded-full flex flex-col items-center justify-center transition-transform duration-200 shadow-md ${
            pulse
              ? "scale-105 bg-teal-500 text-white shadow-teal-300"
              : "scale-100 bg-teal-600 text-white"
          }`}
        >
          <Heart className={`w-8 h-8 mb-1 ${pulse ? "fill-white" : ""}`} />
          <span className="text-2xl font-extrabold sensor-num">
            {String(minutes).padStart(2, "0")}:{String(seconds).padStart(2, "0")}
          </span>
          <span className="text-[10px] uppercase tracking-wider opacity-90">
            {isRunning ? "Ritme ~116 BPM" : "Siap Mulai"}
          </span>
        </div>

        {/* Progress Bar */}
        <div className="w-full bg-slate-100 rounded-full h-2.5 mt-6 overflow-hidden">
          <div
            className="bg-teal-600 h-2.5 rounded-full transition-all duration-500"
            style={{ width: `${progressPercent}%` }}
          ></div>
        </div>
      </div>

      {/* Control Buttons */}
      <div className="flex items-center justify-center gap-3">
        <button
          onClick={() => setIsRunning(!isRunning)}
          className={`flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-semibold text-white shadow-xs transition-colors ${
            isRunning
              ? "bg-amber-600 hover:bg-amber-700"
              : "bg-teal-600 hover:bg-teal-700"
          }`}
        >
          {isRunning ? (
            <>
              <Pause className="w-4 h-4" /> Jeda
            </>
          ) : (
            <>
              <Play className="w-4 h-4 fill-white" /> {remainingSec < totalSeconds ? "Lanjutkan" : "Mulai Protokol"}
            </>
          )}
        </button>

        <button
          onClick={() => {
            setIsRunning(false);
            setRemainingSec(totalSeconds);
          }}
          className="p-2.5 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-100 transition-colors"
          title="Reset Timer"
        >
          <RotateCcw className="w-4 h-4" />
        </button>

        {remainingSec === 0 && (
          <button
            onClick={onComplete}
            className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-green-600 text-white text-sm font-semibold hover:bg-green-700"
          >
            <CheckCircle className="w-4 h-4" /> Klaim +50 XP
          </button>
        )}
      </div>
    </div>
  );
};

