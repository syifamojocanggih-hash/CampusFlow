import type {
  AutoSleepRecordDTO,
  SleepClinicalStatus,
  SleepDetectionSource,
} from "../../../shared/contracts/index.ts";

export function getLocalTodayDateString(d: Date = new Date()): string {
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

export function formatTimeHHMM(timestampMs: number): string {
  const d = new Date(timestampMs);
  const hh = String(d.getHours()).padStart(2, "0");
  const mm = String(d.getMinutes()).padStart(2, "0");
  return `${hh}:${mm}`;
}

export function parseHHMMToTimestamps(
  bedTime: string,
  wakeTime: string,
  referenceDateStr?: string
): { lastActiveTimestamp: number; firstWakeTimestamp: number } {
  const dateStr = referenceDateStr || getLocalTodayDateString();
  const baseDate = new Date(`${dateStr}T00:00:00`);

  const [bedH = 23, bedM = 15] = bedTime.split(":").map((n) => Number(n) || 0);
  const [wakeH = 6, wakeM = 45] = wakeTime.split(":").map((n) => Number(n) || 0);

  const wakeDate = new Date(baseDate);
  wakeDate.setHours(wakeH, wakeM, 0, 0);

  const bedDate = new Date(baseDate);
  bedDate.setHours(bedH, bedM, 0, 0);

  if (bedDate.getTime() >= wakeDate.getTime()) {
    bedDate.setDate(bedDate.getDate() - 1);
  }

  return {
    lastActiveTimestamp: bedDate.getTime(),
    firstWakeTimestamp: wakeDate.getTime(),
  };
}

export function inferSleepQualityScore(sleepHours: number, bedTimeHHMM: string): number {
  const [bedHour = 23] = bedTimeHHMM.split(":").map((n) => Number(n) || 0);
  const isHealthyCircadianBedtime = bedHour >= 20 || bedHour === 0;

  if (sleepHours >= 7.0 && sleepHours <= 9.0) {
    return isHealthyCircadianBedtime ? 5 : 4;
  }
  if ((sleepHours >= 6.0 && sleepHours < 7.0) || (sleepHours > 9.0 && sleepHours <= 10.5)) {
    return 3;
  }
  if ((sleepHours >= 5.0 && sleepHours < 6.0) || sleepHours > 10.5) {
    return 2;
  }
  return 1;
}

export function classifySleepClinicalStatus(sleepHours: number): SleepClinicalStatus {
  if (sleepHours < 5.5) return "CRITICAL_DEFICIT";
  if (sleepHours < 7.0) return "DEFICIT_WARNING";
  if (sleepHours <= 9.5) return "OPTIMAL";
  return "OVERSLEEP";
}

export function calculateSleepRecoveryPoints(sleepHours: number): number {
  const clamped = Math.max(0, Math.min(sleepHours, 8.0));
  return Math.min(40, Math.round((clamped / 8.0) * 40));
}

export function getSleepSourceLabel(source: SleepDetectionSource): string {
  switch (source) {
    case "OS_POWER_MONITOR":
      return "Sensor OS Sleep/Wake";
    case "OVERNIGHT_INACTIVITY":
      return "Auto Inaktivitas Malam";
    case "WEARABLE_SYNC":
      return "Sinkronisasi Wearable";
    case "AI_NLP_CHAT":
      return "Ekstraksi Chat AI Coach";
    case "MANUAL_OVERRIDE":
      return "Koreksi Manual";
    case "SMART_BASELINE":
    default:
      return "Auto Baseline Harian";
  }
}

export function getSleepClinicalMeta(status: SleepClinicalStatus): {
  label: string;
  badgeStyle: string;
  description: string;
} {
  switch (status) {
    case "OPTIMAL":
      return {
        label: "Tidur Optimal",
        badgeStyle: "bg-[#98C5E2] text-[#1E4E6E] border-[#7BB1D3]",
        description: "Durasi tidur memenuhi target pemulihan biologis 7.0–9.0 jam.",
      };
    case "DEFICIT_WARNING":
      return {
        label: "Defisit Ringan",
        badgeStyle: "bg-[#FDECD8] text-[#7C4A1E] border-[#E5C19A]",
        description: "Tidur sedikit di bawah 7 jam. Disarankan jeda aktif lebih sering.",
      };
    case "CRITICAL_DEFICIT":
      return {
        label: "Defisit Kritis",
        badgeStyle: "bg-[#BF7E46] text-[#231408] border-[#A66935]",
        description: "Kurang tidur parah (<5.5 jam). AI Coach membatasi latihan fisik berat.",
      };
    case "OVERSLEEP":
      return {
        label: "Tidur Berlebih",
        badgeStyle: "bg-[#98C5E2] text-[#1A1A1A] border-[#7BB1D3]",
        description: "Durasi tidur >9.5 jam. Lakukan peregangan pagi untuk mengaktifkan sirkulasi.",
      };
  }
}

export function computeAutoSleepFromWindow(params: {
  logDate?: string;
  lastActiveTimestamp?: number;
  firstWakeTimestamp?: number;
  bedTime?: string;
  wakeTime?: string;
  sleepHours?: number;
  sleepLatencyMins?: number;
  source?: SleepDetectionSource;
  isConfirmed?: boolean;
}): AutoSleepRecordDTO {
  const logDate = params.logDate || getLocalTodayDateString();
  const source: SleepDetectionSource = params.source ?? "OVERNIGHT_INACTIVITY";

  const defaultLatency =
    source === "MANUAL_OVERRIDE" || source === "WEARABLE_SYNC" || source === "AI_NLP_CHAT"
      ? 0
      : source === "OS_POWER_MONITOR"
      ? 5
      : 15;

  const sleepLatencyMins =
    typeof params.sleepLatencyMins === "number" && params.sleepLatencyMins >= 0
      ? params.sleepLatencyMins
      : defaultLatency;

  let lastActiveTimestamp: number;
  let firstWakeTimestamp: number;

  if (
    typeof params.lastActiveTimestamp === "number" &&
    typeof params.firstWakeTimestamp === "number" &&
    params.firstWakeTimestamp > params.lastActiveTimestamp
  ) {
    lastActiveTimestamp = params.lastActiveTimestamp;
    firstWakeTimestamp = params.firstWakeTimestamp;
  } else if (params.bedTime && params.wakeTime) {
    const parsed = parseHHMMToTimestamps(params.bedTime, params.wakeTime, logDate);
    lastActiveTimestamp = parsed.lastActiveTimestamp;
    firstWakeTimestamp = parsed.firstWakeTimestamp;
  } else if (typeof params.sleepHours === "number" && params.sleepHours > 0) {
    const wakeAnchor = new Date(`${logDate}T06:45:00`);
    firstWakeTimestamp = wakeAnchor.getTime();
    const totalGapMs = (params.sleepHours + sleepLatencyMins / 60) * 3_600_000;
    lastActiveTimestamp = firstWakeTimestamp - totalGapMs;
  } else {
    const parsed = parseHHMMToTimestamps("23:15", "06:45", logDate);
    lastActiveTimestamp = parsed.lastActiveTimestamp;
    firstWakeTimestamp = parsed.firstWakeTimestamp;
  }

  const rawInactiveHours = Number(
    Math.max(0, (firstWakeTimestamp - lastActiveTimestamp) / 3_600_000).toFixed(2)
  );

  const computedNetSleep =
    typeof params.sleepHours === "number" &&
    (source === "MANUAL_OVERRIDE" || source === "AI_NLP_CHAT" || source === "WEARABLE_SYNC")
      ? params.sleepHours
      : Math.max(0.5, rawInactiveHours - sleepLatencyMins / 60);

  const sleepHours = Number(Math.min(16.0, Math.max(0.5, computedNetSleep)).toFixed(1));
  const bedTime = params.bedTime || formatTimeHHMM(lastActiveTimestamp);
  const wakeTime = params.wakeTime || formatTimeHHMM(firstWakeTimestamp);
  const sleepQualityScore = inferSleepQualityScore(sleepHours, bedTime);
  const recoveryPoints = calculateSleepRecoveryPoints(sleepHours);
  const clinicalStatus = classifySleepClinicalStatus(sleepHours);

  const confidence: "HIGH" | "MEDIUM" | "MANUAL" =
    source === "MANUAL_OVERRIDE"
      ? "MANUAL"
      : source === "OS_POWER_MONITOR" || source === "WEARABLE_SYNC"
      ? "HIGH"
      : "MEDIUM";

  return {
    logDate,
    sleepHours,
    sleepQualityScore,
    bedTime,
    wakeTime,
    lastActiveTimestamp,
    firstWakeTimestamp,
    rawInactiveHours,
    sleepLatencyMins,
    source,
    confidence,
    isConfirmed: Boolean(params.isConfirmed ?? source === "MANUAL_OVERRIDE"),
    recoveryPoints,
    clinicalStatus,
  };
}

