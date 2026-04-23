// One-shot migration: seed/<region>.ts → seed/<region>.json.
//
// Imports each region's TS module, writes its exported array to a sibling
// JSON file with 2-space indentation. Preserves author-written field order —
// no alphabetical re-sort — so diffs stay semantic.
//
// Usage: bun scripts/migrate-patterns-to-json.ts

import { writeFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import type { Pattern } from '../src/patterns/types';

const __dirname = dirname(fileURLToPath(import.meta.url));
const SEED_DIR = resolve(__dirname, '../src/patterns/seed');

// Ordered list — matches the concat order in the old seed/index.ts. Each
// entry is (region slug, named export). The slug is also the output
// filename.
const REGIONS: Array<[string, string]> = [
  ['turkey-ottoman', 'TURKEY_OTTOMAN_PATTERNS'],
  ['balkans', 'BALKANS_PATTERNS'],
  ['cuba-afrocaribbean', 'CUBA_AFROCARIBBEAN_PATTERNS'],
  ['arabic-swana', 'ARABIC_SWANA_PATTERNS'],
  ['persia', 'PERSIA_PATTERNS'],
  ['india', 'INDIA_PATTERNS'],
  ['west-africa', 'WEST_AFRICA_PATTERNS'],
  ['brazil', 'BRAZIL_PATTERNS'],
  ['caribbean', 'CARIBBEAN_PATTERNS'],
  ['iberia-flamenco', 'IBERIA_FLAMENCO_PATTERNS'],
  ['gamelan-southeast-asia', 'GAMELAN_SOUTHEAST_ASIA_PATTERNS'],
  ['east-asia', 'EAST_ASIA_PATTERNS'],
  ['celtic-europe', 'CELTIC_EUROPE_PATTERNS'],
  ['electronic-western', 'ELECTRONIC_WESTERN_PATTERNS'],
  ['exercise', 'EXERCISE_PATTERNS'],
  ['andean-south-america', 'ANDEAN_SOUTH_AMERICA_PATTERNS'],
  ['modern-african', 'MODERN_AFRICAN_PATTERNS'],
  ['north-east-african', 'NORTH_EAST_AFRICAN_PATTERNS'],
  ['central-asian-pacific', 'CENTRAL_ASIAN_PACIFIC_PATTERNS'],
  ['caucasus-mediterranean', 'CAUCASUS_MEDITERRANEAN_PATTERNS'],
  ['global-electronic', 'GLOBAL_ELECTRONIC_PATTERNS'],
  ['underground-electronic', 'UNDERGROUND_ELECTRONIC_PATTERNS'],
  ['internet-born', 'INTERNET_BORN_PATTERNS'],
];

let total = 0;
for (const [slug, exportName] of REGIONS) {
  const srcPath = resolve(SEED_DIR, `${slug}.ts`);
  const mod = await import(srcPath);
  const arr = mod[exportName] as Pattern[] | undefined;
  if (!Array.isArray(arr)) {
    throw new Error(`[${slug}] expected named export "${exportName}" to be an array, got ${typeof arr}`);
  }
  const outPath = resolve(SEED_DIR, `${slug}.json`);
  writeFileSync(outPath, JSON.stringify(arr, null, 2) + '\n', 'utf-8');
  console.log(`  ${slug.padEnd(26)}  ${String(arr.length).padStart(3)} patterns  →  ${slug}.json`);
  total += arr.length;
}

console.log(`\nWrote ${REGIONS.length} JSON files, ${total} patterns total.`);
