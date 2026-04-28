// Secret MIDI tab — dev-only (?tab=_midi, gated by import.meta.env.DEV).
//
// Three jobs:
//   1. Enable Web MIDI + list inputs/outputs so the user can confirm
//      their hardware is detected.
//   2. Edit a mapping table (CC / note → bus address) that drives the
//      makeMidiModule bridge. Mappings persist to localStorage so the
//      same physical knob still maps after a reload.
//   3. Live monitor — show every raw MIDI message coming in (and
//      anything we send via the test buttons going out) so the user
//      can verify the channel/CC numbers their controller emits.
//
// The MIDI module itself was shipped earlier (modules/midi). This page
// is the first place it actually attaches to a SoundEngine in the app
// runtime.

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { SoundEngine } from '../../audio/runtime/sound-engine';
import {
  makeMidiModule,
  type MidiInputLike,
  type MidiInputMap,
  type MidiOutputLike,
} from '../../modules/midi';
import { loadMidiMappings, saveMidiMappings } from '../../lib/midiMappings';

interface Props {
  engine: SoundEngine;
}

interface LogEntry {
  id: number;
  ts: number;
  dir: 'in' | 'out';
  source: string;
  raw: number[];
  decoded: string;
}

const MAX_LOG = 200;

const COMMON_ADDRESSES: readonly string[] = [
  'master.gain.gain',
  'master.reverb.wet',
  'master.delay.wet',
  'channel.0',
  'channel.0.level',
  'channel.0.pan',
  'channel.0.reverbSend',
  'channel.0.delaySend',
  'channel.1',
  'channel.2',
  'channel.3',
  'channel.4',
];

