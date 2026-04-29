import { useT } from '../../i18n';

interface Props {
  strong: number;
  setStrong: (n: number) => void;
  weak: number;
  setWeak: (n: number) => void;
}

export function AccentsPanel({ strong, setStrong, weak, setWeak }: Props) {
  const t = useT();
  return (
    <div className="bf-panel">
      <div className="bf-panel-head">{t('accents.title')}</div>
      <div className="bf-row">
        <label>{t('accents.strong')}</label>
        <input
          type="range"
          min={50}
          max={100}
          value={strong}
          onChange={(e) => setStrong(Number(e.target.value))}
        />
        <span className="bf-val">{strong}%</span>
      </div>
      <div className="bf-row">
        <label>{t('accents.weak')}</label>
        <input
          type="range"
          min={0}
          max={100}
          value={weak}
          onChange={(e) => setWeak(Number(e.target.value))}
        />
        <span className="bf-val">{weak}%</span>
      </div>
    </div>
  );
}
