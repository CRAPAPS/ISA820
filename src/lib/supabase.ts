// ISA820 Supabase Client Configuration
// This client is configured to work with placeholder credentials.
// Replace NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY
// with your actual Supabase project credentials.

import { createClient } from '@supabase/supabase-js';

// Type definitions for Supabase tables
export type VoiceSpeaker = 'FATHER' | 'SON' | 'ANGEL' | 'UNKNOWN';

export interface Verse {
  id: string;
  book: string;
  chapter: number;
  verse: number;
  text: string;
  translation: 'TAHOT' | 'TBESG' | 'KJV' | 'STEP';
  speaker: VoiceSpeaker | null;
  strongs_numbers: string[];
  word_strongs: Array<{ t: string; s?: string }> | null;
  pillar_tags: string[];
  translations_jsonb: Record<string, string> | null;
  created_at: string;
  updated_at: string;
}

export interface StrongNumber {
  id: string;
  strongs_id: string;
  word: string;
  transliteration: string;
  definition: string;
  part_of_speech: string;
  origin_language: 'hebrew' | 'greek';
  pronunciation_guide: string | null;
  usage_count: number;
  created_at: string;
}

export interface StrongUsage {
  id: string;
  strongs_id: string;
  verse_id: string;
  word: string;
  context: string;
  similarity_score: number;
  created_at: string;
}

export interface SpiritualUnderstanding {
  id: string;
  topic: string;
  title: string;
  content: string;
  supporting_verses: string[];
  confidence_level: 'HIGH' | 'MEDIUM' | 'LOW';
  related_topics: string[];
  created_at: string;
  updated_at: string;
}

export interface MediaAsset {
  id: string;
  type: 'video' | 'image' | 'graphic' | 'document';
  title: string;
  description: string;
  url: string;
  storage_path: string | null;
  youtube_id: string | null;
  topic_tags: string[];
  verse_references: string[];
  created_at: string;
  updated_at: string;
}

export interface TopicMapping {
  id: string;
  topic: string;
  media_id: string;
  verse_reference: string | null;
  chapter_reference: string | null;
  display_order: number;
  created_at: string;
}

export interface StandardDocument {
  id: string;
  title: string;
  description: string;
  file_path: string;
  file_type: string;
  file_size: number;
  category: 'standard' | 'graphic' | 'research';
  created_at: string;
  updated_at: string;
}

export interface StorageUsage {
  id: string;
  bucket_name: string;
  total_bytes: number;
  file_count: number;
  last_updated: string;
}

// Create Supabase client with environment variables
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder-anon-key';

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
  },
});

// Helper to check if Supabase is configured with real credentials
export const isSupabaseConfigured = (): boolean => {
  return (
    supabaseUrl.startsWith('https://') &&
    supabaseUrl !== 'https://placeholder.supabase.co' &&
    supabaseAnonKey.length > 50 // Real keys are JWTs
  );
};

// Project reference for display
export const supabaseProjectRef = supabaseUrl.split('.supabase.co')[0].replace('https://', '');

export default supabase;
