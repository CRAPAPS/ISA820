/**
 * ISA820 — Supabase Connection Verifier
 * Run: node scripts/verify-connection.mjs
 *
 * Checks the live database and reports:
 *  - Which tables exist
 *  - Row counts for each table
 *  - Whether migrations need to be run
 */

import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __dir = dirname(fileURLToPath(import.meta.url));

// Load .env.local
const envPath = join(__dir, '..', '.env.local');
const env = {};
try {
  readFileSync(envPath, 'utf8').split('\n').forEach(line => {
    const [k, ...v] = line.split('=');
    if (k && !k.startsWith('#')) env[k.trim()] = v.join('=').trim();
  });
} catch { /* no .env.local */ }

const SUPABASE_URL      = env.NEXT_PUBLIC_SUPABASE_URL      || process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_ANON_KEY = env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  console.error('ERROR: Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

const EXPECTED_TABLES = [
  // Migration 001
  'verses',
  'strongs_lexicon',
  'strongs_usage',
  'knowledge_base',
  'media_assets',
  'topic_mappings',
  'standard_documents',
  // Migration 002
  'bible_books',
  'tahot_words',
  'tagnt_words',
  'proper_names',
  'proper_name_occurrences',
];

console.log('\n╔═══════════════════════════════════════════╗');
console.log('║   ISA820 — Supabase Connection Report      ║');
console.log('╚═══════════════════════════════════════════╝');
console.log(`\nProject: ${SUPABASE_URL}`);
console.log('─'.repeat(47));

let allGood = true;
const missing = [];

for (const table of EXPECTED_TABLES) {
  // Use a real GET request (not HEAD) to properly detect missing tables
  const { data, error } = await supabase
    .from(table)
    .select('id')
    .limit(1);

  if (error) {
    console.log(`  ✗  ${table.padEnd(30)} → ${error.code === 'PGRST205' ? 'TABLE MISSING (run migrations)' : error.message}`);
    missing.push(table);
    allGood = false;
  } else {
    // Get count separately
    const { count } = await supabase
      .from(table)
      .select('*', { count: 'exact', head: true });
    console.log(`  ✓  ${table.padEnd(30)} → ${count ?? '?'} rows`);
  }
}

console.log('\n' + '─'.repeat(47));

if (allGood) {
  console.log('✅  All tables present. Database is ready.\n');
} else {
  console.log(`\n⚠️   Missing ${missing.length} table(s):\n`);
  missing.forEach(t => console.log(`     - ${t}`));

  const needsMig001 = missing.some(t =>
    ['verses','strongs_lexicon','knowledge_base'].includes(t));
  const needsMig002 = missing.some(t =>
    ['bible_books','tahot_words','proper_names'].includes(t));

  console.log('\n📋  ACTION REQUIRED:');
  console.log('    1. Open: https://supabase.com/dashboard/project/gfswworikmaneujvcnrc/sql/new');
  if (needsMig001) console.log('    2. Paste and run: supabase/migrations/001_initial_schema.sql');
  if (needsMig002) console.log(`    ${needsMig001 ? '3' : '2'}. Paste and run: supabase/migrations/002_word_level_and_tipnr.sql`);
  console.log('    Then re-run this script to confirm.\n');
}
