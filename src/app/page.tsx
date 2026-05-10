'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { PillarHeader, BibleReader, ForensicSidebar, StrongsPanel } from '@/shared/components';
import { useISA820Store } from '@/store/isa820-store';
import { Menu, X, BookOpen, Settings, Info, Columns, ChevronLeft, Sparkles, Hash } from 'lucide-react';
import Link from 'next/link';

// Glowing right-edge pull tab — desktop only, shown when sidebar is closed
function SidebarPullTab() {
  const { sidebar, toggleSidebar, strongs } = useISA820Store();
  const hasVerse = !!sidebar.selectedVerseForAnalysis;
  const hasStrongs = strongs.isOpen;

  if (sidebar.isOpen) return null;

  return (
    <motion.button
      initial={{ x: 48, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      exit={{ x: 48, opacity: 0 }}
      transition={{ type: 'spring', damping: 28, stiffness: 280 }}
      onClick={toggleSidebar}
      aria-label="Open forensic analysis panel"
      className={`
        fixed right-0 top-1/2 -translate-y-1/2 z-40 hidden lg:flex
        flex-col items-center gap-2.5 py-7 px-3
        rounded-l-2xl border-l border-t border-b backdrop-blur-xl
        transition-all duration-300 cursor-pointer group
        ${hasVerse
          ? 'bg-amber-500/15 border-amber-500/40 shadow-xl shadow-amber-500/20'
          : 'bg-slate-800/70 border-slate-600/30 hover:bg-slate-700/70 hover:border-slate-500/50'}
      `}
    >
      {hasVerse && (
        <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse shadow-lg shadow-amber-400/50" />
      )}
      {hasStrongs && !hasVerse && (
        <Hash className="w-3.5 h-3.5 text-cyan-400" />
      )}
      <ChevronLeft className={`w-4 h-4 transition-colors ${hasVerse ? 'text-amber-400' : 'text-slate-500 group-hover:text-slate-300'}`} />
      <span
        className={`text-[10px] font-semibold tracking-[0.2em] uppercase transition-colors ${
          hasVerse ? 'text-amber-400' : 'text-slate-500 group-hover:text-slate-300'
        }`}
        style={{ writingMode: 'vertical-rl', textOrientation: 'mixed' }}
      >
        {hasVerse ? 'Analyse' : 'Analysis'}
      </span>
      {hasVerse && (
        <>
          <Sparkles className="w-3.5 h-3.5 text-amber-400/70" />
          <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse shadow-lg shadow-amber-400/50" />
        </>
      )}
      {!hasVerse && (
        <ChevronLeft className={`w-3.5 h-3.5 transition-colors text-slate-600 group-hover:text-slate-400`} />
      )}
    </motion.button>
  );
}

function HomePage() {
  const { sidebar, toggleSidebar, isParallelMode, strongs } = useISA820Store();
  const [showInfo, setShowInfo] = useState(false);

  // Contextual FAB label for mobile
  const hasVerse = !!sidebar.selectedVerseForAnalysis;

  return (
    <div className="min-h-screen flex flex-col relative overflow-x-hidden">
      {/* Aurora background */}
      <div className="aurora-bg" aria-hidden="true" />

      <div className="relative z-10 flex flex-col min-h-screen">
        <PillarHeader />

        {/* Mobile Toggle FAB */}
        <motion.button
          onClick={toggleSidebar}
          whileTap={{ scale: 0.92 }}
          className={`fixed bottom-6 right-5 z-50 lg:hidden h-14 rounded-full flex items-center gap-2.5 shadow-xl transition-all ${
            hasVerse
              ? 'px-5 btn-primary shadow-amber-900/40'
              : 'w-14 btn-primary shadow-amber-900/30'
          }`}
          aria-label="Toggle analysis sidebar"
        >
          <motion.div animate={sidebar.isOpen ? { rotate: 90 } : { rotate: 0 }} transition={{ duration: 0.2 }}>
            {sidebar.isOpen ? (
              <X className="w-5 h-5 text-obsidian-900" />
            ) : (
              <Menu className="w-5 h-5 text-obsidian-900" />
            )}
          </motion.div>
          {!sidebar.isOpen && hasVerse && (
            <span className="text-xs font-bold text-obsidian-900 pr-1">Analyse</span>
          )}
          {!sidebar.isOpen && !hasVerse && (
            <span className="absolute inset-0 rounded-full border-2 border-amber-400/30 animate-ping" />
          )}
        </motion.button>

        {/* Right-edge pull tab — desktop */}
        <AnimatePresence>
          <SidebarPullTab />
        </AnimatePresence>

        {/* Main Content */}
        <main className="flex-1 flex overflow-x-hidden">
          {/* Bible Reader Area */}
          <div
            className={`flex-1 p-4 lg:p-6 overflow-y-auto overflow-x-hidden transition-all ${
              isParallelMode ? 'max-w-6xl' : 'max-w-4xl'
            } mx-auto w-full`}
          >
            {/* Page Title */}
            <motion.div
              initial={{ opacity: 0, y: -16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
              className="mb-6"
            >
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="min-w-0">
                    <h1
                      className="text-xl sm:text-2xl font-bold text-gradient-gold truncate"
                      style={{ fontFamily: 'var(--font-cinzel), serif' }}
                    >
                      Manuscript Reader
                    </h1>
                    <p className="text-slate-500 text-xs sm:text-sm mt-0.5 hidden sm:block">
                      Forensic analysis · Voice signatures · Strong's references
                    </p>
                  </div>
                  {isParallelMode && (
                    <div className="hidden xl:flex items-center gap-1.5 px-3 py-1.5 bg-cyan-500/15 text-cyan-400 rounded-full border border-cyan-500/25 flex-shrink-0">
                      <Columns className="w-3.5 h-3.5" />
                      <span className="text-xs font-medium">Parallel</span>
                    </div>
                  )}
                </div>
                <div className="flex gap-2 flex-shrink-0">
                  <button
                    onClick={() => setShowInfo(!showInfo)}
                    className={`p-2 rounded-lg border transition-all ${
                      showInfo
                        ? 'bg-amber-500/15 border-amber-500/40 text-amber-400'
                        : 'btn-ghost border-white/0'
                    }`}
                    aria-label="Show info"
                  >
                    <Info className="w-4 h-4 sm:w-5 sm:h-5" />
                  </button>
                  <Link href="/admin" className="p-2 rounded-lg btn-ghost border-white/0" aria-label="Admin">
                    <Settings className="w-4 h-4 sm:w-5 sm:h-5" />
                  </Link>
                </div>
              </div>
            </motion.div>

            {/* Info Panel */}
            <AnimatePresence>
              {showInfo && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
                  className="mb-6 glass-card p-4 overflow-hidden"
                >
                  <div className="flex items-start gap-4">
                    <div className="w-9 h-9 rounded-lg bg-amber-500/15 flex items-center justify-center flex-shrink-0">
                      <BookOpen className="w-4 h-4 text-amber-400" />
                    </div>
                    <div className="min-w-0">
                      <h3 className="text-white font-medium mb-1.5 text-sm">ISA820 Forensic Standard</h3>
                      <p className="text-xs text-slate-400 leading-relaxed">
                        Manuscript-first approach (TAHOT/TBESG) to analyze Scripture.
                        Voice signatures:&nbsp;
                        <span className="text-amber-400 font-medium">Gold</span> — Father,&nbsp;
                        <span className="text-red-400 font-medium">Crimson</span> — Son,&nbsp;
                        <span className="text-slate-400 font-medium">Silver</span> — Angel.
                        Click any verse to open forensic analysis. Click any highlighted word for Strong's lexicon.
                      </p>
                      <div className="flex flex-wrap gap-2 mt-3">
                        <span className="text-xs px-2 py-1 bg-amber-500/10 text-amber-400 rounded-lg border border-amber-500/20">Isaiah 8:20</span>
                        <span className="text-xs px-2 py-1 bg-blue-500/10 text-blue-400 rounded-lg border border-blue-500/20">Deuteronomy 6:4</span>
                        <span className="text-xs px-2 py-1 bg-cyan-500/10 text-cyan-400 rounded-lg border border-cyan-500/20">Strong's 2.0</span>
                        <span className="text-xs px-2 py-1 bg-purple-500/10 text-purple-400 rounded-lg border border-purple-500/20">AI Analyst</span>
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Bible Reader */}
            <BibleReader />
          </div>

          {/* Desktop Forensic Sidebar */}
          <AnimatePresence>
            {sidebar.isOpen && (
              <motion.div
                initial={{ width: 0, opacity: 0 }}
                animate={{ width: isParallelMode ? 320 : 384, opacity: 1 }}
                exit={{ width: 0, opacity: 0 }}
                transition={{ type: 'spring', damping: 30, stiffness: 280 }}
                className="hidden lg:block border-l border-white/5 flex-shrink-0 overflow-hidden"
              >
                <div className="sticky top-[72px] h-[calc(100vh-72px)] overflow-hidden" style={{ width: isParallelMode ? 320 : 384 }}>
                  <ForensicSidebar />
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Mobile Sidebar Overlay */}
          <AnimatePresence>
            {sidebar.isOpen && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 z-40 lg:hidden"
              >
                <div
                  className="absolute inset-0 bg-black/65 backdrop-blur-sm"
                  onClick={toggleSidebar}
                />
                <motion.div
                  initial={{ x: '100%' }}
                  animate={{ x: 0 }}
                  exit={{ x: '100%' }}
                  transition={{ type: 'spring', damping: 30, stiffness: 300 }}
                  className="absolute right-0 top-0 h-full w-full max-w-sm"
                >
                  <ForensicSidebar />
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* StrongsPanel — works on all screen sizes */}
          <StrongsPanel />
        </main>

        {/* Footer */}
        <footer className="glass-card rounded-none border-t border-white/5 px-4 sm:px-6 py-3">
          <div className="max-w-7xl mx-auto flex items-center justify-between text-xs gap-4">
            <div className="flex items-center gap-3">
              <svg viewBox="0 0 16 16" className="w-4 h-4 flex-shrink-0" aria-hidden="true">
                <polygon points="8,1 12,2.5 15,6.5 15,9.5 12,13.5 8,15 4,13.5 1,9.5 1,6.5 4,2.5"
                  fill="none" stroke="#f59e0b" strokeWidth="1" opacity="0.6" />
                <rect x="7" y="5" width="2" height="6" rx="0.5" fill="#f59e0b" opacity="0.7" />
              </svg>
              <span className="text-slate-600 hidden sm:inline">ISA820 · The Forensic Standard</span>
              <span className="text-slate-600 sm:hidden">ISA820</span>
            </div>
            <div className="flex items-center gap-3">
              <Link href="/guide" className="text-slate-500 hover:text-amber-400 transition-colors font-medium">How to Use</Link>
              <span className="px-2 py-1 bg-slate-800/60 rounded-md text-slate-600 border border-white/5">
                TAHOT · TBESG · KJV
              </span>
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
}

export default function Page() {
  return <HomePage />;
}
