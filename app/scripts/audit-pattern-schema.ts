// Diagnostic: run the Zod schema against every seed JSON and print every
// failure without aborting. Helps distinguish pre-existing data bugs from
// schema mistakes.
//
// Usage: bun scripts/audit-pattern-schema.ts

import { readFileSync, readdirSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { PatternSchema } from '../src/patterns/schema';

const __dirname = dirname(fileURLToPath(import.meta.url));
const SEED_DIR = resolve(__dirname, '../src/patterns/seed');

const files = readdirSync(SEED_DIR).filter((f) => f.endsWith('.json'));
let total = 0;
let fails = 0;
const issues: Array<{ region: string; id: string; msg: string }> = [];

for (const file of files) {
  const region = file.replace(/\.json$/, '');
  const raw = JSON.parse(readFileSync(resolve(SEED_DIR, file), 'utf-8')) as unknown[];
  for (const entry of raw) {
    total += 1;
    const r = PatternSchema.safeParse(entry);
    if (!r.success) {
      fails += 1;
      const id = (entry as { id?: string }).id ?? '<no id>';
      const msg = r.error.issues
        .map((i) => `${i.path.join('.') || '<root>'}: ${i.message}`)
        .join('; ');
      issues.push({ region, id, msg });
    }
  }
}

for (const i of issues) {
  console.log(`  [${i.region}] ${i.id} — ${i.msg}`);
}
console.log(`\n${fails}/${total} patterns failed schema validation.`);
