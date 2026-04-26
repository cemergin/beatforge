// SoundEngine — lightweight audio runtime dedicated to the Sound page.
//
// Lives BESIDE the production AudioEngine in audio/engine.ts; doesn't
// touch it. Owns its own audio graph: master + analyser + 5 channel
// strips. Voice triggers are routed through their channel's strip so
// each channel's mixer (level/pan/sends/colorFx) and the upcoming
// kit FX bus take effect.

import { triggerVoice } from '../machines/registry';
import type { MachineConfig, VoiceCtx } from '../machines/types';
import { createAudioContext, resumeIfSuspended } from '../audio-context';
import type { ChannelEffects } from '../../patterns/types-sound';
import { ChannelStrip, type ChannelStripParams } from './ChannelStrip';

const NUM_CHANNELS = 5;

export class SoundEngine {
  private ctx: AudioContext | null = null;
  private master: GainNode | null = null;
  private analyser: AnalyserNode | null = null;
  private strips: ChannelStrip[] = [];
  private ctxInitPromise: Promise<void> | null = null;

  /** Resume / construct the AudioContext on first user interaction.
   *  Safe to call concurrently — second caller awaits the first's
   *  in-flight promise. */
  async ensureCtx(): Promise<void> {
    if (this.ctx) {
      await resumeIfSuspended(this.ctx);
      return;
    }
    if (!this.ctxInitPromise) {
      this.ctxInitPromise = this.initCtxOnce().finally(() => {
        this.ctxInitPromise = null;
      });
    }
    await this.ctxInitPromise;
  }

  private async initCtxOnce(): Promise<void> {
    const ctx = createAudioContext();
    if (!ctx) return;
    const master = ctx.createGain();
    master.gain.value = 0.85;
    const analyser = ctx.createAnalyser();
    analyser.fftSize = 1024;
    analyser.smoothingTimeConstant = 0.78;
    master.connect(analyser);
    analyser.connect(ctx.destination);

    // Build per-channel strips. revBus / dlyBus stay null until the
    // kit FX bus lands — sends are routed through the strip but go
    // nowhere yet (silently). Master receives every channel.
    const strips: ChannelStrip[] = [];
    for (let i = 0; i < NUM_CHANNELS; i++) {
      strips.push(new ChannelStrip(ctx, master, null, null, null));
    }

    this.ctx = ctx;
    this.master = master;
    this.analyser = analyser;
    this.strips = strips;
  }

  /** Trigger a voice on a specific channel. The voice's tail node
   *  connects into the channel's strip so the mixer + FX are honored. */
  trigger(channelIdx: number, cfg: MachineConfig, amp = 1.0): void {
    if (!this.ctx) return;
    const strip = this.strips[channelIdx];
    if (!strip) return;
    const vc: VoiceCtx = { ctx: this.ctx, destination: strip.input };
    const when = this.ctx.currentTime + 0.005;
    triggerVoice(cfg, vc, when, amp);
  }

  /** Apply mixer params (level/pan/sends) to a specific channel. */
  applyChannelParams(channelIdx: number, params: ChannelStripParams): void {
    const strip = this.strips[channelIdx];
    if (strip) strip.applyParams(params);
  }

  /** Apply (or clear) the channel's color FX. Currently no FX builder
   *  is wired — passes through to the master. Phase 1 next-up: wire
   *  the overdrive/bitcrush/filter FX machines. */
  applyChannelEffects(channelIdx: number, effects: ChannelEffects): void {
    const strip = this.strips[channelIdx];
    if (!strip) return;
    strip.applyParams(effects);
    strip.applyColorFx(effects.colorFx);
  }

  getAnalyser(): AnalyserNode | null {
    return this.analyser;
  }

  setMasterVolume(v: number): void {
    if (!this.master) return;
    this.master.gain.value = Math.max(0, Math.min(1, v));
  }

  dispose(): void {
    for (const s of this.strips) {
      try { s.dispose(); } catch { /* idempotent */ }
    }
    this.strips = [];
    if (this.ctx && this.ctx.state !== 'closed') void this.ctx.close();
    this.ctx = null;
    this.master = null;
    this.analyser = null;
  }
}
