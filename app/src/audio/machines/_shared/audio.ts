// Web Audio helpers for machine renderers. Tiny wrappers around
// AudioContext.createX so machine files don't repeat the same boilerplate.

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
 *  [-1, 1] uniform noise and returns an unstarted source. Caller is
 *  responsible for connect() + start(). */
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

/** Short-burst transient duration shared by clap, crackle, etc.
 *  12 ms is short enough to register as a click but long enough that
 *  band-passed envelopes settle cleanly. */
export const BURST_SEC = 0.012;

/** A 30 Hz highpass — DC-blocker. Use when a renderer's signal path
 *  (e.g., asymmetric WaveShaper) injects DC the amp envelope can't
 *  cancel; otherwise you get a "clunk" on attack/release. */
export function dcBlocker(ctx: AudioContext): BiquadFilterNode {
  const hp = ctx.createBiquadFilter();
  hp.type = 'highpass';
  hp.frequency.value = 30;
  hp.Q.value = 0.5;
  return hp;
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
