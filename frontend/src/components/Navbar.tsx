import React, { useState } from "react";
import {
  LayoutDashboard,
  Eye,
  Footprints,
  Bot,
  History,
  Settings,
  GraduationCap,
  Bell,
  Search,
  LogOut,
  User,
} from "lucide-react";
import type { TabKey } from "@/types";

interface NavbarProps {
  activeTab: TabKey;
  onSelectTab: (tab: TabKey) => void;
  userName: string;
  onBackToLanding?: () => void;
}

export const navItems: { key: TabKey; label: string; icon: React.ReactNode }[] = [
  { key: "dashboard", label: "Dashboard", icon: <LayoutDashboard className="w-5 h-5" /> },
  { key: "focus", label: "Vision Focus", icon: <Eye className="w-5 h-5" /> },
  { key: "activity", label: "Aktivitas & Check-in", icon: <Footprints className="w-5 h-5" /> },
  { key: "coach", label: "AI Coach", icon: <Bot className="w-5 h-5" /> },
  { key: "history", label: "Riwayat", icon: <History className="w-5 h-5" /> },
];

export const DesktopSidebar: React.FC<NavbarProps> = ({
  activeTab,
  onSelectTab,
  userName,
  onBackToLanding,
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

      {/* User Profile Snippet & Logout Button in Sidebar */}
      <div className="pt-4 border-t border-[#E8E8E8] space-y-2">
        <button
          onClick={() => onSelectTab("profile")}
          className={`w-full flex items-center gap-3 p-2 rounded-2xl transition-all text-left ${
            activeTab === "profile"
              ? "bg-[#FFF29A] ring-2 ring-[#FFE966] shadow-xs"
              : "hover:bg-[#F6F6F6]"
          }`}
          title="Atur Profil Pengguna"
        >
          <div className="w-10 h-10 rounded-full bg-[#F7A8B0] text-[#1A1A1A] font-bold flex items-center justify-center text-sm shadow-xs ring-2 ring-white shrink-0">
            {userName ? userName.charAt(0).toUpperCase() : "M"}
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-xs font-bold text-[#1A1A1A] truncate">{userName}</p>
            <p className="text-[11px] text-[#9A9A9A] font-medium truncate flex items-center justify-between">
              <span>Mahasiswa Aktif</span>
              <span className="text-[10px] text-blue-600 font-bold">Edit &rarr;</span>
            </p>
          </div>
        </button>

        {onBackToLanding && (
          <button
            onClick={onBackToLanding}
            className="w-full py-2.5 px-3 rounded-xl text-xs font-bold text-[#9A9A9A] hover:text-rose-600 hover:bg-rose-50/70 transition-all flex items-center justify-between group"
            title="Keluar dari akun (Log out)"
          >
            <span className="flex items-center gap-2">
              <LogOut className="w-4 h-4 text-[#9A9A9A] group-hover:text-rose-500 transition-colors" />
              <span>Log out</span>
            </span>
            <span className="text-[10px] text-[#9A9A9A] group-hover:text-rose-500 font-semibold tracking-wide">
              Keluar &rarr;
            </span>
          </button>
        )}
      </div>
    </aside>
  );
};

export const DesktopTopHeader: React.FC<{
  userName: string;
  onBackToLanding?: () => void;
  activeTab?: TabKey;
  onSelectTab?: (tab: TabKey) => void;
}> = ({ userName, onBackToLanding: _onBackToLanding, activeTab, onSelectTab }) => {
  return (
    <header className="hidden lg:flex items-center justify-between pb-6 mb-2">
      <div>
        <h1 className="font-heading font-extrabold text-2xl text-[#1A1A1A] flex items-center gap-2">
          Hello, {userName.split(" ")[0]}!{" "}
          <span className="text-xl inline-block transition-transform duration-200 hover:rotate-12 origin-bottom-right cursor-default select-none">
            👋
          </span>
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

        {/* Settings Button with Gear Icon at the Top */}
        {onSelectTab && (
          <button
            onClick={() => onSelectTab("settings")}
            className={`w-10 h-10 rounded-full border flex items-center justify-center transition-colors shadow-xs ${
              activeTab === "settings"
                ? "bg-[#FFF29A] border-[#FFE966] text-[#1A1A1A]"
                : "bg-[#F6F6F6] border-[#E8E8E8] text-[#1A1A1A] hover:bg-white"
            }`}
            title="Pengaturan"
            aria-label="Pengaturan"
          >
            <Settings className="w-4 h-4" />
          </button>
        )}

        {/* Profile Avatar Button in Desktop Top Header */}
        {onSelectTab && (
          <button
            onClick={() => onSelectTab("profile")}
            className={`w-10 h-10 rounded-full border flex items-center justify-center transition-all shadow-xs font-bold text-xs ring-2 ring-white active:scale-95 ${
              activeTab === "profile"
                ? "bg-[#FFF29A] border-[#FFE966] text-[#1A1A1A] scale-105"
                : "bg-[#F7A8B0] border-transparent text-[#1A1A1A] hover:opacity-90"
            }`}
            title="Atur Profile Pengguna"
            aria-label="Atur Profile Pengguna"
          >
            {userName ? userName.charAt(0).toUpperCase() : "M"}
          </button>
        )}
      </div>
    </header>
  );
};

export const MobileHeader: React.FC<{
  userName: string;
  onBackToLanding?: () => void;
  activeTab?: TabKey;
  onSelectTab?: (tab: TabKey) => void;
}> = ({ userName, onBackToLanding, activeTab, onSelectTab }) => {
  const [userMenuOpen, setUserMenuOpen] = useState(false);

  return (
    <div className="lg:hidden flex items-center justify-between pb-4 relative z-30">
      <div>
        <h1 className="font-heading font-bold text-lg text-[#1A1A1A] flex items-center gap-1.5">
          Hello, {userName.split(" ")[0]}!{" "}
          <span className="text-base inline-block transition-transform duration-200 hover:rotate-12 origin-bottom-right cursor-default select-none">
            👋
          </span>
        </h1>
        <p className="text-[11px] text-[#9A9A9A] font-medium">
          Duduk Sehat &bull; Gerak Terukur
        </p>
      </div>

      <div className="flex items-center gap-2">
        {/* User Logo Avatar with Dropdown containing Settings */}
        <div className="relative">
          <button
            onClick={() => setUserMenuOpen((prev) => !prev)}
            className="w-9 h-9 rounded-full bg-[#F7A8B0] text-[#1A1A1A] font-bold flex items-center justify-center text-xs shadow-xs ring-2 ring-white focus:outline-none cursor-pointer"
            aria-label="Buka menu user"
            aria-expanded={userMenuOpen}
          >
            {userName ? userName.charAt(0).toUpperCase() : "H"}
            <span className="w-2.5 h-2.5 rounded-full bg-[#FFF29A] absolute -top-0.5 -right-0.5 ring-2 ring-white" />
          </button>

          {/* User Dropdown Menu on Mobile */}
          {userMenuOpen && (
            <div className="absolute right-0 mt-2 w-48 bg-white rounded-2xl shadow-xl border border-[#E8E8E8] py-1.5 z-50 animate-in fade-in zoom-in-95 duration-150">
              <div className="px-3.5 py-2 border-b border-[#F6F6F6]">
                <p className="text-xs font-bold text-[#1A1A1A] truncate">{userName}</p>
                <p className="text-[10px] text-[#9A9A9A] font-medium">Mahasiswa Aktif</p>
              </div>

              <div className="p-1 space-y-0.5">
                {onSelectTab && (
                  <button
                    onClick={() => {
                      onSelectTab("profile");
                      setUserMenuOpen(false);
                    }}
                    className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold text-left transition-colors ${
                      activeTab === "profile"
                        ? "bg-[#FFF29A] text-[#1A1A1A] font-bold"
                        : "text-[#1A1A1A] hover:bg-[#F6F6F6]"
                    }`}
                  >
                    <User className="w-4 h-4 text-[#1A1A1A]" />
                    <span>Atur Profil</span>
                  </button>
                )}

                {onSelectTab && (
                  <button
                    onClick={() => {
                      onSelectTab("settings");
                      setUserMenuOpen(false);
                    }}
                    className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold text-left transition-colors ${
                      activeTab === "settings"
                        ? "bg-[#FFF29A] text-[#1A1A1A] font-bold"
                        : "text-[#1A1A1A] hover:bg-[#F6F6F6]"
                    }`}
                  >
                    <Settings className="w-4 h-4 text-[#1A1A1A]" />
                    <span>Pengaturan</span>
                  </button>
                )}

                {onBackToLanding && (
                  <button
                    onClick={() => {
                      setUserMenuOpen(false);
                      onBackToLanding();
                    }}
                    className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold text-rose-600 hover:bg-rose-50 text-left transition-colors"
                  >
                    <LogOut className="w-4 h-4" />
                    <span>Log out</span>
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export const MobileBottomNav: React.FC<NavbarProps> = ({ activeTab, onSelectTab }) => {
  const activeIndex = navItems.findIndex((item) => item.key === activeTab);

  return (
    <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-[#E8E8E8] px-2 py-2 shadow-lg safe-bottom">
      <div className="relative grid grid-cols-5 items-center max-w-md mx-auto">
        {/* Animated Sliding & Bouncing Yellow Pill Indicator */}
        {activeIndex !== -1 && (
          <div
            className="absolute top-0 bottom-0 left-0 pointer-events-none z-0 flex items-center justify-center transition-transform duration-500"
            style={{
              width: "20%",
              transform: `translateX(${activeIndex * 100}%)`,
              transitionTimingFunction: "cubic-bezier(0.34, 1.56, 0.64, 1)",
            }}
          >
            <div
              key={activeTab}
              className="w-[84%] h-[92%] bg-[#FFF29A] border border-[#FFE966] rounded-2xl shadow-xs animate-nav-bounce"
            />
          </div>
        )}

        {navItems.map((item) => {
          const isActive = activeTab === item.key;
          return (
            <button
              key={item.key}
              onClick={() => onSelectTab(item.key)}
              className={`relative z-10 flex flex-col items-center justify-center py-1.5 px-1 rounded-2xl transition-all duration-300 ${
                isActive
                  ? "text-[#1A1A1A] font-extrabold"
                  : "text-[#9A9A9A] hover:text-[#1A1A1A] font-medium"
              }`}
            >
              <span
                className={`transition-all duration-300 ${
                  isActive ? "text-[#1A1A1A] scale-110 -translate-y-0.5" : "text-[#9A9A9A] scale-100"
                }`}
              >
                {item.icon}
              </span>
              <span className={`text-[10px] mt-0.5 tracking-tight ${isActive ? "font-extrabold text-[#1A1A1A]" : ""}`}>
                {item.label.split(" ")[0]}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};
