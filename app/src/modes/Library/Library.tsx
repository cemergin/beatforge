import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import Fuse from 'fuse.js';
import type { SoundEngine } from '../../audio/runtime/sound-engine';
import type { Genre, KitId, Pattern, RegionId } from '../../patterns/types';
import { PATTERNS, patternById } from '../../patterns/seed';
import { listUserPatterns } from '../../lib/db';
import { getHighlights, getRecent, toggleHighlight } from '../../lib/storage';
import { useT, useLang } from '../../i18n';
import { readUrlState } from '../../lib/urlState';
import { Filters } from './Filters';
import { applyFilters, DEFAULT_FILTERS, type FilterState } from './filterState';
import { WorldMap } from './WorldMap';
import { REGION_BY_ID, localizedRegion } from './regions';
import { StarterPaths } from './StarterPaths';
import { PatternCard } from './PatternCard';
import { PatternDetail } from './PatternDetail';
import { localizedPath, type StarterPath } from './paths';

interface Props {
  engine: SoundEngine;
  onLoadInPractice: (id: string) => void;
  onOpenInStudio?: (pattern: Pattern) => void;
}

const PATH_PROGRESS_KEY = 'bf_path_progress';
const PAGE_SIZE = 36;

function readPathProgress(): Record<string, number> {
  try {
    const raw = localStorage.getItem(PATH_PROGRESS_KEY);
    if (!raw) return {};
    const parsed: unknown = JSON.parse(raw);
    if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
      const out: Record<string, number> = {};
      for (const [k, v] of Object.entries(parsed as Record<string, unknown>)) {
        if (typeof v === 'number') out[k] = v;
      }
      return out;
    }
  } catch { /* ignore */ }
  return {};
}

function writePathProgress(p: Record<string, number>): void {
  try { localStorage.setItem(PATH_PROGRESS_KEY, JSON.stringify(p)); } catch { /* ignore */ }
}

function normalize(s: string): string {
  return s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
}

/** Pull `?detail=<id>` off window.location via the canonical parser
 *  in lib/urlState.ts. Library needs this on every render path
 *  (mount, popstate) since detailId is local Library state, not
 *  threaded through App. */
function readDetailParam(): string | null {
  if (typeof window === 'undefined') return null;
  return readUrlState(window.location.search, { seedExists: () => true }).detail;
}

