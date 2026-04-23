// Client-side persistence for quick-access state. No backend, per spec.

const HIGHLIGHTS_KEY = 'bf_highlights';
const RECENT_KEY = 'bf_recent';
const RECENT_MAX = 20;

function read(key: string): string[] {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.filter((x) => typeof x === 'string') : [];
  } catch {
    return [];
  }
}

function write(key: string, ids: string[]): void {
  try { localStorage.setItem(key, JSON.stringify(ids)); } catch {}
}

export function getHighlights(): string[] { return read(HIGHLIGHTS_KEY); }

export function toggleHighlight(id: string): string[] {
  const cur = read(HIGHLIGHTS_KEY);
  const next = cur.includes(id) ? cur.filter((x) => x !== id) : [...cur, id];
  write(HIGHLIGHTS_KEY, next);
  return next;
}

export function isHighlighted(id: string): boolean {
  return read(HIGHLIGHTS_KEY).includes(id);
}

export function getRecent(): string[] { return read(RECENT_KEY); }

export function pushRecent(id: string): string[] {
  const cur = read(RECENT_KEY).filter((x) => x !== id);
  const next = [id, ...cur].slice(0, RECENT_MAX);
  write(RECENT_KEY, next);
  return next;
}
