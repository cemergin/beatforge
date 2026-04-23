// One-shot rewrite: correct `bpm: { default, min, max }` on patterns
// whose subagent authors set "musical quarter-BPM" instead of the engine's
// "step rate" convention.
//
// Rule:
//   stepUnit=16  → if (default/4) not in [50, 220], multiply all three by 4
//   stepUnit=8   → if (default/2) not in [40, 260], multiply all three by 2
//
// Walks every region file under src/patterns/seed, state-machines through
// pattern blocks (reset on each `id:` line), rewrites matching bpm lines.

import { readFileSync, writeFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';

const seedDir = join(import.meta.dir, '..', 'src', 'patterns', 'seed');
const files = readdirSync(seedDir).filter(
  (f) => f.endsWith('.ts') && f !== 'index.ts',
);

let totalFixes = 0;
const perFile: Array<[string, number]> = [];

for (const file of files) {
  const path = join(seedDir, file);
  const src = readFileSync(path, 'utf8');
  const lines = src.split('\n');
  const out: string[] = [];
  let stepUnit: number | null = null;
  let fixes = 0;

  for (const line of lines) {
    if (/^\s*id:\s*['"]/.test(line)) stepUnit = null;
    const suMatch = line.match(/^\s*stepUnit:\s*(\d+)/);
    if (suMatch) stepUnit = parseInt(suMatch[1], 10);

    const bpmMatch = line.match(
      /^(\s*)bpm:\s*\{\s*default:\s*(\d+),\s*min:\s*(\d+),\s*max:\s*(\d+)\s*\}\s*,?\s*(\/\/.*)?$/,
    );
    if (bpmMatch && stepUnit !== null) {
      const [, indent, defStr, minStr, maxStr, comment] = bpmMatch;
      const def = parseInt(defStr, 10);
      const min = parseInt(minStr, 10);
      const max = parseInt(maxStr, 10);
      let mul = 1;
      if (stepUnit === 16) {
        const musical = def / 4;
        if (musical < 50 || musical > 220) mul = 4;
      } else if (stepUnit === 8) {
        const musical = def / 2;
        if (musical < 40 || musical > 260) mul = 2;
      }
      if (mul !== 1) {
        const tail = comment ? ` ${comment}` : '';
        out.push(
          `${indent}bpm: { default: ${def * mul}, min: ${min * mul}, max: ${max * mul} },${tail}`,
        );
        fixes++;
        totalFixes++;
        continue;
      }
    }
    out.push(line);
  }

  if (fixes > 0) {
    writeFileSync(path, out.join('\n'));
    perFile.push([file, fixes]);
  }
}

console.log(`Total BPM fixes applied: ${totalFixes}`);
for (const [file, n] of perFile) console.log(`  ${file.padEnd(30)} ${n}`);
