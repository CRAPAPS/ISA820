/**
 * Re-import KJV with word-level Strong's numbers.
 *
 * bolls.life format: "In the beginning<S>7225</S> God<S>430</S>"
 * Each <S>N</S> tag follows the English word(s) it maps to.
 *
 * Produces word_strongs JSONB: [{t:"In the beginning",s:"H7225"},{t:" God",s:"H430"},…]
 * Also populates strongs_numbers TEXT[] for the existing chip/search system.
 *
 * Run: node scripts/import-kjv-strongs.mjs
 * Safe to re-run — upserts only, skips chapters already fully tagged.
 */

import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://gfswworikmaneujvcnrc.supabase.co';
const SERVICE_KEY  = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imdmc3d3b3Jpa21hbmV1anZjbnJjIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NTU4MDcxMCwiZXhwIjoyMDkxMTU2NzEwfQ.SojrBXlel2RgnEG4Yxa-77RVWDM6iuzP9AZxTxt5_4w';

const supabase = createClient(SUPABASE_URL, SERVICE_KEY);

const OT_BOOKS = new Set([
  'Genesis','Exodus','Leviticus','Numbers','Deuteronomy','Joshua','Judges','Ruth',
  '1 Samuel','2 Samuel','1 Kings','2 Kings','1 Chronicles','2 Chronicles',
  'Ezra','Nehemiah','Esther','Job','Psalms','Proverbs','Ecclesiastes',
  'Song of Solomon','Isaiah','Jeremiah','Lamentations','Ezekiel','Daniel',
  'Hosea','Joel','Amos','Obadiah','Jonah','Micah','Nahum','Habakkuk',
  'Zephaniah','Haggai','Zechariah','Malachi',
]);

const BOOKS = [
  ['Genesis',50],['Exodus',40],['Leviticus',27],['Numbers',36],['Deuteronomy',34],
  ['Joshua',24],['Judges',21],['Ruth',4],['1 Samuel',31],['2 Samuel',24],
  ['1 Kings',22],['2 Kings',25],['1 Chronicles',29],['2 Chronicles',36],
  ['Ezra',10],['Nehemiah',13],['Esther',10],['Job',42],['Psalms',150],['Proverbs',31],
  ['Ecclesiastes',12],['Song of Solomon',8],['Isaiah',66],['Jeremiah',52],
  ['Lamentations',5],['Ezekiel',48],['Daniel',12],['Hosea',14],['Joel',3],
  ['Amos',9],['Obadiah',1],['Jonah',4],['Micah',7],['Nahum',3],['Habakkuk',3],
  ['Zephaniah',3],['Haggai',2],['Zechariah',14],['Malachi',4],
  ['Matthew',28],['Mark',16],['Luke',24],['John',21],['Acts',28],
  ['Romans',16],['1 Corinthians',16],['2 Corinthians',13],['Galatians',6],
  ['Ephesians',6],['Philippians',4],['Colossians',4],
  ['1 Thessalonians',5],['2 Thessalonians',3],['1 Timothy',6],['2 Timothy',4],
  ['Titus',3],['Philemon',1],['Hebrews',13],['James',5],
  ['1 Peter',5],['2 Peter',3],['1 John',5],['2 John',1],['3 John',1],
  ['Jude',1],['Revelation',22],
];

const BOOK_ABBREV = {
  'Genesis':'Gen','Exodus':'Exod','Leviticus':'Lev','Numbers':'Num','Deuteronomy':'Deut',
  'Joshua':'Josh','Judges':'Judg','Ruth':'Ruth','1 Samuel':'1Sam','2 Samuel':'2Sam',
  '1 Kings':'1Kgs','2 Kings':'2Kgs','1 Chronicles':'1Chr','2 Chronicles':'2Chr',
  'Ezra':'Ezra','Nehemiah':'Neh','Esther':'Esth','Job':'Job','Psalms':'Ps','Proverbs':'Prov',
  'Ecclesiastes':'Eccl','Song of Solomon':'Song','Isaiah':'Isa','Jeremiah':'Jer',
  'Lamentations':'Lam','Ezekiel':'Ezek','Daniel':'Dan','Hosea':'Hos','Joel':'Joel',
  'Amos':'Amos','Obadiah':'Obad','Jonah':'Jonah','Micah':'Mic','Nahum':'Nah',
  'Habakkuk':'Hab','Zephaniah':'Zeph','Haggai':'Hag','Zechariah':'Zech','Malachi':'Mal',
  'Matthew':'Matt','Mark':'Mark','Luke':'Luke','John':'John','Acts':'Acts',
  'Romans':'Rom','1 Corinthians':'1Cor','2 Corinthians':'2Cor','Galatians':'Gal',
  'Ephesians':'Eph','Philippians':'Phil','Colossians':'Col',
  '1 Thessalonians':'1Thess','2 Thessalonians':'2Thess','1 Timothy':'1Tim','2 Timothy':'2Tim',
  'Titus':'Titus','Philemon':'Phlm','Hebrews':'Heb','James':'Jas',
  '1 Peter':'1Pet','2 Peter':'2Pet','1 John':'1John','2 John':'2John','3 John':'3John',
  'Jude':'Jude','Revelation':'Rev',
};

