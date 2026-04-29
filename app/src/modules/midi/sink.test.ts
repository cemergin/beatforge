// Sink tests — verify the channel→note translation, note-off scheduling,
// and config gating without going near Web MIDI.

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { makeEventBus } from '../events';
import { attachMidiSink, type ChannelOutConfig } from './sink';
import type { MidiOutputLike } from './types';

function makeOutput(id = 'mock-out'): MidiOutputLike & { sent: number[][] } {
  const sent: number[][] = [];
  return {
    id,
    name: id,
    send: (data) => { sent.push(Array.isArray(data) ? data : Array.from(data)); },
    sent,
  };
}

const cfg = (overrides: Partial<ChannelOutConfig> = {}): ChannelOutConfig => ({
  enabled: true,
  outputId: 'mock-out',
  midiChannel: 0,
  note: 36,
  velocityScale: 1,
  ...overrides,
});

describe('attachMidiSink', () => {
  beforeEach(() => { vi.useFakeTimers(); });
  afterEach(() => { vi.useRealTimers(); });

  it('emits note-on then note-off after step duration', () => {
    const bus = makeEventBus();
    const out = makeOutput();
    const off = attachMidiSink(bus, {
      getConfigs: () => [cfg()],
      resolveOutput: () => out,
      getStepDurationMs: () => 100,
    });

    bus.emit({ type: 'trigger', target: 'channel.0', velocity: 1, when: 0 });
    expect(out.sent).toEqual([[0x90, 36, 127]]);

    vi.advanceTimersByTime(100);
    expect(out.sent).toEqual([[0x90, 36, 127], [0x80, 36, 0]]);
    off();
  });

  it('routes per-channel MIDI channel + note', () => {
    const bus = makeEventBus();
    const out = makeOutput();
    const off = attachMidiSink(bus, {
      getConfigs: () => [
        cfg(),
        cfg({ midiChannel: 9, note: 60 }),
      ],
      resolveOutput: () => out,
      getStepDurationMs: () => 50,
    });
    bus.emit({ type: 'trigger', target: 'channel.1', velocity: 0.5, when: 0 });
    expect(out.sent[0][0]).toBe(0x99);   // 0x90 | 9
    expect(out.sent[0][1]).toBe(60);
    // velocity 0.5 → 64 (rounded)
    expect(out.sent[0][2]).toBe(64);
    off();
  });

  it('drops triggers for disabled channels', () => {
    const bus = makeEventBus();
    const out = makeOutput();
    const off = attachMidiSink(bus, {
      getConfigs: () => [cfg({ enabled: false })],
      resolveOutput: () => out,
      getStepDurationMs: () => 50,
    });
    bus.emit({ type: 'trigger', target: 'channel.0', velocity: 1, when: 0 });
    expect(out.sent).toEqual([]);
    off();
  });

  it('skips sub-addresses (channel.0.color.cutoff stays a param event)', () => {
    const bus = makeEventBus();
    const out = makeOutput();
    const off = attachMidiSink(bus, {
      getConfigs: () => [cfg()],
      resolveOutput: () => out,
      getStepDurationMs: () => 50,
    });
    bus.emit({ type: 'trigger', target: 'channel.0.color', velocity: 1, when: 0 });
    expect(out.sent).toEqual([]);
    off();
  });

  it('detach cancels pending note-off timers', () => {
    const bus = makeEventBus();
    const out = makeOutput();
    const off = attachMidiSink(bus, {
      getConfigs: () => [cfg()],
      resolveOutput: () => out,
      getStepDurationMs: () => 200,
    });
    bus.emit({ type: 'trigger', target: 'channel.0', velocity: 1, when: 0 });
    expect(out.sent).toHaveLength(1);
    off();
    vi.advanceTimersByTime(500);
    expect(out.sent).toHaveLength(1); // note-off was cancelled
  });

  it('forwards onSent for both note-on and note-off', () => {
    const bus = makeEventBus();
    const out = makeOutput();
    const sent: Array<{ outputId: string; data: number[] }> = [];
    const off = attachMidiSink(bus, {
      getConfigs: () => [cfg()],
      resolveOutput: () => out,
      getStepDurationMs: () => 50,
      onSent: (e) => sent.push(e),
    });
    bus.emit({ type: 'trigger', target: 'channel.0', velocity: 1, when: 0 });
    vi.advanceTimersByTime(50);
    expect(sent.map((e) => e.data[0])).toEqual([0x90, 0x80]);
    off();
  });

  it('survives a hot-unplugged output (send throws) without breaking the bus', () => {
    const bus = makeEventBus();
    const dead: MidiOutputLike = {
      id: 'dead', name: 'dead',
      send: () => { throw new Error('InvalidStateError'); },
    };
    let otherCalls = 0;
    bus.on('trigger', () => { otherCalls++; });

    const off = attachMidiSink(bus, {
      getConfigs: () => [cfg()],
      resolveOutput: () => dead,
      getStepDurationMs: () => 50,
    });
    expect(() =>
      bus.emit({ type: 'trigger', target: 'channel.0', velocity: 1, when: 0 }),
    ).not.toThrow();
    // Other subscribers on the bus still received the event.
    expect(otherCalls).toBe(1);
    // Note-off scheduled but should also fail-safe when it fires.
    expect(() => vi.advanceTimersByTime(60)).not.toThrow();
    off();
  });

  it('does not call onSent for the dropped message on send failure', () => {
    const bus = makeEventBus();
    const dead: MidiOutputLike = {
      id: 'dead', name: 'dead',
      send: () => { throw new Error('InvalidStateError'); },
    };
    const sent: Array<{ outputId: string; data: number[] }> = [];
    const off = attachMidiSink(bus, {
      getConfigs: () => [cfg()],
      resolveOutput: () => dead,
      getStepDurationMs: () => 50,
      onSent: (e) => sent.push(e),
    });
    bus.emit({ type: 'trigger', target: 'channel.0', velocity: 1, when: 0 });
    vi.advanceTimersByTime(60);
    expect(sent).toEqual([]);
    off();
  });
});
