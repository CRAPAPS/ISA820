// Tests multiple free Bible data sources to find one that works
const SOURCES = [
  {
    name: 'getbible.net v2 chapter',
    url: 'https://getbible.net/v2/asv/1/1.json',
  },
  {
    name: 'getbible.net v2 book',
    url: 'https://getbible.net/v2/asv/1.json',
  },
  {
    name: 'thiagobodruk/bible GitHub (en_asv)',
    url: 'https://raw.githubusercontent.com/thiagobodruk/bible/master/json/en_asv.json',
  },
  {
    name: 'scrollmapper/bible_databases (asv JSON)',
    url: 'https://raw.githubusercontent.com/scrollmapper/bible_databases/master/formats/json/asv.json',
  },
  {
    name: 'openbible.info API',
    url: 'https://labs.bible.org/api/?passage=Genesis+1:1&type=json&translation=asv',
  },
];

async function probe(source) {
  try {
    const res = await fetch(source.url, {
      headers: { 'User-Agent': 'Mozilla/5.0 (compatible)' },
      signal: AbortSignal.timeout(8000),
    });
    const text = await res.text();
    const isJson = text.trim().startsWith('{') || text.trim().startsWith('[');
    console.log(`\n[${res.status}] ${source.name}`);
    if (!res.ok) { console.log('  FAILED — HTTP', res.status); return; }
    if (!isJson) { console.log('  FAILED — returned HTML, not JSON'); console.log('  Preview:', text.substring(0, 80)); return; }
    console.log('  OK — JSON received');
    console.log('  Preview:', text.substring(0, 200));
  } catch (err) {
    console.log(`\n[ERR] ${source.name}: ${err.message}`);
  }
}

async function main() {
  console.log('Probing Bible data sources...\n');
  for (const s of SOURCES) await probe(s);
  console.log('\nDone.');
}

main();
