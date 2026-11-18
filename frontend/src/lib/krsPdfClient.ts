/**
 * Mentahan API Client — CampusFlow Smart Academic Planner (PDF KRS Parser)
 *
 * Alur 2 Tahap (Preview -> Koreksi -> Confirm):
 * 1. uploadKrsPdfPreview(file) -> POST /api/v1/schedule/upload (TIDAK commit DB)
 * 2. Mahasiswa memeriksa / mengedit hasil ekstraksi di UI
 * 3. confirmKrsSchedules(items) -> POST /api/v1/schedule/confirm (Commit DB + Auto-Update Burnout Index)
 */

export const VALID_DAYS_ID = [
  "Senin",
  "Selasa",
  "Rabu",
  "Kamis",
  "Jumat",
  "Sabtu",
  "Minggu",
] as const;

export type DayOfWeekIndonesian = (typeof VALID_DAYS_ID)[number];
export type ScheduleClassType = "teori" | "praktikum";

export interface ExtractedKrsCourse {
  day_of_week: DayOfWeekIndonesian;
  subject_name: string;
  credit_hours: number;
  class_type: ScheduleClassType;
  start_time: string; // HH:mm
  end_time: string; // HH:mm
  is_exam_week: boolean;
}

export interface DailyLoadBreakdown {
  day_of_week: DayOfWeekIndonesian;
  day_number: number;
  courses: ExtractedKrsCourse[];
  total_sks: number;
  theory_sks: number;
  practicum_sks: number;
  academic_load_score: number;
  stress_level: "LOW" | "MODERATE" | "HIGH";
}

export interface KrsPreviewSummary {
  total_courses: number;
  total_sks: number;
  theory_sks: number;
  practicum_sks: number;
  daily_breakdown: DailyLoadBreakdown[];
}

export interface KrsUploadPreviewResponse {
  data: {
    previewOnly: boolean;
    extractedCount: number;
    source: "GEMINI_API" | "LOCAL_FALLBACK" | "MOCK";
    summary: KrsPreviewSummary;
    items: ExtractedKrsCourse[];
    message: string;
  };
  meta: {
    timestamp: string;
    version: string;
  };
}

export interface KrsConfirmResponse {
  data: {
    saved: boolean;
    savedCount: number;
    items: ExtractedKrsCourse[];
    updatedBurnout: {
      logDate: string;
      dayOfWeek: number;
      academicLoadScore: number;
      screenFatigueScore: number;
      recoveryScore: number;
      burnoutIndex: number;
      status: "LOW" | "MODERATE" | "HIGH";
      fussionLogId: string;
    };
  };
  meta: {
    timestamp: string;
    version: string;
  };
}

export interface KrsClientOptions {
  baseUrl?: string;
  token?: string | null;
  geminiApiKey?: string;
  useMock?: boolean;
  fetchImpl?: typeof fetch;
}

const MAX_PDF_SIZE_BYTES = 5 * 1024 * 1024; // 5 MB sesuai limit multer backend
const HHMM_REGEX = /^([01]\d|2[0-3]):[0-5]\d$/;

/**
 * Validasi file PDF di sisi klien sebelum dikirim ke backend.
 */
export function validateKrsFile(file: { name: string; type?: string; size: number }): {
  valid: boolean;
  error?: string;
} {
  if (!file || file.size <= 0) {
    return { valid: false, error: "File PDF kosong atau belum dipilih." };
  }
  const lowerName = file.name.toLowerCase();
  const isPdf = file.type === "application/pdf" || lowerName.endsWith(".pdf");
  if (!isPdf) {
    return { valid: false, error: "Format file tidak didukung. Harap unggah dokumen PDF (.pdf)." };
  }
  if (file.size > MAX_PDF_SIZE_BYTES) {
    return { valid: false, error: "Ukuran file terlalu besar. Maksimal ukuran PDF KRS adalah 5 MB." };
  }
  return { valid: true };
}

/**
 * Validasi satu item jadwal hasil ekstraksi/edit user sebelum dikirim ke endpoint /confirm.
 */
