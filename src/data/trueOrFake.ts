export type TrueFakeDifficulty = 'easy' | 'medium' | 'hard';
export type SentenceType =
  | 'grammar_error'
  | 'natural_usage'
  | 'slang'
  | 'awkward_but_understandable';

export type SentenceItem = {
  id: string;
  text: string;
  isReal: boolean;
  correction?: string
  explanation: string;
  type: SentenceType;
};

export const TRUE_FAKE_CONFIG: Record<TrueFakeDifficulty, { seconds: number; count: number }> = {
  easy: { seconds: 5, count: 12 },
  medium: { seconds: 4, count: 14 },
  hard: { seconds: 2.6, count: 16 },
};

const BANK: SentenceItem[] = [
  { id: '1', text: 'I made a mistake', isReal: true, explanation: 'Bu kullanım doğal.', type: 'natural_usage' },
  { id: '2', text: 'I did a mistake', isReal: false, correction: 'I made a mistake', explanation: 'make a mistake doğru kalıptır.', type: 'grammar_error' },
  { id: '3', text: "I'm kinda broke", isReal: true, explanation: 'Gündelik ve doğal bir ifade.', type: 'slang' },
  { id: '4', text: 'She go to school every day', isReal: false, correction: 'She goes to school every day', explanation: '3. tekil şahısta fiil -s alır.', type: 'grammar_error' },
  { id: '5', text: 'Can I get a latte?', isReal: true, explanation: 'Sipariş verirken doğal kullanım.', type: 'natural_usage' },
  { id: '6', text: 'I am agree with you', isReal: false, correction: 'I agree with you', explanation: 'agree fiil olarak doğrudan kullanılır.', type: 'grammar_error' },
  { id: '7', text: "That sounds great", isReal: true, explanation: 'Sohbette çok doğal bir tepki.', type: 'natural_usage' },
  { id: '8', text: 'I look forward to meet you', isReal: false, correction: 'I look forward to meeting you', explanation: 'to + V-ing yapısı gerekir.', type: 'grammar_error' },
  { id: '9', text: 'I wanna grab coffee', isReal: true, explanation: 'Informal ama doğal bir cümle.', type: 'slang' },
  { id: '10', text: 'He explained me the problem', isReal: false, correction: 'He explained the problem to me', explanation: 'explain + something + to someone.', type: 'grammar_error' },
  { id: '11', text: 'Could you speak a bit slower?', isReal: true, explanation: 'Kibar ve doğal istek cümlesi.', type: 'natural_usage' },
  { id: '12', text: 'I have 25 years', isReal: false, correction: 'I am 25 years old', explanation: 'Yaş belirtirken be fiili kullanılır.', type: 'grammar_error' },
  { id: '13', text: 'I want coffee', isReal: true, explanation: 'Anlaşılır ve kabul edilebilir bir kullanım.', type: 'awkward_but_understandable' },
  { id: '14', text: 'Long time no see!', isReal: true, explanation: 'Çok yaygın bir kalıp.', type: 'slang' },
  { id: '15', text: 'Where do you from?', isReal: false, correction: 'Where are you from?', explanation: 'be fiili gerekir.', type: 'grammar_error' },
  { id: '16', text: 'I am used to wake up early', isReal: false, correction: 'I am used to waking up early', explanation: 'used to + V-ing gerekir.', type: 'grammar_error' },
  { id: '17', text: "I'm down for that", isReal: true, explanation: 'Gündelik konuşmada doğal bir onay.', type: 'slang' },
  { id: '18', text: 'This is not my cup of tea', isReal: true, explanation: 'Doğal bir deyim.', type: 'natural_usage' },
  { id: '19', text: 'I didn’t went there', isReal: false, correction: "I didn't go there", explanation: 'did sonrası fiil yalın gelir.', type: 'grammar_error' },
  { id: '20', text: 'I have to study tonight', isReal: true, explanation: 'Doğal ve doğru kullanım.', type: 'natural_usage' },
  { id: '21', text: 'He suggested me to try it', isReal: false, correction: 'He suggested that I try it', explanation: 'suggest yapısı bu şekilde kullanılır.', type: 'grammar_error' },
  { id: '22', text: 'I am looking for a job', isReal: true, explanation: 'Doğal bir cümle.', type: 'natural_usage' },
  { id: '23', text: 'I am boring', isReal: false, correction: 'I am bored', explanation: 'Kişi için bored kullanılır.', type: 'grammar_error' },
  { id: '24', text: 'No worries, I got you', isReal: true, explanation: 'Gündelik ve doğal destek ifadesi.', type: 'slang' },
  // ── BATCH 2 ──────────────────────────────────────────────────────────────
  { id: '25', text: 'I told to him the news', isReal: false, correction: 'I told him the news', explanation: 'tell + kişi + şey; "to" gelmez.', type: 'grammar_error' },
  { id: '26', text: 'She is very good at cooking', isReal: true, explanation: 'good at + V-ing doğru kalıptır.', type: 'natural_usage' },
  { id: '27', text: 'I enjoy to swim in the sea', isReal: false, correction: 'I enjoy swimming in the sea', explanation: 'enjoy + V-ing gerekir.', type: 'grammar_error' },
  { id: '28', text: "That's on me", isReal: true, explanation: 'Bir masrafı üstlendiğini söyleme kalıbı.', type: 'slang' },
  { id: '29', text: 'He gave me a lift', isReal: true, explanation: 'Birini arabayla bırakmak anlamında doğal İngilizce.', type: 'natural_usage' },
  { id: '30', text: 'I am very boring in this class', isReal: false, correction: 'I am very bored in this class', explanation: 'Kişi bored, ders boring olur.', type: 'grammar_error' },
  { id: '31', text: 'Do you mind if I sit here?', isReal: true, explanation: 'Kibarca izin istemek için doğal kalıp.', type: 'natural_usage' },
  { id: '32', text: 'She is more taller than me', isReal: false, correction: 'She is taller than me', explanation: 'Çift karşılaştırma kullanılmaz.', type: 'grammar_error' },
  { id: '33', text: "I'm not feeling it today", isReal: true, explanation: 'Gündelik — isteksizlik ifadesi.', type: 'slang' },
  { id: '34', text: 'He is working since 9 AM', isReal: false, correction: 'He has been working since 9 AM', explanation: 'since ile present perfect continuous gerekir.', type: 'grammar_error' },
  { id: '35', text: 'It slipped my mind', isReal: true, explanation: 'Unutmak için kullanılan deyim.', type: 'natural_usage' },
  { id: '36', text: 'I am thinking to go abroad', isReal: false, correction: 'I am thinking of going abroad / I am thinking about going abroad', explanation: 'think of/about + V-ing kullanılır.', type: 'grammar_error' },
  { id: '37', text: "That's a no-brainer", isReal: true, explanation: 'Çok kolay/açık bir şey için kullanılır.', type: 'slang' },
  { id: '38', text: 'We discussed about the plan', isReal: false, correction: 'We discussed the plan', explanation: 'discuss doğrudan nesne alır, about gelmez.', type: 'grammar_error' },
  { id: '39', text: 'Can you fill me in?', isReal: true, explanation: 'Birinden bilgi istemek için doğal phrasal verb.', type: 'natural_usage' },
  { id: '40', text: 'I wish I have more time', isReal: false, correction: 'I wish I had more time', explanation: 'wish cümlelerinde past tense kullanılır.', type: 'grammar_error' },
  { id: '41', text: "I'll pass on that", isReal: true, explanation: 'Bir şeyi nazikçe reddetmek için kullanılır.', type: 'slang' },
  { id: '42', text: 'She asked me where do I live', isReal: false, correction: 'She asked me where I live', explanation: 'Dolaylı sorularda soru sözdizimi kullanılmaz.', type: 'grammar_error' },
  { id: '43', text: 'I need to sort this out', isReal: true, explanation: 'Doğal phrasal verb — bir sorunu çözmek.', type: 'natural_usage' },
  { id: '44', text: 'He suggested me a good book', isReal: false, correction: 'He recommended a good book to me', explanation: 'suggest kişiyle bu şekilde kurulamaz.', type: 'grammar_error' },
  { id: '45', text: "I'm on the fence about it", isReal: true, explanation: 'Kararsız olmak için kullanılan deyim.', type: 'slang' },
  { id: '46', text: 'Despite of the rain, we went out', isReal: false, correction: 'Despite the rain, we went out', explanation: 'despite of değil, sadece despite kullanılır.', type: 'grammar_error' },
  { id: '47', text: 'She has a point', isReal: true, explanation: 'Birinin argümanının geçerli olduğunu onaylamak.', type: 'natural_usage' },
  { id: '48', text: 'I will call you when I will arrive', isReal: false, correction: 'I will call you when I arrive', explanation: 'Zaman zarfı cümlelerinde future kullanılmaz.', type: 'grammar_error' },
  { id: '49', text: "Let's touch base later", isReal: true, explanation: 'İş dünyasında iletişim kurmayı önermek.', type: 'natural_usage' },
  { id: '50', text: 'I prefer tea than coffee', isReal: false, correction: 'I prefer tea to coffee', explanation: 'prefer + noun + to + noun kalıbı.', type: 'grammar_error' },
  // ── BATCH 3 ──────────────────────────────────────────────────────────────
  { id: '51', text: "I'm swamped right now", isReal: true, explanation: 'Çok meşgul olmak için gündelik ifade.', type: 'slang' },
  { id: '52', text: 'He is more intelligent than his brother', isReal: true, explanation: 'Doğru karşılaştırma yapısı.', type: 'natural_usage' },
  { id: '53', text: 'I have seen him yesterday', isReal: false, correction: 'I saw him yesterday', explanation: 'yesterday ile simple past kullanılır, perfect değil.', type: 'grammar_error' },
  { id: '54', text: 'You got this!', isReal: true, explanation: 'Motivasyon için çok yaygın ifade.', type: 'slang' },
  { id: '55', text: 'She is married with a doctor', isReal: false, correction: 'She is married to a doctor', explanation: 'married to — preposition doğru kullanım.', type: 'grammar_error' },
  { id: '56', text: 'I could use a break', isReal: true, explanation: 'İhtiyaç duymayı ifade eden doğal kalıp.', type: 'natural_usage' },
  { id: '57', text: 'We need to make our homework', isReal: false, correction: 'We need to do our homework', explanation: 'do homework — make değil.', type: 'grammar_error' },
  { id: '58', text: "That's out of my hands", isReal: true, explanation: 'Kontrolünün dışında olduğunu belirtir.', type: 'natural_usage' },
  { id: '59', text: 'I am here since two hours', isReal: false, correction: 'I have been here for two hours', explanation: 'Süre + for + present perfect continuous.', type: 'grammar_error' },
  { id: '60', text: 'Hit me up later', isReal: true, explanation: 'Daha sonra ulaşmasını istemek için gündelik ifade.', type: 'slang' },
  { id: '61', text: 'I am interesting in photography', isReal: false, correction: 'I am interested in photography', explanation: 'Kişi interested, konu interesting olur.', type: 'grammar_error' },
  { id: '62', text: 'It takes some getting used to', isReal: true, explanation: 'Alışılması zaman alan bir şeyi anlatmak için.', type: 'natural_usage' },
  { id: '63', text: 'She went to home after work', isReal: false, correction: 'She went home after work', explanation: 'home önünde to kullanılmaz.', type: 'grammar_error' },
  { id: '64', text: "I'm a bit under the weather", isReal: true, explanation: 'Hafif hasta hissetmek için kullanılan deyim.', type: 'slang' },
  { id: '65', text: 'He denied to help us', isReal: false, correction: 'He refused to help us', explanation: 'deny bir şeyi reddetmek değil, inkâr etmektir.', type: 'grammar_error' },
  { id: '66', text: 'It makes sense now', isReal: true, explanation: 'Anlama geldiğini ifade etmek için doğal.', type: 'natural_usage' },
  { id: '67', text: 'I am very exciting about the trip', isReal: false, correction: 'I am very excited about the trip', explanation: 'Kişi excited, haber exciting olur.', type: 'grammar_error' },
  { id: '68', text: "I'm all ears", isReal: true, explanation: 'Birini dikkatle dinlemeye hazır olduğunu gösterir.', type: 'slang' },
  { id: '69', text: 'Can you give me a hand?', isReal: true, explanation: 'Yardım istemek için çok yaygın deyim.', type: 'natural_usage' },
  { id: '70', text: 'I would like speak to the manager', isReal: false, correction: 'I would like to speak to the manager', explanation: 'would like + to + infinitive gerekir.', type: 'grammar_error' },
  { id: '71', text: "Let's wrap this up", isReal: true, explanation: 'Bir şeyi bitirmek/sonuçlandırmak için kullanılır.', type: 'natural_usage' },
  { id: '72', text: 'She mentioned about the problem', isReal: false, correction: 'She mentioned the problem', explanation: 'mention doğrudan nesne alır, about gelmez.', type: 'grammar_error' },
  { id: '73', text: "I'll sleep on it", isReal: true, explanation: 'Bir karar vermeden önce düşünmek için kullanılır.', type: 'slang' },
  { id: '74', text: 'He is used to live in cold weather', isReal: false, correction: 'He is used to living in cold weather', explanation: 'be used to + V-ing kalıbı.', type: 'grammar_error' },
  { id: '75', text: 'To be honest, I had no idea', isReal: true, explanation: 'Dürüstçe bir itiraf için doğal açılış.', type: 'natural_usage' },
  { id: '76', text: 'They arrived to the airport late', isReal: false, correction: 'They arrived at the airport late', explanation: 'arrive at/in kullanılır, to değil.', type: 'grammar_error' },
  { id: '77', text: "We're on the same page", isReal: true, explanation: 'Aynı fikirde olduğunu ifade eden iş deyimi.', type: 'natural_usage' },
  { id: '78', text: 'I am knowing the answer', isReal: false, correction: 'I know the answer', explanation: 'know bir durum fiilidir, continuous kullanılmaz.', type: 'grammar_error' },
  { id: '79', text: 'Drop me a line sometime', isReal: true, explanation: 'Birine mesaj/haber vermesini istemek.', type: 'slang' },
  { id: '80', text: 'He told that he was busy', isReal: false, correction: 'He said that he was busy', explanation: 'say that kullanılır; tell kişi ister.', type: 'grammar_error' },
  { id: '81', text: 'I need to think it over', isReal: true, explanation: 'Bir şeyi iyice düşünmek için phrasal verb.', type: 'natural_usage' },
  { id: '82', text: 'She is good in maths', isReal: false, correction: 'She is good at maths', explanation: 'good at kullanılır, in değil.', type: 'grammar_error' },
  { id: '83', text: "I'm beat", isReal: true, explanation: 'Çok yorgun olmak için gündelik American English.', type: 'slang' },
  { id: '84', text: 'He requested me to wait', isReal: false, correction: 'He asked me to wait', explanation: 'request kişiyle bu yapıda kullanılmaz.', type: 'grammar_error' },
  { id: '85', text: 'That rings a bell', isReal: true, explanation: 'Bir şeyin tanıdık/aşina geldiğini söylemek.', type: 'natural_usage' },
  { id: '86', text: 'I am owning a car', isReal: false, correction: 'I own a car', explanation: 'own durum fiilidir, continuous kullanılmaz.', type: 'grammar_error' },
  { id: '87', text: "It's worth a shot", isReal: true, explanation: 'Denemek için bir neden var anlamında.', type: 'slang' },
  { id: '88', text: 'I look forward to hear from you', isReal: false, correction: 'I look forward to hearing from you', explanation: 'look forward to + V-ing kalıbı.', type: 'grammar_error' },
];

const shuffle = <T,>(arr: T[]): T[] => [...arr].sort(() => Math.random() - 0.5);

const byDifficulty = (difficulty: TrueFakeDifficulty, item: SentenceItem) => {
  if (difficulty === 'easy') {
    return item.type === 'natural_usage' || item.type === 'grammar_error';
  }
  if (difficulty === 'medium') {
    return item.type !== 'awkward_but_understandable';
  }
  return true;
};

export const getTrueFakeMaxCount = (difficulty: TrueFakeDifficulty) =>
  BANK.filter(i => byDifficulty(difficulty, i)).length;

export const buildTrueFakeSet = (difficulty: TrueFakeDifficulty, customCount?: number): SentenceItem[] => {
  const { count } = TRUE_FAKE_CONFIG[difficulty];
  const targetCount = customCount ?? count;
  const pool = BANK.filter(i => byDifficulty(difficulty, i));
  return shuffle(pool).slice(0, Math.min(targetCount, pool.length));
};
