import { Scenario } from '../types';

export const scenarios: Scenario[] = [
  // SPANISH
  {
    id: 'cafe-barcelona',
    title: 'Kafede Sipariş',
    location: 'Barcelona, Cafe',
    emoji: '☕',
    difficulty: 'beginner',
    language: 'es',
    stageType: 'cafe',
    modeType: 'normal',
    estimatedMinutes: 3,
    levelRange: ['beginner'],
    mission: 'Bir içecek iste ve gelen ek soruya cevap ver',
    xpReward: 20,
    systemPrompt: `You are a friendly waiter in a Barcelona cafe. The user is a Turkish beginner learning Spanish.
    Start VERY simple. If the user writes in Turkish or English, respond in both Spanish AND Turkish/English translation so they understand.
    Gradually encourage them to try Spanish words. After each user response, briefly note any grammar or vocabulary mistakes with the prefix "💡 Düzeltme:".
    Be very patient and encouraging. Example: if they say "kahve istiyorum", respond "¡Café! (Kahve) — Muy bien! ¿Con leche o solo? (Sütlü mü yoksa sade mi?)"`,
    openingMessage: '¡Buenos días! (Günaydın!) Bienvenido a Café Barcelona. ¿Qué quieres tomar? ☕\n\n👉 Türkçe veya İngilizce yazabilirsin, sana hem İspanyolca hem çevirisini göstereceğim.',
    vocabHints: [
      { word: 'Hola', meaning: 'Merhaba' },
      { word: 'Por favor', meaning: 'Lütfen' },
      { word: 'Gracias', meaning: 'Teşekkürler' },
      { word: 'Un café', meaning: 'Bir kahve' },
      { word: 'La cuenta', meaning: 'Hesap' },
      { word: '¿Cuánto cuesta?', meaning: 'Ne kadar?' },
    ],
  },
  {
    id: 'metro-madrid',
    title: 'Metroda Yön Sorma',
    location: 'Madrid, Metro',
    emoji: '🚇',
    difficulty: 'beginner',
    language: 'es',
    stageType: 'travel',
    modeType: 'normal',
    estimatedMinutes: 3,
    levelRange: ['beginner', 'intermediate'],
    mission: 'Doğru metro yönünü sorup teyit et',
    xpReward: 22,
    systemPrompt: `You are a helpful local in Madrid metro. The user is a Turkish beginner learning Spanish.
    If the user writes in Turkish or English, respond in both Spanish AND Turkish translation.
    After each user response, note mistakes with prefix "💡 Düzeltme:". Be very encouraging.`,
    openingMessage: '¡Hola! (Merhaba!) Parece que estás perdido. ¿Necesitas ayuda? (Kaybolmuş gibi görünüyorsun. Yardıma ihtiyacın var mı?)\n\n👉 Türkçe veya İspanyolca yazabilirsin!',
    vocabHints: [
      { word: '¿Dónde está...?', meaning: 'Nerede...?' },
      { word: 'La estación', meaning: 'İstasyon' },
      { word: 'A la derecha', meaning: 'Sağa' },
      { word: 'A la izquierda', meaning: 'Sola' },
      { word: 'Todo recto', meaning: 'Düz devam et' },
      { word: 'El tren', meaning: 'Tren' },
    ],
  },
  {
    id: 'meeting-madrid',
    title: 'İş Toplantısı',
    location: 'Madrid, Office',
    emoji: '💼',
    difficulty: 'intermediate',
    language: 'es',
    stageType: 'business',
    modeType: 'challenge',
    estimatedMinutes: 4,
    levelRange: ['intermediate', 'advanced'],
    mission: 'Toplantıda fikrini 2 cümleyle savun',
    xpReward: 28,
    systemPrompt: `You are a Spanish business colleague in a meeting. Speak in professional Spanish (intermediate level).
    After each user response, briefly note any grammar or vocabulary mistakes with the prefix "💡 Düzeltme:".
    If they write in English, gently remind them to try in Spanish.`,
    openingMessage: 'Buenos días. Gracias por venir a la reunión. ¿Empezamos con la presentación del proyecto?',
    vocabHints: [
      { word: 'La reunión', meaning: 'Toplantı' },
      { word: 'El proyecto', meaning: 'Proje' },
      { word: 'De acuerdo', meaning: 'Anlaştık / Tamam' },
      { word: 'En mi opinión', meaning: 'Bence' },
      { word: 'El presupuesto', meaning: 'Bütçe' },
      { word: 'El plazo', meaning: 'Süre / Deadline' },
    ],
  },
  {
    id: 'concert-madrid',
    title: 'Konserde Sohbet',
    location: 'Madrid, Concert',
    emoji: '🎸',
    difficulty: 'intermediate',
    language: 'es',
    stageType: 'social',
    modeType: 'story',
    estimatedMinutes: 4,
    levelRange: ['intermediate', 'advanced'],
    mission: 'Müzik hakkında en az 3 etkileşim kur',
    xpReward: 26,
    systemPrompt: `You are a friendly Spanish person at a concert. Speak in casual Spanish (intermediate level).
    After each user response, note mistakes with prefix "💡 Düzeltme:".
    Talk about music, the concert, the band. If they write in English, gently remind them to try in Spanish.`,
    openingMessage: '¡Oye! ¿También eres fan del grupo? ¡Este concierto está increíble!',
    vocabHints: [
      { word: 'La música', meaning: 'Müzik' },
      { word: 'El concierto', meaning: 'Konser' },
      { word: 'Me encanta', meaning: 'Bayılıyorum' },
      { word: '¿Te gusta?', meaning: 'Sever misin?' },
      { word: 'Increíble', meaning: 'İnanılmaz' },
      { word: 'El cantante', meaning: 'Şarkıcı' },
    ],
  },

  // FRENCH
  {
    id: 'paris-cafe',
    title: 'Paris Kafesi',
    location: 'Paris, Café',
    emoji: '🥐',
    difficulty: 'beginner',
    language: 'fr',
    stageType: 'cafe',
    modeType: 'normal',
    estimatedMinutes: 3,
    levelRange: ['beginner'],
    mission: 'Fransızca bir sipariş cümlesi kur',
    xpReward: 20,
    systemPrompt: `You are a friendly waiter in a Parisian café. The user is a Turkish beginner learning French.
    If the user writes in Turkish or English, respond in both French AND Turkish translation.
    After each user response, note mistakes with prefix "💡 Düzeltme:". Be very encouraging.`,
    openingMessage: 'Bonjour! (Merhaba!) Bienvenue au Café de Paris. Qu\'est-ce que vous voulez? (Ne istersiniz?)\n\n👉 Türkçe veya Fransızca yazabilirsin!',
    vocabHints: [
      { word: 'Bonjour', meaning: 'Merhaba' },
      { word: 'S\'il vous plaît', meaning: 'Lütfen' },
      { word: 'Merci', meaning: 'Teşekkürler' },
      { word: 'Un café', meaning: 'Bir kahve' },
      { word: 'L\'addition', meaning: 'Hesap' },
      { word: 'Combien ça coûte?', meaning: 'Ne kadar?' },
    ],
  },
  {
    id: 'paris-metro',
    title: 'Paris Metrosu',
    location: 'Paris, Métro',
    emoji: '🚇',
    difficulty: 'beginner',
    language: 'fr',
    stageType: 'travel',
    modeType: 'survival',
    estimatedMinutes: 3,
    levelRange: ['beginner', 'intermediate'],
    mission: 'İstediğin istasyona nasıl gidileceğini öğren',
    xpReward: 22,
    systemPrompt: `You are a helpful Parisian in the metro. The user is a Turkish beginner learning French.
    Respond in both French AND Turkish translation. Note mistakes with prefix "💡 Düzeltme:".`,
    openingMessage: 'Excusez-moi! (Pardon!) Vous avez l\'air perdu. Je peux vous aider? (Kaybolmuş gibisiniz. Yardımcı olabilir miyim?)',
    vocabHints: [
      { word: 'Où est...?', meaning: 'Nerede...?' },
      { word: 'La station', meaning: 'İstasyon' },
      { word: 'À droite', meaning: 'Sağa' },
      { word: 'À gauche', meaning: 'Sola' },
      { word: 'Tout droit', meaning: 'Düz devam et' },
      { word: 'Le ticket', meaning: 'Bilet' },
    ],
  },
  {
    id: 'paris-shopping',
    title: 'Paris\'te Alışveriş',
    location: 'Paris, Boutique',
    emoji: '🛍️',
    difficulty: 'intermediate',
    language: 'fr',
    stageType: 'social',
    modeType: 'challenge',
    estimatedMinutes: 4,
    levelRange: ['intermediate', 'advanced'],
    mission: 'Beden sorup fiyat pazarlığı yap',
    xpReward: 28,
    systemPrompt: `You are a shop assistant in a Paris boutique. Speak in intermediate French.
    After each user response, note mistakes with prefix "💡 Düzeltme:".`,
    openingMessage: 'Bonjour! Bienvenue dans notre boutique. Est-ce que je peux vous aider?',
    vocabHints: [
      { word: 'Je cherche...', meaning: 'Arıyorum...' },
      { word: 'Quelle taille?', meaning: 'Hangi beden?' },
      { word: 'C\'est combien?', meaning: 'Kaç para?' },
      { word: 'Trop cher', meaning: 'Çok pahalı' },
      { word: 'Je prends ça', meaning: 'Bunu alıyorum' },
      { word: 'Carte bancaire', meaning: 'Kredi kartı' },
    ],
  },

  // GERMAN
  {
    id: 'berlin-market',
    title: 'Berlin Pazarı',
    location: 'Berlin, Market',
    emoji: '🥨',
    difficulty: 'beginner',
    language: 'de',
    stageType: 'travel',
    modeType: 'normal',
    estimatedMinutes: 3,
    levelRange: ['beginner'],
    mission: 'Pazarda ürün isteyip fiyat sor',
    xpReward: 20,
    systemPrompt: `You are a friendly vendor at a Berlin market. The user is a Turkish beginner learning German.
    If the user writes in Turkish or English, respond in both German AND Turkish translation.
    After each user response, note mistakes with prefix "💡 Düzeltme:". Be very encouraging.`,
    openingMessage: 'Guten Morgen! (Günaydın!) Willkommen auf dem Berliner Markt! Was darf es sein? (Ne istersiniz?)\n\n👉 Türkçe veya Almanca yazabilirsin!',
    vocabHints: [
      { word: 'Hallo', meaning: 'Merhaba' },
      { word: 'Bitte', meaning: 'Lütfen' },
      { word: 'Danke', meaning: 'Teşekkürler' },
      { word: 'Ich möchte...', meaning: 'İstiyorum...' },
      { word: 'Wie viel kostet?', meaning: 'Ne kadar?' },
      { word: 'Die Rechnung', meaning: 'Hesap' },
    ],
  },
  {
    id: 'berlin-cafe',
    title: 'Berlin Kafesi',
    location: 'Berlin, Café',
    emoji: '🍺',
    difficulty: 'beginner',
    language: 'de',
    stageType: 'cafe',
    modeType: 'normal',
    estimatedMinutes: 3,
    levelRange: ['beginner'],
    mission: 'İçeceğini detay vererek söyle',
    xpReward: 20,
    systemPrompt: `You are a friendly waiter in a Berlin café. The user is a Turkish beginner learning German.
    Respond in both German AND Turkish translation. Note mistakes with prefix "💡 Düzeltme:".`,
    openingMessage: 'Hallo! (Merhaba!) Willkommen! Was möchten Sie trinken? (Ne içmek istersiniz?)',
    vocabHints: [
      { word: 'Ein Kaffee', meaning: 'Bir kahve' },
      { word: 'Mit Milch', meaning: 'Sütlü' },
      { word: 'Ohne Zucker', meaning: 'Şekersiz' },
      { word: 'Die Karte', meaning: 'Menü' },
      { word: 'Zahlen bitte', meaning: 'Hesap lütfen' },
      { word: 'Sehr gut', meaning: 'Çok iyi' },
    ],
  },
  {
    id: 'berlin-office',
    title: 'Berlin\'de İş Görüşmesi',
    location: 'Berlin, Office',
    emoji: '💼',
    difficulty: 'intermediate',
    language: 'de',
    stageType: 'business',
    modeType: 'challenge',
    estimatedMinutes: 4,
    levelRange: ['intermediate', 'advanced'],
    mission: 'Toplantıda bir öneri sun ve gerekçe ver',
    xpReward: 30,
    systemPrompt: `You are a German colleague in a business meeting. Speak in intermediate German.
    After each user response, note mistakes with prefix "💡 Düzeltme:".`,
    openingMessage: 'Guten Tag! Schön, Sie kennenzulernen. Setzen Sie sich bitte. Wie war Ihre Reise?',
    vocabHints: [
      { word: 'Das Meeting', meaning: 'Toplantı' },
      { word: 'Das Projekt', meaning: 'Proje' },
      { word: 'Einverstanden', meaning: 'Anlaştık' },
      { word: 'Meiner Meinung nach', meaning: 'Bence' },
      { word: 'Das Budget', meaning: 'Bütçe' },
      { word: 'Die Deadline', meaning: 'Son tarih' },
    ],
  },

  // ITALIAN
  {
    id: 'rome-cafe',
    title: 'Roma Kafesi',
    location: 'Roma, Bar',
    emoji: '🍕',
    difficulty: 'beginner',
    language: 'it',
    stageType: 'cafe',
    modeType: 'normal',
    estimatedMinutes: 3,
    levelRange: ['beginner'],
    mission: 'Kafede sipariş verip hesabı iste',
    xpReward: 20,
    systemPrompt: `You are a friendly barista in a Rome café. The user is a Turkish beginner learning Italian.
    If the user writes in Turkish or English, respond in both Italian AND Turkish translation.
    After each user response, note mistakes with prefix "💡 Düzeltme:". Be very encouraging.`,
    openingMessage: 'Ciao! (Merhaba!) Benvenuto al Bar Roma! Cosa prendi? (Ne alırsın?)\n\n👉 Türkçe veya İtalyanca yazabilirsin!',
    vocabHints: [
      { word: 'Ciao', meaning: 'Merhaba / Hoşça kal' },
      { word: 'Per favore', meaning: 'Lütfen' },
      { word: 'Grazie', meaning: 'Teşekkürler' },
      { word: 'Un caffè', meaning: 'Bir kahve' },
      { word: 'Il conto', meaning: 'Hesap' },
      { word: 'Quanto costa?', meaning: 'Ne kadar?' },
    ],
  },
  {
    id: 'rome-restaurant',
    title: 'Roma\'da Restoran',
    location: 'Roma, Ristorante',
    emoji: '🍝',
    difficulty: 'intermediate',
    language: 'it',
    stageType: 'social',
    modeType: 'story',
    estimatedMinutes: 4,
    levelRange: ['intermediate', 'advanced'],
    mission: 'Menüden iki yemek seçip yorum yap',
    xpReward: 26,
    systemPrompt: `You are a waiter in a Roman restaurant. Speak in intermediate Italian.
    After each user response, note mistakes with prefix "💡 Düzeltme:".`,
    openingMessage: 'Buonasera! Benvenuti! Avete una prenotazione?',
    vocabHints: [
      { word: 'Il menù', meaning: 'Menü' },
      { word: 'Il primo', meaning: 'İlk yemek' },
      { word: 'Il secondo', meaning: 'Ana yemek' },
      { word: 'Vorrei...', meaning: 'İstiyorum...' },
      { word: 'È delizioso', meaning: 'Çok lezzetli' },
      { word: 'Il conto', meaning: 'Hesap' },
    ],
  },

  // ENGLISH
  {
    id: 'london-cafe',
    title: 'Londra Kafesi',
    location: 'London, Café',
    emoji: '🫖',
    difficulty: 'beginner',
    language: 'en',
    stageType: 'cafe',
    modeType: 'normal',
    estimatedMinutes: 3,
    levelRange: ['beginner'],
    mission: 'İngilizce sipariş cümlesiyle başla',
    xpReward: 20,
    systemPrompt: `You are a friendly barista in a London café. The user is a Turkish beginner learning English.
    If the user writes in Turkish, respond in both English AND Turkish translation.
    After each user response, note mistakes with prefix "💡 Düzeltme:". Be very encouraging.`,
    openingMessage: 'Hello! (Merhaba!) Welcome to London Café! What would you like? (Ne istersiniz?)\n\n👉 Türkçe de yazabilirsin, sana hem İngilizce hem çevirisini göstereceğim!',
    vocabHints: [
      { word: 'Hello / Hi', meaning: 'Merhaba' },
      { word: 'Please', meaning: 'Lütfen' },
      { word: 'Thank you', meaning: 'Teşekkürler' },
      { word: 'A coffee please', meaning: 'Bir kahve lütfen' },
      { word: 'The bill', meaning: 'Hesap' },
      { word: 'How much?', meaning: 'Ne kadar?' },
    ],
  },
  {
    id: 'london-office',
    title: 'Londra\'da İş Görüşmesi',
    location: 'London, Office',
    emoji: '🏙️',
    difficulty: 'intermediate',
    language: 'en',
    stageType: 'business',
    modeType: 'challenge',
    estimatedMinutes: 4,
    levelRange: ['intermediate', 'advanced'],
    mission: 'Toplantı açılışında net hedef söyle',
    xpReward: 30,
    systemPrompt: `You are a British colleague in a business meeting. Speak in professional English (intermediate level).
    After each user response, note mistakes with prefix "💡 Düzeltme:".`,
    openingMessage: 'Good morning! Great to meet you. Please have a seat. Shall we get started?',
    vocabHints: [
      { word: 'Meeting', meaning: 'Toplantı' },
      { word: 'Project', meaning: 'Proje' },
      { word: 'I agree', meaning: 'Katılıyorum' },
      { word: 'In my opinion', meaning: 'Bence' },
      { word: 'Deadline', meaning: 'Son tarih' },
      { word: 'Budget', meaning: 'Bütçe' },
    ],
  },
];

