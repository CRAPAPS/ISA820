// ISA820 Mock Bible Data
import type { Bible, Verse, SpiritualUnderstanding, MediaAsset, ForensicCard } from '@/types';

export const BIBLES: Bible[] = [
  {
    id: 'tahot',
    name: 'The Ancient Hebrew Order of the Torah',
    version: 'TAHOT',
    language: 'English',
    description: 'A manuscript-first translation preserving Hebraic understanding',
    verseCount: 31102,
  },
  {
    id: 'tbesg',
    name: 'The Besorah of YAHUSHUA',
    version: 'TBESG',
    language: 'English',
    description: 'Restored HebraicRoots Besorah (Gospel)',
    verseCount: 7957,
  },
  {
    id: 'kjv',
    name: 'King James Version',
    version: 'KJV',
    language: 'English',
    description: 'Classic English translation (1769)',
    verseCount: 31102,
  },
];

// Sample verses with Voice Signatures
export const SAMPLE_VERSES: Verse[] = [
  {
    id: 'isa-8-20',
    book: 'Isaiah',
    chapter: 8,
    verse: 20,
    text: 'To the law and to the testimony! If they do not speak according to this word, it is because there is no light in them.',
    translation: 'TAHOT',
    strongs: [
      { word: 'law', strongsId: 'H8451', transliteration: 'towrah', definition: 'Instruction, teaching', usageCount: 220, position: { start: 3, end: 6 } },
      { word: 'testimony', strongsId: 'H5715', transliteration: 'edah', definition: 'Witness, testimony', usageCount: 68, position: { start: 11, end: 20 } },
    ],
    speaker: undefined,
    pillars: ['ISA820'],
  },
  {
    id: 'deut-6-4',
    book: 'Deuteronomy',
    chapter: 6,
    verse: 4,
    text: 'Hear, O Israel: Yahweh our Elohim, Yahweh is one.',
    translation: 'TAHOT',
    strongs: [
      { word: 'Hear', strongsId: 'H8085', transliteration: 'shama', definition: 'To hear, understand, obey', usageCount: 1161, position: { start: 0, end: 4 } },
      { word: 'one', strongsId: 'H259', transliteration: 'echad', definition: 'One, united, first', usageCount: 54, position: { start: 42, end: 45 } },
    ],
    speaker: undefined,
    pillars: ['DEUT64'],
  },
  {
    id: 'rev-1-8',
    book: 'Revelation',
    chapter: 1,
    verse: 8,
    text: 'I am the Alpha and the Omega, says Yahweh Elohim, who is and who was and who is to come, the Almighty.',
    translation: 'KJV',
    strongs: [
      { word: 'Alpha', strongsId: 'G1', transliteration: 'Alpha', definition: 'First letter of Greek alphabet', usageCount: 2, position: { start: 10, end: 15 } },
      { word: 'Omega', strongsId: 'G5598', transliteration: 'Omega', definition: 'Last letter of Greek alphabet', usageCount: 2, position: { start: 19, end: 24 } },
    ],
    speaker: 'FATHER',
    pillars: ['ISA820'],
  },
  {
    id: 'rev-1-17-18',
    book: 'Revelation',
    chapter: 1,
    verse: 17,
    text: 'And when I saw Him, I fell at His feet as dead. But He laid His right hand upon me, saying to me, Do not fear. I am the First and the Last, and the living One. And I became dead, and behold, I am living forever and ever. And I have the keys of death and of Hades.',
    translation: 'TBESG',
    strongs: [
      { word: 'First', strongsId: 'G4413', transliteration: 'protos', definition: 'First, chief, primary', usageCount: 93, position: { start: 87, end: 91 } },
      { word: 'Last', strongsId: 'G2078', transliteration: 'eschatos', definition: 'Last, final, end', usageCount: 34, position: { start: 96, end: 100 } },
    ],
    speaker: 'SON',
    pillars: ['ISA820'],
  },
  {
    id: 'gen-1-1',
    book: 'Genesis',
    chapter: 1,
    verse: 1,
    text: 'In the beginning Elohim created the heavens and the earth.',
    translation: 'TAHOT',
    strongs: [
      { word: 'Elohim', strongsId: 'H430', transliteration: 'elohim', definition: 'God, mighty ones', usageCount: 2606, position: { start: 18, end: 24 } },
      { word: 'created', strongsId: 'H1254', transliteration: 'bara', definition: 'To create, make, form', usageCount: 48, position: { start: 25, end: 32 } },
    ],
    pillars: ['NATURE'],
  },
  {
    id: 'gen-2-7',
    book: 'Genesis',
    chapter: 2,
    verse: 7,
    text: 'And Yahweh Elohim formed man of the dust of the ground, and breathed into his nostrils the breath of life; and man became a living soul.',
    translation: 'TAHOT',
    strongs: [
      { word: 'formed', strongsId: 'H3335', transliteration: 'yatsar', definition: 'To form, shape, fashion', usageCount: 27, position: { start: 18, end: 24 } },
      { word: 'breathed', strongsId: 'H5301', transliteration: 'naphach', definition: 'To breathe, blow', usageCount: 3, position: { start: 63, end: 71 } },
      { word: 'soul', strongsId: 'H5315', transliteration: 'nephesh', definition: 'Soul, self, life', usageCount: 754, position: { start: 127, end: 131 } },
    ],
    pillars: ['NATURE'],
  },
];

