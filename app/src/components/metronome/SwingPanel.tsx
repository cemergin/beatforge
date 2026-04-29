import { useT } from '../../i18n';

interface Props {
  swing: number;
  setSwing: (n: number) => void;
}

export function SwingPanel({ swing, setSwing }: Props) {
  const t = useT();
  return (
    <div className="bf-panel">
      <div className="bf-panel-head">{t('swing.title')}</div>
      <div className="bf-row">
        <input
          type="range"
          min={50}
          max={75}
          value={swing}
          onChange={(e) => setSwing(Number(e.target.value))}
        />
        <span className="bf-val">
          {swing === 50 ? t('swing.straight') : swing >= 66 ? t('swing.triplet') : `${swing}%`}
        </span>
      </div>
    </div>
  );
}
