// BeatForge — Studio module (build your own pattern)
const { useState: useSS, useEffect: useSE, useMemo: useSM, useRef: useSR, useCallback: useSC } = React;

const PRESET_METERS = [
  { label: '4/4', steps: 16, stepUnit: 16, grouping: [4,4,4,4], timeSig: '4/4' },
  { label: '3/4', steps: 12, stepUnit: 16, grouping: [4,4,4], timeSig: '3/4' },
  { label: '6/8', steps: 6,  stepUnit: 8,  grouping: [3,3], timeSig: '6/8' },
  { label: '5/8', steps: 5,  stepUnit: 8,  grouping: [2,3], timeSig: '5/8' },
  { label: '7/8', steps: 7,  stepUnit: 8,  grouping: [2,2,3], timeSig: '7/8' },
  { label: '9/8', steps: 9,  stepUnit: 8,  grouping: [2,2,2,3], timeSig: '9/8' },
  { label: '11/8', steps: 11, stepUnit: 8, grouping: [2,2,3,2,2], timeSig: '11/8' },
  { label: '12/8', steps: 12, stepUnit: 8, grouping: [3,3,3,3], timeSig: '12/8' },
];

const DEFAULT_TRACKS = ['KK', 'SN', 'HH'];
const ALL_VOICES = ['KK', 'SN', 'HH', 'OH', 'CP', 'RS', 'CB', 'TM'];
const VOICE_LABELS = {
  KK: 'Kick', SN: 'Snare', HH: 'Hat', OH: 'Open Hat',
  CP: 'Clap', RS: 'Rim', CB: 'Cowbell', TM: 'Tom',
};

function emptyTracks(voices, steps) {
  const t = {};
  voices.forEach((v) => { t[v] = new Array(steps).fill(0); });
  return t;
}

