import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { AudioEngine } from '../../audio/engine';
import { naturalToStepBpm, parseTimeSigDenom, stepToNaturalBpm } from '../../audio/tempo';
import { useMetronome } from '../../audio/useMetronome';
import type { KitId, Pattern, Track, Velocity, VoiceId } from '../../patterns/types';
import { trackMeta } from '../../patterns/types';
import { PATTERNS, patternById } from '../../patterns/seed';
import {
  clearKitOverride,
  getHighlights,
  getKitOverride,
  getRecent,
  isHighlighted,
  pushRecent,
  setKitOverride,
  toggleHighlight,
} from '../../lib/storage';
import { BeatDots } from '../../components/BeatDots';
import { Disclosure } from '../../components/Disclosure';
import { CircularGrid } from '../../components/CircularGrid';
import { LinearGrid } from '../../components/LinearGrid';
import { PillGrid } from '../../components/PillGrid';
import { BpmHero } from '../../components/metronome/BpmHero';
import { PlayVolume } from '../../components/metronome/PlayVolume';
import { CountInPanel } from '../../components/metronome/CountInPanel';
import { AccentsPanel } from '../../components/metronome/AccentsPanel';
import { SwingPanel } from '../../components/metronome/SwingPanel';
import { KitPanel } from '../../components/metronome/KitPanel';
import { Trainer } from './Trainer';
import { listSoundPatterns, listSoundKits } from '../../lib/db';
import type { SoundPattern, SoundKit } from '../../patterns/types-sound';

type View = 'circular' | 'linear' | 'pill';

function swingDefaultToSlider(s: number | undefined): number {
  if (s === undefined) return 50;
  return Math.round(50 + ((s - 0.5) / 0.34) * 100);
}

type FocusMode = 'groove' | 'click';

/** Reduce a full pattern to its meter-skeleton: a single kick track that
 *  hits every group downbeat. Bar one strong (velocity 2), every other
 *  group downbeat weak (velocity 1). Keeps stepUnit / steps / grouping /
 *  bpm intact so the visualizers and trainer keep working unchanged.
 *
 *  Why: practitioners often want to play their own instrument over a
 *  bare click — the groove voices become a distraction. This is the
 *  "click only" mode. The reverse ("groove only", no click) just
 *  feeds the original pattern. */
function buildClickSkeleton(pattern: Pattern): Pattern {
  const skeleton: Velocity[] = Array.from({ length: pattern.steps }, () => 0);
  let cursor = 0;
  pattern.grouping.forEach((g, i) => {
    if (cursor < pattern.steps) skeleton[cursor] = (i === 0 ? 2 : 1) as Velocity;
    cursor += g;
  });
  return { ...pattern, tracks: { KK: skeleton } };
}

interface Props {
  engine: AudioEngine;
  patternId: string;
  onPatternChange: (id: string) => void;
  /** When a user clicks one of their saved soundPatterns from the
   *  sidebar, route them to the Sound tab with that pattern preloaded.
   *  App.tsx wires this to setTab('sound') + setInitialSoundPatternId. */
  onOpenSoundPattern?: (id: string) => void;
}

