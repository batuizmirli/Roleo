import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { StageResult, UserProfile } from '../types';
import { completeStage, getLevelFromXp } from '../services/progress';
import { getCelebrationByLevel } from '../services/personas';
import { trackEvent } from '../services/telemetry';
import { tryParseJson } from '../services/json';

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
  const [leveledUp, setLeveledUp] = useState(false);
  const [identityGoal, setIdentityGoal] = useState<string | null>(null);

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
      const prevXp = summary.progress.xp - result.xpEarned;
      const prevLevel = getLevelFromXp(prevXp < 0 ? 0 : prevXp);
      const newLevel = getLevelFromXp(summary.progress.xp);
      setLeveledUp(newLevel > prevLevel);
      setStreak(summary.progress.streak);
      setTotalXp(summary.progress.xp);
      setNextGoal(summary.unlockState.nextGoal);
      setNewlyUnlocked(summary.newlyUnlocked);
    });
    AsyncStorage.getItem('userProfile').then(raw => {
      const profile = raw ? tryParseJson<UserProfile>(raw) : null;
      const goal = profile?.identity?.goal ?? profile?.goalDescription ?? null;
      setIdentityGoal(goal);
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
        <View style={styles.levelRow}>
          <View style={styles.levelBadge}>
            <Text style={styles.levelBadgeText}>{result.userLevel.toUpperCase()}</Text>
          </View>
          {leveledUp && (
            <View style={styles.levelUpBadge}>
              <Text style={styles.levelUpText}>⬆ SEVİYE ATLADI</Text>
            </View>
          )}
        </View>
        {leveledUp && (
          <Text style={styles.levelUpHint}>
            {result.userLevel === 'intermediate'
              ? 'Artık intermediate seviyesindesin. AI daha az çeviri yapacak, daha doğal konuşacak.'
              : 'Artık advanced seviyesindesin. AI idiom ve slang kullanmaya başlayacak.'}
          </Text>
        )}
        <Text style={styles.scoreMeta}>Toplam XP: {totalXp} · Level {level}</Text>
        <Text style={styles.scoreMeta}>🔥 Seri: {streak} gün</Text>
        {!!result.naturalTip && <Text style={styles.tipText}>💬 Daha doğal söyleyiş: {result.naturalTip}</Text>}
      </View>

      {!!identityGoal && (
        <View style={styles.identityCard}>
          <Text style={styles.identityLabel}>HEDEFİNE DOĞRU</Text>
          <Text style={styles.identityText}>"{identityGoal}"</Text>
          <Text style={styles.identityHint}>Bu sahne o versiyona bir adım daha yaklaştırdı.</Text>
        </View>
      )}

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
  container: { flex: 1, backgroundColor: '#F5F7FA' },
  scroll: { paddingTop: 60, paddingHorizontal: 24, paddingBottom: 40 },
  emoji: { fontSize: 56, textAlign: 'center' },
  title: { fontSize: 28, fontWeight: '900', color: '#1A2B3C', textAlign: 'center', marginTop: 6 },
  subtitle: { fontSize: 14, color: '#9AABB8', textAlign: 'center', marginTop: 6, marginBottom: 18 },
  rewardLine: { fontSize: 16, color: '#3DD68C', textAlign: 'center', fontWeight: '800' },
  celebration: { fontSize: 13, color: '#BBB', textAlign: 'center', marginTop: 6, marginBottom: 14 },
  scoreCard: { backgroundColor: '#FFFFFF', borderRadius: 16, padding: 16, borderWidth: 1, borderColor: '#E8EDF2', marginBottom: 12 },
  scoreLabel: { color: '#1B9C5A', fontSize: 24, fontWeight: '900', marginBottom: 10 },
  levelRow: { flexDirection: 'row', gap: 8, alignItems: 'center', marginBottom: 8 },
  levelBadge: { backgroundColor: '#E8EDF2', borderRadius: 8, paddingHorizontal: 10, paddingVertical: 4 },
  levelBadgeText: { color: '#1A2B3C', fontSize: 12, fontWeight: '800' },
  levelUpBadge: { backgroundColor: '#3DD68C22', borderRadius: 8, paddingHorizontal: 10, paddingVertical: 4, borderWidth: 1, borderColor: '#3DD68C' },
  levelUpText: { color: '#3DD68C', fontSize: 11, fontWeight: '900' },
  levelUpHint: { color: '#3DD68C', fontSize: 12, lineHeight: 18, marginBottom: 8 },
  scoreMeta: { color: '#DDD', fontSize: 13, marginTop: 3 },
  tipText: { color: '#9BD8FF', fontSize: 12, marginTop: 10, lineHeight: 18 },
  identityCard: { backgroundColor: '#120A1E', borderRadius: 14, borderWidth: 1, borderColor: '#2E1E42', padding: 14, marginBottom: 14 },
  identityLabel: { color: '#A78BFA', fontSize: 10, fontWeight: '900', letterSpacing: 1.5, marginBottom: 6 },
  identityText: { color: '#1A2B3C', fontSize: 14, fontStyle: 'italic', lineHeight: 20 },
  identityHint: { color: '#9AABB8', fontSize: 12, marginTop: 6 },
  unlockCard: { backgroundColor: '#0A1A10', borderRadius: 14, borderWidth: 1, borderColor: '#1A3A20', padding: 12, marginBottom: 12 },
  unlockTitle: { color: '#3DD68C', fontSize: 12, fontWeight: '900' },
  unlockText: { color: '#D8FFE2', fontSize: 13, marginTop: 4, fontWeight: '700' },
  nextCard: { backgroundColor: '#12122A', borderRadius: 14, borderWidth: 1, borderColor: '#E8EDF2', padding: 12, marginBottom: 14 },
  nextTitle: { color: '#6B7B8D', fontSize: 12, fontWeight: '800' },
  nextText: { color: '#1A2B3C', fontSize: 16, fontWeight: '900', marginTop: 4 },
  nextGoal: { color: '#8E8AAE', fontSize: 11, marginTop: 6 },
  sectionTitle: { color: '#1A2B3C', fontSize: 17, fontWeight: '800', marginBottom: 10 },
  sideBtn: { backgroundColor: '#FFFFFF', borderRadius: 14, padding: 14, borderWidth: 1, borderColor: '#E8EDF2', marginBottom: 10 },
  sideTitle: { color: '#1A2B3C', fontSize: 15, fontWeight: '800' },
  sideDesc: { color: '#9AABB8', fontSize: 12, marginTop: 3 },
  primaryBtn: { marginTop: 8, backgroundColor: '#1B9C5A', borderRadius: 14, padding: 16, alignItems: 'center' },
  primaryText: { color: '#1A2B3C', fontSize: 16, fontWeight: '900' },
  secondaryBtn: { marginTop: 10, backgroundColor: '#FFFFFF', borderRadius: 14, padding: 14, alignItems: 'center' },
  secondaryText: { color: '#6B7B8D', fontSize: 14, fontWeight: '700' },
});
