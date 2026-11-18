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
  SedentarySessionPayload,
  Pss10AssessmentPayload,
  AcademicScheduleDTO,
  AcademicScheduleListResponse,
  BurnoutSummaryResponse,
} from "@/types";
import {
  uploadKrsPdfPreview as uploadKrsPdfHelper,
  confirmKrsSchedules as confirmKrsSchedulesHelper,
  parseKrsText as parseKrsTextHelper,
  type ExtractedKrsCourse,
  type KrsUploadPreviewResponse,
  type KrsConfirmResponse,
} from "@/lib/krsPdfClient";

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

  async login(email: string, password: string): Promise<UserResponse> {
    if (USE_MOCK) {
      this.setToken("mock-jwt-token-" + Date.now());
      const savedProfile = localStorage.getItem("cf_user_profile");
      let customData = {};
      if (savedProfile) {
        try {
          customData = JSON.parse(savedProfile);
        } catch {
          // ignore
        }
      }
      const user: UserResponse = {
        ...MOCK_USER,
        data: {
          ...MOCK_USER.data,
          email,
          ...customData,
        },
      };
      localStorage.setItem("cf_user_profile", JSON.stringify(user.data));
      return user;
    }
    const res = await this.request<{ data: { token: string; user: UserProfileDTO }; meta: unknown }>("/auth/login", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    });
    this.setToken(res.data.token);
    return { data: res.data.user, meta: res.meta } as UserResponse;
  }

  async register(payload: { name: string; nim: string; email: string; password: string; department?: string }): Promise<UserResponse> {
    if (USE_MOCK) {
      this.setToken("mock-jwt-token-" + Date.now());
      const user: UserResponse = {
        ...MOCK_USER,
        data: {
          ...MOCK_USER.data,
          name: payload.name,
          nim: payload.nim,
          email: payload.email,
          department: payload.department || "Teknik Informatika",
        },
      };
      localStorage.setItem("cf_user_profile", JSON.stringify(user.data));
      return user;
    }
    const res = await this.request<{ data: { token: string; user: UserProfileDTO }; meta: unknown }>("/auth/register", {
      method: "POST",
      body: JSON.stringify(payload),
    });
    this.setToken(res.data.token);
    return { data: res.data.user, meta: res.meta } as UserResponse;
  }

  async loginDemo(): Promise<UserResponse> {
    if (USE_MOCK) {
      this.setToken("mock-jwt-demo-token");
      return MOCK_USER;
    }
    const res = await this.request<{ data: { token: string; user: UserProfileDTO }; meta: unknown }>("/auth/demo", {
      method: "POST",
    });
    this.setToken(res.data.token);
    return { data: res.data.user, meta: res.meta } as UserResponse;
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

  async getAiCoachStatus(): Promise<{ data: { available: boolean; model: string }; meta: unknown }> {
    if (USE_MOCK) {
      return {
        data: { available: true, model: "campusflow-coach (mock)" },
        meta: { timestamp: new Date().toISOString(), version: "v1.0" },
      };
    }
    return this.request("/ai-coach/status");
  }

  async getAiCoachHistory(limit = 20): Promise<{ data: unknown[]; meta: unknown }> {
    if (USE_MOCK) {
      return {
        data: [MOCK_AI_COACH.data],
        meta: { timestamp: new Date().toISOString(), version: "v1.0" },
      };
    }
    return this.request(`/ai-coach/history?limit=${limit}`);
  }

  async generateAiCoachInsight(notes?: string): Promise<AiCoachInsightResponse> {
    if (USE_MOCK) {
      return MOCK_AI_COACH;
    }
    return this.request<AiCoachInsightResponse>("/ai-coach/generate", {
      method: "POST",
      body: JSON.stringify(notes ? { notes } : {}),
    });
  }

  async completeAiCoachInsight(id: string): Promise<{ data: unknown; meta: unknown }> {
    if (USE_MOCK) {
      return {
        data: { id, isCompleted: true, xpAwarded: 50 },
        meta: { timestamp: new Date().toISOString(), version: "v1.0" },
      };
    }
    return this.request(`/ai-coach/${id}/complete`, {
      method: "PATCH",
    });
  }

  // --- Posture Baseline ---
  async savePostureBaseline(baseline: PostureBaseline): Promise<void> {
    localStorage.setItem("cf_posture_baseline", JSON.stringify(baseline));
    if (USE_MOCK) {
      return;
    }
    await this.request("/vision/baseline", {
      method: "PATCH",
      body: JSON.stringify(baseline),
    });
  }

  // --- Checkin, Wellbeing & Clinical Assessments ---
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

  async getTodayWellbeing(): Promise<{ data: { logDate: string; checkedInToday: boolean; log: unknown }; meta: unknown }> {
    if (USE_MOCK) {
      return {
        data: { logDate: new Date().toISOString().split("T")[0], checkedInToday: true, log: null },
        meta: { timestamp: new Date().toISOString(), version: "v1.0" },
      };
    }
    return this.request("/wellbeing/today");
  }

  async getWellbeingHistory(days = 14): Promise<{ data: { days: number; count: number; items: unknown[] }; meta: unknown }> {
    if (USE_MOCK) {
      return {
        data: { days, count: 0, items: [] },
        meta: { timestamp: new Date().toISOString(), version: "v1.0" },
      };
    }
    return this.request(`/wellbeing/history?days=${days}`);
  }

  async getClinicalAssessments(): Promise<{ data: unknown[]; meta: unknown }> {
    if (USE_MOCK) {
      return { data: [], meta: { timestamp: new Date().toISOString(), version: "v1.0" } };
    }
    return this.request("/assessments");
  }

  async submitPss10Assessment(payload: Pss10AssessmentPayload): Promise<{ data: unknown; meta: unknown }> {
    if (USE_MOCK) {
      return {
        data: { instrumentType: "PSS_10", totalScore: 14, severityLevel: "MODERATE" },
        meta: { timestamp: new Date().toISOString(), version: "v1.0" },
      };
    }
    return this.request("/assessments/pss10", {
      method: "POST",
      body: JSON.stringify(payload),
    });
  }

  // --- Sedentary & Physical Activities ---
  async submitPhysicalActivity(payload: PhysicalActivityPayload): Promise<void> {
    if (USE_MOCK) {
      console.log("[MOCK] Submit Physical Activity:", payload);
      return;
    }
    await this.request("/activities", {
      method: "POST",
      body: JSON.stringify(payload),
    });
  }

  async getPhysicalActivities(days = 14): Promise<{ data: unknown[]; meta: unknown }> {
    if (USE_MOCK) {
      return { data: [], meta: { timestamp: new Date().toISOString(), version: "v1.0" } };
    }
    return this.request(`/activities?days=${days}`);
  }

  async logSedentarySession(payload: SedentarySessionPayload): Promise<{ data: unknown; meta: unknown }> {
    if (USE_MOCK) {
      return { data: payload, meta: { timestamp: new Date().toISOString(), version: "v1.0" } };
    }
    return this.request("/sedentary/sessions", {
      method: "POST",
      body: JSON.stringify(payload),
    });
  }

  async getSedentarySessions(days = 14): Promise<{ data: unknown[]; meta: unknown }> {
    if (USE_MOCK) {
      return { data: [], meta: { timestamp: new Date().toISOString(), version: "v1.0" } };
    }
    return this.request(`/sedentary/sessions?days=${days}`);
  }

  // --- PRD v4.0: Academic Strava, PDF KRS Parser & Burnout Index ---
  async getAcademicSchedules(): Promise<AcademicScheduleListResponse> {
    if (USE_MOCK) {
      return {
        data: [
          { id: "sch-1", dayOfWeek: 1, subjectName: "Algoritma & Struktur Data", creditHours: 3, isPracticum: true },
          { id: "sch-2", dayOfWeek: 2, subjectName: "Kecerdasan Buatan", creditHours: 3, isPracticum: false },
          { id: "sch-3", dayOfWeek: 3, subjectName: "Basis Data Terdistribusi", creditHours: 3, isPracticum: true },
          { id: "sch-4", dayOfWeek: 4, subjectName: "Pemrograman Web Lanjut", creditHours: 2, isPracticum: true },
          { id: "sch-5", dayOfWeek: 5, subjectName: "Etika Profesi & Komunikasi", creditHours: 2, isPracticum: false },
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

  async updateAcademicSchedule(
    id: string,
    payload: Partial<AcademicScheduleDTO> & { classType?: "teori" | "praktikum"; startTime?: string | null; endTime?: string | null }
  ): Promise<{ data: unknown; meta: unknown }> {
    if (USE_MOCK) {
      return { data: { id, ...payload }, meta: { timestamp: new Date().toISOString(), version: "4.0" } };
    }
    return this.request(`/schedule/${id}`, {
      method: "PATCH",
      body: JSON.stringify(payload),
    });
  }

  async deleteAcademicSchedule(id?: string): Promise<void> {
    if (USE_MOCK) {
      console.log("[MOCK] Delete Schedule:", id);
      return;
    }
    if (!id) return;
    await this.request(`/schedule/${id}`, {
      method: "DELETE",
    });
  }

  async uploadKrsPdfPreview(
    file: File,
    geminiApiKey?: string
  ): Promise<KrsUploadPreviewResponse> {
    return uploadKrsPdfHelper(file, {
      baseUrl: BASE_URL,
      token: this.token,
      geminiApiKey,
      useMock: USE_MOCK,
    });
  }

  async confirmAcademicSchedules(
    schedules: ExtractedKrsCourse[],
    replaceExisting = true
  ): Promise<KrsConfirmResponse> {
    return confirmKrsSchedulesHelper(schedules, replaceExisting, {
      baseUrl: BASE_URL,
      token: this.token,
      useMock: USE_MOCK,
    });
  }

  async parseKrsText(text: string, saveToDatabase = false, geminiApiKey?: string): Promise<unknown> {
    return parseKrsTextHelper(text, saveToDatabase, {
      baseUrl: BASE_URL,
      token: this.token,
      geminiApiKey,
      useMock: USE_MOCK,
    });
  }

  async getScheduleStressAnalysis(): Promise<{ data: unknown; meta: unknown }> {
    if (USE_MOCK) {
      return {
        data: { totalCourses: 5, summary: { totalSks: 13 }, dailyBreakdown: [], items: [] },
        meta: { timestamp: new Date().toISOString(), version: "4.0" },
      };
    }
    return this.request("/schedule/stress-analysis");
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

  async getBurnoutHistory(days = 14): Promise<{ data: { days: number; count: number; summary: unknown; items: unknown[] }; meta: unknown }> {
    if (USE_MOCK) {
      return {
        data: {
          days,
          count: 1,
          summary: { averageBurnoutIndex: 25, peakBurnoutDay: null, highRiskDaysCount: 0, totalVerifiedBreaks: 1 },
          items: [],
        },
        meta: { timestamp: new Date().toISOString(), version: "4.0" },
      };
    }
    return this.request(`/burnout/history?days=${days}`);
  }

  async verifyActiveBreak(payload: {
    durationMins: number;
    poseVerified: boolean;
    poseType: string;
  }): Promise<unknown> {
    if (USE_MOCK) {
      console.log("[MOCK] Active Break Verified:", payload);
      return { data: { ...payload, xpAwarded: 15, recoveryPointsAdded: 10 } };
    }
    return this.request("/active-break/verify", {
      method: "POST",
      body: JSON.stringify(payload),
    });
  }

  async getTodayActiveBreaks(): Promise<{ data: { verifiedCount: number; totalRecoveryPoints: number; items: unknown[] }; meta: unknown }> {
    if (USE_MOCK) {
      return {
        data: { verifiedCount: 1, totalRecoveryPoints: 10, items: [] },
        meta: { timestamp: new Date().toISOString(), version: "4.0" },
      };
    }
    return this.request("/active-break/today");
  }

  async getActiveBreakHistory(days = 14): Promise<{ data: { days: number; verifiedCount: number; items: unknown[] }; meta: unknown }> {
    if (USE_MOCK) {
      return {
        data: { days, verifiedCount: 1, items: [] },
        meta: { timestamp: new Date().toISOString(), version: "4.0" },
      };
    }
    return this.request(`/active-break/history?days=${days}`);
  }

  // --- Web Push Notifications & Privacy ---
  async getVapidPublicKey(): Promise<{ data: { configured: boolean; publicKey: string | null }; meta: unknown }> {
    if (USE_MOCK) {
      return { data: { configured: false, publicKey: null }, meta: { timestamp: new Date().toISOString(), version: "v1.0" } };
    }
    return this.request("/notifications/vapid-public-key");
  }

  async subscribePushNotification(subscription: PushSubscriptionJSON): Promise<void> {
    if (USE_MOCK) return;
    await this.request("/notifications/subscribe", {
      method: "POST",
      body: JSON.stringify(subscription),
    });
  }

  async unsubscribePushNotification(): Promise<void> {
    if (USE_MOCK) return;
    await this.request("/notifications/subscribe", {
      method: "DELETE",
    });
  }

  async sendTestNotification(): Promise<void> {
    if (USE_MOCK) return;
    await this.request("/notifications/test", { method: "POST" });
  }

  async deleteMyData(): Promise<void> {
    localStorage.removeItem("cf_posture_baseline");
    if (USE_MOCK) return;
    await this.request("/users/me/data", { method: "DELETE" });
  }
}

export const api = new ApiClient();

