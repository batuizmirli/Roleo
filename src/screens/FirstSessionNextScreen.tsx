import React, { useEffect, useRef, useState } from 'react';
import {
  Animated,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  Vibration,
  View,
} from 'react-native';
import ActionCard from '../components/ActionCard';
import { colors } from '../theme/colors';
import { spacing } from '../theme/spacing';
import { typography } from '../theme/typography';
import { trackEvent } from '../utils/analytics';

type AsyncAction = () => void | Promise<void>;

type Props = {
  onContinueStage: AsyncAction;
  onStartMission: AsyncAction;
  stageEnabled?: boolean;
  missionEnabled?: boolean;
  stageStatusText?: string;
  missionStatusText?: string;
};

export default function FirstSessionNextScreen({
  onContinueStage,
  onStartMission,
  stageEnabled = true,
  missionEnabled = true,
  stageStatusText,
  missionStatusText,
}: Props) {
  const [pendingAction, setPendingAction] = useState<'stage' | 'mission' | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const isMounted = useRef(true);
  const headerAnim = useRef(new Animated.Value(0)).current;
  const mainCardAnim = useRef(new Animated.Value(0)).current;
  const secondaryCardAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    isMounted.current = true;

    Animated.stagger(90, [
      Animated.timing(headerAnim, {
        toValue: 1,
        duration: 350,
        useNativeDriver: true,
      }),
      Animated.timing(mainCardAnim, {
        toValue: 1,
        duration: 350,
        useNativeDriver: true,
      }),
      Animated.timing(secondaryCardAnim, {
        toValue: 1,
        duration: 350,
        useNativeDriver: true,
      }),
    ]).start();

    return () => {
      isMounted.current = false;
    };
  }, [headerAnim, mainCardAnim, secondaryCardAnim]);

  const enterStyle = (value: Animated.Value) => ({
    opacity: value,
    transform: [
      {
        translateY: value.interpolate({
          inputRange: [0, 1],
          outputRange: [18, 0],
        }),
      },
    ],
  });

  const runAction = async (type: 'stage' | 'mission', callback: AsyncAction) => {
    if (pendingAction) return;

    setErrorMessage(null);
    setPendingAction(type);

    Vibration.vibrate(10);
    trackEvent(type + '_clicked', { screen: 'FirstSessionNextScreen' });

    try {
      await Promise.resolve(callback());
    } catch {
      if (isMounted.current) {
        setErrorMessage('Bir sorun olu\u015Ftu. L\u00FCtfen tekrar dene.');
      }
    } finally {
      if (isMounted.current) {
        setPendingAction(null);
      }
    }
  };

  const hasNoAvailableAction = !stageEnabled && !missionEnabled;
  const interactionLocked = pendingAction !== null;

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        bounces={false}
      >
        <Animated.View style={enterStyle(headerAnim)}>
          <Text style={styles.eyebrow}>{'\u0130lk oturum tamamland\u0131'}</Text>
          <Text style={styles.title}>{'Harika ba\u015Flang\u0131\u00E7 \uD83C\uDF89'}</Text>
          <Text style={styles.subtitle}>{'\u015Eimdi ne yapmak istersin?'}</Text>
        </Animated.View>

        {hasNoAvailableAction ? (
          <View style={styles.noticeBox}>
            <Text style={styles.noticeTitle}>{'Yeni i\u00E7erik haz\u0131rlan\u0131yor'}</Text>
            <Text style={styles.noticeText}>
              {'\u015Eu anda ba\u015Flat\u0131labilir bir sahne veya g\u00F6rev yok. K\u0131sa s\u00FCre i\u00E7inde tekrar kontrol et.'}
            </Text>
          </View>
        ) : null}

        <Animated.View style={enterStyle(mainCardAnim)}>
          <ActionCard
            variant="primary"
            emoji={'\uD83C\uDFAD'}
            title="Sahneye Devam Et"
            description={
              stageEnabled
                ? 'Yeni bir sahne ile roleplay deneyimine kald\u0131\u011F\u0131n yerden devam et.'
                : '\u015Eu an devam edilecek yeni sahne bulunmuyor.'
            }
            statusText={
              stageEnabled
                ? 'Ana ak\u0131\u015Fa d\u00F6n ve hik\u00E2yeyi s\u00FCrd\u00FCr.'
                : stageStatusText ?? 'Yak\u0131nda yeni sahneler eklenecek.'
            }
            disabled={!stageEnabled || interactionLocked}
            loading={pendingAction === 'stage'}
            onPress={() => runAction('stage', onContinueStage)}
            accessibilityLabel="Sahneye devam et"
            accessibilityHint="Yeni sahneyi a\u00E7ar ve roleplay ak\u0131\u015F\u0131n\u0131 s\u00FCrd\u00FCr\u00FCr."
            testID="continue-stage-card"
          />
        </Animated.View>

        <Animated.View style={enterStyle(secondaryCardAnim)}>
          <ActionCard
            emoji={'\u26A1'}
            title={'Bug\u00FCn\u00FCn G\u00F6revi'}
            description={
              missionEnabled
                ? '30-60 saniyelik tek g\u00F6rev, tek \u00F6d\u00FCl. H\u0131zl\u0131 bir ilerleme turu.'
                : 'Bug\u00FCn\u00FCn g\u00F6revi hen\u00FCz haz\u0131r de\u011Fil.'
            }
            statusText={
              missionEnabled
                ? 'K\u0131sa g\u00F6rev ile \u00F6d\u00FCl kazan.'
                : missionStatusText ?? 'Yeni g\u00F6rev k\u0131sa s\u00FCre i\u00E7inde haz\u0131r olacak.'
            }
            disabled={!missionEnabled || interactionLocked}
            loading={pendingAction === 'mission'}
            onPress={() => runAction('mission', onStartMission)}
            accessibilityLabel={'Bug\u00FCn\u00FCn g\u00F6revini ba\u015Flat'}
            accessibilityHint={'G\u00FCn\u00FCn k\u0131sa g\u00F6rev ekran\u0131n\u0131 a\u00E7ar.'}
            testID="start-mission-card"
          />
        </Animated.View>

        {errorMessage ? (
          <View style={styles.errorBox} accessibilityLiveRegion="polite">
            <Text style={styles.errorText}>{errorMessage}</Text>
          </View>
        ) : null}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.xl,
    paddingBottom: spacing.xxxl,
  },
  eyebrow: {
    color: colors.primaryAccent,
    fontSize: typography.size.sm,
    fontWeight: typography.weight.semibold,
    marginBottom: spacing.sm,
  },
  title: {
    color: colors.textPrimary,
    fontSize: typography.size.xxl,
    fontWeight: typography.weight.black,
  },
  subtitle: {
    color: colors.textSecondary,
    fontSize: typography.size.md,
    marginTop: spacing.sm,
    marginBottom: spacing.xl,
  },
  noticeBox: {
    backgroundColor: colors.surface,
    borderColor: colors.divider,
    borderWidth: 1,
    borderRadius: 16,
    padding: spacing.lg,
    marginBottom: spacing.lg,
  },
  noticeTitle: {
    color: colors.textPrimary,
    fontSize: typography.size.lg,
    fontWeight: typography.weight.bold,
  },
  noticeText: {
    color: colors.textSecondary,
    fontSize: typography.size.sm,
    lineHeight: 20,
    marginTop: spacing.xs,
  },
  errorBox: {
    marginTop: spacing.sm,
    backgroundColor: '#3B1020',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.danger,
    padding: spacing.md,
  },
  errorText: {
    color: '#FFD7DF',
    fontSize: typography.size.sm,
  },
});
