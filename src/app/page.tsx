'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { PillarHeader, BibleReader, ForensicSidebar, StrongsPanel } from '@/shared/components';
import { useISA820Store } from '@/store/isa820-store';
import { Menu, X, BookOpen, Settings, Info, Columns } from 'lucide-react';
import Link from 'next/link';

function HomePage() {
  const { sidebar, toggleSidebar, isParallelMode } = useISA820Store();
  const [showInfo, setShowInfo] = useState(false);

  return (
    <div className="min-h-screen flex flex-col">
      <PillarHeader />

      {/* Mobile Toggle */}
      <button
        onClick={toggleSidebar}
        className="fixed bottom-6 right-6 z-50 lg:hidden w-14 h-14 rounded-full bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center shadow-lg hover:scale-105 transition-transform"
      >
        {sidebar.isOpen ? (
          <X className="w-6 h-6 text-white" />
        ) : (
          <Menu className="w-6 h-6 text-white" />
        )}
      </button>

      {/* Main Content */}
      <main className="flex-1 flex">
        {/* Bible Reader Area - adjusts width based on parallel mode */}
        <div className={`flex-1 p-4 lg:p-6 overflow-y-auto transition-all ${isParallelMode ? 'max-w-6xl' : 'max-w-4xl'} mx-auto w-full`}>
          {/* Page Title */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div>
                  <h1 className="text-2xl font-bold text-white mb-1">Manuscript Reader</h1>
                  <p className="text-slate-400 text-sm">
                    Forensic biblical analysis with voice signatures and Strong's references
                  </p>
                </div>
                {isParallelMode && (
                  <div className="hidden xl:flex items-center gap-2 px-3 py-1.5 bg-cyan-500/20 text-cyan-400 rounded-full border border-cyan-500/30">
                    <Columns className="w-4 h-4" />
                    <span className="text-xs font-medium">Parallel Mode</span>
                  </div>
                )}
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => setShowInfo(!showInfo)}
                  className="p-2 rounded-lg bg-slate-800/50 text-slate-400 hover:bg-slate-700/50 transition-colors"
                >
                  <Info className="w-5 h-5" />
                </button>
                <Link
                  href="/admin"
                  className="p-2 rounded-lg bg-slate-800/50 text-slate-400 hover:bg-slate-700/50 transition-colors"
                >
                  <Settings className="w-5 h-5" />
                </Link>
              </div>
            </div>
          </motion.div>

          {/* Info Panel */}
          {showInfo && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              className="mb-6 glass-card p-4"
            >
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-lg bg-amber-500/20 flex items-center justify-center flex-shrink-0">
                  <BookOpen className="w-5 h-5 text-amber-400" />
                </div>
                <div>
                  <h3 className="text-white font-medium mb-2">ISA820 Forensic Standard</h3>
                  <p className="text-sm text-slate-400 leading-relaxed">
                    This platform uses a manuscript-first approach (TAHOT/TBESG) to analyze Scripture. 
                    Voice signatures highlight the speaker: <span className="text-amber-400">Gold</span> for the Father, 
                    <span className="text-red-400"> Crimson</span> for the Son, and 
                    <span className="text-slate-400"> Silver</span> for angels. 
                    Click any verse number or Strong's reference to explore forensic analysis.
                  </p>
                  <div className="flex flex-wrap gap-2 mt-3">
                    <span className="text-xs px-2 py-1 bg-amber-500/10 text-amber-400 rounded">Isaiah 8:20</span>
                    <span className="text-xs px-2 py-1 bg-blue-500/10 text-blue-400 rounded">Deuteronomy 6:4</span>
                    <span className="text-xs px-2 py-1 bg-cyan-500/10 text-cyan-400 rounded">Strong's 2.0</span>
                    <span className="text-xs px-2 py-1 bg-purple-500/10 text-purple-400 rounded">AI Rebuttals</span>
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {/* Bible Reader */}
          <BibleReader />
        </div>

        {/* Forensic Sidebar */}
        <div className={`hidden lg:block border-l border-slate-700/50 transition-all ${isParallelMode ? 'w-80' : 'w-96'}`}>
          <div className="sticky top-20 h-[calc(100vh-6rem)]">
            <ForensicSidebar />
          </div>
        </div>

        {/* Mobile Sidebar Overlay */}
        {sidebar.isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="fixed inset-0 z-40 lg:hidden"
          >
            <div className="absolute inset-0 bg-black/50" onClick={toggleSidebar} />
            <div className="absolute right-0 top-0 h-full w-80 max-w-full">
              <ForensicSidebar />
            </div>
          </motion.div>
        )}

        {/* Strongs Panel */}
        <div className="fixed right-4 top-24 z-30 hidden lg:block">
          <StrongsPanel />
        </div>
      </main>

      {/* Footer */}
      <footer className="glass-card border-t border-slate-700/50 px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between text-sm">
          <div className="flex items-center gap-4">
            <span className="text-slate-500">ISA820 The Forensic Standard</span>
            <span className="text-slate-700">|</span>
            <span className="text-slate-500">Manuscript-First Analysis</span>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-xs px-2 py-1 bg-slate-800/50 rounded text-slate-500">
              TAHOT • TBESG • KJV
            </span>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default function Page() {
  return <HomePage />;
}
