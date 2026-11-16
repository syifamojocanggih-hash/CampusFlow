/**
 * 3-Axis HTML5 Pedometer Sensor & IPAQ-SF METs Classifier
 * CampusFlow PWA — Branch feat/vision-guard
 */

import type { PedometerSampleResult } from "@/types";

export type CadenceIntensity = "IDLE" | "WALKING" | "MODERATE" | "VIGOROUS";

export interface PedometerConfig {
  sampleWindowSize: number; // 25 samples
  accelerationThreshold: number; // 1.35 m/s^2
  minStepIntervalMs: number; // 250 ms (max 240 SPM)
  maxStepIntervalMs: number; // 1200 ms (min 50 SPM)
}

export const DEFAULT_PEDOMETER_CONFIG: PedometerConfig = {
  sampleWindowSize: 25,
  accelerationThreshold: 1.35,
  minStepIntervalMs: 250,
  maxStepIntervalMs: 1200,
};

export const MET_TABLE = {
  IDLE: { spmMin: 0, spmMax: 49, mets: 1.0, label: "Diam / Santai" },
  WALKING: { spmMin: 50, spmMax: 99, mets: 3.3, label: "Jalan Kaki Ringan" },
  MODERATE: { spmMin: 100, spmMax: 129, mets: 4.0, label: "Jalan Cepat / Sedang" },
  VIGOROUS: { spmMin: 130, spmMax: 999, mets: 8.0, label: "Lari / Intensitas Tinggi" },
} as const;

export function classifyCadence(spm: number): {
  intensityType: CadenceIntensity;
  metMultiplier: number;
} {
  if (spm >= 130) {
    return { intensityType: "VIGOROUS", metMultiplier: 8.0 };
  }
  if (spm >= 100) {
    return { intensityType: "MODERATE", metMultiplier: 4.0 };
  }
  if (spm >= 50) {
    return { intensityType: "WALKING", metMultiplier: 3.3 };
  }
  return { intensityType: "IDLE", metMultiplier: 1.0 };
}

export interface StepEventDetail {
  totalSteps: number;
  cadenceSpm: number;
  intensityType: CadenceIntensity;
  metMultiplier: number;
  metMinutes: number;
  lastNetAcc: number;
}

export type StepCallback = (result: StepEventDetail) => void;

/**
 * PedometerEngine memproses stream 3-axis accelerometer HTML5 DeviceMotionEvent.
 */
export class PedometerEngine {
  private config: PedometerConfig;
  private magBuffer: number[] = [];
  private totalSteps: number = 0;
  private lastStepTimestamp: number = 0;
  private stepTimestamps: number[] = [];
  private accumulatedMetMinutes: number = 0;
  private lastCalculationTime: number = 0;
  private isListening: boolean = false;
  private onStepCallback: StepCallback | null = null;
  private motionListener: ((e: DeviceMotionEvent) => void) | null = null;
  private cadenceIntervalTimer: number | null = null;

  constructor(config: Partial<PedometerConfig> = {}) {
    this.config = { ...DEFAULT_PEDOMETER_CONFIG, ...config };
  }

  public setStepCallback(cb: StepCallback | null) {
    this.onStepCallback = cb;
  }

  /**
   * Memproses satu sample akselerasi 3 sumbu (x, y, z).
   */
  public processSample(x: number, y: number, z: number, now: number = Date.now()): {
    stepDetected: boolean;
    netAcc: number;
    magAcc: number;
  } {
    // 1. Hitung magnitudo akselerasi 3D
    const aMag = Math.sqrt(x * x + y * y + z * z);

    // 2. High-Pass Filter dengan 25-sample moving average untuk hilangkan gravitasi
    this.magBuffer.push(aMag);
    if (this.magBuffer.length > this.config.sampleWindowSize) {
      this.magBuffer.shift();
    }

    const meanMag =
      this.magBuffer.reduce((sum, val) => sum + val, 0) / this.magBuffer.length;
    const aNet = aMag - meanMag;

    // 3. Step Detection: jika aNet > 1.35 m/s^2 dan interval valid
    let stepDetected = false;
    if (aNet > this.config.accelerationThreshold) {
      const timeSinceLastStep = now - this.lastStepTimestamp;

      // Anti-shake filter: tolak getaran < 250ms (lebih dari 240 SPM)
      if (this.lastStepTimestamp === 0 || timeSinceLastStep >= this.config.minStepIntervalMs) {
        this.totalSteps += 1;
        this.lastStepTimestamp = now;
        this.stepTimestamps.push(now);
        stepDetected = true;
      }
    }

    // Bersihkan timestamp langkah lama (> 10 detik lalu) untuk hitung cadence rolling
    const windowStart = now - 10000;
    while (this.stepTimestamps.length > 0 && this.stepTimestamps[0] < windowStart) {
      this.stepTimestamps.shift();
    }

    // Integrasi MET-menit kontinu
    if (this.lastCalculationTime === 0) {
      this.lastCalculationTime = now;
    } else {
      const dtMinutes = (now - this.lastCalculationTime) / 60000;
      this.lastCalculationTime = now;
      const cadence = this.calculateCadence(now);
      const { metMultiplier } = classifyCadence(cadence);
      this.accumulatedMetMinutes += metMultiplier * dtMinutes;
    }

    if (stepDetected && this.onStepCallback) {
      this.notifyUpdate(aNet);
    }

    return { stepDetected, netAcc: aNet, magAcc: aMag };
  }

