import React, { useEffect, useState } from "react";
import { Bot, CheckCircle } from "lucide-react";
import { api } from "@/lib/api";
import type { AiCoachingInsightDTO } from "@/types";

export const CoachView: React.FC = () => {
  const [insight, setInsight] = useState<AiCoachingInsightDTO | null>(null);
  const [completed, setCompleted] = useState(false);

  useEffect(() => {
    api.getAiCoachInsight().then((res) => {
      setInsight(res.data);
      setCompleted(res.data.isCompleted);
    });
  }, []);

  if (!insight) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#1A1A1A]"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-2xl mx-auto pb-10">
      {/* Header Banner */}
      <div className="learnova-card p-6 border-[#E8E8E8] flex items-center justify-between">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-[#BDE6F0] text-[#1A1A1A] flex items-center justify-center shrink-0 shadow-xs">
            <Bot className="w-6 h-6" />
          </div>
          <div>
            <h2 className="font-heading font-extrabold text-xl text-[#1A1A1A]">
              Wellbeing AI Coach
            </h2>
            <p className="text-xs text-[#9A9A9A] mt-0.5">
              Saran kesehatan harian berbasis pola aktivitas &amp; kualitas tidur Anda selama 7 hari terakhir.
            </p>
          </div>
        </div>
      </div>

      {/* Main Diagnostic & Action Plan Card */}
      <div className="learnova-card p-6 space-y-5 border-[#E8E8E8]">
        {/* Diagnostic Summary */}
        <div>
          <h3 className="font-heading font-bold text-base text-[#1A1A1A] leading-snug">
            {insight.diagnosisSummary}
          </h3>
        </div>

        {/* Isotemporal Action Plan Card (Mint Green Card Accent) */}
        <div className="bg-[#CDE8B5]/35 rounded-2xl p-5 border border-[#CDE8B5] space-y-3">
          <div className="text-xs font-bold text-[#1A1A1A] uppercase tracking-wider">
            <span>Rencana Sehat &amp; Jeda Aktif Hari Ini</span>
          </div>
          <p className="text-xs sm:text-sm font-medium text-[#1A1A1A] leading-relaxed">
            {insight.isotemporalActionPlan}
          </p>
          <div className="text-xs text-[#1A1A1A] font-bold pt-1">
            <span>Target Energi Gerak: ~{insight.recommendedMetsToday} Poin (Setara jalan santai ~45 menit)</span>
          </div>
        </div>

        {/* Completion Claim Button */}
        <button
          onClick={() => setCompleted(true)}
          disabled={completed}
          className={`w-full py-3.5 rounded-2xl font-extrabold text-xs sm:text-sm transition-all flex items-center justify-center gap-2 shadow-xs ${
            completed
              ? "bg-[#CDE8B5] text-[#1A1A1A] border border-[#B6DF97] shadow-none cursor-default"
              : "bg-[#FFF29A] hover:bg-[#FFE966] text-[#1A1A1A] border border-[#FFE966] shadow-softPill"
          }`}
        >
          {completed ? (
            <>
              <CheckCircle className="w-4 h-4 text-[#1A1A1A]" />
              Misi Telah Diselesaikan (+50 XP)
            </>
          ) : (
            <>Selesaikan Misi &amp; Klaim +50 XP</>
          )}
        </button>
      </div>
    </div>
  );
};
