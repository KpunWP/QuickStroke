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

## 2026-10-19 follow-up: completed Full round and Japanese Speech closing voice
- User confirmation: on Public Home, an already completed Full round must not hijack the primary action into old Result. Main button now reads "Test All Again / ทดสอบทั้งหมดอีกครั้ง / 3項目をもう一度" and creates a fresh screening before Face. An explicit "View Last Result" button remains while prior results are present. Research/Dev retain previous protocols.
- Public Japanese Speech closing text exists (`発話テストが終わりました。`), but Safari may not start queued speechSynthesis after ASR microphone release. Opt-in Public-only closing path now restores `navigator.audioSession.type='playback'`, resumes speechSynthesis, attempts auto-play after mic release, and shows a localized outcome/failure notice and manual playback fallback.
- Do **not** assert this means automatic speech is reliable on all iPhones. No Japanese prerecorded fallback is bundled. Check `speechSynthesis.getVoices()` for an available Japanese voice if result says unavailable; speaker autoplay after cross-page navigation remains browser-controlled.
- Result attempts a short completion TTS automatically and leaves a replay button visible if the device blocks auto-play. No diagnosis or result interpretation is spoken.
- Mandatory device UAT: iPhone Safari JA Speech twice (first attempt and two retries), observe on-screen TTS notice. Compare Result automatic voice vs direct gesture replay. Keep normal Public and JSSF baseline unchanged until confirmed.

## 2026-10-19 evening: iPhone Public spoken 3–2–1 not audible
**Observed by tester:** iPhone Speech shows 3–2–1 but has no spoken digit audio.

**Code finding:** on the opt-in Public UAT path, the microphone/WebAudio stream is live during READY_CUE; `playPublicTtsCountdownDigit` previously called `speechSynthesis.cancel()` before **every** number. WebKit has reported media session routing/interference between `speechSynthesis` and live `getUserMedia` tracks. The exact physical cause on this iPhone remains unconfirmed, and a SpeechSynthesis `onend` event alone does NOT prove the speaker was audible.

**Mitigation (Preview only):**
- Use language-specific spoken number words rather than bare numeric text: Japanese 三・二・一, English Three/Two/One, Thai หนึ่ง/สอง/สาม, visually still counting 3→2→1.
- Do not cancel the synthesizer before every number; reset once on 3 and then let each utterance complete.
- Display each digit's `ended`, `no_start`, `timeout`, etc. on screen; preserve the large visual 3–2–1.
- If the browser reports failed TTS and this is iOS, try the existing short WebAudio tone (not claimed as spoken numeral). The audioSession category and active microphone stream are **not** manipulated during countdown, avoiding new dead-mic risk from changing audio routing.
- Keep Public experiment opt-in behind `?publicTtsTrial=1`; no Research/Dev/normal Public change.

**Device gate before considering production:** On the same iPhone, verify visually reported status *and* actually audible words, then verify ASR transcript and **at least two consecutive retries**; if TTS reports `ended` but no voice is audible, do not call the problem fixed. A real prerecorded English/Japanese spoken-countdown fallback is a future option if native iOS TTS proves incompatible with an active mic, but requires approved, tested voice assets, and a safe speaker/mic handoff.
