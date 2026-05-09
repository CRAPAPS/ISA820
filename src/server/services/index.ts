// ISA820 Service Layer - API Bridge to Supabase
// Handles all data fetching operations

import { supabase, isSupabaseConfigured, type Verse, type SpiritualUnderstanding, type MediaAsset, type StrongNumber, type StrongUsage } from '@/lib/supabase';

// ============================================
// SCRIPTURE SERVICE - Bible Verses & Translations
// ============================================

export const scriptureService = {
  /**
   * Fetch verses by book and chapter
   */
  async getVerses(book: string, chapter: number, translation?: string): Promise<Verse[]> {
    if (!isSupabaseConfigured()) {
      console.log('Supabase not configured, using mock data');
      return [];
    }

    let query = supabase
      .from('verses')
      .select('*')
      .eq('book', book)
      .eq('chapter', chapter)
      .order('verse', { ascending: true });

    if (translation) {
      query = query.eq('translation', translation);
    }

    const { data, error } = await query;
    
    if (error) {
      console.error('Error fetching verses:', error.message, error.code, error.details);
      throw error;
    }
    
    return data || [];
  },

  /**
   * Fetch a single verse by reference
   */
  async getVerse(book: string, chapter: number, verse: number, translation?: string): Promise<Verse | null> {
    if (!isSupabaseConfigured()) return null;

    let query = supabase
      .from('verses')
      .select('*')
      .eq('book', book)
      .eq('chapter', chapter)
      .eq('verse', verse);

    if (translation) {
      query = query.eq('translation', translation);
    }

    const { data, error } = await query.single();
    
    if (error) {
      console.error('Error fetching verse:', error);
      return null;
    }
    
    return data;
  },

  /**
   * Fetch parallel translations for a verse
   */
  async getParallelTranslations(book: string, chapter: number, verse: number): Promise<Record<string, string>> {
    if (!isSupabaseConfigured()) return {};

    const { data, error } = await supabase
      .from('verses')
      .select('translation, text')
      .eq('book', book)
      .eq('chapter', chapter)
      .eq('verse', verse);

    if (error) {
      console.error('Error fetching parallel translations:', error);
      return {};
    }

    // Convert to { translation: text } map
    return (data || []).reduce((acc, v) => {
      acc[v.translation] = v.text;
      return acc;
    }, {} as Record<string, string>);
  },

  /**
   * Search verses by text content
   */
  async searchVerses(query: string, limit = 20): Promise<Verse[]> {
    if (!isSupabaseConfigured()) return [];

    const { data, error } = await supabase
      .from('verses')
      .select('*')
      .ilike('text', `%${query}%`)
      .limit(limit);

    if (error) {
      console.error('Error searching verses:', error);
      return [];
    }
    
    return data || [];
  },

  /**
   * Get books list
   */
  async getBooks(): Promise<string[]> {
    if (!isSupabaseConfigured()) return [];

    const { data, error } = await supabase
      .from('verses')
      .select('book')
      .order('book');

    if (error) {
      console.error('Error fetching books:', error);
      return [];
    }

    // Get unique books
    return [...new Set((data || []).map(v => v.book))];
  },
};

// ============================================
// VAULT SERVICE - Standard Documents & Media
// ============================================

