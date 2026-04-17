import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Modal,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { UserProfile } from '../types';
import { SUPPORTED_LANGUAGES } from '../data/scenarios';
import { tryParseJson } from '../services/json';
import AnimatedPressable from '../components/AnimatedPressable';
import { getLevelFromXp } from '../services/progress';

type HomeSection = {
  id: 'scenarios' | 'stories' | 'phrasebook';
  title: string;
  description: string;
  emoji: string;
  color: string;
  tag: string;
};

type HomeCard = {
  id: string;
  title: string;
  description: string;
  emoji: string;
  color: string;
  vibe: string;
};

const HOME_SECTIONS: HomeSection[] = [
  {
    id: 'scenarios',
    title: 'Sahneye Devam Et',
    description: 'Kaldığın konuşmadan devam et',
    emoji: '🎭',
    color: '#FF4D6D',
    tag: 'Ana Mod',
  },
  {
    id: 'stories',
    title: 'Hikaye Sahnesi',
    description: 'Seçim yap, konuşma ilerlesin',
    emoji: '📖',
    color: '#34D399',
    tag: 'Interactive Story',
  },
  {
    id: 'phrasebook',
    title: 'Survival Sprint',
    description: 'Panik anında doğru cümleyi bul',
    emoji: '🗣️',
    color: '#60A5FA',
    tag: 'Survival',
  },
];

const SUPPORT_CARDS: HomeCard[] = [
  {
    id: 'daily-mission',
    title: 'Bugünün Görevi',
    description: '60 saniyelik mini sahne',
    emoji: '⚡',
    color: '#F59E0B',
    vibe: 'Hızlı görev',
  },
  {
    id: 'progress',
    title: 'Gelişimin',
    description: 'Dünkü halinle bugünü karşılaştır',
    emoji: '📈',
    color: '#A78BFA',
    vibe: 'İlerleme',
  },
];

type Props = {
  onModeSelect: (mode: 'scenarios' | 'stories' | 'phrasebook') => void;
  onDebug?: () => void;
};

