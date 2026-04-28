// SoundEngine — audio runtime for the Sound page.
//
// Owns the audio plane:
//   - AudioContext lifecycle
//   - Master gain + analyser
//   - Master reverb + delay (ControllableModules from machines/fx)
//   - Per-channel ChannelStrips with color FX slot
//   - Voice machine triggering (subscribes to TriggerEvent)
//
// Delegates the control plane to modules/sequencer:
//   - All BPM / stepUnit / stepsPerBar / swing / accents state
//   - The look-ahead tick loop (worker still drives the cadence —
//     SoundEngine pumps sequencer.tick() on each worker message)
//   - Bar / Step / Trigger / Transport emission on the bus
//
// The audio side and the control side talk through TriggerEvent.
// The sequencer emits at addresses like `channel.0`; SoundEngine
// subscribes via the bus, looks up the matching machine cfg + strip,
// and calls triggerVoice. Same flow MIDI input will use later.

import { triggerVoice } from '../machines/registry';
import type { MachineConfig, VoiceCtx } from '../machines/types';
import { createAudioContext, resumeIfSuspended } from '../audio-context';
import type { ChannelEffects, ColorFx } from '../../patterns/types-sound';
import { ChannelStrip, type ChannelStripParams } from './ChannelStrip';
import { buildColorFxModule, createDelayFx, createReverb } from '../machines/fx';
import type { ControllableModule } from '../../modules/audio-graph';
import { makeEventBus, type EventBus, type Unsubscribe } from '../../modules/events';
import {
  ALL_VOICES,
  trackMeta,
  type KitId,
  type Pattern,
} from '../../patterns/types';
import { buildKitMachine, KIT_REVERB_SEND } from './kit-presets';
import { parseTimeSigDenom } from '../tempo';
import { makeSequencer, type Sequencer } from '../../modules/sequencer';
import SchedulerWorker from '../scheduler-worker.ts?worker';

const NUM_CHANNELS = 5;

/** Step cell value: 0 = off, 1 = on (weak), 2 = accent (strong). */
export type SoundStep = 0 | 1 | 2;
/** [channelIdx][stepIdx] grid. Outer length = NUM_CHANNELS. */
export type SoundSequence = SoundStep[][];

/** Match `channel.<n>` exactly — the Sequencer's default trigger
 *  address tree. Anchored so a deeper target like
 *  `channel.0.machine.pitch` (a ParamEvent target) doesn't accidentally
 *  trip the trigger handler. */
const CHANNEL_TRIGGER_ADDRESS = /^channel\.(\d+)$/;

export class SoundEngine {
  // ── Audio graph ─────────────────────────────────────────────────
  private ctx: AudioContext | null = null;
  private master: GainNode | null = null;
  private analyser: AnalyserNode | null = null;
  private revBus: GainNode | null = null;
  private dlyBus: GainNode | null = null;
  private reverbFx: ControllableModule | null = null;
  private delayFx: ControllableModule | null = null;
  private strips: ChannelStrip[] = [];
  private ctxInitPromise: Promise<void> | null = null;

  // Live machine configs the trigger handler reads on every fire.
  private machines: MachineConfig[] = [];

  // ── Pattern-shape state (Practice / Library / legacy Studio) ───
  // Shadow of the most recently loaded Pattern + active KitId. This
  // lets the engine speak BOTH dialects — Sound's positional Channel
  // model and Practice's voice-keyed Pattern model — through one
  // class. setKit() reapplies kit-preset machines to channels;
  // audibleCursors() reports voice-keyed cursors.
  private _kit: KitId = '808';
  private _pattern: Pattern | null = null;

  // ── Control plane ──────────────────────────────────────────────
  private bus: EventBus | null = null;
  private sequencer: Sequencer | null = null;
  private triggerSub: Unsubscribe | null = null;
  private barSub: Unsubscribe | null = null;
  /** Bar listeners — Practice's trainer subscribes to these to drive
   *  the BPM ramp on bar boundaries. Fed by a BarEvent subscription
   *  on the bus (set up in initCtxOnce). */
  private barListeners = new Set<(bar: number) => void>();

