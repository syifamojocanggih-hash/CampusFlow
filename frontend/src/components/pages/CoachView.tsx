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

// In-memory session store: survives tab/page switches within the SPA,
// but naturally resets on browser refresh/close or explicit logout.
let cachedCoachMessages: ChatMessage[] = [];
let cachedIsFullChatMode = false;

export function resetCoachChatSession(): void {
  cachedCoachMessages = [];
  cachedIsFullChatMode = false;
}

export const CoachView: React.FC<CoachViewProps> = () => {
  const autoSleep = useAutoSleep();
  const [userName, setUserName] = useState<string>("Mahasiswa");
  const [totalSks, setTotalSks] = useState<number>(0);
  const [totalCourses, setTotalCourses] = useState<number>(0);
  const [hasExamWeek, setHasExamWeek] = useState<boolean>(false);
  const [screenHours, setScreenHours] = useState<number>(() =>
    screenTimeTracker.getTodayScreenTimeHours()
  );
  const [inputText, setInputText] = useState<string>("");
  const [isTyping, setIsTyping] = useState<boolean>(false);
  const [messages, setMessages] = useState<ChatMessage[]>(() => cachedCoachMessages);
  const [isFullChatMode, setIsFullChatMode] = useState<boolean>(() => cachedIsFullChatMode);
  const chatEndRef = useRef<HTMLDivElement>(null);
  const typingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    cachedCoachMessages = messages;
  }, [messages]);

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
    setMessages([]);
    setIsFullChatMode(false);
    setInputText("");
    setIsTyping(false);
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
      .getCurrentUser()
      .then((res) => {
        if (res?.data?.name) {
          const firstName = res.data.name.split(" ")[0];
          setUserName(firstName);
        }
      })
      .catch((err) => {
        console.warn("Gagal memuat profil pengguna:", err);
      });

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

  const sendMessageToBackendCoach = async (promptText: string) => {
    if (isTyping) return;
    setInputText("");

    const newMsg: ChatMessage = {
      id: `user-${Date.now()}`,
      sender: "user",
      text: promptText,
    };

    setMessages((prev) => [...prev, newMsg]);
    setIsFullChatMode(true);
    setIsTyping(true);

    try {
      const res = await api.generateAiCoachInsight(promptText);
      const data = res?.data;
      let reply = "";

      if (data?.clarification?.question) {
        const opts = (data.clarification.options || [])
          .map((o) => `${o.id}. ${o.label}`)
          .join("\n");
        reply = `${data.clarification.question}\n${opts}`;
      } else if (data?.diagnosisSummary || data?.isotemporalActionPlan) {
        const parts = [data.diagnosisSummary, data.isotemporalActionPlan].filter(Boolean);
        reply = parts.join(" ");
        if (Array.isArray(data.guidance) && data.guidance.length > 0) {
          reply += `\n\nLangkah Panduan:\n${data.guidance.map((g, i) => `${i + 1}. ${g}`).join("\n")}`;
        }
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
              {/* Step 01 */}
              <div className="flex items-start gap-3.5">
                <div className="w-9 h-9 rounded-full bg-[#CFD8C4] border border-[#BCC8AE] text-[#2F3A2E] font-extrabold text-xs flex items-center justify-center shrink-0 mt-0.5 shadow-2xs">
                  01
                </div>
                <div className="min-w-0">
                  <p className="font-bold text-sm text-[#2F3A2E] leading-tight">Ambil 2 jeda aktif</p>
                  <p className="text-xs text-[#636B60] mt-0.5 leading-relaxed">
                    Peregangan singkat di sela tugas.
                  </p>
                </div>
              </div>

              {/* Step 02 */}
              <div className="flex items-start gap-3.5">
                <div className="w-9 h-9 rounded-full bg-[#CFD8C4] border border-[#BCC8AE] text-[#2F3A2E] font-extrabold text-xs flex items-center justify-center shrink-0 mt-0.5 shadow-2xs">
                  02
                </div>
                <div className="min-w-0">
                  <p className="font-bold text-sm text-[#2F3A2E] leading-tight">Jalan santai 20 menit</p>
                  <p className="text-xs text-[#636B60] mt-0.5 leading-relaxed">
                    Bergerak tanpa melihat layar.
                  </p>
                </div>
              </div>

              {/* Step 03 */}
              <div className="flex items-start gap-3.5">
                <div className="w-9 h-9 rounded-full bg-[#CFD8C4] border border-[#BCC8AE] text-[#2F3A2E] font-extrabold text-xs flex items-center justify-center shrink-0 mt-0.5 shadow-2xs">
                  03
                </div>
                <div className="min-w-0">
                  <p className="font-bold text-sm text-[#2F3A2E] leading-tight">Tidur lebih awal</p>
                  <p className="text-xs text-[#636B60] mt-0.5 leading-relaxed">
                    Tambah 2 jam untuk capai target.
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
          } w-full bg-white rounded-[1.75rem] shadow-xs border border-[#E8DDCF] overflow-hidden flex flex-col transition-all duration-300`}
        >
          {/* Header Chat Panel */}
          <div className="bg-[#CFD8C4] px-6 py-4 flex items-center justify-between border-b border-[#BCC8AE]">
            <div className="flex items-center gap-3">
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
                  className="px-3.5 py-1.5 rounded-full bg-[#CFD8C4] hover:bg-[#BCC8AE] text-xs font-bold text-[#2F3A2E] transition-colors flex items-center gap-1.5 shadow-2xs active:scale-95 cursor-pointer"
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
                title="Reset sesi obrolan"
              >
                <RotateCcw className="w-3.5 h-3.5 text-[#636B60]" />
                <span>Reset</span>
              </button>

              <span className="px-3.5 py-1.5 rounded-full bg-white/90 text-xs font-semibold text-[#2F3A2E] shadow-2xs">
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
                {messages.map((msg) => {
                  const isUser = msg.sender === "user";
                  return (
                    <div
                      key={msg.id}
                      className={`flex ${isUser ? "justify-end" : "justify-start"} animate-in fade-in duration-200`}
                    >
                      <div
                        className={`text-sm leading-relaxed whitespace-pre-line text-left ${isUser
                          ? "bg-[#CFD8C4]/65 border border-[#BCC8AE] text-[#2F3A2E] rounded-2xl sm:rounded-3xl p-4 max-w-xl shadow-2xs"
                          : "bg-[#FAF6F0] border border-[#E8DDCF] text-[#2F3A2E] rounded-2xl sm:rounded-3xl p-5 max-w-3xl shadow-2xs"
                          }`}
                      >
                        {msg.text.replace("Tiara", userName)}
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
  );
};
