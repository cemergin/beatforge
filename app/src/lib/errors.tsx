// Tiny error surface — toast-based visible logging for runtime failures
// the silent-failure audit flagged. Not a Sentry, not remote-reporting;
// just enough that users and devs see when things go wrong instead of
// silent no-ops. Zero deps, mounted from main.tsx alongside PWAStatus.

import { Component, useEffect, useState, type ErrorInfo, type ReactNode } from 'react';

interface LogEntry { id: number; severity: 'warn' | 'error'; message: string; at: number }

let nextId = 1;
const listeners = new Set<(entries: LogEntry[]) => void>();
const entries: LogEntry[] = [];

function push(severity: 'warn' | 'error', message: string) {
  const entry: LogEntry = { id: nextId++, severity, message, at: Date.now() };
  entries.push(entry);
  if (entries.length > 20) entries.shift();
  const snap = [...entries];
  listeners.forEach((fn) => fn(snap));
  // Keep console visible for devs.
  if (severity === 'error') console.error(`[BeatForge] ${message}`);
  else console.warn(`[BeatForge] ${message}`);
}

export function logError(message: string, err?: unknown): void {
  const detail = err instanceof Error ? err.message : err ? String(err) : '';
  push('error', detail ? `${message} · ${detail}` : message);
}
export function logWarn(message: string): void { push('warn', message); }

export function ErrorToasts() {
  const [log, setLog] = useState<LogEntry[]>([]);
  useEffect(() => {
    const fn = (snap: LogEntry[]) => setLog(snap);
    listeners.add(fn);
    return () => { listeners.delete(fn); };
  }, []);

  // Auto-dismiss each entry after 6s.
  const visible = log.filter((e) => Date.now() - e.at < 6000).slice(-3);
  useEffect(() => {
    if (visible.length === 0) return;
    const t = setTimeout(() => setLog((cur) => [...cur]), 1000);
    return () => clearTimeout(t);
  }, [visible.length]);

  if (visible.length === 0) return null;
  return (
    <div
      style={{
        position: 'fixed',
        top: 64, right: 16,
        zIndex: 9999,
        display: 'flex', flexDirection: 'column', gap: 6,
        maxWidth: 'min(420px, calc(100vw - 32px))',
        pointerEvents: 'none',
      }}
    >
      {visible.map((e) => (
        <div
          key={e.id}
          role="status"
          aria-live="polite"
          style={{
            pointerEvents: 'auto',
            padding: '10px 14px',
            background: e.severity === 'error' ? '#3a1a1a' : 'var(--bg-2)',
            color: e.severity === 'error' ? '#ffd5d5' : 'var(--fg)',
            border: '1px solid ' + (e.severity === 'error' ? '#5a2a2a' : 'var(--line)'),
            borderRadius: 10,
            fontSize: 13,
            boxShadow: '0 8px 30px -10px rgba(0,0,0,0.2)',
            whiteSpace: 'pre-wrap',
          }}
        >
          <strong style={{ marginRight: 8, textTransform: 'uppercase', fontSize: 10, letterSpacing: 0.1 }}>
            {e.severity === 'error' ? '✕ error' : '! notice'}
          </strong>
          {e.message}
        </div>
      ))}
    </div>
  );
}

// ── Root error boundary ──────────────────────────────────────────────

interface State { err: Error | null }
export class ErrorBoundary extends Component<{ children: ReactNode }, State> {
  state: State = { err: null };
  static getDerivedStateFromError(err: Error): State { return { err }; }
  componentDidCatch(err: Error, info: ErrorInfo): void {
    logError('Render crashed', `${err.message}\n${info.componentStack ?? ''}`);
  }
  render() {
    if (this.state.err) {
      return (
        <div style={{
          padding: '40px 24px', fontFamily: 'var(--sans, system-ui)', color: 'var(--fg, #1a1a2e)',
        }}>
          <h1 style={{ fontSize: 28, margin: '0 0 8px' }}>Something crashed</h1>
          <p style={{ color: 'var(--muted, #6b665d)', maxWidth: 540 }}>
            BeatForge hit a render error. The details are below. You can reload — your
            saved patterns + preferences are safe in browser storage.
          </p>
          <pre style={{
            background: 'var(--bg-sunk, #ede7dc)', padding: 12, borderRadius: 8,
            fontSize: 12, overflow: 'auto', maxWidth: 720, whiteSpace: 'pre-wrap',
          }}>
            {this.state.err.message}
          </pre>
          <button
            style={{
              padding: '10px 18px', borderRadius: 8, border: 'none',
              background: 'var(--accent, #e17055)', color: '#fff', cursor: 'pointer',
              fontWeight: 600, marginTop: 12,
            }}
            onClick={() => window.location.reload()}
          >
            Reload
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}
