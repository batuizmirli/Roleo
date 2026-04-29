import React, { useEffect, useMemo, useRef, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, TextInput, Animated, Easing } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Speech from 'expo-speech';
import { UserProfile } from '../types';
import { tryParseJson } from '../services/json';
import { colors } from '../theme/colors';
import {
  DetailTopic,
  PronunciationCategory,
  PronunciationItem,
  WordTopic,
  getDetailItems,
  getDetailTopics,
  getSentenceItems,
  getSpeechLocale,
  getSoundItems,
  getWordTopics,
  getWordItems,
} from '../data/pronunciation';

type Props = {
  onBack: () => void;
};

const TABS: Array<{ id: PronunciationCategory; title: string }> = [
  { id: 'sounds', title: 'Sesler' },
  { id: 'words', title: 'Kelimeler' },
  { id: 'sentences', title: 'Cümleler' },
  { id: 'details', title: 'Detaylar' },
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

const DETAIL_TOPIC_ICONS: Record<DetailTopic, string> = {
  time: '🕰️',
  prices: '💶',
  places: '🚪',
  codes: '🔖',
};

export default function PronunciationScreen({ onBack }: Props) {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [tab, setTab] = useState<PronunciationCategory>('sounds');
  const [wordTopic, setWordTopic] = useState<WordTopic>('basics');
  const [detailTopic, setDetailTopic] = useState<DetailTopic>('time');
  const [query, setQuery] = useState('');
  const [wordDefinitions, setWordDefinitions] = useState<Record<string, string | null>>({});
  const requestedWordsRef = useRef<Set<string>>(new Set());
  const subNavEntrance = useRef(new Animated.Value(1)).current;
  const gridPanelEntrance = useRef(new Animated.Value(1)).current;

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
  const detailOptions = useMemo(() => getDetailTopics(nativeCode), [nativeCode]);

  useEffect(() => {
    subNavEntrance.setValue(0);
    Animated.timing(subNavEntrance, {
      toValue: 1,
      duration: 420,
      easing: Easing.bezier(0.16, 1, 0.3, 1),
      useNativeDriver: true,
    }).start();
  }, [tab, subNavEntrance]);

  useEffect(() => {
    gridPanelEntrance.setValue(0);
    Animated.timing(gridPanelEntrance, {
      toValue: 1,
      duration: 520,
      easing: Easing.bezier(0.16, 1, 0.3, 1),
      useNativeDriver: true,
    }).start();
  }, [tab, wordTopic, detailTopic, query, gridPanelEntrance]);

  const allItems = useMemo<PronunciationItem[]>(() => {
    if (tab === 'sounds') return getSoundItems(targetCode, nativeCode);
    if (tab === 'sentences') return getSentenceItems(targetCode, nativeCode);
    if (tab === 'details') return getDetailItems(targetCode, nativeCode, detailTopic);
    return getWordItems(targetCode, nativeCode, wordTopic);
  }, [tab, targetCode, nativeCode, detailTopic, wordTopic]);

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
    if (targetCode !== 'en') return;
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
  }, [filtered, tab, targetCode, wordDefinitions]);

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
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scroll}>
        <View style={styles.header}>
          <Text style={styles.title}>Telaffuz</Text>
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
          <Animated.View
            style={[
              styles.subTabBleed,
              {
                opacity: subNavEntrance,
                transform: [{
                  translateY: subNavEntrance.interpolate({ inputRange: [0, 1], outputRange: [-18, 0] }),
                }],
              },
            ]}
          >
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
          </Animated.View>
        ) : null}

        {tab === 'details' ? (
          <Animated.View
            style={[
              styles.subTabBleed,
              {
                opacity: subNavEntrance,
                transform: [{
                  translateY: subNavEntrance.interpolate({ inputRange: [0, 1], outputRange: [-18, 0] }),
                }],
              },
            ]}
          >
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.subTabRow}>
              {detailOptions.map((topic) => {
                const active = topic.id === detailTopic;
                return (
                  <TouchableOpacity
                    key={topic.id}
                    onPress={() => setDetailTopic(topic.id)}
                    style={[styles.subTabBtn, active && styles.subTabBtnActive]}
                  >
                    <Text style={[styles.subTabText, active && styles.subTabTextActive]}>
                      {DETAIL_TOPIC_ICONS[topic.id]} {topic.title}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </Animated.View>
        ) : null}

        <TextInput
          value={query}
          onChangeText={setQuery}
          placeholder="Kelime ara (anadilin veya hedef dilde)"
          placeholderTextColor={colors.inkTertiary}
          style={styles.searchInput}
          autoCapitalize="none"
          autoCorrect={false}
        />

        <Animated.View
          style={[
            styles.gridPanel,
            {
              opacity: gridPanelEntrance,
              transform: [{
                translateY: gridPanelEntrance.interpolate({ inputRange: [0, 1], outputRange: [-16, 0] }),
              }],
            },
          ]}
        >
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
        </Animated.View>

        {filtered.length === 0 ? (
          <View style={styles.emptyWrap}>
            <Text style={styles.emptyText}>Aradığın içerik bulunamadı.</Text>
          </View>
        ) : null}

        <View style={{ height: 40 }} />
      </ScrollView>
      <TouchableOpacity onPress={onBack} style={styles.fixedBackBtn}>
        <Text style={styles.fixedBackText}>←</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bgDeep },
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
    backgroundColor: colors.bgMid,
    borderColor: colors.hairlineStrong,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  fixedBackText: { fontSize: 20, color: colors.inkPrimary },
  header: { marginBottom: 14, paddingLeft: 52 },
  title: { color: colors.inkPrimary, fontSize: 28, fontFamily: 'Fraunces_300Light', letterSpacing: -0.4 },
  subtitle: { color: colors.inkSecondary, fontSize: 13, marginTop: 4, fontFamily: 'InterTight_400Regular' },
  tabRow: { flexDirection: 'row', gap: 8, marginBottom: 12 },
  tabBtn: {
    flex: 1,
    backgroundColor: colors.bgMid,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.hairlineStrong,
    paddingVertical: 10,
    alignItems: 'center',
  },
  tabBtnActive: { backgroundColor: colors.bgSoft, borderColor: colors.accentWarm },
  tabText: { color: colors.inkSecondary, fontSize: 13, fontFamily: 'InterTight_500Medium' },
  tabTextActive: { color: colors.accentWarm },
  searchInput: {
    backgroundColor: colors.bgMid,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.hairlineStrong,
    paddingHorizontal: 14,
    paddingVertical: 11,
    color: colors.inkPrimary,
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
    backgroundColor: colors.bgMid,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: colors.hairlineStrong,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  subTabBtnActive: {
    backgroundColor: colors.bgSoft,
    borderColor: colors.accentWarm,
  },
  subTabText: { color: colors.inkSecondary, fontSize: 12, fontFamily: 'InterTight_500Medium' },
  subTabTextActive: { color: colors.accentWarm },
  gridPanel: {
    backgroundColor: 'rgba(18,24,34,0.62)',
    borderRadius: 22,
    borderWidth: 1,
    borderColor: colors.hairline,
    padding: 10,
    marginTop: 2,
    overflow: 'hidden',
  },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  card: {
    width: '48%',
    backgroundColor: colors.bgMid,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.hairlineStrong,
    padding: 14,
    minHeight: 130,
    justifyContent: 'space-between',
  },
  cardText: { color: colors.inkPrimary, fontSize: 22, fontFamily: 'Fraunces_300Light', letterSpacing: -0.3 },
  cardMeaning: { color: colors.inkSecondary, fontSize: 12, marginTop: 4, fontFamily: 'InterTight_400Regular' },
  cardDefinition: { color: colors.inkTertiary, fontSize: 11, marginTop: 6, lineHeight: 15 },
  speakerWrap: { marginTop: 10, alignSelf: 'flex-end' },
  speakerIcon: { fontSize: 18 },
  emptyWrap: { marginTop: 24, alignItems: 'center' },
  emptyText: { color: colors.inkTertiary, fontSize: 13 },
});
