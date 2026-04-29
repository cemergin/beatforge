// StudioPattern — the unified record Studio thinks in. Combines the
// sound design (channels, sequence, FX state) with the Library
// metadata (region, genre, tags, story, defaultKit) so the rest of
// the app doesn't see two parallel IDB records.
//
// Internally the facade still writes to two tables (soundPatterns +
// userPatterns) for now — see store.ts. A future migration can collapse
// them; consumers won't notice.

import type { Genre, KitId, RegionId } from '../../patterns/types';
import type { Channel, SoundPattern } from '../../patterns/types-sound';
import type { SoundSequence } from '../../audio/runtime/sound-engine';

export interface StudioPattern {
  id: string;
  name: string;

  // ── Beat shape ──────────────────────────────────────────────────
  bpm: number;
  /** stepUnit ∈ 2 | 4 | 8 | 16 (denominator of a single step). */
  stepUnit: 2 | 4 | 8 | 16;
  grouping: number[];
  sequence: SoundSequence;
  channels: Channel[];

  // ── Feel + master FX (live during playback) ─────────────────────
  countInBars: number;
  swing: number;
  strongAmp: number;
  weakAmp: number;
  reverbWet: number;
  reverbSize: number;
  reverbDecay: number;
  delayWet: number;
  delayTime: number;
  delayFeedback: number;

  // ── Library metadata (mirrored into UserPattern record) ─────────
  region: RegionId;
  genre: Genre;
  tags: string[];
  story: string;
  defaultKit: KitId;
  swingable: boolean;

  createdAt: number;
  updatedAt: number;
}

/** The list-view shape — what saved-pattern UI rows render. Today
 *  this is identical to SoundPattern (the saved-list is the source
 *  of truth for the chip row); exposed via an alias so callers can
 *  swap to a slimmer view without ripple changes. */
export type StudioPatternListItem = SoundPattern;
