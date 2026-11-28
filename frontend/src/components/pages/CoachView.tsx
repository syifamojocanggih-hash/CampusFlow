import React, { useState, useEffect, useRef } from "react";
import {
  Heart,
  BookOpen,
  Monitor,
  Moon,
  ShieldCheck,
  ArrowRight,
  ArrowLeft,
  Clock,
  Sparkles,
  RotateCcw,
  Trash2,
  Plus,
  PanelLeft,
  MessageSquare,
  X,
} from "lucide-react";
import { api } from "@/lib/api";
import { screenTimeTracker } from "@/utils/screenTimeTracker";
import { useAutoSleep } from "@/utils/autoSleepTracker";

interface CoachViewProps {
  onNavigateToFocus?: () => void;
  onNavigateToActivity?: (subTab?: "pedometer" | "checkin") => void;
  onStartPanicRelief?: () => void;
}

interface ChatMessage {
  id: string;
  sender: "coach" | "user";
  text: string;
  recommendedMetsToday?: number;
  scientificCitationNote?: string;
  movementOptions?: string[];
  clarificationOptions?: Array<{ id: string; label: string }>;
  guidance?: string[];
  escalationFlag?: boolean;
}

interface RecommendationItem {
  id: string;
  icon: React.ReactNode;
  prompt: string;
}

const CHAT_RECOMMENDATIONS: RecommendationItem[] = [
  {
    id: "rec-1",
    icon: <BookOpen className="w-4 h-4 text-[#2F3A2E]" />,
    prompt: "Saya ingin bantuan terkait tugas dan beban kuliah",
  },
  {
    id: "rec-2",
    icon: <Clock className="w-4 h-4 text-[#2F3A2E]" />,
    prompt: "Saya ingin mengatur jadwal belajar dan istirahat seimbang",
  },
  {
    id: "rec-3",
    icon: <Monitor className="w-4 h-4 text-[#2F3A2E]" />,
    prompt: "Saya butuh saran peregangan leher dan mata lelah",
  },
  {
    id: "rec-4",
    icon: <Moon className="w-4 h-4 text-[#2F3A2E]" />,
    prompt: "Saya ingin memulihkan kualitas tidur malam ini",
  },
  {
    id: "rec-5",
    icon: <Sparkles className="w-4 h-4 text-[#2F3A2E]" />,
    prompt: "Saya butuh saran untuk menenangkan pikiran saat stres",
  },
];

interface CoachChatSession {
  id: string;
  title: string;
  updatedAt: string;
  messages: ChatMessage[];
}

const COACH_SESSIONS_STORAGE_KEY = "campusflow_coach_chat_history_v1";
const COACH_ACTIVE_SESSION_KEY = "campusflow_coach_active_session_v1";
const MAX_SAVED_SESSIONS = 20;

function loadStoredSessions(): CoachChatSession[] {
  try {
    const raw = localStorage.getItem(COACH_SESSIONS_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as CoachChatSession[]) : [];
  } catch {
    return [];
  }
}

function saveStoredSessions(sessions: CoachChatSession[]): void {
  try {
    localStorage.setItem(
      COACH_SESSIONS_STORAGE_KEY,
      JSON.stringify(sessions.slice(0, MAX_SAVED_SESSIONS))
    );
  } catch {
    // Ignore storage quota errors
  }
}

