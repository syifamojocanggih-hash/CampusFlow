import React, { useState } from "react";
import { VisionGuard } from "@/components/vision/VisionGuard";
import { PedometerCard } from "@/components/sensor/PedometerCard";
import { FlaskConical, CheckCircle2, Code2, Sparkles } from "lucide-react";
import type { SedentarySessionPayload } from "@/types";

export const VisionLabView: React.FC = () => {
  const [lastPayload, setLastPayload] = useState<SedentarySessionPayload | null>(null);

  return (
    <div className="space-y-8 max-w-5xl mx-auto pb-12">
      {/* Banner Intro */}
      <div className="bg-gradient-to-r from-blue-600 via-indigo-600 to-teal-600 rounded-3xl p-6 sm:p-8 text-white shadow-xl relative overflow-hidden">
        <div className="relative z-10 max-w-2xl space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/20 backdrop-blur-md text-xs font-semibold">
            <FlaskConical className="w-3.5 h-3.5" />
            Branch feat/vision-guard &bull; Test Hub
          </div>
          <h1 className="text-2xl sm:text-3xl font-heading font-extrabold tracking-tight">
            Vision Guard &amp; Pedometer Lab
          </h1>
          <p className="text-xs sm:text-sm text-blue-100 leading-relaxed">
            Pusat verifikasi kinematika postur MediaPipe Pose (33 Landmarks) dan sensor inersia 3-Axis HTML5 DeviceMotion tanpa ketergantungan server (100% On-Device edge computation).
          </p>
        </div>

        {/* Decorative background glow */}
        <div className="absolute -right-10 -bottom-10 w-64 h-64 bg-teal-400/20 rounded-full blur-3xl pointer-events-none" />
      </div>

      {/* Module 2: Vision Guard */}
      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="w-7 h-7 rounded-lg bg-blue-100 text-primary flex items-center justify-center font-bold text-xs">
              01
            </span>
            <h2 className="font-heading font-bold text-lg text-textMain">
              MediaPipe Vision Guard &amp; Anti-Cheat Break
            </h2>
          </div>
          <span className="text-xs text-slate-500 font-medium hidden sm:inline">
            Gunakan tombol DEMO MODE untuk pengujian kilat 15 detik
          </span>
        </div>

        <VisionGuard
          onSessionComplete={(payload) => {
            console.log("[VisionLab] Sesi Sedentari Selesai:", payload);
            setLastPayload(payload);
          }}
        />
      </section>

      {/* Emitted Payload Inspector */}
      {lastPayload && (
        <section className="bg-slate-900 text-white rounded-2xl p-5 border border-slate-800 shadow-lg space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-emerald-400" />
              <h3 className="font-heading font-semibold text-sm">
                Emitted SedentarySessionPayload (Terkirim ke Kontrak Data)
              </h3>
            </div>
            <span className="text-[11px] bg-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded font-mono font-medium">
              verificationSource: {lastPayload.verificationSource}
            </span>
          </div>

          <pre className="bg-slate-950 p-4 rounded-xl text-xs font-mono text-emerald-300 overflow-x-auto border border-slate-800">
            {JSON.stringify(lastPayload, null, 2)}
          </pre>
        </section>
      )}

      {/* Module 3: 3-Axis Pedometer Sensor */}
      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="w-7 h-7 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold text-xs">
              02
            </span>
            <h2 className="font-heading font-bold text-lg text-textMain">
              3-Axis HTML5 Accelerometer DSP &amp; IPAQ-SF Pedometer
            </h2>
          </div>
          <span className="text-xs text-slate-500 font-medium hidden sm:inline">
            Filter gravitasi 25-sample moving average &bull; Cadence METs
          </span>
        </div>

        <PedometerCard />
      </section>

      {/* Architecture Spec Highlights */}
      <section className="bg-white rounded-2xl p-6 border border-slate-200 text-xs text-slate-600 space-y-3">
        <h3 className="font-heading font-bold text-sm text-textMain flex items-center gap-2">
          <Code2 className="w-4 h-4 text-primary" /> Rangkuman Spesifikasi Kinematika &amp; DSP
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 leading-relaxed">
          <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 space-y-1.5">
            <div className="font-semibold text-slate-800 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-blue-500" /> Vision Guard Formulas:
            </div>
            <ul className="list-disc list-inside space-y-1 text-slate-600 text-[11px]">
              <li><b>Kalibrasi Baseline:</b> 100 frame (W_base, Y_sh_base, D_neck_base, &Theta;_base).</li>
              <li><b>Slouching:</b> R_neck &lt; 0.78 atau |&Delta;&Theta;| &gt; 15&deg; atau &Delta;Y_sh &gt; 0.08.</li>
              <li><b>Mata Terlalu Dekat:</b> R_depth = W_curr / W_base &ge; 1.28.</li>
              <li><b>Bahu Miring Asimetris:</b> &Theta;_roll = atan2(|&Delta;y|, |&Delta;x|) &gt; 12.0&deg;.</li>
              <li><b>Overhead Stretch:</b> y_wrist &lt; y_nose &amp; kedua sudut siku &gt; 140&deg;.</li>
            </ul>
          </div>

          <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 space-y-1.5">
            <div className="font-semibold text-slate-800 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-emerald-500" /> Pedometer DSP Formulas:
            </div>
            <ul className="list-disc list-inside space-y-1 text-slate-600 text-[11px]">
              <li><b>Magnitudo 3-Axis:</b> a_mag = &radic;(ax&sup2; + ay&sup2; + az&sup2;).</li>
              <li><b>High-Pass Filter:</b> a_net = a_mag - mean(a_mag) (25 sampel).</li>
              <li><b>Deteksi Langkah:</b> a_net &gt; 1.35 m/s&sup2; &amp; interval 250 - 1200 ms.</li>
              <li><b>IPAQ-SF Cadence:</b> &lt;50 SPM (1.0x), 50-99 SPM (3.3x), 100-129 SPM (4.0x), &ge;130 SPM (8.0x).</li>
            </ul>
          </div>
        </div>
      </section>
    </div>
  );
};
