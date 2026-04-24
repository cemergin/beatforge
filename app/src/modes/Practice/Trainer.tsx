import { useEffect, useState } from 'react';

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
  cycleStartMs: number | null;
}

export function Trainer({ cfg, setCfg, on, setOn, bar, bpm, cycleStartMs }: Props) {
  const progress = Math.max(0, Math.min(1, (bpm - cfg.from) / Math.max(1, cfg.to - cfg.from)));
  const barsInCycle = cfg.mode === 'cycles' ? bar % cfg.bars : 0;

  // Local rAF clock for the time-mode fill bar — only runs while the
  // trainer's time cycle is actively counting down.
  const [now, setNow] = useState(() => performance.now());
  useEffect(() => {
    if (!on || cfg.mode !== 'time' || cycleStartMs == null) return;
    let raf = 0;
    const tick = () => {
      setNow(performance.now());
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [on, cfg.mode, cycleStartMs]);

  const cycleSec = Math.max(1, cfg.bars);
  const elapsed = cycleStartMs == null ? 0 : (now - cycleStartMs) / 1000;
  const cycleProgress = Math.max(0, Math.min(1, elapsed / cycleSec));
  const remaining = Math.max(0, cycleSec - elapsed);

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
               onChange={(e) => setCfg({ ...cfg, from: Number(e.target.value) })}
               aria-label="Trainer starting BPM" />
        <label>→ to</label>
        <input type="number" min={30} max={800} value={cfg.to}
               onChange={(e) => setCfg({ ...cfg, to: Number(e.target.value) })}
               aria-label="Trainer target BPM" />
      </div>
      <div className="bf-row">
        <label>+</label>
        <input type="number" min={1} max={20} value={cfg.step}
               onChange={(e) => setCfg({ ...cfg, step: Number(e.target.value) })}
               aria-label="Trainer BPM increment per cycle" />
        <label>every</label>
        <input type="number" min={1} max={32} value={cfg.bars}
               onChange={(e) => setCfg({ ...cfg, bars: Number(e.target.value) })}
               aria-label="Trainer cycles between BPM bumps" />
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
      {on && cfg.mode === 'time' && cycleStartMs != null && (
        <div className="bf-trainer-cyclecount">
          <span className="bf-mini-label">next bump</span>
          <div className="bf-trainer-cyclebar" aria-hidden="true">
            <div
              className="bf-trainer-cyclebar-fill"
              style={{ width: `${cycleProgress * 100}%` }}
            />
          </div>
          <span className="bf-mini-label bf-trainer-cycle-remaining">
            {Math.ceil(remaining)}s
          </span>
        </div>
      )}
    </div>
  );
}
