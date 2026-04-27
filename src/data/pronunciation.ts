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

const RANGE_OPTIONS: NumberRange[] = ['0-100', '101-200', '201-300', '301-400'];

const pickMeaning = (nativeCode: string, en: string, tr: string) => (nativeCode === 'tr' ? tr : en);
const pickTargetWord = (targetCode: string, text: string) => WORD_TRANSLATIONS_BY_LANG[targetCode]?.[text] ?? text;

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

export const getWordItems = (targetCode: string, nativeCode: string, topic: WordTopic): PronunciationItem[] => {
  const entries = WORDS_BY_TOPIC[topic] ?? WORDS_BY_TOPIC.basics;
  return entries.map((entry, idx) => ({
    id: `word-${topic}-${idx}`,
    text: pickTargetWord(targetCode, entry.text),
    meaning: pickMeaning(nativeCode, entry.meaningEn, entry.meaningTr),
    speakText: pickTargetWord(targetCode, entry.text),
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
