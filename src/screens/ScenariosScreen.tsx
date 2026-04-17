import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, RefreshControl } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { UserProfile, Scenario } from '../types';
import { getDailyScenarios } from '../data/scenarios';
import { tryParseJson } from '../services/json';
import AnimatedPressable from '../components/AnimatedPressable';
import { getProgress, getUnlockState } from '../services/progress';

type Props = {
  onScenarioSelect: (scenario: Scenario) => void;
  onBack: () => void;
};

export default function ScenariosScreen({ onScenarioSelect, onBack }: Props) {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [scenarios, setScenarios] = useState<Scenario[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [unlockedTypes, setUnlockedTypes] = useState<string[]>(['cafe', 'social', 'story']);
  const [nextGoal, setNextGoal] = useState('');

  const load = async () => {
    const data = await AsyncStorage.getItem('userProfile');
    if (data) {
      const p = tryParseJson<UserProfile>(data);
      if (!p) {
        await AsyncStorage.removeItem('userProfile');
        return;
      }
      setProfile(p);
      setScenarios(getDailyScenarios(p.language.code));

      const progress = await getProgress();
      const unlockState = getUnlockState(progress);
      setUnlockedTypes(unlockState.unlockedStageTypes);
      setNextGoal(unlockState.nextGoal);
    }
  };

  useEffect(() => { load(); }, []);

  const diffColor = (d: string) => d === 'beginner' ? '#4CAF50' : d === 'intermediate' ? '#FF9800' : '#F44336';
  const diffLabel = (d: string) => d === 'beginner' ? 'Başlangıç' : d === 'intermediate' ? 'Orta' : 'İleri';

  const stageGroups = [
    { key: 'cafe', title: '☕ Café Stage', items: scenarios.filter(s => (s.stageType ?? 'social') === 'cafe') },
    { key: 'travel', title: '✈️ Travel Stage', items: scenarios.filter(s => (s.stageType ?? 'social') === 'travel') },
    { key: 'business', title: '💼 Business Stage', items: scenarios.filter(s => (s.stageType ?? 'social') === 'business') },
    { key: 'social', title: '🎉 Social Stage', items: scenarios.filter(s => (s.stageType ?? 'social') === 'social') },
    { key: 'survival', title: '🛟 Survival Stage', items: scenarios.filter(s => (s.stageType ?? 'social') === 'survival') },
    { key: 'story', title: '📖 Story Stage', items: scenarios.filter(s => (s.stageType ?? 'social') === 'story') },
  ].filter(group => group.items.length > 0);

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.scroll}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={async () => { setRefreshing(true); await load(); setRefreshing(false); }} tintColor="#FF4D6D" />}
    >
      <View style={styles.header}>
        <TouchableOpacity onPress={onBack} style={styles.backBtn}>
          <Text style={styles.backText}>←</Text>
        </TouchableOpacity>
        <Text style={styles.title}>🎭 Sahneler</Text>
      </View>
      <Text style={styles.subtitle}>{profile?.language.flag} {profile?.language.name} · Gerçek hayat simülasyonları</Text>

      {!!nextGoal && <Text style={styles.nextGoal}>🔓 Açılacak sonraki: {nextGoal}</Text>}

      {stageGroups.map((group, gIndex) => {
        const isUnlocked = unlockedTypes.includes(group.key);
        return (
        <View key={group.title} style={styles.groupWrap}>
          <Text style={styles.groupTitle}>{group.title}</Text>
          {!isUnlocked && (
            <View style={styles.lockedCard}>
              <Text style={styles.lockedTitle}>🔒 Bu stage henüz kilitli</Text>
              <Text style={styles.lockedDesc}>{nextGoal || 'Önce önceki stage görevlerini tamamla.'}</Text>
            </View>
          )}

          {isUnlocked && group.items.map((scenario, index) => (
            <AnimatedPressable key={scenario.id} style={styles.card} onPress={() => onScenarioSelect(scenario)} delay={gIndex * 120 + index * 50}>
              <View style={styles.cardTop}>
                <Text style={styles.emoji}>{scenario.emoji}</Text>
                <View style={[styles.badge, { backgroundColor: diffColor(scenario.difficulty) + '22' }]}>
                  <Text style={[styles.badgeText, { color: diffColor(scenario.difficulty) }]}>{diffLabel(scenario.difficulty)}</Text>
                </View>
              </View>
              <Text style={styles.cardTitle}>{scenario.title}</Text>
              <Text style={styles.cardLocation}>📍 {scenario.location}</Text>
              {!!scenario.mission && <Text style={styles.missionText}>🎯 {scenario.mission}</Text>}
              {scenario.vocabHints && (
                <Text style={styles.vocabPreview}>💬 {scenario.vocabHints.slice(0, 3).map(v => v.word).join(' • ')}</Text>
              )}
              <View style={styles.cardFooter}>
                <Text style={styles.startText}>Sahneye gir →</Text>
                <Text style={styles.rewardText}>+{scenario.xpReward ?? 20} XP</Text>
              </View>
            </AnimatedPressable>
          ))}
        </View>
      )})}
      <View style={{ height: 40 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0D0D1A' },
  scroll: { paddingHorizontal: 24, paddingTop: 60, paddingBottom: 40 },
  header: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 8 },
  backBtn: { width: 40, height: 40, borderRadius: 12, backgroundColor: '#1A1A2E', alignItems: 'center', justifyContent: 'center' },
  backText: { fontSize: 20, color: '#FFF' },
  title: { fontSize: 22, fontWeight: '800', color: '#FFF' },
  subtitle: { fontSize: 14, color: '#666', marginBottom: 24 },
  nextGoal: { fontSize: 12, color: '#777', marginBottom: 10 },
  groupWrap: { marginBottom: 18 },
  groupTitle: { fontSize: 13, fontWeight: '800', color: '#AAA', marginBottom: 8, letterSpacing: 0.6 },
  lockedCard: { backgroundColor: '#171727', borderWidth: 1, borderColor: '#2C2C45', borderRadius: 14, padding: 14, marginBottom: 10 },
  lockedTitle: { color: '#B8B8CF', fontWeight: '800', fontSize: 13 },
  lockedDesc: { color: '#7E7E98', fontSize: 12, marginTop: 5 },
  card: { backgroundColor: '#1A1A2E', borderRadius: 20, padding: 20, marginBottom: 14, borderWidth: 1.5, borderColor: '#2A2A3E' },
  cardTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  emoji: { fontSize: 32 },
  badge: { borderRadius: 8, paddingHorizontal: 10, paddingVertical: 4 },
  badgeText: { fontSize: 12, fontWeight: '700' },
  cardTitle: { fontSize: 20, fontWeight: '800', color: '#FFF', marginBottom: 6 },
  cardLocation: { fontSize: 13, color: '#666', marginBottom: 10 },
  missionText: { fontSize: 12, color: '#FFB4C1', marginBottom: 8 },
  vocabPreview: { fontSize: 12, color: '#555', marginBottom: 14 },
  cardFooter: { borderTopWidth: 1, borderTopColor: '#2A2A3E', paddingTop: 14, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  startText: { fontSize: 14, fontWeight: '700', color: '#FF4D6D' },
  rewardText: { fontSize: 12, fontWeight: '800', color: '#7BC67E' },
});
