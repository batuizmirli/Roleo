/**
 * TravelHomeScreen — Design exploration
 * Inspired by the Travel Mobile App Dribbble shot:
 * Dark charcoal bg · Orange/coral CTA · Full-bleed photo cards · Bold type
 *
 * Branch: design/stripe-exploration (safe, won't touch main)
 */

import React, { useEffect, useRef } from 'react';
import {
  Animated,
  Dimensions,
  ImageBackground,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Feather from '@expo/vector-icons/Feather';

const { width: SW } = Dimensions.get('window');
const CARD_W = SW - 48;
const SMALL_W = (SW - 56) / 2;

// ── Design tokens ─────────────────────────────────────────────────────────────
const t = {
  bg:          '#141219',   // deep charcoal
  surface:     '#1E1B25',   // card surface
  surfaceHigh: '#2A2633',   // elevated card
  orange:      '#E8713A',   // primary CTA
  orangeSoft:  '#F08B5A',   // hover / lighter
  cream:       '#F2EDE8',   // primary text
  muted:       '#8B8799',   // secondary text
  faint:       '#403C4E',   // borders, dividers
  star:        '#F5C842',   // rating star
} as const;

type Props = { onBack?: () => void };

export default function TravelHomeScreen({ onBack }: Props) {
  const insets = useSafeAreaInsets();
  const entrance = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(entrance, { toValue: 1, duration: 500, useNativeDriver: true }).start();
  }, [entrance]);

  return (
    <View style={[styles.root, { paddingTop: insets.top }]}>
      {/* ── Status bar area ────────────────────────────────────── */}
      <View style={styles.topBar}>
        <View>
          <Text style={styles.greeting}>Merhaba, Batu 👋</Text>
          <Text style={styles.tagline}>Bugün hangi sahneyi yaşayacaksın?</Text>
        </View>
        <TouchableOpacity style={styles.avatarBtn} activeOpacity={0.8}>
          <Text style={styles.avatarInitial}>B</Text>
        </TouchableOpacity>
      </View>

      <Animated.ScrollView
        contentContainerStyle={[styles.scroll, { paddingBottom: insets.bottom + 32 }]}
        showsVerticalScrollIndicator={false}
        style={{ opacity: entrance }}
      >
        {/* ── Hero card ──────────────────────────────────────────── */}
        <View style={styles.heroCard}>
          <ImageBackground
            source={{ uri: 'https://images.unsplash.com/photo-1554118811-1e0d58224f24?w=800' }}
            style={styles.heroImage}
            imageStyle={{ borderRadius: 20 }}
          >
            <LinearGradient
              colors={['transparent', 'rgba(14,12,19,0.92)']}
              style={styles.heroGradient}
            >
              <View style={styles.heroBadge}>
                <Feather name="zap" size={11} color={t.orange} />
                <Text style={styles.heroBadgeText}>GÜNÜN SAHNESİ</Text>
              </View>
              <Text style={styles.heroTitle}>Le Campanella{'\n'}· Paris Kafe</Text>
              <View style={styles.heroMeta}>
                <View style={styles.heroMetaLeft}>
                  <Feather name="map-pin" size={12} color={t.muted} />
                  <Text style={styles.heroMetaText}>Orta seviye · Fransızca</Text>
                </View>
                <View style={styles.ratingRow}>
                  <Feather name="star" size={12} color={t.star} />
                  <Text style={styles.ratingText}>4.8</Text>
                </View>
              </View>
              <TouchableOpacity style={styles.heroCta} activeOpacity={0.85}>
                <Text style={styles.heroCtaText}>Sahneye gir</Text>
                <Feather name="arrow-right" size={15} color="#fff" />
              </TouchableOpacity>
            </LinearGradient>
          </ImageBackground>
        </View>

        {/* ── Category tabs ──────────────────────────────────────── */}
        <View style={styles.sectionRow}>
          <Text style={styles.sectionTitle}>Sahneler</Text>
          <TouchableOpacity activeOpacity={0.7}>
            <Text style={styles.seeAll}>Tümü →</Text>
          </TouchableOpacity>
        </View>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.chipRow}
        >
          {['Tümü', 'Kafe', 'Seyahat', 'İş', 'Sosyal', 'Hayatta Kalma'].map((label, i) => (
            <TouchableOpacity
              key={label}
              style={[styles.chip, i === 0 && styles.chipActive]}
              activeOpacity={0.8}
            >
              <Text style={[styles.chipText, i === 0 && styles.chipTextActive]}>{label}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* ── Scene grid ─────────────────────────────────────────── */}
        <View style={styles.grid}>
          <SceneCard
            title="Stockholm Oteli"
            sub="Oda rezervasyonu"
            lang="İsveççe · Başlangıç"
            rating="4.6"
            color="#2C3E50"
          />
          <SceneCard
            title="Tokyo Metro"
            sub="Yön sorma"
            lang="Japonca · Orta"
            rating="4.9"
            color="#1A2A3A"
          />
          <SceneCard
            title="Milano Restoranı"
            sub="Sipariş & şikayet"
            lang="İtalyanca · İleri"
            rating="4.7"
            color="#2E1A30"
          />
          <SceneCard
            title="Berlin İş Toplantısı"
            sub="Sunum & müzakere"
            lang="Almanca · Orta"
            rating="4.5"
            color="#1A2E1A"
          />
        </View>

        {/* ── Progress strip ─────────────────────────────────────── */}
        <View style={styles.sectionRow}>
          <Text style={styles.sectionTitle}>Haftalık ilerleme</Text>
        </View>
        <View style={styles.progressStrip}>
          {['Pzt', 'Sal', 'Çar', 'Per', 'Cum', 'Cmt', 'Paz'].map((day, i) => (
            <View key={day} style={styles.dayCol}>
              <View style={[styles.dayDot, i < 5 && styles.dayDotFilled]} />
              <Text style={styles.dayLabel}>{day}</Text>
            </View>
          ))}
        </View>

        {/* ── Stats row ──────────────────────────────────────────── */}
        <View style={styles.statsRow}>
          <StatCard icon="zap" value="340 XP" label="Toplam puan" />
          <StatCard icon="flame" value="5 gün" label="Seri" />
          <StatCard icon="award" value="Lv 4" label="Seviye" />
        </View>
      </Animated.ScrollView>

      {/* ── Bottom tab bar ─────────────────────────────────────── */}
      <View style={[styles.tabBar, { paddingBottom: insets.bottom + 4 }]}>
        {[
          { icon: 'home', label: 'Ana Sayfa' },
          { icon: 'compass', label: 'Sahneler' },
          { icon: 'book-open', label: 'Defter' },
          { icon: 'user', label: 'Profil' },
        ].map((tab, i) => (
          <TouchableOpacity key={tab.label} style={styles.tabItem} activeOpacity={0.7}>
            <Feather
              name={tab.icon as never}
              size={20}
              color={i === 0 ? t.orange : t.muted}
            />
            <Text style={[styles.tabLabel, i === 0 && styles.tabLabelActive]}>
              {tab.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
}

function SceneCard({
  title, sub, lang, rating, color,
}: { title: string; sub: string; lang: string; rating: string; color: string }) {
  return (
    <TouchableOpacity style={[styles.sceneCard, { backgroundColor: color }]} activeOpacity={0.85}>
      <View style={styles.sceneCardTop}>
        <View style={styles.ratingPill}>
          <Feather name="star" size={10} color={t.star} />
          <Text style={styles.ratingPillText}>{rating}</Text>
        </View>
      </View>
      <View style={styles.sceneCardBottom}>
        <Text style={styles.sceneCardTitle} numberOfLines={1}>{title}</Text>
        <Text style={styles.sceneCardSub} numberOfLines={1}>{sub}</Text>
        <Text style={styles.sceneCardLang}>{lang}</Text>
      </View>
    </TouchableOpacity>
  );
}

function StatCard({ icon, value, label }: { icon: string; value: string; label: string }) {
  return (
    <View style={styles.statCard}>
      <Feather name={icon as never} size={18} color={t.orange} />
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: t.bg },

  // ── Top bar ──────────────────────────────────────────────────
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    paddingTop: 8,
    paddingBottom: 16,
  },
  greeting: {
    fontFamily: 'InterTight_400Regular',
    fontSize: 13,
    color: t.muted,
    marginBottom: 3,
  },
  tagline: {
    fontFamily: 'Fraunces_300Light',
    fontSize: 18,
    color: t.cream,
    letterSpacing: -0.3,
  },
  avatarBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: t.orange,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarInitial: {
    fontFamily: 'InterTight_600SemiBold',
    fontSize: 16,
    color: '#fff',
  },

  scroll: { paddingHorizontal: 24, gap: 0 },

  // ── Hero ─────────────────────────────────────────────────────
  heroCard: { marginBottom: 28 },
  heroImage: {
    width: CARD_W,
    height: 260,
    borderRadius: 20,
    overflow: 'hidden',
  },
  heroGradient: {
    flex: 1,
    borderRadius: 20,
    padding: 20,
    justifyContent: 'flex-end',
    gap: 10,
  },
  heroBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: 'rgba(232,113,58,0.18)',
    borderWidth: 1,
    borderColor: t.orange,
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 4,
    alignSelf: 'flex-start',
    marginBottom: 4,
  },
  heroBadgeText: {
    fontFamily: 'InterTight_600SemiBold',
    fontSize: 10,
    color: t.orange,
    letterSpacing: 1.2,
  },
  heroTitle: {
    fontFamily: 'Fraunces_300Light',
    fontSize: 28,
    color: t.cream,
    lineHeight: 34,
    letterSpacing: -0.4,
  },
  heroMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  heroMetaLeft: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  heroMetaText: {
    fontFamily: 'InterTight_400Regular',
    fontSize: 12,
    color: t.muted,
  },
  ratingRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  ratingText: {
    fontFamily: 'InterTight_500Medium',
    fontSize: 12,
    color: t.cream,
  },
  heroCta: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: t.orange,
    borderRadius: 12,
    paddingVertical: 14,
    marginTop: 4,
  },
  heroCtaText: {
    fontFamily: 'InterTight_600SemiBold',
    fontSize: 15,
    color: '#fff',
  },

  // ── Section header ───────────────────────────────────────────
  sectionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 14,
  },
  sectionTitle: {
    fontFamily: 'InterTight_600SemiBold',
    fontSize: 17,
    color: t.cream,
    letterSpacing: -0.2,
  },
  seeAll: {
    fontFamily: 'InterTight_400Regular',
    fontSize: 13,
    color: t.orange,
  },

  // ── Chips ────────────────────────────────────────────────────
  chipRow: {
    flexDirection: 'row',
    gap: 8,
    paddingBottom: 20,
  },
  chip: {
    backgroundColor: t.surface,
    borderRadius: 999,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: t.faint,
  },
  chipActive: {
    backgroundColor: t.orange,
    borderColor: t.orange,
  },
  chipText: {
    fontFamily: 'InterTight_400Regular',
    fontSize: 13,
    color: t.muted,
  },
  chipTextActive: {
    color: '#fff',
    fontFamily: 'InterTight_500Medium',
  },

  // ── Grid ─────────────────────────────────────────────────────
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 28,
  },
  sceneCard: {
    width: SMALL_W,
    height: 160,
    borderRadius: 16,
    padding: 14,
    justifyContent: 'space-between',
  },
  sceneCardTop: { alignItems: 'flex-end' },
  sceneCardBottom: { gap: 3 },
  ratingPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: 'rgba(0,0,0,0.4)',
    borderRadius: 999,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  ratingPillText: {
    fontFamily: 'InterTight_500Medium',
    fontSize: 11,
    color: t.cream,
  },
  sceneCardTitle: {
    fontFamily: 'Fraunces_300Light',
    fontSize: 16,
    color: t.cream,
    letterSpacing: -0.2,
  },
  sceneCardSub: {
    fontFamily: 'InterTight_400Regular',
    fontSize: 12,
    color: 'rgba(242,237,232,0.7)',
  },
  sceneCardLang: {
    fontFamily: 'InterTight_400Regular',
    fontSize: 10,
    color: t.muted,
    marginTop: 2,
  },

  // ── Progress strip ───────────────────────────────────────────
  progressStrip: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: t.surface,
    borderRadius: 16,
    paddingHorizontal: 20,
    paddingVertical: 16,
    marginBottom: 12,
  },
  dayCol: { alignItems: 'center', gap: 6 },
  dayDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: t.faint,
  },
  dayDotFilled: { backgroundColor: t.orange },
  dayLabel: {
    fontFamily: 'InterTight_400Regular',
    fontSize: 10,
    color: t.muted,
  },

  // ── Stats ────────────────────────────────────────────────────
  statsRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 8,
  },
  statCard: {
    flex: 1,
    backgroundColor: t.surface,
    borderRadius: 14,
    padding: 14,
    alignItems: 'center',
    gap: 5,
  },
  statValue: {
    fontFamily: 'InterTight_600SemiBold',
    fontSize: 15,
    color: t.cream,
    letterSpacing: -0.2,
  },
  statLabel: {
    fontFamily: 'InterTight_400Regular',
    fontSize: 10,
    color: t.muted,
    textAlign: 'center',
  },

  // ── Tab bar ──────────────────────────────────────────────────
  tabBar: {
    flexDirection: 'row',
    backgroundColor: t.surface,
    borderTopWidth: 1,
    borderTopColor: t.faint,
    paddingTop: 12,
  },
  tabItem: { flex: 1, alignItems: 'center', gap: 4 },
  tabLabel: {
    fontFamily: 'InterTight_400Regular',
    fontSize: 10,
    color: t.muted,
  },
  tabLabelActive: { color: t.orange },
});
