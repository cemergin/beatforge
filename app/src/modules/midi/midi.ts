// MIDI module implementation. Translates Web MIDI messages to bus
// events using user-supplied mapping tables. Pure-JS — no Web Audio
// dependency. Web MIDI is requested only via enable(); attach() lets
// tests / apps inject a stub MIDIAccess.

import type { EventBus } from '../events';
import type {
  BindInputOptions,
  MidiAccessLike,
  MidiInputLike,
  MidiInputMap,
  MidiModule,
  MidiOutputLike,
} from './types';

/** Decode a Web MIDI status byte into kind + channel. Status bytes
 *  carry the kind in the high nibble (0x80 = note-off, 0x90 =
 *  note-on, 0xB0 = CC, 0xE0 = pitch bend) and the MIDI channel
 *  (0..15) in the low nibble. */
function decodeStatus(status: number): { kind: 'note-on' | 'note-off' | 'cc' | 'pitch-bend' | null; channel: number } {
  const high = status & 0xf0;
  const channel = status & 0x0f;
  if (high === 0x80) return { kind: 'note-off', channel };
  if (high === 0x90) return { kind: 'note-on',  channel };
  if (high === 0xb0) return { kind: 'cc',       channel };
  if (high === 0xe0) return { kind: 'pitch-bend', channel };
  return { kind: null, channel };
}

/** Note-off can come as 0x80 OR as 0x90 with velocity 0 (running-status
 *  optimization). Velocity 0 always means off regardless of status. */
function isReleaseEvent(kind: 'note-on' | 'note-off', velocity: number): boolean {
  return kind === 'note-off' || velocity === 0;
}

/** Map a 0..127 CC byte through a scale spec to a final number. */
function applyScale(byte: number, scale: NonNullable<Extract<MidiInputMap, { kind: 'cc' }>['scale']>): number {
  const norm = byte / 127;
  if (scale === 'linear') return norm;
  const { min, max, curve = 'lin' } = scale;
  if (curve === 'exp') {
    // Exponential mapping for Hz-like params: 200 → 12000 across 0..1
    // hits ~5500 at norm=0.71. Standard log-domain lerp.
    return min * Math.pow(max / Math.max(1e-6, min), norm);
  }
  return min + norm * (max - min);
}

export function makeMidiModule(bus: EventBus): MidiModule {
  let access: MidiAccessLike | null = null;

  const enable = async (): Promise<MidiAccessLike> => {
    // The Web MIDI API is only available in browsers + some embeds.
    // navigator.requestMIDIAccess returns a Promise<MIDIAccess>.
    const navAny = (typeof navigator !== 'undefined' ? navigator : null) as
      | (Navigator & { requestMIDIAccess?: () => Promise<MidiAccessLike> })
      | null;
    if (!navAny || !navAny.requestMIDIAccess) {
      throw new Error('Web MIDI API not available');
    }
    const a = await navAny.requestMIDIAccess();
    access = a;
    return a;
  };

  const attach = (a: MidiAccessLike): void => {
    access = a;
  };

  const inputs = (): MidiInputLike[] => {
    if (!access) return [];
    return [...access.inputs.values()];
  };

  const outputs = (): MidiOutputLike[] => {
    if (!access) return [];
    return [...access.outputs.values()];
  };

  const bindInput = (
    input: MidiInputLike,
    mappings: readonly MidiInputMap[],
    opts: BindInputOptions = {},
  ): (() => void) => {
    const { clock } = opts;
    const handler = (event: { data: Uint8Array }): void => {
      const data = event.data;
      if (!data || data.length < 2) return;
      const status = data[0];
      const byte1 = data[1];
      const byte2 = data.length > 2 ? data[2] : 0;
      const { kind, channel } = decodeStatus(status);
      if (!kind) return;

      // Walk the mappings; first match wins per kind. We allow
      // multiple mappings for the same physical control as long as
      // they target different addresses — the user might want one
      // CC to drive both reverb and a visualizer marker.
      for (const map of mappings) {
        if (map.kind === 'note' && (kind === 'note-on' || kind === 'note-off')) {
          if (map.channel !== undefined && map.channel !== channel) continue;
          if (map.note !== undefined && map.note !== byte1) continue;
          if (isReleaseEvent(kind, byte2)) {
            bus.emit({
              type: 'release',
              target: map.toAddress,
              when: clock?.() ?? 0,
            });
          } else {
            // Velocity normalize to 0..1.
            bus.emit({
              type: 'trigger',
              target: map.toAddress,
              velocity: byte2 / 127,
              when: clock?.() ?? 0,
            });
          }
        } else if (map.kind === 'cc' && kind === 'cc') {
          if (map.channel !== undefined && map.channel !== channel) continue;
          if (map.cc !== byte1) continue;
          const scale = map.scale ?? 'linear';
          const value = applyScale(byte2, scale);
          bus.emit({
            type: 'param',
            target: map.toAddress,
            value,
            ramp: map.ramp,
            when: clock?.(),
          });
        }
      }
    };
    input.addEventListener('midimessage', handler);
    return () => input.removeEventListener('midimessage', handler);
  };

  return { enable, attach, inputs, outputs, bindInput };
}
