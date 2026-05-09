const { createClient } = require('@supabase/supabase-js');
const AdmZip = require('adm-zip');
const path = require('path');
const fs = require('fs');

const SUPABASE_URL = 'https://gfswworikmaneujvcnrc.supabase.co';
const SUPABASE_SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imdmc3d3b3Jpa21hbmV1anZjbnJjIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NTU4MDcxMCwiZXhwIjoyMDkxMTU2NzEwfQ.SojrBXlel2RgnEG4Yxa-77RVWDM6iuzP9AZxTxt5_4w';
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

const TRANSLATIONS = [
  { label: 'ASV', url: 'https://ebible.org/Scriptures/eng-asv_usfm.zip' },
  { label: 'WEB', url: 'https://ebible.org/Scriptures/eng-web_usfm.zip' },
  { label: 'YLT', url: 'https://ebible.org/Scriptures/engylt_usfm.zip' },
];

// USFM book code → canonical book name
const BOOK_CODES = {
  GEN:'Genesis', EXO:'Exodus', LEV:'Leviticus', NUM:'Numbers', DEU:'Deuteronomy',
  JOS:'Joshua', JDG:'Judges', RUT:'Ruth', '1SA':'1 Samuel', '2SA':'2 Samuel',
  '1KI':'1 Kings', '2KI':'2 Kings', '1CH':'1 Chronicles', '2CH':'2 Chronicles',
  EZR:'Ezra', NEH:'Nehemiah', EST:'Esther', JOB:'Job', PSA:'Psalms', PRO:'Proverbs',
  ECC:'Ecclesiastes', SNG:'Song of Solomon', ISA:'Isaiah', JER:'Jeremiah',
  LAM:'Lamentations', EZK:'Ezekiel', DAN:'Daniel', HOS:'Hosea', JOL:'Joel',
  AMO:'Amos', OBA:'Obadiah', JON:'Jonah', MIC:'Micah', NAH:'Nahum', HAB:'Habakkuk',
  ZEP:'Zephaniah', HAG:'Haggai', ZEC:'Zechariah', MAL:'Malachi',
  MAT:'Matthew', MRK:'Mark', LUK:'Luke', JHN:'John', ACT:'Acts', ROM:'Romans',
  '1CO':'1 Corinthians', '2CO':'2 Corinthians', GAL:'Galatians', EPH:'Ephesians',
  PHP:'Philippians', COL:'Colossians', '1TH':'1 Thessalonians', '2TH':'2 Thessalonians',
  '1TI':'1 Timothy', '2TI':'2 Timothy', TIT:'Titus', PHM:'Philemon', HEB:'Hebrews',
  JAS:'James', '1PE':'1 Peter', '2PE':'2 Peter', '1JN':'1 John', '2JN':'2 John',
  '3JN':'3 John', JUD:'Jude', REV:'Revelation',
};

const BATCH_SIZE = 300;

function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

function parseUSFM(content, bookName) {
  const verses = [];
  let chapter = 0;

  // Split into lines for processing
  const lines = content.split('\n');
  let verseNum = 0;
  let verseText = '';

  function flushVerse() {
    if (verseNum > 0 && chapter > 0 && verseText.trim()) {
      verses.push({
        book: bookName,
        chapter,
        verse: verseNum,
        text: verseText.trim(),
        translation: '', // set by caller
        speaker: null, strongs_numbers: null, word_strongs: null, pillar_tags: null,
      });
    }
    verseText = '';
    verseNum = 0;
  }

  for (const rawLine of lines) {
    const line = rawLine.trim();

    // Chapter marker
    const cMatch = line.match(/^\\c\s+(\d+)/);
    if (cMatch) {
      flushVerse();
      chapter = parseInt(cMatch[1], 10);
      continue;
    }

    // Verse marker (may have text on same line)
    const vMatch = line.match(/^\\v\s+(\d+)\s*(.*)/);
    if (vMatch) {
      flushVerse();
      verseNum = parseInt(vMatch[1], 10);
      verseText = vMatch[2] || '';
      continue;
    }

    // Continuation text (not a new marker line, or a paragraph/section marker)
    if (verseNum > 0) {
      if (line.startsWith('\\c ') || line.startsWith('\\v ')) continue; // handled above
      if (line.startsWith('\\id') || line.startsWith('\\h ') || line.startsWith('\\toc') ||
          line.startsWith('\\mt') || line.startsWith('\\ms') || line.startsWith('\\mr') ||
          line.startsWith('\\s ') || line.startsWith('\\r ') || line.startsWith('\\d ')) continue;
      // Strip inline markers but keep text
      const cleaned = line.replace(/\\[a-z0-9*+]+\s*/g, ' ').trim();
      if (cleaned) verseText += ' ' + cleaned;
    }
  }
  flushVerse();

  // Clean up verse text: strip remaining backslash codes, collapse whitespace
  return verses.map(v => ({
    ...v,
    text: v.text
      .replace(/\\[a-z0-9*+]+\s*/gi, ' ')
      .replace(/\s+/g, ' ')
      .trim(),
  })).filter(v => v.text.length > 0);
}

