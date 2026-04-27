// Composition operators for AudioModule.
//
// Each operator takes AudioModules in and returns an AudioModule out
// — so composed graphs are themselves modules and can be composed
// further. That's the algebra:
//
//   chain(a, b, c)               — a → b → c
//   parallel(ctx, a, b)          — fan out to a, b; sum back
//   tap(ctx, main, sendBus, x)   — main passes through, also sends x
//                                  amount to sendBus (reverb/delay)
//   wrap(node)                   — adapt a raw Web Audio node
//
// Disposal cascades — the wrapper's dispose() calls each child's
// dispose(). Idempotent because each child handles re-entry safely.

import type { AudioModule } from './types';

/** a → b → c → … — sequential signal flow.
 *  Returns a module whose input is the first child's input and whose
 *  output is the last child's output. Modules with null input/output
 *  break the chain (a pure source can only be the first; a pure sink
 *  can only be the last). */
export function chain(...mods: AudioModule[]): AudioModule {
  for (let i = 0; i < mods.length - 1; i++) {
    const out = mods[i].output;
    const inp = mods[i + 1].input;
    if (out && inp) out.connect(inp);
  }
  return {
    input: mods[0]?.input ?? null,
    output: mods[mods.length - 1]?.output ?? null,
    dispose: () => { for (const m of mods) m.dispose(); },
  };
}

/** Fan signal out to every module; sum their outputs back together.
 *  Both fanout and fanin are GainNodes at unity. The combined module
 *  exposes `fanout` as input and `fanin` as output. Sources (modules
 *  with input=null) can't participate as parallel branches — they'd
 *  ignore the fanout — so the operator filters them out for safety. */
export function parallel(ctx: AudioContext, ...mods: AudioModule[]): AudioModule {
  const fanout = ctx.createGain();
  const fanin = ctx.createGain();
  for (const m of mods) {
    if (m.input) fanout.connect(m.input);
    if (m.output) m.output.connect(fanin);
  }
  return {
    input: fanout,
    output: fanin,
    dispose: () => {
      try { fanout.disconnect(); } catch { /* idempotent */ }
      try { fanin.disconnect(); } catch { /* idempotent */ }
      for (const m of mods) m.dispose();
    },
  };
}

/** Branch a copy of `main`'s output into `sendBus` via a gain stage.
 *  The send gain is returned on the wrapper so callers can later
 *  adjust the send amount (typical reverb/delay send). The main path
 *  is unchanged — input and output match the wrapped main. */
export function tap(
  ctx: AudioContext,
  main: AudioModule,
  sendBus: AudioModule,
  initialSend = 0,
): AudioModule & { send: GainNode } {
  const send = ctx.createGain();
  send.gain.value = initialSend;
  if (main.output) main.output.connect(send);
  if (sendBus.input) send.connect(sendBus.input);
  return {
    input: main.input,
    output: main.output,
    send,
    dispose: () => {
      try { send.disconnect(); } catch { /* idempotent */ }
      main.dispose();
    },
  };
}

/** Adapt a raw AudioNode (or pair) as an AudioModule.
 *  - Single-arg form: same node is both input and output (filter,
 *    gain, panner — anything that's a single in/out node).
 *  - Two-arg form: distinct in and out (a sub-graph the caller
 *    wired manually). */
export function wrap(input: AudioNode, output?: AudioNode): AudioModule {
  const out = output ?? input;
  return {
    input,
    output: out,
    dispose: () => {
      try { input.disconnect(); } catch { /* idempotent */ }
      if (output && output !== input) {
        try { output.disconnect(); } catch { /* idempotent */ }
      }
    },
  };
}

/** A pure sink — wraps an AudioNode that should not feed anything
 *  downstream (analyser, destination). */
export function sink(node: AudioNode): AudioModule {
  return {
    input: node,
    output: null,
    dispose: () => {
      try { node.disconnect(); } catch { /* idempotent */ }
    },
  };
}
