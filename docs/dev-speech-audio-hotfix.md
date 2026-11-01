# Technical Demo Speech audio hotfix — NEEDS PHYSICAL UAT

Base: latest verified main and Production `e0e1280f142e022f1b5b17688242d35a31ccc753`.
Branch: `fix/dev-speech-audio-guidance-20261101`. No Production deployment/merge is authorized.

## Confirmed source cause

In the released `speech-test.html`, `SPEECH_SILENT_START_TRIAL` covers regular iOS, while the speaker-first exception `PUBLIC_IOS_SPEAKER_FIRST` and opt-in `PUBLIC_SPEECH_TTS_TRIAL` exclude Dev. Dev iOS therefore skips preparation and spoken digits. Android's spoken count is enabled only by `ANDROID_JSSF_SPEECH_CUES` for consented Research; the generic Android branch also skips the beep. Legacy preparation skips EN/JA entirely. This is output routing, not evidence of a transcription/scoring failure.

## Narrow policy and sequence

A separate `DEMO_SPEECH_AUDIO` predicate requires actual Dev session context, strict existing engineering Demo eligibility, and no iOS ASR-only experiment. Public flags, Research consent predicates, capture/ASR policy flags, KEEP_MIC_ALIVE, Start/Retry dispatch and acquisition remain intact.

Every Demo attempt follows the actual calibration-ready boundary:

1. Existing permission/user-gesture/capture and quiet calibration.
2. Existing calibration-mic close helper; no ASR active, stream or WebAudio capture survives into output.
3. Existing localized `speechCueText()` through existing cue delivery. TH may use approved recorded preparation when native Thai is unavailable. No voice from another selected language is substituted.
4. Existing single-utterance countdown with matching selected-language voice, avoiding three separate iOS utterances. Android without native Thai can reuse approved Thai recorded digits (bounded 2s each, existing 1s cadence). No new recordings.
5. Native/recorded output stopped before capture. iOS/PCM uses the existing bounded post-speaker getUserMedia/live-track/unmute/AudioContext-resume helper. Android retains its existing exclusive Web Speech acquisition path.
6. Original RECORDING transition, ASR callbacks, cue-to-speak readiness and measurement logic.

Dev visual timers also advance 3→2→1 if synthesis never fires onstart; the ordinary Dev minimum three-second visual window remains. The wait is bounded if synthesis hangs. Error/time-out output is cancelled; token guards prevent an older attempt cancelling a later cue. Existing stopAll also cancels Dev output on reset/exit. When a post-cue microphone failure produces an existing invalid result, Dev removes its stale countdown presentation class so the original Retry/result controls remain reachable.

## Language and platform limits

- TH: matching Thai voice; approved existing Thai preparation fallback; Android's existing recorded-count support when no Thai voice exists.
- EN/JA: matching-language native voice. Missing/late voice list, blocked playback, synthesis error or timeout → readable visual guidance, never another spoken language.
- iOS without a matching voice: visual countdown. This patch does not claim reliable sequential prerecorded iOS countdown; it avoids adding an unvalidated audio-assembly mechanism.
- Safari may deny or mute delayed speech output even if onend fires. onend and synthetic Chromium cannot establish real audibility.
- Post-speaker mic acquisition requires existing granted permission. Its Safari hardware/session behavior is a mandatory device gate; no new speculative delays or ASR-start timeout changes were added.
- Existing Android/iOS ASR availability, network needs, retry behavior and permissions still apply. No offline-ASR guarantee.

## Scope and tests

Only runtime file: `speech-test.html`. No Face/Arm/Result/Home, locale, audio asset, manifest, engineering overlay, research/consent/store, navigation, ASR callbacks, scoring, threshold, calibration math or Service Worker changes.

`tests/fixtures/dev-speech-audio-patch.json` inventories every runtime edit. Source tests reverse this exact allowlist to main and freeze all other bytes, including entire acquisition/Start/Retry/recognition/scoring functions. Historical restoration fixtures and old source assertions are extended explicitly rather than replacing engine hashes.

Focused browser test executes the actual calibration runLoop, ready-cue branch, speaker close/reopen helpers, ASR callbacks and UI dispatch. Only media/voice boundaries are synthetic. It covers TH/EN/JA on Chromium iPhone/Android UA profiles, initial attempt plus three retries, Full/Individual context, wrong/missing voices, audio error/never-start, recorded fallback, mic denial/recovery, visible countdown progression and no output/capture overlap. These UA profiles are NOT physical Safari/Chrome acceptance. Existing Public/Research, language, offline, Speech/ASR and core suites remain required. No real microphone/audio, emergency call or live Research submission occurs in automation.

Inline HTML delivers the patch atomically; existing SW v108/network-first HTML and already cached recordings need no asset/cache migration. Returning devices must first load the new HTML online; offline fallback depends on installed voices/cached recordings, and unavailable playback stays visual.

## Director physical gate — before merge

Use the exact protected Preview in a fresh Dev context. Test real iPhone Safari and Android Chrome separately:

- TH, EN, JA: preparation audible and correct language; 3–2–1 audible and all visual digits clear. Record voice availability, muted/speaker volume and whether recording fallback was used.
- Full and Individual Speech: first attempt and at least three consecutive manual retries; immediate and delayed Retry. Actual transcript/mic/recognition status must remain healthy.
- Verify no guidance is audible during listening/capture, and the displayed Speak prompt appears only when recognition is ready.
- Missing/blocked audio must leave a usable visual countdown; never substitute another language. Permission denial must expose original recovery/Retry controls.
- Check return navigation, selected language, Technical Data and no Public/Research leakage. No participant/research submissions.

Final status remains NEEDS PHYSICAL UAT until Director explicitly accepts both devices. Do not merge, tag or deploy Production on the basis of synthetic tests.
