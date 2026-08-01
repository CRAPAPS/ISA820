// ISA820 — Manuscript Context Layer
//
// Builds the evidentiary block handed to the Forensic Analyst for a given verse.
//
// The core sources are TAHOT (Translators Amalgamated Hebrew OT) and TAGNT
// (Translators Amalgamated Greek NT). Everything else — English translations,
// brief lexicons — is measured against these. Before this module existed the
// analyst received only a list of bare Strong's IDs carrying the UI placeholder
// string "Click to load definition", so it had no manuscript evidence at all and
// reconstructed verses from its own training data.
//
// NOTE ON COLUMN SEMANTICS — the two tables are NOT symmetrical:
//
//   tahot_words                       tagnt_words
//   ───────────────────────────────   ─────────────────────────────────────────
//   hebrew      original script       greek        original script + translit
//   translit    pronunciation         translit     ENGLISH GLOSS (not a translit)
//   translation ENGLISH GLOSS         translation  "G3588=T-ASM" strongs+morph
//   d_strongs   Strong's tags         d_strongs    "ὁ=the/this/who" lexical form
//   grammar     MORPHOLOGY code       grammar      MANUSCRIPT WITNESS list
//
// Treating them uniformly silently produces nonsense, so each has its own mapper.

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

const NT_BOOKS = new Set([
  'Matthew', 'Mark', 'Luke', 'John', 'Acts', 'Romans',
  '1 Corinthians', '2 Corinthians', 'Galatians', 'Ephesians', 'Philippians',
  'Colossians', '1 Thessalonians', '2 Thessalonians', '1 Timothy', '2 Timothy',
  'Titus', 'Philemon', 'Hebrews', 'James', '1 Peter', '2 Peter',
  '1 John', '2 John', '3 John', 'Jude', 'Revelation',
]);

interface TahotRow {
  ref: string;
  verse: number;
  word_num: number;
  text_type: string | null;
  hebrew: string | null;
  transliteration: string | null;
  translation: string | null;
  d_strongs: string | null;
  root_d_strong: string | null;
  grammar: string | null;
  expanded_strongs: string | null;
  proper_name_id: string | null;
}

interface TagntRow {
  ref: string;
  verse: number;
  word_num: number;
  text_type: string | null;
  greek: string | null;
  transliteration: string | null;
  translation: string | null;
  d_strongs: string | null;
  root_d_strong: string | null;
  grammar: string | null;
  expanded_strongs: string | null;
  proper_name_id: string | null;
}

interface ProperName {
  unified_name: string;
  u_strong: string | null;
  description: string | null;
  is_divine: boolean | null;
  speaker_type: string | null;
  speaker_notes: string | null;
}

export interface ManuscriptContext {
  /** Formatted evidence block for the prompt, or null when no rows exist. */
  block: string | null;
  /** True when manuscript rows were found for this reference. */
  grounded: boolean;
  source: 'TAHOT' | 'TAGNT';
  wordCount: number;
}

async function rest<T>(path: string): Promise<T[]> {
  if (!SUPABASE_URL || !SUPABASE_KEY) return [];
  try {
    const res = await fetch(`${SUPABASE_URL}/rest/v1/${path}`, {
      headers: { apikey: SUPABASE_KEY, Authorization: `Bearer ${SUPABASE_KEY}` },
      next: { revalidate: 3600 },
    });
    if (!res.ok) return [];
    return (await res.json()) as T[];
  } catch {
    return [];
  }
}

/**
 * The original-language reference is carried inside `ref` where versification
 * diverges, e.g. "Psa.51.0(51.1)#01". Surfacing it matters: an analysis that
 * cites a Hebrew verse number without noting the divergence cites the wrong verse.
 */
