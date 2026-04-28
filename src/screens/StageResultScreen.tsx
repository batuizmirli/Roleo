import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  Animated,
  Easing,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Feather from '@expo/vector-icons/Feather';
import { colors } from '../theme/colors';
import { typography } from '../theme/typography';
import { StageResult, UserProfile } from '../types';
import type { SceneSession } from '../types';
import { completeStage, getLevelFromXp, type ProgressionUnlock } from '../services/progress';
import { saveSceneSession } from '../services/sessionMemory';
import { trackEvent } from '../services/telemetry';
import { tryParseJson } from '../services/json';
import { scenarios } from '../data/scenarios';

type Props = {
  result: StageResult;
  onBackHome: () => void;
  onGoScenarios: () => void;
  onOpenVocab: () => void;
  onOpenGrammar: () => void;
  onOpenQuiz: () => void;
  firstSessionMode?: boolean;
};

type ResultFeedback = {
  bestLine: string;
  awkwardMoment: string;
  betterAlternative?: string;
  nextFocus: string;
};

const stageLabel: Record<StageResult['stageType'], string> = {
  cafe: 'kafe',
  travel: 'yolculuk',
  business: 'iş',
  social: 'sosyal',
  story: 'hikaye',
  survival: 'hayatta kalma',
};

const difficultyMap: Record<string, SceneSession['difficulty']> = {
  advanced: 'advanced',
  intermediate: 'intermediate',
  beginner: 'beginner',
  fluent: 'advanced',
};

const pickReplayTwist = (result: StageResult): string | null => {
  const scenario = scenarios.find(s => s.id === result.scenarioId);
  const twists = scenario?.replayTwists?.filter(Boolean) ?? [];
  if (twists.length === 0) return null;
  const seed = (result.comboMax ?? 0) + (result.awkwardTurns ?? 0) + result.userMessageCount;
  return twists[seed % twists.length];
};

