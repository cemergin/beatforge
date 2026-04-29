// Sound page — phase 1 v2: 5 channels visible at once, circular
// knobs for synth + per-channel mixer (level / pan / sends),
// audition triggers, ASDFG/QWERT keyboard.

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { SoundEngine, type SoundSequence, type SoundStep } from '../../audio/runtime/sound-engine';
import { useSession } from '../../modules/session';
import { trackMeta, ALL_KITS, ALL_VOICES, type KitId } from '../../patterns/types';
import { buildKitMachine } from '../../audio/runtime/kit-presets';
import { defaultChannelEffects } from '../../patterns/types-sound';
import {
  VOICE_MACHINES,
  type VoiceArchetypeId,
  MACHINE_CATEGORY,
  MACHINE_CATEGORY_LABEL,
  MACHINE_CATEGORY_ORDER,
} from '../../audio/machines/registry';
import {
  type Channel,
  type ColorFx,
  type SoundKit,
} from '../../patterns/types-sound';
import {
  saveSoundKit,
  listSoundKits,
  deleteSoundKit,
} from '../../lib/db';
import {
  saveStudioPattern,
  loadStudioPattern,
  listStudioPatterns,
  deleteStudioPattern,
  defaultMetadata,
  nextPatternName,
} from '../../modules/pattern-store';
import type { StudioPattern, StudioPatternListItem } from '../../modules/pattern-store';
import type { Genre, RegionId } from '../../patterns/types';
import { getMasterVolume, setMasterVolume as persistMasterVolume } from '../../lib/storage';
import { SpectrumAnalyzer } from './SpectrumAnalyzer';
import { Knob } from './Knob';
import { StepGrid } from '../../components/StepGrid';
import { BpmInput } from '../../components/BpmInput';
import { NumberInput } from '../../components/NumberInput';
import { Disclosure } from '../../components/Disclosure';
import { BeatDots } from '../../components/BeatDots';
import { CircularGrid } from '../../components/CircularGrid';
import { PillGrid } from '../../components/PillGrid';
import { GROUP_COLORS, groupIndexForStep } from '../../components/visual-helpers';

const COLOR_FX_TYPES: ColorFx['type'][] = ['none', 'overdrive', 'bitcrush', 'filter'];

/** Translate Studio's editor state into a UserPattern Library can
 *  list. Voice-keyed tracks come from the positional sequence rows
 *  (KK / SN / HH / OH / CP); BPM converts from quarter to step BPM
 *  (UserPattern uses step-BPM convention to match seeds). */
/** Region + genre option lists for the metadata <select>s. Kept
 *  as a literal here so we don't add a runtime export to types.ts;
 *  TS catches drift via the satisfies clause. */
const REGION_OPTIONS: readonly RegionId[] = [
  'turkey-ottoman', 'arabic-swana', 'persia', 'india',
  'west-africa', 'modern-african', 'north-east-african',
  'cuba-afrocaribbean', 'brazil', 'andean-south-america', 'caribbean',
  'balkans', 'iberia-flamenco', 'caucasus-mediterranean',
  'gamelan-southeast-asia', 'east-asia', 'central-asian-pacific',
  'celtic-europe', 'electronic-western', 'global-electronic',
  'underground-electronic', 'internet-born', 'exercise',
] as const;

const GENRE_OPTIONS: readonly Genre[] = [
  'folk-dance', 'classical', 'devotional', 'popular',
  'electronic', 'hip-hop', 'jazz', 'ceremonial', 'exercise',
] as const;

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
/** Hard cap on Studio channels — Pattern.tracks only carries 5 voice
 *  keys (KK/SN/HH/OH/CP), so beyond 5 the round-trip with Practice
 *  would lose channels. Variable below this — user adds/removes via
 *  the per-strip buttons. */
const MAX_CHANNELS = 5;