export function Library({ engine, onLoadInPractice, onOpenInStudio }: Props) {
  const t = useT();
  const { lang } = useLang();
  const [query, setQuery] = useState('');
  const [filters, setFilters] = useState<FilterState>(DEFAULT_FILTERS);
  const [detailId, setDetailId] = useState<string | null>(() => readDetailParam());
  const [activePath, setActivePath] = useState<StarterPath | null>(null);
  const [regionPreview, setRegionPreview] = useState<RegionId | null>(null);

  const [highlights, setHighlights] = useState<string[]>(() => getHighlights());
  const recent = useMemo<string[]>(() => getRecent(), []);
  const [pathProgress, setPathProgress] = useState<Record<string, number>>(
    () => readPathProgress(),
  );
  const [page, setPage] = useState(1);

  // User-saved patterns from IDB. Loaded once on mount via promise-
  // then so the React-19 set-state-in-effect lint stays happy. Also
  // refreshed on focus so saving in Studio + tab-switching here
  // shows the new pattern without a full page reload.
  const [userPatterns, setUserPatterns] = useState<Pattern[]>([]);
  useEffect(() => {
    let active = true;
    const load = () => listUserPatterns()
      .then((list) => { if (active) setUserPatterns(list); })
      .catch(() => { /* IDB unavailable */ });
    load();
    const onFocus = () => load();
    window.addEventListener('focus', onFocus);
    return () => {
      active = false;
      window.removeEventListener('focus', onFocus);
    };
  }, []);

  // Combined corpus — seeds + user patterns. Used everywhere PATTERNS
  // was used directly so user-saved rhythms surface in search,
  // filters, region browsing, and the cards grid.
  const allPatterns = useMemo(() => {
    if (userPatterns.length === 0) return PATTERNS;
    return [...PATTERNS, ...userPatterns];
  }, [userPatterns]);

  // Reset to page 1 whenever the result set could change.
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- legitimate sync of derived state to query/filter inputs.
    setPage(1);
  }, [query, filters, activePath]);

  // URL ↔ detailId sync. Opening / swapping / closing the modal
  // updates ?detail=<id> via replaceState; we don't push new history
  // entries because the modal is a transient view, not a navigation.
  // Popstate (browser back/forward) re-reads the URL and applies it.
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const current = params.get('detail');
    if (detailId === current) return;
    if (detailId) params.set('detail', detailId);
    else params.delete('detail');
    const search = params.toString();
    const next = `${window.location.pathname}${search ? '?' + search : ''}${window.location.hash}`;
    window.history.replaceState(null, '', next);
  }, [detailId]);

  useEffect(() => {
    const onPop = () => {
      setDetailId(readDetailParam());
    };
    window.addEventListener('popstate', onPop);
    return () => window.removeEventListener('popstate', onPop);
  }, []);

  const searchRef = useRef<HTMLInputElement | null>(null);
  const resultsRef = useRef<HTMLDivElement | null>(null);

  // Stop preview engine when leaving the Library
  useEffect(() => {
    return () => { engine.stop(); };
  }, [engine]);

  // Keyboard — `/` focuses search
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === '/') {
        const t = e.target as HTMLElement | null;
        if (t && (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA' || t.isContentEditable)) return;
        e.preventDefault();
        searchRef.current?.focus();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  // Fuse index — rebuilt when the user-pattern list changes so
  // newly saved patterns are searchable without a page reload.
  const fuse = useMemo(() => {
    const searchable = allPatterns.map((p) => ({
      p,
      name: normalize(p.name),
      origin: normalize(p.origin),
      tradition: normalize(p.tradition),
      story: normalize(p.story ?? ''),
      tags: p.tags.map(normalize).join(' '),
      instruments: (p.instruments ?? []).map(normalize).join(' '),
    }));
    return new Fuse(searchable, {
      keys: ['name', 'origin', 'tradition', 'story', 'tags', 'instruments'],
      threshold: 0.35,
      ignoreLocation: true,
    });
  }, [allPatterns]);

  // Facet option lists — derived from the combined corpus so user
  // patterns' regions / genres / kits surface in the filter chips.
  const allMeters = useMemo(
    () => Array.from(new Set(allPatterns.map((p) => p.timeSig))).sort(),
    [allPatterns],
  );
  const allGenres = useMemo<Genre[]>(
    () => Array.from(new Set(allPatterns.map((p) => p.genre))).sort() as Genre[],
    [allPatterns],
  );
  const allKits = useMemo<KitId[]>(
    () => Array.from(new Set(allPatterns.map((p) => p.defaultKit))).sort() as KitId[],
    [allPatterns],
  );

  // Apply filters + search to compute the results set.
  const searched = useMemo<Pattern[]>(() => {
    const q = normalize(query.trim());
    if (!q) return allPatterns;
    return fuse.search(q).map((r) => r.item.p);
  }, [query, fuse, allPatterns]);

  const filtered = useMemo<Pattern[]>(() => {
    // When a starter path is active, it's the dominant filter — everything
    // else (search/region/meter/...) is ignored so the path's sequence is
    // visible in its intended order.
    if (activePath) {
      const known = new Map(allPatterns.map((p) => [p.id, p] as const));
      return activePath.patternIds
        .map((id) => known.get(id))
        .filter((p): p is Pattern => !!p);
    }
    return applyFilters(searched, filters);
  }, [searched, filters, activePath, allPatterns]);

  const scrollToResults = useCallback(() => {
    requestAnimationFrame(() => {
      resultsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
  }, []);

  const onPickRegion = useCallback((id: RegionId) => {
    setFilters((prev) => ({
      ...prev,
      regions: prev.regions.includes(id) && prev.regions.length === 1 ? [] : [id],
    }));
    scrollToResults();
  }, [scrollToResults]);

  const onPickPath = useCallback((path: StarterPath) => {
    const known = new Set(allPatterns.map((p) => p.id));
    const valid = path.patternIds.filter((id) => known.has(id));
    if (valid.length === 0) return;
    // Open the path's filtered view INSIDE the Library, don't jump to Practice.
    // User reads the context, then clicks a specific pattern card (or the
    // "Start from first" action) when ready to play.
    setActivePath(path);
    setQuery('');
    setFilters(DEFAULT_FILTERS);
    setRegionPreview(null);
    scrollToResults();
  }, [allPatterns, scrollToResults]);

  const clearActivePath = useCallback(() => setActivePath(null), []);

  const startPathFromFirst = useCallback(() => {
    if (!activePath) return;
    const known = new Set(allPatterns.map((p) => p.id));
    const valid = activePath.patternIds.filter((id) => known.has(id));
    if (valid.length === 0) return;
    const next = { ...pathProgress, [activePath.id]: 0 };
    setPathProgress(next);
    writePathProgress(next);
    onLoadInPractice(valid[0]);
  }, [activePath, allPatterns, pathProgress, onLoadInPractice]);

  const surprise = useCallback(() => {
    const pool = filtered.length > 0 ? filtered : allPatterns;
    const pick = pool[Math.floor(Math.random() * pool.length)];
    onLoadInPractice(pick.id);
  }, [filtered, allPatterns, onLoadInPractice]);

  const onToggleStar = useCallback((id: string) => {
    setHighlights(toggleHighlight(id));
  }, []);

  // Stabilized click handler — passing this to PatternCard (memoized)
  // means typing in search no longer re-renders all 36 cards. Was a
  // perf cliff on web devices: each keystroke rebuilt the inline
  // arrow function, breaking shallow-equal prop check.
  const openDetail = useCallback((id: string) => setDetailId(id), []);

  // Look up the detail pattern from the combined corpus rather than
  // patternById — user patterns live in Library's own state and may
  // not yet be in App.tsx's userCache when this modal opens.
  const detailPattern = detailId
    ? (allPatterns.find((p) => p.id === detailId) ?? patternById(detailId) ?? null)
    : null;

  return (
    <main className="bf-lib-page">
      <header className="bf-lib-hero">
        <div>
          <h1 className="bf-lib-title">{t('library.title')}</h1>
          <p className="bf-lib-sub">
            {t('library.subtitle_base', { count: PATTERNS.length })}
            {userPatterns.length > 0 && t('library.subtitle_with_user', { n: userPatterns.length })}
            {t('library.subtitle_tail')}
          </p>
          <div className="bf-lib-hero-actions">
            <button className="bf-chip on" onClick={surprise} type="button">
              {t('library.surprise')}
            </button>
          </div>
        </div>
      </header>

      {/* Zone 2 — Highlights */}
      {highlights.length > 0 && (
        <section className="bf-lib-zone">
          <div className="bf-strip">
            <div className="bf-strip-label">{t('library.highlights')}</div>
            <div className="bf-strip-chips">
              {highlights.map((id) => {
                const p = patternById(id);
                if (!p) return null;
                return (
                  <button
                    key={id}
                    className="bf-strip-chip"
                    onClick={() => setDetailId(id)}
                    type="button"
                  >
                    {p.name}
                  </button>
                );
              })}
            </div>
          </div>
        </section>
      )}

      {/* Zone 3 — Recent */}
      {recent.length >= 2 && (
        <section className="bf-lib-zone">
          <div className="bf-strip">
            <div className="bf-strip-label">{t('library.recent')}</div>
            <div className="bf-strip-chips">
              {recent.slice(0, 10).map((id) => {
                const p = patternById(id);
                if (!p) return null;
                return (
                  <button
                    key={id}
                    className="bf-strip-chip muted"
                    onClick={() => setDetailId(id)}
                    type="button"
                  >
                    {p.name}
                  </button>
                );
              })}
            </div>
          </div>
        </section>
      )}

      {/* Filter chip rows — sit just above results so the user can narrow
          the grid without scrolling past discovery widgets. */}
      <section className="bf-lib-zone">
        <div className="bf-zone-head">
          <h2 className="bf-zone-title">{t('library.filter_title')}</h2>
          <span className="bf-zone-sub">{t('library.filter_mode')}</span>
        </div>
        <Filters
          filters={filters}
          setFilters={setFilters}
          allMeters={allMeters}
          allGenres={allGenres}
          allKits={allKits}
          localCount={userPatterns.length}
        />
      </section>

      <div className="bf-lib-search-row">
        <input
          ref={searchRef}
          className="bf-search-input"
          placeholder={t('library.search_placeholder')}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          type="search"
        />
      </div>

      {/* Results grid — moved up so patterns are visible on landing.
          Discovery widgets (map, paths, grouping) live below. */}
      <section className="bf-lib-zone" ref={resultsRef}>
        {activePath ? (
          <div className="bf-path-view">
            <button
              className="bf-path-close"
              onClick={clearActivePath}
              aria-label={t('library.path_close')}
              title={t('library.path_close')}
              type="button"
            >
              ×
            </button>
            <div className="bf-path-head">
              <div>
                <div className="bf-path-kicker">
                  <span className="bf-mini-label">{t('library.path_starter')}</span>
                </div>
                <h2 className="bf-path-title">{localizedPath(activePath, lang).title}</h2>
                <p className="bf-path-subtitle">{localizedPath(activePath, lang).subtitle}</p>
              </div>
              <button
                className="bf-chip on"
                onClick={startPathFromFirst}
                type="button"
                disabled={filtered.length === 0}
              >
                {t('library.path_start')}
              </button>
            </div>
            <p className="bf-path-context">{localizedPath(activePath, lang).context}</p>
            <div className="bf-zone-head">
              <h3 className="bf-zone-subtitle">
                {t(filtered.length === 1 ? 'library.path_count_one' : 'library.path_count_many', { n: filtered.length })}
              </h3>
            </div>
            {filtered.length === 0 ? (
              <div className="bf-lib-empty">
                {t('library.path_empty')}
              </div>
            ) : (
              <div className="bf-lib-full-grid">
                {filtered.map((p, i) => (
                  <div key={p.id} className="bf-path-card-wrap">
                    <span className="bf-path-step">{i + 1}</span>
                    <PatternCard
                      pattern={p}
                      starred={highlights.includes(p.id)}
                      onClick={openDetail}
                      onToggleStar={onToggleStar}
                    />
                  </div>
                ))}
              </div>
            )}
          </div>
        ) : (
          <>
            {(() => {
              const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
              const safePage = Math.min(page, totalPages);
              const start = (safePage - 1) * PAGE_SIZE;
              const end = Math.min(start + PAGE_SIZE, filtered.length);
              const pageItems = filtered.slice(start, end);
              const goPage = (next: number) => {
                setPage(Math.max(1, Math.min(totalPages, next)));
                requestAnimationFrame(() => {
                  resultsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
                });
              };

              const regionIntro = regionPreview ? REGION_BY_ID[regionPreview] : null;
              const regionIntroLoc = regionIntro ? localizedRegion(regionIntro, lang) : null;

              return (
                <>
                  {regionIntro && regionIntroLoc && (
                    <aside
                      className="bf-region-intro-card"
                      style={{ borderColor: regionIntro.color }}
                      aria-live="polite"
                    >
                      <div className="bf-region-intro-head">
                        <h3
                          className="bf-region-intro-title"
                          style={{ color: regionIntro.color }}
                        >
                          {regionIntroLoc.label}
                        </h3>
                        <button
                          className="bf-region-intro-close"
                          onClick={() => {
                            setRegionPreview(null);
                            setFilters((prev) => ({ ...prev, regions: [] }));
                          }}
                          aria-label={t('library.region_dismiss')}
                          type="button"
                        >
                          ×
                        </button>
                      </div>
                      <p className="bf-region-intro-body">{regionIntroLoc.intro}</p>
                      {(regionIntro.keyRhythms?.length || regionIntro.instruments?.length) && (
                        <dl className="bf-region-intro-meta">
                          {regionIntro.keyRhythms && regionIntro.keyRhythms.length > 0 && (
                            <div className="bf-region-intro-row">
                              <dt>signature rhythms</dt>
                              <dd>{regionIntro.keyRhythms.join(' · ')}</dd>
                            </div>
                          )}
                          {regionIntro.instruments && regionIntro.instruments.length > 0 && (
                            <div className="bf-region-intro-row">
                              <dt>characteristic instruments</dt>
                              <dd>{regionIntro.instruments.join(' · ')}</dd>
                            </div>
                          )}
                        </dl>
                      )}
                    </aside>
                  )}
                  <div className="bf-zone-head">
                    <h2 className="bf-zone-title">{t('library.results_title')}</h2>
                    <span className="bf-zone-sub">
                      {filtered.length === 0
                        ? t('library.results_count_zero', { total: allPatterns.length })
                        : t('library.results_count_some', { start: start + 1, end, total: filtered.length })}
                    </span>
                  </div>
                  {filtered.length === 0 ? (
                    <div className="bf-lib-empty">
                      {t('library.no_results')} <button className="bf-linkbtn" onClick={() => { setFilters(DEFAULT_FILTERS); setQuery(''); setRegionPreview(null); }} type="button">{t('library.reset')}</button>
                    </div>
                  ) : (
                    <>
                      <div className="bf-lib-full-grid">
                        {pageItems.map((p) => (
                          <PatternCard
                            key={p.id}
                            pattern={p}
                            starred={highlights.includes(p.id)}
                            onClick={openDetail}
                            onToggleStar={onToggleStar}
                          />
                        ))}
                      </div>
                      {totalPages > 1 && (
                        <nav className="bf-pagination" aria-label="Results pagination">
                          <button
                            className="bf-page-btn"
                            onClick={() => goPage(safePage - 1)}
                            disabled={safePage === 1}
                            type="button"
                            aria-label={t('library.page_prev')}
                          >
                            {t('library.pagination_prev')}
                          </button>
                          <span className="bf-page-info">
                            {t('library.pagination_info', { page: safePage, total: totalPages })}
                          </span>
                          <button
                            className="bf-page-btn"
                            onClick={() => goPage(safePage + 1)}
                            disabled={safePage === totalPages}
                            type="button"
                            aria-label={t('library.page_next')}
                          >
                            {t('library.pagination_next')}
                          </button>
                        </nav>
                      )}
                    </>
                  )}
                </>
              );
            })()}
          </>
        )}
      </section>

      {/* Discovery — below the results grid. These help users explore
          but don't gate the patterns on landing. */}
      <section className="bf-lib-zone">
        <div className="bf-zone-head">
          <h2 className="bf-zone-title">{t('library.world_map_title')}</h2>
          <span className="bf-zone-sub">{t('library.world_map_sub')}</span>
        </div>
        <WorldMap
          patterns={PATTERNS}
          previewId={regionPreview}
          setPreviewId={setRegionPreview}
          onPickRegion={onPickRegion}
          compact
        />
      </section>

      <section className="bf-lib-zone">
        <div className="bf-zone-head">
          <h2 className="bf-zone-title">{t('library.starter_paths_title')}</h2>
          <span className="bf-zone-sub">{t('library.starter_paths_sub')}</span>
        </div>
        <StarterPaths
          patterns={PATTERNS}
          progress={pathProgress}
          onPickPath={onPickPath}
          compact
        />
      </section>

      {detailPattern && (
        <PatternDetail
          key={detailPattern.id}
          pattern={detailPattern}
          engine={engine}
          onClose={() => { engine.stop(); setDetailId(null); }}
          onOpenPattern={(id) => { engine.stop(); setDetailId(id); }}
          onLoadInPractice={(id) => { engine.stop(); setDetailId(null); onLoadInPractice(id); }}
          onOpenInStudio={onOpenInStudio ? (p) => {
            engine.stop();
            setDetailId(null);
            onOpenInStudio(p);
          } : undefined}
        />
      )}
    </main>
  );
}
