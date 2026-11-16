import React from "react";
import { History, Calendar, Flame, Award, Shield } from "lucide-react";
import { MOCK_TRIAD_DASHBOARD } from "@/mocks/campusflowMock";

export const HistoryView: React.FC = () => {
  const { history, weeklySummary } = MOCK_TRIAD_DASHBOARD.data;

  // Calorie app style pastel badges
  const achievements = [
    { title: "Early Bird", desc: "Selesai stretching pagi", color: "bg-[#BDE6F0] text-[#1A1A1A] border-[#8ECAD7]" },
    { title: "Streak Master", desc: "7 hari berturut-turut", color: "bg-[#CDE8B5] text-[#1A1A1A] border-[#B6DF97]" },
    { title: "Active Stretcher", desc: "100% anti-cheat lulus", color: "bg-[#FFF29A] text-[#1A1A1A] border-[#FFE966]" },
    { title: "Sleep Protector", desc: "Tidur rata-rata 7.5 jam", color: "bg-[#C9B3E6] text-[#1A1A1A] border-[#AE8ED6]" },
  ];

  return (
    <div className="space-y-6 max-w-3xl mx-auto pb-10">
      {/* Header Banner */}
      <div className="learnova-card p-6 border-[#E8E8E8] flex items-center justify-between">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-[#BDE6F0] text-[#1A1A1A] flex items-center justify-center shrink-0 shadow-xs">
            <History className="w-6 h-6" />
          </div>
          <div>
            <h2 className="font-heading font-extrabold text-xl text-[#1A1A1A]">
              Riwayat &amp; Prestasi Kebugaran
            </h2>
            <p className="text-xs text-[#9A9A9A] mt-0.5">
              Konsistensi pilar 24-jam &amp; log sesi aktif 14 hari terakhir.
            </p>
          </div>
        </div>
      </div>

      {/* Stats Summary Cards */}
      <div className="grid grid-cols-2 gap-4">
        <div className="learnova-card p-5 flex items-center gap-4 border-[#E8E8E8]">
          <div className="w-12 h-12 rounded-2xl bg-[#F9B99A] text-[#1A1A1A] flex items-center justify-center shrink-0 shadow-xs">
            <Flame className="w-6 h-6 fill-[#1A1A1A]" />
          </div>
          <div>
            <span className="text-xs font-semibold text-[#9A9A9A]">Current Streak</span>
            <p className="text-xl font-heading font-extrabold text-[#1A1A1A] mt-0.5">
              {weeklySummary.currentStreakDays} Hari
            </p>
          </div>
        </div>

        <div className="learnova-card p-5 flex items-center gap-4 border-[#E8E8E8]">
          <div className="w-12 h-12 rounded-2xl bg-[#CDE8B5] text-[#1A1A1A] flex items-center justify-center shrink-0 shadow-xs">
            <Award className="w-6 h-6" />
          </div>
          <div>
            <span className="text-xs font-semibold text-[#9A9A9A]">Total Akumulasi XP</span>
            <p className="text-xl font-heading font-extrabold text-[#1A1A1A] mt-0.5">
              {weeklySummary.xpPoints} XP
            </p>
          </div>
        </div>
      </div>

      {/* Badges & Achievements Row */}
      <div className="learnova-card p-6 space-y-4 border-[#E8E8E8]">
        <div className="flex items-center justify-between">
          <h3 className="font-heading font-extrabold text-sm text-[#1A1A1A]">
            Lencana Pencapaian (Badges)
          </h3>
          <span className="text-xs font-extrabold text-[#1A1A1A] bg-[#FFF29A] px-2.5 py-0.5 rounded-full">
            4/4 Terbuka
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {achievements.map((badge, idx) => (
            <div
              key={idx}
              className={`p-3.5 rounded-2xl border flex flex-col items-center text-center space-y-1.5 shadow-xs ${badge.color}`}
            >
              <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center shadow-xs">
                <Shield className="w-5 h-5 text-[#1A1A1A]" />
              </div>
              <h5 className="text-xs font-bold text-[#1A1A1A]">{badge.title}</h5>
              <p className="text-[10px] text-[#1A1A1A]/80 leading-tight font-medium">{badge.desc}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Recent Activity Log Table */}
      <div className="learnova-card p-6 space-y-4 border-[#E8E8E8]">
        <h3 className="font-heading font-extrabold text-sm text-[#1A1A1A]">
          Catatan Harian 14 Hari
        </h3>

        <div className="divide-y divide-[#E8E8E8] border border-[#E8E8E8] rounded-2xl overflow-hidden bg-white">
          {history.map((row) => (
            <div
              key={row.logDate}
              className="p-3.5 flex items-center justify-between text-xs hover:bg-[#F6F6F6] transition-colors"
            >
              <div className="flex items-center gap-2.5">
                <div className="w-7 h-7 rounded-lg bg-[#F6F6F6] text-[#1A1A1A] flex items-center justify-center">
                  <Calendar className="w-3.5 h-3.5" />
                </div>
                <span className="font-semibold text-[#1A1A1A]">{row.logDate}</span>
              </div>
              <div className="flex items-center gap-3 sm:gap-4 text-[#1A1A1A]">
                <span className="hidden sm:inline">Waktu Duduk: <strong>{row.totalSedentaryHours}h</strong></span>
                <span>Olahraga: <strong>{row.totalMvpaMinutes}m</strong></span>
                <span>Tidur: <strong>{row.sleepHours}h</strong></span>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-[#CDE8B5] text-[#1A1A1A]">
                  {row.triadPillarsMet}/3 Target Sehat
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
