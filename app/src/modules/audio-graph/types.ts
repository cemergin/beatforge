// AudioModule — the composable building block for the audio plane.
//
// Every "brick" of the graph (a gain stage, a filter, a reverb, a
// channel strip, a whole sub-mixer) implements the same shape:
//   - an input node (where signal enters)
//   - an output node (where signal leaves)
//   - a dispose() (clean teardown of every Web Audio node it owns)
//
// Composition operators (chain / parallel / tap) take AudioModules
// in and return an AudioModule out — so any composed graph IS itself
// an AudioModule and can be composed further. That's the whole game.
//
// ControllableModule extends AudioModule with addressable params.
// The router walks an address, finds the module, and calls .set() —
// MIDI CCs, UI knobs, automation lanes all dispatch through the same
// setter. ParamSpec drives the schema for the router's address tree
// + the UI form generator + the JSON serializer.

/** A piece of the audio plane. Pure data flow — no event emission,
 *  no scheduling, no params. Use ControllableModule for anything the
 *  router needs to address. */
export interface AudioModule {
  /** Where signal enters. null for pure sources (oscillator, sample
   *  player, voice machine outputs). */
  input: AudioNode | null;
  /** Where signal leaves. null for pure sinks (analyser, destination). */
  output: AudioNode | null;
  /** Tear down everything this module owns. Disconnect, stop OSCs,
   *  zero gains, drop refs. Idempotent — safe to call twice. */
  dispose(): void;
}

/** Schema for one tunable knob on a module. Drives:
 *   - the auto-generated UI form
 *   - the router's address tree (params can be addressed by name)
 *   - the MIDI-learn binding ("CC #74 → channel.0.color.cutoff")
 *   - JSON serialization of patches / kits
 *
 *  Three flavours of param:
 *   - 'continuous' — a number with min/max, lerps with linearRampToValueAtTime
 *   - 'discrete'   — a string from a fixed option set, applied immediately
 *   - 'structural' — anything that requires a node rebuild (reverb size,
 *                    waveshaper curve), applied immediately, no glide
 */
export interface ParamSpec {
  name: string;
  kind: 'continuous' | 'discrete' | 'structural';
  /** continuous only */
  min?: number;
  /** continuous only */
  max?: number;
  /** discrete only — the legal value set */
  options?: readonly string[];
  /** Display unit for the UI. 'Hz' | '%' | 'ms' | 'dB' | '' */
  unit?: string;
  /** Initial value. Type matches kind: continuous/structural→number,
   *  discrete→string. */
  default: number | string;
}

/** Options for ControllableModule.set(). Callers may pass `when` to
 *  schedule a future change (automation lanes, MIDI bound to a future
 *  trigger), and `ramp` for a glide duration on continuous params. */
export interface SetOptions {
  /** Audio-clock time. Default: ctx.currentTime at dispatch. */
  when?: number;
  /** Glide duration in seconds for continuous params. Default 0.015
   *  to defeat zipper noise on UI-rate updates. */
  ramp?: number;
}

/** An AudioModule with addressable parameters. The universal setter
 *  dispatches based on the param's ParamSpec.kind:
 *   - continuous: AudioParam.linearRampToValueAtTime(value, when + ramp)
 *   - discrete:   immediate switch (e.g. biquad.type = options[…])
 *   - structural: rebuild (e.g. swap an impulse response buffer)
 */
export interface ControllableModule extends AudioModule {
  /** Schema. Static across the module's lifetime — exposed once at
   *  registration. */
  readonly params: readonly ParamSpec[];

  /** Universal setter. Caller passes the param NAME (not an index) so
   *  saved patches survive ParamSpec reordering. Unknown names are
   *  ignored — modules choose to be permissive about stale automation
   *  rather than throw. */
  set(name: string, value: number | string, opts?: SetOptions): void;
}
