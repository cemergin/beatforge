// URL → (tab, pattern) parser. Pure function — no window/DOM access
// so it's testable against any search string.

export type Tab = 'practice' | 'library' | 'studio' | '_midi';

export interface UrlState {
  tab: Tab | null;
  pattern: string | null;
  /** ?detail=<id> — opens the Library pattern-detail modal direct
   *  from the URL. The Library validates the id against its
   *  loaded corpus, so unknown ids fall through silently. */
  detail: string | null;
}

interface ParseOpts {
  /** Returns true if the given id is a known seed pattern (so we keep
   *  the short ?pattern= URL form). User-/shared-pattern ids fall
   *  through to the ?p= hash form. */
  seedExists: (id: string) => boolean;
}

/** Parse a URL search string (e.g. `?tab=practice&pattern=karsilama`)
 *  into a tab + pattern pair. Unknown values fall through to null —
 *  callers default to localStorage / built-in defaults.
 *
 *  `_midi` is intentionally accessible from any build — the secret
 *  tab is hidden in the UI (no nav chip) but reachable by URL. The
 *  guardrail is "you must know the URL," not "you must be in dev." */
export function readUrlState(search: string, opts: ParseOpts): UrlState {
  const params = new URLSearchParams(search);
  const rawTab = params.get('tab');
  let tab: Tab | null = null;
  if (rawTab === 'practice' || rawTab === 'library' || rawTab === 'studio' || rawTab === '_midi') {
    tab = rawTab;
  } else if (rawTab === 'sound') {
    // The 'sound' tab was renamed to 'studio'. Old links land on
    // studio so URLs in the wild still work.
    tab = 'studio';
  }
  const rawPattern = params.get('pattern');
  const pattern = rawPattern && opts.seedExists(rawPattern) ? rawPattern : null;
  const detail = params.get('detail') || null;
  return { tab, pattern, detail };
}
