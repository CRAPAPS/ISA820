/**
 * ISA820 — TAGNT Parser (Greek NT → tagnt_words + verses)
 * Run: node scripts/parse-tagnt.mjs
 *
 * Reads both TAGNT files from:
 *   SA_MASTER_VAULT/01_Bible_Raw/Greek/Source_Text/
 *
 * TAGNT line format is structurally similar to TAHOT but for Greek.
 * Data line example:
 *   Mat.1.1#01=N  Βίβλος  Bi.blos  book  {G0976}  N-NFS  ...  {G0976=Βίβλος=book}
 *
 * Produces:
 *   - tagnt_words rows (one per Greek word)
 *   - verses rows (one per verse, translation='TBESG' for NT)
 */

import { createClient } from '@supabase/supabase-js';
import { readFileSync, existsSync, readdirSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __dir = dirname(fileURLToPath(import.meta.url));
const ROOT  = join(__dir, '..');
const GREEK_DIR = join(ROOT, 'SA_MASTER_VAULT', '01_Bible_Raw', 'Greek', 'Source_Text');

// ── ENV ──────────────────────────────────────────────────────────────────────
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
  { auth: { persistSession: false } }
);

// ── BOOK MAP ─────────────────────────────────────────────────────────────────
const BOOK_ABBR_TO_NAME = {
  Mat:'Matthew',     Mar:'Mark',           Luk:'Luke',        Jhn:'John',
  Act:'Acts',        Rom:'Romans',         '1Co':'1 Corinthians','2Co':'2 Corinthians',
  Gal:'Galatians',   Eph:'Ephesians',      Php:'Philippians', Col:'Colossians',
  '1Th':'1 Thessalonians','2Th':'2 Thessalonians',
  '1Ti':'1 Timothy', '2Ti':'2 Timothy',    Tit:'Titus',       Phm:'Philemon',
  Heb:'Hebrews',     Jas:'James',          '1Pe':'1 Peter',   '2Pe':'2 Peter',
  '1Jn':'1 John',    '2Jn':'2 John',       '3Jn':'3 John',    Jud:'Jude',
  Rev:'Revelation',
};

// ── HELPERS ──────────────────────────────────────────────────────────────────
const BATCH = 300;

async function batchInsert(table, rows) {
  for (let i = 0; i < rows.length; i += BATCH) {
    const chunk = rows.slice(i, i + BATCH);
    const { error } = await supabase.from(table).upsert(chunk, { ignoreDuplicates: true });
    if (error) console.error(`  [${table}] batch error at ${i}:`, error.message);
  }
}

