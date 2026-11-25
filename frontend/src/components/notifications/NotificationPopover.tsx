import React, { useState, useEffect, useRef } from "react";
import {
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
import { api } from "@/lib/api";

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

const VALID_CATEGORIES: ReadonlyArray<NotificationItem["category"]> = [
  "break",
  "academic",
  "coach",
  "streak",
  "info",
];

const VALID_TABS: ReadonlyArray<TabKey> = [
  "dashboard",
  "focus",
  "activity",
  "coach",
  "history",
  "profile",
  "settings",
  "vision-lab",
];

function formatRelativeTimeId(isoDate: string): string {
  const ts = new Date(isoDate).getTime();
  if (Number.isNaN(ts)) return "Hari ini";
  const diffMins = Math.max(0, Math.floor((Date.now() - ts) / 60_000));
  if (diffMins < 1) return "Baru saja";
  if (diffMins < 60) return `${diffMins} menit lalu`;
  const diffHours = Math.floor(diffMins / 60);
  if (diffHours < 24) return `${diffHours} jam lalu`;
  const diffDays = Math.floor(diffHours / 24);
  if (diffDays === 1) return "Kemarin";
  return `${diffDays} hari lalu`;
}

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
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  const popoverRef = useRef<HTMLDivElement>(null);

  const fetchNotifications = React.useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await api.getNotifications();
      const rawItems = Array.isArray(res?.data?.items) ? res.data.items : [];
      const mapped: NotificationItem[] = rawItems.map((item) => {
        const cat = VALID_CATEGORIES.includes(item.category as NotificationItem["category"])
          ? (item.category as NotificationItem["category"])
          : "info";
        const tab =
          item.actionTab && VALID_TABS.includes(item.actionTab as TabKey)
            ? (item.actionTab as TabKey)
            : undefined;
        return {
          id: item.id,
          title: item.title,
          message: item.message,
          category: cat,
          time: formatRelativeTimeId(item.createdAt),
          isRead: Boolean(item.isRead),
          actionLabel: item.actionLabel || undefined,
          actionTab: tab,
        };
      });
      setNotifications(mapped);
      const count =
        typeof res?.data?.unreadCount === "number"
          ? res.data.unreadCount
          : mapped.filter((n) => !n.isRead).length;
      onUnreadCountChange(count);
    } catch {
      setNotifications([]);
      onUnreadCountChange(0);
    } finally {
      setIsLoading(false);
    }
  }, [onUnreadCountChange]);

  // Load initial notifications on mount and refresh whenever popover opens
  useEffect(() => {
    void fetchNotifications();
  }, [fetchNotifications]);

  useEffect(() => {
    if (isOpen) {
      void fetchNotifications();
    }
  }, [isOpen, fetchNotifications]);

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
    setNotifications((prev) => {
      const next = prev.map((n) => (n.id === id ? { ...n, isRead: true } : n));
      onUnreadCountChange(next.filter((n) => !n.isRead).length);
      return next;
    });
    void api.markNotificationRead(id).catch(() => {});
  };

  const markAllAsRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
    onUnreadCountChange(0);
    void api.markAllNotificationsRead().catch(() => {});
  };

  const deleteNotification = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setNotifications((prev) => {
      const next = prev.filter((n) => n.id !== id);
      onUnreadCountChange(next.filter((n) => !n.isRead).length);
      return next;
    });
    void api.deleteNotification(id).catch(() => {});
  };

  const filteredNotifs = notifications;

  const renderIcon = (category: NotificationItem["category"]) => {
    switch (category) {
      case "break":
        return (
          <div className="w-9 h-9 rounded-xl bg-[#CFD8C4] border border-[#BCC8AE] text-[#2F3A2E] flex items-center justify-center shrink-0 shadow-2xs">
            <Eye className="w-4 h-4" />
          </div>
        );
      case "academic":
        return (
          <div className="w-9 h-9 rounded-xl bg-[#CFD8C4] border border-[#BCC8AE] text-[#2F3A2E] flex items-center justify-center shrink-0 shadow-2xs">
            <BookOpen className="w-4 h-4" />
          </div>
        );
      case "coach":
        return (
          <div className="w-9 h-9 rounded-xl bg-[#CFD8C4] border border-[#BCC8AE] text-[#2F3A2E] flex items-center justify-center shrink-0 shadow-2xs">
            <Bot className="w-4 h-4" />
          </div>
        );
      case "streak":
        return (
          <div className="w-9 h-9 rounded-xl bg-[#CFD8C4] border border-[#BCC8AE] text-[#2F3A2E] flex items-center justify-center shrink-0 shadow-2xs">
            <Sparkles className="w-4 h-4" />
          </div>
        );
      default:
        return (
          <div className="w-9 h-9 rounded-xl bg-[#FAF6F0] text-[#2F3A2E] flex items-center justify-center shrink-0 shadow-2xs">
            <Info className="w-4 h-4" />
          </div>
        );
    }
  };

  return (
    <div
      ref={popoverRef}
      className="absolute right-0 top-12 z-50 w-80 sm:w-96 bg-white rounded-3xl shadow-2xl border border-[#E8DDCF] overflow-hidden animate-in fade-in zoom-in-95 duration-150 flex flex-col max-h-[85vh]"
    >
      {/* Popover Header */}
      <div className="px-4 py-3 border-b border-[#E8DDCF] bg-[#FAF6F0] flex items-center justify-between gap-2">
        <span className="font-heading font-extrabold text-xs text-[#2F3A2E]">
          Notifikasi &amp; Pengingat
        </span>
        {filteredNotifs.some((n) => !n.isRead) && (
          <button
            type="button"
            onClick={markAllAsRead}
            className="text-[11px] font-bold text-[#2F3A2E] hover:underline flex items-center gap-1 cursor-pointer"
          >
            <CheckCheck className="w-3.5 h-3.5" />
            <span>Tandai semua dibaca</span>
          </button>
        )}
      </div>

      {/* Notification List Body */}
      <div className="p-2 space-y-1.5 overflow-y-auto max-h-[360px] divide-y divide-[#E7DCCF]">
        {isLoading && filteredNotifs.length === 0 ? (
          <div className="p-8 text-center text-xs text-[#636B60]">
            Memuat notifikasi...
          </div>
        ) : filteredNotifs.length === 0 ? (
          <div className="p-8 text-center space-y-2 select-none">
            <div className="w-12 h-12 rounded-2xl bg-[#FAF6F0] text-[#636B60] mx-auto flex items-center justify-center">
              <CheckCheck className="w-6 h-6 text-[#2F3A2E]" />
            </div>
            <p className="text-xs font-bold text-[#2F3A2E]">Tidak Ada Notifikasi</p>
            <p className="text-[11px] text-[#636B60] leading-relaxed max-w-[220px] mx-auto">
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
                  ? "bg-white hover:bg-[#FAF6F0] opacity-80 hover:opacity-100"
                  : "bg-[#FAF6F0] hover:bg-[#FAF6F0] border border-[#E8DDCF] shadow-2xs"
              }`}
            >
              {renderIcon(notif.category)}

              <div className="flex-1 min-w-0 pr-4">
                <div className="flex items-center justify-between gap-1">
                  <h4
                    className={`text-xs truncate leading-tight ${
                      notif.isRead
                        ? "font-semibold text-[#2F3A2E]"
                        : "font-extrabold text-[#2F3A2E]"
                    }`}
                  >
                    {notif.title}
                  </h4>
                  {!notif.isRead && (
                    <span className="w-2 h-2 rounded-full bg-[#CFD8C4] shrink-0" />
                  )}
                </div>

                {notif.message && (
                  <p className="text-[11px] text-[#636B60] mt-1 leading-relaxed line-clamp-2">
                    {notif.message}
                  </p>
                )}

                <div className="flex items-center justify-between pt-1.5 mt-0.5">
                  <span className="text-[10px] text-[#636B60] flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {notif.time}
                  </span>

                  {notif.actionLabel && (
                    <span className="text-[11px] font-bold text-[#2F3A2E] hover:underline flex items-center gap-1 group-hover:text-black">
                      <span>{notif.actionLabel}</span>
                      <ArrowRight className="w-3 h-3" />
                    </span>
                  )}
                </div>
              </div>

              {/* Delete button */}
              <button
                onClick={(e) => deleteNotification(notif.id, e)}
                className="opacity-0 group-hover:opacity-100 text-[#636B60] hover:text-[#2F3A2E] p-1 rounded-md transition-opacity absolute top-2 right-2"
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
