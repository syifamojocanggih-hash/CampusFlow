import React, { useState, useEffect, useRef } from "react";
import {
  CheckCircle2,
  X,
  Play,
  Pause,
  RotateCcw,
  Volume2,
  VolumeX,
  Plus,
  Trash2,
  ListTodo,
  Eye,
  Clock,
  Check,
  Target,
  ShieldCheck,
} from "lucide-react";
import { VisionGuard } from "@/components/vision/VisionGuard";
import { useOsScreenTime } from "@/utils/screenTimeTracker";
import { osScreenLock, useOsScreenLock } from "@/utils/osScreenLock";

interface FocusTask {
  id: string;
  text: string;
  isCompleted: boolean;
  tag: string;
}

const INITIAL_TASKS: FocusTask[] = [
  {
    id: "task-1",
    text: "Laporan Praktikum Basis Data Terdistribusi (Modul 3)",
    isCompleted: true,
    tag: "Praktikum",
  },
  {
    id: "task-2",
    text: "Review Slide Kecerdasan Buatan & Algoritma Heuristik",
    isCompleted: false,
    tag: "Teori",
  },
  {
    id: "task-3",
    text: "Latihan Soal Ujian Pemrograman Web Lanjut",
    isCompleted: false,
    tag: "Ujian",
  },
];

const COMPLETED_SESSIONS = [
  { id: "s-1", time: "08:30 – 08:55", duration: "25 mnt", topic: "Basis Data", status: "Selesai" },
  { id: "s-2", time: "09:10 – 09:35", duration: "25 mnt", topic: "Praktikum Lab", status: "Selesai" },
  { id: "s-3", time: "10:00 – 10:50", duration: "50 mnt", topic: "Kecerdasan Buatan", status: "Selesai" },
  { id: "s-4", time: "11:15 – 11:40", duration: "25 mnt", topic: "Latihan Soal", status: "Selesai" },
  { id: "s-5", time: "13:30 – 13:55", duration: "25 mnt", topic: "Pemrograman Web", status: "Selesai" },
];

