'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '@/lib/supabase';
import type { MediaAsset } from '@/lib/supabase';
import { Images, X, ChevronLeft, ChevronRight, ExternalLink } from 'lucide-react';

interface RelatedMediaProps {
  book: string;
  chapter: number;
  verse?: number;
  topics?: string[];
  keywords?: string[]; // extra search terms e.g. Strong's words / definitions
}

// Only names long/distinct enough to avoid substring collisions
const SPECIFIC_DEITY_NAMES = [
  'marduk', 'baal', 'moloch', 'molech', 'chemosh', 'dagon', 'ashtoreth',
  'asherah', 'zeus', 'jupiter', 'apollo', 'osiris', 'horus', 'remphan',
  'chiun', 'tammuz', 'ishtar', 'nimrod', 'merodach', 'milcom',
  'adrammelech', 'nergal', 'nibhaz', 'tartak', 'succothbenoth',
];

// Generic idol/false god terms — must be whole-phrase matches to avoid false positives
const GENERIC_IDOL_TRIGGERS = [
  'idol', 'idols', 'idolatry', 'false god', 'false gods', 'graven image',
  'graven images', 'molten image', 'carved image', 'strange gods', 'other gods',
  'abomination', 'abominations', 'false deity', 'pagan idol',
];

// Word-boundary safe match — avoids "ra" matching "Israel", "bel" matching "believe", etc.
function wordMatch(haystack: string, term: string): boolean {
  const escaped = term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  return new RegExp(`(?<![a-z])${escaped}(?![a-z])`, 'i').test(haystack);
}

function assetDeityNames(asset: MediaAsset): string[] {
  const hay = [asset.title || '', asset.description || '', ...(asset.topic_tags || [])]
    .join(' ');
  return SPECIFIC_DEITY_NAMES.filter(d => wordMatch(hay, d));
}

function assetIsIdolCategory(asset: MediaAsset): boolean {
  const hay = [asset.title || '', asset.description || '', ...(asset.topic_tags || [])]
    .join(' ');
  return (
    SPECIFIC_DEITY_NAMES.some(d => wordMatch(hay, d)) ||
    GENERIC_IDOL_TRIGGERS.some(t => wordMatch(hay, t))
  );
}

function idolAssetAllowedInContext(asset: MediaAsset, activeContext: string[]): boolean {
  const ctx = activeContext.join(' ');
  const namedInContext = SPECIFIC_DEITY_NAMES.filter(d => wordMatch(ctx, d));
  const genericIdolInContext = GENERIC_IDOL_TRIGGERS.some(t => wordMatch(ctx, t));

  if (namedInContext.length > 0) {
    const assetDeities = assetDeityNames(asset);
    const matchesNamedDeity = assetDeities.some(d => namedInContext.includes(d));
    const isGenericIdolOnly = assetDeities.length === 0;
    return matchesNamedDeity || isGenericIdolOnly;
  }

  if (genericIdolInContext) {
    return true;
  }

  return false;
}

/**
 * RelatedMedia — pops up a lightbox of contextually relevant vault images
 * when reading a verse or topic. Matches against verse_references and topic_tags.
 */
