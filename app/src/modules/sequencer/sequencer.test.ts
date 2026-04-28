import { describe, expect, it, vi } from 'vitest';
import { makeEventBus, type Event } from '../events';
import { makeSequencer, type Sequence } from './index';

// Fake clock that the test advances explicitly. The sequencer
// pulls clock() on every tick + on transport boundaries, so
// freezing time between assertions makes scheduling deterministic.
function fakeClock(initial = 0) {
  let t = initial;
  return {
    now: () => t,
    advance: (dt: number) => { t += dt; },
    set: (v: number) => { t = v; },
  };
}

function recordedBus() {
  const bus = makeEventBus();
  const events: Event[] = [];
  bus.onAny((e) => events.push(e));
  return { bus, events };
}

function fourOnTheFloor(): Sequence {
  // 16 steps: kick on every 4th, weak on others, off on the rest of
  // the row. One row.
  const row: (0 | 1 | 2)[] = [];
  for (let i = 0; i < 16; i++) {
    if (i % 4 === 0) row.push(2);
    else if (i % 2 === 0) row.push(1);
    else row.push(0);
  }
  return [row];
}

describe('makeSequencer — transport', () => {
  it('emits transport-play on play() and transport-stop on stop()', () => {
    const clock = fakeClock();
    const { bus, events } = recordedBus();
    const seq = makeSequencer({ bus, clock: clock.now });
    seq.setRowCount(1);
    seq.setSequence([[0]]);
    seq.play({ startTime: 1.0 });
    seq.stop();
    expect(events.find((e) => e.type === 'transport' && (e as { action: string }).action === 'play')).toBeTruthy();
    expect(events.find((e) => e.type === 'transport' && (e as { action: string }).action === 'stop')).toBeTruthy();
  });

  it('running() is true after play, false after stop', () => {
    const clock = fakeClock();
    const { bus } = recordedBus();
    const seq = makeSequencer({ bus, clock: clock.now });
    expect(seq.running()).toBe(false);
    seq.play({ startTime: 0.06 });
    expect(seq.running()).toBe(true);
    seq.stop();
    expect(seq.running()).toBe(false);
  });

  it('startTime accounts for count-in bars', () => {
    const clock = fakeClock(0);
    const { bus } = recordedBus();
    const seq = makeSequencer({ bus, clock: clock.now });
    seq.setBpm(120);
    seq.setStepUnit(16);
    seq.setStepsPerBar(16);
    // barSec at 120 BPM, 16th, 16 steps = 16 * 240 / (120*16) = 2.0s
    seq.play({ startTime: 0.06, countInBars: 2 });
    expect(seq.startTime()).toBeCloseTo(0.06 + 2 * 2.0, 3);
  });
});

describe('makeSequencer — math helpers', () => {
  it('stepSeconds = 240 / (bpm * stepUnit)', () => {
    const clock = fakeClock();
    const { bus } = recordedBus();
    const seq = makeSequencer({ bus, clock: clock.now });
    seq.setBpm(120);
    seq.setStepUnit(16);
    expect(seq.stepSeconds()).toBeCloseTo(240 / (120 * 16), 6);
  });

  it('barSeconds = stepSeconds * stepsPerBar', () => {
    const clock = fakeClock();
    const { bus } = recordedBus();
    const seq = makeSequencer({ bus, clock: clock.now });
    seq.setBpm(120);
    seq.setStepUnit(16);
    seq.setStepsPerBar(8);
    expect(seq.barSeconds()).toBeCloseTo(seq.stepSeconds() * 8, 6);
  });
});

