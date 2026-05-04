import React, { useEffect, useState, useRef } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet, Animated, Dimensions,
} from 'react-native';
import Feather from '@expo/vector-icons/Feather';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { getSceneSessions } from '../services/sessionMemory';
import { getSubscriptionState } from '../services/subscription';
import { ROLEO_PLUS_MATRIX } from '../data/plus';
import { colors } from '../theme/colors';
import { typography } from '../theme/typography';
import type { SceneSession } from '../types';

const { width: SW } = Dimensions.get('window');

const DIFFICULTY_LABEL: Record<string, string> = {
  beginner: 'Başlangıç',
  intermediate: 'Orta',
  advanced: 'İleri',
};

const ACCURACY_LABEL = (acc: number) => {
  if (acc >= 0.75) return 'Akıcı';
  if (acc >= 0.45) return 'Gelişiyor';
  return 'Erken aşama';
};

const formatDate = (iso: string) => {
  const d = new Date(iso);
  return d.toLocaleDateString('tr-TR', { day: 'numeric', month: 'long' });
};

type Props = {
  onBack: () => void;
};

export default function JournalScreen({ onBack }: Props) {
  const insets = useSafeAreaInsets();
  const [sessions, setSessions] = useState<SceneSession[]>([]);
  const [maxSessions, setMaxSessions] = useState(2);
  const entrance = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(entrance, { toValue: 1, duration: 500, delay: 80, useNativeDriver: true }).start();
    (async () => {
      const [data, sub] = await Promise.all([getSceneSessions(), getSubscriptionState()]);
      setMaxSessions(sub.isPremium ? ROLEO_PLUS_MATRIX.plus.memoryLimit : ROLEO_PLUS_MATRIX.free.memoryLimit);
      setSessions(data);
    })();
  }, []);

  const isEmpty = sessions.length === 0;

  return (
    <View style={styles.root}>
      <View style={[styles.glow1]} pointerEvents="none" />

      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + 12 }]}>
        <TouchableOpacity onPress={onBack} style={styles.backBtn} activeOpacity={0.7}>
          <Feather name="arrow-left" size={18} color={colors.inkSecondary} />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={styles.eyebrow}>PROVA DEFTERİ</Text>
          <Text style={styles.subtitle}>{sessions.length} / {maxSessions} prova</Text>
        </View>
        <View style={{ width: 38 }} />
      </View>

      <Animated.View
        style={[
          styles.body,
          {
            opacity: entrance,
            transform: [{ translateY: entrance.interpolate({ inputRange: [0, 1], outputRange: [14, 0] }) }],
          },
        ]}
      >
        <ScrollView
          contentContainerStyle={[styles.list, { paddingBottom: Math.max(insets.bottom, 24) + 16 }]}
          showsVerticalScrollIndicator={false}
        >
          {isEmpty ? (
            <View style={styles.emptyState}>
              <Feather name="book-open" size={28} color={colors.inkTertiary} />
              <Text style={styles.emptyTitle}>Henüz prova yok</Text>
              <Text style={styles.emptyBody}>
                Bir sahneyi tamamladığında notların burada birikmeye başlar.
              </Text>
            </View>
          ) : (
            sessions.map((session, i) => (
              <SessionCard key={session.sessionId} session={session} index={i} />
            ))
          )}

          {sessions.length >= maxSessions && maxSessions === ROLEO_PLUS_MATRIX.free.memoryLimit && (
            <View style={styles.limitBanner}>
              <Feather name="archive" size={13} color={colors.accentWarmSoft} />
              <Text style={styles.limitText}>
                Ücretsiz planda {ROLEO_PLUS_MATRIX.free.memoryLimit} prova saklanır. Plus ile {ROLEO_PLUS_MATRIX.plus.memoryLimit}'e çık.
              </Text>
            </View>
          )}
        </ScrollView>
      </Animated.View>
    </View>
  );
}

