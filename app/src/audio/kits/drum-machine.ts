// 808/909/707 — the "drum-machine family" (Western analog kits).
// All three share the same branching recipe: kick is a downward sine
// sweep with optional click transient; snare is two-osc body + filtered
// noise; hi-hats are HP→BP filtered noise; clap is three stacked noise
// bursts. Per-kit parameter tables live inside each voice.
//
// 727 lives in tr-727.ts — its voice mapping (congas/cowbell/claves) is
// different enough to not fit this branching shape.

import type { KitRecipe, VoiceCtx } from './types';
import { connectVoice } from './types';
import { createBiquad, createGain, createNoise, createOsc } from './_util';

type Kind = '808' | '909' | '707';

function kickVoice(kind: Kind): (vc: VoiceCtx, when: number, amp: number) => void {
  return (vc, when, amp) => {
    const { ctx } = vc;
    const osc = createOsc(ctx);
    const gain = createGain(ctx);
    const f0 = kind === '909' ? 180 : kind === '707' ? 140 : 150;
    const f1 = kind === '909' ? 42 : kind === '707' ? 55 : 40;
    const dec = kind === '909' ? 0.35 : kind === '707' ? 0.28 : 0.6;
    osc.frequency.setValueAtTime(f0, when);
    osc.frequency.exponentialRampToValueAtTime(f1, when + 0.08);
    gain.gain.setValueAtTime(0, when);
    gain.gain.linearRampToValueAtTime(amp * 1.1, when + 0.003);
    gain.gain.exponentialRampToValueAtTime(0.0001, when + dec);
    osc.connect(gain);
    connectVoice(vc, gain);
    // 909 / 707 get an extra square click transient; 808 is pure sine.
    if (kind !== '808') {
      const click = createOsc(ctx);
      const cg = createGain(ctx);
      click.frequency.value = 2400;
      click.type = 'square';
      cg.gain.setValueAtTime(amp * 0.2, when);
      cg.gain.exponentialRampToValueAtTime(0.0001, when + 0.01);
      click.connect(cg);
      connectVoice(vc, cg);
      click.start(when); click.stop(when + 0.02);
    }
    osc.start(when);
    osc.stop(when + dec + 0.05);
  };
}

function snareVoice(kind: Kind): (vc: VoiceCtx, when: number, amp: number) => void {
  return (vc, when, amp) => {
    const { ctx } = vc;
    const o1 = createOsc(ctx);
    const o2 = createOsc(ctx);
    o1.frequency.value = kind === '909' ? 220 : 185;
    o2.frequency.value = kind === '909' ? 380 : 349;
    const og = createGain(ctx);
    og.gain.setValueAtTime(0, when);
    og.gain.linearRampToValueAtTime(amp * 0.5, when + 0.002);
    og.gain.exponentialRampToValueAtTime(0.0001, when + 0.08);
    o1.connect(og); o2.connect(og);
    connectVoice(vc, og);
    o1.start(when); o2.start(when);
    o1.stop(when + 0.12); o2.stop(when + 0.12);

    const noise = createNoise(ctx, 0.18);
    const nFilt = createBiquad(ctx);
    nFilt.type = 'bandpass';
    nFilt.frequency.value = kind === '909' ? 2400 : 1800;
    nFilt.Q.value = 0.6;
    const ng = createGain(ctx);
    const dec = kind === '707' ? 0.09 : 0.15;
    ng.gain.setValueAtTime(0, when);
    ng.gain.linearRampToValueAtTime(amp * 0.7, when + 0.002);
    ng.gain.exponentialRampToValueAtTime(0.0001, when + dec);
    noise.connect(nFilt).connect(ng);
    connectVoice(vc, ng);
    noise.start(when); noise.stop(when + dec + 0.02);
  };
}

function hatVoice(open: boolean): (vc: VoiceCtx, when: number, amp: number) => void {
  return (vc, when, amp) => {
    const { ctx } = vc;
    const dec = open ? 0.32 : 0.05;
    const noise = createNoise(ctx, dec + 0.05);
    const hp = createBiquad(ctx);
    hp.type = 'highpass';
    hp.frequency.value = 7000;
    const bp = createBiquad(ctx);
    bp.type = 'bandpass';
    bp.frequency.value = 10000;
    bp.Q.value = 1.2;
    const g = createGain(ctx);
    g.gain.setValueAtTime(0, when);
    g.gain.linearRampToValueAtTime(amp * 0.4, when + 0.001);
    g.gain.exponentialRampToValueAtTime(0.0001, when + dec);
    noise.connect(hp).connect(bp).connect(g);
    connectVoice(vc, g);
    noise.start(when);
    noise.stop(when + dec + 0.05);
  };
}

function clapVoice(vc: VoiceCtx, when: number, amp: number): void {
  const { ctx } = vc;
  // Three stacked 12ms-offset noise bursts → the hand-clap flutter.
  for (let i = 0; i < 3; i++) {
    const t = when + i * 0.012;
    const n = createNoise(ctx, 0.05);
    const f = createBiquad(ctx);
    f.type = 'bandpass';
    f.frequency.value = 1200;
    f.Q.value = 0.8;
    const g = createGain(ctx);
    g.gain.setValueAtTime(0, t);
    g.gain.linearRampToValueAtTime(amp * 0.5, t + 0.002);
    g.gain.exponentialRampToValueAtTime(0.0001, t + 0.06);
    n.connect(f).connect(g);
    connectVoice(vc, g);
    n.start(t); n.stop(t + 0.08);
  }
}

function buildKit(kind: Kind, name: string, reverbSend: number): KitRecipe {
  return {
    id: kind,
    name,
    reverbSend,
    voices: {
      KK: kickVoice(kind),
      SN: snareVoice(kind),
      HH: hatVoice(false),
      OH: hatVoice(true),
      CP: clapVoice,
    },
  };
}

export const kit808 = buildKit('808', 'TR-808', 0.05);
export const kit909 = buildKit('909', 'TR-909', 0.05);
export const kit707 = buildKit('707', 'TR-707', 0.10);
