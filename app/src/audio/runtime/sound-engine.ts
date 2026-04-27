// SoundEngine — audio runtime for the Sound page. Owns its own audio
// graph (master + analyser + reverb + delay + 5 channel strips) AND a
// look-ahead scheduler so the page can host a sequencer without
// depending on the production AudioEngine. Scheduler design mirrors
// AudioEngine (worker-driven 15ms tick, 300ms scheduleAhead, anchor-
// derive nextNoteTime, audibleStep() inverts the anchor formula for UI)
// — kept in sync with that file so the unification path is short.

import { triggerVoice } from '../machines/registry';
import type { MachineConfig, VoiceCtx } from '../machines/types';
import { createAudioContext, resumeIfSuspended } from '../audio-context';
import type { ChannelEffects, ColorFx } from '../../patterns/types-sound';
import { ChannelStrip, type ChannelStripParams } from './ChannelStrip';
import { buildColorFx } from './colorFx';
import { makeEventBus, type EventBus } from '../../modules/events';
// Vite explicit-worker import — see engine.ts for the MIME-fallback
// reasoning. Must use the `?worker` query, not `new URL(...)`.
import SchedulerWorker from '../scheduler-worker.ts?worker';

const NUM_CHANNELS = 5;

/** Step cell value: 0 = off, 1 = on (weak), 2 = accent (strong). */
export type SoundStep = 0 | 1 | 2;
/** [channelIdx][stepIdx] grid. Outer length = NUM_CHANNELS. */
export type SoundSequence = SoundStep[][];

export class SoundEngine {
  // ── Audio graph ─────────────────────────────────────────────────
  private ctx: AudioContext | null = null;
  private master: GainNode | null = null;
  private analyser: AnalyserNode | null = null;
  // Master FX buses. revBus/dlyBus are retained so ensureStripCount()
  // can pass them when allocating new ChannelStrips at runtime
  // (add-channel UX). reverbConvolver, revWet, dlyLine, dlyFeedback,
  // dlyWet are the nodes the user-facing setters mutate.
  private revBus: GainNode | null = null;
  private dlyBus: GainNode | null = null;
  private reverbConvolver: ConvolverNode | null = null;
  private revWet: GainNode | null = null;
  private dlyWet: GainNode | null = null;
  private dlyFeedback: GainNode | null = null;
  private dlyLine: DelayNode | null = null;
  // Cache the reverb shape so size/decay setters can pull the OTHER
  // value when one changes (size sets without specifying decay re-uses
  // the cached decay). Defaults match initCtxOnce.
  private _reverbSize = 1.8;
  private _reverbDecay = 2.2;
  private strips: ChannelStrip[] = [];
  private ctxInitPromise: Promise<void> | null = null;

  // ── Sequencer state ─────────────────────────────────────────────
  private _running = false;
  private _bpm = 110;
  private _stepsPerBar = 16;
  // Step note value: 4 = quarter, 8 = eighth, 16 = sixteenth. BPM is
  // always quarter-note BPM (familiar to users), so stepSec scales by
  // (stepUnit / 4). Switching meter from 4/4 (stepUnit=16) to 6/8
  // (stepUnit=8) doubles each step's duration without touching bpm.
  private _stepUnit: 4 | 8 | 16 = 16;
  // Additive grouping (e.g. [2,2,3] for 7/8). Used for count-in to
  // place clicks at downbeats — group boundaries — rather than evenly
  // across the bar. Defaults to [stepsPerBar] (one big group, single
  // downbeat per bar) when not explicitly set.
  private _grouping: number[] = [16];
  private sequence: SoundSequence = [];
  // Live machine configs the scheduler reads at trigger time. Sound.tsx
  // pushes new copies on every channel change (knob tweak, preset apply,
  // archetype swap). Cheap — just stashing the reference.
  private machines: MachineConfig[] = [];
  private _strongAmp = 1.0;
  private _weakAmp = 0.55;
  // Swing: 0.5 = straight, 0.67 = heavy (triplet feel). Applied only to
  // odd-indexed steps when stepUnit ∈ {8, 16} — see tick(). Quarter-
  // note swing is just a tempo change, so stepUnit=4 ignores swing.
  private _swing = 0.5;

