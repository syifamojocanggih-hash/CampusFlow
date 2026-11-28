import React, { useState, useEffect } from "react";
import {
  Menu,
  X,
  GraduationCap,
  ArrowRight,
  Footprints,
  Bot,
  Eye,
  BookOpen,
  Mail,
  Phone,
  MapPin,
  Send,
  CheckCircle2,
  HelpCircle,
  LogIn,
  UserPlus,
} from "lucide-react";
import { AuthModal } from "@/components/auth/AuthModal";
import type { UserProfileDTO } from "@/types";

interface LandingPageProps {
  onEnterApp: () => void;
  onLoginSuccess?: (user: UserProfileDTO) => void;
}

type LandingNav = "home" | "courses" | "about" | "contact";

export const LandingPage: React.FC<LandingPageProps> = ({ onEnterApp, onLoginSuccess }) => {
  const [activeNav, setActiveNav] = useState<LandingNav>("home");
  const [activeSlide, setActiveSlide] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [touchStartX, setTouchStartX] = useState<number | null>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Sign in / Sign up Modal State
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [authInitialTab, setAuthInitialTab] = useState<"login" | "register">("login");

  const handleOpenAuth = (defaultTab: "login" | "register" = "login") => {
    setAuthInitialTab(defaultTab);
    setIsAuthModalOpen(true);
  };

  const handleAuthSuccess = (user: UserProfileDTO) => {
    setIsAuthModalOpen(false);
    if (onLoginSuccess) {
      onLoginSuccess(user);
    } else {
      onEnterApp();
    }
  };

  // Contact form state
  const [contactName, setContactName] = useState("");
  const [contactEmail, setContactEmail] = useState("");
  const [contactCategory, setContactCategory] = useState("Dukungan Teknis & Sensor");
  const [contactMessage, setContactMessage] = useState("");
  const [contactSubmitted, setContactSubmitted] = useState(false);

  // Active FAQ in Contact section
  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(null);

  const headlines = [
    {
      subtitle: "Academic Strava & Predictive Burnout Management",
      titleLine1: "Keseimbangan Hidup",
      titleLine2: "Beban Belajar & Layar",
      description:
        "Platform terpadu berbasis Fusi Prediktif Beban Akademik KRS, Waktu Layar Pasif, Zero Continuous Camera (2 Menit), dan AI Coach Proaktif.",
    },
    {
      subtitle: "Zero Continuous Camera (Privasi 100%)",
      titleLine1: "Kamera Default OFF",
      titleLine2: "Fokus Belajar Tenang",
      description:
        "Waktu belajar dilacak pasif via Page Visibility API peramban. Kamera HANYA menyala maksimal 2 menit saat tombol Active Break ditekan untuk validasi pose.",
    },
    {
      subtitle: "Fusi Parameter Tunggal (0–100)",
      titleLine1: "Burnout Risk Index",
      titleLine2: "Metrik Strava Akademik",
      description:
        "Menyeimbangkan beban SKS & layar dengan jam tidur dan jeda aktif terverifikasi: Hijau (<40 Optimal), Kuning (40–75 Waspada), Merah (>75 Risiko Tinggi).",
    },
  ];

  // Auto-play interval slider for Hero section
  useEffect(() => {
    if (isPaused) return;

    const timer = setInterval(() => {
      setActiveSlide((prev) => (prev + 1) % headlines.length);
    }, 4000);

    return () => clearInterval(timer);
  }, [isPaused, headlines.length]);

  // ScrollSpy with IntersectionObserver to automatically update activeNav when scrolling
  useEffect(() => {
    const sections: LandingNav[] = ["home", "courses", "about", "contact"];
    const observerOptions = {
      root: null,
      rootMargin: "-25% 0px -55% 0px",
      threshold: 0,
    };

    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          setActiveNav(entry.target.id as LandingNav);
        }
      });
    }, observerOptions);

    sections.forEach((id) => {
      const el = document.getElementById(id);
      if (el) observer.observe(el);
    });

    return () => observer.disconnect();
  }, []);

  const scrollToSection = (id: LandingNav) => {
    setActiveNav(id);
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    setIsPaused(true);
    setTouchStartX(e.touches[0].clientX);
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    setIsPaused(false);
    if (touchStartX === null) return;
    const touchEndX = e.changedTouches[0].clientX;
    const diff = touchStartX - touchEndX;

    if (diff > 45) {
      setActiveSlide((prev) => (prev + 1) % headlines.length);
    } else if (diff < -45) {
      setActiveSlide((prev) => (prev - 1 + headlines.length) % headlines.length);
    }
    setTouchStartX(null);
  };

  const handleContactSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setContactSubmitted(true);
    setTimeout(() => {
      setContactName("");
      setContactEmail("");
      setContactMessage("");
    }, 500);
  };

  const coursesData = [
    {
      id: "c1",
      category: "akademik",
      cardBg: "bg-[#FAF6F0] border-[#CFD8C4] hover:border-[#CFD8C4]",
      iconBg: "bg-[#CFD8C4] text-[#2F3A2E] border border-[#BCC8AE]",
      icon: <BookOpen className="w-5 h-5" />,
      title: "Smart Academic Planner (PDF KRS Parser)",
      description:
        "Ekstraksi jadwal perkuliahan, bobot SKS, jenis kelas teori vs praktikum, dan pekan ujian untuk prediksi beban kognitif otomatis setiap harinya.",
    },
    {
      id: "c2",
      category: "layar",
      cardBg: "bg-[#FAF6F0] border-[#CFD8C4] hover:border-[#CFD8C4]",
      iconBg: "bg-[#CFD8C4] text-[#2F3A2E] border border-[#BCC8AE]",
      icon: <Eye className="w-5 h-5" />,
      title: "Cross-Device Screen Time & Zero Continuous Camera",
      description:
        "Pelacakan durasi fokus layar secara pasif menggunakan Page Visibility API tanpa menyalakan webcam. Kamera tetap mati 100% saat Anda belajar.",
    },
    {
      id: "c3",
      category: "jeda",
      cardBg: "bg-[#FAF6F0] border-[#E8DDCF] hover:border-[#E8DDCF]",
      iconBg: "bg-[#CFD8C4] text-[#2F3A2E] border border-[#BCC8AE]",
      icon: <Footprints className="w-5 h-5" />,
      title: "On-Demand Active Break Validator (MediaPipe 2 Menit)",
      description:
        "Verifikasi gerakan peregangan overhead reach dan beranjak dari kursi selama 2 menit. Menambah +10 poin pemulihan dan kamera langsung mati otomatis.",
    },
    {
      id: "c4",
      category: "ai",
      cardBg: "bg-[#FAF6F0] border-[#CFD8C4] hover:border-[#E8DDCF]",
      iconBg: "bg-[#CFD8C4] text-[#2F3A2E] border border-[#BCC8AE]",
      icon: <Bot className="w-5 h-5" />,
      title: "Wellbeing AI Coach & Konsultasi Stres Proaktif",
      description:
        "Mesin inferensi lokal Ollama untuk konsultasi keluhan kelelahan fisik, rekomendasi peregangan esok hari, dan safety guardrail krisis darurat 119.",
    },
  ];

  const faqs = [
    {
      q: "Apakah kamera laptop menyala terus-menerus saat saya belajar?",
      a: "Sama sekali tidak! CampusFlow v4.0 menerapkan prinsip Zero Continuous Camera. Kamera Anda default OFF saat belajar. Kamera HANYA menyala maksimal 2 menit saat Anda menekan tombol Active Break untuk memvalidasi gerakan peregangan, lalu langsung mati otomatis.",
    },
    {
      q: "Bagaimana cara kerja penghitungan Burnout Risk Index (0–100)?",
      a: "CampusFlow menggabungkan faktor beban (Academic Load dari SKS KRS + kelebihan jam layar di atas 8 jam) dikurangi faktor pemulihan (durasi tidur + bonus 10 poin per sesi Active Break) berdasarkan kaidah saintifik Effort-Recovery Model.",
    },
    {
      q: "Apakah data percakapan AI Coach dan video kamera diunggah ke internet?",
      a: "Tidak pernah. Pemrosesan landmark pose 2 menit berjalan 100% lokal di memori peramban via WebGL/WASM tanpa satu frame video pun diunggah. AI Coach didukung oleh mesin AI lokal (Ollama) yang menjaga kerahasiaan data mahasiswa.",
    },
  ];

  return (
    <div className="min-h-screen bg-white font-sans scroll-smooth flex flex-col">
      {/* ========================================================
          TOP NAVIGATION BAR (FIXED AT THE VERY TOP OF SCREEN)
          ======================================================== */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-[#FAF6F0]/95 backdrop-blur-md border-b border-[#E8DDCF] shadow-xs">
        <div className="max-w-6xl mx-auto px-4 sm:px-8 py-3.5 flex items-center justify-between">
          {/* Left Brand & Mobile Menu Toggle */}
          <div className="flex items-center gap-3 sm:gap-4">
            <button
              onClick={() => setMobileMenuOpen((prev) => !prev)}
              className="md:hidden p-2 rounded-xl hover:bg-white/80 text-[#2F3A2E] transition-colors focus:outline-none"
              title="Menu Navigasi"
              aria-label="Toggle menu navigasi"
              aria-expanded={mobileMenuOpen}
            >
              {mobileMenuOpen ? (
                <X className="w-5 h-5 stroke-[2.5]" />
              ) : (
                <Menu className="w-5 h-5 stroke-[2.5]" />
              )}
            </button>
            <div
              onClick={() => scrollToSection("home")}
              className="flex items-center gap-2.5 cursor-pointer select-none"
            >
              <div className="w-9 h-9 rounded-2xl bg-[#CFD8C4] border border-[#BCC8AE] flex items-center justify-center text-[#2F3A2E] shadow-xs">
                <GraduationCap className="w-5 h-5" />
              </div>
              <span className="font-heading font-extrabold text-lg text-[#2F3A2E] tracking-tight">
                CampusFlow
              </span>
            </div>
          </div>

          {/* Center Links (Desktop Smooth Scrolling Nav Tabs) */}
          <nav className="hidden md:flex items-center gap-2 text-xs font-bold tracking-wider">
            {(["home", "courses", "about", "contact"] as const).map((navKey) => {
              const isActive = activeNav === navKey;
              return (
                <button
                  key={navKey}
                  onClick={() => scrollToSection(navKey)}
                  className={`px-4 py-1.5 rounded-full uppercase transition-all duration-200 ${
                    isActive
                      ? "bg-[#CFD8C4] text-[#2F3A2E] border border-[#BCC8AE] font-extrabold shadow-xs scale-105"
                      : "text-[#636B60] hover:text-[#2F3A2E] hover:bg-white/80"
                  }`}
                >
                  {navKey}
                </button>
              );
            })}
          </nav>

          {/* Right Action Button: Masuk (Login) */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => handleOpenAuth("login")}
              className="px-3.5 py-1.5 rounded-full text-xs font-bold text-[#2F3A2E] hover:bg-white/80 transition-colors border border-transparent hover:border-[#E8DDCF] active:scale-95 flex items-center gap-1.5"
              title="Masuk ke Akun Mahasiswa"
            >
              <LogIn className="w-3.5 h-3.5 text-[#2F3A2E]" />
              <span>Masuk</span>
            </button>
          </div>
        </div>
      </header>

      {/* Mobile Navigation Dropdown (Fixed under top navbar) */}
      {mobileMenuOpen && (
        <div className="md:hidden fixed top-[61px] left-0 right-0 z-40 px-4 py-3 bg-[#FAF6F0]/98 backdrop-blur-md border-b border-[#E8DDCF] shadow-md transition-all animate-in fade-in slide-in-from-top-2 duration-150">
          <nav className="flex flex-col gap-1 text-xs font-bold tracking-wider text-[#2F3A2E] max-w-6xl mx-auto">
            {(["home", "courses", "about", "contact"] as const).map((navKey) => {
              const isActive = activeNav === navKey;
              return (
                <button
                  key={navKey}
                  onClick={() => {
                    scrollToSection(navKey);
                    setMobileMenuOpen(false);
                  }}
                  className={`py-2 px-3 rounded-xl text-left uppercase transition-colors ${
                    isActive
                      ? "bg-[#CFD8C4] text-[#2F3A2E] font-extrabold border border-[#BCC8AE]"
                      : "text-[#636B60] hover:text-[#2F3A2E] hover:bg-white/80"
                  }`}
                >
                  {navKey}
                </button>
              );
            })}
            <div className="pt-2 mt-1 border-t border-[#E8DDCF] flex flex-col gap-2">
              <button
                onClick={() => {
                  setMobileMenuOpen(false);
                  handleOpenAuth("login");
                }}
                className="w-full py-2.5 px-3 rounded-xl bg-white hover:bg-white/90 text-[#2F3A2E] font-bold text-center text-xs flex items-center justify-center gap-2 border border-[#E8DDCF] shadow-xs active:scale-95"
              >
                <LogIn className="w-3.5 h-3.5 text-[#2F3A2E]" />
                <span>Masuk (Login)</span>
              </button>
              <button
                onClick={() => {
                  setMobileMenuOpen(false);
                  handleOpenAuth("register");
                }}
                className="w-full py-2.5 px-3 rounded-xl bg-[#CFD8C4] hover:bg-[#BCC8AE] text-[#2F3A2E] border border-[#BCC8AE] font-bold text-center text-xs flex items-center justify-center gap-2 shadow-xs active:scale-95 cursor-pointer"
              >
                <UserPlus className="w-3.5 h-3.5" />
                <span>Daftar Akun (Register)</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </nav>
        </div>
      )}

      {/* Main Content Area (Full width with pt-16 sm:pt-20 to clear fixed navbar) */}
      <main className="w-full pt-16 sm:pt-20 flex-1 flex flex-col">
        {/* Main Single Continuous Flowing Page Container */}
        <div className="w-full max-w-6xl mx-auto flex flex-col flex-1">

        {/* ========================================================
            1. HOME / HERO SECTION
            ======================================================== */}
        <section
          id="home"
          className="scroll-mt-24 px-6 sm:px-12 py-10 lg:py-16 grid grid-cols-1 lg:grid-cols-12 gap-8 items-center border-b border-[#E8DDCF]"
        >
          {/* LEFT COLUMN: Hero Copy Animated Slider */}
          <div className="lg:col-span-6 space-y-6 sm:space-y-8 z-10 w-full overflow-hidden">
            <div
              className="relative overflow-hidden w-full select-none cursor-grab active:cursor-grabbing"
              onMouseEnter={() => setIsPaused(true)}
              onMouseLeave={() => setIsPaused(false)}
              onTouchStart={handleTouchStart}
              onTouchEnd={handleTouchEnd}
              role="region"
              aria-label="Carousel Judul Fitur Utama"
            >
              <div
                className="flex transition-transform duration-700 ease-in-out"
                style={{ transform: `translateX(-${activeSlide * 100}%)` }}
              >
                {headlines.map((item, index) => (
                  <div
                    key={index}
                    className={`w-full shrink-0 transition-opacity duration-700 ${
                      activeSlide === index ? "opacity-100" : "opacity-25"
                    }`}
                    aria-hidden={activeSlide !== index}
                  >
                    <span className="text-xs font-bold tracking-wider text-[#636B60] uppercase block">
                      {item.subtitle}
                    </span>

                    <h1 className="font-heading font-extrabold text-4xl sm:text-5xl lg:text-[3.4rem] text-[#2F3A2E] leading-[1.12] mt-2 tracking-tight">
                      {item.titleLine1} <br />
                      <span className="text-[#2F3A2E]">{item.titleLine2}</span>
                    </h1>

                    <p className="text-xs sm:text-sm text-[#636B60] font-medium mt-3 max-w-md leading-relaxed">
                      {item.description}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            {/* Feature Pills / Quick Entry */}
            <div className="flex flex-wrap items-center gap-2 pt-2 text-[11px] font-bold text-[#2F3A2E]">
              <button
                onClick={() => scrollToSection("about")}
                className="px-3.5 py-2 rounded-full bg-[#CFD8C4] hover:bg-[#BCC8AE] active:bg-[#BCC8AE] text-[#2F3A2E] border border-[#BCC8AE] transition-colors active:scale-95 flex items-center gap-1.5 shadow-xs cursor-pointer"
              >
                <Eye className="w-3.5 h-3.5" /> Zero Continuous Camera
              </button>
              <button
                onClick={() => scrollToSection("courses")}
                className="px-3.5 py-2 rounded-full bg-[#CFD8C4] hover:bg-[#BCC8AE] active:bg-[#BCC8AE] text-[#2F3A2E] border border-[#BCC8AE] transition-colors active:scale-95 flex items-center gap-1.5 shadow-xs cursor-pointer"
              >
                <BookOpen className="w-3.5 h-3.5" /> Strava Akademik (KRS)
              </button>
              <button
                onClick={() => scrollToSection("courses")}
                className="px-3.5 py-2 rounded-full bg-[#CFD8C4] hover:bg-[#BCC8AE] active:bg-[#BCC8AE] text-[#2F3A2E] border border-[#BCC8AE] transition-colors active:scale-95 flex items-center gap-1.5 shadow-xs cursor-pointer"
              >
                <Bot className="w-3.5 h-3.5" /> Wellbeing AI Coach
              </button>
            </div>
          </div>

          {/* RIGHT COLUMN: Brain Study Laptop Illustration */}
          <div className="lg:col-span-6 flex flex-col items-center justify-center relative">
            <div className="relative w-full flex items-center justify-center">
              <img
                src="/images/brain_study_landing.jpg"
                alt="Start learning with healthy mind illustration"
                className="w-full max-w-md lg:max-w-lg object-contain rounded-3xl drop-shadow-lg"
              />
            </div>
          </div>
        </section>

        {/* ========================================================
            2. COURSES SECTION
            ======================================================== */}
        <section
          id="courses"
          className="scroll-mt-24 px-6 sm:px-12 py-12 lg:py-16 space-y-8 border-b border-[#E8DDCF]"
        >
          {/* Header Title */}
          <div className="pb-2 border-b border-[#E8DDCF]">
            <div>
              <span className="text-[11px] font-extrabold uppercase tracking-wider text-[#636B60] flex items-center gap-1.5">
                <BookOpen className="w-3.5 h-3.5 text-[#2F3A2E]" />
                Kurikulum Wellbeing &amp; Ergonomi Kampus
              </span>
              <h2 className="font-heading font-extrabold text-2xl sm:text-3xl text-[#2F3A2E] mt-1">
                Katalog Modul Pembelajaran
              </h2>
              <p className="text-xs text-[#636B60] max-w-xl mt-1">
                Dirancang oleh praktisi ergonomi &amp; kedokteran olahraga untuk mendukung mahasiswa belajar produktif tanpa nyeri otot, kelelahan mata, dan burnout.
              </p>
            </div>
          </div>

          {/* Course Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {coursesData.map((c) => (
              <div
                key={c.id}
                className={`p-6 sm:p-7 rounded-3xl border transition-all flex flex-col justify-between shadow-xs ${c.cardBg}`}
              >
                <div className="space-y-3">
                  <div
                    className={`w-11 h-11 rounded-2xl flex items-center justify-center shadow-xs border border-white/60 ${c.iconBg}`}
                  >
                    {c.icon}
                  </div>

                  <h3 className="font-heading font-extrabold text-base text-[#2F3A2E]">
                    {c.title}
                  </h3>

                  <p className="text-xs text-[#2F3A2E]/70 leading-relaxed font-medium">
                    {c.description}
                  </p>
                </div>

                <div className="pt-4 mt-5 border-t border-black/5 flex items-center justify-end">
                  <button
                    onClick={() => handleOpenAuth("register")}
                    className="px-4 py-2 rounded-full bg-white hover:bg-[#CFD8C4] hover:text-[#2F3A2E] text-[#2F3A2E] font-bold text-xs transition-colors active:scale-95 flex items-center gap-1.5 border border-black/10 shadow-xs group/btn"
                  >
                    <span>Ikuti Modul</span>
                    <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover/btn:translate-x-0.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* ========================================================
            3. ABOUT SECTION
            ======================================================== */}
        <section
          id="about"
          className="scroll-mt-24 px-6 sm:px-12 py-12 lg:py-16 space-y-8 border-b border-[#E8DDCF]"
        >
          {/* Header */}
          <div className="text-center max-w-2xl mx-auto space-y-2.5">
            <span className="text-[11px] font-extrabold uppercase tracking-wider text-[#636B60]">
              Tiga Pilar Utama CampusFlow Versi 4.0
            </span>
            <h2 className="font-heading font-extrabold text-2xl sm:text-3xl text-[#2F3A2E]">
              Academic Strava &amp; Predictive Burnout Management
            </h2>
            <p className="text-xs text-[#636B60] leading-relaxed">
              Keseimbangan sistemik antara Beban Akademik (Academic Load), Waktu Layar (Screen Time), dan Waktu Pemulihan (Tidur &amp; Jeda Aktif) untuk mencegah academic burnout mahasiswa.
            </p>
          </div>

          {/* 3 Pillars Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5 pt-2">
            <div className="p-6 rounded-3xl bg-[#FAF6F0] border border-[#E8DDCF] space-y-3">
              <div className="w-10 h-10 rounded-2xl bg-[#CFD8C4] border border-[#BCC8AE] flex items-center justify-center text-[#2F3A2E] shadow-xs">
                <Eye className="w-5 h-5" />
              </div>
              <h3 className="font-heading font-extrabold text-sm text-[#2F3A2E]">
                1. Zero Continuous Camera
              </h3>
              <p className="text-xs text-[#636B60] leading-relaxed">
                Kamera laptop default OFF saat belajar. Kamera HANYA menyala MAKSIMAL 2 MENIT saat tombol &apos;Active Break&apos; ditekan untuk validasi pose peregangan.
              </p>
            </div>

            <div className="p-6 rounded-3xl bg-[#FAF6F0] border border-[#E8DDCF] space-y-3">
              <div className="w-10 h-10 rounded-2xl bg-[#CFD8C4] border border-[#BCC8AE] flex items-center justify-center text-[#2F3A2E] shadow-xs">
                <BookOpen className="w-5 h-5" />
              </div>
              <h3 className="font-heading font-extrabold text-sm text-[#2F3A2E]">
                2. Konsep &apos;Strava Akademik&apos; &amp; Fusi Parameter
              </h3>
              <p className="text-xs text-[#636B60] leading-relaxed">
                Stres dihitung dari fusi 4 variabel harian: Jam Tidur, Layar, Jeda Aktif, dan Academic Load (KRS). Menghasilkan satu metrik intuitif Burnout Risk Index (0–100).
              </p>
            </div>

            <div className="p-6 rounded-3xl bg-[#FAF6F0] border border-[#E8DDCF] space-y-3">
              <div className="w-10 h-10 rounded-2xl bg-[#CFD8C4] border border-[#BCC8AE] flex items-center justify-center text-[#2F3A2E] shadow-xs">
                <Bot className="w-5 h-5" />
              </div>
              <h3 className="font-heading font-extrabold text-sm text-[#2F3A2E]">
                3. Proactive AI Coaching
              </h3>
              <p className="text-xs text-[#636B60] leading-relaxed">
                AI Coach mendampingi mahasiswa secara terstruktur: menganalisis keluhan fisik, mitigasi krisis darurat (119), dan rekomendasi preventif esok hari berbasis mesin lokal Ollama.
              </p>
            </div>
          </div>
        </section>

        {/* ========================================================
            4. CONTACT SECTION
            ======================================================== */}
        <section
          id="contact"
          className="scroll-mt-24 px-6 sm:px-12 py-12 lg:py-16 space-y-8"
        >
          {/* Header */}
          <div className="pb-2 border-b border-[#E8DDCF]">
            <h2 className="font-heading font-extrabold text-2xl sm:text-3xl text-[#2F3A2E]">
              Hubungi Tim CampusFlow
            </h2>
            <p className="text-xs text-[#636B60] max-w-xl mt-1">
              Punya pertanyaan seputar integrasi sistem di kampus, kendala sensor, atau ingin berkolaborasi riset ergonomi? Kami siap membantu.
            </p>
          </div>

          {/* Grid: Form & Info */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-stretch">
            {/* Left: Contact Form */}
            <div className="p-6 sm:p-7 rounded-3xl bg-white border border-[#E8DDCF] shadow-xs flex flex-col justify-between space-y-4">
              <div>
                <h3 className="font-heading font-extrabold text-base text-[#2F3A2E]">
                  Kirim Pesan / Pengaduan
                </h3>
                <p className="text-xs text-[#636B60] mt-0.5">
                  Sampaikan kendala teknis atau pertanyaan Anda langsung ke tim pengembang.
                </p>
              </div>

              {contactSubmitted ? (
                <div className="p-6 rounded-2xl bg-[#FAF6F0] border border-[#CFD8C4] text-center space-y-2 animate-in zoom-in-95 my-auto">
                  <div className="w-12 h-12 rounded-full bg-[#CFD8C4] border border-[#BCC8AE] text-[#2F3A2E] flex items-center justify-center mx-auto">
                    <CheckCircle2 className="w-6 h-6" />
                  </div>
                  <h4 className="font-heading font-extrabold text-sm text-[#2F3A2E]">
                    Pesan Berhasil Terkirim!
                  </h4>
                  <p className="text-xs text-[#636B60]">
                    Terima kasih, tim dukungan CampusFlow akan merespons melalui email dalam waktu 1x24 jam kerja.
                  </p>
                  <button
                    onClick={() => setContactSubmitted(false)}
                    className="mt-3 px-4 py-1.5 rounded-full text-xs font-bold bg-[#CFD8C4] text-[#2F3A2E] transition-transform active:scale-95"
                  >
                    Kirim Pesan Lain
                  </button>
                </div>
              ) : (
                <form onSubmit={handleContactSubmit} className="space-y-3.5 flex-1 flex flex-col justify-between">
                  <div className="space-y-3">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[11px] font-bold text-[#2F3A2E] mb-1">
                          Nama Lengkap
                        </label>
                        <input
                          type="text"
                          required
                          value={contactName}
                          onChange={(e) => setContactName(e.target.value)}
                          placeholder="Mutiara Dewanda"
                          className="w-full px-3.5 py-2 text-xs bg-[#FAF6F0] border border-[#E8DDCF] rounded-xl text-[#2F3A2E] focus:outline-none focus:border-[#CFD8C4] focus:bg-white transition-all"
                        />
                      </div>

                      <div>
                        <label className="block text-[11px] font-bold text-[#2F3A2E] mb-1">
                          Email Kampus / Personal
                        </label>
                        <input
                          type="email"
                          required
                          value={contactEmail}
                          onChange={(e) => setContactEmail(e.target.value)}
                          placeholder="nama@kampus.ac.id"
                          className="w-full px-3.5 py-2 text-xs bg-[#FAF6F0] border border-[#E8DDCF] rounded-xl text-[#2F3A2E] focus:outline-none focus:border-[#CFD8C4] focus:bg-white transition-all"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-[#2F3A2E] mb-1">
                        Kategori Pertanyaan
                      </label>
                      <select
                        value={contactCategory}
                        onChange={(e) => setContactCategory(e.target.value)}
                        className="w-full px-3.5 py-2 text-xs bg-[#FAF6F0] border border-[#E8DDCF] rounded-xl text-[#2F3A2E] focus:outline-none focus:border-[#CFD8C4] focus:bg-white transition-all"
                      >
                        <option>Dukungan Teknis &amp; Sensor</option>
                        <option>Integrasi LMS / SSO Kampus</option>
                        <option>Konsultasi Ergonomi &amp; Modul</option>
                        <option>Kritik &amp; Saran Pengembangan</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-[#2F3A2E] mb-1">
                        Pesan / Uraian Masalah
                      </label>
                      <textarea
                        rows={4}
                        required
                        value={contactMessage}
                        onChange={(e) => setContactMessage(e.target.value)}
                        placeholder="Jelaskan kebutuhan atau kendala yang Anda hadapi..."
                        className="w-full px-3.5 py-2 text-xs bg-[#FAF6F0] border border-[#E8DDCF] rounded-xl text-[#2F3A2E] focus:outline-none focus:border-[#CFD8C4] focus:bg-white transition-all resize-none"
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    className="w-full py-2.5 rounded-xl bg-[#CFD8C4] hover:bg-[#BCC8AE] active:bg-[#ADC09E] text-[#2F3A2E] font-bold text-xs transition-transform active:scale-95 shadow-xs border border-[#BCC8AE] flex items-center justify-center gap-1.5 mt-2 cursor-pointer"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>Kirim Pesan Sekarang</span>
                  </button>
                </form>
              )}
            </div>

            {/* Right: Channels & FAQ Combined Card */}
            <div className="p-6 sm:p-7 rounded-3xl bg-white border border-[#E8DDCF] shadow-xs flex flex-col justify-between space-y-5">
              {/* Saluran Dukungan Resmi */}
              <div className="space-y-3">
                <div>
                  <h3 className="font-heading font-extrabold text-base text-[#2F3A2E]">
                    Saluran Dukungan Resmi
                  </h3>
                  <p className="text-xs text-[#636B60] mt-0.5">
                    Layanan komunikasi langsung dengan tim pengembang dan praktisi.
                  </p>
                </div>

                <div className="grid grid-cols-1 gap-2.5 text-xs pt-1">
                  <div className="flex items-center gap-3 p-2.5 rounded-2xl bg-[#FAF6F0] border border-[#E8DDCF]">
                    <div className="w-8 h-8 rounded-xl bg-[#CFD8C4] border border-[#BCC8AE] flex items-center justify-center text-[#2F3A2E] shrink-0 shadow-2xs">
                      <Mail className="w-4 h-4 text-[#2F3A2E]" />
                    </div>
                    <div>
                      <span className="font-bold text-[#2F3A2E] block text-[11px]">Email Dukungan</span>
                      <span className="text-[#636B60] text-[11px]">support@campusflow.id</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 p-2.5 rounded-2xl bg-[#FAF6F0] border border-[#E8DDCF]">
                    <div className="w-8 h-8 rounded-xl bg-[#CFD8C4] border border-[#BCC8AE] flex items-center justify-center text-[#2F3A2E] shrink-0 shadow-2xs">
                      <Phone className="w-4 h-4 text-[#2F3A2E]" />
                    </div>
                    <div>
                      <span className="font-bold text-[#2F3A2E] block text-[11px]">Hotline Mahasiswa</span>
                      <span className="text-[#636B60] text-[11px]">+62 (021) 500-FLOW</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 p-2.5 rounded-2xl bg-[#FAF6F0] border border-[#E8DDCF]">
                    <div className="w-8 h-8 rounded-xl bg-[#CFD8C4] border border-[#BCC8AE] flex items-center justify-center text-[#2F3A2E] shrink-0 shadow-2xs">
                      <MapPin className="w-4 h-4 text-[#2F3A2E]" />
                    </div>
                    <div>
                      <span className="font-bold text-[#2F3A2E] block text-[11px]">Laboratorium Riset</span>
                      <span className="text-[#636B60] text-[11px]">Gedung Smart Wellbeing Kampus Terpadu</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Divider */}
              <div className="border-t border-[#E8DDCF]" />

              {/* Accordion FAQ */}
              <div className="space-y-2.5">
                <div className="flex items-center gap-1.5">
                  <HelpCircle className="w-4 h-4 text-[#2F3A2E]" />
                  <h4 className="font-heading font-extrabold text-xs text-[#2F3A2E]">
                    Pertanyaan Umum (FAQ)
                  </h4>
                </div>

                <div className="space-y-2">
                  {faqs.map((faq, idx) => (
                    <div
                      key={idx}
                      className="rounded-2xl bg-[#FAF6F0] border border-[#E8DDCF] p-3 transition-colors"
                    >
                      <button
                        type="button"
                        onClick={() =>
                          setOpenFaqIndex(openFaqIndex === idx ? null : idx)
                        }
                        className="w-full text-left font-bold text-[11px] text-[#2F3A2E] flex items-center justify-between gap-2"
                      >
                        <span>{faq.q}</span>
                        <span className="text-[#636B60] text-xs font-mono">
                          {openFaqIndex === idx ? "−" : "+"}
                        </span>
                      </button>
                      {openFaqIndex === idx && (
                        <p className="text-[10px] text-[#636B60] mt-2 leading-relaxed pt-1.5 border-t border-[#E8DDCF]">
                          {faq.a}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>

        </div>
      </main>

      {/* Sign In & Sign Up Modal */}
      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        onSuccess={handleAuthSuccess}
        defaultTab={authInitialTab}
      />
    </div>
  );
};
