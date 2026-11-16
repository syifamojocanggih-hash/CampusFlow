#!/usr/bin/env node
import { spawn } from "node:child_process";

console.log("\n=======================================================");
console.log("🚀 Menjalankan CampusFlow Fullstack (Backend & Frontend)");
console.log("=======================================================\n");

const backend = spawn("npm", ["--prefix", "backend", "run", "dev"], {
  stdio: "inherit",
  shell: true,
});

const frontend = spawn("npm", ["--prefix", "frontend", "run", "dev"], {
  stdio: "inherit",
  shell: true,
});

function cleanup() {
  console.log("\n🛑 Menghentikan server CampusFlow...");
  backend.kill("SIGTERM");
  frontend.kill("SIGTERM");
  process.exit(0);
}

process.on("SIGINT", cleanup);
process.on("SIGTERM", cleanup);

backend.on("exit", (code) => {
  if (code !== 0 && code !== null) {
    console.error(`[Backend] berhenti dengan kode ${code}`);
  }
});

frontend.on("exit", (code) => {
  if (code !== 0 && code !== null) {
    console.error(`[Frontend] berhenti dengan kode ${code}`);
  }
});
