// Generic transport bar — play/stop button, BPM input, clear button.
// Engine-agnostic: parent passes callbacks and current state. Built so
// Studio + Sound can share once the engines converge.

interface Props {
  isPlaying: boolean;
  bpm: number;
  onPlayToggle: () => void;
  onBpmChange: (b: number) => void;
  onClear?: () => void;
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
  rightSlot,
}: Props) {
  return (
    <div className="bf-transport">
      <button
        type="button"
        className={`bf-transport-play ${isPlaying ? 'on' : ''}`}
        onClick={onPlayToggle}
        aria-label={isPlaying ? 'Stop' : 'Play'}
        title={isPlaying ? 'Stop (Space)' : 'Play (Space)'}
      >
        {isPlaying ? '■' : '▶'}
      </button>

      <div className="bf-transport-bpm">
        <label className="bf-transport-bpm-label" htmlFor="bf-transport-bpm-input">BPM</label>
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

      {onClear && (
        <button
          type="button"
          className="bf-transport-clear"
          onClick={onClear}
          title="Clear all steps"
        >
          clear
        </button>
      )}

      {rightSlot && <div className="bf-transport-right">{rightSlot}</div>}
    </div>
  );
}
