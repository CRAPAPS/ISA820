'use client';

import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Shield, 
  Database, 
  Video, 
  Image as ImageIcon, 
  FileText,
  RefreshCw, 
  Plus, 
  Trash2,
  Edit,
  Upload,
  Link as LinkIcon,
  Brain,
  X,
  Check,
  AlertCircle,
  HardDrive,
  Link2,
  Map,
  Loader2,
  Eye,
  EyeOff
} from 'lucide-react';
import { supabase } from '@/lib/supabase';
import type { SpiritualUnderstanding, MediaAsset } from '@/lib/supabase';
import { StorageUsageSkeleton } from './SkeletonLoaders';

type AdminTab = 'knowledge' | 'media' | 'mapping' | 'storage' | 'settings';

interface DBStats {
  verses: number;
  strongs: number;
  words: number;
  properNames: number;
  knowledge: number;
  media: number;
}

export function AdminVaultManager() {
  const [activeTab, setActiveTab] = useState<AdminTab>('knowledge');
  const [isSyncing, setIsSyncing] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [knowledgeItems, setKnowledgeItems] = useState<SpiritualUnderstanding[]>([]);
  const [mediaItems, setMediaItems] = useState<MediaAsset[]>([]);
  const [dbStats, setDbStats] = useState<DBStats | null>(null);
  const [statsLoading, setStatsLoading] = useState(true);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const tabs = [
    { id: 'knowledge' as AdminTab, label: 'Knowledge Base', icon: Brain },
    { id: 'media' as AdminTab, label: 'Media Vault', icon: Video },
    { id: 'mapping' as AdminTab, label: 'Topic Mapper', icon: Map },
    { id: 'storage' as AdminTab, label: 'Data Health', icon: HardDrive },
    { id: 'settings' as AdminTab, label: 'Settings', icon: Shield },
  ];

  // Load knowledge base and media from Supabase
  useEffect(() => {
    supabase.from('knowledge_base').select('*').order('created_at', { ascending: false })
      .then(({ data }) => setKnowledgeItems(data || []));
    supabase.from('media_assets').select('*').order('created_at', { ascending: false })
      .then(({ data }) => setMediaItems(data || []));

    // Fetch row counts for stats
    Promise.all([
      supabase.from('verses').select('*', { count: 'exact', head: true }),
      supabase.from('strongs_lexicon').select('*', { count: 'exact', head: true }),
      supabase.from('tahot_words').select('*', { count: 'exact', head: true }),
      supabase.from('proper_names').select('*', { count: 'exact', head: true }),
      supabase.from('knowledge_base').select('*', { count: 'exact', head: true }),
      supabase.from('media_assets').select('*', { count: 'exact', head: true }),
    ]).then(([v, s, w, p, k, m]) => {
      setDbStats({
        verses:      v.count ?? 0,
        strongs:     s.count ?? 0,
        words:       w.count ?? 0,
        properNames: p.count ?? 0,
        knowledge:   k.count ?? 0,
        media:       m.count ?? 0,
      });
      setStatsLoading(false);
    });
  }, []);

  const handleSync = async () => {
    setIsSyncing(true);
    await new Promise(resolve => setTimeout(resolve, 2000));
    setIsSyncing(false);
  };

  const handleUpload = async (file: File) => {
    setIsUploading(true);
    setUploadProgress(0);
    for (let i = 0; i <= 100; i += 10) {
      await new Promise(resolve => setTimeout(resolve, 200));
      setUploadProgress(i);
    }
    setIsUploading(false);
  };

  // Use DB stats if loaded, else show live indicator
  const storagePercentage = 45; // Supabase free tier approximation
  const storageUsedMB = dbStats ? Math.round((dbStats.verses * 0.5 + dbStats.words * 0.2) / 1024) : 0;
  const storageTotalMB = 512;

  return (
    <div className="min-h-screen bg-obsidian-950">
      {/* Admin Header */}
      <header className="glass-card border-b border-slate-700/50 px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-amber-500 to-red-600 flex items-center justify-center">
              <Shield className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-white">Vault Manager</h1>
              <p className="text-sm text-slate-400">ISA820 Administration Panel</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            {/* Storage Quick View */}
            <div className="hidden md:flex items-center gap-2 px-3 py-1.5 bg-slate-800/50 rounded-lg border border-slate-700/50">
              <HardDrive className="w-4 h-4 text-cyan-400" />
              <span className="text-xs text-slate-400">{storageUsedMB}MB / {storageTotalMB}MB</span>
              <div className="w-16 h-1.5 bg-slate-700 rounded-full overflow-hidden">
                <div 
                  className={`h-full rounded-full ${storagePercentage > 80 ? 'bg-red-500' : 'bg-cyan-500'}`}
                  style={{ width: `${storagePercentage}%` }}
                />
              </div>
            </div>
            <span className="text-xs px-3 py-1 bg-red-500/20 text-red-400 rounded-full border border-red-500/30">
              Admin Mode
            </span>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto p-6">
        {/* Tabs */}
        <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
          {tabs.map(tab => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all whitespace-nowrap ${
                  activeTab === tab.id
                    ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                    : 'bg-slate-800/50 text-slate-400 hover:bg-slate-700/50 border border-transparent'
                }`}
              >
                <Icon className="w-4 h-4" />
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* Content */}
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.2 }}
        >
          {/* KNOWLEDGE BASE TAB */}
          {activeTab === 'knowledge' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold text-white">Spiritual Understandings Database</h2>
                <button className="flex items-center gap-2 px-4 py-2 bg-amber-500/20 text-amber-400 rounded-lg hover:bg-amber-500/30 transition-colors text-sm">
                  <Plus className="w-4 h-4" />
                  Add New
                </button>
              </div>

              <div className="space-y-4">
                {knowledgeItems.length === 0 && (
                  <div className="glass-card p-8 text-center text-slate-500">
                    <Brain className="w-10 h-10 mx-auto mb-3 opacity-40" />
                    <p>No knowledge base entries yet.</p>
                  </div>
                )}
                {knowledgeItems.map((item, index) => (
                  <motion.div
                    key={item.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className="glass-card p-6"
                  >
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <h3 className="text-white font-medium mb-1">{item.title}</h3>
                        <p className="text-sm text-slate-400">Topic: {item.topic}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className={`text-xs px-2 py-1 rounded ${
                          item.confidence_level === 'HIGH' ? 'bg-green-500/20 text-green-400' :
                          item.confidence_level === 'MEDIUM' ? 'bg-yellow-500/20 text-yellow-400' :
                          'bg-red-500/20 text-red-400'
                        }`}>
                          {item.confidence_level}
                        </span>
                        <button className="p-2 rounded-lg hover:bg-slate-700/50 transition-colors">
                          <Edit className="w-4 h-4 text-slate-400" />
                        </button>
                        <button className="p-2 rounded-lg hover:bg-red-500/20 transition-colors">
                          <Trash2 className="w-4 h-4 text-red-400" />
                        </button>
                      </div>
                    </div>
                    <p className="text-slate-300 text-sm leading-relaxed mb-4">
                      {item.content}
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {(item.supporting_verses || []).map(verse => (
                        <span key={verse} className="text-xs px-2 py-1 bg-slate-800/50 rounded text-slate-400">
                          {verse}
                        </span>
                      ))}
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          )}

          {/* MEDIA VAULT TAB */}
          {activeTab === 'media' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold text-white">Media Vault</h2>
                <div className="flex gap-2">
                  <input
                    type="file"
                    ref={fileInputRef}
                    className="hidden"
                    accept="image/*,video/*,.pdf"
                    onChange={(e) => e.target.files?.[0] && handleUpload(e.target.files[0])}
                  />
                  <button 
                    onClick={() => fileInputRef.current?.click()}
                    className="flex items-center gap-2 px-4 py-2 bg-slate-800/50 text-slate-300 rounded-lg hover:bg-slate-700/50 transition-colors text-sm"
                    disabled={isUploading}
                  >
                    {isUploading ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Uploading... {uploadProgress}%
                      </>
                    ) : (
                      <>
                        <Upload className="w-4 h-4" />
                        Upload
                      </>
                    )}
                  </button>
                  <button className="flex items-center gap-2 px-4 py-2 bg-amber-500/20 text-amber-400 rounded-lg hover:bg-amber-500/30 transition-colors text-sm">
                    <Plus className="w-4 h-4" />
                    Add Link
                  </button>
                </div>
              </div>

              {/* Upload Progress */}
              <AnimatePresence>
                {isUploading && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="glass-card p-4"
                  >
                    <div className="flex items-center gap-4">
                      <Loader2 className="w-6 h-6 text-amber-400 animate-spin" />
                      <div className="flex-1">
                        <div className="h-2 bg-slate-700 rounded-full overflow-hidden">
                          <motion.div
                            className="h-full bg-amber-500"
                            initial={{ width: 0 }}
                            animate={{ width: `${uploadProgress}%` }}
                          />
                        </div>
                      </div>
                      <span className="text-sm text-slate-400">{uploadProgress}%</span>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {mediaItems.length === 0 && (
                  <div className="col-span-3 glass-card p-8 text-center text-slate-500">
                    <Video className="w-10 h-10 mx-auto mb-3 opacity-40" />
                    <p>No media assets yet. Upload files or add links.</p>
                  </div>
                )}
                {mediaItems.map((media, index) => (
                  <motion.div
                    key={media.id}
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: index * 0.05 }}
                    className="glass-card p-4"
                  >
                    <div className="aspect-video bg-slate-800/50 rounded-lg mb-3 flex items-center justify-center relative group">
                      {media.type === 'video' ? (
                        <Video className="w-8 h-8 text-slate-600" />
                      ) : (
                        <ImageIcon className="w-8 h-8 text-slate-600" />
                      )}
                      <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                        <Eye className="w-6 h-6 text-white" />
                      </div>
                    </div>
                    <h4 className="text-white font-medium text-sm mb-1">{media.title}</h4>
                    <p className="text-xs text-slate-400 mb-3 line-clamp-2">{media.description}</p>
                    <div className="flex items-center justify-between">
                      <div className="flex flex-wrap gap-1">
                        {(media.topic_tags || []).slice(0, 2).map(tag => (
                          <span key={tag} className="text-xs px-1.5 py-0.5 bg-slate-800/50 rounded text-slate-500">
                            {tag}
                          </span>
                        ))}
                      </div>
                      <div className="flex gap-1">
                        <button className="p-1.5 rounded hover:bg-slate-700/50 transition-colors">
                          <Edit className="w-3.5 h-3.5 text-slate-400" />
                        </button>
                        <button className="p-1.5 rounded hover:bg-red-500/20 transition-colors">
                          <Trash2 className="w-3.5 h-3.5 text-red-400" />
                        </button>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          )}

          {/* TOPIC MAPPER TAB */}
          {activeTab === 'mapping' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-semibold text-white">Topic Mapper</h2>
                  <p className="text-sm text-slate-400 mt-1">Link YouTube videos and media to biblical verses/chapters</p>
                </div>
                <button className="flex items-center gap-2 px-4 py-2 bg-amber-500/20 text-amber-400 rounded-lg hover:bg-amber-500/30 transition-colors text-sm">
                  <Plus className="w-4 h-4" />
                  New Mapping
                </button>
              </div>

              {/* Existing Mappings */}
              <div className="space-y-4">
                {[
                  { topic: 'Alpha & Omega', media: 'Alpha and Omega: Father vs Son', verse: 'Rev 1:8' },
                  { topic: 'Soul (Nephesh)', media: 'Soul = Body + Breath', verse: 'Gen 2:7' },
                  { topic: 'Shema Unity', media: 'The Shema: Yahweh Echad', verse: 'Deut 6:4' },
                ].map((mapping, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.1 }}
                    className="glass-card p-4 flex items-center gap-4"
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-xs px-2 py-1 bg-amber-500/20 text-amber-400 rounded">
                          {mapping.topic}
                        </span>
                        <Link2 className="w-4 h-4 text-slate-500" />
                        <span className="text-xs px-2 py-1 bg-blue-500/20 text-blue-400 rounded">
                          {mapping.verse}
                        </span>
                      </div>
                      <p className="text-sm text-slate-300">{mapping.media}</p>
                    </div>
                    <div className="flex gap-2">
                      <button className="p-2 rounded-lg hover:bg-slate-700/50 transition-colors">
                        <Edit className="w-4 h-4 text-slate-400" />
                      </button>
                      <button className="p-2 rounded-lg hover:bg-red-500/20 transition-colors">
                        <Trash2 className="w-4 h-4 text-red-400" />
                      </button>
                    </div>
                  </motion.div>
                ))}
              </div>

              {/* Add Mapping Form */}
              <div className="glass-card p-6">
                <h3 className="text-white font-medium mb-4">Create New Mapping</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm text-slate-400 mb-2">Topic</label>
                    <select className="w-full px-4 py-2 bg-slate-800/50 border border-slate-700/50 rounded-lg text-slate-200 focus:outline-none focus:border-amber-500/50">
                      <option>Select topic...</option>
                      <option value="soul">Soul (Nephesh)</option>
                      <option value="trinity">Trinity</option>
                      <option value="alpha-omega">Alpha & Omega</option>
                      <option value="oneness">Oneness</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm text-slate-400 mb-2">Media Asset</label>
                    <select className="w-full px-4 py-2 bg-slate-800/50 border border-slate-700/50 rounded-lg text-slate-200 focus:outline-none focus:border-amber-500/50">
                      <option>Select media...</option>
                      {mediaItems.map(m => (
                        <option key={m.id} value={m.id}>{m.title}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm text-slate-400 mb-2">Verse Reference</label>
                    <input
                      type="text"
                      placeholder="e.g., Genesis 1:1"
                      className="w-full px-4 py-2 bg-slate-800/50 border border-slate-700/50 rounded-lg text-slate-200 placeholder-slate-500 focus:outline-none focus:border-amber-500/50"
                    />
                  </div>
                </div>
                <button className="mt-4 px-6 py-2 bg-amber-500/20 text-amber-400 rounded-lg hover:bg-amber-500/30 transition-colors text-sm">
                  Create Mapping
                </button>
              </div>
            </div>
          )}

          {/* DATA HEALTH TAB */}
          {activeTab === 'storage' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold text-white">Data Health Dashboard</h2>
                <button 
                  onClick={handleSync}
                  className="flex items-center gap-2 px-4 py-2 bg-cyan-500/20 text-cyan-400 rounded-lg hover:bg-cyan-500/30 transition-colors text-sm"
                >
                  <RefreshCw className={`w-4 h-4 ${isSyncing ? 'animate-spin' : ''}`} />
                  Refresh
                </button>
              </div>

              {/* Storage Usage */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="glass-card p-6">
                  <div className="flex items-center gap-3 mb-4">
                    <HardDrive className="w-6 h-6 text-cyan-400" />
                    <h3 className="text-white font-medium">Storage Usage</h3>
                  </div>
                  
                  {/* Progress Bar */}
                  <div className="relative mb-4">
                    <div className="h-4 bg-slate-800/50 rounded-full overflow-hidden">
                      <motion.div
                        className={`h-full ${storagePercentage > 80 ? 'bg-red-500' : storagePercentage > 60 ? 'bg-yellow-500' : 'bg-cyan-500'}`}
                        initial={{ width: 0 }}
                        animate={{ width: `${storagePercentage}%` }}
                        transition={{ duration: 1, delay: 0.2 }}
                      />
                    </div>
                    <AnimatePresence>
                      {storagePercentage > 80 && (
                        <motion.div
                          initial={{ opacity: 0, y: -10 }}
                          animate={{ opacity: 1, y: 0 }}
                          className="absolute -top-8 right-0 flex items-center gap-2 text-red-400 text-xs"
                        >
                          <AlertCircle className="w-4 h-4" />
                          Near capacity!
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>

                  <div className="flex justify-between text-sm">
                    <span className="text-slate-400">{storageUsedMB} MB used</span>
                    <span className="text-slate-400">{storageTotalMB} MB total</span>
                  </div>
                  <div className="mt-2 text-center">
                    <span className="text-2xl font-bold text-white">{storagePercentage.toFixed(1)}%</span>
                    <span className="text-sm text-slate-400 ml-2">utilized</span>
                  </div>
                </div>

                {/* Quick Stats */}
                <div className="glass-card p-6">
                  <h3 className="text-white font-medium mb-4">Quick Stats</h3>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-3 bg-slate-800/30 rounded-lg">
                      <div className="flex items-center gap-3">
                        <Database className="w-5 h-5 text-cyan-400" />
                        <span className="text-slate-300">Verses</span>
                      </div>
                      <span className="text-white font-medium">
                        {statsLoading ? '…' : (dbStats?.verses ?? 0).toLocaleString()}
                      </span>
                    </div>
                    <div className="flex items-center justify-between p-3 bg-slate-800/30 rounded-lg">
                      <div className="flex items-center gap-3">
                        <FileText className="w-5 h-5 text-amber-400" />
                        <span className="text-slate-300">Strong&apos;s Lexicon</span>
                      </div>
                      <span className="text-white font-medium">
                        {statsLoading ? '…' : (dbStats?.strongs ?? 0).toLocaleString()}
                      </span>
                    </div>
                    <div className="flex items-center justify-between p-3 bg-slate-800/30 rounded-lg">
                      <div className="flex items-center gap-3">
                        <Video className="w-5 h-5 text-red-400" />
                        <span className="text-slate-300">Hebrew Words (TAHOT)</span>
                      </div>
                      <span className="text-white font-medium">
                        {statsLoading ? '…' : (dbStats?.words ?? 0).toLocaleString()}
                      </span>
                    </div>
                    <div className="flex items-center justify-between p-3 bg-slate-800/30 rounded-lg">
                      <div className="flex items-center gap-3">
                        <ImageIcon className="w-5 h-5 text-purple-400" />
                        <span className="text-slate-300">Proper Names</span>
                      </div>
                      <span className="text-white font-medium">
                        {statsLoading ? '…' : (dbStats?.properNames ?? 0).toLocaleString()}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Free Tier Warnings */}
              <div className="glass-card p-6 border-yellow-500/30">
                <div className="flex items-start gap-4">
                  <AlertCircle className="w-6 h-6 text-yellow-400 flex-shrink-0 mt-0.5" />
                  <div>
                    <h3 className="text-white font-medium mb-2">Supabase Free Tier Limitations</h3>
                    <ul className="text-sm text-slate-400 space-y-1">
                      <li>• Database: 500MB storage limit (currently using {storageUsedMB}MB)</li>
                      <li>• Bandwidth: 5GB transfer/month</li>
                      <li>• Storage: 1GB limit in Vault bucket</li>
                      <li>• For production: Upgrade to Pro tier ($25/month)</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* SETTINGS TAB */}
          {activeTab === 'settings' && (
            <div className="max-w-2xl space-y-6">
              <div className="glass-card p-6">
                <h3 className="text-white font-medium mb-4">Supabase Configuration</h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm text-slate-400 mb-2">Project URL</label>
                    <input
                      type="text"
                      placeholder="https://xxxxx.supabase.co"
                      className="w-full px-4 py-2 bg-slate-800/50 border border-slate-700/50 rounded-lg text-slate-200 placeholder-slate-500 focus:outline-none focus:border-amber-500/50"
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-slate-400 mb-2">API Key</label>
                    <div className="relative">
                      <input
                        type="password"
                        placeholder="eyJhbGciOiJIUzI1NiIs..."
                        className="w-full px-4 py-2 bg-slate-800/50 border border-slate-700/50 rounded-lg text-slate-200 placeholder-slate-500 focus:outline-none focus:border-amber-500/50 pr-10"
                      />
                      <button className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300">
                        <EyeOff className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                  <button className="px-4 py-2 bg-cyan-500/20 text-cyan-400 rounded-lg hover:bg-cyan-500/30 transition-colors text-sm">
                    Test Connection
                  </button>
                </div>
              </div>

              <div className="glass-card p-6">
                <h3 className="text-white font-medium mb-4">Abacus AI Configuration</h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm text-slate-400 mb-2">API Endpoint</label>
                    <input
                      type="text"
                      placeholder="https://api.abacus.ai/v1..."
                      className="w-full px-4 py-2 bg-slate-800/50 border border-slate-700/50 rounded-lg text-slate-200 placeholder-slate-500 focus:outline-none focus:border-amber-500/50"
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-slate-400 mb-2">API Key</label>
                    <div className="relative">
                      <input
                        type="password"
                        placeholder="abacus_xxxxx..."
                        className="w-full px-4 py-2 bg-slate-800/50 border border-slate-700/50 rounded-lg text-slate-200 placeholder-slate-500 focus:outline-none focus:border-amber-500/50 pr-10"
                      />
                      <button className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300">
                        <EyeOff className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              <button className="w-full px-6 py-3 bg-green-500/20 text-green-400 rounded-lg hover:bg-green-500/30 transition-colors font-medium flex items-center justify-center gap-2">
                <Check className="w-5 h-5" />
                Save Settings
              </button>
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
}
