// Generic step-grid sequencer view. Decoupled from Pattern/VoiceId so
// Studio AND Sound can share it once the engines unify. Each row is a
// channel; each cell cycles 0 (off) → 1 (on) → 2 (accent) → 0.
//
// Visual coloring follows `grouping`: each additive group (e.g. 2+2+3
// for 7/8) gets one of the --grp-N hues, and the first cell of each
// group is marked as a downbeat. Grouping is the project's signature
// rhythmic feature — same beat grouping helpers Studio uses.
//
// The visual cursor (`currentStep`) should come from the engine's
// audibleStep() — last-scheduled cells are 300ms in Web Audio's future,
// reading them would put the highlight ahead of what the user hears.

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
  /** Cycles the cell value 0 → 1 → 2 → 0. */
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
    <div
      className="bf-stepgrid"
      style={{ '--steps': stepsPerBar } as React.CSSProperties}
    >
      {/* Head row: beat-number labels above each MAIN-grid column.
          Downbeats show their beat number (group index + 1); off-beats
          show a dot. Color-coded so users can scan the bar at a glance.
          Polyrhythm rows render their own column count below. */}
      <div className="bf-stepgrid-row bf-stepgrid-headrow">
        <div className="bf-stepgrid-label" />
        <div className="bf-stepgrid-cells">
          {Array.from({ length: stepsPerBar }, (_, si) => {
            const gi = groupIndexForStep(si, groups);
            const isHead = isGroupDownbeat(si, groups);
            const isCurrent = si === headCursor;
            const groupColor = GROUP_COLORS[gi % GROUP_COLORS.length];
            return (
              <div
                key={si}
                className={`bf-stepgrid-headcell ${isHead ? 'down' : ''} ${isCurrent ? 'cur' : ''}`}
                style={{ '--grp-color': groupColor } as React.CSSProperties}
              >
                {isHead ? gi + 1 : '·'}
              </div>
            );
          })}
        </div>
      </div>

      {rows.map((row, ri) => {
        const ringSteps = row.steps.length;
        const isPoly = ringSteps !== stepsPerBar;
        return (
          <div
            key={ri}
            className={`bf-stepgrid-row ${isPoly ? 'poly' : ''}`}
            // Override --steps for the row's grid so poly rows render
            // their own column count, evenly spread across the same
            // visual width as the main grid.
            style={{ '--steps': ringSteps } as React.CSSProperties}
          >
            <div className="bf-stepgrid-label" title={row.label}>
              {row.short ?? row.label.slice(0, 3)}
              {isPoly && <span className="bf-stepgrid-poly-tag">·{ringSteps}</span>}
            </div>
            <div className="bf-stepgrid-cells">
              {Array.from({ length: ringSteps }, (_, si) => {
                const v = row.steps[si] ?? 0;
                // For poly rows the head/group concept is moot — they
                // tick at their own rate. Color them with cycling
                // group hues so they visually contrast the main grid.
                const gi = isPoly ? si % GROUP_COLORS.length : groupIndexForStep(si, groups);
                const isHead = isPoly ? si === 0 : isGroupDownbeat(si, groups);
                const isCurrent = si === row.cursor;
                const cls = [
                  'bf-stepgrid-cell',
                  isHead ? 'head' : '',
                  v === 1 ? 'on' : v === 2 ? 'accent' : '',
                  isCurrent ? 'cur' : '',
                ].filter(Boolean).join(' ');
                const groupColor = GROUP_COLORS[gi % GROUP_COLORS.length];
                return (
                  <button
                    key={si}
                    type="button"
                    className={cls}
                    style={{ '--grp-color': groupColor } as React.CSSProperties}
                    aria-label={`${row.label} step ${si + 1}: ${v === 0 ? 'off' : v === 1 ? 'on' : 'accent'}`}
                    onClick={() => onToggleCell(ri, si)}
                  />
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}
