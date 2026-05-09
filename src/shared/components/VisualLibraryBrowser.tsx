'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useISA820Store } from '@/store/isa820-store';
import { 
  BookOpen, 
  ChevronLeft, 
  X, 
  Layers,
  Scroll,
  Star,
  Sun,
  Crown,
  Flame,
  Sparkles,
  Globe
} from 'lucide-react';

// Bible Book Categories with forensic-themed icons
export const BIBLE_CATEGORIES = [
  {
    id: 'torah',
    name: 'Torah (Law)',
    icon: 'Scroll',
    color: 'amber',
    books: [
      { book: 'Genesis', abbrev: 'Gen', chapters: 50, description: 'Origins of Creation & Covenant' },
      { book: 'Exodus', abbrev: 'Exod', chapters: 40, description: 'Deliverance from Bondage' },
      { book: 'Leviticus', abbrev: 'Lev', chapters: 27, description: 'Holiness & Sacred Ritual' },
      { book: 'Numbers', abbrev: 'Num', chapters: 36, description: 'Wilderness Wanderings' },
      { book: 'Deuteronomy', abbrev: 'Deut', chapters: 34, description: 'Moses Final Words' },
    ],
  },
  {
    id: 'historical',
    name: 'Historical Books',
    icon: 'Layers',
    color: 'slate',
    books: [
      { book: 'Joshua', abbrev: 'Josh', chapters: 24, description: 'Conquest of Canaan' },
      { book: 'Judges', abbrev: 'Judg', chapters: 21, description: 'Cycle of Apostasy' },
      { book: 'Ruth', abbrev: 'Ruth', chapters: 4, description: 'Redemption Story' },
      { book: '1 Samuel', abbrev: '1 Sam', chapters: 31, description: 'Kingship Begins' },
      { book: '2 Samuel', abbrev: '2 Sam', chapters: 24, description: 'Reign of David' },
      { book: '1 Kings', abbrev: '1 Kgs', chapters: 22, description: 'Solomon & Division' },
      { book: '2 Kings', abbrev: '2 Kgs', chapters: 25, description: 'Exile Approaches' },
      { book: '1 Chronicles', abbrev: '1 Chr', chapters: 29, description: 'Temple Records' },
      { book: '2 Chronicles', abbrev: '2 Chr', chapters: 36, description: 'Southern Kingdom' },
      { book: 'Ezra', abbrev: 'Ezra', chapters: 10, description: 'Return from Babylon' },
      { book: 'Nehemiah', abbrev: 'Neh', chapters: 13, description: 'Walls Rebuilt' },
      { book: 'Esther', abbrev: 'Est', chapters: 10, description: 'Providence Preserved' },
    ],
  },
  {
    id: 'wisdom',
    name: 'Wisdom Literature',
    icon: 'Star',
    color: 'emerald',
    books: [
      { book: 'Job', abbrev: 'Job', chapters: 42, description: 'Suffering & Sovereignty' },
      { book: 'Psalms', abbrev: 'Ps', chapters: 150, description: 'Songs of the Heart' },
      { book: 'Proverbs', abbrev: 'Prov', chapters: 31, description: 'Wisdom for Living' },
      { book: 'Ecclesiastes', abbrev: 'Eccl', chapters: 12, description: 'Vanity & Meaning' },
      { book: 'Song of Solomon', abbrev: 'Song', chapters: 8, description: 'Love & Devotion' },
    ],
  },
  {
    id: 'major-prophets',
    name: 'Major Prophets',
    icon: 'Sun',
    color: 'orange',
    books: [
      { book: 'Isaiah', abbrev: 'Isa', chapters: 66, description: 'The Holy One of Israel' },
      { book: 'Jeremiah', abbrev: 'Jer', chapters: 52, description: 'Weeping Prophet' },
      { book: 'Lamentations', abbrev: 'Lam', chapters: 5, description: 'Sorrow of Exile' },
      { book: 'Ezekiel', abbrev: 'Ezek', chapters: 48, description: 'Vision of Glory' },
      { book: 'Daniel', abbrev: 'Dan', chapters: 12, description: 'Kingdom Proclaimed' },
    ],
  },
  {
    id: 'minor-prophets',
    name: 'Minor Prophets',
    icon: 'Flame',
    color: 'yellow',
    books: [
      { book: 'Hosea', abbrev: 'Hos', chapters: 14, description: 'Faithful Love' },
      { book: 'Joel', abbrev: 'Joel', chapters: 3, description: 'Day of the LORD' },
      { book: 'Amos', abbrev: 'Amos', chapters: 9, description: 'Justice for the Poor' },
      { book: 'Obadiah', abbrev: 'Obad', chapters: 1, description: 'Edom Judged' },
      { book: 'Jonah', abbrev: 'Jonah', chapters: 4, description: 'Mercy Extends' },
      { book: 'Micah', abbrev: 'Mic', chapters: 7, description: 'What is Good?' },
      { book: 'Nahum', abbrev: 'Nah', chapters: 3, description: 'Nineveh Falls' },
      { book: 'Habakkuk', abbrev: 'Hab', chapters: 3, description: 'Faith Endures' },
      { book: 'Zephaniah', abbrev: 'Zeph', chapters: 3, description: 'Judgment & Hope' },
      { book: 'Haggai', abbrev: 'Hag', chapters: 2, description: 'Rebuild the Temple' },
      { book: 'Zechariah', abbrev: 'Zech', chapters: 14, description: 'Future Restoration' },
      { book: 'Malachi', abbrev: 'Mal', chapters: 4, description: 'Messenger of Covenant' },
    ],
  },
  {
    id: 'gospels',
    name: 'Gospels & Acts',
    icon: 'Sparkles',
    color: 'red',
    books: [
      { book: 'Matthew', abbrev: 'Matt', chapters: 28, description: 'King of the Jews' },
      { book: 'Mark', abbrev: 'Mark', chapters: 16, description: 'Servant of the Lord' },
      { book: 'Luke', abbrev: 'Luke', chapters: 24, description: 'Son of Man' },
      { book: 'John', abbrev: 'John', chapters: 21, description: 'Son of God' },
      { book: 'Acts', abbrev: 'Acts', chapters: 28, description: 'Holy Spirit Empowered' },
    ],
  },
  {
    id: 'pauline',
    name: 'Pauline Epistles',
    icon: 'Crown',
    color: 'purple',
    books: [
      { book: 'Romans', abbrev: 'Rom', chapters: 16, description: 'Righteousness Revealed' },
      { book: '1 Corinthians', abbrev: '1 Cor', chapters: 16, description: 'Church Order' },
      { book: '2 Corinthians', abbrev: '2 Cor', chapters: 13, description: 'Ministry Glory' },
      { book: 'Galatians', abbrev: 'Gal', chapters: 6, description: 'Freedom in Christ' },
      { book: 'Ephesians', abbrev: 'Eph', chapters: 6, description: 'Spiritual Warfare' },
      { book: 'Philippians', abbrev: 'Phil', chapters: 4, description: 'Joy in Service' },
      { book: 'Colossians', abbrev: 'Col', chapters: 4, description: 'Supremacy of Christ' },
      { book: '1 Thessalonians', abbrev: '1 Thess', chapters: 5, description: 'Second Coming' },
      { book: '2 Thessalonians', abbrev: '2 Thess', chapters: 3, description: 'Day of the Lord' },
      { book: '1 Timothy', abbrev: '1 Tim', chapters: 6, description: 'Church Leadership' },
      { book: '2 Timothy', abbrev: '2 Tim', chapters: 4, description: 'Finish the Race' },
      { book: 'Titus', abbrev: 'Titus', chapters: 3, description: 'Sound Doctrine' },
      { book: 'Philemon', abbrev: 'Phlm', chapters: 1, description: 'Redeeming Love' },
    ],
  },
  {
    id: 'general-epistles',
    name: 'General Epistles',
    icon: 'Globe',
    color: 'blue',
    books: [
      { book: 'Hebrews', abbrev: 'Heb', chapters: 13, description: 'Superiority of Christ' },
      { book: 'James', abbrev: 'Jas', chapters: 5, description: 'Faith in Action' },
      { book: '1 Peter', abbrev: '1 Pet', chapters: 5, description: 'Exile Pilgrims' },
      { book: '2 Peter', abbrev: '2 Pet', chapters: 3, description: 'Growth in Grace' },
      { book: '1 John', abbrev: '1 John', chapters: 5, description: 'God is Light' },
      { book: '2 John', abbrev: '2 John', chapters: 1, description: 'Truth & Love' },
      { book: '3 John', abbrev: '3 John', chapters: 1, description: 'Hospitality' },
      { book: 'Jude', abbrev: 'Jude', chapters: 1, description: 'Contend for Faith' },
    ],
  },
  {
    id: 'apocalyptic',
    name: 'Apocalyptic',
    icon: 'Flame',
    color: 'rose',
    books: [
      { book: 'Revelation', abbrev: 'Rev', chapters: 22, description: 'Ultimate Victory' },
    ],
  },
];

