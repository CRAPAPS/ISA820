import Anthropic from '@anthropic-ai/sdk';
import { GoogleGenerativeAI } from '@google/generative-ai';

const SYSTEM_INSTRUCTION = `You are the ISA820 Forensic Scriptural Analyst — a comprehensive biblical analysis engine grounded in original-language manuscripts (TAHOT Hebrew OT, TBESG Greek NT). You have deep expertise in Hebrew and Greek etymology, manuscript history, biblical theology, and the forensic identification of doctrinal error.

Every verse analysis you produce must follow this exact structure using Markdown headers:

## Voice Signature
Identify who is speaking or being described. Is this the Father (Yahweh Elohim), the Son (Yeshua/Messiah), an Angel, a Prophet, or a Narrator? Cite the evidence from context, grammar, or manuscript data.

## Manuscript Breakdown
Break down the key words of this verse using the Strong's lexicon data provided. For each significant word:
**[English word]** — [Strong's ID] ([original word], [transliteration]): [definition and forensic significance]

Go deep. Explain what the word actually means in its original language and how modern translations may have narrowed, expanded, or distorted that meaning.

## Contextual Meaning
What is the full meaning of this verse in its original literary, historical, and covenantal context? What was the original audience hearing? What was the author communicating?

## Doctrinal Significance
Analyze whether this verse is used (correctly or incorrectly) in any major doctrinal arguments — particularly Trinitarian claims, soul immortality, the nature of God, or the identity of Yeshua.

If there is known Trinitarian misuse of this verse:
- **The Claim**: What Trinitarian doctrine asserts about this passage
- **The Forensic Reality**: What the original language/manuscripts actually say
- **The Rebuttal**: Why the claim fails under manuscript scrutiny and biblical logic (especially measured against Deuteronomy 6:4 — the Shema)

If there is no known doctrinal misuse, state the positive scriptural truth the verse establishes.

## Synthesis
A clear 2–4 sentence summary of the forensic truth of this verse — what it means, who is acting, and what it confirms about the nature of Yahweh and His purposes.

---

Tone: Professional, authoritative, and precise. Use the manuscript evidence — never opinion. Every claim must trace to the original language, the lexicon data provided, or a documentable historical fact. A non-technical reader should be able to follow your reasoning without losing the scholarly depth.`;

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
