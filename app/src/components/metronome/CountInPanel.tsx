interface Props {
  countInBars: number;
  setCountInBars: (n: number) => void;
}

const OPTIONS = [0, 1, 2, 4];

export function CountInPanel({ countInBars, setCountInBars }: Props) {
  return (
    <div className="bf-panel">
      <div className="bf-panel-head">count-in</div>
      <div className="bf-seg">
        {OPTIONS.map((n) => (
          <button
            key={n}
            className={countInBars === n ? 'on' : ''}
            onClick={() => setCountInBars(n)}
            type="button"
          >
            {n === 0 ? 'off' : `${n} bar${n > 1 ? 's' : ''}`}
          </button>
        ))}
      </div>
    </div>
  );
}
