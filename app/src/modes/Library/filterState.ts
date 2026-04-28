import type { Genre, KitId, Pattern, RegionId } from '../../patterns/types';

export interface FilterState {
  meters: string[];
  regions: RegionId[];
  genres: Genre[];
  kits: KitId[];
  /** Source filter — null means "all patterns", 'local' shows only
   *  user-saved (UserPattern records have user: true), 'seed' shows
   *  only the curated corpus. */
  source: 'all' | 'local' | 'seed';
}

export const DEFAULT_FILTERS: FilterState = {
  meters: [],
  regions: [],
  genres: [],
  kits: [],
  source: 'all',
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
    if (filters.source === 'local' && !isUserPattern(p)) return false;
    if (filters.source === 'seed' && isUserPattern(p)) return false;
    return true;
  });
}

/** Is this a user-saved pattern? UserPattern carries user: true on
 *  the Pattern object, but Pattern's TS type doesn't include the
 *  flag — read it as a structural property without widening the
 *  base type. */
export function isUserPattern(p: Pattern): boolean {
  return (p as Pattern & { user?: boolean }).user === true;
}
