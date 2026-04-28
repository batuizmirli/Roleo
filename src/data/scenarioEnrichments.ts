import type { Scenario } from '../types';

type Enrichment = Pick<
  Scenario,
  | 'baseSituation'
  | 'dramaticBeats'
  | 'likelyMisunderstandings'
  | 'socialRisk'
  | 'usefulPhrases'
  | 'difficultyVariants'
  | 'replayTwists'
  | 'grammarFocus'
  | 'vocabularyFocus'
>;

// Keyed by scenario id. Merged into scenarios[] at export time.
// All fields optional — legacy screens continue working without changes.
export const SCENARIO_ENRICHMENTS: Record<string, Enrichment> = {

  // ── 01. CAFÉ ORDER ──────────────────────────────────────────────────────────
  'london-cafe': {
    baseSituation:
      'Sabah kuyruğu uzun, barista hızlı tempoda. Siparişini net ve kısa söylemen gerekiyor — tereddüt edersen sıradaki müşteriye geçilebilir.',
    dramaticBeats: [
      'Barista siparişini yanlış duyuyor: "oat" yerine "whole milk" geliyor.',
      'Kasa sistemi kasıyor, baristandaki stres yüzüne vuruyor.',
      'Arkandan biri de tam o an sipariş vermeye çalışıyor.',
    ],
    likelyMisunderstandings: [
      '"I want" direkt ve biraz kaba hissettiriyor — "I\'d like" çok daha pürüzsüz.',
      'Süt türünü (oat, soy, almond) açıkça söylemezsen "normal milk" geliyor.',
      '"Sorry?" yerine "Could you say that again?" daha kibar ve profesyonel.',
    ],
    socialRisk:
      'Kararsız ya da belirsiz sipariş, kalabalık sabah kuyruğunda hem seni hem arkandakileri yavaşlatır.',
    usefulPhrases: [
      { phrase: "Could I get a flat white to go, please?", context: 'Hızlı, nazik, tam sipariş' },
      { phrase: "Oat milk, if you have it.", context: 'Süt tercihini kibar ekleme' },
      { phrase: "Sorry, could you repeat that?", context: 'Anlamadığında yeniden sormak' },
      { phrase: "Actually, make that a large.", context: 'Siparişi düzeltmek' },
      { phrase: "Can I pay by card?", context: 'Ödeme yöntemi sormak' },
    ],
    difficultyVariants: {
      easy: { systemPromptSuffix: '\nPace is relaxed. Barista is warm and patient. Repeat anything the user misses without being asked.' },
      medium: { systemPromptSuffix: '\nBarista is busy. Normal pace. Mild impatience if the user hesitates for more than one beat.' },
      hard: { systemPromptSuffix: '\nMorning rush. Barista speaks fast, skips pleasantries. If the user is unclear, move straight to the next customer.' },
    },
    replayTwists: [
      'Bu sefer barista kartın çalışmadığını söylüyor — nakit var mı diye soruyor.',
      'Barista sana bir isim soruyor; sipariş hazır olunca sesleneceğini söylüyor.',
      'Istediğin süt türü bitmiş — alternatifi kabul edip etmeyeceğini soruyor.',
    ],
    grammarFocus: '"I\'d like" vs "I want" — polite request forms in service contexts',
    vocabularyFocus: 'Coffee sizes, milk alternatives, payment phrases',
  },

  // ── 02. HOTEL CHECK-IN ───────────────────────────────────────────────────────
  'hotel-checkin': {
    baseSituation:
      'Uzun bir yolculuğun ardından otele giriyorsun. Resepsiyonist prosedüre bağlı ama gülümser — sisteme göre seni bulamıyor.',
    dramaticBeats: [
      'Resepsiyonist rezervasyon sisteminde ismini bulamıyor.',
      'Odanın hazır olmadığını, 20 dakika beklemeniz gerekebileceğini söylüyor.',
      'Aranan belgeyi (pasaport, rezervasyon numarası) yanında aramak zorunda kalıyorsun.',
    ],
    likelyMisunderstandings: [
      'Rezervasyon e-postasında "booking reference" veya "confirmation number" yazar — "reservation number" da kabul görür.',
      '"Room isn\'t ready" duyduğunda panik yapmak yerine bekleme alanı istemek doğru hamle.',
      '"Smoking or non-smoking?" sorusu bazı otellerde hâlâ sorulur — hazırlıklı ol.',
    ],
    socialRisk:
      'Sinirli ya da belirsiz yanıtlar, resepsiyonisti yavaşlatır ve seni sisteme yanlış kaydetme riskine sokar.',
    usefulPhrases: [
      { phrase: "I have a reservation under the name...", context: 'Check-in başlatmak' },
      { phrase: "Here\'s my confirmation number.", context: 'Rezervasyon belgesi sunmak' },
      { phrase: "Is there anywhere I can wait?", context: 'Oda hazır değilse kibarca çözüm istemek' },
      { phrase: "Could I have a room on a higher floor?", context: 'Oda tercihi belirtmek' },
      { phrase: "What time is checkout?", context: 'Çıkış saatini öğrenmek' },
    ],
    difficultyVariants: {
      easy: { systemPromptSuffix: '\nReceptionist is warm and walks the user through each step. No surprises.' },
      medium: { systemPromptSuffix: '\nSystem glitch: reservation appears under a slightly different name. User must clarify.' },
      hard: { systemPromptSuffix: '\nRoom not ready, upgrade available for a fee, and another guest is waiting behind. Handle it quickly and clearly.' },
    },
    replayTwists: [
      'Bu sefer oda yükseltmesi teklif ediliyor — ek ücretle. Kabul edip etmeyeceğini söyle.',
      'Bilgi güncelleme: telefon numaranı sormak istiyor.',
      'Anahtarın otomatiğe bağlı — bunu sana açıklarken takip etmek gerekiyor.',
    ],
    grammarFocus: 'Polite requests: "Could I...", "Would it be possible to..."',
    vocabularyFocus: 'Hotel check-in: reservation, confirmation, room types, floor, checkout',
  },

  // ── 03. ASKING DIRECTIONS ────────────────────────────────────────────────────
  'lost-in-city': {
    baseSituation:
      'Şehir merkezinde kaybolmuşsun, telefonun %3 batarya ve harita uygulaması açılmıyor. Yolu birine sormalısın.',
    dramaticBeats: [
      'Yönlendirme aldıktan sonra "turn left at the pub" diyorlar — hangi pub olduğunu bilmiyorsun.',
      'İki yönlendirme çelişiyor: ilk kişi sağa, ikincisi sola diyor.',
      'Hedef yer kapalı ya da taşınmış — bunu orada öğreniyorsun.',
    ],
    likelyMisunderstandings: [
      '"Down the road" uzak olduğu anlamına gelmez — genellikle "bir süre düz git" demektir.',
      '"You can\'t miss it" dedikleri yer çoğu zaman çok dikkat etmezsen kaçırılıyor.',
      'Yönlendirmeyi anlamadığında "sorry, could you show me on the map?" demek utanılacak değil, mantıklı.',
    ],
    socialRisk:
      'Yanlış anlaşılan yön, on dakika fazla yürüme veya önemli bir şeyi kaçırmak anlamına gelebilir.',
    usefulPhrases: [
      { phrase: "Excuse me, do you know where [place] is?", context: 'Sormaya başlamak' },
      { phrase: "Is it within walking distance?", context: 'Mesafeyi anlamak' },
      { phrase: "Sorry, could you repeat that more slowly?", context: 'Yavaş tekrar istemek' },
      { phrase: "Left at the traffic lights, right?", context: 'Anladığını teyit etmek' },
      { phrase: "Thank you so much, you\'ve been really helpful.", context: 'Kibarca kapamak' },
    ],
    difficultyVariants: {
      easy: { systemPromptSuffix: '\nLocal speaks slowly and clearly, offers to repeat. Simple landmarks.' },
      medium: { systemPromptSuffix: '\nLocal gives directions at natural pace with two turns. User should confirm understanding.' },
      hard: { systemPromptSuffix: '\nLocal gives fast directions with three turns and a landmark that\'s ambiguous. If the user doesn\'t confirm, proceed as if they understood.' },
    },
    replayTwists: [
      'Bu sefer kişi sana yanlış yönü tarif ediyor — dönüp tekrar sormalısın.',
      'Gittiğin yere ulaşıyorsun ama yanlış bina — daha spesifik sormak gerekiyordu.',
      'Yol tarif eden kişi turist — ikisi birlikte kaybolmuş durumdasınız.',
    ],
    grammarFocus: 'Confirming understanding: "So if I turn left at... and then...?"',
    vocabularyFocus: 'Directions: landmarks, distances, turn left/right, straight on, next to, opposite',
  },

  // ── 04. TRAIN PROBLEM ────────────────────────────────────────────────────────
  'train-delay': {
    baseSituation:
      'Trenim 40 dakika gecikti ve bağlantı trenini kaçıracaksın. Görevli stres altında — ama alternatif güzergah var.',
    dramaticBeats: [
      'Görevli radyodan bilgi alıyor ve sana yarım bilgi veriyor.',
      'Alternatif güzergahta aktarma noktası belirsiz — iki durak atlamak gerekiyor.',
      'Biletinin yeni trende geçerli olup olmadığını sorman gerekiyor.',
    ],
    likelyMisunderstandings: [
      '"The next service" mutlaka aynı hat demek değildir — platforma dikkat et.',
      '"Your ticket is valid" ile "your reservation is valid" farklı şeyler.',
      'İade (refund) için "claim form" doldurman gerekebilir — bunu sormayı unutma.',
    ],
    socialRisk:
      'Sakin kalmak ve net sormak, stresin içindeki görevliden doğru bilgiyi almanın tek yolu.',
    usefulPhrases: [
      { phrase: "Will my ticket be valid on the next train?", context: 'Bilet geçerliliği' },
      { phrase: "Is there an alternative route?", context: 'Seçenek aramak' },
      { phrase: "Can I get a refund if I miss my connection?", context: 'İade hakkını sormak' },
      { phrase: "Which platform is the alternative service from?", context: 'Platform bilgisi' },
      { phrase: "How long will the delay be, approximately?", context: 'Tahmini bekleme süresi' },
    ],
    difficultyVariants: {
      easy: { systemPromptSuffix: '\nStaff member is calm and has full information. Takes time to explain clearly.' },
      medium: { systemPromptSuffix: '\nStaff is busy. Gives partial info — user must ask follow-up questions to get the full picture.' },
      hard: { systemPromptSuffix: '\nStaff has two passengers to handle at once. Gives fast, incomplete answers. User must be assertive to get what they need.' },
    },
    replayTwists: [
      'Bu sefer tren tamamen iptal — geri ödeme istemek zorundasın.',
      'Alternatif tren aynı şehre gitmiyor — farklı bir plan yapman lazım.',
      'Bekleme salonunun dolu olduğunu söylüyor; başka ne yapabileceğini sor.',
    ],
    grammarFocus: 'Modal verbs for necessity: "will", "can", "should" in formal requests',
    vocabularyFocus: 'Train travel: delay, platform, connection, refund, alternative, valid',
  },

  // ── 05. RESTAURANT PROBLEM ───────────────────────────────────────────────────
  'nyc-diner': {
    baseSituation:
      'New York diner\'ında kahvaltı sırası. Garson hızlı tempolu, masalar dolu, sipariş ekranına bakarak yazıyor. Yanlış sipariş gelirse nazikçe düzeltmen gerekiyor.',
    dramaticBeats: [
      'Sipariş verdiğinde yanlış yumurta pişirme şekli geliyor.',
      'Kafein alıp almadığını sormuyor bile — normal kahve geliyor, sen decaf istemiştin.',
      'Hesap senden önceki masanın hesabıyla karışmış.',
    ],
    likelyMisunderstandings: [
      '"Sunny side up" = sarısı akıcı; "over easy" = biraz pişmiş sarı. Fark önemli.',
      '"Check" demek hesap istemek; ama ABD\'de "the bill" de anlaşılır.',
      '"To go" veya "for here" sorusunu bekle — cevaplamadan sipariş almaya devam edebilir.',
    ],
    socialRisk:
      'Hızlı bir diner\'da çok yavaş karar vermek hem kendini hem de garsonun temposunu bozar.',
    usefulPhrases: [
      { phrase: "Actually, I ordered scrambled, not sunny side up.", context: 'Nazikçe yanlış siparişi düzeltmek' },
      { phrase: "Could I get a refill on the coffee, please?", context: 'Kahve doldurmak istemek' },
      { phrase: "Can I get that on the side?", context: 'Garnitürü ayrı istemek' },
      { phrase: "Check, please — when you get a chance.", context: 'Hesap istemek ama acele ettirmeden' },
      { phrase: "I think there\'s a mix-up with the bill.", context: 'Hesap hatası bildirmek' },
    ],
    difficultyVariants: {
      easy: { systemPromptSuffix: '\nWaiter is in a good mood, not too rushed. Happy to correct any mistakes politely.' },
      medium: { systemPromptSuffix: '\nWaiter is busy. Makes one honest mistake during the order. Waits to see if user catches it.' },
      hard: { systemPromptSuffix: '\nWaiter is fast, distracted, makes two errors, and brings the wrong bill. User must navigate all of this calmly.' },
    },
    replayTwists: [
      'Bu sefer masana başkasının siparişi geliyor — çok açsın ve yemek sıcak, ne yapacaksın?',
      'Menüde istediğin yok — substitution istemek zorundasın.',
      'Kredi kartın çalışmıyor; nakit yoksa ne diyeceksin?',
    ],
    grammarFocus: '"Actually, I ordered..." — polite correction with past tense',
    vocabularyFocus: 'Diner food, egg styles, payment, corrections, refills',
  },

  // ── 06. SMALL TALK BEFORE MEETING ───────────────────────────────────────────
  'coffee-chat-colleague': {
    baseSituation:
      'Önemli bir toplantıdan önce mutfakta beş dakikan var. İş arkadaşın sohbet başlatıyor — ama gerçek soru kafasında toplantıda nasıl yaklaşacağın.',
    dramaticBeats: [
      'Arkadaşın toplantıdaki bir konuya değinmeye başlıyor — kendi görüşünü ima ediyor.',
      'Geçen hafta sana atfedilen bir şeyden bahsediyor — doğru anlamış mı?',
      'Toplantı başlamadan seni probeye çekiyor: "ne düşünüyorsun bu değişiklik hakkında?"',
    ],
    likelyMisunderstandings: [
      '"How\'s it going?" her zaman gerçek bir cevap beklemez — kısa ve olumlu yeterli.',
      '"Hectic" veya "crazy busy" söylersen karşı taraf konuşmayı kısa kesebilir.',
      'İş hakkında çok detay verirsen toplantıdaki konumunu önceden satmış olursun.',
    ],
    socialRisk:
      'Fazla paylaşmak toplantıya girmeden pozisyonunu zayıflatabilir; çok az ilgi, soğuk görünmene yol açar.',
    usefulPhrases: [
      { phrase: "Not bad, keeping busy! You?", context: 'Hafif, enerji yüklü yanıt' },
      { phrase: "Yeah, it\'s been a lot — looking forward to this one though.", context: 'Toplantıya pozitif yaklaşım' },
      { phrase: "I think it\'ll be an interesting discussion.", context: 'Fikri açmadan merak uyandırmak' },
      { phrase: "We should grab a proper coffee after — I want to hear your take.", context: 'Bağlantıyı ileriye taşımak' },
      { phrase: "Shall we head in?", context: 'Kibarca toplantıyı başlatmak' },
    ],
    difficultyVariants: {
      easy: { systemPromptSuffix: '\nColleague keeps it light and simple. Only asks surface-level questions.' },
      medium: { systemPromptSuffix: '\nColleague steers conversation toward the meeting topic. User should navigate without giving their position away too early.' },
      hard: { systemPromptSuffix: '\nColleague is probing for your stance on a contentious meeting point. You must be warm but non-committal.' },
    },
    replayTwists: [
      'Bu sefer arkadaşın toplantıda sana destek vereceğini söylüyor — nasıl tepki vereceksin?',
      'Başka bir meslektaş da mutfağa giriyor — üçlü sohbet yönetmek zorundasın.',
      'Arkadaşın senden bir bilgi almaya çalışıyor ama paylaşmamalısın.',
    ],
    grammarFocus: 'Vague but positive responses: "should be interesting", "we\'ll see"',
    vocabularyFocus: 'Office small talk: hectic, swamped, catch up, wrap up, grab coffee',
  },

  // ── 07. GIVING AN OPINION / DEFENDING A POSITION ────────────────────────────
  'conference-room-debate': {
    baseSituation:
      'Ürün yöneticisi senin önerine itiraz ediyor — veriyle, mantıkla, biraz da kibarca baskıyla. Fikrini geri çekmeden ama saldırgan olmadan savunman gerekiyor.',
    dramaticBeats: [
      'Karşı taraf senin verine alternatif bir veri sunuyor — hazırlıklı değilsin.',
      'Soru "bu fikri daha önce denediniz mi?" — denemedin.',
      '"Kim bunu onayladı?" sorusu geliyor — henüz kimse onaylamamış.',
    ],
    likelyMisunderstandings: [
      '"I think" yerine "the data suggests" demek argümanını güçlendirir.',
      'Hızlı "fair point" demek pozisyonu teslim etmek gibi görünebilir — önce kendi noktanı ekle.',
      'Sessizlik savunmasızlık değil; düşünmek için "let me think about that" demek güçtür.',
    ],
    socialRisk:
      'Çok hızlı geri adım atmak güvenilirliği düşürür; çok katı kalmak takım dinamiğini bozar.',
    usefulPhrases: [
      { phrase: "I see your point — but the risk here is...", context: 'Karşı görüşü kabul edip bağlamı genişletmek' },
      { phrase: "Based on what we\'ve seen so far, I still think...", context: 'Pozisyonu veriye dayandırmak' },
      { phrase: "That\'s a fair challenge — can I come back to that?", context: 'Zaman kazanmak' },
      { phrase: "What would change your mind on this?", context: 'Diyaloğu ters çevirmek' },
      { phrase: "I\'m open to adjusting the approach, but not the goal.", context: 'Esneklik gösterip özü korumak' },
    ],
    difficultyVariants: {
      easy: { systemPromptSuffix: '\nManager pushes back once, then becomes receptive if the user gives a clear reason.' },
      medium: { systemPromptSuffix: '\nManager pushes back twice with data. User must counter with reasoning, not just repetition.' },
      hard: { systemPromptSuffix: '\nManager disagrees with three separate points and asks for evidence. User must stay composed and structured.' },
    },
    replayTwists: [
      'Bu sefer yönetici başka bir ekip üyesinin rakip önerisini masaya getiriyor.',
      'Senden toplantıda hemen karar vermeni istiyorlar — baskı altında net olmak zorundasın.',
      'Yönetici sana katılıyor ama farklı gerekçeyle — aradaki farkı kapatabilir misin?',
    ],
    grammarFocus: 'Concessive structures: "While I understand..., I still believe..."',
    vocabularyFocus: 'Debate: evidence, trade-off, feasible, push back, stakeholders, bottom line',
  },

  // ── 08. SOFT DISAGREEMENT ────────────────────────────────────────────────────
  'flatmate-conflict': {
    baseSituation:
      'Ev arkadaşın hafif sinirli ve konuşmak istiyor. Sorun küçük ama birikmiş — onu dinleyip kendini de net ifade etmen gerekiyor.',
    dramaticBeats: [
      'Ev arkadaşın problemi söylerken "her zaman" veya "hiç" gibi abartılı kelimeler kullanıyor.',
      'Haklı olmadığın bir konuda da haklıymışsın gibi davranmana çalışıyor.',
      'Çözüm önerdiğinde kabul etmiyor — daha iyi bir çözüm istiyor.',
    ],
    likelyMisunderstandings: [
      '"I hear you" anlamana değil, söylediklerini duyduğunu gösterir — empati yeter.',
      '"That\'s not fair" çabuk savunmaya geçmek gibi algılanabilir — önce anladığını göster.',
      '"To be honest" ile başlayan cümle karşı tarafta alarm yaratabilir — yumuşat.',
    ],
    socialRisk:
      'Savunmacı ya da sessiz kalmak sorunu büyütür; fazla özür dilemek de güçsüz göründürür.',
    usefulPhrases: [
      { phrase: "I hear you — that sounds frustrating.", context: 'Empatiyle açmak' },
      { phrase: "I didn\'t realise it bothered you. I\'ll be more careful.", context: 'Gerçek kabul, fazla özür olmadan' },
      { phrase: "What would work better for you?", context: 'Çözümü karşıya bırakmak' },
      { phrase: "I\'d appreciate it if we could figure this out together.", context: 'İşbirliğini davet etmek' },
      { phrase: "Let\'s agree on something we can both live with.", context: 'Uzlaşıya yönlendirmek' },
    ],
    difficultyVariants: {
      easy: { systemPromptSuffix: '\nFlatmate is mild and just wants to be heard. Accepts any reasonable solution quickly.' },
      medium: { systemPromptSuffix: '\nFlatmate has two complaints and won\'t accept the first solution offered.' },
      hard: { systemPromptSuffix: '\nFlatmate is emotional, brings up a past incident, and needs both validation and a concrete plan before calming down.' },
    },
    replayTwists: [
      'Bu sefer sen de bir şikayetin var — ikisi aynı anda masaya geliyor.',
      'Ev arkadaşın konuşmayı kısa kesmek istiyor — ama sorun hâlâ çözülmedi.',
      'Üçüncü bir ev arkadaşı sizi duyuyor ve müdahale ediyor.',
    ],
    grammarFocus: 'Indirect language: "I find it a bit difficult when...", "it would help me if..."',
    vocabularyFocus: 'Conflict resolution: fair, take turns, split, sort it out, appreciate, honest',
  },

  // ── 09. GROCERY / PHARMACY ───────────────────────────────────────────────────
  'emergency-pharmacy': {
    baseSituation:
      'Başın ağrıyor ve antibiyotiğin bitmek üzere. Eczacıya durumunu anlatman ve doğru ürünü almanı sağlamanı gerekiyor — reçetenin varsa göster, yoksa ona göre ilerle.',
    dramaticBeats: [
      'Eczacı spesifik semptomu soruyor — "ağrı" yetmiyor, nerede ve nasıl bir ağrı?',
      'İstediğin ilaç reçeteli — alternatif öneriyor.',
      'Alerjin var mı diye soruyor — hazırlıklı mısın?',
    ],
    likelyMisunderstandings: [
      '"Headache" baş ağrısı demek ama "migraine" farklı bir ilaç gerektirir.',
      '"Over the counter" reçetesiz demek — bu kelimeyi bilmezsen eczacı açıklar ama zaman alır.',
      'Doz talimatları ("twice a day with food") hızlı söylenirse kaçırabilirsin — tekrar sorma hakkın var.',
    ],
    socialRisk:
      'Yanlış anlaşılmak yanlış ilaç almak demek — net ve spesifik konuşmak burada hayati önem taşır.',
    usefulPhrases: [
      { phrase: "I\'ve had a throbbing headache since this morning.", context: 'Semptomu tarif etmek' },
      { phrase: "Is this available without a prescription?", context: 'Reçetesiz olup olmadığını sormak' },
      { phrase: "I\'m allergic to ibuprofen — is there an alternative?", context: 'Alerjini bildirmek' },
      { phrase: "How many times a day should I take this?", context: 'Doz talimatını netleştirmek' },
      { phrase: "Could you write that down for me?", context: 'Yazılı talimat istemek' },
    ],
    difficultyVariants: {
      easy: { systemPromptSuffix: '\nPharmacist is patient, explains everything clearly, checks for allergies proactively.' },
      medium: { systemPromptSuffix: '\nPharmacist asks specific follow-up questions. User must describe symptoms accurately to get the right recommendation.' },
      hard: { systemPromptSuffix: '\nPharmacist is dealing with another patient too. Speaks quickly, asks if you have allergies before recommending. If user misses the question, prescribes something generic.' },
    },
    replayTwists: [
      'Bu sefer ilaç stokta yok — başka bir şubeye gitmen öneriliyor.',
      'Sigortanın geçerli olup olmadığını soruyorlar.',
      'Sana ilaç yerine doktora gitmeyi tavsiye ediyor — nasıl tepki vereceksin?',
    ],
    grammarFocus: 'Describing symptoms: "I\'ve had... since...", "It hurts when I..."',
    vocabularyFocus: 'Pharmacy: prescription, over the counter, dosage, allergy, symptoms, side effects',
  },

  // ── 10. POLITE CORRECTION / MISUNDERSTANDING ─────────────────────────────────
  'phone-call-complaint': {
    baseSituation:
      'Müşteri hizmetlerini arıyorsun. Sistem seni yanlış birime yönlendirdi, görevli biraz robotik. Sabırlı ama net olmak zorundasın.',
    dramaticBeats: [
      'Görevli seni 3 dakika beklemeye alıyor — geri dönünce kim olduğunu unutmuş.',
      'Referans numaranı yanlış okuyor — nazikçe düzeltmek gerekiyor.',
      'Sorunun "politikaya aykırı" olduğunu söylüyor — ama sen haklısın.',
    ],
    likelyMisunderstandings: [
      '"I\'d like to make a complaint" resmi başlangıç; "I have a bit of an issue" daha yumuşak ve aynı yere varır.',
      '"Can I speak to your manager?" çabuk başvurmak yerine mevcut görevliyle çözmeye çalışmak daha verimli.',
      '"Reference number" derken yavaş oku — görevli yazıyor.',
    ],
    socialRisk:
      'Sinirli ses tonu veya çok ısrarcı olmak seni sisteme "zor müşteri" olarak kaydettirip bekleme süresini uzatabilir.',
    usefulPhrases: [
      { phrase: "Hi, I\'m calling about an issue with my recent order.", context: 'Nazik ve net açış' },
      { phrase: "I believe there\'s been a misunderstanding — let me explain.", context: 'Yanlışlığı kibarca düzeltmek' },
      { phrase: "I understand your policy, but in this case...", context: 'Politikayı kabul edip istisnayı açmak' },
      { phrase: "Could I get a reference number for this call?", context: 'Takip için belge istemek' },
      { phrase: "I appreciate your help — is there anything else I can do to speed this up?", context: 'Pozitif baskı uygulamak' },
    ],
    difficultyVariants: {
      easy: { systemPromptSuffix: '\nAgent is polite and solves the problem by the third exchange.' },
      medium: { systemPromptSuffix: '\nAgent follows a script strictly. User must provide specific information in a specific order.' },
      hard: { systemPromptSuffix: '\nAgent puts you on hold twice, reads the wrong reference number, and initially denies the refund. You must stay polite but persistent.' },
    },
    replayTwists: [
      'Bu sefer hat kesildi ve tekrar aramak zorunda kaldın — durumu yeniden anlat.',
      'Görevli sorunu çözemiyor — yöneticiye bağlamak için kibarca ısrar et.',
      'Teklif ettikleri çözüm senin istediğin değil — karşı teklif sun.',
    ],
    grammarFocus: 'Polite persistence: "I understand, however...", "I appreciate that, but..."',
    vocabularyFocus: 'Customer service: reference number, refund, escalate, hold, compensation, complaint',
  },

  // ── BONUS: SPANISH CAFÉ (yaygın giriş sahnesi) ──────────────────────────────
  'cafe-barcelona': {
    baseSituation:
      'Barselona\'da bir kafede kalabalık sabah servisi. Barista İspanyolcan hakkında sabırlı ama tempo düşük toleranslı — net sipariş bekleniyor.',
    dramaticBeats: [
      'Barista hızlı konuşuyor ve sütün türünü soruyor — cevabı anlamak zor.',
      'Fiyat beklenenden yüksek — sormak mı, kabul etmek mi?',
      'Yanındaki sandalyeye oturabilir misin diye soruyor — boş mu yoksa dolu mu?',
    ],
    likelyMisunderstandings: [
      '"Quiero" doğru ama direkt; "quisiera" daha kibar ve Barselona\'da daha doğal.',
      '"Con leche" sütlü; "cortado" az sütlü; "solo" sade — bunları karıştırma.',
      'Hesap istemek için "la cuenta, por favor" yeterli — fazla açıklama gerekmez.',
    ],
    socialRisk:
      'Yanlış sipariş Ispanyolca tarafında küçük bir yüz kızarıklığı — ama aynı zamanda en iyi öğrenme anı.',
    usefulPhrases: [
      { phrase: "Quisiera un café con leche, por favor.", context: 'Nazik sipariş' },
      { phrase: "¿Tiene leche de avena?", context: 'Yulaf sütü sormak' },
      { phrase: "¿Cuánto es?", context: 'Fiyat sormak' },
      { phrase: "La cuenta, por favor.", context: 'Hesap istemek' },
      { phrase: "¿Está ocupada esta silla?", context: 'Sandalye boş mu sormak' },
    ],
    difficultyVariants: {
      easy: { systemPromptSuffix: '\nBarista switches to slower Spanish with a Turkish translation cue if the user seems confused.' },
      medium: { systemPromptSuffix: '\nBarista speaks at normal speed. No translation prompts unless user asks explicitly.' },
      hard: { systemPromptSuffix: '\nBarista speaks fast Catalan-accented Spanish. Asks two follow-up questions quickly. User must keep up.' },
    },
    replayTwists: [
      'Bu sefer istediğin kahve çeşidi menüde yok — ikame iste.',
      'Barista sana Katalanca bir şey söylüyor — İspanyolca tekrar etmesini kibarca iste.',
      'Sıradaki müşteri acele ediyor — baskı altında hızlı sipariş ver.',
    ],
    grammarFocus: '"Quisiera" vs "quiero" — conditional for politeness',
    vocabularyFocus: 'Coffee types: café solo, cortado, con leche, americano; payment; seating',
  },
};
