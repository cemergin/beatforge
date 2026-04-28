// Kit-preset bridge — maps the legacy KitId × VoiceId space onto the
// modular VOICE_MACHINES + presets system. Lets Practice / Library /
// legacy Studio keep their `setKit('808')`-style API while the actual
// audio comes out of the unified machines/voice catalog.
//
// Each (kit, voice) entry picks an archetype + preset id. setKit(k)
// applies all five voice presets across the engine's channels in
// ALL_VOICES order. The engine's per-channel adapters then drive the
// machines through the same .set() path everything else uses.
//
// Keep this file in sync with audio/machines/voice/{kick,snare,hat,…}.ts
// presets — when we add a world preset there, expose it here too.

import { ALL_KITS, type KitId, type VoiceId } from '../../patterns/types';
import type { MachineConfig } from '../machines/types';
import { VOICE_MACHINES, type VoiceArchetypeId } from '../machines/registry';

interface VoicePreset {
  archetype: VoiceArchetypeId;
  preset: string;
}

/** Per-kit voice mapping. ALL_KITS guarantees every KitId has an
 *  entry; per-voice records cover all five VoiceIds. Drift caught at
 *  compile time via the satisfies clause. */
export const KIT_VOICE_PRESETS = {
  '808': {
    KK: { archetype: 'kick',  preset: '808' },
    SN: { archetype: 'snare', preset: '808' },
    HH: { archetype: 'hat',   preset: 'closed' },
    OH: { archetype: 'hat',   preset: 'open' },
    CP: { archetype: 'clap',  preset: '808' },
  },
  '909': {
    KK: { archetype: 'kick',  preset: '909' },
    SN: { archetype: 'snare', preset: '909' },
    HH: { archetype: 'hat',   preset: 'closed' },
    OH: { archetype: 'hat',   preset: 'open' },
    CP: { archetype: 'clap',  preset: 'finger' },
  },
  '707': {
    KK: { archetype: 'kick',  preset: '707' },
    SN: { archetype: 'snare', preset: '707' },
    HH: { archetype: 'hat',   preset: 'closed' },
    OH: { archetype: 'hat',   preset: 'open' },
    CP: { archetype: 'clap',  preset: '808' },
  },
  '727': {
    // 727 is the percussion box — claves, agogos, woodblocks. Map
    // KK / SN to cowbell-class voices (the legacy 727 used a cowbell
    // for its "kick" slot too); CP stays as a hand clap.
    KK: { archetype: 'cowbell', preset: '727' },
    SN: { archetype: 'cowbell', preset: 'clave' },
    HH: { archetype: 'cowbell', preset: 'agogo' },
    OH: { archetype: 'cowbell', preset: 'woodblock' },
    CP: { archetype: 'clap',    preset: '808' },
  },
  frameDrum: {
    KK: { archetype: 'kick',  preset: 'doum' },
    SN: { archetype: 'snare', preset: 'tek' },
    HH: { archetype: 'hat',   preset: 'riq' },
    OH: { archetype: 'modal', preset: 'frame' },
    CP: { archetype: 'clap',  preset: 'palmas' },
  },
  tabla: {
    KK: { archetype: 'kick',  preset: 'bayan' },
    SN: { archetype: 'snare', preset: 'dayan' },
    HH: { archetype: 'hat',   preset: 'closed' },
    OH: { archetype: 'modal', preset: 'tabla' },
    CP: { archetype: 'clap',  preset: 'finger' },
  },
  gamelan: {
    KK: { archetype: 'modal',   preset: 'gong' },
    SN: { archetype: 'modal',   preset: 'bell' },
    HH: { archetype: 'cowbell', preset: 'agogo' },
    OH: { archetype: 'modal',   preset: 'tank' },
    CP: { archetype: 'cowbell', preset: 'woodblock' },
  },
} as const satisfies Record<KitId, Record<VoiceId, VoicePreset>>;

/** Build a MachineConfig for one (kit, voice) cell — the archetype's
 *  defaults overlaid with the preset's tuning. Returns the kick
 *  defaults as a safe fallback when the kit / voice / preset isn't
 *  in the table (caller-side typo safety). */
export function buildKitMachine(kit: KitId, voice: VoiceId): MachineConfig {
  const cell = KIT_VOICE_PRESETS[kit]?.[voice];
  if (!cell) return { ...VOICE_MACHINES.kick.defaults };
  const machine = VOICE_MACHINES[cell.archetype];
  if (!machine) return { ...VOICE_MACHINES.kick.defaults };
  const presetValues = machine.presets?.[cell.preset];
  return { ...machine.defaults, ...(presetValues ?? {}) };
}

/** Default reverb-send level per kit. Kept for backwards compat with
 *  the legacy KitRecipe.reverbSend field — applied to every channel's
 *  reverbSend on setKit. World kits get more reverb (frame drums +
 *  gongs traditionally bloom into a room); 727 stays dry (percussion
 *  is sharper sounding without ambience). */
export const KIT_REVERB_SEND: Record<KitId, number> = {
  '808': 0.18,
  '909': 0.12,
  '707': 0.08,
  '727': 0.06,
  frameDrum: 0.30,
  tabla: 0.22,
  gamelan: 0.34,
};

/** Re-export ALL_KITS for downstream tests + UIs to iterate kits. */
export { ALL_KITS };
