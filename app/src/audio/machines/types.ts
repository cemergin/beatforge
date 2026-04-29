// Voice machine type system — the polymorphic foundation for the
// drum / pitched / synth voices. Each one is a one-shot trigger
// (kick, snare, fm …). The metadata shape (knobs, defaults, presets,
// schema) is the single source of truth for the UI form, the engine
// dispatch, the automation editor, and the serializer.
//
// FX live in a separate module (machines/fx) under the
// ControllableModule shape — they're continuous audio in → audio
// out, addressable by the router, and don't need the voice machine's
// trigger/render contract. See machines/fx/index.ts.
//
// See docs/process/plans/sound-page.md for the design rationale.

import type { ZodType } from 'zod';

// ── Knob descriptors ─────────────────────────────────────────────

/** A continuous numeric knob. Drives the UI form, the automation lane
 *  targeting, and the schema range checks. */
export interface KnobSpec {
  /** Stable id used in configs, presets, and automation lanes. */
  id: string;
  /** User-facing label. */
  label: string;
  min: number;
  max: number;
  default: number;
  /** Slider mapping curve.
   *  - `lin`: linear position → value
   *  - `exp`: exponential (perceptually-even for pitch / decay) */
  curve: 'lin' | 'exp';
  /** Display unit (Hz, ms, %, …). Used by the format helpers. */
  unit: string;
  /** Optional custom formatter (e.g., 1500 → "1.5 kHz"). */
  format?: (v: number) => string;
}

/** A discrete (non-numeric) selector — e.g. filter mode (LP/HP/BP).
 *  Discrete knobs are NOT automatable per-step; their value lives in
 *  the config but doesn't change between triggers. */
export interface DiscreteSpec<T extends string = string> {
  id: string;
  label: string;
  options: readonly T[];
  default: T;
}

// ── Machine config base ──────────────────────────────────────────

/** Every machine config has an `archetype` (or `type`) discriminator
 *  + numeric/discrete fields. Each archetype refines this with its
 *  own keys. Stored verbatim in kits (per-channel `machine` field)
 *  and in user kits in IndexedDB. */
export interface MachineConfig {
  /** Discriminator: matches a key in the registry. */
  archetype: string;
  // …archetype-specific fields refined per machine
}

/** Per-step automation override map: knob id → value. Engine merges
 *  this with the static config at trigger time / per-step. */
export type ModValues = Record<string, number>;

// ── Machine specs ────────────────────────────────────────────────

/** Common metadata + validation contract for voice machines.
 *  The UI form, the engine dispatch, automation, and serialization
 *  all read from this. */
export interface MachineSpec<TConfig extends MachineConfig = MachineConfig> {
  /** Stable id used in registry lookups + config discriminator. */
  readonly id: string;
  readonly label: string;
  readonly category: 'voice';
  readonly knobs: readonly KnobSpec[];
  readonly discrete?: readonly DiscreteSpec[];
  /** Factory blank — what a fresh instance looks like. */
  readonly defaults: TConfig;
  /** Runtime validation. Used at kit-load time + share-link decode. */
  readonly schema: ZodType<TConfig>;
  /** Named knob-value bundles (e.g. '808', '909', '707' for `kick`). */
  readonly presets?: Record<string, Partial<TConfig>>;
}

// ── VoiceMachine: triggered, one-shot ────────────────────────────

/** Audio-graph context handed to a voice on every trigger. The engine
 *  owns these; the machine borrows them for the duration of one shot.
 *  Mirrors the existing `VoiceCtx` from audio/kits/types.ts. */
export interface VoiceCtx {
  ctx: AudioContext;
  /** Where the voice's tail node connects (channel strip input). */
  destination: AudioNode;
}

export interface VoiceMachine<TConfig extends MachineConfig = MachineConfig>
  extends MachineSpec<TConfig> {
  readonly category: 'voice';
  /** Schedule a one-shot trigger.
   *  - `cfg`: the machine's stored knob values
   *  - `vc`: audio-graph routing context
   *  - `when`: AudioContext-relative scheduling time
   *  - `amp`: 0..1 velocity-derived amplitude
   *  - `mod`: optional per-step automation overrides for any knob id */
  render(cfg: TConfig, vc: VoiceCtx, when: number, amp: number, mod?: ModValues): void;
}

// ── Helpers for downstream consumers ─────────────────────────────

/** Pick the value for a knob, preferring the per-step `mod` override.
 *  Used by voice renderers to respect automation. */
export function knobValue<C extends MachineConfig>(
  cfg: C,
  knobId: keyof C & string,
  mod: ModValues | undefined,
): number {
  if (mod && knobId in mod) return mod[knobId];
  const v = cfg[knobId];
  return typeof v === 'number' ? v : 0;
}
