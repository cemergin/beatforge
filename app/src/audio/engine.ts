// BeatForge audio engine — synthesized 808/909/707 kit + lookahead scheduler.
// No samples. Pure Web Audio. Each track has its own cursor (supports per-cycle
// wrapping for polyrhythm). Ported from design/src/engine.js, typed.

import type { Pattern, VoiceId, Velocity, KitId } from '../patterns/types';

type Track = Velocity[] | { cycle: number; pattern: Velocity[] };

export interface StepSnapshot {
  absStep: number;
  masterIdx: number;
  time: number;
  cursors: Record<string, number>;
}

export class AudioEngine {
  ctx: AudioContext | null = null;
  master: GainNode | null = null;
  reverb: ConvolverNode | null = null;
  private revIn: GainNode | null = null;

  kit: KitId = '808';
  running = false;
  pattern: Pattern | null = null;
  bpm = 120;
  swing = 0.5;
  strongAmp = 1.0;
  weakAmp = 0.5;

  onStep: ((snap: StepSnapshot) => void) | null = null;

  private readonly lookaheadMs = 25;
  private readonly scheduleAheadS = 0.12;
  private timerId: ReturnType<typeof setTimeout> | null = null;
  private nextNoteTimes: Record<string, number> = {};
  private cursors: Record<string, number> = {};
  private absStep = 0;
  private startTime = 0;

  async ensureCtx(): Promise<void> {
    if (!this.ctx) {
      const Ctor = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      this.ctx = new Ctor();
      this.master = this.ctx.createGain();
      this.master.gain.value = 0.85;
      const comp = this.ctx.createDynamicsCompressor();
      comp.threshold.value = -14;
      comp.ratio.value = 3;
      comp.attack.value = 0.003;
      comp.release.value = 0.1;
      this.master.connect(comp).connect(this.ctx.destination);

      this.reverb = this.ctx.createConvolver();
      this.reverb.buffer = this.makeImpulse(1.4, 2.2);
      const revGain = this.ctx.createGain();
      revGain.gain.value = 0.18;
      this.reverb.connect(revGain).connect(this.master);
      this.revIn = this.ctx.createGain();
      this.revIn.gain.value = 0;
      this.revIn.connect(this.reverb);
    }
    if (this.ctx.state === 'suspended') await this.ctx.resume();
  }

