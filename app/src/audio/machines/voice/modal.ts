// Modal voice machine — sum of N damped partials. Each partial is a
// sine oscillator at f₀ × (integer + inharmonic offset), individually
// enveloped so high partials decay faster than low (physical
// resemblance: real bells lose high frequencies first to air friction).
//
// Covers: frame drum, tabla bayan, gamelan gong, bell, tank drum,
// "resonant body" sounds. The single most musically generative voice
// in the kit — small parameter changes give very different objects.

import { z } from 'zod';
import type { KnobSpec, ModValues, VoiceCtx, VoiceMachine } from '../types';
import { knobValue } from '../types';
import { ampEnvelope, createOsc } from '../_shared/audio';

const KNOBS = [
  { id: 'pitch',      label: 'Pitch',      min: 50,  max: 1500, default: 220, curve: 'exp', unit: 'Hz' },
  { id: 'partials',   label: 'Partials',   min: 2,   max: 6,    default: 4,   curve: 'lin', unit: '' },
  { id: 'damping',    label: 'Damping',    min: 0,   max: 1,    default: 0.5, curve: 'lin', unit: '%' },
  { id: 'decay',      label: 'Decay',      min: 100, max: 4000, default: 1100, curve: 'exp', unit: 'ms' },
  { id: 'inharmonic', label: 'Inharmonic', min: 0,   max: 1,    default: 0.0, curve: 'lin', unit: '%' },
] as const satisfies readonly KnobSpec[];

const ModalConfigSchema = z.object({
  archetype:  z.literal('modal'),
  pitch:      z.number().min(KNOBS[0].min).max(KNOBS[0].max),
  partials:   z.number().min(KNOBS[1].min).max(KNOBS[1].max),
  damping:    z.number().min(KNOBS[2].min).max(KNOBS[2].max),
  decay:      z.number().min(KNOBS[3].min).max(KNOBS[3].max),
  inharmonic: z.number().min(KNOBS[4].min).max(KNOBS[4].max),
});

export type ModalConfig = z.infer<typeof ModalConfigSchema>;

const DEFAULTS: ModalConfig = {
  archetype: 'modal', pitch: 220, partials: 4, damping: 0.5, decay: 1100, inharmonic: 0,
};

export const MODAL_PRESETS: Record<string, Partial<ModalConfig>> = {
  bell:      { pitch: 440, partials: 5, damping: 0.3, decay: 2200, inharmonic: 0.4 },
  frame:     { pitch: 180, partials: 3, damping: 0.6, decay: 700,  inharmonic: 0.15 },
  bayan:     { pitch: 110, partials: 4, damping: 0.7, decay: 800,  inharmonic: 0.0 },
  gong:      { pitch: 90,  partials: 6, damping: 0.4, decay: 3000, inharmonic: 0.6 },
  tank:      { pitch: 280, partials: 4, damping: 0.4, decay: 1600, inharmonic: 0.25 },
  pot:       { pitch: 360, partials: 3, damping: 0.55, decay: 600, inharmonic: 0.35 },
  log:       { pitch: 130, partials: 2, damping: 0.75, decay: 350, inharmonic: 0.1 },
};

/** Pseudo-random but deterministic offset for partial N at
 *  inharmonic strength `k`. Gives bell-like clusters that are stable
 *  per (pitch, partials, k). */
function inharmonicOffset(n: number, k: number): number {
  // Hash a couple of well-known irrationals through the partial idx
  // to get a scattered but reproducible offset in [-k/2, k/2].
  const h = Math.sin(n * 12.9898) * 43758.5453;
  return (h - Math.floor(h) - 0.5) * k;
}

export const Modal: VoiceMachine<ModalConfig> = {
  id: 'modal',
  label: 'Modal',
  category: 'voice',
  knobs: KNOBS,
  defaults: DEFAULTS,
  schema: ModalConfigSchema,
  presets: MODAL_PRESETS,

  render(cfg: ModalConfig, vc: VoiceCtx, when: number, amp: number, mod?: ModValues): void {
    const { ctx, destination } = vc;
    const pitch      = knobValue(cfg, 'pitch', mod);
    const partials   = Math.round(knobValue(cfg, 'partials', mod));
    const damping    = knobValue(cfg, 'damping', mod);
    const decay      = knobValue(cfg, 'decay', mod) / 1000;
    const inharmonic = knobValue(cfg, 'inharmonic', mod);

    for (let n = 1; n <= partials; n++) {
      // Frequency: integer harmonic + inharmonic perturbation. n=1 is
      // always exactly the fundamental — anchors pitch perception.
      const offset = n === 1 ? 0 : inharmonicOffset(n, inharmonic);
      const f = pitch * (n + offset);

      // Each partial decays faster than the last. `damping` 0 = all
      // partials share the same decay (dronier); 1 = high partials
      // die very fast (cleaner attack).
      const decayMul = 1 / (1 + damping * (n - 1));
      const partialDecay = decay * decayMul;

      // Amplitude rolls off with partial number too (real instruments).
      const partialAmp = amp * (0.7 / n);

      const osc = createOsc(ctx);
      osc.type = 'sine';
      osc.frequency.value = f;
      const env = ampEnvelope(ctx, when, partialAmp, 0.003, partialDecay);
      osc.connect(env);
      env.connect(destination);
      osc.start(when);
      osc.stop(when + partialDecay + 0.05);
    }
  },
};
