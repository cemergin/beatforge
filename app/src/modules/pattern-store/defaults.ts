// Default name + metadata for fresh Studio patterns. Centralized so
// "what does a new save look like?" has one answer.

import type { Genre, KitId, RegionId } from '../../patterns/types';

export interface StudioMetadataDefaults {
  region: RegionId;
  genre: Genre;
  tags: string[];
  story: string;
  defaultKit: KitId;
  swingable: boolean;
}

/** Sample metadata applied to every fresh save. Generic enough that
 *  unedited patterns still appear sensibly under Library's filters
 *  (electronic-western / popular / 808). The user can refine via
 *  Studio's metadata disclosure before clicking save. */
export function defaultMetadata(): StudioMetadataDefaults {
  return {
    region: 'electronic-western',
    genre: 'popular',
    tags: ['user-saved'],
    story: '',
    defaultKit: '808',
    swingable: false,
  };
}

/** Next default name for a fresh pattern. Returns the form
 *  "Pattern #N" where N is one past the highest existing ordinal in
 *  the saved list (or list.length+1 when no ordinals are present).
 *  Avoids "Untitled" collisions and gives every save a distinct,
 *  sortable name without the user typing.
 *
 *  Accepts a list of names (not full records) so the helper is
 *  testable without IDB. */
export function nextPatternName(existingNames: readonly string[]): string {
  const ordinalRegex = new RegExp('^Pattern #(\\d+)$');
  let maxOrdinal = 0;
  for (const n of existingNames) {
    const m = ordinalRegex.exec(n);
    if (m) maxOrdinal = Math.max(maxOrdinal, parseInt(m[1], 10));
  }
  return `Pattern #${Math.max(maxOrdinal + 1, existingNames.length + 1)}`;
}
