// Sound page — phase 1 v2: 5 channels visible at once, circular
// knobs for synth + per-channel mixer (level / pan / sends),
// audition triggers, ASDFG/QWERT keyboard.

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { SoundEngine, type SoundSequence, type SoundStep } from '../../audio/runtime/sound-engine';
import { registerEngineChannel, registerEngineMaster } from '../../audio/runtime/engine-adapters';
import { makeRouter } from '../../modules/router';
import { useSession } from '../../modules/session';
import { trackMeta, ALL_KITS, type KitId } from '../../patterns/types';
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
  type SoundPattern,
  type SoundKit,
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
    stepUnit: p.stepUnit as 4 | 8 | 16,
  };
}

/** Translate session.pattern.tracks (voice-keyed) into Sound's
 *  positional SoundSequence. Row order matches NUM_CHANNELS — the
 *  classic 5-piece kick/snare/hat/tom/clap layout. Tracks the
 *  pattern doesn't include get an empty row of stepsPerBar zeros. */
function sequenceFromPattern(p: import('../../patterns/types').Pattern): SoundSequence {
  const out: SoundSequence = [];
  const ALL_VOICES_LOCAL: import('../../patterns/types').VoiceId[] = ['KK', 'SN', 'HH', 'OH', 'CP'];
  for (let i = 0; i < NUM_CHANNELS; i++) {
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

  // Modular control plane: router dispatches ParamEvents arriving on
  // the engine's bus into ControllableModules. Master/reverb/delay
  // are registered at master.gain / master.reverb / master.delay so
  // any future producer (MIDI, automation, recall) can drive them
  // through the same path the sliders use. Reverb + delay register
  // the FX modules from machines/fx DIRECTLY — the router calls
  // their .set() with no engine-side shim.
  //
  // Bus binding fires immediately (the bus is lazily owned by the
  // engine and works without an AudioContext). Master FX
  // registration waits for ensureCtx() because the FX modules
  // don't exist until the context is initialized.
  const [router] = useState(() => makeRouter());
  useEffect(() => {
    let active = true;
    let unregister: (() => void) | null = null;
    const unbind = router.bindBus(engine.getEventBus());
    void engine.ensureCtx().then(() => {
      if (!active) return;
      unregister = registerEngineMaster(router, engine);
    });
    return () => {
      active = false;
      unbind();
      unregister?.();
    };
  }, [engine, router]);

  // Channels live in the session — labels, machine configs, color
  // FX, level/pan/sends ride with the user across tabs. setChannels
  // accepts the same (Channel[] | (prev) => Channel[]) signature
  // existing handlers use; internally it forwards to session.
  const channels = session.channels;
  const setChannels = useCallback(
    (updaterOrValue: Channel[] | ((prev: Channel[]) => Channel[])) => {
      const next = typeof updaterOrValue === 'function'
        ? updaterOrValue(session.channels.slice())
        : updaterOrValue;
      session.setChannels(next);
    },
    [session],
  );
  // Sequence seeded from session.pattern on mount so Practice→Sound
  // lands on the same beats. Hydration effect below keeps it in
  // sync when session.pattern changes externally.
  const [sequence, setSequence] = useState<SoundSequence>(
    () => sequenceFromPattern(session.pattern),
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
    setSequence(sequenceFromPattern(session.pattern));
  }, [session.pattern]);

  // Outbound: Sound's local edits to sequence + grouping + meter
  // flow back into session.pattern so other tabs see them. Skips
  // the first render (initial state matches session) and any time
  // the sequence/grouping/meter values match what session already
  // has — avoids a feedback loop when the inbound effect just set
  // them. Bpm flows separately — Sound's bpm is quarter-BPM and
  // doesn't yet round-trip session.bpm cleanly.
  const lastPushedRef = useRef<{
    sequence: SoundSequence; grouping: number[]; stepUnit: 4 | 8 | 16;
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
  // rather than creating a duplicate.
  const [name, setName] = useState('Untitled');
  const [savedId, setSavedId] = useState<string | null>(null);
  const [savedList, setSavedList] = useState<SoundPattern[]>([]);
  const [toast, setToast] = useState<string | null>(null);

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

  // Per-channel adapter registrations. Every time the channel count
  // changes, tear down old adapter registrations and register fresh
  // ones at channel.<n>, channel.<n>.color, channel.<n>.machine
  // with the channel's CURRENT state as the adapter's initial cache.
  // After this effect runs, ParamEvents like channel.0.machine.pitch
  // route directly to engine.applyChannelMachine.
  //
  // Why count, not full channels[]: re-registering on every knob
  // tweak would discard the adapter's state cache mid-edit. The
  // count-only dependency means the registration is stable across
  // knob changes; the adapter caches stay correct because every
  // knob change ALSO emits a ParamEvent that updates the cache.
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
    // setBpm + many setters close over engine/session; safe to omit.
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
  }, [engine]);

  const setDiscrete = useCallback((channelIdx: number, fieldId: string, value: string) => {
    setChannels((cs) => cs.map((c, i) => (
      i === channelIdx ? { ...c, machine: { ...c.machine, [fieldId]: value } } : c
    )));
    engine.getEventBus().emit({
      type: 'param', target: `channel.${channelIdx}.machine.${fieldId}`, value,
    });
  }, [engine]);

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
    [engine],
  );

  const swapArchetype = useCallback((channelIdx: number, id: VoiceArchetypeId) => {
    setChannels((cs) => cs.map((c, i) => (
      i === channelIdx ? { ...c, machine: { ...VOICE_MACHINES[id].defaults } } : c
    )));
    engine.getEventBus().emit({
      type: 'param', target: `channel.${channelIdx}.machine.archetype`, value: id,
    });
  }, [engine]);

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
    engine.getEventBus().emit({
      type: 'param', target: `channel.${channelIdx}.color.type`, value: type,
    });
  }, [engine]);

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
    [engine],
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
  }, [engine]);

  return (
    <main className="bf-sound-page">
      {showSpectrum && <SpectrumAnalyzer engine={engine} />}

      <header className="bf-sound-hero">
        <div className="bf-sound-title-row">
          <h1 className="bf-sound-title">Studio</h1>
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
      </header>

      <section className="bf-sound-sequencer">
        <div className="bf-sound-patternbar bf-sound-kitbar">
          <span className="bf-sound-bar-tag">ensemble</span>
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
