# QuickStroke JSSF 2026 — Shared AI positioning for Poster and Oral
**Date:** 2026-10-18. **Decision:** AI is a real enabling technology and should be visible, **not the headline replacing the human stroke decision-support purpose**. Shared editorial guideline for Research/Poster (A), App/Presenter (B), and Oral Presentation (C).

## Core positioning
- Lead with **STROKE warning signs, uncertainty, timely human action, and accessible smartphone technology**.
- Identify QuickStroke clearly as an **AI-assisted research prototype**. A defensible project descriptor is:
  **“QuickStroke: An AI-Assisted Smartphone System for Observing Stroke Warning Signs.”**
  This describes research/observation, not a clinically validated diagnostic product.
- Secondary strapline: **“AI to support human awareness and decision-making—not to replace medical judgment.”**
- Do **not** imply QuickStroke is an AI stroke classifier or that each modality is AI-powered.

## Exactly where AI is used now
| Part | Current role | Honest label |
|---|---|---|
| Face | MediaPipe machine-learning-based facial landmark detection/tracking; engineered measurements of left/right movement, symmetry, and tracking quality | **AI-based landmark tracking + interpretable signal analysis** |
| Arm | Device motion/orientation sensors and deterministic calculations/quality gates; phone drift is a proxy for motion, not a direct strength measure | **Sensor signal processing (not a trained ML model)** |
| Speech | Browser's automatic speech recognition (ASR) converts spoken phrases to text; app uses phrase coverage/validity checks. ASR may be platform/service-dependent, not necessarily an offline embedded model | **AI speech recognition + rule-based phrase checking** |
| Multimodal decision | Current prototype combines interpretable rules and provisional cutoffs; no training on clinically labeled stroke patients | **Rule-based prototype; NOT clinical AI diagnosis** |
| Future | Clinically labeled patient/control studies to develop and independently validate thresholds and potentially ML/fusion models | **Future ML research**, not completed |

## Poster: visual treatment
1. Top quarter: **STROKE** prominent; small clear “AI-assisted smartphone research prototype” descriptor alongside QuickStroke brand.
2. Intro bridge: “We use AI-assisted visual tracking, smartphone motion sensors, and speech recognition to explore measurable Face–Arm–Speech tasks.”
3. Inside-technology scene: annotate Face with a small **AI / MediaPipe** tag, Speech with **AI / ASR** tag; Arm with **IMU / Signal processing**, not an AI icon. All three converge into **quality-checked interpretable observations**.
4. Results: emphasize real nonclinical measurement distributions, technical evaluability, and caveats. Never display model accuracy, sensitivity, specificity or a confusion matrix without labeled patient studies.
5. Future: clinician-labeled data → calibrated thresholds / optional ML → independent validation and research on decision impact.
6. The public demo must never prompt users to delay emergency care or assure them they do not have stroke.

## Oral: slide edit guidance for V3 (NOT a deck rebuild)
- Keep proven human-impact/pitch opening and narrative; add one short bridge “AI in the camera and speech recognition helps capture measurable signals, while phone sensors measure arm-related motion.”
- Technical breakdown slide “**Where is the AI—and where isn't it?**”: show Face / Arm / Speech, explicitly distinguish ML component from signal-processing and rule-based interpretation.
- One short explanation for students: “Our app already uses machine learning to track facial landmarks and speech recognition to convert speech to text. The arm module uses the phone's motion sensors. We have not yet trained an AI model to diagnose stroke. That requires carefully labeled clinical data and independent testing.”
- In questions, distinguish **technical measurement validity**, **clinical discrimination**, and **human decision impact**. Avoid saying “AI detects stroke” or “AI confirms a normal result”.
- Review older V3 phrasing (e.g., direct speech slurring/speech-rate evaluation) against current engine and research scope, rather than repeating stale product claims.

## Suggested oral Q&A
**Q:** “Is QuickStroke already an AI stroke detector?”
**A:** “No. We use AI-based facial tracking and browser speech recognition as components, while our current prototype evaluates derived signals with interpretable rules. We are testing technical feasibility with nonclinical volunteers. Patient data and independent clinical validation would be required to develop and assess a diagnostic model.”

**Q:** “Is the arm test AI?”
**A:** “Not today. We measure the phone's orientation and drift with motion sensors and signal-processing rules. Using a trained model for that is a possible research direction, not a completed feature.”

## Mandatory safety
“If stroke is suspected, call emergency services immediately. Do not delay for the app. A normal-looking app result cannot rule out stroke.”

## Coordination
This document is a **shared reference on the Poster/Research branch**. Separate ChatGPT conversations do not receive new messages automatically. The presenter/oral editor should reopen this file and incorporate its decisions into the V3-derived slides and speaker notes. No changes to public production code, research consent, database, or medical cutoffs.

## Privacy alignment (added 2026-10-18)
Read [`JSSF2026_PRIVACY_BY_DESIGN_SHARED_POSITIONING_20261018.md`](./JSSF2026_PRIVACY_BY_DESIGN_SHARED_POSITIONING_20261018.md). AI is not only a marketing point: it must fit a **privacy-first architecture**. Face ML landmark analysis and phone IMU processing minimize raw-media transmission to the project's research backend; consented study uploads are bounded derived metrics. Browser SpeechRecognition may run remotely even without project-server raw audio uploads; **do not** imply the whole AI pipeline is on-device until speech is verified or redesigned. Treat verified on-device ASR as a future engineering requirement; show vendor/browser risks transparently in Oral, Poster, and Demo.

## Speech AI split decided with demo team (2026-10-18)
Two booth routes, different priorities: separate **Presenter Technical Demo** will *experiment* with **Whisper loaded/cached ahead of time and computed locally** to demonstrate privacy-first AI; **Public Visitor App** retains browser/service-backed ASR for instant use without visitor model download. Not yet proof that Whisper works offline on the selected device or languages. Avoid promotional copy implying all QuickStroke users receive on-device speech AI. In Oral, a prospective sentence is: “We are evaluating a preloaded, locally running Whisper model for our technical demonstration, while keeping the public speech experience lightweight. The public browser recognizer may rely on an external service; neither mode sends raw audio to our research database.” Use present-tense only once the live local test succeeds.
