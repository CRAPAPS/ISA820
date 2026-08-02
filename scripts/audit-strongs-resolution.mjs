/**
 * ISA820 — Strong's ID resolution audit
 *
 * Run: node scripts/audit-strongs-resolution.mjs [--verbose]
 *
 * READ-ONLY.
 *
 * Answers: for every Strong's number the app actually looks up, is there a
 * lexicon row it can find? A missing definition is invisible in the UI — the
 * panel simply shows nothing — so this has to be measured, not eyeballed.
 *
 * Three ID formats are in play, and they do not agree:
 *
 *   verses.word_strongs / strongs_numbers (KJV) : G746     unpadded, no suffix
 *   verses.strongs_numbers (TBESG)              : G0746    padded, no suffix
 *   tahot_words.root_d_strong                   : H5921A   padded + suffix
 *   strongs_lexicon.strongs_id                  : G0032G   padded + suffix
 *
 * Consequences, all confirmed against live data:
 *   - "G746" finds nothing: the lexicon stores "G0746".
 *   - "G0032" finds nothing: the lexicon only holds the disambiguated "G0032G".
 *   - "G2258" finds nothing at all — a KJV-era Strong's number absent from an
 *     *extended* Strong's lexicon, which uses G1510 for that form. That is a
 *     genuine data gap, not a formatting mismatch, and no resolver can fix it.
 *
 * Classifies every referenced ID into exact / resolved-by-padding /
 * resolved-by-suffix / UNRESOLVABLE, so a fix can target the real causes and the
 * residue is known rather than assumed.
 */

import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { createClient } from '@supabase/supabase-js';

const VERBOSE = process.argv.includes('--verbose');
const __dir = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dir, '..');

const env = {};
try {
  readFileSync(join(ROOT, '.env.local'), 'utf8').split(/\r?\n/).forEach(l => {
    const [k, ...v] = l.split('=');
    if (k && !k.startsWith('#')) env[k.trim()] = v.join('=').trim();
  });
} catch { /* ok */ }

if (!env.NEXT_PUBLIC_SUPABASE_URL || !env.SUPABASE_SERVICE_ROLE_KEY) {
  console.error('Missing Supabase credentials in .env.local');
  process.exit(1);
}
const supabase = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, {
  auth: { persistSession: false },
});

async function page(table, select, onRow) {
  for (let from = 0; ; from += 1000) {
    const { data, error } = await supabase.from(table).select(select).range(from, from + 999);
    if (error) { console.error(`${table}: ${error.message}`); process.exit(1); }
    if (!data?.length) break;
    data.forEach(onRow);
    if (data.length < 1000) break;
  }
}

console.log('\n╔═══════════════════════════════════════════╗');
console.log("║   ISA820 — Strong's Resolution Audit       ║");
console.log('╚═══════════════════════════════════════════╝\n');

// ── 1. every id the lexicon can offer ───────────────────────────────────────
console.log('Loading strongs_lexicon ...');
const lexExact = new Set();
await page('strongs_lexicon', 'strongs_id', r => lexExact.add(r.strongs_id));
console.log(`  ${lexExact.size.toLocaleString()} lexicon entries\n`);

// base (padded, suffix stripped) -> [full ids], so a base number can find its
// disambiguated senses.
const lexByBase = new Map();
for (const id of lexExact) {
  const m = id.match(/^([HGA])(\d+)/);
  if (!m) continue;
  const base = m[1] + m[2].padStart(4, '0');
  if (!lexByBase.has(base)) lexByBase.set(base, []);
  lexByBase.get(base).push(id);
}

// ── 2. every id anything actually references ────────────────────────────────
console.log('Collecting referenced ids ...');
const refs = new Map(); // id -> Set(source)
const addRef = (id, source) => {
  if (!id) return;
  const clean = String(id).trim().toUpperCase();
  if (!/^[HGA]\d/.test(clean)) return;
  if (!refs.has(clean)) refs.set(clean, new Set());
  refs.get(clean).add(source);
};

