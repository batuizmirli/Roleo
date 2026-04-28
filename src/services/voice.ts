import * as Speech from 'expo-speech';
import {
  AudioModule,
  getRecordingPermissionsAsync,
  RecordingPresets,
  requestRecordingPermissionsAsync,
  setAudioModeAsync,
} from 'expo-audio';
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
let activeRecorder: ActiveRecorder | null = null;

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
  try {
    await Speech.stop();
    Speech.speak(text.replace(/^["“]|["”]$/g, ''), {
      language: speechLang[language.slice(0, 2)] ?? language,
      rate: 0.92,
      pitch: 1,
    });
  } catch {
    // TTS is optional; never block the text flow.
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

export const transcribeVoice = async (uri: string, language: string): Promise<{ transcript: string; confidence?: number }> => {
  if (!STT_ENDPOINT || !uri || uri.startsWith('mock-voice')) {
    return { transcript: '', confidence: undefined };
  }

  try {
    const formData = new FormData();
    formData.append('file', {
      uri,
      name: `roleo-voice-${Date.now().toString(36)}.m4a`,
      type: mimeForUri(uri),
    } as unknown as Blob);
    formData.append('language', language);

    const response = await fetch(STT_ENDPOINT, {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) return { transcript: '', confidence: undefined };
    const data = await response.json();
    return {
      transcript: typeof data.transcript === 'string' ? data.transcript : '',
      confidence: typeof data.confidence === 'number' ? data.confidence : undefined,
    };
  } catch {
    return { transcript: '', confidence: undefined };
  } finally {
    await cleanupVoiceRecording(uri);
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
