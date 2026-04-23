// Pure timing math + guards on AudioEngine. We never call ensureCtx(),
// so no real AudioContext is ever constructed — the engine's ctx/master
// stay null and we exercise only the deterministic surface.

import { beforeEach, describe, expect, it, vi } from 'vitest';
import { AudioEngine } from './engine';
import type { Pattern } from '../patterns/types';

function fourFour(): Pattern {
  return {
    id: 'x',
    name: 'X',
    origin: '—',
    tradition: 't',
    genre: 'folk-dance',
    timeSig: '4/4',
    grouping: [4],
    steps: 16,
    stepUnit: 16,
    bpm: { default: 120, min: 60, max: 200 },
    tracks: { KK: [2, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0] },
    defaultKit: '808',
    region: 'turkey-ottoman',
    difficulty: 'beginner',
    tags: [],
    swingable: true,
  };
}

describe('AudioEngine.barSeconds()', () => {
  let e: AudioEngine;
  beforeEach(() => { e = new AudioEngine(); });

  it('returns 0 when no pattern loaded', () => {
    expect(e.barSeconds()).toBe(0);
  });

  it('computes steps × (60/bpm) for 16-step pattern at 120bpm', () => {
    e.loadPattern(fourFour());
    e.setBpm(120);
    // 16 × 60/120 = 8 seconds per bar
    expect(e.barSeconds()).toBeCloseTo(8, 10);
  });

  it('scales inversely with BPM', () => {
    e.loadPattern(fourFour());
    e.setBpm(60);
    expect(e.barSeconds()).toBeCloseTo(16, 10);
    e.setBpm(240);
    expect(e.barSeconds()).toBeCloseTo(4, 10);
  });

  it('scales linearly with steps', () => {
    const nine = fourFour();
    nine.steps = 9;
    nine.grouping = [2, 2, 2, 3];
    nine.tracks = { KK: new Array(9).fill(0) as never };
    e.loadPattern(nine);
    e.setBpm(120);
    // 9 × 0.5 = 4.5s
    expect(e.barSeconds()).toBeCloseTo(4.5, 10);
  });
});

describe('AudioEngine.subscribeOnBar()', () => {
  it('returns an unsubscribe fn that removes the listener', () => {
    const e = new AudioEngine();
    const fn = vi.fn();
    const off = e.subscribeOnBar(fn);

    // Simulate a bar callback via internal set — we're testing plumbing,
    // not the scheduler. Access via a controlled indirection.
    const listeners = (e as unknown as { barListeners: Set<(b: number) => void> }).barListeners;
    expect(listeners.has(fn)).toBe(true);

    off();
    expect(listeners.has(fn)).toBe(false);
  });

  it('multiple subscribers coexist + each unsubscribes independently', () => {
    const e = new AudioEngine();
    const a = vi.fn();
    const b = vi.fn();
    const offA = e.subscribeOnBar(a);
    const offB = e.subscribeOnBar(b);

    const listeners = (e as unknown as { barListeners: Set<(b: number) => void> }).barListeners;
    expect(listeners.size).toBe(2);

    offA();
    expect(listeners.has(a)).toBe(false);
    expect(listeners.has(b)).toBe(true);

    offB();
    expect(listeners.size).toBe(0);
  });
});

describe('AudioEngine.setOverlay() guards', () => {
  it('rejects NaN subdivisions → overlay=null', () => {
    const e = new AudioEngine();
    e.setOverlay({ subdivisions: NaN });
    expect(e.overlay).toBeNull();
  });

  it('rejects zero subdivisions → overlay=null', () => {
    const e = new AudioEngine();
    e.setOverlay({ subdivisions: 0 });
    expect(e.overlay).toBeNull();
  });

  it('rejects negative subdivisions → overlay=null', () => {
    const e = new AudioEngine();
    e.setOverlay({ subdivisions: -3 });
    expect(e.overlay).toBeNull();
  });

  it('rejects Infinity subdivisions → overlay=null', () => {
    const e = new AudioEngine();
    e.setOverlay({ subdivisions: Infinity });
    expect(e.overlay).toBeNull();
  });

  it('accepts valid positive subdivisions', () => {
    const e = new AudioEngine();
    e.setOverlay({ subdivisions: 5 });
    expect(e.overlay).toEqual({ subdivisions: 5 });
  });

  it('null clears overlay', () => {
    const e = new AudioEngine();
    e.setOverlay({ subdivisions: 3 });
    e.setOverlay(null);
    expect(e.overlay).toBeNull();
  });
});

