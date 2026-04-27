// Event union for the BeatForge platform's control plane.
//
// The bus is the medium through which the sequencer, MIDI input, UI
// knobs, automation lanes, and recorders all talk. Producers emit;
// consumers subscribe. Zero Web Audio dependency — synchronous,
// mockable, testable.
//
// Address conventions (target / channel.* paths):
//   channel.0                          → trigger the voice on channel 0
//   channel.0.color.cutoff             → param on channel 0's color FX
//   channel.0.level                    → param on channel 0's level gain
//   master.reverb.size                 → param on the master reverb bus
//   bar / step / clock                 → time markers, no target
//
// Address strings are NOT validated at the type level — the router
// looks them up at dispatch time. This is intentional: addresses are
// data (savable, MIDI-mappable) and should stay open-ended.

/** Fire a one-shot voice. Velocity is normalized 0..1 at the boundary
 *  so MIDI note-on / UI clicks / automation all use the same scale. */
export interface TriggerEvent {
  type: 'trigger';
  /** Voice address — typically `channel.<n>`. Router routes to the
   *  registered voice handler at this address. */
  target: string;
  velocity: number;
  /** Audio-clock time. Schedule sample-accurate via Web Audio. */
  when: number;
  /** Optional per-trigger overrides for the voice's tunable knobs.
   *  e.g., { pitch: 220, decay: 0.3 } — the voice consumes only the
   *  keys it knows about; unknown keys are ignored. */
  mod?: Record<string, number>;
}

/** Release a held voice. Currently unused (all voices are one-shot)
 *  but reserved so we don't have to break the Event union when a
 *  sustaining voice (drone, pad) lands. */
export interface ReleaseEvent {
  type: 'release';
  target: string;
  when: number;
}

/** Tweak a continuous or discrete parameter on a controllable module.
 *  The router walks the dotted address to find the module + sets the
 *  named param. `ramp` is a hint — modules decide how to apply it
 *  (continuous params usually linearRampToValueAtTime; discrete ones
 *  ignore it). */
export interface ParamEvent {
  type: 'param';
  target: string;
  value: number | string;
  /** Audio-clock time. Default = ctx.currentTime at dispatch. */
  when?: number;
  /** Glide duration in seconds. Default = 0.015 (15ms anti-zip). */
  ramp?: number;
}

/** Bar boundary — fired by the sequencer, consumed by the trainer,
 *  the recorder, and the UI's bar counter. */
export interface BarEvent {
  type: 'bar';
  bar: number;
  when: number;
}

/** Per-channel step boundary. UI cursor consumers subscribe to keep
 *  visualizers in lock-step with audio. */
export interface StepEvent {
  type: 'step';
  channel: number;
  step: number;
  when: number;
}

/** Transport state change — play / stop / locate to a bar. */
export interface TransportEvent {
  type: 'transport';
  action: 'play' | 'stop' | 'locate';
  when: number;
  bar?: number;
}

/** 24ppq clock from external sync (or our own emit-to-MIDI-out). */
export interface ClockEvent {
  type: 'clock';
  tick: number;
  when: number;
}

/** Pattern lifecycle — load, kit-changed. The payload type is the
 *  caller's responsibility (usually the loaded SoundPattern), so the
 *  bus stays decoupled from the pattern type. */
export interface PatternEvent {
  type: 'pattern';
  action: 'load' | 'kit-changed';
  payload: unknown;
  when: number;
}

export type Event =
  | TriggerEvent
  | ReleaseEvent
  | ParamEvent
  | BarEvent
  | StepEvent
  | TransportEvent
  | ClockEvent
  | PatternEvent;

export type EventType = Event['type'];

/** Subscribe handler — receives the narrowed event type. The
 *  Extract<…> ensures TS infers the right shape per type. */
export type EventHandler<T extends EventType> = (
  event: Extract<Event, { type: T }>,
) => void;

/** Unsubscribe — calling it once removes the listener. Idempotent. */
export type Unsubscribe = () => void;

export interface EventBus {
  emit(event: Event): void;
  on<T extends EventType>(type: T, fn: EventHandler<T>): Unsubscribe;
  /** Subscribe to ALL events. Useful for loggers / recorders. */
  onAny(fn: (event: Event) => void): Unsubscribe;
}
