// Sound page — phase 1 v2: 5 channels visible at once, circular
// knobs for synth + per-channel mixer (level / pan / sends),
// audition triggers, ASDFG/QWERT keyboard.

import { useCallback, useEffect, useRef, useState } from 'react';
import { SoundEngine, type SoundSequence, type SoundStep } from '../../audio/runtime/sound-engine';
import { VOICE_MACHINES, type VoiceArchetypeId } from '../../audio/machines/registry';
import type { MachineConfig } from '../../audio/machines/types';
import {
  type Channel,
  type SoundPattern,
  defaultChannelEffects,
} from '../../patterns/types-sound';
import {
  saveSoundPattern,
  listSoundPatterns,
  deleteSoundPattern,
} from '../../lib/db';
import { SpectrumAnalyzer } from './SpectrumAnalyzer';
import { Knob } from './Knob';
import { StepGrid } from '../../components/StepGrid';
import { TransportBar } from '../../components/TransportBar';

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
  return [
    { label: 'Kick',    short: 'Kic', machine: k('kick'),                effects: defaultChannelEffects() },
    { label: 'Snare',   short: 'Sna', machine: k('snare'),               effects: defaultChannelEffects() },
    { label: 'Hat',     short: 'Hat', machine: k('hat'),                 effects: defaultChannelEffects() },
    { label: 'Bell',    short: 'Bel', machine: k('modal', 'bell'),       effects: defaultChannelEffects() },
    { label: 'Kalimba', short: 'Kal', machine: k('fm', 'kalimba'),         effects: defaultChannelEffects() },
  ];
}

export function Sound() {
  const [engine] = useState(() => new SoundEngine());
  useEffect(() => () => { engine.dispose(); }, [engine]);

  const [channels, setChannels] = useState<Channel[]>(() => defaultChannels());
  const [sequence, setSequence] = useState<SoundSequence>(() => defaultSequence());
  const [bpm, setBpm] = useState(110);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentStep, setCurrentStep] = useState(-1);
  const [meter, setMeter] = useState<MeterPreset>(DEFAULT_METER);
  const stepsPerBar = sumGroup(meter.grouping);

  // Pattern persistence — name + last-saved id (`null` until first save).
  // savedId is preserved across edits so a re-Save updates in place
  // rather than creating a duplicate.
  const [name, setName] = useState('Untitled');
  const [savedId, setSavedId] = useState<string | null>(null);
  const [savedList, setSavedList] = useState<SoundPattern[]>([]);
  const [toast, setToast] = useState<string | null>(null);

  // Hydrate the saved list on mount + after every save/delete. The
  // mount effect uses promise-then form so setState lands in a
  // microtask (React-19's set-state-in-effect rule rejects an inline
  // setState even via an awaited helper). Save/delete handlers can
  // still call refreshSavedList directly — that runs outside an
  // effect, so the rule doesn't apply.
  const refreshSavedList = useCallback(async () => {
    try {
      const list = await listSoundPatterns();
      setSavedList(list);
    } catch { /* IDB unavailable — keep silent, list stays empty */ }
  }, []);
  useEffect(() => {
    let active = true;
    listSoundPatterns()
      .then((list) => { if (active) setSavedList(list); })
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

  // Push sequence + BPM + stepUnit to the engine.
  useEffect(() => { engine.setSequence(sequence); }, [engine, sequence]);
  useEffect(() => { engine.setBpm(bpm); }, [engine, bpm]);
  useEffect(() => { engine.setStepUnit(meter.stepUnit); }, [engine, meter.stepUnit]);

  // Drive the visual playhead from audibleStep() — what's playing NOW,
  // not what's queued 300ms ahead. Frame loop only runs while playing;
  // the -1 reset on stop happens in onPlayToggle (avoids the React-19
  // setState-in-effect-body lint).
  useEffect(() => {
    if (!isPlaying) return;
    let raf = 0;
    const loop = () => {
      setCurrentStep(engine.audibleStep());
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, [engine, isPlaying]);

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
    } else {
      await engine.play();
      setIsPlaying(true);
    }
  }, [engine, isPlaying]);

  // Cycle a cell: 0 → 1 → 2 → 0. Click toggles, the third click resets.
  const onToggleCell = useCallback((rowIdx: number, stepIdx: number) => {
    setSequence((prev) => prev.map((row, r) => {
      if (r !== rowIdx) return row;
      return row.map((v, s) => (s === stepIdx ? (((v + 1) % 3) as SoundStep) : v));
    }));
  }, []);

  const onClear = useCallback(() => {
    setSequence(emptySequence(stepsPerBar));
  }, [stepsPerBar]);

  // Switch meter — resize each row to the new bar length so existing
  // beats survive when possible (truncate excess on shrink, pad with
  // 0s on grow). The engine re-anchors automatically on setStepUnit.
  const onMeterChange = useCallback((m: MeterPreset) => {
    setMeter(m);
    setSequence((prev) => resizeSequence(prev, sumGroup(m.grouping)));
  }, []);

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
      grouping: [...meter.grouping],
      stepUnit: meter.stepUnit,
      sequence: sequence.map((row) => [...row]),
      channels: channels.map((c) => ({
        label: c.label,
        short: c.short,
        machine: { ...c.machine },
        effects: { ...c.effects, colorFx: { ...c.effects.colorFx } },
      })),
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
  }, [name, savedId, savedList, bpm, meter, sequence, channels, refreshSavedList]);

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
    setChannels(p.channels.map((c) => ({
      label: c.label,
      short: c.short,
      machine: { ...c.machine },
      effects: { ...c.effects, colorFx: { ...c.effects.colorFx } },
    })));
    // Coerce stored numbers into SoundStep (saved as number[][] for
    // forward-compat — we may broaden velocity beyond 0/1/2 later).
    setSequence(p.sequence.map((row) => row.map((v) => (v === 2 ? 2 : v === 1 ? 1 : 0) as SoundStep)));
    setToast(`Loaded ${p.name}`);
  }, [engine, isPlaying]);

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
        <div className="bf-sound-patternbar">
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
        <StepGrid
          rows={channels.map((c, i) => ({
            label: c.label,
            short: c.short,
            steps: sequence[i] ?? [],
          }))}
          currentStep={currentStep}
          stepsPerBar={stepsPerBar}
          grouping={meter.grouping}
          onToggleCell={onToggleCell}
        />
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
                <div className="bf-sound-strip-name">{c.label}</div>
                <button
                  className="bf-sound-strip-trigger"
                  onClick={() => void trigger(i)}
                  aria-label={`Trigger ${c.label}`}
                  type="button"
                >
                  ▶
                </button>
              </div>

              <div className="bf-sound-strip-pickers">
                <select
                  className="bf-sound-strip-select"
                  value={archetypeId}
                  onChange={(e) => swapArchetype(i, e.target.value as VoiceArchetypeId)}
                  aria-label="Machine"
                  title="Machine"
                >
                  {(Object.keys(VOICE_MACHINES) as VoiceArchetypeId[]).map((id) => (
                    <option key={id} value={id}>{VOICE_MACHINES[id].label}</option>
                  ))}
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

              <div className="bf-sound-strip-section-label">mix</div>
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
            </div>
          );
        })}
      </section>
    </main>
  );
}
