import React, { useEffect, useMemo, useRef, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Speech from 'expo-speech';
import { UserProfile } from '../types';
import { Scenario } from '../types';
import { tryParseJson } from '../services/json';
import { colors } from '../theme/colors';
import { getCulturalTips, CulturalTip } from '../data/culturalTips';
import { getSpeechLocale } from '../data/pronunciation';
import { getPersonalizedScenario } from '../data/scenarios';

type Props = {
  onBack: () => void;
  scenario?: Scenario;
};

export default function ListeningScreen({ onBack, scenario: propScenario }: Props) {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [scenario, setScenario] = useState<Scenario | null>(propScenario ?? null);
  const [playingId, setPlayingId] = useState<string | null>(null);
  const [activeTip, setActiveTip] = useState<CulturalTip | null>(null);
  const tipIndexRef = useRef(0);

  useEffect(() => {
    const load = async () => {
      const raw = await AsyncStorage.getItem('userProfile');
      if (!raw) return;
      const parsed = tryParseJson<UserProfile>(raw);
      if (!parsed) return;
      setProfile(parsed);
      if (!propScenario) {
        const s = getPersonalizedScenario(parsed.language?.code ?? 'es', parsed.identity);
        setScenario(s);
      }
    };
    load();
    return () => { Speech.stop(); };
  }, [propScenario]);

  const targetCode = profile?.language?.code ?? 'es';
  const locale = getSpeechLocale(targetCode);

  const culturalTips = useMemo(() => getCulturalTips(targetCode), [targetCode]);

  useEffect(() => {
    if (culturalTips.length > 0) {
      tipIndexRef.current = Math.floor(Math.random() * culturalTips.length);
      setActiveTip(culturalTips[tipIndexRef.current]);
    }
  }, [culturalTips]);

  const nextTip = () => {
    if (culturalTips.length === 0) return;
    tipIndexRef.current = (tipIndexRef.current + 1) % culturalTips.length;
    setActiveTip(culturalTips[tipIndexRef.current]);
  };

  const speak = (id: string, text: string) => {
    Speech.stop();
    setPlayingId(id);
    Speech.speak(text, {
      language: locale,
      rate: 0.85,
      pitch: 1,
      onDone: () => setPlayingId(null),
      onStopped: () => setPlayingId(null),
      onError: () => setPlayingId(null),
    });
  };

  const stopSpeech = () => {
    Speech.stop();
    setPlayingId(null);
  };

  const openingPreview = scenario?.openingMessage
    ? scenario.openingMessage.split('\n')[0].replace(/^\s*\*\s*/, '').trim()
    : null;

  const phrases = scenario?.usefulPhrases ?? [];
  const vocabHints = scenario?.vocabHints ?? [];

  return (
    <View style={styles.container}>
      <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollInner}>

        <View style={styles.header}>
          <Text style={styles.eyebrow}>DİNLEME</Text>
          <Text style={styles.title}>Sesi tanı,{'\n'}ritmi hisset.</Text>
          {scenario && (
            <Text style={styles.subtitle}>{scenario.title} · {scenario.location}</Text>
          )}
        </View>

        {/* NPC opening line */}
        {openingPreview ? (
          <View style={styles.section}>
            <Text style={styles.sectionLabel}>SAHNE AÇILIŞ TONU</Text>
            <View style={styles.npcCard}>
              <Text style={styles.npcText}>{openingPreview}</Text>
              <TouchableOpacity
                style={[styles.playBtn, playingId === 'opening' && styles.playBtnActive]}
                onPress={() => playingId === 'opening' ? stopSpeech() : speak('opening', openingPreview)}
                activeOpacity={0.8}
              >
                <Text style={styles.playIcon}>{playingId === 'opening' ? '■' : '▶'}</Text>
                <Text style={styles.playLabel}>{playingId === 'opening' ? 'Durdur' : 'Dinle'}</Text>
              </TouchableOpacity>
            </View>
          </View>
        ) : null}

        {/* Useful phrases */}
        {phrases.length > 0 ? (
          <View style={styles.section}>
            <Text style={styles.sectionLabel}>SAHNEDEKİ İFADELER</Text>
            {phrases.map((p, i) => (
              <View key={i} style={styles.phraseRow}>
                <View style={styles.phraseTexts}>
                  <Text style={styles.phraseText}>{p.phrase}</Text>
                  <Text style={styles.phraseContext}>{p.context}</Text>
                </View>
                <TouchableOpacity
                  style={[styles.playBtnSmall, playingId === `phrase_${i}` && styles.playBtnActive]}
                  onPress={() => playingId === `phrase_${i}` ? stopSpeech() : speak(`phrase_${i}`, p.phrase)}
                  activeOpacity={0.8}
                >
                  <Text style={styles.playIcon}>{playingId === `phrase_${i}` ? '■' : '▶'}</Text>
                </TouchableOpacity>
              </View>
            ))}
          </View>
        ) : vocabHints.length > 0 ? (
          <View style={styles.section}>
            <Text style={styles.sectionLabel}>ANAHTAR KELİMELER</Text>
            {vocabHints.slice(0, 6).map((v, i) => (
              <View key={i} style={styles.phraseRow}>
                <View style={styles.phraseTexts}>
                  <Text style={styles.phraseText}>{v.word}</Text>
                  <Text style={styles.phraseContext}>{v.meaning}</Text>
                </View>
                <TouchableOpacity
                  style={[styles.playBtnSmall, playingId === `vocab_${i}` && styles.playBtnActive]}
                  onPress={() => playingId === `vocab_${i}` ? stopSpeech() : speak(`vocab_${i}`, v.word)}
                  activeOpacity={0.8}
                >
                  <Text style={styles.playIcon}>{playingId === `vocab_${i}` ? '■' : '▶'}</Text>
                </TouchableOpacity>
              </View>
            ))}
          </View>
        ) : null}

        {/* Cultural tip */}
        {activeTip ? (
          <View style={styles.section}>
            <Text style={styles.sectionLabel}>KÜLTÜREL İPUCU</Text>
            <View style={styles.tipCard}>
              <Text style={styles.tipText}>{activeTip.text}</Text>
              {activeTip.example ? (
                <Text style={styles.tipExample}>"{activeTip.example}"</Text>
              ) : null}
              {culturalTips.length > 1 ? (
                <TouchableOpacity onPress={nextTip} style={styles.nextTipBtn} activeOpacity={0.7}>
                  <Text style={styles.nextTipText}>Sonraki ipucu →</Text>
                </TouchableOpacity>
              ) : null}
            </View>
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
  scroll: { flex: 1 },
  scrollInner: { paddingHorizontal: 20, paddingTop: 96, paddingBottom: 24 },

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

  header: { marginBottom: 24, paddingLeft: 52 },
  eyebrow: {
    fontSize: 10,
    color: colors.accentWarm,
    fontFamily: 'InterTight_500Medium',
    letterSpacing: 2.6,
    marginBottom: 10,
  },
  title: {
    fontFamily: 'Fraunces_300Light',
    fontSize: 28,
    color: colors.inkPrimary,
    letterSpacing: -0.4,
    lineHeight: 36,
    marginBottom: 6,
  },
  subtitle: {
    fontFamily: 'InterTight_400Regular',
    fontSize: 12,
    color: colors.inkTertiary,
    marginTop: 2,
  },

  section: { marginBottom: 24 },
  sectionLabel: {
    fontSize: 10,
    color: colors.inkTertiary,
    fontFamily: 'InterTight_500Medium',
    letterSpacing: 2.2,
    marginBottom: 10,
  },

  npcCard: {
    backgroundColor: colors.bgMid,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(232,181,118,0.15)',
    padding: 16,
    gap: 12,
  },
  npcText: {
    fontFamily: 'Fraunces_300Light_Italic',
    fontSize: 15,
    color: colors.inkPrimary,
    lineHeight: 22,
  },
  playBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    alignSelf: 'flex-start',
    backgroundColor: colors.bgSoft,
    borderRadius: 999,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: colors.hairlineStrong,
  },
  playBtnActive: {
    borderColor: colors.accentWarm,
    backgroundColor: 'rgba(232,181,118,0.12)',
  },
  playBtnSmall: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: colors.bgSoft,
    borderWidth: 1,
    borderColor: colors.hairlineStrong,
    alignItems: 'center',
    justifyContent: 'center',
  },
  playIcon: { fontSize: 11, color: colors.accentWarm },
  playLabel: { fontSize: 12, color: colors.inkSecondary, fontFamily: 'InterTight_500Medium' },

  phraseRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.bgMid,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.hairline,
    padding: 12,
    marginBottom: 8,
  },
  phraseTexts: { flex: 1, marginRight: 10 },
  phraseText: {
    fontFamily: 'Fraunces_300Light',
    fontSize: 16,
    color: colors.inkPrimary,
    letterSpacing: -0.2,
  },
  phraseContext: {
    fontFamily: 'InterTight_400Regular',
    fontSize: 11,
    color: colors.inkTertiary,
    marginTop: 2,
  },

  tipCard: {
    backgroundColor: colors.bgMid,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(232,181,118,0.2)',
    padding: 16,
  },
  tipText: {
    fontFamily: 'InterTight_400Regular',
    fontSize: 13,
    color: colors.inkSecondary,
    lineHeight: 20,
    marginBottom: 8,
  },
  tipExample: {
    fontFamily: 'Fraunces_300Light_Italic',
    fontSize: 14,
    color: colors.accentWarm,
    lineHeight: 20,
    marginBottom: 8,
  },
  nextTipBtn: { alignSelf: 'flex-start', marginTop: 4 },
  nextTipText: {
    fontFamily: 'InterTight_500Medium',
    fontSize: 12,
    color: colors.accentWarmSoft,
  },
});