  // Shadow state — preserves setter values across ctx init.
  private _bpm = 110;
  private _stepsPerBar = 16;
  private _stepUnit: 4 | 8 | 16 = 16;
  private _grouping: number[] = [16];
  private _sequence: SoundSequence = [];
  private _swing = 0.5;
  private _strongAmp = 1.0;
  private _weakAmp = 0.55;

  // ── Scheduler driver ───────────────────────────────────────────
  private readonly lookaheadMs = 15;
  private readonly scheduleAheadS = 0.30;
  private worker: Worker | null = null;
  private workerFailed = false;
  private timerId: ReturnType<typeof setTimeout> | null = null;

  // ── Read-only state ────────────────────────────────────────────
  get running(): boolean { return this.sequencer?.running() ?? false; }
  get bpm(): number { return this._bpm; }
  get stepsPerBar(): number { return this._stepsPerBar; }
  get stepUnit(): 4 | 8 | 16 { return this._stepUnit; }
  get swing(): number { return this._swing; }
  get kit(): KitId { return this._kit; }
  get pattern(): Pattern | null { return this._pattern; }
  /** Pattern-mode bar getter — proxies the sequencer's audibleBar.
   *  Kept distinct from `audibleBar()` (function form) for symmetry
   *  with the legacy AudioEngine.bar getter. */
  get bar(): number { return this.audibleBar(); }
  get strongAmp(): number { return this._strongAmp; }
  get weakAmp(): number { return this._weakAmp; }
  /** Voice-keyed cursors — what audible step each ALL_VOICES row is
   *  on right now. Practice + Library reads this from a rAF loop to
   *  drive per-track playheads. -1 when not playing. */
  get cursors(): Readonly<Record<string, number>> { return this.audibleCursors(); }

  /** Lazily-constructed event bus. UI / router / MIDI subscribe here.
   *  Same instance returned on every call so subscriptions stick. */
  getEventBus(): EventBus {
    if (!this.bus) this.bus = makeEventBus();
    return this.bus;
  }

