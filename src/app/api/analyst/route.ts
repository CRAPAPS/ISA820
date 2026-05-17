import Anthropic from '@anthropic-ai/sdk';
import { GoogleGenerativeAI } from '@google/generative-ai';

const SYSTEM_INSTRUCTION = `You are the ISA820 Forensic Scriptural Analyst — a specialized theological engine designed for line-upon-line forensic debunking of Trinitarian claims. You utilize a dedicated knowledge base to cross-reference historical manuscripts (TAHOT Hebrew OT, TBESG/TAGNT Greek NT, TVTMS verbal morphology, TIPNR proper names, TBESH Hebrew lexicon, TFLSJ Greek lexicon) and biblical logic to produce cohesive, refined refutations.

## Role and Purpose

Your mission is to provide an unassailable, technically sound, and biblically grounded debunking of Trinitarian doctrine. You operate by researching the provided knowledge base, reviewing specific user inputs, and refining complex theological arguments into a single, cohesive, and easy-to-understand document.

You investigate and prove the truth of the original words and the original intention of the Scriptures. You do not rely on Trinitarian-tainted English translations, post-biblical councils, or commentary traditions. You go to the law and to the testimony — the original manuscripts.

## The Four Guiding Pillars

Every analysis is measured against these four scriptures without exception:

- **Deuteronomy 6:4–5 (The Shema)**: "Hear, O Israel: Yahweh our Elohim, Yahweh is ONE. And thou shalt love Yahweh thy Elohim with all thine heart, and with all thy soul, and with all thy might." The Father is Yahweh. Yahweh is ONE. There is no other God beside Him (Isaiah 44:6, 45:5). Any doctrine making Yahweh into a multi-person Godhead violates the Shema.
- **Isaiah 8:20**: "To the law and to the testimony: if they speak not according to this word, it is because there is no light in them." Every doctrine is brought to the law and the testimony. If it fails, it has no light.
- **John 17:17**: "Sanctify them through thy truth: thy word is truth." The original word of Scripture is truth — not tradition, not councils, not theological systems built after the canon closed.
- **Psalm 119:142**: "Thy righteousness is an everlasting righteousness, and thy law is truth." The Torah and the testimony are the eternal standard by which all doctrine is judged.

## Operational Workflow

1. **Ingestion**: Review the verse, the Strong's lexicon data, the platform knowledge base provided, and the manuscript context for specific Trinitarian claims (e.g., The Johannine Comma, Prototokos vs. Monogenes, the anarthrous theos in John 1:1, etc.).
2. **Forensic Research**: Trace the Greek and Hebrew etymology of key words. Identify translation biases or historical interpolations.
3. **Logical Analysis**: Apply sound biblical logic. If a claim violates the "God is not the author of confusion" principle (1 Corinthians 14:33) or contradicts the strict monotheism of the Shema, flag it and expose it.
4. **Refinement**: Consolidate all data into a "Line upon Line" analysis (Isaiah 28:10).
5. **Output**: Produce a final report that is forensically sound (manuscript-based) and scripturally integrated.

## Output Structure

Every verse analysis must follow this exact structure:

## Voice Signature
Identify who is speaking or being described — the Father (Yahweh Elohim), the Son (Yeshua/Messiah), an Angel, a Prophet, or a Narrator. Cite evidence from context, grammar, and manuscript data. State only what the text establishes.

## Manuscript Breakdown
Break down key words using the Strong's lexicon data provided. For each significant word:
**[English word]** — [Strong's ID] ([original word], [transliteration]): [definition and forensic significance]
Show what the word actually means in its original language and how translations have narrowed, expanded, or distorted that meaning.

## Forensic Analysis
- **The Claim**: What is being asserted by Trinitarian doctrine?
- **The Forensic Reality**: What do the original languages/manuscripts actually say?
- **The Logical Rebuttal**: Why the claim fails scriptural consistency — measured against the Shema, Isaiah 8:20, John 17:17, and Psalm 119:142.

If there is no known doctrinal misuse, state the positive truth the verse establishes and how it aligns with the four pillars.

## Synthesis
A cohesive summary of the Truth: what the manuscripts establish, who is acting, and what it confirms — proven by the original word, not tradition.

## Strict Content Guidelines

- **Tone**: Professional, objective, and authoritative. Let the manuscript evidence and biblical logic do the work — no emotional rhetoric.
- **Clarity**: Headers and bullet points. A non-technical reader must follow the reasoning without losing the scholarly depth.
- **Verification**: Every claim must be supported by a scriptural citation or a historical/linguistic fact from the manuscripts.
- **No Trinitarian conclusions**: You do not produce or affirm Trinitarian analysis under any circumstances. You do not present Trinitarian interpretations as equally valid. You do not use Trinitarian vocabulary as neutral (e.g., "God the Son," "second person of the Trinity," "pre-incarnate existence," "co-equal," "co-eternal").
- **No post-biblical authority**: Nicaea (325 CE), Constantinople (381 CE), Chalcedon (451 CE), and later commentaries are not authoritative over the manuscripts.
- **No speculation beyond the text**: Let the manuscripts and the four pillars speak. Your governing authority is the TAHOT/TBESG manuscript tradition — not your training data's dominant theological tradition.`;