export const FocusView: React.FC = () => {
  const osLock = useOsScreenLock();
  // Focus Timer States (Default: 25 mins Pomodoro, starting at 18:42 for session 6)
  const [sessionDurationMins, setSessionDurationMins] = useState<number>(25);
  const [secondsRemaining, setSecondsRemaining] = useState<number>(18 * 60 + 42); // 18:42
  const [isTimerRunning, setIsTimerRunning] = useState<boolean>(true);
  const [completedBouts, setCompletedBouts] = useState<number>(5);

  useEffect(() => {
    if (osLock.isLocked) {
      setIsActiveBreakOpen(false);
    }
  }, [osLock.isLocked]);

  // OS-Level Screen Time State
  const osScreenTime = useOsScreenTime();
  const screenMinutes = osScreenTime.totalMinutes;

  // Active Break Incidental Modal State
  const [isActiveBreakOpen, setIsActiveBreakOpen] = useState<boolean>(false);
  const [activeBreakSuccess, setActiveBreakSuccess] = useState<boolean>(false);

  // 1. Task Checklist States
  const [tasks, setTasks] = useState<FocusTask[]>(INITIAL_TASKS);
  const [newTaskInput, setNewTaskInput] = useState<string>("");
  const [newTaskTag, setNewTaskTag] = useState<string>("Tugas");
  const [activeTaskId, setActiveTaskId] = useState<string>("task-2");

  // 2. Study Soundscapes (Web Audio API Synthesizer)
  const [isAudioPlaying, setIsAudioPlaying] = useState<boolean>(false);
  const [soundscapeType, setSoundscapeType] = useState<"rain" | "alpha" | "white" | "cafe">("rain");
  const [audioVolume, setAudioVolume] = useState<number>(0.25);
  const audioContextRef = useRef<AudioContext | null>(null);
  const gainNodeRef = useRef<GainNode | null>(null);
  const noiseSourceRef = useRef<AudioNode | null>(null);

  // 3. Ergonomic 20-20-20 Eye Rest Timer State
  const [isEyeBreakOpen, setIsEyeBreakOpen] = useState<boolean>(false);
  const [eyeBreakSeconds, setEyeBreakSeconds] = useState<number>(20);
  const [eyeBreakActive, setEyeBreakActive] = useState<boolean>(false);

  // Timer Tick Loop
  useEffect(() => {
    if (!isTimerRunning) return;

    const timer = setInterval(() => {
      setSecondsRemaining((prev) => {
        if (prev <= 1) {
          setIsTimerRunning(false);
          setCompletedBouts((c) => c + 1);
          void osScreenLock.triggerLock(
            "Waktu Sesi Fokus & Screen Time Habis — Wajib Peregangan Aktif"
          );
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [isTimerRunning]);

  // Eye Break 20-Second Countdown Loop
  useEffect(() => {
    if (!isEyeBreakOpen || !eyeBreakActive) return;
    const interval = setInterval(() => {
      setEyeBreakSeconds((prev) => {
        if (prev <= 1) {
          setEyeBreakActive(false);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [isEyeBreakOpen, eyeBreakActive]);

  // Clean Web Audio on Unmount
  useEffect(() => {
    return () => {
      stopSoundscape();
    };
  }, []);

  // Web Audio Synthesizer Engine
  const startSoundscape = (type: "rain" | "alpha" | "white" | "cafe", volume: number) => {
    stopSoundscape();
    try {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (!AudioCtx) return;

      const ctx = new AudioCtx();
      audioContextRef.current = ctx;

      const gain = ctx.createGain();
      gain.gain.setValueAtTime(volume, ctx.currentTime);
      gain.connect(ctx.destination);
      gainNodeRef.current = gain;

      if (type === "white" || type === "rain") {
        const bufferSize = ctx.sampleRate * 2;
        const noiseBuffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
        const output = noiseBuffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) {
          output[i] = Math.random() * 2 - 1;
        }
        const whiteNoise = ctx.createBufferSource();
        whiteNoise.buffer = noiseBuffer;
        whiteNoise.loop = true;

        const filter = ctx.createBiquadFilter();
        if (type === "rain") {
          filter.type = "lowpass";
          filter.frequency.setValueAtTime(550, ctx.currentTime);
        } else {
          filter.type = "bandpass";
          filter.frequency.setValueAtTime(950, ctx.currentTime);
          filter.Q.setValueAtTime(0.6, ctx.currentTime);
        }
        whiteNoise.connect(filter);
        filter.connect(gain);
        whiteNoise.start();
        noiseSourceRef.current = whiteNoise;
      } else if (type === "alpha") {
        const osc1 = ctx.createOscillator();
        const osc2 = ctx.createOscillator();
        osc1.type = "sine";
        osc2.type = "sine";
        osc1.frequency.setValueAtTime(432, ctx.currentTime);
        osc2.frequency.setValueAtTime(436, ctx.currentTime);

        const merger = ctx.createChannelMerger(2);
        osc1.connect(merger, 0, 0);
        osc2.connect(merger, 0, 1);
        merger.connect(gain);

        osc1.start();
        osc2.start();
        noiseSourceRef.current = osc1;
      } else if (type === "cafe") {
        const bufferSize = ctx.sampleRate * 2;
        const noiseBuffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
        const output = noiseBuffer.getChannelData(0);
        let lastOut = 0.0;
        for (let i = 0; i < bufferSize; i++) {
          const white = Math.random() * 2 - 1;
          output[i] = (lastOut + 0.02 * white) / 1.02;
          lastOut = output[i];
          output[i] *= 3.5;
        }
        const brownNoise = ctx.createBufferSource();
        brownNoise.buffer = noiseBuffer;
        brownNoise.loop = true;
        brownNoise.connect(gain);
        brownNoise.start();
        noiseSourceRef.current = brownNoise;
      }
      setIsAudioPlaying(true);
    } catch (err) {
      console.warn("Web Audio tidak dapat diputar:", err);
      setIsAudioPlaying(false);
    }
  };

  const stopSoundscape = () => {
    if (noiseSourceRef.current) {
      try {
        (noiseSourceRef.current as unknown as { stop?: () => void }).stop?.();
      } catch {}
      noiseSourceRef.current = null;
    }
    if (audioContextRef.current) {
      try {
        audioContextRef.current.close();
      } catch {}
      audioContextRef.current = null;
    }
    setIsAudioPlaying(false);
  };

  const handleToggleAudio = () => {
    if (isAudioPlaying) {
      stopSoundscape();
    } else {
      startSoundscape(soundscapeType, audioVolume);
    }
  };

  const handleChangeSoundType = (type: "rain" | "alpha" | "white" | "cafe") => {
    setSoundscapeType(type);
    if (isAudioPlaying) {
      startSoundscape(type, audioVolume);
    }
  };

  const handleVolumeChange = (vol: number) => {
    setAudioVolume(vol);
    if (gainNodeRef.current && audioContextRef.current) {
      gainNodeRef.current.gain.setValueAtTime(vol, audioContextRef.current.currentTime);
    }
  };

  const handleSelectPreset = (mins: number) => {
    setIsTimerRunning(false);
    setSessionDurationMins(mins);
    const totalSecs = Math.max(1, Math.round(mins * 60));
    setSecondsRemaining(totalSecs);
    void osScreenLock.disarmTimer();
  };

  const handleResetTimer = () => {
    setIsTimerRunning(false);
    setSecondsRemaining(Math.max(1, Math.round(sessionDurationMins * 60)));
    void osScreenLock.disarmTimer();
  };

  const formatTimer = (totalSeconds: number) => {
    const m = Math.floor(totalSeconds / 60);
    const s = totalSeconds % 60;
    return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  };

  // Task actions
  const handleToggleTask = (id: string) => {
    setTasks((prev) =>
      prev.map((t) => (t.id === id ? { ...t, isCompleted: !t.isCompleted } : t))
    );
  };

  const handleAddTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTaskInput.trim()) return;
    const newTask: FocusTask = {
      id: `task-${Date.now()}`,
      text: newTaskInput.trim(),
      isCompleted: false,
      tag: newTaskTag,
    };
    setTasks((prev) => [...prev, newTask]);
    setNewTaskInput("");
    if (!activeTaskId) {
      setActiveTaskId(newTask.id);
    }
  };

  const handleDeleteTask = (id: string) => {
    setTasks((prev) => prev.filter((t) => t.id !== id));
    if (activeTaskId === id) {
      const remaining = tasks.filter((t) => t.id !== id);
      setActiveTaskId(remaining.length > 0 ? remaining[0].id : "");
    }
  };

  // Progress metrics
  const totalSessionSeconds = sessionDurationMins * 60;
  const progressPct = Math.min(
    100,
    Math.max(
      0,
      Math.round(((totalSessionSeconds - secondsRemaining) / totalSessionSeconds) * 100)
    )
  );

  const totalCompletedMinutes = completedBouts * sessionDurationMins;
  const formattedFocusHours = `${Math.floor(totalCompletedMinutes / 60)} j ${
    (totalCompletedMinutes % 60).toString().padStart(2, "0")
  } m`;

  const completedTaskCount = tasks.filter((t) => t.isCompleted).length;
  const activeTask = tasks.find((t) => t.id === activeTaskId);

  const radius = 105;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference * (1 - progressPct / 100);

  return (
    <div className="w-full space-y-6 pb-12 font-sans">
      {/* ========================================================
          1. TOP PAGE HEADER
          ======================================================== */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="font-heading font-extrabold text-2xl sm:text-3xl text-[#2F3A2E] tracking-tight">
            Workstation Belajar &amp; Jeda
          </h1>
          <p className="text-xs sm:text-sm text-[#636B60] mt-1">
            Fokus menyelesaikan satu tugas dalam satu waktu, diselingi jeda restoratif ergonomis.
          </p>
        </div>

        {/* Live Active Target Pill */}
        {activeTask && (
          <div className="inline-flex items-center gap-2 bg-[#E8DDCF] border border-[#E8DDCF] px-3.5 py-1.5 rounded-2xl shadow-2xs self-start sm:self-auto">
            <Target className="w-3.5 h-3.5 text-[#2F3A2E]" />
            <div className="text-xs">
              <span className="text-[#636B60] font-semibold">Target Aktif: </span>
              <strong className="text-[#2F3A2E] font-extrabold truncate max-w-[200px] sm:max-w-[260px] inline-block align-bottom">
                {activeTask.text}
              </strong>
            </div>
          </div>
        )}
      </div>

      {/* ========================================================
          2. MAIN FOCUS WORKSTATION CARD
          ======================================================== */}
      <div className="bg-white rounded-[1.75rem] p-6 sm:p-8 shadow-xs border border-[#E8DDCF] space-y-6">
        {/* Top Control Bar of Card */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-[#E8DDCF] pb-4">
          <div className="flex items-center gap-2">
            <span className="font-heading text-sm font-bold tracking-wide text-[#2F3A2E] uppercase">
              SESI FOKUS KE-{completedBouts + 1}
            </span>
          </div>

          <div className="flex items-center flex-wrap gap-2">
            {/* Preset Duration Switcher */}
            <div className="bg-[#FAF6F0] p-1 rounded-2xl flex items-center gap-1 border border-[#E8DDCF]">
              <button
                type="button"
                onClick={() => {
                  setSessionDurationMins(0.25);
                  setSecondsRemaining(15);
                  setIsTimerRunning(true);
                  void osScreenLock.armTimer(
                    15,
                    "Waktu Sesi Fokus (15 Detik Mode Uji) Habis — Wajib Peregangan Aktif"
                  );
                }}
                className={`px-3 py-1 rounded-xl text-xs font-bold transition-all ${
                  sessionDurationMins === 0.25
                    ? "bg-[#CFD8C4] text-[#2F3A2E] font-extrabold shadow-2xs border border-[#BCC8AE]"
                    : "text-[#636B60] hover:text-[#2F3A2E]"
                }`}
                title="Klik lalu pindah ke tab/aplikasi lain. Dalam 15 detik layar otomatis ditarik kembali ke sini."
              >
                15 detik (Uji OS Lock)
              </button>
              <button
                type="button"
                onClick={() => handleSelectPreset(25)}
                className={`px-3.5 py-1 rounded-xl text-xs font-bold transition-all ${
                  sessionDurationMins === 25
                    ? "bg-[#CFD8C4] text-[#2F3A2E] font-extrabold shadow-2xs border border-[#BCC8AE]"
                    : "text-[#636B60] hover:text-[#2F3A2E]"
                }`}
              >
                25 menit
              </button>
              <button
                type="button"
                onClick={() => handleSelectPreset(50)}
                className={`px-3.5 py-1 rounded-xl text-xs font-bold transition-all ${
                  sessionDurationMins === 50
                    ? "bg-[#CFD8C4] text-[#2F3A2E] font-extrabold shadow-2xs border border-[#BCC8AE]"
                    : "text-[#636B60] hover:text-[#2F3A2E]"
                }`}
              >
                50 menit
              </button>
            </div>

            {/* Privacy Camera Status Badge / Trigger Active Break */}
            <button
              type="button"
              onClick={() =>
                void osScreenLock.triggerLock(
                  "Sesi Jeda Aktif Dimulai — Selesaikan 3 Repetisi Peregangan"
                )
              }
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#E8DDCF] hover:bg-[#CFD8C4] active:bg-[#CFD8C4] text-xs font-bold text-[#2F3A2E] transition-colors border border-[#CFD8C4]"
              title="Kunci layar level OS sekarang dan mulai peregangan 2 menit dengan validasi MediaPipe on-device."
            >
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Mulai Jeda &amp; Kunci Layar</span>
            </button>
          </div>
        </div>

        {/* Circular Countdown Progress Timer (Centered) */}
        <div className="flex flex-col items-center justify-center my-3 sm:my-6">
          <div className="relative w-64 h-64 sm:w-72 sm:h-72 flex items-center justify-center">
            <svg
              className="w-full h-full -rotate-90 select-none pointer-events-none"
              viewBox="0 0 250 250"
            >
              <circle
                cx="125"
                cy="125"
                r={radius}
                fill="none"
                stroke="#E8DDCF"
                strokeWidth="11"
              />
              <circle
                cx="125"
                cy="125"
                r={radius}
                fill="none"
                stroke="#2F3A2E"
                strokeWidth="11"
                strokeLinecap="round"
                strokeDasharray={circumference}
                strokeDashoffset={strokeDashoffset}
                className="transition-all duration-500 ease-linear"
              />
            </svg>

            {/* Inner Center Display */}
            <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-4 select-none">
              <span className="font-heading font-extrabold text-5xl sm:text-6xl text-[#2F3A2E] tracking-tight tabular-nums leading-none">
                {formatTimer(secondsRemaining)}
              </span>
              <span className="text-xs sm:text-[13px] text-[#636B60] mt-3 font-medium max-w-[200px] truncate">
                {activeTask ? activeTask.text : "Tetap di sini, satu langkah lagi."}
              </span>
            </div>
          </div>
        </div>

        {/* Action Control Buttons */}
        <div className="flex items-center justify-center gap-3 pt-1">
          <button
            type="button"
            onClick={() => setIsTimerRunning(!isTimerRunning)}
            className="py-3 px-8 rounded-2xl bg-[#CFD8C4] hover:bg-[#BCC8AE] text-[#2F3A2E] border border-[#BCC8AE] font-extrabold text-xs sm:text-sm transition-all shadow-softPill active:scale-95 flex items-center gap-2"
          >
            {isTimerRunning ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
            <span>{isTimerRunning ? "Jeda Sesi" : "Lanjutkan Sesi"}</span>
          </button>
          <button
            type="button"
            onClick={handleResetTimer}
            className="py-3 px-6 rounded-2xl bg-[#FAF6F0] hover:bg-[#CFD8C4] text-[#2F3A2E] font-bold text-xs sm:text-sm transition-colors active:scale-95 flex items-center gap-1.5 border border-[#E8DDCF]"
          >
            <RotateCcw className="w-4 h-4 text-[#636B60]" />
            <span>Reset</span>
          </button>
        </div>

        {/* Study Soundscapes Mini-Bar */}
        <div className="bg-[#FAF6F0] rounded-2xl p-3.5 border border-[#E8DDCF] flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2.5">
            <button
              type="button"
              onClick={handleToggleAudio}
              className={`w-9 h-9 rounded-xl flex items-center justify-center transition-all ${
                isAudioPlaying
                  ? "bg-[#CFD8C4] text-[#2F3A2E] shadow-xs"
                  : "bg-white border border-[#E8DDCF] text-[#636B60] hover:text-[#2F3A2E]"
              }`}
              title={isAudioPlaying ? "Hentikan Suara Ambience" : "Putar Suara Ambience"}
            >
              {isAudioPlaying ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
            </button>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-heading font-extrabold text-[#2F3A2E]">
                  Suara Ambience Belajar
                </span>
                {isAudioPlaying && (
                  <span className="flex items-center gap-0.5">
                    <span className="w-1 h-3 bg-[#CFD8C4] rounded-full animate-pulse" />
                    <span className="w-1 h-4 bg-[#CFD8C4] rounded-full animate-pulse delay-75" />
                    <span className="w-1 h-2 bg-[#CFD8C4] rounded-full animate-pulse delay-150" />
                  </span>
                )}
              </div>
              <p className="text-[11px] text-[#636B60]">
                Audio sintesis lokal santai untuk meredam kebisingan sekitar.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap justify-end">
            {[
              { key: "rain", label: "🌧️ Hujan", desc: "Pink Noise" },
              { key: "alpha", label: "🌊 Gelombang 432Hz", desc: "Binaural" },
              { key: "white", label: "📻 White Noise", desc: "Fokus" },
              { key: "cafe", label: "☕ Kafe Kampus", desc: "Brown Noise" },
            ].map((snd) => (
              <button
                key={snd.key}
                type="button"
                onClick={() => handleChangeSoundType(snd.key as "rain" | "alpha" | "white" | "cafe")}
                className={`px-2.5 py-1 rounded-xl text-[11px] font-bold transition-all ${
                  soundscapeType === snd.key
                    ? "bg-[#CFD8C4] text-[#2F3A2E] border border-[#BCC8AE] shadow-2xs font-extrabold"
                    : "bg-white border border-[#E8DDCF] text-[#636B60] hover:text-[#2F3A2E]"
                }`}
              >
                {snd.label}
              </button>
            ))}

            {/* Volume slider */}
            <div className="flex items-center gap-1.5 pl-2">
              <input
                type="range"
                min="0.05"
                max="0.8"
                step="0.05"
                value={audioVolume}
                onChange={(e) => handleVolumeChange(parseFloat(e.target.value))}
                className="w-16 accent-[#2F3A2E] h-1.5 bg-[#E8DDCF] rounded cursor-pointer"
                title={`Volume: ${Math.round(audioVolume * 100)}%`}
              />
            </div>
          </div>
        </div>
      </div>

      {/* ========================================================
          3. SUPPORTING FEATURE 1: TARGET TUGAS SESI INI (Checklist)
          ======================================================== */}
      <div className="bg-white rounded-3xl p-6 border border-[#E8DDCF] shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[#E8DDCF] pb-3">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-[#E8DDCF] text-[#2F3A2E] flex items-center justify-center font-bold">
              <ListTodo className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-heading font-extrabold text-base text-[#2F3A2E]">
                Target Tugas Sesi Ini
              </h3>
              <p className="text-[11px] text-[#636B60]">
                Pilih atau tandai tugas akademik yang sedang Anda kerjakan saat ini.
              </p>
            </div>
          </div>
          <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-[#FAF6F0] text-[#2F3A2E] border border-[#E8DDCF] self-start sm:self-auto">
            {completedTaskCount} dari {tasks.length} Selesai
          </span>
        </div>

        {/* Task List */}
        <div className="space-y-2">
          {tasks.map((task) => {
            const isSelected = activeTaskId === task.id;
            return (
              <div
                key={task.id}
                className={`p-3 rounded-2xl border transition-all flex items-center justify-between gap-3 ${
                  isSelected
                    ? "bg-[#CFD8C4]/20 border-[#BCC8AE]"
                    : "bg-[#FAF6F0] border-[#E8DDCF] hover:bg-white"
                }`}
              >
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <button
                    type="button"
                    onClick={() => handleToggleTask(task.id)}
                    className={`w-5 h-5 rounded-lg flex items-center justify-center transition-colors border ${
                      task.isCompleted
                        ? "bg-[#CFD8C4] border-[#CFD8C4] text-[#2F3A2E]"
                        : "border-[#E8DDCF] bg-white hover:border-[#2F3A2E]"
                    }`}
                  >
                    {task.isCompleted && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                  </button>

                  <div
                    onClick={() => setActiveTaskId(task.id)}
                    className="flex-1 min-w-0 cursor-pointer"
                  >
                    <p
                      className={`text-xs sm:text-sm font-semibold truncate ${
                        task.isCompleted
                          ? "line-through text-[#636B60]"
                          : "text-[#2F3A2E]"
                      }`}
                    >
                      {task.text}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-white border border-[#E8DDCF] text-[#636B60]">
                    {task.tag}
                  </span>
                  <button
                    type="button"
                    onClick={() => setActiveTaskId(task.id)}
                    className={`text-[11px] font-bold px-2.5 py-1 rounded-xl transition-all ${
                      isSelected
                        ? "bg-[#CFD8C4] text-[#2F3A2E]"
                        : "bg-white border border-[#E8DDCF] text-[#636B60] hover:text-[#2F3A2E]"
                    }`}
                  >
                    {isSelected ? "Fokus Aktif" : "Pilih"}
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDeleteTask(task.id)}
                    className="w-7 h-7 rounded-lg hover:bg-red-50 text-[#636B60] hover:text-red-600 flex items-center justify-center transition-colors"
                    title="Hapus Tugas"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {/* Add New Task Form */}
        <form onSubmit={handleAddTask} className="flex gap-2 pt-1">
          <input
            type="text"
            value={newTaskInput}
            onChange={(e) => setNewTaskInput(e.target.value)}
            placeholder="Tambah tugas belajar baru..."
            className="flex-1 px-3.5 py-2 rounded-xl text-xs sm:text-sm bg-[#FAF6F0] border border-[#E8DDCF] focus:outline-none focus:border-[#2F3A2E] text-[#2F3A2E]"
          />
          <select
            value={newTaskTag}
            onChange={(e) => setNewTaskTag(e.target.value)}
            className="px-2.5 py-2 rounded-xl text-xs font-bold bg-[#FAF6F0] border border-[#E8DDCF] text-[#2F3A2E] focus:outline-none"
          >
            <option value="Tugas">Tugas</option>
            <option value="Praktikum">Praktikum</option>
            <option value="Ujian">Ujian</option>
            <option value="Skripsi">Skripsi</option>
          </select>
          <button
            type="submit"
            className="px-4 py-2 rounded-xl bg-[#CFD8C4] hover:bg-[#BCC8AE] text-[#2F3A2E] border border-[#BCC8AE] font-bold text-xs transition-colors flex items-center gap-1.5 shrink-0"
          >
            <Plus className="w-4 h-4" />
            <span>Tambah</span>
          </button>
        </form>
      </div>

      {/* ========================================================
          4. SUPPORTING FEATURE 2: ERGONOMICS & ATURAN 20-20-20
          ======================================================== */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
        {/* Card A: Aturan 20-20-20 (Eye Relaxation) */}
        <div className="bg-white rounded-3xl p-5 sm:p-6 border border-[#E8DDCF] shadow-xs flex flex-col justify-between space-y-4">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-[#E8DDCF] text-[#2F3A2E] flex items-center justify-center font-bold">
                <Eye className="w-4 h-4" />
              </div>
              <div>
                <h4 className="font-heading font-extrabold text-sm sm:text-base text-[#2F3A2E]">
                  Aturan 20-20-20 Istirahat Mata
                </h4>
                <span className="text-[10px] text-[#636B60]">Protokol Pencegahan Digital Eye Strain</span>
              </div>
            </div>
            <p className="text-xs text-[#636B60] leading-relaxed">
              Setiap <strong>20 menit</strong> menatap layar, istirahatkan mata dengan memandang objek sejauh <strong>20 kaki (6 meter)</strong> selama <strong>20 detik</strong>.
            </p>
          </div>

          <button
            type="button"
            onClick={() => {
              setEyeBreakSeconds(20);
              setEyeBreakActive(true);
              setIsEyeBreakOpen(true);
            }}
            className="w-full py-2.5 px-4 rounded-xl bg-[#E8DDCF] hover:bg-[#CFD8C4] active:bg-[#CFD8C4] text-[#2F3A2E] font-extrabold text-xs transition-all flex items-center justify-center gap-2 shadow-2xs cursor-pointer"
          >
            <Eye className="w-4 h-4" />
            <span>Mulai Jeda Mata 20 Detik</span>
          </button>
        </div>

        {/* Card B: Checklist Postur Ergonomis */}
        <div className="bg-white rounded-3xl p-5 sm:p-6 border border-[#E8DDCF] shadow-xs flex flex-col justify-between space-y-3">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-[#E8DDCF] text-[#2F3A2E] flex items-center justify-center font-bold">
                <ShieldCheck className="w-4 h-4" />
              </div>
              <div>
                <h4 className="font-heading font-extrabold text-sm sm:text-base text-[#2F3A2E]">
                  Checklist Postur Belajar Nyaman
                </h4>
                <span className="text-[10px] text-[#636B60]">Mencegah Kelelahan Leher &amp; Punggung</span>
              </div>
            </div>

            <div className="space-y-2 text-xs text-[#636B60] pt-1">
              <div className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-[#CFD8C4]" />
                <span>Bezel atas layar sejajar garis pandang mata (hindari menunduk).</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-[#CFD8C4]" />
                <span>Bahu rileks &amp; siku bertumpu membentuk sudut siku-siku (~90&deg;).</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-[#CFD8C4]" />
                <span>Kedua telapak kaki menapak rata di lantai secara stabil.</span>
              </div>
            </div>
          </div>

          <div className="pt-1 text-[11px] text-[#636B60] flex items-center justify-between border-t border-[#E8DDCF]">
            <span>Perlu evaluasi kamera?</span>
            <button
              type="button"
              onClick={() =>
                void osScreenLock.triggerLock(
                  "Uji Active Break 2 Menit — Selesaikan 3 Repetisi Peregangan"
                )
              }
              className="text-[#2F3A2E] font-bold underline hover:text-black cursor-pointer"
            >
              Uji Active Break 2 Menit
            </button>
          </div>
        </div>
      </div>

      {/* ========================================================
          5. SUPPORTING FEATURE 3: TIMELINE SESI FOKUS HARI INI
          ======================================================== */}
      <div className="bg-white rounded-3xl p-6 border border-[#E8DDCF] shadow-xs space-y-4">
        <div className="flex items-center justify-between border-b border-[#E8DDCF] pb-3">
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-[#2F3A2E]" />
            <h3 className="font-heading font-extrabold text-sm sm:text-base text-[#2F3A2E]">
              Garis Waktu Sesi Fokus Hari Ini
            </h3>
          </div>
          <span className="text-[11px] font-bold text-[#636B60]">
            Total Akumulasi: {formattedFocusHours}
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2.5">
          {COMPLETED_SESSIONS.map((session, index) => (
            <div
              key={session.id}
              className="p-3 rounded-2xl bg-[#FAF6F0] border border-[#E8DDCF] space-y-1.5 text-center"
            >
              <div className="flex items-center justify-center gap-1 text-[11px] font-bold text-[#2F3A2E]">
                <CheckCircle2 className="w-3.5 h-3.5 text-[#2F3A2E]" />
                <span>Sesi #{index + 1}</span>
              </div>
              <p className="font-heading font-extrabold text-xs text-[#2F3A2E] truncate">
                {session.topic}
              </p>
              <div className="text-[10px] text-[#636B60]">{session.time}</div>
              <span className="inline-block text-[9px] font-extrabold px-2 py-0.5 rounded-full bg-[#E8DDCF] text-[#2F3A2E]">
                {session.duration}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* ========================================================
          6. BOTTOM METRIC CARDS: RITME FOKUS HARI INI
          ======================================================== */}
      <div className="space-y-4 pt-1">
        <h3 className="font-heading font-extrabold text-base sm:text-lg text-[#2F3A2E]">
          Statistik Ringkasan Hari Ini
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6">
          {/* Card 1: Total Durasi Fokus */}
          <div className="bg-white rounded-3xl p-5 sm:p-6 border border-[#E8DDCF] shadow-xs text-center flex flex-col justify-between">
            <div className="space-y-1">
              <h4 className="font-heading font-extrabold text-base text-[#2F3A2E]">
                Total Waktu Fokus
              </h4>
              <p className="text-[11px] text-[#636B60] font-medium">
                {sessionDurationMins} mnt / sesi
              </p>
            </div>
            <div className="my-2">
              <div className="font-heading font-extrabold text-3xl sm:text-4xl text-[#2F3A2E] sensor-num tracking-tight">
                {formattedFocusHours}
              </div>
            </div>
          </div>

          {/* Card 2: Pomodoro Selesai */}
          <div className="bg-white rounded-3xl p-5 sm:p-6 border border-[#E8DDCF] shadow-xs text-center flex flex-col justify-between">
            <div className="space-y-1">
              <h4 className="font-heading font-extrabold text-base text-[#2F3A2E]">
                Pomodoro Selesai
              </h4>
              <p className="text-[11px] text-[#636B60] font-medium">
                Target harian 6 sesi
              </p>
            </div>
            <div className="my-2">
              <div className="font-heading font-extrabold text-3xl sm:text-4xl text-[#2F3A2E] sensor-num tracking-tight">
                {completedBouts} sesi
              </div>
            </div>
          </div>

          {/* Card 3: Waktu Layar Pasif */}
          <div className="bg-white rounded-3xl p-5 sm:p-6 border border-[#E8DDCF] shadow-xs text-center flex flex-col justify-between">
            <div className="space-y-1">
              <h4 className="font-heading font-extrabold text-base text-[#2F3A2E]">
                Waktu Layar Pasif
              </h4>
              <p className="text-[11px] text-[#636B60] font-medium">
                Batas aman &le; 8 jam
              </p>
            </div>
            <div className="my-2">
              <div className="font-heading font-extrabold text-3xl sm:text-4xl text-[#2F3A2E] sensor-num tracking-tight">
                {Math.floor(screenMinutes / 60)} jam
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ========================================================
          7. MODAL JEDA MATA 20 DETIK (20-20-20 Rule Modal)
          ======================================================== */}
      {isEyeBreakOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 text-center space-y-5 shadow-2xl border border-[#E8DDCF]">
            <div className="w-16 h-16 rounded-3xl bg-[#E8DDCF] text-[#2F3A2E] flex items-center justify-center mx-auto shadow-sm">
              <Eye className="w-8 h-8" />
            </div>

            <div>
              <h3 className="font-heading font-extrabold text-xl text-[#2F3A2E]">
                Jeda Istirahat Mata (20 Detik)
              </h3>
              <p className="text-xs text-[#636B60] mt-1.5 max-w-xs mx-auto leading-relaxed">
                Tatap objek di luar jendela atau sudut terjauh ruangan (~6 meter). Biarkan otot fokus mata beristirahat.
              </p>
            </div>

            {/* Countdown Display */}
            <div className="py-2">
              <div className="font-heading font-extrabold text-5xl text-[#2F3A2E] tabular-nums">
                {eyeBreakSeconds}s
              </div>
              <p className="text-[11px] text-[#636B60] mt-1 font-semibold">
                {eyeBreakSeconds > 0
                  ? "Kedipkan mata perlahan & tarik napas dalam..."
                  : "Mata Anda telah kembali segar! ✨"}
              </p>
            </div>

            <div className="flex gap-2 justify-center pt-2">
              {eyeBreakSeconds === 0 ? (
                <button
                  type="button"
                  onClick={() => setIsEyeBreakOpen(false)}
                  className="py-3 px-6 rounded-2xl bg-[#E8DDCF] hover:bg-[#CFD8C4] active:bg-[#CFD8C4] text-[#2F3A2E] font-extrabold text-xs transition-colors shadow-xs"
                >
                  Kembali Belajar
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => setIsEyeBreakOpen(false)}
                  className="py-2.5 px-5 rounded-2xl bg-[#FAF6F0] hover:bg-[#CFD8C4] text-[#2F3A2E] font-bold text-xs transition-colors"
                >
                  Tutup Saja
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ========================================================
          8. ACTIVE BREAK 2-MINUTE ON-DEMAND MODAL
          ======================================================== */}
      {isActiveBreakOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl max-w-2xl w-full p-6 shadow-2xl border border-[#E8DDCF] space-y-4 max-h-[92vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-3 border-b border-[#E8DDCF]">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-[#E8DDCF] text-[#2F3A2E] flex items-center justify-center shrink-0">
                  <Play className="w-5 h-5 fill-[#2F3A2E] ml-0.5" />
                </div>
                <div>
                  <h3 className="font-heading font-extrabold text-base text-[#2F3A2E]">
                    On-Demand Active Break (2 Menit)
                  </h3>
                  <p className="text-[11px] text-[#636B60]">
                    Rentangkan tangan di atas kepala (Overhead Reach) atau beranjak berdiri selama 3 repetisi.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsActiveBreakOpen(false)}
                className="w-8 h-8 rounded-full bg-[#FAF6F0] hover:bg-[#CFD8C4] text-[#2F3A2E] flex items-center justify-center transition-colors"
                title="Tutup & Matikan Kamera"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Success Banner if Completed */}
            {activeBreakSuccess && (
              <div className="p-4 rounded-2xl bg-[#E8DDCF] text-[#2F3A2E] flex items-center gap-3 animate-in zoom-in-95">
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
            <div className="pt-2 flex items-center justify-between text-xs text-[#636B60]">
              <span>Kamera otomatis dimatikan setelah pose peregangan selesai.</span>
              <button
                type="button"
                onClick={() => setIsActiveBreakOpen(false)}
                className="px-4 py-2 rounded-xl bg-[#FAF6F0] hover:bg-[#FAF6F0] text-[#2F3A2E] font-bold text-xs transition-colors"
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
