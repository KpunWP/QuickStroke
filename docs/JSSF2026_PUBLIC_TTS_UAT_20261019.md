# QuickStroke Public TTS & Japanese Arm UAT — 2026-10-19

Status: **Research Preview only**. Not merged, not enabled for normal Public or JSSF Research/Dev.

## Goal
Test actual device-delivered voice for Speech and Result while keeping the working Public ASR and JSSF protocol intact. Reduce Japanese Arm step-2 cue duration.

## Changes
- Japanese Arm `vWait_left`: 「左腕を前に伸ばし、そのまま動かさないでください。」
- Japanese Arm `vWait_right`: 「右腕を前に伸ばし、そのまま動かさないでください。」
- Same Arm measurements, readiness and UI. Progress to calibration still occurs after `speakNow(..., onDone)`. There is a guard timeout for OS speech engines that never fire onend.
- **Opt-in only**: open Public Home with `?publicTtsTrial=1`; stores `qs_public_tts_trial=1` for the current same-origin browser tab. Turn off through `?publicTtsTrial=0` or close the tab. The flag is cleared when Home detects Research/Dev mode; Speech additionally checks canonical appMode is public.
- Speech first-use Public trial: play a short Thai TTS/recorded cue or localized English/Japanese TTS cue from the Start click; await cue before microphone disclosure and capture. In ordinary Public and JSSF, the existing platform-specific audio path is unchanged.
- Speech voice test control (🔊) is shown in Public opt-in IDLE/DONE only. At DONE on iOS, exercise caution with microphone resource/retry testing. This does not automatically narrate speech results while ASR is running.
- Result Public opt-in: best-effort TTS completion phrase (neutral, no diagnostic interpretation), with an explicit replay button in all languages for browsers that block autoplay. It does not depend on Research/JSSF finalize.
- No raw audio, video, landmarks or identifying data are added to analytics; browser-managed SpeechRecognition still may use a remote provider in Public.

## Physical UAT
1. Start a **new Public Full** session from the opt-in preview link; use Safari on iPhone first.
2. Japanese Arm: listen to **both** step-2 cues. Both must finish before step 3/measurement begins. Record whether the selected side and guide match. Compare Thai/English briefly.
3. Speech: first press 🔊 in IDLE, then Start. Verify spoken cue is audible and completely finishes before microphone disclosure; confirm visual 3-2-1, recognized transcript and successful result. Run 2 retries, note iOS dead-mic or incompatible audio-session category errors.
4. At Speech DONE, the 🔊 button replays a *completion voice* on direct tap. Navigate to Result.
5. Result: if no voice autoplay, press 🔊 Play voice to test a fresh user gesture. Confirm the voice says only "test completed/thank you" and NEVER narrates a clinical diagnosis.
6. Repeat on Android Chrome, then EN/JA. Test disabling `?publicTtsTrial=0` and confirm UAT voice controls disappear; ordinary Public retains its previous audio path.
7. Track device model, OS/browser version, TTS success/no start/error, exact location of silence, and Speech Retry outcomes. Never claim CI proves device audio.

## Release gate
Do not promote experimental Public TTS to normal Public until iPhone and Android capture/retry results are collected. Do not change JSSF Research consent, audio route, pilot data, or stroke evaluation thresholds.
