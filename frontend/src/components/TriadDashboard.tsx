import React, { useState, useEffect, useMemo } from "react";
import {
  Moon,
  BookOpen,
  Play,
  Monitor,
  Plus,
  X,
  Calendar,
  UploadCloud,
  FileText,
  Trash2,
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
  { id: "sch-1", dayOfWeek: 1, subjectName: "Algoritma & Struktur Data", creditHours: 3, isPracticum: true, isExamWeek: false },
  { id: "sch-2", dayOfWeek: 2, subjectName: "Kecerdasan Buatan", creditHours: 3, isPracticum: false, isExamWeek: false },
  { id: "sch-3", dayOfWeek: 3, subjectName: "Basis Data Terdistribusi", creditHours: 3, isPracticum: true, isExamWeek: false },
  { id: "sch-4", dayOfWeek: 4, subjectName: "Pemrograman Web Lanjut", creditHours: 2, isPracticum: true, isExamWeek: false },
  { id: "sch-5", dayOfWeek: 5, subjectName: "Etika Profesi & Komunikasi", creditHours: 2, isPracticum: false, isExamWeek: false },
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
  onStartPanicRelief: _onStartPanicRelief,
  onNavigateToFocus: _onNavigateToFocus,
}) => {
  // 1. Data States
  const [schedules, setSchedules] = useState<AcademicScheduleDTO[]>(INITIAL_SCHEDULES);
  const [sleepHours] = useState<number>(7.2);
  const [screenTimeHours, setScreenTimeHours] = useState<number>(() => {
    const tracked = screenTimeTracker.getTodayScreenTimeHours();
    return tracked > 0 ? tracked : 5.4;
  });
  const [verifiedBreakCount] = useState<number>(1);
  const [isKrsModalOpen, setIsKrsModalOpen] = useState<boolean>(false);
  const [krsModalTab, setKrsModalTab] = useState<"upload" | "manual" | "manage">("upload");
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
    burnoutIndex,
    status: burnoutStatus,
  } = burnoutResult;



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
      id: `sch-${Date.now()}`,
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

  // Handle Delete Course from KRS
  const handleDeleteSchedule = async (scheduleToDelete: AcademicScheduleDTO) => {
    setSchedules((prev) =>
      prev.filter((s) => {
        if (scheduleToDelete.id && s.id) {
          return s.id !== scheduleToDelete.id;
        }
        return !(
          s.dayOfWeek === scheduleToDelete.dayOfWeek &&
          s.subjectName === scheduleToDelete.subjectName
        );
      })
    );

    try {
      await api.deleteAcademicSchedule(scheduleToDelete.id);
    } catch (err) {
      console.warn("Gagal menghapus jadwal dari API:", err);
    }
  };

  // Handle Smart PDF KRS Parser simulation (PRD v4.0 Section 3.1)
  const handleSimulatePdfParse = () => {
    setIsExtractingPdf(true);
    setTimeout(() => {
      const extractedCourses: AcademicScheduleDTO[] = [
        { id: "ext-1", dayOfWeek: 1, subjectName: "Algoritma & Struktur Data", creditHours: 3, isPracticum: true, isExamWeek: false },
        { id: "ext-2", dayOfWeek: 2, subjectName: "Kecerdasan Buatan", creditHours: 3, isPracticum: false, isExamWeek: false },
        { id: "ext-3", dayOfWeek: 3, subjectName: "Basis Data Terdistribusi", creditHours: 3, isPracticum: true, isExamWeek: false },
        { id: "ext-4", dayOfWeek: 4, subjectName: "Pemrograman Web Lanjut", creditHours: 3, isPracticum: true, isExamWeek: false },
        { id: "ext-5", dayOfWeek: 5, subjectName: "Jaringan Komputer Lanjut", creditHours: 3, isPracticum: true, isExamWeek: false },
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
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-5 sm:gap-7">
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
            <p className="text-xs text-[#1A1A1A]/80 font-medium max-w-xl leading-relaxed">
              {statusMeta.desc}
            </p>
          </div>
        </div>
      </div>

      {/* ========================================================
          2. ROW OF 4 CORE PARAMETER CARDS (Clean Output Display)
          ======================================================== */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Academic Load (KRS) */}
        <div className="learnova-card p-4 sm:p-5 flex flex-col justify-center h-full">
          <div className="flex items-center gap-2.5 mb-2 sm:mb-2.5">
            <div className="w-9 h-9 rounded-2xl bg-[#F7A8B0] flex items-center justify-center text-[#1A1A1A] shrink-0 shadow-xs">
              <BookOpen className="w-4 h-4 text-[#1A1A1A]" />
            </div>
            <p className="text-xs sm:text-sm font-bold text-[#1A1A1A]">Beban Kuliah</p>
          </div>
          <h3 className="text-2xl sm:text-3xl font-heading font-extrabold text-[#1A1A1A] sensor-num">
            {academicLoadScore}
            <span className="text-xs font-medium text-[#9A9A9A] ml-1.5">Poin</span>
          </h3>
        </div>

        {/* Card 2: Screen Time (Passive Page Visibility API) */}
        <div className="learnova-card p-4 sm:p-5 flex flex-col justify-center h-full">
          <div className="flex items-center gap-2.5 mb-2 sm:mb-2.5">
            <div className="w-9 h-9 rounded-2xl bg-[#FFF29A] flex items-center justify-center text-[#1A1A1A] shrink-0 shadow-xs">
              <Monitor className="w-4 h-4 text-[#1A1A1A]" />
            </div>
            <p className="text-xs sm:text-sm font-bold text-[#1A1A1A]">Waktu Layar</p>
          </div>
          <h3 className="text-2xl sm:text-3xl font-heading font-extrabold text-[#1A1A1A] sensor-num">
            {screenTimeHours}
            <span className="text-xs font-medium text-[#9A9A9A] ml-1.5">Jam</span>
          </h3>
        </div>

        {/* Card 3: Sleep Duration & Recovery */}
        <div className="learnova-card p-4 sm:p-5 flex flex-col justify-center h-full">
          <div className="flex items-center gap-2.5 mb-2 sm:mb-2.5">
            <div className="w-9 h-9 rounded-2xl bg-[#BDE6F0] flex items-center justify-center text-[#1A1A1A] shrink-0 shadow-xs">
              <Moon className="w-4 h-4 text-[#1A1A1A]" />
            </div>
            <p className="text-xs sm:text-sm font-bold text-[#1A1A1A]">Tidur Semalam</p>
          </div>
          <h3 className="text-2xl sm:text-3xl font-heading font-extrabold text-[#1A1A1A] sensor-num">
            {sleepHours}
            <span className="text-xs font-medium text-[#9A9A9A] ml-1.5">Jam</span>
          </h3>
        </div>

        {/* Card 4: Verified Active Break (On-Demand MediaPipe 2 Mins) */}
        <div className="learnova-card p-4 sm:p-5 flex flex-col justify-center h-full">
          <div className="flex items-center gap-2.5 mb-2 sm:mb-2.5">
            <div className="w-9 h-9 rounded-2xl bg-[#CDE8B5] flex items-center justify-center text-[#1A1A1A] shrink-0 shadow-xs">
              <Play className="w-4 h-4 fill-[#1A1A1A] text-[#1A1A1A] ml-0.5" />
            </div>
            <p className="text-xs sm:text-sm font-bold text-[#1A1A1A]">Active Break</p>
          </div>
          <h3 className="text-2xl sm:text-3xl font-heading font-extrabold text-[#1A1A1A] sensor-num">
            {verifiedBreakCount}
            <span className="text-xs font-medium text-[#9A9A9A] ml-1.5">Sesi</span>
          </h3>
        </div>
      </div>

      {/* ========================================================
          3. MAIN TWO-COLUMN SECTION (KRS Today & 14-Day History Trend)
          ======================================================== */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
        {/* Left Column: Smart Academic Planner - Today's KRS (7 cols) */}
        <div className="lg:col-span-7 flex flex-col">
          <div className="learnova-card p-5 sm:p-6 flex flex-col justify-between h-full">
            <div>
              <div className="flex items-center justify-between pb-3">
                <div>
                  <h3 className="font-heading font-extrabold text-base text-[#1A1A1A]">
                    Jadwal Kuliah Hari Ini
                  </h3>
                </div>
                <button
                  onClick={() => setIsKrsModalOpen(true)}
                  className="text-xs font-bold text-[#1A1A1A] bg-[#F6F6F6] hover:bg-[#E8E8E8] px-3 py-1.5 rounded-full border border-[#E8E8E8] flex items-center gap-1.5 transition-colors shrink-0"
                >
                  <Plus className="w-3.5 h-3.5" />
                  Tambah / Edit KRS
                </button>
              </div>

              {/* Schedule List */}
              <div className="space-y-3 pt-1">
                {todaySchedules.length === 0 ? (
                  <div className="flex-1 flex flex-col items-center justify-center p-6 rounded-2xl bg-[#FAFAFA] border border-[#E8E8E8] text-center space-y-2 min-h-[160px]">
                    <Calendar className="w-8 h-8 text-[#9A9A9A] mx-auto" />
                    <p className="text-xs font-bold text-[#1A1A1A]">Tidak Ada Jadwal Kuliah Hari Ini</p>
                    <p className="text-[11px] text-[#9A9A9A] max-w-xs">
                      Bagus untuk pemulihan energi! Anda dapat fokus pada tugas mandiri atau istirahat aktif.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-3 max-h-[260px] overflow-y-auto pr-0.5">
                    {todaySchedules.map((item, idx) => (
                      <div
                        key={item.id || `${item.subjectName}-${item.dayOfWeek}-${idx}`}
                        className="p-3.5 rounded-2xl bg-[#FAFAFA] border border-[#E8E8E8] flex items-center justify-between hover:bg-white hover:border-[#BDE6F0] transition-colors group"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-xl bg-white border border-[#E8E8E8] flex flex-col items-center justify-center text-[#1A1A1A] shrink-0 font-mono">
                            <span className="text-xs font-extrabold">{item.creditHours}</span>
                            <span className="text-[9px] text-[#9A9A9A] uppercase">SKS</span>
                          </div>
                          <h4 className="text-xs font-bold text-[#1A1A1A]">{item.subjectName}</h4>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleDeleteSchedule(item)}
                          className="w-7 h-7 rounded-xl bg-white hover:bg-[#FEE2E2] text-[#9A9A9A] hover:text-[#DC2626] border border-[#E8E8E8] hover:border-[#FCA5A5] flex items-center justify-center transition-colors shadow-2xs group/del"
                          title={`Hapus jadwal ${item.subjectName}`}
                          aria-label={`Hapus jadwal ${item.subjectName}`}
                        >
                          <Trash2 className="w-3.5 h-3.5 text-[#9A9A9A] group-hover/del:text-[#DC2626] transition-colors" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* KRS Load Summary Bar */}
            <div className="pt-3 border-t border-[#E8E8E8] flex items-center justify-between text-xs mt-4">
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
        <div className="lg:col-span-5 flex flex-col">
          <div className="learnova-card p-5 sm:p-6 flex flex-col justify-between h-full">
            <div>
              <div className="pb-3">
                <h3 className="font-heading font-extrabold text-base text-[#1A1A1A]">
                  Tren Burnout &amp; Pemulihan 14 Hari
                </h3>
                <p className="text-[11px] text-[#9A9A9A]">
                  Perbandingan Burnout Index vs Skor Pemulihan
                </p>
              </div>

              <div className="h-52 w-full pt-2">
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
            </div>

            <div className="pt-3 border-t border-[#E8E8E8] flex items-center justify-center gap-5 text-xs font-semibold text-[#1A1A1A] mt-4">
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

            {/* Modal Tabs: PDF Upload vs Manual Form vs Daftar Matakuliah */}
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
                <span className="hidden sm:inline">Upload PDF</span>
                <span className="sm:hidden">PDF</span>
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
                <span className="hidden sm:inline">Input Manual</span>
                <span className="sm:hidden">Manual</span>
              </button>
              <button
                type="button"
                onClick={() => setKrsModalTab("manage")}
                className={`flex-1 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                  krsModalTab === "manage"
                    ? "bg-white text-[#1A1A1A] shadow-xs"
                    : "text-[#9A9A9A] hover:text-[#1A1A1A]"
                }`}
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Daftar ({schedules.length})</span>
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
            ) : krsModalTab === "manual" ? (
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
            ) : (
              /* Tab 3: Daftar & Hapus Matakuliah */
              <div className="space-y-3">
                <div className="flex items-center justify-between text-xs text-[#737373]">
                  <span>Total Matakuliah: <strong>{schedules.length}</strong></span>
                  <span>Total Beban: <strong>{schedules.reduce((acc, s) => acc + s.creditHours, 0)} SKS</strong></span>
                </div>

                {schedules.length === 0 ? (
                  <div className="p-6 rounded-2xl bg-[#FAFAFA] border border-[#E8E8E8] text-center space-y-2">
                    <Calendar className="w-8 h-8 text-[#9A9A9A] mx-auto" />
                    <p className="text-xs font-bold text-[#1A1A1A]">Belum Ada Matakuliah</p>
                    <p className="text-[11px] text-[#9A9A9A]">
                      Tambahkan matakuliah baru melalui tab Input Manual atau Upload PDF.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-2 max-h-[300px] overflow-y-auto pr-1 divide-y divide-[#F0F0F0]">
                    {schedules.map((item, idx) => (
                      <div
                        key={item.id || `${item.subjectName}-${item.dayOfWeek}-${idx}`}
                        className="pt-2 pb-1 flex items-center justify-between gap-3 text-xs"
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <span className="w-14 text-center px-2 py-1 rounded-lg bg-[#F6F6F6] text-[10px] font-extrabold text-[#1A1A1A] shrink-0">
                            {DAY_NAMES[item.dayOfWeek - 1] || `Hari ${item.dayOfWeek}`}
                          </span>
                          <div className="min-w-0">
                            <p className="font-bold text-[#1A1A1A] truncate">{item.subjectName}</p>
                            <p className="text-[10px] text-[#9A9A9A]">
                              {item.creditHours} SKS · {item.isPracticum ? "Praktikum (1.5x)" : "Teori (1.0x)"}
                              {item.isExamWeek ? " · Ujian (+3.0)" : ""}
                            </p>
                          </div>
                        </div>

                        <button
                          type="button"
                          onClick={() => handleDeleteSchedule(item)}
                          className="w-7 h-7 rounded-xl bg-white hover:bg-[#FEE2E2] text-[#9A9A9A] hover:text-[#DC2626] border border-[#E8E8E8] hover:border-[#FCA5A5] flex items-center justify-center transition-colors shadow-2xs shrink-0 group/del"
                          title={`Hapus ${item.subjectName}`}
                          aria-label={`Hapus ${item.subjectName}`}
                        >
                          <Trash2 className="w-3.5 h-3.5 text-[#9A9A9A] group-hover/del:text-[#DC2626] transition-colors" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