export const getDailyScenarios = (language: string): Scenario[] => {
  const filtered = scenarios.filter(s => s.language === language);
  return filtered.length > 0 ? filtered : scenarios.filter(s => s.language === 'es');
};

export const getFirstSessionScenario = (language: string): Scenario => {
  const byLang = scenarios.filter(s => s.language === language);
  const firstCafe = byLang.find(s => s.stageType === 'cafe' && s.difficulty === 'beginner');
  if (firstCafe) return firstCafe;

  const fallbackCafe = scenarios.find(s => s.language === 'es' && s.stageType === 'cafe' && s.difficulty === 'beginner');
  if (fallbackCafe) return fallbackCafe;

  return scenarios[0];
};

export const getTodaysMissionScenario = (language: string): Scenario => {
  const byLang = scenarios.filter(s => s.language === language);
  const quickMission = byLang.find(s => s.stageType === 'cafe' && (s.estimatedMinutes ?? 3) <= 3);
  if (quickMission) return quickMission;

  return getFirstSessionScenario(language);
};

export const SUPPORTED_LANGUAGES = [
  { code: 'es', name: 'İspanyolca', flag: '🇪🇸' },
  { code: 'fr', name: 'Fransızca', flag: '🇫🇷' },
  { code: 'de', name: 'Almanca', flag: '🇩🇪' },
  { code: 'it', name: 'İtalyanca', flag: '🇮🇹' },
  { code: 'en', name: 'İngilizce', flag: '🇬🇧' },
];
