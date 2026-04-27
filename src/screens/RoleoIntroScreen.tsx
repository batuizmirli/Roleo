import React, { useRef, useState } from 'react';
import {
  Animated,
  Dimensions,
  Easing,
  PanResponder,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Feather from '@expo/vector-icons/Feather';
import { colors } from '../theme/colors';

const { width: SW } = Dimensions.get('window');

type Props = { onFinish: () => void };

type Slide = {
  id: string;
  eyebrow: string;
  heading: string;
  headingItalic: string;
  lead: string;
  features: { icon: string; title: string; sub: string }[];
};

const SLIDES: Slide[] = [
  {
    id: 'welcome',
    eyebrow: '01 / 04',
    heading: 'Konuşmadan önce',
    headingItalic: 'prova yap.',
    lead: 'Gerçek hayat sahnelerini yaşamadan önce dene. Müfredat değil, an.',
    features: [
      { icon: 'map-pin',    title: 'Gerçek Anlar',        sub: 'Kafe, seyahat, iş ve sosyal sahneleri prova et.' },
      { icon: 'mic',        title: 'Sahne Provası',        sub: 'Ne söyleyeceğini gerçek andan önce çalış.' },
      { icon: 'check',      title: 'Prova Geri Bildirimi', sub: 'Her turda sahneye daha uygun cevabı seç.' },
    ],
  },
  {
    id: 'speak',
    eyebrow: '02 / 04',
    heading: 'Gerçek anı',
    headingItalic: 'oyun gibi prova et.',
    lead: '3 cevap seçeneği, ton farkı, sahne akışı. Hepsini konuşmadan önce.',
    features: [
      { icon: 'coffee',      title: 'Günlük Sahneler',  sub: 'Kafe, iş, seyahat ve sosyal anlar' },
      { icon: 'sliders',     title: 'Ton Farkını Gör',  sub: 'Doğal / idare eder / garip cevap ayrımı' },
      { icon: 'refresh-cw',  title: 'Hemen Tekrar Et',  sub: 'Akışı bozan cevabı düzeltip sahneyi yeniden oyna' },
    ],
  },
  {
    id: 'arcade',
    eyebrow: '03 / 04',
    heading: 'Sahneye girmeden',
    headingItalic: 'önce ısın.',
    lead: 'Kelime ve ton refleksini kısa oyunlarla hazırla.',
    features: [
      { icon: 'zap',          title: 'Flash Pick',    sub: 'Sahnede işine yarayacak kelime refleksi' },
      { icon: 'check-circle', title: 'True or Fake',  sub: 'Doğal mı garip mi, hızlı ayırt et' },
      { icon: 'trending-up',  title: 'Combo Sistemi', sub: 'Temiz cevapları üst üste getir' },
    ],
  },
  {
    id: 'value',
    eyebrow: '04 / 04',
    heading: 'Söylemeden önce',
    headingItalic: 'dene.',
    lead: "Gerçek hayatta yanlış kelimeyi söylemek yerine Roleo'da dene.",
    features: [
      { icon: 'eye',            title: 'Garip Anı Yakala',  sub: "Sahnede neyin tuhaf kaçtığını güvenle gör." },
      { icon: 'edit-2',         title: 'Tekrarla, Düzelt',  sub: 'Aynı anı yeniden oynayıp daha temiz akış kur.' },
      { icon: 'message-circle', title: 'Ne Diyeceğini Çalış', sub: 'Gerçek konuşmada kullanacağın cevabı önceden prova et.' },
    ],
  },
];

export default function RoleoIntroScreen({ onFinish }: Props) {
  const insets = useSafeAreaInsets();
  const [index, setIndex] = useState(0);
  const translateX = useRef(new Animated.Value(0)).current;

  const isLast = index === SLIDES.length - 1;
  const slideW = SW; // full screen width; inner padding applied per slide

  const goToSlide = (nextIdx: number) => {
    setIndex(nextIdx);
    Animated.timing(translateX, {
      toValue: -nextIdx * slideW,
      duration: 320,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start();
  };

  const onNext = () => { if (isLast) { onFinish(); return; } goToSlide(index + 1); };
  const onBack = () => { if (index > 0) goToSlide(index - 1); };

  const panResponder = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (_, g) => Math.abs(g.dx) > 14 && Math.abs(g.dx) > Math.abs(g.dy) * 1.5,
      onPanResponderRelease: (_, g) => {
        if (g.dx < -50) { if (index >= SLIDES.length - 1) onFinish(); else goToSlide(index + 1); }
        else if (g.dx > 50 && index > 0) goToSlide(index - 1);
      },
    })
  ).current;

  const bottomPad = Math.max(insets.bottom, 16) + 88; // space for CTA

  return (
    <View style={styles.root} {...panResponder.panHandlers}>
      {/* Atmosphere glows */}
      <View style={styles.glow1} pointerEvents="none" />
      <View style={styles.glow2} pointerEvents="none" />

      {/* Top bar */}
      <View style={[styles.topBar, { paddingTop: insets.top + 12 }]}>
        <TouchableOpacity
          onPress={onBack}
          style={[styles.navBtn, index === 0 && { opacity: 0 }]}
          disabled={index === 0}
        >
          <Feather name="arrow-left" size={18} color={colors.inkTertiary} />
        </TouchableOpacity>

        <Text style={styles.wordmark}>Roleo</Text>

        <TouchableOpacity onPress={onFinish} style={styles.navBtn}>
          <Text style={styles.skipText}>Geç</Text>
        </TouchableOpacity>
      </View>

      {/* Progress dots */}
      <View style={styles.dotsRow}>
        {SLIDES.map((_, i) => (
          <View key={i} style={[styles.dot, i === index && styles.dotActive]} />
        ))}
      </View>

      {/* Carousel viewport */}
      <View style={[styles.viewport, { paddingBottom: bottomPad }]}>
        <Animated.View
          style={[
            styles.slideStrip,
            { width: SW * SLIDES.length, transform: [{ translateX }] },
          ]}
        >
          {SLIDES.map(slide => (
            <View key={slide.id} style={{ width: SW }}>
              <ScrollView
                showsVerticalScrollIndicator={false}
                scrollEventThrottle={16}
                contentContainerStyle={{ paddingHorizontal: 24, paddingBottom: 16 }}
              >
                <SlideBody slide={slide} />
              </ScrollView>
            </View>
          ))}
        </Animated.View>
      </View>

      {/* CTA */}
      <View style={[styles.ctaWrap, { paddingBottom: Math.max(insets.bottom, 16) + 8 }]}>
        <TouchableOpacity style={styles.cta} onPress={onNext} activeOpacity={0.85}>
          <Text style={styles.ctaText}>{isLast ? "Roleo'ya Başla" : 'Devam Et'}</Text>
          <Feather name="arrow-right" size={16} color={colors.bgDeep} />
        </TouchableOpacity>
      </View>
    </View>
  );
}

