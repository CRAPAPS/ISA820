'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';
import { useISA820Store } from '@/store/isa820-store';
import { Tooltip } from './Tooltip';
import { PassageSelector } from './PassageSelector';
import type { NatureManifestation } from '@/types';

// SVG Icons as components
const TorchIcon = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 24 24" fill="none" className={className} stroke="currentColor" strokeWidth="2">
    <path strokeLinecap="round" strokeLinejoin="round" d="M11.25 4.5l2.25 2.25-1.5 1.5-2.25-2.25 1.5-1.5z" />
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 6l-1.5 4.5L12 12l1.5-1.5L12 6z" />
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 12v8" />
    <path strokeLinecap="round" strokeLinejoin="round" d="M9 20h6" />
  </svg>
);

const OneSealIcon = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 24 24" fill="none" className={className} stroke="currentColor" strokeWidth="2">
    <circle cx="12" cy="12" r="9" />
    <text x="12" y="16" textAnchor="middle" fill="currentColor" stroke="none" fontSize="10" fontWeight="bold">1</text>
  </svg>
);

const NatureIcon = ({ className, manifestation }: { className?: string; manifestation: NatureManifestation }) => {
  const colors = {
    FIRE: { primary: '#f97316', secondary: '#fbbf24' },
    WHISPER: { primary: '#06b6d4', secondary: '#22d3ee' },
    LIGHT: { primary: '#f8fafc', secondary: '#e2e8f0' },
  };
  
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className}>
      <circle cx="12" cy="12" r="4" fill={colors[manifestation].primary} />
      <path 
        d="M12 2v2M12 20v2M2 12h2M20 12h2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41" 
        stroke={colors[manifestation].secondary} 
        strokeWidth="2" 
        strokeLinecap="round" 
      />
    </svg>
  );
};

// Tooltip content for each pillar
const ISA820_TOOLTIP = {
  title: 'The Standard (Isaiah 8:20)',
  description: 'The Law and the Testimony - the measuring rod for all doctrine.',
  spiritualLogic: 'When content aligns with Torah and prophetic witness, this pillar illuminates gold, signaling truth verification. Isa 8:20 commands us to measure all teachings by Scripture alone.',
  verseReference: 'Isaiah 8:20',
};

const DEUT64_TOOLTIP = {
  title: 'The Identity (Deuteronomy 6:4)',
  description: 'Shema Yisrael - Yahweh our Elohim, Yahweh is one.',
  spiritualLogic: 'This pillar guards against identity confusion in the Godhead. When discussing Father, Son, or Spirit, it pulses blue to remind us of absolute unity - not trinity.',
  verseReference: 'Deuteronomy 6:4',
};

const NATURE_TOOLTIP = {
  title: 'The Nature (Characteristics)',
  description: 'Dynamic manifestation based on divine activity.',
  spiritualLogic: 'The Father reveals Himself through nature - Amber Fire (judgment), Cyan Whisper (Gentle guidance), or White Light (Purity). Watch this icon change as you study different aspects of the Father.',
};

const TRANSLATIONS = [
  { value: 'KJV',   label: 'KJV — King James Version'          },
  { value: 'TAHOT', label: 'TAHOT — Hebrew OT (Interlinear)'   },
  { value: 'TBESG', label: 'TBESG — Greek NT (Interlinear)'    },
  { value: 'BSB',   label: 'BSB — Berean Standard Bible'        },
  { value: 'WEB',   label: 'WEB — World English Bible'         },
  { value: 'ASV',   label: 'ASV — American Standard Version'   },
  { value: 'YLT',   label: "YLT — Young's Literal Translation" },
];

