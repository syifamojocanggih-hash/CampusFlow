import React, { useState } from "react";
import {
  TrendingUp,
  Moon,
  Zap,
  Clock,
  ChevronRight,
  Flame,
  Award,
  Sparkles,
  Play,
  Armchair,
  CheckCircle2,
} from "lucide-react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { StatusPill } from "@/components/common/StatusPill";
import { MOCK_TRIAD_DASHBOARD } from "@/mocks/campusflowMock";

interface TriadDashboardProps {
  onStartPanicRelief: () => void;
  onNavigateToFocus: () => void;
}

interface CircularProgressRingProps {
  percentage: number;
  strokeColor: string;
  trackColor?: string;
  icon: React.ReactNode;
  size?: number;
  strokeWidth?: number;
  innerBg?: string;
}

const CircularProgressRing: React.FC<CircularProgressRingProps> = ({
  percentage,
  strokeColor,
  trackColor = "#F6F6F6",
  icon,
  size = 54,
  strokeWidth = 4.5,
  innerBg = "bg-white",
}) => {
  const radius = (size - strokeWidth * 2) / 2;
  const circumference = 2 * Math.PI * radius;
  const clamped = Math.max(0, Math.min(100, percentage));
  const strokeDashoffset = circumference - (clamped / 100) * circumference;

  return (
    <div
      className="relative shrink-0 flex items-center justify-center select-none"
      style={{ width: size, height: size }}
    >
      <svg
        width={size}
        height={size}
        className="-rotate-90 transform"
      >
        {/* Track circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={trackColor}
          strokeWidth={strokeWidth}
          fill="none"
        />
        {/* Progress circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={strokeColor}
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
          fill="none"
          className="transition-all duration-700 ease-out"
        />
      </svg>
      {/* Center circle with supporting icon */}
      <div
        className={`absolute inset-0 m-auto w-7 h-7 rounded-full ${innerBg} flex items-center justify-center shadow-xs`}
      >
        {icon}
      </div>
    </div>
  );
};