// Local meter list — duplicated from modes/Studio/presets.ts so the
// Sound page doesn't depend on Studio's module. Will consolidate into
// patterns/meter-presets.ts when we unify the two pages.
interface MeterPreset {
  label: string;
  grouping: number[];
  stepUnit: 2 | 4 | 8 | 16;
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
const sumGroup = (g: number[]): number => g.reduce((a, b) => a + b, 0);

function emptySequence(stepsPerBar: number): SoundSequence {
  return Array.from({ length: NUM_CHANNELS }, () =>
    Array<SoundStep>(stepsPerBar).fill(0),
  );
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

/** Translate session.pattern into the MeterPreset shape Sound's UI
 *  uses. Falls back to a synthesized preset when the pattern's
 *  grouping doesn't match any built-in. */
function meterFromPattern(p: import('../../patterns/types').Pattern): MeterPreset {
  const match = SOUND_METERS.find(
    (m) => m.stepUnit === p.stepUnit && m.grouping.join(',') === p.grouping.join(','),
  );
  if (match) return match;
  return {
    label: p.timeSig,
    grouping: p.grouping.slice(),
    stepUnit: p.stepUnit as 2 | 4 | 8 | 16,
  };
}

/** Translate session.pattern.tracks (voice-keyed) into Sound's
 *  positional SoundSequence. Produces exactly `count` rows in voice
 *  order (KK / SN / HH / OH / CP). Channels with no track or with a
 *  zero-array track get an empty row of stepsPerBar zeros. The count
 *  comes from session.channels.length — Studio auto-fits to the
 *  pattern's voice usage on cross-tab handoffs. */
function sequenceFromPattern(p: import('../../patterns/types').Pattern, count: number): SoundSequence {
  const out: SoundSequence = [];
  const ALL_VOICES_LOCAL: import('../../patterns/types').VoiceId[] = ['KK', 'SN', 'HH', 'OH', 'CP'];
  const limit = Math.min(count, ALL_VOICES_LOCAL.length);
  for (let i = 0; i < limit; i++) {
    const voiceId = ALL_VOICES_LOCAL[i];
    const track = voiceId ? p.tracks[voiceId] : undefined;
    if (!track) {
      out.push(Array<SoundStep>(p.steps).fill(0));
      continue;
    }
    const meta = trackMeta(track, p.steps);
    if (!meta.pattern || meta.pattern.length === 0) {
      out.push(Array<SoundStep>(p.steps).fill(0));
      continue;
    }
    const cycle = meta.cycle;
    const row: SoundStep[] = [];
    for (let i = 0; i < cycle; i++) {
      row.push((meta.pattern[i % meta.pattern.length] ?? 0) as SoundStep);
    }
    out.push(row);
  }
  return out;
}

/** Reverse of sequenceFromPattern — write Sound's positional rows
 *  back into a Pattern.tracks shape. Used by Sound's outbound sync
 *  so cell edits in Sound show up in Practice's pattern. */
function tracksFromSequence(seq: SoundSequence): import('../../patterns/types').Pattern['tracks'] {
  const ALL_VOICES_LOCAL: import('../../patterns/types').VoiceId[] = ['KK', 'SN', 'HH', 'OH', 'CP'];
  const out: import('../../patterns/types').Pattern['tracks'] = {};
  for (let i = 0; i < Math.min(seq.length, ALL_VOICES_LOCAL.length); i++) {
    const voiceId = ALL_VOICES_LOCAL[i];
    out[voiceId] = seq[i].slice() as import('../../patterns/types').Velocity[];
  }
  return out;
}

/** 3-char abbreviation derived from a channel's display name — used as
 *  the row label in StepGrid, the ring label in CircularGrid, etc. */
function shortFor(label: string): string {
  return label.trim().slice(0, 3) || '·';
}

interface SoundProps {
  /** Shared engine from App.tsx — must be the same instance every
   *  other mode uses so cross-tab session state stays consistent. */
  engine: SoundEngine;
  /** Optional: when set, the Sound page auto-loads that soundPattern on
   *  mount (or when the id changes). Used by Practice's "saved sounds"
   *  cross-tab handoff so a single click takes the user from "discover"
   *  → "play in Sound." Cleared by the parent after consumption so a
   *  subsequent navigation back doesn't re-load. */
  initialSoundPatternId?: string | null;
  onConsumedInitial?: () => void;
}

export function Sound({ engine, initialSoundPatternId, onConsumedInitial }: SoundProps) {
  // App.tsx owns engine lifecycle; Sound is a viewer/editor of the
  // shared engine state. Disposal happens at App unmount.
  const session = useSession();

  // Modular control plane is owned by App's ModeShell — router +
  // master + per-channel adapters live there so input-mapped events
  // (MIDI tab, automation) drive audio regardless of which mode is
  // mounted. Sound just emits ParamEvents on engine.getEventBus().

  // Channels live in the session — labels, machine configs, color
  // FX, level/pan/sends ride with the user across tabs. setChannels
  // accepts the same (Channel[] | (prev) => Channel[]) signature
  // existing handlers use; internally it forwards to session.
  //
  // sessionRef keeps setChannels' identity stable across renders so
  // every per-knob useCallback that depends on it can leave its
  // deps array clean. session.channels is read at call time (always
  // fresh) via the ref, not via closure.
  const channels = session.channels;
  // Mirror session into a ref via effect (React 19's purity lint
  // forbids ref writes during render). The first call to
  // setChannels before the effect runs will see the initial session
  // — fine because both are the SessionProvider's first render.
  const sessionRef = useRef(session);
  useEffect(() => { sessionRef.current = session; }, [session]);
  const setChannels = useCallback(
    (updaterOrValue: Channel[] | ((prev: Channel[]) => Channel[])) => {
      const cur = sessionRef.current;
      const next = typeof updaterOrValue === 'function'
        ? updaterOrValue(cur.channels.slice())
        : updaterOrValue;
      cur.setChannels(next);
    },
    [],
  );
  // Sequence seeded from session.pattern on mount so Practice→Sound
  // lands on the same beats. Hydration effect below keeps it in
  // sync when session.pattern changes externally.
  const [sequence, setSequence] = useState<SoundSequence>(
    () => sequenceFromPattern(session.pattern, session.channels.length),
  );
  // BPM flows through the session — natural BPM (denominator-based)
  // is the same convention Practice uses. session.bpm = 276 in
  // Practice → Sound's BPM field reads 276 too. setBpm pushes to
  // session, which converts to quarter-BPM internally and forwards
  // to the engine via setNaturalBpm.
  const bpm = session.bpm;
  const setBpm = session.setBpm;
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentStep, setCurrentStep] = useState(-1);
  const [currentBar, setCurrentBar] = useState(0);
  // Per-row cursors — each polyrhythm channel can be on a different
  // step. Refilled every frame from engine.audibleStepFor(i). When all
  // channels are at main rate every entry equals currentStep.
  const [rowCursors, setRowCursors] = useState<number[]>([]);
  // Initial meter / grouping seeded from session.pattern so
  // tab-switching from Practice / Library lands on the SAME pattern
  // shape Sound was just hearing. session.pattern is always present
  // (SessionProvider seeds it on mount).
  const [meter, setMeter] = useState<MeterPreset>(() => meterFromPattern(session.pattern));
  const [grouping, setGrouping] = useState<number[]>(() => session.pattern.grouping.slice());
  const stepsPerBar = sumGroup(grouping);

  // Hydrate Sound's local state from session.pattern whenever the
  // session swaps pattern (Library load, Practice handoff). The
  // session.pattern reference also changes on cell edits made in
  // OTHER tabs — Sound mirrors those too. To prevent a feedback
  // loop with Sound's outbound writes, we track the last-mirrored
  // session.pattern via a ref + skip when Sound itself just wrote.
  const lastSessionPatternRef = useRef(session.pattern);
  const ignoreNextSessionRef = useRef(false);
  useEffect(() => {
    if (lastSessionPatternRef.current === session.pattern) return;
    lastSessionPatternRef.current = session.pattern;
    if (ignoreNextSessionRef.current) {
      ignoreNextSessionRef.current = false;
      return;
    }
    setMeter(meterFromPattern(session.pattern));
    setGrouping(session.pattern.grouping.slice());
    setSequence(sequenceFromPattern(session.pattern, session.channels.length));
  }, [session.pattern, session.channels.length]);

  // Outbound: Sound's local edits to sequence + grouping + meter
  // flow back into session.pattern so other tabs see them. Skips
  // the first render (initial state matches session) and any time
  // the sequence/grouping/meter values match what session already
  // has — avoids a feedback loop when the inbound effect just set
  // them. Bpm flows separately — Sound's bpm is quarter-BPM and
  // doesn't yet round-trip session.bpm cleanly.
  const lastPushedRef = useRef<{
    sequence: SoundSequence; grouping: number[]; stepUnit: 2 | 4 | 8 | 16;
  } | null>(null);
  useEffect(() => {
    const stepUnit = meter.stepUnit;
    const groupingStr = grouping.join(',');
    const last = lastPushedRef.current;
    if (last) {
      // Cheap dirty check: if everything matches the last push, skip.
      if (last.stepUnit === stepUnit
          && last.grouping.join(',') === groupingStr
          && last.sequence === sequence) return;
    }
    // Build the next pattern shape and push to session. Identity
    // comparison via lastPushedRef means a Sound→session→Sound
    // round-trip terminates after one cycle.
    const nextTracks = tracksFromSequence(sequence);
    const nextSteps = stepsPerBar;
    const nextGrouping = grouping.slice();
    const denomFromMeter = meter.label.includes('/') ? Number(meter.label.split('/')[1]) : 4;
    const nextTimeSig = `${nextSteps * (stepUnit / denomFromMeter)}/${denomFromMeter}`;
    ignoreNextSessionRef.current = true;
    session.setPattern((prev) => ({
      ...prev,
      tracks: nextTracks,
      steps: nextSteps,
      stepUnit,
      grouping: nextGrouping,
      timeSig: meter.label.includes('/') ? meter.label : nextTimeSig,
    }));
    lastPushedRef.current = { sequence, grouping: nextGrouping, stepUnit };
  }, [sequence, grouping, meter, stepsPerBar, session]);
  const [viewMode, setViewMode] = useState<'linear' | 'pill' | 'circular'>('linear');

  // Pattern persistence — name + last-saved id (`null` until first save).
  // savedId is preserved across edits so a re-Save updates in place
  // rather than creating a duplicate. Default name is "Pattern #N"
  // where N is the next-available ordinal across savedList — gets
  // re-derived after savedList loads + on every onNewBlank.
  const [name, setName] = useState('Pattern #1');
  const [savedId, setSavedId] = useState<string | null>(null);
  const [savedList, setSavedList] = useState<StudioPatternListItem[]>([]);
  const [toast, setToast] = useState<string | null>(null);
  // Pattern-shape metadata that ships with each save into IDB so the
  // pattern shows up in Library alongside seeds. Defaults are
  // intentionally generic; the user can refine via the metadata
  // disclosure under the pattern name. defaultKit defaults to '808'
  // for fresh patterns; a load fills it from the saved record.
  const [defaultKit, setDefaultKitState] = useState<KitId>('808');
  const [patternRegion, setPatternRegion] = useState<RegionId>('electronic-western');
  const [patternGenre, setPatternGenre] = useState<Genre>('popular');
  const [patternTags, setPatternTags] = useState<string[]>(['user-saved']);
  const [patternStory, setPatternStory] = useState<string>('');
  const [swingable, setSwingable] = useState<boolean>(false);

  // Kit persistence — separate from pattern; "kit" = the channel
  // palette only (machine configs + per-channel mixer + colour FX).
  // One kit can power many patterns; loading a kit only swaps channels.
  const [kitName, setKitName] = useState('My Ensemble');
  // Spectrum analyser is power-user kit. Off by default — keeps the
  // hero clean for the curious explorer; one click to bring it back
  // when sound-design needs the visual feedback. Persisted per user.
  const [showSpectrum, setShowSpectrum] = useState<boolean>(
    () => localStorage.getItem('bf_sound_spectrum') === '1',
  );
  useEffect(() => {
    localStorage.setItem('bf_sound_spectrum', showSpectrum ? '1' : '0');
  }, [showSpectrum]);
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
  // Two-axis master mix:
  //   masterVolume → master.gain (post-everything output level, top-of-Studio slider)
  //   dryLevel     → master.dry  (dry-bus gain — independent of wet returns)
  // masterVolume persists via lib/storage so a user's hardware-level
  // preference rides across sessions. dryLevel stays local to the
  // session — it's an artistic mix choice that belongs with the
  // pattern, not the user.
  const [masterVolume, setMasterVolumeState] = useState(() => getMasterVolume());
  const setMasterVolume = useCallback((v: number) => {
    setMasterVolumeState(v);
    persistMasterVolume(v);
  }, []);
  const [dryLevel, setDryLevel] = useState(0.85);
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
      const list = await listStudioPatterns();
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
    listStudioPatterns()
      .then((list) => {
        if (!active) return;
        setSavedList(list);
        // Bump the default name AFTER savedList loads so a fresh editor
        // starts at Pattern #N+1 instead of #1 when the user already
        // has saves. Only nudge if the user hasn't typed yet (still
        // showing a stock 'Pattern #N' default + no savedId).
        setName((prev) => {
          if (savedId) return prev;
          if (!/^Pattern #\d+$/.test(prev)) return prev;
          return nextPatternName(list.map((p) => p.name));
        });
      })
      .catch(() => { /* IDB unavailable */ });
    listSoundKits()
      .then((list) => { if (active) setSavedKitList(list); })
      .catch(() => { /* IDB unavailable */ });
    return () => { active = false; };
    // savedId / setName intentionally omitted — this effect runs once.
    // eslint-disable-next-line react-hooks/exhaustive-deps
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

  // Per-channel adapter registrations live in ModeShell — see comment
  // on the router setup above.

  // Push sequence + stepUnit + grouping + feel/master to the engine.
  // Each useEffect tracks a single state slice so we don't resend
  // everything on a single-knob tweak. BPM pushed by SessionProvider
  // — Sound's `bpm` is just session.bpm so a separate effect would
  // duplicate work.
  useEffect(() => { engine.setSequence(sequence); }, [engine, sequence]);
  useEffect(() => { engine.setStepUnit(meter.stepUnit); }, [engine, meter.stepUnit]);
  useEffect(() => { engine.setStepsPerBar(stepsPerBar); }, [engine, stepsPerBar]);
  useEffect(() => { engine.setGrouping(grouping); }, [engine, grouping]);
  useEffect(() => { engine.setSwing(swing); }, [engine, swing]);
  useEffect(() => { engine.setAccents(strongAmp, weakAmp); }, [engine, strongAmp, weakAmp]);
  // Master / reverb / delay knobs now flow through the bus + router:
  // the slider's React state is the canonical UI value; an effect
  // emits a ParamEvent; the router resolves master.gain.value et al
  // to the engineMasterGain / engineReverb / engineDelay adapters,
  // which call the existing engine setters. Same audio path, but the
  // event stream is observable for MIDI-out, recording, automation.
  useEffect(() => {
    engine.getEventBus().emit({ type: 'param', target: 'master.gain.value', value: masterVolume });
  }, [engine, masterVolume]);
  useEffect(() => {
    engine.getEventBus().emit({ type: 'param', target: 'master.dry.value', value: dryLevel });
  }, [engine, dryLevel]);
  useEffect(() => {
    engine.getEventBus().emit({ type: 'param', target: 'master.reverb.wet', value: reverbWet });
  }, [engine, reverbWet]);
  useEffect(() => {
    engine.getEventBus().emit({ type: 'param', target: 'master.reverb.size', value: reverbSize });
  }, [engine, reverbSize]);
  useEffect(() => {
    engine.getEventBus().emit({ type: 'param', target: 'master.reverb.decay', value: reverbDecay });
  }, [engine, reverbDecay]);
  useEffect(() => {
    engine.getEventBus().emit({ type: 'param', target: 'master.delay.wet', value: delayWet });
  }, [engine, delayWet]);
  useEffect(() => {
    engine.getEventBus().emit({ type: 'param', target: 'master.delay.time', value: delayTime });
  }, [engine, delayTime]);
  useEffect(() => {
    engine.getEventBus().emit({ type: 'param', target: 'master.delay.feedback', value: delayFeedback });
  }, [engine, delayFeedback]);

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
  }, [setBpm]);

