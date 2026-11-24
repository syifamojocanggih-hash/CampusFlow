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
import { NotificationPopover } from "@/components/notifications/NotificationPopover";
import type { TabKey } from "@/types";

interface NavbarProps {
  activeTab: TabKey;
  onSelectTab: (tab: TabKey) => void;
  userName: string;
  onBackToLanding?: () => void;
}

export const navItems: { key: TabKey; label: string; icon: React.ReactNode }[] = [
  { key: "dashboard", label: "Dashboard", icon: <LayoutDashboard className="w-5 h-5" /> },
  { key: "focus", label: "Workstation & Jeda", icon: <Eye className="w-5 h-5" /> },
  { key: "activity", label: "Aktivitas & Check-in", icon: <Footprints className="w-5 h-5" /> },
  { key: "coach", label: "AI Coach", icon: <Bot className="w-5 h-5" /> },
  { key: "history", label: "Riwayat", icon: <History className="w-5 h-5" /> },
];

export const DesktopSidebar: React.FC<NavbarProps> = ({
  activeTab,
  onSelectTab,
  userName: _userName,
  onBackToLanding,
}) => {
  return (
    <aside className="hidden lg:flex flex-col w-64 bg-[#FAF6F0] border-r border-[#E8DDCF] min-h-screen p-5 fixed top-0 left-0 bottom-0 z-30 justify-between select-none shadow-[2px_0_10px_rgba(74,59,44,0.05)]">
      <div className="space-y-6">
        {/* Brand Header */}
        <div className="flex items-center gap-3 px-2">
          <div className="w-10 h-10 rounded-xl bg-[#CFD8C4] flex items-center justify-center text-[#2F3A2E] shadow-xs">
            <GraduationCap className="w-6 h-6" />
          </div>
          <div>
            <span className="font-heading font-extrabold text-lg text-[#2F3A2E] tracking-tight block">
              CampusFlow
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
                className={`w-full flex items-center gap-3 px-3.5 py-3 rounded-xl text-xs font-semibold transition-all duration-200 text-left ${
                  isActive
                    ? "bg-[#CFD8C4] text-[#2F3A2E] font-extrabold shadow-xs border border-[#BCC8AE]"
                    : "text-[#636B60] hover:text-[#2F3A2E] hover:bg-[#FAF6F0]"
                }`}
              >
                <span className={`${isActive ? "text-[#2F3A2E]" : "text-[#636B60]"}`}>
                  {item.icon}
                </span>
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>
      </div>

      {/* Logout Button in Sidebar */}
      {onBackToLanding && (
        <div className="pt-4 border-t border-[#E8DDCF]">
          <button
            onClick={onBackToLanding}
            className="w-full py-2.5 px-3 rounded-xl text-xs font-bold text-[#636B60] hover:text-[#2F3A2E] hover:bg-[#FAF6F0] transition-all flex items-center gap-2 group"
            title="Log out"
          >
            <LogOut className="w-4 h-4 text-[#636B60] group-hover:text-[#2F3A2E] transition-colors" />
            <span>Log out</span>
          </button>
        </div>
      )}
    </aside>
  );
};

