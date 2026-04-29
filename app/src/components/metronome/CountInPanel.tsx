import { useT } from '../../i18n';

interface Props {
  countInBars: number;
  setCountInBars: (n: number) => void;
}

const OPTIONS = [0, 1, 2, 4];

export function CountInPanel({ countInBars, setCountInBars }: Props) {
  const t = useT();
  return (
    <div className="bf-panel">
      <div className="bf-panel-head">{t('count_in.title')}</div>
      <div className="bf-seg">
        {OPTIONS.map((n) => (
          <button
            key={n}
            className={countInBars === n ? 'on' : ''}
            onClick={() => setCountInBars(n)}
            type="button"
          >
            {n === 0
              ? t('count_in.off')
              : t(n === 1 ? 'count_in.bar_singular' : 'count_in.bar_plural', { n })}
          </button>
        ))}
      </div>
    </div>
  );
}
