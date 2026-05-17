'use client';

import { useEffect } from 'react';
import { useParams } from 'next/navigation';
import { useISA820Store } from '@/store/isa820-store';
import { PillarHeader } from '@/shared/components/PillarHeader';
import { BibleReader } from '@/shared/components/BibleReader';
import { ForensicSidebar } from '@/shared/components/ForensicSidebar';
import { StrongsPanel } from '@/shared/components/StrongsPanel';

/**
 * /read/[book]/[chapter] — Deep-link to any Bible passage.
 * Syncs URL params into the Zustand store on load.
 * Example: /read/Genesis/1  /read/Revelation/22
 */
export default function ReadPage() {
  const params = useParams<{ book: string; chapter: string }>();
  const { setCurrentPassage, sidebar, toggleSidebar } = useISA820Store();

  useEffect(() => {
    if (params.book && params.chapter) {
      const book    = decodeURIComponent(params.book);
      const chapter = parseInt(params.chapter, 10);
      if (!isNaN(chapter) && chapter > 0) {
        setCurrentPassage({ book, chapter });
      }
    }
  }, [params.book, params.chapter, setCurrentPassage]);

  return (
    <div className="min-h-screen bg-obsidian-950">
      <PillarHeader />

      {/* Viewport-locked reading area — overflow-hidden prevents page-body scroll */}
      <div className="flex h-[calc(100vh-72px)] overflow-hidden">
        {/* Main reading pane — scrolls independently */}
        <main className="flex-1 overflow-y-auto min-w-0">
          <div className="max-w-4xl mx-auto px-4 py-8">
            <BibleReader />
          </div>
        </main>

        {/* Desktop sidebar — fixed height column, scrolls internally */}
        {sidebar.isOpen && (
          <aside className="hidden md:flex flex-col w-96 border-l border-slate-700/50 flex-shrink-0 overflow-hidden">
            <ForensicSidebar />
          </aside>
        )}
      </div>

      {/* Mobile sidebar — fixed overlay so it stays put while reading pane scrolls */}
      {sidebar.isOpen && (
        <div className="md:hidden fixed inset-x-0 bottom-0 top-[72px] z-40 flex pointer-events-none">
          <div
            className="flex-1 pointer-events-auto bg-black/40"
            onClick={toggleSidebar}
          />
          <div className="w-[min(90vw,24rem)] h-full flex flex-col border-l border-slate-700/50 overflow-hidden pointer-events-auto">
            <ForensicSidebar />
          </div>
        </div>
      )}

      {/* Floating Strong's Panel */}
      <StrongsPanel />
    </div>
  );
}
