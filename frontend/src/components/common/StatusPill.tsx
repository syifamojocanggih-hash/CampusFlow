import React from "react";
import { CheckCircle2, AlertTriangle, AlertCircle, Sparkles } from "lucide-react";

export type StatusType = "OPTIMAL" | "WASPADA" | "TINGGI" | "HIGH" | "HIGH_SEDENTARY_RISK" | "LIVE" | "UPCOMING";

interface StatusPillProps {
  status: StatusType | string;
  className?: string;
  showIcon?: boolean;
}

export const StatusPill: React.FC<StatusPillProps> = ({
  status,
  className = "",
  showIcon = true,
}) => {
  const normalized = status.toUpperCase();

  if (normalized === "OPTIMAL" || normalized === "LOW" || normalized === "COMPLETED") {
    return (
      <span
        className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-[#E8DDCF] text-[#2F3A2E] border border-[#CFD8C4] ${className}`}
      >
        {showIcon && <CheckCircle2 className="w-3.5 h-3.5 text-[#2F3A2E] shrink-0" />}
        Optimal
      </span>
    );
  }

  if (normalized === "WASPADA" || normalized === "MODERATE" || normalized === "IN_PROGRESS") {
    return (
      <span
        className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-[#E8DDCF] text-[#2F3A2E] border border-[#E8DDCF] ${className}`}
      >
        {showIcon && <AlertTriangle className="w-3.5 h-3.5 text-[#2F3A2E] shrink-0" />}
        Waspada
      </span>
    );
  }

  if (normalized === "LIVE" || normalized === "AKTIF") {
    return (
      <span
        className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-extrabold bg-[#E8DDCF] text-[#2F3A2E] border border-[#CFD8C4] shadow-xs ${className}`}
      >
        {showIcon && <span className="w-2 h-2 rounded-full bg-[#CFD8C4] animate-pulse shrink-0" />}
        Live Sesi
      </span>
    );
  }

  if (normalized === "UPCOMING") {
    return (
      <span
        className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-[#FAF6F0] text-[#636B60] border border-[#E8DDCF] ${className}`}
      >
        {showIcon && <Sparkles className="w-3 h-3 text-[#636B60] shrink-0" />}
        Upcoming
      </span>
    );
  }

  // TINGGI / ALERT / HIGH
  return (
    <span
      className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-[#E8DDCF] text-[#636B60] border border-[#E8DDCF] ${className}`}
    >
      {showIcon && <AlertCircle className="w-3.5 h-3.5 text-[#2F3A2E] shrink-0" />}
      Tinggi
    </span>
  );
};
