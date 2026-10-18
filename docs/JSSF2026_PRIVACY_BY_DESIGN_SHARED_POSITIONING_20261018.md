# QuickStroke — Privacy by Design: shared research, poster, oral, and demo positioning
**Date:** 2026-10-18
**Status:** Owner concept and technical truth-check. Editorial alignment only, no code/DB/consent/production changes.
**Scope:** QuickStroke JSSF 2026 Poster (A), Public/Presenter Demo (B), Oral presentation (C). Shared research branch `research/jssf-2026-poster-demo-kickoff-20261018`.

## Why privacy is central to QuickStroke
The team's *purpose* is to make stroke-warning-sign awareness and decisions more accessible using the smartphone people already carry, **without requiring capture and upload of personally revealing face video or raw voice recordings to a project research server**. Privacy is not an appendix; it is a first-order research/engineering constraint that shapes the camera, IMU, speech, telemetry and consent design.

**Design intent:** keep media/sensor signal processing local to the user's device where technically possible; reduce retained data; avoid collecting anything that makes it easy to trace records back to a particular face/voice/person; only collect limited derived technical measurements in expressly consented research. Never claim anonymity guaranteed merely because there are no raw media files.

## What current implementation/documentation supports (checked 2026-10-18)
1. **Face**: local camera capture and MediaPipe landmark processing; bounded/derived Face research summaries for consented studies; Face research payload explicitly records `rawImagesStored:false`, `rawFramesIncluded:false`, `rawLandmarksIncluded:false`. Face mesh shown live is not equivalent to raw images being stored.
2. **Arm**: device IMU signal processing; bounded orientation/drift features and selected derived traces; do not describe this as raw arm video, anatomical arm angle, or AI diagnosis.
3. **Speech**: browser ASR and on-page transcript processing; consented research telemetry explicitly excludes transcript text, raw audio and raw microphone frames. It includes derived coverage/quality/error/timing metrics (see `docs/JSSF_REMOTE_DATA_COLLECTION_DRAFT.md`). On-screen transient transcription is different from storing a raw transcript in research DB.
4. **Two operating modes**: Public mode must remain ephemeral, with no JSSF research upload. The optional JSSF research path, after consent v4, uploads **bounded derived technical records** and coarse technical/device metadata to protected research storage; 90-day primary-database retention, withdrawal workflow and scope documented. “Everything stays on device / nothing goes to a server” is NOT true of the research telemetry.
5. **Important caveat:** Derived metadata, device/browser combinations, dates and random Study IDs can still create privacy or reidentification risk in some contexts. “Cannot be traced back” is a *risk-minimization objective*, not a mathematical guarantee of anonymity.

## P0 GAP — Browser SpeechRecognition may send AUDIO to a service provider
**Verified code path (branch above, `speech-test.html`):**
```js
const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
if (SR) {
  recognition = new SR();
  recognition.lang = T.langCode;
  recognition.continuous = true;
  recognition.interimResults = true;
  recognition.maxAlternatives = 5;
  // In inspected creation block: NO enforced recognition.processLocally = true.
}
```
The speech debug bundle currently labels `recognitionMode:'browser_default'` and `rawAudioStored:false`. The latter is a storage property **not a network-proof**. Browser Web Speech API can use a server-based recognition service depending on platform/provider. MDN documents `SpeechRecognition.processLocally`, but it is experimental and unevenly supported; setting true requires capability/language-pack and real-device validation. References:
- https://developer.mozilla.org/en-US/docs/Web/API/Web_Speech_API/Using_the_Web_Speech_API
- https://developer.mozilla.org/en-US/docs/Web/API/SpeechRecognition/processLocally
- https://developer.mozilla.org/en-US/docs/Web/API/SpeechRecognition

**Owner requirement:** ultimate desired architecture is **no voice data leaving the user's device**, not merely “QuickStroke doesn't save WAV files to Supabase.” Current browser ASR path cannot be represented publicly as guaranteeing this until independently verified or replaced with a truly local ASR implementation. No assumptions that Safari, iOS Chrome, Android Chrome, and Japanese/English/Thai speech share the same privacy behavior.

