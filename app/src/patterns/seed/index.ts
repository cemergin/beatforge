// Seed pattern library — split per region.
// Each region file exports `<REGION>_PATTERNS: Pattern[]`.
// This barrel concatenates them in first-seen order from the original seed.ts.

import type { Pattern } from '../types';

import { TURKEY_OTTOMAN_PATTERNS } from './turkey-ottoman';
import { BALKANS_PATTERNS } from './balkans';
import { CUBA_AFROCARIBBEAN_PATTERNS } from './cuba-afrocaribbean';
import { ARABIC_SWANA_PATTERNS } from './arabic-swana';
import { PERSIA_PATTERNS } from './persia';
import { INDIA_PATTERNS } from './india';
import { WEST_AFRICA_PATTERNS } from './west-africa';
import { BRAZIL_PATTERNS } from './brazil';
import { CARIBBEAN_PATTERNS } from './caribbean';
import { IBERIA_FLAMENCO_PATTERNS } from './iberia-flamenco';
import { GAMELAN_SOUTHEAST_ASIA_PATTERNS } from './gamelan-southeast-asia';
import { EAST_ASIA_PATTERNS } from './east-asia';
import { CELTIC_EUROPE_PATTERNS } from './celtic-europe';
import { ELECTRONIC_WESTERN_PATTERNS } from './electronic-western';
import { EXERCISE_PATTERNS } from './exercise';
import { ANDEAN_SOUTH_AMERICA_PATTERNS } from './andean-south-america';
import { MODERN_AFRICAN_PATTERNS } from './modern-african';
import { NORTH_EAST_AFRICAN_PATTERNS } from './north-east-african';
import { CENTRAL_ASIAN_PACIFIC_PATTERNS } from './central-asian-pacific';
import { CAUCASUS_MEDITERRANEAN_PATTERNS } from './caucasus-mediterranean';
import { GLOBAL_ELECTRONIC_PATTERNS } from './global-electronic';
import { UNDERGROUND_ELECTRONIC_PATTERNS } from './underground-electronic';
import { INTERNET_BORN_PATTERNS } from './internet-born';

export const PATTERNS: Pattern[] = [
  ...TURKEY_OTTOMAN_PATTERNS,
  ...BALKANS_PATTERNS,
  ...CUBA_AFROCARIBBEAN_PATTERNS,
  ...ARABIC_SWANA_PATTERNS,
  ...PERSIA_PATTERNS,
  ...INDIA_PATTERNS,
  ...WEST_AFRICA_PATTERNS,
  ...BRAZIL_PATTERNS,
  ...CARIBBEAN_PATTERNS,
  ...IBERIA_FLAMENCO_PATTERNS,
  ...GAMELAN_SOUTHEAST_ASIA_PATTERNS,
  ...EAST_ASIA_PATTERNS,
  ...CELTIC_EUROPE_PATTERNS,
  ...ELECTRONIC_WESTERN_PATTERNS,
  ...EXERCISE_PATTERNS,
  ...ANDEAN_SOUTH_AMERICA_PATTERNS,
  ...MODERN_AFRICAN_PATTERNS,
  ...NORTH_EAST_AFRICAN_PATTERNS,
  ...CENTRAL_ASIAN_PACIFIC_PATTERNS,
  ...CAUCASUS_MEDITERRANEAN_PATTERNS,
  ...GLOBAL_ELECTRONIC_PATTERNS,
  ...UNDERGROUND_ELECTRONIC_PATTERNS,
  ...INTERNET_BORN_PATTERNS,
];

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
