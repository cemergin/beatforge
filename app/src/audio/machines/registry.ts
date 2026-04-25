// Machine registry — single dispatch point for every voice/FX in the
// new system. Engine reads from these maps; UI iterates over them.
// Drift between the registry's keys and the union of config types is
// caught at compile time via `as const satisfies`.
//
// Phase 1 starts empty and fills in archetype-by-archetype. Phase 2
// migrates the existing kits to use these.

import type { FxMachine, VoiceMachine } from './types';

// ── Voice machines ───────────────────────────────────────────────
// Add archetypes here as they're implemented. The exhaustiveness
// check via `satisfies` ensures every key has a matching machine.

export const VOICE_MACHINES = {
  // populated by phase-1 commits, archetype-by-archetype
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
