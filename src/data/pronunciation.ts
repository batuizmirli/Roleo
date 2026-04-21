export type PronunciationCategory = 'letters' | 'words' | 'numbers';

export type WordTopic =
  | 'basics'
  | 'animals'
  | 'fruits'
  | 'nature'
  | 'aviation'
  | 'conversation'
  | 'travel'
  | 'food';

export type NumberRange = '0-100' | '101-200' | '201-300' | '301-400';

export type PronunciationItem = {
  id: string;
  text: string;
  meaning: string;
  speakText?: string;
};

type WordEntry = {
  text: string;
  meaningEn: string;
  meaningTr: string;
};

const SPEECH_LOCALES: Record<string, string> = {
  en: 'en-US',
  es: 'es-ES',
  fr: 'fr-FR',
  de: 'de-DE',
  it: 'it-IT',
  pt: 'pt-PT',
};

const TOPIC_TITLES: Record<WordTopic, { tr: string; en: string }> = {
  basics: { tr: 'Temel', en: 'Basics' },
  animals: { tr: 'Hayvanlar', en: 'Animals' },
  fruits: { tr: 'Meyveler', en: 'Fruits' },
  nature: { tr: 'Doğa', en: 'Nature' },
  aviation: { tr: 'Havacılık', en: 'Aviation' },
  conversation: { tr: 'Sohbet', en: 'Conversation' },
  travel: { tr: 'Seyahat', en: 'Travel' },
  food: { tr: 'Yemek', en: 'Food' },
};

const WORDS_BY_TOPIC: Record<WordTopic, WordEntry[]> = {
  basics: [
    { text: 'hello', meaningEn: 'hello', meaningTr: 'merhaba' },
    { text: 'goodbye', meaningEn: 'goodbye', meaningTr: 'hoşça kal' },
    { text: 'please', meaningEn: 'please', meaningTr: 'lütfen' },
    { text: 'thank you', meaningEn: 'thank you', meaningTr: 'teşekkür ederim' },
    { text: 'sorry', meaningEn: 'sorry', meaningTr: 'üzgünüm' },
    { text: 'yes', meaningEn: 'yes', meaningTr: 'evet' },
    { text: 'no', meaningEn: 'no', meaningTr: 'hayır' },
    { text: 'today', meaningEn: 'today', meaningTr: 'bugün' },
    { text: 'tomorrow', meaningEn: 'tomorrow', meaningTr: 'yarın' },
    { text: 'friend', meaningEn: 'friend', meaningTr: 'arkadaş' },
  ],
  animals: [
    { text: 'cat', meaningEn: 'cat', meaningTr: 'kedi' },
    { text: 'dog', meaningEn: 'dog', meaningTr: 'köpek' },
    { text: 'bird', meaningEn: 'bird', meaningTr: 'kuş' },
    { text: 'fish', meaningEn: 'fish', meaningTr: 'balık' },
    { text: 'horse', meaningEn: 'horse', meaningTr: 'at' },
    { text: 'cow', meaningEn: 'cow', meaningTr: 'inek' },
    { text: 'sheep', meaningEn: 'sheep', meaningTr: 'koyun' },
    { text: 'rabbit', meaningEn: 'rabbit', meaningTr: 'tavşan' },
    { text: 'lion', meaningEn: 'lion', meaningTr: 'aslan' },
    { text: 'turtle', meaningEn: 'turtle', meaningTr: 'kaplumbağa' },
  ],
  fruits: [
    { text: 'apple', meaningEn: 'apple', meaningTr: 'elma' },
    { text: 'banana', meaningEn: 'banana', meaningTr: 'muz' },
    { text: 'orange', meaningEn: 'orange', meaningTr: 'portakal' },
    { text: 'strawberry', meaningEn: 'strawberry', meaningTr: 'çilek' },
    { text: 'grape', meaningEn: 'grape', meaningTr: 'üzüm' },
    { text: 'cherry', meaningEn: 'cherry', meaningTr: 'kiraz' },
    { text: 'peach', meaningEn: 'peach', meaningTr: 'şeftali' },
    { text: 'pear', meaningEn: 'pear', meaningTr: 'armut' },
    { text: 'watermelon', meaningEn: 'watermelon', meaningTr: 'karpuz' },
    { text: 'lemon', meaningEn: 'lemon', meaningTr: 'limon' },
  ],
  nature: [
    { text: 'tree', meaningEn: 'tree', meaningTr: 'ağaç' },
    { text: 'flower', meaningEn: 'flower', meaningTr: 'çiçek' },
    { text: 'leaf', meaningEn: 'leaf', meaningTr: 'yaprak' },
    { text: 'river', meaningEn: 'river', meaningTr: 'nehir' },
    { text: 'mountain', meaningEn: 'mountain', meaningTr: 'dağ' },
    { text: 'sea', meaningEn: 'sea', meaningTr: 'deniz' },
    { text: 'rain', meaningEn: 'rain', meaningTr: 'yağmur' },
    { text: 'snow', meaningEn: 'snow', meaningTr: 'kar' },
    { text: 'wind', meaningEn: 'wind', meaningTr: 'rüzgar' },
    { text: 'sun', meaningEn: 'sun', meaningTr: 'güneş' },
  ],
  aviation: [
    { text: 'airplane', meaningEn: 'airplane', meaningTr: 'uçak' },
    { text: 'airport', meaningEn: 'airport', meaningTr: 'havalimanı' },
    { text: 'pilot', meaningEn: 'pilot', meaningTr: 'pilot' },
    { text: 'runway', meaningEn: 'runway', meaningTr: 'pist' },
    { text: 'ticket', meaningEn: 'ticket', meaningTr: 'bilet' },
    { text: 'boarding', meaningEn: 'boarding', meaningTr: 'uçağa biniş' },
    { text: 'passport', meaningEn: 'passport', meaningTr: 'pasaport' },
    { text: 'luggage', meaningEn: 'luggage', meaningTr: 'bagaj' },
    { text: 'gate', meaningEn: 'gate', meaningTr: 'kapı' },
    { text: 'departure', meaningEn: 'departure', meaningTr: 'kalkış' },
  ],
  conversation: [
    { text: 'how are you', meaningEn: 'how are you', meaningTr: 'nasılsın' },
    { text: 'my name is', meaningEn: 'my name is', meaningTr: 'benim adım' },
    { text: 'nice to meet you', meaningEn: 'nice to meet you', meaningTr: 'tanıştığıma memnun oldum' },
    { text: 'where are you from', meaningEn: 'where are you from', meaningTr: 'nerelisin' },
    { text: 'what do you do', meaningEn: 'what do you do', meaningTr: 'ne iş yapıyorsun' },
    { text: 'can you help me', meaningEn: 'can you help me', meaningTr: 'bana yardım eder misin' },
    { text: 'i understand', meaningEn: 'i understand', meaningTr: 'anlıyorum' },
    { text: 'i do not understand', meaningEn: 'i do not understand', meaningTr: 'anlamıyorum' },
    { text: 'speak slowly', meaningEn: 'speak slowly', meaningTr: 'yavaş konuş' },
    { text: 'see you later', meaningEn: 'see you later', meaningTr: 'sonra görüşürüz' },
  ],
  travel: [
    { text: 'hotel', meaningEn: 'hotel', meaningTr: 'otel' },
    { text: 'reservation', meaningEn: 'reservation', meaningTr: 'rezervasyon' },
    { text: 'taxi', meaningEn: 'taxi', meaningTr: 'taksi' },
    { text: 'station', meaningEn: 'station', meaningTr: 'istasyon' },
    { text: 'map', meaningEn: 'map', meaningTr: 'harita' },
    { text: 'museum', meaningEn: 'museum', meaningTr: 'müze' },
    { text: 'street', meaningEn: 'street', meaningTr: 'cadde' },
    { text: 'left', meaningEn: 'left', meaningTr: 'sol' },
    { text: 'right', meaningEn: 'right', meaningTr: 'sağ' },
    { text: 'straight', meaningEn: 'straight', meaningTr: 'düz' },
  ],
  food: [
    { text: 'bread', meaningEn: 'bread', meaningTr: 'ekmek' },
    { text: 'water', meaningEn: 'water', meaningTr: 'su' },
    { text: 'milk', meaningEn: 'milk', meaningTr: 'süt' },
    { text: 'cheese', meaningEn: 'cheese', meaningTr: 'peynir' },
    { text: 'egg', meaningEn: 'egg', meaningTr: 'yumurta' },
    { text: 'chicken', meaningEn: 'chicken', meaningTr: 'tavuk' },
    { text: 'rice', meaningEn: 'rice', meaningTr: 'pirinç' },
    { text: 'salad', meaningEn: 'salad', meaningTr: 'salata' },
    { text: 'soup', meaningEn: 'soup', meaningTr: 'çorba' },
    { text: 'coffee', meaningEn: 'coffee', meaningTr: 'kahve' },
  ],
};

