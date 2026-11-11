# PEDOMETER_SENSOR.md — Pemrosesan Sinyal Sensor Smartphone & IPAQ-SF METs

> **FILE TARGET:** `frontend/src/utils/pedometerSensor.ts`  
> **PENANGGUNG JAWAB:** Tiara (`@mutiaradewanda` — branch `frontend`)

---

## 1. Algoritma Digital Signal Processing (Orientation-Independent)

Agar tetap akurat meskipun smartphone diletakkan di saku celana atau tas dengan orientasi acak:
1. **Magnitudo Vektor 3D:** $a_{mag}(t) = \sqrt{a_x^2 + a_y^2 + a_z^2}$.
2. **Eliminasi Gravitasi (~9.81 m/s²):** High-Pass Filter menggunakan selisih terhadap rata-rata bergerak 25 sampel terakhir:
   $$a_{net}(t) = a_{mag}(t) - \text{mean}(a_{mag}[t-25 : t])$$
3. **Anti-Shake Filter (Validasi Langkah):**
   - Puncak akselerasi bersih $a_{net}(t) > 1.35\text{ m/s}^2$.
   - Jeda antarlangkah berada di rentang **250 ms – 1200 ms** (setara **50–240 SPM**; mengocok HP cepat > 4 Hz diabaikan).
   - Validasi minimal **6 langkah berturut-turut** sebelum dihitung sebagai sesi berjalan (mencegah gerakan berdiri sesaat dihitung sebagai jalan kaki).

---

## 2. Tabel Konversi Intensitas & METs (IPAQ-SF)

| Kategori (`ActivityIntensity`) | Deteksi Otomatis (*Cadence*) / Manual | Koefisien MET |
|---|---|---|
| `WALKING` (Light PA) | `60 – 99` langkah/menit *(min 50 SPM di detector)* | `3.3 METs` |
| `MODERATE` (MPA) | `100 – 129` langkah/menit atau input olahraga sedang | `4.0 METs` |
| `VIGOROUS` (VPA) | `>= 130` langkah/menit atau lari/futsal/HIIT | `8.0 METs` |
| `MUSCLE_STRENGTHENING` (MSE) | Input sesi gym/kalistenik (target $\ge 2$ hari/minggu) | `5.0 METs` |

---

## 3. Kode Produksi (`frontend/src/utils/pedometerSensor.ts`)

```ts
// File: frontend/src/utils/pedometerSensor.ts
export class PedometerProcessor {
  private windowBuffer: number[] = [];
  private readonly WINDOW_SIZE = 25;
  private readonly PEAK_THRESHOLD = 1.35; // m/s^2 di atas gravitasi rata-rata
  private readonly MIN_STEP_INTERVAL_MS = 250; // Maksimal 240 langkah/menit
  private readonly MAX_STEP_INTERVAL_MS = 1200; // Minimal 50 langkah/menit
  private lastStepTime = 0;
  private stepTimestamps: number[] = [];
  public totalSteps = 0;

  public processMotionEvent(ax: number, ay: number, az: number, nowMs = Date.now()) {
    const mag = Math.hypot(ax, ay, az);
    this.windowBuffer.push(mag);
    if (this.windowBuffer.length > this.WINDOW_SIZE) {
      this.windowBuffer.shift();
    }

    const meanGravity =
      this.windowBuffer.reduce((sum, val) => sum + val, 0) / this.windowBuffer.length;
    const netAccel = mag - meanGravity;
    const deltaMs = nowMs - this.lastStepTime;

    if (netAccel > this.PEAK_THRESHOLD && deltaMs >= this.MIN_STEP_INTERVAL_MS) {
      this.lastStepTime = nowMs;
      this.totalSteps += 1;
      this.stepTimestamps.push(nowMs);
      // Simpan riwayat 60 detik terakhir untuk menghitung cadence (langkah/menit)
      this.stepTimestamps = this.stepTimestamps.filter((t) => nowMs - t <= 60000);
    }

    const currentCadence = this.stepTimestamps.length;
    let intensityType: "IDLE" | "WALKING" | "MODERATE" | "VIGOROUS" = "IDLE";
    let metMultiplier = 1.0;

    if (currentCadence >= 130) {
      intensityType = "VIGOROUS";
      metMultiplier = 8.0;
    } else if (currentCadence >= 100) {
      intensityType = "MODERATE";
      metMultiplier = 4.0;
    } else if (currentCadence >= 50) {
      intensityType = "WALKING";
      metMultiplier = 3.3;
    }

    return {
      totalSteps: this.totalSteps,
      cadenceSpm: currentCadence,
      intensityType,
      metMultiplier,
    };
  }
}
```

---

## 4. Aturan Browser Mobile (HTTPS & iOS Safari)

1. Browser modern **memblokir** `DeviceMotionEvent` dan `getUserMedia` pada HTTP biasa (kecuali `localhost`). Pengujian di smartphone lewat WiFi lokal **WAJIB** menggunakan `@vitejs/plugin-basic-ssl` atau tunnel `cloudflared` / `ngrok` HTTPS.
2. Pada **iOS Safari**, pemanggilan `(DeviceMotionEvent as any).requestPermission()` wajib diletakkan langsung di dalam `onClick` handler tombol **"Aktifkan Pelacak Langkah"**.