export const vaultService = {
  /**
   * Fetch all media assets
   */
  async getMediaAssets(type?: 'video' | 'image' | 'graphic' | 'document'): Promise<MediaAsset[]> {
    if (!isSupabaseConfigured()) return [];

    let query = supabase
      .from('media_assets')
      .select('*')
      .order('created_at', { ascending: false });

    if (type) {
      query = query.eq('type', type);
    }

    const { data, error } = await query;
    
    if (error) {
      console.error('Error fetching media assets:', error);
      return [];
    }
    
    return data || [];
  },

  /**
   * Fetch media by topic
   */
  async getMediaByTopic(topic: string): Promise<MediaAsset[]> {
    if (!isSupabaseConfigured()) return [];

    const { data, error } = await supabase
      .from('media_assets')
      .select('*')
      .contains('topic_tags', [topic.toLowerCase()])
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching media by topic:', error);
      return [];
    }
    
    return data || [];
  },

  /**
   * Upload media to Supabase Storage
   */
  async uploadMedia(
    file: File,
    bucket: 'documents' | 'graphics' | 'videos',
    metadata: { title: string; description: string; topicTags: string[] }
  ): Promise<{ url: string; path: string } | null> {
    if (!isSupabaseConfigured()) return null;

    const fileExt = file.name.split('.').pop();
    const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
    const filePath = `${bucket}/${fileName}`;

    const { data, error } = await supabase.storage
      .from('vault')
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: false,
      });

    if (error) {
      console.error('Error uploading file:', error);
      return null;
    }

    // Get public URL
    const { data: urlData } = supabase.storage
      .from('vault')
      .getPublicUrl(filePath);

    // Insert metadata record
    await supabase.from('media_assets').insert({
      type: bucket === 'videos' ? 'video' : bucket === 'graphics' ? 'graphic' : 'document',
      title: metadata.title,
      description: metadata.description,
      url: urlData.publicUrl,
      storage_path: filePath,
      topic_tags: metadata.topicTags,
    });

    return { url: urlData.publicUrl, path: filePath };
  },

  /**
   * Delete media asset
   */
  async deleteMedia(id: string, storagePath: string): Promise<boolean> {
    if (!isSupabaseConfigured()) return false;

    // Delete from storage
    const { error: storageError } = await supabase.storage
      .from('vault')
      .remove([storagePath]);

    if (storageError) {
      console.error('Error deleting from storage:', storageError);
    }

    // Delete metadata
    const { error: dbError } = await supabase
      .from('media_assets')
      .delete()
      .eq('id', id);

    if (dbError) {
      console.error('Error deleting media record:', dbError);
      return false;
    }

    return true;
  },

  /**
   * Get storage usage stats
   */
  async getStorageUsage(): Promise<{ used: number; total: number; percentage: number }> {
    if (!isSupabaseConfigured()) {
      // Return mock data for demo
      return { used: 234 * 1024 * 1024, total: 512 * 1024 * 1024, percentage: 45.7 };
    }

    const { data, error } = await supabase.storage.getBucket('vault');
    
    if (error) {
      console.error('Error fetching storage info:', error);
      return { used: 0, total: 512 * 1024 * 1024, percentage: 0 };
    }

    // Note: Supabase doesn't provide direct storage usage in free tier
    // You'd need to use storage.list() and calculate manually
    return { used: 0, total: 512 * 1024 * 1024, percentage: 0 };
  },
};

// ============================================
// STRONGS SERVICE - Lexicon & Word Analysis
// ============================================

export const strongsService = {
  /**
   * Get Strong's definition for a word
   */
  async getDefinition(strongsId: string): Promise<StrongNumber | null> {
    if (!isSupabaseConfigured()) return null;

    const { data, error } = await supabase
      .from('strongs_lexicon')
      .select('*')
      .eq('strongs_id', strongsId)
      .single();

    if (error) {
      console.error('Error fetching Strong\'s definition:', error);
      return null;
    }
    
    return data;
  },

  /**
   * Get usage trace across manuscripts
   */
  async getUsageTrace(strongsId: string): Promise<StrongUsage[]> {
    if (!isSupabaseConfigured()) return [];

    const { data, error } = await supabase
      .from('strongs_usage')
      .select(`
        *,
        verses:verse_id (book, chapter, verse, text, translation)
      `)
      .eq('strongs_id', strongsId)
      .order('similarity_score', { ascending: false })
      .limit(20);

    if (error) {
      console.error('Error fetching usage trace:', error);
      return [];
    }
    
    return data || [];
  },

  /**
   * Search lexicon by word
   */
  async searchLexicon(query: string): Promise<StrongNumber[]> {
    if (!isSupabaseConfigured()) return [];

    const { data, error } = await supabase
      .from('strongs_lexicon')
      .select('*')
      .or(`word.ilike.%${query}%,transliteration.ilike.%${query}%`)
      .limit(20);

    if (error) {
      console.error('Error searching lexicon:', error);
      return [];
    }
    
    return data || [];
  },
};

