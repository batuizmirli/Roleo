import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { StageResult } from '../types';
import { completeStage, getLevelFromXp } from '../services/progress';
import { getCelebrationByLevel } from '../services/personas';
import { trackEvent } from '../services/telemetry';

type Props = {
  result: StageResult;
  onBackHome: () => void;
  onGoScenarios: () => void;
  onOpenVocab: () => void;
  onOpenGrammar: () => void;
  onOpenQuiz: () => void;
  firstSessionMode?: boolean;
};

export default function StageResultScreen({
  result,
  onBackHome,
  onGoScenarios,
  onOpenVocab,
  onOpenGrammar,
  onOpenQuiz,
  firstSessionMode = false,
}: Props) {
  const [streak, setStreak] = useState(0);
  const [totalXp, setTotalXp] = useState(0);
  const [nextGoal, setNextGoal] = useState('');
  const [newlyUnlocked, setNewlyUnlocked] = useState<string[]>([]);

  useEffect(() => {
    trackEvent('result_seen', {
      scenarioId: result.scenarioId,
      stageType: result.stageType,
      userLevel: result.userLevel,
      xpEarned: result.xpEarned,
      messageCount: result.userMessageCount,
      firstSessionMode,
    });
    completeStage(result).then(summary => {
      setStreak(summary.progress.streak);
      setTotalXp(summary.progress.xp);
      setNextGoal(summary.unlockState.nextGoal);
      setNewlyUnlocked(summary.newlyUnlocked);
    });
  }, [result, firstSessionMode]);

  const level = getLevelFromXp(totalXp);

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.scroll}>
      <Text style={styles.emoji}>🏁</Text>
      <Text style={styles.title}>Sahne Tamamlandı</Text>
      <Text style={styles.subtitle}>{result.scenarioTitle}</Text>
      <Text style={styles.rewardLine}>{result.rewardLine ?? 'Bu sahneyi başarıyla tamamladın ✅'}</Text>
      <Text style={styles.celebration}>{getCelebrationByLevel(result.userLevel)}</Text>

      <View style={styles.scoreCard}>
        <Text style={styles.scoreLabel}>+{result.xpEarned} XP</Text>
        <Text style={styles.scoreMeta}>Seviye: {result.userLevel.toUpperCase()}</Text>
        <Text style={styles.scoreMeta}>Toplam XP: {totalXp} · Level {level}</Text>
        <Text style={styles.scoreMeta}>🔥 Seri: {streak} gün</Text>
        {!!result.naturalTip && <Text style={styles.tipText}>💬 Daha doğal söyleyiş: {result.naturalTip}</Text>}
      </View>

      {newlyUnlocked.length > 0 && (
        <View style={styles.unlockCard}>
          <Text style={styles.unlockTitle}>🔓 Yeni açıldı</Text>
          <Text style={styles.unlockText}>{newlyUnlocked.map(s => s.toUpperCase()).join(' · ')}</Text>
        </View>
      )}

      <View style={styles.nextCard}>
        <Text style={styles.nextTitle}>Sıradaki öneri</Text>
        <Text style={styles.nextText}>{result.suggestedNextStage ?? 'Travel Stage'}</Text>
        {!!nextGoal && <Text style={styles.nextGoal}>{nextGoal}</Text>}
      </View>

      {!firstSessionMode && (
        <>
          <Text style={styles.sectionTitle}>Yan Deneyimler</Text>
          <TouchableOpacity style={styles.sideBtn} onPress={onOpenVocab}>
            <Text style={styles.sideTitle}>💬 Scene Boost</Text>
            <Text style={styles.sideDesc}>Sahne öncesi kritik kelime kartları</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.sideBtn} onPress={onOpenGrammar}>
            <Text style={styles.sideTitle}>📚 Scene Coach</Text>
            <Text style={styles.sideDesc}>Yaptığın hatalardan mini ders</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.sideBtn} onPress={onOpenQuiz}>
            <Text style={styles.sideTitle}>⚡ Challenge Round</Text>
            <Text style={styles.sideDesc}>3-5 soruluk hızlı pekiştirme</Text>
          </TouchableOpacity>
        </>
      )}

      <TouchableOpacity style={styles.primaryBtn} onPress={onGoScenarios}>
        <Text style={styles.primaryText}>{firstSessionMode ? 'Devam Et' : "Sıradaki Stage'e Geç →"}</Text>
      </TouchableOpacity>

      {!firstSessionMode && (
        <TouchableOpacity style={styles.secondaryBtn} onPress={onBackHome}>
          <Text style={styles.secondaryText}>Ana Ekran</Text>
        </TouchableOpacity>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0D0D1A' },
  scroll: { paddingTop: 60, paddingHorizontal: 24, paddingBottom: 40 },
  emoji: { fontSize: 56, textAlign: 'center' },
  title: { fontSize: 28, fontWeight: '900', color: '#FFF', textAlign: 'center', marginTop: 6 },
  subtitle: { fontSize: 14, color: '#888', textAlign: 'center', marginTop: 6, marginBottom: 18 },
  rewardLine: { fontSize: 16, color: '#7BC67E', textAlign: 'center', fontWeight: '800' },
  celebration: { fontSize: 13, color: '#BBB', textAlign: 'center', marginTop: 6, marginBottom: 14 },
  scoreCard: { backgroundColor: '#1A1A2E', borderRadius: 16, padding: 16, borderWidth: 1, borderColor: '#2A2A3E', marginBottom: 20 },
  scoreLabel: { color: '#FF4D6D', fontSize: 24, fontWeight: '900', marginBottom: 8 },
  scoreMeta: { color: '#DDD', fontSize: 13, marginTop: 3 },
  tipText: { color: '#9BD8FF', fontSize: 12, marginTop: 10, lineHeight: 18 },
  unlockCard: { backgroundColor: '#112318', borderRadius: 14, borderWidth: 1, borderColor: '#1E4A2C', padding: 12, marginBottom: 12 },
  unlockTitle: { color: '#7BC67E', fontSize: 12, fontWeight: '900' },
  unlockText: { color: '#D8FFE2', fontSize: 13, marginTop: 4, fontWeight: '700' },
  nextCard: { backgroundColor: '#17162A', borderRadius: 14, borderWidth: 1, borderColor: '#2A2A3E', padding: 12, marginBottom: 14 },
  nextTitle: { color: '#AAA', fontSize: 12, fontWeight: '800' },
  nextText: { color: '#FFF', fontSize: 16, fontWeight: '900', marginTop: 4 },
  nextGoal: { color: '#8E8AAE', fontSize: 11, marginTop: 6 },
  sectionTitle: { color: '#FFF', fontSize: 17, fontWeight: '800', marginBottom: 10 },
  sideBtn: { backgroundColor: '#1A1A2E', borderRadius: 14, padding: 14, borderWidth: 1, borderColor: '#2A2A3E', marginBottom: 10 },
  sideTitle: { color: '#FFF', fontSize: 15, fontWeight: '800' },
  sideDesc: { color: '#888', fontSize: 12, marginTop: 3 },
  primaryBtn: { marginTop: 8, backgroundColor: '#FF4D6D', borderRadius: 14, padding: 16, alignItems: 'center' },
  primaryText: { color: '#FFF', fontSize: 16, fontWeight: '900' },
  secondaryBtn: { marginTop: 10, backgroundColor: '#1A1A2E', borderRadius: 14, padding: 14, alignItems: 'center' },
  secondaryText: { color: '#AAA', fontSize: 14, fontWeight: '700' },
});
