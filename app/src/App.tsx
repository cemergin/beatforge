import { Suspense, lazy, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { SoundEngine } from './audio/runtime/sound-engine';
import { Practice } from './modes/Practice/Practice';
import type { KitId, Pattern } from './patterns/types';
import { SessionProvider, useSession } from './modules/session';
import { PATTERNS } from './patterns/seed';

// Library + Studio + Sound are split into their own chunks. Practice
// is the landing tab and stays in the main bundle.
const Library = lazy(() => import('./modes/Library/Library').then((m) => ({ default: m.Library })));
const Studio = lazy(() => import('./modes/Studio/Studio').then((m) => ({ default: m.Studio })));
const Sound = lazy(() => import('./modes/Sound/Sound').then((m) => ({ default: m.Sound })));
const PatternsSandbox = lazy(() => import('./modes/_Patterns/PatternsSandbox').then((m) => ({ default: m.PatternsSandbox })));
import { patternById, registerPatternSource } from './patterns/seed';
import { deserializePattern } from './patterns/serialize';
import { loadAllSafe } from './lib/db';
import { getMasterVolume } from './lib/storage';
import { logError } from './lib/log';
import { readUrlState, type Tab, type UrlState } from './lib/urlState';
import { UpdateBanner } from './components/UpdateBanner';
import './styles/app.css';

type Theme = 'warm' | 'noir' | 'paper';
const THEMES: readonly Theme[] = ['warm', 'noir', 'paper'];

const DEV_MODE = import.meta.env.DEV;

// Pull the URL parser from a separate module so it's pure + testable.
function readCurrentUrl(): UrlState {
  return readUrlState(window.location.search, {
    seedExists: (id) => !!patternById(id),
    devMode: DEV_MODE,
  });
}

export default function App() {
  // useState lazy initializer creates the engine once. Refs were the
  // older pattern but React 19 lint flags `ref.current` reads during
  // render — a lazy useState is the supported equivalent.
  const [engine] = useState(() => new SoundEngine());

  // On unmount (HMR, full-tree teardown) release the Worker + ctx so
  // they don't leak across reloads. React 19 StrictMode double-mounts
  // in dev; dispose() is idempotent.
  useEffect(() => {
    return () => { engine.dispose(); };
  }, [engine]);

  const [theme, setTheme] = useState<Theme>(() => {
    const raw = localStorage.getItem('bf_theme');
    return THEMES.includes(raw as Theme) ? (raw as Theme) : 'warm';
  });

  const [tab, setTab] = useState<Tab>(() => {
    // URL first, so shared links are the source of truth on load.
    const url = readCurrentUrl();
    if (url.tab) return url.tab;
    const t = localStorage.getItem('bf_tab');
    if (t === 'library' || t === 'studio' || t === 'practice' || t === 'sound') return t;
    // _patterns is dev-only — never restore it in production builds.
    if (t === '_patterns' && DEV_MODE) return '_patterns';
    return 'practice';
  });

  const [patternId, setPatternId] = useState<string>(() => {
    const url = readCurrentUrl();
    if (url.pattern) return url.pattern;
    return localStorage.getItem('bf_pattern') || 'karsilama';
  });

  // Library → Studio handoff: a full Pattern object (seed, read-only).
  const [initialStudioPattern, setInitialStudioPattern] = useState<Pattern | null>(null);

  // Practice → Sound handoff: a saved-soundPattern id. Cleared by Sound
  // after consumption so a navigation back to Sound (without a fresh
  // Practice click) doesn't re-load the same pattern.
  const [initialSoundPatternId, setInitialSoundPatternId] = useState<string | null>(null);

  // User-pattern cache so Practice/Library can resolve them by id.
  const userCacheRef = useRef<Map<string, Pattern>>(new Map());
  // Transient patterns decoded from ?p= share links. Not persisted to IDB;
  // live only in-memory for the session. Keyed by a stable share id.
  const sharedPatternsRef = useRef<Map<string, Pattern>>(new Map());
  // Bumped whenever non-seed pattern sources change (user cache hydrated,
  // shared pattern registered). URL-sync + Practice can depend on this
  // without using the refs' identity.
  const [patternSourcesTick, setPatternSourcesTick] = useState(0);

  const refreshUserCache = useCallback(async () => {
    const all = await loadAllSafe();
    const map = new Map<string, Pattern>();
    for (const entry of all) {
      if (entry.pattern) map.set(entry.pattern.id, entry.pattern);
    }
    userCacheRef.current = map;
    setPatternSourcesTick((n) => n + 1);
  }, []);

  // Expose user patterns + shared patterns to seed.patternById.
  useEffect(() => {
    const unregisterUser = registerPatternSource(
      (id) => userCacheRef.current.get(id),
    );
    const unregisterShared = registerPatternSource(
      (id) => sharedPatternsRef.current.get(id),
    );
    // eslint-disable-next-line react-hooks/set-state-in-effect -- async IDB hydration on mount.
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
      setPatternSourcesTick((n) => n + 1);
      setPatternId(shareId);
      setTab('practice');
      // URL sync effect below will re-encode as ?p= once the sources tick
      // propagates — we don't rewrite the URL here to avoid a flicker.
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

  // Reflect (tab, patternId) into the URL. For seed patterns we write
  // `?pattern=<id>` (compact, stable). For user/shared patterns — which
  // only exist in this browser's storage — we write `?p=<hash>` so the
  // URL is genuinely shareable. Copying from the URL bar "just works"
  // regardless of whether the pattern is built-in or authored locally.
  //
  // Short-circuit: patternSourcesTick bumps on every cache hydration
  // (Studio save, Library load, etc). Without this guard we'd
  // re-encode the user pattern on every bump even if (tab, patternId)
  // didn't change.
  const lastEncodedRef = useRef<{ tab: Tab; patternId: string } | null>(null);
  useEffect(() => {
    if (tab !== 'practice') {
      const nextSearch = `?tab=${tab}`;
      if (window.location.search === nextSearch) return;
      window.history.replaceState(null, '', `${window.location.pathname}${nextSearch}${window.location.hash}`);
      lastEncodedRef.current = { tab, patternId };
      return;
    }
    // Is this a seed pattern we can round-trip via short id?
    const resolved = patternById(patternId);
    const isSeed = !!resolved
      && !userCacheRef.current.has(patternId)
      && !sharedPatternsRef.current.has(patternId);

    if (isSeed) {
      const search = `?tab=practice&pattern=${encodeURIComponent(patternId)}`;
      if (window.location.search === search) return;
      window.history.replaceState(null, '', `${window.location.pathname}${search}${window.location.hash}`);
      lastEncodedRef.current = { tab, patternId };
      return;
    }

    // User / shared pattern → encode full pattern into ?p=<hash> so it
    // resolves for recipients who don't have it in their storage.
    if (!resolved) return;   // pattern cache not hydrated yet — skip this tick
    // Skip the expensive serialize round-trip if (tab, patternId) hasn't
    // changed since we last wrote a hash URL — patternSourcesTick alone
    // shouldn't trigger a re-encode.
    const last = lastEncodedRef.current;
    if (last && last.tab === tab && last.patternId === patternId) return;
    let cancelled = false;
    (async () => {
      try {
        const { serializePattern } = await import('./patterns/serialize');
        const hash = await serializePattern(resolved);
        if (cancelled) return;
        const search = `?tab=practice&p=${hash}`;
        if (window.location.search === search) return;
        window.history.replaceState(null, '', `${window.location.pathname}${search}${window.location.hash}`);
        lastEncodedRef.current = { tab, patternId };
      } catch {
        // Fall back to short-id URL if encoding fails — better than nothing.
        const search = `?tab=practice&pattern=${encodeURIComponent(patternId)}`;
        if (window.location.search !== search) {
          window.history.replaceState(null, '', `${window.location.pathname}${search}${window.location.hash}`);
        }
        lastEncodedRef.current = { tab, patternId };
      }
    })();
    return () => { cancelled = true; };
  }, [tab, patternId, patternSourcesTick]);

  // Browser back/forward: re-read URL and apply to state. The URL-sync effect
  // above is guarded against no-op replaceState, so this won't loop.
  useEffect(() => {
    const onPop = () => {
      const url = readCurrentUrl();
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

  // Tab switches stop in-flight playback (the user clicks play in
  // the new tab to resume). State stays sticky via the session —
  // pattern hits, channel sounds, kit, and bpm carry over without
  // the audio context jank of cross-tab continuation.
  const switchTab = (next: Tab) => {
    if (next !== tab) {
      engine.stop();
      setTab(next);
    }
  };

  const loadInPractice = useCallback((id: string) => {
    // Loading a NEW pattern is a deliberate reset point — stop any
    // in-flight playback so the user starts fresh on the new piece.
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

  // Initial pattern for the session — derived from the current patternId
  // at provider mount. The ModeShell child reconciles further patternId
  // changes via session.loadPattern.
  const initialPatternMemo = useMemo(
    () => patternById(patternId) ?? PATTERNS[0],
    // patternId is intentionally read once at provider construction;
    // subsequent patternId changes go through ModeShell's bridge effect.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  );

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
          <button
            className={`bf-chip ${tab === 'sound' ? 'on' : 'ghost'}`}
            onClick={() => switchTab('sound')}
            type="button"
          >
            Sound
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
            {THEMES.map((t) => (
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

      <SessionProvider engine={engine} initialPattern={initialPatternMemo}>
        <ModeShell
          tab={tab}
          engine={engine}
          patternId={patternId}
          setPatternId={setPatternId}
          initialStudioPattern={initialStudioPattern}
          setInitialStudioPattern={setInitialStudioPattern}
          initialSoundPatternId={initialSoundPatternId}
          setInitialSoundPatternId={setInitialSoundPatternId}
          setTab={setTab}
          loadInPractice={loadInPractice}
          openInStudio={openInStudio}
          refreshUserCache={refreshUserCache}
        />
      </SessionProvider>
      <UpdateBanner />
    </div>
  );
}

interface ModeShellProps {
  tab: Tab;
  engine: SoundEngine;
  patternId: string;
  setPatternId: (id: string) => void;
  initialStudioPattern: Pattern | null;
  setInitialStudioPattern: (p: Pattern | null) => void;
  initialSoundPatternId: string | null;
  setInitialSoundPatternId: (id: string | null) => void;
  setTab: (t: Tab) => void;
  loadInPractice: (id: string) => void;
  openInStudio: (p: Pattern) => void;
  refreshUserCache: () => Promise<void>;
}

/** Bridges App-level patternId ↔ session.pattern. When patternId changes
 *  externally (URL nav, Library handoff), call session.loadPattern so
 *  the session sees the new pattern. Sticky edits within session.pattern
 *  flow back via session.setPattern — patternId tracks "what was last
 *  loaded" while session.pattern tracks "what's playing right now,
 *  including in-flight edits." */
function ModeShell({
  tab, engine, patternId, setPatternId,
  initialStudioPattern, setInitialStudioPattern,
  initialSoundPatternId, setInitialSoundPatternId,
  setTab, loadInPractice, openInStudio, refreshUserCache,
}: ModeShellProps) {
  const session = useSession();
  // patternId → session.loadPattern when they diverge. Keeps Library
  // handoffs and URL nav as the explicit "load new" trigger; session
  // is the runtime source for the rest.
  useEffect(() => {
    if (session.pattern.id === patternId) return;
    const p = patternById(patternId);
    if (p) session.loadPattern(p);
  }, [patternId, session]);

  return (
    <>
      {tab === 'practice' && (
        <Practice
          engine={engine}
          patternId={patternId}
          onPatternChange={setPatternId}
          onOpenSoundPattern={(id) => {
            setInitialSoundPatternId(id);
            setTab('sound');
          }}
        />
      )}
      {tab === 'studio' && (
        <Suspense fallback={<div className="bf-mode-loading">loading studio…</div>}>
          <Studio
            engine={engine}
            initialPattern={initialStudioPattern}
            onConsumedInitial={() => setInitialStudioPattern(null)}
            onLoadInPractice={(id) => { refreshUserCache(); loadInPractice(id); }}
          />
        </Suspense>
      )}
      {tab === 'library' && (
        <Suspense fallback={<div className="bf-mode-loading">loading library…</div>}>
          <Library
            engine={engine}
            onLoadInPractice={loadInPractice}
            onOpenInStudio={openInStudio}
          />
        </Suspense>
      )}
      {tab === 'sound' && (
        <Suspense fallback={<div className="bf-mode-loading">loading sound lab…</div>}>
          <Sound
            initialSoundPatternId={initialSoundPatternId}
            onConsumedInitial={() => setInitialSoundPatternId(null)}
          />
        </Suspense>
      )}
      {DEV_MODE && tab === '_patterns' && (
        <Suspense fallback={<div className="bf-mode-loading">loading…</div>}>
          <PatternsSandbox engine={engine} />
        </Suspense>
      )}
    </>
  );
}
