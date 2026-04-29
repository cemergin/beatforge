import { useT } from '../../i18n';

interface Props {
  playing: boolean;
  onToggle: () => void;
  volume: number;
  onVolumeChange: (next: number) => void;
}

function volumeIcon(v: number): string {
  if (v === 0) return '🔇';
  if (v < 0.35) return '🔈';
  if (v < 0.7) return '🔉';
  return '🔊';
}

export function PlayVolume({ playing, onToggle, volume, onVolumeChange }: Props) {
  const t = useT();
  return (
    <div className="bf-play-volume">
      <button className={`bf-play ${playing ? 'on' : ''}`} onClick={onToggle} type="button">
        {playing ? (
          <span><span className="bf-stop-ico" /> {t('transport.stop')}</span>
        ) : (
          <span><span className="bf-play-ico" /> {t('transport.play')}</span>
        )}
      </button>
      <div className="bf-volume" title={t('play_volume.master_volume')}>
        <span className="bf-volume-ico" aria-hidden="true">{volumeIcon(volume)}</span>
        <input
          type="range"
          min={0}
          max={100}
          value={Math.round(volume * 100)}
          onChange={(e) => onVolumeChange(Number(e.target.value) / 100)}
          aria-label={t('play_volume.master_volume_label')}
        />
      </div>
    </div>
  );
}
