import assert from "node:assert/strict";
import type { Server } from "node:http";
import test, { after, before } from "node:test";
import { createApp } from "./app.ts";
import { prisma } from "./lib/prisma.ts";

let server: Server;
let baseUrl = "";
const DEMO_USER_ID = "demo-user-test-id";
const originalFetch = globalThis.fetch;

/** Mengganti sementara model delegate Prisma (Proxy) selama eksekusi tes lalu mengembalikannya. */
async function withStubbedPrisma(
  stubs: Record<string, Record<string, unknown>>,
  fn: () => Promise<void>
) {
  const originals = new Map<string, PropertyDescriptor | undefined>();
  for (const [model, methods] of Object.entries(stubs)) {
    originals.set(model, Object.getOwnPropertyDescriptor(prisma, model));
    Object.defineProperty(prisma, model, {
      value: methods,
      configurable: true,
      writable: true,
    });
  }
  try {
    await fn();
  } finally {
    for (const [model, descriptor] of originals.entries()) {
      if (descriptor) {
        Object.defineProperty(prisma, model, descriptor);
      } else {
        delete (prisma as unknown as Record<string, unknown>)[model];
      }
    }
  }
}

before(async () => {
  // Isolasi tes route dari server Ollama eksternal agar deterministik di CI & lokal
  globalThis.fetch = (async (input: string | URL | Request, init?: RequestInit) => {
    const url = typeof input === "string" ? input : input instanceof URL ? input.href : input.url;
    if (url.includes(":11434")) {
      throw new Error("Simulated offline Ollama for deterministic route test");
    }
    return originalFetch(input, init);
  }) as typeof fetch;

  await new Promise<void>((resolve) => {
    server = createApp().listen(0, () => {
      const address = server.address();
      if (address && typeof address === "object") {
        baseUrl = `http://127.0.0.1:${address.port}/api/v1`;
      }
      resolve();
    });
  });
});

after(async () => {
  globalThis.fetch = originalFetch;
  await new Promise<void>((resolve, reject) => {
    server.close((err) => (err ? reject(err) : resolve()));
  });
});

test("GET /health mengembalikan status healthy dengan amplop standar", async () => {
  const res = await fetch(`${baseUrl}/health`);
  const json = (await res.json()) as { data: { status: string }; meta: { version: string } };
  assert.equal(res.status, 200);
  assert.equal(json.data.status, "healthy");
  assert.equal(json.meta.version, "v1.0");
});

test("Endpoint tidak dikenal mengembalikan JSON 404 NOT_FOUND", async () => {
  const res = await fetch(`${baseUrl}/unknown-route`);
  const json = (await res.json()) as { error: { code: string } };
  assert.equal(res.status, 404);
  assert.equal(json.error.code, "NOT_FOUND");
});

test("GET /users/me tanpa Bearer token ditolak 401 UNAUTHORIZED", async () => {
  const res = await fetch(`${baseUrl}/users/me`);
  const json = (await res.json()) as { error: { code: string } };
  assert.equal(res.status, 401);
  assert.equal(json.error.code, "UNAUTHORIZED");
});

