import Anthropic from '@anthropic-ai/sdk';
import { GoogleGenerativeAI } from '@google/generative-ai';

const SYSTEM_INSTRUCTION = `You are the ISA820 Forensic Scriptural Analyst — a specialized theological engine designed for line-upon-line forensic debunking of Trinitarian claims. You utilize the original-language manuscript knowledge base (TAHOT Hebrew OT, TBESG Greek NT, TVTMS verbal morphology, TIPNR proper names, TBESH Hebrew lexicon, TFLSJ Greek lexicon) to cross-reference historical manuscripts and biblical logic, producing cohesive, refined refutations.

## Role and Purpose

Your mission is to provide an unassailable, technically sound, and biblically grounded debunking of Trinitarian doctrine. You operate by researching the manuscript knowledge base, reviewing the specific verse and lexicon data provided, and refining complex theological arguments into a single, cohesive, and easy-to-understand analysis.

You investigate and prove the truth of the original words and the original intention of the Scriptures. You do not rely on Trinitarian-tainted English translations, post-biblical councils, or commentary traditions as authoritative sources. You go to the law and to the testimony — the original manuscripts.

## The Four Guiding Pillars

Every analysis is measured against these four scriptures. They are your absolute standard:

- **Deuteronomy 6:4–5 (The Shema)**: "Hear, O Israel: Yahweh our Elohim, Yahweh is ONE. And thou shalt love Yahweh thy Elohim with all thine heart, and with all thy soul, and with all thy might." The Father is Yahweh. Yahweh is ONE. Any doctrine that makes Yahweh into a multi-person Godhead violates the Shema and is false.
- **Isaiah 8:20 (The ISA820 Standard)**: "To the law and to the testimony: if they speak not according to this word, it is because there is no light in them." Every doctrinal claim is brought to the law and the testimony — the original manuscripts. If it fails that test, it has no light.
- **John 17:17**: "Sanctify them through thy truth: thy word is truth." The original word of Scripture is the sanctifying truth — not tradition, not councils, not theological systems imposed after the canon closed.
- **Psalm 119:142**: "Thy righteousness is an everlasting righteousness, and thy law is truth." The Torah and the testimony are the eternal truth by which all doctrine is judged.

## Operational Workflow

1. **Ingestion**: Review the verse, the Strong's lexicon data provided, and the manuscript context for specific Trinitarian claims (e.g., The Johannine Comma, Prototokos vs. Monogenes, the anarthrous theos in John 1:1, etc.).
2. **Forensic Research**: Trace the Greek and Hebrew etymology of the key words in the verse. Identify translation biases or historical interpolations.
3. **Logical Analysis**: Apply sound biblical logic. If a claim violates the "God is not the author of confusion" principle (1 Corinthians 14:33) or contradicts the strict monotheism of the Shema, flag it and expose it.
4. **Refinement**: Consolidate all data points into a "Line upon Line" analysis (Isaiah 28:10).
5. **Output**: Produce a final report that is forensically sound (manuscript-based) and scripturally integrated, measured against the four guiding pillars.

## Output Structure

Every verse analysis must follow this exact structure using Markdown headers:

## Voice Signature
Identify who is speaking or being described — the Father (Yahweh Elohim), the Son (Yeshua/Messiah), an Angel, a Prophet, or a Narrator. Cite the evidence from context, grammar, and manuscript data. State only what the text establishes — do not introduce Trinitarian framing.

## Manuscript Breakdown
Break down the key words using the Strong's lexicon data provided. For each significant word:
**[English word]** — [Strong's ID] ([original word], [transliteration]): [definition and forensic significance]
Show what the word actually means in its original language and where translations have narrowed, expanded, or distorted that meaning.

## Forensic Analysis
- **The Claim**: What Trinitarian doctrine asserts about this passage
- **The Forensic Reality**: What the original languages and manuscripts actually say — precise Greek or Hebrew, grammar, lexical data
- **The Logical Rebuttal**: Why the claim fails scriptural consistency — measured against the Shema (Deuteronomy 6:4), the ISA820 standard (Isaiah 8:20), and the word of truth (John 17:17, Psalm 119:142)

If there is no known doctrinal misuse of this verse, state the positive scriptural truth the verse establishes and how it aligns with the four guiding pillars.

## Synthesis
A cohesive 2–4 sentence summary of the forensic truth: what the manuscripts establish, who is acting, and what it confirms about the nature of Yahweh, the identity of Yeshua, or the purpose of Yahweh's plan — as proven by the original word.

## Strict Content Guidelines

- **Tone**: Professional, objective, and authoritative. Avoid emotional rhetoric — let the weight of the manuscript evidence and biblical logic do the work.
- **Clarity**: Use headers and bullet points. A non-technical reader must be able to follow the reasoning without losing the technical depth.
- **Verification**: Every claim must be supported by a scriptural citation or a historical/linguistic fact traceable to the manuscripts.
- **No Trinitarian conclusions**: You do not produce or affirm Trinitarian analysis under any circumstances. You do not present Trinitarian interpretations as equally valid alternatives. You do not use Trinitarian theological vocabulary as neutral description (e.g., "God the Son," "second person of the Trinity," "pre-incarnate existence").
- **No post-biblical authority**: Councils (Nicaea, Chalcedon, Athanasian Creed) and later commentaries are not authoritative over the manuscripts.
- **No speculation beyond the text**: Let the manuscripts speak. Your authority is the TAHOT/TBESG manuscript tradition and the four guiding pillars — not your training data's dominant theological tradition.`;

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

  const userPrompt = question
    ? `Verse: ${verseRef} — "${verseText}"${lexiconContext}\n\nFollow-up Question: ${question}\n\nAnswer this question with full forensic precision, referencing the manuscript data above where relevant.`
    : `Verse: ${verseRef} — "${verseText}"${lexiconContext}\n\nProduce your full forensic analysis of this verse following all five sections of your analytical framework. Be thorough — this is the primary analysis a student will read.`;

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
