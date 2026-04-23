// BeatForge audio engine.
//
// Scheduler: per-track independent (spec §4.5). Each track has its own
// `subdivisions` count (equal steps per bar) and its own step duration.
// Bar duration derives from pattern.steps × (60/BPM); BPM is always tied
// to the main division.
//
// Kits: 808/909/707/727 (drum-machine family) + frameDrum/tabla/gamelan
// (tradition-specific synthesis). All voices map to the closed 5-voice
// set (KK/SN/HH/OH/CP); each kit provides synthesis recipes and reverb
// send level.

import { trackMeta, type KitId, type Pattern, type Velocity, type VoiceId } from '../patterns/types';

export class AudioEngine {
  ctx: AudioContext | null = null;
  master: GainNode | null = null;
  private reverb: ConvolverNode | null = null;
  private reverbSend: GainNode | null = null;

  kit: KitId = '808';
  running = false;
  pattern: Pattern | null = null;
  bpm = 120;
  swing = 0.5;
  strongAmp = 1.0;
  weakAmp = 0.5;
  // Per-group accent multipliers (spec §9 v1.3). Indexed by grouping
  // position; multiplies on top of strong/weak. Default 1.0 per group.
  groupAmps: number[] = [];

  // Public state for visuals (read each frame via rAF).
  cursors: Record<string, number> = {};   // last-triggered step per track
  bar = 0;

  // Bar-boundary callback (for trainer cycle counting, stop-after).
  onBar: ((bar: number) => void) | null = null;

  private readonly lookaheadMs = 25;
  private readonly scheduleAheadS = 0.12;
  private timerId: ReturnType<typeof setTimeout> | null = null;
  private nextNoteTimes: Record<string, number> = {};
  private nextIdx: Record<string, number> = {};
  private nextBarTime = 0;
  private startTime = 0;

  // Polyrhythm overlay — ephemeral click track at chosen subdivisions.
  overlay: { subdivisions: number } | null = null;
  private overlayNextTime = 0;
  private overlayNextIdx = 0;

