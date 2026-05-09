-- =============================================
-- ISA820 Migration 002 - Word-Level & TIPNR
-- =============================================
-- Extends the base schema with:
--   1. bible_books       - canonical book order & metadata
--   2. tahot_words       - word-per-line Hebrew (TAHOT source)
--   3. tagnt_words       - word-per-line Greek  (TAGNT source)
--   4. proper_names      - TIPNR unique individuals & places
--   5. proper_name_occurrences - every verse ref per proper name
-- =============================================

-- =============================================
-- TABLE: bible_books
-- Canonical ordering for OT + NT books
-- =============================================
CREATE TABLE IF NOT EXISTS bible_books (
    id             SERIAL PRIMARY KEY,
    name           VARCHAR(50)  NOT NULL UNIQUE,
    abbreviation   VARCHAR(10)  NOT NULL,
    testament      VARCHAR(3)   NOT NULL CHECK (testament IN ('OT', 'NT')),
    chapter_count  INTEGER      NOT NULL DEFAULT 1,
    verse_count    INTEGER      NOT NULL DEFAULT 0,
    display_order  INTEGER      NOT NULL UNIQUE
);

INSERT INTO bible_books (name, abbreviation, testament, chapter_count, display_order) VALUES
-- Old Testament
('Genesis',       'Gen',  'OT', 50,  1),
('Exodus',        'Exo',  'OT', 40,  2),
('Leviticus',     'Lev',  'OT', 27,  3),
('Numbers',       'Num',  'OT', 36,  4),
('Deuteronomy',   'Deu',  'OT', 34,  5),
('Joshua',        'Jos',  'OT', 24,  6),
('Judges',        'Jdg',  'OT', 21,  7),
('Ruth',          'Rut',  'OT', 4,   8),
('1 Samuel',      '1Sa',  'OT', 31,  9),
('2 Samuel',      '2Sa',  'OT', 24,  10),
('1 Kings',       '1Ki',  'OT', 22,  11),
('2 Kings',       '2Ki',  'OT', 25,  12),
('1 Chronicles',  '1Ch',  'OT', 29,  13),
('2 Chronicles',  '2Ch',  'OT', 36,  14),
('Ezra',          'Ezr',  'OT', 10,  15),
('Nehemiah',      'Neh',  'OT', 13,  16),
('Esther',        'Est',  'OT', 10,  17),
('Job',           'Job',  'OT', 42,  18),
('Psalms',        'Psa',  'OT', 150, 19),
('Proverbs',      'Pro',  'OT', 31,  20),
('Ecclesiastes',  'Ecc',  'OT', 12,  21),
('Song of Songs', 'Sng',  'OT', 8,   22),
('Isaiah',        'Isa',  'OT', 66,  23),
('Jeremiah',      'Jer',  'OT', 52,  24),
('Lamentations',  'Lam',  'OT', 5,   25),
('Ezekiel',       'Ezk',  'OT', 48,  26),
('Daniel',        'Dan',  'OT', 12,  27),
('Hosea',         'Hos',  'OT', 14,  28),
('Joel',          'Joe',  'OT', 3,   29),
('Amos',          'Amo',  'OT', 9,   30),
('Obadiah',       'Oba',  'OT', 1,   31),
('Jonah',         'Jon',  'OT', 4,   32),
('Micah',         'Mic',  'OT', 7,   33),
('Nahum',         'Nah',  'OT', 3,   34),
('Habakkuk',      'Hab',  'OT', 3,   35),
('Zephaniah',     'Zep',  'OT', 3,   36),
('Haggai',        'Hag',  'OT', 2,   37),
('Zechariah',     'Zec',  'OT', 14,  38),
('Malachi',       'Mal',  'OT', 4,   39),
-- New Testament
('Matthew',       'Mat',  'NT', 28,  40),
('Mark',          'Mar',  'NT', 16,  41),
('Luke',          'Luk',  'NT', 24,  42),
('John',          'Jhn',  'NT', 21,  43),
('Acts',          'Act',  'NT', 28,  44),
('Romans',        'Rom',  'NT', 16,  45),
('1 Corinthians', '1Co',  'NT', 16,  46),
('2 Corinthians', '2Co',  'NT', 13,  47),
('Galatians',     'Gal',  'NT', 6,   48),
('Ephesians',     'Eph',  'NT', 6,   49),
('Philippians',   'Php',  'NT', 4,   50),
('Colossians',    'Col',  'NT', 4,   51),
('1 Thessalonians','1Th', 'NT', 5,   52),
('2 Thessalonians','2Th', 'NT', 3,   53),
('1 Timothy',     '1Ti',  'NT', 6,   54),
('2 Timothy',     '2Ti',  'NT', 4,   55),
('Titus',         'Tit',  'NT', 3,   56),
('Philemon',      'Phm',  'NT', 1,   57),
('Hebrews',       'Heb',  'NT', 13,  58),
('James',         'Jas',  'NT', 5,   59),
('1 Peter',       '1Pe',  'NT', 5,   60),
('2 Peter',       '2Pe',  'NT', 3,   61),
('1 John',        '1Jn',  'NT', 5,   62),
('2 John',        '2Jn',  'NT', 1,   63),
('3 John',        '3Jn',  'NT', 1,   64),
('Jude',          'Jud',  'NT', 1,   65),
('Revelation',    'Rev',  'NT', 22,  66)
ON CONFLICT (name) DO NOTHING;