  // Save / load / delete handlers. Each `save` either creates a new
  // pattern (no savedId) or updates the current one (preserves
  // createdAt). loadSavedPattern fully replaces editor state — name,
  // bpm, meter, channels, sequence — and resets the playhead.
  const onSave = useCallback(async () => {
    const trimmed = name.trim() || nextPatternName(savedList.map((p) => p.name));
    const now = Date.now();
    const id = savedId ?? kebabId(trimmed);
    const existing = savedId ? savedList.find((p) => p.id === savedId) : undefined;
    const studio: StudioPattern = {
      id,
      name: trimmed,
      bpm,
      stepUnit: meter.stepUnit,
      grouping: [...grouping],
      sequence: sequence.map((row) => [...row]),
      channels: channels.map((c) => ({
        label: c.label,
        machine: { ...c.machine },
        effects: { ...c.effects, colorFx: { ...c.effects.colorFx } },
      })),
      countInBars, swing, strongAmp, weakAmp,
      reverbWet, reverbSize, reverbDecay,
      delayWet, delayTime, delayFeedback,
      region: patternRegion,
      genre: patternGenre,
      tags: [...patternTags],
      story: patternStory,
      defaultKit,
      swingable,
      createdAt: existing?.createdAt ?? now,
      updatedAt: now,
    };
    try {
      await saveStudioPattern(studio);
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
    defaultKit, patternRegion, patternGenre, patternTags, patternStory, swingable,
    refreshSavedList,
  ]);

  const applyStudioPattern = useCallback((s: StudioPattern) => {
    if (isPlaying) {
      engine.stop();
      setIsPlaying(false);
      setCurrentStep(-1);
    }
    setName(s.name);
    setSavedId(s.id);
    setBpm(s.bpm);
    // Reconstruct meter from the saved grouping + stepUnit. If it
    // matches a built-in preset, use that (so the meter chips show
    // the right one as active); otherwise synthesize an ad-hoc preset.
    const matchedPreset = SOUND_METERS.find(
      (m) =>
        m.stepUnit === s.stepUnit &&
        m.grouping.length === s.grouping.length &&
        m.grouping.every((v, i) => v === s.grouping[i]),
    );
    setMeter(matchedPreset ?? {
      label: `${sumGroup(s.grouping) * (s.stepUnit / 4)}/${s.stepUnit}`,
      grouping: [...s.grouping],
      stepUnit: s.stepUnit,
    });
    setGrouping([...s.grouping]);
    setChannels(s.channels.map((c) => ({
      label: c.label,
      machine: { ...c.machine },
      effects: { ...c.effects, colorFx: { ...c.effects.colorFx } },
    })));
    setSequence(s.sequence.map((row) => row.map((v) => (v === 2 ? 2 : v === 1 ? 1 : 0) as SoundStep)));
    setCountInBars(s.countInBars);
    setSwing(s.swing);
    setStrongAmp(s.strongAmp);
    setWeakAmp(s.weakAmp);
    setReverbWet(s.reverbWet);
    setReverbSize(s.reverbSize);
    setReverbDecay(s.reverbDecay);
    setDelayWet(s.delayWet);
    setDelayTime(s.delayTime);
    setDelayFeedback(s.delayFeedback);
    setDefaultKitState(s.defaultKit);
    setPatternRegion(s.region);
    setPatternGenre(s.genre);
    setPatternTags(s.tags);
    setPatternStory(s.story);
    setSwingable(s.swingable);
    setToast(`Loaded ${s.name}`);
    // setBpm + many setters close over engine/session; safe to omit.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [engine, isPlaying]);

  const loadSavedPattern = useCallback(async (p: StudioPatternListItem) => {
    const studio = await loadStudioPattern(p.id);
    if (studio) applyStudioPattern(studio);
  }, [applyStudioPattern]);

  // Cross-tab handoff — when Practice (or any other surface) routes
  // here with an `initialSoundPatternId`, fetch + load that pattern
  // on mount. setState happens inside a microtask (`.then`) so the
  // React-19 set-state-in-effect rule is satisfied.
  useEffect(() => {
    if (!initialSoundPatternId) return;
    let active = true;
    loadStudioPattern(initialSoundPatternId)
      .then((studio) => {
        if (!active) return;
        if (studio) applyStudioPattern(studio);
        onConsumedInitial?.();
      })
      .catch(() => { /* IDB unavailable — silent */ });
    return () => { active = false; };
  }, [initialSoundPatternId, applyStudioPattern, onConsumedInitial]);

  const onDeleteSaved = useCallback(async (id: string) => {
    try {
      await deleteStudioPattern(id);
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
  }, [setChannels]);

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
    const freshName = nextPatternName(savedList.map((p) => p.name));
    const freshId = kebabId(freshName);
    setName(freshName);
    setSavedId(null);
    setSequence(emptySequence(stepsPerBar));
    // Reset metadata via the shared default — each fresh pattern starts
    // Library-ready. The user can still customize before save.
    const md = defaultMetadata();
    setDefaultKitState(md.defaultKit);
    setPatternRegion(md.region);
    setPatternGenre(md.genre);
    setPatternTags([...md.tags]);
    setPatternStory(md.story);
    setSwingable(md.swingable);
    // Mirror the fresh identity into session.pattern so Practice +
    // Library + the Library 'local' filter see "this is a new pattern,
    // nothing to play yet" instead of the previous pattern's name +
    // hits. setPattern (not loadPattern) preserves the user's
    // current channels/bpm/swing — the sequence-outbound effect will
    // immediately push the empty tracks once the local sequence state
    // commits on the next render.
    session.setPattern((prev) => ({
      ...prev,
      id: freshId,
      name: freshName,
      origin: 'You',
      tradition: 'user',
      genre: md.genre,
      region: md.region,
      tags: [...md.tags],
      story: undefined,
      defaultKit: md.defaultKit,
      swingable: md.swingable,
      tracks: {},
    }));
  }, [engine, isPlaying, stepsPerBar, savedList, session]);

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

  // Every per-knob handler now does two things:
  //   1. setChannels — keeps React state in sync for UI display
  //   2. emit ParamEvent — drives the engine through the bus + router
  //                        + adapters, the same path MIDI / automation
  //                        will use later
  //
  // The bulk applyChannelEffects + setMachines effect above still runs
  // on channels[] change — it's idempotent and acts as a safety net
  // for paths that bypass the bus (initial state, pattern load).
  const setKnob = useCallback((channelIdx: number, knobId: string, value: number) => {
    setChannels((cs) => cs.map((c, i) => (
      i === channelIdx ? { ...c, machine: { ...c.machine, [knobId]: value } } : c
    )));
    engine.getEventBus().emit({
      type: 'param', target: `channel.${channelIdx}.machine.${knobId}`, value,
    });
  }, [engine, setChannels]);

  const setDiscrete = useCallback((channelIdx: number, fieldId: string, value: string) => {
    setChannels((cs) => cs.map((c, i) => (
      i === channelIdx ? { ...c, machine: { ...c.machine, [fieldId]: value } } : c
    )));
    engine.getEventBus().emit({
      type: 'param', target: `channel.${channelIdx}.machine.${fieldId}`, value,
    });
  }, [engine, setChannels]);

  const setMixer = useCallback(
    (channelIdx: number, field: 'level' | 'pan' | 'reverbSend' | 'delaySend', value: number) => {
      setChannels((cs) => cs.map((c, i) => (
        i === channelIdx
          ? { ...c, effects: { ...c.effects, [field]: value } }
          : c
      )));
      engine.getEventBus().emit({
        type: 'param', target: `channel.${channelIdx}.${field}`, value,
      });
    },
    [engine, setChannels],
  );

  const swapArchetype = useCallback((channelIdx: number, id: VoiceArchetypeId) => {
    setChannels((cs) => cs.map((c, i) => (
      i === channelIdx ? { ...c, machine: { ...VOICE_MACHINES[id].defaults } } : c
    )));
    engine.getEventBus().emit({
      type: 'param', target: `channel.${channelIdx}.machine.archetype`, value: id,
    });
  }, [engine, setChannels]);

  const setChannelLabel = useCallback((channelIdx: number, label: string) => {
    setChannels((cs) => cs.map((c, i) => (i === channelIdx ? { ...c, label } : c)));
  }, [setChannels]);

  // Channel count is variable (1..MAX_CHANNELS). See module-level
  // constant for the cap rationale (Pattern.tracks voice-keyed shape).
  const addChannel = useCallback(() => {
    const nextIdx = channels.length;
    if (nextIdx >= MAX_CHANNELS) return;
    const voice = ALL_VOICES[nextIdx];
    const labels: Record<string, string> = { KK: 'Kick', SN: 'Snare', HH: 'Hat', OH: 'Open hat', CP: 'Clap' };
    setChannels((cs) => [
      ...cs,
      {
        label: labels[voice] ?? `Ch ${nextIdx + 1}`,
        machine: buildKitMachine(session.kit, voice),
        effects: defaultChannelEffects(),
      },
    ]);
    setSequence((seq) => [...seq, Array<SoundStep>(stepsPerBar).fill(0)]);
  }, [channels.length, session.kit, setChannels, stepsPerBar]);

  const removeChannel = useCallback((idx: number) => {
    if (channels.length <= 1) return;
    setChannels((cs) => cs.filter((_, i) => i !== idx));
    setSequence((seq) => seq.filter((_, i) => i !== idx));
  }, [channels.length, setChannels]);

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
    engine.getEventBus().emit({
      type: 'param', target: `channel.${channelIdx}.color.type`, value: type,
    });
  }, [engine, setChannels]);

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
      engine.getEventBus().emit({
        type: 'param', target: `channel.${channelIdx}.color.${field}`, value,
      });
    },
    [engine, setChannels],
  );

  const applyPreset = useCallback((channelIdx: number, presetId: string) => {
    setChannels((cs) => cs.map((c, i) => {
      if (i !== channelIdx) return c;
      const m = VOICE_MACHINES[c.machine.archetype as VoiceArchetypeId];
      const presets = m.presets;
      if (!presets || !presets[presetId]) return c;
      const merged = { ...c.machine, ...presets[presetId] };
      // Emit a ParamEvent for every knob the preset touched so the
      // adapter cache + engine see the new values through the bus.
      const bus = engine.getEventBus();
      for (const [knob, v] of Object.entries(presets[presetId])) {
        if (knob === 'archetype') continue;
        bus.emit({
          type: 'param',
          target: `channel.${channelIdx}.machine.${knob}`,
          value: v as number | string,
        });
      }
      return { ...c, machine: merged };
    }));
  }, [engine, setChannels]);

  return (
    <main className="bf-sound-page">
      {showSpectrum && <SpectrumAnalyzer engine={engine} />}

      <header className="bf-sound-hero">
        <div className="bf-sound-title-row">
          <h1 className="bf-sound-title">Studio</h1>
          <button
            type="button"
            className={`bf-transport-play bf-transport-play-hero ${isPlaying ? 'on' : ''}`}
            onClick={() => void onPlayToggle()}
            aria-label={isPlaying ? 'Stop' : 'Play'}
            title={isPlaying ? 'Stop (Space)' : 'Play (Space)'}
          >
            {isPlaying ? '■' : '▶'}
          </button>
          {currentBar > 0 && (
            <span className="bf-transport-bar-counter" aria-label="Current bar">bar {currentBar}</span>
          )}
          <div className="bf-sound-volume" title="Master volume — post-everything output level">
            <span className="bf-sound-volume-ico" aria-hidden="true">
              {masterVolume === 0 ? '🔇' : masterVolume < 0.35 ? '🔈' : masterVolume < 0.7 ? '🔉' : '🔊'}
            </span>
            <input
              type="range"
              min={0}
              max={100}
              value={Math.round(masterVolume * 100)}
              onChange={(e) => setMasterVolume(Number(e.target.value) / 100)}
              aria-label="Master volume"
            />
          </div>
          <button
            type="button"
            className={`bf-spectrum-toggle ${showSpectrum ? 'on' : ''}`}
            onClick={() => setShowSpectrum((v) => !v)}
            title="Show / hide the spectrum readout"
            aria-pressed={showSpectrum}
          >
            {showSpectrum ? 'hide spectrum' : 'show spectrum'}
          </button>
        </div>

        <p className="bf-sound-sub">
          Lay it down: sequence the steps, shape each voice. <kbd>Space</kbd>
          plays. <kbd>A</kbd>–<kbd>G</kbd> auditions (<kbd>Q</kbd>–<kbd>T</kbd>
          accent). Click any cell to cycle off → on → accent.
        </p>

        {/* Top control bar — most-touched controls live here so they're
            always reachable without scrolling: BPM, meter, grouping,
            count-in, swing. Save / metadata / mix sliders sit below. */}
        <div className="bf-sound-topbar" role="toolbar" aria-label="Studio transport">
          <div className="bf-feel-control">
            <span className="bf-feel-label">bpm</span>
            <div className="bf-sound-bpm-row">
              <BpmInput bpm={bpm} setBpm={setBpm} className="bf-sound-bpm-input" />
              <button type="button" className="bf-transport-tap" onClick={onTap} title="Tap tempo (T)">tap</button>
            </div>
          </div>
          <div className="bf-feel-control">
            <span className="bf-feel-label">meter</span>
            <div className="bf-sound-meter-row">
              <select
                className="bf-meter-select"
                value={SOUND_METERS.some((m) => m.label === meter.label) ? meter.label : '__custom'}
                aria-label="Meter preset"
                onChange={(e) => {
                  const next = SOUND_METERS.find((m) => m.label === e.target.value);
                  if (next) onMeterChange(next);
                }}
              >
                {SOUND_METERS.map((m) => (
                  <option key={m.label} value={m.label}>{m.label} ({m.grouping.join('+')})</option>
                ))}
                {!SOUND_METERS.some((m) => m.label === meter.label) && (
                  <option value="__custom">{meter.label} (custom)</option>
                )}
              </select>
              <NumberInput
                min={1}
                max={64}
                value={sumGroup(meter.grouping)}
                onChange={(n) => {
                  onMeterChange({ label: `${n}/${meter.stepUnit}`, grouping: [n], stepUnit: meter.stepUnit });
                }}
                className="bf-sound-meter-num"
                ariaLabel="Time signature numerator"
                title="Numerator — number of beats per bar"
              />
              <span className="bf-sound-meter-slash">/</span>
              <select
                value={meter.stepUnit}
                onChange={(e) => {
                  const denom = parseInt(e.target.value, 10) as 2 | 4 | 8 | 16;
                  if (denom !== 2 && denom !== 4 && denom !== 8 && denom !== 16) return;
                  const num = sumGroup(meter.grouping);
                  onMeterChange({ label: `${num}/${denom}`, grouping: meter.grouping, stepUnit: denom });
                }}
                className="bf-sound-meter-denom"
                aria-label="Time signature denominator"
                title="Denominator — beat unit (2, 4, 8, or 16)"
              >
                <option value={16}>16</option>
                <option value={8}>8</option>
                <option value={4}>4</option>
                <option value={2}>2</option>
              </select>
            </div>
          </div>
          <div className="bf-feel-control">
            <span className="bf-feel-label">grouping</span>
            <div className="bf-sound-grouping-picker" role="toolbar" aria-label="Grouping">
              {groupingOptions.length > 1 && (
                <div className="bf-feel-pills">
                  {groupingOptions.map((g, i) => {
                    const isCurrent = g.join('+') === grouping.join('+');
                    return (
                      <button
                        key={i}
                        type="button"
                        className={`bf-feel-pill ${isCurrent ? 'on' : ''}`}
                        onClick={() => onGroupingChange(g)}
                        title={`Apply ${g.join('+')} grouping`}
                      >
                        {g.join('+')}
                      </button>
                    );
                  })}
                </div>
              )}
              <GroupingTextEditor
                key={grouping.join(',')}
                initialText={grouping.join(',')}
                stepsPerBar={stepsPerBar}
                onApply={onGroupingTextApply}
              />
            </div>
          </div>
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
          <div className={`bf-feel-control ${(meter.stepUnit === 2 || meter.stepUnit === 4) ? 'disabled' : ''}`}>
            <span className="bf-feel-label">swing {Math.round(swing * 100)}%</span>
            <input
              type="range" min={0.5} max={0.67} step={0.01}
              value={swing}
              disabled={(meter.stepUnit === 2 || meter.stepUnit === 4)}
              onChange={(e) => setSwing(Number(e.target.value))}
              aria-label="Swing"
            />
          </div>
          <button type="button" className="bf-sound-clear-btn" onClick={onClear} title="Clear all steps">clear</button>
        </div>
      </header>

      <section className="bf-sound-sequencer">
        <div className="bf-sound-patternbar bf-sound-kitbar bf-sound-kitbar-secondary">
          <span className="bf-sound-bar-tag" title="Saves only the 5 channel voices — reusable across patterns.">
            ensemble <span className="bf-sound-bar-hint">(sounds only)</span>
          </span>
          <select
            className="bf-sound-kit-preset"
            value=""
            onChange={(e) => {
              const kit = e.target.value as KitId;
              if (!kit) return;
              session.setKit(kit);
              setKitName(`${kit === 'frameDrum' ? 'frame' : kit} kit`);
              setSavedKitId(null);
              e.target.value = '';
            }}
            title="Load a default ensemble as a starting point"
            aria-label="Load default ensemble"
          >
            <option value="">load preset…</option>
            {ALL_KITS.map((k) => (
              <option key={k} value={k}>
                {k === 'frameDrum' ? 'frame' : k}
              </option>
            ))}
          </select>
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
            className="bf-sound-saveBtn bf-sound-saveBtn-secondary"
            onClick={() => void onSaveKit()}
            title={savedKitId ? 'Update saved sounds — beat is unaffected' : 'Save the 5 channel voices for reuse across patterns'}
          >
            {savedKitId ? 'update sounds' : 'save sounds'}
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

        <div className="bf-sound-patternbar bf-sound-patternbar-primary">
          <span className="bf-sound-bar-tag" title="Saves the beat AND the current sounds. Use this to save your work.">
            pattern <span className="bf-sound-bar-hint">(beat + sounds)</span>
          </span>
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
            className="bf-sound-saveBtn bf-sound-saveBtn-primary"
            onClick={() => void onSave()}
            title={savedId ? 'Update saved pattern (beat + sounds)' : 'Save the beat plus the current sounds'}
          >
            {savedId ? 'update pattern' : 'save pattern'}
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

        {/* Metadata disclosure — region / genre / tags / story / kit
            ride along with the saved pattern so it appears properly
            in Library. Defaults are sensible for "I just made this";
            users can refine before saving. */}
        <Disclosure
          className="bf-sound-meta bf-sound-disclosure-row"
          summaryClassName="bf-sound-meta-head bf-sound-disclosure-head"
          summary={<span className="bf-feel-label">metadata</span>}
        >
          <div className="bf-sound-feelbar bf-sound-meta-feelbar">
            <label className="bf-feel-control">
              <span className="bf-feel-label">region</span>
              <select
                className="bf-sound-meta-input"
                value={patternRegion}
                onChange={(e) => setPatternRegion(e.target.value as RegionId)}
              >
                {REGION_OPTIONS.map((r) => (
                  <option key={r} value={r}>{r}</option>
                ))}
              </select>
            </label>
            <label className="bf-feel-control">
              <span className="bf-feel-label">genre</span>
              <select
                className="bf-sound-meta-input"
                value={patternGenre}
                onChange={(e) => setPatternGenre(e.target.value as Genre)}
              >
                {GENRE_OPTIONS.map((g) => (
                  <option key={g} value={g}>{g}</option>
                ))}
              </select>
            </label>
            <label className="bf-feel-control">
              <span className="bf-feel-label">default kit</span>
              <select
                className="bf-sound-meta-input"
                value={defaultKit}
                onChange={(e) => setDefaultKitState(e.target.value as KitId)}
              >
                {ALL_KITS.map((k) => (
                  <option key={k} value={k}>{k === 'frameDrum' ? 'frame' : k}</option>
                ))}
              </select>
            </label>
            <label className="bf-feel-control bf-sound-meta-toggle">
              <input
                type="checkbox"
                checked={swingable}
                onChange={(e) => setSwingable(e.target.checked)}
              />
              <span className="bf-feel-label">swingable</span>
            </label>
            <label className="bf-feel-control bf-feel-grow">
              <span className="bf-feel-label">tags</span>
              <input
                className="bf-sound-meta-input"
                type="text"
                value={patternTags.join(', ')}
                onChange={(e) => setPatternTags(
                  e.target.value.split(',').map((t) => t.trim()).filter(Boolean),
                )}
                placeholder="house, four-on-floor"
              />
            </label>
            <label className="bf-feel-control bf-feel-fullrow">
              <span className="bf-feel-label">story</span>
              <textarea
                className="bf-sound-meta-input"
                rows={2}
                value={patternStory}
                onChange={(e) => setPatternStory(e.target.value)}
                placeholder="Where this rhythm comes from, what to listen for…"
              />
            </label>
          </div>
        </Disclosure>

        <div className="bf-sound-feelbar">
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
              dry {Math.round(dryLevel * 100)}%
            </span>
            <input
              type="range"
              min={0}
              max={1}
              step={0.01}
              value={dryLevel}
              onChange={(e) => setDryLevel(Number(e.target.value))}
              aria-label="Dry-bus level"
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

        <Disclosure
          className="bf-sound-fxdetails bf-sound-disclosure-row"
          summaryClassName="bf-sound-fxdetails-head bf-sound-disclosure-head"
          summary={<span className="bf-feel-label">fx details</span>}
        >
          <div className="bf-sound-fxbar bf-sound-fxbar-flat">
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
        </Disclosure>

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
                  className="bf-sound-strip-remove"
                  onClick={() => removeChannel(i)}
                  disabled={channels.length <= 1}
                  aria-label={`Remove channel ${i + 1}`}
                  title={channels.length <= 1 ? 'At least one channel required' : 'Remove this channel'}
                  type="button"
                >
                  ✕
                </button>
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
        {channels.length < MAX_CHANNELS && (
          <button
            type="button"
            className="bf-sound-strip-add"
            onClick={addChannel}
            title="Add a channel"
            aria-label="Add a channel"
          >
            <span className="bf-sound-strip-add-glyph">+</span>
            <span>add channel</span>
          </button>
        )}

      </section>
    </main>
  );
}
