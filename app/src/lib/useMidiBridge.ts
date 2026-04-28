// MIDI bridge — single React-side owner for everything MIDI-related
// in the running app. Lives at ModeShell so the bridge survives tab
// switches: a controller's CC mapping keeps driving audio while the
// user is in Practice; the sequencer's MIDI-out keeps flowing while
// they're editing in Studio. The secret MIDI tab is a UI on top of
// this bridge — it doesn't OWN the access, it just renders + edits
// the configs the bridge holds.

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { SoundEngine } from '../audio/runtime/sound-engine';
import {
  attachClockListener,
  attachMidiSink,
  makeClockSender,
  makeMidiModule,
  type ChannelOutConfig,
  type ClockSenderHandle,
  type MidiAccessLike,
  type MidiInputLike,
  type MidiInputMap,
  type MidiModule,
  type MidiOutputLike,
} from '../modules/midi';
import { useSession } from '../modules/session';
import { loadChannelOuts, saveChannelOuts } from './midiChannelOut';
import { loadMidiMappings, saveMidiMappings } from './midiMappings';

export interface SentLogEntry {
  outputId: string;
  data: number[];
}

export type SentListener = (entry: SentLogEntry) => void;

export interface MidiBridge {
  midi: MidiModule;
  access: MidiAccessLike | null;
  enable: () => Promise<void>;
  enableError: string | null;

  inputs: MidiInputLike[];
  outputs: MidiOutputLike[];

  /** Per-channel out routing (length matches engine channel count). */
  channelOuts: ChannelOutConfig[];
  setChannelOuts: (next: ChannelOutConfig[]) => void;

  inputMappings: MidiInputMap[];
  setInputMappings: (next: MidiInputMap[]) => void;

  activeInputIds: Set<string>;
  setActiveInputIds: (next: Set<string>) => void;

  /** Subscribe to outgoing sink emissions so the MIDI tab's monitor
   *  can show outbound traffic. Returns an unsubscribe. */
  subscribeSent: (fn: SentListener) => () => void;

  /** Wipe every persisted MIDI setting (mappings, channel-out routing,
   *  clock toggles, active inputs, auto-enable flag) and reset the
   *  in-memory bridge state. The Web MIDI access itself is left
   *  alone — the browser's permission grant survives the reset, so
   *  the next enable() call still skips the prompt. */
  resetSettings: () => void;

  // ── Clock I/O ───────────────────────────────────────────────────
  /** Listen-in toggle. Off by default — we don't want to silently
   *  override the user's BPM when a controller happens to be sending
   *  clock. The listener input is the FIRST active monitored input;
   *  swap it by toggling inputs in the Inputs section. */
  clockListenEnabled: boolean;
  setClockListenEnabled: (b: boolean) => void;

  /** Send-out toggle + chosen output. Off by default. */
  clockSendEnabled: boolean;
  setClockSendEnabled: (b: boolean) => void;
  clockSendOutputId: string;
  setClockSendOutputId: (id: string) => void;
}

