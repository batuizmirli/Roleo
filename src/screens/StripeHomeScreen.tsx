/**
 * StripeHomeScreen — Design exploration
 * Roleo Home reimagined with the Stripe design system (Design.md).
 * Light theme · Deep Violet CTAs · Minimal cards · Compact grid
 *
 * This file lives only on the design/stripe-exploration branch.
 */

import React, { useEffect, useRef, useState } from 'react';
import {
  Animated,
  Dimensions,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Feather from '@expo/vector-icons/Feather';

const { width: SW } = Dimensions.get('window');

// ── Design tokens from Design.md ─────────────────────────────────────────────
const ds = {
  midnightInk: '#061b31',
  slateBlue: '#50617a',
  ghostGray: '#64748d',
  platinumWhite: '#ffffff',
  porcelainWhite: '#f8fafd',
  powderBlue: '#e5edf5',
  stoneGray: '#d8d6df',
  deepViolet: '#533afd',
  washedViolet: '#b9b9f9',
  softViolet: '#8087ff',
  accentGreen: '#81b81a',
  vibrantOrange: '#ff6118',
} as const;

const shadow = {
  xl: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.2,
    shadowRadius: 16,
    elevation: 8,
  },
  sm: {
    shadowColor: '#171717',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 2,
  },
} as const;

type Props = {
  onBack?: () => void;
};

export default function StripeHomeScreen({ onBack }: Props) {
  const insets = useSafeAreaInsets();
  const entrance = useRef(new Animated.Value(0)).current;
  const [xp] = useState(340);
  const [streak] = useState(5);
  const level = Math.floor(xp / 100) + 1;
  const xpToNext = 100 - (xp % 100);

  useEffect(() => {
    Animated.timing(entrance, {
      toValue: 1,
      duration: 420,
      useNativeDriver: true,
    }).start();
  }, [entrance]);

  return (
    <View style={[styles.root, { paddingTop: insets.top }]}>
      {/* ── Top navigation bar ─────────────────────────────────── */}
      <View style={styles.topBar}>
        <View style={styles.topBarLeft}>
          <Text style={styles.wordmark}>roleo</Text>
        </View>
        <View style={styles.topBarRight}>
          <View style={styles.streakBadge}>
            <Feather name="zap" size={12} color={ds.deepViolet} />
            <Text style={styles.streakBadgeText}>{streak} gün</Text>
          </View>
          <TouchableOpacity style={styles.avatarBtn} activeOpacity={0.75}>
            <Feather name="user" size={14} color={ds.midnightInk} />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView
        contentContainerStyle={[styles.scroll, { paddingBottom: insets.bottom + 32 }]}
        showsVerticalScrollIndicator={false}
      >
        <Animated.View
          style={{
            opacity: entrance,
            transform: [{ translateY: entrance.interpolate({ inputRange: [0, 1], outputRange: [12, 0] }) }],
          }}
        >
          {/* ── Hero section ───────────────────────────────────── */}
          <View style={styles.heroSection}>
            <Text style={styles.heroEyebrow}>BUGÜNÜN SAHNESI</Text>
            <Text style={styles.heroTitle}>
              Yabancı dili{'\n'}sahne sahne öğren.
            </Text>
            <Text style={styles.heroSubtitle}>
              Kafe, iş toplantısı, yabancı şehir — dilini gerçek anlar içinde pratik et.
            </Text>

            <TouchableOpacity style={styles.primaryBtn} activeOpacity={0.85}>
              <Text style={styles.primaryBtnText}>Sahneye gir →</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.ghostBtn} activeOpacity={0.7}>
              <Text style={styles.ghostBtnText}>Tüm sahnelere bak</Text>
            </TouchableOpacity>
          </View>

          {/* ── Progress card ──────────────────────────────────── */}
          <View style={styles.sectionGap} />
          <Text style={styles.sectionLabel}>İLERLEMELERİN</Text>
          <View style={styles.progressCard}>
            <View style={styles.progressRow}>
              <View style={styles.statBlock}>
                <Text style={styles.statValue}>Seviye {level}</Text>
                <Text style={styles.statCaption}>{xp} XP toplam</Text>
              </View>
              <View style={styles.statDivider} />
              <View style={styles.statBlock}>
                <Text style={styles.statValue}>{streak} gün</Text>
                <Text style={styles.statCaption}>Kesintisiz seri</Text>
              </View>
              <View style={styles.statDivider} />
              <View style={styles.statBlock}>
                <Text style={styles.statValue}>{xpToNext} XP</Text>
                <Text style={styles.statCaption}>Sonraki seviyeye</Text>
              </View>
            </View>
            <View style={styles.progressBarTrack}>
              <View style={[styles.progressBarFill, { width: `${(xp % 100)}%` }]} />
            </View>
          </View>

          {/* ── Quick action grid ──────────────────────────────── */}
          <View style={styles.sectionGap} />
          <Text style={styles.sectionLabel}>HIZLI ERİŞİM</Text>
          <View style={styles.actionGrid}>
            <QuickCard
              icon="mic"
              title="Sesli pratik"
              desc="Konuşarak öğren"
              accent={ds.deepViolet}
            />
            <QuickCard
              icon="book-open"
              title="Prova defteri"
              desc="Geçmiş sahneler"
              accent={ds.softViolet}
            />
            <QuickCard
              icon="zap"
              title="Anlık öğren"
              desc="Hızlı kelime"
              accent={ds.accentGreen}
            />
            <QuickCard
              icon="bar-chart-2"
              title="İstatistikler"
              desc="Detaylı rapor"
              accent={ds.vibrantOrange}
            />
          </View>

          {/* ── Recent scene card ──────────────────────────────── */}
          <View style={styles.sectionGap} />
          <Text style={styles.sectionLabel}>SON PROVA</Text>
          <View style={styles.recentCard}>
            <View style={styles.recentCardTop}>
              <View>
                <Text style={styles.recentCardTitle}>Le Campanella · Kafe</Text>
                <Text style={styles.recentCardDate}>2 gün önce · Orta seviye</Text>
              </View>
              <View style={styles.xpBadge}>
                <Text style={styles.xpBadgeText}>+28 XP</Text>
              </View>
            </View>
            <View style={styles.recentCardDivider} />
            <Text style={styles.recentCardMemory}>
              "Je voudrais un café, s'il vous plaît."
            </Text>
            <Text style={styles.recentCardFocus}>
              Sonraki odak: Sipariş verirken nezaket ifadeleri kullan.
            </Text>
          </View>

          {/* ── Footer note ────────────────────────────────────── */}
          <View style={styles.sectionGap} />
          <View style={styles.footerRow}>
            <Feather name="info" size={12} color={ds.ghostGray} />
            <Text style={styles.footerText}>
              Bu bir tasarım deneyi — design/stripe-exploration branch
            </Text>
          </View>
        </Animated.View>
      </ScrollView>
    </View>
  );
}

