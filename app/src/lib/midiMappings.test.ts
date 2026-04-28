// Coverage for the MIDI tab's localStorage round-trip. Doesn't talk
// to Web MIDI — just the persistence layer.

import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import type { MidiInputMap } from '../modules/midi';
import { loadMidiMappings, saveMidiMappings } from './midiMappings';

describe('midiMappings storage', () => {
  beforeEach(() => { localStorage.clear(); });
  afterEach(() => { localStorage.clear(); });

  it('returns empty list on first run', () => {
    expect(loadMidiMappings()).toEqual([]);
  });

  it('saves and reloads valid mappings', () => {
    const maps: MidiInputMap[] = [
      { kind: 'note', channel: 0, note: 36, toAddress: 'channel.0' },
      { kind: 'cc', cc: 74, toAddress: 'channel.0.color.cutoff', scale: 'linear' },
    ];
    saveMidiMappings(maps);
    expect(loadMidiMappings()).toEqual(maps);
  });

  it('drops malformed entries instead of throwing', () => {
    localStorage.setItem('bf_midi_mappings_v1', JSON.stringify([
      { kind: 'note', toAddress: 'ok' },
      { kind: 'cc', cc: 'not-a-number', toAddress: 'bad' },
      'string-not-object',
      { kind: 'unknown', toAddress: 'x' },
    ]));
    const out = loadMidiMappings();
    expect(out).toEqual([{ kind: 'note', toAddress: 'ok' }]);
  });

  it('returns empty list when JSON is corrupt', () => {
    localStorage.setItem('bf_midi_mappings_v1', '{not json');
    expect(loadMidiMappings()).toEqual([]);
  });
});
