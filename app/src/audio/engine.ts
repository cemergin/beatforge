// AudioEngine — Practice / Library / legacy-Studio audio runtime.
//
// Owns the audio plane:
//   - AudioContext lifecycle, master + dynamics + reverb send
//   - Kit voice dispatch (via audio/kits/ recipes)
//
// Delegates the control plane to modules/sequencer:
//   - All BPM / swing / accents state
//   - Per-row anchor-derive scheduling math
//   - Cooperative catch-up after stalls
//   - Bar / Step / Trigger / Transport emission
//
// Pattern.tracks (voice-keyed) are translated into the sequencer's
// positional rows on every loadPattern. The row order is fixed by
// ALL_VOICES so a track's row index is stable across hot swaps —
// preserves phase when the user edits cells mid-playback.

import {
  ALL_VOICES,
  trackMeta,
  type KitId,
  type Pattern,
  type Velocity,
  type VoiceId,
} from '../patterns/types';
import { buildVoiceCtx, kitRecipes } from './kits';
import { createAudioContext } from './audio-context';
import { makeEventBus, type EventBus, type Unsubscribe } from '../modules/events';
import { makeSequencer, type Sequence, type Sequencer, type Step } from '../modules/sequencer';
import SchedulerWorker from './scheduler-worker.ts?worker';

type BarListener = (bar: number) => void;

interface TrackCache {
  voiceId: VoiceId;
  /** Position in the sequencer's rows[] array — stable across hot
   *  swaps because it's derived from ALL_VOICES order, not the
   *  pattern's track keys. */
  rowIdx: number;
  cycle: number;
  isMainDivision: boolean;
}

const CHANNEL_TRIGGER_ADDRESS = /^channel\.(\d+)$/;

export class AudioEngine {
  // ── Audio graph ─────────────────────────────────────────────────
  private ctx: AudioContext | null = null;
  private master: GainNode | null = null;
  private reverbSend: GainNode | null = null;
  private masterVolume = 0.85;

  // ── Pattern state (public surface) ──────────────────────────────
  private _kit: KitId = '808';
  private _pattern: Pattern | null = null;
  private _bpm = 120;
  private _swing = 0.5;
  private _strongAmp = 1.0;
  private _weakAmp = 0.5;

  // Voice-keyed caches the audibleCursors getter walks.
  private trackCaches: TrackCache[] = [];

  // ── Control plane ──────────────────────────────────────────────
  private bus: EventBus | null = null;
  private sequencer: Sequencer | null = null;
  private triggerSub: Unsubscribe | null = null;
  private barSub: Unsubscribe | null = null;

  // Bar-boundary listeners. Multiple modes can subscribe concurrently —
  // Practice + legacy Studio + the trainer all want to hear bar
  // boundaries independently. Fed by a BarEvent subscription on the
  // bus.
  private barListeners = new Set<BarListener>();

  // ── Scheduler driver ───────────────────────────────────────────
  private readonly lookaheadMs = 15;
  private readonly scheduleAheadS = 0.30;
  private worker: Worker | null = null;
  private workerFailed = false;
  private timerId: ReturnType<typeof setTimeout> | null = null;
  private ctxInitPromise: Promise<void> | null = null;

  // ── Public read-only getters ───────────────────────────────────
  get kit(): KitId { return this._kit; }
  get running(): boolean { return this.sequencer?.running() ?? false; }
  get pattern(): Pattern | null { return this._pattern; }
  get bpm(): number { return this._bpm; }
  get swing(): number { return this._swing; }
  get strongAmp(): number { return this._strongAmp; }
  get weakAmp(): number { return this._weakAmp; }
  get bar(): number { return this.sequencer?.audibleBar() ?? 0; }
  /** Last-scheduled cursors. Kept for back-compat; new callers
   *  should use audibleCursors() instead. */
  get cursors(): Readonly<Record<string, number>> { return this.audibleCursors(); }

  /** Lazily-constructed event bus. */
  getEventBus(): EventBus {
    if (!this.bus) this.bus = makeEventBus();
    return this.bus;
  }

  /** Subscribe to bar-boundary events. Returns unsubscribe fn. */
  subscribeOnBar(fn: BarListener): () => void {
    this.barListeners.add(fn);
    return () => { this.barListeners.delete(fn); };
  }

  async ensureCtx(): Promise<void> {
    if (this.ctx) {
      if (this.ctx.state === 'suspended') await this.ctx.resume();
      return;
    }
    if (!this.ctxInitPromise) {
      this.ctxInitPromise = this.initCtxOnce().finally(() => {
        this.ctxInitPromise = null;
      });
    }
    await this.ctxInitPromise;
  }

