// Generic step-grid sequencer view, visually identical to LinearGrid.
// Decoupled from Pattern/VoiceId so Studio AND Sound can share it once
// the engines unify. Each row is a channel; each cell cycles
// 0 → 2 (strong) → 1 (weak/ghost) → 0 (set in the parent's handler).
//
// Cells render with the shared .bf-cell + inline color styles (same as
// LinearGrid + PillGrid): hollow group-colored outline when off,
// filled when on, opacity 0.5 for ghost vs 1.0 for accent. The visual
// language is consistent at every zoom level — the strip-head
// mini-cells use the same idle/on/accent treatment in miniature.
//
// The visual cursor (`headCursor` / per-row `cursor`) should come from
// the engine's audibleStep — last-scheduled cells are 300ms in Web
// Audio's future, reading them would put the highlight ahead of what
// the user hears.

import type { SoundStep } from '../audio/runtime/sound-engine';
import { GROUP_COLORS, groupIndexForStep, isGroupDownbeat } from './visual-helpers';

export interface StepGridRow {
  label: string;
  /** 3-char abbreviation shown when horizontal space is tight. */
  short?: string;
  /** Steps for this row. Length defines the row's subdivision count
   *  — when ≠ stepsPerBar, the row is polyrhythmic and renders with
   *  a different column count than the main grid head row. */
  steps: SoundStep[];
  /** Per-row playhead (-1 if not playing). For non-poly rows this
   *  matches `headCursor`; for poly rows it's that row's own cursor. */
  cursor: number;
}

interface Props {
  rows: StepGridRow[];
  /** Audible step on the MAIN grid — drives the head row's column
   *  highlight. Per-row body cells highlight from row.cursor. */
  headCursor: number;
  /** stepsPerBar — explicit so the head row's column count stays
   *  stable across renders. Per-row step count comes from row.steps.length. */
  stepsPerBar: number;
  /** Additive grouping (e.g. [2,2,3] for 7/8). Sum should equal
   *  stepsPerBar; when it doesn't, trailing steps fall into the last
   *  group via groupIndexForStep's fall-through. Defaults to [stepsPerBar]
   *  (one big group, no internal coloring) when omitted. */
  grouping?: number[];
  /** Cycles the cell value 0 → 2 → 1 → 0 (strong first). */
  onToggleCell: (rowIdx: number, stepIdx: number) => void;
}

export function StepGrid({
  rows,
  headCursor,
  stepsPerBar,
  grouping,
  onToggleCell,
}: Props) {
  const groups = grouping && grouping.length > 0 ? grouping : [stepsPerBar];
  return (
    <div className="bf-linear bf-stepgrid">
      <div
        className="bf-linear-head"
        style={{ '--steps': stepsPerBar } as React.CSSProperties}
      >
        <div className="bf-linear-label" />
        {Array.from({ length: stepsPerBar }, (_, s) => {
          const gi = groupIndexForStep(s, groups);
          const isDown = isGroupDownbeat(s, groups);
          const isCur = s === headCursor;
          const color = GROUP_COLORS[gi % GROUP_COLORS.length];
          return (
            <div
              key={s}
              className={`bf-linear-head-cell ${isDown ? 'down' : ''} ${isCur ? 'cur' : ''}`}
              style={{ color }}
            >
              <span>{isDown ? gi + 1 : '·'}</span>
            </div>
          );
        })}
      </div>

      {rows.map((row, ri) => {
        const ringSteps = row.steps.length;
        const isPoly = ringSteps !== stepsPerBar;
        return (
          <div
            key={ri}
            className={`bf-linear-row ${isPoly ? 'poly' : ''}`}
            style={{ '--steps': ringSteps } as React.CSSProperties}
          >
            <div className="bf-linear-label" title={row.label}>
              {row.short ?? row.label.slice(0, 3)}
              {isPoly && <span className="bf-poly-tag">{ringSteps}</span>}
            </div>
            {Array.from({ length: ringSteps }, (_, s) => {
              const v = row.steps[s] ?? 0;
              // Polyrhythm rows get rotating group hues so they
              // visually contrast main-rate rows; non-poly rows track
              // the canonical grouping.
              const gi = isPoly
                ? s % GROUP_COLORS.length
                : groupIndexForStep(s, groups);
              const color = GROUP_COLORS[gi % GROUP_COLORS.length];
              const active = v > 0;
              const isCur = s === row.cursor;
              return (
                <button
                  key={s}
                  type="button"
                  className={`bf-cell ${active ? 'on' : ''} ${isCur ? 'cur' : ''}`}
                  style={{
                    background: active ? color : 'transparent',
                    borderColor: color,
                    opacity: active ? (v === 2 ? 1 : 0.5) : 0.9,
                  }}
                  aria-label={`${row.label} step ${s + 1}: ${v === 0 ? 'off' : v === 1 ? 'on' : 'accent'}`}
                  aria-pressed={active}
                  onClick={() => onToggleCell(ri, s)}
                />
              );
            })}
          </div>
        );
      })}
    </div>
  );
}