  async ensureCtx(): Promise<void> {
    if (!this.ctx) {
      const Ctor = window.AudioContext
        || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      this.ctx = new Ctor();
      this.master = this.ctx.createGain();
      this.master.gain.value = this.masterVolume;

      const comp = this.ctx.createDynamicsCompressor();
      comp.threshold.value = -14;
      comp.ratio.value = 3;
      comp.attack.value = 0.003;
      comp.release.value = 0.1;
      this.master.connect(comp).connect(this.ctx.destination);

      this.reverb = this.ctx.createConvolver();
      this.reverb.buffer = this.makeImpulse(1.8, 2.2);
      this.reverbSend = this.ctx.createGain();
      this.reverbSend.gain.value = KIT_REVERB_SEND[this.kit];
      this.reverbSend.connect(this.reverb);
      const reverbReturn = this.ctx.createGain();
      reverbReturn.gain.value = 0.6;
      this.reverb.connect(reverbReturn).connect(this.master);
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

  setKit(k: KitId): void {
    this.kit = k;
    if (this.reverbSend) this.reverbSend.gain.value = KIT_REVERB_SEND[k];
  }
  setBpm(b: number): void { this.bpm = b; }

  // Master volume 0..1; persists via the master gain node.
  private masterVolume = 0.85;
  setMasterVolume(v: number): void {
    this.masterVolume = Math.max(0, Math.min(1, v));
    if (this.master) this.master.gain.value = this.masterVolume;
  }
  getMasterVolume(): number { return this.masterVolume; }
  setSwing(s: number): void { this.swing = s; }
  setAccents(strong: number, weak: number): void {
    this.strongAmp = strong;
    this.weakAmp = weak;
  }

  // Per-group accent multipliers — array indexed by grouping position
  // (0 = first group). Values outside the grouping range default to 1.0.
  setGroupAccents(amps: number[]): void {
    this.groupAmps = amps.slice();
  }

  private groupAmpForStep(idx: number): number {
    const p = this.pattern;
    if (!p || !this.groupAmps.length) return 1;
    const grouping = p.grouping;
    if (!grouping || grouping.length === 0) return 1;
    // Steps in a track cycle may exceed pattern.steps for short loops;
    // fold into the bar, then walk grouping to find the owning group.
    const folded = ((idx % p.steps) + p.steps) % p.steps;
    let acc = 0;
    for (let g = 0; g < grouping.length; g++) {
      acc += grouping[g];
      if (folded < acc) return this.groupAmps[g] ?? 1;
    }
    return this.groupAmps[grouping.length - 1] ?? 1;
  }

  loadPattern(p: Pattern): void {
    this.pattern = p;
    this.cursors = {};
    this.nextIdx = {};
    Object.keys(p.tracks).forEach((tr) => {
      this.cursors[tr] = -1;
      this.nextIdx[tr] = 0;
    });
  }

  start(countInBars = 0): void {
    if (!this.pattern || !this.ctx || this.running) return;
    this.running = true;
    const now = this.ctx.currentTime + 0.06;
    const barSec = this.pattern.steps * (60 / this.bpm);

    // Count-in: clicks at the FIRST STEP of each subgroup, with the pattern's
    // actual grouping. For 2+2+2+3 (9/8) → 4 clicks at step positions 0, 2, 4, 6
    // — unevenly spaced to reflect the grouping, not evenly spaced over the bar.
    if (countInBars > 0) {
      const stepSec = barSec / this.pattern.steps;
      const downbeatSteps: number[] = [];
      let acc = 0;
      for (const g of this.pattern.grouping) {
        downbeatSteps.push(acc);
        acc += g;
      }
      for (let bar = 0; bar < countInBars; bar++) {
        downbeatSteps.forEach((stepIdx, beatIdx) => {
          const t = now + bar * barSec + stepIdx * stepSec;
          // Beat 1 of each bar = strong; other group downbeats = medium
          this.countInClick(t, beatIdx === 0 ? 1.0 : 0.6);
        });
      }
    }

    this.startTime = now + countInBars * barSec;
    this.nextBarTime = this.startTime;
    this.bar = 0;

    Object.keys(this.pattern.tracks).forEach((tr) => {
      this.nextNoteTimes[tr] = this.startTime;
      this.nextIdx[tr] = 0;
      this.cursors[tr] = -1;
    });

    if (this.overlay) {
      this.overlayNextTime = this.startTime;
      this.overlayNextIdx = 0;
    }

    this.tick();
  }

  // Neutral count-in click — kit-independent (always a wood-like tick).
  private countInClick(when: number, amp: number): void {
    const ctx = this.ctx!;
    const osc = ctx.createOscillator();
    const g = ctx.createGain();
    osc.frequency.value = amp > 0.8 ? 2200 : 1400;
    g.gain.setValueAtTime(amp * 0.5, when);
    g.gain.exponentialRampToValueAtTime(0.0001, when + 0.03);
    osc.connect(g);
    g.connect(this.master!);
    osc.start(when);
    osc.stop(when + 0.05);
  }

  // Polyrhythm overlay click — used for the ephemeral practice overlay.
  private overlayClick(when: number): void {
    const ctx = this.ctx!;
    const osc = ctx.createOscillator();
    const g = ctx.createGain();
    osc.frequency.value = 1800;
    g.gain.setValueAtTime(0.6, when);
    g.gain.exponentialRampToValueAtTime(0.0001, when + 0.04);
    osc.connect(g);
    g.connect(this.master!);
    osc.start(when);
    osc.stop(when + 0.05);
  }

  setOverlay(cfg: { subdivisions: number } | null): void {
    this.overlay = cfg;
    if (this.running && this.ctx && cfg) {
      // Re-sync overlay to the nearest upcoming bar boundary
      this.overlayNextTime = Math.max(this.ctx.currentTime, this.nextBarTime - this.barSeconds());
      this.overlayNextIdx = 0;
    }
  }

  stop(): void {
    this.running = false;
    if (this.timerId) clearTimeout(this.timerId);
  }

  // Bar (main division) seconds — BPM = steps/min at main rate (spec §4.2).
  barSeconds(): number {
    const p = this.pattern;
    if (!p) return 0;
    return p.steps * (60 / this.bpm);
  }

  private tick = (): void => {
    if (!this.running || !this.ctx || !this.pattern) return;
    const horizon = this.ctx.currentTime + this.scheduleAheadS;
    const p = this.pattern;
    const barSec = this.barSeconds();

    for (const tr of Object.keys(p.tracks) as VoiceId[]) {
      const trackData = p.tracks[tr];
      if (!trackData) continue;
      const meta = trackMeta(trackData, p.steps);
      const stepSec = barSec / meta.subdivisions;
      const isMainDivision = meta.subdivisions === p.steps;

      while (this.nextNoteTimes[tr] < horizon) {
        let tPlay = this.nextNoteTimes[tr];

        // Swing applies only to main-division 16th-step tracks.
        if (p.stepUnit === 16 && isMainDivision && this.nextIdx[tr] % 2 === 1) {
          const swingDelay = (this.swing - 0.5) * 2 * stepSec;
          tPlay += swingDelay;
        }

        const idx = this.nextIdx[tr] % meta.cycle;
        const vel = meta.pattern[idx];
        // Per-group accents only meaningful on main-division tracks —
        // polyrhythm tracks don't align to the grouping.
        if (vel > 0) this.trigger(tr, tPlay, vel, isMainDivision ? idx : -1);

        // Visual cursor updates "now playing" step immediately
        // (audio may fire slightly in the future; visual lag is <=120ms).
        this.cursors[tr] = idx;

        this.nextNoteTimes[tr] += stepSec;
        this.nextIdx[tr] += 1;
      }
    }

    // Polyrhythm overlay scheduling (separate from pattern tracks)
    if (this.overlay) {
      const overlayStepSec = barSec / this.overlay.subdivisions;
      while (this.overlayNextTime < horizon) {
        if (this.overlayNextTime >= this.startTime) {
          this.overlayClick(this.overlayNextTime);
        }
        this.overlayNextTime += overlayStepSec;
        this.overlayNextIdx += 1;
      }
    }

    // Bar boundary — count off full bars (for trainer / stop-after).
    // Derive each bar's index from elapsed time so multiple bars scheduled
    // in one tick get unique b values (prev code captured this.bar+1, which
    // was the same for every bar in the batch because this.bar only
    // updated inside the async setTimeout — all callbacks fired with the
    // same index and the speed-trainer stalled at 1).
    while (this.nextBarTime < horizon) {
      const tBar = this.nextBarTime;
      const barIndex = Math.round((tBar - this.startTime) / barSec);
      if (barIndex > 0) {
        const b = barIndex;
        const delayMs = Math.max(0, (tBar - this.ctx.currentTime) * 1000);
        setTimeout(() => { this.bar = b; this.onBar?.(b); }, delayMs);
      }
      this.nextBarTime += barSec;
    }

    this.timerId = setTimeout(this.tick, this.lookaheadMs);
  };

  private trigger(voice: VoiceId, when: number, velLevel: Velocity, stepIdx: number): void {
    const base = velLevel === 2 ? this.strongAmp : this.weakAmp;
    const groupMul = stepIdx >= 0 ? this.groupAmpForStep(stepIdx) : 1;
    kitVoice(this, voice, when, base * groupMul);
  }

  // Helpers exposed to kit synthesis — node creation + routing.
  _createOsc(): OscillatorNode { return this.ctx!.createOscillator(); }
  _createGain(): GainNode { return this.ctx!.createGain(); }
  _createBiquad(): BiquadFilterNode { return this.ctx!.createBiquadFilter(); }

  _connect(node: AudioNode, wetAmount = 1): AudioNode {
    node.connect(this.master!);
    if (this.reverbSend) {
      const tap = this.ctx!.createGain();
      tap.gain.value = wetAmount;
      node.connect(tap).connect(this.reverbSend);
    }
    return node;
  }

  _noise(dur: number): AudioBufferSourceNode {
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

// Per-kit reverb send level (spec §4.4).
const KIT_REVERB_SEND: Record<KitId, number> = {
  '808': 0.05,
  '909': 0.05,
  '707': 0.10,
  '727': 0.12,
  frameDrum: 0.08,
  tabla: 0.15,
  gamelan: 0.35,
};

// ── Voice dispatch ──────────────────────────────────────────────────

function kitVoice(e: AudioEngine, voice: VoiceId, when: number, amp: number): void {
  const { kit } = e;
  if (kit === 'frameDrum') {
    frameDrumVoice(e, voice, when, amp);
  } else if (kit === 'tabla') {
    tablaVoice(e, voice, when, amp);
  } else if (kit === 'gamelan') {
    gamelanVoice(e, voice, when, amp);
  } else {
    drumMachineVoice(e, voice, when, amp);
  }
}

// ── 808/909/707/727 — drum-machine family ───────────────────────────

function drumMachineVoice(e: AudioEngine, voice: VoiceId, when: number, amp: number): void {
  const { kit } = e;
  const is727 = kit === '727';

  switch (voice) {
    case 'KK': {
      if (is727) {
        // Low conga: pitched sine + noise body
        const osc = e._createOsc();
        const g = e._createGain();
        osc.frequency.setValueAtTime(180, when);
        osc.frequency.exponentialRampToValueAtTime(130, when + 0.1);
        g.gain.setValueAtTime(0, when);
        g.gain.linearRampToValueAtTime(amp * 0.9, when + 0.003);
        g.gain.exponentialRampToValueAtTime(0.0001, when + 0.35);
        osc.connect(g);
        e._connect(g);
        osc.start(when); osc.stop(when + 0.4);
        return;
      }
      const osc = e._createOsc();
      const gain = e._createGain();
      const f0 = kit === '909' ? 180 : kit === '707' ? 140 : 150;
      const f1 = kit === '909' ? 42 : kit === '707' ? 55 : 40;
      const dec = kit === '909' ? 0.35 : kit === '707' ? 0.28 : 0.6;
      osc.frequency.setValueAtTime(f0, when);
      osc.frequency.exponentialRampToValueAtTime(f1, when + 0.08);
      gain.gain.setValueAtTime(0, when);
      gain.gain.linearRampToValueAtTime(amp * 1.1, when + 0.003);
      gain.gain.exponentialRampToValueAtTime(0.0001, when + dec);
      osc.connect(gain);
      e._connect(gain);
      if (kit !== '808') {
        const click = e._createOsc();
        const cg = e._createGain();
        click.frequency.value = 2400;
        click.type = 'square';
        cg.gain.setValueAtTime(amp * 0.2, when);
        cg.gain.exponentialRampToValueAtTime(0.0001, when + 0.01);
        click.connect(cg);
        e._connect(cg);
        click.start(when); click.stop(when + 0.02);
      }
      osc.start(when);
      osc.stop(when + dec + 0.05);
      return;
    }
    case 'SN': {
      if (is727) {
        // High conga: pitched sine + shorter noise
        const osc = e._createOsc();
        const g = e._createGain();
        osc.frequency.setValueAtTime(300, when);
        osc.frequency.exponentialRampToValueAtTime(220, when + 0.08);
        g.gain.setValueAtTime(0, when);
        g.gain.linearRampToValueAtTime(amp * 0.8, when + 0.003);
        g.gain.exponentialRampToValueAtTime(0.0001, when + 0.22);
        osc.connect(g);
        e._connect(g);
        osc.start(when); osc.stop(when + 0.3);
        return;
      }
      const o1 = e._createOsc();
      const o2 = e._createOsc();
      o1.frequency.value = kit === '909' ? 220 : 185;
      o2.frequency.value = kit === '909' ? 380 : 349;
      const og = e._createGain();
      og.gain.setValueAtTime(0, when);
      og.gain.linearRampToValueAtTime(amp * 0.5, when + 0.002);
      og.gain.exponentialRampToValueAtTime(0.0001, when + 0.08);
      o1.connect(og); o2.connect(og);
      e._connect(og);
      o1.start(when); o2.start(when);
      o1.stop(when + 0.12); o2.stop(when + 0.12);

      const noise = e._noise(0.18);
      const nFilt = e._createBiquad();
      nFilt.type = 'bandpass';
      nFilt.frequency.value = kit === '909' ? 2400 : 1800;
      nFilt.Q.value = 0.6;
      const ng = e._createGain();
      const dec = kit === '707' ? 0.09 : 0.15;
      ng.gain.setValueAtTime(0, when);
      ng.gain.linearRampToValueAtTime(amp * 0.7, when + 0.002);
      ng.gain.exponentialRampToValueAtTime(0.0001, when + dec);
      noise.connect(nFilt).connect(ng);
      e._connect(ng);
      noise.start(when); noise.stop(when + dec + 0.02);
      return;
    }
    case 'HH':
    case 'OH': {
      if (is727) {
        // Cowbell (closed) / Agogo (open) — pitched + filtered
        const osc = e._createOsc();
        const osc2 = e._createOsc();
        osc.type = 'square'; osc2.type = 'square';
        osc.frequency.value = voice === 'HH' ? 800 : 620;
        osc2.frequency.value = voice === 'HH' ? 540 : 420;
        const bp = e._createBiquad();
        bp.type = 'bandpass';
        bp.frequency.value = voice === 'HH' ? 1800 : 1400;
        bp.Q.value = 1.2;
        const g = e._createGain();
        const dec = voice === 'HH' ? 0.14 : 0.35;
        g.gain.setValueAtTime(0, when);
        g.gain.linearRampToValueAtTime(amp * 0.4, when + 0.001);
        g.gain.exponentialRampToValueAtTime(0.0001, when + dec);
        osc.connect(bp); osc2.connect(bp);
        bp.connect(g);
        e._connect(g);
        osc.start(when); osc2.start(when);
        osc.stop(when + dec + 0.05); osc2.stop(when + dec + 0.05);
        return;
      }
      const open = voice === 'OH';
      const dec = open ? 0.32 : 0.05;
      const noise = e._noise(dec + 0.05);
      const hp = e._createBiquad();
      hp.type = 'highpass';
      hp.frequency.value = 7000;
      const bp = e._createBiquad();
      bp.type = 'bandpass';
      bp.frequency.value = 10000;
      bp.Q.value = 1.2;
      const g = e._createGain();
      g.gain.setValueAtTime(0, when);
      g.gain.linearRampToValueAtTime(amp * 0.4, when + 0.001);
      g.gain.exponentialRampToValueAtTime(0.0001, when + dec);
      noise.connect(hp).connect(bp).connect(g);
      e._connect(g);
      noise.start(when);
      noise.stop(when + dec + 0.05);
      return;
    }
    case 'CP': {
      if (is727) {
        // Claves — short pitched click
        const osc = e._createOsc();
        const g = e._createGain();
        osc.frequency.value = 2500;
        g.gain.setValueAtTime(amp * 0.9, when);
        g.gain.exponentialRampToValueAtTime(0.0001, when + 0.03);
        osc.connect(g);
        e._connect(g);
        osc.start(when); osc.stop(when + 0.04);
        return;
      }
      for (let i = 0; i < 3; i++) {
        const t = when + i * 0.012;
        const n = e._noise(0.05);
        const f = e._createBiquad();
        f.type = 'bandpass';
        f.frequency.value = 1200;
        f.Q.value = 0.8;
        const g = e._createGain();
        g.gain.setValueAtTime(0, t);
        g.gain.linearRampToValueAtTime(amp * 0.5, t + 0.002);
        g.gain.exponentialRampToValueAtTime(0.0001, t + 0.06);
        n.connect(f).connect(g);
        e._connect(g);
        n.start(t); n.stop(t + 0.08);
      }
      return;
    }
  }
}

// ── Frame Drum (Turkish/Arabic/Persian/Balkan) ──────────────────────

function frameDrumVoice(e: AudioEngine, voice: VoiceId, when: number, amp: number): void {
  switch (voice) {
    case 'KK': {
      // Doum — deep center hit, 80→60Hz droop
      const osc = e._createOsc();
      const g = e._createGain();
      osc.frequency.setValueAtTime(82, when);
      osc.frequency.exponentialRampToValueAtTime(58, when + 0.04);
      g.gain.setValueAtTime(0, when);
      g.gain.linearRampToValueAtTime(amp * 1.0, when + 0.002);
      g.gain.exponentialRampToValueAtTime(0.0001, when + 0.28);
      osc.connect(g);
      e._connect(g, 1.2);
      osc.start(when); osc.stop(when + 0.32);
      // Body thump — short filtered noise
      const n = e._noise(0.06);
      const lp = e._createBiquad();
      lp.type = 'lowpass';
      lp.frequency.value = 180;
      const ng = e._createGain();
      ng.gain.setValueAtTime(amp * 0.35, when);
      ng.gain.exponentialRampToValueAtTime(0.0001, when + 0.06);
      n.connect(lp).connect(ng);
      e._connect(ng);
      n.start(when); n.stop(when + 0.08);
      return;
    }
    case 'SN': {
      // Tek — rim edge, bright short
      const n = e._noise(0.08);
      const bp = e._createBiquad();
      bp.type = 'bandpass';
      bp.frequency.value = 1500;
      bp.Q.value = 2.5;
      const osc = e._createOsc();
      osc.frequency.value = 880;
      const og = e._createGain();
      og.gain.setValueAtTime(amp * 0.25, when);
      og.gain.exponentialRampToValueAtTime(0.0001, when + 0.04);
      osc.connect(og);
      const ng = e._createGain();
      ng.gain.setValueAtTime(amp * 0.6, when);
      ng.gain.exponentialRampToValueAtTime(0.0001, when + 0.06);
      n.connect(bp).connect(ng);
      e._connect(ng);
      e._connect(og);
      n.start(when); n.stop(when + 0.08);
      osc.start(when); osc.stop(when + 0.06);
      return;
    }
    case 'HH': {
      // Finger snap — HP noise
      const n = e._noise(0.025);
      const hp = e._createBiquad();
      hp.type = 'highpass';
      hp.frequency.value = 6000;
      const g = e._createGain();
      g.gain.setValueAtTime(amp * 0.4, when);
      g.gain.exponentialRampToValueAtTime(0.0001, when + 0.025);
      n.connect(hp).connect(g);
      e._connect(g);
      n.start(when); n.stop(when + 0.03);
      return;
    }
    case 'OH': {
      // Zils (jingle) — three detuned sines + noise tail
      const freqs = [3100, 5200, 7300];
      freqs.forEach((f, i) => {
        const osc = e._createOsc();
        osc.type = 'sine';
        osc.frequency.value = f;
        const g = e._createGain();
        g.gain.setValueAtTime(0, when);
        g.gain.linearRampToValueAtTime(amp * (0.15 - i * 0.03), when + 0.002);
        g.gain.exponentialRampToValueAtTime(0.0001, when + 0.4);
        osc.connect(g);
        e._connect(g, 1.5);
        osc.start(when); osc.stop(when + 0.45);
      });
      const n = e._noise(0.3);
      const hp = e._createBiquad();
      hp.type = 'highpass';
      hp.frequency.value = 4000;
      const ng = e._createGain();
      ng.gain.setValueAtTime(amp * 0.12, when);
      ng.gain.exponentialRampToValueAtTime(0.0001, when + 0.3);
      n.connect(hp).connect(ng);
      e._connect(ng, 1.5);
      n.start(when); n.stop(when + 0.32);
      return;
    }
    case 'CP': {
      // Slap — filtered noise, more body than tek
      const n = e._noise(0.12);
      const bp = e._createBiquad();
      bp.type = 'bandpass';
      bp.frequency.value = 700;
      bp.Q.value = 1.2;
      const g = e._createGain();
      g.gain.setValueAtTime(amp * 0.7, when);
      g.gain.exponentialRampToValueAtTime(0.0001, when + 0.12);
      n.connect(bp).connect(g);
      e._connect(g);
      n.start(when); n.stop(when + 0.14);
      return;
    }
  }
}

// ── Tabla (Indian Hindustani) ───────────────────────────────────────

function tablaVoice(e: AudioEngine, voice: VoiceId, when: number, amp: number): void {
  switch (voice) {
    case 'KK': {
      // Ge / ghe — bayan bass with UPWARD pitch bend (the signature "wump")
      const osc = e._createOsc();
      const g = e._createGain();
      const lp = e._createBiquad();
      lp.type = 'lowpass';
      lp.frequency.value = 400;
      lp.Q.value = 6;
      osc.frequency.setValueAtTime(62, when);
      osc.frequency.linearRampToValueAtTime(92, when + 0.08);
      g.gain.setValueAtTime(0, when);
      g.gain.linearRampToValueAtTime(amp * 1.0, when + 0.002);
      g.gain.exponentialRampToValueAtTime(0.0001, when + 0.42);
      osc.connect(lp).connect(g);
      e._connect(g, 1.3);
      osc.start(when); osc.stop(when + 0.45);
      return;
    }
    case 'SN': {
      // Na / ta — dayan rim, modal resonator at ~600Hz
      const o1 = e._createOsc();
      const o2 = e._createOsc();
      o1.frequency.value = 600;
      o2.frequency.value = 1020;
      const g = e._createGain();
      g.gain.setValueAtTime(0, when);
      g.gain.linearRampToValueAtTime(amp * 0.5, when + 0.002);
      g.gain.exponentialRampToValueAtTime(0.0001, when + 0.2);
      o1.connect(g); o2.connect(g);
      e._connect(g, 1.3);
      o1.start(when); o2.start(when);
      o1.stop(when + 0.22); o2.stop(when + 0.22);
      // Attack transient
      const n = e._noise(0.02);
      const hp = e._createBiquad();
      hp.type = 'highpass';
      hp.frequency.value = 3000;
      const ng = e._createGain();
      ng.gain.setValueAtTime(amp * 0.2, when);
      ng.gain.exponentialRampToValueAtTime(0.0001, when + 0.02);
      n.connect(hp).connect(ng);
      e._connect(ng);
      n.start(when); n.stop(when + 0.03);
      return;
    }
    case 'HH': {
      // Tin — closed bell, pitched click, no ring
      const osc = e._createOsc();
      osc.frequency.value = 900;
      const g = e._createGain();
      g.gain.setValueAtTime(amp * 0.5, when);
      g.gain.exponentialRampToValueAtTime(0.0001, when + 0.04);
      osc.connect(g);
      e._connect(g);
      osc.start(when); osc.stop(when + 0.05);
      return;
    }
    case 'OH': {
      // Tun — open resonant at ~500Hz with longer decay
      const o1 = e._createOsc();
      const o2 = e._createOsc();
      o1.frequency.value = 500;
      o2.frequency.value = 980;
      const g = e._createGain();
      g.gain.setValueAtTime(0, when);
      g.gain.linearRampToValueAtTime(amp * 0.55, when + 0.002);
      g.gain.exponentialRampToValueAtTime(0.0001, when + 0.5);
      o1.connect(g); o2.connect(g);
      e._connect(g, 1.4);
      o1.start(when); o2.start(when);
      o1.stop(when + 0.52); o2.stop(when + 0.52);
      return;
    }
    case 'CP': {
      // Dha = ge + na simultaneously (composite)
      tablaVoice(e, 'KK', when, amp);
      tablaVoice(e, 'SN', when, amp);
      return;
    }
  }
}

// ── Gamelan (Indonesian metal percussion) ───────────────────────────

// Inharmonic modal resonators — partials at non-integer ratios.
function gamelanTone(e: AudioEngine, when: number, amp: number, fundamental: number, partials: number[], decay: number): void {
  partials.forEach((ratio, i) => {
    const osc = e._createOsc();
    osc.type = 'sine';
    osc.frequency.value = fundamental * ratio;
    const g = e._createGain();
    // Higher partials decay faster (classic inharmonic metal shape)
    const partialDecay = decay * (1 / (1 + i * 0.4));
    const partialAmp = amp * (0.6 / (1 + i * 0.3));
    g.gain.setValueAtTime(0, when);
    g.gain.linearRampToValueAtTime(partialAmp, when + 0.003);
    g.gain.exponentialRampToValueAtTime(0.0001, when + partialDecay);
    osc.connect(g);
    e._connect(g, 1.5);
    osc.start(when);
    osc.stop(when + partialDecay + 0.05);
  });
  // Attack transient — brief metallic click
  const n = e._noise(0.01);
  const hp = e._createBiquad();
  hp.type = 'highpass';
  hp.frequency.value = 3000;
  const ng = e._createGain();
  ng.gain.setValueAtTime(amp * 0.18, when);
  ng.gain.exponentialRampToValueAtTime(0.0001, when + 0.01);
  n.connect(hp).connect(ng);
  e._connect(ng);
  n.start(when); n.stop(when + 0.015);
}

function gamelanVoice(e: AudioEngine, voice: VoiceId, when: number, amp: number): void {
  switch (voice) {
    case 'KK': // Gong ageng — deepest, 2-3s decay
      return gamelanTone(e, when, amp * 1.1, 55, [1, 1.78, 2.72, 4.05, 6.3], 2.5);
    case 'SN': // Kenong — mid kettle
      return gamelanTone(e, when, amp * 0.9, 220, [1, 2.05, 3.1, 4.8], 0.8);
    case 'HH': // Saron pulse — bright short
      return gamelanTone(e, when, amp * 0.75, 660, [1, 2.02], 0.18);
    case 'OH': // Kempul — hanging gong, mid
      return gamelanTone(e, when, amp * 0.95, 140, [1, 1.84, 2.9, 4.2], 1.2);
    case 'CP': // Kempyang — high bell
      return gamelanTone(e, when, amp * 0.7, 1180, [1, 2.1], 0.3);
  }
}
