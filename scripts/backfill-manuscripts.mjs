/**
 * ISA820 — Manuscript Backfill (idempotent)
 *
 * Run: node scripts/backfill-manuscripts.mjs [--dry]
 *
 * parse-tahot.mjs / parse-tagnt.mjs are first-load parsers: they push every row
 * and rely on an ON CONFLICT target to absorb re-runs. `tagnt_words.ref` has no
 * unique index, so that strategy fails outright once the table is populated.
 *
 * This script instead reads the refs already present, diffs them against the
 * source files, and inserts only what is missing. Safe to run repeatedly.
 *
 * It exists because three parser bugs silently dropped ~34,800 word rows:
 *   - the ref regex had no branch for divergent versification, e.g.
 *     "Psa.51.0(51.1)#01=L", so every such verse was skipped (all of Psalm 51)
 *   - the Greek book map said Mar, the source says Mrk  → all of Mark lost
 *   - the Hebrew map said Joe/Nah, the source says Jol/Nam → Joel, Nahum lost
 */

import { readFileSync, readdirSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { createClient } from '@supabase/supabase-js';

const __dir = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dir, '..');
const HEBREW_DIR = join(ROOT, 'ISA_MASTER_VAULT', '01_Bible_Raw', 'Hebrew');
const GREEK_DIR = join(ROOT, 'ISA_MASTER_VAULT', '01_Bible_Raw', 'Greek', 'Source_Text');

const DRY = process.argv.includes('--dry');

const env = {};
try {
  readFileSync(join(ROOT, '.env.local'), 'utf8').split('\n').forEach(line => {
    const [k, ...v] = line.split('=');
    if (k && !k.startsWith('#')) env[k.trim()] = v.join('=').trim();
  });
} catch { /* ok */ }

const supabase = createClient(
  env.NEXT_PUBLIC_SUPABASE_URL,
  env.SUPABASE_SERVICE_ROLE_KEY || env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  { auth: { persistSession: false } },
);

const HEB_BOOKS = {
  Gen:'Genesis',      Exo:'Exodus',       Lev:'Leviticus',    Num:'Numbers',
  Deu:'Deuteronomy',  Jos:'Joshua',       Jdg:'Judges',       Rut:'Ruth',
  '1Sa':'1 Samuel',   '2Sa':'2 Samuel',   '1Ki':'1 Kings',    '2Ki':'2 Kings',
  '1Ch':'1 Chronicles','2Ch':'2 Chronicles',Ezr:'Ezra',       Neh:'Nehemiah',
  Est:'Esther',       Job:'Job',          Psa:'Psalms',       Pro:'Proverbs',
  Ecc:'Ecclesiastes', Sng:'Song of Songs',Isa:'Isaiah',       Jer:'Jeremiah',
  Lam:'Lamentations', Ezk:'Ezekiel',      Dan:'Daniel',       Hos:'Hosea',
  Jol:'Joel',         Amo:'Amos',         Oba:'Obadiah',      Jon:'Jonah',
  Mic:'Micah',        Nam:'Nahum',        Hab:'Habakkuk',     Zep:'Zephaniah',
  Hag:'Haggai',       Zec:'Zechariah',    Mal:'Malachi',
};

const GRK_BOOKS = {
  Mat:'Matthew',     Mrk:'Mark',           Luk:'Luke',        Jhn:'John',
  Act:'Acts',        Rom:'Romans',         '1Co':'1 Corinthians','2Co':'2 Corinthians',
  Gal:'Galatians',   Eph:'Ephesians',      Php:'Philippians', Col:'Colossians',
  '1Th':'1 Thessalonians','2Th':'2 Thessalonians',
  '1Ti':'1 Timothy', '2Ti':'2 Timothy',    Tit:'Titus',       Phm:'Philemon',
  Heb:'Hebrews',     Jas:'James',          '1Pe':'1 Peter',   '2Pe':'2 Peter',
  '1Jn':'1 John',    '2Jn':'2 John',       '3Jn':'3 John',    Jud:'Jude',
  Rev:'Revelation',
};

const REF_RE = /^([^.]+)\.(\d+)\.(\d+)(?:\((\d+)\.(\d+)\))?#(\d+)=([A-Z0-9]+)$/;

function parseRef(refRaw) {
  const m = refRaw.match(REF_RE);
  if (!m) return null;
  return {
    book_abbr: m[1],
    chapter: parseInt(m[2], 10),
    verse: parseInt(m[3], 10),
    altPart: m[4] ? `(${m[4]}.${m[5]})` : '',
    word_num: parseInt(m[6], 10),
    text_type: m[7],
  };
}

function extractRoot(dStrongs) {
  if (!dStrongs) return null;
  const m = dStrongs.match(/\{([HGA]\d+[A-Z]?)\}/);
  return m ? m[1] : null;
}

function extractProperName(expanded) {
  if (!expanded) return null;
  const m = expanded.match(/»([A-Za-z][A-Za-z0-9\-|]+@[A-Z1-9][a-z]{0,2}\.\d+\.\d+[-A-Za-z]*)/);
  return m ? m[1] : null;
}