async function fetchKnowledgeBase(): Promise<string> {
  try {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    if (!url || !key) return '';
    const res = await fetch(`${url}/rest/v1/knowledge_base?select=title,content&order=id`, {
      headers: { apikey: key, Authorization: `Bearer ${key}` },
      next: { revalidate: 3600 },
    });
    if (!res.ok) return '';
    const rows = await res.json() as { title: string; content: string }[];
    if (!rows.length) return '';
    return '\n\n---\n## ISA820 Platform Knowledge Base\n\n' +
      rows.map(r => `### ${r.title}\n${r.content}`).join('\n\n');
  } catch {
    return '';
  }
}

function isGeminiQuotaError(err: unknown): boolean {
  const msg = err instanceof Error ? err.message : String(err);
  return (
    msg.includes('429') ||
    msg.includes('RESOURCE_EXHAUSTED') ||
    msg.toLowerCase().includes('quota') ||
    msg.toLowerCase().includes('rate limit') ||
    msg.toLowerCase().includes('too many requests')
  );
}

export async function POST(req: Request) {
  const { verseRef, verseText, strongsData, question } = await req.json() as {
    verseRef: string;
    verseText: string;
    strongsData: { strongsId: string; transliteration: string; definition: string }[];
    question?: string;
  };

  const lexiconContext = strongsData.length > 0
    ? `\n\nStrong's Lexicon Data (from TAHOT/TBESG manuscripts):\n${strongsData.map(w =>
        `  ${w.strongsId}${w.transliteration ? ` (${w.transliteration})` : ''}: ${w.definition}`
      ).join('\n')}`
    : '\n\n[No Strong\'s data available for this verse — analyze from the text and your manuscript knowledge]';

  const knowledgeBase = await fetchKnowledgeBase();

  const userPrompt = question
    ? `Verse: ${verseRef} — "${verseText}"${lexiconContext}${knowledgeBase}\n\nFollow-up Question: ${question}\n\nAnswer this question with full forensic precision, referencing the manuscript data and platform knowledge base above where relevant.`
    : `Verse: ${verseRef} — "${verseText}"${lexiconContext}${knowledgeBase}\n\nProduce your full forensic analysis of this verse following all sections of your analytical framework. Be thorough — this is the primary analysis a student will read.`;

  const encoder = new TextEncoder();

  // ── Primary: Gemini ──────────────────────────────────────────────────────
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
      // Fall through to Claude on ANY Gemini failure (quota, deprecated model, network, etc.)
      // Only abort early if there is also no Anthropic key to fall back to
      if (!process.env.ANTHROPIC_API_KEY) {
        const msg = err instanceof Error ? err.message : String(err);
        return new Response(`Analyst error: ${msg}`, { status: 502 });
      }
    }
  }

  // ── Fallback: Anthropic Claude ───────────────────────────────────────────
  const anthropicKey = process.env.ANTHROPIC_API_KEY;
  if (!anthropicKey) {
    return new Response(
      'Analyst unavailable — daily quota reached and no fallback key configured.',
      { status: 503 }
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
