import fs from "node:fs";
import path from "node:path";
import type { DominantMediator } from "../../../shared/contracts/index.ts";
import type { AllowedRanges } from "./ollamaCoach.ts";

/**
 * Respons krisis deterministik hangat tanpa saran olahraga.
 * // TODO: verifikasi nomor hotline eksternal (misal LISA dsb.) dari sumber resmi sebelum dicantumkan kembali
 */
export const CRISIS_RESPONSE_TEXT = `Aku mendengar dan memahami bahwa keadaan saat ini terasa sangat berat dan melelahkan untukmu. Terima kasih sudah mau bertahan dan menceritakannya ke aku.

Tolong jangan tanggung beban ini sendirian ya. Sangat wajar dan tidak apa-apa untuk meminta pertolongan di saat seperti ini. Kamu bisa segera bercerita ke teman dekat, keluarga, atau Konselor Kampus di unit layanan kesehatan mental mahasiswa.

Jika kamu merasa berada dalam krisis atau butuh bantuan darurat saat ini juga:
• Layanan Darurat Kesehatan Mental Kemenkes: Hotline 119 (ekstensi 8)
• Layanan Konseling & Bantuan Krisis Kemenkes: healing119.id (chat / call)
• Layanan Darurat Terpadu: 112

Ada orang-orang yang peduli dan siap mendengarkanmu tanpa menghakimi. Ambil jeda sejenak, dan jangan ragu untuk menghubungi kontak atau situs resmi di atas ya.`;

/** Pertanyaan klarifikasi bila keluhan wellbeing pendek tetap ditolak oleh model */
export const CLARIFICATION_PROMPT_TEXT =
  "Capeknya lebih ke badan, mata, atau pikiran?";

/** 3 varian template netral pengganti penjelasan kondisi bila audit mendeteksi klaim karangan (tidak menyebut kata 'capek') */
export const NEUTRAL_CAUSE_FALLBACK_VARIANTS: string[] = [
  "Aku belum tahu pasti penyebabnya, tapi gerakan ringan bisa membantu memulihkan kesegaran tubuhmu.",
  "Penyebab pastinya belum diketahui dari ceritamu, tapi jeda gerak santai bisa membuat tubuh lebih nyaman.",
  "Tanpa tahu persis pemicunya, peregangan atau gerakan ringan tetap bisa membantu merilekskan tubuh.",
];

let neutralFallbackIndex = 0;
export function getNextNeutralCauseFallback(): string {
  const variant =
    NEUTRAL_CAUSE_FALLBACK_VARIANTS[neutralFallbackIndex % NEUTRAL_CAUSE_FALLBACK_VARIANTS.length];
  neutralFallbackIndex += 1;
  return variant;
}

export function resetNeutralCauseFallbackIndex(): void {
  neutralFallbackIndex = 0;
}

export const NEUTRAL_CAUSE_FALLBACK_TEXT = NEUTRAL_CAUSE_FALLBACK_VARIANTS[0];

export interface ClarificationOption {
  id: "1" | "2" | "3" | "4";
  label: string;
}

export const PROACTIVE_CLARIFICATION_QUESTION =
  "Biar rekomendasinya pas, capek atau kondisi tubuhmu saat ini paling dominan karena apa?";

export const PROACTIVE_CLARIFICATION_OPTIONS: ClarificationOption[] = [
  { id: "1", label: "Badan pegal atau otot kaku" },
  { id: "2", label: "Ngantuk atau kurang tidur" },
  { id: "3", label: "Habis olahraga atau aktivitas berat" },
  { id: "4", label: "Pikiran penat atau stres kuliah" },
];

export const PROACTIVE_CLARIFICATION_TEXT =
  `${PROACTIVE_CLARIFICATION_QUESTION}\n` +
  `1. ${PROACTIVE_CLARIFICATION_OPTIONS[0].label}\n` +
  `2. ${PROACTIVE_CLARIFICATION_OPTIONS[1].label}\n` +
  `3. ${PROACTIVE_CLARIFICATION_OPTIONS[2].label}\n` +
  `4. ${PROACTIVE_CLARIFICATION_OPTIONS[3].label}\n\n` +
  `(Ketik 1/2/3/4, kata kuncinya, atau ketik 'lewati' untuk rekomendasi umum)`;

/** Teks pertanyaan klarifikasi ramah dengan pilihan A/B/C */
export const CLARIFICATION_WITH_OPTIONS_TEXT =
  "Capeknya lebih ke arah mana?\nA. Badan terasa kaku atau pegal (butuh peregangan lembut)\nB. Mata lelah atau kepala berat karena layar (butuh jeda istirahat)\nC. Pikiran penuh atau stres tugas kuliah (butuh latihan napas)";

/** Pengecualian ekspresi kiasan / hiperbola sehari-hari bahasa Indonesia yang memakai kata 'mati' */
export const FIGURATIVE_MATI_EXCLUSIONS = [
  /\bmati\s+(?:rasa|gaya|kutu|langkah|lampu|listrik|angin)\b/i,
  /\b(?:ngantuk|haus|lapar|ketawa|lucu)\b.*?\b(?:mau|pengen|rasanya)?\s*mati(?:\s+rasanya)?\b/i,
  /\b(?:mau|pengen|rasanya\s+mau)?\s*mati\b.*?\b(?:ngantuk|haus|lapar|ketawa|lucu)\b/i,
];

/** Pola kata kunci distres berat, self-harm, dan keputusasaan (bahasa gaul & formal) */
export const CRISIS_PATTERNS = [
  /\b(?:bunuh\s*diri|bundir)\b/i,
  /\b(?:mengakhiri|akhiri|akhirin)\s+hidup\b/i,
  /\b(?:capek|lelah|gak?\s*mau|nggak\s*mau|tidak\s*mau)\s+hidup(?:\s+lagi)?\b/i,
  /\b(?:pengen|mau|pengin)\s+ng?ilang\s+(?:selamanya|dari\s+dunia)\b/i,
  /\b(?:lebih\s+baik|mending|mendingan)\s+mati\b/i,
  /\b(?:menyakiti|nyakitin|melukai)\s+diri(?:\s+sendiri)?\b/i,
  /\b(?:self[ -]?harm|cutting|nyilet)\b/i,
  /\b(?:minum\s+racun|loncat\s+dari|overdosis|nabrakin\s+diri)\b/i,
  /\bputus\s+asa\b/i,
  /\bhopeless\b/i,
  /\b(?:tidak|nggak|ngga|ga|gak)\s+(?:sanggup|kuat|tahan)(?:\s+lagi)?\b/i,
  /\b(?:capek|lelah)\s+sama\s+semuanya\b/i,
  /\b(?:ingin|mau|pengen|pengin|rasanya\s+mau)?\s*(?:menyerah|nyerah)\b/i,
  /\b(?:pengen|mau|ingin|pengin|rasanya)\s+mati\b/i,
];

/** Pola keluhan yang sah masuk dalam cakupan wellbeing CampusFlow */
export const IN_SCOPE_WELLBEING_PATTERN =
  /\b(capek|lelah|letih|lemes|lemas|pegal|pegel|kaku|ngantuk|kantuk|mager|males gerak|stres|stress|tidur|begadang|duduk|deg-degan|cemas|khawatir|pusing|mumet)\b/i;

/** Mendeteksi kata kunci distres berat untuk jalur krisis darurat */
export function detectDistressKeywords(text?: string | null): boolean {
  if (!text) return false;
  const lower = text.toLowerCase();

  // Evaluasi pengecualian kiasan/hiperbola (misal: "ngantuk banget mau mati rasanya", "mati rasa", "mati gaya")
  const isFigurative = FIGURATIVE_MATI_EXCLUSIONS.some((p) => p.test(lower));
  if (
    isFigurative &&
    !/\b(?:bunuh\s*diri|bundir|akhiri\s+hidup|cutting|self[ -]?harm|racun|loncat)\b/i.test(lower)
  ) {
    return false;
  }

  return CRISIS_PATTERNS.some((p) => p.test(lower));
}

/** Ekstrak durasi duduk dalam jam dari teks user dengan regex sederhana */
export function extractSedentaryHours(text: string): number | null {
  if (
    /\b(?:tidur|merem|begadang)\b/i.test(text) &&
    !/\b(?:duduk|ngerjain|nugas|belajar|lab|laprak|skripsi)\b/i.test(text)
  ) {
    return null;
  }

  const match = text.match(
    /(?:duduk|ngerjain|nugas|belajar|diam|di depan (?:laptop|komputer)|ga gerak|tanpa gerak)?\s*(\d+(?:[.,]\d+)?)\s*jam/i
  );
  if (!match) return null;
  const num = parseFloat(match[1].replace(",", "."));
  return Number.isFinite(num) && num > 0 ? num : null;
}

/** Ekstrak durasi tidur dalam jam jika disebutkan (misal "tidur 4 jam", "tidur cuma 4 jam", "begadang sampai jam 3") */
export function extractSleepHours(text: string): number | null {
  // 1. Pola langsung "tidur X jam", "cuma tidur X jam", "tidur cuma X jam"
  const directMatch = text.match(
    /(?:cuma|hanya|kurang dari|sekitar)?\s*tidur\s+(?:cuma|hanya|kurang dari|sekitar)?\s*(\d+(?:[.,]\d+)?)\s*jam/i
  );
  if (directMatch) {
    const num = parseFloat(directMatch[1].replace(",", "."));
    if (Number.isFinite(num) && num > 0 && num <= 24) return num;
  }

  // 2. Pola terbalik "X jam tidur"
  const reverseMatch = text.match(/(\d+(?:[.,]\d+)?)\s*jam\s+tidur/i);
  if (reverseMatch) {
    const num = parseFloat(reverseMatch[1].replace(",", "."));
    if (Number.isFinite(num) && num > 0 && num <= 24) return num;
  }

  // 3. Pola "begadang sampai jam X" (asumsi waktu bangun pukul 07.00 pagi)
  const begadangMatch = text.match(
    /begadang\s+(?:terus\s+)?sampai\s+(?:jam\s*)?(\d{1,2})(?:[.:](\d{2}))?/i
  );
  if (begadangMatch) {
    const bedtimeHour = parseInt(begadangMatch[1], 10);
    if (bedtimeHour >= 1 && bedtimeHour <= 6) {
      return Math.max(1, 7 - bedtimeHour);
    }
  }

  return null;
}

