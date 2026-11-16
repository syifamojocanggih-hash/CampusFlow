/**
 * API Client Layer for CampusFlow Frontend
 * Sesuai FE-1.2: Mendukung toggle VITE_USE_MOCK=true/false secara transparan.
 */

import {
  MOCK_USER,
  MOCK_TRIAD_DASHBOARD,
  MOCK_AI_COACH,
} from "@/mocks/campusflowMock";
import type {
  UserResponse,
  UserProfileDTO,
  TriadDashboardResponse,
  AiCoachInsightResponse,
  PostureBaseline,
  DailyWellbeingPayload,
  PhysicalActivityPayload,
  AcademicScheduleDTO,
  AcademicScheduleListResponse,
  BurnoutSummaryResponse,
} from "@/types";

// Default ke mock mode (true) jika VITE_USE_MOCK belum didefinisikan atau bukan "false"
const USE_MOCK = import.meta.env.VITE_USE_MOCK !== "false";
const BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:4000/api/v1";

class ApiClient {
  private token: string | null = null;

  constructor() {
    this.token = localStorage.getItem("cf_auth_token");
  }

  setToken(token: string | null) {
    this.token = token;
    if (token) {
      localStorage.setItem("cf_auth_token", token);
    } else {
      localStorage.removeItem("cf_auth_token");
    }
  }

  getToken(): string | null {
    return this.token;
  }

  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      ...(options.headers as Record<string, string>),
    };

    if (this.token) {
      headers["Authorization"] = `Bearer ${this.token}`;
    }

    const res = await fetch(`${BASE_URL}${endpoint}`, {
      ...options,
      headers,
    });

    if (!res.ok) {
      const errorData = await res.json().catch(() => ({}));
      throw new Error(errorData?.error?.message || `API Error: ${res.status}`);
    }

    return res.json() as Promise<T>;
  }

  // --- Profile & Auth ---
  async getCurrentUser(): Promise<UserResponse> {
    if (USE_MOCK) {
      // Ambil baseline & profil lokal jika ada
      const savedProfile = localStorage.getItem("cf_user_profile");
      const savedBaseline = localStorage.getItem("cf_posture_baseline");
      const user: UserResponse = {
        ...MOCK_USER,
        data: { ...MOCK_USER.data },
      };
      if (savedProfile) {
        try {
          user.data = { ...user.data, ...JSON.parse(savedProfile) };
        } catch {
          // ignore
        }
      }
      if (savedBaseline) {
        try {
          user.data.postureBaselineJson = JSON.parse(savedBaseline);
        } catch {
          // ignore
        }
      }
      return user;
    }
    return this.request<UserResponse>("/users/me");
  }

  async updateUserProfile(payload: Partial<UserProfileDTO>): Promise<UserProfileDTO> {
    const saved = localStorage.getItem("cf_user_profile");
    let currentData = { ...MOCK_USER.data };
    if (saved) {
      try {
        currentData = { ...currentData, ...JSON.parse(saved) };
      } catch {
        // ignore
      }
    }
    const updated = { ...currentData, ...payload };
    localStorage.setItem("cf_user_profile", JSON.stringify(updated));
    if (USE_MOCK) {
      return updated;
    }
    const res = await this.request<UserResponse>("/users/me", {
      method: "PATCH",
      body: JSON.stringify(payload),
    });
    return res.data;
  }

  // --- Dashboard ---
  async getTriadDashboard(days = 14): Promise<TriadDashboardResponse> {
    if (USE_MOCK) {
      return MOCK_TRIAD_DASHBOARD;
    }
    return this.request<TriadDashboardResponse>(`/dashboard/triad?days=${days}`);
  }

  // --- AI Coach ---
  async getAiCoachInsight(): Promise<AiCoachInsightResponse> {
    if (USE_MOCK) {
      return MOCK_AI_COACH;
    }
    return this.request<AiCoachInsightResponse>("/ai-coach/latest");
  }

  // --- Posture Baseline ---
  async savePostureBaseline(baseline: PostureBaseline): Promise<void> {
    localStorage.setItem("cf_posture_baseline", JSON.stringify(baseline));
    if (USE_MOCK) {
      return;
    }
    await this.request("/posture/baseline", {
      method: "POST",
      body: JSON.stringify(baseline),
    });
  }

  // --- Checkin & Activity ---
  async submitDailyWellbeing(payload: DailyWellbeingPayload): Promise<void> {
    if (USE_MOCK) {
      console.log("[MOCK] Submit Daily Wellbeing:", payload);
      return;
    }
    await this.request("/wellbeing/daily", {
      method: "POST",
      body: JSON.stringify(payload),
    });
  }

  async submitPhysicalActivity(payload: PhysicalActivityPayload): Promise<void> {
    if (USE_MOCK) {
      console.log("[MOCK] Submit Physical Activity:", payload);
      return;
    }
    await this.request("/activity/log", {
      method: "POST",
      body: JSON.stringify(payload),
    });
  }

  // --- PRD v4.0: Academic Strava & Burnout Index ---
  async getAcademicSchedules(): Promise<AcademicScheduleListResponse> {
    if (USE_MOCK) {
      return {
        data: [
          { dayOfWeek: 1, subjectName: "Algoritma & Struktur Data", creditHours: 3, isPracticum: true },
          { dayOfWeek: 2, subjectName: "Kecerdasan Buatan", creditHours: 3, isPracticum: false },
          { dayOfWeek: 4, subjectName: "Pemrograman Web Lanjut", creditHours: 2, isPracticum: true },
        ],
        meta: { timestamp: new Date().toISOString(), version: "4.0" },
      };
    }
    return this.request<AcademicScheduleListResponse>("/schedule");
  }

  async saveAcademicSchedule(payload: AcademicScheduleDTO): Promise<void> {
    if (USE_MOCK) {
      console.log("[MOCK] Save Schedule:", payload);
      return;
    }
    await this.request("/schedule", {
      method: "POST",
      body: JSON.stringify(payload),
    });
  }

  async getTodayBurnout(): Promise<BurnoutSummaryResponse> {
    if (USE_MOCK) {
      return {
        data: {
          logDate: new Date().toISOString().split("T")[0],
          totalScreenTimeMins: 320,
          sleepHours: 7.0,
          academicLoadScore: 7.5,
          screenFatigueScore: 0,
          recoveryScore: 45,
          verifiedBreakCount: 1,
          burnoutIndex: 25,
          status: "LOW",
        },
        meta: { timestamp: new Date().toISOString(), version: "4.0" },
      };
    }
    return this.request<BurnoutSummaryResponse>("/burnout/today");
  }

  async calculateBurnout(payload: {
    totalScreenTimeMins: number;
    sleepHours: number;
    logDate?: string;
  }): Promise<BurnoutSummaryResponse> {
    if (USE_MOCK) {
      return this.getTodayBurnout();
    }
    return this.request<BurnoutSummaryResponse>("/burnout/calculate", {
      method: "POST",
      body: JSON.stringify(payload),
    });
  }

  async verifyActiveBreak(payload: {
    durationMins: number;
    poseVerified: boolean;
    poseType: string;
  }): Promise<void> {
    if (USE_MOCK) {
      console.log("[MOCK] Active Break Verified:", payload);
      return;
    }
    await this.request("/active-break/verify", {
      method: "POST",
      body: JSON.stringify(payload),
    });
  }
}

export const api = new ApiClient();

