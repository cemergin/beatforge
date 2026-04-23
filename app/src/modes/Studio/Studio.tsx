// Studio — the step-sequencer sketchpad. Per spec §2.1, a "simple step
// sequencer for sketching your own patterns on top of the same engine".

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { AudioEngine } from '../../audio/engine';
import type {
  KitId,
  Pattern,
  Track,
  Velocity,
  VoiceId,
} from '../../patterns/types';
import { trackMeta } from '../../patterns/types';
import {
  deleteUserPattern,
  loadAllSafe,
  saveUserPattern,
  type LoadedUserPattern,
  type UserPattern,
} from '../../lib/db';
import { BeatDots } from '../../components/BeatDots';
import { ALL_VOICES, VOICE_LABELS, autoNormalizeGrouping, blankPattern, generateId, METER_PRESETS } from './presets';
import { StudioGrid } from './StudioGrid';
import { StudioSidebar } from './StudioSidebar';
import { SaveDialog } from './SaveDialog';
import { ExportImport } from './ExportImport';
import { Trainer, type TrainerCfg } from '../Practice/Trainer';
import { getMasterVolume, setMasterVolume as storeMasterVolume } from '../../lib/storage';

const ALL_KITS: KitId[] = ['808', '909', '707', '727', 'frameDrum', 'tabla', 'gamelan'];
const OVERLAY_OPTIONS = [0, 3, 4, 5, 6, 7, 8, 9, 12];
const EXPERIMENTAL_OVERLAY = new Set([5, 7, 9, 12]);
const GROUP_AMP_DEFAULT = 1;

type StopAfterMode = 'off' | 'cycles' | 'time';
interface StopAfter { mode: StopAfterMode; value: number }

interface Props {
  engine: AudioEngine;
  initialPattern: Pattern | null;
  onConsumedInitial: () => void;
  onLoadInPractice: (id: string) => void;
}

/** Deep-clone a Pattern so edits never mutate seed data. */
function clonePattern(p: Pattern): Pattern {
  const tracks: Partial<Record<VoiceId, Track>> = {};
  for (const k of Object.keys(p.tracks) as VoiceId[]) {
    const td = p.tracks[k];
    if (!td) continue;
    if (Array.isArray(td)) {
      tracks[k] = [...td];
    } else {
      tracks[k] = { ...td, pattern: [...td.pattern] };
    }
  }
  return {
    ...p,
    grouping: [...p.grouping],
    tags: [...p.tags],
    instruments: p.instruments ? [...p.instruments] : undefined,
    relatedIds: p.relatedIds ? [...p.relatedIds] : undefined,
    bpm: { ...p.bpm },
    tracks,
  };
}

/** Resize a track array to `newSteps`, preserving leading values. */
function resizeVelocityArray(arr: Velocity[], newSteps: number): Velocity[] {
  const out = new Array<Velocity>(newSteps).fill(0);
  for (let i = 0; i < Math.min(arr.length, newSteps); i++) out[i] = arr[i];
  return out;
}

/** Apply a new step count to every track that rides the main division. */
function resizeTracksToSteps(
  tracks: Partial<Record<VoiceId, Track>>,
  oldSteps: number,
  newSteps: number,
): Partial<Record<VoiceId, Track>> {
  const out: Partial<Record<VoiceId, Track>> = {};
  for (const k of Object.keys(tracks) as VoiceId[]) {
    const td = tracks[k];
    if (!td) continue;
    if (Array.isArray(td)) {
      out[k] = resizeVelocityArray(td, newSteps);
    } else if ((td.subdivisions ?? oldSteps) === oldSteps) {
      // Main-division track in object form — resize pattern + drop stale cycle.
      out[k] = {
        ...td,
        pattern: resizeVelocityArray(td.pattern, newSteps),
        cycle: newSteps,
      };
    } else {
      // Polyrhythm track with its own subdivisions — leave alone.
      out[k] = td;
    }
  }
  return out;
}

