import React, { useState, useEffect, useRef } from "react";
import {
  Bell,
  X,
  CheckCheck,
  Eye,
  BookOpen,
  Bot,
  Sparkles,
  ArrowRight,
  Info,
  Clock,
} from "lucide-react";
import type { TabKey } from "@/types";

export interface NotificationItem {
  id: string;
  title: string;
  message: string;
  category: "break" | "academic" | "coach" | "streak" | "info";
  time: string;
  isRead: boolean;
  actionLabel?: string;
  actionTab?: TabKey;
}

const INITIAL_NOTIFICATIONS: NotificationItem[] = [
  {
    id: "notif-1",
    title: "Saatnya Peregangan 2 Menit!",
    message: "Kamu sudah fokus di depan layar cukup lama. Istirahatkan leher dan lakukan Overhead Reach.",
    category: "break",
    time: "5 menit lalu",
    isRead: false,
    actionLabel: "Mulai Jeda Aktif",
    actionTab: "focus",
  },
  {
    id: "notif-2",
    title: "Pekan Ujian Akhir Semester (UAS)",
    message: "Jadwal ujian Interaksi Manusia & Komputer dalam 3 hari ke depan. Pastikan tidur cukup min. 7 jam.",
    category: "academic",
    time: "1 jam lalu",
    isRead: false,
    actionLabel: "Cek Dashboard",
    actionTab: "dashboard",
  },
  {
    id: "notif-3",
    title: "Catatan dari Wellbeing AI Coach",
    message: "Tidur semalam 6.5 jam. Luangkan tidur 30 menit lebih awal malam ini untuk menjaga daya tahan tubuh.",
    category: "coach",
    time: "3 jam lalu",
    isRead: false,
    actionLabel: "Buka AI Coach",
    actionTab: "coach",
  },
  {
    id: "notif-4",
    title: "Bonus Streak Harian (+50 XP)",
    message: "Hebat! Kamu telah mempertahankan konsistensi 5 hari berturut-turut bersama Mimi Streak Pet.",
    category: "streak",
    time: "Kemarin",
    isRead: true,
    actionLabel: "Lihat Profil",
    actionTab: "profile",
  },
];

interface NotificationPopoverProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectTab?: (tab: TabKey) => void;
  unreadCount: number;
  onUnreadCountChange: (count: number) => void;
}

