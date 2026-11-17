# CLINICAL_SCORING.md — Algoritma Skoring Klinis & Konstanta Jurnal

> **FILE TARGET:** `backend/src/services/clinicalScoring.ts`  
> **PENANGGUNG JAWAB:** Syifa (`@syifamojocanggih-hash` — branch `backend`)  
> **LANDASAN:** Martín-Rodríguez & González-Prieto (2026)

---

## 1. Konstanta Sistem Klinis

```ts
export const CLINICAL_CONSTANTS = {
  MAX_SAFE_SEDENTARY_HOURS: 9.0,          // Barbosa et al. (2024): OR cemas 1.37, depresi 1.61
  TARGET_MVPA_PER_SEDENTARY_HOUR: 25,     // Barbosa et al. (2024): <25 mnt/jam -> OR depresi 1.74
  ISOTEMPORAL_WORK_BOUT_MINS: 50,         // Su et al. (2022)
  ISOTEMPORAL_BREAK_MINS: 10,             // Rentang 5-15 mnt -> -0.13 PHQ-9 per 15 mnt
  TRIAD_PILLAR_1_MVPA_MINS: 30,           // Zhang et al. (2024) & Lin et al. (2024)
  TRIAD_PILLAR_2_SLEEP_MIN_HOURS: 7.0,
  TRIAD_PILLAR_2_SLEEP_MAX_HOURS: 9.0,
  TRIAD_PILLAR_3_MAX_SCREENTIME: 8.0,
  WEEKLY_MSE_TARGET_DAYS: 2,              // Ai et al. (2021) & Elliott et al. (2022)
  WEEKLY_TOTAL_METS_TARGET: 1500,         // MET-menit/minggu
  ACUTE_RELIEF_AEROBIC_MINS: 15,          // Wu & Zhou (2024): Exam Panic Button
  SLEEP_MEDIATION_WEIGHT: 0.41,           // Mu et al. (2024) & Wang et al. (2025)
} as const;
```

---

## 2. Rubrik Kuesioner Harian PSS-4 (Skala Likert 0–4)

Pilihan: `0 = Tidak Pernah`, `1 = Hampir Tidak Pernah`, `2 = Kadang-kadang`, `3 = Cukup Sering`, `4 = Sangat Sering`.

| Butir | Pertanyaan Baku (Adaptasi Indonesia) | Aturan Skoring |
|---|---|---|
| **Q1** | Hari ini, seberapa sering Anda merasa tidak mampu mengendalikan hal-hal penting dalam perkuliahan/hidup Anda? | Direct (`x`) |
| **Q2** | Hari ini, seberapa sering Anda merasa yakin terhadap kemampuan Anda dalam menangani masalah pribadi/tugas akademik? | **REVERSE (`4 - x`)** |
| **Q3** | Hari ini, seberapa sering Anda merasa bahwa segala sesuatunya berjalan sesuai dengan keinginan/rencana Anda? | **REVERSE (`4 - x`)** |
| **Q4** | Hari ini, seberapa sering Anda merasa kesulitan akademik menumpuk begitu tinggi sehingga Anda tidak mampu mengatasinya? | Direct (`x`) |

**Rumus:**
$$\text{PSS4\_Score} = q_1 + (4 - q_2) + (4 - q_3) + q_4 \quad \in [0, 16]$$

**Interpretasi Cutoff PSS-4 (Ambang Heuristik Produk):**
> *Catatan Metodologis:* Skala PSS-4 secara resmi tidak memiliki cutoff klinis baku universal dalam literatur psikometri. Ambang batas $\ge 8$ di bawah ini merupakan ambang heuristik internal produk CampusFlow untuk mendeteksi sinyal distres akademik awal dan memicu intervensi AI Coach secara terukur:
- `0 – 5` → `LOW` (Optimal)
- `6 – 7` → `MODERATE` (Waspada)
- `8 – 12` → `HIGH` (Stres Tinggi — memicu rekomendasi AI Coach)
- `13 – 16` → `SEVERE` (Stres Berat — memicu prioritas tinggi & opsi Exam/Stress Relief)

---

## 3. Rubrik Mingguan PSS-10 (Rentang 0–40)

- **Item Negatif (Direct `x`):** Item `1, 2, 3, 6, 9, 10` (indeks array `0, 1, 2, 5, 8, 9`).
- **Item Positif (Reverse `4 - x`):** Item `4, 5, 7, 8` (indeks array `3, 4, 6, 7`).
- **Kategori:** `0–13` (`LOW`), `14–26` (`MODERATE`), `27–40` (`SEVERE`).

---

## 4. Indeks Kualitas Tidur (Adaptasi PSQI) & 24-Hour Triad