function SessionCard({ session, index }: { session: SceneSession; index: number }) {
  const acc = session.score.accuracy;
  const xp = session.score.xpEarned;

  return (
    <View style={[styles.card, index === 0 && styles.cardFirst]}>
      {/* Top row */}
      <View style={styles.cardTop}>
        <View style={styles.cardTopLeft}>
          <Text style={styles.cardDate}>{formatDate(session.timestamp)}</Text>
          <Text style={styles.cardTitle} numberOfLines={1}>{session.scenarioTitle}</Text>
        </View>
        <View style={styles.cardBadge}>
          <Text style={styles.cardBadgeText}>{xp > 0 ? `+${xp} XP` : ACCURACY_LABEL(acc)}</Text>
        </View>
      </View>

      {/* Best line */}
      {session.bestLine ? (
        <Text style={styles.bestLine} numberOfLines={2}>"{session.bestLine}"</Text>
      ) : null}

      {/* Next focus */}
      {session.nextFocus ? (
        <View style={styles.focusRow}>
          <Feather name="arrow-right" size={10} color={colors.inkTertiary} />
          <Text style={styles.focusText} numberOfLines={2}>{session.nextFocus}</Text>
        </View>
      ) : null}

      {/* Meta */}
      <View style={styles.cardMeta}>
        <Text style={styles.metaItem}>{DIFFICULTY_LABEL[session.difficulty] ?? session.difficulty}</Text>
        <Text style={styles.metaDot}>·</Text>
        <Text style={styles.metaItem}>{ACCURACY_LABEL(acc)}</Text>
        {session.source === 'daily_run' ? (
          <>
            <Text style={styles.metaDot}>·</Text>
            <Text style={styles.metaItem}>Daily run</Text>
          </>
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bgDeep },

  glow1: {
    position: 'absolute',
    width: SW * 0.8,
    height: SW * 0.8,
    borderRadius: SW * 0.4,
    backgroundColor: 'rgba(232,181,118,0.06)',
    top: -SW * 0.25,
    right: -SW * 0.3,
  },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: colors.hairline,
  },
  backBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: colors.bgSoft,
    borderWidth: 1,
    borderColor: colors.hairlineStrong,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerCenter: { alignItems: 'center', gap: 2 },
  eyebrow: {
    ...typography.eyebrow,
    color: colors.inkTertiary,
    fontSize: 10,
  },
  subtitle: {
    fontFamily: 'InterTight_400Regular',
    fontSize: 12,
    color: colors.inkSecondary,
  },

  body: { flex: 1 },

  list: {
    paddingHorizontal: 20,
    paddingTop: 20,
    gap: 12,
  },

  emptyState: {
    alignItems: 'center',
    gap: 12,
    paddingTop: 64,
    paddingHorizontal: 32,
  },
  emptyTitle: {
    fontFamily: 'Fraunces_300Light',
    fontSize: 20,
    color: colors.inkSecondary,
    letterSpacing: -0.3,
  },
  emptyBody: {
    fontFamily: 'InterTight_400Regular',
    fontSize: 13,
    color: colors.inkTertiary,
    textAlign: 'center',
    lineHeight: 19,
  },

  card: {
    backgroundColor: colors.bgMid,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: colors.hairlineStrong,
    padding: 18,
    gap: 12,
  },
  cardFirst: {
    borderColor: colors.accentWarmSoft,
  },

  cardTop: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 12,
  },
  cardTopLeft: { flex: 1, gap: 2 },
  cardDate: {
    fontFamily: 'InterTight_400Regular',
    fontSize: 11,
    color: colors.inkTertiary,
  },
  cardTitle: {
    fontFamily: 'InterTight_500Medium',
    fontSize: 14,
    color: colors.inkPrimary,
  },
  cardBadge: {
    backgroundColor: 'rgba(232,181,118,0.12)',
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  cardBadgeText: {
    fontFamily: 'InterTight_600SemiBold',
    fontSize: 11,
    color: colors.accentWarm,
  },

  bestLine: {
    fontFamily: 'Fraunces_300Light_Italic',
    fontSize: 14,
    color: colors.inkPrimary,
    lineHeight: 21,
    letterSpacing: -0.2,
  },

  focusRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 6,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: colors.hairline,
  },
  focusText: {
    flex: 1,
    fontFamily: 'InterTight_400Regular',
    fontSize: 12,
    color: colors.inkTertiary,
    lineHeight: 17,
  },

  cardMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  metaItem: {
    fontFamily: 'InterTight_400Regular',
    fontSize: 11,
    color: colors.inkTertiary,
  },
  metaDot: {
    fontFamily: 'InterTight_400Regular',
    fontSize: 11,
    color: colors.inkTertiary,
    opacity: 0.5,
  },

  limitBanner: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    backgroundColor: 'rgba(255,255,255,0.025)',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.hairlineStrong,
    padding: 12,
    marginTop: 4,
  },
  limitText: {
    flex: 1,
    fontFamily: 'InterTight_400Regular',
    fontSize: 12,
    color: colors.inkTertiary,
    lineHeight: 17,
  },
});
