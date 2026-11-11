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
  TriadDashboardResponse,
  AiCoachInsightResponse,
  PostureBaseline,
  DailyWellbeingPayload,
  PhysicalActivityPayload,
} from "@/types";

const USE_MOCK = import.meta.env.VITE_USE_MOCK === "true";
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
      // Ambil baseline lokal jika ada
      const savedBaseline = localStorage.getItem("cf_posture_baseline");
      const user = { ...MOCK_USER };
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
}

export const api = new ApiClient();