**Engineering/demo acceptance task (not an authorized code change here):**
- Audit each currently used audio/mic/browser speech path and any vendor/network behavior; do not conflate lack of project-server upload with lack of any third-party upload.
- Research local-only ASR availability and language support by platform, or independently deployed on-device WASM model if technically feasible, assessing size, performance, offline capability, speech accuracy and UX.
- For browsers/languages without proven device-local ASR, decide on a transparent non-ASR fallback, explicit limitation or alternative. Do NOT silently fall back to cloud after claiming “audio stays on device.”
- Test empirically where possible; capture minimal non-personal proof and record versions/device and vendor docs. Separate verified privacy guarantees from architectural wishes.
- Flag potentially inaccurate current in-app mic privacy disclosures for review. Do not change consent/thresholds/production without separate review and CI/PR.

## Poster (A) — placement/copy and diagram
Make a visible, meaningful **“PRIVACY BY DESIGN”** callout in Scene 3 (architecture) near the Face/Arm/Speech pipeline, plus a short result/methods line in Scene 4. Integrate as fourth engineering constraint together with usability, meaningful signals and reliability. No need to make Privacy a whole new scene; retain STROKE/FAST comprehension, scientific charts and human-decision mission.

**Proposed copy, conservatively factual:**
> **PRIVACY BY DESIGN**  
> We do not store raw face video, photos, audio recordings, or speech transcripts in our research database. Consented studies collect limited derived measurements and technical quality indicators. Much of the signal processing runs on the phone.
> **Speech-recognition privacy is a remaining browser-dependent engineering challenge.**

Compact version:
> **No raw face or voice recordings in research storage. Limited derived measurements only.**

Visual: **device with Camera/IMU/ASR**, “local feature extraction” for confirmed paths, one **opt-in dotted arrow** for consented **derived metrics only** to protected research server, a distinct **browser-provider ASR?** risk/path visibly marked as platform-dependent under review. No big sweeping “100% offline / 100% local speech / anonymous” badge.

Be careful in comparisons: **do not assert that other named stroke projects send all raw recordings to servers** without direct sources. Position as our architectural choice, not universal superiority.

## Oral (C) — revise `QuickStroke_Pitch_V3.pptx`, don't rebuild pitch
Privacy should be a meaningful **architecture/research-design innovation**, not a footnote on consent. Show a clear sketch:
**Phone → local camera/IMU feature extraction → transient observable signals → consented bounded derived telemetry to research store**, with separate browser ASR vendor processing caveat pending engineering review.
A suggested student talk sentence:
> “We designed QuickStroke to minimize sensitive data collection. Our research database does not store face videos or voice recordings—only limited derived measurements with consent. We are also investigating how to ensure speech recognition stays on the device across supported browsers.”

Potential Q: “Does no voice file on your server mean audio never leaves the phone?” 
Correct A: “Not necessarily. Our app does not upload or store audio recordings, but some browsers use online services for speech recognition. We are treating verifiable on-device ASR as a privacy requirement for future development and will not claim it is guaranteed on every platform today.”

## Presenter demo (B)
- Demonstrate Face mesh on-device without writing screenshots or saving camera frames; show local drift traces, non-retained mic/transcript display where supported.
- Add an accessible **“How we protect privacy”** information panel; labels match verified paths. 
- Public demo and JSSF research consent/ingestion remain separated. Do not record a visitor's speech/face for marketing without explicit separate consent.
- Prove on-device processing claims per supported feature, device and browser; speech ASR is special risk. Do not record device/camera/mic without explicit interaction and permissions.

## Non-negotiable research and communication guardrails
- Minimize what is retained. Technical quality and session metadata can still be personal/sensitive.
- Clear consent and retention/withdrawal handling for research events, per actual implementation and policy.
- Medical safety: suspected stroke demands immediate emergency care; do not wait for an app.
- Clinical accuracy not established; no “AI stroke detector” claim.
- No policy change implied by this document. Confirm actual implementation at release/printing time.
