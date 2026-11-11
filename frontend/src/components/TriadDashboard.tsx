import React, { useEffect, useState } from "react";
import {
  Flame,
  Moon,
  Armchair,
  Sparkles,
  Zap,
  TrendingUp,
  Award,
} from "lucide-react";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from "recharts";
import { api } from "@/lib/api";
import type { TriadDashboardDTO } from "@/types";
import { StatusPill } from "./common/StatusPill";

interface TriadDashboardProps {
  onStartPanicRelief: () => void;
  onNavigateToFocus: () => void;
}

export const TriadDashboard: React.FC<TriadDashboardProps> = ({
  onStartPanicRelief,
  onNavigateToFocus,
}) => {
  const [dashboardData, setDashboardData] = useState<TriadDashboardDTO | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    api
      .getTriadDashboard(14)
      .then((res) => {
        if (isMounted) setDashboardData(res.data);
      })
      .catch((err) => console.error("Gagal memuat dashboard:", err))
      .finally(() => {
        if (isMounted) setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, []);

  if (loading || !dashboardData) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  const { today, weeklySummary, history } = dashboardData;

  return (
    <div className="space-y-6">
      {/* Header Banner & Gamifikasi Streak */}
      <div className="bg-gradient-to-r from-blue-600 to-teal-600 rounded-2xl p-5 md:p-6 text-white shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="bg-white/20 px-2.5 py-0.5 rounded-full text-xs font-medium backdrop-blur-sm">
              24-Hour Movement Guidelines
            </span>
            <span className="bg-white/20 px-2.5 py-0.5 rounded-full text-xs font-medium backdrop-blur-sm">
              Pilar Terpenuhi: {today.triadPillarsMet}/3
            </span>
          </div>
          <h1 className="text-xl md:text-2xl font-bold font-heading">
            Duduk Sehat. Gerak Terukur. Stres Terkendali.
          </h1>
          <p className="text-blue-100 text-sm mt-1 max-w-xl">
            Sinergi isotemporal waktu duduk, aktivitas fisik terverifikasi, dan kualitas tidur untuk menurunkan stres akademik.
          </p>
        </div>

        <div className="flex items-center gap-3 bg-white/10 px-4 py-2.5 rounded-xl border border-white/20 backdrop-blur-sm self-stretch md:self-auto justify-around md:justify-start">
          <div className="text-center">
            <div className="flex items-center gap-1 justify-center text-amber-300 font-bold text-lg">
              <Flame className="w-5 h-5 fill-amber-300" />
              <span>{weeklySummary.currentStreakDays} Hari</span>
            </div>
            <span className="text-xs text-blue-100">Streak Aktif</span>
          </div>
          <div className="w-px h-8 bg-white/20"></div>
          <div className="text-center">
            <div className="flex items-center gap-1 justify-center text-green-300 font-bold text-lg">
              <Award className="w-5 h-5" />
              <span>{weeklySummary.xpPoints} XP</span>
            </div>
            <span className="text-xs text-blue-100">Total Poin</span>
          </div>
        </div>
      </div>

      {/* Exam Panic Button Quick Banner */}
      <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-xs">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-amber-500/10 flex items-center justify-center text-amber-600 shrink-0">
            <Zap className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-semibold text-textMain text-sm md:text-base">
              Merasa Cemas Menjelang Ujian atau Tugas?
            </h3>
            <p className="text-xs text-slate-600">
              Panduan intervensi aerobik akut 15 menit (110–125 BPM) berbasis RCT Wu & Zhou (2024).
            </p>
          </div>
        </div>
        <button
          onClick={onStartPanicRelief}
          className="bg-amber-600 hover:bg-amber-700 text-white font-medium text-xs md:text-sm px-4 py-2 rounded-lg transition-colors shadow-xs w-full sm:w-auto shrink-0 flex items-center justify-center gap-1.5"
        >
          <Sparkles className="w-4 h-4" />
          Mulai Exam Panic Relief
        </button>
      </div>

      {/* 3 PILAR UTAMA (TRIAD DASHBOARD CARDS) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Pilar 1: Waktu Duduk Statis */}
        <div className="bg-white rounded-xl p-5 border border-slate-200/80 shadow-xs flex flex-col justify-between hover:border-slate-300 transition-all">
          <div>
            <div className="flex justify-between items-start mb-3">
              <span className="p-2.5 rounded-lg bg-blue-50 text-blue-600">
                <Armchair className="w-5 h-5" />
              </span>
              <StatusPill status={today.sedentaryRiskStatus} />
            </div>
            <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-wider">
              Pilar 1: Batas Duduk
            </h2>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="text-2xl font-bold text-textMain sensor-num">
                {today.totalSedentaryHours}
              </span>
              <span className="text-sm text-slate-500 font-medium">Jam / Hari</span>
            </div>
            <p className="text-xs text-slate-500 mt-2">
              Target aman: &le; 9.0 jam/hari (Barbosa et al., 2024). Jeda aktif setiap 50 menit.
            </p>
          </div>
          <button
            onClick={onNavigateToFocus}
            className="mt-4 w-full text-xs font-semibold text-primary hover:text-blue-700 bg-blue-50/70 hover:bg-blue-100/70 py-2 rounded-lg transition-colors text-center"
          >
            Mulai Mode Fokus &amp; Vision Guard &rarr;
          </button>
        </div>

        {/* Pilar 2: Volume Gerak Aktif (MVPA & METs) */}
        <div className="bg-white rounded-xl p-5 border border-slate-200/80 shadow-xs flex flex-col justify-between hover:border-slate-300 transition-all">
          <div>
            <div className="flex justify-between items-start mb-3">
              <span className="p-2.5 rounded-lg bg-emerald-50 text-emerald-600">
                <TrendingUp className="w-5 h-5" />
              </span>
              <StatusPill
                status={today.totalMvpaMinutes >= 30 ? "OPTIMAL" : "WASPADA"}
              />
            </div>
            <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-wider">
              Pilar 2: Gerak Aktif (MVPA)
            </h2>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="text-2xl font-bold text-textMain sensor-num">
                {today.totalMvpaMinutes}
              </span>
              <span className="text-sm text-slate-500 font-medium">Menit Hari Ini</span>
            </div>
            <p className="text-xs text-slate-500 mt-2">
              Rasio gerak/duduk: {today.mvpaPerSedentaryRatio} menit/jam duduk (target: &ge; 25 mnt/jam).
            </p>
          </div>
          <div className="mt-4 pt-3 border-t border-slate-100 flex justify-between text-xs text-slate-600">
            <span>Mingguan: <strong>{weeklySummary.weeklyMetsTotal}</strong>/{weeklySummary.weeklyMetsTarget} METs</span>
            <span>MSE: <strong>{weeklySummary.weeklyMseDays}</strong>/{weeklySummary.weeklyMseTarget} Hari</span>
          </div>
        </div>

        {/* Pilar 3: Tidur & Skor Stres PSS-4 */}
        <div className="bg-white rounded-xl p-5 border border-slate-200/80 shadow-xs flex flex-col justify-between hover:border-slate-300 transition-all">
          <div>
            <div className="flex justify-between items-start mb-3">
              <span className="p-2.5 rounded-lg bg-teal-50 text-teal-600">
                <Moon className="w-5 h-5" />
              </span>
              <StatusPill status={today.stressRiskLevel} />
            </div>
            <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-wider">
              Pilar 3: Tidur &amp; Stres (PSS-4)
            </h2>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="text-2xl font-bold text-textMain sensor-num">
                {today.pss4TotalScore}
              </span>
              <span className="text-sm text-slate-500 font-medium">/ 16 (PSS-4)</span>
              <span className="text-xs text-slate-400 ml-1">· Tidur: {today.sleepHours} jam</span>
            </div>
            <p className="text-xs text-slate-500 mt-2">
              Efek mediasi tidur 41% (Mu et al., 2024). Cutoff PSS-4 &ge; 8 memicu rekomendasi AI Coach sore.
            </p>
          </div>
          <div className="mt-4 pt-3 border-t border-slate-100 flex justify-between text-xs text-slate-600">
            <span>Screen Non-Akademik: <strong>{today.nonAcademicScreenHours}</strong> Jam</span>
            <span className="text-teal-600 font-medium">Target 7–9 Jam</span>
          </div>
        </div>
      </div>

      {/* GRAFIK TREN 14 HARI (RECHARTS) */}
      <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs">
        <div className="flex justify-between items-center mb-4">
          <div>
            <h2 className="font-heading font-semibold text-base text-textMain">
              Tren Kebugaran &amp; Skor Stres (14 Hari)
            </h2>
            <p className="text-xs text-slate-500">
              Korelasi waktu duduk (merah) vs durasi gerak aktif MVPA (hijau)
            </p>
          </div>
        </div>

        <div className="h-60 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={history} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="colorMvpa" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#22C55E" stopOpacity={0.4} />
                  <stop offset="95%" stopColor="#22C55E" stopOpacity={0.0} />
                </linearGradient>
                <linearGradient id="colorSedentary" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#3B82F6" stopOpacity={0.0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F1F5F9" />
              <XAxis
                dataKey="logDate"
                tickFormatter={(val) => val.slice(5)}
                tick={{ fontSize: 11, fill: "#64748B" }}
              />
              <YAxis tick={{ fontSize: 11, fill: "#64748B" }} />
              <Tooltip
                contentStyle={{
                  backgroundColor: "rgba(255, 255, 255, 0.95)",
                  borderRadius: "8px",
                  border: "1px solid #E2E8F0",
                  fontSize: "12px",
                }}
              />
              <Area
                type="monotone"
                dataKey="totalMvpaMinutes"
                name="MVPA (Menit)"
                stroke="#22C55E"
                fillOpacity={1}
                fill="url(#colorMvpa)"
                strokeWidth={2}
              />
              <Area
                type="monotone"
                dataKey="totalSedentaryHours"
                name="Duduk (Jam)"
                stroke="#3B82F6"
                fillOpacity={1}
                fill="url(#colorSedentary)"
                strokeWidth={2}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};

