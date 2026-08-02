/**
 * ISA820 — TFLSJ full-LSJ lexicon ingest (Greek)
 *
 * Run: node scripts/ingest-tflsj.mjs [--dry] [--limit N]
 *
 * `strongs_lexicon.definition` currently holds the TBESG/TBESH *brief* glosses —
 * median length 7 characters ("word", "God", "to create"). That is a dictionary
 * headword, not a definition, and it is why the lexicon was left out of the
 * analyst's evidence block entirely: the manuscript rows carried more meaning
 * than the lexicon did.
 *
 * TFLSJ is the full Liddell-Scott-Jones, edited by Tyndale House. This replaces
 * those glosses with the real entries.
 *
 * GREEK ONLY. TFLSJ covers G-numbers; there is no equivalent full Hebrew lexicon
 * in the vault, so H-numbers keep their brief TBESH glosses. State the asymmetry
 * rather than letting it be discovered later.
 *
 * UPDATE-only: never inserts. A Strong's number absent from strongs_lexicon is
 * reported, not created — inventing lexicon rows from a partial source would put
 * unreviewed entries behind the same UI as curated ones.
 */

import { readFileSync, readdirSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { createClient } from '@supabase/supabase-js';

const __dir = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dir, '..');
const LEX_DIR = join(ROOT, 'ISA_MASTER_VAULT', '02_Lexicons_and_Maps');

const DRY = process.argv.includes('--dry');
const limitArg = process.argv.indexOf('--limit');
const LIMIT = limitArg > -1 ? parseInt(process.argv[limitArg + 1], 10) : Infinity;

const env = {};
try {
  readFileSync(join(ROOT, '.env.local'), 'utf8').split(/\r?\n/).forEach(line => {
    const [k, ...v] = line.split('=');
    if (k && !k.startsWith('#')) env[k.trim()] = v.join('=').trim();
  });
} catch { /* ok */ }

if (!env.NEXT_PUBLIC_SUPABASE_URL || !env.SUPABASE_SERVICE_ROLE_KEY) {
  console.error('Missing NEXT_PUBLIC_SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY in .env.local');
  process.exit(1);
}
const supabase = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, {
  auth: { persistSession: false },
});

/**
 * TFLSJ definitions are HTML: <b>, <i>, <br />, and <a> tags whose title
 * attributes carry citation text that only makes sense on hover. Strip the
 * markup, keep the words, and unwrap <ref='Exo.4.14'>Exo.4:14</ref> to its label.
 */
function cleanDefinition(html) {
  if (!html) return '';
  return html
    // Hover-citation anchors: keep the visible label, drop href/title noise.
    .replace(/<a\b[^>]*>(.*?)<\/a>/gis, '$1')
    .replace(/<ref=['"][^'"]*['"]>(.*?)<\/ref>/gis, '$1')
    .replace(/<br\s*\/?>/gi, ' ')
    .replace(/<\/?(b|i|em|strong|sup|sub|span|div|p)\b[^>]*>/gi, '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>')
    .replace(/&quot;/gi, '"')
    .replace(/\s+/g, ' ')
    .trim();
}

const file = readdirSync(LEX_DIR)
  .find(f => f.startsWith('TFLSJ') && f.includes('0-5624') && f.endsWith('.txt'));
if (!file) { console.error('TFLSJ source .txt not found in', LEX_DIR); process.exit(1); }

console.log('\n╔═══════════════════════════════════════════╗');
console.log('║   ISA820 — TFLSJ Full LSJ Ingest (Greek)   ║');
console.log('╚═══════════════════════════════════════════╝\n');
console.log('Source:', file, '\n');

// Group by BASE Strong's number. TFLSJ carries disambiguated senses (G0001G,
// G0001H) that all map back to one strongs_lexicon row, so senses are merged
// under their disambiguation tag rather than one arbitrarily overwriting another.
const byStrongs = new Map();
let rows = 0;

