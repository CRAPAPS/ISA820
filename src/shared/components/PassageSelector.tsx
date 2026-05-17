'use client';

import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { useISA820Store } from '@/store/isa820-store';
import { Search, BookOpen, Columns, X, Check } from 'lucide-react';
import { Tooltip } from './Tooltip';
import { BrowseLibraryButton } from './VisualLibraryBrowser';

// Expanded passage data for search
const PASSAGE_INDEX = [
  // Old Testament
  { book: 'Genesis', abbrev: 'Gen', chapters: 50 },
  { book: 'Exodus', abbrev: 'Exod', chapters: 40 },
  { book: 'Leviticus', abbrev: 'Lev', chapters: 27 },
  { book: 'Numbers', abbrev: 'Num', chapters: 36 },
  { book: 'Deuteronomy', abbrev: 'Deut', chapters: 34 },
  { book: 'Joshua', abbrev: 'Josh', chapters: 24 },
  { book: 'Judges', abbrev: 'Judg', chapters: 21 },
  { book: 'Ruth', abbrev: 'Ruth', chapters: 4 },
  { book: '1 Samuel', abbrev: '1 Sam', chapters: 31 },
  { book: '2 Samuel', abbrev: '2 Sam', chapters: 24 },
  { book: '1 Kings', abbrev: '1 Kgs', chapters: 22 },
  { book: '2 Kings', abbrev: '2 Kgs', chapters: 25 },
  { book: '1 Chronicles', abbrev: '1 Chr', chapters: 29 },
  { book: '2 Chronicles', abbrev: '2 Chr', chapters: 36 },
  { book: 'Ezra', abbrev: 'Ezra', chapters: 10 },
  { book: 'Nehemiah', abbrev: 'Neh', chapters: 13 },
  { book: 'Esther', abbrev: 'Est', chapters: 10 },
  { book: 'Job', abbrev: 'Job', chapters: 42 },
  { book: 'Psalms', abbrev: 'Ps', chapters: 150 },
  { book: 'Proverbs', abbrev: 'Prov', chapters: 31 },
  { book: 'Ecclesiastes', abbrev: 'Eccl', chapters: 12 },
  { book: 'Song of Solomon', abbrev: 'Song', chapters: 8 },
  { book: 'Isaiah', abbrev: 'Isa', chapters: 66 },
  { book: 'Jeremiah', abbrev: 'Jer', chapters: 52 },
  { book: 'Lamentations', abbrev: 'Lam', chapters: 5 },
  { book: 'Ezekiel', abbrev: 'Ezek', chapters: 48 },
  { book: 'Daniel', abbrev: 'Dan', chapters: 12 },
  { book: 'Hosea', abbrev: 'Hos', chapters: 14 },
  { book: 'Joel', abbrev: 'Joel', chapters: 3 },
  { book: 'Amos', abbrev: 'Amos', chapters: 9 },
  { book: 'Obadiah', abbrev: 'Obad', chapters: 1 },
  { book: 'Jonah', abbrev: 'Jonah', chapters: 4 },
  { book: 'Micah', abbrev: 'Mic', chapters: 7 },
  { book: 'Nahum', abbrev: 'Nah', chapters: 3 },
  { book: 'Habakkuk', abbrev: 'Hab', chapters: 3 },
  { book: 'Zephaniah', abbrev: 'Zeph', chapters: 3 },
  { book: 'Haggai', abbrev: 'Hag', chapters: 2 },
  { book: 'Zechariah', abbrev: 'Zech', chapters: 14 },
  { book: 'Malachi', abbrev: 'Mal', chapters: 4 },
  // New Testament
  { book: 'Matthew', abbrev: 'Matt', chapters: 28 },
  { book: 'Mark', abbrev: 'Mark', chapters: 16 },
  { book: 'Luke', abbrev: 'Luke', chapters: 24 },
  { book: 'John', abbrev: 'John', chapters: 21 },
  { book: 'Acts', abbrev: 'Acts', chapters: 28 },
  { book: 'Romans', abbrev: 'Rom', chapters: 16 },
  { book: '1 Corinthians', abbrev: '1 Cor', chapters: 16 },
  { book: '2 Corinthians', abbrev: '2 Cor', chapters: 13 },
  { book: 'Galatians', abbrev: 'Gal', chapters: 6 },
  { book: 'Ephesians', abbrev: 'Eph', chapters: 6 },
  { book: 'Philippians', abbrev: 'Phil', chapters: 4 },
  { book: 'Colossians', abbrev: 'Col', chapters: 4 },
  { book: '1 Thessalonians', abbrev: '1 Thess', chapters: 5 },
  { book: '2 Thessalonians', abbrev: '2 Thess', chapters: 3 },
  { book: '1 Timothy', abbrev: '1 Tim', chapters: 6 },
  { book: '2 Timothy', abbrev: '2 Tim', chapters: 4 },
  { book: 'Titus', abbrev: 'Titus', chapters: 3 },
  { book: 'Philemon', abbrev: 'Phlm', chapters: 1 },
  { book: 'Hebrews', abbrev: 'Heb', chapters: 13 },
  { book: 'James', abbrev: 'Jas', chapters: 5 },
  { book: '1 Peter', abbrev: '1 Pet', chapters: 5 },
  { book: '2 Peter', abbrev: '2 Pet', chapters: 3 },
  { book: '1 John', abbrev: '1 John', chapters: 5 },
  { book: '2 John', abbrev: '2 John', chapters: 1 },
  { book: '3 John', abbrev: '3 John', chapters: 1 },
  { book: 'Jude', abbrev: 'Jude', chapters: 1 },
  { book: 'Revelation', abbrev: 'Rev', chapters: 22 },
];

