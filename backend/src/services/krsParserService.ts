import { PDFParse } from "pdf-parse";
import { z } from "zod";
import { env } from "../config/env.ts";
import {
  calculateAcademicLoadScore,
  type ScheduleItemInput,
} from "./burnoutScoring.ts";

export interface ParsedCourseItem {
  dayOfWeek: number; // 1 = Senin, ... 7 = Minggu
  dayName: string; // "Senin", "Selasa", dll.
  subjectName: string;
  creditHours: number;
  isPracticum: boolean;
  isExamWeek: boolean;
  rawLine?: string;
}

export interface DailyStressBreakdown {
  dayOfWeek: number;
  dayName: string;
  courses: ParsedCourseItem[];
  totalSks: number;
  theorySks: number;
  practicumSks: number;
  academicLoadScore: number;
  stressLevel: "LOW" | "MODERATE" | "HIGH";
}

export interface KrsExtractionSummary {
  totalCourses: number;
  totalSks: number;
  theorySks: number;
  practicumSks: number;
  examCount: number;
  averageDailyLoad: number;
  peakLoadDay: {
    dayOfWeek: number;
    dayName: string;
    academicLoadScore: number;
    stressLevel: "LOW" | "MODERATE" | "HIGH";
  } | null;
  burnoutRiskWarning?: string;
}

export interface KrsParsingResult {
  success: boolean;
  source: "PDF" | "TEXT" | "GEMINI_API" | "GEMINI_FALLBACK";
  extractedTextPreview: string;
  items: ParsedCourseItem[];
  summary: KrsExtractionSummary;
  dailyBreakdown: DailyStressBreakdown[];
}

export const INDONESIAN_DAY_NAMES = [
  "",
  "Senin",
  "Selasa",
  "Rabu",
  "Kamis",
  "Jumat",
  "Sabtu",
  "Minggu",
];

