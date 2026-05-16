'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useISA820Store } from '@/store/isa820-store';
import { supabase } from '@/lib/supabase';
import type { ForensicCard } from '@/types';
import {
  X,
  ChevronDown,
  ChevronUp,
  Play,
  Image as ImageIcon,
  FileText,
  Lightbulb,
  Search,
  Loader2,
  Sparkles,
  BookOpen,
  Zap,
  MessageSquare,
  RotateCcw,
} from 'lucide-react';

// Lightweight markdown renderer — handles the sections Gemini produces
function AnalystMarkdown({ text }: { text: string }) {
  const lines = text.split('\n');
  const elements: React.ReactNode[] = [];
  let key = 0;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    if (line.startsWith('## ')) {
      elements.push(
        <h3 key={key++} className="text-amber-400 font-semibold text-sm mt-4 mb-1.5 first:mt-0 border-b border-amber-500/20 pb-1">
          {line.replace(/^## /, '')}
        </h3>
      );
    } else if (line.startsWith('### ')) {
      elements.push(
        <h4 key={key++} className="text-cyan-400 font-medium text-xs mt-3 mb-1">
          {line.replace(/^### /, '')}
        </h4>
      );
    } else if (line.startsWith('- ') || line.startsWith('* ')) {
      const content = line.replace(/^[-*] /, '');
      elements.push(
        <li key={key++} className="flex gap-2 text-xs text-slate-300 leading-relaxed ml-2">
          <span className="text-amber-500 flex-shrink-0 mt-0.5">•</span>
          <span dangerouslySetInnerHTML={{ __html: renderInline(content) }} />
        </li>
      );
    } else if (line.startsWith('**') && line.endsWith('**') && line.length > 4) {
      elements.push(
        <p key={key++} className="text-white font-semibold text-xs mt-2">
          {line.replace(/\*\*/g, '')}
        </p>
      );
    } else if (line.trim() === '' || line.trim() === '---') {
      elements.push(<div key={key++} className="h-1" />);
    } else if (line.trim()) {
      elements.push(
        <p key={key++} className="text-xs text-slate-300 leading-relaxed"
          dangerouslySetInnerHTML={{ __html: renderInline(line) }} />
      );
    }
  }

  return <div className="space-y-0.5">{elements}</div>;
}

function renderInline(text: string): string {
  return text
    .replace(/\*\*(.+?)\*\*/g, '<strong class="text-white font-semibold">$1</strong>')
    .replace(/\*(.+?)\*/g, '<em class="text-slate-200">$1</em>')
    .replace(/`(.+?)`/g, '<code class="font-mono text-cyan-400 bg-slate-800/60 px-1 rounded text-[0.7em]">$1</code>');
}

const CARD_ICONS = {
  verse: FileText,
  video: Play,
  graphic: ImageIcon,
  understanding: Lightbulb,
};

const CARD_COLORS = {
  verse: 'border-blue-500/30 bg-blue-500/5',
  video: 'border-red-500/30 bg-red-500/5',
  graphic: 'border-purple-500/30 bg-purple-500/5',
  understanding: 'border-amber-500/30 bg-amber-500/5',
};

const TOPICS = [
  'soul', 'trinity', 'godhead', 'oneness', 
  'alpha-omega', 'father', 'son', 'deity',
  'genesis', 'revelation', 'yahweh'
];


export function ForensicSidebar() {
  const { 
    sidebar, 
    toggleSidebar, 
    setCurrentTopic, 
    setForensicCards, 
    setSidebarLoading 
  } = useISA820Store();
  const [expandedCard, setExpandedCard] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [showVerseAnalysis, setShowVerseAnalysis] = useState(false);
  const [analystResponse, setAnalystResponse] = useState('');
  const [isAnalystLoading, setIsAnalystLoading] = useState(false);
  const [analystQuestion, setAnalystQuestion] = useState('');
  const [analystError, setAnalystError] = useState('');

  useEffect(() => {
    if (!sidebar.currentTopic) return;
    setSidebarLoading(true);
    setShowVerseAnalysis(false);

    const topic = sidebar.currentTopic;
    (async () => {
      try {
        const { data } = await supabase
          .from('knowledge_base')
          .select('*')
          .or(`topic.ilike.%${topic}%,title.ilike.%${topic}%`)
          .order('confidence_level', { ascending: false })
          .limit(10);
        const cards: ForensicCard[] = (data || []).map(row => ({
          id: row.id,
          type: 'understanding' as const,
          title: row.title,
          content: row.content,
          verseReference: (row.supporting_verses || [])[0] || undefined,
          topics: row.related_topics || [],
          youtubeId: undefined,
          mediaUrl: undefined,
        }));
        setForensicCards(cards);
      } catch {
        // silent
      } finally {
        setSidebarLoading(false);
      }
    })();
  }, [sidebar.currentTopic, setForensicCards, setSidebarLoading]);

  const fetchAnalysis = async (question?: string) => {
    const verse = sidebar.selectedVerseForAnalysis;
    if (!verse) return;
    setIsAnalystLoading(true);
    setAnalystResponse('');
    setAnalystError('');
    try {
      const res = await fetch('/api/analyst', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          verseRef: `${verse.book} ${verse.chapter}:${verse.verse}`,
          verseText: verse.text,
          strongsData: verse.strongs,
          question: question || undefined,
        }),
      });
      if (!res.ok) throw new Error(await res.text());
      const reader = res.body?.getReader();
      if (!reader) throw new Error('No response stream');
      const decoder = new TextDecoder();
      let done = false;
      while (!done) {
        const { value, done: doneReading } = await reader.read();
        done = doneReading;
        if (value) setAnalystResponse(prev => prev + decoder.decode(value, { stream: !done }));
      }
    } catch (err) {
      const raw = err instanceof Error ? err.message : 'Analysis failed';
      if (raw.includes('429') || raw.includes('quota') || raw.includes('Too Many')) {
        setAnalystError('Daily quota reached for Gemini 2.5 Pro (free tier). Resets at midnight Pacific. Try again tomorrow or enable billing at console.cloud.google.com.');
      } else if (raw.includes('404')) {
        setAnalystError('Model not found. The API route may need a model ID update.');
      } else if (raw.includes('API_KEY') || raw.includes('403')) {
        setAnalystError('API key error. Check GEMINI_API_KEY in .env.local.');
      } else {
        setAnalystError(raw);
      }
    } finally {
      setIsAnalystLoading(false);
    }
  };

  // Auto-show verse analysis when verse is selected
  useEffect(() => {
    if (sidebar.selectedVerseForAnalysis) {
      setShowVerseAnalysis(true);
      setAnalystResponse('');
      setAnalystQuestion('');
      fetchAnalysis();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sidebar.selectedVerseForAnalysis]);

  const filteredTopics = TOPICS.filter(t => 
    t.toLowerCase().includes(searchQuery.toLowerCase())
  );



  return (
    <AnimatePresence>
      {sidebar.isOpen && (
        <motion.aside
          initial={{ opacity: 0, x: 300 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: 300 }}
          transition={{ type: 'spring', damping: 25 }}
          className="glass-deep glass-panel-solid h-full flex flex-col overflow-hidden"
        >
          {/* Header */}
          <div className="p-4 border-b border-white/5">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-base font-semibold text-white flex items-center gap-2">
                <Lightbulb className="w-4 h-4 text-amber-400" />
                <span style={{ fontFamily: 'var(--font-cinzel), serif', letterSpacing: '0.05em', fontSize: '0.85rem' }}>
                  Forensic Analysis
                </span>
              </h2>
              <button
                onClick={toggleSidebar}
                aria-label="Close analysis panel"
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-700/60 border border-slate-600/50 text-slate-300 hover:bg-red-500/20 hover:border-red-500/40 hover:text-red-400 transition-all text-xs font-medium"
              >
                <X className="w-3.5 h-3.5" />
                Close
              </button>
            </div>

            {/* Verse-Specific Analysis Banner */}
            {sidebar.selectedVerseForAnalysis && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="mb-4 p-3 rounded-lg bg-gradient-to-r from-cyan-500/10 to-amber-500/10 border border-cyan-500/30"
              >
                <div className="flex items-center gap-2 mb-2">
                  <Sparkles className="w-4 h-4 text-cyan-400" />
                  <span className="text-sm font-medium text-cyan-400">Verse Analysis Active</span>
                </div>
                <p className="text-xs text-slate-400">
                  {sidebar.selectedVerseForAnalysis.book} {sidebar.selectedVerseForAnalysis.chapter}:{sidebar.selectedVerseForAnalysis.verse}
                </p>
              </motion.div>
            )}

            {/* Topic Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
              <input
                type="text"
                placeholder="Search topics..."
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setShowVerseAnalysis(false);
                }}
                className="w-full pl-10 pr-4 py-2 bg-slate-800/50 border border-slate-700/50 rounded-lg text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:border-amber-500/50"
              />
            </div>
          </div>

          {/* Topic Pills */}
          <div className="px-4 py-3 border-b border-white/5">
            <p className="text-[10px] text-slate-600 mb-2 uppercase tracking-widest">Quick Topics</p>
            <div className="flex overflow-x-auto scrollbar-hide gap-2 pb-1">
              {filteredTopics.map(topic => (
                <button
                  key={topic}
                  onClick={() => {
                    setCurrentTopic(topic);
                    setShowVerseAnalysis(false);
                  }}
                  className={`flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
                    sidebar.currentTopic === topic && !showVerseAnalysis
                      ? 'bg-amber-500/20 text-amber-400 border border-amber-500/40 shadow-sm shadow-amber-500/10'
                      : 'bg-slate-800/50 text-slate-500 hover:text-slate-300 hover:bg-slate-700/50 border border-slate-700/40'
                  }`}
                >
                  {topic}
                </button>
              ))}
            </div>
          </div>

          {/* Content Area — single scroll container */}
          <div className="flex-1 overflow-y-auto scrollbar-hide p-4">
            {/* Verse Analysis View */}
            {showVerseAnalysis && sidebar.selectedVerseForAnalysis && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="space-y-4"
              >
                {/* Forensic Analyst Card — Live Gemini 2.5 Pro */}
                <div className={`glass-card p-4 border-cyan-500/25 ${isAnalystLoading ? 'scan-active' : ''}`}>
                  <div className="flex items-center gap-2 mb-3">
                    <Zap className="w-4 h-4 text-cyan-400" />
                    <h3 className="font-semibold text-white text-sm">Forensic Analyst</h3>
                    {isAnalystLoading && (
                      <div className="ml-auto flex items-center gap-1.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
                        <span className="text-xs text-green-400">Live</span>
                      </div>
                    )}
                    {!isAnalystLoading && analystResponse && (
                      <span className="ml-auto text-xs px-2 py-0.5 rounded bg-green-500/15 text-green-400 border border-green-500/20">Done</span>
                    )}
                  </div>

                  {analystError && (
                    <p className="text-xs text-red-400 mb-2 leading-relaxed">{analystError}</p>
                  )}

                  {isAnalystLoading && !analystResponse && (
                    <div className="flex flex-col gap-2 py-6 items-center">
                      <Loader2 className="w-5 h-5 text-cyan-400 animate-spin" />
                      <span className="text-xs text-slate-500">Analyzing manuscript evidence…</span>
                    </div>
                  )}

                  {/* Streaming response */}
                  {analystResponse && (
                    <div className="mb-3 space-y-0.5">
                      <AnalystMarkdown text={analystResponse} />
                      {isAnalystLoading && (
                        <span className="cursor-blink" />
                      )}
                    </div>
                  )}

                  {/* Actions row */}
                  {!isAnalystLoading && analystResponse && (
                    <button
                      onClick={() => fetchAnalysis()}
                      className="flex items-center gap-1.5 text-xs text-slate-500 hover:text-slate-300 transition-colors mb-2"
                    >
                      <RotateCcw className="w-3 h-3" /> Re-analyze
                    </button>
                  )}

                  {/* Follow-up question input */}
                  {!isAnalystLoading && (
                    <div className="flex gap-2 mt-2">
                      <input
                        type="text"
                        placeholder="Ask a follow-up question…"
                        value={analystQuestion}
                        onChange={e => setAnalystQuestion(e.target.value)}
                        onKeyDown={e => {
                          if (e.key === 'Enter' && analystQuestion.trim()) {
                            fetchAnalysis(analystQuestion.trim());
                            setAnalystQuestion('');
                          }
                        }}
                        className="flex-1 px-3 py-1.5 bg-slate-800/50 border border-slate-700/50 rounded-lg text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-cyan-500/50"
                      />
                      <button
                        onClick={() => {
                          if (analystQuestion.trim()) {
                            fetchAnalysis(analystQuestion.trim());
                            setAnalystQuestion('');
                          }
                        }}
                        disabled={!analystQuestion.trim()}
                        className="px-3 py-1.5 bg-cyan-500/20 text-cyan-400 rounded-lg text-xs hover:bg-cyan-500/30 transition-colors disabled:opacity-40"
                      >
                        Ask
                      </button>
                    </div>
                  )}
                </div>

                {/* Verse Card */}
                <div className="glass-card p-4 border-blue-500/30">
                  <div className="flex items-center gap-2 mb-3">
                    <BookOpen className="w-5 h-5 text-blue-400" />
                    <h3 className="font-semibold text-white">Verse Context</h3>
                  </div>
                  <p className="text-xs text-slate-500 mb-2">
                    {sidebar.selectedVerseForAnalysis.book} {sidebar.selectedVerseForAnalysis.chapter}:{sidebar.selectedVerseForAnalysis.verse}
                  </p>
                  <p className="text-sm text-slate-300 leading-relaxed italic mb-3">
                    "{sidebar.selectedVerseForAnalysis.text}"
                  </p>
                  
                  {/* Strong's Words */}
                  {sidebar.selectedVerseForAnalysis.strongs.length > 0 && (
                    <div className="space-y-2">
                      <p className="text-xs text-slate-500 uppercase tracking-wide">Key Words</p>
                      {sidebar.selectedVerseForAnalysis.strongs.map((strong, idx) => (
                        <div key={idx} className="flex items-center gap-2 p-2 bg-slate-800/50 rounded-lg">
                          <span className="text-cyan-400 font-mono text-xs">{strong.strongsId}</span>
                          <span className="text-slate-300 text-sm">{strong.transliteration}</span>
                          <span className="text-slate-500 text-xs">- {strong.definition}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Verse Actions */}
                <div className="flex gap-2">
                  <button 
                    onClick={() => setShowVerseAnalysis(false)}
                    className="flex-1 px-4 py-2 bg-slate-700/50 rounded-lg text-sm text-slate-300 hover:bg-slate-600/50 transition-colors"
                  >
                    Close Analysis
                  </button>
                  <button className="px-4 py-2 bg-cyan-500/20 text-cyan-400 rounded-lg text-sm hover:bg-cyan-500/30 transition-colors">
                    Share
                  </button>
                </div>
              </motion.div>
            )}

            {/* Loading State */}
            {sidebar.isLoading && (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="w-8 h-8 text-amber-400 animate-spin" />
              </div>
            )}

            {/* Topic Search Results */}
            {!showVerseAnalysis && !sidebar.isLoading && sidebar.currentTopic && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-medium text-slate-400">
                    Results for: <span className="text-amber-400">{sidebar.currentTopic}</span>
                  </h3>
                  <span className="text-xs text-slate-500">
                    {sidebar.forensicCards.length} items
                  </span>
                </div>

                {sidebar.forensicCards.map((card) => {
                  const Icon = CARD_ICONS[card.type];
                  const colorClass = CARD_COLORS[card.type];
                  const isExpanded = expandedCard === card.id;

                  return (
                    <motion.div
                      key={card.id}
                      layout
                      className={`border rounded-xl overflow-hidden ${colorClass}`}
                    >
                      {/* Card Header */}
                      <button
                        onClick={() => setExpandedCard(isExpanded ? null : card.id)}
                        className="w-full p-4 flex items-center justify-between hover:bg-white/5 transition-colors"
                      >
                        <div className="flex items-center gap-3">
                          <Icon className="w-5 h-5 text-slate-400" />
                          <div className="text-left">
                            <h4 className="text-sm font-medium text-white">{card.title}</h4>
                            {card.verseReference && (
                              <p className="text-xs text-slate-500">{card.verseReference}</p>
                            )}
                          </div>
                        </div>
                        {isExpanded ? (
                          <ChevronUp className="w-4 h-4 text-slate-400" />
                        ) : (
                          <ChevronDown className="w-4 h-4 text-slate-400" />
                        )}
                      </button>

                      {/* Expanded Content */}
                      <AnimatePresence>
                        {isExpanded && (
                          <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            transition={{ duration: 0.2 }}
                            className="border-t border-slate-700/30 overflow-hidden"
                          >
                            <div className="p-4 space-y-4">
                              {/* Video Embed */}
                              {card.youtubeId && (
                                <div className="video-embed rounded-lg overflow-hidden">
                                  <iframe
                                    src={`https://www.youtube.com/embed/${card.youtubeId}`}
                                    title={card.title}
                                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                    allowFullScreen
                                    className="absolute inset-0 w-full h-full"
                                  />
                                </div>
                              )}

                              {/* Image/Graphic */}
                              {card.mediaUrl && !card.youtubeId && (
                                <div className="rounded-lg overflow-hidden bg-slate-800/50 p-4">
                                  <img
                                    src={card.mediaUrl}
                                    alt={card.title}
                                    className="w-full rounded-lg"
                                    onError={(e) => {
                                      (e.target as HTMLImageElement).style.display = 'none';
                                    }}
                                  />
                                </div>
                              )}

                              {/* Text Content */}
                              <p className="text-sm text-slate-300 leading-relaxed">
                                {card.content}
                              </p>

                              {/* Topic Tags */}
                              <div className="flex flex-wrap gap-2">
                                {card.topics.slice(0, 4).map(topic => (
                                  <span
                                    key={topic}
                                    className="text-xs px-2 py-1 bg-slate-800/50 rounded text-slate-400"
                                  >
                                    #{topic}
                                  </span>
                                ))}
                              </div>

                              {/* Actions */}
                              <div className="flex gap-2 pt-2">
                                <button className="flex-1 px-3 py-2 bg-slate-700/50 rounded-lg text-xs font-medium text-slate-300 hover:bg-slate-600/50 transition-colors">
                                  Open in Detail
                                </button>
                                <button className="px-3 py-2 bg-slate-700/50 rounded-lg text-xs font-medium text-slate-300 hover:bg-slate-600/50 transition-colors">
                                  Copy
                                </button>
                              </div>
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </motion.div>
                  );
                })}
              </div>
            )}

            {/* Empty State */}
            {!showVerseAnalysis && !sidebar.isLoading && !sidebar.currentTopic && (
              <div className="text-center py-12">
                <MessageSquare className="w-12 h-12 text-slate-600 mx-auto mb-4" />
                <p className="text-slate-400 mb-2">Select a topic to analyze</p>
                <p className="text-sm text-slate-500">
                  Choose from the topics above or click a verse number to see forensic analysis.
                </p>
              </div>
            )}
          </div>
        </motion.aside>
      )}
    </AnimatePresence>
  );
}
