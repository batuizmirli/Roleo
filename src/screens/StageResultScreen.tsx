import React, { useEffect, useState, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Animated, Easing } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { StageResult, UserProfile } from '../types';
import { getDailyLeaderboard, LeaderboardEntry } from '../services/leaderboard';
import { completeStage, getLevelFromXp } from '../services/progress';
import { getCelebrationByLevel } from '../services/personas';
import { trackEvent } from '../services/telemetry';
import { tryParseJson } from '../services/json';
import { getMotivationHero, buildStageReplayCta, oneLineRunDelta } from '../services/runHook';

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
  const [leaderboard, setLeaderboard] = useState<(LeaderboardEntry & { rank: number })[]>([]);
  const [showDetails, setShowDetails] = useState(false);
  const heroY = useRef(new Animated.Value(24)).current;
  const heroOpacity = useRef(new Animated.Value(0)).current;
  const xpPop = useRef(new Animated.Value(0.85)).current;

  useEffect(() => {
    heroOpacity.setValue(0);
    heroY.setValue(22);
    xpPop.setValue(0.82);
    Animated.parallel([
      Animated.timing(heroOpacity, { toValue: 1, duration: 420, useNativeDriver: true, easing: Easing.out(Easing.cubic) }),
      Animated.spring(heroY, { toValue: 0, friction: 9, tension: 70, useNativeDriver: true }),
      Animated.spring(xpPop, { toValue: 1, friction: 6, tension: 120, useNativeDriver: true }),
    ]).start();
  }, [result.scenarioId, heroOpacity, heroY, xpPop]);

  useEffect(() => {
    setShowDetails(false);
  }, [result.scenarioId, result.stageType]);

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
    getDailyLeaderboard().then(setLeaderboard);
  }, [result, firstSessionMode]);

  const level = getLevelFromXp(totalXp);
  const motivation = getMotivationHero(result);
  const replayCta = buildStageReplayCta(result);
  const deltaLine = oneLineRunDelta(result);

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.scroll}>
      <Animated.View style={{ opacity: heroOpacity, transform: [{ translateY: heroY }], alignItems: 'center', width: '100%' }}>
        <View style={styles.motivationBlock}>
          <Text style={styles.motivationTitle}>{motivation.title}</Text>
          <Text style={styles.motivationSubtitle}>{motivation.subtitle}</Text>
          {!!deltaLine && <Text style={styles.deltaLine}>{deltaLine}</Text>}
        </View>

        <TouchableOpacity style={styles.replayHeroBtn} onPress={onGoScenarios} activeOpacity={0.9}>
          <Text style={styles.replayHeroBtnText}>{firstSessionMode ? 'Devam Et' : replayCta}</Text>
        </TouchableOpacity>

        {!firstSessionMode && (
          <TouchableOpacity style={styles.secondaryBtnTight} onPress={onBackHome}>
            <Text style={styles.secondaryText}>Ana Ekran</Text>
          </TouchableOpacity>
        )}

        <TouchableOpacity style={styles.detailsToggle} onPress={() => setShowDetails(s => !s)} activeOpacity={0.85}>
          <Text style={styles.detailsToggleText}>
            {showDetails ? 'Hide XP, stats & extras ↑' : 'Show XP, stats & extras ↓'}
          </Text>
        </TouchableOpacity>
      </Animated.View>

      {showDetails && (
        <>
          <View style={styles.scoreCard}>
            <Text style={styles.detailsSceneLabel}>{result.scenarioTitle}</Text>
            <Animated.Text style={[styles.scoreLabel, { transform: [{ scale: xpPop }] }]}>+{result.xpEarned} XP</Animated.Text>
            {result.comboMax != null && (
              <View style={styles.gameStatsRow}>
                <Text style={styles.gameStat}>🔥 Combo (max): {result.comboMax}</Text>
                {result.sceneAccuracy != null && (
                  <Text style={styles.gameStat}>🎯 Doğallık: %{Math.round(result.sceneAccuracy * 100)}</Text>
                )}
                {result.flowPath && (
                  <Text style={styles.gameStat}>
                    {result.flowPath === 'smooth' ? '✨ Smooth flow' : '⚡ You lost the flow'}
                  </Text>
                )}
                {(result.timedOutTurns ?? 0) > 0 && (
                  <Text style={styles.gameStatWarn}>⏱ {result.timedOutTurns} turda süre doldu</Text>
                )}
              </View>
            )}
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
            <Text style={styles.scoreMetaLight}>Toplam XP: {totalXp} · Level {level}</Text>
            <Text style={styles.scoreMetaLight}>🔥 Seri: {streak} gün</Text>
            <Text style={styles.rewardLineMuted}>{result.rewardLine ?? 'Bu sahneyi başarıyla tamamladın ✅'}</Text>
            <Text style={styles.celebrationMuted}>{getCelebrationByLevel(result.userLevel)}</Text>
            {!!result.nativePhraseHighlight && (
              <View style={styles.nativeHighlight}>
                <Text style={styles.nativeHighlightLabel}>ANA DİL SEVİYESİ İFADE</Text>
                <Text style={styles.nativeHighlightText}>"{result.nativePhraseHighlight}"</Text>
              </View>
            )}
            {!!result.naturalTip && <Text style={styles.tipText}>💬 İpucu: {result.naturalTip}</Text>}
          </View>

          {leaderboard.length > 0 && (
            <View style={styles.lbCard}>
              <Text style={styles.lbTitle}>🏅 Bugünün sıralaması</Text>
              <Text style={styles.lbSub}>Yerel skor tablosu — tekrar oyna, yüksel.</Text>
              {leaderboard.slice(0, 8).map(row => (
                <View key={row.id} style={[styles.lbRow, row.isSelf && styles.lbRowSelf]}>
                  <Text style={styles.lbRank}>#{row.rank}</Text>
                  <Text style={[styles.lbName, row.isSelf && styles.lbNameSelf]} numberOfLines={1}>
                    {row.name}{row.isSelf ? ' (sen)' : ''}
                  </Text>
                  <Text style={styles.lbScore}>{row.score}</Text>
                </View>
              ))}
            </View>
          )}

          {!!identityGoal && (
            <View style={styles.identityCard}>
              <Text style={styles.identityLabel}>HEDEFİNE DOĞRU</Text>
              <Text style={styles.identityTextLight}>"{identityGoal}"</Text>
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
        </>
      )}

    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F5F7FA' },
  scroll: { paddingTop: 56, paddingHorizontal: 24, paddingBottom: 40 },
  motivationBlock: {
    width: '100%',
    backgroundColor: '#0F172A',
    borderRadius: 18,
    padding: 22,
    borderWidth: 1,
    borderColor: '#1E293B',
    marginBottom: 16,
  },
  motivationTitle: {
    fontSize: 24,
    fontWeight: '900',
    color: '#F8FAFC',
    lineHeight: 30,
    marginBottom: 12,
    letterSpacing: 0.3,
  },
  motivationSubtitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#CBD5E1',
    lineHeight: 23,
  },
  deltaLine: {
    marginTop: 14,
    fontSize: 13,
    fontWeight: '800',
    color: '#FBBF24',
    lineHeight: 19,
  },
  replayHeroBtn: {
    width: '100%',
    backgroundColor: '#1B9C5A',
    borderRadius: 16,
    paddingVertical: 18,
    paddingHorizontal: 20,
    alignItems: 'center',
    marginBottom: 10,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 6,
  },
  replayHeroBtnText: { color: '#0F172A', fontSize: 16, fontWeight: '900', textAlign: 'center', lineHeight: 22 },
  secondaryBtnTight: { marginTop: 4, backgroundColor: '#FFFFFF', borderRadius: 14, padding: 14, alignItems: 'center', width: '100%' },
  detailsToggle: { marginTop: 14, marginBottom: 8, paddingVertical: 8, alignItems: 'center' },
  detailsToggleText: { fontSize: 13, fontWeight: '800', color: '#475569', textDecorationLine: 'underline' },
  detailsSceneLabel: { fontSize: 12, fontWeight: '800', color: '#64748B', marginBottom: 10 },
  scoreCard: { backgroundColor: '#FFFFFF', borderRadius: 16, padding: 16, borderWidth: 1, borderColor: '#E8EDF2', marginBottom: 12 },
  scoreLabel: { color: '#1B9C5A', fontSize: 24, fontWeight: '900', marginBottom: 10 },
  levelRow: { flexDirection: 'row', gap: 8, alignItems: 'center', marginBottom: 8 },
  levelBadge: { backgroundColor: '#E8EDF2', borderRadius: 8, paddingHorizontal: 10, paddingVertical: 4 },
  levelBadgeText: { color: '#1A2B3C', fontSize: 12, fontWeight: '800' },
  levelUpBadge: { backgroundColor: '#3DD68C22', borderRadius: 8, paddingHorizontal: 10, paddingVertical: 4, borderWidth: 1, borderColor: '#3DD68C' },
  levelUpText: { color: '#3DD68C', fontSize: 11, fontWeight: '900' },
  levelUpHint: { color: '#3DD68C', fontSize: 12, lineHeight: 18, marginBottom: 8 },
  scoreMetaLight: { color: '#64748B', fontSize: 13, marginTop: 4 },
  rewardLineMuted: { fontSize: 14, color: '#1B9C5A', textAlign: 'center', fontWeight: '800', marginTop: 10 },
  celebrationMuted: { fontSize: 12, color: '#94A3B8', textAlign: 'center', marginTop: 6, marginBottom: 4 },
  tipText: { color: '#9BD8FF', fontSize: 12, marginTop: 10, lineHeight: 18 },
  identityCard: { backgroundColor: '#120A1E', borderRadius: 14, borderWidth: 1, borderColor: '#2E1E42', padding: 14, marginBottom: 14 },
  identityLabel: { color: '#A78BFA', fontSize: 10, fontWeight: '900', letterSpacing: 1.5, marginBottom: 6 },
  identityTextLight: { color: '#E2E8F0', fontSize: 14, fontStyle: 'italic', lineHeight: 20 },
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
  gameStatsRow: { gap: 6, marginBottom: 10, marginTop: 4 },
  gameStat: { color: '#475569', fontSize: 13, fontWeight: '700' },
  gameStatWarn: { color: '#B45309', fontSize: 12, fontWeight: '700' },
  nativeHighlight: {
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginTop: 10,
  },
  nativeHighlightLabel: { fontSize: 10, fontWeight: '900', color: '#64748B', letterSpacing: 1, marginBottom: 6 },
  nativeHighlightText: { fontSize: 15, color: '#0F172A', fontWeight: '700', lineHeight: 22 },
  lbCard: {
    width: '100%',
    backgroundColor: '#0F172A',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#1E293B',
  },
  lbTitle: { color: '#F8FAFC', fontSize: 16, fontWeight: '900' },
  lbSub: { color: '#94A3B8', fontSize: 12, marginTop: 4, marginBottom: 12 },
  lbRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: '#1E293B' },
  lbRowSelf: { backgroundColor: '#1E293B', marginHorizontal: -8, paddingHorizontal: 8, borderRadius: 10, borderBottomWidth: 0 },
  lbRank: { width: 36, color: '#94A3B8', fontSize: 13, fontWeight: '800' },
  lbName: { flex: 1, color: '#E2E8F0', fontSize: 14, fontWeight: '700' },
  lbNameSelf: { color: '#4ADE80' },
  lbScore: { color: '#FBBF24', fontSize: 14, fontWeight: '900' },
  compareCard: {
    width: '100%',
    backgroundColor: '#0F172A',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#334155',
  },
  compareTitle: { fontSize: 11, fontWeight: '900', color: '#94A3B8', letterSpacing: 1.4, marginBottom: 10 },
  compareLine: { fontSize: 14, fontWeight: '800', color: '#E2E8F0', marginBottom: 6 },
  challengeLine: { fontSize: 14, fontWeight: '900', color: '#FBBF24', marginTop: 8, lineHeight: 20 },
  journeyFoot: { fontSize: 12, color: '#94A3B8', marginTop: 12, lineHeight: 18, fontStyle: 'italic' },
});
