import React, { useCallback, useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialIcons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { colors } from '../theme/colors';
import { F } from '../theme/fonts';
import { UserProfile, Language } from '../types';
import { tryParseJson } from '../services/json';
import { SUPPORTED_LANGUAGES } from '../data/scenarios';
import EditProfileModal from '../components/EditProfileModal';

type Props = {
  onBack: () => void;
  onOpenScenarios: () => void;
  onOpenProgress: () => void;
  onRevisitIntro: () => void;
};

function shortId(profile: UserProfile): string {
  const raw = `${profile.nativeLanguage.code}-${profile.language.code}-${(profile.xp ?? 0)}`;
  return String(raw.split('').reduce((a, c) => a + c.charCodeAt(0), 0)).slice(0, 8);
}

export default function AccountScreen({ onBack, onOpenScenarios, onOpenProgress, onRevisitIntro }: Props) {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [editOpen, setEditOpen] = useState(false);
  const [langOpen, setLangOpen] = useState(false);

  const load = useCallback(async () => {
    const raw = await AsyncStorage.getItem('userProfile');
    const p = raw ? tryParseJson<UserProfile>(raw) : null;
    setProfile(p);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const persist = async (next: UserProfile) => {
    await AsyncStorage.setItem('userProfile', JSON.stringify(next));
    setProfile(next);
  };

  const display = profile?.displayName?.trim() || profile?.identity?.goal?.slice(0, 28) || 'Öğrenci';

  return (
    <SafeAreaView style={styles.root} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={onBack} hitSlop={12} accessibilityLabel="Geri">
          <MaterialIcons name="arrow-back" size={24} color={colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Hesap</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <View style={styles.profileBlock}>
          <View style={styles.bigAvatar}>
            <MaterialIcons name="person" size={44} color={colors.textMuted} />
          </View>
          <Text style={styles.name}>{display}</Text>
          <Text style={styles.idLine}>ID: {profile ? shortId(profile) : '—'}</Text>
        </View>

        <LinearGradient
          colors={[colors.primaryAccent, colors.primaryAccentPressed]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.promo}
        >
          <View style={{ flex: 1 }}>
            <Text style={styles.promoTitle}>Roleo Plus</Text>
            <Text style={styles.promoSub}>Ek pratik modları ve öncelikli güncellemeler yakında.</Text>
          </View>
          <MaterialIcons name="emoji-events" size={28} color={colors.textOnAccent} />
        </LinearGradient>

        <Text style={styles.sectionLabel}>Öğrenme</Text>
        <View style={styles.card}>
          <Row icon="forum" title="Sahneler" onPress={onOpenScenarios} />
          <Row icon="trending-up" title="İlerleme" onPress={onOpenProgress} />
        </View>

        <Text style={styles.sectionLabel}>Hesap</Text>
        <View style={styles.card}>
          <Row icon="edit" title="Profili düzenle" onPress={() => setEditOpen(true)} />
          <Row icon="language" title="Öğrenme dili" subtitle={profile?.language.name} onPress={() => setLangOpen(true)} />
        </View>

        <Text style={styles.sectionLabel}>Ayarlar</Text>
        <View style={styles.card}>
          <Row icon="slideshow" title="Tanıtımı tekrar izle" onPress={onRevisitIntro} />
          <Row icon="help-outline" title="Yardım merkezi" onPress={() => {}} />
        </View>
      </ScrollView>

      <EditProfileModal
        visible={editOpen}
        profile={profile}
        onClose={() => setEditOpen(false)}
        onSave={async fields => {
          if (!profile) return;
          await persist({ ...profile, ...fields });
        }}
      />

      <Modal visible={langOpen} transparent animationType="slide" onRequestClose={() => setLangOpen(false)}>
        <View style={styles.langModalRoot}>
          <TouchableOpacity style={styles.langBackdrop} activeOpacity={1} onPress={() => setLangOpen(false)} />
          <View style={styles.langSheet}>
            <Text style={styles.langTitle}>Öğrenme dili</Text>
            <ScrollView showsVerticalScrollIndicator={false}>
              {SUPPORTED_LANGUAGES.map((lang: Language) => (
                <TouchableOpacity
                  key={lang.code}
                  style={[styles.langRow, profile?.language.code === lang.code && styles.langRowActive]}
                  onPress={async () => {
                    if (!profile) return;
                    await persist({ ...profile, language: lang });
                    setLangOpen(false);
                  }}
                >
                  <Text style={styles.langFlag}>{lang.flag}</Text>
                  <Text style={styles.langName}>{lang.name}</Text>
                  {profile?.language.code === lang.code ? (
                    <MaterialIcons name="check" size={20} color={colors.primaryAccent} />
                  ) : null}
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

function Row({
  icon,
  title,
  subtitle,
  onPress,
}: {
  icon: React.ComponentProps<typeof MaterialIcons>['name'];
  title: string;
  subtitle?: string;
  onPress: () => void;
}) {
  return (
    <TouchableOpacity style={styles.row} onPress={onPress} activeOpacity={0.88}>
      <View style={styles.rowIcon}>
        <MaterialIcons name={icon} size={20} color={colors.primaryAccent} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={styles.rowTitle}>{title}</Text>
        {subtitle ? <Text style={styles.rowSub}>{subtitle}</Text> : null}
      </View>
      <MaterialIcons name="chevron-right" size={22} color={colors.textMuted} />
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.cream },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.primaryBorder,
  },
  headerTitle: { fontFamily: F.bold, fontSize: 20, color: colors.textPrimary },
  scroll: { padding: 20, paddingBottom: 40 },
  profileBlock: { alignItems: 'center', marginBottom: 20 },
  bigAvatar: {
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.primaryBorder,
    alignItems: 'center',
    justifyContent: 'center',
  },
  name: { fontFamily: F.bold, fontSize: 20, color: colors.textPrimary, marginTop: 12 },
  idLine: { fontFamily: F.regular, fontSize: 13, color: colors.textMuted, marginTop: 4 },
  promo: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 16,
    padding: 16,
    marginBottom: 24,
    gap: 12,
  },
  promoTitle: { fontFamily: F.bold, fontSize: 16, color: colors.textOnAccent },
  promoSub: { fontFamily: F.regular, fontSize: 13, color: 'rgba(255,253,248,0.88)', marginTop: 4, maxWidth: '88%' },
  sectionLabel: {
    fontFamily: F.semibold,
    fontSize: 13,
    color: colors.textMuted,
    marginBottom: 8,
    marginLeft: 4,
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.primaryBorder,
    marginBottom: 20,
    overflow: 'hidden',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.divider,
  },
  rowIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: colors.primaryAccentSoft,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  rowTitle: { fontFamily: F.medium, fontSize: 15, color: colors.textPrimary },
  rowSub: { fontFamily: F.regular, fontSize: 12, color: colors.textMuted, marginTop: 2 },
  langModalRoot: { flex: 1, justifyContent: 'flex-end' },
  langBackdrop: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.35)' },
  langSheet: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: 18,
    borderTopRightRadius: 18,
    padding: 20,
    maxHeight: '72%',
  },
  langTitle: { fontFamily: F.bold, fontSize: 18, marginBottom: 12, color: colors.textPrimary, textAlign: 'center' },
  langRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderRadius: 12,
    marginBottom: 8,
    backgroundColor: colors.surfaceMuted,
  },
  langRowActive: { borderWidth: 1.5, borderColor: colors.primaryAccent },
  langFlag: { fontSize: 22, marginRight: 12 },
  langName: { flex: 1, fontFamily: F.medium, fontSize: 16, color: colors.textPrimary },
});