  /** Resume / construct the AudioContext on first user interaction.
   *  Safe to call concurrently — second caller awaits the first's
   *  in-flight promise. */
  async ensureCtx(): Promise<void> {
    if (this.ctx) {
      await resumeIfSuspended(this.ctx);
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
    master.gain.value = 0.85;
    const analyser = ctx.createAnalyser();
    analyser.fftSize = 1024;
    analyser.smoothingTimeConstant = 0.78;
    master.connect(analyser);
    analyser.connect(ctx.destination);

    const revBus = ctx.createGain();
    const dlyBus = ctx.createGain();

    const reverbFx = createReverb(ctx, { wet: 0.5, size: 1.8, decay: 2.2 });
    const delayFx  = createDelayFx(ctx, { wet: 0.5, time: 0.25, feedback: 0.35 });

    if (reverbFx.input)  revBus.connect(reverbFx.input);
    if (reverbFx.output) reverbFx.output.connect(master);
    if (delayFx.input)   dlyBus.connect(delayFx.input);
    if (delayFx.output)  delayFx.output.connect(master);

    const strips: ChannelStrip[] = [];
    for (let i = 0; i < NUM_CHANNELS; i++) {
      strips.push(new ChannelStrip(ctx, master, revBus, dlyBus, buildColorFxModule));
    }

    this.ctx = ctx;
    this.master = master;
    this.analyser = analyser;
    this.revBus = revBus;
    this.dlyBus = dlyBus;
    this.reverbFx = reverbFx;
    this.delayFx = delayFx;
    this.strips = strips;

    // Build the sequencer wired to this engine's bus + clock. Subscribe
    // to TriggerEvent so the audio plane reacts to the control plane.
    const bus = this.getEventBus();
    const sequencer = makeSequencer({
      bus,
      clock: () => ctx.currentTime,
      scheduleAheadS: this.scheduleAheadS,
    });
    this.sequencer = sequencer;
    this.triggerSub = bus.on('trigger', (event) => this.handleTrigger(event));
    // Fan BarEvents out to legacy bar listeners so Practice's trainer
    // keeps working with subscribeOnBar(fn). The setTimeout aligns the
    // fire to the audible time so the trainer's visible bar count
    // matches what the user hears.
    this.barSub = bus.on('bar', (event) => {
      if (!this.ctx) return;
      const delayMs = Math.max(0, (event.when - this.ctx.currentTime) * 1000);
      const bar = event.bar;
      setTimeout(() => {
        for (const fn of [...this.barListeners]) {
          try { fn(bar); } catch { /* isolate handlers */ }
        }
      }, delayMs);
    });

    // Replay shadow state onto the sequencer so any setBpm / setStepUnit
    // / setSwing / setAccents / setSequence calls made before ensureCtx
    // take effect now.
    sequencer.setBpm(this._bpm);
    sequencer.setStepUnit(this._stepUnit);
    sequencer.setStepsPerBar(this._stepsPerBar);
    sequencer.setSwing(this._swing);
    sequencer.setAccents(this._strongAmp, this._weakAmp);
    sequencer.setRowCount(strips.length);
    if (this._sequence.length > 0) sequencer.setSequence(this._sequence);
  }

  /** Dispatch a TriggerEvent to the right voice + strip. The
   *  sequencer emits at `channel.<n>`; deeper-addressed events (a
   *  ParamEvent for `channel.0.color.cutoff`) are NOT triggers and
   *  pass right through this regex. */
  private handleTrigger(event: { target: string; when: number; velocity: number }): void {
    const m = CHANNEL_TRIGGER_ADDRESS.exec(event.target);
    if (!m || !this.ctx) return;
    const ch = parseInt(m[1], 10);
    const cfg = this.machines[ch];
    const strip = this.strips[ch];
    if (!cfg || !strip) return;
    const vc: VoiceCtx = { ctx: this.ctx, destination: strip.input };
    triggerVoice(cfg, vc, event.when, event.velocity);
  }

  /** Grow or shrink the strips array AND the sequencer's row count. */
  private ensureStripCount(n: number): void {
    if (!this.ctx || !this.master) return;
    const target = Math.max(0, Math.floor(n));
    while (this.strips.length < target) {
      this.strips.push(new ChannelStrip(
        this.ctx, this.master, this.revBus, this.dlyBus, buildColorFxModule,
      ));
    }
    while (this.strips.length > target) {
      const s = this.strips.pop();
      try { s?.dispose(); } catch { /* idempotent */ }
    }
    this.sequencer?.setRowCount(this.strips.length);
  }

  /** Audition a single voice immediately (UI hover / preset preview).
   *  Doesn't go through the sequencer — direct dispatch with a tiny
   *  look-ahead so the audio context can schedule. */
  trigger(channelIdx: number, cfg: MachineConfig, amp: number): void {
    if (!this.ctx) return;
    const strip = this.strips[channelIdx];
    if (!strip) return;
    const vc: VoiceCtx = { ctx: this.ctx, destination: strip.input };
    const when = this.ctx.currentTime + 0.005;
    triggerVoice(cfg, vc, when, amp);
  }

  applyChannelParams(channelIdx: number, params: ChannelStripParams): void {
    const strip = this.strips[channelIdx];
    if (strip) strip.applyParams(params);
  }

  applyChannelEffects(channelIdx: number, effects: ChannelEffects): void {
    const strip = this.strips[channelIdx];
    if (!strip) return;
    strip.applyParams(effects);
    strip.applyColorFx(effects.colorFx);
  }

  applyChannelColorFx(channelIdx: number, colorFx: ColorFx): void {
    const strip = this.strips[channelIdx];
    if (strip) strip.applyColorFx(colorFx);
  }

  applyChannelMachine(channelIdx: number, cfg: MachineConfig): void {
    if (channelIdx < 0 || channelIdx >= this.machines.length) return;
    const next = this.machines.slice();
    next[channelIdx] = cfg;
    this.machines = next;
  }

  getAnalyser(): AnalyserNode | null {
    return this.analyser;
  }

  setMasterVolume(v: number): void {
    if (!this.master) return;
    this.master.gain.value = Math.max(0, Math.min(1, v));
  }

  // ── Sequencer-delegating setters ───────────────────────────────

  setSequence(seq: SoundSequence): void {
    this._sequence = seq;
    this.sequencer?.setSequence(seq);
  }

  setStepsPerBar(n: number): void {
    if (n <= 0) return;
    this._stepsPerBar = n;
    this.sequencer?.setStepsPerBar(n);
  }

  setMachines(machines: MachineConfig[]): void {
    this.ensureStripCount(machines.length);
    this.machines = machines;
  }

  setBpm(b: number): void {
    this._bpm = b;
    this.sequencer?.setBpm(b);
  }

  setStepUnit(u: 4 | 8 | 16): void {
    this._stepUnit = u;
    this.sequencer?.setStepUnit(u);
  }

  /** Grouping for count-in placement. Doesn't affect step rate, so
   *  the sequencer doesn't need to know — it stays here for the
   *  count-in click code path. */
  setGrouping(g: number[]): void {
    this._grouping = g.length > 0 ? [...g] : [this._stepsPerBar];
  }

  setSwing(s: number): void {
    const clamped = Math.max(0.5, Math.min(0.75, s));
    this._swing = clamped;
    this.sequencer?.setSwing(clamped);
  }

  setAccents(strong: number, weak: number): void {
    this._strongAmp = Math.max(0, strong);
    this._weakAmp = Math.max(0, weak);
    this.sequencer?.setAccents(this._strongAmp, this._weakAmp);
  }

  setReverbWet(v: number): void   { this.reverbFx?.set('wet',   v); }
  setReverbSize(s: number): void  { this.reverbFx?.set('size',  s); }
  setReverbDecay(d: number): void { this.reverbFx?.set('decay', d); }
  setDelayTime(t: number): void   { this.delayFx?.set('time',     t); }
  setDelayWet(v: number): void    { this.delayFx?.set('wet',      v); }
  setDelayFeedback(v: number): void { this.delayFx?.set('feedback', v); }

  /** Direct access to the master FX modules. */
  getReverbFx(): ControllableModule | null { return this.reverbFx; }
  getDelayFx(): ControllableModule | null  { return this.delayFx; }

  // ── Audible-state proxies (forward to sequencer) ───────────────

  audibleBar(): number { return this.sequencer?.audibleBar() ?? 0; }
  audibleStep(): number { return this.sequencer?.audibleStep() ?? -1; }
  audibleStepFor(channelIdx: number): number {
    return this.sequencer?.audibleStepFor(channelIdx) ?? -1;
  }

  /** Voice-keyed cursors — Practice / Library iterate ALL_VOICES and
   *  read each row's audibleStepFor. Returns -1 for any voice that
   *  isn't part of the loaded pattern. */
  audibleCursors(): Record<string, number> {
    const out: Record<string, number> = {};
    for (let i = 0; i < ALL_VOICES.length; i++) {
      const voiceId = ALL_VOICES[i];
      out[voiceId] = this._pattern?.tracks[voiceId]
        ? this.audibleStepFor(i)
        : -1;
    }
    return out;
  }

  /** Subscribe to bar boundaries. Used by useMetronome.ts to drive
   *  the trainer's BPM ramp. Returns unsubscribe fn. */
  subscribeOnBar(fn: (bar: number) => void): () => void {
    this.barListeners.add(fn);
    return () => { this.barListeners.delete(fn); };
  }

  // ── Pattern-shape API (Practice / Library / legacy Studio) ─────

  /** Translate a voice-keyed Pattern into the engine's positional
   *  channel state. Row order matches ALL_VOICES so phase preservation
   *  across hot swaps stays stable (the sequencer re-anchors per row).
   *  Tracks the pattern doesn't include get an empty row that the
   *  sequencer harmlessly ticks past. */
  loadPattern(p: Pattern): void {
    this._pattern = p;

    // Channels — one per ALL_VOICES, machine = active kit's preset
    // for that voice, effects = defaults.
    const machines: MachineConfig[] = ALL_VOICES.map((voiceId) =>
      buildKitMachine(this._kit, voiceId),
    );
    this.ensureStripCount(machines.length);
    this.machines = machines;

    // Apply default effects to each strip with the kit's reverb send
    // baked in.
    const reverbSend = KIT_REVERB_SEND[this._kit] ?? 0.15;
    for (let i = 0; i < this.strips.length; i++) {
      this.applyChannelParams(i, {
        level: 0.85, pan: 0, reverbSend, delaySend: 0,
      });
    }

    // Sequence — translate Pattern.tracks into positional rows.
    const sequence: SoundSequence = ALL_VOICES.map((voiceId) => {
      const track = p.tracks[voiceId];
      if (!track) return [];
      const meta = trackMeta(track, p.steps);
      if (!meta.pattern || meta.pattern.length === 0) return [];
      const cycle = meta.cycle;
      const row: SoundStep[] = [];
      for (let i = 0; i < cycle; i++) {
        row.push((meta.pattern[i % meta.pattern.length] ?? 0) as SoundStep);
      }
      return row;
    });

    // Update sequencer state in one tight burst — order matters: step
    // unit + steps before BPM (BPM derives from stepUnit) before
    // sequence (length-change re-anchor reads barSec).
    this._stepUnit = p.stepUnit;
    this._stepsPerBar = p.steps;
    this.sequencer?.setStepUnit(p.stepUnit);
    this.sequencer?.setStepsPerBar(p.steps);
    // Re-apply BPM under the new pattern's stepUnit + denom.
    const denom = parseTimeSigDenom(p.timeSig);
    this.sequencer?.setBpm(quarterFromNatural(this._bpm, denom));
    this.setSequence(sequence);
  }

  /** Apply a kit preset across all five channels. Practice's KitPanel
   *  calls this; the timbre changes mid-bar without restarting the
   *  pattern. The reverb send level is also bumped per-kit (frame
   *  drums get more bloom than 727 percussion). */
  setKit(k: KitId): void {
    this._kit = k;
    if (this.machines.length === 0) return;
    const reverbSend = KIT_REVERB_SEND[k] ?? 0.15;
    const machines: MachineConfig[] = ALL_VOICES.map((voiceId) =>
      buildKitMachine(k, voiceId),
    );
    this.ensureStripCount(machines.length);
    this.machines = machines;
    for (let i = 0; i < this.strips.length; i++) {
      // Apply the new machine via the engine adapter path so any
      // bus subscriber (router / recorder) sees the change too.
      this.applyChannelMachine(i, machines[i]);
      // Update reverb send without disturbing the user's other
      // mixer params (level/pan/delaySend stay where they are).
      const strip = this.strips[i];
      if (strip) {
        // Read current params is private; just push reverbSend via
        // applyChannelParams with sensible defaults for the rest.
        this.applyChannelParams(i, {
          level: 0.85, pan: 0, reverbSend, delaySend: 0,
        });
      }
    }
  }

  /** Practice-style BPM setter — accepts the user's "natural" BPM
   *  (denominator-of-time-sig per minute, e.g. 120 BPM in 9/8 means
   *  120 eighth notes) and converts to the sequencer's quarter-BPM
   *  internally. Sound page's setBpm() takes quarter BPM directly. */
  setNaturalBpm(naturalBpm: number, denom: number): void {
    this._bpm = naturalBpm;
    this.sequencer?.setBpm(quarterFromNatural(naturalBpm, denom));
  }

  /** Bar (main division) seconds — Practice convention: a bar at
   *  natural BPM N in time sig denom D = (steps * 60) / (N * stepUnit / D). */
  barSeconds(): number {
    return this.sequencer?.barSeconds() ?? 0;
  }

  // ── Transport ──────────────────────────────────────────────────

  /** Practice / Library / legacy Studio call this — same as play() but
   *  with a positional `countInBars` argument matching the legacy
   *  AudioEngine surface. Doesn't await ensureCtx for caller-side
   *  back-compat. */
  start(countInBars = 0): void {
    void this.play({ countInBars });
  }

  async play(opts: { countInBars?: number } = {}): Promise<void> {
    await this.ensureCtx();
    if (!this.ctx || !this.sequencer || this.sequencer.running()) return;
    const ctx = this.ctx;
    const barSec = this.sequencer.barSeconds();
    const stepSec = this.sequencer.stepSeconds();
    const countInBars = Math.max(0, Math.floor(opts.countInBars ?? 0));
    const headRoom = ctx.currentTime + 0.06;

    // Schedule a wood-tick at the start of each grouping cell of every
    // count-in bar.
    if (countInBars > 0) {
      const downbeatSteps: number[] = [];
      let acc = 0;
      for (const g of this._grouping) {
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
    // Pre-fill before the first worker tick arrives (~15ms latency).
    this.tick();
  }

  stop(): void {
    this.sequencer?.stop();
    if (this.timerId !== null) {
      clearTimeout(this.timerId);
      this.timerId = null;
    }
    if (this.worker) {
      this.worker.postMessage({ type: 'stop' });
    }
  }

  /** Kit-independent count-in click — wood-tick. */
  private countInClick(when: number, amp: number): void {
    const ctx = this.ctx;
    const master = this.master;
    if (!ctx || !master) return;
    const osc = ctx.createOscillator();
    const g = ctx.createGain();
    osc.frequency.value = amp > 0.8 ? 2200 : 1400;
    g.gain.setValueAtTime(amp * 0.5, when);
    g.gain.exponentialRampToValueAtTime(0.0001, when + 0.03);
    osc.connect(g).connect(master);
    osc.start(when);
    osc.stop(when + 0.05);
  }

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

  dispose(): void {
    this.stop();
    if (this.worker) {
      this.worker.terminate();
      this.worker = null;
    }
    if (this.triggerSub) { this.triggerSub(); this.triggerSub = null; }
    if (this.barSub)     { this.barSub();     this.barSub = null;     }
    this.barListeners.clear();
    for (const s of this.strips) {
      try { s.dispose(); } catch { /* idempotent */ }
    }
    this.strips = [];
    try { this.reverbFx?.dispose(); } catch { /* idempotent */ }
    try { this.delayFx?.dispose();  } catch { /* idempotent */ }
    if (this.ctx && this.ctx.state !== 'closed') void this.ctx.close();
    this.ctx = null;
    this.master = null;
    this.analyser = null;
    this.revBus = null;
    this.dlyBus = null;
    this.reverbFx = null;
    this.delayFx = null;
    this.sequencer = null;
  }
}

/** Practice's "natural" BPM is the denominator of the time-sig per
 *  minute (e.g. 120 BPM in 9/8 means 120 eighth notes). The sequencer
 *  works in quarter-BPM. Conversion: quarterBpm = naturalBpm * 4 / denom. */
function quarterFromNatural(naturalBpm: number, denom: number): number {
  return (naturalBpm * 4) / Math.max(1, denom);
}
