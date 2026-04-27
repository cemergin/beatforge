// EventBusDemo — fire test events at the bus, watch them stream
// through a live log. Proves the bus, the type narrowing, and the
// onAny subscriber pattern that the recorder/router will use.

import { useEffect, useMemo, useRef, useState } from 'react';
import { makeEventBus, type Event } from '../../modules/events';

const MAX_LOG = 200;

interface LogEntry {
  id: number;
  t: number;
  event: Event;
}

export function EventBusDemo() {
  // One bus per demo session. Re-mount → fresh bus + log.
  const bus = useMemo(() => makeEventBus(), []);
  const [log, setLog] = useState<LogEntry[]>([]);
  const idRef = useRef(0);
  const t0Ref = useRef<number | null>(null);

  useEffect(() => {
    if (t0Ref.current === null) t0Ref.current = performance.now();
    const t0 = t0Ref.current;
    const off = bus.onAny((event) => {
      idRef.current += 1;
      const id = idRef.current;
      const t = (performance.now() - t0) / 1000;
      setLog((prev) => {
        const next = [{ id, t, event }, ...prev];
        return next.length > MAX_LOG ? next.slice(0, MAX_LOG) : next;
      });
    });
    return off;
  }, [bus]);

  const clear = () => setLog([]);

  // Each button emits a representative shape — these are the same
  // events the sequencer / MIDI / UI will produce in production.
  const fireTrigger = () => bus.emit({
    type: 'trigger', target: 'channel.0', velocity: 1.0, when: 0,
  });
  const fireWeakTrigger = () => bus.emit({
    type: 'trigger', target: 'channel.0', velocity: 0.5, when: 0,
  });
  const fireParam = () => bus.emit({
    type: 'param', target: 'channel.0.color.cutoff', value: 4200, ramp: 0.05,
  });
  const fireBar = () => bus.emit({
    type: 'bar', bar: idRef.current, when: 0,
  });
  const fireTransport = (action: 'play' | 'stop') => bus.emit({
    type: 'transport', action, when: 0,
  });

  return (
    <section className="bf-lab-section">
      <div className="bf-lab-controls">
        <button type="button" className="bf-lab-btn" onClick={fireTrigger}>
          trigger (vel 1.0)
        </button>
        <button type="button" className="bf-lab-btn" onClick={fireWeakTrigger}>
          trigger (vel 0.5)
        </button>
        <button type="button" className="bf-lab-btn" onClick={fireParam}>
          param (cutoff 4.2k)
        </button>
        <button type="button" className="bf-lab-btn" onClick={fireBar}>
          bar
        </button>
        <button type="button" className="bf-lab-btn" onClick={() => fireTransport('play')}>
          play
        </button>
        <button type="button" className="bf-lab-btn" onClick={() => fireTransport('stop')}>
          stop
        </button>
        <button type="button" className="bf-lab-btn ghost" onClick={clear}>
          clear log
        </button>
      </div>

      <div className="bf-lab-log" role="log" aria-live="polite">
        {log.length === 0 && (
          <div className="bf-lab-log-empty">no events yet — fire one above</div>
        )}
        {log.map((entry) => (
          <div key={entry.id} className="bf-lab-log-row">
            <span className="bf-lab-log-t">{entry.t.toFixed(3)}s</span>
            <span className={`bf-lab-log-type bf-lab-log-${entry.event.type}`}>
              {entry.event.type}
            </span>
            <span className="bf-lab-log-payload">
              {summarize(entry.event)}
            </span>
          </div>
        ))}
      </div>
    </section>
  );
}

/** Compact one-liner per event type, matching the platform-plan
 *  conventions. Keep this readable — it's what dev sees while
 *  smoke-testing the bus. */
function summarize(event: Event): string {
  switch (event.type) {
    case 'trigger':   return `${event.target} velocity=${event.velocity}${event.mod ? ` mod=${JSON.stringify(event.mod)}` : ''}`;
    case 'release':   return `${event.target}`;
    case 'param':     return `${event.target} value=${event.value}${event.ramp ? ` ramp=${event.ramp}` : ''}`;
    case 'bar':       return `bar=${event.bar}`;
    case 'step':      return `channel=${event.channel} step=${event.step}`;
    case 'transport': return `${event.action}${event.bar !== undefined ? ` bar=${event.bar}` : ''}`;
    case 'clock':     return `tick=${event.tick}`;
    case 'pattern':   return `${event.action}`;
  }
}
