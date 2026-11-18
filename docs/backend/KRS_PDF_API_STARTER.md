# Mentahan Integrasi API Pembaca PDF KRS (Smart Academic Planner)

Dokumen ini berisi template siap pakai (*starter*) untuk menghubungkan aplikasi Frontend (React/PWA) maupun pengujian lokal (cURL / Node.js) ke endpoint pembaca **PDF KRS CampusFlow** yang terintegrasi dengan **Google Gemini API** (serta *fallback* parser lokal otomatis saat offline).

---

## 1. Alur Koneksi 2 Tahap (Preview → Konfirmasi)

```
[ File PDF KRS (.pdf, maks 5 MB) ]
                │
                ▼
  1. POST /api/v1/schedule/upload   (atau /api/academic-schedule/upload)
     • Header: Authorization: Bearer <JWT>
     • Header Opsional: x-gemini-api-key: <GEMINI_KEY> (default baca backend/.env)
     • Body: multipart/form-data (field "file")
     • Hasil: Preview JSON mata kuliah + ringkasan beban stres (TIDAK commit DB)
                │
                ▼
  [ Mahasiswa review / koreksi SKS, hari, jam, atau jenis teori/praktikum di UI ]
                │
                ▼
  2. POST /api/v1/schedule/confirm  (atau /api/academic-schedule/confirm)
     • Header: Authorization: Bearer <JWT>, Content-Type: application/json
     • Body: { "schedules": [...], "replaceExisting": true }
     • Hasil: Tersimpan ke tabel AcademicSchedule + Burnout Index hari ini otomatis ter-update!
```

---

## 2. Mentahan Siap Pakai di Frontend React (`frontend/src/lib/krsPdfClient.ts`)

Modul siap pakai sudah tersedia di `frontend/src/lib/krsPdfClient.ts` dan juga terintegrasi di `api` (`frontend/src/lib/api.ts`):

```tsx
import { useState } from "react";
import { api } from "@/lib/api";
import type { ExtractedKrsCourse } from "@/lib/krsPdfClient";

export function KrsUploaderExample() {
  const [previewItems, setPreviewItems] = useState<ExtractedKrsCourse[]>([]);
  const [statusMsg, setStatusMsg] = useState("");

  // Tahap 1: Upload PDF -> Preview hasil baca
  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setStatusMsg("Membaca dokumen PDF KRS...");
    try {
      const res = await api.uploadKrsPdfPreview(file);
      setPreviewItems(res.data.items);
      setStatusMsg(`Berhasil mengekstrak ${res.data.extractedCount} mata kuliah (${res.data.source}).`);
    } catch (err) {
      setStatusMsg(err instanceof Error ? err.message : "Gagal membaca PDF.");
    }
  }

  // Tahap 2: Konfirmasi & Simpan ke Database + Auto-Update Burnout Index
  async function handleConfirm() {
    const res = await api.confirmAcademicSchedules(previewItems, true);
    setStatusMsg(
      `Tersimpan ${res.data.savedCount} matkul! Burnout Index hari ini: ${res.data.updatedBurnout.burnoutIndex} (${res.data.updatedBurnout.status})`
    );
  }

  return (
    <div>
      <input type="file" accept="application/pdf" onChange={handleFileChange} />
      <p>{statusMsg}</p>
      {previewItems.length > 0 && (
        <button onClick={handleConfirm}>Konfirmasi & Simpan Jadwal</button>
      )}
    </div>
  );
}
```

---

## 3. Mentahan Vanilla JavaScript / Fetch API

```js
// 1. Upload PDF KRS (Preview)
const formData = new FormData();
formData.append("file", pdfFileInput.files[0]);

const uploadRes = await fetch("http://localhost:4000/api/v1/schedule/upload", {
  method: "POST",
  headers: {
    Authorization: `Bearer ${jwtToken}`,
    // Opsional jika tidak ingin menggunakan GEMINI_API_KEY di backend/.env:
    // "x-gemini-api-key": "AIzaSy...",
  },
  body: formData,
});
const { data: preview } = await uploadRes.json();

// 2. Konfirmasi & Commit ke DB + Hitung Ulang Burnout Index
const confirmRes = await fetch("http://localhost:4000/api/v1/schedule/confirm", {
  method: "POST",
  headers: {
    Authorization: `Bearer ${jwtToken}`,
    "Content-Type": "application/json",
  },
  body: JSON.stringify({
    schedules: preview.items,
    replaceExisting: true,
  }),
});
const { data: saved } = await confirmRes.json();
console.log("Updated Burnout Index:", saved.updatedBurnout);
```

---

## 4. Mentahan cURL & Script Uji Cepat CLI

### Menjalankan Script Starter Bawaan (Otomatis Login Demo + Sample PDF):
```bash
# Mode Preview saja (menggunakan Sample PDF KRS bawaan)
node backend/scripts/krs-pdf-api-starter.mjs

# Uji menggunakan file PDF KRS milikmu sendiri
node backend/scripts/krs-pdf-api-starter.mjs ./KRS_Semester_5.pdf

# Uji lengkap Preview -> Confirm ke Database + Update Burnout Index
node backend/scripts/krs-pdf-api-starter.mjs ./KRS_Semester_5.pdf --confirm
```

### Contoh cURL Langsung:
```bash
# 1. Ambil JWT Token demo
TOKEN=$(curl -s -X POST http://localhost:4000/api/v1/auth/demo | node -e "const d=JSON.parse(require('fs').readFileSync(0,'utf8'));console.log(d.data.token)")

# 2. Upload PDF KRS (Preview)
curl -X POST http://localhost:4000/api/v1/schedule/upload \
  -H "Authorization: Bearer $TOKEN" \
  -F "file=@./KRS_Semester_5.pdf;type=application/pdf"
```

---

## 5. Penyiapan `GEMINI_API_KEY` di Backend

Salin `backend/.env.example` menjadi `backend/.env`, lalu isi kunci API Gemini Anda (gratis dari [Google AI Studio](https://aistudio.google.com/apikey)):

```env
GEMINI_API_KEY="AIzaSy..."
GEMINI_MODEL="gemini-1.5-flash"
```

> **Catatan:** Jika `GEMINI_API_KEY` dikosongkan, sistem otomatis memakai *Local PDF Text Parser Fallback* (`pdf-parse`) agar pengembangan lokal tetap dapat berjalan tanpa kuota eksternal.
