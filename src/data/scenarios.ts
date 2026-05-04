import { Scenario, UserIdentity } from '../types';
import { SCENARIO_ENRICHMENTS } from './scenarioEnrichments';

export type ScenePrepPlan = {
  reasonLine: string;
  vocabWarmup: {
    title: string;
    words: string[];
  };
  phraseCheck: {
    title: string;
    natural: string;
    awkward: string;
  };
  speakingWarmup: {
    title: string;
    line: string;
  };
};

const scenarioDefinitions: Scenario[] = [
  // SPANISH
  {
    id: 'cafe-barcelona',
    title: 'Kafede Sipariş',
    location: 'Barcelona, Cafe',
    emoji: '☕',
    backgroundImage: 'https://images.unsplash.com/photo-1521017432531-fbd92d768814?w=600&h=400&fit=crop&q=70',
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
    openingMessage: '¡Buenos días! (Günaydın!) Bienvenido a Café Barcelona. ¿Qué quieres tomar? ☕',
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
    backgroundImage: 'https://images.unsplash.com/photo-1743080374202-f2f211fd990d?w=600&h=400&fit=crop&q=70',
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
    openingMessage: '¡Hola! (Merhaba!) Parece que estás perdido. ¿Necesitas ayuda? (Kaybolmuş gibi görünüyorsun. Yardıma ihtiyacın var mı?)',
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
    backgroundImage: 'https://images.unsplash.com/photo-1497366754035-f200968a677a?w=600&h=400&fit=crop&q=70',
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
    backgroundImage: 'https://images.unsplash.com/photo-1470229722913-7c0e2dbbafd3?w=600&h=400&fit=crop&q=70',
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
  {
    id: 'football-madrid',
    title: 'Futbol Sohbeti',
    location: 'Madrid, Sports Bar',
    emoji: '⚽',
    backgroundImage: 'https://images.unsplash.com/photo-1518091043644-c1d4457512c6?w=600&h=400&fit=crop&q=70',
    difficulty: 'beginner',
    language: 'es',
    stageType: 'social',
    sceneCategory: 'sports',
    sceneTopic: 'football',
    modeType: 'normal',
    estimatedMinutes: 3,
    levelRange: ['beginner', 'intermediate'],
    mission: 'Maç hakkında kısa ve doğal bir sohbet başlat',
    xpReward: 22,
    systemPrompt: `You are a friendly Spanish football fan watching a match in a sports bar. Keep the Spanish natural but accessible. Ask about teams, the score, and favorite players. Correct only briefly with "💡 Düzeltme:".`,
    openingMessage: '¡Qué partidazo! ¿De qué equipo eres?',
    vocabHints: [
      { word: 'El partido', meaning: 'Maç' },
      { word: 'El equipo', meaning: 'Takım' },
      { word: 'El gol', meaning: 'Gol' },
      { word: 'El jugador', meaning: 'Oyuncu' },
      { word: 'Vamos', meaning: 'Haydi' },
    ],
  },
  {
    id: 'basketball-valencia',
    title: 'Basketbol Molası',
    location: 'Valencia, Court',
    emoji: '🏀',
    backgroundImage: 'https://images.unsplash.com/photo-1546519638-68e109498ffc?w=600&h=400&fit=crop&q=70',
    difficulty: 'beginner',
    language: 'es',
    stageType: 'social',
    sceneCategory: 'sports',
    sceneTopic: 'basketball',
    modeType: 'normal',
    estimatedMinutes: 3,
    levelRange: ['beginner', 'intermediate'],
    mission: 'Maçtan sonra kısa bir tanışma ve yorum yap',
    xpReward: 22,
    systemPrompt: `You are a friendly person at a basketball court in Valencia. Speak casual Spanish. Help the user comment on the game and ask one simple follow-up question.`,
    openingMessage: '¡Buen tiro! ¿Juegas a menudo aquí?',
    vocabHints: [
      { word: 'El tiro', meaning: 'Şut' },
      { word: 'La cancha', meaning: 'Saha' },
      { word: 'El equipo', meaning: 'Takım' },
      { word: 'Jugar', meaning: 'Oynamak' },
      { word: 'A menudo', meaning: 'Sık sık' },
    ],
  },
  {
    id: 'horse-riding-sevilla',
    title: 'Atçılık Dersinde',
    location: 'Sevilla, Riding Club',
    emoji: '🐎',
    backgroundImage: 'https://images.unsplash.com/photo-1553284965-83fd3e82fa5a?w=600&h=400&fit=crop&q=70',
    difficulty: 'intermediate',
    language: 'es',
    stageType: 'social',
    sceneCategory: 'sports',
    sceneTopic: 'horseRiding',
    modeType: 'challenge',
    estimatedMinutes: 4,
    levelRange: ['intermediate', 'advanced'],
    mission: 'Eğitmenden yönlendirme iste ve güvenliğini teyit et',
    xpReward: 26,
    systemPrompt: `You are a calm riding instructor in Sevilla. Speak clear Spanish. The scene is about asking for instructions, comfort, and safety during a riding lesson.`,
    openingMessage: 'Antes de montar, dime: ¿has montado a caballo antes?',
    vocabHints: [
      { word: 'El caballo', meaning: 'At' },
      { word: 'Montar', meaning: 'Binmek' },
      { word: 'Despacio', meaning: 'Yavaşça' },
      { word: 'Seguro', meaning: 'Güvenli' },
      { word: 'La clase', meaning: 'Ders' },
    ],
  },
  {
    id: 'motorsport-catalunya',
    title: 'Motorsporları Sohbeti',
    location: 'Catalunya, Track',
    emoji: '🏎️',
    backgroundImage: 'https://images.unsplash.com/photo-1503736334956-4c8f8e92946d?w=600&h=400&fit=crop&q=70',
    difficulty: 'intermediate',
    language: 'es',
    stageType: 'social',
    sceneCategory: 'sports',
    sceneTopic: 'motorsports',
    modeType: 'challenge',
    estimatedMinutes: 4,
    levelRange: ['intermediate', 'advanced'],
    mission: 'Yarış, pilot ve tur zamanı hakkında fikir belirt',
    xpReward: 26,
    systemPrompt: `You are a motorsport fan at a race track in Catalunya. Speak energetic but natural Spanish. Ask about drivers, speed, and the race moment.`,
    openingMessage: '¡Ese adelantamiento fue increíble! ¿A qué piloto sigues?',
    vocabHints: [
      { word: 'La carrera', meaning: 'Yarış' },
      { word: 'El piloto', meaning: 'Pilot' },
      { word: 'La vuelta', meaning: 'Tur' },
      { word: 'Adelantar', meaning: 'Geçmek' },
      { word: 'Rápido', meaning: 'Hızlı' },
    ],
  },
  {
    id: 'recipe-valencia',
    title: 'Yemek Tarifi Konuşması',
    location: 'Valencia, Kitchen',
    emoji: '🥘',
    backgroundImage: 'https://images.unsplash.com/photo-1556911220-bff31c812dba?w=600&h=400&fit=crop&q=70',
    difficulty: 'beginner',
    language: 'es',
    stageType: 'cafe',
    sceneCategory: 'food',
    sceneTopic: 'recipe',
    modeType: 'normal',
    estimatedMinutes: 3,
    levelRange: ['beginner', 'intermediate'],
    mission: 'Bir tarifin malzemelerini ve adımlarını sor',
    xpReward: 22,
    systemPrompt: `You are a friendly home cook in Valencia explaining a simple recipe. Use practical Spanish about ingredients, steps, and timing.`,
    openingMessage: 'Hoy vamos a preparar algo sencillo. ¿Quieres saber los ingredientes primero?',
    vocabHints: [
      { word: 'La receta', meaning: 'Tarif' },
      { word: 'Los ingredientes', meaning: 'Malzemeler' },
      { word: 'Cortar', meaning: 'Kesmek' },
      { word: 'Cocinar', meaning: 'Pişirmek' },
      { word: 'Primero', meaning: 'İlk olarak' },
    ],
  },
  {
    id: 'restaurant-sevilla',
    title: 'Restoranda Öneri İsteme',
    location: 'Sevilla, Restaurant',
    emoji: '🍽️',
    backgroundImage: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=600&h=400&fit=crop&q=70',
    difficulty: 'beginner',
    language: 'es',
    stageType: 'cafe',
    sceneCategory: 'food',
    sceneTopic: 'restaurant',
    modeType: 'normal',
    estimatedMinutes: 3,
    levelRange: ['beginner'],
    mission: 'Garsondan yemek önerisi iste ve tercihini söyle',
    xpReward: 22,
    systemPrompt: `You are a warm waiter in Sevilla. Help the user ask for recommendations, explain food preferences, and order politely in Spanish.`,
    openingMessage: 'Buenas noches. ¿Quieres que te recomiende algo de la casa?',
    vocabHints: [
      { word: 'Recomendar', meaning: 'Önermek' },
      { word: 'El plato', meaning: 'Yemek' },
      { word: 'Sin carne', meaning: 'Etsiz' },
      { word: 'Picante', meaning: 'Acı' },
      { word: 'La cuenta', meaning: 'Hesap' },
    ],
  },

  // FRENCH
  {
    id: 'paris-cafe',
    title: 'Paris Kafesi',
    location: 'Paris, Café',
    emoji: '🥐',
    backgroundImage: 'https://images.unsplash.com/photo-1502602898657-3e91760cbb34?w=600&h=400&fit=crop&q=70',
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
    openingMessage: 'Bonjour! (Merhaba!) Bienvenue au Café de Paris. Qu\'est-ce que vous voulez? (Ne istersiniz?)',
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
    backgroundImage: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=600&h=400&fit=crop&q=70',
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
    backgroundImage: 'https://images.unsplash.com/photo-1490481651871-ab68de25d43d?w=600&h=400&fit=crop&q=70',
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
    backgroundImage: 'https://images.unsplash.com/photo-1488459716781-31db52582fe9?w=600&h=400&fit=crop&q=70',
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
    openingMessage: 'Guten Morgen! (Günaydın!) Willkommen auf dem Berliner Markt! Was darf es sein? (Ne istersiniz?)',
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
    backgroundImage: 'https://images.unsplash.com/photo-1560969184-10fe8719e047?w=600&h=400&fit=crop&q=70',
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
    backgroundImage: 'https://images.unsplash.com/photo-1454496522488-7a8e488e8606?w=600&h=400&fit=crop&q=70',
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
    backgroundImage: 'https://images.unsplash.com/photo-1552832230-c0197dd311b5?w=600&h=400&fit=crop&q=70',
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
    openingMessage: 'Ciao! (Merhaba!) Benvenuto al Bar Roma! Cosa prendi? (Ne alırsın?)',
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
    backgroundImage: 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=600&h=400&fit=crop&q=70',
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

  // SPANISH (extra)
  {
    id: 'madrid-party',
    title: 'Partide Tanışma',
    location: 'Madrid, House Party',
    emoji: '🎉',
    backgroundImage: 'https://images.unsplash.com/photo-1529543544282-ea669407fca3?w=600&h=400&fit=crop&q=70',
    difficulty: 'beginner',
    language: 'es',
    stageType: 'social',
    modeType: 'normal',
    estimatedMinutes: 3,
    levelRange: ['beginner', 'intermediate'],
    mission: 'Yeni biriyle tanış ve 2 ortak konu bul',
    xpReward: 22,
    systemPrompt: `You are a friendly Spanish person at a house party in Madrid. The user is a Turkish beginner learning Spanish.
    If the user writes in Turkish or English, respond in both Spanish AND Turkish translation.
    After each user response, note mistakes with prefix "💡 Düzeltme:". Keep the energy fun and light.`,
    openingMessage: '¡Hola! No te había visto antes. ¿Cómo te llamas? (Merhaba! Seni daha önce görmedim. Adın ne?)',
    vocabHints: [
      { word: '¿Cómo te llamas?', meaning: 'Adın ne?' },
      { word: 'Me llamo...', meaning: 'Adım...' },
      { word: '¿De dónde eres?', meaning: 'Nerelisin?' },
      { word: 'Soy de...', meaning: '...\'lıyım' },
      { word: '¿A qué te dedicas?', meaning: 'Ne iş yapıyorsun?' },
      { word: 'Me gusta...', meaning: 'Seviyorum...' },
    ],
  },
  {
    id: 'barcelona-hotel',
    title: 'Otele Check-in',
    location: 'Barcelona, Hotel',
    emoji: '🏨',
    backgroundImage: 'https://images.unsplash.com/photo-1551882547-ff40c4a49b6b?w=600&h=400&fit=crop&q=70',
    difficulty: 'beginner',
    language: 'es',
    stageType: 'travel',
    modeType: 'survival',
    estimatedMinutes: 3,
    levelRange: ['beginner'],
    mission: 'Check-in yap ve oda bilgilerini öğren',
    xpReward: 22,
    systemPrompt: `You are a receptionist at a Barcelona hotel. The user is a Turkish beginner learning Spanish.
    If the user writes in Turkish or English, respond in both Spanish AND Turkish translation.
    After each user response, note mistakes with prefix "💡 Düzeltme:".`,
    openingMessage: '¡Buenas tardes! Bienvenido al Hotel Barcelona. ¿Tiene reserva? (İyi günler! Hotel Barcelona\'ya hoş geldiniz. Rezervasyonunuz var mı?)',
    vocabHints: [
      { word: 'La reserva', meaning: 'Rezervasyon' },
      { word: 'La habitación', meaning: 'Oda' },
      { word: 'El desayuno', meaning: 'Kahvaltı' },
      { word: '¿A qué hora...?', meaning: 'Saat kaçta...?' },
      { word: 'La llave', meaning: 'Anahtar' },
      { word: 'El ascensor', meaning: 'Asansör' },
    ],
  },

  // FRENCH (extra)
  {
    id: 'paris-office',
    title: 'Paris\'te İş Görüşmesi',
    location: 'Paris, Bureau',
    emoji: '💼',
    backgroundImage: 'https://images.unsplash.com/photo-1497366216548-37526070297c?w=600&h=400&fit=crop&q=70',
    difficulty: 'intermediate',
    language: 'fr',
    stageType: 'business',
    modeType: 'challenge',
    estimatedMinutes: 4,
    levelRange: ['intermediate', 'advanced'],
    mission: 'Kendini tanıt ve projeyi 2 cümleyle anlat',
    xpReward: 30,
    systemPrompt: `You are a French colleague in a Paris office meeting. Speak in professional intermediate French.
    After each user response, note mistakes with prefix "💡 Düzeltme:".`,
    openingMessage: 'Bonjour! Je suis ravi de vous rencontrer. Asseyez-vous, je vous en prie. Alors, parlez-moi un peu de vous.',
    vocabHints: [
      { word: 'Je me présente', meaning: 'Kendimi tanıtayım' },
      { word: 'Je travaille dans...', meaning: '...\'da çalışıyorum' },
      { word: 'Notre projet', meaning: 'Projemiz' },
      { word: 'Je suis d\'accord', meaning: 'Katılıyorum' },
      { word: 'Pouvez-vous répéter?', meaning: 'Tekrar eder misiniz?' },
      { word: 'Le budget', meaning: 'Bütçe' },
    ],
  },
  {
    id: 'nice-beach',
    title: 'Plajda Sohbet',
    location: 'Nice, Plage',
    emoji: '🏖️',
    backgroundImage: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=600&h=400&fit=crop&q=70',
    difficulty: 'beginner',
    language: 'fr',
    stageType: 'social',
    modeType: 'normal',
    estimatedMinutes: 3,
    levelRange: ['beginner', 'intermediate'],
    mission: 'Yanındaki kişiyle sohbet aç, tatil planını anlat',
    xpReward: 22,
    systemPrompt: `You are a friendly French person relaxing on the beach in Nice. The user is a Turkish beginner learning French.
    If the user writes in Turkish or English, respond in both French AND Turkish translation.
    After each user response, note mistakes with prefix "💡 Düzeltme:".`,
    openingMessage: 'Bonjour! Il fait beau aujourd\'hui, n\'est-ce pas? (Merhaba! Bugün hava çok güzel, değil mi?)',
    vocabHints: [
      { word: 'Il fait beau', meaning: 'Hava güzel' },
      { word: 'Je suis en vacances', meaning: 'Tatildeyim' },
      { word: 'D\'où venez-vous?', meaning: 'Nerelisiniz?' },
      { word: 'C\'est magnifique!', meaning: 'Muhteşem!' },
      { word: 'La mer', meaning: 'Deniz' },
      { word: 'J\'aime beaucoup', meaning: 'Çok seviyorum' },
    ],
  },

  // GERMAN (extra)
  {
    id: 'munich-party',
    title: 'Münih\'te Tanışma',
    location: 'München, Bar',
    emoji: '🍺',
    backgroundImage: 'https://images.unsplash.com/photo-1567696911572-a0efab22d6df?w=600&h=400&fit=crop&q=70',
    difficulty: 'beginner',
    language: 'de',
    stageType: 'social',
    modeType: 'normal',
    estimatedMinutes: 3,
    levelRange: ['beginner', 'intermediate'],
    mission: 'Biriyle tanış ve nereden geldiğini öğren',
    xpReward: 22,
    systemPrompt: `You are a friendly German person at a bar in Munich. The user is a Turkish beginner learning German.
    If the user writes in Turkish or English, respond in both German AND Turkish translation.
    After each user response, note mistakes with prefix "💡 Düzeltme:".`,
    openingMessage: 'Hallo! Ich habe dich hier noch nicht gesehen. Woher kommst du? (Merhaba! Seni burada daha önce görmedim. Nerelisin?)',
    vocabHints: [
      { word: 'Wie heißt du?', meaning: 'Adın ne?' },
      { word: 'Ich heiße...', meaning: 'Adım...' },
      { word: 'Woher kommst du?', meaning: 'Nerelisin?' },
      { word: 'Ich komme aus...', meaning: '...\'dan geliyorum' },
      { word: 'Was machst du?', meaning: 'Ne iş yapıyorsun?' },
      { word: 'Sehr angenehm!', meaning: 'Çok memnun oldum!' },
    ],
  },
  {
    id: 'frankfurt-airport',
    title: 'Frankfurt Havalimanı',
    location: 'Frankfurt, Flughafen',
    emoji: '✈️',
    backgroundImage: 'https://images.unsplash.com/photo-1436491865332-7a61a109cc05?w=600&h=400&fit=crop&q=70',
    difficulty: 'beginner',
    language: 'de',
    stageType: 'travel',
    modeType: 'survival',
    estimatedMinutes: 3,
    levelRange: ['beginner'],
    mission: 'Check-in say ve kapı numarasını öğren',
    xpReward: 22,
    systemPrompt: `You are an airline check-in agent at Frankfurt airport. The user is a Turkish beginner learning German.
    If the user writes in Turkish or English, respond in both German AND Turkish translation.
    After each user response, note mistakes with prefix "💡 Düzeltme:".`,
    openingMessage: 'Guten Tag! Willkommen am Frankfurter Flughafen. Darf ich bitte Ihren Reisepass sehen? (İyi günler! Frankfurt Havalimanına hoş geldiniz. Pasaportunuzu görebilir miyim?)',
    vocabHints: [
      { word: 'Der Reisepass', meaning: 'Pasaport' },
      { word: 'Das Gepäck', meaning: 'Bagaj' },
      { word: 'Das Gate', meaning: 'Kapı (uçuş)' },
      { word: 'Der Abflug', meaning: 'Kalkış' },
      { word: 'Verspätet', meaning: 'Gecikmeli' },
      { word: 'Der Sitzplatz', meaning: 'Koltuk' },
    ],
  },

  // ITALIAN (extra)
  {
    id: 'rome-metro',
    title: 'Roma Metrosu',
    location: 'Roma, Metro',
    emoji: '🚇',
    backgroundImage: 'https://images.unsplash.com/photo-1581009046738-f7a73b1dbc7e?w=600&h=400&fit=crop&q=70',
    difficulty: 'beginner',
    language: 'it',
    stageType: 'travel',
    modeType: 'survival',
    estimatedMinutes: 3,
    levelRange: ['beginner', 'intermediate'],
    mission: 'Doğru istasyona nasıl gidileceğini sor',
    xpReward: 22,
    systemPrompt: `You are a helpful Roman in the metro. The user is a Turkish beginner learning Italian.
    If the user writes in Turkish or English, respond in both Italian AND Turkish translation.
    After each user response, note mistakes with prefix "💡 Düzeltme:".`,
    openingMessage: 'Ciao! Sembra che tu sia perso. Posso aiutarti? (Merhaba! Kaybolmuş gibi görünüyorsun. Yardımcı olabilir miyim?)',
    vocabHints: [
      { word: 'Dov\'è...?', meaning: 'Nerede...?' },
      { word: 'La fermata', meaning: 'Durak' },
      { word: 'A destra / sinistra', meaning: 'Sağa / sola' },
      { word: 'Dritto', meaning: 'Düz devam et' },
      { word: 'Il biglietto', meaning: 'Bilet' },
      { word: 'Quanto ci vuole?', meaning: 'Ne kadar sürer?' },
    ],
  },
  {
    id: 'milan-office',
    title: 'Milano\'da İş Toplantısı',
    location: 'Milano, Ufficio',
    emoji: '💼',
    backgroundImage: 'https://images.unsplash.com/photo-1503387762-592deb58ef4e?w=600&h=400&fit=crop&q=70',
    difficulty: 'intermediate',
    language: 'it',
    stageType: 'business',
    modeType: 'challenge',
    estimatedMinutes: 4,
    levelRange: ['intermediate', 'advanced'],
    mission: 'Toplantıda öneride bulun ve gerekçe ver',
    xpReward: 30,
    systemPrompt: `You are an Italian colleague in a Milan office meeting. Speak in professional intermediate Italian.
    After each user response, note mistakes with prefix "💡 Düzeltme:".`,
    openingMessage: 'Buongiorno! Benvenuto nel nostro ufficio di Milano. Si accomodi. Allora, di cosa voleva parlarmi?',
    vocabHints: [
      { word: 'La riunione', meaning: 'Toplantı' },
      { word: 'La proposta', meaning: 'Öneri' },
      { word: 'Sono d\'accordo', meaning: 'Katılıyorum' },
      { word: 'Il budget', meaning: 'Bütçe' },
      { word: 'La scadenza', meaning: 'Son tarih' },
      { word: 'Secondo me', meaning: 'Bence' },
    ],
  },
  {
    id: 'florence-social',
    title: 'Floransa\'da Tanışma',
    location: 'Firenze, Piazza',
    emoji: '🎨',
    backgroundImage: 'https://images.unsplash.com/photo-1541370976299-4d24ebbc9077?w=600&h=400&fit=crop&q=70',
    difficulty: 'beginner',
    language: 'it',
    stageType: 'social',
    modeType: 'normal',
    estimatedMinutes: 3,
    levelRange: ['beginner', 'intermediate'],
    mission: 'Bir turistle sohbet et, şehir hakkında konuş',
    xpReward: 22,
    systemPrompt: `You are a friendly local in Florence's main piazza. The user is a Turkish beginner learning Italian.
    If the user writes in Turkish or English, respond in both Italian AND Turkish translation.
    After each user response, note mistakes with prefix "💡 Düzeltme:".`,
    openingMessage: 'Ciao! È la tua prima volta a Firenze? (Merhaba! Floransa\'ya ilk gelişin mi?)',
    vocabHints: [
      { word: 'È bellissimo!', meaning: 'Çok güzel!' },
      { word: 'Da dove vieni?', meaning: 'Nerelisin?' },
      { word: 'Mi piace molto', meaning: 'Çok seviyorum' },
      { word: 'Quanti giorni?', meaning: 'Kaç gün?' },
      { word: 'Il museo', meaning: 'Müze' },
      { word: 'Il centro storico', meaning: 'Tarihi merkez' },
    ],
  },

  // ENGLISH
  {
    id: 'london-cafe',
    title: 'Londra Kafesi',
    location: 'London, Café',
    emoji: '🫖',
    backgroundImage: 'https://images.unsplash.com/photo-1513635269975-59663e0ac1ad?w=600&h=400&fit=crop&q=70',
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
    openingMessage: 'Hello! (Merhaba!) Welcome to London Café! What would you like? (Ne istersiniz?)',
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
    backgroundImage: 'https://images.unsplash.com/photo-1486325212027-8081e485255e?w=600&h=400&fit=crop&q=70',
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
  {
    id: 'london-underground',
    title: 'Londra Metrosu',
    location: 'London, Underground',
    emoji: '🚇',
    backgroundImage: 'https://images.unsplash.com/photo-1743080374202-f2f211fd990d?w=600&h=400&fit=crop&q=70',
    difficulty: 'beginner',
    language: 'en',
    stageType: 'travel',
    modeType: 'survival',
    estimatedMinutes: 3,
    levelRange: ['beginner', 'intermediate'],
    mission: 'Doğru hatta binip aktarma noktasını sor',
    xpReward: 22,
    systemPrompt: `You are a helpful Londoner in the Underground. The user is a Turkish beginner learning English.
    If the user writes in Turkish, respond in both English AND Turkish translation.
    After each user response, note mistakes with prefix "💡 Düzeltme:". Be very encouraging.`,
    openingMessage: 'Hello! You look a bit lost. Can I help you? (Merhaba! Biraz kaybolmuş gibisin. Yardımcı olabilir miyim?)',
    vocabHints: [
      { word: 'Which line?', meaning: 'Hangi hat?' },
      { word: 'Change at...', meaning: '...\'da aktarma yap' },
      { word: 'Two stops away', meaning: 'İki durak ötede' },
      { word: 'Oyster card', meaning: 'Ulaşım kartı' },
      { word: 'Exit / Entrance', meaning: 'Çıkış / Giriş' },
      { word: 'Mind the gap', meaning: 'Boşluğa dikkat' },
    ],
  },
  {
    id: 'london-pub',
    title: 'Londra Pub\'ında Sohbet',
    location: 'London, Pub',
    emoji: '🍻',
    backgroundImage: 'https://images.unsplash.com/photo-1525268323446-0505b6fe7778?w=600&h=400&fit=crop&q=70',
    difficulty: 'intermediate',
    language: 'en',
    stageType: 'social',
    modeType: 'story',
    estimatedMinutes: 4,
    levelRange: ['intermediate', 'advanced'],
    mission: 'En az 3 konu hakkında doğal sohbet kur',
    xpReward: 26,
    systemPrompt: `You are a friendly British person at a London pub. Speak in casual English (intermediate level).
    After each user response, note mistakes with prefix "💡 Düzeltme:". Use British slang occasionally.`,
    openingMessage: 'Alright! Haven\'t seen you here before. What are you having? (Merhaba! Seni burada daha önce görmedim. Ne içiyorsun?)',
    vocabHints: [
      { word: 'Cheers!', meaning: 'Şerefe! / Teşekkürler!' },
      { word: 'Fancy a pint?', meaning: 'Bir bira ister misin?' },
      { word: 'Mate', meaning: 'Arkadaş (İngiliz argo)' },
      { word: 'How\'s it going?', meaning: 'Nasılsın?' },
      { word: 'I\'m from...', meaning: '...\'dan geliyorum' },
      { word: 'What do you do?', meaning: 'Ne iş yapıyorsun?' },
    ],
  },

  // ── ENGLISH — EXTRA VARIETY ───────────────────────────────────────────────
  {
    id: 'nyc-diner',
    title: 'New York Diner',
    location: 'New York, Diner',
    emoji: '🥞',
    backgroundImage: 'https://images.unsplash.com/photo-1571997478779-2adcbbe9ab2f?w=600&h=400&fit=crop&q=70',
    difficulty: 'beginner',
    language: 'en',
    stageType: 'cafe',
    modeType: 'normal',
    estimatedMinutes: 3,
    levelRange: ['beginner'],
    mission: 'Kahvaltı siparişini ver ve ekstra bir şey iste',
    xpReward: 20,
    systemPrompt: `You are a fast-talking New York diner waiter. Speak in friendly, slightly rushed American English.
    If the user writes in Turkish, respond in both English AND Turkish translation.
    After each user response, note mistakes with prefix "💡 Düzeltme:".`,
    openingMessage: 'Hey there! Welcome to Joe\'s Diner. What can I get ya this morning?',
    vocabHints: [
      { word: 'Scrambled eggs', meaning: 'Çırpılmış yumurta' },
      { word: 'To go / For here', meaning: 'Paket / Burada' },
      { word: 'Refill', meaning: 'Yeniden doldurmak' },
      { word: 'Check, please', meaning: 'Hesap, lütfen' },
      { word: 'On the side', meaning: 'Ayrı olarak' },
      { word: 'Sunny side up', meaning: 'Sahanda (tek taraflı)' },
    ],
  },
  {
    id: 'airport-checkin',
    title: 'Havalimanı Check-in',
    location: 'Heathrow Airport, Check-in',
    emoji: '✈️',
    backgroundImage: 'https://images.unsplash.com/photo-1436491865332-7a61a109cc05?w=600&h=400&fit=crop&q=70',
    difficulty: 'beginner',
    language: 'en',
    stageType: 'travel',
    modeType: 'survival',
    estimatedMinutes: 3,
    levelRange: ['beginner', 'intermediate'],
    mission: 'Check-in işlemini tamamla ve koltuk tercihini söyle',
    xpReward: 22,
    systemPrompt: `You are an airline check-in agent at Heathrow. Speak clearly and professionally but warmly.
    If the user writes in Turkish, respond in both English AND Turkish.
    Note mistakes with prefix "💡 Düzeltme:".`,
    openingMessage: 'Good morning! Welcome to BA check-in. Can I see your passport and booking reference, please?',
    vocabHints: [
      { word: 'Boarding pass', meaning: 'Biniş kartı' },
      { word: 'Window / Aisle seat', meaning: 'Pencere / Koridor koltuğu' },
      { word: 'Carry-on bag', meaning: 'El bagajı' },
      { word: 'Gate number', meaning: 'Kapı numarası' },
      { word: 'Departure time', meaning: 'Kalkış saati' },
      { word: 'Any liquids?', meaning: 'Sıvı bir şey var mı?' },
    ],
  },
  {
    id: 'hotel-checkin',
    title: 'Otel Check-in',
    location: 'Edinburgh, Hotel',
    emoji: '🏨',
    backgroundImage: 'https://images.unsplash.com/photo-1551882547-ff40c4a49b6b?w=600&h=400&fit=crop&q=70',
    difficulty: 'beginner',
    language: 'en',
    stageType: 'travel',
    modeType: 'normal',
    estimatedMinutes: 3,
    levelRange: ['beginner'],
    mission: 'Check-in yap ve bir sorununu dile getir',
    xpReward: 20,
    systemPrompt: `You are a polite hotel receptionist in Edinburgh. Speak in clear, standard English.
    If the user writes in Turkish, respond in both English AND Turkish.
    Note mistakes with prefix "💡 Düzeltme:".`,
    openingMessage: 'Good evening and welcome! Do you have a reservation with us?',
    vocabHints: [
      { word: 'Reservation', meaning: 'Rezervasyon' },
      { word: 'Room number', meaning: 'Oda numarası' },
      { word: 'Wi-Fi password', meaning: 'Şifre' },
      { word: 'Check-out time', meaning: 'Çıkış saati' },
      { word: 'Room service', meaning: 'Oda servisi' },
      { word: 'Single / Double room', meaning: 'Tek / Çift kişilik oda' },
    ],
  },
  {
    id: 'job-interview',
    title: 'İş Mülakatı',
    location: 'London, HR Office',
    emoji: '💼',
    backgroundImage: 'https://images.unsplash.com/photo-1553877522-43269d4ea984?w=600&h=400&fit=crop&q=70',
    difficulty: 'intermediate',
    language: 'en',
    stageType: 'business',
    modeType: 'challenge',
    estimatedMinutes: 5,
    levelRange: ['intermediate', 'advanced'],
    mission: 'Kendini tanıt ve bir güçlü yönünü örnekle anlat',
    xpReward: 32,
    systemPrompt: `You are a professional HR interviewer at a London tech company. Speak in formal but friendly English.
    Ask typical interview questions one at a time. Note mistakes with prefix "💡 Düzeltme:".`,
    openingMessage: 'Hi, come on in! Thanks for coming in today. So — tell me a little bit about yourself.',
    vocabHints: [
      { word: 'Strengths / Weaknesses', meaning: 'Güçlü / Zayıf yönler' },
      { word: 'Previous experience', meaning: 'Önceki deneyim' },
      { word: 'I\'m responsible for…', meaning: '…den sorumluyum' },
      { word: 'Team player', meaning: 'Takım oyuncusu' },
      { word: 'I\'d like to contribute', meaning: 'Katkıda bulunmak istiyorum' },
      { word: 'Challenging but rewarding', meaning: 'Zorlu ama tatmin edici' },
    ],
  },
  {
    id: 'flatmate-conflict',
    title: 'Ev Arkadaşıyla Anlaşmazlık',
    location: 'London, Shared Flat',
    emoji: '🏠',
    backgroundImage: 'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=600&h=400&fit=crop&q=70',
    difficulty: 'intermediate',
    language: 'en',
    stageType: 'social',
    modeType: 'story',
    estimatedMinutes: 4,
    levelRange: ['intermediate'],
    mission: 'Sorunu nazikçe dile getir ve çözüm öner',
    xpReward: 26,
    systemPrompt: `You are a British flatmate who is mildly frustrated about a shared living issue (noise, dishes, rent).
    Speak in casual but assertive English. Note mistakes with prefix "💡 Düzeltme:".`,
    openingMessage: 'Hey, can we actually talk for a second? It\'s about the flat...',
    vocabHints: [
      { word: 'Sort it out', meaning: 'Halletmek' },
      { word: 'Take turns', meaning: 'Sırayla yapmak' },
      { word: 'Honestly', meaning: 'Dürüstçe söylemek gerekirse' },
      { word: 'Fair enough', meaning: 'Makul / Kabul' },
      { word: 'I\'d appreciate if…', meaning: '…yapsan sevinirim' },
      { word: 'Let\'s split', meaning: 'Bölüşelim' },
    ],
  },
  {
    id: 'gym-small-talk',
    title: 'Spor Salonunda Sohbet',
    location: 'London, Gym',
    emoji: '🏋️',
    backgroundImage: 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=600&h=400&fit=crop&q=70',
    difficulty: 'beginner',
    language: 'en',
    stageType: 'social',
    modeType: 'normal',
    estimatedMinutes: 3,
    levelRange: ['beginner', 'intermediate'],
    mission: 'Tanımadığın biriyle 3 tur rahat sohbet kur',
    xpReward: 22,
    systemPrompt: `You are a friendly gym-goer in London. Speak in casual, upbeat English.
    If the user writes in Turkish, respond in both English AND Turkish.
    Note mistakes with prefix "💡 Düzeltme:".`,
    openingMessage: 'Hey, are you done with that machine? Oh wait — you\'re new here, right? I haven\'t seen you before!',
    vocabHints: [
      { word: 'Work out', meaning: 'Egzersiz yapmak' },
      { word: 'Reps / Sets', meaning: 'Tekrar / Set' },
      { word: 'Spot someone', meaning: 'Birine yardım etmek' },
      { word: 'Cool down', meaning: 'Soğuma / Dinlenme' },
      { word: 'I\'m into…', meaning: '…ile ilgileniyorum' },
      { word: 'How long have you been…?', meaning: 'Ne zamandır…?' },
    ],
  },
  {
    id: 'doctors-appointment',
    title: 'Doktor Randevusu',
    location: 'London, GP Clinic',
    emoji: '🩺',
    backgroundImage: 'https://images.unsplash.com/photo-1579684385127-1ef15d508118?w=600&h=400&fit=crop&q=70',
    difficulty: 'intermediate',
    language: 'en',
    stageType: 'survival',
    modeType: 'survival',
    estimatedMinutes: 4,
    levelRange: ['beginner', 'intermediate'],
    mission: 'Şikayetini net anlat ve doktorun tavsiyesini anla',
    xpReward: 28,
    systemPrompt: `You are a calm, professional British GP (general practitioner). Speak clearly and ask one question at a time.
    If the user writes in Turkish, respond in both English AND Turkish.
    Note mistakes with prefix "💡 Düzeltme:".`,
    openingMessage: 'Hello, come on in and have a seat. What seems to be the problem today?',
    vocabHints: [
      { word: 'Symptoms', meaning: 'Belirtiler' },
      { word: 'Prescription', meaning: 'Reçete' },
      { word: 'How long have you had…?', meaning: 'Ne zamandır…var?' },
      { word: 'It hurts when I…', meaning: '…yaptığımda acıyor' },
      { word: 'Painkiller', meaning: 'Ağrı kesici' },
      { word: 'Follow-up appointment', meaning: 'Kontrol randevusu' },
    ],
  },
  {
    id: 'coffee-chat-colleague',
    title: 'İş Arkadaşıyla Kahve Molası',
    location: 'London, Office Kitchen',
    emoji: '☕',
    backgroundImage: 'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=600&h=400&fit=crop&q=70',
    difficulty: 'beginner',
    language: 'en',
    stageType: 'social',
    modeType: 'normal',
    estimatedMinutes: 3,
    levelRange: ['beginner'],
    mission: 'Çalışma hakkında sohbet başlat ve devam ettir',
    xpReward: 20,
    systemPrompt: `You are a friendly British colleague grabbing a coffee in the office kitchen.
    Speak in relaxed, casual office English. If the user writes in Turkish, respond in both English AND Turkish.
    Note mistakes with prefix "💡 Düzeltme:".`,
    openingMessage: 'Oh hey! Coffee break already? I need one too, honestly. How\'s your day going?',
    vocabHints: [
      { word: 'Hectic', meaning: 'Çok yoğun / Çılgın' },
      { word: 'Catch up on', meaning: 'Yetişmek / Telafi etmek' },
      { word: 'Wrap up', meaning: 'Bitirmek / Sonuçlandırmak' },
      { word: 'Running behind', meaning: 'Geride kalmak' },
      { word: 'Weekend plans?', meaning: 'Hafta sonu planın?' },
      { word: 'I\'m swamped', meaning: 'Boğuluyorum (işe)' },
    ],
  },
  {
    id: 'supermarket-queue',
    title: 'Markette Sıra Beklemek',
    location: 'London, Supermarket',
    emoji: '🛒',
    backgroundImage: 'https://images.unsplash.com/photo-1542838132-92c53300491e?w=600&h=400&fit=crop&q=70',
    difficulty: 'beginner',
    language: 'en',
    stageType: 'social',
    modeType: 'normal',
    estimatedMinutes: 3,
    levelRange: ['beginner'],
    mission: 'Kasiyerle doğal bir mini sohbet kur',
    xpReward: 18,
    systemPrompt: `You are a chatty British supermarket cashier. Speak in simple, everyday English.
    If the user writes in Turkish, respond in both English AND Turkish.
    Note mistakes with prefix "💡 Düzeltme:".`,
    openingMessage: 'Hello there! Did you find everything alright today?',
    vocabHints: [
      { word: 'Loyalty card', meaning: 'Müşteri kartı' },
      { word: 'Cash or card?', meaning: 'Nakit mi kart mı?' },
      { word: 'Bag for life', meaning: 'Bez poşet' },
      { word: 'Self-checkout', meaning: 'Otomatik kasa' },
      { word: 'Receipt', meaning: 'Fiş / Makbuz' },
      { word: 'Contactless', meaning: 'Temassız ödeme' },
    ],
  },
  {
    id: 'presentation-feedback',
    title: 'Sunum Sonrası Geri Bildirim',
    location: 'London, Conference Room',
    emoji: '📊',
    backgroundImage: 'https://images.unsplash.com/photo-1552664730-d307ca884978?w=600&h=400&fit=crop&q=70',
    difficulty: 'advanced',
    language: 'en',
    stageType: 'business',
    modeType: 'challenge',
    estimatedMinutes: 5,
    levelRange: ['intermediate', 'advanced'],
    mission: 'Eleştiriyi profesyonelce al ve savunma yap',
    xpReward: 35,
    systemPrompt: `You are a senior manager giving constructive feedback after a presentation.
    Speak in formal professional English. Push back politely on weak answers.
    Note mistakes with prefix "💡 Düzeltme:".`,
    openingMessage: 'Thanks for the presentation. Overall, solid effort. But I have a few questions about the data on slide four — can you walk me through your thinking?',
    vocabHints: [
      { word: 'I take your point', meaning: 'Noktanı anlıyorum' },
      { word: 'To elaborate', meaning: 'Detaylandırmak' },
      { word: 'Key takeaway', meaning: 'Ana çıkarım' },
      { word: 'Constructive criticism', meaning: 'Yapıcı eleştiri' },
      { word: 'Actionable', meaning: 'Uygulanabilir' },
      { word: 'Bottom line', meaning: 'Sonuç olarak' },
    ],
  },
  {
    id: 'lost-in-city',
    title: 'Şehirde Kaybolmak',
    location: 'Manchester, City Centre',
    emoji: '🗺️',
    backgroundImage: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=600&h=400&fit=crop&q=70',
    difficulty: 'beginner',
    language: 'en',
    stageType: 'travel',
    modeType: 'survival',
    estimatedMinutes: 3,
    levelRange: ['beginner'],
    mission: 'Yolu sor ve teyit et',
    xpReward: 20,
    systemPrompt: `You are a friendly local in Manchester. Speak in clear, approachable English with slight Northern warmth.
    If the user writes in Turkish, respond in both English AND Turkish.
    Note mistakes with prefix "💡 Düzeltme:".`,
    openingMessage: 'Hiya! You look a bit lost — are you alright? Where are you trying to get to?',
    vocabHints: [
      { word: 'Straight on', meaning: 'Düz devam et' },
      { word: 'Turn left / right', meaning: 'Sola / Sağa dön' },
      { word: 'You can\'t miss it', meaning: 'Göremezsin olmaz' },
      { word: 'About five minutes walk', meaning: 'Yaklaşık 5 dakika yürüme' },
      { word: 'Landmark', meaning: 'Tanınmış yer / Nirengi noktası' },
      { word: 'Next to / Opposite', meaning: 'Yanında / Karşısında' },
    ],
  },
  {
    id: 'phone-call-complaint',
    title: 'Müşteri Hizmetlerine Şikayet',
    location: 'Remote, Phone Call',
    emoji: '📞',
    backgroundImage: 'https://images.unsplash.com/photo-1423666639041-f56000c27a9a?w=600&h=400&fit=crop&q=70',
    difficulty: 'intermediate',
    language: 'en',
    stageType: 'survival',
    modeType: 'challenge',
    estimatedMinutes: 4,
    levelRange: ['intermediate', 'advanced'],
    mission: 'Sorunu açıkla ve çözüm talep et',
    xpReward: 28,
    systemPrompt: `You are a polite but slightly robotic British customer service agent.
    Ask for reference numbers, put the user "on hold" briefly, offer scripted solutions.
    Note mistakes with prefix "💡 Düzeltme:".`,
    openingMessage: 'Good afternoon, thank you for calling. My name\'s Alex. Can I take your name and reference number, please?',
    vocabHints: [
      { word: 'Reference number', meaning: 'Referans numarası' },
      { word: 'I\'d like to report…', meaning: '…bildirmek istiyorum' },
      { word: 'Refund', meaning: 'İade' },
      { word: 'Escalate the issue', meaning: 'Üst birime iletmek' },
      { word: 'Hold the line', meaning: 'Lütfen bekleyin' },
      { word: 'Compensation', meaning: 'Tazminat' },
    ],
  },
  {
    id: 'first-date-coffee',
    title: 'İlk Buluşma',
    location: 'London, Coffee Shop',
    emoji: '☕',
    backgroundImage: 'https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?w=600&h=400&fit=crop&q=70',
    difficulty: 'intermediate',
    language: 'en',
    stageType: 'social',
    modeType: 'story',
    estimatedMinutes: 4,
    levelRange: ['intermediate'],
    mission: 'Karşındakini tanı ve ilgi çekici bir şey anlat',
    xpReward: 26,
    systemPrompt: `You are on a casual first date at a coffee shop. Speak in warm, curious, conversational English.
    Be playful but not over the top. Note mistakes with prefix "💡 Düzeltme:".`,
    openingMessage: 'Hey! So glad you came — I was a little nervous! Is this place okay for you?',
    vocabHints: [
      { word: 'What do you do for fun?', meaning: 'Eğlence olarak ne yaparsın?' },
      { word: 'I\'m really into…', meaning: '…ile çok ilgileniyorum' },
      { word: 'That\'s so cool!', meaning: 'Bu çok harika!' },
      { word: 'We should do this again', meaning: 'Bunu tekrar yapmalıyız' },
      { word: 'What\'s your take on…?', meaning: '…hakkında ne düşünüyorsun?' },
      { word: 'Same here!', meaning: 'Ben de!' },
    ],
  },
  {
    id: 'networking-event',
    title: 'Networking Etkinliği',
    location: 'London, Tech Meetup',
    emoji: '🤝',
    backgroundImage: 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=600&h=400&fit=crop&q=70',
    difficulty: 'intermediate',
    language: 'en',
    stageType: 'business',
    modeType: 'challenge',
    estimatedMinutes: 4,
    levelRange: ['intermediate', 'advanced'],
    mission: 'Kendini tanıt ve ortak alan bul',
    xpReward: 28,
    systemPrompt: `You are a friendly startup founder at a London tech networking event.
    Speak in casual but professional English. Ask about the user\'s work and share yours.
    Note mistakes with prefix "💡 Düzeltme:".`,
    openingMessage: 'Hi there! Great event, right? I\'m Jake — I run a fintech startup here. What brings you here tonight?',
    vocabHints: [
      { word: 'I work in / at…', meaning: '…\'da çalışıyorum' },
      { word: 'We\'re building…', meaning: '…inşa ediyoruz' },
      { word: 'Let\'s connect', meaning: 'Bağlantı kuralım' },
      { word: 'I\'d love to pick your brain', meaning: 'Fikirlerini almak isterim' },
      { word: 'Value proposition', meaning: 'Değer önerisi' },
      { word: 'Scale up', meaning: 'Büyümek / Ölçeklendirmek' },
    ],
  },
  {
    id: 'flatshare-viewing',
    title: 'Ev Gezme',
    location: 'London, Flat Viewing',
    emoji: '🏡',
    backgroundImage: 'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=600&h=400&fit=crop&q=70',
    difficulty: 'beginner',
    language: 'en',
    stageType: 'social',
    modeType: 'normal',
    estimatedMinutes: 3,
    levelRange: ['beginner', 'intermediate'],
    mission: 'Ev hakkında sorular sor ve kira detaylarını anla',
    xpReward: 22,
    systemPrompt: `You are a current tenant showing a room in a London flat share. Speak in casual, honest English.
    If the user writes in Turkish, respond in both English AND Turkish.
    Note mistakes with prefix "💡 Düzeltme:".`,
    openingMessage: 'Hey! Come in, come in. So this would be your room — what do you think? Any questions?',
    vocabHints: [
      { word: 'Bills included', meaning: 'Faturalar dahil' },
      { word: 'Deposit', meaning: 'Depozito' },
      { word: 'How many flatmates?', meaning: 'Kaç ev arkadaşı?' },
      { word: 'Furnished', meaning: 'Mobilyalı' },
      { word: 'Nearest tube station', meaning: 'En yakın metro' },
      { word: 'Notice period', meaning: 'Önceden haber verme süresi' },
    ],
  },
  {
    id: 'pub-quiz-night',
    title: 'Pub Quiz Gecesi',
    location: 'Bristol, Pub',
    emoji: '🎯',
    backgroundImage: 'https://images.unsplash.com/photo-1546726747-421c6d69c929?w=600&h=400&fit=crop&q=70',
    difficulty: 'intermediate',
    language: 'en',
    stageType: 'social',
    modeType: 'story',
    estimatedMinutes: 4,
    levelRange: ['intermediate', 'advanced'],
    mission: 'Takıma katıl ve en az 2 soru üzerine fikir beyan et',
    xpReward: 24,
    systemPrompt: `You are an enthusiastic pub quiz host and player. Speak in lively, informal British English.
    Ask fun general knowledge questions and react to answers. Note mistakes with prefix "💡 Düzeltme:".`,
    openingMessage: 'Right, welcome to the quiz! You look like you\'re on your own — want to join our team? The more the merrier!',
    vocabHints: [
      { word: 'I reckon…', meaning: 'Sanırım… / Bence…' },
      { word: 'No idea', meaning: 'Hiç fikrim yok' },
      { word: 'I\'ll go with…', meaning: '…derim / …seçiyorum' },
      { word: 'Good shout!', meaning: 'İyi fikir!' },
      { word: 'Round', meaning: 'Tur (quizde)' },
      { word: 'Tiebreaker', meaning: 'Eşitlik bozucu soru' },
    ],
  },
  {
    id: 'emergency-pharmacy',
    title: 'Eczanede Acil Yardım',
    location: 'London, Pharmacy',
    emoji: '💊',
    backgroundImage: 'https://images.unsplash.com/photo-1587854692152-cbe660dbde88?w=600&h=400&fit=crop&q=70',
    difficulty: 'beginner',
    language: 'en',
    stageType: 'survival',
    modeType: 'survival',
    estimatedMinutes: 3,
    levelRange: ['beginner'],
    mission: 'İlacı tarif et ve doğru ürünü al',
    xpReward: 24,
    systemPrompt: `You are a helpful British pharmacist. Speak clearly and simply.
    If the user writes in Turkish, respond in both English AND Turkish.
    Note mistakes with prefix "💡 Düzeltme:".`,
    openingMessage: 'Hello! How can I help you today?',
    vocabHints: [
      { word: 'Painkiller', meaning: 'Ağrı kesici' },
      { word: 'Prescription', meaning: 'Reçete' },
      { word: 'Over the counter', meaning: 'Reçetesiz satılan' },
      { word: 'Dosage', meaning: 'Doz' },
      { word: 'Side effects', meaning: 'Yan etkiler' },
      { word: 'Allergy', meaning: 'Alerji' },
    ],
  },
  {
    id: 'catching-up-old-friend',
    title: 'Eski Arkadaşla Buluşma',
    location: 'London, Park',
    emoji: '🌳',
    backgroundImage: 'https://images.unsplash.com/photo-1529156069898-49953e39b3ac?w=600&h=400&fit=crop&q=70',
    difficulty: 'intermediate',
    language: 'en',
    stageType: 'social',
    modeType: 'story',
    estimatedMinutes: 4,
    levelRange: ['intermediate', 'advanced'],
    mission: 'Son birkaç yılı anlat ve karşındakini dinle',
    xpReward: 24,
    systemPrompt: `You are an old friend the user hasn\'t seen in 3 years. Speak in warm, nostalgic, casual English.
    Bring up shared past memories and ask about what\'s changed. Note mistakes with prefix "💡 Düzeltme:".`,
    openingMessage: 'Oh my God, it\'s been so long! Look at you! What have you been up to? Tell me everything!',
    vocabHints: [
      { word: 'Catch up', meaning: 'Buluşup sohbet etmek' },
      { word: 'Ages ago', meaning: 'Çok uzun zaman önce' },
      { word: 'I can\'t believe…', meaning: 'İnanamıyorum ki…' },
      { word: 'It feels like yesterday', meaning: 'Dün gibi hissettiriyor' },
      { word: 'What\'s new with you?', meaning: 'Hayatında ne var ne yok?' },
      { word: 'Miss the old days', meaning: 'Eski günleri özlemek' },
    ],
  },
  {
    id: 'conference-room-debate',
    title: 'Toplantıda Fikir Çatışması',
    location: 'London, Startup Office',
    emoji: '⚡',
    backgroundImage: 'https://images.unsplash.com/photo-1542744173-8e7e53415bb0?w=600&h=400&fit=crop&q=70',
    difficulty: 'advanced',
    language: 'en',
    stageType: 'business',
    modeType: 'challenge',
    estimatedMinutes: 5,
    levelRange: ['advanced'],
    mission: 'Karşı görüşü kır ve kendi çözümünü geçir',
    xpReward: 38,
    systemPrompt: `You are a confident product manager who disagrees with the user\'s proposal. Speak in assertive but professional English.
    Push back with data and logic. Reward clear, structured responses. Note mistakes with prefix "💡 Düzeltme:".`,
    openingMessage: 'Look, I appreciate the effort — but I genuinely don\'t think this approach will work. Here\'s why…',
    vocabHints: [
      { word: 'I see your point, but…', meaning: 'Noktanı anlıyorum ama…' },
      { word: 'Evidence suggests…', meaning: 'Kanıtlar gösteriyor ki…' },
      { word: 'Feasible', meaning: 'Uygulanabilir' },
      { word: 'Trade-off', meaning: 'Takas / Uzlaşı' },
      { word: 'Push back', meaning: 'İtiraz etmek' },
      { word: 'Stakeholders', meaning: 'Paydaşlar' },
    ],
  },
  {
    id: 'train-delay',
    title: 'Tren Gecikmesi',
    location: 'London Paddington, Platform',
    emoji: '🚆',
    backgroundImage: 'https://images.unsplash.com/photo-1474487548417-781cb71495f3?w=600&h=400&fit=crop&q=70',
    difficulty: 'beginner',
    language: 'en',
    stageType: 'travel',
    modeType: 'survival',
    estimatedMinutes: 3,
    levelRange: ['beginner', 'intermediate'],
    mission: 'Gecikmeyi öğren ve alternatif sor',
    xpReward: 20,
    systemPrompt: `You are a slightly stressed British rail station assistant during a delay.
    Speak in clear but harried English. Offer alternatives when pushed.
    If the user writes in Turkish, respond in both English AND Turkish.
    Note mistakes with prefix "💡 Düzeltme:".`,
    openingMessage: 'I\'m sorry everyone — the 14:05 to Bristol is delayed by about 40 minutes. Can I help anyone with alternative routes?',
    vocabHints: [
      { word: 'Delayed / Cancelled', meaning: 'Gecikmiş / İptal edilmiş' },
      { word: 'Alternative route', meaning: 'Alternatif güzergah' },
      { word: 'Platform', meaning: 'Platform / Peron' },
      { word: 'Get a refund', meaning: 'Geri ödeme almak' },
      { word: 'Connecting train', meaning: 'Bağlantı treni' },
      { word: 'Estimated arrival', meaning: 'Tahmini varış' },
    ],
  },
  {
    id: 'lisbon-cafe',
    title: 'Lizbon Kafesinde Sipariş',
    location: 'Lisbon, Chiado Café',
    emoji: '☕',
    backgroundImage: 'https://images.unsplash.com/photo-1554118811-1e0d58224f24?w=600&h=400&fit=crop&q=70',
    difficulty: 'beginner',
    language: 'pt',
    stageType: 'cafe',
    modeType: 'normal',
    estimatedMinutes: 3,
    levelRange: ['beginner'],
    mission: 'Bir kahve iste ve süt/şeker sorusuna cevap ver',
    xpReward: 20,
    systemPrompt: `You are a friendly barista in a Lisbon cafe. The user is a Turkish beginner learning Portuguese.
    Speak in simple Portuguese. If the user writes in Turkish, respond in both Portuguese AND Turkish.
    Note mistakes with prefix "💡 Düzeltme:".`,
    openingMessage: 'Bom dia! O que gostaria de tomar?',
    vocabHints: [
      { word: 'Bom dia', meaning: 'Günaydın' },
      { word: 'Por favor', meaning: 'Lütfen' },
      { word: 'Um café', meaning: 'Bir kahve' },
      { word: 'Com leite', meaning: 'Sütlü' },
      { word: 'Sem açúcar', meaning: 'Şekersiz' },
      { word: 'A conta', meaning: 'Hesap' },
    ],
  },
  {
    id: 'lisbon-metro',
    title: 'Metroda Yön Sorma',
    location: 'Lisbon, Metro',
    emoji: '🚇',
    backgroundImage: 'https://images.unsplash.com/photo-1743080374202-f2f211fd990d?w=600&h=400&fit=crop&q=70',
    difficulty: 'beginner',
    language: 'pt',
    stageType: 'travel',
    modeType: 'normal',
    estimatedMinutes: 3,
    levelRange: ['beginner', 'intermediate'],
    mission: 'Doğru hattı sor ve yönü teyit et',
    xpReward: 22,
    systemPrompt: `You are a helpful local in the Lisbon metro. The user is learning Portuguese.
    Keep Portuguese clear and practical. If the user writes in Turkish, include a Turkish translation.
    Note mistakes with prefix "💡 Düzeltme:".`,
    openingMessage: 'Olá! Parece que está procurando o caminho. Posso ajudar?',
    vocabHints: [
      { word: 'Onde fica...?', meaning: 'Nerede...?' },
      { word: 'A estação', meaning: 'İstasyon' },
      { word: 'À direita', meaning: 'Sağa' },
      { word: 'À esquerda', meaning: 'Sola' },
      { word: 'Em frente', meaning: 'Düz ileride' },
      { word: 'A linha', meaning: 'Hat' },
    ],
  },
  {
    id: 'sao-paulo-meeting',
    title: 'İş Toplantısı',
    location: 'São Paulo, Office',
    emoji: '💼',
    backgroundImage: 'https://images.unsplash.com/photo-1556761175-b413da4baf72?w=600&h=400&fit=crop&q=70',
    difficulty: 'intermediate',
    language: 'pt',
    stageType: 'business',
    modeType: 'challenge',
    estimatedMinutes: 4,
    levelRange: ['intermediate', 'advanced'],
    mission: 'Toplantıda fikrini kibarca savun',
    xpReward: 28,
    systemPrompt: `You are a Brazilian business colleague in a project meeting. Speak professional but natural Portuguese.
    Ask for clarification and reward structured answers. Note mistakes with prefix "💡 Düzeltme:".`,
    openingMessage: 'Bom dia. Podemos começar pela sua proposta para o projeto?',
    vocabHints: [
      { word: 'A reunião', meaning: 'Toplantı' },
      { word: 'O projeto', meaning: 'Proje' },
      { word: 'Na minha opinião', meaning: 'Bence' },
      { word: 'Concordo, mas...', meaning: 'Katılıyorum ama...' },
      { word: 'O prazo', meaning: 'Teslim tarihi' },
      { word: 'O orçamento', meaning: 'Bütçe' },
    ],
  },
  {
    id: 'rio-party',
    title: 'Partide Tanışma',
    location: 'Rio de Janeiro, House Party',
    emoji: '🎉',
    backgroundImage: 'https://images.unsplash.com/photo-1517457373958-b7bdd4587205?w=600&h=400&fit=crop&q=70',
    difficulty: 'beginner',
    language: 'pt',
    stageType: 'social',
    modeType: 'normal',
    estimatedMinutes: 3,
    levelRange: ['beginner', 'intermediate'],
    mission: 'Biriyle tanış ve kısa sohbet başlat',
    xpReward: 22,
    systemPrompt: `You are a warm Brazilian party guest meeting the user for the first time.
    Speak casual Portuguese, keep turns short, and make the user comfortable.
    Note mistakes with prefix "💡 Düzeltme:".`,
    openingMessage: 'Oi! Acho que a gente ainda não se conhece. Qual é o seu nome?',
    vocabHints: [
      { word: 'Prazer', meaning: 'Memnun oldum' },
      { word: 'Meu nome é...', meaning: 'Benim adım...' },
      { word: 'De onde você é?', meaning: 'Nerelisin?' },
      { word: 'Legal!', meaning: 'Güzel / harika' },
      { word: 'Você gosta de...?', meaning: '... sever misin?' },
      { word: 'Até mais', meaning: 'Görüşürüz' },
    ],
  },
  {
    id: 'porto-pharmacy',
    title: 'Eczanede Yardım',
    location: 'Porto, Pharmacy',
    emoji: '💊',
    backgroundImage: 'https://images.unsplash.com/photo-1587854692152-cbe660dbde88?w=600&h=400&fit=crop&q=70',
    difficulty: 'beginner',
    language: 'pt',
    stageType: 'survival',
    modeType: 'survival',
    estimatedMinutes: 3,
    levelRange: ['beginner', 'intermediate'],
    mission: 'Sorununu açıkla ve uygun ürünü sor',
    xpReward: 24,
    systemPrompt: `You are a patient pharmacist in Porto. The user needs simple practical Portuguese.
    Ask short questions and confirm symptoms clearly. Note mistakes with prefix "💡 Düzeltme:".`,
    openingMessage: 'Boa tarde. Como posso ajudar?',
    vocabHints: [
      { word: 'Estou com dor de cabeça', meaning: 'Başım ağrıyor' },
      { word: 'Preciso de...', meaning: '... ihtiyacım var' },
      { word: 'Remédio', meaning: 'İlaç' },
      { word: 'Alergia', meaning: 'Alerji' },
      { word: 'Quantas vezes?', meaning: 'Kaç kere?' },
      { word: 'Obrigado/a', meaning: 'Teşekkürler' },
    ],
  },
];

const unsplash = (photoId: string) =>
  `https://images.unsplash.com/${photoId}?w=900&h=560&fit=crop&crop=entropy&auto=format&q=82`;

const CURATED_STAGE_IMAGES: Record<NonNullable<Scenario['stageType']>, string> = {
  cafe: unsplash('photo-1501339847302-ac426a4a7cbb'),
  travel: unsplash('photo-1474487548417-781cb71495f3'),
  business: unsplash('photo-1552664730-d307ca884978'),
  social: unsplash('photo-1529156069898-49953e39b3ac'),
  story: unsplash('photo-1519682337058-a94d519337bc'),
  survival: unsplash('photo-1587854692152-cbe660dbde88'),
};

const CURATED_SCENE_IMAGES: Record<string, string> = {
  'cafe-barcelona': unsplash('photo-1521017432531-fbd92d768814'),
  'metro-madrid': unsplash('photo-1743080374202-f2f211fd990d'),
  'meeting-madrid': unsplash('photo-1556761175-b413da4baf72'),
  'concert-madrid': unsplash('photo-1470229722913-7c0e2dbbafd3'),
  'paris-cafe': unsplash('photo-1502602898657-3e91760cbb34'),
  'paris-metro': unsplash('photo-1558618666-fcd25c85cd64'),
  'paris-shopping': unsplash('photo-1441986300917-64674bd600d8'),
  'berlin-market': unsplash('photo-1488459716781-31db52582fe9'),
  'berlin-cafe': unsplash('photo-1560969184-10fe8719e047'),
  'berlin-office': unsplash('photo-1497366216548-37526070297c'),
  'rome-cafe': unsplash('photo-1552832230-c0197dd311b5'),
  'rome-restaurant': unsplash('photo-1517248135467-4c7edcad34c4'),
  'madrid-party': unsplash('photo-1527529482837-4698179dc6ce'),
  'barcelona-hotel': unsplash('photo-1564501049412-61c2a3083791'),
  'paris-office': unsplash('photo-1556761175-b413da4baf72'),
  'nice-beach': unsplash('photo-1507525428034-b723cf961d3e'),
  'munich-party': unsplash('photo-1517457373958-b7bdd4587205'),
  'frankfurt-airport': unsplash('photo-1436491865332-7a61a109cc05'),
  'rome-metro': unsplash('photo-1743080374202-f2f211fd990d'),
  'milan-office': unsplash('photo-1542744173-8e7e53415bb0'),
  'florence-social': unsplash('photo-1529156069898-49953e39b3ac'),
  'london-cafe': unsplash('photo-1525610553991-2bede1a236e2'),
  'london-office': unsplash('photo-1497366754035-f200968a677a'),
  'london-underground': unsplash('photo-1743080374202-f2f211fd990d'),
  'london-pub': unsplash('photo-1525268323446-0505b6fe7778'),
  'nyc-diner': unsplash('photo-1555992336-03a23c7b20ee'),
  'airport-checkin': unsplash('photo-1436491865332-7a61a109cc05'),
  'hotel-checkin': unsplash('photo-1551882547-ff40c4a49b6b'),
  'job-interview': unsplash('photo-1553877522-43269d4ea984'),
  'flatmate-conflict': unsplash('photo-1502672260266-1c1ef2d93688'),
  'gym-small-talk': unsplash('photo-1534438327276-14e5300c3a48'),
  'doctors-appointment': unsplash('photo-1579684385127-1ef15d508118'),
  'coffee-chat-colleague': unsplash('photo-1495474472287-4d71bcdd2085'),
  'supermarket-queue': unsplash('photo-1542838132-92c53300491e'),
  'presentation-feedback': unsplash('photo-1552664730-d307ca884978'),
  'lost-in-city': unsplash('photo-1519501025264-65ba15a82390'),
  'phone-call-complaint': unsplash('photo-1423666639041-f56000c27a9a'),
  'first-date-coffee': unsplash('photo-1511988617509-a57c8a288659'),
  'networking-event': unsplash('photo-1540575467063-178a50c2df87'),
  'flatshare-viewing': unsplash('photo-1560448204-e02f11c3d0e2'),
  'pub-quiz-night': unsplash('photo-1546726747-421c6d69c929'),
  'emergency-pharmacy': unsplash('photo-1587854692152-cbe660dbde88'),
  'catching-up-old-friend': unsplash('photo-1529156069898-49953e39b3ac'),
  'conference-room-debate': unsplash('photo-1542744173-8e7e53415bb0'),
  'train-delay': unsplash('photo-1474487548417-781cb71495f3'),
  'lisbon-cafe': unsplash('photo-1554118811-1e0d58224f24'),
  'lisbon-metro': unsplash('photo-1743080374202-f2f211fd990d'),
  'sao-paulo-meeting': unsplash('photo-1556761175-b413da4baf72'),
  'rio-party': unsplash('photo-1517457373958-b7bdd4587205'),
  'porto-pharmacy': unsplash('photo-1587854692152-cbe660dbde88'),
};

const curatedImageForScenario = (scenario: Scenario) =>
  CURATED_SCENE_IMAGES[scenario.id] ??
  scenario.backgroundImage ??
  CURATED_STAGE_IMAGES[scenario.stageType ?? 'social'];

export const scenarios: Scenario[] = scenarioDefinitions.map(scenario => ({
  ...scenario,
  backgroundImage: curatedImageForScenario(scenario),
  ...(SCENARIO_ENRICHMENTS[scenario.id] ?? {}),
}));

const FALLBACK_SCENARIO: Scenario = {
  id: 'fallback-scene',
  title: 'Quick Daily Scene',
  location: 'Everyday Conversation',
  emoji: '💬',
  backgroundImage: 'https://images.unsplash.com/photo-1529156069898-49953e39b3ac?w=600&h=400&fit=crop&q=70',
  difficulty: 'beginner',
  language: 'en',
  stageType: 'social',
  modeType: 'normal',
  estimatedMinutes: 3,
  mission: 'Kısa bir gerçek hayat diyaloğunu tamamla',
  xpReward: 18,
  systemPrompt:
    'You are a friendly conversation partner in a simple daily-life chat. Keep language clear and short, and encourage practical replies.',
  openingMessage: 'Hi! Let\'s rehearse a quick real-life conversation. Ready?',
  vocabHints: [
    { word: 'Hello', meaning: 'Merhaba' },
    { word: 'Please', meaning: 'Lütfen' },
    { word: 'Thanks', meaning: 'Teşekkürler' },
  ],
};

export const getDailyScenarios = (language: string): Scenario[] => {
  const filtered = scenarios.filter(s => s.language === language);
  const fallback = scenarios.filter(s => s.language === 'es');
  const selected = filtered.length > 0 ? filtered : fallback;
  return selected.length > 0 ? selected : [FALLBACK_SCENARIO];
};

export const getFirstSessionScenario = (language: string): Scenario => {
  const byLang = scenarios.filter(s => s.language === language);
  const firstCafe = byLang.find(s => s.stageType === 'cafe' && s.difficulty === 'beginner');
  if (firstCafe) return firstCafe;

  const fallbackCafe = scenarios.find(s => s.language === 'es' && s.stageType === 'cafe' && s.difficulty === 'beginner');
  if (fallbackCafe) return fallbackCafe;
  return scenarios[0] ?? FALLBACK_SCENARIO;
};

export const getTodaysMissionScenario = (
  language: string,
  identity?: UserIdentity | null,
  completedScenarioIds: string[] = []
): Scenario => {
  const pool = scenarios.filter(s => s.language === language);
  const base = pool.length > 0 ? pool : scenarios.filter(s => s.language === 'es');

  const text = `${identity?.goal ?? ''} ${identity?.context ?? ''}`.toLowerCase();
  let preferredStage: Scenario['stageType'] = 'cafe';
  if (BUSINESS_KW.some(k => text.includes(k))) preferredStage = 'business';
  else if (TRAVEL_KW.some(k => text.includes(k))) preferredStage = 'travel';
  else if (SOCIAL_KW.some(k => text.includes(k))) preferredStage = 'social';

  // Tamamlanmamış senaryolardan önce seç, hepsi bittiyse sıfırla
  const uncompleted = base.filter(s => !completedScenarioIds.includes(s.id));
  const searchIn = uncompleted.length > 0 ? uncompleted : base;
  if (searchIn.length === 0) {
    return getFirstSessionScenario(language);
  }

  // Bugünün tarihini seed olarak kullan — aynı gün içinde sabit ama her gün farklı
  const today = new Date().toISOString().slice(0, 10); // "2026-04-20"
  const dateSeed = today.split('-').reduce((acc, n) => acc + parseInt(n, 10), 0);

  // Preferred stage'den seç
  const preferredPool = searchIn.filter(s => s.stageType === preferredStage);
  if (preferredPool.length > 0) {
    return preferredPool[dateSeed % preferredPool.length];
  }

  // Preferred yoksa tüm havuzdan döngüsel seç
  return searchIn[dateSeed % searchIn.length] ?? getFirstSessionScenario(language);
};

const BUSINESS_KW = ['iş', 'toplantı', 'şirket', 'ofis', 'kariyer', 'work', 'office', 'business', 'meeting', 'job', 'career', 'proje', 'startup'];
const TRAVEL_KW = ['seyahat', 'gez', 'tatil', 'tur', 'yolculuk', 'travel', 'trip', 'vacation', 'uçuş', 'otel', 'airport', 'hotel'];
const SOCIAL_KW = ['arkadaş', 'tanış', 'sosyal', 'parti', 'konser', 'eğlen', 'friend', 'social', 'party', 'concert', 'date', 'bar', 'gece'];

export const getPersonalizedScenario = (language: string, identity?: UserIdentity | null): Scenario => {
  const byLang = scenarios.filter(s => s.language === language);
  const pool = byLang.length > 0 ? byLang : scenarios.filter(s => s.language === 'es');
  const safePool = pool.length > 0 ? pool : [FALLBACK_SCENARIO];

  if (!identity?.goal && !identity?.context) {
    return safePool.find(s => s.stageType === 'cafe' && s.difficulty === 'beginner') ?? safePool[0];
  }

  const text = `${identity?.goal ?? ''} ${identity?.context ?? ''}`.toLowerCase();

  let preferredStage: Scenario['stageType'] = 'cafe';
  if (BUSINESS_KW.some(k => text.includes(k))) preferredStage = 'business';
  else if (TRAVEL_KW.some(k => text.includes(k))) preferredStage = 'travel';
  else if (SOCIAL_KW.some(k => text.includes(k))) preferredStage = 'social';

  return (
    safePool.find(s => s.stageType === preferredStage && s.difficulty === 'beginner') ??
    safePool.find(s => s.stageType === preferredStage) ??
    safePool.find(s => s.stageType === 'cafe' && s.difficulty === 'beginner') ??
    safePool[0]
  );
};

export const getScenarioWithVariant = (
  scenario: Scenario,
  playCount: number,
  identity?: UserIdentity | null
): Scenario => {
  const replayOverlay = playCount === 1
    ? '\n\nREPLAY MODE: The user has done this scene before. Be less forgiving — speak faster, use fewer translations, challenge them with harder follow-up questions.'
    : playCount >= 2
    ? '\n\nCHALLENGE MODE: The user has replayed this scene multiple times. Speak naturally and fast. Use idioms and slang. Only correct serious mistakes. Treat them like a near-native.'
    : '';

  const identityOverlay = identity?.goal
    ? `\n\nUser dream: "${identity.goal}". Weave this naturally into the scene when it fits.`
    : '';

  if (!replayOverlay && !identityOverlay) return scenario;

  return {
    ...scenario,
    systemPrompt: `${scenario.systemPrompt}${replayOverlay}${identityOverlay}`,
  };
};

export const SUPPORTED_LANGUAGES = [
  { code: 'es', name: 'İspanyolca', flag: '🇪🇸' },
  { code: 'fr', name: 'Fransızca', flag: '🇫🇷' },
  { code: 'de', name: 'Almanca', flag: '🇩🇪' },
  { code: 'it', name: 'İtalyanca', flag: '🇮🇹' },
  { code: 'pt', name: 'Portekizce', flag: '🇧🇷' },
  { code: 'en', name: 'İngilizce', flag: '🇬🇧' },
];

const prepFallbackByStage: Record<NonNullable<Scenario['stageType']>, Omit<ScenePrepPlan, 'reasonLine'>> = {
  cafe: {
    vocabWarmup: { title: 'Sipariş kelimeleri', words: ['please', 'menu', 'coffee', 'bill', 'table'] },
    phraseCheck: {
      title: 'Nazik sipariş tonu',
      natural: 'Could I get a coffee, please?',
      awkward: 'Give me coffee now.',
    },
    speakingWarmup: {
      title: 'Kısa giriş cümlesi',
      line: "Hi, I'd like to order a coffee, please.",
    },
  },
  travel: {
    vocabWarmup: { title: 'Yolculuk kelimeleri', words: ['station', 'ticket', 'gate', 'platform', 'transfer'] },
    phraseCheck: {
      title: 'Yol sorma tonu',
      natural: 'Excuse me, which line goes downtown?',
      awkward: 'You tell station now?',
    },
    speakingWarmup: {
      title: 'Yön sorma cümlesi',
      line: 'Excuse me, how can I get to this station?',
    },
  },
  business: {
    vocabWarmup: { title: 'Toplantı kelimeleri', words: ['experience', 'role', 'challenge', 'available', 'strengths'] },
    phraseCheck: {
      title: 'Profesyonel ifade',
      natural: "I'm excited about this role and the impact I can make.",
      awkward: 'I want this job because money.',
    },
    speakingWarmup: {
      title: 'Mülakat ısınması',
      line: "I'm excited about this role and ready to contribute.",
    },
  },
  social: {
    vocabWarmup: { title: 'Sohbet kelimeleri', words: ['weekend', 'hobby', 'music', 'plans', 'nice to meet'] },
    phraseCheck: {
      title: 'Doğal small-talk',
      natural: 'Nice to meet you, what do you do for fun?',
      awkward: 'Tell me personal things now.',
    },
    speakingWarmup: {
      title: 'Tanışma cümlesi',
      line: 'Hey, nice to meet you. How is your day going?',
    },
  },
  story: {
    vocabWarmup: { title: 'Anlatım kelimeleri', words: ['first', 'then', 'because', 'after', 'finally'] },
    phraseCheck: {
      title: 'Temiz hikaye akışı',
      natural: 'First we met, then we talked for hours.',
      awkward: 'We meet. Talk. End.',
    },
    speakingWarmup: {
      title: 'Hikaye başlangıcı',
      line: 'First, let me tell you what happened yesterday.',
    },
  },
  survival: {
    vocabWarmup: { title: 'Acil durum kelimeleri', words: ['help', 'urgent', 'problem', 'need', 'where'] },
    phraseCheck: {
      title: 'Net yardım isteme',
      natural: 'I need help, could you guide me please?',
      awkward: 'Problem. You fix.',
    },
    speakingWarmup: {
      title: 'Kritik cümle',
      line: 'I need help with this situation, please.',
    },
  },
};

export const buildScenePrepPlan = (scenario: Scenario): ScenePrepPlan => {
  const stage = scenario.stageType ?? 'social';
  const base = prepFallbackByStage[stage];
  const words = (scenario.vocabHints ?? [])
    .map(v => v.word)
    .filter(Boolean)
    .slice(0, 5);

  return {
    reasonLine: `"${scenario.title}" sahnesinde daha doğal görünmek için bu kısa prep'i yap.`,
    vocabWarmup: {
      title: base.vocabWarmup.title,
      words: words.length > 0 ? words : base.vocabWarmup.words,
    },
    phraseCheck: base.phraseCheck,
    speakingWarmup: base.speakingWarmup,
  };
};