  /**
   * Menghitung Cadence (Langkah per Menit / SPM) berbasis riwayat langkah.
   */
  public calculateCadence(now: number = Date.now()): number {
    if (this.stepTimestamps.length < 2) {
      // Jika langkah terakhir sudah lebih dari 2 detik lalu, cadence kembali 0 (idle)
      if (this.lastStepTimestamp > 0 && now - this.lastStepTimestamp > 2000) {
        return 0;
      }
      return this.stepTimestamps.length === 1 ? 60 : 0;
    }

    // Jika langkah terakhir sudah lama (> 2 detik), pengguna sudah berhenti
    if (now - this.lastStepTimestamp > 2000) {
      return 0;
    }

    const first = this.stepTimestamps[0];
    const last = this.stepTimestamps[this.stepTimestamps.length - 1];
    const durationSecs = (last - first) / 1000;

    if (durationSecs < 0.5) return 0;

    // SPM = (jumlah langkah - 1) / durasi * 60
    const spm = ((this.stepTimestamps.length - 1) / durationSecs) * 60;
    return Math.min(240, Math.round(spm));
  }

  /**
   * Simulasi 1 langkah manual (berguna untuk desktop testing).
   */
  public simulateStep(): StepEventDetail {
    const now = Date.now();
    this.totalSteps += 1;
    this.lastStepTimestamp = now;
    this.stepTimestamps.push(now);

    // Bersihkan buffer cadence
    const windowStart = now - 10000;
    while (this.stepTimestamps.length > 0 && this.stepTimestamps[0] < windowStart) {
      this.stepTimestamps.shift();
    }

    const cadence = this.calculateCadence(now);
    const { intensityType, metMultiplier } = classifyCadence(cadence || 75);
    // Tambah estimasi MET-menit per langkah (~ 0.03 MET-menit per 10 langkah)
    this.accumulatedMetMinutes += (metMultiplier * (1 / 80));

    const result: StepEventDetail = {
      totalSteps: this.totalSteps,
      cadenceSpm: cadence || 75,
      intensityType: cadence > 0 ? intensityType : "WALKING",
      metMultiplier,
      metMinutes: Number(this.accumulatedMetMinutes.toFixed(2)),
      lastNetAcc: 1.8,
    };

    if (this.onStepCallback) {
      this.onStepCallback(result);
    }
    return result;
  }

  public getSnapshot(): PedometerSampleResult & { metMinutes: number } {
    const cadence = this.calculateCadence();
    const { intensityType, metMultiplier } = classifyCadence(cadence);
    return {
      totalSteps: this.totalSteps,
      cadenceSpm: cadence,
      intensityType,
      metMultiplier,
      metMinutes: Number(this.accumulatedMetMinutes.toFixed(2)),
    };
  }

  private notifyUpdate(lastNetAcc: number) {
    if (!this.onStepCallback) return;
    const cadence = this.calculateCadence();
    const { intensityType, metMultiplier } = classifyCadence(cadence);
    this.onStepCallback({
      totalSteps: this.totalSteps,
      cadenceSpm: cadence,
      intensityType,
      metMultiplier,
      metMinutes: Number(this.accumulatedMetMinutes.toFixed(2)),
      lastNetAcc: Number(lastNetAcc.toFixed(2)),
    });
  }

  /**
   * Memulai listening ke HTML5 DeviceMotionEvent.
   */
  public async start(): Promise<{ supported: boolean; permissionGranted: boolean }> {
    if (this.isListening) {
      return { supported: true, permissionGranted: true };
    }

    if (typeof window === "undefined" || !("DeviceMotionEvent" in window)) {
      return { supported: false, permissionGranted: false };
    }

    // Handle iOS 13+ Safari permission
    const DeviceMotionAny = window.DeviceMotionEvent as unknown as {
      requestPermission?: () => Promise<"granted" | "denied">;
    };

    if (typeof DeviceMotionAny.requestPermission === "function") {
      try {
        const response = await DeviceMotionAny.requestPermission();
        if (response !== "granted") {
          return { supported: true, permissionGranted: false };
        }
      } catch (err) {
        console.warn("Permission request failed:", err);
        return { supported: true, permissionGranted: false };
      }
    }

    this.motionListener = (event: DeviceMotionEvent) => {
      const acc = event.accelerationIncludingGravity || event.acceleration;
      if (!acc) return;
      const x = acc.x ?? 0;
      const y = acc.y ?? 0;
      const z = acc.z ?? 0;
      this.processSample(x, y, z);
    };

    window.addEventListener("devicemotion", this.motionListener, { passive: true });
    this.isListening = true;
    this.lastCalculationTime = Date.now();

    // Timer periodik untuk update cadence kembali ke 0 saat diam
    this.cadenceIntervalTimer = window.setInterval(() => {
      if (this.onStepCallback) {
        const cadence = this.calculateCadence();
        const { intensityType, metMultiplier } = classifyCadence(cadence);
        this.onStepCallback({
          totalSteps: this.totalSteps,
          cadenceSpm: cadence,
          intensityType,
          metMultiplier,
          metMinutes: Number(this.accumulatedMetMinutes.toFixed(2)),
          lastNetAcc: 0,
        });
      }
    }, 1000);

    return { supported: true, permissionGranted: true };
  }

  public stop(): void {
    if (this.motionListener) {
      window.removeEventListener("devicemotion", this.motionListener);
      this.motionListener = null;
    }
    if (this.cadenceIntervalTimer !== null) {
      clearInterval(this.cadenceIntervalTimer);
      this.cadenceIntervalTimer = null;
    }
    this.isListening = false;
  }

  public reset(): void {
    this.totalSteps = 0;
    this.lastStepTimestamp = 0;
    this.stepTimestamps = [];
    this.accumulatedMetMinutes = 0;
    this.magBuffer = [];
    this.lastCalculationTime = Date.now();
  }

  public getIsListening(): boolean {
    return this.isListening;
  }
}

