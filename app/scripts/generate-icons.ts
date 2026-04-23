// Generate PNG icons from public/icons/icon.svg at 192, 512, and 512-maskable.
// Run with: bun scripts/generate-icons.ts
//
// Uses sharp when available, otherwise falls back to writing the SVG itself
// as a fallback (browsers that support SVG icons in manifest will still work).

import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';

const svgPath = resolve(import.meta.dir, '../public/icons/icon.svg');
const outDir = resolve(import.meta.dir, '../public/icons');

if (!existsSync(svgPath)) {
  console.error(`Missing ${svgPath}`);
  process.exit(1);
}

const svg = readFileSync(svgPath);

async function tryRaster(size: number, out: string, maskable = false): Promise<boolean> {
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const sharp = (await import('sharp')).default;
    let pipeline = sharp(svg, { density: 300 }).resize(size, size);
    if (maskable) {
      pipeline = pipeline.extend({ top: 0, bottom: 0, left: 0, right: 0 });
    }
    await pipeline.png().toFile(out);
    return true;
  } catch {
    return false;
  }
}

const targets: Array<[number, string, boolean]> = [
  [192, resolve(outDir, 'icon-192.png'), false],
  [512, resolve(outDir, 'icon-512.png'), false],
  [512, resolve(outDir, 'icon-maskable-512.png'), true],
];

for (const [size, out, maskable] of targets) {
  const ok = await tryRaster(size, out, maskable);
  if (!ok) {
    // Fallback: just copy SVG bytes under the .png name (browsers that inspect
    // bytes will reject, but at least the build doesn't break).
    writeFileSync(out.replace(/\.png$/, '.svg'), svg);
    console.warn(`sharp not installed; wrote SVG fallback for ${out}`);
  } else {
    console.log(`wrote ${out}`);
  }
}
