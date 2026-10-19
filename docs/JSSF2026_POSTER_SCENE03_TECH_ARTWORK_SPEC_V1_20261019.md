# QuickStroke JSSF 2026 — Scene 03: Inside the Technology, Artwork & Evidence Specification v1
**Date:** 2026-10-19 | **Status:** detailed blueprint for graphic/layout approval, NOT final art or live engine evidence. **Branch:** research/jssf-2026-poster-demo-kickoff-20261018.
**No software/DB/consent/threshold edits.** Read sources on named branch: `face-test.html`, `arm-test.html`, `speech-test.html`, `docs/JSSF_REMOTE_DATA_COLLECTION_DRAFT.md`; plus seven-scene Storyboard v2, AI positioning, and Privacy by Design.

## Creative purpose and acceptance condition
Scene 03 should attract a general-science fair viewer and let a student explain the actual engineering in ~30–45 seconds. **The large visual is a measurement instrument, not a fake medical AI diagnosis.** Keep medically recognizable relationship from top FAST panel, but show the precise *proxy signals* each module handles.
Headline: **THREE TASKS. THREE MEASURABLE SIGNALS.**
Subtitle: **From familiar stroke warning signs to interpretable smartphone measurements.**
Not a claim that each module is AI, nor that a phone detects actual pathology.

## Overall placement/visual system
- Place directly below Scene 01/02 top (~20–23% of physical portrait poster), consume approximately **28–32% of poster height**.
- **Three equal vertical science columns** labeled FACE / ARM / SPEECH, with harmonized panel structure: (1) user task pictogram/photo, (2) large **verified processing visual**, (3) maximum two actual metrics + their units, (4) brief quality/limitation line.
- Aim 55–60% of each panel's interior for authentic evidence image, ~15–20% for title/method, ~20–25% for annotations/quality cue. Allow unequal visual weights if Face mesh needs large clear screenshot.
- Color continuity (illustrative, editable): Face turquoise/teal; Arm blue; Speech warm amber/violet; keep title/body neutral dark/navy on light background for print. Distinct tags **AI/MediaPipe**, **IMU/signal processing**, **AI/browser ASR**.
- Align panel footer to Scene 05 research chart color and variable names. Draw faint flow arrows **Task → Sensor → Derived metric → Quality gate**, not giant neon brain-shaped AI graphics. Avoid over-decorating.

## Panel A — FACE: the smartphone camera and ML landmarks
**Purpose:** show exactly how a smile/face observation becomes a measurement.
Proposed short copy:
> **FACE — AI-Based Landmark Tracking**  
> Smile for the front camera. MediaPipe tracks facial landmarks while the app estimates left/right mouth movement, asymmetry and tracking quality.
> **Measures facial movement, not stroke diagnosis.**

**Verified code references:** `face-test.html`:
- Approx. lines 1850–1857: developer mesh overlay exists (`?mesh` debugging mechanism). Demo crew should make an isolated Presenter route; do not expose Dev mode publicly.
- 4945–4975: `faceLandmarker.detectForVideo(videoEl, ts)`; `handLandmarker.detectForVideo` in smile phase for mouth/hand occlusion.
- 4670–4740: computed `blendAsym`, `riseAsym`, `weakRatio`, `rep = max(blendAsym,riseAsym)` with conditional override for weak side, and smile frame quality checks. This is an *algorithmic internal normalized index*, NOT an angle or probability of having a stroke.
- 3180–3260: 2D eye-centered/scale/roll normalization, signed mouth rise relative to baseline, median aggregation of valid smile frames; Landmark Z is not used as anatomical depth measure; yaw/pitch quality gated.
- Research payload includes `smile.representativeAsym`, `smile.weakSideRatio`, valid frame counts, mouth visibility/hand overlap, and `rawImagesStored:false`.

**Evidence image asset A1 (P0):** a new *publication-consented adult* live camera screenshot with genuine Face Mesh showing mouth-area magnification (no fake plotted dots). Crop to portrait with face filling frame, no background/ID. Label nodes/areas, but avoid implying a specific participant has a condition. Retain proof of consent in organizer records; no raw pilot face imagery used without specific publication consent.
**Annotation overlay A2:** tiny split left/right arrows near mouth corners, caption **Mouth movement (relative)**; a minimal “Rest → Smile” diagram. Annotate “Quality: visible mouth + sufficient smile frames”.
**Metric badges A3 (choose up to two):** `Smile asymmetry index` (dimensionless normalized) and `Valid smile frames / coverage`. Add no fake individual numbers unless captured live/authorized. Avoid `stroke likelihood 92%`.
**Transition to Scene 05:** distribution for `faceResearch.smile.representativeAsym` **among 104 metric-bearing valid attempts in preliminary Oct 18 snapshot**; algorithm might have selection/clip effects and version confound; confirm final denominator & definition before printing.

