# Roleo — Claude Context

> Bu dosya Roleo projesinin **iki katmanlı kılavuzudur**: tasarım dili (Bölüm A) ve teknik mimari (Bölüm B).
> Cursor veya başka bir AI ile çalışırken bu dosyaya referans ver. Her yeni ekran, bileşen veya feature **bu sistemin içinde kalmalı**.

---

# BÖLÜM A — TASARIM SİSTEMİ

## A1. Ürün Felsefesi

Roleo bir dil öğrenme uygulaması değil. **Bir hayal sahneye çevirme aracı.**

Duolingo gamification yapar, streak kırdırır, kelime ezberletir. Roleo başka bir şey yapar: kullanıcının "neden öğrenmek istediğini" sorar, cevabı somut sahnelere çevirir, her pratik anını o sahnenin içinde geçirir.

Bu felsefe **her tasarım kararını yönlendirir**. Bir bileşen, renk veya yazı tercihi yaparken sor:
- Bu kullanıcıyı sahneye yaklaştırıyor mu, yoksa bir uygulamaya mı geri çekiyor?
- Bu bir oyun ödülü gibi mi hissettiriyor, yoksa anın içinde olmak gibi mi?
- Bir ders mi anlatıyor, yoksa bir an mı yaratıyor?

**"Sahne dili" her zaman "ders dili"nden önce gelir.**

## A2. Tonal Yön

| Kategori | Roleo | Roleo değil |
|---|---|---|
| Estetik | Sinematik, atmosferik, niyetli | Oyuncu, parlak, gamified |
| His | Bir filmin açılış sahnesi | Bir mobil oyun ekranı |
| Kullanıcıya konuşma | Olgun, sakin, empatik | Çocuksu, alkışlayan, hyper |
| Ödül | Anın kendisi | Yıldız, rozet, streak |
| Hata yönetimi | "Tekrar dene" değil "şöyle de denenebilir" | Kırmızı X, ses efekti, can kaybı |
| Kullanıcının rolü | Sahnenin içindeki kişi | Ders alan öğrenci |