export function RelatedMedia({ book, chapter, verse, topics = [], keywords = [] }: RelatedMediaProps) {
  const [assets, setAssets]     = useState<MediaAsset[]>([]);
  const [open, setOpen]         = useState(false);
  const [lightbox, setLightbox] = useState<MediaAsset | null>(null);
  const [imgIdx, setImgIdx]     = useState(0);

  const reference = verse
    ? `${book} ${chapter}:${verse}`
    : `${book} ${chapter}`;

  useEffect(() => {
    if (!book && keywords.length === 0) return;

    const verseRef = verse ? `${book} ${chapter}:${verse}` : null;
    const chapterRef = `${book} ${chapter}`;

    // Stopwords: grammatical/functional words and high-frequency non-visual verbs only.
    // Visual content words (light, fire, water, night, star, etc.) are intentionally kept
    // so images depicting those subjects can surface.
    const STOPWORDS = new Set([
      // Articles, prepositions, conjunctions
      'and','the','but','for','nor','yet','so','from','into','with','upon',
      'unto','that','this','these','those','also','even','then','when','where',
      'than','thus','both','each','such','some','many','more','most','only',
      'just','very','same','none','over','here','there','now','soon','ever',
      // Pronouns
      'thee','thou','thy','they','them','their','whom','whose','which',
      // Auxiliary & high-frequency verbs with no visual meaning
      'said','came','went','took','gave','made','sent','keep','hath','doth',
      'were','been','have','hast','shall','will','must','also','pass','save',
      'gave','give','fell','seen','knew','know','call','turn','look','hear',
      'open','left','used','work','true','long','like','live','walk','make',
      // Too-generic biblical transitionals
      'thus','unto','upon','thee','thou','doth','hath','yea','nay',
    ]);

    const specificKeywords = keywords.filter(k =>
      k.length >= 4 && !STOPWORDS.has(k.toLowerCase())
    );

    (async () => {
      const results: MediaAsset[] = [];

      // 1. Exact verse reference only (not chapter-level — too broad)
      if (verseRef) {
        const { data } = await supabase
          .from('media_assets')
          .select('*')
          .contains('verse_references', [verseRef])
          .limit(8);
        if (data) results.push(...data);
      }

      // 2. Explicit topic tags from the verse's pillar tags
      for (const topic of topics.slice(0, 4)) {
        const { data } = await supabase
          .from('media_assets')
          .select('*')
          .contains('topic_tags', [topic])
          .limit(4);
        if (data) results.push(...data);
      }

      // 3. Specific keyword title search — only meaningful/unique terms, never the book name
      for (const term of specificKeywords.slice(0, 4)) {
        const { data } = await supabase
          .from('media_assets')
          .select('*')
          .ilike('title', `%${term}%`)
          .limit(3);
        if (data) results.push(...data);
      }

      // Active context for idol-gate check
      const activeContext = [book, chapterRef, verseRef || '', ...topics, ...keywords];

      // Deduplicate, exclude documents, apply idol/false-deity context gate
      const seen = new Set<string>();
      const unique = results.filter(a => {
        if (seen.has(a.id)) return false;
        seen.add(a.id);
        if (a.type === 'document') return false;
        // Idol/false-deity assets require context justification before they surface
        if (assetIsIdolCategory(a) && !idolAssetAllowedInContext(a, activeContext)) {
          return false;
        }
        return true;
      });

      setAssets(unique.slice(0, 12));
    })();
  }, [book, chapter, verse, topics.join(','), keywords.join(',')]); // eslint-disable-line react-hooks/exhaustive-deps

  if (assets.length === 0) return null;

  const imageAssets = assets.filter(a => a.url);

  const showPrev = () => setImgIdx(i => Math.max(0, i - 1));
  const showNext = () => setImgIdx(i => Math.min(imageAssets.length - 1, i + 1));

  return (
    <>
      {/* Trigger button */}
      <button
        onClick={() => setOpen(true)}
        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-purple-500/10 text-purple-400 border border-purple-500/20 hover:bg-purple-500/20 transition-colors text-xs font-medium"
        title={`${assets.length} related image${assets.length !== 1 ? 's' : ''}`}
      >
        <Images className="w-3.5 h-3.5" />
        {assets.length} image{assets.length !== 1 ? 's' : ''}
      </button>

      {/* Slide-out panel */}
      <AnimatePresence>
        {open && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm"
              onClick={() => setOpen(false)}
            />

            {/* Panel */}
            <motion.div
              initial={{ opacity: 0, y: 40 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 40 }}
              transition={{ type: 'spring', damping: 28, stiffness: 300 }}
              className="fixed bottom-0 left-0 right-0 z-50 glass-card rounded-t-2xl max-h-[70vh] overflow-hidden flex flex-col"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <div className="flex items-center justify-between p-4 border-b border-slate-700/50 flex-shrink-0">
                <div className="flex items-center gap-2">
                  <Images className="w-5 h-5 text-purple-400" />
                  <h3 className="font-semibold text-white">
                    Reference Images — {reference}
                  </h3>
                  <span className="text-xs text-slate-500">({assets.length} assets)</span>
                </div>
                <button
                  onClick={() => setOpen(false)}
                  className="p-2 rounded-lg hover:bg-slate-700/50 transition-colors"
                >
                  <X className="w-5 h-5 text-slate-400" />
                </button>
              </div>

              {/* Grid */}
              <div className="flex-1 overflow-y-auto p-4">
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
                  {imageAssets.map((asset, i) => (
                    <motion.button
                      key={asset.id}
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: i * 0.04 }}
                      onClick={() => { setLightbox(asset); setImgIdx(i); }}
                      className="group relative aspect-square rounded-lg overflow-hidden bg-slate-800/50 border border-slate-700/50 hover:border-purple-500/50 transition-all"
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={asset.url}
                        alt={asset.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        loading="lazy"
                        onError={(e) => {
                          (e.target as HTMLImageElement).style.display = 'none';
                        }}
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent opacity-0 group-hover:opacity-100 transition-opacity p-2 flex items-end">
                        <p className="text-white text-xs font-medium line-clamp-2 leading-tight">
                          {asset.title}
                        </p>
                      </div>
                    </motion.button>
                  ))}
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Lightbox */}
      <AnimatePresence>
        {lightbox && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-[60] bg-black/90 flex items-center justify-center p-4"
              onClick={() => setLightbox(null)}
            >
              <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.8, opacity: 0 }}
                className="relative max-w-4xl w-full max-h-[85vh] flex flex-col"
                onClick={(e) => e.stopPropagation()}
              >
                {/* Lightbox header */}
                <div className="flex items-center justify-between mb-3">
                  <div className="flex-1 min-w-0">
                    <h3 className="text-white font-semibold truncate">{lightbox.title}</h3>
                    <p className="text-slate-400 text-xs mt-0.5 line-clamp-1">{lightbox.description}</p>
                  </div>
                  <div className="flex items-center gap-2 ml-4 flex-shrink-0">
                    <a
                      href={lightbox.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-2 rounded-lg bg-slate-800/50 text-slate-400 hover:text-white transition-colors"
                      title="Open full size"
                    >
                      <ExternalLink className="w-4 h-4" />
                    </a>
                    <button
                      onClick={() => setLightbox(null)}
                      className="p-2 rounded-lg bg-slate-800/50 text-slate-400 hover:text-white transition-colors"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>
                </div>

                {/* Image */}
                <div className="relative flex-1 min-h-0 rounded-xl overflow-hidden bg-slate-900">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={lightbox.url}
                    alt={lightbox.title}
                    className="w-full h-full object-contain max-h-[65vh]"
                  />

                  {/* Prev / Next */}
                  {imageAssets.length > 1 && (
                    <>
                      <button
                        onClick={() => { const prev = Math.max(0, imgIdx - 1); setImgIdx(prev); setLightbox(imageAssets[prev]); }}
                        disabled={imgIdx === 0}
                        className="absolute left-2 top-1/2 -translate-y-1/2 p-2 rounded-full bg-black/50 text-white hover:bg-black/70 disabled:opacity-30 transition-all"
                      >
                        <ChevronLeft className="w-5 h-5" />
                      </button>
                      <button
                        onClick={() => { const next = Math.min(imageAssets.length - 1, imgIdx + 1); setImgIdx(next); setLightbox(imageAssets[next]); }}
                        disabled={imgIdx === imageAssets.length - 1}
                        className="absolute right-2 top-1/2 -translate-y-1/2 p-2 rounded-full bg-black/50 text-white hover:bg-black/70 disabled:opacity-30 transition-all"
                      >
                        <ChevronRight className="w-5 h-5" />
                      </button>
                    </>
                  )}
                </div>

                {/* Topic tags */}
                {(lightbox.topic_tags || []).length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mt-3">
                    {lightbox.topic_tags.slice(0, 8).map(tag => (
                      <span key={tag} className="text-xs px-2 py-0.5 bg-purple-500/10 text-purple-400 rounded-full border border-purple-500/20">
                        #{tag}
                      </span>
                    ))}
                  </div>
                )}

                {/* Verse references */}
                {(lightbox.verse_references || []).length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mt-2">
                    {lightbox.verse_references.map(ref => (
                      <span key={ref} className="text-xs px-2 py-0.5 bg-amber-500/10 text-amber-400 rounded border border-amber-500/20 font-mono">
                        {ref}
                      </span>
                    ))}
                  </div>
                )}
              </motion.div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
