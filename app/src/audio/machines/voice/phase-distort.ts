// Phase-distort voice — Casio CZ-style. Take a sawtooth (which
// provides a linear phase ramp) and apply a non-linear "bend" curve
// to it; then run the bent phase through a sine LUT. The result is
// alien, glassy, metallic — distinct from FM and modal.
//
// We collapse the two-stage chain (bend + sin) into a single
// pre-computed WaveShaper curve at config time. Different `wave`
// modes pick different curve shapes; `distortion` strengthens them.

import { z } from 'zod';
import type { DiscreteSpec, KnobSpec, ModValues, VoiceCtx, VoiceMachine } from '../types';
import { knobValue } from '../types';
import { ampEnvelope, createOsc, dcBlocker } from '../_shared/audio';

const KNOBS = [
  { id: 'pitch',      label: 'Pitch',      min: 80,  max: 1500, default: 220, curve: 'exp', unit: 'Hz' },
  { id: 'distortion', label: 'Distortion', min: 0,   max: 1,    default: 0.5, curve: 'lin', unit: '%' },
  { id: 'decay',      label: 'Decay',      min: 50,  max: 2500, default: 600, curve: 'exp', unit: 'ms' },
  { id: 'pitchEnd',   label: 'Pitch End',  min: 80,  max: 1500, default: 220, curve: 'exp', unit: 'Hz' },
] as const satisfies readonly KnobSpec[];

const DISCRETE = [
  { id: 'wave', label: 'Wave', options: ['saw', 'square', 'pulse', 'resonant'] as const, default: 'saw' as const },
] as const satisfies readonly DiscreteSpec[];

const PhaseDistortConfigSchema = z.object({
  archetype:  z.literal('phase-distort'),
  pitch:      z.number().min(KNOBS[0].min).max(KNOBS[0].max),
  distortion: z.number().min(KNOBS[1].min).max(KNOBS[1].max),
  decay:      z.number().min(KNOBS[2].min).max(KNOBS[2].max),
  pitchEnd:   z.number().min(KNOBS[3].min).max(KNOBS[3].max),
  wave:       z.enum(['saw', 'square', 'pulse', 'resonant']),
});

export type PhaseDistortConfig = z.infer<typeof PhaseDistortConfigSchema>;

const DEFAULTS: PhaseDistortConfig = {
  archetype: 'phase-distort', pitch: 220, distortion: 0.5, decay: 600, pitchEnd: 220, wave: 'saw',
};

export const PHASE_DISTORT_PRESETS: Record<string, Partial<PhaseDistortConfig>> = {
  cz_saw:  { pitch: 220, distortion: 0.5, decay: 700,  pitchEnd: 220, wave: 'saw' },
  cz_sq:   { pitch: 330, distortion: 0.65, decay: 500, pitchEnd: 330, wave: 'square' },
  glass:   { pitch: 540, distortion: 0.8, decay: 1200, pitchEnd: 540, wave: 'resonant' },
  blade:   { pitch: 660, distortion: 0.9, decay: 350,  pitchEnd: 220, wave: 'pulse' },
  alien:   { pitch: 180, distortion: 0.7, decay: 1800, pitchEnd: 90,  wave: 'resonant' },
};

type WaveMode = PhaseDistortConfig['wave'];

/** Build the phase-distortion transfer curve. The input is a linear
 *  saw (-1..1 ≡ phase 0..1); the output is the post-distortion
 *  waveform sample.
 *
 *  - saw: sin(πx) — pure sine at d=0, sin(π·pow(x, exp)) for d>0
 *      (phase ramp gets bent towards a step at the end of cycle)
 *  - square: tanh(x · drive) — smooth at d=0, hard square at d=1
 *  - pulse: sign(x + bias) — duty-cycle driven by distortion
 *  - resonant: cos(x · (1+d·k) · π) windowed by (1-|x|) — the CZ
 *      "resonant" sound, phase running fast inside one cycle
 */
function makePhaseCurve(wave: WaveMode, distortion: number): Float32Array<ArrayBuffer> {
  const len = 4096;
  const curve = new Float32Array(new ArrayBuffer(len * 4));
  for (let i = 0; i < len; i++) {
    const x = (i / (len - 1)) * 2 - 1;     // -1..1 (saw output)
    const p = (x + 1) / 2;                  // 0..1 (phase)
    let y = 0;
    switch (wave) {
      case 'saw': {
        // Bend the phase exponent: at d=0 → linear, d=1 → strong
        // late-cycle compression (fast attack on each cycle).
        const exp = 1 + distortion * 4;
        const pBent = Math.pow(p, exp);
        y = Math.sin(2 * Math.PI * pBent);
        break;
      }
      case 'square': {
        const drive = 1 + distortion * 12;
        y = Math.tanh(x * drive);
        break;
      }
      case 'pulse': {
        // Distortion drives the duty cycle — at 0.5 it's 50%; lower
        // values shift it toward narrower pulses.
        const bias = (distortion - 0.5) * 0.9;
        y = (x + bias) > 0 ? 1 : -1;
        break;
      }
      case 'resonant': {
        // Resonant modulator running at (1 + d·8)x, windowed so it
        // doesn't carry DC across cycles.
        const rate = 1 + distortion * 8;
        const window = 1 - Math.abs(x);
        y = Math.cos(p * rate * 2 * Math.PI) * window;
        break;
      }
    }
    curve[i] = Math.max(-1, Math.min(1, y));
  }
  return curve;
}

export const PhaseDistort: VoiceMachine<PhaseDistortConfig> = {
  id: 'phase-distort',
  label: 'Phase distort',
  category: 'voice',
  knobs: KNOBS,
  discrete: DISCRETE,
  defaults: DEFAULTS,
  schema: PhaseDistortConfigSchema,
  presets: PHASE_DISTORT_PRESETS,

  render(cfg: PhaseDistortConfig, vc: VoiceCtx, when: number, amp: number, mod?: ModValues): void {
    const { ctx, destination } = vc;
    const pitch      = knobValue(cfg, 'pitch', mod);
    const distortion = knobValue(cfg, 'distortion', mod);
    const decay      = knobValue(cfg, 'decay', mod) / 1000;
    const pitchEnd   = knobValue(cfg, 'pitchEnd', mod);

    const saw = createOsc(ctx);
    saw.type = 'sawtooth';
    saw.frequency.setValueAtTime(pitch, when);
    if (Math.abs(pitchEnd - pitch) > 0.5) {
      saw.frequency.exponentialRampToValueAtTime(
        Math.max(0.0001, pitchEnd),
        when + Math.min(decay * 0.5, 0.3),
      );
    }

    const shaper = ctx.createWaveShaper();
    shaper.curve = makePhaseCurve(cfg.wave, distortion);
    shaper.oversample = '4x';
    saw.connect(shaper);

    // DC-blocker — `pulse` and `resonant` modes can produce DC.
    const hp = dcBlocker(ctx);
    shaper.connect(hp);

    const env = ampEnvelope(ctx, when, amp * 0.5, 0.005, decay);
    hp.connect(env);
    env.connect(destination);

    saw.start(when);
    saw.stop(when + decay + 0.05);
  },
};
