import { useCallback, useEffect, useRef, useState } from 'react';
import type { Pattern } from '../../patterns/types';
import { STARTER_PATHS, type StarterPath } from './paths';

interface Props {
  patterns: Pattern[];
  onPickPath: (path: StarterPath) => void;
  progress: Record<string, number>;
  compact?: boolean;
}

// How many chip-cards to advance on each arrow click in compact mode.
const SCROLL_BY = 5;

export function StarterPaths({ patterns, onPickPath, progress, compact }: Props) {
  const known = new Set(patterns.map((p) => p.id));
  const stripRef = useRef<HTMLDivElement | null>(null);
  const [canPrev, setCanPrev] = useState(false);
  const [canNext, setCanNext] = useState(false);

  // Recompute arrow availability whenever the strip scrolls or resizes —
  // disables the arrow when there's nothing left in that direction.
  const updateEdges = useCallback(() => {
    const el = stripRef.current;
    if (!el) return;
    setCanPrev(el.scrollLeft > 1);
    setCanNext(el.scrollLeft + el.clientWidth < el.scrollWidth - 1);
  }, []);

  useEffect(() => {
    if (!compact) return;
    updateEdges();
    const el = stripRef.current;
    if (!el) return;
    el.addEventListener('scroll', updateEdges, { passive: true });
    const ro = new ResizeObserver(updateEdges);
    ro.observe(el);
    return () => {
      el.removeEventListener('scroll', updateEdges);
      ro.disconnect();
    };
  }, [compact, updateEdges]);

  const scrollByChips = useCallback((dir: 1 | -1) => {
    const el = stripRef.current;
    if (!el) return;
    const first = el.querySelector<HTMLElement>('.bf-starter-chip');
    // Fallback to a sensible default if we can't measure a chip yet.
    const stepPx = first
      ? (first.offsetWidth + 10) * SCROLL_BY
      : 950;
    el.scrollBy({ left: dir * stepPx, behavior: 'smooth' });
  }, []);

  if (!compact) {
    return (
      <div className="bf-starter-grid">
        {STARTER_PATHS.map((path) => {
          const valid = path.patternIds.filter((id) => known.has(id));
          const at = progress[path.id] ?? 0;
          return (
            <button
              key={path.id}
              className="bf-starter-card"
              onClick={() => onPickPath(path)}
              type="button"
              disabled={valid.length === 0}
            >
              <div className="bf-starter-head">
                <div className="bf-starter-title">{path.title}</div>
                <div className="bf-starter-count">{valid.length} patterns</div>
              </div>
              <div className="bf-starter-sub">{path.subtitle}</div>
              <p className="bf-starter-context">{path.context}</p>
              {at > 0 && at < valid.length && (
                <div className="bf-starter-progress">
                  <span>step {at + 1} of {valid.length}</span>
                </div>
              )}
            </button>
          );
        })}
      </div>
    );
  }

  return (
    <div className="bf-starter-strip-wrap">
      <button
        className="bf-starter-arrow"
        onClick={() => scrollByChips(-1)}
        disabled={!canPrev}
        aria-label="Scroll starter paths left"
        type="button"
      >
        ‹
      </button>
      <div className="bf-starter-strip" ref={stripRef}>
        {STARTER_PATHS.map((path) => {
          const valid = path.patternIds.filter((id) => known.has(id));
          const at = progress[path.id] ?? 0;
          return (
            <button
              key={path.id}
              className="bf-starter-chip"
              onClick={() => onPickPath(path)}
              type="button"
              disabled={valid.length === 0}
            >
              <div className="bf-starter-head">
                <div className="bf-starter-title">{path.title}</div>
                <div className="bf-starter-count">{valid.length}</div>
              </div>
              <div className="bf-starter-sub">{path.subtitle}</div>
              {at > 0 && at < valid.length && (
                <div className="bf-starter-progress">
                  <span>step {at + 1} of {valid.length}</span>
                </div>
              )}
            </button>
          );
        })}
      </div>
      <button
        className="bf-starter-arrow"
        onClick={() => scrollByChips(1)}
        disabled={!canNext}
        aria-label="Scroll starter paths right"
        type="button"
      >
        ›
      </button>
    </div>
  );
}
