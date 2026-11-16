import assert from "node:assert/strict";
import type { Server } from "node:http";
import test, { after, before, beforeEach } from "node:test";
import { createApp } from "../app.ts";
import { prisma } from "../lib/prisma.ts";
import { signAuthToken } from "../middleware/auth.ts";
import {
  cleanSubjectName,
  computeKrsStressBreakdown,
  detectDayOfWeek,
  detectExamWeek,
  detectPracticum,
  extractTextFromPdf,
  parseKrsDocument,
  parseKrsTextHeuristic,
  parseKrsWithGemini,
  type ParsedCourseItem,
} from "./krsParserService.ts";

let server: Server;
let baseUrl = "";
const TEST_USER_ID = "test-user-krs-123";
let authToken = "";

// Helper untuk membuat buffer PDF 1.4 minimal yang valid dengan teks tertentu
function createMinimalPdfBuffer(textLine: string): Buffer {
  const contentStream = `BT /F1 12 Tf 50 700 Td (${textLine}) Tj ET`;
  const streamLength = Buffer.byteLength(contentStream);

  const pdfString = `%PDF-1.4
1 0 obj << /Type /Catalog /Pages 2 0 R >> endobj
2 0 obj << /Type /Pages /Kids [3 0 R] /Count 1 >> endobj
3 0 obj << /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Contents 4 0 R /Resources << /Font << /F1 5 0 R >> >> >> endobj
4 0 obj << /Length ${streamLength} >> stream
${contentStream}
endstream
endobj
5 0 obj << /Type /Font /Subtype /Type1 /BaseFont /Helvetica >> endobj
xref
0 6
0000000000 65535 f 
0000000010 00000 n 
0000000060 00000 n 
0000000117 00000 n 
0000000234 00000 n 
0000000340 00000 n 
trailer << /Size 6 /Root 1 0 R >>
startxref
420
%%EOF`;

  return Buffer.from(pdfString);
}

const originalFetch = globalThis.fetch;

