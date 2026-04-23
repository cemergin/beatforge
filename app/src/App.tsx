import { useCallback, useEffect, useRef, useState } from 'react';
import { AudioEngine } from './audio/engine';
import { Practice } from './modes/Practice/Practice';
import { Library } from './modes/Library/Library';
import { Studio } from './modes/Studio/Studio';
import { PatternsSandbox } from './modes/_Patterns/PatternsSandbox';
import type { KitId, Pattern } from './patterns/types';
import { patternById, registerPatternSource } from './patterns/seed';
import { deserializePattern } from './patterns/serialize';
import { loadAllSafe } from './lib/db';
import { getMasterVolume } from './lib/storage';
import { logError } from './lib/errors';
import './styles/app.css';

type Theme = 'warm' | 'noir' | 'paper';
type Tab = 'practice' | 'studio' | 'library' | '_patterns';

const DEV_MODE = import.meta.env.DEV;

// Parse the current URL into a (tab, pattern) tuple. Unknown values are
// dropped — the caller falls back to localStorage/defaults.
function readUrlState(): { tab: Tab | null; pattern: string | null } {
  const params = new URLSearchParams(window.location.search);
  const rawTab = params.get('tab');
  let tab: Tab | null = null;
  if (rawTab === 'practice' || rawTab === 'studio' || rawTab === 'library') {
    tab = rawTab;
  } else if (rawTab === '_patterns' && DEV_MODE) {
    tab = '_patterns';
  }
  const rawPattern = params.get('pattern');
  // patternById resolves seed patterns + registered user sources. We only
  // validate seeds here (user patterns load async) — an unknown id falls
  // through silently.
  const pattern = rawPattern && patternById(rawPattern) ? rawPattern : null;
  return { tab, pattern };
}

