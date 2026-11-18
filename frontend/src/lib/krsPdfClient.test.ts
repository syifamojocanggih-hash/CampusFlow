import assert from "node:assert/strict";
import test, { describe } from "node:test";
import {
  confirmKrsSchedules,
  parseKrsText,
  uploadKrsPdfPreview,
  validateExtractedCourse,
  validateKrsFile,
  type ExtractedKrsCourse,
} from "./krsPdfClient.ts";

describe("Frontend Mentahan KRS PDF Client (krsPdfClient.ts)", () => {
  test("validateKrsFile: meloloskan PDF valid dan menolak file non-PDF, kosong, atau > 5 MB", () => {
    assert.equal(
      validateKrsFile({ name: "KRS_2026.pdf", type: "application/pdf", size: 2048 }).valid,
      true
    );

    const empty = validateKrsFile({ name: "empty.pdf", type: "application/pdf", size: 0 });
    assert.equal(empty.valid, false);

    const wrongType = validateKrsFile({ name: "jadwal.jpg", type: "image/jpeg", size: 1024 });
    assert.equal(wrongType.valid, false);

    const tooBig = validateKrsFile({
      name: "huge.pdf",
      type: "application/pdf",
      size: 6 * 1024 * 1024,
    });
    assert.equal(tooBig.valid, false);
  });

  test("validateExtractedCourse: memvalidasi item jadwal dan mendeteksi kesalahan SKS/jam/class_type", () => {
    const validItem: ExtractedKrsCourse = {
      day_of_week: "Senin",
      subject_name: "Algoritma dan Pemrograman",
      credit_hours: 3,
      class_type: "teori",
      start_time: "08:00",
      end_time: "10:30",
      is_exam_week: false,
    };
    assert.deepEqual(validateExtractedCourse(validItem), []);

    const invalidItem: ExtractedKrsCourse = {
      day_of_week: "Senin",
      subject_name: "",
      credit_hours: 8,
      class_type: "teori",
      start_time: "8:00",
      end_time: "25:99",
      is_exam_week: false,
    };
    const errors = validateExtractedCourse(invalidItem);
    assert.ok(errors.length >= 3);
  });

  test("uploadKrsPdfPreview: mengirim multipart/form-data dengan Authorization & x-gemini-api-key ke /schedule/upload", async () => {
    let capturedUrl = "";
    let capturedMethod = "";
    let capturedAuth = "";
    let capturedGeminiKey = "";
    let hasFormData = false;

    const mockFetch = (async (url: RequestInfo | URL, init?: RequestInit) => {
      capturedUrl = String(url);
      capturedMethod = init?.method || "";
      const headers = (init?.headers || {}) as Record<string, string>;
      capturedAuth = headers["Authorization"] || "";
      capturedGeminiKey = headers["x-gemini-api-key"] || "";
      hasFormData = init?.body instanceof FormData;

      return new Response(
        JSON.stringify({
          data: {
            previewOnly: true,
            extractedCount: 1,
            source: "GEMINI_API",
            summary: {
              total_courses: 1,
              total_sks: 3,
              theory_sks: 3,
              practicum_sks: 0,
              daily_breakdown: [],
            },
            items: [
              {
                day_of_week: "Senin",
                subject_name: "Sistem Operasi",
                credit_hours: 3,
                class_type: "teori",
                start_time: "08:00",
                end_time: "10:30",
                is_exam_week: false,
              },
            ],
            message: "Berhasil ekstrak",
          },
          meta: { timestamp: new Date().toISOString(), version: "v1.0" },
        }),
        { status: 200, headers: { "Content-Type": "application/json" } }
      );
    }) as typeof fetch;

    const fakePdf = new Blob(["%PDF-1.4 test"], { type: "application/pdf" });
    Object.defineProperty(fakePdf, "name", { value: "krs.pdf" });

    const res = await uploadKrsPdfPreview(fakePdf as Blob & { name: string }, {
      baseUrl: "http://localhost:4000/api/v1",
      token: "jwt-demo-123",
      geminiApiKey: "gemini-key-xyz",
      useMock: false,
      fetchImpl: mockFetch,
    });

    assert.equal(capturedUrl, "http://localhost:4000/api/v1/schedule/upload");
    assert.equal(capturedMethod, "POST");
    assert.equal(capturedAuth, "Bearer jwt-demo-123");
    assert.equal(capturedGeminiKey, "gemini-key-xyz");
    assert.equal(hasFormData, true);
    assert.equal(res.data.previewOnly, true);
    assert.equal(res.data.items[0].subject_name, "Sistem Operasi");
  });

  test("confirmKrsSchedules: memvalidasi jadwal sebelum POST ke /schedule/confirm dan mengembalikan updatedBurnout", async () => {
    const items: ExtractedKrsCourse[] = [
      {
        day_of_week: "Selasa",
        subject_name: "Praktikum Jaringan",
        credit_hours: 2,
        class_type: "praktikum",
        start_time: "13:00",
        end_time: "15:30",
        is_exam_week: false,
      },
    ];

    let postedBody = "";
    const mockFetch = (async (_url: RequestInfo | URL, init?: RequestInit) => {
      postedBody = String(init?.body || "");
      return new Response(
        JSON.stringify({
          data: {
            saved: true,
            savedCount: 1,
            items,
            updatedBurnout: {
              logDate: "2026-11-18",
              dayOfWeek: 2,
              academicLoadScore: 3,
              screenFatigueScore: 0,
              recoveryScore: 35,
              burnoutIndex: 0,
              status: "LOW",
              fussionLogId: "log-1",
            },
          },
          meta: { timestamp: new Date().toISOString(), version: "v1.0" },
        }),
        { status: 201, headers: { "Content-Type": "application/json" } }
      );
    }) as typeof fetch;

    const res = await confirmKrsSchedules(items, true, {
      baseUrl: "http://localhost:4000/api/v1",
      token: "jwt-demo-123",
      useMock: false,
      fetchImpl: mockFetch,
    });

    assert.equal(res.data.saved, true);
    assert.equal(res.data.savedCount, 1);
    assert.equal(res.data.updatedBurnout.academicLoadScore, 3);
    assert.ok(postedBody.includes("Praktikum Jaringan"));
  });

  test("parseKrsText: memanggil endpoint preview atau save sesuai parameter saveToDatabase", async () => {
    const calledUrls: string[] = [];
    const mockFetch = (async (url: RequestInfo | URL) => {
      calledUrls.push(String(url));
      return new Response(JSON.stringify({ data: { extractedCount: 1 } }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    }) as typeof fetch;

    await parseKrsText("Senin 08:00-10:00 Algoritma 3 SKS", false, {
      baseUrl: "http://localhost:4000/api/v1",
      fetchImpl: mockFetch,
    });
    await parseKrsText("Senin 08:00-10:00 Algoritma 3 SKS", true, {
      baseUrl: "http://localhost:4000/api/v1",
      fetchImpl: mockFetch,
    });

    assert.equal(calledUrls[0], "http://localhost:4000/api/v1/schedule/parse-krs/preview");
    assert.equal(calledUrls[1], "http://localhost:4000/api/v1/schedule/parse-krs");
  });
});
