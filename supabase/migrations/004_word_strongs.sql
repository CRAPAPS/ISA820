-- Add word-level Strong's token data to verses table
-- Each token: { t: "word text", s: "H7225" }
-- Enables inline clickable Strong's numbers in the Bible reader

ALTER TABLE verses ADD COLUMN IF NOT EXISTS word_strongs JSONB;

CREATE INDEX IF NOT EXISTS idx_verses_word_strongs
  ON verses USING GIN (word_strongs);
