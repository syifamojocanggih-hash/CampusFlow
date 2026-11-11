import React, { useState } from "react";
import { ClipboardCheck, Moon, Check } from "lucide-react";
import { api } from "@/lib/api";

export const CheckinView: React.FC = () => {
  const [sleepHours, setSleepHours] = useState(7);
  const [screenHours, setScreenHours] = useState(4);
  const [answers, setAnswers] = useState<[number, number, number, number]>([2, 2, 2, 2]);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await api.submitDailyWellbeing({
      logDate: new Date().toISOString().slice(0, 10),
      sleepHours,
      sleepQualityScore: 4,
      nonAcademicScreenHours: screenHours,
      pss4Answers: answers,
    });
    setSubmitted(true);
  };

  return (
    <div className="space-y-6 max-w-xl mx-auto">
      <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-3 bg-teal-50 text-teal-600 rounded-xl">
            <ClipboardCheck className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-lg font-bold font-heading text-textMain">
              Check-in Harian (30 Detik)
            </h2>
            <p className="text-xs text-slate-500">
              Evaluasi PSS-4 &amp; Jam Tidur untuk diagnosis adaptif Gemini AI Coach.
            </p>
          </div>
        </div>

        {submitted ? (
          <div className="text-center py-8 space-y-3 bg-teal-50/50 rounded-xl border border-teal-100 p-6">
            <div className="w-12 h-12 bg-teal-600 text-white rounded-full flex items-center justify-center mx-auto">
              <Check className="w-6 h-6" />
            </div>
            <h3 className="font-bold text-textMain text-base">Check-in Berhasil Disimpan!</h3>
            <p className="text-xs text-slate-600">
              AI Coach telah memperbarui rekomendasi isotemporal harian Anda.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Pertanyaan Tidur */}
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 space-y-3">
              <div className="flex items-center gap-2 text-xs font-semibold text-slate-700">
                <Moon className="w-4 h-4 text-teal-600" />
                <span>Berapa jam Anda tidur semalam?</span>
              </div>
              <div className="flex items-center gap-3">
                <input
                  type="range"
                  min="3"
                  max="12"
                  step="0.5"
                  value={sleepHours}
                  onChange={(e) => setSleepHours(parseFloat(e.target.value))}
                  className="w-full accent-teal-600"
                />
                <span className="text-sm font-bold text-teal-800 w-16 text-right sensor-num">
                  {sleepHours} Jam
                </span>
              </div>
            </div>

            {/* Durasi Layar Non-Akademik */}
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 space-y-3">
              <label className="text-xs font-semibold text-slate-700 block">
                Estimasi waktu layar rekreasi / media sosial di luar kuliah/tugas:
              </label>
              <div className="flex items-center gap-3">
                <input
                  type="range"
                  min="0"
                  max="12"
                  step="0.5"
                  value={screenHours}
                  onChange={(e) => setScreenHours(parseFloat(e.target.value))}
                  className="w-full accent-primary"
                />
                <span className="text-sm font-bold text-primary w-16 text-right sensor-num">
                  {screenHours} Jam
                </span>
              </div>
            </div>

            {/* PSS-4 Skala Singkat */}
            <div className="space-y-3">
              <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                Skala Stres PSS-4 (Dalam 24 Jam Terakhir)
              </h3>
              {[
                "1. Seberapa sering Anda merasa tidak mampu mengendalikan hal penting?",
                "2. Seberapa sering Anda merasa yakin pada kemampuan mengatasi masalah pribadi? (Item Positif)",
                "3. Seberapa sering Anda merasa segala hal berjalan sesuai keinginan? (Item Positif)",
                "4. Seberapa sering Anda merasa kesulitan menumpuk begitu tinggi?",
              ].map((q, idx) => (
                <div key={idx} className="p-3 bg-slate-50 rounded-lg text-xs space-y-2">
                  <p className="font-medium text-slate-700">{q}</p>
                  <div className="flex justify-between gap-1">
                    {[0, 1, 2, 3, 4].map((val) => (
                      <button
                        type="button"
                        key={val}
                        onClick={() => {
                          const next = [...answers] as [number, number, number, number];
                          next[idx] = val;
                          setAnswers(next);
                        }}
                        className={`flex-1 py-1.5 rounded text-center font-medium transition-colors ${
                          answers[idx] === val
                            ? "bg-primary text-white font-bold"
                            : "bg-white border border-slate-200 text-slate-600 hover:bg-slate-100"
                        }`}
                      >
                        {val}
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            <button
              type="submit"
              className="w-full bg-primary hover:bg-blue-700 text-white font-semibold text-sm py-3 rounded-xl transition-colors shadow-xs"
            >
              Simpan Check-in &amp; Analisis AI Coach
            </button>
          </form>
        )}
      </div>
    </div>
  );
};

