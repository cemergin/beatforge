// SoundEngine — audio runtime for the Sound page. Owns its own audio
// graph (master + analyser + 5 channel strips) AND a 16-step look-ahead
// scheduler so the page can host a sequencer without depending on the
// production AudioEngine in audio/engine.ts. Scheduler design mirrors
// AudioEngine (worker-driven 15ms tick, 300ms scheduleAhead, anchor-
// derive nextNoteTime, audibleStep() inverts the anchor formula for UI)
// — kept in sync with that file so the unification path is short.

import { triggerVoice } from '../machines/registry';
import type { MachineConfig, VoiceCtx } from '../machines/types';
import { createAudioContext, resumeIfSuspended } from '../audio-context';
import type { ChannelEffects } from '../../patterns/types-sound';
import { ChannelStrip, type ChannelStripParams } from './ChannelStrip';
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
  private sequence: SoundSequence = [];
  // Live machine configs the scheduler reads at trigger time. Sound.tsx
  // pushes new copies on every channel change (knob tweak, preset apply,
  // archetype swap). Cheap — just stashing the reference.
  private machines: MachineConfig[] = [];
  private _strongAmp = 1.0;
  private _weakAmp = 0.55;

  // Scheduler infrastructure (mirrors AudioEngine's lookaheadMs /
  // scheduleAheadS / worker-vs-setTimeout fallback).
  private readonly lookaheadMs = 15;
  private readonly scheduleAheadS = 0.30;
  private worker: Worker | null = null;
  private workerFailed = false;
  private timerId: ReturnType<typeof setTimeout> | null = null;
  private nextNoteTime = 0;
  private nextIdx = 0;
  // Anchors for bounded-drift derive of nextNoteTime. Re-anchored on
  // setBpm() and on stall catch-up — same pattern as AudioEngine.
  private anchorTime = 0;
  private anchorIdx = 0;
  private startTime = 0;

  get running(): boolean { return this._running; }
  get bpm(): number { return this._bpm; }
  get stepsPerBar(): number { return this._stepsPerBar; }
  get stepUnit(): 4 | 8 | 16 { return this._stepUnit; }

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

    const strips: ChannelStrip[] = [];
    for (let i = 0; i < NUM_CHANNELS; i++) {
      strips.push(new ChannelStrip(ctx, master, null, null, null));
    }

    this.ctx = ctx;
    this.master = master;
    this.analyser = analyser;
    this.strips = strips;
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

  getAnalyser(): AnalyserNode | null {
    return this.analyser;
  }

  setMasterVolume(v: number): void {
    if (!this.master) return;
    this.master.gain.value = Math.max(0, Math.min(1, v));
  }

  // ── Sequencer API ───────────────────────────────────────────────

  /** Replace the step grid. Length per row defines stepsPerBar; an empty
   *  grid stops the scheduler from triggering (but keeps the clock running).
   *  If `stepsPerBar` changes mid-play, the playhead resets to step 0 on
   *  the next bar boundary — simpler than trying to remap to a new grid. */
  setSequence(seq: SoundSequence): void {
    const newLen = seq[0]?.length ?? this._stepsPerBar;
    if (newLen !== this._stepsPerBar && this._running && this.ctx) {
      // Snap playhead back to start so we don't index past the new length.
      this.nextIdx = 0;
      this.anchorIdx = 0;
      this.anchorTime = this.nextNoteTime;
    }
    this._stepsPerBar = newLen;
    this.sequence = seq;
  }

  /** Push the latest machine configs. Sound.tsx calls this on every
   *  channel state change — knob tweak, preset apply, archetype swap.
   *  Triggers in flight aren't affected (Web Audio nodes already
   *  scheduled keep their pre-tweak params); subsequent triggers pick
   *  up the new config. */
  setMachines(machines: MachineConfig[]): void {
    this.machines = machines;
  }

  setBpm(b: number): void {
    if (this._running) {
      // Re-anchor so the new step rate takes effect from "now" without
      // retroactively warping past steps. Same pattern as AudioEngine.
      this.anchorTime = this.nextNoteTime;
      this.anchorIdx = this.nextIdx;
    }
    this._bpm = b;
  }

  /** Step duration changes when stepUnit changes (16th → 8th doubles
   *  stepSec). Re-anchor so phase stays continuous. */
  setStepUnit(u: 4 | 8 | 16): void {
    if (this._running) {
      this.anchorTime = this.nextNoteTime;
      this.anchorIdx = this.nextIdx;
    }
    this._stepUnit = u;
  }

  setAccents(strong: number, weak: number): void {
    this._strongAmp = Math.max(0, strong);
    this._weakAmp = Math.max(0, weak);
  }

  /** Step index that's audible RIGHT NOW (not last-scheduled). Inverts
   *  the anchor formula so the UI cursor matches what the user hears,
   *  not what's queued 300ms in Web Audio's future. -1 if not playing. */
  audibleStep(): number {
    if (!this.ctx || !this._running) return -1;
    const stepSec = this.stepSeconds();
    if (stepSec <= 0) return -1;
    const now = this.ctx.currentTime;
    if (now < this.startTime) return -1;
    const stepsSinceAnchor = Math.floor((now - this.anchorTime) / stepSec);
    const globalIdx = this.anchorIdx + stepsSinceAnchor;
    const cycle = this._stepsPerBar;
    return ((globalIdx % cycle) + cycle) % cycle;
  }

  /** stepSec = noteValue / quarter = (4 / stepUnit) quarters per step,
   *  × (60 / bpm) seconds per quarter = 240 / (bpm × stepUnit). Note:
   *  stepsPerBar is NOT in this formula — it only defines bar boundaries,
   *  not step duration. 16th @ 120 BPM = 0.125s; 8th @ 120 BPM = 0.25s. */
  private stepSeconds(): number {
    return 240 / (this._bpm * this._stepUnit);
  }

  async play(): Promise<void> {
    await this.ensureCtx();
    if (!this.ctx || this._running) return;
    this._running = true;
    const start = this.ctx.currentTime + 0.06;
    this.startTime = start;
    this.nextNoteTime = start;
    this.nextIdx = 0;
    this.anchorTime = start;
    this.anchorIdx = 0;
    this.ensureWorker();
    if (this.worker) {
      this.worker.postMessage({ type: 'start', intervalMs: this.lookaheadMs });
    }
    // Pre-fill before the first worker tick arrives (~15ms latency).
    this.tick();
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
    const stepSec = this.stepSeconds();
    if (stepSec <= 0) {
      if (!this.worker) this.timerId = setTimeout(this.tick, this.lookaheadMs);
      return;
    }

    // Catch-up: stall recovery — same logic as AudioEngine.tick().
    if (this.nextNoteTime < nowCatchUp) {
      this.nextNoteTime = nowCatchUp + 0.005;
      this.anchorTime = this.nextNoteTime;
      this.anchorIdx = this.nextIdx;
    }

    while (this.nextNoteTime < horizon) {
      const tPlay = this.nextNoteTime;
      const stepIdx = this.nextIdx % this._stepsPerBar;

      // Fire any active cells at this step. Read live machine configs
      // each scheduling pass so knob tweaks since the last tick are
      // honored. (Already-scheduled triggers can't be retroactively
      // updated — Web Audio commits node params at start(when).)
      for (let ch = 0; ch < this.sequence.length; ch++) {
        const v = this.sequence[ch]?.[stepIdx] ?? 0;
        if (v <= 0) continue;
        const cfg = this.machines[ch];
        const strip = this.strips[ch];
        if (!cfg || !strip) continue;
        const amp = v === 2 ? this._strongAmp : this._weakAmp;
        const vc: VoiceCtx = { ctx, destination: strip.input };
        triggerVoice(cfg, vc, tPlay, amp);
      }

      this.nextIdx += 1;
      // Anchor-derive — bounded drift across long sessions.
      this.nextNoteTime = this.anchorTime
        + (this.nextIdx - this.anchorIdx) * stepSec;
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
  }
}
