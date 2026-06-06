'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import { PillarHeader } from '@/shared/components/PillarHeader';
import { MarkdownRenderer } from '@/shared/components/MarkdownRenderer';
import { supabase } from '@/lib/supabase';
import type { SpiritualUnderstanding } from '@/lib/supabase';
import {
  Search,
  Lightbulb,
  ChevronDown,
  ChevronUp,
  BookOpen,
  Tag,
  Loader2,
  FileText,
  ArrowRight,
} from 'lucide-react';

const CONFIDENCE_COLORS = {
  HIGH:   'bg-green-500/15 text-green-400 border-green-500/30',
  MEDIUM: 'bg-amber-500/15 text-amber-400 border-amber-500/30',
  LOW:    'bg-slate-500/15 text-slate-400 border-slate-500/30',
};

function parseVerseLink(ref: string): string {
  const m = ref.match(/^(.+?)\s+(\d+)(?::\d+)?$/);
  if (!m) return '/';
  return `/read/${encodeURIComponent(m[1])}/${m[2]}`;
}

function TopicCard({ item }: { item: SpiritualUnderstanding }) {
  const [expanded, setExpanded] = useState(false);

  const excerpt = item.content
    .replace(/^#{1,3} .+$/gm, '')
    .replace(/\*\*/g, '')
    .replace(/---/g, '')
    .replace(/\n+/g, ' ')
    .trim()
    .slice(0, 220);

  return (
    <motion.article
      layout
      className="border border-amber-500/20 rounded-2xl overflow-hidden bg-slate-900/60 backdrop-blur-sm"
    >
      <div className="p-5">
        <div className="flex items-start justify-between gap-3 mb-3">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-8 h-8 rounded-lg bg-amber-500/15 flex items-center justify-center flex-shrink-0">
              <Lightbulb className="w-4 h-4 text-amber-400" />
            </div>
            <div className="min-w-0">
              <h2
                className="text-white font-semibold text-base leading-snug"
                style={{ fontFamily: 'var(--font-cinzel), serif' }}
              >
                {item.title}
              </h2>
              <p className="text-slate-500 text-[10px] font-mono mt-0.5">
                topic: {item.topic}
              </p>
            </div>
          </div>
          <span className={`flex-shrink-0 text-[10px] font-bold px-2 py-0.5 rounded-full border uppercase tracking-wide ${CONFIDENCE_COLORS[item.confidence_level]}`}>
            {item.confidence_level}
          </span>
        </div>

        {!expanded && (
          <p className="text-slate-400 text-xs leading-relaxed mb-3 line-clamp-3">
            {excerpt}…
          </p>
        )}

        {(item.supporting_verses || []).length > 0 && (
          <div className="flex flex-wrap gap-1.5 mb-3">
            <span className="flex items-center gap-1 text-[10px] text-slate-600 mr-0.5">
              <BookOpen className="w-3 h-3" /> Verses:
            </span>
            {item.supporting_verses.slice(0, 10).map(ref => (
              <Link
                key={ref}
                href={parseVerseLink(ref)}
                className="text-[10px] px-2 py-0.5 bg-amber-500/10 text-amber-400 rounded border border-amber-500/20 hover:bg-amber-500/20 transition-colors font-mono flex items-center gap-0.5 group"
                title={`Read ${ref}`}
              >
                {ref}
                <ArrowRight className="w-2.5 h-2.5 opacity-0 group-hover:opacity-100 transition-opacity" />
              </Link>
            ))}
            {item.supporting_verses.length > 10 && (
              <span className="text-[10px] text-slate-600 px-1">
                +{item.supporting_verses.length - 10} more
              </span>
            )}
          </div>
        )}

        {(item.related_topics || []).length > 0 && (
          <div className="flex flex-wrap gap-1.5 mb-3">
            <span className="flex items-center gap-1 text-[10px] text-slate-600 mr-0.5">
              <Tag className="w-3 h-3" /> Related:
            </span>
            {item.related_topics.slice(0, 6).map(t => (
              <span
                key={t}
                className="text-[10px] px-2 py-0.5 bg-slate-800/70 text-slate-400 rounded border border-slate-700/50"
              >
                #{t}
              </span>
            ))}
          </div>
        )}

        <button
          onClick={() => setExpanded(!expanded)}
          className="flex items-center gap-1.5 text-xs text-amber-400 hover:text-amber-300 transition-colors font-medium"
        >
          {expanded ? (
            <><ChevronUp className="w-3.5 h-3.5" /> Collapse</>
          ) : (
            <><ChevronDown className="w-3.5 h-3.5" /> Read Full Study</>
          )}
        </button>
      </div>

      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="overflow-hidden border-t border-amber-500/10"
          >
            <div className="p-5 pt-4 max-h-[60vh] overflow-y-auto scrollbar-hide">
              <MarkdownRenderer text={item.content} />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.article>
  );
}

export default function TopicsPage() {
  const [topics, setTopics] = useState<SpiritualUnderstanding[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    (async () => {
      const { data } = await supabase
        .from('knowledge_base')
        .select('*')
        .order('confidence_level', { ascending: false });
      setTopics(data || []);
      setLoading(false);
    })();
  }, []);

  const filtered = topics.filter(t => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return (
      t.title.toLowerCase().includes(q) ||
      t.topic.toLowerCase().includes(q) ||
      t.content.toLowerCase().includes(q) ||
      (t.related_topics || []).some(rt => rt.includes(q))
    );
  });

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
              <div className="w-10 h-10 rounded-xl bg-amber-500/15 flex items-center justify-center">
                <FileText className="w-5 h-5 text-amber-400" />
              </div>
              <div>
                <h1
                  className="text-2xl sm:text-3xl font-bold text-gradient-gold"
                  style={{ fontFamily: 'var(--font-cinzel), serif' }}
                >
                  Topics Library
                </h1>
                <p className="text-slate-500 text-xs sm:text-sm mt-0.5">
                  Forensic doctrinal studies — every claim measured by the manuscript
                </p>
              </div>
            </div>

            <div className="relative mt-5">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
              <input
                type="text"
                placeholder="Search topics, verses, or keywords…"
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-slate-800/60 border border-slate-700/50 rounded-xl text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:border-amber-500/50 transition-colors"
              />
            </div>
          </motion.div>

          {!loading && (
            <div className="flex items-center justify-between mb-4">
              <p className="text-xs text-slate-600">
                {filtered.length} {filtered.length === 1 ? 'topic' : 'topics'}
                {search && ` matching "${search}"`}
              </p>
              <Link
                href="/"
                className="text-xs text-slate-500 hover:text-amber-400 transition-colors flex items-center gap-1"
              >
                <BookOpen className="w-3 h-3" /> Back to Reader
              </Link>
            </div>
          )}

          {loading && (
            <div className="flex items-center justify-center py-24">
              <Loader2 className="w-8 h-8 text-amber-400 animate-spin" />
            </div>
          )}

          {!loading && filtered.length === 0 && (
            <div className="text-center py-24">
              <Lightbulb className="w-12 h-12 text-slate-700 mx-auto mb-4" />
              <p className="text-slate-400 font-medium">
                {search ? `No topics match "${search}"` : 'No topics yet'}
              </p>
              <p className="text-slate-600 text-sm mt-1">
                {search ? 'Try a different search term.' : 'Topics are added through the Admin vault.'}
              </p>
            </div>
          )}

          <div className="space-y-4">
            {filtered.map((item, i) => (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.06, duration: 0.3 }}
              >
                <TopicCard item={item} />
              </motion.div>
            ))}
          </div>
        </main>

        <footer className="glass-card rounded-none border-t border-white/5 px-4 py-3">
          <div className="max-w-7xl mx-auto flex items-center justify-between text-xs">
            <span className="text-slate-600">ISA820 · Topics Library</span>
            <span className="text-slate-600 font-mono">{topics.length} topics</span>
          </div>
        </footer>
      </div>
    </div>
  );
}
