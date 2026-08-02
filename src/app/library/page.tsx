'use client';

import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import { PillarHeader } from '@/shared/components/PillarHeader';
import { supabase } from '@/lib/supabase';
import type { StrongNumber } from '@/lib/supabase';
import {
  Search,
  BookOpen,
  Loader2,
  Library,
  Languages,
  ChevronRight,
  Hash,
  Info,
} from 'lucide-react';

const LANG_COLORS = {
  hebrew: 'bg-amber-500/15 text-amber-400 border-amber-500/25',
  greek:  'bg-blue-500/15 text-blue-400 border-blue-500/25',
};

function LexiconCard({ entry }: { entry: StrongNumber }) {
  const [open, setOpen] = useState(false);
  const isHebrew = entry.origin_language === 'hebrew';

  return (
    <motion.div
      layout
      className={`border rounded-xl overflow-hidden ${
        isHebrew
          ? 'border-amber-500/15 bg-amber-500/5'
          : 'border-blue-500/15 bg-blue-500/5'
      }`}
    >
      <button
        onClick={() => setOpen(!open)}
        className="w-full p-3 flex items-center gap-3 hover:bg-white/5 transition-colors text-left"
      >
        <span className={`text-xs font-mono font-bold px-2 py-0.5 rounded border flex-shrink-0 ${LANG_COLORS[entry.origin_language]}`}>
          {entry.strongs_id}
        </span>
        <div className="flex-1 min-w-0">
          <span className="text-white font-medium text-sm">{entry.word}</span>
          {entry.transliteration && (
            <span className="text-slate-400 text-xs ml-2">({entry.transliteration})</span>
          )}
        </div>
        <span className="text-slate-500 text-xs hidden sm:block flex-shrink-0 max-w-[40%] truncate">
          {entry.definition.split(';')[0].trim()}
        </span>
        <ChevronRight className={`w-3.5 h-3.5 text-slate-500 flex-shrink-0 transition-transform ${open ? 'rotate-90' : ''}`} />
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden border-t border-white/5"
          >
            <div className="p-3 space-y-2">
              <div className="flex items-center gap-2 flex-wrap">
                <span className={`text-[10px] px-2 py-0.5 rounded-full border font-semibold uppercase ${LANG_COLORS[entry.origin_language]}`}>
                  {entry.origin_language}
                </span>
                {entry.part_of_speech && (
                  <span className="text-[10px] px-2 py-0.5 bg-slate-800/60 text-slate-400 rounded border border-slate-700/50">
                    {entry.part_of_speech}
                  </span>
                )}
                {entry.pronunciation_guide && (
                  <span className="text-[10px] text-slate-500 font-mono">
                    /{entry.pronunciation_guide}/
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-300 leading-relaxed">{entry.definition}</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

type LangFilter = 'all' | 'hebrew' | 'greek';

export default function LibraryPage() {
  const [search, setSearch] = useState('');
  const [lang, setLang] = useState<LangFilter>('all');
  const [results, setResults] = useState<StrongNumber[]>([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    const q = search.trim();

    if (!q) {
      setResults([]);
      setSearched(false);
      return;
    }

    debounceRef.current = setTimeout(async () => {
      setLoading(true);

      let query = supabase
        .from('strongs_lexicon')
        .select('*')
        .limit(40);

      if (lang !== 'all') {
        query = query.eq('origin_language', lang);
      }

      const numMatch = q.match(/^[hgHG]?(\d+)$/);
      if (numMatch) {
        // Searching "G32" used to run ilike '%G32%', which cannot match the
        // stored "G0032G" — the substring "G32" simply is not in it. The lexicon
        // pads to four digits and appends a disambiguation suffix, so normalise
        // the query the same way and match the whole family by prefix.
        const prefix = /^h/i.test(q) ? 'H' : /^g/i.test(q) ? 'G' : '';
        const padded = numMatch[1].padStart(4, '0');
        query = prefix
          ? query.ilike('strongs_id', `${prefix}${padded}%`)
          // No H/G given: match either language's family, e.g. "32" -> H0032*/G0032*
          : query.or(`strongs_id.ilike.H${padded}%,strongs_id.ilike.G${padded}%`);
      } else {
        query = query.or(
          `word.ilike.%${q}%,transliteration.ilike.%${q}%,definition.ilike.%${q}%`
        );
      }

      const { data } = await query.order('strongs_id');
      setResults(data || []);
      setSearched(true);
      setLoading(false);
    }, 300);

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [search, lang]);

  return (
    <div className="min-h-screen flex flex-col relative">
      <div className="aurora-bg" aria-hidden="true" />

      <div className="relative z-10 flex flex-col min-h-screen">
        <PillarHeader />

        <main className="flex-1 max-w-4xl mx-auto w-full px-4 py-8">
          <motion.div
            initial={{ opacity: 0, y: -12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="mb-8"
          >
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-xl bg-blue-500/15 flex items-center justify-center">
                <Library className="w-5 h-5 text-blue-400" />
              </div>
              <div>
                <h1
                  className="text-2xl sm:text-3xl font-bold"
                  style={{
                    fontFamily: 'var(--font-cinzel), serif',
                    background: 'linear-gradient(135deg, #93c5fd 0%, #60a5fa 100%)',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                  }}
                >
                  Reference Library
                </h1>
                <p className="text-slate-500 text-xs sm:text-sm mt-0.5">
                  Strong&apos;s Lexicon · Hebrew &amp; Greek · 20,000+ entries
                </p>
              </div>
            </div>

            <div className="flex gap-2 mt-5">
              <div className="relative flex-1">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                <input
                  type="text"
                  placeholder="H2896 · tov · logos · G3056 · light · functional…"
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-800/60 border border-slate-700/50 rounded-xl text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:border-blue-500/50 transition-colors"
                />
              </div>
              <div className="flex rounded-xl overflow-hidden border border-slate-700/50 flex-shrink-0">
                {(['all', 'hebrew', 'greek'] as LangFilter[]).map(l => (
                  <button
                    key={l}
                    onClick={() => setLang(l)}
                    className={`px-3 py-2 text-xs font-medium transition-colors ${
                      lang === l
                        ? l === 'hebrew'
                          ? 'bg-amber-500/20 text-amber-400'
                          : l === 'greek'
                            ? 'bg-blue-500/20 text-blue-400'
                            : 'bg-slate-700/60 text-slate-200'
                        : 'bg-slate-800/60 text-slate-500 hover:text-slate-300'
                    }`}
                  >
                    {l === 'all' ? 'All' : l === 'hebrew' ? 'H' : 'G'}
                  </button>
                ))}
              </div>
            </div>

            {!searched && !search && (
              <div className="mt-4 flex items-start gap-2 p-3 bg-slate-800/40 rounded-xl border border-slate-700/30">
                <Info className="w-4 h-4 text-slate-500 flex-shrink-0 mt-0.5" />
                <div className="text-xs text-slate-500 space-y-1">
                  <p>
                    Strong&apos;s numbers:&nbsp;
                    <span className="text-amber-400 font-mono">H2896</span> (Hebrew),&nbsp;
                    <span className="text-blue-400 font-mono">G3056</span> (Greek)
                  </p>
                  <p>Or search by word, transliteration, or definition keyword</p>
                </div>
              </div>
            )}
          </motion.div>

          {loading && (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-6 h-6 text-blue-400 animate-spin" />
            </div>
          )}

          {!loading && searched && results.length === 0 && (
            <div className="text-center py-12">
              <Languages className="w-10 h-10 text-slate-700 mx-auto mb-3" />
              <p className="text-slate-400 font-medium">No entries found</p>
              <p className="text-slate-600 text-sm mt-1">Try a different term or Strong&apos;s number</p>
            </div>
          )}

          {!loading && searched && results.length > 0 && (
            <div className="flex items-center justify-between mb-3">
              <p className="text-xs text-slate-600">
                {results.length} {results.length === 1 ? 'entry' : 'entries'}
                {results.length === 40 && ' (showing first 40)'}
              </p>
              <div className="flex items-center gap-3">
                <span className="text-[10px] text-amber-400 flex items-center gap-1">
                  <Hash className="w-3 h-3" />
                  {results.filter(r => r.origin_language === 'hebrew').length} Heb
                </span>
                <span className="text-[10px] text-blue-400 flex items-center gap-1">
                  <Hash className="w-3 h-3" />
                  {results.filter(r => r.origin_language === 'greek').length} Gk
                </span>
              </div>
            </div>
          )}

          {!loading && results.length > 0 && (
            <div className="space-y-2">
              {results.map((entry, i) => (
                <motion.div
                  key={entry.id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.02, duration: 0.2 }}
                >
                  <LexiconCard entry={entry} />
                </motion.div>
              ))}
            </div>
          )}

          <div className="mt-10 pt-6 border-t border-slate-800/60">
            <h2
              className="text-sm font-semibold text-slate-400 mb-4 flex items-center gap-2"
              style={{ fontFamily: 'var(--font-cinzel), serif', letterSpacing: '0.08em' }}
            >
              <BookOpen className="w-4 h-4" /> More Resources
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Link
                href="/topics"
                className="flex items-center gap-3 p-3 bg-slate-800/40 border border-slate-700/40 rounded-xl hover:border-amber-500/30 hover:bg-amber-500/5 transition-all group"
              >
                <div className="w-8 h-8 rounded-lg bg-amber-500/10 flex items-center justify-center flex-shrink-0">
                  <Hash className="w-4 h-4 text-amber-400" />
                </div>
                <div>
                  <p className="text-sm text-white font-medium">Topics Library</p>
                  <p className="text-[10px] text-slate-500">Doctrinal studies &amp; forensic analysis</p>
                </div>
                <ChevronRight className="w-4 h-4 text-slate-600 ml-auto group-hover:text-amber-400 transition-colors" />
              </Link>

              <div className="flex items-center gap-3 p-3 bg-slate-800/40 border border-slate-700/40 rounded-xl opacity-50">
                <div className="w-8 h-8 rounded-lg bg-slate-700/40 flex items-center justify-center flex-shrink-0">
                  <Library className="w-4 h-4 text-slate-500" />
                </div>
                <div>
                  <p className="text-sm text-slate-400 font-medium">Concordances</p>
                  <p className="text-[10px] text-slate-600">Coming soon · vault documents</p>
                </div>
              </div>
            </div>
          </div>
        </main>

        <footer className="glass-card rounded-none border-t border-white/5 px-4 py-3">
          <div className="max-w-7xl mx-auto flex items-center justify-between text-xs">
            <span className="text-slate-600">ISA820 · Reference Library</span>
            <span className="text-slate-600 font-mono">Strong&apos;s · 20,046 entries</span>
          </div>
        </footer>
      </div>
    </div>
  );
}
