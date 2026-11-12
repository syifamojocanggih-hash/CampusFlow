import React, { useState } from "react";
import { VisionGuard } from "@/components/vision/VisionGuard";
import { PedometerCard } from "@/components/sensor/PedometerCard";
import { FlaskConical, CheckCircle2, Code2, Sparkles } from "lucide-react";
import type { SedentarySessionPayload } from "@/types";

export const VisionLabView: React.FC = () => {
  const [lastPayload, setLastPayload] = useState<SedentarySessionPayload | null>(null);

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-12">
      {/* Header Banner */}
      <div className="learnova-card p-6 border-[#E8E8E8] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-[#BDE6F0] text-[#1A1A1A] flex items-center justify-center shrink-0 shadow-xs">
            <FlaskConical className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="font-heading font-extrabold text-xl text-[#1A1A1A]">
                Vision Guard &amp; Pedometer Lab
              </h2>
              <span className="text-[10px] bg-[#FFF29A] text-[#1A1A1A] font-extrabold px-2.5 py-0.5 rounded-full border border-[#FFE966]">
                Test Hub
              </span>
            </div>
            <p className="text-xs text-[#9A9A9A] mt-0.5">
              Verifikasi kinematika postur MediaPipe &amp; sensor inersia 3-sumbu HTML5 DeviceMotion 100% On-Device.
            </p>
          </div>
        </div>

        <span className="text-xs font-bold text-[#1A1A1A] bg-[#F6F6F6] px-3.5 py-2 rounded-2xl border border-[#E8E8E8]">
          Uji Cepat: Aktifkan <strong>DEMO MODE (15s)</strong>
        </span>
      </div>

      {/* Module 1: Vision Guard */}
      <section className="space-y-3">
        <div className="flex items-center gap-2">
          <span className="w-7 h-7 rounded-xl bg-[#BDE6F0] text-[#1A1A1A] flex items-center justify-center font-extrabold text-xs">
            01
          </span>
          <h3 className="font-heading font-extrabold text-base text-[#1A1A1A]">
            MediaPipe Vision Guard &amp; Anti-Cheat Break
          </h3>
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
        <section className="bg-[#1A1A1A] text-white rounded-3xl p-6 border border-[#333333] shadow-xl space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-[#CDE8B5]" />
              <h4 className="font-heading font-semibold text-sm text-white">
                Emitted SedentarySessionPayload (Terkirim ke Kontrak Data)
              </h4>
            </div>
            <span className="text-[11px] bg-[#FFF29A] text-[#1A1A1A] px-2.5 py-0.5 rounded-full font-mono font-bold">
              verificationSource: {lastPayload.verificationSource}
            </span>
          </div>

          <pre className="bg-[#000000] p-4 rounded-2xl text-xs font-mono text-[#CDE8B5] overflow-x-auto border border-[#333333]">
            {JSON.stringify(lastPayload, null, 2)}
          </pre>
        </section>
      )}

      {/* Module 2: Pedometer Sensor */}
      <section className="space-y-3">
        <div className="flex items-center gap-2">
          <span className="w-7 h-7 rounded-xl bg-[#CDE8B5] text-[#1A1A1A] flex items-center justify-center font-extrabold text-xs">
            02
          </span>
          <h3 className="font-heading font-extrabold text-base text-[#1A1A1A]">
            3-Axis HTML5 Accelerometer DSP &amp; IPAQ-SF Pedometer
          </h3>
        </div>

        <PedometerCard />
      </section>

      {/* Architecture Spec Highlights */}
      <section className="learnova-card p-6 text-xs text-[#1A1A1A] space-y-3 border-[#E8E8E8]">
        <h4 className="font-heading font-extrabold text-sm text-[#1A1A1A] flex items-center gap-2">
          <Code2 className="w-4 h-4 text-[#1A1A1A]" /> Rangkuman Spesifikasi Kinematika &amp; DSP
        </h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 leading-relaxed">
          <div className="bg-[#F6F6F6] p-4 rounded-2xl border border-[#E8E8E8] space-y-1.5">
            <div className="font-bold text-[#1A1A1A] flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-[#1A1A1A]" /> Vision Guard Formulas:
            </div>
            <ul className="list-disc list-inside space-y-1 text-[#9A9A9A] text-[11px]">
              <li><b className="text-[#1A1A1A]">Kalibrasi Baseline:</b> 60 frame (W_base, Y_sh_base, D_neck_base, &Theta;_base).</li>
              <li><b className="text-[#1A1A1A]">Slouching:</b> R_neck &lt; 0.78 atau |&Delta;&Theta;| &gt; 15&deg; atau &Delta;Y_sh &gt; 0.08.</li>
              <li><b className="text-[#1A1A1A]">Mata Terlalu Dekat:</b> R_depth = W_curr / W_base &ge; 1.28.</li>
              <li><b className="text-[#1A1A1A]">Bahu Miring:</b> &Theta;_roll = atan2(|&Delta;y|, |&Delta;x|) &gt; 12.0&deg;.</li>
              <li><b className="text-[#1A1A1A]">Overhead Stretch:</b> y_wrist &lt; y_nose &amp; sudut siku &gt; 140&deg;.</li>
            </ul>
          </div>

          <div className="bg-[#F6F6F6] p-4 rounded-2xl border border-[#E8E8E8] space-y-1.5">
            <div className="font-bold text-[#1A1A1A] flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-[#1A1A1A]" /> Pedometer DSP Formulas:
            </div>
            <ul className="list-disc list-inside space-y-1 text-[#9A9A9A] text-[11px]">
              <li><b className="text-[#1A1A1A]">Magnitudo 3-Axis:</b> a_mag = &radic;(ax&sup2; + ay&sup2; + az&sup2;).</li>
              <li><b className="text-[#1A1A1A]">High-Pass Filter:</b> a_net = a_mag - mean(a_mag) (25 sampel).</li>
              <li><b className="text-[#1A1A1A]">Deteksi Langkah:</b> a_net &gt; 1.35 m/s&sup2; &amp; jeda 250 - 1200 ms.</li>
              <li><b className="text-[#1A1A1A]">IPAQ-SF Cadence:</b> &lt;50 SPM (1.0x), 50-99 (3.3x), 100-129 (4.0x), &ge;130 (8.0x).</li>
            </ul>
          </div>
        </div>
      </section>
    </div>
  );
};