function extractDivergentRef(ref: string): string | null {
  const m = ref.match(/^([^.]+)\.(\d+)\.(\d+)\((\d+)\.(\d+)\)#/);
  return m ? `${m[1]} ${m[4]}:${m[5]}` : null;
}

function formatTahotWord(w: TahotRow): string {
  const tt = w.text_type?.trim();
  const parts = [
    `  [${w.word_num}] ${w.hebrew || '—'}`,
    w.transliteration ? `      pronunciation : ${w.transliteration}` : null,
    w.translation ? `      gloss         : ${w.translation}` : null,
    w.d_strongs ? `      Strong's      : ${w.d_strongs}` : null,
    w.grammar ? `      morphology    : ${w.grammar}` : null,
    w.expanded_strongs ? `      lexical       : ${w.expanded_strongs}` : null,
    tt && tt !== 'L' ? `      text type     : ${tt} (non-Leningrad reading)` : null,
  ];
  return parts.filter(Boolean).join('\n');
}

/**
 * TAGNT packs Strong's and morphology into one field as "G3588=T-ASM".
 * Split them so the morphology reads as its own datum.
 */
function splitTagntTranslation(v: string | null): { strongs: string | null; morph: string | null } {
  if (!v) return { strongs: null, morph: null };
  const i = v.indexOf('=');
  if (i === -1) return { strongs: v.trim(), morph: null };
  return { strongs: v.slice(0, i).trim(), morph: v.slice(i + 1).trim() || null };
}

function formatTagntWord(w: TagntRow): string {
  const { strongs, morph } = splitTagntTranslation(w.translation);
  const parts = [
    `  [${w.word_num}] ${w.greek || '—'}`,
    w.transliteration ? `      gloss         : ${w.transliteration}` : null,
    strongs ? `      Strong's      : ${strongs}` : null,
    morph ? `      morphology    : ${morph}` : null,
    w.d_strongs ? `      lexical form  : ${w.d_strongs}` : null,
    w.grammar ? `      attested in   : ${w.grammar}` : null,
  ];
  return parts.filter(Boolean).join('\n');
}

const MORPHOLOGY_KEY = `
Morphology code key — these are standard scholarly parsing codes, not free text:
  Hebrew (OpenScriptures/ETCBC; leading H = Hebrew, A = Aramaic)
    Part of speech : N noun, V verb, A adjective, P pronoun, R preposition,
                     C conjunction, T particle/article, S suffix, D adverb
    Noun subcodes  : Nc common / Np proper, then gender (m/f/b), number
                     (s singular / p plural / d dual), state (a absolute /
                     c construct / d determined)
    Verb subcodes  : stem (q qal, n niphal, p piel, h hiphil, t hitpael, …),
                     then aspect (p perfect, i imperfect, v imperative,
                     r participle, a/c infinitive), then person-gender-number
    Worked example : HNcmpa  = Hebrew noun, common, masculine, PLURAL, absolute
                     HVqp3ms = Hebrew verb, qal, perfect, 3rd masculine SINGULAR
  Greek (standard NT parsing codes)
    N noun, V verb, T article, A adjective, P pronoun, PREP preposition,
    CONJ conjunction. Nominals carry case-number-gender: N nominative,
    G genitive, D dative, A accusative, V vocative; S singular, P plural;
    M masculine, F feminine, N neuter.
    Worked example : N-NSM   = noun, nominative singular masculine
                     T-NSM   = article, nominative singular masculine
                     V-IAI-3S = verb, imperfect active indicative, 3rd singular

The presence or absence of the article (T-) is itself manuscript evidence and
must be reported wherever it bears on the claim under examination. Where a word
is attested in some manuscript families but not others, the "attested in" line
is the textual-critical record and must be cited before any claim rests on that
word.`.trim();

/**
 * Build the manuscript evidence block for one verse.
 *
 * Returns `grounded: false` when no rows exist for the reference. The caller
 * MUST surface that explicitly rather than omitting the block — an absent block
 * reads as "no constraint" and the model fills the gap from training data,
 * which is the exact failure this layer exists to prevent.
 */
export async function fetchManuscriptContext(
  book: string,
  chapter: number,
  verse: number,
): Promise<ManuscriptContext> {
  const isNT = NT_BOOKS.has(book);
  const table = isNT ? 'tagnt_words' : 'tahot_words';
  const source = isNT ? 'TAGNT' : 'TAHOT';
  const scriptCol = isNT ? 'greek' : 'hebrew';

  const cols = [
    'ref', 'verse', 'word_num', 'text_type', scriptCol, 'transliteration',
    'translation', 'd_strongs', 'root_d_strong', 'grammar', 'expanded_strongs',
    'proper_name_id',
  ].join(',');

  // Verse 0 carries the superscription, which English Bibles fold into verse 1
  // (e.g. the ascription of Psalm 51). Fetch it alongside verse 1 so the
  // superscription is never invisible to the analysis.
  const verseFilter = verse === 1 ? 'verse=in.(0,1)' : `verse=eq.${verse}`;
  const query =
    `${table}?select=${cols}` +
    `&book_name=eq.${encodeURIComponent(book)}` +
    `&chapter=eq.${chapter}&${verseFilter}` +
    `&order=verse,word_num&limit=400`;

  const rows = await rest<TahotRow & TagntRow>(query);

  if (!rows.length) {
    return { block: null, grounded: false, source, wordCount: 0 };
  }

  const divergent = rows.map(r => extractDivergentRef(r.ref)).find(Boolean);
  // Split on the numeric verse, not a substring of `ref`. A divergent ref carries
  // two chapter.verse pairs ("Job.41.1(40.25)#01"), so unanchored matching on
  // `.${chapter}.0` is only accidentally correct and would misfile rows in books
  // that have not been spot-checked.
  const superscription = rows.filter(r => r.verse === 0);
  const main = rows.filter(r => r.verse !== 0);

  const sections: string[] = [];

  sections.push(
    `### MANUSCRIPT EVIDENCE — ${source}` +
    (isNT
      ? ' (Translators Amalgamated Greek New Testament)'
      : ' (Translators Amalgamated Hebrew Old Testament)'),
  );
  sections.push(
    `Reference: ${book} ${chapter}:${verse} — ${rows.length} word rows.\n` +
    'This is the primary evidence. It outranks every English rendering below.',
  );

  if (divergent) {
    sections.push(
      `⚠ VERSIFICATION DIVERGENCE — this English reference corresponds to ` +
      `${divergent} in the original numbering. Cite both when referring to it.`,
    );
  }

  if (superscription.length) {
    sections.push(
      'SUPERSCRIPTION (verse 0 in the original; English Bibles fold this into verse 1):\n' +
      superscription.map(w => (isNT ? formatTagntWord(w) : formatTahotWord(w))).join('\n'),
    );
  }

  if (main.length) {
    sections.push(
      'WORD-BY-WORD:\n' +
      main.map(w => (isNT ? formatTagntWord(w) : formatTahotWord(w))).join('\n'),
    );
  }

  // Proper names carry the platform's own speaker determinations (TIPNR),
  // which are decisive for the Voice Signature section.
  const nameIds = [...new Set(rows.map(r => r.proper_name_id).filter(Boolean))] as string[];
  if (nameIds.length) {
    const inList = nameIds.map(n => `"${n}"`).join(',');
    const names = await rest<ProperName>(
      'proper_names?select=unified_name,u_strong,description,is_divine,speaker_type,speaker_notes' +
      `&tipnr_id=in.(${encodeURIComponent(inList)})`,
    );
    if (names.length) {
      sections.push(
        'PROPER NAMES IN THIS VERSE (TIPNR):\n' +
        names.map(n =>
          `  ${n.unified_name}${n.u_strong ? ` (${n.u_strong})` : ''}` +
          `${n.is_divine ? ' — DIVINE NAME' : ''}\n` +
          (n.description ? `      ${n.description}\n` : '') +
          (n.speaker_type ? `      speaker: ${n.speaker_type}\n` : '') +
          (n.speaker_notes ? `      notes: ${n.speaker_notes}` : ''),
        ).join('\n'),
      );
    }
  }

  sections.push(MORPHOLOGY_KEY);

  return {
    block: sections.join('\n\n'),
    grounded: true,
    source,
    wordCount: rows.length,
  };
}
