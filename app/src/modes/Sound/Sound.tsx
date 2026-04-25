// Sound page — phase 1 v0: minimal channel browser + knob editor +
// audition triggers. No 16-step sequencer, color FX, kit FX, or save
// flow yet — just enough for sound design.

import { useCallback, useEffect, useRef, useState } from 'react';
import { SoundEngine } from '../../audio/runtime/sound-engine';
import { VOICE_MACHINES, type VoiceArchetypeId } from '../../audio/machines/registry';
import type { MachineConfig } from '../../audio/machines/types';
import { SpectrumAnalyzer } from './SpectrumAnalyzer';

interface Channel {
  label: string;
  short: string;
  machine: MachineConfig;
}

function defaultChannels(): Channel[] {
  return [
    { label: 'Kick',  short: 'Kic', machine: { ...VOICE_MACHINES.kick.defaults } },
    { label: 'Snare', short: 'Sna', machine: { ...VOICE_MACHINES.snare.defaults } },
    { label: 'Hat',   short: 'Hat', machine: { ...VOICE_MACHINES.hat.defaults } },
    { label: 'Clap',  short: 'Cla', machine: { ...VOICE_MACHINES.clap.defaults } },
    { label: 'Tom',   short: 'Tom', machine: { ...VOICE_MACHINES.tom.defaults, ...VOICE_MACHINES.tom.presets?.mid } },
  ];
}

export function Sound() {
  const [engine] = useState(() => new SoundEngine());
  useEffect(() => () => { engine.dispose(); }, [engine]);

  const [channels, setChannels] = useState<Channel[]>(() => defaultChannels());
  const [selectedIdx, setSelectedIdx] = useState(0);

  // Refs the keyboard handler reads (avoids re-binding the listener
  // on every channel change). Sync via effect — React 19 disallows
  // ref writes during render.
  const channelsRef = useRef(channels);
  useEffect(() => { channelsRef.current = channels; }, [channels]);

  const trigger = useCallback(async (idx: number, amp = 1.0) => {
    await engine.ensureCtx();
    const ch = channelsRef.current[idx];
    if (ch) engine.trigger(ch.machine, amp);
  }, [engine]);

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

  const ch = channels[selectedIdx];
  const archetypeId = ch.machine.archetype as VoiceArchetypeId;
  const machine = VOICE_MACHINES[archetypeId];

  const setKnob = useCallback((knobId: string, value: number) => {
    setChannels((cs) => cs.map((c, i) => (
      i === selectedIdx ? { ...c, machine: { ...c.machine, [knobId]: value } } : c
    )));
  }, [selectedIdx]);

  const swapArchetype = useCallback((id: VoiceArchetypeId) => {
    setChannels((cs) => cs.map((c, i) => (
      i === selectedIdx ? { ...c, machine: { ...VOICE_MACHINES[id].defaults } } : c
    )));
  }, [selectedIdx]);

  const applyPreset = useCallback((presetId: string) => {
    const presets = machine.presets;
    if (!presets || !presets[presetId]) return;
    setChannels((cs) => cs.map((c, i) => (
      i === selectedIdx
        ? { ...c, machine: { ...c.machine, ...presets[presetId] } }
        : c
    )));
  }, [machine, selectedIdx]);

  return (
    <main className="bf-sound-page">
      <SpectrumAnalyzer engine={engine} />

      <header className="bf-sound-hero">
        <h1 className="bf-sound-title">Sound</h1>
        <p className="bf-sound-sub">
          Pick a channel, swap the archetype, dial knobs. Tap <kbd>▶</kbd>
          or use <kbd>A</kbd>/<kbd>S</kbd>/<kbd>D</kbd>/<kbd>F</kbd>/<kbd>G</kbd>
          to audition. <kbd>Q</kbd>/<kbd>W</kbd>/<kbd>E</kbd>/<kbd>R</kbd>/<kbd>T</kbd>
          for accent (2× velocity).
        </p>
      </header>

      <section className="bf-sound-channels">
        {channels.map((c, i) => {
          const m = VOICE_MACHINES[c.machine.archetype as VoiceArchetypeId];
          // Outer is a div with role=button — can't nest a real
          // <button> inside another <button> (HTML / React 19 / Safari
          // all complain). KeyDown handles space + enter for a11y.
          return (
            <div
              key={i}
              role="button"
              tabIndex={0}
              className={`bf-sound-channel ${i === selectedIdx ? 'on' : ''}`}
              onClick={() => setSelectedIdx(i)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  setSelectedIdx(i);
                }
              }}
            >
              <span className="bf-sound-channel-num">ch {i + 1}</span>
              <span className="bf-sound-channel-name">{c.label}</span>
              <span className="bf-sound-channel-arch">{m.label}</span>
              <button
                className="bf-sound-channel-trigger"
                onClick={(e) => { e.stopPropagation(); void trigger(i); }}
                aria-label={`Trigger ${c.label}`}
                type="button"
              >
                ▶
              </button>
            </div>
          );
        })}
      </section>

      <section className="bf-sound-edit">
        <div className="bf-sound-edit-head">
          <h2>{ch.label}</h2>
          <label className="bf-sound-arch-pick">
            <span className="bf-mini-label">Archetype</span>
            <select
              value={archetypeId}
              onChange={(e) => swapArchetype(e.target.value as VoiceArchetypeId)}
            >
              {(Object.keys(VOICE_MACHINES) as VoiceArchetypeId[]).map((id) => (
                <option key={id} value={id}>{VOICE_MACHINES[id].label}</option>
              ))}
            </select>
          </label>
          {machine.presets && Object.keys(machine.presets).length > 0 && (
            <label className="bf-sound-preset-pick">
              <span className="bf-mini-label">Preset</span>
              <select
                value=""
                onChange={(e) => { if (e.target.value) applyPreset(e.target.value); }}
              >
                <option value="">— pick —</option>
                {Object.keys(machine.presets).map((p) => (
                  <option key={p} value={p}>{p}</option>
                ))}
              </select>
            </label>
          )}
        </div>

        <div className="bf-sound-knobs">
          {machine.knobs.map((k) => {
            const cfg = ch.machine as unknown as Record<string, number>;
            const value = cfg[k.id] ?? k.default;
            return (
              <div key={k.id} className="bf-sound-knob">
                <div className="bf-sound-knob-label">{k.label}</div>
                <input
                  type="range"
                  min={k.min}
                  max={k.max}
                  step={(k.max - k.min) / 200}
                  value={value}
                  onChange={(e) => setKnob(k.id, Number(e.target.value))}
                />
                <div className="bf-sound-knob-val">
                  {value.toFixed(k.unit === 'Hz' || k.unit === 'ms' ? 0 : 2)} {k.unit}
                </div>
              </div>
            );
          })}
        </div>
      </section>
    </main>
  );
}
