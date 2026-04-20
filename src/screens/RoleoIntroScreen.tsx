import React, { useMemo, useRef, useState } from 'react';
import { Animated, SafeAreaView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { colors } from '../theme/colors';
import { spacing } from '../theme/spacing';
import { typography } from '../theme/typography';

type Props = {
  onFinish: () => void;
};

type IntroSlide = {
  id: string;
  emoji: string;
  title: string;
  subtitle: string;
  bullets: string[];
};

const SLIDES: IntroSlide[] = [
  {
    id: 'welcome',
    emoji: '🚀',
    title: 'Roleo’ya Hoş Geldin',
    subtitle: 'Dil öğrenmeyi hızlı, eğlenceli ve sürdürülebilir hale getirir.',
    bullets: [
      'Kısa ama etkili oyun döngüleri',
      'Her gün devam etmeni sağlayan yapı',
      'Gelişimini anlık görme',
    ],
  },
  {
    id: 'speak',
    emoji: '🎭',
    title: 'Gerçek Hayat Konuşmaları',
    subtitle: 'Sahne modunda akıcı konuşma pratiği yaparsın.',
    bullets: [
      'Farklı sosyal durumlar: kafe, iş, seyahat',
      'Doğal / orta / garip cevap farkını öğrenme',
      'Anlık geri bildirim ve toparlama ipuçları',
    ],
  },
  {
    id: 'arcade',
    emoji: '⚡',
    title: 'Hızlı Mini-Game Modları',
    subtitle: 'Refleks + dil hissini aynı anda güçlendirir.',
    bullets: [
      'Flash Pick ile hız ve kelime eşleştirme',
      'True or Fake ile doğru/yanlış sezgisi',
      'Combo sistemiyle akışa girme',
    ],
  },
  {
    id: 'value',
    emoji: '📈',
    title: 'Sana Ne Katar?',
    subtitle: 'Kısa sürede daha özgüvenli ve daha doğal konuşma.',
    bullets: [
      'Hata farkındalığı ve doğru kalıplar',
      'Düzenli pratikle kalıcı ilerleme',
      'Günlük kullanımda gerçek ifade üretimi',
    ],
  },
];

export default function RoleoIntroScreen({ onFinish }: Props) {
  const [index, setIndex] = useState(0);
  const opacity = useRef(new Animated.Value(1)).current;
  const translateX = useRef(new Animated.Value(0)).current;

  const slide = useMemo(() => SLIDES[index], [index]);
  const isLast = index === SLIDES.length - 1;

  const animateTo = (nextIndex: number) => {
    Animated.parallel([
      Animated.timing(opacity, { toValue: 0, duration: 140, useNativeDriver: true }),
      Animated.timing(translateX, { toValue: -10, duration: 140, useNativeDriver: true }),
    ]).start(() => {
      setIndex(nextIndex);
      translateX.setValue(10);
      Animated.parallel([
        Animated.timing(opacity, { toValue: 1, duration: 180, useNativeDriver: true }),
        Animated.timing(translateX, { toValue: 0, duration: 180, useNativeDriver: true }),
      ]).start();
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

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.topRow}>
        <TouchableOpacity onPress={onBack} style={[styles.textBtn, index === 0 && styles.hiddenBtn]} disabled={index === 0}>
          <Text style={styles.textBtnLabel}>Geri</Text>
        </TouchableOpacity>

        <View style={styles.dotsWrap}>
          {SLIDES.map((s, i) => (
            <View key={s.id} style={[styles.dot, i === index && styles.dotActive]} />
          ))}
        </View>

        <TouchableOpacity onPress={onFinish} style={styles.textBtn}>
          <Text style={styles.textBtnLabel}>Geç</Text>
        </TouchableOpacity>
      </View>

      <Animated.View style={[styles.card, { opacity, transform: [{ translateX }] }]}>
        <Text style={styles.emoji}>{slide.emoji}</Text>
        <Text style={styles.title}>{slide.title}</Text>
        <Text style={styles.subtitle}>{slide.subtitle}</Text>

        <View style={styles.bulletsWrap}>
          {slide.bullets.map((b, i) => (
            <View key={`${slide.id}-${i}`} style={styles.bulletRow}>
              <Text style={styles.bulletMark}>•</Text>
              <Text style={styles.bulletText}>{b}</Text>
            </View>
          ))}
        </View>
      </Animated.View>

      <TouchableOpacity style={styles.nextBtn} onPress={onNext}>
        <Text style={styles.nextBtnText}>{isLast ? 'Roleo’ya Başla' : 'Devam Et →'}</Text>
      </TouchableOpacity>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.md,
    paddingBottom: spacing.xl,
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: spacing.sm,
  },
  textBtn: {
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.sm,
  },
  hiddenBtn: {
    opacity: 0,
  },
  textBtnLabel: {
    color: colors.textSecondary,
    fontSize: typography.size.sm,
    fontWeight: typography.weight.semibold,
  },
  dotsWrap: {
    flexDirection: 'row',
    gap: spacing.xs,
  },
  dot: {
    width: 7,
    height: 7,
    borderRadius: 99,
    backgroundColor: '#334155',
  },
  dotActive: {
    width: 22,
    backgroundColor: colors.primaryAccent,
  },
  card: {
    marginTop: spacing.xl,
    flex: 1,
    borderRadius: 22,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.divider,
    padding: spacing.xl,
  },
  emoji: {
    fontSize: 48,
    marginBottom: spacing.sm,
  },
  title: {
    color: colors.textPrimary,
    fontSize: 28,
    lineHeight: 34,
    fontWeight: typography.weight.black,
  },
  subtitle: {
    marginTop: spacing.sm,
    color: colors.textSecondary,
    fontSize: typography.size.md,
    lineHeight: 22,
  },
  bulletsWrap: {
    marginTop: spacing.xl,
    gap: spacing.md,
  },
  bulletRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.sm,
  },
  bulletMark: {
    color: colors.primaryAccent,
    fontSize: typography.size.lg,
    lineHeight: 20,
    marginTop: -2,
  },
  bulletText: {
    flex: 1,
    color: colors.textPrimary,
    fontSize: typography.size.sm,
    lineHeight: 20,
  },
  nextBtn: {
    marginTop: spacing.lg,
    backgroundColor: colors.primaryAccent,
    borderRadius: 14,
    paddingVertical: spacing.lg,
    alignItems: 'center',
  },
  nextBtnText: {
    color: '#0B1020',
    fontSize: typography.size.lg,
    fontWeight: typography.weight.black,
  },
});
