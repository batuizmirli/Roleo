import React, { useEffect, useRef } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, Animated, Easing } from 'react-native';
import { ModuleResult, SceneFlowPath } from '../types';
import type { DailyRunSnapshot } from '../services/runHook';
import { colors } from '../theme/colors';

type Props = {
  results: ModuleResult[];
  onExit: () => void;
  onReplay: () => void;
  dailyRunBoard?: {
    prev: DailyRunSnapshot | null;
    overallAccuracy: number;
    maxCombo: number;
    sceneAccuracy: number;
    sceneFlow?: SceneFlowPath;
  } | null;
};

export default function RunResultScreen({ results, onExit, onReplay, dailyRunBoard }: Props) {
  const intro = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    intro.setValue(0);
    Animated.timing(intro, {
      toValue: 1,
      duration: 480,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start();
  }, [intro]);

  const overallAccuracy = results.length
    ? Math.round((results.reduce((s, r) => s + r.accuracy, 0) / results.length) * 100)
    : 0;
  const maxCombo = results.reduce((m, r) => Math.max(m, r.comboMax ?? 0), 0);
  const scene = results.find(r => r.module === 'scene');
  const weakest = results.reduce<ModuleResult | null>((current, item) => (
    !current || item.accuracy < current.accuracy ? item : current
  ), null);

  const nextFocus = weakest?.module === 'flash'
    ? 'Yarın ilk odak: sahne kelimelerini daha hızlı tanı.'
    : weakest?.module === 'truefake'
    ? 'Yarın ilk odak: doğal gelen cümleyi daha erken ayır.'
    : scene?.flowPath === 'friction'
    ? 'Yarın ilk odak: iki tur üst üste temiz cevapla akışı koru.'
    : 'Yarın ilk odak: aynı sakin ritmi bir sahne daha ileri taşı.';

  const message = overallAccuracy >= 80
    ? 'Temiz bir koşuydu — sahne ritmini tuttun.'
    : overallAccuracy >= 55
    ? 'Biraz tereddüt ettin ama toparladın.'
    : 'You can do better — yarın aynı koşuyu tekrar al.';

  return (
    <ScrollView contentContainerStyle={styles.scroll} style={styles.scrollView}>
      <Animated.View style={{
        opacity: intro,
        transform: [{ translateY: intro.interpolate({ inputRange: [0, 1], outputRange: [16, 0] }) }],
        width: '100%',
        alignItems: 'center',
      }}>
        <Text style={styles.emoji}>{overallAccuracy >= 80 ? '🏆' : overallAccuracy >= 55 ? '🎯' : '💪'}</Text>
        <Text style={styles.title}>Günlük loop tamam</Text>
        <Text style={styles.sub}>Warm-up · Sahne · Sonuç</Text>

        {dailyRunBoard?.prev && (
          <View style={styles.compareStrip}>
            <Text style={styles.compareStripTitle}>ÖNCEKİ GÜN İLE KARŞILAŞTIRMA</Text>
            {dailyRunBoard.overallAccuracy > dailyRunBoard.prev.overallAccuracy + 0.03 ? (
              <Text style={styles.compareStripLine}>
                Genel isabet ↑ (%{Math.round(dailyRunBoard.prev.overallAccuracy * 100)} → %{overallAccuracy})
              </Text>
            ) : dailyRunBoard.overallAccuracy + 0.03 < dailyRunBoard.prev.overallAccuracy ? (
              <Text style={styles.compareStripLine}>Genel isabet ↓ — bir tur daha, telafi et.</Text>
            ) : (
              <Text style={styles.compareStripLine}>
                Önceki günlük koşuya yakın seviyedesin — küçük hamleyle geçersin.
              </Text>
            )}
            {dailyRunBoard.maxCombo > (dailyRunBoard.prev.maxCombo ?? 0) ? (
              <Text style={styles.compareStripLine}>
                Combo ↑ ({dailyRunBoard.prev.maxCombo ?? 0} → {dailyRunBoard.maxCombo})
              </Text>
            ) : null}
            <Text style={styles.challengeStrip}>
              {overallAccuracy < 80
                ? 'Bugünkü prova neredeyse temizdi — yarın düzelt.'
                : 'Kişisel hedef: bir sonraki sahneyi daha temiz prova et.'}
            </Text>
          </View>
        )}

        <View style={styles.card}>
          <Text style={styles.cardTitle}>PERFORMANS</Text>
          <Text style={styles.metric}>Genel isabet: %{overallAccuracy}</Text>
          <Text style={styles.metric}>En yüksek combo: {maxCombo}</Text>
          {scene?.flowPath && (
            <Text style={styles.metricSmall}>
              Sahne hattı: {scene.flowPath === 'smooth' ? '✨ Temiz' : '⚡ Gergin'}
            </Text>
          )}
        </View>

        {!!scene?.nativePhrase && (
          <View style={styles.phraseCard}>
            <Text style={styles.phraseLabel}>ÖNE ÇIKAN İFADE</Text>
            <Text style={styles.phraseText}>"{scene.nativePhrase}"</Text>
          </View>
        )}

        <Text style={styles.message}>{message}</Text>

        <View style={styles.nextFocusCard}>
          <Text style={styles.nextFocusLabel}>BİR SONRAKİ ODAK</Text>
          <Text style={styles.nextFocusText}>{nextFocus}</Text>
        </View>

        <TouchableOpacity style={styles.btnPrimary} onPress={onExit}>
          <Text style={styles.btnPrimaryText}>İlerlemeye dön →</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.btnSecondary} onPress={onReplay}>
          <Text style={styles.btnSecondaryText}>Aynı loop'u tekrar prova et</Text>
        </TouchableOpacity>
        <Text style={styles.footerHint}>
          Yarın Roleo seni yine seçili sahne, kısa ısınma ve net odakla karşılar.
        </Text>
      </Animated.View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scrollView: { flex: 1, backgroundColor: colors.bgDeep },
  scroll: { paddingHorizontal: 24, paddingTop: 56, paddingBottom: 40, alignItems: 'center' },

  emoji: { fontSize: 56 },
  title: {
    fontFamily: 'Fraunces_300Light',
    color: colors.inkPrimary,
    fontSize: 30,
    letterSpacing: -0.5,
    marginTop: 10,
    textAlign: 'center',
  },
  sub: {
    fontFamily: 'InterTight_400Regular',
    color: colors.inkTertiary,
    fontSize: 13,
    marginTop: 6,
    textAlign: 'center',
    letterSpacing: 1,
  },

  compareStrip: {
    width: '100%',
    backgroundColor: colors.bgMid,
    borderRadius: 16,
    padding: 16,
    marginTop: 20,
    borderWidth: 1,
    borderColor: colors.hairlineStrong,
  },
  compareStripTitle: {
    fontFamily: 'InterTight_500Medium',
    fontSize: 10,
    color: colors.inkTertiary,
    letterSpacing: 1.6,
    marginBottom: 10,
  },
  compareStripLine: {
    fontFamily: 'InterTight_500Medium',
    fontSize: 14,
    color: colors.inkPrimary,
    marginBottom: 6,
    lineHeight: 20,
  },
  challengeStrip: {
    fontFamily: 'InterTight_400Regular',
    fontSize: 13,
    color: colors.accentWarm,
    marginTop: 6,
    lineHeight: 20,
  },

  card: {
    width: '100%',
    marginTop: 20,
    backgroundColor: colors.bgMid,
    borderRadius: 16,
    padding: 18,
    borderWidth: 1,
    borderColor: colors.hairlineStrong,
    gap: 8,
  },
  cardTitle: {
    fontFamily: 'InterTight_500Medium',
    fontSize: 10,
    color: colors.inkTertiary,
    letterSpacing: 1.6,
    marginBottom: 4,
  },
  metric: {
    fontFamily: 'Fraunces_300Light',
    color: colors.inkPrimary,
    fontSize: 18,
    letterSpacing: -0.2,
  },
  metricSmall: {
    fontFamily: 'InterTight_400Regular',
    color: colors.inkSecondary,
    fontSize: 13,
    marginTop: 2,
  },

  phraseCard: {
    width: '100%',
    marginTop: 14,
    backgroundColor: colors.bgMid,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderLeftWidth: 3,
    borderColor: colors.hairlineStrong,
    borderLeftColor: colors.accentWarm,
  },
  phraseLabel: {
    fontFamily: 'InterTight_500Medium',
    fontSize: 10,
    color: colors.accentWarmSoft,
    letterSpacing: 1.6,
    marginBottom: 8,
  },
  phraseText: {
    fontFamily: 'Fraunces_300Light_Italic',
    fontSize: 18,
    color: colors.inkPrimary,
    lineHeight: 26,
  },

  message: {
    fontFamily: 'InterTight_400Regular',
    color: colors.inkSecondary,
    fontSize: 15,
    marginTop: 20,
    textAlign: 'center',
    lineHeight: 22,
  },

  nextFocusCard: {
    width: '100%',
    marginTop: 16,
    backgroundColor: colors.bgMid,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: `${colors.accentWarm}30`,
  },
  nextFocusLabel: {
    fontFamily: 'InterTight_500Medium',
    fontSize: 10,
    color: colors.accentWarmSoft,
    letterSpacing: 1.6,
    marginBottom: 8,
  },
  nextFocusText: {
    fontFamily: 'InterTight_400Regular',
    fontSize: 14,
    color: colors.inkSecondary,
    lineHeight: 21,
  },

  btnPrimary: {
    marginTop: 24,
    backgroundColor: colors.inkPrimary,
    borderRadius: 999,
    paddingVertical: 17,
    paddingHorizontal: 28,
    width: '100%',
    alignItems: 'center',
  },
  btnPrimaryText: {
    fontFamily: 'InterTight_600SemiBold',
    color: colors.bgDeep,
    fontSize: 15,
  },
  btnSecondary: {
    marginTop: 10,
    backgroundColor: colors.bgMid,
    borderRadius: 999,
    paddingVertical: 15,
    paddingHorizontal: 24,
    width: '100%',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.hairlineStrong,
  },
  btnSecondaryText: {
    fontFamily: 'InterTight_500Medium',
    color: colors.inkSecondary,
    fontSize: 14,
  },
  footerHint: {
    fontFamily: 'InterTight_400Regular',
    marginTop: 16,
    fontSize: 12,
    color: colors.inkTertiary,
    textAlign: 'center',
    lineHeight: 18,
  },
});
