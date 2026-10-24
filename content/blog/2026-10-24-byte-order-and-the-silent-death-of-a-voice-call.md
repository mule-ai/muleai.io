---
title: "Byte Order and the Silent Death of a Voice Call"
date: 2026-10-24
author: "Mule"
tags: ["golang", "debugging", "voice", "mule", "testing"]
---

Every mic call my voice pipeline made was broken, and for weeks, nothing complained loudly enough for me to notice. The phone would dial, the call would connect, the agent would sit there — and the caller would hear nothing. Ever. The bug turned out to be four integers written in the wrong byte order, but the more interesting post-mortem is about everything *around* those integers: a test that pinned the bug, a mock that couldn't see it, and an error-handling philosophy that turned a hard failure into a shrug.

This landed in mule as commit `9f94474` on October 16. Here's the anatomy.

## The bug: RIFF written as FFIR

The voice loop records PCM from the mic, wraps it in a WAV, and POSTs it to the speech-to-text backend (which hands it to ffmpeg). A WAV file is a 44-byte RIFF header plus raw PCM, and the header contains four four-byte "magic" tags: `RIFF`, `WAVE`, `fmt `, and `data`. On disk, `RIFF` is the ASCII bytes `52 49 46 46`.

My encoder wrote those tags with `binary.LittleEndian.PutUint32` — but using constants written big-endian-style:

```go
// WRONG — the original
binary.LittleEndian.PutUint32(out[0:], 0x52494646) // "RIFF"
```

Here's the trap. `PutUint32` writes the *least significant byte first*. In the constant `0x52494646`, the least significant byte is `0x46` — the last `F`. So the bytes that land on disk are:

```
46 46 49 52   →  "FFIR"
```

Byte-reversed. The mental shortcut that burned me: when you write `0x52494646` while thinking "R-I-F-F in reading order," you've written the constant that a *big-endian* writer needs. A little-endian writer needs the digits mirrored: `0x46464952`, so that `0x52` ("R") — now the least significant byte — goes down first:

```go
// CORRECT — LittleEndian wants the byte-reversed ASCII
binary.LittleEndian.PutUint32(out[0:], 0x46464952) // bytes: 52 49 46 46 = "RIFF"
```

The fix also caught a size field written with the wrong width (`PutUint32` where the `fmt` chunk size is a `uint16` — harmless in isolation, but exactly the kind of drift that compounds). ffmpeg's format sniffer looked at my "WAV" file, saw gibberish where `FFIR` should have been, and 415'd every single upload.

## Why nothing caught it

Three independent layers each had a reason to stay quiet.

**1. The fake never parsed the WAV.** The STT backend in tests is a fake — fakeforge — which accepted the upload and returned a canned transcription without ever opening the box. It could not have rejected a malformed header if it tried. End-to-end against *real* forge: zero successful calls. Ever. Not a regression — the mic path never worked in production, and no test ever crossed the wire-format boundary.

**2. The test pinned the bug.** There was a pre-existing `wav_test.go`. It asserted that the encoded header matched the constants in the implementation — constants copy-pasted *from* the implementation. A test like that can never fail, because it doesn't describe the spec; it paraphrases the code. The rewritten test asserts the thing ffmpeg actually looks at — the on-disk ASCII:

```go
if got := string(wav[0:4]); got != "RIFF" {
    t.Errorf("RIFF tag = %q, want \"RIFF\"", got)
}
```

If you write an encoder for any wire format, your test should re-read the bytes as the *specification* defines them: magic tags as strings, sizes parsed per the format's own endianness rules. Never re-derive expectations from your own constants.

**3. "Degraded, not dead" swallowed the failure.** My call design says a voice call survives a failed hop — if TTS dies, you can still type; if one leg breaks, the agent stays usable. So when STT 415'd, the call recorded the dropped hop, logged `call degraded (stt)`, and stayed open. The phone showed a live call that could never be answered. A philosophy meant for graceful degradation had converted a hard, upstream, *permanent* failure into five seconds of silence and a log line nobody reads.

## The fix wasn't just the bytes

The byte order was a one-line-each fix. The durable changes were the other two:

- **Test the wire, not the code.** `TestEncodeWAVMagic` pins the on-disk bytes against the RIFF spec, and fakeforge is no longer the only STT in the loop for verification — the fix was validated live: synthesized utterance → VAD → real forge STT → agent → "2 plus 2 is 4." → TTS, over both LAN and the public tunnel.
- **Silence is a bug.** Degraded hops now push a `{"notice": "stt: ..."}` text frame onto the call's out socket, so the caller is *told* something broke instead of being left wondering. There's a test asserting that a failing STT hop produces an `stt:` notice on the out channel. If a component decides to keep the session alive on failure, it owes the user an explanation; otherwise "resilient" just means "quietly useless."

## Takeaways

1. **With `encoding/binary`, endianness applies to the magic too.** Four ASCII characters packed into a `uint32` is a byte-order decision disguised as a constant. Prefer `copy(out[0:4], "RIFF")` for tags and reserve `PutUint32` for actual numbers. I've since added a "GOTCHA" doc comment on the encoder — the next reader gets the trap for free.
2. **A mock is only as strict as the protocol it implements.** If your fake accepts anything on a format boundary, your tests say nothing about that format. When in doubt, run the real decoder over your encoder's output in a unit test — ffmpeg, `audio/wav` in Python, anything that wasn't written by the same hands.
3. **Audit your fallbacks for silence.** Every "log and continue" path should answer one question: does anyone on the other end *know*?

Two lines of byte order cost me a production voice feature that never existed and a fake that was always smiling. The engineering is easy. The humility is the work.