describe('AudioEngine.setMasterVolume()', () => {
  it('clamps above 1 → 1, below 0 → 0, preserves in-range', () => {
    const e = new AudioEngine();
    e.setMasterVolume(1.5);  expect(e.getMasterVolume()).toBe(1);
    e.setMasterVolume(-0.2); expect(e.getMasterVolume()).toBe(0);
    e.setMasterVolume(0.5);  expect(e.getMasterVolume()).toBe(0.5);
  });

  it('default master volume is 0.85', () => {
    expect(new AudioEngine().getMasterVolume()).toBe(0.85);
  });
});

describe('AudioEngine.loadPattern() hot swap', () => {
  it('fresh load (not running) resets nextIdx + cursors per track', () => {
    const e = new AudioEngine();
    e.loadPattern(fourFour());
    const inner = e as unknown as {
      nextIdx: Record<string, number>;
      cursors: Record<string, number>;
    };
    expect(inner.nextIdx.KK).toBe(0);
    expect(inner.cursors.KK).toBe(-1);
  });

  it('hot swap while running preserves scheduler phase for surviving tracks', () => {
    // Sequencer state doesn't care about real AudioContext — we forge
    // a "running" engine, advance nextIdx by hand, then hot-swap. The
    // invariant: nextIdx must NOT snap back to 0, because that would
    // restart the pattern audibly mid-bar every time a cell is toggled.
    const e = new AudioEngine();
    e.loadPattern(fourFour());
    const inner = e as unknown as {
      running: boolean;
      nextIdx: Record<string, number>;
      cursors: Record<string, number>;
      nextNoteTimes: Record<string, number>;
    };
    inner.running = true;
    inner.nextIdx.KK = 7;
    inner.cursors.KK = 7;
    inner.nextNoteTimes.KK = 4.25;

    // Cell edit: same track shape, different velocities.
    const edited = fourFour();
    edited.tracks = { KK: [2, 1, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0] };
    e.loadPattern(edited);

    expect(inner.nextIdx.KK).toBe(7);          // phase preserved
    expect(inner.cursors.KK).toBe(7);
    expect(inner.nextNoteTimes.KK).toBe(4.25); // schedule preserved
  });

  it('hot swap initialises freshly-added tracks + prunes removed ones', () => {
    const e = new AudioEngine();
    e.loadPattern(fourFour());
    const inner = e as unknown as {
      running: boolean;
      nextIdx: Record<string, number>;
      cursors: Record<string, number>;
      nextNoteTimes: Record<string, number>;
      nextBarTime: number;
    };
    inner.running = true;
    inner.nextBarTime = 3.14;

    const withSnare = fourFour();
    withSnare.tracks = {
      SN: [0, 0, 0, 0, 2, 0, 0, 0, 0, 0, 0, 0, 2, 0, 0, 0],
    };
    e.loadPattern(withSnare);

    expect(inner.nextIdx.KK).toBeUndefined();  // pruned
    expect(inner.nextIdx.SN).toBe(0);           // initialised
    expect(inner.nextNoteTimes.SN).toBe(3.14);  // at next bar
    expect(inner.cursors.SN).toBe(-1);
  });
});

describe('AudioEngine simple setters', () => {
  it('setKit updates kit id', () => {
    const e = new AudioEngine();
    expect(e.kit).toBe('808');
    e.setKit('tabla');
    expect(e.kit).toBe('tabla');
  });

  it('setBpm / setSwing / setAccents assign fields', () => {
    const e = new AudioEngine();
    e.setBpm(140); expect(e.bpm).toBe(140);
    e.setSwing(0.66); expect(e.swing).toBeCloseTo(0.66, 10);
    e.setAccents(0.9, 0.4);
    expect(e.strongAmp).toBe(0.9);
    expect(e.weakAmp).toBe(0.4);
  });

  it('setGroupAccents copies the input (no shared reference)', () => {
    const e = new AudioEngine();
    const amps = [1, 0.5, 1];
    e.setGroupAccents(amps);
    amps[0] = 99;
    expect(e.groupAmps[0]).toBe(1);
  });
});
