import assert from "node:assert/strict";
import test from "node:test";
import {
  detectDistressKeywords,
  getNextMovementOption,
  extractSedentaryHours,
  extractSleepHours,
  auditResponse,
  CLARIFICATION_PROMPT_TEXT,
  CLARIFICATION_WITH_OPTIONS_TEXT,
  CRISIS_RESPONSE_TEXT,
  NEUTRAL_CAUSE_FALLBACK_TEXT,
  NEUTRAL_CAUSE_FALLBACK_VARIANTS,
  deduplicateSentences,
  deduplicateResponse,
  detectRecentlyExercised,
  detectClarificationChoice,
  isBareGeneralComplaint,
  PROACTIVE_CLARIFICATION_QUESTION,
  PROACTIVE_CLARIFICATION_OPTIONS,
  PROACTIVE_CLARIFICATION_TEXT,
  MOVEMENT_OPTIONS_BY_MEDIATOR,
} from "../src/services/coachShared.ts";
import { buildChatCoachPayload, processChatCoachInput } from "./chat-coach.ts";

  test("detectDistressKeywords: positif mendeteksi ungkapan distres berat, keputusasaan, dan ide bunuh diri/self-harm (gaul & formal)", () => {
    const positives = [
      "aku udah nggak sanggup, capek sama semuanya",
      "pengen mati aja rasanya",
      "mau bundir",
      "rasanya mau menyerah",
      "udah ga kuat lagi",
      "putus asa",
      "pengen cutting",
      "capek hidup rasanya",
      "pengen ngilang selamanya",
      "mending mati daripada kuliah kayak gini",
      "nyakitin diri sendiri",
      "aku mau mengakhiri hidup",
      "sudah hopeless menghadapi kuliah",
    ];

    for (const text of positives) {
      assert.equal(
        detectDistressKeywords(text),
        true,
        `Harusnya terdeteksi krisis: "${text}"`
      );
    }
  });

    test("detectDistressKeywords: negatif tidak mendeteksi kiasan/hiperbola sehari-hari (mati rasa, mati gaya, ngantuk mau mati)", () => {
      const negatives = [
        "ngantuk banget mau mati rasanya",
        "capek sampai mati rasa",
        "tugas bikin mati gaya",
        "capek banget",
        "pegal habis nugas 8 jam",
        "males gerak seharian",
        "besok UTS deg-degan banget",
        "begadang terus, tidur cuma 4 jam",
        "tidur cuma 3 jam, mata perih",
        "pusing ngerjain kalkulus",
      ];

      for (const text of negatives) {
        assert.equal(
          detectDistressKeywords(text),
          false,
          `Harusnya TIDAK terdeteksi krisis: "${text}"`
        );
      }
    });

    test("rotasi JENIS_GERAK: opsi bergantian dan tidak sama dua kali berturut-turut dalam sesi", () => {
      const opt1 = getNextMovementOption("SEDENTARY_OVERLOAD");
      const opt2 = getNextMovementOption("SEDENTARY_OVERLOAD");
      assert.notEqual(opt1, opt2, "Dua giliran berurutan SEDENTARY_OVERLOAD harus berbeda");

      const optSleep1 = getNextMovementOption("SLEEP_MEDIATION_DEFICIT");
      const optSleep2 = getNextMovementOption("SLEEP_MEDIATION_DEFICIT");
      assert.notEqual(optSleep1, optSleep2, "Dua giliran berurutan SLEEP_MEDIATION_DEFICIT harus berbeda");

      const optMvpa1 = getNextMovementOption("LOW_MVPA_VOLUME");
      const optMvpa2 = getNextMovementOption("LOW_MVPA_VOLUME");
      assert.notEqual(optMvpa1, optMvpa2, "Dua giliran berurutan LOW_MVPA_VOLUME harus berbeda");
    });

    test("ekstraksi jam duduk (extractSedentaryHours): akurat mengekstrak durasi jam dan null bila tidak disebut", () => {
      assert.equal(extractSedentaryHours("pegal habis nugas 8 jam"), 8);
      assert.equal(extractSedentaryHours("duduk 6.5 jam di lab"), 6.5);
      assert.equal(extractSedentaryHours("aku duduk di depan laptop 5 jam"), 5);
      assert.equal(extractSedentaryHours("capek banget"), null);
      assert.equal(extractSedentaryHours("begadang terus, tidur cuma 4 jam"), null);
      assert.equal(extractSedentaryHours("tidur cuma 3 jam, mata perih"), null);
    });

    test("ekstraksi jam tidur (extractSleepHours): menangkap pola 'tidur 4 jam', 'tidur cuma 4 jam', 'begadang sampai jam 3'", () => {
      assert.equal(extractSleepHours("tidur 4 jam"), 4);
      assert.equal(extractSleepHours("tidur cuma 4 jam"), 4);
      assert.equal(extractSleepHours("begadang terus, tidur cuma 4 jam"), 4);
      assert.equal(extractSleepHours("tidur cuma 3 jam, mata perih"), 3);
      assert.equal(extractSleepHours("cuma tidur 5 jam"), 5);
      assert.equal(extractSleepHours("begadang sampai jam 3"), 4); // 7 - 3 = 4 jam
      assert.equal(extractSleepHours("begadang terus sampai jam 4"), 3); // 7 - 4 = 3 jam
      assert.equal(extractSleepHours("pegal habis nugas 8 jam"), null);
      assert.equal(extractSleepHours("capek banget"), null);
    });

      test("auditResponse: mendeteksi angka tidak terverifikasi, klaim aktivitas tanpa data, dan kalimat berulang", () => {
        const audit = auditResponse(
          "Kamu sudah cukup aktif hari ini dan melakukan aktivitas intensif 25 menit.",
          "Coba jalan cepat 15 menit sekarang. Coba jalan cepat 15 menit sekarang.",
          "males gerak seharian",
          { durationMinutesRange: [15, 20], metsRange: [160, 220] },
          "jalan cepat 15-20 menit di area kampus",
          false, // hasSedentaryData = false
          false  // hasMvpaData = false
        );

        assert.ok(audit.unverifiedNumbers.includes("25 menit"), "Harus mendeteksi 25 menit tidak sah");
        assert.ok(audit.unverifiedActivityClaims.length > 0, "Harus mendeteksi klaim aktif tanpa data");
        assert.equal(audit.hasRepeatedSentences, true, "Harus mendeteksi kalimat rekomendasi berulang");
      });

      test("jalur krisis: input krisis tidak memanggil model dan langsung mengembalikan CRISIS_RESPONSE_TEXT dengan healing119.id", async () => {
        let modelCalled = false;
        const mockCaller = async () => {
          modelCalled = true;
          throw new Error("Model tidak boleh dipanggil!");
        };

        const res = await processChatCoachInput("aku udah nggak sanggup, capek sama semuanya", {
          callModelFn: mockCaller as any,
        });

        assert.equal(modelCalled, false, "Model tidak boleh dipanggil pada jalur krisis!");
        assert.equal(res.escalationFlag, true);
        assert.equal(res.dominantMediator, "EXAM_ACUTE_STRESS");
        assert.match(res.formattedOutput, /healing119\.id/);
        assert.match(res.formattedOutput, /Hotline 119/);
      });

      test("klarifikasi proaktif: keluhan umum tanpa konteks tidak memanggil model dan menyajikan 4 opsi klarifikasi", async () => {
        let modelCalled = false;
        const mockCaller = async () => {
          modelCalled = true;
          throw new Error("Model tidak boleh dipanggil!");
        };

        const res = await processChatCoachInput("capek banget", {
          callModelFn: mockCaller as any,
        });

        assert.equal(modelCalled, false, "Model tidak boleh dipanggil saat input keluhan umum tanpa konteks");
        assert.equal(res.needsClarification, true);
        assert.equal(res.source, "PROACTIVE_CLARIFICATION");
        assert.match(res.formattedOutput, /1\.\s*A\)\s*Badan\s+pegal/i);
        assert.match(res.formattedOutput, /2\.\s*B\)\s*Ngantuk/i);
        assert.match(res.formattedOutput, /3\.\s*C\)\s*Habis\s+olahraga/i);
        assert.match(res.formattedOutput, /4\.\s*D\)\s*Pikiran/i);
        assert.match(res.formattedOutput, /lewati/i);
      });

      test("fallback input pendek: saat model menolak out-of-scope, dikirim ulang dengan directive INPUT_DALAM_CAKUPAN", async () => {
        let callCount = 0;
        let lastDirectives: string[] = [];

        const mockCaller = async (messages: Array<{ role: string; content: string }>) => {
          callCount += 1;
          const body = JSON.parse(messages[0].content);
          lastDirectives = body.activeDirectives;

          if (callCount === 1) {
            return {
              insight: {
                dominantMediator: "LOW_MVPA_VOLUME" as const,
                diagnosisSummary: "Pertanyaan ini di luar cakupan CampusFlow Coach.",
                isotemporalActionPlan: "Tidak ada rencana aksi.",
                recommendedMetsToday: 0,
                scientificCitationNote: "Di luar cakupan.",
              },
              model: "campusflow-coach",
            };
          }

          return {
            insight: {
              dominantMediator: "LOW_MVPA_VOLUME" as const,
              diagnosisSummary: "Tubuhmu lelah setelah aktivitas padat hari ini.",
              isotemporalActionPlan: "Coba jalan cepat 15 menit sekarang di sekitar kos.",
              recommendedMetsToday: 180,
              scientificCitationNote: "Zhang et al. (2024)",
            },
            model: "campusflow-coach",
          };
        };

        const res = await processChatCoachInput("capek banget", {
          callModelFn: mockCaller as any,
          hasClarified: true,
        });

        assert.equal(callCount, 2, "Harus melakukan retry sekali saat keluhan in-scope ditolak");
        assert.ok(
          lastDirectives.some((d) => d.includes("INPUT_DALAM_CAKUPAN")),
          "Harus menyisipkan directive INPUT_DALAM_CAKUPAN"
        );
        assert.match(res.formattedOutput, /jalan cepat 15 menit sekarang/);
      });

      test("fallback input pendek: bila setelah retry masih out-of-scope, tampilkan klarifikasi ramah alih-alih penolakan", async () => {
        const persistentOutOfScope = async () => ({
          insight: {
            dominantMediator: "LOW_MVPA_VOLUME" as const,
            diagnosisSummary: "Pertanyaan ini di luar cakupan CampusFlow Coach.",
            isotemporalActionPlan: "Tidak ada rencana aksi karena di luar cakupan.",
            recommendedMetsToday: 0,
            scientificCitationNote: "Di luar cakupan.",
          },
          model: "campusflow-coach",
        });

        const res = await processChatCoachInput("capek banget", {
          callModelFn: persistentOutOfScope as any,
          hasClarified: true,
        });

        assert.match(
          res.formattedOutput,
          /Capeknya lebih ke arah mana\?/,
          "Harus menampilkan klarifikasi ramah dengan opsi A/B/C alih-alih penolakan"
        );
      });

      test("auditResponse: mendeteksi klaim penyebab tidak berdasar (tidur/duduk/aktivitas padat)", () => {
        // Contoh 1: "masalah dengan tidurmu" untuk input "capek banget"
        const auditSleep = auditResponse(
          "Tampaknya ada masalah dengan tidurmu hari ini.",
          "Coba jalan cepat 15 menit.",
          "capek banget",
          { durationMinutesRange: [15, 20], metsRange: [160, 220] },
          "jalan cepat 15-20 menit",
          false,
          false,
          false // hasSleepData = false
        );
        assert.ok(
          auditSleep.unverifiedCauseClaims.some((c) => c.includes("masalah tidur")),
          "Harus mendeteksi klaim masalah tidur tanpa data"
        );

        // Contoh 2: "sudah cukup lama duduk" untuk input "males gerak seharian"
        const auditSitting = auditResponse(
          "Kamu sudah cukup lama duduk hari ini.",
          "Coba peregangan 10 menit.",
          "males gerak seharian",
          { durationMinutesRange: [10, 20], metsRange: [170, 240] },
          "peregangan 10-20 menit",
          false, // hasSedentaryData = false
          false,
          false
        );
        assert.ok(
          auditSitting.unverifiedCauseClaims.some((c) => c.includes("durasi duduk")),
          "Harus mendeteksi klaim durasi duduk tanpa data"
        );

        // Contoh 3: "aktivitas padat hari ini" tanpa data
        const auditActivity = auditResponse(
          "Kamu merasa lelah setelah aktivitas padat hari ini.",
          "Coba jalan santai 15 menit.",
          "capek banget",
          { durationMinutesRange: [15, 20], metsRange: [160, 220] },
          "jalan santai 15-20 menit",
          false,
          false,
          false,
          null // detectedActivity = null
        );
        assert.ok(
          auditActivity.unverifiedCauseClaims.some((c) => c.includes("aktivitas padat")),
          "Harus mendeteksi klaim aktivitas padat tanpa data"
        );
      });

      test("deduplicateSentences dan deduplicateResponse: menghapus kalimat persis berulang", () => {
        const textWithDups =
          "Coba jalan cepat 15 menit sekarang. Coba jalan cepat 15 menit sekarang. Ambil jeda sebentar.";
        const dedupedText = deduplicateSentences(textWithDups);
        assert.equal(
          dedupedText,
          "Coba jalan cepat 15 menit sekarang. Ambil jeda sebentar."
        );

        const summary = "Tubuhmu lelah hari ini. Coba jalan santai 15 menit.";
        const plan = "Coba jalan santai 15 menit.";
        const dedupedCross = deduplicateResponse(summary, plan);
        assert.equal(dedupedCross.summary, "Tubuhmu lelah hari ini. Coba jalan santai 15 menit.");
        assert.equal(dedupedCross.removedDuplicates.length, 1);
      });

      test("detectRecentlyExercised: positif dan negatif", () => {
        assert.equal(
          detectRecentlyExercised(
            "capek banget sebadan padahal sebelum ngelaprak 2 jam di kampus sudah olahraga"
          ),
          true
        );
        assert.equal(detectRecentlyExercised("habis workout tadi pagi"), true);
        assert.equal(detectRecentlyExercised("tadi pagi sudah jogging 30 menit"), true);
        assert.equal(detectRecentlyExercised("sudah olahraga tapi masih lemas"), true);
        assert.equal(detectRecentlyExercised("capek banget"), false);
        assert.equal(detectRecentlyExercised("males gerak seharian"), false);
        assert.equal(detectRecentlyExercised("begadang terus, tidur cuma 4 jam"), false);
      });

      test("modular assembly fallback: mengganti kalimat penjelasan dengan varian netral jika klaim penyebab karangan terdeteksi", async () => {
        const callerWithHallucination = async () => ({
          insight: {
            dominantMediator: "LOW_MVPA_VOLUME" as const,
            diagnosisSummary: "Tampaknya ada masalah dengan tidurmu hari ini.",
            isotemporalActionPlan: "Coba jalan cepat 15 menit sekarang.",
            recommendedMetsToday: 180,
            scientificCitationNote: "Zhang et al. (2024)",
          },
          model: "campusflow-coach",
        });

        const res = await processChatCoachInput("capek banget", {
          callModelFn: callerWithHallucination as any,
          hasClarified: true,
        });

        assert.ok(
          NEUTRAL_CAUSE_FALLBACK_VARIANTS.includes(res.insight.diagnosisSummary),
          "Harus menggunakan salah satu varian NEUTRAL_CAUSE_FALLBACK_VARIANTS di insight.diagnosisSummary"
        );
        assert.match(
          res.formattedOutput,
          /Aku belum tahu pasti|Penyebab pastinya|Tanpa tahu persis/,
          "Harus memuat varian kalimat netral pada tampilan"
        );
        assert.match(res.formattedOutput, /jalan cepat 15 menit/);
      });

      test("detectClarificationChoice: mengenali opsi A, B, C, D, angka 1-4, kata kunci, dan lewati", () => {
        assert.deepEqual(detectClarificationChoice("A"), { isChoice: true, choice: "A" });
        assert.deepEqual(detectClarificationChoice("opsi a"), { isChoice: true, choice: "A" });
        assert.deepEqual(detectClarificationChoice("badan pegal"), { isChoice: true, choice: "A" });
        assert.deepEqual(detectClarificationChoice("1"), { isChoice: true, choice: "A" });
        assert.deepEqual(detectClarificationChoice("B"), { isChoice: true, choice: "B" });
        assert.deepEqual(detectClarificationChoice("mata lelah"), { isChoice: true, choice: "B" });
        assert.deepEqual(detectClarificationChoice("ngantuk"), { isChoice: true, choice: "B" });
        assert.deepEqual(detectClarificationChoice("2"), { isChoice: true, choice: "B" });
        assert.deepEqual(detectClarificationChoice("C"), { isChoice: true, choice: "C" });
        assert.deepEqual(detectClarificationChoice("olahraga"), { isChoice: true, choice: "C" });
        assert.deepEqual(detectClarificationChoice("3"), { isChoice: true, choice: "C" });
        assert.deepEqual(detectClarificationChoice("D"), { isChoice: true, choice: "D" });
        assert.deepEqual(detectClarificationChoice("pikiran stres"), { isChoice: true, choice: "D" });
        assert.deepEqual(detectClarificationChoice("4"), { isChoice: true, choice: "D" });
        assert.deepEqual(detectClarificationChoice("lewati"), { isChoice: true, choice: "SKIP" });
        assert.deepEqual(detectClarificationChoice(""), { isChoice: true, choice: "SKIP" });
        assert.deepEqual(detectClarificationChoice("halo"), { isChoice: false, choice: null });
      });

      test("rotasi varian NEUTRAL_CAUSE_FALLBACK_VARIANTS: tidak mengandung kata capek dan berotasi", () => {
        for (const variant of NEUTRAL_CAUSE_FALLBACK_VARIANTS) {
          assert.doesNotMatch(
            variant.toLowerCase(),
            /\bcapek\b/,
            `Varian tidak boleh mengandung kata "capek": "${variant}"`
          );
        }
      });

      test("klarifikasi proaktif pilihan C: recovery mode OPTIMAL_BALANCE dengan directive SUDAH_OLAHRAGA", () => {
        const payload = buildChatCoachPayload("C");
        assert.equal(payload.dominantMediator, "OPTIMAL_BALANCE");
        assert.ok(payload.promptPayload.activeDirectives.some((d) => d.includes("SUDAH_OLAHRAGA")));
      });

      test("clinical rule: 2 jam nugas/laprak setelah olahraga menghasilkan OPTIMAL_BALANCE bukan SEDENTARY_OVERLOAD", () => {
        const payload = buildChatCoachPayload(
          "sebelum ngelaprak 2 jam di kampus sudah olahraga"
        );
        assert.equal(
          payload.dominantMediator,
          "OPTIMAL_BALANCE",
          "Duduk 2 jam tidak memenuhi batas klinis SEDENTARY_OVERLOAD (>= 6 jam) dan pilar olahraga tercapai"
        );
        assert.equal(payload.sedentaryHours, 2);
        assert.ok(payload.promptPayload.activeDirectives.some((d) => d.includes("SUDAH_OLAHRAGA")));
      });

      test("pilihan gerak di akhir jawaban: menyertakan 2-3 opsi gerak dan teks panduan memilih di terminal", async () => {
        const caller = async () => ({
          insight: {
            dominantMediator: "SEDENTARY_OVERLOAD" as const,
            diagnosisSummary: "Duduk 8 jam membuat otot kaku.",
            isotemporalActionPlan: "Lakukan peregangan 15 menit.",
            recommendedMetsToday: 200,
            scientificCitationNote: "Barbosa et al. (2024)",
          },
          model: "campusflow-coach",
        });

        const res = await processChatCoachInput("pegal habis nugas 8 jam", {
          callModelFn: caller as any,
        });

        assert.ok(res.movementOptions && res.movementOptions.length >= 2);
        assert.match(res.formattedOutput, /Pilihan gerak untukmu:/);
        assert.match(res.formattedOutput, /A\./);
        assert.match(res.formattedOutput, /B\./);
        assert.match(res.formattedOutput, /Ketik A\/B\/C untuk memilih, atau ketik bebas/);
      });
