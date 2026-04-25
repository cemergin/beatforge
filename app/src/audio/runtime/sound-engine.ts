// SoundEngine — lightweight audio runtime dedicated to the Sound page.
//
// Lives BESIDE the production AudioEngine in audio/engine.ts; doesn't
// touch it. The Sound page tolerates a simpler scheduling model than
// Practice's sample-accurate metronome — it's a synth lab, not a
// click track. Triggers fire on demand from UI clicks / keyboard.
//
// Phase 2 will probably keep this as a separate engine (different
// quality bar) and converge only the machine-registry dispatch.

import { triggerVoice } from '../machines/registry';
import type { MachineConfig, VoiceCtx } from '../machines/types';
import { createAudioContext, resumeIfSuspended } from '../audio-context';

export class SoundEngine {
  private ctx: AudioContext | null = null;
  private master: GainNode | null = null;
  private analyser: AnalyserNode | null = null;
  /** Race guard: two simultaneous `ensureCtx()` calls (e.g. two
   *  rapid keypresses before the first context resolves) must not
   *  build two parallel audio graphs. Mirrors AudioEngine's pattern. */
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
        // Clear so a future re-init (after dispose, HMR) can run.
        this.ctxInitPromise = null;
      });
    }
    await this.ctxInitPromise;
  }

  private async initCtxOnce(): Promise<void> {
    const ctx = createAudioContext();
    if (!ctx) return;   // Web Audio not supported — silently no-op
    const master = ctx.createGain();
    master.gain.value = 0.85;
    const analyser = ctx.createAnalyser();
    analyser.fftSize = 1024;
    analyser.smoothingTimeConstant = 0.78;
    master.connect(analyser);
    analyser.connect(ctx.destination);
    // Atomic commit — either everything is set or nothing is.
    this.ctx = ctx;
    this.master = master;
    this.analyser = analyser;
  }

  /** Schedule a one-shot trigger of `cfg`'s machine. Routes through
   *  the master gain (and thus the analyser) so the spectrum view
   *  reflects what the user hears. */
  trigger(cfg: MachineConfig, amp = 1.0): void {
    if (!this.ctx || !this.master) return;
    const vc: VoiceCtx = { ctx: this.ctx, destination: this.master };
    const when = this.ctx.currentTime + 0.005;
    triggerVoice(cfg, vc, when, amp);
  }

  /** Hand the AnalyserNode out for the spectrum component. Returns
   *  null until ensureCtx() has run. */
  getAnalyser(): AnalyserNode | null {
    return this.analyser;
  }

  setMasterVolume(v: number): void {
    if (!this.master) return;
    this.master.gain.value = Math.max(0, Math.min(1, v));
  }

  dispose(): void {
    if (this.ctx && this.ctx.state !== 'closed') void this.ctx.close();
    this.ctx = null;
    this.master = null;
    this.analyser = null;
  }
}
