import type { Pattern, VoiceId } from '../patterns/types';
import { GROUP_COLORS } from './visual-helpers';

interface Props {
  pattern: Pattern;
  cursors: Record<string, number>;
  onToggle?: (track: VoiceId, step: number) => void;
}

export function PillGrid({ pattern, cursors, onToggle }: Props) {
  const tracks = Object.keys(pattern.tracks) as VoiceId[];
  const groups = pattern.grouping;

  const groupStarts: number[] = [];
  let acc = 0;
  groups.forEach((g) => { groupStarts.push(acc); acc += g; });

  return (
    <div className="bf-pill">
      {tracks.map((tr) => {
        const td = pattern.tracks[tr]!;
        const isPoly = !Array.isArray(td);
        const cycle = isPoly ? td.cycle : td.length;
        const data = isPoly ? td.pattern : td;
        const cursor = cursors[tr] !== undefined ? (cursors[tr] + cycle - 1) % cycle : 0;
        return (
          <div key={tr} className="bf-pill-row">
            <div className="bf-pill-label">{tr}</div>
            <div className="bf-pill-groups">
              {groups.map((glen, gi) => (
                <div
                  key={gi}
                  className="bf-pill-group"
                  style={{ borderColor: GROUP_COLORS[gi % GROUP_COLORS.length] }}
                >
                  {Array.from({ length: glen }).map((_, i) => {
                    const s = groupStarts[gi] + i;
                    const localIdx = isPoly ? s % cycle : s;
                    const vel = data[localIdx];
                    const color = GROUP_COLORS[gi % GROUP_COLORS.length];
                    const active = vel > 0;
                    const isCur = isPoly ? localIdx === cursor : s === cursor;
                    return (
                      <div
                        key={i}
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
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}
