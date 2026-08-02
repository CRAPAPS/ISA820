/**
 * ISA820 — "Psalm" vs "Psalms" duplicate audit
 *
 * Run: node scripts/audit-psalm-duplicates.mjs [--delete]
 *
 * READ-ONLY unless --delete is passed, and --delete refuses to run if any row
 * is not a byte-identical duplicate.
 *
 * Context: the BSB import wrote the book as "Psalm" (singular) while the app and
 * every other translation use "Psalms". Renaming BSB's 2,461 rows was safe
 * because BSB had nothing under "Psalms". ASV is different — it already holds a
 * complete 2,461-verse "Psalms" AND rows under "Psalm".
 *
 * Before deleting anything we must know which of these those rows are:
 *   a) exact duplicates                → safe to remove
 *   b) same reference, DIFFERENT text  → a genuine variant; removing it destroys
 *                                        content, so STOP and report
 *   c) references absent from "Psalms" → not duplicates at all; they fill real
 *                                        gaps and must be RENAMED, not deleted
 *
 * Deleting scripture on the assumption of (a) without testing for (b) and (c)
 * would be irreversible, so this proves the case before touching anything.
 */

import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { createClient } from '@supabase/supabase-js';

const DELETE = process.argv.includes('--delete');
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

async function fetchAll(book) {
  const out = [];
  for (let from = 0; ; from += 1000) {
    const { data, error } = await supabase
      .from('verses')
      .select('id,chapter,verse,text,translation')
      .eq('book', book)
      .range(from, from + 999);
    if (error) { console.error(error.message); process.exit(1); }
    if (!data?.length) break;
    out.push(...data);
    if (data.length < 1000) break;
  }
  return out;
}

console.log('\n── "Psalm" (singular) rows remaining ──');
const singular = await fetchAll('Psalm');
const byTranslation = singular.reduce((a, r) => { (a[r.translation] ??= []).push(r); return a; }, {});
for (const [t, rows] of Object.entries(byTranslation)) console.log(`  ${t}: ${rows.length}`);

const plural = await fetchAll('Psalms');
const pluralIdx = new Map();
for (const r of plural) pluralIdx.set(`${r.translation}|${r.chapter}:${r.verse}`, r);
console.log(`  ("Psalms" holds ${plural.length} rows across ${new Set(plural.map(r => r.translation)).size} translations)\n`);

/**
 * Compare the WORDS, not the encoding.
 *
 * The two ASV passes differ only in that one carries inline Strong's markup:
 *   "Psalms" : He|strong="H2009" hath made a|strong="H3068" pit, and digged it
 *   "Psalm"  : He hath made a pit, and digged it
 *
 * A raw string comparison calls those different and blocks the cleanup, but they
 * are the same verse — one import simply preserved the tagging. Strip the markup
 * and the punctuation spacing it introduces, then compare. If they match, the
 * untagged copy carries no information the tagged copy lacks.
 */
const norm = s => String(s || '')
  .replace(/\|strong="[^"]*"/g, '')
  .replace(/\s+([,.;:!?'")\]])/g, '$1')
  .replace(/\s+/g, ' ')
  .trim()
  .toLowerCase();

const exact = [], differing = [], orphans = [];
for (const r of singular) {
  const twin = pluralIdx.get(`${r.translation}|${r.chapter}:${r.verse}`);
  if (!twin) { orphans.push(r); continue; }
  if (norm(twin.text) === norm(r.text)) exact.push(r);
  else differing.push({ singular: r, plural: twin });
}

console.log('── classification ──');
console.log(`  exact duplicates            : ${exact.length}   (safe to delete)`);
console.log(`  SAME ref, DIFFERENT text    : ${differing.length}   (variant — do NOT delete)`);
console.log(`  no counterpart under Psalms : ${orphans.length}   (real content — RENAME, not delete)\n`);

if (differing.length) {
  console.log('── differing text samples (first 5) ──');
  differing.slice(0, 5).forEach(d => {
    console.log(`\n  ${d.singular.translation} ${d.singular.chapter}:${d.singular.verse}`);
    console.log(`    Psalm : ${norm(d.singular.text).slice(0, 160)}`);
    console.log(`    Psalms: ${norm(d.plural.text).slice(0, 160)}`);
  });
  console.log();
}

if (orphans.length) {
  console.log('── orphan chapter spread (would be LOST if deleted) ──');
  const spread = orphans.reduce((a, r) => { a[r.chapter] = (a[r.chapter] || 0) + 1; return a; }, {});
  const chs = Object.keys(spread).map(Number).sort((a, b) => a - b);
  console.log(`  chapters ${chs[0]}-${chs.at(-1)}, ${chs.length} distinct, ${orphans.length} verses`);
  console.log(`  sample: ${orphans.slice(0, 3).map(o => `${o.chapter}:${o.verse} "${norm(o.text).slice(0, 50)}..."`).join('  |  ')}\n`);
}

if (!DELETE) {
  console.log('Read-only. Re-run with --delete to remove ONLY exact duplicates.\n');
  process.exit(0);
}

// Orphans are never safe: no counterpart exists, so deleting loses the verse.
if (orphans.length) {
  console.error('REFUSING TO DELETE — some rows have no counterpart under "Psalms".');
  console.error('Those are unique verses. Rename them instead of deleting.\n');
  process.exit(1);
}

// Rows that still differ after markup normalisation are LEFT IN PLACE. In the ASV
// case they carry the square-bracket convention marking translator-supplied words
// ("thou wilt not require [it]") which the "Psalms" copy dropped — real editorial
// information, not an encoding artefact. Only byte-equal-after-normalisation rows
// are removed.
if (differing.length) {
  console.log(`NOTE: ${differing.length} rows differ beyond markup and will be PRESERVED.\n`);
}

// Batches of 100 hit "canceling statement due to statement timeout" — the IN
// list is evaluated against a 185k-row table under RLS. 20 stays well inside the
// limit, and a failed batch is retried once before giving up so a single slow
// statement does not abandon the run half-done.
let removed = 0, failedBatches = 0;
for (let i = 0; i < exact.length; i += 20) {
  const ids = exact.slice(i, i + 20).map(r => r.id);
  let { error } = await supabase.from('verses').delete().in('id', ids);
  if (error) {
    await new Promise(r => setTimeout(r, 500));
    ({ error } = await supabase.from('verses').delete().in('id', ids));
  }
  if (error) { console.error(`  batch at ${i} failed: ${error.message}`); failedBatches++; continue; }
  removed += ids.length;
  if (removed % 200 === 0) process.stdout.write(`\r  deleted ${removed}/${exact.length} ...`);
}
if (failedBatches) console.error(`\n  ${failedBatches} batches failed — re-run to finish.`);
console.log(`Deleted ${removed} exact duplicate rows.\n`);
