export type CulturalTip = {
  id: string;
  text: string;
  example?: string;
};

const tips: Record<string, CulturalTip[]> = {
  es: [
    {
      id: 'es-smile',
      text: 'İspanyollar konuşurken tebessüme çok değer verir. Yüz ifaden kadar sesin tonu da önemlidir — sıcak bir "hola" zaten kapıları açar.',
    },
    {
      id: 'es-tio',
      text: '"Tío" veya "tía" ifadesi arkadaşça sohbetlerde "dostum" anlamına gelir. Tanıdığın biriyle konuşurken kullanmak ortamı hemen samimileştirir.',
      example: '¡Venga, tío! — Hadi ya, dostum!',
    },
    {
      id: 'es-por-favor',
      text: 'Garson veya kasiyerle konuşurken cümlenin sonuna "por favor" eklemen nezaketi büyük ölçüde artırır.',
      example: 'Un café solo, por favor.',
    },
    {
      id: 'es-absolutamente',
      text: '"Absolutamente" demek yerine "claro", "exacto" veya "por supuesto" tercih edilir. Onay verirken bu üç seçenek çok daha doğal duyulur.',
      example: '¿Vienes mañana? — Claro que sí.',
    },
    {
      id: 'es-perdona',
      text: 'Birinin dikkatini çekmek için "perdona" ya da "oiga" kullanabilirsin. Sokakta yabancıya soru soracaksan "oiga" daha resmi ve saygılı.',
      example: 'Perdona, ¿sabes dónde está el metro?',
    },
  ],
  en: [
    {
      id: 'en-small-talk',
      text: 'İngilizce konuşmalarda "small talk" kaçınılmazdır. Hava durumu, hafta sonu planları veya "How was your week?" ile başlamak gayet normaldir — gereksiz gelmez.',
    },
    {
      id: 'en-sorry',
      text: '"Sorry" İngilizce\'de çok amaçlıdır: özür dilemek, dikkat çekmek ve hatta anlamadığında "ne dedin?" yerine kullanılır. Özellikle İngiliz İngilizcesinde sık geçer.',
      example: 'Sorry, could you repeat that?',
    },
    {
      id: 'en-please-end',
      text: 'İstekte bulunurken "please" cümlenin sonuna gelebilir. Başa koymak kadar doğaldır; sonuna koymak özellikle ABD\'de daha yaygındır.',
      example: 'Can I get a coffee, please?',
    },
    {
      id: 'en-cheers',
      text: 'Britanya\'da "cheers" yalnızca "şerefe" anlamına gelmez; teşekkür etmek, veda etmek ve "tamam anlaşıldı" gibi durumlarda da kullanılır.',
      example: 'Here\'s your change. — Cheers!',
    },
    {
      id: 'en-would',
      text: '"Would" fiili sana kibarlık katmanı verir. Kesin bir istek yerine koşullu sorgu tonu çok daha nazik duyulur.',
      example: 'I want tea. → I\'d like some tea, please.',
    },
  ],
  fr: [
    {
      id: 'fr-bonjour',
      text: 'Fransa\'da bir mağazaya veya kafeteryaya girince "Bonjour" demeden bir şey sormak kaba sayılır. Selamlama her etkileşimin birinci adımıdır.',
    },
    {
      id: 'fr-vouvoyer',
      text: 'Tanımadığın birine her zaman "vous" kullan, "tu" değil. Yanlış hitap ciddi rahatsızlık yaratabilir. Karşı taraf "tu" derlerse o zaman geçebilirsin.',
    },
    {
      id: 'fr-sil-vous-plait',
      text: '"S\'il vous plaît" kelimesini her istekte kullanmak Fransız nezaket kodunun temelidir. "Un café" demek, "Un café, s\'il vous plaît" demekle aynı şey değildir.',
      example: 'L\'addition, s\'il vous plaît.',
    },
    {
      id: 'fr-bise',
      text: 'Yanaklara öpücük (la bise) sıradan bir selamlama ritüelidir — tek, çift veya üç, bölgeye göre değişir. Şaşırma, gülümse ve katıl.',
    },
    {
      id: 'fr-precise',
      text: 'Fransızca\'da "pas mal" (fena değil) genellikle oldukça iyi bir şey anlamına gelir. "Bien" nötr, "très bien" gerçekten iyi. Övgü İngilizce\'deki kadar yüksek ses tonunda olmaz.',
    },
  ],
  de: [
    {
      id: 'de-siezen',
      text: 'Almanca\'da tanımadığın herkese "Sie" (büyük S) ile hitap et. İş hayatında bu kural çok önemlidir. "Du" yetkisini karşı taraf verir.',
    },
    {
      id: 'de-punktlichkeit',
      text: 'Dakiklik Almanca\'da sosyal bir değerdir. "5 dakika geç kalırım" bile önceden haber vermeden gidilmez. Randevuya tam zamanında gel.',
    },
    {
      id: 'de-bitte',
      text: '"Bitte" hem "lütfen" hem "rica ederim" hem de "buyurun" anlamına gelir. Restoranda sipariş verirken cümlenin sonuna koymak kibarlığın temelidir.',
      example: 'Einen Kaffee, bitte.',
    },
    {
      id: 'de-direct',
      text: 'Almanlar doğrudan konuşmayı tercih eder. "Belki", "olabilir", "düşünürüm" belirsiz ve güvensiz duyulabilir. Net olmak saygı göstergesidir.',
    },
    {
      id: 'de-mahlzeit',
      text: '"Mahlzeit" yemek saatlerinde "afiyet olsun" anlamına gelir ama iş yerinde öğleden sonra sadece "iyi öğleden sonralar" olarak da kullanılır — tam bağlamda söyle.',
    },
  ],
  it: [
    {
      id: 'it-salve',
      text: '"Salve" resmi olmayan ama "ciao"dan biraz daha saygılı bir selamlama. Yaşlı biriyle veya tanımadığın bir müşteriyle "salve" de, "ciao" değil.',
    },
    {
      id: 'it-prego',
      text: '"Prego" İtalyanca\'nın çok amaçlı kelimesidir: "Rica ederim", "buyurun", "lütfen" ve "özür dilerim ne dediniz?" anlamlarında kullanılır.',
      example: 'Grazie mille. — Prego!',
    },
    {
      id: 'it-espresso',
      text: 'Kahve kültürü çok önemlidir. "Un caffè" demek otomatik olarak espresso ister; kahvaltıda cappuccino kabul görür ama öğleden sonra sipariş etmek tuhaf karşılanabilir.',
    },
    {
      id: 'it-hands',
      text: 'El hareketleri konuşmanın ayrılmaz parçasıdır. Ellerin durağan kalması dinleyene soğuk veya ilgisiz görünebilir. Spontane jestler bağlantıyı güçlendirir.',
    },
    {
      id: 'it-allora',
      text: '"Allora" güçlü bir dolgu kelimesidir: "şimdi", "peki", "o zaman" anlamlarında cümle başlarına gelir. Konuşmayı doğal tutmak için sıkça kullan.',
      example: 'Allora, cosa prendiamo?',
    },
  ],
  pt: [
    {
      id: 'pt-saudade',
      text: '"Saudade" yalnızca özlem değil; geçmişe, insanlara veya anlara duyulan derin duygusal bağı tanımlar. Birinin "saudades" duyduğunu duyarsan derin bir bağ kurduğuna işarettir.',
    },
    {
      id: 'pt-oi',
      text: 'Brezilya Portekizcesinde "oi" gündelik selamlama olarak "olá"dan çok daha sık kullanılır. Telefonda da "oi?" ile cevap verilir — doğal ve samimi.',
    },
    {
      id: 'pt-com-licenca',
      text: '"Com licença" birinin önünden geçmek veya dikkatini çekmek için en kibar yoldur. "Desculpa" özür dileme için ayrılır, yer açmak için "com licença" tercih edilir.',
    },
    {
      id: 'pt-obrigado',
      text: 'Erkekler "obrigado", kadınlar "obrigada" der — gramer cinsiyetini kendi cinsiyetine göre kullanmak küçük ama önemli bir ayrıntıdır.',
    },
    {
      id: 'pt-diminutivo',
      text: 'Portekizce ve Brezilya dilinde küçültme ekleri sevgi ve samimiyet gösterir. "Café" → "cafezinho" (biraz kahve / sevgili kahve). Müşteriye kullanmak sıcak bir his yaratır.',
      example: 'Um cafezinho, por favor.',
    },
  ],
};

export const getCulturalTips = (langCode: string): CulturalTip[] =>
  tips[langCode] ?? tips.en;

export const getRandomCulturalTip = (langCode: string): CulturalTip => {
  const list = getCulturalTips(langCode);
  return list[Math.floor(Math.random() * list.length)];
};
