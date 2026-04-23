import type { Pattern, RegionId } from '../../patterns/types';
import { REGIONS } from './regions';

interface Props {
  patterns: Pattern[];
  onPickRegion: (id: RegionId) => void;
}

export function WorldMap({ patterns, onPickRegion }: Props) {
  const counts = patterns.reduce<Record<string, number>>((acc, p) => {
    acc[p.region] = (acc[p.region] ?? 0) + 1;
    return acc;
  }, {});

  return (
    <div className="bf-worldmap">
      {REGIONS.map((r) => {
        const count = counts[r.id] ?? 0;
        const disabled = count === 0;
        return (
          <button
            key={r.id}
            className={`bf-wm-blob ${disabled ? 'is-empty' : ''}`}
            style={{
              background: `color-mix(in oklab, ${r.color} 18%, var(--bg-2))`,
              borderColor: r.color,
            }}
            disabled={disabled}
            onClick={() => onPickRegion(r.id)}
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
  );
}
