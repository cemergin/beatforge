// Zod schema for the Pattern type. The single source of truth for validation
// — the hand-rolled checks in lib/db.ts delegate to this, and seed/index.ts
// runs every JSON entry through PatternSchema at module-load time.
//
// See types.ts for the TypeScript counterpart; both must stay in lockstep.

import { z } from 'zod';
import type { Pattern } from './types';

// ── Enums ───────────────────────────────────────────────────────────

export const VoiceIdSchema = z.enum(['KK', 'SN', 'HH', 'OH', 'CP']);

export const VelocitySchema = z.union([
  z.literal(0),
  z.literal(1),
  z.literal(2),
]);

export const KitIdSchema = z.enum([
  '808', '909', '707', '727',
  'frameDrum', 'tabla', 'gamelan',
]);

export const RegionIdSchema = z.enum([
  'turkey-ottoman',
  'arabic-swana',
  'persia',
  'india',
  'west-africa',
  'modern-african',
  'north-east-african',
  'cuba-afrocaribbean',
  'brazil',
  'andean-south-america',
  'caribbean',
  'balkans',
  'iberia-flamenco',
  'caucasus-mediterranean',
  'gamelan-southeast-asia',
  'east-asia',
  'central-asian-pacific',
  'celtic-europe',
  'electronic-western',
  'global-electronic',
  'underground-electronic',
  'internet-born',
  'exercise',
]);

export const GenreSchema = z.enum([
  'folk-dance',
  'classical',
  'devotional',
  'popular',
  'electronic',
  'hip-hop',
  'jazz',
  'ceremonial',
  'exercise',
]);

export const DifficultySchema = z.enum(['beginner', 'intermediate', 'advanced']);

export const StepUnitSchema = z.union([
  z.literal(4),
  z.literal(8),
  z.literal(16),
]);

// ── Track ───────────────────────────────────────────────────────────

// Velocity[] — shorthand form. Must be non-empty.
const VelocityArraySchema = z.array(VelocitySchema).min(1);

// Object form — explicit subdivisions/cycle for polyrhythms.
const TrackObjectSchema = z.object({
  pattern: VelocityArraySchema,
  subdivisions: z.number().int().positive().optional(),
  cycle: z.number().int().positive().optional(),
}).strict();

export const TrackSchema = z.union([VelocityArraySchema, TrackObjectSchema]);

// Tracks map — Partial<Record<VoiceId, Track>>; at least one voice must
// be present. z.partialRecord is the v4 equivalent of the legacy v3 record
// behavior (v4's z.record now requires every enum key, which we don't want).
const TracksSchema = z
  .partialRecord(VoiceIdSchema, TrackSchema)
  .refine((t) => Object.keys(t).length > 0, {
    message: 'tracks must have at least one voice',
  });

// ── BPM ─────────────────────────────────────────────────────────────

const BpmSchema = z.object({
  default: z.number().positive(),
  min: z.number().positive(),
  max: z.number().positive(),
}).strict().refine(
  (b) => b.min <= b.default && b.default <= b.max,
  { message: 'bpm.default must be within [bpm.min, bpm.max]' },
);

// ── Custom voices (v2+ reserve) ─────────────────────────────────────

const CustomVoicesSchema = z.record(
  z.string(),
  z.object({
    synth: z.string(),
    params: z.record(z.string(), z.unknown()),
  }),
);

// ── Pattern ─────────────────────────────────────────────────────────

// Kept permissive on unknown extra fields (no .strict()) so older data or
// forward-compatible drafts don't break load. The invariants (grouping sum,
// bpm range) are enforced explicitly.
export const PatternSchema: z.ZodType<Pattern> = z.object({
  // Identity
  id: z.string().min(1),
  name: z.string().min(1),
  origin: z.string(),
  tradition: z.string(),
  genre: GenreSchema,

  // Rhythmic shape
  timeSig: z.string().min(1),
  grouping: z.array(z.number().int().positive()).min(1),
  steps: z.number().int().positive(),
  stepUnit: StepUnitSchema,
  poly: z.boolean().optional(),

  // Tempo
  bpm: BpmSchema,

  // Content
  tracks: TracksSchema,

  // Kit
  defaultKit: KitIdSchema,

  // Discoverability
  region: RegionIdSchema,
  country: z.string().optional(),
  difficulty: DifficultySchema,
  tags: z.array(z.string()),
  instruments: z.array(z.string()).optional(),
  swingable: z.boolean(),
  swingDefault: z.number().min(0.5).max(1).optional(),
  relatedIds: z.array(z.string()).optional(),

  // Narrative
  story: z.string().optional(),
  sources: z.array(z.string()).optional(),

  // v2+ reserve
  customVoices: CustomVoicesSchema.optional(),
}).refine(
  (p) => p.grouping.reduce((a, b) => a + b, 0) === p.steps,
  { message: 'grouping must sum to steps', path: ['grouping'] },
) as z.ZodType<Pattern>;

// ── User patterns (Studio output, lives in IndexedDB) ───────────────

// Cannot use `PatternSchema.extend(...)` because .refine() returns ZodEffects,
// which isn't an object schema. Intersection is the standard workaround.
export const UserPatternSchema = z.intersection(
  PatternSchema,
  z.object({
    user: z.literal(true),
    createdAt: z.number(),
    updatedAt: z.number(),
  }),
);

// ── Helpers ─────────────────────────────────────────────────────────

export function parsePattern(raw: unknown): Pattern {
  return PatternSchema.parse(raw);
}

export function safeParsePattern(raw: unknown) {
  return PatternSchema.safeParse(raw);
}

export type PatternInput = z.input<typeof PatternSchema>;
export type PatternOutput = z.output<typeof PatternSchema>;