> **Not:** XP/streak sistemi mevcut (Bölüm B'de detayı), ama **görsel olarak öne çıkmaz**. Kullanıcı önce sahneyi yaşar, ilerleme arka planda işler.

## A3. Renk Paleti

Tüm renkler theme constants olarak tanımlanır. **Bu değişkenler dışında renk kullanılmaz.**

```typescript
// theme/colors.ts
export const colors = {
  // Zemin — koyu, sinematik
  bgDeep: '#0A0E14',        // Ana arka plan, en koyu
  bgMid: '#121822',         // Kart arka planı, ikincil yüzey
  bgSoft: '#1A2230',        // Üçüncül yüzey, hover state'leri

  // Yazı — yüksek kontrast hiyerarşisi
  inkPrimary: '#E8EAED',    // Ana metin, başlıklar
  inkSecondary: '#9BA3AE',  // Alt metin, açıklamalar
  inkTertiary: '#5B6573',   // Etiket, meta bilgi, ipuçları

  // Akcent — sıcak mum ışığı
  accentWarm: '#E8B576',        // Ana vurgu — CTA hover, önemli işaretler
  accentWarmSoft: '#C99A6A',    // İkincil sıcak ton, daha bastırılmış
  accentGlow: 'rgba(232, 181, 118, 0.18)',  // Glow / aura efektleri

  // Çizgiler
  hairline: 'rgba(255, 255, 255, 0.06)',
  hairlineStrong: 'rgba(255, 255, 255, 0.12)',

  // Durum
  success: '#7FB28E',
  error: '#C97A6A',          // Hata — yumuşak, asla kırmızı değil
} as const;
```

### Renk kullanım kuralları

- **Saf siyah (#000) yasak** — her zaman `bgDeep` (#0A0E14).
- **Saf beyaz (#FFF) sadece fotoğraf üzerinde** (status bar, sahne caption). UI metinleri için her zaman `inkPrimary`.
- **Akcent çok kullanılmaz, az kullanılır.** Bir ekranda 1-2 yer. Her yere konursa kıymeti kaçar.
- **Mavi ana palette yok.** Sıcak akcent ana sahnenin sahibidir. Ama sahne fotoğrafları soğuk tonlar getirebilir (Tokyo gecesi, Stockholm kışı) — bu doğal, fotoğraf kendi atmosferini taşır. Sadece **UI elemanlarının kendisinde** soğuk renk yasak.

## A4. Tipografi

İki font, daha fazlası yok.

### Display: Fraunces
- Soru başlıkları, sahne caption, NPC diyaloğu, kullanıcı transcript, vurgular
- Ağırlık 300 (light), italik özellikle sahne ve kullanıcı sözleri için
- Boyutlar: Soru başlığı 32-36, caption 17-18, NPC 18, transcript 22

### Body: Inter Tight
- UI etiketleri, butonlar, eyebrow, ipucu, meta
- Ağırlıklar 300/400/500/600
- Boyutlar: eyebrow 10-11 (uppercase, letter-spacing 0.2-0.3em), body 12.5-14, buton 15 (600)

```typescript
// theme/typography.ts
import { TextStyle } from 'react-native';

export const typography = {
  display:        { fontFamily: 'Fraunces_300Light',          letterSpacing: -0.3 },
  displayItalic:  { fontFamily: 'Fraunces_300Light_Italic',   letterSpacing: -0.3 },
  body:           { fontFamily: 'InterTight_400Regular' },
  bodyMedium:     { fontFamily: 'InterTight_500Medium' },
  button:         { fontFamily: 'InterTight_600SemiBold',     fontSize: 15 },
  eyebrow:        { fontFamily: 'InterTight_500Medium',
                    fontSize: 11, letterSpacing: 2.6,
                    textTransform: 'uppercase' as const },
} as const satisfies Record<string, TextStyle>;
```

### Tipografik kurallar
- **Generic font yasak:** Inter (Tight değil), Roboto, Arial, system fonts asla.
- **Title case yasak.** "Neden öğrenmek istiyorsun?" — "Neden Öğrenmek İstiyorsun?" değil.
- **Eyebrow her zaman uppercase + wide letter-spacing.**
- **İtalik vurgu sadece accent rengiyle.** Sadece italik akcent yok = yanlış.

## A5. Spacing & Layout

### Spacing scale
4'ün katları + 14 ve 18:
```
4, 8, 12, 14, 16, 18, 22, 24, 28, 32, 40, 48, 56, 64
```

### Hiyerarşik mesafeler
- Section'lar arası: 24-32
- Component içi (label → input): 12-14
- Inline (icon + text): 6-8

### Asla
- 0px padding
- 100% genişlik blok element
- Center-aligned uzun metin (sol hizalı, daha sinematik)

## A6. Component Patterns

### Frosted Glass Panel
UI elemanları fotoğraf üstüne bindiğinde — `expo-blur`:
```tsx
<BlurView intensity={20} tint="dark" style={{
  backgroundColor: 'rgba(10, 14, 20, 0.28)',
  borderWidth: 1,
  borderColor: 'rgba(255, 255, 255, 0.06)',
  borderRadius: 14,
}}>
```
Opaklık fotoğrafın açıklığına göre 0.15-0.55 arasında.

### Cards (NPC dialogue, user prompt)

**NPC kartı** — sıcak ton, üstünde 1px ışık çizgisi:
- BG: linear-gradient (40,30,22, 0.85) → (28,20,14, 0.8)
- Border: rgba(232, 181, 118, 0.18)
- BorderRadius: 18

**Kullanıcı kartı** — koyu ton:
- BG: rgba(10, 14, 20, 0.85)
- Border: hairlineStrong

### Buttons

**CTA primary**
- BG: inkPrimary (krem-beyaz, #E8EAED), color: bgDeep
- BorderRadius: 999, padding: 17/24
- Inter Tight 600, 15px
- Hover/press: BG → accentWarm, translateY -1

**Mic button** — 56x56, BG: inkPrimary (CTA ile aynı krem-beyaz ton), etrafında ripple. **Asla parlak akcent değil** — durağan beyaz, aktifken sıcaklaşır.

### Chips
- BG: rgba(255,255,255,0.03), border: hairline
- BorderRadius: 999, padding: 9/14
- 12.5px, color: inkSecondary

### Progress bars
- Height: 2px, BG: hairlineStrong
- Dolan kısım: linear-gradient accentWarmSoft → accentWarm

## A7. Atmosfer Katmanları

Düz koyu zemin yasak. Her ekran şu katmanları içerir:

- **Glow blobs** — köşelerde yumuşak ışık halkaları. Sıcak (üst sağ), soğuk (alt sol). 12-18s float animasyonu.
- **Grain overlay** — %4-6 opacity film grain. Düz dijital his kırılır.
- **Ambient warm bloom** — sahne ekranlarında alttan yukarı yumuşak parıltı.

## A8. Sahne Fotoğrafları

### Seçim kriterleri
- Ferah, sıkışık olmayan kompozisyon
- Sıcak ışık (gün batımı, akşam, iç mekan sıcak ışığı)
- Yaşanan bir an — boş stüdyo değil
- Doğal kompozisyon (tilt, fisheye yok)
- Marka/metin minimal
- Min 1200px genişlik

### Yerleştirme
- Üst %60 fotoğraf
- Alt yarı koyu UI alanına yumuşak gradient ile geçiş (sert kesik yasak)
- Üzerine metin gelirse: status bar text-shadow, caption frosted glass içinde

## A9. Animasyon

### Felsefe
Bir an'a girmek yavaştır. Roleo'nun animasyonları **gecikmeli ve kademeli** açılır.

### Standard easing
- `cubic-bezier(0.25, 0.1, 0.25, 1)` — ana easing
- `cubic-bezier(0.65, 0, 0.35, 1)` — mekanik (progress bar)

### Açılış stagger
```
Eyebrow:     0.2s gecikme
Başlık:      0.4s
Alt metin:   0.6s
İçerik:      0.8-1.0s
CTA:         1.2s
```
Hepsi: opacity 0→1 + translateY 12→0.

### Asla
- Bounce, elastic easing yok
- 0.2s'den hızlı animasyon yok
- Spinning, blinking, flashing yok

## A10. UX Mikro Kararlar

- **Sahne ismi gerçek bir yer olur** — "Bir kafe" değil, "Le Campanella · Avenue Bosquet". NPC "garson" değil, "Miguel · Garson".
- **Çeviri saklı durur** — NPC diyaloğu altında kesik çizgi ayraçtan sonra italik küçük. Kullanıcı önce orijinali anlamaya çalışsın.
- **Hata değil, alternatif** — "Yanlış" yerine "şöyle de denenebilir". Hata UI'da kırmızı değil, error rengi (yumuşak terra-cotta).
- **Kaçış kapısı her zaman var** — Pratik ekranında "yazılı cevap ver" linki. Sıkışan kullanıcı sahneden kaçmasın.
- **Buton emir değil davet** — "Devam et →" minik ok ile.
- **Eyebrow'lar adım numarası** — "01 / 04", "Sahne 01" — kullanıcı nerede olduğunu hisseder.

## A11. Yasaklar Listesi

- ❌ Yeşil baykuş benzeri maskotlar
- ❌ **Sahne içi görünür streak rozetleri** "X gün üst üste" tarzı — sahne hissini bozar. (ProgressScreen gibi özel ekranlarda olgun, sakin bir dille gösterilebilir; bu yasak değil.)
- ❌ Confetti, alkış sesi, "Great job!" animasyonu
- ❌ Saf parlak renkler (saf yeşil, saf mavi, neon)
- ❌ Comic Sans ve türevi yuvarlak fontlar
- ❌ Emoji bayrak ile dil seçimi
- ❌ Heart/like ikonu, sosyal medya etkileşimleri
- ❌ "X kalp kaldı" / "1 can verdi" oyun mantığı
- ❌ Push "geri dön streak'in kırılacak" tarzı
- ❌ Premium kilit + sarı yıldız işaretleri
- ❌ Stock illustration
- ❌ **AI'ı "asistan" gibi gösteren UI** — "Claude diyor ki", "AI cevaplıyor" gibi label'lar yasak. Konuşan Miguel, asla "AI". Sahne illüzyonunu kıran her şey yasak.
- ❌ **Generic loading spinner** — onun yerine sahne dilinde mikro state'ler ("Miguel düşünüyor...", "Kahve hazırlanıyor..."). Spinning circle Roleo'nun tonuna aykırı.
- ❌ **Sahneyi tamamen kapatan opaque modal** — modallar yarı saydam, sahne arkada hissedilir. Sahne hiç kaybolmaz.

## A12. Mockup Referansları

Bu HTML dosyaları tasarım kararlarının canlı referansı:
- `mockups/roleo-onboarding.html` — Onboarding ilk ekran (editorial dil)
- `mockups/roleo-practice-photo.html` — Pratik sahnesi (foto-realist arka plan)

React Native'e çevirirken bu dosyaları görsel referans olarak aç.

---

# BÖLÜM B — TEKNİK MİMARİ

## B1. Ne Yapıyor

Identity-driven dil öğrenme uygulaması. Kullanıcının hayali/hedefi onboarding'de alınıyor, AI sahneleri buna göre kişiselleştiriliyor. React Native / Expo / TypeScript / Claude API (haiku-4-5).

## B2. Mimari

- `App.tsx` — merkezi navigation, screen state machine, global FAB
- `src/screens/` — tüm ekranlar
- `src/services/claude.ts` — Anthropic API wrapper
- `src/services/progress.ts` — XP, streak, unlock sistemi
- `src/services/personas.ts` — AI persona sistemi
- `src/services/telemetry.ts` — event tracking
- `src/data/scenarios.ts` — 14 statik senaryo (5 dil) + seçim fonksiyonları
- `src/types/index.ts` — UserProfile, Scenario, StageResult, UserIdentity

## B3. Storage (AsyncStorage)

- `userProfile` → UserProfile { language, nativeLanguage, goal, goalDescription, identity: {goal, context, emotion}, streak, xp, completedScenarios[] }
- `roleoProgress` → ProgressState { xp, streak, lastPlayedDate (ISO YYYY-MM-DD), completedScenarioIds[] }
- `firstSessionState` → 'pending' | 'done'
- `phrasebook_{langCode}` → cache

## B4. Core Learning Loop

ScenarioPrepModal (opsiyonel story bağlam +5 XP) → ScenarioScreen (AI konuşma) → StageResultScreen (XP/level/streak) → ProgressScreen

## B5. ScenarioScreen AI Prompt Yapısı

3 katman: basePrompt (persona) + scenarioPrompt (sahne) + runtimePrompt (level, identity, micro feedback direktifi)

- Her AI yanıtı `✨ ` ile micro feedback ile başlar
- Hata varsa `💡 Düzeltme:` eklenir
- Her 3 mesajda identity goal öne çıkar

## B6. XP Sistemi

- Senaryo tamamlama: xpReward (20-30) + mesaj bonusu
- Story okuma %80+: +8 XP
- Story quiz bitirme: +12 XP
- Prep story okuma: +5 XP bonus
- `getLevelFromXp`: floor(xp/100) + 1
- Unlock: travel (3 cafe), survival (2 travel), business (2 social)

> **Tasarım notu (Bölüm A bağlantısı):** XP/level/streak değerleri var ama UI'da bağırmaz. Sahne hissini bozmadan, ProgressScreen ve StageResultScreen'de **olgun, sakin** bir dille gösterilir. accentWarm ile vurgu yapılabilir ama confetti/celebration animasyonu yasak.

## B7. Scenario Seçim Fonksiyonları

- `getPersonalizedScenario(language, identity)` — goal/context keyword matching ile stageType seçer
- `getScenarioWithVariant(scenario, playCount, identity)` — replay/challenge mode overlay ekler
- Keywords: business (iş/work/office...), travel (seyahat/trip...), social (arkadaş/party...)

## B8. Ekranlar

| Ekran | Açıklama |
|-------|----------|
| OnboardingScreen | native/language/goal/dream/context/emotion adımları |
| HomeScreen | FAB (⚡ InstantLearn), dreamCard, XP bar, modlar |
| ScenariosScreen | Unlock'a göre filtrelenmiş senaryo listesi, completed göstergesi |
| ScenarioScreen | AI chat, quick phrases panel (💬), micro feedback |
| StageResultScreen | XP, level-up tespiti, identity bağlantısı, unlock |
| ProgressScreen | Tam XP/streak/stage breakdown |
| InstantLearnScreen | Anında kelime/ifade açıklama, her yerden FAB ile açılır |
| StoriesScreen | AI hikaye okuma + quiz, XP bağlı |
| PhrasebookScreen | AI phrase listesi, cache'li |
| ScenarioPrepModal | Sahne öncesi story context modal |

## B9. Önemli Kararlar

1. Dream/identity prompt'a inject edilmiş — ScenarioScreen runtimePrompt'ta goal+context+emotion kullanılıyor
2. Phrasebook ayrı mod değil — ScenarioScreen içi 💬 paneli
3. Story modu sahne hazırlığı — ScenarioPrepModal ile senaryo girişine bağlı
4. Streak tarihleri ISO 8601 (YYYY-MM-DD) — `toDateString()` değil
5. Global InstantLearn FAB — App.tsx overlay, focus ekranlarında gizli

## B10. Bilinen Eksikler / Sıradaki İşler

- Senaryo sayısı az (14), çeşitlilik artırılabilir
- Daily Mission: getTodaysMissionScenario artık identity + completedScenarios'a göre seçiyor
- Push notification yok
- Conversation history persist edilmiyor (uygulama kapanınca sıfırlanıyor)
- **Tasarım sistemi entegrasyonu:** Mevcut ekranların yeni tasarım sistemi (Bölüm A) ile yeniden ele alınması gerekiyor. Onboarding ve ScenarioScreen önceliklidir.

---

# BÖLÜM C — Cursor için Çalışma Notları

## C1. Yeni bir ekran/feature eklerken

1. **Önce Bölüm A'yı oku** — tasarım kararlarına aykırı bir şey yapma.
2. **Bölüm B'deki ilgili servisi bul** — yeni ekran XP, identity, AI ile etkileşiyorsa mevcut wrapper'ları kullan, paralel sistem yazma.
3. **Renkleri theme/colors.ts üzerinden kullan**, asla hardcode hex.
4. **Display + body font'u sabit:** Fraunces + Inter Tight. Başka font getirme.
5. **Tek ekranda 1-2 akcent kullanımı.** Daha fazlası kıymet azaltır.
6. **Yeni component pattern eklenirse Bölüm A6'yı güncelle.**

## C2. React Native özel notları

- Frosted glass: `expo-blur` (`<BlurView />`)
- Gradient: `expo-linear-gradient`
- Animasyon: `react-native-reanimated` — staggered entrance için `withDelay + withTiming`
- Font yükleme: `expo-font` ile Fraunces ve Inter Tight'ı `useFonts` hook'unda
- Fotoğraf: `expo-image` (cache + blurhash placeholder için)

## C3. Mevcut kod ile çalışırken

Onboarding ve ScenarioScreen şu an tasarım sisteminden farklı yerde olabilir. Yeniden ele alırken:
- **Davranış (Bölüm B mantığı) korunur** — XP, identity prompt, AI flow değişmez.
- **Görünüm (Bölüm A) yenilenir** — renkler, font, layout, atmosfer.

İkisi karışmaz: önce davranış sabit, sonra üstüne tasarım giydirilir.

---

*Roleo, kullanıcının hayalini sahneye çeviriyor. Bu doküman, o sahnenin hem ışığı hem iskeleti.*