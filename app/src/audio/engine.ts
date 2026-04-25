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
// Vite's explicit `?worker` import emits a dedicated chunk with correct
// JS MIME — avoids the `new URL()` pattern falling back to an inlined
// data URL tagged `video/mp2t` because the source file has a .ts ext.
import SchedulerWorker from './scheduler-worker.ts?worker';

type BarListener = (bar: number) => void;

interface TrackCache {
  voiceId: VoiceId;
  subdivisions: number;
  cycle: number;
  pattern: Velocity[];
  isMainDivision: boolean;
  stepsPerBar: number; // p.steps / subdivisions — stepSec = stepsPerBar * (60/bpm)
  hasAccents: boolean; // all-zero tracks can be skipped entirely in tick()
}

export class AudioEngine {
  ctx: AudioContext | null = null;
  master: GainNode | null = null;
  // The reverb ConvolverNode is kept alive by the audio graph (master
  // chain + reverbReturn both hold it), no class field needed.
  private reverbSend: GainNode | null = null;

  kit: KitId = '808';
  running = false;
  pattern: Pattern | null = null;
  bpm = 120;
  swing = 0.5;
  strongAmp = 1.0;
  weakAmp = 0.5;

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

  // Scheduler timing. lookaheadMs is how often tick() fires; scheduleAheadS
  // is how far into Web Audio's future we queue notes. Must be sized so
  // (scheduleAhead >> lookahead) and so that a worst-case main-thread stall
  // still leaves a margin — React renders and devtools panels can freeze
  // the event loop for 100+ms on a slow device. 300ms horizon survives that.
  private readonly lookaheadMs = 15;
  private readonly scheduleAheadS = 0.30;
  // Tick cadence lives in a Worker when available (immune to React /
  // devtools / background-tab throttling). timerId is the setTimeout
  // fallback when Worker construction fails.
  private worker: Worker | null = null;
  private workerFailed = false;
  private timerId: ReturnType<typeof setTimeout> | null = null;
  private nextNoteTimes: Record<string, number> = {};
  private nextIdx: Record<string, number> = {};
  // Anchors per track for bounded-drift derivation. nextNoteTime[tr] is
  // derived as `anchorTime + (nextIdx - anchorIdx) * stepSec` each tick
  // rather than accumulated via `+= stepSec`. Re-anchored on BPM change
  // so rate changes take effect smoothly without jumping the phase.
  private anchorTime: Record<string, number> = {};
  private anchorIdx: Record<string, number> = {};
  private nextBarTime = 0;
  private barAnchorTime = 0;
  private barAnchorIdx = 0;
  private startTime = 0;

  // Per-pattern track caches. Built once in loadPattern() so tick() avoids
  // Object.keys() + trackMeta() allocations every 15ms. Null until a
  // pattern is loaded.
  private trackCaches: TrackCache[] = [];

  // Race guard: two concurrent play clicks (or play + preview)
  // fire ensureCtx() simultaneously; without this, both would race
  // to construct an AudioContext and audio graph. Whoever wins the
  // second half wins the assignments, orphaning the first graph.
  private ctxInitPromise: Promise<void> | null = null;

  async ensureCtx(): Promise<void> {
    if (this.ctx) {
      if (this.ctx.state === 'suspended') await this.ctx.resume();
      return;
    }
    if (!this.ctxInitPromise) {
      this.ctxInitPromise = this.initCtxOnce().finally(() => {
        // Clear so a later failure (e.g. ctx got closed and needs
        // rebuilding) doesn't permanently block re-init.
        this.ctxInitPromise = null;
      });
    }
    await this.ctxInitPromise;
  }

  private async initCtxOnce(): Promise<void> {
    const Ctor = window.AudioContext
      || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    const ctx = new Ctor();
    const master = ctx.createGain();
    master.gain.value = this.masterVolume;

    const comp = ctx.createDynamicsCompressor();
    comp.threshold.value = -14;
    comp.ratio.value = 3;
    comp.attack.value = 0.003;
    comp.release.value = 0.1;
    master.connect(comp).connect(ctx.destination);

    const reverb = ctx.createConvolver();
    reverb.buffer = this.makeImpulseFor(ctx, 1.8, 2.2);
    const reverbSend = ctx.createGain();
    reverbSend.gain.value = kitRecipes[this.kit].reverbSend;
    reverbSend.connect(reverb);
    const reverbReturn = ctx.createGain();
    reverbReturn.gain.value = 0.6;
    reverb.connect(reverbReturn).connect(master);

    // Commit all references atomically — either we have a full graph
    // or none of it.
    this.ctx = ctx;
    this.master = master;
    this.reverbSend = reverbSend;

    if (ctx.state === 'suspended') await ctx.resume();
  }

