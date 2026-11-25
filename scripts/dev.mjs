#!/usr/bin/env node
import { execFileSync, spawn } from "node:child_process";

const isWindows = process.platform === "win32";
const npmCmd = isWindows ? "npm.cmd" : "npm";

console.log("\n=======================================================");
console.log(`🚀 Menjalankan CampusFlow Fullstack (Backend & Frontend) [${process.platform}]`);
console.log("=======================================================\n");

const backend = spawn(npmCmd, ["--prefix", "backend", "run", "dev"], {
  stdio: "inherit",
  shell: isWindows,
});

const frontend = spawn(npmCmd, ["--prefix", "frontend", "run", "dev"], {
  stdio: "inherit",
  shell: isWindows,
});

function killChildTree(child) {
  if (!child || child.killed || !child.pid) return;
  try {
    if (isWindows) {
      execFileSync("taskkill", ["/pid", String(child.pid), "/T", "/F"], { stdio: "ignore" });
    } else {
      child.kill("SIGTERM");
    }
  } catch {
    // Abaikan jika proses sudah berhenti
  }
}

let shuttingDown = false;
function cleanup() {
  if (shuttingDown) return;
  shuttingDown = true;
  console.log("\n🛑 Menghentikan server CampusFlow...");
  killChildTree(backend);
  killChildTree(frontend);
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

