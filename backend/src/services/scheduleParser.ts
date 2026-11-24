import { PDFParse } from "pdf-parse";
import { z } from "zod";
import { env } from "../config/env.ts";
import { AppError } from "../lib/response.ts";
import {
  calculateAcademicLoadScore,
  type ScheduleItemInput,
} from "./burnoutScoring.ts";
import { parseKrsTextHeuristic } from "./krsParserService.ts";

/**
 * Tipe hari valid dalam bahasa Indonesia (PRD v4.0 & Academic Planner).
 */
export const VALID_INDONESIAN_DAYS = [
  "Senin",
  "Selasa",
  "Rabu",
  "Kamis",
  "Jumat",
  "Sabtu",
  "Minggu",
] as const;

export type DayOfWeekIndonesian = (typeof VALID_INDONESIAN_DAYS)[number];
export type ClassType = "teori" | "praktikum";

/**
 * Mapping nama hari Indonesia ke integer (1 = Senin ... 7 = Minggu).
 */
export const DAY_TO_NUMBER: Record<DayOfWeekIndonesian, number> = {
  Senin: 1,
  Selasa: 2,
  Rabu: 3,
  Kamis: 4,
  Jumat: 5,
  Sabtu: 6,
  Minggu: 7,
};

export const NUMBER_TO_DAY: Record<number, DayOfWeekIndonesian> = {
  1: "Senin",
  2: "Selasa",
  3: "Rabu",
  4: "Kamis",
  5: "Jumat",
  6: "Sabtu",
  7: "Minggu",
};

/**
 * Skema validasi item jadwal hasil ekstraksi (sesuai spesifikasi prompt & PRD v4.0).
 */
export const scheduleItemSchema = z.object({
  day_of_week: z.enum(VALID_INDONESIAN_DAYS, {
    errorMap: () => ({
      message: "day_of_week wajib diisi nama hari yang valid (Senin - Minggu).",
    }),
  }),
  subject_name: z
    .string()
    .min(1, "Nama mata kuliah tidak boleh kosong.")
    .max(120, "Nama mata kuliah maksimal 120 karakter."),
  credit_hours: z
    .number()
    .int("SKS harus berupa bilangan bulat.")
    .min(1, "SKS minimal 1.")
    .max(6, "SKS maksimal 6."),
  class_type: z.enum(["teori", "praktikum"], {
    errorMap: () => ({
      message: "class_type wajib 'teori' atau 'praktikum'.",
    }),
  }),
  start_time: z
    .string()
    .regex(/^([01]\d|2[0-3]):[0-5]\d$/, "Format start_time harus HH:mm (contoh: '08:00')."),
  end_time: z
    .string()
    .regex(/^([01]\d|2[0-3]):[0-5]\d$/, "Format end_time harus HH:mm (contoh: '09:40')."),
  is_exam_week: z.boolean().default(false),
});

export type ExtractedScheduleItem = z.infer<typeof scheduleItemSchema>;

export const scheduleListSchema = z.array(scheduleItemSchema).min(1, {
  message: "Jadwal kosong. Tidak ada mata kuliah yang dapat diekstrak.",
});

/**
 * Membersihkan format teks markdown atau kalimat pembuka/penutup LLM Gemini.
 */
export function cleanJsonText(raw: string): string {
  let cleaned = raw.trim();
  // Strip markdown fences ```json ... ``` atau ``` ... ```
  cleaned = cleaned.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/i, "").trim();
  return cleaned;
}

/**
 * Mencari substring JSON array [ { ... } ] di dalam teks respons.
 */
export function extractJsonArrayString(raw: string): string | null {
  const cleaned = cleanJsonText(raw);
  const match = cleaned.match(/\[\s*\{[\s\S]*\}\s*\]/);
  return match ? match[0] : null;
}

/**
 * Menormalisasi satu objek mentah agar ramah terhadap variasi parsing sebelum validasi ketat.
 */
