export type SttTranscriptionInput = {
  file: {
    buffer: Buffer;
    originalname: string;
    mimetype: string;
    size: number;
  };
  language?: string;
};

export type SttTranscriptionResult = {
  transcript: string;
  confidence?: number;
  language?: string;
  durationMs?: number;
};

const OPENAI_TRANSCRIPTION_URL = 'https://api.openai.com/v1/audio/transcriptions';

const safeFileName = (name: string, mime: string) => {
  const cleaned = name.replace(/[^\w.-]/g, '_') || 'roleo-voice';
  if (/\.(m4a|mp4|mp3|mpeg|wav|webm)$/i.test(cleaned)) return cleaned;
  if (mime === 'audio/webm') return `${cleaned}.webm`;
  if (mime === 'audio/wav') return `${cleaned}.wav`;
  if (mime === 'audio/mpeg') return `${cleaned}.mp3`;
  return `${cleaned}.m4a`;
};

export const transcribeWithOpenAI = async ({
  file,
  language,
}: SttTranscriptionInput): Promise<SttTranscriptionResult> => {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error('missing_openai_api_key');
  }

  const model = process.env.OPENAI_STT_MODEL || 'gpt-4o-mini-transcribe';
  const form = new FormData();
  const arrayBuffer = file.buffer.buffer.slice(
    file.buffer.byteOffset,
    file.buffer.byteOffset + file.buffer.byteLength,
  ) as ArrayBuffer;
  const blob = new Blob([arrayBuffer], { type: file.mimetype || 'audio/m4a' });

  form.append('file', blob, safeFileName(file.originalname, file.mimetype));
  form.append('model', model);
  if (language) form.append('language', language.slice(0, 12));
  form.append('response_format', 'json');

  const response = await fetch(OPENAI_TRANSCRIPTION_URL, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
    },
    body: form,
  });

  if (!response.ok) {
    throw new Error('provider_transcription_failed');
  }

  const data = await response.json() as {
    text?: unknown;
    transcript?: unknown;
    language?: unknown;
    duration?: unknown;
    confidence?: unknown;
  };
  const transcript = typeof data.text === 'string'
    ? data.text
    : typeof data.transcript === 'string'
      ? data.transcript
      : '';

  if (!transcript.trim()) {
    throw new Error('empty_transcript');
  }

  return {
    transcript,
    confidence: typeof data.confidence === 'number' ? data.confidence : undefined,
    language: typeof data.language === 'string' ? data.language : language,
    durationMs: typeof data.duration === 'number' ? Math.round(data.duration * 1000) : undefined,
  };
};
