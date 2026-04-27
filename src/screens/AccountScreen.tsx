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
import Feather from '@expo/vector-icons/Feather';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { colors } from '../theme/colors';
import { F } from '../theme/fonts';
import { UserProfile, Language } from '../types';
import { tryParseJson } from '../services/json';
import { SUPPORTED_LANGUAGES } from '../data/scenarios';
import EditProfileModal from '../components/EditProfileModal';
import { useAppTranslation } from '../i18n';

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
  const t = useAppTranslation();
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

  const display = profile?.displayName?.trim() || profile?.identity?.goal?.slice(0, 28) || t('account.student');

  return (
    <SafeAreaView style={styles.root} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={onBack} hitSlop={12} accessibilityLabel={t('common.back')}>
          <Feather name="arrow-left" size={24} color={colors.inkPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{t('account.title')}</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <View style={styles.profileBlock}>
          <View style={styles.bigAvatar}>
            <Feather name="user" size={44} color={colors.inkTertiary} />
          </View>
          <Text style={styles.name}>{display}</Text>
          <Text style={styles.idLine}>ID: {profile ? shortId(profile) : '—'}</Text>
        </View>

        <LinearGradient
          colors={[colors.accentWarm, colors.accentWarmSoft]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.promo}
        >
          <View style={{ flex: 1 }}>
            <Text style={styles.promoTitle}>Roleo Plus</Text>
            <Text style={styles.promoSub}>{t('account.plusSub')}</Text>
          </View>
          <Feather name="award" size={28} color={colors.bgDeep} />
        </LinearGradient>

        <Text style={styles.sectionLabel}>{t('account.learning')}</Text>
        <View style={styles.card}>
          <Row icon="message-circle" title={t('account.scenes')} onPress={onOpenScenarios} />
          <Row icon="trending-up" title={t('account.progress')} onPress={onOpenProgress} />
        </View>

        <Text style={styles.sectionLabel}>{t('account.account')}</Text>
        <View style={styles.card}>
          <Row icon="edit" title={t('account.editProfile')} onPress={() => setEditOpen(true)} />
          <Row icon="globe" title={t('account.learningLanguage')} subtitle={profile?.language.name} onPress={() => setLangOpen(true)} />
        </View>

        <Text style={styles.sectionLabel}>{t('account.settings')}</Text>
        <View style={styles.card}>
          <Row icon="play" title={t('account.revisitIntro')} onPress={onRevisitIntro} />
          <Row icon="help-circle" title={t('account.help')} onPress={() => {}} />
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
            <Text style={styles.langTitle}>{t('account.learningLanguage')}</Text>
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
                    <Feather name="check" size={20} color={colors.accentWarm} />
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
  icon: string;
  title: string;
  subtitle?: string;
  onPress: () => void;
}) {
  return (
    <TouchableOpacity style={styles.row} onPress={onPress} activeOpacity={0.88}>
      <View style={styles.rowIcon}>
        <Feather name={icon as any} size={20} color={colors.accentWarm} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={styles.rowTitle}>{title}</Text>
        {subtitle ? <Text style={styles.rowSub}>{subtitle}</Text> : null}
      </View>
      <Feather name="chevron-right" size={22} color={colors.inkTertiary} />
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bgDeep },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.hairlineStrong,
  },
  headerTitle: { fontFamily: F.bold, fontSize: 20, color: colors.inkPrimary },
  scroll: { padding: 20, paddingBottom: 40 },
  profileBlock: { alignItems: 'center', marginBottom: 20 },
  bigAvatar: {
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: colors.bgMid,
    borderWidth: 1,
    borderColor: colors.hairlineStrong,
    alignItems: 'center',
    justifyContent: 'center',
  },
  name: { fontFamily: F.bold, fontSize: 20, color: colors.inkPrimary, marginTop: 12 },
  idLine: { fontFamily: F.regular, fontSize: 13, color: colors.inkTertiary, marginTop: 4 },
  promo: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 16,
    padding: 16,
    marginBottom: 24,
    gap: 12,
  },
  promoTitle: { fontFamily: F.bold, fontSize: 16, color: colors.bgDeep },
  promoSub: { fontFamily: F.regular, fontSize: 13, color: 'rgba(255,253,248,0.88)', marginTop: 4, maxWidth: '88%' },
  sectionLabel: {
    fontFamily: F.semibold,
    fontSize: 13,
    color: colors.inkTertiary,
    marginBottom: 8,
    marginLeft: 4,
  },
  card: {
    backgroundColor: colors.bgMid,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.hairlineStrong,
    marginBottom: 20,
    overflow: 'hidden',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.hairline,
  },
  rowIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: colors.bgSoft,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  rowTitle: { fontFamily: F.medium, fontSize: 15, color: colors.inkPrimary },
  rowSub: { fontFamily: F.regular, fontSize: 12, color: colors.inkTertiary, marginTop: 2 },
  langModalRoot: { flex: 1, justifyContent: 'flex-end' },
  langBackdrop: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.35)' },
  langSheet: {
    backgroundColor: colors.bgMid,
    borderTopLeftRadius: 18,
    borderTopRightRadius: 18,
    padding: 20,
    maxHeight: '72%',
  },
  langTitle: { fontFamily: F.bold, fontSize: 18, marginBottom: 12, color: colors.inkPrimary, textAlign: 'center' },
  langRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderRadius: 12,
    marginBottom: 8,
    backgroundColor: colors.bgMid,
  },
  langRowActive: { borderWidth: 1.5, borderColor: colors.accentWarm },
  langFlag: { fontSize: 22, marginRight: 12 },
  langName: { flex: 1, fontFamily: F.medium, fontSize: 16, color: colors.inkPrimary },
});
