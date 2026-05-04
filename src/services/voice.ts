import * as Speech from 'expo-speech';
import {
  AudioModule,
  getRecordingPermissionsAsync,
  RecordingPresets,
  requestRecordingPermissionsAsync,
  setAudioModeAsync,
} from 'expo-audio';
import { sendMessage } from './claude';
import type { VoiceAttempt } from '../types';

export type VoiceAttemptEvaluation = {
  confidence?: number;
  feedback: string;
  meaningClear: boolean;
  missingKeywords: string[];
};

const speechLang: Record<string, string> = {
  en: 'en-US',
  es: 'es-ES',
  fr: 'fr-FR',
  de: 'de-DE',
  it: 'it-IT',
  pt: 'pt-PT',
  tr: 'tr-TR',
};

const normalize = (text: string) =>
  text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^\p{L}\p{N}\s']/gu, ' ')
    .replace(/\s+/g, ' ')
    .trim();

const stopwords = new Set([
  'a', 'an', 'and', 'are', 'can', 'could', 'de', 'der', 'die', 'das', 'do', 'el', 'en', 'et', 'for',
  'i', 'ich', 'il', 'je', 'la', 'le', 'me', 'mi', 'of', 'please', 'por', 'que', 's', 'si', 'the',
  'to', 'un', 'una', 'und', 'vous', 'yo', 'you',
]);

const keywordsFor = (targetText: string) =>
  Array.from(new Set(normalize(targetText).split(' ').filter(word => word.length > 2 && !stopwords.has(word)))).slice(0, 6);

type ActiveRecorder = InstanceType<typeof AudioModule.AudioRecorder>;

const STT_ENDPOINT = process.env.EXPO_PUBLIC_STT_PROXY_URL;
const OPENAI_API_KEY = process.env.EXPO_PUBLIC_OPENAI_API_KEY;
let activeRecorder: ActiveRecorder | null = null;

export const isSttConfigured = (): boolean => !!(STT_ENDPOINT || OPENAI_API_KEY);

export const isVoiceRecordingActive = (): boolean => activeRecorder != null;
let cachedVoiceId: string | null = null;

const maleVoiceHints: Record<string, string[]> = {
  en: ['daniel', 'thomas', 'aaron', 'fred', 'alex', 'male'],
  es: ['jorge', 'diego', 'carlos', 'male'],
  fr: ['thomas', 'nicolas', 'male'],
  de: ['thomas', 'male'],
  it: ['luca', 'male'],
  pt: ['joao', 'male'],
  tr: ['male'],
};

const highQualityVoiceHints = ['neural', 'premium', 'enhanced', 'natural', 'wavenet'];
const friendlyVoiceHints = ['siri', 'ava', 'alloy', 'nova', 'aria', 'jenny', 'emma', 'mia', 'clara'];
const energeticVoiceHints = ['expressive', 'energetic', 'cheerful', 'bright', 'lively'];
const roboticVoiceHints = ['compact', 'classic', 'default', 'legacy'];

const resolveNpcVoiceIdentifier = async (language: string): Promise<string | undefined> => {
  try {
    if (cachedVoiceId) return cachedVoiceId;
    const locale = speechLang[language.slice(0, 2)] ?? language;
    const voices = await Speech.getAvailableVoicesAsync();
    const localeVoices = voices.filter(v => v.language?.toLowerCase().startsWith(locale.slice(0, 2).toLowerCase()));
    if (!localeVoices.length) return undefined;

    const maleHints = maleVoiceHints[language.slice(0, 2)] ?? ['male'];
    const scoreVoice = (voice: Speech.Voice) => {
      const bucket = `${voice.name ?? ''} ${voice.identifier ?? ''}`.toLowerCase();
      let score = 0;
      if (highQualityVoiceHints.some(h => bucket.includes(h))) score += 4;
      if (friendlyVoiceHints.some(h => bucket.includes(h))) score += 3;
      if (energeticVoiceHints.some(h => bucket.includes(h))) score += 2;
      if (maleHints.some(h => bucket.includes(h))) score -= 1;
      if (roboticVoiceHints.some(h => bucket.includes(h))) score -= 3;
      return score;
    };

    const pick = [...localeVoices].sort((a, b) => scoreVoice(b) - scoreVoice(a))[0];
    cachedVoiceId = pick.identifier ?? null;
    return pick.identifier;
  } catch {
    return undefined;
  }
};

