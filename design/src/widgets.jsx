const { useState, useEffect } = React;

function Trainer({ cfg, setCfg, on, setOn, bar, bpm }) {
  const progress = Math.max(0, Math.min(1, (bpm - cfg.from) / Math.max(1, cfg.to - cfg.from)));
  const barsInCycle = cfg.mode === 'cycles' ? (bar % cfg.bars) : 0;
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
        <input type="number" min={30} max={800} value={cfg.from} onChange={(e) => setCfg({ ...cfg, from: Number(e.target.value) })} />
        <label>→ to</label>
        <input type="number" min={30} max={800} value={cfg.to} onChange={(e) => setCfg({ ...cfg, to: Number(e.target.value) })} />
      </div>
      <div className="bf-row">
        <label>+</label>
        <input type="number" min={1} max={20} value={cfg.step} onChange={(e) => setCfg({ ...cfg, step: Number(e.target.value) })} />
        <label>every</label>
        <input type="number" min={1} max={32} value={cfg.bars} onChange={(e) => setCfg({ ...cfg, bars: Number(e.target.value) })} />
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

function Library({ onPick, onClose }) {
  const [filter, setFilter] = useState('all');
  const sigs = ['all', '4/4', '7/8', '9/8', '5/8', '11/8', '10/8', '12/8', 'poly'];
  const patterns = window.PATTERNS.filter((p) => {
    if (filter === 'all') return true;
    if (filter === 'poly') return p.poly;
    return p.timeSig === filter;
  });
  return (
    <div className="bf-modal" onClick={onClose}>
      <div className="bf-modal-body" onClick={(e) => e.stopPropagation()}>
        <div className="bf-modal-head">
          <div>
            <div className="bf-modal-title">rhythm library</div>
            <div className="bf-modal-sub">30 rhythms across Anatolia, Balkans, Africa, the Caribbean, India, and the club</div>
          </div>
          <button className="bf-modal-x" onClick={onClose}>×</button>
        </div>
        <div className="bf-filter-row">
          {sigs.map((s) => (
            <button key={s} className={`bf-chip ${filter === s ? 'on' : 'ghost'}`} onClick={() => setFilter(s)}>{s}</button>
          ))}
        </div>
        <div className="bf-lib-grid">
          {patterns.map((p) => (
            <button key={p.id} className="bf-lib-card" onClick={() => onPick(p.id)}>
              <div className="bf-lib-name">{p.name}</div>
              <div className="bf-lib-origin">{p.origin}</div>
              <div className="bf-lib-meta">
                <span className="bf-meta-badge small">{p.timeSig}</span>
                <span className="bf-meta-badge small alt">{p.grouping.join('+')}</span>
              </div>
              <div className="bf-lib-dots">
                <window.BeatDots grouping={p.grouping} currentStep={-1} size={8} />
              </div>
              <div className="bf-lib-bpm">{p.bpm.default} bpm · {p.difficulty}</div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

// Tweaks panel (the in-design tweak surface)
function Tweaks({ theme, setTheme, view, setView, kit, setKit, grouping, setGrouping, groupingOptions }) {
  const [active, setActive] = useState(false);
  useEffect(() => {
    const onMsg = (e) => {
      const d = e.data;
      if (!d || typeof d !== 'object') return;
      if (d.type === '__activate_edit_mode') setActive(true);
      if (d.type === '__deactivate_edit_mode') setActive(false);
    };
    window.addEventListener('message', onMsg);
    window.parent.postMessage({ type: '__edit_mode_available' }, '*');
    return () => window.removeEventListener('message', onMsg);
  }, []);
  if (!active) return null;
  const persist = (edits) => {
    window.parent.postMessage({ type: '__edit_mode_set_keys', edits }, '*');
  };
  return (
    <div className="bf-tweaks">
      <div className="bf-tweaks-head">Tweaks</div>
      <div className="bf-tweaks-row">
        <div className="bf-tweaks-label">theme</div>
        <div className="bf-seg">
          {['warm', 'noir', 'paper'].map((t) => (
            <button key={t} className={theme === t ? 'on' : ''} onClick={() => { setTheme(t); persist({ theme: t }); }}>{t}</button>
          ))}
        </div>
      </div>
      <div className="bf-tweaks-row">
        <div className="bf-tweaks-label">grid</div>
        <div className="bf-seg">
          {['circular', 'linear', 'pill'].map((v) => (
            <button key={v} className={view === v ? 'on' : ''} onClick={() => { setView(v); persist({ view: v }); }}>{v}</button>
          ))}
        </div>
      </div>
      <div className="bf-tweaks-row">
        <div className="bf-tweaks-label">kit</div>
        <div className="bf-seg">
          {['808', '909', '707'].map((k) => (
            <button key={k} className={kit === k ? 'on' : ''} onClick={() => { setKit(k); persist({ kit: k }); }}>{k}</button>
          ))}
        </div>
      </div>
      <div className="bf-tweaks-row">
        <div className="bf-tweaks-label">grouping</div>
        <div className="bf-seg wrap">
          {groupingOptions.map((g, i) => (
            <button key={i} className={g.join('+') === grouping.join('+') ? 'on' : ''} onClick={() => setGrouping(g)}>{g.join('+')}</button>
          ))}
        </div>
      </div>
    </div>
  );
}

Object.assign(window, { Trainer, Library, Tweaks });
