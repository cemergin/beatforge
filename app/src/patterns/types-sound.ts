// Type definitions specific to the Sound page / kit recipe model.
// Lives next to the existing patterns/types.ts so the new system has
// its own domain types while sharing the broader pattern types.

import type { MachineConfig } from '../audio/machines/types';

/** Channel mixer + color FX parameters. Per-channel, on top of the
 *  voice machine's own knob values. */
export interface ChannelEffects {
  level: number;        // 0-1, channel volume
  pan: number;          // -1 (L) .. +1 (R)
  colorFx: ColorFx;     // user-chosen color slot
  reverbSend: number;   // 0-1, tap into kit reverb
  delaySend: number;    // 0-1, tap into kit delay
}

/** One color-FX slot per channel. Discriminated union over the v1
 *  effect types — `type` selects which knobs apply. Switching types
 *  resets to that type's defaults. */
export type ColorFx =
  | { type: 'none' }
  | { type: 'overdrive'; drive: number; tone: number; mix: number }
  | { type: 'bitcrush';  bits: number; rate: number; mix: number }
  | { type: 'filter';    mode: 'lp' | 'hp' | 'bp'; cutoff: number; q: number; mix: number };

/** A single kit channel. Ordered by position in the parent kit's
 *  channels tuple (no id field — position IS the binding). The 3-char
 *  display abbreviation is derived from `label` on the fly — no
 *  separate field, no sync. */
export interface Channel {
  label: string;        // user-facing display name
  machine: MachineConfig;
  effects: ChannelEffects;
}

/** Defaults for a brand-new channel. */
export function defaultChannelEffects(): ChannelEffects {
  return {
    level: 0.85,
    pan: 0,
    colorFx: { type: 'none' },
    reverbSend: 0,
    delaySend: 0,
  };
}

/** A saved Sound-page pattern. Captures BOTH the rhythm (sequence) and
 *  the sound design (channels' machine configs + effects) — that
 *  unification is the whole point of the Sound→Studio rewrite. The
 *  legacy Pattern type in patterns/types.ts uses voice-keyed tracks +
 *  global kit; this type uses positional channels + per-channel machine.
 *
 *  All "feel" fields are OPTIONAL so patterns saved before they were
 *  added still load (defaults applied at load time). When in doubt,
 *  add new fields as optional and migrate forward. */
export interface SoundPattern {
  id: string;
  name: string;

  bpm: number;                   // quarter-note BPM
  grouping: number[];            // additive (e.g. [2,2,3] for 7/8)
  stepUnit: 4 | 8 | 16;          // denominator of the step note value

  /** [channelIdx][stepIdx] — outer length must equal channels.length;
   *  inner length must equal sum(grouping). */
  sequence: number[][];

  /** Channels the user has configured. Order is positional — channels[i]
   *  binds to sequence[i]. */
  channels: Channel[];

  // ── Feel (optional, defaults applied on load) ────────────────────
  /** Bars of count-in clicks before playback. 0 = no count-in. */
  countInBars?: number;
  /** Swing depth: 0.5 = straight, 0.67 ≈ heavy. Only audible when
   *  stepUnit ∈ {8, 16}. */
  swing?: number;
  /** Velocity amps for accent (2) and on (1) cells. */
  strongAmp?: number;
  weakAmp?: number;

  // ── Master FX (optional) ─────────────────────────────────────────
  reverbWet?: number;
  reverbSize?: number;     // seconds
  reverbDecay?: number;    // shape exponent
  delayWet?: number;
  delayTime?: number;      // seconds
  delayFeedback?: number;  // 0..0.7

  createdAt: number;
  updatedAt: number;
}
