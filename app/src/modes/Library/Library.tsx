import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import Fuse from 'fuse.js';
import type { AudioEngine } from '../../audio/engine';
import type { Genre, KitId, Pattern, RegionId } from '../../patterns/types';
import { PATTERNS, patternById } from '../../patterns/seed';
import { getHighlights, getRecent, toggleHighlight } from '../../lib/storage';
import { Filters } from './Filters';
import { DEFAULT_FILTERS, type FilterState } from './filterState';
import { WorldMap } from './WorldMap';
import { REGION_BY_ID } from './regions';
import { StarterPaths } from './StarterPaths';
import { PatternCard } from './PatternCard';
import { PatternDetail } from './PatternDetail';
import type { StarterPath } from './paths';

interface Props {
  engine: AudioEngine;
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

export function Library({ engine, onLoadInPractice, onOpenInStudio }: Props) {
  const [query, setQuery] = useState('');
  const [filters, setFilters] = useState<FilterState>(DEFAULT_FILTERS);
  const [detailId, setDetailId] = useState<string | null>(null);
  const [activePath, setActivePath] = useState<StarterPath | null>(null);
  const [regionPreview, setRegionPreview] = useState<RegionId | null>(null);

  const [highlights, setHighlights] = useState<string[]>(() => getHighlights());
  const recent = useMemo<string[]>(() => getRecent(), []);
  const [pathProgress, setPathProgress] = useState<Record<string, number>>(
    () => readPathProgress(),
  );
  const [page, setPage] = useState(1);

  // Reset to page 1 whenever the result set could change.
  useEffect(() => {
    setPage(1);
  }, [query, filters, activePath]);

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

  // Fuse index — built once per PATTERNS reference (static in v1).
  const fuse = useMemo(() => {
    const searchable = PATTERNS.map((p) => ({
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
  }, []);

  // Facet option lists — derived from PATTERNS.
  const allMeters = useMemo(
    () => Array.from(new Set(PATTERNS.map((p) => p.timeSig))).sort(),
    [],
  );
  const allGenres = useMemo<Genre[]>(
    () => Array.from(new Set(PATTERNS.map((p) => p.genre))).sort() as Genre[],
    [],
  );
  const allKits = useMemo<KitId[]>(
    () => Array.from(new Set(PATTERNS.map((p) => p.defaultKit))).sort() as KitId[],
    [],
  );

  // Apply filters + search to compute the results set.
  const searched = useMemo<Pattern[]>(() => {
    const q = normalize(query.trim());
    if (!q) return PATTERNS;
    return fuse.search(q).map((r) => r.item.p);
  }, [query, fuse]);

  const filtered = useMemo<Pattern[]>(() => {
    // When a starter path is active, it's the dominant filter — everything
    // else (search/region/meter/...) is ignored so the path's sequence is
    // visible in its intended order.
    if (activePath) {
      const known = new Map(PATTERNS.map((p) => [p.id, p] as const));
      return activePath.patternIds
        .map((id) => known.get(id))
        .filter((p): p is Pattern => !!p);
    }
    return searched.filter((p) => {
      if (filters.meters.length && !filters.meters.includes(p.timeSig)) return false;
      if (filters.regions.length && !filters.regions.includes(p.region)) return false;
      if (filters.genres.length && !filters.genres.includes(p.genre)) return false;
      if (filters.kits.length && !filters.kits.includes(p.defaultKit)) return false;
      return true;
    });
  }, [searched, filters, activePath]);

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
    const known = new Set(PATTERNS.map((p) => p.id));
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
  }, [scrollToResults]);

  const clearActivePath = useCallback(() => setActivePath(null), []);

  const startPathFromFirst = useCallback(() => {
    if (!activePath) return;
    const known = new Set(PATTERNS.map((p) => p.id));
    const valid = activePath.patternIds.filter((id) => known.has(id));
    if (valid.length === 0) return;
    const next = { ...pathProgress, [activePath.id]: 0 };
    setPathProgress(next);
    writePathProgress(next);
    onLoadInPractice(valid[0]);
  }, [activePath, pathProgress, onLoadInPractice]);

  const surprise = useCallback(() => {
    const pool = filtered.length > 0 ? filtered : PATTERNS;
    const pick = pool[Math.floor(Math.random() * pool.length)];
    onLoadInPractice(pick.id);
  }, [filtered, onLoadInPractice]);

  const onToggleStar = useCallback((id: string) => {
    setHighlights(toggleHighlight(id));
  }, []);

  const detailPattern = detailId ? patternById(detailId) ?? null : null;

  return (
    <main className="bf-lib-page">
      <header className="bf-lib-hero">
        <div>
          <h1 className="bf-lib-title">Library</h1>
          <p className="bf-lib-sub">
            {PATTERNS.length} world rhythms and exercises. Search, browse the map,
            or follow a starter path.
          </p>
          <div className="bf-lib-hero-actions">
            <button className="bf-chip on" onClick={surprise} type="button">
              🎲 Surprise me
            </button>
            <span className="bf-zone-sub">
              Loads a random pattern in Practice{filtered.length !== PATTERNS.length ? ' from the filtered set' : ''}.
            </span>
          </div>
        </div>
        <div className="bf-lib-search">
          <input
            ref={searchRef}
            className="bf-search-input"
            placeholder="Search rhythms, origins, tags…  ( / )"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            type="search"
          />
        </div>
      </header>

      {/* Zone 2 — Highlights */}
      {highlights.length > 0 && (
        <section className="bf-lib-zone">
          <div className="bf-strip">
            <div className="bf-strip-label">⭐ highlights</div>
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
            <div className="bf-strip-label">recent</div>
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
          <h2 className="bf-zone-title">Filter</h2>
          <span className="bf-zone-sub">Multi-select inside a row (OR); across rows (AND).</span>
        </div>
        <Filters
          filters={filters}
          setFilters={setFilters}
          allMeters={allMeters}
          allGenres={allGenres}
          allKits={allKits}
        />
      </section>

      {/* Results grid — moved up so patterns are visible on landing.
          Discovery widgets (map, paths, grouping) live below. */}
      <section className="bf-lib-zone" ref={resultsRef}>
        {activePath ? (
          <div className="bf-path-view">
            <div className="bf-path-head">
              <div>
                <div className="bf-path-kicker">
                  <span className="bf-mini-label">Starter path</span>
                  <button
                    className="bf-linkbtn"
                    onClick={clearActivePath}
                    type="button"
                  >
                    × close path
                  </button>
                </div>
                <h2 className="bf-path-title">{activePath.title}</h2>
                <p className="bf-path-subtitle">{activePath.subtitle}</p>
              </div>
              <button
                className="bf-chip on"
                onClick={startPathFromFirst}
                type="button"
                disabled={filtered.length === 0}
              >
                ▶ start from first
              </button>
            </div>
            <p className="bf-path-context">{activePath.context}</p>
            <div className="bf-zone-head">
              <h3 className="bf-zone-subtitle">
                {filtered.length} pattern{filtered.length === 1 ? '' : 's'} in this path
              </h3>
            </div>
            {filtered.length === 0 ? (
              <div className="bf-lib-empty">
                None of this path's patterns are in the library yet.
              </div>
            ) : (
              <div className="bf-lib-full-grid">
                {filtered.map((p, i) => (
                  <div key={p.id} className="bf-path-card-wrap">
                    <span className="bf-path-step">{i + 1}</span>
                    <PatternCard
                      pattern={p}
                      starred={highlights.includes(p.id)}
                      onClick={(id) => setDetailId(id)}
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

              return (
                <>
                  {regionIntro && (
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
                          {regionIntro.label}
                        </h3>
                        <button
                          className="bf-region-intro-close"
                          onClick={() => {
                            setRegionPreview(null);
                            setFilters((prev) => ({ ...prev, regions: [] }));
                          }}
                          aria-label="Dismiss region intro and clear region filter"
                          type="button"
                        >
                          ×
                        </button>
                      </div>
                      <p className="bf-region-intro-body">{regionIntro.intro}</p>
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
                    <h2 className="bf-zone-title">Results</h2>
                    <span className="bf-zone-sub">
                      {filtered.length === 0
                        ? `0 of ${PATTERNS.length}`
                        : `${start + 1}–${end} of ${filtered.length}`}
                    </span>
                  </div>
                  {filtered.length === 0 ? (
                    <div className="bf-lib-empty">
                      Nothing matches these filters. <button className="bf-linkbtn" onClick={() => { setFilters(DEFAULT_FILTERS); setQuery(''); setRegionPreview(null); }} type="button">reset</button>
                    </div>
                  ) : (
                    <>
                      <div className="bf-lib-full-grid">
                        {pageItems.map((p) => (
                          <PatternCard
                            key={p.id}
                            pattern={p}
                            starred={highlights.includes(p.id)}
                            onClick={(id) => setDetailId(id)}
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
                            aria-label="Previous page"
                          >
                            ‹ prev
                          </button>
                          <span className="bf-page-info">
                            page {safePage} / {totalPages}
                          </span>
                          <button
                            className="bf-page-btn"
                            onClick={() => goPage(safePage + 1)}
                            disabled={safePage === totalPages}
                            type="button"
                            aria-label="Next page"
                          >
                            next ›
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
          <h2 className="bf-zone-title">World Map</h2>
          <span className="bf-zone-sub">Tap a region to filter the results.</span>
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
          <h2 className="bf-zone-title">Starter Paths</h2>
          <span className="bf-zone-sub">Curated sequences — click to load the first pattern.</span>
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