test("Alur lengkap Auth Demo -> Wellbeing PSS-4 -> Activities -> AI Coach (mocked Prisma)", async () => {
  const demoUser = {
    id: DEMO_USER_ID,
    name: "Mahasiswa Demo",
    nim: "4.33.24.0.01",
    email: "demo@campusflow.id",
    passwordHash: "hashed",
    department: "Teknik Informatika",
    weeklyMetsTarget: 1500,
    postureBaselineJson: null,
    pushSubscription: null,
    currentStreakDays: 7,
    xpPoints: 420,
    createdAt: new Date(),
  };

  await withStubbedPrisma(
    {
      user: {
        findUnique: async () => demoUser,
        update: async () => ({ ...demoUser, xpPoints: 440 }),
      },
      sedentarySession: {
        aggregate: async () => ({ _sum: { durationMinutes: 300 } }),
        deleteMany: async () => ({ count: 1 }),
      },
      physicalActivity: {
        aggregate: async () => ({ _sum: { durationMinutes: 35 } }),
        create: async (args: { data: Record<string, unknown> }) => ({
          id: "act-1",
          ...args.data,
        }),
        deleteMany: async () => ({ count: 1 }),
      },
      dailyWellbeingLog: {
        upsert: async (args: { create: Record<string, unknown> }) => ({
          id: "log-1",
          ...args.create,
        }),
        findUnique: async () => null,
        deleteMany: async () => ({ count: 1 }),
        findMany: async (args?: { orderBy?: { logDate?: "asc" | "desc" } }) => {
          const rows = [
            {
              logDate: new Date("2026-11-11T00:00:00.000Z"),
              totalSedentaryHours: 5.0,
              totalMvpaMinutes: 35,
              mvpaPerSedentaryRatio: 7.0,
              sleepHours: 6.0,
              sleepQualityScore: 2,
              pss4TotalScore: 11,
              triadPillarsMet: 1,
            },
            {
              logDate: new Date("2026-11-10T00:00:00.000Z"),
              totalSedentaryHours: 6.0,
              totalMvpaMinutes: 30,
              mvpaPerSedentaryRatio: 5.0,
              sleepHours: 7.0,
              sleepQualityScore: 3,
              pss4TotalScore: 7,
              triadPillarsMet: 2,
            },
          ];
          return args?.orderBy?.logDate === "asc" ? [...rows].reverse() : rows;
        },
      },
      clinicalAssessment: {
        findFirst: async () => null,
        deleteMany: async () => ({ count: 1 }),
      },
      aiCoachingInsight: {
        create: async (args: { data: Record<string, unknown> }) => ({
          id: "insight-1",
          createdAt: new Date().toISOString(),
          isCompleted: false,
          ...args.data,
        }),
        findMany: async () => [
          {
            id: "insight-1",
            dominantMediator: "SLEEP_MEDIATION_DEFICIT",
            isCompleted: false,
          },
        ],
        deleteMany: async () => ({ count: 1 }),
      },
      $transaction: (async (ops: unknown[]) => ops) as unknown as Record<string, unknown>,
    },
    async () => {
      // 1. Login akun demo
      const loginRes = await fetch(`${baseUrl}/auth/demo`, { method: "POST" });
      const loginJson = (await loginRes.json()) as {
        data: { token: string; user: Record<string, unknown> };
      };
      assert.equal(loginRes.status, 200);
      assert.ok(loginJson.data.token);
      assert.equal("passwordHash" in loginJson.data.user, false);

      const authHeaders = {
        Authorization: `Bearer ${loginJson.data.token}`,
        "Content-Type": "application/json",
      };

      // 2. Akses /users/me dengan JWT valid
      const meRes = await fetch(`${baseUrl}/users/me`, { headers: authHeaders });
      assert.equal(meRes.status, 200);

      // 3. Validasi input PSS-4 di luar rentang 0..4 ditolak 400
      const invalidWellbeing = await fetch(`${baseUrl}/wellbeing/daily`, {
        method: "POST",
        headers: authHeaders,
        body: JSON.stringify({
          logDate: "2026-11-11",
          sleepHours: 7,
          sleepQualityScore: 4,
          pss4Answers: [9, 0, 0, 0],
        }),
      });
      const invalidJson = (await invalidWellbeing.json()) as { error: { code: string } };
      assert.equal(invalidWellbeing.status, 400);
      assert.equal(invalidJson.error.code, "VALIDATION_ERROR");

      // 4. Submit PSS-4 valid -> reverse score Q2 & Q3
      const validWellbeing = await fetch(`${baseUrl}/wellbeing/daily`, {
        method: "POST",
        headers: authHeaders,
        body: JSON.stringify({
          logDate: "2026-11-11",
          sleepHours: 6.0,
          sleepQualityScore: 2,
          nonAcademicScreenHours: 4.5,
          pss4Answers: [2, 1, 1, 3], // 2 + 3 + 3 + 3 = 11 -> HIGH
        }),
      });
      const validJson = (await validWellbeing.json()) as {
        data: { pss4TotalScore: number; stressRiskLevel: string; currentStreakDays: number };
      };
      assert.equal(validWellbeing.status, 201);
      assert.equal(validJson.data.pss4TotalScore, 11);
      assert.equal(validJson.data.stressRiskLevel, "HIGH");
      assert.equal(validJson.data.currentStreakDays, 2);

      // 5. Submit aktivitas fisik -> hitung METs otoritatif
      const actRes = await fetch(`${baseUrl}/activities`, {
        method: "POST",
        headers: authHeaders,
        body: JSON.stringify({
          activityDate: "2026-11-11",
          intensityType: "MODERATE",
          durationMinutes: 25,
          stepsCount: 2800,
          avgCadenceSpm: 112,
          source: "WEB_SENSOR_API",
        }),
      });
      const actJson = (await actRes.json()) as { data: { calculatedMets: number } };
      assert.equal(actRes.status, 201);
      assert.equal(actJson.data.calculatedMets, 100);

      // 6. Generate AI Coach -> fallback klinis deterministik saat Ollama lokal offline
      const aiRes = await fetch(`${baseUrl}/ai-coach/generate`, {
        method: "POST",
        headers: authHeaders,
      });
      const aiJson = (await aiRes.json()) as {
        data: { dominantMediator: string; recommendedMetsToday: number };
      };
      assert.equal(aiRes.status, 201);
      assert.equal(aiJson.data.dominantMediator, "SLEEP_MEDIATION_DEFICIT");
      assert.ok(aiJson.data.recommendedMetsToday > 0);

      // 7. Ambil riwayat AI Coach
      const aiHistRes = await fetch(`${baseUrl}/ai-coach/history`, { headers: authHeaders });
      const aiHistJson = (await aiHistRes.json()) as { data: unknown[] };
      assert.equal(aiHistRes.status, 200);
      assert.equal(aiHistJson.data.length, 1);

      // 8. Hapus data privasi pengguna (DELETE /users/me/data)
      const clearRes = await fetch(`${baseUrl}/users/me/data`, {
        method: "DELETE",
        headers: authHeaders,
      });
      const clearJson = (await clearRes.json()) as { data: { cleared: boolean } };
      assert.equal(clearRes.status, 200);
      assert.equal(clearJson.data.cleared, true);
    }
  );
});

test("GET /notifications/vapid-public-key mengembalikan status konfigurasi VAPID", async () => {
  const res = await fetch(`${baseUrl}/notifications/vapid-public-key`);
  const json = (await res.json()) as { data: { configured: boolean } };
  assert.equal(res.status, 200);
  assert.equal(typeof json.data.configured, "boolean");
});
