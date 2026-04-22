import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Language, UserProfile } from '../types';
import { tryParseJson } from '../services/json';
import { colors } from '../theme/colors';

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

type Props = {
  onComplete: () => void;
  onReset: () => void;
};

export default function StartupLanguageScreen({ onComplete, onReset }: Props) {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [selected, setSelected] = useState<Language | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

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

  const handleContinue = async () => {
    if (!profile || !selected || saving) return;
    setSaving(true);

    const updated: UserProfile = {
      ...profile,
      nativeLanguage: selected,
    };

    await AsyncStorage.setItem('userProfile', JSON.stringify(updated));
    onComplete();
  };

  if (loading) {
    return (
      <View style={styles.loadingWrap}>
        <ActivityIndicator size="large" color={colors.primaryAccent} />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={styles.headerBlock}>
          <Text style={styles.title}>Ana dilin hangisi?</Text>
          <Text style={styles.subtitle}>Deneyimi sana göre kurmak için anadilini seç.</Text>
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

      <View style={styles.bottomAction}>
        <TouchableOpacity
          style={[styles.button, (!selected || saving) && styles.buttonDisabled]}
          onPress={handleContinue}
          disabled={!selected || saving}
          activeOpacity={0.9}
        >
          <Text style={styles.buttonText}>{saving ? 'Kaydediliyor...' : 'Devam Et'}</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FCF9F8' },
  loadingWrap: { flex: 1, backgroundColor: colors.background, alignItems: 'center', justifyContent: 'center' },
  scroll: { flex: 1 },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 14,
    paddingBottom: 20,
    alignItems: 'center',
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
    color: '#1B1C1C',
    marginBottom: 8,
    fontFamily: 'NotoSerif_600SemiBold',
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 14,
    lineHeight: 21,
    color: '#53433E',
    textAlign: 'center',
    fontFamily: 'Manrope_500Medium',
    maxWidth: 300,
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
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: 'rgba(216,194,186,0.35)',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    shadowColor: '#333333',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  cardActive: {
    borderWidth: 2,
    borderColor: '#884C32',
    backgroundColor: '#FFFBF8',
  },
  flagWrap: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#FFFFFF',
    borderWidth: 3,
    borderColor: '#FCF9F8',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#333333',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 3,
  },
  flagWrapActive: {
    borderColor: '#F3E2D7',
  },
  flag: { fontSize: 28 },
  name: {
    fontSize: 13,
    fontFamily: 'Manrope_600SemiBold',
  },
  nameActive: { color: '#1B1C1C' },
  nameInactive: { color: '#53433E' },
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
    backgroundColor: 'rgba(252, 249, 248, 0.93)',
  },
  button: {
    backgroundColor: '#884C32',
    borderRadius: 999,
    paddingVertical: 16,
    alignItems: 'center',
    shadowColor: '#884C32',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.20,
    shadowRadius: 12,
    elevation: 5,
  },
  buttonDisabled: { opacity: 0.4 },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 14,
    letterSpacing: 0.3,
    fontFamily: 'Manrope_600SemiBold',
  },
});
