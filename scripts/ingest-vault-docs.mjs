/**
 * ISA820 — Vault Standard Document Ingest
 *
 * Run: node scripts/ingest-vault-docs.mjs [--force]
 *
 * Walks ISA_MASTER_VAULT/03_Standard_Documents, extracts the text of every PDF,
 * and lands it where the Forensic Analyst can actually read it.
 *
 *   knowledge_base      → doctrinal documents. These are BINDING: the analyst
 *                         must concur with their conclusions. The analyst route
 *                         injects every row into each call.
 *   standard_documents  → registry of every vault file, doctrinal or reference,
 *                         so the admin vault can list what exists on disk.
 *
 * Drop a new PDF into the folder, re-run, and it flows through automatically.
 *
 * CURATION SAFETY: rows whose topic already exists are SKIPPED unless --force is
 * passed. Several knowledge_base entries have been hand-edited since their PDFs
 * were written (see commit c57494a), and raw PDF extraction is coarser than that
 * curated prose. Overwriting silently would regress the analyst's own source of
 * truth, so re-ingest of an existing topic must be a deliberate act.
 */

import { readFileSync, readdirSync, statSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join, extname, basename } from 'path';
import { createClient } from '@supabase/supabase-js';
import { extractText, getDocumentProxy } from 'unpdf';

const __dir = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dir, '..');
const DOCS_DIR = join(ROOT, 'ISA_MASTER_VAULT', '03_Standard_Documents');

const FORCE = process.argv.includes('--force');

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
  { auth: { persistSession: false } },
);

/**
 * Explicit manifest. Filenames are prose, and slugs derived from them would not
 * match the topics already in knowledge_base — "The Knowledge of Good and Evil.pdf"
 * derives "the-knowledge-of-good-and-evil" against the existing
 * "knowledge-of-good-and-evil" and would create a duplicate. Map them by hand.
 *
 * role: 'binding'   → doctrinal; goes to knowledge_base, analyst must concur
 *       'reference' → consulted, not binding; registry only
 *
 * Files absent from this manifest default to binding doctrinal with a derived
 * slug, which is the right default for new topic studies.
 */
const MANIFEST = {
  'The Knowledge of Good and Evil.pdf': {
    topic: 'knowledge-of-good-and-evil',
    title: 'The Knowledge of Good and Evil',
    role: 'binding',
    related: ['genesis', 'eden', 'sin', 'law'],
  },
  'The Case Against the Greek Interpretation of Matthew 1-16.pdf': {
    topic: 'matthew-1-16-biological-paternity',
    title: 'The Biological Paternity of the Messiah (Matthew 1:16)',
    role: 'binding',
    related: ['messiah', 'genealogy', 'matthew', 'incarnation'],
  },
  'Matthew 120 and the Nature of the Conception.pdf': {
    topic: 'matthew-1-20-conception',
    title: 'Matthew 1:20 and the Nature of the Conception',
    role: 'binding',
    related: ['messiah', 'conception', 'matthew', 'holy-spirit'],
  },
  'Who Is Speaking in Revelation.pdf': {
    topic: 'who-is-speaking-in-revelation',
    title: 'The Lion-Lamb Paradigm: Who Is Speaking in Revelation',
    role: 'binding',
    related: [
      'revelation', 'voice-signature', 'speaker-attribution', 'alpha-omega',
      'johannine-comma', 'seven-spirits', 'trinity',
    ],
  },
  'alphabet_chart2.pdf': {
    topic: 'paleo-hebrew-alphabet-chart',
    title: 'Paleo-Hebrew / Pictographic Alphabet Reference Chart',
    role: 'reference',
    related: ['hebrew', 'alphabet', 'etymology'],
  },
};

function deriveTopic(filename) {
  return basename(filename, extname(filename))
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 100);
}

/**
 * PDF text layers carry soft hyphens and line-wrap artefacts. Repair the
 * wrapping without touching the words — this text becomes doctrinal authority,
 * so the transform must stay conservative.
 */
