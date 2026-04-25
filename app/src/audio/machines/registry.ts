// Machine registry — single dispatch point for every voice/FX in the
// new system. Engine reads from these maps; UI iterates over them.
// Drift between the registry's keys and the union of config types is
// caught at compile time via `as const satisfies`.
//
// Phase 1 starts empty and fills in archetype-by-archetype. Phase 2
// migrates the existing kits to use these.

import type { FxMachine, MachineConfig, ModValues, VoiceCtx, VoiceMachine } from './types';
import { Kick } from './voice/kick';
import { Snare } from './voice/snare';
import { Hat } from './voice/hat';
import { Clap } from './voice/clap';
import { Tom } from './voice/tom';
import { Cowbell } from './voice/cowbell';
import { Modal } from './voice/modal';
import { Fm } from './voice/fm';
import { CombPluck } from './voice/comb-pluck';
import { Noise } from './voice/noise';

// ── Voice machines ───────────────────────────────────────────────
// Add archetypes here as they're implemented. The exhaustiveness
// check via `satisfies` ensures every key has a matching machine.

export const VOICE_MACHINES = {
  kick: Kick,
  snare: Snare,
  hat: Hat,
  clap: Clap,
  tom: Tom,
  cowbell: Cowbell,
  modal: Modal,
  fm: Fm,
  'comb-pluck': CombPluck,
  noise: Noise,
} as const satisfies Record<string, VoiceMachine>;

export type VoiceArchetypeId = keyof typeof VOICE_MACHINES;

// ── Channel FX (per-channel color slot) ──────────────────────────
// `none` is a sentinel passthrough, always present. Other types are
// added as their machines land.

export const CHANNEL_FX = {
  // 'none' is plumbed by ChannelStrip directly (no FxInstance needed)
  // Real FX populated by phase-1 commits
} as const satisfies Record<string, FxMachine>;

export type ColorFxId = keyof typeof CHANNEL_FX | 'none';

// ── Kit FX (shared bus processors) ───────────────────────────────

export const KIT_FX = {
  // populated by phase-1 commits
} as const satisfies Record<string, FxMachine>;

export type KitFxId = keyof typeof KIT_FX;

/** Look up a voice machine by archetype id. The intersection of all
 *  per-machine config types is `never` (their discriminators conflict),
 *  so a cast is required to dispatch. The cast is safe because the
 *  config's `archetype` field IS the discriminator we used to look up
 *  the machine — runtime contract guarantees alignment. */
export function triggerVoice(
  cfg: MachineConfig,
  vc: VoiceCtx,
  when: number,
  amp: number,
  mod?: ModValues,
): void {
  const machine = VOICE_MACHINES[cfg.archetype as VoiceArchetypeId];
  if (!machine) return;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any -- runtime-checked discriminator dispatch
  (machine as VoiceMachine<any>).render(cfg, vc, when, amp, mod);
}
