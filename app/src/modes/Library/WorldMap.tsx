import type { Pattern, RegionId } from '../../patterns/types';
import { useLang } from '../../i18n';
import { REGIONS, localizedRegion } from './regions';

interface Props {
  patterns: Pattern[];
  previewId: RegionId | null;
  setPreviewId: (id: RegionId | null) => void;
  onPickRegion: (id: RegionId) => void;
  compact?: boolean;
}

export function WorldMap({ patterns, previewId, setPreviewId, onPickRegion, compact }: Props) {
  const { lang } = useLang();
  const counts = patterns.reduce<Record<string, number>>((acc, p) => {
    acc[p.region] = (acc[p.region] ?? 0) + 1;
    return acc;
  }, {});

  const handlePick = (id: RegionId) => {
    setPreviewId(id);
    onPickRegion(id);
  };

  return (
    <div className={`bf-worldmap-wrap ${compact ? 'is-compact' : ''}`}>
      <div className={`bf-worldmap ${compact ? 'is-compact' : ''}`}>
        {REGIONS.map((r) => {
          const count = counts[r.id] ?? 0;
          const disabled = count === 0;
          const active = previewId === r.id;
          const labels = localizedRegion(r, lang);
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
              title={disabled ? `${labels.label} — no patterns yet` : `${labels.label}: ${count} patterns`}
              type="button"
            >
              <span className="bf-wm-name" style={{ color: r.color }}>
                {labels.label}
              </span>
              <span className="bf-wm-count">{count}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
