import assert from "node:assert/strict";
import type { Server } from "node:http";
import test, { after, before, describe } from "node:test";
import { createApp } from "../app.ts";
import { prisma } from "../lib/prisma.ts";
import { signAuthToken } from "../middleware/auth.ts";

describe("Kelengkapan Endpoint Backend & Integrasi PRD v4.0", () => {
  let server: Server;
  let baseUrl: string;
  let authToken: string;
  const TEST_USER_ID = "endpoints-completion-test-user";
  const originalFetch = globalThis.fetch;

  before(async () => {
    await prisma.user.upsert({
      where: { id: TEST_USER_ID },
      update: {
        name: "Completion Test Student",
        xpPoints: 100,
      },
      create: {
        id: TEST_USER_ID,
        name: "Completion Test Student",
        nim: "4.33.24.9.77",
        email: "completion-test@campusflow.id",
        passwordHash: "dummyhash",
        department: "Teknik Informatika",
        weeklyMetsTarget: 1500,
        targetRecoveryScore: 80,
        currentStreakDays: 1,
        xpPoints: 100,
      },
    });

    authToken = signAuthToken({
      sub: TEST_USER_ID,
      email: "completion-test@campusflow.id",
    });

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
    try {
      await prisma.academicSchedule.deleteMany({ where: { userId: TEST_USER_ID } });
      await prisma.dailyFussionLog.deleteMany({ where: { userId: TEST_USER_ID } });
      await prisma.activeBreakSession.deleteMany({ where: { userId: TEST_USER_ID } });
      await prisma.dailyWellbeingLog.deleteMany({ where: { userId: TEST_USER_ID } });
      await prisma.userNotification.deleteMany({ where: { userId: TEST_USER_ID } });
      await prisma.user.deleteMany({ where: { id: TEST_USER_ID } });
    } catch (_e) {
      // Abaikan jika sudah terhapus
    }

    await new Promise<void>((resolve, reject) => {
      server.close((err) => (err ? reject(err) : resolve()));
    });
  });

  test("POST /burnout/calculate-today & GET /burnout/history: menghitung dan mengembalikan riwayat tren burnout", async () => {
    const todayStr = new Date().toISOString().slice(0, 10);
    const calcRes = await fetch(`${baseUrl}/burnout/calculate-today`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${authToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        logDate: todayStr,
        totalScreenTimeMins: 600, // 10 jam -> screenFatigue = (10-8)*2.5 = 5.0
        sleepHours: 6.0,
      }),
    });
    assert.equal(calcRes.status, 200);
    const calcBody: any = await calcRes.json();
    assert.equal(calcBody.data.screenFatigueScore, 5);

    const historyRes = await fetch(`${baseUrl}/burnout/history?days=14`, {
      headers: { Authorization: `Bearer ${authToken}` },
    });
    assert.equal(historyRes.status, 200);
    const historyBody: any = await historyRes.json();
    assert.equal(historyBody.data.days, 14);
    assert.ok(historyBody.data.count >= 1);
    assert.ok(Array.isArray(historyBody.data.items));
    assert.equal(typeof historyBody.data.summary.averageBurnoutIndex, "number");
  });

  test("POST /active-break/verify + GET /active-break/today & /history: otomatis menyinkronkan DailyFussionLog dan XP", async () => {
    const verifyRes = await fetch(`${baseUrl}/active-break/verify`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${authToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        durationMins: 2.0,
        poseVerified: true,
        poseType: "OVERHEAD_ARM_STRETCH",
      }),
    });
    assert.equal(verifyRes.status, 201);
    const verifyBody: any = await verifyRes.json();
    assert.equal(verifyBody.data.xpAwarded, 15);
    assert.equal(verifyBody.data.recoveryPointsAdded, 10);
    assert.ok(verifyBody.data.updatedBurnout.verifiedBreakCount >= 1);

    const todayRes = await fetch(`${baseUrl}/active-break/today`, {
      headers: { Authorization: `Bearer ${authToken}` },
    });
    assert.equal(todayRes.status, 200);
    const todayBody: any = await todayRes.json();
    assert.ok(todayBody.data.verifiedCount >= 1);
    assert.equal(todayBody.data.totalRecoveryPoints, todayBody.data.verifiedCount * 10);

    const histRes = await fetch(`${baseUrl}/active-break/history?days=7`, {
      headers: { Authorization: `Bearer ${authToken}` },
    });
    assert.equal(histRes.status, 200);
    const histBody: any = await histRes.json();
    assert.equal(histBody.data.days, 7);
    assert.ok(histBody.data.items.length >= 1);
  });

  test("PATCH /schedule/:id & DELETE /schedule/:id: memperbarui jadwal, sinkronisasi classType, dan hitung ulang burnout", async () => {
    const todayDow = new Date().getDay() === 0 ? 7 : new Date().getDay();
    const createRes = await fetch(`${baseUrl}/schedule`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${authToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        dayOfWeek: todayDow,
        subjectName: "Sistem Terdistribusi",
        creditHours: 3,
        isPracticum: false,
        isExamWeek: false,
      }),
    });
    assert.equal(createRes.status, 201);
    const created: any = await createRes.json();
    const scheduleId = created.data.id;

    // Update ke praktikum + pekan ujian + jam kuliah
    const patchRes = await fetch(`${baseUrl}/schedule/${scheduleId}`, {
      method: "PATCH",
      headers: {
        Authorization: `Bearer ${authToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        classType: "praktikum",
        isExamWeek: true,
        startTime: "10:00",
        endTime: "12:30",
      }),
    });
    assert.equal(patchRes.status, 200);
    const patched: any = await patchRes.json();
    assert.equal(patched.data.isPracticum, true);
    assert.equal(patched.data.classType, "praktikum");
    assert.equal(patched.data.isExamWeek, true);
    assert.equal(patched.data.startTime, "10:00");
    // 3 SKS * 1.5 + 3.0 penalti ujian = 7.5
    assert.ok(patched.data.updatedBurnout.academicLoadScore >= 7.5);

    // Nonexistent ID -> 404
    const notFoundRes = await fetch(`${baseUrl}/schedule/non-existent-id`, {
      method: "PATCH",
      headers: {
        Authorization: `Bearer ${authToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ isExamWeek: false }),
    });
    assert.equal(notFoundRes.status, 404);

    // Delete & recalculate
    const delRes = await fetch(`${baseUrl}/schedule/${scheduleId}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${authToken}` },
    });
    assert.equal(delRes.status, 200);
    const delBody: any = await delRes.json();
    assert.equal(delBody.data.deleted, true);
    assert.ok(delBody.data.updatedBurnout);
  });

  test("POST /wellbeing/checkin + GET /wellbeing/today & /history: mencatat & membaca log wellbeing", async () => {
    const todayStr = new Date().toISOString().slice(0, 10);
    const postRes = await fetch(`${baseUrl}/wellbeing/checkin`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${authToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        logDate: todayStr,
        sleepHours: 7.5,
        sleepQualityScore: 4,
        nonAcademicScreenHours: 2.5,
        pss4Answers: [1, 3, 3, 1], // 1 + (4-3) + (4-3) + 1 = 4 (LOW)
      }),
    });
    assert.equal(postRes.status, 201);

    const todayRes = await fetch(`${baseUrl}/wellbeing/today`, {
      headers: { Authorization: `Bearer ${authToken}` },
    });
    assert.equal(todayRes.status, 200);
    const todayBody: any = await todayRes.json();
    assert.equal(todayBody.data.checkedInToday, true);
    assert.equal(todayBody.data.log.pss4TotalScore, 4);

    const histRes = await fetch(`${baseUrl}/wellbeing/history?days=7`, {
      headers: { Authorization: `Bearer ${authToken}` },
    });
    assert.equal(histRes.status, 200);
    const histBody: any = await histRes.json();
    assert.ok(histBody.data.count >= 1);
  });

  test("POST /schedule/upload (multipart/form-data PDF) + Mock Gemini API: mengembalikan preview tanpa commit DB", async () => {
    // Mock hanya pemanggilan eksternal Gemini API; teruskan fetch lokal ke Express server
    globalThis.fetch = (async (input: any, init?: any) => {
      const url = typeof input === "string" ? input : input.toString();
      if (url.includes("generativelanguage.googleapis.com")) {
        return new Response(
          JSON.stringify({
            candidates: [
              {
                content: {
                  parts: [
                    {
                      text: JSON.stringify([
                        {
                          day_of_week: "Senin",
                          subject_name: "Pemrograman Berbasis Web",
                          credit_hours: 3,
                          class_type: "praktikum",
                          start_time: "08:00",
                          end_time: "10:30",
                          is_exam_week: false,
                        },
                      ]),
                    },
                  ],
                },
              },
            ],
          }),
          { status: 200, headers: { "Content-Type": "application/json" } }
        );
      }
      return originalFetch(input, init);
    }) as typeof fetch;

    try {
      const formData = new FormData();
      const fakePdf = new Blob(["%PDF-1.4 sample binary"], { type: "application/pdf" });
      formData.append("file", fakePdf, "krs-semester-5.pdf");

      const uploadRes = await fetch(`${baseUrl}/schedule/upload`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${authToken}`,
          "x-gemini-api-key": "mock-gemini-key",
        },
        body: formData,
      });

      assert.equal(uploadRes.status, 200);
      const body: any = await uploadRes.json();
      assert.equal(body.data.previewOnly, true);
      assert.equal(body.data.source, "GEMINI_API");
      assert.equal(body.data.extractedCount, 1);
      assert.equal(body.data.items[0].subject_name, "Pemrograman Berbasis Web");
      assert.equal(body.data.items[0].class_type, "praktikum");
    } finally {
      globalThis.fetch = originalFetch;
    }
  });

  test("PATCH /users/me, POST /posture/baseline, dan DELETE /users/me/data (termasuk bersih data PRD v4.0)", async () => {
    const patchUserRes = await fetch(`${baseUrl}/users/me`, {
      method: "PATCH",
      headers: {
        Authorization: `Bearer ${authToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        name: "Mahasiswa Updated",
        targetRecoveryScore: 85,
      }),
    });
    assert.equal(patchUserRes.status, 200);
    const patchedUser: any = await patchUserRes.json();
    assert.equal(patchedUser.data.name, "Mahasiswa Updated");
    assert.equal(patchedUser.data.targetRecoveryScore, 85);

    const baselineRes = await fetch(`${baseUrl}/posture/baseline`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${authToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        shoulderWidth: 0.35,
        shoulderY: 0.55,
        neckVerticalDist: 0.12,
        torsoNeckAngle: 12,
        timestamp: Date.now(),
      }),
    });
    assert.equal(baselineRes.status, 200);

    // Clear semua data user (termasuk tabel PRD v4.0)
    const clearRes = await fetch(`${baseUrl}/users/me/data`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${authToken}` },
    });
    assert.equal(clearRes.status, 200);

    const [fussionCount, breakCount, scheduleCount] = await Promise.all([
      prisma.dailyFussionLog.count({ where: { userId: TEST_USER_ID } }),
      prisma.activeBreakSession.count({ where: { userId: TEST_USER_ID } }),
      prisma.academicSchedule.count({ where: { userId: TEST_USER_ID } }),
    ]);
    assert.equal(fussionCount, 0);
    assert.equal(breakCount, 0);
    assert.equal(scheduleCount, 0);
  });

  test("OS Screen Lock Enforcer endpoints (/os-lock/arm, /disarm, /lock, /status, /unlock)", async () => {
    const armRes = await fetch(`${baseUrl}/os-lock/arm`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        durationSeconds: 30,
        reason: "Uji Screen Time Lock",
        targetUrl: "http://localhost:5174",
      }),
    });
    assert.equal(armRes.status, 200);
    const armBody: any = await armRes.json();
    assert.equal(armBody.data.isArmed, true);
    assert.equal(armBody.data.armedDurationSeconds, 30);

    const disarmRes = await fetch(`${baseUrl}/os-lock/disarm`, { method: "POST" });
    assert.equal(disarmRes.status, 200);
    const disarmBody: any = await disarmRes.json();
    assert.equal(disarmBody.data.isArmed, false);

    const lockRes = await fetch(`${baseUrl}/os-lock/lock`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        reason: "Screen Time Tercapai — Wajib Peregangan",
        targetUrl: "http://localhost:5174",
      }),
    });
    assert.equal(lockRes.status, 200);
    const lockBody: any = await lockRes.json();
    assert.equal(lockBody.data.isLocked, true);

    const statusRes = await fetch(`${baseUrl}/os-lock/status`);
    assert.equal(statusRes.status, 200);
    const statusBody: any = await statusRes.json();
    assert.equal(statusBody.data.isLocked, true);

    const unlockRes = await fetch(`${baseUrl}/os-lock/unlock`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ verificationSource: "POSE_CAMERA_AI" }),
    });
    assert.equal(unlockRes.status, 200);
    const unlockBody: any = await unlockRes.json();
    assert.equal(unlockBody.data.isLocked, false);
    assert.equal(unlockBody.data.lastUnlockSource, "POSE_CAMERA_AI");
  });

  test("GET /dashboard/daily-summary, /notifications CRUD, & /os-lock/screentime/sync tersambung penuh ke MySQL", async () => {
    // 1. Sinkronkan screen time terautentikasi ke MySQL DailyFussionLog
    const syncRes = await fetch(`${baseUrl}/os-lock/screentime/sync`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${authToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ clientSeconds: 7200 }), // 120 menit
    });
    assert.equal(syncRes.status, 200);
    const syncBody: any = await syncRes.json();
    assert.equal(syncBody.data.persistedToDb, true);
    assert.ok(syncBody.data.osActiveMinutes >= 120);

    // 2. Ambil ringkasan harian dinamis dari MySQL
    const summaryRes = await fetch(`${baseUrl}/dashboard/daily-summary`, {
      headers: { Authorization: `Bearer ${authToken}` },
    });
    assert.equal(summaryRes.status, 200);
    const summaryBody: any = await summaryRes.json();
    assert.equal(summaryBody.data.user.id, TEST_USER_ID);
    assert.ok(summaryBody.data.burnout.totalScreenTimeMins >= 120);
    assert.equal(typeof summaryBody.data.unreadNotifications, "number");

    // 3. Notifikasi harian dinamis berbasis database
    const notifRes = await fetch(`${baseUrl}/notifications`, {
      headers: { Authorization: `Bearer ${authToken}` },
    });
    assert.equal(notifRes.status, 200);
    const notifBody: any = await notifRes.json();
    assert.ok(Array.isArray(notifBody.data.items));
    assert.equal(typeof notifBody.data.unreadCount, "number");

    if (notifBody.data.items.length > 0) {
      const firstId = notifBody.data.items[0].id;
      const readRes = await fetch(`${baseUrl}/notifications/${firstId}/read`, {
        method: "PATCH",
        headers: { Authorization: `Bearer ${authToken}` },
      });
      assert.equal(readRes.status, 200);
      const readBody: any = await readRes.json();
      assert.equal(readBody.data.isRead, true);

      const delRes = await fetch(`${baseUrl}/notifications/${firstId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${authToken}` },
      });
      assert.equal(delRes.status, 200);
      const delBody: any = await delRes.json();
      assert.equal(delBody.data.deleted, true);
    }

    // 4. Register dengan email yang sudah ada ditolak 409 (tidak menimpa akun)
    const dupRes = await fetch(`${baseUrl}/auth/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: "Penyerang",
        nim: "9.99.99.9.99",
        email: "completion-test@campusflow.id",
        password: "hacked-password",
      }),
    });
    assert.equal(dupRes.status, 409);
  });
});
