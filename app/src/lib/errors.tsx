// Visible error toasts + root error boundary.
// The plain logging API lives in `./log` so this module only exports
// React components (Fast Refresh requirement).

import { Component, useEffect, useState, type ErrorInfo, type ReactNode } from 'react';
import { logError, subscribeLog, type LogEntry } from './log';

const TOAST_TTL_MS = 6000;

export function ErrorToasts() {
  // Visible toasts are derived in an effect from the log + a ticking
  // clock — keeps render pure (no Date.now() during render).
  const [visible, setVisible] = useState<LogEntry[]>([]);

  useEffect(() => subscribeLog((all) => {
    setVisible(all.filter((e) => Date.now() - e.at < TOAST_TTL_MS).slice(-3));
  }), []);

  // While anything is visible, sweep expired entries every second.
  useEffect(() => {
    if (visible.length === 0) return;
    const id = setInterval(() => {
      setVisible((cur) => cur.filter((e) => Date.now() - e.at < TOAST_TTL_MS));
    }, 1000);
    return () => clearInterval(id);
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
