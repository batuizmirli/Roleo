import React, { useMemo, useRef, useState } from 'react';
import {
  Animated,
  Easing,
  PanResponder,
  StyleSheet,
  Text,
  TouchableOpacity,
  useWindowDimensions,
  View,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { refined } from '../theme/refinedTokens';

type Props = {
  onFinish: () => void;
};

type IntroFeature = {
  icon: string;
  title: string;
  subtitle: string;
};

type IntroSlide = {
  id: string;
  heading: string;
  lead: string;
  description: string;
  features: IntroFeature[];
};

const SLIDES: IntroSlide[] = [
  {
    id: 'welcome',
    heading: 'Hoş Geldin',
    lead: 'Yeni Bir Dil, Yeni Bir Sen.',
    description: 'Dünyayı kendi dillerinde keşfetmeye hazır mısın?',
    features: [
      { icon: '🌍', title: 'Gerçek Bağlamlar', subtitle: 'Kitaplardan değil, hayattan öğrenin.' },
      { icon: '🗣️', title: 'Akıcı Konuşma', subtitle: 'Yapay zeka ile günlük pratikler yapın.' },
      { icon: '🎓', title: 'Akıllı İlerleme', subtitle: 'Size özel hazırlanan öğrenme yolu.' },
    ],
  },
  {
    id: 'speak',
    heading: 'Sahne Modu',
    lead: 'Gerçek hayat konuşmaları.',
    description: 'Kafeden iş toplantısına, seyahate kadar onlarca gerçek senaryo.',
    features: [
      { icon: '☕', title: 'Farklı sosyal durumlar', subtitle: 'Kafe, iş, seyahat ve dahası' },
      { icon: '🧠', title: 'Nüansları keşfet', subtitle: 'Doğal / orta / garip cevap farkını öğrenme' },
      { icon: '⚡', title: 'Anlık geri bildirim', subtitle: 'Toparlama ipuçları ve düzeltmeler' },
    ],
  },
  {
    id: 'arcade',
    heading: 'Mini-Game Modları',
    lead: 'Hızlı oyunlarla refleks kazan.',
    description: 'Refleks ve dil hissini aynı anda güçlendiren kısa modlar.',
    features: [
      { icon: '⚡', title: 'Flash Pick', subtitle: 'Hız ve kelime eşleştirme' },
      { icon: '📏', title: 'True or Fake', subtitle: 'Doğru/yanlış sezgisi' },
      { icon: '🗲', title: 'Combo Sistemi', subtitle: 'Süreklilikle akışa girme' },
    ],
  },
  {
    id: 'value',
    heading: 'Sana Ne Katar?',
    lead: 'Özgüvenli ve doğal konuş.',
    description: 'Kısa sürede daha akıcı ve kalıcı bir dil hissi.',
    features: [
      { icon: '✓', title: 'Hata farkındalığı', subtitle: 'Hataları yakalayıp doğru kalıplarla yer değiştirin.' },
      { icon: '↗', title: 'Kalıcı ilerleme', subtitle: 'Düzenli pratikle dil bilgisi kas hafızasına dönüşür.' },
      { icon: '💬', title: 'Gerçek ifade üretimi', subtitle: 'Günlük kullanımda doğal ve özgün cümleler kurun.' },
    ],
  },
];

export default function RoleoIntroScreen({ onFinish }: Props) {
  const { width, height } = useWindowDimensions();
  const [index, setIndex] = useState(0);
  const indexRef = useRef(0);
  const transitioningRef = useRef(false);
  const [nextIndex, setNextIndex] = useState<number | null>(null);
  const [direction, setDirection] = useState<1 | -1>(1);
  const slideAnim = useRef(new Animated.Value(0)).current;
  const progressAnim = useRef(new Animated.Value((index + 1) / SLIDES.length)).current;
  const slide = useMemo(() => SLIDES[index], [index]);
  const isLast = index === SLIDES.length - 1;
  const cardWidth = Math.min(width - 28, 380);
  const cardMinHeight = Math.min(Math.max(height * 0.62, 500), 700);
  const contentWidth = Math.max(cardWidth - 40, 260);
  const contentHeight = Math.max(cardMinHeight - 96, 380);

  const animateTo = (nextIndex: number) => {
    if (transitioningRef.current || nextIndex === indexRef.current) return;
    const dir: 1 | -1 = nextIndex > indexRef.current ? 1 : -1;
    transitioningRef.current = true;
    setDirection(dir);
    setNextIndex(nextIndex);
    slideAnim.setValue(0);

    Animated.parallel([
      Animated.timing(slideAnim, {
        toValue: 1,
        duration: 220,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.timing(progressAnim, {
        toValue: (nextIndex + 1) / SLIDES.length,
        duration: 220,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: false,
      }),
    ]).start(({ finished }) => {
      if (!finished) return;
      // Commit the new slide first, then reset animation on next frame.
      // This prevents a 1-frame flash back to the old slide.
      setIndex(nextIndex);
      indexRef.current = nextIndex;
      setNextIndex(null);
      requestAnimationFrame(() => {
        slideAnim.setValue(0);
        transitioningRef.current = false;
      });
    });
  };

  const onNext = () => {
    if (isLast) {
      onFinish();
      return;
    }
    animateTo(index + 1);
  };

  const onBack = () => {
    if (index === 0) return;
    animateTo(index - 1);
  };

  const panResponder = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (_, g) =>
        Math.abs(g.dx) > 10 && Math.abs(g.dx) > Math.abs(g.dy) * 1.4,
      onPanResponderRelease: (_, g) => {
        if (transitioningRef.current) return;
        const current = indexRef.current;
        if (g.dx < -40) {
          if (current >= SLIDES.length - 1) onFinish();
          else animateTo(current + 1);
        } else if (g.dx > 40 && current > 0) {
          animateTo(current - 1);
        }
      },
    })
  ).current;

  return (
    <View style={styles.root} {...panResponder.panHandlers}>
      <StatusBar style="dark" />
      <LinearGradient
        colors={[refined.surfaceMuted, refined.surface, refined.surfaceSubtle]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={StyleSheet.absoluteFill}
      />
      <View style={styles.accentGlow} />

      <SafeAreaView style={styles.safe}>
        <View style={styles.topBar}>
          <TouchableOpacity onPress={onBack} style={[styles.navBtn, index === 0 && styles.hiddenBtn]} disabled={index === 0}>
            <Text style={[styles.navText, styles.backText]}>‹</Text>
          </TouchableOpacity>
          <Text style={styles.brand}>Roleo</Text>
          <TouchableOpacity onPress={onFinish} style={styles.navBtn}>
            <Text style={[styles.navText, styles.skipText]}>Atla</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.centerCanvas}>
          <View style={[styles.cardWrap, { width: cardWidth }]}>
            <View style={[styles.card, { minHeight: cardMinHeight }]}>
              <View style={[styles.contentViewport, { minHeight: contentHeight }]}>
                <Animated.View
                  style={[
                    styles.contentPane,
                    { width: contentWidth },
                    {
                      transform: [{
                        translateX: slideAnim.interpolate({
                          inputRange: [0, 1],
                          outputRange: [0, -direction * contentWidth],
                        }),
                      }],
                    },
                  ]}
                >
                  <SlideContent slide={slide} />
                </Animated.View>

                {nextIndex !== null ? (
                  <Animated.View
                    style={[
                      styles.contentPane,
                      { width: contentWidth },
                      {
                        transform: [{
                          translateX: slideAnim.interpolate({
                            inputRange: [0, 1],
                            outputRange: [direction * contentWidth, 0],
                          }),
                        }],
                      },
                    ]}
                  >
                    <SlideContent slide={SLIDES[nextIndex]} />
                  </Animated.View>
                ) : null}
              </View>

              <View style={styles.progressTrack}>
                <Animated.View
                  style={[
                    styles.progressFill,
                    {
                      width: progressAnim.interpolate({
                        inputRange: [0, 1],
                        outputRange: ['0%', '100%'],
                      }),
                    },
                  ]}
                />
              </View>
            </View>
          </View>

          <View style={[styles.bottomCtaWrap, { width: cardWidth }]}>
            <TouchableOpacity style={styles.ctaBtn} onPress={onNext} activeOpacity={0.9} disabled={nextIndex !== null}>
              <Text style={styles.ctaText}>{isLast ? "Roleo'ya Başla" : 'Devam Et'}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </SafeAreaView>
    </View>
  );
}

