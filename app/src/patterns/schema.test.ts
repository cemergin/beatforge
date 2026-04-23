// Schema-level coverage for the Zod parse path. Complements lib/db.test.ts
// which exercises isValidPattern / isValidUserPattern through db.ts.

import { describe, expect, it } from 'vitest';
import {
  PatternSchema,
  UserPatternSchema,
  parsePattern,
  safeParsePattern,
} from './schema';
import type { Pattern } from './types';

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

describe('PatternSchema', () => {
  it('accepts a minimal valid Pattern', () => {
    const r = PatternSchema.safeParse(basePattern());
    expect(r.success).toBe(true);
  });

  it('accepts the polyrhythm exercise shape (object-form track)', () => {
    const p: Pattern = {
      ...basePattern(),
      id: 'poly',
      poly: true,
      tracks: {
        KK: [2, 1, 1, 1],
        SN: { pattern: [2, 1, 1], subdivisions: 3 },
      },
    };
    expect(PatternSchema.safeParse(p).success).toBe(true);
  });

  it('rejects grouping sum != steps', () => {
    const p = { ...basePattern(), grouping: [2, 3], steps: 4 };
    const r = PatternSchema.safeParse(p);
    expect(r.success).toBe(false);
    if (!r.success) {
      const paths = r.error.issues.map((i) => i.path.join('.'));
      expect(paths).toContain('grouping');
    }
  });

  it('rejects empty grouping', () => {
    const p = { ...basePattern(), grouping: [] };
    expect(PatternSchema.safeParse(p).success).toBe(false);
  });

  it('rejects empty tracks (no voices)', () => {
    const p = { ...basePattern(), tracks: {} };
    expect(PatternSchema.safeParse(p).success).toBe(false);
  });

  it('rejects unknown voice id in tracks', () => {
    const p = { ...basePattern(), tracks: { ...basePattern().tracks, XX: [1, 0, 1, 0] } };
    expect(PatternSchema.safeParse(p).success).toBe(false);
  });

  it('rejects velocity values outside [0,1,2]', () => {
    const p = { ...basePattern(), tracks: { KK: [3, 0, 1, 0] } };
    expect(PatternSchema.safeParse(p).success).toBe(false);
  });

  it('rejects non-enum region', () => {
    const p = { ...basePattern(), region: 'atlantis' } as unknown;
    expect(PatternSchema.safeParse(p).success).toBe(false);
  });

  it('rejects non-enum genre', () => {
    const p = { ...basePattern(), genre: 'space-jazz' } as unknown;
    expect(PatternSchema.safeParse(p).success).toBe(false);
  });

  it('rejects non-enum defaultKit', () => {
    const p = { ...basePattern(), defaultKit: '999' } as unknown;
    expect(PatternSchema.safeParse(p).success).toBe(false);
  });

  it('rejects stepUnit outside {4,8,16}', () => {
    const p = { ...basePattern(), stepUnit: 32 } as unknown;
    expect(PatternSchema.safeParse(p).success).toBe(false);
  });

  it('rejects bpm.default outside [min, max]', () => {
    const p = { ...basePattern(), bpm: { default: 400, min: 60, max: 200 } };
    expect(PatternSchema.safeParse(p).success).toBe(false);
  });

  it('rejects missing required field (e.g. swingable)', () => {
    const p = { ...basePattern() } as unknown as Record<string, unknown>;
    delete p.swingable;
    expect(PatternSchema.safeParse(p).success).toBe(false);
  });

  it('rejects non-integer steps', () => {
    const p = { ...basePattern(), steps: 2.5, grouping: [2.5] };
    expect(PatternSchema.safeParse(p).success).toBe(false);
  });

  it('parsePattern throws on invalid input', () => {
    expect(() => parsePattern({ nope: true })).toThrow();
  });

  it('parsePattern returns the parsed pattern on valid input', () => {
    const p = basePattern();
    const out = parsePattern(p);
    expect(out.id).toBe(p.id);
  });

  it('safeParsePattern returns { success: false } on invalid input', () => {
    const r = safeParsePattern({ nope: true });
    expect(r.success).toBe(false);
  });

  it('surfaces field path and message on error', () => {
    const r = PatternSchema.safeParse({ ...basePattern(), bpm: { default: '120', min: 60, max: 200 } });
    expect(r.success).toBe(false);
    if (!r.success) {
      const joined = r.error.issues.map((i) => `${i.path.join('.')}: ${i.message}`).join(' | ');
      expect(joined).toContain('bpm.default');
    }
  });
});

describe('UserPatternSchema', () => {
  it('accepts a valid UserPattern', () => {
    const u = {
      ...basePattern(),
      id: 'user-1',
      user: true as const,
      createdAt: 1_700_000_000_000,
      updatedAt: 1_700_000_000_000,
    };
    expect(UserPatternSchema.safeParse(u).success).toBe(true);
  });

  it('rejects when user !== true', () => {
    const u = {
      ...basePattern(),
      id: 'user-1',
      user: false,
      createdAt: 1,
      updatedAt: 1,
    } as unknown;
    expect(UserPatternSchema.safeParse(u).success).toBe(false);
  });

  it('rejects when createdAt missing', () => {
    const u = {
      ...basePattern(),
      id: 'user-1',
      user: true as const,
      updatedAt: 1,
    } as unknown;
    expect(UserPatternSchema.safeParse(u).success).toBe(false);
  });

  it('rejects when the underlying Pattern shape is invalid', () => {
    const u = {
      ...basePattern(),
      id: 'user-1',
      grouping: [9, 9],
      user: true as const,
      createdAt: 1,
      updatedAt: 1,
    };
    expect(UserPatternSchema.safeParse(u).success).toBe(false);
  });
});
