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
  Moon,
} from "lucide-react";

interface LandingPageProps {
  onEnterApp: () => void;
}

type LandingNav = "home" | "courses" | "about" | "contact";

export const LandingPage: React.FC<LandingPageProps> = ({ onEnterApp }) => {
  const [activeNav, setActiveNav] = useState<LandingNav>("home");
  const [activeSlide, setActiveSlide] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [touchStartX, setTouchStartX] = useState<number | null>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

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
      subtitle: "Online education & Active Wellbeing",
      titleLine1: "Start learning",
      titleLine2: "at home & campus",
      description:
        "Platform terpadu pemantau postur tegak, pelacak langkah inersia, dan manajemen stres mahasiswa berbasis AI.",
    },
    {
      subtitle: "100% Privat & Aman",
      titleLine1: "Posture Guard",
      titleLine2: "Asisten Postur AI",
      description:
        "Deteksi posisi duduk bungkuk dan jarak mata terlalu dekat langsung di browser Anda tanpa mengunggah video.",
    },
    {
      subtitle: "Hitung Langkah Otomatis",
      titleLine1: "Smart Pedometer",
      titleLine2: "Keep moving everyday",
      description:
        "Gunakan sensor HP di saku untuk menghitung langkah dan menjaga tubuh tetap aktif di sela jam kuliah.",
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
      category: "ergonomi",
      cardBg: "bg-[#E6F5F8] border-[#BDE6F0] hover:border-[#8ECAD7]",
      iconBg: "bg-[#BDE6F0] text-[#1A1A1A]",
      icon: <Eye className="w-5 h-5" />,
      title: "Mastery Ergonomi Belajar & Postur 20-20-20",
      description:
        "Setup ruang belajar ergonomis, pencegahan leher bungkuk (Text Neck), dan panduan jarak mata-layar 50-70 cm.",
    },
    {
      id: "c2",
      category: "aktivitas",
      cardBg: "bg-[#EEF7E6] border-[#CDE8B5] hover:border-[#B6DF97]",
      iconBg: "bg-[#CDE8B5] text-[#1A1A1A]",
      icon: <Footprints className="w-5 h-5" />,
      title: "Gaya Hidup Aktif & Penghitung Langkah Kampus",
      description:
        "Mencapai target gerak aktif mingguan dengan sensor HP di saku. Tetap aktif berjalan di sela jam kuliah padat.",
    },
    {
      id: "c3",
      category: "stres",
      cardBg: "bg-[#FFFCEB] border-[#FFE966] hover:border-[#FFDD33]",
      iconBg: "bg-[#FFF29A] text-[#1A1A1A]",
      icon: <Moon className="w-5 h-5" />,
      title: "Manajemen Stres Mahasiswa & Relaksasi 15 Menit",
      description:
        "Ketahui tingkat stres harian, latihan pernapasan terpandu, dan relaksasi cepat saat menghadapi deadline tugas.",
    },
    {
      id: "c4",
      category: "stres",
      cardBg: "bg-[#FDF0F2] border-[#F7A8B0] hover:border-[#F27885]",
      iconBg: "bg-[#F7A8B0] text-[#1A1A1A]",
      icon: <Bot className="w-5 h-5" />,
      title: "AI Coaching & Pembentukan Kebiasaan Belajar Sehat",
      description:
        "Membangun rutinitas harian seimbang menggunakan panduan AI cerdas dan menjaga konsistensi tanpa rasa lelah berlebih.",
    },
  ];

  const faqs = [
    {
      q: "Apakah webcam saya direkam atau diunggah ke internet?",
      a: "Sama sekali tidak. CampusFlow bekerja 100% langsung di perangkat Anda. Kamera hanya memindai kerangka tubuh di memori lokal peramban tanpa pernah mengirimkan satu frame video pun ke server atau internet.",
    },
    {
      q: "Bagaimana cara kerja pelacak langkah pedometer?",
      a: "Pedometer membaca ayunan langkah secara otomatis saat HP Anda berada di saku, membedakan jalan santai, jalan cepat, atau lari untuk menghitung energi kebugaran Anda.",
    },
    {
      q: "Apakah universitas atau fakultas saya dapat mengintegrasikan CampusFlow?",
      a: "Ya! CampusFlow dirancang dengan standar interoperabilitas LMS (LTI 1.3 / SSO Kampus) sehingga progres kebugaran dan kehadiran dapat disinkronkan secara aman.",
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#8ED6DB] via-[#A6E1E6] to-[#CDE8B5] font-sans scroll-smooth flex flex-col items-center">
      {/* ========================================================
          TOP NAVIGATION BAR (FIXED AT THE VERY TOP OF SCREEN)
          ======================================================== */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-md border-b border-[#E8E8E8] shadow-xs">
        <div className="max-w-6xl mx-auto px-4 sm:px-8 py-3.5 flex items-center justify-between">
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
            <div
              onClick={() => scrollToSection("home")}
              className="flex items-center gap-2.5 cursor-pointer select-none"
            >
              <div className="w-9 h-9 rounded-2xl bg-[#BDE6F0] flex items-center justify-center text-[#1A1A1A] shadow-xs">
                <GraduationCap className="w-5 h-5" />
              </div>
              <span className="font-heading font-extrabold text-lg text-[#1A1A1A] tracking-tight">
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
                      ? "bg-[#FFF29A] text-[#1A1A1A] border border-[#FFE966] font-extrabold shadow-xs scale-105"
                      : "text-[#9A9A9A] hover:text-[#1A1A1A] hover:bg-[#F6F6F6]"
                  }`}
                >
                  {navKey}
                </button>
              );
            })}
          </nav>

          {/* Right Action Button */}
          <div className="flex items-center gap-2">
            <button
              onClick={onEnterApp}
              className="px-4 py-2 rounded-full text-xs font-bold whitespace-nowrap bg-[#CDE8B5] hover:bg-[#B6DF97] text-[#1A1A1A] transition-colors shadow-xs border border-[#B6DF97] active:scale-95 shrink-0 flex items-center gap-1.5 group"
            >
              <span>Sign up / Masuk</span>
              <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-0.5" />
            </button>
          </div>
        </div>
      </header>

      {/* Mobile Navigation Dropdown (Fixed under top navbar) */}
      {mobileMenuOpen && (
        <div className="md:hidden fixed top-[61px] left-0 right-0 z-40 px-4 py-3 bg-white/98 backdrop-blur-md border-b border-[#E8E8E8] shadow-md transition-all animate-in fade-in slide-in-from-top-2 duration-150">
          <nav className="flex flex-col gap-1 text-xs font-bold tracking-wider text-[#1A1A1A] max-w-6xl mx-auto">
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
                      ? "bg-[#FFF29A] text-[#1A1A1A] font-extrabold border border-[#FFE966]"
                      : "text-[#9A9A9A] hover:text-[#1A1A1A] hover:bg-[#F6F6F6]"
                  }`}
                >
                  {navKey}
                </button>
              );
            })}
          </nav>
        </div>
      )}

      {/* Main Content Area (With pt-20 to clear fixed navbar) */}
      <main className="w-full pt-20 sm:pt-24 pb-12 px-3 sm:px-6 lg:px-8 flex flex-col items-center">
        {/* Main White Desktop Mockup Window (Single Continuous Flowing Page) */}
        <div className="bg-white rounded-[2.5rem] shadow-2xl w-full max-w-6xl mx-auto border border-white/60 relative flex flex-col overflow-hidden">

        {/* ========================================================
            1. HOME / HERO SECTION
            ======================================================== */}
        <section
          id="home"
          className="scroll-mt-24 px-6 sm:px-12 py-10 lg:py-16 grid grid-cols-1 lg:grid-cols-12 gap-8 items-center border-b border-[#F6F6F6]"
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
                    <span className="text-xs font-bold tracking-wider text-[#9A9A9A] uppercase block">
                      {item.subtitle}
                    </span>

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
                onClick={() => scrollToSection("about")}
                className="px-3.5 py-2 rounded-full bg-[#BDE6F0] hover:bg-[#A2DCF0] transition-colors active:scale-95 flex items-center gap-1.5 shadow-xs"
              >
                <Eye className="w-3.5 h-3.5" /> Vision Guard
              </button>
              <button
                onClick={() => scrollToSection("about")}
                className="px-3.5 py-2 rounded-full bg-[#CDE8B5] hover:bg-[#B6DF97] transition-colors active:scale-95 flex items-center gap-1.5 shadow-xs"
              >
                <Footprints className="w-3.5 h-3.5" /> Pedometer
              </button>
              <button
                onClick={() => scrollToSection("courses")}
                className="px-3.5 py-2 rounded-full bg-[#FFF29A] hover:bg-[#FFE966] transition-colors active:scale-95 flex items-center gap-1.5 shadow-xs"
              >
                <Bot className="w-3.5 h-3.5" /> AI Coach
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
          className="scroll-mt-24 px-6 sm:px-12 py-12 lg:py-16 space-y-8 border-b border-[#F6F6F6]"
        >
          {/* Header Title */}
          <div className="pb-2 border-b border-[#F6F6F6]">
            <div>
              <span className="text-[11px] font-extrabold uppercase tracking-wider text-[#9A9A9A] flex items-center gap-1.5">
                <BookOpen className="w-3.5 h-3.5 text-[#1A1A1A]" />
                Kurikulum Wellbeing &amp; Ergonomi Kampus
              </span>
              <h2 className="font-heading font-extrabold text-2xl sm:text-3xl text-[#1A1A1A] mt-1">
                Katalog Modul Pembelajaran
              </h2>
              <p className="text-xs text-[#9A9A9A] max-w-xl mt-1">
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

                  <h3 className="font-heading font-extrabold text-base text-[#1A1A1A]">
                    {c.title}
                  </h3>

                  <p className="text-xs text-[#1A1A1A]/70 leading-relaxed font-medium">
                    {c.description}
                  </p>
                </div>

                <div className="pt-4 mt-5 border-t border-black/5 flex items-center justify-end">
                  <button
                    onClick={onEnterApp}
                    className="px-4 py-2 rounded-full bg-white hover:bg-[#1A1A1A] hover:text-white text-[#1A1A1A] font-bold text-xs transition-colors active:scale-95 flex items-center gap-1.5 border border-black/10 shadow-xs group/btn"
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
          className="scroll-mt-24 px-6 sm:px-12 py-12 lg:py-16 space-y-8 border-b border-[#F6F6F6]"
        >
          {/* Header */}
          <div className="text-center max-w-2xl mx-auto space-y-2.5">
            <h2 className="font-heading font-extrabold text-2xl sm:text-3xl text-[#1A1A1A]">
              Membangun Generasi Mahasiswa Aktif, Ergonomis, &amp; Tangguh
            </h2>
            <p className="text-xs text-[#9A9A9A] leading-relaxed">
              CampusFlow adalah platform kesehatan belajar mahasiswa yang menggabungkan asisten postur kamera pintar, penghitung langkah di saku, dan pemantau stres harian untuk gaya hidup mahasiswa yang lebih sehat dan berenergi.
            </p>
          </div>

          {/* 3 Pillars Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5 pt-2">
            <div className="p-6 rounded-3xl bg-[#F6F6F6] border border-[#E8E8E8] space-y-3">
              <div className="w-10 h-10 rounded-2xl bg-[#BDE6F0] flex items-center justify-center text-[#1A1A1A] shadow-xs">
                <Eye className="w-5 h-5" />
              </div>
              <h3 className="font-heading font-extrabold text-sm text-[#1A1A1A]">
                1. Pengingat Postur Tegak
              </h3>
              <p className="text-xs text-[#9A9A9A] leading-relaxed">
                Mendeteksi posisi duduk membungkuk dan jarak mata yang terlalu dekat ke monitor secara otomatis agar leher dan punggung tidak pegal saat belajar.
              </p>
            </div>

            <div className="p-6 rounded-3xl bg-[#F6F6F6] border border-[#E8E8E8] space-y-3">
              <div className="w-10 h-10 rounded-2xl bg-[#CDE8B5] flex items-center justify-center text-[#1A1A1A] shadow-xs">
                <Footprints className="w-5 h-5" />
              </div>
              <h3 className="font-heading font-extrabold text-sm text-[#1A1A1A]">
                2. Penghitung Langkah &amp; Gerak Aktif
              </h3>
              <p className="text-xs text-[#9A9A9A] leading-relaxed">
                Menghitung langkah dan intensitas jalan santai atau olahraga harian secara otomatis lewat HP di saku untuk menjaga kebugaran tubuh setiap hari.
              </p>
            </div>

            <div className="p-6 rounded-3xl bg-[#F6F6F6] border border-[#E8E8E8] space-y-3">
              <div className="w-10 h-10 rounded-2xl bg-[#FFF29A] flex items-center justify-center text-[#1A1A1A] shadow-xs">
                <Bot className="w-5 h-5" />
              </div>
              <h3 className="font-heading font-extrabold text-sm text-[#1A1A1A]">
                3. Manajemen Stres &amp; Relaksasi
              </h3>
              <p className="text-xs text-[#9A9A9A] leading-relaxed">
                Kuis cepat evaluasi tingkat stres dan fitur latihan relaksasi 15 menit untuk menenangkan pikiran saat cemas menjelang ujian atau deadline.
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
          <div className="pb-2 border-b border-[#F6F6F6]">
            <h2 className="font-heading font-extrabold text-2xl sm:text-3xl text-[#1A1A1A]">
              Hubungi Tim CampusFlow
            </h2>
            <p className="text-xs text-[#9A9A9A] max-w-xl mt-1">
              Punya pertanyaan seputar integrasi sistem di kampus, kendala sensor, atau ingin berkolaborasi riset ergonomi? Kami siap membantu.
            </p>
          </div>

          {/* Grid: Form & Info */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-stretch">
            {/* Left: Contact Form */}
            <div className="p-6 sm:p-7 rounded-3xl bg-white border border-[#E8E8E8] shadow-xs flex flex-col justify-between space-y-4">
              <div>
                <h3 className="font-heading font-extrabold text-base text-[#1A1A1A]">
                  Kirim Pesan / Pengaduan
                </h3>
                <p className="text-xs text-[#9A9A9A] mt-0.5">
                  Sampaikan kendala teknis atau pertanyaan Anda langsung ke tim pengembang.
                </p>
              </div>

              {contactSubmitted ? (
                <div className="p-6 rounded-2xl bg-[#F6F6F6] border border-[#CDE8B5] text-center space-y-2 animate-in zoom-in-95 my-auto">
                  <div className="w-12 h-12 rounded-full bg-[#CDE8B5] text-emerald-800 flex items-center justify-center mx-auto">
                    <CheckCircle2 className="w-6 h-6" />
                  </div>
                  <h4 className="font-heading font-extrabold text-sm text-[#1A1A1A]">
                    Pesan Berhasil Terkirim!
                  </h4>
                  <p className="text-xs text-[#9A9A9A]">
                    Terima kasih, tim dukungan CampusFlow akan merespons melalui email dalam waktu 1x24 jam kerja.
                  </p>
                  <button
                    onClick={() => setContactSubmitted(false)}
                    className="mt-3 px-4 py-1.5 rounded-full text-xs font-bold bg-[#1A1A1A] text-white transition-transform active:scale-95"
                  >
                    Kirim Pesan Lain
                  </button>
                </div>
              ) : (
                <form onSubmit={handleContactSubmit} className="space-y-3.5 flex-1 flex flex-col justify-between">
                  <div className="space-y-3">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[11px] font-bold text-[#1A1A1A] mb-1">
                          Nama Lengkap
                        </label>
                        <input
                          type="text"
                          required
                          value={contactName}
                          onChange={(e) => setContactName(e.target.value)}
                          placeholder="Mutiara Dewanda"
                          className="w-full px-3.5 py-2 text-xs bg-[#FAFAFA] border border-[#E8E8E8] rounded-xl text-[#1A1A1A] focus:outline-none focus:border-[#BDE6F0] focus:bg-white transition-all"
                        />
                      </div>

                      <div>
                        <label className="block text-[11px] font-bold text-[#1A1A1A] mb-1">
                          Email Kampus / Personal
                        </label>
                        <input
                          type="email"
                          required
                          value={contactEmail}
                          onChange={(e) => setContactEmail(e.target.value)}
                          placeholder="nama@kampus.ac.id"
                          className="w-full px-3.5 py-2 text-xs bg-[#FAFAFA] border border-[#E8E8E8] rounded-xl text-[#1A1A1A] focus:outline-none focus:border-[#BDE6F0] focus:bg-white transition-all"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-[#1A1A1A] mb-1">
                        Kategori Pertanyaan
                      </label>
                      <select
                        value={contactCategory}
                        onChange={(e) => setContactCategory(e.target.value)}
                        className="w-full px-3.5 py-2 text-xs bg-[#FAFAFA] border border-[#E8E8E8] rounded-xl text-[#1A1A1A] focus:outline-none focus:border-[#BDE6F0] focus:bg-white transition-all"
                      >
                        <option>Dukungan Teknis &amp; Sensor</option>
                        <option>Integrasi LMS / SSO Kampus</option>
                        <option>Konsultasi Ergonomi &amp; Modul</option>
                        <option>Kritik &amp; Saran Pengembangan</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-[#1A1A1A] mb-1">
                        Pesan / Uraian Masalah
                      </label>
                      <textarea
                        rows={4}
                        required
                        value={contactMessage}
                        onChange={(e) => setContactMessage(e.target.value)}
                        placeholder="Jelaskan kebutuhan atau kendala yang Anda hadapi..."
                        className="w-full px-3.5 py-2 text-xs bg-[#FAFAFA] border border-[#E8E8E8] rounded-xl text-[#1A1A1A] focus:outline-none focus:border-[#BDE6F0] focus:bg-white transition-all resize-none"
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    className="w-full py-2.5 rounded-xl bg-[#FFF29A] hover:bg-[#FFE966] text-[#1A1A1A] font-bold text-xs transition-transform active:scale-95 shadow-xs border border-[#FFE966] flex items-center justify-center gap-1.5 mt-2"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>Kirim Pesan Sekarang</span>
                  </button>
                </form>
              )}
            </div>

            {/* Right: Channels & FAQ Combined Card */}
            <div className="p-6 sm:p-7 rounded-3xl bg-white border border-[#E8E8E8] shadow-xs flex flex-col justify-between space-y-5">
              {/* Saluran Dukungan Resmi */}
              <div className="space-y-3">
                <div>
                  <h3 className="font-heading font-extrabold text-base text-[#1A1A1A]">
                    Saluran Dukungan Resmi
                  </h3>
                  <p className="text-xs text-[#9A9A9A] mt-0.5">
                    Layanan komunikasi langsung dengan tim pengembang dan praktisi.
                  </p>
                </div>

                <div className="grid grid-cols-1 gap-2.5 text-xs pt-1">
                  <div className="flex items-center gap-3 p-2.5 rounded-2xl bg-[#FAFAFA] border border-[#EEEEEE]">
                    <div className="w-8 h-8 rounded-xl bg-[#BDE6F0] flex items-center justify-center text-[#1A1A1A] shrink-0 shadow-2xs">
                      <Mail className="w-4 h-4" />
                    </div>
                    <div>
                      <span className="font-bold text-[#1A1A1A] block text-[11px]">Email Dukungan</span>
                      <span className="text-[#9A9A9A] text-[11px]">support@campusflow.id</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 p-2.5 rounded-2xl bg-[#FAFAFA] border border-[#EEEEEE]">
                    <div className="w-8 h-8 rounded-xl bg-[#CDE8B5] flex items-center justify-center text-[#1A1A1A] shrink-0 shadow-2xs">
                      <Phone className="w-4 h-4" />
                    </div>
                    <div>
                      <span className="font-bold text-[#1A1A1A] block text-[11px]">Hotline Mahasiswa</span>
                      <span className="text-[#9A9A9A] text-[11px]">+62 (021) 500-FLOW</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 p-2.5 rounded-2xl bg-[#FAFAFA] border border-[#EEEEEE]">
                    <div className="w-8 h-8 rounded-xl bg-[#FFF29A] flex items-center justify-center text-[#1A1A1A] shrink-0 shadow-2xs">
                      <MapPin className="w-4 h-4" />
                    </div>
                    <div>
                      <span className="font-bold text-[#1A1A1A] block text-[11px]">Laboratorium Riset</span>
                      <span className="text-[#9A9A9A] text-[11px]">Gedung Smart Wellbeing Kampus Terpadu</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Divider */}
              <div className="border-t border-[#F0F0F0]" />

              {/* Accordion FAQ */}
              <div className="space-y-2.5">
                <div className="flex items-center gap-1.5">
                  <HelpCircle className="w-4 h-4 text-[#1A1A1A]" />
                  <h4 className="font-heading font-extrabold text-xs text-[#1A1A1A]">
                    Pertanyaan Umum (FAQ)
                  </h4>
                </div>

                <div className="space-y-2">
                  {faqs.map((faq, idx) => (
                    <div
                      key={idx}
                      className="rounded-2xl bg-[#FAFAFA] border border-[#EEEEEE] p-3 transition-colors"
                    >
                      <button
                        type="button"
                        onClick={() =>
                          setOpenFaqIndex(openFaqIndex === idx ? null : idx)
                        }
                        className="w-full text-left font-bold text-[11px] text-[#1A1A1A] flex items-center justify-between gap-2"
                      >
                        <span>{faq.q}</span>
                        <span className="text-[#9A9A9A] text-xs font-mono">
                          {openFaqIndex === idx ? "−" : "+"}
                        </span>
                      </button>
                      {openFaqIndex === idx && (
                        <p className="text-[10px] text-[#9A9A9A] mt-2 leading-relaxed pt-1.5 border-t border-[#E8E8E8]">
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

        {/* ========================================================
            5. FOOTER SECTION
            ======================================================== */}
        <footer className="px-6 sm:px-12 py-5 flex items-center justify-end border-t border-[#F6F6F6] text-xs bg-[#FAFAFA] rounded-b-[2.5rem] shrink-0">
          <button
            onClick={onEnterApp}
            className="text-[#1A1A1A] font-extrabold hover:underline flex items-center gap-1.5 text-xs transition-colors active:scale-95"
          >
            <span>Masuk Dashboard</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </footer>
      </div>
    </main>
  </div>
);
};