-- =============================================
-- TABLE: tahot_words
-- Word-per-line data from TAHOT source files
-- (TAHOT Gen-Deu, Jos-Est, Job-Sng, Isa-Mal)
--
-- Source format:
--   Gen.1.1#01=L  ???/?????????  be./re.Shit  in/ beginning
--                 H9003/{H7225G}  HR/Ncfsa  [variants]  [expanded]
-- =============================================
CREATE TABLE IF NOT EXISTS tahot_words (
    id               UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),

    -- Reference fields
    ref              VARCHAR(30) NOT NULL,   -- e.g. "Gen.1.1#01"
    book_abbr        VARCHAR(10) NOT NULL,   -- e.g. "Gen"
    book_name        VARCHAR(50) NOT NULL,   -- e.g. "Genesis"
    chapter          INTEGER     NOT NULL,
    verse            INTEGER     NOT NULL,
    word_num         INTEGER     NOT NULL,   -- 1-based word position in verse

    -- Text type flag: L=Leningrad, Q=Qere, K=Ketiv, R=Restored, X=LXX-based
    text_type        CHAR(2)     NOT NULL DEFAULT 'L',

    -- Manuscript text
    hebrew           TEXT        NOT NULL,
    transliteration  VARCHAR(300),
    translation      VARCHAR(500),           -- English gloss (/ separates prefix/root/suffix)

    -- Strong's data
    d_strongs        VARCHAR(300),           -- disambiguated, e.g. H9003/{H7225G}
    root_d_strong    VARCHAR(50),            -- extracted root, e.g. H7225G
    grammar          VARCHAR(150),           -- ETCBC morphology codes
    meaning_variant  TEXT,
    spelling_variant TEXT,
    root_instance    VARCHAR(100),           -- sStrong+Instance
    alt_strongs      VARCHAR(200),

    -- Expanded Strong tag (contains proper name IDs in ?Person@ref notation)
    expanded_strongs TEXT,

    -- Parsed proper name ID (when word is a proper name)
    -- e.g. "Abraham@Gen.11.26-1Pe" or "Yahweh@Exo.3.14-Rev"
    proper_name_id   VARCHAR(200),

    -- Link back to the verse row (populated after verses table is seeded)
    verse_row_id     UUID REFERENCES verses(id) ON DELETE SET NULL,

    created_at       TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_tahot_ref
    ON tahot_words(ref, text_type);

CREATE INDEX IF NOT EXISTS idx_tahot_book_ch_vs
    ON tahot_words(book_name, chapter, verse);

CREATE INDEX IF NOT EXISTS idx_tahot_root_strongs
    ON tahot_words(root_d_strong);

CREATE INDEX IF NOT EXISTS idx_tahot_proper_name
    ON tahot_words(proper_name_id)
    WHERE proper_name_id IS NOT NULL;

-- Full-text on Hebrew
CREATE INDEX IF NOT EXISTS idx_tahot_heb_fts
    ON tahot_words USING GIN(to_tsvector('simple', hebrew));

