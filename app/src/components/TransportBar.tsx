// Generic transport bar — play/stop button, BPM input, clear button.
// Engine-agnostic: parent passes callbacks and current state. Built so
// Studio + Sound can share once the engines converge.

import { useT } from '../i18n';

interface Props {
  isPlaying: boolean;
  bpm: number;
  onPlayToggle: () => void;
  onBpmChange: (b: number) => void;
  onClear?: () => void;
  /** When provided, renders a "tap" button between BPM and clear. The
   *  parent owns the tap-time array + averaging — this is just the
   *  trigger surface. */
  onTap?: () => void;
  /** 1-indexed bar counter shown next to the play button. 0 hides
   *  the counter (i.e., not playing or pre-count-in). */
  barCounter?: number;
  /** Optional extra controls slotted to the right (e.g. accent levels,
   *  swing, count-in). Keeps the shared component lean. */
  rightSlot?: React.ReactNode;
}

const BPM_MIN = 30;
const BPM_MAX = 300;

export function TransportBar({
  isPlaying,
  bpm,
  onPlayToggle,
  onBpmChange,
  onClear,
  onTap,
  barCounter,
  rightSlot,
}: Props) {
  const t = useT();
  return (
    <div className="bf-transport">
      <button
        type="button"
        className={`bf-transport-play ${isPlaying ? 'on' : ''}`}
        onClick={onPlayToggle}
        aria-label={isPlaying ? t('transport.stop') : t('transport.play')}
        title={isPlaying ? t('transport.stop_title') : t('transport.play_title')}
      >
        {isPlaying ? '■' : '▶'}
      </button>

      {barCounter !== undefined && barCounter > 0 && (
        <span className="bf-transport-bar-counter" aria-label={t('transport.bar_counter')}>
          {t('transport.bar_prefix')} {barCounter}
        </span>
      )}

      <div className="bf-transport-bpm">
        <label className="bf-transport-bpm-label" htmlFor="bf-transport-bpm-input">{t('transport.bpm_label')}</label>
        <input
          id="bf-transport-bpm-input"
          type="number"
          inputMode="numeric"
          min={BPM_MIN}
          max={BPM_MAX}
          value={bpm}
          onChange={(e) => {
            const n = Number(e.target.value);
            if (Number.isFinite(n)) {
              onBpmChange(Math.max(BPM_MIN, Math.min(BPM_MAX, Math.round(n))));
            }
          }}
        />
      </div>

      {onTap && (
        <button
          type="button"
          className="bf-transport-tap"
          onClick={onTap}
          title={t('transport.tap_title')}
        >
          {t('transport.tap')}
        </button>
      )}

      {onClear && (
        <button
          type="button"
          className="bf-transport-clear"
          onClick={onClear}
          title={t('transport.clear_title')}
        >
          {t('transport.clear')}
        </button>
      )}

      {rightSlot && <div className="bf-transport-right">{rightSlot}</div>}
    </div>
  );
}
