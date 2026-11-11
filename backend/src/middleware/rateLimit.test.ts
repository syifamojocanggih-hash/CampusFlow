import assert from "node:assert/strict";
import test from "node:test";
import express from "express";
import { createRateLimiter } from "./rateLimit.ts";

test("createRateLimiter mengizinkan request di bawah batas lalu mengembalikan 429 JSON", async () => {
  const app = express();
  app.use(
    "/limited",
    createRateLimiter({ windowMs: 60_000, maxRequests: 2, keyPrefix: "unit-test" }),
    (_req, res) => {
      res.status(200).json({ ok: true });
    }
  );

  const server = app.listen(0);
  const address = server.address();
  const port = typeof address === "object" && address ? address.port : 0;
  const url = `http://127.0.0.1:${port}/limited`;

  try {
    const r1 = await fetch(url);
    assert.equal(r1.status, 200);

    const r2 = await fetch(url);
    assert.equal(r2.status, 200);

    const r3 = await fetch(url);
    const json3 = (await r3.json()) as { error: { code: string } };
    assert.equal(r3.status, 429);
    assert.equal(json3.error.code, "RATE_LIMITED");
    assert.ok(r3.headers.get("retry-after"));
  } finally {
    await new Promise<void>((resolve, reject) =>
      server.close((err) => (err ? reject(err) : resolve()))
    );
  }
});
