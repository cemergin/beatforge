// BeatForge — Practice module (extracted from app.jsx)
// Expects props: engineRef, playing, setPlaying, patternId, setPatternId, goToStudio
const { useState: usePr, useEffect: useEPr, useRef: useRPr, useMemo: useMPr, useCallback: useCPr } = React;

function Practice({ engineRef, playing, setPlaying, patternId, setPatternId, goToStudio, goToLibrary }) {
  const pattern = useMPr(() => window.patternById(patternId) || window.PATTERNS[0], [patternId]);
  const [bpm, setBpm] = usePr(pattern.bpm.default);
  const [cursors, setCursors] = usePr({});
  const [kit, setKit] = usePr(() => localStorage.getItem('bf_kit') || '808');
  const [theme, setTheme] = usePr(() => localStorage.getItem('bf_theme') || 'warm');
  const [view, setView] = usePr(() => localStorage.getItem('bf_view') || 'circular');
  const [grouping, setGrouping] = usePr(pattern.grouping);
  const [swing, setSwing] = usePr(50);
  const [strong, setStrong] = usePr(100);
  const [weak, setWeak] = usePr(55);
  const [showStory, setShowStory] = usePr(false);

  const [trainerOn, setTrainerOn] = usePr(false);
  const [trainerCfg, setTrainerCfg] = usePr({ from: 100, to: 160, step: 5, bars: 4, mode: 'cycles' });
  const [trainerBar, setTrainerBar] = usePr(0);

  // Hook engine onStep
  useEPr(() => {
    const e = engineRef.current; if (!e) return;
    e.onStep = (snap) => {
      setCursors(snap.cursors);
      if (snap.absStep > 0 && snap.absStep % pattern.steps === 0) {
        setTrainerBar((b) => b + 1);
      }
    };
    return () => { if (e) e.onStep = null; };
  }, [pattern.steps]);

  // Apply pattern when changed
  useEPr(() => {
    const e = engineRef.current; if (!e) return;
    e.loadPattern({ ...pattern, grouping: pattern.grouping });
    setBpm(pattern.bpm.default);
    setGrouping(pattern.grouping);
    localStorage.setItem('bf_pattern', pattern.id);
    setTrainerBar(0);
    // eslint-disable-next-line
  }, [patternId]);

  useEPr(() => {
    const e = engineRef.current; if (!e) return;
    e.loadPattern({ ...pattern, grouping });
  }, [grouping]);

  useEPr(() => { engineRef.current && engineRef.current.setBpm(bpm); }, [bpm]);
  useEPr(() => { engineRef.current && engineRef.current.setKit(kit); localStorage.setItem('bf_kit', kit); }, [kit]);
  useEPr(() => { engineRef.current && engineRef.current.setSwing(0.5 + (swing - 50) / 100 * 0.34); }, [swing]);
  useEPr(() => { engineRef.current && engineRef.current.setAccents(strong / 100, weak / 100); }, [strong, weak]);
  useEPr(() => { localStorage.setItem('bf_theme', theme); document.documentElement.dataset.theme = theme; }, [theme]);
  useEPr(() => { localStorage.setItem('bf_view', view); }, [view]);

  useEPr(() => {
    if (!trainerOn || !playing) return;
    if (trainerCfg.mode === 'cycles' && trainerBar > 0 && trainerBar % trainerCfg.bars === 0) {
      setBpm((b) => Math.min(trainerCfg.to, b + trainerCfg.step));
    }
    // eslint-disable-next-line
  }, [trainerBar]);

  useEPr(() => {
    if (!trainerOn || trainerCfg.mode !== 'time' || !playing) return;
    const iv = setInterval(() => {
      setBpm((b) => Math.min(trainerCfg.to, b + trainerCfg.step));
    }, trainerCfg.bars * 1000);
    return () => clearInterval(iv);
  }, [trainerOn, trainerCfg, playing]);

  const toggle = useCPr(async () => {
    const e = engineRef.current; if (!e) return;
    await e.ensureCtx();
    if (playing) { e.stop(); setPlaying(false); }
    else {
      if (bpm < trainerCfg.from && trainerOn) setBpm(trainerCfg.from);
      e.setBpm(bpm);
      e.start();
      setPlaying(true);
    }
  }, [playing, bpm, trainerOn, trainerCfg.from]);

  const curStep = useMPr(() => {
    const c = cursors.KK;
    if (c === undefined) return -1;
    const td = pattern.tracks.KK;
    if (!td) return -1;
    const cycle = Array.isArray(td) ? td.length : td.cycle;
    return (c + cycle - 1) % cycle;
  }, [cursors, pattern]);

  const groupingOptions = useMPr(() => {
    const canon = pattern.grouping;
    const out = new Set();
    const permute = (a, m = []) => {
      if (a.length === 0) out.add(m.join(',')); else {
        for (let i = 0; i < a.length; i++) {
          const cur = [...a]; const nx = cur.splice(i, 1);
          permute(cur, m.concat(nx));
        }
      }
    };
    permute(canon);
    return [...out].slice(0, 6).map((s) => s.split(',').map(Number));
  }, [pattern]);

  const toggleStep = useCPr((tr, s) => {
    const td = pattern.tracks[tr];
    const arr = Array.isArray(td) ? td : td.pattern;
    arr[s] = arr[s] === 0 ? 2 : arr[s] === 2 ? 1 : 0;
    setCursors((c) => ({ ...c }));
    engineRef.current && engineRef.current.loadPattern({ ...pattern, grouping });
  }, [pattern, grouping]);

  const grid = ({
    circular: <window.CircularGrid pattern={{ ...pattern, grouping }} cursors={cursors} size={440} onToggle={toggleStep} />,
    linear: <window.LinearGrid pattern={{ ...pattern, grouping }} cursors={cursors} onToggle={toggleStep} />,
    pill: <window.PillGrid pattern={{ ...pattern, grouping }} cursors={cursors} onToggle={toggleStep} />,
  })[view];

  return (
    <main className="bf-main">
      <aside className="bf-left">
        <div className="bf-pattern-card">
          <div className="bf-pattern-name">{pattern.name}</div>
          <div className="bf-pattern-origin">{pattern.origin}</div>
          <div className="bf-pattern-meta">
            <span className="bf-meta-badge">{pattern.timeSig}</span>
            <span className="bf-meta-badge alt">{grouping.join('+')}</span>
            <span className="bf-meta-badge alt">{pattern.difficulty}</span>
          </div>
        </div>

        <div className="bf-bpm-hero">
          <div className="bf-bpm-num">{bpm}</div>
          <div className="bf-bpm-unit" title="Beats per minute — where one beat is one grid step">BPM <span style={{opacity:0.45,fontSize:'0.7em'}}>· step/min</span></div>
          <div className="bf-bpm-controls">
            <button onClick={() => setBpm((b) => Math.max(30, b - 1))}>−</button>
            <input type="range" min={30} max={800} value={bpm} onChange={(e) => setBpm(Number(e.target.value))} />
            <button onClick={() => setBpm((b) => Math.min(800, b + 1))}>+</button>
          </div>
          <window.BeatDots grouping={grouping} currentStep={curStep} size={12} />
        </div>

        <button className={`bf-play ${playing ? 'on' : ''}`} onClick={toggle}>
          {playing ? (<span><span className="bf-stop-ico" /> stop</span>) : (<span><span className="bf-play-ico" /> play</span>)}
        </button>

        <div className="bf-quick">
          <button className="bf-chip ghost" onClick={goToLibrary}>browse library</button>
          <button className="bf-chip ghost" onClick={() => {
            const ids = window.PATTERNS.map((p) => p.id);
            setPatternId(ids[Math.floor(Math.random() * ids.length)]);
          }}>random</button>
        </div>

        {pattern.story && (
          <details className="bf-story" open={showStory} onToggle={(e) => setShowStory(e.currentTarget.open)}>
            <summary>about this rhythm</summary>
            <p>{pattern.story}</p>
          </details>
        )}
      </aside>

      <section className="bf-grid-wrap">
        <div className="bf-grid-head">
          <div className="bf-view-switch">
            {['circular', 'linear', 'pill'].map((v) => (
              <button key={v} className={`bf-view-btn ${view === v ? 'on' : ''}`} onClick={() => setView(v)}>{v}</button>
            ))}
          </div>
          <div className="bf-grouping-switch">
            <span className="bf-mini-label">grouping</span>
            {groupingOptions.map((g, i) => (
              <button key={i} className={`bf-group-btn ${g.join('+') === grouping.join('+') ? 'on' : ''}`} onClick={() => setGrouping(g)}>{g.join('+')}</button>
            ))}
          </div>
        </div>
        <div className="bf-grid-stage">{grid}</div>
        <div className="bf-grid-foot">
          <div className="bf-mini-label">
            {pattern.poly ? `polyrhythm · independent cursors · super-cycle = ${pattern.steps} steps` : `${pattern.steps} steps · ${pattern.stepUnit === 8 ? 'eighths' : pattern.stepUnit === 16 ? 'sixteenths' : 'quarters'}`}
          </div>
          <button className="bf-chip ghost" onClick={() => goToStudio(pattern)} title="Open this pattern in Studio to remix">open in studio →</button>
        </div>
      </section>

      <aside className="bf-right">
        <window.Trainer cfg={trainerCfg} setCfg={setTrainerCfg} on={trainerOn} setOn={setTrainerOn} bar={trainerBar} bpm={bpm} />
        <div className="bf-panel">
          <div className="bf-panel-head">accents</div>
          <div className="bf-row">
            <label>strong</label>
            <input type="range" min={50} max={100} value={strong} onChange={(e) => setStrong(Number(e.target.value))} />
            <span className="bf-val">{strong}%</span>
          </div>
          <div className="bf-row">
            <label>weak</label>
            <input type="range" min={0} max={100} value={weak} onChange={(e) => setWeak(Number(e.target.value))} />
            <span className="bf-val">{weak}%</span>
          </div>
        </div>
        <div className="bf-panel">
          <div className="bf-panel-head">swing</div>
          <div className="bf-row">
            <input type="range" min={50} max={75} value={swing} onChange={(e) => setSwing(Number(e.target.value))} />
            <span className="bf-val">{swing === 50 ? 'straight' : swing >= 66 ? 'triplet' : `${swing}%`}</span>
          </div>
        </div>
        <div className="bf-panel">
          <div className="bf-panel-head">kit</div>
          <div className="bf-kit-row">
            {['808', '909', '707'].map((k) => (
              <button key={k} className={`bf-kit-btn ${kit === k ? 'on' : ''}`} onClick={() => setKit(k)}>{k}</button>
            ))}
          </div>
        </div>
      </aside>

      <window.Tweaks
        theme={theme} setTheme={setTheme}
        view={view} setView={setView}
        kit={kit} setKit={setKit}
        grouping={grouping} setGrouping={setGrouping}
        groupingOptions={groupingOptions}
      />
    </main>
  );
}

Object.assign(window, { Practice });
