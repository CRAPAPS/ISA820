/**
 * ISA820 — Vault Asset Uploader
 * Uploads all images from ISA_MASTER_VAULT/06_Images_Resources_Links
 * to Supabase Storage (vault bucket) and inserts media_assets records.
 *
 * Run: node scripts/upload-vault-assets.mjs
 */

import { createClient } from '@supabase/supabase-js';
import { readFileSync, readdirSync, existsSync, statSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join, extname, basename } from 'path';
import { lookup as mimeLookup } from 'mime-types';

const __dir = dirname(fileURLToPath(import.meta.url));
const ROOT  = join(__dir, '..');
const IMAGES_DIR = join(ROOT, 'ISA_MASTER_VAULT', '06_Images_Resources_Links');
const DOCS_DIR   = join(ROOT, 'ISA_MASTER_VAULT', '03_Standard_Documents');

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

// ── CURATED METADATA MAP ─────────────────────────────────────────────────────
// Pre-analyzed based on visual inspection of each image.
const METADATA = {
  'Trinity-Triune-diagram-122016-optim.png': {
    title: 'Trinity Triune God Diagram',
    description: 'Shield of the Trinity diagram showing Father, Son, and Holy Spirit with IS / IS NOT relationships. Used to challenge trinitarian doctrine using scripture.',
    topic_tags: ['trinity', 'godhead', 'father', 'son', 'holy spirit', 'doctrine'],
    verse_references: ['Deuteronomy 6:4', 'John 20:17', '1 Corinthians 11:3'],
    type: 'graphic',
  },
  'Isaiah+Scroll.jpg': {
    title: 'Isaiah Scroll — Dead Sea Scrolls',
    description: 'The Great Isaiah Scroll (1QIsa-a) from Qumran Cave 1, one of the oldest surviving manuscripts of the Hebrew Bible, dating to ~150 BCE.',
    topic_tags: ['scripture', 'dead sea scrolls', 'isaiah', 'manuscript', 'qumran'],
    verse_references: ['Isaiah 8:20', 'Isaiah 40:3', 'Isaiah 53:1'],
    type: 'image',
  },
  'Molech-High-Res.png': {
    title: 'Molech — Pagan Child Sacrifice Ritual',
    description: 'Victorian-era engraving depicting child sacrifice to Molech (Moloch), the Canaanite deity. The bronze idol was heated and infants placed in its arms. Connected to Topheth/Hinnom Valley.',
    topic_tags: ['molech', 'false gods', 'child sacrifice', 'canaan', 'hinnom', 'topheth', 'pagan'],
    verse_references: ['Leviticus 18:21', 'Jeremiah 32:35', '2 Kings 23:10', '2 Chronicles 28:3'],
    type: 'image',
  },
  '4-Horsemen.jpg': {
    title: 'Four Horsemen of the Apocalypse',
    description: 'Dark artistic rendering of the Four Horsemen of Revelation 6 — Conquest, War, Famine, and Death — riding through an apocalyptic landscape.',
    topic_tags: ['revelation', 'four horsemen', 'apocalypse', 'judgment', 'end times', 'seals'],
    verse_references: ['Revelation 6:1', 'Revelation 6:8', 'Zechariah 1:8'],
    type: 'graphic',
  },
  'alephbet.jpg': {
    title: 'Ancient Hebrew Pictograph Alephbet',
    description: 'Chart showing the Ancient Hebrew (Paleo-Hebrew) pictographic alphabet with each letter\'s original pictogram, name, and meaning. Essential for understanding root word theology.',
    topic_tags: ['hebrew', 'alphabet', 'alephbet', 'pictograph', 'paleo-hebrew', 'language'],
    verse_references: ['Psalm 119:1', 'Proverbs 8:22'],
    type: 'graphic',
  },
  '3068. יְהֹוָה (Yhvh) -- the proper name of the God of Israel —.png': {
    title: 'Strong\'s H3068 — YHWH (Yhvh)',
    description: 'Strong\'s Concordance entry for H3068 — the Tetragrammaton YHWH (יְהֹוָה), the proper name of the God of Israel. Shows usage frequency across the Hebrew Bible.',
    topic_tags: ['yhwh', 'tetragrammaton', 'name of god', 'strong\'s', 'father', 'oneness'],
    verse_references: ['Exodus 3:14', 'Exodus 6:3', 'Deuteronomy 6:4', 'Isaiah 42:8'],
    type: 'graphic',
  },
  '1933b. havah -- to become —prime root of yhvh.png': {
    title: 'Strong\'s H1933b — Havah (Prime Root of YHWH)',
    description: 'Strong\'s entry for H1933b — "havah" meaning "to become" or "to exist". This is the prime root from which the name YHWH (H3068) is derived, meaning "HE WHO IS / HE WHO CAUSES TO BE".',
    topic_tags: ['yhwh', 'name of god', 'havah', 'strong\'s', 'etymology', 'hebrew', 'existence'],
    verse_references: ['Exodus 3:14', 'Genesis 2:4'],
    type: 'graphic',
  },
  '3091. יְהוֹשׁ֫וּעַ (Yehoshua).png': {
    title: 'Strong\'s H3091 — Yehoshua (Joshua/Yeshua)',
    description: 'Strong\'s Concordance entry for H3091 — Yehoshua (יְהוֹשׁ֫וּעַ), the full form of the name meaning "YHWH is salvation". This is the Hebrew name behind "Jesus" / "Yeshua".',
    topic_tags: ['yehoshua', 'yeshua', 'jesus', 'name', 'salvation', 'strong\'s', 'son'],
    verse_references: ['Numbers 13:16', 'Matthew 1:21', 'Acts 4:12'],
    type: 'graphic',
  },
  'DANIEL IN THE LIONS DEN.png': {
    title: 'Daniel in the Lions\' Den',
    description: 'Dramatic painting of the prophet Daniel praying calmly in the lions\' den, surrounded by lions, with divine light streaming from above. Illustrates Yahweh\'s protection of those faithful to His law.',
    topic_tags: ['daniel', 'faith', 'protection', 'lions den', 'prayer', 'persecution'],
    verse_references: ['Daniel 6:16', 'Daniel 6:22', 'Psalm 34:7'],
    type: 'image',
  },
  'topheth-place of burning.jpg': {
    title: 'Topheth — Valley of Hinnom Map',
    description: 'Geographic map showing Topheth (the place of burning) in the Valley of Ben-Hinnom south of Jerusalem. The site of child sacrifice to Molech; became Gehenna — the garbage dump symbol of destruction.',
    topic_tags: ['topheth', 'hinnom', 'gehenna', 'jerusalem', 'geography', 'judgment', 'fire'],
    verse_references: ['Jeremiah 7:31', 'Jeremiah 19:6', '2 Kings 23:10', 'Matthew 5:22'],
    type: 'graphic',
  },
  'Romans 3-20 Knowledge of Sin is Through the Law black.jpg': {
    title: 'Romans 3:20 — Knowledge of Sin Through the Law',
    description: '"Knowledge of sin is through the Law" — Romans 3:20. A scripture graphic showing the foundational role of Torah in identifying sin, on a background of open scripture.',
    topic_tags: ['law', 'sin', 'torah', 'romans', 'knowledge', 'ISA820'],
    verse_references: ['Romans 3:20', 'Romans 7:7', 'Isaiah 8:20'],
    type: 'graphic',
  },
  'imgbin-bible-shield-of-the-trinity-the-triune-god-god-the-father-god-h1n0eWtxwFQ3X27dYymgNC68a.jpg': {
    title: 'Shield of the Trinity — Trinitarian Symbol',
    description: 'Classical Shield of the Trinity (Scutum Fidei) diagram showing the traditional trinitarian relationships: Father, Son, Holy Spirit each "is God" but "is not" each other.',
    topic_tags: ['trinity', 'godhead', 'shield', 'doctrine', 'creed', 'father', 'son'],
    verse_references: ['John 20:17', '1 Corinthians 11:3', 'Deuteronomy 6:4'],
    type: 'graphic',
  },
  'Original 1611 Names for Jesus.jpg': {
    title: '1611 KJV — Original Names for Jesus',
    description: 'Document showing the original 1611 King James Bible\'s use of the name "Iesus" and its Hebrew/Greek roots. Addresses the restoration of the true name of the Messiah.',
    topic_tags: ['name', 'jesus', 'yeshua', 'kjv', 'translation', 'history', 'messiah'],
    verse_references: ['Matthew 1:21', 'Acts 4:12', 'Philippians 2:9'],
    type: 'document',
  },
  'Aramaic Alphabet.jpg': {
    title: 'Aramaic Alphabet Chart',
    description: 'Aramaic alphabet chart showing the script used across the ancient Near East and in portions of Daniel, Ezra, and the New Testament era. Key for understanding Biblical Aramaic texts.',
    topic_tags: ['aramaic', 'alphabet', 'language', 'ancient', 'daniel', 'ezra'],
    verse_references: ['Daniel 2:4', 'Ezra 4:8'],
    type: 'graphic',
  },
  'Cuneiform_evolution_from_archaic_script.jpg': {
    title: 'Cuneiform Script Evolution',
    description: 'Chart showing the evolution of cuneiform writing from archaic Sumerian pictographs to classical cuneiform script, used in Mesopotamia (Babylon, Assyria). Context for understanding Babel and Babylon.',
    topic_tags: ['cuneiform', 'babylon', 'writing', 'ancient', 'mesopotamia', 'babel', 'history'],
    verse_references: ['Genesis 11:1', 'Daniel 1:4'],
    type: 'image',
  },
  'Why-did-people-build-the-tower-of-Babel-1024x585.jpg': {
    title: 'Tower of Babel — Why Was It Built?',
    description: 'Artistic reconstruction of the Tower of Babel showing its ziggurat-style architecture and the people building it. Illustrates the rebellion at Shinar and the dispersion of nations.',
    topic_tags: ['babel', 'tower', 'nimrod', 'dispersion', 'nations', 'genesis', 'judgment'],
    verse_references: ['Genesis 11:1', 'Genesis 11:9', 'Genesis 10:10'],
    type: 'image',
  },
  '1920px-Ziggarat_of_Ur_001.jpg': {
    title: 'Ziggurat of Ur — Abraham\'s City',
    description: 'The Great Ziggurat of Ur in modern Iraq, an ancient Sumerian temple-tower dedicated to the moon god Nanna. This is the type of structure Abraham would have known before his call out of Ur of the Chaldees.',
    topic_tags: ['ur', 'ziggurat', 'abraham', 'babylon', 'mesopotamia', 'moon god', 'chaldees'],
    verse_references: ['Genesis 11:31', 'Genesis 12:1', 'Joshua 24:2'],
    type: 'image',
  },
  'Hinnom Valley and Kidron valley.png': {
    title: 'Hinnom Valley and Kidron Valley — Jerusalem',
    description: 'Diagram showing the two valleys flanking Jerusalem: the Hinnom Valley (Gehenna/Topheth) to the south and the Kidron Valley to the east. Key geographic context for judgment passages.',
    topic_tags: ['hinnom', 'kidron', 'jerusalem', 'gehenna', 'geography', 'judgment', 'topheth'],
    verse_references: ['Jeremiah 7:31', '2 Kings 23:10', 'Matthew 5:22'],
    type: 'graphic',
  },
  'The-Great-Flood.jpg': {
    title: 'The Great Flood — Noah\'s Deluge',
    description: 'Dramatic artistic rendering of the great flood described in Genesis 6-9, showing the deluge of water covering the earth as judgment for the wickedness of mankind.',
    topic_tags: ['flood', 'noah', 'judgment', 'genesis', 'deluge', 'covenant'],
    verse_references: ['Genesis 6:5', 'Genesis 7:11', 'Genesis 8:1', '2 Peter 3:6'],
    type: 'image',
  },
  'The-Noah-Ark.jpg': {
    title: 'Noah\'s Ark — The Ark of Salvation',
    description: 'Artistic depiction of Noah\'s Ark upon the waters of the great flood, representing Yahweh\'s provision of salvation for the righteous remnant.',
    topic_tags: ['noah', 'ark', 'flood', 'salvation', 'covenant', 'genesis'],
    verse_references: ['Genesis 6:14', 'Genesis 8:4', 'Hebrews 11:7', '1 Peter 3:20'],
    type: 'image',
  },
  'king david.jpg': {
    title: 'King David — The Man After Yahweh\'s Heart',
    description: 'Artistic portrayal of King David, Israel\'s greatest king and psalmist, described as "a man after Yahweh\'s own heart". Ancestor of Yehoshua the Messiah.',
    topic_tags: ['david', 'king', 'israel', 'psalms', 'messiah', 'lineage', 'covenant'],
    verse_references: ['1 Samuel 13:14', 'Psalm 23:1', 'Acts 13:22', 'Matthew 1:1'],
    type: 'image',
  },
  'lionofjudah.png': {
    title: 'Lion of Judah — Messianic Symbol',
    description: 'The Lion of Judah, the royal symbol of the tribe of Judah and a messianic title for YAHUSHUA the Messiah. Connects Genesis 49:9 prophecy to Revelation 5:5.',
    topic_tags: ['lion of judah', 'messiah', 'judah', 'tribe', 'revelation', 'son'],
    verse_references: ['Genesis 49:9', 'Revelation 5:5', 'Micah 5:2'],
    type: 'graphic',
  },
  'Debunking the jewish claim that they are the people of the book. CAPTURE.png': {
    title: 'Debunking "People of the Book" Claim',
    description: 'Research screenshot examining historical claims about who constitutes the true "people of the book" — a forensic analysis of identity, covenant, and scripture.',
    topic_tags: ['identity', 'covenant', 'israel', 'people', 'history', 'doctrine'],
    verse_references: ['Romans 9:6', 'Galatians 3:7', 'Romans 2:28'],
    type: 'graphic',
  },
  'Bowing-to-Idol.jpg': {
    title: 'Bowing to Idols — False Worship Warning',
    description: 'Historical image depicting people bowing before an idol or false deity, illustrating the prohibition against idolatry in the Second Commandment.',
    topic_tags: ['idolatry', 'false gods', 'commandments', 'worship', 'warning', 'babylon'],
    verse_references: ['Exodus 20:4', 'Isaiah 46:6', 'Daniel 3:5', 'Revelation 13:15'],
    type: 'image',
  },
  'two-paths-blue-and-red.jpg': {
    title: 'Two Paths — The Narrow and Wide Way',
    description: 'Visual of two diverging paths representing the narrow way (leading to life) and the broad way (leading to destruction). Illustrates Matthew 7:13-14.',
    topic_tags: ['two paths', 'narrow way', 'judgment', 'choice', 'law', 'obedience'],
    verse_references: ['Matthew 7:13', 'Deuteronomy 30:15', 'Jeremiah 21:8', 'Proverbs 14:12'],
    type: 'graphic',
  },
  'spiritual_warfare_by_kevron2001_dcyg56i-pre.jpg': {
    title: 'Spiritual Warfare — The Battle Unseen',
    description: 'Dramatic artwork depicting spiritual warfare, illustrating the invisible battle between light and darkness described in Ephesians 6 and the armor of Yahweh.',
    topic_tags: ['spiritual warfare', 'armor of god', 'angels', 'battle', 'ephesians', 'prayer'],
    verse_references: ['Ephesians 6:12', 'Daniel 10:13', '2 Kings 6:17', 'Revelation 12:7'],
    type: 'image',
  },
  '01-Happy-Sabbath-Isaiah-60-20.png': {
    title: 'Happy Sabbath — Isaiah 60:20',
    description: 'Sabbath greeting image with Isaiah 60:20 — "Your sun shall no longer go down, nor shall your moon withdraw itself; for Yahweh will be your everlasting light." Connects weekly Sabbath to the eternal Sabbath rest.',
    topic_tags: ['sabbath', 'isaiah', 'rest', 'worship', 'light', 'covenant'],
    verse_references: ['Isaiah 60:20', 'Genesis 2:3', 'Exodus 20:8', 'Hebrews 4:9'],
    type: 'graphic',
  },
  'qumran-caves-fb.jpg': {
    title: 'Qumran Caves — Dead Sea Scroll Discovery Site',
    description: 'The caves at Qumran near the Dead Sea where the Dead Sea Scrolls were discovered in 1947. These caves preserved the oldest known manuscript copies of the Hebrew scriptures.',
    topic_tags: ['qumran', 'dead sea scrolls', 'manuscript', 'scripture', 'discovery', 'israel'],
    verse_references: ['Isaiah 8:20'],
    type: 'image',
  },
  'shrine-of-the-book-interior.jpg': {
    title: 'Shrine of the Book — Dead Sea Scrolls Museum',
    description: 'Interior of the Shrine of the Book at the Israel Museum in Jerusalem, housing the Dead Sea Scrolls including the Great Isaiah Scroll. The white dome symbolizes the lids of the clay jars that preserved the scrolls.',
    topic_tags: ['dead sea scrolls', 'scripture', 'museum', 'israel', 'isaiah', 'manuscript'],
    verse_references: ['Isaiah 8:20'],
    type: 'image',
  },
  'Mathew geneology - list.png': {
    title: 'Matthew\'s Genealogy of Yehoshua',
    description: 'The genealogical list from Matthew chapter 1, tracing the lineage of Yehoshua (Jesus) from Abraham through David to Joseph. Establishes the Messianic bloodline and legal claim.',
    topic_tags: ['genealogy', 'matthew', 'messiah', 'david', 'abraham', 'lineage', 'son'],
    verse_references: ['Matthew 1:1', 'Matthew 1:17', 'Luke 3:23', 'Genesis 22:18'],
    type: 'graphic',
  },
  '10-Commandments-01.jpg': {
    title: 'The Ten Commandments — Tablets of Stone',
    description: 'Artistic representation of the Ten Commandments (Decalogue) on stone tablets as given to Moses on Mount Sinai. The foundation of the Law (Torah) that defines sin.',
    topic_tags: ['ten commandments', 'torah', 'law', 'moses', 'sinai', 'sin', 'commandments'],
    verse_references: ['Exodus 20:1', 'Deuteronomy 5:6', 'Romans 3:20', 'James 2:10'],
    type: 'image',
  },
  'Yeshua -wiki.png': {
    title: 'Yeshua — Wikipedia Reference Screenshot',
    description: 'Wikipedia reference showing the Hebrew name Yeshua (ישוע), the shortened form of Yehoshua, used in Second Temple Period texts and the basis for the Aramaic/Greek "Jesus".',
    topic_tags: ['yeshua', 'name', 'jesus', 'hebrew', 'messiah', 'second temple'],
    verse_references: ['Matthew 1:21', 'Luke 1:31', 'Acts 4:12'],
    type: 'graphic',
  },
  'alphabet evolution.jpg': {
    title: 'Alphabet Evolution — Phoenician to Latin',
    description: 'Chart showing the evolution of the alphabet from ancient Phoenician/proto-Sinaitic script through Greek to Latin letters, demonstrating the shared Semitic roots of Western writing.',
    topic_tags: ['alphabet', 'phoenician', 'hebrew', 'language', 'history', 'writing'],
    verse_references: [],
    type: 'graphic',
  },
  'alphabet evolution 2.jpg': {
    title: 'Alphabet Evolution Chart 2',
    description: 'Secondary chart of alphabet evolution showing parallel development of Semitic writing systems, including Hebrew, Aramaic, Arabic, and their relationships to Greek and Latin scripts.',
    topic_tags: ['alphabet', 'semitic', 'hebrew', 'language', 'history', 'writing'],
    verse_references: [],
    type: 'graphic',
  },
  'phonecian Alphabet.png': {
    title: 'Phoenician Alphabet',
    description: 'The Phoenician alphabet — the ancestor of most modern alphabets, derived from Proto-Sinaitic script around 1050 BCE. Shows the parent letters of the Hebrew alephbet.',
    topic_tags: ['phoenician', 'alphabet', 'hebrew', 'ancient', 'writing', 'language'],
    verse_references: [],
    type: 'graphic',
  },
  '2023-08-Nehemiah 8_17 Interlinear-JOSHUA-YESHUA-JEHOSHUA.png': {
    title: 'Nehemiah 8:17 Interlinear — JOSHUA = YESHUA',
    description: 'Interlinear screenshot of Nehemiah 8:17 showing that the name "JOSHUA" (Yehoshua) in Hebrew is the same as "YESHUA" — proving that Jesus\'s real name is Yehoshua/Yeshua.',
    topic_tags: ['yeshua', 'joshua', 'name', 'interlinear', 'nehemiah', 'hebrew', 'messiah'],
    verse_references: ['Nehemiah 8:17', 'Numbers 13:16', 'Matthew 1:21'],
    type: 'graphic',
  },
  'Marduk_and_pet.jpg': {
    title: 'Marduk — Chief God of Babylon',
    description: 'Ancient depiction of Marduk, the chief deity of Babylon, shown with his dragon-serpent Mushussu. Yahweh defeated Marduk symbolically through Israel\'s exile and return, and through Isaiah\'s prophecies against Babylon.',
    topic_tags: ['marduk', 'babylon', 'false gods', 'idolatry', 'dragon', 'ancient', 'mesopotamia'],
    verse_references: ['Isaiah 46:1', 'Jeremiah 50:2', 'Daniel 1:2', 'Revelation 17:5'],
    type: 'image',
  },
  'The_Chaldean_Account_of_Genesis_tree and serpent from babylonian cylinder.png': {
    title: 'Babylonian Cylinder — Tree and Serpent Scene',
    description: 'Ancient Babylonian cylinder seal showing a tree with two seated figures and a serpent, often compared to Genesis 3. Demonstrates Mesopotamian parallels and the historical roots of the Eden narrative.',
    topic_tags: ['babylon', 'serpent', 'tree', 'genesis', 'eden', 'ancient', 'cylinder seal'],
    verse_references: ['Genesis 3:1', 'Genesis 3:6', 'Revelation 12:9'],
    type: 'image',
  },
  'Bel encountering the Dragon; from Babylonian cylinder.png': {
    title: 'Bel (Marduk) and the Dragon — Babylonian Cylinder',
    description: 'Babylonian cylinder seal depicting Bel (Marduk) battling the dragon Tiamat. This creation myth parallels and contrasts with Yahweh\'s true creation account in Genesis 1.',
    topic_tags: ['bel', 'marduk', 'dragon', 'babylon', 'creation', 'mythology', 'genesis'],
    verse_references: ['Genesis 1:1', 'Isaiah 51:9', 'Revelation 12:9', 'Job 26:12'],
    type: 'image',
  },
  'Merodach or Bel armed for the Conflict with the Dragon from Assyrian Cylinder.png': {
    title: 'Merodach/Bel Armed Against the Dragon',
    description: 'Assyrian cylinder seal showing Merodach (Marduk/Bel) armed for battle against the dragon. Historical context for understanding Babylonian religion and its contrast with Yahweh\'s sovereignty.',
    topic_tags: ['marduk', 'bel', 'merodach', 'dragon', 'babylon', 'assyria', 'false gods'],
    verse_references: ['Jeremiah 50:2', 'Isaiah 46:1', 'Daniel 1:2'],
    type: 'image',
  },
  'jasper-sardine stone.png': {
    title: 'Jasper and Sardine Stone — Revelation 4',
    description: 'Image depicting jasper (clear/diamond-like) and sardine (red/carnelian) stones, referenced in Revelation 4:3 describing the appearance of Yahweh on His throne.',
    topic_tags: ['revelation', 'throne', 'jasper', 'sardine', 'father', 'stones'],
    verse_references: ['Revelation 4:3', 'Revelation 21:11', 'Exodus 28:17'],
    type: 'image',
  },
  'jabal_al_lawz_1.jpg': {
    title: 'Jabal al-Lawz — Mount Sinai in Arabia',
    description: 'Photograph of Jabal al-Lawz (Mountain of the Almonds) in northwestern Saudi Arabia, proposed as the true location of Mount Sinai referenced in Galatians 4:25. Its blackened summit matches the fire of Yahweh\'s descent.',
    topic_tags: ['sinai', 'mount sinai', 'arabia', 'moses', 'torah', 'exodus', 'geography'],
    verse_references: ['Exodus 19:18', 'Galatians 4:25', '1 Kings 19:8', 'Deuteronomy 4:11'],
    type: 'image',
  },
  'other names for nimrod, semmiramis and tamuuz.png': {
    title: 'Nimrod, Semiramis, and Tammuz — Babylonian Trinity Roots',
    description: 'Research graphic showing the many names by which Nimrod, Semiramis, and Tammuz were worshipped across ancient cultures — the origin of false trinitarian worship and the mystery Babylon religion.',
    topic_tags: ['nimrod', 'semiramis', 'tammuz', 'babylon', 'trinity', 'false gods', 'mystery babylon'],
    verse_references: ['Genesis 10:8', 'Ezekiel 8:14', 'Revelation 17:5', '1 Corinthians 10:20'],
    type: 'graphic',
  },
  'Sufyanid_dynasty_genealogy.png': {
    title: 'Sufyanid Dynasty Genealogy',
    description: 'Genealogical chart of the Sufyanid dynasty (first Umayyad caliphs), providing historical context for the political powers that arose after the first century and their relationship to biblical prophecy.',
    topic_tags: ['history', 'genealogy', 'prophecy', 'nations', 'islam'],
    verse_references: ['Daniel 11:40', 'Revelation 17:12'],
    type: 'graphic',
  },
};

