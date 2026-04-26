// Generic pill-grid sequencer. Each row's cells are clustered into
// pills along the additive grouping (e.g. 7/8 [2,2,3] → three pill
// clusters of 2, 2, 3 cells), so the rhythmic structure reads as
// punctuated phrases instead of an undifferentiated row. Polyrhythm
// rows render as one uniform pill (the grouping doesn't apply at
// their rate).
//
// Engine-agnostic: takes positional rows + grouping, mirrors the
// shape of CircularGrid + StepGrid so all three views drive off the
// same state.

import { GROUP_COLORS } from './visual-helpers';

export interface PillGridRow {
  label: string;
  /** Velocities per step. Length defines this row's subdivisions. */
  cells: number[];
  /** Audible step on this row, or -1 if none. */
  cursor: number;
}

interface Props {
  /** Main-grid step count (== sum(grouping)). */
  stepsPerBar: number;
  /** Additive grouping for non-poly rows. */
  grouping: number[];
  /** One row per track. Polyrhythm rows are detected by row.cells.length
   *  ≠ stepsPerBar. */
  rows: PillGridRow[];
  onToggle?: (rowIdx: number, stepIdx: number) => void;
}

export function PillGrid({ stepsPerBar, grouping, rows, onToggle }: Props) {
  const groupStarts: number[] = [];
  let acc = 0;
  grouping.forEach((g) => { groupStarts.push(acc); acc += g; });

  return (
    <div className="bf-pill">
      {rows.map((row, ri) => {
        const ringSteps = row.cells.length;
        const isPoly = ringSteps !== stepsPerBar;

        // Polyrhythm rows: one uniform pill — the canonical grouping
        // doesn't apply at their rate. Cycling group hues per cell so
        // they visually contrast the main-grid rows below.
        if (isPoly) {
          return (
            <div key={ri} className="bf-pill-row poly">
              <div className="bf-pill-label">
                {row.label}
                <span className="bf-poly-tag">{ringSteps}</span>
              </div>
              <div className="bf-pill-groups">
                <div
                  className="bf-pill-group"
                  style={{ borderColor: GROUP_COLORS[2] }}
                >
                  {Array.from({ length: ringSteps }).map((_, s) => {
                    const vel = row.cells[s] ?? 0;
                    const color = GROUP_COLORS[s % GROUP_COLORS.length];
                    const active = vel > 0;
                    const isCur = s === row.cursor;
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
                        onClick={() => onToggle?.(ri, s)}
                        aria-label={`${row.label} step ${s + 1} velocity ${vel}`}
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
          <div key={ri} className="bf-pill-row">
            <div className="bf-pill-label">{row.label}</div>
            <div className="bf-pill-groups">
              {grouping.map((glen, gi) => (
                <div
                  key={gi}
                  className="bf-pill-group"
                  style={{ borderColor: GROUP_COLORS[gi % GROUP_COLORS.length] }}
                >
                  {Array.from({ length: glen }).map((_, i) => {
                    const s = groupStarts[gi] + i;
                    const vel = row.cells[s] ?? 0;
                    const color = GROUP_COLORS[gi % GROUP_COLORS.length];
                    const active = vel > 0;
                    const isCur = s === row.cursor;
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
                        onClick={() => onToggle?.(ri, s)}
                        aria-label={`${row.label} step ${s + 1} velocity ${vel}`}
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
