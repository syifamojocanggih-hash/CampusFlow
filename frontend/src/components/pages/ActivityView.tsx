import React from "react";
import { PedometerCard } from "@/components/sensor/PedometerCard";
import { Footprints, Sparkles, ShieldCheck } from "lucide-react";

export const ActivityView: React.FC = () => {
  return (
    <div className="space-y-6 max-w-4xl mx-auto pb-8">
      {/* Header Banner */}
      <div className="learnova-card p-6 border-[#E8E8E8] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-[#BDE6F0] text-[#1A1A1A] flex items-center justify-center shrink-0 shadow-xs">
            <Footprints className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="font-heading font-extrabold text-xl text-[#1A1A1A]">
                Aktivitas Fisik &amp; Pedometer DSP
              </h2>
              <span className="text-[10px] bg-[#CDE8B5] text-[#1A1A1A] px-2.5 py-0.5 rounded-full font-extrabold">
                IPAQ-SF Real-Time
              </span>
            </div>
            <p className="text-xs text-[#9A9A9A] mt-0.5">
              Pelacak langkah berbasis sensor akselerometer 3-sumbu smartphone &amp; filter gravitasi 25 sampel.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 text-xs font-bold text-[#1A1A1A] bg-[#F6F6F6] px-3.5 py-2 rounded-2xl border border-[#E8E8E8]">
          <ShieldCheck className="w-4 h-4 text-[#1A1A1A]" />
          <span>DSP Lokal di Browser</span>
        </div>
      </div>

      {/* Main Pedometer Card Component */}
      <PedometerCard />

      {/* Information Notes */}
      <div className="learnova-card p-4 sm:p-5 text-xs text-[#1A1A1A] space-y-2 bg-[#F6F6F6] border-[#E8E8E8]">
        <div className="flex items-center gap-2 font-bold text-[#1A1A1A]">
          <Sparkles className="w-4 h-4 text-[#1A1A1A]" />
          <span>Panduan Pengujian di Smartphone:</span>
        </div>
        <p className="leading-relaxed text-[#9A9A9A]">
          Buka aplikasi via HTTPS lokal di browser HP, klik <strong>&quot;Aktifkan Sensor HP&quot;</strong>, izinkan sensor gerak, dan masukkan ponsel ke dalam saku saat berjalan. Cadence SPM dan MET-menit akan terakumulasi otomatis.
        </p>
      </div>
    </div>
  );
};
