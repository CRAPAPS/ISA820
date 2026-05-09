// ISA820 Type Definitions

export type VoiceSpeaker = 'FATHER' | 'SON' | 'ANGEL' | 'UNKNOWN';

export type PillarType = 'ISA820' | 'DEUT64' | 'NATURE';

export type NatureManifestation = 'FIRE' | 'WHISPER' | 'LIGHT';

export interface Verse {
  id: string;
  book: string;
  chapter: number;
  verse: number;
  text: string;
  translation: string;
  strongs: StrongNumber[];
  speaker?: VoiceSpeaker;
  pillars: PillarType[];
}

export interface StrongNumber {
  word: string;
  strongsId: string;
  transliteration: string;
  definition: string;
  usageCount: number;
  position: { start: number; end: number };
}

export interface Bible {
  id: string;
  name: string;
  version: string;
  language: string;
  description: string;
  verseCount: number;
}

export interface SpiritualUnderstanding {
  id: string;
  topic: string;
  title: string;
  content: string;
  supportingVerses: string[];
  confidenceLevel: 'HIGH' | 'MEDIUM' | 'LOW';
  relatedTopics: string[];
}

export interface MediaAsset {
  id: string;
  type: 'video' | 'image' | 'graphic';
  url: string;
  title: string;
  description: string;
  topicTags: string[];
  youtubeId?: string;
}

export interface ForensicCard {
  id: string;
  type: 'verse' | 'graphic' | 'video' | 'understanding';
  title: string;
  content: string;
  verseReference?: string;
  mediaUrl?: string;
  youtubeId?: string;
  topics: string[];
}

export interface PillarState {
  isa820: boolean;
  deut64: boolean;
  nature: NatureManifestation;
  isPulsing: {
    isa820: boolean;
    deut64: boolean;
    nature: boolean;
  };
}

export interface SidebarState {
  isOpen: boolean;
  currentTopic: string | null;
  forensicCards: ForensicCard[];
  isLoading: boolean;
  selectedVerseForAnalysis: Verse | null;
}

export interface StrongsPanelState {
  isOpen: boolean;
  currentWord: StrongNumber | null;
  usageTrace: UsageTrace[];
  definition: string;
}

export interface UsageTrace {
  reference: string;
  book: string;
  chapter: number;
  verse: number;
  context: string;
  similarity: number;
}

export interface SearchResult {
  type: 'verse' | 'topic' | 'understanding';
  id: string;
  title: string;
  excerpt: string;
  relevance: number;
  reference?: string;
}

// Tooltip spiritual logic content
export interface TooltipContent {
  title: string;
  description: string;
  spiritualLogic: string;
  verseReference?: string;
}
