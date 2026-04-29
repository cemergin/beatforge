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

// ── Schema invariants — fail the build for any seed pattern with an
// internally inconsistent timeSig / stepUnit / grouping triplet. The
// runtime reads stepUnit + grouping for playback timing AND timeSig
// (denom) for BPM display conversion (audio/tempo.ts:29). When the
// two disagree, the user sees a wrong displayed BPM + a label that
// doesn't match the visible dot count. See
// docs/process/engineering-audits/notes-2026-04-28.md for the original audit.
//
// The invariant: numerator(timeSig) === sum(grouping) × (denom / stepUnit).
// Derivation: every step is 1/stepUnit of a whole note. A bar of
// sum(grouping) steps therefore contains sum/stepUnit whole notes.
// Time signature N/D says a bar holds N (1/D)-notes, i.e. N/D whole
// notes. Setting equal: sum/stepUnit = N/D ⇒ N = sum × D / stepUnit.
//
// Sanity:
//   4/4 + grouping[4,4,4,4] sum=16, stepUnit=16 → 16*4/16 = 4 ✓
//   9/8 + grouping[2,2,2,3] sum=9,  stepUnit=8  → 9*8/8   = 9 ✓
//   12/8 + grouping[3,3,3,3] sum=12, stepUnit=8 → 12*8/8  = 12 ✓
//   16/8 + grouping[4,4,4,4] sum=16, stepUnit=8 → 16*8/8  = 16 ✓
describe('seed schema invariants', () => {
  function parseTimeSig(ts: string): { num: number; denom: number } | null {
    const parts = ts.split('/');
    if (parts.length !== 2) return null;
    const num = parseInt(parts[0], 10);
    const denom = parseInt(parts[1], 10);
    if (!Number.isFinite(num) || !Number.isFinite(denom) || num <= 0 || denom <= 0) return null;
    return { num, denom };
  }

  it('timeSig parses cleanly for every pattern', () => {
    const broken: string[] = [];
    for (const p of PATTERNS) {
      if (!parseTimeSig(p.timeSig)) broken.push(`${p.id}: "${p.timeSig}"`);
    }
    expect(broken).toEqual([]);
  });

  it('numerator(timeSig) === sum(grouping) × (stepUnit / denom) for every pattern', () => {
    const violations: string[] = [];
    for (const p of PATTERNS) {
      const ts = parseTimeSig(p.timeSig);
      if (!ts) continue; // covered by previous test
      const sum = p.grouping.reduce((a, b) => a + b, 0);
      const expected = (sum * ts.denom) / p.stepUnit;
      if (expected !== ts.num) {
        violations.push(
          `${p.id}: timeSig="${p.timeSig}" stepUnit=${p.stepUnit} grouping=${JSON.stringify(p.grouping)} (sum=${sum}) — expected numerator ${expected}, got ${ts.num}`,
        );
      }
    }
    expect(violations).toEqual([]);
  });

  it('sum(grouping) === steps for every pattern', () => {
    const violations: string[] = [];
    for (const p of PATTERNS) {
      const sum = p.grouping.reduce((a, b) => a + b, 0);
      if (sum !== p.steps) {
        violations.push(
          `${p.id}: grouping=${JSON.stringify(p.grouping)} (sum=${sum}) but steps=${p.steps}`,
        );
      }
    }
    expect(violations).toEqual([]);
  });
});