- **Guideline Tidur Terpenuhi (Pilar 2):** `7.0 <= sleepHours <= 9.0` **DAN** `sleepQualityScore >= 3` (skala 1–5).
- **Guideline MVPA Terpenuhi (Pilar 1):** `totalMvpaMinutes >= 30`.
- **Guideline Sedentary/Screen Terpenuhi (Pilar 3):** `totalSedentaryHours < 9.0` **DAN** `nonAcademicScreenHours <= 8.0`.
- **`triadPillarsMet`:** Jumlah pilar terpenuhi (`0`, `1`, `2`, atau `3`).

---

## 5. Koefisien METs (IPAQ-SF)

| `ActivityIntensity` | Koefisien MET | Rumus `calculatedMets` |
|---|---|---|
| `WALKING` | `3.3` | `3.3 * durationMinutes` |
| `MODERATE` | `4.0` | `4.0 * durationMinutes` |
| `VIGOROUS` | `8.0` | `8.0 * durationMinutes` |
| `MUSCLE_STRENGTHENING` | `5.0` | `5.0 * durationMinutes` |
| `ACUTE_AEROBIC_RELIEF` | `5.0` | `5.0 * durationMinutes` |

---

## 6. Penanganan Telemetri Kosong & Asumsi MVPA Nol (Barbosa et al., 2024)

- **Keputusan Klinis (`MVPA_ASUMSI_NOL`):**
  Bila pengguna mengeluhkan durasi duduk statis (misal duduk > 6 jam pada kalimat *"pegal habis nugas 8 jam"*) tanpa mencatat aktivitas fisik MVPA pada telemetri atau catatan hari tersebut, mesin evaluasi aturan klinis secara konservatif mengasumsikan:
  $$\text{totalMvpaMinutes} = 0$$
  $$\text{mvpaPerSedentaryRatio} = \frac{0}{\text{totalSedentaryHours}} = 0$$
- **Rujukan Klinis:**
  Sesuai temuan Barbosa et al. (2024), rasio MVPA terhadap jam duduk $< 25\text{ menit/jam}$ pada durasi duduk $> 6\text{ jam}$ berasosiasi signifikan dengan peningkatan risiko depresi ($\text{OR} = 1.74$). Oleh sebab itu, kondisi duduk statis panjang tanpa olahraga protektif diklasifikasikan sebagai `SEDENTARY_OVERLOAD` untuk segera memicu intervensi pemutus duduk statis (peregangan meja / jeda berdiri) tanpa mengubah batas ambang klinis baku.

---

## 7. Algoritma Burnout Risk Index (PRD Versi 4.0 — `burnoutScoring.ts`)

Berdasarkan *Effort-Recovery Model* (Meijman & Mulder), kelelahan belajar dihitung melalui integrasi faktor beban dan pemulihan:

$$\text{Burnout Risk Index} = (\text{Academic Load Score} + \text{Screen Time Fatigue}) - \text{Recovery Score}$$

### 7.1 Formulasi Beban (Load Factors)
1. **Academic Load Score (AL):**
   $$\text{AL} = \sum (\text{SKS} \times \text{Bobot}) + \text{Penalti Ujian}$$
   - Mata kuliah teori = $1.0\text{ poin / SKS}$
   - Mata kuliah praktikum = $1.5\text{ poin / SKS}$
   - Pekan menjelang ujian ($\le H-7$) = $+3.0\text{ poin penalti}$
2. **Screen Time Fatigue (ST):**
   $$\text{ST} = \max(0, \text{Total Jam Layar} - 8.0) \times 2.5$$
   - Ambang batas aman: $8.0\text{ jam/hari}$ (Alshahrani et al., 2025). Setiap kelebihan 1 jam menambah $2.5\text{ poin}$.

### 7.2 Formulasi Pemulihan (Recovery Factors)
1. **Skor Tidur:**
   $$\text{Skor Tidur} = \min\left(40, \left(\frac{\text{Jam Tidur}}{8.0}\right) \times 40\right)$$
   - Memberikan kontribusi hingga $40\text{ poin pemulihan}$ untuk tidur ideal 7–9 jam.
2. **Active Break Terverifikasi:**
   $$\text{Skor Break} = \text{Jumlah Active Break Terverifikasi} \times 10$$
   - Setiap sesi peregangan 2 menit yang tervalidasi kamera memberi $+10\text{ poin pemulihan}$.

### 7.3 Kategori Klasifikasi
- $\text{Burnout Index} < 40.0$ $\rightarrow$ `LOW` (Optimal Balance / Hijau)
- $40.0 \le \text{Burnout Index} \le 75.0$ $\rightarrow$ `MODERATE` (Waspada / Kuning)
- $\text{Burnout Index} > 75.0$ $\rightarrow$ `HIGH` (Risiko Burnout Tinggi / Merah)

