import { useEffect, useState } from "react";
import { Navbar } from "@/components/Navbar";
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

  return (
    <div className="min-h-screen bg-surface flex flex-col pb-20 lg:pb-8">
      {/* Navbar Top & Bottom Mobile */}
      <Navbar
        activeTab={activeTab}
        onSelectTab={(tab) => {
          setIsPanicReliefActive(false);
          setActiveTab(tab);
        }}
        userName={user?.name || "Mahasiswa Demo"}
      />

      {/* Main Container */}
      <main className="flex-1 max-w-6xl w-full mx-auto px-4 py-6">
        {isPanicReliefActive ? (
          <PanicReliefMode
            onClose={() => setIsPanicReliefActive(false)}
            onComplete={() => {
              alert("Selamat! Anda menyelesaikan 15 menit Panic Relief Protocol (+50 XP)");
              setIsPanicReliefActive(false);
            }}
          />
        ) : (
          <>
            {activeTab === "dashboard" && (
              <TriadDashboard
                onStartPanicRelief={() => setIsPanicReliefActive(true)}
                onNavigateToFocus={() => setActiveTab("focus")}
              />
            )}
            {activeTab === "vision-lab" && <VisionLabView />}
            {activeTab === "focus" && <FocusView />}
            {activeTab === "activity" && <ActivityView />}
            {activeTab === "checkin" && <CheckinView />}
            {activeTab === "coach" && <CoachView />}
            {activeTab === "history" && <HistoryView />}
            {activeTab === "settings" && <SettingsView />}
          </>
        )}
      </main>
    </div>
  );
}

export default App;