function parseFile(filePath, books, isGreek) {
  const rows = [];
  const lines = readFileSync(filePath, 'utf8').split(/\r?\n/);
  for (const raw of lines) {
    const line = raw.trimEnd();
    if (!line || line.startsWith('#') || line.startsWith('=') || line.startsWith('\t')) continue;
    const cols = line.split('\t');
    const parsed = parseRef(cols[0]?.trim() || '');
    if (!parsed) continue;
    const book_name = books[parsed.book_abbr];
    if (!book_name) continue;

    const ref = `${parsed.book_abbr}.${parsed.chapter}.${parsed.verse}${parsed.altPart}` +
                `#${String(parsed.word_num).padStart(2, '0')}`;

    const row = {
      ref,
      book_abbr: parsed.book_abbr,
      book_name,
      chapter: parsed.chapter,
      verse: parsed.verse,
      word_num: parsed.word_num,
      text_type: parsed.text_type,
      transliteration: cols[2]?.trim() || null,
      translation: cols[3]?.trim() || null,
      d_strongs: cols[4]?.trim() || null,
      root_d_strong: extractRoot(cols[4]?.trim()),
      grammar: cols[5]?.trim() || null,
      expanded_strongs: cols[11]?.trim() || null,
      proper_name_id: extractProperName(cols[11]?.trim()),
    };
    if (isGreek) row.greek = cols[1]?.trim() || '';
    else row.hebrew = cols[1]?.trim() || '';

    rows.push(row);
  }
  return rows;
}

/** Page through every existing ref — PostgREST caps a response at 1000 rows. */
async function loadExistingRefs(table) {
  const refs = new Set();
  const PAGE = 1000;
  for (let from = 0; ; from += PAGE) {
    const { data, error } = await supabase
      .from(table)
      .select('ref')
      .range(from, from + PAGE - 1);
    if (error) throw new Error(`${table}: ${error.message}`);
    if (!data?.length) break;
    data.forEach(r => refs.add(r.ref));
    if (data.length < PAGE) break;
    if (from % 50000 === 0) {
      process.stdout.write(`\r    read ${refs.size.toLocaleString()} existing refs …`);
    }
  }
  process.stdout.write(`\r    ${refs.size.toLocaleString()} existing refs loaded.           \n`);
  return refs;
}

async function insertMissing(table, rows) {
  const BATCH = 300;
  let ok = 0;
  for (let i = 0; i < rows.length; i += BATCH) {
    const chunk = rows.slice(i, i + BATCH);
    const { error } = await supabase.from(table).insert(chunk);
    if (error) console.error(`\n    [${table}] batch at ${i}: ${error.message}`);
    else ok += chunk.length;
    if (i % 3000 === 0) {
      process.stdout.write(`\r    inserted ${ok.toLocaleString()} / ${rows.length.toLocaleString()} …`);
    }
  }
  process.stdout.write(`\r    inserted ${ok.toLocaleString()} / ${rows.length.toLocaleString()}.          \n`);
  return ok;
}

async function backfill(label, table, dir, prefix, books, isGreek) {
  console.log(`\n── ${label} ──`);
  const files = readdirSync(dir).filter(f => f.startsWith(prefix) && f.endsWith('.txt')).sort();

  console.log('  Loading existing refs from database …');
  const existing = await loadExistingRefs(table);

  let parsed = 0;
  const missing = [];
  for (const f of files) {
    const rows = parseFile(join(dir, f), books, isGreek);
    parsed += rows.length;
    for (const r of rows) if (!existing.has(r.ref)) missing.push(r);
  }

  console.log(`  Source rows parsed : ${parsed.toLocaleString()}`);
  console.log(`  Already present    : ${(parsed - missing.length).toLocaleString()}`);
  console.log(`  MISSING            : ${missing.length.toLocaleString()}`);

  if (!missing.length) return 0;

  const byBook = missing.reduce((a, r) => { a[r.book_name] = (a[r.book_name] || 0) + 1; return a; }, {});
  console.log('  Missing by book:');
  Object.entries(byBook).sort((a, b) => b[1] - a[1]).slice(0, 12)
    .forEach(([b, n]) => console.log(`    ${b.padEnd(18)} ${n.toLocaleString()}`));

  if (DRY) {
    console.log('  --dry: nothing written.');
    return 0;
  }
  return insertMissing(table, missing);
}

console.log('\n╔═══════════════════════════════════════════╗');
console.log('║   ISA820 — Manuscript Backfill             ║');
console.log('╚═══════════════════════════════════════════╝');

const heb = await backfill('TAHOT (Hebrew OT)', 'tahot_words', HEBREW_DIR, 'TAHOT', HEB_BOOKS, false);
const grk = await backfill('TAGNT (Greek NT)', 'tagnt_words', GREEK_DIR, 'TAGNT', GRK_BOOKS, true);

console.log('\n' + '─'.repeat(47));
console.log('✅  Backfill complete.');
console.log(`    Hebrew word rows added : ${heb.toLocaleString()}`);
console.log(`    Greek word rows added  : ${grk.toLocaleString()}`);
console.log();