export function validateExtractedCourse(item: ExtractedKrsCourse): string[] {
  const errors: string[] = [];
  if (!VALID_DAYS_ID.includes(item.day_of_week)) {
    errors.push("Hari harus antara Senin sampai Minggu.");
  }
  if (!item.subject_name || item.subject_name.trim().length === 0) {
    errors.push("Nama mata kuliah wajib diisi.");
  }
  if (!Number.isInteger(item.credit_hours) || item.credit_hours < 1 || item.credit_hours > 6) {
    errors.push("SKS harus berupa bilangan bulat antara 1 sampai 6.");
  }
  if (item.class_type !== "teori" && item.class_type !== "praktikum") {
    errors.push("Jenis kelas wajib 'teori' atau 'praktikum'.");
  }
  if (!HHMM_REGEX.test(item.start_time)) {
    errors.push("Format jam mulai harus HH:mm (contoh: 08:00).");
  }
  if (!HHMM_REGEX.test(item.end_time)) {
    errors.push("Format jam selesai harus HH:mm (contoh: 09:40).");
  }
  return errors;
}

const MOCK_PREVIEW_ITEMS: ExtractedKrsCourse[] = [
  {
    day_of_week: "Senin",
    subject_name: "Algoritma dan Struktur Data",
    credit_hours: 3,
    class_type: "teori",
    start_time: "08:00",
    end_time: "10:30",
    is_exam_week: false,
  },
  {
    day_of_week: "Senin",
    subject_name: "Praktikum Algoritma dan Struktur Data",
    credit_hours: 1,
    class_type: "praktikum",
    start_time: "13:00",
    end_time: "15:00",
    is_exam_week: false,
  },
  {
    day_of_week: "Selasa",
    subject_name: "Basis Data Terdistribusi",
    credit_hours: 3,
    class_type: "teori",
    start_time: "09:00",
    end_time: "11:30",
    is_exam_week: false,
  },
];

function resolveBaseUrl(override?: string): string {
  if (override) return override.replace(/\/$/, "");
  const envUrl =
    typeof import.meta !== "undefined" && (import.meta as { env?: Record<string, string> }).env
      ? (import.meta as { env?: Record<string, string> }).env?.VITE_API_BASE_URL
      : undefined;
  return (envUrl || "http://localhost:4000/api/v1").replace(/\/$/, "");
}

/**
 * TAHAP 1: Upload PDF KRS untuk Preview Ekstraksi (TIDAK langsung disimpan ke DB).
 * Menghubungkan ke: POST /api/v1/schedule/upload (multipart/form-data, field 'file').
 */
export async function uploadKrsPdfPreview(
  file: Blob & { name?: string; type?: string; size: number },
  options: KrsClientOptions = {}
): Promise<KrsUploadPreviewResponse> {
  const fileCheck = validateKrsFile({
    name: file.name || "krs.pdf",
    type: file.type,
    size: file.size,
  });
  if (!fileCheck.valid) {
    throw new Error(fileCheck.error);
  }

  if (options.useMock) {
    return {
      data: {
        previewOnly: true,
        extractedCount: MOCK_PREVIEW_ITEMS.length,
        source: "MOCK",
        summary: {
          total_courses: MOCK_PREVIEW_ITEMS.length,
          total_sks: 7,
          theory_sks: 6,
          practicum_sks: 1,
          daily_breakdown: [],
        },
        items: MOCK_PREVIEW_ITEMS,
        message: "[MOCK] Jadwal berhasil diekstrak. Silakan periksa sebelum konfirmasi.",
      },
      meta: { timestamp: new Date().toISOString(), version: "v1.0" },
    };
  }

  const baseUrl = resolveBaseUrl(options.baseUrl);
  const fetchFn = options.fetchImpl || globalThis.fetch;

  const formData = new FormData();
  formData.append("file", file, file.name || "krs.pdf");

  const headers: Record<string, string> = {};
  if (options.token) {
    headers["Authorization"] = `Bearer ${options.token}`;
  }
  if (options.geminiApiKey) {
    headers["x-gemini-api-key"] = options.geminiApiKey;
  }

  const res = await fetchFn(`${baseUrl}/schedule/upload`, {
    method: "POST",
    headers,
    body: formData,
  });

  if (!res.ok) {
    const errBody = await res.json().catch(() => ({}));
    throw new Error(
      errBody?.error?.message || `Gagal memproses PDF KRS (HTTP ${res.status}).`
    );
  }

  return res.json() as Promise<KrsUploadPreviewResponse>;
}