// Icon mapping for categories
const CategoryIcon = ({ icon, className }: { icon: string; className?: string }) => {
  const icons: Record<string, React.ReactNode> = {
    Scroll: <Scroll className={className} />,
    Layers: <Layers className={className} />,
    Star: <Star className={className} />,
    Sun: <Sun className={className} />,
    Crown: <Crown className={className} />,
    Flame: <Flame className={className} />,
    Sparkles: <Sparkles className={className} />,
    Globe: <Globe className={className} />,
  };
  return <>{icons[icon] || <BookOpen className={className} />}</>;
};

// Color mapping
const colorMap: Record<string, { bg: string; border: string; text: string; hover: string }> = {
  amber: { bg: 'bg-amber-500/10', border: 'border-amber-500/30', text: 'text-amber-400', hover: 'hover:bg-amber-500/20' },
  slate: { bg: 'bg-slate-500/10', border: 'border-slate-500/30', text: 'text-slate-400', hover: 'hover:bg-slate-500/20' },
  emerald: { bg: 'bg-emerald-500/10', border: 'border-emerald-500/30', text: 'text-emerald-400', hover: 'hover:bg-emerald-500/20' },
  orange: { bg: 'bg-orange-500/10', border: 'border-orange-500/30', text: 'text-orange-400', hover: 'hover:bg-orange-500/20' },
  yellow: { bg: 'bg-yellow-500/10', border: 'border-yellow-500/30', text: 'text-yellow-400', hover: 'hover:bg-yellow-500/20' },
  red: { bg: 'bg-red-500/10', border: 'border-red-500/30', text: 'text-red-400', hover: 'hover:bg-red-500/20' },
  purple: { bg: 'bg-purple-500/10', border: 'border-purple-500/30', text: 'text-purple-400', hover: 'hover:bg-purple-500/20' },
  blue: { bg: 'bg-blue-500/10', border: 'border-blue-500/30', text: 'text-blue-400', hover: 'hover:bg-blue-500/20' },
  rose: { bg: 'bg-rose-500/10', border: 'border-rose-500/30', text: 'text-rose-400', hover: 'hover:bg-rose-500/20' },
};

