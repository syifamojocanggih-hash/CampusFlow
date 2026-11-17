import React, { useState } from "react";
import { PedometerCard } from "@/components/sensor/PedometerCard";
import { CheckinView } from "@/components/pages/CheckinView";
import { Footprints, ClipboardCheck, Flame, Calendar } from "lucide-react";

interface ActivityViewProps {
  defaultSubTab?: "pedometer" | "checkin";
}

const WEEK_DAYS = [
  { day: "Sen", date: "16 Nov", isCompleted: true, isToday: false },
  { day: "Sel", date: "17 Nov", isCompleted: true, isToday: true },
  { day: "Rab", date: "18 Nov", isCompleted: false, isToday: false },
  { day: "Kam", date: "19 Nov", isCompleted: false, isToday: false },
  { day: "Jum", date: "20 Nov", isCompleted: false, isToday: false },
  { day: "Sab", date: "21 Nov", isCompleted: false, isToday: false },
  { day: "Min", date: "22 Nov", isCompleted: false, isToday: false },
];

export const ActivityView: React.FC<ActivityViewProps> = ({ defaultSubTab = "pedometer" }) => {
  const [subTab, setSubTab] = useState<"pedometer" | "checkin">(defaultSubTab);

  return (
    <div className="space-y-6 max-w-4xl mx-auto pb-10">
      {/* Header Banner */}
      <div className="learnova-card p-6 border-[#E8E8E8] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-[#BDE6F0] text-[#1A1A1A] flex items-center justify-center shrink-0 shadow-xs">
            {subTab === "pedometer" ? (
              <Footprints className="w-6 h-6" />
            ) : (
              <ClipboardCheck className="w-6 h-6" />
            )}
          </div>
          <div>
            <h2 className="font-heading font-extrabold text-xl text-[#1A1A1A]">
              {subTab === "pedometer"
                ? "Aktivitas Fisik & Penghitung Langkah"
                : "Kuis Kebugaran & Evaluasi Stres"}
            </h2>
            <p className="text-xs text-[#9A9A9A] mt-0.5">
              {subTab === "pedometer"
                ? "Hitung langkah harian otomatis menggunakan sensor HP saat Anda berjalan di kampus."
                : "Catat waktu tidur, waktu layar santai, dan tingkat stres untuk rekomendasi dari AI Coach."}
            </p>
          </div>
        </div>

        {/* Streak Pill */}
        <div className="flex items-center gap-2 bg-[#FFF29A] text-[#1A1A1A] px-3.5 py-1.5 rounded-full border border-[#FFE966] shadow-2xs text-xs font-extrabold shrink-0">
          <Flame className="w-4 h-4 fill-[#1A1A1A]" />
          <span>5 Hari Streak Konsisten</span>
        </div>
      </div>

      {/* SUPPORTING FEATURE: KALENDER STRIP KONSISTENSI 7 HARI */}
      <div className="learnova-card p-5 sm:p-6 border-[#E8E8E8] space-y-3.5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 border-b border-[#F0F0F0] pb-2.5">
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-[#1A1A1A]" />
            <h3 className="font-heading font-extrabold text-sm sm:text-base text-[#1A1A1A]">
              Konsistensi Kebiasaan Sehat Pekan Ini
            </h3>
          </div>
          <span className="text-[11px] text-[#9A9A9A]">
            Konsistensi Anda menjaga status maskot <strong>Mimi</strong> berkembang pesat.
          </span>
        </div>

        {/* 7-Day Strip */}
        <div className="grid grid-cols-7 gap-1.5 sm:gap-3">
          {WEEK_DAYS.map((item) => (
            <div
              key={item.day}
              className={`p-2.5 rounded-2xl text-center border transition-all ${
                item.isToday
                  ? "bg-[#FFF29A]/30 border-[#FFE966] shadow-2xs scale-102"
                  : item.isCompleted
                  ? "bg-[#CDE8B5]/20 border-[#CDE8B5]"
                  : "bg-[#FAFAFA] border-[#E8E8E8]"
              }`}
            >
              <div className="text-[10px] sm:text-xs font-bold text-[#737373]">
                {item.day}
              </div>
              <div className="text-[11px] sm:text-xs font-extrabold text-[#1A1A1A] my-0.5">
                {item.date.split(" ")[0]}
              </div>
              <div className="flex justify-center mt-1">
                {item.isCompleted ? (
                  <span className="w-5 h-5 rounded-full bg-[#CDE8B5] text-[#166534] flex items-center justify-center text-[10px] font-extrabold">
                    ✓
                  </span>
                ) : (
                  <span className="w-5 h-5 rounded-full border border-dashed border-[#D1D1D1] text-[9px] text-[#9A9A9A] flex items-center justify-center font-medium">
                    &bull;
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Segmented Sub-Tab Switcher (Keeps the page unified yet never crowded) */}
      <div className="flex items-center gap-2 p-1.5 bg-[#F6F6F6] rounded-2xl w-fit border border-[#E8E8E8]">
        <button
          type="button"
          onClick={() => setSubTab("pedometer")}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all duration-200 ${
            subTab === "pedometer"
              ? "bg-[#FFF29A] text-[#1A1A1A] font-extrabold shadow-sm border border-[#FFE966]"
              : "text-[#9A9A9A] hover:text-[#1A1A1A] hover:bg-white/60"
          }`}
        >
          <Footprints className="w-4 h-4" />
          <span>Aktivitas &amp; Pedometer</span>
        </button>

        <button
          type="button"
          onClick={() => setSubTab("checkin")}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all duration-200 ${
            subTab === "checkin"
              ? "bg-[#FFF29A] text-[#1A1A1A] font-extrabold shadow-sm border border-[#FFE966]"
              : "text-[#9A9A9A] hover:text-[#1A1A1A] hover:bg-white/60"
          }`}
        >
          <ClipboardCheck className="w-4 h-4" />
          <span>Kuis Evaluasi Diri</span>
        </button>
      </div>

      {/* Active Module Content */}
      <div className="transition-all duration-200">
        {subTab === "pedometer" ? (
          <div>
            <PedometerCard />
          </div>
        ) : (
          <CheckinView embedded={true} />
        )}
      </div>
    </div>
  );
};
