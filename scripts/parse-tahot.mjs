/**
 * ISA820 — TAHOT Parser (Hebrew OT → tahot_words + verses)
 * Run: node scripts/parse-tahot.mjs
 *
 * Reads all 4 TAHOT files from:
 *   SA_MASTER_VAULT/01_Bible_Raw/Hebrew/
 *
 * TAHOT data line format (tab-separated):
 *   [0]  Ref+Type     e.g. "Gen.1.1#01=L"
 *   [1]  Hebrew       full pointing + cantillation
 *   [2]  Transliteration
 *   [3]  Translation  English gloss (/ separates prefix/root/suffix)
 *   [4]  dStrongs     e.g. H9003/{H7225G}
 *   [5]  Grammar      ETCBC morphology
 *   [6]  Meaning Variant
 *   [7]  Spelling Variant
 *   [8]  Root dStrong+Instance  e.g. H7225G
 *   [9]  Alt Strongs
 *   [10] Conjoin word
 *   [11] Expanded Strong tags  (contains »Person@ref for TIPNR links)
 *
 * Produces:
 *   - tahot_words rows (one per Hebrew word)
 *   - verses rows (one per verse, aggregated from words)
 *   - Updates strongs_lexicon usage_count
 */

import { createClient } from '@supabase/supabase-js';
import { readFileSync, existsSync, readdirSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __dir = dirname(fileURLToPath(import.meta.url));
const ROOT  = join(__dir, '..');
const HEBREW_DIR = join(ROOT, 'ISA_MASTER_VAULT', '01_Bible_Raw', 'Hebrew');

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

// ── BOOK ABBREVIATION MAP ─────────────────────────────────────────────────────
const BOOK_ABBR_TO_NAME = {
  Gen:'Genesis',      Exo:'Exodus',       Lev:'Leviticus',    Num:'Numbers',
  Deu:'Deuteronomy',  Jos:'Joshua',       Jdg:'Judges',       Rut:'Ruth',
  '1Sa':'1 Samuel',   '2Sa':'2 Samuel',   '1Ki':'1 Kings',    '2Ki':'2 Kings',
  '1Ch':'1 Chronicles','2Ch':'2 Chronicles',Ezr:'Ezra',       Neh:'Nehemiah',
  Est:'Esther',       Job:'Job',          Psa:'Psalms',       Pro:'Proverbs',
  Ecc:'Ecclesiastes', Sng:'Song of Songs',Isa:'Isaiah',       Jer:'Jeremiah',
  Lam:'Lamentations', Ezk:'Ezekiel',      Dan:'Daniel',       Hos:'Hosea',
  Joe:'Joel',         Amo:'Amos',         Oba:'Obadiah',      Jon:'Jonah',
  Mic:'Micah',        Nah:'Nahum',        Hab:'Habakkuk',     Zep:'Zephaniah',
  Hag:'Haggai',       Zec:'Zechariah',    Mal:'Malachi',
};

// ── HELPERS ──────────────────────────────────────────────────────────────────
const BATCH = 300;

const CONFLICT_COLS = {
  verses:      'book,chapter,verse,translation',
  tahot_words: 'ref',
};

async function batchInsert(table, rows) {
  const onConflict = CONFLICT_COLS[table] || 'id';
  for (let i = 0; i < rows.length; i += BATCH) {
    const chunk = rows.slice(i, i + BATCH);
    const { error } = await supabase
      .from(table)
      .upsert(chunk, { onConflict, ignoreDuplicates: true });
    if (error) console.error(`  [${table}] batch error at ${i}:`, error.message);
  }
}

/**
 * Parse ref string "Gen.1.1#01=L" into components.
 * Returns null if not a valid data line ref.
 */
function parseRef(refRaw) {
  // Format: Book.Chapter.Verse#WordNum=TextType
  // e.g. Gen.1.1#01=L  or  1Sa.1.1#01=L
  const m = refRaw.match(/^([^.]+)\.(\d+)\.(\d+)#(\d+)=([A-Z])$/);
  if (!m) return null;
  return {
    book_abbr:  m[1],
    chapter:    parseInt(m[2], 10),
    verse:      parseInt(m[3], 10),
    word_num:   parseInt(m[4], 10),
    text_type:  m[5],
  };
}

/**
 * Extract root dStrong from dStrongs field.
 * e.g. "H9003/{H7225G}" → "H7225G"
 *      "{H1254A}"        → "H1254A"
 */
function extractRoot(dStrongs) {
  if (!dStrongs) return null;
  const m = dStrongs.match(/\{([HGA]\d+[A-Z]?)\}/);
  return m ? m[1] : null;
}

/**
 * Extract proper name ID from expanded Strong tags.
 * Looks for patterns like:
 *   »Abraham@Gen.11.26-1Pe
 *   »Yahweh@Exo.3.14-Rev
 * Returns the ID string or null.
 */
function extractProperName(expanded) {
  if (!expanded) return null;
  const m = expanded.match(/»([A-Za-z][A-Za-z0-9\-|]+@[A-Z1-9][a-z]{0,2}\.\d+\.\d+[-A-Za-z]*)/);
  return m ? m[1] : null;
}

/**
 * Build a clean English translation from the gloss field.
 * Forward slash separates prefix/root/suffix translations.
 * Angle brackets <word> = best omitted; square brackets [word] = implied.
 * Returns a cleaned single word/phrase.
 */
function cleanGloss(gloss) {
  if (!gloss) return '';
  // Take last segment after "/" (root translation, not prefix)
  const parts = gloss.split('/');
  let word = parts[parts.length - 1].trim();
  // Remove < > markers (words to omit)
  word = word.replace(/<[^>]+>/g, '').trim();
  // Keep [ ] words (implied — just remove brackets)
  word = word.replace(/\[([^\]]+)\]/g, '$1');
  return word.trim();
}

/**
 * Aggregate words into a verse English translation string.
 * This is a gloss-level reconstruction, not a polished translation.
 */
function buildVerseText(words) {
  return words
    .filter(w => w.text_type === 'L' || w.text_type === 'Q')   // base text only
    .map(w => cleanGloss(w.translation))
    .filter(Boolean)
    .join(' ')
    .replace(/\s+/g, ' ')
    .trim();
}

// ── PARSE ONE FILE ────────────────────────────────────────────────────────────
function parseTAHOTFile(filePath) {
  const wordRows = [];
  // verseMap: "Gen.1.1" → { words: [] }
  const verseMap = new Map();

  const lines = readFileSync(filePath, 'utf8').split(/\r?\n/);

  for (const raw of lines) {
    const line = raw.trimEnd();
    if (!line) continue;

    // Skip all header, comment, and summary lines
    if (line.startsWith('#')) continue;
    if (line.startsWith('=')) continue;
    if (line.startsWith('Eng ')) continue;   // column header repeat
    if (line.startsWith('\t')) continue;     // indented header text

    const cols = line.split('\t');
    const refRaw = cols[0]?.trim();
    if (!refRaw) continue;

    const parsed = parseRef(refRaw);
    if (!parsed) continue;   // not a data line

    const { book_abbr, chapter, verse, word_num, text_type } = parsed;
    const book_name = BOOK_ABBR_TO_NAME[book_abbr];
    if (!book_name) continue;   // unknown book abbr

    const ref = `${book_abbr}.${chapter}.${verse}#${String(word_num).padStart(2, '0')}`;

    const wordRow = {
      ref,
      book_abbr,
      book_name,
      chapter,
      verse,
      word_num,
      text_type,
      hebrew:          cols[1]?.trim() || '',
      transliteration: cols[2]?.trim() || null,
      translation:     cols[3]?.trim() || null,
      d_strongs:       cols[4]?.trim() || null,
      root_d_strong:   extractRoot(cols[4]?.trim()),
      grammar:         cols[5]?.trim() || null,
      meaning_variant: cols[6]?.trim() || null,
      spelling_variant:cols[7]?.trim() || null,
      root_instance:   cols[8]?.trim() || null,
      alt_strongs:     cols[9]?.trim() || null,
      expanded_strongs:cols[11]?.trim() || null,
      proper_name_id:  extractProperName(cols[11]?.trim()),
    };

    wordRows.push(wordRow);

    // Group into verse buckets for verse text assembly
    const verseKey = `${book_abbr}.${chapter}.${verse}`;
    if (!verseMap.has(verseKey)) {
      verseMap.set(verseKey, { book_abbr, book_name, chapter, verse, words: [] });
    }
    verseMap.get(verseKey).words.push(wordRow);
  }

  // Build verse rows
  const verseRows = [];
  for (const [, v] of verseMap) {
    const text = buildVerseText(v.words);
    if (!text) continue;

    // Collect all Strong's numbers used in this verse
    const strongs_numbers = [...new Set(
      v.words
        .map(w => w.root_d_strong)
        .filter(Boolean)
    )];

    verseRows.push({
      book:            v.book_name,
      chapter:         v.chapter,
      verse:           v.verse,
      text,
      translation:     'TAHOT',
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
console.log('║   ISA820 — TAHOT Parser (Hebrew OT)        ║');
console.log('╚═══════════════════════════════════════════╝\n');

const tahot_files = readdirSync(HEBREW_DIR)
  .filter(f => f.startsWith('TAHOT') && f.endsWith('.txt'))
  .sort();

if (tahot_files.length === 0) {
  console.error('ERROR: No TAHOT files found in', HEBREW_DIR);
  process.exit(1);
}

console.log(`Found ${tahot_files.length} TAHOT files:\n`);
tahot_files.forEach(f => console.log(`  - ${f}`));
console.log();

let totalWords  = 0;
let totalVerses = 0;

for (const filename of tahot_files) {
  const filePath = join(HEBREW_DIR, filename);
  console.log(`Parsing: ${filename}`);

  const { wordRows, verseRows } = parseTAHOTFile(filePath);
  console.log(`  Words: ${wordRows.length} | Verses: ${verseRows.length}`);

  // Insert tahot_words
  process.stdout.write('  Inserting tahot_words ...');
  await batchInsert('tahot_words', wordRows);
  console.log(' done.');

  // Insert verses
  process.stdout.write('  Inserting verses ...');
  await batchInsert('verses', verseRows);
  console.log(' done.');

  totalWords  += wordRows.length;
  totalVerses += verseRows.length;
}

console.log('\n' + '─'.repeat(47));
console.log(`✅  Done.`);
console.log(`    Total Hebrew words loaded : ${totalWords.toLocaleString()}`);
console.log(`    Total OT verses loaded    : ${totalVerses.toLocaleString()}`);
console.log('\nNext: node scripts/parse-tagnt.mjs\n');
