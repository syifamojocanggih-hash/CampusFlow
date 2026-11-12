import React from "react";
import { Eye, ShieldCheck, Sparkles } from "lucide-react";
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
            <div className="flex items-center gap-2">
              <h2 className="font-heading font-extrabold text-xl text-[#1A1A1A]">
                Sesi Belajar &amp; Vision Guard
              </h2>
              <span className="text-[10px] bg-[#CDE8B5] hover:bg-[#BEE1A3] text-[#1A1A1A] font-extrabold px-2.5 py-0.5 rounded-full border border-[#B6DF97] transition-colors cursor-default select-none">
                MediaPipe 33 Landmark
              </span>
            </div>
            <p className="text-xs text-[#9A9A9A] mt-0.5">
              Pemantauan postur tegak, pencegahan slouching, dan jeda peregangan anti-cheat.
            </p>
          </div>
        </div>

        <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#FFF29A] text-[#1A1A1A] text-xs font-extrabold rounded-2xl border border-[#FFE966]">
          <ShieldCheck className="w-4 h-4 text-[#1A1A1A]" /> Zero Video Upload
        </span>
      </div>

      {/* Main Vision Guard Component */}
      <VisionGuard />

      {/* Notice info */}
      <div className="learnova-card p-4 sm:p-5 flex items-start gap-3 text-xs text-[#1A1A1A] bg-[#F6F6F6] border-[#E8E8E8]">
        <Sparkles className="w-4 h-4 text-[#1A1A1A] shrink-0 mt-0.5" />
        <p className="leading-relaxed text-[#9A9A9A]">
          Pada layar sempit smartphone (&lt; 640px) atau tanpa kamera depan, fitur kamera postur dinonaktifkan secara anggun (<em>graceful degradation</em>) agar pengguna dapat berfokus penuh pada pelacak langkah pedometer dan kuesioner.
        </p>
      </div>
    </div>
  );
};