export function PillarHeader() {
  const {
    pillar, setNatureManifestation, triggerPillarPulse,
    currentTranslation, setTranslation,
    secondaryTranslation, setSecondaryTranslation,
    isParallelMode, toggleParallelMode,
    speakerFilter, setSpeakerFilter,
  } = useISA820Store();

  const natureColors = {
    FIRE: 'text-orange-500',
    WHISPER: 'text-cyan-400',
    LIGHT: 'text-slate-100',
  };

  const natureGlow = {
    FIRE: 'shadow-orange-500/50',
    WHISPER: 'shadow-cyan-500/50',
    LIGHT: 'shadow-white/30',
  };

  return (
    <header className="sticky top-0 z-50 glass-card border-b border-slate-700/50 px-4 py-3">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
        {/* Logo */}
        <div className="flex items-center gap-3">
          <div className="relative">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center">
              <span className="text-white font-bold text-lg">8</span>
            </div>
            <div className="absolute -top-1 -right-1 w-3 h-3 bg-cyan-400 rounded-full animate-pulse" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-white">ISA820</h1>
            <p className="text-xs text-slate-400">The Forensic Standard</p>
          </div>
        </div>

        {/* Passage Selector */}
        <div className="hidden md:flex items-center gap-3 flex-1 max-w-2xl mx-4">
          <PassageSelector />
        </div>

        {/* Pillar Icons */}
        <div className="flex items-center gap-2">
          {/* ISA 8:20 — highlight Father verses */}
          <Tooltip content={ISA820_TOOLTIP}>
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.95 }}
              animate={pillar.isPulsing.isa820 ? { scale: [1, 1.2, 1] } : {}}
              className={`
                relative w-12 h-12 rounded-xl flex items-center justify-center
                bg-gradient-to-br from-amber-500/20 to-orange-600/20
                border transition-all
                ${speakerFilter === 'FATHER' ? 'border-amber-400 ring-1 ring-amber-400/50 glow-gold' : 'border-amber-500/30'}
                ${pillar.isPulsing.isa820 ? 'pulse-gold' : ''}
                hover:bg-amber-500/30
              `}
              onClick={() => {
                triggerPillarPulse('isa820');
                setSpeakerFilter(speakerFilter === 'FATHER' ? 'ALL' : 'FATHER');
              }}
            >
              <TorchIcon className="w-6 h-6 text-amber-400" />
              {speakerFilter === 'FATHER' && (
                <span className="absolute -top-1 -right-1 w-3 h-3 bg-amber-400 rounded-full" />
              )}
            </motion.button>
          </Tooltip>

          {/* DEUT 6:4 — highlight Son verses */}
          <Tooltip content={DEUT64_TOOLTIP}>
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.95 }}
              animate={pillar.isPulsing.deut64 ? { scale: [1, 1.2, 1] } : {}}
              className={`
                relative w-12 h-12 rounded-xl flex items-center justify-center
                bg-gradient-to-br from-blue-500/20 to-indigo-600/20
                border transition-all
                ${speakerFilter === 'SON' ? 'border-red-400 ring-1 ring-red-400/50 glow-crimson' : 'border-blue-500/30'}
                ${pillar.isPulsing.deut64 ? 'pulse-blue' : ''}
                hover:bg-blue-500/30
              `}
              onClick={() => {
                triggerPillarPulse('deut64');
                setSpeakerFilter(speakerFilter === 'SON' ? 'ALL' : 'SON');
              }}
            >
              <OneSealIcon className="w-6 h-6 text-blue-400" />
              {speakerFilter === 'SON' && (
                <span className="absolute -top-1 -right-1 w-3 h-3 bg-red-400 rounded-full" />
              )}
            </motion.button>
          </Tooltip>

          {/* Nature — highlight Angel verses */}
          <Tooltip content={NATURE_TOOLTIP}>
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.95 }}
              animate={pillar.isPulsing.nature ? { scale: [1, 1.2, 1] } : {}}
              className={`
                relative w-12 h-12 rounded-xl flex items-center justify-center
                border transition-all
                ${speakerFilter === 'ANGEL' ? 'border-slate-300 ring-1 ring-slate-300/50 glow-silver' : (
                  pillar.nature === 'FIRE' ? 'border-orange-500/30' :
                  pillar.nature === 'WHISPER' ? 'border-cyan-500/30' : 'border-white/30'
                )}
                ${pillar.nature === 'FIRE' ? 'bg-orange-500/20' : ''}
                ${pillar.nature === 'WHISPER' ? 'bg-cyan-500/20' : ''}
                ${pillar.nature === 'LIGHT' ? 'bg-white/10' : ''}
                ${pillar.isPulsing.nature ? `shadow-xl ${natureGlow[pillar.nature]}` : ''}
              `}
              onClick={() => {
                const natures: NatureManifestation[] = ['FIRE', 'WHISPER', 'LIGHT'];
                const currentIndex = natures.indexOf(pillar.nature);
                setNatureManifestation(natures[(currentIndex + 1) % natures.length]);
                triggerPillarPulse('nature');
                setSpeakerFilter(speakerFilter === 'ANGEL' ? 'ALL' : 'ANGEL');
              }}
            >
              <NatureIcon className={`w-6 h-6 ${natureColors[pillar.nature]}`} manifestation={pillar.nature} />
              {speakerFilter === 'ANGEL' && (
                <span className="absolute -top-1 -right-1 w-3 h-3 bg-slate-300 rounded-full" />
              )}
            </motion.button>
          </Tooltip>
        </div>

        {/* Guide Link */}
        <Link
          href="/guide"
          className="hidden md:flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800/50 border border-slate-700/50 text-slate-400 hover:text-white hover:bg-slate-700/50 transition-colors text-xs font-medium"
        >
          How to Use
        </Link>

        {/* Translation + Parallel Controls */}
        <div className="flex items-center gap-2">
          {/* Primary translation */}
          <select
            value={currentTranslation}
            onChange={(e) => setTranslation(e.target.value)}
            className="bg-obsidian-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-amber-500/50"
          >
            {TRANSLATIONS.map(t => (
              <option key={t.value} value={t.value}>{t.label}</option>
            ))}
          </select>

          {/* Parallel mode toggle */}
          <button
            onClick={toggleParallelMode}
            title={isParallelMode ? 'Exit parallel mode' : 'Compare two translations side by side'}
            className={`p-2 rounded-lg border transition-all text-xs font-medium ${
              isParallelMode
                ? 'bg-cyan-500/20 border-cyan-500/40 text-cyan-400'
                : 'bg-slate-800/50 border-slate-700/50 text-slate-400 hover:bg-slate-700/50'
            }`}
          >
            ⫴
          </button>

          {/* Secondary translation — only when parallel mode on */}
          {isParallelMode && (
            <select
              value={secondaryTranslation}
              onChange={(e) => setSecondaryTranslation(e.target.value)}
              className="bg-obsidian-800 border border-cyan-500/40 rounded-lg px-3 py-2 text-sm text-cyan-300 focus:outline-none focus:border-cyan-400"
            >
              {TRANSLATIONS.map(t => (
                <option key={t.value} value={t.value}>{t.label}</option>
              ))}
            </select>
          )}
        </div>
      </div>
      
      {/* Mobile Passage Selector */}
      <div className="md:hidden mt-3">
        <PassageSelector />
      </div>
    </header>
  );
}
