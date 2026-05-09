-- =============================================
-- ISA820 Supabase SQL Migration Script
-- =============================================
-- Copy and paste this into Supabase SQL Editor
-- to create the required database schema
-- =============================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =============================================
-- TABLE: verses
-- Stores Bible verses with speaker attribution
-- =============================================
CREATE TABLE IF NOT EXISTS verses (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    book VARCHAR(50) NOT NULL,
    chapter INTEGER NOT NULL,
    verse INTEGER NOT NULL,
    text TEXT NOT NULL,
    translation VARCHAR(20) NOT NULL DEFAULT 'KJV',
    speaker VARCHAR(20) CHECK (speaker IN ('FATHER', 'SON', 'ANGEL', 'UNKNOWN')),
    strongs_numbers TEXT[] DEFAULT '{}',
    pillar_tags TEXT[] DEFAULT '{}',
    translations_jsonb JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(book, chapter, verse, translation)
);

-- Indexes for verses
CREATE INDEX IF NOT EXISTS idx_verses_book_chapter ON verses(book, chapter);
CREATE INDEX IF NOT EXISTS idx_verses_translation ON verses(translation);
CREATE INDEX IF NOT EXISTS idx_verses_speaker ON verses(speaker);
CREATE INDEX IF NOT EXISTS idx_verses_strongs ON verses USING GIN(strongs_numbers);
CREATE INDEX IF NOT EXISTS idx_verses_text_search ON verses USING GIN(to_tsvector('english', text));

