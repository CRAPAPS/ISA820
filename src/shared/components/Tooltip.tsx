'use client';

import { motion } from 'framer-motion';
import type { TooltipContent } from '@/types';

interface TooltipProps {
  children: React.ReactNode;
  content: TooltipContent;
  position?: 'top' | 'bottom' | 'left' | 'right';
}

export function Tooltip({ children, content, position = 'top' }: TooltipProps) {
  const positionClasses = {
    top: 'bottom-full left-1/2 -translate-x-1/2 mb-2',
    bottom: 'top-full left-1/2 -translate-x-1/2 mt-2',
    left: 'right-full top-1/2 -translate-y-1/2 mr-2',
    right: 'left-full top-1/2 -translate-y-1/2 ml-2',
  };

  return (
    <div className="relative inline-block">
      {children}
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        whileHover={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.2 }}
        className={`absolute z-50 ${positionClasses[position]} pointer-events-none`}
      >
        <div className="glass-card p-4 min-w-[280px] max-w-[360px] shadow-2xl">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-2 h-2 rounded-full bg-amber-400" />
            <h4 className="text-sm font-semibold text-amber-400">{content.title}</h4>
          </div>
          <p className="text-sm text-slate-300 mb-3">{content.description}</p>
          <div className="border-t border-slate-700/50 pt-3">
            <div className="flex items-start gap-2">
              <svg className="w-4 h-4 text-cyan-400 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
              </svg>
              <p className="text-xs text-slate-400 italic">{content.spiritualLogic}</p>
            </div>
          </div>
          {content.verseReference && (
            <div className="mt-2 pt-2 border-t border-slate-700/50">
              <span className="text-xs text-slate-500">{content.verseReference}</span>
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
}

// Simple inline tooltip without framer-motion for basic usage
export function SimpleTooltip({ children, content }: { children: React.ReactNode; content: string }) {
  return (
    <div className="group relative inline-block">
      {children}
      <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-2 text-xs text-slate-300 bg-obsidian-800 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap border border-slate-700/50">
        {content}
        <div className="absolute top-full left-1/2 -translate-x-1/2 -mt-1 border-4 border-transparent border-t-slate-800" />
      </div>
    </div>
  );
}
