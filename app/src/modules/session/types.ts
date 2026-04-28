// Session — the canonical cross-mode state.
//
// One Pattern + one Kit + one BPM + one Swing live here. Practice,
// Studio, Library, and Sound all read and write through the same
// hook — so a tweak in one mode is visible the moment you switch
// to another. Reset points are explicit: loadPattern (full swap)
// and setKit (timbre swap). Everything else (cell edits, BPM ramps,
// swing nudges) is sticky tweaking on the live state.
//
// Pattern is mutable in place via setPattern(updater). The updater
// gets the current pattern and returns a (typically) shallow copy.
// Practice's cell-toggle, Studio's grouping permute, the trainer's
// BPM ramp — all flow through session writes so the next tab sees
// the same state.

import type { KitId, Pattern } from '../../patterns/types';

export interface Session {
  // ── Read-only state ──────────────────────────────────────────
  /** Current pattern (with any sticky edits applied). Never null —
   *  the session is always seeded with a default on mount. */
  readonly pattern: Pattern;
  /** Active kit id. Drives voice machine presets across channels. */
  readonly kit: KitId;
  /** Natural BPM (the user-facing tempo, denominator-of-time-sig
   *  per minute — e.g. 120 in 9/8 means 120 eighth notes/min). */
  readonly bpm: number;
  /** Swing slider value 0..100 (50 = straight, 100 = heavy triplet). */
  readonly swing: number;
  /** Transport state. */
  readonly playing: boolean;

  // ── Reset points ─────────────────────────────────────────────
  /** Load a fresh pattern. Replaces sticky state — bpm jumps to the
   *  pattern's default, kit jumps to the pattern's default, edits
   *  to the prior pattern are dropped. The user's deliberate "I'm
   *  starting over" action. */
  loadPattern(p: Pattern): void;
  /** Swap kit. Affects timbre across every channel; pattern + bpm
   *  + swing stay where they are. */
  setKit(k: KitId): void;

  // ── Sticky tweaks ────────────────────────────────────────────
  /** Patch the current pattern in place. Used by cell-toggle,
   *  grouping permute, trainer-time tweaks, ANY edit that should
   *  ride along with the user across tab switches. The updater
   *  returns the new pattern; identity comparison drives React
   *  re-renders downstream. */
  setPattern(updater: (prev: Pattern) => Pattern): void;
  setBpm(b: number): void;
  setSwing(s: number): void;

  // ── Transport ────────────────────────────────────────────────
  start(opts?: { countInBars?: number }): void;
  stop(): void;
}
