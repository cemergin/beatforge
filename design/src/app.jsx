// BeatForge — top-level app shell with tabbed router
const { useState, useEffect, useRef, useMemo, useCallback } = React;

function App() {
  const engineRef = useRef(null);
  const [tab, setTab] = useState(() => localStorage.getItem('bf_tab') || 'practice');
  const [patternId, setPatternId] = useState(() => localStorage.getItem('bf_pattern') || 'karsilama');
  const [theme, setTheme] = useState(() => localStorage.getItem('bf_theme') || 'warm');
  const [studioSeed, setStudioSeed] = useState(null);
  const [playing, setPlaying] = useState(false);
  const [userPatternsBump, setUserPatternsBump] = useState(0);

  useEffect(() => { localStorage.setItem('bf_tab', tab); }, [tab]);
  useEffect(() => { document.documentElement.dataset.theme = theme; localStorage.setItem('bf_theme', theme); }, [theme]);

  // Init engine once
  useEffect(() => {
    const e = new window.AudioEngine();
    engineRef.current = e;
    e.setKit(localStorage.getItem('bf_kit') || '808');
    return () => e.stop();
  }, []);

  // Stop on tab change
  useEffect(() => {
    const e = engineRef.current; if (!e) return;
    e.stop();
    setPlaying(false);
  }, [tab]);

  const goToPractice = (id) => {
    if (id) setPatternId(id);
    setTab('practice');
  };
  const goToLibrary = () => setTab('library');
  const goToStudio = (seedPattern) => {
    if (seedPattern) setStudioSeed(seedPattern);
    else setStudioSeed(null);
    setTab('studio');
  };

  const loadFromLibrary = (id) => {
    // If it's a user pattern, inject into window patternById resolution
    setPatternId(id);
    setTab('practice');
  };

  // Extend patternById to also resolve user patterns (run once)
  useEffect(() => {
    if (window._bfPatternByIdPatched) return;
    const original = window.patternById;
    window._bfPatternByIdPatched = true;
    window.patternById = (id) => {
      const hit = original(id);
      if (hit) return hit;
      try {
        const user = (window.loadUserPatterns ? window.loadUserPatterns() : []).find((p) => p.id === id);
        return user || original('karsilama');
      } catch { return original('karsilama'); }
    };
  }, []);

  return (
    <div className="bf-root" data-theme={theme}>
      <header className="bf-top">
        <div className="bf-brand">
          <span className="bf-logo" />
          <span className="bf-wordmark">BeatForge</span>
          <span className="bf-tag">/{tab}</span>
        </div>
        <nav className="bf-topnav">
          {['practice', 'studio', 'library'].map((t) => (
            <button key={t} className={`bf-chip ${tab === t ? 'on' : 'ghost'}`} onClick={() => setTab(t)}>
              {t[0].toUpperCase() + t.slice(1)}
            </button>
          ))}
        </nav>
        <div className="bf-topright">
          {tab === 'practice' && <span className="bf-edit-hint" title="Click any cell to cycle: off → accent → ghost → off">tap cells to edit</span>}
          {tab === 'studio' && <span className="bf-edit-hint">building new pattern</span>}
          {tab === 'library' && <span className="bf-edit-hint">{(window.PATTERNS || []).length} rhythms</span>}
          <div className="bf-theme-seg" role="group" aria-label="theme">
            {['warm', 'noir', 'paper'].map((t) => (
              <button
                key={t}
                className={`bf-theme-btn bf-theme-${t} ${theme === t ? 'on' : ''}`}
                onClick={() => setTheme(t)}
                title={t}
                aria-label={t}
              >
                <span className="bf-theme-swatch" />
                <span className="bf-theme-name">{t}</span>
              </button>
            ))}
          </div>
        </div>
      </header>

      {tab === 'practice' && (
        <window.Practice
          engineRef={engineRef}
          playing={playing} setPlaying={setPlaying}
          patternId={patternId} setPatternId={setPatternId}
          goToStudio={goToStudio}
          goToLibrary={goToLibrary}
        />
      )}
      {tab === 'library' && (
        <window.Library
          engineRef={engineRef}
          onLoadToPractice={loadFromLibrary}
          onOpenInStudio={(p) => goToStudio(p)}
          goToStudio={() => goToStudio(null)}
        />
      )}
      {tab === 'studio' && (
        <window.Studio
          engineRef={engineRef}
          playing={playing} setPlaying={setPlaying}
          seed={studioSeed}
          onSaved={(p) => {
            setUserPatternsBump((n) => n + 1);
            setPatternId(p.id);
          }}
          goToPractice={(id) => goToPractice(id)}
          goToLibrary={goToLibrary}
        />
      )}
    </div>
  );
}

Object.assign(window, { App });