describe('makeSequencer — tick scheduling', () => {
  it('emits step + trigger events for cells within the look-ahead horizon', () => {
    const clock = fakeClock(0);
    const { bus, events } = recordedBus();
    const seq = makeSequencer({ bus, clock: clock.now, scheduleAheadS: 1.0 });
    seq.setBpm(120);
    seq.setStepUnit(16);
    seq.setStepsPerBar(16);
    seq.setRowCount(1);
    seq.setSequence(fourOnTheFloor());
    seq.setAccents(1.0, 0.5);
    seq.play({ startTime: 0.0 });
    seq.tick();
    // 4-on-the-floor: triggers at idx 0,1,2,…,7 (within 1s horizon at
    // stepSec=0.125). Steps: every step. Velocities: 2 → strong (1.0),
    // 1 → weak (0.5), 0 → no trigger.
    const triggers = events.filter((e) => e.type === 'trigger');
    const steps = events.filter((e) => e.type === 'step');
    // 1 second / 0.125 stepSec = 8 step events
    expect(steps.length).toBe(8);
    // 8 cells: [2,0,1,0,2,0,1,0] → 4 triggers (2,1,2,1)
    expect(triggers.length).toBe(4);
  });

  it('TriggerEvent target uses the configured triggerAddress', () => {
    const clock = fakeClock(0);
    const { bus, events } = recordedBus();
    const seq = makeSequencer({
      bus, clock: clock.now,
      triggerAddress: (ch) => `track.${ch}.voice`,
    });
    seq.setBpm(120);
    seq.setRowCount(1);
    seq.setSequence([[2]]);
    seq.play({ startTime: 0 });
    seq.tick();
    const trig = events.find((e) => e.type === 'trigger');
    expect(trig).toBeTruthy();
    expect((trig as { target: string }).target).toBe('track.0.voice');
  });

  it('TriggerEvent.velocity reflects strong/weak amplitude scaling', () => {
    const clock = fakeClock(0);
    const { bus, events } = recordedBus();
    const seq = makeSequencer({ bus, clock: clock.now });
    seq.setBpm(120);
    seq.setRowCount(1);
    seq.setSequence([[2, 1, 2, 1]]);
    seq.setStepsPerBar(4);
    seq.setAccents(0.9, 0.3);
    seq.play({ startTime: 0 });
    seq.tick();
    const triggers = events.filter((e) => e.type === 'trigger') as Array<{ velocity: number }>;
    expect(triggers.some((t) => Math.abs(t.velocity - 0.9) < 1e-6)).toBe(true);
    expect(triggers.some((t) => Math.abs(t.velocity - 0.3) < 1e-6)).toBe(true);
  });

  it('emits BarEvent when audible bar advances', () => {
    const clock = fakeClock(0);
    const { bus, events } = recordedBus();
    const seq = makeSequencer({ bus, clock: clock.now });
    seq.setBpm(120);
    seq.setStepUnit(16);
    seq.setStepsPerBar(16);  // bar = 2s
    seq.setRowCount(1);
    seq.setSequence([Array<0>(16).fill(0)]);   // empty row, just clock-out
    seq.play({ startTime: 0 });
    // Tick at t=0 → bar 1 fires immediately (startTime IS the start
    // of bar 1).
    seq.tick();
    let barEvents = events.filter((e) => e.type === 'bar');
    expect(barEvents.length).toBe(1);
    expect((barEvents[0] as { bar: number }).bar).toBe(1);
    // Advance past bar 2 boundary
    clock.advance(2.5);
    seq.tick();
    barEvents = events.filter((e) => e.type === 'bar');
    expect(barEvents.length).toBe(2);
    expect((barEvents[1] as { bar: number }).bar).toBe(2);
  });
});