const mimeForUri = (uri: string) => {
  const lower = uri.toLowerCase();
  if (lower.endsWith('.m4a')) return 'audio/m4a';
  if (lower.endsWith('.mp4')) return 'audio/mp4';
  if (lower.endsWith('.webm')) return 'audio/webm';
  if (lower.endsWith('.wav')) return 'audio/wav';
  if (lower.endsWith('.3gp')) return 'audio/3gpp';
  return 'audio/m4a';
};

export const cleanupVoiceRecording = async (uri?: string): Promise<void> => {
  if (!uri || !uri.startsWith('file://')) return;
  try {
    const FileSystem = await import('expo-file-system');
    await FileSystem.deleteAsync(uri, { idempotent: true });
  } catch {
    // Local cleanup should never affect the rehearsal flow.
  }
};

export const speakNpcLine = async (text: string, language: string): Promise<void> => {
  const cleanText = text.replace(/^["“]|["”]$/g, '');
  const locale = speechLang[language.slice(0, 2)] ?? language;
  const baseOptions = {
    language: locale,
    rate: 1.02,
    pitch: 1.06,
  } as const;

  try {
    await Speech.stop();
    const voice = await resolveNpcVoiceIdentifier(language);
    try {
      Speech.speak(cleanText, {
        ...baseOptions,
        voice,
      });
    } catch {
      // Some devices expose voices that are not actually playable.
      // Retry with system default so speech never goes silent.
      cachedVoiceId = null;
      Speech.speak(cleanText, baseOptions);
    }
  } catch {
    try {
      Speech.speak(cleanText, baseOptions);
    } catch {
      // TTS is optional; never block the text flow.
    }
  }
};

export const stopNpcSpeech = async (): Promise<void> => {
  try {
    await Speech.stop();
  } catch {
    // ignore
  }
};

export const requestMicrophonePermission = async (): Promise<boolean> => {
  try {
    const current = await getRecordingPermissionsAsync();
    if (current.granted) return true;
    const requested = await requestRecordingPermissionsAsync();
    return requested.granted;
  } catch {
    return false;
  }
};

export const startVoiceRecording = async (): Promise<{ uri?: string }> => {
  try {
    await setAudioModeAsync({
      allowsRecording: true,
      playsInSilentMode: true,
    });
    activeRecorder = new AudioModule.AudioRecorder(RecordingPresets.HIGH_QUALITY);
    await activeRecorder.prepareToRecordAsync({
      ...RecordingPresets.HIGH_QUALITY,
      extension: '.m4a',
      android: {
        ...RecordingPresets.HIGH_QUALITY.android,
        extension: '.m4a',
        outputFormat: 'mpeg4',
        audioEncoder: 'aac',
      },
    });
    activeRecorder.record();
    return { uri: activeRecorder.uri ?? undefined };
  } catch {
    activeRecorder = null;
    throw new Error('voice_recording_start_failed');
  }
};

export const stopVoiceRecording = async (): Promise<{ uri?: string }> => {
  try {
    const recorder = activeRecorder;
    if (!recorder) return {};
    await recorder.stop();
    const uri = recorder.uri ?? recorder.getStatus().url ?? undefined;
    activeRecorder = null;
    await setAudioModeAsync({
      allowsRecording: false,
      playsInSilentMode: true,
    });
    return { uri };
  } catch {
    activeRecorder = null;
    try {
      await setAudioModeAsync({ allowsRecording: false, playsInSilentMode: true });
    } catch {
      // ignore
    }
    throw new Error('voice_recording_stop_failed');
  }
};

