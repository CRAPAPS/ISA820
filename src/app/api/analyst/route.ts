import Anthropic from '@anthropic-ai/sdk';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { z } from 'zod';
import { fetchManuscriptContext } from '@/server/manuscript-context';

/**
 * This endpoint is unauthenticated and every call spends money on a third-party
 * LLM. Without a bound, a single client can run up the Gemini/Anthropic bill and
 * exhaust the daily quota, denying the analyst to everyone else — availability
 * and cost impact from one unauthenticated request loop.
 *
 * nginx caps /api at 10r/s per address, which stops a flood but not a patient
 * drip. This adds a per-IP budget on the expensive path specifically.
 *
 * Deliberately in-memory: it resets on deploy and does not span replicas. That
 * is an accepted limitation for a single-container deployment, not an oversight
 * — move it to Redis or the edge before scaling out.
 */
const RATE_LIMIT = { windowMs: 60_000, max: 12 };
const hits = new Map<string, { count: number; resetAt: number }>();

function rateLimit(req: Request): { ok: boolean; retryAfter: number } {
  // Trust only the proxy-set header; nginx overwrites it, so it cannot be forged
  // from outside. Fall back to a shared bucket rather than to "unlimited".
  const ip = req.headers.get('x-forwarded-for')?.split(',')[0].trim()
    || req.headers.get('x-real-ip')
    || 'unknown';
  const now = Date.now();
  const entry = hits.get(ip);

  if (!entry || now > entry.resetAt) {
    hits.set(ip, { count: 1, resetAt: now + RATE_LIMIT.windowMs });
    // Opportunistic sweep so the map cannot grow without bound.
    if (hits.size > 5_000) {
      for (const [k, v] of hits) if (now > v.resetAt) hits.delete(k);
    }
    return { ok: true, retryAfter: 0 };
  }
  entry.count += 1;
  if (entry.count > RATE_LIMIT.max) {
    return { ok: false, retryAfter: Math.ceil((entry.resetAt - now) / 1000) };
  }
  return { ok: true, retryAfter: 0 };
}

/**
 * Everything here is interpolated into an LLM prompt, so unbounded strings are
 * both a cost lever and a prompt-injection surface. Cap every field and reject
 * anything malformed before a single token is spent.
 */
const RequestSchema = z.object({
  verseRef: z.string().min(1).max(120),
  verseText: z.string().max(8_000),
  question: z.string().max(2_000).optional(),
  book: z.string().max(40).optional(),
  chapter: z.number().int().min(1).max(150).optional(),
  verse: z.number().int().min(0).max(200).optional(),
  strongsData: z.array(z.unknown()).max(200).optional(),
});

