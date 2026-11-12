import React, { useState, useEffect } from "react";
import {
  Menu,
  X,
  GraduationCap,
  ArrowRight,
  Footprints,
  Bot,
  Eye,
} from "lucide-react";

interface LandingPageProps {
  onEnterApp: () => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({ onEnterApp }) => {
  const [activeSlide, setActiveSlide] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [touchStartX, setTouchStartX] = useState<number | null>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const headlines = [
    {
      subtitle: "Online education & Active Wellbeing",
      titleLine1: "Start learning",
      titleLine2: "at home & campus",
      description: "Platform terpadu pemantau postur tegak, pelacak langkah inersia, dan manajemen stres mahasiswa berbasis AI.",
    },
    {
      subtitle: "Zero Video Upload & Edge AI",
      titleLine1: "Posture Guard",
      titleLine2: "MediaPipe 33 Landmark",
      description: "Deteksi slouching & eye-strain langsung di browser 100% lokal tanpa mengunggah video ke internet.",
    },
    {
      subtitle: "IPAQ-SF Real-Time Met-Minutes",
      titleLine1: "Smart Pedometer",
      titleLine2: "Keep moving everyday",
      description: "Filter gravitasi akselerometer 3-sumbu smartphone untuk mencatat cadence dan aktivitas fisik harian.",
    },
  ];

  // Auto-play interval slider
  useEffect(() => {
    if (isPaused) return;

    const timer = setInterval(() => {
      setActiveSlide((prev) => (prev + 1) % headlines.length);
    }, 4000);

    return () => clearInterval(timer);
  }, [isPaused, headlines.length]);

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
      // Geser ke kiri -> slide berikutnya
      setActiveSlide((prev) => (prev + 1) % headlines.length);
    } else if (diff < -45) {
      // Geser ke kanan -> slide sebelumnya
      setActiveSlide((prev) => (prev - 1 + headlines.length) % headlines.length);
    }
    setTouchStartX(null);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#8ED6DB] via-[#A6E1E6] to-[#CDE8B5] p-3 sm:p-6 lg:p-10 flex items-center justify-center font-sans">
      {/* Main White Desktop Mockup Window (Matching Reference Image) */}
      <div className="bg-white rounded-[2.5rem] shadow-2xl w-full max-w-6xl mx-auto overflow-hidden border border-white/60 relative flex flex-col justify-between min-h-[620px] lg:min-h-[680px]">
        
