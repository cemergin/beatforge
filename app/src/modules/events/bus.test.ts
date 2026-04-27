import { describe, expect, it, vi } from 'vitest';
import { makeEventBus } from './bus';
import type { ParamEvent, TriggerEvent } from './types';

describe('EventBus', () => {
  it('delivers an emitted event to a typed subscriber', () => {
    const bus = makeEventBus();
    const handler = vi.fn();
    bus.on('trigger', handler);
    const event: TriggerEvent = {
      type: 'trigger', target: 'channel.0', velocity: 1, when: 0,
    };
    bus.emit(event);
    expect(handler).toHaveBeenCalledWith(event);
  });

  it('does not deliver to subscribers of other types', () => {
    const bus = makeEventBus();
    const trigger = vi.fn();
    const param = vi.fn();
    bus.on('trigger', trigger);
    bus.on('param', param);
    bus.emit({ type: 'trigger', target: 'channel.0', velocity: 1, when: 0 });
    expect(trigger).toHaveBeenCalledOnce();
    expect(param).not.toHaveBeenCalled();
  });

  it('onAny receives every event regardless of type', () => {
    const bus = makeEventBus();
    const any = vi.fn();
    bus.onAny(any);
    bus.emit({ type: 'bar', bar: 1, when: 0 });
    bus.emit({ type: 'step', channel: 0, step: 0, when: 0 });
    expect(any).toHaveBeenCalledTimes(2);
  });

  it('unsubscribe stops delivery for that handler only', () => {
    const bus = makeEventBus();
    const a = vi.fn();
    const b = vi.fn();
    const offA = bus.on('trigger', a);
    bus.on('trigger', b);
    offA();
    bus.emit({ type: 'trigger', target: 'channel.0', velocity: 1, when: 0 });
    expect(a).not.toHaveBeenCalled();
    expect(b).toHaveBeenCalledOnce();
  });

  it('unsubscribe is idempotent', () => {
    const bus = makeEventBus();
    const off = bus.on('bar', () => {});
    expect(() => { off(); off(); off(); }).not.toThrow();
  });

  it('a handler that throws does not stop other handlers', () => {
    const bus = makeEventBus();
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const after = vi.fn();
    bus.on('trigger', () => { throw new Error('boom'); });
    bus.on('trigger', after);
    bus.emit({ type: 'trigger', target: 'channel.0', velocity: 1, when: 0 });
    expect(after).toHaveBeenCalledOnce();
    warn.mockRestore();
  });

  it('a handler that unsubscribes mid-emit does not affect this dispatch', () => {
    const bus = makeEventBus();
    const seen: number[] = [];
    let off: () => void = () => {};
    const a = vi.fn(() => { seen.push(1); off(); });
    const b = vi.fn(() => { seen.push(2); });
    bus.on('trigger', a);
    off = bus.on('trigger', b);
    bus.emit({ type: 'trigger', target: 'channel.0', velocity: 1, when: 0 });
    // Both fire on this dispatch (snapshot semantics)
    expect(seen).toEqual([1, 2]);
    // But b is gone for the next one
    bus.emit({ type: 'trigger', target: 'channel.0', velocity: 1, when: 0 });
    expect(b).toHaveBeenCalledOnce();
  });

  it('narrows event type at the handler signature', () => {
    const bus = makeEventBus();
    bus.on('param', (event) => {
      // Compile-time check: event is narrowed to ParamEvent here.
      const e: ParamEvent = event;
      expect(e.type).toBe('param');
    });
    bus.emit({ type: 'param', target: 'channel.0.level', value: 0.5 });
  });
});
