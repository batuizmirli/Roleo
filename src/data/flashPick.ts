export type Difficulty = 'easy' | 'medium' | 'hard';
export type QuestionType = 'word_to_image' | 'sentence_to_meaning' | 'synonym_pick';

export type FlashWord = {
  id: string;
  word: string;
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

export const getFlashPickMaxCount = () => FLASH_WORDS.length;

const FLASH_WORDS: FlashWord[] = [
  { id: 'dog', word: 'dog', emoji: '🐶', neighbors: ['wolf', 'fox', 'cat'] },
  { id: 'cat', word: 'cat', emoji: '🐱', neighbors: ['fox', 'dog', 'wolf'] },
  { id: 'wolf', word: 'wolf', emoji: '🐺', neighbors: ['dog', 'fox', 'cat'] },
  { id: 'fox', word: 'fox', emoji: '🦊', neighbors: ['cat', 'wolf', 'dog'] },
  { id: 'bird', word: 'bird', emoji: '🐦', neighbors: ['chicken', 'duck', 'eagle'] },
  { id: 'duck', word: 'duck', emoji: '🦆', neighbors: ['bird', 'chicken', 'penguin'] },
  { id: 'fish', word: 'fish', emoji: '🐟', neighbors: ['whale', 'shark', 'dolphin'] },
  { id: 'shark', word: 'shark', emoji: '🦈', neighbors: ['fish', 'whale', 'dolphin'] },
  { id: 'car', word: 'car', emoji: '🚗', neighbors: ['taxi', 'bus', 'train'] },
  { id: 'taxi', word: 'taxi', emoji: '🚕', neighbors: ['car', 'bus', 'train'] },
  { id: 'bus', word: 'bus', emoji: '🚌', neighbors: ['train', 'taxi', 'car'] },
  { id: 'train', word: 'train', emoji: '🚆', neighbors: ['bus', 'tram', 'car'] },
  { id: 'bike', word: 'bike', emoji: '🚲', neighbors: ['motorbike', 'car', 'scooter'] },
  { id: 'book', word: 'book', emoji: '📘', neighbors: ['notebook', 'newspaper', 'magazine'] },
  { id: 'phone', word: 'phone', emoji: '📱', neighbors: ['computer', 'tablet', 'tv'] },
  { id: 'computer', word: 'computer', emoji: '💻', neighbors: ['phone', 'tv', 'tablet'] },
  { id: 'clock', word: 'clock', emoji: '🕒', neighbors: ['watch', 'calendar', 'alarm'] },
  { id: 'key', word: 'key', emoji: '🔑', neighbors: ['lock', 'door', 'bell'] },
  { id: 'house', word: 'house', emoji: '🏠', neighbors: ['building', 'school', 'hotel'] },
  { id: 'school', word: 'school', emoji: '🏫', neighbors: ['house', 'office', 'library'] },
  { id: 'hospital', word: 'hospital', emoji: '🏥', neighbors: ['hotel', 'school', 'office'] },
  { id: 'coffee', word: 'coffee', emoji: '☕', neighbors: ['tea', 'milk', 'juice'] },
  { id: 'tea', word: 'tea', emoji: '🍵', neighbors: ['coffee', 'juice', 'milk'] },
  { id: 'bread', word: 'bread', emoji: '🍞', neighbors: ['cheese', 'cake', 'pizza'] },
  { id: 'pizza', word: 'pizza', emoji: '🍕', neighbors: ['bread', 'burger', 'sandwich'] },
  { id: 'apple', word: 'apple', emoji: '🍎', neighbors: ['pear', 'peach', 'cherry'] },
  { id: 'banana', word: 'banana', emoji: '🍌', neighbors: ['pear', 'apple', 'grapes'] },
  { id: 'sun', word: 'sun', emoji: '☀️', neighbors: ['moon', 'star', 'cloud'] },
  { id: 'moon', word: 'moon', emoji: '🌙', neighbors: ['sun', 'star', 'planet'] },
  { id: 'rain', word: 'rain', emoji: '🌧️', neighbors: ['snow', 'cloud', 'storm'] },
  { id: 'snow', word: 'snow', emoji: '❄️', neighbors: ['rain', 'ice', 'cloud'] },
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

const buildWordToImageQuestion = (correct: FlashWord, index: number, difficulty: Difficulty): FlashQuestion => {
  const pool = getDistractorPool(correct, difficulty).filter(w => w.id !== correct.id);
  const distractors = shuffle(pool).slice(0, 3);
  const options = shuffle([
    { id: correct.id, visual: correct.emoji, label: correct.word },
    ...distractors.map(d => ({ id: d.id, visual: d.emoji, label: d.word })),
  ]);

  return {
    id: `q_${index}_${correct.id}`,
    type: 'word_to_image',
    prompt: correct.word,
    options,
    correctOptionId: correct.id,
  };
};

export const buildFlashPickQuestions = (difficulty: Difficulty, customCount?: number): FlashQuestion[] => {
  const { questionCount } = DIFFICULTY_CONFIG[difficulty];
  const targetCount = customCount ?? questionCount;
  const chosen = shuffle(FLASH_WORDS).slice(0, Math.min(targetCount, FLASH_WORDS.length));
  return chosen.map((w, i) => buildWordToImageQuestion(w, i, difficulty));
};
