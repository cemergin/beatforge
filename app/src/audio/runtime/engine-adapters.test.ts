import { describe, expect, it, vi } from 'vitest';
import { makeRouter } from '../../modules/router';
import { makeEventBus } from '../../modules/events';
import {
  engineChannelColor,
  engineChannelMachine,
  engineChannelMixer,
  engineDelay,
  engineMasterGain,
  engineReverb,
  registerEngineChannel,
  registerEngineMaster,
} from './engine-adapters';
import type { SoundEngine } from './sound-engine';
import type { ChannelEffects, ColorFx } from '../../patterns/types-sound';
import type { MachineConfig } from '../machines/types';
import { VOICE_MACHINES } from '../machines/registry';

// Stub SoundEngine — only the setters the adapters touch. Anything
// else throws if accessed (forces tests to declare what they need).
function fakeEngine() {
  const calls = {
    setMasterVolume: vi.fn(),
    setReverbWet: vi.fn(),
    setReverbSize: vi.fn(),
    setReverbDecay: vi.fn(),
    setDelayWet: vi.fn(),
    setDelayTime: vi.fn(),
    setDelayFeedback: vi.fn(),
    applyChannelParams: vi.fn(),
    applyChannelColorFx: vi.fn(),
    applyChannelMachine: vi.fn(),
  };
  return { engine: calls as unknown as SoundEngine, calls };
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

describe('engineReverb adapter', () => {
  it('routes wet / size / decay to the right setters', () => {
    const { engine, calls } = fakeEngine();
    const rev = engineReverb(engine);
    rev.set('wet', 0.6);
    rev.set('size', 2.4);
    rev.set('decay', 3.1);
    expect(calls.setReverbWet).toHaveBeenCalledWith(0.6);
    expect(calls.setReverbSize).toHaveBeenCalledWith(2.4);
    expect(calls.setReverbDecay).toHaveBeenCalledWith(3.1);
  });

  it('exposes its three params on the spec', () => {
    const { engine } = fakeEngine();
    const rev = engineReverb(engine);
    expect(rev.params.map((p) => p.name).sort()).toEqual(['decay', 'size', 'wet']);
  });
});

describe('engineDelay adapter', () => {
  it('routes wet / time / feedback to the right setters', () => {
    const { engine, calls } = fakeEngine();
    const dly = engineDelay(engine);
    dly.set('wet', 0.4);
    dly.set('time', 0.18);
    dly.set('feedback', 0.55);
    expect(calls.setDelayWet).toHaveBeenCalledWith(0.4);
    expect(calls.setDelayTime).toHaveBeenCalledWith(0.18);
    expect(calls.setDelayFeedback).toHaveBeenCalledWith(0.55);
  });
});

describe('registerEngineMaster + Router round-trip', () => {
  it('a ParamEvent on the bus reaches the right engine setter', () => {
    const { engine, calls } = fakeEngine();
    const router = makeRouter();
    const bus = makeEventBus();
    registerEngineMaster(router, engine);
    router.bindBus(bus);

    bus.emit({ type: 'param', target: 'master.gain.value', value: 0.7 });
    bus.emit({ type: 'param', target: 'master.reverb.wet', value: 0.3 });
    bus.emit({ type: 'param', target: 'master.delay.time', value: 0.5 });

    expect(calls.setMasterVolume).toHaveBeenCalledWith(0.7);
    expect(calls.setReverbWet).toHaveBeenCalledWith(0.3);
    expect(calls.setDelayTime).toHaveBeenCalledWith(0.5);
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

    expect(calls.setMasterVolume).toHaveBeenCalledOnce();      // still 1
    expect(calls.setReverbWet).not.toHaveBeenCalled();
    expect(calls.setDelayFeedback).not.toHaveBeenCalled();
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