export default function App() {
  const engineRef = useRef<AudioEngine | null>(null);
  if (engineRef.current === null) {
    engineRef.current = new AudioEngine();
  }
  const engine = engineRef.current;

  const [theme, setTheme] = useState<Theme>(
    () => (localStorage.getItem('bf_theme') as Theme) || 'warm',
  );

  const [tab, setTab] = useState<Tab>(() => {
    // URL first, so shared links are the source of truth on load.
    const url = readUrlState();
    if (url.tab) return url.tab;
    const t = localStorage.getItem('bf_tab');
    if (t === 'library' || t === 'studio' || t === 'practice') return t;
    // _patterns is dev-only — never restore it in production builds.
    if (t === '_patterns' && DEV_MODE) return '_patterns';
    return 'practice';
  });

  const [patternId, setPatternId] = useState<string>(() => {
    const url = readUrlState();
    if (url.pattern) return url.pattern;
    return localStorage.getItem('bf_pattern') || 'karsilama';
  });

  // Library → Studio handoff: a full Pattern object (seed, read-only).
  const [initialStudioPattern, setInitialStudioPattern] = useState<Pattern | null>(null);

  // User-pattern cache so Practice/Library can resolve them by id.
  const userCacheRef = useRef<Map<string, Pattern>>(new Map());
  // Transient patterns decoded from ?p= share links. Not persisted to IDB;
  // live only in-memory for the session. Keyed by a stable share id.
  const sharedPatternsRef = useRef<Map<string, Pattern>>(new Map());

  const refreshUserCache = useCallback(async () => {
    const all = await loadAllSafe();
    const map = new Map<string, Pattern>();
    for (const entry of all) {
      if (entry.pattern) map.set(entry.pattern.id, entry.pattern);
    }
    userCacheRef.current = map;
  }, []);

  // Expose user patterns + shared patterns to seed.patternById.
  useEffect(() => {
    const unregisterUser = registerPatternSource(
      (id) => userCacheRef.current.get(id),
    );
    const unregisterShared = registerPatternSource(
      (id) => sharedPatternsRef.current.get(id),
    );
    refreshUserCache();
    return () => { unregisterUser(); unregisterShared(); };
  }, [refreshUserCache]);

  // One-shot: decode ?p=<hash> on first load. If it decodes + validates,
  // register as a shared pattern and set as current. Also strip the ?p
  // from the URL after registering so reloading doesn't re-decode.
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const hash = params.get('p');
    if (!hash) return;

    let cancelled = false;
    (async () => {
      const pattern = await deserializePattern(hash);
      if (cancelled) return;
      if (!pattern) {
        logError('Share link invalid or corrupted', 'could not decode ?p= pattern');
        return;
      }
      const shareId = `shared-${pattern.id}-${Date.now().toString(36)}`;
      const seeded: Pattern = { ...pattern, id: shareId };
      sharedPatternsRef.current.set(shareId, seeded);
      setPatternId(shareId);
      setTab('practice');
      // Replace URL: drop ?p=, keep tab+pattern so future reloads point at
      // the transient id (which will be lost on tab close — acceptable).
      const next = new URLSearchParams({ tab: 'practice', pattern: shareId });
      window.history.replaceState(null, '', `${window.location.pathname}?${next.toString()}`);
    })();
    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    localStorage.setItem('bf_theme', theme);
  }, [theme]);

  useEffect(() => {
    localStorage.setItem('bf_tab', tab);
  }, [tab]);

  // Reflect (tab, patternId) into the URL without adding a history entry.
  // pushState would make the back-button traverse tab switches, which feels
  // broken for a single-page app. Only Practice carries ?pattern=.
  useEffect(() => {
    const params = new URLSearchParams();
    params.set('tab', tab);
    if (tab === 'practice') params.set('pattern', patternId);
    const nextSearch = `?${params.toString()}`;
    // No-op if the URL already matches — prevents replaceState loops when
    // state echoes back from popstate.
    if (window.location.search === nextSearch) return;
    const nextUrl = `${window.location.pathname}${nextSearch}${window.location.hash}`;
    window.history.replaceState(null, '', nextUrl);
  }, [tab, patternId]);

  // Browser back/forward: re-read URL and apply to state. The URL-sync effect
  // above is guarded against no-op replaceState, so this won't loop.
  useEffect(() => {
    const onPop = () => {
      const url = readUrlState();
      if (url.tab && url.tab !== tab) setTab(url.tab);
      if (url.pattern && url.pattern !== patternId) setPatternId(url.pattern);
    };
    window.addEventListener('popstate', onPop);
    return () => window.removeEventListener('popstate', onPop);
  }, [tab, patternId]);

  useEffect(() => {
    const savedKit = (localStorage.getItem('bf_kit') as KitId) || '808';
    engine.setKit(savedKit);
    engine.setMasterVolume(getMasterVolume());
    return () => { engine.stop(); };
  }, [engine]);

  // Switching tabs stops any in-flight playback from either mode.
  const switchTab = (next: Tab) => {
    if (next !== tab) {
      engine.stop();
      setTab(next);
    }
  };

  const loadInPractice = useCallback((id: string) => {
    engine.stop();
    // Ensure the cache has this id before Practice reads it (user patterns).
    refreshUserCache().finally(() => {
      setPatternId(id);
      setTab('practice');
    });
  }, [engine, refreshUserCache]);

  const openInStudio = useCallback((p: Pattern) => {
    engine.stop();
    setInitialStudioPattern(p);
    setTab('studio');
  }, [engine]);

  return (
    <div className="bf-root" data-theme={theme}>
      <header className="bf-top">
        <div className="bf-brand">
          <span className="bf-logo" />
          <span className="bf-wordmark">BeatForge</span>
          <span className="bf-tag">/{tab}</span>
        </div>
        <nav className="bf-topnav">
          <button
            className={`bf-chip ${tab === 'practice' ? 'on' : 'ghost'}`}
            onClick={() => switchTab('practice')}
            type="button"
          >
            Practice
          </button>
          <button
            className={`bf-chip ${tab === 'studio' ? 'on' : 'ghost'}`}
            onClick={() => switchTab('studio')}
            type="button"
          >
            Studio
          </button>
          <button
            className={`bf-chip ${tab === 'library' ? 'on' : 'ghost'}`}
            onClick={() => switchTab('library')}
            type="button"
          >
            Library
          </button>
          {DEV_MODE && (
            <button
              className={`bf-chip ${tab === '_patterns' ? 'on' : 'ghost'}`}
              onClick={() => switchTab('_patterns')}
              type="button"
              title="Dev-only: pattern migration sandbox"
            >
              _patterns
            </button>
          )}
        </nav>
        <div className="bf-topright">
          <div className="bf-theme-seg" role="group" aria-label="theme">
            {(['warm', 'noir', 'paper'] as Theme[]).map((t) => (
              <button
                key={t}
                className={`bf-theme-btn bf-theme-${t} ${theme === t ? 'on' : ''}`}
                onClick={() => setTheme(t)}
                title={t}
                aria-label={t}
                type="button"
              >
                <span className="bf-theme-swatch" />
                <span className="bf-theme-name">{t}</span>
              </button>
            ))}
          </div>
        </div>
      </header>

      {tab === 'practice' && (
        <Practice
          engine={engine}
          patternId={patternId}
          onPatternChange={setPatternId}
        />
      )}
      {tab === 'studio' && (
        <Studio
          engine={engine}
          initialPattern={initialStudioPattern}
          onConsumedInitial={() => setInitialStudioPattern(null)}
          onLoadInPractice={(id) => { refreshUserCache(); loadInPractice(id); }}
        />
      )}
      {tab === 'library' && (
        <Library
          engine={engine}
          onLoadInPractice={loadInPractice}
          onOpenInStudio={openInStudio}
        />
      )}
      {DEV_MODE && tab === '_patterns' && (
        <PatternsSandbox engine={engine} />
      )}
    </div>
  );
}
