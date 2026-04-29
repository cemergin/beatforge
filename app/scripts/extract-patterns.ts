// Pattern extraction CLI — skeleton for the migration pipeline (spec section 5.4).
//
// This is the EXTRACTION step only. It is intentionally LLM-free: the job is
// to mechanically carve a Markdown research file into per-pattern "draft
// candidates" that preserve the raw notation + surrounding prose. The actual
// conversion from notation to `tracks` velocities + `story` wording is a MANUAL
// step done afterwards by piping each block through Claude and pasting the
// result into the sandbox.
//
// Usage:
//   bun scripts/extract-patterns.ts <markdown-path> [--region <regionId>]
//
// Example:
//   bun scripts/extract-patterns.ts ../docs/topics/rhythm-patterns/turkish-arabic-indian.md \
//     --region turkey-ottoman
//
// Output:
//   app/patterns-drafts/<region>/<slug>.json  (one file per detected pattern)
//
// Each output file conforms to the Pattern TypeScript schema as much as can
// be inferred from prose; fields the script can't infer are set to the string
// literal "TBD" (for tracks: empty arrays). The sandbox refuses to PLAY a
// draft whose tracks are all empty — it's a prompt to fill them in.
//
// Format notes observed across the research corpus:
//   - `turkish-arabic-indian.md` uses headings like `## 1. Düm-Tek (Düyek)`
//     with a fenced code block containing `Genre:`, `BPM:`, `Time Sig:`,
//     and pipe-row notation (`KK: |x...x...|`).
//   - `african-ensembles.md` uses headings like `### === 1. AGBEKOR ===`
//     with free-form `Genre:` / `BPM:` lines OUTSIDE fenced blocks and
//     MULTIPLE notation code blocks per pattern (ensemble parts).
//   - `gamelan-southeast-asian.md` is mostly prose with tables.
//
// The script tries to be lenient: it detects a "pattern block" whenever a
// heading is followed by lines containing `Time Sig:` / `BPM:` / pipe-row
// notation within the next ~40 lines. Anything it can't parse becomes a
// draft with `_draft.extractionWarnings` populated — the sandbox surfaces
// these visibly so the operator fixes them before promotion.

import {
  existsSync,
  mkdirSync,
  readFileSync,
  writeFileSync,
} from 'node:fs';
import { resolve, basename, dirname } from 'node:path';

// ── Types (mirrored from src/patterns/types.ts; we can't import .ts from
// the app into a bun script cleanly while keeping tsc happy, and this
// script must stay self-contained). ────────────────────────────────────

type Velocity = 0 | 1 | 2;
type VoiceId = 'KK' | 'SN' | 'HH' | 'OH' | 'CP';
type KitId =
  | '808' | '909' | '707' | '727'
  | 'frameDrum' | 'tabla' | 'gamelan';
type RegionId =
  | 'turkey-ottoman' | 'arabic-swana' | 'persia' | 'india'
  | 'west-africa' | 'cuba-afrocaribbean' | 'brazil'
  | 'andean-south-america' | 'caribbean' | 'balkans'
  | 'iberia-flamenco' | 'gamelan-southeast-asia'
  | 'east-asia' | 'celtic-europe' | 'electronic-western'
  | 'exercise';

interface DraftPattern {
  id: string;
  name: string;
  origin: string;
  tradition: string;
  genre: string;
  timeSig: string;
  grouping: number[];
  steps: number;
  stepUnit: 8 | 16 | 4;
  bpm: { default: number; min: number; max: number };
  tracks: Partial<Record<VoiceId, Velocity[]>>;
  defaultKit: KitId;
  region: RegionId;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  tags: string[];
  instruments?: string[];
  swingable: boolean;
  story?: string;
  sources?: string[];
  // Pipeline-only metadata (stripped when promoted to seed/).
  _draft: {
    rawBlocks: string[];        // raw notation blocks as pulled from the MD
    rawProse: string;           // the prose that described the pattern
    extractionWarnings: string[];
    sourceFile: string;
  };
}

// ── Arg parsing ────────────────────────────────────────────────────────

const args = process.argv.slice(2);
if (args.length === 0 || args[0] === '--help' || args[0] === '-h') {
  console.error(
    'Usage: bun scripts/extract-patterns.ts <markdown-path> [--region <regionId>]',
  );
  process.exit(args.length === 0 ? 1 : 0);
}
const inputArg = args[0];
let regionOverride: RegionId | undefined;
for (let i = 1; i < args.length; i++) {
  if (args[i] === '--region' && args[i + 1]) {
    regionOverride = args[i + 1] as RegionId;
    i++;
  }
}

