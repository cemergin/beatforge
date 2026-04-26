// Convert a legacy voice-keyed Pattern into the positional SoundPattern
// shape Sound + the new engine speak. Used by Practice when loading a
// pattern from the 536-pattern corpus or from userPatterns.
//
// Lossy-ish: the legacy Pattern has no per-channel sound design (it
// relied on global kit dispatch). We assign sensible default machine
// configs by voice id (KK→kick, SN→snare, etc.) so playback sounds
// like a vanilla 808-style kit. Users who want their kit can load a
// saved SoundKit on top, swapping just the channels.

import type { Pattern, VoiceId } from './types';
import { trackMeta, voiceKeys } from './types';
import type { SoundPattern, Channel } from './types-sound';
import { defaultChannelEffects } from './types-sound';
import { VOICE_MACHINES, type VoiceArchetypeId } from '../audio/machines/registry';
import type { MachineConfig } from '../audio/machines/types';
import { stepToNaturalBpm, parseTimeSigDenom } from '../audio/tempo';

// VoiceId → (archetype, optional preset) used to populate each
// channel's machine config when converting a legacy Pattern.
const VOICE_TO_MACHINE: Record<VoiceId, { archetype: VoiceArchetypeId; preset?: string }> = {
  KK: { archetype: 'kick' },
  SN: { archetype: 'snare' },
  HH: { archetype: 'hat' },
  OH: { archetype: 'hat' },   // open hat — same machine, same defaults; users can dial decay
  CP: { archetype: 'clap' },
};

const VOICE_LABEL: Record<VoiceId, string> = {
  KK: 'Kick',
  SN: 'Snare',
  HH: 'Hat',
  OH: 'Open Hat',
  CP: 'Clap',
};

function machineForVoice(v: VoiceId): MachineConfig {
  const map = VOICE_TO_MACHINE[v];
  const m = VOICE_MACHINES[map.archetype];
  const preset = map.preset && m.presets ? m.presets[map.preset] : undefined;
  return { ...m.defaults, ...preset };
}

/** Convert a legacy Pattern (voice-keyed tracks + global kit) into a
 *  SoundPattern (positional channels + per-channel machine configs).
 *  Per-track subdivisions become per-row sequence lengths — polyrhythm
 *  preserved. The `id` keeps the legacy id so callers can round-trip
 *  back via id lookup if needed. */
export function patternToSoundPattern(p: Pattern): SoundPattern {
  const trackIds = voiceKeys(p.tracks);
  const channels: Channel[] = trackIds.map((tr) => ({
    label: VOICE_LABEL[tr],
    machine: machineForVoice(tr),
    effects: defaultChannelEffects(),
  }));

  // Each track's pattern array becomes a sequence row. trackMeta
  // resolves Velocity[] | Track to the canonical pattern array; row
  // length = subdivisions (== p.steps for non-poly tracks).
  const sequence: number[][] = trackIds.map((tr) => {
    const td = p.tracks[tr]!;
    const meta = trackMeta(td, p.steps);
    return meta.pattern.slice() as number[];
  });

  // Convert step BPM (engine-internal) to quarter BPM (user-facing).
  const denom = parseTimeSigDenom(p.timeSig);
  const quarterBpm = stepToNaturalBpm(p.bpm.default, p.stepUnit, denom);

  return {
    id: p.id,
    name: p.name,
    bpm: quarterBpm,
    grouping: [...p.grouping],
    stepUnit: p.stepUnit,
    sequence,
    channels,
    countInBars: 0,
    swing: typeof p.swingDefault === 'number' ? p.swingDefault : 0.5,
    strongAmp: 1.0,
    weakAmp: 0.55,
    reverbWet: 0.5,
    delayWet: 0.15,
    createdAt: 0,
    updatedAt: 0,
  };
}
