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

describe('AudioEngine.loadPattern()', () => {
  it('fresh load returns -1 cursors for the loaded voices (not yet started)', () => {
    const e = new AudioEngine();
    e.loadPattern(fourFour());
    // Pre-start: audibleCursors reports -1 for every loaded voice.
    expect(e.audibleCursors().KK).toBe(-1);
  });

  it('reload with same shape preserves the engine reference + bpm', () => {
    // Phase preservation across hot swaps is now covered by the
    // sequencer's own tests — see modules/sequencer/sequencer.test.ts.
    // Here we just sanity-check that AudioEngine accepts a hot
    // pattern swap without throwing.
    const e = new AudioEngine();
    e.loadPattern(fourFour());
    e.setBpm(120);
    const edited = fourFour();
    edited.tracks = { KK: [2, 1, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0] };
    expect(() => e.loadPattern(edited)).not.toThrow();
    expect(e.bpm).toBe(120);
  });

  it('hot swap to a different voice set updates audibleCursors keys', () => {
    const e = new AudioEngine();
    e.loadPattern(fourFour());
    const cursors1 = e.audibleCursors();
    expect(Object.keys(cursors1)).toContain('KK');

    const withSnareOnly = fourFour();
    withSnareOnly.tracks = {
      SN: [0, 0, 0, 0, 2, 0, 0, 0, 0, 0, 0, 0, 2, 0, 0, 0],
    };
    e.loadPattern(withSnareOnly);
    const cursors2 = e.audibleCursors();
    expect(Object.keys(cursors2)).toContain('SN');
    expect(Object.keys(cursors2)).not.toContain('KK');
  });

  it('meter change (steps + grouping) is accepted without throwing', () => {
    const e = new AudioEngine();
    e.loadPattern(fourFour());
    const threeFour = fourFour();
    threeFour.steps = 12;
    threeFour.grouping = [4, 4, 4];
    threeFour.tracks = { KK: new Array(12).fill(0) as never };
    expect(() => e.loadPattern(threeFour)).not.toThrow();
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
});
