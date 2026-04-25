import React, { useEffect, useRef } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, Animated, Easing } from 'react-native';
import { ModuleResult, SceneFlowPath } from '../types';
import type { DailyRunSnapshot } from '../services/runHook';

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
      <Animated.View style={{ opacity: intro, transform: [{ translateY: intro.interpolate({ inputRange: [0, 1], outputRange: [16, 0] }) }], width: '100%', alignItems: 'center' }}>
      <Text style={styles.emoji}>{overallAccuracy >= 80 ? '🏆' : overallAccuracy >= 55 ? '🎯' : '💪'}</Text>
      <Text style={styles.title}>Günlük loop tamam</Text>
      <Text style={styles.sub}>Warm-up → Scene → Result → Replay/Progress</Text>

      {dailyRunBoard?.prev && (
        <View style={styles.compareStrip}>
          <Text style={styles.compareStripTitle}>VS LAST DAILY RUN</Text>
          {dailyRunBoard.overallAccuracy > dailyRunBoard.prev.overallAccuracy + 0.03 ? (
            <Text style={styles.compareStripLine}>Genel isabet ↑ (%{Math.round(dailyRunBoard.prev.overallAccuracy * 100)} → %{overallAccuracy})</Text>
          ) : dailyRunBoard.overallAccuracy + 0.03 < dailyRunBoard.prev.overallAccuracy ? (
            <Text style={styles.compareStripLine}>Genel isabet ↓ — bir tur daha, telafi et.</Text>
          ) : (
            <Text style={styles.compareStripLine}>Önceki günlük koşuya yakın seviyedesin — küçük hamleyle geçersin.</Text>
          )}
          {dailyRunBoard.maxCombo > (dailyRunBoard.prev.maxCombo ?? 0) ? (
            <Text style={styles.compareStripLine}>Combo ↑ ({dailyRunBoard.prev.maxCombo ?? 0} → {dailyRunBoard.maxCombo})</Text>
          ) : null}
          <Text style={styles.challengeStrip}>
            {overallAccuracy < 80
              ? 'Bugünkü prova neredeyse temizdi — yarın düzelt.'
              : 'Kişisel hedef: bir sonraki sahneyi daha temiz prova et.'}
          </Text>
        </View>
      )}

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Performans</Text>
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
          <Text style={styles.phraseLabel}>Öne çıkan ifade</Text>
          <Text style={styles.phraseText}>"{scene.nativePhrase}"</Text>
        </View>
      )}

      <Text style={styles.message}>{message}</Text>

      <View style={styles.nextFocusCard}>
        <Text style={styles.nextFocusLabel}>Bir sonraki odak</Text>
        <Text style={styles.nextFocusText}>{nextFocus}</Text>
      </View>

      <TouchableOpacity style={styles.btnPrimary} onPress={onExit}>
        <Text style={styles.btnPrimaryText}>İlerlemeye dön →</Text>
      </TouchableOpacity>
      <TouchableOpacity style={styles.btnSecondary} onPress={onReplay}>
        <Text style={styles.btnSecondaryText}>Aynı loop’u tekrar prova et</Text>
      </TouchableOpacity>
      <Text style={styles.footerHint}>Yarın Roleo seni yine seçili sahne, kısa ısınma ve net odakla karşılar.</Text>
      </Animated.View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scrollView: { flex: 1, backgroundColor: '#F5F7FA' },
  scroll: {
    paddingHorizontal: 24,
    paddingTop: 56,
    paddingBottom: 40,
    alignItems: 'center',
  },
  emoji: { fontSize: 56 },
  title: { color: '#1A2B3C', fontSize: 28, fontWeight: '900', marginTop: 10, textAlign: 'center' },
  sub: { color: '#94A3B8', fontSize: 13, marginTop: 6, textAlign: 'center' },
  compareStrip: {
    width: '100%',
    backgroundColor: '#1E293B',
    borderRadius: 16,
    padding: 14,
    marginBottom: 4,
    borderWidth: 1,
    borderColor: '#334155',
  },
  compareStripTitle: { fontSize: 10, fontWeight: '900', color: '#94A3B8', letterSpacing: 1.2, marginBottom: 8 },
  compareStripLine: { fontSize: 14, fontWeight: '800', color: '#F1F5F9', marginBottom: 6 },
  challengeStrip: { fontSize: 13, fontWeight: '900', color: '#FBBF24', marginTop: 6, lineHeight: 20 },
  card: {
    width: '100%',
    marginTop: 20,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 18,
    borderWidth: 1,
    borderColor: '#E8EDF2',
    gap: 6,
  },
  cardTitle: { fontSize: 11, fontWeight: '900', color: '#94A3B8', letterSpacing: 1 },
  metric: { color: '#1A2B3C', fontSize: 16, fontWeight: '800' },
  metricSmall: { color: '#64748B', fontSize: 14, marginTop: 4 },
  phraseCard: {
    width: '100%',
    marginTop: 14,
    backgroundColor: '#F0FAF4',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#BBF7D0',
  },
  phraseLabel: { fontSize: 10, fontWeight: '900', color: '#15803D', letterSpacing: 1, marginBottom: 6 },
  phraseText: { fontSize: 16, color: '#14532D', fontWeight: '700', lineHeight: 24 },
  message: { color: '#7C6CF2', fontSize: 16, marginTop: 18, fontWeight: '700', textAlign: 'center', lineHeight: 24 },
  nextFocusCard: {
    width: '100%',
    marginTop: 16,
    backgroundColor: '#FFF7ED',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#FED7AA',
  },
  nextFocusLabel: { fontSize: 10, fontWeight: '900', color: '#C2410C', letterSpacing: 1, marginBottom: 6 },
  nextFocusText: { fontSize: 15, color: '#7C2D12', fontWeight: '800', lineHeight: 22 },
  btnPrimary: {
    marginTop: 22,
    backgroundColor: '#1B9C5A',
    borderRadius: 14,
    paddingVertical: 16,
    paddingHorizontal: 20,
    width: '100%',
    alignItems: 'center',
  },
  btnPrimaryText: { color: '#FFFFFF', fontSize: 16, fontWeight: '800' },
  btnSecondary: {
    marginTop: 10,
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    paddingVertical: 14,
    paddingHorizontal: 18,
    width: '100%',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E8EDF2',
  },
  btnSecondaryText: { color: '#475569', fontSize: 14, fontWeight: '800' },
  footerHint: { marginTop: 14, fontSize: 12, color: '#94A3B8', textAlign: 'center', lineHeight: 18 },
});
