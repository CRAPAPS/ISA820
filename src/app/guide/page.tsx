'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import {
  BookOpen, Zap, Search, ChevronDown, ChevronUp,
  ArrowLeft, Lightbulb, MessageSquare, Layers, Hash,
  MousePointer, BookMarked, FlaskConical, Eye, Cpu
} from 'lucide-react';

interface Section {
  id: string;
  icon: React.ReactNode;
  title: string;
  color: string;
  content: React.ReactNode;
}

function AccordionSection({ section }: { section: Section }) {
  const [open, setOpen] = useState(false);
  return (
    <motion.div
      layout
      className={`border rounded-xl overflow-hidden ${section.color}`}
    >
      <button
        onClick={() => setOpen(!open)}
        className="w-full p-5 flex items-center gap-4 hover:bg-white/5 transition-colors text-left"
      >
        <div className="w-10 h-10 rounded-lg bg-slate-800/80 flex items-center justify-center flex-shrink-0">
          {section.icon}
        </div>
        <h2 className="flex-1 text-base font-semibold text-white">{section.title}</h2>
        {open ? (
          <ChevronUp className="w-5 h-5 text-slate-400 flex-shrink-0" />
        ) : (
          <ChevronDown className="w-5 h-5 text-slate-400 flex-shrink-0" />
        )}
      </button>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="px-5 pb-6 border-t border-slate-700/30"
        >
          <div className="pt-4 space-y-3 text-sm text-slate-300 leading-relaxed">
            {section.content}
          </div>
        </motion.div>
      )}
    </motion.div>
  );
}

