export type Difficulty = 'easy' | 'medium' | 'hard';
export type QuestionType = 'word_to_image' | 'sentence_to_meaning' | 'synonym_pick';

export type FlashWord = {
  id: string;
  words: Record<string, string>;
  emoji: string;
  neighbors?: string[];
};

export type FlashOption = {
  id: string;
  visual: string;
  label: string;
};

export type FlashQuestion = {
  id: string;
  type: QuestionType;
  prompt: string;
  options: FlashOption[];
  correctOptionId: string;
};

export const DIFFICULTY_CONFIG: Record<Difficulty, { seconds: number; questionCount: number; lives: number }> = {
  easy: { seconds: 6, questionCount: 10, lives: 3 },
  medium: { seconds: 4, questionCount: 12, lives: 3 },
  hard: { seconds: 2.8, questionCount: 14, lives: 2 },
};

export const getFlashPickMaxCount = (langCode = 'en') => FLASH_WORDS.filter(w => Boolean(w.words[langCode] ?? w.words.en)).length;

const FLASH_WORDS: FlashWord[] = [
  { id: 'dog', words: { en: 'dog', es: 'perro', fr: 'chien', de: 'Hund', it: 'cane', pt: 'cachorro' }, emoji: '🐶', neighbors: ['wolf', 'fox', 'cat'] },
  { id: 'cat', words: { en: 'cat', es: 'gato', fr: 'chat', de: 'Katze', it: 'gatto', pt: 'gato' }, emoji: '🐱', neighbors: ['fox', 'dog', 'wolf'] },
  { id: 'wolf', words: { en: 'wolf', es: 'lobo', fr: 'loup', de: 'Wolf', it: 'lupo', pt: 'lobo' }, emoji: '🐺', neighbors: ['dog', 'fox', 'cat'] },
  { id: 'fox', words: { en: 'fox', es: 'zorro', fr: 'renard', de: 'Fuchs', it: 'volpe', pt: 'raposa' }, emoji: '🦊', neighbors: ['cat', 'wolf', 'dog'] },
  { id: 'bird', words: { en: 'bird', es: 'pájaro', fr: 'oiseau', de: 'Vogel', it: 'uccello', pt: 'pássaro' }, emoji: '🐦', neighbors: ['chicken', 'duck', 'eagle'] },
  { id: 'duck', words: { en: 'duck', es: 'pato', fr: 'canard', de: 'Ente', it: 'anatra', pt: 'pato' }, emoji: '🦆', neighbors: ['bird', 'chicken', 'penguin'] },
  { id: 'fish', words: { en: 'fish', es: 'pez', fr: 'poisson', de: 'Fisch', it: 'pesce', pt: 'peixe' }, emoji: '🐟', neighbors: ['whale', 'shark', 'dolphin'] },
  { id: 'shark', words: { en: 'shark', es: 'tiburón', fr: 'requin', de: 'Hai', it: 'squalo', pt: 'tubarão' }, emoji: '🦈', neighbors: ['fish', 'whale', 'dolphin'] },
  { id: 'car', words: { en: 'car', es: 'coche', fr: 'voiture', de: 'Auto', it: 'macchina', pt: 'carro' }, emoji: '🚗', neighbors: ['taxi', 'bus', 'train'] },
  { id: 'taxi', words: { en: 'taxi', es: 'taxi', fr: 'taxi', de: 'Taxi', it: 'taxi', pt: 'táxi' }, emoji: '🚕', neighbors: ['car', 'bus', 'train'] },
  { id: 'bus', words: { en: 'bus', es: 'autobús', fr: 'bus', de: 'Bus', it: 'autobus', pt: 'ônibus' }, emoji: '🚌', neighbors: ['train', 'taxi', 'car'] },
  { id: 'train', words: { en: 'train', es: 'tren', fr: 'train', de: 'Zug', it: 'treno', pt: 'trem' }, emoji: '🚆', neighbors: ['bus', 'tram', 'car'] },
  { id: 'bike', words: { en: 'bike', es: 'bicicleta', fr: 'vélo', de: 'Fahrrad', it: 'bicicletta', pt: 'bicicleta' }, emoji: '🚲', neighbors: ['motorbike', 'car', 'scooter'] },
  { id: 'book', words: { en: 'book', es: 'libro', fr: 'livre', de: 'Buch', it: 'libro', pt: 'livro' }, emoji: '📘', neighbors: ['notebook', 'newspaper', 'magazine'] },
  { id: 'phone', words: { en: 'phone', es: 'teléfono', fr: 'téléphone', de: 'Telefon', it: 'telefono', pt: 'telefone' }, emoji: '📱', neighbors: ['computer', 'tablet', 'tv'] },
  { id: 'computer', words: { en: 'computer', es: 'ordenador', fr: 'ordinateur', de: 'Computer', it: 'computer', pt: 'computador' }, emoji: '💻', neighbors: ['phone', 'tv', 'tablet'] },
  { id: 'clock', words: { en: 'clock', es: 'reloj', fr: 'horloge', de: 'Uhr', it: 'orologio', pt: 'relógio' }, emoji: '🕒', neighbors: ['watch', 'calendar', 'alarm'] },
  { id: 'key', words: { en: 'key', es: 'llave', fr: 'clé', de: 'Schlüssel', it: 'chiave', pt: 'chave' }, emoji: '🔑', neighbors: ['lock', 'door', 'bell'] },
  { id: 'house', words: { en: 'house', es: 'casa', fr: 'maison', de: 'Haus', it: 'casa', pt: 'casa' }, emoji: '🏠', neighbors: ['building', 'school', 'hotel'] },
  { id: 'school', words: { en: 'school', es: 'escuela', fr: 'école', de: 'Schule', it: 'scuola', pt: 'escola' }, emoji: '🏫', neighbors: ['house', 'office', 'library'] },
  { id: 'hospital', words: { en: 'hospital', es: 'hospital', fr: 'hôpital', de: 'Krankenhaus', it: 'ospedale', pt: 'hospital' }, emoji: '🏥', neighbors: ['hotel', 'school', 'office'] },
  { id: 'coffee', words: { en: 'coffee', es: 'café', fr: 'café', de: 'Kaffee', it: 'caffè', pt: 'café' }, emoji: '☕', neighbors: ['tea', 'milk', 'juice'] },
  { id: 'tea', words: { en: 'tea', es: 'té', fr: 'thé', de: 'Tee', it: 'tè', pt: 'chá' }, emoji: '🍵', neighbors: ['coffee', 'juice', 'milk'] },
  { id: 'bread', words: { en: 'bread', es: 'pan', fr: 'pain', de: 'Brot', it: 'pane', pt: 'pão' }, emoji: '🍞', neighbors: ['cheese', 'cake', 'pizza'] },
  { id: 'pizza', words: { en: 'pizza', es: 'pizza', fr: 'pizza', de: 'Pizza', it: 'pizza', pt: 'pizza' }, emoji: '🍕', neighbors: ['bread', 'burger', 'sandwich'] },
  { id: 'apple', words: { en: 'apple', es: 'manzana', fr: 'pomme', de: 'Apfel', it: 'mela', pt: 'maçã' }, emoji: '🍎', neighbors: ['pear', 'peach', 'cherry'] },
  { id: 'banana', words: { en: 'banana', es: 'plátano', fr: 'banane', de: 'Banane', it: 'banana', pt: 'banana' }, emoji: '🍌', neighbors: ['pear', 'apple', 'grapes'] },
  { id: 'sun', words: { en: 'sun', es: 'sol', fr: 'soleil', de: 'Sonne', it: 'sole', pt: 'sol' }, emoji: '☀️', neighbors: ['moon', 'star', 'cloud'] },
  { id: 'moon', words: { en: 'moon', es: 'luna', fr: 'lune', de: 'Mond', it: 'luna', pt: 'lua' }, emoji: '🌙', neighbors: ['sun', 'star', 'planet'] },
  { id: 'rain', words: { en: 'rain', es: 'lluvia', fr: 'pluie', de: 'Regen', it: 'pioggia', pt: 'chuva' }, emoji: '🌧️', neighbors: ['snow', 'cloud', 'storm'] },
  { id: 'snow', words: { en: 'snow', es: 'nieve', fr: 'neige', de: 'Schnee', it: 'neve', pt: 'neve' }, emoji: '❄️', neighbors: ['rain', 'ice', 'cloud'] },
];

