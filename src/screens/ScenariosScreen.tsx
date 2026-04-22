import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, RefreshControl, ImageBackground } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { UserProfile, Scenario } from '../types';
import { getDailyScenarios, getScenarioWithVariant } from '../data/scenarios';
import { tryParseJson } from '../services/json';
import AnimatedPressable from '../components/AnimatedPressable';
import { getProgress, getUnlockState } from '../services/progress';
import { colors } from '../theme/colors';

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
  const [completedIds, setCompletedIds] = useState<string[]>([]);
  const [playCounts, setPlayCounts] = useState<Record<string, number>>({});

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
      setCompletedIds(progress.completedScenarioIds);
      setPlayCounts(progress.scenarioPlayCounts ?? {});
    }
  };

  useEffect(() => { load(); }, []);

  const diffColor = (d: string) => d === 'beginner' ? colors.success : d === 'intermediate' ? colors.warning : colors.danger;
  const diffLabel = (d: string) => d === 'beginner' ? 'Başlangıç' : d === 'intermediate' ? 'Orta' : 'İleri';

  // Unlock chronology: cafe/social/story always open → travel → business → survival
  const STAGE_ORDER = ['cafe', 'social', 'story', 'travel', 'business', 'survival'];
  const allGroups = [
    { key: 'cafe',     title: '☕ Café Stage',     items: scenarios.filter(s => (s.stageType ?? 'social') === 'cafe') },
    { key: 'social',   title: '🎉 Social Stage',   items: scenarios.filter(s => (s.stageType ?? 'social') === 'social') },
    { key: 'story',    title: '📖 Story Stage',    items: scenarios.filter(s => (s.stageType ?? 'social') === 'story') },
    { key: 'travel',   title: '✈️ Travel Stage',   items: scenarios.filter(s => (s.stageType ?? 'social') === 'travel') },
    { key: 'business', title: '💼 Business Stage', items: scenarios.filter(s => (s.stageType ?? 'social') === 'business') },
    { key: 'survival', title: '🛟 Survival Stage', items: scenarios.filter(s => (s.stageType ?? 'social') === 'survival') },
  ].filter(group => group.items.length > 0);

  const unlockedGroups = allGroups.filter(g => unlockedTypes.includes(g.key));
  const lockedGroups = allGroups
    .filter(g => !unlockedTypes.includes(g.key))
    .sort((a, b) => STAGE_ORDER.indexOf(a.key) - STAGE_ORDER.indexOf(b.key));
  const stageGroups = [...unlockedGroups, ...lockedGroups];

  return (
    <View style={styles.container}>
      <TouchableOpacity onPress={onBack} style={styles.fixedBackBtn}>
        <Text style={styles.fixedBackText}>←</Text>
      </TouchableOpacity>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scroll}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={async () => { setRefreshing(true); await load(); setRefreshing(false); }} tintColor={colors.primaryAccent} />}
      >
      <View style={styles.header}>
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

          {isUnlocked && group.items.map((scenario, index) => {
            const isDone = completedIds.includes(scenario.id);
            const playCount = playCounts[scenario.id] ?? 0;
            const variant = getScenarioWithVariant(scenario, playCount, profile?.identity);
            const hasBg = !!scenario.backgroundImage;
            return (
            <AnimatedPressable key={scenario.id} style={[styles.card, isDone && styles.cardDone]} onPress={() => onScenarioSelect(variant)} delay={gIndex * 120 + index * 50}>
              {hasBg ? (
                <ImageBackground
                  source={{ uri: scenario.backgroundImage }}
                  style={styles.cardBgImage}
                  imageStyle={styles.cardBgImageStyle}
                  resizeMode="cover"
                >
                  <View style={styles.cardBgOverlay} />
                </ImageBackground>
              ) : null}
              <View style={styles.cardTop}>
                <Text style={[styles.emoji, hasBg && styles.emojiOnBg]}>{scenario.emoji}</Text>
                <View style={{ flexDirection: 'row', gap: 6, alignItems: 'center' }}>
                  {isDone && <Text style={[styles.doneTag, hasBg && styles.doneTagOnBg]}>✓ Tamamlandı</Text>}
                  <View style={[styles.badge, { backgroundColor: hasBg ? 'rgba(255,255,255,0.2)' : diffColor(scenario.difficulty) + '22' }]}>
                    <Text style={[styles.badgeText, { color: hasBg ? '#fff' : diffColor(scenario.difficulty) }]}>{diffLabel(scenario.difficulty)}</Text>
                  </View>
                </View>
              </View>
              <Text style={[styles.cardTitle, hasBg && styles.textOnBg]}>{scenario.title}</Text>
              <Text style={[styles.cardLocation, hasBg && styles.locationOnBg]}>📍 {scenario.location}</Text>
              {!!scenario.mission && <Text style={[styles.missionText, hasBg && styles.missionOnBg]}>🎯 {scenario.mission}</Text>}
              {scenario.vocabHints && (
                <Text style={[styles.vocabPreview, hasBg && styles.vocabOnBg]}>💬 {scenario.vocabHints.slice(0, 3).map(v => v.word).join(' • ')}</Text>
              )}
              <View style={[styles.cardFooter, hasBg && styles.cardFooterOnBg]}>
                <Text style={[styles.startText, hasBg && styles.startTextOnBg]}>{isDone ? 'Tekrar oyna →' : 'Sahneye gir →'}</Text>
                <Text style={[styles.rewardText, hasBg && styles.rewardOnBg]}>+{scenario.xpReward ?? 20} XP</Text>
              </View>
            </AnimatedPressable>
            );
          })}
        </View>
      )})}
      <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  scrollView: { flex: 1 },
  scroll: { paddingHorizontal: 20, paddingTop: 96, paddingBottom: 40 },
  fixedBackBtn: {
    position: 'absolute',
    top: 52,
    left: 20,
    zIndex: 100,
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.primaryBorder,
  },
  fixedBackText: { fontSize: 20, color: colors.textPrimary },
  header: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 8, paddingLeft: 52 },
  title: { fontSize: 24, fontWeight: '800', color: colors.textPrimary, fontFamily: 'Poppins_700Bold' },
  subtitle: { fontSize: 14, color: colors.textSecondary, marginBottom: 24 },
  nextGoal: { fontSize: 12, color: colors.primaryAccent, marginBottom: 10 },
  groupWrap: { marginBottom: 18 },
  groupTitle: { fontSize: 11, fontWeight: '800', color: colors.textMuted, marginBottom: 8, letterSpacing: 1.2, textTransform: 'uppercase' },
  lockedCard: { backgroundColor: colors.surfaceAlt, borderWidth: 1, borderColor: colors.primaryBorder, borderRadius: 14, padding: 14, marginBottom: 10, opacity: 0.85 },
  lockedTitle: { color: colors.textSecondary, fontWeight: '800', fontSize: 13 },
  lockedDesc: { color: colors.textMuted, fontSize: 12, marginTop: 5 },
  card: { overflow: 'hidden', backgroundColor: colors.surface, borderRadius: 18, padding: 18, marginBottom: 12, borderWidth: 1, borderColor: colors.primaryBorder, shadowColor: '#2F241B', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.06, shadowRadius: 10, elevation: 4 },
  cardDone: { borderColor: colors.secondaryBorder, backgroundColor: colors.secondaryCard },
  cardBgImage: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 },
  cardBgImageStyle: { borderRadius: 18 },
  cardBgOverlay: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(5,5,5,0.65)', borderRadius: 18 },
  doneTag: { fontSize: 11, fontWeight: '800', color: colors.primaryAccent },
  doneTagOnBg: { color: '#FFFDF8' },
  textOnBg: { color: '#F5EDD8' },
  locationOnBg: { color: 'rgba(245,237,216,0.6)' },
  missionOnBg: { color: '#FFF1DD' },
  vocabOnBg: { color: 'rgba(245,237,216,0.5)' },
  emojiOnBg: {},
  cardFooterOnBg: { borderTopColor: 'rgba(245,237,216,0.12)' },
  startTextOnBg: { color: '#FFF1DD' },
  rewardOnBg: { color: '#FFF1DD' },
  cardTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  emoji: { fontSize: 32 },
  badge: { borderRadius: 8, paddingHorizontal: 10, paddingVertical: 4 },
  badgeText: { fontSize: 12, fontWeight: '700' },
  cardTitle: { fontSize: 18, fontWeight: '800', color: colors.textPrimary, marginBottom: 6, fontFamily: 'Poppins_700Bold' },
  cardLocation: { fontSize: 13, color: colors.textSecondary, marginBottom: 10 },
  missionText: { fontSize: 12, color: colors.primaryAccent, marginBottom: 8 },
  vocabPreview: { fontSize: 12, color: colors.textMuted, marginBottom: 14 },
  cardFooter: { borderTopWidth: 1, borderTopColor: colors.divider, paddingTop: 14, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  startText: { fontSize: 14, fontWeight: '700', color: colors.primaryAccent },
  rewardText: { fontSize: 12, fontWeight: '800', color: colors.secondaryAccent },
});
