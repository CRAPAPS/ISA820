/**
 * ISA820 — Lexicon Parser (TBESH + TBESG → strongs_lexicon)
 * Run: node scripts/parse-lexicons.mjs
 *
 * Reads:
 *   SA_MASTER_VAULT/02_Lexicons_and_Maps/TBESH ...txt  (Hebrew)
 *   SA_MASTER_VAULT/02_Lexicons_and_Maps/TBESG ...txt  (Greek)
 *
 * TBESH line format (tab-separated):
 *   [0] base_strong  e.g. H0001
 *   [1] disambig     e.g. H0001G =
 *   [2] d_strong_id  e.g. H0001G
 *   [3] hebrew_form  e.g. אָב
 *   [4] translit     e.g. av
 *   [5] lang_pos     e.g. H:N-M  (H=Hebrew, N=Noun, M=Masc)
 *   [6] short_gloss  e.g. father
 *   [7] full_def     HTML string
 *
 * Writes rows to: strongs_lexicon
 */

import { createClient } from '@supabase/supabase-js';
import { readFileSync, existsSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __dir = dirname(fileURLToPath(import.meta.url));
const ROOT  = join(__dir, '..');
const VAULT = join(ROOT, 'SA_MASTER_VAULT', '02_Lexicons_and_Maps');

// ── ENV ──────────────────────────────────────────────────────────────────────
const env = {};
try {
  readFileSync(join(ROOT, '.env.local'), 'utf8').split('\n').forEach(line => {
    const [k, ...v] = line.split('=');
    if (k && !k.startsWith('#')) env[k.trim()] = v.join('=').trim();
  });
} catch { /* ok */ }

const SUPABASE_URL       = env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_ANON_KEY  = env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const SERVICE_ROLE_KEY   = env.SUPABASE_SERVICE_ROLE_KEY;

// Use service role for writes so RLS doesn't block unauthenticated inserts
const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY || SUPABASE_ANON_KEY, {
  auth: { persistSession: false },
});

// ── HELPERS ──────────────────────────────────────────────────────────────────
const BATCH_SIZE = 500;

async function batchUpsert(rows) {
  for (let i = 0; i < rows.length; i += BATCH_SIZE) {
    const chunk = rows.slice(i, i + BATCH_SIZE);
    // Deduplicate within batch (compound IDs can collapse to same base)
    const seen = new Set();
    const deduped = chunk.filter(r => {
      if (seen.has(r.strongs_id)) return false;
      seen.add(r.strongs_id);
      return true;
    });
    const { error } = await supabase
      .from('strongs_lexicon')
      .upsert(deduped, { onConflict: 'strongs_id', ignoreDuplicates: true });
    if (error) console.error(`  Batch upsert error at row ${i}:`, error.message);
    else process.stdout.write(`\r  Inserted ${Math.min(i + BATCH_SIZE, rows.length)} / ${rows.length} ...`);
  }
  process.stdout.write('\n');
}

/**
 * Parse language:part_of_speech string like "H:N-M" or "G:V"
 * Also handles non-standard codes: N (Name), Prefix, Suffix, Punct., Ps1c...
 * In those cases, infer language from the Strong's ID prefix (H/G/A).
 */
function parsePOS(langPos, idRaw) {
  const [lang, pos] = (langPos || '').split(':');
  const langMap = { H: 'hebrew', G: 'greek', A: 'aramaic' };
  if (langMap[lang]) {
    return { origin_language: langMap[lang], part_of_speech: pos || null };
  }
  // Non-standard lang code — infer from Strong's ID prefix
  const prefix = (idRaw || '')[0];
  return {
    origin_language: langMap[prefix] || 'hebrew',
    part_of_speech: lang || null,
  };
}

/**
 * Strip HTML tags from full definition
 */
function stripHtml(s) {
  return (s || '').replace(/<[^>]+>/g, '').replace(/&lt;/g,'<').replace(/&gt;/g,'>').trim();
}

// ── PARSE TBESH / TBESG ──────────────────────────────────────────────────────
function parseLexiconFile(filePath, expectedLang) {
  const rows = [];
  const lines = readFileSync(filePath, 'utf8').split(/\r?\n/);

  for (const raw of lines) {
    const line = raw.trimEnd();
    if (!line) continue;

    const cols = line.split('\t');
    if (cols.length < 6) continue;

    // Data lines start with the language prefix H/G/A followed by 4 digits
    const idRaw = (cols[2] || '').trim();
    if (!/^[HGA]\d{4}/.test(idRaw)) continue;

    // Compound IDs like "H0022G (H0001I+H1391)" — keep only the base ID before the space
    const strongs_id = idRaw.replace(/\s.*$/, '').replace(/,\s*$/, '').trim();
    if (strongs_id.length > 20) continue; // safety guard

    const shortGloss = (cols[6] || '').trim();
    const fullDef    = stripHtml(cols[7] || '');
    const { origin_language, part_of_speech } = parsePOS(cols[5], strongs_id);

    rows.push({
      strongs_id,
      word:               (cols[3] || '').trim().substring(0, 100),
      transliteration:    (cols[4] || '').trim().substring(0, 100),
      definition:         (shortGloss || fullDef.substring(0, 200)) || 'N/A',
      part_of_speech:     part_of_speech ? part_of_speech.substring(0, 30) : null,
      origin_language,
      pronunciation_guide: null,
      usage_count:        0,          // will be updated by TAHOT parser
    });
  }

  return rows;
}

// ── MAIN ─────────────────────────────────────────────────────────────────────
const TBESH_FILE = join(VAULT, 'TBESH - Translators Brief lexicon of Extended Strongs for Hebrew - STEPBible.org CC BY.txt');
const TBESG_FILE = join(VAULT, 'TBESG - Translators Brief lexicon of Extended Strongs for Greek - STEPBible.org CC BY.txt');

console.log('\n╔═══════════════════════════════════════════╗');
console.log('║   ISA820 — Lexicon Parser (TBESH + TBESG)  ║');
console.log('╚═══════════════════════════════════════════╝\n');

let total = 0;

if (existsSync(TBESH_FILE)) {
  console.log('Parsing TBESH (Hebrew)...');
  const hebrewRows = parseLexiconFile(TBESH_FILE, 'hebrew');
  console.log(`  Found ${hebrewRows.length} Hebrew entries.`);
  await batchUpsert(hebrewRows);
  total += hebrewRows.length;
} else {
  console.warn('  TBESH file not found:', TBESH_FILE);
}

if (existsSync(TBESG_FILE)) {
  console.log('Parsing TBESG (Greek)...');
  const greekRows = parseLexiconFile(TBESG_FILE, 'greek');
  console.log(`  Found ${greekRows.length} Greek entries.`);
  await batchUpsert(greekRows);
  total += greekRows.length;
} else {
  console.warn('  TBESG file not found:', TBESG_FILE);
}

console.log(`\n✅  Done. Total lexicon entries loaded: ${total}\n`);
