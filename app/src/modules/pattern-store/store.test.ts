// Pattern-store unit tests. Cover the pure helpers (defaults +
// translators); the IDB-backed save/load is exercised end-to-end by
// the Sound mode integration since the underlying lib/db helpers are
// tested separately.

import { describe, it, expect } from 'vitest';
import { defaultMetadata, nextPatternName } from './defaults';
import { buildSoundPattern, buildUserPatternView, sequenceFromTracks, mergeSoundAndMeta } from './store';
import type { StudioPattern } from './types';
import type { Channel } from '../../patterns/types-sound';

const STOCK_CHANNEL: Channel = {
  label: 'Kick',
  machine: { archetype: 'kick' },
  effects: {
    level: 0.85, pan: 0, reverbSend: 0.15, delaySend: 0,
    colorFx: { type: 'none' },
  },
};

function stockStudio(overrides: Partial<StudioPattern> = {}): StudioPattern {
  return {
    id: 'p-1',
    name: 'Pattern #1',
    bpm: 120,
    stepUnit: 16,
    grouping: [4, 4, 4, 4],
    sequence: [
      [2, 0, 0, 0, 2, 0, 0, 0, 2, 0, 0, 0, 2, 0, 0, 0],
      [0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0],
      [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
      [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
      [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    ],
    channels: [STOCK_CHANNEL, STOCK_CHANNEL, STOCK_CHANNEL, STOCK_CHANNEL, STOCK_CHANNEL],
    countInBars: 0,
    swing: 0.5,
    strongAmp: 1.0,
    weakAmp: 0.55,
    reverbWet: 0.5,
    reverbSize: 1.8,
    reverbDecay: 2.2,
    delayWet: 0.15,
    delayTime: 0.25,
    delayFeedback: 0.35,
    region: 'electronic-western',
    genre: 'popular',
    tags: ['user-saved'],
    story: '',
    defaultKit: '808',
    swingable: false,
    createdAt: 1000,
    updatedAt: 2000,
    ...overrides,
  };
}

describe('nextPatternName', () => {
  it('returns Pattern #1 for an empty list', () => {
    expect(nextPatternName([])).toBe('Pattern #1');
  });

  it('increments past the highest existing ordinal', () => {
    expect(nextPatternName(['Pattern #1', 'Pattern #5', 'Pattern #3'])).toBe('Pattern #6');
  });

  it('falls back to length+1 when no ordinals match', () => {
    expect(nextPatternName(['My Beat', 'Another One'])).toBe('Pattern #3');
  });

  it('ignores non-matching names while still respecting list length', () => {
    expect(nextPatternName(['Pattern #2', 'Custom Name'])).toBe('Pattern #3');
  });
});

describe('defaultMetadata', () => {
  it('returns Library-ready sample defaults', () => {
    const d = defaultMetadata();
    expect(d.region).toBe('electronic-western');
    expect(d.genre).toBe('popular');
    expect(d.tags).toEqual(['user-saved']);
    expect(d.story).toBe('');
    expect(d.defaultKit).toBe('808');
    expect(d.swingable).toBe(false);
  });
});

describe('buildSoundPattern', () => {
  it('extracts the sound-design slice with deep-cloned channels + sequence', () => {
    const studio = stockStudio();
    const sound = buildSoundPattern(studio);
    expect(sound.id).toBe(studio.id);
    expect(sound.bpm).toBe(120);
    expect(sound.channels[0]).not.toBe(studio.channels[0]); // deep clone
    expect(sound.channels[0].machine).not.toBe(studio.channels[0].machine);
    expect(sound.sequence[0]).not.toBe(studio.sequence[0]); // row clone
  });
});

describe('buildUserPatternView', () => {
  it('converts to voice-keyed tracks and step-BPM convention', () => {
    const studio = stockStudio({ bpm: 120, stepUnit: 16 });
    const user = buildUserPatternView(studio);
    expect(user.id).toBe('p-1');
    expect(user.user).toBe(true);
    expect(user.timeSig).toBe('16/16');
    expect(user.steps).toBe(16);
    expect(user.tracks.KK).toEqual(studio.sequence[0]);
    expect(user.tracks.SN).toEqual(studio.sequence[1]);
    // SoundPattern.bpm 120 quarter-BPM → 480 step-BPM at stepUnit 16.
    expect(user.bpm.default).toBe(480);
  });

  it('drops empty story to undefined', () => {
    const user = buildUserPatternView(stockStudio({ story: '' }));
    expect(user.story).toBeUndefined();
  });

  it('keeps non-empty story as-is', () => {
    const user = buildUserPatternView(stockStudio({ story: 'A driving 4/4 groove.' }));
    expect(user.story).toBe('A driving 4/4 groove.');
  });
});

describe('sequenceFromTracks', () => {
  it('round-trips voice-keyed → positional', () => {
    const studio = stockStudio();
    const user = buildUserPatternView(studio);
    const seq = sequenceFromTracks(user.tracks, user.steps);
    expect(seq[0]).toEqual(studio.sequence[0]);
    expect(seq[1]).toEqual(studio.sequence[1]);
    expect(seq[2]).toEqual(studio.sequence[2]);
  });

  it('pads missing voices with zero rows', () => {
    const seq = sequenceFromTracks({ KK: [1, 0, 1, 0] }, 4);
    expect(seq).toHaveLength(5);
    expect(seq[0]).toEqual([1, 0, 1, 0]);
    for (let i = 1; i < 5; i++) expect(seq[i]).toEqual([0, 0, 0, 0]);
  });
});

describe('mergeSoundAndMeta', () => {
  it('combines a SoundPattern + metadata into StudioPattern', () => {
    const studio = stockStudio();
    const sound = buildSoundPattern(studio);
    const meta = defaultMetadata();
    const merged = mergeSoundAndMeta(sound, meta);
    expect(merged.id).toBe(sound.id);
    expect(merged.region).toBe(meta.region);
    expect(merged.bpm).toBe(sound.bpm);
    expect(merged.channels[0]).not.toBe(sound.channels[0]); // deep clone
  });
});
