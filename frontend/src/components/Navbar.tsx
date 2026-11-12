import React from "react";
import {
  LayoutDashboard,
  Eye,
  Footprints,
  ClipboardCheck,
  Bot,
  History,
  Settings,
  FlaskConical,
  GraduationCap,
  Bell,
  Search,
} from "lucide-react";
import type { TabKey } from "@/types";

interface NavbarProps {
  activeTab: TabKey;
  onSelectTab: (tab: TabKey) => void;
  userName: string;
}

export const navItems: { key: TabKey; label: string; icon: React.ReactNode }[] = [
  { key: "dashboard", label: "Dashboard", icon: <LayoutDashboard className="w-5 h-5" /> },
  { key: "focus", label: "Vision Focus", icon: <Eye className="w-5 h-5" /> },
  { key: "vision-lab", label: "Vision Lab", icon: <FlaskConical className="w-5 h-5" /> },
  { key: "activity", label: "Aktivitas (METs)", icon: <Footprints className="w-5 h-5" /> },
  { key: "checkin", label: "Check-in PSS", icon: <ClipboardCheck className="w-5 h-5" /> },
  { key: "coach", label: "AI Coach", icon: <Bot className="w-5 h-5" /> },
  { key: "history", label: "Riwayat", icon: <History className="w-5 h-5" /> },
  { key: "settings", label: "Pengaturan", icon: <Settings className="w-5 h-5" /> },
];

