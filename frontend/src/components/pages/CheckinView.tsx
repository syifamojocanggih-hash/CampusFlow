import React, { useState } from "react";
import { ClipboardCheck, Moon, Check, Sparkles, Smartphone } from "lucide-react";
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
    <div className="space-y-6 max-w-2xl mx-auto pb-10">
      {/* Header */}
      <div className="learnova-card p-6 border-[#E8E8E8] flex items-center justify-between">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-[#BDE6F0] text-[#1A1A1A] flex items-center justify-center shrink-0 shadow-xs">
            <ClipboardCheck className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="font-heading font-extrabold text-xl text-[#1A1A1A]">
                Check-in Harian
              </h2>
              <span className="text-[10px] bg-[#FFF29A] text-[#1A1A1A] font-extrabold px-2.5 py-0.5 rounded-full border border-[#FFE966]">
                30 Detik
              </span>
            </div>
            <p className="text-xs text-[#9A9A9A] mt-0.5">
              Skala stres klinis PSS-4 &amp; durasi tidur untuk input diagnosis AI Coach.
            </p>
          </div>
        </div>
      </div>

      {submitted ? (
        <div className="learnova-card p-8 text-center space-y-4 bg-[#CDE8B5]/30 border-[#CDE8B5]">
          <div className="w-14 h-14 bg-[#CDE8B5] text-[#1A1A1A] rounded-2xl flex items-center justify-center mx-auto shadow-sm">
            <Check className="w-7 h-7" />
          </div>
          <h3 className="font-heading font-extrabold text-lg text-[#1A1A1A]">
            Check-in Berhasil Disimpan!
          </h3>
          <p className="text-xs text-[#1A1A1A]/80 max-w-sm mx-auto leading-relaxed">
            Data telemetri Anda telah diperbarui. Kunjungi tab <strong>AI Coach</strong> untuk melihat rekomendasi aksi fisik personal hari ini.
          </p>
          <button
            onClick={() => setSubmitted(false)}
            className="text-xs font-bold text-[#1A1A1A] underline pt-2"
          >
            Isi Ulang Formulir
          </button>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Card 1: Sleep Hours */}
          <div className="learnova-card p-5 sm:p-6 space-y-4 border-[#E8E8E8]">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-xs font-bold text-[#1A1A1A]">
                <div className="w-8 h-8 rounded-xl bg-[#CDE8B5] text-[#1A1A1A] flex items-center justify-center">
                  <Moon className="w-4 h-4" />
                </div>
                <span>Durasi Tidur Semalam (Target 7.0–9.0 Jam)</span>
              </div>
              <span className="font-heading font-extrabold text-lg text-[#1A1A1A] sensor-num">
                {sleepHours} Jam
              </span>
            </div>
            <input
              type="range"
              min="3"
              max="12"
              step="0.5"
              value={sleepHours}
              onChange={(e) => setSleepHours(parseFloat(e.target.value))}
              className="w-full accent-[#1A1A1A] h-2 bg-[#F6F6F6] rounded-lg cursor-pointer"
            />
            <div className="flex justify-between text-[11px] text-[#9A9A9A]">
              <span>Kurang (&lt; 7h)</span>
              <span className="text-[#1A1A1A] font-extrabold">Optimal (7–9h)</span>
              <span>Lebih (&gt; 9h)</span>
            </div>
          </div>

          {/* Card 2: Recreational Screen Time */}
          <div className="learnova-card p-5 sm:p-6 space-y-4 border-[#E8E8E8]">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-xs font-bold text-[#1A1A1A]">
                <div className="w-8 h-8 rounded-xl bg-[#FFF29A] text-[#1A1A1A] flex items-center justify-center">
                  <Smartphone className="w-4 h-4" />
                </div>
                <span>Waktu Layar Non-Akademik / Hiburan</span>
              </div>
              <span className="font-heading font-extrabold text-lg text-[#1A1A1A] sensor-num">
                {screenHours} Jam
              </span>
            </div>
            <input
              type="range"
              min="0"
              max="12"
              step="0.5"
              value={screenHours}
              onChange={(e) => setScreenHours(parseFloat(e.target.value))}
              className="w-full accent-[#1A1A1A] h-2 bg-[#F6F6F6] rounded-lg cursor-pointer"
            />
            <p className="text-[11px] text-[#9A9A9A]">
              Media sosial, game, atau video streaming di luar perkuliahan dan tugas kampus.
            </p>
          </div>

          {/* Card 3: PSS-4 Questionnaire */}
          <div className="learnova-card p-5 sm:p-6 space-y-5 border-[#E8E8E8]">
            <div className="flex items-center justify-between border-b border-[#E8E8E8] pb-3">
              <h3 className="font-heading font-extrabold text-sm text-[#1A1A1A] flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-[#1A1A1A]" />
                Pertanyaan PSS-4 (24 Jam Terakhir)
              </h3>
              <span className="text-[11px] text-[#9A9A9A] font-medium">Skala 0 (Tidak Pernah) - 4 (Sangat Sering)</span>
            </div>

            {[
              "1. Seberapa sering Anda merasa tidak mampu mengendalikan hal penting?",
              "2. Seberapa sering Anda merasa yakin pada kemampuan mengatasi masalah pribadi? (Item Positif)",
              "3. Seberapa sering Anda merasa segala hal berjalan sesuai keinginan? (Item Positif)",
              "4. Seberapa sering Anda merasa kesulitan menumpuk begitu tinggi?",
            ].map((q, idx) => (
              <div key={idx} className="space-y-2.5 pt-1">
                <p className="text-xs font-semibold text-[#1A1A1A] leading-snug">{q}</p>
                <div className="grid grid-cols-5 gap-1.5 sm:gap-2">
                  {[0, 1, 2, 3, 4].map((val) => (
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
                          ? "bg-[#FFF29A] text-[#1A1A1A] font-extrabold border border-[#FFE966] shadow-softPill scale-102"
                          : "bg-[#F6F6F6] border border-[#E8E8E8] text-[#1A1A1A] hover:bg-white"
                      }`}
                    >
                      {val}
                    </button>
                  ))}
                </div>
              </div>
            ))}

            <button
              type="submit"
              className="w-full mt-4 bg-[#FFF29A] hover:bg-[#FFE966] text-[#1A1A1A] font-extrabold text-xs sm:text-sm py-3.5 rounded-2xl transition-all shadow-softPill flex items-center justify-center gap-2 border border-[#FFE966]"
            >
              Simpan &amp; Analisis Rekomendasi AI Coach
            </button>
          </div>
        </form>
      )}
    </div>
  );
};
