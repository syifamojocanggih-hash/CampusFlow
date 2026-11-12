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
import { CheckinView } from "@/components/pages/CheckinView";
import { CoachView } from "@/components/pages/CoachView";
import { HistoryView } from "@/components/pages/HistoryView";
import { SettingsView } from "@/components/pages/SettingsView";
import { VisionLabView } from "@/components/pages/VisionLabView";
import { api } from "@/lib/api";
import type { TabKey, UserProfileDTO } from "@/types";

export function App() {
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

  return (
    <div className="min-h-screen bg-[#F6F6F6] flex flex-col text-[#1A1A1A]">
      {/* 1. Desktop Left Sidebar (Learnova Fixed Sidebar) */}
      <DesktopSidebar
        activeTab={activeTab}
        onSelectTab={(tab) => {
          setIsPanicReliefActive(false);
          setActiveTab(tab);
        }}
        userName={userName}
      />

      {/* 2. Main Content Wrapper (Shifted right on desktop to accommodate w-64 sidebar) */}
      <div className="flex-1 lg:pl-64 flex flex-col min-h-screen">
        <main className="flex-1 max-w-6xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-5 pb-24 lg:pb-12">
          {/* Top Header: Desktop Greeting & Search / Mobile Greeting */}
          <DesktopTopHeader userName={userName} />
          <MobileHeader userName={userName} />

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
              {activeTab === "checkin" && <CheckinView />}
              {activeTab === "coach" && <CoachView />}
              {activeTab === "history" && <HistoryView />}
              {activeTab === "settings" && <SettingsView />}
            </div>
          )}
        </main>
      </div>

      {/* 3. Mobile Bottom Navigation Bar (Learnova 5-Tab Bar) */}
      <MobileBottomNav
        activeTab={activeTab}
        onSelectTab={(tab) => {
          setIsPanicReliefActive(false);
          setActiveTab(tab);
        }}
        userName={userName}
      />
    </div>
  );
}

export default App;
