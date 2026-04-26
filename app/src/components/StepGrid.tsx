// Generic step-grid sequencer view. Decoupled from Pattern/VoiceId so
// Studio AND Sound can share it once the engines unify. Each row is a
// channel; each cell cycles 0 (off) → 1 (on) → 2 (accent) → 0.
//
// The visual cursor (`currentStep`) should come from the engine's
// audibleStep() — last-scheduled cells are 300ms in Web Audio's future,
// reading them would put the highlight ahead of what the user hears.

import type { SoundStep } from '../audio/runtime/sound-engine';

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
  /** Cycles the cell value 0 → 1 → 2 → 0. */
  onToggleCell: (rowIdx: number, stepIdx: number) => void;
}

export function StepGrid({ rows, currentStep, stepsPerBar, onToggleCell }: Props) {
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
              // Beat group every 4 steps for visual rhythm (assumes 4/4
              // — when Studio adopts this we can pass `grouping` instead).
              const beatGroup = Math.floor(si / 4) % 2 === 0 ? 'a' : 'b';
              const isHead = si % 4 === 0;
              const isCurrent = si === currentStep;
              const cls = [
                'bf-stepgrid-cell',
                `g-${beatGroup}`,
                isHead ? 'head' : '',
                v === 1 ? 'on' : v === 2 ? 'accent' : '',
                isCurrent ? 'cur' : '',
              ].filter(Boolean).join(' ');
              return (
                <button
                  key={si}
                  type="button"
                  className={cls}
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
