import { trackMeta, type Pattern, type VoiceId } from '../patterns/types';
import { GROUP_COLORS } from './visual-helpers';

interface Props {
  pattern: Pattern;
  cursors: Record<string, number>;
  onToggle?: (track: VoiceId, step: number) => void;
}

export function PillGrid({ pattern, cursors, onToggle }: Props) {
  const tracks = Object.keys(pattern.tracks) as VoiceId[];
  const groups = pattern.grouping;
  const mainSteps = pattern.steps;

  const groupStarts: number[] = [];
  let acc = 0;
  groups.forEach((g) => { groupStarts.push(acc); acc += g; });

  return (
    <div className="bf-pill">
      {tracks.map((tr) => {
        const td = pattern.tracks[tr]!;
        const meta = trackMeta(td, mainSteps);
        const isPoly = meta.subdivisions !== mainSteps;
        const cursor = cursors[tr] ?? -1;

        // Polyrhythm tracks get a single uniform pill — the grouping doesn't apply.
        if (isPoly) {
          return (
            <div key={tr} className="bf-pill-row poly">
              <div className="bf-pill-label">
                {tr}
                <span className="bf-poly-tag">{meta.subdivisions}</span>
              </div>
              <div className="bf-pill-groups">
                <div
                  className="bf-pill-group"
                  style={{ borderColor: GROUP_COLORS[2] }}
                >
                  {Array.from({ length: meta.subdivisions }).map((_, s) => {
                    const localIdx = s % meta.cycle;
                    const vel = meta.pattern[localIdx];
                    const color = GROUP_COLORS[s % GROUP_COLORS.length];
                    const active = vel > 0;
                    const isCur = s === cursor;
                    return (
                      <button
                        key={s}
                        type="button"
                        className={`bf-cell ${active ? 'on' : ''} ${isCur ? 'cur' : ''}`}
                        style={{
                          background: active ? color : 'transparent',
                          borderColor: color,
                          opacity: active ? (vel === 2 ? 1 : 0.5) : 0.9,
                        }}
                        onClick={() => onToggle?.(tr, localIdx)}
                        aria-label={`${tr} step ${s + 1} velocity ${vel}`}
                        aria-pressed={active}
                      />
                    );
                  })}
                </div>
              </div>
            </div>
          );
        }

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
                    const localIdx = s % meta.cycle;
                    const vel = meta.pattern[localIdx];
                    const color = GROUP_COLORS[gi % GROUP_COLORS.length];
                    const active = vel > 0;
                    const isCur = s === cursor;
                    return (
                      <button
                        key={i}
                        type="button"
                        className={`bf-cell ${active ? 'on' : ''} ${isCur ? 'cur' : ''}`}
                        style={{
                          background: active ? color : 'transparent',
                          borderColor: color,
                          opacity: active ? (vel === 2 ? 1 : 0.5) : 0.9,
                        }}
                        onClick={() => onToggle?.(tr, localIdx)}
                        aria-label={`${tr} step ${s + 1} velocity ${vel}`}
                        aria-pressed={active}
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
