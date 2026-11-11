import assert from "node:assert/strict";
import test from "node:test";
import {
  buildDeterministicFallbackInsight,
  checkOllamaStatus,
  computeCoachConstraints,
  evaluateClinicalRuleFlags,
  generateClinicalWellbeingInsight,
  type Telemetry7DaysInput,
} from "./ollamaCoach.ts";

const sampleSleepDeficitTelemetry: Telemetry7DaysInput = {
  today: {
    totalSedentaryHours: 5.5,
    totalMvpaMinutes: 30,
    mvpaPerSedentaryRatio: 5.45,
    sleepHours: 5.5,
    sleepQualityScore: 2,
    pss4TotalScore: 10,
    triadPillarsMet: 1,
  },
  history7Days: [],
};

test("buildDeterministicFallbackInsight mengidentifikasi SLEEP_MEDIATION_DEFICIT saat tidur kurang & stres tinggi", () => {
  const res = buildDeterministicFallbackInsight(sampleSleepDeficitTelemetry);
  assert.equal(res.dominantMediator, "SLEEP_MEDIATION_DEFICIT");
  assert.match(res.scientificCitationNote, /Mu et al\.|Wang et al\./);
});

test("buildDeterministicFallbackInsight mengidentifikasi SEDENTARY_OVERLOAD saat duduk >= 9 jam", () => {
  const res = buildDeterministicFallbackInsight({
    today: {
      totalSedentaryHours: 9.5,
      totalMvpaMinutes: 15,
      mvpaPerSedentaryRatio: 1.58,
      sleepHours: 7.5,
      sleepQualityScore: 4,
      pss4TotalScore: 6,
      triadPillarsMet: 1,
    },
    history7Days: [],
  });

  assert.equal(res.dominantMediator, "SEDENTARY_OVERLOAD");
  assert.match(res.scientificCitationNote, /Barbosa et al\.|Su et al\./);
});

test("buildDeterministicFallbackInsight mengembalikan OPTIMAL_BALANCE saat semua pilar aman", () => {
  const res = buildDeterministicFallbackInsight({
    today: {
      totalSedentaryHours: 5.0,
      totalMvpaMinutes: 35,
      mvpaPerSedentaryRatio: 7.0,
      sleepHours: 7.5,
      sleepQualityScore: 4,
      pss4TotalScore: 4,
      triadPillarsMet: 3,
    },
    history7Days: [],
  });

  assert.equal(res.dominantMediator, "OPTIMAL_BALANCE");
});

test("generateClinicalWellbeingInsight memanggil endpoint /api/chat Ollama lokal dan memvalidasi JSON", async () => {
  let calledUrl = "";
  let calledBody: Record<string, unknown> = {};

  const mockFetch = (async (input: string | URL | Request, init?: RequestInit) => {
    calledUrl = String(input);
    calledBody = JSON.parse(String(init?.body ?? "{}"));
    return new Response(
      JSON.stringify({
        message: {
          content: JSON.stringify({
            dominantMediator: "SLEEP_MEDIATION_DEFICIT",
            diagnosisSummary: "Durasi tidur Anda kurang dari 7 jam dan stres PSS-4 meningkat.",
            isotemporalActionPlan: "Jalan cepat 20 menit sore ini pukul 16.30 di sekitar kampus.",
            recommendedMetsToday: 240,
            scientificCitationNote: "Sesuai mediasi tidur Mu et al. (2024).",
          }),
        },
      }),
      { status: 200, headers: { "Content-Type": "application/json" } }
    );
  }) as typeof fetch;

  const result = await generateClinicalWellbeingInsight(sampleSleepDeficitTelemetry, mockFetch);
  assert.match(calledUrl, /\/api\/chat$/);
  assert.equal(calledBody.stream, false);
  assert.equal(result.source, "OLLAMA_LOCAL");
  assert.equal(result.insight.dominantMediator, "SLEEP_MEDIATION_DEFICIT");
});

test("generateClinicalWellbeingInsight jatuh ke CLINICAL_FALLBACK saat Ollama lokal offline", async () => {
  const offlineFetch = (async () => {
    throw new Error("connect ECONNREFUSED 127.0.0.1:11434");
  }) as typeof fetch;

  const result = await generateClinicalWellbeingInsight(sampleSleepDeficitTelemetry, offlineFetch);
  assert.equal(result.source, "CLINICAL_FALLBACK");
  assert.equal(result.insight.dominantMediator, "SLEEP_MEDIATION_DEFICIT");
});

test("checkOllamaStatus melaporkan status model lokal dari /api/tags dan menangani kondisi offline", async () => {
  const onlineFetch = (async () =>
    new Response(
      JSON.stringify({
        models: [
          { name: "campusflow-coach:latest" },
          { name: "qwen2.5:3b" },
        ],
      }),
      { status: 200, headers: { "Content-Type": "application/json" } }
    )) as typeof fetch;

  const onlineStatus = await checkOllamaStatus(onlineFetch);
  assert.equal(onlineStatus.reachable, true);
  assert.equal(onlineStatus.modelInstalled, true);
  assert.deepEqual(onlineStatus.availableModels, [
    "campusflow-coach:latest",
    "qwen2.5:3b",
  ]);

  const offlineFetch = (async () => {
    throw new Error("ECONNREFUSED");
  }) as typeof fetch;
  const offlineStatus = await checkOllamaStatus(offlineFetch);
  assert.equal(offlineStatus.reachable, false);
  assert.equal(offlineStatus.modelInstalled, false);
});