-- =============================================
-- TABLE: tagnt_words
-- Word-per-line data from TAGNT source files
-- (TAGNT Mat-Jhn, Act-Rev)
-- =============================================
CREATE TABLE IF NOT EXISTS tagnt_words (
    id               UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),

    -- Reference fields
    ref              VARCHAR(30) NOT NULL,   -- e.g. "Mat.1.1#01"
    book_abbr        VARCHAR(10) NOT NULL,
    book_name        VARCHAR(50) NOT NULL,
    chapter          INTEGER     NOT NULL,
    verse            INTEGER     NOT NULL,
    word_num         INTEGER     NOT NULL,

    -- Source manuscript flag
    text_type        VARCHAR(10) NOT NULL DEFAULT 'NA28', -- NA28/TR/etc

    -- Manuscript text
    greek            TEXT        NOT NULL,
    transliteration  VARCHAR(300),
    translation      VARCHAR(500),

    -- Strong's data
    d_strongs        VARCHAR(300),
    root_d_strong    VARCHAR(50),
    grammar          VARCHAR(150),
    meaning_variant  TEXT,
    expanded_strongs TEXT,

    -- Parsed proper name ID
    proper_name_id   VARCHAR(200),

    -- Link back to verses row
    verse_row_id     UUID REFERENCES verses(id) ON DELETE SET NULL,

    created_at       TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_tagnt_ref
    ON tagnt_words(ref, text_type);

CREATE INDEX IF NOT EXISTS idx_tagnt_book_ch_vs
    ON tagnt_words(book_name, chapter, verse);

CREATE INDEX IF NOT EXISTS idx_tagnt_root_strongs
    ON tagnt_words(root_d_strong);

CREATE INDEX IF NOT EXISTS idx_tagnt_proper_name
    ON tagnt_words(proper_name_id)
    WHERE proper_name_id IS NOT NULL;

-- =============================================
-- TABLE: proper_names
-- TIPNR - unique individuals, locations, other
--
-- Each record = ONE unique entity in all of Scripture.
-- Source: TIPNR file, records separated by "$"
--
-- TIPNR ID format: "Abraham@Gen.11.26-1Pe"
--   before "@" = most common ESV name
--   after  "@" = first/anchor reference
--   "-Book"    = last book they appear in
-- =============================================
CREATE TABLE IF NOT EXISTS proper_names (
    id               UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),

    -- Primary TIPNR identifier (unique per individual)
    tipnr_id         VARCHAR(300) NOT NULL UNIQUE,

    -- The unified/most-common English name
    unified_name     VARCHAR(150) NOT NULL,

    -- uStrong: the Strong's number for this proper name
    u_strong         VARCHAR(20),

    -- Category from TIPNR
    category         VARCHAR(10)  NOT NULL
        CHECK (category IN ('PERSON', 'PLACE', 'OTHER')),

    -- Human-readable description from TIPNR
    description      TEXT,

    -- First and last verse references
    first_ref        VARCHAR(30),
    last_ref         VARCHAR(30),

    -- All alternative name forms (Named, Spelled, Combined, Translated, etc.)
    alt_names        TEXT[]       DEFAULT '{}',

    -- All Strong's IDs associated with this entity
    all_strongs      TEXT[]       DEFAULT '{}',

    -- ==========================================
    -- ISA820 SPEAKER LINK
    -- For divine persons: maps this name to a
    -- voice color (Gold/Crimson/Silver) used in
    -- the Bible Reader's highlighting system.
    -- ==========================================
    is_divine        BOOLEAN      NOT NULL DEFAULT FALSE,
    speaker_type     VARCHAR(20)
        CHECK (speaker_type IN ('FATHER', 'SON', 'ANGEL', 'UNKNOWN')),
    -- speaker_notes explains the theological basis for the assignment
    speaker_notes    TEXT,

    created_at       TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_pn_unified_name
    ON proper_names(unified_name);

CREATE INDEX IF NOT EXISTS idx_pn_u_strong
    ON proper_names(u_strong)
    WHERE u_strong IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_pn_divine
    ON proper_names(speaker_type)
    WHERE is_divine = TRUE;

CREATE INDEX IF NOT EXISTS idx_pn_category
    ON proper_names(category);