const inputPath = resolve(process.cwd(), inputArg);
if (!existsSync(inputPath)) {
  console.error(`File not found: ${inputPath}`);
  process.exit(1);
}

const sourceMd = readFileSync(inputPath, 'utf-8');

// Heuristic region guess from filename if no --region.
function guessRegion(filename: string): RegionId {
  const lc = filename.toLowerCase();
  if (lc.includes('turkish') || lc.includes('ottoman')) return 'turkey-ottoman';
  if (lc.includes('arabic') || lc.includes('swana')) return 'arabic-swana';
  if (lc.includes('indian') || lc.includes('south-asian')) return 'india';
  if (lc.includes('african')) return 'west-africa';
  if (lc.includes('latin') || lc.includes('caribbean')) return 'cuba-afrocaribbean';
  if (lc.includes('gamelan')) return 'gamelan-southeast-asia';
  if (lc.includes('iberian') || lc.includes('flamenco')) return 'iberia-flamenco';
  if (lc.includes('celtic') || lc.includes('european')) return 'celtic-europe';
  if (lc.includes('electronic')) return 'electronic-western';
  return 'turkey-ottoman';
}
const region: RegionId = regionOverride ?? guessRegion(basename(inputPath));

// ── Markdown parsing ──────────────────────────────────────────────────

interface Section {
  title: string;
  body: string;
  startLine: number;
}

