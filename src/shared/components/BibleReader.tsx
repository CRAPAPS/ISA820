'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useISA820Store } from '@/store/isa820-store';
import { scriptureService } from '@/server/services';
import { supabase } from '@/lib/supabase';
import type { Verse as DBVerse } from '@/lib/supabase';
import type { Verse as UIVerse, PillarType, VoiceSpeaker } from '@/types';
import { Tooltip } from './Tooltip';
import {
  MessageSquare, ChevronRight, Sparkles, Loader2,
  BookOpen, ChevronLeft, AlertCircle,
} from 'lucide-react';
import { RelatedMedia } from './RelatedMedia';

// ── Book chapter counts ──────────────────────────────────────────────────────
const BOOK_CHAPTERS: Record<string, number> = {
  'Genesis': 50, 'Exodus': 40, 'Leviticus': 27, 'Numbers': 36,
  'Deuteronomy': 34, 'Joshua': 24, 'Judges': 21, 'Ruth': 4,
  '1 Samuel': 31, '2 Samuel': 24, '1 Kings': 22, '2 Kings': 25,
  '1 Chronicles': 29, '2 Chronicles': 36, 'Ezra': 10, 'Nehemiah': 13,
  'Esther': 10, 'Job': 42, 'Psalms': 150, 'Proverbs': 31,
  'Ecclesiastes': 12, 'Song of Solomon': 8, 'Isaiah': 66, 'Jeremiah': 52,
  'Lamentations': 5, 'Ezekiel': 48, 'Daniel': 12, 'Hosea': 14,
  'Joel': 3, 'Amos': 9, 'Obadiah': 1, 'Jonah': 4, 'Micah': 7,
  'Nahum': 3, 'Habakkuk': 3, 'Zephaniah': 3, 'Haggai': 2,
  'Zechariah': 14, 'Malachi': 4,
  'Matthew': 28, 'Mark': 16, 'Luke': 24, 'John': 21, 'Acts': 28,
  'Romans': 16, '1 Corinthians': 16, '2 Corinthians': 13, 'Galatians': 6,
  'Ephesians': 6, 'Philippians': 4, 'Colossians': 4,
  '1 Thessalonians': 5, '2 Thessalonians': 3, '1 Timothy': 6,
  '2 Timothy': 4, 'Titus': 3, 'Philemon': 1, 'Hebrews': 13,
  'James': 5, '1 Peter': 5, '2 Peter': 3, '1 John': 5,
  '2 John': 1, '3 John': 1, 'Jude': 1, 'Revelation': 22,
};

const BOOK_ORDER = Object.keys(BOOK_CHAPTERS);
const DEFAULT_BOOK    = 'Genesis';
const DEFAULT_CHAPTER = 1;

// NT books use TBESG (Greek), OT books use TAHOT (Hebrew)
// Translations not stored in Supabase — fetched from external APIs
const EXTERNAL_TRANSLATIONS = new Set<string>();

// All external translations route through our server-side proxy to avoid CORS issues
async function fetchExternalVerses(book: string, chapter: number, translation: string): Promise<DBVerse[]> {
  try {
    const url = `/api/bible-external?book=${encodeURIComponent(book)}&chapter=${chapter}&translation=${translation}`;
    const res = await fetch(url);
    if (!res.ok) return [];
    const data = await res.json() as { verses: DBVerse[] };
    return data.verses || [];
  } catch {
    return [];
  }
}

const NT_BOOKS = new Set([
  'Matthew','Mark','Luke','John','Acts','Romans',
  '1 Corinthians','2 Corinthians','Galatians','Ephesians','Philippians','Colossians',
  '1 Thessalonians','2 Thessalonians','1 Timothy','2 Timothy','Titus','Philemon',
  'Hebrews','James','1 Peter','2 Peter','1 John','2 John','3 John','Jude','Revelation',
]);

function getEffectiveTranslation(book: string, userTranslation: string): string {
  const isNT = NT_BOOKS.has(book);
  if (isNT && userTranslation === 'TAHOT') return 'TBESG';
  if (!isNT && userTranslation === 'TBESG') return 'TAHOT';
  return userTranslation;
}

