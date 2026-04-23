import { useCallback, useEffect, useMemo, useState } from 'react';
import type { AudioEngine } from '../../audio/engine';
import type { KitId, Pattern, VoiceId } from '../../patterns/types';
import { trackMeta } from '../../patterns/types';
import { PATTERNS, patternById } from '../../patterns/seed';
import { BeatDots } from '../../components/BeatDots';
import { CircularGrid } from '../../components/CircularGrid';
import { LinearGrid } from '../../components/LinearGrid';
import { PillGrid } from '../../components/PillGrid';
import { Trainer, type TrainerCfg } from './Trainer';

type View = 'circular' | 'linear' | 'pill';

const ALL_KITS: KitId[] = ['808', '909', '707', '727', 'frameDrum', 'tabla', 'gamelan'];

interface Props {
  engine: AudioEngine;
}

export function Practice({ engine }: Props) {
  const [patternId, setPatternId] = useState<string>(
    () => localStorage.getItem('bf_pattern') || 'karsilama',
  );
  const pattern: Pattern = useMemo(
    () => patternById(patternId) ?? PATTERNS[0],
    [patternId],
  );

  const [playing, setPlaying] = useState(false);
  const [bpm, setBpm] = useState(pattern.bpm.default);
  const [cursors, setCursors] = useState<Record<string, number>>({});
  // Session kit override; pattern.defaultKit is source of truth until user changes it.
  const [kitOverride, setKitOverride] = useState<KitId | null>(null);
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

  // rAF cursor polling — smoother than onStep-at-setTimeout
  useEffect(() => {
    let raf = 0;
    const loop = () => {
      // Snapshot cursors only when a frame needs rendering
      setCursors({ ...engine.cursors });
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, [engine]);

  // Bar-boundary callback → trainer bar counter
  useEffect(() => {
    engine.onBar = (bar: number) => setTrainerBar(bar);
    return () => { engine.onBar = null; };
  }, [engine]);

  // Pattern change → load into engine + reset trainer + reset kit override
  useEffect(() => {
    engine.loadPattern({ ...pattern, grouping: pattern.grouping });
    setBpm(pattern.bpm.default);
    setGrouping(pattern.grouping);
    setKitOverride(null);   // session override discards on pattern change (spec §5.2)
    localStorage.setItem('bf_pattern', pattern.id);
    setTrainerBar(0);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [patternId]);

  // Grouping change → engine re-applies pattern (grouping is display, but safe to re-load)
  useEffect(() => {
    engine.loadPattern({ ...pattern, grouping });
  }, [engine, pattern, grouping]);

  useEffect(() => { engine.setBpm(bpm); }, [engine, bpm]);
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

  // Speed trainer — time mode
  useEffect(() => {
    if (!trainerOn || trainerCfg.mode !== 'time' || !playing) return;
    const iv = setInterval(() => {
      setBpm((b) => Math.min(trainerCfg.to, b + trainerCfg.step));
    }, trainerCfg.bars * 1000);
    return () => clearInterval(iv);
  }, [trainerOn, trainerCfg, playing]);

  const toggle = useCallback(async () => {
    await engine.ensureCtx();
    if (playing) {
      engine.stop();
      setPlaying(false);
    } else {
      if (bpm < trainerCfg.from && trainerOn) setBpm(trainerCfg.from);
      engine.setBpm(bpm);
      engine.start();
      setPlaying(true);
    }
  }, [engine, playing, bpm, trainerOn, trainerCfg.from]);

  // Beat dots track the KK cursor (or first track's cursor) at main division.
  const curStep = useMemo(() => {
    const firstTrack = Object.keys(pattern.tracks)[0];
    if (!firstTrack) return -1;
    const td = pattern.tracks[firstTrack as VoiceId]!;
    const meta = trackMeta(td, pattern.steps);
    // Only meaningful for main-division tracks (polyrhythm tracks have their own cursor rhythm)
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
            {pattern.poly && <span className="bf-meta-badge alt">poly</span>}
          </div>
        </div>

        <div className="bf-bpm-hero">
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
        </div>

        <button className={`bf-play ${playing ? 'on' : ''}`} onClick={toggle}>
          {playing ? (
            <span><span className="bf-stop-ico" /> stop</span>
          ) : (
            <span><span className="bf-play-ico" /> play</span>
          )}
        </button>

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

      <section className="bf-grid-wrap">
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
          setOn={setTrainerOn}
          bar={trainerBar}
          bpm={bpm}
        />
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
                onClick={() => setKitOverride(null)}
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
                onClick={() => setKitOverride(k === pattern.defaultKit ? null : k)}
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
