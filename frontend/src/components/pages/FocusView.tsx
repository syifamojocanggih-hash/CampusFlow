import React, { useState } from "react";
import { Eye, Shield, Camera, AlertCircle, Play, Check } from "lucide-react";

export const FocusView: React.FC = () => {
  const [sessionActive, setSessionActive] = useState(false);
  const [calibrated, setCalibrated] = useState(false);

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
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
                MediaPipe 33 Landmark Pose + EAR Eye Aspect Ratio langsung di browser (Privasi 100% lokal).
              </p>
            </div>
          </div>
          <span className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1 bg-teal-50 text-teal-700 text-xs font-medium rounded-full border border-teal-200">
            <Shield className="w-3.5 h-3.5" /> Zero Video Upload
          </span>
        </div>

        {/* Video Canvas Preview Mock */}
        <div className="relative aspect-video bg-slate-900 rounded-xl overflow-hidden flex flex-col items-center justify-center text-white border border-slate-800">
          <div className="text-center p-6 space-y-3">
            <div className="w-16 h-16 rounded-full bg-white/10 flex items-center justify-center mx-auto text-blue-400">
              <Camera className="w-8 h-8" />
            </div>
            <h3 className="font-semibold text-base">
              {!calibrated
                ? "Kalibrasi Baseline 5 Detik Diperlukan"
                : sessionActive
                ? "Vision Guard Sedang Mengawasi Postur (24 FPS)"
                : "Siap Memulai Sesi Belajar"}
            </h3>
            <p className="text-xs text-slate-400 max-w-sm">
              {!calibrated
                ? "Duduk tegak menghadap kamera selama 5 detik (100 frame) untuk mengukur rasio leher & bahu Anda."
                : "Sistem akan mendeteksi slouching, jarak mata terlalu dekat, dan mengunci layar saat waktu duduk melewati 50 menit."}
            </p>
          </div>

          {/* Action Overlay */}
          <div className="absolute bottom-4 flex gap-3">
            {!calibrated ? (
              <button
                onClick={() => setCalibrated(true)}
                className="bg-primary hover:bg-blue-700 text-white font-medium text-xs px-4 py-2.5 rounded-lg transition-colors flex items-center gap-1.5 shadow-sm"
              >
                <Check className="w-4 h-4" /> Mulai Kalibrasi 5 Detik
              </button>
            ) : (
              <button
                onClick={() => setSessionActive(!sessionActive)}
                className={`text-white font-medium text-xs px-5 py-2.5 rounded-lg transition-colors flex items-center gap-1.5 shadow-sm ${
                  sessionActive
                    ? "bg-red-600 hover:bg-red-700"
                    : "bg-primary hover:bg-blue-700"
                }`}
              >
                {sessionActive ? (
                  <>Hentikan Sesi Belajar</>
                ) : (
                  <>
                    <Play className="w-4 h-4 fill-white" /> Mulai Sesi Belajar (50 Mnt)
                  </>
                )}
              </button>
            )}
          </div>
        </div>

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