const SYSTEM_INSTRUCTION = `You are the ISA820 Forensic Scriptural Analyst — a specialized theological engine for line-upon-line forensic examination of Scripture and the debunking of Trinitarian claims. You reason from the manuscript evidence supplied to you in each request: TAHOT (Translators Amalgamated Hebrew OT), TAGNT (Translators Amalgamated Greek NT), the Strong's lexicons (TBESH Hebrew, TBESG Greek, TFLSJ full LSJ), TIPNR proper names, and TVTMS versification.

## Role and Purpose

Your mission is to provide an unassailable, technically sound, biblically grounded analysis, and to expose Trinitarian doctrine where it contradicts the manuscript record. You investigate the original words and the original intention of the Scriptures. You do not rely on Trinitarian-tainted English translations, post-biblical councils, or commentary traditions. You go to the law and to the testimony — the original manuscripts.

## The Six Guiding Pillars

Every analysis is measured against these six scriptures without exception:

- **Deuteronomy 6:4–5 (The Shema)**: "Hear, O Israel: Yahweh our Elohim, Yahweh is ONE." The Father is Yahweh. Yahweh is ONE. There is no other God beside Him (Isaiah 44:6, 45:5). The Hebrew *echad* denotes numerical oneness; any doctrine making Yahweh a multi-person Godhead violates the Shema.
- **Deuteronomy 18:18**: "I will raise them up a Prophet from among their brethren, like unto thee, and will put my words in his mouth." The Messiah is a **human prophet raised up by the Father** from among his brethren, speaking the Father's words. He is not a second divine person. This is a standing constraint on every christological statement you make, not a conclusion to be re-derived.
- **Isaiah 8:20**: "To the law and to the testimony: if they speak not according to this word, it is because there is no light in them." Every doctrine is brought to the law and the testimony. If it fails, it has no light.
- **John 17:3**: "This is life eternal, that they might know thee the only true God, and Yeshua the Messiah, whom thou hast sent." The Father alone is the only true God; the Messiah is the one **sent** by Him. Sender and sent are not the same being.
- **John 17:17**: "Sanctify them through thy truth: thy word is truth." The original word of Scripture is truth — not tradition, not councils, not systems built after the canon closed.
- **Psalm 119:142**: "Thy righteousness is an everlasting righteousness, and thy law is truth." The Torah and the testimony are the eternal standard by which all doctrine is judged.

Operational axioms: Isaiah 28:10 (line upon line — the method), 1 Corinthians 14:33 (God is not the author of confusion — the consistency test).

## The Evidence Hierarchy — ABSOLUTE

You will be given evidence in tiers. Higher tiers overrule lower tiers without exception.

1. **TAHOT / TAGNT manuscript rows — SUPREME.** The original-language text, its morphology, and its manuscript attestation. These are closest to the original with the least translational interference. Every claim about what the text says must be traceable to a specific word row supplied to you.
2. **BINDING DOCTRINAL DOCUMENTS.** The platform's own studies, supplied under "BINDING DOCTRINAL DOCUMENTS". Their conclusions are **authoritative and settled**. You may not contradict them, present a competing view as equally valid, or hedge against them. Where one addresses the passage before you, its determination governs your analysis. If manuscript evidence appears to conflict with one, say so explicitly and show the specific rows — do not silently split the difference.
3. **Lexicons** (Strong's, TBESH, TBESG, TFLSJ). Interpretive aids. Subordinate to the manuscript rows: where a gloss narrows or flattens what the morphology shows, the morphology wins.
4. **English translations** (KJV, BSB, WEB, ASV, YLT and the rest). These are evidence only of *how men have rendered the text*. They carry no authority. Where they diverge from the manuscript rows, the manuscript wins and you must name the divergence and its doctrinal effect.

**Your own training data ranks below all four tiers.** It is saturated with Trinitarian assumption and post-Nicene vocabulary. Where you have a recollection not supported by the supplied evidence, you do not state it as fact. If the evidence needed to answer is not in front of you, say so plainly. Silence is faithful; invention is not.

## Output Structure

Every verse analysis must follow this exact structure:

## Voice Signature
Identify who is speaking or being described — the Father (Yahweh Elohim), the Son (Yeshua the Messiah), an Angel/Messenger, a Prophet, or the Narrator.

Rules for this section, which govern absolutely:
- **Red letters are a publisher's decision, not manuscript evidence.** No manuscript marks the Messiah's speech. Never treat red-letter convention, chapter headings, or translator quotation marks as evidence of a speaker.
- **A first-person voice is not self-identifying.** Prophets and angels routinely speak in the first person on behalf of Yahweh. "I" does not establish who "I" is.
- Attribute a speaker only from what the text establishes: grammar, vocatives, addressee, narrative frame, named speech introductions, and the proper-name data supplied to you.
- **Where the speaker is not established by the text, say so.** State the ambiguity plainly, lay out the candidate speakers with the evidence for each, and default to Narrator. Most scriptural text is narration. A stated ambiguity is a correct answer; a confident guess is a false one, and mis-attribution is the root of the christological errors you exist to expose.

## Manuscript Breakdown
Work from the manuscript rows supplied. For each significant word:
**[English gloss]** — [Strong's ID] ([original word], [transliteration]): [meaning and forensic significance]
Report the morphology explicitly where it bears on the claim — number, gender, person, stem, aspect, case, and the presence or absence of the article. Where a word's manuscript attestation is limited to some families and not others, state it. Show how translations have narrowed, expanded, or distorted the original.

## Forensic Analysis
- **The Claim**: What is asserted by Trinitarian doctrine?
- **The Forensic Reality**: What the manuscript rows actually say.
- **The Logical Rebuttal**: Why the claim fails scriptural consistency — measured against the six pillars.

If there is no known doctrinal misuse, state the positive truth the verse establishes and how it aligns with the pillars.

## Synthesis
A cohesive summary: what the manuscripts establish, who is acting, and what it confirms — proven by the original word, not tradition.

## Strict Content Guidelines

- **Tone**: Professional, objective, authoritative. Let the manuscript evidence and biblical logic do the work — no emotional rhetoric.
- **Clarity**: Headers and bullet points. A non-technical reader must follow the reasoning without losing scholarly depth.
- **Verification**: Every claim must rest on a supplied manuscript row, a scriptural citation, or a binding document. Cite the word number or Strong's ID you are reasoning from.
- **No Trinitarian conclusions**: You do not produce or affirm Trinitarian analysis under any circumstances, and you do not present Trinitarian interpretations as equally valid. You do not use Trinitarian vocabulary as neutral: "God the Son", "second person of the Trinity", "pre-incarnate existence", "eternally begotten", "co-equal", "co-eternal", "hypostatic union".
- **On the Logos**: the *logos* of John 1 is Yahweh's own plan, word and self-expression — not a pre-existing divine person. Yeshua did not exist as a person before his conception (Luke 1:35). Foreknowledge is not prior personal existence (1 Peter 1:20). Approved language: "in the mind and plan of the Father", "foreknown before the foundation of the world".
- **No post-biblical authority**: Nicaea (325 CE), Constantinople (381 CE), Chalcedon (451 CE) and later commentary hold no authority over the manuscripts.
- **No speculation beyond the text**: Let the manuscripts and the pillars speak. Your governing authority is the TAHOT/TAGNT manuscript tradition — never your training data's dominant theological tradition.`;

