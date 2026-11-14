import React, { useEffect, useState } from "react";
import {
  Bot,
  CheckCircle,
  Sparkles,
  Moon,
  Footprints,
  Armchair,
  ArrowRight,
  Send,
  HelpCircle,
  BookOpen,
  Compass,
  HeartPulse,
  Flame,
} from "lucide-react";
import { api } from "@/lib/api";
import { MOCK_AI_COACH } from "@/mocks/campusflowMock";
import type { AiCoachingInsightDTO } from "@/types";

interface CoachViewProps {
  onNavigateToFocus?: () => void;
  onNavigateToActivity?: (subTab?: "pedometer" | "checkin") => void;
  onStartPanicRelief?: () => void;
}

interface ChatMessage {
  id: string;
  sender: "user" | "coach";
  text: string;
  time: string;
}

const PRESET_QUESTIONS = [
  {
    q: "Bagaimana cara mengatasi rasa kantuk di kelas siang?",
    a: "Rasa kantuk siang (post-lunch dip) umumnya dipicu oleh dehidrasi dan duduk pasif. Cobalah minum 1 gelas air putih dingin, lakukan jalan santai 5 menit di lorong kampus untuk menaikkan denyut nadi, dan hindari makan siang dengan karbohidrat olahan terlalu tinggi.",
  },
  {
    q: "Berapa target langkah ideal untuk mahasiswa?",
    a: "Target minimal WHO setara 600 MET-menit (sekitar 5.000–7.500 langkah/hari). Untuk mahasiswa yang banyak duduk di perpustakaan atau lab, menargetkan 7.500–10.000 langkah membantu menyeimbangkan metabolisme dan menjaga kejernihan berpikir.",
  },
  {
    q: "Peregangan apa yang paling cepat meredakan pegal leher?",
    a: "Lakukan 'Chin Tuck' (tarik dagu ke belakang perlahan selama 5 detik) dan 'Overhead Reach' (rentangkan kedua tangan lurus ke atas kepala sambil menarik napas dalam). Gerakan ini membuka otot dada depan dan meregangkan leher atas yang condong ke layar.",
  },
  {
    q: "Kenapa tidur 6 jam bikin gampang stres dibanding 7.5 jam?",
    a: "Fase tidur REM (Rapid Eye Movement) yang memproses emosi dan stres terjadi lebih dominan di jam ke-6 hingga ke-8 tidur. Kehilangan 1.5 jam fase ini menurunkan daya tahan emosional korteks prefrontal hingga 40%.",
  },
];

