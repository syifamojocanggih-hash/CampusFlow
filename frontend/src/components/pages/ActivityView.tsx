import React, { useState } from "react";
import { PedometerCard } from "@/components/sensor/PedometerCard";
import { CheckinView } from "@/components/pages/CheckinView";
import { Footprints, ClipboardCheck, ShieldCheck } from "lucide-react";

interface ActivityViewProps {
  defaultSubTab?: "pedometer" | "checkin";
}

export const ActivityView: React.FC<ActivityViewProps> = ({ defaultSubTab = "pedometer" }) => {
  const [subTab, setSubTab] = useState<"pedometer" | "checkin">(defaultSubTab);

  return (
    <div className="space-y-6 max-w-4xl mx-auto pb-10">
      {/* Header Banner */}
      <div className="learnova-card p-6 border-[#E8E8E8] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-[#BDE6F0] text-[#1A1A1A] flex items-center justify-center shrink-0 shadow-xs">
            {subTab === "pedometer" ? (
              <Footprints className="w-6 h-6" />
            ) : (
              <ClipboardCheck className="w-6 h-6" />
            )}
          </div>
          <div>
            <h2 className="font-heading font-extrabold text-xl text-[#1A1A1A]">
              {subTab === "pedometer"
                ? "Aktivitas Fisik & Penghitung Langkah"
                : "Kuis Kebugaran & Evaluasi Stres"}
            </h2>
            <p className="text-xs text-[#9A9A9A] mt-0.5">
              {subTab === "pedometer"
                ? "Hitung langkah harian otomatis menggunakan sensor HP saat Anda berjalan di kampus."
                : "Catat waktu tidur, waktu layar santai, dan tingkat stres untuk rekomendasi dari AI Coach."}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 text-xs font-bold text-[#1A1A1A] bg-[#F6F6F6] px-3.5 py-2 rounded-2xl border border-[#E8E8E8] shrink-0">
          <ShieldCheck className="w-4 h-4 text-[#1A1A1A]" />
          <span>100% On-Device &amp; Privat</span>
        </div>
      </div>

      {/* Segmented Sub-Tab Switcher (Keeps the page unified yet never crowded) */}
      <div className="flex items-center gap-2 p-1.5 bg-[#F6F6F6] rounded-2xl w-fit border border-[#E8E8E8]">
        <button
          onClick={() => setSubTab("pedometer")}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all duration-200 ${
            subTab === "pedometer"
              ? "bg-[#FFF29A] text-[#1A1A1A] font-extrabold shadow-sm border border-[#FFE966]"
              : "text-[#9A9A9A] hover:text-[#1A1A1A] hover:bg-white/60"
          }`}
        >
          <Footprints className="w-4 h-4" />
          <span>Aktivitas &amp; Pedometer</span>
        </button>

        <button
          onClick={() => setSubTab("checkin")}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all duration-200 ${
            subTab === "checkin"
              ? "bg-[#FFF29A] text-[#1A1A1A] font-extrabold shadow-sm border border-[#FFE966]"
              : "text-[#9A9A9A] hover:text-[#1A1A1A] hover:bg-white/60"
          }`}
        >
          <ClipboardCheck className="w-4 h-4" />
          <span>Kuis Evaluasi Diri</span>
        </button>
      </div>

      {/* Active Module Content */}
      <div className="transition-all duration-200">
        {subTab === "pedometer" ? (
          <div className="space-y-6">
            <PedometerCard />

            <div className="learnova-card p-4 sm:p-5 text-xs text-[#1A1A1A] space-y-2 bg-[#F6F6F6] border-[#E8E8E8]">
              <div className="font-bold text-[#1A1A1A]">
                <span>Panduan Penggunaan di Smartphone:</span>
              </div>
              <p className="leading-relaxed text-[#9A9A9A]">
                Buka aplikasi di browser HP Anda, klik <strong>&quot;Aktifkan Sensor HP&quot;</strong>, izinkan akses sensor gerak, dan masukkan ponsel ke saku saat berjalan. Jumlah langkah dan poin energi gerak Anda akan bertambah otomatis.
              </p>
            </div>
          </div>
        ) : (
          <CheckinView embedded={true} />
        )}
      </div>
    </div>
  );
};
