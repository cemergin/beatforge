import { describe, expect, it, vi } from 'vitest';
import { makeEventBus, type Event } from '../events';
import { makeMidiModule } from './midi';
import type { MidiInputLike } from './types';

// Stub MIDIInput — captures the listener so the test can fire
// MIDIMessageEvents synthetically. Same shape Web MIDI's MIDIInput
// gives in browsers.
function stubInput(id = 'pad'): MidiInputLike & { fire(data: number[]): void } {
  let listener: ((e: { data: Uint8Array }) => void) | null = null;
  return {
    id,
    name: 'Test Pad',
    manufacturer: 'BeatForge',
    addEventListener: (_t: string, fn: (e: { data: Uint8Array }) => void) => {
      listener = fn;
    },
    removeEventListener: (_t: string, fn: (e: { data: Uint8Array }) => void) => {
      if (listener === fn) listener = null;
    },
    fire(data: number[]) {
      if (listener) listener({ data: new Uint8Array(data) });
    },
  };
}

function recordedBus() {
  const bus = makeEventBus();
  const events: Event[] = [];
  bus.onAny((e) => events.push(e));
  return { bus, events };
}

describe('MIDI: note-on → TriggerEvent', () => {
  it('emits a TriggerEvent at the mapped address with velocity normalized', () => {
    const { bus, events } = recordedBus();
    const midi = makeMidiModule(bus);
    const input = stubInput();
    midi.bindInput(input, [
      { kind: 'note', toAddress: 'channel.0' },
    ]);
    input.fire([0x90, 36, 100]);   // ch=0 note-on note=36 vel=100
    const trig = events.find((e) => e.type === 'trigger');
    expect(trig).toBeTruthy();
    expect(trig).toMatchObject({
      type: 'trigger',
      target: 'channel.0',
      velocity: 100 / 127,
    });
  });

  it('matches by note number when set', () => {
    const { bus, events } = recordedBus();
    const midi = makeMidiModule(bus);
    const input = stubInput();
    midi.bindInput(input, [
      { kind: 'note', note: 36, toAddress: 'channel.0' },
      { kind: 'note', note: 38, toAddress: 'channel.1' },
    ]);
    input.fire([0x90, 36, 100]);
    input.fire([0x90, 38, 80]);
    input.fire([0x90, 42, 120]);   // unmatched
    const trigs = events.filter((e) => e.type === 'trigger');
    expect(trigs).toHaveLength(2);
    expect(trigs[0]).toMatchObject({ target: 'channel.0' });
    expect(trigs[1]).toMatchObject({ target: 'channel.1' });
  });

  it('matches by MIDI channel when set', () => {
    const { bus, events } = recordedBus();
    const midi = makeMidiModule(bus);
    const input = stubInput();
    midi.bindInput(input, [
      { kind: 'note', channel: 0, toAddress: 'channel.0' },
      { kind: 'note', channel: 1, toAddress: 'channel.1' },
    ]);
    input.fire([0x90, 36, 100]);   // ch=0
    input.fire([0x91, 36, 100]);   // ch=1
    const trigs = events.filter((e) => e.type === 'trigger');
    expect(trigs).toHaveLength(2);
    expect(trigs.map((t) => (t as { target: string }).target)).toEqual([
      'channel.0', 'channel.1',
    ]);
  });

  it('note-on with velocity 0 maps to ReleaseEvent (running-status off)', () => {
    const { bus, events } = recordedBus();
    const midi = makeMidiModule(bus);
    const input = stubInput();
    midi.bindInput(input, [
      { kind: 'note', toAddress: 'channel.0' },
    ]);
    input.fire([0x90, 36, 0]);
    const rel = events.find((e) => e.type === 'release');
    expect(rel).toBeTruthy();
  });

  it('explicit note-off (0x80) maps to ReleaseEvent', () => {
    const { bus, events } = recordedBus();
    const midi = makeMidiModule(bus);
    const input = stubInput();
    midi.bindInput(input, [
      { kind: 'note', toAddress: 'channel.0' },
    ]);
    input.fire([0x80, 36, 0]);
    expect(events.find((e) => e.type === 'release')).toBeTruthy();
  });
});