export const DesktopTopHeader: React.FC<{
  userName: string;
  onBackToLanding?: () => void;
  activeTab?: TabKey;
  onSelectTab?: (tab: TabKey) => void;
}> = ({ userName, onBackToLanding: _onBackToLanding, activeTab, onSelectTab }) => {
  const [isNotifOpen, setIsNotifOpen] = useState(false);
  const [unreadNotifCount, setUnreadNotifCount] = useState(3);

  return (
    <header className={`hidden lg:flex items-center justify-between ${activeTab === "dashboard" ? "pb-6 mb-2" : "pb-4 mb-2"}`}>
      {activeTab === "dashboard" ? (
        <div>
          <h1 className="font-heading font-extrabold text-2xl text-[#2F3A2E] flex items-center gap-2">
            Hello, {userName.split(" ")[0]}!{" "}
            <span className="text-xl inline-block transition-transform duration-200 hover:rotate-12 origin-bottom-right cursor-default select-none">
              👋
            </span>
          </h1>
          <p className="text-xs text-[#636B60] font-medium mt-0.5">
            Your boards look so good! Let&apos;s keep the active momentum.
          </p>
        </div>
      ) : (
        <div />
      )}

      <div className="flex items-center gap-3">
        {/* Search Bar */}
        <div className="relative">
          <Search className="w-4 h-4 text-[#636B60] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            placeholder="Search metric, activity, or class..."
            className="pl-10 pr-4 py-2.5 text-xs bg-[#FAF6F0] border border-[#E8DDCF] rounded-full w-64 focus:outline-none focus:bg-white focus:border-[#E8DDCF] text-[#2F3A2E] placeholder-[#636B60] shadow-xs transition-all"
          />
        </div>

        {/* Notification Bell with interactive popover */}
        <div className="relative">
          <button
            onClick={() => setIsNotifOpen((prev) => !prev)}
            className={`relative w-10 h-10 rounded-full border flex items-center justify-center transition-colors shadow-xs ${
              isNotifOpen
                ? "bg-[#CFD8C4] border-[#BCC8AE] text-[#2F3A2E]"
                : "bg-[#FAF6F0] border-[#E8DDCF] text-[#2F3A2E] hover:bg-white"
            }`}
            title="Notifikasi & Pengingat"
            aria-label="Buka notifikasi"
            aria-expanded={isNotifOpen}
          >
            <Bell className="w-4 h-4" />
            {unreadNotifCount > 0 && (
              <span className="min-w-[18px] h-[18px] px-1 rounded-full bg-[#E8DDCF] text-[#636B60] font-extrabold text-[10px] flex items-center justify-center absolute -top-1 -right-1 ring-2 ring-white shadow-xs animate-in zoom-in-75">
                {unreadNotifCount}
              </span>
            )}
          </button>

          <NotificationPopover
            isOpen={isNotifOpen}
            onClose={() => setIsNotifOpen(false)}
            onSelectTab={onSelectTab}
            unreadCount={unreadNotifCount}
            onUnreadCountChange={setUnreadNotifCount}
          />
        </div>

        {/* Settings Button with Gear Icon at the Top */}
        {onSelectTab && (
          <button
            onClick={() => onSelectTab("settings")}
            className={`w-10 h-10 rounded-full border flex items-center justify-center transition-colors shadow-xs ${
              activeTab === "settings"
                ? "bg-[#CFD8C4] border-[#BCC8AE] text-[#2F3A2E]"
                : "bg-[#FAF6F0] border-[#E8DDCF] text-[#2F3A2E] hover:bg-white"
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
                ? "bg-[#CFD8C4] border-[#BCC8AE] text-[#2F3A2E] scale-105"
                : "bg-[#CFD8C4] border-transparent text-[#2F3A2E] hover:opacity-90"
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
  const [isNotifOpen, setIsNotifOpen] = useState(false);
  const [unreadNotifCount, setUnreadNotifCount] = useState(3);

  return (
    <div className={`lg:hidden flex items-center justify-between relative z-30 ${activeTab === "dashboard" ? "pb-4" : "pb-3"}`}>
      {activeTab === "dashboard" ? (
        <div>
          <h1 className="font-heading font-bold text-lg text-[#2F3A2E] flex items-center gap-1.5">
            Hello, {userName.split(" ")[0]}!{" "}
            <span className="text-base inline-block transition-transform duration-200 hover:rotate-12 origin-bottom-right cursor-default select-none">
              👋
            </span>
          </h1>
          <p className="text-[11px] text-[#636B60] font-medium">
            Duduk Sehat &bull; Gerak Terukur
          </p>
        </div>
      ) : (
        <div />
      )}

      <div className="flex items-center gap-2">
        {/* Mobile Notification Bell */}
        <div className="relative">
          <button
            onClick={() => setIsNotifOpen((prev) => !prev)}
            className={`relative w-9 h-9 rounded-full border flex items-center justify-center transition-colors shadow-xs ${
              isNotifOpen
                ? "bg-[#CFD8C4] border-[#BCC8AE] text-[#2F3A2E]"
                : "bg-[#FAF6F0] border-[#E8DDCF] text-[#2F3A2E]"
            }`}
            title="Notifikasi"
            aria-label="Buka notifikasi"
            aria-expanded={isNotifOpen}
          >
            <Bell className="w-4 h-4" />
            {unreadNotifCount > 0 && (
              <span className="w-2.5 h-2.5 rounded-full bg-[#E8DDCF] absolute top-1 right-1 ring-2 ring-white" />
            )}
          </button>

          <NotificationPopover
            isOpen={isNotifOpen}
            onClose={() => setIsNotifOpen(false)}
            onSelectTab={onSelectTab}
            unreadCount={unreadNotifCount}
            onUnreadCountChange={setUnreadNotifCount}
          />
        </div>

        {/* User Logo Avatar with Dropdown containing Settings */}
        <div className="relative">
          <button
            onClick={() => setUserMenuOpen((prev) => !prev)}
            className="w-9 h-9 rounded-full bg-[#E8DDCF] text-[#636B60] font-bold flex items-center justify-center text-xs shadow-xs ring-2 ring-[#E8DDCF] focus:outline-none cursor-pointer"
            aria-label="Buka menu user"
            aria-expanded={userMenuOpen}
          >
            {userName ? userName.charAt(0).toUpperCase() : "H"}
            <span className="w-2.5 h-2.5 rounded-full bg-[#CFD8C4] absolute -top-0.5 -right-0.5 ring-2 ring-white" />
          </button>

          {/* User Dropdown Menu on Mobile */}
          {userMenuOpen && (
            <div className="absolute right-0 mt-2 w-48 bg-white rounded-2xl shadow-xl border border-[#E8DDCF] py-1.5 z-50 animate-in fade-in zoom-in-95 duration-150">
              <div className="px-3.5 py-2 border-b border-[#E8DDCF]">
                <p className="text-xs font-bold text-[#2F3A2E] truncate">{userName}</p>
                <p className="text-[10px] text-[#636B60] font-medium">Mahasiswa Aktif</p>
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
                        ? "bg-[#CFD8C4] text-[#2F3A2E] font-bold"
                        : "text-[#2F3A2E] hover:bg-[#FAF6F0]"
                    }`}
                  >
                    <User className="w-4 h-4 text-[#2F3A2E]" />
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
                        ? "bg-[#CFD8C4] text-[#2F3A2E] font-bold"
                        : "text-[#2F3A2E] hover:bg-[#FAF6F0]"
                    }`}
                  >
                    <Settings className="w-4 h-4 text-[#2F3A2E]" />
                    <span>Pengaturan</span>
                  </button>
                )}

                {onBackToLanding && (
                  <button
                    onClick={() => {
                      setUserMenuOpen(false);
                      onBackToLanding();
                    }}
                    className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold text-[#2F3A2E] hover:bg-[#FAF6F0] text-left transition-colors"
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
    <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-[#FAF6F0]/95 backdrop-blur-md border-t border-[#E8DDCF] px-2 py-2 shadow-lg safe-bottom">
      <div className="relative grid grid-cols-5 items-center max-w-md mx-auto">
        {/* Animated Sliding & Bouncing Water Lily Pill Indicator */}
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
              className="w-[84%] h-[92%] bg-[#CFD8C4] border border-[#BCC8AE] rounded-2xl shadow-xs animate-nav-bounce"
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
                  ? "text-[#2F3A2E] font-extrabold"
                  : "text-[#636B60] hover:text-[#2F3A2E] font-medium"
              }`}
            >
              <span
                className={`transition-all duration-300 ${
                  isActive ? "text-[#2F3A2E] scale-110 -translate-y-0.5" : "text-[#636B60] scale-100"
                }`}
              >
                {item.icon}
              </span>
              <span className={`text-[10px] mt-0.5 tracking-tight ${isActive ? "font-extrabold text-[#2F3A2E]" : ""}`}>
                {item.label.split(" ")[0]}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};
