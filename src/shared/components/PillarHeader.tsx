'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';
import { HelpCircle } from 'lucide-react';
import { useISA820Store } from '@/store/isa820-store';
import { Tooltip } from './Tooltip';
import { PassageSelector } from './PassageSelector';
import type { NatureManifestation } from '@/types';

// ─── Logo SVG ───────────────────────────────────────────────────────────────
const ISA820Logo = () => (
  <svg
    viewBox="0 0 44 44"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className="w-10 h-10 animate-float"
    aria-label="ISA820 Logo"
  >
    <defs>
      <linearGradient id="logoGold" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#fbbf24" />
        <stop offset="55%" stopColor="#f59e0b" />
        <stop offset="100%" stopColor="#d97706" />
      </linearGradient>
      <linearGradient id="logoAccent" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#dc2626" stopOpacity="0.8" />
        <stop offset="100%" stopColor="#b91c1c" stopOpacity="0.4" />
      </linearGradient>
      <filter id="logoGlow">
        <feGaussianBlur stdDeviation="1.5" result="blur" />
        <feComposite in="SourceGraphic" in2="blur" operator="over" />
      </filter>
    </defs>
    {/* Octagon — 8 sides referencing 820 */}
    <polygon
      points="22,2 34,6 42,17 42,27 34,38 22,42 10,38 2,27 2,17 10,6"
      fill="url(#logoGold)"
      opacity="0.12"
      stroke="url(#logoGold)"
      strokeWidth="1"
    />
    <polygon
      points="22,6 32,9.5 38,19 38,25 32,34.5 22,38 12,34.5 6,25 6,19 12,9.5"
      fill="none"
      stroke="url(#logoGold)"
      strokeWidth="1.2"
      opacity="0.7"
    />
    {/* Thin crimson accent ring */}
    <polygon
      points="22,4 33,7.5 40,18 40,26 33,36.5 22,40 11,36.5 4,26 4,18 11,7.5"
      fill="none"
      stroke="url(#logoAccent)"
      strokeWidth="0.5"
      opacity="0.5"
    />
    {/* "I" letterform — Isaiah */}
    <rect x="19.5" y="13" width="5" height="18" rx="1" fill="url(#logoGold)" filter="url(#logoGlow)" />
    <rect x="15" y="13" width="14" height="3" rx="1" fill="url(#logoGold)" opacity="0.9" />
    <rect x="15" y="28" width="14" height="3" rx="1" fill="url(#logoGold)" opacity="0.9" />
    {/* Cyan pulse dot */}
    <circle cx="37" cy="8" r="3" fill="#06b6d4" opacity="0.9">
      <animate attributeName="opacity" values="0.9;0.3;0.9" dur="2s" repeatCount="indefinite" />
      <animate attributeName="r" values="3;4;3" dur="2s" repeatCount="indefinite" />
    </circle>
  </svg>
);

// ─── Pillar Icons ────────────────────────────────────────────────────────────
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
    FIRE:    { primary: '#f97316', secondary: '#fbbf24' },
    WHISPER: { primary: '#06b6d4', secondary: '#22d3ee' },
    LIGHT:   { primary: '#f8fafc', secondary: '#e2e8f0' },
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

