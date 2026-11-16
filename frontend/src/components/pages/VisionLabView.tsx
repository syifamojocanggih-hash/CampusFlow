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
                Ruang Pengujian
              </span>
            </div>
            <p className="text-xs text-[#9A9A9A] mt-0.5">
              Ruang uji coba deteksi postur kamera AI dan sensor langkah HP secara langsung di browser Anda.
            </p>
          </div>
        </div>

        <span className="text-xs font-bold text-[#1A1A1A] bg-[#F6F6F6] px-3.5 py-2 rounded-2xl border border-[#E8E8E8]">
          Uji Cepat: Aktifkan <strong>MODE COBA (15s)</strong>
        </span>
      </div>

      {/* Module 1: Vision Guard */}
      <section className="space-y-3">
        <div className="flex items-center gap-2">
          <span className="w-7 h-7 rounded-xl bg-[#BDE6F0] text-[#1A1A1A] flex items-center justify-center font-extrabold text-xs">
            01
          </span>
          <h3 className="font-heading font-extrabold text-base text-[#1A1A1A]">
            Pemindai Postur Tubuh &amp; Jeda Istirahat Aktif
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
                Data Sesi Belajar yang Dikirim ke Profil
              </h4>
            </div>
            <span className="text-[11px] bg-[#FFF29A] text-[#1A1A1A] px-2.5 py-0.5 rounded-full font-mono font-bold">
              Sumber: {lastPayload.verificationSource}
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
            Penghitung Langkah Otomatis (Sensor Gerak HP)
          </h3>
        </div>

        <PedometerCard />
      </section>

      {/* Architecture Spec Highlights */}
      <section className="learnova-card p-6 text-xs text-[#1A1A1A] space-y-3 border-[#E8E8E8]">
        <h4 className="font-heading font-extrabold text-sm text-[#1A1A1A] flex items-center gap-2">
          <Code2 className="w-4 h-4 text-[#1A1A1A]" /> Cara Kerja Deteksi &amp; Rumus Sensor
        </h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 leading-relaxed">
          <div className="bg-[#F6F6F6] p-4 rounded-2xl border border-[#E8E8E8] space-y-1.5">
            <div className="font-bold text-[#1A1A1A] flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-[#1A1A1A]" /> Aturan Postur Tubuh (Vision Guard):
            </div>
            <ul className="list-disc list-inside space-y-1 text-[#9A9A9A] text-[11px]">
              <li><b className="text-[#1A1A1A]">Pengaturan Awal:</b> Merekam 60 frame posisi duduk tegak alami pengguna.</li>
              <li><b className="text-[#1A1A1A]">Posisi Bungkuk:</b> Terdeteksi saat leher turun atau bahu membungkuk ke depan.</li>
              <li><b className="text-[#1A1A1A]">Mata Terlalu Dekat:</b> Terdeteksi saat bahu membesar &ge; 1.28x dari posisi awal (&lt;50 cm).</li>
              <li><b className="text-[#1A1A1A]">Bahu Miring:</b> Terdeteksi saat kemiringan kedua bahu melebihi 12 derajat.</li>
              <li><b className="text-[#1A1A1A]">Peregangan Tangan:</b> Kedua tangan diangkat lurus di atas hidung &amp; kepala.</li>
            </ul>
          </div>

          <div className="bg-[#F6F6F6] p-4 rounded-2xl border border-[#E8E8E8] space-y-1.5">
            <div className="font-bold text-[#1A1A1A] flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-[#1A1A1A]" /> Aturan Langkah (Pedometer HP):
            </div>
            <ul className="list-disc list-inside space-y-1 text-[#9A9A9A] text-[11px]">
              <li><b className="text-[#1A1A1A]">Sensor 3-Arah:</b> Menghitung total percepatan gerak smartphone di dalam saku.</li>
              <li><b className="text-[#1A1A1A]">Penyaring Goyangan:</b> Memisahkan gravitasi bumi agar tidak salah hitung saat duduk.</li>
              <li><b className="text-[#1A1A1A]">Validasi Langkah:</b> Hanya menghitung ayunan langkah ritmis (50–240 langkah/menit).</li>
              <li><b className="text-[#1A1A1A]">Tingkat Intensitas:</b> Santai (1x), Jalan Santai (3.3x), Jalan Cepat (4x), Lari (8x).</li>
            </ul>
          </div>
        </div>
      </section>
    </div>
  );
};