function splitSections(md: string): Section[] {
  const lines = md.split('\n');
  const headingIdxs: Array<{ idx: number; title: string }> = [];
  const headingRe = /^(#{1,4})\s+(.+?)\s*$/;

  for (let i = 0; i < lines.length; i++) {
    const m = headingRe.exec(lines[i]);
    if (!m) continue;
    headingIdxs.push({ idx: i, title: normalizeHeading(m[2]) });
  }
  if (headingIdxs.length === 0) return [];

  const sections: Section[] = [];
  for (let s = 0; s < headingIdxs.length; s++) {
    const start = headingIdxs[s].idx;
    const end = s + 1 < headingIdxs.length ? headingIdxs[s + 1].idx : lines.length;
    const body = lines.slice(start + 1, end).join('\n');
    sections.push({ title: headingIdxs[s].title, body, startLine: start + 1 });
  }
  return sections;
}

function normalizeHeading(h: string): string {
  return h
    .replace(/^=+\s*/, '')
    .replace(/\s*=+$/, '')
    .replace(/^\d+\.\s*/, '')
    .trim();
}

function sectionLooksLikePattern(body: string): boolean {
  if (/time\s*sig\s*:/i.test(body)) return true;
  if (/\bBPM\s*:/i.test(body)) return true;
  if (/^\s*[A-Z]{1,3}\s*:\s*\|[.x\s|]+\|/m.test(body)) return true;
  return false;
}

// ── Field extraction ───────────────────────────────────────────────────

function extractField(body: string, label: RegExp): string | null {
  const re = new RegExp(`${label.source}\\s*:?\\s*(.+)`, 'i');
  const m = re.exec(body);
  return m ? m[1].split('\n')[0].trim() : null;
}

function extractBpm(body: string): { default: number; min: number; max: number } {
  const raw = extractField(body, /BPM/);
  if (!raw) return { default: 120, min: 60, max: 200 };
  const m = /(\d{2,4})\s*[-–]\s*(\d{2,4})/.exec(raw);
  if (m) {
    const lo = parseInt(m[1], 10);
    const hi = parseInt(m[2], 10);
    return { default: Math.round((lo + hi) / 2), min: lo, max: hi };
  }
  const single = /(\d{2,4})/.exec(raw);
  if (single) {
    const b = parseInt(single[1], 10);
    return { default: b, min: Math.max(30, b - 40), max: b + 40 };
  }
  return { default: 120, min: 60, max: 200 };
}

function extractDifficulty(body: string): 'beginner' | 'intermediate' | 'advanced' {
  const raw = (extractField(body, /Difficulty/) ?? '').toLowerCase();
  if (raw.includes('advanced')) return 'advanced';
  if (raw.includes('beginner')) return 'beginner';
  return 'intermediate';
}

function extractTimeSig(body: string): { timeSig: string; stepUnit: 8 | 16 | 4 } {
  const raw = extractField(body, /Time\s*Sig/);
  if (!raw) return { timeSig: '4/4', stepUnit: 16 };
  const m = /(\d+)\s*\/\s*(\d+)/.exec(raw);
  if (!m) return { timeSig: '4/4', stepUnit: 16 };
  const num = parseInt(m[1], 10);
  const den = parseInt(m[2], 10);
  const stepUnit = (den === 4 || den === 8 || den === 16) ? (den as 4 | 8 | 16) : 16;
  return { timeSig: `${num}/${den}`, stepUnit };
}

function extractGrouping(body: string, stepsGuess: number): number[] {
  const m = /(\d+(?:\s*\+\s*\d+){1,7})/.exec(body);
  if (m) {
    const parts = m[1].split('+').map((x) => parseInt(x.trim(), 10)).filter((n) => n > 0);
    const sum = parts.reduce((a, b) => a + b, 0);
    if (sum === stepsGuess || sum * 2 === stepsGuess) return parts;
  }
  return [stepsGuess];
}

// ── Notation block extraction ─────────────────────────────────────────

interface NotationRow {
  rawLabel: string;
  voice: VoiceId | null;
  pattern: Velocity[];
}

function extractNotationRows(body: string): NotationRow[] {
  const rows: NotationRow[] = [];
  const re = /^\s*([^:\n|]{1,40}):\s*(\|[^|\n]*(?:\|[^|\n]*)*\|)\s*$/gm;
  let m: RegExpExecArray | null;
  while ((m = re.exec(body)) !== null) {
    const label = m[1].trim();
    const pipeContent = m[2];
    const inner = pipeContent.replace(/\|/g, '');
    const velocities: Velocity[] = [];
    for (const ch of inner) {
      if (ch === 'x' || ch === 'X' || ch === 'D' || ch === 'T' || ch === 'O') {
        velocities.push(2);
      } else if (ch === 'k' || ch === 'K' || ch === 'M' || ch === 'S') {
        velocities.push(1);
      } else if (ch === '.' || ch === '-' || ch === '_') {
        velocities.push(0);
      }
    }
    if (velocities.length === 0) continue;
    rows.push({
      rawLabel: label,
      voice: mapLabelToVoice(label),
      pattern: velocities,
    });
  }
  return rows;
}

function mapLabelToVoice(label: string): VoiceId | null {
  const lc = label.toLowerCase();
  if (/^(kk|kick|bass\s*drum|doum|dum|bayan|ge|ghe|gong)/.test(lc)) return 'KK';
  if (/^(sn|snare|tek|na|ta|tin|dayan|kenong)/.test(lc)) return 'SN';
  if (/^(hh|hi[- ]?hat|closed|shaker|axatse|bell|gankogui)/.test(lc)) return 'HH';
  if (/^(oh|open)/.test(lc)) return 'OH';
  if (/^(cp|clap|clave|claves|rim|cowbell)/.test(lc)) return 'CP';
  return null;
}

function buildTracks(
  body: string,
  stepsGuess: number,
  warnings: string[],
): { tracks: Partial<Record<VoiceId, Velocity[]>>; rawBlocks: string[] } {
  const rawBlocks: string[] = [];
  const fenceRe = /```[^\n]*\n([\s\S]*?)```/g;
  let fm: RegExpExecArray | null;
  while ((fm = fenceRe.exec(body)) !== null) rawBlocks.push(fm[1].trim());

  const kitMatch = /kit\s*adaptation[\s\S]{0,800}/i.exec(body);
  const scope = kitMatch ? kitMatch[0] : body;
  const rows = extractNotationRows(scope);

  const tracks: Partial<Record<VoiceId, Velocity[]>> = {};
  for (const r of rows) {
    if (!r.voice) continue;
    if (tracks[r.voice]) continue;
    tracks[r.voice] = r.pattern;
  }

  for (const v of Object.keys(tracks) as VoiceId[]) {
    const p = tracks[v]!;
    if (p.length === stepsGuess) continue;
    if (p.length === stepsGuess * 2 || p.length === stepsGuess / 2) {
      warnings.push(`${v} pattern has ${p.length} cells but steps=${stepsGuess}; resample needed`);
    } else {
      warnings.push(`${v} pattern length ${p.length} does not match steps ${stepsGuess}`);
    }
  }

  if (Object.keys(tracks).length === 0) {
    warnings.push('No KK/SN/HH/OH/CP rows detected — pattern will not play until filled in');
  }
  return { tracks, rawBlocks };
}

// ── Region → default kit (spec section 5.2) ────────────────────────────

const KIT_FOR_REGION: Record<RegionId, KitId> = {
  'turkey-ottoman': 'frameDrum',
  'arabic-swana': 'frameDrum',
  persia: 'frameDrum',
  india: 'tabla',
  'west-africa': '727',
  'cuba-afrocaribbean': '727',
  brazil: '727',
  'andean-south-america': '727',
  caribbean: '808',
  balkans: 'frameDrum',
  'iberia-flamenco': '727',
  'gamelan-southeast-asia': 'gamelan',
  'east-asia': 'gamelan',
  'celtic-europe': '707',
  'electronic-western': '808',
  exercise: '808',
};

// ── Slug + name helpers ────────────────────────────────────────────────

function slugify(s: string): string {
  return s
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .toLowerCase()
    .replace(/[()]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}

function extractOrigin(body: string): string {
  return extractField(body, /Origin/) ?? '';
}

function extractDescription(body: string): string {
  const re = /Description\s*:\s*([\s\S]+?)(?:\n\s*\n|\n```|$)/i;
  const m = re.exec(body);
  if (!m) return '';
  return m[1].replace(/\s+/g, ' ').trim();
}

function extractGenre(body: string): string {
  const raw = extractField(body, /Genre/) ?? 'folk-dance';
  const lc = raw.toLowerCase();
  if (lc.includes('classical')) return 'classical';
  if (lc.includes('electronic')) return 'electronic';
  if (lc.includes('hip') || lc.includes('hop')) return 'hip-hop';
  if (lc.includes('jazz')) return 'jazz';
  if (lc.includes('devotional') || lc.includes('spiritual')) return 'devotional';
  if (lc.includes('ceremon')) return 'ceremonial';
  if (lc.includes('pop')) return 'popular';
  return 'folk-dance';
}

// ── Process one section → draft ────────────────────────────────────────

function toDraft(sec: Section): DraftPattern | null {
  if (!sectionLooksLikePattern(sec.body)) return null;

  const warnings: string[] = [];
  const name = sec.title.replace(/[_*]/g, '').trim();
  if (!name) warnings.push('Could not infer pattern name from heading');

  const { timeSig, stepUnit } = extractTimeSig(sec.body);
  const [num, den] = timeSig.split('/').map((x) => parseInt(x, 10));
  const steps = den === 4 ? num * 4 : (stepUnit === 16 ? num * 2 : num);

  const grouping = extractGrouping(sec.body, steps);
  if (grouping.reduce((a, b) => a + b, 0) !== steps) {
    warnings.push(`Grouping ${grouping.join('+')} does not sum to ${steps}`);
  }

  const { tracks, rawBlocks } = buildTracks(sec.body, steps, warnings);

  const draft: DraftPattern = {
    id: slugify(name) || `pattern-${Date.now()}`,
    name,
    origin: extractOrigin(sec.body),
    tradition: 'TBD',
    genre: extractGenre(sec.body),
    timeSig,
    grouping,
    steps,
    stepUnit,
    bpm: extractBpm(sec.body),
    tracks,
    defaultKit: KIT_FOR_REGION[region],
    region,
    difficulty: extractDifficulty(sec.body),
    tags: ['TBD'],
    instruments: [],
    swingable: stepUnit === 16 && timeSig === '4/4',
    story: extractDescription(sec.body) || 'TBD',
    sources: [`docs/topics/rhythm-patterns/${basename(inputPath)}`],
    _draft: {
      rawBlocks,
      rawProse: sec.body.slice(0, 2000),
      extractionWarnings: warnings,
      sourceFile: inputPath,
    },
  };
  return draft;
}

// ── Run ────────────────────────────────────────────────────────────────

const sections = splitSections(sourceMd);
const drafts: DraftPattern[] = [];
for (const sec of sections) {
  const d = toDraft(sec);
  if (d) drafts.push(d);
}

if (drafts.length === 0) {
  console.error(
    'No pattern-shaped sections found. Check that the file has ' +
    '`Time Sig:` / `BPM:` / pipe-notation rows.',
  );
  process.exit(2);
}

const outRoot = resolve(import.meta.dir, '../patterns-drafts', region);
if (!existsSync(outRoot)) mkdirSync(outRoot, { recursive: true });

const written: string[] = [];
const slugSeen = new Map<string, number>();
for (const d of drafts) {
  let id = d.id;
  const prev = slugSeen.get(id);
  if (prev !== undefined) {
    const n = prev + 1;
    slugSeen.set(id, n);
    id = `${id}-${n}`;
    d.id = id;
  } else {
    slugSeen.set(id, 1);
  }

  const outPath = resolve(outRoot, `${id}.json`);
  writeFileSync(outPath, JSON.stringify(d, null, 2) + '\n');
  written.push(outPath);
}

console.log(
  `extracted ${written.length} draft(s) from ${basename(inputPath)} -> ${dirname(written[0])}`,
);
for (const w of written) console.log(`  - ${basename(w)}`);

const withWarnings = drafts.filter((d) => d._draft.extractionWarnings.length > 0);
if (withWarnings.length > 0) {
  console.log(
    `\n${withWarnings.length} draft(s) have extraction warnings — review in the sandbox (/_patterns in dev).`,
  );
}