// ── Helpers ──────────────────────────────────────────────────────────────────
function toUIVerse(v: DBVerse): UIVerse {
  return {
    id: v.id, book: v.book, chapter: v.chapter, verse: v.verse, text: v.text,
    translation: v.translation as UIVerse['translation'],
    speaker: (v.speaker as VoiceSpeaker) || undefined,
    strongs: (v.strongs_numbers || []).map(sid => ({
      word: sid, strongsId: sid, transliteration: '',
      definition: 'Click to load definition', usageCount: 0,
      position: { start: 0, end: 0 },
    })),
    pillars: (v.pillar_tags || []) as PillarType[],
  };
}

function getVoiceClass(speaker?: VoiceSpeaker | null) {
  if (speaker === 'FATHER') return 'voice-father';
  if (speaker === 'SON')    return 'voice-son';
  if (speaker === 'ANGEL')  return 'voice-angel';
  return '';
}

// ── Inline word with superscript Strong's number ────────────────────────────
function InlineStrongsWord({ text, strongsId }: { text: string; strongsId: string }) {
  const { openStrongsPanel } = useISA820Store();
  const [fetching, setFetching] = useState(false);

  const handleClick = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (fetching) return;
    setFetching(true);
    try {
      const { data } = await supabase
        .from('strongs_lexicon').select('*').eq('strongs_id', strongsId).single();
      openStrongsPanel(data ? {
        word: data.word || strongsId,
        strongsId: data.strongs_id,
        transliteration: data.transliteration || '',
        definition: data.definition || '',
        usageCount: data.usage_count || 0,
        position: { start: 0, end: 0 },
      } : {
        word: strongsId, strongsId,
        transliteration: '', definition: 'Loading…', usageCount: 0,
        position: { start: 0, end: 0 },
      });
    } finally { setFetching(false); }
  };

  if (!text.trim()) return null; // skip invisible particles

  return (
    <button
      onClick={handleClick}
      title={`${strongsId} — click to look up`}
      className="inline-flex flex-col items-center leading-none mr-[0.15em] group align-baseline hover:text-cyan-300 transition-colors"
    >
      <span className="relative">
        {text}
        <sup className={`ml-[1px] text-[0.6em] font-mono transition-colors ${
          fetching ? 'text-slate-500' : 'text-cyan-500/70 group-hover:text-cyan-400'
        }`}>
          {strongsId}
        </sup>
      </span>
    </button>
  );
}

// ── Strong's chip ────────────────────────────────────────────────────────────
function StrongsChip({ strongsId }: { strongsId: string }) {
  const { openStrongsPanel } = useISA820Store();
  const [fetching, setFetching] = useState(false);

  const handleClick = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (fetching) return;
    setFetching(true);
    try {
      const { data } = await supabase
        .from('strongs_lexicon').select('*').eq('strongs_id', strongsId).single();
      if (data) {
        openStrongsPanel({
          word: data.word || strongsId,
          strongsId: data.strongs_id,
          transliteration: data.transliteration || '',
          definition: data.definition || '',
          usageCount: data.usage_count || 0,
          position: { start: 0, end: 0 },
        });
      }
    } finally { setFetching(false); }
  };

  return (
    <button onClick={handleClick}
      className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-xs font-mono bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 hover:bg-cyan-500/20 transition-colors"
      title={`Open ${strongsId} in lexicon`}
    >
      {fetching ? <Loader2 className="w-2.5 h-2.5 animate-spin" /> : null}
      {strongsId}
    </button>
  );
}