function normalizeRawScheduleItem(item: any, idx = 0): any {
  if (!item || typeof item !== "object") return item;

  const weekdayCycle: DayOfWeekIndonesian[] = ["Senin", "Selasa", "Rabu", "Kamis", "Jumat"];

  // Normalisasi nama hari (jika dokumen KRS tidak mencantumkan hari, distribusikan Senin-Jumat)
  let day = item.day_of_week || item.dayOfWeek || "";
  let resolvedDay: DayOfWeekIndonesian | null = null;
  if (typeof day === "string" && day.trim().length > 0) {
    const trimmed = day.trim().toLowerCase();
    const foundDay = VALID_INDONESIAN_DAYS.find(
      (d) => d.toLowerCase() === trimmed
    );
    if (foundDay) resolvedDay = foundDay;
  } else if (typeof day === "number" && NUMBER_TO_DAY[day]) {
    resolvedDay = NUMBER_TO_DAY[day];
  }
  if (!resolvedDay) {
    resolvedDay = weekdayCycle[idx % weekdayCycle.length];
  }

  // Normalisasi class_type & isPracticum
  const rawSubject = String(
    item.subject_name || item.subjectName || item.mata_kuliah || "Mata Kuliah"
  ).trim();
  let classType = item.class_type || item.classType;
  if (!classType) {
    if (
      item.isPracticum === true ||
      item.is_practicum === true ||
      /praktek|praktikum|workshop|laboratorium|\blab\b|studio/i.test(rawSubject)
    ) {
      classType = "praktikum";
    } else {
      classType = "teori";
    }
  } else if (typeof classType === "string") {
    const ctLower = classType.toLowerCase();
    if (
      ctLower.includes("prak") ||
      ctLower.includes("lab") ||
      ctLower.includes("studio") ||
      ctLower.includes("workshop") ||
      /praktek|praktikum|workshop|laboratorium|\blab\b|studio/i.test(rawSubject)
    ) {
      classType = "praktikum";
    } else {
      classType = "teori";
    }
  }

  // Normalisasi credit_hours
  let sks = Number(item.credit_hours ?? item.creditHours ?? item.sks ?? 2);
  if (isNaN(sks) || sks < 1) sks = 2;
  if (sks > 6) sks = 6;
  sks = Math.round(sks);

  // Normalisasi start_time & end_time
  const defaultSlots = [
    { start: "08:00", end: "09:40" },
    { start: "10:00", end: "11:40" },
    { start: "13:00", end: "14:40" },
    { start: "15:30", end: "17:10" },
  ];
  const slot = defaultSlots[idx % defaultSlots.length];

  const sanitizeTime = (t: any, fallback: string) => {
    if (typeof t !== "string") return fallback;
    const match = t.trim().match(/(\d{1,2})[:.](\d{2})/);
    if (!match) return fallback;
    const hhNum = Number(match[1]);
    const mmNum = Number(match[2]);
    if (hhNum < 0 || hhNum > 23 || mmNum < 0 || mmNum > 59) return fallback;
    const hh = String(hhNum).padStart(2, "0");
    const mm = String(mmNum).padStart(2, "0");
    return `${hh}:${mm}`;
  };

  const startTime = sanitizeTime(item.start_time || item.startTime, slot.start);
  const endTime = sanitizeTime(item.end_time || item.endTime, slot.end);

  return {
    day_of_week: resolvedDay,
    subject_name: rawSubject,
    credit_hours: sks,
    class_type: classType,
    start_time: startTime,
    end_time: endTime,
    is_exam_week: Boolean(item.is_exam_week ?? item.isExamWeek ?? false),
  };
}

/**
 * Mem-parsing string respons Gemini ke bentuk ExtractedScheduleItem[] tervalidasi.
 * Menerapkan retry & sanitasi jika parsing awal mendapati teks kotor atau field minor.
 */
