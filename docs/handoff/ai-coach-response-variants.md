# AI Coach API Response Variants & Frontend Integration Guide

> **Dokumen Handoff untuk Tim Frontend**  
> **Status Endpoint:** `POST /api/v1/ai-coach/generate` (atau `/ai-coach/generate`)  
> **Tujuan:** Menjelaskan secara lengkap kontrak API, skema request/response, alur klarifikasi proaktif (*clarification flow*), dan alur pemilihan opsi gerak (*movement choice flow*) agar frontend (`CoachView.tsx`) terintegrasi secara mulus dan aman dari *runtime error*.

---

## 1. Skema Request Body `POST /ai-coach/generate`

Endpoint menerima payload JSON dengan tiga field opsional:

```typescript
interface GenerateCoachRequestBody {
  /** Catatan bebas atau keluhan dari pengguna (maksimal 500 karakter). */
  notes?: string;

  /**
   * Pilihan balasan klarifikasi ketika server sebelumnya meminta klarifikasi proaktif.
   * Nilai yang diterima: "1" | "2" | "3" | "4" | "SKIP" | "lewati"
   */
  clarificationChoice?: string;

  /**
   * Pilihan opsi gerakan yang dipilih pengguna dari movementOptions giliran sebelumnya.
   * Nilai yang diterima: "A" | "B" | "C" atau teks nama gerakan.
   */
  movementChoice?: string;
}
```

---

## 2. Ringkasan Varian Respons

| Varian | HTTP Status | Kondisi Pemicu | Ciri Utama Payload |
|---|---|---|---|
| **1. Normal Coaching Insight** | `201 Created` | Input pengguna memiliki konteks keluhan spesifik (misal: "pegal habis nugas 8 jam", "kurang tidur semalam") atau merupakan balasan klarifikasi/pilihan gerak. | Mengandung data insight (`dominantMediator`, `diagnosisSummary`, `isotemporalActionPlan`), `movementOptions` (array 2-3 pilihan), dan `recommendedMetsToday` (number). |
| **2. Proactive Clarification** | `200 OK` | Input pengguna berupa keluhan fisik/mental yang sangat umum tanpa konteks pemicu (contoh: "capek banget", "lemes", "mager"). | Tidak memanggil LLM demi mencegah halusinasi data. Mengembalikan objek `clarification: { question, options }` untuk memandu user memilih konteks keluhan. |
| **3. Movement Choice Confirmation** | `201 Created` | Klien mengirimkan field `movementChoice` ("A" / "B" / "C") untuk mengonfirmasi gerakan yang ingin diambil dari giliran sebelumnya. | Menggunakan mediator dan telemetri giliran sebelumnya dari riwayat server, lalu menyusun action plan terfokus pada gerakan yang dipilih. |
| **4. Crisis Safety Bypass** | `201 Created` | Input pengguna terdeteksi memuat kata kunci distres berat, keputusasaan, atau ide menyakiti diri (*self-harm / suicide ideation*). | Tidak memanggil LLM (bypass keselamatan klinis). `escalationFlag: true`, `dominantMediator: "EXAM_ACUTE_STRESS"`, **TIDAK ADA** rekomendasi METs/olahraga (`recommendedMetsToday: null / omitted`), dan memuat rujukan darurat resmi (Kemenkes 119 ext 8, healing119.id). |

---

## 3. Alur Detail & Contoh Payload Tiap Skenario

### Skenario A: Input Keluhan Umum Tanpa Konteks (Memicu Proactive Clarification)

Pengguna mengirim: *"capek banget"*.

#### 1. Request dari Klien
```http
POST /ai-coach/generate HTTP/1.1
Content-Type: application/json
Authorization: Bearer <token>

{
  "notes": "capek banget"
}
```

#### 2. Respons Server (`200 OK`)
```json
{
  "success": true,
  "data": {
    "clarification": {
      "question": "Biar sarannya pas, capek atau lemesnya lebih karena apa?",
      "options": [
        { "id": "1", "label": "Badan pegal atau kaku (kebanyakan duduk/nugas/lab)" },
        { "id": "2", "label": "Ngantuk atau kurang tidur (begadang/tidur sedikit)" },
        { "id": "3", "label": "Habis olahraga atau aktivitas fisik berat" },
        { "id": "4", "label": "Pikiran penat, jenuh, atau stres (kuliah/tugas)" }
      ]
    }
  }
}
```

