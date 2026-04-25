// Tiny logger backing the visible error toasts (lib/errors.tsx).
// Lives in its own file so React Fast Refresh stays happy — the `errors.tsx`
// module exports React components, and Fast Refresh only reloads cleanly
// when component files don't also export plain functions.

export interface LogEntry {
  id: number;
  severity: 'warn' | 'error';
  message: string;
  at: number;
}

let nextId = 1;
const listeners = new Set<(entries: LogEntry[]) => void>();
const entries: LogEntry[] = [];

function push(severity: 'warn' | 'error', message: string): void {
  const entry: LogEntry = { id: nextId++, severity, message, at: Date.now() };
  entries.push(entry);
  if (entries.length > 20) entries.shift();
  const snap = [...entries];
  listeners.forEach((fn) => fn(snap));
  if (severity === 'error') console.error(`[BeatForge] ${message}`);
  else console.warn(`[BeatForge] ${message}`);
}

export function logError(message: string, err?: unknown): void {
  const detail = err instanceof Error ? err.message : err ? String(err) : '';
  push('error', detail ? `${message} · ${detail}` : message);
}

export function logWarn(message: string): void {
  push('warn', message);
}

export function subscribeLog(fn: (entries: LogEntry[]) => void): () => void {
  listeners.add(fn);
  return () => { listeners.delete(fn); };
}