before(async () => {
  // Isolasi tes route dari LLM eksternal agar deterministik
  globalThis.fetch = (async (input: string | URL | Request, init?: RequestInit) => {
    const url = typeof input === "string" ? input : input instanceof URL ? input.href : input.url;
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
                        subjectName: "Kecerdasan Buatan dan Robotika",
                        creditHours: 3,
                        dayOfWeek: 3,
                        isPracticum: false,
                        isExamWeek: false,
                      },
                      {
                        subjectName: "Praktikum Robotika",
                        creditHours: 1,
                        dayOfWeek: 3,
                        isPracticum: true,
                        isExamWeek: false,
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
    if (url.includes(":11434")) {
      throw new Error("Simulated offline Ollama for deterministic test");
    }
    return originalFetch(input, init);
  }) as typeof fetch;

  await prisma.user.upsert({
    where: { id: TEST_USER_ID },
    update: {},
    create: {
      id: TEST_USER_ID,
      name: "KRS Test Student",
      nim: "4.33.24.9.99",
      email: "krs-test@campusflow.id",
      passwordHash: "dummyhash",
      department: "Teknik Informatika",
      weeklyMetsTarget: 1500,
      currentStreakDays: 1,
      xpPoints: 100,
    },
  });

  authToken = signAuthToken({
    sub: TEST_USER_ID,
    email: "krs-test@campusflow.id",
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
    await prisma.user.deleteMany({ where: { id: TEST_USER_ID } });
  } catch (_e) {
    // Abaikan jika sudah bersih
  }
  await new Promise<void>((resolve, reject) => {
    server.close((err) => (err ? reject(err) : resolve()));
  });
});

test("detectDayOfWeek: akurat mendeteksi hari bahasa Indonesia & Inggris, nama pendek, dan case-insensitive", () => {
  assert.equal(detectDayOfWeek("Kuliah Hari Senin Siang")?.dayOfWeek, 1);
  assert.equal(detectDayOfWeek("Kelas Selasa Pagi")?.dayOfWeek, 2);
  assert.equal(detectDayOfWeek("Rabu 08:00")?.dayOfWeek, 3);
  assert.equal(detectDayOfWeek("Kamis")?.dayOfWeek, 4);
  assert.equal(detectDayOfWeek("Jum'at Barokah")?.dayOfWeek, 5);
  assert.equal(detectDayOfWeek("Jumat")?.dayOfWeek, 5);
  assert.equal(detectDayOfWeek("Sabtu")?.dayOfWeek, 6);
  assert.equal(detectDayOfWeek("Minggu")?.dayOfWeek, 7);

  // English days
  assert.equal(detectDayOfWeek("Monday Morning")?.dayOfWeek, 1);
  assert.equal(detectDayOfWeek("Tuesday 10:00")?.dayOfWeek, 2);
  assert.equal(detectDayOfWeek("Wednesday")?.dayOfWeek, 3);
  assert.equal(detectDayOfWeek("Thursday")?.dayOfWeek, 4);
  assert.equal(detectDayOfWeek("Friday Lecture")?.dayOfWeek, 5);
  assert.equal(detectDayOfWeek("Saturday")?.dayOfWeek, 6);
  assert.equal(detectDayOfWeek("Sunday")?.dayOfWeek, 7);

  // Short forms
  assert.equal(detectDayOfWeek("Sen, 08.00")?.dayOfWeek, 1);
  assert.equal(detectDayOfWeek("Kam, 13.00")?.dayOfWeek, 4);
  assert.equal(detectDayOfWeek("Jum")?.dayOfWeek, 5);

  // Non-day text
  assert.equal(detectDayOfWeek("Kalkulus Diferensial"), null);
  assert.equal(detectDayOfWeek("12345"), null);
  assert.equal(detectDayOfWeek(""), null);
});

test("detectPracticum: mendeteksi variasi kata kunci praktikum dan studio (bobot stres 1.5x)", () => {
  assert.equal(detectPracticum("Praktikum Algoritma dan Struktur Data"), true);
  assert.equal(detectPracticum("Lab Jaringan Komputer"), true);
  assert.equal(detectPracticum("Laboratorium Basis Data"), true);
  assert.equal(detectPracticum("Workshop Desain Web"), true);
  assert.equal(detectPracticum("Studio Perancangan Arsitektur"), true);
  assert.equal(detectPracticum("Pemrograman Mobile (P)"), true);
  assert.equal(detectPracticum("Bengkel Mekatronika"), true);
  assert.equal(detectPracticum("Computer Graphics Practicum"), true);

  // Negative
  assert.equal(detectPracticum("Kalkulus II"), false);
  assert.equal(detectPracticum("Pendidikan Kewarganegaraan"), false);
  assert.equal(detectPracticum("Sistem Basis Data"), false);
});

test("detectExamWeek: mendeteksi indikator ujian (UTS/UAS/Responsi) untuk penalti +3.0 poin", () => {
  assert.equal(detectExamWeek("Algoritma Pemrograman (UTS H-7)"), true);
  assert.equal(detectExamWeek("Kecerdasan Buatan (UAS)"), true);
  assert.equal(detectExamWeek("Responsi Praktikum Basis Data"), true);
  assert.equal(detectExamWeek("Midterm Exam Computer Network"), true);
  assert.equal(detectExamWeek("Ujian Tengah Semester"), true);

  // Negative
  assert.equal(detectExamWeek("Algoritma Pemrograman Kelas A"), false);
  assert.equal(detectExamWeek("Pemrograman Web"), false);
});

test("cleanSubjectName: membersihkan kurung kosong, tanda baca liar, dan spasi ganda", () => {
  assert.equal(cleanSubjectName("   Pemrograman Web ()  "), "Pemrograman Web");
  assert.equal(cleanSubjectName("--- Struktur Data ---"), "Struktur Data");
  assert.equal(cleanSubjectName("Kecerdasan Buatan [] :"), "Kecerdasan Buatan");
  assert.equal(cleanSubjectName("Algoritma    dan    Pemrograman"), "Algoritma dan Pemrograman");
});

test("parseKrsTextHeuristic: parsing format tabel pipa dengan header SIAKAD", () => {
  const krsTable = `
KEMENTERIAN PENDIDIKAN, KEBUDAYAAN, RISET, DAN TEKNOLOGI
UNIVERSITAS TEKNOLOGI CAMPUSFLOW
KARTU RENCANA STUDI (KRS)
SEMESTER GANJIL 2026/2027

-------------------------------------------------------------------------------------------------
No | Kode    | Nama Mata Kuliah                  | SKS | Hari   | Waktu         | Ruang
-------------------------------------------------------------------------------------------------
1  | IF2101  | Algoritma dan Pemrograman         | 3   | Senin  | 08:00 - 10:30 | R.301
2  | IF2102  | Praktikum Algoritma               | 1   | Senin  | 13:00 - 15:30 | Lab Komputer
3  | IF2103  | Struktur Data Lanjut              | 4   | Selasa | 08:00 - 11:30 | R.202
4  | IF2104  | Praktikum Basis Data              | 1   | Kamis  | 10:00 - 12:00 | Lab Basis Data
5  | IF2105  | Kalkulus II                       | 3   | Jumat  | 08:00 - 10:30 | R.101
-------------------------------------------------------------------------------------------------
Total SKS: 12
`;

  const parsed = parseKrsTextHeuristic(krsTable);
  assert.equal(parsed.length, 5);

  // Item 1: Algoritma
  assert.equal(parsed[0].subjectName, "Algoritma dan Pemrograman");
  assert.equal(parsed[0].creditHours, 3);
  assert.equal(parsed[0].dayOfWeek, 1);
  assert.equal(parsed[0].dayName, "Senin");
  assert.equal(parsed[0].isPracticum, false);
  assert.equal(parsed[0].isExamWeek, false);

  // Item 2: Praktikum Algoritma (1 SKS, Practicum true)
  assert.equal(parsed[1].subjectName, "Praktikum Algoritma");
  assert.equal(parsed[1].creditHours, 1);
  assert.equal(parsed[1].dayOfWeek, 1);
  assert.equal(parsed[1].isPracticum, true);

  // Item 3: Struktur Data Lanjut (4 SKS, Selasa)
  assert.equal(parsed[2].subjectName, "Struktur Data Lanjut");
  assert.equal(parsed[2].creditHours, 4);
  assert.equal(parsed[2].dayOfWeek, 2);

  // Item 4: Praktikum Basis Data (1 SKS, Kamis, Practicum true)
  assert.equal(parsed[3].subjectName, "Praktikum Basis Data");
  assert.equal(parsed[3].creditHours, 1);
  assert.equal(parsed[3].dayOfWeek, 4);
  assert.equal(parsed[3].isPracticum, true);

  // Item 5: Kalkulus II (3 SKS, Jumat)
  assert.equal(parsed[4].subjectName, "Kalkulus II");
  assert.equal(parsed[4].creditHours, 3);
  assert.equal(parsed[4].dayOfWeek, 5);
});

test("parseKrsTextHeuristic: parsing format daftar silabus / teks bebas", () => {
  const krsList = `
Jadwal Kuliah Semester 5
1. Senin 08.00-10.00 Pemrograman Web (3 SKS)
2. Senin 13.00-15.00 Praktikum Pemrograman Web (1 SKS)
3. Rabu 09.00-11.30 Jaringan Komputer 3 SKS
4. Kamis 10.00-12.00 Lab Jaringan Komputer 1 SKS
5. Jumat 08.00-10.30 Kecerdasan Buatan 3 SKS (UTS H-7)
`;

  const parsed = parseKrsTextHeuristic(krsList);
  assert.equal(parsed.length, 5);

  assert.equal(parsed[0].subjectName, "Pemrograman Web");
  assert.equal(parsed[0].creditHours, 3);
  assert.equal(parsed[0].dayOfWeek, 1);

  assert.equal(parsed[1].subjectName, "Praktikum Pemrograman Web");
  assert.equal(parsed[1].creditHours, 1);
  assert.equal(parsed[1].isPracticum, true);

  assert.equal(parsed[2].subjectName, "Jaringan Komputer");
  assert.equal(parsed[2].creditHours, 3);
  assert.equal(parsed[2].dayOfWeek, 3);

  assert.equal(parsed[3].subjectName, "Lab Jaringan Komputer");
  assert.equal(parsed[3].creditHours, 1);
  assert.equal(parsed[3].isPracticum, true);

  assert.equal(parsed[4].subjectName, "Kecerdasan Buatan");
  assert.equal(parsed[4].creditHours, 3);
  assert.equal(parsed[4].dayOfWeek, 5);
  assert.equal(parsed[4].isExamWeek, true);
});

test("parseKrsTextHeuristic: deduplikasi entri berulang pada hari yang sama", () => {
  const duplicateText = `
Senin: Pemrograman Web (3 SKS)
Senin: Pemrograman Web (3 SKS)
Selasa: Praktikum Basis Data (1 SKS)
`;
  const parsed = parseKrsTextHeuristic(duplicateText);
  assert.equal(parsed.length, 2);
  assert.equal(parsed[0].subjectName, "Pemrograman Web");
  assert.equal(parsed[1].subjectName, "Praktikum Basis Data");
});

test("computeKrsStressBreakdown: menghitung beban akademik harian, bobot praktikum 1.5x, penalti ujian, dan peak load day", () => {
  const items: ParsedCourseItem[] = [
    // Senin: 3 SKS Teori (3.0) + 1 SKS Praktikum (1.5) = 4.5 -> MODERATE
    {
      dayOfWeek: 1,
      dayName: "Senin",
      subjectName: "Algoritma Pemrograman",
      creditHours: 3,
      isPracticum: false,
      isExamWeek: false,
    },
    {
      dayOfWeek: 1,
      dayName: "Senin",
      subjectName: "Praktikum Algoritma",
      creditHours: 1,
      isPracticum: true,
      isExamWeek: false,
    },
    // Selasa: 2 SKS Teori = 2.0 -> LOW
    {
      dayOfWeek: 2,
      dayName: "Selasa",
      subjectName: "Bahasa Inggris",
      creditHours: 2,
      isPracticum: false,
      isExamWeek: false,
    },
    // Jumat: 3 SKS Teori (3.0) + Ujian (+3.0) = 6.0 -> HIGH (Peak Load Day)
    {
      dayOfWeek: 5,
      dayName: "Jumat",
      subjectName: "Kecerdasan Buatan",
      creditHours: 3,
      isPracticum: false,
      isExamWeek: true,
    },
  ];

  const { summary, dailyBreakdown } = computeKrsStressBreakdown(items);

  assert.equal(summary.totalCourses, 4);
  assert.equal(summary.totalSks, 9);
  assert.equal(summary.theorySks, 8);
  assert.equal(summary.practicumSks, 1);
  assert.equal(summary.examCount, 1);

  // Breakdown Senin
  const senin = dailyBreakdown.find((d) => d.dayOfWeek === 1);
  assert.ok(senin);
  assert.equal(senin.academicLoadScore, 4.5);
  assert.equal(senin.stressLevel, "MODERATE");

  // Breakdown Selasa
  const selasa = dailyBreakdown.find((d) => d.dayOfWeek === 2);
  assert.ok(selasa);
  assert.equal(selasa.academicLoadScore, 2.0);
  assert.equal(selasa.stressLevel, "LOW");

  // Breakdown Jumat
  const jumat = dailyBreakdown.find((d) => d.dayOfWeek === 5);
  assert.ok(jumat);
  assert.equal(jumat.academicLoadScore, 6.0);
  assert.equal(jumat.stressLevel, "HIGH");

  // Peak Load Day harus hari Jumat dengan 6.0 poin
  assert.ok(summary.peakLoadDay);
  assert.equal(summary.peakLoadDay.dayOfWeek, 5);
  assert.equal(summary.peakLoadDay.dayName, "Jumat");
  assert.equal(summary.peakLoadDay.academicLoadScore, 6.0);
  assert.equal(summary.peakLoadDay.stressLevel, "HIGH");

  // Clinical warning muncul karena ada hari dengan beban >= 5.0
  assert.ok(summary.burnoutRiskWarning);
  assert.match(summary.burnoutRiskWarning, /Peringatan Beban Kognitif Tinggi/);
});

test("extractTextFromPdf: mengekstrak teks dari buffer PDF minimal yang valid", async () => {
  const pdfBuffer = createMinimalPdfBuffer("Jadwal Kuliah Senin IF101 Algoritma 3 SKS");
  const extracted = await extractTextFromPdf(pdfBuffer);
  assert.ok(extracted.length > 0);
  assert.match(extracted, /Jadwal Kuliah Senin/);
});

test("extractTextFromPdf: melempar error saat buffer kosong atau tidak valid", async () => {
  await assert.rejects(
    async () => {
      await extractTextFromPdf(Buffer.alloc(0));
    },
    { message: /File PDF kosong atau tidak valid/ }
  );

  await assert.rejects(
    async () => {
      await extractTextFromPdf(Buffer.from("Bukan file pdf sama sekali"));
    },
    { message: /Gagal membaca isi file PDF/ }
  );
});

test("parseKrsDocument: mengekstrak dan menganalisis jadwal dari PDF buffer", async () => {
  const pdfBuffer = createMinimalPdfBuffer("Senin Pemrograman Web 3 SKS R301");
  const result = await parseKrsDocument({ buffer: pdfBuffer, filename: "krs.pdf" });

  assert.equal(result.success, true);
  assert.equal(result.source, "PDF");
  assert.equal(result.items.length, 1);
  assert.equal(result.items[0].subjectName, "Pemrograman Web");
  assert.equal(result.items[0].dayOfWeek, 1);
  assert.equal(result.items[0].creditHours, 3);
});

test("parseKrsWithGemini: mengembalikan null jika API Key tidak disetel", async () => {
  const result = await parseKrsWithGemini({ text: "Sample KRS Text" }, "");
  assert.equal(result, null);
});

test("parseKrsWithGemini: memanggil Google Gemini API dan memvalidasi JSON array mata kuliah", async () => {
  const result = await parseKrsWithGemini(
    { text: "Jadwal semester 5: Rabu Kecerdasan Buatan 3 SKS, Praktikum Robotika 1 SKS" },
    "test-gemini-key-123"
  );
  assert.ok(result);
  assert.equal(result.length, 2);
  assert.equal(result[0].subjectName, "Kecerdasan Buatan dan Robotika");
  assert.equal(result[0].creditHours, 3);
  assert.equal(result[0].dayOfWeek, 3);
  assert.equal(result[0].isPracticum, false);

  assert.equal(result[1].subjectName, "Praktikum Robotika");
  assert.equal(result[1].creditHours, 1);
  assert.equal(result[1].dayOfWeek, 3);
  assert.equal(result[1].isPracticum, true);
});

test("parseKrsDocument: menggunakan Google Gemini API saat preferGemini aktif", async () => {
  const result = await parseKrsDocument({
    text: "Layout teks non-standar dari silabus kampus",
    preferGemini: true,
    geminiApiKey: "test-gemini-key-123",
  });

  assert.equal(result.success, true);
  assert.equal(result.source, "GEMINI_API");
  assert.equal(result.items.length, 2);
  assert.equal(result.summary.totalCourses, 2);
});

// ==============================================================================
// Route Integration Tests (POST /schedule/parse-krs & GET /stress-analysis)
// ==============================================================================

test("POST /api/v1/schedule/parse-krs: mengekstrak dari teks body dan menyimpannya ke database", async () => {
  const payload = {
    text: `
KARTU RENCANA STUDI
1. Senin: Struktur Data (3 SKS)
2. Senin: Praktikum Struktur Data (1 SKS)
3. Rabu: Sistem Operasi (3 SKS)
`,
    replaceExisting: true,
    saveToDatabase: true,
  };

  const res = await fetch(`${baseUrl}/schedule/parse-krs`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${authToken}`,
    },
    body: JSON.stringify(payload),
  });

  const json = (await res.json()) as any;
  assert.equal(res.status, 201);
  assert.equal(json.data.extractedCount, 3);
  assert.equal(json.data.saved, true);
  assert.equal(json.data.savedCount, 3);
  assert.equal(json.data.summary.totalSks, 7);

  // Verifikasi data tersimpan di database
  const inDb = await prisma.academicSchedule.findMany({
    where: { userId: TEST_USER_ID },
  });
  assert.equal(inDb.length, 3);
});

test("POST /api/v1/schedule/parse-krs/preview: mengekstrak tanpa menyimpan ke database", async () => {
  const payload = {
    text: `
1. Kamis: Jaringan Komputer (3 SKS)
2. Jumat: Rekayasa Web (3 SKS)
`,
  };

  const res = await fetch(`${baseUrl}/schedule/parse-krs/preview`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${authToken}`,
    },
    body: JSON.stringify(payload),
  });

  const json = (await res.json()) as any;
  assert.equal(res.status, 200);
  assert.equal(json.data.extractedCount, 2);
  assert.equal(json.data.saved, false);
  assert.equal(json.data.savedCount, 0);

  // Verifikasi database tidak tertimpa
  const inDb = await prisma.academicSchedule.findMany({
    where: { userId: TEST_USER_ID },
  });
  // Tetap 3 dari tes sebelumnya
  assert.equal(inDb.length, 3);
});

