// ISA820 Zustand Store
import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';
import type { 
  PillarState, 
  SidebarState, 
  StrongsPanelState, 
  NatureManifestation,
  ForensicCard,
  StrongNumber,
  UsageTrace,
  Verse
} from '@/types';

interface PassageLocation {
  book: string;
  chapter: number;
  verse?: number;
}

type SpeakerFilter = 'ALL' | 'FATHER' | 'SON' | 'ANGEL';

interface ISA820Store {
  // Pillar State
  pillar: PillarState;
  setNatureManifestation: (nature: NatureManifestation) => void;
  triggerPillarPulse: (pillar: 'isa820' | 'deut64' | 'nature') => void;

  // Speaker Filter
  speakerFilter: SpeakerFilter;
  setSpeakerFilter: (filter: SpeakerFilter) => void;
  
  // Sidebar State
  sidebar: SidebarState;
  toggleSidebar: () => void;
  setCurrentTopic: (topic: string | null) => void;
  setForensicCards: (cards: ForensicCard[]) => void;
  setSidebarLoading: (loading: boolean) => void;
  openSidebarForVerse: (verse: Verse) => void;
  
  // Strongs Panel State
  strongs: StrongsPanelState;
  openStrongsPanel: (word: StrongNumber) => void;
  closeStrongsPanel: () => void;
  setUsageTrace: (trace: UsageTrace[]) => void;
  
  // Bible Reader State
  currentTranslation: string;
  secondaryTranslation: string;
  setTranslation: (translation: string) => void;
  setSecondaryTranslation: (translation: string) => void;
  selectedVerses: string[];
  toggleVerseSelection: (verseId: string) => void;
  clearSelection: () => void;
  
  // Parallel Mode
  isParallelMode: boolean;
  toggleParallelMode: () => void;
  
  // Passage Navigation
  currentPassage: PassageLocation | null;
  setCurrentPassage: (passage: PassageLocation | null) => void;
  
  // Admin State
  isAdminMode: boolean;
  toggleAdminMode: () => void;
}

export const useISA820Store = create<ISA820Store>()(
  subscribeWithSelector((set, get) => ({
    // Pillar State
    pillar: {
      isa820: true,
      deut64: true,
      nature: 'LIGHT',
      isPulsing: {
        isa820: false,
        deut64: false,
        nature: false,
      },
    },
    
    setNatureManifestation: (nature) => 
      set((state) => ({
        pillar: { ...state.pillar, nature },
      })),
    
    triggerPillarPulse: (pillar) => {
      set((state) => ({
        pillar: {
          ...state.pillar,
          isPulsing: { ...state.pillar.isPulsing, [pillar]: true },
        },
      }));
      setTimeout(() => {
        set((state) => ({
          pillar: {
            ...state.pillar,
            isPulsing: { ...state.pillar.isPulsing, [pillar]: false },
          },
        }));
      }, 2000);
    },

    speakerFilter: 'ALL',
    setSpeakerFilter: (filter) => set({ speakerFilter: filter }),
    
    // Sidebar State
    sidebar: {
      isOpen: true,
      currentTopic: null,
      forensicCards: [],
      isLoading: false,
      selectedVerseForAnalysis: null,
    },
    
    toggleSidebar: () =>
      set((state) => ({
        sidebar: { ...state.sidebar, isOpen: !state.sidebar.isOpen },
      })),
    
    setCurrentTopic: (topic) =>
      set((state) => ({
        sidebar: { ...state.sidebar, currentTopic: topic },
      })),
    
    setForensicCards: (cards) =>
      set((state) => ({
        sidebar: { ...state.sidebar, forensicCards: cards },
      })),
    
    setSidebarLoading: (loading) =>
      set((state) => ({
        sidebar: { ...state.sidebar, isLoading: loading },
      })),

    openSidebarForVerse: (verse) => {
      // Extract topic from verse book or strongs
      const topic = verse.book.toLowerCase();
      
      set((state) => ({
        sidebar: { 
          ...state.sidebar, 
          isOpen: true,
          currentTopic: topic,
          selectedVerseForAnalysis: verse,
        },
      }));
      
      // Trigger pillar based on verse pillars
      if (verse.pillars.includes('ISA820')) {
        get().triggerPillarPulse('isa820');
      }
      if (verse.pillars.includes('DEUT64')) {
        get().triggerPillarPulse('deut64');
      }
    },
    
    // Strongs Panel State
    strongs: {
      isOpen: false,
      currentWord: null,
      usageTrace: [],
      definition: '',
    },
    
    openStrongsPanel: (word) =>
      set({
        strongs: {
          isOpen: true,
          currentWord: word,
          usageTrace: [],
          definition: word.definition,
        },
      }),
    
    closeStrongsPanel: () =>
      set({
        strongs: {
          isOpen: false,
          currentWord: null,
          usageTrace: [],
          definition: '',
        },
      }),
    
    setUsageTrace: (trace) =>
      set((state) => ({
        strongs: { ...state.strongs, usageTrace: trace },
      })),
    
    // Bible Reader State
    currentTranslation: 'KJV',
    secondaryTranslation: 'TAHOT',
    setTranslation: (translation) =>
      set({ currentTranslation: translation }),
    
    setSecondaryTranslation: (translation) =>
      set({ secondaryTranslation: translation }),
    
    selectedVerses: [],
    toggleVerseSelection: (verseId) =>
      set((state) => ({
        selectedVerses: state.selectedVerses.includes(verseId)
          ? state.selectedVerses.filter((id) => id !== verseId)
          : [...state.selectedVerses, verseId],
      })),
    clearSelection: () => set({ selectedVerses: [] }),
    
    // Parallel Mode
    isParallelMode: false,
    toggleParallelMode: () => set((state) => ({ isParallelMode: !state.isParallelMode })),
    
    // Passage Navigation
    currentPassage: null,
    setCurrentPassage: (passage) => set({ currentPassage: passage }),
    
    // Admin State
    isAdminMode: false,
    toggleAdminMode: () => set((state) => ({ isAdminMode: !state.isAdminMode })),
  }))
);