const buildSttFormData = (uri: string, language: string) => {
  const formData = new FormData();
  formData.append('file', {
    uri,
    name: `roleo-voice-${Date.now().toString(36)}.m4a`,
    type: mimeForUri(uri),
  } as unknown as Blob);
  formData.append('language', language);
  return formData;
};

export const transcribeVoice = async (
  uri: string,
  language: string,
  opts?: { deleteFile?: boolean },
): Promise<{ transcript: string; confidence?: number }> => {
  const deleteFile = opts?.deleteFile !== false;
  console.log('[STT] uri:', uri, 'stt_endpoint:', STT_ENDPOINT, 'openai_key:', OPENAI_API_KEY ? 'SET' : 'MISSING');
  if (!uri || uri.startsWith('mock-voice')) return { transcript: '', confidence: undefined };

  try {
    if (STT_ENDPOINT) {
      const response = await fetch(STT_ENDPOINT, {
        method: 'POST',
        body: buildSttFormData(uri, language),
      });
      if (!response.ok) return { transcript: '', confidence: undefined };
      const data = await response.json();
      return {
        transcript: typeof data.transcript === 'string' ? data.transcript : '',
        confidence: typeof data.confidence === 'number' ? data.confidence : undefined,
      };
    }

    if (OPENAI_API_KEY) {
      const formData = buildSttFormData(uri, language);
      formData.append('model', 'whisper-1');
      const response = await fetch('https://api.openai.com/v1/audio/transcriptions', {
        method: 'POST',
        headers: { Authorization: `Bearer ${OPENAI_API_KEY}` },
        body: formData,
      });
      console.log('[STT] OpenAI status:', response.status);
      if (!response.ok) {
        const err = await response.text();
        console.log('[STT] OpenAI error:', err);
        return { transcript: '', confidence: undefined };
      }
      const data = await response.json();
      console.log('[STT] OpenAI result:', data);
      return {
        transcript: typeof data.text === 'string' ? data.text : '',
        confidence: undefined,
      };
    }

    return { transcript: '', confidence: undefined };
  } catch {
    return { transcript: '', confidence: undefined };
  } finally {
    if (deleteFile) await cleanupVoiceRecording(uri);
  }
};

export const evaluateVoiceAttempt = async (
  targetText: string,
  transcript: string,
  language: string,
): Promise<VoiceAttemptEvaluation> => {
  const targetKeywords = keywordsFor(targetText);
  const spoken = normalize(transcript);
  const missingKeywords = targetKeywords.filter(keyword => !spoken.includes(keyword));
  const matched = targetKeywords.length - missingKeywords.length;
  const confidence = targetKeywords.length > 0 ? matched / targetKeywords.length : 0;
  const meaningClear = !!spoken && confidence >= 0.55;
  const isTr = language.slice(0, 2) === 'tr';

  let feedback: string;
  if (!spoken) {
    feedback = isTr ? 'Transcription şu an hazır değil; cevabı sahnede tekrar etmeyi dene.' : 'Transcription is not available yet; try repeating the line once more.';
  } else if (meaningClear && missingKeywords.length === 0) {
    feedback = isTr ? 'Ana fikir doğru. Bu cevap sahnede iş görür.' : 'The meaning is clear. This would work in the moment.';
  } else if (meaningClear) {
    feedback = isTr ? 'Anlam net, biraz daha doğal söyleyebilirsin.' : 'Clear enough for the scene. You can make it a little more natural.';
  } else {
    const phrase = missingKeywords[0] ?? targetKeywords[0] ?? targetText;
    feedback = isTr ? `Şu ifadeyi tekrar dene: ${phrase}` : `Try this phrase again: ${phrase}`;
  }

  return { confidence, feedback, meaningClear, missingKeywords };
};

type OptionForEval = { text: string; quality: string };

