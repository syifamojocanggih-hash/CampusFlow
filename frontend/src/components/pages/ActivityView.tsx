import React, { useEffect, useMemo, useState } from "react";
import { PedometerCard } from "@/components/sensor/PedometerCard";
import { CheckinView } from "@/components/pages/CheckinView";
import { Footprints, ClipboardCheck, Calendar } from "lucide-react";
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
  const [completedDates, setCompletedDates] = useState<Set<string>>(() => {
    const todayIso = new Date().toISOString().slice(0, 10);
    return new Set([todayIso]);
  });

  useEffect(() => {
    api
      .getTriadDashboard(7)
      .then((res) => {
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

  const weeklyConsistencyCard = (
    <div className="learnova-card p-5 sm:p-6 border-[#E8DDCF] space-y-3.5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 border-b border-[#E8DDCF] pb-2.5">
        <div className="flex items-center gap-2">
          <Calendar className="w-4 h-4 text-[#2F3A2E]" />
          <h3 className="font-heading font-extrabold text-sm sm:text-base text-[#2F3A2E]">
            Konsistensi Kebiasaan Sehat Pekan Ini
          </h3>
        </div>
      </div>

      {/* 7-Day Strip */}
      <div className="grid grid-cols-7 gap-1.5 sm:gap-3">
        {weekDays.map((item) => (
          <div
            key={item.day}
            className={`p-2.5 rounded-2xl text-center border transition-all ${
              item.isToday
                ? "bg-[#CFD8C4]/30 border-[#BCC8AE] shadow-2xs scale-102"
                : item.isCompleted
                ? "bg-[#CFD8C4]/20 border-[#CFD8C4]"
                : "bg-[#FAF6F0] border-[#E8DDCF]"
            }`}
          >
            <div className="text-[10px] sm:text-xs font-bold text-[#636B60]">
              {item.day}
            </div>
            <div className="text-[11px] sm:text-xs font-extrabold text-[#2F3A2E] my-0.5">
              {item.date.split(" ")[0]}
            </div>
            <div className="flex justify-center mt-1">
              {item.isCompleted ? (
                <span className="w-5 h-5 rounded-full bg-[#CFD8C4] border border-[#BCC8AE] text-[#2F3A2E] flex items-center justify-center text-[10px] font-extrabold">
                  ✓
                </span>
              ) : (
                <span className="w-5 h-5 rounded-full border border-dashed border-[#E8DDCF] text-[9px] text-[#636B60] flex items-center justify-center font-medium">
                  &bull;
                </span>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  return (
    <div className="space-y-6 w-full pb-10">
      {/* Compact Top Bar: Sub-Tab Switcher & Streak Pill */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2 p-1.5 bg-[#FAF6F0] rounded-2xl w-fit border border-[#E8DDCF]">
          <button
            type="button"
            onClick={() => setSubTab("pedometer")}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all duration-200 cursor-pointer ${
              subTab === "pedometer"
                ? "bg-[#CFD8C4] text-[#2F3A2E] font-extrabold shadow-sm border border-[#BCC8AE]"
                : "text-[#636B60] hover:text-[#2F3A2E] hover:bg-white/60"
            }`}
          >
            <Footprints className="w-4 h-4" />
            <span>Aktivitas &amp; Pedometer</span>
          </button>

          <button
            type="button"
            onClick={() => setSubTab("checkin")}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all duration-200 cursor-pointer ${
              subTab === "checkin"
                ? "bg-[#CFD8C4] text-[#2F3A2E] font-extrabold shadow-sm border border-[#BCC8AE]"
                : "text-[#636B60] hover:text-[#2F3A2E] hover:bg-white/60"
            }`}
          >
            <ClipboardCheck className="w-4 h-4" />
            <span>Kuis Evaluasi Diri</span>
          </button>
        </div>
      </div>

      {/* Primary Content at Top of Page */}
      <div className="transition-all duration-200">
        {subTab === "pedometer" ? (
          <PedometerCard afterMainCard={weeklyConsistencyCard} />
        ) : (
          <div className="space-y-6">
            <CheckinView embedded={true} />
            {weeklyConsistencyCard}
          </div>
        )}
      </div>
    </div>
  );
};