/** Ekstrak nama aktivitas spesifik (laprak, skripsi, lab, kuliah, dsb.) */
export function extractActivity(text: string): string | null {
  const lower = text.toLowerCase();
  if (/\b(?:laprak|laporan praktikum)\b/i.test(lower)) return "laprak";
  if (/\b(?:skripsi|tesis|tugas akhir|ta)\b/i.test(lower)) return "skripsi";
  if (/\b(?:lab|laboratorium|praktikum)\b/i.test(lower)) return "lab";
  if (/\b(?:kuliah|kelas|dosen)\b/i.test(lower)) return "kuliah";
  if (/\b(?:nugas|tugas)\b/i.test(lower)) return "nugas";
  if (/\b(?:belajar|baca buku)\b/i.test(lower)) return "belajar";
  if (/\b(?:ngoding|koding)\b/i.test(lower)) return "ngoding";
  if (/\b(?:menghadap\s+laptop|lihat\s+laptop|depan\s+laptop|laptop)\b/i.test(lower)) return "laptop";
  if (/\b(?:di\s+depan\s+)?layar\b/i.test(lower)) return "layar";
  if (/\b(?:di\s+depan\s+)?komputer\b/i.test(lower)) return "komputer";
  return null;
}

/** Ekstrak penyebutan lokasi dari input user secara ketat */
export function extractLocation(text: string): string | null {
  const lower = text.toLowerCase();
  if (/\bdi\s+rumah\b/i.test(lower)) return "di rumah";
  if (/\bdi\s+kos(?:an)?\b/i.test(lower)) return "di kos";
  if (/\bdi\s+kamar\b/i.test(lower)) return "di kamar";
  if (/\bdi\s+perpus(?:takaan)?\b/i.test(lower)) return "di perpustakaan";
  if (/\bdi\s+lab(?:oratorium)?\b/i.test(lower)) return "di lab";
  if (/\bdi\s+kampus\b/i.test(lower)) return "di kampus";
  if (/\bdi\s+kantor\b/i.test(lower)) return "di kantor";
  return null;
}

/** Ekstrak kata aktivitas spesifik dari input user untuk pembentukan kalimat deterministik */
export function extractActivityWord(text: string): string | null {
  const lower = text.toLowerCase();
  if (/\bbelajar\b/i.test(lower) && /\blaptop\b/i.test(lower)) {
    if (/\b(?:lihat|melihat|depan)\s+laptop\b/i.test(lower)) {
      return "belajar di depan laptop";
    }
    return "belajar menghadap laptop";
  }
  if (/\bmenghadap\s+laptop\b/i.test(lower)) return "menghadap laptop";
  if (/\b(?:lihat|melihat|di\s+depan)\s+laptop\b/i.test(lower)) return "di depan laptop";
  if (/\blaptop\b/i.test(lower)) return "menghadap laptop";
  if (/\b(?:di\s+depan\s+)?layar\b/i.test(lower)) return "di depan layar";
  if (/\b(?:di\s+depan\s+)?komputer\b/i.test(lower)) return "di depan komputer";
  if (/\bngoding\b/i.test(lower)) return "ngoding";
  if (/\b(?:nugas|mengerjakan\s+tugas)\b/i.test(lower)) return "nugas";
  if (/\b(?:skripsi|mengerjakan\s+skripsi)\b/i.test(lower)) return "mengerjakan skripsi";
  if (/\b(?:laprak|mengerjakan\s+laprak)\b/i.test(lower)) return "mengerjakan laprak";
  if (/\bbelajar\b/i.test(lower)) return "belajar";
  if (/\b(?:kuliah|di\s+kelas)\b/i.test(lower)) return "kuliah";
  if (/\b(?:membaca|baca\s+buku)\b/i.test(lower)) return "membaca";
  if (/\bmenulis\b/i.test(lower)) return "menulis";
  return null;
}

/**
 * Menyusun kalimat penjelasan deterministik jika sedentaryHours atau aktivitas terdeteksi.
 * Mengembalikan null jika tidak ada fakta yang terdeteksi (sehingga menggunakan kalimat netral).
 */
export function buildDeterministicCauseExplanation(
  userInput: string,
  meta?: {
    sedentaryHours?: number | null;
    sleepHours?: number | null;
    detectedActivity?: string | null;
  }
): string | null {
  const sedentaryHours =
    meta?.sedentaryHours !== undefined
      ? meta.sedentaryHours
      : extractSedentaryHours(userInput);
  const sleepHours =
    meta?.sleepHours !== undefined
      ? meta.sleepHours
      : extractSleepHours(userInput);
  const activityWord = extractActivityWord(userInput) ?? meta?.detectedActivity ?? null;
  const locationWord = extractLocation(userInput);
  const isExercised = detectRecentlyExercised(userInput);

  if (isExercised) {
    return "Setelah berolahraga, wajar jika otot terasa lelah dan tubuh memerlukan pemulihan bertahap.";
  }

  if (sedentaryHours !== null) {
    const parts = [
      `Duduk ${sedentaryHours} jam`,
      activityWord,
      locationWord,
    ].filter(Boolean);
    return `${parts.join(" ")} memang bisa membuat badan terasa lelah dan kaku.`;
  }

  if (activityWord) {
    const parts = [
      `Duduk cukup lama`,
      activityWord,
      locationWord,
    ].filter(Boolean);
    return `${parts.join(" ")} memang bisa membuat badan terasa lelah dan kaku.`;
  }

  if (sleepHours !== null) {
    return `Tidur ${sleepHours} jam semalam memang bisa membuat tubuh terasa lelah dan kurang bertenaga.`;
  }

  return null;
}

/** Mendeteksi apakah user menyatakan sudah / baru saja berolahraga */
export function detectRecentlyExercised(text?: string | null): boolean {
  if (!text) return false;
  const lower = text.toLowerCase();
  return (
    /\b(?:sebelum.*?sudah|habis|baru saja|tadi)\s+(?:olahraga|workout|gym|jogging|lari|senam|futsal|badminton|sepedaan|renang)\b/i.test(
      lower
    ) ||
    /\bsudah\s+(?:olahraga|workout|gym|jogging|lari|senam|futsal|badminton|sepedaan|renang)\b/i.test(
      lower
    ) ||
    /\bhabis\s+(?:olahraga|workout|gym|jogging|lari|senam)\b/i.test(lower) ||
    /\bsebelum\s+.*\s+sudah\s+olahraga\b/i.test(lower) ||
    /\bbaru\s+olahraga\b/i.test(lower)
  );
}

/** Mengecek apakah input hanya berisi keluhan umum tanpa penanda konteks (durasi duduk, jam tidur, olahraga, stres/ujian, aktivitas) */
export function isBareGeneralComplaint(text: string): boolean {
  if (!text) return false;
  const trimmed = text.trim();
  const lower = trimmed.toLowerCase();

  // Jalur krisis selalu diprioritaskan paling awal
  if (detectDistressKeywords(trimmed)) return false;

  // Cek apakah ada keluhan kelelahan/kebugaran umum
  const hasGeneralComplaint =
    /\b(capek|lelah|letih|lemes|lemas|mager|males|males gerak|pegal|pegel|kaku|penat|loyo)\b/i.test(
      lower
    );
  if (!hasGeneralComplaint) return false;

  // Cek penanda konteks: jika ADA penanda konteks, bukan bare complaint
  const hasSedentaryHours = extractSedentaryHours(trimmed) !== null;
  const hasSleepHours = extractSleepHours(trimmed) !== null;
  const hasActivity = extractActivity(trimmed) !== null;
  const hasExercise = detectRecentlyExercised(trimmed);
  const hasSleepWords = /\b(tidur|begadang|insomnia|ngantuk|kantuk|mata perih)\b/i.test(lower);
  const hasExamWords = /\b(uts|uas|ujian|tes|kuis|deadline|sidang|presentasi|deg-degan|panik)\b/i.test(lower);
  const hasSittingWords = /\b(duduk|di depan (?:laptop|komputer|layar)|meja|kursi)\b/i.test(lower);
  const hasDurationWords = /\b(seharian|sepanjang hari|berjam-jam|tiap hari)\b/i.test(lower);

  if (
    hasSedentaryHours ||
    hasSleepHours ||
    hasActivity ||
    hasExercise ||
    hasSleepWords ||
    hasExamWords ||
    hasSittingWords ||
    hasDurationWords
  ) {
    return false;
  }

  return true;
}

/**
 * Mendeteksi sapaan ringan atau ucapan terima kasih/konfirmasi murni tanpa keluhan klinis,
 * agar AI Coach membalas secara natural daripada langsung memberi resep olahraga/kelelahan.
 */
