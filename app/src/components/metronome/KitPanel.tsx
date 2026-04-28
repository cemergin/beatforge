import { ALL_KITS, type KitId } from '../../patterns/types';
import type { SoundKit } from '../../patterns/types-sound';

interface Props {
  activeKit: KitId;
  onSelect: (kit: KitId) => void;
  /** When set, shows a small "reset to default" chip in the panel head. */
  resetTo?: KitId | null;
  onReset?: () => void;
  /** User-saved ensembles (Studio's "Save ensemble"). Shown as a
   *  second row below the preset kits. Clicking one applies its
   *  channels via onSelectSaved. */
  savedEnsembles?: readonly SoundKit[];
  /** Currently-applied saved ensemble id, used to mark the row. */
  activeSavedId?: string | null;
  onSelectSaved?: (kit: SoundKit) => void;
}

export function KitPanel({
  activeKit, onSelect, resetTo, onReset,
  savedEnsembles, activeSavedId, onSelectSaved,
}: Props) {
  const hasSaved = (savedEnsembles?.length ?? 0) > 0;
  return (
    <div className="bf-panel">
      <div className="bf-panel-head">
        ensemble
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
            className={`bf-kit-btn ${activeKit === k && !activeSavedId ? 'on' : ''}`}
            onClick={() => onSelect(k)}
            type="button"
          >
            {k === 'frameDrum' ? 'frame' : k}
          </button>
        ))}
      </div>
      {hasSaved && onSelectSaved && (
        <>
          <div className="bf-kit-saved-label">your ensembles</div>
          <div className="bf-kit-grid">
            {savedEnsembles!.map((kit) => (
              <button
                key={kit.id}
                className={`bf-kit-btn bf-kit-btn-saved ${activeSavedId === kit.id ? 'on' : ''}`}
                onClick={() => onSelectSaved(kit)}
                title={kit.channels.map((c) => c.label).join(', ')}
                type="button"
              >
                {kit.name}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
