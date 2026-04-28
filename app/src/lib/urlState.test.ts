// Tests for the URL → (tab, pattern) parser.

import { describe, it, expect } from 'vitest';
import { readUrlState } from './urlState';

const KNOWN_SEEDS = new Set(['karsilama', 'soukous', 'maqsum']);
const opts = {
  seedExists: (id: string) => KNOWN_SEEDS.has(id),
  devMode: false,
};
const devOpts = { ...opts, devMode: true };

describe('readUrlState', () => {
  it('returns nulls for empty search', () => {
    expect(readUrlState('', opts)).toEqual({ tab: null, pattern: null });
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

  it('_patterns is dev-mode only', () => {
    expect(readUrlState('?tab=_patterns', opts).tab).toBeNull();
    expect(readUrlState('?tab=_patterns', devOpts).tab).toBe('_patterns');
  });

  it('returns valid pattern id when seed exists', () => {
    expect(readUrlState('?pattern=karsilama', opts).pattern).toBe('karsilama');
  });

  it('drops unknown pattern ids', () => {
    expect(readUrlState('?pattern=does-not-exist', opts).pattern).toBeNull();
  });

  it('parses tab + pattern together', () => {
    expect(readUrlState('?tab=practice&pattern=soukous', opts))
      .toEqual({ tab: 'practice', pattern: 'soukous' });
  });

  it('ignores extra params it doesn\'t understand', () => {
    expect(readUrlState('?tab=studio&p=longhash&pattern=maqsum&utm=foo', opts))
      .toEqual({ tab: 'studio', pattern: 'maqsum' });
  });

  it('handles malformed search strings', () => {
    expect(readUrlState('?', opts)).toEqual({ tab: null, pattern: null });
    expect(readUrlState('?tab', opts).tab).toBeNull();
  });
});
