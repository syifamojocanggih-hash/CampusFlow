import React, { useState, useEffect, useMemo } from "react";
import {
  Moon,
  Zap,
  Clock,
  BookOpen,
  Play,
  Monitor,
  Plus,
  X,
  Calendar,
  Activity,
  UploadCloud,
  FileText,
} from "lucide-react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { api } from "@/lib/api";
import { screenTimeTracker } from "@/utils/screenTimeTracker";
import {
  calculateBurnoutRiskIndex,
  BURNOUT_CONSTANTS,
  type ScheduleItemInput,
} from "@/utils/burnoutCalculator";
import type { AcademicScheduleDTO } from "@/types";

interface TriadDashboardProps {
  onStartPanicRelief: () => void;
  onNavigateToFocus: () => void;
}

const DAY_NAMES = [
  "Senin",
  "Selasa",
  "Rabu",
  "Kamis",
  "Jumat",
  "Sabtu",
  "Minggu",
];

const INITIAL_SCHEDULES: AcademicScheduleDTO[] = [
  { dayOfWeek: 1, subjectName: "Algoritma & Struktur Data", creditHours: 3, isPracticum: true, isExamWeek: false },
  { dayOfWeek: 2, subjectName: "Kecerdasan Buatan", creditHours: 3, isPracticum: false, isExamWeek: false },
  { dayOfWeek: 3, subjectName: "Basis Data Terdistribusi", creditHours: 3, isPracticum: true, isExamWeek: false },
  { dayOfWeek: 4, subjectName: "Pemrograman Web Lanjut", creditHours: 2, isPracticum: true, isExamWeek: false },
  { dayOfWeek: 5, subjectName: "Etika Profesi & Komunikasi", creditHours: 2, isPracticum: false, isExamWeek: false },
];

const MOCK_14_DAY_TREND = [
  { logDate: "03/11", burnoutIndex: 58, recoveryScore: 30, academicLoad: 12 },
  { logDate: "04/11", burnoutIndex: 52, recoveryScore: 35, academicLoad: 10 },
  { logDate: "05/11", burnoutIndex: 44, recoveryScore: 40, academicLoad: 8 },
  { logDate: "06/11", burnoutIndex: 38, recoveryScore: 45, academicLoad: 7 },
  { logDate: "07/11", burnoutIndex: 32, recoveryScore: 50, academicLoad: 6 },
  { logDate: "08/11", burnoutIndex: 26, recoveryScore: 50, academicLoad: 4 },
  { logDate: "09/11", burnoutIndex: 20, recoveryScore: 50, academicLoad: 3 },
  { logDate: "10/11", burnoutIndex: 35, recoveryScore: 45, academicLoad: 9 },
  { logDate: "11/11", burnoutIndex: 42, recoveryScore: 40, academicLoad: 11 },
  { logDate: "12/11", burnoutIndex: 48, recoveryScore: 38, academicLoad: 12 },
  { logDate: "13/11", burnoutIndex: 40, recoveryScore: 45, academicLoad: 8 },
  { logDate: "14/11", burnoutIndex: 34, recoveryScore: 50, academicLoad: 7 },
  { logDate: "15/11", burnoutIndex: 29, recoveryScore: 50, academicLoad: 6 },
  { logDate: "16/11", burnoutIndex: 25, recoveryScore: 50, academicLoad: 6.5 },
];