// ── Single verse card ────────────────────────────────────────────────────────
function VerseCard({
  verse, isCurrent, onSelect,
}: {
  verse: DBVerse;
  isCurrent: boolean;
  onSelect: () => void;
}) {
  const { triggerPillarPulse, openSidebarForVerse, sidebar } = useISA820Store();
  const isAnalysed = sidebar.selectedVerseForAnalysis?.id === verse.id;
  const pillars = verse.pillar_tags || [];
  const strongs = verse.strongs_numbers || [];
  const textTokens = verse.text.trim().split(/\s+/);
  const canInlineTAHOT = !verse.word_strongs && strongs.length > 0 && textTokens.length === strongs.length;

  // Extract content words for image search — 4+ chars, has a Strong's ID (excludes
  // particles/conjunctions that have no visual meaning), deduplicated.
  const mediaKeywords = verse.word_strongs
    ? [...new Set(
        verse.word_strongs
          .filter(tok => tok.s && tok.t.trim().length >= 4)
          .map(tok => tok.t.trim().toLowerCase())
          .slice(0, 10)
      )]
    : [];

  const handleClick = useCallback(() => {
    onSelect();
    openSidebarForVerse(toUIVerse(verse));
  }, [verse, onSelect, openSidebarForVerse]);

  return (
    <motion.div
      id={`bv-${verse.verse}`}
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className={`glass-card p-5 cursor-pointer transition-all duration-200 ${
        isCurrent
          ? 'border-amber-500/50 ring-glow-gold -translate-y-px'
          : isAnalysed
            ? 'border-cyan-500/40 ring-glow-cyan'
            : 'hover:border-slate-600/50 hover:-translate-y-px hover:shadow-lg hover:shadow-black/20'
      }`}
      onClick={handleClick}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-3">
          {/* Verse number badge */}
          <button
            onClick={e => { e.stopPropagation(); handleClick(); }}
            className={`flex items-center gap-1 px-2.5 py-1 rounded-lg font-mono font-bold text-sm transition-all ${
              isCurrent
                ? 'bg-amber-500/25 text-amber-300 border border-amber-500/40'
                : 'bg-slate-800/60 text-slate-400 hover:bg-amber-500/20 hover:text-amber-400'
            }`}
          >
            {verse.verse}
            <ChevronRight className="w-3 h-3 opacity-60" />
          </button>

          <span className="text-slate-500 text-xs">
            {verse.book} {verse.chapter}:{verse.verse}
          </span>

          {/* Speaker badge */}
          {verse.speaker && verse.speaker !== 'UNKNOWN' && (
            <button
              onClick={e => {
                e.stopPropagation();
                triggerPillarPulse(
                  verse.speaker === 'FATHER' ? 'isa820' : verse.speaker === 'SON' ? 'deut64' : 'nature'
                );
              }}
              className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-medium transition-all ${
                verse.speaker === 'FATHER' ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30 hover:bg-amber-500/30' :
                verse.speaker === 'SON'    ? 'bg-red-500/20 text-red-400 border border-red-500/30 hover:bg-red-500/30' :
                                            'bg-slate-500/20 text-slate-300 border border-slate-500/30 hover:bg-slate-500/30'
              }`}
            >
              <span className={`w-1.5 h-1.5 rounded-full ${
                verse.speaker === 'FATHER' ? 'bg-amber-400' :
                verse.speaker === 'SON'    ? 'bg-red-400' : 'bg-slate-400'
              }`} />
              {verse.speaker === 'FATHER' ? 'Father' : verse.speaker === 'SON' ? 'Son' : 'Angel'}
            </button>
          )}
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-600">{verse.translation}</span>
          <Tooltip content={{
            title: 'Forensic Analysis',
            description: 'Open the sidebar with topic analysis for this verse.',
            spiritualLogic: 'Click verse to load AI-powered rebuttals from the Knowledge Base.',
          }}>
            <button
              onClick={e => { e.stopPropagation(); handleClick(); }}
              className="p-1 rounded hover:bg-slate-700/50 transition-colors"
            >
              <Sparkles className={`w-4 h-4 ${isCurrent || isAnalysed ? 'text-amber-400' : 'text-slate-600'}`} />
            </button>
          </Tooltip>
        </div>
      </div>

      {/* Verse text — word_strongs (KJV), TAHOT zip, or plain */}
      <p className={`bible-text leading-relaxed text-base ${getVoiceClass(verse.speaker as VoiceSpeaker)}`}>
        {verse.word_strongs && verse.word_strongs.length > 0
          ? verse.word_strongs.map((tok, i) =>
              tok.s ? <InlineStrongsWord key={i} text={tok.t} strongsId={tok.s} />
                    : <span key={i}>{tok.t}</span>
            )
          : canInlineTAHOT
            ? textTokens.map((tok, i) => <InlineStrongsWord key={i} text={tok} strongsId={strongs[i]} />)
            : verse.text
        }
      </p>

      {/* Fallback chip row — only when token count mismatches strongs_numbers */}
      {!verse.word_strongs && strongs.length > 0 && !canInlineTAHOT && (
        <div className="flex flex-wrap gap-1.5 mt-3 pt-3 border-t border-slate-700/30">
          <span className="text-xs text-slate-600 self-center mr-1">Strong&apos;s:</span>
          {strongs.slice(0, 12).map(sid => <StrongsChip key={sid} strongsId={sid} />)}
          {strongs.length > 12 && (
            <span className="text-xs text-slate-600 self-center">+{strongs.length - 12} more</span>
          )}
        </div>
      )}

      {/* Pillar tags */}
      {pillars.length > 0 && (
        <div className="flex flex-wrap items-center gap-2 mt-3 pt-3 border-t border-slate-700/30">
          {pillars.map(p => (
            <span key={p} className={`text-xs px-2 py-1 rounded-md ${
              p === 'ISA820' ? 'bg-amber-500/10 text-amber-400/80' :
              p === 'DEUT64' ? 'bg-blue-500/10 text-blue-400/80' :
              'bg-purple-500/10 text-purple-400/80'
            }`}>{p}</span>
          ))}
          <RelatedMedia book={verse.book} chapter={verse.chapter} verse={verse.verse}
            topics={pillars.map(p => p.toLowerCase())} keywords={mediaKeywords} />
        </div>
      )}
      {pillars.length === 0 && (
        <div className="mt-3 pt-3 border-t border-slate-700/30" onClick={e => e.stopPropagation()}>
          <RelatedMedia book={verse.book} chapter={verse.chapter} verse={verse.verse}
            keywords={mediaKeywords} />
        </div>
      )}
    </motion.div>
  );
}

// ── Main BibleReader ─────────────────────────────────────────────────────────
export function BibleReader() {
  const { isParallelMode, currentTranslation, secondaryTranslation, currentPassage, setCurrentPassage, speakerFilter } = useISA820Store();

  const [verses,          setVerses]         = useState<DBVerse[]>([]);
  const [secondaryVerses, setSecondaryVerses] = useState<DBVerse[]>([]);
  const [loading,         setLoading]        = useState(true);
  const [error,           setError]          = useState<string | null>(null);

  // ── CORE: verseIdx is the ONLY source of truth for current position ──────
  // It is a 0-based index into the `verses` array.
  // We NEVER navigate by verse number — only by array index.
  const [verseIdx, setVerseIdx] = useState(0);

  // Signals to set after the next chapter loads
  const goToLastRef      = useRef(false);       // go to last verse after load
  const targetVerseRef   = useRef<number | null>(null); // go to this verse number after load

  const book    = currentPassage?.book    ?? DEFAULT_BOOK;
  const chapter = currentPassage?.chapter ?? DEFAULT_CHAPTER;
  const maxChap = BOOK_CHAPTERS[book] ?? 150;
  const bookIdx = BOOK_ORDER.indexOf(book);

  // Convenient derived values
  const currentVerse = verses[verseIdx] ?? null;
  const isFirstInBible = bookIdx === 0 && chapter === 1 && verseIdx === 0;
  const isLastInBible  = bookIdx === BOOK_ORDER.length - 1 && chapter === maxChap && verseIdx === verses.length - 1;

  // ── Default passage on mount ─────────────────────────────────────────────
  useEffect(() => {
    if (!currentPassage) setCurrentPassage({ book: DEFAULT_BOOK, chapter: DEFAULT_CHAPTER });
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Capture target verse from passage BEFORE fetch fires ─────────────────
  // (library or passage-selector may set currentPassage.verse)
  useEffect(() => {
    if (currentPassage?.verse && currentPassage.verse > 0) {
      targetVerseRef.current = currentPassage.verse;
    }
  }, [currentPassage?.book, currentPassage?.chapter, currentPassage?.verse]);

  // Auto-select correct translation (TAHOT for OT, TBESG for NT)
  const effectiveTranslation = getEffectiveTranslation(book, currentTranslation);

  // ── Fetch primary translation ────────────────────────────────────────────
  useEffect(() => {
    setLoading(true);
    setError(null);
    const fetch = EXTERNAL_TRANSLATIONS.has(effectiveTranslation)
      ? fetchExternalVerses(book, chapter, effectiveTranslation)
      : scriptureService.getVerses(book, chapter, effectiveTranslation).then(d => d as unknown as DBVerse[]);
    fetch
      .then(data => { setVerses(data); setLoading(false); })
      .catch(err => {
        console.error('Verse fetch error:', err);
        setError('Failed to load verses. Check connection.');
        setLoading(false);
      });
  }, [book, chapter, effectiveTranslation]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── After verses load: resolve starting position ─────────────────────────
  useEffect(() => {
    if (loading || verses.length === 0) return;

    if (goToLastRef.current) {
      // Coming backward from next chapter — land on last verse
      setVerseIdx(verses.length - 1);
      goToLastRef.current = false;
      targetVerseRef.current = null;
      return;
    }

    if (targetVerseRef.current !== null) {
      // Library or passage-selector specified a verse number
      const target = targetVerseRef.current;
      targetVerseRef.current = null;
      const idx = verses.findIndex(v => v.verse === target);
      setVerseIdx(idx >= 0 ? idx : 0);
      return;
    }

    // Default: start at first verse
    setVerseIdx(0);
  }, [loading, verses]); // eslint-disable-line react-hooks/exhaustive-deps

  const effectiveSecondaryTranslation = getEffectiveTranslation(book, secondaryTranslation);

  // ── Fetch secondary (parallel mode) ─────────────────────────────────────
  useEffect(() => {
    if (!isParallelMode) { setSecondaryVerses([]); return; }
    const fetch = EXTERNAL_TRANSLATIONS.has(effectiveSecondaryTranslation)
      ? fetchExternalVerses(book, chapter, effectiveSecondaryTranslation)
      : scriptureService.getVerses(book, chapter, effectiveSecondaryTranslation).then(d => d as unknown as DBVerse[]);
    fetch
      .then(data => setSecondaryVerses(data))
      .catch(() => setSecondaryVerses([]));
  }, [book, chapter, effectiveSecondaryTranslation, isParallelMode]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Auto-scroll current verse into view ──────────────────────────────────
  useEffect(() => {
    if (!currentVerse || loading) return;
    const el = document.getElementById(`bv-${currentVerse.verse}`);
    el?.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }, [verseIdx, loading]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Chapter navigation (prev/next chapter or book) ───────────────────────
  const navigateChapter = useCallback((delta: number, goToLast = false) => {
    goToLastRef.current = goToLast;
    targetVerseRef.current = null;
    const next = chapter + delta;
    if (next < 1) {
      if (bookIdx > 0) {
        const prevBook = BOOK_ORDER[bookIdx - 1];
        setCurrentPassage({ book: prevBook, chapter: BOOK_CHAPTERS[prevBook] });
      }
    } else if (next > maxChap) {
      if (bookIdx < BOOK_ORDER.length - 1) {
        setCurrentPassage({ book: BOOK_ORDER[bookIdx + 1], chapter: 1 });
      }
    } else {
      setCurrentPassage({ book, chapter: next });
    }
  }, [book, chapter, maxChap, bookIdx, setCurrentPassage]);

  // ── Verse-by-verse navigation ─────────────────────────────────────────────
  // Uses array index — always correct regardless of verse numbering gaps in DB
  const prevVerse = useCallback(() => {
    if (verseIdx > 0) {
      setVerseIdx(i => i - 1);
    } else {
      navigateChapter(-1, true); // go to previous chapter, land on last verse
    }
  }, [verseIdx, navigateChapter]);

  const nextVerse = useCallback(() => {
    if (verseIdx < verses.length - 1) {
      setVerseIdx(i => i + 1);
    } else {
      navigateChapter(1, false); // go to next chapter, land on first verse
    }
  }, [verseIdx, verses.length, navigateChapter]);

  // Secondary verse map for parallel mode
  const secondaryByVerse = secondaryVerses.reduce<Record<number, DBVerse>>((acc, v) => {
    acc[v.verse] = v; return acc;
  }, {});

  // ── Loading ───────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="space-y-4">
        {[...Array(6)].map((_, i) => (
          <div key={i} className="glass-card p-5 animate-pulse">
            <div className="h-4 bg-slate-700/50 rounded w-28 mb-4" />
            <div className="space-y-2">
              <div className="h-4 bg-slate-700/40 rounded w-full" />
              <div className="h-4 bg-slate-700/40 rounded w-5/6" />
              <div className="h-4 bg-slate-700/40 rounded w-4/6" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  // ── Error ─────────────────────────────────────────────────────────────────
  if (error) {
    return (
      <div className="glass-card p-12 text-center">
        <AlertCircle className="w-12 h-12 text-red-400 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-slate-300 mb-2">Error loading scripture</h3>
        <p className="text-slate-500 text-sm">{error}</p>
        <button
          onClick={() => setCurrentPassage({ book, chapter })}
          className="mt-4 px-4 py-2 bg-slate-700/50 rounded-lg text-sm text-slate-300 hover:bg-slate-600/50 transition-colors"
        >Retry</button>
      </div>
    );
  }

  // ── Empty ─────────────────────────────────────────────────────────────────
  if (verses.length === 0) {
    return (
      <div className="space-y-6">
        <NavBar book={book} chapter={chapter} verse={null} maxChap={maxChap} bookIdx={bookIdx}
          onPrev={prevVerse} onNext={nextVerse} onChapter={navigateChapter}
          isFirst={isFirstInBible} isLast={isLastInBible}
          translation={effectiveTranslation}
          secondaryTranslation={isParallelMode ? effectiveSecondaryTranslation : undefined} />
        <div className="glass-card p-12 text-center">
          <MessageSquare className="w-12 h-12 text-slate-600 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-slate-300 mb-2">No verses found</h3>
          <p className="text-slate-500 text-sm">
            {book} {chapter} is not available in <strong>{effectiveTranslation}</strong>.
          </p>
          <p className="text-slate-600 text-xs mt-2">Data may still be loading from vault.</p>
        </div>
      </div>
    );
  }

  // ── Main render ───────────────────────────────────────────────────────────
  return (
    <div className="space-y-6">
      {/* Speaker Voice Legend + Filter Status */}
      <div className="glass-card px-4 py-2.5 flex items-center gap-4 flex-wrap">
        <span className="text-xs text-slate-500 uppercase tracking-wide">Voice Signatures</span>
        <div className="flex items-center gap-3 flex-wrap">
          <span className="flex items-center gap-1.5 text-xs">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-400 inline-block" />
            <span className="text-amber-400 font-medium">Father</span>
            <span className="text-slate-500">— Gold</span>
          </span>
          <span className="flex items-center gap-1.5 text-xs">
            <span className="w-2.5 h-2.5 rounded-full bg-red-400 inline-block" />
            <span className="text-red-400 font-medium">Son (Yeshua)</span>
            <span className="text-slate-500">— Crimson</span>
          </span>
          <span className="flex items-center gap-1.5 text-xs">
            <span className="w-2.5 h-2.5 rounded-full bg-slate-300 inline-block" />
            <span className="text-slate-300 font-medium">Angel</span>
            <span className="text-slate-500">— Silver</span>
          </span>
        </div>
        {speakerFilter !== 'ALL' && (
          <span className="ml-auto text-xs px-2 py-0.5 rounded bg-amber-500/10 text-amber-400 border border-amber-500/20">
            Filtering: {speakerFilter} — click pillar icon to clear
          </span>
        )}
        {speakerFilter === 'ALL' && (
          <span className="ml-auto text-xs text-slate-600">Click 🔦①✦ in header to filter by speaker</span>
        )}
      </div>

      <NavBar
        book={book} chapter={chapter} verse={currentVerse?.verse ?? 1}
        maxChap={maxChap} bookIdx={bookIdx}
        onPrev={prevVerse} onNext={nextVerse} onChapter={navigateChapter}
        isFirst={isFirstInBible} isLast={isLastInBible}
        translation={effectiveTranslation}
        secondaryTranslation={isParallelMode ? effectiveSecondaryTranslation : undefined}
      />

      {/* Parallel column headers */}
      {isParallelMode && (
        <div className="grid grid-cols-2 gap-3 px-1">
          <div className="flex items-center gap-2">
            <span className="text-xs px-2.5 py-1 rounded-lg bg-amber-500/15 text-amber-400 border border-amber-500/25 font-medium">
              {effectiveTranslation}
            </span>
            <span className="text-xs text-slate-600 hidden sm:inline">Primary</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs px-2.5 py-1 rounded-lg bg-cyan-500/15 text-cyan-400 border border-cyan-500/25 font-medium">
              {effectiveSecondaryTranslation}
            </span>
            <span className="text-xs text-slate-600 hidden sm:inline">Parallel</span>
          </div>
        </div>
      )}

      <AnimatePresence mode="wait">
        <motion.div
          key={`${book}-${chapter}-${effectiveTranslation}`}
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          transition={{ duration: 0.15 }}
          className="space-y-4"
        >
          {isParallelMode
            ? verses.map((v, i) => {
                const dimmed = speakerFilter !== 'ALL' && v.speaker !== speakerFilter;
                return (
                  <div key={v.id} className={`transition-opacity ${dimmed ? 'opacity-25' : ''}`}>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <VerseCard verse={v} isCurrent={i === verseIdx} onSelect={() => setVerseIdx(i)} />
                      {secondaryByVerse[v.verse]
                        ? <VerseCard verse={secondaryByVerse[v.verse]} isCurrent={i === verseIdx} onSelect={() => setVerseIdx(i)} />
                        : <div className="glass-card p-4 flex items-center justify-center text-slate-600 text-sm italic rounded-xl">
                            No {v.chapter}:{v.verse} in secondary translation
                          </div>
                      }
                    </div>
                  </div>
                );
              })
            : verses.map((v, i) => {
                const dimmed = speakerFilter !== 'ALL' && v.speaker !== speakerFilter;
                return (
                  <motion.div key={v.id}
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: Math.min(i * 0.025, 0.35) }}
                    className={`transition-opacity ${dimmed ? 'opacity-20' : ''}`}
                  >
                    <VerseCard verse={v} isCurrent={i === verseIdx} onSelect={() => setVerseIdx(i)} />
                  </motion.div>
                );
              })
          }
        </motion.div>
      </AnimatePresence>

      {/* Bottom nav */}
      <NavBar
        book={book} chapter={chapter} verse={currentVerse?.verse ?? 1}
        maxChap={maxChap} bookIdx={bookIdx}
        onPrev={prevVerse} onNext={nextVerse} onChapter={navigateChapter}
        isFirst={isFirstInBible} isLast={isLastInBible}
        translation={effectiveTranslation}
      />
    </div>
  );
}

// ── Navigation bar ───────────────────────────────────────────────────────────
function NavBar({
  book, chapter, verse, maxChap, bookIdx,
  onPrev, onNext, onChapter,
  isFirst, isLast,
  translation, secondaryTranslation,
}: {
  book: string; chapter: number; verse: number | null; maxChap: number; bookIdx: number;
  onPrev: () => void; onNext: () => void;
  onChapter: (delta: number) => void;
  isFirst: boolean; isLast: boolean;
  translation: string; secondaryTranslation?: string;
}) {
  const isFirstChap = bookIdx === 0 && chapter === 1;
  const isLastChap  = bookIdx === BOOK_ORDER.length - 1 && chapter === maxChap;

  const prevChapLabel = chapter > 1
    ? `Ch ${chapter - 1}`
    : bookIdx > 0 ? BOOK_ORDER[bookIdx - 1] : '';
  const nextChapLabel = chapter < maxChap
    ? `Ch ${chapter + 1}`
    : bookIdx < BOOK_ORDER.length - 1 ? BOOK_ORDER[bookIdx + 1] : '';

  return (
    <div className="glass-card overflow-hidden">
      {/* Primary row — verse prev / reference / verse next */}
      <div className="flex items-stretch">
        {/* Prev verse */}
        <button
          onClick={onPrev} disabled={isFirst}
          className="flex items-center gap-2 px-5 py-4 text-slate-400 hover:text-amber-400 hover:bg-amber-500/10 disabled:opacity-25 disabled:cursor-not-allowed transition-all border-r border-slate-700/40"
        >
          <ChevronLeft className="w-5 h-5 flex-shrink-0" />
          <span className="text-sm hidden sm:inline">Prev</span>
        </button>

        {/* Centre: reference + translation badge */}
        <div className="flex-1 flex flex-col items-center justify-center py-3 px-4">
          <div className="flex items-center gap-2">
            <BookOpen className="w-4 h-4 text-amber-400/60" />
            <span className="font-semibold text-white text-base tracking-wide">
              {book}&nbsp;
              <span className="text-amber-400">{chapter}</span>
              {verse !== null && (
                <span className="text-slate-400">:{verse}</span>
              )}
            </span>
          </div>
          <div className="flex items-center gap-2 mt-1">
            <span className="text-xs px-2 py-0.5 rounded bg-amber-500/10 text-amber-400 border border-amber-500/20">
              {translation}
            </span>
            {secondaryTranslation && (
              <>
                <span className="text-xs text-slate-600">vs</span>
                <span className="text-xs px-2 py-0.5 rounded bg-blue-500/10 text-blue-400 border border-blue-500/20">
                  {secondaryTranslation}
                </span>
              </>
            )}
          </div>
        </div>

        {/* Next verse */}
        <button
          onClick={onNext} disabled={isLast}
          className="flex items-center gap-2 px-5 py-4 text-slate-400 hover:text-amber-400 hover:bg-amber-500/10 disabled:opacity-25 disabled:cursor-not-allowed transition-all border-l border-slate-700/40"
        >
          <span className="text-sm hidden sm:inline">Next</span>
          <ChevronRight className="w-5 h-5 flex-shrink-0" />
        </button>
      </div>

      {/* Secondary row — chapter navigation */}
      <div className="flex items-center justify-between px-4 py-2 bg-slate-900/40 border-t border-slate-700/30">
        <button
          onClick={() => onChapter(-1)} disabled={isFirstChap}
          className="flex items-center gap-1 text-xs text-slate-500 hover:text-slate-300 disabled:opacity-25 disabled:cursor-not-allowed transition-colors px-2 py-1 rounded hover:bg-slate-700/40"
        >
          <ChevronLeft className="w-3.5 h-3.5" />
          <span className="hidden sm:inline truncate max-w-[80px]">{prevChapLabel}</span>
        </button>

        {/* Chapter progress strip */}
        <div className="flex-1 mx-3 overflow-x-auto scrollbar-hide">
          <div className="flex items-center gap-1 justify-center min-w-max py-1">
            {Array.from({ length: maxChap }, (_, i) => i + 1).map(ch => (
              <button
                key={ch}
                onClick={() => onChapter(ch - chapter)}
                title={`${book} ${ch}`}
                className={`rounded transition-all flex-shrink-0 ${
                  ch === chapter
                    ? 'w-8 h-5 bg-amber-500/30 text-amber-400 text-xs font-bold border border-amber-500/50'
                    : 'w-1.5 h-3 bg-slate-700/60 hover:bg-amber-500/40 hover:scale-125'
                }`}
              >
                {ch === chapter ? ch : ''}
              </button>
            ))}
          </div>
        </div>

        <button
          onClick={() => onChapter(1)} disabled={isLastChap}
          className="flex items-center gap-1 text-xs text-slate-500 hover:text-slate-300 disabled:opacity-25 disabled:cursor-not-allowed transition-colors px-2 py-1 rounded hover:bg-slate-700/40"
        >
          <span className="hidden sm:inline truncate max-w-[80px]">{nextChapLabel}</span>
          <ChevronRight className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
}
