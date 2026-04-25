import type { Genre, KitId, Pattern, RegionId } from '../../patterns/types';

export interface FilterState {
  meters: string[];
  regions: RegionId[];
  genres: Genre[];
  kits: KitId[];
}

export const DEFAULT_FILTERS: FilterState = {
  meters: [],
  regions: [],
  genres: [],
  kits: [],
};

/** Apply the filter chips to a list of patterns. Empty arrays mean
 *  "no filter on this axis" — the AND-of-rows / OR-within-rows
 *  combinator the chip UI implies.
 *
 *  Pure function — extracted from Library.tsx for testability. */
export function applyFilters(patterns: Pattern[], filters: FilterState): Pattern[] {
  return patterns.filter((p) => {
    if (filters.meters.length && !filters.meters.includes(p.timeSig)) return false;
    if (filters.regions.length && !filters.regions.includes(p.region)) return false;
    if (filters.genres.length && !filters.genres.includes(p.genre)) return false;
    if (filters.kits.length && !filters.kits.includes(p.defaultKit)) return false;
    return true;
  });
}