export const NotificationPopover: React.FC<NotificationPopoverProps> = ({
  isOpen,
  onClose,
  onSelectTab,
  onUnreadCountChange,
}) => {
  const [notifications, setNotifications] = useState<NotificationItem[]>(() => {
    const saved = localStorage.getItem("cf_notifications");
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {
        // fallback
      }
    }
    return INITIAL_NOTIFICATIONS;
  });

  const popoverRef = useRef<HTMLDivElement>(null);

  // Sync unread count to parent
  useEffect(() => {
    const unread = notifications.filter((n) => !n.isRead).length;
    onUnreadCountChange(unread);
    localStorage.setItem("cf_notifications", JSON.stringify(notifications));
  }, [notifications, onUnreadCountChange]);

  // Click outside listener
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (popoverRef.current && !popoverRef.current.contains(e.target as Node)) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const markAsRead = (id: string) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, isRead: true } : n))
    );
  };

  const markAllAsRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
  };

  const deleteNotification = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  };

  const filteredNotifs = notifications;

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  const renderIcon = (category: NotificationItem["category"]) => {
    switch (category) {
      case "break":
        return (
          <div className="w-9 h-9 rounded-xl bg-[#CDE8B5] text-[#166534] flex items-center justify-center shrink-0 shadow-2xs">
            <Eye className="w-4 h-4" />
          </div>
        );
      case "academic":
        return (
          <div className="w-9 h-9 rounded-xl bg-[#F7A8B0] text-[#9F1239] flex items-center justify-center shrink-0 shadow-2xs">
            <BookOpen className="w-4 h-4" />
          </div>
        );
      case "coach":
        return (
          <div className="w-9 h-9 rounded-xl bg-[#BDE6F0] text-[#0369A1] flex items-center justify-center shrink-0 shadow-2xs">
            <Bot className="w-4 h-4" />
          </div>
        );
      case "streak":
        return (
          <div className="w-9 h-9 rounded-xl bg-[#FFF29A] text-[#854D0E] flex items-center justify-center shrink-0 shadow-2xs">
            <Sparkles className="w-4 h-4" />
          </div>
        );
      default:
        return (
          <div className="w-9 h-9 rounded-xl bg-[#F0F0F0] text-[#1A1A1A] flex items-center justify-center shrink-0 shadow-2xs">
            <Info className="w-4 h-4" />
          </div>
        );
    }
  };

  return (
    <div
      ref={popoverRef}
      className="absolute right-0 top-12 z-50 w-80 sm:w-96 bg-white rounded-3xl shadow-2xl border border-[#E8E8E8] overflow-hidden animate-in fade-in zoom-in-95 duration-150 flex flex-col max-h-[85vh]"
    >
      {/* Header Popover */}
      <div className="p-4 sm:p-5 border-b border-[#F0F0F0] flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-[#BDE6F0] flex items-center justify-center text-[#1A1A1A] shadow-2xs">
            <Bell className="w-4 h-4" />
          </div>
          <h3 className="font-heading font-extrabold text-sm sm:text-base text-[#1A1A1A] leading-tight flex items-center gap-2">
            <span>Notifikasi</span>
            {unreadCount > 0 && (
              <span className="px-2 py-0.5 rounded-full bg-[#F7A8B0] text-[#9F1239] text-[10px] font-extrabold">
                {unreadCount} Baru
              </span>
            )}
          </h3>
        </div>

        <div className="flex items-center gap-1">
          {unreadCount > 0 && (
            <button
              onClick={markAllAsRead}
              className="px-2.5 py-1 rounded-xl text-[11px] font-bold text-[#1A1A1A] hover:bg-[#F6F6F6] transition-colors flex items-center gap-1"
              title="Tandai semua telah dibaca"
            >
              <CheckCheck className="w-3.5 h-3.5 text-[#166534]" />
              <span className="hidden sm:inline">Tandai Dibaca</span>
            </button>
          )}
          <button
            onClick={onClose}
            className="w-7 h-7 rounded-full bg-[#F6F6F6] hover:bg-[#E8E8E8] text-[#1A1A1A] flex items-center justify-center transition-colors"
            title="Tutup Notifikasi"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Notification List Body */}
      <div className="p-2 space-y-1.5 overflow-y-auto max-h-[360px] divide-y divide-[#F6F6F6]">
        {filteredNotifs.length === 0 ? (
          <div className="p-8 text-center space-y-2 select-none">
            <div className="w-12 h-12 rounded-2xl bg-[#F6F6F6] text-[#9A9A9A] mx-auto flex items-center justify-center">
              <CheckCheck className="w-6 h-6 text-[#166534]" />
            </div>
            <p className="text-xs font-bold text-[#1A1A1A]">Tidak Ada Notifikasi</p>
            <p className="text-[11px] text-[#9A9A9A] leading-relaxed max-w-[220px] mx-auto">
              Semua pengingat telah selesai. Fokus belajar atau nikmati waktu istirahatmu!
            </p>
          </div>
        ) : (
          filteredNotifs.map((notif) => (
            <div
              key={notif.id}
              onClick={() => {
                markAsRead(notif.id);
                if (notif.actionTab && onSelectTab) {
                  onSelectTab(notif.actionTab);
                  onClose();
                }
              }}
              className={`p-3 rounded-2xl transition-all cursor-pointer group flex items-start gap-3 relative ${
                notif.isRead
                  ? "bg-white hover:bg-[#FAFAFA] opacity-80 hover:opacity-100"
                  : "bg-[#FFFDF0] hover:bg-[#FFF9DC] border border-[#FFE966]/40 shadow-2xs"
              }`}
            >
              {renderIcon(notif.category)}

              <div className="flex-1 min-w-0 pr-4">
                <div className="flex items-center justify-between gap-1">
                  <h4
                    className={`text-xs truncate leading-tight ${
                      notif.isRead
                        ? "font-semibold text-[#1A1A1A]"
                        : "font-extrabold text-[#1A1A1A]"
                    }`}
                  >
                    {notif.title}
                  </h4>
                  {!notif.isRead && (
                    <span className="w-2 h-2 rounded-full bg-[#F7A8B0] shrink-0" />
                  )}
                </div>

                <div className="flex items-center justify-between pt-1.5 mt-0.5">
                  <span className="text-[10px] text-[#9A9A9A] flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {notif.time}
                  </span>

                  {notif.actionLabel && (
                    <span className="text-[11px] font-bold text-[#1A1A1A] hover:underline flex items-center gap-1 group-hover:text-black">
                      <span>{notif.actionLabel}</span>
                      <ArrowRight className="w-3 h-3" />
                    </span>
                  )}
                </div>
              </div>

              {/* Delete button */}
              <button
                onClick={(e) => deleteNotification(notif.id, e)}
                className="opacity-0 group-hover:opacity-100 text-[#9A9A9A] hover:text-[#E11D48] p-1 rounded-md transition-opacity absolute top-2 right-2"
                title="Hapus notifikasi ini"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
