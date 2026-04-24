import React, { useEffect, useMemo, useRef, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, TextInput } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Speech from 'expo-speech';
import { UserProfile } from '../types';
import { tryParseJson } from '../services/json';
import { colors } from '../theme/colors';
import {
  NumberRange,
  PronunciationCategory,
  PronunciationItem,
  WordTopic,
  getLetterItems,
  getNumberRanges,
  getNumberItems,
  getSpeechLocale,
  getWordTopics,
  getWordItems,
} from '../data/pronunciation';

type Props = {
  onBack: () => void;
};

const TABS: Array<{ id: PronunciationCategory; title: string }> = [
  { id: 'letters', title: 'Harfler' },
  { id: 'words', title: 'Kelimeler' },
  { id: 'numbers', title: 'Sayılar' },
];

const WORD_TOPIC_ICONS: Record<WordTopic, string> = {
  basics: '🧩',
  animals: '🐾',
  fruits: '🍎',
  nature: '🌿',
  aviation: '✈️',
  conversation: '💬',
  travel: '🧳',
  food: '🍽️',
};

const RANGE_ICONS: Record<NumberRange, string> = {
  '0-100': '🔢',
  '101-200': '📈',
  '201-300': '🧠',
  '301-400': '🚀',
};

export default function PronunciationScreen({ onBack }: Props) {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [tab, setTab] = useState<PronunciationCategory>('letters');
  const [wordTopic, setWordTopic] = useState<WordTopic>('basics');
  const [numberRange, setNumberRange] = useState<NumberRange>('0-100');
  const [query, setQuery] = useState('');
  const [wordDefinitions, setWordDefinitions] = useState<Record<string, string | null>>({});
  const requestedWordsRef = useRef<Set<string>>(new Set());

  useEffect(() => {
    const load = async () => {
      const raw = await AsyncStorage.getItem('userProfile');
      if (!raw) return;
      const parsed = tryParseJson<UserProfile>(raw);
      if (parsed) setProfile(parsed);
    };
    load();
  }, []);

  const targetCode = profile?.language.code ?? 'en';
  const nativeCode = profile?.nativeLanguage.code ?? 'tr';
  const locale = getSpeechLocale(targetCode);

  const topicOptions = useMemo(() => getWordTopics(nativeCode), [nativeCode]);
  const rangeOptions = useMemo(() => getNumberRanges(), []);

  const allItems = useMemo<PronunciationItem[]>(() => {
    if (tab === 'letters') return getLetterItems(nativeCode);
    if (tab === 'numbers') return getNumberItems(nativeCode, numberRange);
    return getWordItems(nativeCode, wordTopic);
  }, [tab, nativeCode, numberRange, wordTopic]);

  const filtered = useMemo(() => {
    const q = query.trim().toLocaleLowerCase();
    if (!q) return allItems;
    return allItems.filter((item) =>
      item.text.toLocaleLowerCase().includes(q) || item.meaning.toLocaleLowerCase().includes(q),
    );
  }, [allItems, query]);

  const toDictionaryKey = (text: string): string | null => {
    const token = text
      .toLocaleLowerCase()
      .trim()
      .split(' ')[0]
      .replace(/[^a-z'-]/g, '');
    return token.length > 0 ? token : null;
  };

  const pickDefinition = (data: unknown): string | null => {
    if (!Array.isArray(data)) return null;
    const first = data[0] as { meanings?: Array<{ definitions?: Array<{ definition?: string }> }> };
    if (!first?.meanings) return null;
    for (const meaning of first.meanings) {
      if (!Array.isArray(meaning.definitions)) continue;
      for (const d of meaning.definitions) {
        const text = d?.definition?.trim();
        if (text) return text;
      }
    }
    return null;
  };

  useEffect(() => {
    if (tab !== 'words') return;
    const candidates = filtered
      .slice(0, 24)
      .map((item) => toDictionaryKey(item.speakText ?? item.text))
      .filter((key): key is string => Boolean(key));

    candidates.forEach((word) => {
      if (wordDefinitions[word] !== undefined) return;
      if (requestedWordsRef.current.has(word)) return;
      requestedWordsRef.current.add(word);

      fetch(`https://api.dictionaryapi.dev/api/v2/entries/en/${encodeURIComponent(word)}`)
        .then((res) => (res.ok ? res.json() : null))
        .then((data) => {
          const definition = pickDefinition(data);
          setWordDefinitions((prev) => ({ ...prev, [word]: definition }));
        })
        .catch(() => {
          setWordDefinitions((prev) => ({ ...prev, [word]: null }));
        });
    });
  }, [filtered, tab, wordDefinitions]);

  const speak = (text: string) => {
    Speech.stop();
    Speech.speak(text, {
      language: locale,
      rate: 0.9,
      pitch: 1,
    });
  };

  return (
    <View style={styles.container}>
      <TouchableOpacity onPress={onBack} style={styles.fixedBackBtn}>
        <Text style={styles.fixedBackText}>←</Text>
      </TouchableOpacity>

      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scroll}>
        <View style={styles.header}>
          <Text style={styles.title}>Pronunciation</Text>
          <Text style={styles.subtitle}>{profile?.language.flag} {profile?.language.name} • bugünkü sahne öncesi dinle ve tekrar et</Text>
        </View>

        <View style={styles.tabRow}>
          {TABS.map((t) => {
            const active = tab === t.id;
            return (
              <TouchableOpacity key={t.id} onPress={() => setTab(t.id)} style={[styles.tabBtn, active && styles.tabBtnActive]}>
                <Text style={[styles.tabText, active && styles.tabTextActive]}>{t.title}</Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {tab === 'words' ? (
          <View style={styles.subTabBleed}>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.subTabRow}>
              {topicOptions.map((topic) => {
                const active = topic.id === wordTopic;
                return (
                  <TouchableOpacity
                    key={topic.id}
                    onPress={() => setWordTopic(topic.id)}
                    style={[styles.subTabBtn, active && styles.subTabBtnActive]}
                  >
                    <Text style={[styles.subTabText, active && styles.subTabTextActive]}>
                      {WORD_TOPIC_ICONS[topic.id]} {topic.title}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </View>
        ) : null}

        {tab === 'numbers' ? (
          <View style={styles.subTabBleed}>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.subTabRow}>
              {rangeOptions.map((range) => {
                const active = range.id === numberRange;
                return (
                  <TouchableOpacity
                    key={range.id}
                    onPress={() => setNumberRange(range.id)}
                    style={[styles.subTabBtn, active && styles.subTabBtnActive]}
                  >
                    <Text style={[styles.subTabText, active && styles.subTabTextActive]}>
                      {RANGE_ICONS[range.id]} {range.title}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </View>
        ) : null}

        <TextInput
          value={query}
          onChangeText={setQuery}
          placeholder="Kelime ara (anadilin veya hedef dilde)"
          placeholderTextColor={colors.textMuted}
          style={styles.searchInput}
          autoCapitalize="none"
          autoCorrect={false}
        />

        <View style={styles.grid}>
          {filtered.map((item) => {
            const key = toDictionaryKey(item.speakText ?? item.text);
            const definition = tab === 'words' && key ? wordDefinitions[key] : null;

            return (
              <TouchableOpacity key={item.id} style={styles.card} onPress={() => speak(item.speakText ?? item.text)} activeOpacity={0.88}>
                <Text style={styles.cardText}>{item.text}</Text>
                <Text style={styles.cardMeaning}>{item.meaning}</Text>
                {tab === 'words' && definition ? (
                  <Text style={styles.cardDefinition} numberOfLines={2}>
                    {definition}
                  </Text>
                ) : null}
                <View style={styles.speakerWrap}>
                  <Text style={styles.speakerIcon}>🔊</Text>
                </View>
              </TouchableOpacity>
            );
          })}
        </View>

        {filtered.length === 0 ? (
          <View style={styles.emptyWrap}>
            <Text style={styles.emptyText}>Aradığın içerik bulunamadı.</Text>
          </View>
        ) : null}

        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  scrollView: { flex: 1 },
  scroll: { paddingHorizontal: 20, paddingTop: 96, paddingBottom: 24 },
  fixedBackBtn: {
    position: 'absolute',
    top: 52,
    left: 20,
    zIndex: 100,
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: colors.surface,
    borderColor: colors.primaryBorder,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  fixedBackText: { fontSize: 20, color: colors.textPrimary },
  header: { marginBottom: 14, paddingLeft: 52 },
  title: { color: colors.textPrimary, fontSize: 30, fontWeight: '900', fontFamily: 'Poppins_700Bold' },
  subtitle: { color: colors.textSecondary, fontSize: 13, marginTop: 4 },
  tabRow: { flexDirection: 'row', gap: 8, marginBottom: 12 },
  tabBtn: {
    flex: 1,
    backgroundColor: colors.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.primaryBorder,
    paddingVertical: 10,
    alignItems: 'center',
  },
  tabBtnActive: { backgroundColor: colors.primaryAccentSoft, borderColor: colors.primaryAccent },
  tabText: { color: colors.textSecondary, fontSize: 13, fontWeight: '700' },
  tabTextActive: { color: colors.primaryAccent },
  searchInput: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.primaryBorder,
    paddingHorizontal: 14,
    paddingVertical: 11,
    color: colors.textPrimary,
    fontSize: 14,
    marginBottom: 12,
  },
  /** Counteracts `scroll` horizontal padding so topic/range chips span full screen width. */
  subTabBleed: {
    marginHorizontal: -20,
    alignSelf: 'stretch',
  },
  subTabRow: {
    gap: 8,
    paddingBottom: 10,
    paddingHorizontal: 12,
  },
  subTabBtn: {
    backgroundColor: colors.surface,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: colors.primaryBorder,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  subTabBtnActive: {
    backgroundColor: colors.primaryAccentSoft,
    borderColor: colors.primaryAccent,
  },
  subTabText: { color: colors.textSecondary, fontSize: 12, fontWeight: '700' },
  subTabTextActive: { color: colors.primaryAccent },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  card: {
    width: '47%',
    backgroundColor: colors.surface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.primaryBorder,
    padding: 14,
    minHeight: 130,
    justifyContent: 'space-between',
  },
  cardText: { color: colors.textPrimary, fontSize: 22, fontWeight: '900', fontFamily: 'Poppins_700Bold' },
  cardMeaning: { color: colors.textSecondary, fontSize: 12, marginTop: 4 },
  cardDefinition: { color: colors.textMuted, fontSize: 11, marginTop: 6, lineHeight: 15 },
  speakerWrap: { marginTop: 10, alignSelf: 'flex-end' },
  speakerIcon: { fontSize: 18 },
  emptyWrap: { marginTop: 24, alignItems: 'center' },
  emptyText: { color: colors.textMuted, fontSize: 13 },
});
