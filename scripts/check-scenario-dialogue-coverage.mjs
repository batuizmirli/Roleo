/**
 * Lists scenarios that still rely on generic stageType+language pools
 * (no matching scenarioId block in scenarioDialogues.ts).
 *
 * Run: node scripts/check-scenario-dialogue-coverage.mjs
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, '..');
const scenariosPath = path.join(root, 'src/data/scenarios.ts');
const dialoguesPath = path.join(root, 'src/data/scenarioDialogues.ts');

const scenariosSrc = fs.readFileSync(scenariosPath, 'utf8');
const dialoguesSrc = fs.readFileSync(dialoguesPath, 'utf8');

const coveredIds = new Set();
for (const m of dialoguesSrc.matchAll(/scenarioId:\s*'([^']+)'/g)) {
  coveredIds.add(m[1]);
}

const SKIP_IDS = new Set(['fallback-scene']);

const rows = [];
const idBlocks = scenariosSrc.split(/\bid:\s*/).slice(1);
for (const block of idBlocks) {
  const idMatch = block.match(/^'([^']+)'/);
  if (!idMatch) continue;
  const id = idMatch[1];
  const langMatch = block.match(/language:\s*'([a-z]{2})'/);
  const stageMatch = block.match(/stageType:\s*'([^']+)'/);
  if (!langMatch || !stageMatch) continue;
  rows.push({ id, lang: langMatch[1], stage: stageMatch[1] });
}

const missing = rows.filter((r) => !SKIP_IDS.has(r.id) && !coveredIds.has(r.id));

console.log(`Sahne tanımları: ${rows.length} (fallback hariç kontrol: ${rows.length - SKIP_IDS.size} ilgi)`);
console.log(`scenarioId ile özel havuz: ${coveredIds.size}`);
console.log(`Eksik özel havuz: ${missing.length}\n`);

const byLang = {};
for (const r of missing) {
  byLang[r.lang] = byLang[r.lang] || [];
  byLang[r.lang].push(r);
}

for (const lang of Object.keys(byLang).sort()) {
  console.log(`--- ${lang} (${byLang[lang].length}) ---`);
  for (const r of byLang[lang]) {
    console.log(`  ${r.id}\t[${r.stage}]`);
  }
}

if (missing.length === 0) {
  console.log('\nTüm sahneler (fallback hariç) özel havuza bağlı görünüyor.');
}
