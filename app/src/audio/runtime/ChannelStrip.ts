// ChannelStrip — per-channel audio bus. Owns the live AudioNodes
// that sit between a voice machine's output and the kit's master /
// reverb / delay buses.
//
//   voice → [pan] → [level] → [colorFx?] ─┬─→ master
//                                         ├─→ × revSend ─→ reverb
//                                         └─→ × dlySend ─→ delay
//
// Color FX is a swappable subgraph — when the user picks a
// different type, we dispose the current ControllableModule and
// build a new one. While a type stays put, knob changes go through
// the module's .set() — live ramps, no rebuilds, no clicks.

import type { ColorFx } from '../../patterns/types-sound';
import type { ControllableModule } from '../../modules/audio-graph';

export interface ChannelStripParams {
  level: number;        // 0-1
  pan: number;          // -1..1
  reverbSend: number;   // 0-1
  delaySend: number;    // 0-1
}

/** Build the active color FX as a ControllableModule. Returns null
 *  to signal "passthrough" (e.g. for `type: 'none'`); the strip
 *  reconnects colorIn → colorOut directly when that happens. */
type ColorFxBuilder = (cfg: ColorFx, ctx: AudioContext) => ControllableModule | null;

export class ChannelStrip {
  /** Voice machines connect their tail nodes into this. */
  readonly input: GainNode;

  private ctx: AudioContext;
  private panner: StereoPannerNode;
  private level: GainNode;
  private colorIn: GainNode;
  private colorOut: GainNode;
  private revTap: GainNode;
  private dlyTap: GainNode;
  /** Currently mounted color FX module + the type that built it.
   *  Re-using the module across knob changes (instead of rebuilding
   *  on every .applyColorFx) means continuous ramps stay glitch-free. */
  private currentColor: ControllableModule | null = null;
  private currentColorType: ColorFx['type'] = 'none';
  private fxBuilder: ColorFxBuilder | null = null;

  constructor(
    ctx: AudioContext,
    masterIn: AudioNode,
    revBus: AudioNode | null,
    dlyBus: AudioNode | null,
    fxBuilder: ColorFxBuilder | null,
  ) {
    this.ctx = ctx;
    this.fxBuilder = fxBuilder;

    // The chain: input → pan → level → colorIn ⇄ colorOut → master
    // The reverb/delay taps are post-color, so they hear the channel
    // at its mixed/colored sound.
    this.input = ctx.createGain();
    this.panner = ctx.createStereoPanner();
    this.level = ctx.createGain();
    this.colorIn = ctx.createGain();
    this.colorOut = ctx.createGain();
    this.revTap = ctx.createGain();
    this.revTap.gain.value = 0;
    this.dlyTap = ctx.createGain();
    this.dlyTap.gain.value = 0;

    this.input.connect(this.panner);
    this.panner.connect(this.level);
    this.level.connect(this.colorIn);
    // Default passthrough — replaced when colorFx is set.
    this.colorIn.connect(this.colorOut);

    this.colorOut.connect(masterIn);
    if (revBus) this.colorOut.connect(this.revTap).connect(revBus);
    if (dlyBus) this.colorOut.connect(this.dlyTap).connect(dlyBus);
  }

  /** Apply mixer parameters (level/pan/sends). */
  applyParams(p: ChannelStripParams): void {
    this.level.gain.value = Math.max(0, Math.min(1, p.level));
    this.panner.pan.value = Math.max(-1, Math.min(1, p.pan));
    this.revTap.gain.value = Math.max(0, Math.min(1, p.reverbSend));
    this.dlyTap.gain.value = Math.max(0, Math.min(1, p.delaySend));
  }

  /** Swap or update the channel's color FX.
   *
   *  - Type unchanged: forward each knob to the live module's set()
   *    — continuous ramps, no rebuild, no clicks.
   *  - Type changed (or first install): dispose the prior module,
   *    build a new one for the new type, reconnect the strip's
   *    color path through it.
   *  - type='none': dispose, leave passthrough connected. */
  applyColorFx(cfg: ColorFx): void {
    // Same type → push knob updates into the live module.
    if (this.currentColorType === cfg.type && this.currentColor) {
      pushKnobs(this.currentColor, cfg);
      return;
    }

    // Different type → tear down + rebuild.
    this.colorIn.disconnect();
    if (this.currentColor) {
      try { this.currentColor.dispose(); } catch { /* idempotent */ }
      this.currentColor = null;
    }

    if (cfg.type === 'none' || !this.fxBuilder) {
      this.colorIn.connect(this.colorOut);
      this.currentColorType = 'none';
      return;
    }

    const fx = this.fxBuilder(cfg, this.ctx);
    if (!fx || !fx.input || !fx.output) {
      this.colorIn.connect(this.colorOut);
      this.currentColorType = 'none';
      return;
    }
    this.colorIn.connect(fx.input);
    fx.output.connect(this.colorOut);
    this.currentColor = fx;
    this.currentColorType = cfg.type;
  }

  /** Direct access to the color FX module for the router — it can
   *  call .set() to ramp params without going through applyColorFx
   *  + a full cfg rebuild. Returns null when no FX is mounted. */
  getColorFxModule(): ControllableModule | null {
    return this.currentColor;
  }

  dispose(): void {
    if (this.currentColor) {
      try { this.currentColor.dispose(); } catch { /* idempotent */ }
    }
    this.input.disconnect();
    this.panner.disconnect();
    this.level.disconnect();
    this.colorIn.disconnect();
    this.colorOut.disconnect();
    this.revTap.disconnect();
    this.dlyTap.disconnect();
  }
}

/** Forward each tunable field of a ColorFx config into the live
 *  ControllableModule's .set(). The cfg is the discriminated union
 *  per type — we narrow per branch so the assignments are typed. */
function pushKnobs(mod: ControllableModule, cfg: ColorFx): void {
  if (cfg.type === 'overdrive') {
    mod.set('drive', cfg.drive);
    mod.set('tone',  cfg.tone);
    mod.set('mix',   cfg.mix);
  } else if (cfg.type === 'bitcrush') {
    mod.set('bits', cfg.bits);
    mod.set('rate', cfg.rate);
    mod.set('mix',  cfg.mix);
  } else if (cfg.type === 'filter') {
    mod.set('mode',   cfg.mode);
    mod.set('cutoff', cfg.cutoff);
    mod.set('q',      cfg.q);
    mod.set('mix',    cfg.mix);
  }
}
