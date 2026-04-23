// patternById() + registerPatternSource() — the resolution path Practice
// and Library use to look up any pattern without importing Dexie.

import { describe, expect, it } from 'vitest';
import { PATTERNS, patternById, registerPatternSource } from './index';
import type { Pattern } from '../types';

function fakePattern(id: string): Pattern {
  return {
    id,
    name: `Fake ${id}`,
    origin: '—',
    tradition: 'test',
    genre: 'folk-dance',
    timeSig: '4/4',
    grouping: [4],
    steps: 4,
    stepUnit: 4,
    bpm: { default: 120, min: 60, max: 200 },
    tracks: { KK: [2, 0, 1, 0] },
    defaultKit: '808',
    region: 'exercise',
    difficulty: 'beginner',
    tags: [],
    swingable: false,
  };
}

describe('patternById', () => {
  it('returns a Pattern for a known built-in id', () => {
    // Pick the first seeded pattern — built-ins should always be resolvable.
    expect(PATTERNS.length).toBeGreaterThan(0);
    const known = PATTERNS[0];
    const hit = patternById(known.id);
    expect(hit).toBeDefined();
    expect(hit?.id).toBe(known.id);
    expect(hit).toBe(known);
  });

  it('returns undefined for an unknown id with no extra sources', () => {
    expect(patternById('definitely-not-a-real-id-zzz')).toBeUndefined();
  });

  it('built-in PATTERNS have unique ids', () => {
    const ids = PATTERNS.map((p) => p.id);
    const uniq = new Set(ids);
    expect(uniq.size).toBe(ids.length);
  });
});

describe('registerPatternSource', () => {
  it('consults extra sources after built-in PATTERNS are exhausted', () => {
    const extra = fakePattern('extra-only-id');
    const off = registerPatternSource((id) => (id === extra.id ? extra : undefined));

    try {
      const hit = patternById(extra.id);
      expect(hit).toBeDefined();
      expect(hit?.id).toBe('extra-only-id');
    } finally {
      off();
    }
  });

  it('returned unsubscribe fn removes the source', () => {
    const extra = fakePattern('ephemeral-id');
    const off = registerPatternSource((id) => (id === extra.id ? extra : undefined));

    expect(patternById('ephemeral-id')).toBeDefined();
    off();
    expect(patternById('ephemeral-id')).toBeUndefined();
  });

  it('built-ins take priority over extra sources', () => {
    // Register a hostile source that claims to own a built-in id; the
    // built-in should still win.
    const firstBuiltIn = PATTERNS[0];
    const decoy: Pattern = { ...fakePattern(firstBuiltIn.id), name: 'Decoy' };
    const off = registerPatternSource(() => decoy);

    try {
      const hit = patternById(firstBuiltIn.id);
      expect(hit).toBe(firstBuiltIn);
      expect(hit?.name).not.toBe('Decoy');
    } finally {
      off();
    }
  });

  it('multiple sources are each consulted in registration order', () => {
    const a = fakePattern('multi-a');
    const b = fakePattern('multi-b');
    const offA = registerPatternSource((id) => (id === a.id ? a : undefined));
    const offB = registerPatternSource((id) => (id === b.id ? b : undefined));

    try {
      expect(patternById('multi-a')?.id).toBe('multi-a');
      expect(patternById('multi-b')?.id).toBe('multi-b');
    } finally {
      offA();
      offB();
    }
  });

  it('unsubscribe is idempotent (calling twice does not throw)', () => {
    const off = registerPatternSource(() => undefined);
    expect(() => { off(); off(); }).not.toThrow();
  });
});