interface BookInfo {
  book: string;
  abbrev: string;
  chapters: number;
  description?: string;
}

type DrillDownLevel = 'categories' | 'books' | 'chapters' | 'verses';

interface VisualLibraryBrowserProps {
  isOpen: boolean;
  onClose: () => void;
}

export function VisualLibraryBrowser({ isOpen, onClose }: VisualLibraryBrowserProps) {
  const [drillLevel, setDrillLevel] = useState<DrillDownLevel>('categories');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedBook, setSelectedBook] = useState<BookInfo | null>(null);
  const [selectedChapter, setSelectedChapter] = useState<number | null>(null);
  const { setCurrentPassage } = useISA820Store();

  // Reset state when modal opens
  useEffect(() => {
    if (isOpen) {
      setDrillLevel('categories');
      setSelectedCategory(null);
      setSelectedBook(null);
      setSelectedChapter(null);
    }
  }, [isOpen]);

  const handleCategorySelect = (categoryId: string) => {
    setSelectedCategory(categoryId);
    setSelectedBook(null);
    setSelectedChapter(null);
    setDrillLevel('books');
  };

  const handleBookSelect = (book: BookInfo) => {
    setSelectedBook(book);
    setSelectedChapter(null);
    setDrillLevel('chapters');
  };

  const handleChapterSelect = (chapter: number) => {
    setSelectedChapter(chapter);
    setDrillLevel('verses');
  };

  const handleVerseSelect = (verse: number) => {
    if (selectedBook) {
      setCurrentPassage({
        book: selectedBook.book,
        chapter: selectedChapter || 1,
        verse,
      });
      onClose();
    }
  };

  const handleGoToChapter = () => {
    if (selectedBook && selectedChapter) {
      setCurrentPassage({
        book: selectedBook.book,
        chapter: selectedChapter,
      });
      onClose();
    }
  };

  const handleBack = () => {
    if (drillLevel === 'verses') {
      setDrillLevel('chapters');
      setSelectedChapter(null);
    } else if (drillLevel === 'chapters') {
      setDrillLevel('books');
      setSelectedBook(null);
    } else if (drillLevel === 'books') {
      setDrillLevel('categories');
      setSelectedCategory(null);
    }
  };

  // Generate verse numbers (typically 20-50 verses per chapter)
  const getVerseCount = (chapter: number) => {
    const seed = chapter * 17;
    return 20 + (seed % 35);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50"
            onClick={onClose}
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="fixed inset-4 md:inset-auto md:top-1/2 md:left-1/2 md:-translate-x-1/2 md:-translate-y-1/2 md:w-[90vw] md:max-w-5xl md:h-[85vh] glass-card z-50 flex flex-col overflow-hidden"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-700/50">
              <div className="flex items-center gap-3">
                {drillLevel !== 'categories' && (
                  <button
                    onClick={handleBack}
                    className="p-2 rounded-lg hover:bg-slate-700/50 transition-colors"
                  >
                    <ChevronLeft className="w-5 h-5 text-slate-400" />
                  </button>
                )}
                <div>
                  <h2 className="text-lg font-semibold text-white">
                    {drillLevel === 'categories' && 'Scripture Library'}
                    {drillLevel === 'books' && (BIBLE_CATEGORIES.find(c => c.id === selectedCategory)?.name ?? 'Books')}
                    {drillLevel === 'chapters' && selectedBook?.book}
                    {drillLevel === 'verses' && `${selectedBook?.book} ${selectedChapter}`}
                  </h2>
                  <p className="text-sm text-slate-500">
                    {drillLevel === 'categories' && '66 Books • Choose a category to browse'}
                    {drillLevel === 'books' && `${BIBLE_CATEGORIES.find(c => c.id === selectedCategory)?.books.length ?? 0} books • Select a book`}
                    {drillLevel === 'chapters' && selectedBook?.description}
                    {drillLevel === 'verses' && 'Select a verse to navigate'}
                  </p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="p-2 rounded-lg hover:bg-slate-700/50 transition-colors"
              >
                <X className="w-5 h-5 text-slate-400" />
              </button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-4 md:p-6">
              {/* Categories View */}
              {drillLevel === 'categories' && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4"
                >
                  {BIBLE_CATEGORIES.map((category) => {
                    const colors = colorMap[category.color];
                    return (
                      <motion.div
                        key={category.id}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => handleCategorySelect(category.id)}
                        className={`
                          p-4 rounded-xl border cursor-pointer transition-all
                          ${colors.bg} ${colors.border} ${colors.hover}
                          active:scale-95
                        `}
                      >
                        <div className="flex items-start gap-3">
                          <div className={`p-2 rounded-lg ${colors.bg} ${colors.border}`}>
                            <CategoryIcon 
                              icon={category.icon} 
                              className={`w-5 h-5 ${colors.text}`}
                            />
                          </div>
                          <div className="flex-1 min-w-0">
                            <h3 className="font-medium text-white truncate">
                              {category.name}
                            </h3>
                            <p className="text-xs text-slate-500 mt-0.5">
                              {category.books.length} {category.books.length === 1 ? 'book' : 'books'}
                            </p>
                            <div className="flex flex-wrap gap-1 mt-2">
                              {category.books.slice(0, 3).map((book) => (
                                <span
                                  key={book.book}
                                  className={`text-xs px-2 py-0.5 rounded-full ${colors.bg} ${colors.text}`}
                                >
                                  {book.abbrev}
                                </span>
                              ))}
                              {category.books.length > 3 && (
                                <span className="text-xs text-slate-500">
                                  +{category.books.length - 3}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    );
                  })}
                </motion.div>
              )}

              {/* Books View — books within selected category */}
              {drillLevel === 'books' && selectedCategory && (
                <motion.div
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3"
                >
                  {BIBLE_CATEGORIES.find(c => c.id === selectedCategory)?.books.map((book) => {
                    const cat = BIBLE_CATEGORIES.find(c => c.id === selectedCategory)!;
                    const colors = colorMap[cat.color];
                    return (
                      <motion.button
                        key={book.book}
                        whileHover={{ scale: 1.03 }}
                        whileTap={{ scale: 0.97 }}
                        onClick={() => handleBookSelect(book)}
                        className={`
                          p-4 rounded-xl border text-left transition-all
                          ${colors.bg} ${colors.border} ${colors.hover}
                          active:scale-95
                        `}
                      >
                        <p className={`text-sm font-semibold ${colors.text}`}>{book.abbrev}</p>
                        <p className="text-xs text-white mt-0.5 truncate">{book.book}</p>
                        <p className="text-xs text-slate-500 mt-1">{book.chapters} ch</p>
                        {book.description && (
                          <p className="text-xs text-slate-500 mt-1 leading-tight line-clamp-2">
                            {book.description}
                          </p>
                        )}
                      </motion.button>
                    );
                  })}
                </motion.div>
              )}

              {/* Chapters View — chapters within selected book */}
              {drillLevel === 'chapters' && selectedBook && (
                <motion.div
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="space-y-6"
                >
                  {/* Book Info */}
                  <div className="text-center">
                    <h3 className="text-2xl font-bold text-white">{selectedBook.book}</h3>
                    <p className="text-slate-400">{selectedBook.description}</p>
                    <p className="text-sm text-slate-500 mt-1">{selectedBook.chapters} chapters</p>
                  </div>

                  {/* Chapter Grid */}
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <p className="text-xs text-slate-500 uppercase tracking-wider">Select a Chapter</p>
                      <button
                        onClick={handleGoToChapter}
                        disabled={!selectedChapter}
                        className={`
                          text-xs px-3 py-1 rounded-full transition-all
                          ${selectedChapter
                            ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30 hover:bg-amber-500/30'
                            : 'bg-slate-800/50 text-slate-500 border border-slate-700/50'
                          }
                        `}
                      >
                        Go to chapter →
                      </button>
                    </div>
                    <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 lg:grid-cols-10 gap-2">
                      {Array.from({ length: selectedBook.chapters }, (_, i) => i + 1).map((chapter) => {
                        const isSelected = chapter === selectedChapter;
                        return (
                          <button
                            key={chapter}
                            onClick={() => handleChapterSelect(chapter)}
                            className={`
                              p-3 rounded-lg border text-center transition-all font-medium
                              ${isSelected
                                ? 'bg-amber-500/20 border-amber-500/50 text-amber-400'
                                : 'bg-slate-800/50 border-slate-700/50 text-slate-300 hover:bg-slate-700/50 hover:border-slate-600/50'
                              }
                              active:scale-95
                            `}
                          >
                            {chapter}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </motion.div>
              )}

              {/* Verses View */}
              {drillLevel === 'verses' && selectedBook && selectedChapter && (
                <motion.div
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="space-y-4"
                >
                  {/* Header */}
                  <div className="text-center">
                    <h3 className="text-xl font-bold text-white">
                      {selectedBook.book} {selectedChapter}
                    </h3>
                    <p className="text-sm text-slate-500">
                      {getVerseCount(selectedChapter)} verses
                    </p>
                  </div>

                  {/* Quick Actions */}
                  <div className="flex justify-center gap-2">
                    <button
                      onClick={handleGoToChapter}
                      className="px-4 py-2 rounded-lg bg-slate-800/50 border border-slate-700/50 text-slate-300 hover:bg-slate-700/50 transition-colors text-sm"
                    >
                      View Full Chapter
                    </button>
                  </div>

                  {/* Verse Grid */}
                  <div className="grid grid-cols-5 sm:grid-cols-7 md:grid-cols-10 gap-2">
                    {Array.from({ length: getVerseCount(selectedChapter) }, (_, i) => i + 1).map((verse) => (
                      <button
                        key={verse}
                        onClick={() => handleVerseSelect(verse)}
                        className="
                          p-2 sm:p-3 rounded-lg border bg-slate-800/50 border-slate-700/50 
                          text-slate-300 hover:bg-slate-700/50 hover:border-slate-600/50 
                          transition-all text-center text-sm sm:text-base font-medium
                          active:scale-95
                        "
                      >
                        {verse}
                      </button>
                    ))}
                  </div>

                  {/* Info */}
                  <p className="text-xs text-slate-500 text-center mt-4">
                    Click any verse to navigate directly, or "View Full Chapter" to see the entire text.
                  </p>
                </motion.div>
              )}
            </div>

            {/* Footer */}
            <div className="px-6 py-3 border-t border-slate-700/50 bg-slate-900/50">
              <div className="flex items-center justify-between text-xs text-slate-500">
                <span>
                  {drillLevel === 'categories' && `${BIBLE_CATEGORIES.reduce((acc, c) => acc + c.books.length, 0)} books total`}
                  {drillLevel === 'books' && `${BIBLE_CATEGORIES.find(c => c.id === selectedCategory)?.books.length ?? 0} books`}
                  {drillLevel === 'chapters' && `${selectedBook?.chapters} chapters`}
                  {drillLevel === 'verses' && `${getVerseCount(selectedChapter || 1)} verses`}
                </span>
                <span className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  Scripture Library Active
                </span>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

// Standalone Browse Library Button Component
export function BrowseLibraryButton() {
  const [isLibraryOpen, setIsLibraryOpen] = useState(false);

  return (
    <>
      <button
        onClick={() => setIsLibraryOpen(true)}
        className="
          flex items-center gap-2 px-3 py-2 
          bg-gradient-to-r from-amber-500/10 to-orange-500/10 
          border border-amber-500/30 rounded-lg 
          hover:from-amber-500/20 hover:to-orange-500/20 
          transition-all duration-300
          group
        "
      >
        <div className="relative">
          <BookOpen className="w-4 h-4 text-amber-400" />
          <motion.div
            animate={{ rotate: [0, 10, -10, 0] }}
            transition={{ duration: 2, repeat: Infinity, repeatDelay: 3 }}
            className="absolute -top-1 -right-1"
          >
            <Star className="w-2 h-2 text-amber-400 fill-amber-400" />
          </motion.div>
        </div>
        <span className="text-sm text-amber-400 font-medium hidden sm:inline">
          Browse Library
        </span>
        <span className="text-xs text-slate-500 hidden md:inline">
          66 Books
        </span>
      </button>

      <VisualLibraryBrowser 
        isOpen={isLibraryOpen} 
        onClose={() => setIsLibraryOpen(false)} 
      />
    </>
  );
}
