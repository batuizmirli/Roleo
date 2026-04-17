import React, { useEffect, useState, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Alert,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Scenario, Message, StageResult, UserLevel, UserProfile } from '../types';
import { sendMessage } from '../services/claude';
import { tryParseJson } from '../services/json';
import { getPersonaByStage, pickPersonaVariation } from '../services/personas';
import { trackEvent } from '../services/telemetry';

type Props = {
  scenario: Scenario;
  onBack: () => void;
  onStageComplete: (result: StageResult) => void;
  firstSessionMode?: boolean;
};

const detectLevelFromText = (text: string): UserLevel => {
  const cleaned = text.trim();
  const words = cleaned.split(/\s+/).filter(Boolean);

  if (words.length <= 3) return 'beginner';
  if (words.length <= 9) return 'intermediate';
  return 'advanced';
};

export default function ScenarioScreen({ scenario, onBack, onStageComplete, firstSessionMode = false }: Props) {
  const stageKey = scenario.stageType ?? 'social';
  const persona = getPersonaByStage(stageKey);
  const [phase, setPhase] = useState<'intro' | 'vocab' | 'chat'>(
    firstSessionMode ? 'intro' : (scenario.vocabHints && scenario.vocabHints.length > 0 ? 'vocab' : 'chat')
  );
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '0',
      role: 'assistant',
      content: scenario.openingMessage,
      timestamp: new Date(),
    },
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [userLevel, setUserLevel] = useState<UserLevel | null>(null);
  const [userMessageCount, setUserMessageCount] = useState(0);
  const scrollRef = useRef<ScrollView>(null);

  useEffect(() => {
    trackEvent('stage_started', {
      scenarioId: scenario.id,
      stageType: scenario.stageType ?? 'social',
      modeType: scenario.modeType ?? 'normal',
      difficulty: scenario.difficulty,
      firstSessionMode,
    });
  }, [scenario.id, scenario.stageType, firstSessionMode]);

  const completeStage = () => {
    const level = userLevel ?? 'beginner';
    const xpBase = scenario.xpReward ?? 20;
    const bonus = userMessageCount >= 5 ? 8 : userMessageCount >= 3 ? 4 : 0;
    onStageComplete({
      scenarioId: scenario.id,
      scenarioTitle: scenario.title,
      stageType: scenario.stageType ?? 'social',
      userLevel: level,
      userMessageCount,
      xpEarned: xpBase + bonus,
      personaName: persona.name,
      rewardLine: persona.rewardLine,
      naturalTip: persona.naturalTip,
      suggestedNextStage: persona.nextStageHint,
    });
  };

  const handleSend = async () => {
    if (!input.trim() || loading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: input.trim(),
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setLoading(true);

    try {
      const profileData = await AsyncStorage.getItem('userProfile');
      const profile = profileData ? tryParseJson<UserProfile>(profileData) : null;
      const nativeLang = profile?.nativeLanguage?.name ?? 'English';

      const detectedLevel = userLevel ?? detectLevelFromText(userMessage.content);
      if (!userLevel) {
        setUserLevel(detectedLevel);
      }
      const newCount = userMessageCount + 1;
      setUserMessageCount(newCount);
      if (newCount === 1) {
        trackEvent('first_user_message_sent', {
          scenarioId: scenario.id,
          messageLength: userMessage.content.length,
          firstSessionMode,
        });
      }

      const allMessages = [...messages, userMessage];
      const variation = pickPersonaVariation(stageKey, allMessages.length);

      const basePrompt = `
You are Roleo, a real-life conversation simulator.
    Your current character is ${persona.name}, a ${persona.roleLabel}.
    Tone: ${persona.tone}.
Stay in character and keep flow natural.
Never become a long grammar teacher.
Corrections must be short, practical and encouraging.
    ${variation}
`;

      const scenarioPrompt = scenario.systemPrompt
        .replace(/Turkish/g, nativeLang)
        .replace(/Türkçe/g, nativeLang);

      const runtimePrompt = `
The user's native language is ${nativeLang}.
User level is ${detectedLevel}.
Scenario mode is ${scenario.modeType ?? 'normal'} and stage type is ${scenario.stageType ?? 'social'}.
First session mode: ${firstSessionMode ? 'ON' : 'OFF'}.
If first session mode is ON, keep whole interaction 2-3 turns and super simple.
Adapt response style:
- beginner: very short and simple
- intermediate: natural and brief
- advanced: idiomatic and realistic
Always provide corrections in ${nativeLang} with prefix "💡 Düzeltme:".
`;

      const dynamicPrompt = `${basePrompt}\n${scenarioPrompt}\n${runtimePrompt}`;

      const response = await sendMessage(allMessages, dynamicPrompt);

      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: response,
        timestamp: new Date(),
      };

      setMessages(prev => [...prev, assistantMessage]);
    } catch (error: any) {
      Alert.alert('Hata', error.message || 'Bir şeyler ters gitti.');
    } finally {
      setLoading(false);
      setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 100);
    }
  };

  const parseMessage = (content: string) => {
    const correctionIndex = content.indexOf('💡 Düzeltme:');
    if (correctionIndex === -1) return { main: content, correction: null };
    return {
      main: content.substring(0, correctionIndex).trim(),
      correction: content.substring(correctionIndex + '💡 Düzeltme:'.length).trim(),
    };
  };

  // FIRST SESSION INTRO
  if (phase === 'intro') {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={onBack} style={styles.backBtn}>
            <Text style={styles.backText}>←</Text>
          </TouchableOpacity>
          <View style={styles.headerInfo}>
            <Text style={styles.headerEmoji}>{scenario.emoji}</Text>
            <View>
              <Text style={styles.headerTitle}>{scenario.title}</Text>
              <Text style={styles.headerLocation}>📍 {scenario.location}</Text>
            </View>
          </View>
        </View>

        <View style={styles.firstIntroWrap}>
          <Text style={styles.firstIntroBadge}>FIRST STAGE</Text>
          <Text style={styles.firstIntroTitle}>Barcelona'da bir kafedesin.</Text>
          <Text style={styles.firstIntroSub}>{persona.name} sana yaklaşır:</Text>
          <View style={styles.firstQuote}>
            <Text style={styles.firstQuoteText}>“Hey! What can I get for you?”</Text>
          </View>
          <Text style={styles.firstGoal}>Görev: Selam ver • Sipariş ver • Ek soruya cevap ver</Text>
          <TouchableOpacity style={styles.startBtn} onPress={() => setPhase('chat')}>
            <Text style={styles.startBtnText}>Konuşmaya Başla</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  // VOCAB INTRO PHASE
  if (phase === 'vocab' && scenario.vocabHints) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={onBack} style={styles.backBtn}>
            <Text style={styles.backText}>←</Text>
          </TouchableOpacity>
          <View style={styles.headerInfo}>
            <Text style={styles.headerEmoji}>{scenario.emoji}</Text>
            <View>
              <Text style={styles.headerTitle}>{scenario.title}</Text>
              <Text style={styles.headerLocation}>📍 {scenario.location}</Text>
            </View>
          </View>
        </View>

        <ScrollView contentContainerStyle={styles.vocabScroll}>
          <Text style={styles.vocabTitle}>Sahneye girmeden önce</Text>
          <Text style={styles.vocabSubtitle}>Bu kelimeleri bilirsen çok daha kolay olacak 👇</Text>

          <View style={styles.vocabGrid}>
            {scenario.vocabHints.map((hint, i) => (
              <View key={i} style={styles.vocabCard}>
                <Text style={styles.vocabWord}>{hint.word}</Text>
                <Text style={styles.vocabMeaning}>{hint.meaning}</Text>
              </View>
            ))}
          </View>

          <View style={styles.vocabNote}>
            <Text style={styles.vocabNoteText}>
              💡 Sahne içinde yanlış yaparsan sana düzeltme göstereceğim. Türkçe de yazabilirsin!
            </Text>
          </View>

          <TouchableOpacity style={styles.startBtn} onPress={() => setPhase('chat')}>
            <Text style={styles.startBtnText}>Sahneye Gir →</Text>
          </TouchableOpacity>
        </ScrollView>
      </View>
    );
  }

  // CHAT PHASE
  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
    >
      <View style={styles.header}>
        <TouchableOpacity onPress={onBack} style={styles.backBtn}>
          <Text style={styles.backText}>←</Text>
        </TouchableOpacity>
        <View style={styles.headerInfo}>
          <Text style={styles.headerEmoji}>{scenario.emoji}</Text>
          <View>
            <Text style={styles.headerTitle}>{scenario.title}</Text>
            <Text style={styles.headerLocation}>📍 {scenario.location}</Text>
          </View>
        </View>
        {scenario.vocabHints && (
          <TouchableOpacity style={styles.vocabBtn} onPress={() => setPhase('vocab')}>
            <Text style={styles.vocabBtnText}>📖</Text>
          </TouchableOpacity>
        )}
      </View>

      <View style={styles.stageMetaRow}>
        <Text style={styles.stageMetaText}>{persona.name} · {(userLevel ?? 'algılanıyor').toUpperCase()}</Text>
        <TouchableOpacity onPress={completeStage} style={styles.finishBtn}>
          <Text style={styles.finishBtnText}>Stage Bitir</Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        ref={scrollRef}
        style={styles.messages}
        contentContainerStyle={styles.messagesContent}
        onContentSizeChange={() => scrollRef.current?.scrollToEnd({ animated: true })}
      >
        {messages.map(msg => {
          const { main, correction } = parseMessage(msg.content);
          return (
            <View key={msg.id} style={[styles.msgWrapper, msg.role === 'user' ? styles.userWrapper : styles.aiWrapper]}>
              {msg.role === 'assistant' && (
                <Text style={styles.avatar}>{scenario.emoji}</Text>
              )}
              <View style={styles.msgColumn}>
                <View style={[styles.bubble, msg.role === 'user' ? styles.userBubble : styles.aiBubble]}>
                  <Text style={[styles.msgText, msg.role === 'user' ? styles.userText : styles.aiText]}>
                    {main}
                  </Text>
                </View>
                {correction && (
                  <View style={styles.correctionBubble}>
                    <Text style={styles.correctionIcon}>💡</Text>
                    <Text style={styles.correctionText}>{correction}</Text>
                  </View>
                )}
              </View>
            </View>
          );
        })}

        {loading && (
          <View style={styles.loadingWrapper}>
            <ActivityIndicator size="small" color="#FF4D6D" />
            <Text style={styles.loadingText}>Yazıyor...</Text>
          </View>
        )}
      </ScrollView>

      <View style={styles.inputContainer}>
        <TextInput
          style={styles.input}
          placeholder="Türkçe veya yabancı dilde yaz..."
          placeholderTextColor="#555"
          value={input}
          onChangeText={setInput}
          multiline
          maxLength={500}
        />
        <TouchableOpacity
          style={[styles.sendBtn, (!input.trim() || loading) && styles.sendBtnDisabled]}
          onPress={handleSend}
          disabled={!input.trim() || loading}
        >
          <Text style={styles.sendIcon}>↑</Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0D0D1A',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: 60,
    paddingHorizontal: 20,
    paddingBottom: 16,
    backgroundColor: '#0D0D1A',
    borderBottomWidth: 1,
    borderBottomColor: '#1A1A2E',
    gap: 12,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: '#1A1A2E',
    alignItems: 'center',
    justifyContent: 'center',
  },
  backText: {
    fontSize: 20,
    color: '#FFFFFF',
  },
  headerInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  headerEmoji: {
    fontSize: 28,
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  headerLocation: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
  },
  stageMetaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#1A1A2E',
  },
  stageMetaText: {
    color: '#888',
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.4,
  },
  finishBtn: {
    backgroundColor: '#1A1A2E',
    borderWidth: 1,
    borderColor: '#2A2A3E',
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  finishBtnText: {
    color: '#FF4D6D',
    fontSize: 11,
    fontWeight: '800',
  },
  vocabBtn: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: '#1A1A2E',
    alignItems: 'center',
    justifyContent: 'center',
  },
  vocabBtnText: {
    fontSize: 18,
  },
  // VOCAB PHASE
  vocabScroll: {
    padding: 24,
    paddingBottom: 48,
  },
  vocabTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: '#FFFFFF',
    marginBottom: 8,
  },
  vocabSubtitle: {
    fontSize: 15,
    color: '#888',
    marginBottom: 28,
    lineHeight: 22,
  },
  vocabGrid: {
    gap: 10,
    marginBottom: 24,
  },
  vocabCard: {
    backgroundColor: '#1A1A2E',
    borderRadius: 14,
    padding: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#2A2A3E',
  },
  vocabWord: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  vocabMeaning: {
    fontSize: 14,
    color: '#FF4D6D',
    fontWeight: '600',
  },
  vocabNote: {
    backgroundColor: '#1A2A1A',
    borderRadius: 14,
    padding: 16,
    marginBottom: 28,
    borderWidth: 1,
    borderColor: '#2A3A2A',
  },
  vocabNoteText: {
    fontSize: 14,
    color: '#7BC67E',
    lineHeight: 22,
  },
  startBtn: {
    backgroundColor: '#FF4D6D',
    borderRadius: 16,
    padding: 18,
    alignItems: 'center',
  },
  startBtnText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '800',
  },
  firstIntroWrap: {
    paddingHorizontal: 24,
    paddingTop: 24,
    flex: 1,
  },
  firstIntroBadge: {
    color: '#FF4D6D',
    fontSize: 11,
    fontWeight: '900',
    letterSpacing: 1,
  },
  firstIntroTitle: {
    color: '#FFF',
    fontSize: 28,
    fontWeight: '900',
    marginTop: 8,
  },
  firstIntroSub: {
    color: '#AAA',
    marginTop: 10,
    fontSize: 14,
  },
  firstQuote: {
    marginTop: 10,
    backgroundColor: '#1A1A2E',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#2A2A3E',
    padding: 14,
  },
  firstQuoteText: {
    color: '#FFF',
    fontSize: 17,
    fontWeight: '700',
  },
  firstGoal: {
    color: '#8FC7A0',
    marginTop: 12,
    marginBottom: 24,
    fontSize: 13,
  },
  // CHAT PHASE
  messages: {
    flex: 1,
  },
  messagesContent: {
    padding: 20,
    gap: 12,
  },
  msgWrapper: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 8,
    marginBottom: 8,
  },
  userWrapper: {
    justifyContent: 'flex-end',
  },
  aiWrapper: {
    justifyContent: 'flex-start',
  },
  avatar: {
    fontSize: 24,
    marginBottom: 4,
  },
  msgColumn: {
    maxWidth: '78%',
    gap: 6,
  },
  bubble: {
    borderRadius: 18,
    padding: 14,
  },
  userBubble: {
    backgroundColor: '#FF4D6D',
    borderBottomRightRadius: 4,
  },
  aiBubble: {
    backgroundColor: '#1A1A2E',
    borderBottomLeftRadius: 4,
    borderWidth: 1,
    borderColor: '#2A2A3E',
  },
  msgText: {
    fontSize: 15,
    lineHeight: 22,
  },
  userText: {
    color: '#FFFFFF',
  },
  aiText: {
    color: '#E0E0E0',
  },
  correctionBubble: {
    backgroundColor: '#1A2A1A',
    borderRadius: 12,
    padding: 10,
    flexDirection: 'row',
    gap: 6,
    borderWidth: 1,
    borderColor: '#2A3A2A',
  },
  correctionIcon: {
    fontSize: 14,
  },
  correctionText: {
    fontSize: 13,
    color: '#7BC67E',
    flex: 1,
    lineHeight: 20,
  },
  loadingWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingLeft: 8,
  },
  loadingText: {
    fontSize: 13,
    color: '#555',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingHorizontal: 16,
    paddingVertical: 12,
    paddingBottom: Platform.OS === 'ios' ? 28 : 12,
    backgroundColor: '#0D0D1A',
    borderTopWidth: 1,
    borderTopColor: '#1A1A2E',
    gap: 10,
  },
  input: {
    flex: 1,
    backgroundColor: '#1A1A2E',
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 12,
    color: '#FFFFFF',
    fontSize: 15,
    maxHeight: 120,
    borderWidth: 1,
    borderColor: '#2A2A3E',
  },
  sendBtn: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: '#FF4D6D',
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendBtnDisabled: {
    backgroundColor: '#3A2A2E',
  },
  sendIcon: {
    fontSize: 20,
    color: '#FFFFFF',
    fontWeight: '800',
  },
});
