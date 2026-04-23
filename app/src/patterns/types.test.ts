// Coverage for trackMeta — the shorthand→normalized resolver every
// scheduler pass relies on. Polyrhythm safety depends on its subdivisions
// fallback behavior, so every branch matters.

import { describe, expect, it } from 'vitest';
import { trackMeta, type Track, type Velocity } from './types';

describe('trackMeta', () => {
  describe('Velocity[] shorthand form', () => {
    it('defaults subdivisions to mainSteps and cycle to array length', () => {
      const track: Track = [2, 0, 1, 0];
      const meta = trackMeta(track, 16);

      expect(meta.subdivisions).toBe(16);
      expect(meta.cycle).toBe(4);
      expect(meta.pattern).toEqual([2, 0, 1, 0]);
    });

    it('preserves the original pattern reference (no copy)', () => {
      const track: Velocity[] = [1, 2, 0];
      const meta = trackMeta(track, 3);
      expect(meta.pattern).toBe(track);
    });

    it('cycle equals pattern.length when shorter than mainSteps', () => {
      const track: Track = [2, 0];
      const meta = trackMeta(track, 16);
      expect(meta.cycle).toBe(2);
      expect(meta.subdivisions).toBe(16);
    });

    it('handles empty array (cycle=0)', () => {
      const meta = trackMeta([], 8);
      expect(meta.cycle).toBe(0);
      expect(meta.subdivisions).toBe(8);
    });
  });

  describe('Full object form', () => {
    it('uses explicit subdivisions and cycle when both provided', () => {
      const track: Track = {
        pattern: [2, 1, 1],
        subdivisions: 3,
        cycle: 3,
      };
      const meta = trackMeta(track, 16);

      expect(meta.subdivisions).toBe(3);
      expect(meta.cycle).toBe(3);
      expect(meta.pattern).toEqual([2, 1, 1]);
    });

    it('defaults cycle to pattern.length when only subdivisions provided', () => {
      const track: Track = {
        pattern: [2, 0, 1, 0, 2],
        subdivisions: 5,
      };
      const meta = trackMeta(track, 16);

      expect(meta.subdivisions).toBe(5);
      expect(meta.cycle).toBe(5);
    });

    it('defaults subdivisions to mainSteps when only cycle provided', () => {
      const track: Track = {
        pattern: [2, 0, 1, 0],
        cycle: 4,
      };
      const meta = trackMeta(track, 16);

      expect(meta.subdivisions).toBe(16);
      expect(meta.cycle).toBe(4);
    });

    it('defaults both when neither field is provided', () => {
      const track: Track = { pattern: [1, 2, 1] };
      const meta = trackMeta(track, 12);

      expect(meta.subdivisions).toBe(12);
      expect(meta.cycle).toBe(3);
    });

    it('supports polyrhythm case (3:4 triplets)', () => {
      // Triplets spread across 4 main steps — subdivisions=3 covers the bar
      const track: Track = { pattern: [2, 1, 1], subdivisions: 3 };
      const meta = trackMeta(track, 4);

      expect(meta.subdivisions).toBe(3);
      expect(meta.cycle).toBe(3);
    });
  });
});
