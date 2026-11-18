#!/usr/bin/env node
/**
 * Mentahan Starter Script — Uji Koneksi API Membaca PDF KRS (CampusFlow)
 *
 * Cara pakai:
 *   1. Pastikan server backend aktif: npm run dev:backend (default http://localhost:4000)
 *   2. Jalankan dengan PDF contoh bawaan (preview saja):
 *      node backend/scripts/krs-pdf-api-starter.mjs
 *   3. Jalankan dengan file PDF KRS asli milikmu:
 *      node backend/scripts/krs-pdf-api-starter.mjs ./path/ke/KRS_Semester.pdf
 *   4. Tambahkan --confirm untuk langsung menyimpan hasil ke database + hitung ulang Burnout Index:
 *      node backend/scripts/krs-pdf-api-starter.mjs ./path/ke/KRS_Semester.pdf --confirm
 *   5. Opsional kirim API Key Gemini kustom:
 *      GEMINI_API_KEY="AIza..." node backend/scripts/krs-pdf-api-starter.mjs
 */

import fs from "node:fs";
import path from "node:path";

const BASE_URL = (process.env.CAMPUSFLOW_API_URL || "http://localhost:4000/api/v1").replace(/\/$/, "");
const GEMINI_API_KEY = process.env.GEMINI_API_KEY || "";
const args = process.argv.slice(2);
const shouldConfirm = args.includes("--confirm");
const pdfPathArg = args.find((a) => !a.startsWith("--"));

/**
 * Membangkitkan file PDF 1.4 minimal yang valid secara struktur berisi teks jadwal KRS contoh.
 * Berguna untuk mengetes koneksi API end-to-end tanpa perlu mencari file PDF terlebih dahulu.
 */
function buildSampleKrsPdfBuffer() {
  const lines = [
    "KARTU RENCANA STUDI (KRS) MAHASISWA",
    "Senin 08:00 - 10:30 Algoritma dan Struktur Data 3 SKS",
    "Senin 13:00 - 15:00 Praktikum Algoritma dan Struktur Data 1 SKS",
    "Selasa 09:00 - 11:30 Sistem Basis Data 3 SKS",
    "Rabu 08:00 - 10:30 Jaringan Komputer 3 SKS",
    "Kamis 13:00 - 15:30 Praktikum Pemrograman Web 2 SKS",
  ];

  const escapedText = lines
    .map((line, i) => `(${line.replace(/[()\\]/g, "\\$&")}) Tj 0 ${i === 0 ? -24 : -18} Td`)
    .join("\n");

  const streamContent = `BT\n/F1 11 Tf\n50 750 Td\n${escapedText}\nET`;
  const objects = [
    "1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n",
    "2 0 obj\n<< /Type /Pages /Kids [3 0 R] /Count 1 >>\nendobj\n",
    "3 0 obj\n<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Contents 4 0 R /Resources << /Font << /F1 5 0 R >> >> >>\nendobj\n",
    `4 0 obj\n<< /Length ${Buffer.byteLength(streamContent, "utf8")} >>\nstream\n${streamContent}\nendstream\nendobj\n`,
    "5 0 obj\n<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>\nendobj\n",
  ];

  let pdf = "%PDF-1.4\n";
  const offsets = [0];
  for (const obj of objects) {
    offsets.push(Buffer.byteLength(pdf, "utf8"));
    pdf += obj;
  }
  const xrefOffset = Buffer.byteLength(pdf, "utf8");
  pdf += `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n`;
  for (let i = 1; i <= objects.length; i++) {
    pdf += `${String(offsets[i]).padStart(10, "0")} 00000 n \n`;
  }
  pdf += `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xrefOffset}\n%%EOF\n`;
  return Buffer.from(pdf, "utf8");
}

async function main() {
  console.log(`\n[1/3] Login akun demo ke ${BASE_URL}/auth/demo ...`);
  const loginRes = await fetch(`${BASE_URL}/auth/demo`, { method: "POST" });
  if (!loginRes.ok) {
    throw new Error(`Gagal login demo (HTTP ${loginRes.status}): ${await loginRes.text()}`);
  }
  const loginJson = await loginRes.json();
  const token = loginJson?.data?.token;
  if (!token) throw new Error("Token JWT tidak ditemukan pada respons login demo.");
  console.log(`      Berhasil login sebagai: ${loginJson.data.user.name} (${loginJson.data.user.email})`);

  let pdfBuffer;
  let filename = "sample-krs.pdf";
  if (pdfPathArg) {
    const resolved = path.resolve(pdfPathArg);
    pdfBuffer = fs.readFileSync(resolved);
    filename = path.basename(resolved);
    console.log(`\n[2/3] Mengunggah file PDF KRS lokal: ${resolved} (${pdfBuffer.length} bytes)...`);
  } else {
    pdfBuffer = buildSampleKrsPdfBuffer();
    console.log(`\n[2/3] Mengunggah Sample PDF KRS bawaan (${pdfBuffer.length} bytes) ke /schedule/upload ...`);
  }

  const formData = new FormData();
  formData.append("file", new Blob([pdfBuffer], { type: "application/pdf" }), filename);

  const uploadHeaders = { Authorization: `Bearer ${token}` };
  if (GEMINI_API_KEY) {
    uploadHeaders["x-gemini-api-key"] = GEMINI_API_KEY;
  }

  const uploadRes = await fetch(`${BASE_URL}/schedule/upload`, {
    method: "POST",
    headers: uploadHeaders,
    body: formData,
  });

  const uploadJson = await uploadRes.json();
  if (!uploadRes.ok) {
    console.error("Gagal ekstraksi PDF KRS:", JSON.stringify(uploadJson, null, 2));
    process.exit(1);
  }

  console.log(`      Sumber Parser : ${uploadJson.data.source}`);
  console.log(`      Jumlah Matkul : ${uploadJson.data.extractedCount}`);
  console.log("      Preview Hasil :");
  console.table(uploadJson.data.items);

  if (!shouldConfirm) {
    console.log(
      "\n[3/3] Mode Preview selesai (database belum diubah). Jalankan ulang dengan flag --confirm untuk menyimpan & hitung ulang Burnout Index.\n"
    );
    return;
  }

  console.log(`\n[3/3] Mengonfirmasi jadwal ke ${BASE_URL}/schedule/confirm ...`);
  const confirmRes = await fetch(`${BASE_URL}/schedule/confirm`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      schedules: uploadJson.data.items,
      replaceExisting: true,
    }),
  });

  const confirmJson = await confirmRes.json();
  if (!confirmRes.ok) {
    console.error("Gagal konfirmasi jadwal:", JSON.stringify(confirmJson, null, 2));
    process.exit(1);
  }

  console.log(`      Tersimpan     : ${confirmJson.data.savedCount} mata kuliah`);
  console.log("      Burnout Index Terbaru Hari Ini:");
  console.log(JSON.stringify(confirmJson.data.updatedBurnout, null, 2));
}

main().catch((err) => {
  console.error("[Starter Error]", err.message || err);
  process.exit(1);
});
