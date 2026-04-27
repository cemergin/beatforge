// Validate-before-save modal. Shows a summary of the draft + required fields.

import { useMemo } from 'react';
import type { Pattern, VoiceId } from '../../patterns/types';
import { trackMeta } from '../../patterns/types';
import { naturalTempo, parseTimeSigDenom, stepToNaturalBpm } from '../../audio/tempo';

interface Props {
  draft: Pattern;
  onCancel: () => void;
  onConfirm: () => void;
}

export function SaveDialog({ draft, onCancel, onConfirm }: Props) {
  const errors = useMemo(() => {
    const e: string[] = [];
    if (!draft.name.trim()) e.push('Name is required.');
    const sum = draft.grouping.reduce((a, b) => a + b, 0);
    if (sum !== draft.steps) e.push(`Grouping sums to ${sum}, expected ${draft.steps}.`);
    const hasAnyHit = (Object.keys(draft.tracks) as VoiceId[]).some((tr) => {
      const td = draft.tracks[tr];
      if (!td) return false;
      const m = trackMeta(td, draft.steps);
      return m.pattern.some((v) => v > 0);
    });
    if (!hasAnyHit) e.push('At least one track must have a hit.');
    if (Object.keys(draft.tracks).length === 0) e.push('Add at least one voice track.');
    return e;
  }, [draft]);

  const ok = errors.length === 0;

  return (
    <div className="bf-modal" onClick={onCancel} role="dialog" aria-modal="true">
      <div className="bf-modal-body bf-save-modal" onClick={(e) => e.stopPropagation()}>
        <div className="bf-modal-head">
          <h2 className="bf-modal-title">Save pattern</h2>
          <button
            className="bf-modal-x"
            onClick={onCancel}
            type="button"
            aria-label="Close"
          >
            ×
          </button>
        </div>
        <div className="bf-save-body">
          <dl className="bf-save-summary">
            <div><dt>Name</dt><dd>{draft.name || <em>— missing —</em>}</dd></div>
            <div><dt>Meter</dt><dd>{draft.timeSig} ({draft.grouping.join('+')})</dd></div>
            <div><dt>Steps</dt><dd>{draft.steps} · {draft.stepUnit === 4 ? 'quarters' : draft.stepUnit === 8 ? 'eighths' : 'sixteenths'}</dd></div>
            {(() => {
              const t = naturalTempo(draft.bpm.default, draft.stepUnit, draft.timeSig);
              const denom = parseTimeSigDenom(draft.timeSig);
              const minN = stepToNaturalBpm(draft.bpm.min, draft.stepUnit, denom);
              const maxN = stepToNaturalBpm(draft.bpm.max, draft.stepUnit, denom);
              return <div><dt>Tempo</dt><dd>{t.glyph}={t.value} (min {minN}, max {maxN})</dd></div>;
            })()}
            <div><dt>Default ensemble</dt><dd>{draft.defaultKit}</dd></div>
            <div><dt>Region</dt><dd>{draft.region}</dd></div>
            <div><dt>Tracks</dt><dd>{Object.keys(draft.tracks).join(', ') || <em>none</em>}</dd></div>
          </dl>

          {errors.length > 0 && (
            <ul className="bf-save-errors">
              {errors.map((m) => <li key={m}>{m}</li>)}
            </ul>
          )}
          {ok && (
            <p className="bf-save-note">
              Saved patterns live in this browser only. Use Export to back up your work.
            </p>
          )}
        </div>
        <div className="bf-detail-actions">
          <button className="bf-chip ghost" onClick={onCancel} type="button">
            Cancel
          </button>
          <button
            className="bf-chip on"
            onClick={onConfirm}
            disabled={!ok}
            type="button"
          >
            Save to Local
          </button>
        </div>
      </div>
    </div>
  );
}
