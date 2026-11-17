import React, { useState, useEffect, useRef } from "react";
import {
  Heart,
  BookOpen,
  Monitor,
  Moon,
  ShieldCheck,
  ArrowRight,
  Clock,
  Sparkles,
  RotateCcw,
} from "lucide-react";
import { api } from "@/lib/api";

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
    icon: <BookOpen className="w-4 h-4 text-[#1A1A1A]" />,
    prompt: "Saya ingin bantuan terkait tugas dan beban kuliah",
  },
  {
    id: "rec-2",
    icon: <Clock className="w-4 h-4 text-[#1A1A1A]" />,
    prompt: "Saya ingin mengatur jadwal belajar dan istirahat seimbang",
  },
  {
    id: "rec-3",
    icon: <Monitor className="w-4 h-4 text-[#1A1A1A]" />,
    prompt: "Saya butuh saran peregangan leher dan mata lelah",
  },
  {
    id: "rec-4",
    icon: <Moon className="w-4 h-4 text-[#1A1A1A]" />,
    prompt: "Saya ingin memulihkan kualitas tidur malam ini",
  },
  {
    id: "rec-5",
    icon: <Sparkles className="w-4 h-4 text-[#1A1A1A]" />,
    prompt: "Saya butuh saran untuk menenangkan pikiran saat stres",
  },
];

const getTimeOfDayGreeting = () => {
  const hour = new Date().getHours();
  if (hour >= 4 && hour < 11) return "pagi";
  if (hour >= 11 && hour < 15) return "siang";
  if (hour >= 15 && hour < 18) return "sore";
  return "malam";
};

const INITIAL_MESSAGES: ChatMessage[] = [
  {
    id: "msg-1",
    sender: "coach",
    text: "Hai Tiara. Pekan ujian bisa terasa penuh, ya. Waktu layarmu sudah 10 jam dan tidurmu baru 6 jam. Bagaimana perasaanmu sekarang?",
  },
  {
    id: "msg-2",
    sender: "user",
    text: "Aku tidak sanggup lagi, tugas menumpuk.",
  },
  {
    id: "msg-3",
    sender: "coach",
    text: "Terima kasih sudah cerita. Kedengarannya ini terasa sangat berat. Kamu tidak harus menghadapi semuanya sendiri. Apa kamu berada di tempat yang aman saat ini?",
  },
];

