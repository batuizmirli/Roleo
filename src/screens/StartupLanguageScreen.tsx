import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, ActivityIndicator } from 'react-native';
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
    <ScrollView style={styles.container} contentContainerStyle={styles.scroll}>
      <Text style={styles.logo}>Roleo</Text>
      <Text style={styles.title}>Ana dilin hangisi?</Text>
      <Text style={styles.subtitle}>Öğrenme açıklamalarını bu dilde göstereceğim.</Text>

      <View style={styles.grid}>
        {NATIVE_LANGUAGES.map(lang => (
          <TouchableOpacity
            key={lang.code}
            style={[styles.card, selected?.code === lang.code && styles.cardActive]}
            onPress={() => setSelected(lang)}
            activeOpacity={0.85}
          >
            <Text style={styles.flag}>{lang.flag}</Text>
            <Text style={styles.name}>{lang.name}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <TouchableOpacity style={[styles.button, !selected && styles.buttonDisabled]} onPress={handleContinue} disabled={!selected || saving}>
        <Text style={styles.buttonText}>{saving ? 'Kaydediliyor...' : 'Devam Et →'}</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  scroll: { paddingHorizontal: 24, paddingTop: 64, paddingBottom: 40 },
  loadingWrap: { flex: 1, backgroundColor: colors.background, alignItems: 'center', justifyContent: 'center' },
  logo: { fontSize: 30, fontWeight: '900', color: colors.textPrimary, letterSpacing: -0.3, marginBottom: 20, fontFamily: 'PlayfairDisplay_900Black' },
  title: { fontSize: 28, fontWeight: '800', color: colors.textPrimary, marginBottom: 8, fontFamily: 'PlayfairDisplay_700Bold' },
  subtitle: { fontSize: 15, color: colors.textSecondary, marginBottom: 32, lineHeight: 22 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  card: {
    width: '47%',
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    borderWidth: 1.5,
    borderColor: colors.primaryBorder,
    shadowColor: '#2F241B',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 2,
  },
  cardActive: { borderColor: colors.primaryAccent, backgroundColor: colors.primaryAccentSoft },
  flag: { fontSize: 22 },
  name: { fontSize: 14, fontWeight: '700', color: colors.textPrimary, flex: 1 },
  button: {
    marginTop: 28,
    backgroundColor: colors.primaryAccent,
    borderRadius: 16,
    paddingVertical: 18,
    alignItems: 'center',
    shadowColor: colors.primaryAccent,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.18,
    shadowRadius: 12,
    elevation: 5,
  },
  buttonDisabled: { opacity: 0.3 },
  buttonText: { color: colors.textOnAccent, fontSize: 16, fontWeight: '800', letterSpacing: 0.3 },
});
