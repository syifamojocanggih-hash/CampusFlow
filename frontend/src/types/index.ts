/**
 * Frontend Type Definitions
 * Re-exports shared contracts and defines frontend-specific UI interfaces.
 */

export * from "@shared/contracts";

import type {
  ApiSuccessEnvelope,
  UserProfileDTO,
  TriadDashboardDTO,
  AiCoachingInsightDTO,
} from "@shared/contracts";

export type UserResponse = ApiSuccessEnvelope<UserProfileDTO>;
export type TriadDashboardResponse = ApiSuccessEnvelope<TriadDashboardDTO>;
export type AiCoachInsightResponse = ApiSuccessEnvelope<AiCoachingInsightDTO>;

export type TabKey = "dashboard" | "focus" | "activity" | "checkin" | "coach" | "history" | "settings";