-- =============================================
-- TABLE: strongs_lexicon
-- Strong's Concordance lexicon data
-- =============================================
CREATE TABLE IF NOT EXISTS strongs_lexicon (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    strongs_id VARCHAR(10) NOT NULL UNIQUE,
    word VARCHAR(100) NOT NULL,
    transliteration VARCHAR(100) NOT NULL,
    definition TEXT NOT NULL,
    part_of_speech VARCHAR(30),
    origin_language VARCHAR(10) CHECK (origin_language IN ('hebrew', 'greek', 'aramaic')),
    pronunciation_guide VARCHAR(100),
    usage_count INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index for strongs_lexicon
CREATE INDEX IF NOT EXISTS idx_strongs_lexicon_id ON strongs_lexicon(strongs_id);
CREATE INDEX IF NOT EXISTS idx_strongs_lexicon_word ON strongs_lexicon USING GIN(to_tsvector('english', word));

-- =============================================
-- TABLE: strongs_usage
-- Tracks word usage across manuscripts
-- =============================================
CREATE TABLE IF NOT EXISTS strongs_usage (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    strongs_id VARCHAR(10) NOT NULL REFERENCES strongs_lexicon(strongs_id),
    verse_id UUID NOT NULL REFERENCES verses(id) ON DELETE CASCADE,
    word VARCHAR(100) NOT NULL,
    context TEXT,
    similarity_score DECIMAL(3,2) DEFAULT 1.00,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index for strongs_usage
CREATE INDEX IF NOT EXISTS idx_strongs_usage_strongs ON strongs_usage(strongs_id);
CREATE INDEX IF NOT EXISTS idx_strongs_usage_verse ON strongs_usage(verse_id);

-- =============================================
-- TABLE: knowledge_base
-- Spiritual Understandings & AI Rebuttals
-- =============================================
CREATE TABLE IF NOT EXISTS knowledge_base (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    topic VARCHAR(100) NOT NULL UNIQUE,
    title VARCHAR(255) NOT NULL,
    content TEXT NOT NULL,
    supporting_verses TEXT[] DEFAULT '{}',
    confidence_level VARCHAR(10) CHECK (confidence_level IN ('HIGH', 'MEDIUM', 'LOW')) DEFAULT 'MEDIUM',
    related_topics TEXT[] DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index for knowledge_base
CREATE INDEX IF NOT EXISTS idx_knowledge_topic ON knowledge_base(topic);
CREATE INDEX IF NOT EXISTS idx_knowledge_related ON knowledge_base USING GIN(related_topics);

-- =============================================
-- TABLE: media_assets
-- Vault storage for videos, images, documents
-- =============================================
CREATE TABLE IF NOT EXISTS media_assets (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    type VARCHAR(20) CHECK (type IN ('video', 'image', 'graphic', 'document')) NOT NULL,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    url TEXT NOT NULL,
    storage_path VARCHAR(500),
    youtube_id VARCHAR(20),
    topic_tags TEXT[] DEFAULT '{}',
    verse_references TEXT[] DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index for media_assets
CREATE INDEX IF NOT EXISTS idx_media_type ON media_assets(type);
CREATE INDEX IF NOT EXISTS idx_media_topics ON media_assets USING GIN(topic_tags);
CREATE INDEX IF NOT EXISTS idx_media_verses ON media_assets USING GIN(verse_references);
CREATE INDEX IF NOT EXISTS idx_media_youtube ON media_assets(youtube_id) WHERE youtube_id IS NOT NULL;

-- =============================================
-- TABLE: topic_mappings
-- Links topics to media and verses
-- =============================================
CREATE TABLE IF NOT EXISTS topic_mappings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    topic VARCHAR(100) NOT NULL,
    media_id UUID REFERENCES media_assets(id) ON DELETE CASCADE,
    verse_reference VARCHAR(50),
    chapter_reference VARCHAR(50),
    display_order INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(topic, media_id)
);

-- Index for topic_mappings
CREATE INDEX IF NOT EXISTS idx_topic_mapping_topic ON topic_mappings(topic);
CREATE INDEX IF NOT EXISTS idx_topic_mapping_media ON topic_mappings(media_id);

-- =============================================
-- TABLE: standard_documents
-- Standard Documents & Research Files
-- =============================================
CREATE TABLE IF NOT EXISTS standard_documents (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title VARCHAR(255) NOT NULL,
    description TEXT,
    file_path VARCHAR(500) NOT NULL,
    file_type VARCHAR(20) NOT NULL,
    file_size BIGINT DEFAULT 0,
    category VARCHAR(20) CHECK (category IN ('standard', 'graphic', 'research')) DEFAULT 'standard',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index for standard_documents
CREATE INDEX IF NOT EXISTS idx_docs_category ON standard_documents(category);

-- =============================================
-- ROW LEVEL SECURITY (RLS)
-- Enable RLS for all tables
-- =============================================

ALTER TABLE verses ENABLE ROW LEVEL SECURITY;
ALTER TABLE strongs_lexicon ENABLE ROW LEVEL SECURITY;
ALTER TABLE strongs_usage ENABLE ROW LEVEL SECURITY;
ALTER TABLE knowledge_base ENABLE ROW LEVEL SECURITY;
ALTER TABLE media_assets ENABLE ROW LEVEL SECURITY;
ALTER TABLE topic_mappings ENABLE ROW LEVEL SECURITY;
ALTER TABLE standard_documents ENABLE ROW LEVEL SECURITY;

-- =============================================
-- RLS POLICIES  (drop first so re-runs are safe)
-- =============================================

DROP POLICY IF EXISTS "Public read verses"           ON verses;
DROP POLICY IF EXISTS "Public read strongs"          ON strongs_lexicon;
DROP POLICY IF EXISTS "Public read strongs_usage"    ON strongs_usage;
DROP POLICY IF EXISTS "Public read knowledge"        ON knowledge_base;
DROP POLICY IF EXISTS "Public read media"            ON media_assets;
DROP POLICY IF EXISTS "Authenticated insert media"   ON media_assets;
DROP POLICY IF EXISTS "Authenticated update media"   ON media_assets;
DROP POLICY IF EXISTS "Authenticated delete media"   ON media_assets;
DROP POLICY IF EXISTS "Public read mappings"         ON topic_mappings;
DROP POLICY IF EXISTS "Authenticated write mappings" ON topic_mappings;
DROP POLICY IF EXISTS "Public read documents"        ON standard_documents;
DROP POLICY IF EXISTS "Authenticated write documents" ON standard_documents;
-- Also drop any write policies from previous import attempts
DROP POLICY IF EXISTS "Anon write verses"            ON verses;
DROP POLICY IF EXISTS "Anon write strongs"           ON strongs_lexicon;
DROP POLICY IF EXISTS "Anon write strongs_usage"     ON strongs_usage;
DROP POLICY IF EXISTS "Anon write knowledge"         ON knowledge_base;
DROP POLICY IF EXISTS "Anon write media"             ON media_assets;
DROP POLICY IF EXISTS "Anon write mappings"          ON topic_mappings;
DROP POLICY IF EXISTS "Anon write documents"         ON standard_documents;

-- Public read on all tables
CREATE POLICY "Public read verses"        ON verses           FOR SELECT USING (true);
CREATE POLICY "Public read strongs"       ON strongs_lexicon  FOR SELECT USING (true);
CREATE POLICY "Public read strongs_usage" ON strongs_usage    FOR SELECT USING (true);
CREATE POLICY "Public read knowledge"     ON knowledge_base   FOR SELECT USING (true);
CREATE POLICY "Public read media"         ON media_assets     FOR SELECT USING (true);
CREATE POLICY "Public read mappings"      ON topic_mappings   FOR SELECT USING (true);
CREATE POLICY "Public read documents"     ON standard_documents FOR SELECT USING (true);

-- Open write access for data import (anon + authenticated)
CREATE POLICY "Anon write verses"         ON verses           FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Anon write strongs"        ON strongs_lexicon  FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Anon write strongs_usage"  ON strongs_usage    FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Anon write knowledge"      ON knowledge_base   FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Anon write media"          ON media_assets     FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Anon write mappings"       ON topic_mappings   FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Anon write documents"      ON standard_documents FOR ALL USING (true) WITH CHECK (true);

-- =============================================
-- STORAGE BUCKETS
-- Create storage buckets via Dashboard
-- =============================================
-- Note: Run this in Supabase Dashboard > Storage
-- 
-- 1. Create bucket "vault" (public)
-- 2. Add CORS policy for web access
-- 
-- Or use this SQL (if enabled):
-- INSERT INTO storage.buckets (id, name, public) 
-- VALUES ('vault', 'vault', true);

-- =============================================
-- SAMPLE DATA: Seed spiritual understandings
-- =============================================

INSERT INTO knowledge_base (topic, title, content, supporting_verses, confidence_level, related_topics) VALUES
(
    'soul',
    'The Nature of Soul (Nephesh)',
    'A soul (nephesh) is not an immortal spirit trapped in a body. Scripture reveals that a soul IS a living being - the combination of body (basar) and breath (neshamah). When breath returns to Elohim, the soul ceases to exist.',
    ARRAY['Genesis 2:7', 'Ezekiel 18:4', 'Matthew 10:28'],
    'HIGH',
    ARRAY['spirit', 'breath', 'nephesh', 'immortality']
),
(
    'trinity',
    'The Trinity Doctrine vs Scripture',
    'The Trinity is a post-biblical invention (councils of Nicea 325 AD, Constantinople 381 AD). The Father is never called "God the Son." YAHUSHUA prayed to the Father, called His Father "my God," and stated the Father is "greater than all."',
    ARRAY['John 20:17', '1 Corinthians 11:3', 'John 14:28'],
    'HIGH',
    ARRAY['godhead', 'oneness', 'deity of Christ', 'holy spirit']
),
(
    'alpha-omega',
    'Alpha and Omega - Father Only',
    'The Father declares "I am the Alpha and Omega" in Revelation 1:8. In 21:6, He says "I am the Alpha and Omega." The Son calls himself the "First and Last" (Rev 1:17, 2:8, 22:13) - a DIFFERENT title. Confusion of these titles leads to the false doctrine that the Son is the Father.',
    ARRAY['Revelation 1:8', 'Revelation 21:6', 'Revelation 1:17', 'Revelation 2:8'],
    'HIGH',
    ARRAY['father', 'son', 'names of God', 'revelation']
),
(
    'oneness',
    'Yahweh is One - Absolute Unity',
    'Deuteronomy 6:4 is the Shema - the foundational confession of Israel. "Yahweh is one" (echad) means absolute unity, not a complex trinitarian math problem. There is ONE Being called Yahweh.',
    ARRAY['Deuteronomy 6:4', 'Isaiah 43:10', 'Isaiah 44:6'],
    'HIGH',
    ARRAY['godhead', 'unity', 'yhwh', 'monotheism']
)
ON CONFLICT (topic) DO NOTHING;

-- =============================================
-- SAMPLE DATA: Seed Strong's lexicon entries
-- =============================================

INSERT INTO strongs_lexicon (strongs_id, word, transliteration, definition, part_of_speech, origin_language) VALUES
('H430', 'Elohim', 'elohim', 'God, mighty ones, rulers, judges', 'noun - masculine plural', 'hebrew'),
('H259', 'Echad', 'echad', 'One, united, first, together', 'adjective', 'hebrew'),
('H5315', 'Nephesh', 'nephesh', 'Soul, self, life, person, mind', 'noun - feminine', 'hebrew'),
('H5397', 'Neshamah', 'neshamah', 'Breath, spirit, inspiration', 'noun - feminine', 'hebrew'),
('H1254', 'Bara', 'bara', 'To create, make, form', 'verb', 'hebrew'),
('G5207', 'Pneuma', 'pneuma', 'Spirit, wind, breath', 'noun - neuter', 'greek'),
('G5590', 'Psuche', 'psuche', 'Soul, life, self', 'noun - feminine', 'greek'),
('G1', 'Alpha', 'Alpha', 'First letter of Greek alphabet', 'noun', 'greek'),
('G5598', 'Omega', 'Omega', 'Last letter of Greek alphabet', 'noun', 'greek')
ON CONFLICT (strongs_id) DO NOTHING;

-- =============================================
-- SAMPLE DATA: Seed verses with speaker attribution
-- =============================================

INSERT INTO verses (book, chapter, verse, text, translation, speaker, strongs_numbers, pillar_tags) VALUES
('Isaiah', 8, 20, 'To the law and to the testimony! If they do not speak according to this word, it is because there is no light in them.', 'TAHOT', NULL, ARRAY['H8451', 'H5715'], ARRAY['ISA820']),
('Deuteronomy', 6, 4, 'Hear, O Israel: Yahweh our Elohim, Yahweh is one.', 'TAHOT', NULL, ARRAY['H8085', 'H259'], ARRAY['DEUT64']),
('Revelation', 1, 8, 'I am the Alpha and the Omega, says Yahweh Elohim, who is and who was and who is to come, the Almighty.', 'KJV', 'FATHER', ARRAY['G1', 'G5598', 'H430'], ARRAY['ISA820']),
('Revelation', 1, 17, 'And when I saw Him, I fell at His feet as dead. But He laid His right hand upon me, saying to me, Do not fear. I am the First and the Last, and the living One. And I became dead, and behold, I am living forever and ever. And I have the keys of death and of Hades.', 'TBESG', 'SON', ARRAY['G4413', 'G2078'], ARRAY['ISA820']),
('Genesis', 1, 1, 'In the beginning Elohim created the heavens and the earth.', 'TAHOT', NULL, ARRAY['H430', 'H1254'], ARRAY['NATURE']),
('Genesis', 2, 7, 'And Yahweh Elohim formed man of the dust of the ground, and breathed into his nostrils the breath of life; and man became a living soul.', 'TAHOT', NULL, ARRAY['H3335', 'H5301', 'H5315'], ARRAY['NATURE'])
ON CONFLICT (book, chapter, verse, translation) DO NOTHING;

-- =============================================
-- FUNCTION: Update timestamp trigger
-- =============================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply triggers (drop first so re-runs are safe)
DROP TRIGGER IF EXISTS update_verses_updated_at    ON verses;
DROP TRIGGER IF EXISTS update_knowledge_updated_at ON knowledge_base;
DROP TRIGGER IF EXISTS update_media_updated_at     ON media_assets;
DROP TRIGGER IF EXISTS update_documents_updated_at ON standard_documents;

CREATE TRIGGER update_verses_updated_at
    BEFORE UPDATE ON verses
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_knowledge_updated_at
    BEFORE UPDATE ON knowledge_base
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_media_updated_at
    BEFORE UPDATE ON media_assets
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_documents_updated_at
    BEFORE UPDATE ON standard_documents
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =============================================
-- COMPLETE!
-- =============================================
