import { describe, expect, it, vi } from 'vitest';
import { makeRouter } from '../../modules/router';
import { makeEventBus } from '../../modules/events';
import {
  engineChannelColor,
  engineChannelMachine,
  engineChannelMixer,
  engineMasterGain,
  registerEngineChannel,
  registerEngineMaster,
} from './engine-adapters';
import {
  createDelayFx,
  createReverb,
} from '../machines/fx';
import type { SoundEngine } from './sound-engine';
import type { ChannelEffects, ColorFx } from '../../patterns/types-sound';
import type { MachineConfig } from '../machines/types';
import { VOICE_MACHINES } from '../machines/registry';

// Minimal AudioContext stub — only what createReverb / createDelayFx
// touch. Same shape used by machines/fx/fx.test.ts.
interface NodeStub { connect: ReturnType<typeof vi.fn>; disconnect: ReturnType<typeof vi.fn>; }
function audioCtx(): AudioContext {
  const node = (): NodeStub => ({
    connect: vi.fn((d: unknown) => d),
    disconnect: vi.fn(),
  });
  const param = () => ({
    value: 0,
    cancelScheduledValues: vi.fn(),
    setValueAtTime: vi.fn(),
    linearRampToValueAtTime: vi.fn(),
  });
  return {
    sampleRate: 48000,
    currentTime: 0,
    createGain: () => ({ ...node(), gain: param() }),
    createBiquadFilter: () => ({ ...node(), type: 'lowpass', frequency: param(), Q: param() }),
    createDelay: () => ({ ...node(), delayTime: param() }),
    createConvolver: () => ({ ...node(), buffer: null }),
    createWaveShaper: () => ({ ...node(), curve: null, oversample: 'none' }),
    createBuffer: (channels: number, length: number, rate: number) => ({
      numberOfChannels: channels, length, sampleRate: rate,
      getChannelData: () => new Float32Array(length),
    }),
  } as unknown as AudioContext;
}

// Stub SoundEngine — only the methods the adapters touch. Anything
// else throws if accessed (forces tests to declare what they need).
// getReverbFx / getDelayFx return real ControllableModules from
// machines/fx so the registerEngineMaster round-trip really lands
// on a module's set().
function fakeEngine() {
  const reverbFx = createReverb(audioCtx());
  const delayFx = createDelayFx(audioCtx());
  const reverbSet = vi.spyOn(reverbFx, 'set');
  const delaySet = vi.spyOn(delayFx, 'set');
  const calls = {
    setMasterVolume: vi.fn(),
    reverbSet,
    delaySet,
    applyChannelParams: vi.fn(),
    applyChannelColorFx: vi.fn(),
    applyChannelMachine: vi.fn(),
  };
  const engine = {
    setMasterVolume: calls.setMasterVolume,
    getReverbFx: () => reverbFx,
    getDelayFx: () => delayFx,
    applyChannelParams: calls.applyChannelParams,
    applyChannelColorFx: calls.applyChannelColorFx,
    applyChannelMachine: calls.applyChannelMachine,
  };
  return { engine: engine as unknown as SoundEngine, calls };
}

function defaultEffects(): ChannelEffects {
  return { level: 0.85, pan: 0, colorFx: { type: 'none' }, reverbSend: 0, delaySend: 0 };
}

describe('engineMasterGain adapter', () => {
  it('forwards set("value", number) to engine.setMasterVolume', () => {
    const { engine, calls } = fakeEngine();
    engineMasterGain(engine).set('value', 0.42);
    expect(calls.setMasterVolume).toHaveBeenCalledWith(0.42);
  });

  it('ignores unknown params', () => {
    const { engine, calls } = fakeEngine();
    engineMasterGain(engine).set('mute', 1);
    expect(calls.setMasterVolume).not.toHaveBeenCalled();
  });

  it('ignores non-number values', () => {
    const { engine, calls } = fakeEngine();
    engineMasterGain(engine).set('value', 'half');
    expect(calls.setMasterVolume).not.toHaveBeenCalled();
  });
});

