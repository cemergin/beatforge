// Compact URL-safe serialization for Pattern objects.
//
// Wire format:
//   "p1:" + base64url( gzip( JSON.stringify(pattern) ) )
//
// Versioning via prefix so we can evolve the format without breaking
// old share links. Decode dispatches on the prefix.
//
// Why gzip? Pattern JSON has repetitive keys / commas / braces; gzip
// routinely cuts size 2-3x. A typical 500-byte pattern compresses to
// ~220 bytes, ~300 chars base64 — well within URL limits.
//
// Uses the browser's native CompressionStream (Chromium, Firefox,
// Safari 16.4+). No polyfill needed for our deploy targets.

import type { Pattern } from './types';
import { PatternSchema } from './schema';

const VERSION = 'p1';

/** Encode a Pattern to a URL-safe hash string. */
export async function serializePattern(pattern: Pattern): Promise<string> {
  const json = JSON.stringify(pattern);
  const input = new TextEncoder().encode(json);

  const cs = new CompressionStream('gzip');
  const writer = cs.writable.getWriter();
  writer.write(input);
  writer.close();
  const bytes = new Uint8Array(await new Response(cs.readable).arrayBuffer());

  return `${VERSION}:${bytesToBase64Url(bytes)}`;
}

/** Decode a hash string back to a validated Pattern. Returns null on failure. */
export async function deserializePattern(hash: string): Promise<Pattern | null> {
  const [prefix, payload] = hash.split(':');
  if (prefix !== VERSION || !payload) return null;

  let json: string;
  try {
    const bytes = base64UrlToBytes(payload);
    const ds = new DecompressionStream('gzip');
    const writer = ds.writable.getWriter();
    writer.write(bytes as BufferSource);
    writer.close();
    json = await new Response(ds.readable).text();
  } catch {
    return null;
  }

  let raw: unknown;
  try {
    raw = JSON.parse(json);
  } catch {
    return null;
  }

  const parsed = PatternSchema.safeParse(raw);
  return parsed.success ? parsed.data : null;
}

/** Build a shareable URL for a pattern, including the ?p= hash. */
export async function buildShareUrl(pattern: Pattern): Promise<string> {
  const hash = await serializePattern(pattern);
  const base = window.location.origin + window.location.pathname;
  const params = new URLSearchParams({ tab: 'practice', p: hash });
  return `${base}?${params.toString()}`;
}

/**
 * Build the right share URL automatically:
 *   - Seed pattern (exists in PATTERNS by id) → short ?pattern=<id>
 *     (recipient resolves via their built-in library, ~60 chars)
 *   - Anything else (user pattern, shared, edited) → ?p=<hash>
 *     (recipient doesn't need a matching library, ~300-800 chars)
 *
 * The caller passes an `isSeed` predicate so this module stays free of
 * the seed import cycle. Practice/Studio can always pass () => false
 * (their patterns can carry edits and shouldn't be short-linked).
 */
export async function buildSmartShareUrl(
  pattern: Pattern,
  isSeed: (id: string) => boolean,
): Promise<string> {
  if (isSeed(pattern.id)) {
    const base = window.location.origin + window.location.pathname;
    const params = new URLSearchParams({
      tab: 'practice',
      pattern: pattern.id,
    });
    return `${base}?${params.toString()}`;
  }
  return buildShareUrl(pattern);
}

// ── base64url codec ─────────────────────────────────────────────────
// Standard base64 with `+` → `-`, `/` → `_`, `=` padding stripped.
// Safe to carry in URL query strings without percent-encoding.

function bytesToBase64Url(bytes: Uint8Array): string {
  let bin = '';
  for (let i = 0; i < bytes.length; i++) bin += String.fromCharCode(bytes[i]);
  return btoa(bin).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function base64UrlToBytes(s: string): Uint8Array {
  const b64 = s.replace(/-/g, '+').replace(/_/g, '/');
  const pad = b64.length % 4;
  const padded = pad ? b64 + '='.repeat(4 - pad) : b64;
  const bin = atob(padded);
  const bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
  return bytes;
}
