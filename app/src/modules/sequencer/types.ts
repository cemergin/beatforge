// Sequencer module — timing + scheduling, isolated from any Web
// Audio dependency. The sequencer:
//
//   - Owns BPM, stepUnit, stepsPerBar, grouping, swing, accents
//   - Owns per-channel anchor-derive state
//   - Detects bar boundaries
//   - Emits TriggerEvent / StepEvent / BarEvent / TransportEvent on
//     a bus the host injects
//
// What the sequencer DOES NOT own:
//
//   - AudioContext or any Web Audio nodes
//   - Voice machines (it emits TriggerEvent at addresses; whoever
//     subscribes turns those into audio)
//   - The tick driver (a worker, a setTimeout loop, or a test
//     harness pumps tick() — see SequencerOptions.driver)
//
// Velocity 0 = off, 1 = weak, 2 = strong. The sequencer maps these
// to amplitudes via `setAccents(strong, weak)` and emits the scaled
// value as TriggerEvent.velocity.

import type { EventBus } from '../events';

export type Step = 0 | 1 | 2;
/** Sequence laid out as [channel][step]. Outer length = number of
 *  scheduling rows; inner row length is per-row (independent so a
 *  polyrhythm channel can have its own step count). */
export type Sequence = Step[][];

export interface SequencerOptions {
  /** Where the sequencer emits Trigger / Step / Bar / Transport. */
  bus: EventBus;
  /** Current time in seconds. The sequencer calls this every tick;
   *  hosts wire it to AudioContext.currentTime (or perf.now()/1000
   *  for tests + previews). */
  clock: () => number;
  /** Look-ahead window in seconds — how far past `clock()` the
   *  sequencer schedules events. Default 0.30. */
  scheduleAheadS?: number;
  /** Address prefix for emitted TriggerEvents. Channel index is
   *  appended as `${prefix}${ch}`. Default `'channel.'` so events
   *  land at `channel.0`, `channel.1`, … — matches the router's
   *  default address tree. */
  triggerAddress?: (channel: number) => string;
}

export interface Sequencer {
  // ── State setters ──────────────────────────────────────────────
  setBpm(b: number): void;
  setStepUnit(u: 4 | 8 | 16): void;
  setStepsPerBar(n: number): void;
  setSwing(s: number): void;
  setSequence(seq: Sequence): void;
  setAccents(strong: number, weak: number): void;
  /** Ensure the per-channel scheduler state arrays match `n` rows.
   *  Adding rows initializes them at the current play position;
   *  removing rows pops the trailing entries. */
  setRowCount(n: number): void;

  // ── Transport ──────────────────────────────────────────────────
  /** Begin scheduling. `startTime` is when bar 1 begins (in clock
   *  units). If omitted, `clock() + 0.06` is used. */
  play(opts?: { startTime?: number; countInBars?: number }): void;
  stop(): void;

  // ── Read-only state ────────────────────────────────────────────
  running(): boolean;
  bpm(): number;
  stepsPerBar(): number;
  stepUnit(): 4 | 8 | 16;
  swing(): number;
  /** Time that bar 1 begins (post-count-in). 0 before play(). */
  startTime(): number;
  /** Audible bar number RIGHT NOW. 0 before play / during count-in. */
  audibleBar(): number;
  /** Audible step on the main grid — proxies channel 0. -1 before
   *  play. */
  audibleStep(): number;
  /** Audible step for a specific channel. Independent for poly rows. */
  audibleStepFor(channelIdx: number): number;
  /** Step duration in seconds at the current BPM × stepUnit. */
  stepSeconds(): number;
  /** Bar duration in seconds at the current BPM × stepUnit × stepsPerBar. */
  barSeconds(): number;

  // ── Tick driver ────────────────────────────────────────────────
  /** Pump the scheduler. Hosts call this on a worker postMessage,
   *  setTimeout, or rAF cadence. Idempotent when not running. */
  tick(): void;

  /** Re-anchor every row to the start of the next bar so all rows
   *  reset to step 0 in unison. Used when the user makes a change
   *  that should resync the grid (focus toggle from groove ↔ click).
   *  No-op when not playing. */
  restartFromNextBar(): void;
}
