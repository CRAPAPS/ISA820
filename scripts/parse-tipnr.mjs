/**
 * ISA820 — TIPNR Parser (Proper Names → proper_names)
 * Run: node scripts/parse-tipnr.mjs
 *
 * TIPNR actual line format (discovered from file):
 *   Main record  : "Aaron@Exo.4.14-Heb=H0175 [tab] Description [tab] ..."
 *   Sub-records  : lines starting with "– " or "@"
 *   Separator    : "$========== PERSON(s)" / PLACE(s) / OTHER between each record
 *   Data starts  : line 148 (after long header block)
 *
 * Strategy:
 *   - Parse proper_names from main data lines only
 *   - Skip occurrence parsing (those come from tahot_words.proper_name_id instead)
 *   - Determine category from the most recent $========== line seen
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

const supabase = createClient(
  env.NEXT_PUBLIC_SUPABASE_URL,
  env.SUPABASE_SERVICE_ROLE_KEY || env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  { auth: { persistSession: false } }
);

// ── HELPERS ──────────────────────────────────────────────────────────────────
const BATCH = 200;

async function batchUpsert(rows) {
  // Deduplicate by tipnr_id within each batch
  for (let i = 0; i < rows.length; i += BATCH) {
    const seen = new Set();
    const chunk = rows.slice(i, i + BATCH).filter(r => {
      if (seen.has(r.tipnr_id)) return false;
      seen.add(r.tipnr_id);
      return true;
    });
    const { error } = await supabase
      .from('proper_names')
      .upsert(chunk, { onConflict: 'tipnr_id', ignoreDuplicates: true });
    if (error) console.error(`  Batch error at ${i}:`, error.message);
    else process.stdout.write(`\r  Inserted ${Math.min(i + BATCH, rows.length)} / ${rows.length} ...`);
  }
  process.stdout.write('\n');
}

/**
 * Parse the main record line: "Aaron@Exo.4.14-Heb=H0175 [tab] Description..."
 * Returns { tipnr_id, unified_name, u_strong, first_ref } or null.
 */
function parseMainLine(col0) {
  // Normalize: replace unicode equals sign (═ U+2550) with =
  const s = col0.replace(/═/g, '=').trim();

  // Must contain @ and = to be a data line
  if (!s.includes('@') || !s.includes('=')) return null;

  // Extract u_strong: last =H/G/Axxx at end
  const strongMatch = s.match(/=([HGA]\d{4}[A-Z0-9]*)[\s(]*$/);
  const u_strong = strongMatch ? strongMatch[1] : null;

  // Extract tipnr_id: everything before the = strongs part
  const nameAndRef = u_strong
    ? s.slice(0, s.lastIndexOf('=' + (strongMatch[0].slice(1)))).trim()
    : s;

  // Must start with a capital letter (not a comment line)
  if (!/^[A-Z]/.test(nameAndRef)) return null;

  const atIdx = nameAndRef.indexOf('@');
  if (atIdx < 0) return null;

  const unified_name = nameAndRef.slice(0, atIdx).trim();
  const refPart      = nameAndRef.slice(atIdx + 1).trim();

  // first_ref = the first reference before any dash-book suffix
  // e.g. "Exo.4.14-Heb" → "Exo.4.14"
  //      "Gen.11.26"     → "Gen.11.26"
  const firstRefMatch = refPart.match(/^([A-Z1-9][a-z]{0,2}\.\d+\.\d+)/);
  const first_ref = firstRefMatch ? firstRefMatch[1] : refPart.slice(0, 20);

  // tipnr_id = full name@ref string (without the strongs part)
  const tipnr_id = nameAndRef.trim();

  // Sanity checks
  if (!unified_name || unified_name.length < 1 || unified_name.length > 100) return null;
  if (tipnr_id.length > 290) return null;
  if (first_ref.length > 25) return null;

  return { tipnr_id, unified_name, u_strong, first_ref };
}

// ── PARSE TIPNR FILE ──────────────────────────────────────────────────────────
function parseTIPNR(filePath) {
  const rows = [];
  const lines = readFileSync(filePath, 'utf8').split(/\r?\n/);

  let currentCategory = 'PERSON';

  for (let i = 0; i < lines.length; i++) {
    const raw = lines[i];
    const trimmed = raw.trim();

    // Category separator lines
    if (trimmed.startsWith('$')) {
      if (trimmed.includes('PERSON'))       currentCategory = 'PERSON';
      else if (trimmed.includes('PLACE'))   currentCategory = 'PLACE';
      else if (trimmed.includes('OTHER'))   currentCategory = 'OTHER';
      continue;
    }

    // Skip sub-record lines and meta lines
    if (trimmed.startsWith('–') || trimmed.startsWith('-') ||
        trimmed.startsWith('@') || trimmed.startsWith('*') ||
        trimmed.startsWith('(') || trimmed.startsWith('[') ||
        trimmed.startsWith('=') || !trimmed) continue;

    // Main data lines are tab-separated with 20+ cols and start with capital letter
    const cols = raw.split('\t');
    if (cols.length < 4) continue;

    const col0 = cols[0];
    if (!col0 || !/^[A-Z]/.test(col0.trim())) continue;

    const parsed = parseMainLine(col0);
    if (!parsed) continue;

    const description = (cols[1] || '').trim().slice(0, 500) || null;

    rows.push({
      tipnr_id:      parsed.tipnr_id,
      unified_name:  parsed.unified_name,
      u_strong:      parsed.u_strong,
      category:      currentCategory,
      description,
      first_ref:     parsed.first_ref,
      alt_names:     [],
      all_strongs:   parsed.u_strong ? [parsed.u_strong] : [],
      is_divine:     false,
      speaker_type:  null,
      speaker_notes: null,
    });
  }

  return rows;
}

// ── MAIN ─────────────────────────────────────────────────────────────────────
console.log('\n╔═══════════════════════════════════════════╗');
console.log('║   ISA820 — TIPNR Parser (Proper Names)     ║');
console.log('╚═══════════════════════════════════════════╝\n');

const TIPNR_FILE = join(VAULT, 'TIPNR - Translators Individualised Proper Names with all References - STEPBible.org CC BY.txt');

if (!existsSync(TIPNR_FILE)) {
  console.error('ERROR: TIPNR file not found:', TIPNR_FILE);
  process.exit(1);
}

console.log('Parsing TIPNR...');
const rows = parseTIPNR(TIPNR_FILE);

// Count by category
const cats = rows.reduce((a, r) => { a[r.category] = (a[r.category]||0)+1; return a; }, {});
console.log(`  PERSON : ${cats.PERSON || 0}`);
console.log(`  PLACE  : ${cats.PLACE  || 0}`);
console.log(`  OTHER  : ${cats.OTHER  || 0}`);
console.log(`  Total  : ${rows.length}`);

console.log('\nInserting proper_names (preserving 6 divine seeds)...');
await batchUpsert(rows);

// Verify divine seeds are still intact
const { data: divineCheck } = await supabase
  .from('proper_names')
  .select('unified_name, speaker_type')
  .eq('is_divine', true);
console.log('\nDivine names preserved:');
(divineCheck || []).forEach(d => console.log(`  ${d.unified_name} -> ${d.speaker_type}`));

console.log('\n' + '─'.repeat(47));
console.log(`✅  TIPNR import complete. ${rows.length} proper names loaded.`);
console.log('\nNext: node scripts/link-occurrences.mjs\n');
