import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { AudioEngine } from '../../audio/engine';
import type { KitId, Pattern, VoiceId } from '../../patterns/types';
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
import { CircularGrid } from '../../components/CircularGrid';
import { LinearGrid } from '../../components/LinearGrid';
import { PillGrid } from '../../components/PillGrid';
import { GROUP_COLORS } from '../../components/visual-helpers';
import { Trainer, type TrainerCfg } from './Trainer';

type View = 'circular' | 'linear' | 'pill';

const ALL_KITS: KitId[] = ['808', '909', '707', '727', 'frameDrum', 'tabla', 'gamelan'];
// Spec §9 v1.3 — expanded polyrhythm overlay subdivision options.
// 3/4/6/8 are common; 5/7/9/12 are marked experimental.
const OVERLAY_OPTIONS = [0, 3, 4, 5, 6, 7, 8, 9, 12];
const OVERLAY_EXPERIMENTAL = new Set([5, 7, 9, 12]);

// Per-group accent slider range (multipliers on top of strong/weak).
const GROUP_AMP_MIN = 0.5;
const GROUP_AMP_MAX = 1.3;
const GROUP_AMP_DEFAULT = 1.0;

// Tap-tempo behavior
const TAP_WINDOW = 8;      // keep last N taps
const TAP_MIN_TAPS = 2;     // need at least 2 taps to infer BPM
const TAP_RESET_MS = 2000;  // reset if gap > 2s

type StopAfterMode = 'off' | 'cycles' | 'time';
interface StopAfter { mode: StopAfterMode; value: number }

interface Props {
  engine: AudioEngine;
  patternId: string;
  onPatternChange: (id: string) => void;
}