function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

/**
 * Parse "word<S>7225</S> phrase<S>430</S>" into token array.
 * Returns [{t:"word",s:"H7225"},{t:" phrase",s:"H430"}]
 * Strips any remaining HTML tags from text portions.
 */
function parseWordStrongs(rawText, isOT) {
  const prefix = isOT ? 'H' : 'G';
  const parts = rawText.split(/(<S>\d+<\/S>)/);
  const tokens = [];

  for (let i = 0; i < parts.length; i++) {
    const part = parts[i];
    const sMatch = part.match(/^<S>(\d+)<\/S>$/);

    if (sMatch) {
      const sid = prefix + sMatch[1];
      // Attach to the preceding text token if it has no Strong's yet
      if (tokens.length > 0 && tokens[tokens.length - 1].s === undefined) {
        tokens[tokens.length - 1].s = sid;
      } else {
        // Standalone particle (no visible English text)
        tokens.push({ t: '', s: sid });
      }
    } else {
      // Strip any residual HTML tags (e.g. <i>, <b>)
      const clean = part.replace(/<[^>]+>/g, '');
      if (clean) tokens.push({ t: clean });
    }
  }

  return tokens.filter(tok => tok.t || tok.s);
}

function cleanPlainText(rawText) {
  return rawText
    .replace(/<S>\d+<\/S>/g, '')
    .replace(/<[^>]+>/g, '')
    .replace(/\s{2,}/g, ' ')
    .trim();
}

async function fetchChapter(bookAbbrev, chapter) {
  const url = `https://bolls.life/get-chapter/KJV/${bookAbbrev}/${chapter}/`;
  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      const res = await fetch(url, { signal: AbortSignal.timeout(15000) });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return await res.json();
    } catch (e) {
      if (attempt === 2) throw e;
      await sleep(2000 * (attempt + 1));
    }
  }
}

async function chapterAlreadyTagged(book, chapter) {
  const { count } = await supabase
    .from('verses')
    .select('*', { count: 'exact', head: true })
    .eq('book', book)
    .eq('chapter', chapter)
    .eq('translation', 'KJV')
    .not('word_strongs', 'is', null);
  return (count ?? 0) > 0;
}

async function processChapter(book, chapter, verses) {
  const isOT = OT_BOOKS.has(book);

  const rows = verses.map(v => {
    const tokens = parseWordStrongs(v.text, isOT);
    const strongsIds = [...new Set(
      tokens.filter(t => t.s).map(t => t.s)
    )];
    const plainText = cleanPlainText(v.text);

    return {
      book,
      chapter,
      verse: v.verse,
      translation: 'KJV',
      text: plainText,
      word_strongs: tokens,
      strongs_numbers: strongsIds,
    };
  });

  const { error } = await supabase
    .from('verses')
    .upsert(rows, { onConflict: 'book,chapter,verse,translation', ignoreDuplicates: false });

  if (error) throw error;
  return rows.length;
}

async function main() {
  let totalVerses = 0;
  let totalSkipped = 0;

  for (const [book, numChapters] of BOOKS) {
    const abbrev = BOOK_ABBREV[book];
    for (let ch = 1; ch <= numChapters; ch++) {
      try {
        if (await chapterAlreadyTagged(book, ch)) {
          totalSkipped++;
          process.stdout.write(`↷ ${book} ${ch} (already tagged)\n`);
          continue;
        }

        const verses = await fetchChapter(abbrev, ch);
        if (!verses?.length) {
          console.log(`⚠ ${book} ${ch}: no data`);
          continue;
        }

        const count = await processChapter(book, ch, verses);
        totalVerses += count;
        process.stdout.write(`✓ ${book} ${ch}: ${count} verses tagged\n`);
        await sleep(200);
      } catch (e) {
        console.error(`✗ ${book} ${ch}: ${e.message}`);
        await sleep(1000);
      }
    }
  }

  console.log(`\nDone. Tagged ${totalVerses} verses, skipped ${totalSkipped} chapters.`);
}

main().catch(console.error);