function SlideContent({ slide }: { slide: IntroSlide }) {
  return (
    <>
      <View style={styles.headSection}>
        <Text style={styles.headline}>{slide.heading}</Text>
        <Text style={styles.lead}>{slide.lead}</Text>
        <Text style={styles.description}>{slide.description}</Text>
      </View>

      <View style={styles.featureList}>
        {slide.features.map((feature, i) => (
          <View key={`${slide.id}-${i}`} style={styles.featureRow}>
            <View style={styles.featureIconWrap}>
              <Text style={styles.featureIcon}>{feature.icon}</Text>
            </View>
            <View style={styles.featureCopy}>
              <Text style={styles.featureTitle}>{feature.title}</Text>
              <Text style={styles.featureSubtitle}>{feature.subtitle}</Text>
            </View>
          </View>
        ))}
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: refined.surfaceMuted,
  },
  accentGlow: {
    position: 'absolute',
    top: '12%',
    right: '-8%',
    width: 220,
    height: 220,
    borderRadius: 999,
    backgroundColor: 'rgba(59, 130, 246, 0.08)',
  },
  safe: {
    flex: 1,
    paddingTop: 14,
  },
  topBar: {
    height: 56,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    marginHorizontal: 8,
    marginTop: 16,
    marginBottom: 8,
    backgroundColor: 'transparent',
  },
  navBtn: {
    minWidth: 48,
    height: 44,
    justifyContent: 'center',
  },
  hiddenBtn: {
    opacity: 0,
  },
  navText: {
    color: refined.text,
    fontSize: 22,
    fontFamily: 'Manrope_600SemiBold',
  },
  skipText: {
    fontSize: 14,
    color: refined.textMuted,
    textAlign: 'right',
    marginLeft: 'auto',
    fontFamily: 'Manrope_500Medium',
  },
  backText: {
    fontSize: 22,
    color: refined.textSecondary,
  },
  brand: {
    color: refined.text,
    fontSize: 28,
    fontFamily: 'PlayfairDisplay_700Bold',
    letterSpacing: -0.5,
  },
  centerCanvas: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'flex-start',
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 16,
  },
  cardWrap: {
    gap: 16,
  },
  card: {
    borderRadius: 20,
    padding: 24,
    backgroundColor: refined.surface,
    borderWidth: 1,
    borderColor: refined.border,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.06,
    shadowRadius: 24,
    elevation: 4,
  },
  contentViewport: {
    position: 'relative',
    overflow: 'hidden',
    flex: 1,
  },
  contentPane: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
  },
  headSection: {
    marginBottom: 20,
  },
  headline: {
    color: refined.text,
    fontSize: 32,
    lineHeight: 38,
    fontFamily: 'PlayfairDisplay_700Bold',
    marginBottom: 8,
  },
  lead: {
    color: refined.textSecondary,
    fontSize: 17,
    lineHeight: 24,
    fontFamily: 'Manrope_600SemiBold',
    marginBottom: 8,
  },
  description: {
    color: refined.textMuted,
    fontSize: 15,
    lineHeight: 22,
    fontFamily: 'Manrope_400Regular',
  },
  featureList: {
    gap: 16,
    marginBottom: 24,
  },
  featureRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 14,
    borderWidth: 1,
    borderColor: refined.border,
    backgroundColor: refined.surfaceMuted,
  },
  featureIconWrap: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: 'rgba(59, 130, 246, 0.12)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  featureIcon: {
    color: refined.primary,
    fontSize: 20,
    fontFamily: 'Manrope_700Bold',
  },
  featureCopy: {
    flex: 1,
  },
  featureTitle: {
    color: refined.text,
    fontSize: 14,
    fontFamily: 'Manrope_600SemiBold',
  },
  featureSubtitle: {
    color: refined.textMuted,
    fontSize: 12,
    marginTop: 2,
    fontFamily: 'Manrope_400Regular',
  },
  progressTrack: {
    height: 6,
    borderRadius: 99,
    overflow: 'hidden',
    backgroundColor: refined.border,
  },
  progressFill: {
    height: '100%',
    borderRadius: 99,
    backgroundColor: refined.primary,
  },
  ctaBtn: {
    height: 56,
    borderRadius: 16,
    backgroundColor: refined.primary,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: refined.primary,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.22,
    shadowRadius: 12,
    elevation: 5,
  },
  bottomCtaWrap: {
    marginTop: 'auto',
    paddingBottom: 2,
  },
  ctaText: {
    color: refined.surface,
    fontSize: 16,
    fontFamily: 'Manrope_600SemiBold',
    letterSpacing: 0.2,
  },
});
