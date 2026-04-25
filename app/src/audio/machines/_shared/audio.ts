// Shared Web Audio helpers for machine renderers. Mirrors the existing
// audio/kits/_util.ts but lives under machines/ so the new system has
// no inbound dependency on the legacy kit code path.
//
// Phase 2 will collapse the duplication once the legacy kits are gone.

export function createOsc(ctx: AudioContext): OscillatorNode {
  return ctx.createOscillator();
}

export function createGain(ctx: AudioContext): GainNode {
  return ctx.createGain();
}

export function createBiquad(ctx: AudioContext): BiquadFilterNode {
  return ctx.createBiquadFilter();
}

/** Short-lived white-noise buffer source. Fills `dur` seconds of
 *  uniform [-1, 1] noise and returns an unstarted source. */
export function createNoise(ctx: AudioContext, dur: number): AudioBufferSourceNode {
  const rate = ctx.sampleRate;
  const len = Math.ceil(rate * dur);
  const buf = ctx.createBuffer(1, len, rate);
  const d = buf.getChannelData(0);
  for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
  const src = ctx.createBufferSource();
  src.buffer = buf;
  return src;
}

/** Standard percussion amp envelope: linear ramp up to peak, then
 *  exponential decay to silence. Returns a configured GainNode that
 *  the caller is responsible for connecting. */
export function ampEnvelope(
  ctx: AudioContext,
  when: number,
  peak: number,
  attackSec: number,
  decaySec: number,
): GainNode {
  const g = ctx.createGain();
  g.gain.setValueAtTime(0, when);
  g.gain.linearRampToValueAtTime(peak, when + attackSec);
  g.gain.exponentialRampToValueAtTime(0.0001, when + attackSec + decaySec);
  return g;
}
