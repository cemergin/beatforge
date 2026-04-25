// URL → (tab, pattern) parser. Pure function — no window/DOM access
// so it's testable against any search string.

export type Tab = 'practice' | 'studio' | 'library' | 'sound' | '_patterns';

export interface UrlState {
  tab: Tab | null;
  pattern: string | null;
}

interface ParseOpts {
  /** Returns true if the given id is a known seed pattern (so we keep
   *  the short ?pattern= URL form). User-/shared-pattern ids fall
   *  through to the ?p= hash form. */
  seedExists: (id: string) => boolean;
  /** Whether the dev-only `_patterns` tab is allowed in URLs. */
  devMode: boolean;
}

/** Parse a URL search string (e.g. `?tab=practice&pattern=karsilama`)
 *  into a tab + pattern pair. Unknown values fall through to null —
 *  callers default to localStorage / built-in defaults. */
export function readUrlState(search: string, opts: ParseOpts): UrlState {
  const params = new URLSearchParams(search);
  const rawTab = params.get('tab');
  let tab: Tab | null = null;
  if (rawTab === 'practice' || rawTab === 'studio' || rawTab === 'library' || rawTab === 'sound') {
    tab = rawTab;
  } else if (rawTab === '_patterns' && opts.devMode) {
    tab = '_patterns';
  }
  const rawPattern = params.get('pattern');
  const pattern = rawPattern && opts.seedExists(rawPattern) ? rawPattern : null;
  return { tab, pattern };
}
