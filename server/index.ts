import express, { type Request, type Response } from 'express';
import multer from 'multer';
import { checkRateLimit } from './rateLimit';
import { transcribeWithOpenAI } from './sttProvider';

const app = express();

const maxFileSizeMb = Number(process.env.STT_MAX_FILE_SIZE_MB ?? 10);
const maxFileSizeBytes = Math.max(1, maxFileSizeMb) * 1024 * 1024;

const acceptedMimeTypes = new Set([
  'audio/m4a',
  'audio/mp4',
  'audio/mpeg',
  'audio/wav',
  'audio/webm',
  'application/octet-stream',
]);

const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: maxFileSizeBytes,
    files: 1,
  },
});

const clientIp = (req: Request) =>
  (req.headers['x-forwarded-for']?.toString().split(',')[0] || req.socket.remoteAddress || 'unknown').trim();

const safeError = (res: Response, status: number, error = 'transcription_failed', message = 'Could not transcribe audio.') =>
  res.status(status).json({ error, message });

app.get('/health', (_req, res) => {
  res.json({ ok: true });
});

app.post('/api/stt/transcribe', (req, res) => {
  if (!req.is('multipart/form-data')) {
    safeError(res, 415, 'unsupported_media_type', 'Expected multipart/form-data.');
    return;
  }

  const rate = checkRateLimit(clientIp(req));
  res.setHeader('X-RateLimit-Remaining', String(rate.remaining));
  res.setHeader('X-RateLimit-Reset', String(rate.resetAt));
  if (!rate.allowed) {
    safeError(res, 429, 'rate_limited', 'Too many transcription requests.');
    return;
  }

  upload.single('file')(req, res, async (uploadError) => {
    if (uploadError) {
      safeError(res, 400, 'invalid_upload', 'Could not read audio upload.');
      return;
    }

    const file = req.file;
    const language = typeof req.body?.language === 'string' ? req.body.language : undefined;
    const scenarioId = typeof req.body?.scenarioId === 'string' ? req.body.scenarioId : undefined;

    if (!file) {
      safeError(res, 400, 'missing_file', 'Audio file is required.');
      return;
    }

    if (file.size > maxFileSizeBytes) {
      safeError(res, 413, 'file_too_large', 'Audio file is too large.');
      return;
    }

    if (!acceptedMimeTypes.has(file.mimetype)) {
      safeError(res, 415, 'unsupported_audio_type', 'Unsupported audio format.');
      return;
    }

    const started = Date.now();
    try {
      const result = await transcribeWithOpenAI({ file, language });
      const durationMs = result.durationMs ?? Date.now() - started;
      console.info('stt_transcribe_success', {
        durationMs,
        fileSize: file.size,
        language: result.language ?? language ?? 'unknown',
        scenarioId: scenarioId ?? 'none',
      });
      res.json({
        transcript: result.transcript,
        confidence: result.confidence,
        language: result.language ?? language,
        durationMs,
      });
    } catch {
      console.warn('stt_transcribe_failure', {
        fileSize: file.size,
        language: language ?? 'unknown',
        scenarioId: scenarioId ?? 'none',
      });
      safeError(res, 502);
    }
  });
});

const port = Number(process.env.PORT ?? 8787);

app.listen(port, () => {
  console.log(`Roleo STT proxy listening on :${port}`);
});
