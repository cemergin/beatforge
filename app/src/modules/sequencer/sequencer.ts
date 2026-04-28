// Sequencer implementation — anchor-derive scheduler with cooperative
// catch-up. Mirrors the timing math that lived inside SoundEngine,
// extracted so it can be reused (Practice migration), tested without
// Web Audio, and driven by any clock + tick source.
//
// Why anchor-derive instead of += stepSec:
//   nextNoteTimes[ch] = anchorTimes[ch] + (nextIdx - anchorIdx) * stepSec
// is bounded float-add — accumulated drift stays at the FPU's
// per-multiply error, not the per-add error × N steps. setBpm /
// setStepUnit re-anchor each row at its current nextNoteTime so the
// new rate takes effect from "now" without retroactively warping.
//
// Why cooperative catch-up: a stalled tick (worker backgrounded,
// long GC, page hidden) can leave only SOME rows past the clock.
// Snapping just the laggers to (now + 5ms) splits the grid in two.
// Instead we pick one recoverT and snap every row that's behind to
// the same instant — phase reconverges within < 5 ms of any stall.

import type {
  Sequence,
  Sequencer,
  SequencerOptions,
  Step,
} from './types';

const DEFAULT_SCHEDULE_AHEAD_S = 0.30;
const DEFAULT_TRIGGER_ADDRESS = (ch: number) => `channel.${ch}`;
/** Recovery margin after a stall — schedule the next event slightly
 *  in the future so Web Audio doesn't drop it as "in the past". */
const STALL_RECOVERY_S = 0.005;