async function downloadZip(url) {
  console.log(`  Downloading ${url}...`);
  const res = await fetch(url, {
    headers: { 'User-Agent': 'Mozilla/5.0 (compatible; BibleImport)' },
  });
  if (!res.ok) throw new Error(`HTTP ${res.status} from ${url}`);
  const buffer = await res.arrayBuffer();
  return Buffer.from(buffer);
}

async function importTranslation({ label, url }) {
  console.log(`\n=== Importing ${label} ===`);

  const zipBuffer = await downloadZip(url);
  const zip = new AdmZip(zipBuffer);
  const entries = zip.getEntries().filter(e => e.entryName.endsWith('.usfm'));
  console.log(`  Found ${entries.length} USFM files`);


  let allVerses = [];
  let totalInserted = 0;
  let skipped = [];

  for (const entry of entries) {
    // Extract book code from filename e.g. "02-GENeng-asv.usfm" or "GEN.usfm"
    const fname = path.basename(entry.entryName);
    const codeMatch = fname.match(/([A-Z1-9]{3})(?:eng|-)/i) || fname.match(/^([A-Z1-9]{3})\./i);
    if (!codeMatch) { skipped.push(fname); continue; }

    const code = codeMatch[1].toUpperCase();
    const bookName = BOOK_CODES[code];
    if (!bookName) { skipped.push(`${fname} (unknown code ${code})`); continue; }

    const content = entry.getData().toString('utf8');
    const verses = parseUSFM(content, bookName).map(v => ({ ...v, translation: label }));

    if (verses.length === 0) { skipped.push(`${bookName} (0 verses parsed)`); continue; }

    process.stdout.write(`\r  ${label}: ${bookName.padEnd(20)} — ${verses.length} verses`);
    allVerses.push(...verses);

    if (allVerses.length >= BATCH_SIZE) {
      const { error } = await supabase.from('verses')
        .upsert(allVerses.splice(0, BATCH_SIZE), { onConflict: 'book,chapter,verse,translation' });
      if (error) { console.error('\n  Upsert error:', error.message); process.exit(1); }
      totalInserted += BATCH_SIZE;
    }
  }

  // Flush remainder
  if (allVerses.length > 0) {
    const { error } = await supabase.from('verses')
      .upsert(allVerses, { onConflict: 'book,chapter,verse,translation' });
    if (error) { console.error('\n  Upsert error:', error.message); process.exit(1); }
    totalInserted += allVerses.length;
  }

  if (skipped.length) console.log(`\n  Skipped: ${skipped.join(', ')}`);
  console.log(`\n  ${label} complete: ${totalInserted + allVerses.length} verses imported.`);
}

async function main() {
  for (const t of TRANSLATIONS) await importTranslation(t);

  console.log('\n=== Final counts ===');
  for (const t of ['KJV', 'BSB', 'ASV', 'YLT', 'WEB']) {
    const { count } = await supabase
      .from('verses').select('*', { count: 'exact', head: true }).eq('translation', t);
    console.log(`${t}: ${count ?? 0} rows`);
  }
}

main().catch(err => { console.error(err); process.exit(1); });
