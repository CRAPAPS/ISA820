/**
 * Fill NT verses from TAGNT files into the verses table.
 * Only inserts verses (skips tagnt_words).
 * Run: node scripts/fill-missing-nt-verses.mjs
 */
import { createClient } from '@supabase/supabase-js';
import { readFileSync, readdirSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __dir = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dir, '..');
const GREEK_DIR = join(ROOT, 'ISA_MASTER_VAULT', '01_Bible_Raw', 'Greek', 'Source_Text');

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
  Mat:'Matthew',     Mar:'Mark',           Luk:'Luke',        Jhn:'John',
  Act:'Acts',        Rom:'Romans',         '1Co':'1 Corinthians','2Co':'2 Corinthians',
  Gal:'Galatians',   Eph:'Ephesians',      Php:'Philippians', Col:'Colossians',
  '1Th':'1 Thessalonians','2Th':'2 Thessalonians',
  '1Ti':'1 Timothy', '2Ti':'2 Timothy',    Tit:'Titus',       Phm:'Philemon',
  Heb:'Hebrews',     Jas:'James',          '1Pe':'1 Peter',   '2Pe':'2 Peter',
  '1Jn':'1 John',    '2Jn':'2 John',       '3Jn':'3 John',    Jud:'Jude',
  Rev:'Revelation',
};

function parseRef(refRaw) {
  const m = refRaw.match(/^([^.]+)\.(\d+)\.(\d+)#(\d+)=([A-Z0-9]+)$/);
  if (!m) return null;
  return {
    book_abbr: m[1],
    chapter:   parseInt(m[2], 10),
    verse:     parseInt(m[3], 10),
    text_type: m[5],
  };
}

// TAGNT column layout:
//   [0] Ref+TextType  e.g. "Jhn.3.16#01=NKO"
//   [1] Greek word    e.g. "οὕτως (houtōs)"
//   [2] Translation   e.g. "Thus"
//   [3] dStrongs      e.g. "G3779=ADV"
//   [4] Expanded      e.g. "οὕτω, οὕτως=thus(-ly)"

function extractRoot(dStrongs) {
  if (!dStrongs) return null;
  // TAGNT format: "G3779=ADV" or "G2316=N-NSM-T"
  const m = dStrongs.match(/^([HGA]\d+[A-Z]?)=/);
  if (m) return m[1];
  // TAHOT-style curly braces fallback
  const m2 = dStrongs.match(/\{([HGA]\d+[A-Z]?)\}/);
  return m2 ? m2[1] : null;
}

function cleanGloss(gloss) {
  if (!gloss) return '';
  const parts = gloss.split('/');
  let word = parts[parts.length - 1].trim();
  word = word.replace(/<[^>]+>/g, '').replace(/\[([^\]]+)\]/g, '$1');
  // Remove trailing punctuation from gloss (comma, period, etc.)
  word = word.replace(/[,;.!?]+$/, '').trim();
  return word;
}

function parseTAGNTFile(filePath) {
  const verseMap = new Map();
  const lines = readFileSync(filePath, 'utf8').split(/\r?\n/);

  for (const raw of lines) {
    const line = raw.trimEnd();
    if (!line || line.startsWith('#') || line.startsWith('=') ||
        line.startsWith('Ref') || line.startsWith('TAGNT') || line.startsWith('\t')) continue;

    const cols = line.split('\t');
    const refRaw = cols[0]?.trim();
    if (!refRaw) continue;

    const parsed = parseRef(refRaw);
    if (!parsed) continue;

    const { book_abbr, chapter, verse } = parsed;
    const book_name = BOOK_ABBR_TO_NAME[book_abbr];
    if (!book_name) continue;

    const verseKey = `${book_abbr}.${chapter}.${verse}`;
    if (!verseMap.has(verseKey)) {
      verseMap.set(verseKey, { book_name, chapter, verse, words: [] });
    }
    verseMap.get(verseKey).words.push({
      translation:   cols[2]?.trim() || null,   // English gloss is col 2 in TAGNT
      root_d_strong: extractRoot(cols[3]?.trim()),  // dStrongs is col 3
    });
  }

  const verseRows = [];
  for (const [, v] of verseMap) {
    const text = v.words
      .map(w => cleanGloss(w.translation))
      .filter(Boolean)
      .join(' ')
      .replace(/\s+/g, ' ')
      .trim();
    if (!text) continue;

    const strongs_numbers = [...new Set(v.words.map(w => w.root_d_strong).filter(Boolean))];
    verseRows.push({
      book: v.book_name,
      chapter: v.chapter,
      verse: v.verse,
      text,
      translation: 'TBESG',
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
  for (let i = 0; i < rows.length; i += BATCH) {
    const chunk = rows.slice(i, i + BATCH);
    // ignoreDuplicates: false → UPDATE existing rows (fixes any wrong text from prior run)
    const { error } = await supabase
      .from('verses')
      .upsert(chunk, { onConflict: 'book,chapter,verse,translation', ignoreDuplicates: false });
    if (error) console.error(`  Batch error at ${i}:`, error.message);
  }
}

console.log('\n╔═══════════════════════════════════════════╗');
console.log('║   ISA820 — Fill NT Verses (TAGNT)          ║');
console.log('╚═══════════════════════════════════════════╝\n');

const files = readdirSync(GREEK_DIR)
  .filter(f => f.startsWith('TAGNT') && f.endsWith('.txt'))
  .sort();

console.log(`Found ${files.length} TAGNT files\n`);

let totalVerses = 0;
for (const filename of files) {
  process.stdout.write(`Parsing ${filename} ... `);
  const verseRows = parseTAGNTFile(join(GREEK_DIR, filename));
  console.log(`${verseRows.length} verses`);

  process.stdout.write('  Upserting verses ... ');
  await insertVerses(verseRows);
  console.log('done');
  totalVerses += verseRows.length;
}

console.log('\n─────────────────────────────────────────────');
console.log(`✅  Done. Processed ${totalVerses.toLocaleString()} NT verse rows.\n`);

const { count: tahot } = await supabase.from('verses').select('*',{count:'exact',head:true}).eq('translation','TAHOT');
const { count: tbesg } = await supabase.from('verses').select('*',{count:'exact',head:true}).eq('translation','TBESG');
console.log(`TAHOT (OT) in DB: ${tahot}`);
console.log(`TBESG (NT) in DB: ${tbesg}`);
console.log(`Total: ${(tahot||0) + (tbesg||0)}\n`);