describe('registerEngineMaster — direct FX module wiring', () => {
  it('reverb + delay register the actual FX modules from machines/fx', () => {
    const { engine, calls } = fakeEngine();
    const router = makeRouter();
    const bus = makeEventBus();
    registerEngineMaster(router, engine);
    router.bindBus(bus);

    bus.emit({ type: 'param', target: 'master.gain.value', value: 0.7 });
    bus.emit({ type: 'param', target: 'master.reverb.wet', value: 0.3 });
    bus.emit({ type: 'param', target: 'master.delay.time', value: 0.5 });

    expect(calls.setMasterVolume).toHaveBeenCalledWith(0.7);
    expect(calls.reverbSet).toHaveBeenCalledWith('wet', 0.3, expect.any(Object));
    expect(calls.delaySet).toHaveBeenCalledWith('time', 0.5, expect.any(Object));
  });

  it('teardown unregisters every adapter', () => {
    const { engine, calls } = fakeEngine();
    const router = makeRouter();
    const bus = makeEventBus();
    const off = registerEngineMaster(router, engine);
    router.bindBus(bus);

    bus.emit({ type: 'param', target: 'master.gain.value', value: 0.5 });
    expect(calls.setMasterVolume).toHaveBeenCalledOnce();

    off();
    bus.emit({ type: 'param', target: 'master.gain.value', value: 0.2 });
    bus.emit({ type: 'param', target: 'master.reverb.wet', value: 0.1 });
    bus.emit({ type: 'param', target: 'master.delay.feedback', value: 0.4 });

    expect(calls.setMasterVolume).toHaveBeenCalledOnce();
    expect(calls.reverbSet).not.toHaveBeenCalled();
    expect(calls.delaySet).not.toHaveBeenCalled();
  });

  it('skips reverb / delay registration when getReverbFx returns null (ctx not ready)', () => {
    const calls = {
      setMasterVolume: vi.fn(),
      applyChannelParams: vi.fn(),
      applyChannelColorFx: vi.fn(),
      applyChannelMachine: vi.fn(),
    };
    const engine = {
      setMasterVolume: calls.setMasterVolume,
      getReverbFx: () => null,
      getDelayFx: () => null,
    } as unknown as SoundEngine;
    const router = makeRouter();
    const bus = makeEventBus();
    expect(() => registerEngineMaster(router, engine)).not.toThrow();
    router.bindBus(bus);
    bus.emit({ type: 'param', target: 'master.gain.value', value: 0.6 });
    bus.emit({ type: 'param', target: 'master.reverb.wet', value: 0.3 });
    expect(calls.setMasterVolume).toHaveBeenCalledWith(0.6);
    // No throw on the unknown reverb target — router silently drops.
  });
});

describe('engineChannelMixer adapter', () => {
  it('dispatches a partial update by sending the full ChannelStripParams', () => {
    const { engine, calls } = fakeEngine();
    const mix = engineChannelMixer(engine, 2, defaultEffects());
    mix.set('level', 0.5);
    expect(calls.applyChannelParams).toHaveBeenCalledWith(2, expect.objectContaining({
      level: 0.5, pan: 0, reverbSend: 0, delaySend: 0,
    }));
  });

  it('preserves prior values across successive partial updates', () => {
    const { engine, calls } = fakeEngine();
    const mix = engineChannelMixer(engine, 0, defaultEffects());
    mix.set('level', 0.3);
    mix.set('pan', -0.6);
    mix.set('reverbSend', 0.2);
    expect(calls.applyChannelParams).toHaveBeenLastCalledWith(0, expect.objectContaining({
      level: 0.3, pan: -0.6, reverbSend: 0.2, delaySend: 0,
    }));
  });

  it('ignores unknown params and non-numbers', () => {
    const { engine, calls } = fakeEngine();
    const mix = engineChannelMixer(engine, 0, defaultEffects());
    mix.set('mute', 1);
    mix.set('level', 'half');
    expect(calls.applyChannelParams).not.toHaveBeenCalled();
  });
});

describe('engineChannelColor adapter', () => {
  it('type swap pushes the new type with default knob values', () => {
    const { engine, calls } = fakeEngine();
    const col = engineChannelColor(engine, 0, { type: 'none' });
    col.set('type', 'overdrive');
    expect(calls.applyChannelColorFx).toHaveBeenCalledWith(0, expect.objectContaining({
      type: 'overdrive',
      drive: expect.any(Number),
      tone: expect.any(Number),
      mix: expect.any(Number),
    }));
  });

  it('knob update preserves the active type', () => {
    const { engine, calls } = fakeEngine();
    const col = engineChannelColor(engine, 0, { type: 'overdrive', drive: 0.5, tone: 0.5, mix: 0.7 });
    col.set('drive', 0.9);
    expect(calls.applyChannelColorFx).toHaveBeenCalledWith(0, expect.objectContaining({
      type: 'overdrive', drive: 0.9, tone: 0.5, mix: 0.7,
    }));
  });

  it('ignores params that do not apply to the active type', () => {
    const { engine, calls } = fakeEngine();
    const col = engineChannelColor(engine, 0, { type: 'overdrive', drive: 0.5, tone: 0.5, mix: 0.7 });
    col.set('bits', 4);   // bitcrush param — should be ignored
    expect(calls.applyChannelColorFx).not.toHaveBeenCalled();
  });

  it('filter mode flips between lp/hp/bp', () => {
    const { engine, calls } = fakeEngine();
    const col = engineChannelColor(engine, 0, { type: 'filter', mode: 'lp', cutoff: 1000, q: 1, mix: 0.8 });
    col.set('mode', 'hp');
    expect(calls.applyChannelColorFx).toHaveBeenCalledWith(0, expect.objectContaining({
      type: 'filter', mode: 'hp',
    }));
  });

  it('type=none ignores all continuous knobs', () => {
    const { engine, calls } = fakeEngine();
    const col = engineChannelColor(engine, 0, { type: 'none' });
    col.set('drive', 0.9);
    col.set('cutoff', 5000);
    expect(calls.applyChannelColorFx).not.toHaveBeenCalled();
  });
});

