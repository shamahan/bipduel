import { SoundPort } from '../app/app';

const MASTER_VOLUME = 0.5;

export class Sound implements SoundPort {
  muted = false;
  private ctx: AudioContext | null = null;
  private master: GainNode | null = null;

  resume(): void {
    try {
      if (!this.ctx) {
        this.ctx = new AudioContext();
        this.master = this.ctx.createGain();
        this.master.gain.value = this.muted ? 0 : MASTER_VOLUME;
        this.master.connect(this.ctx.destination);
      }
      this.ctx.resume().catch(() => {});
    } catch {
      this.ctx = null;
      this.master = null;
    }
  }

  toggleMute(): void {
    this.muted = !this.muted;
    if (this.master) this.master.gain.value = this.muted ? 0 : MASTER_VOLUME;
  }

  shot(): void {
    this.blip('square', 220, 110, 0.06, 0.15);
  }

  reloadDone(): void {
    this.blip('sine', 660, 880, 0.12, 0.2);
  }

  explosion(): void {
    if (!this.ctx || !this.master) return;
    try {
      const dur = 0.5;
      const buf = this.ctx.createBuffer(1, Math.floor(this.ctx.sampleRate * dur), this.ctx.sampleRate);
      const data = buf.getChannelData(0);
      for (let i = 0; i < data.length; i++) {
        data[i] = (Math.random() * 2 - 1) * (1 - i / data.length) ** 2;
      }
      const src = this.ctx.createBufferSource();
      src.buffer = buf;
      const filter = this.ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.value = 900;
      const g = this.ctx.createGain();
      g.gain.value = 0.6;
      src.connect(filter).connect(g).connect(this.master);
      src.start();
    } catch {
      /* нет звука — не страшно */
    }
  }

  private blip(type: OscillatorType, from: number, to: number, dur: number, vol: number): void {
    if (!this.ctx || !this.master) return;
    try {
      const t0 = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      osc.type = type;
      osc.frequency.setValueAtTime(from, t0);
      osc.frequency.exponentialRampToValueAtTime(to, t0 + dur);
      const g = this.ctx.createGain();
      g.gain.setValueAtTime(vol, t0);
      g.gain.exponentialRampToValueAtTime(0.001, t0 + dur);
      osc.connect(g).connect(this.master);
      osc.start(t0);
      osc.stop(t0 + dur);
    } catch {
      /* нет звука — не страшно */
    }
  }
}