// Default metadata for unrecognized files
function defaultMeta(filename) {
  const name = basename(filename, extname(filename))
    .replace(/[-_+]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
  const ext = extname(filename).toLowerCase();
  const type = ['.jpg', '.jpeg', '.png', '.gif', '.webp'].includes(ext) ? 'image' : 'document';
  return {
    title: name.slice(0, 255),
    description: `Biblical research asset: ${name}`,
    topic_tags: [],
    verse_references: [],
    type,
  };
}

// ── MAIN ─────────────────────────────────────────────────────────────────────
console.log('\n╔═══════════════════════════════════════════╗');
console.log('║   ISA820 — Vault Asset Uploader            ║');
console.log('╚═══════════════════════════════════════════╝\n');

// Ensure vault bucket exists
const { error: bucketErr } = await supabase.storage.createBucket('vault', { public: true });
if (bucketErr && !bucketErr.message.includes('already exists')) {
  console.warn('  Bucket warning:', bucketErr.message);
} else {
  console.log('  Storage bucket: vault ✓');
}

// Gather all image files
const IMAGE_EXTS = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.svg'];
const DOC_EXTS   = ['.pdf'];
const ALL_EXTS   = [...IMAGE_EXTS, ...DOC_EXTS];

function gatherFiles(dir, exts) {
  if (!existsSync(dir)) return [];
  return readdirSync(dir)
    .filter(f => exts.includes(extname(f).toLowerCase()))
    .map(f => ({ name: f, path: join(dir, f) }));
}

const imageFiles = gatherFiles(IMAGES_DIR, IMAGE_EXTS);
const docFiles   = gatherFiles(DOCS_DIR, DOC_EXTS);
const allFiles   = [...imageFiles, ...docFiles];

console.log(`  Found ${imageFiles.length} images + ${docFiles.length} documents = ${allFiles.length} total\n`);

let uploaded = 0;
let skipped  = 0;
let failed   = 0;

for (const file of allFiles) {
  const meta = METADATA[file.name] || defaultMeta(file.name);
  // Sanitize filename for storage: remove non-ASCII, replace spaces with underscores
  const safeFilename = file.name
    .replace(/[^\x00-\x7F]/g, '')   // strip non-ASCII (Hebrew chars etc.)
    .replace(/\s+/g, '_')            // spaces → underscores
    .replace(/[()]/g, '')            // remove parens
    .replace(/__+/g, '_')            // collapse multiple underscores
    .trim();
  const storagePath = `vault/${safeFilename}`;
  const mimeType = mimeLookup(file.name) || 'application/octet-stream';

  process.stdout.write(`  Uploading: ${file.name.slice(0, 50).padEnd(52)} `);

  try {
    const fileBuffer = readFileSync(file.path);

    // Upload to Supabase Storage
    const { error: uploadErr } = await supabase.storage
      .from('vault')
      .upload(storagePath, fileBuffer, {
        contentType: mimeType,
        upsert: true,
      });

    if (uploadErr) {
      console.log(`SKIP (${uploadErr.message.slice(0, 40)})`);
      skipped++;
      continue;
    }

    // Get public URL
    const { data: { publicUrl } } = supabase.storage
      .from('vault')
      .getPublicUrl(storagePath);

    // Check if already inserted (by storage_path)
    const { data: existing } = await supabase
      .from('media_assets')
      .select('id')
      .eq('storage_path', storagePath)
      .maybeSingle();

    if (existing) {
      console.log('already in DB');
      skipped++;
      continue;
    }

    // Insert into media_assets
    const isImage = IMAGE_EXTS.includes(extname(file.name).toLowerCase());

    const { error: dbErr } = await supabase
      .from('media_assets')
      .insert({
        type:             meta.type || (isImage ? 'image' : 'document'),
        title:            meta.title,
        description:      meta.description,
        url:              publicUrl,
        storage_path:     storagePath,
        youtube_id:       null,
        topic_tags:       meta.topic_tags,
        verse_references: meta.verse_references,
      });

    if (dbErr) {
      console.log(`DB ERR: ${dbErr.message.slice(0, 40)}`);
      failed++;
    } else {
      console.log('✓');
      uploaded++;
    }

  } catch (err) {
    console.log(`ERROR: ${err.message.slice(0, 40)}`);
    failed++;
  }
}

console.log(`\n${'─'.repeat(55)}`);
console.log(`  Uploaded : ${uploaded}`);
console.log(`  Skipped  : ${skipped}`);
console.log(`  Failed   : ${failed}`);
console.log(`\n✅ Vault upload complete.\n`);
console.log('Next: The UI will now show contextual images via media_assets.\n');