---

### Skenario B: Klien Membalas Pilihan Klarifikasi

Pengguna mengklik tombol opsi 3 (*"Habis olahraga atau aktivitas fisik berat"*).

#### 1. Request dari Klien
Klien menyertakan `clarificationChoice: "3"` (boleh juga menyertakan `notes` awal untuk rekap):
```http
POST /ai-coach/generate HTTP/1.1
Content-Type: application/json
Authorization: Bearer <token>

{
  "notes": "capek banget",
  "clarificationChoice": "3"
}
```

#### 2. Respons Server (`201 Created`)
Server menyelaraskan context choice ke mode pemulihan (Recovery Mode / `OPTIMAL_BALANCE`), memanggil LLM dengan guardrails, dan mengembalikan `movementOptions`:
```json
{
  "success": true,
  "data": {
    "id": "cly1234567890",
    "dominantMediator": "OPTIMAL_BALANCE",
    "diagnosisSummary": "Tubuhmu sedang dalam fase pemulihan setelah beraktivitas fisik berat hari ini, wajar jika energi terasa terkuras.",
    "isotemporalActionPlan": "Coba lakukan pemulihan aktif dengan peregangan pendinginan otot lembut dan rehidrasi cairan selama 10 menit sekarang.",
    "recommendedMetsToday": 180,
    "scientificCitationNote": "Sesuai prinsip pemulihan aktif dan keseimbangan gerak harian.",
    "generationSource": "OLLAMA_LOCAL",
    "model": "campusflow-coach:latest",
    "escalationFlag": false,
    "movementOptions": [
      "pemulihan aktif dengan peregangan pendinginan otot lembut dan rehidrasi cairan (tanpa olahraga tambahan)",
      "latihan napas rileks dan peregangan pendinginan statis untuk memulihkan otot yang sudah dipakai berolahraga",
      "peregangan santai dan jalan ringan untuk memelihara kebugaran harian"
    ],
    "createdAt": "2026-11-16T06:30:00.000Z"
  }
}
```

---

### Skenario C: Klien Memilih Opsi Gerak (`movementChoice`)

Setelah membaca respons di Skenario B (atau respons normal lainnya), user mengklik opsi B (*"latihan napas rileks..."*).

#### Bagaimana Konteks Disimpan & Diambil?
- **Penyimpanan di Server:** Setiap kali endpoint `/ai-coach/generate` berhasil menghasilkan insight, data disimpan ke tabel database `aiCoachingInsight`.
- **Pengambilan Konteks:** Ketika request baru memuat `movementChoice`, server secara otomatis membaca `recentInsights[0]` (insight terakhir pengguna). Server mengambil `dominantMediator` sebelumnya, lalu memetakan label `"A"`, `"B"`, atau `"C"` ke daftar `movementOptions` terkait.
- **Konsistensi Telemetri:** Data durasi duduk, tidur, dan aktivitas mahasiswa tetap diambil dari telemetri hari ini tanpa membangun ulang dari teks kosong.

#### 1. Request dari Klien
```http
POST /ai-coach/generate HTTP/1.1
Content-Type: application/json
Authorization: Bearer <token>

{
  "movementChoice": "B"
}
```

#### 2. Respons Server (`201 Created`)
Server mengunci `JENIS_GERAK` sesuai opsi B dan menghasilkan panduan tindakan yang terfokus:
```json
{
  "success": true,
  "data": {
    "id": "cly9876543210",
    "dominantMediator": "OPTIMAL_BALANCE",
    "diagnosisSummary": "Pilihan yang sangat tepat untuk menenangkan sistem saraf dan mengendurkan otot-otot yang tegang.",
    "isotemporalActionPlan": "Coba lakukan latihan napas rileks dan peregangan pendinginan statis untuk memulihkan otot selama 10 menit sekarang.",
    "recommendedMetsToday": 180,
    "scientificCitationNote": "Sesuai kerangka pemulihan aktif dan penurunan ketegangan fisik.",
    "generationSource": "OLLAMA_LOCAL",
    "model": "campusflow-coach:latest",
    "escalationFlag": false,
    "movementOptions": [
      "pemulihan aktif dengan peregangan pendinginan otot lembut dan rehidrasi cairan (tanpa olahraga tambahan)",
      "latihan napas rileks dan peregangan pendinginan statis untuk memulihkan otot yang sudah dipakai berolahraga",
      "peregangan santai dan jalan ringan untuk memelihara kebugaran harian"
    ],
    "createdAt": "2026-11-16T06:31:00.000Z"
  }
}
```