export function parseGeminiResponse(rawResponse: string): ExtractedScheduleItem[] {
  if (!rawResponse || !rawResponse.trim()) {
    throw new AppError(
      422,
      "VALIDATION_ERROR",
      "Dokumen PDF kosong atau tidak menghasilkan respons teks dari parser AI.",
      { reason: "PDF_UNREADABLE" }
    );
  }

  const jsonStr = extractJsonArrayString(rawResponse);
  if (!jsonStr) {
    throw new AppError(
      422,
      "VALIDATION_ERROR",
      "Format respons AI tidak memuat data array jadwal JSON yang valid. Pastikan PDF jadwal terbaca jelas.",
      { reason: "PDF_UNREADABLE" }
    );
  }

  let parsed: any;
  try {
    parsed = JSON.parse(jsonStr);
  } catch (_jsonErr) {
    // Retry parsing: coba bersihkan karakter non-JSON liar sebelum dan sesudah kurung
    const firstBracket = jsonStr.indexOf("[");
    const lastBracket = jsonStr.lastIndexOf("]");
    if (firstBracket !== -1 && lastBracket !== -1 && lastBracket > firstBracket) {
      try {
        parsed = JSON.parse(jsonStr.substring(firstBracket, lastBracket + 1));
      } catch (_retryErr) {
        throw new AppError(
          422,
          "VALIDATION_ERROR",
          "Gagal mem-parsing struktur JSON jadwal perkuliahan dari respons AI.",
          { reason: "PDF_UNREADABLE" }
        );
      }
    } else {
      throw new AppError(
        422,
        "VALIDATION_ERROR",
        "Gagal mem-parsing struktur JSON jadwal perkuliahan dari respons AI.",
        { reason: "PDF_UNREADABLE" }
      );
    }
  }

  if (!Array.isArray(parsed) || parsed.length === 0) {
    throw new AppError(
      422,
      "VALIDATION_ERROR",
      "Tidak ada mata kuliah yang terdeteksi dalam dokumen PDF. Pastikan mengunggah file KRS atau jadwal resmi.",
      { reason: "PDF_UNREADABLE" }
    );
  }

  // Coba validasi langsung
  const directResult = scheduleListSchema.safeParse(parsed);
  if (directResult.success) {
    return directResult.data;
  }

  // Jika ada field tidak lengkap / tipe data sedikit melenceng, lakukan normalisasi & retry
  const normalizedList = parsed.map(normalizeRawScheduleItem);
  const normalizedResult = scheduleListSchema.safeParse(normalizedList);
  if (normalizedResult.success) {
    return normalizedResult.data;
  }

  // Jika tetap gagal setelah normalisasi, laporkan error validasi rinci
  const issues = normalizedResult.error.issues
    .map((iss) => `${iss.path.join(".")}: ${iss.message}`)
    .join("; ");
  throw new AppError(
    422,
    "VALIDATION_ERROR",
    `Data jadwal perkuliahan hasil ekstraksi tidak valid (${issues}).`,
    { reason: "VALIDATION_FAILED" }
  );
}

/**
 * Ekstraksi teks lokal menggunakan pdf-parse sebagai fallback jika Gemini offline/tanpa API key.
 */
export async function extractTextFromPdfBuffer(buffer: Buffer): Promise<string> {
  if (!buffer || buffer.length === 0) {
    throw new AppError(400, "VALIDATION_ERROR", "File PDF kosong atau rusak.");
  }
  try {
    const parser = new PDFParse({ data: buffer });
    const parsed = await parser.getText();
    return parsed.text || "";
  } catch (err: any) {
    throw new AppError(
      422,
      "VALIDATION_ERROR",
      `Gagal membaca teks dari PDF: ${err.message || "Dokumen rusak atau terenkripsi."}`,
      { reason: "PDF_UNREADABLE" }
    );
  }
}

/**
 * Fallback heuristik lokal berbasis teks jika Gemini API tidak tersedia.
 * Mendukung:
 * 1. Format jadwal lengkap dengan rentang jam (08:00 - 10:30)
 * 2. Format tabel/daftar dengan nama hari & SKS (via parseKrsTextHeuristic)
 * 3. Format tabel KRS SIAKAD standar (No / Kode MK / Nama Mata Kuliah / SKS) meskipun tanpa kolom Hari/Jam
 */
