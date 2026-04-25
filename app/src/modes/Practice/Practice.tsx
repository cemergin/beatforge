import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { AudioEngine } from '../../audio/engine';
import { quarterToStepBpm, stepToQuarterBpm } from '../../audio/tempo';
import type { KitId, Pattern, Track, Velocity, VoiceId } from '../../patterns/types';
import { trackMeta } from '../../patterns/types';
import { PATTERNS, patternById } from '../../patterns/seed';
import {
  clearKitOverride,
  getHighlights,
  getKitOverride,
  getMasterVolume,
  getRecent,
  isHighlighted,
  pushRecent,
  setKitOverride,
  setMasterVolume as storeMasterVolume,
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
import { Trainer, type TrainerCfg } from './Trainer';

type View = 'circular' | 'linear' | 'pill';

function swingDefaultToSlider(s: number | undefined): number {
  if (s === undefined) return 50;
  return Math.round(50 + ((s - 0.5) / 0.34) * 100);
}

const TAP_WINDOW = 8;
const TAP_MIN_TAPS = 2;
const TAP_RESET_MS = 2000;

interface Props {
  engine: AudioEngine;
  patternId: string;
  onPatternChange: (id: string) => void;
}

export function Practice({ engine, patternId, onPatternChange }: Props) {
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
  // bpm is in QUARTER BPM (display value). Engine receives the stepUnit
  // conversion via quarterToStepBpm.
  const [bpm, setBpm] = useState(stepToQuarterBpm(pattern.bpm.default, pattern.stepUnit));
  const [cursors, setCursors] = useState<Record<string, number>>({});
  // Kit override is hydrated from localStorage per-pattern (spec §9 v1.3).
  const [kitOverride, setKitOverrideState] = useState<KitId | null>(
    () => getKitOverride(pattern.id),
  );
  const activeKit: KitId = kitOverride ?? pattern.defaultKit;

  const [view, setView] = useState<View>(
    () => (localStorage.getItem('bf_view') as View) || 'circular',
  );
  const [grouping, setGrouping] = useState<number[]>(pattern.grouping);
  const [swing, setSwing] = useState(() => swingDefaultToSlider(pattern.swingDefault));
  const [strong, setStrong] = useState(100);
  const [weak, setWeak] = useState(55);

  const [trainerOn, setTrainerOn] = useState(false);
  const [trainerCfg, setTrainerCfg] = useState<TrainerCfg>({
    from: 100, to: 160, step: 5, bars: 4, mode: 'cycles',
  });
  const [trainerBar, setTrainerBar] = useState(0);
  const [trainerCycleStartMs, setTrainerCycleStartMs] = useState<number | null>(null);

  const [countInBars, setCountInBars] = useState(0);
  const [countingIn, setCountingIn] = useState(false);

  const [highlights, setHighlights] = useState<string[]>(() => getHighlights());
  const [recent, setRecent] = useState<string[]>(() => getRecent());
  const [masterVolume, setMasterVolumeState] = useState(() => getMasterVolume());
  const [shareToast, setShareToast] = useState<string | null>(null);

  const [tapTimes, setTapTimes] = useState<number[]>([]);
  const tapTimesRef = useRef<number[]>([]);
  tapTimesRef.current = tapTimes;

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

  useEffect(() => {
    return engine.subscribeOnBar((bar: number) => {
      setTrainerBar(bar);
    });
  }, [engine]);

  useEffect(() => {
    engine.stop();
    setPlaying(false);
    setCountingIn(false);
    clearCountInTimer();
    setEditedTracks({});
    engine.loadPattern({ ...pattern, grouping: pattern.grouping });
    setBpm(stepToQuarterBpm(pattern.bpm.default, pattern.stepUnit));
    setSwing(swingDefaultToSlider(pattern.swingDefault));
    setGrouping(pattern.grouping);
    setKitOverrideState(getKitOverride(pattern.id));
    setTapTimes([]);
    localStorage.setItem('bf_pattern', pattern.id);
    setTrainerBar(0);
    setRecent(pushRecent(pattern.id));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [patternId]);

  useEffect(() => {
    engine.loadPattern({ ...pattern, grouping });
  }, [engine, pattern, grouping]);

  useEffect(() => {
    engine.setBpm(quarterToStepBpm(bpm, pattern.stepUnit));
  }, [engine, bpm, pattern.stepUnit]);
  useEffect(() => { engine.setKit(activeKit); }, [engine, activeKit]);
  useEffect(() => {
    engine.setSwing(pattern.swingable ? 0.5 + ((swing - 50) / 100) * 0.34 : 0.5);
  }, [engine, swing, pattern.swingable]);
  useEffect(() => { engine.setAccents(strong / 100, weak / 100); }, [engine, strong, weak]);
  useEffect(() => { localStorage.setItem('bf_view', view); }, [view]);

  // Speed trainer — cycles mode
  useEffect(() => {
    if (!trainerOn || !playing) return;
    if (trainerCfg.mode === 'cycles' && trainerBar > 0 && trainerBar % trainerCfg.bars === 0) {
      setBpm((b) => Math.min(trainerCfg.to, b + trainerCfg.step));
    }
  }, [trainerBar, trainerOn, playing, trainerCfg]);

  // Speed trainer — time mode. Tracks cycle start so the Trainer can
  // render a countdown (fill-bar + remaining seconds).
  useEffect(() => {
    if (!trainerOn || trainerCfg.mode !== 'time' || !playing) {
      setTrainerCycleStartMs(null);
      return;
    }
    setTrainerCycleStartMs(performance.now());
    const iv = setInterval(() => {
      setBpm((b) => Math.min(trainerCfg.to, b + trainerCfg.step));
      setTrainerCycleStartMs(performance.now());
    }, trainerCfg.bars * 1000);
    return () => clearInterval(iv);
  }, [trainerOn, trainerCfg, playing]);

  // Tap tempo — median interval of last 4-8 taps sets the master BPM.
  // Pushes to engine directly (in addition to React state) so the change
  // is audible immediately, no useEffect lag.
  const handleTap = useCallback(() => {
    const now = performance.now();
    const prev = tapTimesRef.current;
    const last = prev[prev.length - 1];
    const base = last !== undefined && (now - last) > TAP_RESET_MS ? [] : prev;
    const next = [...base, now].slice(-TAP_WINDOW);
    setTapTimes(next);
    if (next.length < TAP_MIN_TAPS) return;

    const window = next.slice(-Math.min(TAP_WINDOW, next.length));
    const intervals: number[] = [];
    for (let i = 1; i < window.length; i++) intervals.push(window[i] - window[i - 1]);
    const sorted = [...intervals].sort((a, b) => a - b);
    const mid = sorted.length >> 1;
    const medianMs = sorted.length % 2 === 0
      ? (sorted[mid - 1] + sorted[mid]) / 2
      : sorted[mid];
    if (medianMs <= 0) return;

    // Tap intervals are quarter-note rate by convention. Convert pattern's
    // step-BPM range to quarter-BPM for the clamp.
    const rawQuarterBpm = 60_000 / medianMs;
    const minBpm = stepToQuarterBpm(pattern.bpm.min ?? 30, pattern.stepUnit);
    const maxBpm = stepToQuarterBpm(pattern.bpm.max ?? 800, pattern.stepUnit);
    const clamped = Math.max(minBpm, Math.min(maxBpm, Math.round(rawQuarterBpm)));
    setBpm(clamped);
    engine.setBpm(quarterToStepBpm(clamped, pattern.stepUnit));
  }, [pattern.bpm.min, pattern.bpm.max, pattern.stepUnit, engine]);

  // Stored count-in timer so stop/pattern-change/unmount can cancel it.
  const countInTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const clearCountInTimer = useCallback(() => {
    if (countInTimerRef.current !== null) {
      clearTimeout(countInTimerRef.current);
      countInTimerRef.current = null;
    }
  }, []);
  useEffect(() => clearCountInTimer, [clearCountInTimer]);

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
      const stepBpm = quarterToStepBpm(bpm, pattern.stepUnit);
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
  }, [engine, playing, bpm, trainerOn, trainerCfg.from, countInBars, pattern.steps, pattern.stepUnit, clearCountInTimer]);

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

  const grid = {
    circular: <CircularGrid pattern={{ ...pattern, grouping }} cursors={cursors} size={440} onToggle={toggleStep} />,
    linear: <LinearGrid pattern={{ ...pattern, grouping }} cursors={cursors} onToggle={toggleStep} />,
    pill: <PillGrid pattern={{ ...pattern, grouping }} cursors={cursors} onToggle={toggleStep} />,
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
          stepUnit={pattern.stepUnit}
        >
          <BeatDots grouping={grouping} currentStep={curStep} size={12} />
        </BpmHero>

        <PlayVolume
          playing={playing}
          onToggle={toggle}
          volume={masterVolume}
          onVolumeChange={(v) => {
            setMasterVolumeState(v);
            engine.setMasterVolume(v);
            storeMasterVolume(v);
          }}
        />

        {pattern.story && (
          <Disclosure className="bf-story" summary="about this rhythm">
            <p>{pattern.story}</p>
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
      </aside>
    </main>
  );
}
