import React, { useEffect, useState } from "react";
import { Bot, BookOpen, CheckCircle, Sparkles, Target } from "lucide-react";
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
            <div className="flex items-center gap-2">
              <h2 className="font-heading font-extrabold text-xl text-[#1A1A1A]">
                Wellbeing AI Coach
              </h2>
              <span className="text-[10px] bg-[#CDE8B5] text-[#1A1A1A] font-extrabold px-2.5 py-0.5 rounded-full border border-[#B6DF97]">
                Gemini 2.5 Flash
              </span>
            </div>
            <p className="text-xs text-[#9A9A9A] mt-0.5">
              Rekomendasi terstruktur berbasis telemetri 7 hari &amp; mediasi tidur 41%.
            </p>
          </div>
        </div>
      </div>

      {/* Main Diagnostic & Action Plan Card */}
      <div className="learnova-card p-6 space-y-5 border-[#E8E8E8]">
        {/* Dominant Mediator Tag */}
        <div>
          <span className="text-[10px] font-mono font-bold tracking-wider uppercase text-[#1A1A1A] bg-[#FFF29A] px-3 py-1 rounded-full border border-[#FFE966]">
            Dominant Factor: {insight.dominantMediator}
          </span>
          <h3 className="font-heading font-bold text-base text-[#1A1A1A] mt-3 leading-snug">
            {insight.diagnosisSummary}
          </h3>
        </div>

        {/* Isotemporal Action Plan Card (Mint Green Card Accent) */}
        <div className="bg-[#CDE8B5]/35 rounded-2xl p-5 border border-[#CDE8B5] space-y-3">
          <div className="flex items-center gap-2 text-xs font-bold text-[#1A1A1A] uppercase tracking-wider">
            <Sparkles className="w-4 h-4 text-[#1A1A1A]" />
            <span>Rencana Aksi Isotemporal Hari Ini</span>
          </div>
          <p className="text-xs sm:text-sm font-medium text-[#1A1A1A] leading-relaxed">
            {insight.isotemporalActionPlan}
          </p>
          <div className="flex items-center gap-2 text-xs text-[#1A1A1A] font-bold pt-1">
            <Target className="w-4 h-4 text-[#1A1A1A]" />
            <span>Rekomendasi MET Hari Ini: ~{insight.recommendedMetsToday} MET-menit</span>
          </div>
        </div>

        {/* Scientific Citation Box */}
        <div className="p-4 rounded-2xl bg-[#F6F6F6] border border-[#E8E8E8] flex items-start gap-3 text-xs text-[#1A1A1A]/80">
          <BookOpen className="w-4 h-4 text-[#9A9A9A] shrink-0 mt-0.5" />
          <p className="leading-relaxed italic">
            {insight.scientificCitationNote}
          </p>
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
