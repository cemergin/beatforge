// Formant voice — three parallel bandpass filters tuned to vowel
// formant frequencies. A pitched sawtooth drives them; the result is
// a vocal-like "speak"/"vowel-stab" sound. The `vowel` knob morphs
// continuously through the a/e/i/o/u space.

import { z } from 'zod';
import type { KnobSpec, ModValues, VoiceCtx, VoiceMachine } from '../types';
import { knobValue } from '../types';
import { ampEnvelope, createBiquad, createGain, createOsc } from '../_shared/audio';

const KNOBS = [
  { id: 'vowel',      label: 'Vowel',      min: 0,    max: 1,    default: 0.5,  curve: 'lin', unit: '' },
  { id: 'pitch',      label: 'Pitch',      min: 80,   max: 600,  default: 180,  curve: 'exp', unit: 'Hz' },
  { id: 'decay',      label: 'Decay',      min: 80,   max: 2000, default: 350,  curve: 'exp', unit: 'ms' },
  { id: 'q',          label: 'Q',          min: 1,    max: 20,   default: 8,    curve: 'lin', unit: '' },
  { id: 'brightness', label: 'Brightness', min: 0,    max: 1,    default: 0.4,  curve: 'lin', unit: '%' },
] as const satisfies readonly KnobSpec[];

const FormantConfigSchema = z.object({
  archetype:  z.literal('formant'),
  vowel:      z.number().min(KNOBS[0].min).max(KNOBS[0].max),
  pitch:      z.number().min(KNOBS[1].min).max(KNOBS[1].max),
  decay:      z.number().min(KNOBS[2].min).max(KNOBS[2].max),
  q:          z.number().min(KNOBS[3].min).max(KNOBS[3].max),
  brightness: z.number().min(KNOBS[4].min).max(KNOBS[4].max),
});

export type FormantConfig = z.infer<typeof FormantConfigSchema>;

const DEFAULTS: FormantConfig = {
  archetype: 'formant', vowel: 0.5, pitch: 180, decay: 350, q: 8, brightness: 0.4,
};

export const FORMANT_PRESETS: Record<string, Partial<FormantConfig>> = {
  ah:  { vowel: 0.0,  pitch: 220, decay: 400, q: 10, brightness: 0.3 },
  eh:  { vowel: 0.25, pitch: 220, decay: 400, q: 10, brightness: 0.4 },
  ee:  { vowel: 0.5,  pitch: 240, decay: 400, q: 12, brightness: 0.6 },
  oh:  { vowel: 0.75, pitch: 180, decay: 500, q: 9,  brightness: 0.3 },
  oo:  { vowel: 1.0,  pitch: 160, decay: 500, q: 8,  brightness: 0.2 },
  vox: { vowel: 0.4,  pitch: 200, decay: 800, q: 6,  brightness: 0.4 },
};

/** Vowel formant table — 3 formants per vowel (F1, F2, F3). Roughly
 *  the standard male-voice frequencies. */
const VOWELS: Array<[number, number, number]> = [
  [730, 1090, 2440], // 'a'
  [530, 1840, 2480], // 'e'
  [270, 2290, 3010], // 'i'
  [570,  840, 2410], // 'o'
  [300,  870, 2240], // 'u'
];

/** Linearly interpolate the vowel table at position `t` ∈ [0, 1]. */
function vowelFormants(t: number): [number, number, number] {
  const tc = Math.max(0, Math.min(1, t)) * (VOWELS.length - 1);
  const i = Math.floor(tc);
  const frac = tc - i;
  const a = VOWELS[i];
  const b = VOWELS[Math.min(i + 1, VOWELS.length - 1)];
  return [
    a[0] + (b[0] - a[0]) * frac,
    a[1] + (b[1] - a[1]) * frac,
    a[2] + (b[2] - a[2]) * frac,
  ];
}

export const Formant: VoiceMachine<FormantConfig> = {
  id: 'formant',
  label: 'Vowel',
  category: 'voice',
  knobs: KNOBS,
  defaults: DEFAULTS,
  schema: FormantConfigSchema,
  presets: FORMANT_PRESETS,

  render(cfg: FormantConfig, vc: VoiceCtx, when: number, amp: number, mod?: ModValues): void {
    const { ctx, destination } = vc;
    const vowel      = knobValue(cfg, 'vowel', mod);
    const pitch      = knobValue(cfg, 'pitch', mod);
    const decay      = knobValue(cfg, 'decay', mod) / 1000;
    const q          = knobValue(cfg, 'q', mod);
    const brightness = knobValue(cfg, 'brightness', mod);

    const [f1, f2, f3] = vowelFormants(vowel);

    // Source: sawtooth (rich harmonic content for the formants to filter).
    const saw = createOsc(ctx);
    saw.type = 'sawtooth';
    saw.frequency.value = pitch;

    // Three parallel bandpass filters at the formant frequencies.
    const sumGain = createGain(ctx);
    const formantGains = [0.7, 0.5, 0.35 + brightness * 0.5];
    [f1, f2, f3].forEach((freq, i) => {
      const bp = createBiquad(ctx);
      bp.type = 'bandpass';
      bp.frequency.value = freq;
      bp.Q.value = q;
      const g = createGain(ctx);
      g.gain.value = formantGains[i];
      saw.connect(bp).connect(g).connect(sumGain);
    });

    const env = ampEnvelope(ctx, when, amp * 0.55, 0.008, decay);
    sumGain.connect(env);
    env.connect(destination);

    saw.start(when);
    saw.stop(when + decay + 0.05);
  },
};
