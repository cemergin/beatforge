// Sound page — phase 1 v2: 5 channels visible at once, circular
// knobs for synth + per-channel mixer (level / pan / sends),
// audition triggers, ASDFG/QWERT keyboard.

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { SoundEngine, type SoundSequence, type SoundStep } from '../../audio/runtime/sound-engine';
import {
  VOICE_MACHINES,
  type VoiceArchetypeId,
  MACHINE_CATEGORY,
  MACHINE_CATEGORY_LABEL,
  MACHINE_CATEGORY_ORDER,
} from '../../audio/machines/registry';
import type { MachineConfig } from '../../audio/machines/types';
import {
  type Channel,
  type ColorFx,
  type SoundPattern,
  type SoundKit,
  defaultChannelEffects,
} from '../../patterns/types-sound';
import {
  saveSoundPattern,
  listSoundPatterns,
  deleteSoundPattern,
  saveSoundKit,
  listSoundKits,
  deleteSoundKit,
} from '../../lib/db';
import { SpectrumAnalyzer } from './SpectrumAnalyzer';
import { Knob } from './Knob';
import { StepGrid } from '../../components/StepGrid';
import { TransportBar } from '../../components/TransportBar';
import { Disclosure } from '../../components/Disclosure';
import { BeatDots } from '../../components/BeatDots';
import { CircularGrid } from '../../components/CircularGrid';
import { PillGrid } from '../../components/PillGrid';
import { GROUP_COLORS, groupIndexForStep } from '../../components/visual-helpers';

const COLOR_FX_TYPES: ColorFx['type'][] = ['none', 'overdrive', 'bitcrush', 'filter'];

function defaultColorFx(type: ColorFx['type']): ColorFx {
  switch (type) {
    case 'none':      return { type: 'none' };
    case 'overdrive': return { type: 'overdrive', drive: 0.5, tone: 2000, mix: 0.5 };
    case 'bitcrush':  return { type: 'bitcrush', bits: 8, rate: 8000, mix: 0.5 };
    case 'filter':    return { type: 'filter', mode: 'lp', cutoff: 2000, q: 1, mix: 1 };
  }
}

const SUBDIVISION_OPTIONS = [3, 4, 5, 6, 7, 8, 9, 12, 16];

// Free-form grouping editor — comma/+/space separated integers. Lives
// in its own subcomponent so we can use a `key` on its mount to reset
// its internal text state when external grouping changes (parent's
// permutation pill click, meter switch, pattern load). Side-steps the
// React-19 setState-in-effect rule that prohibits the alternative
// pattern (effect-driven sync of derived state).
function GroupingTextEditor({
  initialText,
  stepsPerBar,
  onApply,
}: {
  initialText: string;
  stepsPerBar: number;
  onApply: (parts: number[]) => void;
}) {
  const [text, setText] = useState(initialText);
  const parsed = useMemo(
    () => text
      .split(/[,+\s]+/)
      .filter(Boolean)
      .map(Number)
      .filter((n) => Number.isFinite(n) && n > 0),
    [text],
  );
  const sum = parsed.reduce((a, b) => a + b, 0);
  const commit = useCallback(() => {
    if (parsed.length === 0) return;
    onApply(parsed);
  }, [parsed, onApply]);
  return (
    <>
      <input
        type="text"
        className="bf-sound-grouping-input"
        value={text}
        onChange={(e) => setText(e.target.value)}
        onBlur={commit}
        onKeyDown={(e) => {
          if (e.key === 'Enter') {
            e.preventDefault();
            commit();
            (e.target as HTMLInputElement).blur();
          }
        }}
        placeholder="e.g. 2,2,3"
        aria-label="Custom grouping"
        title={`Type a custom grouping (currently sums to ${sum})`}
      />
      <span
        className={`bf-sound-grouping-sum ${sum === stepsPerBar ? 'ok' : 'pending'}`}
        title={`Sum of ${parsed.join('+') || '0'} = ${sum}`}
      >
        = {sum}
      </span>
    </>
  );
}

