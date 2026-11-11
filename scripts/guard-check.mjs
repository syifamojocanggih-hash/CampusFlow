#!/usr/bin/env node
import { execFileSync } from "node:child_process";
import path from "node:path";

function runGit(args) {
  return execFileSync("git", args, { encoding: "utf8" }).trimEnd();
}

function refExists(ref) {
  try {
    execFileSync("git", ["rev-parse", "--verify", ref], { stdio: "ignore" });
    return true;
  } catch {
    return false;
  }
}

function isAncestor(ancestor, descendant) {
  try {
    execFileSync("git", ["merge-base", "--is-ancestor", ancestor, descendant], {
      stdio: "ignore",
    });
    return true;
  } catch {
    return false;
  }
}

function resolveDefaultBase() {
  const hasOriginMain = refExists("origin/main");
  const hasLocalMain = refExists("main");
  if (hasOriginMain && hasLocalMain) {
    // Jika local main lebih baru daripada origin/main (belum di-push), pakai main.
    // Jika origin/main lebih baru daripada local main (hasil fetch), pakai origin/main.
    return isAncestor("origin/main", "main") ? "main" : "origin/main";
  }
  return hasOriginMain ? "origin/main" : "main";
}

const args = process.argv.slice(2);
const branch = args[0] || runGit(["rev-parse", "--abbrev-ref", "HEAD"]);
const base = args[1] || resolveDefaultBase();
const headRef = args[2] || "HEAD";

const ROLE_CONFIG = {
  backend: {
    owner: "Syifa (@syifamojocanggih-hash)",
    requiredChangelogs: ["docs/changelogs/CHANGELOG_SYIFA.md"],
    defaultPrefixes: ["backend/", "docs/backend/", "docs/changelogs/CHANGELOG_SYIFA.md"],
  },
  frontend: {
    owner: "Tiara (@mutiaradewanda) / Ibra (@flyingdutchman)",
    requiredChangelogs: [
      "docs/changelogs/CHANGELOG_TIARA.md",
      "docs/changelogs/CHANGELOG_IBRA.md",
    ],
    defaultPrefixes: [
      "frontend/",
      "docs/frontend/",
      "docs/changelogs/CHANGELOG_TIARA.md",
      "docs/changelogs/CHANGELOG_IBRA.md",
    ],
  },
};

if (branch === "main" || branch.startsWith("release/") || branch.startsWith("hotfix/")) {
  console.log(`[guard-check] Branch '${branch}' adalah branch utama/rilis. Pemeriksaan dilewati.`);
  process.exit(0);
}

let roleKey = null;
if (branch === "backend" || branch.startsWith("backend/")) roleKey = "backend";
if (branch === "frontend" || branch.startsWith("frontend/")) roleKey = "frontend";

if (!roleKey) {
  console.error(`[guard-check] Nama branch '${branch}' tidak dikenali.`);
  console.error("Gunakan branch resmi: main, backend, atau frontend (atau sub-branch backend/*, frontend/*).");
  process.exit(1);
}

const config = ROLE_CONFIG[roleKey];
const diffOutput = runGit(["diff", "--name-only", `${base}...${headRef}`]);
const changedFiles = diffOutput
  .split(/\r?\n/)
  .map((line) => line.trim())
  .filter(Boolean);

if (changedFiles.length === 0) {
  console.log(`[guard-check] Tidak ada perubahan commit dibanding '${base}'. Lolos.`);
  process.exit(0);
}

const updatedChangelogs = changedFiles.filter((file) =>
  config.requiredChangelogs.includes(file)
);

if (updatedChangelogs.length === 0) {
  console.error("======================================================================");
  console.error("GAGAL [guard-check]: Changelog pribadi belum diperbarui!");
  console.error(`Branch  : ${branch} (${config.owner})`);
  console.error("Wajib   : Perbarui salah satu file changelog berikut sebelum push/PR:");
  for (const chg of config.requiredChangelogs) {
    console.error(`  - ${chg}`);
  }
  console.error("Aturan  : Setiap perubahan di CampusFlow wajib dicatat di Changelog");
  console.error("          pribadi masing-masing user agar riwayat jelas & anti-konflik.");
  console.error("======================================================================");
  process.exit(1);
}

const crossScopeFiles = changedFiles.filter(
  (file) => !config.defaultPrefixes.some((prefix) => file.startsWith(prefix))
);

if (crossScopeFiles.length === 0) {
  console.log(
    `[guard-check] OK: Semua perubahan (${changedFiles.length} file) berada di zona default '${branch}' dan changelog pribadi telah diperbarui.`
  );
  process.exit(0);
}

const addedChangelogLines = updatedChangelogs
  .map((chg) => {
    const patch = runGit(["diff", `${base}...${headRef}`, "--", chg]);
    return patch
      .split(/\r?\n/)
      .filter((line) => line.startsWith("+") && !line.startsWith("+++"))
      .map((line) => line.slice(1))
      .join("\n");
  })
  .join("\n");

const missingCrossLogs = crossScopeFiles.filter((file) => {
  const baseName = path.posix.basename(file);
  const hasCrossTag = addedChangelogLines.includes("[CROSS-SCOPE]");
  const mentionsFile =
    addedChangelogLines.includes(file) || addedChangelogLines.includes(baseName);
  return !(hasCrossTag && mentionsFile);
});

if (missingCrossLogs.length > 0) {
  console.error("======================================================================");
  console.error("GAGAL [guard-check]: Ditemukan perubahan lintas zona (Cross-Scope)");
  console.error("yang BELUM didokumentasikan di Changelog pribadi!");
  console.error("");
  console.error("File lintas zona yang belum tercatat:");
  for (const mf of missingCrossLogs) {
    console.error(`  - ${mf}`);
  }
  console.error("");
  console.error("Cara memperbaiki:");
  console.error(`1. Tambahkan entri di ${updatedChangelogs.join(" / ")}`);
  console.error("   dengan tag [CROSS-SCOPE], cantumkan path file di atas dan alasannya.");
  console.error(`2. Atau kembalikan file tersebut ke versi '${base}' jika tidak sengaja tersentuh:`);
  for (const mf of missingCrossLogs) {
    console.error(`   git checkout ${base} -- "${mf}"`);
  }
  console.error("======================================================================");
  process.exit(1);
}

console.log("======================================================================");
console.log("LOLOS DENGAN CATATAN [CROSS-SCOPE ADVISORY]");
console.log(`Branch '${branch}' mengubah file di luar zona default dan sudah`);
console.log("mencatatnya dengan tag [CROSS-SCOPE] di changelog pribadi:");
for (const cfile of crossScopeFiles) {
  console.log(`  - ${cfile}`);
}
console.log("Pastikan untuk mengoordinasikan file ini pada Pull Request ke main.");
console.log("======================================================================");
process.exit(0);
