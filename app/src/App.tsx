import { Suspense, lazy, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { LangPicker } from './components/LangPicker';
import { useT } from './i18n';
import { SoundEngine } from './audio/runtime/sound-engine';
import { Practice } from './modes/Practice/Practice';
import { ALL_KITS, type KitId, type Pattern } from './patterns/types';
import { SessionProvider, useSession } from './modules/session';
import { PATTERNS } from './patterns/seed';
import { makeRouter, type Router } from './modules/router';
import { registerEngineChannel, registerEngineMaster } from './audio/runtime/engine-adapters';
import { useMidiBridge } from './lib/useMidiBridge';

// Library + Studio are split into their own chunks. Practice is the
// landing tab and stays in the main bundle. The Studio component
// is the renamed Sound page; pattern + metadata + sound design all
// live in one editor on top of the shared session.
const Library = lazy(() => import('./modes/Library/Library').then((m) => ({ default: m.Library })));
const Sound = lazy(() => import('./modes/Sound/Sound').then((m) => ({ default: m.Sound })));
const Midi = lazy(() => import('./modes/Midi/Midi').then((m) => ({ default: m.Midi })));
import { patternById, registerPatternSource } from './patterns/seed';
import { deserializePattern } from './patterns/serialize';
import { loadAllSafe } from './lib/db';
import { getMasterVolume } from './lib/storage';
import { logError, logWarn } from './lib/log';
import { readUrlState, type Tab, type UrlState } from './lib/urlState';
import { UpdateBanner } from './components/UpdateBanner';
import './styles/app.css';

type Theme = 'warm' | 'noir' | 'paper';
const THEMES: readonly Theme[] = ['warm', 'noir', 'paper'];

// Pull the URL parser from a separate module so it's pure + testable.
function readCurrentUrl(): UrlState {
  return readUrlState(window.location.search, {
    seedExists: (id) => !!patternById(id),
  });
}

export default function App() {
  const t = useT();
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
    if (t === 'library' || t === 'practice' || t === 'studio' || t === '_midi') return t;
    // Old 'sound' setting → studio (the Sound page was renamed to
    // Studio; its features ported in place).
    if (t === 'sound') return 'studio';
    return 'practice';
  });

  const [patternId, setPatternId] = useState<string>(() => {
    const url = readCurrentUrl();
    if (url.pattern) return url.pattern;
    return localStorage.getItem('bf_pattern') || 'karsilama';
  });

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
        logError(t('errors.share_invalid'), 'could not decode ?p= pattern');
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
    // eslint-disable-next-line react-hooks/exhaustive-deps -- one-shot ?p= decode at mount; t reference is intentionally captured once.
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
      } catch (err) {
        // Fall back to short-id URL if encoding fails — better than nothing.
        logWarn(`${t('errors.pattern_url_encoding')} · ${err instanceof Error ? err.message : String(err)}`);
        const search = `?tab=practice&pattern=${encodeURIComponent(patternId)}`;
        if (window.location.search !== search) {
          window.history.replaceState(null, '', `${window.location.pathname}${search}${window.location.hash}`);
        }
        lastEncodedRef.current = { tab, patternId };
      }
    })();
    return () => { cancelled = true; };
  }, [tab, patternId, patternSourcesTick, t]);

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
    // Validate against the known kit list — a foreign value (older
    // kit id, manual edit, future-version persistence) would otherwise
    // flow into engine.setKit and produce a silent dead kit. Same
    // pattern as bf_theme validation.
    const raw = localStorage.getItem('bf_kit');
    const savedKit: KitId = (raw && (ALL_KITS as readonly string[]).includes(raw))
      ? (raw as KitId)
      : '808';
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
    refreshUserCache()
      .catch((err) => {
        // IDB version mismatch or quota issue — load proceeds with
        // whatever's already cached, but the user should know rather
        // than wonder why their saved pattern didn't load.
        logWarn(`${t('errors.cache_refresh_failed')} · ${err instanceof Error ? err.message : String(err)}`);
      })
      .finally(() => {
        setPatternId(id);
        setTab('practice');
      });
  }, [engine, refreshUserCache, t]);

  // Library → Studio handoff. Drops the pattern into the session
  // and opens Studio (the renamed Sound page) for sound design +
  // saving.
  const openInStudio = useCallback((p: Pattern) => {
    engine.stop();
    // The session bridge in ModeShell calls session.loadPattern when
    // patternId changes, so route through patternId for consistency.
    setPatternId(p.id);
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
          <a
            className="bf-brand-link"
            href="https://github.com/cemergin/beatforge"
            target="_blank"
            rel="noopener noreferrer"
            title={t('app.github')}
          >
            <span className="bf-logo" />
            <span className="bf-wordmark">{t('app.brand')}</span>
          </a>
          <span className="bf-tag">/{tab}</span>
        </div>
        <nav className="bf-topnav">
          <button
            className={`bf-chip ${tab === 'practice' ? 'on' : 'ghost'}`}
            onClick={() => switchTab('practice')}
            type="button"
          >
            {t('nav.practice')}
          </button>
          <button
            className={`bf-chip ${tab === 'library' ? 'on' : 'ghost'}`}
            onClick={() => switchTab('library')}
            type="button"
          >
            {t('nav.library')}
          </button>
          <button
            className={`bf-chip ${tab === 'studio' ? 'on' : 'ghost'}`}
            onClick={() => switchTab('studio')}
            type="button"
          >
            {t('nav.studio')}
          </button>
          {/* The MIDI tab is intentionally NOT in the nav. Reachable
              via ?tab=_midi for users who know the URL. */}
        </nav>
        <div className="bf-topright">
          <LangPicker />
          <div className="bf-theme-seg" role="group" aria-label={t('theme.label')}>
            {THEMES.map((themeName) => (
              <button
                key={themeName}
                className={`bf-theme-btn bf-theme-${themeName} ${theme === themeName ? 'on' : ''}`}
                onClick={() => setTheme(themeName)}
                title={t(`theme.${themeName}` as const)}
                aria-label={t(`theme.${themeName}` as const)}
                type="button"
              >
                <span className="bf-theme-swatch" />
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
          initialSoundPatternId={initialSoundPatternId}
          setInitialSoundPatternId={setInitialSoundPatternId}
          setTab={setTab}
          loadInPractice={loadInPractice}
          openInStudio={openInStudio}
          refreshUserCache={refreshUserCache}
        />
      </SessionProvider>
      <footer className="bf-footer">
        <LangPicker />
      </footer>
      <UpdateBanner />
    </div>
  );
}

interface ModeShellProps {
  tab: Tab;
  engine: SoundEngine;
  patternId: string;
  setPatternId: (id: string) => void;
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
  initialSoundPatternId, setInitialSoundPatternId,
  setTab, loadInPractice, openInStudio,
}: ModeShellProps) {
  const t = useT();
  const session = useSession();
  // patternId → session.loadPattern when they diverge. Keeps Library
  // handoffs and URL nav as the explicit "load new" trigger; session
  // is the runtime source for the rest.
  //
  // Dirty guard — if the user has unsaved sticky edits and an external
  // navigation (Library card, URL change, browser back) wants to load
  // a different pattern, prompt before discarding. Cancel reverts
  // patternId so the URL/state stays consistent.
  //
  // Re-entry guard: setPatternId(session.pattern.id) on Cancel re-fires
  // this effect synchronously. Without the in-flight ref, double-clicks
  // on Library cards while the confirm dialog is open compound state
  // (multiple confirms stack, prior cancellations get clobbered).
  const dirtyGuardInFlightRef = useRef(false);
  const sessionPatternId = session.pattern.id;
  const sessionDirty = session.dirty;
  const sessionPatternName = session.pattern.name;
  const sessionLoadPattern = session.loadPattern;
  useEffect(() => {
    if (dirtyGuardInFlightRef.current) return;
    if (sessionPatternId === patternId) return;
    const p = patternById(patternId);
    if (!p) return;
    if (sessionDirty) {
      dirtyGuardInFlightRef.current = true;
      try {
        const ok = window.confirm(
          t('dirty_guard.confirm', { name: sessionPatternName, next: p.name }),
        );
        if (!ok) {
          setPatternId(sessionPatternId);
          return;
        }
      } finally {
        dirtyGuardInFlightRef.current = false;
      }
    }
    sessionLoadPattern(p);
  }, [patternId, sessionPatternId, sessionDirty, sessionPatternName, sessionLoadPattern, setPatternId, t]);

  // Modular control plane lives at the shell level so input-mapped
  // ParamEvents (from the secret MIDI tab) drive audio regardless of
  // which mode is mounted. Previously Studio owned the router; the
  // MIDI tab couldn't actually control sound because Studio was
  // unmounted while the user was editing mappings.
  const [router] = useState<Router>(() => makeRouter());
  useEffect(() => {
    let active = true;
    let unregisterMaster: (() => void) | null = null;
    const unbind = router.bindBus(engine.getEventBus());
    engine.ensureCtx().then(() => {
      if (!active) return;
      unregisterMaster = registerEngineMaster(router, engine);
    }).catch((err) => {
      // Rare iOS Safari edge case where AudioContext can't be
      // created. Without surfacing this, every master-bus knob would
      // be dead but the UI looks fine.
      logError(t('errors.audio_context_failed'), err);
    });
    return () => {
      active = false;
      unbind();
      unregisterMaster?.();
    };
  }, [engine, router, t]);

  // Per-channel adapter registrations — keyed on channel COUNT to
  // avoid tearing down the adapter cache on every knob tweak. Knob
  // changes also emit ParamEvents that update the cache, so the cache
  // stays correct without re-registering. Reads channels through a
  // ref so the registration effect only fires when the count changes.
  const channels = session.channels;
  const channelsRefForRegister = useRef(channels);
  useEffect(() => { channelsRefForRegister.current = channels; }, [channels]);
  const channelCount = channels.length;
  useEffect(() => {
    const offs: Array<() => void> = [];
    const cur = channelsRefForRegister.current;
    for (let i = 0; i < channelCount; i++) {
      const ch = cur[i];
      if (!ch) continue;
      offs.push(registerEngineChannel(router, engine, i, {
        effects: ch.effects, machine: ch.machine,
      }));
    }
    return () => { for (const off of offs) off(); };
  }, [router, engine, channelCount]);

  // MIDI bridge — single owner for Web MIDI access, configs, sink,
  // and input bindings. Lives at the shell level so all of those
  // survive tab switches; the secret MIDI tab is a UI on top.
  const midiBridge = useMidiBridge(engine, channelCount);

  return (
    <>
      {tab === 'practice' && (
        <Practice
          engine={engine}
          patternId={patternId}
          onPatternChange={setPatternId}
          onOpenSoundPattern={(id) => {
            setInitialSoundPatternId(id);
            setTab('studio');
          }}
        />
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
      {tab === 'studio' && (
        <Suspense fallback={<div className="bf-mode-loading">loading studio…</div>}>
          <Sound
            engine={engine}
            initialSoundPatternId={initialSoundPatternId}
            onConsumedInitial={() => setInitialSoundPatternId(null)}
          />
        </Suspense>
      )}
      {tab === '_midi' && (
        <Suspense fallback={<div className="bf-mode-loading">loading midi…</div>}>
          <Midi bridge={midiBridge} channels={channels} />
        </Suspense>
      )}
    </>
  );
}