export function Practice({ engine, patternId, onPatternChange, onOpenSoundPattern }: Props) {
  const setPatternId = onPatternChange;
  const seedPattern: Pattern = useMemo(
    () => patternById(patternId) ?? PATTERNS[0],
    [patternId],
  );
  // Track-level overrides applied to the seed pattern for the current
  // session. Cleared on pattern change. Keeps the imported seed object
  // immutable (Library previews + other modes see the pristine version).
  const [editedTracks, setEditedTracks] = useState<Partial<Record<VoiceId, Track>>>({});
  const pattern: Pattern = useMemo(
    () => ({ ...seedPattern, tracks: { ...seedPattern.tracks, ...editedTracks } }),
    [seedPattern, editedTracks],
  );

  const [playing, setPlaying] = useState(false);
  const [cursors, setCursors] = useState<Record<string, number>>({});
  const denom = parseTimeSigDenom(pattern.timeSig);

  const m = useMetronome(engine, {
    stepUnit: pattern.stepUnit,
    timeSig: pattern.timeSig,
    swingable: pattern.swingable ?? false,
    initialBpm: stepToNaturalBpm(pattern.bpm.default, pattern.stepUnit, denom),
    initialSwing: swingDefaultToSlider(pattern.swingDefault),
    playing,
  });
  const {
    bpm, setBpm, handleTap, tapTimes, resetTaps,
    trainerOn, setTrainerOn, trainerCfg, setTrainerCfg, trainerBar, setTrainerBar, trainerCycleStartMs,
    countInBars, setCountInBars, countingIn, setCountingIn,
    strong, setStrong, weak, setWeak,
    swing, setSwing,
    masterVolume, setMasterVolume,
  } = m;

  // Kit override is hydrated from localStorage per-pattern (spec §9 v1.3).
  const [kitOverride, setKitOverrideState] = useState<KitId | null>(
    () => getKitOverride(pattern.id),
  );
  const activeKit: KitId = kitOverride ?? pattern.defaultKit;

  const [view, setView] = useState<View>(
    () => (localStorage.getItem('bf_view') as View) || 'circular',
  );
  const [grouping, setGrouping] = useState<number[]>(pattern.grouping);
  const [focus, setFocus] = useState<FocusMode>(
    () => ((localStorage.getItem('bf_focus') as FocusMode) || 'groove'),
  );
  useEffect(() => { localStorage.setItem('bf_focus', focus); }, [focus]);

  const [highlights, setHighlights] = useState<string[]>(() => getHighlights());
  const [recent, setRecent] = useState<string[]>(() => getRecent());
  const [shareToast, setShareToast] = useState<string | null>(null);

  // User's saved soundPatterns + soundKits from the new Sound system.
  // Loaded once on mount via promise-then so the React-19
  // set-state-in-effect lint stays happy.
  const [savedSoundPatterns, setSavedSoundPatterns] = useState<SoundPattern[]>([]);
  const [savedSoundKits, setSavedSoundKits] = useState<SoundKit[]>([]);
  useEffect(() => {
    let active = true;
    listSoundPatterns()
      .then((list) => { if (active) setSavedSoundPatterns(list); })
      .catch(() => { /* IDB unavailable */ });
    listSoundKits()
      .then((list) => { if (active) setSavedSoundKits(list); })
      .catch(() => { /* IDB unavailable */ });
    return () => { active = false; };
  }, []);

  // rAF cursor polling
  useEffect(() => {
    let raf = 0;
    const loop = () => {
      setCursors(engine.audibleCursors());
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, [engine]);

  // Stored count-in timer so stop/pattern-change/unmount can cancel it.
  // Declared before the pattern-change reset effect that calls it.
  const countInTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const clearCountInTimer = useCallback(() => {
    if (countInTimerRef.current !== null) {
      clearTimeout(countInTimerRef.current);
      countInTimerRef.current = null;
    }
  }, []);
  useEffect(() => clearCountInTimer, [clearCountInTimer]);

  /* eslint-disable react-hooks/set-state-in-effect -- legitimate sync of UI state when the user picks a new pattern. */
  // Pattern-change reset. Resets UI state (bpm, swing, grouping, kit) +
  // stops playback. The engine.loadPattern call lives in the dependent
  // effect below — pattern object identity changes when patternId
  // changes, so the [pattern, grouping] effect re-fires once and we
  // don't need a redundant load here.
  useEffect(() => {
    engine.stop();
    setPlaying(false);
    setCountingIn(false);
    clearCountInTimer();
    setEditedTracks({});
    setBpm(stepToNaturalBpm(pattern.bpm.default, pattern.stepUnit, parseTimeSigDenom(pattern.timeSig)));
    setSwing(swingDefaultToSlider(pattern.swingDefault));
    setGrouping(pattern.grouping);
    setKitOverrideState(getKitOverride(pattern.id));
    resetTaps();
    localStorage.setItem('bf_pattern', pattern.id);
    setTrainerBar(0);
    setRecent(pushRecent(pattern.id));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [patternId]);
  /* eslint-enable react-hooks/set-state-in-effect */

  useEffect(() => {
    const base = focus === 'click' ? buildClickSkeleton(pattern) : pattern;
    engine.loadPattern({ ...base, grouping });
  }, [engine, pattern, grouping, focus]);

  useEffect(() => { engine.setKit(activeKit); }, [engine, activeKit]);
  useEffect(() => { localStorage.setItem('bf_view', view); }, [view]);

  const toggle = useCallback(async () => {
    try {
      await engine.ensureCtx();
    } catch (err) {
      // iOS Safari / autoplay-blocked — surface in console for now, keep
      // Play button responsive.
      console.warn('[BeatForge] Audio context failed to start', err);
      return;
    }
    if (playing) {
      engine.stop();
      setPlaying(false);
      setCountingIn(false);
      clearCountInTimer();
    } else {
      if (bpm < trainerCfg.from && trainerOn) setBpm(trainerCfg.from);
      const stepBpm = naturalToStepBpm(bpm, pattern.stepUnit, denom);
      engine.setBpm(stepBpm);
      engine.start(countInBars);
      setPlaying(true);
      clearCountInTimer();
      if (countInBars > 0) {
        setCountingIn(true);
        const barSec = pattern.steps * (60 / stepBpm);
        countInTimerRef.current = setTimeout(() => {
          setCountingIn(false);
          countInTimerRef.current = null;
        }, countInBars * barSec * 1000);
      }
    }
  }, [engine, playing, bpm, trainerOn, trainerCfg.from, countInBars, pattern.steps, pattern.stepUnit, denom, clearCountInTimer, setBpm, setCountingIn]);

  // Keyboard shortcuts — Space for play/stop, 1-9 for highlights,
  // T for tap-tempo, S for toggle star.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement;
      if (t && (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA' || t.isContentEditable)) return;
      if (e.code === 'Space') {
        e.preventDefault();
        toggle();
        return;
      }
      if (e.key.toLowerCase() === 't' && !e.metaKey && !e.ctrlKey && !e.altKey && !e.repeat) {
        e.preventDefault();
        handleTap();
        return;
      }
      if (e.key >= '1' && e.key <= '9') {
        const idx = Number(e.key) - 1;
        const hl = getHighlights();
        if (hl[idx]) { setPatternId(hl[idx]); }
      }
      if (e.key.toLowerCase() === 's' && !e.metaKey && !e.ctrlKey) {
        setHighlights(toggleHighlight(patternId));
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [toggle, patternId, handleTap, setPatternId]);

  const curStep = useMemo(() => {
    const firstTrack = Object.keys(pattern.tracks)[0];
    if (!firstTrack) return -1;
    const td = pattern.tracks[firstTrack as VoiceId]!;
    const meta = trackMeta(td, pattern.steps);
    if (meta.subdivisions !== pattern.steps) return -1;
    return cursors[firstTrack] ?? -1;
  }, [cursors, pattern]);

  const groupingOptions = useMemo(() => {
    const canon = pattern.grouping;
    // Cap enumeration early — a grouping of length 8+ has 40k+ perms
    // and would freeze the tab. The UI only shows 6 options anyway.
    const MAX_RESULTS = 6;
    const out = new Set<string>();
    const permute = (a: number[], m: number[] = []): boolean => {
      if (out.size >= MAX_RESULTS) return true;
      if (a.length === 0) { out.add(m.join(',')); return out.size >= MAX_RESULTS; }
      for (let i = 0; i < a.length; i++) {
        const cur = [...a];
        const nx = cur.splice(i, 1);
        if (permute(cur, m.concat(nx))) return true;
      }
      return false;
    };
    permute(canon);
    return [...out].map((s) => s.split(',').map(Number));
  }, [pattern]);

  // Clone the seed track into session-local state; never mutate the seed.
  // (Bug fix — prior version did arr[s] = ... which corrupted the shared
  // imported PATTERNS object.)
  const toggleStep = useCallback((tr: VoiceId, s: number) => {
    setEditedTracks((prev) => {
      const current = prev[tr] ?? seedPattern.tracks[tr];
      if (!current) return prev;
      const srcArr: Velocity[] = Array.isArray(current) ? current : current.pattern;
      const nextArr: Velocity[] = srcArr.slice();
      nextArr[s] = (nextArr[s] === 0 ? 2 : nextArr[s] === 2 ? 1 : 0) as Velocity;
      const newTrack = Array.isArray(current) ? nextArr : { ...current, pattern: nextArr };
      return { ...prev, [tr]: newTrack };
    });
  }, [seedPattern]);

  // CircularGrid expects positional rows now (refactored to be
  // engine-agnostic so Sound + Practice + Studio can all drive it).
  // Construct rows from the voice-keyed Pattern at this seam; the
  // ordering is whatever Object.keys returns, which matches what the
  // original component iterated.
  const trackList = Object.keys(pattern.tracks) as Array<keyof typeof pattern.tracks>;
  const circRows = trackList.map((tr) => {
    const td = pattern.tracks[tr]!;
    const meta = trackMeta(td, pattern.steps);
    return {
      label: String(tr),
      cells: meta.pattern.slice() as number[],
      cursor: cursors[tr] ?? -1,
    };
  });

  const grid = {
    circular: (
      <CircularGrid
        stepsPerBar={pattern.steps}
        grouping={grouping}
        rows={circRows}
        size={440}
        onToggle={(rowIdx, stepIdx) => {
          const tr = trackList[rowIdx];
          if (tr) toggleStep(tr, stepIdx);
        }}
      />
    ),
    linear: <LinearGrid pattern={{ ...pattern, grouping }} cursors={cursors} onToggle={toggleStep} />,
    pill: (
      <PillGrid
        stepsPerBar={pattern.steps}
        grouping={grouping}
        rows={circRows}
        onToggle={(rowIdx, stepIdx) => {
          const tr = trackList[rowIdx];
          if (tr) toggleStep(tr, stepIdx);
        }}
      />
    ),
  }[view];

  const starred = isHighlighted(patternId);
  const starToggle = () => setHighlights(toggleHighlight(patternId));

  // Smart share: short ?pattern=<id> for an unedited seed pattern
  // (compact, stable). Hash URL the moment the user's touched anything
  // (grouping permutation, cell toggle, or a non-seed pattern).
  const shareCurrent = useCallback(async () => {
    try {
      const { buildSmartShareUrl } = await import('../../patterns/serialize');
      const effective = { ...pattern, grouping };
      const seedMatch = PATTERNS.find((p) => p.id === effective.id);
      const untouched = !!seedMatch
        && effective.grouping.join('+') === seedMatch.grouping.join('+')
        && Object.keys(editedTracks).length === 0;
      const url = await buildSmartShareUrl(
        effective,
        (id) => untouched && id === seedMatch!.id,
      );
      await navigator.clipboard.writeText(url);
      setShareToast('Share link copied');
    } catch {
      setShareToast('Copy failed');
    }
    window.setTimeout(() => setShareToast(null), 1800);
  }, [pattern, grouping, editedTracks]);

  return (
    <main className="bf-main">
      <aside className="bf-left">
        {/* Highlights strip */}
        {highlights.length > 0 && (
          <div className="bf-strip">
            <div className="bf-strip-label">⭐ highlights</div>
            <div className="bf-strip-chips">
              {highlights.map((id) => {
                const p = patternById(id);
                if (!p) return null;
                return (
                  <button
                    key={id}
                    className={`bf-strip-chip ${id === patternId ? 'on' : ''}`}
                    onClick={() => setPatternId(id)}
                    title={p.name}
                  >
                    {p.name}
                  </button>
                );
              })}
            </div>
          </div>
        )}
        {recent.length > 1 && (
          <div className="bf-strip">
            <div className="bf-strip-label">recent</div>
            <div className="bf-strip-chips">
              {recent.slice(0, 8).map((id) => {
                const p = patternById(id);
                if (!p) return null;
                return (
                  <button
                    key={id}
                    className={`bf-strip-chip muted ${id === patternId ? 'on' : ''}`}
                    onClick={() => setPatternId(id)}
                    title={p.name}
                  >
                    {p.name}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        <div className="bf-pattern-card">
          <div className="bf-pattern-head">
            <div className="bf-pattern-name">{pattern.name}</div>
            <div className="bf-pattern-head-actions">
              <button
                className="bf-share-btn"
                onClick={shareCurrent}
                title="Copy a share link for this exact pattern (including your edits)"
                aria-label="Share pattern"
                type="button"
              >
                ↗
              </button>
              <button
                className={`bf-star ${starred ? 'on' : ''}`}
                onClick={starToggle}
                title={starred ? 'Unstar' : 'Star'}
                aria-label={starred ? 'Unstar pattern' : 'Star pattern'}
              >
                {starred ? '★' : '☆'}
              </button>
            </div>
          </div>
          <div className="bf-pattern-origin">{pattern.origin}</div>
          <div className="bf-pattern-meta">
            <span className="bf-meta-badge">{pattern.timeSig}</span>
            <span className="bf-meta-badge alt">{grouping.join('+')}</span>
            {pattern.poly && <span className="bf-meta-badge alt">poly</span>}
          </div>
          {shareToast && <div className="bf-share-toast">{shareToast}</div>}
        </div>

        <BpmHero
          bpm={bpm}
          setBpm={setBpm}
          onTap={handleTap}
          tapArmed={tapTimes.length > 0}
          countingIn={countingIn}
          timeSig={pattern.timeSig}
        >
          <BeatDots grouping={grouping} currentStep={curStep} size={12} />
        </BpmHero>

        <PlayVolume
          playing={playing}
          onToggle={toggle}
          volume={masterVolume}
          onVolumeChange={setMasterVolume}
        />

        <div
          className="bf-focus-toggle"
          role="radiogroup"
          aria-label="Practice focus"
        >
          <button
            type="button"
            role="radio"
            aria-checked={focus === 'groove'}
            className={`bf-focus-pill ${focus === 'groove' ? 'on' : ''}`}
            onClick={() => setFocus('groove')}
            title="Play the full pattern voices"
          >
            groove
          </button>
          <button
            type="button"
            role="radio"
            aria-checked={focus === 'click'}
            className={`bf-focus-pill ${focus === 'click' ? 'on' : ''}`}
            onClick={() => setFocus('click')}
            title="Bare meter — kick on group downbeats"
          >
            click only
          </button>
        </div>

        {pattern.story && (
          <Disclosure className="bf-story" summary="about this rhythm">
            <p>{pattern.story}</p>
          </Disclosure>
        )}

        {(savedSoundPatterns.length > 0 || savedSoundKits.length > 0) && (
          <Disclosure
            className="bf-panel bf-pattern-list-panel"
            summaryClassName="bf-panel-head"
            summary={
              <>
                <span>your sounds</span>
                <span className="bf-pattern-list-count">{savedSoundPatterns.length + savedSoundKits.length}</span>
              </>
            }
          >
            <div className="bf-pattern-list">
              {savedSoundPatterns.length > 0 && (
                <div className="bf-mini-label" style={{ padding: '6px 8px 2px' }}>patterns</div>
              )}
              {savedSoundPatterns.map((sp) => (
                <button
                  key={sp.id}
                  className="bf-pattern-row"
                  onClick={() => onOpenSoundPattern?.(sp.id)}
                  title={`Open in Sound — ${sp.bpm} BPM, ${sp.grouping.join('+')}`}
                >
                  <span className="bf-pattern-row-name">{sp.name}</span>
                  <span className="bf-pattern-row-sig">↗ sound</span>
                </button>
              ))}
              {savedSoundKits.length > 0 && (
                <div className="bf-mini-label" style={{ padding: '6px 8px 2px' }}>ensembles</div>
              )}
              {savedSoundKits.map((kit) => (
                <button
                  key={kit.id}
                  className="bf-pattern-row"
                  onClick={() => onOpenSoundPattern?.(kit.id)}
                  title={`${kit.channels.map((c) => c.label).join(', ')} — open Sound to apply this ensemble`}
                  disabled
                >
                  <span className="bf-pattern-row-name">{kit.name}</span>
                  <span className="bf-pattern-row-sig">ensemble</span>
                </button>
              ))}
            </div>
          </Disclosure>
        )}

        <Disclosure
          className="bf-panel bf-pattern-list-panel"
          summaryClassName="bf-panel-head"
          summary={
            <>
              <span>patterns</span>
              <span className="bf-pattern-list-count">{PATTERNS.length}</span>
            </>
          }
        >
          <div className="bf-pattern-list">
            {PATTERNS.map((p) => (
              <button
                key={p.id}
                className={`bf-pattern-row ${p.id === patternId ? 'on' : ''}`}
                onClick={() => setPatternId(p.id)}
              >
                <span className="bf-pattern-row-name">{p.name}</span>
                <span className="bf-pattern-row-sig">{p.timeSig}</span>
              </button>
            ))}
          </div>
        </Disclosure>
      </aside>

      <section className={`bf-grid-wrap ${countingIn ? 'counting-in' : ''}`}>
        <div className="bf-grid-head">
          <div className="bf-view-switch">
            {(['circular', 'linear', 'pill'] as View[]).map((v) => (
              <button
                key={v}
                className={`bf-view-btn ${view === v ? 'on' : ''}`}
                onClick={() => setView(v)}
              >
                {v}
              </button>
            ))}
          </div>
          <div className="bf-grouping-switch">
            <span className="bf-mini-label">grouping</span>
            {groupingOptions.map((g, i) => (
              <button
                key={i}
                className={`bf-group-btn ${g.join('+') === grouping.join('+') ? 'on' : ''}`}
                onClick={() => setGrouping(g)}
              >
                {g.join('+')}
              </button>
            ))}
          </div>
        </div>
        <div className="bf-grid-stage">{grid}</div>
        <div className="bf-grid-foot">
          <div className="bf-mini-label">
            {pattern.steps} steps · {pattern.stepUnit === 8 ? 'eighths' : pattern.stepUnit === 16 ? 'sixteenths' : 'quarters'}
            {pattern.poly && ' · polyrhythm'}
          </div>
        </div>
      </section>

      <aside className="bf-right">
        <Trainer
          cfg={trainerCfg}
          setCfg={setTrainerCfg}
          on={trainerOn}
          setOn={(next) => {
            // Turning ON: snap BPM to the trainer's starting tempo so the
            // user doesn't have to hunt for it — "begin at the bottom,
            // climb." Turning OFF: leave current BPM alone.
            setTrainerOn(next);
            if (next) setBpm(trainerCfg.from);
          }}
          bar={trainerBar}
          bpm={bpm}
          cycleStartMs={trainerCycleStartMs}
        />

        <KitPanel
          activeKit={activeKit}
          onSelect={(k) => {
            if (k === pattern.defaultKit) {
              clearKitOverride(pattern.id);
              setKitOverrideState(null);
            } else {
              setKitOverride(pattern.id, k);
              setKitOverrideState(k);
            }
          }}
          resetTo={kitOverride ? pattern.defaultKit : null}
          onReset={() => {
            clearKitOverride(pattern.id);
            setKitOverrideState(null);
          }}
        />

        <CountInPanel countInBars={countInBars} setCountInBars={setCountInBars} />

        <AccentsPanel
          strong={strong}
          setStrong={setStrong}
          weak={weak}
          setWeak={setWeak}
        />

        {pattern.swingable && <SwingPanel swing={swing} setSwing={setSwing} />}
      </aside>
    </main>
  );
}