const buildFeedback = (result: StageResult): ResultFeedback => {
  const goodTurn = result.turnReviews?.find(t => t.quality === 'good');
  const awkwardTurn = result.turnReviews?.find(t => t.quality === 'awkward');
  const okTurn = result.turnReviews?.find(t => t.quality === 'ok');

  const bestLine =
    result.learningSummary?.bestReply?.trim()
    || goodTurn?.selectedText?.trim()
    || okTurn?.selectedText?.trim()
    || result.nativePhraseHighlight?.trim()
    || 'Sahnede konuşmayı devam ettirecek net bir cevap verdin.';

  const awkwardMoment =
    result.learningSummary?.awkwardMoment?.trim()
    || awkwardTurn?.selectedText?.trim()
    || ((result.awkwardTurns ?? 0) > 0
      ? `${result.awkwardTurns} cevapta sahnenin tonu biraz zorlandı.`
      : 'Büyük bir kopuş yok; sadece bir sonraki provada daha doğal akış hedefle.');

  const betterAlternative =
    result.learningSummary?.betterAlternative?.trim()
    || (awkwardTurn?.goodOption && awkwardTurn.goodOption !== awkwardTurn.selectedText
      ? awkwardTurn.goodOption.trim()
      : undefined);

  const nextFocus =
    result.learningSummary?.nextFocus?.trim()
    || result.naturalTip?.trim()
    || ((result.timedOutTurns ?? 0) > 0
      ? 'Cevabı bir nefes daha erken seç; zaman baskısı sahneyi bölmesin.'
      : (result.flowPath === 'friction'
        ? 'Önce akışı koru, sonra daha iddialı cevaplara geç.'
        : 'Bir sonraki provada aynı doğallığı bir tur daha ileri taşı.'));

  return { bestLine, awkwardMoment, betterAlternative, nextFocus };
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
  const [newUnlocks, setNewUnlocks] = useState<ProgressionUnlock[]>([]);
  const [saved, setSaved] = useState(false);
  const [showTools, setShowTools] = useState(false);
  const entrance = useRef(new Animated.Value(0)).current;

  const feedback = useMemo(() => buildFeedback(result), [result]);
  const replayTwist = useMemo(() => pickReplayTwist(result), [result]);
  const clearVoiceAttempt = useMemo(() => result.voiceAttempts?.find(attempt => attempt.meaningClear) ?? null, [result.voiceAttempts]);
  const retryVoiceAttempt = useMemo(() => result.voiceAttempts?.find(attempt => !attempt.meaningClear) ?? null, [result.voiceAttempts]);
  const accuracy = Math.round((result.sceneAccuracy ?? 0) * 100);
  const stageName = stageLabel[result.stageType] ?? 'sahne';
  const level = getLevelFromXp(totalXp);
  const visibleReplayTwist = level >= 3 ? replayTwist : null;

  useEffect(() => {
    entrance.setValue(0);
    Animated.timing(entrance, {
      toValue: 1,
      duration: 520,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start();
  }, [entrance, result.resultId, result.scenarioId]);

  useEffect(() => {
    let cancelled = false;

    const persistResult = async () => {
      await trackEvent('result_seen', {
        scenarioId: result.scenarioId,
        stageType: result.stageType,
        xpEarned: result.xpEarned,
        accuracy: result.sceneAccuracy,
        hasBestLine: !!feedback.bestLine,
        hasAwkwardMoment: !!feedback.awkwardMoment,
        hasNextFocus: !!feedback.nextFocus,
        firstSessionMode,
      });

      const summary = await completeStage({
        ...result,
        learningSummary: {
          bestReply: feedback.bestLine,
          awkwardMoment: feedback.awkwardMoment,
          betterAlternative: feedback.betterAlternative,
          nextFocus: feedback.nextFocus,
        },
      });
      if (!cancelled) {
        setStreak(summary.progress.streak);
        setTotalXp(summary.progress.xp);
        setNextGoal(summary.unlockState.nextGoal);
        setNewUnlocks(summary.newlyUnlockedFeatures);
      }

      const raw = await AsyncStorage.getItem('userProfile');
      const profile = raw ? tryParseJson<UserProfile>(raw) : null;
      const completedLevel = getLevelFromXp(summary.progress.xp);
      const savedReplayTwist = completedLevel >= 3 ? replayTwist : null;
      const session: SceneSession = {
        sessionId: result.resultId ?? `${result.scenarioId}-${Date.now().toString(36)}`,
        timestamp: new Date().toISOString(),
        source: 'stage_result',
        scenarioId: result.scenarioId,
        scenarioTitle: result.scenarioTitle,
        stageType: result.stageType,
        language: profile?.language?.code ?? 'unknown',
        npcPersona: result.personaName ?? '',
        difficulty: difficultyMap[result.userLevel] ?? 'beginner',
        userGoal: profile?.goalDescription ?? undefined,
        identityGoal: profile?.identity?.goal ?? undefined,
        selectedChoices: (result.turnReviews ?? []).map((turn, index) => ({
          turn: index + 1,
          npcMessage: turn.npcMessage,
          selectedText: turn.selectedText,
          quality: turn.quality,
          goodOption: turn.goodOption ?? turn.selectedText,
        })),
        score: {
          accuracy: result.sceneAccuracy ?? 0,
          comboMax: result.comboMax ?? 0,
          xpEarned: result.xpEarned,
          flowPath: result.flowPath ?? 'smooth',
          goodTurns: result.goodTurns ?? 0,
          awkwardTurns: result.awkwardTurns ?? 0,
          timedOutTurns: result.timedOutTurns ?? 0,
        },
        bestLine: feedback.bestLine,
        awkwardMoment: feedback.awkwardMoment,
        betterAlternative: feedback.betterAlternative,
        nextFocus: feedback.nextFocus,
        dramaticBeat: savedReplayTwist ? `Tekrar provada twist: ${savedReplayTwist}` : `Bugünkü ${stageName} provası tamamlandı`,
        voiceAttempts: result.voiceAttempts,
      };
      await saveSceneSession(session);
      if (!cancelled) setSaved(true);
    };

    void persistResult();
    return () => {
      cancelled = true;
    };
  }, [feedback, firstSessionMode, replayTwist, result, stageName]);

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
      <View style={styles.glowWarm} pointerEvents="none" />
      <View style={styles.glowCool} pointerEvents="none" />

      <Animated.View
        style={[
          styles.content,
          {
            opacity: entrance,
            transform: [{ translateY: entrance.interpolate({ inputRange: [0, 1], outputRange: [18, 0] }) }],
          },
        ]}
      >
        <View style={styles.heroCard}>
          <Text style={styles.eyebrow}>SAHNE SONUCU</Text>
          <Text style={styles.title}>Sahne{'\n'}<Text style={styles.titleAccent}>tamamlandı</Text></Text>
          <Text style={styles.subtitle}>
            {result.scenarioTitle} provasında konuşmanın akışı, tek bir sonraki odakla kaydedildi.
          </Text>

          <View style={styles.sceneMetaRow}>
            <View style={styles.sceneMetaPill}>
              <Feather name="message-circle" size={13} color={colors.accentWarm} />
              <Text style={styles.sceneMetaText}>{result.userMessageCount} tur</Text>
            </View>
            <View style={styles.sceneMetaPillMuted}>
              <Text style={styles.sceneMetaMutedText}>+{result.xpEarned} XP</Text>
            </View>
            {result.sceneAccuracy != null ? (
              <View style={styles.sceneMetaPillMuted}>
                <Text style={styles.sceneMetaMutedText}>%{accuracy} doğallık</Text>
              </View>
            ) : null}
          </View>
        </View>

        <View style={styles.feedbackCard}>
          <Text style={styles.cardEyebrow}>EN İYİ CÜMLE</Text>
          <Text style={styles.bestLine}>"{feedback.bestLine}"</Text>
        </View>

        <View style={styles.feedbackCard}>
          <Text style={styles.cardEyebrow}>ZORLANAN AN</Text>
          <Text style={styles.cardBodyText}>{feedback.awkwardMoment}</Text>
          {feedback.betterAlternative ? (
            <View style={styles.alternativeBox}>
              <Text style={styles.alternativeLabel}>Şöyle de denenebilir</Text>
              <Text style={styles.alternativeText}>"{feedback.betterAlternative}"</Text>
            </View>
          ) : null}
        </View>

        <View style={styles.focusCard}>
          <Text style={styles.cardEyebrow}>BUGÜNKÜ ODAK</Text>
          <Text style={styles.focusText}>{feedback.nextFocus}</Text>
          <View style={styles.savedRow}>
            <Feather name={saved ? 'check-circle' : 'circle'} size={14} color={saved ? colors.successDs : colors.inkTertiary} />
            <Text style={styles.savedText}>{saved ? 'Provayı kaydet' : 'Prova kaydı hazırlanıyor'}</Text>
          </View>
        </View>

        {visibleReplayTwist ? (
          <View style={styles.twistCard}>
            <Text style={styles.cardEyebrow}>BİR SONRAKİ PROVA</Text>
            <Text style={styles.twistText}>{visibleReplayTwist}</Text>
          </View>
        ) : null}

        {result.voiceAttempts?.length ? (
          <View style={styles.voiceCard}>
            <Text style={styles.cardEyebrow}>SESLİ PROVA</Text>
            {clearVoiceAttempt ? (
              <>
                <Text style={styles.voiceLabel}>Net söylediğin ifade</Text>
                <Text style={styles.voiceLine}>"{clearVoiceAttempt.targetText}"</Text>
              </>
            ) : null}
            {retryVoiceAttempt ? (
              <>
                <Text style={styles.voiceLabel}>Tekrar çalışılacak ifade</Text>
                <Text style={styles.voiceLine}>"{retryVoiceAttempt.targetText}"</Text>
              </>
            ) : null}
            <Text style={styles.voiceFeedback}>
              {(clearVoiceAttempt ?? retryVoiceAttempt)?.feedback ?? 'Sesli prova kaydedildi.'}
            </Text>
          </View>
        ) : null}

        {newUnlocks.length > 0 ? (
          <View style={styles.unlockNotice}>
            <Text style={styles.cardEyebrow}>YENİ AÇILDI</Text>
            {newUnlocks.map(unlock => (
              <View key={unlock.id} style={styles.unlockNoticeRow}>
                <Feather name="unlock" size={14} color={colors.accentWarm} />
                <View style={{ flex: 1 }}>
                  <Text style={styles.unlockNoticeTitle}>{unlock.title}</Text>
                  <Text style={styles.unlockNoticeDesc}>{unlock.description}</Text>
                </View>
              </View>
            ))}
          </View>
        ) : null}

        <TouchableOpacity style={styles.primaryBtn} onPress={onGoScenarios} activeOpacity={0.9}>
          <Text style={styles.primaryText}>
            {visibleReplayTwist ? 'Bu sahneyi farklı problemle tekrar dene' : 'Bu anı tekrar çalış'}
          </Text>
          <Feather name="arrow-right" size={16} color={colors.bgDeep} />
        </TouchableOpacity>

        <TouchableOpacity style={styles.secondaryBtn} onPress={onBackHome} activeOpacity={0.82}>
          <Text style={styles.secondaryText}>{firstSessionMode ? 'Devam et' : 'Ana ekrana dön'}</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.toolsToggle} onPress={() => setShowTools(v => !v)} activeOpacity={0.82}>
          <Text style={styles.toolsToggleText}>
            {showTools ? 'Destekleri gizle ↑' : 'Kelime / kalıp desteği aç ↓'}
          </Text>
        </TouchableOpacity>

        {showTools ? (
          <View style={styles.toolsWrap}>
            <TouchableOpacity style={styles.toolRow} onPress={onOpenVocab} activeOpacity={0.82}>
              <View style={styles.toolIcon}><Feather name="book-open" size={15} color={colors.accentWarm} /></View>
              <View style={styles.toolCopy}>
                <Text style={styles.toolTitle}>Sahne kelimeleri</Text>
                <Text style={styles.toolSub}>Bu anı tekrar çalışmadan önce kısa kelime ısınması.</Text>
              </View>
            </TouchableOpacity>
            <TouchableOpacity style={styles.toolRow} onPress={onOpenGrammar} activeOpacity={0.82}>
              <View style={styles.toolIcon}><Feather name="edit-3" size={15} color={colors.accentWarm} /></View>
              <View style={styles.toolCopy}>
                <Text style={styles.toolTitle}>Sahne kalıpları</Text>
                <Text style={styles.toolSub}>Zorlanan cevabı daha doğal kurmak için mini kalıp.</Text>
              </View>
            </TouchableOpacity>
            <TouchableOpacity style={styles.toolRow} onPress={onOpenQuiz} activeOpacity={0.82}>
              <View style={styles.toolIcon}><Feather name="repeat" size={15} color={colors.accentWarm} /></View>
              <View style={styles.toolCopy}>
                <Text style={styles.toolTitle}>Kısa tekrar</Text>
                <Text style={styles.toolSub}>Cevap refleksini kaybetmeden bir tur pekiştir.</Text>
              </View>
            </TouchableOpacity>
          </View>
        ) : null}

        <View style={styles.xpFooter}>
          <Text style={styles.xpFooterText}>Bugünkü prova kaydı · Seviye {level} · Pratik serisi {streak} gün</Text>
          {!!nextGoal && <Text style={styles.xpFooterHint}>{nextGoal}</Text>}
        </View>
      </Animated.View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bgDeep },
  scroll: {
    paddingTop: Platform.OS === 'ios' ? 62 : 42,
    paddingHorizontal: 22,
    paddingBottom: 56,
  },
  glowWarm: {
    position: 'absolute',
    top: -160,
    right: -120,
    width: 300,
    height: 300,
    borderRadius: 150,
    backgroundColor: colors.accentGlow,
  },
  glowCool: {
    position: 'absolute',
    bottom: 160,
    left: -140,
    width: 260,
    height: 260,
    borderRadius: 130,
    backgroundColor: 'rgba(95,124,168,0.07)',
  },
  content: { width: '100%', gap: 14 },
  heroCard: {
    backgroundColor: 'rgba(18,24,34,0.88)',
    borderRadius: 28,
    borderWidth: 1,
    borderColor: colors.hairlineStrong,
    padding: 24,
    overflow: 'hidden',
  },
  eyebrow: {
    ...typography.eyebrow,
    color: colors.accentWarm,
    marginBottom: 14,
  },
  title: {
    ...typography.display,
    color: colors.inkPrimary,
    fontSize: 38,
    lineHeight: 43,
    letterSpacing: -0.8,
    marginBottom: 12,
  },
  titleAccent: {
    ...typography.displayItalic,
    color: colors.accentWarm,
  },
  subtitle: {
    ...typography.body,
    color: colors.inkSecondary,
    fontSize: 14,
    lineHeight: 21,
    maxWidth: 320,
  },
  sceneMetaRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 20,
  },
  sceneMetaPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
    backgroundColor: 'rgba(232,181,118,0.10)',
    borderWidth: 1,
    borderColor: colors.accentGlow,
  },
  sceneMetaText: {
    ...typography.bodyMedium,
    color: colors.accentWarm,
    fontSize: 12,
  },
  sceneMetaPillMuted: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
    backgroundColor: colors.bgSoft,
    borderWidth: 1,
    borderColor: colors.hairline,
  },
  sceneMetaMutedText: {
    ...typography.bodyMedium,
    color: colors.inkSecondary,
    fontSize: 12,
  },
  feedbackCard: {
    backgroundColor: colors.bgMid,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: colors.hairlineStrong,
    padding: 18,
  },
  cardEyebrow: {
    ...typography.eyebrow,
    color: colors.inkTertiary,
    fontSize: 10,
    marginBottom: 10,
  },
  bestLine: {
    ...typography.displayItalic,
    color: colors.inkPrimary,
    fontSize: 24,
    lineHeight: 31,
  },
  cardBodyText: {
    ...typography.body,
    color: colors.inkSecondary,
    fontSize: 15,
    lineHeight: 22,
  },
  alternativeBox: {
    marginTop: 14,
    padding: 14,
    borderRadius: 16,
    backgroundColor: 'rgba(232,181,118,0.08)',
    borderWidth: 1,
    borderColor: colors.accentGlow,
  },
  alternativeLabel: {
    ...typography.eyebrow,
    color: colors.accentWarm,
    fontSize: 9,
    marginBottom: 7,
  },
  alternativeText: {
    ...typography.bodyMedium,
    color: colors.inkPrimary,
    fontSize: 14,
    lineHeight: 20,
  },
  focusCard: {
    backgroundColor: 'rgba(40,30,22,0.78)',
    borderRadius: 24,
    borderWidth: 1,
    borderColor: colors.accentGlow,
    padding: 18,
  },
  focusText: {
    ...typography.bodyMedium,
    color: colors.inkPrimary,
    fontSize: 17,
    lineHeight: 24,
  },
  savedRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 15,
  },
  savedText: {
    ...typography.body,
    color: colors.inkTertiary,
    fontSize: 12,
  },
  twistCard: {
    backgroundColor: colors.bgMid,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: colors.hairlineStrong,
    padding: 17,
  },
  twistText: {
    ...typography.bodyMedium,
    color: colors.inkSecondary,
    fontSize: 15,
    lineHeight: 22,
  },
  voiceCard: {
    backgroundColor: colors.bgMid,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: colors.hairlineStrong,
    padding: 17,
    gap: 7,
  },
  voiceLabel: {
    ...typography.eyebrow,
    color: colors.accentWarm,
    fontSize: 8.5,
    marginTop: 2,
  },
  voiceLine: {
    fontFamily: 'Fraunces_300Light_Italic',
    color: colors.inkPrimary,
    fontSize: 15,
    lineHeight: 21,
  },
  voiceFeedback: {
    ...typography.body,
    color: colors.inkTertiary,
    fontSize: 12.5,
    lineHeight: 18,
  },
  unlockNotice: {
    backgroundColor: 'rgba(232,181,118,0.08)',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: colors.accentGlow,
    padding: 16,
    gap: 10,
  },
  unlockNoticeRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
  },
  unlockNoticeTitle: {
    ...typography.bodyMedium,
    color: colors.inkPrimary,
    fontSize: 14,
    marginBottom: 2,
  },
  unlockNoticeDesc: {
    ...typography.body,
    color: colors.inkTertiary,
    fontSize: 12,
    lineHeight: 17,
  },
  primaryBtn: {
    minHeight: 56,
    borderRadius: 999,
    backgroundColor: colors.inkPrimary,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 8,
    marginTop: 4,
  },
  primaryText: {
    ...typography.button,
    color: colors.bgDeep,
    letterSpacing: -0.1,
  },
  secondaryBtn: {
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 46,
  },
  secondaryText: {
    ...typography.bodyMedium,
    color: colors.inkTertiary,
    fontSize: 14,
  },
  toolsToggle: {
    alignItems: 'center',
    paddingVertical: 10,
  },
  toolsToggleText: {
    ...typography.bodyMedium,
    color: colors.accentWarmSoft,
    fontSize: 13,
  },
  toolsWrap: { gap: 10 },
  toolRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: colors.bgMid,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: colors.hairline,
    padding: 14,
  },
  toolIcon: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: 'rgba(232,181,118,0.10)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  toolCopy: { flex: 1 },
  toolTitle: {
    ...typography.bodyMedium,
    color: colors.inkPrimary,
    fontSize: 14,
    marginBottom: 2,
  },
  toolSub: {
    ...typography.body,
    color: colors.inkTertiary,
    fontSize: 12,
    lineHeight: 17,
  },
  xpFooter: {
    borderTopWidth: 1,
    borderTopColor: colors.hairline,
    paddingTop: 14,
    marginTop: 2,
    gap: 5,
  },
  xpFooterText: {
    ...typography.body,
    color: colors.inkTertiary,
    fontSize: 12,
    textAlign: 'center',
  },
  xpFooterHint: {
    ...typography.body,
    color: colors.inkTertiary,
    fontSize: 12,
    lineHeight: 17,
    textAlign: 'center',
  },
});
