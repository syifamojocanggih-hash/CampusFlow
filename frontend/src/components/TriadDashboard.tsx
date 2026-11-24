import React, { useState, useEffect, useMemo, useRef } from "react";
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
  Sparkles,
  SlidersHorizontal,
  CheckCircle2,
  AlertCircle,
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
import {
  VALID_DAYS_ID,
  type ExtractedKrsCourse,
  type DayOfWeekIndonesian,
} from "@/lib/krsPdfClient";
import { useOsScreenTime } from "@/utils/screenTimeTracker";
import {
  autoSleepTracker,
  useAutoSleep,
  getSleepSourceLabel,
  getSleepClinicalMeta,
} from "@/utils/autoSleepTracker";
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

export const TriadDashboard: React.FC<TriadDashboardProps> = ({
  onStartPanicRelief: _onStartPanicRelief,
  onNavigateToFocus: _onNavigateToFocus,
}) => {
  // 1. Data States (100% Dynamic from MySQL Database)
  const [schedules, setSchedules] = useState<AcademicScheduleDTO[]>([]);
  const [trendHistory, setTrendHistory] = useState<
    Array<{ logDate: string; burnoutIndex: number; recoveryScore: number; academicLoad: number }>
  >([]);
  const autoSleep = useAutoSleep();
  const sleepHours = autoSleep.sleepHours;
  const sleepClinicalMeta = useMemo(
    () => getSleepClinicalMeta(autoSleep.clinicalStatus),
    [autoSleep.clinicalStatus]
  );

  const osScreenTime = useOsScreenTime();
  const screenTimeHours = osScreenTime.totalHours;
  const [verifiedBreakCount, setVerifiedBreakCount] = useState<number>(0);
  const [isKrsModalOpen, setIsKrsModalOpen] = useState<boolean>(false);
  const [krsModalTab, setKrsModalTab] = useState<"upload" | "manual" | "manage">("upload");
  const [isExtractingPdf, setIsExtractingPdf] = useState<boolean>(false);
  const krsFileInputRef = useRef<HTMLInputElement | null>(null);
  const [isDragOverKrs, setIsDragOverKrs] = useState<boolean>(false);
  const [krsUploadError, setKrsUploadError] = useState<string | null>(null);
  const [krsUploadedFileName, setKrsUploadedFileName] = useState<string | null>(null);
  const [krsPreviewItems, setKrsPreviewItems] = useState<ExtractedKrsCourse[] | null>(null);
  const [krsExtractionSource, setKrsExtractionSource] = useState<string | null>(null);
  const [replaceExistingKrs, setReplaceExistingKrs] = useState<boolean>(true);
  const [isConfirmingKrs, setIsConfirmingKrs] = useState<boolean>(false);

  const realTodayDayOfWeek = useMemo(() => {
    const d = new Date().getDay();
    return d === 0 ? 7 : d;
  }, []);
  const [selectedDayFilter, setSelectedDayFilter] = useState<number | "ALL">(realTodayDayOfWeek);

  // Auto-Sleep Inspector & Simulator Modal States
  const [isSleepModalOpen, setIsSleepModalOpen] = useState<boolean>(false);
  const [customBedTime, setCustomBedTime] = useState<string>(autoSleep.bedTime || "23:15");
  const [customWakeTime, setCustomWakeTime] = useState<string>(autoSleep.wakeTime || "06:45");
  const [customLatencyMins, setCustomLatencyMins] = useState<number>(autoSleep.sleepLatencyMins ?? 15);

  useEffect(() => {
    setCustomBedTime(autoSleep.bedTime);
    setCustomWakeTime(autoSleep.wakeTime);
    setCustomLatencyMins(autoSleep.sleepLatencyMins);
  }, [autoSleep.bedTime, autoSleep.wakeTime, autoSleep.sleepLatencyMins]);

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

  // Load schedule, active break count & 14-day burnout history from MySQL API
  const refreshDashboardFromDb = () => {
    api
      .getAcademicSchedules()
      .then((res) => {
        setSchedules(Array.isArray(res.data) ? res.data : []);
      })
      .catch((err) => console.warn("[TriadDashboard] Gagal memuat jadwal KRS:", err));

    api
      .getTodayActiveBreaks()
      .then((res) => {
        if (typeof res.data?.verifiedCount === "number") {
          setVerifiedBreakCount(res.data.verifiedCount);
        }
      })
      .catch(() => {});

    api
      .getBurnoutHistory(14)
      .then((res) => {
        const items = Array.isArray(res.data?.items)
          ? (res.data.items as Array<{
              logDate?: string;
              burnoutIndex?: number;
              recoveryScore?: number;
              academicLoadScore?: number;
            }>)
          : [];
        if (items.length > 0) {
          setTrendHistory(
            items.map((item) => {
              const rawDate = String(item.logDate || "");
              const parts = rawDate.split("-");
              const label =
                parts.length === 3 ? `${parts[2]}/${parts[1]}` : rawDate || "Hari Ini";
              return {
                logDate: label,
                burnoutIndex: Number(item.burnoutIndex ?? 0),
                recoveryScore: Number(item.recoveryScore ?? 0),
                academicLoad: Number(item.academicLoadScore ?? 0),
              };
            })
          );
        }
      })
      .catch(() => {});
  };

  useEffect(() => {
    refreshDashboardFromDb();
  }, []);

  // Filter jadwal kuliah untuk perhitungan Burnout Hari Ini & tampilan kartu Jadwal
  const todaySchedulesForBurnout = useMemo(() => {
    const exactToday = schedules.filter((s) => s.dayOfWeek === realTodayDayOfWeek);
    if (exactToday.length > 0) return exactToday;
    return schedules.filter(
      (s) => s.dayOfWeek === (selectedDayFilter === "ALL" ? realTodayDayOfWeek : selectedDayFilter)
    );
  }, [schedules, realTodayDayOfWeek, selectedDayFilter]);

  const displayedSchedules = useMemo(() => {
    if (selectedDayFilter === "ALL") return schedules;
    return schedules.filter((s) => s.dayOfWeek === selectedDayFilter);
  }, [schedules, selectedDayFilter]);

  // Compute PRD v4.0 Unified Burnout Risk Index (0-100)
  const scheduleInputs: ScheduleItemInput[] = useMemo(() => {
    return todaySchedulesForBurnout.map((s) => ({
      creditHours: s.creditHours,
      isPracticum: s.isPracticum,
      isExamWeek: s.isExamWeek,
    }));
  }, [todaySchedulesForBurnout]);

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
    recoveryScore,
    burnoutIndex,
    status: burnoutStatus,
  } = burnoutResult;

  // Sinkronkan perhitungan Burnout hari ini ke tabel DailyFussionLog di MySQL setiap ada perubahan
  useEffect(() => {
    const timer = setTimeout(() => {
      void api
        .calculateBurnout({
          totalScreenTimeMins: Math.max(1, Math.round(screenTimeHours * 60)),
          sleepHours,
        })
        .catch(() => {});
    }, 600);
    return () => clearTimeout(timer);
  }, [schedules.length, screenTimeHours, sleepHours, verifiedBreakCount]);

  // Gabungkan riwayat 14 hari dari database dengan skor live hari ini
  const chartData = useMemo(() => {
    const now = new Date();
    const todayLabel = `${String(now.getDate()).padStart(2, "0")}/${String(
      now.getMonth() + 1
    ).padStart(2, "0")}`;
    const todayPoint = {
      logDate: todayLabel,
      burnoutIndex: Math.round(burnoutIndex),
      recoveryScore: Math.round(recoveryScore),
      academicLoad: academicLoadScore,
    };

    if (trendHistory.length === 0) {
      return [todayPoint];
    }

    const existsIdx = trendHistory.findIndex((p) => p.logDate === todayLabel);
    if (existsIdx >= 0) {
      return trendHistory.map((p, i) => (i === existsIdx ? todayPoint : p));
    }
    return [...trendHistory, todayPoint];
  }, [trendHistory, burnoutIndex, recoveryScore, academicLoadScore]);



  // Status Styling
  const statusMeta = useMemo(() => {
    if (burnoutStatus === "LOW") {
      return {
        label: "OPTIMAL / AMAN",
        badgeBg: "bg-[#E8DDCF] text-[#2F3A2E] border border-[#E8DDCF]",
        cardBg: "bg-[#FAF6F0] border-[#E8DDCF]",
        ringColor: "#CFD8C4",
        textColor: "text-[#2F3A2E]",
        desc: "Keseimbangan beban kuliah, waktu layar, dan pemulihan Anda berada di zona aman.",
      };
    }
    if (burnoutStatus === "MODERATE") {
      return {
        label: "WASPADA KELELAHAN",
        badgeBg: "bg-[#E8DDCF] text-[#2F3A2E] border border-[#CFD8C4]",
        cardBg: "bg-[#FAF6F0] border-[#CFD8C4]",
        ringColor: "#CFD8C4",
        textColor: "text-[#2F3A2E]",
        desc: "Beban belajar mulai mendominasi. Segera lakukan Active Break 2 menit dan cukupi tidur malam.",
      };
    }
    return {
      label: "RISIKO TINGGI (BURNOUT)",
      badgeBg: "bg-[#E8DDCF] text-[#636B60]",
      cardBg: "bg-[#FAF6F0] border-[#CFD8C4]",
      ringColor: "#CFD8C4",
      textColor: "text-[#2F3A2E]",
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
      const saved = await api.saveAcademicSchedule(newCourse);
      if (saved && typeof saved === "object" && "id" in saved) {
        setSchedules((prev) => [...prev, saved]);
      } else {
        refreshDashboardFromDb();
      }
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

  // Handle Real KRS File Upload & Preview Extraction (PRD v4.0 Section 3.1)
  const handleKrsFileUpload = async (file: File | null | undefined) => {
    if (!file) return;
    setKrsUploadError(null);
    setIsExtractingPdf(true);
    setKrsUploadedFileName(file.name);

    try {
      const res = await api.uploadKrsPdfPreview(file);
      if (!res.data?.items || res.data.items.length === 0) {
        throw new Error(
          "Tidak ada mata kuliah yang terdeteksi dari file ini. Pastikan dokumen KRS memuat nama mata kuliah dan SKS."
        );
      }
      setKrsPreviewItems(res.data.items);
      setKrsExtractionSource(
        res.data.source === "GEMINI_API" ? "Google Gemini AI OCR" : "Ekstraktor Dokumen KRS"
      );
    } catch (err: unknown) {
      const msg =
        err instanceof Error
          ? err.message
          : "Gagal mengekstrak file KRS. Pastikan format file PDF atau gambar terbaca jelas.";
      setKrsUploadError(msg);
      setKrsPreviewItems(null);
    } finally {
      setIsExtractingPdf(false);
      if (krsFileInputRef.current) {
        krsFileInputRef.current.value = "";
      }
    }
  };

  const handleUpdatePreviewItem = (idx: number, patch: Partial<ExtractedKrsCourse>) => {
    setKrsPreviewItems((prev) => {
      if (!prev) return prev;
      return prev.map((item, i) => (i === idx ? { ...item, ...patch } : item));
    });
  };

  const handleRemovePreviewItem = (idx: number) => {
    setKrsPreviewItems((prev) => {
      if (!prev) return prev;
      const next = prev.filter((_, i) => i !== idx);
      return next.length > 0 ? next : null;
    });
  };

  const handleConfirmExtractedKrs = async () => {
    if (!krsPreviewItems || krsPreviewItems.length === 0) return;
    setIsConfirmingKrs(true);
    setKrsUploadError(null);

    try {
      await api.confirmAcademicSchedules(krsPreviewItems, replaceExistingKrs);
      const refreshed = await api.getAcademicSchedules();
      if (refreshed.data && refreshed.data.length > 0) {
        setSchedules(refreshed.data);
      } else {
        const mapped: AcademicScheduleDTO[] = krsPreviewItems.map((item, idx) => ({
          id: `krs-${Date.now()}-${idx}`,
          dayOfWeek: Math.max(1, VALID_DAYS_ID.indexOf(item.day_of_week) + 1),
          subjectName: item.subject_name,
          creditHours: item.credit_hours,
          isPracticum: item.class_type === "praktikum",
          isExamWeek: item.is_exam_week,
          startTime: item.start_time,
          endTime: item.end_time,
        }));
        setSchedules((prev) => (replaceExistingKrs ? mapped : [...prev, ...mapped]));
      }
      setSelectedDayFilter("ALL");
      setKrsPreviewItems(null);
      setKrsUploadedFileName(null);
      setIsKrsModalOpen(false);
    } catch (err: unknown) {
      const msg =
        err instanceof Error ? err.message : "Gagal menyimpan jadwal KRS ke database.";
      setKrsUploadError(msg);
    } finally {
      setIsConfirmingKrs(false);
    }
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
                <feDropShadow dx="0" dy="5" stdDeviation="4" floodColor="#2F3A2E" floodOpacity="0.08" />
              </filter>
              <filter id="hdSunGlow" x="-30%" y="-30%" width="160%" height="160%">
                <feDropShadow dx="0" dy="0" stdDeviation="8" floodColor="#F59E0B" floodOpacity="0.45" />
              </filter>
              <filter id="hdMoonGlow" x="-30%" y="-30%" width="160%" height="160%">
                <feDropShadow dx="0" dy="0" stdDeviation="8" floodColor="#94A3B8" floodOpacity="0.45" />
              </filter>

              {/* Day Palette Gradients (Warm Yellow Sun) */}
              <linearGradient id="hdSunCoreGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#FEF08A" />
                <stop offset="45%" stopColor="#FACC15" />
                <stop offset="100%" stopColor="#F59E0B" />
              </linearGradient>
              <radialGradient id="hdSunAuraGrad" cx="50%" cy="50%" r="50%">
                <stop offset="0%" stopColor="#FEF08A" stopOpacity="0.80" />
                <stop offset="55%" stopColor="#FACC15" stopOpacity="0.30" />
                <stop offset="100%" stopColor="#FEF08A" stopOpacity="0.00" />
              </radialGradient>
              <linearGradient id="hdDayCloudFront" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="#FFFFFF" />
                <stop offset="65%" stopColor="#F8FAFC" />
                <stop offset="100%" stopColor="#F1F5F9" />
              </linearGradient>
              <linearGradient id="hdDayCloudBack" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.95" />
                <stop offset="100%" stopColor="#E2E8F0" stopOpacity="0.65" />
              </linearGradient>

              {/* Night Palette Gradients (Silver Gray Moon) */}
              <linearGradient id="hdMoonCoreGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#F1F5F9" />
                <stop offset="45%" stopColor="#CBD5E1" />
                <stop offset="100%" stopColor="#94A3B8" />
              </linearGradient>
              <radialGradient id="hdMoonAuraGrad" cx="50%" cy="50%" r="50%">
                <stop offset="0%" stopColor="#E2E8F0" stopOpacity="0.70" />
                <stop offset="50%" stopColor="#94A3B8" stopOpacity="0.28" />
                <stop offset="100%" stopColor="#94A3B8" stopOpacity="0.00" />
              </radialGradient>
              <linearGradient id="hdNightCloudFront" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="#FFFFFF" />
                <stop offset="65%" stopColor="#F1F5F9" />
                <stop offset="100%" stopColor="#E2E8F0" />
              </linearGradient>
              <linearGradient id="hdNightCloudBack" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="#E2E8F0" stopOpacity="0.95" />
                <stop offset="100%" stopColor="#94A3B8" stopOpacity="0.55" />
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
                        fill="#FACC15"
                        opacity={0.9}
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
                    fill="#CBD5E1"
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
                  <circle cx="139" cy="46" r="3.8" fill="#64748B" opacity={0.4} />
                  <circle cx="134" cy="60" r="2.8" fill="#64748B" opacity={0.35} />
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
          <div className="inline-flex items-center gap-2 sm:gap-2.5 px-3 sm:px-3.5 py-1.5 rounded-full bg-white/90 hover:bg-white backdrop-blur-md border border-white/95 shadow-2xs text-[#2F3A2E] transition-all">
            {/* Live Digital Clock */}
            <div className="flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-[#2F3A2E]/70" />
              <span className="font-mono font-bold text-xs tabular-nums tracking-tight">
                {timeFormatted.hours}:{timeFormatted.minutes}
                <span className="text-[#636B60] font-normal text-[11px]">:{timeFormatted.seconds}</span>
              </span>
            </div>

            <span className="w-px h-3.5 bg-zinc-200" />

            {/* Localized Date */}
            <div className="flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-[#2F3A2E]/70" />
              <span className="text-[11px] sm:text-xs font-semibold text-[#2F3A2E]/85 tracking-tight">
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
              className="flex items-center gap-1.5 pl-1.5 pr-2 py-0.5 -mr-1 rounded-full bg-[#FAF6F0] hover:bg-[#FAF6F0] text-xs font-bold text-[#2F3A2E] transition-all active:scale-95 cursor-pointer"
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
                stroke="#E8DDCF"
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
              <span className="text-3xl sm:text-4xl font-heading font-extrabold text-[#2F3A2E] sensor-num leading-none">
                {Math.round(burnoutIndex)}
              </span>
              <span className="text-[10px] text-[#636B60] font-bold uppercase tracking-wider mt-0.5">
                Index / 100
              </span>
            </div>
          </div>

          {/* Title & Status */}
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-[11px] font-extrabold uppercase tracking-wider text-[#636B60]">
                Dashboard Akademik
              </span>
            </div>
            <h2 className="text-xl sm:text-2xl font-heading font-extrabold text-[#2F3A2E] leading-tight">
              Burnout Risk Index
            </h2>
            <p className="text-xs text-[#2F3A2E]/80 font-medium max-w-xl leading-relaxed">
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
            <div className="w-9 h-9 rounded-2xl bg-[#E8DDCF] flex items-center justify-center text-[#2F3A2E] shrink-0 shadow-xs">
              <BookOpen className="w-4 h-4 text-[#2F3A2E]" />
            </div>
            <p className="text-xs sm:text-sm font-bold text-[#2F3A2E]">Beban Kuliah</p>
          </div>
          <h3 className="text-2xl sm:text-3xl font-heading font-extrabold text-[#2F3A2E] sensor-num">
            {academicLoadScore}
            <span className="text-xs font-medium text-[#636B60] ml-1.5">Poin</span>
          </h3>
        </div>

        {/* Card 2: Screen Time (OS-Level System Idle & Activity Tracker) */}
        <div
          className="learnova-card p-4 sm:p-5 flex flex-col justify-between h-full"
          title="Melacak seluruh aktivitas Layar OS (tetap berjalan saat pindah tab atau buka aplikasi lain seperti VS Code/Word/PDF)"
        >
          <div className="flex items-center gap-2.5 mb-2">
            <div className="w-9 h-9 rounded-2xl bg-[#E8DDCF] flex items-center justify-center text-[#2F3A2E] shrink-0 shadow-xs">
              <Monitor className="w-4 h-4 text-[#2F3A2E]" />
            </div>
            <p className="text-xs sm:text-sm font-bold text-[#2F3A2E] leading-tight">
              Waktu Layar
            </p>
          </div>

          <div className="flex items-baseline justify-between gap-2 flex-wrap">
            <h3 className="text-2xl sm:text-3xl font-heading font-extrabold text-[#2F3A2E] sensor-num">
              {screenTimeHours}
              <span className="text-xs font-medium text-[#636B60] ml-1.5">Jam</span>
            </h3>
            <span className="text-[10px] font-mono font-extrabold px-2 py-0.5 rounded-full bg-[#FAF6F0] border border-[#E8DDCF] text-[#2F3A2E]">
              {osScreenTime.formattedHMS}
            </span>
          </div>
        </div>

        {/* Card 3: Sleep Duration & Recovery (Automatic Passive Sleep Detector) */}
        <div
          onClick={() => setIsSleepModalOpen(true)}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") {
              e.preventDefault();
              setIsSleepModalOpen(true);
            }
          }}
          className="learnova-card p-4 sm:p-5 flex flex-col justify-between h-full cursor-pointer hover:border-[#CFD8C4] transition-all group"
          title="Klik untuk melihat detail deteksi tidur otomatis atau simulasi jam tidur"
        >
          <div className="flex items-center justify-between gap-2 mb-2">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-2xl bg-[#E8DDCF] flex items-center justify-center text-[#2F3A2E] shrink-0 shadow-xs">
                <Moon className="w-4 h-4 text-[#2F3A2E]" />
              </div>
              <p className="text-xs sm:text-sm font-bold text-[#2F3A2E] leading-tight">
                Tidur Semalam
              </p>
            </div>
            <SlidersHorizontal className="w-3.5 h-3.5 text-[#636B60] group-hover:text-[#2F3A2E] transition-colors shrink-0" />
          </div>

          <div className="flex items-baseline justify-between gap-2 flex-wrap">
            <h3 className="text-2xl sm:text-3xl font-heading font-extrabold text-[#2F3A2E] sensor-num">
              {sleepHours}
              <span className="text-xs font-medium text-[#636B60] ml-1.5">Jam</span>
            </h3>
            <span
              className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full border ${sleepClinicalMeta.badgeStyle}`}
            >
              {autoSleep.bedTime}&ndash;{autoSleep.wakeTime} &bull; +{autoSleep.recoveryPoints} Poin
            </span>
          </div>
        </div>

        {/* Card 4: Verified Active Break (On-Demand MediaPipe 2 Mins) */}
        <div className="learnova-card p-4 sm:p-5 flex flex-col justify-center h-full">
          <div className="flex items-center gap-2.5 mb-2 sm:mb-2.5">
            <div className="w-9 h-9 rounded-2xl bg-[#E8DDCF] flex items-center justify-center text-[#2F3A2E] shrink-0 shadow-xs">
              <Play className="w-4 h-4 fill-[#2F3A2E] text-[#2F3A2E] ml-0.5" />
            </div>
            <p className="text-xs sm:text-sm font-bold text-[#2F3A2E]">Active Break</p>
          </div>
          <h3 className="text-2xl sm:text-3xl font-heading font-extrabold text-[#2F3A2E] sensor-num">
            {verifiedBreakCount}
            <span className="text-xs font-medium text-[#636B60] ml-1.5">Sesi</span>
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
              <div className="flex items-center justify-between pb-2.5">
                <div>
                  <h3 className="font-heading font-extrabold text-base text-[#2F3A2E]">
                    {selectedDayFilter === "ALL"
                      ? "Seluruh Jadwal Kuliah (KRS)"
                      : selectedDayFilter === realTodayDayOfWeek
                      ? `Jadwal Kuliah Hari Ini (${DAY_NAMES[realTodayDayOfWeek - 1]})`
                      : `Jadwal Kuliah Hari ${DAY_NAMES[selectedDayFilter - 1]}`}
                  </h3>
                </div>
                <button
                  onClick={() => setIsKrsModalOpen(true)}
                  className="text-xs font-bold text-[#2F3A2E] bg-[#FAF6F0] hover:bg-[#CFD8C4] px-3 py-1.5 rounded-full border border-[#E8DDCF] flex items-center gap-1.5 transition-colors shrink-0 cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  Tambah / Edit KRS
                </button>
              </div>

              {/* Filter Hari Perkuliahan */}
              <div className="flex items-center gap-1.5 overflow-x-auto pb-2.5 mb-1">
                <button
                  type="button"
                  onClick={() => setSelectedDayFilter(realTodayDayOfWeek)}
                  className={`px-2.5 py-1 rounded-xl text-[11px] font-extrabold transition-all shrink-0 cursor-pointer ${
                    selectedDayFilter === realTodayDayOfWeek
                      ? "bg-[#CFD8C4] text-[#2F3A2E] border border-[#BCC8AE]"
                      : "bg-[#FAF6F0] text-[#636B60] hover:text-[#2F3A2E]"
                  }`}
                >
                  Hari Ini
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedDayFilter("ALL")}
                  className={`px-2.5 py-1 rounded-xl text-[11px] font-extrabold transition-all shrink-0 cursor-pointer ${
                    selectedDayFilter === "ALL"
                      ? "bg-[#CFD8C4] text-[#2F3A2E] border border-[#BCC8AE]"
                      : "bg-[#FAF6F0] text-[#636B60] hover:text-[#2F3A2E]"
                  }`}
                >
                  Semua ({schedules.length})
                </button>
                {DAY_NAMES.slice(0, 6).map((dayLabel, idx) => {
                  const dayNum = idx + 1;
                  const countForDay = schedules.filter((s) => s.dayOfWeek === dayNum).length;
                  return (
                    <button
                      key={dayNum}
                      type="button"
                      onClick={() => setSelectedDayFilter(dayNum)}
                      className={`px-2.5 py-1 rounded-xl text-[11px] font-bold transition-all shrink-0 cursor-pointer ${
                        selectedDayFilter === dayNum
                          ? "bg-[#CFD8C4] text-[#2F3A2E] font-extrabold"
                          : "bg-[#FAF6F0] text-[#636B60] hover:text-[#2F3A2E]"
                      }`}
                    >
                      {dayLabel.slice(0, 3)}
                      {countForDay > 0 ? ` (${countForDay})` : ""}
                    </button>
                  );
                })}
              </div>

              {/* Schedule List */}
              <div className="space-y-3 pt-1">
                {displayedSchedules.length === 0 ? (
                  <div className="flex-1 flex flex-col items-center justify-center p-6 rounded-2xl bg-[#FAF6F0] border border-[#E8DDCF] text-center space-y-2 min-h-[160px]">
                    <Calendar className="w-8 h-8 text-[#636B60] mx-auto" />
                    <p className="text-xs font-bold text-[#2F3A2E]">
                      Tidak Ada Jadwal Kuliah pada Hari Ini
                    </p>
                    <p className="text-[11px] text-[#636B60] max-w-xs">
                      Bagus untuk pemulihan energi! Pilih tab <strong>Semua ({schedules.length})</strong> untuk melihat seluruh mata kuliah KRS Anda.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-3 max-h-[260px] overflow-y-auto pr-0.5">
                    {displayedSchedules.map((item, idx) => (
                      <div
                        key={item.id || `${item.subjectName}-${item.dayOfWeek}-${idx}`}
                        className="p-3.5 rounded-2xl bg-[#FAF6F0] border border-[#E8DDCF] flex items-center justify-between hover:bg-white hover:border-[#CFD8C4] transition-colors group"
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="w-10 h-10 rounded-xl bg-white border border-[#E8DDCF] flex flex-col items-center justify-center text-[#2F3A2E] shrink-0 font-mono">
                            <span className="text-xs font-extrabold">{item.creditHours}</span>
                            <span className="text-[9px] text-[#636B60] uppercase">SKS</span>
                          </div>
                          <div className="min-w-0">
                            <h4 className="text-xs font-bold text-[#2F3A2E] truncate">
                              {item.subjectName}
                            </h4>
                            <p className="text-[10px] text-[#636B60] mt-0.5">
                              {DAY_NAMES[item.dayOfWeek - 1] || `Hari ${item.dayOfWeek}`} &bull;{" "}
                              {item.isPracticum ? "Praktikum (1.5x)" : "Teori (1.0x)"}
                              {item.startTime && item.endTime
                                ? ` · ${item.startTime}–${item.endTime}`
                                : ""}
                            </p>
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleDeleteSchedule(item)}
                          className="w-7 h-7 rounded-xl bg-white hover:bg-[#FEE2E2] text-[#636B60] hover:text-[#DC2626] border border-[#E8DDCF] hover:border-[#FCA5A5] flex items-center justify-center transition-colors shadow-2xs group/del shrink-0"
                          title={`Hapus jadwal ${item.subjectName}`}
                          aria-label={`Hapus jadwal ${item.subjectName}`}
                        >
                          <Trash2 className="w-3.5 h-3.5 text-[#636B60] group-hover/del:text-[#DC2626] transition-colors" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* KRS Load Summary Bar */}
            <div className="pt-3 border-t border-[#E8DDCF] flex items-center justify-between text-xs mt-4">
              <span className="text-[#636B60]">
                Total Bobot SKS Ditampilkan:{" "}
                <strong>{displayedSchedules.reduce((acc, s) => acc + s.creditHours, 0)} SKS</strong>
              </span>
              <span className="font-bold text-[#2F3A2E] bg-[#E8DDCF] px-2.5 py-0.5 rounded-full">
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
                <h3 className="font-heading font-extrabold text-base text-[#2F3A2E]">
                  Tren Burnout &amp; Pemulihan 14 Hari
                </h3>
                <p className="text-[11px] text-[#636B60]">
                  Perbandingan Burnout Index vs Skor Pemulihan
                </p>
              </div>

              <div className="h-52 w-full pt-2">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={chartData} margin={{ top: 5, right: 5, left: -25, bottom: 0 }}>
                    <defs>
                      <linearGradient id="burnoutGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#2F3A2E" stopOpacity={0.35} />
                        <stop offset="95%" stopColor="#2F3A2E" stopOpacity={0.03} />
                      </linearGradient>
                      <linearGradient id="recoveryGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#7A946E" stopOpacity={0.48} />
                        <stop offset="95%" stopColor="#CFD8C4" stopOpacity={0.05} />
                      </linearGradient>
                    </defs>
                    <XAxis
                      dataKey="logDate"
                      tick={{ fontSize: 10, fill: "#636B60" }}
                      axisLine={false}
                      tickLine={false}
                    />
                    <YAxis
                      tick={{ fontSize: 10, fill: "#636B60" }}
                      axisLine={false}
                      tickLine={false}
                      domain={[0, 100]}
                    />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "#FFFFFF",
                        color: "#2F3A2E",
                        borderRadius: "16px",
                        border: "1px solid #CFD8C4",
                        fontSize: "11px",
                        boxShadow: "0 8px 20px -4px rgba(47,58,46,0.12)",
                      }}
                    />
                    <Area
                      type="monotone"
                      dataKey="burnoutIndex"
                      name="Burnout Index"
                      stroke="#2F3A2E"
                      strokeWidth={2.5}
                      fillOpacity={1}
                      fill="url(#burnoutGradient)"
                    />
                    <Area
                      type="monotone"
                      dataKey="recoveryScore"
                      name="Skor Pemulihan"
                      stroke="#7A946E"
                      strokeWidth={2.5}
                      fillOpacity={1}
                      fill="url(#recoveryGradient)"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="pt-3 border-t border-[#E8DDCF] flex items-center justify-start gap-5 text-xs font-semibold text-[#2F3A2E] mt-4">
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-[#2F3A2E] shrink-0" />
                <span>Burnout Index</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-[#7A946E] shrink-0" />
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
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-[#E8DDCF] space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-[#E8DDCF]">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-[#E8DDCF] flex items-center justify-center text-[#2F3A2E]">
                  <BookOpen className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-heading font-extrabold text-base text-[#2F3A2E]">
                    Smart Academic Planner
                  </h3>
                  <p className="text-[11px] text-[#636B60]">Input Jadwal Kuliah &amp; Ekstraksi KRS Otomatis</p>
                </div>
              </div>
              <button
                onClick={() => setIsKrsModalOpen(false)}
                className="w-8 h-8 rounded-full bg-[#FAF6F0] hover:bg-[#CFD8C4] text-[#2F3A2E] flex items-center justify-center transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Tabs: PDF Upload vs Manual Form vs Daftar Matakuliah */}
            <div className="flex gap-2 p-1 bg-[#FAF6F0] rounded-2xl border border-[#E8DDCF]">
              <button
                type="button"
                onClick={() => setKrsModalTab("upload")}
                className={`flex-1 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                  krsModalTab === "upload"
                    ? "bg-white text-[#2F3A2E] shadow-xs"
                    : "text-[#636B60] hover:text-[#2F3A2E]"
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
                    ? "bg-white text-[#2F3A2E] shadow-xs"
                    : "text-[#636B60] hover:text-[#2F3A2E]"
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
                    ? "bg-white text-[#2F3A2E] shadow-xs"
                    : "text-[#636B60] hover:text-[#2F3A2E]"
                }`}
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Daftar ({schedules.length})</span>
              </button>
            </div>

            {/* Tab 1: Real PDF / Image KRS Upload Dropzone & Preview Editor (No Demo Button) */}
            {krsModalTab === "upload" ? (
              <div className="space-y-4">
                <input
                  ref={krsFileInputRef}
                  type="file"
                  accept=".pdf,application/pdf,image/png,image/jpeg,image/jpg,image/webp,.txt,.csv"
                  className="hidden"
                  onChange={(e) => {
                    const selected = e.target.files?.[0];
                    void handleKrsFileUpload(selected);
                  }}
                />

                {krsUploadError && (
                  <div className="p-3.5 rounded-2xl bg-[#FAF6F0] border border-[#CFD8C4] text-[#2F3A2E] text-xs flex items-start gap-2.5">
                    <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                    <div className="flex-1">
                      <p className="font-extrabold">Gagal Memproses Dokumen KRS</p>
                      <p className="text-[11px] mt-0.5">{krsUploadError}</p>
                    </div>
                  </div>
                )}

                {!krsPreviewItems ? (
                  <div
                    onDragOver={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      setIsDragOverKrs(true);
                    }}
                    onDragLeave={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      setIsDragOverKrs(false);
                    }}
                    onDrop={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      setIsDragOverKrs(false);
                      const droppedFile = e.dataTransfer.files?.[0];
                      void handleKrsFileUpload(droppedFile);
                    }}
                    onClick={() => {
                      if (!isExtractingPdf) {
                        krsFileInputRef.current?.click();
                      }
                    }}
                    className={`p-7 border-2 border-dashed rounded-2xl text-center space-y-3 transition-all cursor-pointer ${
                      isDragOverKrs
                        ? "border-[#2F3A2E] bg-[#CFD8C4]/30 scale-[1.01]"
                        : "border-[#CFD8C4] bg-[#FAF6F0] hover:border-[#CFD8C4]"
                    }`}
                  >
                    <div className="w-12 h-12 rounded-2xl bg-white text-[#2F3A2E] flex items-center justify-center mx-auto shadow-xs">
                      <FileText className="w-6 h-6 text-[#2F3A2E]" />
                    </div>
                    <div>
                      <p className="text-xs font-extrabold text-[#2F3A2E]">
                        {isExtractingPdf
                          ? `Mengekstrak ${krsUploadedFileName || "Dokumen KRS"}...`
                          : "Tarik & Lepas Berkas PDF / Screenshot KRS"}
                      </p>
                      <p className="text-[11px] text-[#636B60] mt-0.5">
                        Mendukung dokumen KRS resmi format PDF, PNG, atau JPG (maksimal 10 MB).
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        krsFileInputRef.current?.click();
                      }}
                      disabled={isExtractingPdf}
                      className="px-4 py-2.5 rounded-xl bg-[#CFD8C4] hover:bg-[#BCC8AE] text-[#2F3A2E] border border-[#BCC8AE] text-xs font-bold transition-all shadow-xs disabled:opacity-50 inline-flex items-center gap-1.5 cursor-pointer"
                    >
                      <UploadCloud className="w-3.5 h-3.5" />
                      <span>
                        {isExtractingPdf
                          ? "Mengekstrak Jadwal & SKS..."
                          : "Pilih File KRS & Ekstrak Otomatis"}
                      </span>
                    </button>
                  </div>
                ) : (
                  /* Interactive Preview & Review Table before Saving to DB */
                  <div className="space-y-3.5">
                    <div className="p-3 rounded-2xl bg-[#FAF6F0] border border-[#CFD8C4] flex flex-wrap items-center justify-between gap-2 text-xs">
                      <div>
                        <span className="font-extrabold text-[#2F3A2E] block">
                          {krsPreviewItems.length} Mata Kuliah Berhasil Diekstrak (
                          {krsPreviewItems.reduce((sum, it) => sum + it.credit_hours, 0)} SKS)
                        </span>
                        <span className="text-[10px] text-[#636B60]">
                          Berkas: <strong>{krsUploadedFileName}</strong> &bull; Mesin:{" "}
                          <strong>{krsExtractionSource}</strong>
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          setKrsPreviewItems(null);
                          setKrsUploadedFileName(null);
                          setKrsUploadError(null);
                        }}
                        className="px-2.5 py-1 rounded-xl bg-white hover:bg-[#FAF6F0] text-[#2F3A2E] border border-[#E8DDCF] text-[11px] font-bold cursor-pointer"
                      >
                        Ganti File
                      </button>
                    </div>

                    <div className="max-h-[250px] overflow-y-auto space-y-2 pr-1">
                      {krsPreviewItems.map((item, idx) => (
                        <div
                          key={idx}
                          className="p-2.5 rounded-xl bg-[#FAF6F0] border border-[#E8DDCF] space-y-2 text-xs"
                        >
                          <div className="flex items-center gap-2">
                            <input
                              type="text"
                              value={item.subject_name}
                              onChange={(e) =>
                                handleUpdatePreviewItem(idx, { subject_name: e.target.value })
                              }
                              className="flex-1 px-2.5 py-1 rounded-lg bg-white border border-[#E8DDCF] font-bold text-xs text-[#2F3A2E]"
                              placeholder="Nama Mata Kuliah"
                            />
                            <button
                              type="button"
                              onClick={() => handleRemovePreviewItem(idx)}
                              className="w-7 h-7 rounded-lg bg-white hover:bg-[#FEE2E2] text-[#636B60] hover:text-[#DC2626] border border-[#E8DDCF] flex items-center justify-center shrink-0 cursor-pointer"
                              title="Hapus baris ini"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>

                          <div className="grid grid-cols-3 gap-2">
                            <select
                              value={item.day_of_week}
                              onChange={(e) =>
                                handleUpdatePreviewItem(idx, {
                                  day_of_week: e.target.value as DayOfWeekIndonesian,
                                })
                              }
                              className="px-2 py-1 rounded-lg bg-white border border-[#E8DDCF] text-[11px] font-semibold text-[#2F3A2E]"
                            >
                              {VALID_DAYS_ID.map((d) => (
                                <option key={d} value={d}>
                                  {d}
                                </option>
                              ))}
                            </select>

                            <select
                              value={item.credit_hours}
                              onChange={(e) =>
                                handleUpdatePreviewItem(idx, {
                                  credit_hours: Number(e.target.value) || 2,
                                })
                              }
                              className="px-2 py-1 rounded-lg bg-white border border-[#E8DDCF] text-[11px] font-semibold text-[#2F3A2E]"
                            >
                              {[1, 2, 3, 4, 5, 6].map((sks) => (
                                <option key={sks} value={sks}>
                                  {sks} SKS
                                </option>
                              ))}
                            </select>

                            <select
                              value={item.class_type}
                              onChange={(e) =>
                                handleUpdatePreviewItem(idx, {
                                  class_type: e.target.value as "teori" | "praktikum",
                                })
                              }
                              className="px-2 py-1 rounded-lg bg-white border border-[#E8DDCF] text-[11px] font-semibold text-[#2F3A2E]"
                            >
                              <option value="teori">Teori (1.0x)</option>
                              <option value="praktikum">Praktikum (1.5x)</option>
                            </select>
                          </div>
                        </div>
                      ))}
                    </div>

                    <label className="flex items-center gap-2 text-xs font-semibold text-[#2F3A2E] cursor-pointer pt-1">
                      <input
                        type="checkbox"
                        checked={replaceExistingKrs}
                        onChange={(e) => setReplaceExistingKrs(e.target.checked)}
                        className="rounded text-[#2F3A2E]"
                      />
                      <span>Ganti seluruh jadwal kuliah lama dengan hasil ekstraksi KRS ini</span>
                    </label>

                    <div className="flex items-center justify-end gap-2 pt-1">
                      <button
                        type="button"
                        onClick={() => setKrsPreviewItems(null)}
                        className="px-3.5 py-2 rounded-xl text-xs font-bold text-[#636B60] hover:text-[#2F3A2E] cursor-pointer"
                      >
                        Batal
                      </button>
                      <button
                        type="button"
                        disabled={isConfirmingKrs}
                        onClick={() => void handleConfirmExtractedKrs()}
                        className="px-4 py-2 rounded-xl bg-[#CFD8C4] hover:bg-[#BCC8AE] text-[#2F3A2E] border border-[#BCC8AE] text-xs font-extrabold flex items-center gap-1.5 shadow-xs disabled:opacity-50 cursor-pointer"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>
                          {isConfirmingKrs
                            ? "Menyimpan Jadwal..."
                            : `Simpan ${krsPreviewItems.length} Mata Kuliah`}
                        </span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : krsModalTab === "manual" ? (
              /* Tab 2: Manual Form */
              <form onSubmit={handleAddCourse} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-[#2F3A2E] mb-1">
                    Nama Matakuliah
                  </label>
                  <input
                    type="text"
                    required
                    value={newSubjectName}
                    onChange={(e) => setNewSubjectName(e.target.value)}
                    placeholder="Contoh: Pemrograman Mobile Lanjut"
                    className="w-full px-3.5 py-2 text-xs bg-[#FAF6F0] border border-[#E8DDCF] rounded-xl text-[#2F3A2E] focus:outline-none focus:border-[#CFD8C4] focus:bg-white transition-all"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-[#2F3A2E] mb-1">
                      Hari Perkuliahan
                    </label>
                    <select
                      value={newDayOfWeek}
                      onChange={(e) => setNewDayOfWeek(Number(e.target.value))}
                      className="w-full px-3.5 py-2 text-xs bg-[#FAF6F0] border border-[#E8DDCF] rounded-xl text-[#2F3A2E] focus:outline-none focus:border-[#CFD8C4] focus:bg-white transition-all"
                    >
                      {DAY_NAMES.map((name, idx) => (
                        <option key={idx + 1} value={idx + 1}>
                          {name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-[#2F3A2E] mb-1">
                      Bobot SKS
                    </label>
                    <input
                      type="number"
                      min={1}
                      max={6}
                      value={newCreditHours}
                      onChange={(e) => setNewCreditHours(Number(e.target.value))}
                      className="w-full px-3.5 py-2 text-xs bg-[#FAF6F0] border border-[#E8DDCF] rounded-xl text-[#2F3A2E] focus:outline-none focus:border-[#CFD8C4] focus:bg-white transition-all"
                    />
                  </div>
                </div>

                {/* Toggles */}
                <div className="grid grid-cols-2 gap-3 pt-1">
                  <label className="flex items-center gap-2 p-2.5 rounded-xl bg-[#FAF6F0] border border-[#E8DDCF] cursor-pointer text-xs font-semibold text-[#2F3A2E]">
                    <input
                      type="checkbox"
                      checked={newIsPracticum}
                      onChange={(e) => setNewIsPracticum(e.target.checked)}
                      className="rounded text-[#2F3A2E] focus:ring-0"
                    />
                    <span>Praktikum (Bobot 1.5x)</span>
                  </label>

                  <label className="flex items-center gap-2 p-2.5 rounded-xl bg-[#FAF6F0] border border-[#E8DDCF] cursor-pointer text-xs font-semibold text-[#2F3A2E]">
                    <input
                      type="checkbox"
                      checked={newIsExamWeek}
                      onChange={(e) => setNewIsExamWeek(e.target.checked)}
                      className="rounded text-[#2F3A2E] focus:ring-0"
                    />
                    <span>Pekan Ujian (H-7)</span>
                  </label>
                </div>

                <div className="pt-2 flex items-center justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setIsKrsModalOpen(false)}
                    className="px-4 py-2 rounded-xl text-xs font-bold text-[#636B60] hover:text-[#2F3A2E] transition-colors"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 rounded-xl text-xs font-bold bg-[#CFD8C4] text-[#2F3A2E] hover:bg-[#BCC8AE] border border-[#BCC8AE] transition-colors shadow-xs"
                  >
                    Simpan Matakuliah
                  </button>
                </div>
              </form>
            ) : (
              /* Tab 3: Daftar & Hapus Matakuliah */
              <div className="space-y-3">
                <div className="flex items-center justify-between text-xs text-[#636B60]">
                  <span>Total Matakuliah: <strong>{schedules.length}</strong></span>
                  <span>Total Beban: <strong>{schedules.reduce((acc, s) => acc + s.creditHours, 0)} SKS</strong></span>
                </div>

                {schedules.length === 0 ? (
                  <div className="p-6 rounded-2xl bg-[#FAF6F0] border border-[#E8DDCF] text-center space-y-2">
                    <Calendar className="w-8 h-8 text-[#636B60] mx-auto" />
                    <p className="text-xs font-bold text-[#2F3A2E]">Belum Ada Matakuliah</p>
                    <p className="text-[11px] text-[#636B60]">
                      Tambahkan matakuliah baru melalui tab Input Manual atau Upload PDF.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-2 max-h-[300px] overflow-y-auto pr-1 divide-y divide-[#E8DDCF]">
                    {schedules.map((item, idx) => (
                      <div
                        key={item.id || `${item.subjectName}-${item.dayOfWeek}-${idx}`}
                        className="pt-2 pb-1 flex items-center justify-between gap-3 text-xs"
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <span className="w-14 text-center px-2 py-1 rounded-lg bg-[#FAF6F0] text-[10px] font-extrabold text-[#2F3A2E] shrink-0">
                            {DAY_NAMES[item.dayOfWeek - 1] || `Hari ${item.dayOfWeek}`}
                          </span>
                          <div className="min-w-0">
                            <p className="font-bold text-[#2F3A2E] truncate">{item.subjectName}</p>
                            <p className="text-[10px] text-[#636B60]">
                              {item.creditHours} SKS · {item.isPracticum ? "Praktikum (1.5x)" : "Teori (1.0x)"}
                              {item.isExamWeek ? " · Ujian (+3.0)" : ""}
                            </p>
                          </div>
                        </div>

                        <button
                          type="button"
                          onClick={() => handleDeleteSchedule(item)}
                          className="w-7 h-7 rounded-xl bg-white hover:bg-[#FEE2E2] text-[#636B60] hover:text-[#DC2626] border border-[#E8DDCF] hover:border-[#FCA5A5] flex items-center justify-center transition-colors shadow-2xs shrink-0 group/del"
                          title={`Hapus ${item.subjectName}`}
                          aria-label={`Hapus ${item.subjectName}`}
                        >
                          <Trash2 className="w-3.5 h-3.5 text-[#636B60] group-hover/del:text-[#DC2626] transition-colors" />
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

      {/* ========================================================
          6. AUTO-SLEEP INSPECTOR & PASSIVE WAKEUP SIMULATOR MODAL
          ======================================================== */}
      {isSleepModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-[#E8DDCF] space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-[#E8DDCF]">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-xl bg-[#E8DDCF] flex items-center justify-center text-[#2F3A2E] shadow-2xs">
                  <Moon className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-heading font-extrabold text-base text-[#2F3A2E]">
                      Deteksi Jam Tidur Otomatis
                    </h3>
                    <span
                      className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full border ${sleepClinicalMeta.badgeStyle}`}
                    >
                      {sleepClinicalMeta.label}
                    </span>
                  </div>
                  <p className="text-[11px] text-[#636B60]">
                    Inaktivitas Layar Malam &amp; Sensor OS PowerMonitor
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsSleepModalOpen(false)}
                className="w-8 h-8 rounded-full bg-[#FAF6F0] hover:bg-[#CFD8C4] text-[#2F3A2E] flex items-center justify-center transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Live Detection Breakdown */}
            <div className="rounded-2xl bg-[#FAF6F0] border border-[#E8DDCF] p-4 space-y-3">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-[#636B60] flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-[#2F3A2E]" />
                  Sumber Deteksi:
                </span>
                <span className="font-extrabold text-[#2F3A2E] bg-white px-2.5 py-0.5 rounded-full border border-[#E8DDCF]">
                  {getSleepSourceLabel(autoSleep.source)}
                </span>
              </div>

              <div className="grid grid-cols-3 gap-2 text-center">
                <div className="p-2.5 rounded-xl bg-white border border-[#E8DDCF]">
                  <span className="text-[10px] text-[#636B60] block">Terakhir Aktif Malam</span>
                  <strong className="font-mono font-extrabold text-sm text-[#2F3A2E]">
                    {autoSleep.bedTime}
                  </strong>
                </div>
                <div className="p-2.5 rounded-xl bg-white border border-[#E8DDCF]">
                  <span className="text-[10px] text-[#636B60] block">Pertama Aktif Pagi</span>
                  <strong className="font-mono font-extrabold text-sm text-[#2F3A2E]">
                    {autoSleep.wakeTime}
                  </strong>
                </div>
                <div className="p-2.5 rounded-xl bg-[#E8DDCF]/35 border border-[#CFD8C4]">
                  <span className="text-[10px] text-[#2F3A2E]/75 block">Tidur Bersih</span>
                  <strong className="font-heading font-extrabold text-sm text-[#2F3A2E]">
                    {autoSleep.sleepHours} Jam
                  </strong>
                </div>
              </div>

              <div className="flex items-center justify-between text-[11px] text-[#636B60] pt-1 border-t border-[#E8DDCF]">
                <span>
                  Jeda Inaktivitas: <strong>{autoSleep.rawInactiveHours}j</strong> (Latency{" "}
                  <strong>-{autoSleep.sleepLatencyMins}m</strong>)
                </span>
                <span>
                  Kontribusi Recovery: <strong className="text-[#2F3A2E]">+{autoSleep.recoveryPoints}/40 Poin</strong>
                </span>
              </div>
            </div>

            {/* 1-Click Preset Wakeup Simulations */}
            <div className="space-y-2">
              <p className="text-xs font-extrabold text-[#2F3A2E]">
                Uji Simulasi Deteksi Otomatis (1-Klik):
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => {
                    void autoSleepTracker.simulateSleepWindow(
                      "02:15",
                      "06:30",
                      "OVERNIGHT_INACTIVITY",
                      15
                    );
                  }}
                  className="p-2.5 rounded-xl bg-[#FAF6F0] hover:bg-[#FAF6F0] border border-[#CFD8C4] text-left transition-all cursor-pointer"
                >
                  <div className="text-[11px] font-extrabold text-[#2F3A2E]">
                    Begadang Tugas
                  </div>
                  <div className="text-[10px] font-mono text-[#2F3A2E] mt-0.5">
                    02:15 &rarr; 06:30 (4.0j)
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    void autoSleepTracker.simulateSleepWindow(
                      "00:30",
                      "06:30",
                      "OVERNIGHT_INACTIVITY",
                      15
                    );
                  }}
                  className="p-2.5 rounded-xl bg-[#FAF6F0] hover:bg-[#CFD8C4]/50 border border-[#E8DDCF] text-left transition-all cursor-pointer"
                >
                  <div className="text-[11px] font-extrabold text-[#2F3A2E]">
                    Defisit Ringan
                  </div>
                  <div className="text-[10px] font-mono text-[#2F3A2E] mt-0.5">
                    00:30 &rarr; 06:30 (5.8j)
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    void autoSleepTracker.simulateSleepWindow(
                      "23:00",
                      "06:45",
                      "OS_POWER_MONITOR",
                      15
                    );
                  }}
                  className="p-2.5 rounded-xl bg-[#FAF6F0] hover:bg-[#CFD8C4]/60 border border-[#CFD8C4] text-left transition-all cursor-pointer"
                >
                  <div className="text-[11px] font-extrabold text-[#2F3A2E]">
                    Tidur Optimal
                  </div>
                  <div className="text-[10px] font-mono text-[#2F3A2E] mt-0.5">
                    23:00 &rarr; 06:45 (7.5j)
                  </div>
                </button>
              </div>
            </div>

            {/* Custom Window Simulation / Correction */}
            <form
              onSubmit={(e) => {
                e.preventDefault();
                void autoSleepTracker.simulateSleepWindow(
                  customBedTime,
                  customWakeTime,
                  "OVERNIGHT_INACTIVITY",
                  customLatencyMins
                );
                setIsSleepModalOpen(false);
              }}
              className="space-y-3 pt-2 border-t border-[#E8DDCF]"
            >
              <p className="text-xs font-extrabold text-[#2F3A2E]">
                Kustomisasi Jendela Inaktivitas Malam:
              </p>
              <div className="grid grid-cols-3 gap-2.5">
                <div>
                  <label className="block text-[10px] font-bold text-[#636B60] mb-1">
                    Layar Mati (Malam)
                  </label>
                  <input
                    type="time"
                    value={customBedTime}
                    onChange={(e) => setCustomBedTime(e.target.value)}
                    className="w-full px-2.5 py-1.5 text-xs font-mono font-bold bg-[#FAF6F0] border border-[#E8DDCF] rounded-xl text-[#2F3A2E]"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-[#636B60] mb-1">
                    Layar Aktif (Pagi)
                  </label>
                  <input
                    type="time"
                    value={customWakeTime}
                    onChange={(e) => setCustomWakeTime(e.target.value)}
                    className="w-full px-2.5 py-1.5 text-xs font-mono font-bold bg-[#FAF6F0] border border-[#E8DDCF] rounded-xl text-[#2F3A2E]"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-[#636B60] mb-1">
                    Latency (Menit)
                  </label>
                  <input
                    type="number"
                    min={0}
                    max={120}
                    value={customLatencyMins}
                    onChange={(e) => setCustomLatencyMins(Math.max(0, Number(e.target.value) || 0))}
                    className="w-full px-2.5 py-1.5 text-xs font-mono font-bold bg-[#FAF6F0] border border-[#E8DDCF] rounded-xl text-[#2F3A2E]"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsSleepModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-[#636B60] hover:text-[#2F3A2E] transition-colors cursor-pointer"
                >
                  Tutup
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl text-xs font-extrabold bg-[#CFD8C4] hover:bg-[#BCC8AE] text-[#2F3A2E] border border-[#BCC8AE] flex items-center gap-1.5 transition-colors shadow-xs cursor-pointer"
                >
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Terapkan &amp; Sinkronkan</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
