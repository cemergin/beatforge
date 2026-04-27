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

/** Voice handler — invoked when a TriggerEvent arrives at a registered
 *  voice address. Typically calls `triggerVoice(cfg, vc, when, amp)`
 *  inside SoundEngine, but the router itself is voice-machine-agnostic. */
export type VoiceHandler = (event: TriggerEvent) => void;

export interface Router {
  /** Register a controllable module at the given address. Later
   *  ParamEvents with this target (or one rooted here) dispatch to
   *  the module's .set(). Returns an unsubscribe — calling it
   *  removes the registration but doesn't dispose the module. */
  registerModule(address: string, module: ControllableModule): Unsubscribe;

  /** Register a voice trigger handler. Multiple voices can share an
   *  address (the most recent registration wins) — typical when a
   *  channel's voice machine is swapped. */
  registerVoice(address: string, handler: VoiceHandler): Unsubscribe;

  /** Bind to an EventBus so ParamEvents and TriggerEvents auto-
   *  dispatch. Returns a single unsubscribe that detaches both
   *  subscriptions. Calling bindBus more than once on the same bus
   *  stacks listeners — caller's responsibility to manage. */
  bindBus(bus: EventBus): Unsubscribe;
}
