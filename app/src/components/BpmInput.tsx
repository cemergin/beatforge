// BPM number input — thin wrapper around NumberInput with the BPM
// defaults (30..300, integer). Kept as a named component because
// callers don't need to remember the bounds; bumping them in one
// place is also cleaner than threading through every callsite.

import { NumberInput } from './NumberInput';

interface Props {
  bpm: number;
  setBpm: (n: number) => void;
  min?: number;
  max?: number;
  className?: string;
  ariaLabel?: string;
}

export function BpmInput({ bpm, setBpm, min = 30, max = 300, className, ariaLabel = 'BPM' }: Props) {
  return (
    <NumberInput
      value={bpm}
      onChange={setBpm}
      min={min}
      max={max}
      className={className}
      ariaLabel={ariaLabel}
    />
  );
}
