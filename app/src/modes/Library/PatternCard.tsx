import { memo } from 'react';
import type { Pattern } from '../../patterns/types';
import { BeatDots } from '../../components/BeatDots';
import { naturalTempo } from '../../audio/tempo';
import { REGION_BY_ID } from './regions';

interface Props {
  pattern: Pattern;
  starred?: boolean;
  onClick?: (id: string) => void;
  onToggleStar?: (id: string) => void;
}

// Memoized — Library re-renders on every keystroke in search /
// filter chip click / page change. Without React.memo + stable
// callback identities, all 36 cards re-render every time even
// though only one or two might actually need to. Library passes
// stable useCallback'd onClick + onToggleStar.
function PatternCardImpl({ pattern, starred, onClick, onToggleStar }: Props) {
  const region = REGION_BY_ID[pattern.region];
  const tempo = naturalTempo(pattern.bpm.default, pattern.stepUnit, pattern.timeSig);
  return (
    <button
      className="bf-lib-tile"
      onClick={() => onClick?.(pattern.id)}
      type="button"
    >
      <div className="bf-lib-tile-head">
        <div>
          <div className="bf-lib-tile-name">{pattern.name}</div>
          <div className="bf-lib-tile-origin">{pattern.origin}</div>
        </div>
        <div className="bf-lib-tile-badges">
          {onToggleStar && (
            <span
              role="button"
              tabIndex={0}
              className={`bf-star ${starred ? 'on' : ''}`}
              onClick={(e) => {
                e.stopPropagation();
                onToggleStar(pattern.id);
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  e.stopPropagation();
                  onToggleStar(pattern.id);
                }
              }}
              title={starred ? 'Unstar' : 'Star'}
              aria-label={starred ? 'Unstar pattern' : 'Star pattern'}
            >
              {starred ? '★' : '☆'}
            </span>
          )}
        </div>
      </div>

      <div className="bf-lib-tile-dots">
        <BeatDots grouping={pattern.grouping} currentStep={-1} size={10} />
      </div>

      <div className="bf-lib-tile-meta">
        <span className="bf-meta-badge">{pattern.timeSig}</span>
        <span className="bf-meta-badge alt">{pattern.grouping.join('+')}</span>
        {pattern.poly && <span className="bf-poly-badge">poly</span>}
      </div>
      <div className="bf-lib-tile-meta">
        <span className="bf-lib-bpm">{tempo.glyph}={tempo.value}</span>
        <span
          className="bf-lib-region-chip"
          style={{ color: region?.color }}
        >
          {region?.short ?? pattern.region}
        </span>
        <span className="bf-meta-badge alt">{pattern.defaultKit}</span>
      </div>
    </button>
  );
}

export const PatternCard = memo(PatternCardImpl);
