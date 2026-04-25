import { ALL_KITS, type KitId } from '../../patterns/types';

interface Props {
  activeKit: KitId;
  onSelect: (kit: KitId) => void;
  /** When set, shows a small "reset to default" chip in the panel head. */
  resetTo?: KitId | null;
  onReset?: () => void;
}

export function KitPanel({ activeKit, onSelect, resetTo, onReset }: Props) {
  return (
    <div className="bf-panel">
      <div className="bf-panel-head">
        kit
        {resetTo && onReset && (
          <button
            className="bf-kit-reset"
            onClick={onReset}
            title={`Reset to pattern default: ${resetTo}`}
            type="button"
          >
            ⤺ {resetTo}
          </button>
        )}
      </div>
      <div className="bf-kit-grid">
        {ALL_KITS.map((k) => (
          <button
            key={k}
            className={`bf-kit-btn ${activeKit === k ? 'on' : ''}`}
            onClick={() => onSelect(k)}
            type="button"
          >
            {k === 'frameDrum' ? 'frame' : k}
          </button>
        ))}
      </div>
    </div>
  );
}
