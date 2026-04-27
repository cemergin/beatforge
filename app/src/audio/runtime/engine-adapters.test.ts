import { describe, expect, it, vi } from 'vitest';
import { makeRouter } from '../../modules/router';
import { makeEventBus } from '../../modules/events';
import {
  engineDelay,
  engineMasterGain,
  engineReverb,
  registerEngineMaster,
} from './engine-adapters';
import type { SoundEngine } from './sound-engine';

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
  };
  return { engine: calls as unknown as SoundEngine, calls };
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
