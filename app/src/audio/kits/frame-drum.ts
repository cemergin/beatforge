// Frame Drum — Turkish / Arabic / Persian / Balkan traditions.
// Voice mapping:
//   KK → doum         (deep center hit)
//   SN → tek          (rim edge)
//   HH → finger snap  (bright HP noise)
//   OH → zils         (detuned sines + noise tail)
//   CP → slap         (mid-body BP noise)

import type { KitRecipe, VoiceCtx } from './types';
import { connectVoice } from './types';
import { createBiquad, createGain, createNoise, createOsc } from './_util';

function doum(vc: VoiceCtx, when: number, amp: number): void {
  const { ctx } = vc;
  // Deep center hit: 82→58Hz droop + short LP-filtered noise thump.
  const osc = createOsc(ctx);
  const g = createGain(ctx);
  osc.frequency.setValueAtTime(82, when);
  osc.frequency.exponentialRampToValueAtTime(58, when + 0.04);
  g.gain.setValueAtTime(0, when);
  g.gain.linearRampToValueAtTime(amp * 1.0, when + 0.002);
  g.gain.exponentialRampToValueAtTime(0.0001, when + 0.28);
  osc.connect(g);
  connectVoice(vc, g, 1.2);
  osc.start(when); osc.stop(when + 0.32);

  const n = createNoise(ctx, 0.06);
  const lp = createBiquad(ctx);
  lp.type = 'lowpass';
  lp.frequency.value = 180;
  const ng = createGain(ctx);
  ng.gain.setValueAtTime(amp * 0.35, when);
  ng.gain.exponentialRampToValueAtTime(0.0001, when + 0.06);
  n.connect(lp).connect(ng);
  connectVoice(vc, ng);
  n.start(when); n.stop(when + 0.08);
}

function tek(vc: VoiceCtx, when: number, amp: number): void {
  const { ctx } = vc;
  // Rim edge: bandpass noise + 880Hz sine attack.
  const n = createNoise(ctx, 0.08);
  const bp = createBiquad(ctx);
  bp.type = 'bandpass';
  bp.frequency.value = 1500;
  bp.Q.value = 2.5;
  const osc = createOsc(ctx);
  osc.frequency.value = 880;
  const og = createGain(ctx);
  og.gain.setValueAtTime(amp * 0.25, when);
  og.gain.exponentialRampToValueAtTime(0.0001, when + 0.04);
  osc.connect(og);
  const ng = createGain(ctx);
  ng.gain.setValueAtTime(amp * 0.6, when);
  ng.gain.exponentialRampToValueAtTime(0.0001, when + 0.06);
  n.connect(bp).connect(ng);
  connectVoice(vc, ng);
  connectVoice(vc, og);
  n.start(when); n.stop(when + 0.08);
  osc.start(when); osc.stop(when + 0.06);
}

function fingerSnap(vc: VoiceCtx, when: number, amp: number): void {
  const { ctx } = vc;
  const n = createNoise(ctx, 0.025);
  const hp = createBiquad(ctx);
  hp.type = 'highpass';
  hp.frequency.value = 6000;
  const g = createGain(ctx);
  g.gain.setValueAtTime(amp * 0.4, when);
  g.gain.exponentialRampToValueAtTime(0.0001, when + 0.025);
  n.connect(hp).connect(g);
  connectVoice(vc, g);
  n.start(when); n.stop(when + 0.03);
}

function zils(vc: VoiceCtx, when: number, amp: number): void {
  const { ctx } = vc;
  // Three detuned sine partials + a HP noise tail — high wet send to
  // emphasize the shimmer.
  const freqs = [3100, 5200, 7300];
  freqs.forEach((f, i) => {
    const osc = createOsc(ctx);
    osc.type = 'sine';
    osc.frequency.value = f;
    const g = createGain(ctx);
    g.gain.setValueAtTime(0, when);
    g.gain.linearRampToValueAtTime(amp * (0.15 - i * 0.03), when + 0.002);
    g.gain.exponentialRampToValueAtTime(0.0001, when + 0.4);
    osc.connect(g);
    connectVoice(vc, g, 1.5);
    osc.start(when); osc.stop(when + 0.45);
  });
  const n = createNoise(ctx, 0.3);
  const hp = createBiquad(ctx);
  hp.type = 'highpass';
  hp.frequency.value = 4000;
  const ng = createGain(ctx);
  ng.gain.setValueAtTime(amp * 0.12, when);
  ng.gain.exponentialRampToValueAtTime(0.0001, when + 0.3);
  n.connect(hp).connect(ng);
  connectVoice(vc, ng, 1.5);
  n.start(when); n.stop(when + 0.32);
}

function slap(vc: VoiceCtx, when: number, amp: number): void {
  const { ctx } = vc;
  const n = createNoise(ctx, 0.12);
  const bp = createBiquad(ctx);
  bp.type = 'bandpass';
  bp.frequency.value = 700;
  bp.Q.value = 1.2;
  const g = createGain(ctx);
  g.gain.setValueAtTime(amp * 0.7, when);
  g.gain.exponentialRampToValueAtTime(0.0001, when + 0.12);
  n.connect(bp).connect(g);
  connectVoice(vc, g);
  n.start(when); n.stop(when + 0.14);
}

export const kitFrameDrum: KitRecipe = {
  id: 'frameDrum',
  name: 'Frame Drum',
  reverbSend: 0.08,
  voices: {
    KK: doum,
    SN: tek,
    HH: fingerSnap,
    OH: zils,
    CP: slap,
  },
};