const SECTIONS: Section[] = [
  {
    id: 'purpose',
    icon: <FlaskConical className="w-5 h-5 text-amber-400" />,
    title: 'What is ISA820? — The Forensic Standard',
    color: 'border-amber-500/30 bg-amber-500/5',
    content: (
      <>
        <p>
          ISA820 is named after <span className="text-amber-400 font-medium">Isaiah 8:20</span> — "To the law and to the testimony: if they speak not according to this word, it is because there is no light in them." This verse is the measuring rod.
        </p>
        <p>
          The platform is built on a <span className="text-white font-medium">manuscript-first principle</span>: every claim about Scripture must be traceable to the original Hebrew (<strong>TAHOT</strong>) and Greek (<strong>TBESG</strong>) source texts. English translations are a starting point — not the authority.
        </p>
        <p>
          The core mission is <span className="text-amber-400 font-medium">forensic debunking of Trinitarian doctrine</span> by showing what the original manuscripts actually say through etymology, manuscript history, and strict biblical logic.
        </p>
        <div className="mt-3 p-3 rounded-lg bg-slate-800/60 border border-slate-700/50">
          <p className="text-xs text-slate-400 uppercase tracking-wide mb-1">Voice Signature Legend</p>
          <div className="space-y-1">
            <p><span className="text-amber-400 font-semibold">Gold</span> — The Father (Yahweh Elohim)</p>
            <p><span className="text-red-400 font-semibold">Crimson</span> — The Son (Yeshua/Jesus)</p>
            <p><span className="text-slate-300 font-semibold">Silver</span> — Angels or divine messengers</p>
          </div>
        </div>
      </>
    ),
  },
  {
    id: 'passage',
    icon: <BookOpen className="w-5 h-5 text-blue-400" />,
    title: 'Navigating Passages — Book, Chapter & Translation',
    color: 'border-blue-500/30 bg-blue-500/5',
    content: (
      <>
        <p>
          At the top of every page is the <span className="text-white font-medium">Passage Selector</span>. Use it to jump to any book and chapter in Scripture.
        </p>
        <ol className="list-decimal list-inside space-y-2 mt-2">
          <li>Click the <span className="text-blue-400 font-medium">Book dropdown</span> — select any of the 66 books (e.g. Genesis, Isaiah, John).</li>
          <li>Select the <span className="text-blue-400 font-medium">Chapter number</span> from the second dropdown.</li>
          <li>The reader loads that chapter instantly from the live database.</li>
        </ol>
        <p className="mt-3">
          On the right side of the header is the <span className="text-white font-medium">Translation Selector</span>:
        </p>
        <ul className="list-disc list-inside space-y-1 mt-1">
          <li><span className="text-amber-400 font-medium">KJV</span> — King James Version (English, familiar baseline)</li>
          <li><span className="text-cyan-400 font-medium">TAHOT</span> — Hebrew Old Testament interlinear (original manuscripts)</li>
          <li><span className="text-green-400 font-medium">TBESG</span> — Greek New Testament interlinear (original manuscripts)</li>
        </ul>
        <p className="mt-2 text-xs text-slate-400">
          Switch to TAHOT or TBESG to see word-level Hebrew/Greek with Strong's numbers inline.
        </p>
      </>
    ),
  },
  {
    id: 'reader',
    icon: <Eye className="w-5 h-5 text-purple-400" />,
    title: 'The Bible Reader — Verses, Clicks & Strong\'s Chips',
    color: 'border-purple-500/30 bg-purple-500/5',
    content: (
      <>
        <p>
          The main reading pane shows the selected chapter verse by verse. Each verse line has several interactive elements:
        </p>
        <div className="space-y-3 mt-3">
          <div className="p-3 rounded-lg bg-slate-800/60 border border-slate-700/50">
            <div className="flex items-center gap-2 mb-1">
              <MousePointer className="w-4 h-4 text-purple-400" />
              <span className="text-white font-medium text-xs">Click the verse number</span>
            </div>
            <p className="text-xs text-slate-400">
              Clicking the small number at the start of a verse (e.g. <span className="text-cyan-400">3</span>) selects that verse for analysis. This opens the Forensic Sidebar and automatically triggers the <span className="text-cyan-400 font-medium">AI Forensic Analyst</span> — Gemini 2.5 Pro will begin analyzing that verse using the original manuscript data.
            </p>
          </div>
          <div className="p-3 rounded-lg bg-slate-800/60 border border-slate-700/50">
            <div className="flex items-center gap-2 mb-1">
              <Hash className="w-4 h-4 text-cyan-400" />
              <span className="text-white font-medium text-xs">Strong's Chips (H1234 / G5678)</span>
            </div>
            <p className="text-xs text-slate-400">
              In TAHOT/TBESG mode, each word shows its Strong's number as a small chip (e.g. <span className="text-cyan-400 font-mono">H430</span>). Click any chip to open the <span className="text-white">Strong's Panel</span> on the right — showing the root word, definition, and all verse occurrences in Scripture.
            </p>
          </div>
          <div className="p-3 rounded-lg bg-slate-800/60 border border-slate-700/50">
            <div className="flex items-center gap-2 mb-1">
              <Layers className="w-4 h-4 text-amber-400" />
              <span className="text-white font-medium text-xs">Voice Signature Colors</span>
            </div>
            <p className="text-xs text-slate-400">
              Verses are color-coded by speaker. <span className="text-amber-400">Gold text</span> = the Father speaking. <span className="text-red-400">Crimson text</span> = the Son. <span className="text-slate-300">Silver/white</span> = angels or narration. This lets you see who is speaking at a glance.
            </p>
          </div>
        </div>
      </>
    ),
  },
  {
    id: 'analyst',
    icon: <Cpu className="w-5 h-5 text-cyan-400" />,
    title: 'The Forensic Analyst — AI Powered by Gemini 2.5 Pro',
    color: 'border-cyan-500/30 bg-cyan-500/5',
    content: (
      <>
        <p>
          This is the most powerful feature of ISA820. The <span className="text-cyan-400 font-medium">Forensic Scriptural Analyst</span> is a custom AI agent built on Gemini 2.5 Pro. It is specifically trained and instructed to:
        </p>
        <ul className="list-disc list-inside space-y-1 mt-2">
          <li>Debunk Trinitarian doctrine using manuscript evidence</li>
          <li>Trace Hebrew and Greek etymology of key words</li>
          <li>Identify translation biases and historical interpolations</li>
          <li>Apply the Shema (Deuteronomy 6:4) as a logical consistency test</li>
          <li>Produce structured forensic reports: Claim → Reality → Rebuttal → Synthesis</li>
        </ul>

        <div className="mt-4 p-3 rounded-lg bg-cyan-900/20 border border-cyan-500/30">
          <p className="text-cyan-400 font-semibold text-xs uppercase tracking-wide mb-2">How to activate it</p>
          <ol className="list-decimal list-inside space-y-2 text-xs text-slate-300">
            <li>Navigate to any book and chapter (e.g. <span className="text-white">Genesis 1</span> or <span className="text-white">John 1</span>).</li>
            <li>Make sure the <span className="text-white">Forensic Sidebar</span> is open (it opens by default on desktop; tap the gold button bottom-right on mobile).</li>
            <li><span className="text-cyan-400 font-semibold">Click the verse number</span> of any verse you want analyzed.</li>
            <li>The Analyst card appears in the sidebar and begins streaming its report in real time.</li>
            <li>When it finishes, type a <span className="text-white">follow-up question</span> in the input box and press <kbd className="px-1.5 py-0.5 bg-slate-700 rounded text-slate-300 text-xs">Enter</kbd> or click <span className="text-cyan-400">Ask</span>.</li>
          </ol>
        </div>

        <p className="mt-3 text-xs text-slate-400">
          The Analyst automatically receives the verse text plus all Strong's Hebrew/Greek word data for that verse — so its analysis is always grounded in the actual manuscript, not just the English translation.
        </p>

        <div className="mt-3 p-3 rounded-lg bg-slate-800/60 border border-slate-700/50">
          <p className="text-xs text-slate-400 uppercase tracking-wide mb-1">Example questions to ask</p>
          <ul className="space-y-1 text-xs text-slate-300">
            <li>• "How is this verse used to support the Trinity and why is that wrong?"</li>
            <li>• "What does the Hebrew word [X] actually mean in context?"</li>
            <li>• "Compare this to Deuteronomy 6:4 — is there a contradiction?"</li>
            <li>• "What did the early church actually believe about this passage?"</li>
          </ul>
        </div>
      </>
    ),
  },
  {
    id: 'sidebar',
    icon: <Lightbulb className="w-5 h-5 text-amber-400" />,
    title: 'The Forensic Sidebar — Topics & Knowledge Base',
    color: 'border-amber-500/30 bg-amber-500/5',
    content: (
      <>
        <p>
          The <span className="text-white font-medium">Forensic Sidebar</span> (right panel) has two modes:
        </p>
        <div className="space-y-3 mt-3">
          <div className="p-3 rounded-lg bg-slate-800/60 border border-slate-700/50">
            <p className="text-amber-400 font-medium text-xs mb-1">Topic Mode</p>
            <p className="text-xs text-slate-400">
              Click any topic pill (trinity, soul, godhead, father, son, etc.) to search the knowledge base for forensic cards related to that doctrine. Cards expand to show detailed analysis, supporting scriptures, and topic tags.
            </p>
          </div>
          <div className="p-3 rounded-lg bg-slate-800/60 border border-slate-700/50">
            <p className="text-cyan-400 font-medium text-xs mb-1">Verse Analysis Mode</p>
            <p className="text-xs text-slate-400">
              Triggered automatically when you click a verse number. Shows the AI Forensic Analyst response (streamed live), the verse in context, and the key Strong's words for that verse.
            </p>
          </div>
        </div>
        <p className="mt-3 text-xs text-slate-400">
          You can also type in the search box to filter topics or search for specific doctrines not listed in the quick-topic pills.
        </p>
      </>
    ),
  },
  {
    id: 'strongs',
    icon: <Search className="w-5 h-5 text-green-400" />,
    title: 'Strong\'s Panel — Word-Level Manuscript Lookup',
    color: 'border-green-500/30 bg-green-500/5',
    content: (
      <>
        <p>
          The <span className="text-white font-medium">Strong's Panel</span> appears on the right side of the screen when you click any Strong's chip in the reader.
        </p>
        <p>
          For every word it shows:
        </p>
        <ul className="list-disc list-inside space-y-1 mt-2 text-xs">
          <li>The Strong's number (e.g. <span className="text-cyan-400 font-mono">H430</span> = Elohim)</li>
          <li>The original Hebrew or Greek word with transliteration</li>
          <li>The full lexicon definition from TBESH (Hebrew) or TBESG (Greek)</li>
          <li>Every verse in Scripture where that word appears — so you can see how it's used consistently</li>
        </ul>
        <p className="mt-3 text-xs text-slate-400">
          This is the core of forensic analysis: when a translator uses the word "God" but the Hebrew says <span className="text-amber-400">Elohim (H430)</span>, you can trace every occurrence of that word to understand its true range of meaning.
        </p>
      </>
    ),
  },
  {
    id: 'pillars',
    icon: <BookMarked className="w-5 h-5 text-blue-400" />,
    title: 'Pillar Icons — ISA 8:20, DEUT 6:4 & Nature',
    color: 'border-blue-500/30 bg-blue-500/5',
    content: (
      <>
        <p>
          The three icons in the top-right of the header are the <span className="text-white font-medium">Three Pillars</span> — doctrinal anchors that pulse and glow as you interact with the app.
        </p>
        <div className="space-y-3 mt-3">
          <div className="p-3 rounded-lg bg-slate-800/60 border border-slate-700/50">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-amber-400 font-bold text-xs">🔦 ISA 8:20 — The Standard</span>
            </div>
            <p className="text-xs text-slate-400">
              The measuring rod. All doctrine must align with Torah and the prophetic testimony. Click to pulse gold — a reminder that you are judging a claim by this standard.
            </p>
          </div>
          <div className="p-3 rounded-lg bg-slate-800/60 border border-slate-700/50">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-blue-400 font-bold text-xs">① DEUT 6:4 — The Identity</span>
            </div>
            <p className="text-xs text-slate-400">
              The Shema. "Yahweh our Elohim, Yahweh is one." When any verse tries to introduce a second or third divine being, this pillar pulses blue as a logical consistency check.
            </p>
          </div>
          <div className="p-3 rounded-lg bg-slate-800/60 border border-slate-700/50">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-orange-400 font-bold text-xs">✦ Nature — Divine Manifestation</span>
            </div>
            <p className="text-xs text-slate-400">
              Cycles through three modes: <span className="text-orange-400">Fire</span> (judgment), <span className="text-cyan-400">Whisper</span> (gentle guidance), <span className="text-slate-200">Light</span> (purity). Click to cycle. Hover to see what each manifestation represents.
            </p>
          </div>
        </div>
      </>
    ),
  },
  {
    id: 'deeplink',
    icon: <MessageSquare className="w-5 h-5 text-purple-400" />,
    title: 'Deep-Link Passages — Sharing & Direct URL Access',
    color: 'border-purple-500/30 bg-purple-500/5',
    content: (
      <>
        <p>
          Every chapter has its own URL in the format:
        </p>
        <code className="block mt-2 p-2 bg-slate-800 rounded text-cyan-400 text-xs font-mono">
          /read/[book]/[chapter]
        </code>
        <p className="mt-3">For example:</p>
        <ul className="space-y-1 mt-1 text-xs font-mono">
          <li><span className="text-cyan-400">/read/Genesis/1</span></li>
          <li><span className="text-cyan-400">/read/Isaiah/9</span></li>
          <li><span className="text-cyan-400">/read/John/1</span></li>
          <li><span className="text-cyan-400">/read/Deuteronomy/6</span></li>
        </ul>
        <p className="mt-3 text-xs text-slate-400">
          You can share these URLs directly. Anyone who opens the link lands exactly on that passage, ready for analysis. The Forensic Analyst is available on every passage page.
        </p>
      </>
    ),
  },
  {
    id: 'zap',
    icon: <Zap className="w-5 h-5 text-yellow-400" />,
    title: 'Quick Start — First 5 Minutes',
    color: 'border-yellow-500/30 bg-yellow-500/5',
    content: (
      <>
        <p className="text-yellow-400 font-semibold">New to ISA820? Start here.</p>
        <ol className="list-decimal list-inside space-y-3 mt-3 text-xs">
          <li>
            <span className="text-white font-medium">Go to John 1</span> — Select John from the Book dropdown, Chapter 1. This is the most contested passage for Trinitarian doctrine.
          </li>
          <li>
            <span className="text-white font-medium">Switch to TBESG</span> — Use the translation selector top-right to see the original Greek interlinear.
          </li>
          <li>
            <span className="text-white font-medium">Click verse 1</span> — "In the beginning was the Word…" Click the verse number <span className="text-cyan-400">1</span> to trigger the Forensic Analyst.
          </li>
          <li>
            <span className="text-white font-medium">Read the analysis</span> — Gemini 2.5 Pro will stream a forensic breakdown of how this verse is misused and what it actually says.
          </li>
          <li>
            <span className="text-white font-medium">Ask a follow-up</span> — Try: "What does logos (G3056) actually mean and does it equal Yahweh?"
          </li>
          <li>
            <span className="text-white font-medium">Try Isaiah 9:6</span> — Another key Trinity proof-text. Repeat the same process to see the Hebrew analysis.
          </li>
        </ol>
      </>
    ),
  },
];