function SlideBody({ slide }: { slide: Slide }) {
  return (
    <View style={styles.slideBody}>
      <Text style={styles.eyebrow}>{slide.eyebrow}</Text>
      <Text style={styles.heading}>
        {slide.heading}{'\n'}
        <Text style={styles.headingItalic}>{slide.headingItalic}</Text>
      </Text>
      <Text style={styles.lead}>{slide.lead}</Text>
      <LinearGradient
        colors={['transparent', `${colors.accentWarm}40`, 'transparent']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={styles.shimmer}
      />
      <View style={styles.featureList}>
        {slide.features.map((f, i) => (
          <View
            key={i}
            style={[
              styles.featureRow,
              i < slide.features.length - 1 && styles.featureRowBorder,
            ]}
          >
            <View style={styles.featureIconCircle}>
              <Feather name={f.icon as any} size={16} color={colors.accentWarm} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.featureTitle}>{f.title}</Text>
              <Text style={styles.featureSub}>{f.sub}</Text>
            </View>
          </View>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.bgDeep,
  },

  glow1: {
    position: 'absolute',
    width: SW * 0.9,
    height: SW * 0.9,
    borderRadius: SW * 0.45,
    backgroundColor: 'rgba(232,181,118,0.07)',
    top: -SW * 0.3,
    right: -SW * 0.3,
  },
  glow2: {
    position: 'absolute',
    width: SW * 0.7,
    height: SW * 0.7,
    borderRadius: SW * 0.35,
    backgroundColor: 'rgba(95,124,168,0.06)',
    bottom: SW * 0.1,
    left: -SW * 0.25,
  },

  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    paddingBottom: 8,
  },
  navBtn: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  wordmark: {
    fontFamily: 'Fraunces_300Light_Italic',
    fontSize: 26,
    color: colors.accentWarm,
    letterSpacing: -0.5,
  },
  skipText: {
    fontFamily: 'InterTight_400Regular',
    fontSize: 14,
    color: colors.inkTertiary,
    textAlign: 'right',
  },

  dotsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 8,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.hairlineStrong,
  },
  dotActive: {
    width: 20,
    backgroundColor: colors.accentWarm,
  },

  viewport: {
    flex: 1,
    overflow: 'hidden',
    paddingTop: 20,
  },
  slideStrip: {
    flexDirection: 'row',
    flex: 1,
  },

  slideBody: {
    paddingBottom: 24,
  },

  eyebrow: {
    fontFamily: 'InterTight_500Medium',
    fontSize: 10,
    letterSpacing: 2.6,
    textTransform: 'uppercase',
    color: colors.accentWarmSoft,
    marginBottom: 16,
  },
  heading: {
    fontFamily: 'Fraunces_300Light',
    fontSize: 36,
    color: colors.inkPrimary,
    letterSpacing: -0.8,
    lineHeight: 44,
    marginBottom: 14,
  },
  headingItalic: {
    fontFamily: 'Fraunces_300Light_Italic',
    color: colors.accentWarm,
  },
  lead: {
    fontFamily: 'InterTight_400Regular',
    fontSize: 15,
    color: colors.inkSecondary,
    lineHeight: 22,
    marginBottom: 28,
  },

  shimmer: {
    height: 1,
    marginBottom: 24,
  },

  featureList: {
    gap: 0,
  },
  featureRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 14,
    paddingVertical: 16,
  },
  featureRowBorder: {
    borderBottomWidth: 1,
    borderBottomColor: colors.hairline,
  },
  featureIconCircle: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: `${colors.accentWarm}12`,
    borderWidth: 1,
    borderColor: `${colors.accentWarm}20`,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
  },
  featureTitle: {
    fontFamily: 'InterTight_500Medium',
    fontSize: 14,
    color: colors.inkPrimary,
    marginBottom: 3,
  },
  featureSub: {
    fontFamily: 'InterTight_400Regular',
    fontSize: 12,
    color: colors.inkTertiary,
    lineHeight: 17,
  },

  ctaWrap: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 24,
    paddingTop: 16,
    backgroundColor: colors.bgDeep,
  },
  cta: {
    backgroundColor: colors.inkPrimary,
    borderRadius: 999,
    paddingVertical: 17,
    paddingHorizontal: 28,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  ctaText: {
    fontFamily: 'InterTight_600SemiBold',
    fontSize: 15,
    color: colors.bgDeep,
  },
});