interface SearchResult {
  book: string;
  abbrev: string;
  chapter?: number;
  verse?: number;
  fullMatch: string;
}

function parsePassage(input: string): SearchResult | null {
  if (!input.trim()) return null;

  // Normalize: "1cor" → "1 cor", "john3" → "john 3", collapse spaces
  let s = input.trim().toLowerCase().replace(/[.,;!?]/g, '');
  s = s.replace(/^([123])\s*([a-z])/, '$1 $2');
  s = s.replace(/([a-z])(\d)/g, '$1 $2');
  s = s.replace(/\s+/g, ' ').trim();

  for (const passage of PASSAGE_INDEX) {
    const bookLow   = passage.book.toLowerCase();
    const abbrevLow = passage.abbrev.toLowerCase();

    let rest: string | null = null;
    if      (s === bookLow || s === abbrevLow) rest = '';
    else if (s.startsWith(bookLow + ' '))      rest = s.slice(bookLow.length).trim();
    else if (s.startsWith(abbrevLow + ' '))    rest = s.slice(abbrevLow.length).trim();

    if (rest === null) continue;
    if (rest === '') return { book: passage.book, abbrev: passage.abbrev, fullMatch: input };

    // Accept "3", "3:16", or "3 16" (space as verse separator)
    const nums = rest.split(/[:\s]+/).map(Number).filter(n => !isNaN(n) && n > 0);
    const chapter = nums[0];
    const verse   = nums[1];
    if (!chapter || chapter < 1 || chapter > passage.chapters) {
      return { book: passage.book, abbrev: passage.abbrev, fullMatch: input };
    }
    return { book: passage.book, abbrev: passage.abbrev, chapter, verse, fullMatch: input };
  }
  return null;
}

