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
  AutoSleepRecordDTO,
  SleepDetectionSource,
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

  /**
   * Memastikan token JWT backend asli tersedia (bukan token mock lokal)
   * sebelum memanggil endpoint backend seperti upload/confirm KRS.
   */
  private async ensureRealBackendToken(): Promise<string | null> {
    if (this.token && !this.token.startsWith("mock-jwt-")) {
      return this.token;
    }
    try {
      const res = await fetch(`${BASE_URL}/auth/demo`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });
      if (res.ok) {
        const json = (await res.json()) as { data?: { token?: string } };
        if (json.data?.token) {
          this.setToken(json.data.token);
          return json.data.token;
        }
      }
    } catch {
      // Backend unreachable
    }
    return this.token;
  }

  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    if (!this.token || this.token.startsWith("mock-jwt-")) {
      await this.ensureRealBackendToken();
    }

    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      ...(options.headers as Record<string, string>),
    };

    if (this.token) {
      headers["Authorization"] = `Bearer ${this.token}`;
    }

    let res = await fetch(`${BASE_URL}${endpoint}`, {
      ...options,
      headers,
    });

    // Jika token kedaluwarsa (401), coba refresh otomatis lewat sesi demo backend sekali
    if (res.status === 401 && !endpoint.startsWith("/auth/")) {
      this.setToken(null);
      const refreshed = await this.ensureRealBackendToken();
      if (refreshed) {
        headers["Authorization"] = `Bearer ${refreshed}`;
        res = await fetch(`${BASE_URL}${endpoint}`, {
          ...options,
          headers,
        });
      }
    }

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
    const savedProfile = localStorage.getItem("cf_user_profile");
    let customData: Partial<UserProfileDTO> = {};
    if (savedProfile) {
      try {
        customData = JSON.parse(savedProfile);
      } catch {
        // ignore
      }
    }

    if (USE_MOCK) {
      this.setToken("mock-jwt-token-" + Date.now());
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
      body: JSON.stringify({
        email,
        password,
        name: customData.name,
        nim: customData.nim,
        department: customData.department,
      }),
    });
    this.setToken(res.data.token);
    localStorage.setItem("cf_user_profile", JSON.stringify(res.data.user));
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
    localStorage.setItem("cf_user_profile", JSON.stringify(res.data.user));
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

  async getDailySummary(): Promise<{
    data: {
      logDate: string;
      dayOfWeek: number;
      user: {
        id: string;
        name: string;
        nim?: string | null;
        email: string;
        department?: string | null;
        weeklyMetsTarget: number;
        targetRecoveryScore: number;
        currentStreakDays: number;
        xpPoints: number;
      };
      burnout: {
        totalScreenTimeMins: number;
        sleepHours: number;
        academicLoadScore: number;
        screenFatigueScore: number;
        recoveryScore: number;
        verifiedBreakCount: number;
        burnoutIndex: number;
        status: "LOW" | "MODERATE" | "HIGH";
      };
      academic: {
        courseCount: number;
        totalSks: number;
        hasExamWeek: boolean;
        schedules: AcademicScheduleDTO[];
      };
      activity: {
        steps: number;
        totalMets: number;
        mvpaMinutes: number;
        sessionsCount: number;
      };
      activeBreaks: {
        totalCount: number;
        verifiedCount: number;
        items: unknown[];
      };
      wellbeing: {
        checkedInToday: boolean;
        sleepHours: number;
        sleepQualityScore: number | null;
        pss4TotalScore: number | null;
        stressRiskLevel: string;
      };
      unreadNotifications: number;
    };
    meta: unknown;
  }> {
    if (USE_MOCK) {
      return {
        data: {
          logDate: new Date().toISOString().slice(0, 10),
          dayOfWeek: new Date().getDay() === 0 ? 7 : new Date().getDay(),
          user: {
            id: MOCK_USER.data.id,
            name: MOCK_USER.data.name,
            email: MOCK_USER.data.email,
            weeklyMetsTarget: 600,
            targetRecoveryScore: 80,
            currentStreakDays: 0,
            xpPoints: 0,
          },
          burnout: {
            totalScreenTimeMins: 0,
            sleepHours: 0,
            academicLoadScore: 0,
            screenFatigueScore: 0,
            recoveryScore: 0,
            verifiedBreakCount: 0,
            burnoutIndex: 0,
            status: "LOW",
          },
          academic: { courseCount: 0, totalSks: 0, hasExamWeek: false, schedules: [] },
          activity: { steps: 0, totalMets: 0, mvpaMinutes: 0, sessionsCount: 0 },
          activeBreaks: { totalCount: 0, verifiedCount: 0, items: [] },
          wellbeing: {
            checkedInToday: false,
            sleepHours: 0,
            sleepQualityScore: null,
            pss4TotalScore: null,
            stressRiskLevel: "LOW",
          },
          unreadNotifications: 0,
        },
        meta: { timestamp: new Date().toISOString(), version: "4.0" },
      };
    }
    return this.request("/dashboard/daily-summary");
  }

  // --- AI Coach ---
  async getAiCoachInsight(): Promise<AiCoachInsightResponse> {
    if (USE_MOCK) {
      return MOCK_AI_COACH;
    }
    return this.request<AiCoachInsightResponse>("/ai-coach/latest");
  }

  async getAiCoachStatus(): Promise<{
    data: { reachable: boolean; configuredModel: string; modelInstalled: boolean; availableModels: string[] };
    meta: unknown;
  }> {
    if (USE_MOCK) {
      return {
        data: {
          reachable: true,
          configuredModel: "campusflow-coach (mock)",
          modelInstalled: true,
          availableModels: ["campusflow-coach"],
        },
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

  async generateAiCoachInsight(
    notesOrOptions?:
      | string
      | {
          notes?: string;
          clarificationChoice?: string;
          movementChoice?: string;
          chatHistory?: Array<{ role: "user" | "assistant"; text: string }>;
        }
  ): Promise<AiCoachInsightResponse> {
    if (USE_MOCK) {
      return MOCK_AI_COACH;
    }
    const payload =
      typeof notesOrOptions === "string"
        ? notesOrOptions
          ? { notes: notesOrOptions }
          : {}
        : notesOrOptions ?? {};
    return this.request<AiCoachInsightResponse>("/ai-coach/generate", {
      method: "POST",
      body: JSON.stringify(payload),
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

  async syncAutoSleep(payload: {
    logDate?: string;
    lastActiveTimestamp?: number;
    firstWakeTimestamp?: number;
    bedTime?: string;
    wakeTime?: string;
    sleepHours?: number;
    sleepLatencyMins?: number;
    source?: SleepDetectionSource;
    isConfirmed?: boolean;
  }): Promise<{
    data: {
      autoSleep: AutoSleepRecordDTO;
      burnoutSummary?: unknown;
      currentStreakDays?: number;
    };
    meta: unknown;
  }> {
    if (USE_MOCK) {
      return {
        data: {
          autoSleep: {
            logDate: payload.logDate || new Date().toISOString().slice(0, 10),
            sleepHours: payload.sleepHours ?? 7.3,
            sleepQualityScore: 5,
            bedTime: payload.bedTime || "23:15",
            wakeTime: payload.wakeTime || "06:45",
            lastActiveTimestamp: payload.lastActiveTimestamp || Date.now() - 7.5 * 3600_000,
            firstWakeTimestamp: payload.firstWakeTimestamp || Date.now(),
            rawInactiveHours: 7.5,
            sleepLatencyMins: payload.sleepLatencyMins ?? 15,
            source: payload.source || "OVERNIGHT_INACTIVITY",
            confidence: "MEDIUM",
            isConfirmed: Boolean(payload.isConfirmed),
            recoveryPoints: 37,
            clinicalStatus: "OPTIMAL",
          },
        },
        meta: { timestamp: new Date().toISOString(), version: "4.0" },
      };
    }
    return this.request("/wellbeing/auto-sleep", {
      method: "POST",
      body: JSON.stringify(payload),
    });
  }

  async getAutoSleep(): Promise<{
    data: { autoSleep: AutoSleepRecordDTO; checkedInToday: boolean };
    meta: unknown;
  }> {
    if (USE_MOCK) {
      const res = await this.syncAutoSleep({});
      return {
        data: { autoSleep: res.data.autoSleep, checkedInToday: true },
        meta: res.meta,
      };
    }
    return this.request("/wellbeing/auto-sleep");
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

  async getPhysicalActivities(days = 14): Promise<{
    data: { items: unknown[]; summary: { totalMets: number; weeklyMetsTarget: number; mseDaysCount: number; weeklyMseTarget: number } };
    meta: unknown;
  }> {
    if (USE_MOCK) {
      return {
        data: { items: [], summary: { totalMets: 0, weeklyMetsTarget: 1500, mseDaysCount: 0, weeklyMseTarget: 2 } },
        meta: { timestamp: new Date().toISOString(), version: "v1.0" },
      };
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
    try {
      return await this.request<AcademicScheduleListResponse>("/schedule");
    } catch (err) {
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
      throw err;
    }
  }

  async saveAcademicSchedule(payload: AcademicScheduleDTO): Promise<AcademicScheduleDTO | void> {
    try {
      const res = await this.request<{ data: AcademicScheduleDTO; meta: unknown }>("/schedule", {
        method: "POST",
        body: JSON.stringify(payload),
      });
      return res.data;
    } catch (err) {
      if (USE_MOCK) {
        return payload;
      }
      throw err;
    }
  }

  async updateAcademicSchedule(
    id: string,
    payload: Partial<AcademicScheduleDTO> & { classType?: "teori" | "praktikum"; startTime?: string | null; endTime?: string | null }
  ): Promise<{ data: unknown; meta: unknown }> {
    return this.request(`/schedule/${id}`, {
      method: "PATCH",
      body: JSON.stringify(payload),
    });
  }

  async deleteAcademicSchedule(id?: string): Promise<void> {
    if (!id) return;
    try {
      await this.request(`/schedule/${id}`, {
        method: "DELETE",
      });
    } catch (err) {
      if (!USE_MOCK) throw err;
    }
  }

  async uploadKrsPdfPreview(
    file: File,
    geminiApiKey?: string
  ): Promise<KrsUploadPreviewResponse> {
    const token = await this.ensureRealBackendToken();
    return uploadKrsPdfHelper(file, {
      baseUrl: BASE_URL,
      token,
      geminiApiKey,
      useMock: false,
      allowExtendedFormats: true,
    });
  }

  async confirmAcademicSchedules(
    schedules: ExtractedKrsCourse[],
    replaceExisting = true
  ): Promise<KrsConfirmResponse> {
    const token = await this.ensureRealBackendToken();
    return confirmKrsSchedulesHelper(schedules, replaceExisting, {
      baseUrl: BASE_URL,
      token,
      useMock: false,
    });
  }

  async parseKrsText(text: string, saveToDatabase = false, geminiApiKey?: string): Promise<unknown> {
    const token = await this.ensureRealBackendToken();
    return parseKrsTextHelper(text, saveToDatabase, {
      baseUrl: BASE_URL,
      token,
      geminiApiKey,
      useMock: false,
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

  // --- In-App Contextual Notifications (MySQL UserNotification) ---
  async getNotifications(): Promise<{
    data: {
      unreadCount: number;
      items: Array<{
        id: string;
        category: string;
        title: string;
        message: string;
        actionTab?: string | null;
        actionLabel?: string | null;
        isRead: boolean;
        createdAt: string;
      }>;
    };
    meta: unknown;
  }> {
    if (USE_MOCK) {
      return {
        data: { unreadCount: 0, items: [] },
        meta: { timestamp: new Date().toISOString(), version: "v1.0" },
      };
    }
    return this.request("/notifications");
  }

  async markNotificationRead(id: string): Promise<void> {
    if (USE_MOCK) return;
    await this.request(`/notifications/${id}/read`, { method: "PATCH" });
  }

  async markAllNotificationsRead(): Promise<void> {
    if (USE_MOCK) return;
    await this.request("/notifications/read-all", { method: "PATCH" });
  }

  async deleteNotification(id: string): Promise<void> {
    if (USE_MOCK) return;
    await this.request(`/notifications/${id}`, { method: "DELETE" });
  }

  // --- Focus Workstation Tasks (MySQL FocusTask) ---
  async getFocusTasks(): Promise<{
    data: Array<{
      id: string;
      text: string;
      tag: string;
      isCompleted: boolean;
      createdAt?: string;
    }>;
    meta: unknown;
  }> {
    if (USE_MOCK) {
      return { data: [], meta: { timestamp: new Date().toISOString(), version: "v1.0" } };
    }
    return this.request("/focus-tasks");
  }

  async createFocusTask(payload: { text: string; tag: string }): Promise<{
    data: { id: string; text: string; tag: string; isCompleted: boolean; createdAt?: string };
    meta: unknown;
  }> {
    if (USE_MOCK) {
      return {
        data: { id: `task-${Date.now()}`, text: payload.text, tag: payload.tag, isCompleted: false },
        meta: { timestamp: new Date().toISOString(), version: "v1.0" },
      };
    }
    return this.request("/focus-tasks", {
      method: "POST",
      body: JSON.stringify(payload),
    });
  }

  async updateFocusTask(
    id: string,
    payload: { text?: string; tag?: string; isCompleted?: boolean }
  ): Promise<{
    data: { id: string; text: string; tag: string; isCompleted: boolean };
    meta: unknown;
  }> {
    if (USE_MOCK) {
      return {
        data: { id, text: payload.text ?? "", tag: payload.tag ?? "Tugas", isCompleted: Boolean(payload.isCompleted) },
        meta: { timestamp: new Date().toISOString(), version: "v1.0" },
      };
    }
    return this.request(`/focus-tasks/${id}`, {
      method: "PATCH",
      body: JSON.stringify(payload),
    });
  }

  async deleteFocusTask(id: string): Promise<void> {
    if (USE_MOCK) return;
    await this.request(`/focus-tasks/${id}`, { method: "DELETE" });
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

