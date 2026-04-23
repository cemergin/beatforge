// BeatForge — Library module (full-page catalog of all 30 rhythms + user patterns)
const { useState: useLS, useMemo: useLM, useEffect: useLE, useRef: useLR } = React;

function loadUserPatterns() {
  try { return JSON.parse(localStorage.getItem('bf_user_patterns') || '[]'); }
  catch { return []; }
}
function saveUserPatterns(list) {
  localStorage.setItem('bf_user_patterns', JSON.stringify(list));
}

function PatternPreviewDots({ pattern, size = 10 }) {
  return <window.BeatDots grouping={pattern.grouping} currentStep={-1} size={size} />;
}

function Library({ engineRef, onLoadToPractice, onOpenInStudio, goToStudio }) {
  const [q, setQ] = useLS('');
  const [sig, setSig] = useLS('all');
  const [diff, setDiff] = useLS('all');
  const [region, setRegion] = useLS('all');
  const [expanded, setExpanded] = useLS(null);
  const [previewId, setPreviewId] = useLS(null);
  const [userPatterns, setUserPatterns] = useLS(loadUserPatterns);

  const all = useLM(() => [
    ...window.PATTERNS,
    ...userPatterns.map((p) => ({ ...p, isUser: true })),
  ], [userPatterns]);

  const regions = useLM(() => {
    const s = new Set();
    window.PATTERNS.forEach((p) => {
      const r = (p.origin || '').split('·')[0].trim();
      if (r) s.add(r);
    });
    return ['all', ...Array.from(s).sort()];
  }, []);

  const filtered = useLM(() => {
    const qq = q.trim().toLowerCase();
    return all.filter((p) => {
      if (sig !== 'all') {
        if (sig === 'poly' && !p.poly) return false;
        if (sig !== 'poly' && p.timeSig !== sig) return false;
      }
      if (diff !== 'all' && p.difficulty !== diff) return false;
      if (region !== 'all' && !(p.origin || '').startsWith(region)) return false;
      if (qq && !(
        p.name.toLowerCase().includes(qq) ||
        (p.origin || '').toLowerCase().includes(qq) ||
        (p.tradition || '').toLowerCase().includes(qq) ||
        (p.story || '').toLowerCase().includes(qq)
      )) return false;
      return true;
    });
  }, [all, q, sig, diff, region]);

  const sigs = ['all', '4/4', '3/4', '5/8', '7/8', '9/8', '10/8', '11/8', '12/8', 'poly'];
  const diffs = ['all', 'beginner', 'intermediate', 'advanced'];

  // Inline audio preview (pause on leave)
  const preview = async (p) => {
    const e = engineRef.current; if (!e) return;
    await e.ensureCtx();
    e.loadPattern({ ...p, grouping: p.grouping });
    e.setBpm(p.bpm.default);
    e.start();
    setPreviewId(p.id);
  };
  const stopPreview = () => {
    const e = engineRef.current; if (!e) return;
    e.stop();
    setPreviewId(null);
  };

  useLE(() => () => stopPreview(), []);

  const deleteUser = (id) => {
    const next = userPatterns.filter((p) => p.id !== id);
    setUserPatterns(next); saveUserPatterns(next);
  };

  return (
    <main className="bf-lib-page">
      <header className="bf-lib-hero">
        <div>
          <h1 className="bf-lib-title">Rhythm Library</h1>
          <p className="bf-lib-sub">
            {window.PATTERNS.length} curated rhythms across Anatolia, the Balkans,
            West & North Africa, the Caribbean, India, and the club floor.
            {userPatterns.length > 0 && <> Plus <b>{userPatterns.length}</b> of your own.</>}
          </p>
        </div>
        <div className="bf-lib-search">
          <input
            className="bf-search-input"
            placeholder="search by name, region, tradition…"
            value={q}
            onChange={(e) => setQ(e.target.value)}
          />
        </div>
      </header>

      <div className="bf-lib-filters">
        <div className="bf-filter-group">
          <span className="bf-mini-label">meter</span>
          <div className="bf-chip-row">
            {sigs.map((s) => (
              <button key={s} className={`bf-chip ${sig === s ? 'on' : 'ghost'}`} onClick={() => setSig(s)}>{s}</button>
            ))}
          </div>
        </div>
        <div className="bf-filter-group">
          <span className="bf-mini-label">level</span>
          <div className="bf-chip-row">
            {diffs.map((s) => (
              <button key={s} className={`bf-chip ${diff === s ? 'on' : 'ghost'}`} onClick={() => setDiff(s)}>{s}</button>
            ))}
          </div>
        </div>
        <div className="bf-filter-group">
          <span className="bf-mini-label">region</span>
          <div className="bf-chip-row">
            {regions.map((s) => (
              <button key={s} className={`bf-chip ${region === s ? 'on' : 'ghost'}`} onClick={() => setRegion(s)}>{s}</button>
            ))}
          </div>
        </div>
        <div className="bf-lib-count">{filtered.length} / {all.length}</div>
      </div>

      <div className="bf-lib-full-grid">
        {filtered.map((p) => {
          const isPreviewing = previewId === p.id;
          const isExpanded = expanded === p.id;
          return (
            <article
              key={p.id}
              className={`bf-lib-tile ${isPreviewing ? 'previewing' : ''} ${p.isUser ? 'user' : ''}`}
            >
              <div className="bf-lib-tile-head">
                <div>
                  <div className="bf-lib-tile-name">{p.name}</div>
                  <div className="bf-lib-tile-origin">{p.origin}</div>
                </div>
                <div className="bf-lib-tile-badges">
                  <span className="bf-meta-badge small">{p.timeSig}</span>
                  <span className="bf-meta-badge small alt">{p.grouping.join('+')}</span>
                </div>
              </div>

              <div className="bf-lib-tile-dots">
                <PatternPreviewDots pattern={p} />
              </div>

              <div className="bf-lib-tile-meta">
                <span>{p.bpm.default} bpm</span>
                <span className={`bf-diff bf-diff-${p.difficulty}`}>{p.difficulty}</span>
                {p.poly && <span className="bf-poly-badge">polyrhythm</span>}
                {p.isUser && <span className="bf-user-badge">yours</span>}
              </div>

              {p.tradition && <div className="bf-lib-tile-tradition">{p.tradition}</div>}

              {isExpanded && p.story && (
                <div className="bf-lib-tile-story">{p.story}</div>
              )}

              <div className="bf-lib-tile-actions">
                <button
                  className={`bf-chip ${isPreviewing ? 'on' : 'ghost'}`}
                  onClick={() => isPreviewing ? stopPreview() : preview(p)}
                >
                  {isPreviewing ? '■ stop' : '▶ preview'}
                </button>
                <button className="bf-chip ghost" onClick={() => onLoadToPractice(p.id)}>practice</button>
                <button className="bf-chip ghost" onClick={() => onOpenInStudio(p)}>remix</button>
                {p.story && (
                  <button
                    className="bf-chip ghost sm"
                    onClick={() => setExpanded(isExpanded ? null : p.id)}
                  >{isExpanded ? 'less' : 'story'}</button>
                )}
                {p.isUser && (
                  <button className="bf-chip ghost sm danger" onClick={() => deleteUser(p.id)}>delete</button>
                )}
              </div>
            </article>
          );
        })}
        {filtered.length === 0 && (
          <div className="bf-lib-empty">
            <p>No rhythms match. Loosen the filters, or <button className="bf-linkbtn" onClick={goToStudio}>build one in Studio</button>.</p>
          </div>
        )}
      </div>
    </main>
  );
}

Object.assign(window, { Library, loadUserPatterns, saveUserPatterns });