/**
 * TAHAP 2: Konfirmasi & Simpan Jadwal ke Database + Auto-Recalculate Burnout Index.
 * Menghubungkan ke: POST /api/v1/schedule/confirm.
 */
export async function confirmKrsSchedules(
  schedules: ExtractedKrsCourse[],
  replaceExisting = true,
  options: KrsClientOptions = {}
): Promise<KrsConfirmResponse> {
  if (!schedules || schedules.length === 0) {
    throw new Error("Minimal satu mata kuliah harus dikonfirmasi.");
  }

  for (let i = 0; i < schedules.length; i++) {
    const errs = validateExtractedCourse(schedules[i]);
    if (errs.length > 0) {
      throw new Error(`Baris ke-${i + 1} (${schedules[i].subject_name}): ${errs.join(" ")}`);
    }
  }

  if (options.useMock) {
    return {
      data: {
        saved: true,
        savedCount: schedules.length,
        items: schedules,
        updatedBurnout: {
          logDate: new Date().toISOString().split("T")[0],
          dayOfWeek: new Date().getDay() === 0 ? 7 : new Date().getDay(),
          academicLoadScore: 4.5,
          screenFatigueScore: 0,
          recoveryScore: 35,
          burnoutIndex: 0,
          status: "LOW",
          fussionLogId: "mock-fussion-log-id",
        },
      },
      meta: { timestamp: new Date().toISOString(), version: "v1.0" },
    };
  }

  const baseUrl = resolveBaseUrl(options.baseUrl);
  const fetchFn = options.fetchImpl || globalThis.fetch;

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };
  if (options.token) {
    headers["Authorization"] = `Bearer ${options.token}`;
  }

  const res = await fetchFn(`${baseUrl}/schedule/confirm`, {
    method: "POST",
    headers,
    body: JSON.stringify({ schedules, replaceExisting }),
  });

  if (!res.ok) {
    const errBody = await res.json().catch(() => ({}));
    throw new Error(
      errBody?.error?.message || `Gagal menyimpan jadwal KRS (HTTP ${res.status}).`
    );
  }

  return res.json() as Promise<KrsConfirmResponse>;
}

/**
 * Alternatif berbasis teks salinan tabel SIAKAD (tanpa unggah PDF).
 * Menghubungkan ke: POST /api/v1/schedule/parse-krs/preview atau /parse-krs.
 */
export async function parseKrsText(
  text: string,
  saveToDatabase = false,
  options: KrsClientOptions = {}
): Promise<unknown> {
  if (!text || text.trim().length < 5) {
    throw new Error("Teks jadwal KRS terlalu pendek atau kosong.");
  }

  const baseUrl = resolveBaseUrl(options.baseUrl);
  const fetchFn = options.fetchImpl || globalThis.fetch;
  const endpoint = saveToDatabase ? "/schedule/parse-krs" : "/schedule/parse-krs/preview";

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };
  if (options.token) {
    headers["Authorization"] = `Bearer ${options.token}`;
  }
  if (options.geminiApiKey) {
    headers["x-gemini-api-key"] = options.geminiApiKey;
  }

  const res = await fetchFn(`${baseUrl}${endpoint}`, {
    method: "POST",
    headers,
    body: JSON.stringify({ text, saveToDatabase }),
  });

  if (!res.ok) {
    const errBody = await res.json().catch(() => ({}));
    throw new Error(
      errBody?.error?.message || `Gagal memproses teks KRS (HTTP ${res.status}).`
    );
  }

  return res.json();
}
