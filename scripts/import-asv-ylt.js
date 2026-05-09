const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = 'https://gfswworikmaneujvcnrc.supabase.co';
const SUPABASE_SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imdmc3d3b3Jpa21hbmV1anZjbnJjIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NTU4MDcxMCwiZXhwIjoyMDkxMTU2NzEwfQ.SojrBXlel2RgnEG4Yxa-77RVWDM6iuzP9AZxTxt5_4w';

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

// getbible.net uses numeric book IDs 1–66
const BOOKS = [
  'Genesis','Exodus','Leviticus','Numbers','Deuteronomy','Joshua','Judges','Ruth',
  '1 Samuel','2 Samuel','1 Kings','2 Kings','1 Chronicles','2 Chronicles','Ezra',
  'Nehemiah','Esther','Job','Psalms','Proverbs','Ecclesiastes','Song of Solomon',
  'Isaiah','Jeremiah','Lamentations','Ezekiel','Daniel','Hosea','Joel','Amos',
  'Obadiah','Jonah','Micah','Nahum','Habakkuk','Zephaniah','Haggai','Zechariah',
  'Malachi','Matthew','Mark','Luke','John','Acts','Romans','1 Corinthians',
  '2 Corinthians','Galatians','Ephesians','Philippians','Colossians',
  '1 Thessalonians','2 Thessalonians','1 Timothy','2 Timothy','Titus','Philemon',
  'Hebrews','James','1 Peter','2 Peter','1 John','2 John','3 John','Jude','Revelation',
];

// getbible.net translation slugs
const TRANSLATIONS = [
  { slug: 'asv', label: 'ASV' },
  { slug: 'ylt', label: 'YLT' },
  { slug: 'web', label: 'WEB' },
];

const BATCH_SIZE = 200;
const DELAY_MS = 400;
const MAX_RETRIES = 3;

function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

async function fetchBook(bookNr, bookName, slug, attempt = 1) {
  try {
    // getbible.net returns the whole book at once
    const url = `https://getbible.net/v2/${slug}/${bookNr}.json`;
    const res = await fetch(url, {
      headers: { 'User-Agent': 'Mozilla/5.0 (compatible; Bible import script)' }
    });
    if (!res.ok) {
      if (attempt < MAX_RETRIES) { await sleep(1000 * attempt); return fetchBook(bookNr, bookName, slug, attempt + 1); }
      console.warn(`\n  SKIP ${bookName} after ${MAX_RETRIES} attempts (HTTP ${res.status})`);
      return [];
    }
    const data = await res.json();
    // Response: { "1": { book_nr, book_name, chapter, verses: { "1": { verse, text } } }, "2": {...} }
    const verses = [];
    for (const [chStr, chData] of Object.entries(data)) {
      const chapter = parseInt(chStr, 10);
      if (!chData.verses) continue;
      for (const [vStr, vData] of Object.entries(chData.verses)) {
        verses.push({
          book: bookName,
          chapter,
          verse: parseInt(vStr, 10),
          text: (vData.text || '').replace(/\s+/g, ' ').trim(),
          translation: slug.toUpperCase(),
          speaker: null, strongs_numbers: null, word_strongs: null, pillar_tags: null,
        });
      }
    }
    return verses;
  } catch (err) {
    if (attempt < MAX_RETRIES) { await sleep(1000 * attempt); return fetchBook(bookNr, bookName, slug, attempt + 1); }
    console.warn(`\n  SKIP ${bookName}: ${err.message}`);
    return [];
  }
}

async function importTranslation({ slug, label }) {
  console.log(`\n=== Importing ${label} ===`);

  // Clear existing rows book-by-book to avoid timeout
  process.stdout.write('Clearing existing rows...');
  for (const book of BOOKS) {
    await supabase.from('verses').delete().eq('translation', label).eq('book', book);
  }
  console.log(' done.');

  let totalVerses = 0;
  let batch = [];

  for (let i = 0; i < BOOKS.length; i++) {
    const bookName = BOOKS[i];
    const bookNr = i + 1;
    const verses = await fetchBook(bookNr, bookName, slug);
    batch.push(...verses);
    totalVerses += verses.length;
    process.stdout.write(`\r${label}: ${i + 1}/${BOOKS.length} books | ${totalVerses} verses`);

    if (batch.length >= BATCH_SIZE) {
      const { error } = await supabase.from('verses').insert(batch.splice(0, BATCH_SIZE));
      if (error) { console.error('\nInsert error:', error.message); process.exit(1); }
    }

    await sleep(DELAY_MS);
  }

  if (batch.length > 0) {
    const { error } = await supabase.from('verses').insert(batch);
    if (error) { console.error('\nInsert error:', error.message); process.exit(1); }
  }

  console.log(`\n${label} complete: ${totalVerses} verses.`);
}

async function main() {
  // Quick connectivity test
  console.log('Testing getbible.net...');
  const test = await fetch('https://getbible.net/v2/asv/1.json');
  if (!test.ok) { console.error('getbible.net unreachable:', test.status); process.exit(1); }
  const sample = await test.json();
  const firstVerse = sample['1']?.verses?.['1']?.text;
  console.log('Test OK — Genesis 1:1 ASV:', firstVerse || '(no text found — check structure)');
  if (!firstVerse) {
    console.log('Raw sample:', JSON.stringify(sample['1'], null, 2).substring(0, 300));
    process.exit(1);
  }

  for (const t of TRANSLATIONS) await importTranslation(t);

  console.log('\n=== Final counts ===');
  for (const t of ['KJV','BSB','ASV','YLT','WEB']) {
    const { count } = await supabase.from('verses').select('*', { count: 'exact', head: true }).eq('translation', t);
    console.log(`${t}: ${count} rows`);
  }
}

main().catch(err => { console.error(err); process.exit(1); });
