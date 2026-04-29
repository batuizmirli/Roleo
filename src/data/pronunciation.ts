export type PronunciationCategory = 'sounds' | 'words' | 'sentences' | 'details';

export type WordTopic =
  | 'basics'
  | 'animals'
  | 'fruits'
  | 'nature'
  | 'aviation'
  | 'conversation'
  | 'travel'
  | 'food';

export type DetailTopic = 'time' | 'prices' | 'places' | 'codes';

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

type LocalizedPronunciationEntry = {
  text: Record<string, string>;
  meaningEn: string;
  meaningTr: string;
  speakText?: Record<string, string>;
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

const DETAIL_TITLES: Record<DetailTopic, { tr: string; en: string }> = {
  time: { tr: 'Saat', en: 'Time' },
  prices: { tr: 'Fiyat', en: 'Prices' },
  places: { tr: 'Yer', en: 'Places' },
  codes: { tr: 'Kodlar', en: 'Codes' },
};

const SOUND_ITEMS_BY_LANG: Record<string, LocalizedPronunciationEntry[]> = {
  es: [
    { text: { es: 'rr / r' }, meaningEn: 'rolled r in perro / caro', meaningTr: 'perro / caro içindeki r sesi' },
    { text: { es: 'j' }, meaningEn: 'throaty j in jamón', meaningTr: 'jamón kelimesindeki hırıltılı j' },
    { text: { es: 'ñ' }, meaningEn: 'ny sound in mañana', meaningTr: 'mañana içindeki ny sesi' },
    { text: { es: 'll' }, meaningEn: 'soft y sound in calle', meaningTr: 'calle içindeki yumuşak y sesi' },
    { text: { es: 'tilde' }, meaningEn: 'word stress in café / perdón', meaningTr: 'café / perdón kelime vurgusu' },
  ],
  fr: [
    { text: { fr: 'r' }, meaningEn: 'French r in rue', meaningTr: 'rue kelimesindeki Fransızca r' },
    { text: { fr: 'an / en' }, meaningEn: 'nasal sound in restaurant', meaningTr: 'restaurant içindeki burun sesi' },
    { text: { fr: 'on' }, meaningEn: 'nasal sound in bonjour', meaningTr: 'bonjour içindeki burun sesi' },
    { text: { fr: 'u' }, meaningEn: 'tight u in tu', meaningTr: 'tu kelimesindeki dar u sesi' },
    { text: { fr: 'liaison' }, meaningEn: 'linking in vous avez', meaningTr: 'vous avez gibi kelime bağlama' },
  ],
  de: [
    { text: { de: 'ch' }, meaningEn: 'ch sound in ich / nach', meaningTr: 'ich / nach içindeki ch sesi' },
    { text: { de: 'ü' }, meaningEn: 'rounded ü in München', meaningTr: 'München içindeki ü sesi' },
    { text: { de: 'ö' }, meaningEn: 'rounded ö in schön', meaningTr: 'schön içindeki ö sesi' },
    { text: { de: 'ä' }, meaningEn: 'open ä in spät', meaningTr: 'spät içindeki ä sesi' },
    { text: { de: 'z' }, meaningEn: 'ts sound in Zimmer', meaningTr: 'Zimmer içindeki ts sesi' },
  ],
  en: [
    { text: { en: 'th' }, meaningEn: 'th in thanks / this', meaningTr: 'thanks / this içindeki th sesi' },
    { text: { en: 'r / l' }, meaningEn: 'clear r and l contrast', meaningTr: 'r ve l ayrımı' },
    { text: { en: 'v / w' }, meaningEn: 'v and w contrast', meaningTr: 'v ve w ayrımı' },
    { text: { en: 'word stress' }, meaningEn: 'stress in reservation', meaningTr: 'reservation kelime vurgusu' },
    { text: { en: 'linking' }, meaningEn: 'linking in could I', meaningTr: 'could I gibi kelime bağlama' },
  ],
};

const SENTENCE_ITEMS: LocalizedPronunciationEntry[] = [
  {
    text: { es: 'Tengo una reserva.', fr: "J'ai une réservation.", de: 'Ich habe eine Reservierung.', it: 'Ho una prenotazione.', pt: 'Tenho uma reserva.', en: 'I have a reservation.' },
    meaningEn: 'I have a reservation.',
    meaningTr: 'Bir rezervasyonum var.',
  },
  {
    text: { es: '¿Puede repetir, por favor?', fr: 'Vous pouvez répéter, s’il vous plaît ?', de: 'Können Sie das bitte wiederholen?', it: 'Può ripetere, per favore?', pt: 'Pode repetir, por favor?', en: 'Could you repeat that, please?' },
    meaningEn: 'Could you repeat that, please?',
    meaningTr: 'Tekrar eder misiniz?',
  },
  {
    text: { es: '¿Puede hablar más despacio?', fr: 'Vous pouvez parler plus lentement ?', de: 'Können Sie langsamer sprechen?', it: 'Può parlare più lentamente?', pt: 'Pode falar mais devagar?', en: 'Could you speak more slowly?' },
    meaningEn: 'Could you speak more slowly?',
    meaningTr: 'Biraz daha yavaş söyler misiniz?',
  },
  {
    text: { es: '¿Me puede ayudar?', fr: 'Vous pouvez m’aider ?', de: 'Können Sie mir helfen?', it: 'Può aiutarmi?', pt: 'Pode me ajudar?', en: 'Could you help me?' },
    meaningEn: 'Could you help me?',
    meaningTr: 'Bana yardımcı olur musunuz?',
  },
  {
    text: { es: 'Solo quiero confirmar.', fr: 'Je veux juste confirmer.', de: 'Ich möchte nur kurz bestätigen.', it: 'Voglio solo confermare.', pt: 'Só quero confirmar.', en: 'I just want to confirm.' },
    meaningEn: 'I just want to confirm.',
    meaningTr: 'Sadece teyit etmek istiyorum.',
  },
  {
    text: { es: 'La cuenta, por favor.', fr: "L'addition, s'il vous plaît.", de: 'Die Rechnung, bitte.', it: 'Il conto, per favore.', pt: 'A conta, por favor.', en: 'The bill, please.' },
    meaningEn: 'The bill, please.',
    meaningTr: 'Hesabı alabilir miyim?',
  },
];

const DETAIL_ITEMS_BY_TOPIC: Record<DetailTopic, LocalizedPronunciationEntry[]> = {
  time: [
    { text: { es: 'a las siete y media', fr: 'à sept heures et demie', de: 'um halb acht', it: 'alle sette e mezza', pt: 'às sete e meia', en: 'at seven thirty' }, meaningEn: 'at 7:30', meaningTr: 'saat 7:30’da' },
    { text: { es: 'mañana por la mañana', fr: 'demain matin', de: 'morgen früh', it: 'domani mattina', pt: 'amanhã de manhã', en: 'tomorrow morning' }, meaningEn: 'tomorrow morning', meaningTr: 'yarın sabah' },
    { text: { es: 'dentro de diez minutos', fr: 'dans dix minutes', de: 'in zehn Minuten', it: 'tra dieci minuti', pt: 'em dez minutos', en: 'in ten minutes' }, meaningEn: 'in ten minutes', meaningTr: 'on dakika içinde' },
  ],
  prices: [
    { text: { es: 'doce euros con cincuenta', fr: 'douze euros cinquante', de: 'zwölf Euro fünfzig', it: 'dodici euro e cinquanta', pt: 'doze euros e cinquenta', en: 'twelve fifty' }, meaningEn: '12.50 euros', meaningTr: '12,50 euro' },
    { text: { es: 'cuarenta euros', fr: 'quarante euros', de: 'vierzig Euro', it: 'quaranta euro', pt: 'quarenta euros', en: 'forty euros' }, meaningEn: '40 euros', meaningTr: '40 euro' },
    { text: { es: '¿cuánto cuesta?', fr: 'combien ça coûte ?', de: 'wie viel kostet das?', it: 'quanto costa?', pt: 'quanto custa?', en: 'how much is it?' }, meaningEn: 'how much is it?', meaningTr: 'ne kadar?' },
  ],
  places: [
    { text: { es: 'habitación doscientos cuatro', fr: 'chambre deux cent quatre', de: 'Zimmer zweihundertvier', it: 'camera duecentoquattro', pt: 'quarto duzentos e quatro', en: 'room two oh four' }, meaningEn: 'room 204', meaningTr: '204 numaralı oda' },
    { text: { es: 'puerta B doce', fr: 'porte B douze', de: 'Gate B zwölf', it: 'uscita B dodici', pt: 'portão B doze', en: 'gate B twelve' }, meaningEn: 'gate B12', meaningTr: 'B12 kapısı' },
    { text: { es: 'andén tres', fr: 'quai trois', de: 'Gleis drei', it: 'binario tre', pt: 'plataforma três', en: 'platform three' }, meaningEn: 'platform 3', meaningTr: '3. peron' },
  ],
  codes: [
    { text: { es: 'código de reserva A siete dos', fr: 'code de réservation A sept deux', de: 'Buchungscode A sieben zwei', it: 'codice di prenotazione A sette due', pt: 'código de reserva A sete dois', en: 'booking code A seven two' }, meaningEn: 'booking code A72', meaningTr: 'rezervasyon kodu A72' },
    { text: { es: 'mesa número cinco', fr: 'table numéro cinq', de: 'Tisch Nummer fünf', it: 'tavolo numero cinque', pt: 'mesa número cinco', en: 'table number five' }, meaningEn: 'table number 5', meaningTr: '5 numaralı masa' },
    { text: { es: 'mi teléfono es...', fr: 'mon numéro est...', de: 'meine Telefonnummer ist...', it: 'il mio numero è...', pt: 'meu telefone é...', en: 'my phone number is...' }, meaningEn: 'my phone number is...', meaningTr: 'telefon numaram...' },
  ],
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

const WORD_TRANSLATIONS_BY_LANG: Record<string, Record<string, string>> = {
  es: {
    hello: 'hola', goodbye: 'adiós', please: 'por favor', 'thank you': 'gracias', sorry: 'perdón',
    yes: 'sí', no: 'no', today: 'hoy', tomorrow: 'mañana', friend: 'amigo',
    cat: 'gato', dog: 'perro', bird: 'pájaro', fish: 'pez', horse: 'caballo',
    cow: 'vaca', sheep: 'oveja', rabbit: 'conejo', lion: 'león', turtle: 'tortuga',
    apple: 'manzana', banana: 'plátano', orange: 'naranja', strawberry: 'fresa', grape: 'uva',
    cherry: 'cereza', peach: 'melocotón', pear: 'pera', watermelon: 'sandía', lemon: 'limón',
    tree: 'árbol', flower: 'flor', leaf: 'hoja', river: 'río', mountain: 'montaña',
    sea: 'mar', rain: 'lluvia', snow: 'nieve', wind: 'viento', sun: 'sol',
    airplane: 'avión', airport: 'aeropuerto', pilot: 'piloto', runway: 'pista', ticket: 'billete',
    boarding: 'embarque', passport: 'pasaporte', luggage: 'equipaje', gate: 'puerta', departure: 'salida',
    'how are you': '¿cómo estás?', 'my name is': 'me llamo', 'nice to meet you': 'encantado',
    'where are you from': '¿de dónde eres?', 'what do you do': '¿a qué te dedicas?',
    'can you help me': '¿me puedes ayudar?', 'i understand': 'entiendo', 'i do not understand': 'no entiendo',
    'speak slowly': 'hable despacio', 'see you later': 'hasta luego',
    hotel: 'hotel', reservation: 'reserva', taxi: 'taxi', station: 'estación', map: 'mapa',
    museum: 'museo', street: 'calle', left: 'izquierda', right: 'derecha', straight: 'recto',
    bread: 'pan', water: 'agua', milk: 'leche', cheese: 'queso', egg: 'huevo',
    chicken: 'pollo', rice: 'arroz', salad: 'ensalada', soup: 'sopa', coffee: 'café',
  },
  fr: {
    hello: 'bonjour', goodbye: 'au revoir', please: "s'il vous plaît", 'thank you': 'merci', sorry: 'désolé',
    yes: 'oui', no: 'non', today: "aujourd'hui", tomorrow: 'demain', friend: 'ami',
    cat: 'chat', dog: 'chien', bird: 'oiseau', fish: 'poisson', horse: 'cheval',
    cow: 'vache', sheep: 'mouton', rabbit: 'lapin', lion: 'lion', turtle: 'tortue',
    apple: 'pomme', banana: 'banane', orange: 'orange', strawberry: 'fraise', grape: 'raisin',
    cherry: 'cerise', peach: 'pêche', pear: 'poire', watermelon: 'pastèque', lemon: 'citron',
    tree: 'arbre', flower: 'fleur', leaf: 'feuille', river: 'rivière', mountain: 'montagne',
    sea: 'mer', rain: 'pluie', snow: 'neige', wind: 'vent', sun: 'soleil',
    airplane: 'avion', airport: 'aéroport', pilot: 'pilote', runway: 'piste', ticket: 'billet',
    boarding: 'embarquement', passport: 'passeport', luggage: 'bagages', gate: 'porte', departure: 'départ',
    'how are you': 'comment ça va ?', 'my name is': "je m'appelle", 'nice to meet you': 'enchanté',
    'where are you from': "d'où venez-vous ?", 'what do you do': 'que faites-vous ?',
    'can you help me': 'pouvez-vous m’aider ?', 'i understand': 'je comprends', 'i do not understand': 'je ne comprends pas',
    'speak slowly': 'parlez lentement', 'see you later': 'à plus tard',
    hotel: 'hôtel', reservation: 'réservation', taxi: 'taxi', station: 'gare', map: 'carte',
    museum: 'musée', street: 'rue', left: 'gauche', right: 'droite', straight: 'tout droit',
    bread: 'pain', water: 'eau', milk: 'lait', cheese: 'fromage', egg: 'œuf',
    chicken: 'poulet', rice: 'riz', salad: 'salade', soup: 'soupe', coffee: 'café',
  },
  de: {
    hello: 'hallo', goodbye: 'auf Wiedersehen', please: 'bitte', 'thank you': 'danke', sorry: 'entschuldigung',
    yes: 'ja', no: 'nein', today: 'heute', tomorrow: 'morgen', friend: 'Freund',
    cat: 'Katze', dog: 'Hund', bird: 'Vogel', fish: 'Fisch', horse: 'Pferd',
    cow: 'Kuh', sheep: 'Schaf', rabbit: 'Kaninchen', lion: 'Löwe', turtle: 'Schildkröte',
    apple: 'Apfel', banana: 'Banane', orange: 'Orange', strawberry: 'Erdbeere', grape: 'Traube',
    cherry: 'Kirsche', peach: 'Pfirsich', pear: 'Birne', watermelon: 'Wassermelone', lemon: 'Zitrone',
    tree: 'Baum', flower: 'Blume', leaf: 'Blatt', river: 'Fluss', mountain: 'Berg',
    sea: 'Meer', rain: 'Regen', snow: 'Schnee', wind: 'Wind', sun: 'Sonne',
    airplane: 'Flugzeug', airport: 'Flughafen', pilot: 'Pilot', runway: 'Landebahn', ticket: 'Ticket',
    boarding: 'Einsteigen', passport: 'Reisepass', luggage: 'Gepäck', gate: 'Gate', departure: 'Abflug',
    'how are you': 'wie geht es dir?', 'my name is': 'ich heiße', 'nice to meet you': 'freut mich',
    'where are you from': 'woher kommst du?', 'what do you do': 'was machst du beruflich?',
    'can you help me': 'können Sie mir helfen?', 'i understand': 'ich verstehe', 'i do not understand': 'ich verstehe nicht',
    'speak slowly': 'sprechen Sie langsam', 'see you later': 'bis später',
    hotel: 'Hotel', reservation: 'Reservierung', taxi: 'Taxi', station: 'Bahnhof', map: 'Karte',
    museum: 'Museum', street: 'Straße', left: 'links', right: 'rechts', straight: 'geradeaus',
    bread: 'Brot', water: 'Wasser', milk: 'Milch', cheese: 'Käse', egg: 'Ei',
    chicken: 'Hähnchen', rice: 'Reis', salad: 'Salat', soup: 'Suppe', coffee: 'Kaffee',
  },
  it: {
    hello: 'ciao', goodbye: 'arrivederci', please: 'per favore', 'thank you': 'grazie', sorry: 'scusa',
    yes: 'sì', no: 'no', today: 'oggi', tomorrow: 'domani', friend: 'amico',
    cat: 'gatto', dog: 'cane', bird: 'uccello', fish: 'pesce', horse: 'cavallo',
    cow: 'mucca', sheep: 'pecora', rabbit: 'coniglio', lion: 'leone', turtle: 'tartaruga',
    apple: 'mela', banana: 'banana', orange: 'arancia', strawberry: 'fragola', grape: 'uva',
    cherry: 'ciliegia', peach: 'pesca', pear: 'pera', watermelon: 'anguria', lemon: 'limone',
    tree: 'albero', flower: 'fiore', leaf: 'foglia', river: 'fiume', mountain: 'montagna',
    sea: 'mare', rain: 'pioggia', snow: 'neve', wind: 'vento', sun: 'sole',
    airplane: 'aereo', airport: 'aeroporto', pilot: 'pilota', runway: 'pista', ticket: 'biglietto',
    boarding: 'imbarco', passport: 'passaporto', luggage: 'bagaglio', gate: 'uscita', departure: 'partenza',
    'how are you': 'come stai?', 'my name is': 'mi chiamo', 'nice to meet you': 'piacere',
    'where are you from': 'di dove sei?', 'what do you do': 'che lavoro fai?',
    'can you help me': 'può aiutarmi?', 'i understand': 'capisco', 'i do not understand': 'non capisco',
    'speak slowly': 'parli lentamente', 'see you later': 'a dopo',
    hotel: 'hotel', reservation: 'prenotazione', taxi: 'taxi', station: 'stazione', map: 'mappa',
    museum: 'museo', street: 'strada', left: 'sinistra', right: 'destra', straight: 'dritto',
    bread: 'pane', water: 'acqua', milk: 'latte', cheese: 'formaggio', egg: 'uovo',
    chicken: 'pollo', rice: 'riso', salad: 'insalata', soup: 'zuppa', coffee: 'caffè',
  },
  pt: {
    hello: 'olá', goodbye: 'tchau', please: 'por favor', 'thank you': 'obrigado', sorry: 'desculpa',
    yes: 'sim', no: 'não', today: 'hoje', tomorrow: 'amanhã', friend: 'amigo',
    cat: 'gato', dog: 'cachorro', bird: 'pássaro', fish: 'peixe', horse: 'cavalo',
    cow: 'vaca', sheep: 'ovelha', rabbit: 'coelho', lion: 'leão', turtle: 'tartaruga',
    apple: 'maçã', banana: 'banana', orange: 'laranja', strawberry: 'morango', grape: 'uva',
    cherry: 'cereja', peach: 'pêssego', pear: 'pera', watermelon: 'melancia', lemon: 'limão',
    tree: 'árvore', flower: 'flor', leaf: 'folha', river: 'rio', mountain: 'montanha',
    sea: 'mar', rain: 'chuva', snow: 'neve', wind: 'vento', sun: 'sol',
    airplane: 'avião', airport: 'aeroporto', pilot: 'piloto', runway: 'pista', ticket: 'passagem',
    boarding: 'embarque', passport: 'passaporte', luggage: 'bagagem', gate: 'portão', departure: 'partida',
    'how are you': 'como você está?', 'my name is': 'meu nome é', 'nice to meet you': 'prazer em conhecer',
    'where are you from': 'de onde você é?', 'what do you do': 'o que você faz?',
    'can you help me': 'você pode me ajudar?', 'i understand': 'eu entendo', 'i do not understand': 'não entendo',
    'speak slowly': 'fale devagar', 'see you later': 'até mais',
    hotel: 'hotel', reservation: 'reserva', taxi: 'táxi', station: 'estação', map: 'mapa',
    museum: 'museu', street: 'rua', left: 'esquerda', right: 'direita', straight: 'reto',
    bread: 'pão', water: 'água', milk: 'leite', cheese: 'queijo', egg: 'ovo',
    chicken: 'frango', rice: 'arroz', salad: 'salada', soup: 'sopa', coffee: 'café',
  },
};

const DETAIL_OPTIONS: DetailTopic[] = ['time', 'prices', 'places', 'codes'];

const pickMeaning = (nativeCode: string, en: string, tr: string) => (nativeCode === 'tr' ? tr : en);
const pickTargetWord = (targetCode: string, text: string) => WORD_TRANSLATIONS_BY_LANG[targetCode]?.[text] ?? text;

export const getSpeechLocale = (targetCode: string) => SPEECH_LOCALES[targetCode] ?? 'en-US';

export const getWordTopics = (nativeCode: string): Array<{ id: WordTopic; title: string }> => {
  return (Object.keys(TOPIC_TITLES) as WordTopic[]).map((id) => ({
    id,
    title: nativeCode === 'tr' ? TOPIC_TITLES[id].tr : TOPIC_TITLES[id].en,
  }));
};

export const getDetailTopics = (nativeCode: string): Array<{ id: DetailTopic; title: string }> => {
  return DETAIL_OPTIONS.map((id) => ({
    id,
    title: nativeCode === 'tr' ? DETAIL_TITLES[id].tr : DETAIL_TITLES[id].en,
  }));
};

const pickLocalizedText = (entry: LocalizedPronunciationEntry, targetCode: string) =>
  entry.text[targetCode] ?? entry.text.en ?? Object.values(entry.text)[0] ?? '';

const pickLocalizedSpeakText = (entry: LocalizedPronunciationEntry, targetCode: string) =>
  entry.speakText?.[targetCode] ?? pickLocalizedText(entry, targetCode);

const mapLocalizedEntries = (
  entries: LocalizedPronunciationEntry[],
  targetCode: string,
  nativeCode: string,
  prefix: string,
): PronunciationItem[] => entries.map((entry, idx) => ({
  id: `${prefix}-${idx}`,
  text: pickLocalizedText(entry, targetCode),
  meaning: pickMeaning(nativeCode, entry.meaningEn, entry.meaningTr),
  speakText: pickLocalizedSpeakText(entry, targetCode),
}));

export const getSoundItems = (targetCode: string, nativeCode: string): PronunciationItem[] => {
  const entries = SOUND_ITEMS_BY_LANG[targetCode] ?? SOUND_ITEMS_BY_LANG.en;
  return mapLocalizedEntries(entries, targetCode, nativeCode, 'sound');
};

export const getWordItems = (targetCode: string, nativeCode: string, topic: WordTopic): PronunciationItem[] => {
  const entries = WORDS_BY_TOPIC[topic] ?? WORDS_BY_TOPIC.basics;
  return entries.map((entry, idx) => ({
    id: `word-${topic}-${idx}`,
    text: pickTargetWord(targetCode, entry.text),
    meaning: pickMeaning(nativeCode, entry.meaningEn, entry.meaningTr),
    speakText: pickTargetWord(targetCode, entry.text),
  }));
};

export const getSentenceItems = (targetCode: string, nativeCode: string): PronunciationItem[] => {
  return mapLocalizedEntries(SENTENCE_ITEMS, targetCode, nativeCode, 'sentence');
};

export const getDetailItems = (targetCode: string, nativeCode: string, topic: DetailTopic): PronunciationItem[] => {
  return mapLocalizedEntries(DETAIL_ITEMS_BY_TOPIC[topic] ?? DETAIL_ITEMS_BY_TOPIC.time, targetCode, nativeCode, `detail-${topic}`);
};
