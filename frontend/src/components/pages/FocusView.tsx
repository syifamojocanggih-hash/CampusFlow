import React from "react";
import { Eye, Shield, AlertCircle } from "lucide-react";
import { VisionGuard } from "@/components/vision/VisionGuard";

export const FocusView: React.FC = () => {
  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Vision Guard Header */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-blue-50 text-primary rounded-xl">
              <Eye className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-lg font-bold font-heading text-textMain">
                Sesi Belajar Aktif &amp; Vision Guard
              </h2>
              <p className="text-xs text-slate-500">
                MediaPipe 33 Landmark Pose On-Device (Privasi 100% lokal, zero video upload).
              </p>
            </div>
          </div>
          <span className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1 bg-teal-50 text-teal-700 text-xs font-medium rounded-full border border-teal-200">
            <Shield className="w-3.5 h-3.5" /> Zero Video Upload
          </span>
        </div>

        {/* Live VisionGuard Component */}
        <VisionGuard />

        {/* Info Note */}
        <div className="mt-4 flex items-start gap-2.5 text-xs text-slate-500 bg-slate-50 p-3 rounded-lg border border-slate-100">
          <AlertCircle className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
          <span>
            Pada layar sempit smartphone (&lt; 640px), fitur Vision Guard secara otomatis dinonaktifkan secara anggun (graceful degradation) untuk menghemat baterai dan mengutamakan fitur Pedometer.
          </span>
        </div>
      </div>
    </div>
  );
};