export function Midi({ engine }: Props) {
  const [enabled, setEnabled] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [inputs, setInputs] = useState<MidiInputLike[]>([]);
  const [outputs, setOutputs] = useState<MidiOutputLike[]>([]);
  const [activeInputIds, setActiveInputIds] = useState<Set<string>>(new Set());
  const [outputId, setOutputId] = useState<string>('');
  const [mappings, setMappings] = useState<MidiInputMap[]>(() => loadMidiMappings());
  const [log, setLog] = useState<LogEntry[]>([]);
  const logIdRef = useRef(0);

  // Test-send form state.
  const [sendChannel, setSendChannel] = useState(0);
  const [sendNote, setSendNote] = useState(36);
  const [sendVel, setSendVel] = useState(100);
  const [sendCc, setSendCc] = useState(74);
  const [sendCcVal, setSendCcVal] = useState(64);

  // Persist mappings whenever the editor changes them.
  useEffect(() => { saveMidiMappings(mappings); }, [mappings]);

  // The MIDI module is bound to the engine's bus so mappings emit
  // ParamEvent / TriggerEvent at the same addresses the audio router
  // already understands.
  const midi = useMemo(() => makeMidiModule(engine.getEventBus()), [engine]);

  const pushLog = useCallback((entry: Omit<LogEntry, 'id'>) => {
    setLog((prev) => {
      const next: LogEntry = { ...entry, id: ++logIdRef.current };
      const out = prev.length >= MAX_LOG ? prev.slice(prev.length - MAX_LOG + 1) : prev;
      return [...out, next];
    });
  }, []);

  const enable = useCallback(async () => {
    setError(null);
    try {
      const access = await midi.enable();
      midi.attach(access);
      setEnabled(true);
      setInputs(midi.inputs());
      setOutputs(midi.outputs());
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    }
  }, [midi]);

  // Bind active inputs to (a) raw monitor + (b) the mapping bridge.
  // Re-runs when the user toggles inputs in the UI or edits the
  // mapping list. The unsubscribe stack tears both attachments down.
  useEffect(() => {
    if (!enabled) return;
    const offs: Array<() => void> = [];
    for (const input of inputs) {
      if (!activeInputIds.has(input.id)) continue;

      // Raw monitor — captures every byte regardless of mapping match.
      const monitor = (event: { data: Uint8Array }) => {
        const data = Array.from(event.data);
        pushLog({
          ts: performance.now(),
          dir: 'in',
          source: input.name ?? input.id,
          raw: data,
          decoded: decodeMidi(data),
        });
      };
      input.addEventListener('midimessage', monitor);
      offs.push(() => input.removeEventListener('midimessage', monitor));

      // Bridge — runs the user's mapping table against this input.
      offs.push(midi.bindInput(input, mappings));
    }
    return () => { for (const off of offs) off(); };
  }, [enabled, inputs, activeInputIds, mappings, midi, pushLog]);

  // Mapping editor mutations.
  const addMapping = useCallback((kind: 'note' | 'cc') => {
    setMappings((prev) => prev.concat(
      kind === 'note'
        ? { kind: 'note', toAddress: 'channel.0' }
        : { kind: 'cc', cc: 74, toAddress: 'channel.0.color.cutoff', scale: 'linear' },
    ));
  }, []);

  const updateMapping = useCallback((idx: number, patch: Partial<MidiInputMap>) => {
    setMappings((prev) => prev.map((m, i) => (i === idx ? { ...m, ...patch } as MidiInputMap : m)));
  }, []);

  const removeMapping = useCallback((idx: number) => {
    setMappings((prev) => prev.filter((_, i) => i !== idx));
  }, []);

  const clearLog = useCallback(() => setLog([]), []);

  // Test send — picks the chosen output and emits one MIDI message.
  // The same message is logged outbound so the user sees the byte
  // sequence next to incoming traffic.
  const findOutput = useCallback((): MidiOutputLike | null => {
    if (!outputId) return null;
    return outputs.find((o) => o.id === outputId) ?? null;
  }, [outputId, outputs]);

  const sendNoteOn = useCallback(() => {
    const out = findOutput();
    if (!out) return;
    const data = [0x90 | (sendChannel & 0x0f), sendNote & 0x7f, sendVel & 0x7f];
    out.send(data);
    pushLog({ ts: performance.now(), dir: 'out', source: out.name ?? out.id, raw: data, decoded: decodeMidi(data) });
  }, [findOutput, sendChannel, sendNote, sendVel, pushLog]);

  const sendNoteOff = useCallback(() => {
    const out = findOutput();
    if (!out) return;
    const data = [0x80 | (sendChannel & 0x0f), sendNote & 0x7f, 0];
    out.send(data);
    pushLog({ ts: performance.now(), dir: 'out', source: out.name ?? out.id, raw: data, decoded: decodeMidi(data) });
  }, [findOutput, sendChannel, sendNote, pushLog]);

  const sendCcMsg = useCallback(() => {
    const out = findOutput();
    if (!out) return;
    const data = [0xb0 | (sendChannel & 0x0f), sendCc & 0x7f, sendCcVal & 0x7f];
    out.send(data);
    pushLog({ ts: performance.now(), dir: 'out', source: out.name ?? out.id, raw: data, decoded: decodeMidi(data) });
  }, [findOutput, sendChannel, sendCc, sendCcVal, pushLog]);

  const toggleInput = useCallback((id: string) => {
    setActiveInputIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  }, []);

  return (
    <main className="bf-midi-page">
      <header className="bf-lib-hero">
        <div>
          <h1 className="bf-lib-title">MIDI <span className="bf-midi-badge">DEV</span></h1>
          <p className="bf-lib-sub">
            Hidden tab. Bind controller CCs and notes to bus addresses, watch traffic in both directions.
          </p>
          <div className="bf-lib-hero-actions">
            {!enabled
              ? <button className="bf-chip on" onClick={enable} type="button">Enable Web MIDI</button>
              : <span className="bf-midi-status">enabled · {inputs.length} in / {outputs.length} out</span>}
          </div>
          {error && <div className="bf-midi-error">{error}</div>}
        </div>
      </header>

      {enabled && (
        <>
          <section className="bf-lib-zone">
            <div className="bf-zone-head">
              <h2 className="bf-zone-title">Inputs</h2>
              <span className="bf-zone-sub">Toggle to monitor + run the mapping bridge.</span>
            </div>
            {inputs.length === 0 ? (
              <div className="bf-lib-empty">No MIDI inputs detected. Plug a controller and reload.</div>
            ) : (
              <div className="bf-chip-row">
                {inputs.map((i) => (
                  <button
                    key={i.id}
                    type="button"
                    className={`bf-chip sm ${activeInputIds.has(i.id) ? 'on' : 'ghost'}`}
                    onClick={() => toggleInput(i.id)}
                  >
                    {i.name ?? i.id}
                  </button>
                ))}
              </div>
            )}
          </section>

          <section className="bf-lib-zone">
            <div className="bf-zone-head">
              <h2 className="bf-zone-title">Mappings</h2>
              <span className="bf-zone-sub">CC / note → bus address. Saved to localStorage.</span>
            </div>
            <div className="bf-midi-maps">
              {mappings.map((m, idx) => (
                <MappingRow
                  key={idx}
                  map={m}
                  onChange={(patch) => updateMapping(idx, patch)}
                  onRemove={() => removeMapping(idx)}
                />
              ))}
              <div className="bf-chip-row">
                <button className="bf-chip sm ghost" type="button" onClick={() => addMapping('note')}>+ note</button>
                <button className="bf-chip sm ghost" type="button" onClick={() => addMapping('cc')}>+ cc</button>
                {mappings.length > 0 && (
                  <button className="bf-chip sm ghost" type="button" onClick={() => setMappings([])}>clear all</button>
                )}
              </div>
            </div>
          </section>

          <section className="bf-lib-zone">
            <div className="bf-zone-head">
              <h2 className="bf-zone-title">Outputs</h2>
              <span className="bf-zone-sub">Pick a device, then use Send to inject test messages.</span>
            </div>
            <div className="bf-midi-send">
              <select
                className="bf-midi-input"
                value={outputId}
                onChange={(e) => setOutputId(e.target.value)}
              >
                <option value="">— select output —</option>
                {outputs.map((o) => (
                  <option key={o.id} value={o.id}>{o.name ?? o.id}</option>
                ))}
              </select>
              <label className="bf-midi-field">
                ch
                <input
                  type="number" min={0} max={15}
                  value={sendChannel}
                  onChange={(e) => setSendChannel(clamp(parseInt(e.target.value, 10) || 0, 0, 15))}
                  className="bf-midi-input small"
                />
              </label>
              <label className="bf-midi-field">
                note
                <input
                  type="number" min={0} max={127}
                  value={sendNote}
                  onChange={(e) => setSendNote(clamp(parseInt(e.target.value, 10) || 0, 0, 127))}
                  className="bf-midi-input small"
                />
              </label>
              <label className="bf-midi-field">
                vel
                <input
                  type="number" min={0} max={127}
                  value={sendVel}
                  onChange={(e) => setSendVel(clamp(parseInt(e.target.value, 10) || 0, 0, 127))}
                  className="bf-midi-input small"
                />
              </label>
              <button type="button" className="bf-chip sm" onClick={sendNoteOn} disabled={!outputId}>note on</button>
              <button type="button" className="bf-chip sm" onClick={sendNoteOff} disabled={!outputId}>note off</button>
              <label className="bf-midi-field">
                cc#
                <input
                  type="number" min={0} max={127}
                  value={sendCc}
                  onChange={(e) => setSendCc(clamp(parseInt(e.target.value, 10) || 0, 0, 127))}
                  className="bf-midi-input small"
                />
              </label>
              <label className="bf-midi-field">
                value
                <input
                  type="number" min={0} max={127}
                  value={sendCcVal}
                  onChange={(e) => setSendCcVal(clamp(parseInt(e.target.value, 10) || 0, 0, 127))}
                  className="bf-midi-input small"
                />
              </label>
              <button type="button" className="bf-chip sm" onClick={sendCcMsg} disabled={!outputId}>cc</button>
            </div>
          </section>

          <section className="bf-lib-zone">
            <div className="bf-zone-head">
              <h2 className="bf-zone-title">Monitor</h2>
              <span className="bf-zone-sub">
                {log.length} of {MAX_LOG} max
                <button className="bf-linkbtn" type="button" onClick={clearLog}> clear</button>
              </span>
            </div>
            <div className="bf-midi-log">
              {log.length === 0 ? (
                <div className="bf-lib-empty">No traffic yet. Move a knob, hit a pad, or use Send above.</div>
              ) : (
                log.slice().reverse().map((e) => (
                  <div key={e.id} className={`bf-midi-row dir-${e.dir}`}>
                    <span className="bf-midi-dir">{e.dir === 'in' ? '↓' : '↑'}</span>
                    <span className="bf-midi-src">{e.source}</span>
                    <span className="bf-midi-bytes">{e.raw.map((b) => b.toString(16).padStart(2, '0')).join(' ')}</span>
                    <span className="bf-midi-decoded">{e.decoded}</span>
                  </div>
                ))
              )}
            </div>
          </section>
        </>
      )}
    </main>
  );
}