export const DesktopSidebar: React.FC<NavbarProps> = ({
  activeTab,
  onSelectTab,
  userName,
}) => {
  return (
    <aside className="hidden lg:flex flex-col w-64 bg-white border-r border-[#E8E8E8] min-h-screen p-5 fixed top-0 left-0 bottom-0 z-30 justify-between select-none shadow-[2px_0_10px_rgba(26,26,26,0.03)]">
      <div className="space-y-6">
        {/* Brand Header */}
        <div className="flex items-center gap-3 px-2">
          <div className="w-10 h-10 rounded-2xl bg-[#BDE6F0] flex items-center justify-center text-[#1A1A1A] shadow-xs">
            <GraduationCap className="w-6 h-6" />
          </div>
          <div>
            <span className="font-heading font-extrabold text-lg text-[#1A1A1A] tracking-tight block">
              CampusFlow
            </span>
            <span className="text-[10px] text-[#9A9A9A] font-semibold tracking-wide">
              Smart Wellbeing LMS
            </span>
          </div>
        </div>

        {/* Navigation List */}
        <nav className="space-y-1.5">
          {navItems.map((item) => {
            const isActive = activeTab === item.key;
            return (
              <button
                key={item.key}
                onClick={() => onSelectTab(item.key)}
                className={`w-full flex items-center gap-3 px-3.5 py-3 rounded-2xl text-xs font-semibold transition-all duration-200 text-left ${
                  isActive
                    ? "bg-[#FFF29A] text-[#1A1A1A] font-extrabold shadow-sm"
                    : "text-[#9A9A9A] hover:text-[#1A1A1A] hover:bg-[#F6F6F6]"
                }`}
              >
                <span className={`${isActive ? "text-[#1A1A1A]" : "text-[#9A9A9A]"}`}>
                  {item.icon}
                </span>
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>
      </div>

      {/* User Profile Snippet in Sidebar */}
      <div className="pt-4 border-t border-[#E8E8E8]">
        <div className="flex items-center gap-3 p-2 rounded-2xl hover:bg-[#F6F6F6] transition-colors cursor-pointer">
          <div className="w-10 h-10 rounded-full bg-[#F7A8B0] text-[#1A1A1A] font-bold flex items-center justify-center text-sm shadow-xs ring-2 ring-white">
            {userName ? userName.charAt(0).toUpperCase() : "H"}
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-xs font-bold text-[#1A1A1A] truncate">{userName}</p>
            <p className="text-[11px] text-[#9A9A9A] font-medium truncate">Mahasiswa Aktif</p>
          </div>
        </div>
      </div>
    </aside>
  );
};

export const DesktopTopHeader: React.FC<{ userName: string }> = ({ userName }) => {
  return (
    <header className="hidden lg:flex items-center justify-between pb-6 mb-2">
      <div>
        <h1 className="font-heading font-extrabold text-2xl text-[#1A1A1A] flex items-center gap-2">
          Hello, {userName.split(" ")[0]}! <span className="text-xl">👋</span>
        </h1>
        <p className="text-xs text-[#9A9A9A] font-medium mt-0.5">
          Your boards look so good! Let&apos;s keep the active momentum.
        </p>
      </div>

      <div className="flex items-center gap-3">
        {/* Search Bar */}
        <div className="relative">
          <Search className="w-4 h-4 text-[#9A9A9A] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            placeholder="Search metric, activity, or class..."
            className="pl-10 pr-4 py-2.5 text-xs bg-[#F6F6F6] border border-[#E8E8E8] rounded-full w-64 focus:outline-none focus:bg-white focus:border-[#BDE6F0] text-[#1A1A1A] placeholder-[#9A9A9A] shadow-xs transition-all"
          />
        </div>

        {/* Notification Bell */}
        <button
          className="relative w-10 h-10 rounded-full bg-[#F6F6F6] border border-[#E8E8E8] flex items-center justify-center text-[#1A1A1A] hover:bg-white transition-colors shadow-xs"
          title="Notifikasi"
        >
          <Bell className="w-4 h-4" />
          <span className="w-2.5 h-2.5 rounded-full bg-[#F7A8B0] absolute top-2 right-2 ring-2 ring-white" />
        </button>
      </div>
    </header>
  );
};

export const MobileHeader: React.FC<{ userName: string }> = ({ userName }) => {
  return (
    <div className="lg:hidden flex items-center justify-between pb-4">
      <div>
        <h1 className="font-heading font-bold text-lg text-[#1A1A1A] flex items-center gap-1.5">
          Hello, {userName.split(" ")[0]}! <span className="text-base">👋</span>
        </h1>
        <p className="text-[11px] text-[#9A9A9A] font-medium">
          Duduk Sehat &bull; Gerak Terukur
        </p>
      </div>
      <div className="relative">
        <div className="w-9 h-9 rounded-full bg-[#F7A8B0] text-[#1A1A1A] font-bold flex items-center justify-center text-xs shadow-xs ring-2 ring-white">
          {userName ? userName.charAt(0).toUpperCase() : "H"}
        </div>
        <span className="w-2.5 h-2.5 rounded-full bg-[#F7A8B0] absolute -top-0.5 -right-0.5 ring-2 ring-white" />
      </div>
    </div>
  );
};

export const MobileBottomNav: React.FC<NavbarProps> = ({ activeTab, onSelectTab }) => {
  const primaryMobileItems = [
    navItems[0], // Dashboard
    navItems[1], // Focus
    navItems[2], // Vision Lab
    navItems[3], // Activity
    navItems[5], // Coach
  ];

  return (
    <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-[#E8E8E8] px-3 py-2 flex justify-around items-center shadow-lg safe-bottom">
      {primaryMobileItems.map((item) => {
        const isActive = activeTab === item.key;
        return (
          <button
            key={item.key}
            onClick={() => onSelectTab(item.key)}
            className={`flex flex-col items-center justify-center py-1.5 px-3 rounded-2xl transition-all duration-200 ${
              isActive
                ? "bg-[#FFF29A] text-[#1A1A1A] font-bold shadow-xs"
                : "text-[#9A9A9A] hover:text-[#1A1A1A] font-medium"
            }`}
          >
            <span className={`${isActive ? "text-[#1A1A1A] scale-105" : "text-[#9A9A9A]"} transition-transform`}>
              {item.icon}
            </span>
            <span className="text-[10px] mt-0.5 tracking-tight">{item.label.split(" ")[0]}</span>
          </button>
        );
      })}
    </nav>
  );
};
