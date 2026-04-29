// BPM number input with deferred validation. The naive
// `<input type="number" min=30 max=300 value={bpm} onChange={clamp}>`
// pattern makes mid-edit typing impossible — typing "108" requires
// keystrokes "1" → clamps to 30, can't recover. This input keeps a
// raw string in local state, syncs to external bpm changes (trainer
// ramps, tap tempo, MIDI clock), and only commits + clamps on
// blur or Enter.

import { useEffect, useRef, useState, type KeyboardEvent } from 'react';

interface Props {
  bpm: number;
  setBpm: (n: number) => void;
  /** Hard min/max for the committed value. */
  min?: number;
  max?: number;
  className?: string;
  ariaLabel?: string;
}

const DEFAULT_MIN = 30;
const DEFAULT_MAX = 300;

export function BpmInput({ bpm, setBpm, min = DEFAULT_MIN, max = DEFAULT_MAX, className, ariaLabel = 'BPM' }: Props) {
  const [text, setText] = useState<string>(String(bpm));
  // Track the last committed numeric so we can ignore "external" BPM
  // updates that came from THIS input's commit (avoids flicker /
  // cursor jump). External changes (trainer, tap, MIDI) update text;
  // own commits don't.
  const lastCommittedRef = useRef<number>(bpm);

  useEffect(() => {
    if (bpm === lastCommittedRef.current) return;
    lastCommittedRef.current = bpm;
    setText(String(bpm));
  }, [bpm]);

  const commit = () => {
    const n = parseInt(text, 10);
    if (!Number.isFinite(n)) {
      // Empty / non-numeric — revert to current bpm.
      setText(String(bpm));
      return;
    }
    const clamped = Math.max(min, Math.min(max, n));
    lastCommittedRef.current = clamped;
    setText(String(clamped));
    if (clamped !== bpm) setBpm(clamped);
  };

  const onKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.currentTarget.blur(); // triggers commit via onBlur
    } else if (e.key === 'Escape') {
      setText(String(bpm));
      e.currentTarget.blur();
    }
  };

  return (
    <input
      type="number"
      inputMode="numeric"
      // No native min/max — they fight the deferred-commit pattern by
      // jumping the value mid-edit. We clamp on commit instead.
      value={text}
      onChange={(e) => setText(e.target.value)}
      onBlur={commit}
      onKeyDown={onKeyDown}
      className={className}
      aria-label={ariaLabel}
    />
  );
}
