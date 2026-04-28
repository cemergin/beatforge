// Coverage for the channel-out routing storage helper. Sibling to
// midiMappings.test.ts — same shape, same risks.

import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import type { ChannelOutConfig } from '../modules/midi';
import { loadChannelOuts, saveChannelOuts } from './midiChannelOut';

const KEY = 'bf_midi_channel_out_v1';

const cfg = (overrides: Partial<ChannelOutConfig> = {}): ChannelOutConfig => ({
  enabled: false,
  outputId: '',
  midiChannel: 0,
  note: 36,
  velocityScale: 1,
  ...overrides,
});

describe('midiChannelOut storage', () => {
  beforeEach(() => { localStorage.clear(); });
  afterEach(() => { localStorage.clear(); });

  it('returns count default rows on first run', () => {
    expect(loadChannelOuts(5)).toHaveLength(5);
    for (const row of loadChannelOuts(5)) {
      expect(row.enabled).toBe(false);
      expect(row.outputId).toBe('');
    }
  });

  it('saves and reloads valid rows', () => {
    const rows = [
      cfg({ enabled: true, outputId: 'mock', midiChannel: 9, note: 36, velocityScale: 1 }),
      cfg({ enabled: false, outputId: '', midiChannel: 0, note: 38, velocityScale: 0.7 }),
    ];
    saveChannelOuts(rows);
    expect(loadChannelOuts(2)).toEqual(rows);
  });

  it('grows the result to count when storage has fewer rows', () => {
    saveChannelOuts([cfg({ outputId: 'a', enabled: true })]);
    const out = loadChannelOuts(5);
    expect(out).toHaveLength(5);
    expect(out[0].outputId).toBe('a');
    for (let i = 1; i < 5; i++) expect(out[i].outputId).toBe('');
  });

  it('truncates the result when storage has more rows than requested', () => {
    const rows = [cfg({ outputId: 'a' }), cfg({ outputId: 'b' }), cfg({ outputId: 'c' })];
    saveChannelOuts(rows);
    const out = loadChannelOuts(2);
    expect(out).toHaveLength(2);
    expect(out.map((r) => r.outputId)).toEqual(['a', 'b']);
  });

  it('drops malformed rows in favor of defaults', () => {
    localStorage.setItem(KEY, JSON.stringify([
      cfg({ outputId: 'ok' }),
      { kind: 'wrong-shape' },
      'not-an-object',
      cfg({ outputId: 'also-ok' }),
    ]));
    const out = loadChannelOuts(4);
    expect(out[0].outputId).toBe('ok');
    expect(out[1].outputId).toBe('');     // default fill
    expect(out[2].outputId).toBe('');     // default fill
    expect(out[3].outputId).toBe('also-ok');
  });

  it('returns defaults when JSON is corrupt', () => {
    localStorage.setItem(KEY, '{not json');
    const out = loadChannelOuts(3);
    expect(out).toHaveLength(3);
    for (const row of out) expect(row.outputId).toBe('');
  });
});
