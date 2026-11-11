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
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs space-y-6">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-blue-50 text-primary rounded-xl">
              <Bot className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold font-heading text-textMain">
                  Clinical Wellbeing AI Coach
                </h2>
                <span className="bg-green-100 text-green-800 text-[10px] font-bold px-2 py-0.5 rounded-full">
                  Gemini 2.5 Flash
                </span>
              </div>
              <p className="text-xs text-slate-500">
                Analisis telemetri 7 hari &amp; mediasi tidur 41% berbasis literatur.
              </p>
            </div>
          </div>
        </div>

        {/* Mediator Badge & Diagnosis */}
        <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 space-y-2">
          <span className="text-[11px] font-bold tracking-wider uppercase text-blue-600 bg-blue-50 px-2.5 py-1 rounded-md border border-blue-200 inline-block">
            Dominant Factor: {insight.dominantMediator}
          </span>
          <p className="text-sm text-slate-700 leading-relaxed">
            {insight.diagnosisSummary}
          </p>
        </div>

        {/* Action Plan */}
        <div className="bg-teal-50/70 p-4 rounded-xl border border-teal-200/80 space-y-3">
          <div className="flex items-center gap-2 text-xs font-bold text-teal-800 uppercase tracking-wider">
            <Sparkles className="w-4 h-4 text-teal-600" />
            <span>Rencana Aksi Isotemporal Hari Ini</span>
          </div>
          <p className="text-sm font-medium text-slate-800 leading-relaxed">
            {insight.isotemporalActionPlan}
          </p>
          <div className="flex items-center gap-2 text-xs text-teal-700 font-semibold pt-1">
            <Target className="w-4 h-4" />
            <span>Target Tambahan: ~{insight.recommendedMetsToday} MET-menit</span>
          </div>
        </div>

        {/* Scientific Citation Box */}
        <div className="bg-slate-50/80 p-3.5 rounded-xl border border-slate-200/60 flex items-start gap-2.5 text-xs text-slate-600">
          <BookOpen className="w-4 h-4 text-slate-500 shrink-0 mt-0.5" />
          <p className="italic">
            {insight.scientificCitationNote}
          </p>
        </div>

        {/* Claim / Complete Button */}
        <button
          onClick={() => setCompleted(true)}
          disabled={completed}
          className={`w-full py-3 rounded-xl font-semibold text-sm transition-all flex items-center justify-center gap-2 shadow-xs ${
            completed
              ? "bg-green-50 text-green-700 border border-green-200 cursor-default"
              : "bg-primary hover:bg-blue-700 text-white"
          }`}
        >
          {completed ? (
            <>
              <CheckCircle className="w-4 h-4 text-green-600" />
              Misi Telah Diselesaikan (+50 XP)
            </>
          ) : (
            <>Selesaikan Misi &amp; Dapatkan +50 XP</>
          )}
        </button>
      </div>
    </div>
  );
};

