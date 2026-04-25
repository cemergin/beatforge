// Tempo conversion math — drives every BPM display + scheduler call site.

import { describe, expect, it } from 'vitest';
import {
  denomGlyph,
  naturalTempo,
  naturalToStepBpm,
  parseTimeSigDenom,
  stepToNaturalBpm,
} from './tempo';

describe('parseTimeSigDenom', () => {
  it('parses standard denominators', () => {
    expect(parseTimeSigDenom('4/4')).toBe(4);
    expect(parseTimeSigDenom('3/4')).toBe(4);
    expect(parseTimeSigDenom('9/8')).toBe(8);
    expect(parseTimeSigDenom('6/8')).toBe(8);
    expect(parseTimeSigDenom('11/16')).toBe(16);
    expect(parseTimeSigDenom('10/4')).toBe(4);
  });

  it('falls back to 4 on malformed input', () => {
    expect(parseTimeSigDenom('')).toBe(4);
    expect(parseTimeSigDenom('weird')).toBe(4);
    expect(parseTimeSigDenom('4/')).toBe(4);
    expect(parseTimeSigDenom('/4')).toBe(4);
    expect(parseTimeSigDenom('4/0')).toBe(4); // 0 is rejected → fallback
  });
});

describe('stepToNaturalBpm <-> naturalToStepBpm', () => {
  it('is identity when stepUnit equals denom', () => {
    expect(stepToNaturalBpm(120, 4, 4)).toBe(120);
    expect(stepToNaturalBpm(200, 8, 8)).toBe(200);
    expect(stepToNaturalBpm(102, 16, 16)).toBe(102);
  });

  it('halves quarter-rate for 8th-step patterns', () => {
    // 4/4 timeSig but pattern stored in 8ths: stepUnit=8, denom=4
    expect(stepToNaturalBpm(240, 8, 4)).toBe(120);
    expect(naturalToStepBpm(120, 8, 4)).toBe(240);
  });

  it('quarters step rate for 16th-step 4/4 patterns', () => {
    // The Soukous example: stepUnit=16, denom=4, step BPM 400 → ♩=100
    expect(stepToNaturalBpm(400, 16, 4)).toBe(100);
    expect(naturalToStepBpm(100, 16, 4)).toBe(400);
  });

  it('halves step rate for 16th-step 8th patterns (9/8 etc.)', () => {
    // 9/8 with stepUnit=16, step BPM 400 → ♪=200
    expect(stepToNaturalBpm(400, 16, 8)).toBe(200);
    expect(naturalToStepBpm(200, 16, 8)).toBe(400);
  });

  it('round-trips through (step → natural → step)', () => {
    for (const stepUnit of [4, 8, 16] as const) {
      for (const denom of [2, 4, 8, 16] as const) {
        // Pick a step-BPM that divides cleanly so rounding is a no-op.
        const stepBpm = 4 * stepUnit * denom; // arbitrary multiple
        const natural = stepToNaturalBpm(stepBpm, stepUnit, denom);
        const back = naturalToStepBpm(natural, stepUnit, denom);
        expect(back).toBe(stepBpm);
      }
    }
  });

  it('rounds to integer values (no fractional BPM)', () => {
    // 333 step BPM at stepUnit=16 / denom=4 → 333*4/16 = 83.25 → rounds to 83
    expect(stepToNaturalBpm(333, 16, 4)).toBe(83);
  });
});

describe('denomGlyph', () => {
  it('maps standard denominators to glyphs', () => {
    expect(denomGlyph(4)).toBe('♩');
    expect(denomGlyph(8)).toBe('♪');
    expect(denomGlyph(16)).toBe('♬');
    expect(denomGlyph(2)).toBe('𝅗𝅥');
  });

  it('falls back to ♩ for unknown denominators', () => {
    expect(denomGlyph(3)).toBe('♩');
    expect(denomGlyph(0)).toBe('♩');
    expect(denomGlyph(32)).toBe('♩');
  });
});

describe('naturalTempo', () => {
  it('combines parseTimeSigDenom + stepToNaturalBpm + denomGlyph', () => {
    // Soukous: 4/4, stepUnit=16, step BPM 400 → ♩=100
    expect(naturalTempo(400, 16, '4/4')).toEqual({
      value: 100,
      glyph: '♩',
      denom: 4,
    });

    // 9/8 pattern, stepUnit=16, step BPM 400 → ♪=200
    expect(naturalTempo(400, 16, '9/8')).toEqual({
      value: 200,
      glyph: '♪',
      denom: 8,
    });

    // 11/16 pattern, stepUnit=16, step BPM 102 → ♬=102
    expect(naturalTempo(102, 16, '11/16')).toEqual({
      value: 102,
      glyph: '♬',
      denom: 16,
    });
  });
});