test("evaluateClinicalRuleFlags memisahkan batas sedentary <= 6 jam vs prioritas defisit tidur", () => {
  const lowMvpaNotSedentary = evaluateClinicalRuleFlags({
    totalSedentaryHours: 4.5,
    totalMvpaMinutes: 10,
    mvpaPerSedentaryRatio: 2.22,
    sleepHours: 7.5,
    sleepQualityScore: 4,
    pss4TotalScore: 5,
    triadPillarsMet: 2,
  });
  assert.equal(lowMvpaNotSedentary.sedentaryOverload, false);
  assert.equal(lowMvpaNotSedentary.lowMvpaVolume, true);
  assert.equal(lowMvpaNotSedentary.priorityMediator, "LOW_MVPA_VOLUME");

  const overlapPriority = evaluateClinicalRuleFlags({
    totalSedentaryHours: 9.2,
    totalMvpaMinutes: 12,
    mvpaPerSedentaryRatio: 1.3,
    sleepHours: 5.0,
    sleepQualityScore: 1,
    pss4TotalScore: 13,
    triadPillarsMet: 0,
  });
  assert.equal(overlapPriority.sleepDeficit, true);
  assert.equal(overlapPriority.sedentaryOverload, true);
  assert.equal(overlapPriority.priorityMediator, "SLEEP_MEDIATION_DEFICIT");
});

test("evaluateClinicalRuleFlags memisahkan pss4 null (belum check-in) dan mendeteksi eskalasi darurat", () => {
  const missingCheckIn = evaluateClinicalRuleFlags({
    totalSedentaryHours: 4.0,
    totalMvpaMinutes: 10,
    mvpaPerSedentaryRatio: 2.5,
    sleepHours: null,
    sleepQualityScore: null,
    pss4TotalScore: null,
    triadPillarsMet: 0,
  });
  assert.equal(missingCheckIn.missingDailyCheckIn, true);
  assert.equal(missingCheckIn.escalationFlag, false);
  assert.equal(missingCheckIn.dominantMediator, "LOW_MVPA_VOLUME");

  const fallbackMissing = buildDeterministicFallbackInsight({
    today: {
      totalSedentaryHours: 4.0,
      totalMvpaMinutes: 10,
      mvpaPerSedentaryRatio: 2.5,
      sleepHours: null,
      sleepQualityScore: null,
      pss4TotalScore: null,
      triadPillarsMet: 0,
    },
    history7Days: [],
  });
  assert.match(fallbackMissing.diagnosisSummary, /check-in/i);

  const distressByNotes = evaluateClinicalRuleFlags(
    {
      totalSedentaryHours: 5.0,
      totalMvpaMinutes: 35,
      mvpaPerSedentaryRatio: 7.0,
      sleepHours: 7.5,
      sleepQualityScore: 4,
      pss4TotalScore: 6,
      triadPillarsMet: 3,
    },
    { userNotes: "Hari ini cemas berlebihan dan terasa tidak sanggup belajar" }
  );
  assert.equal(distressByNotes.escalationFlag, true);
  assert.deepEqual(distressByNotes.flags, []);
  assert.equal(distressByNotes.dominantMediator, "OPTIMAL_BALANCE");
});

test("computeCoachConstraints & guardrails mengunci dominantMediator, allowedRanges, dan batas skip -40%", async () => {
  const constraints = computeCoachConstraints("LOW_MVPA_VOLUME", false, [
    { isCompleted: false, recommendedMetsToday: 220 },
    { isCompleted: false, recommendedMetsToday: 220 },
    { isCompleted: false, recommendedMetsToday: 220 },
  ]);
  assert.equal(constraints.skipAdaptation.applied, true);
  assert.equal(constraints.skipAdaptation.consecutiveSkips, 3);
  assert.ok(constraints.allowedRanges.metsRange[0] >= Math.round(220 * 0.6));

  // Mock LLM sengaja mengembalikan mediator salah & METs di luar rentang -> wajib dikunci guardrail
  const rogueFetch = (async () =>
    new Response(
      JSON.stringify({
        message: {
          content: JSON.stringify({
            dominantMediator: "SEDENTARY_OVERLOAD",
            diagnosisSummary: "Bebanmu berat hari ini.",
            isotemporalActionPlan: "Lari kencang 45 menit sekarang.",
            recommendedMetsToday: 900,
            scientificCitationNote: "Wu & Zhou (2024) mendukung relaksasi.",
          }),
        },
      }),
      { status: 200, headers: { "Content-Type": "application/json" } }
    )) as typeof fetch;

  const guarded = await generateClinicalWellbeingInsight(
    {
      today: {
        totalSedentaryHours: 5.0,
        totalMvpaMinutes: 35,
        mvpaPerSedentaryRatio: 7.0,
        sleepHours: 7.0,
        sleepQualityScore: 3,
        pss4TotalScore: 12,
        triadPillarsMet: 3,
      },
      history7Days: [],
    },
    rogueFetch
  );

  assert.equal(guarded.escalationFlag, true);
  assert.equal(guarded.insight.dominantMediator, "EXAM_ACUTE_STRESS");
  assert.ok(guarded.insight.recommendedMetsToday <= 160);
  assert.match(guarded.insight.diagnosisSummary, /konselor/i);
  assert.doesNotMatch(guarded.insight.isotemporalActionPlan, /lari kencang/i);
});

