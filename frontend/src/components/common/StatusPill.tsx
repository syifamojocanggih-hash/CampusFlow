import React from "react";
import { CheckCircle2, AlertTriangle, AlertCircle } from "lucide-react";

export type StatusType = "OPTIMAL" | "WASPADA" | "TINGGI" | "HIGH" | "HIGH_SEDENTARY_RISK";

interface StatusPillProps {
  status: StatusType | string;
  className?: string;
}

export const StatusPill: React.FC<StatusPillProps> = ({ status, className = "" }) => {
  const normalized = status.toUpperCase();

  if (normalized === "OPTIMAL" || normalized === "LOW") {
    return (
      <span
        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-green-50 text-green-700 border border-green-200 ${className}`}
      >
        <CheckCircle2 className="w-3.5 h-3.5 text-green-600" />
        Optimal
      </span>
    );
  }

  if (normalized === "WASPADA" || normalized === "MODERATE") {
    return (
      <span
        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-amber-50 text-amber-700 border border-amber-200 ${className}`}
      >
        <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
        Waspada
      </span>
    );
  }

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-red-50 text-red-700 border border-red-200 ${className}`}
    >
      <AlertCircle className="w-3.5 h-3.5 text-red-600" />
      Tinggi
    </span>
  );
};

