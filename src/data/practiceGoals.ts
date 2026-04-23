/** Günlük pratik odağı — onboarding ve ana sayfa özeti için ortak liste. */

export type PracticeTarget = {
  id: string;
  label: string;
  hint: string;
};

export const GOAL_SECTIONS: { title: string; targets: PracticeTarget[] }[] = [
  {
    title: 'Sokak, seyahat ve sosyal giriş',
    targets: [
      { id: 'small-talk', label: 'Small talk başlatabilmek', hint: 'Sosyal ortamlarda rahat giriş' },
      { id: 'travel-survival', label: 'Seyahatte zorlanmamak', hint: 'Havalimanı, otel, restoran akışı' },
      { id: 'service-clarity', label: 'Mağaza ve serviste net talep etmek', hint: 'İade, sipariş ve yönlendirme cümleleri' },
      { id: 'pronunciation', label: 'Telaffuzu düzeltmek', hint: 'Daha anlaşılır ve temiz ses' },
    ],
  },
  {
    title: 'İş görüşmeleri ve kalıplaşmış dil',
    targets: [
      { id: 'meeting-confidence', label: 'Toplantıda özgüvenli konuşmak', hint: 'İş iletişiminde netlik' },
      { id: 'written-tone', label: 'E-posta ve mesajda doğru tonu yakalamak', hint: 'Kısa, net ve profesyonel yazı' },
      { id: 'phrasal-verbs', label: 'Phrasal verbleri öğrenmek', hint: 'Günlük İngilizcede doğal kalıplar' },
    ],
  },
  {
    title: 'Akıcılık, hız ve derinlik',
    targets: [
      { id: 'b2-speaking', label: 'B2 seviyesinde konuşmak', hint: 'Akıcı, net ve doğal ifade' },
      { id: 'media-summarize', label: 'Haber veya kısa içerikten ana fikri çıkarmak', hint: 'Hızlı konuşmayı parçalayıp özetlemek' },
      { id: 'reasoned-pushback', label: 'Karşı fikre saygılı ama net yanıt vermek', hint: 'Tartışmada duruşunu korumak' },
    ],
  },
  {
    title: 'C1 ve native seviyede sohbetler',
    targets: [
      {
        id: 'register-shading',
        label: 'Resmî ile samimi dil arasında kaydırmak',
        hint: 'Duruma göre tonu milimetrik ayarlamak',
      },
      {
        id: 'specialist-niche',
        label: 'Uzmanla niş bir konuda derinlemesine konuşmak',
        hint: 'Jargon, varsayım ve karşı sorularla ilerlemek',
      },
      {
        id: 'irony-nuance',
        label: 'İroni, espri ve dolaylı anlatıyı doğru okumak',
        hint: 'Alt metni ve yüz ifadesi tonunu yakalamak',
      },
      {
        id: 'hard-negotiation',
        label: 'Sınırda kalan itiraz veya pazarlıkta duruşunu korumak',
        hint: 'Soğukkanlı, keskin ama saygılı ifade',
      },
    ],
  },
];

export const ALL_PRACTICE_TARGETS: PracticeTarget[] = GOAL_SECTIONS.flatMap(s => s.targets);

export const defaultPracticeTarget = (): PracticeTarget => ALL_PRACTICE_TARGETS[0];