export function detectConversationalGreeting(
  text?: string | null
): { type: "greeting" | "thanks" } | null {
  if (!text) return null;
  const trimmed = text.trim();
  if (!trimmed || trimmed.length > 80) return null;
  if (detectDistressKeywords(trimmed) || IN_SCOPE_WELLBEING_PATTERN.test(trimmed)) {
    return null;
  }

  const normalized = trimmed
    .toLowerCase()
    .replace(/[!.,?~]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();

  if (
    /^(?:hai+|halo+|hello+|hi+|hey+|hei+|yo+|p|tes+|test+|permisi|assalam\w*|selamat (?:pagi|siang|sore|malam)|pagi|siang|sore|malam|apa kabar|gimana kabarnya|halo coach|hai coach|coach)(?:\s+(?:coach|kak|min|bot|ai))?$/.test(
      normalized
    )
  ) {
    return { type: "greeting" };
  }

  if (
    /^(?:makasih+|terima kasih+|thanks+|thank you|tq|thx|oke+|ok+|okey|okay|siap+|baik+|noted|sip+|mantap+|sama-sama)(?:\s+(?:coach|kak|ya|banyak|banget))?$/.test(
      normalized
    )
  ) {
    return { type: "thanks" };
  }

  return null;
}

/**
 * Mendeteksi apakah pesan user adalah diskusi/pertanyaan manajemen kuliah, strategi belajar,
 * pengaturan jadwal KRS/istirahat, atau pertanyaan lanjutan multi-turn dari obrolan sebelumnya
 * (selama bukan keluhan fisik/klinis atau krisis darurat).
 */
export function detectAcademicOrFollowupQuery(
  text?: string | null,
  chatHistory?: Array<{ role: "user" | "assistant"; text: string }>
): boolean {
  if (!text) return false;
  const trimmed = text.trim();
  const lower = trimmed.toLowerCase();
  if (!trimmed) return false;

  if (detectDistressKeywords(trimmed) || isBareGeneralComplaint(trimmed)) {
    return false;
  }

  // Jangan belokkan keluhan fisik/tidur/nyeri ke mode akademik — biarkan tetap ditangani jalur klinis
  const hasPhysicalOrSleepComplaint =
    /\b(pegal|pegel|kaku|nyeri|sakit|perih|mata lelah|leher|bahu|punggung|pinggang|ngantuk|kantuk|kurang tidur|begadang|insomnia|lemas|lemes|cemas berlebihan|panik)\b/i.test(
      lower
    );
  if (hasPhysicalOrSleepComplaint) {
    return false;
  }

  // Kata kunci topik akademik, manajemen waktu, fokus, skripsi, jadwal kuliah
  const hasAcademicTopic =
    /\b(jadwal|krs|sks|mata kuliah|matkul|tugas|skripsi|tesis|makalah|laporan|presentasi|pomodoro|prokrastinasi|menunda|fokus belajar|manajemen waktu|atur waktu|belajar dan istirahat|beban kuliah|strategi belajar|persiapan ujian|uas|uts|kuis)\b/i.test(
      lower
    );
  if (hasAcademicTopic) {
    return true;
  }

  // Pertanyaan lanjutan multi-turn yang jelas merujuk obrolan sebelumnya
  const hasHistory = Array.isArray(chatHistory) && chatHistory.length > 0;
  const looksLikeFollowUp =
    /\b(kenapa|mengapa|gimana|bagaimana|caranya|cara nya|jelasin|jelaskan|detail|maksudnya|jam berapa|kapan|selain itu|alternatif|contohnya|kalau gitu|terus|lalu|ulang)\b/i.test(
      lower
    );
  const looksOutOfScope =
    /\b(python|javascript|express|mysql|docker|resep|masak|nasi goreng|liga champions|piala dunia|saham|crypto|zodiak|mobile legends|catur|puisi|pantun|tiket pesawat|fotosintesis)\b/i.test(
      lower
    );

  return hasHistory && looksLikeFollowUp && !looksOutOfScope;
}

/** Mendeteksi respon klarifikasi opsi 1-4 (atau kata kunci/lewati) dari user saat pendingPrompt === 'clarification' */
export function detectClarificationChoice(
  text: string
): { isChoice: boolean; choice: "1" | "2" | "3" | "4" | "SKIP" | null } {
  const trimmed = text.trim().toLowerCase();
  if (
    !trimmed ||
    trimmed === "lewati" ||
    trimmed === "skip" ||
    trimmed === "pass" ||
    trimmed === "langsung" ||
    trimmed === "lanjut"
  ) {
    return { isChoice: true, choice: "SKIP" };
  }
  if (
    /^(?:pilihan\s+|opsi\s+)?1\b/i.test(trimmed) ||
    /\b(?:badan|fisik|pegal|pegel|kaku|otot)\b/i.test(trimmed)
  ) {
    return { isChoice: true, choice: "1" };
  }
  if (
    /^(?:pilihan\s+|opsi\s+)?2\b/i.test(trimmed) ||
    /\b(?:ngantuk|kantuk|tidur|kurang tidur|begadang|merem|mata\s+lelah|mata\s+perih|mata|layar)\b/i.test(
      trimmed
    )
  ) {
    return { isChoice: true, choice: "2" };
  }
  if (
    /^(?:pilihan\s+|opsi\s+)?3\b/i.test(trimmed) ||
    /\b(?:olahraga|workout|gym|lari|berat|fisik berat|futsal|badminton|senam)\b/i.test(trimmed)
  ) {
    return { isChoice: true, choice: "3" };
  }
  if (
    /^(?:pilihan\s+|opsi\s+)?4\b/i.test(trimmed) ||
    /\b(?:pikiran|penat|mental|stres|stress|tugas|beban|kuliah|pusing|mumet)\b/i.test(trimmed)
  ) {
    return { isChoice: true, choice: "4" };
  }
  return { isChoice: false, choice: null };
}

/** Mendeteksi pilihan gerak A-C saat pendingPrompt === 'movement' */
export function detectMovementChoice(
  text: string
): { isChoice: boolean; index: number | null; letter: "A" | "B" | "C" | null } {
  const trimmed = text.trim().toUpperCase();
  if (trimmed === "A" || trimmed === "OPSI A" || trimmed === "PILIHAN A") {
    return { isChoice: true, index: 0, letter: "A" };
  }
  if (trimmed === "B" || trimmed === "OPSI B" || trimmed === "PILIHAN B") {
    return { isChoice: true, index: 1, letter: "B" };
  }
  if (trimmed === "C" || trimmed === "OPSI C" || trimmed === "PILIHAN C") {
    return { isChoice: true, index: 2, letter: "C" };
  }
  return { isChoice: false, index: null, letter: null };
}

/** Membaca jam lokal sistem sebenarnya dalam zona waktu Asia/Jakarta dan mendeteksi kondisi jam malam (>= 21.30 WIB) */
export function getSystemJakartaTime(customDate?: Date | string | number | null): {
  timeStr: string;
  hour: number;
  minute: number;
  period: "pagi" | "siang" | "sore" | "malam";
  isLateNight: boolean;
} {
  let now: Date;
  if (customDate instanceof Date) {
    now = isNaN(customDate.getTime()) ? new Date() : customDate;
  } else if (typeof customDate === "string" || typeof customDate === "number") {
    const parsed = new Date(customDate);
    now = isNaN(parsed.getTime()) ? new Date() : parsed;
  } else if (process.env.COACH_MOCK_TIME) {
    const parsed = new Date(process.env.COACH_MOCK_TIME);
    now = isNaN(parsed.getTime()) ? new Date() : parsed;
  } else {
    now = new Date();
  }
  const timeFormatter = new Intl.DateTimeFormat("id-ID", {
    timeZone: "Asia/Jakarta",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
  const hourFormatter = new Intl.DateTimeFormat("id-ID", {
    timeZone: "Asia/Jakarta",
    hour: "numeric",
    hour12: false,
  });
  const minuteFormatter = new Intl.DateTimeFormat("id-ID", {
    timeZone: "Asia/Jakarta",
    minute: "numeric",
    hour12: false,
  });

  const timeStr = `${timeFormatter.format(now)} WIB`;
  const hour = parseInt(hourFormatter.format(now), 10);
  const minute = parseInt(minuteFormatter.format(now), 10);

  let period: "pagi" | "siang" | "sore" | "malam" = "malam";
  if (hour >= 4 && hour < 11) {
    period = "pagi";
  } else if (hour >= 11 && hour < 15) {
    period = "siang";
  } else if (hour >= 15 && hour < 18) {
    period = "sore";
  } else {
    period = "malam";
  }

  // Sesuai pedoman produk (docs/backend/LLM_AI_COACH.md dan PRD):
  // Pada jam malam (>= 21.30 WIB), rekomendasi gerak dialihkan ke opsi relaksasi dan gerak ringan di dalam ruangan.
  const isLateNight =
    period === "malam" && (hour > 21 || (hour === 21 && minute >= 30) || hour < 4);

  return { timeStr, hour, minute, period, isLateNight };
}

/** Menghilangkan field bernilai null atau undefined dari objek */
export function stripNullFields<T extends Record<string, unknown>>(obj: T): Partial<T> {
  const clean: Record<string, unknown> = {};
  for (const [key, val] of Object.entries(obj)) {
    if (val !== null && val !== undefined) {
      clean[key] = val;
    }
  }
  return clean as Partial<T>;
}

/** Daftar variasi opsi jenis gerak per mediator sesuai PRD */
export const MOVEMENT_OPTIONS_BY_MEDIATOR: Record<string, string[]> = {
  SEDENTARY_OVERLOAD: [
    "peregangan meja (fokus bahu, leher, pergelangan tangan, dan punggung bawah)",
    "jeda berdiri dari kursi dan jalan singkat di koridor atau sekitar ruangan",
    "peregangan tubuh lembut dan jalan santai 10 menit di sekitar meja",
  ],
  SLEEP_MEDIATION_DEFICIT: [
    "peregangan relaksasi otot lembut dan latihan napas 4-7-8 (tanpa olahraga berat bila malam)",
    "latihan napas 4-7-8 santai dalam posisi duduk atau rebahan untuk menenangkan tubuh (tanpa olahraga berat)",
  ],
  LOW_MVPA_VOLUME: [
    "jalan cepat 15-20 menit di area kampus atau kos",
    "naik-turun tangga dan jalan aktif yang boleh dipecah 2-3 sesi 10 menit",
  ],
  EXAM_ACUTE_STRESS: [
    "latihan napas fokus 10-15 menit untuk menenangkan ketegangan akademik",
    "jeda sejenak melihat ruang terbuka hijau atau berjalan santai 10-15 menit",
  ],
  ESCALATION: [
    "TIDAK ada rekomendasi olahraga; hanya latihan napas pelan atau duduk tenang 5-10 menit di ruangan yang nyaman dan ajakan berkonsultasi ke Konselor Kampus",
  ],
  RECENTLY_EXERCISED: [
    "pemulihan aktif dengan peregangan pendinginan otot lembut dan rehidrasi cairan (tanpa olahraga tambahan)",
    "latihan napas rileks dan peregangan pendinginan statis untuk memulihkan otot yang sudah dipakai berolahraga",
  ],
  OPTIMAL_BALANCE: [
    "peregangan santai dan jalan ringan untuk memelihara kebugaran harian",
    "jalan santai 10-15 menit di luar ruangan untuk menyegarkan suasana pikiran",
    "peregangan tubuh lembut dan jeda minum air untuk menjaga keseimbangan energi",
  ],
};

/**
 * Variasi opsi gerak jam malam (>= 21.30 WIB) untuk LOW_MVPA_VOLUME dan SEDENTARY_OVERLOAD.
 *
 * Sesuai pedoman produk (docs/backend/LLM_AI_COACH.md dan PRD):
 * Pada jam malam (>= 21.30 WIB), rekomendasi gerak untuk LOW_MVPA_VOLUME dan SEDENTARY_OVERLOAD
 * dialihkan ke opsi relaksasi dan gerak ringan di dalam ruangan (indoor stretching / gentle indoor walk)
 * demi kenyamanan dan keselamatan pengguna di lingkungan kampus/kos, tanpa menyarankan jalan cepat di luar ruangan.
 */
export const LATE_NIGHT_MOVEMENT_OPTIONS: Record<string, string[]> = {
  LOW_MVPA_VOLUME: [
    "peregangan relaksasi seluruh tubuh dan jalan pelan di dalam ruangan 10-15 menit (tanpa jalan cepat di luar)",
    "jalan santai di dalam kamar atau lorong kos 10 menit untuk melancarkan sirkulasi sebelum tidur",
    "peregangan ringan di lantai atau matras dan latihan napas tenang 10 menit",
  ],
  SEDENTARY_OVERLOAD: [
    "peregangan meja lembut (bahu, leher, punggung bawah) dan jalan pelan di dalam ruangan 10 menit",
    "jeda berdiri santai dan peregangan tubuh ringan di dalam kamar 5-10 menit",
    "peregangan relaksasi di tempat tidur atau matras untuk mengurai kaku duduk",
  ],
};

/** Seluruh opsi gerakan resmi dari PRD untuk validasi movementChoice */
export const ALL_OFFICIAL_MOVEMENT_OPTIONS: string[] = Array.from(
  new Set([
    ...Object.values(MOVEMENT_OPTIONS_BY_MEDIATOR).flat(),
    ...Object.values(LATE_NIGHT_MOVEMENT_OPTIONS).flat(),
  ])
);

/** Mendapatkan tanggal dalam format YYYY-MM-DD sesuai zona waktu Asia/Jakarta */
export function getJakartaDateString(date: Date | string | number): string {
  const d = date instanceof Date ? date : new Date(date);
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Jakarta",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(d);
}

export function getMovementOptionsForMediator(
  mediatorKey: string,
  isLateNight: boolean = false
): string[] {
  if (
    isLateNight &&
    (mediatorKey === "LOW_MVPA_VOLUME" || mediatorKey === "SEDENTARY_OVERLOAD")
  ) {
    return LATE_NIGHT_MOVEMENT_OPTIONS[mediatorKey];
  }
  return (
    MOVEMENT_OPTIONS_BY_MEDIATOR[mediatorKey] || MOVEMENT_OPTIONS_BY_MEDIATOR.OPTIMAL_BALANCE
  );
}

export const lastMovementIndexByMediator: Record<string, number> = {};

/** Memilih opsi gerakan bergantian per mediator dalam sesi (tidak sama dengan giliran sebelumnya) */
export function getNextMovementOption(
  mediatorKey: string,
  isLateNight: boolean = false,
  noRotate: boolean = false
): string {
  const options = getMovementOptionsForMediator(mediatorKey, isLateNight);
  if (options.length === 1 || noRotate || process.env.COACH_NO_ROTATE === "1") {
    return options[0];
  }

  const cacheKey = isLateNight ? `${mediatorKey}_LATE_NIGHT` : mediatorKey;
  const prevIdx = lastMovementIndexByMediator[cacheKey] ?? -1;
  const nextIdx = (prevIdx + 1) % options.length;
  lastMovementIndexByMediator[cacheKey] = nextIdx;
  return options[nextIdx];
}

/** Format pilihan gerakan alternatif di akhir jawaban Coach untuk terminal */
export function formatMovementOptionsPrompt(
  mediatorKeyOrOptions: string | string[],
  isLateNight: boolean = false,
  recommendedJenisGerak?: string
): string {
  let options: string[];
  if (Array.isArray(mediatorKeyOrOptions)) {
    options = mediatorKeyOrOptions;
  } else {
    options = getAlternativeMovementOptions(
      recommendedJenisGerak || "",
      mediatorKeyOrOptions,
      isLateNight
    );
  }

  // Jika alternatif kurang dari 2, jangan tampilkan daftar sama sekali (Poin 2)
  if (options.length < 2) {
    return "";
  }

  const letters = ["A", "B", "C"];
  const lines = [
    "\nMau alternatif lain?",
    ...options.map((opt, i) => `  ${letters[i]}. ${opt.charAt(0).toUpperCase() + opt.slice(1)}`),
    `  (Ketik ${letters.slice(0, options.length).join("/")} untuk memilih, atau ketik bebas)`,
  ];
  return lines.join("\n");
}

/** Memeriksa apakah dua string opsi gerak merujuk pada gerakan yang sama */
export function isSameMovementOption(opt: string, target: string): boolean {
  const normOpt = opt.toLowerCase().trim();
  const normTarget = target.toLowerCase().trim();
  if (normOpt === normTarget) return true;

  const signatures = [
    { key: "peregangan meja lembut malam", re: /peregangan\s+meja\s+lembut.*jalan\s+pelan/i },
    { key: "peregangan meja", re: /peregangan\s+meja/i },
    { key: "jeda berdiri kamar malam", re: /jeda\s+berdiri\s+santai.*kamar/i },
    { key: "jeda berdiri", re: /jeda\s+berdiri|berdiri\s+dari\s+kursi/i },
    { key: "peregangan relaksasi matras malam", re: /tempat\s+tidur\s+atau\s+matras/i },
    { key: "peregangan matras lantai malam", re: /lantai\s+atau\s+matras/i },
    { key: "peregangan tubuh meja", re: /peregangan\s+tubuh\s+lembut.*sekitar\s+meja/i },
    { key: "napas 4-7-8 rebahan", re: /posisi\s+duduk\s+atau\s+rebahan|rebahan\s+untuk\s+menenangkan/i },
    { key: "napas 4-7-8 otot lembut", re: /peregangan\s+relaksasi\s+otot\s+lembut\s+dan\s+latihan\s+napas/i },
    { key: "jalan cepat", re: /jalan\s+cepat/i },
    { key: "tangga", re: /tangga/i },
    { key: "ketegangan akademik", re: /ketegangan\s+akademik/i },
    { key: "ruang terbuka hijau", re: /ruang\s+terbuka\s+hijau|berjalan\s+santai\s+10-15/i },
    { key: "eskalasi", re: /tidak\s+ada\s+rekomendasi\s+olahraga|konselor\s+kampus/i },
    { key: "pemulihan aktif rehidrasi", re: /pemulihan\s+aktif|rehidrasi\s+cairan/i },
    { key: "pendinginan statis", re: /pendinginan\s+statis/i },
    { key: "kebugaran harian", re: /memelihara\s+kebugaran\s+harian/i },
    { key: "menyegarkan suasana pikiran", re: /menyegarkan\s+suasana\s+pikiran/i },
    { key: "keseimbangan energi", re: /keseimbangan\s+energi|jeda\s+minum\s+air/i },
    { key: "jalan pelan ruangan malam", re: /jalan\s+pelan\s+di\s+dalam\s+ruangan/i },
    { key: "jalan lorong kos malam", re: /kamar\s+atau\s+lorong\s+kos/i },
  ];

  for (const sig of signatures) {
    if (sig.re.test(normOpt) && sig.re.test(normTarget)) {
      return true;
    }
  }

  return false;
}

/**
 * Mengambil daftar opsi gerak alternatif (tidak menyertakan opsi yang sama dengan yang direkomendasikan).
 * Jika alternatif kurang dari 2, mengembalikan array kosong agar tidak ditampilkan sama sekali.
 */
export function getAlternativeMovementOptions(
  recommendedJenisGerak: string,
  mediatorKey: string,
  isLateNight: boolean = false
): string[] {
  const allOptions = getMovementOptionsForMediator(mediatorKey, isLateNight);
  if (!recommendedJenisGerak) {
    return allOptions.slice(0, 3);
  }

  const alternatives = allOptions.filter((opt) => !isSameMovementOption(opt, recommendedJenisGerak));
  if (alternatives.length < 2) {
    return [];
  }
  return alternatives.slice(0, 3);
}

/** Template 3-4 langkah panduan ringkas untuk setiap jenis gerak PRD (tanpa memanggil model) */
export const MOVEMENT_GUIDANCE_TEMPLATES: Record<string, string[]> = {
  "peregangan meja (fokus bahu, leher, pergelangan tangan, dan punggung bawah)": [
    "Duduk tegak di kursi, tarik bahu ke belakang, lalu putar perlahan sebanyak 5 kali.",
    "Miringkan kepala lembut ke arah bahu kanan dan kiri, tahan selama 10 detik pada tiap sisi.",
    "Luruskan kedua lengan ke depan, tarik jemari ke belakang untuk meregangkan pergelangan tangan selama 15 detik.",
    "Tautkan jemari di belakang punggung bawah lalu dorong dada terbuka perlahan selama 15-20 detik sambil bernapas teratur.",
  ],
  "jeda berdiri dari kursi dan jalan singkat di koridor atau sekitar ruangan": [
    "Dorong kursi ke belakang dan berdiri tegak dengan kedua kaki berpijak mantap di lantai selama 10 detik.",
    "Berjalan santai mengitari ruangan atau koridor selama 3-5 menit dengan langkah ringan dan stabil.",
    "Ayunkan kedua lengan perlahan selama 30 detik sambil menatap objek yang jauh untuk mengistirahatkan mata.",
    "Habiskan segelas air putih secara perlahan selama 1 menit sebelum kembali duduk dengan postur nyaman.",
  ],
  "peregangan tubuh lembut dan jalan santai 10 menit di sekitar meja": [
    "Berdiri dari meja, angkat kedua tangan lurus ke atas dan rasakan regangan di tulang belakang selama 15 detik.",
    "Miringkan tubuh secara perlahan ke arah kiri dan kanan, tahan selama 10 detik pada tiap sisi.",
    "Lakukan jalan santai langkah kecil di sekitar meja selama 10 menit dengan ritme teratur.",
    "Turunkan kedua bahu secara relaks dan atur napas panjang selama 30 detik sebelum melanjutkan aktivitas.",
  ],
  "peregangan relaksasi otot lembut dan latihan napas 4-7-8 (tanpa olahraga berat bila malam)": [
    "Duduk atau rebahkan tubuh dalam posisi nyaman dan pejamkan mata perlahan selama 30 detik.",
    "Lemaskan otot rahang, leher, dan bahu dengan gerakan memutar lembut sebanyak 5 kali.",
    "Tarik napas lewat hidung selama 4 hitungan, tahan selama 7 hitungan, lalu hembuskan lewat mulut selama 8 hitungan.",
    "Ulangi siklus napas 4-7-8 ini sebanyak 4 kali putaran hingga pikiran terasa tenang.",
  ],
  "latihan napas 4-7-8 santai dalam posisi duduk atau rebahan untuk menenangkan tubuh (tanpa olahraga berat)": [
    "Cari posisi duduk bersandar yang tenang atau rebahan santai di kasur selama 1 menit.",
    "Letakkan satu tangan di dada dan tangan lainnya di perut untuk merasakan irama napas selama 30 detik.",
    "Tarik napas dalam melalui hidung selama 4 detik, tahan napas dengan tenang selama 7 detik.",
    "Hembuskan napas perlahan melalui bibir terbuka selama 8 detik, lalu ulangi siklus ini sebanyak 4 kali.",
  ],
  "jalan cepat 15-20 menit di area kampus atau kos": [
    "Kenakan alas kaki yang nyaman dan siapkan 1 botol air minum selama 1-2 menit persiapan.",
    "Mulai dengan jalan santai selama 3 menit sebagai pemanasan di sekitar lorong atau halaman.",
    "Tingkatkan kecepatan ke jalan cepat selama 15-20 menit dengan ayunan lengan aktif.",
    "Turunkan tempo langkah di 2 menit terakhir dan lakukan peregangan betis ringan selama 15 detik tiap kaki.",
  ],
  "naik-turun tangga dan jalan aktif yang boleh dipecah 2-3 sesi 10 menit": [
    "Gunakan tangga terdekat dengan tempo langkah stabil selama 1-2 menit menaiki tangga secara berhati-hati.",
    "Lakukan naik-turun tangga santai selama 5-10 menit tanpa terburu-buru.",
    "Sambung dengan jalan aktif mendatar di koridor selama 3-5 menit secara teratur.",
    "Istirahat sejenak selama 2 menit, minum air putih, dan ulangi sesi berikutnya bila ada waktu luang.",
  ],
  "latihan napas fokus 10-15 menit untuk menenangkan ketegangan akademik": [
    "Jauhkan buku atau gawai sejenak dan duduk bersandar dengan nyaman selama 1 menit.",
    "Tarik napas dalam melalui hidung selama 4 hitungan hingga rongga dada mengembang.",
    "Hembuskan napas panjang dan teratur melalui mulut selama 6 hitungan sambil melepaskan beban ketegangan.",
    "Lanjutkan pernapasan terarah ini selama 10-15 menit dengan ritme tenang dan stabil.",
  ],
  "jeda sejenak melihat ruang terbuka hijau atau berjalan santai 10-15 menit": [
    "Melangkah ke luar ruangan, balkon, atau dekat jendela terbuka selama 1 menit.",
    "Alihkan pandangan ke objek hijau di kejauhan selama 2-3 menit untuk mengistirahatkan mata lelah.",
    "Berjalan santai langkah tenang di area terbuka selama 10-15 menit sambil menghirup udara segar.",
    "Ambil napas panjang selama 30 detik sebelum kembali melanjutkan kegiatan belajar.",
  ],
  "TIDAK ada rekomendasi olahraga; hanya latihan napas pelan atau duduk tenang 5-10 menit di ruangan yang nyaman dan ajakan berkonsultasi ke Konselor Kampus": [
    "Cari tempat yang tenang, aman, dan teduh untuk duduk bersandar dengan relaks selama 1 menit.",
    "Letakkan tangan di atas paha dan pejamkan mata sejenak selama 30 detik tanpa memaksakan pikiran apa pun.",
    "Tarik napas pelan dan hembuskan dengan lembut selama 5-10 menit untuk menenangkan diri.",
    "Ingat bahwa kamu tidak sendirian; jangan ragu menghubungi layanan konselor kampus atau Hotline 119 bila butuh teman cerita.",
  ],
  "pemulihan aktif dengan peregangan pendinginan otot lembut dan rehidrasi cairan (tanpa olahraga tambahan)": [
    "Minum satu atau dua gelas air putih secara berkala selama 2 menit untuk memulihkan cairan tubuh.",
    "Lakukan peregangan statis pada otot paha, betis, dan punggung selama 2-3 menit tanpa sentakan tiba-tiba.",
    "Tahan setiap posisi regangan selama 15-20 detik sambil bernapas santai dan tenang.",
    "Duduk atau rebahan santai selama 3-5 menit agar tubuh kembali tenang dan relaks.",
  ],
  "latihan napas rileks dan peregangan pendinginan statis untuk memulihkan otot yang sudah dipakai berolahraga": [
    "Berdiri atau duduk santai dan atur pernapasan panjang selama 1-2 menit secara teratur.",
    "Regangkan otot paha depan dengan menarik satu pergelangan kaki ke belakang perlahan, tahan selama 15 detik.",
    "Luruskan satu kaki ke depan dan bungkukkan badan lembut untuk meregangkan paha belakang selama 15 detik.",
    "Ambil napas dalam selama 30 detik, regangkan kedua bahu, lalu minum air putih untuk mendukung pemulihan.",
  ],
  "peregangan santai dan jalan ringan untuk memelihara kebugaran harian": [
    "Bangkit dari tempat duduk dan regangkan seluruh badan ke atas selama 15-20 detik.",
    "Lakukan jalan ringan mengelilingi ruangan atau koridor dengan langkah santai selama 5-10 menit.",
    "Putar pinggang lembut ke kiri dan kanan masing-masing sebanyak 5 kali untuk melemaskan persendian punggung.",
    "Tarik napas lega selama 30 detik dan lanjutkan sisa hari dengan ritme yang lebih segar.",
  ],
  "jalan santai 10-15 menit di luar ruangan untuk menyegarkan suasana pikiran": [
    "Beranjak ke luar ruangan atau halaman kos dan nikmati pergantian suasana sekitarmu selama 1 menit.",
    "Berjalan santai dengan ritme nyaman selama 10-15 menit tanpa memikirkan beban tugas.",
    "Perhatikan lingkungan sekitar dan rasakan embusan udara segar secara perlahan selama 1-2 menit.",
    "Akhiri dengan mengatur napas tenang selama 1 menit dan minum segelas air saat tiba kembali di kamar.",
  ],
  "peregangan tubuh lembut dan jeda minum air untuk menjaga keseimbangan energi": [
    "Ambil segelas air putih dan minum perlahan selama 1-2 menit sambil duduk santai.",
    "Tautkan jemari tangan lalu dorong telapak tangan ke arah atas selama 15 detik.",
    "Miringkan badan ke kiri dan kanan secara bergantian masing-masing selama 10 detik.",
    "Lemaskan kedua lengan ke samping badan dan hembuskan napas panjang selama 30 detik dengan relaks.",
  ],
  "peregangan relaksasi seluruh tubuh dan jalan pelan di dalam ruangan 10-15 menit (tanpa jalan cepat di luar)": [
    "Tetap di dalam kamar selama 1 menit persiapan tanpa perlu keluar di malam hari.",
    "Lakukan jalan perlahan di dalam kamar selama 5 menit untuk melemaskan persendian kaki.",
    "Regangkan otot leher, bahu, dan punggung atas dengan gerakan memutar lembut sebanyak 5 kali.",
    "Akhiri dengan duduk tenang sambil menarik napas panjang selama 2-3 menit untuk menyiapkan tubuh beristirahat.",
  ],
  "jalan santai di dalam kamar atau lorong kos 10 menit untuk melancarkan sirkulasi sebelum tidur": [
    "Lepaskan alas kaki yang kaku dan mulailah melangkah santai selama 1 menit di lantai kamar atau lorong kos.",
    "Berjalan pelan bolak-balik selama 10 menit dengan ritme langkah yang tenang dan stabil.",
    "Ayunkan kedua tangan dengan bebas selama 1-2 menit dengan gerakan santai dan teratur.",
    "Minum 1 gelas air hangat secara perlahan lalu bersiaplah untuk beristirahat di tempat tidur.",
  ],
  "peregangan ringan di lantai atau matras dan latihan napas tenang 10 menit": [
    "Duduk bersila atau rebahan di atas matras selama 1 menit pada posisi yang bersih dan nyaman.",
    "Dekapkan kedua lutut ke dada perlahan, tahan selama 20 detik untuk melepaskan tekanan pada punggung bawah.",
    "Buka kedua lengan ke samping dan miringkan lutut bergantian ke kiri dan kanan, tahan 10 detik pada tiap sisi.",
    "Lakukan pernapasan perut yang tenang selama 5 menit hingga kelopak mata terasa berat dan relaks.",
  ],
  "peregangan meja lembut (bahu, leher, punggung bawah) dan jalan pelan di dalam ruangan 10 menit": [
    "Duduk bersandar di kursi dan putar bahu ke belakang sebanyak 5 kali dengan lembut.",
    "Tolehkan kepala perlahan ke samping kiri dan kanan, tahan selama 10 detik pada masing-masing sisi.",
    "Berdiri lalu jalan perlahan di dalam ruangan selama 5-10 menit tanpa terburu-buru.",
    "Kembali duduk atau rebahan selama 1-2 menit dengan perasaan tubuh yang lebih longgar dan relaks.",
  ],
  "jeda berdiri santai dan peregangan tubuh ringan di dalam kamar 5-10 menit": [
    "Berdiri tegak di samping tempat tidur dan rasakan kedua telapak kaki menapak rileks selama 10 detik.",
    "Angkat kedua tangan ke atas lalu condongkan tubuh lembut ke samping kiri dan kanan, tahan 10 detik tiap sisi.",
    "Berjalan langkah kecil di dalam kamar selama 5 menit untuk melemaskan tungkai kaki.",
    "Duduk di tepi kasur sambil menghembuskan napas panjang selama 30 detik untuk menyudahi kegiatan hari ini.",
  ],
  "peregangan relaksasi di tempat tidur atau matras untuk mengurai kaku duduk": [
    "Rebahkan tubuh lurus di atas kasur atau matras selama 1 menit dengan bantal yang menyangga nyaman.",
    "Tarik satu lutut ke arah dada, tahan selama 15 detik, lalu ganti dengan kaki yang satunya.",
    "Rentangkan kedua tangan ke atas kepala dan regangkan ujung jemari kaki sejauh mungkin selama 10-15 detik.",
    "Lemaskan seluruh otot tubuh, tarik napas dalam selama 1-2 menit, dan biarkan rasa kaku duduk berkurang.",
  ],
};

export const MOVEMENT_GUIDANCE_CLOSING = "Kalau sudah selesai, ceritakan ya bagaimana rasanya.";

/** Mengambil panduan template konfirmasi dan 3-4 langkah gerak resmi */
export function getMovementGuidance(optionText: string): {
  confirmation: string;
  steps: string[];
  closing: string;
  fullPlanText: string;
} {
  const norm = optionText.toLowerCase().trim();
  let matchedSteps: string[] | undefined;

  for (const [key, steps] of Object.entries(MOVEMENT_GUIDANCE_TEMPLATES)) {
    if (key.toLowerCase().trim() === norm) {
      matchedSteps = steps;
      break;
    }
  }

  if (!matchedSteps) {
    for (const [key, steps] of Object.entries(MOVEMENT_GUIDANCE_TEMPLATES)) {
      if (isSameMovementOption(key, optionText)) {
        matchedSteps = steps;
        break;
      }
    }
  }

  if (!matchedSteps) {
    matchedSteps = [
      "Ambil posisi duduk atau berdiri tegak yang nyaman dan rileks.",
      "Lakukan peregangan lembut pada area leher, bahu, dan punggung selama 5 menit.",
      "Tarik napas dalam secara teratur dan minum segelas air putih.",
      "Rasakan tubuh kembali segar sebelum melanjutkan aktivitas.",
    ];
  }

  const cleanOption = optionText.trim();
  const confirmation = `Pilihan tepat, mari lakukan ${cleanOption} sekarang.`;
  const closing = MOVEMENT_GUIDANCE_CLOSING;
  const fullPlanText = `Ikuti panduan langkah ${cleanOption} berikut:\n${matchedSteps
    .map((s, i) => `${i + 1}. ${s}`)
    .join("\n")}\n\n${closing}`;

  return {
    confirmation,
    steps: matchedSteps,
    closing,
    fullPlanText,
  };
}

/** Sanitasi kata waktu */
export function sanitizeTimeWords(
  text: string,
  userInput: string,
  systemPeriod: "pagi" | "siang" | "sore" | "malam"
): string {
  const timeWords = ["pagi", "siang", "sore", "malam", "semalam", "kemarin"] as const;
  const userLower = userInput.toLowerCase();

  const allowed = new Set<string>();
  allowed.add(systemPeriod);

  for (const word of timeWords) {
    if (new RegExp(`\\b${word}\\b`, "i").test(userLower)) {
      allowed.add(word);
    }
  }

  let s = text;

  for (const w1 of timeWords) {
    for (const w2 of timeWords) {
      if (!allowed.has(w1) || !allowed.has(w2)) {
        const rangeRegex = new RegExp(`\\bdari\\s+${w1}\\s+sampai\\s+${w2}\\b`, "gi");
        s = s.replace(rangeRegex, "hari ini");
      }
    }
  }

  for (const word of timeWords) {
    if (!allowed.has(word)) {
      s = s.replace(new RegExp(`\\b${word}\\s+ini\\b`, "gi"), "sekarang");
      s = s.replace(new RegExp(`\\b(?:di waktu|pada)\\s+${word}(?:\\s+hari)?\\b`, "gi"), "sekarang");
      s = s.replace(new RegExp(`\\bsampai\\s+${word}\\b`, "gi"), "sampai sekarang");
      s = s.replace(new RegExp(`\\bmenjelang\\s+${word}\\b`, "gi"), "sekarang");
      s = s.replace(new RegExp(`\\bdi\\s+${word}\\s+hari\\b`, "gi"), "hari ini");
      s = s.replace(new RegExp(`\\b${word}\\s+hari\\b`, "gi"), "hari ini");

      if (word === "kemarin") {
        s = s.replace(new RegExp(`\\b${word}\\b`, "gi"), "hari ini");
      } else if (word === "semalam") {
        s = s.replace(new RegExp(`\\b${word}\\b`, "gi"), "sebelumnya");
      } else {
        s = s.replace(new RegExp(`\\b${word}\\b`, "gi"), "sekarang");
      }
    }
  }

  return s.replace(/\s{2,}/g, " ").trim();
}

/** Pengecekan kesesuaian jenis gerak untuk log debug */
export function checkMovementMatch(
  actionPlan: string,
  targetJenisGerak: string
): { matches: boolean; note: string } {
  const planLower = actionPlan.toLowerCase();
  const targetLower = targetJenisGerak.toLowerCase();

  let matches = false;
  if (
    /peregangan|stretching/i.test(targetLower) &&
    /peregangan|stretching|rentangkan|bahu|leher|punggung/i.test(planLower)
  ) {
    matches = true;
  } else if (
    /napas|pernapasan|4-7-8/i.test(targetLower) &&
    /napas|pernapasan|4-7-8/i.test(planLower)
  ) {
    matches = true;
  } else if (/tangga/i.test(targetLower) && /tangga/i.test(planLower)) {
    matches = true;
  } else if (/jalan cepat/i.test(targetLower) && /jalan cepat/i.test(planLower)) {
    matches = true;
  } else if (
    /ruang terbuka/i.test(targetLower) &&
    /ruang terbuka|taman|luar ruangan|jendela/i.test(planLower)
  ) {
    matches = true;
  } else if (
    /duduk tenang|tanpa olahraga|hanya latihan napas/i.test(targetLower) &&
    /duduk|napas|tenang|rileks|tarik napas/i.test(planLower)
  ) {
    matches = true;
  } else if (
    /pemulihan aktif|pendinginan|rehidrasi/i.test(targetLower) &&
    /pemulihan|pendinginan|peregangan|napas|hidrasi|minum|istirahat|rileks/i.test(planLower)
  ) {
    matches = true;
  } else if (
    /jalan singkat|jeda berdiri/i.test(targetLower) &&
    /jalan|berdiri|koridor/i.test(planLower)
  ) {
    matches = true;
  } else if (
    /jalan pelan|jalan santai.*(?:ruangan|kamar|lorong)|dalam ruangan/i.test(targetLower) &&
    /jalan|santai|kamar|ruangan|lorong/i.test(planLower)
  ) {
    matches = true;
  }

  const note = matches
    ? "SESUAI dengan JENIS_GERAK"
    : `TIDAK SESUAI (Target: "${targetJenisGerak}", Model: "${actionPlan.slice(0, 70)}...")`;

  return { matches, note };
}

/** Hapus duplikasi kalimat persis dalam satu teks (case-insensitive & whitespace trimmed) */
export function deduplicateSentences(text: string): string {
  if (!text) return "";
  const sentenceRegex = /[^.!?\n]+(?:[.!?]+|\n+|$)/g;
  const matches = text.match(sentenceRegex);
  if (!matches) return text.trim();

  const seen = new Set<string>();
  const result: string[] = [];

  for (const raw of matches) {
    const clean = raw.trim();
    if (!clean) continue;
    const normalized = clean.toLowerCase().replace(/[.!?]+$/, "").trim();
    if (normalized.length > 5 && seen.has(normalized)) {
      continue;
    }
    seen.add(normalized);
    result.push(clean);
  }

  return result.join(" ");
}

/** Hapus kalimat rekomendasi yang diulang antara ringkasan dan rencana aksi */
export function deduplicateResponse(
  summary: string,
  plan: string
): { summary: string; plan: string; removedDuplicates: string[] } {
  const dedupedSummary = deduplicateSentences(summary);
  const sentenceRegex = /[^.!?\n]+(?:[.!?]+|\n+|$)/g;
  const summarySentences = (dedupedSummary.match(sentenceRegex) || [])
    .map((s) => s.trim().toLowerCase().replace(/[.!?]+$/, "").trim())
    .filter((s) => s.length > 5);

  const summarySet = new Set(summarySentences);
  const planMatches = plan.match(sentenceRegex) || [plan];
  const cleanPlanPieces: string[] = [];
  const removedDuplicates: string[] = [];

  for (const raw of planMatches) {
    const clean = raw.trim();
    if (!clean) continue;
    const norm = clean.toLowerCase().replace(/[.!?]+$/, "").trim();
    if (norm.length > 5 && summarySet.has(norm)) {
      removedDuplicates.push(clean);
      continue;
    }
    cleanPlanPieces.push(clean);
  }

  const dedupedPlan = deduplicateSentences(cleanPlanPieces.join(" "));
  const finalPlan = dedupedPlan.trim().length > 0 ? dedupedPlan : plan;
  return {
    summary: dedupedSummary,
    plan: finalPlan,
    removedDuplicates,
  };
}

/** Menghapus pemakaian kata 'baru saja' sebelum durasi tidur (karena sleepHours adalah tidur semalam) */
export function sanitizeSleepInterpretation(text: string): string {
  return text
    .replace(/\bbaru\s+saja\s+(?:tidur|bangun\s+dari\s+tidur)\b/gi, "semalam tidur")
    .replace(/\bbaru\s+tidur\b/gi, "tidur semalam");
}

export const LEADING_CONJUNCTION_REGEX =
  /^(?:namun|meskipun\s+begitu|tetapi|tapi|karena\s+itu|akan\s+tetapi|oleh\s+karena\s+itu|meskipun\s+demikian|walaupun\s+demikian)\b/i;

export function hasLeadingConjunction(text: string): boolean {
  if (!text) return false;
  return LEADING_CONJUNCTION_REGEX.test(text.trim());
}

/**
 * Menghapus kata sambung kontras/sebab di awal teks atau kalimat yang berdiri sendiri
 * akibat penghapusan kalimat sebelumnya oleh filter (misal: "Namun, tidak perlu..." -> "Tidak perlu...").
 */
export function stripLeadingConjunctions(text: string): string {
  if (!text) return "";
  let trimmed = text.trim();

  const leadingConjunctionRegex =
    /^(?:namun|meskipun\s+begitu|tetapi|tapi|karena\s+itu|akan\s+tetapi|oleh\s+karena\s+itu|meskipun\s+demikian|walaupun\s+demikian)\s*,?\s*/i;

  while (leadingConjunctionRegex.test(trimmed)) {
    trimmed = trimmed.replace(leadingConjunctionRegex, "").trim();
  }

  if (trimmed.length > 0) {
    trimmed = trimmed.charAt(0).toUpperCase() + trimmed.slice(1);
  }

  return trimmed;
}

/** Regex untuk mendeteksi kalimat yang membocorkan directive, ketiadaan data, atau directive check-in di terminal */
export const DIRECTIVE_LEAK_REGEX =
  /\b(?:tidak\s+ada\s+data|data\s+tidak\s+lengkap|tidak\s+disebutkan|belum\s+ada\s+data|tidak\s+memiliki\s+data|tanpa\s+data|meskipun\s+tidak\s+ada\s+data|data_tidak_lengkap|jenis_gerak|sudah_olahraga|penyebab_tidak_diketahui|konteks_pilihan|jam_malam_ringan|input_dalam_cakupan|belum_checkin_harian|belum\s+melakukan\s+check-in|lengkapi\s+check-in|check-in|checkin)\b/i;

/** Filter kebocoran directive: menghapus kalimat yang memuat frasa kebocoran data/directive */
export function filterDirectiveLeakage(text: string): string {
  if (!text) return "";
  const sentenceRegex = /[^.!?\n]+(?:[.!?]+|\n+|$)/g;
  const sentences = text.match(sentenceRegex) || [text];
  const kept = sentences.filter((s) => !DIRECTIVE_LEAK_REGEX.test(s));
  const joined = kept.join(" ").trim();
  return stripLeadingConjunctions(joined);
}

/**
 * Memastikan durasi menit di actionPlan sesuai dengan durasi di JENIS_GERAK dan allowedRanges.
 * Jika angka di luar rentang yang diizinkan atau berbeda dari target JENIS_GERAK,
 * ganti dengan durasi yang tertulis di JENIS_GERAK.
 */
export function sanitizeDurationMinutes(
  actionPlan: string,
  jenisGerak: string,
  allowedRanges: AllowedRanges
): { sanitized: string; replaced: boolean; oldDuration?: string; newDuration?: string } {
  const jenisMatch = jenisGerak.match(/(\d+(?:-\d+)?)\s*menit/i);
  const targetDurationStr = jenisMatch
    ? `${jenisMatch[1]} menit`
    : `${allowedRanges.durationMinutesRange[0]} menit`;

  let minAllowed = allowedRanges.durationMinutesRange[0];
  let maxAllowed = allowedRanges.durationMinutesRange[1];

  if (jenisMatch) {
    if (jenisMatch[1].includes("-")) {
      const [low, high] = jenisMatch[1].split("-").map((v) => parseInt(v.trim(), 10));
      minAllowed = low;
      maxAllowed = high;
    } else {
      const single = parseInt(jenisMatch[1], 10);
      minAllowed = single;
      maxAllowed = single;
    }
  }

  let replaced = false;
  let oldDuration: string | undefined;
  let newDuration: string | undefined;

  const sanitized = actionPlan.replace(/\b(\d+)\s*menit\b/gi, (orig, p1) => {
    const val = parseInt(p1, 10);
    if (val < minAllowed || val > maxAllowed) {
      replaced = true;
      oldDuration = orig;
      newDuration = targetDurationStr;
      return targetDurationStr;
    }
    return orig;
  });

  return { sanitized, replaced, oldDuration, newDuration };
}

export interface CoachRawLogEntry {
  timestamp: string;
  userInput: string;
  dominantMediator: string;
  rawModelResponse: {
    dominantMediator?: string;
    diagnosisSummary: string;
    isotemporalActionPlan: string;
    recommendedMetsToday?: number;
    scientificCitationNote?: string;
  };
  finalResponse: {
    dominantMediator?: string;
    diagnosisSummary: string;
    isotemporalActionPlan: string;
    recommendedMetsToday?: number;
    scientificCitationNote?: string;
  };
  rawAttempt1?: {
    dominantMediator?: string;
    diagnosisSummary: string;
    isotemporalActionPlan: string;
    recommendedMetsToday?: number;
    scientificCitationNote?: string;
  };
  rawAttempt2?: {
    dominantMediator?: string;
    diagnosisSummary: string;
    isotemporalActionPlan: string;
    recommendedMetsToday?: number;
    scientificCitationNote?: string;
  };
  rawInsight?: {
    dominantMediator?: string;
    diagnosisSummary: string;
    isotemporalActionPlan: string;
    recommendedMetsToday?: number;
    scientificCitationNote?: string;
  };
  finalInsight?: {
    dominantMediator?: string;
    diagnosisSummary: string;
    isotemporalActionPlan: string;
    recommendedMetsToday?: number;
    scientificCitationNote?: string;
  };
  flags: {
    retryApplied: boolean;
    retryReasons?: string[];
    sentenceRemoved: boolean;
    durationAdjusted: boolean;
    openingReplaced: boolean;
    conjunctionStripped: boolean;
  };
}

export function getCoachRawLogPath(): string {
  const cwd = process.cwd();
  if (cwd.endsWith("backend")) {
    return path.resolve(cwd, "logs/coach-raw.jsonl");
  }
  return path.resolve(cwd, "backend/logs/coach-raw.jsonl");
}

let customRawLogWriter: typeof appendCoachRawLog | null = null;

export function setRawLogWriterForTest(fn: typeof appendCoachRawLog | null): void {
  customRawLogWriter = fn;
}

export function appendCoachRawLog(entry: CoachRawLogEntry, logFilePath?: string): void {
  if (customRawLogWriter) {
    customRawLogWriter(entry, logFilePath);
    return;
  }
  try {
    const targetPath = logFilePath || getCoachRawLogPath();
    const dir = path.dirname(targetPath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    fs.appendFileSync(targetPath, JSON.stringify(entry) + "\n", "utf-8");
  } catch (err) {
    // Non-blocking log write
  }
}

export interface AuditReport {
  unverifiedNumbers: string[];
  unverifiedActivityClaims: string[];
  unverifiedCauseClaims: string[];
  unverifiedEmotionClaims: string[];
  hasRepeatedSentences: boolean;
  repeatedSentences: string[];
}

/**
 * Pengecekan pasca-jawaban:
 * 1. Angka+satuan (jam/menit) yang tidak ada di input user, di allowedRanges, atau di JENIS_GERAK.
 * 2. Klaim aktivitas ("sudah cukup aktif", "aktivitas intensif") saat datanya null/tidak ada.
 * 3. Klaim penyebab & emosi yang tidak ada di input user atau data (tidur, duduk, aktivitas padat, stres/cemas).
 * 4. Deteksi kalimat rekomendasi yang diulang dua kali.
 */
export function auditResponse(
  diagnosisSummary: string,
  actionPlan: string,
  userInput: string,
  allowedRanges: AllowedRanges,
  jenisGerak: string,
  hasSedentaryData: boolean,
  hasMvpaData: boolean,
  hasSleepData: boolean = false,
  detectedActivity: string | null = null,
  options?: {
    dominantMediator?: string;
    escalationFlag?: boolean;
    contextChoice?: string | null;
    activeDirectives?: string[];
  }
): AuditReport {
  const fullText = `${diagnosisSummary} ${actionPlan}`;
  const userLower = userInput.toLowerCase();

  // 1. Ekstrak angka+satuan (misal "25 menit", "8 jam")
  const numberUnitMatches = fullText.matchAll(/\b(\d+(?:[.,]\d+)?)\s*(jam|menit)\b/gi);
  const unverifiedNumbers: string[] = [];

  const allowedNumbers = new Set<number>();
  // Dari userInput
  const userNumMatches = userInput.matchAll(/\b(\d+(?:[.,]\d+)?)\b/g);
  for (const m of userNumMatches) {
    allowedNumbers.add(parseFloat(m[1].replace(",", ".")));
  }
  // Dari allowedRanges
  for (let m = allowedRanges.durationMinutesRange[0]; m <= allowedRanges.durationMinutesRange[1]; m++) {
    allowedNumbers.add(m);
  }
  // Dari jenisGerak
  const jenisNumMatches = jenisGerak.matchAll(/\b(\d+(?:[.,]\d+)?)\b/g);
  for (const m of jenisNumMatches) {
    allowedNumbers.add(parseFloat(m[1].replace(",", ".")));
  }

  for (const match of numberUnitMatches) {
    const val = parseFloat(match[1].replace(",", "."));
    const unit = match[2].toLowerCase();
    if (!allowedNumbers.has(val)) {
      unverifiedNumbers.push(`${val} ${unit}`);
    }
  }

  // 2. Klaim aktivitas saat data null
  const unverifiedActivityClaims: string[] = [];
  if (!hasMvpaData) {
    const activeMatches = fullText.matchAll(
      /\b(?:sudah\s+cukup\s+aktif|cukup\s+aktif|kurang\s+aktif|terlihat\s+kurang\s+aktif|ritme\s+gerak(?:mu)?|aktivitas\s+intensif)\b/gi
    );
    for (const m of activeMatches) {
      unverifiedActivityClaims.push(`Klaim aktivitas tanpa data: "${m[0]}"`);
    }
  }
  if (!hasSedentaryData) {
    if (/\b(?:duduk\s+cukup\s+lama|sudah\s+beraktivitas\s+cukup\s+lama)\b/i.test(fullText)) {
      unverifiedActivityClaims.push("Klaim durasi duduk tanpa angka jam duduk");
    }
  }

  // 3. Klaim penyebab & emosi tidak ada di input user atau data (Poin 1 & 4)
  const unverifiedCauseClaims: string[] = [];
  const unverifiedEmotionClaims: string[] = [];

  // Salin klaim aktivitas tanpa data ke unverifiedCauseClaims agar memicu retry/filter
  if (!hasMvpaData && unverifiedActivityClaims.length > 0) {
    for (const ac of unverifiedActivityClaims) {
      if (!unverifiedCauseClaims.includes(ac)) {
        unverifiedCauseClaims.push(ac);
      }
    }
  }

  // a. Klaim tidur saat field kosong & user tidak sebut tidur
  const userMentionsSleep =
    /\b(tidur|begadang|ngantuk|kantuk|insomnia|lelap|merem)\b/i.test(userLower) ||
    options?.contextChoice === "2";
  if (!hasSleepData && !userMentionsSleep) {
    if (
      /\b(?:masalah\s+(?:dengan\s+)?tidur|kurang\s+tidur|pola\s+tidur|kualitas\s+tidur|jam\s+tidur|tidurmu|begadang|istirahat\s+malam)\b/i.test(
        fullText
      )
    ) {
      unverifiedCauseClaims.push("Klaim masalah tidur tanpa data/disebut user");
    }
  }

  // b. Klaim duduk saat field kosong & user tidak sebut duduk/nugas
  const userMentionsSitting =
    /\b(duduk|nugas|laprak|skripsi|lab|kuliah|kursi|meja|layar|komputer|laptop|tv)\b/i.test(
      userLower
    ) || options?.contextChoice === "1";
  if (!hasSedentaryData && !userMentionsSitting) {
    if (
      /\b(?:duduk\s+(?:cukup\s+)?lama|terlalu\s+lama\s+duduk|sudah\s+cukup\s+lama\s+duduk|banyak\s+duduk|posisi\s+duduk|lama\s+di\s+depan\s+layar|di\s+depan\s+(?:komputer|laptop|layar|tv)|berjam-jam\s+di\s+depan|menonton\s+tv)\b/i.test(
        fullText
      )
    ) {
      unverifiedCauseClaims.push("Klaim durasi duduk/layar tanpa data/disebut user");
    }
  }

  // c. Klaim kuliah saat user tidak sebut kuliah & detectedActivity bukan KULIAH (Poin 4)
  const userMentionsCollege =
    /\b(kuliah|kampus|kelas|matkul|dosen)\b/i.test(userLower) ||
    detectedActivity === "KULIAH";
  if (!userMentionsCollege) {
    const collegeMatches = fullText.matchAll(
      /\b(?:setelah\s+kuliah|kegiatan\s+kuliah|jadwal\s+kuliah|di\s+kampus|kuliah)\b/gi
    );
    for (const m of collegeMatches) {
      unverifiedCauseClaims.push(`Klaim kuliah tanpa disebut user: "${m[0]}"`);
    }
  }

  // d. Klaim tugas saat user tidak sebut tugas/nugas & detectedActivity bukan TUGAS (Poin 4)
  const userMentionsTasks =
    /\b(tugas|nugas|laprak|skripsi|pr|makalah)\b/i.test(userLower) ||
    detectedActivity === "TUGAS";
  if (!userMentionsTasks) {
    const taskMatches = fullText.matchAll(
      /\b(?:mengerjakan\s+tugas(?:\s+kuliah)?|setelah\s+(?:mengerjakan\s+)?tugas|nugas|banyak\s+tugas)\b/gi
    );
    for (const m of taskMatches) {
      unverifiedCauseClaims.push(`Klaim tugas tanpa disebut user: "${m[0]}"`);
    }
  }

  // e. Klaim aktivitas padat saat field kosong & user tidak sebut
  const userMentionsActivity =
    /\b(aktivitas|kegiatan|olahraga|kuliah|kelas|dosen|lab|laprak|skripsi|nugas|jadwal|padat|sibuk)\b/i.test(
      userLower
    ) || options?.contextChoice === "3";
  if (!hasMvpaData && !detectedActivity && !userMentionsActivity) {
    if (
      /\b(?:aktivitas\s+padat|padatnya\s+aktivitas|jadwal\s+padat|setelah\s+berolahraga|banyak\s+aktivitas|kuliah\s+seharian|kegiatan\s+padat)\b/i.test(
        fullText
      )
    ) {
      unverifiedCauseClaims.push("Klaim aktivitas padat/kuliah tanpa data/disebut user");
    }
  }

  // d. Klaim emosi/stres/cemas/tertekan saat tidak ada di user input, pilihan, atau data (Poin 1)
  const isStressContext =
    /\b(stres|stress|cemas|kecemasan|tertekan|tekanan|panik|khawatir|kepikiran|beban\s+pikiran|penat|mumet|pusing)\b/i.test(
      userLower
    ) ||
    options?.contextChoice === "4" ||
    options?.dominantMediator === "EXAM_ACUTE_STRESS" ||
    options?.escalationFlag === true;

  if (!isStressContext) {
    const stressMatches = fullText.matchAll(
      /\b(?:mengalami\s+stres|meredakan\s+stres|tingkat\s+stres|stres\s+(?:yang\s+)?cukup\s+tinggi|stresmu|banyak\s+stres|meredakan\s+kecemasan|rasa\s+cemas|tertekan|stres)\b/gi
    );
    for (const sm of stressMatches) {
      const claim = `Klaim emosi tanpa data: "${sm[0]}"`;
      if (!unverifiedEmotionClaims.includes(claim)) {
        unverifiedEmotionClaims.push(claim);
      }
      if (!unverifiedCauseClaims.includes(claim)) {
        unverifiedCauseClaims.push(claim);
      }
    }
  }

  // e. Klaim sibuk saat tidak ada di input user
  const userMentionsBusy = /\b(sibuk|kesibukan|jadwal|padat)\b/i.test(userLower);
  if (!userMentionsBusy && /\b(?:sibuk|kesibukan\s+kuliah|jadwal\s+padat)\b/i.test(fullText)) {
    const claim = "Klaim sibuk tanpa disebut user";
    if (!unverifiedCauseClaims.includes(claim)) {
      unverifiedCauseClaims.push(claim);
    }
  }

  // 4. Deteksi kalimat rekomendasi yang diulang dua kali
  const sentences = fullText
    .split(/[.!?]+/)
    .map((s) => s.trim().toLowerCase())
    .filter((s) => s.length > 20);

  const repeatedSentences: string[] = [];
  for (let i = 0; i < sentences.length; i++) {
    for (let j = i + 1; j < sentences.length; j++) {
      if (sentences[i] === sentences[j]) {
        repeatedSentences.push(sentences[i]);
      }
    }
  }

  return {
    unverifiedNumbers,
    unverifiedActivityClaims,
    unverifiedCauseClaims,
    unverifiedEmotionClaims,
    hasRepeatedSentences: repeatedSentences.length > 0,
    repeatedSentences,
  };
}
