// Snare voice machine — 2-osc tonal body + filtered noise.
// Covers 808/909 SN, rim, side-stick, brushed snare.

import { z } from 'zod';
import type { KnobSpec, ModValues, VoiceCtx, VoiceMachine } from '../types';
import { knobValue } from '../types';
import { ampEnvelope, createBiquad, createGain, createNoise, createOsc } from '../_shared/audio';

const KNOBS = [
  { id: 'pitch',      label: 'Pitch',       min: 100, max: 500,  default: 200, curve: 'exp', unit: 'Hz' },
  { id: 'snap',       label: 'Snap',        min: 200, max: 8000, default: 1800, curve: 'exp', unit: 'Hz' },
  { id: 'decay',      label: 'Decay',       min: 30,  max: 800,  default: 150, curve: 'exp', unit: 'ms' },
  { id: 'tone',       label: 'Tone',        min: 0,   max: 1,    default: 0.5, curve: 'lin', unit: '%' },
  { id: 'noiseDecay', label: 'Noise Decay', min: 30,  max: 600,  default: 150, curve: 'exp', unit: 'ms' },
] as const satisfies readonly KnobSpec[];

const SnareConfigSchema = z.object({
  archetype:  z.literal('snare'),
  pitch:      z.number().min(KNOBS[0].min).max(KNOBS[0].max),
  snap:       z.number().min(KNOBS[1].min).max(KNOBS[1].max),
  decay:      z.number().min(KNOBS[2].min).max(KNOBS[2].max),
  tone:       z.number().min(KNOBS[3].min).max(KNOBS[3].max),
  noiseDecay: z.number().min(KNOBS[4].min).max(KNOBS[4].max),
});

export type SnareConfig = z.infer<typeof SnareConfigSchema>;

const DEFAULTS: SnareConfig = {
  archetype: 'snare',
  pitch: 200, snap: 1800, decay: 150, tone: 0.5, noiseDecay: 150,
};

export const SNARE_PRESETS: Record<string, Partial<SnareConfig>> = {
  '808': { pitch: 185, snap: 1800, decay: 120, tone: 0.45, noiseDecay: 150 },
  '909': { pitch: 220, snap: 2400, decay: 130, tone: 0.55, noiseDecay: 130 },
  '707': { pitch: 195, snap: 1900, decay: 100, tone: 0.5,  noiseDecay: 90 },
  rim:   { pitch: 320, snap: 5000, decay: 60,  tone: 0.85, noiseDecay: 40 },
  brush: { pitch: 180, snap: 1200, decay: 200, tone: 0.2,  noiseDecay: 250 },
};

export const Snare: VoiceMachine<SnareConfig> = {
  id: 'snare',
  label: 'Snare',
  category: 'voice',
  knobs: KNOBS,
  defaults: DEFAULTS,
  schema: SnareConfigSchema,
  presets: SNARE_PRESETS,

  render(cfg: SnareConfig, vc: VoiceCtx, when: number, amp: number, mod?: ModValues): void {
    const { ctx, destination } = vc;

    const pitch      = knobValue(cfg, 'pitch', mod);
    const snap       = knobValue(cfg, 'snap', mod);
    const decay      = knobValue(cfg, 'decay', mod) / 1000;
    const tone       = knobValue(cfg, 'tone', mod);
    const noiseDecay = knobValue(cfg, 'noiseDecay', mod) / 1000;

    // Tonal body: 2 detuned oscillators (fundamental + ~2x).
    const o1 = createOsc(ctx); o1.frequency.value = pitch;
    const o2 = createOsc(ctx); o2.frequency.value = pitch * 1.86;
    const oscEnv = ampEnvelope(ctx, when, amp * 0.5 * (1 - tone), 0.002, decay * 0.6);
    o1.connect(oscEnv); o2.connect(oscEnv);
    oscEnv.connect(destination);
    o1.start(when); o2.start(when);
    o1.stop(when + decay + 0.05); o2.stop(when + decay + 0.05);

    // Noise: bandpass-filtered for "snap."
    const noise = createNoise(ctx, noiseDecay + 0.05);
    const filt = createBiquad(ctx);
    filt.type = 'bandpass';
    filt.frequency.value = snap;
    filt.Q.value = 0.6;
    const noiseEnv = createGain(ctx);
    noiseEnv.gain.setValueAtTime(0, when);
    noiseEnv.gain.linearRampToValueAtTime(amp * 0.7 * tone, when + 0.002);
    noiseEnv.gain.exponentialRampToValueAtTime(0.0001, when + noiseDecay);
    noise.connect(filt).connect(noiseEnv);
    noiseEnv.connect(destination);
    noise.start(when);
    noise.stop(when + noiseDecay + 0.02);
  },
};