export function Practice({ engine, patternId, onPatternChange }: Props) {
  const setPatternId = onPatternChange;
  const pattern: Pattern = useMemo(
    () => patternById(patternId) ?? PATTERNS[0],
    [patternId],
  );

  const [playing, setPlaying] = useState(false);
  const [bpm, setBpm] = useState(pattern.bpm.default);
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
  const [swing, setSwing] = useState(50);
  const [strong, setStrong] = useState(100);
  const [weak, setWeak] = useState(55);

  const [trainerOn, setTrainerOn] = useState(false);
  const [trainerCfg, setTrainerCfg] = useState<TrainerCfg>({
    from: 100, to: 160, step: 5, bars: 4, mode: 'cycles',
  });
  const [trainerBar, setTrainerBar] = useState(0);

  const [countInBars, setCountInBars] = useState(1);
  const [stopAfter, setStopAfter] = useState<StopAfter>({ mode: 'off', value: 0 });
  const [overlaySubdivisions, setOverlaySubdivisions] = useState(0);
  const [countingIn, setCountingIn] = useState(false);

  const [highlights, setHighlights] = useState<string[]>(() => getHighlights());
  const [recent, setRecent] = useState<string[]>(() => getRecent());
  const [masterVolume, setMasterVolumeState] = useState(() => getMasterVolume());

  // Per-group accent multipliers — one per grouping position, resets
  // when the pattern's grouping changes.
  const [groupAmps, setGroupAmps] = useState<number[]>(
    () => pattern.grouping.map(() => GROUP_AMP_DEFAULT),
  );

  // Tap-tempo — rolling buffer of tap timestamps (ms).
  const [tapTimes, setTapTimes] = useState<number[]>([]);
  const tapTimesRef = useRef<number[]>([]);
  tapTimesRef.current = tapTimes;

  // rAF cursor polling
  useEffect(() => {
    let raf = 0;
    const loop = () => {
      setCursors({ ...engine.cursors });
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, [engine]);

  // Bar-boundary callback → trainer bar counter + stop-after check
  useEffect(() => {
    engine.onBar = (bar: number) => {
      setTrainerBar(bar);
      if (stopAfter.mode === 'cycles' && bar >= stopAfter.value) {
        engine.stop();
        setPlaying(false);
      }
    };
    return () => { engine.onBar = null; };
  }, [engine, stopAfter]);

  // Stop-after time mode (pure wall-clock, tracked while playing)
  useEffect(() => {
    if (!playing || stopAfter.mode !== 'time') return;
    const id = setTimeout(() => {
      engine.stop();
      setPlaying(false);
    }, stopAfter.value * 60_000);
    return () => clearTimeout(id);
  }, [playing, engine, stopAfter]);

  // Pattern change → stop playback (user hits play again when ready) +
  // load + reset trainer + hydrate kit override + reset per-group
  // accents + push recent.
  useEffect(() => {
    engine.stop();
    setPlaying(false);
    setCountingIn(false);
    engine.loadPattern({ ...pattern, grouping: pattern.grouping });
    setBpm(pattern.bpm.default);
    setGrouping(pattern.grouping);
    setKitOverrideState(getKitOverride(pattern.id));
    setGroupAmps(pattern.grouping.map(() => GROUP_AMP_DEFAULT));
    setTapTimes([]);
    localStorage.setItem('bf_pattern', pattern.id);
    setTrainerBar(0);
    setRecent(pushRecent(pattern.id));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [patternId]);

  useEffect(() => {
    engine.loadPattern({ ...pattern, grouping });
  }, [engine, pattern, grouping]);

  // Keep per-group accents length aligned with current grouping length.
  useEffect(() => {
    setGroupAmps((cur) => {
      if (cur.length === grouping.length) return cur;
      return grouping.map((_, i) => cur[i] ?? GROUP_AMP_DEFAULT);
    });
  }, [grouping]);

  // Push per-group accents to engine whenever they change.
  useEffect(() => {
    engine.setGroupAccents(groupAmps);
  }, [engine, groupAmps]);

  useEffect(() => { engine.setBpm(bpm); }, [engine, bpm]);
  useEffect(() => { engine.setKit(activeKit); }, [engine, activeKit]);
  useEffect(() => {
    engine.setSwing(pattern.swingable ? 0.5 + ((swing - 50) / 100) * 0.34 : 0.5);
  }, [engine, swing, pattern.swingable]);
  useEffect(() => { engine.setAccents(strong / 100, weak / 100); }, [engine, strong, weak]);
  useEffect(() => { localStorage.setItem('bf_view', view); }, [view]);

  // Polyrhythm overlay — sync engine when changed
  useEffect(() => {
    if (overlaySubdivisions > 0) {
      engine.setOverlay({ subdivisions: overlaySubdivisions });
    } else {
      engine.setOverlay(null);
    }
  }, [engine, overlaySubdivisions]);

  // Speed trainer — cycles mode
  useEffect(() => {
    if (!trainerOn || !playing) return;
    if (trainerCfg.mode === 'cycles' && trainerBar > 0 && trainerBar % trainerCfg.bars === 0) {
      setBpm((b) => Math.min(trainerCfg.to, b + trainerCfg.step));
    }
  }, [trainerBar, trainerOn, playing, trainerCfg]);

  // Speed trainer — time mode
  useEffect(() => {
    if (!trainerOn || trainerCfg.mode !== 'time' || !playing) return;
    const iv = setInterval(() => {
      setBpm((b) => Math.min(trainerCfg.to, b + trainerCfg.step));
    }, trainerCfg.bars * 1000);
    return () => clearInterval(iv);
  }, [trainerOn, trainerCfg, playing]);

  // Tap tempo — median interval of last 4-8 taps sets BPM.
  // Reset if the gap since last tap > TAP_RESET_MS.
  const handleTap = useCallback(() => {
    const now = performance.now();
    const prev = tapTimesRef.current;
    const last = prev[prev.length - 1];
    const base = last !== undefined && (now - last) > TAP_RESET_MS ? [] : prev;
    const next = [...base, now].slice(-TAP_WINDOW);
    setTapTimes(next);
    if (next.length < TAP_MIN_TAPS) return;

    // Use last 4-8 taps — compute intervals then median.
    const window = next.slice(-Math.min(TAP_WINDOW, next.length));
    const intervals: number[] = [];
    for (let i = 1; i < window.length; i++) intervals.push(window[i] - window[i - 1]);
    const sorted = [...intervals].sort((a, b) => a - b);
    const mid = sorted.length >> 1;
    const medianMs = sorted.length % 2 === 0
      ? (sorted[mid - 1] + sorted[mid]) / 2
      : sorted[mid];
    if (medianMs <= 0) return;

    const rawBpm = 60_000 / medianMs;
    const minBpm = pattern.bpm.min ?? 30;
    const maxBpm = pattern.bpm.max ?? 800;
    const clamped = Math.max(minBpm, Math.min(maxBpm, Math.round(rawBpm)));
    setBpm(clamped);
  }, [pattern.bpm.min, pattern.bpm.max]);

  const resetTaps = useCallback(() => setTapTimes([]), []);

  const tapBpm = useMemo(() => {
    if (tapTimes.length < 2) return null;
    const window = tapTimes.slice(-Math.min(TAP_WINDOW, tapTimes.length));
    const intervals: number[] = [];
    for (let i = 1; i < window.length; i++) intervals.push(window[i] - window[i - 1]);
    const sorted = [...intervals].sort((a, b) => a - b);
    const mid = sorted.length >> 1;
    const medianMs = sorted.length % 2 === 0
      ? (sorted[mid - 1] + sorted[mid]) / 2
      : sorted[mid];
    if (medianMs <= 0) return null;
    return Math.round(60_000 / medianMs);
  }, [tapTimes]);

  const toggle = useCallback(async () => {
    await engine.ensureCtx();
    if (playing) {
      engine.stop();
      setPlaying(false);
      setCountingIn(false);
    } else {
      if (bpm < trainerCfg.from && trainerOn) setBpm(trainerCfg.from);
      engine.setBpm(bpm);
      engine.start(countInBars);
      setPlaying(true);
      if (countInBars > 0) {
        setCountingIn(true);
        const barSec = pattern.steps * (60 / bpm);
        setTimeout(() => setCountingIn(false), countInBars * barSec * 1000);
      }
    }
  }, [engine, playing, bpm, trainerOn, trainerCfg.from, countInBars, pattern.steps]);

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
    const out = new Set<string>();
    const permute = (a: number[], m: number[] = []): void => {
      if (a.length === 0) { out.add(m.join(',')); return; }
      for (let i = 0; i < a.length; i++) {
        const cur = [...a];
        const nx = cur.splice(i, 1);
        permute(cur, m.concat(nx));
      }
    };
    permute(canon);
    return [...out].slice(0, 6).map((s) => s.split(',').map(Number));
  }, [pattern]);

  const toggleStep = useCallback((tr: VoiceId, s: number) => {
    const td = pattern.tracks[tr];
    if (!td) return;
    const arr = Array.isArray(td) ? td : td.pattern;
    arr[s] = arr[s] === 0 ? 2 : arr[s] === 2 ? 1 : 0;
    setCursors((c) => ({ ...c }));
    engine.loadPattern({ ...pattern, grouping });
  }, [engine, pattern, grouping]);

  const grid = {
    circular: <CircularGrid pattern={{ ...pattern, grouping }} cursors={cursors} size={440} onToggle={toggleStep} />,
    linear: <LinearGrid pattern={{ ...pattern, grouping }} cursors={cursors} onToggle={toggleStep} />,
    pill: <PillGrid pattern={{ ...pattern, grouping }} cursors={cursors} onToggle={toggleStep} />,
  }[view];

  const starred = isHighlighted(patternId);
  const starToggle = () => setHighlights(toggleHighlight(patternId));

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
            <button
              className={`bf-star ${starred ? 'on' : ''}`}
              onClick={starToggle}
              title={starred ? 'Unstar' : 'Star'}
              aria-label={starred ? 'Unstar pattern' : 'Star pattern'}
            >
              {starred ? '★' : '☆'}
            </button>
          </div>
          <div className="bf-pattern-origin">{pattern.origin}</div>
          <div className="bf-pattern-meta">
            <span className="bf-meta-badge">{pattern.timeSig}</span>
            <span className="bf-meta-badge alt">{grouping.join('+')}</span>
            <span className="bf-meta-badge alt">{pattern.difficulty}</span>
            {pattern.poly && <span className="bf-meta-badge alt">poly</span>}
          </div>
        </div>

        <div className={`bf-bpm-hero ${countingIn ? 'counting-in' : ''}`}>
          <div className="bf-bpm-num">{bpm}</div>
          <div className="bf-bpm-unit" title="Beats per minute — where one beat is one grid step">
            BPM <span style={{ opacity: 0.45, fontSize: '0.7em' }}>· step/min</span>
          </div>
          <div className="bf-bpm-controls">
            <button onClick={() => setBpm((b) => Math.max(30, b - 1))}>−</button>
            <input
              type="range"
              min={30}
              max={800}
              value={bpm}
              onChange={(e) => setBpm(Number(e.target.value))}
            />
            <button onClick={() => setBpm((b) => Math.min(800, b + 1))}>+</button>
          </div>
          <BeatDots grouping={grouping} currentStep={curStep} size={12} />
          {countingIn && <div className="bf-counting-in-badge">counting in…</div>}
        </div>

        <div className="bf-play-volume">
          <button className={`bf-play ${playing ? 'on' : ''}`} onClick={toggle}>
            {playing ? (
              <span><span className="bf-stop-ico" /> stop</span>
            ) : (
              <span><span className="bf-play-ico" /> play</span>
            )}
          </button>
          <div className="bf-volume" title="Master volume">
            <span className="bf-volume-ico" aria-hidden="true">
              {masterVolume === 0 ? '🔇' : masterVolume < 0.35 ? '🔈' : masterVolume < 0.7 ? '🔉' : '🔊'}
            </span>
            <input
              type="range"
              min={0}
              max={100}
              value={Math.round(masterVolume * 100)}
              onChange={(e) => {
                const v = Number(e.target.value) / 100;
                setMasterVolumeState(v);
                engine.setMasterVolume(v);
                storeMasterVolume(v);
              }}
              aria-label="Master volume"
            />
          </div>
        </div>

        <div className="bf-quick">
          <button
            className="bf-chip ghost"
            onClick={() => {
              const ids = PATTERNS.map((p) => p.id);
              setPatternId(ids[Math.floor(Math.random() * ids.length)]);
            }}
          >
            random
          </button>
        </div>

        <div className="bf-panel">
          <div className="bf-panel-head">patterns</div>
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
        </div>

        {pattern.story && (
          <details className="bf-story">
            <summary>about this rhythm</summary>
            <p>{pattern.story}</p>
          </details>
        )}
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
        <div className="bf-panel bf-tap-panel">
          <div className="bf-panel-head">
            <span>tap tempo</span>
            {tapBpm != null && (
              <span className="bf-tap-preview" title="Median BPM from recent taps">
                {tapBpm} bpm
              </span>
            )}
          </div>
          <div className="bf-tap-row">
            <button
              className={`bf-tap-btn ${tapTimes.length > 0 ? 'armed' : ''}`}
              onClick={handleTap}
              title="Tap repeatedly to set BPM — or press T"
              aria-label="Tap to set tempo"
            >
              tap
              <span className="bf-tap-hint">T</span>
            </button>
            <div className="bf-tap-meta">
              <span className="bf-mini-label">
                {tapTimes.length === 0
                  ? 'tap 4+ times'
                  : tapTimes.length === 1
                    ? 'keep tapping…'
                    : `${tapTimes.length} tap${tapTimes.length === 1 ? '' : 's'}`}
              </span>
              {tapTimes.length > 0 && (
                <button className="bf-tap-reset" onClick={resetTaps}>reset</button>
              )}
            </div>
            <div className="bf-tap-pips" aria-hidden="true">
              {Array.from({ length: TAP_WINDOW }).map((_, i) => (
                <span
                  key={i}
                  className={`bf-tap-pip ${i < Math.min(tapTimes.length, TAP_WINDOW) ? 'on' : ''}`}
                />
              ))}
            </div>
          </div>
        </div>

        <Trainer
          cfg={trainerCfg}
          setCfg={setTrainerCfg}
          on={trainerOn}
          setOn={setTrainerOn}
          bar={trainerBar}
          bpm={bpm}
        />

        <div className="bf-panel bf-group-accents-panel">
          <div className="bf-panel-head">
            <span>per-group accents</span>
            {groupAmps.some((a) => Math.abs(a - GROUP_AMP_DEFAULT) > 0.001) && (
              <button
                className="bf-group-accents-reset"
                onClick={() => setGroupAmps(grouping.map(() => GROUP_AMP_DEFAULT))}
                title="Reset all group accents to 1.0"
              >
                ⤺ reset
              </button>
            )}
          </div>
          {grouping.map((len, gi) => {
            const color = GROUP_COLORS[gi % GROUP_COLORS.length];
            const amp = groupAmps[gi] ?? GROUP_AMP_DEFAULT;
            return (
              <div className="bf-row bf-group-accents-row" key={gi}>
                <span
                  className="bf-group-accents-swatch"
                  style={{ background: color }}
                  aria-hidden="true"
                />
                <label className="bf-group-accents-label">
                  g{gi + 1}
                  <span className="bf-group-accents-len">·{len}</span>
                </label>
                <input
                  type="range"
                  min={GROUP_AMP_MIN * 100}
                  max={GROUP_AMP_MAX * 100}
                  value={Math.round(amp * 100)}
                  onChange={(e) => {
                    const v = Number(e.target.value) / 100;
                    setGroupAmps((cur) => {
                      const n = cur.slice();
                      n[gi] = v;
                      return n;
                    });
                  }}
                  aria-label={`Group ${gi + 1} accent`}
                />
                <span className="bf-val">{amp.toFixed(2)}×</span>
              </div>
            );
          })}
          <div className="bf-mini-label">multiplies on top of strong/weak</div>
        </div>

        <div className="bf-panel">
          <div className="bf-panel-head">count-in</div>
          <div className="bf-seg">
            {[0, 1, 2, 4].map((n) => (
              <button
                key={n}
                className={countInBars === n ? 'on' : ''}
                onClick={() => setCountInBars(n)}
              >
                {n === 0 ? 'off' : `${n} bar${n > 1 ? 's' : ''}`}
              </button>
            ))}
          </div>
        </div>

        <div className="bf-panel">
          <div className="bf-panel-head">stop after</div>
          <div className="bf-row">
            <label>cycles</label>
            <div className="bf-seg">
              {[0, 4, 8, 16, 32].map((n) => (
                <button
                  key={n}
                  className={stopAfter.mode === 'cycles' && stopAfter.value === n
                    ? 'on' : (n === 0 && stopAfter.mode === 'off' ? 'on' : '')}
                  onClick={() => setStopAfter(n === 0
                    ? { mode: 'off', value: 0 }
                    : { mode: 'cycles', value: n })}
                >
                  {n === 0 ? '∞' : n}
                </button>
              ))}
            </div>
          </div>
          <div className="bf-row">
            <label>min</label>
            <div className="bf-seg">
              {[1, 5, 10, 15, 30].map((n) => (
                <button
                  key={n}
                  className={stopAfter.mode === 'time' && stopAfter.value === n ? 'on' : ''}
                  onClick={() => setStopAfter({ mode: 'time', value: n })}
                >
                  {n}
                </button>
              ))}
            </div>
          </div>
          {stopAfter.mode !== 'off' && playing && (
            <div className="bf-mini-label">
              {stopAfter.mode === 'cycles'
                ? `${Math.max(0, stopAfter.value - trainerBar)} cycles remaining`
                : `stops after ${stopAfter.value} min`}
            </div>
          )}
        </div>

        <div className="bf-panel">
          <div className="bf-panel-head">polyrhythm overlay</div>
          <div className="bf-seg wrap">
            {OVERLAY_OPTIONS.map((n) => (
              <button
                key={n}
                className={overlaySubdivisions === n ? 'on' : ''}
                onClick={() => setOverlaySubdivisions(n)}
                title={n === 0 ? 'Off'
                  : OVERLAY_EXPERIMENTAL.has(n) ? `${n} over main (experimental)`
                  : `${n} over main`}
              >
                {n === 0 ? 'off' : `${n}`}
                {OVERLAY_EXPERIMENTAL.has(n) && <sup className="bf-exp">exp</sup>}
              </button>
            ))}
          </div>
          {overlaySubdivisions > 0 && (
            <div className="bf-mini-label">
              {overlaySubdivisions} clicks over {pattern.steps} main steps
            </div>
          )}
        </div>

        <div className="bf-panel">
          <div className="bf-panel-head">accents</div>
          <div className="bf-row">
            <label>strong</label>
            <input
              type="range"
              min={50}
              max={100}
              value={strong}
              onChange={(e) => setStrong(Number(e.target.value))}
            />
            <span className="bf-val">{strong}%</span>
          </div>
          <div className="bf-row">
            <label>weak</label>
            <input
              type="range"
              min={0}
              max={100}
              value={weak}
              onChange={(e) => setWeak(Number(e.target.value))}
            />
            <span className="bf-val">{weak}%</span>
          </div>
        </div>
        {pattern.swingable && (
          <div className="bf-panel">
            <div className="bf-panel-head">swing</div>
            <div className="bf-row">
              <input
                type="range"
                min={50}
                max={75}
                value={swing}
                onChange={(e) => setSwing(Number(e.target.value))}
              />
              <span className="bf-val">
                {swing === 50 ? 'straight' : swing >= 66 ? 'triplet' : `${swing}%`}
              </span>
            </div>
          </div>
        )}
        <div className="bf-panel">
          <div className="bf-panel-head">
            kit
            {kitOverride && (
              <button
                className="bf-kit-reset"
                onClick={() => {
                  clearKitOverride(pattern.id);
                  setKitOverrideState(null);
                }}
                title={`Reset to pattern default: ${pattern.defaultKit}`}
              >
                ⤺ {pattern.defaultKit}
              </button>
            )}
          </div>
          <div className="bf-kit-grid">
            {ALL_KITS.map((k) => (
              <button
                key={k}
                className={`bf-kit-btn ${activeKit === k ? 'on' : ''}`}
                onClick={() => {
                  if (k === pattern.defaultKit) {
                    clearKitOverride(pattern.id);
                    setKitOverrideState(null);
                  } else {
                    setKitOverride(pattern.id, k);
                    setKitOverrideState(k);
                  }
                }}
              >
                {k === 'frameDrum' ? 'frame' : k}
              </button>
            ))}
          </div>
        </div>
      </aside>
    </main>
  );
}
