import { trackMeta, type Pattern, type VoiceId } from '../patterns/types';
import { GROUP_COLORS, groupIndexForStep, isGroupDownbeat } from './visual-helpers';

interface Props {
  pattern: Pattern;
  cursors: Record<string, number>;
  onToggle?: (track: VoiceId, step: number) => void;
}

export function LinearGrid({ pattern, cursors, onToggle }: Props) {
  const tracks = Object.keys(pattern.tracks) as VoiceId[];
  const mainSteps = pattern.steps;

  return (
    <div className="bf-linear">
      <div
        className="bf-linear-head"
        style={{ '--steps': mainSteps } as React.CSSProperties}
      >
        <div className="bf-linear-label" />
        {Array.from({ length: mainSteps }).map((_, s) => {
          const gi = groupIndexForStep(s, pattern.grouping);
          const isDown = isGroupDownbeat(s, pattern.grouping);
          return (
            <div
              key={s}
              className={`bf-linear-head-cell ${isDown ? 'down' : ''}`}
              style={{ color: GROUP_COLORS[gi % GROUP_COLORS.length] }}
            >
              <span>{isDown ? Math.floor(s / Math.max(1, pattern.grouping[0])) + 1 : '·'}</span>
            </div>
          );
        })}
      </div>
      {tracks.map((tr) => {
        const td = pattern.tracks[tr]!;
        const meta = trackMeta(td, mainSteps);
        const isPoly = meta.subdivisions !== mainSteps;
        const cursor = cursors[tr] ?? -1;
        const cellCount = meta.subdivisions;

        return (
          <div
            key={tr}
            className={`bf-linear-row ${isPoly ? 'poly' : ''}`}
            style={{ '--steps': cellCount } as React.CSSProperties}
          >
            <div className="bf-linear-label">
              {tr}
              {isPoly && <span className="bf-poly-tag">{meta.subdivisions}</span>}
            </div>
            {Array.from({ length: cellCount }).map((_, s) => {
              const localIdx = s % meta.cycle;
              const vel = meta.pattern[localIdx];
              const gi = isPoly
                ? s % GROUP_COLORS.length
                : groupIndexForStep(s, pattern.grouping);
              const color = GROUP_COLORS[gi % GROUP_COLORS.length];
              const active = vel > 0;
              const isCur = s === cursor;
              return (
                <div
                  key={s}
                  className={`bf-cell ${active ? 'on' : ''} ${isCur ? 'cur' : ''}`}
                  style={{
                    background: active ? color : 'transparent',
                    borderColor: color,
                    opacity: active ? (vel === 2 ? 1 : 0.5) : 0.9,
                  }}
                  onClick={() => onToggle?.(tr, localIdx)}
                />
              );
            })}
          </div>
        );
      })}
    </div>
  );
}