## Panel B — ARM: phone orientation and drift trace (not arm angle)
**Purpose:** allow viewers to see measurable inertial sensor dynamics, and the left/right procedural instruction.
Proposed short copy:
> **ARM — Smartphone Motion Analysis**  
> Hold the phone while extending one arm. Motion sensors track changes in phone orientation over time and estimate drift.
> **Phone drift is not a direct measure of muscle strength.**

**Verified code references:** `arm-test.html`:
- 2615–2685: DeviceOrientation/DeviceMotion permissions/availability; fallback and source checks.
- 2801–2807: `isSensorFresh` rejects stale/incomplete sensor state.
- 2940–3070: bounded `armResearch.trace` built only for MEASURE phase, **up to 21 points**, with `tMs`, `driftDeg`, `driftMaxDeg`, motion source and sensor-freshness. `measurement.finalDriftMaxDeg`, `posture.baselineStableSpreadDeg`, `sensor.acceptedSamples` also recorded.
- There are distinct left and right target attempts, readiness and movement QC, and the measurement is device-orientation drift, not anatomical joint movement or true strength.

**Evidence image asset B1 (P0):** existing corrected left/right smartphone hold instruction artwork from repo (confirm the intended hand and license); draw a small orientation-change arrow around *the phone*, not the shoulder joint.
**Evidence chart asset B2 (P0):** one **genuinely measured** orientation drift vs time trace from a separate **controlled engineering demonstration**, with a non-identifying source and actual trace values; plot x-axis `Time (s)`, y-axis `Phone drift (°)`, show small `Max observed drift: __°`, and side label `LEFT / RIGHT`. Prefer a deliberately staged capture, not publication of a single JSSF participant event without an appropriate release. If no approved trace exists, use an empty, clearly labeled placeholder and delay filling until QA.
**Metric badge B3:** maximum phone drift (°), sensor sample quality, optional baseline stability (°). Do not imply 10-sec trace always has 21 samples; 21 is a payload cap.
**Transition to Scene 05:** valid-attempt distribution `armResearch.measurement.finalDriftMaxDeg` (preliminary Oct 18 n=283; median 0.707°); left–right paired comparisons only if events can be validly paired and controlled.

## Panel C — SPEECH: visible ASR stages and honest privacy mode
**Purpose:** viewers see AI speech recognition within the actual app, not a fabricated waveform or “slurred speech detection”.
Proposed short copy:
> **SPEECH — AI-Assisted Speech Recognition**  
> Speak the prompted phrase. Browser speech recognition converts speech into text; QuickStroke checks phrase completeness and recording quality.
> **Phrase recognition is not a clinical test of speech impairment.**

**Verified code references:** `speech-test.html`:
- ~3743–3750: browser `SpeechRecognition || webkitSpeechRecognition`, `recognition.lang`, continuous and interim results, `maxAlternatives=5`. No `processLocally=true` enforced here.
- 4646–4720: `recognitionMode: 'browser_default'`, derived `phrase.similarity`, `transcriptCoverageRatio`, `asr` result/started/error counters, `quality`, and `privacy: {rawAudioStored:false,transcriptIncluded:false,rawFramesIncluded:false}`.
- ~5390–5450: phrase matching and coverage/technical quality are separate; exploratory speech rate is not a clinically validated impairment score. Interpreted on-screen text must not be confused with a stored participant transcript.
- Owner/demo plan: Presenter may trial preloaded on-device Whisper; Public continues fast **browser/service speech recognition**, which may use a third-party server. Local Whisper not to be represented as operational until offline/live testing passes.

**Evidence image asset C1 (P0):** capture a staged, on-device screenshot that shows **the actual current English/Japanese prompt** (from current build), microphone state, and actual recognized sentence. Do not invent words in the final screenshot or export stored participant transcripts.
**Annotation C2:** minimal pipeline `Prompt → Mic ready → Browser ASR text → Phrase coverage / quality`, branch for `Not evaluable` due to incomplete/permission issues. **No soundwave unless measured and sourced**.
**Metric badge C3:** `Phrase coverage` and `ASR readiness / quality` (definitions checked with the current engine). No similarity=100% as “recognition accuracy”: selected valid attempts tautologically pass exact matching.
**Whisper inset:** optionally include tiny **“Testing preloaded local Whisper for Presenter Demo”** after team produces real offline execution evidence. Do not blur with the Public visitor path or label all Speech ASR “on device”.
**Transition to Scene 05:** per-attempt evaluability and technical issues (Oct 18: valid 190 / 276 Speech attempts, with iOS/browser confounding). Don't imply clinical dysarthria sensitivity.