-- =============================================
-- TABLE: proper_name_occurrences
-- Every verse reference for every TIPNR entry.
-- This is the JOIN table that connects proper
-- names to specific verses and word positions.
-- =============================================
CREATE TABLE IF NOT EXISTS proper_name_occurrences (
    id               UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),

    tipnr_id         VARCHAR(300) NOT NULL
        REFERENCES proper_names(tipnr_id) ON DELETE CASCADE,

    -- Verse location
    book_abbr        VARCHAR(10)  NOT NULL,
    book_name        VARCHAR(50)  NOT NULL,
    chapter          INTEGER      NOT NULL,
    verse            INTEGER      NOT NULL,

    -- Specific word position within the verse (if known)
    word_ref         VARCHAR(30),            -- e.g. "Gen.1.1#03"

    -- The exact name form used at this occurrence (may differ from unified_name)
    form_name        VARCHAR(150),

    -- Link to the verse row
    verse_row_id     UUID REFERENCES verses(id) ON DELETE SET NULL,

    -- Link to the word row (Hebrew or Greek)
    tahot_word_id    UUID REFERENCES tahot_words(id)  ON DELETE SET NULL,
    tagnt_word_id    UUID REFERENCES tagnt_words(id)  ON DELETE SET NULL,

    created_at       TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_pno_tipnr
    ON proper_name_occurrences(tipnr_id);

CREATE INDEX IF NOT EXISTS idx_pno_book_ch_vs
    ON proper_name_occurrences(book_name, chapter, verse);

CREATE INDEX IF NOT EXISTS idx_pno_verse_row
    ON proper_name_occurrences(verse_row_id)
    WHERE verse_row_id IS NOT NULL;

-- =============================================
-- RLS for new tables
-- =============================================
ALTER TABLE bible_books              ENABLE ROW LEVEL SECURITY;
ALTER TABLE tahot_words              ENABLE ROW LEVEL SECURITY;
ALTER TABLE tagnt_words              ENABLE ROW LEVEL SECURITY;
ALTER TABLE proper_names             ENABLE ROW LEVEL SECURITY;
ALTER TABLE proper_name_occurrences  ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public read bible_books"   ON bible_books              FOR SELECT USING (true);
CREATE POLICY "Public read tahot_words"   ON tahot_words              FOR SELECT USING (true);
CREATE POLICY "Public read tagnt_words"   ON tagnt_words              FOR SELECT USING (true);
CREATE POLICY "Public read proper_names"  ON proper_names             FOR SELECT USING (true);
CREATE POLICY "Public read pn_occ"        ON proper_name_occurrences  FOR SELECT USING (true);

-- Open write access for import scripts
DROP POLICY IF EXISTS "Auth write tahot"  ON tahot_words;
DROP POLICY IF EXISTS "Auth write tagnt"  ON tagnt_words;
DROP POLICY IF EXISTS "Auth write pn"     ON proper_names;
DROP POLICY IF EXISTS "Auth write pno"    ON proper_name_occurrences;
DROP POLICY IF EXISTS "Anon write bible_books"  ON bible_books;
DROP POLICY IF EXISTS "Anon write tahot_words"  ON tahot_words;
DROP POLICY IF EXISTS "Anon write tagnt_words"  ON tagnt_words;
DROP POLICY IF EXISTS "Anon write proper_names" ON proper_names;
DROP POLICY IF EXISTS "Anon write pno"          ON proper_name_occurrences;

CREATE POLICY "Anon write bible_books"  ON bible_books             FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Anon write tahot_words"  ON tahot_words             FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Anon write tagnt_words"  ON tagnt_words             FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Anon write proper_names" ON proper_names            FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Anon write pno"          ON proper_name_occurrences FOR ALL USING (true) WITH CHECK (true);

-- =============================================
-- SEED: Divine Proper Names (TIPNR ? Speaker)
-- These are the ISA820 "Voice Signature" anchors.
-- The Gold/Crimson highlighting in BibleReader.tsx
-- is driven by verse.speaker which is sourced from
-- this table via the proper_name_occurrences JOIN.
-- =============================================

INSERT INTO proper_names
  (tipnr_id, unified_name, u_strong, category, description,
   first_ref, is_divine, speaker_type, speaker_notes)
