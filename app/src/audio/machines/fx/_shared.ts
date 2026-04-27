// Shared helpers for FX ControllableModules. Nothing here is fancy
// — just the small bits every FX needs (anti-zip ramp, fixed-shape
// curves) so each FX file stays focused on its character.

import type { SetOptions } from '../../../modules/audio-graph';

/** Apply a continuous AudioParam change with anti-zip ramp + future
 *  scheduling. Same shape as primitives.ts so behaviour matches. */
export function rampParam(
  ctx: AudioContext,
  param: AudioParam,
  value: number,
  opts: SetOptions = {},
): void {
  const when = opts.when ?? ctx.currentTime;
  const ramp = opts.ramp ?? 0.015;
  param.cancelScheduledValues(when);
  param.setValueAtTime(param.value, when);
  param.linearRampToValueAtTime(value, when + ramp);
}

/** Float32Array<ArrayBuffer> allocator — strict TS5+ distinguishes
 *  ArrayBuffer from SharedArrayBuffer; WaveShaper.curve only accepts
 *  the former. The explicit return type survives widening. */
export function curveBuffer(length: number): Float32Array<ArrayBuffer> {
  return new Float32Array(new ArrayBuffer(length * 4));
}

/** Fixed-shape tanh saturation curve. The "drive" knob feeds extra
 *  gain INTO this curve at runtime (driveBoost gain stage), so the
 *  curve itself stays static — no rebuild on knob changes, no
 *  click. `sharpness` controls how aggressively tanh bends. */
export function tanhCurve(length = 4096, sharpness = 5): Float32Array<ArrayBuffer> {
  const c = curveBuffer(length);
  for (let i = 0; i < length; i++) {
    const x = (i / (length - 1)) * 2 - 1;
    c[i] = Math.tanh(x * sharpness);
  }
  return c;
}

/** Bitcrush quantization curve — quantizes the unit interval to
 *  2^bits levels. Below ~3 bits the signal collapses to a few
 *  steps, which sounds gnarly but useful for accents. Bits is the
 *  ONE structural param of bitcrush — the curve must be rebuilt
 *  when bits changes. */
export function bitcrushCurve(bits: number, length = 65536): Float32Array<ArrayBuffer> {
  const levels = Math.max(2, Math.pow(2, Math.max(1, bits)));
  const c = curveBuffer(length);
  for (let i = 0; i < length; i++) {
    const x = (i / (length - 1)) * 2 - 1;
    c[i] = Math.round(x * levels) / levels;
  }
  return c;
}

/** Synthesize a noise-burst impulse response. Quick + cheap, sounds
 *  like a small room. duration = total tail in seconds; decay =
 *  exponent on the amplitude envelope (higher = faster fade). */
export function makeReverbImpulse(
  ctx: AudioContext,
  duration: number,
  decay: number,
): AudioBuffer {
  const rate = ctx.sampleRate;
  const length = Math.floor(rate * duration);
  const impulse = ctx.createBuffer(2, length, rate);
  for (let ch = 0; ch < 2; ch++) {
    const d = impulse.getChannelData(ch);
    for (let i = 0; i < length; i++) {
      d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / length, decay);
    }
  }
  return impulse;
}