await page('verses', 'translation,strongs_numbers,word_strongs', r => {
  (r.strongs_numbers || []).forEach(s => addRef(s, `verses.strongs_numbers/${r.translation}`));
  (r.word_strongs || []).forEach(t => t?.s && addRef(t.s, `verses.word_strongs/${r.translation}`));
});
console.log(`  after verses      : ${refs.size.toLocaleString()}`);

await page('tagnt_words', 'translation,root_d_strong', r => {
  addRef(r.root_d_strong, 'tagnt_words.root_d_strong');
  // TAGNT packs strongs+morphology as "G3588=T-ASM"
  const m = String(r.translation || '').match(/^([GH]\d+[A-Z]?)=/);
  if (m) addRef(m[1], 'tagnt_words.translation');
});
console.log(`  after tagnt_words : ${refs.size.toLocaleString()}`);

await page('tahot_words', 'root_d_strong', r => addRef(r.root_d_strong, 'tahot_words.root_d_strong'));
console.log(`  after tahot_words : ${refs.size.toLocaleString()}\n`);

// ── 3. classify ─────────────────────────────────────────────────────────────
const buckets = { exact: [], padded: [], suffix: [], unresolvable: [] };

for (const id of refs.keys()) {
  if (lexExact.has(id)) { buckets.exact.push(id); continue; }
  const m = id.match(/^([HGA])(\d+)([A-Z]?)$/);
  if (!m) { buckets.unresolvable.push(id); continue; }
  const padded = m[1] + m[2].padStart(4, '0') + m[3];
  if (lexExact.has(padded)) { buckets.padded.push(id); continue; }
  const base = m[1] + m[2].padStart(4, '0');
  if (lexByBase.has(base)) { buckets.suffix.push(id); continue; }
  buckets.unresolvable.push(id);
}

const total = refs.size;
const pct = n => ((n / total) * 100).toFixed(1) + '%';

console.log("── resolution of every referenced Strong's id ──");
console.log(`  total distinct referenced : ${total.toLocaleString()}`);
console.log(`  exact match               : ${buckets.exact.length.toLocaleString()}  (${pct(buckets.exact.length)})`);
console.log(`  needs ZERO-PADDING        : ${buckets.padded.length.toLocaleString()}  (${pct(buckets.padded.length)})   e.g. ${buckets.padded.slice(0, 5).join(', ')}`);
console.log(`  needs SUFFIX lookup       : ${buckets.suffix.length.toLocaleString()}  (${pct(buckets.suffix.length)})   e.g. ${buckets.suffix.slice(0, 5).join(', ')}`);
console.log(`  UNRESOLVABLE              : ${buckets.unresolvable.length.toLocaleString()}  (${pct(buckets.unresolvable.length)})`);
console.log();

if (buckets.unresolvable.length) {
  console.log('── unresolvable: no lexicon entry under any form ──');
  const bySrc = {};
  for (const id of buckets.unresolvable) {
    for (const s of refs.get(id)) (bySrc[s] ??= []).push(id);
  }
  for (const [src, ids] of Object.entries(bySrc).sort((a, b) => b[1].length - a[1].length)) {
    console.log(`  ${src.padEnd(38)} ${ids.length.toString().padStart(5)}  e.g. ${ids.slice(0, 6).join(', ')}`);
  }
  if (VERBOSE) console.log('\n  full list:\n  ' + buckets.unresolvable.sort().join(' '));
  console.log();
}

const fixable = buckets.padded.length + buckets.suffix.length;
console.log('─'.repeat(47));
console.log(`FIXABLE BY A RESOLVER : ${fixable.toLocaleString()} ids (${pct(fixable)})`);
console.log(`GENUINE DATA GAPS     : ${buckets.unresolvable.length.toLocaleString()} ids (${pct(buckets.unresolvable.length)})`);
console.log();
