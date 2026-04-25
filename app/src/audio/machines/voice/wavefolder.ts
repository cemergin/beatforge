// Wavefolder voice — Buchla-style west-coast distortion. Take a
// sine, fold it through a nonlinear curve so high amplitudes get
// "reflected" back, generating odd harmonics. Drives the timbre from
// pure sine (fold=0) to harmonic-rich saw-like (fold=1).

import { z } from 'zod';
import type { KnobSpec, ModValues, VoiceCtx, VoiceMachine } from '../types';
import { knobValue } from '../types';
import { ampEnvelope, createGain, createOsc } from '../_shared/audio';

const KNOBS = [
  { id: 'pitch',     label: 'Pitch',     min: 50,  max: 1500, default: 220, curve: 'exp', unit: 'Hz' },
  { id: 'fold',      label: 'Fold',      min: 0,   max: 1,    default: 0.5, curve: 'lin', unit: '%' },
  { id: 'decay',     label: 'Decay',     min: 50,  max: 2000, default: 500, curve: 'exp', unit: 'ms' },
  { id: 'asymmetry', label: 'Asymmetry', min: -1,  max: 1,    default: 0,   curve: 'lin', unit: '' },
  { id: 'pitchEnd',  label: 'Pitch End', min: 50,  max: 1500, default: 220, curve: 'exp', unit: 'Hz' },
] as const satisfies readonly KnobSpec[];

const WavefolderConfigSchema = z.object({
  archetype:  z.literal('wavefolder'),
  pitch:      z.number().min(KNOBS[0].min).max(KNOBS[0].max),
  fold:       z.number().min(KNOBS[1].min).max(KNOBS[1].max),
  decay:      z.number().min(KNOBS[2].min).max(KNOBS[2].max),
  asymmetry:  z.number().min(KNOBS[3].min).max(KNOBS[3].max),
  pitchEnd:   z.number().min(KNOBS[4].min).max(KNOBS[4].max),
});

export type WavefolderConfig = z.infer<typeof WavefolderConfigSchema>;

const DEFAULTS: WavefolderConfig = {
  archetype: 'wavefolder', pitch: 220, fold: 0.5, decay: 500, asymmetry: 0, pitchEnd: 220,
};

export const WAVEFOLDER_PRESETS: Record<string, Partial<WavefolderConfig>> = {
  buchla:  { pitch: 220, fold: 0.7, decay: 800,  asymmetry: 0.3, pitchEnd: 220 },
  metal:   { pitch: 320, fold: 0.9, decay: 600,  asymmetry: 0.5, pitchEnd: 220 },
  zap:     { pitch: 880, fold: 0.6, decay: 200,  asymmetry: 0.0, pitchEnd: 110 },
  drone:   { pitch: 110, fold: 0.4, decay: 2000, asymmetry: 0.1, pitchEnd: 110 },
  pulse:   { pitch: 440, fold: 0.85, decay: 100, asymmetry: 0.4, pitchEnd: 440 },
};

/** Build a wavefolder transfer curve. Folding triangle wave produces
 *  odd-order distortion; we use sin(πx) + asymmetric clipping for a
 *  smoother sound than triangle. Curve length = 4096 samples. */
function makeFoldCurve(fold: number, asymmetry: number): Float32Array<ArrayBuffer> {
  const len = 4096;
  const curve = new Float32Array(new ArrayBuffer(len * 4));
  // Higher `fold` → more aggressive amplification before the fold.
  const drive = 1 + fold * 8;
  for (let i = 0; i < len; i++) {
    const x = (i / (len - 1)) * 2 - 1;          // -1..1
    const xa = x + asymmetry * 0.5;              // shift DC
    const folded = Math.sin(xa * drive * Math.PI / 2);
    curve[i] = Math.max(-1, Math.min(1, folded));
  }
  return curve;
}

export const Wavefolder: VoiceMachine<WavefolderConfig> = {
  id: 'wavefolder',
  label: 'Wavefolder',
  category: 'voice',
  knobs: KNOBS,
  defaults: DEFAULTS,
  schema: WavefolderConfigSchema,
  presets: WAVEFOLDER_PRESETS,

  render(cfg: WavefolderConfig, vc: VoiceCtx, when: number, amp: number, mod?: ModValues): void {
    const { ctx, destination } = vc;
    const pitch     = knobValue(cfg, 'pitch', mod);
    const fold      = knobValue(cfg, 'fold', mod);
    const decay     = knobValue(cfg, 'decay', mod) / 1000;
    const asymmetry = knobValue(cfg, 'asymmetry', mod);
    const pitchEnd  = knobValue(cfg, 'pitchEnd', mod);

    const osc = createOsc(ctx);
    osc.type = 'sine';
    osc.frequency.setValueAtTime(pitch, when);
    if (Math.abs(pitchEnd - pitch) > 0.5) {
      osc.frequency.exponentialRampToValueAtTime(
        Math.max(0.0001, pitchEnd),
        when + Math.min(decay * 0.5, 0.3),
      );
    }

    // Drive into the wavefolder via a gain stage, then through a
    // WaveShaper carrying the fold curve.
    const driveGain = createGain(ctx);
    driveGain.gain.value = 1 + fold * 4;
    osc.connect(driveGain);

    const shaper = ctx.createWaveShaper();
    shaper.curve = makeFoldCurve(fold, asymmetry);
    shaper.oversample = '4x';
    driveGain.connect(shaper);

    const env = ampEnvelope(ctx, when, amp * 0.5, 0.005, decay);
    shaper.connect(env);
    env.connect(destination);

    osc.start(when);
    osc.stop(when + decay + 0.05);
  },
};
