import type { ReactNode } from 'react';

interface Props {
  /** Quarter-note BPM (♩ = N). The engine sees this multiplied by
   *  stepUnit/4 — that conversion lives in the parent mode. */
  bpm: number;
  setBpm: (next: number | ((prev: number) => number)) => void;
  onTap: () => void;
  tapArmed: boolean;
  countingIn?: boolean;
  /** Pattern's smallest subdivision — drives the ♪/♬ companion display. */
  stepUnit?: number;
  /** Slot rendered between the slider row and the counting-in badge — Practice
   *  fills this with BeatDots; Studio leaves it empty. */
  children?: ReactNode;
  /** Slider range, in quarter BPM. */
  min?: number;
  max?: number;
}

export function BpmHero({
  bpm, setBpm, onTap, tapArmed, countingIn,
  stepUnit = 16, children, min = 30, max = 300,
}: Props) {
  const eighthBpm = bpm * 2;
  const sixteenthBpm = bpm * 4;

  return (
    <div className={`bf-bpm-hero ${countingIn ? 'counting-in' : ''}`}>
      <div className="bf-bpm-display">
        <span className="bf-bpm-glyph" aria-hidden="true">♩</span>
        <span className="bf-bpm-eq" aria-hidden="true">=</span>
        <span className="bf-bpm-num">{bpm}</span>
      </div>
      <div className="bf-bpm-unit" title="Beats per minute as a quarter note">
        BPM
      </div>
      <div className="bf-bpm-conversions" aria-label={`Equivalents: ${eighthBpm} eighths per minute, ${sixteenthBpm} sixteenths per minute`}>
        <span>♪ {eighthBpm}</span>
        <span className="bf-bpm-conversions-sep">·</span>
        <span>♬ {sixteenthBpm}</span>
        {stepUnit !== 16 && stepUnit !== 8 && stepUnit !== 4 && (
          <>
            <span className="bf-bpm-conversions-sep">·</span>
            <span>step {Math.round((bpm * stepUnit) / 4)}</span>
          </>
        )}
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
          aria-label="BPM (quarter notes per minute)"
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