const shuffle = <T,>(arr: T[]): T[] => [...arr].sort(() => Math.random() - 0.5);

const getWordById = (id: string) => FLASH_WORDS.find(w => w.id === id);

const getDistractorPool = (correct: FlashWord, difficulty: Difficulty) => {
  if (difficulty === 'easy') {
    return FLASH_WORDS.filter(w => w.id !== correct.id);
  }

  const neighbors = (correct.neighbors ?? [])
    .map(getWordById)
    .filter((w): w is FlashWord => Boolean(w));

  if (difficulty === 'medium') {
    return [...neighbors, ...FLASH_WORDS.filter(w => w.id !== correct.id && !neighbors.find(n => n.id === w.id))];
  }

  // hard: önce benzer anlamlılar
  const hardPool = [...neighbors, ...neighbors, ...FLASH_WORDS.filter(w => w.id !== correct.id)];
  return hardPool;
};

const wordForLang = (word: FlashWord, langCode: string) => word.words[langCode] ?? word.words.en;

const buildWordToImageQuestion = (correct: FlashWord, index: number, difficulty: Difficulty, langCode: string): FlashQuestion => {
  const pool = getDistractorPool(correct, difficulty).filter(w => w.id !== correct.id);
  const distractors = shuffle(pool).slice(0, 3);
  const options = shuffle([
    { id: correct.id, visual: correct.emoji, label: wordForLang(correct, langCode) },
    ...distractors.map(d => ({ id: d.id, visual: d.emoji, label: wordForLang(d, langCode) })),
  ]);

  return {
    id: `q_${index}_${correct.id}`,
    type: 'word_to_image',
    prompt: wordForLang(correct, langCode),
    options,
    correctOptionId: correct.id,
  };
};

export const buildFlashPickQuestions = (difficulty: Difficulty, langCode = 'en', customCount?: number): FlashQuestion[] => {
  const { questionCount } = DIFFICULTY_CONFIG[difficulty];
  const targetCount = customCount ?? questionCount;
  const available = FLASH_WORDS.filter(w => Boolean(w.words[langCode] ?? w.words.en));
  const chosen = shuffle(available).slice(0, Math.min(targetCount, available.length));
  return chosen.map((w, i) => buildWordToImageQuestion(w, i, difficulty, langCode));
};