function Studio({ engineRef, playing, setPlaying, seed, onSaved, goToPractice, goToLibrary }) {
  // Base draft state — seeded from Practice if "remix" came from there
  const init = useSM(() => {
    if (seed) {
      const tracks = {};
      Object.keys(seed.tracks).forEach((k) => {
        const td = seed.tracks[k];
        tracks[k] = Array.isArray(td) ? [...td] : { ...td, pattern: [...td.pattern] };
      });
      return {
        id: 'user_' + Date.now(),
        name: (seed.name || 'Untitled') + ' (remix)',
        origin: 'Your Studio',
        tradition: 'Custom',
        timeSig: seed.timeSig || '4/4',
        grouping: [...seed.grouping],
        stepUnit: seed.stepUnit,
        steps: seed.steps,
        tracks,
        bpm: { ...seed.bpm },
        difficulty: seed.difficulty || 'intermediate',
        story: '',
        poly: !!seed.poly,
      };
    }
    return {
      id: 'user_' + Date.now(),
      name: 'Untitled',
      origin: 'Your Studio',
      tradition: 'Custom',
      timeSig: '4/4',
      grouping: [4,4,4,4],
      stepUnit: 16,
      steps: 16,
      tracks: emptyTracks(DEFAULT_TRACKS, 16),
      bpm: { default: 480, min: 120, max: 800 },
      difficulty: 'intermediate',
      story: '',
      poly: false,
    };
  }, [seed]);

  const [draft, setDraft] = useSS(init);
  const [bpm, setBpm] = useSS(init.bpm.default);
  const [kit, setKit] = useSS(() => localStorage.getItem('bf_kit') || '808');
  const [cursors, setCursors] = useSS({});
  const [view, setView] = useSS('linear');
  const [saveFlash, setSaveFlash] = useSS(false);

  // Only reset draft when seed actually changes (not on every render)
  const lastSeedRef = useSR(seed);
  useSE(() => {
    if (lastSeedRef.current !== seed) {
      lastSeedRef.current = seed;
      setDraft(init);
      setBpm(init.bpm.default);
    }
  }, [seed, init]);

  // Hook the engine
  useSE(() => {
    const e = engineRef.current; if (!e) return;
    e.onStep = (snap) => setCursors(snap.cursors);
    return () => { if (e) e.onStep = null; };
  }, []);

  useSE(() => {
    const e = engineRef.current; if (!e) return;
    e.loadPattern(draft);
  }, [draft]);

  useSE(() => { engineRef.current && engineRef.current.setBpm(bpm); }, [bpm]);
  useSE(() => { engineRef.current && engineRef.current.setKit(kit); }, [kit]);

  const toggle = useSC(async () => {
    const e = engineRef.current; if (!e) return;
    await e.ensureCtx();
    if (playing) { e.stop(); setPlaying(false); }
    else { e.setBpm(bpm); e.start(); setPlaying(true); }
  }, [playing, bpm]);

  // Meter preset picker
  const applyMeter = (m) => {
    const newTracks = {};
    Object.keys(draft.tracks).forEach((v) => {
      newTracks[v] = new Array(m.steps).fill(0);
    });
    setDraft({ ...draft, steps: m.steps, stepUnit: m.stepUnit, grouping: m.grouping, timeSig: m.label });
    Object.assign(newTracks); // no-op placeholder for clarity
    setDraft((d) => ({ ...d, steps: m.steps, stepUnit: m.stepUnit, grouping: m.grouping, timeSig: m.label, tracks: newTracks }));
  };

  // Grouping editor
  const groupingValid = useSM(() => draft.grouping.reduce((a,b) => a+b, 0) === draft.steps, [draft.grouping, draft.steps]);
  const setGrouping = (g) => setDraft({ ...draft, grouping: g });
  const adjustGroup = (idx, delta) => {
    const g = [...draft.grouping];
    const nv = g[idx] + delta;
    if (nv < 1) return;
    g[idx] = nv;
    setGrouping(g);
  };
  const addGroup = () => setGrouping([...draft.grouping, 2]);
  const removeGroup = (idx) => {
    if (draft.grouping.length <= 1) return;
    setGrouping(draft.grouping.filter((_, i) => i !== idx));
  };
  const autoNormalize = () => {
    // Rebuild a grouping that sums to steps by distributing 2s and 3s
    const n = draft.steps;
    const g = [];
    let left = n;
    while (left > 0) { g.push(left >= 3 && left % 2 === 1 ? 3 : 2); left -= g[g.length-1]; }
    setGrouping(g);
  };

  const addVoice = (v) => {
    if (draft.tracks[v]) return;
    setDraft({ ...draft, tracks: { ...draft.tracks, [v]: new Array(draft.steps).fill(0) } });
  };
  const removeVoice = (v) => {
    const t = { ...draft.tracks }; delete t[v];
    setDraft({ ...draft, tracks: t });
  };

  const toggleStep = useSC((tr, s) => {
    const t = { ...draft.tracks };
    const arr = [...t[tr]];
    arr[s] = arr[s] === 0 ? 2 : arr[s] === 2 ? 1 : 0;
    t[tr] = arr;
    setDraft({ ...draft, tracks: t });
  }, [draft]);

  const save = () => {
    if (!groupingValid) { alert('Grouping must sum to step count.'); return; }
    const list = window.loadUserPatterns();
    const id = 'user_' + Date.now();
    const saved = { ...draft, id };
    list.push(saved);
    window.saveUserPatterns(list);
    setDraft({ ...draft, id });
    setSaveFlash(true);
    setTimeout(() => setSaveFlash(false), 1400);
    onSaved && onSaved(saved);
  };

  const clearAll = () => {
    const t = {};
    Object.keys(draft.tracks).forEach((v) => { t[v] = new Array(draft.steps).fill(0); });
    setDraft({ ...draft, tracks: t });
  };

  const grid = ({
    linear: <window.LinearGrid pattern={draft} cursors={cursors} onToggle={toggleStep} />,
    pill: <window.PillGrid pattern={draft} cursors={cursors} onToggle={toggleStep} />,
    circular: <window.CircularGrid pattern={draft} cursors={cursors} size={420} onToggle={toggleStep} />,
  })[view];

  const voicesInUse = Object.keys(draft.tracks);
  const availableVoices = ALL_VOICES.filter((v) => !voicesInUse.includes(v));

  return (
    <main className="bf-studio">
      <aside className="bf-studio-left">
        <div className="bf-studio-card">
          <div className="bf-mini-label">pattern name</div>
          <input
            className="bf-studio-name-input"
            value={draft.name}
            onChange={(e) => setDraft({ ...draft, name: e.target.value })}
          />
          <div className="bf-row">
            <div className="bf-meta-badge">{draft.timeSig}</div>
            <div className="bf-meta-badge alt">{draft.grouping.join('+')}</div>
            <div className="bf-meta-badge alt">{draft.steps} steps</div>
          </div>
        </div>

        <div className="bf-bpm-hero sm">
          <div className="bf-bpm-num">{bpm}</div>
          <div className="bf-bpm-unit">BPM <span style={{opacity:0.45,fontSize:'0.7em'}}>· step/min</span></div>
          <div className="bf-bpm-controls">
            <button onClick={() => setBpm((b) => Math.max(30, b - 4))}>−</button>
            <input type="range" min={30} max={800} value={bpm} onChange={(e) => setBpm(Number(e.target.value))} />
            <button onClick={() => setBpm((b) => Math.min(800, b + 4))}>+</button>
          </div>
        </div>

        <button className={`bf-play ${playing ? 'on' : ''}`} onClick={toggle}>
          {playing ? (<span><span className="bf-stop-ico" /> stop</span>) : (<span><span className="bf-play-ico" /> play</span>)}
        </button>

        <div className="bf-studio-actions">
          <button className={`bf-chip ${saveFlash ? 'on' : ''}`} onClick={save}>{saveFlash ? '✓ saved to library' : '💾 save to library'}</button>
          <button className="bf-chip ghost" onClick={clearAll}>clear all</button>
        </div>
      </aside>

      <section className="bf-studio-center">
        <div className="bf-studio-section">
          <div className="bf-studio-section-head">
            <span className="bf-mini-label">meter</span>
            <span className="bf-studio-hint">pick a preset or build your own</span>
          </div>
          <div className="bf-chip-row wrap">
            {PRESET_METERS.map((m) => (
              <button key={m.label} className={`bf-chip ${draft.timeSig === m.label ? 'on' : 'ghost'}`} onClick={() => applyMeter(m)}>{m.label}</button>
            ))}
          </div>
        </div>

        <div className="bf-studio-section">
          <div className="bf-studio-section-head">
            <span className="bf-mini-label">grouping</span>
            <span className={`bf-studio-sum ${groupingValid ? 'ok' : 'bad'}`}>
              sums to {draft.grouping.reduce((a,b)=>a+b,0)} / {draft.steps}
              {!groupingValid && <button className="bf-linkbtn" onClick={autoNormalize}>auto-fix</button>}
            </span>
          </div>
          <div className="bf-studio-grouping">
            {draft.grouping.map((g, i) => (
              <div key={i} className="bf-group-pill" style={{ borderColor: `var(--grp-${(i % 7) + 1})`, color: `var(--grp-${(i % 7) + 1})` }}>
                <button className="bf-gp-step" onClick={() => adjustGroup(i, -1)}>−</button>
                <span className="bf-gp-val">{g}</span>
                <button className="bf-gp-step" onClick={() => adjustGroup(i, +1)}>+</button>
                <button className="bf-gp-x" onClick={() => removeGroup(i)} title="remove">×</button>
              </div>
            ))}
            <button className="bf-chip ghost sm" onClick={addGroup}>+ add group</button>
          </div>
          <div className="bf-studio-dots">
            <window.BeatDots grouping={draft.grouping} currentStep={-1} size={10} />
          </div>
        </div>

        <div className="bf-studio-section">
          <div className="bf-studio-section-head">
            <span className="bf-mini-label">pattern</span>
            <div className="bf-view-switch">
              {['linear', 'pill', 'circular'].map((v) => (
                <button key={v} className={`bf-view-btn sm ${view === v ? 'on' : ''}`} onClick={() => setView(v)}>{v}</button>
              ))}
            </div>
          </div>
          <div className="bf-studio-stage">{grid}</div>
        </div>

        <div className="bf-studio-section">
          <div className="bf-studio-section-head">
            <span className="bf-mini-label">voices</span>
          </div>
          <div className="bf-chip-row wrap">
            {voicesInUse.map((v) => (
              <span key={v} className="bf-voice-chip on">
                {VOICE_LABELS[v] || v} <button onClick={() => removeVoice(v)} title="remove voice">×</button>
              </span>
            ))}
            {availableVoices.length > 0 && <span className="bf-mini-label" style={{alignSelf: 'center'}}>add:</span>}
            {availableVoices.map((v) => (
              <button key={v} className="bf-chip ghost sm" onClick={() => addVoice(v)}>+ {VOICE_LABELS[v] || v}</button>
            ))}
          </div>
        </div>
      </section>

      <aside className="bf-studio-right">
        <div className="bf-panel">
          <div className="bf-panel-head">kit</div>
          <div className="bf-kit-row">
            {['808','909','707'].map((k) => (
              <button key={k} className={`bf-kit-btn ${kit === k ? 'on' : ''}`} onClick={() => setKit(k)}>{k}</button>
            ))}
          </div>
        </div>

        <div className="bf-panel">
          <div className="bf-panel-head">difficulty</div>
          <div className="bf-seg">
            {['beginner','intermediate','advanced'].map((d) => (
              <button key={d} className={draft.difficulty === d ? 'on' : ''} onClick={() => setDraft({ ...draft, difficulty: d })}>{d}</button>
            ))}
          </div>
        </div>

        <div className="bf-panel">
          <div className="bf-panel-head">notes</div>
          <textarea
            className="bf-studio-story"
            placeholder="How does this rhythm feel? When would you play it?"
            value={draft.story}
            onChange={(e) => setDraft({ ...draft, story: e.target.value })}
          />
        </div>

        <div className="bf-panel">
          <div className="bf-panel-head">next</div>
          <div className="bf-stack">
            <button className="bf-chip ghost" onClick={() => goToPractice(draft.id)}>practice this →</button>
            <button className="bf-chip ghost" onClick={goToLibrary}>browse library →</button>
          </div>
        </div>
      </aside>
    </main>
  );
}

Object.assign(window, { Studio });