  // Scheduler infrastructure (mirrors AudioEngine's lookaheadMs /
  // scheduleAheadS / worker-vs-setTimeout fallback).
  private readonly lookaheadMs = 15;
  private readonly scheduleAheadS = 0.30;
  private worker: Worker | null = null;
  private workerFailed = false;
  private timerId: ReturnType<typeof setTimeout> | null = null;
  // Per-channel scheduler state — each channel has its own playhead so
  // polyrhythms (channels with sequence row length ≠ stepsPerBar) tick
  // at their own rate. Length always tracks strips.length via
  // ensureStripCount. Anchors re-set on setBpm/setStepUnit/length-change
  // so float-add drift stays bounded across long sessions.
  private nextNoteTimes: number[] = [];
  private nextIdxs: number[] = [];
  private anchorTimes: number[] = [];
  private anchorIdxs: number[] = [];
  // Cached row lengths so setSequence can detect a length change for a
  // single channel and re-anchor only that one (instead of rebuilding
  // the whole grid).
  private rowLengths: number[] = [];
  private startTime = 0;

  // ── Event bus (control plane) ───────────────────────────────────
  // Lazily created on first access. The engine emits BarEvents,
  // StepEvents, TriggerEvents, and TransportEvents alongside its
  // direct dispatch — UI / router / recorder / MIDI-out subscribe
  // through the same channel. No subscribers ⇒ cost is one Map
  // lookup per emit, near zero. The direct path (triggerVoice +
  // ChannelStrip) remains the source of truth for audio output —
  // events are read-only signals about what already happened.
  private bus: EventBus | null = null;
  // Last bar number we emitted a BarEvent for. Bar 0 is "not yet
  // started"; the first emit fires when audibleBar() reaches 1.
  private lastEmittedBar = 0;

  get running(): boolean { return this._running; }
  get bpm(): number { return this._bpm; }
  get stepsPerBar(): number { return this._stepsPerBar; }
  get stepUnit(): 4 | 8 | 16 { return this._stepUnit; }
  get swing(): number { return this._swing; }

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

    // Reverb bus: revBus (per-channel sends sum here) → convolver →
    // revWet (master wet level) → master. The convolver's buffer can
    // be swapped live to retune size/decay (see setReverbSize/Decay).
    const revBus = ctx.createGain();
    const reverb = ctx.createConvolver();
    reverb.buffer = makeImpulse(ctx, this._reverbSize, this._reverbDecay);
    const revWet = ctx.createGain();
    revWet.gain.value = 0.5;
    revBus.connect(reverb).connect(revWet).connect(master);

    // Delay bus: dlyBus → delayLine → feedback (loops back to delayLine
    // input) AND → dlyWet → master. Feedback gain capped at 0.7 so the
    // user can't dial in self-oscillation. Delay time is set on play()
    // based on BPM (1/8-note default); leaving it static for now since
    // changing it during playback creates audible chirps.
    const dlyBus = ctx.createGain();
    const dlyLine = ctx.createDelay(2.0);
    dlyLine.delayTime.value = 0.25; // 1/8 at 120 BPM, retuned on play()
    const dlyFeedback = ctx.createGain();
    dlyFeedback.gain.value = 0.35;
    const dlyWet = ctx.createGain();
    dlyWet.gain.value = 0.5;
    dlyBus.connect(dlyLine);
    dlyLine.connect(dlyFeedback).connect(dlyLine);
    dlyLine.connect(dlyWet).connect(master);

    const strips: ChannelStrip[] = [];
    for (let i = 0; i < NUM_CHANNELS; i++) {
      strips.push(new ChannelStrip(ctx, master, revBus, dlyBus, buildColorFx));
    }

