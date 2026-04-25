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
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { colors } from '../theme/colors';
import { typography } from '../theme/typography';

type Props = {
  onFinish: () => void;
};

type IconName = React.ComponentProps<typeof MaterialIcons>['name'];

type IntroFeature = {
  icon: IconName;
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
    lead: 'Konuşmadan önce prova yap.',
    description: 'Practice real-life conversations before you have them.',
    features: [
      { icon: 'explore', title: 'Gerçek Anlar', subtitle: 'Kafe, seyahat, iş ve sosyal sahneleri prova et.' },
      { icon: 'mic', title: 'Sahne Provası', subtitle: 'Ne söyleyeceğini gerçek andan önce çalış.' },
      { icon: 'school', title: 'Pratik Geri Bildirim', subtitle: 'Her turda daha doğal cevabı seçmeyi öğren.' },
    ],
  },
  {
    id: 'speak',
    heading: 'Sahne Modu',
    lead: 'Gerçek hayat konuşmasını oyun gibi prova et.',
    description: 'Kısa hazırlık yap, 3 cevap arasından tonu seç, sahnenin nasıl aktığını gör.',
    features: [
      { icon: 'local-cafe', title: 'Günlük sahneler', subtitle: 'Kafe, iş, seyahat ve sosyal anlar' },
      { icon: 'psychology', title: 'Ton farkını gör', subtitle: 'Doğal / idare eder / garip cevap ayrımı' },
      { icon: 'offline-bolt', title: 'Hemen tekrar et', subtitle: 'Akışı bozan cevabı düzeltip sahneyi yeniden oyna' },
    ],
  },
  {
    id: 'arcade',
    heading: 'Mini-Game Modları',
    lead: 'Sahneye girmeden önce ısın.',
    description: 'Kelime, ton ve telaffuz refleksini kısa oyunlarla hazırla.',
    features: [
      { icon: 'flash-on', title: 'Flash Pick', subtitle: 'Sahnede işine yarayacak kelime refleksi' },
      { icon: 'quiz', title: 'True or Fake', subtitle: 'Doğal mı garip mi, hızlı ayırt et' },
      { icon: 'whatshot', title: 'Combo Sistemi', subtitle: 'Temiz cevapları üst üste getir' },
    ],
  },
  {
    id: 'value',
    heading: 'Sana Ne Katar?',
    lead: 'Söylemeden önce dene.',
    description: "Gerçek hayatta söylemeden önce Roleo'da dene.",
    features: [
      { icon: 'verified', title: 'Garip anı yakala', subtitle: 'Sahnede neyin tuhaf kaçtığını güvenle gör.' },
      { icon: 'trending-up', title: 'Tekrarla, düzelt', subtitle: 'Aynı anı yeniden oynayıp daha temiz akış kur.' },
      { icon: 'chat-bubble-outline', title: 'Ne diyeceğini çalış', subtitle: 'Gerçek konuşmada kullanacağın cevabı önceden prova et.' },
    ],
  },
];

