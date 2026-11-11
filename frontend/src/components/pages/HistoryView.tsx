import React from "react";
import { History, Calendar, Flame, Award } from "lucide-react";
import { MOCK_TRIAD_DASHBOARD } from "@/mocks/campusflowMock";

export const HistoryView: React.FC = () => {
  const { history, weeklySummary } = MOCK_TRIAD_DASHBOARD.data;

  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs space-y-6">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-purple-50 text-purple-600 rounded-xl">
            <History className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-lg font-bold font-heading text-textMain">
              Riwayat Kebugaran &amp; Pilar 24-Jam
            </h2>
            <p className="text-xs text-slate-500">
              Pencatatan 14 hari konsistensi waktu duduk, METs, dan skor PSS-4.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-100 flex items-center gap-3">
            <Flame className="w-6 h-6 text-amber-500 fill-amber-500" />
            <div>
              <span className="text-xs text-slate-500">Streak Saat Ini</span>
              <p className="font-bold text-textMain text-base">{weeklySummary.currentStreakDays} Hari Beruntun</p>
            </div>
          </div>
          <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-100 flex items-center gap-3">
            <Award className="w-6 h-6 text-green-600" />
            <div>
              <span className="text-xs text-slate-500">Total Akumulasi XP</span>
              <p className="font-bold text-textMain text-base">{weeklySummary.xpPoints} XP</p>
            </div>
          </div>
        </div>

        <div className="space-y-2.5">
          <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider">
            Log Aktivitas Harian Terakhir
          </h3>
          <div className="divide-y divide-slate-100 border border-slate-100 rounded-xl overflow-hidden">
            {history.map((row) => (
              <div key={row.logDate} className="p-3 flex items-center justify-between text-xs hover:bg-slate-50/70">
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-slate-400" />
                  <span className="font-semibold text-textMain">{row.logDate}</span>
                </div>
                <div className="flex items-center gap-3">
                  <span>Duduk: <strong>{row.totalSedentaryHours}h</strong></span>
                  <span>MVPA: <strong>{row.totalMvpaMinutes}m</strong></span>
                  <span>Tidur: <strong>{row.sleepHours}h</strong></span>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-50 text-blue-700">
                    {row.triadPillarsMet}/3 Pilar
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

