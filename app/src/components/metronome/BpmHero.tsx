import type { ReactNode } from 'react';

interface Props {
  bpm: number;
  setBpm: (next: number | ((prev: number) => number)) => void;
  onTap: () => void;
  tapArmed: boolean;
  countingIn?: boolean;
  /** Slot rendered between the slider row and the counting-in badge — Practice
   *  fills this with BeatDots; Studio leaves it empty. */
  children?: ReactNode;
  min?: number;
  max?: number;
}

export function BpmHero({
  bpm, setBpm, onTap, tapArmed, countingIn, children, min = 30, max = 800,
}: Props) {
  return (
    <div className={`bf-bpm-hero ${countingIn ? 'counting-in' : ''}`}>
      <div className="bf-bpm-num">{bpm}</div>
      <div className="bf-bpm-unit" title="Beats per minute — where one beat is one grid step">
        BPM <span style={{ opacity: 0.7, fontSize: '0.7em' }}>· step/min</span>
      </div>
      <div className="bf-bpm-controls">
        <button
          onClick={() => setBpm((b) => Math.max(min, b - 1))}
          aria-label="Decrease BPM"
          type="button"
        >
          −
        </button>
        <input
          type="range"
          min={min}
          max={max}
          value={bpm}
          aria-label="BPM (steps per minute)"
          onChange={(e) => setBpm(Number(e.target.value))}
        />
        <button
          onClick={() => setBpm((b) => Math.min(max, b + 1))}
          aria-label="Increase BPM"
          type="button"
        >
          +
        </button>
        <button
          className={`bf-bpm-tap ${tapArmed ? 'armed' : ''}`}
          onClick={onTap}
          title="Tap repeatedly to set BPM (or press T)"
          aria-label="Tap to set tempo"
          type="button"
        >
          t
        </button>
      </div>
      {children}
      {countingIn && <div className="bf-counting-in-badge">counting in…</div>}
    </div>
  );
}
