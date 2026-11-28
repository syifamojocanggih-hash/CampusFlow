import React, { useEffect, useState } from "react";
import { ClipboardCheck, Moon, Check, Smartphone, Activity, Sparkles } from "lucide-react";
import { api } from "@/lib/api";
import { screenTimeTracker } from "@/utils/screenTimeTracker";
import {
  autoSleepTracker,
  useAutoSleep,
  getSleepSourceLabel,
  getSleepClinicalMeta,
} from "@/utils/autoSleepTracker";

interface CheckinViewProps {
  embedded?: boolean;
}

export const CheckinView: React.FC<CheckinViewProps> = ({ embedded = false }) => {
  const autoSleep = useAutoSleep();
  const [sleepHours, setSleepHours] = useState<number | string>(autoSleep.sleepHours);
  const [screenHours, setScreenHours] = useState<number | string>(() =>
    screenTimeTracker.getTodayScreenTimeHours()
  );
  const [answers, setAnswers] = useState<[number, number, number, number]>([3, 3, 3, 3]);
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    setSleepHours(autoSleep.sleepHours);
  }, [autoSleep.sleepHours]);

  const handleSleepHoursChange = (val: number | string) => {
    setSleepHours(val);
    const parsed = typeof val === "number" ? val : parseFloat(String(val));
    if (!isNaN(parsed) && parsed >= 0.5 && parsed <= 16) {
      void autoSleepTracker.overrideSleepHours(parsed);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const finalSleep = typeof sleepHours === "number" && !isNaN(sleepHours) ? sleepHours : parseFloat(String(sleepHours)) || 0;
    const finalScreen = typeof screenHours === "number" && !isNaN(screenHours) ? screenHours : parseFloat(String(screenHours)) || 0;
    // Konversi skala UI (1-5) ke kontrak Likert PSS-4 standar (0-4)
    const pss4AnswersPayload = answers.map((val) =>
      Math.max(0, Math.min(4, (val || 1) - 1))
    ) as [number, number, number, number];

    if (finalSleep >= 0.5) {
      await autoSleepTracker.overrideSleepHours(finalSleep);
    }

    await api.submitDailyWellbeing({
      logDate: new Date().toISOString().slice(0, 10),
      sleepHours: finalSleep,
      sleepQualityScore: autoSleep.sleepQualityScore || 4,
      nonAcademicScreenHours: finalScreen,
      pss4Answers: pss4AnswersPayload,
    });
    try {
      localStorage.setItem("campusflow_last_checkin_date", new Date().toISOString().slice(0, 10));
      window.dispatchEvent(new CustomEvent("campusflow:wellbeing-submitted"));
    } catch {}
    setSubmitted(true);
  };

  return (
    <div className="space-y-6 w-full pb-10">
      {/* Header (Hidden when embedded in unified Activity view) */}
      {!embedded && (
        <div className="learnova-card p-6 border-[#E8DDCF] flex items-center justify-between">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-[#E8DDCF] text-[#2F3A2E] flex items-center justify-center shrink-0 shadow-xs">
              <ClipboardCheck className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="font-heading font-extrabold text-xl text-[#2F3A2E]">
                  Check-in Harian
                </h2>
                <span className="text-[10px] bg-[#E8DDCF] text-[#2F3A2E] font-extrabold px-2.5 py-0.5 rounded-full border border-[#E8DDCF]">
                  30 Detik
                </span>
              </div>
              <p className="text-xs text-[#636B60] mt-0.5">
                Evaluasi tingkat stres &amp; waktu tidur harian untuk rekomendasi dari AI Coach.
              </p>
            </div>
          </div>
        </div>
      )}

      {submitted ? (
        <div className="learnova-card p-8 text-center space-y-4 bg-[#E8DDCF]/30 border-[#CFD8C4]">
          <div className="w-14 h-14 bg-[#E8DDCF] text-[#2F3A2E] rounded-2xl flex items-center justify-center mx-auto shadow-sm">
            <Check className="w-7 h-7" />
          </div>
          <h3 className="font-heading font-extrabold text-lg text-[#2F3A2E]">
            Check-in Berhasil Disimpan!
          </h3>
          <p className="text-xs text-[#2F3A2E]/80 max-w-sm mx-auto leading-relaxed">
            Data kebugaran Anda telah diperbarui. Kunjungi tab <strong>AI Coach</strong> untuk melihat rekomendasi aktivitas fisik hari ini.
          </p>
          <button
            onClick={() => setSubmitted(false)}
            className="text-xs font-bold text-[#2F3A2E] underline pt-2"
          >
            Isi Ulang Formulir
          </button>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Card 1: Sleep Hours (Auto-Populated by Passive Overnight Tracker) */}
          <div className="learnova-card p-5 sm:p-6 space-y-4 border-[#E8DDCF]">
            <div className="flex items-center justify-between gap-2 flex-wrap">
              <div className="flex items-center gap-2 text-xs font-bold text-[#2F3A2E]">
                <div className="w-8 h-8 rounded-xl bg-[#E8DDCF] text-[#2F3A2E] flex items-center justify-center">
                  <Moon className="w-4 h-4" />
                </div>
                <div>
                  <span className="block">Durasi Tidur Semalam (Target 7.0–9.0 Jam)</span>
                  <span className="text-[10px] font-bold text-[#2F3A2E] flex items-center gap-1 mt-0.5">
                    <Sparkles className="w-3 h-3" />
                    Terisi Otomatis ({getSleepSourceLabel(autoSleep.source)}: {autoSleep.bedTime} &rarr;{" "}
                    {autoSleep.wakeTime})
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-1.5 bg-[#FAF6F0] focus-within:bg-white border border-[#E8DDCF] focus-within:border-[#4A3B2C] rounded-xl px-2.5 py-1 transition-all shadow-xs">
                <input
                  type="number"
                  min="0"
                  max="24"
                  step="0.1"
                  value={sleepHours}
                  onChange={(e) => {
                    const val = e.target.value;
                    handleSleepHoursChange(val === "" ? ("" as unknown as number) : parseFloat(val));
                  }}
                  className="w-14 text-center font-heading font-extrabold text-base sm:text-lg text-[#2F3A2E] bg-transparent focus:outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                  aria-label="Ketik durasi tidur dalam jam"
                />
                <span className="font-heading font-extrabold text-xs sm:text-sm text-[#2F3A2E] select-none pr-0.5">
                  Jam
                </span>
              </div>
            </div>

            {/* Auto-Detection Telemetry Summary Strip */}
            <div className="p-3 rounded-2xl bg-[#FAF6F0] border border-[#E8DDCF] flex flex-wrap items-center justify-between gap-2 text-[11px]">
              <div className="flex items-center gap-2 text-[#636B60]">
                <span>
                  Layar Mati: <strong className="text-[#2F3A2E] font-mono">{autoSleep.bedTime}</strong>
                </span>
                <span>&bull;</span>
                <span>
                  Bangun: <strong className="text-[#2F3A2E] font-mono">{autoSleep.wakeTime}</strong>
                </span>
                <span>&bull;</span>
                <span>
                  Recovery: <strong className="text-[#2F3A2E]">+{autoSleep.recoveryPoints}/40 Poin</strong>
                </span>
              </div>
              <span
                className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full border ${
                  getSleepClinicalMeta(autoSleep.clinicalStatus).badgeStyle
                }`}
              >
                {getSleepClinicalMeta(autoSleep.clinicalStatus).label}
              </span>
            </div>

            <input
              type="range"
              min="0"
              max="16"
              step="0.5"
              value={typeof sleepHours === "number" && !isNaN(sleepHours) ? Math.min(16, Math.max(0, sleepHours)) : 0}
              onChange={(e) => handleSleepHoursChange(parseFloat(e.target.value))}
              className="w-full accent-[#4A3B2C] h-2 bg-[#FAF6F0] rounded-lg cursor-pointer"
            />
            <div className="flex justify-between text-[11px] text-[#636B60]">
              <span>Kurang (&lt; 7h)</span>
              <span className="text-[#2F3A2E] font-extrabold">Optimal (7–9h)</span>
              <span>Lebih (&gt; 9h)</span>
            </div>
          </div>

          {/* Card 2: Recreational Screen Time */}
          <div className="learnova-card p-5 sm:p-6 space-y-4 border-[#E8DDCF]">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-xs font-bold text-[#2F3A2E]">
                <div className="w-8 h-8 rounded-xl bg-[#E8DDCF] text-[#2F3A2E] flex items-center justify-center">
                  <Smartphone className="w-4 h-4" />
                </div>
                <span>Waktu Layar Non-Akademik / Hiburan</span>
              </div>
              <div className="flex items-center gap-1.5 bg-[#FAF6F0] focus-within:bg-white border border-[#E8DDCF] focus-within:border-[#4A3B2C] rounded-xl px-2.5 py-1 transition-all shadow-xs">
                <input
                  type="number"
                  min="0"
                  max="24"
                  step="0.1"
                  value={screenHours}
                  onChange={(e) => {
                    const val = e.target.value;
                    setScreenHours(val === "" ? ("" as unknown as number) : parseFloat(val));
                  }}
                  className="w-14 text-center font-heading font-extrabold text-base sm:text-lg text-[#2F3A2E] bg-transparent focus:outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                  aria-label="Ketik waktu layar non-akademik dalam jam"
                />
                <span className="font-heading font-extrabold text-xs sm:text-sm text-[#2F3A2E] select-none pr-0.5">
                  Jam
                </span>
              </div>
            </div>
            <input
              type="range"
              min="0"
              max="16"
              step="0.5"
              value={typeof screenHours === "number" && !isNaN(screenHours) ? Math.min(16, Math.max(0, screenHours)) : 0}
              onChange={(e) => setScreenHours(parseFloat(e.target.value))}
              className="w-full accent-[#4A3B2C] h-2 bg-[#FAF6F0] rounded-lg cursor-pointer"
            />
            <p className="text-[11px] text-[#636B60]">
              Media sosial, game, atau video streaming di luar perkuliahan dan tugas kampus.
            </p>
          </div>

          {/* Card 3: PSS-4 Questionnaire */}
          <div className="learnova-card p-5 sm:p-6 space-y-5 border-[#E8DDCF]">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-[#E8DDCF] pb-3 gap-1">
              <h3 className="font-heading font-extrabold text-sm text-[#2F3A2E]">
                Evaluasi Tingkat Stres (24 Jam Terakhir)
              </h3>
              <span className="text-[11px] text-[#636B60] font-medium">Skala 1 (Tidak Pernah) &ndash; 5 (Sangat Sering)</span>
            </div>

            {[
              "1. Seberapa sering Anda merasa tidak mampu mengendalikan hal penting?",
              "2. Seberapa sering Anda merasa yakin pada kemampuan mengatasi masalah pribadi?",
              "3. Seberapa sering Anda merasa segala hal berjalan sesuai keinginan?",
              "4. Seberapa sering Anda merasa beban dan kesulitan menumpuk begitu tinggi?",
            ].map((q, idx) => (
              <div key={idx} className="space-y-2.5 pt-1">
                <p className="text-xs font-semibold text-[#2F3A2E] leading-snug">{q}</p>
                <div className="grid grid-cols-5 gap-1.5 sm:gap-2">
                  {[1, 2, 3, 4, 5].map((val) => (
                    <button
                      type="button"
                      key={val}
                      onClick={() => {
                        const next = [...answers] as [number, number, number, number];
                        next[idx] = val;
                        setAnswers(next);
                      }}
                      className={`py-2 rounded-xl text-center text-xs font-bold transition-all ${
                        answers[idx] === val
                          ? "bg-[#CFD8C4] text-[#2F3A2E] font-extrabold border border-[#BCC8AE] shadow-softPill scale-102"
                          : "bg-[#FAF6F0] border border-[#E8DDCF] text-[#2F3A2E] hover:bg-white"
                      }`}
                    >
                      {val}
                    </button>
                  ))}
                </div>
              </div>
            ))}

            {/* Live Diagnostic & Recovery Preview */}
            {(() => {
              const numSleep = typeof sleepHours === "number" && !isNaN(sleepHours) ? sleepHours : parseFloat(String(sleepHours)) || 0;
              const numScreen = typeof screenHours === "number" && !isNaN(screenHours) ? screenHours : parseFloat(String(screenHours)) || 0;
              const stressSum = answers.reduce((a, b) => a + b, 0);

              const sleepLabel = numSleep >= 7 && numSleep <= 9 ? "+40 Poin (Optimal)" : numSleep >= 6 ? "+25 Poin (Cukup)" : numSleep > 9 ? "+30 Poin (Lebih)" : "+10 Poin (Kurang)";
              const screenLabel = numScreen <= 4 ? "Aman (Rendah)" : numScreen <= 7 ? "Moderat" : "Tinggi (Kelelahan)";
              const stressLabel = stressSum <= 10 ? "Rendah (Rileks)" : stressSum <= 15 ? "Sedang (Wajar)" : "Tinggi (Stres)";

              const isOptimal = numSleep >= 7 && numScreen <= 5 && stressSum <= 14;
              const isWarning = numSleep < 6 || numScreen > 7 || stressSum > 16;
              const statusBadge = isOptimal
                ? { label: "Kebugaran Optimal", style: "bg-[#E8DDCF] text-[#2F3A2E] border-[#CFD8C4]" }
                : isWarning
                ? { label: "Perlu Pemulihan", style: "bg-[#E8DDCF] text-[#636B60] border-[#E8DDCF]" }
                : { label: "Waspada Ringan", style: "bg-[#E8DDCF] text-[#2F3A2E] border-[#E8DDCF]" };

              return (
                <div className="bg-[#FAF6F0] rounded-2xl p-4 border border-[#E8DDCF] space-y-3 mt-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Activity className="w-4 h-4 text-[#2F3A2E]" />
                      <span className="font-heading font-extrabold text-xs text-[#2F3A2E]">
                        Pratinjau Kebugaran &amp; Pemulihan Instan
                      </span>
                    </div>
                    <span className={`text-[10px] font-extrabold px-2.5 py-0.5 rounded-full border ${statusBadge.style}`}>
                      {statusBadge.label}
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-center text-xs">
                    <div className="p-2.5 rounded-xl bg-white border border-[#E8DDCF]">
                      <span className="text-[10px] text-[#636B60] block mb-0.5">Pemulihan Tidur</span>
                      <strong className="text-xs font-heading font-extrabold text-[#2F3A2E]">
                        {sleepLabel}
                      </strong>
                    </div>
                    <div className="p-2.5 rounded-xl bg-white border border-[#E8DDCF]">
                      <span className="text-[10px] text-[#636B60] block mb-0.5">Beban Layar Hiburan</span>
                      <strong className="text-xs font-heading font-extrabold text-[#2F3A2E]">
                        {screenLabel}
                      </strong>
                    </div>
                    <div className="p-2.5 rounded-xl bg-white border border-[#E8DDCF]">
                      <span className="text-[10px] text-[#636B60] block mb-0.5">Tingkat Stres PSS-4</span>
                      <strong className="text-xs font-heading font-extrabold text-[#2F3A2E]">
                        {stressLabel}
                      </strong>
                    </div>
                  </div>
                </div>
              );
            })()}

            <button
              type="submit"
              className="w-full mt-4 bg-[#E8DDCF] hover:bg-[#CFD8C4] active:bg-[#CFD8C4] text-[#2F3A2E] font-extrabold text-xs sm:text-sm py-3.5 rounded-2xl transition-all shadow-softPill flex items-center justify-center gap-2 border border-[#E8DDCF]"
            >
              Simpan &amp; Analisis Rekomendasi AI Coach
            </button>
          </div>
        </form>
      )}
    </div>
  );
};
