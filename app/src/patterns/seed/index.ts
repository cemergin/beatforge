// Seed pattern library — one JSON file per region, loaded eagerly at
// module init via Vite's import.meta.glob. Each array is parsed through
// PatternSchema; a malformed entry throws at build time with a useful path.
//
// Public API unchanged: PATTERNS, patternById, registerPatternSource.
// To add a pattern: edit seed/<region>.json. No TypeScript required.

import type { Pattern } from '../types';
import { PatternSchema } from '../schema';

// Ordered region slugs — this is the concat order of the old TS barrel.
// Any new region JSON dropped into this directory will fall through to the
// trailing alphabetical pass so it can't be silently ignored; add it here
// if you care about a specific ordering.
const REGION_ORDER: string[] = [
  'turkey-ottoman',
  'balkans',
  'cuba-afrocaribbean',
  'arabic-swana',
  'persia',
  'india',
  'west-africa',
  'brazil',
  'caribbean',
  'iberia-flamenco',
  'gamelan-southeast-asia',
  'east-asia',
  'celtic-europe',
  'electronic-western',
  'exercise',
  'andean-south-america',
  'modern-african',
  'north-east-african',
  'central-asian-pacific',
  'caucasus-mediterranean',
  'global-electronic',
  'underground-electronic',
  'internet-born',
];

// Vite transforms this into a static object of { path: json } at build time.
// `eager: true` inlines the JSON so there's no async boundary on first load.
const modules = import.meta.glob<unknown[]>('./*.json', {
  eager: true,
  import: 'default',
});

function regionOf(path: string): string {
  // './turkey-ottoman.json' → 'turkey-ottoman'
  return path.replace(/^\.\//, '').replace(/\.json$/, '');
}

function loadRegion(slug: string, raw: unknown): Pattern[] {
  if (!Array.isArray(raw)) {
    throw new Error(`[seed/${slug}] expected a JSON array, got ${typeof raw}`);
  }
  const out: Pattern[] = [];
  for (let i = 0; i < raw.length; i++) {
    const entry = raw[i];
    const result = PatternSchema.safeParse(entry);
    if (result.success) {
      out.push(result.data);
      continue;
    }

    const id = (entry && typeof entry === 'object' && 'id' in (entry as object))
      ? String((entry as { id: unknown }).id)
      : `index ${i}`;
    const issues = result.error.issues;
    const msg = issues
      .map((iss) => `${iss.path.join('.') || '<root>'}: ${iss.message}`)
      .join('; ');
    throw new Error(`[seed/${slug}] invalid pattern "${id}": ${msg}`);
  }
  return out;
}

// Resolve known regions first (in REGION_ORDER), then any stragglers in
// alphabetical order — keeps PATTERNS deterministic across machines.
const pathBySlug = new Map<string, string>();
for (const path of Object.keys(modules)) {
  pathBySlug.set(regionOf(path), path);
}

const parsed: Pattern[] = [];
const seen = new Set<string>();

for (const slug of REGION_ORDER) {
  const path = pathBySlug.get(slug);
  if (!path) continue; // region not yet migrated — tolerate, don't crash
  parsed.push(...loadRegion(slug, modules[path]));
  seen.add(slug);
}

const strays = [...pathBySlug.keys()]
  .filter((s) => !seen.has(s))
  .sort();
for (const slug of strays) {
  const path = pathBySlug.get(slug)!;
  parsed.push(...loadRegion(slug, modules[path]));
}

export const PATTERNS: Pattern[] = parsed;

// ── Extensibility hook: user patterns from Dexie ─────────────────────

// Optional extra-source lookup: Studio/App register user patterns here so
// Practice & Library can resolve them by id without importing Dexie.
const extraSources: Array<(id: string) => Pattern | undefined> = [];

export function registerPatternSource(src: (id: string) => Pattern | undefined): () => void {
  extraSources.push(src);
  return () => {
    const i = extraSources.indexOf(src);
    if (i >= 0) extraSources.splice(i, 1);
  };
}

export function patternById(id: string): Pattern | undefined {
  const hit = PATTERNS.find((p) => p.id === id);
  if (hit) return hit;
  for (const src of extraSources) {
    const p = src(id);
    if (p) return p;
  }
  return undefined;
}
