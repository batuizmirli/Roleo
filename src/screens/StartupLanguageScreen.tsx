import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, ActivityIndicator, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Language, UserProfile } from '../types';
import { tryParseJson } from '../services/json';
import { colors } from '../theme/colors';
import { ALL_PRACTICE_TARGETS, type PracticeTarget } from '../data/practiceGoals';
import PracticeFocusGoalCard from '../components/PracticeFocusGoalCard';
import { createTranslator, getUiLanguageFromProfile } from '../i18n';

const NATIVE_LANGUAGES: Language[] = [
  { code: 'tr', name: 'Türkçe', flag: '🇹🇷' },
  { code: 'en', name: 'English', flag: '🇬🇧' },
  { code: 'de', name: 'Deutsch', flag: '🇩🇪' },
  { code: 'fr', name: 'Français', flag: '🇫🇷' },
  { code: 'es', name: 'Español', flag: '🇪🇸' },
  { code: 'it', name: 'Italiano', flag: '🇮🇹' },
  { code: 'pt', name: 'Português', flag: '🇧🇷' },
  { code: 'ru', name: 'Русский', flag: '🇷🇺' },
];

type Phase = 'native' | 'focus';

type Props = {
  onComplete: () => void;
  onReset: () => void;
  onSkip?: () => void;
};