export const CoachView: React.FC<CoachViewProps> = ({
  onNavigateToFocus,
  onNavigateToActivity,
  onStartPanicRelief,
}) => {
  const [insight, setInsight] = useState<AiCoachingInsightDTO>(MOCK_AI_COACH.data);
  const [completed, setCompleted] = useState<boolean>(() => {
    return localStorage.getItem("cf_coach_completed_today") === "true";
  });
  const [claimToast, setClaimToast] = useState<boolean>(false);

  // Mini Interactive Coach Consultation
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: "welcome",
      sender: "coach",
      text: "Halo! Saya AI Coach kesehatan Anda. Berdasarkan pola 7 hari terakhir, kualitas tidur dan waktu gerak Anda adalah kunci menjaga energi hari ini. Ada yang ingin Anda diskusikan?",
      time: "Baru saja",
    },
  ]);
  const [inputQuestion, setInputQuestion] = useState("");
  const [isTyping, setIsTyping] = useState(false);

  useEffect(() => {
    api
      .getAiCoachInsight()
      .then((res) => {
        if (res?.data) {
          setInsight(res.data);
          const isSavedCompleted = localStorage.getItem("cf_coach_completed_today") === "true";
          setCompleted(res.data.isCompleted || isSavedCompleted);
        }
      })
      .catch((err) => {
        console.warn("Gagal memuat AI Coach dari server, menggunakan data lokal:", err);
        // Fallback anggun ke MOCK_AI_COACH agar pengguna tidak pernah terjebak loading
        setInsight(MOCK_AI_COACH.data);
      });
  }, []);

  const handleClaimMission = () => {
    setCompleted(true);
    localStorage.setItem("cf_coach_completed_today", "true");
    setClaimToast(true);
    setTimeout(() => setClaimToast(false), 4000);
  };

  const handleAskPreset = (question: string, answer: string) => {
    const userMsg: ChatMessage = {
      id: Date.now().toString(),
      sender: "user",
      text: question,
      time: "Sekarang",
    };
    setMessages((prev) => [...prev, userMsg]);
    setIsTyping(true);

    setTimeout(() => {
      const coachMsg: ChatMessage = {
        id: (Date.now() + 1).toString(),
        sender: "coach",
        text: answer,
        time: "Sekarang",
      };
      setMessages((prev) => [...prev, coachMsg]);
      setIsTyping(false);
    }, 600);
  };

  const handleSendCustomQuestion = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputQuestion.trim() || isTyping) return;

    const q = inputQuestion.trim();
    setInputQuestion("");

    const userMsg: ChatMessage = {
      id: Date.now().toString(),
      sender: "user",
      text: q,
      time: "Sekarang",
    };
    setMessages((prev) => [...prev, userMsg]);
    setIsTyping(true);

    setTimeout(() => {
      // Respons cerdas kontekstual mahasiswa
      let reply =
        "Pertanyaan yang bagus! Kunci menjaga fokus belajar adalah menjaga ritme jeda 50 menit duduk diimbangi 5 menit jalan atau peregangan ringan. Pastikan juga asupan air mineral cukup agar sirkulasi oksigen ke otak optimal.";
      
      const lower = q.toLowerCase();
      if (lower.includes("tidur") || lower.includes("insomnia") || lower.includes("begadang")) {
        reply =
          "Jika Anda terpaksa tidur larut malam, usahakan tidur minimal 1.5 jam (1 siklus tidur penuh) dan hindari layar HP 20 menit sebelum memejamkan mata. Sore nanti, luangkan jalan santai 15 menit untuk merangsang produksi melatonin alami malam hari.";
      } else if (lower.includes("pegal") || lower.includes("punggung") || lower.includes("postur") || lower.includes("leher")) {
        reply =
          "Pegal di leher dan punggung biasanya akibat monitor terlalu rendah atau posisi kepala maju (forward head posture). Pastikan layar sejajar dengan mata dan manfaatkan fitur Kamera Deteksi Duduk di tab Fokus.";
      } else if (lower.includes("stres") || lower.includes("cemas") || lower.includes("panik") || lower.includes("tugas")) {
        reply =
          "Saat stres tugas menumpuk, sistem saraf simpatis bekerja berlebihan. Luangkan 1 menit untuk latihan pernapasan rileks (tarik napas 4 detik, tahan 7 detik, hembuskan 8 detik) pada fitur Redakan Panik.";
      } else if (lower.includes("langkah") || lower.includes("jalan") || lower.includes("olahraga")) {
        reply =
          "Untuk mahasiswa, langkah harian tidak harus dilakukan sekaligus di gym. Berjalan kaki antar gedung kuliah atau naik tangga 2 lantai sudah menyumbang 100-200 MET-menit energi gerak yang signifikan.";
      }

      const coachMsg: ChatMessage = {
        id: (Date.now() + 1).toString(),
        sender: "coach",
        text: reply,
        time: "Sekarang",
      };
      setMessages((prev) => [...prev, coachMsg]);
      setIsTyping(false);
    }, 800);
  };

  return (
    <div className="space-y-6 max-w-3xl mx-auto pb-12">
      {/* Toast Notifikasi Sukses Klaim XP */}
      {claimToast && (
        <div className="fixed top-5 right-5 z-50 bg-[#1A1A1A] text-white px-5 py-3 rounded-2xl shadow-xl flex items-center gap-3 animate-bounce">
          <div className="w-7 h-7 rounded-xl bg-[#CDE8B5] text-[#1A1A1A] flex items-center justify-center font-bold text-xs">
            +50
          </div>
          <div>
            <p className="text-xs font-bold">Misi Harian Berhasil Diklaim!</p>
            <p className="text-[11px] text-gray-300">Poin XP telah ditambahkan ke riwayat profil Anda.</p>
          </div>
        </div>
      )}

      {/* 1. Header Banner */}
      <div className="learnova-card p-6 border-[#E8E8E8] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-[#BDE6F0] text-[#1A1A1A] flex items-center justify-center shrink-0 shadow-xs border border-[#A7DBE7]">
            <Bot className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="font-heading font-extrabold text-xl text-[#1A1A1A]">
                Wellbeing AI Coach
              </h2>
              <span className="bg-[#CDE8B5] text-[#1A1A1A] text-[10px] font-extrabold px-2 py-0.5 rounded-full border border-[#B6DF97]">
                Aktif Hari Ini
              </span>
            </div>
            <p className="text-xs text-[#9A9A9A] mt-0.5">
              Saran kesehatan harian berbasis pola aktivitas &amp; kualitas tidur Anda selama 7 hari terakhir.
            </p>
          </div>
        </div>
      </div>

      {/* 2. Main Diagnostic & Action Plan Card */}
      <div className="learnova-card p-6 space-y-5 border-[#E8E8E8]">
        {/* Diagnosis Header & Alert Pill */}
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-extrabold uppercase tracking-wider text-[#1A1A1A] bg-[#FFF29A] px-2.5 py-1 rounded-lg border border-[#FFE966]">
              Diagnosis Kebugaran
            </span>
            <span className="text-xs text-[#9A9A9A] font-medium">
              Analisis Komprehensif Triad Mahasiswa
            </span>
          </div>
          <h3 className="font-heading font-bold text-base sm:text-lg text-[#1A1A1A] leading-snug">
            {insight.diagnosisSummary}
          </h3>
        </div>

        {/* 3 Indikator Status Pilar Kesehatan Hari Ini */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
          {/* Pilar Tidur */}
          <div className="p-3.5 rounded-2xl bg-[#C9B3E6]/25 border border-[#C9B3E6] space-y-1.5">
            <div className="flex items-center justify-between text-xs font-bold text-[#1A1A1A]">
              <span className="flex items-center gap-1.5">
                <Moon className="w-4 h-4 text-[#8C6BB8]" />
                Tidur Semalam
              </span>
              <span className="text-[11px] bg-white/80 px-2 py-0.5 rounded-md font-extrabold">
                6.5 Jam
              </span>
            </div>
            <p className="text-[11px] text-[#555] leading-snug">
              Kurang ~1 jam dari target ideal 7.5 jam. Perlu regenerasi kognitif malam ini.
            </p>
          </div>

          {/* Pilar Gerak/Aktivitas */}
          <div className="p-3.5 rounded-2xl bg-[#CDE8B5]/30 border border-[#CDE8B5] space-y-1.5">
            <div className="flex items-center justify-between text-xs font-bold text-[#1A1A1A]">
              <span className="flex items-center gap-1.5">
                <Footprints className="w-4 h-4 text-[#5D8E38]" />
                Energi Gerak
              </span>
              <span className="text-[11px] bg-white/80 px-2 py-0.5 rounded-md font-extrabold">
                850 Poin
              </span>
            </div>
            <p className="text-[11px] text-[#555] leading-snug">
              Butuh tambahan ~240 poin jalan santai sore untuk seimbangkan waktu duduk.
            </p>
          </div>

          {/* Pilar Waktu Duduk */}
          <div className="p-3.5 rounded-2xl bg-[#FFF29A]/30 border border-[#FFF29A] space-y-1.5">
            <div className="flex items-center justify-between text-xs font-bold text-[#1A1A1A]">
              <span className="flex items-center gap-1.5">
                <Armchair className="w-4 h-4 text-[#A8881A]" />
                Waktu Duduk
              </span>
              <span className="text-[11px] bg-white/80 px-2 py-0.5 rounded-md font-extrabold">
                4.8 Jam
              </span>
            </div>
            <p className="text-[11px] text-[#555] leading-snug">
              Potensi pegal leher &amp; bahu. Wajib jeda peregangan tiap 50 menit.
            </p>
          </div>
        </div>

        {/* Isotemporal Action Plan Card (Mint Green Card Accent) */}
        <div className="bg-[#CDE8B5]/35 rounded-2xl p-5 border border-[#CDE8B5] space-y-3">
          <div className="flex items-center justify-between">
            <div className="text-xs font-bold text-[#1A1A1A] uppercase tracking-wider flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-[#446A27]" />
              <span>Rencana Sehat &amp; Jeda Aktif Hari Ini</span>
            </div>
            <span className="text-xs font-extrabold text-[#1A1A1A] bg-white/80 px-2.5 py-0.5 rounded-lg border border-[#B6DF97]">
              Misi Harian
            </span>
          </div>

          <p className="text-xs sm:text-sm font-semibold text-[#1A1A1A] leading-relaxed">
            {insight.isotemporalActionPlan}
          </p>

          <div className="pt-1 flex flex-wrap items-center gap-2 text-xs text-[#1A1A1A] font-bold">
            <span className="bg-[#CDE8B5] px-2.5 py-1 rounded-lg border border-[#B6DF97]">
              Target Tambahan: ~{insight.recommendedMetsToday} Poin Gerak
            </span>
            <span className="text-[11px] text-[#555] font-normal">
              (Setara jalan santai ~45 menit atau 2 sesi peregangan aktif)
            </span>
          </div>

          {/* Catatan Dasar Riset & Ilmiah */}
          {insight.scientificCitationNote && (
            <div className="pt-2 border-t border-[#CDE8B5]/60 flex items-start gap-2 text-[11px] text-[#555] leading-snug">
              <BookOpen className="w-3.5 h-3.5 mt-0.5 shrink-0 text-[#446A27]" />
              <span>
                <strong>Dasar Analisis:</strong> {insight.scientificCitationNote}
              </span>
            </div>
          )}
        </div>

        {/* Completion Claim Button */}
        <button
          onClick={handleClaimMission}
          disabled={completed}
          className={`w-full py-3.5 rounded-2xl font-extrabold text-xs sm:text-sm transition-all flex items-center justify-center gap-2 shadow-xs cursor-pointer ${
            completed
              ? "bg-[#CDE8B5] text-[#1A1A1A] border border-[#B6DF97] shadow-none cursor-default"
              : "bg-[#FFF29A] hover:bg-[#FFE966] text-[#1A1A1A] border border-[#FFE966] shadow-softPill"
          }`}
        >
          {completed ? (
            <>
              <CheckCircle className="w-4 h-4 text-[#1A1A1A]" />
              Misi Telah Diselesaikan Hari Ini (+50 XP Didapat)
            </>
          ) : (
            <>
              <Flame className="w-4 h-4 text-[#1A1A1A] fill-[#1A1A1A]" />
              Selesaikan Misi &amp; Klaim +50 XP
            </>
          )}
        </button>
      </div>

      {/* 3. Quick Action Shortcuts (Pintasan Aksi Cepat) */}
      <div className="space-y-3">
        <h3 className="font-heading font-extrabold text-sm text-[#1A1A1A] flex items-center gap-2">
          <Compass className="w-4 h-4" />
          <span>Aksi Cepat Mendukung Misi Hari Ini</span>
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {/* Shortcut 1: Vision Focus */}
          <button
            onClick={onNavigateToFocus}
            className="learnova-card p-4 text-left border-[#E8E8E8] hover:border-[#1A1A1A] transition-all group flex flex-col justify-between"
          >
            <div>
              <div className="w-9 h-9 rounded-xl bg-[#FFF29A] text-[#1A1A1A] flex items-center justify-center mb-2.5 border border-[#FFE966]">
                <Armchair className="w-5 h-5" />
              </div>
              <h4 className="font-bold text-xs sm:text-sm text-[#1A1A1A]">
                Sesi Fokus &amp; Postur
              </h4>
              <p className="text-[11px] text-[#9A9A9A] mt-1 leading-snug">
                Deteksi slouching &amp; jeda peregangan anti-curang via kamera AI.
              </p>
            </div>
            <div className="mt-3 flex items-center gap-1 text-[11px] font-bold text-[#1A1A1A] group-hover:translate-x-1 transition-transform">
              <span>Buka Fokus</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </div>
          </button>

          {/* Shortcut 2: Pedometer */}
          <button
            onClick={() => onNavigateToActivity?.("pedometer")}
            className="learnova-card p-4 text-left border-[#E8E8E8] hover:border-[#1A1A1A] transition-all group flex flex-col justify-between"
          >
            <div>
              <div className="w-9 h-9 rounded-xl bg-[#CDE8B5] text-[#1A1A1A] flex items-center justify-center mb-2.5 border border-[#B6DF97]">
                <Footprints className="w-5 h-5" />
              </div>
              <h4 className="font-bold text-xs sm:text-sm text-[#1A1A1A]">
                Hitung Langkah HP
              </h4>
              <p className="text-[11px] text-[#9A9A9A] mt-1 leading-snug">
                Pantau jumlah langkah &amp; poin energi jalan kaki di kampus.
              </p>
            </div>
            <div className="mt-3 flex items-center gap-1 text-[11px] font-bold text-[#1A1A1A] group-hover:translate-x-1 transition-transform">
              <span>Buka Pedometer</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </div>
          </button>

          {/* Shortcut 3: Panic Relief */}
          <button
            onClick={onStartPanicRelief}
            className="learnova-card p-4 text-left border-[#E8E8E8] hover:border-[#1A1A1A] transition-all group flex flex-col justify-between"
          >
            <div>
              <div className="w-9 h-9 rounded-xl bg-[#F7A8B0] text-[#1A1A1A] flex items-center justify-center mb-2.5 border border-[#EE929C]">
                <HeartPulse className="w-5 h-5" />
              </div>
              <h4 className="font-bold text-xs sm:text-sm text-[#1A1A1A]">
                Redakan Panik 60 Detik
              </h4>
              <p className="text-[11px] text-[#9A9A9A] mt-1 leading-snug">
                Pernapasan terpadu 4-7-8 untuk menenangkan detak jantung dan pikiran.
              </p>
            </div>
            <div className="mt-3 flex items-center gap-1 text-[11px] font-bold text-[#1A1A1A] group-hover:translate-x-1 transition-transform">
              <span>Mulai Rileks</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </div>
          </button>
        </div>
      </div>

      {/* 4. Konsultasi Tanya AI Coach Interaktif */}
      <div className="learnova-card p-6 border-[#E8E8E8] space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <HelpCircle className="w-4 h-4 text-[#1A1A1A]" />
            <h3 className="font-heading font-extrabold text-sm text-[#1A1A1A]">
              Tanya AI Coach (Konsultasi Cepat Kebugaran)
            </h3>
          </div>
          <span className="text-[11px] text-[#9A9A9A]">
            Respons Instan &amp; Empatik
          </span>
        </div>

        {/* Preset FAQ Chips */}
        <div className="space-y-1.5">
          <p className="text-[11px] text-[#9A9A9A] font-semibold">
            Pilih pertanyaan umum mahasiswa:
          </p>
          <div className="flex flex-wrap gap-2">
            {PRESET_QUESTIONS.map((item, idx) => (
              <button
                key={idx}
                onClick={() => handleAskPreset(item.q, item.a)}
                className="text-[11px] font-medium bg-[#F6F6F6] hover:bg-[#FFF29A] text-[#1A1A1A] px-3 py-1.5 rounded-xl border border-[#E8E8E8] transition-colors text-left"
              >
                {item.q}
              </button>
            ))}
          </div>
        </div>

        {/* Conversation Stream */}
        <div className="p-4 rounded-2xl bg-[#F6F6F6] border border-[#E8E8E8] max-h-72 overflow-y-auto space-y-3">
          {messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex flex-col ${
                msg.sender === "user" ? "items-end" : "items-start"
              }`}
            >
              <div
                className={`max-w-[85%] p-3.5 rounded-2xl text-xs leading-relaxed ${
                  msg.sender === "user"
                    ? "bg-[#FFF29A] text-[#1A1A1A] border border-[#FFE966] rounded-br-none font-medium"
                    : "bg-white text-[#1A1A1A] border border-[#E8E8E8] rounded-bl-none shadow-xs"
                }`}
              >
                {msg.text}
              </div>
              <span className="text-[10px] text-[#9A9A9A] mt-1 px-1">
                {msg.time}
              </span>
            </div>
          ))}

          {isTyping && (
            <div className="flex items-center gap-2 text-xs text-[#9A9A9A] italic p-2">
              <Bot className="w-3.5 h-3.5 animate-spin" />
              <span>AI Coach sedang merumuskan jawaban...</span>
            </div>
          )}
        </div>

        {/* Chat Input Box */}
        <form onSubmit={handleSendCustomQuestion} className="flex gap-2">
          <input
            type="text"
            value={inputQuestion}
            onChange={(e) => setInputQuestion(e.target.value)}
            placeholder="Tanyakan hal seputar tidur, rasa lelah, atau tips fokus belajar..."
            className="flex-1 bg-[#F6F6F6] border border-[#E8E8E8] rounded-2xl px-4 py-2.5 text-xs text-[#1A1A1A] placeholder-[#9A9A9A] focus:outline-none focus:border-[#1A1A1A] transition-colors"
          />
          <button
            type="submit"
            disabled={!inputQuestion.trim() || isTyping}
            className="px-4 py-2.5 rounded-2xl bg-[#1A1A1A] hover:bg-[#333] text-white text-xs font-bold transition-all disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-1.5 shadow-xs"
          >
            <span>Kirim</span>
            <Send className="w-3 h-3" />
          </button>
        </form>
      </div>
    </div>
  );
};
