import React, { useState, useEffect, useMemo } from "react";
import {
  Moon,
  BookOpen,
  Play,
  Monitor,
  Plus,
  X,
  Calendar,
  Clock,
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

  // Dynamic Celestial Theme: Day (Sun + Clouds) vs Night (Moon + Clouds)
  const [timeOfDayOverride, setTimeOfDayOverride] = useState<"day" | "night" | null>(null);

  // Auto-detect based on user's real local time (06:00 - 18:00 = Day, otherwise Night)
  const isDayTime = useMemo(() => {
    if (timeOfDayOverride !== null) return timeOfDayOverride === "day";
    const hour = new Date().getHours();
    return hour >= 6 && hour < 18;
  }, [timeOfDayOverride]);

  const handleToggleTimeOfDay = () => {
    setTimeOfDayOverride((prev) => {
      if (prev === null) {
        const hour = new Date().getHours();
        const currentIsDay = hour >= 6 && hour < 18;
        return currentIsDay ? "night" : "day";
      }
      return prev === "day" ? "night" : "day";
    });
  };

  // Live Clock & Date for Hero Banner
  const [currentDateTime, setCurrentDateTime] = useState<Date>(new Date());

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentDateTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const timeFormatted = useMemo(() => {
    const hours = String(currentDateTime.getHours()).padStart(2, "0");
    const minutes = String(currentDateTime.getMinutes()).padStart(2, "0");
    const seconds = String(currentDateTime.getSeconds()).padStart(2, "0");
    return { hours, minutes, seconds };
  }, [currentDateTime]);

  const dateFormatted = useMemo(() => {
    const dayNames = ["Minggu", "Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu"];
    const monthNames = [
      "Jan", "Feb", "Mar", "Apr", "Mei", "Jun",
      "Jul", "Agu", "Sep", "Okt", "Nov", "Des"
    ];
    const dayName = dayNames[currentDateTime.getDay()];
    const dateNum = currentDateTime.getDate();
    const monthName = monthNames[currentDateTime.getMonth()];
    const yearNum = currentDateTime.getFullYear();
    return { dayName, dateNum, monthName, yearNum };
  }, [currentDateTime]);

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
      <div className={`relative overflow-hidden rounded-3xl p-6 sm:p-8 border shadow-xs transition-all ${statusMeta.cardBg}`}>
        {/* Dynamic Celestial Sky Illustration: Strolling Sun/Moon Above 2 Layered Clouds */}
        <div
          className="absolute right-2 sm:right-6 bottom-0 sm:bottom-1 w-56 sm:w-64 md:w-72 h-32 sm:h-36 select-none pointer-events-auto z-0 group cursor-pointer flex items-end justify-center"
          onClick={handleToggleTimeOfDay}
          title={isDayTime ? "Suasana Pagi/Siang ☀️ • Klik untuk beralih ke Malam" : "Suasana Malam 🌙 • Klik untuk beralih ke Siang"}
        >
          {/* Scoped Keyframes for Fluid Celestial Motion */}
          <style>{`
            @keyframes celestialOrbitalStroll {
              0% {
                transform: translate(0px, 0px);
              }
              25% {
                transform: translate(18px, -4px);
              }
              50% {
                transform: translate(34px, 1px);
              }
              75% {
                transform: translate(16px, 5px);
              }
              100% {
                transform: translate(0px, 0px);
              }
            }
            @keyframes driftCloud1 {
              0% {
                transform: translate(0px, 0px) scale(1);
              }
              50% {
                transform: translate(9px, -3px) scale(1.015);
              }
              100% {
                transform: translate(0px, 0px) scale(1);
              }
            }
            @keyframes driftCloud2 {
              0% {
                transform: translate(0px, 0px) scale(1);
              }
              50% {
                transform: translate(-10px, 3px) scale(1.02);
              }
              100% {
                transform: translate(0px, 0px) scale(1);
              }
            }
            @keyframes sunSpinSlow {
              from { transform: rotate(0deg); }
              to { transform: rotate(360deg); }
            }
            @keyframes celestialPulse {
              0%, 100% { opacity: 0.40; transform: scale(0.96); }
              50% { opacity: 0.75; transform: scale(1.05); }
            }
            @keyframes starTwinkleAnim {
              0%, 100% { opacity: 0.25; transform: scale(0.75); }
              50% { opacity: 0.95; transform: scale(1.2); }
            }
            @media (prefers-reduced-motion: reduce) {
              .celestial-anim { animation: none !important; }
            }
          `}</style>

          <svg
            className="w-full h-full"
            viewBox="0 0 280 170"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            preserveAspectRatio="xMidYMid meet"
          >
            <defs>
              {/* HD Ambient Filters for Depth & Soft Shadows */}
              <filter id="hdCloudShadow" x="-20%" y="-20%" width="140%" height="150%">
                <feDropShadow dx="0" dy="5" stdDeviation="4" floodColor="#1A1A1A" floodOpacity="0.08" />
              </filter>
              <filter id="hdSunGlow" x="-30%" y="-30%" width="160%" height="160%">
                <feDropShadow dx="0" dy="0" stdDeviation="8" floodColor="#FFC837" floodOpacity="0.5" />
              </filter>
              <filter id="hdMoonGlow" x="-30%" y="-30%" width="160%" height="160%">
                <feDropShadow dx="0" dy="0" stdDeviation="8" floodColor="#FFF29A" floodOpacity="0.5" />
              </filter>

              {/* Day Palette Gradients (HD Rich Warmth & Specular Depth) */}
              <linearGradient id="hdSunCoreGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#FFFDE7" />
                <stop offset="35%" stopColor="#FFF29A" />
                <stop offset="100%" stopColor="#FFC837" />
              </linearGradient>
              <radialGradient id="hdSunAuraGrad" cx="50%" cy="50%" r="50%">
                <stop offset="0%" stopColor="#FFF29A" stopOpacity="0.80" />
                <stop offset="55%" stopColor="#FFE082" stopOpacity="0.30" />
                <stop offset="100%" stopColor="#FFF9C4" stopOpacity="0.00" />
              </radialGradient>
              <linearGradient id="hdDayCloudFront" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="#FFFFFF" />
                <stop offset="65%" stopColor="#F5FBFC" />
                <stop offset="100%" stopColor="#D8EEF7" />
              </linearGradient>
              <linearGradient id="hdDayCloudBack" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.95" />
                <stop offset="100%" stopColor="#CDE8B5" stopOpacity="0.60" />
              </linearGradient>

              {/* Night Palette Gradients (HD Luminous Pearl & Lunar Glow) */}
              <linearGradient id="hdMoonCoreGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#FFFFEE" />
                <stop offset="45%" stopColor="#FFF29A" />
                <stop offset="100%" stopColor="#F9D76E" />
              </linearGradient>
              <radialGradient id="hdMoonAuraGrad" cx="50%" cy="50%" r="50%">
                <stop offset="0%" stopColor="#FFF29A" stopOpacity="0.70" />
                <stop offset="50%" stopColor="#BDE6F0" stopOpacity="0.30" />
                <stop offset="100%" stopColor="#BDE6F0" stopOpacity="0.00" />
              </radialGradient>
              <linearGradient id="hdNightCloudFront" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="#FFFFFF" />
                <stop offset="65%" stopColor="#E9F2FA" />
                <stop offset="100%" stopColor="#C9DCEB" />
              </linearGradient>
              <linearGradient id="hdNightCloudBack" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="#F1F5F9" stopOpacity="0.95" />
                <stop offset="100%" stopColor="#B2CBDD" stopOpacity="0.65" />
              </linearGradient>
            </defs>

            {isDayTime ? (
              /* ========================================================
                 DAYTIME MODE: MATAHARI JALAN-JALAN KELILING & 2 AWAN DI BAWAH
                 ======================================================== */
              <g className="transition-opacity duration-700">
                {/* 1. MATAHARI BERJALAN KELILING SANTAI (Di Langit Atas) */}
                <g style={{ animation: "celestialOrbitalStroll 15s ease-in-out infinite" }}>
                  {/* Pusat Posisi Awal Matahari di (122, 52) */}
                  {/* Aura Cahaya Hangat */}
                  <circle
                    cx="122"
                    cy="52"
                    r="46"
                    fill="url(#hdSunAuraGrad)"
                    style={{ animation: "celestialPulse 4s ease-in-out infinite", transformOrigin: "122px 52px" }}
                  />

                  {/* 12 Sinar Matahari Berputar Anggun */}
                  <g style={{ transformOrigin: "122px 52px", animation: "sunSpinSlow 45s linear infinite" }}>
                    {[0, 30, 60, 90, 120, 150, 180, 210, 240, 270, 300, 330].map((angle) => (
                      <rect
                        key={angle}
                        x={122 - 3}
                        y={52 - 40}
                        width={6}
                        height={11}
                        rx={3}
                        fill="#FFD54F"
                        opacity={0.8}
                        transform={`rotate(${angle} 122 52)`}
                      />
                    ))}
                  </g>

                  {/* Bola Inti Matahari HD dengan Soft Drop Glow */}
                  <circle
                    cx="122"
                    cy="52"
                    r="26"
                    fill="url(#hdSunCoreGrad)"
                    filter="url(#hdSunGlow)"
                    className="transition-transform duration-500 group-hover:scale-105"
                    style={{ transformOrigin: "122px 52px" }}
                  />

                  {/* Cincin Kilau Interior */}
                  <circle cx="122" cy="52" r="24" stroke="#FFFFFF" strokeWidth="1.2" strokeOpacity="0.5" fill="none" />

                  {/* Specular Highlight Kilau 3D */}
                  <ellipse cx="114" cy="44" rx="7" ry="4" fill="#FFFFFF" opacity={0.7} transform="rotate(-35 114 44)" />
                  <circle cx="123" cy="41" r="2.2" fill="#FFFFFF" opacity={0.55} />
                </g>

                {/* 2. AWAN 1 (Awan Utama di Kiri Bawah) */}
                <g
                  filter="url(#hdCloudShadow)"
                  style={{ animation: "driftCloud1 10s ease-in-out infinite", transformOrigin: "108px 118px" }}
                >
                  {/* Lapisan Belakang Kedalaman */}
                  <ellipse cx="108" cy="118" rx="46" ry="22" fill="url(#hdDayCloudBack)" />
                  <circle cx="78" cy="120" r="18" fill="url(#hdDayCloudBack)" />
                  <circle cx="138" cy="120" r="18" fill="url(#hdDayCloudBack)" />

                  {/* Lapisan Depan Lembut & Fluffy */}
                  <ellipse cx="108" cy="116" rx="48" ry="22" fill="url(#hdDayCloudFront)" />
                  <circle cx="74" cy="118" r="20" fill="url(#hdDayCloudFront)" />
                  <circle cx="52" cy="124" r="15" fill="url(#hdDayCloudFront)" />
                  <circle cx="140" cy="118" r="20" fill="url(#hdDayCloudFront)" />
                  <circle cx="108" cy="98" r="24" fill="url(#hdDayCloudFront)" />
                  <rect x="46" y="114" width="124" height="26" rx="13" fill="url(#hdDayCloudFront)" />

                  {/* Kilau Puncak Awan 1 */}
                  <ellipse cx="108" cy="92" rx="15" ry="6" fill="#FFFFFF" opacity={0.6} />
                  <ellipse cx="74" cy="110" rx="11" ry="5" fill="#FFFFFF" opacity={0.35} />
                </g>

                {/* 3. AWAN 2 (Awan Pendamping di Kanan Bawah) */}
                <g
                  filter="url(#hdCloudShadow)"
                  style={{ animation: "driftCloud2 12s ease-in-out infinite", transformOrigin: "176px 126px" }}
                >
                  {/* Lapisan Belakang Kedalaman */}
                  <ellipse cx="176" cy="124" rx="42" ry="20" fill="url(#hdDayCloudBack)" />
                  <circle cx="150" cy="126" r="16" fill="url(#hdDayCloudBack)" />
                  <circle cx="202" cy="126" r="16" fill="url(#hdDayCloudBack)" />

                  {/* Lapisan Depan Lembut & Fluffy */}
                  <ellipse cx="176" cy="122" rx="44" ry="20" fill="url(#hdDayCloudFront)" />
                  <circle cx="148" cy="124" r="18" fill="url(#hdDayCloudFront)" />
                  <circle cx="204" cy="124" r="18" fill="url(#hdDayCloudFront)" />
                  <circle cx="224" cy="130" r="13" fill="url(#hdDayCloudFront)" />
                  <circle cx="176" cy="106" r="22" fill="url(#hdDayCloudFront)" />
                  <rect x="138" y="120" width="100" height="24" rx="12" fill="url(#hdDayCloudFront)" />

                  {/* Kilau Puncak Awan 2 */}
                  <ellipse cx="176" cy="100" rx="13" ry="5" fill="#FFFFFF" opacity={0.55} />
                  <ellipse cx="204" cy="116" rx="10" ry="4.5" fill="#FFFFFF" opacity={0.35} />
                </g>
              </g>
            ) : (
              /* ========================================================
                 NIGHTTIME MODE: REMBULAN JALAN-JALAN KELILING & 2 AWAN DI BAWAH
                 ======================================================== */
              <g className="transition-opacity duration-700">
                {/* 1. BINTANG-BINTANG BERKELIP HD DI LANGIT ATAS */}
                {[
                  { x: 34, y: 32, scale: 1.0, delay: "0s" },
                  { x: 68, y: 22, scale: 0.8, delay: "1.2s" },
                  { x: 198, y: 26, scale: 1.1, delay: "0.6s" },
                  { x: 236, y: 44, scale: 0.85, delay: "1.8s" },
                  { x: 40, y: 64, scale: 0.7, delay: "2.4s" },
                  { x: 242, y: 72, scale: 0.75, delay: "1.5s" },
                  { x: 138, y: 18, scale: 0.9, delay: "0.9s" },
                ].map((star, idx) => (
                  <path
                    key={idx}
                    d="M 0,-7 Q 0,0 7,0 Q 0,0 0,7 Q 0,0 -7,0 Q 0,0 0,-7 Z"
                    fill="#FFF7B2"
                    transform={`translate(${star.x}, ${star.y}) scale(${star.scale})`}
                    style={{
                      animation: "starTwinkleAnim 3s ease-in-out infinite",
                      animationDelay: star.delay,
                      transformOrigin: `${star.x}px ${star.y}px`,
                    }}
                  />
                ))}

                {/* 2. REMBULAN SABIT BERJALAN KELILING SANTAI (Di Langit Atas) */}
                <g style={{ animation: "celestialOrbitalStroll 15s ease-in-out infinite" }}>
                  {/* Pusat Posisi Awal Rembulan di (122, 50) */}
                  {/* Aura Cahaya Rembulan */}
                  <circle
                    cx="122"
                    cy="50"
                    r="44"
                    fill="url(#hdMoonAuraGrad)"
                    style={{ animation: "celestialPulse 5s ease-in-out infinite", transformOrigin: "122px 50px" }}
                  />

                  {/* Bulan Sabit Indah HD dengan Drop Glow */}
                  <path
                    d="M 122,26 C 140,26 154,38 154,50 C 154,62 140,74 122,74 C 112,74 106,70 100,64 C 114,64 126,56 126,50 C 126,42 116,34 102,34 C 109,29 115,26 122,26 Z"
                    fill="url(#hdMoonCoreGrad)"
                    filter="url(#hdMoonGlow)"
                    className="transition-transform duration-500 group-hover:scale-105"
                    style={{ transformOrigin: "122px 50px" }}
                  />

                  {/* Kawah Halus & Refleksi Lunar HD */}
                  <circle cx="139" cy="46" r="3.8" fill="#FFE082" opacity={0.4} />
                  <circle cx="134" cy="60" r="2.8" fill="#FFE082" opacity={0.35} />
                  <path
                    d="M 123,28 C 134,28 144,36 147,46 C 145,39 136,31 123,28 Z"
                    fill="#FFFFFF"
                    opacity={0.65}
                  />
                </g>

                {/* 3. AWAN MALAM 1 (Awan Utama di Kiri Bawah) */}
                <g
                  filter="url(#hdCloudShadow)"
                  style={{ animation: "driftCloud1 10s ease-in-out infinite", transformOrigin: "108px 118px" }}
                >
                  {/* Lapisan Belakang Kedalaman */}
                  <ellipse cx="108" cy="118" rx="46" ry="22" fill="url(#hdNightCloudBack)" />
                  <circle cx="78" cy="120" r="18" fill="url(#hdNightCloudBack)" />
                  <circle cx="138" cy="120" r="18" fill="url(#hdNightCloudBack)" />

                  {/* Lapisan Depan Lembut & Fluffy */}
                  <ellipse cx="108" cy="116" rx="48" ry="22" fill="url(#hdNightCloudFront)" />
                  <circle cx="74" cy="118" r="20" fill="url(#hdNightCloudFront)" />
                  <circle cx="52" cy="124" r="15" fill="url(#hdNightCloudFront)" />
                  <circle cx="140" cy="118" r="20" fill="url(#hdNightCloudFront)" />
                  <circle cx="108" cy="98" r="24" fill="url(#hdNightCloudFront)" />
                  <rect x="46" y="114" width="124" height="26" rx="13" fill="url(#hdNightCloudFront)" />

                  {/* Kilau Permukaan Awan Malam 1 */}
                  <ellipse cx="108" cy="92" rx="15" ry="6" fill="#FFFFFF" opacity={0.4} />
                  <ellipse cx="74" cy="110" rx="11" ry="5" fill="#FFFFFF" opacity={0.25} />
                </g>

                {/* 4. AWAN MALAM 2 (Awan Pendamping di Kanan Bawah) */}
                <g
                  filter="url(#hdCloudShadow)"
                  style={{ animation: "driftCloud2 12s ease-in-out infinite", transformOrigin: "176px 126px" }}
                >
                  {/* Lapisan Belakang Kedalaman */}
                  <ellipse cx="176" cy="124" rx="42" ry="20" fill="url(#hdNightCloudBack)" />
                  <circle cx="150" cy="126" r="16" fill="url(#hdNightCloudBack)" />
                  <circle cx="202" cy="126" r="16" fill="url(#hdNightCloudBack)" />

                  {/* Lapisan Depan Lembut & Fluffy */}
                  <ellipse cx="176" cy="122" rx="44" ry="20" fill="url(#hdNightCloudFront)" />
                  <circle cx="148" cy="124" r="18" fill="url(#hdNightCloudFront)" />
                  <circle cx="204" cy="124" r="18" fill="url(#hdNightCloudFront)" />
                  <circle cx="224" cy="130" r="13" fill="url(#hdNightCloudFront)" />
                  <circle cx="176" cy="106" r="22" fill="url(#hdNightCloudFront)" />
                  <rect x="138" y="120" width="100" height="24" rx="12" fill="url(#hdNightCloudFront)" />

                  {/* Kilau Permukaan Awan Malam 2 */}
                  <ellipse cx="176" cy="100" rx="13" ry="5" fill="#FFFFFF" opacity={0.35} />
                  <ellipse cx="204" cy="116" rx="10" ry="4.5" fill="#FFFFFF" opacity={0.2} />
                </g>
              </g>
            )}
          </svg>
        </div>

        {/* Top-Right Unified Capsule: Live Clock & Date + Day/Night Mode Switcher */}
        <div className="absolute top-3 sm:top-4 right-3 sm:right-6 z-20 flex items-center select-none">
          <div className="inline-flex items-center gap-2 sm:gap-2.5 px-3 sm:px-3.5 py-1.5 rounded-full bg-white/90 hover:bg-white backdrop-blur-md border border-white/95 shadow-2xs text-[#1A1A1A] transition-all">
            {/* Live Digital Clock */}
            <div className="flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-[#1A1A1A]/70" />
              <span className="font-mono font-bold text-xs tabular-nums tracking-tight">
                {timeFormatted.hours}:{timeFormatted.minutes}
                <span className="text-[#8E8E93] font-normal text-[11px]">:{timeFormatted.seconds}</span>
              </span>
            </div>

            <span className="w-px h-3.5 bg-zinc-200" />

            {/* Localized Date */}
            <div className="flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-[#1A1A1A]/70" />
              <span className="text-[11px] sm:text-xs font-semibold text-[#1A1A1A]/85 tracking-tight">
                <span className="hidden md:inline">{dateFormatted.dayName}, </span>
                {dateFormatted.dateNum} {dateFormatted.monthName}
                <span className="hidden sm:inline"> {dateFormatted.yearNum}</span>
              </span>
            </div>

            <span className="w-px h-3.5 bg-zinc-200" />

            {/* Day / Night Mode Switcher Button */}
            <button
              type="button"
              onClick={handleToggleTimeOfDay}
              className="flex items-center gap-1.5 pl-1.5 pr-2 py-0.5 -mr-1 rounded-full bg-[#F6F6F6] hover:bg-[#EBEBEB] text-xs font-bold text-[#1A1A1A] transition-all active:scale-95 cursor-pointer"
              title={isDayTime ? "Beralih ke suasana Malam 🌙" : "Beralih ke suasana Siang ☀️"}
              aria-label="Ganti suasana Siang atau Malam"
            >
              <span className="text-xs leading-none">{isDayTime ? "☀️" : "🌙"}</span>
              <span className="text-[11px] font-extrabold leading-none">{isDayTime ? "Siang" : "Malam"}</span>
            </button>
          </div>
        </div>

        <div className="relative z-10 flex flex-col sm:flex-row items-start sm:items-center gap-5 sm:gap-7">
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
                Dashboard Akademik
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