describe('engineChannelMachine adapter', () => {
  function kickConfig(): MachineConfig {
    return { ...VOICE_MACHINES.kick.defaults };
  }

  it('exposes archetype + each knob on params', () => {
    const { engine } = fakeEngine();
    const m = engineChannelMachine(engine, 0, kickConfig());
    const names = m.params.map((p) => p.name);
    expect(names).toContain('archetype');
    expect(names).toContain('pitch');
    expect(names).toContain('decay');
  });

  it('knob update pushes a new MachineConfig with the changed value', () => {
    const { engine, calls } = fakeEngine();
    const m = engineChannelMachine(engine, 0, kickConfig());
    m.set('pitch', 200);
    expect(calls.applyChannelMachine).toHaveBeenCalledWith(0, expect.objectContaining({
      archetype: 'kick', pitch: 200,
    }));
  });

  it('archetype swap resets the cfg to the new machine defaults', () => {
    const { engine, calls } = fakeEngine();
    const m = engineChannelMachine(engine, 0, kickConfig());
    m.set('archetype', 'snare');
    expect(calls.applyChannelMachine).toHaveBeenCalledWith(0, expect.objectContaining({
      archetype: 'snare',
    }));
  });

  it('archetype swap rebuilds the params surface', () => {
    const { engine } = fakeEngine();
    const m = engineChannelMachine(engine, 0, kickConfig());
    expect(m.params.map((p) => p.name)).toContain('pitch');
    m.set('archetype', 'noise');
    // After swap, params should now reflect the noise machine
    const names = m.params.map((p) => p.name);
    expect(names).toContain('cutoff');
  });

  it('rejects an unknown archetype', () => {
    const { engine, calls } = fakeEngine();
    const m = engineChannelMachine(engine, 0, kickConfig());
    m.set('archetype', 'unicorn');
    expect(calls.applyChannelMachine).not.toHaveBeenCalled();
  });

  it('ignores knob updates that the active machine does not declare', () => {
    const { engine, calls } = fakeEngine();
    const m = engineChannelMachine(engine, 0, kickConfig());
    m.set('reverbAmount', 1);    // not a kick knob
    expect(calls.applyChannelMachine).not.toHaveBeenCalled();
  });

  it('routes a discrete knob via .set when the active machine declares one', () => {
    const { engine, calls } = fakeEngine();
    // The noise machine has a discrete `filter` knob (lp/bp/hp).
    const m = engineChannelMachine(engine, 0, { ...VOICE_MACHINES.noise.defaults });
    m.set('filter', 'hp');
    expect(calls.applyChannelMachine).toHaveBeenCalledWith(0, expect.objectContaining({
      filter: 'hp',
    }));
  });
});

describe('registerEngineChannel + Router round-trip', () => {
  function setupChannel(initialColor: ColorFx = { type: 'none' }) {
    const { engine, calls } = fakeEngine();
    const router = makeRouter();
    const bus = makeEventBus();
    const off = registerEngineChannel(router, engine, 0, {
      effects: { ...defaultEffects(), colorFx: initialColor },
      machine: { ...VOICE_MACHINES.kick.defaults },
    });
    router.bindBus(bus);
    return { calls, bus, off };
  }

  it('channel.0.level routes to applyChannelParams', () => {
    const { calls, bus } = setupChannel();
    bus.emit({ type: 'param', target: 'channel.0.level', value: 0.5 });
    expect(calls.applyChannelParams).toHaveBeenCalledWith(0, expect.objectContaining({ level: 0.5 }));
  });

  it('channel.0.color.type routes to applyChannelColorFx', () => {
    const { calls, bus } = setupChannel();
    bus.emit({ type: 'param', target: 'channel.0.color.type', value: 'bitcrush' });
    expect(calls.applyChannelColorFx).toHaveBeenCalledWith(0, expect.objectContaining({ type: 'bitcrush' }));
  });

  it('channel.0.machine.pitch routes to applyChannelMachine', () => {
    const { calls, bus } = setupChannel();
    bus.emit({ type: 'param', target: 'channel.0.machine.pitch', value: 180 });
    expect(calls.applyChannelMachine).toHaveBeenCalledWith(0, expect.objectContaining({ pitch: 180 }));
  });

  it('channel.0.machine.archetype routes through the swap branch', () => {
    const { calls, bus } = setupChannel();
    bus.emit({ type: 'param', target: 'channel.0.machine.archetype', value: 'snare' });
    expect(calls.applyChannelMachine).toHaveBeenCalledWith(0, expect.objectContaining({ archetype: 'snare' }));
  });

  it('teardown removes all three registrations', () => {
    const { calls, bus, off } = setupChannel();
    off();
    bus.emit({ type: 'param', target: 'channel.0.level', value: 0.1 });
    bus.emit({ type: 'param', target: 'channel.0.color.type', value: 'bitcrush' });
    bus.emit({ type: 'param', target: 'channel.0.machine.pitch', value: 100 });
    expect(calls.applyChannelParams).not.toHaveBeenCalled();
    expect(calls.applyChannelColorFx).not.toHaveBeenCalled();
    expect(calls.applyChannelMachine).not.toHaveBeenCalled();
  });
});