// Spiritual Understandings
export const SPIRITUAL_UNDERSTANDINGS: SpiritualUnderstanding[] = [
  {
    id: 'soul-definition',
    topic: 'soul',
    title: 'The Nature of Soul (Nephesh)',
    content: 'A soul (nephesh) is not an immortal spirit trapped in a body. Scripture reveals that a soul IS a living being - the combination of body (basar) and breath (neshamah). When breath returns to Elohim, the soul ceases to exist.',
    supportingVerses: ['Genesis 2:7', 'Ezekiel 18:4', 'Matthew 10:28'],
    confidenceLevel: 'HIGH',
    relatedTopics: ['spirit', 'breath', 'nephesh', 'immortality'],
  },
  {
    id: 'trinity-flaw',
    topic: 'trinity',
    title: 'The Trinity Doctrine vs Scripture',
    content: 'The Trinity is a post-biblical invention ( councils of Nicea 325 AD, Constantinople 381 AD). The Father is never called "God the Son." YAHUSHUA prayed to the Father, called His Father "my God," and stated the Father is "greater than all."',
    supportingVerses: ['John 20:17', '1 Corinthians 11:3', 'John 14:28'],
    confidenceLevel: 'HIGH',
    relatedTopics: ['godhead', 'oneness', 'deity of Christ', 'holy spirit'],
  },
  {
    id: 'alpha-omega-father',
    topic: 'alpha-omega',
    title: 'Alpha and Omega - Father Only',
    content: 'The Father declares "I am the Alpha and Omega" in Revelation 1:8. In 21:6, He says "I am the Alpha and Omega." The Son calls himself the "First and Last" (Rev 1:17, 2:8, 22:13) - a DIFFERENT title. Confusion of these titles leads to the false doctrine that the Son is the Father.',
    supportingVerses: ['Revelation 1:8', 'Revelation 21:6', 'Revelation 1:17', 'Revelation 2:8'],
    confidenceLevel: 'HIGH',
    relatedTopics: ['father', 'son', 'names of God', 'revelation'],
  },
  {
    id: 'oneness-deut',
    topic: 'oneness',
    title: 'Yahweh is One - Absolute Unity',
    content: 'Deuteronomy 6:4 is the Shema - the foundational confession of Israel. "Yahweh is one" (echad) means absolute unity, not a complex trinitarian math problem. There is ONE Being called Yahweh.',
    supportingVerses: ['Deuteronomy 6:4', 'Isaiah 43:10', 'Isaiah 44:6'],
    confidenceLevel: 'HIGH',
    relatedTopics: ['godhead', 'unity', 'yhwh', 'monotheism'],
  },
];

