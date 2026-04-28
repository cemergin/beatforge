// Tests for the URL → (tab, pattern) parser.

import { describe, it, expect } from 'vitest';
import { readUrlState } from './urlState';

const KNOWN_SEEDS = new Set(['karsilama', 'soukous', 'maqsum']);
const opts = {
  seedExists: (id: string) => KNOWN_SEEDS.has(id),
};

describe('readUrlState', () => {
  it('returns nulls for empty search', () => {
    expect(readUrlState('', opts)).toEqual({ tab: null, pattern: null, detail: null });
  });

  it('parses ?detail=<id> for the Library modal', () => {
    expect(readUrlState('?tab=library&detail=karsilama', opts).detail).toBe('karsilama');
    // Detail strings aren't validated by the parser — Library does the
    // membership check against its own loaded corpus.
    expect(readUrlState('?detail=user-abc-123', opts).detail).toBe('user-abc-123');
  });

  it('returns null detail when missing', () => {
    expect(readUrlState('?tab=library', opts).detail).toBeNull();
  });

  it('parses each known tab', () => {
    expect(readUrlState('?tab=practice', opts).tab).toBe('practice');
    expect(readUrlState('?tab=library', opts).tab).toBe('library');
    expect(readUrlState('?tab=studio', opts).tab).toBe('studio');
  });

  it('redirects ?tab=sound (renamed) to studio', () => {
    expect(readUrlState('?tab=sound', opts).tab).toBe('studio');
  });

  it('rejects unknown tab values', () => {
    expect(readUrlState('?tab=garbage', opts).tab).toBeNull();
    expect(readUrlState('?tab=', opts).tab).toBeNull();
  });

  it('_midi accessible regardless of build (button hidden, URL works)', () => {
    expect(readUrlState('?tab=_midi', opts).tab).toBe('_midi');
  });

  it('returns valid pattern id when seed exists', () => {
    expect(readUrlState('?pattern=karsilama', opts).pattern).toBe('karsilama');
  });

  it('drops unknown pattern ids', () => {
    expect(readUrlState('?pattern=does-not-exist', opts).pattern).toBeNull();
  });

  it('parses tab + pattern together', () => {
    expect(readUrlState('?tab=practice&pattern=soukous', opts))
      .toEqual({ tab: 'practice', pattern: 'soukous', detail: null });
  });

  it('ignores extra params it doesn\'t understand', () => {
    expect(readUrlState('?tab=studio&p=longhash&pattern=maqsum&utm=foo', opts))
      .toEqual({ tab: 'studio', pattern: 'maqsum', detail: null });
  });

  it('handles malformed search strings', () => {
    expect(readUrlState('?', opts)).toEqual({ tab: null, pattern: null, detail: null });
    expect(readUrlState('?tab', opts).tab).toBeNull();
  });
});