export const TriadDashboard: React.FC<TriadDashboardProps> = ({
  onStartPanicRelief,
  onNavigateToFocus,
}) => {
  const [dashboardData] = useState(MOCK_TRIAD_DASHBOARD.data);
  const { today, weeklySummary, history } = dashboardData;

  // Calendar dates for mobile strip
  const calendarDays = [
    { day: "M", date: 12, active: false },
    { day: "T", date: 13, active: false },
    { day: "W", date: 14, active: true },
    { day: "T", date: 15, active: false },
    { day: "F", date: 16, active: false },
    { day: "S", date: 17, active: false },
    { day: "S", date: 18, active: false },
  ];

  return (
    <div className="space-y-6 pb-6">
      {/* ========================================================
          MOBILE HERO FEATURED CARD ("Your Progress" Sky Blue Card)
          ======================================================== */}
      <div className="lg:hidden bg-[#BDE6F0] rounded-[2rem] p-5 text-[#1A1A1A] shadow-softSky relative overflow-hidden">
        <div className="relative z-10 flex items-center justify-between">
          <div className="space-y-1.5 max-w-[70%]">
            <span className="text-[10px] font-bold uppercase tracking-wider bg-white/80 text-[#1A1A1A] px-2.5 py-0.5 rounded-full inline-flex items-center gap-1 shadow-xs">
              <Sparkles className="w-3 h-3 text-[#1A1A1A]" /> Sesi Terjadwal
            </span>
            <h2 className="text-lg font-heading font-extrabold leading-snug text-[#1A1A1A]">
              Vision Guard &amp; Active Break
            </h2>
            <p className="text-xs text-[#1A1A1A]/80 font-medium">
              50 mnt fokus &bull; 10 mnt peregangan
            </p>
          </div>
          <button
            onClick={onNavigateToFocus}
            className="w-12 h-12 rounded-full bg-white text-[#1A1A1A] flex items-center justify-center shadow-md hover:scale-105 transition-transform shrink-0"
            title="Mulai Sesi Fokus"
          >
            <Play className="w-5 h-5 fill-[#1A1A1A] ml-0.5" />
          </button>
        </div>
        {/* Decorative soft pastel circle */}
        <div className="absolute -right-6 -bottom-6 w-32 h-32 bg-white/20 rounded-full blur-lg pointer-events-none" />
      </div>

      {/* ========================================================
          MOBILE HORIZONTAL DATE SELECTOR (Calorie App Week Days)
          ======================================================== */}
      <div className="lg:hidden flex items-center justify-between gap-1.5 overflow-x-auto py-1 no-scrollbar">
        {calendarDays.map((d, i) => (
          <div
            key={i}
            className={`flex-1 min-w-[44px] py-2.5 rounded-2xl flex flex-col items-center justify-center text-center transition-all ${
              d.active
                ? "bg-[#FFF29A] text-[#1A1A1A] font-extrabold shadow-softPill border border-[#FFE966]"
                : "bg-white border border-[#E8E8E8] text-[#9A9A9A] font-medium"
            }`}
          >
            <span className="text-[10px] uppercase font-bold">{d.day}</span>
            <span className="text-xs font-heading font-extrabold mt-0.5">{d.date}</span>
            {d.active && <span className="w-1 h-1 rounded-full bg-[#1A1A1A] mt-1" />}
          </div>
        ))}
      </div>

      {/* ========================================================
          ROW OF 4 STAT CARDS (Pastel Palette with Circular Progress)
          ======================================================== */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Sedentary Hours */}
        <div className="learnova-card p-4 sm:p-5 flex flex-col justify-between">
          <div className="flex items-start justify-between gap-2">
            <div>
              <p className="text-xs font-semibold text-[#9A9A9A]">Total Waktu Duduk</p>
              <h3 className="text-2xl sm:text-3xl font-heading font-extrabold text-[#1A1A1A] mt-1 sensor-num">
                {today.totalSedentaryHours}
                <span className="text-xs font-medium text-[#9A9A9A] ml-1">Jam</span>
              </h3>
            </div>
            <CircularProgressRing
              percentage={Math.min(100, Math.round((today.totalSedentaryHours / 9.0) * 100))}
              strokeColor="#BDE6F0"
              trackColor="#F6F6F6"
              innerBg="bg-[#F0F9FB]"
              icon={<Armchair className="w-4 h-4 text-[#1A1A1A]" />}
            />
          </div>
          <div className="mt-3 pt-2.5 border-t border-[#E8E8E8] flex items-center justify-between">
            <span className="text-[11px] text-[#9A9A9A]">Batas: &le; 9.0h</span>
            <StatusPill status={today.sedentaryRiskStatus} showIcon={false} />
          </div>
        </div>

        {/* Card 2: Active Movement MVPA ("Breakfast" Mint Green Card) */}
        <div className="bg-[#CDE8B5] rounded-3xl p-4 sm:p-5 flex flex-col justify-between text-[#1A1A1A] shadow-softMint">
          <div className="flex items-start justify-between gap-2">
            <div>
              <p className="text-xs font-semibold text-[#1A1A1A]/80">Olahraga &amp; Jalan Cepat</p>
              <h3 className="text-2xl sm:text-3xl font-heading font-extrabold text-[#1A1A1A] mt-1 sensor-num">
                {today.totalMvpaMinutes}
                <span className="text-xs font-medium text-[#1A1A1A]/80 ml-1">Mnt</span>
              </h3>
            </div>
            <CircularProgressRing
              percentage={Math.min(100, Math.round((today.totalMvpaMinutes / 45) * 100))}
              strokeColor="#1A1A1A"
              trackColor="rgba(26,26,26,0.12)"
              innerBg="bg-white"
              icon={<TrendingUp className="w-4 h-4 text-[#1A1A1A]" />}
            />
          </div>
          <div className="mt-3 pt-2.5 border-t border-[#1A1A1A]/10 flex items-center justify-between">
            <span className="text-[11px] font-semibold text-[#1A1A1A]/70">{today.mvpaPerSedentaryRatio} mnt jalan tiap 1 jam duduk</span>
            <span className="text-[10px] font-extrabold bg-white text-[#1A1A1A] px-2.5 py-0.5 rounded-full shadow-xs">
              {today.totalMvpaMinutes >= 30 ? "OPTIMAL" : "WASPADA"}
            </span>
          </div>
        </div>

        {/* Card 3: Stress Score PSS-4 */}
        <div className="learnova-card p-4 sm:p-5 flex flex-col justify-between">
          <div className="flex items-start justify-between gap-2">
            <div>
              <p className="text-xs font-semibold text-[#9A9A9A]">Tingkat Stres Harian</p>
              <h3 className="text-2xl sm:text-3xl font-heading font-extrabold text-[#1A1A1A] mt-1 sensor-num">
                {today.pss4TotalScore}
                <span className="text-xs font-medium text-[#9A9A9A] ml-1">/ 16</span>
              </h3>
            </div>
            <CircularProgressRing
              percentage={Math.min(100, Math.round((today.pss4TotalScore / 16) * 100))}
              strokeColor="#F9B99A"
              trackColor="#F6F6F6"
              innerBg="bg-[#FDF4EF]"
              icon={<Moon className="w-4 h-4 text-[#1A1A1A]" />}
            />
          </div>
          <div className="mt-3 pt-2.5 border-t border-[#E8E8E8] flex items-center justify-between">
            <span className="text-[11px] text-[#9A9A9A]">Tidur: {today.sleepHours} jam</span>
            <StatusPill status={today.stressRiskLevel} showIcon={false} />
          </div>
        </div>

        {/* Card 4: Attendance & METs Target */}
        <div className="learnova-card p-4 sm:p-5 flex flex-col justify-between">
          <div className="flex items-start justify-between gap-2">
            <div>
              <p className="text-xs font-semibold text-[#9A9A9A]">Target Poin Gerak</p>
              <h3 className="text-2xl sm:text-3xl font-heading font-extrabold text-[#1A1A1A] mt-1 sensor-num">
                {Math.round((weeklySummary.weeklyMetsTotal / weeklySummary.weeklyMetsTarget) * 100)}%
              </h3>
            </div>
            <CircularProgressRing
              percentage={Math.min(100, Math.round((weeklySummary.weeklyMetsTotal / weeklySummary.weeklyMetsTarget) * 100))}
              strokeColor="#FFE966"
              trackColor="#F6F6F6"
              innerBg="bg-[#FFFDF0]"
              icon={<CheckCircle2 className="w-4 h-4 text-[#1A1A1A]" />}
            />
          </div>
          <div className="mt-3 pt-2.5 border-t border-[#E8E8E8] flex items-center justify-between">
            <span className="text-[11px] text-[#9A9A9A]">{weeklySummary.weeklyMetsTotal}/{weeklySummary.weeklyMetsTarget} Poin</span>
            <span className="text-[11px] font-bold text-[#1A1A1A] bg-[#CDE8B5] px-2 py-0.5 rounded-full">Minggu Ini</span>
          </div>
        </div>
      </div>

      {/* ========================================================
          PANIC RELIEF QUICK ACTION ACCENT BAR (Butter Yellow Accent)
          ======================================================== */}
      <div className="bg-[#FFF29A] rounded-3xl p-4 sm:p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-[#1A1A1A] border border-[#FFE966] shadow-softPill">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-2xl bg-white text-[#1A1A1A] flex items-center justify-center shadow-xs shrink-0">
            <Zap className="w-6 h-6 fill-[#1A1A1A]" />
          </div>
          <div>
            <h4 className="font-heading font-extrabold text-sm sm:text-base text-[#1A1A1A]">
              Cemas Menjelang Ujian atau Presentasi?
            </h4>
            <p className="text-xs text-[#1A1A1A]/80 font-medium mt-0.5">
              Latihan jalan santai &amp; relaksasi napas 15 menit untuk redakan cemas dan kembalikan fokus.
            </p>
          </div>
        </div>
        <button
          onClick={onStartPanicRelief}
          className="w-full sm:w-auto px-5 py-2.5 rounded-2xl bg-white hover:bg-[#F6F6F6] text-[#1A1A1A] text-xs font-extrabold transition-all shadow-xs flex items-center justify-center gap-2"
        >
          <Sparkles className="w-4 h-4 text-[#1A1A1A]" />
          Mulai Relaksasi 15 Menit
        </button>
      </div>

      {/* ========================================================
          MAIN TWO-COLUMN GRID
          ======================================================== */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* LEFT COLUMN: Today's Schedule & Wellbeing Goals (7 cols) */}
        <div className="lg:col-span-7 space-y-6">
          {/* Today's Schedule */}
          <div className="learnova-card p-5 sm:p-6 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-heading font-extrabold text-base text-[#1A1A1A] flex items-center gap-2">
                  <Clock className="w-4 h-4 text-[#1A1A1A]" /> Jadwal &amp; Rencana Hari Ini
                </h3>
                <p className="text-xs text-[#9A9A9A] mt-0.5">
                  Panduan aktivitas harian untuk gantikan waktu duduk lama
                </p>
              </div>
              <button
                onClick={onNavigateToFocus}
                className="text-xs font-bold text-[#1A1A1A] hover:underline flex items-center gap-1"
              >
                Lihat Semua <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="space-y-3">
              {/* Item 1 */}
              <div className="p-3.5 rounded-2xl bg-[#F6F6F6] border border-[#E8E8E8] flex items-center justify-between hover:bg-[#BDE6F0]/25 transition-colors">
                <div className="flex items-center gap-3">
                  <div className="text-center font-mono text-[11px] font-bold text-[#1A1A1A] bg-white px-2.5 py-1.5 rounded-xl border border-[#E8E8E8]">
                    09:00 AM
                  </div>
                  <div>
                    <h5 className="text-xs font-bold text-[#1A1A1A]">
                      Sesi Belajar &amp; Vision Guard
                    </h5>
                    <p className="text-[11px] text-[#9A9A9A]">Pemantauan postur tegak &amp; jarak mata</p>
                  </div>
                </div>
                <span className="text-[10px] font-extrabold bg-[#BDE6F0] text-[#1A1A1A] px-2.5 py-1 rounded-full">
                  SELESAI
                </span>
              </div>

              {/* Item 2 */}
              <div className="p-3.5 rounded-2xl bg-[#F6F6F6] border border-[#E8E8E8] flex items-center justify-between hover:bg-[#CDE8B5]/25 transition-colors">
                <div className="flex items-center gap-3">
                  <div className="text-center font-mono text-[11px] font-bold text-[#1A1A1A] bg-white px-2.5 py-1.5 rounded-xl border border-[#E8E8E8]">
                    11:30 AM
                  </div>
                  <div>
                    <h5 className="text-xs font-bold text-[#1A1A1A]">
                      Jeda Istirahat &amp; Peregangan
                    </h5>
                    <p className="text-[11px] text-[#9A9A9A]">Peregangan tangan di atas kepala (3x)</p>
                  </div>
                </div>
                <span className="text-[10px] font-bold bg-[#CDE8B5] text-[#1A1A1A] px-2.5 py-1 rounded-full">
                  MENDATANG
                </span>
              </div>

              {/* Item 3 */}
              <div className="p-3.5 rounded-2xl bg-[#F6F6F6] border border-[#E8E8E8] flex items-center justify-between hover:bg-[#C9B3E6]/25 transition-colors">
                <div className="flex items-center gap-3">
                  <div className="text-center font-mono text-[11px] font-bold text-[#1A1A1A] bg-white px-2.5 py-1.5 rounded-xl border border-[#E8E8E8]">
                    04:00 PM
                  </div>
                  <div>
                    <h5 className="text-xs font-bold text-[#1A1A1A]">
                      Jalan Santai Kampus
                    </h5>
                    <p className="text-[11px] text-[#9A9A9A]">Aktivitas jalan santai ~240 poin energi</p>
                  </div>
                </div>
                <span className="text-[10px] font-bold bg-[#C9B3E6] text-[#1A1A1A] px-2.5 py-1 rounded-full">
                  MENDATANG
                </span>
              </div>
            </div>
          </div>

          {/* Target Kebugaran 24-Jam (Movement Goals with Cal/Prot/Carb style bars) */}
          <div className="learnova-card p-5 sm:p-6 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-heading font-extrabold text-base text-[#1A1A1A]">
                  Target Kebugaran Harian
                </h3>
                <p className="text-xs text-[#9A9A9A] mt-0.5">
                  Pantau target harian untuk kurangi waktu duduk lama
                </p>
              </div>
              <span className="text-xs font-extrabold text-[#1A1A1A] bg-[#CDE8B5] px-3 py-1 rounded-full">
                {today.triadPillarsMet}/3 Target Tercapai
              </span>
            </div>

            <div className="space-y-3.5">
              {/* Goal 1: Sedentary Limit (Sky Blue bar) */}
              <div>
                <div className="flex justify-between text-xs font-bold text-[#1A1A1A] mb-1.5">
                  <span>Batas Waktu Duduk (&le; 9 Jam)</span>
                  <span className="font-mono">68%</span>
                </div>
                <div className="w-full bg-[#F6F6F6] h-3 rounded-full overflow-hidden p-0.5 border border-[#E8E8E8]">
                  <div className="bg-[#BDE6F0] h-full rounded-full transition-all duration-500" style={{ width: "68%" }} />
                </div>
              </div>

              {/* Goal 2: MVPA (Mint Green bar) */}
              <div>
                <div className="flex justify-between text-xs font-bold text-[#1A1A1A] mb-1.5">
                  <span>Target Olahraga &amp; Jalan Cepat (&ge; 30 Mnt)</span>
                  <span className="font-mono">100%</span>
                </div>
                <div className="w-full bg-[#F6F6F6] h-3 rounded-full overflow-hidden p-0.5 border border-[#E8E8E8]">
                  <div className="bg-[#CDE8B5] h-full rounded-full transition-all duration-500" style={{ width: "100%" }} />
                </div>
              </div>

              {/* Goal 3: Restorative Sleep (Peach Orange bar) */}
              <div>
                <div className="flex justify-between text-xs font-bold text-[#1A1A1A] mb-1.5">
                  <span>Tidur Cukup Malam Hari (7–9 Jam)</span>
                  <span className="font-mono">75%</span>
                </div>
                <div className="w-full bg-[#F6F6F6] h-3 rounded-full overflow-hidden p-0.5 border border-[#E8E8E8]">
                  <div className="bg-[#F9B99A] h-full rounded-full transition-all duration-500" style={{ width: "75%" }} />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: Donut Progress (Peach ring), Streak Card, & Trend Chart (5 cols) */}
        <div className="lg:col-span-5 space-y-6">
          {/* Circular Wellbeing Donut Progress ("Calorie 520 Kcal" style with Peach Orange ring) */}
          <div className="learnova-card p-5 sm:p-6 flex flex-col items-center justify-center text-center">
            <div className="w-full flex items-center justify-between mb-3">
              <h3 className="font-heading font-extrabold text-sm text-[#1A1A1A]">
                Keseimbangan Gaya Hidup
              </h3>
              <span className="text-[11px] text-[#9A9A9A] font-medium">Minggu Ini</span>
            </div>

            {/* Circular Donut Progress Ring */}
            <div className="relative w-40 h-40 flex items-center justify-center my-2">
              <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
                <circle
                  cx="50"
                  cy="50"
                  r="40"
                  stroke="#F6F6F6"
                  strokeWidth="10"
                  fill="transparent"
                />
                <circle
                  cx="50"
                  cy="50"
                  r="40"
                  stroke="#F9B99A"
                  strokeWidth="10"
                  strokeDasharray="251.2"
                  strokeDashoffset="70"
                  strokeLinecap="round"
                  fill="transparent"
                  className="transition-all duration-1000 ease-out"
                />
              </svg>
              <div className="absolute flex flex-col items-center justify-center">
                <span className="text-3xl font-heading font-extrabold text-[#1A1A1A] sensor-num">
                  72%
                </span>
                <span className="text-[10px] text-[#9A9A9A] font-semibold uppercase tracking-wider">
                  Overall Score
                </span>
              </div>
            </div>

            {/* Donut Legend */}
            <div className="flex items-center justify-center gap-4 text-xs font-semibold mt-3 text-[#1A1A1A]">
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-[#F9B99A]" />
                <span>Optimal (72%)</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-[#CDE8B5]" />
                <span>Waspada (20%)</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-[#E8E8E8]" />
                <span>Pending (8%)</span>
              </div>
            </div>
          </div>

          {/* Current Streak Card (Fresh Sky Blue Card) */}
          <div className="bg-[#BDE6F0] rounded-3xl p-5 sm:p-6 text-[#1A1A1A] shadow-softSky relative overflow-hidden flex flex-col justify-between">
            <div className="flex items-center justify-between mb-4 relative z-10">
              <div className="flex items-center gap-2 text-xs font-extrabold uppercase tracking-wider text-[#1A1A1A]">
                <Flame className="w-4 h-4 fill-[#F9B99A] text-[#F9B99A]" />
                <span>Konsistensi Kebugaran</span>
              </div>
              <span className="bg-[#FFF29A] text-[#1A1A1A] text-[10px] font-extrabold px-2.5 py-0.5 rounded-full shadow-xs">
                +420 XP
              </span>
            </div>

            <div className="my-2 relative z-10">
              <div className="flex items-baseline gap-2">
                <span className="text-4xl sm:text-5xl font-heading font-extrabold sensor-num text-[#1A1A1A]">
                  {weeklySummary.currentStreakDays}
                </span>
                <span className="text-lg font-bold text-[#1A1A1A]/80">Hari Beruntun</span>
              </div>
              <p className="text-xs text-[#1A1A1A]/80 font-medium mt-1">
                Keep it up! Anda berhasil mempertahankan konsistensi duduk sehat &amp; gerak terukur.
              </p>
            </div>

            <div className="mt-4 pt-3 border-t border-[#1A1A1A]/10 flex items-center justify-between text-xs font-semibold text-[#1A1A1A]/90 relative z-10">
              <span>Target Mingguan: 7 Hari</span>
              <span className="flex items-center gap-1 font-bold text-[#1A1A1A] bg-white px-2 py-0.5 rounded-full shadow-xs">
                <Award className="w-3.5 h-3.5 text-[#F9B99A]" /> Badge Unlocked!
              </span>
            </div>

            {/* Background ambient shape */}
            <div className="absolute -right-10 -bottom-10 w-40 h-40 bg-white/20 rounded-full blur-2xl pointer-events-none" />
          </div>

          {/* Performance Trend Area Chart */}
          <div className="learnova-card p-5 sm:p-6 space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-heading font-extrabold text-sm text-[#1A1A1A]">
                  Performance Overview
                </h3>
                <p className="text-[11px] text-[#9A9A9A]">Tren gerak aktif (MVPA) 14 hari terakhir</p>
              </div>
              <span className="text-[10px] font-extrabold text-[#1A1A1A] bg-[#FFF29A] px-2.5 py-0.5 rounded-full shadow-xs">
                Bulan Ini
              </span>
            </div>

            <div className="h-44 w-full pt-2">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={history} margin={{ top: 5, right: 5, left: -25, bottom: 0 }}>
                  <defs>
                    <linearGradient id="pastelMintGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#CDE8B5" stopOpacity={0.7} />
                      <stop offset="95%" stopColor="#CDE8B5" stopOpacity={0.05} />
                    </linearGradient>
                  </defs>
                  <XAxis
                    dataKey="logDate"
                    tickFormatter={(val) => val.slice(8)}
                    tick={{ fontSize: 10, fill: "#9A9A9A" }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis
                    tick={{ fontSize: 10, fill: "#9A9A9A" }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "#FFFFFF",
                      color: "#1A1A1A",
                      borderRadius: "16px",
                      border: "1px solid #E8E8E8",
                      fontSize: "11px",
                      boxShadow: "0 8px 20px -4px rgba(26,26,26,0.08)",
                    }}
                  />
                  <Area
                    type="monotone"
                    dataKey="totalMvpaMinutes"
                    name="MVPA (Menit)"
                    stroke="#8ECAD7"
                    strokeWidth={2.5}
                    fillOpacity={1}
                    fill="url(#pastelMintGradient)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
