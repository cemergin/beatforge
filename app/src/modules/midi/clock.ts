// MIDI clock helpers.
//
// LISTENER — attaches a 'midimessage' listener filtered to 0xF8 / 0xFA /
// 0xFB / 0xFC. Smooths BPM over a window of recent ticks (24 PPQN) so
// jitter from USB MIDI roundtrip doesn't make tempo flap. Calls back
// with the smoothed BPM and with start/stop/continue events; the
// caller decides what to do with them (e.g. session.setBpm + start).
//
// SENDER — drives a setInterval at 60_000/(bpm*24) ms. Sends 0xFA on
// start and 0xFC on stop. The interval re-arms whenever BPM changes
// so tempo automation tracks. Not sample-accurate (setInterval drifts
// at ~1 ms scale) but enough for soft sync; tighter sync would need
// a sample-aligned scheduler hook.

import type { MidiInputLike, MidiOutputLike } from './types';

export const CLOCK_TICK = 0xf8;
export const CLOCK_START = 0xfa;
export const CLOCK_CONTINUE = 0xfb;
export const CLOCK_STOP = 0xfc;

/** Window of clock ticks averaged when deriving BPM. 24 = one quarter
 *  note's worth of pulses. Larger windows track tempo automation
 *  more sluggishly; smaller windows let jitter through. */
const TICK_WINDOW = 24;

export interface ClockListenerCallbacks {
  /** Called with the smoothed BPM after every TICK_WINDOW ticks once
   *  enough samples are available. Caller pushes this to the engine
   *  via session.setBpm. */
  onBpm?: (bpm: number) => void;
  /** 0xFA — fresh start. */
  onStart?: () => void;
  /** 0xFB — resume from current position. */
  onContinue?: () => void;
  /** 0xFC — stop. */
  onStop?: () => void;
}

/** Attach a clock listener to a Web MIDI input. Returns an unsubscribe.
 *  The handler ignores all non-clock messages so it can coexist with
 *  the regular mapping bridge attached to the same input. */
export function attachClockListener(
  input: MidiInputLike,
  callbacks: ClockListenerCallbacks,
  now: () => number = () => performance.now(),
): () => void {
  const intervals: number[] = [];
  let lastTickAt: number | null = null;

  const handler = (event: { data: Uint8Array }): void => {
    const status = event.data[0];
    if (status === CLOCK_TICK) {
      const t = now();
      if (lastTickAt !== null) {
        const delta = t - lastTickAt;
        intervals.push(delta);
        if (intervals.length > TICK_WINDOW) intervals.shift();
        if (intervals.length >= TICK_WINDOW && callbacks.onBpm) {
          const sum = intervals.reduce((a, b) => a + b, 0);
          const avgMs = sum / intervals.length;
          // 60_000 ms/min ÷ (24 ppq × avg_ms_per_tick) = quarter-note BPM.
          // Round to 2 decimals — the 3rd/4th decimal is below the
          // measurement noise floor of setTimeout/MIDI roundtrip and
          // makes the BPM display flap on every tick.
          const bpm = Math.round((60_000 / (24 * avgMs)) * 100) / 100;
          if (Number.isFinite(bpm) && bpm > 0) callbacks.onBpm(bpm);
        }
      }
      lastTickAt = t;
    } else if (status === CLOCK_START) {
      intervals.length = 0;
      lastTickAt = null;
      callbacks.onStart?.();
    } else if (status === CLOCK_CONTINUE) {
      callbacks.onContinue?.();
    } else if (status === CLOCK_STOP) {
      callbacks.onStop?.();
    }
  };

  input.addEventListener('midimessage', handler);
  return () => input.removeEventListener('midimessage', handler);
}

export interface ClockSenderHandle {
  /** Begin sending 0xFA + ongoing 0xF8 ticks. Idempotent — calling
   *  start() while already running re-emits 0xFA (which is what most
   *  receivers want — they treat it as a re-sync). */
  start: () => void;
  stop: () => void;
  /** Update BPM at runtime. Tick rate updates on the next interval. */
  setBpm: (bpm: number) => void;
  /** Detach permanently. Stops if running. */
  dispose: () => void;
}

/** Drive 24 PPQN clock to a Web MIDI output. The sender owns its own
 *  setInterval; the caller is responsible for start/stop and BPM. */
export function makeClockSender(
  output: MidiOutputLike,
  initialBpm: number,
  onSent?: (data: number[]) => void,
): ClockSenderHandle {
  let bpm = Math.max(1, initialBpm);
  let timer: ReturnType<typeof setInterval> | null = null;
  let running = false;

  const tickIntervalMs = (): number => 60_000 / (bpm * 24);

  const sendTick = (): void => {
    output.send([CLOCK_TICK]);
    onSent?.([CLOCK_TICK]);
  };

  const arm = (): void => {
    if (timer) clearInterval(timer);
    timer = setInterval(sendTick, tickIntervalMs());
  };

  return {
    start: () => {
      output.send([CLOCK_START]);
      onSent?.([CLOCK_START]);
      running = true;
      arm();
    },
    stop: () => {
      if (timer) { clearInterval(timer); timer = null; }
      output.send([CLOCK_STOP]);
      onSent?.([CLOCK_STOP]);
      running = false;
    },
    setBpm: (next) => {
      bpm = Math.max(1, next);
      if (running) arm();
    },
    dispose: () => {
      if (timer) { clearInterval(timer); timer = null; }
      running = false;
    },
  };
}
