/**
 * Web Audio API Sound Synthesizer (Zero MP3 Assets, Zero Latency)
 * Menghasilkan efek audio sintetis yang elegan untuk feedback ergonomis dan active break.
 */

class SoundSynthesizer {
  private ctx: AudioContext | null = null;
  private isMuted: boolean = false;

  constructor() {
    // AudioContext diinisialisasi saat user berinteraksi pertama kali (kebijakan autoplay browser)
  }

  private getContext(): AudioContext | null {
    if (this.isMuted) return null;
    if (typeof window === "undefined") return null;

    if (!this.ctx) {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
      }
    }

    if (this.ctx && this.ctx.state === "suspended") {
      this.ctx.resume();
    }

    return this.ctx;
  }

  public setMuted(muted: boolean) {
    this.isMuted = muted;
  }

  public getMuted(): boolean {
    return this.isMuted;
  }

  /**
   * Suara konfirmasi saat 1 repetisi stretch selesai (Ding harmoni 2 nada).
   */
  public playRepComplete() {
    const ctx = this.getContext();
    if (!ctx) return;

    const now = ctx.currentTime;

    // Nada 1: E5 (659.25 Hz)
    const osc1 = ctx.createOscillator();
    const gain1 = ctx.createGain();
    osc1.type = "sine";
    osc1.frequency.setValueAtTime(659.25, now);

    gain1.gain.setValueAtTime(0.2, now);
    gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.35);

    osc1.connect(gain1);
    gain1.connect(ctx.destination);
    osc1.start(now);
    osc1.stop(now + 0.35);

    // Nada 2: A5 (880.00 Hz) sedikit terlambat
    const osc2 = ctx.createOscillator();
    const gain2 = ctx.createGain();
    osc2.type = "sine";
    osc2.frequency.setValueAtTime(880.0, now + 0.1);

    gain2.gain.setValueAtTime(0.25, now + 0.1);
    gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.55);

    osc2.connect(gain2);
    gain2.connect(ctx.destination);
    osc2.start(now + 0.1);
    osc2.stop(now + 0.55);
  }

  /**
   * Fanfare akord kemenangan saat semua repetisi selesai (+75 XP, Active Break tuntas).
   */
  public playBreakUnlocked() {
    const ctx = this.getContext();
    if (!ctx) return;

    const now = ctx.currentTime;
    // Arpeggio Major: C5 (523.25), E5 (659.25), G5 (783.99), C6 (1046.50)
    const notes = [523.25, 659.25, 783.99, 1046.5];

    notes.forEach((freq, idx) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      const noteTime = now + idx * 0.09;

      osc.type = "triangle";
      osc.frequency.setValueAtTime(freq, noteTime);

      gain.gain.setValueAtTime(0.22, noteTime);
      gain.gain.exponentialRampToValueAtTime(0.001, noteTime + 0.45);

      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(noteTime);
      osc.stop(noteTime + 0.45);
    });
  }

  /**
   * Peringatan lembut saat postur membungkuk / terlalu dekat (Double Pulse Sine 392 Hz).
   */
  public playSlouchWarning() {
    const ctx = this.getContext();
    if (!ctx) return;

    const now = ctx.currentTime;

    [0, 0.18].forEach((offset) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      const pulseTime = now + offset;

      osc.type = "sine";
      osc.frequency.setValueAtTime(392.0, pulseTime); // G4

      gain.gain.setValueAtTime(0.12, pulseTime);
      gain.gain.exponentialRampToValueAtTime(0.001, pulseTime + 0.14);

      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(pulseTime);
      osc.stop(pulseTime + 0.14);
    });
  }

  /**
   * Suara saat kalibrasi baseline 5 detik selesai.
   */
  public playCalibrationSuccess() {
    const ctx = this.getContext();
    if (!ctx) return;

    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = "sine";
    // Pitch sweep naik: 440 Hz -> 880 Hz
    osc.frequency.setValueAtTime(440, now);
    osc.frequency.exponentialRampToValueAtTime(880, now + 0.25);

    gain.gain.setValueAtTime(0.2, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.35);

    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(now);
    osc.stop(now + 0.35);
  }
}

export const sound = new SoundSynthesizer();