function createSessionId(): string {
  return `session-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
}

function deriveSessionTitle(msgs: ChatMessage[]): string {
  const firstUser = msgs.find((m) => m.sender === "user")?.text.trim();
  if (!firstUser) return "Obrolan AI Coach";
  return firstUser.length > 48 ? `${firstUser.slice(0, 48)}...` : firstUser;
}

function formatSessionDate(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  const months = ["Jan", "Feb", "Mar", "Apr", "Mei", "Jun", "Jul", "Agu", "Sep", "Okt", "Nov", "Des"];
  const hh = String(d.getHours()).padStart(2, "0");
  const mm = String(d.getMinutes()).padStart(2, "0");
  return `${d.getDate()} ${months[d.getMonth()]} · ${hh}.${mm}`;
}

function renderInlineBold(text: string): React.ReactNode[] {
  const parts = text.split(/(\*\*[^*]+\*\*)/g);
  return parts.map((part, i) => {
    if (part.startsWith("**") && part.endsWith("**") && part.length > 4) {
      return (
        <strong key={i} className="font-bold text-[#1D251C]">
          {part.slice(2, -2)}
        </strong>
      );
    }
    return <React.Fragment key={i}>{part.replace(/\*\*/g, "")}</React.Fragment>;
  });
}

function renderCoachFormattedText(rawText: string): React.ReactNode {
  // Rapikan item bernomor yang menempel di satu baris (mis. "... hari ini: 1. **Judul:** ... 2. **Judul:** ...")
  const normalized = rawText
    .replace(/\r\n/g, "\n")
    .replace(/([:.!?])\s+(\d+\.\s+)/g, "$1\n$2")
    .replace(/\n{3,}/g, "\n\n")
    .trim();

  const blocks = normalized.split(/\n+/);
  return (
    <div className="space-y-2 leading-relaxed">
      {blocks.map((block, idx) => {
        const trimmed = block.trim();
        if (!trimmed) return null;
        const isNumberedItem = /^\d+\.\s+/.test(trimmed);
        return (
          <p
            key={idx}
            className={isNumberedItem ? "pl-3 border-l-2 border-[#CFD8C4] py-0.5" : ""}
          >
            {renderInlineBold(trimmed)}
          </p>
        );
      })}
    </div>
  );
}

// In-memory cache + localStorage persistence so chat history survives tab switches & page reloads.
let cachedCoachMessages: ChatMessage[] = [];
let cachedIsFullChatMode = false;

export function resetCoachChatSession(): void {
  cachedCoachMessages = [];
  cachedIsFullChatMode = false;
  try {
    localStorage.removeItem(COACH_ACTIVE_SESSION_KEY);
  } catch {
    // Ignore
  }
}

export const CoachView: React.FC<CoachViewProps> = () => {
  const autoSleep = useAutoSleep();
  const [userName, setUserName] = useState<string>("Mahasiswa");
  const [totalSks, setTotalSks] = useState<number>(0);
  const [totalCourses, setTotalCourses] = useState<number>(0);
  const [hasExamWeek, setHasExamWeek] = useState<boolean>(false);
  const [verifiedBreakCount, setVerifiedBreakCount] = useState<number>(0);
  const [todayMvpaMinutes, setTodayMvpaMinutes] = useState<number>(0);
  const [todaySteps, setTodaySteps] = useState<number>(0);
  const [screenHours, setScreenHours] = useState<number>(() =>
    screenTimeTracker.getTodayScreenTimeHours()
  );
  const [inputText, setInputText] = useState<string>("");
  const [isTyping, setIsTyping] = useState<boolean>(false);
  const [sessions, setSessions] = useState<CoachChatSession[]>(() => loadStoredSessions());
  const [activeSessionId, setActiveSessionId] = useState<string>(() => {
    try {
      const savedId = localStorage.getItem(COACH_ACTIVE_SESSION_KEY);
      if (savedId) return savedId;
    } catch {
      // Ignore
    }
    return createSessionId();
  });
  const [showHistoryPanel, setShowHistoryPanel] = useState<boolean>(() =>
    typeof window !== "undefined" ? window.innerWidth >= 768 : true
  );
  const [messages, setMessages] = useState<ChatMessage[]>(() => {
    if (cachedCoachMessages.length > 0) return cachedCoachMessages;
    try {
      const savedId = localStorage.getItem(COACH_ACTIVE_SESSION_KEY);
      if (savedId) {
        const found = loadStoredSessions().find((s) => s.id === savedId);
        if (found && found.messages.length > 0) return found.messages;
      }
    } catch {
      // Ignore
    }
    return [];
  });
  const [isFullChatMode, setIsFullChatMode] = useState<boolean>(() => {
    if (cachedIsFullChatMode) return true;
    try {
      const savedId = localStorage.getItem(COACH_ACTIVE_SESSION_KEY);
      if (savedId) {
        const found = loadStoredSessions().find((s) => s.id === savedId);
        if (found && found.messages.length > 0) return true;
      }
    } catch {
      // Ignore
    }
    return false;
  });
  const chatEndRef = useRef<HTMLDivElement>(null);
  const typingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    cachedCoachMessages = messages;
    if (messages.length === 0) return;

    try {
      localStorage.setItem(COACH_ACTIVE_SESSION_KEY, activeSessionId);
    } catch {
      // Ignore
    }

    setSessions((prev) => {
      const nowIso = new Date().toISOString();
      const updatedSession: CoachChatSession = {
        id: activeSessionId,
        title: deriveSessionTitle(messages),
        updatedAt: nowIso,
        messages,
      };
      const others = prev.filter((s) => s.id !== activeSessionId);
      const next = [updatedSession, ...others].slice(0, MAX_SAVED_SESSIONS);
      saveStoredSessions(next);
      return next;
    });
  }, [messages, activeSessionId]);

  useEffect(() => {
    cachedIsFullChatMode = isFullChatMode;
  }, [isFullChatMode]);

  const sessionTimestampLabel = React.useMemo(() => {
    const now = new Date();
    const months = [
      "JANUARI", "FEBRUARI", "MARET", "APRIL", "MEI", "JUNI",
      "JULI", "AGUSTUS", "SEPTEMBER", "OKTOBER", "NOVEMBER", "DESEMBER",
    ];
    const hh = String(now.getHours()).padStart(2, "0");
    const mm = String(now.getMinutes()).padStart(2, "0");
    return `${now.getDate()} ${months[now.getMonth()]} · ${hh}.${mm}`;
  }, []);

  const handleResetSession = () => {
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
      typingTimeoutRef.current = null;
    }
    resetCoachChatSession();
    setActiveSessionId(createSessionId());
    setMessages([]);
    setIsFullChatMode(false);
    setShowHistoryPanel(false);
    setInputText("");
    setIsTyping(false);
  };

  const handleSelectHistorySession = (session: CoachChatSession) => {
    setActiveSessionId(session.id);
    setMessages(session.messages);
    setIsFullChatMode(true);
    setShowHistoryPanel(false);
    try {
      localStorage.setItem(COACH_ACTIVE_SESSION_KEY, session.id);
    } catch {
      // Ignore
    }
  };

  const handleDeleteHistorySession = (sessionId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setSessions((prev) => {
      const next = prev.filter((s) => s.id !== sessionId);
      saveStoredSessions(next);
      return next;
    });
    if (sessionId === activeSessionId) {
      handleResetSession();
    }
  };

  useEffect(() => {
    return () => {
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
    };
  }, []);

  useEffect(() => {
    api
      .getDailySummary()
      .then((res) => {
        const d = res?.data;
        if (!d) return;
        if (d.user?.name) {
          setUserName(d.user.name.split(" ")[0]);
        }
        if (typeof d.activeBreaks?.verifiedCount === "number") {
          setVerifiedBreakCount(d.activeBreaks.verifiedCount);
        }
        if (typeof d.activity?.mvpaMinutes === "number") {
          setTodayMvpaMinutes(d.activity.mvpaMinutes);
        }
        if (typeof d.activity?.steps === "number") {
          setTodaySteps(d.activity.steps);
        }
        if (typeof d.burnout?.totalScreenTimeMins === "number" && d.burnout.totalScreenTimeMins > 0) {
          const dbHours = Number((d.burnout.totalScreenTimeMins / 60).toFixed(2));
          setScreenHours((prev) => Math.max(prev, dbHours));
        }
      })
      .catch(() => {});

    api
      .getAcademicSchedules()
      .then((res) => {
        const list = Array.isArray(res.data) ? res.data : [];
        setTotalCourses(list.length);
        setTotalSks(list.reduce((sum, s) => sum + (Number(s.creditHours) || 0), 0));
        setHasExamWeek(list.some((s) => Boolean(s.isExamWeek)));
      })
      .catch(() => {});

    setScreenHours(screenTimeTracker.getTodayScreenTimeHours());
  }, []);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isTyping]);

  const sendMessageToBackendCoach = async (
    promptText: string,
    extraOptions?: { clarificationChoice?: string; movementChoice?: string }
  ) => {
    if (isTyping) return;
    setInputText("");

    const recentHistory = messages.slice(-6).map((m) => ({
      role: m.sender === "coach" ? ("assistant" as const) : ("user" as const),
      text: m.text,
    }));

    const newMsg: ChatMessage = {
      id: `user-${Date.now()}`,
      sender: "user",
      text: promptText,
    };

    setMessages((prev) => [...prev, newMsg]);
    setIsFullChatMode(true);
    setIsTyping(true);

    try {
      const payload = extraOptions?.movementChoice
        ? { movementChoice: extraOptions.movementChoice }
        : extraOptions?.clarificationChoice
        ? { clarificationChoice: extraOptions.clarificationChoice }
        : { notes: promptText, chatHistory: recentHistory };

      const res = await api.generateAiCoachInsight(payload);
      const data = res?.data;
      let reply = "";
      let clarificationOptions: Array<{ id: string; label: string }> | undefined;

      if (data?.clarification?.question) {
        reply = data.clarification.question;
        clarificationOptions = data.clarification.options;
      } else if (data?.diagnosisSummary || data?.isotemporalActionPlan) {
        const parts = [data.diagnosisSummary, data.isotemporalActionPlan].filter(Boolean);
        reply = parts.join("\n\n");
      }

      if (!reply.trim()) {
        throw new Error("Empty coach reply");
      }

      setMessages((prev) => [
        ...prev,
        {
          id: data?.id || `coach-${Date.now()}`,
          sender: "coach",
          text: reply,
          recommendedMetsToday:
            typeof data?.recommendedMetsToday === "number" && data.recommendedMetsToday > 0
              ? data.recommendedMetsToday
              : undefined,
          scientificCitationNote:
            data?.scientificCitationNote &&
            !/di luar cakupan/i.test(data.scientificCitationNote) &&
            !/protokol keselamatan/i.test(data.scientificCitationNote)
              ? data.scientificCitationNote
              : undefined,
          movementOptions:
            Array.isArray(data?.movementOptions) && data.movementOptions.length > 0
              ? data.movementOptions
              : undefined,
          clarificationOptions,
          guidance:
            Array.isArray(data?.guidance) && data.guidance.length > 0 ? data.guidance : undefined,
          escalationFlag: Boolean(data?.escalationFlag),
        },
      ]);
    } catch {
      let fallbackReply =
        "Aku mendengarkanmu. Bernapaslah perlahan sejenak. Kamu sudah berjuang sebaik mungkin hari ini, dan tidak apa-apa untuk beristirahat sebentar.";
      const lower = promptText.toLowerCase();
      if (lower.includes("beban kuliah") || lower.includes("tugas") || lower.includes("ujian")) {
        fallbackReply = `Dengan beban aktif ${totalSks} SKS (${totalCourses} mata kuliah), strategi terbaik adalah memecah tugas menjadi sesi mikro 25 menit diikuti jeda aktif 2 menit agar beban kognitif tetap terkendali.`;
      } else if (lower.includes("peregangan") || lower.includes("mata lelah") || lower.includes("leher")) {
        fallbackReply =
          "Mari lakukan 3 langkah cepat: (1) Aturan 20-20-20: tatap titik berjarak 6 meter selama 20 detik. (2) Tarik bahu ke atas lalu putar ke belakang 5 kali. (3) Buka tab VisionLab untuk memandu sesi jeda aktif peregangan 2 menit.";
      } else if (lower.includes("tidur") || lower.includes("lelah") || lower.includes("capek")) {
        fallbackReply = `Tidur terdeteksimu saat ini ${autoSleep.sleepHours} jam (${autoSleep.bedTime}–${autoSleep.wakeTime}). Redupkan layar 30 menit sebelum tidur dan lakukan teknik pernapasan 4-7-8 untuk memulihkan sistem saraf.`;
      }

      setMessages((prev) => [
        ...prev,
        {
          id: `coach-${Date.now()}`,
          sender: "coach",
          text: fallbackReply,
        },
      ]);
    } finally {
      setIsTyping(false);
    }
  };

  const handleSendQuickPrompt = (promptText: string) => {
    void sendMessageToBackendCoach(promptText);
  };

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim() || isTyping) return;
    void sendMessageToBackendCoach(inputText.trim());
  };

  const isChatting = isFullChatMode && messages.length > 0;

  return (
    <div className="w-full space-y-6 pb-12 font-sans">
      {/* ========================================================
          1. TOP PAGE HEADER
          ======================================================== */}
      <div>
        <h1 className="font-heading font-extrabold text-3xl sm:text-4xl text-[#2F3A2E] tracking-tight">
          Kamu tidak sendirian.
        </h1>
        <p className="text-sm text-[#636B60] mt-2">
          Kenali kebutuhan tubuh dan pikiranmu bersama Wellbeing AI Coach.
        </p>
      </div>

      {/* ========================================================
          2. DYNAMIC LAYOUT: 2 COLUMNS BY DEFAULT, FULL-WIDTH LEFT-ALIGNED WHEN CHATTING
          ======================================================== */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* --------------------------------------------------------
            LEFT COLUMN (3 Cards — Hidden automatically while chatting)
            -------------------------------------------------------- */}
        {!isChatting && (
        <div className="lg:col-span-4 space-y-5">
          {/* CARD 1: Cerita tubuhmu hari ini */}
          <div className="bg-white rounded-[1.75rem] p-6 shadow-xs border border-[#E8DDCF] space-y-5">
            <h2 className="font-heading font-extrabold text-base sm:text-lg text-[#2F3A2E]">
              Cerita tubuhmu hari ini
            </h2>

            <div className="space-y-4">
              {/* Item 1: Beban kuliah */}
              <div className="flex items-center gap-3.5">
                <div className="w-12 h-12 rounded-2xl bg-[#CFD8C4] border border-[#BCC8AE] text-[#2F3A2E] flex items-center justify-center shrink-0 shadow-2xs">
                  <BookOpen className="w-5 h-5" />
                </div>
                <div className="min-w-0">
                  <p className="font-bold text-sm text-[#2F3A2E] leading-tight">Beban kuliah</p>
                  <p className="text-xs text-[#636B60] mt-0.5">
                    {totalSks} SKS ({totalCourses} Matkul) &middot;{" "}
                    {hasExamWeek ? "Pekan ujian" : "Perkuliahan aktif"}
                  </p>
                </div>
              </div>

              {/* Item 2: Paparan layar */}
              <div className="flex items-center gap-3.5">
                <div className="w-12 h-12 rounded-2xl bg-[#CFD8C4] border border-[#BCC8AE] text-[#2F3A2E] flex items-center justify-center shrink-0 shadow-2xs">
                  <Monitor className="w-5 h-5" />
                </div>
                <div className="min-w-0">
                  <p className="font-bold text-sm text-[#2F3A2E] leading-tight">Paparan layar</p>
                  <p className="text-xs text-[#636B60] mt-0.5">
                    {screenHours} jam &middot; {screenHours > 8 ? "Butuh jeda aktif" : "Batas aman"}
                  </p>
                </div>
              </div>

              {/* Item 3: Pemulihan tidur */}
              <div className="flex items-center gap-3.5">
                <div className="w-12 h-12 rounded-2xl bg-[#CFD8C4] border border-[#BCC8AE] text-[#2F3A2E] flex items-center justify-center shrink-0 shadow-2xs">
                  <Moon className="w-5 h-5" />
                </div>
                <div className="min-w-0">
                  <p className="font-bold text-sm text-[#2F3A2E] leading-tight">Pemulihan tidur</p>
                  <p className="text-xs text-[#636B60] mt-0.5">
                    {autoSleep.sleepHours} jam dari target 8 jam ({autoSleep.bedTime}&ndash;{autoSleep.wakeTime})
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* CARD 2: Sedikit lebih baik, hari ini. */}
          <div className="bg-white rounded-[1.75rem] p-6 shadow-xs border border-[#E8DDCF] space-y-5">
            <h2 className="font-heading font-extrabold text-base sm:text-lg text-[#2F3A2E]">
              Sedikit lebih baik, hari ini.
            </h2>

            <div className="space-y-4">
              {/* Step 01: Active Break Recommendation (Dynamic) */}
              <div className="flex items-start gap-3.5">
                <div className="w-9 h-9 rounded-full bg-[#CFD8C4] border border-[#BCC8AE] text-[#2F3A2E] font-extrabold text-xs flex items-center justify-center shrink-0 mt-0.5 shadow-2xs">
                  01
                </div>
                <div className="min-w-0">
                  <p className="font-bold text-sm text-[#2F3A2E] leading-tight">
                    {verifiedBreakCount >= 2
                      ? "Ritme jeda aktif terjaga"
                      : `Ambil ${2 - verifiedBreakCount} jeda aktif lagi`}
                  </p>
                  <p className="text-xs text-[#636B60] mt-0.5 leading-relaxed">
                    {verifiedBreakCount >= 2
                      ? `${verifiedBreakCount} sesi peregangan terverifikasi hari ini.`
                      : "Peregangan singkat 2 menit di sela tugas kuliah."}
                  </p>
                </div>
              </div>

              {/* Step 02: Movement / Screen Time Recommendation (Dynamic) */}
              <div className="flex items-start gap-3.5">
                <div className="w-9 h-9 rounded-full bg-[#CFD8C4] border border-[#BCC8AE] text-[#2F3A2E] font-extrabold text-xs flex items-center justify-center shrink-0 mt-0.5 shadow-2xs">
                  02
                </div>
                <div className="min-w-0">
                  <p className="font-bold text-sm text-[#2F3A2E] leading-tight">
                    {todayMvpaMinutes >= 20 || todaySteps >= 3000
                      ? "Target gerak harian tercapai"
                      : screenHours > 6
                      ? "Jauhkan layar & jalan 20 menit"
                      : "Jalan santai 20 menit"}
                  </p>
                  <p className="text-xs text-[#636B60] mt-0.5 leading-relaxed">
                    {todayMvpaMinutes >= 20 || todaySteps >= 3000
                      ? `Tercatat ${todaySteps.toLocaleString("id-ID")} langkah (${todayMvpaMinutes} menit aktif).`
                      : "Bergerak tanpa melihat layar untuk segarkan fokus."}
                  </p>
                </div>
              </div>

              {/* Step 03: Sleep Recommendation (Dynamic) */}
              <div className="flex items-start gap-3.5">
                <div className="w-9 h-9 rounded-full bg-[#CFD8C4] border border-[#BCC8AE] text-[#2F3A2E] font-extrabold text-xs flex items-center justify-center shrink-0 mt-0.5 shadow-2xs">
                  03
                </div>
                <div className="min-w-0">
                  <p className="font-bold text-sm text-[#2F3A2E] leading-tight">
                    {autoSleep.sleepHours >= 7.5 ? "Pertahankan jam tidurmu" : "Tidur lebih awal malam ini"}
                  </p>
                  <p className="text-xs text-[#636B60] mt-0.5 leading-relaxed">
                    {autoSleep.sleepHours >= 7.5
                      ? `Durasi tidurmu ${autoSleep.sleepHours} jam — sudah di zona pemulihan ideal.`
                      : `Tambah ${Math.max(0.5, Number((8 - autoSleep.sleepHours).toFixed(1)))} jam lagi untuk capai target 8 jam.`}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* CARD 3: Ruang aman untuk bercerita */}
          <div className="bg-[#CFD8C4] rounded-[1.75rem] p-6 border border-[#BCC8AE] space-y-2">
            <div className="w-7 h-7 flex items-center justify-center text-[#2F3A2E]">
              <ShieldCheck className="w-6 h-6 stroke-[2]" />
            </div>
            <h3 className="font-heading font-extrabold text-sm text-[#2F3A2E] pt-0.5">
              Ruang aman untuk bercerita
            </h3>
            <p className="text-xs text-[#2F3A2E] leading-relaxed">
              AI Coach bukan diagnosis atau pengganti tenaga profesional. Saat butuh, bantuan manusia
              selalu penting.
            </p>
          </div>
        </div>
        )}

        {/* --------------------------------------------------------
            CHAT PANEL (8 cols default, full 12 cols flush-left when chatting)
            -------------------------------------------------------- */}
        <div
          className={`${
            isChatting ? "lg:col-span-12" : "lg:col-span-8"
          } w-full bg-white rounded-[1.75rem] shadow-xs border border-[#E8DDCF] overflow-hidden flex flex-col md:flex-row transition-all duration-300`}
        >
          {/* Left Sidebar Riwayat Obrolan (hanya tampil saat fase chat penuh) */}
          {isChatting && showHistoryPanel && (
            <aside className="w-full md:w-64 lg:w-72 shrink-0 bg-[#F6F8F3] border-b md:border-b-0 md:border-r border-[#E8DDCF] flex flex-col max-h-64 md:max-h-[760px]">
              <div className="p-3.5 border-b border-[#E8DDCF] flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleResetSession}
                  className="flex-1 px-3 py-2 rounded-xl bg-[#CFD8C4] hover:bg-[#BCC8AE] text-xs font-bold text-[#2F3A2E] flex items-center justify-center gap-1.5 cursor-pointer transition-colors shadow-2xs active:scale-[0.98]"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Obrolan Baru</span>
                </button>
                <button
                  type="button"
                  onClick={() => setShowHistoryPanel(false)}
                  className="md:hidden p-2 rounded-xl bg-white/80 hover:bg-white text-[#636B60] border border-[#E8DDCF] cursor-pointer"
                  title="Tutup riwayat"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>

              <div className="px-3.5 pt-3 pb-1.5 flex items-center justify-between">
                <span className="text-[11px] font-bold uppercase tracking-wider text-[#636B60]">
                  Riwayat Obrolan
                </span>
                <span className="text-[11px] font-semibold text-[#636B60]">
                  {sessions.length}
                </span>
              </div>

              <div className="flex-1 overflow-y-auto px-2.5 pb-3 space-y-1">
                {sessions.length === 0 ? (
                  <p className="text-xs text-[#636B60] px-2 py-4 text-center leading-relaxed">
                    Belum ada riwayat obrolan. Mulai chat untuk menyimpannya otomatis.
                  </p>
                ) : (
                  sessions.map((session) => {
                    const isActive = session.id === activeSessionId && messages.length > 0;
                    return (
                      <div
                        key={session.id}
                        onClick={() => handleSelectHistorySession(session)}
                        className={`group w-full rounded-xl px-2.5 py-2 flex items-center justify-between gap-2 transition-all cursor-pointer ${
                          isActive
                            ? "bg-[#E2EAD9] text-[#2F3A2E] border border-[#B8C6A9]"
                            : "hover:bg-[#EBF0E4]/80 text-[#2F3A2E] border border-transparent"
                        }`}
                      >
                        <div className="flex items-start gap-2 min-w-0 text-left">
                          <MessageSquare className="w-3.5 h-3.5 text-[#636B60] mt-0.5 shrink-0" />
                          <div className="min-w-0">
                            <p className="text-xs font-semibold text-[#2F3A2E] truncate">
                              {session.title}
                            </p>
                            <p className="text-[10px] text-[#636B60] mt-0.5">
                              {formatSessionDate(session.updatedAt)} · {session.messages.length} pesan
                            </p>
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={(e) => handleDeleteHistorySession(session.id, e)}
                          className="p-1 rounded-lg text-[#636B60] md:opacity-0 md:group-hover:opacity-100 hover:text-red-600 hover:bg-red-50 transition-all shrink-0 cursor-pointer"
                          title="Hapus riwayat ini"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    );
                  })
                )}
              </div>
            </aside>
          )}

          {/* Main Right Chat Column */}
          <div className="flex-1 flex flex-col min-w-0">
          {/* Header Chat Panel */}
          <div className="bg-[#CFD8C4] px-5 sm:px-6 py-4 flex items-center justify-between border-b border-[#BCC8AE]">
            <div className="flex items-center gap-2.5 sm:gap-3">
              {isChatting && (
                <button
                  type="button"
                  onClick={() => setShowHistoryPanel((v) => !v)}
                  className={`w-8 h-8 rounded-full flex items-center justify-center shadow-2xs transition-all active:scale-95 cursor-pointer shrink-0 ${
                    showHistoryPanel
                      ? "bg-[#2F3A2E] text-white"
                      : "bg-white/85 hover:bg-white text-[#2F3A2E]"
                  }`}
                  title={showHistoryPanel ? "Sembunyikan sidebar riwayat" : "Tampilkan sidebar riwayat"}
                  aria-label="Toggle sidebar riwayat"
                >
                  <PanelLeft className="w-4 h-4" />
                </button>
              )}
              {isChatting && (
                <button
                  type="button"
                  onClick={() => setIsFullChatMode(false)}
                  className="w-8 h-8 rounded-full bg-white/85 hover:bg-white text-[#2F3A2E] flex items-center justify-center shadow-2xs transition-all active:scale-95 cursor-pointer shrink-0"
                  title="Kembali ke tampilan awal"
                  aria-label="Kembali ke tampilan awal"
                >
                  <ArrowLeft className="w-4 h-4" />
                </button>
              )}
              <Heart className="w-6 h-6 text-[#2F3A2E] stroke-[2] shrink-0" />
              <div>
                <h3 className="font-heading font-extrabold text-base text-[#2F3A2E] leading-tight">
                  Wellbeing AI Coach
                </h3>
                <p className="text-xs text-[#636B60] mt-0.5">Pendamping ritme sehatmu</p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {!isChatting && messages.length > 0 && (
                <button
                  type="button"
                  onClick={() => setIsFullChatMode(true)}
                  className="px-3.5 py-1.5 rounded-full bg-white/90 hover:bg-white text-xs font-bold text-[#2F3A2E] transition-colors flex items-center gap-1.5 shadow-2xs active:scale-95 cursor-pointer"
                  title="Lanjutkan obrolan sebelumnya"
                >
                  <span>Lanjutkan Chat</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              )}

              <button
                type="button"
                onClick={handleResetSession}
                className="px-3.5 py-1.5 rounded-full bg-white/90 hover:bg-white text-xs font-bold text-[#2F3A2E] transition-colors flex items-center gap-1.5 shadow-2xs active:scale-95 cursor-pointer"
                title="Mulai obrolan baru"
              >
                <RotateCcw className="w-3.5 h-3.5 text-[#636B60]" />
                <span>Reset</span>
              </button>

              <span className="hidden sm:inline-block px-3.5 py-1.5 rounded-full bg-white/90 text-xs font-semibold text-[#2F3A2E] shadow-2xs">
                Hari ini
              </span>
            </div>
          </div>

          {/* Chat Messages Body */}
          <div
            className={`p-6 space-y-5 flex-1 overflow-y-auto ${
              isChatting ? "min-h-[460px] max-h-[640px]" : "max-h-[580px]"
            }`}
          >
            {!isChatting ? (
              /* Hero State */
              <div className="py-8 px-2 sm:px-6 flex flex-col items-center justify-center text-center space-y-5 animate-in fade-in zoom-in-95 duration-200">
                <div>
                  <h3 className="font-heading font-extrabold text-2xl sm:text-3xl text-[#2F3A2E]">
                    Hai, {userName}! Apa kabar hari ini?
                  </h3>
                  <p className="text-xs sm:text-sm text-[#636B60] mt-1.5 max-w-md mx-auto leading-relaxed">
                    Kenali ritme tubuh dan pikiranmu. Pilih salah satu rekomendasi topik di bawah untuk memulai sesi obrolan sehat:
                  </p>
                </div>

                {/* Vertical Stack of Recommendation Cards (Matching Reference Screenshot) */}
                <div className="w-full max-w-lg space-y-2.5 text-left pt-2">
                  {CHAT_RECOMMENDATIONS.map((rec) => (
                    <button
                      key={rec.id}
                      type="button"
                      onClick={() => handleSendQuickPrompt(rec.prompt)}
                      disabled={isTyping}
                      className="w-full bg-white hover:bg-[#FAF6F0] border border-[#E8DDCF] hover:border-[#BCC8AE] rounded-2xl p-3.5 sm:p-4 flex items-center justify-between gap-3 transition-all shadow-2xs group active:scale-[0.99] disabled:opacity-50 cursor-pointer"
                    >
                      <div className="flex items-center gap-3.5 min-w-0">
                        <div className="w-9 h-9 rounded-xl bg-[#CFD8C4] group-hover:bg-[#BCC8AE] text-[#2F3A2E] flex items-center justify-center shrink-0 border border-[#BCC8AE] shadow-2xs transition-colors">
                          {rec.icon}
                        </div>
                        <span className="text-xs sm:text-sm font-semibold text-[#2F3A2E] group-hover:text-black">
                          {rec.prompt}
                        </span>
                      </div>
                      <ArrowRight className="w-4 h-4 text-[#636B60] group-hover:text-[#2F3A2E] shrink-0 transition-colors" />
                    </button>
                  ))}
                </div>

                {sessions.length > 0 && (
                  <div className="w-full max-w-lg text-left pt-2 space-y-2">
                    <div className="flex items-center justify-between px-1">
                      <span className="text-[11px] font-bold uppercase tracking-wider text-[#636B60]">
                        Obrolan Terakhir
                      </span>
                      <button
                        type="button"
                        onClick={() => setShowHistoryPanel(true)}
                        className="text-[11px] font-bold text-[#2F3A2E] hover:underline cursor-pointer"
                      >
                        Lihat semua ({sessions.length})
                      </button>
                    </div>
                    <div className="space-y-1.5">
                      {sessions.slice(0, 3).map((session) => (
                        <button
                          key={session.id}
                          type="button"
                          onClick={() => handleSelectHistorySession(session)}
                          className="w-full bg-[#F6F8F3] hover:bg-[#E7ECE0] border border-[#DDE4D4] rounded-xl px-3.5 py-2.5 flex items-center justify-between gap-2 text-left transition-colors cursor-pointer"
                        >
                          <span className="text-xs font-semibold text-[#2F3A2E] truncate">
                            {session.title}
                          </span>
                          <span className="text-[11px] text-[#636B60] shrink-0">
                            {formatSessionDate(session.updatedAt)}
                          </span>
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <>
                {/* Timestamp Separator */}
                <div className="text-center">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-[#636B60]">
                    {sessionTimestampLabel}
                  </span>
                </div>

                {/* Render Messages */}
                {messages.map((msg, msgIdx) => {
                  const isUser = msg.sender === "user";
                  const isLatestCoachMsg = !isUser && msgIdx === messages.length - 1;
                  return (
                    <div
                      key={msg.id}
                      className={`flex ${isUser ? "justify-end" : "justify-start"} animate-in fade-in duration-200`}
                    >
                      <div
                        className={`text-sm leading-relaxed text-left ${isUser
                          ? "bg-[#CFD8C4]/65 border border-[#BCC8AE] text-[#2F3A2E] rounded-2xl sm:rounded-3xl p-4 max-w-xl shadow-2xs whitespace-pre-line"
                          : "bg-[#FAF6F0] border border-[#E8DDCF] text-[#2F3A2E] rounded-2xl sm:rounded-3xl p-5 max-w-3xl shadow-2xs space-y-3"
                          }`}
                      >
                        {isUser ? (
                          <div className="whitespace-pre-line">
                            {msg.text.replace("Tiara", userName)}
                          </div>
                        ) : (
                          renderCoachFormattedText(msg.text.replace("Tiara", userName))
                        )}

                        {!isUser && msg.guidance && msg.guidance.length > 0 && (
                          <div className="rounded-2xl bg-white/90 border border-[#E8DDCF] p-3.5 space-y-1.5">
                            <p className="text-[11px] font-extrabold uppercase tracking-wider text-[#4C5C4E]">
                              Langkah Panduan Terstruktur
                            </p>
                            <ol className="list-decimal list-inside space-y-1 text-xs sm:text-[13px] text-[#2F3A2E]">
                              {msg.guidance.map((step, idx) => (
                                <li key={idx}>{step}</li>
                              ))}
                            </ol>
                          </div>
                        )}

                        {!isUser && isLatestCoachMsg && msg.clarificationOptions && msg.clarificationOptions.length > 0 && (
                          <div className="pt-1 flex flex-wrap gap-2">
                            {msg.clarificationOptions.map((opt) => (
                              <button
                                key={opt.id}
                                type="button"
                                disabled={isTyping}
                                onClick={() =>
                                  void sendMessageToBackendCoach(`${opt.id}. ${opt.label}`, {
                                    clarificationChoice: opt.id,
                                  })
                                }
                                className="px-3.5 py-2 rounded-xl bg-white hover:bg-[#CFD8C4]/60 border border-[#DDD0C1] hover:border-[#BCC8AE] text-xs font-bold text-[#2F3A2E] transition-all cursor-pointer disabled:opacity-50"
                              >
                                {opt.id}. {opt.label}
                              </button>
                            ))}
                          </div>
                        )}

                        {!isUser && isLatestCoachMsg && msg.movementOptions && msg.movementOptions.length > 0 && (
                          <div className="pt-1 space-y-1.5">
                            <p className="text-[11px] font-bold text-[#636B60]">
                              Pilih alternatif gerakan untuk lihat panduan langkahnya:
                            </p>
                            <div className="flex flex-wrap gap-2">
                              {msg.movementOptions.map((opt, idx) => {
                                const letter = String.fromCharCode(65 + idx);
                                return (
                                  <button
                                    key={opt}
                                    type="button"
                                    disabled={isTyping}
                                    onClick={() =>
                                      void sendMessageToBackendCoach(opt, {
                                        movementChoice: letter,
                                      })
                                    }
                                    className="px-3 py-1.5 rounded-full bg-white hover:bg-[#CFD8C4] border border-[#DDD0C1] hover:border-[#BCC8AE] text-xs font-bold text-[#2F3A2E] transition-all cursor-pointer disabled:opacity-50"
                                  >
                                    {letter}. {opt}
                                  </button>
                                );
                              })}
                            </div>
                          </div>
                        )}

                      </div>
                    </div>
                  );
                })}

                {/* Typing Indicator */}
                {isTyping && (
                  <div className="flex justify-start">
                    <div className="bg-[#FAF6F0] rounded-2xl px-4 py-3 flex items-center gap-1.5 shadow-2xs">
                      <span className="w-2 h-2 rounded-full bg-[#746252] animate-pulse" />
                      <span className="w-2 h-2 rounded-full bg-[#746252] animate-pulse delay-150" />
                      <span className="w-2 h-2 rounded-full bg-[#746252] animate-pulse delay-300" />
                    </div>
                  </div>
                )}
                <div ref={chatEndRef} />
              </>
            )}
          </div>

          {/* Chat Input Bar */}
          <div className="px-6 pb-6 pt-2 border-t border-[#E8DDCF]">
            <form
              onSubmit={handleSendMessage}
              className="flex items-center gap-2 bg-white rounded-full border border-[#E8DDCF] pl-5 pr-2 py-2 focus-within:border-[#4A3B2C] transition-colors shadow-2xs"
            >
              <input
                type="text"
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                placeholder="Ceritakan yang sedang kamu rasakan..."
                className="flex-1 bg-transparent text-xs sm:text-sm text-[#2F3A2E] placeholder-[#636B60] focus:outline-none"
              />
              <button
                type="submit"
                disabled={!inputText.trim() || isTyping}
                className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-[#CFD8C4] hover:bg-[#BCC8AE] text-[#2F3A2E] border border-[#BCC8AE] flex items-center justify-center transition-colors active:scale-95 shrink-0 disabled:opacity-40"
                title="Kirim pesan"
              >
                <ArrowRight className="w-4 h-4" />
              </button>
            </form>
          </div>
          </div>
        </div>
      </div>
    </div>
  );
};
