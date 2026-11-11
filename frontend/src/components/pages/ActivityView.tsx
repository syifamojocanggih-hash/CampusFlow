import React, { useState } from "react";
import { Footprints, Activity, PlusCircle } from "lucide-react";

export const ActivityView: React.FC = () => {
  const [steps, setSteps] = useState(3420);
  const [tracking, setTracking] = useState(false);

  return (
    <div className="space-y-6 max-w-xl mx-auto">
      <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl">
              <Footprints className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-lg font-bold font-heading text-textMain">
                Pelacak Aktivitas (Pedometer HP)
              </h2>
              <p className="text-xs text-slate-500">
                HTML5 DeviceMotionEvent 3-Axis DSP &amp; Konversi METs (IPAQ-SF).
              </p>
            </div>
          </div>
        </div>

        {/* MET & Step Progress Ring UI */}
        <div className="flex flex-col items-center justify-center py-6 bg-slate-50 rounded-2xl border border-slate-100 mb-6">
          <div className="relative w-44 h-44 flex flex-col items-center justify-center rounded-full border-8 border-emerald-500/20">
            <Activity className="w-6 h-6 text-emerald-600 mb-1" />
            <span className="text-3xl font-extrabold text-textMain sensor-num">
              {steps.toLocaleString()}
            </span>
            <span className="text-xs text-slate-500">Langkah Hari Ini</span>
            <span className="mt-1 text-[11px] font-semibold text-emerald-600 bg-emerald-100/70 px-2 py-0.5 rounded-full">
              ~240 MET-menit
            </span>
          </div>

          <button
            onClick={() => {
              setTracking(!tracking);
              if (!tracking) setSteps((s) => s + 25);
            }}
            className={`mt-6 text-xs font-semibold px-5 py-2.5 rounded-xl transition-colors shadow-xs flex items-center gap-2 ${
              tracking
                ? "bg-amber-600 text-white hover:bg-amber-700"
                : "bg-emerald-600 text-white hover:bg-emerald-700"
            }`}
          >
            {tracking ? "Hentikan Pelacak Gerak" : "Aktifkan Pelacak Langkah (Sensor HP)"}
          </button>
        </div>

        {/* Fallback Form Manual Input MSE */}
        <div className="border-t border-slate-100 pt-5 space-y-3">
          <h3 className="font-semibold text-xs text-slate-500 uppercase tracking-wider">
            Input Aktivitas Manual / Muscle-Strengthening (MSE)
          </h3>
          <p className="text-xs text-slate-500">
            Untuk mahasiswa di PC desktop atau latihan beban tanpa membawa ponsel:
          </p>
          <div className="flex gap-2">
            <select className="text-xs border border-slate-200 rounded-lg px-3 py-2 flex-1 bg-white">
              <option>Muscle-Strengthening Exercise (5.0 METs)</option>
              <option>Jalan Kaki Kampus (3.3 METs)</option>
              <option>Olahraga Sedang / Bersepeda (4.0 METs)</option>
              <option>Lari Cepat / Olahraga Berat (8.0 METs)</option>
            </select>
            <input
              type="number"
              placeholder="Menit"
              defaultValue={30}
              className="text-xs border border-slate-200 rounded-lg px-3 py-2 w-20 text-center"
            />
            <button
              onClick={() => alert("Aktivitas tersimpan (+XP)")}
              className="bg-primary hover:bg-blue-700 text-white text-xs font-medium px-4 py-2 rounded-lg flex items-center gap-1 transition-colors"
            >
              <PlusCircle className="w-4 h-4" /> Simpan
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

