'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { useISA820Store } from '@/store/isa820-store';
import { Compass, X, Search, ChevronRight, ArrowLeft } from 'lucide-react';

// ── Book data ────────────────────────────────────────────────────────────────
const BOOKS = [
  // Old Testament
  { book: 'Genesis',         abbrev: 'Gen',    chapters: 50,  testament: 'OT' },
  { book: 'Exodus',          abbrev: 'Exod',   chapters: 40,  testament: 'OT' },
  { book: 'Leviticus',       abbrev: 'Lev',    chapters: 27,  testament: 'OT' },
  { book: 'Numbers',         abbrev: 'Num',    chapters: 36,  testament: 'OT' },
  { book: 'Deuteronomy',     abbrev: 'Deut',   chapters: 34,  testament: 'OT' },
  { book: 'Joshua',          abbrev: 'Josh',   chapters: 24,  testament: 'OT' },
  { book: 'Judges',          abbrev: 'Judg',   chapters: 21,  testament: 'OT' },
  { book: 'Ruth',            abbrev: 'Ruth',   chapters: 4,   testament: 'OT' },
  { book: '1 Samuel',        abbrev: '1 Sam',  chapters: 31,  testament: 'OT' },
  { book: '2 Samuel',        abbrev: '2 Sam',  chapters: 24,  testament: 'OT' },
  { book: '1 Kings',         abbrev: '1 Kgs',  chapters: 22,  testament: 'OT' },
  { book: '2 Kings',         abbrev: '2 Kgs',  chapters: 25,  testament: 'OT' },
  { book: '1 Chronicles',    abbrev: '1 Chr',  chapters: 29,  testament: 'OT' },
  { book: '2 Chronicles',    abbrev: '2 Chr',  chapters: 36,  testament: 'OT' },
  { book: 'Ezra',            abbrev: 'Ezra',   chapters: 10,  testament: 'OT' },
  { book: 'Nehemiah',        abbrev: 'Neh',    chapters: 13,  testament: 'OT' },
  { book: 'Esther',          abbrev: 'Est',    chapters: 10,  testament: 'OT' },
  { book: 'Job',             abbrev: 'Job',    chapters: 42,  testament: 'OT' },
  { book: 'Psalms',          abbrev: 'Ps',     chapters: 150, testament: 'OT' },
  { book: 'Proverbs',        abbrev: 'Prov',   chapters: 31,  testament: 'OT' },
  { book: 'Ecclesiastes',    abbrev: 'Eccl',   chapters: 12,  testament: 'OT' },
  { book: 'Song of Solomon', abbrev: 'Song',   chapters: 8,   testament: 'OT' },
  { book: 'Isaiah',          abbrev: 'Isa',    chapters: 66,  testament: 'OT' },
  { book: 'Jeremiah',        abbrev: 'Jer',    chapters: 52,  testament: 'OT' },
  { book: 'Lamentations',    abbrev: 'Lam',    chapters: 5,   testament: 'OT' },
  { book: 'Ezekiel',         abbrev: 'Ezek',   chapters: 48,  testament: 'OT' },
  { book: 'Daniel',          abbrev: 'Dan',    chapters: 12,  testament: 'OT' },
  { book: 'Hosea',           abbrev: 'Hos',    chapters: 14,  testament: 'OT' },
  { book: 'Joel',            abbrev: 'Joel',   chapters: 3,   testament: 'OT' },
  { book: 'Amos',            abbrev: 'Amos',   chapters: 9,   testament: 'OT' },
  { book: 'Obadiah',         abbrev: 'Obad',   chapters: 1,   testament: 'OT' },
  { book: 'Jonah',           abbrev: 'Jonah',  chapters: 4,   testament: 'OT' },
  { book: 'Micah',           abbrev: 'Mic',    chapters: 7,   testament: 'OT' },
  { book: 'Nahum',           abbrev: 'Nah',    chapters: 3,   testament: 'OT' },
  { book: 'Habakkuk',        abbrev: 'Hab',    chapters: 3,   testament: 'OT' },
  { book: 'Zephaniah',       abbrev: 'Zeph',   chapters: 3,   testament: 'OT' },
  { book: 'Haggai',          abbrev: 'Hag',    chapters: 2,   testament: 'OT' },
  { book: 'Zechariah',       abbrev: 'Zech',   chapters: 14,  testament: 'OT' },
  { book: 'Malachi',         abbrev: 'Mal',    chapters: 4,   testament: 'OT' },
  // New Testament
  { book: 'Matthew',          abbrev: 'Matt',    chapters: 28, testament: 'NT' },
  { book: 'Mark',             abbrev: 'Mark',    chapters: 16, testament: 'NT' },
  { book: 'Luke',             abbrev: 'Luke',    chapters: 24, testament: 'NT' },
  { book: 'John',             abbrev: 'John',    chapters: 21, testament: 'NT' },
  { book: 'Acts',             abbrev: 'Acts',    chapters: 28, testament: 'NT' },
  { book: 'Romans',           abbrev: 'Rom',     chapters: 16, testament: 'NT' },
  { book: '1 Corinthians',    abbrev: '1 Cor',   chapters: 16, testament: 'NT' },
  { book: '2 Corinthians',    abbrev: '2 Cor',   chapters: 13, testament: 'NT' },
  { book: 'Galatians',        abbrev: 'Gal',     chapters: 6,  testament: 'NT' },
  { book: 'Ephesians',        abbrev: 'Eph',     chapters: 6,  testament: 'NT' },
  { book: 'Philippians',      abbrev: 'Phil',    chapters: 4,  testament: 'NT' },
  { book: 'Colossians',       abbrev: 'Col',     chapters: 4,  testament: 'NT' },
  { book: '1 Thessalonians',  abbrev: '1 Thess', chapters: 5,  testament: 'NT' },
  { book: '2 Thessalonians',  abbrev: '2 Thess', chapters: 3,  testament: 'NT' },
  { book: '1 Timothy',        abbrev: '1 Tim',   chapters: 6,  testament: 'NT' },
  { book: '2 Timothy',        abbrev: '2 Tim',   chapters: 4,  testament: 'NT' },
  { book: 'Titus',            abbrev: 'Titus',   chapters: 3,  testament: 'NT' },
  { book: 'Philemon',         abbrev: 'Phlm',    chapters: 1,  testament: 'NT' },
  { book: 'Hebrews',          abbrev: 'Heb',     chapters: 13, testament: 'NT' },
  { book: 'James',            abbrev: 'Jas',     chapters: 5,  testament: 'NT' },
  { book: '1 Peter',          abbrev: '1 Pet',   chapters: 5,  testament: 'NT' },
  { book: '2 Peter',          abbrev: '2 Pet',   chapters: 3,  testament: 'NT' },
  { book: '1 John',           abbrev: '1 John',  chapters: 5,  testament: 'NT' },
  { book: '2 John',           abbrev: '2 John',  chapters: 1,  testament: 'NT' },
  { book: '3 John',           abbrev: '3 John',  chapters: 1,  testament: 'NT' },
  { book: 'Jude',             abbrev: 'Jude',    chapters: 1,  testament: 'NT' },
  { book: 'Revelation',       abbrev: 'Rev',     chapters: 22, testament: 'NT' },
] as const;

