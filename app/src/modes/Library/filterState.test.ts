// Tests for the Library filter combinator.

import { describe, it, expect } from 'vitest';
import type { Pattern } from '../../patterns/types';
import { applyFilters, DEFAULT_FILTERS } from './filterState';

function p(overrides: Partial<Pattern>): Pattern {
  return {
    id: 'x',
    name: 'x',
    origin: '—',
    tradition: '—',
    genre: 'popular',
    timeSig: '4/4',
    grouping: [4, 4, 4, 4],
    steps: 16,
    stepUnit: 16,
    bpm: { default: 400, min: 200, max: 600 },
    tracks: { KK: new Array(16).fill(0) as never },
    defaultKit: '808',
    region: 'electronic-western',
    difficulty: 'beginner',
    tags: [],
    swingable: false,
    ...overrides,
  };
}

describe('applyFilters', () => {
  const all: Pattern[] = [
    p({ id: 'a', timeSig: '4/4', region: 'turkey-ottoman', genre: 'folk-dance', defaultKit: '808' }),
    p({ id: 'b', timeSig: '9/8', region: 'turkey-ottoman', genre: 'folk-dance', defaultKit: '909' }),
    p({ id: 'c', timeSig: '4/4', region: 'india',         genre: 'classical',  defaultKit: 'tabla' }),
    p({ id: 'd', timeSig: '6/8', region: 'west-africa',   genre: 'folk-dance', defaultKit: 'frameDrum' }),
  ];

  it('returns everything when filters are empty', () => {
    expect(applyFilters(all, DEFAULT_FILTERS)).toEqual(all);
  });

  it('filters by meter (OR within row)', () => {
    const out = applyFilters(all, { ...DEFAULT_FILTERS, meters: ['4/4'] });
    expect(out.map((x) => x.id)).toEqual(['a', 'c']);
  });

  it('multiple meters in a row → OR', () => {
    const out = applyFilters(all, { ...DEFAULT_FILTERS, meters: ['4/4', '6/8'] });
    expect(out.map((x) => x.id).sort()).toEqual(['a', 'c', 'd']);
  });

  it('filters by region', () => {
    const out = applyFilters(all, { ...DEFAULT_FILTERS, regions: ['india'] });
    expect(out.map((x) => x.id)).toEqual(['c']);
  });

  it('filters by genre', () => {
    const out = applyFilters(all, { ...DEFAULT_FILTERS, genres: ['classical'] });
    expect(out.map((x) => x.id)).toEqual(['c']);
  });

  it('filters by kit', () => {
    const out = applyFilters(all, { ...DEFAULT_FILTERS, kits: ['frameDrum'] });
    expect(out.map((x) => x.id)).toEqual(['d']);
  });

  it('AND across rows', () => {
    // 4/4 AND turkey-ottoman → only "a" (b is 9/8)
    const out = applyFilters(all, {
      ...DEFAULT_FILTERS,
      meters: ['4/4'],
      regions: ['turkey-ottoman'],
    });
    expect(out.map((x) => x.id)).toEqual(['a']);
  });

  it('returns empty when AND of rows excludes everything', () => {
    const out = applyFilters(all, {
      ...DEFAULT_FILTERS,
      regions: ['india'],
      genres: ['folk-dance'],
    });
    expect(out).toEqual([]);
  });

  it('AND-OR-AND: (meter OR meter) AND region AND kit', () => {
    const out = applyFilters(all, {
      meters: ['4/4', '9/8'],
      regions: ['turkey-ottoman'],
      genres: [],
      kits: ['909'],
      source: 'all',
    });
    expect(out.map((x) => x.id)).toEqual(['b']);
  });

  it('source=local keeps only user-flagged patterns', () => {
    const seed = p({ id: 's' });
    const userP = { ...p({ id: 'u' }), user: true } as Pattern;
    const out = applyFilters([seed, userP], { ...DEFAULT_FILTERS, source: 'local' });
    expect(out.map((x) => x.id)).toEqual(['u']);
  });

  it('source=seed drops user-flagged patterns', () => {
    const seed = p({ id: 's' });
    const userP = { ...p({ id: 'u' }), user: true } as Pattern;
    const out = applyFilters([seed, userP], { ...DEFAULT_FILTERS, source: 'seed' });
    expect(out.map((x) => x.id)).toEqual(['s']);
  });
});