// ─── Tooltip content ─────────────────────────────────────────────────────────
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
  { value: 'KJV',   label: 'KJV'   },
  { value: 'TAHOT', label: 'TAHOT' },
  { value: 'TBESG', label: 'TBESG' },
  { value: 'BSB',   label: 'BSB'   },
  { value: 'WEB',   label: 'WEB'   },
  { value: 'ASV',   label: 'ASV'   },
  { value: 'YLT',   label: 'YLT'   },
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
    FIRE:    'text-orange-400',
    WHISPER: 'text-cyan-400',
    LIGHT:   'text-slate-100',
  };

  const natureGlow = {
    FIRE:    'shadow-orange-500/50',
    WHISPER: 'shadow-cyan-500/50',
    LIGHT:   'shadow-white/30',
  };

  return (
    <header className="sticky top-0 z-50 glass-deep border-b border-white/5 px-4 py-3 overflow-x-hidden">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-3 flex-wrap sm:flex-nowrap">

        {/* Logo */}
        <div className="flex items-center gap-3 flex-shrink-0">
          <ISA820Logo />
          <div className="leading-tight">
            <h1
              className="text-lg font-bold text-gradient-gold tracking-widest"
              style={{ fontFamily: 'var(--font-cinzel), serif' }}
            >
              ISA820
            </h1>
            <p
              className="text-[10px] tracking-[0.18em] uppercase text-slate-500"
              style={{ fontFamily: 'var(--font-spectral), serif' }}
            >
              The Forensic Standard
            </p>
          </div>
        </div>

        {/* Passage Selector — hidden on small mobile, full-width row below on md */}
        <div className="hidden md:flex items-center gap-3 flex-1 max-w-2xl mx-2 lg:mx-4">
          <PassageSelector />
        </div>

        {/* Pillar Buttons */}
        <div className="flex items-center gap-1.5 sm:gap-2">
          {/* ISA 8:20 — Father */}
          <Tooltip content={ISA820_TOOLTIP}>
            <motion.button
              whileHover={{ scale: 1.08 }}
              whileTap={{ scale: 0.93 }}
              animate={pillar.isPulsing.isa820 ? { scale: [1, 1.18, 1] } : {}}
              className={`
                relative w-10 h-10 sm:w-11 sm:h-11 rounded-xl flex items-center justify-center
                bg-gradient-to-br from-amber-500/15 to-orange-600/10
                border transition-all duration-200
                ${speakerFilter === 'FATHER'
                  ? 'border-amber-400/70 ring-glow-gold'
                  : 'border-amber-500/25 hover:border-amber-500/50 hover:bg-amber-500/15'}
                ${pillar.isPulsing.isa820 ? 'pulse-gold' : ''}
              `}
              onClick={() => {
                triggerPillarPulse('isa820');
                setSpeakerFilter(speakerFilter === 'FATHER' ? 'ALL' : 'FATHER');
              }}
              title="Isaiah 8:20 — The Father"
            >
              <TorchIcon className="w-5 h-5 text-amber-400" />
              {speakerFilter === 'FATHER' && (
                <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-amber-400 rounded-full shadow-lg shadow-amber-400/50" />
              )}
            </motion.button>
          </Tooltip>

          {/* DEUT 6:4 — Son */}
          <Tooltip content={DEUT64_TOOLTIP}>
            <motion.button
              whileHover={{ scale: 1.08 }}
              whileTap={{ scale: 0.93 }}
              animate={pillar.isPulsing.deut64 ? { scale: [1, 1.18, 1] } : {}}
              className={`
                relative w-10 h-10 sm:w-11 sm:h-11 rounded-xl flex items-center justify-center
                bg-gradient-to-br from-blue-500/15 to-indigo-600/10
                border transition-all duration-200
                ${speakerFilter === 'SON'
                  ? 'border-red-400/70 ring-glow-cyan'
                  : 'border-blue-500/25 hover:border-blue-500/50 hover:bg-blue-500/15'}
                ${pillar.isPulsing.deut64 ? 'pulse-blue' : ''}
              `}
              onClick={() => {
                triggerPillarPulse('deut64');
                setSpeakerFilter(speakerFilter === 'SON' ? 'ALL' : 'SON');
              }}
              title="Deuteronomy 6:4 — The Son"
            >
              <OneSealIcon className="w-5 h-5 text-blue-400" />
              {speakerFilter === 'SON' && (
                <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-red-400 rounded-full shadow-lg shadow-red-400/50" />
              )}
            </motion.button>
          </Tooltip>

          {/* Nature — Angel */}
          <Tooltip content={NATURE_TOOLTIP}>
            <motion.button
              whileHover={{ scale: 1.08 }}
              whileTap={{ scale: 0.93 }}
              animate={pillar.isPulsing.nature ? { scale: [1, 1.18, 1] } : {}}
              className={`
                relative w-10 h-10 sm:w-11 sm:h-11 rounded-xl flex items-center justify-center
                border transition-all duration-200
                ${speakerFilter === 'ANGEL'
                  ? 'border-slate-300/70 glow-silver'
                  : pillar.nature === 'FIRE'    ? 'border-orange-500/25 bg-orange-500/10 hover:border-orange-500/50'
                  : pillar.nature === 'WHISPER' ? 'border-cyan-500/25 bg-cyan-500/10 hover:border-cyan-500/50'
                  : 'border-white/15 bg-white/5 hover:border-white/30'}
                ${pillar.isPulsing.nature ? `shadow-xl ${natureGlow[pillar.nature]}` : ''}
              `}
              onClick={() => {
                const natures: NatureManifestation[] = ['FIRE', 'WHISPER', 'LIGHT'];
                const currentIndex = natures.indexOf(pillar.nature);
                setNatureManifestation(natures[(currentIndex + 1) % natures.length]);
                triggerPillarPulse('nature');
                setSpeakerFilter(speakerFilter === 'ANGEL' ? 'ALL' : 'ANGEL');
              }}
              title="Nature Manifestation — The Angel"
            >
              <NatureIcon className={`w-5 h-5 ${natureColors[pillar.nature]}`} manifestation={pillar.nature} />
              {speakerFilter === 'ANGEL' && (
                <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-slate-300 rounded-full shadow-lg shadow-slate-300/50" />
              )}
            </motion.button>
          </Tooltip>
        </div>

        {/* Right Controls */}
        <div className="flex items-center gap-2 flex-shrink-0">
          {/* Guide link — icon on mobile, text on desktop */}
          <Link
            href="/guide"
            className="flex items-center gap-1.5 px-2 lg:px-3 py-2 lg:py-1.5 rounded-xl btn-ghost text-xs font-medium"
            title="How to Use"
          >
            <HelpCircle className="w-4 h-4 flex-shrink-0" />
            <span className="hidden lg:inline">How to Use</span>
          </Link>

          {/* Primary translation */}
          <select
            value={currentTranslation}
            onChange={(e) => setTranslation(e.target.value)}
            className="bg-obsidian-800 border border-slate-700/60 rounded-lg px-2 sm:px-3 py-2 text-xs sm:text-sm text-slate-200 focus:outline-none focus:border-amber-500/50 max-w-[80px] sm:max-w-none"
          >
            {TRANSLATIONS.map(t => (
              <option key={t.value} value={t.value}>{t.label}</option>
            ))}
          </select>

          {/* Parallel toggle */}
          <button
            onClick={toggleParallelMode}
            title={isParallelMode ? 'Exit parallel mode' : 'Compare two translations side by side'}
            className={`p-2 rounded-lg border transition-all text-sm ${
              isParallelMode
                ? 'bg-cyan-500/20 border-cyan-500/40 text-cyan-400 shadow-sm shadow-cyan-500/20'
                : 'btn-ghost'
            }`}
          >
            ⫴
          </button>

          {/* Secondary translation */}
          {isParallelMode && (
            <select
              value={secondaryTranslation}
              onChange={(e) => setSecondaryTranslation(e.target.value)}
              className="hidden sm:block bg-obsidian-800 border border-cyan-500/40 rounded-lg px-2 sm:px-3 py-2 text-xs sm:text-sm text-cyan-300 focus:outline-none focus:border-cyan-400"
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
