#!/usr/bin/env node
/**
 * Skrip Verifikasi Koneksi Live Backend CampusFlow (End-to-End Smoke Test)
 * Menguji seluruh modul REST API + CORS origin frontend (http://localhost:5174).
 */

const BASE_URL = (process.env.CAMPUSFLOW_API_URL || "http://localhost:4000/api/v1").replace(/\/$/, "");
const FRONTEND_ORIGIN = process.env.FRONTEND_ORIGIN || "http://localhost:5174";

const results = [];

async function check(name, fn) {
  const start = Date.now();
  try {
    const detail = await fn();
    results.push({ name, ok: true, ms: Date.now() - start, detail });
  } catch (err) {
    results.push({ name, ok: false, ms: Date.now() - start, detail: err.message || String(err) });
  }
}

async function req(path, options = {}, token = null) {
  const headers = {
    Origin: FRONTEND_ORIGIN,
    ...(options.body && !(options.body instanceof FormData) ? { "Content-Type": "application/json" } : {}),
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...(options.headers || {}),
  };
  const res = await fetch(`${BASE_URL}${path}`, { ...options, headers });
  const json = await res.json().catch(() => ({}));
  return { res, json };
}

async function main() {
  let token = null;

  await check("1. Health Check & CORS (Origin 5174)", async () => {
    const { res, json } = await req("/health");
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const allowOrigin = res.headers.get("access-control-allow-origin");
    if (allowOrigin !== FRONTEND_ORIGIN) {
      throw new Error(`CORS mismatch: expected ${FRONTEND_ORIGIN}, got ${allowOrigin}`);
    }
    return `status=${json.data.status}, CORS=${allowOrigin}`;
  });

  await check("2. Auth Demo Login (POST /auth/demo)", async () => {
    const { res, json } = await req("/auth/demo", { method: "POST" });
    if (!res.ok || !json.data?.token) throw new Error(`HTTP ${res.status}`);
    token = json.data.token;
    return `user=${json.data.user.email}`;
  });

  await check("3. User Profile (GET /users/me)", async () => {
    const { res, json } = await req("/users/me", {}, token);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return `name=${json.data.name}, xp=${json.data.xpPoints}`;
  });

  await check("4. Dashboard Triad (GET /dashboard/triad?days=14)", async () => {
    const { res, json } = await req("/dashboard/triad?days=14", {}, token);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return `history=${json.data.history.length}d, pillars=${json.data.today.triadPillarsMet}/3`;
  });

  await check("5. Academic Schedule & Stress Analysis (GET /schedule & /stress-analysis)", async () => {
    const s1 = await req("/schedule", {}, token);
    const s2 = await req("/schedule/stress-analysis", {}, token);
    if (!s1.res.ok || !s2.res.ok) throw new Error(`HTTP ${s1.res.status}/${s2.res.status}`);
    return `courses=${s1.json.data.length}, totalSks=${s2.json.data.summary.totalSks}`;
  });

  await check("6. Burnout Today & History (GET /burnout/today & /history)", async () => {
    const b1 = await req("/burnout/today", {}, token);
    const b2 = await req("/burnout/history?days=14", {}, token);
    if (!b1.res.ok || !b2.res.ok) throw new Error(`HTTP ${b1.res.status}/${b2.res.status}`);
    return `todayIndex=${b1.json.data.burnoutIndex} (${b1.json.data.status}), history=${b2.json.data.count}d`;
  });

  await check("7. Active Break Today & History (GET /active-break/today & /history)", async () => {
    const a1 = await req("/active-break/today", {}, token);
    const a2 = await req("/active-break/history?days=14", {}, token);
    if (!a1.res.ok || !a2.res.ok) throw new Error(`HTTP ${a1.res.status}/${a2.res.status}`);
    return `todayVerified=${a1.json.data.verifiedCount}, historyTotal=${a2.json.data.totalSessions}`;
  });

  await check("8. Wellbeing Today & History (GET /wellbeing/today & /history)", async () => {
    const w1 = await req("/wellbeing/today", {}, token);
    const w2 = await req("/wellbeing/history?days=14", {}, token);
    if (!w1.res.ok || !w2.res.ok) throw new Error(`HTTP ${w1.res.status}/${w2.res.status}`);
    return `checkedInToday=${w1.json.data.checkedInToday}, history=${w2.json.data.count}d`;
  });

  await check("9. Clinical Assessments PSS-10 (GET /assessments)", async () => {
    const { res, json } = await req("/assessments", {}, token);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return `assessments=${json.data.length}`;
  });

  await check("10. Physical Activities & Sedentary Sessions (GET /activities & /sedentary/sessions)", async () => {
    const p1 = await req("/activities", {}, token);
    const p2 = await req("/sedentary/sessions", {}, token);
    if (!p1.res.ok || !p2.res.ok) throw new Error(`HTTP ${p1.res.status}/${p2.res.status}`);
    return `activities=${p1.json.data.items.length} (${p1.json.data.summary.totalMets} METs), sedentary=${p2.json.data.length}`;
  });

  await check("11. AI Coach Status, Latest, & History (GET /ai-coach/*)", async () => {
    const c1 = await req("/ai-coach/status", {}, token);
    const c2 = await req("/ai-coach/latest", {}, token);
    const c3 = await req("/ai-coach/history?limit=5", {}, token);
    if (!c1.res.ok || !c2.res.ok || !c3.res.ok) {
      throw new Error(`HTTP ${c1.res.status}/${c2.res.status}/${c3.res.status}`);
    }
    return `ollamaReachable=${c1.json.data.reachable} (${c1.json.data.configuredModel}), latestMediator=${c2.json.data?.dominantMediator ?? "none"}, history=${c3.json.data.length}`;
  });

  await check("12. Web Push VAPID Public Key (GET /notifications/vapid-public-key)", async () => {
    const { res, json } = await req("/notifications/vapid-public-key", {}, token);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return `configured=${json.data.configured}`;
  });

  console.log(`\n=== HASIL VERIFIKASI LIVE BACKEND (${BASE_URL}) ===`);
  for (const r of results) {
    console.log(`${r.ok ? "✔" : "✖"} ${r.name} (${r.ms}ms) -> ${r.detail}`);
  }

  const failed = results.filter((r) => !r.ok);
  console.log(`\nTotal: ${results.length - failed.length}/${results.length} lolos.`);
  if (failed.length > 0) process.exit(1);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
