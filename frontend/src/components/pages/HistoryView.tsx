import React, { useEffect, useState } from "react";
import { History, Calendar, Flame, Award, Shield } from "lucide-react";
import { MOCK_TRIAD_DASHBOARD } from "@/mocks/campusflowMock";
import { api } from "@/lib/api";
import { useAutoSleep } from "@/utils/autoSleepTracker";
import type { TriadHistoryPointDTO } from "@/types";

export const HistoryView: React.FC = () => {
  const autoSleep = useAutoSleep();
  const [history, setHistory] = useState<TriadHistoryPointDTO[]>([]);
  const [weeklySummary, setWeeklySummary] = useState({
    weeklyMetsTotal: 0,
    weeklyMetsTarget: 1500,
    weeklyMseDays: 0,
    weeklyMseTarget: 2,
    currentStreakDays: 1,
    xpPoints: 0,
  });

  useEffect(() => {
    api
      .getTriadDashboard(14)
      .then((res) => {
        if (Array.isArray(res.data?.history)) {
          setHistory(res.data.history);
        }
        if (res.data?.weeklySummary) {
          setWeeklySummary(res.data.weeklySummary);
        }
      })
      .catch(() => {
        setHistory(MOCK_TRIAD_DASHBOARD.data.history);
      });
  }, [autoSleep.sleepHours]);

  // Pastikan baris paling atas/terbaru menampilkan durasi tidur otomatis hari ini
  const enrichedHistory =
    history.length > 0
      ? [...history]
          .reverse()
          .map((row, idx) => (idx === 0 ? { ...row, sleepHours: autoSleep.sleepHours } : row))
      : [
          {
            logDate: autoSleep.logDate,
            totalSedentaryHours: 0,
            totalMvpaMinutes: 0,
            sleepHours: autoSleep.sleepHours,
            pss4TotalScore: 0,
            triadPillarsMet: 1,
          },
        ];

  // Calorie app style pastel badges
  const achievements = [
    { title: "Early Bird", desc: "Selesai stretching pagi", color: "bg-[#E8DDCF] text-[#2F3A2E] border-[#CFD8C4]" },
    { title: "Streak Master", desc: "7 hari berturut-turut", color: "bg-[#E8DDCF] text-[#2F3A2E] border-[#CFD8C4]" },
    { title: "Active Stretcher", desc: "100% anti-cheat lulus", color: "bg-[#E8DDCF] text-[#2F3A2E] border-[#E8DDCF]" },
    { title: "Sleep Protector", desc: "Tidur rata-rata 7.5 jam", color: "bg-[#E8DDCF] text-[#636B60] border-[#E8DDCF]" },
  ];

  return (
    <div className="space-y-6 max-w-3xl mx-auto pb-10">
      {/* Header Banner */}
      <div className="learnova-card p-6 border-[#E8DDCF] flex items-center justify-between">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-[#E8DDCF] text-[#2F3A2E] flex items-center justify-center shrink-0 shadow-xs">
            <History className="w-6 h-6" />
          </div>
          <div>
            <h2 className="font-heading font-extrabold text-xl text-[#2F3A2E]">
              Riwayat &amp; Prestasi Kebugaran
            </h2>
            <p className="text-xs text-[#636B60] mt-0.5">
              Konsistensi pilar 24-jam &amp; log sesi aktif 14 hari terakhir.
            </p>
          </div>
        </div>
      </div>

      {/* Stats Summary Cards */}
      <div className="grid grid-cols-2 gap-4">
        <div className="learnova-card p-5 flex items-center gap-4 border-[#E8DDCF]">
          <div className="w-12 h-12 rounded-2xl bg-[#E8DDCF] text-[#636B60] flex items-center justify-center shrink-0 shadow-xs">
            <Flame className="w-6 h-6 fill-[#2F3A2E]" />
          </div>
          <div>
            <span className="text-xs font-semibold text-[#636B60]">Current Streak</span>
            <p className="text-xl font-heading font-extrabold text-[#2F3A2E] mt-0.5">
              {weeklySummary.currentStreakDays} Hari
            </p>
          </div>
        </div>

        <div className="learnova-card p-5 flex items-center gap-4 border-[#E8DDCF]">
          <div className="w-12 h-12 rounded-2xl bg-[#E8DDCF] text-[#2F3A2E] flex items-center justify-center shrink-0 shadow-xs">
            <Award className="w-6 h-6" />
          </div>
          <div>
            <span className="text-xs font-semibold text-[#636B60]">Total Akumulasi XP</span>
            <p className="text-xl font-heading font-extrabold text-[#2F3A2E] mt-0.5">
              {weeklySummary.xpPoints} XP
            </p>
          </div>
        </div>
      </div>

      {/* Badges & Achievements Row */}
      <div className="learnova-card p-6 space-y-4 border-[#E8DDCF]">
        <div className="flex items-center justify-between">
          <h3 className="font-heading font-extrabold text-sm text-[#2F3A2E]">
            Lencana Pencapaian (Badges)
          </h3>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {achievements.map((badge, idx) => (
            <div
              key={idx}
              className={`p-3.5 rounded-2xl border flex flex-col items-center text-center space-y-1.5 shadow-xs ${badge.color}`}
            >
              <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center shadow-xs">
                <Shield className="w-5 h-5 text-[#2F3A2E]" />
              </div>
              <h5 className="text-xs font-bold text-[#2F3A2E]">{badge.title}</h5>
              <p className="text-[10px] text-[#2F3A2E]/80 leading-tight font-medium">{badge.desc}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Recent Activity Log Table */}
      <div className="learnova-card p-6 space-y-4 border-[#E8DDCF]">
        <h3 className="font-heading font-extrabold text-sm text-[#2F3A2E]">
          Catatan Harian 14 Hari
        </h3>

        <div className="divide-y divide-[#CBB6A2] border border-[#E8DDCF] rounded-2xl overflow-hidden bg-white">
          {enrichedHistory.map((row) => (
            <div
              key={row.logDate}
              className="p-3.5 flex items-center justify-between text-xs hover:bg-[#FAF6F0] transition-colors"
            >
              <div className="flex items-center gap-2.5">
                <div className="w-7 h-7 rounded-lg bg-[#FAF6F0] text-[#2F3A2E] flex items-center justify-center">
                  <Calendar className="w-3.5 h-3.5" />
                </div>
                <span className="font-semibold text-[#2F3A2E]">{row.logDate}</span>
              </div>
              <div className="flex items-center gap-3 sm:gap-4 text-[#2F3A2E]">
                <span className="hidden sm:inline">Waktu Duduk: <strong>{row.totalSedentaryHours}h</strong></span>
                <span>Olahraga: <strong>{row.totalMvpaMinutes}m</strong></span>
                <span>Tidur: <strong>{row.sleepHours}h</strong></span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
