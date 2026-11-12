"""
generate_combos.py
Langkah A — Generate kombinasi telemetri sintetis untuk dataset fine-tuning CampusFlow.

Cara jalankan:
    py -3.12 generate_combos.py

Output:
    combos.jsonl  -> daftar kombinasi telemetri siap dipakai di Langkah B
                     (nanti dijalankan lewat evaluateClinicalRuleFlags di Node.js
                     untuk mendapatkan dominantMediator & label yang akurat)
"""

import itertools
import json
import random

# ======================================================
# 1. Definisikan rentang nilai yang mau divariasikan
#    Sesuaikan angka-angka ini dengan allowedRanges di backend Anda
# ======================================================

sleep_hours = [4, 4.5, 5, 5.5, 6, 6.5, 7, 7.5, 8, 8.5]
daily_steps = [1000, 1500, 3000, 5000, 7000, 9000, 12000, 15000]
mvpa_minutes = [0, 5, 10, 20, 30, 45, 60, 90]
sedentary_hours = [3, 4, 6, 8, 10, 12, 14]
pss4_scores = [None, 0, 2, 4, 6, 8, 10, 12]  # None = belum check-in hari ini

# Field tambahan yang dibutuhkan evaluateClinicalRuleFlags
# (ini input langsung, bukan hasil hitungan dari field lain)
sleep_quality_scores = [0, 1, 2, 3, 4]          # <=2 dianggap kualitas tidur buruk
mvpa_sedentary_ratios = [5, 15, 25, 35, 50, 70]  # <25 + sedentary>6 jam -> overload
triad_pillars_met = [0, 1, 2, 3]                 # jumlah pilar (tidur/gerak/MVPA) terpenuhi

# ======================================================
# 2. Buat semua kombinasi lalu ambil sample acak
#    (kombinasi penuh bisa jutaan, kita tidak perlu semua)
# ======================================================

random.seed(42)  # supaya hasil reproducible setiap kali dijalankan

all_combos = list(itertools.product(
    sleep_hours, daily_steps, mvpa_minutes, sedentary_hours, pss4_scores,
    sleep_quality_scores, mvpa_sedentary_ratios, triad_pillars_met,
))

print(f"Total kombinasi penuh yang mungkin: {len(all_combos)}")

random.shuffle(all_combos)

# Ambil sample lebih banyak dari target akhir (400-an), karena nanti
# akan difilter lagi di Langkah B supaya distribusi mediator merata.
SAMPLE_SIZE = 3000
sampled = all_combos[:SAMPLE_SIZE]

# ======================================================
# 3. Tulis ke file JSONL — satu kombinasi per baris
#    Nama field dibuat PERSIS sama dengan Telemetry7DaysInput["today"]
#    di ollamaCoach.ts, supaya Langkah B tinggal pakai langsung.
# ======================================================

output_path = "combos.jsonl"

with open(output_path, "w", encoding="utf-8") as f:
    for i, (sleep, steps, mvpa, sedentary, pss4, sleep_q, ratio, triad) in enumerate(sampled):
        record = {
            "id": f"combo_{i:04d}",
            "telemetry": {
                "totalSedentaryHours": sedentary,
                "totalMvpaMinutes": mvpa,
                "mvpaPerSedentaryRatio": ratio,
                "sleepHours": sleep,
                "sleepQualityScore": sleep_q,
                "pss4TotalScore": pss4,
                "triadPillarsMet": triad,
                # field tambahan, tidak dipakai rule engine tapi berguna
                # untuk konteks teks naratif di Langkah C
                "dailySteps": steps,
            }
        }
        f.write(json.dumps(record, ensure_ascii=False) + "\n")

print(f"Selesai. {len(sampled)} kombinasi ditulis ke '{output_path}'")
print("Lanjut ke Langkah B: jalankan tiap baris lewat evaluateClinicalRuleFlags di Node.js")