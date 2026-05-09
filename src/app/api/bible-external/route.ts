import { NextRequest } from 'next/server';

const NIV_BIBLE_ID = '78a9f6124f344018-01';

// Map our book names to API.Bible chapter ID format (e.g. "Genesis" → "GEN")
const BOOK_TO_API: Record<string, string> = {
  'Genesis': 'GEN', 'Exodus': 'EXO', 'Leviticus': 'LEV', 'Numbers': 'NUM',
  'Deuteronomy': 'DEU', 'Joshua': 'JOS', 'Judges': 'JDG', 'Ruth': 'RUT',
  '1 Samuel': '1SA', '2 Samuel': '2SA', '1 Kings': '1KI', '2 Kings': '2KI',
  '1 Chronicles': '1CH', '2 Chronicles': '2CH', 'Ezra': 'EZR', 'Nehemiah': 'NEH',
  'Esther': 'EST', 'Job': 'JOB', 'Psalms': 'PSA', 'Proverbs': 'PRO',
  'Ecclesiastes': 'ECC', 'Song of Solomon': 'SNG', 'Isaiah': 'ISA',
  'Jeremiah': 'JER', 'Lamentations': 'LAM', 'Ezekiel': 'EZK', 'Daniel': 'DAN',
  'Hosea': 'HOS', 'Joel': 'JOL', 'Amos': 'AMO', 'Obadiah': 'OBA', 'Jonah': 'JON',
  'Micah': 'MIC', 'Nahum': 'NAH', 'Habakkuk': 'HAB', 'Zephaniah': 'ZEP',
  'Haggai': 'HAG', 'Zechariah': 'ZEC', 'Malachi': 'MAL',
  'Matthew': 'MAT', 'Mark': 'MRK', 'Luke': 'LUK', 'John': 'JHN', 'Acts': 'ACT',
  'Romans': 'ROM', '1 Corinthians': '1CO', '2 Corinthians': '2CO',
  'Galatians': 'GAL', 'Ephesians': 'EPH', 'Philippians': 'PHP', 'Colossians': 'COL',
  '1 Thessalonians': '1TH', '2 Thessalonians': '2TH', '1 Timothy': '1TI',
  '2 Timothy': '2TI', 'Titus': 'TIT', 'Philemon': 'PHM', 'Hebrews': 'HEB',
  'James': 'JAS', '1 Peter': '1PE', '2 Peter': '2PE', '1 John': '1JN',
  '2 John': '2JN', '3 John': '3JN', 'Jude': 'JUD', 'Revelation': 'REV',
};

interface ApiBibleVerse {
  id: string;
  reference: string;
  content: string;
  chapterIds: string[];
  bookId: string;
}

interface ApiBibleChapterResponse {
  data: {
    id: string;
    content: string; // HTML content with verse numbers
    reference: string;
    number: string;
    verses?: { id: string; text?: string }[];
  };
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const book = searchParams.get('book');
  const chapter = searchParams.get('chapter');
  const translation = (searchParams.get('translation') || 'NIV').toUpperCase();

  if (!book || !chapter) {
    return Response.json({ error: 'Missing book or chapter' }, { status: 400 });
  }

  // WEB / ASV / YLT — proxy through server to avoid browser CORS issues
  if (['WEB', 'ASV', 'YLT'].includes(translation)) {
    try {
      const url = `https://bible-api.com/${encodeURIComponent(book)}%20${chapter}?translation=${translation.toLowerCase()}`;
      const res = await fetch(url);
      if (!res.ok) {
        const errText = await res.text();
        console.error(`bible-api.com error ${res.status} for ${url}: ${errText}`);
        return Response.json({ error: `bible-api.com returned ${res.status}`, verses: [] });
      }
      const data = await res.json() as {
        verses?: { book_name: string; chapter: number; verse: number; text: string }[];
        error?: string;
      };
      if (data.error) {
        console.error(`bible-api.com error for ${url}:`, data.error);
        return Response.json({ error: data.error, verses: [] });
      }
      const verses = (data.verses || []).map(v => ({
        id: `${translation}-${book}-${chapter}-${v.verse}`,
        book: v.book_name || book,
        chapter: v.chapter,
        verse: v.verse,
        text: v.text.replace(/\n/g, ' ').trim(),
        translation,
        speaker: null, strongs_numbers: null, word_strongs: null, pillar_tags: null,
      }));
      return Response.json({ verses });
    } catch (err) {
      console.error('bible-api.com fetch threw:', err);
      return Response.json({ error: String(err), verses: [] });
    }
  }

  // NIV — requires API.Bible key
  const apiKey = process.env.BIBLE_API_KEY;
  if (!apiKey) {
    return Response.json({ error: 'BIBLE_API_KEY not configured in .env.local — get a free key at scripture.api.bible' }, { status: 500 });
  }

  const bookCode = BOOK_TO_API[book];
  if (!bookCode) {
    return Response.json({ error: `Unknown book: ${book}` }, { status: 400 });
  }

  const bibleId = NIV_BIBLE_ID;
  const chapterId = `${bookCode}.${chapter}`;

  // Fetch all verses in the chapter
  const versesUrl = `https://api.scripture.api.bible/v1/bibles/${bibleId}/chapters/${chapterId}/verses`;
  const versesRes = await fetch(versesUrl, {
    headers: { 'api-key': apiKey },
  });

  if (!versesRes.ok) {
    const text = await versesRes.text();
    return Response.json({ error: `API.Bible error: ${versesRes.status} ${text}` }, { status: versesRes.status });
  }

  const versesData = await versesRes.json() as { data: { id: string; reference: string }[] };
  const verseList = versesData.data || [];

  // Fetch each verse's text in parallel (batched to avoid rate limits)
  const batchSize = 10;
  const results: { id: string; verse: number; text: string }[] = [];

  for (let i = 0; i < verseList.length; i += batchSize) {
    const batch = verseList.slice(i, i + batchSize);
    const batchResults = await Promise.all(
      batch.map(async (v) => {
        const verseUrl = `https://api.scripture.api.bible/v1/bibles/${bibleId}/verses/${v.id}?content-type=text&include-verse-numbers=false&include-titles=false`;
        const vRes = await fetch(verseUrl, { headers: { 'api-key': apiKey } });
        if (!vRes.ok) return null;
        const vData = await vRes.json() as { data: { id: string; content: string; reference: string } };
        const verseNum = parseInt(v.id.split('.')[2], 10);
        return {
          id: v.id,
          verse: verseNum,
          text: (vData.data?.content || '').replace(/\s+/g, ' ').trim(),
        };
      })
    );
    results.push(...batchResults.filter(Boolean) as typeof results);
  }

  const verses = results.map(v => ({
    id: `NIV-${book}-${chapter}-${v.verse}`,
    book,
    chapter: parseInt(chapter, 10),
    verse: v.verse,
    text: v.text,
    translation: 'NIV',
    speaker: null,
    strongs_numbers: null,
    word_strongs: null,
    pillar_tags: null,
  }));

  return Response.json({ verses });
}
