/**
 * Fill missing TAHOT verses into the verses table.
 * Only inserts verses (skips tahot_words — already partially loaded).
 * Uses onConflict to safely skip existing rows without failing the whole batch.
 * Run: node scripts/fill-missing-verses.mjs
 */
import { createClient } from '@supabase/supabase-js';
import { readFileSync, readdirSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __dir = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dir, '..');
const HEBREW_DIR = join(ROOT, 'ISA_MASTER_VAULT', '01_Bible_Raw', 'Hebrew');

// Load env
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

function parseRef(refRaw) {
  const m = refRaw.match(/^([^.]+)\.(\d+)\.(\d+)#(\d+)=([A-Z])$/);
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

function cleanGloss(gloss) {
  if (!gloss) return '';
  const parts = gloss.split('/');
  let word = parts[parts.length - 1].trim();
  word = word.replace(/<[^>]+>/g, '').trim();
  word = word.replace(/\[([^\]]+)\]/g, '$1');
  return word.trim();
}

function buildVerseText(words) {
  return words
    .filter(w => w.text_type === 'L' || w.text_type === 'Q')
    .map(w => cleanGloss(w.translation))
    .filter(Boolean)
    .join(' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function parseTAHOTFile(filePath) {
  const verseMap = new Map();
  const lines = readFileSync(filePath, 'utf8').split(/\r?\n/);

  for (const raw of lines) {
    const line = raw.trimEnd();
    if (!line || line.startsWith('#') || line.startsWith('=') ||
        line.startsWith('Eng ') || line.startsWith('\t')) continue;

    const cols = line.split('\t');
    const refRaw = cols[0]?.trim();
    if (!refRaw) continue;

    const parsed = parseRef(refRaw);
    if (!parsed) continue;

    const { book_abbr, chapter, verse, word_num, text_type } = parsed;
    const book_name = BOOK_ABBR_TO_NAME[book_abbr];
    if (!book_name) continue;

    const verseKey = `${book_abbr}.${chapter}.${verse}`;
    if (!verseMap.has(verseKey)) {
      verseMap.set(verseKey, { book_name, chapter, verse, words: [] });
    }
    verseMap.get(verseKey).words.push({
      text_type,
      translation: cols[3]?.trim() || null,
      root_d_strong: extractRoot(cols[4]?.trim()),
    });
  }

  const verseRows = [];
  for (const [, v] of verseMap) {
    const text = buildVerseText(v.words);
    if (!text) continue;
    const strongs_numbers = [...new Set(v.words.map(w => w.root_d_strong).filter(Boolean))];
    verseRows.push({
      book: v.book_name,
      chapter: v.chapter,
      verse: v.verse,
      text,
      translation: 'TAHOT',
      speaker: null,
      strongs_numbers,
      pillar_tags: [],
      translations_jsonb: null,
    });
  }

  return verseRows;
}

const BATCH = 500;

async function insertVerses(rows) {
  let inserted = 0;
  for (let i = 0; i < rows.length; i += BATCH) {
    const chunk = rows.slice(i, i + BATCH);
    const { error } = await supabase
      .from('verses')
      .upsert(chunk, { onConflict: 'book,chapter,verse,translation', ignoreDuplicates: true });
    if (error) {
      console.error(`  Batch error at ${i}:`, error.message);
    } else {
      inserted += chunk.length;
    }
  }
  return inserted;
}

console.log('\n╔═══════════════════════════════════════════╗');
console.log('║   ISA820 — Fill Missing TAHOT Verses       ║');
console.log('╚═══════════════════════════════════════════╝\n');

const files = readdirSync(HEBREW_DIR)
  .filter(f => f.startsWith('TAHOT') && f.endsWith('.txt'))
  .sort();

console.log(`Found ${files.length} TAHOT files\n`);

let totalVerses = 0;

for (const filename of files) {
  const filePath = join(HEBREW_DIR, filename);
  process.stdout.write(`Parsing ${filename} ... `);
  const verseRows = parseTAHOTFile(filePath);
  console.log(`${verseRows.length} verses`);

  process.stdout.write('  Upserting verses ... ');
  const n = await insertVerses(verseRows);
  console.log(`done (attempted ${verseRows.length})`);
  totalVerses += verseRows.length;
}

console.log('\n─────────────────────────────────────────────');
console.log(`✅  Done. Processed ${totalVerses.toLocaleString()} total verse rows.`);
console.log('\nChecking DB...');

const { count } = await supabase
  .from('verses')
  .select('*', { count: 'exact', head: true })
  .eq('translation', 'TAHOT');
console.log(`TAHOT verses now in DB: ${count}\n`);