describe('MIDI: CC → ParamEvent', () => {
  it('linear scale maps 0..127 to 0..1', () => {
    const { bus, events } = recordedBus();
    const midi = makeMidiModule(bus);
    const input = stubInput();
    midi.bindInput(input, [
      { kind: 'cc', cc: 74, toAddress: 'master.gain.value' },
    ]);
    input.fire([0xb0, 74, 64]);
    const ev = events.find((e) => e.type === 'param') as { value: number };
    expect(ev.value).toBeCloseTo(64 / 127, 6);
  });

  it('linear range scale maps to {min, max}', () => {
    const { bus, events } = recordedBus();
    const midi = makeMidiModule(bus);
    const input = stubInput();
    midi.bindInput(input, [
      { kind: 'cc', cc: 74, toAddress: 'channel.0.color.cutoff',
        scale: { min: 200, max: 12000, curve: 'lin' } },
    ]);
    input.fire([0xb0, 74, 64]);
    const ev = events.find((e) => e.type === 'param') as { value: number };
    // 64/127 ≈ 0.504; lerp 200→12000 ≈ 6151
    expect(ev.value).toBeCloseTo(200 + (64 / 127) * (12000 - 200), 1);
  });

  it('exp curve gives perceptually-even Hz mapping', () => {
    const { bus, events } = recordedBus();
    const midi = makeMidiModule(bus);
    const input = stubInput();
    midi.bindInput(input, [
      { kind: 'cc', cc: 74, toAddress: 'channel.0.color.cutoff',
        scale: { min: 200, max: 12800, curve: 'exp' } },
    ]);
    input.fire([0xb0, 74, 0]);
    input.fire([0xb0, 74, 64]);
    input.fire([0xb0, 74, 127]);
    const params = events.filter((e) => e.type === 'param') as Array<{ value: number }>;
    expect(params[0].value).toBeCloseTo(200, 1);
    expect(params[2].value).toBeCloseTo(12800, 1);
    // Mid-range exp ≈ sqrt(200 * 12800) = 1600
    expect(params[1].value).toBeGreaterThan(1000);
    expect(params[1].value).toBeLessThan(2400);
  });

  it('matches by MIDI channel + CC number together', () => {
    const { bus, events } = recordedBus();
    const midi = makeMidiModule(bus);
    const input = stubInput();
    midi.bindInput(input, [
      { kind: 'cc', channel: 0, cc: 74, toAddress: 'a' },
      { kind: 'cc', channel: 1, cc: 74, toAddress: 'b' },
    ]);
    input.fire([0xb0, 74, 50]);   // ch=0 cc=74
    input.fire([0xb1, 74, 50]);   // ch=1 cc=74
    const params = events.filter((e) => e.type === 'param') as Array<{ target: string }>;
    expect(params.map((p) => p.target)).toEqual(['a', 'b']);
  });

  it('passes ramp through to the ParamEvent', () => {
    const { bus, events } = recordedBus();
    const midi = makeMidiModule(bus);
    const input = stubInput();
    midi.bindInput(input, [
      { kind: 'cc', cc: 74, toAddress: 'x', ramp: 0.05 },
    ]);
    input.fire([0xb0, 74, 30]);
    const ev = events.find((e) => e.type === 'param') as { ramp?: number };
    expect(ev.ramp).toBe(0.05);
  });
});

describe('MIDI: bindInput unsubscribe', () => {
  it('unsubscribe stops emission for that input', () => {
    const { bus, events } = recordedBus();
    const midi = makeMidiModule(bus);
    const input = stubInput();
    const off = midi.bindInput(input, [
      { kind: 'note', toAddress: 'channel.0' },
    ]);
    input.fire([0x90, 36, 100]);
    expect(events.length).toBeGreaterThan(0);
    const before = events.length;
    off();
    input.fire([0x90, 36, 100]);
    expect(events.length).toBe(before);
  });
});

describe('MIDI: enable + attach', () => {
  it('enable rejects when Web MIDI API is unavailable', async () => {
    const bus = makeEventBus();
    const midi = makeMidiModule(bus);
    // node test env has no navigator.requestMIDIAccess
    await expect(midi.enable()).rejects.toThrow(/Web MIDI/);
  });

  it('attach + inputs/outputs return the MIDIAccess collections', () => {
    const bus = makeEventBus();
    const midi = makeMidiModule(bus);
    const fakeIn = stubInput('a');
    const access = {
      inputs: { values: () => [fakeIn][Symbol.iterator]() },
      outputs: { values: () => [][Symbol.iterator]() },
    };
    midi.attach(access);
    expect(midi.inputs().map((i) => i.id)).toEqual(['a']);
    expect(midi.outputs()).toHaveLength(0);
  });
});

describe('MIDI: end-to-end with router', () => {
  it('a CC routes through the bus to a ControllableModule.set()', async () => {
    const { makeRouter } = await import('../router');
    const setSpy = vi.fn();
    const bus = makeEventBus();
    const router = makeRouter();
    const mod = {
      input: null, output: null,
      params: [{ name: 'cutoff', kind: 'continuous' as const, default: 1000 }],
      set: setSpy,
      dispose: () => {},
    };
    router.registerModule('channel.0.color', mod);
    router.bindBus(bus);
    const midi = makeMidiModule(bus);
    const input = stubInput();
    midi.bindInput(input, [
      { kind: 'cc', cc: 74, toAddress: 'channel.0.color.cutoff',
        scale: { min: 200, max: 12000 }, ramp: 0.02 },
    ]);
    input.fire([0xb0, 74, 90]);
    expect(setSpy).toHaveBeenCalledWith(
      'cutoff',
      expect.any(Number),
      expect.objectContaining({ ramp: 0.02 }),
    );
  });
});
