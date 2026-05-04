import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, Dimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import Feather from '@expo/vector-icons/Feather';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getProgress } from '../services/progress';
import { getLearnFills, recordLearnOpen, LearnMode } from '../services/learnActivity';
import { getCulturalTips, CulturalTip } from '../data/culturalTips';
import { colors } from '../theme/colors';
import { typography } from '../theme/typography';
import { useAppTranslation } from '../i18n';
import { tryParseJson } from '../services/json';
import { UserProfile } from '../types';

const { width: SW } = Dimensions.get('window');

type Props = {
  onOpenVocab?: () => void;
  onOpenPronunciation?: () => void;
  onOpenListening?: () => void;
  onOpenInstantLearn?: () => void;
  onOpenGrammar?: () => void;
};

type PrepTile = {
  id: LearnMode;
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
  onOpenListening,
  onOpenInstantLearn,
  onOpenGrammar,
}: Props) {
  const insets = useSafeAreaInsets();
  const t = useAppTranslation();
  const [playedToday, setPlayedToday] = useState(false);
  const [fills, setFills] = useState<Record<LearnMode, number>>({ vocab: 0, pronunciation: 0, listening: 0 });
  const [targetLang, setTargetLang] = useState<string>('es');
  const [tips, setTips] = useState<CulturalTip[]>([]);
  const [tipIndex, setTipIndex] = useState(0);

  useEffect(() => {
    (async () => {
      const progress = await getProgress();
      const todayStr = new Date().toISOString().slice(0, 10);
      setPlayedToday(progress.lastPlayedDate === todayStr);

      const activityFills = await getLearnFills();
      setFills(activityFills);

      const raw = await AsyncStorage.getItem('userProfile');
      if (raw) {
        const profile = tryParseJson<UserProfile>(raw);
        if (profile?.language?.code) {
          setTargetLang(profile.language.code);
        }
      }
    })();
  }, []);

  useEffect(() => {
    const list = getCulturalTips(targetLang);
    setTips(list);
    setTipIndex(Math.floor(Math.random() * list.length));
  }, [targetLang]);

  const activeTip = tips[tipIndex] ?? null;

  const handleOpenMode = (mode: LearnMode, fn?: () => void) => {
    recordLearnOpen(mode);
    setFills(prev => ({ ...prev, [mode]: Math.min(1, prev[mode] + 1 / 3) }));
    fn?.();
  };

  const prepTiles: PrepTile[] = [
    {
      id: 'vocab',
      label: t('learn.vocab'),
      icon: 'book-open',
      fill: fills.vocab,
      caption: t('learn.vocabCaption'),
      onPress: () => handleOpenMode('vocab', onOpenVocab),
    },
    {
      id: 'pronunciation',
      label: t('learn.pronunciation'),
      icon: 'mic',
      fill: fills.pronunciation,
      caption: t('learn.pronunciationCaption'),
      onPress: () => handleOpenMode('pronunciation', onOpenPronunciation),
    },
    {
      id: 'listening',
      label: t('learn.listening'),
      icon: 'headphones',
      fill: fills.listening,
      caption: t('learn.listeningCaption'),
      onPress: () => handleOpenMode('listening', onOpenListening),
    },
  ];

  const toolCards: ToolCard[] = [
    { id: 'grammar', title: t('learn.patterns'), subtitle: t('learn.patternsSub'), icon: 'globe', onPress: () => onOpenGrammar?.() },
    { id: 'instant', title: t('learn.instant'), subtitle: t('learn.instantSub'), icon: 'message-circle', onPress: () => onOpenInstantLearn?.() },
  ];

  const bottomPad = Math.max(insets.bottom, 12) + 56;
  const rhythmLabel = playedToday ? t('learn.rhythmPlayed') : t('learn.rhythmAuto');

  return (
    <View style={styles.root}>
      <View style={styles.glow} pointerEvents="none" />

      <View style={[styles.topBar, { paddingTop: insets.top + 10 }]}>
        <Text style={styles.eyebrow}>{t('learn.eyebrow')}</Text>
        <Text style={styles.screenTitle}>Seni sahneye{'\n'}hazırlayalım.</Text>
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

        {/* Cultural tip */}
        {activeTip ? (
          <>
            <View style={[styles.sectionRow, { marginTop: 4 }]}>
              <Text style={styles.sectionTitle}>KÜLTÜREL İPUCU</Text>
              {tips.length > 1 ? (
                <TouchableOpacity onPress={() => setTipIndex((tipIndex + 1) % tips.length)}>
                  <Text style={styles.sectionMeta}>Sonraki →</Text>
                </TouchableOpacity>
              ) : null}
            </View>
            <View style={styles.tipCard}>
              <Text style={styles.tipText}>{activeTip.text}</Text>
              {activeTip.example ? (
                <Text style={styles.tipExample}>"{activeTip.example}"</Text>
              ) : null}
            </View>
          </>
        ) : null}

        {/* Tool cards */}
        <Text style={[styles.sectionTitle, { marginTop: 24, marginBottom: 12 }]}>Dil Araçları</Text>
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

  prepGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 24 },
  prepCard: {
    width: '30.5%',
    minHeight: 160,
    backgroundColor: colors.bgMid,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(232,181,118,0.18)',
    padding: 14,
    overflow: 'hidden',
    justifyContent: 'space-between',
  },
  prepIconCircle: {
    width: 42,
    height: 42,
    borderRadius: 14,
    backgroundColor: `${colors.accentWarm}16`,
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

  tipCard: {
    backgroundColor: colors.bgMid,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(232,181,118,0.2)',
    padding: 16,
    marginBottom: 8,
  },
  tipText: {
    ...typography.body,
    fontSize: 13,
    color: colors.inkSecondary,
    lineHeight: 20,
  },
  tipExample: {
    fontFamily: 'Fraunces_300Light_Italic',
    fontSize: 14,
    color: colors.accentWarm,
    lineHeight: 20,
    marginTop: 8,
  },

  toolGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  toolCard: {
    width: '48%',
    minHeight: 140,
    backgroundColor: colors.bgMid,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: colors.hairlineStrong,
    padding: 16,
    justifyContent: 'space-between',
  },
  toolIconWrap: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: `${colors.accentWarm}12`,
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