export const claudeEvaluateVoice = async (
  transcript: string,
  options: OptionForEval[],
  language: string,
): Promise<{ quality: 'good' | 'ok' | 'awkward'; feedback: string } | null> => {
  try {
    const isTr = language.slice(0, 2) === 'tr';
    const optionList = options.map((o, i) => `${i + 1}. [${o.quality}] "${o.text}"`).join('\n');
    const feedbackLang = isTr ? 'Turkish' : language;
    const prompt = `Language: ${language}. User said: "${transcript}"\n\nOptions:\n${optionList}\n\nWhich option best matches the meaning? Give a one-sentence feedback in ${feedbackLang}.\nReply JSON only: {"match":1,"quality":"good|ok|awkward","feedback":"..."}`;
    const raw = await sendMessage(
      [{ id: 'v1', role: 'user', content: prompt, timestamp: new Date() }],
      'You are a language learning evaluator. Evaluate voice responses by meaning, not exact words. JSON only, no extra text.',
      { maxTokens: 120, model: 'claude-haiku-4-5-20251001' },
    );
    const parsed = JSON.parse(raw.trim());
    const q = parsed.quality;
    if (q !== 'good' && q !== 'ok' && q !== 'awkward') return null;
    return { quality: q, feedback: typeof parsed.feedback === 'string' ? parsed.feedback : '' };
  } catch {
    return null;
  }
};

/** Scene reply: feedback must reference what the learner actually said, in dialogue context. */
export const claudeEvaluateSceneVoice = async (
  transcript: string,
  npcLine: string,
  sceneMission: string | undefined,
  options: OptionForEval[],
  language: string,
): Promise<{ quality: 'good' | 'ok' | 'awkward'; feedback: string } | null> => {
  try {
    const isTr = language.slice(0, 2) === 'tr';
    const feedbackInstruction = isTr
      ? '3) feedback: ONE short sentence in Turkish.'
      : `3) feedback: ONE short sentence in the learner's target language (match the dialogue language; language code ${language}). Do not use English unless the target language is English.`;
    const optionList = options.map((o, i) => `${i + 1}. [${o.quality}] "${o.text}"`).join('\n');
    const mission = sceneMission ?? 'natural conversation';
    const prompt = `Target language code: ${language}.
NPC just said (in the target language): "${npcLine}"
Scene goal: ${mission}

The learner spoke this (transcription, target language): "${transcript}"

Reference lines (quality labels are hints only — the learner may paraphrase freely):
${optionList}

Task:
1) Judge how well the learner's utterance fits as a reply to the NPC line in this situation — by meaning and social fit, not exact word match.
2) quality: "good" = natural and appropriate, "ok" = understandable but stiff, vague, or slightly off-register, "awkward" = confusing, wrong intent, or would create friction in the scene.
${feedbackInstruction}
It MUST react to the learner's actual words (quote or paraphrase a fragment if helpful). Do not describe "options" or "choices". Sound like a calm rehearsal note, not a teacher score.

Reply JSON only: {"quality":"good|ok|awkward","feedback":"..."}`;
    const raw = await sendMessage(
      [{ id: 'sv1', role: 'user', content: prompt, timestamp: new Date() }],
      'You output valid JSON only. No markdown, no extra keys.',
      { maxTokens: 180, model: 'claude-haiku-4-5-20251001' },
    );
    const parsed = JSON.parse(raw.trim());
    const q = parsed.quality;
    if (q !== 'good' && q !== 'ok' && q !== 'awkward') return null;
    return { quality: q, feedback: typeof parsed.feedback === 'string' ? parsed.feedback : '' };
  } catch {
    return null;
  }
};

export const createVoiceAttempt = (params: {
  targetText: string;
  transcript?: string;
  evaluation: VoiceAttemptEvaluation;
  scenarioId?: string;
  language?: string;
}): VoiceAttempt => ({
  id: `voice-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`,
  targetText: params.targetText,
  transcript: params.transcript,
  confidence: params.evaluation.confidence,
  feedback: params.evaluation.feedback,
  meaningClear: params.evaluation.meaningClear,
  missingKeywords: params.evaluation.missingKeywords,
  createdAt: new Date().toISOString(),
  scenarioId: params.scenarioId,
  language: params.language,
});
