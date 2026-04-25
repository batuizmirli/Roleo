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
      { id: 'small-talk', label: 'Small talk başlatabilmek', hint: 'Sosyal sahnelerde ilk cümleyi prova et' },
      { id: 'travel-survival', label: 'Seyahatte zorlanmamak', hint: 'Havalimanı, otel, restoran anlarını dene' },
      { id: 'service-clarity', label: 'Mağaza ve serviste net talep etmek', hint: 'İade, sipariş ve yönlendirme cevabını çalış' },
      { id: 'pronunciation', label: 'Telaffuzu düzeltmek', hint: 'Sahnede söylemeden önce sesini hazırla' },
    ],
  },
  {
    title: 'İş görüşmeleri ve kalıplaşmış dil',
    targets: [
      { id: 'meeting-confidence', label: 'Toplantıda özgüvenli konuşmak', hint: 'Toplantıdaki kısa cevapları sahnede prova et' },
      { id: 'written-tone', label: 'E-posta ve mesajda doğru tonu yakalamak', hint: 'Kısa, net ve profesyonel yanıtı çalış' },
      { id: 'phrasal-verbs', label: 'Phrasal verbleri kullanmak', hint: 'Günlük sahnelerde doğal kalıpları dene' },
    ],
  },
  {
    title: 'Hız, netlik ve derinlik',
    targets: [
      { id: 'b2-speaking', label: 'Daha net cevap vermek', hint: 'Sahnede daha uzun ve temiz cevaplar seç' },
      { id: 'media-summarize', label: 'Haber veya kısa içerikten ana fikri çıkarmak', hint: 'Duyduğunu kısa ve anlaşılır anlatmayı prova et' },
      { id: 'reasoned-pushback', label: 'Karşı fikre saygılı ama net yanıt vermek', hint: 'Tartışma sahnesinde duruşunu koru' },
    ],
  },
  {
    title: 'Nüanslı ve zor sohbetler',
    targets: [
      {
        id: 'register-shading',
        label: 'Resmî ile samimi dil arasında kaydırmak',
        hint: 'Aynı fikri farklı tonda söylemeyi dene',
      },
      {
        id: 'specialist-niche',
        label: 'Uzmanla niş bir konuda derinlemesine konuşmak',
        hint: 'Jargon ve karşı soruyla sahneyi sürdür',
      },
      {
        id: 'irony-nuance',
        label: 'İroni, espri ve dolaylı anlatıyı doğru okumak',
        hint: 'Alt metinli cevapları sahnede ayırt et',
      },
      {
        id: 'hard-negotiation',
        label: 'Sınırda kalan itiraz veya pazarlıkta duruşunu korumak',
        hint: 'Keskin ama saygılı cevabı prova et',
      },
    ],
  },
];

export const ALL_PRACTICE_TARGETS: PracticeTarget[] = GOAL_SECTIONS.flatMap(s => s.targets);

export const defaultPracticeTarget = (): PracticeTarget => ALL_PRACTICE_TARGETS[0];
