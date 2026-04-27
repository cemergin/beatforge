import { describe, expect, it, vi } from 'vitest';
import type { AudioModule } from './types';
import { chain, parallel, sink, tap, wrap } from './compose';

// Stub AudioContext + AudioNode just enough to verify wiring.
// We don't need real audio; we need to track .connect / .disconnect
// calls so the assertions can prove the operators wired things.

interface StubNode {
  id: string;
  connect: ReturnType<typeof vi.fn>;
  disconnect: ReturnType<typeof vi.fn>;
}

function stubNode(id: string): StubNode {
  return {
    id,
    connect: vi.fn(),
    disconnect: vi.fn(),
  };
}

function stubModule(id: string, withInput = true, withOutput = true): AudioModule {
  const inp = withInput ? stubNode(`${id}-in`) : null;
  const out = withOutput ? stubNode(`${id}-out`) : null;
  const dispose = vi.fn();
  return {
    input: inp as unknown as AudioNode | null,
    output: out as unknown as AudioNode | null,
    dispose,
  };
}

function stubGain(id: string) {
  return {
    ...stubNode(id),
    gain: { value: 1 },
  };
}

function stubCtx(): AudioContext {
  return {
    createGain: () => stubGain('gain'),
  } as unknown as AudioContext;
}

describe('chain', () => {
  it('connects each module to the next', () => {
    const a = stubModule('a');
    const b = stubModule('b');
    const c = stubModule('c');
    chain(a, b, c);
    expect((a.output as unknown as StubNode).connect).toHaveBeenCalledWith(b.input);
    expect((b.output as unknown as StubNode).connect).toHaveBeenCalledWith(c.input);
  });

  it('exposes first.input and last.output', () => {
    const a = stubModule('a');
    const b = stubModule('b');
    const composed = chain(a, b);
    expect(composed.input).toBe(a.input);
    expect(composed.output).toBe(b.output);
  });

  it('dispose cascades to every child', () => {
    const a = stubModule('a');
    const b = stubModule('b');
    chain(a, b).dispose();
    expect(a.dispose).toHaveBeenCalled();
    expect(b.dispose).toHaveBeenCalled();
  });

  it('skips connection when an intermediate module has no output', () => {
    const a = stubModule('a');
    const b = stubModule('b', true, false);   // no output
    const c = stubModule('c');
    expect(() => chain(a, b, c)).not.toThrow();
    expect((a.output as unknown as StubNode).connect).toHaveBeenCalledWith(b.input);
    // b has no output → no a→c via b
  });
});

describe('parallel', () => {
  it('fans signal out to every module and sums back', () => {
    const ctx = stubCtx();
    const a = stubModule('a');
    const b = stubModule('b');
    const composed = parallel(ctx, a, b);
    // fanout connects to each child's input
    expect((composed.input as unknown as StubNode).connect).toHaveBeenCalledWith(a.input);
    expect((composed.input as unknown as StubNode).connect).toHaveBeenCalledWith(b.input);
    // each child's output connects to fanin
    expect((a.output as unknown as StubNode).connect).toHaveBeenCalledWith(composed.output);
    expect((b.output as unknown as StubNode).connect).toHaveBeenCalledWith(composed.output);
  });

  it('dispose cleans up fan nodes and children', () => {
    const ctx = stubCtx();
    const a = stubModule('a');
    const composed = parallel(ctx, a);
    composed.dispose();
    expect((composed.input as unknown as StubNode).disconnect).toHaveBeenCalled();
    expect((composed.output as unknown as StubNode).disconnect).toHaveBeenCalled();
    expect(a.dispose).toHaveBeenCalled();
  });
});

describe('tap', () => {
  it('routes main.output through a send gain into the bus input', () => {
    const ctx = stubCtx();
    const main = stubModule('main');
    const bus = stubModule('bus');
    const composed = tap(ctx, main, bus, 0.5);
    expect((main.output as unknown as StubNode).connect).toHaveBeenCalledWith(composed.send);
    expect((composed.send as unknown as StubNode).connect).toHaveBeenCalledWith(bus.input);
    expect(composed.send.gain.value).toBe(0.5);
  });

  it('passes through main input/output', () => {
    const ctx = stubCtx();
    const main = stubModule('main');
    const bus = stubModule('bus');
    const composed = tap(ctx, main, bus, 0);
    expect(composed.input).toBe(main.input);
    expect(composed.output).toBe(main.output);
  });
});

describe('wrap', () => {
  it('single-arg form uses the same node for input and output', () => {
    const node = stubNode('n');
    const m = wrap(node as unknown as AudioNode);
    expect(m.input).toBe(node);
    expect(m.output).toBe(node);
  });

  it('two-arg form uses distinct in and out', () => {
    const a = stubNode('a');
    const b = stubNode('b');
    const m = wrap(a as unknown as AudioNode, b as unknown as AudioNode);
    expect(m.input).toBe(a);
    expect(m.output).toBe(b);
  });

  it('dispose disconnects both nodes', () => {
    const a = stubNode('a');
    const b = stubNode('b');
    wrap(a as unknown as AudioNode, b as unknown as AudioNode).dispose();
    expect(a.disconnect).toHaveBeenCalled();
    expect(b.disconnect).toHaveBeenCalled();
  });
});

describe('sink', () => {
  it('exposes the node as input only; output is null', () => {
    const node = stubNode('n');
    const m = sink(node as unknown as AudioNode);
    expect(m.input).toBe(node);
    expect(m.output).toBeNull();
  });
});
