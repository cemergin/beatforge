// Studio — the step-sequencer sketchpad. Per spec §2.1, a "simple step
// sequencer for sketching your own patterns on top of the same engine".

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { AudioEngine } from '../../audio/engine';
import { denomGlyph, naturalToStepBpm, parseTimeSigDenom, stepToNaturalBpm } from '../../audio/tempo';
import { useMetronome } from '../../audio/useMetronome';
import { clonePattern, resizeTracksToSteps } from './patternOps';
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
import { BpmHero } from '../../components/metronome/BpmHero';
import { PlayVolume } from '../../components/metronome/PlayVolume';
import { CountInPanel } from '../../components/metronome/CountInPanel';
import { AccentsPanel } from '../../components/metronome/AccentsPanel';
import { SwingPanel } from '../../components/metronome/SwingPanel';
import { KitPanel } from '../../components/metronome/KitPanel';
import { ALL_VOICES, VOICE_LABELS, autoNormalizeGrouping, blankPattern, generateId, METER_PRESETS } from './presets';
import { StudioGrid } from './StudioGrid';
import { StudioSidebar } from './StudioSidebar';
import { SaveDialog } from './SaveDialog';
import { ExportImport } from './ExportImport';
import { Trainer } from '../Practice/Trainer';

interface Props {
  engine: AudioEngine;
  initialPattern: Pattern | null;
  onConsumedInitial: () => void;
  onLoadInPractice: (id: string) => void;
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
  const denom = parseTimeSigDenom(draft.timeSig);

  const m = useMetronome(engine, {
    stepUnit: draft.stepUnit,
    timeSig: draft.timeSig,
    swingable: draft.swingable ?? false,
    initialBpm: stepToNaturalBpm(draft.bpm.default, draft.stepUnit, denom),
    initialSwing: 50,
    playing,
  });
  const {
    bpm, setBpm, handleTap: tap, tapTimes,
    trainerOn, setTrainerOn, trainerCfg, setTrainerCfg, trainerBar, trainerCycleStartMs,
    countInBars, setCountInBars, countingIn, setCountingIn,
    strong, setStrong, weak, setWeak,
    swing, setSwing,
    masterVolume, setMasterVolume,
  } = m;

  const [kit, setKit] = useState<KitId>(draft.defaultKit);
  const [cursors, setCursors] = useState<Record<string, number>>({});
  const [showSave, setShowSave] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const [yours, setYours] = useState<LoadedUserPattern[]>([]);

  // Follow the draft's default kit only until the user explicitly picks one.
  const kitOverrideRef = useRef(false);

