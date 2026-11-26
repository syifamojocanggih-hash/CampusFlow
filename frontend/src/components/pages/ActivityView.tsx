import React, { useEffect, useMemo, useState } from "react";
import { PedometerCard } from "@/components/sensor/PedometerCard";
import { CheckinView } from "@/components/pages/CheckinView";
import { Footprints, ClipboardCheck, Check } from "lucide-react";
import { api } from "@/lib/api";

interface ActivityViewProps {
  defaultSubTab?: "pedometer" | "checkin";
}

const SHORT_DAYS = ["Min", "Sen", "Sel", "Rab", "Kam", "Jum", "Sab"];

function toLocalIsoDate(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(
    d.getDate()
  ).padStart(2, "0")}`;
}

export const ActivityView: React.FC<ActivityViewProps> = ({ defaultSubTab = "pedometer" }) => {
  const [subTab, setSubTab] = useState<"pedometer" | "checkin">(defaultSubTab);
  const [completedDates, setCompletedDates] = useState<Set<string>>(() => new Set());

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

  // Hitung 7 hari pekan berjalan (Senin–Minggu) secara dinamis berdasarkan tanggal lokal hari ini
  const weekDays = useMemo(() => {
    const now = new Date();
    const currentDay = now.getDay(); // 0=Min, 1=Sen, ...
    const mondayOffset = currentDay === 0 ? -6 : 1 - currentDay;
    const monday = new Date(now);
    monday.setDate(now.getDate() + mondayOffset);
    const todayIso = toLocalIsoDate(now);

    return Array.from({ length: 7 }).map((_, idx) => {
      const d = new Date(monday);
      d.setDate(monday.getDate() + idx);
      const iso = toLocalIsoDate(d);
      return {
        iso,
        day: SHORT_DAYS[d.getDay()],
        dayNumber: d.getDate(),
        isCompleted: completedDates.has(iso),
        isToday: iso === todayIso,
      };
    });
  }, [completedDates]);

  const completedWeekCount = weekDays.filter((item) => item.isCompleted).length;
  const remainingWeekDays = Math.max(0, 7 - completedWeekCount);

  const weeklyConsistencyCard = (
    <div className="learnova-card p-6 sm:p-7 border-[#E8DDCF] bg-white">
      <div className="flex flex-col md:flex-row md:items-center gap-6 md:gap-8">
        {/* Left Summary Column */}
        <div className="shrink-0 min-w-[185px]">
          <h3 className="font-heading font-extrabold text-sm sm:text-[15px] text-[#1D3127] tracking-tight">
            Kebiasaan Sehat Pekan Ini
          </h3>
          <div className="flex items-baseline gap-2 mt-1.5">
            <span className="font-heading font-extrabold text-4xl sm:text-[2.75rem] leading-none tracking-tight text-[#367546] sensor-num">
              {completedWeekCount}/7
            </span>
            <span className="text-xs sm:text-sm font-medium text-[#636B60]">hari</span>
          </div>
          <p className="text-xs text-[#636B60] mt-2">
            {remainingWeekDays > 0
              ? `${remainingWeekDays} hari lagi pekan ini`
              : "Target pekan ini tercapai!"}
          </p>
        </div>

        {/* Right Connected 7-Day Timeline Stepper */}
        <div className="flex-1 w-full overflow-x-auto pb-1 md:pb-0">
          <div className="flex items-start justify-between min-w-[440px]">
            {weekDays.map((item, idx) => {
              const prevCompleted = idx > 0 && weekDays[idx - 1].isCompleted;
              const nextCompleted = idx < weekDays.length - 1 && weekDays[idx + 1].isCompleted;
              const leftLineActive = prevCompleted && item.isCompleted;
              const rightLineActive = item.isCompleted && nextCompleted;

              return (
                <div key={item.iso} className="relative flex-1 flex flex-col items-center">
                  {/* Left Connector Line */}
                  {idx > 0 && (
                    <span
                      aria-hidden="true"
                      className={`absolute top-5 sm:top-[22px] right-1/2 w-1/2 h-[3px] -translate-y-1/2 transition-colors ${
                        leftLineActive ? "bg-[#3D7A4D]" : "bg-[#E6E6E1]"
                      }`}
                    />
                  )}

                  {/* Right Connector Line */}
                  {idx < weekDays.length - 1 && (
                    <span
                      aria-hidden="true"
                      className={`absolute top-5 sm:top-[22px] left-1/2 w-1/2 h-[3px] -translate-y-1/2 transition-colors ${
                        rightLineActive ? "bg-[#3D7A4D]" : "bg-[#E6E6E1]"
                      }`}
                    />
                  )}

                  {/* Day Circle Node */}
                  <div
                    className={`relative z-10 w-10 h-10 sm:w-11 sm:h-11 rounded-full flex items-center justify-center transition-all ${
                      item.isCompleted
                        ? item.isToday
                          ? "bg-[#3D7A4D] text-white ring-[5px] ring-[#CFE2CE]"
                          : "bg-[#3D7A4D] text-white"
                        : item.isToday
                        ? "bg-white border-2 border-[#A7BEA4] ring-[4px] ring-[#E8EFE6]"
                        : "bg-white border-2 border-[#E2E2DC]"
                    }`}
                  >
                    {item.isCompleted && (
                      <Check className="w-4 h-4 sm:w-[18px] sm:h-[18px] stroke-[2.75]" />
                    )}
                  </div>

                  {/* Day + Date Label */}
                  <span
                    className={`mt-2.5 text-[11px] sm:text-xs whitespace-nowrap transition-colors ${
                      item.isToday
                        ? "font-extrabold text-[#1D3127]"
                        : "font-medium text-[#636B60]"
                    }`}
                  >
                    {item.day} {item.dayNumber}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
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
