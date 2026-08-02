/**
 * ISA820 — targeted English chapter backfill
 *
 * Run: node scripts/backfill-english-chapters.mjs <TRANSLATION> <Book> <from> <to> [--dry]
 *   e.g. node scripts/backfill-english-chapters.mjs ASV Nahum 1 3
 *
 * Repairs individual chapters the audit reports as missing, without re-importing
 * a whole translation.
 *
 * WHY THIS EXISTS
 * `import-asv-ylt.js` pulled from getbible.net and, on failure, did
 * `console.warn('SKIP <book> after 3 attempts')` and carried on. Nahum failed at
 * import time for ASV/WEB/YLT and the warning scrolled past unnoticed — the gap
 * only surfaced when audit-bible-render.mjs went looking. getbible.net now
 * 301-redirects every request (Cloudflare), so that source is gone entirely and
 * re-running the original importer would repair nothing.
 *
 * This uses bible-api.com, the same upstream /api/bible-external already proxies.
 *
 * KNOWN SOURCE GAP: bible-api.com has no YLT minor prophets — Micah, Nahum and
 * Habakkuk all return "not found", though YLT John returns fine. YLT/Nahum
 * therefore cannot be repaired from either source and needs a different one.
 *
 * Fails loudly. A chapter that cannot be fetched is reported as an error, never
 * skipped silently — that behaviour is what hid this in the first place.
 */

import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { createClient } from '@supabase/supabase-js';

const [, , TRANSLATION, BOOK, FROM, TO] = process.argv;
const DRY = process.argv.includes('--dry');

if (!TRANSLATION || !BOOK || !FROM || !TO) {
  console.error('Usage: node scripts/backfill-english-chapters.mjs <TRANSLATION> <Book> <from> <to> [--dry]');
  process.exit(1);
}

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

const sleep = ms => new Promise(r => setTimeout(r, ms));

async function fetchChapter(book, chapter, translation) {
  const url = `https://bible-api.com/${encodeURIComponent(book)}%20${chapter}?translation=${translation.toLowerCase()}`;
  for (let attempt = 1; attempt <= 3; attempt++) {
    try {
      const res = await fetch(url);
      if (!res.ok) { await sleep(800 * attempt); continue; }
      const data = await res.json();
      if (data.error) return { error: data.error };
      if (!Array.isArray(data.verses) || !data.verses.length) return { error: 'no verses in response' };
      return { verses: data.verses };
    } catch (err) {
      if (attempt === 3) return { error: String(err) };
      await sleep(800 * attempt);
    }
  }
  return { error: 'upstream unavailable after 3 attempts' };
}

console.log(`\nBackfill ${TRANSLATION} ${BOOK} ${FROM}-${TO}${DRY ? '  (dry run)' : ''}\n`);

let inserted = 0, skipped = 0, failed = 0;

for (let c = Number(FROM); c <= Number(TO); c++) {
  // Never overwrite existing text.
  const { count } = await supabase
    .from('verses')
    .select('id', { count: 'exact', head: true })
    .eq('book', BOOK).eq('chapter', c).eq('translation', TRANSLATION);

  if (count > 0) { console.log(`  ${BOOK} ${c}: already has ${count} verses — skipped`); skipped++; continue; }

  const { verses, error } = await fetchChapter(BOOK, c, TRANSLATION);
  if (error) { console.error(`  ${BOOK} ${c}: FETCH FAILED — ${error}`); failed++; continue; }

  const rows = verses.map(v => ({
    book: BOOK,
    chapter: v.chapter ?? c,
    verse: v.verse,
    text: String(v.text || '').replace(/\s+/g, ' ').trim(),
    translation: TRANSLATION,
    speaker: null,
    strongs_numbers: null,
    word_strongs: null,
    pillar_tags: [],
    translations_jsonb: null,
  })).filter(r => r.text);

  if (DRY) {
    console.log(`  ${BOOK} ${c}: would insert ${rows.length} verses (v1: "${rows[0]?.text.slice(0, 60)}…")`);
    continue;
  }

  const { error: insErr } = await supabase.from('verses').insert(rows);
  if (insErr) { console.error(`  ${BOOK} ${c}: INSERT FAILED — ${insErr.message}`); failed++; continue; }
  console.log(`  ${BOOK} ${c}: inserted ${rows.length} verses`);
  inserted += rows.length;
  await sleep(400); // be polite to the upstream
}

console.log(`\n  inserted ${inserted} · chapters skipped ${skipped} · failures ${failed}\n`);
if (failed) process.exit(1);
