/**
 * One-time script: translates all npc_message fields in scenarioDialogues.ts
 * and embeds them as npc_translation using backtick strings (safe for any char).
 *
 * Run: ANTHROPIC_API_KEY=sk-... npx tsx scripts/translate-dialogues.ts
 */

import Anthropic from '@anthropic-ai/sdk';
import * as fs from 'fs';
import * as path from 'path';

const client = new Anthropic();

const FILE = path.join(__dirname, '../src/data/scenarioDialogues.ts');

async function translateBatch(messages: string[]): Promise<string[]> {
  const numbered = messages.map((m, i) => `${i + 1}. ${m}`).join('\n');
  const response = await client.messages.create({
    model: 'claude-haiku-4-5-20251001',
    max_tokens: 2048,
    messages: [{
      role: 'user',
      content: `Translate each line into Turkish. Return ONLY a JSON array of strings, same order, same count. No explanation, no markdown.\n\n${numbered}`,
    }],
  });

  const raw = response.content[0].type === 'text' ? response.content[0].text.trim() : '[]';
  const match = raw.match(/\[[\s\S]*\]/);
  if (!match) throw new Error('Bad response: ' + raw.slice(0, 300));
  return JSON.parse(match[0]) as string[];
}

async function main() {
  let src = fs.readFileSync(FILE, 'utf-8');

  // Extract all npc_message values — handle both 'single' and escaped \' quotes
  // We parse by finding npc_message: '...' where content can have \'
  const allMessages: Array<{ raw: string; content: string; index: number }> = [];

  const re = /npc_message:\s*'((?:[^'\\]|\\.)*)'/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(src)) !== null) {
    const index = m.index;
    const raw = m[0]; // the full match e.g. npc_message: 'Bonjour, qu\'est-ce...'
    const content = m[1].replace(/\\'/g, "'"); // unescape for translation
    // Skip if already has npc_translation right after
    const after = src.slice(index + raw.length, index + raw.length + 60);
    if (!after.includes('npc_translation')) {
      allMessages.push({ raw, content, index });
    }
  }

  console.log(`Found ${allMessages.length} messages to translate.`);

  const BATCH = 40;
  const translated: string[] = [];

  for (let i = 0; i < allMessages.length; i += BATCH) {
    const batch = allMessages.slice(i, i + BATCH);
    console.log(`  Batch ${Math.floor(i / BATCH) + 1} / ${Math.ceil(allMessages.length / BATCH)}`);
    const results = await translateBatch(batch.map(b => b.content));
    translated.push(...results);
  }

  // Insert translations — go backwards to preserve indices
  for (let i = allMessages.length - 1; i >= 0; i--) {
    const { raw, index } = allMessages[i];
    const tr = (translated[i] ?? allMessages[i].content).replace(/`/g, "'");
    // Use backtick string so apostrophes, single quotes etc. never break syntax
    const insertion = `${raw},\n      npc_translation: \`${tr}\``;
    src = src.slice(0, index) + insertion + src.slice(index + raw.length);
  }

  // Also add npc_translation type to StaticTurn if not present
  if (!src.includes('npc_translation?')) {
    src = src.replace(
      '  npc_message: string;',
      '  npc_message: string;\n  npc_translation?: string;',
    );
  }

  fs.writeFileSync(FILE, src, 'utf-8');
  console.log(`Done. ${allMessages.length} translations embedded.`);
}

main().catch(e => { console.error(e); process.exit(1); });
