// BeatForge audio engine.
//
// Scheduler: per-track independent (spec §4.5). Each track has its own
// `subdivisions` count (equal steps per bar) and its own step duration.
// Bar duration derives from pattern.steps × (60/BPM); BPM is always tied
// to the main division.
//
// Kit synthesis lives in `./kits/`. The engine owns the master bus +
// reverb send + scheduler + dispatch; each kit provides a KitRecipe
// keyed by VoiceId. Adding a kit doesn't touch this file.

import { trackMeta, type KitId, type Pattern, type Velocity, type VoiceId } from '../patterns/types';
import { buildVoiceCtx, kitRecipes } from './kits';

type BarListener = (bar: number) => void;

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

  // Bar-boundary listeners. Multiple modes can subscribe concurrently —
  // prevents the "last-mode-wins" race where Practice unmount stripped
  // Studio's handler.
  private barListeners = new Set<BarListener>();

  /** Subscribe to bar-boundary events. Returns unsubscribe fn. */
  subscribeOnBar(fn: BarListener): () => void {
    this.barListeners.add(fn);
    return () => { this.barListeners.delete(fn); };
  }

  /** Legacy single-listener shim. Prefer subscribeOnBar(). */
  private legacyBarListener: BarListener | null = null;
  get onBar(): BarListener | null { return this.legacyBarListener; }
  set onBar(fn: BarListener | null) {
    if (this.legacyBarListener) this.barListeners.delete(this.legacyBarListener);
    this.legacyBarListener = fn;
    if (fn) this.barListeners.add(fn);
  }

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
      this.reverbSend.gain.value = kitRecipes[this.kit].reverbSend;
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
    if (this.reverbSend) this.reverbSend.gain.value = kitRecipes[k].reverbSend;
  }
  setBpm(b: number): void { this.bpm = b; }

  // Master volume 0..1; persists via the master gain node.
  // Uses a short linear ramp to avoid the click/pop of an abrupt gain jump.
  private masterVolume = 0.85;
  setMasterVolume(v: number): void {
    this.masterVolume = Math.max(0, Math.min(1, v));
    if (this.master && this.ctx) {
      const now = this.ctx.currentTime;
      const g = this.master.gain;
      g.cancelScheduledValues(now);
      g.setValueAtTime(g.value, now);
      g.linearRampToValueAtTime(this.masterVolume, now + 0.015);
    }
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
    const wasRunning = this.running;
    this.pattern = p;

    if (!wasRunning) {
      // Fresh load — start() will seed nextNoteTimes from startTime.
      this.cursors = {};
      this.nextIdx = {};
      Object.keys(p.tracks).forEach((tr) => {
        this.cursors[tr] = -1;
        this.nextIdx[tr] = 0;
      });
      return;
    }

    // Hot swap while playing: preserve scheduler phase so cell edits,
    // grouping picks, and group-accent tweaks don't snap the playhead
    // back to step 0. Tracks that existed keep their nextIdx/nextNoteTimes;
    // new tracks enter at the next bar boundary; removed tracks are pruned
    // so tick() doesn't touch stale entries.
    for (const tr of Object.keys(p.tracks)) {
      if (!(tr in this.nextIdx)) {
        this.nextIdx[tr] = 0;
        this.cursors[tr] = -1;
        this.nextNoteTimes[tr] = this.nextBarTime;
      }
    }
    for (const tr of Object.keys(this.nextIdx)) {
      if (!(tr in p.tracks)) {
        delete this.nextIdx[tr];
        delete this.nextNoteTimes[tr];
        delete this.cursors[tr];
      }
    }
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
    // Refuse invalid subdivision counts — prevents div-by-zero in tick().
    if (cfg && (!Number.isFinite(cfg.subdivisions) || cfg.subdivisions <= 0)) {
      this.overlay = null;
      return;
    }
    this.overlay = cfg;
    if (this.running && this.ctx && cfg) {
      // Snap to the next bar boundary (nextBarTime), not the previous one.
      // The old code subtracted barSeconds() which yielded a past timestamp
      // and forced a catch-up burst of immediate clicks.
      this.overlayNextTime = Math.max(this.ctx.currentTime + 0.02, this.nextBarTime);
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
      // Guard against malformed data causing div-by-zero → infinite loop.
      if (!Number.isFinite(meta.subdivisions) || meta.subdivisions <= 0) continue;
      if (!meta.pattern || meta.pattern.length === 0) continue;
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
        setTimeout(() => {
          this.bar = b;
          // Dispatch to every subscriber. Snapshot to iterate so listeners
          // can safely unsubscribe during callback.
          for (const fn of [...this.barListeners]) {
            try { fn(b); } catch { /* isolate — one bad listener shouldn't kill the rest */ }
          }
        }, delayMs);
      }
      // Derive next bar time from startTime + (barIndex+1)*barSec instead
      // of `+= barSec` so cumulative float-add drift stays bounded across
      // long sessions / high BPMs.
      this.nextBarTime = this.startTime + (barIndex + 1) * barSec;
    }

    this.timerId = setTimeout(this.tick, this.lookaheadMs);
  };

  private trigger(voice: VoiceId, when: number, velLevel: Velocity, stepIdx: number): void {
    const base = velLevel === 2 ? this.strongAmp : this.weakAmp;
    const groupMul = stepIdx >= 0 ? this.groupAmpForStep(stepIdx) : 1;
    // Dispatch into the kit registry. Pre-ensureCtx() calls are ignored
    // (ctx is null) — scheduler won't reach this path before start().
    if (!this.ctx || !this.master) return;
    const vc = buildVoiceCtx(this.ctx, this.master, this.reverbSend);
    kitRecipes[this.kit].voices[voice](vc, when, base * groupMul);
  }
}