export const DAY_PATTERNS: { regex: RegExp; dayOfWeek: number }[] = [
  { regex: /\b(?:senin|monday|sen|mon)\b/i, dayOfWeek: 1 },
  { regex: /\b(?:selasa|tuesday|sel|tue)\b/i, dayOfWeek: 2 },
  { regex: /\b(?:rabu|wednesday|rab|wed)\b/i, dayOfWeek: 3 },
  { regex: /\b(?:kamis|thursday|kam|thu)\b/i, dayOfWeek: 4 },
  { regex: /\b(?:jum'?at|friday|jum|fri)\b/i, dayOfWeek: 5 },
  { regex: /\b(?:sabtu|saturday|sab|sat)\b/i, dayOfWeek: 6 },
  { regex: /\b(?:minggu|ahad|sunday|min|sun)\b/i, dayOfWeek: 7 },
];

/**
 * Mendeteksi nama hari dari potongan teks.
 */
export function detectDayOfWeek(text: string): { dayOfWeek: number; dayName: string } | null {
  for (const p of DAY_PATTERNS) {
    if (p.regex.test(text)) {
      return { dayOfWeek: p.dayOfWeek, dayName: INDONESIAN_DAY_NAMES[p.dayOfWeek] };
    }
  }
  return null;
}

/**
 * Mendeteksi apakah mata kuliah merupakan kegiatan praktikum/laboratorium (beban stres 1.5x SKS).
 */
export function detectPracticum(text: string): boolean {
  const practicumPattern =
    /\b(?:praktikum|prak\.?|laboratorium|lab|workshop|bengkel|studio|practicum|laboratory)\b|\((?:p|prak)\)/i;
  return practicumPattern.test(text);
}

/**
 * Mendeteksi indikator ujian atau responsi (beban tambahan +3.0 poin).
 */
export function detectExamWeek(text: string): boolean {
  const examPattern = /\b(?:ujian|uts|uas|midterm|exam|responsi|final\s*exam)\b/i;
  return examPattern.test(text);
}

/**
 * Membersihkan nama mata kuliah dari kode, kurung kosong, spasi berlebih, dan tanda baca.
 */
export function cleanSubjectName(name: string): string {
  return name
    .replace(/\(\s*\)/g, "")
    .replace(/\[\s*\]/g, "")
    .replace(/^[-–—:;,\s|]+|[-–—:;,\s|]+$/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * Ekstraksi teks dari dokumen PDF buffer menggunakan pdf-parse.
 */
export async function extractTextFromPdf(buffer: Buffer): Promise<string> {
  if (!buffer || buffer.length === 0) {
    throw new Error("File PDF kosong atau tidak valid.");
  }

  try {
    const parser = new PDFParse({ data: buffer });
    const parsed = await parser.getText();
    return parsed.text || "";
  } catch (error: any) {
    throw new Error(`Gagal membaca isi file PDF: ${error.message || "Struktur dokumen rusak"}`);
  }
}

/**
 * Heuristic parser untuk dokumen KRS (tabel SIAKAD, format pipa, tabulasi, atau daftar teks).
 */
export function parseKrsTextHeuristic(rawText: string): ParsedCourseItem[] {
  const lines = rawText
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter((l) => l.length > 0);

  const results: ParsedCourseItem[] = [];
  let currentDay: { dayOfWeek: number; dayName: string } | null = null;
  let headerColIndices: {
    no?: number;
    code?: number;
    subject?: number;
    sks?: number;
    day?: number;
    time?: number;
    room?: number;
  } | null = null;

  for (let lineIdx = 0; lineIdx < lines.length; lineIdx++) {
    const line = lines[lineIdx];

    // 1. Deteksi Baris Header Tabel
    if (/[|;\t]/.test(line)) {
      const delimiter = line.includes("|") ? "|" : line.includes("\t") ? "\t" : ";";
      const parts = line.split(delimiter).map((p) => p.trim());
      const lowerParts = parts.map((p) => p.toLowerCase());

      const hasSubjectHeader = lowerParts.some((p) =>
        /mata\s*kuliah|matakuliah|course|subject/i.test(p)
      );
      const hasSksHeader = lowerParts.some((p) => /\b(sks|credit|credits)\b/i.test(p));
      const hasDayHeader = lowerParts.some((p) => /\b(hari|day)\b/i.test(p));

      if (hasSubjectHeader || (hasSksHeader && hasDayHeader)) {
        headerColIndices = {};
        for (let i = 0; i < parts.length; i++) {
          const p = parts[i].toLowerCase();
          if (/^no\.?$/i.test(p)) headerColIndices.no = i;
          else if (/kode|code/i.test(p)) headerColIndices.code = i;
          else if (/mata\s*kuliah|matakuliah|course|subject/i.test(p)) headerColIndices.subject = i;
          else if (/sks|credit/i.test(p)) headerColIndices.sks = i;
          else if (/hari|day/i.test(p)) headerColIndices.day = i;
          else if (/waktu|jam|time/i.test(p)) headerColIndices.time = i;
          else if (/ruang|room|kelas|class/i.test(p)) headerColIndices.room = i;
        }
        continue;
      }
    }

    // 2. Deteksi Heading Hari Standalone (e.g. "HARI SENIN", "--- Senin ---", "Senin:")
    const headingMatch = line.match(
      /^(?:[-=*#\s]*)(?:hari\s*)?(senin|selasa|rabu|kamis|jum'?at|sabtu|minggu)\s*[-=*#:\s]*$/i
    );
    if (headingMatch) {
      currentDay = detectDayOfWeek(headingMatch[1]);
      continue;
    }

    // 3. Lewati baris metadata universitas / judul dokumen
    if (
      /^(krs|kartu rencana studi|semester|nama|nim|jurusan|program studi|fakultas|total\s*sks|ipk|dosen pembimbing|tahun akademik)/i.test(
        line
      ) &&
      !/[|;]/.test(line)
    ) {
      continue;
    }

    // 4. Case A: Baris Format Tabel (Delimiter: |, \t, atau ;)
    if (
      line.includes("|") ||
      line.includes("\t") ||
      (line.includes(";") && line.split(";").length >= 3)
    ) {
      const delimiter = line.includes("|") ? "|" : line.includes("\t") ? "\t" : ";";
      const parts = line.split(delimiter).map((p) => p.trim());

      // Jika header tabel terpetakan sebelumnya
      if (headerColIndices && headerColIndices.subject !== undefined) {
        const subRaw = parts[headerColIndices.subject] || "";
        const dayRaw = (headerColIndices.day !== undefined ? parts[headerColIndices.day] : "") || "";
        const sksRaw = (headerColIndices.sks !== undefined ? parts[headerColIndices.sks] : "") || "";

        const dayInfo = detectDayOfWeek(dayRaw) || detectDayOfWeek(line) || currentDay;
        const sksVal = parseFloat(sksRaw.replace(/[^\d.]/g, "")) || 2.0;
        const cleanSub = cleanSubjectName(subRaw);

        if (dayInfo && cleanSub.length >= 2) {
          results.push({
            dayOfWeek: dayInfo.dayOfWeek,
            dayName: dayInfo.dayName,
            subjectName: cleanSub,
            creditHours: sksVal > 0 && sksVal <= 12 ? sksVal : 2.0,
            isPracticum: detectPracticum(cleanSub) || detectPracticum(line),
            isExamWeek: detectExamWeek(cleanSub) || detectExamWeek(line),
            rawLine: line,
          });
          continue;
        }
      }

      // Fallback heuristic tabel (tanpa header pasti)
      const validParts = parts.filter((p) => p.length > 0);
      let dayInfo = currentDay;
      for (const part of validParts) {
        const found = detectDayOfWeek(part);
        if (found) {
          dayInfo = found;
          break;
        }
      }

      let sks = 2.0;
      let sksPartIdx = -1;
      for (let i = 0; i < validParts.length; i++) {
        // Abaikan kolom 0 jika hanya nomor urut baris (1..99)
        if (i === 0 && /^\d{1,2}$/.test(validParts[i])) continue;
        const part = validParts[i];
        const sksMatch = part.match(/^(\d+(?:\.\d+)?)\s*(?:sks|credit|credits)?$/i);
        if (sksMatch) {
          const val = parseFloat(sksMatch[1]);
          if (val > 0 && val <= 12) {
            sks = val;
            sksPartIdx = i;
            break;
          }
        }
      }

      let candidateSubject = "";
      for (let i = 0; i < validParts.length; i++) {
        if (i === sksPartIdx) continue;
        const part = validParts[i];
        if (i === 0 && /^\d+$/.test(part)) continue;
        if (/^[a-z]{2,5}[-_]?\d{3,5}[a-z]?$/i.test(part)) continue;
        if (/\d{1,2}[:.]\d{2}/.test(part)) continue;
        if (detectDayOfWeek(part)) continue;
        if (/^(?:r\.|ruang|lab|gedung)\b/i.test(part) && part.length < 15) continue;
        if (/^[a-z]$/i.test(part) || /^(reg|pagi|malam|paralel|karyawan)$/i.test(part)) continue;

        if (part.length > candidateSubject.length) {
          candidateSubject = part;
        }
      }

      if (dayInfo && candidateSubject.length >= 2) {
        const cleanSub = cleanSubjectName(candidateSubject);
        results.push({
          dayOfWeek: dayInfo.dayOfWeek,
          dayName: dayInfo.dayName,
          subjectName: cleanSub,
          creditHours: sks,
          isPracticum: detectPracticum(cleanSub) || detectPracticum(line),
          isExamWeek: detectExamWeek(cleanSub) || detectExamWeek(line),
          rawLine: line,
        });
        continue;
      }
    }

    // 5. Case B: Baris Format Bebas / Daftar Silabus
    const dayFound = detectDayOfWeek(line) || currentDay;
    if (dayFound) {
      const sksMatch =
        line.match(/(\d+(?:\.\d+)?)\s*(?:sks|s\.k\.s|credit|credits)\b/i) ||
        line.match(/\b(?:sks|s\.k\.s)\s*[:=]?\s*(\d+(?:\.\d+)?)\b/i);
      const sks = sksMatch ? parseFloat(sksMatch[1]) : 2.0;

      let cleaned = line;
      // Hapus penomoran baris di awal: "1.", "1)", "[1]"
      cleaned = cleaned.replace(/^[\s*\-•#]*\d*[\s.)\]\-:]+/, "");
      // Hapus waktu: "08:00 - 10:30", "08.00-10.00"
      cleaned = cleaned.replace(/\b\d{1,2}[:.]\d{2}\s*(?:-|s\/d|sampai)?\s*\d{1,2}[:.]\d{2}\b/gi, "");
      // Hapus teks SKS: "(3 SKS)", "3 SKS"
      cleaned = cleaned.replace(/\(?\b\d+(?:\.\d+)?\s*(?:sks|s\.k\.s|credit|credits)\)?/gi, "");
      // Hapus tag ujian
      cleaned = cleaned.replace(/\(?\[?\b(?:uts\s*h-?\d+|uas\s*h-?\d+|ujian|uts|uas|midterm)\b\]?\)?/gi, "");
      // Hapus kode matkul (e.g. IF2101, TIF-101)
      cleaned = cleaned.replace(/\b[a-z]{2,5}[-_]?\d{3,5}[a-z]?\b/gi, "");
      // Hapus nama hari dari baris
      for (const p of [
        /\b(?:senin|monday|sen|mon)\b/gi,
        /\b(?:selasa|tuesday|sel|tue)\b/gi,
        /\b(?:rabu|wednesday|rab|wed)\b/gi,
        /\b(?:kamis|thursday|kam|thu)\b/gi,
        /\b(?:jum'?at|friday|jum|fri)\b/gi,
        /\b(?:sabtu|saturday|sab|sat)\b/gi,
        /\b(?:minggu|ahad|sunday|min|sun)\b/gi,
      ]) {
        cleaned = cleaned.replace(p, "");
      }
      // Hapus indikator ruang (misal: R.301, R301, Ruang 102, Gedung B)
      cleaned = cleaned.replace(/\b(?:r\.|ruang|gedung)\s*[\w\d.-]+\b/gi, "");
      cleaned = cleaned.replace(/\br\d{2,4}\b/gi, "");

      cleaned = cleanSubjectName(cleaned);

      if (cleaned.length >= 3 && !/^(total|semester|krs|jadwal|kuliah)$/i.test(cleaned)) {
        results.push({
          dayOfWeek: dayFound.dayOfWeek,
          dayName: dayFound.dayName,
          subjectName: cleaned,
          creditHours: sks,
          isPracticum: detectPracticum(cleaned) || detectPracticum(line),
          isExamWeek: detectExamWeek(cleaned) || detectExamWeek(line),
          rawLine: line,
        });
      }
    }
  }

  // Deduplikasi berdasarkan hari dan nama mata kuliah
  const uniqueMap = new Map<string, ParsedCourseItem>();
  for (const item of results) {
    const key = `${item.dayOfWeek}_${item.subjectName.toLowerCase().replace(/\s+/g, "")}`;
    if (!uniqueMap.has(key)) {
      uniqueMap.set(key, item);
    }
  }

  return Array.from(uniqueMap.values());
}

/**
 * Skema validasi respons model AI saat ekstraksi jadwal perkuliahan.
 */
export const geminiCourseSchema = z.array(
  z.object({
    subjectName: z.string().min(1),
    creditHours: z.coerce.number().positive().max(12),
    dayOfWeek: z.coerce.number().int().min(1).max(7),
    isPracticum: z.boolean().optional().default(false),
    isExamWeek: z.boolean().optional().default(false),
  })
);

/**
 * Ekstraksi jadwal perkuliahan menggunakan Google Gemini API (PRD v4.0).
 * Menggunakan mode respons JSON terstruktur (`responseMimeType: application/json`).
 */
export async function parseKrsWithGemini(
  input: { text?: string; buffer?: Buffer; mimeType?: string },
  apiKeyOverride?: string
): Promise<ParsedCourseItem[] | null> {
  const apiKey = apiKeyOverride?.trim() || env.GEMINI_API_KEY?.trim();
  if (!apiKey) {
    return null;
  }

  const prompt = `Anda adalah sistem ekstraktor jadwal perkuliahan (KRS) untuk sistem pemantauan beban stres mahasiswa (CampusFlow).
Tugas Anda: Ekstrak seluruh daftar mata kuliah dari dokumen/teks berikut menjadi array JSON valid.
Tiap elemen harus memiliki atribut:
- "subjectName": string (nama mata kuliah yang bersih, tanpa kode ruangan atau nomor baris)
- "creditHours": number (jumlah SKS, biasanya antara 1 hingga 6)
- "dayOfWeek": number (1=Senin, 2=Selasa, 3=Rabu, 4=Kamis, 5=Jumat, 6=Sabtu, 7=Minggu)
- "isPracticum": boolean (true jika kelas praktikum, lab, responsi, studio, atau workshop)
- "isExamWeek": boolean (true jika ada keterangan ujian, UTS, atau UAS)

Teks Dokumen KRS:
${(input.text || "").slice(0, 5000)}

Kembalikan HANYA array JSON murni.`;

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 20000);

    const parts: any[] = [{ text: prompt }];

    // Jika teks kosong tetapi ada buffer dokumen, sertakan inlineData multimodal
    if ((!input.text || input.text.trim().length === 0) && input.buffer && input.buffer.length > 0) {
      parts.push({
        inlineData: {
          mimeType: input.mimeType || "application/pdf",
          data: input.buffer.toString("base64"),
        },
      });
    }

    const endpointUrl = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(
      env.GEMINI_MODEL
    )}:generateContent?key=${encodeURIComponent(apiKey)}`;

    const response = await fetch(endpointUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ role: "user", parts }],
        generationConfig: {
          temperature: 0.1,
          responseMimeType: "application/json",
        },
      }),
      signal: controller.signal,
    });
    clearTimeout(timeout);

    if (!response.ok) {
      const errText = await response.text().catch(() => "");
      console.warn(`[Gemini KRS Parser] Request gagal dengan status ${response.status}: ${errText.slice(0, 200)}`);
      return null;
    }

    const body: any = await response.json();
    const candidateText = body.candidates?.[0]?.content?.parts?.[0]?.text || "";

    const jsonMatch = candidateText.match(/\[\s*\{[\s\S]*\}\s*\]/);
    if (!jsonMatch) return null;

    const parsedJson = JSON.parse(jsonMatch[0]);
    const validated = geminiCourseSchema.parse(parsedJson);

    return validated.map((c) => ({
      dayOfWeek: c.dayOfWeek,
      dayName: INDONESIAN_DAY_NAMES[c.dayOfWeek],
      subjectName: cleanSubjectName(c.subjectName),
      creditHours: c.creditHours,
      isPracticum: Boolean(c.isPracticum),
      isExamWeek: Boolean(c.isExamWeek),
    }));
  } catch (err: any) {
    console.warn(`[Gemini KRS Parser] Gagal memproses via Gemini API: ${err.message || err}`);
    return null;
  }
}

/**
 * Menghitung rincian beban stres akademik harian & mingguan berdasarkan PRD v4.0.
 */
export function computeKrsStressBreakdown(items: ParsedCourseItem[]): {
  summary: KrsExtractionSummary;
  dailyBreakdown: DailyStressBreakdown[];
} {
  const dailyBreakdown: DailyStressBreakdown[] = [];
  let totalSks = 0;
  let theorySks = 0;
  let practicumSks = 0;
  let examCount = 0;

  for (let day = 1; day <= 7; day++) {
    const dayCourses = items.filter((it) => it.dayOfWeek === day);
    const dayTotalSks = dayCourses.reduce((sum, c) => sum + c.creditHours, 0);
    const dayTheorySks = dayCourses
      .filter((c) => !c.isPracticum)
      .reduce((sum, c) => sum + c.creditHours, 0);
    const dayPracticumSks = dayCourses
      .filter((c) => c.isPracticum)
      .reduce((sum, c) => sum + c.creditHours, 0);

    const scheduleInputs: ScheduleItemInput[] = dayCourses.map((c) => ({
      creditHours: c.creditHours,
      isPracticum: c.isPracticum,
      isExamWeek: c.isExamWeek,
    }));

    const academicLoadScore = calculateAcademicLoadScore(scheduleInputs);

    let stressLevel: "LOW" | "MODERATE" | "HIGH" = "LOW";
    if (academicLoadScore > 5.0) {
      stressLevel = "HIGH";
    } else if (academicLoadScore >= 3.0) {
      stressLevel = "MODERATE";
    }

    totalSks += dayTotalSks;
    theorySks += dayTheorySks;
    practicumSks += dayPracticumSks;
    examCount += dayCourses.filter((c) => c.isExamWeek).length;

    dailyBreakdown.push({
      dayOfWeek: day,
      dayName: INDONESIAN_DAY_NAMES[day],
      courses: dayCourses,
      totalSks: Number(dayTotalSks.toFixed(1)),
      theorySks: Number(dayTheorySks.toFixed(1)),
      practicumSks: Number(dayPracticumSks.toFixed(1)),
      academicLoadScore,
      stressLevel,
    });
  }

  // Identifikasi hari dengan beban kognitif terberat
  const activeDays = dailyBreakdown.filter((d) => d.courses.length > 0);
  let peakLoadDay: KrsExtractionSummary["peakLoadDay"] = null;

  if (activeDays.length > 0) {
    const sorted = [...activeDays].sort((a, b) => b.academicLoadScore - a.academicLoadScore);
    peakLoadDay = {
      dayOfWeek: sorted[0].dayOfWeek,
      dayName: sorted[0].dayName,
      academicLoadScore: sorted[0].academicLoadScore,
      stressLevel: sorted[0].stressLevel,
    };
  }

  const averageDailyLoad =
    activeDays.length > 0
      ? Number(
          (
            activeDays.reduce((sum, d) => sum + d.academicLoadScore, 0) / activeDays.length
          ).toFixed(2)
        )
      : 0;

  // Rekomendasi / Peringatan Klinis
  let burnoutRiskWarning: string | undefined;
  if (peakLoadDay && peakLoadDay.academicLoadScore >= 5.0) {
    burnoutRiskWarning = `Peringatan Beban Kognitif Tinggi: Hari ${peakLoadDay.dayName} memiliki beban stres akademik ${peakLoadDay.academicLoadScore} poin (${peakLoadDay.stressLevel}). Jadwalkan Active Break teratur dan hindari begadang pada malam sebelumnya.`;
  } else if (totalSks > 22) {
    burnoutRiskWarning = `Beban Semester Sangat Padat: Total ${totalSks} SKS melampaui ambang batas ideal (20-22 SKS). Pertahankan durasi tidur minimal 7 jam per malam untuk menjaga performa kognitif.`;
  }

  return {
    summary: {
      totalCourses: items.length,
      totalSks: Number(totalSks.toFixed(1)),
      theorySks: Number(theorySks.toFixed(1)),
      practicumSks: Number(practicumSks.toFixed(1)),
      examCount,
      averageDailyLoad,
      peakLoadDay,
      burnoutRiskWarning,
    },
    dailyBreakdown,
  };
}

export interface ParseKrsDocumentOptions {
  buffer?: Buffer;
  text?: string;
  mimeType?: string;
  filename?: string;
  skipAi?: boolean;
  geminiApiKey?: string;
  preferGemini?: boolean;
}

/**
 * Fungsi utama untuk memproses dokumen KRS dari file PDF, teks murni, atau buffer.
 * Mengintegrasikan parser heuristik SIAKAD cepat dan Google Gemini API fallback (PRD v4.0).
 */
export async function parseKrsDocument(input: ParseKrsDocumentOptions): Promise<KrsParsingResult> {
  let rawText = input.text || "";
  let source: "PDF" | "TEXT" | "GEMINI_API" | "GEMINI_FALLBACK" = "TEXT";

  // Jika input berupa buffer dokumen
  if (input.buffer && input.buffer.length > 0) {
    const isPdf =
      input.mimeType === "application/pdf" ||
      (input.filename && input.filename.toLowerCase().endsWith(".pdf")) ||
      input.buffer.slice(0, 5).toString().startsWith("%PDF");

    if (isPdf) {
      try {
        rawText = await extractTextFromPdf(input.buffer);
        source = "PDF";
      } catch (_err) {
        // Jika PDF bertipe scanned gambar murni, biarkan rawText kosong
        // agar diproses lewat jalur multimodal Gemini
        rawText = "";
      }
    } else {
      rawText = input.buffer.toString("utf-8");
      source = "TEXT";
    }
  }

  let parsedCourses: ParsedCourseItem[] = [];

  // Jalur prioritas: Jika klien meminta Gemini secara eksplisit
  if (input.preferGemini && (rawText.length > 0 || input.buffer)) {
    const geminiRes = await parseKrsWithGemini(
      { text: rawText, buffer: input.buffer, mimeType: input.mimeType },
      input.geminiApiKey
    );
    if (geminiRes && geminiRes.length > 0) {
      parsedCourses = geminiRes;
      source = "GEMINI_API";
    }
  }

  // 1. Coba ekstraksi deterministik cepat jika ada teks
  if (parsedCourses.length === 0 && rawText.trim().length > 0) {
    parsedCourses = parseKrsTextHeuristic(rawText);
  }

  // 2. Jika deterministik menemukan 0 matkul (layout non-standar / scanned), coba Google Gemini API Fallback
  if (parsedCourses.length === 0 && (rawText.length > 20 || input.buffer) && !input.skipAi) {
    const geminiRes = await parseKrsWithGemini(
      { text: rawText, buffer: input.buffer, mimeType: input.mimeType },
      input.geminiApiKey
    );
    if (geminiRes && geminiRes.length > 0) {
      parsedCourses = geminiRes;
      source = "GEMINI_FALLBACK";
    }
  }

  if (!rawText.trim() && parsedCourses.length === 0) {
    throw new Error("Dokumen tidak berisi teks yang dapat diekstraksi dan tidak ada jadwal yang terdeteksi.");
  }

  // 3. Hitung fusi stres akademik
  const { summary, dailyBreakdown } = computeKrsStressBreakdown(parsedCourses);

  return {
    success: parsedCourses.length > 0,
    source,
    extractedTextPreview: rawText.slice(0, 300).replace(/\s+/g, " ").trim(),
    items: parsedCourses,
    summary,
    dailyBreakdown,
  };
}