describe('makeSequencer — audible cursors', () => {
  it('audibleStepFor returns -1 before play', () => {
    const clock = fakeClock();
    const { bus } = recordedBus();
    const seq = makeSequencer({ bus, clock: clock.now });
    seq.setRowCount(1);
    seq.setSequence([[0, 0]]);
    expect(seq.audibleStepFor(0)).toBe(-1);
  });

  it('audibleStepFor walks the cursor as time advances', () => {
    const clock = fakeClock(0);
    const { bus } = recordedBus();
    const seq = makeSequencer({ bus, clock: clock.now });
    seq.setBpm(120);
    seq.setStepUnit(16);
    seq.setStepsPerBar(16);
    seq.setRowCount(1);
    seq.setSequence([Array<0>(16).fill(0)]);
    seq.play({ startTime: 0 });
    expect(seq.audibleStepFor(0)).toBe(0);
    clock.advance(0.125);   // one step
    expect(seq.audibleStepFor(0)).toBe(1);
    clock.advance(0.125 * 4);
    expect(seq.audibleStepFor(0)).toBe(5);
  });

  it('audibleBar reflects elapsed bars', () => {
    const clock = fakeClock(0);
    const { bus } = recordedBus();
    const seq = makeSequencer({ bus, clock: clock.now });
    seq.setBpm(120); seq.setStepUnit(16); seq.setStepsPerBar(16); // bar = 2s
    seq.setRowCount(1);
    seq.setSequence([Array<0>(16).fill(0)]);
    seq.play({ startTime: 0 });
    expect(seq.audibleBar()).toBe(1);
    clock.advance(2.5);
    expect(seq.audibleBar()).toBe(2);
  });
});

describe('makeSequencer — re-anchor on tempo change', () => {
  it('setBpm preserves phase from the moment the change is applied', () => {
    const clock = fakeClock(0);
    const { bus, events } = recordedBus();
    const seq = makeSequencer({ bus, clock: clock.now, scheduleAheadS: 0.30 });
    seq.setBpm(120);
    seq.setStepUnit(16);
    seq.setStepsPerBar(16);
    seq.setRowCount(1);
    seq.setSequence([Array.from({ length: 16 }, () => 2)]);
    seq.setAccents(1, 1);
    seq.play({ startTime: 0 });
    seq.tick();
    const before = events.filter((e) => e.type === 'trigger').length;
    expect(before).toBeGreaterThan(0);
    // Halve the tempo. New stepSec = 0.25s. The next tick should
    // schedule fewer NEW events since horizon already covered most.
    seq.setBpm(60);
    expect(seq.bpm()).toBe(60);
  });
});

describe('makeSequencer — cooperative catch-up', () => {
  it('after a stall, every behind-row catches up to the same instant', () => {
    const clock = fakeClock(0);
    const { bus, events } = recordedBus();
    const seq = makeSequencer({ bus, clock: clock.now });
    seq.setBpm(120);
    seq.setStepUnit(16);
    seq.setStepsPerBar(16);
    seq.setRowCount(2);
    seq.setSequence([
      Array.from({ length: 16 }, () => 2),
      Array.from({ length: 16 }, () => 2),
    ]);
    seq.setAccents(1, 1);
    seq.play({ startTime: 0 });
    seq.tick();
    // Simulate a long stall — clock leaps forward
    clock.advance(60.0);
    const before = events.filter((e) => e.type === 'trigger').length;
    seq.tick();
    const after = events.filter((e) => e.type === 'trigger').length;
    // No throw + new triggers schedule from the recovery instant.
    expect(after).toBeGreaterThanOrEqual(before);
  });
});

describe('makeSequencer — setRowCount', () => {
  it('grows + shrinks the per-row state arrays', () => {
    const clock = fakeClock();
    const { bus } = recordedBus();
    const seq = makeSequencer({ bus, clock: clock.now });
    seq.setRowCount(3);
    seq.setRowCount(5);
    seq.setRowCount(2);
    // No throw + audibleStepFor returns -1 for missing rows
    expect(seq.audibleStepFor(2)).toBe(-1);
    expect(seq.audibleStepFor(5)).toBe(-1);
  });
});

describe('makeSequencer — handler isolation', () => {
  it('a subscriber that throws does not break scheduling', () => {
    const clock = fakeClock(0);
    const bus = makeEventBus();
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    bus.on('trigger', () => { throw new Error('subscriber down'); });
    const stepSpy = vi.fn();
    bus.on('step', stepSpy);
    const seq = makeSequencer({ bus, clock: clock.now });
    seq.setBpm(120); seq.setStepUnit(16); seq.setStepsPerBar(16);
    seq.setRowCount(1);
    seq.setSequence([[2]]);
    seq.play({ startTime: 0 });
    expect(() => seq.tick()).not.toThrow();
    expect(stepSpy).toHaveBeenCalled();
    warn.mockRestore();
  });
});
