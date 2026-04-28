# Roleo STT Proxy

Minimal backend endpoint for voice repeat transcription.

## Endpoint

`POST /api/stt/transcribe`

Multipart fields:

- `file`: audio file (`audio/m4a`, `audio/mp4`, `audio/mpeg`, `audio/wav`, `audio/webm`)
- `language`: optional target language code
- `scenarioId`: optional metadata

Success:

```json
{
  "transcript": "Could I get that with oat milk?",
  "confidence": 0.92,
  "language": "en",
  "durationMs": 3200
}
```

Failure:

```json
{
  "error": "transcription_failed",
  "message": "Could not transcribe audio."
}
```

## Local Run

```sh
OPENAI_API_KEY=sk-... npm run server
```

Manual test:

```sh
curl -X POST http://localhost:8787/api/stt/transcribe \
  -F "file=@sample.m4a;type=audio/m4a" \
  -F "language=en" \
  -F "scenarioId=demo-scene"
```

## Privacy

Voice recordings are processed for transcription and are not stored by the app backend. Uploads are kept in memory for the duration of the request only. Logs should include metadata such as file size, language, success/failure, and duration, but must not log the full transcript.

## Production Notes

The in-memory rate limiter is suitable only for a single-node MVP. For production/serverless deployments, replace it with shared storage such as Redis, Upstash, or provider-level rate limiting.
