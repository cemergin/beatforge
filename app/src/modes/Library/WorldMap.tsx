import { useState } from 'react';
import type { Pattern, RegionId } from '../../patterns/types';
import { REGIONS, REGION_BY_ID } from './regions';

interface Props {
  patterns: Pattern[];
  onPickRegion: (id: RegionId) => void;
}

export function WorldMap({ patterns, onPickRegion }: Props) {
  const counts = patterns.reduce<Record<string, number>>((acc, p) => {
    acc[p.region] = (acc[p.region] ?? 0) + 1;
    return acc;
  }, {});

  // Local preview state — the intro banner pinned above the results grid.
  // Null means "no region previewed". Separate from filter state so users
  // can dismiss the banner without clearing their filter.
  const [previewId, setPreviewId] = useState<RegionId | null>(null);

  const handlePick = (id: RegionId) => {
    setPreviewId(id);
    onPickRegion(id);
  };

  const preview = previewId ? REGION_BY_ID[previewId] : null;

  return (
    <div className="bf-worldmap-wrap">
      <div className="bf-worldmap">
        {REGIONS.map((r) => {
          const count = counts[r.id] ?? 0;
          const disabled = count === 0;
          const active = previewId === r.id;
          return (
            <button
              key={r.id}
              className={`bf-wm-blob ${disabled ? 'is-empty' : ''} ${active ? 'is-active' : ''}`}
              style={{
                background: `color-mix(in oklab, ${r.color} 18%, var(--bg-2))`,
                borderColor: r.color,
              }}
              disabled={disabled}
              onClick={() => handlePick(r.id)}
              title={disabled ? `${r.label} — no patterns yet` : `${r.label}: ${count} patterns`}
              type="button"
            >
              <span className="bf-wm-name" style={{ color: r.color }}>
                {r.label}
              </span>
              <span className="bf-wm-count">{count}</span>
            </button>
          );
        })}
      </div>

      {preview && (
        <aside
          className="bf-region-intro-card"
          style={{ borderColor: preview.color }}
          aria-live="polite"
        >
          <div className="bf-region-intro-head">
            <h3
              className="bf-region-intro-title"
              style={{ color: preview.color }}
            >
              {preview.label}
            </h3>
            <button
              className="bf-region-intro-close"
              onClick={() => setPreviewId(null)}
              aria-label="Dismiss region intro"
              type="button"
            >
              ×
            </button>
          </div>
          <p className="bf-region-intro-body">{preview.intro}</p>
          {(preview.keyRhythms?.length || preview.instruments?.length) && (
            <dl className="bf-region-intro-meta">
              {preview.keyRhythms && preview.keyRhythms.length > 0 && (
                <div className="bf-region-intro-row">
                  <dt>signature rhythms</dt>
                  <dd>{preview.keyRhythms.join(' · ')}</dd>
                </div>
              )}
              {preview.instruments && preview.instruments.length > 0 && (
                <div className="bf-region-intro-row">
                  <dt>characteristic instruments</dt>
                  <dd>{preview.instruments.join(' · ')}</dd>
                </div>
              )}
            </dl>
          )}
        </aside>
      )}
    </div>
  );
}
