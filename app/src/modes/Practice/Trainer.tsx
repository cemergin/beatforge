export interface TrainerCfg {
  from: number;
  to: number;
  step: number;
  bars: number;
  mode: 'cycles' | 'time';
}

interface Props {
  cfg: TrainerCfg;
  setCfg: (cfg: TrainerCfg) => void;
  on: boolean;
  setOn: (on: boolean) => void;
  bar: number;
  bpm: number;
}

export function Trainer({ cfg, setCfg, on, setOn, bar, bpm }: Props) {
  const progress = Math.max(0, Math.min(1, (bpm - cfg.from) / Math.max(1, cfg.to - cfg.from)));
  const barsInCycle = cfg.mode === 'cycles' ? bar % cfg.bars : 0;

  return (
    <div className="bf-panel bf-trainer">
      <div className="bf-panel-head">
        <span>speed trainer</span>
        <button className={`bf-toggle ${on ? 'on' : ''}`} onClick={() => setOn(!on)}>
          {on ? 'on' : 'off'}
        </button>
      </div>

      <div className="bf-trainer-ramp">
        <div className="bf-trainer-ramp-fill" style={{ width: `${progress * 100}%` }} />
        <div className="bf-trainer-ramp-knob" style={{ left: `calc(${progress * 100}% - 6px)` }} />
        <div className="bf-trainer-labels">
          <span>{cfg.from}</span><span>{cfg.to}</span>
        </div>
      </div>

      <div className="bf-row">
        <label>from</label>
        <input type="number" min={30} max={800} value={cfg.from}
               onChange={(e) => setCfg({ ...cfg, from: Number(e.target.value) })} />
        <label>→ to</label>
        <input type="number" min={30} max={800} value={cfg.to}
               onChange={(e) => setCfg({ ...cfg, to: Number(e.target.value) })} />
      </div>
      <div className="bf-row">
        <label>+</label>
        <input type="number" min={1} max={20} value={cfg.step}
               onChange={(e) => setCfg({ ...cfg, step: Number(e.target.value) })} />
        <label>every</label>
        <input type="number" min={1} max={32} value={cfg.bars}
               onChange={(e) => setCfg({ ...cfg, bars: Number(e.target.value) })} />
        <div className="bf-mode-seg">
          <button className={cfg.mode === 'cycles' ? 'on' : ''} onClick={() => setCfg({ ...cfg, mode: 'cycles' })}>bars</button>
          <button className={cfg.mode === 'time' ? 'on' : ''} onClick={() => setCfg({ ...cfg, mode: 'time' })}>sec</button>
        </div>
      </div>
      {on && cfg.mode === 'cycles' && (
        <div className="bf-trainer-barcount">
          <span className="bf-mini-label">cycle</span>
          <div className="bf-barpips">
            {Array.from({ length: cfg.bars }).map((_, i) => (
              <span key={i} className={`bf-pip ${i < barsInCycle ? 'on' : ''}`} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