test("GET /api/v1/schedule/stress-analysis: mengembalikan analisis dampak stres dari jadwal aktif", async () => {
  const res = await fetch(`${baseUrl}/schedule/stress-analysis`, {
    headers: {
      Authorization: `Bearer ${authToken}`,
    },
  });

  const json = (await res.json()) as any;
  assert.equal(res.status, 200);
  assert.equal(json.data.totalCourses, 3);
  assert.ok(json.data.summary);
  assert.ok(json.data.dailyBreakdown);
  assert.equal(json.data.summary.totalSks, 7);

  const senin = json.data.dailyBreakdown.find((d: any) => d.dayOfWeek === 1);
  assert.ok(senin);
  // 3 SKS Teori (3.0) + 1 SKS Praktikum (1.5) = 4.5 AL
  assert.equal(senin.academicLoadScore, 4.5);
  assert.equal(senin.stressLevel, "MODERATE");
});

test("POST /api/v1/schedule/parse-krs: menolak request tanpa file atau teks dengan 400 VALIDATION_ERROR", async () => {
  const res = await fetch(`${baseUrl}/schedule/parse-krs`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${authToken}`,
    },
    body: JSON.stringify({}),
  });

  const json = (await res.json()) as any;
  assert.equal(res.status, 400);
  assert.equal(json.error.code, "VALIDATION_ERROR");
});

test("POST /api/v1/schedule/parse-krs: menolak dokumen tanpa jadwal yang dapat diekstrak dengan 422 VALIDATION_ERROR", async () => {
  const res = await fetch(`${baseUrl}/schedule/parse-krs`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${authToken}`,
    },
    body: JSON.stringify({ text: "Ini adalah teks acak tanpa informasi mata kuliah dan hari perkuliahan sama sekali." }),
  });

  const json = (await res.json()) as any;
  assert.equal(res.status, 422);
  assert.equal(json.error.code, "VALIDATION_ERROR");
});
