// Tests for the Studio pattern-utility functions.

import { describe, it, expect } from 'vitest';
import type { Pattern, Velocity, VoiceId, Track } from '../../patterns/types';
import { clonePattern, resizeTracksToSteps, resizeVelocityArray } from './patternOps';

function basePattern(): Pattern {
  return {
    id: 'test-1',
    name: 'Test',
    origin: 'Test',
    tradition: 'Test',
    genre: 'exercise',
    timeSig: '4/4',
    grouping: [4, 4, 4, 4],
    steps: 16,
    stepUnit: 16,
    bpm: { default: 400, min: 200, max: 600 },
    tracks: {
      KK: [2, 0, 0, 0, 1, 0, 0, 0, 2, 0, 0, 0, 1, 0, 0, 0],
    },
    defaultKit: '808',
    region: 'electronic-western',
    difficulty: 'beginner',
    tags: ['test'],
    swingable: true,
  };
}

describe('clonePattern', () => {
  it('returns a structurally-equal but distinct object', () => {
    const a = basePattern();
    const b = clonePattern(a);
    expect(b).toEqual(a);
    expect(b).not.toBe(a);
  });

  it('does not share the tracks reference', () => {
    const a = basePattern();
    const b = clonePattern(a);
    expect(b.tracks).not.toBe(a.tracks);
  });

  it('does not share track-array references (mutating clone leaves seed alone)', () => {
    const a = basePattern();
    const b = clonePattern(a);
    (b.tracks.KK as Velocity[])[0] = 0;
    expect((a.tracks.KK as Velocity[])[0]).toBe(2);
  });

  it('clones object-form tracks (with subdivisions/cycle)', () => {
    const a = basePattern();
    const objTrack: Track = {
      pattern: [1, 0, 1, 0, 1] as Velocity[],
      subdivisions: 5,
      cycle: 5,
    };
    a.tracks.SN = objTrack;
    const b = clonePattern(a);
    const cloned = b.tracks.SN as Exclude<Track, Velocity[]>;
    expect(cloned).not.toBe(objTrack);
    expect(cloned.pattern).not.toBe(objTrack.pattern);
    expect(cloned.subdivisions).toBe(5);
    cloned.pattern[0] = 0 as Velocity;
    expect(objTrack.pattern[0]).toBe(1);
  });

  it('clones grouping + tags arrays so mutating clone leaves seed alone', () => {
    const a = basePattern();
    const b = clonePattern(a);
    b.grouping[0] = 99;
    b.tags.push('mutated');
    expect(a.grouping[0]).toBe(4);
    expect(a.tags).not.toContain('mutated');
  });

  it('clones bpm metadata', () => {
    const a = basePattern();
    const b = clonePattern(a);
    expect(b.bpm).not.toBe(a.bpm);
    b.bpm.default = 999;
    expect(a.bpm.default).toBe(400);
  });

  it('handles undefined optional arrays (instruments, relatedIds)', () => {
    const a = basePattern();
    expect(a.instruments).toBeUndefined();
    const b = clonePattern(a);
    expect(b.instruments).toBeUndefined();
    expect(b.relatedIds).toBeUndefined();
  });
});

describe('resizeVelocityArray', () => {
  it('truncates when shrinking', () => {
    const arr: Velocity[] = [2, 1, 0, 2, 1, 0, 2, 1];
    expect(resizeVelocityArray(arr, 4)).toEqual([2, 1, 0, 2]);
  });

  it('zero-pads when growing', () => {
    const arr: Velocity[] = [2, 1, 0, 2];
    expect(resizeVelocityArray(arr, 8)).toEqual([2, 1, 0, 2, 0, 0, 0, 0]);
  });

  it('returns a fresh array (no shared reference)', () => {
    const arr: Velocity[] = [1, 0];
    const out = resizeVelocityArray(arr, 2);
    out[0] = 0 as Velocity;
    expect(arr[0]).toBe(1);
  });

  it('handles size 0 cleanly', () => {
    expect(resizeVelocityArray([1, 1, 1] as Velocity[], 0)).toEqual([]);
  });
});

describe('resizeTracksToSteps', () => {
  it('resizes a flat-array (main-division) track', () => {
    const tracks: Partial<Record<VoiceId, Track>> = {
      KK: [2, 0, 0, 0, 2, 0, 0, 0, 2, 0, 0, 0, 2, 0, 0, 0],
    };
    const out = resizeTracksToSteps(tracks, 16, 8);
    expect(out.KK).toEqual([2, 0, 0, 0, 2, 0, 0, 0]);
  });

  it('resizes object-form main-division track and updates cycle', () => {
    const obj: Track = {
      pattern: [1, 1, 1, 1] as Velocity[],
      subdivisions: 16,
      cycle: 16,
    };
    const out = resizeTracksToSteps({ KK: obj }, 16, 8);
    const result = out.KK as Exclude<Track, Velocity[]>;
    expect(result.pattern).toEqual([1, 1, 1, 1, 0, 0, 0, 0]);
    expect(result.cycle).toBe(8);
    expect(result.subdivisions).toBe(16);
  });

  it('passes through polyrhythm tracks (subdivisions != oldSteps) untouched', () => {
    const polyTrack: Track = {
      pattern: [1, 0, 1, 0, 1] as Velocity[],
      subdivisions: 5,
      cycle: 5,
    };
    const out = resizeTracksToSteps({ HH: polyTrack }, 16, 8);
    // Same reference — passed through, not resized.
    expect(out.HH).toBe(polyTrack);
  });

  it('handles a mix of main-division + polyrhythm tracks', () => {
    const tracks: Partial<Record<VoiceId, Track>> = {
      KK: [2, 0, 0, 0, 2, 0, 0, 0],   // flat array, main-division
      HH: { pattern: [1, 1, 1] as Velocity[], subdivisions: 3, cycle: 3 },  // poly
    };
    const out = resizeTracksToSteps(tracks, 8, 16);
    expect(out.KK).toEqual([2, 0, 0, 0, 2, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]);
    expect(out.HH).toBe(tracks.HH);
  });

  it('returns an empty object when given empty input', () => {
    expect(resizeTracksToSteps({}, 16, 8)).toEqual({});
  });
});
