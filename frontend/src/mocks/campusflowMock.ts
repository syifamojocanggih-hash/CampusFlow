/**
 * Mock Data Fixture untuk CampusFlow Frontend PWA
 * Mengacu pada docs/frontend/MOCK_DATA.md dan docs/universal/INTERFACES.md
 */

import type {
  UserResponse,
  TriadDashboardResponse,
  AiCoachInsightResponse,
} from "@/types";

export const MOCK_USER: UserResponse = {
  data: {
    id: "demo-user-001",
    name: "Mahasiswa Demo CampusFlow",
    nim: "4.33.24.0.01",
    email: "demo@campusflow.id",
    department: "Teknik Informatika",
    weeklyMetsTarget: 1500,
    currentStreakDays: 7,
    xpPoints: 420,
    postureBaselineJson: null,
  },
  meta: {
    timestamp: "2026-11-11T13:00:00.000Z",
    version: "v1.0",
  },
};

export const MOCK_TRIAD_DASHBOARD: TriadDashboardResponse = {
  data: {
    today: {
      totalSedentaryHours: 6.2,
      totalMvpaMinutes: 35,
      mvpaPerSedentaryRatio: 5.6,
      sleepHours: 6.5,
      nonAcademicScreenHours: 4.0,
      pss4TotalScore: 8,
      triadPillarsMet: 1,
      stressRiskLevel: "HIGH",
      sedentaryRiskStatus: "WASPADA",
    },
    weeklySummary: {
      weeklyMetsTotal: 1340,
      weeklyMetsTarget: 1500,
      weeklyMseDays: 2,
      weeklyMseTarget: 2,
      currentStreakDays: 7,
      xpPoints: 420,
    },
    history: [
      { logDate: "2026-11-05", totalSedentaryHours: 9.4, totalMvpaMinutes: 15, sleepHours: 5.5, pss4TotalScore: 11, triadPillarsMet: 0 },
      { logDate: "2026-11-06", totalSedentaryHours: 8.5, totalMvpaMinutes: 22, sleepHours: 6.0, pss4TotalScore: 10, triadPillarsMet: 0 },
      { logDate: "2026-11-07", totalSedentaryHours: 7.8, totalMvpaMinutes: 30, sleepHours: 6.8, pss4TotalScore: 9, triadPillarsMet: 1 },
      { logDate: "2026-11-08", totalSedentaryHours: 7.0, totalMvpaMinutes: 35, sleepHours: 7.2, pss4TotalScore: 7, triadPillarsMet: 2 },
      { logDate: "2026-11-09", totalSedentaryHours: 6.4, totalMvpaMinutes: 40, sleepHours: 7.4, pss4TotalScore: 6, triadPillarsMet: 3 },
      { logDate: "2026-11-10", totalSedentaryHours: 6.0, totalMvpaMinutes: 42, sleepHours: 7.6, pss4TotalScore: 5, triadPillarsMet: 3 },
      { logDate: "2026-11-11", totalSedentaryHours: 6.2, totalMvpaMinutes: 35, sleepHours: 6.5, pss4TotalScore: 8, triadPillarsMet: 1 },
    ],
  },
  meta: {
    timestamp: "2026-11-11T13:00:00.000Z",
    version: "v1.0",
  },
};

export const MOCK_AI_COACH: AiCoachInsightResponse = {
  data: {
    id: "insight-demo-001",
    createdAt: "2026-11-11T13:10:00.000Z",
    dominantMediator: "SLEEP_MEDIATION_DEFICIT",
    diagnosisSummary:
      "Skor stres PSS-4 Anda hari ini meningkat ke level tinggi (8/16) seiring durasi tidur malam yang hanya 6.5 jam dan rasio gerak terhadap waktu duduk yang belum terpenuhi.",
    isotemporalActionPlan:
      "Lakukan jalan cepat atau aerobik ringan 20 menit sore ini antara pukul 16.00–17.30 di sekitar kampus/kos, lalu selesaikan 1 sesi peregangan Active Break setiap 50 menit belajar malam.",
    recommendedMetsToday: 240,
    scientificCitationNote:
      "Berdasarkan analisis mediasi tidur 41% oleh Mu et al. (2024) & Wang et al. (2025) serta substitusi isotemporal Su et al. (2022).",
    isCompleted: false,
  },
  meta: {
    timestamp: "2026-11-11T13:10:00.000Z",
    version: "v1.0",
  },
};

