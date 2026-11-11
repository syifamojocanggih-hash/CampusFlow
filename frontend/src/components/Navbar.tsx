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
} from "lucide-react";
import type { TabKey } from "@/types";

interface NavbarProps {
  activeTab: TabKey;
  onSelectTab: (tab: TabKey) => void;
  userName: string;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  onSelectTab,
  userName,
}) => {
  const navItems: { key: TabKey; label: string; icon: React.ReactNode }[] = [
    { key: "dashboard", label: "Dashboard", icon: <LayoutDashboard className="w-5 h-5" /> },
    { key: "vision-lab", label: "Vision Lab", icon: <FlaskConical className="w-5 h-5" /> },
    { key: "focus", label: "Vision Focus", icon: <Eye className="w-5 h-5" /> },
    { key: "activity", label: "Aktivitas", icon: <Footprints className="w-5 h-5" /> },
    { key: "checkin", label: "Check-in", icon: <ClipboardCheck className="w-5 h-5" /> },
    { key: "coach", label: "AI Coach", icon: <Bot className="w-5 h-5" /> },
    { key: "history", label: "Riwayat", icon: <History className="w-5 h-5" /> },
    { key: "settings", label: "Pengaturan", icon: <Settings className="w-5 h-5" /> },
  ];

  return (
    <>
      {/* Top Navbar Header */}
      <header className="sticky top-0 z-30 bg-white/90 backdrop-blur-md border-b border-slate-200">
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-primary flex items-center justify-center text-white font-bold shadow-xs">
              CF
            </div>
            <div>
              <span className="font-heading font-bold text-lg text-textMain tracking-tight">
                CampusFlow
              </span>
              <span className="hidden sm:inline-block ml-2 text-xs text-slate-500 font-medium border-l border-slate-200 pl-2">
                Techcomfest 2027
              </span>
            </div>
          </div>

          {/* Desktop Navigation Links */}
          <nav className="hidden lg:flex items-center gap-1">
            {navItems.map((item) => {
              const isActive = activeTab === item.key;
              return (
                <button
                  key={item.key}
                  onClick={() => onSelectTab(item.key)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                    isActive
                      ? "bg-blue-50 text-primary font-semibold"
                      : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
                  }`}
                >
                  {item.icon}
                  {item.label}
                </button>
              );
            })}
          </nav>

          {/* User Profile Badge */}
          <div className="flex items-center gap-2">
            <span className="hidden md:inline-block text-xs text-slate-600 font-medium">
              {userName}
            </span>
            <div className="w-8 h-8 rounded-full bg-teal-100 text-teal-800 text-xs font-semibold flex items-center justify-center border border-teal-200">
              {userName ? userName.charAt(0).toUpperCase() : "M"}
            </div>
          </div>
        </div>
      </header>

      {/* Mobile Bottom Navigation Bar */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-slate-200 px-2 py-1 flex justify-around items-center shadow-lg safe-bottom">
        {navItems.slice(0, 5).map((item) => {
          const isActive = activeTab === item.key;
          return (
            <button
              key={item.key}
              onClick={() => onSelectTab(item.key)}
              className={`flex flex-col items-center justify-center py-1 px-2 rounded-lg text-[10px] transition-colors ${
                isActive
                  ? "text-primary font-semibold"
                  : "text-slate-500 hover:text-slate-800"
              }`}
            >
              {item.icon}
              <span className="mt-0.5">{item.label}</span>
            </button>
          );
        })}
      </nav>
    </>
  );
};

