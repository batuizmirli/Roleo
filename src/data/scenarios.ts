import { Scenario, UserIdentity } from '../types';

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

  // SPANISH (extra)
  {
    id: 'madrid-party',
    title: 'Partide Tanışma',
    location: 'Madrid, House Party',
    emoji: '🎉',
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
    openingMessage: '¡Hola! No te había visto antes. ¿Cómo te llamas? (Merhaba! Seni daha önce görmedim. Adın ne?)\n\n👉 Türkçe ya da İspanyolca yazabilirsin!',
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
    openingMessage: 'Bonjour! Il fait beau aujourd\'hui, n\'est-ce pas? (Merhaba! Bugün hava çok güzel, değil mi?)\n\n👉 Türkçe ya da Fransızca yazabilirsin!',
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
    openingMessage: 'Hallo! Ich habe dich hier noch nicht gesehen. Woher kommst du? (Merhaba! Seni burada daha önce görmedim. Nerelisin?)\n\n👉 Türkçe ya da Almanca yazabilirsin!',
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
    openingMessage: 'Ciao! Sembra che tu sia perso. Posso aiutarti? (Merhaba! Kaybolmuş gibi görünüyorsun. Yardımcı olabilir miyim?)\n\n👉 Türkçe ya da İtalyanca yazabilirsin!',
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
    openingMessage: 'Ciao! È la tua prima volta a Firenze? (Merhaba! Floransa\'ya ilk gelişin mi?)\n\n👉 Türkçe ya da İtalyanca yazabilirsin!',
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
  {
    id: 'london-underground',
    title: 'Londra Metrosu',
    location: 'London, Underground',
    emoji: '🚇',
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
    openingMessage: 'Hello! You look a bit lost. Can I help you? (Merhaba! Biraz kaybolmuş gibisin. Yardımcı olabilir miyim?)\n\n👉 Türkçe de yazabilirsin!',
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

  // Bugünün tarihini seed olarak kullan — aynı gün içinde sabit ama her gün farklı
  const today = new Date().toISOString().slice(0, 10); // "2026-04-20"
  const dateSeed = today.split('-').reduce((acc, n) => acc + parseInt(n, 10), 0);

  // Preferred stage'den seç
  const preferredPool = searchIn.filter(s => s.stageType === preferredStage);
  if (preferredPool.length > 0) {
    return preferredPool[dateSeed % preferredPool.length];
  }

  // Preferred yoksa tüm havuzdan döngüsel seç
  return searchIn[dateSeed % searchIn.length];
};

const BUSINESS_KW = ['iş', 'toplantı', 'şirket', 'ofis', 'kariyer', 'work', 'office', 'business', 'meeting', 'job', 'career', 'proje', 'startup'];
const TRAVEL_KW = ['seyahat', 'gez', 'tatil', 'tur', 'yolculuk', 'travel', 'trip', 'vacation', 'uçuş', 'otel', 'airport', 'hotel'];
const SOCIAL_KW = ['arkadaş', 'tanış', 'sosyal', 'parti', 'konser', 'eğlen', 'friend', 'social', 'party', 'concert', 'date', 'bar', 'gece'];

export const getPersonalizedScenario = (language: string, identity?: UserIdentity | null): Scenario => {
  const byLang = scenarios.filter(s => s.language === language);
  const pool = byLang.length > 0 ? byLang : scenarios.filter(s => s.language === 'es');

  if (!identity?.goal && !identity?.context) {
    return pool.find(s => s.stageType === 'cafe' && s.difficulty === 'beginner') ?? pool[0];
  }

  const text = `${identity?.goal ?? ''} ${identity?.context ?? ''}`.toLowerCase();

  let preferredStage: Scenario['stageType'] = 'cafe';
  if (BUSINESS_KW.some(k => text.includes(k))) preferredStage = 'business';
  else if (TRAVEL_KW.some(k => text.includes(k))) preferredStage = 'travel';
  else if (SOCIAL_KW.some(k => text.includes(k))) preferredStage = 'social';

  return (
    pool.find(s => s.stageType === preferredStage && s.difficulty === 'beginner') ??
    pool.find(s => s.stageType === preferredStage) ??
    pool.find(s => s.stageType === 'cafe' && s.difficulty === 'beginner') ??
    pool[0]
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
  { code: 'en', name: 'İngilizce', flag: '🇬🇧' },
];
