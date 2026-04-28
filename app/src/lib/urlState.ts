// URL → (tab, pattern) parser. Pure function — no window/DOM access
// so it's testable against any search string.

export type Tab = 'practice' | 'library' | 'studio' | '_midi';

export interface UrlState {
  tab: Tab | null;
  pattern: string | null;
}

interface ParseOpts {
  /** Returns true if the given id is a known seed pattern (so we keep
   *  the short ?pattern= URL form). User-/shared-pattern ids fall
   *  through to the ?p= hash form. */
  seedExists: (id: string) => boolean;
  /** Whether dev-only tabs (e.g. _midi) are allowed in URLs. */
  devMode: boolean;
}

/** Parse a URL search string (e.g. `?tab=practice&pattern=karsilama`)
 *  into a tab + pattern pair. Unknown values fall through to null —
 *  callers default to localStorage / built-in defaults. */
export function readUrlState(search: string, opts: ParseOpts): UrlState {
  const params = new URLSearchParams(search);
  const rawTab = params.get('tab');
  let tab: Tab | null = null;
  if (rawTab === 'practice' || rawTab === 'library' || rawTab === 'studio') {
    tab = rawTab;
  } else if (rawTab === 'sound') {
    // The 'sound' tab was renamed to 'studio'. Old links land on
    // studio so URLs in the wild still work.
    tab = 'studio';
  } else if (rawTab === '_midi' && opts.devMode) {
    tab = '_midi';
  }
  const rawPattern = params.get('pattern');
  const pattern = rawPattern && opts.seedExists(rawPattern) ? rawPattern : null;
  return { tab, pattern };
}
