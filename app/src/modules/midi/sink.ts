// MIDI out sink. Subscribes to TriggerEvents on the bus and emits
// MIDI note-on / note-off bytes to user-chosen output devices on
// user-chosen channels.
//
// Design notes:
//   - Address shape `channel.<n>` — only top-level channel triggers
//     are routed. Sub-addresses (e.g. `channel.0.color.cutoff`) stay
//     ParamEvents and don't reach the sink.
//   - Each app channel (0..N-1) has its own routing config: which
//     output device, which MIDI channel, which note number, velocity
//     scale, enabled flag.
//   - Note duration locks to the pattern's smallest step (one step
//     length). The caller passes a getStepDurationMs() so the sink
//     stays decoupled from session/engine details. setTimeout is
//     used for note-off because Web MIDI's `send(data, timestamp)`
//     queues at sample-precise times only inside MIDIOutput, and
//     ~1ms jitter is fine for drum-style notes.

import type { EventBus, TriggerEvent, Unsubscribe } from '../events';
import type { MidiOutputLike } from './types';
import { logWarn } from '../../lib/log';

export interface ChannelOutConfig {
  enabled: boolean;
  /** Output id from MIDIAccess.outputs. Empty string = unset. */
  outputId: string;
  /** 0..15 (the on-the-wire channel; UI shows 1..16). */
  midiChannel: number;
  /** 0..127. */
  note: number;
  /** Multiplier on TriggerEvent.velocity (0..1) before it becomes
   *  a 0..127 byte. Lets the user scale down hot inputs. */
  velocityScale: number;
}

export const DEFAULT_CHANNEL_OUT: ChannelOutConfig = {
  enabled: false,
  outputId: '',
  midiChannel: 0,
  note: 36,
  velocityScale: 1,
};

export interface SinkSpec {
  /** Live config — read fresh on every trigger so UI changes apply
   *  immediately without re-attaching the sink. */
  getConfigs: () => readonly ChannelOutConfig[];
  /** Lookup the live MidiOutputLike by id. The sink doesn't cache
   *  the reference because devices can be hot-unplugged; if the
   *  callback returns null the trigger is silently dropped. */
  resolveOutput: (id: string) => MidiOutputLike | null;
  /** Step length in ms at the moment the trigger fires. Used to
   *  schedule note-off. Reading this lazily means BPM changes mid-
   *  playback take effect on the next trigger, not after re-attach. */
  getStepDurationMs: () => number;
  /** Optional logger — fires once per outgoing message so the secret
   *  MIDI tab's monitor can show outbound traffic next to inbound. */
  onSent?: (entry: { outputId: string; data: number[] }) => void;
}

/** Attach the sink to the bus. Returns an unsubscribe that detaches
 *  the listener AND cancels any in-flight note-off timers (so a
 *  Practice→Library tab switch doesn't leave dangling notes-on on
 *  the remote synth). */
export function attachMidiSink(bus: EventBus, spec: SinkSpec): Unsubscribe {
  const pendingTimers = new Set<ReturnType<typeof setTimeout>>();

  const onTrigger = (event: TriggerEvent): void => {
    const idx = parseChannelIndex(event.target);
    if (idx === null) return;

    const cfg = spec.getConfigs()[idx];
    if (!cfg || !cfg.enabled || !cfg.outputId) return;

    const out = spec.resolveOutput(cfg.outputId);
    if (!out) return;

    const velByte = clamp(Math.round((event.velocity ?? 1) * cfg.velocityScale * 127), 1, 127);
    const status = 0x90 | (cfg.midiChannel & 0x0f);
    const onData = [status, cfg.note & 0x7f, velByte];
    if (!safeSend(out, onData, cfg.outputId)) return;
    spec.onSent?.({ outputId: cfg.outputId, data: onData });

    const offData = [0x80 | (cfg.midiChannel & 0x0f), cfg.note & 0x7f, 0];
    const dur = Math.max(10, spec.getStepDurationMs());
    const timer = setTimeout(() => {
      pendingTimers.delete(timer);
      const stillThere = spec.resolveOutput(cfg.outputId);
      if (!stillThere) return;
      if (!safeSend(stillThere, offData, cfg.outputId)) return;
      spec.onSent?.({ outputId: cfg.outputId, data: offData });
    }, dur);
    pendingTimers.add(timer);
  };

  const off = bus.on('trigger', onTrigger);
  return () => {
    off();
    for (const t of pendingTimers) clearTimeout(t);
    pendingTimers.clear();
  };
}

/** Parse `channel.<n>` and `channel.<n>.<rest>` to extract the
 *  channel index. Returns null for non-channel addresses (master,
 *  arbitrary). The sink only fires on top-level channel triggers
 *  so sub-targets like `channel.0.color.cutoff` (which arrive as
 *  ParamEvents anyway, not triggers) don't accidentally match. */
function parseChannelIndex(target: string): number | null {
  if (!target.startsWith('channel.')) return null;
  const rest = target.slice('channel.'.length);
  const dot = rest.indexOf('.');
  const head = dot >= 0 ? rest.slice(0, dot) : rest;
  // Trigger sink only handles the bare `channel.<n>` form.
  if (dot >= 0) return null;
  const n = parseInt(head, 10);
  return Number.isFinite(n) && n >= 0 ? n : null;
}

function clamp(n: number, lo: number, hi: number): number {
  return Math.max(lo, Math.min(hi, n));
}

/** Wrap output.send() so a hot-unplugged device (Web MIDI throws
 *  InvalidStateError synchronously) doesn't unwind the bus listener
 *  chain and break every downstream subscriber. Returns true on
 *  success, false on a swallowed error. The user gets a single warn
 *  in the toast layer; subsequent triggers to the same output keep
 *  retrying — if it was a one-off blip the next message succeeds. */
function safeSend(out: MidiOutputLike, data: number[], outputId: string): boolean {
  try {
    out.send(data);
    return true;
  } catch (err) {
    logWarn(`MIDI send failed (output ${outputId} disconnected?) — ${err instanceof Error ? err.message : String(err)}`);
    return false;
  }
}