const ICON_COLOR = colors.terracottaDark;

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

  const animateTo = (nextIdx: number) => {
    if (transitioningRef.current || nextIdx === indexRef.current) return;
    const dir: 1 | -1 = nextIdx > indexRef.current ? 1 : -1;
    transitioningRef.current = true;
    setDirection(dir);
    setNextIndex(nextIdx);
    slideAnim.setValue(0);

    Animated.parallel([
      Animated.timing(slideAnim, {
        toValue: 1,
        duration: 220,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.timing(progressAnim, {
        toValue: (nextIdx + 1) / SLIDES.length,
        duration: 220,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: false,
      }),
    ]).start(({ finished }) => {
      if (!finished) return;
      setIndex(nextIdx);
      indexRef.current = nextIdx;
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
      <LinearGradient
        colors={['#1D3038', '#15343E', '#0E2633']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={StyleSheet.absoluteFill}
      />
      <View style={styles.leftGlow} />
      <View style={styles.rightGlow} />

      <SafeAreaView style={styles.safe}>
        <View style={styles.topBar}>
          <TouchableOpacity onPress={onBack} style={[styles.navBtn, index === 0 && styles.hiddenBtn]} disabled={index === 0}>
            <Text style={[styles.navText, styles.backText]}>‹</Text>
          </TouchableOpacity>
          <Text style={styles.brand}>Roleo</Text>
          <TouchableOpacity onPress={onFinish} style={styles.navBtn}>
            <Text style={[styles.navText, styles.skipText]}>Skip</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.centerCanvas}>
          <View style={[styles.cardWrap, { width: cardWidth }]}>
            <View style={[styles.glassCard, { minHeight: cardMinHeight }]}>
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
  const scene = slide.id === 'speak';
  return (
    <>
      <View style={styles.headSection}>
        <Text style={[styles.headline, scene && styles.headlineScene]}>{slide.heading}</Text>
        <Text style={styles.lead}>{slide.lead}</Text>
        <Text style={styles.description}>{slide.description}</Text>
      </View>

      <View style={styles.featureList}>
        {slide.features.map((feature, i) => {
          const last = i === slide.features.length - 1;
          return (
            <View
              key={`${slide.id}-${i}`}
              style={[styles.featureRow, !last && styles.featureRowSep]}
            >
              <MaterialIcons name={feature.icon} size={24} color={ICON_COLOR} style={styles.featureIcon} />
              <View style={styles.featureCopy}>
                <Text style={styles.featureTitle}>{feature.title}</Text>
                <Text style={styles.featureSubtitle}>{feature.subtitle}</Text>
              </View>
            </View>
          );
        })}
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#0F1F29',
  },
  leftGlow: {
    position: 'absolute',
    top: '26%',
    left: -90,
    width: 230,
    height: 230,
    borderRadius: 999,
    backgroundColor: 'rgba(176, 109, 80, 0.16)',
  },
  rightGlow: {
    position: 'absolute',
    bottom: '18%',
    right: -120,
    width: 300,
    height: 300,
    borderRadius: 999,
    backgroundColor: 'rgba(246, 240, 229, 0.10)',
  },
  safe: {
    flex: 1,
    paddingTop: 14,
  },
  topBar: {
    height: 72,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 0,
    paddingBottom: 0,
    borderRadius: 18,
    marginHorizontal: 12,
    marginTop: 26,
    marginBottom: 4,
    backgroundColor: 'rgba(252, 249, 248, 0.04)',
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
    color: '#FFFFFF',
    fontSize: 22,
    fontFamily: 'Poppins_600SemiBold',
  },
  skipText: {
    fontSize: 15,
    color: 'rgba(255,255,255,0.62)',
    textAlign: 'right',
    marginLeft: 'auto',
  },
  backText: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.62)',
  },
  brand: {
    color: '#7A7A7A',
    fontSize: 34,
    fontFamily: 'Poppins_700Bold',
    letterSpacing: -0.2,
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
  glassCard: {
    borderRadius: 16,
    padding: 20,
    backgroundColor: 'rgba(252, 249, 248, 0.72)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.30)',
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
    marginBottom: 18,
  },
  headline: {
    ...typography.lingua.heading2,
    color: colors.textPrimary,
    marginBottom: 4,
  },
  /** Sahne Modu slaytı — daha küçük başlık */
  headlineScene: {
    fontSize: 22,
    lineHeight: 28,
  },
  lead: {
    color: 'rgba(59, 49, 38, 0.92)',
    marginBottom: 6,
    ...typography.lingua.title2,
  },
  description: {
    color: colors.textSecondary,
    ...typography.lingua.description,
  },
  featureList: {
    marginBottom: 24,
  },
  featureRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    paddingVertical: 14,
    paddingHorizontal: 0,
  },
  featureRowSep: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(59, 49, 38, 0.14)',
  },
  featureIcon: {
    marginTop: 2,
  },
  featureCopy: {
    flex: 1,
  },
  featureTitle: {
    color: colors.textPrimary,
    ...typography.lingua.title2,
  },
  featureSubtitle: {
    color: 'rgba(83, 67, 62, 0.88)',
    marginTop: 4,
    ...typography.lingua.caption,
    fontSize: 13,
    lineHeight: 18,
  },
  progressTrack: {
    height: 8,
    borderRadius: 99,
    overflow: 'hidden',
    backgroundColor: colors.creamMuted,
  },
  progressFill: {
    height: '100%',
    borderRadius: 99,
    backgroundColor: colors.terracottaDark,
  },
  ctaBtn: {
    height: 58,
    borderRadius: 16,
    backgroundColor: colors.terracottaDark,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: colors.terracottaDark,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.28,
    shadowRadius: 10,
    elevation: 6,
  },
  bottomCtaWrap: {
    marginTop: 'auto',
    paddingBottom: 2,
  },
  ctaText: {
    color: '#FFFFFF',
    fontSize: 17,
    fontFamily: 'Poppins_600SemiBold',
  },
});
