'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useISA820Store } from '@/store/isa820-store';
import { supabase } from '@/lib/supabase';
import { X, BookOpen, Hash, ExternalLink, Loader2, ChevronDown } from 'lucide-react';
import { RelatedMedia } from './RelatedMedia';

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
  usage_count: number;
  extended_definition?: string;
}

export function StrongsPanel() {
  const { strongs, closeStrongsPanel } = useISA820Store();
  const [usageRows, setUsageRows] = useState<UsageRow[]>([]);
  const [usageLoading, setUsageLoading] = useState(false);
  const [usageTotal, setUsageTotal] = useState(0);
  const [usageLimit, setUsageLimit] = useState(20);
  const [lexEntry, setLexEntry] = useState<LexEntry | null>(null);
  const [lexLoading, setLexLoading] = useState(false);
  const [showFullConcordance, setShowFullConcordance] = useState(false);

  const word = strongs.currentWord;

  // Always fetch the full lexicon entry when the panel opens — don't rely on click-time data
  useEffect(() => {
    if (!word?.strongsId) { setLexEntry(null); return; }
    setLexLoading(true);
    setShowFullConcordance(false);
    setUsageLimit(20);
    supabase
      .from('strongs_lexicon')
      .select('*')
      .eq('strongs_id', word.strongsId)
      .single()
      .then(({ data }) => {
        if (data) {
          setLexEntry({
            word: data.word || word.strongsId,
            transliteration: data.transliteration || '',
            definition: data.definition || 'No definition available',
            usage_count: data.usage_count || 0,
            extended_definition: data.extended_definition || data.notes || '',
          });
        } else {
          setLexEntry(null);
        }
      })
      .finally(() => setLexLoading(false));
  }, [word?.strongsId]);

  // Fetch concordance occurrences
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

  return (
    <AnimatePresence>
      {strongs.isOpen && (
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: 20 }}
          transition={{ type: 'spring', damping: 25 }}
          className="fixed right-4 top-24 z-50 glass-card glass-panel-solid w-full max-w-md"
        >
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-slate-700/50">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-cyan-500/20 flex items-center justify-center">
                <Hash className="w-5 h-5 text-cyan-400" />
              </div>
              <div>
                <h3 className="font-semibold text-white font-mono">
                  {displayTranslit || displayWord}
                </h3>
                <p className="text-xs text-slate-400">Strong&apos;s {word.strongsId} · {langLabel}</p>
              </div>
            </div>
            <button
              onClick={closeStrongsPanel}
              className="p-2 rounded-lg hover:bg-slate-700/50 transition-colors"
            >
              <X className="w-5 h-5 text-slate-400" />
            </button>
          </div>

          {/* Content */}
          <div className="p-4 space-y-5 max-h-[75vh] overflow-y-auto">

            {/* Definition */}
            <div>
              <h4 className="text-xs font-medium text-slate-400 uppercase tracking-wide mb-2">Definition</h4>
              {lexLoading ? (
                <div className="flex items-center gap-2 text-slate-500">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span className="text-sm">Fetching lexicon…</span>
                </div>
              ) : (
                <p className="text-slate-100 leading-relaxed bible-text">
                  {isRealDef ? displayDef : <span className="text-slate-500 italic">No definition in database for {word.strongsId}</span>}
                </p>
              )}
            </div>

            {/* Lexicon card */}
            {!lexLoading && (lexEntry || isRealDef) && (
              <div className="p-4 bg-slate-800/50 rounded-lg border border-slate-700/50">
                <div className="flex items-center gap-2 mb-2">
                  <BookOpen className="w-4 h-4 text-amber-400" />
                  <span className="text-sm font-medium text-amber-400">STEPBible Lexicon</span>
                </div>

                <div className="space-y-2">
                  <div className="flex items-baseline gap-2 flex-wrap">
                    <span className="text-cyan-400 font-mono text-base">{displayWord}</span>
                    {displayTranslit && (
                      <span className="text-slate-400 text-sm">({displayTranslit})</span>
                    )}
                    <span className="text-xs px-1.5 py-0.5 bg-slate-700/60 rounded text-slate-400">{langLabel}</span>
                  </div>
                  <p className="text-sm text-slate-300 leading-relaxed">{displayDef}</p>

                  {/* Extended definition if available */}
                  {lexEntry?.extended_definition && (
                    <p className="text-xs text-slate-400 leading-relaxed border-t border-slate-700/40 pt-2 mt-2">
                      {lexEntry.extended_definition}
                    </p>
                  )}
                </div>

                <div className="mt-3 flex flex-wrap gap-2">
                  <span className="text-xs px-2 py-1 bg-slate-700/50 rounded text-slate-400">{langLabel}</span>
                  {(lexEntry?.usage_count || word.usageCount) > 0 && (
                    <span className="text-xs px-2 py-1 bg-slate-700/50 rounded text-slate-400">
                      {lexEntry?.usage_count || word.usageCount} occurrences
                    </span>
                  )}
                </div>
              </div>
            )}

            {/* Concordance / Appearances */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <h4 className="text-xs font-medium text-slate-400 uppercase tracking-wide flex items-center gap-2">
                  <ExternalLink className="w-3.5 h-3.5" />
                  Concordance
                </h4>
                {usageTotal > 0 && (
                  <span className="text-xs text-slate-500">
                    {usageRows.length} of {usageTotal} occurrences
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
                  <div className={`space-y-2 ${showFullConcordance ? '' : 'max-h-64'} overflow-y-auto`}>
                    {usageRows.map((row, i) => (
                      <motion.div
                        key={i}
                        initial={{ opacity: 0, y: 8 }}
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
                        <p className="text-sm text-slate-300 leading-relaxed bible-text">
                          {row.text}
                        </p>
                      </motion.div>
                    ))}
                    {usageRows.length === 0 && (
                      <p className="text-sm text-slate-500 italic">
                        No indexed occurrences found for {word.strongsId}.
                      </p>
                    )}
                  </div>

                  {/* Load more / Full concordance */}
                  {usageTotal > usageRows.length && (
                    <button
                      onClick={() => {
                        setUsageLimit(prev => prev + 50);
                        setShowFullConcordance(true);
                      }}
                      className="mt-3 w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-cyan-500/10 text-cyan-400 rounded-lg hover:bg-cyan-500/20 transition-colors text-sm font-medium border border-cyan-500/20"
                    >
                      <ChevronDown className="w-4 h-4" />
                      Load more ({usageTotal - usageRows.length} remaining)
                    </button>
                  )}
                </>
              )}
            </div>

            {/* Related vault images */}
            {displayWord && (
              <div>
                <h4 className="text-xs font-medium text-slate-400 uppercase tracking-wide mb-2">Related Images</h4>
                <RelatedMedia
                  book=""
                  chapter={0}
                  keywords={[
                    displayWord,
                    displayTranslit,
                    displayDef?.split(/[,;.]/)[0]?.trim() || '',
                  ].filter(Boolean)}
                />
              </div>
            )}

            {/* Close */}
            <button
              onClick={closeStrongsPanel}
              className="w-full px-4 py-2 bg-slate-700/50 text-slate-300 rounded-lg hover:bg-slate-600/50 transition-colors text-sm font-medium"
            >
              Close
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
