import React, { useEffect, useMemo, useState } from "react";
import { PedometerCard } from "@/components/sensor/PedometerCard";
import { CheckinView } from "@/components/pages/CheckinView";
import { Footprints, ClipboardCheck, Flame, Calendar } from "lucide-react";
import { api } from "@/lib/api";

interface ActivityViewProps {
  defaultSubTab?: "pedometer" | "checkin";
}

const SHORT_DAYS = ["Min", "Sen", "Sel", "Rab", "Kam", "Jum", "Sab"];
const SHORT_MONTHS = [
  "Jan", "Feb", "Mar", "Apr", "Mei", "Jun",
  "Jul", "Agu", "Sep", "Okt", "Nov", "Des",
];

export const ActivityView: React.FC<ActivityViewProps> = ({ defaultSubTab = "pedometer" }) => {
  const [subTab, setSubTab] = useState<"pedometer" | "checkin">(defaultSubTab);
  const [streakDays, setStreakDays] = useState<number>(1);
  const [completedDates, setCompletedDates] = useState<Set<string>>(() => {
    const todayIso = new Date().toISOString().slice(0, 10);
    return new Set([todayIso]);
  });

  useEffect(() => {
    api
      .getTriadDashboard(7)
      .then((res) => {
        if (typeof res.data?.weeklySummary?.currentStreakDays === "number") {
          setStreakDays(res.data.weeklySummary.currentStreakDays);
        }
        if (Array.isArray(res.data?.history)) {
          const dates = new Set<string>();
          for (const item of res.data.history) {
            if (item.logDate) dates.add(item.logDate.slice(0, 10));
          }
          setCompletedDates(dates);
        }
      })
      .catch(() => {});
  }, [subTab]);

  // Hitung 7 hari pekan berjalan secara dinamis berdasarkan tanggal hari ini
  const weekDays = useMemo(() => {
    const now = new Date();
    const currentDay = now.getDay(); // 0=Min, 1=Sen, ...
    const mondayOffset = currentDay === 0 ? -6 : 1 - currentDay;
    const monday = new Date(now);
    monday.setDate(now.getDate() + mondayOffset);
    const todayIso = now.toISOString().slice(0, 10);

    return Array.from({ length: 7 }).map((_, idx) => {
      const d = new Date(monday);
      d.setDate(monday.getDate() + idx);
      const iso = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(
        d.getDate()
      ).padStart(2, "0")}`;
      return {
        day: SHORT_DAYS[d.getDay()],
        date: `${d.getDate()} ${SHORT_MONTHS[d.getMonth()]}`,
        isCompleted: completedDates.has(iso),
        isToday: iso === todayIso,
      };
    });
  }, [completedDates]);

  return (
    <div className="space-y-6 max-w-4xl mx-auto pb-10">
      {/* Header Banner */}
      <div className="learnova-card p-6 border-[#E6D7C8] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-[#98C5E2] text-[#1A1A1A] flex items-center justify-center shrink-0 shadow-xs">
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
            <p className="text-xs text-[#6E5D4F] mt-0.5">
              {subTab === "pedometer"
                ? "Hitung langkah harian otomatis menggunakan sensor HP saat Anda berjalan di kampus."
                : "Catat waktu tidur, waktu layar santai, dan tingkat stres untuk rekomendasi dari AI Coach."}
            </p>
          </div>
        </div>

        {/* Streak Pill */}
        <div className="flex items-center gap-2 bg-[#FDECD8] text-[#1A1A1A] px-3.5 py-1.5 rounded-full border border-[#E5C19A] shadow-2xs text-xs font-extrabold shrink-0">
          <Flame className="w-4 h-4 fill-[#1A1A1A]" />
          <span>{streakDays} Hari Streak Konsisten</span>
        </div>
      </div>

      {/* SUPPORTING FEATURE: KALENDER STRIP KONSISTENSI 7 HARI */}
      <div className="learnova-card p-5 sm:p-6 border-[#E6D7C8] space-y-3.5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 border-b border-[#F5ECE2] pb-2.5">
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-[#1A1A1A]" />
            <h3 className="font-heading font-extrabold text-sm sm:text-base text-[#1A1A1A]">
              Konsistensi Kebiasaan Sehat Pekan Ini
            </h3>
          </div>
          <span className="text-[11px] text-[#6E5D4F]">
            Konsistensi Anda menjaga status maskot <strong>Mimi</strong> berkembang pesat.
          </span>
        </div>

        {/* 7-Day Strip */}
        <div className="grid grid-cols-7 gap-1.5 sm:gap-3">
          {weekDays.map((item) => (
            <div
              key={item.day}
              className={`p-2.5 rounded-2xl text-center border transition-all ${
                item.isToday
                  ? "bg-[#FDECD8]/30 border-[#E5C19A] shadow-2xs scale-102"
                  : item.isCompleted
                  ? "bg-[#98C5E2]/20 border-[#98C5E2]"
                  : "bg-[#F5ECE2] border-[#E6D7C8]"
              }`}
            >
              <div className="text-[10px] sm:text-xs font-bold text-[#6E5D4F]">
                {item.day}
              </div>
              <div className="text-[11px] sm:text-xs font-extrabold text-[#1A1A1A] my-0.5">
                {item.date.split(" ")[0]}
              </div>
              <div className="flex justify-center mt-1">
                {item.isCompleted ? (
                  <span className="w-5 h-5 rounded-full bg-[#98C5E2] text-[#1E4E6E] flex items-center justify-center text-[10px] font-extrabold">
                    ✓
                  </span>
                ) : (
                  <span className="w-5 h-5 rounded-full border border-dashed border-[#E6D7C8] text-[9px] text-[#6E5D4F] flex items-center justify-center font-medium">
                    &bull;
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Segmented Sub-Tab Switcher (Keeps the page unified yet never crowded) */}
      <div className="flex items-center gap-2 p-1.5 bg-[#FAF5EF] rounded-2xl w-fit border border-[#E6D7C8]">
        <button
          type="button"
          onClick={() => setSubTab("pedometer")}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all duration-200 ${
            subTab === "pedometer"
              ? "bg-[#FDECD8] text-[#1A1A1A] font-extrabold shadow-sm border border-[#E5C19A]"
              : "text-[#6E5D4F] hover:text-[#1A1A1A] hover:bg-white/60"
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
              ? "bg-[#FDECD8] text-[#1A1A1A] font-extrabold shadow-sm border border-[#E5C19A]"
              : "text-[#6E5D4F] hover:text-[#1A1A1A] hover:bg-white/60"
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
