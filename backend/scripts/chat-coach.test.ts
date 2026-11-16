import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
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
  detectMovementChoice,
  filterDirectiveLeakage,
  isBareGeneralComplaint,
  LATE_NIGHT_MOVEMENT_OPTIONS,
  MOVEMENT_OPTIONS_BY_MEDIATOR,
  PROACTIVE_CLARIFICATION_OPTIONS,
  PROACTIVE_CLARIFICATION_QUESTION,
  PROACTIVE_CLARIFICATION_TEXT,
  sanitizeDurationMinutes,
  stripLeadingConjunctions,
} from "../src/services/coachShared.ts";
import { buildChatCoachPayload, processChatCoachInput } from "./chat-coach.ts";
import { computeCoachStats } from "./coach-stats.ts";

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
        assert.match(res.formattedOutput, /1\.\s*Badan\s+pegal/i);
        assert.match(res.formattedOutput, /2\.\s*Ngantuk/i);
        assert.match(res.formattedOutput, /3\.\s*Habis\s+olahraga/i);
        assert.match(res.formattedOutput, /4\.\s*Pikiran/i);
        assert.doesNotMatch(res.formattedOutput, /1\.\s*A\)/);
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
          forcedJenisGerak: "jalan cepat 15 menit",
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

      test("detectClarificationChoice: mengenali opsi 1-4, kata kunci, dan lewati", () => {
        assert.deepEqual(detectClarificationChoice("1"), { isChoice: true, choice: "1" });
        assert.deepEqual(detectClarificationChoice("opsi 1"), { isChoice: true, choice: "1" });
        assert.deepEqual(detectClarificationChoice("badan pegal"), { isChoice: true, choice: "1" });
        assert.deepEqual(detectClarificationChoice("2"), { isChoice: true, choice: "2" });
        assert.deepEqual(detectClarificationChoice("mata lelah"), { isChoice: true, choice: "2" });
        assert.deepEqual(detectClarificationChoice("ngantuk"), { isChoice: true, choice: "2" });
        assert.deepEqual(detectClarificationChoice("3"), { isChoice: true, choice: "3" });
        assert.deepEqual(detectClarificationChoice("olahraga"), { isChoice: true, choice: "3" });
        assert.deepEqual(detectClarificationChoice("4"), { isChoice: true, choice: "4" });
        assert.deepEqual(detectClarificationChoice("pikiran stres"), { isChoice: true, choice: "4" });
        assert.deepEqual(detectClarificationChoice("lewati"), { isChoice: true, choice: "SKIP" });
        assert.deepEqual(detectClarificationChoice(""), { isChoice: true, choice: "SKIP" });
        assert.deepEqual(detectClarificationChoice("halo"), { isChoice: false, choice: null });
      });

      test("detectMovementChoice: mengenali opsi A, B, C", () => {
        assert.deepEqual(detectMovementChoice("A"), { isChoice: true, index: 0, letter: "A" });
        assert.deepEqual(detectMovementChoice("opsi b"), { isChoice: true, index: 1, letter: "B" });
        assert.deepEqual(detectMovementChoice("C"), { isChoice: true, index: 2, letter: "C" });
        assert.deepEqual(detectMovementChoice("1"), { isChoice: false, index: null, letter: null });
      });

      test("state machine movement: balasan 'B' saat pendingPrompt=movement memakai ulang payload lama (8 jam duduk dipertahankan)", async () => {
        let sentPayload: any = null;
        const caller = async (messages: any[]) => {
          sentPayload = JSON.parse(messages[0].content);
          return {
            insight: {
              dominantMediator: "SEDENTARY_OVERLOAD" as const,
              diagnosisSummary: "Duduk 8 jam nugas.",
              isotemporalActionPlan: "Jeda berdiri dan jalan singkat 15 menit.",
              recommendedMetsToday: 200,
              scientificCitationNote: "Barbosa et al. (2024)",
            },
            model: "campusflow-coach",
          };
        };

        const priorPayload: any = {
          activeDirectives: [
            "DATA_TIDAK_LENGKAP: jangan menyebut angka, durasi, atau tingkat aktivitas yang tidak ada di input user",
            "JENIS_GERAK: peregangan meja",
          ],
          clinicalRuleEvaluation: {
            dominantMediator: "SEDENTARY_OVERLOAD",
            priorityMediator: "SEDENTARY_OVERLOAD",
            flags: ["SEDENTARY_OVERLOAD"],
            escalationFlag: false,
            missingDailyCheckIn: true,
          },
          allowedRanges: { durationMinutesRange: [10, 20], metsRange: [170, 240] },
          skipAdaptation: { applied: false, consecutiveSkips: 0, previousRecommendedMets: null },
          currentTime: "23.40 WIB (malam)",
          timeOfDay: "malam",
          detectedActivity: "nugas",
          today: { totalSedentaryHours: 8 },
          history7Days: [],
          latestPss10Score: null,
          userNotes: "pegal habis nugas 8 jam",
        };

        const res = await processChatCoachInput("B", {
          callModelFn: caller as any,
          pendingPrompt: "movement",
          previousPayload: priorPayload,
          previousMeta: {
            dominantMediator: "SEDENTARY_OVERLOAD",
            escalationFlag: false,
            sleepHours: null,
            sedentaryHours: 8,
            detectedActivity: "nugas",
            allowedRanges: { durationMinutesRange: [10, 20], metsRange: [170, 240] },
            movementOptions: [
              "peregangan meja (fokus bahu, leher)",
              "jeda berdiri dari kursi dan jalan singkat di koridor",
              "peregangan tubuh lembut",
            ],
          },
        });

        assert.equal(res.dominantMediator, "SEDENTARY_OVERLOAD", "Mediator TIDAK boleh berubah ke SLEEP_MEDIATION_DEFICIT");
        assert.equal(res.sedentaryHours, 8, "Konteks 8 jam duduk harus dipertahankan");
        assert.equal(sentPayload.today.totalSedentaryHours, 8);
        assert.equal(sentPayload.userNotes, "B", "userNotes harus teks asli user");
        assert.equal(res.jenisGerak, "jeda berdiri dari kursi dan jalan singkat di koridor");
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

      test("klarifikasi proaktif pilihan 3: recovery mode OPTIMAL_BALANCE dengan directive SUDAH_OLAHRAGA", () => {
        const payload = buildChatCoachPayload("3", { pendingPrompt: "clarification" });
        assert.equal(payload.dominantMediator, "OPTIMAL_BALANCE");
        assert.ok(payload.promptPayload.activeDirectives.some((d) => d.includes("SUDAH_OLAHRAGA")));
        assert.ok(payload.promptPayload.activeDirectives.some((d) => d.includes("KONTEKS_PILIHAN")));
        assert.equal(payload.promptPayload.userNotes, "3", "userNotes harus teks asli");
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

      test("auditResponse: mendeteksi klaim emosi/stres palsu saat tidak ada di input user/data", () => {
        const ranges = { durationMinutesRange: [10, 20] as [number, number], metsRange: [150, 220] as [number, number] };
        // User memilih opsi 3 (habis olahraga), tapi model menyebut mengalami stres dan meredakan stres
        const report = auditResponse(
          "Rasanya kamu sedang mengalami stres yang cukup tinggi hari ini.",
          "Ini akan membantu kamu meredakan stres dan memulihkan energi.",
          "3",
          ranges,
          "pemulihan aktif 10-15 menit",
          false,
          false,
          false,
          null,
          { contextChoice: "3", dominantMediator: "OPTIMAL_BALANCE" }
        );

        assert.ok(
          report.unverifiedEmotionClaims.length > 0,
          "Harus menandai klaim emosi stres palsu"
        );
        assert.ok(
          report.unverifiedEmotionClaims.some((c) => /stres/i.test(c)),
          "Harus menyertakan kata stres di klaim emosi"
        );
      });

      test("filterDirectiveLeakage: menghapus kalimat kebocoran directive dan ketiadaan data", () => {
        const text =
          "Sepertinya kamu merasa kurang aktif hari ini. Meskipun tidak ada data tentang aktivitas fisik yang dilakukan, kita bisa mulai dengan gerakan relaksasi.";
        const filtered = filterDirectiveLeakage(text);
        assert.doesNotMatch(filtered, /tidak ada data/i);
        assert.match(filtered, /kurang aktif hari ini/i);
      });

      test("filterDirectiveLeakage: menghapus frasa kebocoran check-in harian pada jalur chat terminal", () => {
        // Kasus uji wajib: kalimat kebocoran check-in
        const sentence =
          "Meskipun kamu belum melakukan check-in harian, kita bisa mulai dengan langkah yang lebih ringan.";
        const filtered = filterDirectiveLeakage(sentence);
        assert.equal(filtered, "");

        const compound =
          "Kamu terlihat kurang aktif hari ini. Meskipun kamu belum melakukan check-in harian, kita bisa mulai dengan langkah yang lebih ringan.";
        const filteredCompound = filterDirectiveLeakage(compound);
        assert.equal(filteredCompound, "Kamu terlihat kurang aktif hari ini.");

        const checkinVariants = [
          "Jangan lupa check-in nanti ya.",
          "Kamu belum checkin hari ini.",
          "Silakan lengkapi check-in harianmu dulu.",
          "Karena belum melakukan check-in, mari kita mulai perlahan.",
        ];
        for (const variant of checkinVariants) {
          assert.equal(filterDirectiveLeakage(variant), "");
        }
      });

      test("sanitizeDurationMinutes: mengoreksi angka menit di actionPlan sesuai JENIS_GERAK dan allowedRanges", () => {
        const ranges = { durationMinutesRange: [10, 15] as [number, number], metsRange: [150, 220] as [number, number] };
        const action = "Coba lakukan peregangan ringan dan jalan santai selama 20 menit sekarang.";
        const jenisGerak = "peregangan relaksasi dan jalan pelan 10-15 menit";

        const res = sanitizeDurationMinutes(action, jenisGerak, ranges);
        assert.equal(res.replaced, true);
        assert.equal(
          res.sanitized,
          "Coba lakukan peregangan ringan dan jalan santai selama 10-15 menit sekarang."
        );
      });

      test("stripLeadingConjunctions: menghapus kata sambung kontras/sebab di awal kalimat yang berdiri sendiri", () => {
        // Kasus uji spesifik: "Namun, tidak perlu terburu-buru..."
        const testCase1 = "Namun, tidak perlu terburu-buru melakukan olahraga berat.";
        assert.equal(
          stripLeadingConjunctions(testCase1),
          "Tidak perlu terburu-buru melakukan olahraga berat."
        );

        const testCase2 = "Meskipun begitu, kamu bisa mencoba jalan santai di sekitar kos.";
        assert.equal(
          stripLeadingConjunctions(testCase2),
          "Kamu bisa mencoba jalan santai di sekitar kos."
        );

        const testCase3 = "Tetapi, luangkan waktu 5 menit untuk istirahat.";
        assert.equal(
          stripLeadingConjunctions(testCase3),
          "Luangkan waktu 5 menit untuk istirahat."
        );

        const testCase4 = "Karena itu, mari kita mulai perlahan.";
        assert.equal(
          stripLeadingConjunctions(testCase4),
          "Mari kita mulai perlahan."
        );

        const testCase5 = "Akan tetapi, tubuhmu butuh istirahat.";
        assert.equal(
          stripLeadingConjunctions(testCase5),
          "Tubuhmu butuh istirahat."
        );
      });

      test("template MOVEMENT_OPTIONS: tidak memuat kata berulang/dobel yang berurutan", () => {
        const duplicateWordRegex = /\b([a-zA-Z]{3,})\s+\1\b/i;

        const allOptions: string[] = [];
        for (const options of Object.values(MOVEMENT_OPTIONS_BY_MEDIATOR)) {
          allOptions.push(...options);
        }
        for (const options of Object.values(LATE_NIGHT_MOVEMENT_OPTIONS)) {
          allOptions.push(...options);
        }

        for (const option of allOptions) {
          assert.equal(
            duplicateWordRegex.test(option),
            false,
            `Template memuat kata dobel berurutan: "${option}"`
          );
          assert.doesNotMatch(
            option,
            /jalan santai santai/i,
            "Tidak boleh ada 'jalan santai santai'"
          );
          assert.doesNotMatch(
            option,
            /perjalanan singkat/i,
            "Gunakan 'jalan singkat' alih-alih 'perjalanan singkat'"
          );
        }
      });

      test("raw log recording: mencatat ke coach-raw.jsonl dan TIDAK mencatat pada jalur krisis", async () => {
        const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "coach-test-"));
        const tempLogFile = path.join(tempDir, "coach-raw.jsonl");

        try {
          // 1. Jalur krisis: tidak boleh menulis ke file log
          await processChatCoachInput("aku pengen mati aja rasanya, udah nggak sanggup", {
            logFilePath: tempLogFile,
          });
          assert.equal(fs.existsSync(tempLogFile), false, "Jalur krisis tidak boleh membuat log");

          // 2. Jalur non-krisis normal: mencatat entri log lengkap dengan flags
          const mockCaller = async () => ({
            insight: {
              dominantMediator: "SEDENTARY_OVERLOAD",
              diagnosisSummary:
                "Meskipun tidak ada data aktivitas fisikmu, kamu sudah duduk cukup lama. Namun, tidak perlu terburu-buru berolahraga.",
              isotemporalActionPlan:
                "Lakukan perjalanan singkat dan peregangan meja selama 25 menit sekarang.",
              recommendedMetsToday: 200,
              scientificCitationNote: "Panduan ergonomi duduk aktif.",
            },
          });

          await processChatCoachInput("pegal habis nugas 8 jam di depan laptop", {
            callModelFn: mockCaller as any,
            logFilePath: tempLogFile,
          });

          assert.equal(fs.existsSync(tempLogFile), true, "File log harus terbuat");
          const logLines = fs.readFileSync(tempLogFile, "utf-8").trim().split("\n");
          assert.equal(logLines.length, 1);

          const entry = JSON.parse(logLines[0]);
          assert.equal(entry.userInput, "pegal habis nugas 8 jam di depan laptop");
          assert.equal(entry.dominantMediator, "SEDENTARY_OVERLOAD");
          assert.ok(entry.rawModelResponse, "Harus memuat rawModelResponse");
          assert.ok(entry.finalResponse, "Harus memuat finalResponse");
          assert.ok(entry.rawAttempt1, "Harus memuat rawAttempt1");
          assert.ok(entry.rawModelResponse.diagnosisSummary.includes("Meskipun tidak ada data"));
          assert.doesNotMatch(
            entry.finalResponse.diagnosisSummary,
            /tidak ada data/i,
            "finalResponse tidak boleh memuat kebocoran directive"
          );
          // Pastikan flags tercatat
          assert.equal(typeof entry.flags.sentenceRemoved, "boolean");
          assert.equal(typeof entry.flags.conjunctionStripped, "boolean");
          assert.equal(typeof entry.flags.durationAdjusted, "boolean");
          assert.equal(typeof entry.flags.openingReplaced, "boolean");
          assert.equal(entry.flags.conjunctionStripped, true, "Harus menandai conjunctionStripped");

          // 3. Uji rekaman saat retry terjadi (rawAttempt1 dan rawAttempt2)
          let callCount = 0;
          const retryCaller = async () => {
            callCount++;
            if (callCount === 1) {
              return {
                insight: {
                  dominantMediator: "SEDENTARY_OVERLOAD",
                  diagnosisSummary: "Pertanyaan ini di luar cakupan CampusFlow Coach.",
                  isotemporalActionPlan: "Di luar cakupan.",
                  recommendedMetsToday: 0,
                  scientificCitationNote: "Out of scope.",
                },
              };
            }
            return {
              insight: {
                dominantMediator: "SEDENTARY_OVERLOAD",
                diagnosisSummary: "Badanmu terasa pegal setelah duduk lama.",
                isotemporalActionPlan: "Coba lakukan jalan singkat 10 menit sekarang.",
                recommendedMetsToday: 180,
                scientificCitationNote: "Sesuai kerangka kebugaran.",
              },
            };
          };

          await processChatCoachInput("pegal banget nih", {
            callModelFn: retryCaller as any,
            logFilePath: tempLogFile,
            hasClarified: true,
          });

          const updatedLogLines = fs.readFileSync(tempLogFile, "utf-8").trim().split("\n");
          assert.equal(updatedLogLines.length, 2);
          const retryEntry = JSON.parse(updatedLogLines[1]);
          assert.ok(retryEntry.rawAttempt1, "Harus mencatat rawAttempt1");
          assert.ok(retryEntry.rawAttempt2, "Harus mencatat rawAttempt2");
          assert.match(retryEntry.rawAttempt1.diagnosisSummary, /di luar cakupan/i);
          assert.match(retryEntry.rawAttempt2.diagnosisSummary, /pegal setelah duduk/i);
          assert.equal(retryEntry.flags.retryApplied, true);

          // 4. Uji coach-stats
          const stats = computeCoachStats(tempLogFile);
          assert.equal(stats.totalResponses, 2);
          assert.equal(stats.responsesNeedingRepair, 2);
          assert.equal(stats.repairPercentage, 100);
          assert.ok(stats.repairTypeRanking.length > 0);
        } finally {
          fs.rmSync(tempDir, { recursive: true, force: true });
        }
      });

      test("Mode chat tanpa check-in: jalur chat terminal mengirim missingDailyCheckIn=false dan tanpa directive BELUM_CHECKIN_HARIAN", async () => {
        const { promptPayload } = buildChatCoachPayload("males gerak seharian");
        assert.equal(
          promptPayload.clinicalRuleEvaluation.missingDailyCheckIn,
          false,
          "missingDailyCheckIn harus false pada payload chat terminal"
        );
        assert.equal(
          promptPayload.activeDirectives.some((d) => d.includes("BELUM_CHECKIN_HARIAN")),
          false,
          "activeDirectives tidak boleh memuat BELUM_CHECKIN_HARIAN"
        );

        const mockCaller = async () => ({
          insight: {
            dominantMediator: "SEDENTARY_OVERLOAD",
            diagnosisSummary: "Duduk terlalu lama membuat tubuh terasa lesu.",
            isotemporalActionPlan: "Lakukan jalan santai 10 menit.",
            recommendedMetsToday: 180,
            scientificCitationNote: "Panduan kebugaran.",
          },
        });

        const res = await processChatCoachInput("males gerak seharian", {
          callModelFn: mockCaller as any,
          hasClarified: true,
        });

        assert.doesNotMatch(
          res.formattedOutput,
          /check-?in/i,
          "Respons chat terminal tidak boleh memuat kata check-in"
        );
      });