function QuickCard({
  icon,
  title,
  desc,
  accent,
}: {
  icon: string;
  title: string;
  desc: string;
  accent: string;
}) {
  return (
    <TouchableOpacity style={styles.quickCard} activeOpacity={0.8}>
      <View style={[styles.quickCardIcon, { backgroundColor: accent + '14' }]}>
        <Feather name={icon as never} size={16} color={accent} />
      </View>
      <Text style={styles.quickCardTitle}>{title}</Text>
      <Text style={styles.quickCardDesc}>{desc}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: ds.platinumWhite,
  },

  // ── Top bar ──────────────────────────────────────────────────────
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: ds.stoneGray,
    backgroundColor: ds.platinumWhite,
  },
  topBarLeft: {},
  topBarRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  wordmark: {
    fontFamily: 'InterTight_600SemiBold',
    fontSize: 17,
    color: ds.midnightInk,
    letterSpacing: -0.5,
  },
  streakBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: ds.powderBlue,
    borderRadius: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  streakBadgeText: {
    fontFamily: 'InterTight_500Medium',
    fontSize: 12,
    color: ds.deepViolet,
  },
  avatarBtn: {
    width: 32,
    height: 32,
    borderRadius: 4,
    backgroundColor: ds.powderBlue,
    alignItems: 'center',
    justifyContent: 'center',
  },

  // ── Scroll ───────────────────────────────────────────────────────
  scroll: {
    paddingHorizontal: 24,
    paddingTop: 32,
  },

  sectionGap: { height: 32 },

  sectionLabel: {
    fontFamily: 'InterTight_500Medium',
    fontSize: 11,
    color: ds.ghostGray,
    letterSpacing: 1.4,
    marginBottom: 12,
  },

  // ── Hero ─────────────────────────────────────────────────────────
  heroSection: {
    gap: 16,
  },
  heroEyebrow: {
    fontFamily: 'InterTight_500Medium',
    fontSize: 11,
    color: ds.deepViolet,
    letterSpacing: 1.8,
  },
  heroTitle: {
    fontFamily: 'InterTight_300Light',
    fontSize: 36,
    color: ds.midnightInk,
    lineHeight: 40,
    letterSpacing: -0.8,
  },
  heroSubtitle: {
    fontFamily: 'InterTight_400Regular',
    fontSize: 15,
    color: ds.slateBlue,
    lineHeight: 22,
  },
  primaryBtn: {
    backgroundColor: ds.deepViolet,
    borderRadius: 4,
    paddingVertical: 15,
    paddingHorizontal: 24,
    alignSelf: 'flex-start',
    ...shadow.sm,
  },
  primaryBtnText: {
    fontFamily: 'InterTight_500Medium',
    fontSize: 15,
    color: '#ffffff',
    letterSpacing: -0.1,
  },
  ghostBtn: {
    paddingVertical: 12,
    alignSelf: 'flex-start',
  },
  ghostBtnText: {
    fontFamily: 'InterTight_400Regular',
    fontSize: 14,
    color: ds.midnightInk,
    textDecorationLine: 'underline',
    textDecorationColor: ds.stoneGray,
  },

  // ── Progress card ─────────────────────────────────────────────
  progressCard: {
    backgroundColor: ds.porcelainWhite,
    borderRadius: 6,
    padding: 16,
    gap: 14,
    borderWidth: 1,
    borderColor: ds.stoneGray,
  },
  progressRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  statBlock: {
    flex: 1,
    alignItems: 'center',
    gap: 2,
  },
  statValue: {
    fontFamily: 'InterTight_600SemiBold',
    fontSize: 15,
    color: ds.midnightInk,
    letterSpacing: -0.2,
  },
  statCaption: {
    fontFamily: 'InterTight_400Regular',
    fontSize: 11,
    color: ds.ghostGray,
  },
  statDivider: {
    width: 1,
    height: 28,
    backgroundColor: ds.stoneGray,
  },
  progressBarTrack: {
    height: 3,
    backgroundColor: ds.powderBlue,
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: ds.deepViolet,
    borderRadius: 2,
  },

  // ── Quick action grid ─────────────────────────────────────────
  actionGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  quickCard: {
    width: (SW - 48 - 8) / 2,
    backgroundColor: ds.powderBlue,
    borderRadius: 6,
    padding: 14,
    gap: 8,
  },
  quickCardIcon: {
    width: 32,
    height: 32,
    borderRadius: 4,
    alignItems: 'center',
    justifyContent: 'center',
  },
  quickCardTitle: {
    fontFamily: 'InterTight_500Medium',
    fontSize: 13,
    color: ds.midnightInk,
    letterSpacing: -0.1,
  },
  quickCardDesc: {
    fontFamily: 'InterTight_400Regular',
    fontSize: 11,
    color: ds.slateBlue,
  },

  // ── Recent card ───────────────────────────────────────────────
  recentCard: {
    backgroundColor: ds.porcelainWhite,
    borderRadius: 6,
    padding: 16,
    gap: 12,
    ...shadow.sm,
    borderWidth: 1,
    borderColor: ds.stoneGray,
  },
  recentCardTop: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 12,
  },
  recentCardTitle: {
    fontFamily: 'InterTight_500Medium',
    fontSize: 14,
    color: ds.midnightInk,
  },
  recentCardDate: {
    fontFamily: 'InterTight_400Regular',
    fontSize: 11,
    color: ds.ghostGray,
    marginTop: 2,
  },
  xpBadge: {
    backgroundColor: ds.deepViolet + '12',
    borderRadius: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  xpBadgeText: {
    fontFamily: 'InterTight_600SemiBold',
    fontSize: 11,
    color: ds.deepViolet,
  },
  recentCardDivider: {
    height: 1,
    backgroundColor: ds.stoneGray,
  },
  recentCardMemory: {
    fontFamily: 'Fraunces_300Light_Italic',
    fontSize: 15,
    color: ds.midnightInk,
    lineHeight: 22,
    letterSpacing: -0.1,
  },
  recentCardFocus: {
    fontFamily: 'InterTight_400Regular',
    fontSize: 12,
    color: ds.slateBlue,
    lineHeight: 18,
  },

  // ── Footer ────────────────────────────────────────────────────
  footerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  footerText: {
    fontFamily: 'InterTight_400Regular',
    fontSize: 11,
    color: ds.ghostGray,
  },
});
