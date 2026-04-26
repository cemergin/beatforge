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
 *  channels tuple (no id field — position IS the binding). */
export interface Channel {
  label: string;        // user-facing
  short: string;        // 3-char Practice/Studio visual
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
