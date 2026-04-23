// Studio's edit-mode grid — bigger, more clickable cells than Practice's
// display grid. Single track per row. Click cell → cycle 0→2→1→0.
// Click "×" on the track label → remove voice.
// Click the subdivisions badge → cycle the track's step count (the
// polyrhythm unlock).

import { useState } from 'react';
import type { Pattern, Velocity, VoiceId } from '../../patterns/types';
import { trackMeta } from '../../patterns/types';
import { GROUP_COLORS, groupIndexForStep, isGroupDownbeat } from '../../components/visual-helpers';
import { VOICE_LABELS } from './presets';

const SUBDIVISION_OPTIONS = [3, 4, 5, 6, 7, 8, 9, 12, 16];

interface Props {
  pattern: Pattern;
  cursors: Record<string, number>;
  onToggleCell: (track: VoiceId, step: number) => void;
  onRemoveTrack?: (track: VoiceId) => void;
  onSetSubdivisions?: (track: VoiceId, subdivisions: number) => void;
}

export function StudioGrid({
  pattern, cursors, onToggleCell, onRemoveTrack, onSetSubdivisions,
}: Props) {
  const tracks = Object.keys(pattern.tracks) as VoiceId[];
  const mainSteps = pattern.steps;
  const [openSubMenu, setOpenSubMenu] = useState<VoiceId | null>(null);

  if (tracks.length === 0) {
    return (
      <div className="bf-studio-empty-grid">
        No voices yet. Add one from the voice palette below.
      </div>
    );
  }

  return (
    <div className="bf-studio-grid">
      <div
        className="bf-studio-row bf-studio-headrow"
        style={{ '--steps': mainSteps } as React.CSSProperties}
      >
        <div className="bf-studio-rowlabel" />
        {Array.from({ length: mainSteps }).map((_, s) => {
          const gi = groupIndexForStep(s, pattern.grouping);
          const down = isGroupDownbeat(s, pattern.grouping);
          return (
            <div
              key={s}
              className={`bf-studio-headcell ${down ? 'down' : ''}`}
              style={{ color: GROUP_COLORS[gi % GROUP_COLORS.length] }}
            >
              {down ? s + 1 : '·'}
            </div>
          );
        })}
      </div>

      {tracks.map((tr) => {
        const td = pattern.tracks[tr];
        if (!td) return null;
        const meta = trackMeta(td, mainSteps);
        const cursor = cursors[tr] ?? -1;
        const cellCount = meta.subdivisions;
        const isPoly = meta.subdivisions !== mainSteps;
        const arr: Velocity[] = meta.pattern;
        return (
          <div
            key={tr}
            className={`bf-studio-row ${isPoly ? 'poly' : ''}`}
            style={{ '--steps': cellCount } as React.CSSProperties}
          >
            <div className="bf-studio-rowlabel-wrap">
              <button
                className="bf-studio-rowlabel bf-studio-rowlabel-btn"
                onClick={() => onRemoveTrack?.(tr)}
                title={`Remove ${VOICE_LABELS[tr]}`}
                type="button"
              >
                <span className="bf-studio-rowlabel-code">{tr}</span>
                <span className="bf-studio-rowlabel-full">{VOICE_LABELS[tr]}</span>
              </button>
              {onSetSubdivisions && (
                <button
                  className={`bf-studio-sub-badge ${isPoly ? 'poly' : ''}`}
                  onClick={() => setOpenSubMenu((cur) => cur === tr ? null : tr)}
                  title="Change subdivisions (polyrhythm)"
                  type="button"
                >
                  ÷{meta.subdivisions}{isPoly && ` :${mainSteps}`}
                </button>
              )}
              {openSubMenu === tr && onSetSubdivisions && (
                <div className="bf-studio-sub-menu">
                  <button
                    className={meta.subdivisions === mainSteps ? 'on' : ''}
                    onClick={() => { onSetSubdivisions(tr, mainSteps); setOpenSubMenu(null); }}
                    type="button"
                  >
                    main (÷{mainSteps})
                  </button>
                  {SUBDIVISION_OPTIONS.filter((n) => n !== mainSteps).map((n) => (
                    <button
                      key={n}
                      className={meta.subdivisions === n ? 'on' : ''}
                      onClick={() => { onSetSubdivisions(tr, n); setOpenSubMenu(null); }}
                      type="button"
                    >
                      ÷{n}{mainSteps > 0 && ` :${mainSteps}`}
                    </button>
                  ))}
                </div>
              )}
            </div>
            {Array.from({ length: cellCount }).map((_, s) => {
              const localIdx = s % meta.cycle;
              const vel = arr[localIdx] ?? 0;
              const gi = isPoly
                ? s % GROUP_COLORS.length
                : groupIndexForStep(s, pattern.grouping);
              const color = GROUP_COLORS[gi % GROUP_COLORS.length];
              const active = vel > 0;
              const isCur = s === cursor;
              return (
                <button
                  key={s}
                  className={`bf-studio-cell ${active ? 'on' : ''} ${isCur ? 'cur' : ''} v${vel}`}
                  style={{
                    background: active ? color : 'transparent',
                    borderColor: color,
                    opacity: active ? (vel === 2 ? 1 : 0.55) : 0.9,
                  }}
                  onClick={() => onToggleCell(tr, localIdx)}
                  type="button"
                  aria-label={`${tr} step ${s + 1} velocity ${vel}`}
                />
              );
            })}
          </div>
        );
      })}
    </div>
  );
}
