// Session — the canonical cross-mode state.
//
// One Pattern + one Kit + one BPM + one Swing + per-channel sound
// design live here. Practice, Studio, Library, and Sound all read
// and write through the same hook — so a tweak in one mode is
// visible the moment you switch to another. Reset points are
// explicit: loadPattern (full swap) and setKit (timbre swap).
// Everything else (cell edits, BPM ramps, knob tweaks) is sticky
// tweaking on the live state.
//
// Pattern is mutable in place via setPattern(updater). channels[]
// is similarly mutable via setChannels / setChannel. Practice's
// cell-toggle, Studio's grouping permute, the trainer's BPM ramp,
// Sound's knob drag — all flow through session writes so the next
// tab sees the same state.
//
// Tab switches DO NOT stop playback. The session.playing flag
// reflects the engine's transport state, and the engine keeps
// running across the route boundary.

import type { KitId, Pattern } from '../../patterns/types';
import type { Channel } from '../../patterns/types-sound';

export interface Session {
  // ── Read-only state ──────────────────────────────────────────
  /** Current pattern (with any sticky edits applied). Never null —
   *  the session is always seeded with a default on mount. */
  readonly pattern: Pattern;
  /** The "origin" pattern — what the user last loaded via
   *  loadPattern (Library handoff, Practice click, share-link
   *  decode). Stays stable across sticky edits so consumers can
   *  detect drift via `dirty`. */
  readonly origin: Pattern;
  /** True when `pattern` has diverged from `origin` — the user has
   *  tweaked cells, grouping, or something else under the hood.
   *  Practice / Studio surface this with a "*" or "New Pattern"
   *  marker so the user knows they're editing, not playing the
   *  pristine seed. */
  readonly dirty: boolean;
  /** Active kit id. Drives voice machine presets across channels. */
  readonly kit: KitId;
  /** Per-channel sound design — machine + effects + color FX. Length
   *  matches the engine's strip count (5 by default). Mutated by
   *  Sound page knob drags AND by setKit (which re-applies presets).
   *  Practice + Studio see the same channels Sound is editing. */
  readonly channels: readonly Channel[];
  /** Natural BPM (the user-facing tempo, denominator-of-time-sig
   *  per minute — e.g. 120 in 9/8 means 120 eighth notes/min). */
  readonly bpm: number;
  /** Swing slider value 0..100 (50 = straight, 100 = heavy triplet). */
  readonly swing: number;
  /** Transport state. */
  readonly playing: boolean;

  // ── Reset points ─────────────────────────────────────────────
  /** Load a fresh pattern. Replaces sticky state — bpm jumps to the
   *  pattern's default, kit jumps to the pattern's default, channels
   *  reset to kit-derived defaults. The user's deliberate "I'm
   *  starting over" action. */
  loadPattern(p: Pattern): void;
  /** Swap kit. Re-applies preset machines across every channel;
   *  pattern + bpm + swing stay where they are. */
  setKit(k: KitId): void;

  // ── Sticky tweaks ────────────────────────────────────────────
  /** Patch the current pattern in place. Used by cell-toggle,
   *  grouping permute, trainer-time tweaks, ANY edit that should
   *  ride along with the user across tab switches. */
  setPattern(updater: (prev: Pattern) => Pattern): void;
  setBpm(b: number): void;
  setSwing(s: number): void;
  /** Replace the entire channels array — used by Sound on bulk
   *  load (e.g., loading a saved sound kit from IDB). */
  setChannels(channels: Channel[]): void;
  /** Patch one channel by index. The updater receives the current
   *  channel and returns a (typically shallow) copy. Used by every
   *  per-channel knob in Sound. */
  setChannel(idx: number, updater: (prev: Channel) => Channel): void;

  // ── Transport ────────────────────────────────────────────────
  /** Start playback. Tab switches do NOT stop — the session keeps
   *  running across the route boundary. */
  start(opts?: { countInBars?: number }): void;
  stop(): void;
}
