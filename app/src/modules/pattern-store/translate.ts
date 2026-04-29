// Translators between the unified StudioPattern shape and the two
// IDB records we still write today (SoundPattern + UserPattern).
// Centralizing these means the bundling logic has one home; Sound.tsx
// no longer needs to know there are two tables.

import type { Pattern, VoiceId, Velocity } from '../../patterns/types';
import type { SoundPattern, Channel } from '../../patterns/types-sound';
import type { SoundSequence, SoundStep } from '../../audio/runtime/sound-engine';
import type { UserPattern } from '../../lib/db';
import type { StudioPattern } from './types';

const ALL_VOICES: VoiceId[] = ['KK', 'SN', 'HH', 'OH', 'CP'];

/** Translate Studio's positional 5-channel sequence into the voice-keyed
 *  Pattern.tracks shape Practice + Library expect. Trailing voices
 *  beyond the sequence length are omitted. */
export function tracksFromSequence(seq: SoundSequence): Pattern['tracks'] {
  const out: Pattern['tracks'] = {};
  for (let i = 0; i < Math.min(seq.length, ALL_VOICES.length); i++) {
    const voiceId = ALL_VOICES[i];
    out[voiceId] = seq[i].slice() as Velocity[];
  }
  return out;
}

/** Reverse of tracksFromSequence — voice-keyed tracks → 5-row positional
 *  sequence. Voices missing from tracks become empty rows. */
export function sequenceFromTracks(tracks: Pattern['tracks'], steps: number): SoundSequence {
  return ALL_VOICES.map((voice) => {
    const row = tracks[voice];
    if (Array.isArray(row)) {
      return row.slice(0, steps).map((v) => (v === 2 ? 2 : v === 1 ? 1 : 0) as SoundStep);
    }
    return Array<SoundStep>(steps).fill(0);
  });
}

function deepCloneChannels(channels: readonly Channel[]): Channel[] {
  return channels.map((c) => ({
    label: c.label,
    machine: { ...c.machine },
    effects: { ...c.effects, colorFx: { ...c.effects.colorFx } },
  }));
}

/** Build the SoundPattern record (sound design — channels + sequence
 *  + FX state) from a StudioPattern. */
export function buildSoundPattern(p: StudioPattern): SoundPattern {
  return {
    id: p.id,
    name: p.name,
    bpm: p.bpm,
    grouping: [...p.grouping],
    stepUnit: p.stepUnit,
    sequence: p.sequence.map((row) => [...row]),
    channels: deepCloneChannels(p.channels),
    countInBars: p.countInBars,
    swing: p.swing,
    strongAmp: p.strongAmp,
    weakAmp: p.weakAmp,
    reverbWet: p.reverbWet,
    reverbSize: p.reverbSize,
    reverbDecay: p.reverbDecay,
    delayWet: p.delayWet,
    delayTime: p.delayTime,
    delayFeedback: p.delayFeedback,
    createdAt: p.createdAt,
    updatedAt: p.updatedAt,
  };
}

/** Build the UserPattern record (Library-visible voice-keyed pattern
 *  + metadata) from a StudioPattern. SoundPattern.bpm is quarter-BPM;
 *  UserPattern.bpm.default is step-BPM (legacy seed convention). */
export function buildUserPatternView(p: StudioPattern): UserPattern {
  const stepsPerBar = p.grouping.reduce((a, b) => a + b, 0);
  const stepBpm = Math.round((p.bpm * p.stepUnit) / 4);
  return {
    id: p.id,
    name: p.name,
    origin: 'You',
    tradition: 'user',
    genre: p.genre,
    timeSig: `${stepsPerBar}/${p.stepUnit}`,
    grouping: [...p.grouping],
    steps: stepsPerBar,
    stepUnit: p.stepUnit,
    bpm: {
      default: stepBpm,
      min: Math.max(30, Math.round(stepBpm * 0.5)),
      max: Math.round(stepBpm * 2),
    },
    tracks: tracksFromSequence(p.sequence),
    defaultKit: p.defaultKit,
    region: p.region,
    difficulty: 'beginner',
    tags: [...p.tags],
    swingable: p.swingable,
    story: p.story || undefined,
    user: true,
    createdAt: p.createdAt,
    updatedAt: p.updatedAt,
  };
}
