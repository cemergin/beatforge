// Secret MIDI tab — reachable via ?tab=_midi from any build. The nav
// chip is hidden in the UI; the tab is for users who know the URL
// (originally dev-only, ungated 2026-04-28 so power users can use it).
//
// Three jobs:
//   1. Enable Web MIDI (delegates to the bridge) + list inputs/outputs
//      so the user can confirm their hardware is detected.
//   2. Edit the input mapping table (CC / note → bus address) and the
//      per-channel MIDI-out routing (audio channel → output device +
//      MIDI channel + note + velocity). Both persist to localStorage.
//   3. Live monitor — show every raw MIDI message coming in (and
//      anything we send via the test buttons or the sequencer sink
//      going out) so the user can verify the channel/CC numbers their
//      controller emits.
//
// State + lifecycle live in `useMidiBridge` at ModeShell. This page
// is just the control panel.

import { useCallback, useEffect, useRef, useState } from 'react';
import { useT } from '../../i18n';
import type { Channel } from '../../patterns/types-sound';
import {
  type ChannelOutConfig,
  type MidiInputMap,
  type MidiOutputLike,
} from '../../modules/midi';
import type { MidiBridge } from '../../lib/useMidiBridge';
import { NumberInput } from '../../components/NumberInput';

interface Props {
  bridge: MidiBridge;
  /** Engine channels for the per-channel-out UI labels. */
  channels: readonly Channel[];
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
  'master.gain.value',
  'master.dry.value',
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

export function Midi({ bridge, channels }: Props) {
  const t = useT();
  const {
    access, enable, enableError,
    inputs, outputs,
    channelOuts, updateChannelOut,
    inputMappings, setInputMappings,
    activeInputIds, setActiveInputIds,
    subscribeSent,
    clockListenEnabled, setClockListenEnabled,
    clockSendEnabled, setClockSendEnabled,
    clockSendOutputId, setClockSendOutputId,
    resetSettings,
  } = bridge;

  const onResetClick = useCallback(() => {
    if (window.confirm(t('midi.reset_confirm'))) {
      resetSettings();
    }
  }, [resetSettings, t]);

  const [log, setLog] = useState<LogEntry[]>([]);
  const logIdRef = useRef(0);
  // When paused, drop incoming messages from the visible log so the
  // user can freeze + inspect what's already captured. Existing entries
  // stay; resume keeps capturing fresh ones (no replay buffer).
  const [paused, setPaused] = useState(false);
  const pausedRef = useRef(paused);
  useEffect(() => { pausedRef.current = paused; }, [paused]);

  // Test-send form state.
  const [testOutputId, setTestOutputId] = useState<string>('');
  const [sendChannel, setSendChannel] = useState(0);
  const [sendNote, setSendNote] = useState(36);
  const [sendVel, setSendVel] = useState(99);
  const [sendCc, setSendCc] = useState(74);
  const [sendCcVal, setSendCcVal] = useState(64);

  const pushLog = useCallback((entry: Omit<LogEntry, 'id'>) => {
    if (pausedRef.current) return;
    setLog((prev) => {
      const next: LogEntry = { ...entry, id: ++logIdRef.current };
      const out = prev.length >= MAX_LOG ? prev.slice(prev.length - MAX_LOG + 1) : prev;
      return [...out, next];
    });
  }, []);

  // Raw monitor — attaches a 'midimessage' listener to every active
  // input, in addition to the bridge's mapping bridge. Tab-local: the
  // monitor only runs while the MIDI tab is mounted, but the mapping
  // bridge itself survives tab switches.
  useEffect(() => {
    if (!access) return;
    const offs: Array<() => void> = [];
    for (const input of inputs) {
      if (!activeInputIds.has(input.id)) continue;
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
    }
    return () => { for (const off of offs) off(); };
  }, [access, inputs, activeInputIds, pushLog]);

  // Subscribe to outgoing messages emitted by the sequencer sink so
  // the monitor shows out-traffic alongside in-traffic.
  useEffect(() => {
    return subscribeSent((entry) => {
      const out = outputs.find((o) => o.id === entry.outputId);
      pushLog({
        ts: performance.now(),
        dir: 'out',
        source: out?.name ?? entry.outputId,
        raw: entry.data,
        decoded: decodeMidi(entry.data),
      });
    });
  }, [subscribeSent, outputs, pushLog]);

  // Mapping editor mutations.
  const addMapping = useCallback((kind: 'note' | 'cc') => {
    const next: MidiInputMap[] = inputMappings.concat(
      kind === 'note'
        ? { kind: 'note', toAddress: 'channel.0' }
        : { kind: 'cc', cc: 74, toAddress: 'channel.0.color.cutoff', scale: 'linear' },
    );
    setInputMappings(next);
  }, [inputMappings, setInputMappings]);

  const updateMapping = useCallback((idx: number, patch: Partial<MidiInputMap>) => {
    const next = inputMappings.map((m, i) => (i === idx ? { ...m, ...patch } as MidiInputMap : m));
    setInputMappings(next);
  }, [inputMappings, setInputMappings]);

  const removeMapping = useCallback((idx: number) => {
    setInputMappings(inputMappings.filter((_, i) => i !== idx));
  }, [inputMappings, setInputMappings]);

  /** Fire one note-on / note-off pair to the row's configured output
   *  using the row's MIDI channel + note + velocityScale, so the user
   *  can verify wiring without playing a full pattern. Velocity baseline
   *  is 99 (a normal hit) scaled by the row's velocityScale fraction.
   *
   *  Pending note-off timers are tracked + cleared on unmount so a fast
   *  tab switch doesn't leave a stuck note. (Hardware ignores a stale
   *  note-off; the cleanup is mostly hygiene.) */
  const pendingNoteOffsRef = useRef(new Set<ReturnType<typeof setTimeout>>());
  useEffect(() => {
    const pending = pendingNoteOffsRef.current;
    return () => {
      for (const id of pending) clearTimeout(id);
      pending.clear();
    };
  }, []);
  const testChannelOut = useCallback((idx: number) => {
    const cfg = channelOuts[idx];
    if (!cfg || !cfg.outputId) return;
    const out = outputs.find((o) => o.id === cfg.outputId);
    if (!out) return;
    const velByte = Math.max(1, Math.min(127, Math.round(99 * cfg.velocityScale)));
    const status = 0x90 | (cfg.midiChannel & 0x0f);
    const onData = [status, cfg.note & 0x7f, velByte];
    out.send(onData);
    pushLog({ ts: performance.now(), dir: 'out', source: out.name ?? out.id, raw: onData, decoded: decodeMidi(onData) });
    const offData = [0x80 | (cfg.midiChannel & 0x0f), cfg.note & 0x7f, 0];
    const id = setTimeout(() => {
      pendingNoteOffsRef.current.delete(id);
      out.send(offData);
      pushLog({ ts: performance.now(), dir: 'out', source: out.name ?? out.id, raw: offData, decoded: decodeMidi(offData) });
    }, 150);
    pendingNoteOffsRef.current.add(id);
  }, [channelOuts, outputs, pushLog]);

  const clearLog = useCallback(() => setLog([]), []);

  const findOutput = useCallback((): MidiOutputLike | null => {
    if (!testOutputId) return null;
    return outputs.find((o) => o.id === testOutputId) ?? null;
  }, [testOutputId, outputs]);

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
    const next = new Set(activeInputIds);
    if (next.has(id)) next.delete(id); else next.add(id);
    setActiveInputIds(next);
  }, [activeInputIds, setActiveInputIds]);

  return (
    <main className="bf-midi-page">
      <header className="bf-lib-hero">
        <div>
          <h1 className="bf-lib-title">{t('midi.title')} <span className="bf-midi-badge">{t('midi.hidden_badge')}</span></h1>
          <p className="bf-lib-sub">
            {t('midi.description')}
          </p>
          <div className="bf-lib-hero-actions">
            {!access
              ? <button className="bf-chip on" onClick={() => { void enable(); }} type="button">{t('midi.enable_button')}</button>
              : <span className="bf-midi-status">{t('midi.status', { inputs: inputs.length, outputs: outputs.length })}</span>}
            <button
              className="bf-chip ghost sm"
              type="button"
              onClick={onResetClick}
              title={t('midi.reset_title')}
            >
              {t('midi.reset_settings')}
            </button>
          </div>
          {enableError && <div className="bf-midi-error">{enableError}</div>}
        </div>
      </header>

      {access && (
        <>
          <section className="bf-lib-zone">
            <div className="bf-zone-head">
              <h2 className="bf-zone-title">{t('midi.inputs_title')}</h2>
              <span className="bf-zone-sub">{t('midi.inputs_sub')}</span>
            </div>
            {inputs.length === 0 ? (
              <div className="bf-lib-empty">{t('midi.no_inputs')}</div>
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
              <h2 className="bf-zone-title">{t('midi.mappings_title')}</h2>
              <span className="bf-zone-sub">{t('midi.mappings_sub')}</span>
            </div>
            <div className="bf-midi-maps">
              {inputMappings.map((m, idx) => (
                <MappingRow
                  key={idx}
                  map={m}
                  onChange={(patch) => updateMapping(idx, patch)}
                  onRemove={() => removeMapping(idx)}
                />
              ))}
              <div className="bf-chip-row">
                <button className="bf-chip sm ghost" type="button" onClick={() => addMapping('note')}>{t('midi.add_note')}</button>
                <button className="bf-chip sm ghost" type="button" onClick={() => addMapping('cc')}>{t('midi.add_cc')}</button>
                {inputMappings.length > 0 && (
                  <button className="bf-chip sm ghost" type="button" onClick={() => setInputMappings([])}>{t('midi.clear_all')}</button>
                )}
              </div>
            </div>
          </section>

          <section className="bf-lib-zone">
            <div className="bf-zone-head">
              <h2 className="bf-zone-title">{t('midi.channel_out_title')}</h2>
              <span className="bf-zone-sub">{t('midi.channel_out_sub')}</span>
            </div>
            <div className="bf-midi-maps">
              {channelOuts.map((cfg, idx) => (
                <ChannelOutRow
                  key={idx}
                  idx={idx}
                  label={channels[idx]?.label ?? `ch${idx + 1}`}
                  cfg={cfg}
                  outputs={outputs}
                  onChange={(patch) => updateChannelOut(idx, patch)}
                  onTest={() => testChannelOut(idx)}
                />
              ))}
            </div>
          </section>

          <section className="bf-lib-zone">
            <div className="bf-zone-head">
              <h2 className="bf-zone-title">{t('midi.clock_title')}</h2>
              <span className="bf-zone-sub">{t('midi.clock_sub')}</span>
            </div>
            <div className="bf-midi-maps">
              <div className="bf-midi-map-row">
                <span className="bf-midi-kind">in</span>
                <label className="bf-midi-field">
                  <input
                    type="checkbox"
                    checked={clockListenEnabled}
                    onChange={(e) => setClockListenEnabled(e.target.checked)}
                  />
                  {t('midi.clock_listen')}
                </label>
              </div>
              <div className="bf-midi-map-row">
                <span className="bf-midi-kind">out</span>
                <label className="bf-midi-field">
                  <input
                    type="checkbox"
                    checked={clockSendEnabled}
                    onChange={(e) => setClockSendEnabled(e.target.checked)}
                  />
                  {t('midi.clock_send')}
                </label>
                <label className="bf-midi-field grow">
                  {t('midi.clock_to')}
                  <select
                    value={clockSendOutputId}
                    onChange={(e) => setClockSendOutputId(e.target.value)}
                    className="bf-midi-input"
                  >
                    <option value="">{t('midi.none_option')}</option>
                    {outputs.map((o) => (
                      <option key={o.id} value={o.id}>{o.name ?? o.id}</option>
                    ))}
                  </select>
                </label>
              </div>
            </div>
          </section>

          <section className="bf-lib-zone">
            <div className="bf-zone-head">
              <h2 className="bf-zone-title">{t('midi.test_send_title')}</h2>
              <span className="bf-zone-sub">{t('midi.test_send_sub')}</span>
            </div>
            <div className="bf-midi-send">
              <select
                className="bf-midi-input"
                value={testOutputId}
                onChange={(e) => setTestOutputId(e.target.value)}
              >
                <option value="">{t('midi.select_output')}</option>
                {outputs.map((o) => (
                  <option key={o.id} value={o.id}>{o.name ?? o.id}</option>
                ))}
              </select>
              <label className="bf-midi-field">
                {t('midi.test_ch')}
                <NumberInput min={0} max={15} value={sendChannel} onChange={setSendChannel}
                  className="bf-midi-input small" />
              </label>
              <label className="bf-midi-field">
                {t('midi.test_note')}
                <NumberInput min={0} max={127} value={sendNote} onChange={setSendNote}
                  className="bf-midi-input small" />
              </label>
              <span className="bf-midi-noteName">{noteName(sendNote)}</span>
              <label className="bf-midi-field">
                {t('midi.test_vel')}
                <NumberInput min={0} max={127} value={sendVel} onChange={setSendVel}
                  className="bf-midi-input small" />
              </label>
              <button type="button" className="bf-chip sm" onClick={sendNoteOn} disabled={!testOutputId}>{t('midi.test_note_on')}</button>
              <button type="button" className="bf-chip sm" onClick={sendNoteOff} disabled={!testOutputId}>{t('midi.test_note_off')}</button>
              <label className="bf-midi-field">
                {t('midi.test_cc')}
                <NumberInput min={0} max={127} value={sendCc} onChange={setSendCc}
                  className="bf-midi-input small" />
              </label>
              <label className="bf-midi-field">
                {t('midi.test_value')}
                <NumberInput min={0} max={127} value={sendCcVal} onChange={setSendCcVal}
                  className="bf-midi-input small" />
              </label>
              <button type="button" className="bf-chip sm" onClick={sendCcMsg} disabled={!testOutputId}>{t('midi.test_cc_button')}</button>
            </div>
          </section>

          <section className="bf-lib-zone">
            <div className="bf-zone-head">
              <h2 className="bf-zone-title">{t('midi.monitor_title')}</h2>
              <span className="bf-zone-sub">
                {t('midi.monitor_info', { n: log.length, max: MAX_LOG })}
                <button
                  className="bf-linkbtn"
                  type="button"
                  onClick={() => setPaused((p) => !p)}
                  title={paused ? t('midi.resume_title') : t('midi.pause_title')}
                >
                  {paused ? ` ${t('midi.resume_button')}` : ` ${t('midi.pause_button')}`}
                </button>
                <button className="bf-linkbtn" type="button" onClick={clearLog}> {t('midi.clear_button')}</button>
              </span>
            </div>
            <div className="bf-midi-log">
              {log.length === 0 ? (
                <div className="bf-lib-empty">{t('midi.no_traffic')}</div>
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
  const t = useT();
  return (
    <div className="bf-midi-map-row">
      <span className="bf-midi-kind">{map.kind}</span>
      <label className="bf-midi-field">
        {t('midi.map_ch')}
        <NumberInput
          min={-1} max={15}
          value={map.channel ?? -1}
          onChange={(n) => onChange({ channel: n >= 0 && n <= 15 ? n : undefined })}
          className="bf-midi-input small"
        />
      </label>
      {map.kind === 'note' && (
        <label className="bf-midi-field">
          {t('midi.map_note')}
          <NumberInput
            min={-1} max={127}
            value={map.note ?? -1}
            onChange={(n) => onChange({ note: n >= 0 && n <= 127 ? n : undefined })}
            className="bf-midi-input small"
          />
        </label>
      )}
      {map.kind === 'cc' && (
        <label className="bf-midi-field">
          {t('midi.map_cc')}
          <NumberInput
            min={0} max={127}
            value={map.cc}
            onChange={(n) => onChange({ cc: n })}
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
      <button type="button" className="bf-chip sm ghost" onClick={onRemove}>{t('midi.map_remove')}</button>

      <datalist id="bf-midi-addresses">
        {COMMON_ADDRESSES.map((a) => <option key={a} value={a} />)}
      </datalist>
    </div>
  );
}

interface ChannelOutRowProps {
  idx: number;
  label: string;
  cfg: ChannelOutConfig;
  outputs: MidiOutputLike[];
  onChange: (patch: Partial<ChannelOutConfig>) => void;
  onTest: () => void;
}

function ChannelOutRow({ idx, label, cfg, outputs, onChange, onTest }: ChannelOutRowProps) {
  const t = useT();
  const canTest = cfg.outputId !== null;
  return (
    <div className="bf-midi-map-row">
      <span className="bf-midi-kind">ch{idx + 1}</span>
      <span className="bf-midi-channel-label">{label}</span>
      <label className="bf-midi-field">
        <input
          type="checkbox"
          checked={cfg.enabled}
          onChange={(e) => onChange({ enabled: e.target.checked })}
        />
        {t('midi.channel_enable')}
      </label>
      <label className="bf-midi-field grow">
        {t('midi.channel_out_label')}
        <select
          value={cfg.outputId ?? ''}
          onChange={(e) => onChange({ outputId: e.target.value === '' ? null : e.target.value })}
          className="bf-midi-input"
        >
          <option value="">{t('midi.none_option')}</option>
          {outputs.map((o) => (
            <option key={o.id} value={o.id}>{o.name ?? o.id}</option>
          ))}
        </select>
      </label>
      <label className="bf-midi-field">
        {t('midi.channel_midi_ch')}
        <NumberInput
          min={1} max={16}
          value={cfg.midiChannel + 1}
          onChange={(n) => onChange({ midiChannel: n - 1 })}
          className="bf-midi-input small"
        />
      </label>
      <label className="bf-midi-field">
        {t('midi.channel_note')}
        <NumberInput
          min={0} max={127}
          value={cfg.note}
          onChange={(n) => onChange({ note: n })}
          className="bf-midi-input small"
        />
      </label>
      <span className="bf-midi-noteName">{noteName(cfg.note)}</span>
      <label className="bf-midi-field">
        {t('midi.channel_vel')}
        <NumberInput
          min={0} max={1} step={0.05} decimals={2}
          value={cfg.velocityScale}
          onChange={(n) => onChange({ velocityScale: n })}
          className="bf-midi-input small"
        />
      </label>
      <button
        type="button"
        className="bf-chip sm"
        onClick={onTest}
        disabled={!canTest}
        title={canTest ? t('midi.channel_test_title') : t('midi.channel_test_disabled')}
      >
        {t('midi.channel_test')}
      </button>
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
  if (high === 0x80) return `note off  ch${ch} ${noteName(b1)} (${b1})`;
  if (high === 0x90) return b2 === 0
    ? `note off  ch${ch} ${noteName(b1)} (${b1})`
    : `note on   ch${ch} ${noteName(b1)} (${b1}) v${b2}`;
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

const NOTE_NAMES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];

/** MIDI 60 = C4 (Yamaha / Roland convention). Some ecosystems use
 *  C3 = 60; we pick the common one and document it. */
function noteName(n: number): string {
  if (n < 0 || n > 127) return '';
  const name = NOTE_NAMES[n % 12];
  const octave = Math.floor(n / 12) - 1;
  return `${name}${octave}`;
}

