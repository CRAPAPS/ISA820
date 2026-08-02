// ISA820 — Strong's ID resolution
//
// Four ID formats exist in this database and they do not agree with each other:
//
//   verses.strongs_numbers / word_strongs (KJV) : G746     unpadded, no suffix
//   verses.strongs_numbers (TBESG/TAHOT)        : G0746    padded, no suffix
//   tahot_words.root_d_strong                   : H5921A   padded + suffix
//   strongs_lexicon.strongs_id                  : G0032G   padded + suffix
//
// Looking up the raw reference therefore misses constantly. Measured by
// scripts/audit-strongs-resolution.mjs across all 19,880 distinct referenced ids:
//
//   73.2%  exact match
//    6.6%  found only after zero-padding        (H559  -> H0559)
//   11.8%  found only via a disambiguated sense (G0032 -> G0032G)
//    8.5%  absent from the lexicon under any form — a real data gap
//
// So 26.8% of lookups returned no definition, and 18.4% of that was pure
// formatting. That is why ἄγγελος / G32 in Revelation 2:1 came back blank: the
// lexicon holds G0032G, and nothing translated G32 into it.
//
// Every lexicon lookup should go through here, so the formats converge in exactly
// one place instead of each call site inventing its own guess.

import { supabase } from './supabase';

export interface StrongsEntry {
  strongs_id: string;
  word: string;
  transliteration: string;
  definition: string;
  part_of_speech?: string | null;
}

/**
 * Candidate lexicon keys for a referenced id, most exact first.
 *
 * "G32" yields ["G32", "G0032"]; the caller then widens to the G0032* family if
 * neither hits. Order matters — an exactly-stored id must always beat a padded
 * guess.
 */
export function strongsCandidates(raw: string): string[] {
  const id = String(raw || '').trim().toUpperCase();
  const m = id.match(/^([HGA])(\d+)([A-Z]?)$/);
  if (!m) return id ? [id] : [];

  const [, prefix, digits, suffix] = m;
  const padded = prefix + digits.padStart(4, '0') + suffix;
  return padded === id ? [id] : [id, padded];
}

/** The padded, suffix-stripped base — the family key, e.g. "G32" -> "G0032". */
export function strongsBase(raw: string): string | null {
  const m = String(raw || '').trim().toUpperCase().match(/^([HGA])(\d+)/);
  return m ? m[1] + m[2].padStart(4, '0') : null;
}

/** Guards against `like 'G0032%'` also catching longer numbers like G00321. */
const IS_SENSE = /^[HGA]\d{4}[A-Z]?$/;

/**
 * Resolve one reference to its lexicon entry.
 *
 * Falls back through exact -> zero-padded -> any disambiguated sense of the same
 * base number. Where several senses exist they are MERGED rather than one being
 * picked arbitrarily: silently choosing a sense would tell the reader a specific
 * meaning applies when the data does not say so, and this UI has no way to show
 * that a choice was made.
 *
 * Returns null only when the number is genuinely absent from the lexicon.
 */
export async function resolveStrongs(raw: string): Promise<StrongsEntry | null> {
  const candidates = strongsCandidates(raw);
  if (!candidates.length) return null;

  const { data: exact } = await supabase
    .from('strongs_lexicon')
    .select('strongs_id,word,transliteration,definition,part_of_speech')
    .in('strongs_id', candidates)
    .limit(1);

  if (exact?.length) return exact[0] as StrongsEntry;

  const base = strongsBase(raw);
  if (!base) return null;

  const { data: family } = await supabase
    .from('strongs_lexicon')
    .select('strongs_id,word,transliteration,definition,part_of_speech')
    .like('strongs_id', `${base}%`)
    .order('strongs_id');

  const senses = ((family || []) as StrongsEntry[]).filter(e => IS_SENSE.test(e.strongs_id));
  if (!senses.length) return null;
  if (senses.length === 1) return senses[0];

  return {
    strongs_id: senses.map(s => s.strongs_id).join(' / '),
    word: senses[0].word,
    transliteration: senses[0].transliteration,
    part_of_speech: senses[0].part_of_speech,
    definition: senses.map(s => `[${s.strongs_id}] ${s.definition}`).join('\n\n'),
  };
}

/**
 * Batch form for the interlinear row, which renders many words at once.
 * Keyed by the ORIGINAL reference, so callers look results up by what they asked
 * for rather than by whatever the lexicon happens to store.
 */
export async function resolveStrongsBatch(rawIds: string[]): Promise<Record<string, StrongsEntry>> {
  const unique = [...new Set(rawIds.map(r => String(r || '').trim().toUpperCase()).filter(Boolean))];
  if (!unique.length) return {};

  const keys = new Set<string>();
  for (const id of unique) strongsCandidates(id).forEach(c => keys.add(c));

  const { data } = await supabase
    .from('strongs_lexicon')
    .select('strongs_id,word,transliteration,definition,part_of_speech')
    .in('strongs_id', [...keys]);

  const byId = new Map(((data || []) as StrongsEntry[]).map(e => [e.strongs_id, e]));
  const out: Record<string, StrongsEntry> = {};
  const unmatched: string[] = [];

  for (const id of unique) {
    const hit = strongsCandidates(id).map(c => byId.get(c)).find(Boolean);
    if (hit) out[id] = hit;
    else unmatched.push(id);
  }

  // Second round for ids that exist only as disambiguated senses.
  if (unmatched.length) {
    const bases = [...new Set(unmatched.map(strongsBase).filter(Boolean))] as string[];
    if (bases.length) {
      const { data: family } = await supabase
        .from('strongs_lexicon')
        .select('strongs_id,word,transliteration,definition,part_of_speech')
        .or(bases.map(b => `strongs_id.like.${b}*`).join(','));

      for (const id of unmatched) {
        const base = strongsBase(id);
        const sense = ((family || []) as StrongsEntry[]).find(
          e => IS_SENSE.test(e.strongs_id) && strongsBase(e.strongs_id) === base,
        );
        if (sense) out[id] = sense;
      }
    }
  }

  return out;
}
