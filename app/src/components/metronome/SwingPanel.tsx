interface Props {
  swing: number;
  setSwing: (n: number) => void;
}

export function SwingPanel({ swing, setSwing }: Props) {
  return (
    <div className="bf-panel">
      <div className="bf-panel-head">swing</div>
      <div className="bf-row">
        <input
          type="range"
          min={50}
          max={75}
          value={swing}
          onChange={(e) => setSwing(Number(e.target.value))}
        />
        <span className="bf-val">
          {swing === 50 ? 'straight' : swing >= 66 ? 'triplet' : `${swing}%`}
        </span>
      </div>
    </div>
  );
}
