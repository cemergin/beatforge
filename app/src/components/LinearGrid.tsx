import type { Pattern, VoiceId } from '../patterns/types';
import { GROUP_COLORS, groupIndexForStep, isGroupDownbeat } from './visual-helpers';

interface Props {
  pattern: Pattern;
  cursors: Record<string, number>;
  onToggle?: (track: VoiceId, step: number) => void;
}

export function LinearGrid({ pattern, cursors, onToggle }: Props) {
  const tracks = Object.keys(pattern.tracks) as VoiceId[];
  const steps = pattern.steps;
  const styleVar = { '--steps': steps } as React.CSSProperties;

  return (
    <div className="bf-linear" style={styleVar}>
      <div className="bf-linear-head" style={styleVar}>
        <div className="bf-linear-label" />
        {Array.from({ length: steps }).map((_, s) => {
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
        const isPoly = !Array.isArray(td);
        const cycle = isPoly ? td.cycle : td.length;
        const data = isPoly ? td.pattern : td;
        const cursor = cursors[tr] !== undefined ? (cursors[tr] + cycle - 1) % cycle : 0;
        return (
          <div key={tr} className="bf-linear-row" style={styleVar}>
            <div className="bf-linear-label">{tr}</div>
            {Array.from({ length: steps }).map((_, s) => {
              const localIdx = isPoly ? s % cycle : s;
              const vel = data[localIdx];
              const gi = isPoly ? localIdx % GROUP_COLORS.length : groupIndexForStep(s, pattern.grouping);
              const color = GROUP_COLORS[gi % GROUP_COLORS.length];
              const active = vel > 0;
              const isCur = isPoly ? localIdx === cursor : s === cursor;
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
