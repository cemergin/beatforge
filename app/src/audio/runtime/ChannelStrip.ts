// ChannelStrip — per-channel audio bus, expressed via the
// modules/audio-graph composition operators.
//
//   input → panner → level → colorIn ⇄ colorOut ─┬─→ master
//                                                ├─→ × revSend ─→ reverb
//                                                └─→ × dlySend ─→ delay
//
// Static prefix (input/panner/level/colorIn) is built with chain().
// Output side (colorOut/revSend/dlySend) is built with tap() so
// each send is a branched gain on the post-color signal — the same
// one the master path hears. Color FX is the only DYNAMIC piece;
// it lives between colorIn and colorOut and gets swapped in place
// when the user picks a different type.

import type { ColorFx } from '../../patterns/types-sound';
import {
  chain,
  tap,
  wrap,
  type AudioModule,
  type ControllableModule,
} from '../../modules/audio-graph';

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
  private level: GainNode;
  private panner: StereoPannerNode;
  private colorIn: GainNode;
  private colorOut: GainNode;
  /** Composed output side — colorOut → tap(rev) → tap(dly) → master.
   *  Owned so dispose() cascades through the composition operators
   *  without us tracking each gain individually. */
  private outputComposite: AudioModule;
  /** Send-gain handles surfaced from tap() — applyParams ramps
   *  these directly. */
  private revSend: GainNode;
  private dlySend: GainNode;

  /** Currently mounted color FX module + the type that built it.
   *  Re-using the module across knob changes (instead of rebuilding
   *  on every applyColorFx) means continuous ramps stay glitch-free. */
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

    // ── Static prefix ──────────────────────────────────────────────
    // input → panner → level → colorIn, all owned by this strip and
    // wired together via chain(). The composition handles connect()
    // for us; we just keep the raw node refs around to mutate
    // .gain / .pan in applyParams.
    this.input = ctx.createGain();
    this.panner = ctx.createStereoPanner();
    this.level = ctx.createGain();
    this.colorIn = ctx.createGain();
    this.colorOut = ctx.createGain();

    chain(
      wrap(this.input),
      wrap(this.panner),
      wrap(this.level),
      wrap(this.colorIn),
    );

    // Default passthrough — replaced when colorFx is set.
    this.colorIn.connect(this.colorOut);

    // ── Output side via tap() ──────────────────────────────────────
    // colorOut → master is the dry path. tap branches a side gain
    // into each send bus. Send levels start at 0; applyParams ramps.
    const dry = wrap(this.colorOut);
    const withRev = tap(ctx, dry, revBus ? wrap(revBus) : silentSink(ctx), 0);
    const withDly = tap(ctx, withRev, dlyBus ? wrap(dlyBus) : silentSink(ctx), 0);
    // Connect the post-tap output to master. tap() exposes the same
    // input/output as the wrapped main module, so withDly.output is
    // colorOut — connecting it to master gives the dry signal path.
    if (withDly.output) withDly.output.connect(masterIn);
    this.outputComposite = withDly;
    this.revSend = withRev.send;
    this.dlySend = withDly.send;
  }

  /** Apply mixer parameters (level/pan/sends). */
  applyParams(p: ChannelStripParams): void {
    this.level.gain.value = Math.max(0, Math.min(1, p.level));
    this.panner.pan.value = Math.max(-1, Math.min(1, p.pan));
    this.revSend.gain.value = Math.max(0, Math.min(1, p.reverbSend));
    this.dlySend.gain.value = Math.max(0, Math.min(1, p.delaySend));
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
    // Composed output side cleans up its own taps + send gains.
    try { this.outputComposite.dispose(); } catch { /* idempotent */ }
    this.input.disconnect();
    this.panner.disconnect();
    this.level.disconnect();
    this.colorIn.disconnect();
    this.colorOut.disconnect();
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

/** Throwaway sink — used when a strip is built without a reverb or
 *  delay bus (legacy AudioEngine paths). The tap still constructs a
 *  send gain so the topology is uniform; signal just falls into a
 *  disconnected gain that goes nowhere. */
function silentSink(ctx: AudioContext): AudioModule {
  const g = ctx.createGain();
  g.gain.value = 0;
  return wrap(g);
}