        {/* ========================================================
            TOP NAVIGATION BAR
            ======================================================== */}
        <header className="px-6 sm:px-10 py-6 flex items-center justify-between border-b border-[#F6F6F6] relative">
          {/* Left Brand & Mobile Menu Toggle */}
          <div className="flex items-center gap-3 sm:gap-4">
            <button
              onClick={() => setMobileMenuOpen((prev) => !prev)}
              className="md:hidden p-2 rounded-xl hover:bg-[#F6F6F6] text-[#1A1A1A] transition-colors focus:outline-none"
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
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-2xl bg-[#BDE6F0] flex items-center justify-center text-[#1A1A1A] shadow-xs">
                <GraduationCap className="w-5 h-5" />
              </div>
              <span className="font-heading font-extrabold text-lg text-[#1A1A1A] tracking-tight">
                CampusFlow
              </span>
            </div>
          </div>

          {/* Center Links (Desktop) */}
          <nav className="hidden md:flex items-center gap-8 text-xs font-bold tracking-wider text-[#9A9A9A]">
            <a href="#home" className="text-[#1A1A1A] hover:text-[#1A1A1A] transition-colors">
              HOME
            </a>
            <a href="#courses" className="hover:text-[#1A1A1A] transition-colors">
              COURSES
            </a>
            <a href="#about" className="hover:text-[#1A1A1A] transition-colors">
              ABOUT
            </a>
            <a href="#contact" className="hover:text-[#1A1A1A] transition-colors">
              CONTACT
            </a>
          </nav>

          {/* Right Action Button (Compact green background) */}
          <div className="flex items-center gap-2">
            <button
              onClick={onEnterApp}
              className="px-3 sm:px-4 py-1.5 rounded-full text-[11px] sm:text-xs font-bold whitespace-nowrap bg-[#CDE8B5] hover:bg-[#B6DF97] text-[#1A1A1A] transition-all shadow-xs border border-[#B6DF97] hover:scale-105 active:scale-95 shrink-0"
            >
              Sign up / Masuk
            </button>
          </div>
        </header>

        {/* Mobile Navigation Dropdown (Compact) */}
        {mobileMenuOpen && (
          <div className="md:hidden px-4 py-2 bg-[#F6F6F6] border-b border-[#E8E8E8] transition-all animate-in fade-in slide-in-from-top-2 duration-150">
            <nav className="flex flex-col gap-0.5 text-[11px] font-bold tracking-wider text-[#1A1A1A]">
              <a
                href="#home"
                onClick={() => setMobileMenuOpen(false)}
                className="py-1.5 px-3 rounded-lg hover:bg-white text-[#1A1A1A] transition-colors"
              >
                HOME
              </a>
              <a
                href="#courses"
                onClick={() => setMobileMenuOpen(false)}
                className="py-1.5 px-3 rounded-lg hover:bg-white text-[#9A9A9A] hover:text-[#1A1A1A] transition-colors"
              >
                COURSES
              </a>
              <a
                href="#about"
                onClick={() => setMobileMenuOpen(false)}
                className="py-1.5 px-3 rounded-lg hover:bg-white text-[#9A9A9A] hover:text-[#1A1A1A] transition-colors"
              >
                ABOUT
              </a>
              <a
                href="#contact"
                onClick={() => setMobileMenuOpen(false)}
                className="py-1.5 px-3 rounded-lg hover:bg-white text-[#9A9A9A] hover:text-[#1A1A1A] transition-colors"
              >
                CONTACT
              </a>
            </nav>
          </div>
        )}

        {/* ========================================================
            HERO MAIN SECTION
            ======================================================== */}
        <main className="px-6 sm:px-12 py-8 lg:py-12 grid grid-cols-1 lg:grid-cols-12 gap-8 items-center flex-1">
          {/* LEFT COLUMN: Hero Copy Animated Slider */}
          <div className="lg:col-span-6 space-y-6 sm:space-y-8 z-10 w-full overflow-hidden">
            {/* Sliding Track for 3 Headlines */}
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
                    {/* Category Subtitle */}
                    <span className="text-xs font-bold tracking-wider text-[#9A9A9A] uppercase block">
                      {item.subtitle}
                    </span>

                    {/* Big Bold Headline */}
                    <h1 className="font-heading font-extrabold text-4xl sm:text-5xl lg:text-[3.4rem] text-[#1A1A1A] leading-[1.12] mt-2 tracking-tight">
                      {item.titleLine1} <br />
                      <span className="text-[#1A1A1A]">{item.titleLine2}</span>
                    </h1>

                    <p className="text-xs sm:text-sm text-[#9A9A9A] font-medium mt-3 max-w-md leading-relaxed">
                      {item.description}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            {/* Feature Pills / Quick Entry */}
            <div className="flex flex-wrap items-center gap-2 pt-2 text-[11px] font-bold text-[#1A1A1A]">
              <button
                onClick={onEnterApp}
                className="px-3.5 py-2 rounded-full bg-[#BDE6F0] hover:bg-[#A2DCF0] transition-transform hover:scale-105 active:scale-95 flex items-center gap-1.5 shadow-xs"
              >
                <Eye className="w-3.5 h-3.5" /> Vision Guard
              </button>
              <button
                onClick={onEnterApp}
                className="px-3.5 py-2 rounded-full bg-[#CDE8B5] hover:bg-[#B6DF97] transition-transform hover:scale-105 active:scale-95 flex items-center gap-1.5 shadow-xs"
              >
                <Footprints className="w-3.5 h-3.5" /> Pedometer
              </button>
              <button
                onClick={onEnterApp}
                className="px-3.5 py-2 rounded-full bg-[#FFF29A] hover:bg-[#FFE966] transition-transform hover:scale-105 active:scale-95 flex items-center gap-1.5 shadow-xs"
              >
                <Bot className="w-3.5 h-3.5" /> AI Coach
              </button>
            </div>
          </div>

          {/* RIGHT COLUMN: Brain Study Laptop Illustration (AI Generated Image) */}
          <div className="lg:col-span-6 flex flex-col items-center justify-center relative">
            <div className="relative w-full flex items-center justify-center">
              <img
                src="/images/brain_study_landing.jpg"
                alt="Start learning with healthy mind illustration"
                className="w-full max-w-md lg:max-w-lg object-contain rounded-3xl drop-shadow-lg"
              />
            </div>
          </div>
        </main>

        {/* ========================================================
            BOTTOM FOOTER & PAGINATION CAROUSEL DOTS
            ======================================================== */}
        <footer className="px-6 sm:px-12 py-6 flex items-center justify-between border-t border-[#F6F6F6] text-xs">
          {/* Carousel Pagination Dots */}
          <div className="flex items-center gap-2">
            {headlines.map((_, idx) => (
              <button
                key={idx}
                onClick={() => setActiveSlide(idx)}
                className={`transition-all duration-300 rounded-full ${
                  activeSlide === idx
                    ? "w-6 h-2.5 bg-[#FFF29A] border border-[#FFE966]"
                    : "w-2.5 h-2.5 bg-[#E8E8E8] hover:bg-[#CDE8B5]"
                }`}
                title={`Slide ${idx + 1}`}
                aria-label={`Pindah ke slide ${idx + 1}`}
              />
            ))}
          </div>

          {/* Action to Dashboard */}
          <div className="flex items-center gap-4 text-[#9A9A9A] text-[11px] font-semibold">
            <button
              onClick={onEnterApp}
              className="text-[#1A1A1A] font-extrabold hover:underline flex items-center gap-1"
            >
              Buka Dashboard <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </footer>
      </div>
    </div>
  );
};
