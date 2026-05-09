/**
 * ISA820 — Master Import Runner
 * Run: node scripts/run-all.mjs
 *
 * Executes the full data pipeline in order:
 *   1. verify-connection   → confirm DB is up + tables exist
 *   2. parse-lexicons      → TBESH + TBESG → strongs_lexicon
 *   3. parse-tahot         → TAHOT → tahot_words + OT verses
 *   4. parse-tagnt         → TAGNT → tagnt_words + NT verses
 *   5. parse-tipnr         → TIPNR → proper_names + occurrences
 *
 * Prerequisites (must be done FIRST in Supabase dashboard):
 *   https://supabase.com/dashboard/project/gfswworikmaneujvcnrc/sql/new
 *   1. Paste + run: supabase/migrations/001_initial_schema.sql
 *   2. Paste + run: supabase/migrations/002_word_level_and_tipnr.sql
 */

import { execSync } from 'child_process';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __dir = dirname(fileURLToPath(import.meta.url));

const STEPS = [
  { name: 'Verify Connection',      script: 'verify-connection.mjs' },
  { name: 'Parse Lexicons (TBESH/TBESG)', script: 'parse-lexicons.mjs' },
  { name: 'Parse TAHOT (Hebrew OT)', script: 'parse-tahot.mjs' },
  { name: 'Parse TAGNT (Greek NT)',  script: 'parse-tagnt.mjs' },
  { name: 'Parse TIPNR (Names)',     script: 'parse-tipnr.mjs' },
];

console.log('\n╔════════════════════════════════════════════════╗');
console.log('║   ISA820 — Full Data Import Pipeline           ║');
console.log('╚════════════════════════════════════════════════╝\n');

const startTime = Date.now();

for (let i = 0; i < STEPS.length; i++) {
  const { name, script } = STEPS[i];
  const scriptPath = join(__dir, script);
  console.log(`\n[${i + 1}/${STEPS.length}] ${name}`);
  console.log('='.repeat(50));

  try {
    execSync(`node "${scriptPath}"`, { stdio: 'inherit' });
  } catch (err) {
    console.error(`\n❌  Step "${name}" failed. Check errors above.`);
    console.error('    Fix the issue and re-run that individual script, then continue.');
    process.exit(1);
  }
}

const elapsed = ((Date.now() - startTime) / 1000 / 60).toFixed(1);
console.log('\n╔════════════════════════════════════════════════╗');
console.log(`║  ✅  ALL STEPS COMPLETE  (${elapsed} min)          ║`);
console.log('╚════════════════════════════════════════════════╝');
console.log(`
Database is now populated. Verify at:
  https://supabase.com/dashboard/project/gfswworikmaneujvcnrc/editor

Next step — run this SQL to link proper names to verse rows:
  supabase/migrations/003_link_occurrences.sql

Then wire the UI:
  node scripts/wire-ui.mjs   (coming next)
`);
