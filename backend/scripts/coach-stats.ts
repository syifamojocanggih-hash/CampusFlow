import fs from "node:fs";
import path from "node:path";
import { getCoachRawLogPath, type CoachRawLogEntry } from "../src/services/coachShared.ts";

export interface CoachStatsReport {
  totalResponses: number;
  responsesNeedingRepair: number;
  repairPercentage: number;
  repairTypeRanking: Array<{
    type: string;
    label: string;
    count: number;
    percentage: number;
  }>;
  retryReasonsBreakdown: Array<{
    reason: string;
    count: number;
  }>;
}

export function computeCoachStats(logFilePath?: string): CoachStatsReport {
  const targetPath = logFilePath || getCoachRawLogPath();

  if (!fs.existsSync(targetPath)) {
    return {
      totalResponses: 0,
      responsesNeedingRepair: 0,
      repairPercentage: 0,
      repairTypeRanking: [],
      retryReasonsBreakdown: [],
    };
  }

  const fileContent = fs.readFileSync(targetPath, "utf-8").trim();
  if (!fileContent) {
    return {
      totalResponses: 0,
      responsesNeedingRepair: 0,
      repairPercentage: 0,
      repairTypeRanking: [],
      retryReasonsBreakdown: [],
    };
  }

  const lines = fileContent.split("\n").filter((l) => l.trim().length > 0);
  let totalResponses = 0;
  let responsesNeedingRepair = 0;

  const counts: Record<string, number> = {
    retryApplied: 0,
    sentenceRemoved: 0,
    durationAdjusted: 0,
    openingReplaced: 0,
    conjunctionStripped: 0,
  };

  const retryReasonsMap: Record<string, number> = {};

  for (const line of lines) {
    try {
      const entry: CoachRawLogEntry = JSON.parse(line);
      totalResponses++;

      const flags = entry.flags;
      const hadRepair =
        Boolean(
          flags?.retryApplied ||
          flags?.sentenceRemoved ||
          flags?.durationAdjusted ||
          flags?.openingReplaced ||
          flags?.conjunctionStripped
        );

      if (hadRepair) {
        responsesNeedingRepair++;
      }

      if (flags?.retryApplied) counts.retryApplied++;
      if (flags?.sentenceRemoved) counts.sentenceRemoved++;
      if (flags?.durationAdjusted) counts.durationAdjusted++;
      if (flags?.openingReplaced) counts.openingReplaced++;
      if (flags?.conjunctionStripped) counts.conjunctionStripped++;

      if (flags?.retryReasons && Array.isArray(flags.retryReasons)) {
        for (const reason of flags.retryReasons) {
          retryReasonsMap[reason] = (retryReasonsMap[reason] || 0) + 1;
        }
      }
    } catch {
      // Lewati baris log malformed
    }
  }

  const repairPercentage =
    totalResponses > 0 ? parseFloat(((responsesNeedingRepair / totalResponses) * 100).toFixed(1)) : 0;

  const labelsMap: Record<string, string> = {
    retryApplied: "Model Retry (out-of-scope / klaim palsu / aksi tidak cocok)",
    sentenceRemoved: "Penghapusan Kalimat (kebocoran directive / klaim tanpa data)",
    durationAdjusted: "Koreksi Durasi (menit di luar batas allowedRanges)",
    openingReplaced: "Penggantian Kalimat Pembuka (konteks pilihan / ramah ringkas)",
    conjunctionStripped: "Pembersihan Kata Sambung Menggantung (Namun/Tetapi/Karena itu)",
  };

  const repairTypeRanking = Object.entries(counts)
    .map(([type, count]) => ({
      type,
      label: labelsMap[type] || type,
      count,
      percentage: totalResponses > 0 ? parseFloat(((count / totalResponses) * 100).toFixed(1)) : 0,
    }))
    .sort((a, b) => b.count - a.count);

  const retryReasonsBreakdown = Object.entries(retryReasonsMap)
    .map(([reason, count]) => ({ reason, count }))
    .sort((a, b) => b.count - a.count);

  return {
    totalResponses,
    responsesNeedingRepair,
    repairPercentage,
    repairTypeRanking,
    retryReasonsBreakdown,
  };
}

export function printCoachStats(report: CoachStatsReport): void {
  console.log("\n==================================================================");
  console.log("  📊 CampusFlow AI Coach — Statistik Kualitas & Perbaikan Model");
  console.log("==================================================================");

  if (report.totalResponses === 0) {
    console.log("Belum ada entri log tercatat di backend/logs/coach-raw.jsonl.");
    console.log("Jalankan chat-coach.ts untuk mulai mengumpulkan data log.");
    console.log("==================================================================\n");
    return;
  }

  console.log(`- Total Percakapan Tercatat  : ${report.totalResponses}`);
  console.log(
    `- Butuh Perbaikan Pasca-Model: ${report.responsesNeedingRepair} (${report.repairPercentage}%)`
  );
  console.log(
    `- Respons Murni Tanpa Modif  : ${report.totalResponses - report.responsesNeedingRepair} (${(100 - report.repairPercentage).toFixed(1)}%)`
  );
  console.log("\n--- [PERINGKAT JENIS PERBAIKAN TERBANYAK] ---");
  report.repairTypeRanking.forEach((item, idx) => {
    console.log(
      `  ${idx + 1}. [${item.count}x / ${item.percentage}%] ${item.label} (${item.type})`
    );
  });

  if (report.retryReasonsBreakdown.length > 0) {
    console.log("\n--- [RINCIAN ALASAN RETRY MODEL] ---");
    report.retryReasonsBreakdown.forEach((item, idx) => {
      console.log(`  ${idx + 1}. ${item.reason}: ${item.count} kali`);
    });
  }

  console.log("==================================================================\n");
}

const isDirectRun =
  Boolean(process.argv[1]) &&
  path.resolve(process.argv[1]).replace(/\\/g, "/").endsWith("scripts/coach-stats.ts");

if (isDirectRun) {
  const report = computeCoachStats();
  printCoachStats(report);
}
