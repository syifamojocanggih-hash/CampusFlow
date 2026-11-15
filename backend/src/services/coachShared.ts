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
  return null;
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
  OPTIMAL_BALANCE: [
    "peregangan santai dan jalan ringan untuk memelihara kebugaran harian",
  ],
};

export const lastMovementIndexByMediator: Record<string, number> = {};

/** Memilih opsi gerakan bergantian per mediator dalam sesi (tidak sama dengan giliran sebelumnya) */
export function getNextMovementOption(mediatorKey: string): string {
  const options =
    MOVEMENT_OPTIONS_BY_MEDIATOR[mediatorKey] || MOVEMENT_OPTIONS_BY_MEDIATOR.OPTIMAL_BALANCE;
  if (options.length === 1) return options[0];

  const prevIdx = lastMovementIndexByMediator[mediatorKey] ?? -1;
  const nextIdx = (prevIdx + 1) % options.length;
  lastMovementIndexByMediator[mediatorKey] = nextIdx;
  return options[nextIdx];
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
    /jalan singkat|jeda berdiri/i.test(targetLower) &&
    /jalan|berdiri|koridor/i.test(planLower)
  ) {
    matches = true;
  }

  const note = matches
    ? "SESUAI dengan JENIS_GERAK"
    : `TIDAK SESUAI (Target: "${targetJenisGerak}", Model: "${actionPlan.slice(0, 70)}...")`;

  return { matches, note };
}

export interface AuditReport {
  unverifiedNumbers: string[];
  unverifiedActivityClaims: string[];
  hasRepeatedSentences: boolean;
  repeatedSentences: string[];
}

/**
 * Pengecekan pasca-jawaban:
 * 1. Angka+satuan (jam/menit) yang tidak ada di input user, di allowedRanges, atau di JENIS_GERAK.
 * 2. Klaim aktivitas ("sudah cukup aktif", "aktivitas intensif") saat datanya null/tidak ada.
 * 3. Deteksi kalimat rekomendasi yang diulang dua kali.
 */
export function auditResponse(
  diagnosisSummary: string,
  actionPlan: string,
  userInput: string,
  allowedRanges: AllowedRanges,
  jenisGerak: string,
  hasSedentaryData: boolean,
  hasMvpaData: boolean
): AuditReport {
  const fullText = `${diagnosisSummary} ${actionPlan}`;

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
    if (/\b(?:sudah\s+cukup\s+aktif|cukup\s+aktif|aktivitas\s+intensif)\b/i.test(fullText)) {
      unverifiedActivityClaims.push("Klaim aktif/intensif tanpa data gerak");
    }
  }
  if (!hasSedentaryData) {
    if (/\b(?:duduk\s+cukup\s+lama|sudah\s+beraktivitas\s+cukup\s+lama)\b/i.test(fullText)) {
      unverifiedActivityClaims.push("Klaim durasi duduk tanpa angka jam duduk");
    }
  }

  // 3. Deteksi kalimat rekomendasi yang diulang dua kali
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
    hasRepeatedSentences: repeatedSentences.length > 0,
    repeatedSentences,
  };
}
