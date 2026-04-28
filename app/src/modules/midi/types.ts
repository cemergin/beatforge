// MIDI module — bridge between Web MIDI and the EventBus.
//
// Producers: physical knob, USB pad, MIDI keyboard, DAW out.
// Bridge:    bindInput(input, mappings) listens to MIDIMessageEvents
//            and translates them to TriggerEvent / ParamEvent based
//            on the user-supplied mapping table.
// Consumer:  the router (already bound to the bus) dispatches each
//            translated event into the audio plane through the same
//            address tree the UI knobs use.
//
// Mappings are DATA — pure JSON, savable, MIDI-learn-able. When a
// user moves a knob and we record `{ cc: 74, channel: 0 } →
// 'channel.0.color.cutoff' { scale: { min: 200, max: 12000 } }`,
// every knob move on that physical control thereafter sweeps the
// filter without touching code.
//
// Web MIDI shapes — kept structural so tests can mock without
// pulling in the full @types/webmidi surface.

export interface MidiInputLike {
  id: string;
  name?: string | null;
  manufacturer?: string | null;
  /** Web MIDI fires `midimessage` with an event whose `.data` is
   *  Uint8Array of [status, byte1, byte2]. */
  addEventListener(
    type: 'midimessage',
    listener: (event: { data: Uint8Array }) => void,
  ): void;
  removeEventListener(
    type: 'midimessage',
    listener: (event: { data: Uint8Array }) => void,
  ): void;
}

export interface MidiOutputLike {
  id: string;
  name?: string | null;
  send(data: number[] | Uint8Array, timestamp?: number): void;
}

export interface MidiAccessLike {
  inputs: { values(): IterableIterator<MidiInputLike> };
  outputs: { values(): IterableIterator<MidiOutputLike> };
}

/** A single mapping entry. `match` describes which MIDI message
 *  triggers this rule; `to` is the address + event shape we emit
 *  on the bus. */
export type MidiInputMap =
  | TriggerMap
  | ParamMap;

/** Map a NOTE-ON to a TriggerEvent at a fixed address. velocity is
 *  pulled from the MIDI message and normalized 0..1. */
export interface TriggerMap {
  kind: 'note';
  /** 0..15. Optional — omit to match any MIDI channel. */
  channel?: number;
  /** Optional note number filter (e.g. only respond to note 36). */
  note?: number;
  /** Address to emit the TriggerEvent at — typically `channel.<n>`. */
  toAddress: string;
}

/** Map a CC to a ParamEvent. The CC value (0..127) is normalized via
 *  `scale` before emission. */
export interface ParamMap {
  kind: 'cc';
  /** 0..15. Optional — omit to match any MIDI channel. */
  channel?: number;
  /** CC number (0..127). */
  cc: number;
  toAddress: string;
  /** How to map the 0..127 byte value to a number param value.
   *   - 'linear': v / 127
   *   - { min, max, curve }: lerp from min to max along curve;
   *     curve='exp' gives perceptually-even pitch / Hz mappings. */
  scale?: 'linear' | { min: number; max: number; curve?: 'lin' | 'exp' };
  /** Glide duration the router passes to ControllableModule.set(). */
  ramp?: number;
}

export interface BindInputOptions {
  /** Optional clock source for ParamEvent.when. Default: omitted (router
   *  treats as "now"). */
  clock?: () => number;
}

export interface MidiModule {
  /** Web MIDI permission + access. The browser prompts on first call.
   *  Tests skip this — they hand a stub MIDIAccess to attach(). */
  enable(): Promise<MidiAccessLike>;

  /** Use a pre-existing MIDIAccess (e.g. tests, or apps that obtain
   *  it themselves). After attach() the module's input + output
   *  enumeration is available. */
  attach(access: MidiAccessLike): void;

  inputs(): MidiInputLike[];
  outputs(): MidiOutputLike[];

  /** Bind an input to a mapping table. Returns an unsubscribe that
   *  removes the listener. */
  bindInput(input: MidiInputLike, mappings: readonly MidiInputMap[], opts?: BindInputOptions): () => void;
}