// ============================================
// KNOWLEDGE BASE SERVICE - AI Insights & Rebuttals
// ============================================

export const knowledgeService = {
  /**
   * Get spiritual understanding by topic
   */
  async getUnderstanding(topic: string): Promise<SpiritualUnderstanding | null> {
    if (!isSupabaseConfigured()) return null;

    const { data, error } = await supabase
      .from('knowledge_base')
      .select('*')
      .eq('topic', topic.toLowerCase())
      .single();

    if (error) {
      console.error('Error fetching understanding:', error);
      return null;
    }
    
    return data;
  },

  /**
   * Get all topics
   */
  async getAllTopics(): Promise<string[]> {
    if (!isSupabaseConfigured()) return [];

    const { data, error } = await supabase
      .from('knowledge_base')
      .select('topic');

    if (error) {
      console.error('Error fetching topics:', error);
      return [];
    }
    
    return (data || []).map(d => d.topic);
  },

  /**
   * Search knowledge base
   */
  async searchKnowledge(query: string): Promise<SpiritualUnderstanding[]> {
    if (!isSupabaseConfigured()) return [];

    const { data, error } = await supabase
      .from('knowledge_base')
      .select('*')
      .or(`topic.ilike.%${query}%,title.ilike.%${query}%,content.ilike.%${query}%`)
      .limit(10);

    if (error) {
      console.error('Error searching knowledge base:', error);
      return [];
    }
    
    return data || [];
  },

  /**
   * Create or update understanding
   */
  async upsertUnderstanding(understanding: Omit<SpiritualUnderstanding, 'id' | 'created_at' | 'updated_at'>): Promise<SpiritualUnderstanding | null> {
    if (!isSupabaseConfigured()) return null;

    const { data, error } = await supabase
      .from('knowledge_base')
      .upsert({
        topic: understanding.topic.toLowerCase(),
        title: understanding.title,
        content: understanding.content,
        supporting_verses: understanding.supporting_verses,
        confidence_level: understanding.confidence_level,
        related_topics: understanding.related_topics,
      })
      .select()
      .single();

    if (error) {
      console.error('Error upserting understanding:', error);
      return null;
    }
    
    return data;
  },

  /**
   * Delete understanding
   */
  async deleteUnderstanding(id: string): Promise<boolean> {
    if (!isSupabaseConfigured()) return false;

    const { error } = await supabase
      .from('knowledge_base')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting understanding:', error);
      return false;
    }
    
    return true;
  },
};

// ============================================
// TOPIC MAPPING SERVICE - Verse to Media Links
// ============================================

export const topicMappingService = {
  /**
   * Get topic mappings
   */
  async getMappings(topic: string): Promise<{ verse_reference: string; media_id: string }[]> {
    if (!isSupabaseConfigured()) return [];

    const { data, error } = await supabase
      .from('topic_mappings')
      .select('verse_reference, media_id')
      .eq('topic', topic.toLowerCase())
      .order('display_order');

    if (error) {
      console.error('Error fetching mappings:', error);
      return [];
    }
    
    return (data || []).map(d => ({ verse_reference: d.verse_reference, media_id: d.media_id }));
  },

  /**
   * Create topic mapping
   */
  async createMapping(mapping: {
    topic: string;
    media_id: string;
    verse_reference?: string;
    chapter_reference?: string;
    display_order?: number;
  }): Promise<boolean> {
    if (!isSupabaseConfigured()) return false;

    const { error } = await supabase
      .from('topic_mappings')
      .insert({
        topic: mapping.topic.toLowerCase(),
        media_id: mapping.media_id,
        verse_reference: mapping.verse_reference,
        chapter_reference: mapping.chapter_reference,
        display_order: mapping.display_order || 0,
      });

    if (error) {
      console.error('Error creating mapping:', error);
      return false;
    }
    
    return true;
  },
};
