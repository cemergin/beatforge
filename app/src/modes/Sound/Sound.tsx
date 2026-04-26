// Sound page — phase 1 v2: 5 channels visible at once, circular
// knobs for synth + per-channel mixer (level / pan / sends),
// audition triggers, ASDFG/QWERT keyboard.

import { useCallback, useEffect, useRef, useState } from 'react';
import { SoundEngine, type SoundSequence, type SoundStep } from '../../audio/runtime/sound-engine';
import { VOICE_MACHINES, type VoiceArchetypeId } from '../../audio/machines/registry';
import type { MachineConfig } from '../../audio/machines/types';
import {
  type Channel,
  defaultChannelEffects,
} from '../../patterns/types-sound';
import { SpectrumAnalyzer } from './SpectrumAnalyzer';
import { Knob } from './Knob';
import { StepGrid } from '../../components/StepGrid';
import { TransportBar } from '../../components/TransportBar';

const STEPS_PER_BAR = 16;
const NUM_CHANNELS = 5;

function emptySequence(): SoundSequence {
  return Array.from({ length: NUM_CHANNELS }, () =>
    Array<SoundStep>(STEPS_PER_BAR).fill(0),
  );
}

// Friendly default — four-on-the-floor with backbeat snare and 8th-note
// hats. Gives the page an alive sound on first load; clear button wipes it.
function defaultSequence(): SoundSequence {
  const seq = emptySequence();
  for (const s of [0, 4, 8, 12]) seq[0][s] = 1;        // kick on the quarters
  seq[1][4] = 2; seq[1][12] = 2;                        // snare backbeat (accented)
  for (const s of [0, 2, 4, 6, 8, 10, 12, 14]) seq[2][s] = 1; // hat 8ths
  return seq;
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

  // Push sequence + BPM to the engine.
  useEffect(() => { engine.setSequence(sequence); }, [engine, sequence]);
  useEffect(() => { engine.setBpm(bpm); }, [engine, bpm]);

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
    setSequence(emptySequence());
  }, []);

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

  // Space toggles play/stop. Skipped when typing in an input (e.g. BPM).
  useEffect(() => {
    const onSpace = (e: KeyboardEvent) => {
      if (e.code !== 'Space') return;
      const t = e.target as HTMLElement | null;
      if (t && (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA' || t.isContentEditable)) return;
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
        <TransportBar
          isPlaying={isPlaying}
          bpm={bpm}
          onPlayToggle={() => void onPlayToggle()}
          onBpmChange={setBpm}
          onClear={onClear}
        />
        <StepGrid
          rows={channels.map((c, i) => ({
            label: c.label,
            short: c.short,
            steps: sequence[i] ?? [],
          }))}
          currentStep={currentStep}
          stepsPerBar={STEPS_PER_BAR}
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
