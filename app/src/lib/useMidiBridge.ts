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
  attachMidiSink,
  makeMidiModule,
  type ChannelOutConfig,
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
  const [activeInputIds, setActiveInputIds] = useState<Set<string>>(() => new Set());

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
    } catch (e) {
      setEnableError(e instanceof Error ? e.message : String(e));
    }
  }, [midi]);

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

  return {
    midi, access, enable, enableError,
    inputs, outputs,
    channelOuts, setChannelOuts,
    inputMappings, setInputMappings,
    activeInputIds, setActiveInputIds,
    subscribeSent,
  };
}
