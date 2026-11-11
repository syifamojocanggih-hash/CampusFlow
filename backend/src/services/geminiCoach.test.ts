import assert from "node:assert/strict";
import test from "node:test";
import { buildDeterministicFallbackInsight } from "./geminiCoach.ts";

test("buildDeterministicFallbackInsight mengidentifikasi SLEEP_MEDIATION_DEFICIT saat tidur kurang & stres tinggi", () => {
  const res = buildDeterministicFallbackInsight({
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
  });

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
