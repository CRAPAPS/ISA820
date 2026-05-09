-- =============================================
-- ISA820 Migration 003 - Link Occurrences
-- =============================================
-- Run AFTER the data import scripts complete.
-- Links proper_name_occurrences to verse rows
-- and creates the RPC function used by parse-tipnr.
-- =============================================

-- =============================================
-- FUNCTION: link_proper_name_occurrences
-- Called by parse-tipnr.mjs after import
-- =============================================
CREATE OR REPLACE FUNCTION link_proper_name_occurrences()
RETURNS void AS $$
BEGIN
  UPDATE proper_name_occurrences pno
  SET verse_row_id = v.id
  FROM verses v
  WHERE v.book    = pno.book_name
    AND v.chapter = pno.chapter
    AND v.verse   = pno.verse
    AND pno.verse_row_id IS NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =============================================
-- FUNCTION: link_tahot_word_verse_ids
-- Links tahot_words back to their verse rows
-- =============================================
CREATE OR REPLACE FUNCTION link_tahot_word_verse_ids()
RETURNS void AS $$
BEGIN
  UPDATE tahot_words tw
  SET verse_row_id = v.id
  FROM verses v
  WHERE v.book      = tw.book_name
    AND v.chapter   = tw.chapter
    AND v.verse     = tw.verse
    AND v.translation = 'TAHOT'
    AND tw.verse_row_id IS NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =============================================
-- FUNCTION: link_tagnt_word_verse_ids
-- =============================================
CREATE OR REPLACE FUNCTION link_tagnt_word_verse_ids()
RETURNS void AS $$
BEGIN
  UPDATE tagnt_words tgw
  SET verse_row_id = v.id
  FROM verses v
  WHERE v.book      = tgw.book_name
    AND v.chapter   = tgw.chapter
    AND v.verse     = tgw.verse
    AND v.translation = 'TBESG'
    AND tgw.verse_row_id IS NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =============================================
-- FUNCTION: resolve_verse_speakers
-- Sets verse.speaker based on proper name
-- occurrences. Only applies when verse.speaker
-- is currently NULL and a divine name appears.
--
-- Priority: FATHER > SON > ANGEL
-- This is a STARTING POINT - editorial review
-- required to confirm speaker assignments.
-- =============================================
CREATE OR REPLACE FUNCTION resolve_verse_speakers()
RETURNS TABLE(updated_count INTEGER) AS $$
DECLARE
  cnt INTEGER;
BEGIN
  -- Assign FATHER speaker first (highest priority)
  UPDATE verses v
  SET speaker = 'FATHER'
  FROM proper_name_occurrences pno
  JOIN proper_names pn ON pno.tipnr_id = pn.tipnr_id
  WHERE pno.verse_row_id = v.id
    AND pn.speaker_type  = 'FATHER'
    AND pn.is_divine     = TRUE
    AND v.speaker IS NULL;

  GET DIAGNOSTICS cnt = ROW_COUNT;
  RAISE NOTICE 'FATHER assignments: %', cnt;

  -- Assign SON (only if not already assigned)
  UPDATE verses v
  SET speaker = 'SON'
  FROM proper_name_occurrences pno
  JOIN proper_names pn ON pno.tipnr_id = pn.tipnr_id
  WHERE pno.verse_row_id = v.id
    AND pn.speaker_type  = 'SON'
    AND pn.is_divine     = TRUE
    AND v.speaker IS NULL;

  GET DIAGNOSTICS cnt = ROW_COUNT;
  RAISE NOTICE 'SON assignments: %', cnt;

  -- Assign ANGEL (only if not already assigned)
  UPDATE verses v
  SET speaker = 'ANGEL'
  FROM proper_name_occurrences pno
  JOIN proper_names pn ON pno.tipnr_id = pn.tipnr_id
  WHERE pno.verse_row_id = v.id
    AND pn.speaker_type  = 'ANGEL'
    AND pn.is_divine     = TRUE
    AND v.speaker IS NULL;

  GET DIAGNOSTICS cnt = ROW_COUNT;
  RAISE NOTICE 'ANGEL assignments: %', cnt;

  RETURN QUERY SELECT cnt;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =============================================
-- FUNCTION: update_strongs_usage_counts
-- Recalculates usage_count in strongs_lexicon
-- based on actual tahot_words + tagnt_words data
-- =============================================
CREATE OR REPLACE FUNCTION update_strongs_usage_counts()
RETURNS void AS $$
BEGIN
  -- Hebrew counts from TAHOT
  UPDATE strongs_lexicon sl
  SET usage_count = counts.cnt
  FROM (
    SELECT root_d_strong AS strongs_id, COUNT(*) AS cnt
    FROM tahot_words
    WHERE root_d_strong IS NOT NULL
      AND text_type IN ('L', 'Q')
    GROUP BY root_d_strong
  ) counts
  WHERE sl.strongs_id = counts.strongs_id;

  -- Greek counts from TAGNT
  UPDATE strongs_lexicon sl
  SET usage_count = COALESCE(sl.usage_count, 0) + counts.cnt
  FROM (
    SELECT root_d_strong AS strongs_id, COUNT(*) AS cnt
    FROM tagnt_words
    WHERE root_d_strong IS NOT NULL
    GROUP BY root_d_strong
  ) counts
  WHERE sl.strongs_id = counts.strongs_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =============================================
-- GRANT execute to service_role
-- =============================================
GRANT EXECUTE ON FUNCTION link_proper_name_occurrences()  TO service_role;
GRANT EXECUTE ON FUNCTION link_tahot_word_verse_ids()      TO service_role;
GRANT EXECUTE ON FUNCTION link_tagnt_word_verse_ids()      TO service_role;
GRANT EXECUTE ON FUNCTION resolve_verse_speakers()         TO service_role;
GRANT EXECUTE ON FUNCTION update_strongs_usage_counts()    TO service_role;

-- =============================================
-- RUN: Execute all link operations
-- =============================================
-- Uncomment and run after import scripts complete:

-- SELECT link_tahot_word_verse_ids();
-- SELECT link_tagnt_word_verse_ids();
-- SELECT link_proper_name_occurrences();
-- SELECT * FROM resolve_verse_speakers();
-- SELECT update_strongs_usage_counts();

-- =============================================
-- VERIFICATION QUERIES
-- =============================================
-- Check speaker distribution after resolve:
-- SELECT speaker, COUNT(*) FROM verses GROUP BY speaker ORDER BY 2 DESC;

-- Check proper names linked to verses:
-- SELECT pn.unified_name, pn.speaker_type, COUNT(*) as verse_count
-- FROM proper_name_occurrences pno
-- JOIN proper_names pn ON pno.tipnr_id = pn.tipnr_id
-- WHERE pn.is_divine = TRUE
-- GROUP BY pn.unified_name, pn.speaker_type
-- ORDER BY verse_count DESC;

-- =============================================
-- COMPLETE
-- =============================================
