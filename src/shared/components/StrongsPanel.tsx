'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useISA820Store } from '@/store/isa820-store';
import { supabase } from '@/lib/supabase';
import { resolveStrongs } from '@/lib/strongs';
import { X, BookOpen, Hash, ExternalLink, Loader2, ChevronDown, Sparkles } from 'lucide-react';
import { RelatedMedia } from './RelatedMedia';
import { MarkdownRenderer } from './MarkdownRenderer';

interface UsageRow {
  book: string;
  chapter: number;
  verse: number;
  text: string;
  translation: string;
}

interface LexEntry {
  word: string;
  transliteration: string;
  definition: string;
  part_of_speech: string;
  pronunciation_guide: string;
  usage_count: number;
}

function useIsMobile() {
  const [isMobile, setIsMobile] = useState(false);
  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 1024);
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);
  return isMobile;
}

export function StrongsPanel() {
  const { strongs, closeStrongsPanel } = useISA820Store();
  const isMobile = useIsMobile();
  const [usageRows, setUsageRows] = useState<UsageRow[]>([]);
  const [usageLoading, setUsageLoading] = useState(false);
  const [usageTotal, setUsageTotal] = useState(0);
  const [usageLimit, setUsageLimit] = useState(20);
  const [lexEntry, setLexEntry] = useState<LexEntry | null>(null);
  const [lexLoading, setLexLoading] = useState(false);
  const [showFullConcordance, setShowFullConcordance] = useState(false);

  const [deepDive, setDeepDive] = useState('');
  const [deepDiveLoading, setDeepDiveLoading] = useState(false);

  const word = strongs.currentWord;

  useEffect(() => {
    if (!word?.strongsId) { setLexEntry(null); return; }
    setLexLoading(true);
    setShowFullConcordance(false);
    setUsageLimit(20);
    setDeepDive('');
    setDeepDiveLoading(false);
    (async () => {
      try {
        // Was `.eq('strongs_id', word.strongsId).single()` — an exact match against
        // a column whose format the caller does not share. The reader passes
        // "G32"/"G746" while the lexicon stores "G0032G"/"G0746", so 26.8% of
        // clicks returned nothing and the panel showed no definition at all.
        // resolveStrongs() reconciles the formats — see lib/strongs.ts.
        const data = await resolveStrongs(word.strongsId);
        if (data) {
          setLexEntry({
            word: data.word || word.strongsId,
            transliteration: data.transliteration || '',
            definition: data.definition || 'No definition available',
            part_of_speech: data.part_of_speech || '',
            pronunciation_guide: '',
            usage_count: 0,
          });
        } else {
          setLexEntry(null);
        }
      } finally {
        setLexLoading(false);
      }
    })();
  }, [word?.strongsId]);

  useEffect(() => {
    if (!word?.strongsId) { setUsageRows([]); return; }
    setUsageLoading(true);
    const strongsId = word.strongsId;
    (async () => {
      try {
        const { data, count } = await supabase
          .from('verses')
          .select('book, chapter, verse, text, translation', { count: 'exact' })
          .contains('strongs_numbers', [strongsId])
          .order('book')
          .limit(usageLimit);
        setUsageRows(data || []);
        setUsageTotal(count || 0);
      } catch {
        // silent
      } finally {
        setUsageLoading(false);
      }
    })();
  }, [word?.strongsId, usageLimit]);

  if (!word) return null;

  const langPrefix = word.strongsId[0];
  const langLabel = langPrefix === 'H' ? 'Hebrew' : langPrefix === 'G' ? 'Greek' : 'Aramaic';
  const displayWord = lexEntry?.word || word.word || word.strongsId;
  const displayTranslit = lexEntry?.transliteration || word.transliteration;
  const displayDef = lexEntry?.definition || word.definition || '';
  const isRealDef = displayDef && displayDef !== 'Click to load definition' && displayDef !== 'Loading…';
  const isGloss = isRealDef && displayDef.length < 80;

  const runDeepDive = async () => {
    if (deepDiveLoading) return;
    setDeepDive('');
    setDeepDiveLoading(true);
    const question =
      `Provide a comprehensive scholarly analysis of Strong's ${word.strongsId} — ` +
      `the ${langLabel} word "${lexEntry?.word || displayWord}" (${lexEntry?.transliteration || displayTranslit || word.strongsId}). ` +
      `Cover all of these: 1) Full etymology and root derivation. ` +
      `2) Complete semantic range — every shade of meaning this word carries across the manuscripts, not just a gloss. ` +
      `3) Theological significance — what this word reveals about God, His nature, His covenant, or the nature of humanity. ` +
      `4) Distinguishing it from similar/related terms in the same language (e.g. for Theos, contrast with YHVH, Kyrios, Adonai). ` +
      `5) Key scriptural examples showing the full range of how it is used, including any surprising or misunderstood usages. ` +
      `6) Grammatical notes: if a noun, article patterns and case force; if a verb, stem/aspect implications. ` +
      `Format with headers and bullet points. Give the student real depth — this is a forensic study tool.`;
    try {
      const res = await fetch('/api/analyst', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          verseRef: `Lexicon: ${word.strongsId}`,
          verseText: lexEntry?.word || displayWord || '',
          strongsData: lexEntry ? [{
            strongsId: word.strongsId,
            transliteration: lexEntry.transliteration,
            definition: lexEntry.definition,
          }] : [],
          question,
        }),
      });
      if (!res.ok || !res.body) throw new Error('Analyst unavailable');
      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        setDeepDive(prev => prev + decoder.decode(value));
      }
    } catch {
      setDeepDive('_Analyst unavailable. Check your connection._');
    } finally {
      setDeepDiveLoading(false);
    }
  };

  const mobileMotion = {
    initial: { y: '100%', opacity: 0 },
    animate: { y: 0, opacity: 1 },
    exit: { y: '100%', opacity: 0 },
    transition: { type: 'spring' as const, damping: 28, stiffness: 320 },
  };

  const desktopMotion = {
    initial: { x: 24, opacity: 0 },
    animate: { x: 0, opacity: 1 },
    exit: { x: 24, opacity: 0 },
    transition: { type: 'spring' as const, damping: 25, stiffness: 300 },
  };

  const motionProps = isMobile ? mobileMotion : desktopMotion;

  return (
    <AnimatePresence>
      {strongs.isOpen && (
        <>
          {/* Mobile backdrop */}
          {isMobile && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm lg:hidden"
              onClick={closeStrongsPanel}
            />
          )}

          <motion.div
            {...motionProps}
            className={`z-[60] glass-deep glass-panel-solid ${
              isMobile
                ? 'fixed inset-x-0 bottom-0 rounded-t-2xl max-h-[85vh] flex flex-col'
                : 'fixed right-4 top-24 w-full max-w-md rounded-2xl'
            }`}
          >
            {/* Mobile drag handle */}
            {isMobile && (
              <div className="flex justify-center pt-3 pb-1 flex-shrink-0">
                <div className="w-10 h-1 rounded-full bg-slate-600" />
              </div>
            )}

            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-white/5 flex-shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-cyan-500/20 flex items-center justify-center">
                  <Hash className="w-4 h-4 text-cyan-400" />
                </div>
                <div>
                  <h3 className="font-semibold text-white font-mono text-sm">
                    {displayTranslit || displayWord}
                  </h3>
                  <p className="text-xs text-slate-500">Strong&apos;s {word.strongsId} · {langLabel}</p>
                </div>
              </div>
              <button
                onClick={closeStrongsPanel}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-700/60 border border-slate-600/50 text-slate-300 hover:bg-red-500/20 hover:border-red-500/40 hover:text-red-400 transition-all text-xs font-medium"
              >
                <X className="w-3.5 h-3.5" />
                Close
              </button>
            </div>

            {/* Content */}
            <div className={`p-4 space-y-5 overflow-y-auto scrollbar-hide ${isMobile ? 'flex-1' : 'max-h-[75vh]'}`}>

              {/* Lexicon entry */}
              {lexLoading ? (
                <div className="flex items-center gap-2 py-3 text-slate-500">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span className="text-sm">Fetching lexicon…</span>
                </div>
              ) : (
                <div className="p-4 bg-slate-800/50 rounded-xl border border-slate-700/40 space-y-3">
                  {/* Word + language badge */}
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-baseline gap-2 flex-wrap">
                      <span className="text-cyan-300 font-mono text-lg leading-none">{displayWord}</span>
                      {displayTranslit && (
                        <span className="text-slate-300 text-sm italic">"{displayTranslit}"</span>
                      )}
                    </div>
                    <span className={`flex-shrink-0 text-[10px] font-bold px-2 py-0.5 rounded border ${
                      langLabel === 'Hebrew'
                        ? 'bg-amber-500/15 text-amber-400 border-amber-500/30'
                        : 'bg-cyan-500/15 text-cyan-400 border-cyan-500/30'
                    }`}>{langLabel}</span>
                  </div>

                  {/* Pronunciation + part of speech row */}
                  <div className="flex flex-wrap gap-2">
                    {lexEntry?.pronunciation_guide && (
                      <span className="text-[11px] px-2 py-0.5 bg-slate-700/60 rounded text-slate-300 font-mono">
                        /{lexEntry.pronunciation_guide}/
                      </span>
                    )}
                    {lexEntry?.part_of_speech && (
                      <span className="text-[11px] px-2 py-0.5 bg-indigo-500/15 rounded border border-indigo-500/30 text-indigo-300 capitalize">
                        {lexEntry.part_of_speech}
                      </span>
                    )}
                    {(lexEntry?.usage_count || word.usageCount) > 0 && (
                      <span className="text-[11px] px-2 py-0.5 bg-slate-700/40 rounded text-slate-500">
                        {lexEntry?.usage_count || word.usageCount}× in scripture
                      </span>
                    )}
                  </div>

                  {/* Definition */}
                  <div>
                    <div className="flex items-center gap-1.5 mb-1.5">
                      <BookOpen className="w-3 h-3 text-amber-400" />
                      <span className="text-[10px] font-medium text-amber-400 uppercase tracking-wider">
                        Strong&apos;s Definition
                      </span>
                    </div>
                    {isRealDef ? (
                      <p className="text-slate-100 leading-relaxed bible-text text-sm whitespace-pre-line">
                        {displayDef}
                      </p>
                    ) : (
                      <p className="text-slate-500 italic text-sm">
                        No definition in database for {word.strongsId}.
                      </p>
                    )}
                  </div>

                  {/* Gloss note + no-definition note */}
                  {(!isRealDef || isGloss) && (
                    <div className="border-t border-slate-700/40 pt-3">
                      <p className="text-[11px] text-amber-500/80 leading-relaxed">
                        {!isRealDef
                          ? `${word.strongsId} was not found in the local lexicon — it may be a proper name or an entry not yet imported. Use Deep Dive below for a full scholarly analysis.`
                          : `The above is the Strong's gloss — the minimal English equivalent. The original ${langLabel} carries far more theological weight than a one-word translation. Use Deep Dive below for the full breakdown.`
                        }
                      </p>
                    </div>
                  )}
                </div>
              )}

              {/* Deep Dive — AI-powered full scholarly definition */}
              <div>
                {!deepDive && (
                  <button
                    onClick={runDeepDive}
                    disabled={deepDiveLoading}
                    className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-gradient-to-r from-indigo-500/15 to-cyan-500/15 border border-indigo-500/30 text-indigo-300 hover:from-indigo-500/25 hover:to-cyan-500/25 hover:text-white transition-all text-sm font-semibold disabled:opacity-50"
                  >
                    {deepDiveLoading
                      ? <><Loader2 className="w-4 h-4 animate-spin" /> Analysing…</>
                      : <><Sparkles className="w-4 h-4" /> Deep Dive — Full Scholarly Analysis</>
                    }
                  </button>
                )}
                {deepDive && (
                  <div className="p-4 bg-indigo-900/20 rounded-xl border border-indigo-500/20 space-y-2">
                    <div className="flex items-center gap-2 mb-2">
                      <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
                      <span className="text-[10px] font-semibold text-indigo-400 uppercase tracking-wider">Forensic Lexicon Analysis</span>
                    </div>
                    <div className="text-sm leading-relaxed">
                      <MarkdownRenderer text={deepDive} />
                    </div>
                    {!deepDiveLoading && (
                      <button
                        onClick={runDeepDive}
                        className="mt-2 flex items-center gap-1 text-[11px] text-indigo-500 hover:text-indigo-300 transition-colors"
                      >
                        <Sparkles className="w-3 h-3" /> Regenerate
                      </button>
                    )}
                  </div>
                )}
              </div>

              {/* Concordance */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <h4 className="text-[10px] font-medium text-slate-500 uppercase tracking-widest flex items-center gap-1.5">
                    <ExternalLink className="w-3 h-3" />
                    Concordance
                  </h4>
                  {usageTotal > 0 && (
                    <span className="text-xs text-slate-600">
                      {usageRows.length} of {usageTotal}
                    </span>
                  )}
                </div>

                {usageLoading ? (
                  <div className="flex items-center gap-2 py-4 text-slate-500">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span className="text-sm">Loading concordance…</span>
                  </div>
                ) : (
                  <>
                    <div className={`space-y-2 ${showFullConcordance ? '' : 'max-h-56'} overflow-y-auto scrollbar-hide`}>
                      {usageRows.map((row, i) => (
                        <motion.div
                          key={i}
                          initial={{ opacity: 0, y: 6 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: Math.min(i * 0.02, 0.3) }}
                          className="p-3 bg-slate-800/30 rounded-lg border border-slate-700/30 hover:border-cyan-500/30 transition-colors"
                        >
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-sm font-medium text-cyan-400">
                              {row.book} {row.chapter}:{row.verse}
                            </span>
                            <span className="text-xs text-slate-500 px-1.5 py-0.5 bg-slate-800 rounded">{row.translation}</span>
                          </div>
                          <p className="text-sm text-slate-300 leading-relaxed bible-text">{row.text}</p>
                        </motion.div>
                      ))}
                      {usageRows.length === 0 && (
                        <p className="text-sm text-slate-500 italic">
                          No indexed occurrences found for {word.strongsId}.
                        </p>
                      )}
                    </div>
                    {usageTotal > usageRows.length && (
                      <button
                        onClick={() => { setUsageLimit(prev => prev + 50); setShowFullConcordance(true); }}
                        className="mt-3 w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-cyan-500/10 text-cyan-400 rounded-lg hover:bg-cyan-500/20 transition-colors text-sm font-medium border border-cyan-500/20"
                      >
                        <ChevronDown className="w-4 h-4" />
                        Load more ({usageTotal - usageRows.length} remaining)
                      </button>
                    )}
                  </>
                )}
              </div>

              {/* Related images */}
              {displayWord && (
                <div>
                  <h4 className="text-[10px] font-medium text-slate-500 uppercase tracking-widest mb-2">Related Images</h4>
                  <RelatedMedia
                    book="" chapter={0}
                    keywords={[
                      displayWord,
                      displayTranslit,
                      displayDef?.split(/[,;.]/)[0]?.trim() || '',
                    ].filter(Boolean)}
                  />
                </div>
              )}

              {/* Bottom close */}
              <button
                onClick={closeStrongsPanel}
                className="w-full px-4 py-3 bg-slate-700/50 border border-slate-600/40 text-slate-300 rounded-xl hover:bg-red-500/15 hover:border-red-500/30 hover:text-red-400 transition-all text-sm font-medium flex items-center justify-center gap-2"
              >
                <X className="w-4 h-4" />
                Close Strong&apos;s Panel
              </button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
