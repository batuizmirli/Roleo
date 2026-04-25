import React, { useEffect, useState, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Animated, Easing, Share } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { StageResult, UserProfile } from '../types';
import { getDailyLeaderboard, LeaderboardEntry } from '../services/leaderboard';
import { completeStage, getLevelFromXp } from '../services/progress';
import { getCelebrationByLevel } from '../services/personas';
import { trackEvent } from '../services/telemetry';
import { tryParseJson } from '../services/json';
import { getMotivationHero, buildStageReplayCta, oneLineRunDelta, resolvePlayerIdentity, PlayerIdentitySnapshot } from '../services/runHook';
import { buildChallengeLink, buildResultEmotionalLine } from '../services/challengeShare';

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
  const [playerIdentity, setPlayerIdentity] = useState<PlayerIdentitySnapshot | null>(null);
  const [displayName, setDisplayName] = useState('Player');
  const [sharing, setSharing] = useState(false);
  const [leaderboard, setLeaderboard] = useState<(LeaderboardEntry & { rank: number })[]>([]);
  const [showDetails, setShowDetails] = useState(false);
  const [memoryFocus, setMemoryFocus] = useState<string | null>(null);
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
      const prevXp = summary.progress.xp - summary.appliedXp;
      const prevLevel = getLevelFromXp(prevXp < 0 ? 0 : prevXp);
      const newLevel = getLevelFromXp(summary.progress.xp);
      setLeveledUp(newLevel > prevLevel);
      setStreak(summary.progress.streak);
      setTotalXp(summary.progress.xp);
      setNextGoal(summary.unlockState.nextGoal);
      setNewlyUnlocked(summary.newlyUnlocked);
      setMemoryFocus(summary.progress.learningMemory?.nextRecommendedFocus ?? null);
    });
    AsyncStorage.getItem('userProfile').then(raw => {
      const profile = raw ? tryParseJson<UserProfile>(raw) : null;
      const goal = profile?.identity?.goal ?? profile?.goalDescription ?? null;
      setIdentityGoal(goal);
      setDisplayName(profile?.displayName?.trim() || 'Player');
    });
    getDailyLeaderboard().then(setLeaderboard);
    resolvePlayerIdentity(result).then(setPlayerIdentity).catch(() => setPlayerIdentity(null));
  }, [result, firstSessionMode]);

  const level = getLevelFromXp(totalXp);
  const motivation = getMotivationHero(result);
  const replayCta = buildStageReplayCta(result);
  const deltaLine = oneLineRunDelta(result);
  const challengeTaunts = ['Can you beat me?', 'Try this without getting awkward.', 'Your turn. Beat this run.'];
  const chosenTaunt = challengeTaunts[(result.comboMax ?? 0) % challengeTaunts.length];
  const identityLabel = `${playerIdentity?.label ?? 'Flow Keeper'} 🔥`;
  const emotionalLine = buildResultEmotionalLine(result);
  const keyStat = result.comboMax != null
    ? `Combo ${result.comboMax} · ${Math.round((result.sceneAccuracy ?? 0) * 100)}% accuracy`
    : `${Math.round((result.sceneAccuracy ?? 0) * 100)}% accuracy`;
  const bestReplyLine =
    result.learningSummary?.bestReply
    ?? result.turnReviews?.find(t => t.quality === 'good')?.selectedText
    ?? result.nativePhraseHighlight
    ?? (result.sceneAccuracy != null && result.sceneAccuracy >= 0.75 ? 'Sahneyi net cevaplarla taşıdın.' : 'Sahnede birkaç sağlam cevap buldun.');
  const awkwardTurn = result.turnReviews?.find(t => t.quality === 'awkward');
  const awkwardMomentLine =
    result.learningSummary?.awkwardMoment
    ?? awkwardTurn?.selectedText
    ?? ((result.awkwardTurns ?? 0) > 0 ? `${result.awkwardTurns} garip cevap sahneyi zorlaştırdı.` : 'Büyük kopuş yok; bir cevap hâlâ temizlenebilir.');
  const betterAlternativeLine =
    result.learningSummary?.betterAlternative
    ?? (awkwardTurn?.goodOption && awkwardTurn.goodOption !== awkwardTurn.selectedText ? awkwardTurn.goodOption : undefined)
    ?? 'Sahne baskı kurduğunda daha yumuşak ve net cevap seç.';
  const nextFocusLine =
    memoryFocus
    ?? result.learningSummary?.nextFocus
    ?? ((result.timedOutTurns ?? 0) > 0
      ? `Answer one beat earlier; the clock hit you ${result.timedOutTurns} turn(s).`
      : (result.naturalTip
        ?? ((result.flowPath ?? 'smooth') === 'friction'
          ? 'Protect flow for 2 more turns before taking risks.'
          : 'Push one extra clean turn while protecting your combo.')));

  const shareTarget = {
    id: `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`,
    scenarioId: result.scenarioId,
    challengerName: displayName,
    challengerTitle: playerIdentity?.label ?? 'Flow Keeper',
    challengerCombo: result.comboMax ?? 0,
    challengerAccuracy: result.sceneAccuracy ?? 0,
    challengerFlow: result.flowPath,
    challengerAwkward: result.awkwardTurns,
    taunt: chosenTaunt,
  } as const;
  const challengeUrl = buildChallengeLink(shareTarget);

  const shareCardText = [
    '┌────────────────────────────┐',
    `│ ${identityLabel.padEnd(26, ' ')}│`,
    `│ ${keyStat.padEnd(26, ' ')}│`,
    `│ ${emotionalLine.padEnd(26, ' ')}│`,
    '└────────────────────────────┘',
  ].join('\n');

  const onShareRun = async () => {
    if (sharing) return;
    setSharing(true);
    try {
      await Share.share({
        message: `${shareCardText}\n\n${chosenTaunt}\n${challengeUrl}`,
      });
      await trackEvent('friend_challenge_shared', { scenarioId: result.scenarioId, taunt: chosenTaunt });
    } finally {
      setSharing(false);
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.scroll}>
      <Animated.View style={{ opacity: heroOpacity, transform: [{ translateY: heroY }], alignItems: 'center', width: '100%' }}>
        <View style={styles.motivationBlock}>
          {!!playerIdentity && (
            <View style={styles.identityTitleChip}>
              <Text style={styles.identityTitleChipText}>{playerIdentity.label}</Text>
            </View>
          )}
          {!!playerIdentity && <Text style={styles.identityDescriptor}>{playerIdentity.descriptor}</Text>}
          <Text style={styles.motivationTitle}>{motivation.title}</Text>
          <Text style={styles.motivationSubtitle}>{motivation.subtitle}</Text>
          <Text style={styles.progressMeaning}>Progress = gerçek ana daha hazır cevaplar + temiz akış + daha güçlü tekrar.</Text>
          {!!deltaLine && <Text style={styles.deltaLine}>{deltaLine}</Text>}
          {!!playerIdentity && <Text style={styles.identityEgoLine}>{playerIdentity.egoLine}</Text>}
          {!!playerIdentity && <Text style={styles.identityEvolutionLine}>{playerIdentity.evolutionLine}</Text>}
        </View>
        <View style={styles.educationCard}>
          <Text style={styles.educationTitle}>Sahne koçu</Text>
          <View style={styles.educationRow}>
            <Text style={styles.educationLabel}>En temiz sahne cevabı</Text>
            <Text style={styles.educationValue}>{bestReplyLine}</Text>
          </View>
          <View style={styles.educationRow}>
            <Text style={styles.educationLabel}>Garip kalan an</Text>
            <Text style={styles.educationValue}>{awkwardMomentLine}</Text>
          </View>
          <View style={styles.educationRow}>
            <Text style={styles.educationLabel}>Bir dahaki provada bunu dene</Text>
            <Text style={styles.educationValue}>{betterAlternativeLine}</Text>
          </View>
          <View style={styles.educationRowLast}>
            <Text style={styles.educationLabel}>Sonraki odak</Text>
            <Text style={styles.educationValue}>{nextFocusLine}</Text>
          </View>
        </View>

        <TouchableOpacity style={styles.replayHeroBtn} onPress={onGoScenarios} activeOpacity={0.9}>
          <Text style={styles.replayHeroBtnText}>{firstSessionMode ? 'Devam et ve düzelt' : `Aynı sahneyi düzelt · ${replayCta}`}</Text>
        </TouchableOpacity>
        {!firstSessionMode && (
          <TouchableOpacity style={styles.shareHeroBtn} onPress={onShareRun} activeOpacity={0.9}>
            <Text style={styles.shareHeroBtnText}>{sharing ? 'Preparing share...' : 'Share this scene run'}</Text>
          </TouchableOpacity>
        )}
        {!firstSessionMode && (
          <View style={styles.shareCardPreview}>
            <Text style={styles.shareCardIdentity}>{identityLabel}</Text>
            <Text style={styles.shareCardStat}>{keyStat}</Text>
            <Text style={styles.shareCardEmotion}>{emotionalLine}</Text>
            <Text style={styles.shareCardChallenge}>{chosenTaunt}</Text>
          </View>
        )}
        {!!result.challengeTarget && !!result.challengeOutcome && (
          <View style={[styles.challengeResultCard, result.challengeOutcome.won ? styles.challengeWon : styles.challengeLost]}>
            <Text style={styles.challengeResultTitle}>{result.challengeOutcome.summary}</Text>
            <Text style={styles.challengeResultLine}>{result.challengeOutcome.diffLine}</Text>
            <Text style={styles.challengeResultReplay}>{result.challengeOutcome.replayLine}</Text>
          </View>
        )}

        {!firstSessionMode && (
          <TouchableOpacity style={styles.secondaryBtnTight} onPress={onBackHome}>
            <Text style={styles.secondaryText}>Ana Ekran</Text>
          </TouchableOpacity>
        )}

        <TouchableOpacity style={styles.detailsToggle} onPress={() => setShowDetails(s => !s)} activeOpacity={0.85}>
          <Text style={styles.detailsToggleText}>
            {showDetails ? 'Hide XP, stats & replay notes ↑' : 'Show XP, stats & replay notes ↓'}
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
                    {result.flowPath === 'smooth' ? '✨ Temiz sahne akışı' : '⚡ Akış pürüzlü'}
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
                  ? 'Artık intermediate seviyesindesin. Sahnelerde daha az destek, daha çok gerçek cevap seçimi göreceksin.'
                  : 'Artık advanced seviyesindesin. Sahnelerde daha nüanslı cevap seçenekleri göreceksin.'}
              </Text>
            )}
            <Text style={styles.scoreMetaLight}>Toplam XP: {totalXp} · Level {level}</Text>
            <Text style={styles.scoreMetaLight}>🔥 Seri: {streak} gün</Text>
            <Text style={styles.rewardLineMuted}>{result.rewardLine ?? 'Bu sahneyi başarıyla tamamladın ✅'}</Text>
            <Text style={styles.celebrationMuted}>{getCelebrationByLevel(result.userLevel)}</Text>
            {!!result.nativePhraseHighlight && (
              <View style={styles.nativeHighlight}>
                <Text style={styles.nativeHighlightLabel}>SAHNEDE İŞE YARAYAN İFADE</Text>
                <Text style={styles.nativeHighlightText}>"{result.nativePhraseHighlight}"</Text>
              </View>
            )}
            {!!result.naturalTip && <Text style={styles.tipText}>💬 İpucu: {result.naturalTip}</Text>}
          </View>

          {leaderboard.length > 0 && (
            <View style={styles.lbCard}>
              <Text style={styles.lbTitle}>🏅 Bugünün sıralaması</Text>
              <Text style={styles.lbSub}>Yerel skor tablosu — aynı sahneyi tekrar prova et, yüksel.</Text>
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
              <Text style={styles.identityHint}>Bu prova, o gerçek konuşma anına bir adım daha hazırladı.</Text>
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
              <Text style={styles.sectionTitle}>İstersen derinleş</Text>
              <TouchableOpacity style={styles.sideBtn} onPress={onOpenVocab}>
                <Text style={styles.sideTitle}>Sahne kelimeleri</Text>
                <Text style={styles.sideDesc}>Aynı sahne için kritik kelime kartları</Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.sideBtn} onPress={onOpenGrammar}>
                <Text style={styles.sideTitle}>Sahne koçu</Text>
                <Text style={styles.sideDesc}>Garip kalan cevaplardan kısa düzeltme</Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.sideBtn} onPress={onOpenQuiz}>
                <Text style={styles.sideTitle}>Hızlı tekrar</Text>
                <Text style={styles.sideDesc}>Sahnedeki cevapları hızlı pekiştir</Text>
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
  identityTitleChip: {
    alignSelf: 'flex-start',
    backgroundColor: '#1E293B',
    borderRadius: 999,
    borderWidth: 1,
    borderColor: '#334155',
    paddingHorizontal: 12,
    paddingVertical: 6,
    marginBottom: 10,
  },
  identityTitleChipText: {
    fontSize: 12,
    fontWeight: '900',
    color: '#38BDF8',
    letterSpacing: 0.8,
  },
  identityDescriptor: {
    fontSize: 13,
    fontWeight: '700',
    color: '#E2E8F0',
    lineHeight: 20,
    marginBottom: 10,
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
  progressMeaning: {
    marginTop: 12,
    fontSize: 12,
    fontWeight: '700',
    color: '#94A3B8',
    lineHeight: 18,
  },
  deltaLine: {
    marginTop: 14,
    fontSize: 13,
    fontWeight: '800',
    color: '#FBBF24',
    lineHeight: 19,
  },
  identityEgoLine: {
    marginTop: 12,
    fontSize: 13,
    fontWeight: '900',
    color: '#FBBF24',
    lineHeight: 19,
  },
  identityEvolutionLine: {
    marginTop: 8,
    fontSize: 12,
    fontWeight: '700',
    color: '#94A3B8',
    lineHeight: 18,
  },
  educationCard: {
    width: '100%',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 12,
  },
  educationTitle: {
    fontSize: 13,
    fontWeight: '900',
    color: '#0F172A',
    marginBottom: 10,
    letterSpacing: 0.3,
  },
  educationRow: {
    paddingBottom: 10,
    marginBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#EEF2F7',
  },
  educationRowLast: {
    paddingBottom: 0,
    marginBottom: 0,
  },
  educationLabel: {
    fontSize: 11,
    fontWeight: '800',
    color: '#64748B',
    marginBottom: 4,
  },
  educationValue: {
    fontSize: 13,
    fontWeight: '700',
    color: '#334155',
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
  shareHeroBtn: {
    width: '100%',
    backgroundColor: '#E2E8F0',
    borderRadius: 14,
    paddingVertical: 12,
    paddingHorizontal: 18,
    alignItems: 'center',
    marginBottom: 10,
  },
  shareHeroBtnText: { color: '#334155', fontSize: 14, fontWeight: '800' },
  shareCardPreview: {
    width: '100%',
    backgroundColor: '#111827',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#1F2937',
    padding: 14,
    gap: 4,
    marginBottom: 10,
  },
  shareCardIdentity: { color: '#38BDF8', fontSize: 14, fontWeight: '900' },
  shareCardStat: { color: '#F8FAFC', fontSize: 14, fontWeight: '800' },
  shareCardEmotion: { color: '#CBD5E1', fontSize: 13, fontWeight: '700', lineHeight: 20 },
  shareCardChallenge: { color: '#FBBF24', fontSize: 13, fontWeight: '900', marginTop: 6 },
  secondaryBtnTight: { marginTop: 4, backgroundColor: '#FFFFFF', borderRadius: 14, padding: 14, alignItems: 'center', width: '100%' },
  detailsToggle: { marginTop: 14, marginBottom: 8, paddingVertical: 8, alignItems: 'center' },
  detailsToggleText: { fontSize: 13, fontWeight: '800', color: '#475569', textDecorationLine: 'underline' },
  detailsSceneLabel: { fontSize: 12, fontWeight: '800', color: '#64748B', marginBottom: 10 },
  scoreCard: { backgroundColor: '#FFFFFF', borderRadius: 16, padding: 16, borderWidth: 1, borderColor: '#E8EDF2', marginBottom: 12 },
  challengeResultCard: {
    width: '100%',
    borderRadius: 16,
    padding: 14,
    marginBottom: 12,
    borderWidth: 1,
  },
  challengeWon: {
    backgroundColor: '#052E1D',
    borderColor: '#065F46',
  },
  challengeLost: {
    backgroundColor: '#3F1D1D',
    borderColor: '#7F1D1D',
  },
  challengeResultTitle: { color: '#F8FAFC', fontSize: 16, fontWeight: '900', marginBottom: 6 },
  challengeResultLine: { color: '#E2E8F0', fontSize: 13, fontWeight: '700', lineHeight: 20 },
  challengeResultReplay: { color: '#FBBF24', fontSize: 13, fontWeight: '900', marginTop: 8 },
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
  sectionTitle: { color: '#64748B', fontSize: 14, fontWeight: '800', marginBottom: 8 },
  sideBtn: { backgroundColor: '#FFFFFFAA', borderRadius: 12, padding: 12, borderWidth: 1, borderColor: '#E8EDF2', marginBottom: 8 },
  sideTitle: { color: '#334155', fontSize: 13, fontWeight: '800' },
  sideDesc: { color: '#9AABB8', fontSize: 11, marginTop: 3 },
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