function cleanText(raw) {
  return raw
    .replace(/\r/g, '')
    .replace(/-\n(?=[a-z])/g, '')     // re-join hyphenated line breaks
    .replace(/[ \t]+\n/g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

async function extractPdf(filePath) {
  const buf = new Uint8Array(readFileSync(filePath));
  const pdf = await getDocumentProxy(buf);
  const { totalPages, text } = await extractText(pdf, { mergePages: true });
  return { pages: totalPages, text: cleanText(text) };
}

// ── MAIN ─────────────────────────────────────────────────────────────────────
console.log('\n╔═══════════════════════════════════════════╗');
console.log('║   ISA820 — Vault Standard Document Ingest  ║');
console.log('╚═══════════════════════════════════════════╝\n');

const files = readdirSync(DOCS_DIR).filter(f => extname(f).toLowerCase() === '.pdf').sort();

if (!files.length) {
  console.error('ERROR: no PDFs found in', DOCS_DIR);
  process.exit(1);
}

console.log(`Found ${files.length} document(s) in 03_Standard_Documents:\n`);

const { data: existingRows, error: exErr } = await supabase
  .from('knowledge_base')
  .select('topic');
if (exErr) {
  console.error('ERROR reading knowledge_base:', exErr.message);
  process.exit(1);
}
const existingTopics = new Set((existingRows || []).map(r => r.topic));

let inserted = 0, updated = 0, skipped = 0, registered = 0;

for (const filename of files) {
  const filePath = join(DOCS_DIR, filename);
  const size = statSync(filePath).size;
  const meta = MANIFEST[filename] || {
    topic: deriveTopic(filename),
    title: basename(filename, extname(filename)),
    role: 'binding',
    related: [],
  };

  process.stdout.write(`  ${filename}\n`);

  let extracted;
  try {
    extracted = await extractPdf(filePath);
  } catch (err) {
    console.error(`    ✗ extraction failed: ${err.message}`);
    continue;
  }
  console.log(`    ${extracted.pages} pages, ${extracted.text.length.toLocaleString()} chars — ${meta.role}`);

  // 1. Registry entry for every file, doctrinal or reference.
  const { error: docErr } = await supabase
    .from('standard_documents')
    .insert({
      title: meta.title,
      description: meta.role === 'binding'
        ? 'Binding doctrinal study — the analyst must concur with its conclusions.'
        : 'Reference material — consulted, not binding.',
      file_path: `ISA_MASTER_VAULT/03_Standard_Documents/${filename}`,
      file_type: 'pdf',
      file_size: size,
      category: meta.role === 'binding' ? 'standard' : 'graphic',
    });
  if (docErr) console.error(`    ✗ standard_documents: ${docErr.message}`);
  else registered++;

  // 2. Binding documents also become analyst context.
  if (meta.role !== 'binding') {
    console.log('    → reference only; not added to the binding knowledge base');
    continue;
  }

  if (existingTopics.has(meta.topic) && !FORCE) {
    console.log(`    → topic "${meta.topic}" already curated; skipped (use --force to overwrite)`);
    skipped++;
    continue;
  }

  const { error: kbErr } = await supabase
    .from('knowledge_base')
    .upsert({
      topic: meta.topic,
      title: meta.title,
      content: extracted.text,
      confidence_level: 'HIGH',
      related_topics: meta.related,
      updated_at: new Date().toISOString(),
    }, { onConflict: 'topic', ignoreDuplicates: false });

  if (kbErr) {
    console.error(`    ✗ knowledge_base: ${kbErr.message}`);
  } else if (existingTopics.has(meta.topic)) {
    console.log(`    → knowledge_base "${meta.topic}" OVERWRITTEN`);
    updated++;
  } else {
    console.log(`    → knowledge_base "${meta.topic}" inserted (now binding on the analyst)`);
    inserted++;
  }
}

console.log('\n' + '─'.repeat(47));
console.log('✅  Done.');
console.log(`    Files registered      : ${registered}`);
console.log(`    KB topics inserted    : ${inserted}`);
console.log(`    KB topics overwritten : ${updated}`);
console.log(`    KB topics skipped     : ${skipped}${skipped && !FORCE ? '  (re-run with --force to overwrite)' : ''}`);
console.log();
