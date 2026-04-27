// Event bus — synchronous pub/sub with zero deps.
//
// Why synchronous: events are scheduled in audio-clock time, not in
// dispatch time. The bus only has to deliver them to subscribers in
// the order they were emitted. Subscribers (router, recorder, UI)
// then act on each event according to its `when`. So we don't need
// a microtask queue or a Web-Audio-aware scheduler in the bus itself
// — that's the sequencer's job.
//
// Listener-safety: `emit()` snapshots the listener set per type
// before iterating, so a subscriber that unsubscribes mid-emit (or a
// new subscriber that registers mid-emit) doesn't perturb this
// dispatch — only future ones.

import type {
  Event,
  EventBus,
  EventHandler,
  EventType,
  Unsubscribe,
} from './types';

export function makeEventBus(): EventBus {
  // One listener set per event type, plus a single bag for "any".
  // Sets — not arrays — so duplicate subscriptions don't double-fire
  // and unsubscribe is O(1).
  const typed = new Map<EventType, Set<EventHandler<EventType>>>();
  const any = new Set<(event: Event) => void>();

  const emit = (event: Event): void => {
    const set = typed.get(event.type);
    if (set && set.size > 0) {
      // Copy the iteration target so unsubscribes during emit are safe.
      const snapshot = [...set];
      for (const fn of snapshot) {
        try {
          // Cast: per-type set holds handlers narrowed to that type;
          // the public API enforces this at registration.
          (fn as (event: Event) => void)(event);
        } catch (err) {
          // Isolate handlers — one bad subscriber can't poison others.
          // Logged as a warning so dev sees it without halting playback.
          console.warn('[EventBus] handler threw', event.type, err);
        }
      }
    }
    if (any.size > 0) {
      const snapshot = [...any];
      for (const fn of snapshot) {
        try {
          fn(event);
        } catch (err) {
          console.warn('[EventBus] onAny handler threw', event.type, err);
        }
      }
    }
  };

  const on = <T extends EventType>(type: T, fn: EventHandler<T>): Unsubscribe => {
    let set = typed.get(type);
    if (!set) {
      set = new Set();
      typed.set(type, set);
    }
    set.add(fn as unknown as EventHandler<EventType>);
    return () => {
      const s = typed.get(type);
      if (s) s.delete(fn as unknown as EventHandler<EventType>);
    };
  };

  const onAny = (fn: (event: Event) => void): Unsubscribe => {
    any.add(fn);
    return () => { any.delete(fn); };
  };

  return { emit, on, onAny };
}
