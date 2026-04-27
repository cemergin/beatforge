import { describe, expect, it, vi } from 'vitest';
import { makeEventBus } from '../events';
import type { ControllableModule, ParamSpec } from '../audio-graph/types';
import { makeRouter } from './router';

function mockModule(params: ParamSpec[] = []): ControllableModule & { calls: Array<[string, number | string]> } {
  const calls: Array<[string, number | string]> = [];
  const set = vi.fn((name: string, value: number | string) => {
    calls.push([name, value]);
  });
  return {
    input: null,
    output: null,
    params,
    set,
    dispose: vi.fn(),
    calls,
  };
}

describe('Router', () => {
  it('dispatches a ParamEvent to the registered module + param', () => {
    const router = makeRouter();
    const bus = makeEventBus();
    const mod = mockModule([{ name: 'cutoff', kind: 'continuous', default: 1000 }]);
    router.registerModule('channel.0.color', mod);
    router.bindBus(bus);
    bus.emit({ type: 'param', target: 'channel.0.color.cutoff', value: 4200 });
    expect(mod.set).toHaveBeenCalledWith('cutoff', 4200, expect.any(Object));
  });

  it('routes a deeper target through prefix-matching', () => {
    const router = makeRouter();
    const bus = makeEventBus();
    const mod = mockModule([{ name: 'a.b', kind: 'continuous', default: 0 }]);
    router.registerModule('master.fx', mod);
    router.bindBus(bus);
    bus.emit({ type: 'param', target: 'master.fx.a.b', value: 0.5 });
    expect(mod.set).toHaveBeenCalledWith('a.b', 0.5, expect.any(Object));
  });

  it('drops unknown targets without throwing', () => {
    const router = makeRouter();
    const bus = makeEventBus();
    router.bindBus(bus);
    expect(() => bus.emit({ type: 'param', target: 'nope.exists', value: 1 })).not.toThrow();
  });

  it('unregister stops dispatch for that address', () => {
    const router = makeRouter();
    const bus = makeEventBus();
    const mod = mockModule([{ name: 'value', kind: 'continuous', default: 1 }]);
    const off = router.registerModule('master.gain', mod);
    router.bindBus(bus);
    bus.emit({ type: 'param', target: 'master.gain.value', value: 0.5 });
    expect(mod.set).toHaveBeenCalledOnce();
    off();
    bus.emit({ type: 'param', target: 'master.gain.value', value: 0.3 });
    expect(mod.set).toHaveBeenCalledOnce(); // still 1
  });

  it('re-registering replaces the prior module at that address', () => {
    const router = makeRouter();
    const bus = makeEventBus();
    const a = mockModule([{ name: 'value', kind: 'continuous', default: 1 }]);
    const b = mockModule([{ name: 'value', kind: 'continuous', default: 1 }]);
    router.registerModule('master.gain', a);
    router.registerModule('master.gain', b);
    router.bindBus(bus);
    bus.emit({ type: 'param', target: 'master.gain.value', value: 0.5 });
    expect(a.set).not.toHaveBeenCalled();
    expect(b.set).toHaveBeenCalledOnce();
  });

  it('forwards TriggerEvents to the registered voice handler', () => {
    const router = makeRouter();
    const bus = makeEventBus();
    const handler = vi.fn();
    router.registerVoice('channel.0', handler);
    router.bindBus(bus);
    bus.emit({ type: 'trigger', target: 'channel.0', velocity: 1.0, when: 0 });
    expect(handler).toHaveBeenCalledOnce();
  });

  it('voice unregister stops dispatch', () => {
    const router = makeRouter();
    const bus = makeEventBus();
    const handler = vi.fn();
    const off = router.registerVoice('channel.0', handler);
    router.bindBus(bus);
    bus.emit({ type: 'trigger', target: 'channel.0', velocity: 1, when: 0 });
    off();
    bus.emit({ type: 'trigger', target: 'channel.0', velocity: 1, when: 0 });
    expect(handler).toHaveBeenCalledOnce();
  });

  it('bindBus returns an unsubscribe that detaches both subscriptions', () => {
    const router = makeRouter();
    const bus = makeEventBus();
    const mod = mockModule([{ name: 'value', kind: 'continuous', default: 1 }]);
    router.registerModule('master.gain', mod);
    const unbind = router.bindBus(bus);
    bus.emit({ type: 'param', target: 'master.gain.value', value: 0.5 });
    expect(mod.set).toHaveBeenCalledOnce();
    unbind();
    bus.emit({ type: 'param', target: 'master.gain.value', value: 0.3 });
    expect(mod.set).toHaveBeenCalledOnce();
  });
});