  private async initCtxOnce(): Promise<void> {
    const ctx = createAudioContext();
    if (!ctx) return;
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
    reverbSend.gain.value = kitRecipes[this._kit].reverbSend;
    reverbSend.connect(reverb);
    const reverbReturn = ctx.createGain();
    reverbReturn.gain.value = 0.6;
    reverb.connect(reverbReturn).connect(master);

    this.ctx = ctx;
    this.master = master;
    this.reverbSend = reverbSend;

    // Build the sequencer + wire its bus to this engine. Subscribe to
    // TriggerEvent so kit voices fire when the sequencer says so;
    // subscribe to BarEvent so legacy bar listeners keep getting fed.
    const bus = this.getEventBus();
    const sequencer = makeSequencer({
      bus,
      clock: () => ctx.currentTime,
      scheduleAheadS: this.scheduleAheadS,
    });
    this.sequencer = sequencer;
    this.triggerSub = bus.on('trigger', (event) => this.handleTrigger(event));
    this.barSub = bus.on('bar', (event) => this.handleBar(event));

    // Replay shadow state.
    sequencer.setBpm(this._bpm);
    sequencer.setStepUnit(this._pattern?.stepUnit ?? 16);
    sequencer.setStepsPerBar(this._pattern?.steps ?? 16);
    sequencer.setSwing(this._swing);
    sequencer.setAccents(this._strongAmp, this._weakAmp);
    sequencer.setRowCount(ALL_VOICES.length);
    if (this._pattern) {
      sequencer.setSequence(this.buildSequence(this._pattern));
    }

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

  /** TriggerEvent handler — maps `channel.<n>` back to the voiceId
   *  in ALL_VOICES[n] and fires the kit recipe's voice renderer. */
  private handleTrigger(event: { target: string; when: number; velocity: number }): void {
    const m = CHANNEL_TRIGGER_ADDRESS.exec(event.target);
    if (!m || !this.ctx || !this.master) return;
    const idx = parseInt(m[1], 10);
    const voiceId = ALL_VOICES[idx];
    if (!voiceId) return;
    const vc = buildVoiceCtx(this.ctx, this.master, this.reverbSend);
    kitRecipes[this._kit].voices[voiceId](vc, event.when, event.velocity);
  }

  /** BarEvent handler — fans out to subscribed bar listeners on a
   *  short timer aligned with the audible time so the trainer's
   *  visible bar count matches what the user hears. */
  private handleBar(event: { bar: number; when: number }): void {
    if (!this.ctx) return;
    const delayMs = Math.max(0, (event.when - this.ctx.currentTime) * 1000);
    const bar = event.bar;
    setTimeout(() => {
      for (const fn of [...this.barListeners]) {
        try { fn(bar); } catch { /* isolate handlers */ }
      }
    }, delayMs);
  }

  setKit(k: KitId): void {
    this._kit = k;
    if (this.reverbSend) this.reverbSend.gain.value = kitRecipes[k].reverbSend;
  }

  /** Per-track cursor for what's AUDIBLE right now — not last-scheduled.
   *  Maps each cached voice id to its sequencer row + asks the
   *  sequencer for the audible step. */
  audibleCursors(): Record<string, number> {
    const out: Record<string, number> = {};
    if (!this.sequencer) {
      for (const c of this.trackCaches) out[c.voiceId] = -1;
      return out;
    }
    for (const c of this.trackCaches) {
      out[c.voiceId] = this.sequencer.audibleStepFor(c.rowIdx);
    }
    return out;
  }

  setBpm(b: number): void {
    // Practice's BPM convention: `b` is "main steps per minute" so
    // barSeconds = steps * (60 / bpm). The sequencer uses quarter-
    // BPM internally — convert at the boundary.
    this._bpm = b;
    const stepUnit = this._pattern?.stepUnit ?? 16;
    this.sequencer?.setBpm(quarterBpmFromMainStep(b, stepUnit));
  }

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

  setSwing(s: number): void {
    this._swing = s;
    this.sequencer?.setSwing(s);
  }
  setAccents(strong: number, weak: number): void {
    this._strongAmp = strong;
    this._weakAmp = weak;
    this.sequencer?.setAccents(strong, weak);
  }

  loadPattern(p: Pattern): void {
    this._pattern = p;
    this.rebuildTrackCaches();
    if (!this.sequencer) return;
    this.sequencer.setStepUnit(p.stepUnit);
    this.sequencer.setStepsPerBar(p.steps);
    // Re-apply BPM under the new pattern's stepUnit — the conversion
    // factor changes when stepUnit changes.
    this.sequencer.setBpm(quarterBpmFromMainStep(this._bpm, p.stepUnit));
    this.sequencer.setSequence(this.buildSequence(p));
  }

  /** Cache voice-id → row-index pairs + cycle metadata for cursor
   *  reads. Row order matches ALL_VOICES so re-loads keep stable
   *  positions; tracks the pattern doesn't include get an empty
   *  row (which the sequencer harmlessly ticks past). */
  private rebuildTrackCaches(): void {
    const p = this._pattern;
    this.trackCaches = [];
    if (!p) return;
    for (let i = 0; i < ALL_VOICES.length; i++) {
      const voiceId = ALL_VOICES[i];
      const trackData = p.tracks[voiceId];
      if (!trackData) continue;
      const meta = trackMeta(trackData, p.steps);
      if (!Number.isFinite(meta.subdivisions) || meta.subdivisions <= 0) continue;
      if (!meta.pattern || meta.pattern.length === 0) continue;
      this.trackCaches.push({
        voiceId,
        rowIdx: i,
        cycle: meta.cycle,
        isMainDivision: meta.subdivisions === p.steps,
      });
    }
  }

  /** Translate Pattern.tracks into the sequencer's positional rows.
   *  Row index = ALL_VOICES position (stable across hot swaps).
   *  Tracks with cycle ≠ subdivisions get expanded so the row's
   *  ringSteps reflects the cycle. Rows for absent voices are []. */
  private buildSequence(p: Pattern): Sequence {
    const out: Step[][] = [];
    for (const voiceId of ALL_VOICES) {
      const trackData = p.tracks[voiceId];
      if (!trackData) { out.push([]); continue; }
      const meta = trackMeta(trackData, p.steps);
      if (!meta.pattern || meta.pattern.length === 0) { out.push([]); continue; }
      // Expand the pattern across `cycle` steps if cycle > pattern.length.
      // For most tracks cycle === pattern.length; the expansion handles
      // the few patterns that use cycle as a "loop length × shorter
      // pattern" shorthand.
      const cycle = meta.cycle;
      const row: Step[] = [];
      for (let i = 0; i < cycle; i++) {
        row.push((meta.pattern[i % meta.pattern.length] ?? 0) as Step);
      }
      out.push(row);
    }
    return out;
  }

  /** Bar (main division) seconds — kept on Practice's convention so
   *  callers (useMetronome, trainer-time-mode) see the familiar
   *  `steps * (60 / bpm)` formula even though the sequencer
   *  internally works in quarter-BPM. */
  barSeconds(): number {
    if (!this._pattern) return 0;
    return this._pattern.steps * (60 / this._bpm);
  }

  start(countInBars = 0): void {
    if (!this.pattern || !this.ctx || !this.sequencer || this.sequencer.running()) return;
    const ctx = this.ctx;
    // Use Practice's main-step BPM convention for count-in math —
    // matches the sequencer's actual scheduling (which we converted
    // via quarterBpmFromMainStep on setBpm) AND keeps existing
    // count-in tests passing.
    const barSec = this.barSeconds();
    const stepSec = barSec / this.pattern.steps;
    const headRoom = ctx.currentTime + 0.06;

    // Count-in: clicks at the FIRST STEP of each subgroup, with the
    // pattern's actual grouping (e.g. 9/8 = 2+2+2+3).
    if (countInBars > 0) {
      const downbeatSteps: number[] = [];
      let acc = 0;
      for (const g of this.pattern.grouping) {
        downbeatSteps.push(acc);
        acc += g;
      }
      for (let bar = 0; bar < countInBars; bar++) {
        downbeatSteps.forEach((stepIdx, beatIdx) => {
          const t = headRoom + bar * barSec + stepIdx * stepSec;
          this.countInClick(t, beatIdx === 0 ? 1.0 : 0.6);
        });
      }
    }

    this.sequencer.play({ startTime: headRoom, countInBars });
    this.ensureWorker();
    if (this.worker) {
      this.worker.postMessage({ type: 'start', intervalMs: this.lookaheadMs });
    }
    // Pre-fill before the first worker tick arrives (~15 ms latency).
    this.tick();
  }

  /** Lazily construct the scheduler worker. Falls back to setTimeout
   *  on failure (older browsers, certain embed contexts, test envs). */
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

  private tick = (): void => {
    if (!this.sequencer || !this.sequencer.running()) return;
    this.sequencer.tick();
    if (!this.worker) {
      this.timerId = setTimeout(this.tick, this.lookaheadMs);
    }
  };

  /** Neutral count-in click — kit-independent (always a wood-like tick). */
  private countInClick(when: number, amp: number): void {
    const ctx = this.ctx;
    const master = this.master;
    if (!ctx || !master) return;
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
    this.sequencer?.stop();
    if (this.timerId) {
      clearTimeout(this.timerId);
      this.timerId = null;
    }
    if (this.worker) {
      this.worker.postMessage({ type: 'stop' });
    }
  }

  /** Full teardown — use on unmount / hot-reload / test cleanup. */
  dispose(): void {
    this.stop();
    if (this.triggerSub) { this.triggerSub(); this.triggerSub = null; }
    if (this.barSub) { this.barSub(); this.barSub = null; }
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
    this.sequencer = null;
  }
}

// Re-export Velocity for callers that imported it from this module.
export type { Velocity };

/** Practice's BPM is "main-step BPM" (a step at the pattern's
 *  stepUnit per minute) so 16-step pattern at bpm=120 → 0.5 sec/step.
 *  The sequencer uses quarter-BPM (240 / (bpm * stepUnit) per step)
 *  so for the SAME audio cadence we need bpm = mainStep * 4 / stepUnit:
 *
 *    main-step bpm 120 + stepUnit 16 → quarter bpm 30
 *      sequencer stepSec = 240 / (30 * 16) = 0.5 ✓
 *    main-step bpm 120 + stepUnit 8  → quarter bpm 60
 *      sequencer stepSec = 240 / (60 * 8) = 0.5 ✓ (an eighth at this BPM)
 */
function quarterBpmFromMainStep(mainStepBpm: number, stepUnit: number): number {
  return mainStepBpm * 4 / stepUnit;
}
