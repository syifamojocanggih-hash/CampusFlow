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
  Check,
  ShieldCheck,
  CloudRain,
  Waves,
  AudioLines,
  Coffee,
} from "lucide-react";
import { VisionGuard } from "@/components/vision/VisionGuard";
import { useOsScreenTime } from "@/utils/screenTimeTracker";
import { osScreenLock, useOsScreenLock } from "@/utils/osScreenLock";
import { api } from "@/lib/api";

interface FocusTask {
  id: string;
  text: string;
  isCompleted: boolean;
  tag: string;
}

function getFocusTasksStorageKey(): string {
  try {
    const raw = localStorage.getItem("cf_user_profile");
    if (raw) {
      const parsed = JSON.parse(raw) as { id?: string };
      if (parsed?.id) return `cf_focus_tasks_${parsed.id}`;
    }
  } catch {
    // ignore
  }
  return "cf_focus_tasks_default";
}

function loadSavedFocusTasks(): FocusTask[] {
  try {
    const raw = localStorage.getItem(getFocusTasksStorageKey());
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) return parsed as FocusTask[];
    }
  } catch {
    // ignore
  }
  return [];
}

export const FocusView: React.FC = () => {
  const osLock = useOsScreenLock();
  // Focus Timer States (Clean default: 25:00 paused, completedBouts synced from MySQL)
  const [sessionDurationMins, setSessionDurationMins] = useState<number>(25);
  const [secondsRemaining, setSecondsRemaining] = useState<number>(25 * 60);
  const [isTimerRunning, setIsTimerRunning] = useState<boolean>(false);
  const [completedBouts, setCompletedBouts] = useState<number>(0);
  const sessionStartRef = useRef<Date | null>(null);

  useEffect(() => {
    if (osLock.isLocked) {
      setIsActiveBreakOpen(false);
    }
  }, [osLock.isLocked]);

  // Load today's real completed focus/sedentary sessions from MySQL
  useEffect(() => {
    const todayIso = new Date().toISOString().slice(0, 10);
    api
      .getSedentarySessions(1)
      .then((res) => {
        const list = Array.isArray(res?.data) ? res.data : [];
        const todayCount = list.filter((s) => {
          const rec = s as { startTime?: string };
          return String(rec.startTime || "").startsWith(todayIso);
        }).length;
        setCompletedBouts(todayCount);
      })
      .catch(() => {});
  }, []);

  // Track start time when user starts timer
  useEffect(() => {
    if (isTimerRunning && !sessionStartRef.current) {
      sessionStartRef.current = new Date();
    }
  }, [isTimerRunning]);

  // OS-Level Screen Time State
  const osScreenTime = useOsScreenTime();
  const screenMinutes = osScreenTime.totalMinutes;

  // Active Break Incidental Modal State
  const [isActiveBreakOpen, setIsActiveBreakOpen] = useState<boolean>(false);
  const [activeBreakSuccess, setActiveBreakSuccess] = useState<boolean>(false);

  // 1. Task Checklist States (Synced with MySQL /api/v1/focus-tasks, localStorage cache as offline fallback)
  const [tasks, setTasks] = useState<FocusTask[]>(() => loadSavedFocusTasks());
  const [newTaskInput, setNewTaskInput] = useState<string>("");
  const [newTaskTag, setNewTaskTag] = useState<string>("Tugas");
  const [activeTaskId, setActiveTaskId] = useState<string>(() => {
    const initial = loadSavedFocusTasks();
    return initial.find((t) => !t.isCompleted)?.id ?? initial[0]?.id ?? "";
  });

  // Load FocusTasks from MySQL database on mount
  useEffect(() => {
    api
      .getFocusTasks()
      .then((res) => {
        if (Array.isArray(res?.data)) {
          const loaded: FocusTask[] = res.data.map((t) => ({
            id: t.id,
            text: t.text,
            isCompleted: Boolean(t.isCompleted),
            tag: t.tag || "Tugas",
          }));
          setTasks(loaded);
          setActiveTaskId((prev) => {
            if (prev && loaded.some((t) => t.id === prev)) return prev;
            return loaded.find((t) => !t.isCompleted)?.id ?? loaded[0]?.id ?? "";
          });
        }
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem(getFocusTasksStorageKey(), JSON.stringify(tasks));
    } catch {
      // ignore storage quota errors
    }
  }, [tasks]);

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
      setSecondsRemaining((prev) => (prev <= 1 ? 0 : prev - 1));
    }, 1000);

    return () => clearInterval(timer);
  }, [isTimerRunning]);

  // Handle timer completion outside state updater to prevent React StrictMode double-firing
  useEffect(() => {
    if (!isTimerRunning || secondsRemaining > 0) return;

    setIsTimerRunning(false);
    setCompletedBouts((c) => c + 1);

    const endTime = new Date();
    const startTime =
      sessionStartRef.current ??
      new Date(endTime.getTime() - Math.max(1, Math.round(sessionDurationMins)) * 60_000);
    sessionStartRef.current = null;

    void api
      .logSedentarySession({
        startTime: startTime.toISOString(),
        endTime: endTime.toISOString(),
        durationMinutes: Math.max(1, Math.round(sessionDurationMins)),
        slouchCount: 0,
        tooCloseCount: 0,
        avgNeckRatio: 1.0,
        breakCompleted: false,
        breakDurationMins: 0,
        verificationSource: "MANUAL_LOG",
      })
      .catch(() => {});

    if (!osScreenLock.getState().isLocked) {
      void osScreenLock.triggerLock(
        "Waktu Sesi Fokus & Screen Time Habis — Wajib Peregangan Aktif"
      );
    }
  }, [isTimerRunning, secondsRemaining, sessionDurationMins]);

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

  // Task actions (Optimistic UI + Synced to MySQL /api/v1/focus-tasks)
  const handleToggleTask = (id: string) => {
    const target = tasks.find((t) => t.id === id);
    if (!target) return;
    const nextCompleted = !target.isCompleted;
    setTasks((prev) =>
      prev.map((t) => (t.id === id ? { ...t, isCompleted: nextCompleted } : t))
    );
    if (!id.startsWith("task-")) {
      void api.updateFocusTask(id, { isCompleted: nextCompleted }).catch(() => {});
    }
  };

  const handleAddTask = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = newTaskInput.trim();
    if (!trimmed) return;
    const tempId = `task-${Date.now()}`;
    const optimisticTask: FocusTask = {
      id: tempId,
      text: trimmed,
      isCompleted: false,
      tag: newTaskTag,
    };
    setTasks((prev) => [...prev, optimisticTask]);
    setNewTaskInput("");
    if (!activeTaskId) {
      setActiveTaskId(tempId);
    }

    try {
      const res = await api.createFocusTask({ text: trimmed, tag: newTaskTag });
      if (res?.data?.id) {
        const persisted: FocusTask = {
          id: res.data.id,
          text: res.data.text,
          isCompleted: Boolean(res.data.isCompleted),
          tag: res.data.tag || newTaskTag,
        };
        setTasks((prev) => prev.map((t) => (t.id === tempId ? persisted : t)));
        setActiveTaskId((prev) => (prev === tempId ? persisted.id : prev));
      }
    } catch {
      // Keep optimistic local cache if backend is temporarily unreachable
    }
  };

  const handleDeleteTask = (id: string) => {
    const remaining = tasks.filter((t) => t.id !== id);
    setTasks(remaining);
    if (activeTaskId === id) {
      setActiveTaskId(remaining.length > 0 ? remaining[0].id : "");
    }
    if (!id.startsWith("task-")) {
      void api.deleteFocusTask(id).catch(() => {});
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

  const radius = 102;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference * (1 - progressPct / 100);
  const progressAngleRad = ((progressPct / 100) * 360 - 90) * (Math.PI / 180);
  const knobX = 125 + radius * Math.cos(progressAngleRad);
  const knobY = 125 + radius * Math.sin(progressAngleRad);
  const dailySessionTarget = Math.max(6, completedBouts + 1);

  return (
    <div className="w-full space-y-6 pb-12 font-sans">
      {/* ========================================================
          1. TOP PAGE HEADER
          ======================================================== */}
      <div>
        <h1 className="font-heading font-extrabold text-2xl sm:text-3xl text-[#1D3127] tracking-tight">
          Workstation Belajar &amp; Jeda
        </h1>
        <p className="text-xs sm:text-sm text-[#636B60] mt-1">
          Fokus menyelesaikan satu tugas dalam satu waktu, diselingi jeda restoratif ergonomis.
        </p>
      </div>

      {/* ========================================================
          2. MAIN FOCUS WORKSTATION CARD
          ======================================================== */}
      <div className="relative overflow-hidden rounded-[2rem] p-6 sm:p-8 border border-[#C9D6C0] bg-gradient-to-br from-[#DCE5D5] via-[#D6E1CE] to-[#CBD8C2] shadow-[0_10px_30px_-10px_rgba(47,58,46,0.12)] space-y-7">
        {/* Decorative Soft Layered Waves (Bottom Background) */}
        <svg
          aria-hidden="true"
          viewBox="0 0 900 220"
          preserveAspectRatio="none"
          className="pointer-events-none select-none absolute inset-x-0 bottom-0 w-full h-44 sm:h-52 z-0"
        >
          <path
            d="M0,105 C210,55 420,145 660,95 C760,74 840,85 900,102 L900,220 L0,220 Z"
            fill="#EFF4EB"
            fillOpacity="0.45"
          />
          <path
            d="M0,150 C240,115 470,180 720,138 C800,124 860,130 900,140 L900,220 L0,220 Z"
            fill="#B7C9AD"
            fillOpacity="0.32"
          />
        </svg>

        {/* Upper Two-Column Hero Section: Circular Timer + Controls */}
        <div className="relative z-10 flex flex-col lg:flex-row items-center gap-7 lg:gap-10">
          {/* LEFT: Circular Countdown Progress Disc */}
          <div className="relative w-64 h-64 sm:w-[272px] sm:h-[272px] shrink-0 rounded-full bg-[#FCFBF8] shadow-[0_14px_34px_-10px_rgba(47,58,46,0.16)] p-2 flex items-center justify-center">
            <svg
              className="w-full h-full select-none pointer-events-none"
              viewBox="0 0 250 250"
            >
              <circle
                cx="125"
                cy="125"
                r={radius}
                fill="none"
                stroke="#E7E2D8"
                strokeWidth="12"
              />
              <circle
                cx="125"
                cy="125"
                r={radius}
                fill="none"
                stroke="#243B2E"
                strokeWidth="12"
                strokeLinecap="round"
                strokeDasharray={circumference}
                strokeDashoffset={strokeDashoffset}
                transform="rotate(-90 125 125)"
                className="transition-all duration-500 ease-linear"
              />
              {/* Endpoint Amber Progress Knob */}
              <circle
                cx={knobX}
                cy={knobY}
                r="7.5"
                fill="#E8A92B"
                stroke="#FCFBF8"
                strokeWidth="3.5"
                className="transition-all duration-500 ease-linear"
              />
            </svg>

            {/* Inner Center Display */}
            <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-6 select-none">
              <span className="text-[11px] font-bold uppercase tracking-[0.14em] text-[#6B766A]">
                Sisa Waktu
              </span>
              <span className="font-heading font-extrabold text-5xl sm:text-[3.35rem] text-[#1D3127] tracking-tight tabular-nums leading-none mt-2">
                {formatTimer(secondsRemaining)}
              </span>
            </div>
          </div>

          {/* RIGHT: Session Header, Presets, Action Controls & Daily Dots */}
          <div className="flex-1 min-w-0 w-full flex flex-col items-center lg:items-start text-center lg:text-left space-y-4">
            <div className="space-y-1.5">
              <span className="font-heading text-xs font-bold tracking-[0.1em] text-[#4C5C4E] uppercase block">
                SESI FOKUS KE-{completedBouts + 1}
              </span>
              <h2 className="font-heading font-extrabold text-2xl sm:text-[1.75rem] text-[#1D3127] leading-snug tracking-tight max-w-xl">
                {activeTask ? activeTask.text : "Tetap di sini, satu langkah lagi."}
              </h2>
            </div>

            {/* Preset Duration Switcher */}
            <div className="inline-flex flex-wrap items-center justify-center lg:justify-start gap-1 bg-[#F9F7F3]/95 p-1.5 rounded-full border border-white/85 shadow-2xs">
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
                className={`px-4 py-1.5 rounded-full text-xs transition-all cursor-pointer ${
                  sessionDurationMins === 0.25
                    ? "bg-[#CFDACA] text-[#1D3127] font-extrabold shadow-2xs"
                    : "text-[#526053] hover:text-[#1D3127] font-semibold"
                }`}
                title="Klik lalu pindah ke tab/aplikasi lain. Dalam 15 detik layar otomatis ditarik kembali ke sini."
              >
                15 detik (Uji OS Lock)
              </button>
              <button
                type="button"
                onClick={() => handleSelectPreset(25)}
                className={`px-4 py-1.5 rounded-full text-xs transition-all cursor-pointer ${
                  sessionDurationMins === 25
                    ? "bg-[#CFDACA] text-[#1D3127] font-extrabold shadow-2xs"
                    : "text-[#526053] hover:text-[#1D3127] font-semibold"
                }`}
              >
                25 menit
              </button>
              <button
                type="button"
                onClick={() => handleSelectPreset(50)}
                className={`px-4 py-1.5 rounded-full text-xs transition-all cursor-pointer ${
                  sessionDurationMins === 50
                    ? "bg-[#CFDACA] text-[#1D3127] font-extrabold shadow-2xs"
                    : "text-[#526053] hover:text-[#1D3127] font-semibold"
                }`}
              >
                50 menit
              </button>
            </div>

            {/* Action Control Buttons */}
            <div className="flex items-center justify-center lg:justify-start flex-wrap gap-2.5 pt-0.5">
              <button
                type="button"
                onClick={() => {
                  if (!isTimerRunning && secondsRemaining <= 0) {
                    setSecondsRemaining(Math.max(1, Math.round(sessionDurationMins * 60)));
                  }
                  setIsTimerRunning(!isTimerRunning);
                }}
                className="py-2.5 px-6 rounded-full bg-[#243B2E] hover:bg-[#1B2E23] text-white font-bold text-xs sm:text-sm transition-all shadow-sm active:scale-95 flex items-center gap-2 cursor-pointer"
              >
                {isTimerRunning ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                <span>
                  {isTimerRunning
                    ? "Jeda Sesi"
                    : secondsRemaining > 0 && secondsRemaining < totalSessionSeconds
                    ? "Lanjutkan Sesi"
                    : "Mulai Sesi"}
                </span>
              </button>
              <button
                type="button"
                onClick={handleResetTimer}
                className="py-2.5 px-5 rounded-full bg-[#FBF9F5] hover:bg-white text-[#1D3127] font-bold text-xs sm:text-sm transition-colors active:scale-95 flex items-center gap-2 border border-white/90 shadow-2xs cursor-pointer"
              >
                <RotateCcw className="w-4 h-4 text-[#4C5C4E]" />
                <span>Reset</span>
              </button>
              <button
                type="button"
                onClick={() =>
                  void osScreenLock.triggerLock(
                    "Sesi Jeda Aktif Dimulai — Selesaikan 3 Repetisi Peregangan"
                  )
                }
                className="py-2.5 px-5 rounded-full bg-[#E8DCD0] hover:bg-[#DFD0C0] text-[#2F3A2E] font-bold text-xs sm:text-sm transition-colors active:scale-95 flex items-center gap-2 border border-[#DDD0C1] shadow-2xs cursor-pointer"
                title="Kunci layar level OS sekarang dan mulai peregangan 2 menit dengan validasi MediaPipe on-device."
              >
                <ShieldCheck className="w-4 h-4 text-[#2F3A2E]" />
                <span>Mulai Jeda &amp; Kunci Layar</span>
              </button>
            </div>

            {/* Daily Session Progress Dots */}
            <div className="flex items-center gap-2.5 pt-1">
              <div className="flex items-center gap-1.5">
                {Array.from({ length: dailySessionTarget }).map((_, idx) => {
                  const isDone = idx < completedBouts;
                  const isCurrent = idx === completedBouts;
                  return (
                    <span
                      key={idx}
                      className={`w-2.5 h-2.5 rounded-full transition-all ${
                        isDone
                          ? "bg-[#243B2E]"
                          : isCurrent
                          ? "border-[1.5px] border-dashed border-[#4C6352]"
                          : "bg-[#B7C7AF]"
                      }`}
                    />
                  );
                })}
              </div>
              <span className="text-xs font-semibold text-[#47594A]">
                {completedBouts} dari {dailySessionTarget} sesi harian selesai
              </span>
            </div>
          </div>
        </div>

        {/* Study Soundscapes Embedded Card */}
        <div className="relative z-10 bg-[#FCFBF8]/95 backdrop-blur-xs rounded-[1.5rem] p-4 sm:p-5 border border-white/90 shadow-xs space-y-4">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={handleToggleAudio}
              className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all shrink-0 cursor-pointer ${
                isAudioPlaying
                  ? "bg-[#CFDACA] text-[#1D3127] shadow-2xs"
                  : "bg-[#FAF6F0] border border-[#E6DFD4] text-[#526053] hover:text-[#1D3127]"
              }`}
              title={isAudioPlaying ? "Hentikan Suara Ambience" : "Putar Suara Ambience"}
            >
              {isAudioPlaying ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
            </button>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-heading font-extrabold text-sm text-[#1D3127]">
                  Suara Ambience Belajar
                </span>
                {isAudioPlaying && (
                  <span className="flex items-center gap-0.5">
                    <span className="w-1 h-3 bg-[#4E8B57] rounded-full animate-pulse" />
                    <span className="w-1 h-4 bg-[#4E8B57] rounded-full animate-pulse delay-75" />
                    <span className="w-1 h-2 bg-[#4E8B57] rounded-full animate-pulse delay-150" />
                  </span>
                )}
              </div>
              <p className="text-xs text-[#636B60]">
                Audio sintesis lokal santai untuk meredam kebisingan sekitar.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2 flex-wrap">
              {[
                { key: "rain", label: "Hujan", icon: <CloudRain className="w-3.5 h-3.5" /> },
                { key: "alpha", label: "Gelombang 432Hz", icon: <Waves className="w-3.5 h-3.5" /> },
                { key: "white", label: "White Noise", icon: <AudioLines className="w-3.5 h-3.5" /> },
                { key: "cafe", label: "Kafe Kampus", icon: <Coffee className="w-3.5 h-3.5" /> },
              ].map((snd) => (
                <button
                  key={snd.key}
                  type="button"
                  onClick={() => handleChangeSoundType(snd.key as "rain" | "alpha" | "white" | "cafe")}
                  className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-full text-xs transition-all cursor-pointer ${
                    soundscapeType === snd.key
                      ? "bg-[#CFDACA] text-[#1D3127] border border-[#BDCBB7] shadow-2xs font-bold"
                      : "bg-white border border-[#E6DFD4] text-[#3B4A3E] hover:bg-[#FAF6F0] font-semibold"
                  }`}
                >
                  {snd.icon}
                  <span>{snd.label}</span>
                </button>
              ))}
            </div>

            {/* Volume slider + percentage */}
            <div className="flex items-center gap-2.5 pl-1">
              <input
                type="range"
                min="0.05"
                max="0.8"
                step="0.05"
                value={audioVolume}
                onChange={(e) => handleVolumeChange(parseFloat(e.target.value))}
                className="w-24 sm:w-28 accent-[#243B2E] h-1.5 bg-[#E6E0D6] rounded-full cursor-pointer"
                title={`Volume: ${Math.round(audioVolume * 100)}%`}
              />
              <span className="text-xs font-bold text-[#2F3A2E] tabular-nums w-9 text-right">
                {Math.round(audioVolume * 100)}%
              </span>
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
          {tasks.length === 0 ? (
            <div className="p-6 rounded-2xl bg-[#FAF6F0] border border-dashed border-[#E8DDCF] text-center space-y-1">
              <p className="text-xs font-bold text-[#2F3A2E]">Belum ada target tugas sesi ini</p>
              <p className="text-[11px] text-[#636B60]">
                Tambahkan tugas yang ingin kamu kerjakan melalui kolom di bawah sebelum memulai timer.
              </p>
            </div>
          ) : (
            tasks.map((task) => {
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
          }))}
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

            {/* MediaPipe Active Break Pose Component (skip if global OS Lock VisionGuard is already mounted) */}
            {!osLock.isLocked && (
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
            )}

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
