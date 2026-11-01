# PR #132 Safari revision — NEEDS PHYSICAL UAT

Director physical iPhone UAT of `b114d8446e458f3909aea162c94fe2fcc49fb408` FAILED: no audible app guidance. That candidate is not accepted. PR #132 stays Draft/open; no merge or Production release.

## Proven versus unproven

Confirmed in b114 source: `speechCuePlan` immediately rejects an empty matching-language voice list, with no `voiceschanged` wait. The automatic preparation/count runs after asynchronous calibration/mic release, outside the initiating tap. Chromium's prepopulated fake voices cannot establish Safari voice availability or audibility.

Not yet established on the actual iPhone: whether policy eligibility was true; when the selected voice appeared; whether Safari blocked delayed synthesis; whether the requested playback category actually produced speaker output; whether Thai MP3 playback was blocked; or whether callbacks reported completion without audible sound. A callback is not an acoustic measurement.

App-mode resolution and the data contract are synchronous and respect active session snapshots. A `dev=1` query must not convert an active Public/Research snapshot. The new evidence reports initial session mode, current resolved mode, engineering role, strict eligibility and audio-policy flag; it does not relax them.

## Minimal correction and evidence

- Selected-language native voices are checked immediately and then awaited using `voiceschanged` with a bounded 1500ms deadline. The post-release ready-cue path rechecks its existing token/phase after the wait. No ASR or measurement window starts during this wait.
- The explicit Dev diagnostic panel prewarms this same bounded readiness check. If no native voice exists, Test Voice reports unavailable; if it arrives after waiting, the operator is told to tap again. Speech is never deferred into a later callback and misrepresented as gesture-bound.
- With a matching voice, Test Voice invokes native synthesis synchronously inside the actual tap, using the selected language and a retained utterance reference. It speaks existing preparation plus 3–2–1. A separate, explicitly labelled Thai-recording route uses the existing approved short preparation MP3.
- Test Voice is refused unless phase is IDLE/DONE, no local mic/AudioContext or recognition is active, and no startup/release is pending. Start and language controls are locked for the probe, restored afterward; existing Start/Retry/capture handlers are not rewritten.
- The panel is enabled only by strict engineering Demo eligibility AND `speechAudioDebug=1`. It is absent by default and absent in Public/Research. Losing Dev eligibility removes it and clears its memory.
- Diagnostic events contain only relative timing, allowlisted status codes, voice language codes and non-identifying mode/audio states. Voice names/URIs, utterance text, transcripts, participant/session IDs, scores, audio and research records are excluded. At most 60 events are retained; Copy audio summary includes the latest 24 and explicitly counts omissions. No uploads or persistence. Copy is manual, with a selectable-text fallback.
- Evidence includes native start/end/error/timeout, recorded outcomes, requested audio-session type/state, synth speaking/pending, user-activation state where the browser exposes it, microphone close/reopen and existing ASR engine/audio-start codes. The passive Dev-only `voiceschanged` observer also records late readiness after the bounded wait; it never starts playback.

Only application file changed: speech-test.html. b114 calibration, mic reacquisition, ASR callbacks/lifecycle, Retry, scoring, thresholds, recordings, language resources, navigation, other pages and SW remain unchanged. Exact restoration fixtures and source tests verify the boundary; supporting tests/CI/docs are updated.

## Exact physical protocol

Use the NEW immutable protected Preview, not the rejected b114 hostname. Open Dev Home first, then the supplied Speech URL with `dev=1&speechAudioDebug=1`. Confirm DEV MODE/engineering_only. A missing panel indicates ineligible context; do not bypass Research recovery or force a session mode.

1. Cold automatic run: before Start open Dev audio evidence, copy initial summary. Collapse it and test normally. Afterward copy the summary and state separately whether any sound was heard.
2. New Speech document, same device: open the panel before Start. Select TH/EN/JA normally. Test Voice using the native route. If it says tap again after voice wait, tap again. Report actual words/language heard or silence; an ended event alone is not a pass.
3. For Thai, separately select Thai recording only and tap Test Voice while inactive. Report whether the MP3 was heard. Do not select it as a substitute for EN/JA.
4. After the probe finishes, collapse the panel, perform the initial Speech attempt and three manual Retries (immediate and delayed). Copy after each. Verify audible preparation/countdown, all visual digits, real mic/ASR input, and no app instructions in the recognized speech. Test Full and Individual navigation.
5. Repeat on real iPhone Safari and Android Chrome. Also verify visual fallback when audio is unavailable, permission recovery and that ordinary Public/Research do not expose diagnostics.

Interpretation: direct-tap native heard but automatic silent points toward orchestration/routing; a delayed voice list plus later successful probe supports readiness/activation; native silent but Thai recording heard narrows the issue to native synthesis; both silent does not prove an app cause. Record these as evidence, not conclusions inferred from callbacks.

No participant data, audio or transcript should be pasted into the diagnostic report. Use synthetic/demo phrases only, no Research submission. Do not merge until Director explicitly accepts actual audible preparation/countdown and successful input on both devices. Status remains NEEDS PHYSICAL UAT.
