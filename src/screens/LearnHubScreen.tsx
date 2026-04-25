import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { getProgress, getWeeklyXp } from '../services/progress';
import { colors } from '../theme/colors';

type RoutineTile = {
  id: string;
  label: string;
  icon: React.ComponentProps<typeof MaterialIcons>['name'];
  fill: number;
  muted: boolean;
  onPress: () => void;
  caption?: string;
};

type ToolRow = {
  id: string;
  title: string;
  subtitle: string;
  icon: React.ComponentProps<typeof MaterialIcons>['name'];
  onPress: () => void;
};

type Props = {
  onOpenFlashPick?: () => void;
  onOpenPronunciation?: () => void;
  onOpenInstantLearn?: () => void;
  onOpenGrammar?: () => void;
  onOpenTrueOrFake?: () => void;
  onOpenPhrasebook?: () => void;
  onOpenStories?: () => void;
};

const surface = '#FCF9F8';
const primary = '#884C32';
const terracotta = '#B06D50';
const onSurface = '#1B1C1C';
const onSurfaceVariant = '#53433E';
const outlineVariant = 'rgba(216, 194, 186, 0.35)';
const white = '#FFFFFF';

export default function LearnHubScreen({
  onOpenFlashPick,
  onOpenPronunciation,
  onOpenInstantLearn,
  onOpenGrammar,
  onOpenTrueOrFake,
  onOpenPhrasebook,
  onOpenStories,
}: Props) {
  const insets = useSafeAreaInsets();
  const [weeklyTotal, setWeeklyTotal] = useState(0);
  const [playedToday, setPlayedToday] = useState(false);
  const [xp, setXp] = useState(0);

  useEffect(() => {
    const load = async () => {
      const progress = await getProgress();
      const todayStr = new Date().toISOString().slice(0, 10);
      setPlayedToday(progress.lastPlayedDate === todayStr);
      const weekly = getWeeklyXp(progress.dailyXpLog ?? {});
      setWeeklyTotal(weekly.reduce((s, d) => s + d.xp, 0));
      setXp(progress.xp);
    };
    void load();
  }, []);

  const routineTiles: RoutineTile[] = [
    {
      id: 'kelime',
      label: 'Kelime',
      icon: 'menu-book',
      fill: playedToday ? 1 : 0.35,
      muted: false,
      onPress: () => onOpenFlashPick?.(),
    },
    {
      id: 'telaffuz',
      label: 'Telaffuz',
      icon: 'mic',
      fill: Math.min(1, 0.45 + (weeklyTotal > 20 ? 0.25 : 0)),
      muted: false,
      onPress: () => onOpenPronunciation?.(),
    },
    {
      id: 'dinleme',
      label: 'Dinleme',
      icon: 'headphones',
      fill: Math.min(1, 0.55 + (xp > 80 ? 0.3 : 0)),
      muted: false,
      onPress: () => onOpenInstantLearn?.(),
    },
    {
      id: 'grammar',
      label: 'Grammar',
      icon: 'translate',
      fill: Math.min(1, 0.58 + (weeklyTotal > 15 ? 0.22 : 0) + (xp > 40 ? 0.2 : 0)),
      muted: false,
      caption: 'Sahnede işine yarayan kalıp ve örnekler',
      onPress: () => onOpenGrammar?.(),
    },
  ];

  const rhythmDoneLabel = playedToday
    ? 'Bugünkü koşuya bağlandı'
    : 'Daily Run içinde otomatik gelir';

  const toolRows: ToolRow[] = [
    { id: 'grammar', title: 'Grammar', subtitle: 'Sahnede kullanacağın kalıplar', icon: 'translate', onPress: () => onOpenGrammar?.() },
    { id: 'flash', title: 'Kelime seçimi', subtitle: 'Bir sonraki cevap için hızlı ısınma', icon: 'menu-book', onPress: () => onOpenFlashPick?.() },
    { id: 'pron', title: 'Telaffuz', subtitle: 'Söylemeden önce sesini hazırla', icon: 'mic', onPress: () => onOpenPronunciation?.() },
    { id: 'instant', title: 'Hızlı prova', subtitle: 'Kısa bir konuşma anını dene', icon: 'chat', onPress: () => onOpenInstantLearn?.() },
    { id: 'tof', title: 'True or Fake', subtitle: 'Doğal mı garip mi, sahne öncesi ayırt et', icon: 'fact-check', onPress: () => onOpenTrueOrFake?.() },
    { id: 'phrase', title: 'Phrasebook', subtitle: 'Gerçek anda işine yarayacak ifadeler', icon: 'bookmark', onPress: () => onOpenPhrasebook?.() },
    { id: 'stories', title: 'Hikayeler', subtitle: 'Kısa bağlamlarla ifade tekrar et', icon: 'auto-stories', onPress: () => onOpenStories?.() },
  ];

  const bottomPad = Math.max(insets.bottom, 12) + 56;

  return (
    <View style={styles.root}>
      <SafeAreaView style={styles.safeTop} edges={['top']}>
        <View style={styles.topBar}>
          <Text style={styles.screenTitle}>Hazırlık</Text>
        </View>
      </SafeAreaView>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[styles.scrollInner, { paddingBottom: bottomPad + 24 }]}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.subtitle}>Bunlar ana mod değil; bugünkü sahnede daha rahat cevap vermek için kısa destekler.</Text>

        <View style={styles.sectionHead}>
          <Text style={styles.sectionTitle}>Sahne öncesi ısınmalar</Text>
          <Text style={styles.sectionMeta}>{rhythmDoneLabel}</Text>
        </View>
        <View style={styles.rhythmGrid}>
          {routineTiles.map(tile => (
            <TouchableOpacity
              key={tile.id}
              style={[styles.rhythmCard, tile.muted && styles.rhythmCardMuted]}
              onPress={tile.onPress}
              activeOpacity={0.88}
            >
              <View style={[styles.rhythmIconCircle, tile.muted && styles.rhythmIconCircleMuted]}>
                <MaterialIcons name={tile.icon} size={22} color={tile.muted ? '#85736C' : primary} />
              </View>
              <View style={styles.rhythmTextBlock}>
                <Text style={styles.rhythmLabel}>{tile.label}</Text>
                {tile.caption ? (
                  <Text style={styles.rhythmCaption} numberOfLines={2}>
                    {tile.caption}
                  </Text>
                ) : null}
              </View>
              <View style={styles.rhythmTrack}>
                <View style={[styles.rhythmFill, { width: `${Math.round(tile.fill * 100)}%` }]} />
              </View>
            </TouchableOpacity>
          ))}
        </View>

        <Text style={[styles.sectionTitle, styles.toolSectionTitle]}>Araç rafı</Text>
        <View style={styles.toolList}>
          {toolRows.map(row => (
            <TouchableOpacity key={row.id} style={styles.toolRow} onPress={row.onPress} activeOpacity={0.88}>
              <View style={styles.toolIconWrap}>
                <MaterialIcons name={row.icon} size={20} color={primary} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.toolTitle}>{row.title}</Text>
                <Text style={styles.toolSubtitle}>{row.subtitle}</Text>
              </View>
              <MaterialIcons name="chevron-right" size={20} color={terracotta} />
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: surface },
  safeTop: { backgroundColor: '#FCF9F7' },
  topBar: {
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(51,51,51,0.06)',
    backgroundColor: '#FCF9F7',
  },
  screenTitle: {
    fontSize: 22,
    fontFamily: 'Poppins_600SemiBold',
    color: onSurface,
  },
  subtitle: {
    fontSize: 13,
    fontFamily: 'Poppins_500Medium',
    color: onSurfaceVariant,
    marginBottom: 18,
    lineHeight: 19,
  },
  scroll: { flex: 1 },
  scrollInner: { paddingHorizontal: 20, paddingTop: 16 },
  sectionHead: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    marginBottom: 10,
  },
  sectionTitle: {
    fontSize: 16,
    lineHeight: 22,
    fontFamily: 'Poppins_500Medium',
    color: onSurfaceVariant,
  },
  toolSectionTitle: { marginBottom: 12, marginTop: 4 },
  sectionMeta: {
    fontSize: 11,
    fontFamily: 'Poppins_600SemiBold',
    color: terracotta,
    textAlign: 'right',
    flexShrink: 1,
  },
  rhythmGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 22,
  },
  rhythmCard: {
    width: '48%',
    backgroundColor: 'rgba(255,255,255,0.68)',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: outlineVariant,
    padding: 10,
    alignItems: 'center',
    shadowColor: '#333',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.02,
    shadowRadius: 6,
    elevation: 1,
  },
  rhythmCardMuted: { opacity: 0.62 },
  rhythmIconCircle: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: 'rgba(165, 100, 72, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  rhythmIconCircleMuted: { backgroundColor: '#F0EDED' },
  rhythmTextBlock: {
    alignItems: 'center',
    alignSelf: 'stretch',
    marginBottom: 8,
    gap: 4,
  },
  rhythmLabel: {
    fontSize: 12,
    fontFamily: 'Poppins_600SemiBold',
    color: onSurfaceVariant,
  },
  rhythmCaption: {
    fontSize: 10,
    lineHeight: 14,
    fontFamily: 'Poppins_500Medium',
    color: '#7A6E68',
    textAlign: 'center',
    paddingHorizontal: 2,
    alignSelf: 'stretch',
  },
  rhythmTrack: {
    width: '100%',
    height: 4,
    borderRadius: 999,
    backgroundColor: colors.creamMuted,
    overflow: 'hidden',
  },
  rhythmFill: {
    height: '100%',
    borderRadius: 999,
    backgroundColor: primary,
  },
  toolList: { gap: 10 },
  toolRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: white,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: outlineVariant,
    paddingHorizontal: 14,
    paddingVertical: 10,
    gap: 12,
  },
  toolIconWrap: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: 'rgba(165, 100, 72, 0.08)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  toolTitle: {
    fontSize: 14,
    fontFamily: 'Poppins_600SemiBold',
    color: onSurface,
  },
  toolSubtitle: {
    fontSize: 11,
    fontFamily: 'Poppins_500Medium',
    color: onSurfaceVariant,
    marginTop: 2,
  },
});
