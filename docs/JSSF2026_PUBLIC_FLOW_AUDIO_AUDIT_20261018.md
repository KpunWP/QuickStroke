# Public Full / Individual Flow and Audio Audit
**Date:** 2026-10-18 (Asia/Bangkok)  
**Baseline:** `research/jssf-2026-poster-demo-kickoff-20261018` @ `486a002a`  
**Audit branch:** `research/jssf2026-public-flow-audio-audit-20261018`  
**Scope:** Public only, TH/EN/JA, Face → Arm (left/right) → Speech → Result; Individual and Retry. **No production changes or JSSF contract/threshold changes.**

## Evidence classification
- **SOURCE VERIFIED:** Actual page and locale source inspected, plus deterministic source regression tests.
- **DEVICE NOT VERIFIED:** No iPhone, iPad, Android microphone, speaker, sensor, network or permission path was executed by this code audit. Real spoken output, voices installed on device and audio-session behavior remain unknown.
- Existing CI is source/algorithm-policy regression, **not real audio playback UAT**.

## Public flow map from actual source
1. `index.html` provides Full (`prepareScreeningSession('full')`) and Individual (`prepareScreeningSession('individual')`); uses `fast_lang`.
2. Full: Face prompts `FL.restVoice` → `FL.smileVoice` → `arm-test.html`. Individual Face → Result.
3. Arm: intro, left Step 1/2, `T.vWait_left`; during 10-second measurement `T.vReady`, `T.vMid4` and `T.vMid7`; `T.vDone`; right-arm confirmation voice; right Step 1/2, right measurement; Full → Speech and Individual → Result.
4. Speech: locale phrase `T.target`; first-use microphone permission/disclosure; optional instructional audio per platform; calibration; visual 3-2-1 and ASR readiness; recognition `T.langCode`; Retry and Result. The code starts recognition only after the preparation/cue gate. Speech's text-to-speech and microphone capture must not overlap.
5. Result: Public Full/Individual are rendered separately. `จบการทดสอบ ขอบคุณค่ะ` is currently tied to **JSSF remote finalization**, not ordinary Public Result.

## Findings and dispositions
| ID | Priority | Finding based on source | Disposition |
|---|---|---|---|
| PUB-A01 | P1 | Public `index.html` initialized language selector inline **before** loading `js/languages.js`, potentially leaving selector blank with a JS ReferenceError. | **FIXED on audit branch**, moved dependency before inline render. Not merged. |
| PUB-A02 | P1 | Arm between left and right used hard-coded Thai `ลดแขนลง` and `เริ่มทดสอบแขนขวา` for all locales. | **FIXED on audit branch**, uses existing localized `T.instrDone_left` and `T.btnNext` keys. Not merged. |
| PUB-A03 | P1/device | Public iOS Speech **intentionally skips** pre-capture audio: `SPEECH_SILENT_START_TRIAL = IS_IOS && !IOS_ASR_ONLY_TRIAL`; this avoids historical iOS dead-mic regressions but may conflict with the desired audible instruction. | Leave unchanged until iPhone UAT. Preserve no concurrent TTS/microphone behavior. |
| PUB-A04 | P1/UX | `playSpeechInstructionBeforeCapture()` explicitly skips non-Thai languages, so English/Japanese Public do not get a spoken preparation cue in this path. | Confirm expected cue policy and device results before changing audio-session timing. |
| PUB-A05 | P1/device | Android Thai prompts may use bundled MP3, whereas iOS tends toward native TTS and may lack an installed Thai voice; `visual_only` is possible. Public and consented JSSF have intentionally different fallbacks. | Test native voice installed and recorded route separately, especially Samsung; never claim audio pass from source. |
| PUB-A06 | P2/UX | Arm currently includes a start beep and `vReady`, plus spoken `vMid4` / `vMid7` at 4 and 7 seconds. Speech countdown contains an optional beep on some non-Android paths; JSSF Android's spoken digits are isolated. | Decide whether the Public countdown/measurement must be visual-only, then change only voice presentation after UAT, not scoring. |
| PUB-A07 | P2/UX | Public Result has no auto thank-you speech; the terminal spoken message is gated to consented remote JSSF finalization. | Do not copy research finalization speech into Public without defining desired Public completion semantics. |
| PUB-A08 | Important privacy | Browser SpeechRecognition uses browser-managed ASR; transport can depend on browser and may use a remote service. QuickStroke does not thereby gain a server audio store; **cannot claim all audio remains on device** in existing Public speech route. | Keep as accurate limitation; evaluate offline ASR separately, never conflate app non-storage with provider non-transmission. |

## Minimum physical UAT (run on the actual venue devices)
For **each language TH, EN, JA**, start from a clean Public session and record *audible yes/no*, *correct language*, *cue order*, *permission success*, *transcript and retry*, *errors*, *device/browser/version*:
1. **Home:** language buttons visible and can switch before and after disclaimer; Full / Individual accessible without Research controls.
2. **Face:** opens camera, rest cue audible, smile cue audible, countdown and result, Repeat, then navigates to Arm for Full or Result for Individual.
3. **Arm:** intro and Step 1 cue; confirm left and Step 2 cue; 10s countdown, any voice/beep; completion voice; "confirm right" voice in selected language; right Step 1/2, 10s, result, retry, Speech/Result navigation. Check image/side/cue synchronization.
4. **Speech:** preparation / countdown / "speak now" visual state; actual mic permission; one complete transcript; recognition of the selected-language target; first run and at least two retries; microphone error recovery; prior TTS does not enter transcript; exit to Result.
5. **Result:** Individual does not show untested modules as completed, Full shows all; normal/warning safety copy, re-test and Home; note no Public completion TTS in the current baseline.
6. **Device matrix:** iPhone Safari and Android Chrome are mandatory. iPad Safari is extra for booth feasibility. Include Samsung Android browser if available because Thai TTS fallback behavior differs.
7. **Privacy:** confirm no audio or video recording upload in our application; avoid assuming Browser SpeechRecognition itself is strictly local.

### Stop / release gates
- **Do not merge** merely on CI. Real-device checks and PR review remain mandatory.
- **Do not change** Face / Arm / Speech clinical scoring, Research/Dev modes, schema, remote contracts, consent or pilot data.
- **Do not start Whisper integration** until Public flow/audio baseline and platform-specific failures are documented.