export function makeSequencer(opts: SequencerOptions): Sequencer {
  const { bus, clock } = opts;
  const scheduleAheadS = opts.scheduleAheadS ?? DEFAULT_SCHEDULE_AHEAD_S;
  const triggerAddress = opts.triggerAddress ?? DEFAULT_TRIGGER_ADDRESS;

  // ── Sequencer state ─────────────────────────────────────────────
  let running = false;
  let bpm = 110;
  let stepsPerBar = 16;
  let stepUnit: 4 | 8 | 16 = 16;
  let sequence: Sequence = [];
  let strongAmp = 1.0;
  let weakAmp = 0.55;
  let swing = 0.5;

  // Per-row scheduler state. Length tracks setRowCount — mutated in
  // place via push/pop so the array references stay stable across
  // ticks (cheap allocation, simpler debugging).
  const nextNoteTimes: number[] = [];
  const nextIdxs: number[] = [];
  const anchorTimes: number[] = [];
  const anchorIdxs: number[] = [];
  let rowLengths: number[] = [];

  let _startTime = 0;
  let lastEmittedBar = 0;

  // ── Math helpers ────────────────────────────────────────────────
  const stepSeconds = (): number => 240 / (bpm * stepUnit);
  const barSeconds = (): number => stepSeconds() * stepsPerBar;
  const channelStepSec = (ch: number): number => {
    const ringSteps = sequence[ch]?.length || stepsPerBar;
    if (ringSteps <= 0) return 0;
    return barSeconds() / ringSteps;
  };

  // ── Re-anchor primitive ─────────────────────────────────────────
  // Used by setBpm / setStepUnit / setStepsPerBar so the new step
  // rate takes effect from "now" without retroactively warping past
  // steps. Each row's anchor jumps to its current nextNoteTime; the
  // anchor-derive formula then walks forward at the new stepSec.
  const reanchorAll = (): void => {
    if (!running) return;
    for (let i = 0; i < nextNoteTimes.length; i++) {
      anchorTimes[i] = nextNoteTimes[i];
      anchorIdxs[i] = nextIdxs[i];
    }
  };

  // ── Public API ──────────────────────────────────────────────────
  const setBpm = (b: number): void => { reanchorAll(); bpm = b; };
  const setStepUnit = (u: 4 | 8 | 16): void => { reanchorAll(); stepUnit = u; };
  const setStepsPerBar = (n: number): void => {
    if (n <= 0) return;
    reanchorAll();
    stepsPerBar = n;
  };
  const setSwing = (s: number): void => {
    swing = Math.max(0.5, Math.min(0.75, s));
  };
  const setAccents = (s: number, w: number): void => {
    strongAmp = Math.max(0, s);
    weakAmp = Math.max(0, w);
  };

  /** Replace the step grid. When a row's length CHANGES the row
   *  snaps to step 0 at the next bar boundary so the new cycle
   *  aligns musically. Other rows are untouched. */
  const setSequence = (seq: Sequence): void => {
    if (running) {
      const bar = barSeconds();
      const elapsed = clock() - _startTime;
      const barsCompleted = elapsed > 0 ? Math.floor(elapsed / bar) + 1 : 0;
      const nextBarStart = _startTime + barsCompleted * bar;
      for (let i = 0; i < seq.length; i++) {
        const prevLen = rowLengths[i] ?? 0;
        const newLen = seq[i]?.length ?? 0;
        if (prevLen !== newLen) {
          nextNoteTimes[i] = nextBarStart;
          nextIdxs[i] = 0;
          anchorTimes[i] = nextBarStart;
          anchorIdxs[i] = 0;
        }
      }
    }
    rowLengths = seq.map((r) => r.length);
    sequence = seq;
  };

  const setRowCount = (n: number): void => {
    const target = Math.max(0, Math.floor(n));
    const t0 = running ? clock() + 0.01 : _startTime;
    while (nextNoteTimes.length < target) {
      nextNoteTimes.push(t0);
      nextIdxs.push(0);
      anchorTimes.push(t0);
      anchorIdxs.push(0);
      rowLengths.push(0);
    }
    while (nextNoteTimes.length > target) {
      nextNoteTimes.pop();
      nextIdxs.pop();
      anchorTimes.pop();
      anchorIdxs.pop();
      rowLengths.pop();
    }
  };

  const play = (playOpts: { startTime?: number; countInBars?: number } = {}): void => {
    if (running) return;
    running = true;
    const countIn = Math.max(0, Math.floor(playOpts.countInBars ?? 0));
    const headRoom = playOpts.startTime ?? (clock() + 0.06);
    const start = headRoom + countIn * barSeconds();
    _startTime = start;
    lastEmittedBar = 0;
    for (let i = 0; i < nextNoteTimes.length; i++) {
      nextNoteTimes[i] = start;
      nextIdxs[i] = 0;
      anchorTimes[i] = start;
      anchorIdxs[i] = 0;
    }
    bus.emit({ type: 'transport', action: 'play', when: start });
  };

  const stop = (): void => {
    running = false;
    bus.emit({ type: 'transport', action: 'stop', when: clock() });
  };

  const audibleBar = (): number => {
    if (!running) return 0;
    const bar = barSeconds();
    if (bar <= 0) return 0;
    const elapsed = clock() - _startTime;
    if (elapsed < 0) return 0;
    return Math.floor(elapsed / bar) + 1;
  };

  const audibleStepFor = (ch: number): number => {
    if (!running) return -1;
    const ss = channelStepSec(ch);
    if (ss <= 0) return -1;
    const now = clock();
    if (now < _startTime) return -1;
    const ringSteps = sequence[ch]?.length || stepsPerBar;
    if (ringSteps <= 0) return -1;
    const anchorT = anchorTimes[ch] ?? _startTime;
    const anchorI = anchorIdxs[ch] ?? 0;
    const stepsSinceAnchor = Math.floor((now - anchorT) / ss);
    const globalIdx = anchorI + stepsSinceAnchor;
    return ((globalIdx % ringSteps) + ringSteps) % ringSteps;
  };

  const audibleStep = (): number => audibleStepFor(0);

  // ── The tick loop ───────────────────────────────────────────────
  const tick = (): void => {
    if (!running) return;
    const now = clock();
    const horizon = now + scheduleAheadS;
    const mainStepSec = stepSeconds();

    // Bar boundary detection — emit BarEvent for every bar that has
    // ticked past since the last emit. Long stalls get caught up in
    // one tick.
    const currentBar = audibleBar();
    if (currentBar > lastEmittedBar) {
      const bar = barSeconds();
      for (let b = lastEmittedBar + 1; b <= currentBar; b++) {
        bus.emit({
          type: 'bar',
          bar: b,
          when: _startTime + (b - 1) * bar,
        });
      }
      lastEmittedBar = currentBar;
    }

    // Cooperative catch-up: if any row is behind, snap every row
    // that's behind to one shared recoverT so phase reconverges.
    let stalled = false;
    for (let ch = 0; ch < nextNoteTimes.length; ch++) {
      const row = sequence[ch];
      if (!row || row.length === 0) continue;
      if (nextNoteTimes[ch] < now) { stalled = true; break; }
    }
    if (stalled) {
      const recoverT = now + STALL_RECOVERY_S;
      for (let ch = 0; ch < nextNoteTimes.length; ch++) {
        const row = sequence[ch];
        if (!row || row.length === 0) continue;
        if (nextNoteTimes[ch] < recoverT) {
          nextNoteTimes[ch] = recoverT;
          anchorTimes[ch] = recoverT;
          anchorIdxs[ch] = nextIdxs[ch];
        }
      }
    }

    // Per-channel scheduling. Each row ticks at its own rate
    // (channelStepSec). Empty rows still advance their playhead but
    // emit nothing.
    for (let ch = 0; ch < nextNoteTimes.length; ch++) {
      const row = sequence[ch];
      if (!row || row.length === 0) continue;
      const ringSteps = row.length;
      const stepSec = channelStepSec(ch);
      if (stepSec <= 0) continue;

      const isMainRate = ringSteps === stepsPerBar;
      const applySwing = isMainRate && stepUnit !== 4 && swing !== 0.5;

      while (nextNoteTimes[ch] < horizon) {
        let tPlay = nextNoteTimes[ch];
        if (applySwing && (nextIdxs[ch] % 2) === 1) {
          tPlay += (swing - 0.5) * 2 * mainStepSec;
        }
        const stepIdx = nextIdxs[ch] % ringSteps;
        const v: Step = row[stepIdx] ?? 0;
        if (v > 0) {
          const amp = v === 2 ? strongAmp : weakAmp;
          bus.emit({
            type: 'trigger',
            target: triggerAddress(ch),
            velocity: amp,
            when: tPlay,
          });
        }
        bus.emit({
          type: 'step',
          channel: ch,
          step: stepIdx,
          when: tPlay,
        });

        nextIdxs[ch] += 1;
        nextNoteTimes[ch] = anchorTimes[ch]
          + (nextIdxs[ch] - anchorIdxs[ch]) * stepSec;
      }
    }
  };

  /** Re-anchor every row to the start of the next bar. Used when
   *  the user makes a change that should resync all rows to step 0
   *  in unison (e.g. groove ↔ click toggle). No-op when not
   *  playing — the next play() will start everything from 0
   *  anyway. */
  const restartFromNextBar = (): void => {
    if (!running) return;
    const bar = barSeconds();
    if (bar <= 0) return;
    const elapsed = clock() - _startTime;
    const barsCompleted = elapsed > 0 ? Math.floor(elapsed / bar) + 1 : 0;
    const nextBarStart = _startTime + barsCompleted * bar;
    for (let i = 0; i < nextNoteTimes.length; i++) {
      nextNoteTimes[i] = nextBarStart;
      nextIdxs[i] = 0;
      anchorTimes[i] = nextBarStart;
      anchorIdxs[i] = 0;
    }
  };

  return {
    setBpm, setStepUnit, setStepsPerBar, setSwing,
    setSequence, setAccents, setRowCount,
    play, stop,
    running: () => running,
    bpm: () => bpm,
    stepsPerBar: () => stepsPerBar,
    stepUnit: () => stepUnit,
    swing: () => swing,
    startTime: () => _startTime,
    audibleBar, audibleStep, audibleStepFor,
    stepSeconds, barSeconds,
    tick, restartFromNextBar,
  };
}
