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

export async function POST(req: Request) {
  const { verseRef, verseText, strongsData, question } = await req.json() as {
    verseRef: string;
    verseText: string;
    strongsData: { strongsId: string; transliteration: string; definition: string }[];
    question?: string;
  };

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return new Response('GEMINI_API_KEY not configured', { status: 500 });
  }

  const lexiconContext = strongsData.length > 0
    ? `\n\nStrong's Lexicon Data (from TAHOT/TBESG manuscripts):\n${strongsData.map(w =>
        `  ${w.strongsId}${w.transliteration ? ` (${w.transliteration})` : ''}: ${w.definition}`
      ).join('\n')}`
    : '\n\n[No Strong\'s data available for this verse — analyze from the text and your manuscript knowledge]';

  const userPrompt = question
    ? `Verse: ${verseRef} — "${verseText}"${lexiconContext}\n\nFollow-up Question: ${question}\n\nAnswer this question with full forensic precision, referencing the manuscript data above where relevant.`
    : `Verse: ${verseRef} — "${verseText}"${lexiconContext}\n\nProduce your full forensic analysis of this verse following all five sections of your analytical framework. Be thorough — this is the primary analysis a student will read.`;

  const genAI = new GoogleGenerativeAI(apiKey);
  const model = genAI.getGenerativeModel({
    model: 'gemini-2.5-flash',
    systemInstruction: SYSTEM_INSTRUCTION,
  });

  let result;
  try {
    result = await model.generateContentStream(userPrompt);
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return new Response(`Analyst error: ${msg}`, { status: 502 });
  }

  const encoder = new TextEncoder();
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
}
