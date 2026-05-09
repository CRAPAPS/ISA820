const XLSX = require('xlsx');
const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = 'https://gfswworikmaneujvcnrc.supabase.co';
const SUPABASE_SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imdmc3d3b3Jpa21hbmV1anZjbnJjIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NTU4MDcxMCwiZXhwIjoyMDkxMTU2NzEwfQ.SojrBXlel2RgnEG4Yxa-77RVWDM6iuzP9AZxTxt5_4w';

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

const FILE_PATH = 'E:\\Bible stuff\\ISA820\\ISA820-main\\ISA_MASTER_VAULT\\01_Bible_Raw\\English_Versions\\Berean Bible.xlsx';
const BATCH_SIZE = 500;

function parseRef(ref) {
  // Handles "Genesis 1:1", "1 Samuel 3:4", "Song of Solomon 2:1" etc.
  const match = ref.match(/^(.+)\s+(\d+):(\d+)$/);
  if (!match) return null;
  return { book: match[1].trim(), chapter: parseInt(match[2], 10), verse: parseInt(match[3], 10) };
}

async function main() {
  console.log('Reading BSB xlsx...');
  const wb = XLSX.readFile(FILE_PATH);
  const ws = wb.Sheets[wb.SheetNames[0]];
  const rows = XLSX.utils.sheet_to_json(ws, { header: 1 });

  // Rows 0-2 are title/license/header — data starts at index 3
  const dataRows = rows.slice(3);
  console.log(`Parsed ${dataRows.length} verse rows`);

  const verses = [];
  let skipped = 0;

  for (const row of dataRows) {
    const ref = row[1];
    const text = row[2];
    if (!ref || !text) { skipped++; continue; }

    const parsed = parseRef(String(ref));
    if (!parsed) { skipped++; console.warn('Could not parse ref:', ref); continue; }

    verses.push({
      book: parsed.book,
      chapter: parsed.chapter,
      verse: parsed.verse,
      text: String(text).replace(/\s+/g, ' ').trim(),
      translation: 'BSB',
      speaker: null,
      strongs_numbers: null,
      word_strongs: null,
      pillar_tags: null,
    });
  }

  console.log(`Prepared ${verses.length} verses (skipped ${skipped} empty rows)`);
  console.log(`Sample: ${verses[0].id} — "${verses[0].text.substring(0, 60)}..."`);

  // Clear existing BSB rows first to avoid duplicates on re-run
  console.log('Clearing existing BSB rows...');
  const { error: delError } = await supabase.from('verses').delete().eq('translation', 'BSB');
  if (delError) console.warn('Delete warning (may be fine if none existed):', delError.message);

  // Insert in batches
  let inserted = 0;
  for (let i = 0; i < verses.length; i += BATCH_SIZE) {
    const batch = verses.slice(i, i + BATCH_SIZE);
    const { error } = await supabase
      .from('verses')
      .insert(batch);

    if (error) {
      console.error(`Batch ${i}-${i + BATCH_SIZE} failed:`, error.message);
      process.exit(1);
    }

    inserted += batch.length;
    process.stdout.write(`\rInserted ${inserted}/${verses.length} verses...`);
  }

  console.log(`\nDone! ${inserted} BSB verses imported into Supabase.`);
}

main().catch(err => { console.error(err); process.exit(1); });
