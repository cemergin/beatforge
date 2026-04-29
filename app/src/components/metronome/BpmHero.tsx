import type { ReactNode } from 'react';
import { denomGlyph, parseTimeSigDenom } from '../../audio/tempo';
import { useT } from '../../i18n';

interface Props {
  /** "Natural" BPM — the rate at the time signature's denominator
   *  (e.g., quarter BPM for 4/4, eighth BPM for 9/8). The mode converts
   *  this to step BPM at the engine boundary. */
  bpm: number;
  setBpm: (next: number | ((prev: number) => number)) => void;
  onTap: () => void;
  tapArmed: boolean;
  countingIn?: boolean;
  /** Full time signature, e.g. "4/4", "9/8". Drives the primary glyph. */
  timeSig: string;
  /** Slot rendered between the slider and the counting-in badge — Practice
   *  fills this with BeatDots; Studio leaves it empty. */
  children?: ReactNode;
  /** Slider range, in natural BPM. */
  min?: number;
  max?: number;
}

// Companion-row note values to show beneath the primary glyph.
// Filtered down to the ones != primary at render time.
const COMPANION_DENOMS = [4, 8, 16] as const;

export function BpmHero({
  bpm, setBpm, onTap, tapArmed, countingIn, timeSig,
  children, min = 30, max = 400,
}: Props) {
  const t = useT();
  const denom = parseTimeSigDenom(timeSig);
  const glyph = denomGlyph(denom);

  // Convert the primary BPM (at `denom`) into the BPM at each companion
  // denomination: bpmAtX = bpm × X / denom.
  const companions = COMPANION_DENOMS
    .filter((d) => d !== denom)
    .map((d) => ({ glyph: denomGlyph(d), value: Math.round((bpm * d) / denom) }));

  return (
    <div className={`bf-bpm-hero ${countingIn ? 'counting-in' : ''}`}>
      <div className="bf-bpm-display">
        <span className="bf-bpm-glyph" aria-hidden="true">{glyph}</span>
        <span className="bf-bpm-eq" aria-hidden="true">=</span>
        <span className="bf-bpm-num">{bpm}</span>
      </div>
      <div className="bf-bpm-unit" title={t('bpm_hero.unit_title', { glyph, timeSig })}>
        {t('bpm_hero.unit_label', { timeSig })}
      </div>
      <div className="bf-bpm-conversions" aria-label={t('bpm_hero.conversions')}>
        {companions.map((c, i) => (
          <span key={c.glyph} className="bf-bpm-conversion-item">
            {i > 0 && <span className="bf-bpm-conversions-sep">·</span>}
            {c.glyph} {c.value}
          </span>
        ))}
      </div>
      <div className="bf-bpm-controls">
        <button
          onClick={() => setBpm((b) => Math.max(min, b - 1))}
          aria-label={t('bpm_hero.decrease')}
          type="button"
        >
          −
        </button>
        <input
          type="range"
          min={min}
          max={max}
          value={bpm}
          aria-label={t('bpm_hero.bpm_aria', { glyph })}
          onChange={(e) => setBpm(Number(e.target.value))}
        />
        <button
          onClick={() => setBpm((b) => Math.min(max, b + 1))}
          aria-label={t('bpm_hero.increase')}
          type="button"
        >
          +
        </button>
        <button
          className={`bf-bpm-tap ${tapArmed ? 'armed' : ''}`}
          onClick={onTap}
          title={t('bpm_hero.tap_title')}
          aria-label={t('bpm_hero.tap_label')}
          type="button"
        >
          t
        </button>
      </div>
      {children}
      {countingIn && <div className="bf-counting-in-badge">{t('bpm_hero.counting_in')}</div>}
    </div>
  );
}
