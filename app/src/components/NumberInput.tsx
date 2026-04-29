// Number input with deferred validation. The naive
// `<input type="number" min={..} max={..} value={n} onChange={clamp}>`
// pattern fights the user mid-edit — typing "108" requires keystroke
// "1" which clamps to min, then "10" still clamps, then "108" finally
// accepts. Hidden bug, real annoyance.
//
// This component holds the raw text in local state, updates on every
// keystroke without clamping, and only commits + clamps to [min, max]
// on blur or Enter. Esc reverts. External value changes (programmatic
// updates: trainer ramp, tap tempo, MIDI clock, preset load) sync the
// displayed text without disturbing an in-flight edit.

import { useEffect, useRef, useState, type CSSProperties, type KeyboardEvent } from 'react';

interface Props {
  value: number;
  onChange: (next: number) => void;
  /** Hard bounds applied at commit time. Defaults: -Infinity / Infinity. */
  min?: number;
  max?: number;
  /** Step is decorative only (HTML number-input arrows are hidden via
   *  CSS); use it to signal "this is a float" with step < 1. */
  step?: number;
  /** Number of decimals to round committed values to. Defaults to 0
   *  (integer) when step >= 1, else 4 (small floats). Override
   *  explicitly for precision-sensitive callers (e.g. velocity scale). */
  decimals?: number;
  className?: string;
  style?: CSSProperties;
  ariaLabel?: string;
  title?: string;
  placeholder?: string;
  disabled?: boolean;
  id?: string;
}

export function NumberInput({
  value,
  onChange,
  min = -Infinity,
  max = Infinity,
  step,
  decimals,
  className,
  style,
  ariaLabel,
  title,
  placeholder,
  disabled,
  id,
}: Props) {
  const stepIsInt = step === undefined || step >= 1;
  const dp = decimals ?? (stepIsInt ? 0 : 4);

  const [text, setText] = useState<string>(formatValue(value, dp));
  // Track the last committed numeric so we can ignore "external"
  // updates that came from THIS input's commit. Without this, every
  // commit would re-set the text and could nudge the cursor.
  const lastCommittedRef = useRef<number>(value);

  useEffect(() => {
    if (value === lastCommittedRef.current) return;
    lastCommittedRef.current = value;
    setText(formatValue(value, dp));
  }, [value, dp]);

  const commit = () => {
    const n = stepIsInt ? parseInt(text, 10) : parseFloat(text);
    if (!Number.isFinite(n)) {
      // Empty / non-numeric — revert to current value.
      setText(formatValue(value, dp));
      return;
    }
    const clamped = clamp(roundTo(n, dp), min, max);
    lastCommittedRef.current = clamped;
    setText(formatValue(clamped, dp));
    if (clamped !== value) onChange(clamped);
  };

  const onKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.currentTarget.blur(); // triggers commit via onBlur
    } else if (e.key === 'Escape') {
      setText(formatValue(value, dp));
      e.currentTarget.blur();
    }
  };

  return (
    <input
      id={id}
      type="number"
      inputMode={stepIsInt ? 'numeric' : 'decimal'}
      step={step}
      // No native min/max — they fight the deferred-commit pattern by
      // jumping the value mid-edit. We clamp on commit instead.
      value={text}
      onChange={(e) => setText(e.target.value)}
      onBlur={commit}
      onKeyDown={onKeyDown}
      className={className}
      style={style}
      aria-label={ariaLabel}
      title={title}
      placeholder={placeholder}
      disabled={disabled}
    />
  );
}

function clamp(n: number, lo: number, hi: number): number {
  return Math.max(lo, Math.min(hi, n));
}

function roundTo(n: number, dp: number): number {
  if (dp <= 0) return Math.round(n);
  const k = 10 ** dp;
  return Math.round(n * k) / k;
}

function formatValue(n: number, dp: number): string {
  if (!Number.isFinite(n)) return '';
  if (dp <= 0) return String(Math.round(n));
  // Strip trailing zeros so "1" doesn't render as "1.0000".
  return roundTo(n, dp).toString();
}