VALUES
(
  'Yahweh@Exo.3.14-Rev',
  'Yahweh',
  'H3068',
  'PERSON',
  'The personal name of the Father - YHWH (YHWH). The self-existent one who declares "I AM THAT I AM." Title: Alpha and Omega (Rev 1:8, 21:6).',
  'Gen.2.4',
  TRUE,
  'FATHER',
  'Yahweh is the Father. Rev 1:8 - the Alpha and Omega title belongs exclusively to the Father. Isa 44:6 declares "I am the first and I am the last; besides me there is no God" - spoken by YHWH in first person. Gold highlighting.'
),
(
  'Elohim@Gen.1.1-Rev',
  'Elohim',
  'H0430',
  'PERSON',
  'The plural title used for the Father (Yahweh Elohim). Genesis 1:1 "Elohim created." The supreme divine title.',
  'Gen.1.1',
  TRUE,
  'FATHER',
  'When Elohim is used as a title for YHWH (Yahweh Elohim), it refers to the Father. Contextual disambiguation required for passages where Elohim may refer to other divine beings or judges.'
),
(
  'YAHUSHUA@Mat.1.1-Rev',
  'YAHUSHUA',
  'G2424',
  'PERSON',
  'The Messiah - the Son of Yahweh. Name means "Yahweh saves." His titles: First and Last (Rev 1:17), Son of Man, Son of God.',
  'Mat.1.1',
  TRUE,
  'SON',
  'YAHUSHUA is the Son. Rev 1:17 - the Son speaks "I am the First and the Last." Distinct from Father''s "Alpha and Omega." John 20:17 - the Son calls the Father "my God." Crimson highlighting.'
),
(
  'Jesus@Mat.1.1-Rev',
  'Jesus',
  'G2424',
  'PERSON',
  'Greek/English form of YAHUSHUA. Same individual - the Messiah, Son of Yahweh.',
  'Mat.1.1',
  TRUE,
  'SON',
  'Alternate name form for YAHUSHUA the Messiah. Same speaker_type = SON. Crimson highlighting.'
),
(
  'Gabriel@Dan.8.16-Luk',
  'Gabriel',
  'H1403',
  'PERSON',
  'The archangel Gabriel - messenger of Yahweh. Appears in Daniel and to Mary in Luke 1.',
  'Dan.8.16',
  TRUE,
  'ANGEL',
  'Gabriel is an angel (malak). Silver highlighting. His words carry messenger-level authority, not divine first-person authority.'
),
(
  'Michael@Dan.10.13-Rev',
  'Michael',
  'H4317',
  'PERSON',
  'The archangel Michael - the chief prince, described as Israel''s guardian.',
  'Dan.10.13',
  TRUE,
  'ANGEL',
  'Michael is an archangel. Silver highlighting.'
)
ON CONFLICT (tipnr_id) DO NOTHING;

-- =============================================
-- HELPER VIEW: verse_speaker_map
-- Joins verses to divine proper names to resolve
-- the speaker for any verse that contains divine
-- first-person speech. The UI can query this
-- view to apply Gold/Crimson/Silver highlights.
-- =============================================
CREATE OR REPLACE VIEW verse_speaker_map AS
SELECT
    v.id             AS verse_id,
    v.book,
    v.chapter,
    v.verse,
    v.translation,
    v.speaker        AS manual_speaker,      -- hand-curated speaker label
    pn.speaker_type  AS name_speaker,        -- speaker inferred from proper name occurrence
    pn.unified_name  AS speaker_name,
    COALESCE(v.speaker, pn.speaker_type)     AS resolved_speaker
FROM verses v
LEFT JOIN proper_name_occurrences pno
    ON  pno.verse_row_id = v.id
LEFT JOIN proper_names pn
    ON  pno.tipnr_id = pn.tipnr_id
    AND pn.is_divine = TRUE
    AND pn.speaker_type IS NOT NULL;

-- =============================================
-- MIGRATION COMPLETE
-- =============================================
-- Next steps:
--   1. Run 001_initial_schema.sql (if not done)
--   2. Run this file (002_word_level_and_tipnr.sql)
--   3. Run the Python parser scripts to import:
--        SA_MASTER_VAULT/01_Bible_Raw/Hebrew/TAHOT *.txt
--        SA_MASTER_VAULT/01_Bible_Raw/Greek/Source_Text/TAGNT *.txt
--        SA_MASTER_VAULT/02_Lexicons_and_Maps/TIPNR *.txt
--   4. Populate strongs_lexicon from TBESH + TBESG files
--   5. Wire BibleReader.tsx to scriptureService instead of SAMPLE_VERSES
-- =============================================
