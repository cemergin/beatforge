// ChannelStrip — per-channel audio bus. Owns the live AudioNodes
// that sit between a voice machine's output and the kit's master /
// reverb / delay buses.
//
//   voice → [pan] → [level] → [colorFx?] ─┬─→ master
//                                         ├─→ × revSend ─→ reverb
//                                         └─→ × dlySend ─→ delay
//
// The voice machine writes its output into the strip's `input` node.
// We construct one ChannelStrip per kit channel at SoundEngine init
// and tear them down on kit change.
//
// Color FX is a swappable subgraph — when the user picks a different
// type, we dispose the current FxInstance and build a new one.

import type { ColorFx } from '../../patterns/types-sound';

export interface ChannelStripParams {
  level: number;        // 0-1
  pan: number;          // -1..1
  reverbSend: number;   // 0-1
  delaySend: number;    // 0-1
}

interface FxInstance {
  input: AudioNode;
  output: AudioNode;
  dispose(): void;
}

type FxBuilder = (cfg: ColorFx, ctx: AudioContext) => FxInstance;

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
  private currentColor: FxInstance | null = null;
  private fxBuilder: FxBuilder | null = null;

  constructor(
    ctx: AudioContext,
    masterIn: AudioNode,
    revBus: AudioNode | null,
    dlyBus: AudioNode | null,
    fxBuilder: FxBuilder | null,
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

  /** Swap the channel's color FX. Disposes the previous instance,
   *  reconnects passthrough, then connects the new one. */
  applyColorFx(cfg: ColorFx): void {
    // Disconnect current routing first to avoid duplicate edges.
    this.colorIn.disconnect();

    if (this.currentColor) {
      try { this.currentColor.dispose(); } catch { /* idempotent */ }
      this.currentColor = null;
    }

    if (cfg.type === 'none' || !this.fxBuilder) {
      this.colorIn.connect(this.colorOut);
      return;
    }

    const fx = this.fxBuilder(cfg, this.ctx);
    this.colorIn.connect(fx.input);
    fx.output.connect(this.colorOut);
    this.currentColor = fx;
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
