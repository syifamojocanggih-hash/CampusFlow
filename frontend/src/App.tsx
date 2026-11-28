import { useEffect, useState } from "react";
import {
  DesktopSidebar,
  DesktopTopHeader,
  MobileHeader,
  MobileBottomNav,
} from "@/components/Navbar";
import { TriadDashboard } from "@/components/TriadDashboard";
import { PanicReliefMode } from "@/components/PanicReliefMode";
import { FocusView } from "@/components/pages/FocusView";
import { ActivityView } from "@/components/pages/ActivityView";
import { CoachView, resetCoachChatSession } from "@/components/pages/CoachView";
import { HistoryView } from "@/components/pages/HistoryView";
import { SettingsView } from "@/components/pages/SettingsView";
import { VisionLabView } from "@/components/pages/VisionLabView";
import { ProfileView } from "@/components/pages/ProfileView";
import { LandingPage } from "@/components/pages/LandingPage";
import { MimiPetWidget } from "@/components/pet/MimiPetWidget";
import { VisionGuard } from "@/components/vision/VisionGuard";
import { screenTimeTracker } from "@/utils/screenTimeTracker";
import { autoSleepTracker } from "@/utils/autoSleepTracker";
import { osScreenLock, useOsScreenLock } from "@/utils/osScreenLock";
import { api } from "@/lib/api";
import { Lock, Play, ShieldAlert, Square, Timer } from "lucide-react";
import type { TabKey, UserProfileDTO } from "@/types";

