// Schema validation — pure, no IndexedDB traffic. We only exercise
// isValidPattern / isValidUserPattern so Dexie's open() never fires.

import { describe, expect, it } from 'vitest';
import { isValidPattern, isValidUserPattern, type UserPattern } from './db';
import type { Pattern } from '../patterns/types';

// Minimal valid Pattern — the floor every test mutates from.
function basePattern(): Pattern {
  return {
    id: 'test-pattern',
    name: 'Test',
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
    region: 'turkey-ottoman',
    difficulty: 'beginner',
    tags: ['test'],
    swingable: false,
  };
}

function baseUser(): UserPattern {
  return {
    ...basePattern(),
    id: 'user-pattern',
    user: true,
    createdAt: 1_700_000_000_000,
    updatedAt: 1_700_000_000_000,
  };
}

describe('isValidPattern', () => {
  it('accepts a minimal valid Pattern', () => {
    expect(isValidPattern(basePattern())).toBe(true);
  });

  it('accepts Pattern with all optional fields populated', () => {
    const full: Pattern = {
      ...basePattern(),
      poly: true,
      country: 'TR',
      instruments: ['darbuka'],
      relatedIds: ['other'],
      story: 'A rhythm story.',
      sources: ['src'],
    };
    expect(isValidPattern(full)).toBe(true);
  });

  it('accepts Track in full-object form', () => {
    const p = basePattern();
    p.tracks = { KK: { pattern: [2, 1, 1], subdivisions: 3 } };
    expect(isValidPattern(p)).toBe(true);
  });

  it('rejects null / non-object', () => {
    expect(isValidPattern(null)).toBe(false);
    expect(isValidPattern(undefined)).toBe(false);
    expect(isValidPattern('nope')).toBe(false);
    expect(isValidPattern(42)).toBe(false);
  });

  it('rejects empty tracks object', () => {
    const p = basePattern();
    p.tracks = {};
    expect(isValidPattern(p)).toBe(false);
  });

  it('rejects zero or negative steps', () => {
    const p = basePattern();
    (p as Pattern).steps = 0;
    expect(isValidPattern(p)).toBe(false);
    (p as Pattern).steps = -4;
    expect(isValidPattern(p)).toBe(false);
  });

  it('rejects grouping sum != steps', () => {
    const p = basePattern();
    p.grouping = [2, 3];          // sum=5, steps=4
    expect(isValidPattern(p)).toBe(false);
  });

  it('rejects unknown voice id in tracks', () => {
    const p = basePattern();
    (p.tracks as Record<string, unknown>).XX = [1, 0, 1, 0];
    expect(isValidPattern(p)).toBe(false);
  });

  it('rejects non-enum region', () => {
    const p = basePattern() as unknown as Record<string, unknown>;
    p.region = 'atlantis';
    expect(isValidPattern(p)).toBe(false);
  });

  it('rejects non-enum genre', () => {
    const p = basePattern() as unknown as Record<string, unknown>;
    p.genre = 'space-jazz';
    expect(isValidPattern(p)).toBe(false);
  });

  it('rejects non-enum kit', () => {
    const p = basePattern() as unknown as Record<string, unknown>;
    p.defaultKit = '999';
    expect(isValidPattern(p)).toBe(false);
  });

  it('rejects bpm.default typed as string', () => {
    const p = basePattern() as unknown as Record<string, unknown>;
    p.bpm = { default: '120', min: 60, max: 200 };
    expect(isValidPattern(p)).toBe(false);
  });

  it('rejects missing bpm field entirely', () => {
    const p = basePattern() as unknown as Record<string, unknown>;
    delete p.bpm;
    expect(isValidPattern(p)).toBe(false);
  });

  it('rejects non-boolean swingable', () => {
    const p = basePattern() as unknown as Record<string, unknown>;
    p.swingable = 'yes';
    expect(isValidPattern(p)).toBe(false);
  });

  it('rejects bad stepUnit', () => {
    const p = basePattern() as unknown as Record<string, unknown>;
    p.stepUnit = 32;
    expect(isValidPattern(p)).toBe(false);
  });

  it('rejects velocity values outside [0,1,2]', () => {
    const p = basePattern();
    (p.tracks as Record<string, unknown>).KK = [3, 0, 1, 0];
    expect(isValidPattern(p)).toBe(false);
  });
});

describe('isValidUserPattern', () => {
  it('accepts a valid UserPattern', () => {
    expect(isValidUserPattern(baseUser())).toBe(true);
  });

  it('rejects when user !== true', () => {
    const u = baseUser() as unknown as Record<string, unknown>;
    u.user = false;
    expect(isValidUserPattern(u)).toBe(false);
  });

  it('rejects when user field missing', () => {
    const u = baseUser() as unknown as Record<string, unknown>;
    delete u.user;
    expect(isValidUserPattern(u)).toBe(false);
  });

  it('rejects when createdAt missing', () => {
    const u = baseUser() as unknown as Record<string, unknown>;
    delete u.createdAt;
    expect(isValidUserPattern(u)).toBe(false);
  });

  it('rejects when updatedAt missing', () => {
    const u = baseUser() as unknown as Record<string, unknown>;
    delete u.updatedAt;
    expect(isValidUserPattern(u)).toBe(false);
  });

  it('rejects if underlying Pattern shape is invalid', () => {
    const u = baseUser();
    u.grouping = [9, 9]; // sum != steps
    expect(isValidUserPattern(u)).toBe(false);
  });
});