interface MappingRowProps {
  map: MidiInputMap;
  onChange: (patch: Partial<MidiInputMap>) => void;
  onRemove: () => void;
}

function MappingRow({ map, onChange, onRemove }: MappingRowProps) {
  return (
    <div className="bf-midi-map-row">
      <span className="bf-midi-kind">{map.kind}</span>
      <label className="bf-midi-field">
        ch
        <input
          type="number" min={-1} max={15}
          value={map.channel ?? -1}
          onChange={(e) => {
            const n = parseInt(e.target.value, 10);
            onChange({ channel: Number.isFinite(n) && n >= 0 && n <= 15 ? n : undefined });
          }}
          placeholder="any"
          className="bf-midi-input small"
        />
      </label>
      {map.kind === 'note' && (
        <label className="bf-midi-field">
          note
          <input
            type="number" min={-1} max={127}
            value={map.note ?? -1}
            onChange={(e) => {
              const n = parseInt(e.target.value, 10);
              onChange({ note: Number.isFinite(n) && n >= 0 && n <= 127 ? n : undefined });
            }}
            placeholder="any"
            className="bf-midi-input small"
          />
        </label>
      )}
      {map.kind === 'cc' && (
        <label className="bf-midi-field">
          cc
          <input
            type="number" min={0} max={127}
            value={map.cc}
            onChange={(e) => {
              const n = clamp(parseInt(e.target.value, 10) || 0, 0, 127);
              onChange({ cc: n });
            }}
            className="bf-midi-input small"
          />
        </label>
      )}
      <label className="bf-midi-field grow">
        →
        <input
          type="text"
          value={map.toAddress}
          onChange={(e) => onChange({ toAddress: e.target.value })}
          list="bf-midi-addresses"
          className="bf-midi-input"
        />
      </label>
      <button type="button" className="bf-chip sm ghost" onClick={onRemove}>×</button>

      <datalist id="bf-midi-addresses">
        {COMMON_ADDRESSES.map((a) => <option key={a} value={a} />)}
      </datalist>
    </div>
  );
}

function decodeMidi(data: number[]): string {
  if (data.length < 1) return '';
  const status = data[0];
  const high = status & 0xf0;
  const ch = status & 0x0f;
  const b1 = data[1] ?? 0;
  const b2 = data[2] ?? 0;
  if (high === 0x80) return `note off  ch${ch} n${b1}`;
  if (high === 0x90) return b2 === 0 ? `note off  ch${ch} n${b1}` : `note on   ch${ch} n${b1} v${b2}`;
  if (high === 0xb0) return `cc        ch${ch} #${b1}=${b2}`;
  if (high === 0xe0) return `pitch     ch${ch} ${(b2 << 7) | b1}`;
  if (high === 0xc0) return `program   ch${ch} ${b1}`;
  if (high === 0xd0) return `aftertouch ch${ch} ${b1}`;
  if (status === 0xf8) return 'clock';
  if (status === 0xfa) return 'start';
  if (status === 0xfb) return 'continue';
  if (status === 0xfc) return 'stop';
  return `0x${status.toString(16)}`;
}

function clamp(n: number, lo: number, hi: number): number {
  return Math.max(lo, Math.min(hi, n));
}
