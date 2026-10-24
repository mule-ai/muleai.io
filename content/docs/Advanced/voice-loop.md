---
weight: 9
title: "Voice Loop"
description: "The full-duplex voice_call workflow step: VAD, STT, agent turn, and TTS over two WebSockets, with barge-in, steering, and graceful degradation"
icon: "article"
date: "2026-10-24"
lastmod: "2026-10-24T00:00:00-05:00"
toc: true
---

The **voice loop** lets a Mule agent hold a real-time phone/VoIP call. It
runs in-process as a workflow step of type `voice_call`
(`internal/voice`, Herd H6.3/H6.4, migration 0016): one Mule job, one call.
The step blocks until the call is hung up (job completes) or crashes (job
fails — how surfaces see "call dropped").

Audio flows **phone/host ⇄ Mule directly**; the ranch daemon stays out of
the media path. Surfaces create the job via the jobs API, then attach two
WebSockets.

## The loop

The call is a small audio state machine:

```
listening → utterance → thinking → speaking → listening …
```

1. **Listening / utterance** — the in-socket PCM stream is fed to a VAD.
   Speech above `vad_threshold` (RMS) opens an utterance; the utterance ends
   when trailing silence ≥ `silence_ms` **and** the speech/silence RMS ratio
   ≥ `endpoint_ratio` (or after `max_utterance_ms`).
2. **Thinking** — the utterance (WAV-wrapped) is sent to forge's STT proxy
   (`POST /v1/audio/transcriptions`), then the transcript is posted to the
   agent's forge conversation.
3. **Speaking** — the agent reply is synthesized via forge TTS
   (`POST /v1/audio/speech`, `tts_voice`, default Kokoro 24 kHz PCM) and
   streamed to the out socket.

### Full duplex: steering and barge-in

- **Steering** — while the agent is *thinking*, the VAD keeps listening.
  A completed overlapping utterance is transcribed and posted to the
  conversation as a steer (fire-and-forget, tagged, no TTS).
- **Barge-in** — while the agent is *speaking*, each in-frame's RMS feeds a
  hysteresis machine (`barge_in_threshold`, ~3 consecutive hot 30 ms frames).
  On trigger Mule abandons the in-flight hop, drains its out queue, and
  emits `{"flush":true}` so the client drops its own playback buffer
  (mule-side target < 150 ms).

If the client is slower than TTS, Mule drops the **oldest** queued audio
chunk — a late chunk is worse than a gap, and out-queue pressure never
pauses the listening loop.

## Transport

A call is addressed by its **job id** (128-bit; the id is the capability —
these routes are unauthenticated, like the fleet `/ws` feed):

| Route | Direction | Frames |
|-------|-----------|--------|
| `WS /voice/{job_id}/in` | user audio in | binary: 16 kHz mono s16le PCM (~30 ms frames). Text: `{"hangup":true}`, or `{"text":"…"}` (typed utterance — skips STT). Closing the socket hangs up. |
| `WS /voice/{job_id}/out` | agent audio out | binary: TTS PCM chunks (`tts_sample_rate`, v1 = 24 kHz). Text: `{"assistant":"…"}` after each turn, `{"notice":"…"}` on a degraded hop (stt/tts/agent failure — the caller is told, not left in silence), `{"flush":true}` barge-in control, `{"done":true}` at call end. |

Both sockets may attach immediately after job creation; the handlers wait
for the engine to register the call.

A minimal client:

```bash
# 1. start a workflow whose (only) step is type voice_call
curl -s -X POST https://api.muleai.io/api/v1/jobs \
  -H "Authorization: Bearer sk_mule_<hex>" \
  -d '{"workflow_id": "wf-123"}'          # -> {"id": "<job_id>", ...}

# 2. attach the two audio sockets
wscat -c wss://api.muleai.io/voice/<job_id>/in
wscat -c wss://api.muleai.io/voice/<job_id>/out
```

Sample rates are fixed by the protocol: **16 kHz mono s16le in both
directions** for the call (same as mobile voice input); TTS out-rate is set
by `tts_sample_rate` — the out socket carries no rate metadata, so surfaces
build their players up front.

## Step config

The `voice_call` step's config JSONB:

```json
{
  "forge_url": "http://forge:8140",
  "api_key": "sk_forge_…",
  "agent_id": "…",
  "conversation_id": "",
  "mode": "steer",
  "tts_voice": "af_heart",
  "tts_response_format": "pcm",
  "tts_sample_rate": 24000,
  "silence_ms": 500,
  "frame_ms": 30,
  "endpoint_ratio": 3.0,
  "max_utterance_ms": 15000,
  "vad_threshold": 300,
  "barge_in_threshold": 600,
  "turn_timeout_secs": 120
}
```

| Field | Notes |
|-------|-------|
| `forge_url`, `api_key` | required — how Mule reaches forge |
| `agent_id` | required unless `conversation_id` pins an existing conversation |
| `mode` | `steer` (default) or `message` — v1 posts the same `POST /messages`; the label tags provenance |
| `silence_ms` | VAD trailing-silence + early-partial point |
| `vad_threshold` | RMS floor for "user speaks" |
| `barge_in_threshold` | RMS floor to interrupt TTS (set clearly above `vad_threshold`) |
| `turn_timeout_secs` | bounds a single thinking/speaking turn |

A barge-in threshold clearly above the VAD threshold means the user has to
actually talk over the agent, not rustle papers.

## Failure behavior

- A failed STT/TTS/agent hop degrades gracefully: the loop emits a
  `{"notice":…}` on the out socket and keeps going instead of dropping the
  call.
- Unapproved or errored kills (crash, engine kill) return an error from the
  step → the job is marked `failed`.
- Clean hangup (`{"hangup":true}` frame or in-socket close) → job
  `completed`.

## Storage

Migration `0016_voice_step.sql` extends the `workflow_steps.step_type`
check constraint to allow `voice_call` (alongside `agent`, `wasm_module`,
and `forge_conversation`).
