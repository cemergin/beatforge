// Web Audio helpers for machine renderers. The four primitive
// constructors (createOsc/Gain/Biquad/Noise) re-export from the
// canonical location in audio/kits/_util.ts so we have ONE source
// of truth even while the new + legacy systems coexist. Adding
// ampEnvelope here since it's only consumed by the new system.

export { createOsc, createGain, createBiquad, createNoise } from '../../kits/_util';

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
