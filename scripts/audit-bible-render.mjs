/**
 * ISA820 — Full Bible render audit
 *
 * Run: node scripts/audit-bible-render.mjs [--verbose]
 *
 * Read-only. Answers "does every chapter of every book render in every
 * translation, and does the text arrive clean?" — which spot checks and HTTP 200s
 * cannot answer, because the reader fetches client-side and an empty result
 * renders as "No verses found … Data may still be loading from vault".
 *
 * Checks, per translation:
 *   1. MISSING CHAPTERS  — a chapter the reader offers but the DB cannot fill.
 *                          Exactly the condition behind "No verses found".
 *   2. CHAPTER OVERRUN   — chapters in the DB beyond the app's BOOK_CHAPTERS map,
 *                          i.e. text that exists but is unreachable in the UI.
 *   3. MARKUP RESIDUE    — text still carrying importer markup after the
 *                          WEB/ASV `|strong="G0000"` handling.
 *   4. EMPTY TEXT        — rows present but blank; renders as a silent gap.
 *   5. VERSE GAPS        — non-contiguous verse numbers within a chapter.
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

// Mirrors BOOK_CHAPTERS in src/shared/components/BibleReader.tsx. If these drift,
// the reader offers chapters that cannot exist — so a mismatch is itself a finding.
const BOOK_CHAPTERS = {
  'Genesis':50,'Exodus':40,'Leviticus':27,'Numbers':36,'Deuteronomy':34,'Joshua':24,
  'Judges':21,'Ruth':4,'1 Samuel':31,'2 Samuel':24,'1 Kings':22,'2 Kings':25,
  '1 Chronicles':29,'2 Chronicles':36,'Ezra':10,'Nehemiah':13,'Esther':10,'Job':42,
  'Psalms':150,'Proverbs':31,'Ecclesiastes':12,'Song of Solomon':8,'Isaiah':66,
  'Jeremiah':52,'Lamentations':5,'Ezekiel':48,'Daniel':12,'Hosea':14,'Joel':3,
  'Amos':9,'Obadiah':1,'Jonah':4,'Micah':7,'Nahum':3,'Habakkuk':3,'Zephaniah':3,
  'Haggai':2,'Zechariah':14,'Malachi':4,
  'Matthew':28,'Mark':16,'Luke':24,'John':21,'Acts':28,'Romans':16,
  '1 Corinthians':16,'2 Corinthians':13,'Galatians':6,'Ephesians':6,
  'Philippians':4,'Colossians':4,'1 Thessalonians':5,'2 Thessalonians':3,
  '1 Timothy':6,'2 Timothy':4,'Titus':3,'Philemon':1,'Hebrews':13,'James':5,
  '1 Peter':5,'2 Peter':3,'1 John':5,'2 John':1,'3 John':1,'Jude':1,'Revelation':22,
};

const NT = new Set(['Matthew','Mark','Luke','John','Acts','Romans','1 Corinthians',
  '2 Corinthians','Galatians','Ephesians','Philippians','Colossians',
  '1 Thessalonians','2 Thessalonians','1 Timothy','2 Timothy','Titus','Philemon',
  'Hebrews','James','1 Peter','2 Peter','1 John','2 John','3 John','Jude','Revelation']);

// TAHOT covers the OT, TBESG the NT. Judging them against the whole canon would
// report ~40 phantom "missing" books each.
const SCOPE = {
  TAHOT: b => !NT.has(b),
  TBESG: b => NT.has(b),
};

console.log('\n╔═══════════════════════════════════════════╗');
console.log('║   ISA820 — Full Bible Render Audit         ║');
console.log('╚═══════════════════════════════════════════╝\n');
console.log('Streaming verses (book, chapter, verse, translation, text) …');

// index[translation][book] = Map<chapter, {verses:Set, empty:int, markup:int}>
const index = {};
const markupSamples = [];
let total = 0;

const PAGE = 1000;
for (let from = 0; ; from += PAGE) {
  const { data, error } = await supabase
    .from('verses')
    .select('book,chapter,verse,translation,text')
    .order('id')
    .range(from, from + PAGE - 1);
  if (error) { console.error('\nQuery failed:', error.message); process.exit(1); }
  if (!data?.length) break;

  for (const r of data) {
    total++;
    const t = r.translation, b = r.book;
    ((index[t] ??= {})[b] ??= new Map());
    const chapters = index[t][b];
    if (!chapters.has(r.chapter)) chapters.set(r.chapter, { verses: new Set(), empty: 0, markup: 0 });
    const ch = chapters.get(r.chapter);
    ch.verses.add(r.verse);

    const text = r.text || '';
    if (!text.trim()) ch.empty++;
    // Residue = importer markup the reader would print verbatim. The WEB/ASV
    // `|strong="G0000"` form is now parsed, so it is NOT residue; anything else is.
    const stripped = text.replace(/\|strong="[^"]*"/g, '');
    if (/[<>]|\{[A-Z]|\\[a-z]{2,}|\|[a-z]+=/.test(stripped)) {
      ch.markup++;
      if (markupSamples.length < 8) {
        markupSamples.push(`${t} ${b} ${r.chapter}:${r.verse} — ${stripped.slice(0, 90)}`);
      }
    }
  }
  if (from % 20000 === 0) process.stdout.write(`\r  ${total.toLocaleString()} rows …`);
  if (data.length < PAGE) break;
}
process.stdout.write(`\r  ${total.toLocaleString()} rows indexed.            \n\n`);

const findings = { missing: 0, overrun: 0, markup: 0, empty: 0, gaps: 0 };

for (const translation of Object.keys(index).sort()) {
  const inScope = SCOPE[translation] || (() => true);
  const books = index[translation];
  const missingChapters = [];
  const overrunChapters = [];
  let markupRows = 0, emptyRows = 0;
  const verseGaps = [];

  for (const [book, expected] of Object.entries(BOOK_CHAPTERS)) {
    if (!inScope(book)) continue;
    const chapters = books[book];
    if (!chapters) { missingChapters.push(`${book} (all ${expected})`); continue; }

    for (let c = 1; c <= expected; c++) if (!chapters.has(c)) missingChapters.push(`${book} ${c}`);
    for (const c of chapters.keys()) if (c > expected) overrunChapters.push(`${book} ${c}`);

    for (const [c, info] of chapters) {
      markupRows += info.markup;
      emptyRows += info.empty;
      const nums = [...info.verses].filter(n => n > 0).sort((a, b) => a - b);
      if (nums.length && nums.at(-1) !== nums.length) {
        verseGaps.push(`${book} ${c} (max ${nums.at(-1)}, have ${nums.length})`);
      }
    }
  }

  findings.missing += missingChapters.length;
  findings.overrun += overrunChapters.length;
  findings.markup  += markupRows;
  findings.empty   += emptyRows;
  findings.gaps    += verseGaps.length;

  const ok = !missingChapters.length && !overrunChapters.length && !markupRows && !emptyRows;
  console.log(`── ${translation} ${ok ? '[OK]' : '[!]'}`);
  console.log(`   missing chapters : ${missingChapters.length}${missingChapters.length ? '  -> ' + missingChapters.slice(0, 6).join(', ') + (missingChapters.length > 6 ? ` ... +${missingChapters.length - 6}` : '') : ''}`);
  if (overrunChapters.length) console.log(`   UNREACHABLE      : ${overrunChapters.length}  -> ${overrunChapters.slice(0, 6).join(', ')}`);
  if (markupRows)  console.log(`   markup residue   : ${markupRows}`);
  if (emptyRows)   console.log(`   empty text       : ${emptyRows}`);
  if (verseGaps.length) console.log(`   verse gaps       : ${verseGaps.length}${VERBOSE ? '  -> ' + verseGaps.slice(0, 10).join(', ') : ''}`);
  console.log();
}

if (markupSamples.length) {
  console.log('── markup residue samples ──');
  markupSamples.forEach(s => console.log('   ' + s));
  console.log();
}

console.log('─'.repeat(47));
console.log('TOTALS');
console.log(`  missing chapters (render as "No verses found") : ${findings.missing}`);
console.log(`  chapters unreachable from the UI               : ${findings.overrun}`);
console.log(`  rows with markup residue                       : ${findings.markup}`);
console.log(`  rows with empty text                           : ${findings.empty}`);
console.log(`  chapters with verse-number gaps                : ${findings.gaps}`);
console.log();