const RANGE_OPTIONS: NumberRange[] = ['0-100', '101-200', '201-300', '301-400'];

const pickMeaning = (nativeCode: string, en: string, tr: string) => (nativeCode === 'tr' ? tr : en);

export const getSpeechLocale = (targetCode: string) => SPEECH_LOCALES[targetCode] ?? 'en-US';

export const getWordTopics = (nativeCode: string): Array<{ id: WordTopic; title: string }> => {
  return (Object.keys(TOPIC_TITLES) as WordTopic[]).map((id) => ({
    id,
    title: nativeCode === 'tr' ? TOPIC_TITLES[id].tr : TOPIC_TITLES[id].en,
  }));
};

export const getNumberRanges = (): Array<{ id: NumberRange; title: string }> => {
  return RANGE_OPTIONS.map((id) => ({ id, title: id }));
};

export const getLetterItems = (nativeCode: string): PronunciationItem[] => {
  return 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('').map((letter) => ({
    id: `letter-${letter}`,
    text: letter,
    meaning: nativeCode === 'tr' ? `${letter} harfi` : `letter ${letter}`,
    speakText: letter.toLowerCase(),
  }));
};

export const getWordItems = (nativeCode: string, topic: WordTopic): PronunciationItem[] => {
  const entries = WORDS_BY_TOPIC[topic] ?? WORDS_BY_TOPIC.basics;
  return entries.map((entry, idx) => ({
    id: `word-${topic}-${idx}`,
    text: entry.text,
    meaning: pickMeaning(nativeCode, entry.meaningEn, entry.meaningTr),
    speakText: entry.text,
  }));
};

const buildNumberValues = (range: NumberRange): number[] => {
  const [fromRaw, toRaw] = range.split('-');
  const from = Number(fromRaw);
  const to = Number(toRaw);
  const list: number[] = [];
  for (let i = from; i <= to; i += 1) list.push(i);
  return list;
};

export const getNumberItems = (nativeCode: string, range: NumberRange): PronunciationItem[] => {
  const values = buildNumberValues(range);
  return values.map((n) => ({
    id: `number-${range}-${n}`,
    text: String(n),
    meaning: nativeCode === 'tr' ? `${n} sayısı` : `number ${n}`,
    speakText: String(n),
  }));
};