export function Studio({
  engine, initialPattern, onConsumedInitial, onLoadInPractice,
}: Props) {
  // ── Seeding the draft ────────────────────────────────────────────
  const [draft, setDraft] = useState<Pattern>(() => {
    if (initialPattern) {
      const c = clonePattern(initialPattern);
      return { ...c, id: generateId(c.name + ' remix'), name: `${c.name} (remix)` };
    }
    return blankPattern();
  });
  // Track whether the current draft corresponds to a saved user pattern
  // (so "Load in Practice" can use its id once saved).
  const [savedId, setSavedId] = useState<string | null>(null);

  // Consume the initial-pattern handoff exactly once.
  const consumedRef = useRef(false);
  useEffect(() => {
    if (initialPattern && !consumedRef.current) {
      consumedRef.current = true;
      onConsumedInitial();
    }
  }, [initialPattern, onConsumedInitial]);

  const [playing, setPlaying] = useState(false);
  const [bpm, setBpm] = useState(draft.bpm.default);
  const [kit, setKit] = useState<KitId>(draft.defaultKit);
  const [cursors, setCursors] = useState<Record<string, number>>({});
  const [showSave, setShowSave] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const [yours, setYours] = useState<LoadedUserPattern[]>([]);

  // Practice-parity controls (spec: let Studio "do whatever you want").
  const [trainerOn, setTrainerOn] = useState(false);
  const [trainerCfg, setTrainerCfg] = useState<TrainerCfg>({
    from: 100, to: 160, step: 5, bars: 4, mode: 'cycles',
  });
  const [trainerBar, setTrainerBar] = useState(0);
  const [countInBars, setCountInBars] = useState(0);
  const [stopAfter, setStopAfter] = useState<StopAfter>({ mode: 'off', value: 0 });
  const [overlaySubdivisions, setOverlaySubdivisions] = useState(0);
  const [countingIn, setCountingIn] = useState(false);
  const [tapTimes, setTapTimes] = useState<number[]>([]);
  const [strong, setStrong] = useState(100);
  const [weak, setWeak] = useState(55);
  const [swing, setSwing] = useState(50);
  const [groupAmps, setGroupAmps] = useState<number[]>(
    () => draft.grouping.map(() => GROUP_AMP_DEFAULT),
  );
  const [masterVolume, setMasterVolumeState] = useState(() => getMasterVolume());

  // Follow the draft's default kit only until the user explicitly picks one.
  const kitOverrideRef = useRef(false);

  // rAF cursor polling (mirrors Practice).
  useEffect(() => {
    let raf = 0;
    const loop = () => {
      setCursors({ ...engine.cursors });
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, [engine]);

  // Stop playback on unmount (mirrors Library pattern).
  useEffect(() => {
    return () => {
      engine.stop();
    };
  }, [engine]);

  // Load user patterns from IDB on mount.
  const refreshYours = useCallback(async () => {
    const all = await loadAllSafe();
    setYours(all);
  }, []);
  useEffect(() => { refreshYours(); }, [refreshYours]);

  // Keep engine in sync with draft.
  useEffect(() => {
    engine.loadPattern(draft);
  }, [engine, draft]);
  useEffect(() => { engine.setBpm(bpm); }, [engine, bpm]);
  useEffect(() => { engine.setKit(kit); }, [engine, kit]);
  useEffect(() => {
    engine.setSwing(draft.swingable ? 0.5 + ((swing - 50) / 100) * 0.34 : 0.5);
  }, [engine, swing, draft.swingable]);
  useEffect(() => { engine.setAccents(strong / 100, weak / 100); }, [engine, strong, weak]);
  useEffect(() => { engine.setGroupAccents(groupAmps); }, [engine, groupAmps]);
  useEffect(() => {
    if (overlaySubdivisions > 0) engine.setOverlay({ subdivisions: overlaySubdivisions });
    else engine.setOverlay(null);
  }, [engine, overlaySubdivisions]);

  // Bar-boundary callback — trainer + stop-after. Uses subscribe API
  // so Practice and Studio coexist without stripping each other's handler.
  useEffect(() => {
    return engine.subscribeOnBar((bar) => {
      setTrainerBar(bar);
      if (stopAfter.mode === 'cycles' && bar >= stopAfter.value) {
        engine.stop();
        setPlaying(false);
      }
    });
  }, [engine, stopAfter]);

  // Stop-after time mode.
  useEffect(() => {
    if (!playing || stopAfter.mode !== 'time') return;
    const id = setTimeout(() => {
      engine.stop();
      setPlaying(false);
    }, stopAfter.value * 60_000);
    return () => clearTimeout(id);
  }, [playing, engine, stopAfter]);

  // Speed trainer — cycles mode.
  useEffect(() => {
    if (!trainerOn || !playing) return;
    if (trainerCfg.mode === 'cycles' && trainerBar > 0 && trainerBar % trainerCfg.bars === 0) {
      setBpm((b) => Math.min(trainerCfg.to, b + trainerCfg.step));
    }
  }, [trainerBar, trainerOn, playing, trainerCfg]);

  // Speed trainer — time mode.
  useEffect(() => {
    if (!trainerOn || trainerCfg.mode !== 'time' || !playing) return;
    const iv = setInterval(() => {
      setBpm((b) => Math.min(trainerCfg.to, b + trainerCfg.step));
    }, trainerCfg.bars * 1000);
    return () => clearInterval(iv);
  }, [trainerOn, trainerCfg, playing]);

  // Keep per-group accents array in sync with current grouping length.
  useEffect(() => {
    setGroupAmps((cur) => {
      if (cur.length === draft.grouping.length) return cur;
      return draft.grouping.map(() => GROUP_AMP_DEFAULT);
    });
  }, [draft.grouping]);

  // Tap-tempo.
  const tap = useCallback(() => {
    const now = performance.now();
    setTapTimes((ts) => {
      const recent = ts.length && now - ts[ts.length - 1] > 2000 ? [] : ts;
      const next = [...recent, now].slice(-8);
      if (next.length >= 2) {
        const intervals: number[] = [];
        for (let i = 1; i < next.length; i++) intervals.push(next[i] - next[i - 1]);
        const sorted = [...intervals].sort((a, b) => a - b);
        // True median: average the two middle values for even length.
        const mid = Math.floor(sorted.length / 2);
        const median = sorted.length % 2 === 0
          ? (sorted[mid - 1] + sorted[mid]) / 2
          : sorted[mid];
        const tapBpm = Math.round(60_000 / median);
        setBpm(Math.max(30, Math.min(800, tapBpm)));
      }
      return next;
    });
  }, []);

  // Keyboard: T for tap.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement;
      if (t && (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA' || t.isContentEditable)) return;
      if (e.key.toLowerCase() === 't' && !e.metaKey && !e.ctrlKey) tap();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [tap]);

  // Pattern-level bpm.default changed → reflect in live BPM if user hasn't drifted.
  // (Intentionally NOT syncing — user's live BPM is independent of metadata.)

  const updateDraft = useCallback((partial: Partial<Pattern>) => {
    setDraft((d) => {
      const next = { ...d, ...partial };
      // If the metadata default kit changed and user hasn't overridden, follow it.
      if (partial.defaultKit && !kitOverrideRef.current) {
        setKit(partial.defaultKit);
      }
      return next;
    });
  }, []);

  const updateBpm = useCallback((partial: Partial<Pattern['bpm']>) => {
    setDraft((d) => ({ ...d, bpm: { ...d.bpm, ...partial } }));
    if (partial.default !== undefined) setBpm(partial.default);
  }, []);

  const togglePlay = useCallback(async () => {
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
        const barSec = draft.steps * (60 / bpm);
        setTimeout(() => setCountingIn(false), countInBars * barSec * 1000);
      }
    }
  }, [engine, playing, bpm, countInBars, draft.steps, trainerOn, trainerCfg.from]);

  // Edits.
  const toggleCell = useCallback((tr: VoiceId, step: number) => {
    setDraft((d) => {
      const td = d.tracks[tr];
      if (!td) return d;
      const arr: Velocity[] = Array.isArray(td) ? [...td] : [...td.pattern];
      const cur = arr[step] ?? 0;
      arr[step] = (cur === 0 ? 2 : cur === 2 ? 1 : 0) as Velocity;
      const newTrack: Track = Array.isArray(td) ? arr : { ...td, pattern: arr };
      return { ...d, tracks: { ...d.tracks, [tr]: newTrack } };
    });
  }, []);

  const addVoice = useCallback((v: VoiceId) => {
    setDraft((d) => {
      if (d.tracks[v]) return d;
      return {
        ...d,
        tracks: { ...d.tracks, [v]: new Array<Velocity>(d.steps).fill(0) },
      };
    });
  }, []);

  const removeVoice = useCallback((v: VoiceId) => {
    setDraft((d) => {
      if (!d.tracks[v]) return d;
      const next = { ...d.tracks };
      delete next[v];
      return { ...d, tracks: next };
    });
  }, []);

  // Per-track subdivisions — the user's "just do whatever you want" unlock.
  // Changes the track between main-division (Velocity[]) and polyrhythm
  // (object form with subdivisions).
  const setTrackSubdivisions = useCallback((tr: VoiceId, subs: number) => {
    setDraft((d) => {
      const td = d.tracks[tr];
      if (!td) return d;
      const oldMeta = trackMeta(td, d.steps);
      const oldPattern = oldMeta.pattern;
      const newPattern: Velocity[] = new Array<Velocity>(subs).fill(0);
      // Preserve existing hits up to the new length, or cycle the old pattern.
      for (let i = 0; i < subs; i++) {
        newPattern[i] = oldPattern[i % oldPattern.length] ?? 0;
      }
      const newTrack: Track = subs === d.steps
        ? newPattern
        : { pattern: newPattern, subdivisions: subs, cycle: subs };
      return { ...d, tracks: { ...d.tracks, [tr]: newTrack } };
    });
  }, []);

  // Meter preset → resize every main-division track, replace grouping.
  const applyMeterPreset = useCallback((presetIdx: number) => {
    const m = METER_PRESETS[presetIdx];
    setDraft((d) => ({
      ...d,
      steps: m.steps,
      stepUnit: m.stepUnit,
      grouping: [...m.grouping],
      timeSig: m.label,
      tracks: resizeTracksToSteps(d.tracks, d.steps, m.steps),
    }));
  }, []);

  // Manual steps change.
  const setSteps = useCallback((newSteps: number) => {
    setDraft((d) => ({
      ...d,
      steps: newSteps,
      tracks: resizeTracksToSteps(d.tracks, d.steps, newSteps),
    }));
  }, []);

  // Grouping editor — accepts comma-separated ints.
  const [groupingText, setGroupingText] = useState(draft.grouping.join(','));
  // Sync external grouping changes into the text field when they come from presets etc.
  useEffect(() => {
    setGroupingText(draft.grouping.join(','));
  }, [draft.grouping]);

  const groupingSum = draft.grouping.reduce((a, b) => a + b, 0);
  const groupingValid = groupingSum === draft.steps;

  const commitGroupingText = useCallback(() => {
    const parts = groupingText
      .split(',')
      .map((s) => parseInt(s.trim(), 10))
      .filter((n) => !Number.isNaN(n) && n > 0);
    if (parts.length === 0) return;
    setDraft((d) => ({ ...d, grouping: parts }));
  }, [groupingText]);

  const autoFixGrouping = useCallback(() => {
    setDraft((d) => ({ ...d, grouping: autoNormalizeGrouping(d.steps) }));
  }, []);

  // ── Save flow ─────────────────────────────────────────────────────
  const openSave = useCallback(() => setShowSave(true), []);

  const confirmSave = useCallback(async () => {
    const now = Date.now();
    const existing = savedId ? yours.find((e) => e.pattern?.id === savedId)?.pattern : null;
    const id = existing ? existing.id : generateId(draft.name);
    const user: UserPattern = {
      ...draft,
      id,
      user: true,
      region: draft.region,
      createdAt: existing?.createdAt ?? now,
      updatedAt: now,
    };
    await saveUserPattern(user);
    setDraft((d) => ({ ...d, id }));
    setSavedId(id);
    setShowSave(false);
    setToast('Saved to Yours');
    setTimeout(() => setToast(null), 1800);
    refreshYours();
  }, [draft, savedId, yours, refreshYours]);

  const loadUserPattern = useCallback((id: string) => {
    const entry = yours.find((e) => e.pattern?.id === id);
    if (!entry?.pattern) return;
    engine.stop();
    setPlaying(false);
    const p = clonePattern(entry.pattern);
    setDraft(p);
    setBpm(p.bpm.default);
    setKit(p.defaultKit);
    kitOverrideRef.current = false;
    setSavedId(id);
  }, [yours, engine]);

  const handleDelete = useCallback(async (id: string) => {
    await deleteUserPattern(id);
    if (savedId === id) setSavedId(null);
    refreshYours();
  }, [savedId, refreshYours]);

  const loadInPractice = useCallback(async () => {
    // If not saved, auto-save as draft first so Practice can load it by id.
    let id = savedId;
    if (!id) {
      const now = Date.now();
      id = generateId(draft.name || 'draft');
      const user: UserPattern = {
        ...draft,
        id,
        user: true,
        createdAt: now,
        updatedAt: now,
      };
      await saveUserPattern(user);
      setDraft((d) => ({ ...d, id: id! }));
      setSavedId(id);
      refreshYours();
    }
    engine.stop();
    setPlaying(false);
    onLoadInPractice(id);
  }, [savedId, draft, engine, onLoadInPractice, refreshYours]);

  const newBlank = useCallback(() => {
    engine.stop();
    setPlaying(false);
    const fresh = blankPattern();
    setDraft(fresh);
    setBpm(fresh.bpm.default);
    setKit(fresh.defaultKit);
    kitOverrideRef.current = false;
    setSavedId(null);
  }, [engine]);

  const clearHits = useCallback(() => {
    setDraft((d) => {
      const cleared: Partial<Record<VoiceId, Track>> = {};
      for (const k of Object.keys(d.tracks) as VoiceId[]) {
        const td = d.tracks[k];
        if (!td) continue;
        if (Array.isArray(td)) {
          cleared[k] = new Array<Velocity>(td.length).fill(0);
        } else {
          cleared[k] = {
            ...td,
            pattern: new Array<Velocity>(td.pattern.length).fill(0),
          };
        }
      }
      return { ...d, tracks: cleared };
    });
  }, []);

  // Derived: voices in use / available.
  const voicesInUse = Object.keys(draft.tracks) as VoiceId[];
  const availableVoices = ALL_VOICES.filter((v) => !voicesInUse.includes(v));

  // Beat-dots cursor for the main division (only meaningful when first
  // track is non-polyrhythmic).
  const firstTrack = voicesInUse[0];
  const curStep = useMemo(() => {
    if (!firstTrack) return -1;
    const td = draft.tracks[firstTrack];
    if (!td) return -1;
    const meta = trackMeta(td, draft.steps);
    if (meta.subdivisions !== draft.steps) return -1;
    return cursors[firstTrack] ?? -1;
  }, [cursors, draft, firstTrack]);

  return (
    <main className="bf-main bf-studio-main">
      <aside className="bf-left">
        <StudioSidebar
          draft={draft}
          updateDraft={updateDraft}
          updateBpm={updateBpm}
          yours={yours}
          currentId={savedId}
          onLoadPattern={loadUserPattern}
          onDeletePattern={handleDelete}
        />
      </aside>

      <section className="bf-grid-wrap bf-studio-stage-wrap">
        <div className="bf-grid-head bf-studio-head">
          <div className="bf-studio-pattern-meta">
            <span className="bf-meta-badge">{draft.timeSig}</span>
            <span className="bf-meta-badge alt">{draft.grouping.join('+')}</span>
            <span className="bf-meta-badge alt">{draft.steps} steps</span>
            {savedId && <span className="bf-meta-badge alt">saved</span>}
          </div>
          <div className="bf-studio-actions">
            <button className="bf-chip ghost" onClick={newBlank} type="button">new</button>
            <button className="bf-chip ghost" onClick={clearHits} type="button">clear hits</button>
            <button className="bf-chip on" onClick={openSave} type="button">save as…</button>
            <button className="bf-chip ghost" onClick={loadInPractice} type="button">
              → practice
            </button>
          </div>
        </div>

        <div className="bf-studio-section">
          <div className="bf-studio-section-head">
            <span className="bf-mini-label">meter preset</span>
          </div>
          <div className="bf-chip-row wrap">
            {METER_PRESETS.map((m, i) => (
              <button
                key={m.label}
                className={`bf-chip ${draft.timeSig === m.label && draft.steps === m.steps ? 'on' : 'ghost'}`}
                onClick={() => applyMeterPreset(i)}
                type="button"
              >
                {m.label}
              </button>
            ))}
            <label className="bf-studio-steps-inline">
              <span className="bf-mini-label">steps</span>
              <input
                type="number"
                min={1}
                max={256}
                className="bf-studio-input sm"
                value={draft.steps}
                onChange={(e) => {
                  const n = Number(e.target.value);
                  if (n >= 1 && n <= 256) setSteps(n);
                }}
              />
            </label>
          </div>
        </div>

        <div className="bf-studio-section">
          <div className="bf-studio-section-head">
            <span className="bf-mini-label">grouping</span>
            <span className={`bf-studio-sum ${groupingValid ? 'ok' : 'bad'}`}>
              sums to {groupingSum} / {draft.steps}
              {!groupingValid && (
                <button className="bf-linkbtn" onClick={autoFixGrouping} type="button">
                  auto-fix
                </button>
              )}
            </span>
          </div>
          <div className="bf-studio-grouping-edit">
            <input
              className="bf-studio-input"
              value={groupingText}
              onChange={(e) => setGroupingText(e.target.value)}
              onBlur={commitGroupingText}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  commitGroupingText();
                }
              }}
              placeholder="comma-separated: 2,2,2,3"
            />
            <BeatDots grouping={draft.grouping} currentStep={curStep} size={10} />
          </div>
        </div>

        <div className="bf-studio-section">
          <div className="bf-studio-section-head">
            <span className="bf-mini-label">pattern</span>
            <span className="bf-studio-hint">click cells — 0 → ● strong → ○ ghost → off</span>
          </div>
          <div className="bf-studio-stage">
            <StudioGrid
              pattern={draft}
              cursors={cursors}
              onToggleCell={toggleCell}
              onRemoveTrack={removeVoice}
              onSetSubdivisions={setTrackSubdivisions}
            />
          </div>
        </div>

        <div className="bf-studio-section">
          <div className="bf-studio-section-head">
            <span className="bf-mini-label">voices</span>
          </div>
          <div className="bf-chip-row wrap">
            {voicesInUse.map((v) => (
              <span key={v} className="bf-voice-chip on">
                {VOICE_LABELS[v]} ({v})
                <button onClick={() => removeVoice(v)} title="Remove voice" type="button">
                  ×
                </button>
              </span>
            ))}
            {availableVoices.length > 0 && (
              <span className="bf-mini-label" style={{ alignSelf: 'center' }}>
                add:
              </span>
            )}
            {availableVoices.map((v) => (
              <button
                key={v}
                className="bf-chip ghost sm"
                onClick={() => addVoice(v)}
                type="button"
              >
                + {VOICE_LABELS[v]}
              </button>
            ))}
          </div>
        </div>
      </section>

      <aside className="bf-right">
        <div className={`bf-bpm-hero ${countingIn ? 'counting-in' : ''}`}>
          <div className="bf-bpm-num">{bpm}</div>
          <div className="bf-bpm-unit">
            BPM <span style={{ opacity: 0.7, fontSize: '0.7em' }}>· step/min</span>
          </div>
          <div className="bf-bpm-controls">
            <button onClick={() => setBpm((b) => Math.max(30, b - 1))} type="button">−</button>
            <input
              type="range"
              min={30}
              max={800}
              value={bpm}
              onChange={(e) => setBpm(Number(e.target.value))}
            />
            <button onClick={() => setBpm((b) => Math.min(800, b + 1))} type="button">+</button>
          </div>
          {countingIn && <div className="bf-counting-in-badge">counting in…</div>}
        </div>

        <div className="bf-play-volume">
          <button className={`bf-play ${playing ? 'on' : ''}`} onClick={togglePlay} type="button">
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

        <div className="bf-panel">
          <div className="bf-panel-head">tap tempo</div>
          <div className="bf-tap-row">
            <button
              className="bf-tap-btn"
              onClick={tap}
              type="button"
              title="Tap repeatedly (or press T) to set tempo"
            >
              <span className="bf-tap-shortcut">T</span>
              TAP
            </button>
            <div className="bf-tap-hint">
              {tapTimes.length < 2 ? 'tap 4+ times' : `${tapTimes.length} taps`}
              <div className="bf-tap-dots">
                {Array.from({ length: 8 }).map((_, i) => (
                  <span key={i} className={`bf-tap-dot ${i < tapTimes.length ? 'on' : ''}`} />
                ))}
              </div>
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

        <div className="bf-panel">
          <div className="bf-panel-head">
            <span>per-group accents</span>
            <button
              className="bf-linkbtn"
              onClick={() => setGroupAmps(draft.grouping.map(() => GROUP_AMP_DEFAULT))}
              type="button"
              title="Reset all to 1.00×"
            >
              reset
            </button>
          </div>
          {draft.grouping.map((glen, gi) => (
            <div key={gi} className="bf-group-accents-row">
              <span
                className="bf-group-accents-label"
                style={{ color: `var(--grp-${(gi % 7) + 1})` }}
              >
                g{gi + 1} ·{glen}
              </span>
              <input
                type="range"
                min={50}
                max={130}
                value={Math.round((groupAmps[gi] ?? GROUP_AMP_DEFAULT) * 100)}
                onChange={(e) => {
                  const v = Number(e.target.value) / 100;
                  setGroupAmps((amps) => {
                    const next = amps.length === draft.grouping.length
                      ? [...amps]
                      : draft.grouping.map(() => GROUP_AMP_DEFAULT);
                    next[gi] = v;
                    return next;
                  });
                }}
              />
              <span className="bf-val">
                {(groupAmps[gi] ?? GROUP_AMP_DEFAULT).toFixed(2)}×
              </span>
            </div>
          ))}
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
                type="button"
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
                  type="button"
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
                  type="button"
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
                type="button"
                title={n === 0 ? 'Off' : `${n} over main${EXPERIMENTAL_OVERLAY.has(n) ? ' (experimental)' : ''}`}
              >
                {n === 0 ? 'off' : `${n}`}
                {EXPERIMENTAL_OVERLAY.has(n) && <sup className="bf-exp">exp</sup>}
              </button>
            ))}
          </div>
          {overlaySubdivisions > 0 && (
            <div className="bf-mini-label">
              {overlaySubdivisions} clicks over {draft.steps} main steps
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

        {draft.swingable && (
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
          <div className="bf-panel-head">kit</div>
          <div className="bf-kit-grid">
            {ALL_KITS.map((k) => (
              <button
                key={k}
                className={`bf-kit-btn ${kit === k ? 'on' : ''}`}
                onClick={() => { kitOverrideRef.current = true; setKit(k); }}
                type="button"
              >
                {k === 'frameDrum' ? 'frame' : k}
              </button>
            ))}
          </div>
        </div>

        <div className="bf-panel">
          <div className="bf-panel-head">backup</div>
          <ExportImport userPatterns={yours.filter((e) => e.pattern).map((e) => e.pattern!)}
            onImported={refreshYours}
          />
        </div>
      </aside>

      {showSave && (
        <SaveDialog
          draft={draft}
          onCancel={() => setShowSave(false)}
          onConfirm={confirmSave}
        />
      )}

      {toast && <div className="bf-studio-toast">{toast}</div>}
    </main>
  );
}
