import React, { useState, useEffect, useRef } from "react";
import {
  X,
  Flame,
  Snowflake,
  Sparkles,
  GripHorizontal,
  Pencil,
  Check,
} from "lucide-react";
import {
  getMimiSvg,
  STAGE_MAP,
  STAGE_NAMES,
  STAGE_STARTS,
  STAGE_LOOKS,
  STAGE_BENEFITS,
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
  // 1. Persistent Pet State
  const [streak, setStreak] = useState<number>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) return JSON.parse(saved).streak ?? 6;
    } catch {}
    return 6;
  });

  const [questsDone, setQuestsDone] = useState<[boolean, boolean, boolean]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) return JSON.parse(saved).questsDone ?? [false, false, false];
    } catch {}
    return [false, false, false];
  });

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
  const [activeTab, setActiveTab] = useState<"stage" | "evolution">("stage");
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
      color: i % 2 ? "#F7A8B0" : "#FFF29A",
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
  const dayLabels = ["S", "M", "S", "R", "K", "J", "S"];

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
            <div className="absolute -top-12 left-1/2 -translate-x-1/2 whitespace-nowrap bg-white border border-[#E8E8E8] text-[#1A1A1A] font-extrabold text-[11px] px-3 py-1.5 rounded-2xl shadow-md pointer-events-none animate-in fade-in zoom-in-95 duration-200">
              <span className="flex items-center gap-1">
                <span>Halo! Ketuk {petName}</span>
                <span className="text-[#9A9A9A] text-[9px] font-normal">• Geser</span>
              </span>
              <div className="absolute left-1/2 -bottom-1.5 -translate-x-1/2 w-2.5 h-2.5 bg-white border-b border-r border-[#E8E8E8] rotate-45" />
            </div>
          )}

          {/* Draggable Pet Container Card */}
          <div className="relative group p-1.5 rounded-3xl bg-white/95 backdrop-blur-sm border-2 border-[#1A1A1A] shadow-card hover:shadow-cardHover transition-all flex flex-col items-center justify-center w-20 h-24">
            {/* Grip Drag Handle Pill */}
            <div className="w-6 h-1 rounded-full bg-[#E8E8E8] group-hover:bg-[#1A1A1A] mb-1 transition-colors" />

            {/* Mimi Animated SVG */}
            <div
              className={`w-14 h-14 ${isDragging ? "" : "animate-mimi-bob"}`}
              dangerouslySetInnerHTML={{
                __html: getMimiSvg(STAGE_MAP[st], currentMood, completedCount > 0 && st === 0),
              }}
            />

            {/* Streak Counter Flame Badge */}
            <div className="absolute -bottom-2 bg-[#FFF29A] text-[#1A1A1A] border-2 border-[#1A1A1A] px-2 py-0.5 rounded-full text-[10px] font-extrabold flex items-center gap-0.5 shadow-xs">
              <Flame className="w-3 h-3 fill-[#F9B99A] text-[#1A1A1A]" />
              <span>{streak}d</span>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================
          2. EXPANDED MIMI PET HUB MODAL (Dialog Penuh Interaktif)
          ======================================================== */}
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/40 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="w-full max-w-xl bg-white border-2 border-[#1A1A1A] rounded-[2.5rem] shadow-2xl overflow-hidden flex flex-col max-h-[92vh] animate-in zoom-in-95 duration-200">
            {/* Top Modal Header */}
            <div className="px-6 py-4 border-b border-[#F6F6F6] flex items-center justify-between bg-white shrink-0 gap-3">
              <div className="flex items-center gap-2.5 flex-1 min-w-0">
                <div className="w-9 h-9 rounded-2xl bg-[#CDE8B5] flex items-center justify-center text-[#1A1A1A] border border-[#B6DF97] shadow-xs shrink-0">
                  <Flame className="w-5 h-5 fill-[#F9B99A] text-[#1A1A1A]" />
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
                      className="px-2.5 py-1 text-xs sm:text-sm font-extrabold text-[#1A1A1A] bg-white border-2 border-[#1A1A1A] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#FFF29A] shadow-xs w-36 sm:w-48"
                    />
                    <button
                      type="submit"
                      className="w-7 h-7 flex items-center justify-center rounded-xl bg-[#CDE8B5] hover:bg-[#bce09f] text-[#1A1A1A] border border-[#1A1A1A] transition-colors"
                      title="Simpan Nama"
                      aria-label="Simpan Nama"
                    >
                      <Check className="w-3.5 h-3.5 stroke-[2.5]" />
                    </button>
                    <button
                      type="button"
                      onClick={handleCancelEditing}
                      className="w-7 h-7 flex items-center justify-center rounded-xl bg-[#F6F6F6] hover:bg-[#E8E8E8] text-[#1A1A1A] border border-[#E8E8E8] transition-colors"
                      title="Batal"
                      aria-label="Batal"
                    >
                      <X className="w-3.5 h-3.5 stroke-[2.5]" />
                    </button>
                  </form>
                ) : (
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <h3 className="font-heading font-extrabold text-base text-[#1A1A1A] truncate">
                        {petName} — Teman Streak
                      </h3>
                      <button
                        type="button"
                        onClick={handleStartEditing}
                        className="p-1 rounded-lg text-[#9A9A9A] hover:text-[#1A1A1A] hover:bg-[#F6F6F6] transition-colors inline-flex items-center gap-1 text-xs font-semibold"
                        title="Ganti nama pet"
                        aria-label="Ganti nama pet"
                      >
                        <Pencil className="w-3.5 h-3.5" />
                        <span className="hidden sm:inline text-[11px] text-[#9A9A9A]">Ganti</span>
                      </button>
                    </div>
                    <p className="text-[11px] text-[#9A9A9A] font-medium truncate">
                      Tumbuh bersama rutinitas sehat &amp; kebiasaan aktif Anda
                    </p>
                  </div>
                )}
              </div>

              {/* Close Button */}
              <button
                onClick={() => setIsOpen(false)}
                className="w-8 h-8 rounded-full bg-[#F6F6F6] hover:bg-[#E8E8E8] text-[#1A1A1A] flex items-center justify-center transition-colors focus:outline-none shrink-0"
                title="Tutup & Minimalkan ke Mascot Mengambang"
              >
                <X className="w-4 h-4 stroke-[2.5]" />
              </button>
            </div>

            {/* Scrollable Body Content */}
            <div className="flex-1 overflow-y-auto px-5 sm:px-6 py-4 space-y-4">
              {/* Navigation Tabs (Stage Pet vs Evolusi Sheet) */}
              <div className="flex items-center gap-1.5 p-1 bg-[#F6F6F6] rounded-2xl border border-[#E8E8E8] text-xs font-bold">
                <button
                  onClick={() => setActiveTab("stage")}
                  className={`flex-1 py-1.5 rounded-xl transition-all ${
                    activeTab === "stage"
                      ? "bg-white text-[#1A1A1A] shadow-xs"
                      : "text-[#9A9A9A] hover:text-[#1A1A1A]"
                  }`}
                >
                  Panggung {petName} &amp; Misi
                </button>
                <button
                  onClick={() => setActiveTab("evolution")}
                  className={`flex-1 py-1.5 rounded-xl transition-all ${
                    activeTab === "evolution"
                      ? "bg-white text-[#1A1A1A] shadow-xs"
                      : "text-[#9A9A9A] hover:text-[#1A1A1A]"
                  }`}
                >
                  Lembar Evolusi (5 Level)
                </button>
              </div>

              {activeTab === "stage" ? (
                <>
                  {/* Stage Arena (Pastel Mint Green #CDE8B5) */}
                  <div className="relative rounded-3xl bg-[#CDE8B5] p-5 sm:p-6 border border-[#B6DF97] overflow-hidden text-center text-[#1A1A1A] shadow-xs">
                    {/* Top Stat Pills */}
                    <div className="flex items-center justify-between gap-2 flex-wrap text-xs">
                      <div className="flex items-center gap-1.5 bg-white px-3 py-1.5 rounded-full font-bold shadow-xs">
                        <Flame className="w-4 h-4 fill-[#F9B99A] text-[#1A1A1A]" />
                        <span className="text-base font-extrabold">{streak}</span>
                        <span className="text-[11px] text-[#9A9A9A]">hari streak</span>
                      </div>

                      <div className="flex items-center gap-1.5">
                        <span className="bg-[#1A1A1A] text-white px-3 py-1.5 rounded-full font-extrabold text-[11px]">
                          Level {st + 1} &bull; {STAGE_NAMES[st]}
                        </span>
                        <span className="bg-white/70 px-2.5 py-1.5 rounded-full font-bold text-[11px] flex items-center gap-1">
                          <Snowflake className="w-3.5 h-3.5 text-blue-500" />
                          <span>{freeze} Freeze</span>
                        </span>
                      </div>
                    </div>

                    {/* Speech Bubble */}
                    <div className="relative bg-white rounded-2xl px-4 py-2.5 mt-4 mx-auto max-w-sm text-xs font-bold text-[#1A1A1A] shadow-xs min-h-[44px] flex items-center justify-center">
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

                    <div className="flex items-center justify-center gap-2 -mt-1 flex-wrap">
                      <p className="text-[11px] text-[#1A1A1A]/70 font-semibold">
                        Ketuk {petName} untuk menyapa &amp; lihat reaksinya!
                      </p>
                      <span className="text-[#1A1A1A]/30 text-xs">&bull;</span>
                      <button
                        type="button"
                        onClick={handleStartEditing}
                        className="inline-flex items-center gap-1 text-[11px] font-bold text-[#1A1A1A] hover:underline"
                        title="Ganti nama panggilan pet"
                      >
                        <Pencil className="w-3 h-3 text-[#1A1A1A]" />
                        <span>Ganti Nama</span>
                      </button>
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
                          className="h-full bg-[#1A1A1A] rounded-full transition-all duration-500"
                          style={{ width: `${progressPercent}%` }}
                        />
                      </div>
                    </div>

                    {/* 7-Day History Badges */}
                    <div className="grid grid-cols-7 gap-1.5 mt-4 pt-3 border-t border-black/10">
                      {dayLabels.map((lbl, i) => {
                        const isDoneDay = i <= completedCount;
                        return (
                          <div key={i} className="flex flex-col items-center gap-1">
                            <span className="text-[10px] font-bold text-[#1A1A1A]/60">
                              {lbl}
                            </span>
                            <div
                              className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-extrabold border ${
                                isDoneDay
                                  ? "bg-[#FFF29A] border-[#1A1A1A] text-[#1A1A1A] shadow-2xs"
                                  : "bg-white/50 border-dashed border-[#1A1A1A]/30 text-[#9A9A9A]"
                              }`}
                            >
                              {isDoneDay ? "✓" : ""}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Quests Section */}
                  <div className="space-y-2.5 pt-1">
                    <div className="flex items-center justify-between">
                      <h4 className="font-heading font-extrabold text-sm text-[#1A1A1A]">
                        Misi Sehat Hari Ini
                      </h4>
                      <span className="text-[11px] font-bold text-[#9A9A9A]">
                        {completedCount} dari 3 Selesai
                      </span>
                    </div>

                    <div className="space-y-2">
                      {questsData.map((q, i) => {
                        const isDone = questsDone[i];
                        return (
                          <button
                            key={i}
                            type="button"
                            onClick={() => handleQuestComplete(i)}
                            disabled={isDone}
                            className={`w-full p-3.5 rounded-2xl border text-left transition-all flex items-center gap-3 ${
                              isDone
                                ? "bg-[#BDE6F0] border-[#8ECAD7] text-[#1A1A1A]"
                                : "bg-[#FAFAFA] border-[#E8E8E8] hover:border-[#1A1A1A] text-[#1A1A1A]"
                            }`}
                          >
                            <div
                              className={`w-8 h-8 rounded-full border-2 flex items-center justify-center font-extrabold text-xs shrink-0 ${
                                isDone
                                  ? "bg-[#1A1A1A] text-[#BDE6F0] border-[#1A1A1A]"
                                  : "border-[#1A1A1A] text-transparent"
                              }`}
                            >
                              ✓
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-xs font-extrabold text-[#1A1A1A]">
                                {q.title}
                              </p>
                              <p
                                className={`text-[11px] leading-tight ${
                                   isDone ? "text-[#35505a]" : "text-[#9A9A9A]"
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
                  <div className="p-3.5 bg-[#F6F6F6] rounded-2xl border border-[#E8E8E8] space-y-2 text-xs">
                    <div className="flex items-center gap-1.5 text-[11px] font-bold text-[#9A9A9A]">
                      <Sparkles className="w-3.5 h-3.5 text-[#1A1A1A]" />
                      <span>Simulasi &amp; Kustomisasi Pet:</span>
                    </div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <button
                        onClick={handleStartEditing}
                        className="px-3 py-1.5 rounded-xl bg-white hover:bg-[#E8E8E8] text-[#1A1A1A] font-bold text-xs border border-[#E8E8E8] transition-colors flex items-center gap-1"
                        title="Ganti nama panggilan pet"
                      >
                        <Pencil className="w-3 h-3" />
                        <span>Ganti Nama</span>
                      </button>
                      <button
                        onClick={handleSimulateNextDay}
                        className="px-3 py-1.5 rounded-xl bg-[#FFF29A] hover:bg-[#FFE966] text-[#1A1A1A] font-bold text-xs border border-[#FFE966] transition-colors"
                      >
                        Simulasi Besok
                      </button>
                      <button
                        onClick={handleJumpNextLevel}
                        className="px-3 py-1.5 rounded-xl bg-white hover:bg-[#E8E8E8] text-[#1A1A1A] font-bold text-xs border border-[#E8E8E8] transition-colors"
                      >
                        Loncat Level Berikutnya
                      </button>
                      <button
                        onClick={handleResetPet}
                        className="px-3 py-1.5 rounded-xl bg-white hover:bg-rose-50 text-rose-600 font-bold text-xs border border-[#E8E8E8] transition-colors ml-auto"
                      >
                        Mulai Ulang
                      </button>
                    </div>
                  </div>
                </>
              ) : (
                /* Tab 2: Evolution Sheet */
                <div className="space-y-3 pb-2">
                  <div className="bg-[#FFFCEB] border border-[#FFE966] rounded-2xl p-3 text-xs text-[#1A1A1A]">
                    <p className="font-bold">5 Tingkat Transformasi {petName}</p>
                    <p className="text-[11px] text-[#9A9A9A] mt-0.5">
                      {petName} bertransformasi seiring konsistensi hari Anda menjaga postur tegak dan kebugaran aktif.
                    </p>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {STAGE_NAMES.map((name, i) => {
                      const isUnlocked = streak >= (STAGE_STARTS[i] || 0) || i === 0;
                      const isCurrent = i === st;
                      return (
                        <div
                          key={name}
                          className={`p-3.5 rounded-3xl border transition-all flex flex-col justify-between ${
                            isCurrent
                              ? "bg-white border-2 border-[#1A1A1A] shadow-md"
                              : isUnlocked
                              ? "bg-white border-[#E8E8E8]"
                              : "bg-[#FAFAFA] border-[#E8E8E8] opacity-60"
                          }`}
                        >
                          <div className="flex items-start gap-3">
                            <div className="w-16 h-16 rounded-2xl bg-[#FFF29A] p-1 flex items-center justify-center shrink-0 border border-[#FFE966]">
                              <div
                                className="w-full h-full"
                                dangerouslySetInnerHTML={{
                                  __html: getMimiSvg(STAGE_MAP[i], "happy", false),
                                }}
                              />
                            </div>
                            <div>
                              <div className="flex items-center gap-1.5">
                                <span className="text-[10px] font-bold uppercase text-[#9A9A9A]">
                                  Level {i + 1}
                                </span>
                                {isCurrent && (
                                  <span className="text-[9px] font-extrabold bg-[#1A1A1A] text-white px-2 py-0.2 rounded-full">
                                    Aktif
                                  </span>
                                )}
                              </div>
                              <h5 className="font-heading font-extrabold text-sm text-[#1A1A1A]">
                                {name}
                              </h5>
                              <p className="text-[10px] font-bold text-[#9A9A9A]">
                                {i === 0 ? "Awal Mulai" : `Hari ke-${STAGE_STARTS[i]}`}
                                {isUnlocked ? " &bull; Terbuka" : " &bull; Terkunci"}
                              </p>
                            </div>
                          </div>

                          <div className="mt-2.5 pt-2 border-t border-[#F6F6F6] text-[11px] text-[#1A1A1A]/80 font-medium space-y-1">
                            <p className="text-[#9A9A9A] text-[10px]">{STAGE_LOOKS[i]}</p>
                            <p className="font-bold text-xs text-[#1A1A1A]">🎁 {STAGE_BENEFITS[i]}</p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>

            {/* Bottom Modal Footer with Drag Tip */}
            <div className="px-6 py-3 border-t border-[#F6F6F6] bg-[#FAFAFA] flex items-center justify-between text-xs text-[#9A9A9A] shrink-0">
              <span className="flex items-center gap-1.5 text-[11px] font-medium">
                <GripHorizontal className="w-3.5 h-3.5" />
                <span>{petName} mengambang &bull; Geser ke posisi mana pun di layar</span>
              </span>
              <button
                onClick={() => setIsOpen(false)}
                className="px-4 py-1.5 rounded-full bg-[#1A1A1A] hover:bg-black text-white font-bold text-xs transition-colors"
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
