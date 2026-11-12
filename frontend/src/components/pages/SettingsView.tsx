import React, { useState } from "react";
import { Settings, Shield, Sliders, Smartphone, Check, User } from "lucide-react";

interface SettingsViewProps {
  onNavigateToProfile?: () => void;
}

export const SettingsView: React.FC<SettingsViewProps> = ({ onNavigateToProfile }) => {
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
    <div className="space-y-6 max-w-2xl mx-auto pb-10">
      {/* Header Banner */}
      <div className="learnova-card p-6 border-[#E8E8E8] flex items-center justify-between">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-[#BDE6F0] text-[#1A1A1A] flex items-center justify-center shrink-0 shadow-xs">
            <Settings className="w-6 h-6" />
          </div>
          <div>
            <h2 className="font-heading font-extrabold text-xl text-[#1A1A1A]">
              Pengaturan &amp; Mode Presentasi
            </h2>
            <p className="text-xs text-[#9A9A9A] mt-0.5">
              Simulasi juri demo 15 detik, privasi on-device, dan konfigurasi sensor.
            </p>
          </div>
        </div>
      </div>

      {/* User Profile Navigation Shortcut */}
      {onNavigateToProfile && (
        <div className="learnova-card p-5 border-[#E8E8E8] flex items-center justify-between gap-4 bg-white hover:border-[#BDE6F0] transition-colors">
          <div className="flex items-center gap-3.5">
            <div className="w-10 h-10 rounded-2xl bg-[#F7A8B0] text-[#1A1A1A] flex items-center justify-center shrink-0 shadow-xs font-bold">
              <User className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-heading font-extrabold text-sm text-[#1A1A1A]">
                Profil &amp; Target Wellbeing
              </h3>
              <p className="text-xs text-[#9A9A9A]">
                Kelola identitas akademik, avatar, dan target METs mingguan Anda.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onNavigateToProfile}
            className="px-4 py-2 rounded-xl text-xs font-bold text-[#1A1A1A] bg-[#FFF29A] hover:bg-[#FFE966] transition-all border border-[#FFE966] shadow-xs shrink-0"
          >
            Atur Profil &rarr;
          </button>
        </div>
      )}

      {/* Demo Mode Toggle (Switch Card in Soft Butter Yellow) */}
      <div className="learnova-card p-6 bg-[#FFF29A]/40 border-[#FFF29A] space-y-3">
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <Sliders className="w-4 h-4 text-[#1A1A1A]" />
              <h3 className="font-heading font-extrabold text-sm text-[#1A1A1A] uppercase tracking-wide">
                Mode Demo Presentasi Juri (15 Detik)
              </h3>
            </div>
            <p className="text-xs text-[#1A1A1A]/80 mt-1 leading-relaxed">
              Mempercepat ambang batas jeda duduk dari <strong>50 menit</strong> menjadi <strong>15 detik</strong> untuk keperluan demonstrasi live anti-cheat modal di depan dewan juri.
            </p>
          </div>

          <button
            onClick={toggleDemoMode}
            className={`w-12 h-6 flex items-center rounded-full p-1 transition-colors shrink-0 ${
              demoMode ? "bg-[#1A1A1A] justify-end" : "bg-[#E8E8E8] justify-start"
            }`}
          >
            <div className="w-4 h-4 rounded-full bg-white shadow-xs" />
          </button>
        </div>

        {saved && (
          <p className="text-xs text-[#1A1A1A] font-extrabold flex items-center gap-1 pt-1">
            <Check className="w-4 h-4 text-[#1A1A1A]" /> Preferensi berhasil diperbarui!
          </p>
        )}
      </div>

      {/* Privacy Guarantee Card */}
      <div className="learnova-card p-6 space-y-2 border-[#E8E8E8]">
        <div className="flex items-center gap-2 text-xs font-bold text-[#1A1A1A]">
          <Shield className="w-4 h-4 text-[#1A1A1A]" />
          <span>Privasi Edge 100% (Zero Video Upload)</span>
        </div>
        <p className="text-xs text-[#9A9A9A] leading-relaxed">
          Sesuai prinsip etis perlindungan data privasi mahasiswa, frame webcam diproses secara lokal di browser melalui WebGL &amp; WASM. Gambar tidak pernah dikirim ke jaringan atau disimpan di server.
        </p>
      </div>

      {/* PWA Mobile Guidance */}
      <div className="learnova-card p-6 space-y-2 border-[#E8E8E8]">
        <div className="flex items-center gap-2 text-xs font-bold text-[#1A1A1A]">
          <Smartphone className="w-4 h-4 text-[#1A1A1A]" />
          <span>Pengujian Sensor Gerak Smartphone</span>
        </div>
        <p className="text-xs text-[#9A9A9A] leading-relaxed">
          Browser mobile (iOS Safari &amp; Chrome Android) memerlukan HTTPS untuk mengakses <code>DeviceMotionEvent</code>. Gunakan opsi <code>$env:VITE_HTTPS=&quot;true&quot;</code> saat menjalankan dev server untuk menguji akselerometer di HP.
        </p>
      </div>
    </div>
  );
};
