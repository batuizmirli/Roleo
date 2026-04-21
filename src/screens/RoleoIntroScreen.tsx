import React, { useMemo, useRef, useState } from 'react';
import {
  Animated,
  ImageBackground,
  PanResponder,
  SafeAreaView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { colors } from '../theme/colors';

const crowdImg = require('../../assets/onboarding/crowd-conversation.jpg');
const cafeImg = require('../../assets/onboarding/cafe-order.jpg');
const meetingImg = require('../../assets/onboarding/meeting-confidence.jpg');
const friendsImg = require('../../assets/onboarding/friends-social.jpg');

type Props = {
  onFinish: () => void;
};

type IntroSlide = {
  id: string;
  image: any;
  eyebrow: string;
  title: string;
  subtitle: string;
  bullets: string[];
  overlayColor: string;
};

const SLIDES: IntroSlide[] = [
  {
    id: 'welcome',
    image: crowdImg,
    eyebrow: "Roleo'ya Hoş Geldin",
    title: 'Gerçek sahnelerde\npratik yap.',
    subtitle: 'Dil öğrenmeyi hızlı, eğlenceli ve sürdürülebilir hale getirir.',
    bullets: [
      'Kısa ama etkili oyun döngüleri',
      'Her gün devam etmeni sağlayan yapı',
      'Gelişimini anlık görme',
    ],
    overlayColor: 'rgba(6, 18, 12, 0.62)',
  },
  {
    id: 'speak',
    image: cafeImg,
    eyebrow: 'Sahne Modu',
    title: 'Gerçek hayat\nkonuşmaları.',
    subtitle: 'Kafeden iş toplantısına, seyahate kadar onlarca gerçek senaryo.',
    bullets: [
      'Farklı sosyal durumlar: kafe, iş, seyahat',
      'Doğal / orta / garip cevap farkını öğrenme',
      'Anlık geri bildirim ve toparlama ipuçları',
    ],
    overlayColor: 'rgba(5, 14, 22, 0.60)',
  },
  {
    id: 'arcade',
    image: meetingImg,
    eyebrow: 'Mini-Game Modları',
    title: 'Hızlı oyunlarla\nrefleks kazan.',
    subtitle: 'Refleks ve dil hissini aynı anda güçlendiren kısa modlar.',
    bullets: [
      'Flash Pick ile hız ve kelime eşleştirme',
      'True or Fake ile doğru/yanlış sezgisi',
      'Combo sistemiyle akışa girme',
    ],
    overlayColor: 'rgba(10, 8, 22, 0.65)',
  },
  {
    id: 'value',
    image: friendsImg,
    eyebrow: 'Sana Ne Katar?',
    title: 'Özgüvenli ve\ndoğal konuş.',
    subtitle: 'Kısa sürede daha akıcı ve kalıcı bir dil hissi.',
    bullets: [
      'Hata farkındalığı ve doğru kalıplar',
      'Düzenli pratikle kalıcı ilerleme',
      'Günlük kullanımda gerçek ifade üretimi',
    ],
    overlayColor: 'rgba(4, 14, 10, 0.60)',
  },
];

export default function RoleoIntroScreen({ onFinish }: Props) {
  const [index, setIndex] = useState(0);
  const indexRef = useRef(0);

  // Two-layer crossfade state
  const [bgBottom, setBgBottom] = useState<IntroSlide>(SLIDES[0]);
  const [bgTop, setBgTop] = useState<IntroSlide>(SLIDES[0]);
  const bgTopOpacity = useRef(new Animated.Value(0)).current;

  // Text animation
  const textOpacity = useRef(new Animated.Value(1)).current;
  const textTranslateY = useRef(new Animated.Value(0)).current;

  // Dot animations
  const dotWidths = useRef(SLIDES.map((_, i) => new Animated.Value(i === 0 ? 22 : 6))).current;
  const dotAlphas = useRef(SLIDES.map((_, i) => new Animated.Value(i === 0 ? 1 : 0))).current;

  const slide = useMemo(() => SLIDES[index], [index]);
  const isLast = index === SLIDES.length - 1;

  const animateTo = (nextIndex: number) => {
    const nextSlide = SLIDES[nextIndex];
    const currentSlide = SLIDES[index];

    // Animate dots
    Animated.parallel([
      Animated.timing(dotWidths[index], { toValue: 6, duration: 220, useNativeDriver: false }),
      Animated.timing(dotWidths[nextIndex], { toValue: 22, duration: 220, useNativeDriver: false }),
      Animated.timing(dotAlphas[index], { toValue: 0, duration: 220, useNativeDriver: false }),
      Animated.timing(dotAlphas[nextIndex], { toValue: 1, duration: 220, useNativeDriver: false }),
    ]).start();

    if (nextSlide.image !== currentSlide.image) {
      // Reset top opacity FIRST (bgBottom already shows currentSlide → no flash)
      bgTopOpacity.setValue(0);
      setBgTop(nextSlide);
      Animated.timing(bgTopOpacity, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true,
      }).start(({ finished }) => {
        if (finished) {
          // Silently sync bgBottom — don't touch opacity here (avoids 1-frame flash)
          setBgBottom(nextSlide);
        }
      });
    }

    // Text: fade out → swap → fade in
    Animated.parallel([
      Animated.timing(textOpacity, { toValue: 0, duration: 130, useNativeDriver: true }),
      Animated.timing(textTranslateY, { toValue: 10, duration: 130, useNativeDriver: true }),
    ]).start(() => {
      setIndex(nextIndex);
      indexRef.current = nextIndex;
      textTranslateY.setValue(-10);
      Animated.parallel([
        Animated.timing(textOpacity, { toValue: 1, duration: 200, useNativeDriver: true }),
        Animated.timing(textTranslateY, { toValue: 0, duration: 200, useNativeDriver: true }),
      ]).start();
    });
  };

  const onNext = () => {
    if (isLast) { onFinish(); return; }
    animateTo(index + 1);
  };

  const onBack = () => {
    if (index === 0) return;
    animateTo(index - 1);
  };

  const panResponder = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (_, g) =>
        Math.abs(g.dx) > 10 && Math.abs(g.dx) > Math.abs(g.dy) * 1.5,
      onPanResponderRelease: (_, g) => {
        const cur = indexRef.current;
        if (g.dx < -40) {
          if (cur >= SLIDES.length - 1) { onFinish(); return; }
          animateTo(cur + 1);
        } else if (g.dx > 40) {
          if (cur <= 0) return;
          animateTo(cur - 1);
        }
      },
    })
  ).current;

  return (
    <View style={styles.root} {...panResponder.panHandlers}>
      {/* Bottom background layer (previous/stable image) */}
      <ImageBackground source={bgBottom.image} style={StyleSheet.absoluteFill} resizeMode="cover">
        <View style={[StyleSheet.absoluteFill, { backgroundColor: bgBottom.overlayColor }]} />
      </ImageBackground>

      {/* Top background layer (new image crossfading in) */}
      <Animated.View style={[StyleSheet.absoluteFill, { opacity: bgTopOpacity }]}>
        <ImageBackground source={bgTop.image} style={StyleSheet.absoluteFill} resizeMode="cover">
          <View style={[StyleSheet.absoluteFill, { backgroundColor: bgTop.overlayColor }]} />
        </ImageBackground>
      </Animated.View>

      <SafeAreaView style={styles.safe}>
        {/* Top nav */}
        <View style={styles.topRow}>
          <TouchableOpacity
            onPress={onBack}
            style={[styles.navBtn, index === 0 && styles.hiddenBtn]}
            disabled={index === 0}
          >
            <Text style={styles.navBtnLabel}>← Geri</Text>
          </TouchableOpacity>

          <View style={styles.dotsWrap}>
            {SLIDES.map((s, i) => {
              const bg = dotAlphas[i].interpolate({
                inputRange: [0, 1],
                outputRange: ['rgba(255,255,255,0.3)', colors.primaryAccent],
              });
              return (
                <Animated.View
                  key={s.id}
                  style={[styles.dot, { width: dotWidths[i], backgroundColor: bg }]}
                />
              );
            })}
          </View>

          <TouchableOpacity onPress={onFinish} style={styles.navBtn}>
            <Text style={styles.navBtnLabel}>Geç</Text>
          </TouchableOpacity>
        </View>

        {/* Animated text content */}
        <Animated.View
          style={[
            styles.contentWrap,
            { opacity: textOpacity, transform: [{ translateY: textTranslateY }] },
          ]}
        >
          <View style={styles.eyebrowRow}>
            <View style={styles.eyebrowPill}>
              <Text style={styles.eyebrow}>{slide.eyebrow}</Text>
            </View>
          </View>

          <Text style={styles.title}>{slide.title}</Text>
          <Text style={styles.subtitle}>{slide.subtitle}</Text>

          <View style={styles.bulletsWrap}>
            {slide.bullets.map((b, i) => (
              <View key={`${slide.id}-${i}`} style={styles.bulletRow}>
                <View style={styles.bulletDot} />
                <Text style={styles.bulletText}>{b}</Text>
              </View>
            ))}
          </View>
        </Animated.View>

        {/* CTA */}
        <View style={styles.bottomArea}>
          <TouchableOpacity style={styles.nextBtn} onPress={onNext} activeOpacity={0.88}>
            <Text style={styles.nextBtnText}>
              {isLast ? "Roleo'ya Başla →" : 'Devam Et →'}
            </Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#081610',
  },
  safe: {
    flex: 1,
    paddingHorizontal: 32,
    paddingTop: 8,
    paddingBottom: 28,
    justifyContent: 'space-between',
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
  },
  navBtn: {
    paddingVertical: 8,
    paddingHorizontal: 4,
  },
  hiddenBtn: { opacity: 0 },
  navBtnLabel: {
    color: 'rgba(255,255,255,0.65)',
    fontSize: 14,
    fontWeight: '600',
  },
  dotsWrap: {
    flexDirection: 'row',
    gap: 6,
    alignItems: 'center',
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 99,
    backgroundColor: 'rgba(255,255,255,0.3)',
  },
  dotActive: {
    width: 22,
    height: 6,
    backgroundColor: colors.primaryAccent,
  },
  contentWrap: {
    flex: 1,
    justifyContent: 'flex-end',
    paddingBottom: 24,
  },
  eyebrowRow: { marginBottom: 14 },
  eyebrowPill: {
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(166, 106, 76, 0.28)',
    borderWidth: 1,
    borderColor: 'rgba(166, 106, 76, 0.55)',
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 5,
  },
  eyebrow: {
    color: '#F5C9A8',
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.8,
    textTransform: 'uppercase',
  },
  title: {
    color: '#FFFFFF',
    fontSize: 38,
    fontWeight: '900',
    lineHeight: 46,
    letterSpacing: -0.5,
    marginBottom: 14,
    fontFamily: 'PlayfairDisplay_900Black',
  },
  subtitle: {
    color: 'rgba(255,255,255,0.72)',
    fontSize: 15,
    lineHeight: 23,
    fontWeight: '500',
    marginBottom: 28,
  },
  bulletsWrap: {
    gap: 12,
    backgroundColor: 'rgba(0,0,0,0.30)',
    borderRadius: 16,
    padding: 18,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  bulletRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  bulletDot: {
    width: 7,
    height: 7,
    borderRadius: 99,
    backgroundColor: colors.primaryAccent,
    flexShrink: 0,
  },
  bulletText: {
    flex: 1,
    color: 'rgba(255,255,255,0.85)',
    fontSize: 14,
    lineHeight: 20,
    fontWeight: '500',
  },
  bottomArea: { paddingTop: 16 },
  nextBtn: {
    backgroundColor: colors.primaryAccent,
    borderRadius: 16,
    paddingVertical: 18,
    alignItems: 'center',
    shadowColor: colors.primaryAccent,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 16,
    elevation: 8,
  },
  nextBtnText: {
    color: '#FFFDF8',
    fontSize: 17,
    fontWeight: '900',
    letterSpacing: 0.2,
    fontFamily: 'PlayfairDisplay_900Black',
  },
});