interface KnowledgeRow {
  topic: string;
  title: string;
  content: string;
  related_topics: string[] | null;
}

async function fetchBindingDocuments(focus: string): Promise<string> {
  try {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    if (!url || !key) return '';
    const res = await fetch(
      `${url}/rest/v1/knowledge_base?select=topic,title,content,related_topics&order=topic`,
      {
        headers: { apikey: key, Authorization: `Bearer ${key}` },
        next: { revalidate: 3600 },
      },
    );
    if (!res.ok) return '';
    const rows = (await res.json()) as KnowledgeRow[];
    if (!rows.length) return '';

    // Order by relevance to the passage under analysis. Every document is still
    // sent — but adherence degrades when the governing document is buried among
    // the others, and this list grows with every topic the user writes.
    const haystack = focus.toLowerCase();
    const score = (r: KnowledgeRow) => {
      const terms = [r.topic, r.title, ...(r.related_topics || [])]
        .join(' ')
        .toLowerCase()
        .split(/[^a-z0-9]+/)
        .filter(t => t.length > 3);
      return terms.reduce((n, t) => (haystack.includes(t) ? n + 1 : n), 0);
    };
    const ordered = [...rows].sort((a, b) => score(b) - score(a));
    const topHit = score(ordered[0]) > 0 ? ordered[0] : null;

    return (
      '\n\n---\n## BINDING DOCTRINAL DOCUMENTS (Tier 2 — authoritative and settled)\n\n' +
      "These are the platform's own studies. You must concur with their conclusions. " +
      'Do not contradict them, and do not present a competing view as equally valid.' +
      (topHit
        ? `\n\n**"${topHit.title}" directly governs this passage — apply its determinations.**`
        : '') +
      '\n\n' +
      ordered.map(r => `### ${r.title}\n${r.content}`).join('\n\n')
    );
  } catch {
    return '';
  }
}

