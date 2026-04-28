// Clock listener + sender — verify decoding 0xF8 / 0xFA / 0xFB / 0xFC,
// BPM smoothing, and the sender's start/stop/tick cadence.

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  CLOCK_CONTINUE,
  CLOCK_START,
  CLOCK_STOP,
  CLOCK_TICK,
  attachClockListener,
  makeClockSender,
} from './clock';
import type { MidiInputLike, MidiOutputLike } from './types';

interface FakeInput extends MidiInputLike {
  fire: (data: number[]) => void;
}

function makeInput(): FakeInput {
  const listeners = new Set<(e: { data: Uint8Array }) => void>();
  return {
    id: 'in',
    name: 'in',
    addEventListener: (_t, l) => { listeners.add(l); },
    removeEventListener: (_t, l) => { listeners.delete(l); },
    fire: (data) => {
      const evt = { data: new Uint8Array(data) };
      for (const l of listeners) l(evt);
    },
  };
}

function makeOutput(): MidiOutputLike & { sent: number[][] } {
  const sent: number[][] = [];
  return {
    id: 'o', name: 'o',
    send: (data) => { sent.push(Array.isArray(data) ? data : Array.from(data)); },
    sent,
  };
}

describe('attachClockListener', () => {
  it('decodes start / continue / stop', () => {
    const input = makeInput();
    const calls: string[] = [];
    const off = attachClockListener(input, {
      onStart: () => calls.push('start'),
      onContinue: () => calls.push('continue'),
      onStop: () => calls.push('stop'),
    });
    input.fire([CLOCK_START]);
    input.fire([CLOCK_CONTINUE]);
    input.fire([CLOCK_STOP]);
    expect(calls).toEqual(['start', 'continue', 'stop']);
    off();
  });

  it('derives BPM after a full window of ticks', () => {
    const input = makeInput();
    let now = 1000;
    const bpms: number[] = [];
    const off = attachClockListener(
      input,
      { onBpm: (b) => bpms.push(b) },
      () => now,
    );
    // 120 BPM = 500 ms / quarter / 24 ticks ≈ 20.833 ms per tick.
    for (let i = 0; i < 25; i++) {
      input.fire([CLOCK_TICK]);
      now += 60_000 / (120 * 24);
    }
    expect(bpms.length).toBeGreaterThan(0);
    const last = bpms[bpms.length - 1];
    expect(last).toBeGreaterThan(119);
    expect(last).toBeLessThan(121);
    off();
  });

  it('ignores non-clock messages', () => {
    const input = makeInput();
    const calls: string[] = [];
    const off = attachClockListener(input, {
      onStart: () => calls.push('start'),
    });
    input.fire([0x90, 60, 100]); // note on
    expect(calls).toEqual([]);
    off();
  });
});

describe('makeClockSender', () => {
  beforeEach(() => { vi.useFakeTimers(); });
  afterEach(() => { vi.useRealTimers(); });

  it('sends 0xFA on start, 0xF8 ticks, 0xFC on stop', () => {
    const out = makeOutput();
    const handle = makeClockSender(out, 120);
    handle.start();
    expect(out.sent[0]).toEqual([CLOCK_START]);

    // At 120 BPM, tick interval = 60_000/(120*24) ≈ 20.83 ms. 100 ms
    // should produce ~4-5 ticks.
    vi.advanceTimersByTime(100);
    const tickCount = out.sent.filter((d) => d[0] === CLOCK_TICK).length;
    expect(tickCount).toBeGreaterThan(2);

    handle.stop();
    const last = out.sent[out.sent.length - 1];
    expect(last).toEqual([CLOCK_STOP]);
    handle.dispose();
  });

  it('setBpm re-arms the interval', () => {
    const out = makeOutput();
    const handle = makeClockSender(out, 60);
    handle.start();
    vi.advanceTimersByTime(100);
    const slowTickCount = out.sent.filter((d) => d[0] === CLOCK_TICK).length;
    handle.setBpm(240);
    out.sent.length = 0;
    vi.advanceTimersByTime(100);
    const fastTickCount = out.sent.filter((d) => d[0] === CLOCK_TICK).length;
    expect(fastTickCount).toBeGreaterThan(slowTickCount);
    handle.dispose();
  });

  it('dispose stops further sends', () => {
    const out = makeOutput();
    const handle = makeClockSender(out, 120);
    handle.start();
    vi.advanceTimersByTime(50);
    handle.dispose();
    out.sent.length = 0;
    vi.advanceTimersByTime(500);
    expect(out.sent).toEqual([]);
  });

  it('dispose-while-running emits 0xFC so downstream rigs stop', () => {
    const out = makeOutput();
    const handle = makeClockSender(out, 120);
    handle.start();
    out.sent.length = 0;
    handle.dispose();
    expect(out.sent).toContainEqual([CLOCK_STOP]);
  });

  it('dispose-while-stopped does not emit a duplicate 0xFC', () => {
    const out = makeOutput();
    const handle = makeClockSender(out, 120);
    handle.start();
    handle.stop();
    out.sent.length = 0;
    handle.dispose();
    expect(out.sent).toEqual([]);
  });
});