function parseRef(refRaw) {
  const m = refRaw.match(/^([^.]+)\.(\d+)\.(\d+)#(\d+)=([A-Z0-9]+)$/);
  if (!m) return null;
  return {
    book_abbr: m[1],
    chapter:   parseInt(m[2], 10),
    verse:     parseInt(m[3], 10),
    word_num:  parseInt(m[4], 10),
    text_type: m[5],
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

function cleanGloss(gloss) {
  if (!gloss) return '';
  const parts = gloss.split('/');
  let word = parts[parts.length - 1].trim();
  word = word.replace(/<[^>]+>/g, '').replace(/\[([^\]]+)\]/g, '$1');
  return word.trim();
}

function buildVerseText(words) {
  return words
    .map(w => cleanGloss(w.translation))
    .filter(Boolean)
    .join(' ')
    .replace(/\s+/g, ' ')
    .trim();
}

// ── PARSE ONE TAGNT FILE ──────────────────────────────────────────────────────
function parseTAGNTFile(filePath) {
  const wordRows = [];
  const verseMap = new Map();

  const lines = readFileSync(filePath, 'utf8').split(/\r?\n/);

  for (const raw of lines) {
    const line = raw.trimEnd();
    if (!line) continue;
    if (line.startsWith('#')) continue;
    if (line.startsWith('=')) continue;
    if (line.startsWith('Ref')) continue;   // column header
    if (line.startsWith('TAGNT')) continue;
    if (line.startsWith('\t')) continue;

    const cols = line.split('\t');
    const refRaw = cols[0]?.trim();
    if (!refRaw) continue;

    const parsed = parseRef(refRaw);
    if (!parsed) continue;

    const { book_abbr, chapter, verse, word_num, text_type } = parsed;
    const book_name = BOOK_ABBR_TO_NAME[book_abbr];
    if (!book_name) continue;

    const ref = `${book_abbr}.${chapter}.${verse}#${String(word_num).padStart(2, '0')}`;

    const wordRow = {
      ref,
      book_abbr,
      book_name,
      chapter,
      verse,
      word_num,
      text_type,
      greek:           cols[1]?.trim() || '',
      transliteration: cols[2]?.trim() || null,
      translation:     cols[3]?.trim() || null,
      d_strongs:       cols[4]?.trim() || null,
      root_d_strong:   extractRoot(cols[4]?.trim()),
      grammar:         cols[5]?.trim() || null,
      meaning_variant: cols[6]?.trim() || null,
      expanded_strongs:cols[11]?.trim() || null,
      proper_name_id:  extractProperName(cols[11]?.trim()),
    };

    wordRows.push(wordRow);

    const verseKey = `${book_abbr}.${chapter}.${verse}`;
    if (!verseMap.has(verseKey)) {
      verseMap.set(verseKey, { book_abbr, book_name, chapter, verse, words: [] });
    }
    verseMap.get(verseKey).words.push(wordRow);
  }

  const verseRows = [];
  for (const [, v] of verseMap) {
    const text = buildVerseText(v.words);
    if (!text) continue;

    const strongs_numbers = [...new Set(
      v.words.map(w => w.root_d_strong).filter(Boolean)
    )];

    verseRows.push({
      book:            v.book_name,
      chapter:         v.chapter,
      verse:           v.verse,
      text,
      translation:     'TBESG',
      speaker:         null,
      strongs_numbers,
      pillar_tags:     [],
      translations_jsonb: null,
    });
  }

  return { wordRows, verseRows };
}

// ── MAIN ─────────────────────────────────────────────────────────────────────
console.log('\n╔═══════════════════════════════════════════╗');
console.log('║   ISA820 — TAGNT Parser (Greek NT)         ║');
console.log('╚═══════════════════════════════════════════╝\n');

if (!existsSync(GREEK_DIR)) {
  console.error('ERROR: Greek Source_Text directory not found:', GREEK_DIR);
  process.exit(1);
}

const tagnt_files = readdirSync(GREEK_DIR)
  .filter(f => f.startsWith('TAGNT') && f.endsWith('.txt'))
  .sort();

if (tagnt_files.length === 0) {
  console.error('ERROR: No TAGNT .txt files found in', GREEK_DIR);
  process.exit(1);
}

console.log(`Found ${tagnt_files.length} TAGNT files:\n`);
tagnt_files.forEach(f => console.log(`  - ${f}`));
console.log();

let totalWords  = 0;
let totalVerses = 0;

for (const filename of tagnt_files) {
  const filePath = join(GREEK_DIR, filename);
  console.log(`Parsing: ${filename}`);

  const { wordRows, verseRows } = parseTAGNTFile(filePath);
  console.log(`  Words: ${wordRows.length} | Verses: ${verseRows.length}`);

  process.stdout.write('  Inserting tagnt_words ...');
  await batchInsert('tagnt_words', wordRows);
  console.log(' done.');

  process.stdout.write('  Inserting verses ...');
  await batchInsert('verses', verseRows);
  console.log(' done.');

  totalWords  += wordRows.length;
  totalVerses += verseRows.length;
}

console.log('\n' + '─'.repeat(47));
console.log(`✅  Done.`);
console.log(`    Total Greek words loaded  : ${totalWords.toLocaleString()}`);
console.log(`    Total NT verses loaded    : ${totalVerses.toLocaleString()}`);
console.log('\nNext: node scripts/parse-tipnr.mjs\n');