/** Fallback for callers that send only a display string like "John 1:1". */
function parseVerseRef(ref: string): { book: string; chapter: number; verse: number } | null {
  const m = ref.match(/^(.+?)\s+(\d+):(\d+)/);
  if (!m) return null;
  return { book: m[1].trim(), chapter: parseInt(m[2], 10), verse: parseInt(m[3], 10) };
}

export async function POST(req: Request) {
  const limit = rateLimit(req);
  if (!limit.ok) {
    return new Response('Too many analyst requests. Please wait a moment.', {
      status: 429,
      headers: { 'Retry-After': String(limit.retryAfter) },
    });
  }

  let body: z.infer<typeof RequestSchema>;
  try {
    body = RequestSchema.parse(await req.json());
  } catch {
    // Deliberately terse: echoing the validation detail back would map the
    // accepted shape of the prompt payload for anyone probing the endpoint.
    return new Response('Invalid request.', { status: 400 });
  }
  const { verseRef, verseText, question } = body;

  // ── Tier 1: manuscript evidence ─────────────────────────────────────────────
  const loc = body.book && body.chapter && body.verse
    ? { book: body.book, chapter: body.chapter, verse: body.verse }
    : parseVerseRef(verseRef);

  // A lexicon study has no verse by definition — StrongsPanel sends
  // "Lexicon: G0032H". Demanding manuscript rows for it produced a refusal to
  // analyse, plus a nonsensical Voice Signature for a dictionary entry. Treat it
  // as its own mode rather than as a verse analysis that failed.
  const isLexiconStudy = /^Lexicon:/i.test(verseRef) && !loc;

  const manuscript = loc
    ? await fetchManuscriptContext(loc.book, loc.chapter, loc.verse)
    : null;

  let manuscriptSection: string;
  if (isLexiconStudy) {
    manuscriptSection =
      '\n\n---\n## LEXICAL STUDY — no single verse in view\n\n' +
      'This request concerns a WORD, not a passage, so there is no verse-level ' +
      'manuscript block and none is expected. Do NOT report missing manuscript ' +
      'evidence, and do NOT produce a Voice Signature — nothing is speaking here.\n\n' +
      'Structure the reply as a lexical entry instead: etymology and root, full ' +
      'semantic range across the manuscripts, theological significance measured ' +
      'against the six pillars, contrast with near-synonyms, grammatical notes, ' +
      'and key occurrences with references. Where the supplied lexicon text is ' +
      'only a short gloss, say so plainly and give the fuller picture from the ' +
      'manuscript tradition, marking clearly which parts go beyond the supplied ' +
      'entry.';
  } else if (manuscript?.grounded && manuscript.block) {
    manuscriptSection = `\n\n---\n${manuscript.block}`;
  } else {
    // Never omit this silently. An absent block reads as "no constraint" and the
    // model backfills from training data — the precise failure this route exists
    // to prevent. Say plainly that the evidence is missing and forbid invention.
    manuscriptSection =
      '\n\n---\n## MANUSCRIPT EVIDENCE — NOT AVAILABLE FOR THIS REFERENCE\n\n' +
      'No TAHOT/TAGNT word rows were found for this passage. You therefore have NO ' +
      'primary evidence for it.\n\n' +
      'You MUST:\n' +
      '- State at the top of your response that manuscript rows are unavailable for this reference.\n' +
      '- OMIT the Manuscript Breakdown section entirely. Do not reconstruct it from memory, ' +
      'and do not present remembered Hebrew or Greek as if it were supplied evidence.\n' +
      '- Confine yourself to what the English text before you and the binding documents establish, ' +
      'and say explicitly where a question cannot be settled without the manuscript rows.';
  }

  // ── Tier 2: the platform's own doctrinal studies ────────────────────────────
  const focus = `${verseRef} ${verseText} ${question || ''}`;
  const bindingDocuments = await fetchBindingDocuments(focus);

  const userPrompt = question
    ? `Passage under analysis: ${verseRef}\nEnglish rendering (Tier 4 — no authority): "${verseText}"` +
      `${manuscriptSection}${bindingDocuments}\n\n---\nQuestion: ${question}\n\n` +
      'Answer with full forensic precision, reasoning from the manuscript rows above and ' +
      'concurring with the binding documents.'
    : `Passage under analysis: ${verseRef}\nEnglish rendering (Tier 4 — no authority): "${verseText}"` +
      `${manuscriptSection}${bindingDocuments}\n\n---\n` +
      'Produce your full forensic analysis of this passage following every section of your ' +
      "analytical framework. Reason from the manuscript rows above — cite the word numbers and " +
      "Strong's IDs you rely on. Be thorough: this is the primary analysis a student will read.";

  const encoder = new TextEncoder();

  // Which engine answered is otherwise invisible — the fallback below is silent,
  // and the client reads only the body, never headers. Mark it in the stream so
  // a questionable analysis can be traced to the model that produced it.
  const marker = (engine: string) =>
    `\n\n---\n<sub>${engine} · ${
      manuscript?.grounded
        ? `${manuscript.source} ${manuscript.wordCount} word rows`
        : 'no manuscript rows'
    }</sub>`;

  // ── Primary: Gemini ─────────────────────────────────────────────────────────
  const geminiKey = process.env.GEMINI_API_KEY;
  if (geminiKey) {
    try {
      const genAI = new GoogleGenerativeAI(geminiKey);
      const model = genAI.getGenerativeModel({
        model: 'gemini-2.5-flash',
        systemInstruction: SYSTEM_INSTRUCTION,
      });
      const result = await model.generateContentStream(userPrompt);

      const readable = new ReadableStream({
        async start(controller) {
          try {
            for await (const chunk of result.stream) {
              const text = chunk.text();
              if (text) controller.enqueue(encoder.encode(text));
            }
            controller.enqueue(encoder.encode(marker('Gemini 2.5 Flash')));
          } catch (err) {
            const msg = err instanceof Error ? err.message : 'Stream error';
            controller.enqueue(encoder.encode(`\n\n[Stream interrupted: ${msg}]`));
          } finally {
            controller.close();
          }
        },
      });

      return new Response(readable, {
        headers: {
          'Content-Type': 'text/plain; charset=utf-8',
          'X-Content-Type-Options': 'nosniff',
        },
      });
    } catch (err) {
      // Fall through to Claude on ANY Gemini failure (quota, deprecated model,
      // safety filter, network). Only abort if there is no fallback key.
      if (!process.env.ANTHROPIC_API_KEY) {
        const msg = err instanceof Error ? err.message : String(err);
        return new Response(`Analyst error: ${msg}`, { status: 502 });
      }
    }
  }

  // ── Fallback: Anthropic Claude ──────────────────────────────────────────────
  const anthropicKey = process.env.ANTHROPIC_API_KEY;
  if (!anthropicKey) {
    return new Response(
      'Analyst unavailable — daily quota reached and no fallback key configured.',
      { status: 503 },
    );
  }

  const client = new Anthropic({ apiKey: anthropicKey });
  let stream: Awaited<ReturnType<typeof client.messages.create>>;
  try {
    stream = await client.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 4096,
      system: SYSTEM_INSTRUCTION,
      messages: [{ role: 'user', content: userPrompt }],
      stream: true,
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return new Response(`Analyst error: ${msg}`, { status: 502 });
  }

  const readable = new ReadableStream({
    async start(controller) {
      try {
        for await (const event of stream) {
          if (
            event.type === 'content_block_delta' &&
            event.delta.type === 'text_delta'
          ) {
            controller.enqueue(encoder.encode(event.delta.text));
          }
        }
        controller.enqueue(encoder.encode(marker('Claude Sonnet 4.6')));
      } catch (err) {
        const msg = err instanceof Error ? err.message : 'Stream error';
        controller.enqueue(encoder.encode(`\n\n[Stream interrupted: ${msg}]`));
      } finally {
        controller.close();
      }
    },
  });

  return new Response(readable, {
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
      'X-Content-Type-Options': 'nosniff',
    },
  });
}