type Book = (typeof BOOKS)[number];
type SearchResult = Book & { chapter?: number; verse?: number };

const OT_BOOKS = BOOKS.filter(b => b.testament === 'OT');
const NT_BOOKS = BOOKS.filter(b => b.testament === 'NT');

// ── Forgiving reference parser ────────────────────────────────────────────────
// Handles: "john 3 16", "1cor 13", "isa 8 20", "ps 23", "gen 1:1", "1Tim4"
function parseRef(input: string): SearchResult | null {
  if (!input.trim()) return null;

  let s = input.trim().toLowerCase().replace(/[.,;!?]/g, '');
  s = s.replace(/^([123])\s*([a-z])/, '$1 $2');  // "1cor" → "1 cor"
  s = s.replace(/([a-z])(\d)/g, '$1 $2');          // "john3" → "john 3"
  s = s.replace(/\s+/g, ' ').trim();

  for (const p of BOOKS) {
    const bookLow  = p.book.toLowerCase();
    const abbrevLow = p.abbrev.toLowerCase();

    let rest: string | null = null;
    if      (s === bookLow || s === abbrevLow)     rest = '';
    else if (s.startsWith(bookLow + ' '))          rest = s.slice(bookLow.length).trim();
    else if (s.startsWith(abbrevLow + ' '))        rest = s.slice(abbrevLow.length).trim();

    if (rest === null) continue;
    if (rest === '')   return { ...p } as SearchResult;

    const nums = rest.split(/[:\s]+/).map(Number).filter(n => !isNaN(n) && n > 0);
    const chapter = nums[0];
    const verse   = nums[1];
    if (!chapter || chapter < 1 || chapter > p.chapters) return { ...p } as SearchResult;
    return { ...p, chapter, verse } as SearchResult;
  }
  return null;
}