## Privacy-by-design strip: a fourth scientific/engineering contribution
**Placement:** a **thin full-width horizontal ribbon directly below the three panels** or right-side integrated diagram, before Scene 04.
Short truthful copy:
> **PRIVACY BY DESIGN**  
> **No raw face videos, voice recordings or transcripts in the QuickStroke research database.** With consent, the study collects limited derived measurements and technical quality indicators. **Browser speech recognition may use an external service.**

**Flow visual:**
- `Smartphone [Camera → local ML-derived features; IMU → local motion features]` → **Consent gate** → `Protected research store: bounded derived metrics only` (dotted optional arrow). Distinguish that Public visits do not use research upload.
- `Speech → Browser ASR (vendor may process remotely)` shown with a qualified dashed branch, *not inside an unqualified device-local box*.
- `Presenter Whisper` may be shown as **experimental local path** only after verified, visually distinguished from Public.
- This is a design principle, **not an anonymity guarantee**. Device/session metadata and consented derived metrics may still carry residual privacy risks.

## 30–45s visitor narration (editable student version)
> “Stroke warning signs involve the face, arm and speech. QuickStroke explores how one smartphone can guide observations of all three. For Face, an AI model tracks facial landmarks and we analyze mouth movement. For Arm, motion sensors measure how the phone rotates during the task. For Speech, the browser recognizes a prompted sentence and we check whether it was captured completely. We also measure whether the data are usable, and protect privacy by avoiding raw recordings in our research database. This is engineering research—not a test that can diagnose or rule out stroke.”

## Required input assets / owners / next handoff
| Priority | Asset | Owner | Acceptance |
|---|---|---|---|
| P0 | Authorized adult Face image with actual MediaPipe Mesh | Presenter & volunteer | Explicit publication permission; clear mouth tracking; no non-consenting person pictured |
| P0 | Correct left/right phone posture artwork | Poster/Engineering | Verify real instruction semantics; no hand swap |
| P0 | Genuine staged sensor drift trace (phone orientation vs time) | Engineering/Poster | Device/build, units/side, sensor freshness, no participant identifiers |
| P0 | Real current Speech prompt/transcript screenshot | Presenter | Current locale & runtime, no stored participant transcript |
| P0 | Real architecture + privacy arrow check | Poster, Engineering | Public vs consented Research vs experimental Presenter; no false local-only claim |
| P1 | Local Whisper implementation and offline test | Engineering | Compare actual footprint/start latency/memory/accuracy; do not block poster before verified |
| P1 | Exact metrics and subset QA for Scene 05 | Research/Poster | Defined denominators, build & missingness audit |

## Layout wireframe for Scene 03 alone
```text
┌─────────────────────────────────────────────────────────────────────┐
│ THREE TASKS. THREE MEASURABLE SIGNALS.                              │
│ From familiar warning signs to interpretable smartphone measures    │
├───────────────────────┬───────────────────────┬─────────────────────┤
│ FACE                  │ ARM                   │ SPEECH              │
│ AI · MediaPipe        │ IMU · Signal proc.    │ AI · Browser ASR    │
│                       │                       │                     │
│ [TRUE LIVE FACE MESH] │ [ARM/PHONE POSE]      │ [SPEECH PROMPT UI]  │
│ [MOUTH ZOOM]          │ [TRUE DRIFT-TIME]     │ [ASR STATE/TEXT]    │
│                       │                       │                     │
│ Asymmetry index       │ Max phone drift (°)   │ Phrase coverage     │
│ Tracking/visibility   │ Fresh sensor frames   │ ASR quality         │
│ Not stroke diagnosis  │ Not muscle strength   │ Not dysarthria dx   │
├───────────────────────┴───────────────────────┴─────────────────────┤
│ PRIVACY BY DESIGN — No raw media in QuickStroke research storage     │
│ Smartphone metrics —(consent only)→ research DB; ASR browser caveat │
└─────────────────────────────────────────────────────────────────────┘
```

**Do not publish the line drawing as finished science art**: all central visuals must be obtained, reviewed and matched to current build, then exported at the chosen printer's physical dimensions.

## Scientific caution and current status
This section demonstrates actual implemented measurement pipelines; it does **not** alone prove metric reliability, reference-angle agreement, medical construct validity, or diagnostic utility. That is why Scene 04 (methods) and Scene 05 (analysis) are essential. Pilot per-attempt data can support exploratory distributions only with QA, subset transparency, and build caution. Repeated samples are not independent volunteers. Early pilot version v1.0.21 dominates records, so avoid assuming later engine parity.

**Status as of 2026-10-19:** Detailed narrative/tech/UI annotations verified against repo and pilot data contract. **Not yet done**: fresh visually verified captured screenshots, authorized staged Face image, fresh controlled IMU trace, English/Japanese real transcript screenshot, poster panel final artwork or clinical/reference validation. Next task is controlled asset capture and editorial mockup approval. No production changes.
