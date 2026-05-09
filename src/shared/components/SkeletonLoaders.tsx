'use client';

// Skeleton Loader Components for Professional UI
import { motion } from 'framer-motion';

interface SkeletonProps {
  className?: string;
}

export function Skeleton({ className = '' }: SkeletonProps) {
  return (
    <div 
      className={`bg-slate-800/50 rounded animate-pulse ${className}`}
    />
  );
}

// Verse Card Skeleton
export function VerseCardSkeleton() {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="glass-card p-5"
    >
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-3">
          <Skeleton className="w-8 h-8 rounded-lg" />
          <Skeleton className="w-24 h-4" />
        </div>
        <Skeleton className="w-16 h-4" />
      </div>
      <div className="space-y-2">
        <Skeleton className="w-full h-5" />
        <Skeleton className="w-full h-5" />
        <Skeleton className="w-3/4 h-5" />
      </div>
      <div className="flex gap-2 mt-4 pt-3 border-t border-slate-700/30">
        <Skeleton className="w-16 h-6 rounded-md" />
        <Skeleton className="w-20 h-6 rounded-md" />
      </div>
    </motion.div>
  );
}

// Forensic Card Skeleton
export function ForensicCardSkeleton() {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="glass-card p-4"
    >
      <div className="flex items-center gap-3 mb-3">
        <Skeleton className="w-8 h-8 rounded" />
        <div className="flex-1">
          <Skeleton className="w-32 h-4 mb-1" />
          <Skeleton className="w-20 h-3" />
        </div>
      </div>
      <div className="space-y-2">
        <Skeleton className="w-full h-3" />
        <Skeleton className="w-full h-3" />
        <Skeleton className="w-2/3 h-3" />
      </div>
    </motion.div>
  );
}

// Media Card Skeleton
export function MediaCardSkeleton() {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="glass-card p-4"
    >
      <Skeleton className="w-full aspect-video rounded-lg mb-3" />
      <Skeleton className="w-3/4 h-4 mb-2" />
      <Skeleton className="w-full h-3 mb-3" />
      <div className="flex gap-2">
        <Skeleton className="w-12 h-5 rounded-full" />
        <Skeleton className="w-16 h-5 rounded-full" />
      </div>
    </motion.div>
  );
}

// Knowledge Base Card Skeleton
export function KnowledgeCardSkeleton() {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="glass-card p-6"
    >
      <div className="flex items-center justify-between mb-4">
        <Skeleton className="w-48 h-5" />
        <div className="flex gap-2">
          <Skeleton className="w-16 h-6 rounded" />
          <Skeleton className="w-6 h-6 rounded" />
          <Skeleton className="w-6 h-6 rounded" />
        </div>
      </div>
      <div className="space-y-2 mb-4">
        <Skeleton className="w-full h-3" />
        <Skeleton className="w-full h-3" />
        <Skeleton className="w-full h-3" />
        <Skeleton className="w-3/4 h-3" />
      </div>
      <div className="flex gap-2 pt-4 border-t border-slate-700/30">
        <Skeleton className="w-20 h-5 rounded-md" />
        <Skeleton className="w-24 h-5 rounded-md" />
        <Skeleton className="w-16 h-5 rounded-md" />
      </div>
    </motion.div>
  );
}

// Storage Usage Skeleton
export function StorageUsageSkeleton() {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="glass-card p-6"
    >
      <Skeleton className="w-32 h-5 mb-4" />
      <Skeleton className="w-full h-8 rounded-full mb-2" />
      <div className="flex justify-between">
        <Skeleton className="w-20 h-4" />
        <Skeleton className="w-20 h-4" />
      </div>
    </motion.div>
  );
}

// Table Row Skeleton
export function TableRowSkeleton({ columns = 4 }: { columns?: number }) {
  return (
    <tr className="border-b border-slate-700/30">
      {Array.from({ length: columns }).map((_, i) => (
        <td key={i} className="px-4 py-3">
          <Skeleton className={`h-4 ${i === 0 ? 'w-24' : 'w-full'}`} />
        </td>
      ))}
    </tr>
  );
}

// Full Table Skeleton
export function TableSkeleton({ rows = 5, columns = 4 }: { rows?: number; columns?: number }) {
  return (
    <div className="glass-card overflow-hidden">
      <table className="w-full">
        <thead className="bg-slate-800/50">
          <tr>
            {Array.from({ length: columns }).map((_, i) => (
              <th key={i} className="px-4 py-3 text-left">
                <Skeleton className="h-4 w-20" />
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {Array.from({ length: rows }).map((_, i) => (
            <TableRowSkeleton key={i} columns={columns} />
          ))}
        </tbody>
      </table>
    </div>
  );
}

// Sidebar Skeleton
export function SidebarSkeleton() {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="glass-card h-full flex flex-col"
    >
      <div className="p-4 border-b border-slate-700/50">
        <Skeleton className="w-40 h-5 mb-4" />
        <Skeleton className="w-full h-10 rounded-lg" />
      </div>
      <div className="p-4 border-b border-slate-700/50">
        <Skeleton className="w-24 h-4 mb-3" />
        <div className="flex flex-wrap gap-2">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="w-16 h-6 rounded-full" />
          ))}
        </div>
      </div>
      <div className="flex-1 p-4 space-y-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <ForensicCardSkeleton key={i} />
        ))}
      </div>
    </motion.div>
  );
}

// Strongs Panel Skeleton
export function StrongsPanelSkeleton() {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="glass-card w-full max-w-md"
    >
      <div className="flex items-center gap-3 p-4 border-b border-slate-700/50">
        <Skeleton className="w-10 h-10 rounded-lg" />
        <div>
          <Skeleton className="w-24 h-5 mb-1" />
          <Skeleton className="w-16 h-3" />
        </div>
      </div>
      <div className="p-4 space-y-4">
        <div>
          <Skeleton className="w-20 h-4 mb-2" />
          <Skeleton className="w-full h-4" />
        </div>
        <Skeleton className="w-full h-24 rounded-lg" />
        <div>
          <Skeleton className="w-24 h-4 mb-2" />
          <div className="space-y-2">
            <Skeleton className="w-full h-12 rounded-lg" />
            <Skeleton className="w-full h-12 rounded-lg" />
          </div>
        </div>
      </div>
    </motion.div>
  );
}

// Shimmer animation overlay
export function Shimmer() {
  return (
    <div className="absolute inset-0 -translate-x-full animate-[shimmer_2s_infinite] bg-gradient-to-r from-transparent via-slate-700/30 to-transparent" />
  );
}

// Add shimmer keyframes to CSS (add to globals.css if needed)
// @keyframes shimmer {
//   100% { transform: translateX(100%); }
// }
