'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import {
  BookOpen, Zap, Search, ChevronDown, ChevronUp,
  ArrowLeft, Lightbulb, MessageSquare, Layers, Hash,
  MousePointer, BookMarked, FlaskConical, Eye, Cpu,
  Smartphone, Columns, ChevronLeft, Sparkles, Database,
  X, Menu
} from 'lucide-react';

interface Section {
  id: string;
  icon: React.ReactNode;
  title: string;
  color: string;
  badge?: string;
  content: React.ReactNode;
}

function AccordionSection({ section, defaultOpen }: { section: Section; defaultOpen?: boolean }) {
  const [open, setOpen] = useState(defaultOpen ?? false);
  return (
    <motion.div
      layout
      className={`border rounded-2xl overflow-hidden transition-all ${section.color}`}
    >
      <button
        onClick={() => setOpen(!open)}
        className="w-full p-4 sm:p-5 flex items-center gap-4 hover:bg-white/5 transition-colors text-left"
      >
        <div className="w-10 h-10 rounded-xl bg-slate-800/80 flex items-center justify-center flex-shrink-0">
          {section.icon}
        </div>
        <div className="flex-1 min-w-0">
          <h2 className="text-sm sm:text-base font-semibold text-white leading-snug">{section.title}</h2>
          {section.badge && (
            <span className="inline-block mt-1 text-[10px] px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-400 border border-amber-500/30 uppercase tracking-wide">
              {section.badge}
            </span>
          )}
        </div>
        {open ? (
          <ChevronUp className="w-4 h-4 text-slate-500 flex-shrink-0" />
        ) : (
          <ChevronDown className="w-4 h-4 text-slate-500 flex-shrink-0" />
        )}
      </button>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
            className="border-t border-slate-700/30 overflow-hidden"
          >
            <div className="px-4 sm:px-5 py-5 space-y-3 text-sm text-slate-300 leading-relaxed">
              {section.content}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

const SECTIONS: Section[] = [
  {
    id: 'quickstart',
    icon: <Zap className="w-5 h-5 text-yellow-400" />,
    title: 'Quick Start — First 5 Minutes',
    color: 'border-yellow-500/30 bg-yellow-500/5',
    badge: 'Start here',
    content: (
      <>
        <p className="text-yellow-400 font-semibold">New to ISA820? Do this first.</p>
        <ol className="space-y-3 mt-3 text-xs list-none">
          {[
            ['Go to John 1', 'Select John from the Book dropdown, Chapter 1. This is the most contested passage for Trinitarian doctrine.'],
            ['Switch to TBESG', 'Use the translation selector in the header to load the original Greek interlinear. Each word shows its Strong\'s number.'],
            ['Click verse 1', '"In the beginning was the Word…" — tap the verse number 1 to select it for analysis.'],
            ['Open the Analyst', 'On desktop, click the glowing pull tab on the right edge. On mobile, tap the gold ☰ button bottom-right. The Forensic Analyst streams a breakdown in real time.'],
            ['Ask a follow-up', 'Type in the input at the bottom of the analyst card — e.g. "What does logos (G3056) actually mean?"'],
            ['Try Isaiah 9:6', 'Another key Trinity proof-text. Switch to TAHOT for Hebrew analysis.'],
          ].map(([title, desc], i) => (
            <li key={i} className="flex gap-3">
              <span className="w-5 h-5 rounded-full bg-yellow-500/20 border border-yellow-500/40 text-yellow-400 text-xs font-bold flex items-center justify-center flex-shrink-0 mt-0.5">{i + 1}</span>
              <div>
                <span className="text-white font-medium">{title}</span>
                <span className="text-slate-400"> — {desc}</span>
              </div>
            </li>
          ))}
        </ol>
      </>
    ),
  },
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
        <div className="mt-3 p-3 rounded-xl bg-slate-800/60 border border-slate-700/50">
          <p className="text-xs text-slate-400 uppercase tracking-widest mb-2">Voice Signature Legend</p>
          <div className="space-y-1.5 text-xs">
            <p><span className="inline-block w-2.5 h-2.5 rounded-full bg-amber-400 mr-2" /><span className="text-amber-400 font-semibold">Gold</span> — The Father (Yahweh Elohim)</p>
            <p><span className="inline-block w-2.5 h-2.5 rounded-full bg-red-400 mr-2" /><span className="text-red-400 font-semibold">Crimson</span> — The Son (Yeshua/Jesus)</p>
            <p><span className="inline-block w-2.5 h-2.5 rounded-full bg-slate-300 mr-2" /><span className="text-slate-300 font-semibold">Silver</span> — Angels or divine messengers</p>
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
          Use the <span className="text-white font-medium">Passage Selector</span> in the header to jump to any book and chapter.
        </p>
        <ol className="list-decimal list-inside space-y-2 mt-2 text-xs">
          <li>Click the <span className="text-blue-400 font-medium">Book dropdown</span> — select any of the 66 books.</li>
          <li>Select the <span className="text-blue-400 font-medium">Chapter number</span> from the second dropdown.</li>
          <li>Or use the <span className="text-white">chapter progress strip</span> below the reader nav — small dots you can tap to jump directly.</li>
        </ol>
        <div className="mt-3 p-3 rounded-xl bg-slate-800/60 border border-slate-700/50 text-xs">
          <p className="text-slate-400 uppercase tracking-widest mb-2">Translations</p>
          <div className="space-y-1">
            <p><span className="text-amber-400 font-mono">KJV</span> — King James Version (English baseline)</p>
            <p><span className="text-cyan-400 font-mono">TAHOT</span> — Hebrew OT interlinear (original manuscripts, word-level)</p>
            <p><span className="text-green-400 font-mono">TBESG</span> — Greek NT interlinear (original manuscripts, word-level)</p>
            <p><span className="text-purple-400 font-mono">BSB / WEB / ASV / YLT</span> — Additional English translations</p>
          </div>
        </div>
      </>
    ),
  },
  {
    id: 'parallel',
    icon: <Columns className="w-5 h-5 text-cyan-400" />,
    title: 'Parallel Mode — Two Translations Side by Side',
    color: 'border-cyan-500/30 bg-cyan-500/5',
    content: (
      <>
        <p>
          Parallel mode lets you compare any two translations verse-by-verse simultaneously — ideal for spotting English translation biases against the Hebrew/Greek originals.
        </p>
        <div className="mt-3 space-y-2 text-xs">
          <div className="p-3 rounded-xl bg-slate-800/60 border border-slate-700/50">
            <p className="text-white font-medium mb-1">Activating parallel mode</p>
            <p className="text-slate-400">Click the <span className="font-mono text-cyan-400">⫴</span> button in the header (next to the translation dropdown). A second translation selector appears.</p>
          </div>
          <div className="p-3 rounded-xl bg-slate-800/60 border border-slate-700/50">
            <p className="text-white font-medium mb-1">Layout</p>
            <p className="text-slate-400">On desktop, verses appear side-by-side with colored column headers showing which translation is primary (<span className="text-amber-400">gold</span>) and which is parallel (<span className="text-cyan-400">cyan</span>). On screens 640px and wider, the two-column layout activates. On very small phones, they stack vertically.</p>
          </div>
          <div className="p-3 rounded-xl bg-slate-800/60 border border-slate-700/50">
            <p className="text-white font-medium mb-1">Best combinations</p>
            <div className="text-slate-400 space-y-0.5">
              <p>• KJV vs TAHOT — see English vs Hebrew OT</p>
              <p>• KJV vs TBESG — see English vs Greek NT</p>
              <p>• TAHOT vs BSB — compare literal Hebrew to modern English</p>
            </div>
          </div>
        </div>
      </>
    ),
  },
  {
    id: 'reader',
    icon: <Eye className="w-5 h-5 text-purple-400" />,
    title: 'The Bible Reader — Verses, Clicks & Strong\'s Words',
    color: 'border-purple-500/30 bg-purple-500/5',
    content: (
      <>
        <div className="space-y-3">
          <div className="p-3 rounded-xl bg-slate-800/60 border border-slate-700/50">
            <div className="flex items-center gap-2 mb-1">
              <MousePointer className="w-3.5 h-3.5 text-purple-400" />
              <span className="text-white font-medium text-xs">Click the verse number</span>
            </div>
            <p className="text-xs text-slate-400">
              Clicking the number badge at the start of a verse selects it. On desktop, this automatically opens the Forensic Sidebar with the <span className="text-cyan-400 font-medium">AI Forensic Analyst</span> streaming a live report. On mobile, it selects the verse — then tap the gold button (bottom-right) to open the analysis panel.
            </p>
          </div>
          <div className="p-3 rounded-xl bg-slate-800/60 border border-slate-700/50">
            <div className="flex items-center gap-2 mb-1">
              <Hash className="w-3.5 h-3.5 text-cyan-400" />
              <span className="text-white font-medium text-xs">Tap Strong's numbers (H1234 / G5678)</span>
            </div>
            <p className="text-xs text-slate-400">
              In TAHOT/TBESG mode, each word shows its Strong's number as a small superscript. Tap any word to open the <span className="text-white">Strong's Panel</span>. On <span className="text-white">desktop</span> it slides in from the right. On <span className="text-white">mobile</span> it rises as a bottom sheet — scroll up inside it to read the full definition and concordance.
            </p>
          </div>
          <div className="p-3 rounded-xl bg-slate-800/60 border border-slate-700/50">
            <div className="flex items-center gap-2 mb-1">
              <Layers className="w-3.5 h-3.5 text-amber-400" />
              <span className="text-white font-medium text-xs">Voice Signature Colors</span>
            </div>
            <p className="text-xs text-slate-400">
              Verses are color-coded by speaker. <span className="text-amber-400">Gold</span> = the Father. <span className="text-red-400">Crimson</span> = the Son. <span className="text-slate-300">Silver</span> = angels. Click the pillar icons in the header to filter — showing only Father, Son, or Angel verses.
            </p>
          </div>
        </div>
      </>
    ),
  },
  {
    id: 'sidebar',
    icon: <Lightbulb className="w-5 h-5 text-amber-400" />,
    title: 'The Forensic Sidebar — Opening, Topics & Analysis',
    color: 'border-amber-500/30 bg-amber-500/5',
    content: (
      <>
        <p>
          The Forensic Sidebar starts <span className="text-white font-medium">closed</span> by default to keep the reading experience clean. Here is how to open it:
        </p>
        <div className="mt-3 space-y-2 text-xs">
          <div className="p-3 rounded-xl bg-slate-800/60 border border-slate-700/50">
            <div className="flex items-center gap-2 mb-1">
              <ChevronLeft className="w-3.5 h-3.5 text-amber-400" />
              <span className="text-white font-medium">Desktop — pull tab (right edge)</span>
            </div>
            <p className="text-slate-400">A vertical glowing tab sits at the right edge of the screen. When you have selected a verse it glows gold and reads "Analyse". Click it to open the sidebar. Click the <span className="text-white">Close</span> button inside to dismiss it.</p>
          </div>
          <div className="p-3 rounded-xl bg-slate-800/60 border border-slate-700/50">
            <div className="flex items-center gap-2 mb-1">
              <Menu className="w-3.5 h-3.5 text-amber-400" />
              <span className="text-white font-medium">Mobile — gold FAB (bottom right)</span>
            </div>
            <p className="text-slate-400">The floating gold button at the bottom-right opens the analysis panel as a full-screen overlay. When a verse has been selected it shows "Analyse" in the button. Tap it again or tap the backdrop to close.</p>
          </div>
          <div className="p-3 rounded-xl bg-slate-800/60 border border-slate-700/50">
            <p className="text-amber-400 font-medium mb-1">Two modes inside</p>
            <div className="text-slate-400 space-y-1">
              <p><span className="text-white">Topic Mode:</span> Click any topic pill (trinity, soul, godhead…) to search the knowledge base for forensic cards on that doctrine.</p>
              <p><span className="text-white">Verse Analysis Mode:</span> Triggered by clicking a verse. Shows the AI Analyst, the verse context, and the key Strong's words.</p>
            </div>
          </div>
          <div className="p-3 rounded-xl bg-red-900/20 border border-red-500/30">
            <p className="text-red-400 font-medium mb-1">Close buttons</p>
            <p className="text-slate-400">Every panel (Forensic Sidebar, Strong's Panel) has a prominent <span className="text-white">Close</span> button in the header — red-highlighted on hover. On mobile, tap outside the panel or use the Close button.</p>
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
          The <span className="text-cyan-400 font-medium">Forensic Scriptural Analyst</span> is a custom AI agent on Gemini 2.5 Pro, instructed to analyze Scripture using manuscript evidence.
        </p>
        <div className="mt-3 p-3 rounded-xl bg-cyan-900/20 border border-cyan-500/30 text-xs">
          <p className="text-cyan-400 font-semibold uppercase tracking-widest mb-2">How to activate</p>
          <ol className="space-y-2 list-none">
            {[
              'Navigate to any chapter.',
              'Click any verse number to select it.',
              'Open the Forensic Sidebar (pull tab on desktop, gold button on mobile).',
              'The Analyst card appears and streams its report live — watch the green "Live" dot.',
              'Type a follow-up question and press Enter or tap Ask.',
            ].map((step, i) => (
              <li key={i} className="flex gap-2.5">
                <span className="w-4 h-4 rounded-full bg-cyan-500/20 border border-cyan-500/40 text-cyan-400 text-[10px] font-bold flex items-center justify-center flex-shrink-0">{i+1}</span>
                <span className="text-slate-300">{step}</span>
              </li>
            ))}
          </ol>
        </div>
        <div className="mt-3 p-3 rounded-xl bg-slate-800/60 border border-slate-700/50 text-xs">
          <p className="text-slate-400 uppercase tracking-widest mb-1">Example follow-up questions</p>
          <div className="text-slate-300 space-y-1">
            <p>• "How is this verse used to support the Trinity and why is that wrong?"</p>
            <p>• "What does the Hebrew word here actually mean?"</p>
            <p>• "Compare this to Deuteronomy 6:4 — is there a contradiction?"</p>
            <p>• "What did the early church actually believe about this passage?"</p>
          </div>
        </div>
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
          The Strong's Panel opens when you tap any word in TAHOT or TBESG mode. It shows:
        </p>
        <ul className="mt-2 space-y-1 text-xs list-disc list-inside text-slate-300">
          <li>The Strong's number (e.g. <span className="text-cyan-400 font-mono">H430</span> = Elohim)</li>
          <li>The original Hebrew or Greek word with transliteration</li>
          <li>Full lexicon definition from STEPBible</li>
          <li>Every verse in Scripture where that word appears</li>
          <li>Related media images from the vault</li>
        </ul>
        <div className="mt-3 space-y-2 text-xs">
          <div className="p-3 rounded-xl bg-slate-800/60 border border-slate-700/50">
            <p className="text-white font-medium mb-1">Desktop behavior</p>
            <p className="text-slate-400">Slides in as a floating panel from the right side. Sits next to the sidebar if both are open. Close with the <span className="text-white">Close</span> button or click away.</p>
          </div>
          <div className="p-3 rounded-xl bg-slate-800/60 border border-slate-700/50">
            <p className="text-white font-medium mb-1">Mobile behavior</p>
            <p className="text-slate-400">Rises as a <span className="text-white">bottom sheet</span> — slides up from the bottom of the screen. Scroll inside it to see the concordance. Tap the dark backdrop above it or use the Close button to dismiss.</p>
          </div>
        </div>
      </>
    ),
  },
  {
    id: 'mobile',
    icon: <Smartphone className="w-5 h-5 text-green-400" />,
    title: 'Mobile Navigation — Everything at Your Fingertips',
    color: 'border-green-500/30 bg-green-500/5',
    content: (
      <>
        <p>ISA820 is fully designed for mobile. Here is every touch interaction:</p>
        <div className="mt-3 space-y-2 text-xs">
          {[
            ['Gold FAB (bottom-right)', 'The primary action button. Tap to open/close the Forensic Sidebar overlay. When a verse is selected, it shows "Analyse" — tap to jump straight to the AI report.'],
            ['Verse number tap', 'Selects the verse. The FAB label changes to "Analyse". Then tap the FAB to open the Analyst in the sidebar.'],
            ['Strong\'s word tap', 'Triggers the bottom sheet — a full-width panel rising from the bottom. Swipe or scroll inside it. Tap the handle or Close to dismiss.'],
            ['Header controls', 'Book/chapter dropdowns, pillar icons, and translation selector all work on mobile. They compact to smaller sizes automatically.'],
            ['Passage Selector', 'Shows below the header on mobile — full width, easy to reach with thumbs.'],
            ['Chapter progress strip', 'Below the NavBar — small dots you can tap to jump chapters. Scroll it horizontally if there are many chapters.'],
          ].map(([label, desc]) => (
            <div key={label} className="p-3 rounded-xl bg-slate-800/60 border border-slate-700/50">
              <p className="text-white font-medium mb-0.5">{label}</p>
              <p className="text-slate-400">{desc}</p>
            </div>
          ))}
        </div>
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
          The three icons in the header are the <span className="text-white font-medium">Three Pillars</span> — doctrinal anchors that also act as speaker filters.
        </p>
        <div className="mt-3 space-y-2 text-xs">
          {[
            ['🔦 ISA 8:20 — The Standard (gold)', 'The measuring rod. Click to filter the reader to show only Father (Yahweh) speaking verses, highlighted in gold. Click again to clear.'],
            ['① DEUT 6:4 — The Identity (blue)', 'The Shema. "Yahweh our Elohim, Yahweh is one." Click to show only Son (Yeshua) speaking verses. A consistency check against Trinitarian claims.'],
            ['✦ Nature — Divine Manifestation', 'Cycles through Fire (judgment/amber), Whisper (guidance/cyan), Light (purity/white). Click to cycle and to filter for Angel/messenger verses. Hover for what each mode represents.'],
          ].map(([title, desc]) => (
            <div key={title} className="p-3 rounded-xl bg-slate-800/60 border border-slate-700/50">
              <p className="text-white font-medium mb-0.5 text-xs">{title}</p>
              <p className="text-slate-400">{desc}</p>
            </div>
          ))}
        </div>
      </>
    ),
  },
  {
    id: 'knowledge',
    icon: <Database className="w-5 h-5 text-purple-400" />,
    title: 'Knowledge Base — Topics & How to Expand Them',
    color: 'border-purple-500/30 bg-purple-500/5',
    badge: 'Admin guide',
    content: (
      <>
        <p>
          The Forensic Sidebar's topic pills pull from the <span className="text-white font-medium">knowledge_base</span> table in Supabase. Here is how to expand it:
        </p>
        <div className="mt-3 space-y-3 text-xs">
          <div className="p-3 rounded-xl bg-slate-800/60 border border-slate-700/50">
            <p className="text-purple-400 font-semibold mb-2">Option 1 — Supabase Dashboard (easiest)</p>
            <ol className="space-y-1 text-slate-300 list-decimal list-inside">
              <li>Open <span className="text-cyan-400 font-mono">supabase.com → your project → Table Editor</span></li>
              <li>Select the <span className="text-white font-mono">knowledge_base</span> table</li>
              <li>Click <span className="text-white">Insert Row</span> and fill in these fields:</li>
            </ol>
            <div className="mt-2 space-y-0.5 font-mono text-slate-400">
              <p><span className="text-cyan-400">topic</span> — e.g. "baptism", "atonement", "logos"</p>
              <p><span className="text-cyan-400">title</span> — Short title for the card</p>
              <p><span className="text-cyan-400">content</span> — Your forensic analysis text</p>
              <p><span className="text-cyan-400">supporting_verses</span> — Array: ["John 1:1", "Deut 6:4"]</p>
              <p><span className="text-cyan-400">related_topics</span> — Array: ["trinity", "godhead"]</p>
              <p><span className="text-cyan-400">confidence_level</span> — Number 1–10 (affects sort order)</p>
            </div>
          </div>
          <div className="p-3 rounded-xl bg-slate-800/60 border border-slate-700/50">
            <p className="text-purple-400 font-semibold mb-2">Option 2 — SQL (bulk add)</p>
            <pre className="text-[10px] text-slate-300 overflow-x-auto bg-slate-900/60 p-2 rounded-lg leading-relaxed">{`INSERT INTO knowledge_base
  (topic, title, content, supporting_verses,
   related_topics, confidence_level)
VALUES
  ('baptism',
   'Water Baptism vs Spirit Baptism',
   'Your forensic analysis here...',
   ARRAY['Acts 2:38', 'Matthew 3:11'],
   ARRAY['holy spirit', 'salvation'],
   8);`}</pre>
          </div>
          <div className="p-3 rounded-xl bg-slate-800/60 border border-slate-700/50">
            <p className="text-purple-400 font-semibold mb-2">Adding new topic pills to the sidebar</p>
            <p className="text-slate-400 mb-2">The topic pill list is in <span className="text-white font-mono">src/shared/components/ForensicSidebar.tsx</span>, in the <span className="text-cyan-400 font-mono">TOPICS</span> array. Add any string — it becomes a searchable pill:</p>
            <pre className="text-[10px] text-slate-300 bg-slate-900/60 p-2 rounded-lg overflow-x-auto">{`const TOPICS = [
  'soul', 'trinity', 'godhead', 'oneness',
  'alpha-omega', 'father', 'son', 'deity',
  'genesis', 'revelation', 'yahweh',
  // Add new topics here:
  'baptism', 'atonement', 'logos',
  'rapture', 'sabbath', 'tithing',
  'prayer', 'prophecy', 'resurrection',
];`}</pre>
            <p className="text-slate-500 mt-2">Keep topics lowercase, single-word or hyphenated. They match against the <span className="font-mono">topic</span> and <span className="font-mono">title</span> fields in knowledge_base.</p>
          </div>
          <div className="p-3 rounded-xl bg-amber-900/20 border border-amber-500/30">
            <p className="text-amber-400 font-semibold mb-1">Priority topics to add</p>
            <div className="flex flex-wrap gap-1.5 mt-1">
              {['baptism','atonement','logos','rapture','sabbath','tithing','prayer','resurrection','prophecy','law','grace','faith','worship','covenant','messiah','salvation','spirit','creation','sin','judgment'].map(t => (
                <span key={t} className="px-2 py-0.5 rounded-full text-[10px] bg-slate-800 text-slate-400 border border-slate-700">{t}</span>
              ))}
            </div>
          </div>
        </div>
      </>
    ),
  },
  {
    id: 'deeplink',
    icon: <MessageSquare className="w-5 h-5 text-slate-400" />,
    title: 'Deep-Link URLs — Sharing Passages Directly',
    color: 'border-slate-500/30 bg-slate-500/5',
    content: (
      <>
        <p>Every chapter has its own shareable URL:</p>
        <code className="block mt-2 p-2 bg-slate-900/60 rounded-lg text-cyan-400 text-xs font-mono">
          /read/[Book]/[Chapter]
        </code>
        <div className="mt-3 space-y-1 text-xs font-mono text-slate-400">
          <p><span className="text-cyan-400">/read/Genesis/1</span> — Creation</p>
          <p><span className="text-cyan-400">/read/Isaiah/9</span> — "Wonderful Counsellor"</p>
          <p><span className="text-cyan-400">/read/John/1</span> — "In the beginning was the Word"</p>
          <p><span className="text-cyan-400">/read/Deuteronomy/6</span> — The Shema</p>
        </div>
        <p className="mt-3 text-xs text-slate-400">
          Share these directly. Anyone who opens the link lands on that passage — with the Forensic Analyst ready to activate.
        </p>
      </>
    ),
  },
];

export default function GuidePage() {
  return (
    <div className="min-h-screen flex flex-col relative overflow-x-hidden">
      <div className="aurora-bg" aria-hidden="true" />

      <div className="relative z-10 flex flex-col min-h-screen">
        {/* Header */}
        <header className="sticky top-0 z-50 glass-deep border-b border-white/5 px-4 py-3">
          <div className="max-w-3xl mx-auto flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <svg viewBox="0 0 44 44" className="w-9 h-9" aria-hidden="true">
                <defs>
                  <linearGradient id="gLogoG" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#fbbf24" />
                    <stop offset="100%" stopColor="#d97706" />
                  </linearGradient>
                </defs>
                <polygon points="22,2 34,6 42,17 42,27 34,38 22,42 10,38 2,27 2,17 10,6"
                  fill="none" stroke="url(#gLogoG)" strokeWidth="1.2" opacity="0.7" />
                <rect x="19.5" y="13" width="5" height="18" rx="1" fill="url(#gLogoG)" />
                <rect x="15" y="13" width="14" height="3" rx="1" fill="url(#gLogoG)" opacity="0.9" />
                <rect x="15" y="28" width="14" height="3" rx="1" fill="url(#gLogoG)" opacity="0.9" />
              </svg>
              <div>
                <h1 className="text-base font-bold text-gradient-gold" style={{ fontFamily: 'var(--font-cinzel), serif', letterSpacing: '0.1em' }}>ISA820</h1>
                <p className="text-[10px] text-slate-500 tracking-widest uppercase">The Forensic Standard</p>
              </div>
            </div>
            <Link
              href="/"
              className="flex items-center gap-2 px-3 sm:px-4 py-2 btn-ghost rounded-xl text-sm text-slate-300 border border-white/5"
            >
              <ArrowLeft className="w-4 h-4" />
              <span className="hidden sm:inline">Back to Reader</span>
              <span className="sm:hidden">Reader</span>
            </Link>
          </div>
        </header>

        <main className="flex-1 py-8 sm:py-10 px-4">
          <div className="max-w-3xl mx-auto">
            {/* Hero */}
            <motion.div
              initial={{ opacity: 0, y: -16 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-center mb-8 sm:mb-10"
            >
              <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-amber-500/10 border border-amber-500/25 text-amber-400 text-xs mb-4">
                <BookOpen className="w-3.5 h-3.5" />
                User Guide
              </div>
              <h1
                className="text-2xl sm:text-3xl font-bold text-gradient-gold mb-3"
                style={{ fontFamily: 'var(--font-cinzel), serif' }}
              >
                How to Use ISA820
              </h1>
              <p className="text-slate-500 text-sm max-w-xl mx-auto leading-relaxed">
                Complete guide to the Forensic Standard — navigating Scripture, the AI Analyst, Strong's lookup, parallel mode, mobile navigation, and expanding the knowledge base.
              </p>
            </motion.div>

            {/* Sections */}
            <div className="space-y-3">
              {SECTIONS.map((section, i) => (
                <motion.div
                  key={section.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.04 }}
                >
                  <AccordionSection section={section} defaultOpen={section.id === 'quickstart'} />
                </motion.div>
              ))}
            </div>

            {/* CTA */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.4 }}
              className="mt-10 text-center"
            >
              <Link
                href="/"
                className="inline-flex items-center gap-2 px-6 py-3 btn-primary rounded-xl text-sm font-semibold"
              >
                <Sparkles className="w-4 h-4" />
                Open the Reader
              </Link>
            </motion.div>
          </div>
        </main>

        <footer className="glass-card rounded-none border-t border-white/5 px-4 py-3 text-center text-xs text-slate-600">
          ISA820 — The Forensic Standard · Manuscript-First Biblical Analysis
        </footer>
      </div>
    </div>
  );
}