export function PassageSelector() {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();
  const {
    isParallelMode,
    toggleParallelMode,
    setCurrentPassage,
    currentPassage,
    openSidebarForVerse,
    currentTranslation,
    secondaryTranslation
  } = useISA820Store();

  // Load recent searches from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('isa820-recent-passages');
    if (saved) {
      setRecentSearches(JSON.parse(saved).slice(0, 5));
    }
  }, []);

  // Search as user types
  useEffect(() => {
    if (searchQuery.length < 1) {
      setSearchResults([]);
      return;
    }

    const results: SearchResult[] = [];
    const query = searchQuery.toLowerCase();

    for (const passage of PASSAGE_INDEX) {
      if (passage.book.toLowerCase().includes(query) || 
          passage.abbrev.toLowerCase().includes(query)) {
        results.push({ 
          book: passage.book, 
          abbrev: passage.abbrev, 
          fullMatch: passage.book 
        });
      }
    }

    // Also check for chapter/verse input
    const parsed = parsePassage(searchQuery);
    if (parsed && !results.find(r => r.book === parsed.book && r.chapter === parsed.chapter)) {
      results.unshift(parsed);
    }

    setSearchResults(results.slice(0, 8));
  }, [searchQuery]);

  const handleSelectPassage = (result: SearchResult) => {
    const chapter = result.chapter || 1;
    setCurrentPassage({ book: result.book, chapter, verse: result.verse });

    // Push URL so it's bookmarkable / deep-linkable
    router.push(`/read/${encodeURIComponent(result.book)}/${chapter}`);

    // Save to recent
    const newRecent = [result.fullMatch, ...recentSearches.filter(r => r !== result.fullMatch)].slice(0, 5);
    setRecentSearches(newRecent);
    localStorage.setItem('isa820-recent-passages', JSON.stringify(newRecent));

    setSearchQuery('');
    setIsOpen(false);
  };

  const tooltipContent = {
    title: 'Passage Selector',
    description: 'Search for any Bible passage by book name, chapter, or verse reference.',
    spiritualLogic: 'Quick navigation lets you jump to specific passages for forensic comparison. Use formats like "John 3", "Gen 1:1", or "Revelation 22".',
  };

  const parallelTooltip = {
    title: 'Parallel Mode',
    description: 'Compare manuscripts side-by-side.',
    spiritualLogic: 'When enabled, shows TAHOT/TBESG in parallel columns. Watch how the same verses appear in different manuscripts - key for forensic analysis.',
  };

  return (
    <div className="flex items-center gap-2">
      {/* Passage Search */}
      <Tooltip content={tooltipContent}>
        <div className="relative">
          <button
            onClick={() => {
              setIsOpen(!isOpen);
              setTimeout(() => inputRef.current?.focus(), 100);
            }}
            className="flex items-center gap-2 px-3 py-2 bg-slate-800/50 border border-slate-700/50 rounded-lg hover:bg-slate-700/50 transition-colors"
          >
            <Search className="w-4 h-4 text-slate-400" />
            <span className="text-sm text-slate-300 hidden sm:inline">
              {currentPassage 
                ? `${currentPassage.book} ${currentPassage.chapter}` 
                : 'Go to passage...'}
            </span>
          </button>

          {/* Search Dropdown */}
          <AnimatePresence>
            {isOpen && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="absolute top-full left-0 mt-2 w-80 glass-card p-2 z-50"
              >
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                  <input
                    ref={inputRef}
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder='"Gen 1", "John 3:16", "Isa 8 20", "1cor 13"…'
                    className="w-full pl-10 pr-4 py-2 bg-slate-800/50 border border-slate-700/50 rounded-lg text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:border-amber-500/50"
                    onKeyDown={(e) => {
                      if (e.key === 'Escape') {
                        setIsOpen(false);
                      }
                      if (e.key === 'Enter' && searchResults.length > 0) {
                        handleSelectPassage(searchResults[0]);
                      }
                    }}
                  />
                </div>

                {/* Search Results */}
                {searchResults.length > 0 && (
                  <div className="mt-2 max-h-64 overflow-y-auto">
                    {searchResults.map((result, index) => (
                      <button
                        key={`${result.book}-${result.chapter || 'book'}-${index}`}
                        onClick={() => handleSelectPassage(result)}
                        className="w-full flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-slate-700/50 transition-colors text-left"
                      >
                        <BookOpen className="w-4 h-4 text-slate-500 flex-shrink-0" />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm text-white truncate">
                            {result.book} {result.chapter || ''}{result.verse ? `:${result.verse}` : ''}
                          </p>
                          <p className="text-xs text-slate-500">{result.abbrev}</p>
                        </div>
                      </button>
                    ))}
                  </div>
                )}

                {/* Recent Searches */}
                {searchQuery.length === 0 && recentSearches.length > 0 && (
                  <div className="mt-2">
                    <p className="text-xs text-slate-500 px-3 py-1">Recent</p>
                    {recentSearches.map((recent, index) => (
                      <button
                        key={index}
                        onClick={() => {
                          const parsed = parsePassage(recent);
                          if (parsed) handleSelectPassage(parsed);
                        }}
                        className="w-full flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-slate-700/50 transition-colors text-left"
                      >
                        <BookOpen className="w-4 h-4 text-slate-600" />
                        <span className="text-sm text-slate-400">{recent}</span>
                      </button>
                    ))}
                  </div>
                )}

                {/* Quick Examples */}
                {searchQuery.length === 0 && (
                  <div className="mt-2 pt-2 border-t border-slate-700/50">
                    <p className="text-xs text-slate-500 px-3 py-1">Try</p>
                    {['John 3', 'Gen 1:1', 'Rev 1:8', 'Deut 6:4'].map((example) => (
                      <button
                        key={example}
                        onClick={() => {
                          const parsed = parsePassage(example);
                          if (parsed) handleSelectPassage(parsed);
                        }}
                        className="w-full flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-slate-700/50 transition-colors text-left"
                      >
                        <span className="text-xs px-1.5 py-0.5 bg-slate-700/50 rounded text-slate-400">
                          {example.split(' ')[0]}
                        </span>
                        <span className="text-sm text-slate-400">{example.split(' ')[1]}</span>
                      </button>
                    ))}
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </Tooltip>

      {/* Parallel Toggle */}
      <Tooltip content={parallelTooltip}>
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={toggleParallelMode}
          className={`
            relative flex items-center gap-2 px-3 py-2 rounded-lg transition-all border
            ${isParallelMode 
              ? 'bg-cyan-500/20 text-cyan-400 border-cyan-500/30 glow-cyan' 
              : 'bg-slate-800/50 text-slate-400 border-slate-700/50 hover:bg-slate-700/50'
            }
          `}
        >
          <Columns className="w-4 h-4" />
          <span className="text-sm hidden sm:inline">Parallel</span>
          {isParallelMode && (
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              className="absolute -top-1 -right-1 w-3 h-3 bg-cyan-400 rounded-full"
            />
          )}
        </motion.button>
      </Tooltip>

      {/* Browse Library Button */}
      <BrowseLibraryButton />

      {/* Translation Info */}
      {isParallelMode && (
        <div className="hidden lg:flex items-center gap-2 text-xs text-slate-500">
          <span className="px-2 py-1 bg-amber-500/10 text-amber-400 rounded border border-amber-500/20">
            {currentTranslation}
          </span>
          <span>vs</span>
          <span className="px-2 py-1 bg-blue-500/10 text-blue-400 rounded border border-blue-500/20">
            {secondaryTranslation}
          </span>
        </div>
      )}

      {/* Click outside to close */}
      {isOpen && (
        <div 
          className="fixed inset-0 z-40" 
          onClick={() => setIsOpen(false)} 
        />
      )}
    </div>
  );
}
