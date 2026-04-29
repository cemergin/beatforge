// The store facade — thin wrapper over the two-table IDB layout.
// Save / load / list / delete operate on the unified StudioPattern
// shape. UserPattern (Library record) is derived on save and
// rehydrated on load via the translators in translate.ts.

import {
  saveSoundPattern,
  listSoundPatterns,
  deleteSoundPattern,
  saveUserPattern,
  deleteUserPattern,
  getUserPattern,
  type UserPattern,
} from '../../lib/db';
import type { SoundPattern } from '../../patterns/types-sound';
import { sequenceFromTracks, buildSoundPattern, buildUserPatternView } from './translate';
import { defaultMetadata } from './defaults';
import type { StudioPattern, StudioPatternListItem } from './types';

/** Save (or update) a Studio pattern. Writes both records:
 *  - SoundPattern (sound design + FX state, full fidelity)
 *  - UserPattern  (Library record, derived view)
 *
 *  The UserPattern write is best-effort — a failure there leaves the
 *  SoundPattern on disk so the user doesn't lose their work; the
 *  pattern just won't show up in Library until the next save retries. */
export async function saveStudioPattern(p: StudioPattern): Promise<void> {
  const sound = buildSoundPattern(p);
  await saveSoundPattern(sound);
  try {
    await saveUserPattern(buildUserPatternView(p));
  } catch {
    /* best-effort — Library record will retry on next save */
  }
}

/** Load a StudioPattern by id. Pulls the SoundPattern (full sound
 *  design) AND the matching UserPattern (metadata) and merges them.
 *  Returns null when the SoundPattern is missing — the source of
 *  truth for the saved-list. Missing UserPattern (e.g. created
 *  before the bundled save) falls back to defaults so loading still
 *  works for legacy records. */
export async function loadStudioPattern(id: string): Promise<StudioPattern | null> {
  const list = await listSoundPatterns();
  const sound = list.find((x) => x.id === id);
  if (!sound) return null;
  const user = await getUserPattern(id);
  const meta = user
    ? {
        region: user.region,
        genre: user.genre,
        tags: [...user.tags],
        story: user.story ?? '',
        defaultKit: user.defaultKit,
        swingable: user.swingable ?? false,
      }
    : defaultMetadata();
  return mergeSoundAndMeta(sound, meta);
}

/** List the Studio saved-patterns for the saved-list UI. Returns
 *  SoundPattern[] (the existing chip-row shape) — Library reads its
 *  own UserPattern[] separately via lib/db.listUserPatterns. */
export async function listStudioPatterns(): Promise<StudioPatternListItem[]> {
  return listSoundPatterns();
}

/** Delete both records. SoundPattern delete fires first; UserPattern
 *  delete is best-effort so an orphaned Library record doesn't block
 *  the user's "remove this" action. */
export async function deleteStudioPattern(id: string): Promise<void> {
  await deleteSoundPattern(id);
  try { await deleteUserPattern(id); }
  catch { /* orphaned Library record — Library's local filter will hide it */ }
}

/** Combine a SoundPattern (channels + sequence + FX) and metadata
 *  into a StudioPattern. Used by load + by the explicit "I want to
 *  load this saved-list row" path in Sound.tsx that already has the
 *  SoundPattern in hand. */
export function mergeSoundAndMeta(
  sound: SoundPattern,
  meta: ReturnType<typeof defaultMetadata>,
): StudioPattern {
  return {
    id: sound.id,
    name: sound.name,
    bpm: sound.bpm,
    stepUnit: sound.stepUnit,
    grouping: [...sound.grouping],
    sequence: sound.sequence.map((row) => row.map((v) => (v === 2 ? 2 : v === 1 ? 1 : 0))),
    channels: sound.channels.map((c) => ({
      label: c.label,
      machine: { ...c.machine },
      effects: { ...c.effects, colorFx: { ...c.effects.colorFx } },
    })),
    countInBars: sound.countInBars ?? 0,
    swing: sound.swing ?? 0.5,
    strongAmp: sound.strongAmp ?? 1.0,
    weakAmp: sound.weakAmp ?? 0.55,
    reverbWet: sound.reverbWet ?? 0.5,
    reverbSize: sound.reverbSize ?? 1.8,
    reverbDecay: sound.reverbDecay ?? 2.2,
    delayWet: sound.delayWet ?? 0.15,
    delayTime: sound.delayTime ?? 0.25,
    delayFeedback: sound.delayFeedback ?? 0.35,
    region: meta.region,
    genre: meta.genre,
    tags: [...meta.tags],
    story: meta.story,
    defaultKit: meta.defaultKit,
    swingable: meta.swingable,
    createdAt: sound.createdAt,
    updatedAt: sound.updatedAt,
  };
}

// Re-export for callers that already have a UserPattern in hand and
// just want the merge step (e.g. tests, future imports).
export { sequenceFromTracks, buildSoundPattern, buildUserPatternView };
export type { UserPattern };
