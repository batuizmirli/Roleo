import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, Dimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import Feather from '@expo/vector-icons/Feather';
import { getProgress, getWeeklyXp } from '../services/progress';
import { colors } from '../theme/colors';
import { typography } from '../theme/typography';
import { useAppTranslation } from '../i18n';

const { width: SW } = Dimensions.get('window');

type Props = {
  onOpenVocab?: () => void;
  onOpenPronunciation?: () => void;
  onOpenInstantLearn?: () => void;
  onOpenGrammar?: () => void;
  onOpenPhrasebook?: () => void;
  onOpenStories?: () => void;
};

type PrepTile = {
  id: string;
  label: string;
  icon: string;
  caption: string;
  fill: number;
  onPress: () => void;
};

type ToolCard = {
  id: string;
  title: string;
  subtitle: string;
  icon: string;
  onPress: () => void;
};

export default function LearnHubScreen({
  onOpenVocab,
  onOpenPronunciation,
  onOpenInstantLearn,
  onOpenGrammar,
  onOpenPhrasebook,
  onOpenStories,
}: Props) {
  const insets = useSafeAreaInsets();
  const t = useAppTranslation();
  const [weeklyTotal, setWeeklyTotal] = useState(0);
  const [playedToday, setPlayedToday] = useState(false);
  const [xp, setXp] = useState(0);

  useEffect(() => {
    (async () => {
      const progress = await getProgress();
      const todayStr = new Date().toISOString().slice(0, 10);
      setPlayedToday(progress.lastPlayedDate === todayStr);
      const weekly = getWeeklyXp(progress.dailyXpLog ?? {});
      setWeeklyTotal(weekly.reduce((s, d) => s + d.xp, 0));
      setXp(progress.xp);
    })();
  }, []);

  const prepTiles: PrepTile[] = [
    {
      id: 'kelime',
      label: t('learn.vocab'),
      icon: 'book-open',
      fill: playedToday ? 1 : 0.35,
      caption: t('learn.vocabCaption'),
      onPress: () => onOpenVocab?.(),
    },
    {
      id: 'telaffuz',
      label: t('learn.pronunciation'),
      icon: 'mic',
      fill: Math.min(1, 0.45 + (weeklyTotal > 20 ? 0.25 : 0)),
      caption: t('learn.pronunciationCaption'),
      onPress: () => onOpenPronunciation?.(),
    },
    {
      id: 'dinleme',
      label: t('learn.listening'),
      icon: 'headphones',
      fill: Math.min(1, 0.55 + (xp > 80 ? 0.3 : 0)),
      caption: t('learn.listeningCaption'),
      onPress: () => onOpenPronunciation?.(),
    },
  ];

  const toolCards: ToolCard[] = [
    { id: 'grammar', title: t('learn.patterns'), subtitle: t('learn.patternsSub'), icon: 'globe', onPress: () => onOpenGrammar?.() },
    { id: 'phrase', title: t('learn.phrases'), subtitle: t('learn.phrasesSub'), icon: 'bookmark', onPress: () => onOpenPhrasebook?.() },
    { id: 'instant', title: t('learn.instant'), subtitle: t('learn.instantSub'), icon: 'message-circle', onPress: () => onOpenInstantLearn?.() },
    { id: 'stories', title: t('learn.stories'), subtitle: t('learn.storiesSub'), icon: 'layers', onPress: () => onOpenStories?.() },
  ];

  const bottomPad = Math.max(insets.bottom, 12) + 56;
  const rhythmLabel = playedToday ? t('learn.rhythmPlayed') : t('learn.rhythmAuto');

  return (
    <View style={styles.root}>
      {/* Atmosphere */}
      <View style={styles.glow} pointerEvents="none" />

      {/* Top bar */}
      <View style={[styles.topBar, { paddingTop: insets.top + 10 }]}>
        <Text style={styles.eyebrow}>{t('learn.eyebrow')}</Text>
        <Text style={styles.screenTitle}>{t('learn.title')}</Text>
        <Text style={styles.subtitle}>{t('learn.subtitle')}</Text>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[styles.scrollInner, { paddingBottom: bottomPad + 24 }]}
        showsVerticalScrollIndicator={false}
      >
        {/* Prep tiles */}
        <View style={styles.sectionRow}>
          <Text style={styles.sectionTitle}>{t('learn.sectionPrep')}</Text>
          <Text style={styles.sectionMeta}>{rhythmLabel}</Text>
        </View>

        <View style={styles.prepGrid}>
          {prepTiles.map(tile => (
            <TouchableOpacity
              key={tile.id}
              style={styles.prepCard}
              onPress={tile.onPress}
              activeOpacity={0.8}
            >
              <LinearGradient
                colors={['rgba(40,30,22,0.5)', 'rgba(18,24,34,0.7)']}
                style={StyleSheet.absoluteFillObject}
              />
              <View style={styles.prepIconCircle}>
                <Feather name={tile.icon as any} size={18} color={colors.accentWarm} />
              </View>
              <Text style={styles.prepLabel}>{tile.label}</Text>
              <Text style={styles.prepCaption} numberOfLines={2}>{tile.caption}</Text>
              {/* Fill bar */}
              <View style={styles.prepTrack}>
                <LinearGradient
                  colors={[colors.accentWarmSoft, colors.accentWarm]}
                  start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
                  style={[styles.prepFill, { width: `${Math.round(tile.fill * 100)}%` as any }]}
                />
              </View>
            </TouchableOpacity>
          ))}
        </View>

        {/* Tool cards */}
        <Text style={[styles.sectionTitle, { marginTop: 8, marginBottom: 12 }]}>Dil Araçları</Text>
        <View style={styles.toolGrid}>
          {toolCards.map(card => (
            <TouchableOpacity
              key={card.id}
              style={styles.toolCard}
              onPress={card.onPress}
              activeOpacity={0.8}
            >
              <View style={styles.toolIconWrap}>
                <Feather name={card.icon as any} size={18} color={colors.accentWarmSoft} />
              </View>
              <Text style={styles.toolTitle}>{card.title}</Text>
              <Text style={styles.toolSubtitle} numberOfLines={2}>{card.subtitle}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bgDeep },

  glow: {
    position: 'absolute',
    width: SW * 0.8,
    height: SW * 0.8,
    borderRadius: SW * 0.4,
    backgroundColor: 'rgba(232,181,118,0.05)',
    top: -SW * 0.2,
    right: -SW * 0.15,
  },

  topBar: {
    paddingHorizontal: 22,
    paddingBottom: 20,
  },
  eyebrow: {
    ...typography.eyebrow,
    color: colors.accentWarm,
    fontSize: 10,
    marginBottom: 10,
  },
  screenTitle: {
    fontFamily: 'Fraunces_300Light',
    fontSize: 30,
    color: colors.inkPrimary,
    letterSpacing: -0.5,
    lineHeight: 37,
    marginBottom: 8,
  },
  screenTitleItalic: {
    fontFamily: 'Fraunces_300Light_Italic',
    color: colors.accentWarm,
  },
  subtitle: {
    ...typography.body,
    fontSize: 13,
    color: colors.inkTertiary,
    lineHeight: 19,
  },

  scroll: { flex: 1 },
  scrollInner: { paddingHorizontal: 20, paddingTop: 4 },

  sectionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    ...typography.eyebrow,
    fontSize: 10,
    color: colors.inkSecondary,
  },
  sectionMeta: {
    ...typography.body,
    fontSize: 11,
    color: colors.accentWarmSoft,
  },

  // Prep tiles
  prepGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 24 },
  prepCard: {
    width: '30.5%',
    minHeight: 140,
    backgroundColor: colors.bgMid,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(232,181,118,0.15)',
    padding: 12,
    overflow: 'hidden',
    justifyContent: 'space-between',
  },
  prepIconCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: `${colors.accentWarm}14`,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  prepLabel: {
    ...typography.bodyMedium,
    fontSize: 13,
    color: colors.inkPrimary,
    marginBottom: 4,
  },
  prepCaption: {
    ...typography.body,
    fontSize: 10,
    color: colors.inkTertiary,
    lineHeight: 14,
    flex: 1,
  },
  prepTrack: {
    height: 2,
    borderRadius: 1,
    backgroundColor: colors.hairlineStrong,
    overflow: 'hidden',
    marginTop: 8,
  },
  prepFill: { height: 2, borderRadius: 1 },

  // Tool cards
  toolGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  toolCard: {
    width: '48%',
    minHeight: 120,
    backgroundColor: colors.bgMid,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.hairline,
    padding: 14,
    justifyContent: 'space-between',
  },
  toolIconWrap: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: `${colors.accentWarm}10`,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  toolTitle: {
    ...typography.bodyMedium,
    fontSize: 13,
    color: colors.inkPrimary,
    marginBottom: 4,
  },
  toolSubtitle: {
    ...typography.body,
    fontSize: 11,
    color: colors.inkTertiary,
    lineHeight: 16,
  },
});
