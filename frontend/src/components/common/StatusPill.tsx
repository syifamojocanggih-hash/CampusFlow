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
        className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-[#98C5E2] text-[#1A1A1A] border border-[#7BB1D3] ${className}`}
      >
        {showIcon && <CheckCircle2 className="w-3.5 h-3.5 text-[#1A1A1A] shrink-0" />}
        Optimal
      </span>
    );
  }

  if (normalized === "WASPADA" || normalized === "MODERATE" || normalized === "IN_PROGRESS") {
    return (
      <span
        className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-[#FDECD8] text-[#1A1A1A] border border-[#E5C19A] ${className}`}
      >
        {showIcon && <AlertTriangle className="w-3.5 h-3.5 text-[#1A1A1A] shrink-0" />}
        Waspada
      </span>
    );
  }

  if (normalized === "LIVE" || normalized === "AKTIF") {
    return (
      <span
        className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-extrabold bg-[#98C5E2] text-[#1A1A1A] border border-[#7BB1D3] shadow-xs ${className}`}
      >
        {showIcon && <span className="w-2 h-2 rounded-full bg-[#1A1A1A] animate-pulse shrink-0" />}
        Live Sesi
      </span>
    );
  }

  if (normalized === "UPCOMING") {
    return (
      <span
        className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-[#FAF5EF] text-[#6E5D4F] border border-[#E6D7C8] ${className}`}
      >
        {showIcon && <Sparkles className="w-3 h-3 text-[#6E5D4F] shrink-0" />}
        Upcoming
      </span>
    );
  }

  // TINGGI / ALERT / HIGH
  return (
    <span
      className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-[#BF7E46] text-[#1A1A1A] border border-[#A66935] ${className}`}
    >
      {showIcon && <AlertCircle className="w-3.5 h-3.5 text-[#1A1A1A] shrink-0" />}
      Tinggi
    </span>
  );
};