export const CoachView: React.FC<CoachViewProps> = () => {
  const [userName, setUserName] = useState<string>("Tiara");
  const [inputText, setInputText] = useState<string>("");
  const [isTyping, setIsTyping] = useState<boolean>(false);
  const [hasChatted, setHasChatted] = useState<boolean>(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  // Initial messages matching the exact conversation shown in the reference design
  const [messages, setMessages] = useState<ChatMessage[]>(INITIAL_MESSAGES);

  const handleResetSession = () => {
    setMessages(INITIAL_MESSAGES);
    setHasChatted(false);
    setInputText("");
    setIsTyping(false);
  };

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
  }, []);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isTyping]);

  const handleSendQuickPrompt = (promptText: string) => {
    if (isTyping) return;
    setHasChatted(true);
    setInputText("");

    const newMsg: ChatMessage = {
      id: `user-${Date.now()}`,
      sender: "user",
      text: promptText,
    };

    setMessages((prev) => [...prev, newMsg]);
    setIsTyping(true);

    setTimeout(() => {
      let reply = "";
      const lower = promptText.toLowerCase();

      if (lower.includes("beban kuliah") || (lower.includes("tugas") && lower.includes("bantuan"))) {
        reply =
          "Menghadapi tumpukan tugas memang seringkali memicu rasa overwhelmed. Strategi terbaik adalah memecahnya: pilih 1 tugas kecil yang bisa diselesaikan dalam 15-20 menit. Setelah itu, berikan dirimu apresiasi dan jeda 5 menit. Kamu tidak harus menyelesaikan semuanya dalam satu malam sekaligus.";
      } else if (lower.includes("jadwal belajar") || lower.includes("istirahat seimbang")) {
        reply =
          "Untuk ritme harian seimbang: terapkan rasio fokus 50:10 (50 menit belajar fokus, 10 menit gerak tanpa layar). Pastikan juga menetapkan batas akhir belajar (hard stop) minimal 1 jam sebelum tidur agar pikiran punya waktu cooling down.";
      } else if (lower.includes("peregangan") || lower.includes("mata lelah") || lower.includes("leher")) {
        reply =
          "Mari lakukan 3 langkah cepat: (1) Aturan 20-20-20: tatap titik berjarak 6 meter selama 20 detik. (2) Tarik bahu ke atas lalu putar ke belakang 5 kali. (3) Lakukan chin tuck (tarik dagu ke belakang perlahan) untuk meluruskan postur servikal. Kamu juga bisa membuka tab Workstation untuk memandu sesi jeda aktif 2 menit!";
      } else if (lower.includes("kualitas tidur") || lower.includes("tidur malam")) {
        reply =
          "Tidur adalah fondasi energi dan pemulihan otakmu. Agar tidur malam lebih nyenyak: redupkan lampu 30 menit sebelum tidur, hindari ponsel di atas kasur, dan lakukan 3 menit teknik pernapasan 4-7-8 (tarik 4 detik, tahan 7 detik, hembus 8 detik) untuk menurunkan ketegangan sistem saraf.";
      } else if (lower.includes("menenangkan pikiran") || lower.includes("stres")) {
        reply =
          "Tarik napas dalam-dalam bersamaku... Tarik perlahan lewat hidung, tahan sejenak, lalu hembuskan perlahan lewat mulut. Ingat, perasaan tertekan ini bersifat sementara dan kamu telah berjuang sangat baik hari ini. Luangkan 10 menit tanpa layar untuk mendengarkan alunan instrumen tenang atau minum air hangat.";
      } else {
        reply =
          "Aku mendengarkanmu. Bernapaslah perlahan sejenak. Kamu sudah berjuang sebaik mungkin hari ini, dan tidak apa-apa untuk beristirahat sebentar.";
      }

      const coachMsg: ChatMessage = {
        id: `coach-${Date.now()}`,
        sender: "coach",
        text: reply,
      };

      setMessages((prev) => [...prev, coachMsg]);
      setIsTyping(false);
    }, 650);
  };

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim() || isTyping) return;

    setHasChatted(true);
    const userText = inputText.trim();
    setInputText("");

    const newMsg: ChatMessage = {
      id: `user-${Date.now()}`,
      sender: "user",
      text: userText,
    };

    setMessages((prev) => [...prev, newMsg]);
    setIsTyping(true);

    setTimeout(() => {
      let reply =
        "Aku mendengarkanmu. Bernapaslah perlahan sejenak. Kamu sudah berjuang sebaik mungkin hari ini, dan tidak apa-apa untuk beristirahat sebentar.";

      const lower = userText.toLowerCase();
      if (
        lower.includes("mati") ||
        lower.includes("bunuh") ||
        lower.includes("menyerah") ||
        lower.includes("tidak sanggup") ||
        lower.includes("putus asa") ||
        lower.includes("menyakiti") ||
        lower.includes("darurat") ||
        lower.includes("tolong")
      ) {
        reply =
          "Keselamatan dan kesehatan mentalmu adalah prioritas nomor satu saat ini. Kamu sangat berharga dan tidak sendirian. Silakan hubungi nomor bantuan darurat 119 ekstensi 8 atau kunjungi healing119.id sekarang juga.";
      } else if (lower.includes("tidur") || lower.includes("lelah") || lower.includes("capek")) {
        reply =
          "Tubuhmu mengirimkan sinyal bahwa ia membutuhkan pemulihan fisik dan mental. Cobalah tutup laptop, redupkan lampu, dan luangkan waktu untuk tidur lebih awal malam ini.";
      } else if (lower.includes("tugas") || lower.includes("ujian") || lower.includes("kuliah")) {
        reply =
          "Beban akademik memang bisa sangat menekan di pekan ujian. Cobalah bagi tugas menjadi bagian-bagian kecil (mikro-tugas 15 menit) dan berikan dirimu jeda 5 menit untuk relaksasi.";
      }

      const coachMsg: ChatMessage = {
        id: `coach-${Date.now()}`,
        sender: "coach",
        text: reply,
      };

      setMessages((prev) => [...prev, coachMsg]);
      setIsTyping(false);
    }, 700);
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6 pb-12 font-sans">
      {/* ========================================================
          1. TOP PAGE HEADER
          ======================================================== */}
      <div>
        <h1 className="font-heading font-extrabold text-3xl sm:text-4xl text-[#1A1A1A] tracking-tight">
          Kamu tidak sendirian.
        </h1>
        <p className="text-sm text-[#737373] mt-2">
          Kenali kebutuhan tubuh dan pikiranmu bersama Wellbeing AI Coach.
        </p>
      </div>

      {/* ========================================================
          2. TWO COLUMNS LAYOUT: LEFT SIDEBAR + RIGHT CHAT PANEL
          ======================================================== */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* --------------------------------------------------------
            LEFT COLUMN (3 Cards)
            -------------------------------------------------------- */}
        <div className="lg:col-span-4 space-y-5">
          {/* CARD 1: Cerita tubuhmu hari ini */}
          <div className="bg-white rounded-[1.75rem] p-6 shadow-xs border border-[#F0F0F0] space-y-5">
            <h2 className="font-heading font-extrabold text-base sm:text-lg text-[#1A1A1A]">
              Cerita tubuhmu hari ini
            </h2>

            <div className="space-y-4">
              {/* Item 1: Beban kuliah */}
              <div className="flex items-center gap-3.5">
                <div className="w-12 h-12 rounded-2xl bg-[#FCE4E6] text-[#E11D48] flex items-center justify-center shrink-0 shadow-2xs">
                  <BookOpen className="w-5 h-5" />
                </div>
                <div className="min-w-0">
                  <p className="font-bold text-sm text-[#1A1A1A] leading-tight">Beban kuliah</p>
                  <p className="text-xs text-[#737373] mt-0.5">24 SKS · Pekan ujian</p>
                </div>
              </div>

              {/* Item 2: Paparan layar */}
              <div className="flex items-center gap-3.5">
                <div className="w-12 h-12 rounded-2xl bg-[#FFF29A] text-[#B45309] flex items-center justify-center shrink-0 shadow-2xs">
                  <Monitor className="w-5 h-5" />
                </div>
                <div className="min-w-0">
                  <p className="font-bold text-sm text-[#1A1A1A] leading-tight">Paparan layar</p>
                  <p className="text-xs text-[#737373] mt-0.5">10 jam · Butuh jeda</p>
                </div>
              </div>

              {/* Item 3: Pemulihan tidur */}
              <div className="flex items-center gap-3.5">
                <div className="w-12 h-12 rounded-2xl bg-[#BDE6F0] text-[#0369A1] flex items-center justify-center shrink-0 shadow-2xs">
                  <Moon className="w-5 h-5" />
                </div>
                <div className="min-w-0">
                  <p className="font-bold text-sm text-[#1A1A1A] leading-tight">Pemulihan tidur</p>
                  <p className="text-xs text-[#737373] mt-0.5">6 jam dari target 8 jam</p>
                </div>
              </div>
            </div>
          </div>

          {/* CARD 2: Sedikit lebih baik, hari ini. */}
          <div className="bg-[#F2F8EE] rounded-[1.75rem] p-6 border border-[#E2EED8] space-y-5">
            <h2 className="font-heading font-extrabold text-base sm:text-lg text-[#1A1A1A]">
              Sedikit lebih baik, hari ini.
            </h2>

            <div className="space-y-4">
              {/* Step 01 */}
              <div className="flex items-start gap-3.5">
                <div className="w-9 h-9 rounded-full bg-[#CDE8B5] text-[#1A1A1A] font-extrabold text-xs flex items-center justify-center shrink-0 mt-0.5 shadow-2xs">
                  01
                </div>
                <div className="min-w-0">
                  <p className="font-bold text-sm text-[#1A1A1A] leading-tight">Ambil 2 jeda aktif</p>
                  <p className="text-xs text-[#737373] mt-0.5 leading-relaxed">
                    Peregangan singkat di sela tugas.
                  </p>
                </div>
              </div>

              {/* Step 02 */}
              <div className="flex items-start gap-3.5">
                <div className="w-9 h-9 rounded-full bg-[#CDE8B5] text-[#1A1A1A] font-extrabold text-xs flex items-center justify-center shrink-0 mt-0.5 shadow-2xs">
                  02
                </div>
                <div className="min-w-0">
                  <p className="font-bold text-sm text-[#1A1A1A] leading-tight">Jalan santai 20 menit</p>
                  <p className="text-xs text-[#737373] mt-0.5 leading-relaxed">
                    Bergerak tanpa melihat layar.
                  </p>
                </div>
              </div>

              {/* Step 03 */}
              <div className="flex items-start gap-3.5">
                <div className="w-9 h-9 rounded-full bg-[#CDE8B5] text-[#1A1A1A] font-extrabold text-xs flex items-center justify-center shrink-0 mt-0.5 shadow-2xs">
                  03
                </div>
                <div className="min-w-0">
                  <p className="font-bold text-sm text-[#1A1A1A] leading-tight">Tidur lebih awal</p>
                  <p className="text-xs text-[#737373] mt-0.5 leading-relaxed">
                    Tambah 2 jam untuk capai target.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* CARD 3: Ruang aman untuk bercerita */}
          <div className="bg-[#BDE6F0] rounded-[1.75rem] p-6 border border-[#A9DFEC] space-y-2">
            <div className="w-7 h-7 flex items-center justify-center text-[#1A1A1A]">
              <ShieldCheck className="w-6 h-6 stroke-[2]" />
            </div>
            <h3 className="font-heading font-extrabold text-sm text-[#1A1A1A] pt-0.5">
              Ruang aman untuk bercerita
            </h3>
            <p className="text-xs text-[#1A1A1A] leading-relaxed">
              AI Coach bukan diagnosis atau pengganti tenaga profesional. Saat butuh, bantuan manusia
              selalu penting.
            </p>
          </div>
        </div>

        {/* --------------------------------------------------------
            RIGHT COLUMN: CHAT PANEL
            -------------------------------------------------------- */}
        <div className="lg:col-span-8 bg-white rounded-[1.75rem] shadow-xs border border-[#F0F0F0] overflow-hidden flex flex-col">
          {/* Header Chat Panel */}
          <div className="bg-[#BDE6F0] px-6 py-4 flex items-center justify-between border-b border-[#A9DFEC]">
            <div className="flex items-center gap-3">
              <Heart className="w-6 h-6 text-[#1A1A1A] stroke-[2]" />
              <div>
                <h3 className="font-heading font-extrabold text-base text-[#1A1A1A] leading-tight">
                  Wellbeing AI Coach
                </h3>
                <p className="text-xs text-[#525252] mt-0.5">Pendamping ritme sehatmu</p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleResetSession}
                className="px-3.5 py-1.5 rounded-full bg-white/90 hover:bg-white text-xs font-bold text-[#1A1A1A] transition-colors flex items-center gap-1.5 shadow-2xs active:scale-95"
                title="Reset sesi obrolan"
              >
                <RotateCcw className="w-3.5 h-3.5 text-[#525252]" />
                <span>Reset</span>
              </button>

              <span className="px-3.5 py-1.5 rounded-full bg-white/90 text-xs font-semibold text-[#1A1A1A] shadow-2xs">
                Hari ini
              </span>
            </div>
          </div>

          {/* Chat Messages Body */}
          <div className="p-6 space-y-5 flex-1 overflow-y-auto max-h-[580px]">
            {messages.length === 0 ? (
              /* Hero State */
              <div className="py-8 px-2 sm:px-6 flex flex-col items-center justify-center text-center space-y-5 animate-in fade-in zoom-in-95 duration-200">
                <div>
                  <h3 className="font-heading font-extrabold text-2xl sm:text-3xl text-[#1A1A1A]">
                    Selamat {getTimeOfDayGreeting()}, {userName}
                  </h3>
                  <p className="text-xs sm:text-sm text-[#737373] mt-1.5 max-w-md mx-auto leading-relaxed">
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
                      className="w-full bg-white hover:bg-[#F2F8EE] border border-[#E5E5E5] hover:border-[#CDE8B5] rounded-2xl p-3.5 sm:p-4 flex items-center justify-between gap-3 transition-all shadow-2xs group active:scale-[0.99] disabled:opacity-50"
                    >
                      <div className="flex items-center gap-3.5 min-w-0">
                        <div className="w-9 h-9 rounded-xl bg-[#F6F6F6] group-hover:bg-white text-[#1A1A1A] flex items-center justify-center shrink-0 border border-transparent group-hover:border-[#E0E0E0] shadow-2xs transition-colors">
                          {rec.icon}
                        </div>
                        <span className="text-xs sm:text-sm font-semibold text-[#1A1A1A] group-hover:text-black">
                          {rec.prompt}
                        </span>
                      </div>
                      <ArrowRight className="w-4 h-4 text-[#9A9A9A] group-hover:text-[#1A1A1A] shrink-0 transition-colors" />
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              <>
                {/* Timestamp Separator */}
                <div className="text-center">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-[#9A9A9A]">
                    17 NOVEMBER · 17.10
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
                        className={`text-sm leading-relaxed ${isUser
                          ? "bg-[#E5F5D9] text-[#1A1A1A] rounded-2xl sm:rounded-3xl p-4 max-w-lg shadow-2xs"
                          : "bg-[#F2F2F2] text-[#1A1A1A] rounded-2xl sm:rounded-3xl p-5 max-w-xl shadow-2xs"
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
                    <div className="bg-[#F2F2F2] rounded-2xl px-4 py-3 flex items-center gap-1.5 shadow-2xs">
                      <span className="w-2 h-2 rounded-full bg-[#9A9A9A] animate-pulse" />
                      <span className="w-2 h-2 rounded-full bg-[#9A9A9A] animate-pulse delay-150" />
                      <span className="w-2 h-2 rounded-full bg-[#9A9A9A] animate-pulse delay-300" />
                    </div>
                  </div>
                )}
                <div ref={chatEndRef} />
              </>
            )}
          </div>

          {/* Quick Prompt Recommendations: only shown before user chats or clicks a recommendation */}
          {!hasChatted && (
            <div className="px-6 py-3 bg-[#FAFAF8] border-t border-[#F0F0F0] space-y-2 animate-in fade-in duration-150">
              <div className="space-y-1.5 max-h-[190px] overflow-y-auto pr-1">
                {CHAT_RECOMMENDATIONS.map((rec) => (
                  <button
                    key={rec.id}
                    type="button"
                    onClick={() => handleSendQuickPrompt(rec.prompt)}
                    disabled={isTyping}
                    className="w-full bg-white hover:bg-[#F2F8EE] border border-[#E5E5E5] hover:border-[#CDE8B5] rounded-xl p-2.5 sm:py-3 sm:px-3.5 flex items-center justify-between gap-3 text-left transition-all shadow-2xs group active:scale-[0.99] disabled:opacity-50"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-7 h-7 rounded-lg bg-[#F6F6F6] group-hover:bg-white text-[#1A1A1A] flex items-center justify-center shrink-0 border border-transparent group-hover:border-[#E0E0E0] shadow-2xs transition-colors">
                        {rec.icon}
                      </div>
                      <span className="text-xs sm:text-sm font-semibold text-[#1A1A1A] truncate group-hover:text-black">
                        {rec.prompt}
                      </span>
                    </div>
                    <ArrowRight className="w-3.5 h-3.5 text-[#9A9A9A] group-hover:text-[#1A1A1A] shrink-0 transition-colors" />
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Chat Input Bar */}
          <div className="px-6 pb-6 pt-2 border-t border-[#F0F0F0]">
            <form
              onSubmit={handleSendMessage}
              className="flex items-center gap-2 bg-white rounded-full border border-[#E0E0E0] pl-5 pr-2 py-2 focus-within:border-[#1A1A1A] transition-colors shadow-2xs"
            >
              <input
                type="text"
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                placeholder="Ceritakan yang sedang kamu rasakan..."
                className="flex-1 bg-transparent text-xs sm:text-sm text-[#1A1A1A] placeholder-[#9A9A9A] focus:outline-none"
              />
              <button
                type="submit"
                disabled={!inputText.trim() || isTyping}
                className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-[#1A1A1A] hover:bg-black text-white flex items-center justify-center transition-colors active:scale-95 shrink-0 disabled:opacity-40"
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
