import assert from "node:assert/strict";
import type { Server } from "node:http";
import test, { after, before, describe } from "node:test";
import { createApp } from "../app.ts";
import { prisma } from "../lib/prisma.ts";
import { AppError } from "../lib/response.ts";
import { signAuthToken } from "../middleware/auth.ts";
import {
  cleanJsonText,
  DAY_TO_NUMBER,
  extractJsonArrayString,
  NUMBER_TO_DAY,
  parseGeminiResponse,
  parseLocalScheduleFallback,
  parseSchedulePdf,
  scheduleItemSchema,
  scheduleListSchema,
  computeScheduleSummary,
} from "./scheduleParser.ts";

describe("Schedule Parser Service (Gemini API & Academic Planner)", () => {
  test("scheduleItemSchema: memvalidasi item jadwal yang valid secara presisi", () => {
    const valid = {
      day_of_week: "Senin",
      subject_name: "Algoritma dan Struktur Data",
      credit_hours: 3,
      class_type: "teori",
      start_time: "08:00",
      end_time: "09:40",
      is_exam_week: false,
    };

    const parsed = scheduleItemSchema.parse(valid);
    assert.equal(parsed.subject_name, "Algoritma dan Struktur Data");
    assert.equal(parsed.credit_hours, 3);
    assert.equal(parsed.class_type, "teori");
    assert.equal(parsed.start_time, "08:00");
    assert.equal(parsed.end_time, "09:40");
    assert.equal(parsed.is_exam_week, false);
  });

  test("scheduleItemSchema: menolak nilai SKS di luar rentang 1-6", () => {
    assert.throws(
      () =>
        scheduleItemSchema.parse({
          day_of_week: "Senin",
          subject_name: "Matematika Diskrit",
          credit_hours: 0,
          class_type: "teori",
          start_time: "08:00",
          end_time: "09:40",
        }),
      /SKS minimal 1/
    );

    assert.throws(
      () =>
        scheduleItemSchema.parse({
          day_of_week: "Senin",
          subject_name: "Matematika Diskrit",
          credit_hours: 7,
          class_type: "teori",
          start_time: "08:00",
          end_time: "09:40",
        }),
      /SKS maksimal 6/
    );
  });

  test("scheduleItemSchema: menolak nama hari yang tidak valid", () => {
    assert.throws(
      () =>
        scheduleItemSchema.parse({
          day_of_week: "Funday",
          subject_name: "Fisika Dasar",
          credit_hours: 3,
          class_type: "teori",
          start_time: "10:00",
          end_time: "11:40",
        }),
      /day_of_week wajib diisi nama hari yang valid/
    );
  });

  test("scheduleItemSchema: menolak class_type selain 'teori' atau 'praktikum'", () => {
    assert.throws(
      () =>
        scheduleItemSchema.parse({
          day_of_week: "Selasa",
          subject_name: "Praktikum Pemrograman",
          credit_hours: 2,
          class_type: "workshop",
          start_time: "13:00",
          end_time: "15:30",
        }),
      /class_type wajib 'teori' atau 'praktikum'/
    );
  });

  test("scheduleItemSchema: menolak format waktu yang tidak sesuai HH:mm", () => {
    assert.throws(
      () =>
        scheduleItemSchema.parse({
          day_of_week: "Rabu",
          subject_name: "Basis Data",
          credit_hours: 3,
          class_type: "teori",
          start_time: "8:00", // Tidak ada padding 0
          end_time: "09:40",
        }),
      /Format start_time harus HH:mm/
    );

    assert.throws(
      () =>
        scheduleItemSchema.parse({
          day_of_week: "Rabu",
          subject_name: "Basis Data",
          credit_hours: 3,
          class_type: "teori",
          start_time: "25:00", // Jam invalid
          end_time: "09:40",
        }),
      /Format start_time harus HH:mm/
    );
  });

  test("cleanJsonText & extractJsonArrayString: membersihkan markdown code fences dan teks luar", () => {
    const raw = `Berikut hasil ekstraksi jadwal kuliah Anda:
\`\`\`json
[
  {
    "day_of_week": "Kamis",
    "subject_name": "Jaringan Komputer",
    "credit_hours": 3,
    "class_type": "teori",
    "start_time": "07:30",
    "end_time": "10:00",
    "is_exam_week": false
  }
]
\`\`\`
Semoga membantu belajar!`;

    const extracted = extractJsonArrayString(raw);
    assert.ok(extracted);
    assert.ok(extracted.startsWith("["));
    assert.ok(extracted.endsWith("]"));
  });

  test("parseGeminiResponse: mem-parsing response bersih", () => {
    const json = JSON.stringify([
      {
        day_of_week: "Senin",
        subject_name: "Kecerdasan Buatan",
        credit_hours: 3,
        class_type: "teori",
        start_time: "08:00",
        end_time: "10:30",
        is_exam_week: false,
      },
      {
        day_of_week: "Rabu",
        subject_name: "Praktikum Kecerdasan Buatan",
        credit_hours: 1,
        class_type: "praktikum",
        start_time: "13:00",
        end_time: "15:00",
        is_exam_week: false,
      },
    ]);

    const items = parseGeminiResponse(json);
    assert.equal(items.length, 2);
    assert.equal(items[0].subject_name, "Kecerdasan Buatan");
    assert.equal(items[0].class_type, "teori");
    assert.equal(items[1].class_type, "praktikum");
  });

  test("parseGeminiResponse: menangani response 'kotor' dengan markdown dan teks pembuka/penutup", () => {
    const dirty = `Halo! Ini jadwal kuliah yang berhasil diekstrak:
\`\`\`json
[
  {
    "day_of_week": "Jumat",
    "subject_name": "Sistem Operasi",
    "credit_hours": 3,
    "class_type": "teori",
    "start_time": "08:00",
    "end_time": "10:30",
    "is_exam_week": false
  }
]
\`\`\`
Harap cek kembali ruangannya.`;

    const items = parseGeminiResponse(dirty);
    assert.equal(items.length, 1);
    assert.equal(items[0].day_of_week, "Jumat");
    assert.equal(items[0].subject_name, "Sistem Operasi");
  });

  test("parseGeminiResponse: melakukan normalisasi otomatis jika ada variasi case atau format waktu", () => {
    const unnormalized = JSON.stringify([
      {
        day_of_week: "selasa", // huruf kecil
        subject_name: "Pemrograman Web",
        credit_hours: "3", // string angka
        class_type: "praktikum lab", // deskripsi varian
        start_time: "8.00", // tanda titik
        end_time: "10.30",
      },
    ]);

    const items = parseGeminiResponse(unnormalized);
    assert.equal(items.length, 1);
    assert.equal(items[0].day_of_week, "Selasa");
    assert.equal(items[0].credit_hours, 3);
    assert.equal(items[0].class_type, "praktikum");
    assert.equal(items[0].start_time, "08:00");
    assert.equal(items[0].end_time, "10:30");
  });

  test("parseGeminiResponse: melempar error eksplisit PDF_UNREADABLE jika respons kosong atau array kosong", () => {
    assert.throws(
      () => parseGeminiResponse(""),
      (err: any) =>
        err instanceof AppError &&
        err.code === "VALIDATION_ERROR" &&
        err.details?.reason === "PDF_UNREADABLE"
    );

    assert.throws(
      () => parseGeminiResponse("[]"),
      (err: any) =>
        err instanceof AppError &&
        err.code === "VALIDATION_ERROR" &&
        err.details?.reason === "PDF_UNREADABLE"
    );

    assert.throws(
      () => parseGeminiResponse("Maaf dokumen ini buram tidak terbaca."),
      (err: any) =>
        err instanceof AppError &&
        err.code === "VALIDATION_ERROR" &&
        err.details?.reason === "PDF_UNREADABLE"
    );
  });

  test("parseSchedulePdf: berhasil memanggil Mock Gemini API dan memvalidasi JSON", async () => {
    const originalFetch = global.fetch;

    global.fetch = async (_url: any, _options: any) => {
      const mockGeminiJson = {
        candidates: [
          {
            content: {
              parts: [
                {
                  text: JSON.stringify([
                    {
                      day_of_week: "Senin",
                      subject_name: "Rekayasa Perangkat Lunak",
                      credit_hours: 3,
                      class_type: "teori",
                      start_time: "08:00",
                      end_time: "10:30",
                      is_exam_week: false,
                    },
                    {
                      day_of_week: "Kamis",
                      subject_name: "Praktikum RPL",
                      credit_hours: 1,
                      class_type: "praktikum",
                      start_time: "13:00",
                      end_time: "15:00",
                      is_exam_week: false,
                    },
                  ]),
                },
              ],
            },
          },
        ],
      };

      return new Response(JSON.stringify(mockGeminiJson), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    };

    try {
      const fakePdfBuffer = Buffer.from("%PDF-1.4 Mock minimal PDF binary content");
      const result = await parseSchedulePdf(fakePdfBuffer, {
        apiKey: "fake_test_gemini_key",
      });

      assert.equal(result.source, "GEMINI_API");
      assert.equal(result.items.length, 2);
      assert.equal(result.items[0].subject_name, "Rekayasa Perangkat Lunak");
      assert.equal(result.items[1].class_type, "praktikum");
    } finally {
      global.fetch = originalFetch;
    }
  });

  test("computeScheduleSummary: menghitung akumulasi SKS dan beban stres per hari", () => {
    const items = [
      {
        day_of_week: "Senin" as const,
        subject_name: "Algoritma",
        credit_hours: 3,
        class_type: "teori" as const,
        start_time: "08:00",
        end_time: "10:30",
        is_exam_week: false,
      },
      {
        day_of_week: "Senin" as const,
        subject_name: "Praktikum Algoritma",
        credit_hours: 1,
        class_type: "praktikum" as const,
        start_time: "13:00",
        end_time: "15:00",
        is_exam_week: false,
      },
      {
        day_of_week: "Selasa" as const,
        subject_name: "Sistem Basis Data",
        credit_hours: 3,
        class_type: "teori" as const,
        start_time: "09:00",
        end_time: "11:30",
        is_exam_week: true, // +3.0 penalti ujian
      },
    ];

    const summary = computeScheduleSummary(items);
    assert.equal(summary.total_courses, 3);
    assert.equal(summary.total_sks, 7);
    assert.equal(summary.theory_sks, 6);
    assert.equal(summary.practicum_sks, 1);

    const senin = summary.daily_breakdown.find((d) => d.day_of_week === "Senin");
    assert.ok(senin);
    // Senin: 3 * 1.0 (teori) + 1 * 1.5 (praktikum) = 4.5
    assert.equal(senin.academic_load_score, 4.5);
    assert.equal(senin.stress_level, "MODERATE");

    const selasa = summary.daily_breakdown.find((d) => d.day_of_week === "Selasa");
    assert.ok(selasa);
    // Selasa: 3 * 1.0 + 3.0 (ujian) = 6.0
    assert.equal(selasa.academic_load_score, 6.0);
    assert.equal(selasa.stress_level, "HIGH");
  });
});

describe("Schedule Parser HTTP Endpoints (/api/academic-schedule & /api/v1/schedule)", () => {
  let server: Server;
  let baseUrl: string;
  let authToken: string;
  const TEST_USER_ID = "schedule-planner-test-user";

  before(async () => {
    await prisma.user.upsert({
      where: { id: TEST_USER_ID },
      update: {},
      create: {
        id: TEST_USER_ID,
        name: "Schedule Planner User",
        nim: "4.33.24.9.88",
        email: "schedule-planner@campusflow.id",
        passwordHash: "dummyhash",
        department: "Teknik Informatika",
        weeklyMetsTarget: 1500,
        currentStreakDays: 1,
        xpPoints: 100,
      },
    });

    authToken = signAuthToken({
      sub: TEST_USER_ID,
      email: "schedule-planner@campusflow.id",
    });

    await new Promise<void>((resolve) => {
      server = createApp().listen(0, () => {
        const address = server.address();
        if (address && typeof address === "object") {
          baseUrl = `http://127.0.0.1:${address.port}`;
        }
        resolve();
      });
    });
  });

  after(async () => {
    try {
      await prisma.academicSchedule.deleteMany({ where: { userId: TEST_USER_ID } });
      await prisma.dailyFussionLog.deleteMany({ where: { userId: TEST_USER_ID } });
      await prisma.user.deleteMany({ where: { id: TEST_USER_ID } });
    } catch (_e) {
      // Abaikan jika sudah bersih
    }

    await new Promise<void>((resolve, reject) => {
      server.close((err) => (err ? reject(err) : resolve()));
    });
  });

  test("POST /api/academic-schedule/upload: menolak tanpa autentikasi (401)", async () => {
    const res = await fetch(`${baseUrl}/api/academic-schedule/upload`, {
      method: "POST",
    });
    assert.equal(res.status, 401);
  });

  test("POST /api/academic-schedule/upload: menolak request tanpa file atau body (400)", async () => {
    const res = await fetch(`${baseUrl}/api/academic-schedule/upload`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${authToken}`,
      },
    });
    assert.equal(res.status, 400);
  });

  test("POST /api/academic-schedule/confirm: menyimpan jadwal dan memperbarui Burnout Index di DailyFussionLog", async () => {
    const payload = {
      schedules: [
        {
          day_of_week: "Senin",
          subject_name: "Kecerdasan Buatan",
          credit_hours: 3,
          class_type: "teori",
          start_time: "08:00",
          end_time: "10:30",
          is_exam_week: false,
        },
        {
          day_of_week: "Senin",
          subject_name: "Praktikum Kecerdasan Buatan",
          credit_hours: 1,
          class_type: "praktikum",
          start_time: "13:00",
          end_time: "15:00",
          is_exam_week: false,
        },
      ],
      replaceExisting: true,
    };

    const res = await fetch(`${baseUrl}/api/academic-schedule/confirm`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${authToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    assert.equal(res.status, 201);
    const body: any = await res.json();
    assert.equal(body.data.saved, true);
    assert.equal(body.data.savedCount, 2);
    assert.ok(body.data.updatedBurnout);
    assert.equal(typeof body.data.updatedBurnout.burnoutIndex, "number");

    // Verifikasi data tersimpan di database Prisma
    const saved = await prisma.academicSchedule.findMany({
      where: { userId: TEST_USER_ID },
    });
    assert.equal(saved.length, 2);
    const prak = saved.find((s) => s.isPracticum);
    assert.ok(prak);
    assert.equal(prak.classType, "praktikum");
  });
});
