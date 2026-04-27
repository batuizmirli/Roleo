import React, { useEffect, useState, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Animated, Easing, Share, Dimensions, Platform } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Feather from '@expo/vector-icons/Feather';
import { colors } from '../theme/colors';
import { typography } from '../theme/typography';

const { width: SW } = Dimensions.get('window');
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
  container: { flex: 1, backgroundColor: colors.bgDeep },
  scroll: { paddingTop: Platform.OS === 'ios' ? 60 : 40, paddingHorizontal: 22, paddingBottom: 56 },

  motivationBlock: {
    width: '100%',
    backgroundColor: colors.bgMid,
    borderRadius: 20,
    padding: 22,
    borderWidth: 1,
    borderColor: 'rgba(232,181,118,0.18)',
    marginBottom: 14,
    overflow: 'hidden',
  },
  identityTitleChip: {
    alignSelf: 'flex-start',
    backgroundColor: colors.bgSoft,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: colors.hairlineStrong,
    paddingHorizontal: 12,
    paddingVertical: 5,
    marginBottom: 10,
  },
  identityTitleChipText: {
    ...typography.eyebrow,
    fontSize: 10,
    color: colors.accentWarm,
  },
  identityDescriptor: {
    ...typography.bodyMedium,
    fontSize: 13,
    color: colors.inkSecondary,
    lineHeight: 20,
    marginBottom: 10,
  },
  motivationTitle: {
    fontFamily: 'Fraunces_300Light',
    fontSize: 26,
    color: colors.inkPrimary,
    lineHeight: 33,
    marginBottom: 10,
    letterSpacing: -0.3,
  },
  motivationSubtitle: {
    fontFamily: 'Fraunces_300Light_Italic',
    fontSize: 15,
    color: colors.inkSecondary,
    lineHeight: 23,
  },
  progressMeaning: {
    marginTop: 12,
    ...typography.body,
    fontSize: 12,
    color: colors.inkTertiary,
    lineHeight: 18,
  },
  deltaLine: {
    marginTop: 12,
    ...typography.bodyMedium,
    fontSize: 13,
    color: colors.accentWarm,
    lineHeight: 19,
  },
  identityEgoLine: {
    marginTop: 12,
    ...typography.bodyMedium,
    fontSize: 13,
    color: colors.accentWarm,
    lineHeight: 19,
  },
  identityEvolutionLine: {
    marginTop: 8,
    ...typography.body,
    fontSize: 12,
    color: colors.inkTertiary,
    lineHeight: 18,
  },
  educationCard: {
    width: '100%',
    backgroundColor: colors.bgMid,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.hairlineStrong,
    marginBottom: 12,
  },
  educationTitle: {
    ...typography.eyebrow,
    fontSize: 10,
    color: colors.accentWarmSoft,
    marginBottom: 14,
  },
  educationRow: {
    paddingBottom: 12,
    marginBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.hairline,
  },
  educationRowLast: { paddingBottom: 0, marginBottom: 0 },
  educationLabel: {
    ...typography.eyebrow,
    fontSize: 9,
    color: colors.inkTertiary,
    marginBottom: 5,
  },
  educationValue: {
    ...typography.body,
    fontSize: 13,
    color: colors.inkSecondary,
    lineHeight: 19,
  },
  replayHeroBtn: {
    width: '100%',
    backgroundColor: colors.inkPrimary,
    borderRadius: 999,
    paddingVertical: 16,
    paddingHorizontal: 20,
    alignItems: 'center',
    marginBottom: 10,
  },
  replayHeroBtnText: { ...typography.button, fontSize: 15, color: colors.bgDeep, textAlign: 'center' },
  shareHeroBtn: {
    width: '100%',
    backgroundColor: colors.bgMid,
    borderRadius: 999,
    paddingVertical: 13,
    paddingHorizontal: 18,
    alignItems: 'center',
    marginBottom: 10,
    borderWidth: 1,
    borderColor: colors.hairlineStrong,
  },
  shareHeroBtnText: { ...typography.bodyMedium, fontSize: 14, color: colors.inkSecondary },
  shareCardPreview: {
    width: '100%',
    backgroundColor: colors.bgSoft,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.hairline,
    padding: 14,
    gap: 4,
    marginBottom: 10,
  },
  shareCardIdentity: { ...typography.bodyMedium, fontSize: 14, color: colors.accentWarm },
  shareCardStat: { ...typography.bodyMedium, fontSize: 14, color: colors.inkPrimary },
  shareCardEmotion: { ...typography.body, fontSize: 13, color: colors.inkSecondary, lineHeight: 20 },
  shareCardChallenge: { ...typography.bodyMedium, fontSize: 13, color: colors.accentWarm, marginTop: 6 },
  secondaryBtnTight: { marginTop: 4, backgroundColor: colors.bgMid, borderRadius: 999, padding: 14, alignItems: 'center', width: '100%', borderWidth: 1, borderColor: colors.hairlineStrong },
  detailsToggle: { marginTop: 14, marginBottom: 8, paddingVertical: 8, alignItems: 'center' },
  detailsToggleText: { ...typography.body, fontSize: 13, color: colors.inkTertiary, textDecorationLine: 'underline' },
  detailsSceneLabel: { ...typography.eyebrow, fontSize: 9, color: colors.inkTertiary, marginBottom: 12 },
  scoreCard: { backgroundColor: colors.bgMid, borderRadius: 16, padding: 16, borderWidth: 1, borderColor: colors.hairlineStrong, marginBottom: 12 },
  challengeResultCard: {
    width: '100%',
    borderRadius: 16,
    padding: 14,
    marginBottom: 12,
    borderWidth: 1,
    backgroundColor: colors.bgMid,
    borderColor: colors.hairlineStrong,
  },
  challengeWon: { backgroundColor: `${colors.successDs}12`, borderColor: `${colors.successDs}40` },
  challengeLost: { backgroundColor: `${colors.errorDs}12`, borderColor: `${colors.errorDs}40` },
  challengeResultTitle: { ...typography.bodyMedium, fontSize: 16, color: colors.inkPrimary, marginBottom: 6 },
  challengeResultLine: { ...typography.body, fontSize: 13, color: colors.inkSecondary, lineHeight: 20 },
  challengeResultReplay: { ...typography.bodyMedium, fontSize: 13, color: colors.accentWarm, marginTop: 8 },
  scoreLabel: {
    fontFamily: 'Fraunces_300Light',
    fontSize: 28,
    color: colors.accentWarm,
    marginBottom: 10,
    letterSpacing: -0.5,
  },
  levelRow: { flexDirection: 'row', gap: 8, alignItems: 'center', marginBottom: 8 },
  levelBadge: { backgroundColor: colors.bgSoft, borderRadius: 8, paddingHorizontal: 10, paddingVertical: 4, borderWidth: 1, borderColor: colors.hairline },
  levelBadgeText: { ...typography.eyebrow, fontSize: 10, color: colors.inkSecondary },
  levelUpBadge: { backgroundColor: `${colors.successDs}18`, borderRadius: 8, paddingHorizontal: 10, paddingVertical: 4, borderWidth: 1, borderColor: `${colors.successDs}44` },
  levelUpText: { ...typography.eyebrow, fontSize: 9, color: colors.successDs },
  levelUpHint: { ...typography.body, fontSize: 12, color: colors.successDs, lineHeight: 18, marginBottom: 8 },
  scoreMetaLight: { ...typography.body, fontSize: 12, color: colors.inkTertiary, marginTop: 4 },
  rewardLineMuted: { ...typography.bodyMedium, fontSize: 13, color: colors.successDs, textAlign: 'center', marginTop: 10 },
  celebrationMuted: { ...typography.body, fontSize: 12, color: colors.inkTertiary, textAlign: 'center', marginTop: 6, marginBottom: 4 },
  tipText: { ...typography.body, fontSize: 12, color: colors.inkSecondary, marginTop: 10, lineHeight: 18 },
  identityCard: { backgroundColor: colors.bgMid, borderRadius: 14, borderWidth: 1, borderColor: colors.hairlineStrong, padding: 14, marginBottom: 14 },
  identityLabel: { ...typography.eyebrow, fontSize: 9, color: colors.accentWarmSoft, marginBottom: 6 },
  identityTextLight: { fontFamily: 'Fraunces_300Light_Italic', fontSize: 14, color: colors.inkPrimary, lineHeight: 20 },
  identityHint: { ...typography.body, fontSize: 12, color: colors.inkTertiary, marginTop: 6 },
  unlockCard: { backgroundColor: `${colors.successDs}10`, borderRadius: 14, borderWidth: 1, borderColor: `${colors.successDs}30`, padding: 12, marginBottom: 12 },
  unlockTitle: { ...typography.eyebrow, fontSize: 10, color: colors.successDs, marginBottom: 4 },
  unlockText: { ...typography.bodyMedium, fontSize: 13, color: colors.inkSecondary, marginTop: 4 },
  nextCard: { backgroundColor: colors.bgMid, borderRadius: 14, borderWidth: 1, borderColor: colors.hairline, padding: 14, marginBottom: 14 },
  nextTitle: { ...typography.eyebrow, fontSize: 9, color: colors.inkTertiary, marginBottom: 6 },
  nextText: {
    fontFamily: 'Fraunces_300Light',
    fontSize: 18,
    color: colors.inkPrimary,
    letterSpacing: -0.2,
    marginTop: 2,
  },
  nextGoal: { ...typography.body, fontSize: 11, color: colors.inkTertiary, marginTop: 6 },
  sectionTitle: { ...typography.eyebrow, fontSize: 10, color: colors.inkTertiary, marginBottom: 10, marginTop: 4 },
  sideBtn: { backgroundColor: colors.bgMid, borderRadius: 14, padding: 14, borderWidth: 1, borderColor: colors.hairline, marginBottom: 8 },
  sideTitle: { ...typography.bodyMedium, fontSize: 13, color: colors.inkPrimary },
  sideDesc: { ...typography.body, fontSize: 11, color: colors.inkTertiary, marginTop: 3 },
  primaryBtn: { marginTop: 8, backgroundColor: colors.inkPrimary, borderRadius: 999, padding: 16, alignItems: 'center' },
  primaryText: { ...typography.button, fontSize: 15, color: colors.bgDeep },
  secondaryBtn: { marginTop: 10, backgroundColor: colors.bgMid, borderRadius: 999, padding: 14, alignItems: 'center', borderWidth: 1, borderColor: colors.hairlineStrong },
  secondaryText: { ...typography.body, fontSize: 14, color: colors.inkSecondary },
  gameStatsRow: { gap: 6, marginBottom: 10, marginTop: 4 },
  gameStat: { ...typography.body, fontSize: 13, color: colors.inkSecondary },
  gameStatWarn: { ...typography.body, fontSize: 12, color: colors.errorDs },
  nativeHighlight: {
    backgroundColor: colors.bgSoft,
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: 'rgba(232,181,118,0.18)',
    marginTop: 10,
  },
  nativeHighlightLabel: { ...typography.eyebrow, fontSize: 9, color: colors.inkTertiary, marginBottom: 6 },
  nativeHighlightText: { fontFamily: 'Fraunces_300Light_Italic', fontSize: 15, color: colors.inkPrimary, lineHeight: 22 },
  lbCard: {
    width: '100%',
    backgroundColor: colors.bgMid,
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: colors.hairlineStrong,
  },
  lbTitle: { ...typography.bodyMedium, fontSize: 14, color: colors.inkPrimary, marginBottom: 4 },
  lbSub: { ...typography.body, fontSize: 11, color: colors.inkTertiary, marginTop: 2, marginBottom: 12 },
  lbRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: colors.hairline },
  lbRowSelf: { backgroundColor: colors.bgSoft, marginHorizontal: -8, paddingHorizontal: 8, borderRadius: 10, borderBottomWidth: 0 },
  lbRank: { width: 36, ...typography.body, fontSize: 12, color: colors.inkTertiary },
  lbName: { flex: 1, ...typography.bodyMedium, fontSize: 13, color: colors.inkPrimary },
  lbNameSelf: { color: colors.accentWarm },
  lbScore: { ...typography.bodyMedium, fontSize: 13, color: colors.accentWarm },
  compareCard: {
    width: '100%',
    backgroundColor: colors.bgMid,
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: colors.hairlineStrong,
  },
  compareTitle: { ...typography.eyebrow, fontSize: 10, color: colors.inkTertiary, marginBottom: 10 },
  compareLine: { ...typography.bodyMedium, fontSize: 14, color: colors.inkPrimary, marginBottom: 6 },
  challengeLine: { ...typography.bodyMedium, fontSize: 14, color: colors.accentWarm, marginTop: 8, lineHeight: 20 },
  journeyFoot: { ...typography.body, fontSize: 12, color: colors.inkTertiary, marginTop: 12, lineHeight: 18, fontStyle: 'italic' },
});