// Media Assets
export const MEDIA_ASSETS: MediaAsset[] = [
  {
    id: 'soul-formula',
    type: 'graphic',
    url: '/graphics/soul-formula.svg',
    title: 'Soul = Body + Breath',
    description: 'Visual representation of nephesh as the combination of basar (body/flesh) and neshamah (breath/spirit)',
    topicTags: ['soul', 'genesis', 'creation', 'nephesh'],
  },
  {
    id: 'godhead-chart',
    type: 'graphic',
    url: '/graphics/godhead-chart.svg',
    title: 'The Divine Family Structure',
    description: 'Biblical depiction of the Father, Son, and their unique relationship',
    topicTags: ['godhead', 'trinity', 'father', 'son'],
  },
  {
    id: 'alpha-omega-video',
    type: 'video',
    url: 'https://youtube.com/watch?v=example',
    youtubeId: 'dQw4w9WgXcQ',
    title: 'Alpha and Omega: Father vs Son',
    description: 'Forensic analysis of the different titles and their speakers in Revelation',
    topicTags: ['alpha', 'omega', 'revelation', 'father', 'son'],
  },
  {
    id: 'deut-6-4-video',
    type: 'video',
    url: 'https://youtube.com/watch?v=example2',
    youtubeId: 'dQw4w9WgXcQ',
    title: 'The Shema: Yahweh Echad',
    description: 'Understanding absolute unity from the Hebrew perspective',
    topicTags: ['deuteronomy', 'shema', 'unity', 'oneness'],
  },
];

// Generate forensic cards based on topic
export function getForensicCardsForTopic(topic: string): ForensicCard[] {
  const cards: ForensicCard[] = [];
  
  // Find related understandings
  const understandings = SPIRITUAL_UNDERSTANDINGS.filter(
    u => u.topic.toLowerCase().includes(topic.toLowerCase()) ||
         u.relatedTopics.some(t => t.toLowerCase().includes(topic.toLowerCase()))
  );
  
  understandings.forEach(u => {
    cards.push({
      id: `understanding-${u.id}`,
      type: 'understanding',
      title: u.title,
      content: u.content,
      topics: [u.topic, ...u.relatedTopics],
    });
  });
  
  // Find related media
  const media = MEDIA_ASSETS.filter(m => 
    m.topicTags.some(t => t.toLowerCase().includes(topic.toLowerCase()))
  );
  
  media.forEach(m => {
    cards.push({
      id: `media-${m.id}`,
      type: m.type === 'video' ? 'video' : 'graphic',
      title: m.title,
      content: m.description,
      mediaUrl: m.url,
      youtubeId: m.youtubeId,
      topics: m.topicTags,
    });
  });
  
  // Add related verses
  SAMPLE_VERSES.forEach(v => {
    if (v.book.toLowerCase().includes(topic.toLowerCase()) ||
        v.strongs.some(s => s.word.toLowerCase().includes(topic.toLowerCase()))) {
      cards.push({
        id: `verse-${v.id}`,
        type: 'verse',
        title: `${v.book} ${v.chapter}:${v.verse}`,
        content: v.text,
        verseReference: `${v.book} ${v.chapter}:${v.verse}`,
        topics: ['verse'],
      });
    }
  });
  
  return cards;
}

// Get Strong's usage trace
export function getUsageTrace(strongsId: string): { reference: string; context: string; similarity: number }[] {
  // Mock usage trace data
  return SAMPLE_VERSES
    .filter(v => v.strongs.some(s => s.strongsId === strongsId))
    .map(v => ({
      reference: `${v.book} ${v.chapter}:${v.verse}`,
      context: v.text.substring(0, 100) + '...',
      similarity: 0.95,
    }));
}
