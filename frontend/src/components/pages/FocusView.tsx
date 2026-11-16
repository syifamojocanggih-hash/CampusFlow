import React from "react";
import { Eye } from "lucide-react";
import { VisionGuard } from "@/components/vision/VisionGuard";

export const FocusView: React.FC = () => {
  return (
    <div className="space-y-6 max-w-4xl mx-auto pb-10">
      {/* Header Banner */}
      <div className="learnova-card p-6 border-[#E8E8E8] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-[#BDE6F0] text-[#1A1A1A] flex items-center justify-center shrink-0 shadow-xs">
            <Eye className="w-6 h-6" />
          </div>
          <div>
            <h2 className="font-heading font-extrabold text-xl text-[#1A1A1A]">
              Sesi Belajar &amp; Vision Guard
            </h2>
            <p className="text-xs text-[#9A9A9A] mt-0.5">
              Pantau posisi duduk tegak, cegah bungkuk, dan ingatkan istirahat saat belajar.
            </p>
          </div>
        </div>
      </div>

      {/* Main Vision Guard Component */}
      <VisionGuard />

      {/* Notice info */}
      <div className="learnova-card p-4 sm:p-5 text-xs text-[#1A1A1A] bg-[#F6F6F6] border-[#E8E8E8]">
        <p className="leading-relaxed text-[#9A9A9A]">
          Pada layar HP atau perangkat tanpa kamera, kamera dinonaktifkan otomatis untuk menghemat baterai dan dialihkan ke fitur penghitung langkah dan evaluasi diri.
        </p>
      </div>
    </div>
  );
};
