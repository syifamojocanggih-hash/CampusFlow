"""
generate_combos.py
Langkah A — Generate kombinasi telemetri sintetis yang konsisten secara fisiologis
untuk dataset fine-tuning CampusFlow (termasuk skenario skipAdaptation, userNotes
darurat, missingDailyCheckIn, dan out_of_scope murni).

Cara jalankan:
    py backend/scripts/generate_combos.py

Output:
    backend/scripts/combos.jsonl
"""

import json
import random
from pathlib import Path

OUT_PATH = Path(__file__).resolve().parent / "combos.jsonl"

SEDENTARY_VALUES = [3.0, 4.0, 5.0, 5.5, 6.5, 7.5, 8.5, 9.5, 11.0, 13.0]
MVPA_VALUES = [0, 5, 10, 15, 20, 25, 30, 35, 45, 60, 75, 90]
SLEEP_VALUES = [4.0, 4.5, 5.0, 5.5, 6.0, 6.5, 7.0, 7.5, 8.0, 8.5]
PSS4_VALUES = [0, 2, 4, 5, 6, 7, 8, 9, 10, 11, 12, 14]

DISTRESS_NOTES = [
    "Hari ini merasa cemas berlebihan menghadapi ujian akhir.",
    "Rasanya putus asa dan tidak sanggup mengejar semua deadline minggu ini.",
    "Tiba-tiba panik berat sebelum presentasi kuliah besok.",
    "Capek sekali dan merasa ga sanggup melanjutkan tugas hari ini.",
]

NEUTRAL_NOTES = [
    None,
    None,
    None,
    "Hari ini kuliah dari pagi sampai sore di gedung teknik.",
    "Menyiapkan bahan presentasi kelompok di perpustakaan kampus.",
]

OUT_OF_SCOPE_NOTES = [
    "Bisa bantu jawab soal kalkulus integral nomor 5?",
    "Tolong buatkan resep nasi goreng kampung yang enak.",
    "Siapa presiden pertama Indonesia?",
    "Jelaskan cara membuat API REST memakai Python FastAPI.",
    "Berikan rekomendasi laptop gaming terbaik tahun ini.",
    "Tolong terjemahkan paragraf bahasa Inggris ini ke Jepang.",
    "Berapa harga saham BBCA hari ini?",
    "Ceritakan sejarah singkat perang Diponegoro.",
    "Bagaimana cara memperbaiki error git merge conflict?",
    "Rekomendasi film horor Indonesia terbaik apa?",
    "Buatkan puisi bertema hujan di malam hari.",
    "Tolong hitung luas lingkaran dengan jari-jari 14 cm.",
    "Apa perbedaan RAM DDR4 dan DDR5?",
    "Siapa pemenang Piala Dunia terakhir?",
    "Berikan ide judul skripsi tentang e-commerce.",
]


def sample_sleep_quality(rng: random.Random, sleep_hours: float) -> int:
    """Pilih skor kualitas tidur (1..5) yang masuk akal terhadap durasi tidur."""
    if sleep_hours < 5.5:
        return rng.choice([1, 1, 2, 2, 3])
    if sleep_hours < 7.0:
        return rng.choice([2, 2, 3, 3, 4])
    return rng.choice([2, 3, 4, 4, 5])


def compute_triad_pillars(sedentary: float, mvpa: int, sleep: float | None, sleep_q: int | None) -> int:
    """Selaras dengan evaluate24HourTriad di clinicalScoring.ts."""
    p1 = mvpa >= 30
    p2 = sleep is not None and sleep_q is not None and 7.0 <= sleep <= 9.0 and sleep_q >= 3
    p3 = sedentary < 9.0
    return int(p1) + int(p2) + int(p3)


def make_telemetry_row(rng: random.Random, idx: int, *, force_exam_stress: bool = False, force_missing_checkin: bool = False) -> dict:
    if force_exam_stress:
        sedentary = rng.choice([3.0, 4.0, 5.0, 5.5, 6.0])
        mvpa = rng.choice([30, 35, 45, 60])
        sleep = rng.choice([7.0, 7.5, 8.0, 8.5])
        sleep_q = rng.choice([3, 4, 5])
        pss4 = rng.choice([8, 9, 10, 11, 12, 13])
    elif force_missing_checkin:
        sedentary = rng.choice(SEDENTARY_VALUES)
        mvpa = rng.choice(MVPA_VALUES)
        sleep = None
        sleep_q = None
        pss4 = None
    else:
        sedentary = rng.choice(SEDENTARY_VALUES)
        mvpa = rng.choice(MVPA_VALUES)
        if rng.random() < 0.12:
            sleep, sleep_q, pss4 = None, None, None
        else:
            sleep = rng.choice(SLEEP_VALUES)
            sleep_q = sample_sleep_quality(rng, sleep)
            pss4 = rng.choice(PSS4_VALUES)

    ratio = round(mvpa / sedentary, 2) if sedentary > 0 else float(mvpa)
    steps = rng.randint(600, 2200) + mvpa * rng.randint(85, 115)
    triad = compute_triad_pillars(sedentary, mvpa, sleep, sleep_q)

    # Tambahkan riwayat skip berulang pada ~18% baris supaya skipAdaptation terlatih nyata
    recent_insights = []
    if rng.random() < 0.18:
        skips = rng.choice([2, 3, 4])
        prev_mets = rng.choice([190, 200, 220, 240])
        recent_insights = [{"isCompleted": False, "recommendedMetsToday": prev_mets} for _ in range(skips)]

    # Tambahkan catatan darurat pada ~10% baris (jika bukan missing check-in) atau catatan netral
    if pss4 is not None and rng.random() < 0.10:
        user_notes = rng.choice(DISTRESS_NOTES)
    else:
        user_notes = rng.choice(NEUTRAL_NOTES)

    return {
        "id": f"combo_{idx:04d}",
        "scenarioType": "wellbeing",
        "telemetry": {
            "totalSedentaryHours": sedentary,
            "totalMvpaMinutes": mvpa,
            "mvpaPerSedentaryRatio": ratio,
            "sleepHours": sleep,
            "sleepQualityScore": sleep_q,
            "pss4TotalScore": pss4,
            "triadPillarsMet": triad,
            "dailySteps": steps,
        },
        "userNotes": user_notes,
        "recentInsights": recent_insights,
    }


def main() -> None:
    rng = random.Random(42)
    records = []

    # 2400 variasi umum, 350 EXAM_ACUTE_STRESS-eligible, 235 missingDailyCheckIn, 15 out_of_scope
    idx = 0
    for _ in range(2400):
        records.append(make_telemetry_row(rng, idx))
        idx += 1
    for _ in range(350):
        records.append(make_telemetry_row(rng, idx, force_exam_stress=True))
        idx += 1
    for _ in range(235):
        records.append(make_telemetry_row(rng, idx, force_missing_checkin=True))
        idx += 1
    for note in OUT_OF_SCOPE_NOTES:
        base = make_telemetry_row(rng, idx, force_exam_stress=False)
        base["scenarioType"] = "out_of_scope"
        base["userNotes"] = note
        base["recentInsights"] = []
        records.append(base)
        idx += 1

    with OUT_PATH.open("w", encoding="utf-8") as f:
        for rec in records:
            f.write(json.dumps(rec, ensure_ascii=False) + "\n")

    print(f"Selesai. {len(records)} kombinasi konsisten ditulis ke '{OUT_PATH}'")


if __name__ == "__main__":
    main()