export default function StartupLanguageScreen({ onComplete, onReset, onSkip }: Props) {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [selected, setSelected] = useState<Language | null>(null);
  const [phase, setPhase] = useState<Phase>('native');
  const [practiceTarget, setPracticeTarget] = useState<PracticeTarget | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const t = createTranslator(selected?.code ?? getUiLanguageFromProfile(profile));

  useEffect(() => {
    const load = async () => {
      const profileData = await AsyncStorage.getItem('userProfile');
      if (!profileData) {
        onReset();
        return;
      }

      const parsed = tryParseJson<UserProfile>(profileData);
      if (!parsed) {
        await AsyncStorage.removeItem('userProfile');
        onReset();
        return;
      }

      setProfile(parsed);
      setSelected(parsed.nativeLanguage ?? null);
      setLoading(false);
    };

    load();
  }, [onReset]);

  const goToFocusPhase = () => {
    if (!selected || !profile) return;
    const fromProfile = ALL_PRACTICE_TARGETS.find(t => t.label === profile.goalDescription?.trim()) ?? null;
    setPracticeTarget(fromProfile);
    setPhase('focus');
  };

  const saveAndFinish = async () => {
    if (!profile || !selected || saving) return;
    if (!practiceTarget) {
      Alert.alert(t('startup.selectGoalTitle'), t('startup.selectGoalMsg'));
      return;
    }
    setSaving(true);
    try {
      const updated: UserProfile = {
        ...profile,
        nativeLanguage: selected,
        goalDescription: practiceTarget.label,
      };
      await AsyncStorage.setItem('userProfile', JSON.stringify(updated));
      onComplete();
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingWrap}>
        <ActivityIndicator size="large" color={colors.accentWarm} />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {onSkip && (
        <TouchableOpacity style={styles.skipBtn} onPress={onSkip} activeOpacity={0.7}>
          <Text style={styles.skipText}>{t('common.skipHome')}</Text>
        </TouchableOpacity>
      )}
      {phase === 'native' ? (
        <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          <View style={styles.headerBlock}>
            <Text style={styles.title}>{t('startup.nativeTitle')}</Text>
            <Text style={styles.subtitle}>{t('startup.nativeSubtitle')}</Text>
          </View>

          <View style={styles.grid}>
            {NATIVE_LANGUAGES.map(lang => {
              const active = selected?.code === lang.code;
              return (
                <TouchableOpacity
                  key={lang.code}
                  style={[styles.card, active && styles.cardActive]}
                  onPress={() => setSelected(lang)}
                  activeOpacity={0.88}
                >
                  <View style={[styles.flagWrap, active && styles.flagWrapActive]}>
                    <Text style={styles.flag}>{lang.flag}</Text>
                  </View>
                  <Text style={[styles.name, active ? styles.nameActive : styles.nameInactive]}>{lang.name}</Text>
                </TouchableOpacity>
              );
            })}
          </View>

          <View style={styles.bottomSpacer} />
        </ScrollView>
      ) : (
        <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContentFocus} showsVerticalScrollIndicator={false}>
          <PracticeFocusGoalCard
            variant="startup"
            title={t('startup.focusTitle')}
            selected={practiceTarget}
            onSelect={setPracticeTarget}
          />
          <View style={styles.bottomSpacer} />
        </ScrollView>
      )}

      <View style={styles.bottomAction}>
        {phase === 'focus' ? (
          <TouchableOpacity
            style={[styles.secondaryBtn, saving && styles.buttonDisabled]}
            onPress={() => setPhase('native')}
            disabled={saving}
            activeOpacity={0.88}
          >
            <Text style={styles.secondaryBtnText}>{t('common.back')}</Text>
          </TouchableOpacity>
        ) : null}
        <TouchableOpacity
          style={[
            styles.button,
            ((!selected && phase === 'native') || (!practiceTarget && phase === 'focus') || saving) && styles.buttonDisabled,
          ]}
          onPress={phase === 'native' ? goToFocusPhase : saveAndFinish}
          disabled={
            saving || (phase === 'native' && !selected) || (phase === 'focus' && !practiceTarget)
          }
          activeOpacity={0.9}
        >
          <Text style={styles.buttonText}>{saving ? `${t('startup.save')}...` : (phase === 'focus' ? t('startup.save') : t('startup.next'))}</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bgDeep },
  skipBtn: { alignSelf: 'flex-end', paddingHorizontal: 20, paddingVertical: 12 },
  skipText: { fontSize: 13, color: '#9BA3AE', fontFamily: 'InterTight_400Regular' },
  loadingWrap: { flex: 1, backgroundColor: colors.bgDeep, alignItems: 'center', justifyContent: 'center' },
  scroll: { flex: 1 },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 14,
    paddingBottom: 20,
    alignItems: 'center',
  },
  scrollContentFocus: {
    paddingHorizontal: 20,
    paddingTop: 14,
    paddingBottom: 120,
    alignItems: 'stretch',
    maxWidth: 440,
    width: '100%',
    alignSelf: 'center',
  },
  headerBlock: {
    width: '100%',
    maxWidth: 380,
    alignItems: 'center',
    marginBottom: 24,
  },
  title: {
    fontSize: 34,
    lineHeight: 42,
    color: colors.inkPrimary,
    marginBottom: 8,
    fontFamily: 'Fraunces_300Light',
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 14,
    lineHeight: 21,
    color: colors.inkSecondary,
    textAlign: 'center',
    fontFamily: 'InterTight_500Medium',
    maxWidth: 320,
  },
  grid: {
    width: '100%',
    maxWidth: 380,
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    rowGap: 12,
  },
  card: {
    width: '48.3%',
    minHeight: 106,
    borderRadius: 22,
    backgroundColor: colors.bgMid,
    borderWidth: 1,
    borderColor: colors.hairlineStrong,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  cardActive: {
    borderWidth: 2,
    borderColor: colors.accentWarm,
    backgroundColor: colors.bgSoft,
  },
  flagWrap: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.bgMid,
    borderWidth: 3,
    borderColor: colors.bgDeep,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 3,
  },
  flagWrapActive: {
    borderColor: colors.accentWarm,
  },
  flag: { fontSize: 28 },
  name: {
    fontSize: 13,
    fontFamily: 'InterTight_600SemiBold',
  },
  nameActive: { color: colors.inkPrimary },
  nameInactive: { color: colors.inkSecondary },
  bottomSpacer: {
    height: 120,
    width: '100%',
  },
  bottomAction: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    paddingHorizontal: 20,
    paddingBottom: 20,
    paddingTop: 16,
    backgroundColor: colors.bgDeep,
    flexDirection: 'row',
    gap: 12,
    alignItems: 'center',
  },
  secondaryBtn: {
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderRadius: 999,
    borderWidth: 1.5,
    borderColor: colors.hairlineStrong,
    backgroundColor: colors.bgMid,
  },
  secondaryBtnText: {
    color: colors.accentWarm,
    fontSize: 14,
    fontFamily: 'InterTight_600SemiBold',
  },
  button: {
    backgroundColor: colors.inkPrimary,
    borderRadius: 999,
    paddingVertical: 16,
    alignItems: 'center',
    shadowColor: '#884C32',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 5,
    flex: 1,
  },
  buttonDisabled: { opacity: 0.4 },
  buttonText: {
    color: colors.bgDeep,
    fontSize: 14,
    letterSpacing: 0.3,
    fontFamily: 'InterTight_600SemiBold',
  },
});
