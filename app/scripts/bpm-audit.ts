// Audit pattern BPM defaults against the shipped engine semantics.
// `BPM = steps/min`, so the "musical" BPM at quarter-note rate is
// BPM / stepsPerQuarter (4 for 16th-steps, 2 for 8th-steps, 1 for 4).
// Patterns whose musical BPM falls outside a reasonable range
// probably shipped with the wrong default.

import { PATTERNS } from '../src/patterns/seed';

type Row = {
  id: string; region: string; sig: string;
  steps: number; unit: number; defaultBpm: number;
  musicalBpm: number; pulsePerMin: number;
  verdict: string;
};

const rows: Row[] = [];

for (const p of PATTERNS) {
  const barSec = p.steps * (60 / p.bpm.default);
  const stepsPerQuarter = p.stepUnit === 16 ? 4 : p.stepUnit === 8 ? 2 : 1;
  const musicalBpm = p.bpm.default / stepsPerQuarter;
  const totalGroups = p.grouping.length;
  const pulsePerMin = totalGroups > 0 ? Math.round((60 / barSec) * totalGroups) : 0;
  let verdict = 'ok';
  if (p.stepUnit === 16 && (musicalBpm < 50 || musicalBpm > 220)) verdict = 'FIX-16';
  else if (p.stepUnit === 8 && (musicalBpm < 40 || musicalBpm > 260)) verdict = 'FIX-8';
  rows.push({
    id: p.id, region: p.region, sig: p.timeSig,
    steps: p.steps, unit: p.stepUnit, defaultBpm: p.bpm.default,
    pulsePerMin, musicalBpm: Math.round(musicalBpm), verdict,
  });
}

const suspicious = rows.filter((r) => r.verdict !== 'ok');
console.log(`Total patterns:  ${rows.length}`);
console.log(`Suspicious BPM:  ${suspicious.length}`);
console.log();
console.log('id'.padEnd(34), 'region'.padEnd(22), 'sig'.padEnd(6), 'steps unit  bpm  qBPM');
console.log('-'.repeat(90));
for (const r of suspicious) {
  console.log(
    r.id.padEnd(34),
    r.region.padEnd(22),
    r.sig.padEnd(6),
    String(r.steps).padStart(5),
    String(r.unit).padStart(5),
    String(r.defaultBpm).padStart(5),
    String(r.musicalBpm).padStart(5),
  );
}