  // rAF cursor polling (mirrors Practice).
  useEffect(() => {
    let raf = 0;
    const loop = () => {
      setCursors(engine.audibleCursors());
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

  // Keep engine in sync with draft pattern + kit. BPM, swing, accents,
  // trainer, and bar-subscription live in useMetronome.
  useEffect(() => {
    engine.loadPattern(draft);
  }, [engine, draft]);
  useEffect(() => { engine.setKit(kit); }, [engine, kit]);

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
    setDraft((d) => {
      const next = { ...d, bpm: { ...d.bpm, ...partial } };
      // Sync the live natural BPM when the user edits the metadata default.
      if (partial.default !== undefined) {
        setBpm(stepToNaturalBpm(partial.default, d.stepUnit, parseTimeSigDenom(d.timeSig)));
      }
      return next;
    });
  }, []);

  // Count-in timer ref so stop / unmount / pattern-change can cancel it,
  // preventing a ghost "countingIn=false" setter firing after unmount.
  const countInTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const clearCountInTimer = useCallback(() => {
    if (countInTimerRef.current !== null) {
      clearTimeout(countInTimerRef.current);
      countInTimerRef.current = null;
    }
  }, []);
  useEffect(() => clearCountInTimer, [clearCountInTimer]);

  const togglePlay = useCallback(async () => {
    await engine.ensureCtx();
    if (playing) {
      engine.stop();
      setPlaying(false);
      setCountingIn(false);
      clearCountInTimer();
    } else {
      if (bpm < trainerCfg.from && trainerOn) setBpm(trainerCfg.from);
      const stepBpm = naturalToStepBpm(bpm, draft.stepUnit, denom);
      engine.setBpm(stepBpm);
      engine.start(countInBars);
      setPlaying(true);
      clearCountInTimer();
      if (countInBars > 0) {
        setCountingIn(true);
        const barSec = draft.steps * (60 / stepBpm);
        countInTimerRef.current = setTimeout(() => {
          setCountingIn(false);
          countInTimerRef.current = null;
        }, countInBars * barSec * 1000);
      }
    }
  }, [engine, playing, bpm, countInBars, draft.steps, draft.stepUnit, denom, trainerOn, trainerCfg.from, clearCountInTimer]);

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

  // Parse the live time signature into editable num/den inputs.
  const [tsNum, tsDen] = useMemo(() => {
    const m = draft.timeSig.match(/^(\d+)\/(\d+)$/);
    if (!m) return [4, 4] as const;
    return [parseInt(m[1], 10), parseInt(m[2], 10)] as const;
  }, [draft.timeSig]);

  // Pick a stepUnit that divides (num × stepUnit) evenly by den. Prefer
  // the current stepUnit if it works so granularity is preserved.
  const pickStepUnit = useCallback((num: number, den: number, current: number): 4 | 8 | 16 => {
    const order: Array<4 | 8 | 16> = [current as 4 | 8 | 16, 16, 8, 4];
    for (const su of order) {
      if ((num * su) % den === 0) return su;
    }
    return 16;
  }, []);

  // Apply a (num, den) edit from the inline time-signature inputs.
  // Recomputes steps + grouping; resizes existing tracks to fit.
  const applyTimeSig = useCallback((num: number, den: number) => {
    if (!Number.isFinite(num) || num < 1 || num > 32) return;
    if (![2, 4, 8, 16].includes(den)) return;
    setDraft((d) => {
      const stepUnit = pickStepUnit(num, den, d.stepUnit);
      const steps = (num * stepUnit) / den;
      const grouping = autoNormalizeGrouping(steps);
      return {
        ...d,
        timeSig: `${num}/${den}`,
        steps,
        stepUnit,
        grouping,
        tracks: resizeTracksToSteps(d.tracks, d.steps, steps),
      };
    });
  }, [pickStepUnit]);

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
    setToast('Saved to Local');
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
    setBpm(stepToNaturalBpm(p.bpm.default, p.stepUnit, parseTimeSigDenom(p.timeSig)));
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
    setBpm(stepToNaturalBpm(fresh.bpm.default, fresh.stepUnit, parseTimeSigDenom(fresh.timeSig)));
    setKit(fresh.defaultKit);
    kitOverrideRef.current = false;
    setSavedId(null);
  }, [engine]);

  // Share the current draft. Always hash-encodes — Studio drafts have
  // arbitrary edits vs seed patterns, so the recipient can't resolve
  // them by id.
  const shareDraft = useCallback(async () => {
    try {
      const { buildSmartShareUrl } = await import('../../patterns/serialize');
      const url = await buildSmartShareUrl(draft, () => false);
      await navigator.clipboard.writeText(url);
      setToast('Share link copied');
    } catch {
      setToast('Copy failed');
    }
    window.setTimeout(() => setToast(null), 1800);
  }, [draft]);

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
            <button className="bf-chip ghost" onClick={shareDraft} type="button" title="Copy a standalone share link — recipient doesn't need the seed library">
              share ↗
            </button>
            <button className="bf-chip on" onClick={openSave} type="button">save as…</button>
            <button className="bf-chip ghost" onClick={loadInPractice} type="button">
              → practice
            </button>
          </div>
        </div>

        <div className="bf-studio-section">
          <div className="bf-studio-section-head">
            <span className="bf-mini-label">meter · {denomGlyph(parseTimeSigDenom(draft.timeSig))}</span>
          </div>
          <div className="bf-studio-timesig">
            <input
              type="number"
              min={1}
              step={1}
              className="bf-studio-input sm bf-studio-timesig-num"
              value={tsNum}
              onChange={(e) => {
                const n = Math.max(1, Math.floor(Number(e.target.value) || 1));
                applyTimeSig(n, tsDen);
              }}
              aria-label="Time signature numerator"
            />
            <span className="bf-studio-timesig-slash" aria-hidden="true">/</span>
            <select
              className="bf-studio-input sm bf-studio-timesig-den"
              value={tsDen}
              onChange={(e) => applyTimeSig(tsNum, Number(e.target.value))}
              aria-label="Time signature denominator"
            >
              <option value={2}>2</option>
              <option value={4}>4</option>
              <option value={8}>8</option>
              <option value={16}>16</option>
            </select>
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
        <BpmHero
          bpm={bpm}
          setBpm={setBpm}
          onTap={tap}
          tapArmed={tapTimes.length > 0}
          countingIn={countingIn}
          timeSig={draft.timeSig}
        />

        <PlayVolume
          playing={playing}
          onToggle={togglePlay}
          volume={masterVolume}
          onVolumeChange={setMasterVolume}
        />

        <Trainer
          cfg={trainerCfg}
          setCfg={setTrainerCfg}
          on={trainerOn}
          setOn={setTrainerOn}
          bar={trainerBar}
          bpm={bpm}
          cycleStartMs={trainerCycleStartMs}
        />

        <KitPanel
          activeKit={kit}
          onSelect={(k) => { kitOverrideRef.current = true; setKit(k); }}
        />

        <CountInPanel countInBars={countInBars} setCountInBars={setCountInBars} />

        <AccentsPanel
          strong={strong}
          setStrong={setStrong}
          weak={weak}
          setWeak={setWeak}
        />

        {draft.swingable && <SwingPanel swing={swing} setSwing={setSwing} />}

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
