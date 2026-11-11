import React, { useState } from "react";
import { Settings, Shield, Sliders, Smartphone, Check } from "lucide-react";

export const SettingsView: React.FC = () => {
  const [demoMode, setDemoMode] = useState(
    import.meta.env.VITE_DEMO_MODE === "true" || localStorage.getItem("cf_demo_mode") === "true"
  );
  const [saved, setSaved] = useState(false);

  const toggleDemoMode = () => {
    const next = !demoMode;
    setDemoMode(next);
    localStorage.setItem("cf_demo_mode", String(next));
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div className="space-y-6 max-w-xl mx-auto">
      <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs space-y-6">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-slate-100 text-slate-700 rounded-xl">
            <Settings className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-lg font-bold font-heading text-textMain">
              Pengaturan Sistem &amp; Mode Demo
            </h2>
            <p className="text-xs text-slate-500">
              Konfigurasi simulasi presentasi juri, izin sensor, dan privasi.
            </p>
          </div>
        </div>

        {/* Mode Demo Presentasi Juri */}
        <div className="bg-amber-50/70 p-4 rounded-xl border border-amber-200/80 space-y-3">
          <div className="flex items-start justify-between gap-3">
            <div>
              <div className="flex items-center gap-2">
                <Sliders className="w-4 h-4 text-amber-600" />
                <h3 className="font-semibold text-xs text-textMain uppercase tracking-wider">
                  Mode Demo Presentasi Juri (15 Detik)
                </h3>
              </div>
              <p className="text-xs text-slate-600 mt-1">
                Mempercepat ambang jeda duduk dari <strong>50 menit</strong> menjadi <strong>15 detik</strong> untuk memudahkan demonstrasi live di depan dewan juri/evaluator.
              </p>
            </div>
            <button
              onClick={toggleDemoMode}
              className={`w-12 h-6 flex items-center rounded-full p-1 transition-colors shrink-0 ${
                demoMode ? "bg-amber-600 justify-end" : "bg-slate-300 justify-start"
              }`}
            >
              <div className="w-4 h-4 rounded-full bg-white shadow-xs"></div>
            </button>
          </div>
          {saved && (
            <p className="text-xs text-green-600 font-medium flex items-center gap-1">
              <Check className="w-3.5 h-3.5" /> Preferensi tersimpan!
            </p>
          )}
        </div>

        {/* Privasi & Keamanan Data */}
        <div className="p-4 bg-slate-50 rounded-xl border border-slate-100 space-y-2">
          <div className="flex items-center gap-2 text-xs font-semibold text-slate-700">
            <Shield className="w-4 h-4 text-teal-600" />
            <span>Arsitektur Privasi Edge (Zero Video Upload)</span>
          </div>
          <p className="text-xs text-slate-500 leading-relaxed">
            CampusFlow memproses video webcam secara 100% lokal di browser melalui WebGL/WASM MediaPipe. Server hanya menerima koordinat kalibrasi dan metrik durasi.
          </p>
        </div>

        {/* PWA & Sensor Info */}
        <div className="p-4 bg-slate-50 rounded-xl border border-slate-100 space-y-2">
          <div className="flex items-center gap-2 text-xs font-semibold text-slate-700">
            <Smartphone className="w-4 h-4 text-primary" />
            <span>PWA &amp; Pengujian Sensor Ponsel</span>
          </div>
          <p className="text-xs text-slate-500 leading-relaxed">
            Untuk menguji akselerometer di HP, pastikan aplikasi dijalankan via HTTPS lokal atau tunnel (mis. ngrok atau vite basic-ssl).
          </p>
        </div>
      </div>
    </div>
  );
};

