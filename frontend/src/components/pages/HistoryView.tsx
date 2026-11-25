import React, { useEffect, useState } from "react";
import { History, Calendar, Flame, Award, Shield, Lock } from "lucide-react";
import { api } from "@/lib/api";
import { useAutoSleep } from "@/utils/autoSleepTracker";
import type { TriadHistoryPointDTO } from "@/types";

export const HistoryView: React.FC = () => {
  const autoSleep = useAutoSleep();
  const [history, setHistory] = useState<TriadHistoryPointDTO[]>([]);
  const [verifiedBreaksCount, setVerifiedBreaksCount] = useState<number>(0);
  const [weeklySummary, setWeeklySummary] = useState({
    weeklyMetsTotal: 0,
    weeklyMetsTarget: 600,
    weeklyMseDays: 0,
    weeklyMseTarget: 2,
    currentStreakDays: 0,
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
        setHistory([]);
      });

    api
      .getActiveBreakHistory(14)
      .then((res) => {
        if (typeof res.data?.verifiedCount === "number") {
          setVerifiedBreaksCount(res.data.verifiedCount);
        }
      })
      .catch(() => {
        setVerifiedBreaksCount(0);
      });
  }, [autoSleep.sleepHours]);

  // Urutkan dari tanggal terbaru ke terlama (hanya data nyata dari database)
  const enrichedHistory = [...history]
    .reverse()
    .map((row, idx) =>
      idx === 0 && row.logDate === autoSleep.logDate && autoSleep.sleepHours > 0
        ? { ...row, sleepHours: autoSleep.sleepHours }
        : row
    );

  // Hitung rata-rata jam tidur nyata dari riwayat
  const sleepSamples = enrichedHistory.map((r) => r.sleepHours).filter((h) => h > 0);
  const avgSleepHours =
    sleepSamples.length > 0
      ? Number((sleepSamples.reduce((a, b) => a + b, 0) / sleepSamples.length).toFixed(1))
      : 0;

  // Lencana pencapaian dinamis berdasarkan data asli dari MySQL
  const achievements = [
    {
      title: "First Stretch",
      desc:
        verifiedBreaksCount >= 1
          ? `${verifiedBreaksCount} jeda aktif terverifikasi`
          : "Selesaikan 1 jeda aktif kamera",
      unlocked: verifiedBreaksCount >= 1,
    },
    {
      title: "Streak Master",
      desc:
        weeklySummary.currentStreakDays >= 7
          ? `${weeklySummary.currentStreakDays} hari berturut-turut`
          : `${weeklySummary.currentStreakDays}/7 hari berturut-turut`,
      unlocked: weeklySummary.currentStreakDays >= 7,
    },
    {
      title: "Active Stretcher",
      desc:
        verifiedBreaksCount >= 3
          ? `${verifiedBreaksCount} sesi peregangan lulus`
          : `${verifiedBreaksCount}/3 sesi peregangan AI`,
      unlocked: verifiedBreaksCount >= 3,
    },
    {
      title: "Sleep Protector",
      desc:
        avgSleepHours >= 7.5
          ? `Rata-rata tidur ${avgSleepHours} jam`
          : avgSleepHours > 0
          ? `Rata-rata ${avgSleepHours} / 7.5 jam`
          : "Belum ada catatan tidur",
      unlocked: avgSleepHours >= 7.5,
    },
  ];

  return (
    <div className="space-y-6 w-full pb-10">
      {/* Header Banner */}
      <div className="learnova-card p-6 border-[#E8DDCF] flex items-center justify-between">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-[#CFD8C4] border border-[#BCC8AE] text-[#2F3A2E] flex items-center justify-center shrink-0 shadow-xs">
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
          <div className="w-12 h-12 rounded-2xl bg-[#CFD8C4] border border-[#BCC8AE] text-[#2F3A2E] flex items-center justify-center shrink-0 shadow-xs">
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
          <div className="w-12 h-12 rounded-2xl bg-[#CFD8C4] border border-[#BCC8AE] text-[#2F3A2E] flex items-center justify-center shrink-0 shadow-xs">
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
              className={`p-3.5 rounded-2xl border flex flex-col items-center text-center space-y-1.5 shadow-xs transition-all ${
                badge.unlocked
                  ? "bg-[#CFD8C4] text-[#2F3A2E] border-[#BCC8AE]"
                  : "bg-[#FAF6F0] text-[#636B60] border-[#E8DDCF] opacity-75"
              }`}
            >
              <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center shadow-xs">
                {badge.unlocked ? (
                  <Shield className="w-5 h-5 text-[#2F3A2E]" />
                ) : (
                  <Lock className="w-4 h-4 text-[#636B60]" />
                )}
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

        {enrichedHistory.length === 0 ? (
          <div className="p-8 rounded-2xl bg-[#FAF6F0] border border-dashed border-[#E8DDCF] text-center space-y-1.5">
            <Calendar className="w-7 h-7 text-[#636B60] mx-auto" />
            <p className="text-xs font-bold text-[#2F3A2E]">Belum Ada Catatan Harian</p>
            <p className="text-[11px] text-[#636B60] max-w-xs mx-auto">
              Riwayat akan otomatis terisi setelah kamu melakukan Check-in Harian, Aktivitas Fisik, atau Active Break.
            </p>
          </div>
        ) : (
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
        )}
      </div>
    </div>
  );
};
