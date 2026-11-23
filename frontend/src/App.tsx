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
import { CoachView } from "@/components/pages/CoachView";
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
    <div className="min-h-screen bg-[#FAF5EF] flex flex-col text-[#1A1A1A]">
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
        <main className="flex-1 max-w-6xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-5 pb-24 lg:pb-12">
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
            className={`mb-5 rounded-2xl p-3.5 border transition-all flex flex-wrap items-center justify-between gap-3 text-xs ${
              osLock.isArmed
                ? "bg-[#FDECD8]/90 border-[#E5C19A] text-[#1A1A1A] shadow-xs"
                : "bg-white border-[#E6D7C8] text-[#1A1A1A] shadow-2xs"
            }`}
          >
            <div className="flex items-center gap-3">
              <div
                className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                  osLock.isArmed
                    ? "bg-[#1A1A1A] text-[#FDECD8]"
                    : "bg-[#98C5E2] text-[#1A1A1A]"
                }`}
              >
                {osLock.isArmed ? <Timer className="w-4 h-4 animate-spin" /> : <ShieldAlert className="w-4 h-4" />}
              </div>
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-heading font-extrabold text-xs sm:text-sm text-[#1A1A1A]">
                    Proteksi Screen Time Level OS
                  </span>
                  {osLock.isArmed && osLock.remainingSeconds !== null && (
                    <span className="px-2.5 py-0.5 rounded-full bg-[#1A1A1A] text-[#FDECD8] font-mono font-extrabold text-xs">
                      {Math.floor(osLock.remainingSeconds / 60)
                        .toString()
                        .padStart(2, "0")}
                      :
                      {(osLock.remainingSeconds % 60).toString().padStart(2, "0")} Tersisa
                    </span>
                  )}
                </div>
                <p className="text-[11px] text-[#525252] mt-0.5">
                  {osLock.isArmed
                    ? "Timer aktif di background OS! Silakan buka tab lain atau aplikasi lain. Saat waktu habis, layar otomatis ditarik kembali ke tab ini dan dikunci untuk peregangan."
                    : "Saat waktu screen time habis, layar laptop otomatis ditarik ke tab ini dan dikunci sampai prosedur peregangan kamera selesai."}
                </p>
              </div>
            </div>

            <div className="flex items-center flex-wrap gap-2">
              {osLock.isArmed ? (
                <button
                  type="button"
                  onClick={() => void osScreenLock.disarmTimer()}
                  className="px-3.5 py-1.5 rounded-xl bg-[#1A1A1A] hover:bg-black text-white font-extrabold flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  <Square className="w-3 h-3 fill-white" />
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
                    className="px-3 py-1.5 rounded-xl bg-[#FDECD8] hover:bg-[#E5C19A] text-[#1A1A1A] border border-[#E5C19A] font-extrabold flex items-center gap-1.5 transition-colors cursor-pointer"
                    title="Aktifkan timer 15 detik, lalu coba pindah ke tab lain atau aplikasi lain"
                  >
                    <Play className="w-3 h-3 fill-[#1A1A1A]" />
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
                    className="px-3 py-1.5 rounded-xl bg-[#FAF5EF] hover:bg-[#E6D7C8] text-[#1A1A1A] border border-[#E6D7C8] font-bold transition-colors cursor-pointer"
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
                    className="px-3 py-1.5 rounded-xl bg-[#98C5E2] hover:bg-[#7BB1D3] text-[#1A1A1A] border border-[#7BB1D3] font-extrabold flex items-center gap-1.5 transition-colors cursor-pointer"
                  >
                    <Lock className="w-3 h-3" />
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
