// Web Audio helpers for machine renderers. The four primitive
// constructors (createOsc/Gain/Biquad/Noise) re-export from the
// canonical location in audio/kits/_util.ts so we have ONE source
// of truth even while the new + legacy systems coexist. Adding
// ampEnvelope here since it's only consumed by the new system.

export { createOsc, createGain, createBiquad, createNoise } from '../../kits/_util';

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