export function App() {
  const osLock = useOsScreenLock();
  const [isLandingPage, setIsLandingPage] = useState(() => {
    if (osScreenLock.getState().isLocked || window.location.search.includes("os_lock=1")) {
      return false;
    }
    const existingToken = api.getToken();
    return !existingToken || existingToken.startsWith("mock-jwt-");
  });
  const [activeTab, setActiveTab] = useState<TabKey>("dashboard");
  const [isPanicReliefActive, setIsPanicReliefActive] = useState(false);
  const [user, setUser] = useState<UserProfileDTO | null>(() => {
    const saved = localStorage.getItem("cf_user_profile");
    if (saved) {
      try {
        return JSON.parse(saved) as UserProfileDTO;
      } catch {
        return null;
      }
    }
    return null;
  });

  useEffect(() => {
    if (osLock.isLocked && isLandingPage) {
      setIsLandingPage(false);
    }
  }, [osLock.isLocked, isLandingPage]);

  useEffect(() => {
    screenTimeTracker.start();
    autoSleepTracker.start();
    return () => {
      screenTimeTracker.stop();
      autoSleepTracker.stop();
    };
  }, []);

  useEffect(() => {
    if (isLandingPage) return;
    api
      .getCurrentUser()
      .then((res) => {
        if (res?.data) {
          setUser(res.data);
          localStorage.setItem("cf_user_profile", JSON.stringify(res.data));
        }
      })
      .catch((err) => console.error("Gagal memuat profil:", err));
  }, [isLandingPage]);

  const userName = user?.name || "Mahasiswa";

  const handleLogout = () => {
    api.setToken(null);
    localStorage.removeItem("cf_user_profile");
    resetCoachChatSession();
    setUser(null);
    setIsLandingPage(true);
  };

  // 1. Tampilkan Halaman Sebelum Login (Landing Page) jika isLandingPage true
  if (isLandingPage) {
    return (
      <LandingPage
        onEnterApp={() => setIsLandingPage(false)}
        onLoginSuccess={(loggedInUser) => {
          setUser(loggedInUser);
          setIsLandingPage(false);
        }}
      />
    );
  }

  // 2. Tampilkan Aplikasi Dashboard Utama
  return (
    <div className="min-h-screen bg-white flex flex-col text-[#2F3A2E]">
      {/* 1. Desktop Left Sidebar */}
      <DesktopSidebar
        activeTab={activeTab}
        onSelectTab={(tab) => {
          setIsPanicReliefActive(false);
          setActiveTab(tab);
        }}
        userName={userName}
        onBackToLanding={handleLogout}
      />

      {/* 2. Main Content Wrapper */}
      <div className="flex-1 lg:pl-64 flex flex-col min-h-screen">
        <main className="flex-1 max-w-6xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-5 pb-28 lg:pb-12">
          {/* Top Header: Desktop Greeting & Search / Mobile Greeting */}
          <DesktopTopHeader
            userName={userName}
            onBackToLanding={handleLogout}
            activeTab={activeTab}
            onSelectTab={setActiveTab}
          />
          <MobileHeader
            userName={userName}
            onBackToLanding={handleLogout}
            activeTab={activeTab}
            onSelectTab={setActiveTab}
          />

          {/* OS-Level Screen Time Enforcer Status & Quick Control Bar */}
          <div
            className={`mb-5 rounded-[1.6rem] px-5 py-4 border transition-all flex flex-col lg:flex-row lg:items-center justify-between gap-3.5 lg:gap-5 text-xs ${
              osLock.isArmed
                ? "bg-[#E5ECE0] border-[#C8D4BC] text-[#2F3A2E] shadow-[0_6px_22px_-6px_rgba(47,58,46,0.08)]"
                : "bg-[#FDFBF8] border-[#ECE5DA] text-[#2F3A2E] shadow-[0_6px_22px_-6px_rgba(47,58,46,0.08),0_2px_6px_-2px_rgba(47,58,46,0.04)]"
            }`}
          >
            <div className="flex items-center gap-3.5 flex-1 min-w-0">
              <div
                className={`w-11 h-11 rounded-2xl flex items-center justify-center shrink-0 ${
                  osLock.isArmed
                    ? "bg-[#C8D4BC] text-[#2F3A2E]"
                    : "bg-[#D9E0D1] text-[#2F3A2E]"
                }`}
              >
                {osLock.isArmed ? <Timer className="w-5 h-5 animate-spin" /> : <ShieldAlert className="w-5 h-5" />}
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-heading font-extrabold text-sm text-[#2F3A2E]">
                    Proteksi Screen Time Level OS
                  </span>
                  {osLock.isArmed && osLock.remainingSeconds !== null && (
                    <span className="px-2.5 py-0.5 rounded-full bg-white text-[#2F3A2E] border border-[#C8D4BC] font-mono font-extrabold text-xs">
                      {Math.floor(osLock.remainingSeconds / 60)
                        .toString()
                        .padStart(2, "0")}
                      :
                      {(osLock.remainingSeconds % 60).toString().padStart(2, "0")} Tersisa
                    </span>
                  )}
                </div>
                <p className="text-[11px] sm:text-xs text-[#636B60] mt-0.5 leading-relaxed">
                  {osLock.isArmed
                    ? "Timer aktif di background OS! Silakan buka tab lain atau aplikasi lain. Saat waktu habis, layar otomatis ditarik kembali ke tab ini dan dikunci untuk peregangan."
                    : "Saat waktu screen time habis, layar laptop otomatis ditarik ke tab ini dan dikunci sampai prosedur peregangan kamera selesai."}
                </p>
              </div>
            </div>

            <div className="flex items-center flex-wrap lg:flex-nowrap shrink-0 gap-2">
              {osLock.isArmed ? (
                <button
                  type="button"
                  onClick={() => void osScreenLock.disarmTimer()}
                  className="px-3.5 py-2 rounded-full bg-[#EAE1D6] hover:bg-[#DFD4C6] text-[#2F3A2E] border border-[#DDD1C2] font-bold flex items-center gap-1.5 whitespace-nowrap transition-colors cursor-pointer"
                >
                  <Square className="w-3 h-3 fill-[#2F3A2E]" />
                  <span>Batalkan Timer</span>
                </button>
              ) : (
                <>
                  <button
                    type="button"
                    onClick={() =>
                      void osScreenLock.armTimer(
                        15,
                        "Batas Screen Time (15 Detik Mode Uji) Tercapai — Wajib Peregangan Aktif"
                      )
                    }
                    className="px-3.5 py-2 rounded-full bg-[#C8D4BC] hover:bg-[#BBC9AD] text-[#2F3A2E] border border-[#B9C7AC] font-bold flex items-center gap-1.5 whitespace-nowrap transition-colors cursor-pointer"
                    title="Aktifkan timer 15 detik, lalu coba pindah ke tab lain atau aplikasi lain"
                  >
                    <Play className="w-3 h-3 fill-[#2F3A2E] shrink-0" />
                    <span>Timer Lock 15s (Uji Pindah Tab/App)</span>
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      void osScreenLock.armTimer(
                        25 * 60,
                        "Batas Screen Time Belajar (25 Menit) Tercapai — Wajib Peregangan Aktif"
                      )
                    }
                    className="px-3.5 py-2 rounded-full bg-[#EAE1D6] hover:bg-[#E0D4C6] text-[#2F3A2E] border border-[#DFD4C6] font-bold whitespace-nowrap transition-colors cursor-pointer"
                  >
                    Timer 25m
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      void osScreenLock.triggerLock(
                        "Kunci Layar Istirahat Aktif (Level OS) — Wajib Peregangan"
                      )
                    }
                    className="px-3.5 py-2 rounded-full bg-[#FDFBF8] hover:bg-[#FAF6F0] text-[#2F3A2E] border border-[#DDD4C7] font-bold flex items-center gap-1.5 whitespace-nowrap transition-colors cursor-pointer"
                  >
                    <Lock className="w-3.5 h-3.5 shrink-0" />
                    <span>Kunci Layar Sekarang</span>
                  </button>
                </>
              )}
            </div>
          </div>

          {/* Global Full-Screen OS Lock Enforcer (mounted whenever locked outside VisionLabView) */}
          {osLock.isLocked && activeTab !== "vision-lab" && (
            <VisionGuard
              autoStartCamera={true}
              forceBreakLock={true}
              isStrictOsLock={true}
              lockReason={osLock.reason}
            />
          )}

          {/* View Container */}
          {isPanicReliefActive ? (
            <div className="py-4">
              <PanicReliefMode
                onClose={() => setIsPanicReliefActive(false)}
                onComplete={() => {
                  alert("Selamat! Anda telah menyelesaikan 15 menit Panic Relief Protocol (+50 XP)");
                  setIsPanicReliefActive(false);
                }}
              />
            </div>
          ) : (
            <div className="transition-all duration-300">
              {activeTab === "dashboard" && (
                <TriadDashboard
                  onStartPanicRelief={() => setIsPanicReliefActive(true)}
                  onNavigateToFocus={() => setActiveTab("focus")}
                />
              )}
              {activeTab === "focus" && <FocusView />}
              {activeTab === "vision-lab" && <VisionLabView />}
              {activeTab === "activity" && <ActivityView />}
              {activeTab === "checkin" && <ActivityView defaultSubTab="checkin" />}
              {activeTab === "coach" && (
                <CoachView
                  onNavigateToFocus={() => setActiveTab("focus")}
                  onNavigateToActivity={() => setActiveTab("activity")}
                  onStartPanicRelief={() => setIsPanicReliefActive(true)}
                />
              )}
              {activeTab === "history" && <HistoryView />}
              {activeTab === "settings" && (
                <SettingsView onNavigateToProfile={() => setActiveTab("profile")} />
              )}
              {activeTab === "profile" && (
                <ProfileView
                  currentUser={user}
                  onProfileUpdated={(updated) => setUser(updated)}
                  onNavigateToFocus={() => setActiveTab("focus")}
                />
              )}
            </div>
          )}
        </main>
      </div>

      {/* 3. Mobile Bottom Navigation Bar */}
      <MobileBottomNav
        activeTab={activeTab}
        onSelectTab={(tab) => {
          setIsPanicReliefActive(false);
          setActiveTab(tab);
        }}
        userName={userName}
      />

      {/* 4. Draggable Floating Streak Pet (Mimi) */}
      <MimiPetWidget />
    </div>
  );
}

export default App;