// Inline subcomponent — picks a channel's subdivision count.
// "main" means "use the global stepsPerBar"; any other value puts the
// channel in polyrhythm mode (its row resizes to that length).
function SubdivisionsBadge({
  value,
  mainSteps,
  onChange,
}: {
  value: number;
  mainSteps: number;
  onChange: (n: number) => void;
}) {
  const [open, setOpen] = useState(false);
  const isPoly = value !== mainSteps;
  return (
    <div className="bf-sound-subdiv">
      <button
        type="button"
        className={`bf-sound-subdiv-btn ${isPoly ? 'poly' : ''}`}
        onClick={() => setOpen((o) => !o)}
        title="Subdivisions (polyrhythm)"
      >
        ÷{value}{isPoly && <span className="bf-sound-subdiv-ratio"> :{mainSteps}</span>}
      </button>
      {open && (
        <div className="bf-sound-subdiv-menu">
          <button
            type="button"
            className={!isPoly ? 'on' : ''}
            onClick={() => { onChange(mainSteps); setOpen(false); }}
          >
            main (÷{mainSteps})
          </button>
          {SUBDIVISION_OPTIONS.filter((n) => n !== mainSteps).map((n) => (
            <button
              key={n}
              type="button"
              className={value === n ? 'on' : ''}
              onClick={() => { onChange(n); setOpen(false); }}
            >
              ÷{n}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function kebabId(name: string): string {
  const base = name
    .normalize('NFD')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '') || 'pattern';
  return `${base}-${Date.now().toString(36)}`;
}

const NUM_CHANNELS = 5;

// Local meter list — duplicated from modes/Studio/presets.ts so the
// Sound page doesn't depend on Studio's module. Will consolidate into
// patterns/meter-presets.ts when we unify the two pages.
interface MeterPreset {
  label: string;
  grouping: number[];
  stepUnit: 4 | 8 | 16;
}
const SOUND_METERS: MeterPreset[] = [
  { label: '4/4',  grouping: [4, 4, 4, 4],    stepUnit: 16 },
  { label: '3/4',  grouping: [4, 4, 4],       stepUnit: 16 },
  { label: '6/8',  grouping: [3, 3],          stepUnit: 8 },
  { label: '5/8',  grouping: [2, 3],          stepUnit: 8 },
  { label: '7/8',  grouping: [2, 2, 3],       stepUnit: 8 },
  { label: '9/8',  grouping: [2, 2, 2, 3],    stepUnit: 8 },
  { label: '11/8', grouping: [2, 2, 3, 2, 2], stepUnit: 8 },
  { label: '12/8', grouping: [3, 3, 3, 3],    stepUnit: 8 },
];
const DEFAULT_METER = SOUND_METERS[0];

const sumGroup = (g: number[]): number => g.reduce((a, b) => a + b, 0);

function emptySequence(stepsPerBar: number): SoundSequence {
  return Array.from({ length: NUM_CHANNELS }, () =>
    Array<SoundStep>(stepsPerBar).fill(0),
  );
}

// Friendly default — four-on-the-floor with backbeat snare and 8th-note
// hats. Gives the page an alive sound on first load; clear button wipes it.
function defaultSequence(): SoundSequence {
  const seq = emptySequence(sumGroup(DEFAULT_METER.grouping));
  for (const s of [0, 4, 8, 12]) seq[0][s] = 1;        // kick on the quarters
  seq[1][4] = 2; seq[1][12] = 2;                        // snare backbeat (accented)
  for (const s of [0, 2, 4, 6, 8, 10, 12, 14]) seq[2][s] = 1; // hat 8ths
  return seq;
}

/** Resize each row to `newSteps` — truncate if shorter, pad with 0s
 *  if longer. Used when the user swaps meter and the sequence needs
 *  to fit the new bar length. */
function resizeSequence(seq: SoundSequence, newSteps: number): SoundSequence {
  return seq.map((row) => {
    if (row.length === newSteps) return row;
    if (row.length > newSteps) return row.slice(0, newSteps);
    return [...row, ...Array<SoundStep>(newSteps - row.length).fill(0)];
  });
}

function defaultChannels(): Channel[] {
  const k = (archetype: VoiceArchetypeId, presetId?: string): MachineConfig => {
    const m = VOICE_MACHINES[archetype];
    const preset = presetId && m.presets ? m.presets[presetId] : undefined;
    return { ...m.defaults, ...preset };
  };
  // Classic 5-piece drum kit lineup — fastest path to laying a groove
  // down on first load. Users still swap any channel to bell/kalimba/
  // FM/etc via the machine picker.
  return [
    { label: 'Kick',    machine: k('kick'),     effects: defaultChannelEffects() },
    { label: 'Snare',   machine: k('snare'),    effects: defaultChannelEffects() },
    { label: 'Hat',     machine: k('hat'),      effects: defaultChannelEffects() },
    { label: 'Tom',     machine: k('tom'),      effects: defaultChannelEffects() },
    { label: 'Cowbell', machine: k('cowbell'),  effects: defaultChannelEffects() },
  ];
}

/** 3-char abbreviation derived from a channel's display name — used as
 *  the row label in StepGrid, the ring label in CircularGrid, etc. */
function shortFor(label: string): string {
  return label.trim().slice(0, 3) || '·';
}

interface SoundProps {
  /** Optional: when set, the Sound page auto-loads that soundPattern on
   *  mount (or when the id changes). Used by Practice's "saved sounds"
   *  cross-tab handoff so a single click takes the user from "discover"
   *  → "play in Sound." Cleared by the parent after consumption so a
   *  subsequent navigation back doesn't re-load. */
  initialSoundPatternId?: string | null;
  onConsumedInitial?: () => void;
}

export function Sound({ initialSoundPatternId, onConsumedInitial }: SoundProps = {}) {
  const [engine] = useState(() => new SoundEngine());
  useEffect(() => () => { engine.dispose(); }, [engine]);

  const [channels, setChannels] = useState<Channel[]>(() => defaultChannels());
  const [sequence, setSequence] = useState<SoundSequence>(() => defaultSequence());
  const [bpm, setBpm] = useState(110);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentStep, setCurrentStep] = useState(-1);
  const [currentBar, setCurrentBar] = useState(0);
  // Per-row cursors — each polyrhythm channel can be on a different
  // step. Refilled every frame from engine.audibleStepFor(i). When all
  // channels are at main rate every entry equals currentStep.
  const [rowCursors, setRowCursors] = useState<number[]>([]);
  const [meter, setMeter] = useState<MeterPreset>(DEFAULT_METER);
  // grouping is mutable per-permutation while meter stays the canonical
  // preset. Picking a different permutation reorders the additive
  // groups but keeps stepsPerBar (and thus the sequence column count)
  // unchanged. Switching meter resets grouping to that preset's canonical.
  const [grouping, setGrouping] = useState<number[]>(DEFAULT_METER.grouping);
  const stepsPerBar = sumGroup(grouping);
  const [viewMode, setViewMode] = useState<'linear' | 'pill' | 'circular'>('linear');

  // Pattern persistence — name + last-saved id (`null` until first save).
  // savedId is preserved across edits so a re-Save updates in place
  // rather than creating a duplicate.
  const [name, setName] = useState('Untitled');
  const [savedId, setSavedId] = useState<string | null>(null);
  const [savedList, setSavedList] = useState<SoundPattern[]>([]);
  const [toast, setToast] = useState<string | null>(null);

  // Kit persistence — separate from pattern; "kit" = the channel
  // palette only (machine configs + per-channel mixer + colour FX).
  // One kit can power many patterns; loading a kit only swaps channels.
  const [kitName, setKitName] = useState('My Ensemble');
  const [savedKitId, setSavedKitId] = useState<string | null>(null);
  const [savedKitList, setSavedKitList] = useState<SoundKit[]>([]);

  // Feel + master state. countInBars / swing / accents persist with
  // the pattern (saved-pattern shape captures all of them); master
  // volume + FX wet levels are session-only for now (could move to
  // localStorage later).
  const [countInBars, setCountInBars] = useState(0);
  const [swing, setSwing] = useState(0.5);
  const [strongAmp, setStrongAmp] = useState(1.0);
  const [weakAmp, setWeakAmp] = useState(0.55);
  const [masterVolume, setMasterVolume] = useState(0.85);
  // Master wet defaults audible so the moment a per-channel send goes
  // up, the user hears the master FX. User can dial dry.
  const [reverbWet, setReverbWet] = useState(0.5);
  const [reverbSize, setReverbSize] = useState(1.8);
  const [reverbDecay, setReverbDecay] = useState(2.2);
  const [delayWet, setDelayWet] = useState(0.15);
  const [delayTime, setDelayTime] = useState(0.25);   // seconds (1/8 at 120 BPM)
  const [delayFeedback, setDelayFeedback] = useState(0.35);

  // Hydrate the saved lists on mount + after every save/delete. The
  // mount effect uses promise-then form so setState lands in a
  // microtask (React-19's set-state-in-effect rule rejects an inline
  // setState even via an awaited helper). Save/delete handlers can
  // still call refresh* directly — that runs outside an effect.
  const refreshSavedList = useCallback(async () => {
    try {
      const list = await listSoundPatterns();
      setSavedList(list);
    } catch { /* IDB unavailable — keep silent, list stays empty */ }
  }, []);
  const refreshSavedKitList = useCallback(async () => {
    try {
      const list = await listSoundKits();
      setSavedKitList(list);
    } catch { /* IDB unavailable */ }
  }, []);
  useEffect(() => {
    let active = true;
    listSoundPatterns()
      .then((list) => { if (active) setSavedList(list); })
      .catch(() => { /* IDB unavailable */ });
    listSoundKits()
      .then((list) => { if (active) setSavedKitList(list); })
      .catch(() => { /* IDB unavailable */ });
    return () => { active = false; };
  }, []);

  // Auto-clear toasts after 1.8s. The toast value drives the effect so
  // setting a NEW toast resets the timer.
  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 1800);
    return () => clearTimeout(t);
  }, [toast]);

  // Refs so the keyboard handler reads the latest channels without
  // re-binding the listener on every channel change.
  const channelsRef = useRef(channels);
  useEffect(() => { channelsRef.current = channels; }, [channels]);

  // Push channel mixer params + machine configs to the engine on
  // any channel change. The scheduler reads `machines` at trigger time,
  // so knob tweaks during playback show up on the next step they fire.
  useEffect(() => {
    void engine.ensureCtx().then(() => {
      channels.forEach((c, i) => engine.applyChannelEffects(i, c.effects));
      engine.setMachines(channels.map((c) => c.machine));
    });
  }, [engine, channels]);

  // Push sequence + BPM + stepUnit + grouping + feel/master to the
  // engine. Each useEffect tracks a single state slice so we don't
  // resend everything on a single-knob tweak.
  useEffect(() => { engine.setSequence(sequence); }, [engine, sequence]);
  useEffect(() => { engine.setBpm(bpm); }, [engine, bpm]);
  useEffect(() => { engine.setStepUnit(meter.stepUnit); }, [engine, meter.stepUnit]);
  useEffect(() => { engine.setStepsPerBar(stepsPerBar); }, [engine, stepsPerBar]);
  useEffect(() => { engine.setGrouping(grouping); }, [engine, grouping]);
  useEffect(() => { engine.setSwing(swing); }, [engine, swing]);
  useEffect(() => { engine.setAccents(strongAmp, weakAmp); }, [engine, strongAmp, weakAmp]);
  useEffect(() => { engine.setMasterVolume(masterVolume); }, [engine, masterVolume]);
  useEffect(() => { engine.setReverbWet(reverbWet); }, [engine, reverbWet]);
  useEffect(() => { engine.setReverbSize(reverbSize); }, [engine, reverbSize]);
  useEffect(() => { engine.setReverbDecay(reverbDecay); }, [engine, reverbDecay]);
  useEffect(() => { engine.setDelayWet(delayWet); }, [engine, delayWet]);
  useEffect(() => { engine.setDelayTime(delayTime); }, [engine, delayTime]);
  useEffect(() => { engine.setDelayFeedback(delayFeedback); }, [engine, delayFeedback]);

  // Drive the visual playhead + bar counter from audible* getters —
  // what's playing NOW, not what's queued 300ms ahead. Frame loop
  // only runs while playing; the resets on stop happen in onPlayToggle
  // (avoids the React-19 setState-in-effect-body lint).
  // channels.length is in deps so when channels add/remove the loop
  // re-binds with the right rowCursors length.
  useEffect(() => {
    if (!isPlaying) return;
    let raf = 0;
    const channelCount = channels.length;
    const loop = () => {
      setCurrentStep(engine.audibleStep());
      setCurrentBar(engine.audibleBar());
      const cursors: number[] = new Array(channelCount);
      for (let i = 0; i < channelCount; i++) cursors[i] = engine.audibleStepFor(i);
      setRowCursors(cursors);
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, [engine, isPlaying, channels.length]);

  const trigger = useCallback(async (idx: number, amp = 1.0) => {
    await engine.ensureCtx();
    const ch = channelsRef.current[idx];
    if (ch) {
      // Re-apply effects right before trigger so any in-flight knob
      // tweak is honored on the very next hit.
      engine.applyChannelEffects(idx, ch.effects);
      engine.trigger(idx, ch.machine, amp);
    }
  }, [engine]);

  const onPlayToggle = useCallback(async () => {
    if (isPlaying) {
      engine.stop();
      setIsPlaying(false);
      setCurrentStep(-1);
      setCurrentBar(0);
      setRowCursors([]);
    } else {
      await engine.play({ countInBars });
      setIsPlaying(true);
    }
  }, [engine, isPlaying, countInBars]);

  // Cycle a cell: 0 → 2 (strong) → 1 (weak/ghost) → 0. First click puts
  // an audible accent down — that's the "useful" gesture. Second click
  // demotes to a ghost; third click clears. Mirrors Studio's order so
  // muscle memory carries.
  const onToggleCell = useCallback((rowIdx: number, stepIdx: number) => {
    setSequence((prev) => prev.map((row, r) => {
      if (r !== rowIdx) return row;
      return row.map((v, s) => {
        if (s !== stepIdx) return v;
        return (v === 0 ? 2 : v === 2 ? 1 : 0) as SoundStep;
      });
    }));
  }, []);

  const onClear = useCallback(() => {
    setSequence(emptySequence(stepsPerBar));
  }, [stepsPerBar]);

  // Switch meter — resize each row to the new bar length so existing
  // beats survive when possible (truncate excess on shrink, pad with
  // 0s on grow). Also reset grouping to the new preset's canonical
  // (a different meter has its own native grouping). Engine re-anchors
  // automatically on setStepUnit.
  const onMeterChange = useCallback((m: MeterPreset) => {
    setMeter(m);
    setGrouping([...m.grouping]);
    setSequence((prev) => resizeSequence(prev, sumGroup(m.grouping)));
  }, []);

  // Permutation picker — keep stepsPerBar but reorder the additive
  // groups. The sequence cells stay where they are (positionally); the
  // visual coloring + downbeats shift to the new boundaries.
  const onGroupingChange = useCallback((g: number[]) => {
    setGrouping([...g]);
  }, []);

  // Free-form grouping editor commit handler — re-sizes sequence rows
  // when the sum changes so engine + grid stay in sync. Same parsing
  // semantics as Studio.
  const onGroupingTextApply = useCallback((parts: number[]) => {
    if (parts.length === 0) return;
    setGrouping([...parts]);
    const newSum = parts.reduce((a, b) => a + b, 0);
    if (newSum !== stepsPerBar) {
      setSequence((prev) => resizeSequence(prev, newSum));
    }
  }, [stepsPerBar]);

  // Enumerate up to 6 permutations of the canonical grouping. Same
  // bounded-search pattern as Practice — full permutation enumeration
  // for length-8 groupings is 40k+ entries, which would freeze the tab.
  const groupingOptions = useMemo(() => {
    const canon = meter.grouping;
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
  }, [meter.grouping]);

  // Tap-tempo state. Sliding 2-second window of taps; BPM is the
  // average over the most recent 2..N intervals. Lives in a ref so it
  // doesn't trigger re-renders, and so successive taps can read the
  // latest array without stale-closure issues.
  const tapTimes = useRef<number[]>([]);
  const onTap = useCallback(() => {
    const now = performance.now();
    tapTimes.current = tapTimes.current.filter((t) => now - t < 2000);
    tapTimes.current.push(now);
    const taps = tapTimes.current;
    if (taps.length < 2) return;
    let sum = 0;
    for (let i = 1; i < taps.length; i++) sum += taps[i] - taps[i - 1];
    const avgInterval = sum / (taps.length - 1);
    const candidate = Math.round(60000 / avgInterval);
    if (candidate >= 30 && candidate <= 300) setBpm(candidate);
  }, []);

  // Save / load / delete handlers. Each `save` either creates a new
  // pattern (no savedId) or updates the current one (preserves
  // createdAt). loadSavedPattern fully replaces editor state — name,
  // bpm, meter, channels, sequence — and resets the playhead.
  const onSave = useCallback(async () => {
    const trimmed = name.trim() || 'Untitled';
    const now = Date.now();
    const id = savedId ?? kebabId(trimmed);
    const existing = savedId ? savedList.find((p) => p.id === savedId) : undefined;
    const pattern: SoundPattern = {
      id,
      name: trimmed,
      bpm,
      grouping: [...grouping],
      stepUnit: meter.stepUnit,
      sequence: sequence.map((row) => [...row]),
      channels: channels.map((c) => ({
        label: c.label,
        machine: { ...c.machine },
        effects: { ...c.effects, colorFx: { ...c.effects.colorFx } },
      })),
      countInBars,
      swing,
      strongAmp,
      weakAmp,
      reverbWet,
      reverbSize,
      reverbDecay,
      delayWet,
      delayTime,
      delayFeedback,
      createdAt: existing?.createdAt ?? now,
      updatedAt: now,
    };
    try {
      await saveSoundPattern(pattern);
      setSavedId(id);
      setName(trimmed);
      setToast(savedId ? 'Updated' : 'Saved');
      await refreshSavedList();
    } catch {
      setToast('Save failed');
    }
  }, [
    name, savedId, savedList, bpm, meter, grouping, sequence, channels,
    countInBars, swing, strongAmp, weakAmp,
    reverbWet, reverbSize, reverbDecay,
    delayWet, delayTime, delayFeedback,
    refreshSavedList,
  ]);

  const loadSavedPattern = useCallback((p: SoundPattern) => {
    if (isPlaying) {
      engine.stop();
      setIsPlaying(false);
      setCurrentStep(-1);
    }
    setName(p.name);
    setSavedId(p.id);
    setBpm(p.bpm);
    // Reconstruct meter from the saved grouping + stepUnit. If it
    // matches a built-in preset, use that (so the meter chips show
    // the right one as active); otherwise synthesize an ad-hoc preset.
    const matchedPreset = SOUND_METERS.find(
      (m) =>
        m.stepUnit === p.stepUnit &&
        m.grouping.length === p.grouping.length &&
        m.grouping.every((v, i) => v === p.grouping[i]),
    );
    setMeter(matchedPreset ?? {
      label: `${sumGroup(p.grouping) * (p.stepUnit / 4)}/${p.stepUnit}`,
      grouping: [...p.grouping],
      stepUnit: p.stepUnit,
    });
    // Restore the SAVED grouping (which may be a permutation of the
    // canonical) — meter holds the canonical so permutations regenerate;
    // this keeps the user's chosen ordering.
    setGrouping([...p.grouping]);
    setChannels(p.channels.map((c) => ({
      label: c.label,
      machine: { ...c.machine },
      effects: { ...c.effects, colorFx: { ...c.effects.colorFx } },
    })));
    // Coerce stored numbers into SoundStep (saved as number[][] for
    // forward-compat — we may broaden velocity beyond 0/1/2 later).
    setSequence(p.sequence.map((row) => row.map((v) => (v === 2 ? 2 : v === 1 ? 1 : 0) as SoundStep)));
    // Feel + master with defaults — patterns saved before these fields
    // existed should load cleanly to the defaults (no surprise loud
    // reverb because an old pattern lacked the field).
    setCountInBars(p.countInBars ?? 0);
    setSwing(p.swing ?? 0.5);
    setStrongAmp(p.strongAmp ?? 1.0);
    setWeakAmp(p.weakAmp ?? 0.55);
    setReverbWet(p.reverbWet ?? 0.5);
    setReverbSize(p.reverbSize ?? 1.8);
    setReverbDecay(p.reverbDecay ?? 2.2);
    setDelayWet(p.delayWet ?? 0.15);
    setDelayTime(p.delayTime ?? 0.25);
    setDelayFeedback(p.delayFeedback ?? 0.35);
    setToast(`Loaded ${p.name}`);
  }, [engine, isPlaying]);

  // Cross-tab handoff — when Practice (or any other surface) routes
  // here with an `initialSoundPatternId`, fetch + load that pattern
  // on mount. setState happens inside a microtask (`.then`) so the
  // React-19 set-state-in-effect rule is satisfied.
  useEffect(() => {
    if (!initialSoundPatternId) return;
    let active = true;
    listSoundPatterns()
      .then((list) => {
        if (!active) return;
        const p = list.find((sp) => sp.id === initialSoundPatternId);
        if (p) loadSavedPattern(p);
        onConsumedInitial?.();
      })
      .catch(() => { /* IDB unavailable — silent */ });
    return () => { active = false; };
  }, [initialSoundPatternId, loadSavedPattern, onConsumedInitial]);

  const onDeleteSaved = useCallback(async (id: string) => {
    try {
      await deleteSoundPattern(id);
      if (savedId === id) setSavedId(null);
      await refreshSavedList();
      setToast('Deleted');
    } catch {
      setToast('Delete failed');
    }
  }, [savedId, refreshSavedList]);

  // ── Kit save/load/delete ─────────────────────────────────────────
  // Kits are channels-only (palette). Loading a kit replaces the
  // active channels but leaves sequence + meter + feel + master FX
  // alone, so users can A/B kits against the same rhythm.
  const onSaveKit = useCallback(async () => {
    const trimmed = kitName.trim() || 'My Ensemble';
    const now = Date.now();
    const id = savedKitId ?? kebabId(trimmed);
    const existing = savedKitId ? savedKitList.find((k) => k.id === savedKitId) : undefined;
    const kit: SoundKit = {
      id,
      name: trimmed,
      channels: channels.map((c) => ({
        label: c.label,
        machine: { ...c.machine },
        effects: { ...c.effects, colorFx: { ...c.effects.colorFx } },
      })),
      createdAt: existing?.createdAt ?? now,
      updatedAt: now,
    };
    try {
      await saveSoundKit(kit);
      setSavedKitId(id);
      setKitName(trimmed);
      setToast(savedKitId ? 'Kit updated' : 'Kit saved');
      await refreshSavedKitList();
    } catch {
      setToast('Save failed');
    }
  }, [kitName, savedKitId, savedKitList, channels, refreshSavedKitList]);

  const loadSavedKit = useCallback((k: SoundKit) => {
    setKitName(k.name);
    setSavedKitId(k.id);
    setChannels(k.channels.map((c) => ({
      label: c.label,
      machine: { ...c.machine },
      effects: { ...c.effects, colorFx: { ...c.effects.colorFx } },
    })));
    setToast(`Kit: ${k.name}`);
  }, []);

  const onDeleteSavedKit = useCallback(async (id: string) => {
    try {
      await deleteSoundKit(id);
      if (savedKitId === id) setSavedKitId(null);
      await refreshSavedKitList();
      setToast('Kit deleted');
    } catch {
      setToast('Delete failed');
    }
  }, [savedKitId, refreshSavedKitList]);

  const onNewBlank = useCallback(() => {
    if (isPlaying) {
      engine.stop();
      setIsPlaying(false);
      setCurrentStep(-1);
    }
    setName('Untitled');
    setSavedId(null);
    setSequence(emptySequence(stepsPerBar));
  }, [engine, isPlaying, stepsPerBar]);

  // ASDFG → channels 1-5 at amp 1.0; QWERT → same channels at amp 2.0
  // (accent). Numeric 1-5 also accepted.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement | null;
      if (t && (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA' || t.isContentEditable)) return;
      if (e.repeat) return;
      const key = e.key.toLowerCase();
      const padIdx: Record<string, [number, number]> = {
        a: [0, 1], s: [1, 1], d: [2, 1], f: [3, 1], g: [4, 1],
        q: [0, 2], w: [1, 2], e: [2, 2], r: [3, 2], t: [4, 2],
        '1': [0, 1], '2': [1, 1], '3': [2, 1], '4': [3, 1], '5': [4, 1],
      };
      const action = padIdx[key];
      if (action) {
        e.preventDefault();
        void trigger(action[0], action[1]);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [trigger]);

  // Space toggles play/stop. (T-for-tap can't go here — the audition
  // keyboard already maps T to channel-5 accent.) Skipped when typing
  // in an input; tap-tempo lives on its transport button instead.
  useEffect(() => {
    const onSpace = (e: KeyboardEvent) => {
      if (e.code !== 'Space') return;
      const el = e.target as HTMLElement | null;
      if (el && (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA' || el.isContentEditable)) return;
      e.preventDefault();
      void onPlayToggle();
    };
    window.addEventListener('keydown', onSpace);
    return () => window.removeEventListener('keydown', onSpace);
  }, [onPlayToggle]);

  const setKnob = useCallback((channelIdx: number, knobId: string, value: number) => {
    setChannels((cs) => cs.map((c, i) => (
      i === channelIdx ? { ...c, machine: { ...c.machine, [knobId]: value } } : c
    )));
  }, []);

  const setDiscrete = useCallback((channelIdx: number, fieldId: string, value: string) => {
    setChannels((cs) => cs.map((c, i) => (
      i === channelIdx ? { ...c, machine: { ...c.machine, [fieldId]: value } } : c
    )));
  }, []);

  const setMixer = useCallback(
    (channelIdx: number, field: 'level' | 'pan' | 'reverbSend' | 'delaySend', value: number) => {
      setChannels((cs) => cs.map((c, i) => (
        i === channelIdx
          ? { ...c, effects: { ...c.effects, [field]: value } }
          : c
      )));
    },
    [],
  );

  const swapArchetype = useCallback((channelIdx: number, id: VoiceArchetypeId) => {
    setChannels((cs) => cs.map((c, i) => (
      i === channelIdx ? { ...c, machine: { ...VOICE_MACHINES[id].defaults } } : c
    )));
  }, []);

  const setChannelLabel = useCallback((channelIdx: number, label: string) => {
    setChannels((cs) => cs.map((c, i) => (i === channelIdx ? { ...c, label } : c)));
  }, []);

  // Per-channel polyrhythm: cycle that row's length through a fixed
  // ladder. n === stepsPerBar means "main rate" (no polyrhythm).
  // Sequence row resizes (truncate or pad with zeros). Engine
  // re-anchors that channel at the next bar boundary.
  const setSubdivisions = useCallback((channelIdx: number, n: number) => {
    const target = Math.max(2, Math.floor(n));
    setSequence((seq) => seq.map((row, i) => {
      if (i !== channelIdx) return row;
      if (row.length === target) return row;
      if (row.length > target) return row.slice(0, target);
      return [...row, ...Array<SoundStep>(target - row.length).fill(0)];
    }));
  }, []);

  // Color-FX type swap — rebuilds the colorFx object with this type's
  // defaults so the user always lands on a sensible starting point.
  const setColorFxType = useCallback((channelIdx: number, type: ColorFx['type']) => {
    setChannels((cs) => cs.map((c, i) => (
      i === channelIdx
        ? { ...c, effects: { ...c.effects, colorFx: defaultColorFx(type) } }
        : c
    )));
  }, []);

  // Update one parameter of the current colorFx. The cast is safe at
  // runtime because the caller knows the active type — we only ever
  // call this from JSX that's already gated on type. Keeping the
  // signature broad (string + value) avoids verbose generic noise here.
  const setColorFxParam = useCallback(
    (channelIdx: number, field: string, value: number | string) => {
      setChannels((cs) => cs.map((c, i) => {
        if (i !== channelIdx) return c;
        const next = { ...c.effects.colorFx, [field]: value } as ColorFx;
        return { ...c, effects: { ...c.effects, colorFx: next } };
      }));
    },
    [],
  );

  const applyPreset = useCallback((channelIdx: number, presetId: string) => {
    setChannels((cs) => cs.map((c, i) => {
      if (i !== channelIdx) return c;
      const m = VOICE_MACHINES[c.machine.archetype as VoiceArchetypeId];
      const presets = m.presets;
      if (!presets || !presets[presetId]) return c;
      return { ...c, machine: { ...c.machine, ...presets[presetId] } };
    }));
  }, []);

  return (
    <main className="bf-sound-page">
      <SpectrumAnalyzer engine={engine} />

      <header className="bf-sound-hero">
        <h1 className="bf-sound-title">Sound</h1>
        <p className="bf-sound-sub">
          Sequence steps below; design the sound in each channel.
          <kbd>Space</kbd> plays. <kbd>A</kbd>–<kbd>G</kbd> auditions
          (<kbd>Q</kbd>–<kbd>T</kbd> accent). Click a cell to cycle
          off → on → accent.
        </p>
      </header>

      <section className="bf-sound-sequencer">
        <div className="bf-sound-patternbar bf-sound-kitbar">
          <span className="bf-sound-bar-tag">ensemble</span>
          <input
            className="bf-sound-name"
            type="text"
            value={kitName}
            onChange={(e) => setKitName(e.target.value)}
            placeholder="Ensemble name"
            aria-label="Ensemble name"
          />
          <button
            type="button"
            className="bf-sound-saveBtn"
            onClick={() => void onSaveKit()}
            title={savedKitId ? 'Update saved ensemble' : 'Save the current channel palette'}
          >
            {savedKitId ? 'update' : 'save ensemble'}
          </button>
          <div className="bf-sound-savedlist" role="list">
            {savedKitList.length === 0 && (
              <span className="bf-sound-savedempty">no saved ensembles yet</span>
            )}
            {savedKitList.map((k) => (
              <span
                key={k.id}
                role="listitem"
                className={`bf-sound-savedchip ${k.id === savedKitId ? 'on' : ''}`}
              >
                <button
                  type="button"
                  className="bf-sound-savedchip-load"
                  onClick={() => loadSavedKit(k)}
                  title={`Load ensemble — ${k.channels.map((c) => c.label).join(', ')}`}
                >
                  {k.name}
                </button>
                <button
                  type="button"
                  className="bf-sound-savedchip-del"
                  onClick={() => void onDeleteSavedKit(k.id)}
                  title="Delete"
                  aria-label={`Delete ensemble ${k.name}`}
                >
                  ×
                </button>
              </span>
            ))}
          </div>
        </div>

        <div className="bf-sound-patternbar">
          <span className="bf-sound-bar-tag">pattern</span>
          <input
            className="bf-sound-name"
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Pattern name"
            aria-label="Pattern name"
          />
          <button
            type="button"
            className="bf-sound-saveBtn"
            onClick={() => void onSave()}
            title={savedId ? 'Update saved pattern' : 'Save to local'}
          >
            {savedId ? 'update' : 'save'}
          </button>
          <button
            type="button"
            className="bf-sound-newBtn"
            onClick={onNewBlank}
            title="New blank pattern"
          >
            new
          </button>
          <div className="bf-sound-savedlist" role="list">
            {savedList.length === 0 && (
              <span className="bf-sound-savedempty">no saved patterns yet</span>
            )}
            {savedList.map((p) => (
              <span
                key={p.id}
                role="listitem"
                className={`bf-sound-savedchip ${p.id === savedId ? 'on' : ''}`}
              >
                <button
                  type="button"
                  className="bf-sound-savedchip-load"
                  onClick={() => loadSavedPattern(p)}
                  title={`Load — ${p.bpm} BPM, ${p.grouping.join('+')}`}
                >
                  {p.name}
                </button>
                <button
                  type="button"
                  className="bf-sound-savedchip-del"
                  onClick={() => void onDeleteSaved(p.id)}
                  title="Delete"
                  aria-label={`Delete ${p.name}`}
                >
                  ×
                </button>
              </span>
            ))}
          </div>
          {toast && <span className="bf-sound-toast">{toast}</span>}
        </div>

        <TransportBar
          isPlaying={isPlaying}
          bpm={bpm}
          onPlayToggle={() => void onPlayToggle()}
          onBpmChange={setBpm}
          onClear={onClear}
          onTap={onTap}
          barCounter={currentBar}
          rightSlot={
            <div className="bf-meter-pills" aria-label="Meter">
              {SOUND_METERS.map((m) => (
                <button
                  key={m.label}
                  type="button"
                  className={`bf-meter-pill ${m.label === meter.label ? 'on' : ''}`}
                  onClick={() => onMeterChange(m)}
                  title={`${m.label} — grouping ${m.grouping.join('+')}`}
                >
                  {m.label}
                </button>
              ))}
            </div>
          }
        />
        <div className="bf-sound-grouping-picker" role="toolbar" aria-label="Grouping">
          <span className="bf-sound-grouping-label">grouping</span>
          {groupingOptions.length > 1 && groupingOptions.map((g, i) => {
            const isCurrent = g.join('+') === grouping.join('+');
            return (
              <button
                key={i}
                type="button"
                className={`bf-sound-grouping-btn ${isCurrent ? 'on' : ''}`}
                onClick={() => onGroupingChange(g)}
                title={`Apply ${g.join('+')} grouping`}
              >
                {g.join('+')}
              </button>
            );
          })}
          <GroupingTextEditor
            key={grouping.join(',')}
            initialText={grouping.join(',')}
            stepsPerBar={stepsPerBar}
            onApply={onGroupingTextApply}
          />
        </div>

        <div className="bf-sound-feelbar">
          <div className="bf-feel-control">
            <span className="bf-feel-label">count-in</span>
            <div className="bf-feel-pills">
              {[0, 1, 2, 4].map((n) => (
                <button
                  key={n}
                  type="button"
                  className={`bf-feel-pill ${countInBars === n ? 'on' : ''}`}
                  onClick={() => setCountInBars(n)}
                >
                  {n === 0 ? 'off' : `${n}b`}
                </button>
              ))}
            </div>
          </div>

          <div className={`bf-feel-control ${meter.stepUnit === 4 ? 'disabled' : ''}`}>
            <span className="bf-feel-label">
              swing {Math.round(swing * 100)}%
            </span>
            <input
              type="range"
              min={0.5}
              max={0.67}
              step={0.01}
              value={swing}
              disabled={meter.stepUnit === 4}
              onChange={(e) => setSwing(Number(e.target.value))}
              aria-label="Swing"
            />
          </div>

          <div className="bf-feel-control">
            <span className="bf-feel-label">
              strong {Math.round(strongAmp * 100)}%
            </span>
            <input
              type="range"
              min={0}
              max={1.5}
              step={0.05}
              value={strongAmp}
              onChange={(e) => setStrongAmp(Number(e.target.value))}
              aria-label="Strong accent amp"
            />
          </div>

          <div className="bf-feel-control">
            <span className="bf-feel-label">
              weak {Math.round(weakAmp * 100)}%
            </span>
            <input
              type="range"
              min={0}
              max={1.5}
              step={0.05}
              value={weakAmp}
              onChange={(e) => setWeakAmp(Number(e.target.value))}
              aria-label="Weak accent amp"
            />
          </div>

          <span className="bf-feel-divider" />

          <div className="bf-feel-control">
            <span className="bf-feel-label">
              vol {Math.round(masterVolume * 100)}%
            </span>
            <input
              type="range"
              min={0}
              max={1}
              step={0.01}
              value={masterVolume}
              onChange={(e) => setMasterVolume(Number(e.target.value))}
              aria-label="Master volume"
            />
          </div>

          <div className="bf-feel-control">
            <span className="bf-feel-label">
              rev {Math.round(reverbWet * 100)}%
            </span>
            <input
              type="range"
              min={0}
              max={1}
              step={0.01}
              value={reverbWet}
              onChange={(e) => setReverbWet(Number(e.target.value))}
              aria-label="Master reverb wet"
            />
          </div>

          <div className="bf-feel-control">
            <span className="bf-feel-label">
              dly {Math.round(delayWet * 100)}%
            </span>
            <input
              type="range"
              min={0}
              max={1}
              step={0.01}
              value={delayWet}
              onChange={(e) => setDelayWet(Number(e.target.value))}
              aria-label="Master delay wet"
            />
          </div>
        </div>

        <div className="bf-sound-fxbar">
          <span className="bf-fx-section">reverb</span>

          <div className="bf-feel-control">
            <span className="bf-feel-label">size {reverbSize.toFixed(1)}s</span>
            <input
              type="range"
              min={0.3}
              max={4}
              step={0.05}
              value={reverbSize}
              onChange={(e) => setReverbSize(Number(e.target.value))}
              aria-label="Reverb size (seconds)"
            />
          </div>

          <div className="bf-feel-control">
            <span className="bf-feel-label">decay {reverbDecay.toFixed(1)}</span>
            <input
              type="range"
              min={1}
              max={6}
              step={0.1}
              value={reverbDecay}
              onChange={(e) => setReverbDecay(Number(e.target.value))}
              aria-label="Reverb decay shape"
            />
          </div>

          <span className="bf-feel-divider" />
          <span className="bf-fx-section">delay</span>

          <div className="bf-feel-control">
            <span className="bf-feel-label">time {Math.round(delayTime * 1000)}ms</span>
            <input
              type="range"
              min={0.02}
              max={1.5}
              step={0.01}
              value={delayTime}
              onChange={(e) => setDelayTime(Number(e.target.value))}
              aria-label="Delay time (seconds)"
            />
          </div>

          <div className="bf-feel-control">
            <span className="bf-feel-label">fb {Math.round(delayFeedback * 100)}%</span>
            <input
              type="range"
              min={0}
              max={0.7}
              step={0.01}
              value={delayFeedback}
              onChange={(e) => setDelayFeedback(Number(e.target.value))}
              aria-label="Delay feedback"
            />
          </div>
        </div>

        <div className="bf-sound-beatdots-wrap">
          <BeatDots
            grouping={grouping}
            currentStep={currentStep}
            size={12}
          />
          <div className="bf-sound-view-toggle" role="tablist" aria-label="Grid view">
            <button
              type="button"
              className={`bf-sound-view-btn ${viewMode === 'linear' ? 'on' : ''}`}
              onClick={() => setViewMode('linear')}
              role="tab"
              aria-selected={viewMode === 'linear'}
              title="Linear grid"
            >
              <span className="bf-view-shape bf-view-shape-square" />
            </button>
            <button
              type="button"
              className={`bf-sound-view-btn ${viewMode === 'pill' ? 'on' : ''}`}
              onClick={() => setViewMode('pill')}
              role="tab"
              aria-selected={viewMode === 'pill'}
              title="Pill grid"
            >
              <span className="bf-view-shape bf-view-shape-pill" />
            </button>
            <button
              type="button"
              className={`bf-sound-view-btn ${viewMode === 'circular' ? 'on' : ''}`}
              onClick={() => setViewMode('circular')}
              role="tab"
              aria-selected={viewMode === 'circular'}
              title="Circular grid"
            >
              <span className="bf-view-shape bf-view-shape-circle" />
            </button>
          </div>
        </div>

        {viewMode === 'linear' && (
          <StepGrid
            rows={channels.map((c, i) => ({
              label: c.label,
              short: shortFor(c.label),
              steps: sequence[i] ?? [],
              cursor: rowCursors[i] ?? -1,
            }))}
            headCursor={currentStep}
            stepsPerBar={stepsPerBar}
            grouping={grouping}
            onToggleCell={onToggleCell}
          />
        )}

        {viewMode === 'pill' && (
          <PillGrid
            stepsPerBar={stepsPerBar}
            grouping={grouping}
            rows={channels.map((c, i) => ({
              label: shortFor(c.label),
              cells: sequence[i] ?? [],
              cursor: rowCursors[i] ?? -1,
            }))}
            onToggle={onToggleCell}
          />
        )}

        {viewMode === 'circular' && (
          <div className="bf-sound-circular-wrap">
            <CircularGrid
              stepsPerBar={stepsPerBar}
              grouping={grouping}
              rows={channels.map((c, i) => ({
                label: shortFor(c.label),
                cells: sequence[i] ?? [],
                cursor: rowCursors[i] ?? -1,
              }))}
              size={Math.min(480, stepsPerBar * 26 + 80)}
              onToggle={onToggleCell}
            />
          </div>
        )}
      </section>

      <section className="bf-sound-grid">
        {channels.map((c, i) => {
          const archetypeId = c.machine.archetype as VoiceArchetypeId;
          const machine = VOICE_MACHINES[archetypeId];
          const cfgValues = c.machine as unknown as Record<string, number | string>;
          return (
            <div key={i} className="bf-sound-strip">
              <div className="bf-sound-strip-head">
                <div className="bf-sound-strip-num">ch {i + 1}</div>
                <input
                  type="text"
                  className="bf-sound-strip-name-edit"
                  value={c.label}
                  onChange={(e) => setChannelLabel(i, e.target.value)}
                  placeholder="Channel name"
                  aria-label={`Channel ${i + 1} name`}
                  maxLength={24}
                />
                <button
                  className="bf-sound-strip-trigger"
                  onClick={() => void trigger(i)}
                  aria-label={`Trigger ${c.label}`}
                  type="button"
                >
                  ▶
                </button>
              </div>

              <SubdivisionsBadge
                value={(sequence[i]?.length) ?? stepsPerBar}
                mainSteps={stepsPerBar}
                onChange={(n) => setSubdivisions(i, n)}
              />

              {(() => {
                const row = sequence[i] ?? [];
                const ringSteps = row.length;
                const isPolyRow = ringSteps !== stepsPerBar;
                const rowCursor = rowCursors[i] ?? -1;
                const rowGrouping = isPolyRow ? [ringSteps] : grouping;
                return (
                  <div
                    className={`bf-sound-strip-mini ${isPolyRow ? 'poly' : ''}`}
                    aria-hidden
                  >
                    {Array.from({ length: ringSteps }, (_, s) => {
                      const v = row[s] ?? 0;
                      // Polyrhythm rows cycle group hues per cell so they
                      // visually contrast the main grid; non-poly rows use
                      // the canonical group coloring.
                      const gi = isPolyRow
                        ? s % GROUP_COLORS.length
                        : groupIndexForStep(s, rowGrouping);
                      const color = GROUP_COLORS[gi % GROUP_COLORS.length];
                      const isCur = s === rowCursor;
                      const cls = [
                        'bf-mini-cell',
                        v === 1 ? 'on' : v === 2 ? 'accent' : '',
                        isCur ? 'cur' : '',
                      ].filter(Boolean).join(' ');
                      return (
                        <span
                          key={s}
                          className={cls}
                          style={{ '--grp-color': color } as React.CSSProperties}
                        />
                      );
                    })}
                  </div>
                );
              })()}

              <div className="bf-sound-strip-pickers">
                <select
                  className="bf-sound-strip-select"
                  value={archetypeId}
                  onChange={(e) => swapArchetype(i, e.target.value as VoiceArchetypeId)}
                  aria-label="Machine"
                  title="Machine"
                >
                  {MACHINE_CATEGORY_ORDER.map((cat) => {
                    const ids = (Object.keys(VOICE_MACHINES) as VoiceArchetypeId[]).filter(
                      (id) => MACHINE_CATEGORY[id] === cat,
                    );
                    if (ids.length === 0) return null;
                    return (
                      <optgroup key={cat} label={MACHINE_CATEGORY_LABEL[cat]}>
                        {ids.map((id) => (
                          <option key={id} value={id}>{VOICE_MACHINES[id].label}</option>
                        ))}
                      </optgroup>
                    );
                  })}
                </select>
                {machine.presets && Object.keys(machine.presets).length > 0 && (
                  <div className="bf-sound-preset-pills" aria-label="Machine presets">
                    {Object.keys(machine.presets).map((p) => (
                      <button
                        key={p}
                        type="button"
                        className="bf-sound-preset-pill"
                        onClick={() => applyPreset(i, p)}
                        title={`Apply preset: ${p}`}
                      >
                        {p}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              <div className="bf-sound-strip-section-label">synth</div>
              <div className="bf-sound-strip-knobs">
                {machine.knobs.map((k) => {
                  const v = cfgValues[k.id];
                  const value = typeof v === 'number' ? v : k.default;
                  return (
                    <Knob
                      key={k.id}
                      label={k.label}
                      value={value}
                      min={k.min}
                      max={k.max}
                      defaultValue={k.default}
                      curve={k.curve}
                      unit={k.unit}
                      format={k.format}
                      onChange={(nv) => setKnob(i, k.id, nv)}
                      size={48}
                    />
                  );
                })}
              </div>

              {machine.discrete && machine.discrete.length > 0 && (
                <div className="bf-sound-strip-discrete">
                  {machine.discrete.map((d) => {
                    const cur = (cfgValues[d.id] as string) ?? d.default;
                    return (
                      <div key={d.id} className="bf-sound-discrete">
                        <div className="bf-sound-discrete-label">{d.label}</div>
                        <div className="bf-sound-discrete-opts">
                          {d.options.map((opt) => (
                            <button
                              key={opt}
                              className={cur === opt ? 'on' : ''}
                              onClick={() => setDiscrete(i, d.id, opt)}
                              type="button"
                            >
                              {opt}
                            </button>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              <Disclosure
                className="bf-sound-strip-disclosure"
                summaryClassName="bf-sound-strip-section-label"
                summary={
                  <span>
                    color
                    {c.effects.colorFx.type !== 'none' && (
                      <span className="bf-sound-fx-badge">{c.effects.colorFx.type}</span>
                    )}
                  </span>
                }
              >
                <div className="bf-sound-fx-types">
                  {COLOR_FX_TYPES.map((t) => (
                    <button
                      key={t}
                      type="button"
                      className={`bf-sound-fx-type ${c.effects.colorFx.type === t ? 'on' : ''}`}
                      onClick={() => setColorFxType(i, t)}
                      title={t}
                    >
                      {t === 'none' ? 'off'
                        : t === 'overdrive' ? 'odv'
                        : t === 'bitcrush' ? 'btc'
                        : 'flt'}
                    </button>
                  ))}
                </div>

                {c.effects.colorFx.type === 'overdrive' && (
                  <div className="bf-sound-strip-knobs">
                    <Knob
                      label="Drive" value={c.effects.colorFx.drive} min={0} max={1} defaultValue={0.5}
                      curve="lin" unit="%" format={(v) => `${Math.round(v * 100)}`}
                      onChange={(nv) => setColorFxParam(i, 'drive', nv)} size={42}
                    />
                    <Knob
                      label="Tone" value={c.effects.colorFx.tone} min={200} max={6000} defaultValue={2000}
                      curve="exp" unit="Hz"
                      onChange={(nv) => setColorFxParam(i, 'tone', nv)} size={42}
                    />
                    <Knob
                      label="Mix" value={c.effects.colorFx.mix} min={0} max={1} defaultValue={0.5}
                      curve="lin" unit="%" format={(v) => `${Math.round(v * 100)}`}
                      onChange={(nv) => setColorFxParam(i, 'mix', nv)} size={42}
                    />
                  </div>
                )}

                {c.effects.colorFx.type === 'bitcrush' && (
                  <div className="bf-sound-strip-knobs">
                    <Knob
                      label="Bits" value={c.effects.colorFx.bits} min={2} max={16} defaultValue={8}
                      curve="lin" unit="b" format={(v) => `${Math.round(v)}`}
                      onChange={(nv) => setColorFxParam(i, 'bits', Math.round(nv))} size={42}
                    />
                    <Knob
                      label="Rate" value={c.effects.colorFx.rate} min={400} max={16000} defaultValue={8000}
                      curve="exp" unit="Hz"
                      onChange={(nv) => setColorFxParam(i, 'rate', nv)} size={42}
                    />
                    <Knob
                      label="Mix" value={c.effects.colorFx.mix} min={0} max={1} defaultValue={0.5}
                      curve="lin" unit="%" format={(v) => `${Math.round(v * 100)}`}
                      onChange={(nv) => setColorFxParam(i, 'mix', nv)} size={42}
                    />
                  </div>
                )}

                {c.effects.colorFx.type === 'filter' && (
                  <>
                    <div className="bf-sound-discrete">
                      <div className="bf-sound-discrete-label">mode</div>
                      <div className="bf-sound-discrete-opts">
                        {(['lp', 'hp', 'bp'] as const).map((m) => (
                          <button
                            key={m}
                            type="button"
                            className={c.effects.colorFx.type === 'filter' && c.effects.colorFx.mode === m ? 'on' : ''}
                            onClick={() => setColorFxParam(i, 'mode', m)}
                          >
                            {m}
                          </button>
                        ))}
                      </div>
                    </div>
                    <div className="bf-sound-strip-knobs">
                      <Knob
                        label="Cut" value={c.effects.colorFx.cutoff} min={80} max={8000} defaultValue={2000}
                        curve="exp" unit="Hz"
                        onChange={(nv) => setColorFxParam(i, 'cutoff', nv)} size={42}
                      />
                      <Knob
                        label="Q" value={c.effects.colorFx.q} min={0.5} max={15} defaultValue={1}
                        curve="exp" unit="" format={(v) => v.toFixed(1)}
                        onChange={(nv) => setColorFxParam(i, 'q', nv)} size={42}
                      />
                      <Knob
                        label="Mix" value={c.effects.colorFx.mix} min={0} max={1} defaultValue={1}
                        curve="lin" unit="%" format={(v) => `${Math.round(v * 100)}`}
                        onChange={(nv) => setColorFxParam(i, 'mix', nv)} size={42}
                      />
                    </div>
                  </>
                )}
              </Disclosure>

              <Disclosure
                className="bf-sound-strip-disclosure"
                summaryClassName="bf-sound-strip-section-label"
                summary="mix"
              >
                <div className="bf-sound-strip-knobs">
                  <Knob
                    label="Level" value={c.effects.level} min={0} max={1} defaultValue={0.85}
                    curve="lin" unit="%" format={(v) => `${Math.round(v * 100)}`}
                    onChange={(nv) => setMixer(i, 'level', nv)} size={48}
                  />
                  <Knob
                    label="Pan" value={c.effects.pan} min={-1} max={1} defaultValue={0}
                    curve="lin" unit=""
                    format={(v) => v === 0 ? 'C' : v < 0 ? `L${Math.round(-v * 100)}` : `R${Math.round(v * 100)}`}
                    onChange={(nv) => setMixer(i, 'pan', nv)} size={48}
                  />
                  <Knob
                    label="Rev" value={c.effects.reverbSend} min={0} max={1} defaultValue={0}
                    curve="lin" unit="%" format={(v) => `${Math.round(v * 100)}`}
                    onChange={(nv) => setMixer(i, 'reverbSend', nv)} size={48}
                  />
                  <Knob
                    label="Dly" value={c.effects.delaySend} min={0} max={1} defaultValue={0}
                    curve="lin" unit="%" format={(v) => `${Math.round(v * 100)}`}
                    onChange={(nv) => setMixer(i, 'delaySend', nv)} size={48}
                  />
                </div>
              </Disclosure>
            </div>
          );
        })}

      </section>
    </main>
  );
}
