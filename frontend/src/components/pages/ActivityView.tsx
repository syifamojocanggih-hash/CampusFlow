import React, { useState } from "react";
import { PlusCircle } from "lucide-react";
import { PedometerCard } from "@/components/sensor/PedometerCard";
import { api } from "@/lib/api";
import type { ActivityIntensity } from "@/types";

export const ActivityView: React.FC = () => {
  const [manualIntensity, setManualIntensity] = useState<ActivityIntensity>("MUSCLE_STRENGTHENING");
  const [manualDuration, setManualDuration] = useState(30);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitMessage, setSubmitMessage] = useState<string | null>(null);

  const handleSaveManual = async () => {
    try {
      setIsSubmitting(true);
      await api.submitPhysicalActivity({
        activityDate: new Date().toISOString().split("T")[0],
        intensityType: manualIntensity,
        durationMinutes: manualDuration,
        source: "MANUAL_LOG",
        notes: `Input manual via CampusFlow web form (${manualIntensity})`,
      });
      setSubmitMessage("Aktivitas berhasil tersimpan! (+50 XP)");
      setTimeout(() => setSubmitMessage(null), 3500);
    } catch (err) {
      console.error("Gagal menyimpan aktivitas manual:", err);
      alert("Gagal menyimpan aktivitas.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 max-w-xl mx-auto">
      {/* 3-Axis DSP Pedometer Card */}
      <PedometerCard />

      {/* Fallback Form Manual Input MSE */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs space-y-4">
        <div>
          <h3 className="font-semibold text-xs text-slate-500 uppercase tracking-wider">
            Input Aktivitas Manual / Muscle-Strengthening (MSE)
          </h3>
          <p className="text-xs text-slate-500 mt-1">
            Untuk mahasiswa di PC desktop atau latihan beban tanpa membawa ponsel:
          </p>
        </div>

        {submitMessage && (
          <div className="p-3 bg-emerald-50 text-emerald-800 text-xs rounded-xl border border-emerald-200 font-medium">
            {submitMessage}
          </div>
        )}

        <div className="flex flex-col sm:flex-row gap-2">
          <select
            value={manualIntensity}
            onChange={(e) => setManualIntensity(e.target.value as ActivityIntensity)}
            className="text-xs border border-slate-200 rounded-lg px-3 py-2 flex-1 bg-white focus:outline-hidden focus:ring-2 focus:ring-primary/20"
          >
            <option value="MUSCLE_STRENGTHENING">Muscle-Strengthening Exercise (5.0 METs)</option>
            <option value="WALKING">Jalan Kaki Kampus (3.3 METs)</option>
            <option value="MODERATE">Olahraga Sedang / Bersepeda (4.0 METs)</option>
            <option value="VIGOROUS">Lari Cepat / Olahraga Berat (8.0 METs)</option>
            <option value="ACUTE_AEROBIC_RELIEF">Panic Relief Aerobik Akut (5.0 METs)</option>
          </select>
          <div className="flex gap-2">
            <input
              type="number"
              placeholder="Menit"
              value={manualDuration}
              onChange={(e) => setManualDuration(Number(e.target.value))}
              min={1}
              max={360}
              className="text-xs border border-slate-200 rounded-lg px-3 py-2 w-20 text-center focus:outline-hidden focus:ring-2 focus:ring-primary/20"
            />
            <button
              onClick={handleSaveManual}
              disabled={isSubmitting}
              className="bg-primary hover:bg-blue-700 disabled:opacity-50 text-white text-xs font-medium px-4 py-2 rounded-lg flex items-center gap-1 transition-colors shrink-0"
            >
              <PlusCircle className="w-4 h-4" /> {isSubmitting ? "Menyimpan..." : "Simpan"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
