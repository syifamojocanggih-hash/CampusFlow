import React, { useState, useEffect, useRef, useCallback, useMemo } from "react";
import {
  X,
  Flame,
  Snowflake,
  GripHorizontal,
  Pencil,
  Check,
} from "lucide-react";
import { api } from "@/lib/api";
import {
  getMimiSvg,
  STAGE_MAP,
  STAGE_NAMES,
  STAGE_STARTS,
  PET_CHATS,
  PetMood,
} from "./mimiSvg";

interface Particle {
  id: number;
  char: string;
  x: number;
  y: number;
  color: string;
}

const STORAGE_KEY = "campusflow_mimi_pet_state";
const POS_KEY = "campusflow_mimi_pos";

export const MimiPetWidget: React.FC = () => {
  // 1. Persistent Pet State (Starts at 0 for fresh accounts, synced live from MySQL)
  const [streak, setStreak] = useState<number>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved && typeof JSON.parse(saved).streak === "number") {
        return JSON.parse(saved).streak;
      }
    } catch {}
    return 0;
  });

  const [questsDone, setQuestsDone] = useState<[boolean, boolean, boolean]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) return JSON.parse(saved).questsDone ?? [false, false, false];
    } catch {}
    return [false, false, false];
  });

  const [autoVerified, setAutoVerified] = useState<[boolean, boolean, boolean]>([false, false, false]);
  const [completedHistoryDates, setCompletedHistoryDates] = useState<Set<string>>(new Set());

  const [freeze, setFreeze] = useState<number>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) return JSON.parse(saved).freeze ?? 1;
    } catch {}
    return 1;
  });

  const [petName, setPetName] = useState<string>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.petName && typeof parsed.petName === "string" && parsed.petName.trim()) {
          return parsed.petName.trim().slice(0, 20);
        }
      }
    } catch {}
    return "Mimi";
  });

  const [isEditingName, setIsEditingName] = useState<boolean>(false);
  const [tempName, setTempName] = useState<string>("");

  const [isBroken, setIsBroken] = useState<boolean>(false);
  const [note, setNote] = useState<string>("");
  const [mood, setMood] = useState<PetMood | null>(null);
  const [animClass, setAnimClass] = useState<string>("");
  const [particles, setParticles] = useState<Particle[]>([]);

  // 2. UI View State
  const [isOpen, setIsOpen] = useState(false);
  const [showTooltip, setShowTooltip] = useState(true);

  // 3. Draggable Position State
  const [position, setPosition] = useState<{ x: number; y: number }>(() => {
    try {
      const saved = localStorage.getItem(POS_KEY);
      if (saved) return JSON.parse(saved);
    } catch {}
    // Default position: bottom-right
    const w = typeof window !== "undefined" ? window.innerWidth : 1024;
    const h = typeof window !== "undefined" ? window.innerHeight : 768;
    return { x: Math.max(16, w - 110), y: Math.max(100, h - 210) };
  });

  const [isDragging, setIsDragging] = useState(false);
  const dragStartRef = useRef<{ startX: number; startY: number; initX: number; initY: number; moved: boolean }>({
    startX: 0,
    startY: 0,
    initX: 0,
    initY: 0,
    moved: false,
  });

  // Save pet state to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({ streak, questsDone, freeze, petName })
      );
    } catch {}
  }, [streak, questsDone, freeze, petName]);

  // Save position to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(POS_KEY, JSON.stringify(position));
    } catch {}
  }, [position]);

  // Window resize bounds check
  useEffect(() => {
    const handleResize = () => {
      setPosition((prev) => ({
        x: Math.max(12, Math.min(window.innerWidth - 100, prev.x)),
        y: Math.max(70, Math.min(window.innerHeight - 120, prev.y)),
      }));
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // Auto-sync missions and streak with backend API & local sensor status
  const syncWithBackend = useCallback(async () => {
    try {
      const todayIso = new Date().toISOString().slice(0, 10);
      let isBreakComplete = false;
      let isCheckinComplete = false;
      let isMovementComplete = false;
      let backendStreak = 0;

      // 0. Primary: Fetch unified daily summary from backend MySQL API
      try {
        const dailySummaryRes = await api.getDailySummary();
        const d = dailySummaryRes?.data;
        if (d) {
          if (typeof d.user?.currentStreakDays === "number" && d.user.currentStreakDays > 0) {
            backendStreak = d.user.currentStreakDays;
          }
          if ((d.activeBreaks?.verifiedCount ?? 0) > 0 || (d.burnout?.verifiedBreakCount ?? 0) > 0) {
            isBreakComplete = true;
          }
          if (Boolean(d.wellbeing?.checkedInToday)) {
            isCheckinComplete = true;
          }
          if ((d.activity?.steps ?? 0) >= 3000 || (d.activity?.mvpaMinutes ?? 0) >= 30) {
            isMovementComplete = true;
          }
        }
      } catch {}

      // Fallback: Individual service calls if any mission is still not detected
      const breaksPromise = !isBreakComplete ? api.getTodayActiveBreaks().catch(() => null) : null;
      const wellbeingPromise = !isCheckinComplete ? api.getTodayWellbeing().catch(() => null) : null;
      const activitiesPromise = !isMovementComplete ? api.getPhysicalActivities(7).catch(() => null) : null;
      const triadPromise = api.getTriadDashboard(7).catch(() => null);

      const [breaksRes, wellbeingRes, activitiesRes, triadRes] = await Promise.all([
        breaksPromise,
        wellbeingPromise,
        activitiesPromise,
        triadPromise,
      ]);

      // 1. Istirahat mata 20-20-20 (Verified Active Breaks >= 1)
      if (!isBreakComplete) {
        const verifiedBreaks = breaksRes?.data?.verifiedCount ?? 0;
        let localBreaks = 0;
        try {
          const savedBreaks = localStorage.getItem("campusflow_verified_breaks");
          if (savedBreaks) localBreaks = Number(savedBreaks) || 0;
        } catch {}
        isBreakComplete = verifiedBreaks >= 1 || localBreaks >= 1;
      }

      // 2. Check-in PSS & Relaksasi
      if (!isCheckinComplete) {
        let localCheckin = false;
        try {
          const savedCheckin = localStorage.getItem("campusflow_last_checkin_date");
          if (savedCheckin === todayIso) localCheckin = true;
        } catch {}
        isCheckinComplete = Boolean(wellbeingRes?.data?.checkedInToday) || localCheckin;
      }

      // 3. Gerak aktif 30 menit (Physical activity duration >= 30m or steps >= 3000 or MVPA >= 30)
      if (!isMovementComplete) {
        const rawItems = Array.isArray(activitiesRes?.data?.items)
          ? (activitiesRes.data.items as Array<{ activityDate?: string; durationMinutes?: number; stepsCount?: number }>)
          : [];
        const todayActivities = rawItems.filter((it) =>
          String(it.activityDate || "").startsWith(todayIso)
        );
        const totalActivityMins = todayActivities.reduce(
          (acc: number, it) => acc + (Number(it.durationMinutes) || 0),
          0
        );
        const totalSteps = todayActivities.reduce(
          (acc: number, it) => acc + (Number(it.stepsCount) || 0),
          0
        );
        const triadMvpa = triadRes?.data?.today?.totalMvpaMinutes ?? 0;

        let localSteps = 0;
        try {
          const savedSteps = localStorage.getItem("campusflow_pedometer_steps");
          if (savedSteps) localSteps = Number(savedSteps) || 0;
        } catch {}

        isMovementComplete =
          totalActivityMins >= 30 || totalSteps >= 3000 || triadMvpa >= 30 || localSteps >= 3000;
      }

      // Update streak from backend if available
      if (backendStreak === 0 && typeof triadRes?.data?.weeklySummary?.currentStreakDays === "number") {
        const tStreak = triadRes.data.weeklySummary.currentStreakDays;
        if (tStreak > 0) backendStreak = tStreak;
      }
      if (backendStreak > 0) {
        setStreak(backendStreak);
      }

      // Update 7-day completed history dates
      if (Array.isArray(triadRes?.data?.history)) {
        const dates = new Set<string>();
        for (const h of triadRes.data.history) {
          if (h.logDate) dates.add(h.logDate.slice(0, 10));
        }
        setCompletedHistoryDates(dates);
      }

      setAutoVerified([isMovementComplete, isBreakComplete, isCheckinComplete]);

      setQuestsDone((prev) => {
        const next: [boolean, boolean, boolean] = [
          prev[0] || isMovementComplete,
          prev[1] || isBreakComplete,
          prev[2] || isCheckinComplete,
        ];
        if (next[0] !== prev[0] || next[1] !== prev[1] || next[2] !== prev[2]) {
          return next;
        }
        return prev;
      });
    } catch (err) {
      console.warn("[MimiPetWidget] Auto-sync error:", err);
    }
  }, []);

  // Event listeners for real-time automatic quest completions
  useEffect(() => {
    void syncWithBackend();

    const handleBreakDone = () => {
      setAutoVerified((prev) => [prev[0], true, prev[2]]);
      setQuestsDone((prev) => [prev[0], true, prev[2]]);
      void syncWithBackend();
    };

    const handleCheckinDone = () => {
      setAutoVerified((prev) => [prev[0], prev[1], true]);
      setQuestsDone((prev) => [prev[0], prev[1], true]);
      void syncWithBackend();
    };

    const handleActivityDone = () => {
      void syncWithBackend();
    };

    window.addEventListener("campusflow:active-break-completed", handleBreakDone);
    window.addEventListener("campusflow:wellbeing-submitted", handleCheckinDone);
    window.addEventListener("campusflow:activity-logged", handleActivityDone);
    window.addEventListener("focus", syncWithBackend);

    const intervalId = setInterval(syncWithBackend, 15000);

    return () => {
      window.removeEventListener("campusflow:active-break-completed", handleBreakDone);
      window.removeEventListener("campusflow:wellbeing-submitted", handleCheckinDone);
      window.removeEventListener("campusflow:activity-logged", handleActivityDone);
      window.removeEventListener("focus", syncWithBackend);
      clearInterval(intervalId);
    };
  }, [syncWithBackend]);

  // Re-sync whenever the pet modal is opened
  useEffect(() => {
    if (isOpen) {
      void syncWithBackend();
    }
  }, [isOpen, syncWithBackend]);

  // Compute stage
  const getStageIndex = (n: number) => {
    if (n >= 100) return 4;
    if (n >= 50) return 3;
    if (n >= 20) return 2;
    if (n >= 10) return 1;
    return 0;
  };

  const st = getStageIndex(streak);
  const completedCount = questsDone.filter(Boolean).length;
  const isAllQuestsDone = completedCount === 3;

  const currentMood: PetMood =
    mood || (isBroken ? "sad" : isAllQuestsDone ? "excited" : completedCount === 0 ? "sleepy" : "happy");

  const bubbleText = () => {
    if (note) return note;
    if (isBroken) return `Streakmu terputus. Tidak apa-apa, ${petName} siap tanam lagi dari biji.`;
    if (isAllQuestsDone) return `Streak aman hari ini! ${petName} senang sekali belajar bareng kamu.`;
    if (completedCount === 0) {
      return st === 0
        ? `Aku ${petName}, masih biji kecil. Siram aku dengan langkah gerakmu ya!`
        : `${petName} haus semangat nih! Selesaikan satu misi kecil dulu yuk?`;
    }
    return `Tinggal ${3 - completedCount} misi lagi untuk menjaga streak hari ini.`;
  };

  // Custom Pet Name Handlers
  const handleStartEditing = () => {
    setTempName(petName);
    setIsEditingName(true);
  };

  const handleSaveName = () => {
    const trimmed = tempName.trim();
    const finalName = trimmed ? trimmed.slice(0, 20) : "Mimi";
    setPetName(finalName);
    setIsEditingName(false);
    setMood("excited");
    setNote(`Nama baruku sekarang ${finalName}! Aku suka banget. Makasih ya!`);
    triggerParticles(["♥", "✦", "✨"], 8);
    setAnimClass("animate-mimi-pop");
    setTimeout(() => setAnimClass(""), 600);
    setTimeout(() => {
      setMood(null);
      setNote("");
    }, 3200);
  };

  const handleCancelEditing = () => {
    setIsEditingName(false);
    setTempName("");
  };

  // Trigger floating particles
  const triggerParticles = (list: string[], count = 6) => {
    const newItems: Particle[] = Array.from({ length: count }).map((_, i) => ({
      id: Date.now() + Math.random(),
      char: list[i % list.length],
      x: 30 + Math.random() * 40,
      y: 40 + Math.random() * 25,
      color: i % 2 ? "#F2D3D1" : "#E7DCCF",
    }));

    setParticles((prev) => [...prev, ...newItems]);
    setTimeout(() => {
      setParticles((prev) => prev.filter((p) => !newItems.some((n) => n.id === p.id)));
    }, 1100);
  };

  // Tap interaction
  const handlePetTap = () => {
    setMood("excited");
    const randomChat = PET_CHATS[Math.floor(Math.random() * PET_CHATS.length)];
    setNote(randomChat);
    triggerParticles(["♥", "✦"], 6);

    setAnimClass("animate-mimi-pop");
    setTimeout(() => setAnimClass(""), 600);

    setTimeout(() => {
      setMood(null);
      setNote("");
    }, 2400);
  };

  // Complete a quest
  const handleQuestComplete = (idx: number) => {
    if (questsDone[idx]) return;

    const nextQuests = [...questsDone] as [boolean, boolean, boolean];
    nextQuests[idx] = true;
    setQuestsDone(nextQuests);
    setIsBroken(false);

    const newDoneCount = nextQuests.filter(Boolean).length;

    if (newDoneCount === 3) {
      const prevStage = getStageIndex(streak);
      const nextStreak = streak + 1;
      const nextStage = getStageIndex(nextStreak);
      setStreak(nextStreak);

      if (nextStage > prevStage) {
        setNote(`Hore! ${petName} tumbuh jadi ${STAGE_NAMES[nextStage]}! Makasih sudah konsisten.`);
        setAnimClass("animate-mimi-lvl");
        setTimeout(() => setAnimClass(""), 1100);
      } else {
        setNote(`Streak ${nextStreak} hari tercapai! Sampai ketemu besok ya.`);
        setAnimClass("animate-mimi-pop");
        setTimeout(() => setAnimClass(""), 600);
      }

      if (nextStreak === 20) {
        setFreeze((f) => f + 1);
        setNote((prev) => prev + " Kamu dapat bonus 1 Streak Freeze!");
      }

      triggerParticles(["♥", "✦", "🎉"], 10);
    } else {
      setNote(`Hebat! Tinggal ${3 - newDoneCount} misi lagi.`);
      triggerParticles(["✦"], 4);
      setAnimClass("animate-mimi-pop");
      setTimeout(() => setAnimClass(""), 500);
    }
  };

  // Demo Controls
  const handleSimulateNextDay = () => {
    if (isAllQuestsDone) {
      setNote("Hari baru! Ayo jaga streak-nya.");
    } else if (streak > 0) {
      if (freeze > 0) {
        setFreeze((f) => f - 1);
        setNote("Streak Freeze terpakai untuk melindungi streak! Besok jangan bolong ya.");
      } else {
        setStreak(0);
        setIsBroken(true);
        setNote(`Streak terputus. ${petName} kembali jadi biji, tapi jangan patah semangat!`);
      }
    }
    setQuestsDone([false, false, false]);
  };

  const handleResetPet = () => {
    setStreak(0);
    setQuestsDone([false, false, false]);
    setFreeze(0);
    setIsBroken(false);
    setNote(`${petName} kembali tertidur sebagai biji kecil. Ayo mulai streak baru!`);
    setMood(null);
  };

  const handleJumpNextLevel = () => {
    const curStage = getStageIndex(streak);
    const nextStart = STAGE_STARTS[curStage + 1];
    if (!nextStart) {
      setNote(`${petName} sudah di tingkat tertinggi Legenda!`);
      return;
    }
    setStreak(nextStart);
    setQuestsDone([false, false, false]);
    setIsBroken(false);
    setNote(`${petName} berhasil berevolusi menjadi ${STAGE_NAMES[curStage + 1]}!`);
    triggerParticles(["♥", "✦", "👑"], 12);
    setAnimClass("animate-mimi-lvl");
    setTimeout(() => setAnimClass(""), 1100);
  };

  // 4. Pointer Events for Smooth Dragging
  const handlePointerDown = (e: React.PointerEvent) => {
    // Only drag with primary mouse button or touch
    if (e.button !== 0 && e.pointerType === "mouse") return;

    dragStartRef.current = {
      startX: e.clientX,
      startY: e.clientY,
      initX: position.x,
      initY: position.y,
      moved: false,
    };
    setIsDragging(true);

    const onPointerMove = (moveEv: PointerEvent) => {
      const dx = moveEv.clientX - dragStartRef.current.startX;
      const dy = moveEv.clientY - dragStartRef.current.startY;

      if (Math.abs(dx) > 6 || Math.abs(dy) > 6) {
        dragStartRef.current.moved = true;
      }

      const newX = Math.max(12, Math.min(window.innerWidth - 95, dragStartRef.current.initX + dx));
      const newY = Math.max(65, Math.min(window.innerHeight - 110, dragStartRef.current.initY + dy));

      setPosition({ x: newX, y: newY });
    };

    const onPointerUp = () => {
      window.removeEventListener("pointermove", onPointerMove);
      window.removeEventListener("pointerup", onPointerUp);
      setIsDragging(false);

      // If user did not drag, treat as click to open modal
      if (!dragStartRef.current.moved) {
        setIsOpen(true);
        setShowTooltip(false);
      }
    };

    window.addEventListener("pointermove", onPointerMove);
    window.addEventListener("pointerup", onPointerUp);
  };

  const questsData = [
    {
      title: "Gerak aktif 30 menit",
      desc: "Pedometer inersia kampus atau jeda peregangan",
    },
    {
      title: "Istirahat mata 20-20-20",
      desc: "Lihat objek 6 meter selama 20 detik via Vision Guard",
    },
    {
      title: "Check-in PSS & Relaksasi",
      desc: "Empat pertanyaan singkat tentang stres harian",
    },
  ];

  const nextThreshold = STAGE_STARTS[st + 1];
  const progressPercent = nextThreshold
    ? Math.min(100, Math.round((streak / nextThreshold) * 100))
    : 100;

  // Days of current week (Senin s.d Minggu)
  const weekDaysProgress = useMemo(() => {
    const now = new Date();
    // Monday is index 0, Sunday is index 6
    const currentDayOfWeek = (now.getDay() + 6) % 7;
    const monday = new Date(now);
    monday.setDate(now.getDate() - currentDayOfWeek);

    const labels = ["S", "M", "S", "R", "K", "J", "S"];
    const todayIso = now.toISOString().slice(0, 10);

    return labels.map((lbl, idx) => {
      const d = new Date(monday);
      d.setDate(monday.getDate() + idx);
      const dateIso = d.toISOString().slice(0, 10);
      const isToday = dateIso === todayIso;
      const isCompleted =
        completedHistoryDates.has(dateIso) || (isToday && completedCount > 0);
      return {
        label: lbl,
        dateIso,
        isToday,
        isCompleted,
      };
    });
  }, [completedHistoryDates, completedCount]);

  return (
    <>
      {/* ========================================================
          1. COMPACT DRAGGABLE FLOATING PET (Mengambang & Bisa Digeser)
          ======================================================== */}
      {!isOpen && (
        <div
          style={{
            transform: `translate3d(${position.x}px, ${position.y}px, 0)`,
            touchAction: "none",
          }}
          className={`fixed top-0 left-0 z-40 select-none transition-shadow ${
            isDragging ? "cursor-grabbing opacity-90 scale-105" : "cursor-grab"
          }`}
          onPointerDown={handlePointerDown}
          title={`Geser ${petName} ke mana saja di layar, atau klik untuk buka Misi Streak`}
          aria-label={`Pet ${petName} Mengambang`}
        >
          {/* Floating Speech Bubble Tooltip */}
          {showTooltip && (
            <div className="absolute -top-12 left-1/2 -translate-x-1/2 whitespace-nowrap bg-white border border-[#E8DDCF] text-[#2F3A2E] font-extrabold text-[11px] px-3 py-1.5 rounded-2xl shadow-md pointer-events-none animate-in fade-in zoom-in-95 duration-200">
              <span className="flex items-center gap-1">
                <span>Hai! apa kabar hari ini?</span>
              </span>
              <div className="absolute left-1/2 -bottom-1.5 -translate-x-1/2 w-2.5 h-2.5 bg-white border-b border-r border-[#E8DDCF] rotate-45" />
            </div>
          )}

          {/* Draggable Pet Container - Borderless, Large Pet Icon + Streak Below */}
          <div className="relative group flex flex-col items-center justify-center p-1 transition-transform duration-200 hover:scale-105">
            {/* Mimi Animated SVG - Large Pet Icon */}
            <div
              className={`w-20 h-20 sm:w-22 sm:h-22 drop-shadow-md select-none pointer-events-none ${
                isDragging ? "" : "animate-mimi-bob"
              }`}
              dangerouslySetInnerHTML={{
                __html: getMimiSvg(STAGE_MAP[st], currentMood, completedCount > 0 && st === 0),
              }}
            />

            {/* Streak Counter Beneath Pet (Clean & Stroke-free) */}
            <div className="mt-1 bg-[#E8DDCF] text-[#2F3A2E] px-2.5 py-0.5 rounded-full text-[11px] font-extrabold flex items-center gap-1 shadow-xs select-none">
              <Flame className="w-3.5 h-3.5 fill-[#F2D3D1] text-[#2F3A2E]" />
              <span>{streak} Hari</span>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================
          2. EXPANDED MIMI PET HUB MODAL (Dialog Penuh Interaktif)
          ======================================================== */}
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/40 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="w-full max-w-xl bg-white border-2 border-[#4A3B2C] rounded-[2.5rem] shadow-2xl overflow-hidden flex flex-col max-h-[92vh] animate-in zoom-in-95 duration-200">
            {/* Top Modal Header */}
            <div className="px-6 py-4 border-b border-[#E8DDCF] flex items-center justify-between bg-white shrink-0 gap-3">
              <div className="flex items-center gap-2.5 flex-1 min-w-0">
                <div className="w-9 h-9 rounded-2xl bg-[#E8DDCF] flex items-center justify-center text-[#2F3A2E] border border-[#CFD8C4] shadow-xs shrink-0">
                  <Flame className="w-5 h-5 fill-[#F2D3D1] text-[#2F3A2E]" />
                </div>
                {isEditingName ? (
                  <form
                    onSubmit={(e) => {
                      e.preventDefault();
                      handleSaveName();
                    }}
                    className="flex items-center gap-1.5 flex-wrap"
                  >
                    <input
                      type="text"
                      value={tempName}
                      onChange={(e) => setTempName(e.target.value)}
                      maxLength={20}
                      autoFocus
                      placeholder="Nama pet..."
                      className="px-2.5 py-1 text-xs sm:text-sm font-extrabold text-[#2F3A2E] bg-white border-2 border-[#4A3B2C] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#E8DDCF] shadow-xs w-36 sm:w-48"
                    />
                    <button
                      type="submit"
                      className="w-7 h-7 flex items-center justify-center rounded-xl bg-[#E8DDCF] hover:bg-[#CFD8C4] active:bg-[#CFD8C4] text-[#2F3A2E] border border-[#4A3B2C] transition-colors"
                      title="Simpan Nama"
                      aria-label="Simpan Nama"
                    >
                      <Check className="w-3.5 h-3.5 stroke-[2.5]" />
                    </button>
                    <button
                      type="button"
                      onClick={handleCancelEditing}
                      className="w-7 h-7 flex items-center justify-center rounded-xl bg-[#FAF6F0] hover:bg-[#CFD8C4] text-[#2F3A2E] border border-[#E8DDCF] transition-colors"
                      title="Batal"
                      aria-label="Batal"
                    >
                      <X className="w-3.5 h-3.5 stroke-[2.5]" />
                    </button>
                  </form>
                ) : (
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <h3 className="font-heading font-extrabold text-base text-[#2F3A2E] truncate">
                        {petName} — Teman Streak
                      </h3>
                      <button
                        type="button"
                        onClick={handleStartEditing}
                        className="p-1 rounded-lg text-[#636B60] hover:text-[#2F3A2E] hover:bg-[#FAF6F0] transition-colors inline-flex items-center gap-1 text-xs font-semibold"
                        title="Ganti nama pet"
                        aria-label="Ganti nama pet"
                      >
                        <Pencil className="w-3.5 h-3.5" />
                        <span className="hidden sm:inline text-[11px] text-[#636B60]">Ganti</span>
                      </button>
                    </div>
                    <p className="text-[11px] text-[#636B60] font-medium truncate">
                      Tumbuh bersama rutinitas sehat &amp; kebiasaan aktif Anda
                    </p>
                  </div>
                )}
              </div>

              {/* Close Button */}
              <button
                onClick={() => setIsOpen(false)}
                className="w-8 h-8 rounded-full bg-[#FAF6F0] hover:bg-[#CFD8C4] text-[#2F3A2E] flex items-center justify-center transition-colors focus:outline-none shrink-0"
                title="Tutup & Minimalkan ke Mascot Mengambang"
              >
                <X className="w-4 h-4 stroke-[2.5]" />
              </button>
            </div>

            {/* Scrollable Body Content */}
            <div className="flex-1 overflow-y-auto px-5 sm:px-6 py-4 space-y-4">
              {/* Stage Arena (Pastel Mint Green #C9DCE6) */}
              <div className="relative rounded-3xl bg-[#E8DDCF] p-5 sm:p-6 border border-[#CFD8C4] overflow-hidden text-center text-[#2F3A2E] shadow-xs">
                {/* Top Stat Pills */}
                <div className="flex items-center justify-between gap-2 flex-wrap text-xs">
                  <div className="flex items-center gap-1.5 bg-white px-3 py-1.5 rounded-full font-bold shadow-xs">
                    <Flame className="w-4 h-4 fill-[#F2D3D1] text-[#2F3A2E]" />
                    <span className="text-base font-extrabold">{streak}</span>
                    <span className="text-[11px] text-[#636B60]">hari streak</span>
                  </div>

                  <div className="flex items-center gap-1.5">
                    <span className="bg-white/70 px-2.5 py-1.5 rounded-full font-bold text-[11px] flex items-center gap-1">
                      <Snowflake className="w-3.5 h-3.5 text-blue-500" />
                      <span>{freeze} Freeze</span>
                    </span>
                  </div>
                </div>

                    {/* Speech Bubble */}
                    <div className="relative bg-white rounded-2xl px-4 py-2.5 mt-4 mx-auto max-w-sm text-xs font-bold text-[#2F3A2E] shadow-xs min-h-[44px] flex items-center justify-center">
                      <span>{bubbleText()}</span>
                      <div className="absolute left-1/2 -bottom-2 -translate-x-1/2 w-4 h-4 bg-white rotate-45 rounded-xs" />
                    </div>

                    {/* Main Interactive Mascot Pet */}
                    <div className="relative w-40 sm:w-48 h-40 sm:h-48 mx-auto mt-2">
                      <button
                        type="button"
                        onClick={handlePetTap}
                        className={`w-full h-full bg-transparent border-0 cursor-pointer focus:outline-none transition-transform active:scale-95 ${animClass}`}
                        title={`Ketuk ${petName} untuk menyapa!`}
                      >
                        <div
                          className="w-full h-full"
                          dangerouslySetInnerHTML={{
                            __html: getMimiSvg(
                              STAGE_MAP[st],
                              currentMood,
                              completedCount > 0 && st === 0
                            ),
                          }}
                        />
                      </button>

                      {/* Rising Particles */}
                      <div className="absolute inset-0 pointer-events-none">
                        {particles.map((p) => (
                          <span
                            key={p.id}
                            className="absolute font-extrabold text-lg animate-mimi-rise pointer-events-none"
                            style={{
                              left: `${p.x}%`,
                              top: `${p.y}%`,
                              color: p.color,
                            }}
                          >
                            {p.char}
                          </span>
                        ))}
                      </div>
                    </div>



                    {/* Progress to Next Level */}
                    <div className="mt-4 text-left space-y-1.5">
                      <div className="flex items-center justify-between text-[11px] font-bold">
                        <span>
                          {nextThreshold
                            ? `Menuju Level ${st + 2} (${STAGE_NAMES[st + 1]})`
                            : "Tingkat Tertinggi (Legenda)!"}
                        </span>
                        <span>{streak} / {nextThreshold || 100} hari</span>
                      </div>
                      <div className="h-3 rounded-full bg-white/60 p-0.5 overflow-hidden">
                        <div
                          className="h-full bg-[#CFD8C4] rounded-full transition-all duration-500"
                          style={{ width: `${progressPercent}%` }}
                        />
                      </div>
                    </div>

                    {/* 7-Day History Badges */}
                    <div className="grid grid-cols-7 gap-1.5 mt-4 pt-3 border-t border-black/10">
                      {weekDaysProgress.map((day, i) => {
                        return (
                          <div key={i} className="flex flex-col items-center gap-1">
                            <span className={`text-[10px] font-bold ${day.isToday ? "text-[#1D3127]" : "text-[#2F3A2E]/60"}`}>
                              {day.label}
                            </span>
                            <div
                              className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-extrabold border ${
                                day.isCompleted
                                  ? "bg-[#CFD8C4] border-[#4A3B2C] text-[#2F3A2E] shadow-2xs"
                                  : day.isToday
                                  ? "bg-white border-2 border-[#4A3B2C] text-[#2F3A2E]"
                                  : "bg-white/50 border-dashed border-[#4A3B2C]/30 text-[#636B60]"
                              }`}
                            >
                              {day.isCompleted ? "✓" : day.isToday ? "•" : ""}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Quests Section */}
                  <div className="space-y-2.5 pt-1">
                    <div className="flex items-center justify-between">
                      <h4 className="font-heading font-extrabold text-sm text-[#2F3A2E]">
                        Misi Sehat Hari Ini
                      </h4>
                      <span className="text-[11px] font-bold text-[#636B60]">
                        {completedCount} dari 3 Selesai
                      </span>
                    </div>

                    <div className="space-y-2">
                      {questsData.map((q, i) => {
                        const isDone = questsDone[i];
                        const isAuto = autoVerified[i];
                        return (
                          <button
                            key={i}
                            type="button"
                            onClick={() => handleQuestComplete(i)}
                            disabled={isDone}
                            className={`w-full p-3.5 rounded-2xl border text-left transition-all flex items-center gap-3 ${
                              isDone
                                ? "bg-[#CFD8C4] border-[#BCC8AE] text-[#2F3A2E]"
                                : "bg-[#FAF6F0] border-[#E8DDCF] hover:border-[#4A3B2C] text-[#2F3A2E]"
                            }`}
                          >
                            <div
                              className={`w-8 h-8 rounded-full border-2 flex items-center justify-center font-extrabold text-xs shrink-0 ${
                                isDone
                                  ? "bg-[#2F3A2E] text-white border-[#2F3A2E]"
                                  : "border-[#4A3B2C] text-transparent"
                              }`}
                            >
                              ✓
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center justify-between gap-2">
                                <p className="text-xs font-extrabold text-[#2F3A2E]">
                                  {q.title}
                                </p>
                                {isDone && (
                                  <span className="text-[10px] font-bold text-[#1D3127] bg-[#BCC8AE]/60 px-2 py-0.5 rounded-full border border-[#BCC8AE] shrink-0">
                                    {isAuto ? "Tersinkron Otomatis" : "Selesai"}
                                  </span>
                                )}
                              </div>
                              <p
                                className={`text-[11px] leading-tight mt-0.5 ${
                                   isDone ? "text-[#2F3A2E]/80" : "text-[#636B60]"
                                }`}
                              >
                                {q.desc}
                              </p>
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Demo Simulation Controls */}
                  <div className="p-3.5 bg-[#FAF6F0] rounded-2xl border border-[#E8DDCF] space-y-2 text-xs">
                    <div className="text-[11px] font-bold text-[#636B60]">
                      <span>Simulasi &amp; Kustomisasi Pet:</span>
                    </div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <button
                        onClick={handleStartEditing}
                        className="px-3 py-1.5 rounded-xl bg-white hover:bg-[#CFD8C4] text-[#2F3A2E] font-bold text-xs border border-[#E8DDCF] transition-colors flex items-center gap-1"
                        title="Ganti nama panggilan pet"
                      >
                        <Pencil className="w-3 h-3" />
                        <span>Ganti Nama</span>
                      </button>
                      <button
                        onClick={handleSimulateNextDay}
                        className="px-3 py-1.5 rounded-xl bg-[#E8DDCF] hover:bg-[#CFD8C4] active:bg-[#CFD8C4] text-[#2F3A2E] font-bold text-xs border border-[#E8DDCF] transition-colors"
                      >
                        Simulasi Besok
                      </button>
                      <button
                        onClick={handleJumpNextLevel}
                        className="px-3 py-1.5 rounded-xl bg-white hover:bg-[#CFD8C4] text-[#2F3A2E] font-bold text-xs border border-[#E8DDCF] transition-colors"
                      >
                        Loncat Level Berikutnya
                      </button>
                      <button
                        onClick={handleResetPet}
                        className="px-3 py-1.5 rounded-xl bg-white hover:bg-rose-50 text-rose-600 font-bold text-xs border border-[#E8DDCF] transition-colors ml-auto"
                      >
                        Mulai Ulang
                      </button>
                    </div>
                  </div>
            </div>

            {/* Bottom Modal Footer with Drag Tip */}
            <div className="px-6 py-3 border-t border-[#E8DDCF] bg-[#FAF6F0] flex items-center justify-between text-xs text-[#636B60] shrink-0">
              <span className="flex items-center gap-1.5 text-[11px] font-medium">
                <GripHorizontal className="w-3.5 h-3.5" />
                <span>{petName} mengambang &bull; Geser ke posisi mana pun di layar</span>
              </span>
              <button
                onClick={() => setIsOpen(false)}
                className="px-4 py-1.5 rounded-full bg-[#CFD8C4] hover:bg-[#BCC8AE] text-[#2F3A2E] border border-[#BCC8AE] font-bold text-xs transition-colors"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
