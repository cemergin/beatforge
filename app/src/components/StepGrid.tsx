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
  /** Steps for this row. Length = stepsPerBar. */
  steps: SoundStep[];
}

interface Props {
  rows: StepGridRow[];
  /** Audible step (-1 if not playing). Highlights the column. */
  currentStep: number;
  /** stepsPerBar — pulled from rows[0].steps.length but passed explicitly
   *  so the column count is stable across renders even when `rows` is
   *  briefly empty (e.g. during clear-all). */
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
  currentStep,
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
      {rows.map((row, ri) => (
        <div key={ri} className="bf-stepgrid-row">
          <div className="bf-stepgrid-label" title={row.label}>
            {row.short ?? row.label.slice(0, 3)}
          </div>
          <div className="bf-stepgrid-cells">
            {Array.from({ length: stepsPerBar }, (_, si) => {
              const v = row.steps[si] ?? 0;
              const gi = groupIndexForStep(si, groups);
              const isHead = isGroupDownbeat(si, groups);
              const isCurrent = si === currentStep;
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
                  // --grp-color drives both the idle tint and the active
                  // fill — see app.css. Inline so the same component
                  // works against any --grp-N palette without per-N CSS.
                  style={{ '--grp-color': groupColor } as React.CSSProperties}
                  aria-label={`${row.label} step ${si + 1}: ${v === 0 ? 'off' : v === 1 ? 'on' : 'accent'}`}
                  onClick={() => onToggleCell(ri, si)}
                />
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}