export const TriadDashboard: React.FC<TriadDashboardProps> = ({
  onStartPanicRelief,
  onNavigateToFocus,
}) => {
  // 1. Data States
  const [schedules, setSchedules] = useState<AcademicScheduleDTO[]>(INITIAL_SCHEDULES);
  const [sleepHours, setSleepHours] = useState<number>(7.2);
  const [screenTimeHours, setScreenTimeHours] = useState<number>(() => {
    const tracked = screenTimeTracker.getTodayScreenTimeHours();
    return tracked > 0 ? tracked : 5.4;
  });
  const [verifiedBreakCount, setVerifiedBreakCount] = useState<number>(1);
  const [isKrsModalOpen, setIsKrsModalOpen] = useState<boolean>(false);
  const [krsModalTab, setKrsModalTab] = useState<"upload" | "manual">("upload");
  const [isExtractingPdf, setIsExtractingPdf] = useState<boolean>(false);

  // New Course Form State
  const [newDayOfWeek, setNewDayOfWeek] = useState<number>(1);
  const [newSubjectName, setNewSubjectName] = useState<string>("");
  const [newCreditHours, setNewCreditHours] = useState<number>(3);
  const [newIsPracticum, setNewIsPracticum] = useState<boolean>(false);
  const [newIsExamWeek, setNewIsExamWeek] = useState<boolean>(false);

  // Load schedule from API or fallback
  useEffect(() => {
    api
      .getAcademicSchedules()
      .then((res) => {
        if (res.data && res.data.length > 0) {
          setSchedules(res.data);
        }
      })
      .catch((err) => console.warn("[TriadDashboard] Gagal memuat jadwal KRS:", err));
  }, []);

  // Sync screen time periodically
  useEffect(() => {
    const interval = setInterval(() => {
      const live = screenTimeTracker.getTodayScreenTimeHours();
      if (live > 0) {
        setScreenTimeHours(live);
      }
    }, 15000);
    return () => clearInterval(interval);
  }, []);

  // Today is Wednesday in academic demo (Day 3: Rabu, or getDay() dynamically)
  const currentDayOfWeek = 3;

  // Filter schedules for today
  const todaySchedules = useMemo(() => {
    return schedules.filter((s) => s.dayOfWeek === currentDayOfWeek);
  }, [schedules, currentDayOfWeek]);

  // Compute PRD v4.0 Unified Burnout Risk Index (0-100)
  const scheduleInputs: ScheduleItemInput[] = useMemo(() => {
    return todaySchedules.map((s) => ({
      creditHours: s.creditHours,
      isPracticum: s.isPracticum,
      isExamWeek: s.isExamWeek,
    }));
  }, [todaySchedules]);

  const burnoutResult = useMemo(() => {
    return calculateBurnoutRiskIndex(
      scheduleInputs,
      screenTimeHours,
      sleepHours,
      verifiedBreakCount
    );
  }, [scheduleInputs, screenTimeHours, sleepHours, verifiedBreakCount]);

  const {
    academicLoadScore,
    screenFatigueScore,
    recoveryScore,
    burnoutIndex,
    status: burnoutStatus,
  } = burnoutResult;

  // Calculations for display
  const totalLoadScore = Number((academicLoadScore + screenFatigueScore).toFixed(1));
  const rawSleepScore = Number(
    Math.min(
      BURNOUT_CONSTANTS.SLEEP_RECOVERY_MAX_SCORE,
      (sleepHours / 8.0) * BURNOUT_CONSTANTS.SLEEP_RECOVERY_MAX_SCORE
    ).toFixed(1)
  );
  const activeBreakBonus = verifiedBreakCount * BURNOUT_CONSTANTS.ACTIVE_BREAK_SCORE_PER_SESSION;

  // Status Styling
  const statusMeta = useMemo(() => {
    if (burnoutStatus === "LOW") {
      return {
        label: "OPTIMAL / AMAN",
        badgeBg: "bg-[#CDE8B5] text-[#166534]",
        cardBg: "bg-[#F3F9EE] border-[#CDE8B5]",
        ringColor: "#22C55E",
        textColor: "text-[#166534]",
        desc: "Keseimbangan beban kuliah, waktu layar, dan pemulihan Anda berada di zona aman.",
      };
    }
    if (burnoutStatus === "MODERATE") {
      return {
        label: "WASPADA KELELAHAN",
        badgeBg: "bg-[#FFF29A] text-[#854D0E]",
        cardBg: "bg-[#FFFDF0] border-[#FFE966]",
        ringColor: "#F59E0B",
        textColor: "text-[#854D0E]",
        desc: "Beban belajar mulai mendominasi. Segera lakukan Active Break 2 menit dan cukupi tidur malam.",
      };
    }
    return {
      label: "RISIKO TINGGI (BURNOUT)",
      badgeBg: "bg-[#F7A8B0] text-[#9F1239]",
      cardBg: "bg-[#FFF1F2] border-[#F7A8B0]",
      ringColor: "#EF4444",
      textColor: "text-[#9F1239]",
      desc: "Kelelahan kognitif kritis. Disarankan jeda istirahat penuh dan konsultasi dengan AI Coach.",
    };
  }, [burnoutStatus]);

  // Handle Add Course to KRS
  const handleAddCourse = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSubjectName.trim()) return;

    const newCourse: AcademicScheduleDTO = {
      dayOfWeek: newDayOfWeek,
      subjectName: newSubjectName.trim(),
      creditHours: newCreditHours,
      isPracticum: newIsPracticum,
      isExamWeek: newIsExamWeek,
    };

    try {
      await api.saveAcademicSchedule(newCourse);
      setSchedules((prev) => [...prev, newCourse]);
      setNewSubjectName("");
      setNewCreditHours(3);
      setNewIsPracticum(false);
      setNewIsExamWeek(false);
      setIsKrsModalOpen(false);
    } catch (err) {
      console.error("Gagal menyimpan KRS:", err);
    }
  };

  // Handle Smart PDF KRS Parser simulation (PRD v4.0 Section 3.1)
  const handleSimulatePdfParse = () => {
    setIsExtractingPdf(true);
    setTimeout(() => {
      const extractedCourses: AcademicScheduleDTO[] = [
        { dayOfWeek: 1, subjectName: "Algoritma & Struktur Data", creditHours: 3, isPracticum: true, isExamWeek: false },
        { dayOfWeek: 2, subjectName: "Kecerdasan Buatan", creditHours: 3, isPracticum: false, isExamWeek: false },
        { dayOfWeek: 3, subjectName: "Basis Data Terdistribusi", creditHours: 3, isPracticum: true, isExamWeek: false },
        { dayOfWeek: 4, subjectName: "Pemrograman Web Lanjut", creditHours: 3, isPracticum: true, isExamWeek: false },
        { dayOfWeek: 5, subjectName: "Jaringan Komputer Lanjut", creditHours: 3, isPracticum: true, isExamWeek: false },
      ];
      setSchedules(extractedCourses);
      setIsExtractingPdf(false);
      setIsKrsModalOpen(false);
    }, 1200);
  };

  return (
    <div className="space-y-6 pb-8">
      {/* ========================================================
          1. HERO CARD: STRAVA AKADEMIK & BURNOUT RISK INDEX (0-100)
          ======================================================== */}
      <div className={`rounded-3xl p-6 sm:p-8 border shadow-xs transition-all ${statusMeta.cardBg}`}>
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
          {/* Left: Score Gauge & Description */}
          <div className="flex items-center gap-5 sm:gap-7">
            {/* Circular Ring Gauge */}
            <div className="relative w-28 h-28 sm:w-32 sm:h-32 shrink-0 flex items-center justify-center select-none">
              <svg className="w-full h-full -rotate-90 transform" viewBox="0 0 100 100">
                <circle
                  cx="50"
                  cy="50"
                  r="42"
                  stroke="#E8E8E8"
                  strokeWidth="8"
                  fill="none"
                />
                <circle
                  cx="50"
                  cy="50"
                  r="42"
                  stroke={statusMeta.ringColor}
                  strokeWidth="8"
                  strokeDasharray={263.89}
                  strokeDashoffset={263.89 - (Math.min(100, burnoutIndex) / 100) * 263.89}
                  strokeLinecap="round"
                  fill="none"
                  className="transition-all duration-1000 ease-out"
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                <span className="text-3xl sm:text-4xl font-heading font-extrabold text-[#1A1A1A] sensor-num leading-none">
                  {Math.round(burnoutIndex)}
                </span>
                <span className="text-[10px] text-[#9A9A9A] font-bold uppercase tracking-wider mt-0.5">
                  Index / 100
                </span>
              </div>
            </div>

            {/* Title & Status */}
            <div className="space-y-2">
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-[11px] font-extrabold uppercase tracking-wider text-[#9A9A9A]">
                  Dashboard Strava Akademik
                </span>
              </div>
              <h2 className="text-xl sm:text-2xl font-heading font-extrabold text-[#1A1A1A] leading-tight">
                Burnout Risk Index
              </h2>
              <p className="text-xs text-[#1A1A1A]/80 font-medium max-w-md leading-relaxed">
                {statusMeta.desc}
              </p>
            </div>
          </div>

          {/* Right: Balance Formula Breakdown (Effort vs Recovery) */}
          <div className="w-full lg:w-auto flex-1 lg:max-w-md bg-white/90 backdrop-blur-xs rounded-2xl p-4 sm:p-5 border border-[#E8E8E8] shadow-xs space-y-3">
            <div className="flex items-center justify-between text-xs font-bold text-[#1A1A1A] pb-2 border-b border-[#F0F0F0]">
              <span className="flex items-center gap-1.5">
                <Activity className="w-4 h-4 text-[#1A1A1A]" />
                Keseimbangan Fusi Parameter
              </span>
              <span className="font-mono text-[11px] text-[#9A9A9A]">
                (Beban) - (Pemulihan)
              </span>
            </div>

            {/* Formula Balance Bar */}
            <div className="space-y-1.5">
              <div className="flex justify-between text-[11px] font-semibold text-[#1A1A1A]">
                <span>Total Beban: <strong className="text-rose-600 font-mono">{totalLoadScore} Poin</strong></span>
                <span>Pemulihan: <strong className="text-emerald-600 font-mono">{recoveryScore} Poin</strong></span>
              </div>
              <div className="w-full bg-[#F6F6F6] h-2.5 rounded-full overflow-hidden flex border border-[#E8E8E8]">
                <div
                  className="bg-[#F7A8B0] h-full transition-all duration-700"
                  style={{ width: `${Math.min(100, (totalLoadScore / (totalLoadScore + recoveryScore || 1)) * 100)}%` }}
                  title="Porsi Beban Akademik & Layar"
                />
                <div
                  className="bg-[#CDE8B5] h-full transition-all duration-700"
                  style={{ width: `${Math.min(100, (recoveryScore / (totalLoadScore + recoveryScore || 1)) * 100)}%` }}
                  title="Porsi Pemulihan (Tidur & Jeda Aktif)"
                />
              </div>
            </div>

            {/* Micro Breakdown Items */}
            <div className="grid grid-cols-2 gap-2 text-[11px] pt-1">
              <div className="bg-[#FAFAFA] p-2 rounded-xl border border-[#EEEEEE]">
                <span className="text-[#9A9A9A] block text-[10px]">Beban Akademik (KRS)</span>
                <span className="font-bold text-[#1A1A1A] font-mono">{academicLoadScore} Poin</span>
              </div>
              <div className="bg-[#FAFAFA] p-2 rounded-xl border border-[#EEEEEE]">
                <span className="text-[#9A9A9A] block text-[10px]">Fatigue Layar (&gt;8h)</span>
                <span className="font-bold text-[#1A1A1A] font-mono">+{screenFatigueScore} Poin</span>
              </div>
              <div className="bg-[#FAFAFA] p-2 rounded-xl border border-[#EEEEEE]">
                <span className="text-[#9A9A9A] block text-[10px]">Restorasi Tidur</span>
                <span className="font-bold text-[#1A1A1A] font-mono">{rawSleepScore} / 40 Poin</span>
              </div>
              <div className="bg-[#FAFAFA] p-2 rounded-xl border border-[#EEEEEE]">
                <span className="text-[#9A9A9A] block text-[10px]">Active Break (x10)</span>
                <span className="font-bold text-emerald-600 font-mono">+{activeBreakBonus} Poin</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ========================================================
          2. ROW OF 4 CORE PARAMETER CARDS (PRD v4.0 Pillars)
          ======================================================== */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Academic Load (KRS) */}
        <div className="learnova-card p-4 sm:p-5 flex flex-col justify-between">
          <div className="flex items-start justify-between gap-2">
            <div>
              <p className="text-xs font-semibold text-[#9A9A9A]">Beban Kuliah (KRS)</p>
              <h3 className="text-2xl sm:text-3xl font-heading font-extrabold text-[#1A1A1A] mt-1 sensor-num">
                {academicLoadScore}
                <span className="text-xs font-medium text-[#9A9A9A] ml-1">Poin</span>
              </h3>
            </div>
            <div className="w-10 h-10 rounded-2xl bg-[#FFF29A] flex items-center justify-center text-[#1A1A1A] shrink-0 shadow-xs">
              <BookOpen className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3 pt-2.5 border-t border-[#E8E8E8] flex items-center justify-between">
            <span className="text-[11px] text-[#9A9A9A]">{todaySchedules.length} Kuliah Hari Ini</span>
            <button
              onClick={() => setIsKrsModalOpen(true)}
              className="text-[10px] font-extrabold text-[#1A1A1A] bg-[#FFF29A] hover:bg-[#FFE966] px-2.5 py-0.5 rounded-full transition-colors"
            >
              KRS &rarr;
            </button>
          </div>
        </div>

        {/* Card 2: Screen Time (Passive Page Visibility API) */}
        <div className="learnova-card p-4 sm:p-5 flex flex-col justify-between">
          <div className="flex items-start justify-between gap-2">
            <div>
              <p className="text-xs font-semibold text-[#9A9A9A]">Waktu Layar Pasif</p>
              <h3 className="text-2xl sm:text-3xl font-heading font-extrabold text-[#1A1A1A] mt-1 sensor-num">
                {screenTimeHours}
                <span className="text-xs font-medium text-[#9A9A9A] ml-1">Jam</span>
              </h3>
            </div>
            <div className="w-10 h-10 rounded-2xl bg-[#BDE6F0] flex items-center justify-center text-[#1A1A1A] shrink-0 shadow-xs">
              <Monitor className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3 pt-2.5 border-t border-[#E8E8E8] flex items-center justify-between">
            <span className="text-[11px] text-[#9A9A9A]">Batas Aman: &le; 8.0h</span>
            <span className={`text-[10px] font-extrabold px-2.5 py-0.5 rounded-full ${
              screenTimeHours <= 8.0 ? "bg-[#CDE8B5] text-[#166534]" : "bg-[#F7A8B0] text-[#9F1239]"
            }`}>
              {screenTimeHours <= 8.0 ? "AMAN" : `+${screenFatigueScore} PENALTI`}
            </span>
          </div>
        </div>

        {/* Card 3: Sleep Duration & Recovery */}
        <div className="learnova-card p-4 sm:p-5 flex flex-col justify-between">
          <div className="flex items-start justify-between gap-2">
            <div>
              <p className="text-xs font-semibold text-[#9A9A9A]">Durasi Tidur Malam</p>
              <h3 className="text-2xl sm:text-3xl font-heading font-extrabold text-[#1A1A1A] mt-1 sensor-num">
                {sleepHours}
                <span className="text-xs font-medium text-[#9A9A9A] ml-1">Jam</span>
              </h3>
            </div>
            <div className="w-10 h-10 rounded-2xl bg-[#F7A8B0] flex items-center justify-center text-[#1A1A1A] shrink-0 shadow-xs">
              <Moon className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3 pt-2.5 border-t border-[#E8E8E8] flex items-center justify-between">
            <span className="text-[11px] text-[#9A9A9A]">{rawSleepScore}/40 Poin</span>
            <div className="flex items-center gap-1">
              <button
                onClick={() => setSleepHours((prev) => Math.max(3, Number((prev - 0.5).toFixed(1))))}
                className="w-5 h-5 rounded-full bg-[#F6F6F6] hover:bg-[#E8E8E8] text-xs font-bold flex items-center justify-center"
                title="Kurangi 30 menit"
              >
                -
              </button>
              <button
                onClick={() => setSleepHours((prev) => Math.min(12, Number((prev + 0.5).toFixed(1))))}
                className="w-5 h-5 rounded-full bg-[#F6F6F6] hover:bg-[#E8E8E8] text-xs font-bold flex items-center justify-center"
                title="Tambah 30 menit"
              >
                +
              </button>
            </div>
          </div>
        </div>

        {/* Card 4: Verified Active Break (On-Demand MediaPipe 2 Mins) */}
        <div className="bg-[#CDE8B5] rounded-3xl p-4 sm:p-5 flex flex-col justify-between text-[#1A1A1A] shadow-softMint">
          <div className="flex items-start justify-between gap-2">
            <div>
              <p className="text-xs font-semibold text-[#1A1A1A]/80">Active Break 2 Menit</p>
              <h3 className="text-2xl sm:text-3xl font-heading font-extrabold text-[#1A1A1A] mt-1 sensor-num">
                {verifiedBreakCount}
                <span className="text-xs font-medium text-[#1A1A1A]/80 ml-1">Sesi</span>
              </h3>
            </div>
            <div className="w-10 h-10 rounded-2xl bg-white flex items-center justify-center text-[#1A1A1A] shrink-0 shadow-xs">
              <Play className="w-4 h-4 fill-[#1A1A1A] ml-0.5" />
            </div>
          </div>
          <div className="mt-3 pt-2.5 border-t border-[#1A1A1A]/10 flex items-center justify-between">
            <span className="text-[11px] font-bold text-[#1A1A1A]/80">+{activeBreakBonus} Poin Pemulihan</span>
            <div className="flex items-center gap-1.5">
              <button
                onClick={() => setVerifiedBreakCount((prev) => prev + 1)}
                className="text-[10px] font-extrabold bg-white/80 hover:bg-white text-[#1A1A1A] px-2 py-0.5 rounded-full transition-colors"
                title="Catat manual 1 sesi jeda aktif (+10 Poin)"
              >
                +1 Jeda
              </button>
              <button
                onClick={onNavigateToFocus}
                className="text-[10px] font-extrabold bg-white text-[#1A1A1A] px-2.5 py-0.5 rounded-full shadow-xs hover:bg-[#F6F6F6] transition-colors"
              >
                Mulai &rarr;
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* ========================================================
          3. QUICK ACTIONS ACCENT BAR (Panic Relief & Active Break)
          ======================================================== */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Action 1: On-Demand Active Break */}
        <div className="bg-[#BDE6F0] rounded-3xl p-5 flex items-center justify-between gap-4 text-[#1A1A1A] shadow-softSky">
          <div className="space-y-1">
            <h4 className="font-heading font-extrabold text-base text-[#1A1A1A]">
              Mulai Active Break 2 Menit
            </h4>
            <p className="text-xs text-[#1A1A1A]/80 font-medium">
              Kamera hanya menyala 2 menit untuk validasi peregangan (+10 Poin).
            </p>
          </div>
          <button
            onClick={onNavigateToFocus}
            className="w-12 h-12 rounded-full bg-white text-[#1A1A1A] flex items-center justify-center shadow-md hover:bg-[#F6F6F6] transition-colors shrink-0"
            title="Buka Validator Active Break"
          >
            <Play className="w-5 h-5 fill-[#1A1A1A] ml-0.5" />
          </button>
        </div>

        {/* Action 2: Panic Relief Mode */}
        <div className="bg-[#FFF29A] rounded-3xl p-5 flex items-center justify-between gap-4 text-[#1A1A1A] border border-[#FFE966] shadow-softPill">
          <div className="space-y-1">
            <h4 className="font-heading font-extrabold text-base text-[#1A1A1A]">
              Panic Relief 15 Menit
            </h4>
            <p className="text-xs text-[#1A1A1A]/80 font-medium">
              Latihan napas terpandu &amp; jalan santai redakan cemas dan kembalikan fokus.
            </p>
          </div>
          <button
            onClick={onStartPanicRelief}
            className="w-12 h-12 rounded-full bg-white text-[#1A1A1A] flex items-center justify-center shadow-md hover:bg-[#F6F6F6] transition-colors shrink-0"
            title="Mulai Panic Relief Mode"
          >
            <Zap className="w-5 h-5 fill-[#1A1A1A]" />
          </button>
        </div>
      </div>

      {/* ========================================================
          4. MAIN TWO-COLUMN SECTION (KRS Today & 14-Day History Trend)
          ======================================================== */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Smart Academic Planner - Today's KRS (7 cols) */}
        <div className="lg:col-span-7 space-y-6">
          <div className="learnova-card p-5 sm:p-6 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-heading font-extrabold text-base text-[#1A1A1A] flex items-center gap-2">
                  <Clock className="w-4 h-4 text-[#1A1A1A]" />
                  Jadwal Kuliah Hari Ini ({DAY_NAMES[currentDayOfWeek - 1]})
                </h3>
                <p className="text-xs text-[#9A9A9A] mt-0.5">
                  Beban kognitif otomatis dihitung dari bobot SKS dan jenis matakuliah
                </p>
              </div>
              <button
                onClick={() => setIsKrsModalOpen(true)}
                className="text-xs font-bold text-[#1A1A1A] bg-[#F6F6F6] hover:bg-[#E8E8E8] px-3 py-1.5 rounded-full border border-[#E8E8E8] flex items-center gap-1.5 transition-colors"
              >
                <Plus className="w-3.5 h-3.5" />
                Tambah / Edit KRS
              </button>
            </div>

            {/* Schedule List */}
            <div className="space-y-3">
              {todaySchedules.length === 0 ? (
                <div className="p-6 rounded-2xl bg-[#FAFAFA] border border-[#E8E8E8] text-center space-y-2">
                  <Calendar className="w-8 h-8 text-[#9A9A9A] mx-auto" />
                  <p className="text-xs font-bold text-[#1A1A1A]">Tidak Ada Jadwal Kuliah Hari Ini</p>
                  <p className="text-[11px] text-[#9A9A9A]">
                    Bagus untuk pemulihan energi! Anda dapat fokus pada tugas mandiri atau istirahat aktif.
                  </p>
                </div>
              ) : (
                todaySchedules.map((item, idx) => (
                  <div
                    key={idx}
                    className="p-3.5 rounded-2xl bg-[#FAFAFA] border border-[#E8E8E8] flex items-center justify-between hover:bg-white hover:border-[#BDE6F0] transition-all"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-white border border-[#E8E8E8] flex flex-col items-center justify-center text-[#1A1A1A] shrink-0 font-mono">
                        <span className="text-xs font-extrabold">{item.creditHours}</span>
                        <span className="text-[9px] text-[#9A9A9A] uppercase">SKS</span>
                      </div>
                      <div>
                        <h4 className="text-xs font-bold text-[#1A1A1A]">{item.subjectName}</h4>
                        <div className="flex items-center gap-2 mt-0.5">
                          <span className={`text-[10px] font-extrabold px-2 py-0.2 rounded-full ${
                            item.isPracticum ? "bg-[#BDE6F0] text-[#1A1A1A]" : "bg-[#FFF29A] text-[#1A1A1A]"
                          }`}>
                            {item.isPracticum ? "Praktikum (1.5x)" : "Teori (1.0x)"}
                          </span>
                          {item.isExamWeek && (
                            <span className="text-[10px] font-extrabold bg-[#F7A8B0] text-[#9F1239] px-2 py-0.2 rounded-full">
                              Pekan Ujian (+3.0)
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    <span className="text-xs font-mono font-bold text-[#1A1A1A]">
                      {item.creditHours * (item.isPracticum ? 1.5 : 1.0) + (item.isExamWeek ? 3.0 : 0)} Poin
                    </span>
                  </div>
                ))
              )}
            </div>

            {/* KRS Load Summary Bar */}
            <div className="pt-3 border-t border-[#E8E8E8] flex items-center justify-between text-xs">
              <span className="text-[#9A9A9A]">
                Total Bobot SKS Hari Ini: <strong>{todaySchedules.reduce((acc, s) => acc + s.creditHours, 0)} SKS</strong>
              </span>
              <span className="font-bold text-[#1A1A1A] bg-[#CDE8B5] px-2.5 py-0.5 rounded-full">
                Beban Kognitif: {academicLoadScore} Poin
              </span>
            </div>
          </div>
        </div>

        {/* Right Column: 14-Day Performance Overview Chart (5 cols) */}
        <div className="lg:col-span-5 space-y-6">
          <div className="learnova-card p-5 sm:p-6 space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-heading font-extrabold text-sm text-[#1A1A1A]">
                  Tren Burnout &amp; Pemulihan 14 Hari
                </h3>
                <p className="text-[11px] text-[#9A9A9A]">
                  Perbandingan Burnout Index vs Skor Pemulihan
                </p>
              </div>
            </div>

            <div className="h-48 w-full pt-2">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={MOCK_14_DAY_TREND} margin={{ top: 5, right: 5, left: -25, bottom: 0 }}>
                  <defs>
                    <linearGradient id="burnoutGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#F7A8B0" stopOpacity={0.7} />
                      <stop offset="95%" stopColor="#F7A8B0" stopOpacity={0.05} />
                    </linearGradient>
                    <linearGradient id="recoveryGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#CDE8B5" stopOpacity={0.7} />
                      <stop offset="95%" stopColor="#CDE8B5" stopOpacity={0.05} />
                    </linearGradient>
                  </defs>
                  <XAxis
                    dataKey="logDate"
                    tick={{ fontSize: 10, fill: "#9A9A9A" }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis
                    tick={{ fontSize: 10, fill: "#9A9A9A" }}
                    axisLine={false}
                    tickLine={false}
                    domain={[0, 100]}
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
                    dataKey="burnoutIndex"
                    name="Burnout Index"
                    stroke="#F7A8B0"
                    strokeWidth={2}
                    fillOpacity={1}
                    fill="url(#burnoutGradient)"
                  />
                  <Area
                    type="monotone"
                    dataKey="recoveryScore"
                    name="Skor Pemulihan"
                    stroke="#8ECAD7"
                    strokeWidth={2}
                    fillOpacity={1}
                    fill="url(#recoveryGradient)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>

            <div className="flex items-center justify-center gap-5 text-xs font-semibold text-[#1A1A1A] pt-1">
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-[#F7A8B0]" />
                <span>Burnout Index</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-[#CDE8B5]" />
                <span>Skor Pemulihan</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ========================================================
          5. KRS SCHEDULE MODAL (Smart Academic Planner & PDF Parser)
          ======================================================== */}
      {isKrsModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-[#E8E8E8] space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-[#F0F0F0]">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-[#FFF29A] flex items-center justify-center text-[#1A1A1A]">
                  <BookOpen className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-heading font-extrabold text-base text-[#1A1A1A]">
                    Smart Academic Planner
                  </h3>
                  <p className="text-[11px] text-[#9A9A9A]">Input Jadwal Kuliah &amp; Ekstraksi KRS Otomatis</p>
                </div>
              </div>
              <button
                onClick={() => setIsKrsModalOpen(false)}
                className="w-8 h-8 rounded-full bg-[#F6F6F6] hover:bg-[#E8E8E8] text-[#1A1A1A] flex items-center justify-center transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Tabs: PDF Upload vs Manual Form */}
            <div className="flex gap-2 p-1 bg-[#F6F6F6] rounded-2xl border border-[#E8E8E8]">
              <button
                type="button"
                onClick={() => setKrsModalTab("upload")}
                className={`flex-1 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                  krsModalTab === "upload"
                    ? "bg-white text-[#1A1A1A] shadow-xs"
                    : "text-[#9A9A9A] hover:text-[#1A1A1A]"
                }`}
              >
                <UploadCloud className="w-3.5 h-3.5" />
                <span>Upload PDF KRS (Auto)</span>
              </button>
              <button
                type="button"
                onClick={() => setKrsModalTab("manual")}
                className={`flex-1 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                  krsModalTab === "manual"
                    ? "bg-white text-[#1A1A1A] shadow-xs"
                    : "text-[#9A9A9A] hover:text-[#1A1A1A]"
                }`}
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Input Manual</span>
              </button>
            </div>

            {/* Tab 1: PDF Upload Dropzone (Section 3.1 PDF KRS Parser) */}
            {krsModalTab === "upload" ? (
              <div className="space-y-4">
                <div className="p-6 border-2 border-dashed border-[#BDE6F0] rounded-2xl bg-[#F0F9FB] text-center space-y-2.5">
                  <div className="w-12 h-12 rounded-2xl bg-white text-[#1A1A1A] flex items-center justify-center mx-auto shadow-xs">
                    <FileText className="w-6 h-6 text-[#1A1A1A]" />
                  </div>
                  <div>
                    <p className="text-xs font-extrabold text-[#1A1A1A]">
                      Tarik &amp; Lepas Berkas PDF / Screenshot KRS
                    </p>
                    <p className="text-[11px] text-[#9A9A9A] mt-0.5">
                      Mendukung format PDF, PNG, atau JPG (maksimal 10 MB).
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={handleSimulatePdfParse}
                    disabled={isExtractingPdf}
                    className="px-4 py-2 rounded-xl bg-[#1A1A1A] hover:bg-black text-white text-xs font-bold transition-all shadow-xs disabled:opacity-50 inline-flex items-center gap-1.5"
                  >
                    <UploadCloud className="w-3.5 h-3.5" />
                    <span>{isExtractingPdf ? "Mengekstrak Jadwal & SKS..." : "Pilih File & Ekstrak Otomatis"}</span>
                  </button>
                </div>

                <div className="p-3 rounded-xl bg-[#FAFAFA] border border-[#EEEEEE] text-[11px] text-[#9A9A9A] flex items-center justify-between">
                  <span>Demo Template KRS:</span>
                  <button
                    type="button"
                    onClick={handleSimulatePdfParse}
                    className="font-bold text-[#1A1A1A] hover:underline"
                  >
                    KRS_Semester_Ganjil_Tiara.pdf &rarr;
                  </button>
                </div>
              </div>
            ) : (
              /* Tab 2: Manual Form */
              <form onSubmit={handleAddCourse} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-[#1A1A1A] mb-1">
                    Nama Matakuliah
                  </label>
                  <input
                    type="text"
                    required
                    value={newSubjectName}
                    onChange={(e) => setNewSubjectName(e.target.value)}
                    placeholder="Contoh: Pemrograman Mobile Lanjut"
                    className="w-full px-3.5 py-2 text-xs bg-[#FAFAFA] border border-[#E8E8E8] rounded-xl text-[#1A1A1A] focus:outline-none focus:border-[#BDE6F0] focus:bg-white transition-all"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-[#1A1A1A] mb-1">
                      Hari Perkuliahan
                    </label>
                    <select
                      value={newDayOfWeek}
                      onChange={(e) => setNewDayOfWeek(Number(e.target.value))}
                      className="w-full px-3.5 py-2 text-xs bg-[#FAFAFA] border border-[#E8E8E8] rounded-xl text-[#1A1A1A] focus:outline-none focus:border-[#BDE6F0] focus:bg-white transition-all"
                    >
                      {DAY_NAMES.map((name, idx) => (
                        <option key={idx + 1} value={idx + 1}>
                          {name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-[#1A1A1A] mb-1">
                      Bobot SKS
                    </label>
                    <input
                      type="number"
                      min={1}
                      max={6}
                      value={newCreditHours}
                      onChange={(e) => setNewCreditHours(Number(e.target.value))}
                      className="w-full px-3.5 py-2 text-xs bg-[#FAFAFA] border border-[#E8E8E8] rounded-xl text-[#1A1A1A] focus:outline-none focus:border-[#BDE6F0] focus:bg-white transition-all"
                    />
                  </div>
                </div>

                {/* Toggles */}
                <div className="grid grid-cols-2 gap-3 pt-1">
                  <label className="flex items-center gap-2 p-2.5 rounded-xl bg-[#FAFAFA] border border-[#EEEEEE] cursor-pointer text-xs font-semibold text-[#1A1A1A]">
                    <input
                      type="checkbox"
                      checked={newIsPracticum}
                      onChange={(e) => setNewIsPracticum(e.target.checked)}
                      className="rounded text-[#1A1A1A] focus:ring-0"
                    />
                    <span>Praktikum (Bobot 1.5x)</span>
                  </label>

                  <label className="flex items-center gap-2 p-2.5 rounded-xl bg-[#FAFAFA] border border-[#EEEEEE] cursor-pointer text-xs font-semibold text-[#1A1A1A]">
                    <input
                      type="checkbox"
                      checked={newIsExamWeek}
                      onChange={(e) => setNewIsExamWeek(e.target.checked)}
                      className="rounded text-[#1A1A1A] focus:ring-0"
                    />
                    <span>Pekan Ujian (H-7)</span>
                  </label>
                </div>

                <div className="pt-2 flex items-center justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setIsKrsModalOpen(false)}
                    className="px-4 py-2 rounded-xl text-xs font-bold text-[#9A9A9A] hover:text-[#1A1A1A] transition-colors"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 rounded-xl text-xs font-bold bg-[#1A1A1A] text-white hover:bg-black transition-colors shadow-xs"
                  >
                    Simpan Matakuliah
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
