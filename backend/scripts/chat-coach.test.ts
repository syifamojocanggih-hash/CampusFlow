import assert from "node:assert/strict";
import test from "node:test";
import {
  detectDistressKeywords,
  getNextMovementOption,
  extractSedentaryHours,
  extractSleepHours,
  auditResponse,
  CLARIFICATION_PROMPT_TEXT,
  CRISIS_RESPONSE_TEXT,
} from "../src/services/coachShared.ts";
import { processChatCoachInput } from "./chat-coach.ts";

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
        });

        assert.match(
          res.formattedOutput,
          /Capeknya lebih ke badan, mata, atau pikiran\?/,
          "Harus menampilkan klarifikasi ramah alih-alih penolakan"
        );
      });
