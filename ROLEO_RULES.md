# Roleo Rules

Bu dosya Roleo için kalıcı ürün, tasarım ve AI çalışma kararlarını toplar. Yeni ekran, özellik veya refactor yapılırken `CLAUDE.md` ile birlikte okunmalıdır.

## 1. Ürün Kimliği

- Roleo klasik bir dil öğrenme uygulaması değil; gerçek hayat konuşmalarını önceden prova ettiren sahne aracıdır.
- Ders, quiz, kelime ezberi hissi ikinci planda kalmalı. Öncelik sahne, an, sosyal bağlam ve gerçek cümledir.
- Kullanıcı "öğrenci" gibi değil, sahnenin içindeki kişi gibi hissetmelidir.

## 2. İçerik Mimarisi

- `Telaffuz`: ağzı ve kulağı sahneye hazırlar.
  - `Sesler`: zor sesler ve vurgu.
  - `Kelimeler`: sahnede sık geçen kelimeler.
  - `Cümleler`: gerçek anda söylenecek kısa cümleler.
  - `Detaylar`: saat, fiyat, oda/peron/kapı, rezervasyon kodu gibi kritik bilgiler.
- `Sahne Kalıpları`: ne söyleyeceğini ve nasıl kuracağını hazırlar.
  - Kalıplar, işe yarayan ifadeler ve kurtarıcı cümleler aynı ekranda olmalı.
  - Ayrı `Sahne İfadeleri` sayfası kullanılmamalı.
- `Sahne Modu`: ana ürün deneyimidir. Yan araçlar sahneye hazırlık veya sahneden sonra pekiştirme içindir.

## 3. Animasyon Standardı

- Uygulamadaki tüm görünür geçişler animasyonlu olmalıdır: ekran, soru, kart, akordiyon, modal, geri, iptal, skip, başlat, sonraki.
- Ani mount/unmount yasak. En azından fade + hafif slide/scale kullanılmalı.
- Roleo hareket dili sakin ve premium olmalı: 220-520ms, cubic/bezier easing, yukarıdan veya alttan küçük kayma.
- Akordiyonlar yükseklik, opacity, ok rotasyonu ve içerik kaymasını birlikte animasyonlamalı.
- Sallanma, bounce, blink, hızlı flash ve oyun efekti hissi veren hareketlerden kaçınılmalı.

## 4. Görsel Dil

- Koyu, sinematik, atmosferik zemin korunmalı.
- Düz siyah veya düz panel hissinden kaçınılmalı; glow, gradient, glass, fotoğraf geçişi kullanılmalı.
- Fotoğraf sahneyle eşleşmeli. Otel sahnesinde otel/lobi, uçuş sahnesinde havalimanı/uçak, restoran sahnesinde restoran gibi.
- Fotoğraf üstündeki metin/sayaç her zaman okunur olmalı; açık fotoğrafta kaybolmamalı.

## 5. Copy ve Ton

- Sakin, olgun ve gerçek hayata yakın konuş.
- Gamified copy azaltılmalı. "Claim", "crush", "leaderboard", "you are on fire" gibi dil kullanılmamalı.
- Tercih edilen ton: "Sahne tamamlandı", "Bu anı tekrar çalış", "Gerçek hayata hazır cümle", "Bir sonraki prova".
- "Sahte" yerine bağlama göre "Yanlış" veya "Doğal değil" tercih edilir.

## 6. Dil Mantığı

- Öğrenilen dil ile uygulama dili ayrıdır.
- `learning language`: sahne soruları, cevaplar, mini oyun içerikleri.
- `native language`: UI dili, açıklamalar, çeviriler, feedback.
- Yeni içerik eklerken bu ayrımı bozma.

## 7. Progression ve Plus

- Free kullanıcı Roleo değerini görebilmeli; paywall açılışta değil, değer anından sonra gelmeli.
- Basic sahneler free kalabilir; advanced travel/work/survival/custom/voice unlimited gibi alanlar Plus olabilir.
- Gate copy açık ve sakin olmalı: kullanıcının neden kilide çarptığı anlaşılmalı.

## 8. AI ve Fallback

- AI yoksa ekran boş kalmamalı. Sahneye bağlı offline fallback çalışmalı.
- Promptlar scene-aware ve memory-aware olmalı.
- JSON parse hatası veya API yokluğu uygulamayı kırmamalı.

## 9. Agent Çalışma Kuralı

- Yeni UI yaparken animasyon standardını otomatik uygula; kullanıcı tek tek hatırlatmak zorunda kalmamalı.
- Kullanıcının önceki tasarım kararlarını koru; büyük refactor yapmadan önce kapsamı netleştir.
- Her işten sonra TypeScript kontrolü yapılmalı: `npx tsc --noEmit`.
