/**
 * Kontrak data dan konstanta klinis bersama CampusFlow.
 * Dikelola di branch `main` (Ibra @flyingdutchman) dan diturunkan ke `backend` & `frontend`.
 * Sumber kebenaran: docs/universal/INTERFACES.md
 */

export const CLINICAL_CONSTANTS = {
  MAX_SAFE_SEDENTARY_HOURS: 9.0,
  TARGET_MVPA_PER_SEDENTARY_HOUR: 25,
  ISOTEMPORAL_WORK_BOUT_MINS: 50,
  ISOTEMPORAL_BREAK_MINS: 10,
  DEMO_MODE_WORK_BOUT_SECS: 15,
  TRIAD_PILLAR_1_MVPA_MINS: 30,
  TRIAD_PILLAR_2_SLEEP_MIN_HOURS: 7.0,
  TRIAD_PILLAR_2_SLEEP_MAX_HOURS: 9.0,
  TRIAD_PILLAR_2_MIN_QUALITY_SCORE: 3,
  TRIAD_PILLAR_3_MAX_SCREENTIME: 8.0,
  WEEKLY_MSE_TARGET_DAYS: 2,
  WEEKLY_TOTAL_METS_TARGET: 1500,
  ACUTE_RELIEF_AEROBIC_MINS: 15,
  SLEEP_MEDIATION_WEIGHT: 0.41,
} as const;

export type ActivityIntensity =
  | "WALKING"
  | "MODERATE"
  | "VIGOROUS"
  | "MUSCLE_STRENGTHENING"
  | "ACUTE_AEROBIC_RELIEF";

export type DataSource = "WEB_SENSOR_API" | "POSE_CAMERA_AI" | "MANUAL_LOG";

export type StressSeverity = "LOW" | "MODERATE" | "HIGH" | "SEVERE";

export type DominantMediator =
  | "SEDENTARY_OVERLOAD"
  | "SLEEP_MEDIATION_DEFICIT"
  | "LOW_MVPA_VOLUME"
  | "EXAM_ACUTE_STRESS"
  | "OPTIMAL_BALANCE";

export const MET_COEFFICIENTS: Record<ActivityIntensity, number> = {
  WALKING: 3.3,
  MODERATE: 4.0,
  VIGOROUS: 8.0,
  MUSCLE_STRENGTHENING: 5.0,
  ACUTE_AEROBIC_RELIEF: 5.0,
};

/** Indeks 0-based yang wajib di-reverse score (4 - x) pada PSS-4 dan PSS-10. */
export const PSS4_REVERSE_INDICES = [1, 2] as const; // Q2 & Q3
export const PSS10_REVERSE_INDICES = [3, 4, 6, 7] as const; // Item 4, 5, 7, 8

export interface PostureBaseline {
  shoulderWidth: number;
  shoulderY: number;
  neckVerticalDist: number;
  torsoNeckAngle: number;
  timestamp: number;
}

export interface ApiMeta {
  timestamp: string;
  version: string;
}

export interface ApiSuccessEnvelope<T> {
  data: T;
  meta: ApiMeta;
}

export interface ApiErrorEnvelope {
  error: {
    code:
      | "VALIDATION_ERROR"
      | "UNAUTHORIZED"
      | "NOT_FOUND"
      | "AI_COACH_FALLBACK"
      | "INTERNAL_ERROR";
    message: string;
    details?: Record<string, unknown>;
  };
}

export interface UserProfileDTO {
  id: string;
  name: string;
  nim: string;
  email: string;
  department: string;
  weeklyMetsTarget: number;
  currentStreakDays: number;
  xpPoints: number;
  postureBaselineJson: PostureBaseline | null;
}

export interface SedentarySessionPayload {
  startTime: string;
  endTime: string;
  durationMinutes: number;
  slouchCount: number;
  tooCloseCount: number;
  avgNeckRatio: number;
  breakCompleted: boolean;
  breakDurationMins: number;
  verificationSource: DataSource;
}

export interface PhysicalActivityPayload {
  activityDate: string;
  intensityType: ActivityIntensity;
  durationMinutes: number;
  stepsCount?: number;
  avgCadenceSpm?: number;
  source: DataSource;
  notes?: string;
}

export interface PedometerSampleResult {
  totalSteps: number;
  cadenceSpm: number;
  intensityType: "IDLE" | "WALKING" | "MODERATE" | "VIGOROUS";
  metMultiplier: number;
}

export interface DailyWellbeingPayload {
  logDate: string;
  sleepHours: number;
  sleepQualityScore: number;
  nonAcademicScreenHours: number;
  pss4Answers: [number, number, number, number];
}

export interface Pss10AssessmentPayload {
  rawAnswers: number[];
  notes?: string;
}

export interface TriadDailySummaryDTO {
  totalSedentaryHours: number;
  totalMvpaMinutes: number;
  mvpaPerSedentaryRatio: number;
  sleepHours: number;
  nonAcademicScreenHours: number;
  pss4TotalScore: number;
  triadPillarsMet: number;
  stressRiskLevel: StressSeverity;
  sedentaryRiskStatus: "OPTIMAL" | "WASPADA" | "HIGH_SEDENTARY_RISK";
}

export interface TriadHistoryPointDTO {
  logDate: string;
  totalSedentaryHours: number;
  totalMvpaMinutes: number;
  sleepHours: number;
  pss4TotalScore: number;
  triadPillarsMet: number;
}

export interface TriadDashboardDTO {
  today: TriadDailySummaryDTO;
  weeklySummary: {
    weeklyMetsTotal: number;
    weeklyMetsTarget: number;
    weeklyMseDays: number;
    weeklyMseTarget: number;
    currentStreakDays: number;
    xpPoints: number;
  };
  history: TriadHistoryPointDTO[];
}

export interface AiCoachingInsightDTO {
  id: string;
  createdAt: string;
  dominantMediator: DominantMediator;
  diagnosisSummary: string;
  isotemporalActionPlan: string;
  recommendedMetsToday: number;
  scientificCitationNote: string;
  isCompleted: boolean;
}