  private makeImpulseFor(ctx: AudioContext, duration: number, decay: number): AudioBuffer {
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

  /** Per-track cursor for what's AUDIBLE right now — not last-scheduled.
   * The scheduler queues notes up to 300ms into Web Audio's future; the
   * cursor field (this.cursors) reflects the last-scheduled step, so
   * reading it from a rAF loop shows the visual cursor 300ms ahead of
   * the audio. This method computes what step the audio clock is
   * actually playing by inverting the anchor formula:
   *
   *   stepsSinceAnchor = floor((now - anchorTime) / stepSec)
   *   audibleIdx = (anchorIdx + stepsSinceAnchor) % cycle
   *
   * Cheap — O(tracks), called once per frame. Swing is ignored for the
   * visual (≤34ms visual lag on swung steps, below the perceptibility
   * threshold for this use case).
   */
  audibleCursors(): Record<string, number> {
    const out: Record<string, number> = {};
    if (!this.ctx || !this.running) return this.cursors;
    const now = this.ctx.currentTime;
    if (now < this.startTime) {
      // Count-in still running — no track steps audible yet.
      for (const c of this.trackCaches) out[c.voiceId] = -1;
      return out;
    }
    const beatSec = 60 / this.bpm;
    for (const c of this.trackCaches) {
      const tr = c.voiceId;
      const anchorT = this.anchorTime[tr];
      const anchorI = this.anchorIdx[tr];
      if (anchorT === undefined || anchorI === undefined) {
        out[tr] = this.cursors[tr] ?? -1;
        continue;
      }
      const stepSec = c.stepsPerBar * beatSec;
      if (stepSec <= 0) { out[tr] = -1; continue; }
      const stepsSinceAnchor = Math.floor((now - anchorT) / stepSec);
      const globalIdx = anchorI + stepsSinceAnchor;
      const cycle = c.cycle;
      out[tr] = ((globalIdx % cycle) + cycle) % cycle;
    }
    return out;
  }

  setBpm(b: number): void {
    // Re-anchor each track so the rate change takes effect from "now"
    // without jumping phase. The anchor-derive formula in tick() computes
    // nextNoteTime from (nextIdx - anchorIdx) * stepSec — if we didn't
    // re-anchor, the new stepSec would apply retroactively to every step
    // since startTime, resulting in an instant phase shift.
    if (this.running) {
      for (const tr of Object.keys(this.nextIdx)) {
        this.anchorTime[tr] = this.nextNoteTimes[tr];
        this.anchorIdx[tr] = this.nextIdx[tr];
      }
      this.barAnchorTime = this.nextBarTime;
    }
    this.bpm = b;
  }

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

  loadPattern(p: Pattern): void {
    const wasRunning = this.running;
    this.pattern = p;
    this.rebuildTrackCaches();

    if (!wasRunning) {
      // Fresh load — start() will seed nextNoteTimes + anchors from startTime.
      this.cursors = {};
      this.nextIdx = {};
      this.anchorTime = {};
      this.anchorIdx = {};
      Object.keys(p.tracks).forEach((tr) => {
        this.cursors[tr] = -1;
        this.nextIdx[tr] = 0;
      });
      return;
    }

    // Hot swap while playing: preserve scheduler phase so cell edits,
    // grouping picks, and group-accent tweaks don't snap the playhead
    // back to step 0. Tracks that existed keep their state; new tracks
    // enter at the next bar boundary (re-anchored there); removed tracks
    // are pruned so tick() doesn't touch stale entries.
    for (const tr of Object.keys(p.tracks)) {
      if (!(tr in this.nextIdx)) {
        this.nextIdx[tr] = 0;
        this.cursors[tr] = -1;
        this.nextNoteTimes[tr] = this.nextBarTime;
        this.anchorTime[tr] = this.nextBarTime;
        this.anchorIdx[tr] = 0;
      }
    }
    for (const tr of Object.keys(this.nextIdx)) {
      if (!(tr in p.tracks)) {
        delete this.nextIdx[tr];
        delete this.nextNoteTimes[tr];
        delete this.cursors[tr];
        delete this.anchorTime[tr];
        delete this.anchorIdx[tr];
      }
    }
  }

  /** Build per-track caches once per loadPattern so tick() avoids the
   * Object.keys() + trackMeta() call for every track, every 15ms. */
  private rebuildTrackCaches(): void {
    const p = this.pattern;
    this.trackCaches = [];
    if (!p) return;
    for (const voiceId of Object.keys(p.tracks) as VoiceId[]) {
      const trackData = p.tracks[voiceId];
      if (!trackData) continue;
      const meta = trackMeta(trackData, p.steps);
      if (!Number.isFinite(meta.subdivisions) || meta.subdivisions <= 0) continue;
      if (!meta.pattern || meta.pattern.length === 0) continue;
      this.trackCaches.push({
        voiceId,
        subdivisions: meta.subdivisions,
        cycle: meta.cycle,
        pattern: meta.pattern,
        isMainDivision: meta.subdivisions === p.steps,
        stepsPerBar: p.steps / meta.subdivisions,
        hasAccents: meta.pattern.some((v) => v > 0),
      });
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
    this.barAnchorTime = this.startTime;
    this.barAnchorIdx = 0;
    this.bar = 0;

    Object.keys(this.pattern.tracks).forEach((tr) => {
      this.nextNoteTimes[tr] = this.startTime;
      this.nextIdx[tr] = 0;
      this.cursors[tr] = -1;
      this.anchorTime[tr] = this.startTime;
      this.anchorIdx[tr] = 0;
    });

    this.ensureWorker();
    if (this.worker) {
      this.worker.postMessage({ type: 'start', intervalMs: this.lookaheadMs });
    }
    // Fire an immediate tick() to fill the buffer before the first worker
    // message arrives (~15ms delay). The worker/timeout chain takes over
    // from there.
    this.tick();
  }

  /** Lazily construct the scheduler worker. Falls back to setTimeout on
   * failure (older browsers, certain embed contexts, test environments). */
  private ensureWorker(): void {
    if (this.worker || this.workerFailed) return;
    try {
      const w = new SchedulerWorker();
      w.onmessage = () => this.tick();
      w.onerror = () => { /* swallow; tick() fallback handles continuity */ };
      this.worker = w;
    } catch {
      this.workerFailed = true;
    }
  }

  // Neutral count-in click — kit-independent (always a wood-like tick).
  private countInClick(when: number, amp: number): void {
    const ctx = this.ctx;
    const master = this.master;
    if (!ctx || !master) return; // pre-ensureCtx() call — no-op
    const osc = ctx.createOscillator();
    const g = ctx.createGain();
    osc.frequency.value = amp > 0.8 ? 2200 : 1400;
    g.gain.setValueAtTime(amp * 0.5, when);
    g.gain.exponentialRampToValueAtTime(0.0001, when + 0.03);
    osc.connect(g);
    g.connect(master);
    osc.start(when);
    osc.stop(when + 0.05);
  }

  stop(): void {
    this.running = false;
    if (this.timerId) {
      clearTimeout(this.timerId);
      this.timerId = null;
    }
    if (this.worker) {
      this.worker.postMessage({ type: 'stop' });
    }
  }

  /** Full teardown — use on unmount / hot-reload / test cleanup. `stop()`
   * pauses playback but keeps the Worker + AudioContext alive; `dispose()`
   * lets the GC reclaim them. Safe to call multiple times. */
  dispose(): void {
    this.stop();
    if (this.worker) {
      this.worker.terminate();
      this.worker = null;
    }
    if (this.ctx && this.ctx.state !== 'closed') {
      void this.ctx.close();
    }
    this.ctx = null;
    this.master = null;
    this.reverbSend = null;
    this.trackCaches = [];
  }

  // Bar (main division) seconds — BPM = steps/min at main rate (spec §4.2).
  barSeconds(): number {
    const p = this.pattern;
    if (!p) return 0;
    return p.steps * (60 / this.bpm);
  }

  private tick = (): void => {
    if (!this.running || !this.ctx || !this.pattern) return;
    const ctx = this.ctx;
    const horizon = ctx.currentTime + this.scheduleAheadS;
    const nowCatchUp = ctx.currentTime;
    const stepUnit = this.pattern.stepUnit;
    const swing = this.swing;
    const beatSec = 60 / this.bpm;
    const caches = this.trackCaches;

    // Per-track scheduling — iterate pre-computed caches (no per-tick
    // Object.keys or trackMeta allocations).
    for (let ci = 0; ci < caches.length; ci++) {
      const c = caches[ci];
      const tr = c.voiceId;
      if (!c.hasAccents) continue; // skip silent tracks entirely
      const stepSec = c.stepsPerBar * beatSec; // (steps/subdiv) * (60/bpm)

      // Catch-up: if a main-thread stall pushed us past nextNoteTimes
      // (tick fired late), snap up to the audio clock so Web Audio
      // doesn't silently drop notes scheduled in the past. Also re-anchor
      // so subsequent derive-from-anchor math stays consistent.
      if (this.nextNoteTimes[tr] < nowCatchUp) {
        this.nextNoteTimes[tr] = nowCatchUp + 0.005;
        this.anchorTime[tr] = this.nextNoteTimes[tr];
        this.anchorIdx[tr] = this.nextIdx[tr];
      }

      while (this.nextNoteTimes[tr] < horizon) {
        let tPlay = this.nextNoteTimes[tr];

        // Swing applies only to main-division 16th-step tracks.
        if (stepUnit === 16 && c.isMainDivision && (this.nextIdx[tr] % 2 === 1)) {
          tPlay += (swing - 0.5) * 2 * stepSec;
        }

        const idx = this.nextIdx[tr] % c.cycle;
        const vel = c.pattern[idx];
        if (vel > 0) this.trigger(tr, tPlay, vel);

        this.cursors[tr] = idx;

        // Anchor-derive next note time — `anchor + (idx - anchorIdx) * stepSec`
        // rather than `+= stepSec` — so cumulative float-add drift stays
        // bounded across long sessions. Re-anchors happen on setBpm() and
        // on catch-up, so this formula is always correct for the current
        // BPM segment.
        this.nextIdx[tr] += 1;
        this.nextNoteTimes[tr] = this.anchorTime[tr]
          + (this.nextIdx[tr] - this.anchorIdx[tr]) * stepSec;
      }
    }

    // Bar boundary — count off full bars (for trainer / stop-after).
    // Uses the same anchor-derive pattern: barIndex is computed relative to
    // barAnchor (not startTime), so a setBpm mid-session doesn't retroactively
    // rewrite bar numbering. Multiple bars scheduled in one tick all get
    // correct, unique indices.
    const barSec = this.pattern.steps * beatSec;
    while (this.nextBarTime < horizon) {
      const tBar = this.nextBarTime;
      const barIndex = Math.round((tBar - this.barAnchorTime) / barSec) + this.barAnchorIdx;
      if (barIndex > 0) {
        const b = barIndex;
        const delayMs = Math.max(0, (tBar - ctx.currentTime) * 1000);
        setTimeout(() => {
          this.bar = b;
          for (const fn of [...this.barListeners]) {
            try { fn(b); } catch { /* isolate */ }
          }
        }, delayMs);
      }
      this.nextBarTime = this.barAnchorTime
        + (barIndex + 1 - this.barAnchorIdx) * barSec;
    }

    // Re-arm only when the worker isn't available — it drives the cadence
    // otherwise via postMessage('tick').
    if (!this.worker) {
      this.timerId = setTimeout(this.tick, this.lookaheadMs);
    }
  };

  private trigger(voice: VoiceId, when: number, velLevel: Velocity): void {
    const amp = velLevel === 2 ? this.strongAmp : this.weakAmp;
    // Dispatch into the kit registry. Pre-ensureCtx() calls are ignored
    // (ctx is null) — scheduler won't reach this path before start().
    if (!this.ctx || !this.master) return;
    const vc = buildVoiceCtx(this.ctx, this.master, this.reverbSend);
    kitRecipes[this.kit].voices[voice](vc, when, amp);
  }
}