export function parseLocalScheduleFallback(rawText: string): ExtractedScheduleItem[] {
  const lines = rawText.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
  const results: ExtractedScheduleItem[] = [];

  let currentDay: DayOfWeekIndonesian = "Senin";

  // Pass 1: Baris dengan rentang waktu eksplisit (contoh: 08:00 - 09:40 atau 08.00 - 10.30)
  for (const line of lines) {
    for (const d of VALID_INDONESIAN_DAYS) {
      if (new RegExp(`\\b${d}\\b`, "i").test(line)) {
        currentDay = d;
        break;
      }
    }

    const timeMatch = line.match(/(\d{1,2}[:.]\d{2})\s*(?:-|–|—|s\/d|sampai)\s*(\d{1,2}[:.]\d{2})/i);
    const sksMatch = line.match(/\b([1-6])\s*(?:sks|credit)\b/i);

    if (timeMatch && line.length > 10) {
      const isPracticum = /praktikum|laboratorium|\blab\b|studio/i.test(line);
      const isExam = /uts|uas|respons[ii]|ujian/i.test(line);
      const sks = sksMatch ? parseInt(sksMatch[1], 10) : isPracticum ? 1 : 3;

      let name = line
        .replace(/(\d{1,2}[:.]\d{2})\s*(?:-|–|—|s\/d|sampai)\s*(\d{1,2}[:.]\d{2})/gi, "")
        .replace(/\b([1-6])\s*(?:sks|credit)\b/gi, "")
        .replace(/^(senin|selasa|rabu|kamis|jumat|sabtu|minggu)\b/gi, "")
        .replace(/\b[A-Z]{2,6}[-._]?\d{3,6}[A-Z]?\b/g, "")
        .replace(/^[\|\-\*\s\d\.\:]+/, "")
        .trim();

      if (name.length >= 3) {
        results.push({
          day_of_week: currentDay,
          subject_name: name.substring(0, 100),
          credit_hours: Math.min(6, Math.max(1, sks)),
          class_type: isPracticum ? "praktikum" : "teori",
          start_time: timeMatch[1].replace(".", ":").padStart(5, "0"),
          end_time: timeMatch[2].replace(".", ":").padStart(5, "0"),
          is_exam_week: isExam,
        });
      }
    }
  }

  if (results.length > 0) {
    return results;
  }

  // Pass 2: Gunakan heuristic parser KRS (mendukung tabel pipa/tab/semicolon & daftar hari tanpa jam)
  const defaultSlots = [
    { start: "08:00", end: "09:40" },
    { start: "10:00", end: "11:40" },
    { start: "13:00", end: "14:40" },
    { start: "15:30", end: "17:10" },
  ];

  const heuristicItems = parseKrsTextHeuristic(rawText);
  if (heuristicItems.length > 0) {
    return heuristicItems.map((item, idx) => {
      const slot = defaultSlots[idx % defaultSlots.length];
      const timeInLine = item.rawLine?.match(
        /(\d{1,2}[:.]\d{2})\s*(?:-|–|—|s\/d|sampai)\s*(\d{1,2}[:.]\d{2})/i
      );
      return {
        day_of_week: NUMBER_TO_DAY[item.dayOfWeek] || "Senin",
        subject_name: item.subjectName.substring(0, 100),
        credit_hours: Math.min(6, Math.max(1, Math.round(item.creditHours))),
        class_type: item.isPracticum ? "praktikum" : "teori",
        start_time: timeInLine
          ? timeInLine[1].replace(".", ":").padStart(5, "0")
          : slot.start,
        end_time: timeInLine
          ? timeInLine[2].replace(".", ":").padStart(5, "0")
          : slot.end,
        is_exam_week: item.isExamWeek,
      };
    });
  }

  // Pass 3: Format Tabel KRS SIAKAD (No / Kode MK / Nama Mata Kuliah / SKS tanpa kolom Hari)
  const weekdayCycle: DayOfWeekIndonesian[] = ["Senin", "Selasa", "Rabu", "Kamis", "Jumat"];
  const ignoredHeadingRegex =
    /^(krs|kartu rencana studi|semester|nama|nim|npm|jurusan|program studi|prodi|fakultas|total|jumlah|ipk|ips|dosen|wali|tahun|akademik|tanggal|cetak|halaman|no\b|kode\b|mata\s*kuliah)/i;

  const seenSubjects = new Set<string>();
  for (const line of lines) {
    if (ignoredHeadingRegex.test(line) && !/\b[A-Z]{2,6}[-._]?\d{3,6}[A-Z]?\b/.test(line)) {
      continue;
    }

    // Pola baris memiliki Kode MK (misal IF2101, TIF102, MKU001, COMP6048) atau penomoran tabel + SKS (1-6)
    const codeMatch = line.match(/\b([A-Z]{2,6}[-._]?\d{2,6}[A-Z]?)\b/);
    const numberedRowMatch = line.match(/^\d{1,2}[\s.|)\t]+(.+)/);

    if (!codeMatch && !numberedRowMatch) continue;

    let detectedDay: DayOfWeekIndonesian | null = null;
    for (const d of VALID_INDONESIAN_DAYS) {
      if (new RegExp(`\\b${d}\\b`, "i").test(line)) {
        detectedDay = d;
        break;
      }
    }

    // Cari angka SKS (1-6)
    const sksExplicit = line.match(/\b([1-6])\s*(?:sks|s\.k\.s|credit)\b/i);
    let sks = sksExplicit ? parseInt(sksExplicit[1], 10) : 0;

    let candidate = line;
    if (codeMatch) {
      const afterCode = line.slice(line.indexOf(codeMatch[0]) + codeMatch[0].length);
      if (afterCode.trim().length >= 3) {
        candidate = afterCode;
      }
    } else if (numberedRowMatch) {
      candidate = numberedRowMatch[1];
    }

    if (!sks) {
      // Cari angka 1-6 yang berdiri sendiri sebagai kolom SKS di akhir/tengah baris
      const trailingSks = candidate.match(/(?:^|[\s|\t;])([1-6])(?:[\s|\t;]+[A-Z0-9-]{1,5})?\s*$/i);
      if (trailingSks) {
        sks = parseInt(trailingSks[1], 10);
      }
    }

    if (!sks || sks < 1 || sks > 6) {
      if (!codeMatch) continue;
      sks = 3;
    }

    const timeInLine = candidate.match(
      /(\d{1,2}[:.]\d{2})\s*(?:-|–|—|s\/d|sampai)\s*(\d{1,2}[:.]\d{2})/i
    );

    let cleanName = candidate
      .replace(/(\d{1,2}[:.]\d{2})\s*(?:-|–|—|s\/d|sampai)\s*(\d{1,2}[:.]\d{2})/gi, " ")
      .replace(/\b[A-Z]{2,6}[-._]?\d{2,6}[A-Z]?\b/g, " ")
      .replace(/\b([1-6])\s*(?:sks|s\.k\.s|credit)\b/gi, " ")
      .replace(/\b(senin|selasa|rabu|kamis|jum'?at|sabtu|minggu)\b/gi, " ")
      .replace(/\b(?:kelas|kls|ruang|gd|gedung)\s*[:.]?\s*[\w\d.-]+/gi, " ")
      .replace(/(?:^|[\s|\t;])[1-6](?:[\s|\t;]+[A-Z0-9-]{1,4})?\s*$/i, " ")
      .replace(/[|;\t]+/g, " ")
      .replace(/^[-–—:;,\s.\d)]+|[-–—:;,\s.\d(]+$/g, "")
      .replace(/\s+/g, " ")
      .trim();

    if (
      cleanName.length >= 4 &&
      /[a-zA-Z]{3,}/.test(cleanName) &&
      !ignoredHeadingRegex.test(cleanName)
    ) {
      const normKey = cleanName.toLowerCase();
      if (seenSubjects.has(normKey)) continue;
      seenSubjects.add(normKey);

      const idx = results.length;
      const isPracticum = /praktikum|laboratorium|\blab\b|studio|bengkel|workshop/i.test(cleanName);
      const isExam = /uts|uas|respons[ii]|ujian/i.test(line);
      const slot = defaultSlots[idx % defaultSlots.length];

      results.push({
        day_of_week: detectedDay || weekdayCycle[idx % weekdayCycle.length],
        subject_name: cleanName.substring(0, 100),
        credit_hours: sks,
        class_type: isPracticum ? "praktikum" : "teori",
        start_time: timeInLine
          ? timeInLine[1].replace(".", ":").padStart(5, "0")
          : slot.start,
        end_time: timeInLine
          ? timeInLine[2].replace(".", ":").padStart(5, "0")
          : slot.end,
        is_exam_week: isExam,
      });
    }
  }

  if (results.length > 0) {
    return results;
  }

  // Pass 4: Multi-line PDF Table Cell Reconstructor (untuk PDF SIAKAD yang sel tabelnya terpisah baris oleh pdf-parse)
  for (let i = 0; i < lines.length; i++) {
    const curr = lines[i];
    const isCodeLine = /^[A-Z]{2,6}[-._]?\d{2,6}[A-Z]?$/i.test(curr);
    const isRowNumLine = /^\d{1,2}\.?$/.test(curr);

    if (isCodeLine || isRowNumLine) {
      const windowLines = lines.slice(i, Math.min(lines.length, i + 6));
      let foundSubject = "";
      let foundSks = 0;
      let foundDay: DayOfWeekIndonesian | null = null;

      for (const wLine of windowLines) {
        for (const d of VALID_INDONESIAN_DAYS) {
          if (new RegExp(`^${d}$`, "i").test(wLine)) {
            foundDay = d;
          }
        }
        if (/^[1-6](\s*sks)?$/i.test(wLine) && !foundSks) {
          foundSks = parseInt(wLine, 10);
          continue;
        }
        if (
          !foundSubject &&
          wLine.length >= 4 &&
          /[a-zA-Z]{3,}/.test(wLine) &&
          !/^[A-Z]{2,6}[-._]?\d{2,6}[A-Z]?$/i.test(wLine) &&
          !ignoredHeadingRegex.test(wLine) &&
          !VALID_INDONESIAN_DAYS.some((d) => new RegExp(`^${d}$`, "i").test(wLine))
        ) {
          foundSubject = wLine.trim();
        }
      }

      if (foundSubject && (isCodeLine || foundSks > 0)) {
        const normKey = foundSubject.toLowerCase();
        if (!seenSubjects.has(normKey)) {
          seenSubjects.add(normKey);
          const idx = results.length;
          const slot = defaultSlots[idx % defaultSlots.length];
          const isPracticum = /praktikum|laboratorium|\blab\b|studio|bengkel|workshop/i.test(
            foundSubject
          );
          results.push({
            day_of_week: foundDay || weekdayCycle[idx % weekdayCycle.length],
            subject_name: foundSubject.substring(0, 100),
            credit_hours: foundSks >= 1 && foundSks <= 6 ? foundSks : 3,
            class_type: isPracticum ? "praktikum" : "teori",
            start_time: slot.start,
            end_time: slot.end,
            is_exam_week: false,
          });
        }
      }
    }
  }

  return results;
}

export interface ParseSchedulePdfOptions {
  apiKey?: string;
  model?: string;
  mimeType?: string;
  preferLocalFallback?: boolean;
}

/**
 * Prompt instruksi ketat untuk Google Gemini API agar menghasilkan output JSON murni.
 */
const GEMINI_SYSTEM_PROMPT = `Anda adalah asisten cerdas parser dokumen KRS (Kartu Rencana Studi), tabel kurikulum semester, dan jadwal kuliah perguruan tinggi Indonesia.
Tugas Anda: ekstrak SEMUA baris mata kuliah dari dokumen PDF atau gambar tabel berikut secara presisi (abaikan baris JUMLAH/TOTAL).

Kembalikan HANYA JSON array murni tanpa markdown, tanpa penjelasan pembuka/penutup, tanpa komentar, dengan skema berikut:
[
  {
    "day_of_week": "Senin", // Wajib salah satu: "Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu", "Minggu"
    "subject_name": "Statistik dan Probabilitas", // Nama mata kuliah bersih (tanpa nomor urut atau kode MK)
    "credit_hours": 2, // Jumlah SKS/Kredit (bilangan bulat 1-6). Jika ada kolom Kredit Teori & Prakt (misal Teori 1, Prakt 1), jumlahkan menjadi 2.
    "class_type": "teori", // Wajib "teori" atau "praktikum" (jika nama mata kuliah mengandung Praktek/Praktikum/Workshop/Lab atau memiliki kredit Prakt > 0, pilih "praktikum")
    "start_time": "08:00", // Format HH:mm
    "end_time": "09:40", // Format HH:mm
    "is_exam_week": false // true jika terdapat keterangan minggu ujian/UTS/UAS/Responsi
  }
]

Aturan ketat:
1. PENTING: Jika dokumen tabel KRS / Semester TIDAK memiliki kolom Hari (Senin-Jumat) atau TIDAK memiliki jam mulai-selesai spesifik, WAJIB tetap ekstrak semua mata kuliah! Distribusikan "day_of_week" secara merata secara berurutan ("Senin", "Selasa", "Rabu", "Kamis", "Jumat") dan isi "start_time": "08:00", "end_time": "09:40".
2. Jangan pernah memasukkan baris "JUMLAH" atau "TOTAL" sebagai mata kuliah.
3. Nilai credit_hours harus integer 1 sampai 6.
4. Nilai class_type HANYA "teori" atau "praktikum".`;

/**
 * Fungsi utama untuk memproses file PDF jadwal kuliah dengan Google Gemini API.
 * Menghapus/menghindari persistensi file permanen di disk dengan memanfaatkan buffer RAM.
 */
export async function parseSchedulePdf(
  pdfBuffer: Buffer,
  options: ParseSchedulePdfOptions = {}
): Promise<{
  items: ExtractedScheduleItem[];
  source: "GEMINI_API" | "LOCAL_FALLBACK";
  rawTextPreview?: string;
}> {
  if (!pdfBuffer || pdfBuffer.length === 0) {
    throw new AppError(400, "VALIDATION_ERROR", "Buffer file PDF kosong.");
  }

  const apiKey = options.apiKey || env.GEMINI_API_KEY;
  const preferredModel = options.model || env.GEMINI_MODEL || "gemini-3.6-flash";
  const mimeType = options.mimeType || "application/pdf";
  const isImage = mimeType.startsWith("image/");
  const isPlainText = mimeType.startsWith("text/");

  const extractLocalText = async (): Promise<string> => {
    if (isPlainText) {
      return pdfBuffer.toString("utf-8");
    }
    if (isImage) {
      return "";
    }
    return extractTextFromPdfBuffer(pdfBuffer);
  };

  // Jika preferLocalFallback aktif atau API key tidak disetel, gunakan fallback lokal
  if (!apiKey || options.preferLocalFallback) {
    const rawText = await extractLocalText();
    const localItems = parseLocalScheduleFallback(rawText);
    if (localItems.length === 0) {
      throw new AppError(
        422,
        "VALIDATION_ERROR",
        "Dokumen KRS tidak memuat teks jadwal yang dapat dikenali secara lokal. Gunakan PDF KRS teks digital atau pastikan Gemini API Key aktif untuk OCR gambar.",
        { reason: "PDF_UNREADABLE" }
      );
    }
    return {
      items: localItems,
      source: "LOCAL_FALLBACK",
      rawTextPreview: rawText.substring(0, 300),
    };
  }

  // Panggil Google Gemini Multimodal API dengan rantai model fallback otomatis jika model utama 404/503
  const base64Data = pdfBuffer.toString("base64");
  const candidateModels = Array.from(
    new Set([
      preferredModel,
      "gemini-3.6-flash",
      "gemini-flash-lite-latest",
      "gemini-3.1-flash-lite",
      "gemini-3.5-flash-lite",
      "gemini-3.5-flash",
      "gemini-3-flash-preview",
      "gemma-4-26b-a4b-it",
    ])
  );

  try {
    let lastErrorStatus = 0;
    let lastErrorText = "";

    for (const modelName of candidateModels) {
      const cleanModel = modelName.replace(/^models\//, "");
      const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(
        cleanModel
      )}:generateContent?key=${encodeURIComponent(apiKey)}`;

      const isGemma = cleanModel.startsWith("gemma-");
      const generationConfig: Record<string, unknown> = {
        temperature: 0.1,
        topP: 0.8,
        maxOutputTokens: 4096,
      };
      if (!isGemma) {
        generationConfig.responseMimeType = "application/json";
      }

      const response = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [
            {
              role: "user",
              parts: [
                {
                  inlineData: {
                    mimeType: isPlainText ? "text/plain" : mimeType,
                    data: base64Data,
                  },
                },
                {
                  text: GEMINI_SYSTEM_PROMPT,
                },
              ],
            },
          ],
          generationConfig,
        }),
      });

      if (!response.ok) {
        lastErrorStatus = response.status;
        lastErrorText = await response.text().catch(() => "");
        console.warn(`[Gemini API Error] Model ${cleanModel} HTTP ${response.status}: ${lastErrorText.slice(0, 200)}`);
        // Jika 404 (model deprecated) atau 503/429 (overloaded), coba model berikutnya
        if (response.status === 404 || response.status === 503 || response.status === 429) {
          continue;
        }
        break;
      }

      const resJson: any = await response.json();
      const candidateText =
        resJson.candidates?.[0]?.content?.parts?.[0]?.text || "";

      const items = parseGeminiResponse(candidateText);
      return {
        items,
        source: "GEMINI_API",
        rawTextPreview: candidateText.substring(0, 300),
      };
    }

    // Fallback lokal jika seluruh model Gemini menolak atau rate limited
    const rawText = await extractLocalText();
    const localItems = parseLocalScheduleFallback(rawText);
    if (localItems.length > 0) {
      return {
        items: localItems,
        source: "LOCAL_FALLBACK",
        rawTextPreview: rawText.substring(0, 300),
      };
    }
    throw new AppError(
      422,
      "VALIDATION_ERROR",
      `Tidak dapat mengekstrak mata kuliah dari dokumen ini (Status AI: ${lastErrorStatus}). Pastikan dokumen KRS memuat daftar mata kuliah dan SKS yang terbaca jelas.`,
      { reason: "PDF_UNREADABLE" }
    );
  } catch (err: any) {
    // Jika Gemini gagal atau mengembalikan array kosong, selalu coba ekstraksi teks PDF lokal terlebih dahulu
    try {
      const rawText = await extractLocalText();
      const localItems = parseLocalScheduleFallback(rawText);
      if (localItems.length > 0) {
        return {
          items: localItems,
          source: "LOCAL_FALLBACK",
          rawTextPreview: rawText.substring(0, 300),
        };
      }
    } catch (_fallbackErr) {
      // Abaikan fallback error
    }

    if (err instanceof AppError) throw err;
    console.warn(`[Gemini Parse Exception] ${err.message || err}.`);

    throw new AppError(
      422,
      "VALIDATION_ERROR",
      `Gagal memproses dokumen KRS: ${err.message || "Format dokumen tidak terbaca."}`,
      { reason: "PDF_UNREADABLE" }
    );
  }
}

/**
 * Menghitung ringkasan beban akademik harian dari daftar item hasil ekstraksi
 * untuk ditampilkan pada preview frontend sebelum dikonfirmasi.
 */
export function computeScheduleSummary(items: ExtractedScheduleItem[]) {
  const dayGroups: Record<number, ExtractedScheduleItem[]> = {};
  for (let d = 1; d <= 7; d++) {
    dayGroups[d] = [];
  }

  for (const item of items) {
    const num = DAY_TO_NUMBER[item.day_of_week];
    if (num && dayGroups[num]) {
      dayGroups[num].push(item);
    }
  }

  let totalSks = 0;
  let totalTheorySks = 0;
  let totalPracticumSks = 0;

  const dailyBreakdown = VALID_INDONESIAN_DAYS.map((dayName) => {
    const dayNum = DAY_TO_NUMBER[dayName];
    const dayItems = dayGroups[dayNum] || [];
    const daySks = dayItems.reduce((acc, it) => acc + it.credit_hours, 0);
    const dayTheory = dayItems
      .filter((it) => it.class_type === "teori")
      .reduce((acc, it) => acc + it.credit_hours, 0);
    const dayPracticum = dayItems
      .filter((it) => it.class_type === "praktikum")
      .reduce((acc, it) => acc + it.credit_hours, 0);

    totalSks += daySks;
    totalTheorySks += dayTheory;
    totalPracticumSks += dayPracticum;

    const scheduleInputs: ScheduleItemInput[] = dayItems.map((it) => ({
      creditHours: it.credit_hours,
      isPracticum: it.class_type === "praktikum",
      isExamWeek: it.is_exam_week,
    }));

    const academicLoadScore = calculateAcademicLoadScore(scheduleInputs);
    let stressLevel: "LOW" | "MODERATE" | "HIGH" = "LOW";
    if (academicLoadScore > 5.0) {
      stressLevel = "HIGH";
    } else if (academicLoadScore >= 3.0) {
      stressLevel = "MODERATE";
    }

    return {
      day_of_week: dayName,
      day_number: dayNum,
      courses: dayItems,
      total_sks: daySks,
      theory_sks: dayTheory,
      practicum_sks: dayPracticum,
      academic_load_score: academicLoadScore,
      stress_level: stressLevel,
    };
  });

  return {
    total_courses: items.length,
    total_sks: totalSks,
    theory_sks: totalTheorySks,
    practicum_sks: totalPracticumSks,
    daily_breakdown: dailyBreakdown,
  };
}