---

### Skenario D: Deteksi Krisis Emosional / Distres Berat (Crisis Safety Bypass)

Pengguna mengetik: *"aku udah nggak sanggup, mau bundir aja capek hidup"*.

#### 1. Request dari Klien
```http
POST /ai-coach/generate HTTP/1.1
Content-Type: application/json
Authorization: Bearer <token>

{
  "notes": "aku udah nggak sanggup, mau bundir aja capek hidup"
}
```

#### 2. Respons Server (`201 Created`)
- Model AI **tidak dipanggil** (bypass demi keamanan).
- `recommendedMetsToday` **tidak disertakan** (dilarang menganjurkan olahraga pada krisis).
- Memuat kontak darurat resmi.

```json
{
  "success": true,
  "data": {
    "id": "cly5555555555",
    "dominantMediator": "EXAM_ACUTE_STRESS",
    "diagnosisSummary": "Terima kasih sudah bertahan sampai titik ini dan mau menyampaikan apa yang kamu rasakan. Rasa lelah yang teramat sangat ini nyata, dan kamu tidak harus menanggung semuanya sendirian.",
    "isotemporalActionPlan": "Saat ini, tidak perlu memikirkan olahraga atau target aktivitas fisik apa pun. Cukup ambil napas pelan, istirahatkan tubuhmu, dan hubungi seseorang yang kamu percaya atau konselor.",
    "scientificCitationNote": "Protokol keselamatan kesehatan mental terpadu.",
    "generationSource": "CRISIS_SAFETY_BYPASS",
    "model": "campusflow-coach:latest",
    "escalationFlag": true,
    "createdAt": "2026-11-16T06:32:00.000Z"
  }
}
```

---

## 4. Panduan Implementasi di Komponen Frontend (`CoachView.tsx`)

```tsx
import React, { useState } from "react";

interface ClarificationOption {
  id: string;
  label: string;
}

interface ClarificationState {
  question: string;
  options: ClarificationOption[];
}

export const CoachChatPanel: React.FC = () => {
  const [inputText, setInputText] = useState("");
  const [clarification, setClarification] = useState<ClarificationState | null>(null);
  const [insight, setInsight] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  // 1. Mengirim pesan utama
  const handleSendMessage = async (text: string) => {
    setLoading(true);
    try {
      const res = await fetch("/api/v1/ai-coach/generate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
        body: JSON.stringify({ notes: text }),
      });

      const resJson = await res.json();

      // Cek varian Proactive Clarification (HTTP 200)
      if (res.status === 200 && resJson.data?.clarification) {
        setClarification(resJson.data.clarification);
        return;
      }

      // Varian normal / krisis (HTTP 201)
      if (resJson.success && resJson.data) {
        setInsight(resJson.data);
        setClarification(null);
      }
    } finally {
      setLoading(false);
    }
  };

  // 2. Membalas pertanyaan klarifikasi
  const handleSelectClarification = async (choiceId: string) => {
    setLoading(true);
    try {
      const res = await fetch("/api/v1/ai-coach/generate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
        body: JSON.stringify({
          notes: inputText,
          clarificationChoice: choiceId,
        }),
      });

      const resJson = await res.json();
      if (resJson.success && resJson.data) {
        setInsight(resJson.data);
        setClarification(null);
      }
    } finally {
      setLoading(false);
    }
  };

  // 3. Memilih opsi gerakan lanjutan
  const handleSelectMovementOption = async (optionLetter: string) => {
    setLoading(true);
    try {
      const res = await fetch("/api/v1/ai-coach/generate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
        body: JSON.stringify({
          movementChoice: optionLetter, // "A" | "B" | "C"
        }),
      });

      const resJson = await res.json();
      if (resJson.success && resJson.data) {
        setInsight(resJson.data);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="coach-container">
      {/* Jika backend meminta klarifikasi proaktif */}
      {clarification && (
        <div className="clarification-card p-4 rounded-xl border border-indigo-200 bg-indigo-50/50">
          <p className="font-semibold text-indigo-900 mb-3">{clarification.question}</p>
          <div className="flex flex-col gap-2">
            {clarification.options.map((opt) => (
              <button
                key={opt.id}
                onClick={() => handleSelectClarification(opt.id)}
                className="btn-clarification text-left p-3 rounded-lg bg-white border border-indigo-100 hover:border-indigo-300 shadow-sm"
              >
                <span className="font-bold mr-2 text-indigo-600">{opt.id}.</span>
                {opt.label}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Menampilkan Insight Coach */}
      {insight && (
        <div className="insight-card p-4 rounded-xl bg-white shadow-sm border border-gray-100">
          <p className="text-gray-800 mb-3">{insight.diagnosisSummary}</p>
          <p className="text-gray-900 font-medium mb-3">{insight.isotemporalActionPlan}</p>

          {/* GUARD PENTING: recommendedMetsToday */}
          {typeof insight.recommendedMetsToday === "number" && insight.recommendedMetsToday > 0 && (
            <div className="mets-badge inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800 mb-3">
              Target Aktivitas: {insight.recommendedMetsToday} METs-min
            </div>
          )}

          {/* Menampilkan pilihan gerak interaktif A / B / C */}
          {insight.movementOptions && insight.movementOptions.length > 0 && (
            <div className="movement-options-section mt-4 pt-4 border-t border-gray-100">
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
                Pilih gerakan yang ingin kamu ambil:
              </p>
              <div className="flex flex-col gap-2">
                {insight.movementOptions.map((opt: string, idx: number) => {
                  const letter = String.fromCharCode(65 + idx);
                  return (
                    <button
                      key={letter}
                      onClick={() => handleSelectMovementOption(letter)}
                      className="text-left text-sm p-2.5 rounded-lg border border-gray-200 hover:bg-emerald-50 hover:border-emerald-300 transition-colors"
                    >
                      <span className="font-bold text-emerald-700 mr-2">{letter})</span>
                      {opt}
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
```

