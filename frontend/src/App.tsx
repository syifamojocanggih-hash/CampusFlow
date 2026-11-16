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
import { api } from "@/lib/api";
import type { TabKey, UserProfileDTO } from "@/types";

export function App() {
  const [isLandingPage, setIsLandingPage] = useState(true);
  const [activeTab, setActiveTab] = useState<TabKey>("dashboard");
  const [isPanicReliefActive, setIsPanicReliefActive] = useState(false);
  const [user, setUser] = useState<UserProfileDTO | null>(null);

  useEffect(() => {
    api
      .getCurrentUser()
      .then((res) => setUser(res.data))
      .catch((err) => console.error("Gagal memuat profil:", err));
  }, []);

  const userName = user?.name || "Mutiara Dewanda";

  // 1. Tampilkan Halaman Sebelum Login (Landing Page) jika isLandingPage true
  if (isLandingPage) {
    return <LandingPage onEnterApp={() => setIsLandingPage(false)} />;
  }

  // 2. Tampilkan Aplikasi Dashboard Utama
  return (
    <div className="min-h-screen bg-[#F6F6F6] flex flex-col text-[#1A1A1A]">
      {/* 1. Desktop Left Sidebar */}
      <DesktopSidebar
        activeTab={activeTab}
        onSelectTab={(tab) => {
          setIsPanicReliefActive(false);
          setActiveTab(tab);
        }}
        userName={userName}
        onBackToLanding={() => setIsLandingPage(true)}
      />

      {/* 2. Main Content Wrapper */}
      <div className="flex-1 lg:pl-64 flex flex-col min-h-screen">
        <main className="flex-1 max-w-6xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-5 pb-24 lg:pb-12">
          {/* Top Header: Desktop Greeting & Search / Mobile Greeting */}
          <DesktopTopHeader
            userName={userName}
            onBackToLanding={() => setIsLandingPage(true)}
            activeTab={activeTab}
            onSelectTab={setActiveTab}
          />
          <MobileHeader
            userName={userName}
            onBackToLanding={() => setIsLandingPage(true)}
            activeTab={activeTab}
            onSelectTab={setActiveTab}
          />

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
