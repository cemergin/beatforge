// Router — address-based dispatch from the EventBus into the audio
// graph. Producers emit ParamEvents with target like
// `channel.0.color.cutoff`; the router walks the address, finds the
// registered ControllableModule, and calls its .set() with the value.
//
// The router doesn't care WHERE events come from. UI knobs, MIDI CCs,
// automation lanes, and saved-state hydration all dispatch through
// the same router via the bus.

import type { ControllableModule } from '../audio-graph/types';
import type { EventBus, TriggerEvent, Unsubscribe } from '../events';

/** A bus address — a dotted path the router resolves into a module +
 *  param. Template-literal type so a typo like `master.gain.gain` is
 *  a compile error at the producer rather than a silent dead mapping
 *  at the consumer. Bus events themselves still carry plain strings
 *  (incoming MIDI / persisted automation / external sources) — the
 *  branded form is for code we control.
 *
 *  Examples:
 *    `channel.0`              — channel mixer (level/pan/sends)
 *    `channel.0.color`        — color FX module
 *    `channel.0.machine`      — voice machine
 *    `master.gain`            — output gain bus
 *    `master.reverb`          — reverb FX module
 *
 *  Use the helper constructors below in producer code; raw strings
 *  are still valid in event payloads (`.target: string`). */
export type BusAddress =
  | `channel.${number}`
  | `channel.${number}.${string}`
  | `master.${string}`;

/** Address of a per-channel mixer. */
export function channelAddress(channelIdx: number): BusAddress {
  return `channel.${channelIdx}`;
}

/** Address of a per-channel sub-module (color, machine, …). */
export function channelSubAddress(channelIdx: number, sub: string): BusAddress {
  return `channel.${channelIdx}.${sub}`;
}

/** Address of a master-bus module (gain, dry, reverb, delay, …). */
export function masterAddress(name: string): BusAddress {
  return `master.${name}`;
}

/** Voice handler — invoked when a TriggerEvent arrives at a registered
 *  voice address. Typically calls `triggerVoice(cfg, vc, when, amp)`
 *  inside SoundEngine, but the router itself is voice-machine-agnostic. */
export type VoiceHandler = (event: TriggerEvent) => void;

export interface Router {
  /** Register a controllable module at the given address. Later
   *  ParamEvents with this target (or one rooted here) dispatch to
   *  the module's .set(). Returns an unsubscribe — calling it
   *  removes the registration but doesn't dispose the module.
   *  Address is BusAddress so producers can't smuggle in a typo. */
  registerModule(address: BusAddress, module: ControllableModule): Unsubscribe;

  /** Register a voice trigger handler. Multiple voices can share an
   *  address (the most recent registration wins) — typical when a
   *  channel's voice machine is swapped. */
  registerVoice(address: BusAddress, handler: VoiceHandler): Unsubscribe;

  /** Bind to an EventBus so ParamEvents and TriggerEvents auto-
   *  dispatch. Returns a single unsubscribe that detaches both
   *  subscriptions. Calling bindBus more than once on the same bus
   *  stacks listeners — caller's responsibility to manage. */
  bindBus(bus: EventBus): Unsubscribe;
}