---

## 5. Penanganan Error Konteks Kedaluwarsa (HTTP 400) & Rekomendasi Perilaku UI

### Kondisi Pemicu
Saat pengguna mengklik tombol opsi gerak (`movementChoice: "A" | "B" | "C"`), backend memeriksa riwayat insight terakhir milik pengguna:
1. Insight terakhir harus milik pengguna yang sedang terautentikasi (`userId` cocok).
2. Dibuat pada hari kalender yang sama (zona waktu `Asia/Jakarta`).
3. Berusia maksimal **30 menit** sejak waktu dibuat (`ageMinutes <= 30`).

Jika salah satu kondisi di atas tidak terpenuhi (misalnya pengguna membuka kembali aplikasi setelah lebih dari 30 menit atau keesokan harinya, lalu mengklik tombol opsi gerak lama), server akan mengembalikan HTTP 400:

```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Konteks giliran sebelumnya tidak ditemukan atau sudah kedaluwarsa (maksimal 30 menit pada hari yang sama). Silakan tuliskan kembali keluhanmu."
  }
}
```

### Rekomendasi Perilaku UI / UX (Frontend Best Practices)
1. **Jangan Tampilkan Kode Error Teknis**:  
   Hindari menampilkan dialog merah bertuliskan `"Error 400"` atau `"VALIDATION_ERROR"`. Mahasiswa tidak perlu melihat istilah teknis backend.
2. **Tampilkan Pesan Empatik yang Bersahabat**:  
   Tampilkan pesan bantuan bernada ramah dan alami di dalam alur chat atau di atas kolom input, contohnya:  
   > *"Sesi rekomendasi sebelumnya sudah lewat dari 30 menit nih. Biar sarannya tetap pas dengan kondisimu sekarang, yuk ceritakan lagi apa yang kamu rasakan!"*
3. **Nonaktifkan Tombol Opsi Lama**:  
   Ketika menerima respons 400 kedaluwarsa, segera sembunyikan atau beri status `disabled` pada tombol opsi gerakan lama (`movementOptions`) agar pengguna tidak mengkliknya berulang kali.
4. **Fokuskan Kembali Input Teks (*Auto-focus*)**:  
   Arahkan kursor / fokus keyboard kembali ke kolom teks chat (`notes input`) dan gulir (*scroll*) tampilan ke bawah agar mahasiswa langsung terdorong mengetikkan keluhan atau kondisinya saat ini.