    this.ctx = ctx;
    this.master = master;
    this.analyser = analyser;
    this.revBus = revBus;
    this.dlyBus = dlyBus;
    this.reverbConvolver = reverb;
    this.revWet = revWet;
    this.dlyLine = dlyLine;
    this.dlyFeedback = dlyFeedback;
    this.dlyWet = dlyWet;
    this.strips = strips;
  }

  /** Grow or shrink the strips array AND the per-channel scheduler
   *  state to match `n`. Strips dispose cleanly when removed — colour
   *  FX, panner, level, taps all disconnect, no orphaned nodes. New
   *  channels' anchors initialize at startTime (or now if not playing)
   *  so they tick from cycle 0 the moment a sequence row appears. */
  private ensureStripCount(n: number): void {
    if (!this.ctx || !this.master) return;
    const target = Math.max(0, Math.floor(n));
    const t0 = this._running ? (this.ctx.currentTime + 0.01) : this.startTime;
    while (this.strips.length < target) {
      this.strips.push(new ChannelStrip(
        this.ctx, this.master, this.revBus, this.dlyBus, buildColorFx,
      ));
      this.nextNoteTimes.push(t0);
      this.nextIdxs.push(0);
      this.anchorTimes.push(t0);
      this.anchorIdxs.push(0);
      this.rowLengths.push(0);
    }
    while (this.strips.length > target) {
      const s = this.strips.pop();
      try { s?.dispose(); } catch { /* idempotent */ }
      this.nextNoteTimes.pop();
      this.nextIdxs.pop();
      this.anchorTimes.pop();
      this.anchorIdxs.pop();
      this.rowLengths.pop();
    }
  }

  /** One-shot trigger (not sequenced — for audition + ASDFG keys). */
  trigger(channelIdx: number, cfg: MachineConfig, amp = 1.0): void {
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

  /** Apply just the color FX without touching mixer params. Used by
   *  the channel-color adapter so it doesn't have to know the channel's
   *  current mixer state to perform a color-only update. */
  applyChannelColorFx(channelIdx: number, colorFx: ColorFx): void {
    const strip = this.strips[channelIdx];
    if (strip) strip.applyColorFx(colorFx);
  }

  /** Update one channel's machine config in place. The scheduler reads
   *  this.machines[ch] every step — so the next trigger sees the new
   *  cfg. Used by the channel-machine adapter to swap archetypes or
   *  tweak knobs through ParamEvents. */
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

  // ── Sequencer API ───────────────────────────────────────────────

  /** Replace the step grid. Each row's length is independent — rows
   *  matching stepsPerBar tick at the main rate; rows with a different
   *  length are polyrhythmic and tick at barSec / rowLength. When a
   *  row's length changes, that channel snaps to step 0 at the next
   *  bar boundary so the new cycle aligns musically. Other channels
   *  are untouched. */
  setSequence(seq: SoundSequence): void {
    if (this._running && this.ctx) {
      const barSec = this.barSeconds();
      const elapsed = this.ctx.currentTime - this.startTime;
      const barsCompleted = elapsed > 0 ? Math.floor(elapsed / barSec) + 1 : 0;
      const nextBarStart = this.startTime + barsCompleted * barSec;
      for (let i = 0; i < seq.length; i++) {
        const prevLen = this.rowLengths[i] ?? 0;
        const newLen = seq[i]?.length ?? 0;
        if (prevLen !== newLen) {
          this.nextNoteTimes[i] = nextBarStart;
          this.nextIdxs[i] = 0;
          this.anchorTimes[i] = nextBarStart;
          this.anchorIdxs[i] = 0;
        }
      }
    }
    this.rowLengths = seq.map((r) => r.length);
    this.sequence = seq;
  }

  /** Set the main grid step count (== sum(grouping)). Polyrhythm
   *  channels keep their own row lengths; this only changes what
   *  "main rate" means + bar duration. Re-anchors all channels so
   *  the new bar duration takes effect from "now". */
  setStepsPerBar(n: number): void {
    if (n <= 0) return;
    if (this._running && this.ctx) {
      for (let i = 0; i < this.strips.length; i++) {
        this.anchorTimes[i] = this.nextNoteTimes[i];
        this.anchorIdxs[i] = this.nextIdxs[i];
      }
    }
    this._stepsPerBar = n;
  }

  /** Push the latest machine configs. Sound.tsx calls this on every
   *  channel state change — knob tweak, preset apply, archetype swap,
   *  add/remove channel. Length defines the active strip count, so
   *  this also drives ensureStripCount. Triggers already in flight
   *  aren't affected (Web Audio nodes already scheduled keep their
   *  pre-tweak params); subsequent triggers pick up the new config. */
  setMachines(machines: MachineConfig[]): void {
    this.ensureStripCount(machines.length);
    this.machines = machines;
  }

  setBpm(b: number): void {
    if (this._running) {
      // Re-anchor every channel so the new step rate takes effect
      // from "now" without retroactively warping past steps.
      for (let i = 0; i < this.strips.length; i++) {
        this.anchorTimes[i] = this.nextNoteTimes[i];
        this.anchorIdxs[i] = this.nextIdxs[i];
      }
    }
    this._bpm = b;
  }

  /** Step duration changes when stepUnit changes (16th → 8th doubles
   *  stepSec). Re-anchor every channel so phase stays continuous. */
  setStepUnit(u: 4 | 8 | 16): void {
    if (this._running) {
      for (let i = 0; i < this.strips.length; i++) {
        this.anchorTimes[i] = this.nextNoteTimes[i];
        this.anchorIdxs[i] = this.nextIdxs[i];
      }
    }
    this._stepUnit = u;
  }

  /** Grouping for count-in placement. Doesn't affect step rate. */
  setGrouping(g: number[]): void {
    this._grouping = g.length > 0 ? [...g] : [this._stepsPerBar];
  }

  /** Swing depth: 0.5 = straight, 0.67 ≈ heavy triplet feel. Clamped. */
  setSwing(s: number): void {
    this._swing = Math.max(0.5, Math.min(0.75, s));
  }

  /** Master wet level for the reverb send bus (0..1). */
  setReverbWet(v: number): void {
    if (this.revWet) this.revWet.gain.value = Math.max(0, Math.min(1, v));
  }

  /** Reverb tail length in seconds (0.3..4.0). Rebuilds the impulse
   *  buffer; cheap. Tails currently in flight finish under the old
   *  buffer, so the swap doesn't click. */
  setReverbSize(seconds: number): void {
    this._reverbSize = Math.max(0.3, Math.min(4.0, seconds));
    if (this.ctx && this.reverbConvolver) {
      this.reverbConvolver.buffer = makeImpulse(this.ctx, this._reverbSize, this._reverbDecay);
    }
  }

  /** Reverb decay shape exponent (1..6). Higher = faster fade
   *  (steeper envelope on the noise burst). */
  setReverbDecay(exp: number): void {
    this._reverbDecay = Math.max(1, Math.min(6, exp));
    if (this.ctx && this.reverbConvolver) {
      this.reverbConvolver.buffer = makeImpulse(this.ctx, this._reverbSize, this._reverbDecay);
    }
  }

  /** Delay time in seconds (0.02..2.0). Ramped over 30ms to avoid
   *  the click that would result from an instant pointer jump on
   *  the delay line read head. */
  setDelayTime(seconds: number): void {
    if (!this.dlyLine || !this.ctx) return;
    const v = Math.max(0.02, Math.min(2.0, seconds));
    const t = this.ctx.currentTime;
    const p = this.dlyLine.delayTime;
    p.cancelScheduledValues(t);
    p.setValueAtTime(p.value, t);
    p.linearRampToValueAtTime(v, t + 0.03);
  }

  /** Master wet level for the delay send bus (0..1). */
  setDelayWet(v: number): void {
    if (this.dlyWet) this.dlyWet.gain.value = Math.max(0, Math.min(1, v));
  }

  /** Delay feedback (0..0.7 hard-capped). Above ~0.7 the line builds
   *  toward self-oscillation across automated parameter changes. */
  setDelayFeedback(v: number): void {
    if (this.dlyFeedback) this.dlyFeedback.gain.value = Math.max(0, Math.min(0.7, v));
  }

  setAccents(strong: number, weak: number): void {
    this._strongAmp = Math.max(0, strong);
    this._weakAmp = Math.max(0, weak);
  }

  /** 1-indexed bar number that's audible RIGHT NOW. 0 when not playing
   *  or during count-in. Counted from `startTime` (post-count-in), so
   *  bar 1 starts on the first sequenced beat. Loops forever — the
   *  number just keeps climbing. */
  audibleBar(): number {
    if (!this.ctx || !this._running) return 0;
    const barSec = this.barSeconds();
    if (barSec <= 0) return 0;
    const elapsed = this.ctx.currentTime - this.startTime;
    if (elapsed < 0) return 0;
    return Math.floor(elapsed / barSec) + 1;
  }

  /** Audible step on the MAIN grid — proxies channel 0's cursor.
   *  Drives the head row + hero BeatDots + view labels. In the common
   *  case (no polyrhythm) channel 0 ticks at the main rate so this
   *  reads exactly like a global cursor; with polyrhythm it falls
   *  back to whatever channel 0's rate is. */
  audibleStep(): number {
    return this.audibleStepFor(0);
  }

  /** Audible step for a specific channel — independent for poly rows.
   *  -1 if not playing or pre-count-in. */
  audibleStepFor(channelIdx: number): number {
    if (!this.ctx || !this._running) return -1;
    const stepSec = this.channelStepSec(channelIdx);
    if (stepSec <= 0) return -1;
    const now = this.ctx.currentTime;
    if (now < this.startTime) return -1;
    const ringSteps = this.sequence[channelIdx]?.length || this._stepsPerBar;
    if (ringSteps <= 0) return -1;
    const anchorT = this.anchorTimes[channelIdx] ?? this.startTime;
    const anchorI = this.anchorIdxs[channelIdx] ?? 0;
    const stepsSinceAnchor = Math.floor((now - anchorT) / stepSec);
    const globalIdx = anchorI + stepsSinceAnchor;
    return ((globalIdx % ringSteps) + ringSteps) % ringSteps;
  }

  /** Main-grid step duration. Quarter-BPM × stepUnit determines
   *  individual step length. stepsPerBar drives bar duration but not
   *  step duration. 16th @ 120 BPM = 0.125s; 8th @ 120 BPM = 0.25s. */
  private stepSeconds(): number {
    return 240 / (this._bpm * this._stepUnit);
  }

  /** Bar duration — same for every channel, regardless of subdivisions.
   *  Polyrhythm rows fit `rowLength` ticks into the same `barSec`. */
  private barSeconds(): number {
    return this.stepSeconds() * this._stepsPerBar;
  }

  /** Step duration for a specific channel. Polyrhythm rows divide
   *  barSec by their own length; main-rate rows == stepSeconds(). */
  private channelStepSec(channelIdx: number): number {
    const ringSteps = this.sequence[channelIdx]?.length || this._stepsPerBar;
    if (ringSteps <= 0) return 0;
    return this.barSeconds() / ringSteps;
  }

  async play(opts: { countInBars?: number } = {}): Promise<void> {
    await this.ensureCtx();
    if (!this.ctx || this._running) return;
    this._running = true;
    const ctx = this.ctx;
    const barSec = this.barSeconds();
    const stepSec = this.stepSeconds();
    const countInBars = Math.max(0, Math.floor(opts.countInBars ?? 0));
    const headRoom = ctx.currentTime + 0.06;
    const start = headRoom + countInBars * barSec;

    // Schedule a wood-tick at the start of each grouping cell of every
    // count-in bar. Step 0 = strong (start of bar); other group heads
    // = medium. Mirrors AudioEngine's count-in click for consistency.
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

    this.startTime = start;
    this.lastEmittedBar = 0;
    // Initialize each channel's playhead at startTime, idx 0. Per-row
    // tick rate falls out of channelStepSec at scheduling time.
    for (let i = 0; i < this.strips.length; i++) {
      this.nextNoteTimes[i] = start;
      this.nextIdxs[i] = 0;
      this.anchorTimes[i] = start;
      this.anchorIdxs[i] = 0;
    }
    if (this.bus) {
      this.bus.emit({ type: 'transport', action: 'play', when: start });
    }
    this.ensureWorker();
    if (this.worker) {
      this.worker.postMessage({ type: 'start', intervalMs: this.lookaheadMs });
    }
    // Pre-fill before the first worker tick arrives (~15ms latency).
    this.tick();
  }

  /** Kit-independent count-in click — wood-tick. Same shape as
   *  AudioEngine.countInClick so the two engines feel identical. */
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

  stop(): void {
    this._running = false;
    if (this.timerId !== null) {
      clearTimeout(this.timerId);
      this.timerId = null;
    }
    if (this.worker) {
      this.worker.postMessage({ type: 'stop' });
    }
    if (this.bus && this.ctx) {
      this.bus.emit({ type: 'transport', action: 'stop', when: this.ctx.currentTime });
    }
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
    if (!this._running || !this.ctx) return;
    const ctx = this.ctx;
    const horizon = ctx.currentTime + this.scheduleAheadS;
    const nowCatchUp = ctx.currentTime;
    const mainStepSec = this.stepSeconds();

    // Bar boundary detection — emit BarEvent each time the audible
    // bar number ticks up. Lightweight: one comparison per tick. The
    // `when` we pass is the audio-clock time of the audible bar's
    // start (startTime + (bar-1) * barSec).
    if (this.bus) {
      const currentBar = this.audibleBar();
      if (currentBar > this.lastEmittedBar) {
        const barSec = this.barSeconds();
        for (let b = this.lastEmittedBar + 1; b <= currentBar; b++) {
          this.bus.emit({
            type: 'bar',
            bar: b,
            when: this.startTime + (b - 1) * barSec,
          });
        }
        this.lastEmittedBar = currentBar;
      }
    }

    // Catch-up (cooperative). If any one channel has slipped past
    // nowCatchUp, snap every channel that's behind to the same
    // recovery time. Per-channel independent snapping was letting
    // non-stalled channels keep their old schedule while stalled
    // ones jumped to (now + 5ms), which broke phase across voices
    // that should have been in lock-step. Polyrhythm channels have
    // their own step rate but they all share a bar boundary; lining
    // them up at recoverT loses < 5ms of relative phase, which is
    // a small price to pay to never have audible drift after a stall.
    let stalled = false;
    for (let ch = 0; ch < this.strips.length; ch++) {
      const row = this.sequence[ch];
      if (!row || row.length === 0) continue;
      if (this.nextNoteTimes[ch] < nowCatchUp) { stalled = true; break; }
    }
    if (stalled) {
      const recoverT = nowCatchUp + 0.005;
      for (let ch = 0; ch < this.strips.length; ch++) {
        const row = this.sequence[ch];
        if (!row || row.length === 0) continue;
        if (this.nextNoteTimes[ch] < recoverT) {
          this.nextNoteTimes[ch] = recoverT;
          this.anchorTimes[ch] = recoverT;
          this.anchorIdxs[ch] = this.nextIdxs[ch];
        }
      }
    }

    // Per-channel scheduling — each row ticks at its own rate. Empty
    // rows still advance their playhead but trigger nothing, so the
    // cursor stays correct if the user dials hits in mid-bar.
    for (let ch = 0; ch < this.strips.length; ch++) {
      const row = this.sequence[ch];
      if (!row || row.length === 0) continue;
      const ringSteps = row.length;
      const channelStepSec = this.channelStepSec(ch);
      if (channelStepSec <= 0) continue;

      const cfg = this.machines[ch];
      const strip = this.strips[ch];
      // Skip swing on poly rows that aren't at the main rate — swing
      // is musically a "main grid" feel. Apply it only when this row
      // matches stepsPerBar (i.e. a non-poly main-rate channel).
      const isMainRate = ringSteps === this._stepsPerBar;
      const applySwing = isMainRate && this._stepUnit !== 4 && this._swing !== 0.5;

      while (this.nextNoteTimes[ch] < horizon) {
        let tPlay = this.nextNoteTimes[ch];
        if (applySwing && (this.nextIdxs[ch] % 2) === 1) {
          tPlay += (this._swing - 0.5) * 2 * mainStepSec;
        }
        const stepIdx = this.nextIdxs[ch] % ringSteps;
        const v = row[stepIdx] ?? 0;
        if (v > 0 && cfg && strip) {
          const amp = v === 2 ? this._strongAmp : this._weakAmp;
          const vc: VoiceCtx = { ctx, destination: strip.input };
          triggerVoice(cfg, vc, tPlay, amp);
          // Emit a TriggerEvent alongside the direct dispatch so any
          // bus subscriber (router, recorder, MIDI-out) sees the same
          // hit. The direct triggerVoice call above is still the
          // source of truth for audio output.
          if (this.bus) {
            this.bus.emit({
              type: 'trigger',
              target: `channel.${ch}`,
              velocity: amp,
              when: tPlay,
            });
          }
        }
        if (this.bus) {
          this.bus.emit({
            type: 'step',
            channel: ch,
            step: stepIdx,
            when: tPlay,
          });
        }

        this.nextIdxs[ch] += 1;
        this.nextNoteTimes[ch] = this.anchorTimes[ch]
          + (this.nextIdxs[ch] - this.anchorIdxs[ch]) * channelStepSec;
      }
    }

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
    for (const s of this.strips) {
      try { s.dispose(); } catch { /* idempotent */ }
    }
    this.strips = [];
    if (this.ctx && this.ctx.state !== 'closed') void this.ctx.close();
    this.ctx = null;
    this.master = null;
    this.analyser = null;
    this.revBus = null;
    this.dlyBus = null;
    this.reverbConvolver = null;
    this.revWet = null;
    this.dlyLine = null;
    this.dlyFeedback = null;
    this.dlyWet = null;
  }
}

/** Synthesize a noise-burst impulse response. Same shape as
 *  AudioEngine.makeImpulseFor — quick + cheap, sounds like a small
 *  room. duration = total tail seconds; decay = exponent on the
 *  amplitude envelope (higher = faster fade). */
function makeImpulse(ctx: AudioContext, duration: number, decay: number): AudioBuffer {
  const rate = ctx.sampleRate;
  const length = Math.floor(rate * duration);
  const impulse = ctx.createBuffer(2, length, rate);
  for (let ch = 0; ch < 2; ch++) {
    const d = impulse.getChannelData(ch);
    for (let i = 0; i < length; i++) {
      d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / length, decay);
    }
  }
  return impulse;
}