for (const raw of readFileSync(join(LEX_DIR, file), 'utf8').split(/\r?\n/)) {
  if (!/^G\d{4}/.test(raw)) continue;
  const c = raw.split('\t');
  const base = c[0]?.trim();
  const disambig = c[2]?.trim() || base;
  const greek = c[3]?.trim() || '';
  const translit = c[4]?.trim() || '';
  const pos = c[5]?.trim() || '';
  const gloss = c[6]?.trim() || '';
  const full = cleanDefinition(c[7] || '');
  if (!base || !full) continue;
  rows++;

  if (!byStrongs.has(base)) byStrongs.set(base, { greek, translit, pos, senses: [] });
  byStrongs.get(base).senses.push({ disambig, gloss, full });
}

console.log(`Parsed ${rows.toLocaleString()} TFLSJ rows into ${byStrongs.size.toLocaleString()} Strong's entries.`);

function composeDefinition(entry) {
  return entry.senses.map(s => {
    const head = s.gloss ? `${s.gloss} — ` : '';
    const tag = entry.senses.length > 1 ? `[${s.disambig}] ` : '';
    return `${tag}${head}${s.full}`;
  }).join('\n\n');
}

const lengths = [...byStrongs.values()].map(e => composeDefinition(e).length).sort((a, b) => a - b);
console.log(`Definition length — min ${lengths[0]}, median ${lengths[Math.floor(lengths.length / 2)]}, max ${lengths.at(-1)}\n`);

// Which of these actually exist in strongs_lexicon? UPDATE-only, so unmatched
// numbers are reported rather than silently created.
console.log('Loading existing Greek strongs_lexicon ids …');
const existing = new Set();
for (let from = 0; ; from += 1000) {
  const { data, error } = await supabase
    .from('strongs_lexicon').select('strongs_id')
    .like('strongs_id', 'G%').range(from, from + 999);
  if (error) { console.error(error.message); process.exit(1); }
  if (!data?.length) break;
  data.forEach(r => existing.add(r.strongs_id));
  if (data.length < 1000) break;
}
console.log(`  ${existing.size.toLocaleString()} Greek entries in strongs_lexicon.`);

const updates = [];
const unmatched = [];
for (const [strongsId, entry] of byStrongs) {
  if (!existing.has(strongsId)) { unmatched.push(strongsId); continue; }
  updates.push({ strongsId, definition: composeDefinition(entry) });
}

console.log(`  Will update : ${updates.length.toLocaleString()}`);
console.log(`  Unmatched   : ${unmatched.length.toLocaleString()}${unmatched.length ? ' (e.g. ' + unmatched.slice(0, 6).join(', ') + ')' : ''}`);

if (DRY) {
  console.log('\n--- SAMPLE (first 2) ---');
  updates.slice(0, 2).forEach(u => {
    console.log(`\n${u.strongsId}:\n${u.definition.slice(0, 400)}${u.definition.length > 400 ? ' …' : ''}`);
  });
  console.log('\n--dry: nothing written.\n');
  process.exit(0);
}

let done = 0, failed = 0;
const target = Math.min(updates.length, LIMIT);
for (const u of updates.slice(0, LIMIT)) {
  const { error } = await supabase
    .from('strongs_lexicon')
    .update({ definition: u.definition })
    .eq('strongs_id', u.strongsId);
  if (error) { failed++; if (failed <= 5) console.error(`  ${u.strongsId}: ${error.message}`); }
  else done++;
  if (done % 250 === 0) process.stdout.write(`\r  updated ${done.toLocaleString()} / ${target.toLocaleString()} …`);
}
process.stdout.write(`\r  updated ${done.toLocaleString()} / ${target.toLocaleString()}.        \n`);

console.log('\n' + '─'.repeat(47));
console.log('✅  TFLSJ ingest complete.');
console.log(`    Updated : ${done.toLocaleString()}`);
console.log(`    Failed  : ${failed.toLocaleString()}`);
console.log('    NOTE: Greek only. H-numbers still carry brief TBESH glosses.\n');