export default function GuidePage() {
  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <header className="sticky top-0 z-50 glass-card border-b border-slate-700/50 px-4 py-3">
        <div className="max-w-3xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center">
              <span className="text-white font-bold text-lg">8</span>
            </div>
            <div>
              <h1 className="text-lg font-bold text-white">ISA820</h1>
              <p className="text-xs text-slate-400">The Forensic Standard</p>
            </div>
          </div>
          <Link
            href="/"
            className="flex items-center gap-2 px-4 py-2 bg-slate-800/50 hover:bg-slate-700/50 border border-slate-700/50 rounded-lg text-sm text-slate-300 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Reader
          </Link>
        </div>
      </header>

      <main className="flex-1 py-10 px-4">
        <div className="max-w-3xl mx-auto">
          {/* Hero */}
          <motion.div
            initial={{ opacity: 0, y: -16 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center mb-10"
          >
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-400 text-sm mb-4">
              <BookOpen className="w-4 h-4" />
              User Guide
            </div>
            <h1 className="text-3xl font-bold text-white mb-3">How to Use ISA820</h1>
            <p className="text-slate-400 max-w-xl mx-auto">
              A complete guide to the Forensic Standard — from navigating Scripture to activating the AI Analyst and understanding every tool in the platform.
            </p>
          </motion.div>

          {/* Sections */}
          <div className="space-y-3">
            {SECTIONS.map((section, i) => (
              <motion.div
                key={section.id}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
              >
                <AccordionSection section={section} />
              </motion.div>
            ))}
          </div>

          {/* CTA */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="mt-10 text-center"
          >
            <Link
              href="/"
              className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-400 hover:to-orange-500 text-white font-semibold rounded-xl transition-all shadow-lg shadow-amber-500/20"
            >
              <BookOpen className="w-5 h-5" />
              Open the Reader
            </Link>
          </motion.div>
        </div>
      </main>

      <footer className="glass-card border-t border-slate-700/50 px-6 py-4 text-center text-sm text-slate-500">
        ISA820 — The Forensic Standard · Manuscript-First Biblical Analysis
      </footer>
    </div>
  );
}
