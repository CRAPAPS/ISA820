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
  const { setCurrentPassage, sidebar } = useISA820Store();

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
      <div className="flex h-[calc(100vh-72px)]">
        {/* Main reading pane */}
        <main className="flex-1 overflow-y-auto">
          <div className="max-w-4xl mx-auto px-4 py-8">
            <BibleReader />
          </div>
        </main>

        {/* Forensic Sidebar */}
        {sidebar.isOpen && (
          <aside className="w-96 border-l border-slate-700/50 overflow-y-auto flex-shrink-0">
            <ForensicSidebar />
          </aside>
        )}
      </div>

      {/* Floating Strong's Panel */}
      <StrongsPanel />
    </div>
  );
}