export function useMidiBridge(engine: SoundEngine, channelCount: number): MidiBridge {
  const session = useSession();

  const midi = useMemo<MidiModule>(() => makeMidiModule(engine.getEventBus()), [engine]);

  const [access, setAccess] = useState<MidiAccessLike | null>(null);
  const [enableError, setEnableError] = useState<string | null>(null);
  const [inputs, setInputs] = useState<MidiInputLike[]>([]);
  const [outputs, setOutputs] = useState<MidiOutputLike[]>([]);

  const [channelOuts, setChannelOuts] = useState<ChannelOutConfig[]>(
    () => loadChannelOuts(channelCount),
  );
  const [inputMappings, setInputMappings] = useState<MidiInputMap[]>(() => loadMidiMappings());
  const [activeInputIds, setActiveInputIds] = useState<Set<string>>(
    () => new Set(loadStringArray('bf_midi_active_inputs')),
  );

  // Clock toggles — off by default on first run. Once a user has
  // enabled them, the choice sticks across reloads so a long
  // session-or-restart doesn't drop the rig out of sync.
  const [clockListenEnabled, setClockListenEnabled] = useState(
    () => readBool('bf_midi_clock_listen', false),
  );
  const [clockSendEnabled, setClockSendEnabled] = useState(
    () => readBool('bf_midi_clock_send', false),
  );
  const [clockSendOutputId, setClockSendOutputId] = useState(
    () => readString('bf_midi_clock_out', ''),
  );

  useEffect(() => { writeBool('bf_midi_clock_listen', clockListenEnabled); }, [clockListenEnabled]);
  useEffect(() => { writeBool('bf_midi_clock_send', clockSendEnabled); }, [clockSendEnabled]);
  useEffect(() => { writeString('bf_midi_clock_out', clockSendOutputId); }, [clockSendOutputId]);
  useEffect(() => { writeStringArray('bf_midi_active_inputs', [...activeInputIds]); }, [activeInputIds]);

  // Persist mutations.
  useEffect(() => { saveChannelOuts(channelOuts); }, [channelOuts]);
  useEffect(() => { saveMidiMappings(inputMappings); }, [inputMappings]);

  // Grow / trim the channel-out config when the engine's channel
  // count changes (e.g. a saved pattern with a different layout).
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- legitimate sync to channelCount prop change.
    setChannelOuts((prev) => {
      if (prev.length === channelCount) return prev;
      const next = prev.slice(0, channelCount);
      while (next.length < channelCount) {
        next.push({ enabled: false, outputId: '', midiChannel: 0, note: 36, velocityScale: 1 });
      }
      return next;
    });
  }, [channelCount]);

  const enable = useCallback(async () => {
    setEnableError(null);
    try {
      const a = await midi.enable();
      midi.attach(a);
      setAccess(a);
      setInputs(midi.inputs());
      setOutputs(midi.outputs());
      // Sticky flag — once the user has enabled MIDI in this browser,
      // re-acquire access automatically on subsequent loads. The
      // browser's permission grant + this flag together let us skip
      // the manual button click for return visits.
      try { localStorage.setItem('bf_midi_auto_enable', '1'); } catch { /* ignore */ }
    } catch (e) {
      setEnableError(e instanceof Error ? e.message : String(e));
    }
  }, [midi]);

  // Auto-enable on mount if the user has previously enabled MIDI.
  // We only attempt this once per bridge instance to avoid retry
  // storms when the browser revokes permission. If auto-enable fails
  // silently, the user can still click the manual button.
  const autoEnableTriedRef = useRef(false);
  useEffect(() => {
    if (autoEnableTriedRef.current) return;
    autoEnableTriedRef.current = true;
    let prev: string | null = null;
    try { prev = localStorage.getItem('bf_midi_auto_enable'); } catch { /* ignore */ }
    if (prev !== '1') return;
    void enable();
  }, [enable]);

  // Refs the sink reads at trigger time. Ref-then-effect-mirror
  // keeps the sink registration stable (no re-attach per knob) while
  // letting the closure see fresh state.
  const channelOutsRef = useRef(channelOuts);
  useEffect(() => { channelOutsRef.current = channelOuts; }, [channelOuts]);
  const outputsRef = useRef(outputs);
  useEffect(() => { outputsRef.current = outputs; }, [outputs]);
  const sessionRef = useRef(session);
  useEffect(() => { sessionRef.current = session; }, [session]);

  // Outgoing-message subscribers. The MIDI tab's monitor wants to
  // see every byte the sink emits; tests can also subscribe.
  const sentListenersRef = useRef<Set<SentListener>>(new Set());
  const subscribeSent = useCallback((fn: SentListener): (() => void) => {
    sentListenersRef.current.add(fn);
    return () => { sentListenersRef.current.delete(fn); };
  }, []);

  // Sink lifecycle — only attach once access is granted. The sink
  // closure reads channelOuts/outputs/session from refs so re-attach
  // isn't needed when those mutate.
  useEffect(() => {
    if (!access) return;
    const off = attachMidiSink(engine.getEventBus(), {
      getConfigs: () => channelOutsRef.current,
      resolveOutput: (id) => outputsRef.current.find((o) => o.id === id) ?? null,
      getStepDurationMs: () => {
        const s = sessionRef.current;
        const stepUnit = s.pattern.stepUnit || 16;
        const bpm = Math.max(1, s.bpm);
        // (60s/bpm) is one quarter; (4/stepUnit) scales to step length.
        return (60_000 / bpm) * (4 / stepUnit);
      },
      onSent: (entry) => {
        for (const l of sentListenersRef.current) l(entry);
      },
    });
    return off;
  }, [access, engine]);

  // Input bindings — re-attach when the user toggles inputs or edits
  // the mapping table. The MIDI tab's raw monitor lives separately
  // (it attaches its own listener while the tab is mounted).
  useEffect(() => {
    if (!access) return;
    const offs: Array<() => void> = [];
    for (const input of inputs) {
      if (!activeInputIds.has(input.id)) continue;
      offs.push(midi.bindInput(input, inputMappings));
    }
    return () => { for (const off of offs) off(); };
  }, [access, inputs, activeInputIds, inputMappings, midi]);

  // Clock LISTEN — attach to all currently active inputs. The first
  // device sending clock wins (most rigs only have one master). BPM
  // is smoothed inside the listener; transport messages route to
  // session.start / session.stop. Off by default per user request.
  const sessionStartRef = useRef(session.start);
  useEffect(() => { sessionStartRef.current = session.start; }, [session.start]);
  const sessionStopRef = useRef(session.stop);
  useEffect(() => { sessionStopRef.current = session.stop; }, [session.stop]);
  const sessionSetBpmRef = useRef(session.setBpm);
  useEffect(() => { sessionSetBpmRef.current = session.setBpm; }, [session.setBpm]);

  useEffect(() => {
    if (!access || !clockListenEnabled) return;
    const offs: Array<() => void> = [];
    for (const input of inputs) {
      if (!activeInputIds.has(input.id)) continue;
      offs.push(attachClockListener(input, {
        onBpm: (bpm) => sessionSetBpmRef.current(bpm),
        onStart: () => sessionStartRef.current(),
        onContinue: () => sessionStartRef.current(),
        onStop: () => sessionStopRef.current(),
      }));
    }
    return () => { for (const off of offs) off(); };
  }, [access, clockListenEnabled, inputs, activeInputIds]);

  // Clock SEND — drives 24 PPQN to the chosen output. Tracks
  // session.playing so 0xFA / 0xFC fire automatically when the user
  // hits play / stop in any tab; tracks session.bpm so tempo changes
  // re-arm the interval. Off by default.
  const senderRef = useRef<ClockSenderHandle | null>(null);
  useEffect(() => {
    if (!access || !clockSendEnabled || !clockSendOutputId) return;
    const out = outputs.find((o) => o.id === clockSendOutputId);
    if (!out) return;
    const handle = makeClockSender(out, session.bpm, (data) => {
      for (const l of sentListenersRef.current) l({ outputId: out.id, data });
    });
    senderRef.current = handle;
    return () => {
      handle.dispose();
      senderRef.current = null;
    };
    // outputs/session.bpm/session.playing intentionally NOT in deps —
    // we react to those via subsequent effects so the sender survives
    // tempo automation without re-allocating its interval.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [access, clockSendEnabled, clockSendOutputId]);

  // Push BPM updates to the active sender.
  useEffect(() => {
    senderRef.current?.setBpm(session.bpm);
  }, [session.bpm]);

  // Mirror session.playing → 0xFA / 0xFC.
  const wasPlayingRef = useRef(false);
  useEffect(() => {
    if (!senderRef.current) { wasPlayingRef.current = session.playing; return; }
    if (session.playing && !wasPlayingRef.current) senderRef.current.start();
    else if (!session.playing && wasPlayingRef.current) senderRef.current.stop();
    wasPlayingRef.current = session.playing;
  }, [session.playing]);

  const resetSettings = useCallback(() => {
    // Clear every key the bridge writes. We don't touch the WebMIDI
    // access — the browser's permission grant is independent of our
    // local state.
    for (const key of [
      'bf_midi_mappings_v1',
      'bf_midi_channel_out_v1',
      'bf_midi_clock_listen',
      'bf_midi_clock_send',
      'bf_midi_clock_out',
      'bf_midi_active_inputs',
      'bf_midi_auto_enable',
    ]) {
      try { localStorage.removeItem(key); } catch { /* ignore */ }
    }
    setInputMappings([]);
    setChannelOuts(loadChannelOuts(channelCount));
    setClockListenEnabled(false);
    setClockSendEnabled(false);
    setClockSendOutputId('');
    setActiveInputIds(new Set());
  }, [channelCount]);

  return {
    midi, access, enable, enableError,
    inputs, outputs,
    channelOuts, setChannelOuts,
    inputMappings, setInputMappings,
    activeInputIds, setActiveInputIds,
    subscribeSent,
    clockListenEnabled, setClockListenEnabled,
    clockSendEnabled, setClockSendEnabled,
    clockSendOutputId, setClockSendOutputId,
    resetSettings,
  };
}

// ── localStorage helpers ─────────────────────────────────────────
// Tiny shims so the bridge persists toggles + selected device ids
// across reloads without dragging in a serialization library. Each
// helper swallows storage errors silently — quota / disabled
// storage shouldn't break the MIDI tab.

function readBool(key: string, fallback: boolean): boolean {
  try { return localStorage.getItem(key) === '1'; } catch { return fallback; }
}
function writeBool(key: string, value: boolean): void {
  try { localStorage.setItem(key, value ? '1' : '0'); } catch { /* ignore */ }
}
function readString(key: string, fallback: string): string {
  try { return localStorage.getItem(key) ?? fallback; } catch { return fallback; }
}
function writeString(key: string, value: string): void {
  try { localStorage.setItem(key, value); } catch { /* ignore */ }
}
function loadStringArray(key: string): string[] {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return [];
    const parsed: unknown = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.filter((v): v is string => typeof v === 'string') : [];
  } catch { return []; }
}
function writeStringArray(key: string, value: string[]): void {
  try { localStorage.setItem(key, JSON.stringify(value)); } catch { /* ignore */ }
}
