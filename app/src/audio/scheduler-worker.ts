// Dedicated Web Worker for scheduler ticks. The main thread can stall for
// 100+ms during React renders, devtools work, or tab throttling; Web Audio
// silently drops notes scheduled in the past. A worker's setInterval runs
// on its own thread and is immune to those stalls.
//
// Protocol:
//   main → worker:  { type: 'start', intervalMs: number }
//   main → worker:  { type: 'stop' }
//   worker → main:  'tick'  (string literal; tiny payload, no GC pressure)
//
// The worker does no scheduling itself — it's a metronome. The engine on
// the main thread still owns `ctx.currentTime` and all Web Audio calls.

let interval: ReturnType<typeof setInterval> | null = null;

interface StartMsg { type: 'start'; intervalMs: number }
interface StopMsg { type: 'stop' }
type In = StartMsg | StopMsg;

self.onmessage = (e: MessageEvent<In>) => {
  const msg = e.data;
  if (msg.type === 'start') {
    if (interval !== null) clearInterval(interval);
    interval = setInterval(() => {
      (self as unknown as Worker).postMessage('tick');
    }, msg.intervalMs);
  } else if (msg.type === 'stop') {
    if (interval !== null) {
      clearInterval(interval);
      interval = null;
    }
  }
};