export default function HomeScreen({ onModeSelect, onDebug }: Props) {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [langModalVisible, setLangModalVisible] = useState(false);

  useEffect(() => {
    loadProfile();
  }, []);

  const xp = profile?.xp ?? 0;
  const level = getLevelFromXp(xp);
  const progressPercent = Math.round(((xp % 100) / 100) * 100);

  const loadProfile = async () => {
    const data = await AsyncStorage.getItem('userProfile');
    if (!data) return;

    const parsed = tryParseJson<UserProfile>(data);
    if (!parsed) {
      await AsyncStorage.removeItem('userProfile');
      return;
    }

    setProfile(parsed);
  };

  const handleLanguageChange = async (lang: typeof SUPPORTED_LANGUAGES[0]) => {
    if (!profile) return;
    const updated = { ...profile, language: lang };
    await AsyncStorage.setItem('userProfile', JSON.stringify(updated));
    setProfile(updated);
    setLangModalVisible(false);
  };

  return (
    <>
      <ScrollView style={styles.container} contentContainerStyle={styles.scroll}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onLongPress={onDebug} activeOpacity={1}>
            <Text style={styles.logo}>roleo</Text>
          </TouchableOpacity>
          <View style={styles.headerRight}>
            <TouchableOpacity style={styles.langBtn} onPress={() => setLangModalVisible(true)}>
              <Text style={styles.langBtnText}>{profile?.language.flag} {profile?.language.name}</Text>
              <Text style={styles.langBtnArrow}>▾</Text>
            </TouchableOpacity>
            <View style={styles.streakBadge}>
              <Text style={styles.streakText}>🔥 {profile?.streak ?? 0}</Text>
            </View>
          </View>
        </View>

        {/* Dream */}
        {profile?.goalDescription ? (
          <View style={styles.dreamCard}>
            <Text style={styles.dreamLabel}>HEDEFIN</Text>
            <Text style={styles.dreamText}>"{profile.goalDescription}"</Text>
          </View>
        ) : null}

        <Text style={styles.sectionTitle}>Sahnen seni bekliyor</Text>
        <View style={styles.sparkCard}>
          <Text style={styles.sparkTitle}>🎯 Günün Mini Görevi</Text>
          <Text style={styles.sparkText}>1 stage tamamla · +20 XP · seriyi koru</Text>
          <View style={styles.progressBar}>
            <View style={[styles.progressFill, { width: `${progressPercent}%` }]} />
          </View>
          <Text style={styles.sparkMeta}>Level {level} · {xp} XP · 🔥 {profile?.streak ?? 0} gün</Text>
        </View>

        <View style={styles.modesGrid}>
          {HOME_SECTIONS.map((mode, index) => (
            <AnimatedPressable
              key={mode.id}
              style={styles.modeCard}
              onPress={() => onModeSelect(mode.id)}
              delay={index * 45}
            >
              <View style={[styles.modeIconBg, { backgroundColor: mode.color + '22' }]}>
                <Text style={styles.modeEmoji}>{mode.emoji}</Text>
              </View>
              <View style={[styles.modeMiddle]}>
                <Text style={styles.modeTitle}>{mode.title}</Text>
                <Text style={styles.modeDesc}>{mode.description}</Text>
                <Text style={[styles.modeBadge, { color: mode.color }]}>{mode.tag}</Text>
              </View>
              <View style={[styles.modeArrow, { backgroundColor: mode.color + '22' }]}>
                <Text style={[styles.modeArrowText, { color: mode.color }]}>→</Text>
              </View>
            </AnimatedPressable>
          ))}
        </View>

        <Text style={[styles.sectionTitle, { marginTop: 18 }]}>Yan sistemler</Text>
        {SUPPORT_CARDS.map((item, i) => (
          <AnimatedPressable key={item.id} style={styles.supportCard} delay={180 + i * 60} onPress={() => onModeSelect('scenarios')}>
            <Text style={styles.supportEmoji}>{item.emoji}</Text>
            <View style={{ flex: 1 }}>
              <Text style={styles.supportTitle}>{item.title}</Text>
              <Text style={styles.supportDesc}>{item.description}</Text>
            </View>
            <Text style={[styles.supportVibe, { color: item.color }]}>{item.vibe}</Text>
          </AnimatedPressable>
        ))}

        <View style={{ height: 40 }} />
      </ScrollView>

      {/* Language Modal */}
      <Modal visible={langModalVisible} transparent animationType="slide" onRequestClose={() => setLangModalVisible(false)}>
        <TouchableOpacity style={styles.overlay} onPress={() => setLangModalVisible(false)}>
          <View style={styles.modal}>
            <Text style={styles.modalTitle}>Dil Seç</Text>
            {SUPPORTED_LANGUAGES.map(lang => (
              <TouchableOpacity
                key={lang.code}
                style={[styles.modalItem, profile?.language.code === lang.code && styles.modalItemActive]}
                onPress={() => handleLanguageChange(lang)}
              >
                <Text style={styles.modalFlag}>{lang.flag}</Text>
                <Text style={styles.modalName}>{lang.name}</Text>
                {profile?.language.code === lang.code && <Text style={styles.check}>✓</Text>}
              </TouchableOpacity>
            ))}
          </View>
        </TouchableOpacity>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0D0D1A' },
  scroll: { paddingHorizontal: 24, paddingTop: 60, paddingBottom: 40 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 },
  logo: { fontSize: 24, fontWeight: '900', color: '#FF4D6D', letterSpacing: 2 },
  headerRight: { flexDirection: 'row', gap: 8, alignItems: 'center' },
  langBtn: { backgroundColor: '#1A1A2E', borderRadius: 20, paddingHorizontal: 12, paddingVertical: 8, borderWidth: 1, borderColor: '#2A2A3E', flexDirection: 'row', alignItems: 'center', gap: 4 },
  langBtnText: { fontSize: 13, color: '#FFF', fontWeight: '600' },
  langBtnArrow: { fontSize: 10, color: '#666' },
  streakBadge: { backgroundColor: '#1A1A2E', borderRadius: 20, paddingHorizontal: 12, paddingVertical: 8, borderWidth: 1, borderColor: '#2A2A3E' },
  streakText: { fontSize: 13, fontWeight: '700', color: '#FFF' },
  dreamCard: { backgroundColor: '#1A1A2E', borderRadius: 16, padding: 16, marginBottom: 28, borderLeftWidth: 3, borderLeftColor: '#FF4D6D', borderWidth: 1, borderColor: '#2A2A3E' },
  dreamLabel: { fontSize: 10, fontWeight: '700', color: '#FF4D6D', letterSpacing: 1.5, marginBottom: 6 },
  dreamText: { fontSize: 13, color: '#AAA', fontStyle: 'italic', lineHeight: 20 },
  sectionTitle: { fontSize: 18, fontWeight: '800', color: '#FFF', marginBottom: 16 },
  sparkCard: { backgroundColor: '#1A1A2E', borderRadius: 14, padding: 14, marginBottom: 12, borderWidth: 1, borderColor: '#2A2A3E' },
  sparkTitle: { color: '#FF4D6D', fontSize: 11, fontWeight: '800', letterSpacing: 1 },
  sparkText: { color: '#CCC', fontSize: 13, marginTop: 6 },
  sparkMeta: { color: '#888', fontSize: 11, marginTop: 8 },
  progressBar: { height: 5, borderRadius: 999, backgroundColor: '#0D0D1A', marginTop: 10, overflow: 'hidden' },
  progressFill: { height: 5, borderRadius: 999, backgroundColor: '#FF4D6D' },
  modesGrid: { gap: 12 },
  modeCard: { backgroundColor: '#1A1A2E', borderRadius: 20, padding: 20, borderWidth: 1.5, borderColor: '#2A2A3E', flexDirection: 'row', alignItems: 'center', gap: 16 },
  modeIconBg: { width: 52, height: 52, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  modeEmoji: { fontSize: 26 },
  modeMiddle: { flex: 1 },
  modeTitle: { fontSize: 16, fontWeight: '800', color: '#FFF' },
  modeDesc: { fontSize: 12, color: '#888', marginTop: 2 },
  modeBadge: { marginTop: 6, fontSize: 11, fontWeight: '800' },
  modeArrow: { width: 32, height: 32, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  modeArrowText: { fontSize: 16, fontWeight: '800' },
  supportCard: { backgroundColor: '#151526', borderRadius: 14, borderWidth: 1, borderColor: '#23233A', padding: 14, flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 8 },
  supportEmoji: { fontSize: 24 },
  supportTitle: { color: '#FFF', fontSize: 14, fontWeight: '800' },
  supportDesc: { color: '#777', fontSize: 12, marginTop: 2 },
  supportVibe: { fontSize: 11, fontWeight: '800' },
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'flex-end' },
  modal: { backgroundColor: '#1A1A2E', borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, paddingBottom: 40 },
  modalTitle: { fontSize: 18, fontWeight: '800', color: '#FFF', marginBottom: 20, textAlign: 'center' },
  modalItem: { flexDirection: 'row', alignItems: 'center', gap: 14, padding: 16, borderRadius: 14, marginBottom: 8, backgroundColor: '#0D0D1A' },
  modalItemActive: { borderWidth: 1.5, borderColor: '#FF4D6D', backgroundColor: '#1F1520' },
  modalFlag: { fontSize: 24 },
  modalName: { fontSize: 16, fontWeight: '600', color: '#FFF', flex: 1 },
  check: { fontSize: 16, color: '#FF4D6D', fontWeight: '800' },
});