  private makeImpulse(duration: number, decay: number): AudioBuffer {
    const ctx = this.ctx!;
    const rate = ctx.sampleRate;
    const length = rate * duration;
    const impulse = ctx.createBuffer(2, length, rate);
    for (let ch = 0; ch < 2; ch++) {
      const d = impulse.getChannelData(ch);
      for (let i = 0; i < length; i++) {
        d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / length, decay);
      }
    }
    return impulse;
  }

  setKit(k: KitId): void { this.kit = k; }
  setBpm(b: number): void { this.bpm = b; }
  setSwing(s: number): void { this.swing = s; }
  setAccents(strong: number, weak: number): void {
    this.strongAmp = strong;
    this.weakAmp = weak;
  }

  loadPattern(p: Pattern): void {
    this.pattern = p;
    this.cursors = {};
    Object.keys(p.tracks).forEach((tr) => { this.cursors[tr] = 0; });
  }

  start(): void {
    if (!this.pattern || !this.ctx || this.running) return;
    this.running = true;
    const now = this.ctx.currentTime + 0.06;
    this.startTime = now;
    this.absStep = 0;
    Object.keys(this.pattern.tracks).forEach((tr) => {
      this.cursors[tr] = 0;
      this.nextNoteTimes[tr] = now;
    });
    this.tick();
  }

  stop(): void {
    this.running = false;
    if (this.timerId) clearTimeout(this.timerId);
  }

  // Seconds per step — BPM means beats-per-minute where one "beat" is one grid step.
  // Matches how irregular meters (9/8, 7/8) are taught: the eighth-note pulse IS the beat.
  private stepSecs(): number {
    return 60 / this.bpm;
  }

  private trackCycle(track: Track): { cycle: number; pattern: Velocity[] } {
    if (Array.isArray(track)) return { cycle: track.length, pattern: track };
    return { cycle: track.cycle, pattern: track.pattern };
  }

  private tick = (): void => {
    if (!this.running || !this.ctx || !this.pattern) return;
    const horizon = this.ctx.currentTime + this.scheduleAheadS;
    const p = this.pattern;
    const stepSec = this.stepSecs();
    const masterSteps = p.steps;

    while (this.startTime + this.absStep * stepSec < horizon) {
      const tStep = this.startTime + this.absStep * stepSec;
      // Swing delay for odd sixteenths
      let tPlay = tStep;
      if (p.stepUnit === 16 && this.absStep % 2 === 1) {
        const swingDelay = (this.swing - 0.5) * 2 * stepSec;
        tPlay = tStep + swingDelay;
      }

      for (const tr of Object.keys(p.tracks)) {
        const trackData = p.tracks[tr as VoiceId];
        if (!trackData) continue;
        const { cycle, pattern: data } = this.trackCycle(trackData);
        const idx = this.cursors[tr] % cycle;
        const vel = data[idx];
        if (vel > 0) this.trigger(tr as VoiceId, tPlay, vel);
        this.cursors[tr] = (this.cursors[tr] + 1) % cycle;
      }

      const snap: StepSnapshot = {
        absStep: this.absStep,
        masterIdx: this.absStep % masterSteps,
        time: tStep,
        cursors: { ...this.cursors },
      };
      const delayMs = Math.max(0, (tStep - this.ctx.currentTime) * 1000);
      setTimeout(() => { this.onStep?.(snap); }, delayMs);

      this.absStep++;
    }

    this.timerId = setTimeout(this.tick, this.lookaheadMs);
  };

  private trigger(voice: VoiceId, when: number, velLevel: Velocity): void {
    const amp = velLevel === 2 ? this.strongAmp : this.weakAmp;
    switch (voice) {
      case 'KK': this.kick(when, amp); break;
      case 'SN': this.snare(when, amp); break;
      case 'HH': this.hat(when, amp, false); break;
      case 'OH': this.hat(when, amp, true); break;
      case 'CP': this.clap(when, amp); break;
    }
  }

  // ── 808/909/707 voices ─────────────────────────────────────────────

  private kick(when: number, amp: number): void {
    const ctx = this.ctx!;
    const { kit } = this;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    const f0 = kit === '909' ? 180 : kit === '707' ? 140 : 150;
    const f1 = kit === '909' ? 42 : kit === '707' ? 55 : 40;
    const dec = kit === '909' ? 0.35 : kit === '707' ? 0.28 : 0.6;
    osc.frequency.setValueAtTime(f0, when);
    osc.frequency.exponentialRampToValueAtTime(f1, when + 0.08);
    gain.gain.setValueAtTime(0, when);
    gain.gain.linearRampToValueAtTime(amp * 1.1, when + 0.003);
    gain.gain.exponentialRampToValueAtTime(0.0001, when + dec);
    osc.connect(gain).connect(this.master!);
    if (kit !== '808') {
      const click = ctx.createOscillator();
      const cg = ctx.createGain();
      click.frequency.value = 2400;
      click.type = 'square';
      cg.gain.setValueAtTime(amp * 0.2, when);
      cg.gain.exponentialRampToValueAtTime(0.0001, when + 0.01);
      click.connect(cg).connect(this.master!);
      click.start(when); click.stop(when + 0.02);
    }
    osc.start(when);
    osc.stop(when + dec + 0.05);
  }

  private snare(when: number, amp: number): void {
    const ctx = this.ctx!;
    const { kit } = this;
    const o1 = ctx.createOscillator();
    const o2 = ctx.createOscillator();
    o1.frequency.value = kit === '909' ? 220 : 185;
    o2.frequency.value = kit === '909' ? 380 : 349;
    const og = ctx.createGain();
    og.gain.setValueAtTime(0, when);
    og.gain.linearRampToValueAtTime(amp * 0.5, when + 0.002);
    og.gain.exponentialRampToValueAtTime(0.0001, when + 0.08);
    o1.connect(og); o2.connect(og);
    og.connect(this.master!);
    o1.start(when); o2.start(when);
    o1.stop(when + 0.12); o2.stop(when + 0.12);

    const noise = this.noise(0.18);
    const nFilt = ctx.createBiquadFilter();
    nFilt.type = 'bandpass';
    nFilt.frequency.value = kit === '909' ? 2400 : 1800;
    nFilt.Q.value = 0.6;
    const ng = ctx.createGain();
    const dec = kit === '707' ? 0.09 : 0.15;
    ng.gain.setValueAtTime(0, when);
    ng.gain.linearRampToValueAtTime(amp * 0.7, when + 0.002);
    ng.gain.exponentialRampToValueAtTime(0.0001, when + dec);
    noise.connect(nFilt).connect(ng).connect(this.master!);
    noise.start(when); noise.stop(when + dec + 0.02);
  }

  private hat(when: number, amp: number, open: boolean): void {
    const ctx = this.ctx!;
    const dec = open ? 0.32 : 0.05;
    const noise = this.noise(dec + 0.05);
    const hp = ctx.createBiquadFilter();
    hp.type = 'highpass';
    hp.frequency.value = 7000;
    const bp = ctx.createBiquadFilter();
    bp.type = 'bandpass';
    bp.frequency.value = 10000;
    bp.Q.value = 1.2;
    const g = ctx.createGain();
    g.gain.setValueAtTime(0, when);
    g.gain.linearRampToValueAtTime(amp * 0.4, when + 0.001);
    g.gain.exponentialRampToValueAtTime(0.0001, when + dec);
    noise.connect(hp).connect(bp).connect(g).connect(this.master!);
    noise.start(when);
    noise.stop(when + dec + 0.05);
  }

  private clap(when: number, amp: number): void {
    const ctx = this.ctx!;
    for (let i = 0; i < 3; i++) {
      const t = when + i * 0.012;
      const n = this.noise(0.05);
      const f = ctx.createBiquadFilter();
      f.type = 'bandpass';
      f.frequency.value = 1200;
      f.Q.value = 0.8;
      const g = ctx.createGain();
      g.gain.setValueAtTime(0, t);
      g.gain.linearRampToValueAtTime(amp * 0.5, t + 0.002);
      g.gain.exponentialRampToValueAtTime(0.0001, t + 0.06);
      n.connect(f).connect(g).connect(this.master!);
      n.start(t); n.stop(t + 0.08);
    }
  }

  private noise(dur: number): AudioBufferSourceNode {
    const ctx = this.ctx!;
    const rate = ctx.sampleRate;
    const len = Math.ceil(rate * dur);
    const buf = ctx.createBuffer(1, len, rate);
    const d = buf.getChannelData(0);
    for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
    const src = ctx.createBufferSource();
    src.buffer = buf;
    return src;
  }
}