function searchBooks(query: string): SearchResult[] {
  if (!query.trim()) return [];
  const q = query.toLowerCase();
  const results: SearchResult[] = [];

  const parsed = parseRef(query);
  if (parsed) results.push(parsed);

  for (const p of BOOKS) {
    if (
      (p.book.toLowerCase().includes(q) || p.abbrev.toLowerCase().includes(q)) &&
      !results.find(r => r.book === p.book)
    ) {
      results.push({ ...p } as SearchResult);
    }
  }
  return results.slice(0, 8);
}

// ── Panel ─────────────────────────────────────────────────────────────────────
function QuickNavPanel({ onClose }: { onClose: () => void }) {
  const [step, setStep]               = useState<'browse' | 'chapter'>('browse');
  const [selectedBook, setSelectedBook] = useState<Book | null>(null);
  const [textQuery, setTextQuery]     = useState('');
  const [verseNum, setVerseNum]       = useState('');
  const inputRef = useRef<HTMLInputElement>(null);
  const { setCurrentPassage } = useISA820Store();
  const router = useRouter();

  const textResults = searchBooks(textQuery);

  const navigate = useCallback((book: string, chapter: number, verse?: number) => {
    setCurrentPassage({ book, chapter, verse });
    router.push(`/read/${encodeURIComponent(book)}/${chapter}`);
    onClose();
  }, [setCurrentPassage, router, onClose]);

  useEffect(() => {
    setTimeout(() => inputRef.current?.focus(), 150);
  }, []);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onClose]);

  const goBack = () => { setStep('browse'); setSelectedBook(null); setVerseNum(''); };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex flex-col items-center justify-end sm:justify-center p-0 sm:p-4"
    >
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />

      <motion.div
        initial={{ y: 60, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 60, opacity: 0 }}
        transition={{ type: 'spring', damping: 30, stiffness: 280 }}
        className="relative w-full sm:max-w-lg glass-deep glass-panel-solid rounded-t-2xl sm:rounded-2xl flex flex-col"
        style={{ maxHeight: 'min(85vh, 640px)' }}
      >
        {/* Mobile drag handle */}
        <div className="flex justify-center pt-3 sm:hidden flex-shrink-0">
          <div className="w-10 h-1 rounded-full bg-slate-600" />
        </div>

        {/* Header */}
        <div className="flex items-center gap-3 px-4 pt-4 pb-3 border-b border-white/5 flex-shrink-0">
          {step === 'chapter' && selectedBook ? (
            <button onClick={goBack} className="p-1.5 rounded-lg hover:bg-slate-700/60 text-slate-400 hover:text-white transition-colors" aria-label="Back">
              <ArrowLeft className="w-4 h-4" />
            </button>
          ) : (
            <Compass className="w-4 h-4 text-amber-400 flex-shrink-0" />
          )}
          <div className="flex-1 min-w-0">
            <h2 className="text-sm font-semibold text-white truncate" style={{ fontFamily: 'var(--font-cinzel), serif', letterSpacing: '0.05em' }}>
              {step === 'chapter' && selectedBook ? selectedBook.book : 'Quick Navigation'}
            </h2>
            <p className="text-[11px] text-slate-500">
              {step === 'chapter' && selectedBook
                ? `${selectedBook.chapters} chapters — tap a chapter or add a verse`
                : 'Search or browse all 66 books'}
            </p>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-slate-700/60 text-slate-400 hover:text-white transition-colors flex-shrink-0" aria-label="Close">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* ── Browse ───────────────────────────────────────────────────────── */}
        {step === 'browse' && (
          <>
            <div className="px-4 pt-3 pb-2 flex-shrink-0">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                <input
                  ref={inputRef}
                  value={textQuery}
                  onChange={e => setTextQuery(e.target.value)}
                  placeholder='"John 3:16", "Isa 8 20", "1cor 13", "Ps 23"…'
                  className="w-full pl-9 pr-4 py-2.5 bg-slate-800/60 border border-slate-700/50 rounded-xl text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:border-amber-500/50"
                  onKeyDown={e => {
                    if (e.key === 'Enter' && textResults.length > 0) {
                      const r = textResults[0];
                      navigate(r.book, r.chapter || 1, r.verse);
                    }
                  }}
                />
              </div>

              <AnimatePresence>
                {textQuery && textResults.length > 0 && (
                  <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="mt-2 space-y-1">
                    {textResults.map((r, i) => (
                      <button
                        key={`${r.book}-${i}`}
                        onClick={() => navigate(r.book, r.chapter || 1, r.verse)}
                        className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl bg-slate-800/40 hover:bg-amber-500/10 border border-slate-700/30 hover:border-amber-500/30 transition-all text-left"
                      >
                        <span className="text-[11px] font-mono text-amber-400/70 w-14 flex-shrink-0 truncate">{r.abbrev}</span>
                        <span className="text-sm text-white flex-1 min-w-0">
                          {r.book}
                          {r.chapter ? <span className="text-amber-400"> {r.chapter}</span> : ''}
                          {r.verse   ? <span className="text-slate-400">:{r.verse}</span>   : ''}
                        </span>
                        <ChevronRight className="w-3.5 h-3.5 text-slate-600 flex-shrink-0" />
                      </button>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {!textQuery && (
              <div className="flex-1 overflow-y-auto px-4 pb-6 min-h-0">
                <p className="text-[10px] uppercase tracking-widest text-slate-600 mb-2 mt-1">Old Testament · 39 books</p>
                <div className="grid grid-cols-2 gap-1.5 mb-5">
                  {OT_BOOKS.map(b => (
                    <button
                      key={b.book}
                      onClick={() => { setSelectedBook(b); setStep('chapter'); }}
                      className="flex items-center justify-between px-3 py-2 rounded-xl bg-slate-800/40 border border-slate-700/30 hover:bg-amber-500/10 hover:border-amber-500/30 transition-all text-left group"
                    >
                      <span className="text-sm text-slate-200 group-hover:text-white truncate leading-tight">{b.book}</span>
                      <span className="text-[10px] text-slate-600 flex-shrink-0 ml-1">{b.chapters}</span>
                    </button>
                  ))}
                </div>
                <p className="text-[10px] uppercase tracking-widest text-slate-600 mb-2">New Testament · 27 books</p>
                <div className="grid grid-cols-2 gap-1.5">
                  {NT_BOOKS.map(b => (
                    <button
                      key={b.book}
                      onClick={() => { setSelectedBook(b); setStep('chapter'); }}
                      className="flex items-center justify-between px-3 py-2 rounded-xl bg-slate-800/40 border border-slate-700/30 hover:bg-cyan-500/10 hover:border-cyan-500/30 transition-all text-left group"
                    >
                      <span className="text-sm text-slate-200 group-hover:text-white truncate leading-tight">{b.book}</span>
                      <span className="text-[10px] text-slate-600 flex-shrink-0 ml-1">{b.chapters}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </>
        )}

        {/* ── Chapter grid ─────────────────────────────────────────────────── */}
        {step === 'chapter' && selectedBook && (
          <div className="flex-1 overflow-y-auto px-4 pb-6 min-h-0">
            <div className="flex items-center gap-2 my-3">
              <input
                type="number"
                min="1"
                placeholder="Verse number (optional)"
                value={verseNum}
                onChange={e => setVerseNum(e.target.value)}
                className="flex-1 px-3 py-2 bg-slate-800/60 border border-slate-700/50 rounded-xl text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:border-amber-500/50"
              />
              <p className="text-xs text-slate-500 flex-shrink-0">then tap chapter</p>
            </div>
            <p className="text-[10px] uppercase tracking-widest text-slate-600 mb-2">Select Chapter</p>
            <div className="grid grid-cols-5 sm:grid-cols-6 gap-1.5">
              {Array.from({ length: selectedBook.chapters }, (_, i) => i + 1).map(ch => (
                <button
                  key={ch}
                  onClick={() => navigate(selectedBook.book, ch, verseNum ? parseInt(verseNum) : undefined)}
                  className="h-10 rounded-xl text-sm font-medium bg-slate-800/40 border border-slate-700/30 hover:bg-amber-500/20 hover:border-amber-500/40 hover:text-amber-400 text-slate-300 transition-all"
                >
                  {ch}
                </button>
              ))}
            </div>
          </div>
        )}
      </motion.div>
    </motion.div>
  );
}

// ── Public export ─────────────────────────────────────────────────────────────
export function QuickNavButton() {
  const [isOpen, setIsOpen] = useState(false);
  const open  = useCallback(() => setIsOpen(true),  []);
  const close = useCallback(() => setIsOpen(false), []);

  return (
    <>
      <button
        onClick={open}
        className="p-2 rounded-lg btn-ghost border-white/0 flex items-center gap-1.5"
        aria-label="Quick navigation — go to any book, chapter or verse"
        title="Quick navigation"
      >
        <Compass className="w-4 h-4 sm:w-5 sm:h-5 text-amber-400/80" />
      </button>
      <AnimatePresence>
        {isOpen && <QuickNavPanel key="quick-nav" onClose={close} />}
      </AnimatePresence>
    </>
  );
}
